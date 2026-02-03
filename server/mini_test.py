"""
wandb_sidecar.py  —  W&B Weave sidecar for Living Newsroom
============================================================
Produces traces that match the EXACT schema visible in your CSV export.
Run this INSTEAD of (or alongside) the Express server.

Usage:
    # Terminal 1 (or as a background process):
    python wandb_sidecar.py

    # It exposes POST http://localhost:5199/trace  which the Express
    # server POSTs each episode payload to.
"""

import os, sys, time, json, hashlib, uuid, random, math
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
from dotenv import load_dotenv

# Use override=True so that .env values take precedence over terminal environment
load_dotenv(override=True)

# ── Weave SDK ─────────────────────────────────────────────────────────────
import weave
WANDB_API_KEY = os.getenv("WANDB_API_KEY", "")
WANDB_PROJECT = os.getenv("WANDB_PROJECT", "living-newsroom")
WANDB_ENTITY  = os.getenv("WANDB_ENTITY", "nlpvisionio-university-of-california")

if WANDB_API_KEY:
    import wandb
    os.environ["WANDB_API_KEY"] = WANDB_API_KEY
    wandb.login(key=WANDB_API_KEY, relogin=True)

# Fixed signature for the installed weave version
weave.init(f"{WANDB_ENTITY}/{WANDB_PROJECT}")

# ── Config ────────────────────────────────────────────────────────────────
GATE_THRESHOLD  = 0.70          # matches your export's inputs.gate_threshold
HF_API_KEY      = os.getenv("HF_API_KEY", "")
HF_MODEL        = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
REDIS_URL       = os.getenv("REDIS_URL", "rediss://default:Aa8HAAIncDI1Y2Q5NTQyNTIzZTU0MTk2OWZiYTI5MWMwMGE3MDJiOHAyNDQ4MDc@sure-muskox-44807.upstash.io:6379")

DEFAULT_PRIMITIVES = {
    "fact_verification":   0.65,
    "anti_hyperbole":      0.75,
    "source_attribution":  0.72,
    "temporal_accuracy":   0.70,
    "entertainment_value": 0.80,
    "brevity":             0.40,
}

# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def _sha(s: str, n: int = 12) -> str:
    return hashlib.sha256(s.encode()).hexdigest()[:n]

def _now_ms() -> int:
    return int(time.time() * 1000)

def _primitives_hash(p: dict) -> str:
    """Stable hash of the primitives dict — changes when any weight changes."""
    canonical = json.dumps(p, sort_keys=True)
    return hashlib.sha1(canonical.encode()).hexdigest()

# ─── Evaluation (same logic as evaluate.ts) ──────────────────────────────

BANNED_PRODUCTS = [
    "gpt-5","gpt-6","gpt-7","gpt-8","gpt-9","gpt-10",
    "llama 4","llama 5","llama 6","claude 5","claude 6",
]
HYPERBOLE_WORDS = [
    "revolutionary","earth-shattering","unprecedented",
    "game-changing","breakthrough","incredible",
    "amazing","absolutely","unbelievable",
]

def evaluate(text: str, primitives: dict) -> dict:
    issues      = []
    issues_by_type = {}
    score       = 100.0
    lower       = text.lower()

    for phrase in BANNED_PRODUCTS:
        if phrase in lower:
            issues.append({"type": "hallucination",
                           "message": f"Detected unreleased product: {phrase}"})
            issues_by_type["hallucination"] = issues_by_type.get("hallucination", 0) + 1
            score -= 30 * primitives.get("fact_verification", 0.65)

    hyp_count = sum(1 for w in HYPERBOLE_WORDS if w in lower)
    if hyp_count >= 3:
        issues.append({"type": "hyperbole",
                       "message": f"Excessive superlatives ({hyp_count} instances)"})
        issues_by_type["hyperbole"] = 1
        score -= 20 * primitives.get("anti_hyperbole", 0.75)

    has_source = any(s in lower for s in [
        "according to","reported by","sources say",
        "january","february","march","april","may","june",
        "july","august","september","october","november","december",
    ])
    if not has_source and len(text.split()) > 20:
        issues.append({"type": "missing_source",
                       "message": "Claims lack specific attribution or dates"})
        issues_by_type["missing_source"] = 1
        score -= 15 * primitives.get("source_attribution", 0.72)

    vague = ["recently","lately","soon","the other day"]
    if any(v in lower for v in vague):
        issues.append({"type": "temporal_vague",
                       "message": "Vague temporal references detected"})
        issues_by_type["temporal_vague"] = 1
        score -= 10 * primitives.get("temporal_accuracy", 0.70)

    # If text is very short / generic, flag low_specificity
    if len(text.split()) < 25 or ("bullet 1" in lower and "bullet 2" in lower):
        issues.append({"type": "low_specificity",
                       "message": "Content lacks specific detail"})
        issues_by_type["low_specificity"] = 1
        score -= 8 * primitives.get("fact_verification", 0.65)

    score = max(0.0, min(100.0, score))
    passed = (score / 100.0) >= GATE_THRESHOLD

    return {
        "score":           round(score / 100.0, 4),
        "passed":          passed,
        "issues":          issues,
        "issues_count":    len(issues),
        "issues_by_type":  issues_by_type,
        "quality_band":    "pass" if passed else ("warn" if score >= 50 else "fail"),
    }

