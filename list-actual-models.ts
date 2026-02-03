import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`);
        const data = await response.json();
        console.log('Available Models:', JSON.stringify(data.models.map((m: any) => m.name), null, 2));
    } catch (e) {
        console.error('Error listing models:', e);
    }
}

listModels();
