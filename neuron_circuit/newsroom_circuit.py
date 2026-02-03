"""
Living Newsroom — Neuron Circuit
=================================
Matches the architecture in the screenshot:

    Topic In  →  Mistral-7B  →  Evaluate  →  Gate  →  Learn
     (Ingest)   (Generate)   (Check quality) (Pass/Fail) (Update primitives)

Plus the Neuron orchestrator layer at the bottom that handles:
    Plan episode · Route models · Retry logic · Tool calls · Persist state

Install
-------
    git clone https://github.com/ShaliniAnandaPhD/Neuron.git
    cd Neuron && pip install -e .
    cd ..
    pip install requests python-dotenv

Run
---
    python newsroom_circuit.py
"""

import os, time, json, hashlib, uuid
from dotenv import load_dotenv

# ── Neuron imports (from the cloned repo) ────────────────────────────────
from neuron import initialize, create_agent, CircuitDefinition, Message
from neuron.agents import ReflexAgent, DeliberativeAgent, LearningAgent, CoordinatorAgent
from neuron.microservices import BaseAgent

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════
# 0.  CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

HF_API_KEY   = os.getenv("HF_API_KEY", "")
HF_MODEL     = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
GATE_THRESHOLD = 0.72

# 6 behavioral primitives — the only thing that changes at runtime
DEFAULT_PRIMITIVES = {
    "fact_verification":   0.65,
    "anti_hyperbole":      0.75,
    "source_attribution":  0.72,
    "temporal_accuracy":   0.70,
    "entertainment_value": 0.80,
    "brevity":             0.40,
}

# ═══════════════════════════════════════════════════════════════════════════
# 1.  CUSTOM NEURON AGENTS  (plug-and-play microservices)
# ═══════════════════════════════════════════════════════════════════════════


class MemoryProbeAgent(BaseAgent):
    """
    STEP 0 — Redis-style memory probe.
    Checks whether we have seen this topic before.  In production this
    hits Redis; here we use an in-process dict so the demo is self-contained.
    """

    _store: dict = {}   # shared across instances for this session

    def __init__(self):
        super().__init__(name="memory_probe")

    async def process(self, input_data: dict) -> dict:
        topic       = input_data.get("topic", "")
        episode_id  = input_data.get("episode_id", "")
        key         = hashlib.sha256(topic.encode()).hexdigest()[:16]
        t0          = time.perf_counter()

        hit   = key in self._store
        value = self._store.get(key)

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Write current episode so next run sees it
        self._store[key] = {
            "episode_id": episode_id,
            "topic_hash": key,
            "written_at": time.time(),
        }

        return {
            "redis_enabled":    True,
            "redis_connected":  True,
            "redis_connect_ms": 0.8,          # simulated latency
            "redis_get_ms":     elapsed_ms,
            "redis_get_hit":    hit,
            "redis_key":        f"living_newsroom:memory:{key}:v1",
            "redis_key_hash":   key,
            "cached_payload":   value,
            "redis_error":      None,
        }


class GenerationAgent(BaseAgent):
    """
    STEP 1 — Calls HuggingFace (Llama-3.2-3B-Instruct) to produce a
    podcast script.  Accepts a 'mode' flag: 'raw' or 'optimized'.
    """

    def __init__(self):
        super().__init__(name="generation")

    async def process(self, input_data: dict) -> dict:
        import requests

        topic      = input_data["topic"]
        primitives = input_data.get("primitives", DEFAULT_PRIMITIVES)
        mode       = input_data.get("mode", "raw")

        prompt = _build_prompt(topic, primitives, mode)

        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 200,
                "temperature":   0.9 if mode == "raw" else 0.7,
                "do_sample":     True,
            },
        }

        url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            # HF returns a list of dicts with "generated_text"
            if isinstance(data, list) and data:
                raw_text = data[0].get("generated_text", "")
            else:
                raw_text = str(data)

            # Strip the echoed prompt back out
            text = raw_text.replace(prompt, "").strip()
            if not text:
                text = raw_text.strip()

            return {"text": text, "model": HF_MODEL, "mode": mode}

        except Exception as e:
            # Fallback: deterministic stub so the pipeline never hard-crashes
            return {
                "text": _emergency_fallback(topic, mode),
                "model": "fallback",
                "mode":  mode,
                "error": str(e),
            }


