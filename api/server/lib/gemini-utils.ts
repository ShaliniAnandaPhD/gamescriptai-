import { GenerativeModel, Content } from '@google/generative-ai';

/**
 * Robustly calls Gemini with exponential backoff for 429 Resource Exhaustion
 */
export async function safeGenerateContent(
    model: GenerativeModel,
    prompt: string | Content[],
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        responseMimeType?: string;
        responseSchema?: any;
    } = {}
) {
    const { maxRetries = 3, baseDelayMs = 2000 } = options;
    let attempt = 0;

    const contents = typeof prompt === 'string'
        ? [{ role: "user", parts: [{ text: prompt }] }]
        : prompt;

    while (attempt <= maxRetries) {
        try {
            const result = await model.generateContent({
                contents,
                generationConfig: {
                    responseMimeType: options.responseMimeType || "application/json",
                    // @ts-ignore
                    responseSchema: options.responseSchema,
                }
            });

            if (!result || !result.response) {
                throw new Error('Empty response from Gemini');
            }

            return result;
        } catch (error: any) {
            const isRateLimit = error.message?.includes('429') || error.message?.includes('Resource exhausted');
            const isModelError = error.message?.includes('404') || error.message?.includes('not found');

            if (isRateLimit && attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                console.warn(`⏳ Gemini rate limited. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(r => setTimeout(r, delay));
                attempt++;
                continue;
            }

            if (isModelError) {
                console.error('❌ Gemini Model Error:', error.message);
                throw error;
            }

            console.error('❌ Gemini Error:', error.message);
            throw error;
        }
    }

    throw new Error('Max retries reached for Gemini call');
}
