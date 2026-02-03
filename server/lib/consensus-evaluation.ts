import { GoogleGenerativeAI } from '@google/generative-ai';
import { type Primitives } from '../primitives';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

const evaluatorConfigs = [
    {
        name: "Strict Critic",
        temperature: 0.1,
        bias: "conservative",
    },
    {
        name: "Balanced Judge",
        temperature: 0.3,
        bias: "neutral",
    },
    {
        name: "Optimistic Reviewer",
        temperature: 0.5,
        bias: "lenient",
    }
];

interface EvaluatorOpinion {
    evaluator: string;
    scores: Record<string, number>;
    overall_quality: number;
    gate_passed: boolean;
    reasoning: string[];
    confidence: number;
}

interface ConsensusResult {
    final_scores: Record<string, number>;
    overall_quality: number;
    gate_passed: boolean;
    consensus_strength: number;
    individual_opinions: EvaluatorOpinion[];
    debate_summary: string;
    disputed_primitives: string[];
}

export async function evaluateWithConsensus(
    script: string,
    topic: string,
    primitives: Primitives
): Promise<ConsensusResult> {
    console.log('🗣️  Starting multi-agent consensus evaluation...');

    // Run 3 parallel evaluations
    const evaluations = await Promise.all(
        evaluatorConfigs.map(config =>
            runSingleEvaluation(script, topic, primitives, config)
        )
    );

    // Synthesize consensus
    const consensus = await synthesizeConsensus(evaluations, script, primitives);

    return consensus;
}

async function runSingleEvaluation(
    script: string,
    topic: string,
    primitives: Primitives,
    config: typeof evaluatorConfigs[0]
): Promise<EvaluatorOpinion> {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
            temperature: config.temperature,
            responseMimeType: "application/json",
        }
    });

    const prompt = `You are "${config.name}", a ${config.bias} evaluator for a sports newsroom.

SCRIPT TO EVALUATE: "${script}"
TOPIC: "${topic}"
PRIMITIVES: ${JSON.stringify(primitives)}

${config.bias === 'conservative' ?
            'You are highly critical. High standards.' :
            config.bias === 'lenient' ?
                'You are generous, focus on what works.' :
                'You are balanced and fair.'}

Evaluate each primitive (0.0-1.0) and provide reasoning.

Return JSON:
{
  "evaluator": "${config.name}",
  "scores": { ... },
  "overall_quality": 0.XX,
  "gate_passed": true/false,
  "reasoning": ["..."],
  "confidence": 0.XX
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(cleanText);
    } catch (e) {
        console.error(`Evaluation by ${config.name} failed:`, e);
        return {
            evaluator: config.name,
            scores: {},
            overall_quality: 0.5,
            gate_passed: false,
            reasoning: ["Evaluation failed"],
            confidence: 0
        };
    }
}

async function synthesizeConsensus(
    opinions: EvaluatorOpinion[],
    script: string,
    primitives: Primitives
): Promise<ConsensusResult> {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        }
    });

    const prompt = `Synthesize consensus from 3 AI evaluators:
${JSON.stringify(opinions, null, 2)}

TASK:
1. Weight scores by confidence.
2. Flag primitives with >0.20 variance as "disputed".
3. Calculate consensus strength (0.0-1.0).
4. Determine final gate_passed by weighted majority.

Return JSON:
{
  "final_scores": { ... },
  "overall_quality": 0.XX,
  "gate_passed": true/false,
  "consensus_strength": 0.XX,
  "debate_summary": "...",
  "disputed_primitives": ["..."]
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const consensus = JSON.parse(cleanText);
        return { ...consensus, individual_opinions: opinions };
    } catch (e) {
        console.error('Consensus synthesis failed:', e);
        return {
            final_scores: {},
            overall_quality: 0.5,
            gate_passed: false,
            consensus_strength: 0,
            individual_opinions: opinions,
            debate_summary: "Consensus synthesis failed",
            disputed_primitives: []
        };
    }
}