class EvaluationAgent(BaseAgent):
    """
    STEP 2 — Pattern-based quality gate.
    Detects hallucinations, hyperbole, missing sources, vague temporal refs.
    Returns score ∈ [0, 1] and a list of issues.
    """

    def __init__(self):
        super().__init__(name="evaluation")

    async def process(self, input_data: dict) -> dict:
        text       = input_data.get("text", "")
        primitives = input_data.get("primitives", DEFAULT_PRIMITIVES)
        return evaluate(text, primitives)


class LearningCircuitAgent(BaseAgent):
    """
    STEP 4 — Updates the 6 behavioral primitives based on detected issues.
    This is the core self-optimization loop.
    """

    def __init__(self):
        super().__init__(name="learning")

    async def process(self, input_data: dict) -> dict:
        primitives = dict(input_data.get("primitives", DEFAULT_PRIMITIVES))
        issues     = input_data.get("issues", [])

        mutations = []
        for issue in issues:
            t = issue.get("type", "")
            if t in ("hallucination", "unverified"):
                old = primitives["fact_verification"]
                primitives["fact_verification"] = min(1.0, old + 0.15)
                mutations.append(_mutation("fact_verification", old, primitives["fact_verification"], issue))
            if t == "hyperbole":
                old = primitives["anti_hyperbole"]
                primitives["anti_hyperbole"] = min(1.0, old + 0.10)
                mutations.append(_mutation("anti_hyperbole", old, primitives["anti_hyperbole"], issue))
            if t == "missing_source":
                old = primitives["source_attribution"]
                primitives["source_attribution"] = min(1.0, old + 0.12)
                mutations.append(_mutation("source_attribution", old, primitives["source_attribution"], issue))
            if t == "temporal_vague":
                old = primitives["temporal_accuracy"]
                primitives["temporal_accuracy"] = min(1.0, old + 0.10)
                mutations.append(_mutation("temporal_accuracy", old, primitives["temporal_accuracy"], issue))

        return {"primitives": primitives, "mutations": mutations}


# ═══════════════════════════════════════════════════════════════════════════
# 2.  PURE-FUNCTION HELPERS  (evaluation logic, prompt builder, fallback)
# ═══════════════════════════════════════════════════════════════════════════


def evaluate(text: str, primitives: dict) -> dict:
    """Pattern-based evaluator — no LLM call needed."""
    issues = []
    score  = 100.0
    lower  = text.lower()

    # ── hallucination check ───────────────────────────────────────────
    banned = [
        "gpt-5","gpt-6","gpt-7","gpt-8","gpt-9","gpt-10",
        "llama 4","llama 5","llama 6",
        "claude 5","claude 6",
    ]
    for phrase in banned:
        if phrase in lower:
            issues.append({"type": "hallucination",
                           "message": f"Detected unreleased product: {phrase}",
                           "severity": "high"})
            score -= 30 * primitives.get("fact_verification", 0.65)

    # ── hyperbole check ───────────────────────────────────────────────
    hyp_words = [
        "revolutionary","earth-shattering","unprecedented",
        "game-changing","breakthrough","incredible",
        "amazing","absolutely","unbelievable",
    ]
    hyp_count = sum(1 for w in hyp_words if w in lower)
    if hyp_count >= 3:
        issues.append({"type": "hyperbole",
                       "message": f"Excessive superlatives ({hyp_count} instances)",
                       "severity": "medium"})
        score -= 20 * primitives.get("anti_hyperbole", 0.75)

    # ── source attribution ────────────────────────────────────────────
    has_source = (
        "according to" in lower or
        "reported by"  in lower or
        "sources say"  in lower or
        any(m in lower for m in [
            "january","february","march","april","may","june",
            "july","august","september","october","november","december"
        ])
    )
    if not has_source and len(text.split()) > 20:
        issues.append({"type": "missing_source",
                       "message": "Claims lack specific attribution",
                       "severity": "medium"})
        score -= 15 * primitives.get("source_attribution", 0.72)

    # ── temporal vagueness ────────────────────────────────────────────
    vague_temps = ["recently", "lately", "soon", "the other day"]
    if any(v in lower for v in vague_temps):
        issues.append({"type": "temporal_vague",
                       "message": "Vague temporal references detected",
                       "severity": "low"})
        score -= 10 * primitives.get("temporal_accuracy", 0.70)

    score = max(0.0, min(100.0, score))
    return {
        "score":  round(score / 100, 4),
        "issues": issues,
        "passed": score >= (GATE_THRESHOLD * 100),
    }


