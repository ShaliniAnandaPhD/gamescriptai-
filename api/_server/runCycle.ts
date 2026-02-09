// server/runCycle.ts
import crypto from "crypto";
import { defaultPrimitives, learn, type Primitives } from "./primitives";
import { evaluate } from "./evaluate";
import { generateWithHuggingFaceDetailed, getHfConfig } from "./huggingface";
import {
    logTelemetryToWandb,
    logContentArtifact,
    getRunUrl,
    getBootId,
    wandbHealthCheck,
    type StepTelemetry,
    type MutationTelemetry,
    type EpisodeTelemetry,
    type StepMetadata,
} from "./wandb-logger";

let wandbInitialized = false;

export type RunCycleRequest = {
    topic: string;
    primitives?: Primitives;
    episode_num?: number;
};

export type RunCycleResponse = {
    usedModel: string;
    topic: string;
    primitives_before: Primitives;
    primitives_after: Primitives;
    gate_threshold: number;
    draft_text: string;
    draft_eval: { score: number; issues: any[]; passed: boolean };
    final_text: string;
    final_eval: { score: number; issues: any[]; passed: boolean };
    mutations: Array<{
        primitive_name: keyof Primitives;
        old_weight: number;
        new_weight: number;
        delta: number;
        reason: string;
    }>;
    wandb_logged: boolean;
    wandb_run_url: string | null;
    episode_id: string;
    boot_id: string | null;
};

function hashText(s: string) {
    return crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
}

function computeEpisodeId(topic: string, episodeNum: number) {
    const t = topic.trim().toLowerCase();
    const h = hashText(`${t}|${episodeNum}|${Date.now()}`);
    return `ep_${episodeNum}_${h}`;
}

function toReasonCodes(issues: any[]): string[] {
    const out = new Set<string>();
    for (const i of issues || []) {
        if (i?.type) out.add(String(i.type));
    }
    return Array.from(out);
}

