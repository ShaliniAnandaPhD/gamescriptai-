import { geminiPro } from '../gemini-enhanced';
import { type Primitives } from '../primitives';

// Simple in-memory storage for demo reliability
// In a production environment, this would be backed by Redis or Firestore
const metaStore = new Map<string, any>();

interface PrimitiveCorrelation {
    primitive_a: string;
    primitive_b: string;
    correlation_strength: number; // -1 to 1
    relationship: 'positive' | 'negative' | 'independent';
    explanation: string;
    confidence: number;
}

interface MutationStrategy {
    primitive: string;
    current_value: number;
    recommended_value: number;
    mutation_size: number;
    reasoning: string;
    expected_impact: number;
    confidence: number;
}

interface LearningInsight {
    pattern: string;
    frequency: number;
    success_rate: number;
    recommendation: string;
}

/**
 * META-LEARNING: Discovers correlations between primitives
 */
export async function discoverPrimitiveCorrelations(
    episodeHistory: any[]
): Promise<PrimitiveCorrelation[]> {
    if (episodeHistory.length < 5) {
        // Lowered threshold for hackathon demo
        return [];
    }

    const episodeData = episodeHistory.map(ep => ({
        primitives: ep.primitives_before,
        quality_score: ep.final_eval?.score || 0,
        gate_passed: ep.final_eval?.passed || false,
        issues: ep.final_eval?.issues?.map((i: any) => i.type) || [],
    }));

    const prompt = `You are a data scientist analyzing behavioral primitive correlations for a sports newsroom AI.

EPISODE DATA (${episodeData.length} episodes):
${JSON.stringify(episodeData, null, 2)}

TASK: Discover correlations between primitives.
Analyze:
1. Which primitives move together?
2. Which conflict?
3. Which combinations lead to high quality?

Return a JSON array of correlations:
[
  {
    "primitive_a": "anti_hyperbole",
    "primitive_b": "entertainment_value",
    "correlation_strength": -0.68,
    "relationship": "negative",
    "explanation": "When anti_hyperbole increases, entertainment_value tends to decrease",
    "confidence": 0.85
  }
]`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const correlations: PrimitiveCorrelation[] = JSON.parse(cleanText);

        metaStore.set('meta:correlations', correlations);
        return correlations;
    } catch (e) {
        console.error('Correlation discovery failed:', e);
        return [];
    }
}

/**
 * ADAPTIVE MUTATIONS: AI decides optimal mutation size
 */
export async function calculateAdaptiveMutation(
    primitive: string,
    currentValue: number,
    failureContext: {
        score: number;
        issue_severity: number;
        historical_mutations: any[];
    }
): Promise<MutationStrategy> {
    const prompt = `OPTIMIZATION EXPERT: Recommend optimal mutation for primitive "${primitive}".

CURRENT STATE:
- Value: ${currentValue.toFixed(3)}
- Failure Score: ${failureContext.score.toFixed(3)}
- Severity: ${failureContext.issue_severity.toFixed(3)}

HISTORICAL MUTATIONS:
${JSON.stringify(failureContext.historical_mutations, null, 2)}

Return JSON:
{
  "primitive": "${primitive}",
  "current_value": ${currentValue},
  "recommended_value": 0.XX,
  "mutation_size": 0.XX,
  "reasoning": "...",
  "expected_impact": 0.XX,
  "confidence": 0.XX
}`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Mutation calculation failed:', e);
        return {
            primitive,
            current_value: currentValue,
            recommended_value: currentValue + 0.1,
            mutation_size: 0.1,
            reasoning: 'Fallback mutation applied',
            expected_impact: 0.05,
            confidence: 0.5
        };
    }
}

/**
 * PATTERN RECOGNITION: Learn from historical successes
 */
export async function identifyLearningPatterns(
    episodeHistory: any[]
): Promise<LearningInsight[]> {
    const prompt = `Identify success patterns from ${episodeHistory.length} episodes.
Look for configurations that pass/fail.

Return JSON array:
[
  {
    "pattern": "Episodes with source_attribution > 0.90 have 95% pass rate",
    "frequency": 23,
    "success_rate": 0.95,
    "recommendation": "Maintain source_attribution above 0.90"
  }
]`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        const insights: LearningInsight[] = JSON.parse(cleanText);
        metaStore.set('meta:learning_insights', insights);
        return insights;
    } catch (e) {
        console.error('Pattern identification failed:', e);
        return [];
    }
}

export async function getStoredCorrelations() {
    return metaStore.get('meta:correlations') || [];
}

export async function getStoredInsights() {
    return metaStore.get('meta:learning_insights') || [];
}
