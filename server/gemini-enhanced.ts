import {
    GoogleGenerativeAI,
    GenerativeModel,
    SchemaType
} from '@google/generative-ai';
import { type Primitives } from './primitives';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

// Model configurations optimized for GameScript AI
const FLASH_CONFIG = {
    model: "gemini-2.0-flash-exp", // Using latest stable-ish version available
    generationConfig: {
        temperature: 0.7,
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
    },
};

const PRO_CONFIG = {
    model: "gemini-1.5-pro", // Pro model for evaluation
    generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 20,
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

/**
 * Generate broadcast script using Gemini 3 Flash with structured output
 */
export async function generateBroadcastScript(
    topic: string,
    primitives: Primitives,
    options?: { context?: string; style?: string }
): Promise<GenerationResult & { latency_ms: number; model: string }> {
    const startTime = Date.now();
    const systemPrompt = buildGenerationPrompt(topic, primitives, options);

    try {
        const result = await geminiFlash.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: {
                ...FLASH_CONFIG.generationConfig,
                // @ts-ignore - responseSchema is supported in later versions of the SDK
                responseSchema: GENERATION_SCHEMA,
            }
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
 * Evaluate script using Gemini 3 Pro with reasoning chains
 */
export async function evaluateScript(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<EvaluationResult & { latency_ms: number; model: string }> {
    const startTime = Date.now();
    const evaluationPrompt = buildEvaluationPrompt(script, topic, primitives);

    try {
        const result = await geminiPro.generateContent({
            contents: [{ role: "user", parts: [{ text: evaluationPrompt }] }],
            // Evaluation schema is applied in the prompt instructions for Pro models if SDK support varies
        });

        const text = result.response.text();
        // Clean markdown if AI returned it
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const parsed: EvaluationResult = JSON.parse(cleanText);

        return {
            ...parsed,
            latency_ms: Date.now() - startTime,
            model: PRO_CONFIG.model
        };
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

function buildEvaluationPrompt(script: string, topic: string, primitives: Primitives): string {
    return `Evaluate this sports script based on the following primitives:
${Object.entries(primitives).map(([k, v]) => `• ${k}: ${v.toFixed(2)}`).join('\n')}

TOPIC: ${topic}
SCRIPT: "${script}"

For EACH primitive, provide a score (0.0-1.0), explanation, and examples.
If overall quality < 0.72, suggest mutations.

RETURN ONLY VALID JSON WITH THIS STRUCTURE:
{
  "scores": { "primitive_name": score },
  "reasoning": [ { "primitive": "name", "score": 0.0, "explanation": "...", "examples": [] } ],
  "overall_quality": 0.0,
  "gate_passed": boolean,
  "suggested_mutations": [ { "primitive": "name", "current_value": 0.0, "suggested_value": 0.0, "reason": "..." } ]
}`;
}