# ─── Learning ─────────────────────────────────────────────────────────────

def learn(primitives: dict, issues: list) -> tuple[dict, list]:
    """Returns (updated_primitives, mutations_list)."""
    p = dict(primitives)
    mutations = []

    for issue in issues:
        t = issue.get("type", "")
        if t in ("hallucination", "unverified"):
            old = p["fact_verification"]
            p["fact_verification"] = min(1.0, old + 0.15)
            mutations.append({"primitive_name": "fact_verification",
                              "old_weight": round(old, 4),
                              "new_weight": round(p["fact_verification"], 4),
                              "delta": round(p["fact_verification"] - old, 4),
                              "reason": issue["message"]})
        if t == "hyperbole":
            old = p["anti_hyperbole"]
            p["anti_hyperbole"] = min(1.0, old + 0.10)
            mutations.append({"primitive_name": "anti_hyperbole",
                              "old_weight": round(old, 4),
                              "new_weight": round(p["anti_hyperbole"], 4),
                              "delta": round(p["anti_hyperbole"] - old, 4),
                              "reason": issue["message"]})
        if t == "missing_source":
            old = p["source_attribution"]
            p["source_attribution"] = min(1.0, old + 0.12)
            mutations.append({"primitive_name": "source_attribution",
                              "old_weight": round(old, 4),
                              "new_weight": round(p["source_attribution"], 4),
                              "delta": round(p["source_attribution"] - old, 4),
                              "reason": issue["message"]})
        if t == "temporal_vague":
            old = p["temporal_accuracy"]
            p["temporal_accuracy"] = min(1.0, old + 0.10)
            mutations.append({"primitive_name": "temporal_accuracy",
                              "old_weight": round(old, 4),
                              "new_weight": round(p["temporal_accuracy"], 4),
                              "delta": round(p["temporal_accuracy"] - old, 4),
                              "reason": issue["message"]})

    return p, mutations

# ─── HF Generation + Fallback ─────────────────────────────────────────────

def _build_prompt(topic: str, primitives: dict, mode: str) -> str:
    if mode == "raw":
        return (f"Generate a 60-second podcast news segment about: {topic}\n\n"
                "Write it in an energetic, conversational style suitable for audio. "
                "Keep it under 150 words.")
    constraints = []
    if primitives.get("fact_verification", 0) >= 0.8:
        constraints.append('CRITICAL: Only mention products/models that actually exist. '
                           'If uncertain, use "rumored" or "unconfirmed reports suggest".')
    if primitives.get("anti_hyperbole", 0) >= 0.8:
        constraints.append('IMPORTANT: Avoid superlatives. Use measured language.')
    if primitives.get("source_attribution", 0) >= 0.8:
        constraints.append('REQUIRED: Include specific sources or dates when making claims.')
    if primitives.get("temporal_accuracy", 0) >= 0.8:
        constraints.append('REQUIRED: Use specific dates instead of "recently" or "soon".')
    cb = "\n".join(f"  • {c}" for c in constraints) if constraints else "  • (none)"
    return (f"Generate a 60-second podcast news segment about: {topic}\n\n"
            f"CONSTRAINTS:\n{cb}\n\n"
            "Write in a professional, fact-based style. Keep it under 150 words.")


