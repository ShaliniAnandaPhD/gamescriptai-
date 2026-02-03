export const callGemini = async (prompt: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = "gemini-1.5-flash"; // Default fast model

    const maskedKey = apiKey ? `${apiKey.slice(0, 4)}xxxx…${apiKey.slice(-4)}` : "MISSING";
    console.log(`[Gemini] Calling ${model} with masked key: ${maskedKey}`);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                headers: {
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Gemini API call failed");
        }

        return data;
    } catch (error) {
        console.error("[Gemini] Error:", error);
        throw error;
    }
};
