import { geminiPro } from '../gemini-enhanced';
import { safeGenerateContent } from './gemini-utils';
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
        const result = await safeGenerateContent(geminiPro, prompt, {
            responseSchema: {
                type: 'object',
                properties: {
                    predicted_quality: { type: 'number' },
                    confidence: { type: 'number' },
                    risk_factors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                primitive: { type: 'string' },
                                risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                                reason: { type: 'string' }
                            },
                            required: ['primitive', 'risk_level', 'reason']
                        }
                    },
                    recommended_adjustments: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                primitive: { type: 'string' },
                                current: { type: 'number' },
                                recommended: { type: 'number' },
                                expected_improvement: { type: 'number' }
                            },
                            required: ['primitive', 'current', 'recommended', 'expected_improvement']
                        }
                    }
                },
                required: ['predicted_quality', 'confidence', 'risk_factors', 'recommended_adjustments']
            }
        });

        const text = result.response.text();
        return JSON.parse(text);
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