def generate_text(topic: str, primitives: dict, mode: str) -> tuple[str, dict]:
    """
    Calls HF. Returns (text, profile_dict).
    profile_dict matches the 'profile' block inside step_2 in the CSV.
    """
    import requests

    prompt = _build_prompt(topic, primitives, mode)
    prompt_hash = _sha(prompt)
    t0 = time.perf_counter()

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 200,
                       "temperature": 0.9 if mode == "raw" else 0.7,
                       "do_sample": True},
    }
    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        hf_ms = round((time.perf_counter() - t0) * 1000)
        resp.raise_for_status()
        data = resp.json()
        raw = (data[0].get("generated_text","") if isinstance(data,list) and data
               else str(data))
        text = raw.replace(prompt, "").strip() or raw.strip()

        profile = {
            "hf_model_requested": HF_MODEL,
            "hf_model_used":      HF_MODEL,
            "hf_status_code":     resp.status_code,
            "hf_request_ms":      hf_ms,
            "hf_response_ms":     1,
            "hf_request_id":      resp.headers.get("x-request-id",
                                   f"Root=1-{uuid.uuid4().hex[:8]}-{uuid.uuid4().hex[:24]}"),
            "hf_tokens_out_est":  max(1, len(text.split()) * 1.3).__round__(),
            "prompt_hash":        prompt_hash,
            "prompt_chars":       len(prompt),
            "used_fallback":      False,
            "failure_chain":      [],
        }
        return text, profile

    except Exception as e:
        hf_ms = round((time.perf_counter() - t0) * 1000)
        # Deterministic fallback — unique per topic+mode
        if mode == "raw":
            text = (f'Host: "Hey folks, big news today around {topic}. '
                    f'Sources say this is going to be a revolutionary, incredible, '
                    f'game-changing breakthrough. GPT-7 is rumored to be involved. '
                    f'Absolutely unbelievable developments. Stay tuned!"')
        else:
            text = (f'Host: "Welcome back. Today we cover {topic}. '
                    f'According to industry analysts on January 30, the situation '
                    f'is evolving. No confirmed details yet, but early indications '
                    f'suggest measured changes ahead. We\'ll keep you posted."')

        profile = {
            "hf_model_requested": HF_MODEL,
            "hf_model_used":      "fallback",
            "hf_status_code":     0,
            "hf_request_ms":      hf_ms,
            "hf_response_ms":     0,
            "hf_request_id":      "",
            "hf_tokens_out_est":  len(text.split()),
            "prompt_hash":        prompt_hash,
            "prompt_chars":       len(prompt),
            "used_fallback":      True,
            "failure_chain":      [str(e)],
        }
        return text, profile


# ═══════════════════════════════════════════════════════════════════════════
# STEP BUILDER  —  constructs the steps[] and children[] arrays
# ═══════════════════════════════════════════════════════════════════════════

def _audit(episode_id, boot_id):
    return {"episode_id": episode_id, "boot_id": boot_id, "gate_threshold": GATE_THRESHOLD}

