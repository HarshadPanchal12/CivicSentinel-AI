import { GoogleGenerativeAI } from "@google/generative-ai";

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key provided.");
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Attempt to list models to see what this key has access to
        console.log("Fetching accessible models...");

        // Note: The Node SDK might not directly expose listModels in all versions, 
        // but we can try a direct fetch if needed, or just try the exact flash string

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach((m: any) => console.log(`- ${m.name.replace('models/', '')}`));
        } else {
            console.log("Response:", data);
        }

    } catch (err) {
        console.error("Diagnostic error:", err);
    }
}

run();