def _build_prompt(topic: str, primitives: dict, mode: str) -> str:
    if mode == "raw":
        return (
            f"Generate a 60-second podcast news segment about: {topic}\n\n"
            "Write it in an energetic, conversational style suitable for audio. "
            "Keep it under 150 words."
        )

    # optimized mode — inject constraints for high-weight primitives
    constraints = []
    if primitives.get("fact_verification", 0) >= 0.8:
        constraints.append(
            'CRITICAL: Only mention products/models that actually exist. '
            'If uncertain, use "rumored" or "unconfirmed reports suggest".'
        )
    if primitives.get("anti_hyperbole", 0) >= 0.8:
        constraints.append(
            'IMPORTANT: Avoid superlatives like "revolutionary", '
            '"unprecedented", "earth-shattering". Use measured language.'
        )
    if primitives.get("source_attribution", 0) >= 0.8:
        constraints.append(
            'REQUIRED: Include specific sources (e.g. "According to Bloomberg '
            'on Jan 15") or dates when making claims.'
        )
    if primitives.get("temporal_accuracy", 0) >= 0.8:
        constraints.append(
            'REQUIRED: Use specific dates instead of vague terms like '
            '"recently" or "soon".'
        )

    constraint_block = "\n".join(f"  • {c}" for c in constraints) if constraints else "  • (none)"

    return (
        f"Generate a 60-second podcast news segment about: {topic}\n\n"
        f"CONSTRAINTS:\n{constraint_block}\n\n"
        "Write in a professional, fact-based style. Keep it under 150 words."
    )


def _emergency_fallback(topic: str, mode: str) -> str:
    """Deterministic fallback when HF is unreachable."""
    if mode == "raw":
        return (
            f"Breaking news tonight — big developments in the {topic} space. "
            "Sources say this could be a game-changing, revolutionary, incredible "
            "breakthrough that's absolutely unprecedented. GPT-7 is reportedly "
            "involved. Stay tuned for more on this amazing story."
        )
    return (
        f"In today's top story, we're looking at developments around {topic}. "
        f"According to industry analysts on January 30, the landscape is shifting. "
        "No confirmed details yet, but early indications suggest measured changes "
        "ahead. We'll keep you updated as this story develops."
    )


def _mutation(name: str, old: float, new: float, issue: dict) -> dict:
    return {
        "primitive_name": name,
        "old_weight":     round(old, 4),
        "new_weight":     round(new, 4),
        "delta":          round(new - old, 4),
        "reason":         issue.get("message", ""),
    }


# ═══════════════════════════════════════════════════════════════════════════
# 3.  NEURON CIRCUIT DEFINITION  — wires everything together
# ═══════════════════════════════════════════════════════════════════════════


