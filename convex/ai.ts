import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./_generated/api";

export const generateNotification = action({
    args: {
        projectId: v.id("projects"),
        language: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }

        const project = await ctx.runQuery(api.projects.getById, { id: args.projectId });

        if (!project) {
            throw new Error("Project not found");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an automated civic engagement AI for the Hyper-Local Targeting Engine.
      Write a short, empathetic 2-sentence SMS notification for a citizen who just entered the geo-fence for the following government project.
      
      Project Name: "${project.name}"
      Description: "${project.description}"
      Impact: "${project.impact}"
      Status: "${project.status}"

      Output ONLY the SMS text in ${args.language || 'English'}. 
      Do not include quotes around the text. Do not include greetings or conversational filler.
      Make it directly address the citizen, explaining how the project helps them (e.g. saving time, improving health).
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Call the existing send mutation to log it in the database
        await ctx.runMutation(api.notifications.send, {
            projectId: args.projectId,
            title: `AI Proximity Alert: ${project.name}`,
            content: text,
            type: "proximity_alert",
            language: args.language || "en",
        });

        return text;
    }
});
