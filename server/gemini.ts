import type { Primitives } from './primitives';

export async function generateWithGemini(args: {
    apiKey: string;
    model: string;
    topic: string;
    primitives: Primitives;
    mode: 'raw' | 'optimized';
}) {
    const { apiKey, model, topic, primitives, mode } = args;

    const systemPrompt = buildPrompt(topic, primitives, mode);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: systemPrompt
                }]
            }],
            generationConfig: {
                temperature: mode === 'raw' ? 0.9 : 0.7,
                maxOutputTokens: 200,
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return text.trim();
}

function buildPrompt(topic: string, primitives: Primitives, mode: 'raw' | 'optimized'): string {
    if (mode === 'raw') {
        return `Generate a 60-second podcast news segment about: ${topic}

Write it in an energetic, conversational style suitable for audio. Keep it under 150 words.`;
    }

    // Optimized mode - apply primitives
    let constraints = [];

    if (primitives.fact_verification >= 0.8) {
        constraints.push('CRITICAL: Only mention products/models that actually exist. If uncertain, use phrases like "rumored" or "unconfirmed reports suggest".');
    }

    if (primitives.anti_hyperbole >= 0.8) {
        constraints.push('IMPORTANT: Avoid superlatives like "revolutionary", "unprecedented", "earth-shattering". Use measured language.');
    }

    if (primitives.source_attribution >= 0.8) {
        constraints.push('REQUIRED: Include specific sources (e.g., "According to Bloomberg on Jan 15") or dates when making claims.');
    }

    if (primitives.temporal_accuracy >= 0.8) {
        constraints.push('REQUIRED: Use specific dates instead of vague terms like "recently" or "soon".');
    }

    return `Generate a 60-second podcast news segment about: ${topic}

CONSTRAINTS:
${constraints.join('\n')}

Write in a professional, fact-based style. Keep it under 150 words.`;
}
