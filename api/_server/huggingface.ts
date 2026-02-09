// server/huggingface.ts
import crypto from "crypto";
import type { Primitives } from "./primitives";

const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";

const MODELS = {
    primary: "mistralai/Mistral-7B-Instruct-v0.3",
    fallback: "meta-llama/Llama-3.2-3B-Instruct",
} as const;

type Mode = "raw" | "optimized";

export type HuggingFaceCallMeta = {
    hf_model_requested: string;
    hf_model_used: string;
    hf_status_code?: number;

    hf_request_ms: number;
    hf_response_ms: number;

    hf_request_id?: string;

    prompt_hash: string;
    prompt_chars: number;

    tokens_out_est: number;

    used_fallback: boolean;
    failure_chain: Array<{
        model: string;
        status?: number;
        error_message: string;
    }>;
};

export function getHfConfig() {
    const token = process.env.HF_TOKEN || process.env.VITE_HF_TOKEN || process.env.HF_API_KEY;
    const model = process.env.HF_MODEL || process.env.VITE_HF_MODEL || MODELS.primary;

    if (!token) {
        throw new Error("CRITICAL HF token missing. Set HF_TOKEN or VITE_HF_TOKEN in backend env");
    }

    return { token, model };
}

function hashShort(s: string) {
    return crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
}

function tokensOutEstimate(text: string) {
    // Rough estimate for traces, avoids tokenizer dependency
    // English text averages ~4 chars per token
    return Math.max(1, Math.ceil(text.length / 4));
}

function safeModelShort(model: string) {
    const m = model.includes("/") ? model.split("/").pop() : model;
    return m || model;
}

function withTimeout(ms: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return { controller, clear: () => clearTimeout(id) };
}

export async function generateWithHuggingFace(args: {
    topic: string;
    primitives: Primitives;
    mode: Mode;
}) {
    const out = await generateWithHuggingFaceDetailed(args);
    return out.text;
}

export async function generateWithHuggingFaceDetailed(args: {
    topic: string;
    primitives: Primitives;
    mode: Mode;
    timeout_ms?: number;
}) {
    const { topic, primitives, mode } = args;
    const timeout_ms = args.timeout_ms ?? 25000;

    const { token } = getHfConfig();

    const requestedModel = process.env.HF_MODEL || process.env.VITE_HF_MODEL || MODELS.primary;
    const failure_chain: HuggingFaceCallMeta["failure_chain"] = [];

    // Try primary then fallback
    const attemptModels = [requestedModel, MODELS.fallback];

    let usedModel = requestedModel;
    let usedFallback = false;

    let lastErr: any = null;

    for (let idx = 0; idx < attemptModels.length; idx += 1) {
        const model = attemptModels[idx];
        usedModel = model;
        usedFallback = idx > 0;

        try {
            const { text, meta } = await generateWithModelDetailed({
                apiKey: token,
                model,
                topic,
                primitives,
                mode,
                timeout_ms,
            });

            // Meta already includes model used and timing
            return {
                text,
                meta: {
                    ...meta,
                    hf_model_requested: requestedModel,
                    used_fallback: usedFallback,
                    failure_chain,
                } satisfies HuggingFaceCallMeta,
            };
        } catch (e: any) {
            lastErr = e;

            failure_chain.push({
                model,
                status: e?.status,
                error_message: e?.message || "unknown_error",
            });

            // Continue to fallback if available
            if (idx < attemptModels.length - 1) {
                continue;
            }
        }
    }

    // Emergency template if both models fail
    const emergency = generateEmergencyResponse(topic, mode);

    return {
        text: emergency,
        meta: {
            hf_model_requested: requestedModel,
            hf_model_used: "emergency_template",
            hf_status_code: undefined,

            hf_request_ms: 0,
            hf_response_ms: 0,

            hf_request_id: undefined,

            prompt_hash: hashShort(topic),
            prompt_chars: topic.length,

            tokens_out_est: tokensOutEstimate(emergency),

            used_fallback: true,
            failure_chain,
        },
    };
}

