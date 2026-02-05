import {
    GoogleGenerativeAI,
    GenerativeModel,
    SchemaType
} from '@google/generative-ai';
import { type Primitives } from './primitives';

// Initialize Gemini API
// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Model configurations optimized for GameScript AI
const FLASH_CONFIG = {
    model: "gemini-2.0-flash", // Using explicit v2.0 for best responseSchema support
    generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096, // Increased for verbose evaluations
        responseMimeType: "application/json",
    },
};

const PRO_CONFIG = {
    model: "gemini-2.0-flash", // v2.0 is extremely stable for structured output
    generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
    },
};

export const geminiFlash: GenerativeModel = genAI.getGenerativeModel(FLASH_CONFIG);
export const geminiPro: GenerativeModel = genAI.getGenerativeModel(PRO_CONFIG);

export interface GenerationResult {
    script: string;
    metadata: {
        word_count: number;
        estimated_duration_seconds: number;
        tone: 'professional' | 'casual' | 'analytical';
        key_points: string[];
    };
}

export interface EvaluationResult {
    scores: Record<keyof Primitives, number>;
    reasoning: {
        primitive: string;
        score: number;
        explanation: string;
        examples: string[];
    }[];
    overall_quality: number;
    gate_passed: boolean;
    suggested_mutations: {
        primitive: string;
        current_value: number;
        suggested_value: number;
        reason: string;
    }[];
    latency_ms?: number;
    model?: string;
}

// Schema for structured output
const GENERATION_SCHEMA: any = {
    type: SchemaType.OBJECT,
    properties: {
        script: { type: SchemaType.STRING },
        metadata: {
            type: SchemaType.OBJECT,
            properties: {
                word_count: { type: SchemaType.NUMBER },
                estimated_duration_seconds: { type: SchemaType.NUMBER },
                tone: { type: SchemaType.STRING, enum: ["professional", "casual", "analytical"] },
                key_points: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
        }
    },
    required: ["script", "metadata"]
};

// Schema for evaluation output
export const EVALUATION_SCHEMA: any = {
    type: SchemaType.OBJECT,
    properties: {
        scores: {
            type: SchemaType.OBJECT,
            properties: {
                fact_verification: { type: SchemaType.NUMBER },
                anti_hyperbole: { type: SchemaType.NUMBER },
                source_attribution: { type: SchemaType.NUMBER },
                temporal_accuracy: { type: SchemaType.NUMBER },
                entertainment_value: { type: SchemaType.NUMBER },
                brevity: { type: SchemaType.NUMBER },
                audience_targeting: { type: SchemaType.NUMBER },
                controversy_sensitivity: { type: SchemaType.NUMBER },
                statistical_depth: { type: SchemaType.NUMBER },
                local_context_awareness: { type: SchemaType.NUMBER },
                sponsor_compliance: { type: SchemaType.NUMBER },
                accessibility_optimization: { type: SchemaType.NUMBER },
                real_time_momentum: { type: SchemaType.NUMBER },
                player_privacy_protection: { type: SchemaType.NUMBER }
            },
            required: [
                "fact_verification", "anti_hyperbole", "source_attribution",
                "temporal_accuracy", "entertainment_value", "brevity",
                "audience_targeting", "controversy_sensitivity", "statistical_depth",
                "local_context_awareness", "sponsor_compliance", "accessibility_optimization",
                "real_time_momentum", "player_privacy_protection"
            ]
        },
        reasoning: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    primitive: { type: SchemaType.STRING },
                    score: { type: SchemaType.NUMBER },
                    explanation: { type: SchemaType.STRING },
                    examples: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                },
                required: ["primitive", "score", "explanation", "examples"]
            }
        },
        overall_quality: { type: SchemaType.NUMBER },
        gate_passed: { type: SchemaType.BOOLEAN },
        suggested_mutations: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    primitive: { type: SchemaType.STRING },
                    current_value: { type: SchemaType.NUMBER },
                    suggested_value: { type: SchemaType.NUMBER },
                    reason: { type: SchemaType.STRING }
                },
                required: ["primitive", "current_value", "suggested_value", "reason"]
            }
        }
    },
    required: ["scores", "reasoning", "overall_quality", "gate_passed", "suggested_mutations"]
};

