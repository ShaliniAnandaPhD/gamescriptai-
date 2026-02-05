import { GoogleGenerativeAI } from '@google/generative-ai';
import { Primitives } from '../primitives';
import { safeGenerateContent } from './gemini-utils';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * STRICT CRITIC - Cynical, pedantic, hates hype
 */
async function strictCriticEvaluation(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<{
    score: number;
    vote: 'pass' | 'fail';
    complaint: string;
    examples: string[];
    primitive_scores: Record<string, number>;
}> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.1, // Very strict
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the STRICT CRITIC - a cynical, pedantic editor who HATES hype and lazy writing.
CRITICISM GUIDELINES:
- Rate the SCRIPT's actual performance on each primitive.
- DO NOT copy the current primitive values. Rate what you see.
- If the script is hype-y, "anti_hyperbole" MUST be low (e.g. 0.2), even if the input was high.
- If the script fails to cite sources, "source_attribution" MUST be low.
- Be extremely harsh. If quality is below 0.7, VOTE FAIL.

Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "complaint": "Overall summary of the main failure",
  "examples": ["Specific quotes from the script that failed"],
  "primitive_scores": { 
     "fact_verification": 0.X, 
     "anti_hyperbole": 0.X, 
     "source_attribution": 0.X,
     "temporal_accuracy": 0.X,
     "entertainment_value": 0.X,
     "brevity": 0.X
  }
}`
    });

    const prompt = `Evaluate: "${script}" for Topic: "${topic}". Input Primitives: ${JSON.stringify(primitives)}`;
    const result = await safeGenerateContent(model, prompt);
    return JSON.parse(result.response.text());
}

/**
 * BALANCED JUDGE - Fair, neutral, considers both sides
 */
async function balancedJudgeEvaluation(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<{
    score: number;
    vote: 'pass' | 'fail';
    reasoning: string;
    primitive_scores: Record<string, number>;
}> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the BALANCED JUDGE - fair, neutral, and objective.
EVALUATION GUIDELINES:
- Assess the script's actual performance against the behavioral primitives.
- Be objective. If the script fulfills the constraints well, provide a fair score.
- DO NOT just echo the input primitives; rate the resulting content.

Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "reasoning": "Balanced explanation of your score",
  "primitive_scores": { 
     "fact_verification": 0.X, 
     "anti_hyperbole": 0.X, 
     "source_attribution": 0.X,
     "temporal_accuracy": 0.X,
     "entertainment_value": 0.X,
     "brevity": 0.X
  }
}`
    });

    const prompt = `Evaluate: "${script}" for Topic: "${topic}". Input Primitives: ${JSON.stringify(primitives)}`;
    const result = await safeGenerateContent(model, prompt);
    return JSON.parse(result.response.text());
}

/**
 * OPTIMISTIC REVIEWER - Excitable fan, loves energy
 */
async function optimisticReviewerEvaluation(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<{
    score: number;
    vote: 'pass' | 'fail';
    praise: string;
    primitive_scores: Record<string, number>;
}> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the OPTIMISTIC REVIEWER - an excitable sports fan.
REVIEW GUIDELINES:
- Look for what WORKS. Be generous.
- Rate the script based on how well it engages the audience.
- Even you must recognize if primitives are totally ignored, but spin it positively.

Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "praise": "Enthusiastic summary of what worked",
  "primitive_scores": { 
     "fact_verification": 0.X, 
     "anti_hyperbole": 0.X, 
     "source_attribution": 0.X,
     "temporal_accuracy": 0.X,
     "entertainment_value": 0.X,
     "brevity": 0.X
  }
}`
    });

    const prompt = `Evaluate: "${script}" for Topic: "${topic}". Input Primitives: ${JSON.stringify(primitives)}`;
    const result = await safeGenerateContent(model, prompt);
    return JSON.parse(result.response.text());
}

/**
 * MULTI-AGENT CONSENSUS with distinct personalities
 */
export async function evaluateWithTunedConsensus(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<{
    agent_votes: any;
    consensus_score: number;
    final_vote: 'pass' | 'fail';
    consensus_strength: number;
    primary_complaint?: string;
    disputed_primitives: string[];
    latency_ms: number;
    primitive_scores: Record<string, number>;
}> {
    const startTime = Date.now();

    const [strict, balanced, optimistic] = await Promise.all([
        strictCriticEvaluation(script, topic, primitives),
        balancedJudgeEvaluation(script, topic, primitives),
        optimisticReviewerEvaluation(script, topic, primitives),
    ]);

    const consensus_score = (strict.score * 0.3 + balanced.score * 0.4 + optimistic.score * 0.3);
    const passVotes = [strict.vote, balanced.vote, optimistic.vote].filter(v => v === 'pass').length;
    const final_vote = passVotes >= 2 ? 'pass' : 'fail';

    const avg = (strict.score + balanced.score + optimistic.score) / 3;
    const variance = ([strict.score, balanced.score, optimistic.score]).reduce((s, x) => s + Math.pow(x - avg, 2), 0) / 3;
    const consensus_strength = 1 - Math.min(variance / 0.25, 1);

    // Aggregate primitive scores
    const primitive_scores: Record<string, number> = {};
    const primKeys = Object.keys(strict.primitive_scores);
    for (const k of primKeys) {
        primitive_scores[k] = (
            (strict.primitive_scores[k] || 0) * 0.3 +
            (balanced.primitive_scores[k] || 0) * 0.4 +
            (optimistic.primitive_scores[k] || 0) * 0.3
        );
    }

    return {
        agent_votes: { strict_critic: strict, balanced_judge: balanced, optimistic_reviewer: optimistic },
        consensus_score,
        final_vote,
        consensus_strength,
        primary_complaint: final_vote === 'fail' ? strict.complaint : (strict.vote === 'fail' ? strict.complaint : undefined),
        disputed_primitives: [],
        latency_ms: Date.now() - startTime,
        primitive_scores
    };
}