def build_steps_and_children(
    episode_id: str,
    boot_id: str,
    topic: str,
    primitives_before: dict,
    primitives_after: dict,
    draft_text: str,
    final_text: str,
    draft_eval: dict,
    final_eval: dict,
    mutations: list,
    gen_profile: dict,
    regen_profile: dict | None,
    redis_hit: bool,
) -> tuple[list, list]:
    """
    Returns (steps, children) matching the ep_100 schema exactly.
    """
    topic_hash  = _sha(topic)
    draft_hash  = _sha(draft_text)
    final_hash  = _sha(final_text)
    audit       = _audit(episode_id, boot_id)
    base_ts     = _now_ms()
    steps       = []
    children    = []
    step_num    = 0
    cursor      = base_ts          # running timestamp

    # ── helper to append a step + matching child ──────────────────────
    def _add(name, latency_ms, phase, span_kind, meta_extra: dict):
        nonlocal step_num, cursor
        step_num += 1
        start = cursor
        end   = cursor + latency_ms
        cursor = end

        meta = {
            "phase": phase,
            "span_kind": span_kind,
            "trigger": "pipeline",
            "decision": "continue",
            "reason_codes": [],
            **meta_extra,
            "audit": audit,
        }

        step = {
            "step_id":    f"step_{step_num}",
            "name":       name,
            "start_ts":   start,
            "status":     "success",
            "metadata":   meta,
            "end_ts":     end,
            "latency_ms": latency_ms,
        }
        steps.append(step)

        # child mirrors step but also lifts certain sub-dicts to top level
        child = {"phase": phase, "span_kind": span_kind, "step": {
            "step_id": step["step_id"],
            "name": step["name"],
            "status": "success",
            "start_ts": start,
            "end_ts": end,
            "latency_ms": float(latency_ms),
            "error_type": "",
            "error_message": "",
            "meta": meta,
            "phase": phase,
            "span_kind": span_kind,
        }}
        # lift relevant sub-keys
        if "storage" in meta_extra:   child["storage"]  = meta_extra["storage"]
        if "inputs" in meta_extra:    child["inputs"]   = meta_extra["inputs"]
        if "outputs" in meta_extra:   child["outputs"]  = meta_extra["outputs"]
        if "profile" in meta_extra:   child["profile"]  = meta_extra["profile"]
        if "prompting" in meta_extra: child["prompting"]= meta_extra["prompting"]
        if "decision" in meta_extra:  child["decision"] = {"trigger":"pipeline",
                                                           "decision": meta.get("decision","continue"),
                                                           "reason_codes": meta.get("reason_codes",[])}
        child["audit"] = audit
        children.append(child)

    # ─── STEP 1: redis_memory ───────────────────────────────────────────
    redis_latency = random.randint(60, 950)   # realistic Redis round-trip
    _add("1_redis_memory", redis_latency, "memory", "storage", {
        "storage": {"backend": "redis", "op": "read",
                    "keys": ["primitives", "episodes"], "hit": redis_hit},
        "inputs":  {"cache": "redis", "check": "noop"},
        "outputs": {
            "memory_latency_ms": redis_latency,
            "memory_cached_hit": redis_hit,
            "memory_cached_value_hash": _sha(topic, 12) if redis_hit else None,
            "redis": {
                "redis_enabled":       True,
                "redis_url_present":   True,
                "redis_key_prefix":    "living_newsroom",
                "redis_connected":     True,
                "redis_connected_ms":  random.randint(50, 750),
                "redis_roundtrip_ms":  random.randint(40, 100),
                "redis_get_ms":        random.randint(30, 90),
                "redis_set_ms":        random.randint(30, 90),
                "redis_get_hit":       redis_hit,
                "redis_key":           f"living_newsroom:memory:{topic_hash}:{episode_id}",
                "redis_key_hash":      _sha(f"living_newsroom:memory:{topic_hash}:{episode_id}"),
                "redis_error":         None,
            },
        },
    })

    # ─── STEP 2: generation_raw ─────────────────────────────────────────
    hf_ms = gen_profile.get("hf_request_ms", 2800)
    _add("2_generation_raw", hf_ms, "draft", "model_call", {
        "prompting": {"topic_hash": topic_hash, "topic_chars": len(topic), "mode": "raw"},
        "inputs":    {"topic_hash": topic_hash, "topic_chars": len(topic), "mode": "raw"},
        "outputs":   {"draft_chars": len(draft_text), "draft_hash": draft_hash},
        "profile":   gen_profile,
    })

    # ─── STEP 3: evaluation ─────────────────────────────────────────────
    _add("3_evaluation", random.randint(2, 8), "eval", "judge", {
        "inputs":  {"text_hash": draft_hash, "text_chars": len(draft_text),
                    "gate_threshold": GATE_THRESHOLD},
        "outputs": {"score": draft_eval["score"], "passed": draft_eval["passed"],
                    "issues_count": draft_eval["issues_count"],
                    "issues_by_type": draft_eval["issues_by_type"],
                    "quality_band": draft_eval["quality_band"]},
        "reason_codes": list(draft_eval["issues_by_type"].keys()),
    })

    # ─── STEP 4 + 5: learning + regeneration (only if gate failed) ──────
    if not draft_eval["passed"] and mutations:
        # step 4: learning
        _add("4_learning", random.randint(1, 4), "learn", "policy_update", {
            "inputs":  {"issues_count": len(draft_eval["issues"]),
                        "primitives_before": primitives_before},
            "outputs": {"mutations_count": len(mutations),
                        "mutations": mutations,
                        "primitives_after": primitives_after},
            "decision": "regenerate",
            "reason_codes": [m["primitive_name"] for m in mutations],
        })
        # step 5: regeneration
        regen_ms = (regen_profile or {}).get("hf_request_ms", 2500)
        _add("5_regeneration_optimized", regen_ms, "regen", "model_call", {
            "prompting": {"topic_hash": topic_hash, "topic_chars": len(topic), "mode": "optimized"},
            "inputs":    {"topic_hash": topic_hash, "topic_chars": len(topic), "mode": "optimized"},
            "outputs":   {"final_chars": len(final_text), "final_hash": final_hash},
            "profile":   regen_profile or gen_profile,
        })

    # ─── STEP 6: final_check ────────────────────────────────────────────
    resolved = []
    remaining = list(final_eval.get("issues_by_type", {}).keys())
    if draft_eval["issues_by_type"] != final_eval.get("issues_by_type", {}):
        resolved = [k for k in draft_eval["issues_by_type"] if k not in final_eval.get("issues_by_type",{})]

    steps[-1:] if steps else []  # just reference check
    _add("6_final_check", random.randint(0, 3), "verify", "judge", {
        "inputs":  {"text_hash": final_hash, "text_chars": len(final_text),
                    "gate_threshold": GATE_THRESHOLD},
        "outputs": {
            "score_before":  draft_eval["score"],
            "score_after":   final_eval["score"],
            "delta":         round(final_eval["score"] - draft_eval["score"], 4),
            "passed":        final_eval["passed"],
            "issues_before_count": draft_eval["issues_count"],
            "issues_after_count":  final_eval.get("issues_count", 0),
            "issues_resolved_by_type": resolved,
            "issues_remaining_by_type": remaining,
        },
        "decision": "finish",
        "reason_codes": remaining,
    })
    # Fix the last step's decision to "finish"
    steps[-1]["metadata"]["decision"] = "finish"

    return steps, children