// Schema for consensus synthesis output
export const CONSENSUS_SCHEMA: any = {
    type: SchemaType.OBJECT,
    properties: {
        final_scores: {
            type: SchemaType.OBJECT,
            properties: {
                fact_verification: { type: SchemaType.NUMBER },
                anti_hyperbole: { type: SchemaType.NUMBER },
                source_attribution: { type: SchemaType.NUMBER },
                temporal_accuracy: { type: SchemaType.NUMBER },
                entertainment_value: { type: SchemaType.NUMBER },
                brevity: { type: SchemaType.NUMBER },
                audience_targeting: { type: SchemaType.NUMBER },
                controversy_sensitivity: { type: SchemaType.NUMBER },
                statistical_depth: { type: SchemaType.NUMBER },
                local_context_awareness: { type: SchemaType.NUMBER },
                sponsor_compliance: { type: SchemaType.NUMBER },
                accessibility_optimization: { type: SchemaType.NUMBER },
                real_time_momentum: { type: SchemaType.NUMBER },
                player_privacy_protection: { type: SchemaType.NUMBER }
            },
            required: [
                "fact_verification", "anti_hyperbole", "source_attribution",
                "temporal_accuracy", "entertainment_value", "brevity",
                "audience_targeting", "controversy_sensitivity", "statistical_depth",
                "local_context_awareness", "sponsor_compliance", "accessibility_optimization",
                "real_time_momentum", "player_privacy_protection"
            ]
        },
        overall_quality: { type: SchemaType.NUMBER },
        gate_passed: { type: SchemaType.BOOLEAN },
        consensus_strength: { type: SchemaType.NUMBER },
        debate_summary: { type: SchemaType.STRING },
        disputed_primitives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["final_scores", "overall_quality", "gate_passed", "consensus_strength", "debate_summary", "disputed_primitives"]
};

import { safeGenerateContent } from './lib/gemini-utils';

/**
 * Generate broadcast script using Gemini Flash with structured output
 */
export async function generateBroadcastScript(
    topic: string,
    primitives: Primitives,
    options?: { context?: string; style?: string }
): Promise<GenerationResult & { latency_ms: number; model: string }> {
    const startTime = Date.now();
    const systemPrompt = buildGenerationPrompt(topic, primitives, options);

    try {
        const result = await safeGenerateContent(geminiFlash, systemPrompt, {
            responseSchema: GENERATION_SCHEMA
        });

        const text = result.response.text();
        const parsed: GenerationResult = JSON.parse(text);

        return {
            ...parsed,
            latency_ms: Date.now() - startTime,
            model: FLASH_CONFIG.model
        };
    } catch (error: any) {
        console.error('Generation error:', error);
        throw new Error(`Gemini generation failed: ${error.message}`);
    }
}

/**
 * Evaluate script using Gemini Pro with reasoning chains
 */
function buildEvaluationPrompt(script: string, topic: string, primitives: Primitives): string {
    return `You are a sophisticated PhD-level AI evaluator for a sports newsroom.

Return the evaluation in MUST BE STRICT JSON format according to this schema:
{
  "scores": { "primitive_name": 0.XX },
  "overall_quality": 0.XX,
  "gate_passed": true/false,
  "reasoning": [ { "primitive": "name", "score": 0.XX, "explanation": "...", "examples": ["..."] } ]
}

TOPIC: "${topic}"
SCRIPT TO EVALUATE: "${script}"
CURRENT PRIMITIVES: ${JSON.stringify(primitives)}

Return ONLY the JSON. No other text.`;
}

export async function evaluateScript(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<EvaluationResult & { latency_ms: number; model: string }> {
    const startTime = Date.now();
    const evaluationPrompt = buildEvaluationPrompt(script, topic, primitives);

    try {
        const result = await safeGenerateContent(geminiPro, evaluationPrompt, {
            responseSchema: EVALUATION_SCHEMA
        });

        const text = result.response.text();
        if (!text) {
            console.error('🚨 Gemini returned empty response for evaluation.');
            throw new Error('Empty evaluation response');
        }

        console.log('📄 Raw AI Evaluation length:', text.length);

        // Definitive JSON extraction: find the first { and last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('No JSON object found in response');
        }

        const rawJson = text.substring(firstBrace, lastBrace + 1);

        // Robust cleaning
        const cleanText = rawJson
            .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
            .trim();

        try {
            const parsed: EvaluationResult = JSON.parse(cleanText);

            return {
                ...parsed,
                latency_ms: Date.now() - startTime,
                model: PRO_CONFIG.model
            };
        } catch (parseError: any) {
            console.error('❌ Failed to parse Gemini JSON. Raw content snippet:', cleanText.substring(0, 1000));
            console.error('❌ Error at position:', parseError.message);
            throw parseError;
        }
    } catch (error: any) {
        console.error('Evaluation error:', error);
        throw new Error(`Gemini evaluation failed: ${error.message}`);
    }
}

/**
 * Multimodal analysis - analyze images/video with Gemini Flash
 */
export async function analyzeGameImage(
    imageData: string, // base64
    analysisType: 'scoreboard' | 'play' | 'stats' | 'crowd'
): Promise<{ analysis: any; latency_ms: number }> {
    const startTime = Date.now();
    const prompts = {
        scoreboard: `Analyze this scoreboard image and extract scores, time remaining, and status. Return only JSON.`,
        play: `Analyze this play image and describe formation and key player positions. Return only JSON.`,
        stats: `Extract all visible statistics from this graphic. Return only JSON.`,
        crowd: `Analyze the crowd energy level (1-10) and reactions. Return only JSON.`
    };

    try {
        const result = await geminiFlash.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompts[analysisType] },
                    { inlineData: { mimeType: "image/jpeg", data: imageData } }
                ]
            }]
        });

        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const parsed = JSON.parse(cleanText || "{}");

        return {
            analysis: parsed,
            latency_ms: Date.now() - startTime
        };
    } catch (error: any) {
        console.error('Image analysis error:', error);
        throw new Error(`Multimodal analysis failed: ${error.message}`);
    }
}

function buildGenerationPrompt(topic: string, primitives: Primitives, options?: any): string {
    return `You are a professional sports broadcaster generating commentary for: "${topic}"

BEHAVIORAL PRIMITIVES (personality constraints, 0.0-1.0 scale):
${Object.entries(primitives).map(([k, v]) => `• ${k}: ${v.toFixed(2)}`).join('\n')}

STYLE CONTROLS:
- brevity (${primitives.brevity}): Target ${Math.round(primitives.brevity * 300 + 100)} characters.
- entertainment_value (${primitives.entertainment_value}): ${primitives.entertainment_value > 0.7 ? 'Conversational and high energy' : 'Professional and analytical'}.

${options?.context ? `CONTEXT: ${options.context}` : ''}

OUTPUT VALID JSON matching the schema. No markdown.`;
}