def build_newsroom_circuit(core) -> str:
    """
    Defines the 5-step circuit visible in the screenshot plus the
    Neuron orchestrator capabilities shown at the bottom.
    """
    circuit_def = CircuitDefinition.create(
        name="LivingNewsroomCircuit",
        description=(
            "Self-optimizing podcast agent. Generates news scripts, "
            "evaluates quality, learns from failures by updating 6 "
            "behavioral primitives at runtime."
        ),
        routing_strategy="confidence_based",
        fallback_strategy="graceful_degradation",
        agents={
            # ── INPUT layer ──────────────────────────────────────────
            "topic_in": {
                "type": "ReflexAgent",
                "role": "INPUT",
                "capabilities": [
                    "intent_detection",       # what kind of topic?
                    "sentiment_analysis",     # tone of the input
                    "memory_retrieval",       # have we seen this before?
                ],
            },
            # ── PROCESSOR layer ──────────────────────────────────────
            "generate": {
                "type": "DeliberativeAgent",
                "role": "PROCESSOR",
                "capabilities": [
                    "text_generation",
                    "prompt_construction",
                    "model_routing",          # raw vs optimized prompt
                ],
                "activation_threshold": 0.3,
            },
            "evaluate": {
                "type": "ReflexAgent",
                "role": "PROCESSOR",
                "capabilities": [
                    "hallucination_detection",
                    "contradiction_detection",
                    "quality_scoring",
                ],
                "activation_threshold": 0.5,
            },
            "gate": {
                "type": "ReflexAgent",
                "role": "PROCESSOR",
                "capabilities": [
                    "threshold_comparison",
                    "pass_fail_routing",
                ],
                "activation_threshold": 0.8,
            },
            # ── LEARNING layer ───────────────────────────────────────
            "learn": {
                "type": "LearningAgent",
                "role": "OUTPUT",
                "capabilities": [
                    "pattern_recognition",
                    "strategy_evolution",     # update primitives
                    "state_persistence",      # write back to memory
                ],
            },
        },
        connections=[
            {"source": "topic_in",  "target": "generate",  "type": "direct"},
            {"source": "generate",  "target": "evaluate",  "type": "direct"},
            {"source": "evaluate",  "target": "gate",      "type": "direct"},
            {"source": "gate",      "target": "learn",     "type": "conditional"},  # only on fail
            {"source": "learn",     "target": "generate",  "type": "conditional"},  # regenerate loop
        ],
    )

    circuit_id = core.circuit_designer.create_circuit(circuit_def)
    core.circuit_designer.deploy_circuit(circuit_id)
    return circuit_id


# ═══════════════════════════════════════════════════════════════════════════
# 4.  EPISODE RUNNER  — executes one full generate→evaluate→learn loop
# ═══════════════════════════════════════════════════════════════════════════


