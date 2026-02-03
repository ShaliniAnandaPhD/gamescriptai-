import { geminiPro, geminiFlash, CONSENSUS_SCHEMA } from '../gemini-enhanced';
import { type Primitives } from '../primitives';

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
        const result = await geminiPro.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: config.temperature,
                responseMimeType: "application/json",
            }
        });
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
        console.log('🤖 Synthesizing consensus from opinions...');

        const safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ];

        let result: any = null;
        let retries = 2;
        let currentModel = geminiPro;

        while (retries >= 0) {
            try {
                result = await currentModel.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json",
                        // @ts-ignore
                        responseSchema: CONSENSUS_SCHEMA
                    },
                    safetySettings: safetySettings as any,
                });
                if (result && result.response && result.response.text()) break;
                throw new Error('Empty response');
            } catch (e: any) {
                console.warn(`⏳ Consensus synthesis failed: ${e.message}`);

                if (e.message.indexOf('403') !== -1 || e.message.indexOf('Forbidden') !== -1) {
                    console.warn('🔄 Falling back to Gemini Flash for consensus synthesis');
                    currentModel = geminiFlash;
                    retries = 2;
                    continue;
                }

                if (retries === 0) throw e;
                console.warn(`⏳ Retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 1000));
                retries--;
            }
        }

        if (!result) throw new Error('Failed to get consensus result after retries');

        const text = result.response.text();
        console.log('📄 Raw Synthesis Response size:', text.length);

        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('No JSON object found in synthesis response');
        }

        const rawJson = text.substring(firstBrace, lastBrace + 1);

        const cleanText = rawJson
            .replace(/,(\s*[\]}])/g, '$1')
            .trim();
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
