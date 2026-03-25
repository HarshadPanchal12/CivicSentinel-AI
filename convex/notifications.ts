import { mutation, action, query } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// ── Save push token when user opens the app ───────────────────────────────────
export const savePushToken = mutation({
    args: {
        userId: v.string(),
        pushToken: v.string(),
        platform: v.string(), // 'ios' | 'android'
    },
    handler: async (ctx, args) => {
        // Check if token already exists for this user
        const existing = await ctx.db
            .query('pushTokens')
            .withIndex('by_userId', q => q.eq('userId', args.userId))
            .first();

        if (existing) {
            // Update if token changed (reinstall, etc.)
            if (existing.pushToken !== args.pushToken) {
                await ctx.db.patch(existing._id, { pushToken: args.pushToken, updatedAt: Date.now() });
            }
        } else {
            await ctx.db.insert('pushTokens', {
                userId: args.userId,
                pushToken: args.pushToken,
                platform: args.platform,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

// ── Get push token for a user ─────────────────────────────────────────────────
export const getPushToken = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('pushTokens')
            .withIndex('by_userId', q => q.eq('userId', args.userId))
            .first();
    },
});

// ── Get all tokens for users currently in a zone ─────────────────────────────
export const getTokensForZone = query({
    args: { geoFenceId: v.id('geoFences') },
    handler: async (ctx, args) => {
        // Find users who entered this zone recently (last 2 hours)
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        const entries = await ctx.db
            .query('zoneEntries')
            .withIndex('by_geoFenceId', q => q.eq('geoFenceId', args.geoFenceId))
            .filter(q => q.gt(q.field('enteredAt'), twoHoursAgo))
            .collect();

        // Get push tokens for those users
        const tokens = await Promise.all(
            entries.map(async (e) => {
                const tokenRecord = await ctx.db
                    .query('pushTokens')
                    .withIndex('by_userId', q => q.eq('userId', e.userId))
                    .first();
                return tokenRecord?.pushToken ?? null;
            })
        );

        return tokens.filter(Boolean) as string[];
    },
});

// ── Main action: called by Goapify webhook → sends AI notification to user ────
// This is the BRIDGE between your web app and the mobile user.
export const sendZoneEntryNotification = action({
    args: {
        userId: v.string(),
        geoFenceId: v.string(),
        zoneName: v.string(),
        zoneData: v.any(), // open issues count, recent work, etc.
    },
    handler: async (ctx, args): Promise<any> => {
        // 1. Get user's push token
        const tokenRecord: any = await ctx.runQuery(api.notifications.getPushToken, {
            userId: args.userId,
        });
        if (!tokenRecord?.pushToken) {
            console.log(`[CivicSentinel] No push token for user ${args.userId}`);
            return { sent: false, reason: 'no_token' };
        }

        // Fetch blockchain accountability data for this zone
        const accountability: any = await ctx.runQuery(api.blockchain.getByZone, {
            zoneId: args.geoFenceId,
        });

        // 3. Call Gemini AI to generate personalised zone briefing
        const geminiPayload: any = await generateAIBriefing(args.zoneName, args.zoneData, accountability);

        // 4. Build Expo push message
        const message: any = {
            to: tokenRecord.pushToken,
            sound: 'default',
            title: geminiPayload.title,
            body: geminiPayload.body,
            data: {
                type: 'zone_entry',
                zoneId: args.geoFenceId,
                zoneName: args.zoneName,
                openIssues: args.zoneData?.openIssues ?? 0,
                workStatus: args.zoneData?.workStatus ?? null,
                screen: 'ZoneDetail',
                // Blockchain accountability data for the app to display
                officialName: accountability?.officialName ?? null,
                officialPost: accountability?.officialPost ?? null,
                partyName: accountability?.partyName ?? null,
                projectClaim: accountability?.projectClaim ?? null,
                actualStatus: accountability?.actualStatus ?? null,
                txHash: accountability?.txHash ?? null,
                dataHash: accountability?.dataHash ?? null,
            },
            badge: 1,
            channelId: 'zone-alerts',
        };

        // 4. Send via Expo Push API
        const response: any = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
            },
            body: JSON.stringify(message),
        });

        const result: any = await response.json();

        // 5. Log to Convex for audit trail with rich metadata
        await ctx.runMutation(api.notifications.logNotification, {
            userId: args.userId,
            type: 'zone_entry',
            title: geminiPayload.title,
            body: geminiPayload.body,
            zoneId: args.geoFenceId,
            zoneName: args.zoneName,
            officialName: accountability?.officialName,
            projectClaim: accountability?.projectClaim,
            advantages: accountability?.actualStatus, // We use actualStatus as a proxy for 'advantages' or we could add a specific field
            txHash: accountability?.txHash,
            sentAt: Date.now(),
            status: result?.data?.status ?? 'unknown',
        });

        return { sent: true, result };
    },
});