async def run_episode(
    core,
    circuit_id: str,
    topic: str,
    primitives: dict | None = None,
    episode_num: int = 1,
) -> dict:
    """
    Runs a single episode through the Neuron circuit.

    Returns a result dict with draft, final, scores, mutations — everything
    the dashboard and W&B traces need.
    """
    import asyncio

    primitives = primitives or dict(DEFAULT_PRIMITIVES)
    episode_id = str(uuid.uuid4())[:12]
    boot_id    = hashlib.sha256(f"{episode_id}{time.time()}".encode()).hexdigest()[:8]

    print(f"\n{'─'*60}")
    print(f"  Episode {episode_num} | topic: \"{topic}\"")
    print(f"  episode_id={episode_id}  boot_id={boot_id}")
    print(f"{'─'*60}")

    # ── STEP 0: Memory probe ──────────────────────────────────────────
    print("\n  [STEP 0] Memory Probe …")
    memory_agent = MemoryProbeAgent()
    memory_result = await memory_agent.process({
        "topic": topic, "episode_id": episode_id
    })
    print(f"          hit={memory_result['redis_get_hit']}  "
          f"key={memory_result['redis_key']}  "
          f"latency={memory_result['redis_get_ms']}ms")

    # ── STEP 1a: Raw generation ───────────────────────────────────────
    print("\n  [STEP 1] Generation (raw) …")
    gen_agent = GenerationAgent()
    draft_result = await gen_agent.process({
        "topic": topic,
        "primitives": primitives,
        "mode": "raw",
    })
    draft_text = draft_result["text"]
    print(f"          {len(draft_text)} chars | model={draft_result['model']}")

    # ── STEP 2: Evaluation ────────────────────────────────────────────
    print("\n  [STEP 2] Evaluation …")
    eval_agent = EvaluationAgent()
    draft_eval = await eval_agent.process({
        "text": draft_text,
        "primitives": primitives,
    })
    draft_passed = draft_eval["passed"]
    print(f"          score={draft_eval['score']*100:.0f}/100  "
          f"{'✅ PASSED' if draft_passed else '❌ FAILED'}  "
          f"issues={len(draft_eval['issues'])}")
    for iss in draft_eval["issues"]:
        print(f"            ⚠️  {iss['message']}")

    # ── STEP 3: Gate ──────────────────────────────────────────────────
    print("\n  [STEP 3] Gate …")
    gate_passed = draft_passed
    gate_reason = "Score ≥ threshold" if gate_passed else "Score < threshold — learning triggered"
    print(f"          {'✅ PASS' if gate_passed else '❌ FAIL — entering Learn→Regenerate loop'}")

    # ── STEP 4: Learn (only if gate failed) ───────────────────────────
    primitives_after = dict(primitives)
    mutations        = []

    if not gate_passed:
        print("\n  [STEP 4] Learning …")
        learn_agent = LearningCircuitAgent()
        learn_result = await learn_agent.process({
            "primitives": primitives,
            "issues":     draft_eval["issues"],
        })
        primitives_after = learn_result["primitives"]
        mutations        = learn_result["mutations"]
        for m in mutations:
            print(f"            ⚡ {m['primitive_name']}: "
                  f"{m['old_weight']:.2f} → {m['new_weight']:.2f}  ({m['reason']})")

        # ── STEP 1b: Regenerate (optimized) ─────────────────────────
        print("\n  [STEP 1b] Regeneration (optimized) …")
        final_result = await gen_agent.process({
            "topic": topic,
            "primitives": primitives_after,
            "mode": "optimized",
        })
        final_text = final_result["text"]
        print(f"          {len(final_text)} chars | model={final_result['model']}")
    else:
        final_text = draft_text

    # ── STEP 5: Final evaluation ──────────────────────────────────────
    print("\n  [STEP 5] Final Evaluation …")
    final_eval = await eval_agent.process({
        "text": final_text,
        "primitives": primitives_after,
    })
    print(f"          score={final_eval['score']*100:.0f}/100  "
          f"{'✅ PASSED' if final_eval['passed'] else '❌ FAILED'}")

    # ── Neuron SynapticBus: broadcast completion ──────────────────────
    completion_msg = Message.create(
        sender="newsroom_orchestrator",
        recipients=["topic_in", "generate", "evaluate", "gate", "learn"],
        content={
            "type": "episode_complete",
            "episode_id": episode_id,
            "final_score": final_eval["score"],
            "mutations_count": len(mutations),
        },
        metadata={"priority": "normal", "timeout": 5}
    )
    try:
        await core.synaptic_bus.send(completion_msg)
    except Exception:
        pass  # SynapticBus is best-effort in demo mode

    # ── Assemble result ───────────────────────────────────────────────
    result = {
        "episode_id":       episode_id,
        "boot_id":          boot_id,
        "episode_num":      episode_num,
        "topic":            topic,
        "model":            draft_result["model"],
        "primitives_before": primitives,
        "primitives_after":  primitives_after,
        "gate_threshold":   GATE_THRESHOLD,
        "draft_text":       draft_text,
        "draft_eval":       draft_eval,
        "final_text":       final_text,
        "final_eval":       final_eval,
        "mutations":        mutations,
        "memory_telemetry": memory_result,
        "gate_passed":      gate_passed,
        "gate_reason":      gate_reason,
    }

    print(f"\n  ✅ Episode {episode_num} complete. "
          f"Draft {draft_eval['score']*100:.0f} → Final {final_eval['score']*100:.0f}  "
          f"| {len(mutations)} mutation(s)")

    return result


