import { GoogleGenerativeAI } from '@google/generative-ai';
import { Primitives } from '../primitives';

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
            temperature: 0.1, // Very strict, low creativity
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the STRICT CRITIC - a cynical, pedantic editor who HATES hype.
Find EVERY flaw. Be HARSH.
Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "complaint": "...",
  "examples": ["..."],
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

    const result = await model.generateContent(`Evaluate: "${script}" for Topic: "${topic}". Primitives: ${JSON.stringify(primitives)}`);
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
            temperature: 0.3, // Balanced
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the BALANCED JUDGE - fair, neutral, and objective.
Provide a balanced assessment.
Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "reasoning": "...",
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

    const result = await model.generateContent(`Evaluate: "${script}" for Topic: "${topic}". Primitives: ${JSON.stringify(primitives)}`);
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
            temperature: 0.5, // More creative, enthusiastic
            responseMimeType: "application/json",
        },
        systemInstruction: `You are the OPTIMISTIC REVIEWER - an excitable sports fan.
Look for what WORKS. Be generous.
Return JSON:
{
  "score": 0.XX,
  "vote": "pass" | "fail",
  "praise": "...",
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

    const result = await model.generateContent(`Evaluate: "${script}" for Topic: "${topic}". Primitives: ${JSON.stringify(primitives)}`);
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
        primary_complaint: final_vote === 'fail' ? strict.complaint : undefined,
        disputed_primitives: [],
        latency_ms: Date.now() - startTime,
        primitive_scores
    };
}