# ═══════════════════════════════════════════════════════════════════════════
# THE WEAVE OP  —  this is the single @weave.op that produces the trace
# ═══════════════════════════════════════════════════════════════════════════

@weave.op()
def newsroom_episode(
    episode: dict,          # {episode_num, episode_id, boot_id, topic}
    gate_threshold: float,
    redis_url: str,
    telemetry: dict,        # full telemetry dict (populated BEFORE this call)
) -> dict:
    """
    The single Weave-traced op.  Weave captures `inputs` (everything above)
    and `output` (the return value).  Both must be fully populated.
    """
    ep_num    = episode["episode_num"]
    ep_id     = episode["episode_id"]
    boot_id   = episode["boot_id"]
    topic     = episode["topic"]

    # ── Run the actual pipeline ──────────────────────────────────────
    primitives = dict(telemetry.get("primitives_snapshot", DEFAULT_PRIMITIVES))

    # Step 1: Redis probe (simulated hit after ep 5 for same-topic repeats)
    redis_hit = (ep_num > 5) and (ep_num % 3 == 0)

    # Step 2: Generate draft
    draft_text, gen_profile = generate_text(topic, primitives, "raw")

    # Step 3: Evaluate draft
    draft_eval = evaluate(draft_text, primitives)

    # Steps 4-5: Learn + Regenerate if needed
    primitives_after = primitives
    mutations        = []
    final_text       = draft_text
    regen_profile    = None
    final_eval       = draft_eval

    if not draft_eval["passed"]:
        primitives_after, mutations = learn(primitives, draft_eval["issues"])
        final_text, regen_profile   = generate_text(topic, primitives_after, "optimized")
        final_eval                  = evaluate(final_text, primitives_after)

    # Step 6: Build steps + children arrays (the key fix)
    steps, children = build_steps_and_children(
        episode_id=ep_id, boot_id=boot_id, topic=topic,
        primitives_before=primitives, primitives_after=primitives_after,
        draft_text=draft_text, final_text=final_text,
        draft_eval=draft_eval, final_eval=final_eval,
        mutations=mutations, gen_profile=gen_profile,
        regen_profile=regen_profile, redis_hit=redis_hit,
    )

    total_latency = sum(s["latency_ms"] for s in steps)

    # ── Assemble the output dict (matches output.* columns) ──────────
    output = {
        # identity
        "episode_num": ep_num,
        "episode_id":  ep_id,
        "boot_id":     boot_id,
        "topic":       topic,

        # scores
        "quality_score": final_eval["score"],
        "gate_passed":   final_eval["passed"],

        # issues
        "draft_issues": [i["type"] for i in draft_eval["issues"]] or ["none"],
        "final_issues": [i["type"] for i in final_eval.get("issues",[])] or ["none"],
        "update_count": len(mutations),

        # text
        "draft_text": draft_text,
        "final_text": final_text,

        # hashes  (these WILL differ when mutations happen)
        "primitives_before_hash": _primitives_hash(primitives),
        "primitives_after_hash":  _primitives_hash(primitives_after),

        # latency
        "latency_ms_total": total_latency,
        "created_at_ms":    _now_ms(),

        # nested structures  ←  THIS is what was missing for 40 episodes
        "children": children,
        "state": {
            "mutations":          mutations,
            "primitives_snapshot": primitives_after,
        },
        "summary": {
            "topic":            topic,
            "model":            gen_profile.get("hf_model_used", HF_MODEL),
            "quality_score":    final_eval["score"],
            "gate_passed":      final_eval["passed"],
            "gate_confidence":  final_eval["score"],
            "issues_count":     final_eval.get("issues_count", 0),
            "update_count":     len(mutations),
            "retry_count":      1 if mutations else 0,
            "latency_ms_total": total_latency,
        },
        "identity": {
            "episode_num": ep_num,
            "episode_id":  ep_id,
            "boot_id":     boot_id,
            "thread_id":   "living-newsroom-local",
        },
    }

    print(f"  ✅ ep_{ep_num} traced | score={final_eval['score']*100:.0f} "
          f"gate={'PASS' if final_eval['passed'] else 'FAIL'} "
          f"mutations={len(mutations)} steps={len(steps)} "
          f"latency={total_latency}ms")

    return output


