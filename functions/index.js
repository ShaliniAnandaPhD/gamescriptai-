const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

setGlobalOptions({ maxInstances: 10 });

// --- PRIMITIVES LOGIC ---
const defaultPrimitives = {
    fact_verification: 0.65,
    anti_hyperbole: 0.75,
    source_attribution: 0.72,
    temporal_accuracy: 0.70,
    entertainment_value: 0.80,
    brevity: 0.40,
};

function learn(primitives, issues) {
    const updated = { ...primitives };
    issues.forEach((issue) => {
        if (issue.type === 'hallucination' || issue.type === 'unverified') {
            updated.fact_verification = Math.min(1.0, updated.fact_verification + 0.15);
        }
        if (issue.type === 'hyperbole') {
            updated.anti_hyperbole = Math.min(1.0, updated.anti_hyperbole + 0.10);
        }
        if (issue.type === 'missing_source') {
            updated.source_attribution = Math.min(1.0, updated.source_attribution + 0.12);
        }
        if (issue.type === 'temporal_vague') {
            updated.temporal_accuracy = Math.min(1.0, updated.temporal_accuracy + 0.10);
        }
    });
    return updated;
}

// --- EVALUATE LOGIC ---
function evaluateContent(text, primitives) {
    const issues = [];
    let score = 100;
    const lowerText = text.toLowerCase();

    const unreleased = ['gpt-5', 'gpt-6', 'gpt-7', 'gpt-8', 'gpt-9', 'llama 4', 'llama 5', 'llama 6', 'claude 5', 'claude 6'];
    unreleased.forEach(product => {
        if (lowerText.includes(product)) {
            issues.push({ type: 'hallucination', message: `Unreleased product mentioned: ${product}`, severity: 'high' });
            score -= 30 * primitives.fact_verification;
        }
    });

    const hyperbole = ['revolutionary', 'earth-shattering', 'unprecedented', 'game-changing', 'breakthrough', 'incredible', 'amazing', 'absolutely', 'unbelievable'];
    let hyperboleCount = 0;
    hyperbole.forEach(word => {
        if (lowerText.includes(word)) hyperboleCount++;
    });

    if (hyperboleCount >= 3) {
        issues.push({ type: 'hyperbole', message: `Excessive superlatives detected (${hyperboleCount} instances)`, severity: 'medium' });
        score -= 20 * primitives.anti_hyperbole;
    }

    const hasSource = lowerText.includes('according to') || lowerText.includes('reported by') || lowerText.includes('sources say') ||
        lowerText.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i);

    if (!hasSource && text.split(' ').length > 20) {
        issues.push({ type: 'missing_source', message: 'Claims lack specific attribution', severity: 'medium' });
        score -= 15 * primitives.source_attribution;
    }

    if (lowerText.includes('recently') || lowerText.includes('lately') || lowerText.includes('soon')) {
        issues.push({ type: 'temporal_vague', message: 'Vague temporal references detected', severity: 'low' });
        score -= 10 * primitives.temporal_accuracy;
    }

    score = Math.max(0, Math.min(100, score));
    return { score: score / 100, issues, passed: score >= 72 };
}

// --- HUGGINGFACE LOGIC ---
const MODELS = {
    primary: 'mistralai/Mistral-7B-Instruct-v0.2',
    fallback: 'meta-llama/Llama-2-7b-chat-hf'
};

async function generateWithHuggingFace({ apiKey, topic, primitives, mode }) {
    try {
        return await generateWithModel({ apiKey, model: MODELS.primary, topic, primitives, mode });
    } catch (e) {
        logger.warn(`Primary model failed, falling back: ${e.message}`);
        try {
            return await generateWithModel({ apiKey, model: MODELS.fallback, topic, primitives, mode });
        } catch (e2) {
            logger.error(`Fallback model failed: ${e2.message}`);
            return `In today's tech news, ${topic} is making headlines. Analysts are watching these developments closely.`;
        }
    }
}

async function generateWithModel({ apiKey, model, topic, primitives, mode }) {
    const prompt = buildPrompt(topic, primitives, mode, model);
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 200, temperature: mode === 'raw' ? 0.9 : 0.7, top_p: 0.95, do_sample: true, return_full_text: false },
            options: { wait_for_model: true }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`HF Error: ${err}`);
    }

    const data = await response.json();
    let text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
    return cleanOutput(text);
}

function buildPrompt(topic, primitives, mode, model) {
    const isLlama = model.includes('llama');
    const base = `Write a 60-second podcast news segment about: ${topic}\n\n`;
    const constraints = [];
    if (mode === 'optimized') {
        if (primitives.fact_verification >= 0.8) constraints.push('Only mention real products.');
        if (primitives.anti_hyperbole >= 0.8) constraints.push('Avoid hype/superlatives.');
    }
    const finalPrompt = base + (constraints.length ? `CONSTRAINTS:\n${constraints.join('\n')}\n\n` : '') + "Keep it under 150 words. Segment:";
    return isLlama ? `<s>[INST] ${finalPrompt} [/INST]` : finalPrompt;
}

function cleanOutput(text) {
    return text.replace(/^Segment:\s*/i, '').replace(/\[\/INST\]/g, '').split('\n\n')[0].trim();
}

// --- RUN CYCLE ---
exports.runCycle = onRequest(async (req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

        try {
            const hfKey = process.env.HF_API_KEY; // Managed via Firebase Secrets
            const { topic, primitives: reqPrimitives } = req.body;

            if (!hfKey || !topic) {
                return res.status(400).json({ error: "Missing HF_API_KEY in secrets or topic in body" });
            }

            const primitivesBefore = reqPrimitives ?? defaultPrimitives;
            const gateThreshold = 0.72;

            // Step 1: Raw Draft
            const draft = await generateWithHuggingFace({ apiKey: hfKey, topic, primitives: primitivesBefore, mode: "raw" });
            const draftEval = evaluateContent(draft, primitivesBefore);
            const draftPassed = draftEval.score >= gateThreshold;

            // Step 2: Learn and Optimize
            const primitivesAfter = draftPassed ? primitivesBefore : learn(primitivesBefore, draftEval.issues);
            const finalText = draftPassed ? draft : await generateWithHuggingFace({ apiKey: hfKey, topic, primitives: primitivesAfter, mode: "optimized" });
            const finalEval = evaluateContent(finalText, primitivesAfter);

            // Step 3: Diff Mutations
            const mutations = [];
            Object.keys(primitivesBefore).forEach(k => {
                if (Math.abs(primitivesBefore[k] - primitivesAfter[k]) > 0.001) {
                    mutations.push({ primitive_name: k, old_weight: primitivesBefore[k], new_weight: primitivesAfter[k], delta: primitivesAfter[k] - primitivesBefore[k], reason: "Correction applied" });
                }
            });

            res.json({
                usedKeyLast4: hfKey.slice(-4),
                topic,
                primitives_before: primitivesBefore,
                primitives_after: primitivesAfter,
                gate_threshold: gateThreshold,
                draft_text: draft,
                draft_eval: { score: draftEval.score, issues: draftEval.issues, passed: draftPassed },
                final_text: finalText,
                final_eval: { score: finalEval.score, issues: finalEval.issues, passed: finalEval.score >= gateThreshold },
                mutations,
            });
        } catch (error) {
            logger.error("Error in runCycle:", error);
            res.status(500).json({ error: error.message });
        }
    });
});