export async function runCycle(req: RunCycleRequest): Promise<RunCycleResponse> {
    const startTime = Date.now();

    if (!wandbInitialized) {
        await wandbHealthCheck();
        wandbInitialized = true;
    }

    const topic = (req.topic || "").trim();
    if (!topic) throw new Error("Missing topic");

    const episodeNum = req.episode_num || 1;
    const episodeId = computeEpisodeId(topic, episodeNum);
    const bootId = getBootId() || null;

    // requested model from env, not necessarily what is used if fallback happens
    const { model: requestedModel } = getHfConfig();

    const primitivesBefore: Primitives = req.primitives ?? defaultPrimitives;
    const gateThreshold = 0.72;

    const steps: StepTelemetry[] = [];

    let usedModelForEpisode = requestedModel;

    const baseAudit = (): StepMetadata["audit"] => ({
        episode_id: episodeId,
        boot_id: bootId || undefined,
        gate_threshold: gateThreshold,
    });

    const recordStep = async (
        name: string,
        meta: Omit<StepMetadata, "audit">,
        fn: () => Promise<any>
    ) => {
        const step_id = `step_${steps.length + 1}`;
        const start_ts = Date.now();

        const telemetry: StepTelemetry = {
            step_id,
            name,
            start_ts,
            status: "running",
            metadata: { ...meta, audit: { ...baseAudit(), ...(meta.audit || {}) } },
        };

        steps.push(telemetry);

        try {
            const result = await fn();
            telemetry.status = "success";
            telemetry.end_ts = Date.now();
            telemetry.latency_ms = telemetry.end_ts - start_ts;
            return result;
        } catch (e: any) {
            telemetry.status = "failed";
            telemetry.end_ts = Date.now();
            telemetry.latency_ms = telemetry.end_ts - start_ts;
            telemetry.error_type = e?.name || "Error";
            telemetry.error_message = e?.message || "Unknown error";
            throw e;
        }
    };

    // STEP 1 Memory
    await recordStep(
        "1_redis_memory",
        {
            trigger: "pipeline",
            decision: "continue",
            reason_codes: [],
            inputs: { cache: "redis", check: "noop" },
            outputs: { ok: true },
        },
        async () => {
            await new Promise((r) => setTimeout(r, 50));
        }
    );

    // STEP 2 Generate draft
    const draft = await recordStep(
        "2_generation_raw",
        {
            trigger: "pipeline",
            decision: "continue",
            reason_codes: [],
            inputs: {
                topic_hash: hashText(topic),
                topic_chars: topic.length,
                mode: "raw",
            },
            outputs: {},
            profile: {
                hf_model_requested: requestedModel,
            },
        },
        async () => {
            const { text, meta } = await generateWithHuggingFaceDetailed({
                topic,
                primitives: primitivesBefore,
                mode: "raw",
            });

            // Save actual model for the episode. If fallback was used, meta reflects it
            usedModelForEpisode = meta.hf_model_used || usedModelForEpisode;

            const stepMeta = steps[steps.length - 1].metadata!;
            stepMeta.outputs = {
                draft_chars: text.length,
                draft_hash: hashText(text),
            };

            stepMeta.profile = {
                ...(stepMeta.profile || {}),
                hf_model_requested: meta.hf_model_requested,
                hf_model_used: meta.hf_model_used,
                hf_status_code: meta.hf_status_code,
                hf_request_ms: meta.hf_request_ms,
                hf_response_ms: meta.hf_response_ms,
                hf_request_id: meta.hf_request_id,
                hf_tokens_out_est: meta.tokens_out_est,
                prompt_hash: meta.prompt_hash,
                prompt_chars: meta.prompt_chars,
                used_fallback: meta.used_fallback,
                failure_chain: meta.failure_chain,
            };

            return text;
        }
    );

    // STEP 3 Evaluate draft
    const draftEval = await recordStep(
        "3_evaluation",
        {
            trigger: "pipeline",
            decision: "continue",
            reason_codes: [],
            inputs: {
                text_hash: hashText(draft),
                text_chars: draft.length,
                gate_threshold: gateThreshold,
            },
            outputs: {},
        },
        async () => {
            const ev = evaluate(draft, primitivesBefore);
            const passed = ev.score >= gateThreshold;
            const reasons = toReasonCodes(ev.issues);

            const stepMeta = steps[steps.length - 1].metadata!;
            stepMeta.decision = passed ? "continue" : "learn";
            stepMeta.reason_codes = reasons;
            stepMeta.outputs = {
                score: ev.score,
                passed,
                issues_count: ev.issues.length,
                issues_by_type: reasons.reduce((acc: any, t: string) => {
                    acc[t] = (acc[t] || 0) + 1;
                    return acc;
                }, {}),
                quality_band: passed ? "pass" : ev.score >= gateThreshold - 0.08 ? "soft_fail" : "hard_fail",
            };

            return ev;
        }
    );

    const draftPassed = draftEval.score >= gateThreshold;

    // STEP 4 Learn
    let primitivesAfter = { ...primitivesBefore };
    const mutations: MutationTelemetry[] = [];

    if (!draftPassed) {
        await recordStep(
            "4_learning",
            {
                trigger: "gate_fail",
                decision: "regenerate",
                reason_codes: toReasonCodes(draftEval.issues),
                inputs: {
                    issues_count: draftEval.issues.length,
                    issues_types: toReasonCodes(draftEval.issues),
                },
                outputs: {},
                audit: {
                    primitives_before: primitivesBefore as any,
                    mutation_policy_version: "learn_v1",
                },
            },
            async () => {
                const updated = learn(primitivesBefore, draftEval.issues);
                const diffs = diffPrimitives(primitivesBefore, updated, draftEval.issues);

                primitivesAfter = updated;

                for (const d of diffs) {
                    mutations.push({
                        primitive_name: d.primitive_name,
                        old_weight: d.old_weight,
                        new_weight: d.new_weight,
                        delta: d.delta,
                        reason: d.reason,
                        trigger: draftEval.issues?.[0]?.type || "quality_drop",
                    });
                }

                const deltaMap: Record<string, number> = {};
                for (const m of mutations) deltaMap[m.primitive_name] = m.delta;

                const stepMeta = steps[steps.length - 1].metadata!;
                stepMeta.outputs = {
                    mutation_count: mutations.length,
                    primitives_changed: Object.keys(deltaMap),
                };
                stepMeta.audit = {
                    ...(stepMeta.audit || {}),
                    primitives_after: primitivesAfter as any,
                    primitive_deltas: deltaMap,
                };
            }
        );
    }

    // STEP 5 Regenerate
    let finalText = draft;
    if (!draftPassed) {
        finalText = await recordStep(
            "5_regeneration",
            {
                trigger: "gate_fail",
                decision: "continue",
                reason_codes: toReasonCodes(draftEval.issues),
                inputs: {
                    mode: "optimized",
                    topic_hash: hashText(topic),
                    topic_chars: topic.length,
                },
                outputs: {},
                audit: {
                    primitives_before: primitivesBefore as any,
                    primitives_after: primitivesAfter as any,
                },
                profile: {
                    hf_model_requested: requestedModel,
                },
            },
            async () => {
                const { text, meta } = await generateWithHuggingFaceDetailed({
                    topic,
                    primitives: primitivesAfter,
                    mode: "optimized",
                });

                // If regen falls back, this captures the truth
                usedModelForEpisode = meta.hf_model_used || usedModelForEpisode;

                const enabled = Object.entries(primitivesAfter)
                    .filter(([, v]) => v >= 0.75)
                    .map(([k]) => k);

                const stepMeta = steps[steps.length - 1].metadata!;
                stepMeta.outputs = {
                    final_chars: text.length,
                    final_hash: hashText(text),
                    constraints_enabled: enabled,
                };

                stepMeta.profile = {
                    ...(stepMeta.profile || {}),
                    hf_model_requested: meta.hf_model_requested,
                    hf_model_used: meta.hf_model_used,
                    hf_status_code: meta.hf_status_code,
                    hf_request_ms: meta.hf_request_ms,
                    hf_response_ms: meta.hf_response_ms,
                    hf_request_id: meta.hf_request_id,
                    hf_tokens_out_est: meta.tokens_out_est,
                    prompt_hash: meta.prompt_hash,
                    prompt_chars: meta.prompt_chars,
                    used_fallback: meta.used_fallback,
                    failure_chain: meta.failure_chain,
                };

                return text;
            }
        );
    }

    // STEP 6 Final check
    const finalEval = await recordStep(
        "6_final_check",
        {
            trigger: "pipeline",
            decision: "finish",
            reason_codes: [],
            inputs: {
                text_hash: hashText(finalText),
                text_chars: finalText.length,
                gate_threshold: gateThreshold,
            },
            outputs: {},
        },
        async () => {
            const ev = evaluate(finalText, primitivesAfter);
            const passed = ev.score >= gateThreshold;

            const beforeCodes = toReasonCodes(draftEval.issues);
            const afterCodes = toReasonCodes(ev.issues);

            const resolved = beforeCodes.filter((t) => !afterCodes.includes(t));
            const remaining = afterCodes;

            const stepMeta = steps[steps.length - 1].metadata!;
            stepMeta.decision = "finish";
            stepMeta.reason_codes = afterCodes;
            stepMeta.outputs = {
                score_before: draftEval.score,
                score_after: ev.score,
                delta: ev.score - draftEval.score,
                passed,
                issues_before_count: draftEval.issues.length,
                issues_after_count: ev.issues.length,
                issues_resolved_by_type: resolved,
                issues_remaining_by_type: remaining,
            };

            return ev;
        }
    );

    const finalPassed = finalEval.score >= gateThreshold;

    const telemetry: EpisodeTelemetry = {
        episode_id: episodeId,
        boot_id: bootId || undefined,

        episode_num: episodeNum,
        topic,

        quality_score: finalEval.score,
        issues_count: finalEval.issues.length,
        gate_passed: finalPassed,
        gate_confidence: finalEval.score,
        latency_ms_total: Date.now() - startTime,
        retry_count: !draftPassed ? 1 : 0,
        update_count: mutations.length,

        // This should be what actually ran
        model: usedModelForEpisode,
        primitives_snapshot: primitivesAfter as any,

        steps,
        mutations,

        draft_text: draft,
        final_text: finalText,
        draft_issues: draftEval.issues.map((i: any) => i.message),
        final_issues: finalEval.issues.map((i: any) => i.message),
    };

    const wandbRes = await logTelemetryToWandb(telemetry);

    await logContentArtifact(`episode_${episodeNum}`, {
        episode_id: episodeId,
        episode_num: episodeNum,
        topic,
        draft_text: draft,
        final_text: finalText,
        draft_issues: telemetry.draft_issues,
        final_issues: telemetry.final_issues,
        corrections: mutations.map((m: any) => `${m.primitive_name}: ${m.reason}`),
    });

    return {
        usedModel: usedModelForEpisode,
        topic,
        primitives_before: primitivesBefore,
        primitives_after: primitivesAfter,
        gate_threshold: gateThreshold,
        draft_text: draft,
        draft_eval: { score: draftEval.score, issues: draftEval.issues, passed: draftPassed },
        final_text: finalText,
        final_eval: { score: finalEval.score, issues: finalEval.issues, passed: finalPassed },
        mutations: mutations.map((m) => ({
            primitive_name: m.primitive_name as any,
            old_weight: m.old_weight,
            new_weight: m.new_weight,
            delta: m.delta,
            reason: m.reason,
        })),
        wandb_logged: Boolean(wandbRes?.ok),
        wandb_run_url: getRunUrl(),
        episode_id: episodeId,
        boot_id: bootId,
    };
}

function diffPrimitives(before: Primitives, after: Primitives, issues: any[]) {
    const out: any[] = [];
    (Object.keys(before) as Array<keyof Primitives>).forEach((k) => {
        const oldW = before[k];
        const newW = after[k];
        if (Math.abs(oldW - newW) > 0.001) {
            out.push({
                primitive_name: k,
                old_weight: oldW,
                new_weight: newW,
                delta: newW - oldW,
                reason: reasonFor(String(k), issues),
            });
        }
    });
    return out;
}

function reasonFor(k: string, issues: any[]) {
    const typeMap: Record<string, string> = {
        hallucination: "Hallucination detected",
        hyperbole: "Excessive superlatives",
        missing_source: "Missing attribution",
        temporal_vague: "Vague temporal reference",
    };

    const reasons = (issues || []).map((i: any) => typeMap[i.type] || i.type).filter(Boolean);
    return reasons.length > 0 ? reasons.join("; ") : `Updated ${k}`;
}