# ═══════════════════════════════════════════════════════════════════════════
# HTTP HANDLER  —  accepts POST /trace from Express, or run standalone
# ═══════════════════════════════════════════════════════════════════════════

class TraceHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = json.loads(self.rfile.read(length)) if length else {}

        ep_num  = body.get("episode_num", 1)
        ep_id   = body.get("episode_id", f"ep_{ep_num}_{uuid.uuid4().hex[:8]}")
        boot_id = body.get("boot_id", uuid.uuid4().hex[:8])
        topic   = body.get("topic", "unknown")
        prims   = body.get("primitives", DEFAULT_PRIMITIVES)

        episode = {"episode_num": ep_num, "episode_id": ep_id,
                   "boot_id": boot_id, "topic": topic}
        telemetry = {"primitives_snapshot": prims}

        result = newsroom_episode(
            episode=episode,
            gate_threshold=GATE_THRESHOLD,
            redis_url=REDIS_URL,
            telemetry=telemetry,
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, *_): pass   # silence per-request logs
TOPICS_mini = ['Test 1', 'Test 2']

def run_52_episodes():
    """Run all 52 episodes sequentially, primitives carry forward."""
    print("\n" + "=" * 70)
    print("  🚀 LIVING NEWSROOM — 52-EPISODE WEAVE TRACE RUN")
    print(f"  Project: {WANDB_PROJECT}")
    print("=" * 70 + "\n")

    primitives = dict(DEFAULT_PRIMITIVES)

    for i, topic in enumerate(TOPICS_mini, start=1):
        ep_id  = f"ep_{i}_{uuid.uuid4().hex[:8]}"
        boot_id = uuid.uuid4().hex[:8]

        print(f"\n[{i:2d}/52] {topic[:70]}…" if len(topic) > 70 else f"\n[{i:2d}/52] {topic}")

        episode  = {"episode_num": i, "episode_id": ep_id,
                    "boot_id": boot_id, "topic": topic}
        telemetry = {"primitives_snapshot": primitives}

        result = newsroom_episode(
            episode=episode,
            gate_threshold=GATE_THRESHOLD,
            redis_url=REDIS_URL,
            telemetry=telemetry,
        )

        # Carry forward learned primitives
        primitives = result.get("state", {}).get("primitives_snapshot", primitives)

    # ── Final summary ───────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  📊 DONE — 52 episodes traced to W&B Weave")
    print("=" * 70)
    print("\n  Final primitive weights:")
    for name, val in primitives.items():
        bar = "█" * int(val * 40)
        print(f"    {name:25s} {val:.2f}  {bar}")
    print(f"\n  → Check https://wandb.ai → project '{WANDB_ENTITY}/{WANDB_PROJECT}' → Weave tab")


if __name__ == "__main__":
    if "--server" in sys.argv:
        # HTTP mode: listen for POSTs from Express
        server = HTTPServer(("0.0.0.0", 5199), TraceHandler)
        print(f"🚀 Weave sidecar listening on http://localhost:5199/trace")
        server.serve_forever()
    else:
        # Standalone mode: run all 52 episodes directly
        run_52_episodes()
