import { geminiPro } from '../gemini-enhanced';
import { type Primitives } from '../primitives';

interface QualityPrediction {
    predicted_quality: number;
    confidence: number;
    risk_factors: {
        primitive: string;
        risk_level: 'low' | 'medium' | 'high';
        reason: string;
    }[];
    recommended_adjustments: {
        primitive: string;
        current: number;
        recommended: number;
        expected_improvement: number;
    }[];
}

/**
 * PREDICT QUALITY BEFORE GENERATION
 */
export async function predictQuality(
    topic: string,
    primitives: Primitives,
    context?: string
): Promise<QualityPrediction> {
    const prompt = `PREDICTIVE ENGINE: Forecast quality for topic "${topic}".
PRIMITIVES: ${JSON.stringify(primitives)}
${context ? `CONTEXT: ${context}` : ''}

Analyze complexity and risk. 
Return JSON:
{
  "predicted_quality": 0.XX,
  "confidence": 0.XX,
  "risk_factors": [ { "primitive": "...", "risk_level": "...", "reason": "..." } ],
  "recommended_adjustments": [ { "primitive": "...", "current": 0.X, "recommended": 0.X, "expected_improvement": X.X } ]
}`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '');
        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Quality prediction failed:', e);
        return {
            predicted_quality: 0.75,
            confidence: 0.5,
            risk_factors: [],
            recommended_adjustments: []
        };
    }
}
