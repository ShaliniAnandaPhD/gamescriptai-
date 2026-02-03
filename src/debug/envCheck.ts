export const logEnvCheck = () => {
    const token = import.meta.env.VITE_HF_TOKEN;
    const model = import.meta.env.VITE_HF_MODEL;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const hasToken = Boolean(token);
    let tokenPreview = "MISSING";

    if (token && typeof token === "string") {
        const first4 = token.slice(0, 4);
        const last4 = token.slice(-4);
        const len = token.length;
        tokenPreview = `${first4}xxxx…${last4} (len=${len})`;
    }

    const hasGemini = Boolean(geminiKey);
    let geminiPreview = "MISSING";
    if (geminiKey && typeof geminiKey === "string") {
        geminiPreview = `${geminiKey.slice(0, 4)}xxxx…${geminiKey.slice(-4)} (len=${geminiKey.length})`;
    }

    console.log("--- VITE ENV CHECK ---");
    console.log("VITE_HF_TOKEN exists:", hasToken);
    console.log("VITE_HF_TOKEN preview:", tokenPreview);
    console.log("VITE_HF_MODEL:", model);
    console.log("VITE_GEMINI_API_KEY exists:", hasGemini);
    console.log("VITE_GEMINI_API_KEY preview:", geminiPreview);
    console.log("-----------------------");
};
