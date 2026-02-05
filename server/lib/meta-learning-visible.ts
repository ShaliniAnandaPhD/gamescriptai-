import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from './run-context';
import { safeGenerateContent } from './gemini-utils';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const geminiPro = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Meta-learning with VISIBLE reasoning
 */
export async function calculateVisibleAdaptiveMutation(
    primaryComplaint: string,
    primitiveScores: Record<string, number>,
    consensusScore: number,
    episodeHistory: any[]
): Promise<{
    correlations_analyzed: number;
    patterns_matched: string[];
    historical_effectiveness: any[];
    recommended_mutation_size: number;
    reasoning: string;
    confidence: number;
    latency_ms: number;
}> {
    const startTime = Date.now();

    console.log('🧠 Meta-learning analyzing failure pattern...');

    // Get historical data
    let mutationHistory: any[] = [];
    let correlations: any[] = [];

    try {
        mutationHistory = await kv.lrange('primitive_mutations', 0, 49) || [];
        // @ts-ignore
        correlations = await kv.get('meta:correlations') || [];
    } catch (e) {
        console.warn('Could not fetch historical data from KV, using defaults');
    }

    const prompt = `You are the META-LEARNING ENGINE analyzing a quality failure.

PRIMARY COMPLAINT: "${primaryComplaint}"
CONSENSUS SCORE: ${consensusScore.toFixed(2)}
PRIMITIVE SCORES: ${JSON.stringify(primitiveScores, null, 2)}

HISTORICAL DATA:
- Total past episodes: ${episodeHistory.length}
- Past mutations: ${mutationHistory.length}
- Known correlations: ${JSON.stringify(correlations, null, 2)}

YOUR JOB:
Analyze this failure pattern and recommend the OPTIMAL mutation size.

Consider:
1. Severity of the issue (lower score = larger mutation)
2. Historical effectiveness (what worked before for similar failures?)
3. Correlations (will this mutation negatively impact other primitives?)
4. Pattern matching (have we seen this failure type before?)

Return JSON (exactly in this format):
{
  "correlations_analyzed": 7,
  "patterns_matched": ["Similar hyperbole failures in episodes 12, 34, 47"],
  "historical_effectiveness": [
    {
      "primitive": "anti_hyperbole",
      "similar_failures": 8,
      "avg_mutation_size": 0.12,
      "success_rate": 0.875
    }
  ],
  "recommended_mutation_size": 0.XX,
  "reasoning": "DETAILED explanation of why this specific mutation size is optimal. Reference historical data, correlations, and severity.",
  "confidence": 0.XX
}

BE SPECIFIC. The user needs to understand WHY you chose this mutation size.`;

    try {
        const result = await safeGenerateContent(geminiPro, prompt);
        const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();

        const analysis = JSON.parse(text);
        console.log(`   Recommended mutation: ${analysis.recommended_mutation_size.toFixed(3)}`);
        console.log(`   Reasoning: ${analysis.reasoning.substring(0, 100)}...`);

        return {
            ...analysis,
            latency_ms: Date.now() - startTime,
        };
    } catch (e) {
        console.error('Meta-learning call failed:', e);
        // Fallback analysis
        return {
            correlations_analyzed: 0,
            patterns_matched: ["Fallback analysis due to error"],
            historical_effectiveness: [],
            recommended_mutation_size: 0.10,
            reasoning: "A default mutation of 0.10 was applied as the meta-learning model failed or returned an unparseable response.",
            confidence: 0.5,
            latency_ms: Date.now() - startTime,
        };
    }
}
