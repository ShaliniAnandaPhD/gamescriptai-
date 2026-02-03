export const callHuggingFace = async (prompt: string) => {
    const token = import.meta.env.VITE_HF_TOKEN;
    const model = import.meta.env.VITE_HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

    // Task C: Masked logging
    const maskedToken = token ? `${token.slice(0, 4)}xxxx…${token.slice(-4)}` : "MISSING";
    console.log(`[HF] Calling ${model} with masked token: ${maskedToken}`);

    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: prompt }),
            }
        );
        return await response.json();
    } catch (error) {
        console.error("[HF] Error:", error);
        throw error;
    }
};