// ── Log zone entry and trigger push (called by mobile app) ────────────────────
export const logZoneEntry = mutation({
    args: {
        userId: v.string(),
        geoFenceId: v.id('geoFences'),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const thirtyMinsAgo = now - (30 * 60 * 1000);

        // 1. Debounce: Check if we notified this user for this zone recently
        const recentEntry = await ctx.db
            .query('zoneEntries')
            .withIndex('by_userId', q => q.eq('userId', args.userId))
            .filter(q =>
                q.and(
                    q.eq(q.field('geoFenceId'), args.geoFenceId),
                    q.gt(q.field('enteredAt'), thirtyMinsAgo)
                )
            )
            .first();

        if (recentEntry && recentEntry.notified) {
            console.log(`[CivicSentinel] Skipping notification for ${args.userId} in ${args.geoFenceId} (already notified recently)`);
            return { status: 'skipped_debounced' };
        }

        // 2. Fetch zone details for the AI prompt
        const zone = await ctx.db.get(args.geoFenceId);
        if (!zone) return { status: 'error_zone_not_found' };

        // 3. Log the entry
        await ctx.db.insert('zoneEntries', {
            userId: args.userId,
            geoFenceId: args.geoFenceId,
            enteredAt: now,
            notified: true,
        });

        // 4. Schedule the AI Push Notification Action (runs in background)
        // We pass mocked/real zone data based on reports
        const reports = await ctx.db
            .query('reports')
            .withIndex('by_geoFenceId', q => q.eq('geoFenceId', args.geoFenceId))
            .collect();

        await ctx.scheduler.runAfter(0, api.notifications.sendZoneEntryNotification, {
            userId: args.userId,
            geoFenceId: args.geoFenceId,
            zoneName: zone.name,
            zoneData: {
                openIssues: reports.filter(r => r.status === 'open').length,
                recentWork: "General maintenance",
                workStatus: "Active",
                type: zone.type,
            }
        });

        return { status: 'pushed_to_ai' };
    },
});

// ── Log notification for in-app history ──────────────────────────────────────
export const logNotification = mutation({
    args: {
        userId: v.string(),
        type: v.string(),
        title: v.string(),
        body: v.string(),
        zoneId: v.optional(v.string()),
        zoneName: v.optional(v.string()),
        officialName: v.optional(v.string()),
        projectClaim: v.optional(v.string()),
        advantages: v.optional(v.string()),
        txHash: v.optional(v.string()),
        sentAt: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('notificationLog', args);
    },
});

export const listLogs = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notificationLog")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(25);
    },
});

// ── Legacy send mutation for automated alerts (used by ai.ts) ──────────────────
export const send = mutation({
    args: {
        projectId: v.id("projects"),
        title: v.string(),
        content: v.string(),
        type: v.string(),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("notifications", {
            ...args,
            type: args.type as any,
            status: "sent",
            createdAt: Date.now(),
        });
    },
});

// ── Dashboard Queries ────────────────────────────────────────────────────────
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("notifications")
            .order("desc")
            .take(50);
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const notifications = await ctx.db.query("notifications").collect();
        const sent = notifications.filter(n => n.status === "sent").length;
        const delivered = notifications.filter(n => n.status === "delivered").length;
        const read = notifications.filter(n => n.status === "read").length;

        return {
            total: notifications.length,
            sent,
            delivered,
            read,
        };
    },
});

// ── Helper: call Gemini to write the notification content ────────────────────
async function generateAIBriefing(zoneName: string, zoneData: any, accountability: any) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Build accountability context string
    const officialInfo = accountability
        ? `\nGovernment Accountability (blockchain-verified):
- Official: ${accountability.officialName} (${accountability.officialPost})
- Party: ${accountability.partyName}
- Project claim: ${accountability.projectClaim}
- Started: ${accountability.startDate} → Claimed done by: ${accountability.claimedCompletionDate}
- Actual status: ${accountability.actualStatus}
- Blockchain verified: ${accountability.txHash ? 'Yes ✅' : 'Pending'}`
        : '\nNo government accountability records found for this zone.';

    if (!GEMINI_API_KEY) {
        // Fallback if key not set
        const fallbackBody = accountability
            ? `🏗️ ${accountability.officialName} (${accountability.partyName}) claimed: "${accountability.projectClaim}" — Status: ${accountability.actualStatus}. 🔗 Chain verified.`
            : `${zoneData?.openIssues ?? 0} open issues reported here. Tap to see the latest updates.`;
        return {
            title: `📍 You entered ${zoneName}`,
            body: fallbackBody,
        };
    }

    const prompt = `
You are CivicSentinel AI, a civic engagement assistant for Indian citizens.
A user just entered this geofence zone: "${zoneName}".

Zone data:
- Open issues: ${zoneData?.openIssues ?? 0}
- Recent govt work: ${zoneData?.recentWork ?? 'None recorded'}
- Work status: ${zoneData?.workStatus ?? 'No active work'}
- Last inspection: ${zoneData?.lastInspected ?? 'Unknown'}
- Zone type: ${zoneData?.type ?? 'General'}
${officialInfo}

Write a SHORT, INFORMATIVE push notification (max 2 sentences) that:
1. Tells the citizen what's happening in their current zone RIGHT NOW
2. If accountability data exists, mention the official's name and project status
3. If the project is incomplete despite claims, highlight the gap
4. Add "🔗 Verified on blockchain" if txHash exists

Respond ONLY with JSON: { "title": "...", "body": "..." }
Title: max 50 chars. Body: max 180 chars. Be specific, not generic.
`;

    let text = '';
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
                }),
            }
        );
        const data: any = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("No JSON found in Gemini response");
        }
    } catch (e) {
        console.error('[CivicSentinel] Gemini AI briefing failed:', e);
        console.log("Gemini Raw Text:", text);
        const fallbackBody = accountability
            ? `🏗️ ${accountability.officialName} (${accountability.partyName}): ${accountability.actualStatus}. Tap to view details.`
            : `${zoneData?.openIssues ?? 0} open issues reported. Tap to view updates.`;
        return {
            title: `📍 You entered ${zoneName}`,
            body: fallbackBody,
        };
    }
}