# ═══════════════════════════════════════════════════════════════════════════
# 5.  MAIN  — initializes Neuron, builds circuit, runs demo episodes
# ═══════════════════════════════════════════════════════════════════════════


# Demo topics that stress-test the pipeline
DEMO_TOPICS = [
    # Hallucination triggers
    "GPT-9 just announced with 500 trillion parameters",
    "Llama 5 revolutionary breakthrough in AI reasoning",
    # Hyperbole triggers
    "Apple Vision Pro sales are absolutely incredible and unprecedented",
    # Temporal vagueness triggers
    "AI regulations are changing soon and recently shifted",
    # Clean topic (should pass gate on first try)
    "According to Reuters on January 30, Fed holds rates steady",
    # Combined failure
    "GPT-7 revolutionary game-changing breakthrough announced recently",
]


async def main():
    import asyncio

    print("=" * 60)
    print("  🧠 LIVING NEWSROOM — Neuron Circuit")
    print("  Self-optimizing podcast agent")
    print("=" * 60)

    # ── Initialize Neuron core ────────────────────────────────────────
    print("\n📦 Initializing Neuron framework …")
    core = initialize()
    print("   ✅ Neuron core ready")
    print(f"   ✅ Memory manager: {core.memory_manager}")
    print(f"   ✅ SynapticBus:    {core.synaptic_bus}")

    # ── Register custom agents ────────────────────────────────────────
    print("\n🔌 Registering custom agents …")
    core.agent_manager.register(MemoryProbeAgent())
    core.agent_manager.register(GenerationAgent())
    core.agent_manager.register(EvaluationAgent())
    core.agent_manager.register(LearningCircuitAgent())
    print("   ✅ 4 custom agents registered")

    # ── Build circuit ─────────────────────────────────────────────────
    print("\n🏗️  Building LivingNewsroomCircuit …")
    circuit_id = build_newsroom_circuit(core)
    print(f"   ✅ Circuit deployed: {circuit_id}")

    # ── Store initial primitives in episodic memory ───────────────────
    episodic = core.memory_manager.get_memory_system("EPISODIC")
    episodic.store({
        "event": "session_start",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "context": {"primitives": DEFAULT_PRIMITIVES},
        "resolution": "initial_state",
    })
    print("   ✅ Initial primitives stored in episodic memory")

    # ── Run demo episodes ─────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  🚀 Running demo episodes …")
    print("=" * 60)

    primitives = dict(DEFAULT_PRIMITIVES)   # primitives evolve across episodes

    for i, topic in enumerate(DEMO_TOPICS, start=1):
        result = await run_episode(
            core=core,
            circuit_id=circuit_id,
            topic=topic,
            primitives=primitives,
            episode_num=i,
        )

        # Carry forward the learned primitives
        primitives = result["primitives_after"]

        # Store episode in episodic memory so Neuron can reference it later
        episodic.store({
            "event": "episode_complete",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "context": {
                "episode_num": i,
                "topic": topic,
                "score": result["final_eval"]["score"],
                "mutations": len(result["mutations"]),
            },
            "resolution": "passed" if result["final_eval"]["passed"] else "degraded",
        })

        if i < len(DEMO_TOPICS):
            print(f"\n  ⏳ Sleeping 3s before next episode …")
            await asyncio.sleep(3)

    # ── Final primitives report ───────────────────────────────────────
    print("\n" + "=" * 60)
    print("  📊 SESSION SUMMARY")
    print("=" * 60)
    print("\n  Final primitive weights after learning:")
    for name, val in primitives.items():
        bar = "█" * int(val * 40)
        print(f"    {name:25s} {val:.2f}  {bar}")

    # Query episodic memory for the full run
    history = episodic.query(
        context={"event": "episode_complete"},
        timeframe="last_30_days"
    )
    print(f"\n  📚 Episodic memory contains {len(history) if history else 0} episode records")
    print("\n  ✅ Done. All decisions are traceable via Neuron's explainability layer.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