async function generateWithModelDetailed(args: {
    apiKey: string;
    model: string;
    topic: string;
    primitives: Primitives;
    mode: Mode;
    timeout_ms: number;
}): Promise<{ text: string; meta: Omit<HuggingFaceCallMeta, "hf_model_requested" | "used_fallback" | "failure_chain"> }> {
    const { apiKey, model, topic, primitives, mode, timeout_ms } = args;

    const prompt = buildPrompt(topic, primitives, mode, model);
    const prompt_hash = hashShort(prompt);
    const prompt_chars = prompt.length;

    const { controller, clear } = withTimeout(timeout_ms);

    const t0 = Date.now();

    let res: Response | null = null;
    let status = 0;
    let requestId: string | undefined = undefined;

    try {
        res = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
                temperature: mode === "raw" ? 0.9 : 0.7,
                stream: false,
            }),
            signal: controller.signal,
        });

        status = res.status;

        // Best effort request id, depends on gateway
        requestId =
            res.headers.get("x-request-id") ||
            res.headers.get("x-amzn-requestid") ||
            res.headers.get("cf-ray") ||
            undefined;

        const t1 = Date.now();
        const hf_request_ms = t1 - t0;

        const rawText = await res.text();
        const t2 = Date.now();
        const hf_response_ms = t2 - t1;

        if (!res.ok) {
            const err: any = new Error(`HuggingFace API error ${status}: ${rawText.slice(0, 500)}`);
            err.status = status;
            err.request_id = requestId;
            throw err;
        }

        let data: any;
        try {
            data = JSON.parse(rawText);
        } catch {
            const err: any = new Error(`HuggingFace returned non JSON response: ${rawText.slice(0, 200)}`);
            err.status = status;
            err.request_id = requestId;
            throw err;
        }

        const text = data?.choices?.[0]?.message?.content || "";
        if (!text) {
            const err: any = new Error(`Empty model response. First keys: ${Object.keys(data || {}).slice(0, 10).join(", ")}`);
            err.status = status;
            err.request_id = requestId;
            throw err;
        }

        const cleaned = cleanOutput(text);

        // Keep logs short, never print prompt or token
        console.log(`HF ok model ${safeModelShort(model)} chars ${cleaned.length} request_ms ${hf_request_ms} response_ms ${hf_response_ms}`);

        return {
            text: cleaned,
            meta: {
                hf_model_used: model,
                hf_status_code: status,
                hf_request_ms,
                hf_response_ms,
                hf_request_id: requestId,
                prompt_hash,
                prompt_chars,
                tokens_out_est: tokensOutEstimate(cleaned),
            },
        };
    } catch (e: any) {
        const err: any = e?.name === "AbortError" ? new Error(`HuggingFace request timed out after ${timeout_ms}ms`) : e;
        if (typeof err?.status !== "number") err.status = status || undefined;
        if (!err.request_id && requestId) err.request_id = requestId;
        throw err;
    } finally {
        clear();
    }
}

function buildPrompt(topic: string, primitives: Primitives, mode: Mode, model: string): string {
    const isLlama = model.toLowerCase().includes("llama");

    if (mode === "raw") {
        const basePrompt = `Write a 60-second podcast news segment about: ${topic}

Make it conversational and engaging for audio. Keep it under 150 words.

Segment:`;

        return isLlama ? `<s>[INST] ${basePrompt} [/INST]` : basePrompt;
    }

    const constraints: string[] = [];

    if (primitives.fact_verification >= 0.85) {
        constraints.push('Only mention real, existing products. Do not invent model numbers. If uncertain, say "reportedly" or "rumored".');
    }

    if (primitives.anti_hyperbole >= 0.8) {
        constraints.push("Avoid superlatives. Use factual, measured language.");
    }

    if (primitives.source_attribution >= 0.8) {
        constraints.push("Include at least 1 named source and a specific date.");
    }

    if (primitives.temporal_accuracy >= 0.75) {
        constraints.push("Use specific dates. Avoid vague terms like recently or soon.");
    }

    const optimizedPrompt = `Write a 60-second podcast news segment about: ${topic}

Constraints:
${constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Write in a professional, fact-based style. Keep it under 150 words.

Segment:`;

    return isLlama ? `<s>[INST] ${optimizedPrompt} [/INST]` : optimizedPrompt;
}

function cleanOutput(text: string): string {
    let cleaned = text
        .replace(/^Segment:\s*/i, "")
        .replace(/^Here'?s?\s+.*?:\s*/i, "")
        .replace(/^\[.*?\]\s*/g, "")
        .replace(/^<\/s>\s*/g, "")
        .trim();

    cleaned = cleaned.replace(/\[\/INST\]/g, "").replace(/\[INST\]/g, "").trim();

    const paragraphs = cleaned.split("\n\n");
    if (paragraphs.length > 0) cleaned = paragraphs[0];

    if (cleaned.length < 30) {
        throw new Error(`Generated text too short ${cleaned.length} chars`);
    }

    if (cleaned.length > 500) cleaned = cleaned.slice(0, 500).trim();

    return cleaned;
}

function generateEmergencyResponse(topic: string, mode: Mode): string {
    const topicLower = topic.toLowerCase();

    if (mode === "optimized") {
        return `Today’s tech update covers ${topic}. Industry observers are monitoring developments in this area. The situation is evolving, and more details are expected in the coming days. Follow official announcements for verified information.`;
    }

    if (topicLower.includes("gpt") || topicLower.includes("ai")) {
        return `In artificial intelligence news today, ${topic} is drawing attention. Companies and researchers are watching the implications. We will share updates as more verified details emerge.`;
    }

    return `In today’s tech news, ${topic} is making headlines. Analysts are watching how this develops. More information is expected soon as the story evolves.`;
}
