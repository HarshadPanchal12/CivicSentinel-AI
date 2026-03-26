import { action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// ══════════════════════════════════════════════════════════════════════════════
// RAG CUSTOMER QUERY AGENT
// Uses Retrieval-Augmented Generation to answer citizen questions
// about zones, officials, projects, and accountability data.
// ══════════════════════════════════════════════════════════════════════════════

// ── Gather all relevant context from the database ────────────────────────────
async function gatherContext(ctx: any): Promise<string> {
    // 1. All active zones
    const zones = await ctx.runQuery(api.geoFences.listActive);
    const zonesSummary = (zones || []).map((z: any) =>
        `• Zone: "${z.name}" | Type: ${z.type} | Radius: ${z.radius}m | Status: ${z.status} | Triggers: ${z.triggerCount}`
    ).join("\n");

    // 2. All accountability records (officials, project claims, blockchain hashes)
    const records = await ctx.runQuery(api.blockchain.listRecords);
    const recordsSummary = (records || []).map((r: any) =>
        `• ${r.zoneName}: Official=${r.officialName} (${r.officialPost}, ${r.partyName}) | Claim="${r.projectClaim}" | Status="${r.actualStatus}" | Start=${r.startDate} | Deadline=${r.claimedCompletionDate} | BlockchainHash=${r.txHash ? '✅ Verified' : '⏳ Pending'}`
    ).join("\n");

    // 3. Recent reports from citizens
    let reportsSummary = "No reports yet.";
    if (zones && zones.length > 0) {
        try {
            const firstZoneId = (zones[0] as any)._id;
            const reports = await ctx.runQuery(api.reports.listByGeoFence, { geoFenceId: firstZoneId });
            reportsSummary = (reports || []).slice(0, 10).map((r: any) =>
                `• [${r.type}] by ${r.userName}: "${r.content}" | Status: ${r.status} | Actions: ${r.actionRequests} | Likes: ${r.likes}`
            ).join("\n");
        } catch (e) {
            console.error("[RAG Agent] Error fetching reports:", e);
            reportsSummary = "Reports unavailable.";
        }
    }

    return `
=== ACTIVE GEO-FENCED ZONES ===
${zonesSummary || "No zones configured."}

=== GOVERNMENT ACCOUNTABILITY RECORDS (Blockchain-Verified) ===
${recordsSummary || "No accountability records."}

=== RECENT CITIZEN REPORTS ===
${reportsSummary}

=== SYSTEM INFO ===
• Platform: CivicSentinel AI — Hyper-Local Civic Accountability Engine
• Blockchain: Sepolia Testnet (SHA-256 hashing + on-chain anchoring)
• AI: Gemini-powered briefings and analysis
• Geofencing: Automatic notifications when citizens enter monitored zones
`.trim();
}

// ── Main RAG Chat Action ─────────────────────────────────────────────────────
export const chat = action({
    args: {
        question: v.string(),
        history: v.optional(v.array(v.object({
            role: v.string(),
            content: v.string(),
        }))),
    },
    handler: async (ctx, args): Promise<string> => {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return "⚠️ AI is not configured. Please set GEMINI_API_KEY in Convex environment.";
        }

        // 1. Retrieve all context from the database
        const context = await gatherContext(ctx);

        // 2. Build the RAG prompt
        const systemPrompt = `You are CivicSentinel AI Assistant — an expert civic engagement bot for Indian citizens.
You help citizens understand government projects, track official accountability, and navigate their local civic data.

You have access to LIVE data from the CivicSentinel platform:

${context}

RULES:
- Answer based ONLY on the data provided above. If the data doesn't contain the answer, say so honestly.
- Be concise, helpful, and conversational. Use emojis sparingly for clarity.
- When mentioning officials, always include their post and party.
- When mentioning projects, include the current status and blockchain verification.
- If asked about "my zone" or "near me", refer to all active zones.
- For accountability questions, highlight whether promises were kept or delayed.
- Always be factual and neutral — no political bias.
- Format responses for mobile reading (short paragraphs, bullet points).`;

        // 3. Build conversation history
        const messages: any[] = [
            { role: "user", parts: [{ text: systemPrompt + "\n\nUser question: " + args.question }] },
        ];

        // Include conversation history if provided
        if (args.history && args.history.length > 0) {
            const historyContext = args.history.map(h => `${h.role}: ${h.content}`).join("\n");
            messages[0].parts[0].text = systemPrompt + "\n\nPrevious conversation:\n" + historyContext + "\n\nUser question: " + args.question;
        }

        // 4. Call Gemini
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: messages,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 600,
                            topP: 0.9,
                        },
                    }),
                }
            );

            const data: any = await res.json();
            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!answer) {
                console.error("[RAG Agent] No response from Gemini:", JSON.stringify(data));
                return "I couldn't process that question right now. Please try again.";
            }

            return answer.trim();
        } catch (error) {
            console.error("[RAG Agent] Gemini call failed:", error);
            return "⚠️ Connection issue. Please check your internet and try again.";
        }
    },
});
