import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");
    try {
        // There isn't a direct 'listModels' in this specific SDK version easily accessible
        // but we can try to call a basic generate on Pro and Flash to see which fails.

        console.log('Testing gemini-1.5-pro...');
        try {
            const pro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const res = await pro.generateContent("hi");
            console.log('✅ gemini-1.5-pro works');
        } catch (e: any) {
            console.log('❌ gemini-1.5-pro fails:', e.message);
        }

        console.log('\nTesting gemini-1.5-flash...');
        try {
            const flash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const res = await flash.generateContent("hi");
            console.log('✅ gemini-1.5-flash works');
        } catch (e: any) {
            console.log('❌ gemini-1.5-flash fails:', e.message);
        }

        console.log('\nTesting gemini-2.0-flash-exp...');
        try {
            const flash2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const res = await flash2.generateContent("hi");
            console.log('✅ gemini-2.0-flash-exp works');
        } catch (e: any) {
            console.log('❌ gemini-2.0-flash-exp fails:', e.message);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

listModels();
