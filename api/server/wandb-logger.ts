// server/wandb-logger.ts
const SIDECAR_URL = process.env.WANDB_SIDECAR_URL || "http://127.0.0.1:5199";

let lastRunUrl: string | null = null;
let lastBootId: string | null = null;

export interface StepTelemetry {
    step_id: string;
    name: string;
    start_ts: number;
    end_ts?: number;
    latency_ms?: number;
    status: "running" | "success" | "failed";
    error_type?: string;
    error_message?: string;
    metadata?: StepMetadata;
}

export interface StepMetadata {
    trigger?: string;
    decision?: "continue" | "learn" | "regenerate" | "finish";
    reason_codes?: string[];

    inputs?: Record<string, any>;
    outputs?: Record<string, any>;

    profile?: {
        hf_model_requested?: string;
        hf_model_used?: string;
        hf_status_code?: number;
        hf_request_ms?: number;
        hf_response_ms?: number;
        hf_tokens_out_est?: number;
        prompt_hash?: string;
        prompt_chars?: number;
    };

    audit?: {
        episode_id?: string;
        boot_id?: string;
        gate_threshold?: number;

        primitives_before?: Record<string, number>;
        primitives_after?: Record<string, number>;
        primitive_deltas?: Record<string, number>;
        mutation_policy_version?: string;
    };
}

export interface MutationTelemetry {
    primitive_name: string;
    old_weight: number;
    new_weight: number;
    delta: number;
    reason: string;
    trigger: string;
}

export interface EpisodeTelemetry {
    episode_id?: string;
    boot_id?: string;

    episode_num: number;
    topic: string;

    quality_score: number;
    issues_count: number;
    gate_passed: boolean;
    gate_confidence: number;
    latency_ms_total: number;
    retry_count: number;
    update_count: number;

    model: string;
    primitives_snapshot: Record<string, number>;

    steps: StepTelemetry[];
    mutations: MutationTelemetry[];

    draft_text: string;
    final_text: string;
    draft_issues: string[];
    final_issues: string[];
}

async function postJson(path: string, body: any) {
    const url = `${SIDECAR_URL}${path}`;
    const size = JSON.stringify(body).length;
    console.log(`📤 Node: POST ${url} size ${size}`);

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const resText = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(`Sidecar ${res.status}: ${resText}`);
    }

    try {
        return JSON.parse(resText);
    } catch {
        return { ok: true };
    }
}

export async function wandbHealthCheck(): Promise<boolean> {
    try {
        const res = await fetch(`${SIDECAR_URL}/health`);
        if (!res.ok) return false;

        const txt = await res.text().catch(() => "");
        try {
            const j = JSON.parse(txt);
            if (j.boot_id) lastBootId = String(j.boot_id);
        } catch {
            // ignore
        }
        return true;
    } catch {
        return false;
    }
}

export async function logTelemetryToWandb(telemetry: EpisodeTelemetry) {
    try {
        if (!telemetry.boot_id && lastBootId) telemetry.boot_id = lastBootId;

        const data = await postJson("/log/telemetry", telemetry);
        if (data.run_url) lastRunUrl = data.run_url;
        if (data.boot_id) lastBootId = data.boot_id;
        return data;
    } catch (err) {
        console.warn("W&B sidecar telemetry log failed:", err);
        return null;
    }
}

export async function logContentArtifact(name: string, payload: any) {
    try {
        return await postJson("/log/artifact", { name, payload });
    } catch (err) {
        console.warn("W&B sidecar artifact log failed:", err);
        return null;
    }
}

export const getRunUrl = () =>
    lastRunUrl || "https://wandb.ai/nlpvisionio-university-of-california/living-newsroom";

export const getBootId = () => lastBootId;
export const initWandb = async () => wandbHealthCheck();
export const finish = async () => { };
