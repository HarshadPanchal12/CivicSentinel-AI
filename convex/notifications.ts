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
    handler: async (ctx, args) => {
        // 1. Get user's push token
        const tokenRecord = await ctx.runQuery(api.notifications.getPushToken, {
            userId: args.userId,
        });
        if (!tokenRecord?.pushToken) {
            console.log(`[CivicSentinel] No push token for user ${args.userId}`);
            return { sent: false, reason: 'no_token' };
        }

        // 2. Call Gemini AI to generate personalised zone briefing
        const geminiPayload = await generateAIBriefing(args.zoneName, args.zoneData);

        // 3. Build Expo push message
        const message = {
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
                screen: 'ZoneDetail', // tells app which screen to open
            },
            badge: 1,
            channelId: 'zone-alerts', // Android channel
        };

        // 4. Send via Expo Push API
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();

        // 5. Log to Convex for audit trail
        await ctx.runMutation(api.notifications.logNotification, {
            userId: args.userId,
            type: 'zone_entry',
            title: geminiPayload.title,
            body: geminiPayload.body,
            zoneId: args.geoFenceId,
            zoneName: args.zoneName,
            sentAt: Date.now(),
            status: result?.data?.status ?? 'unknown',
        });

        return { sent: true, result };
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
        sentAt: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('notificationLog', args);
    },
});

// ── Helper: call Gemini to write the notification content ────────────────────
async function generateAIBriefing(zoneName: string, zoneData: any) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        // Fallback if key not set
        return {
            title: `📍 You entered ${zoneName}`,
            body: `${zoneData?.openIssues ?? 0} open issues reported here. Tap to see the latest updates.`,
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

Write a SHORT, INFORMATIVE push notification (max 2 sentences) that:
1. Tells the citizen what's happening in their current zone RIGHT NOW
2. Mentions any active government work or safety concerns
3. Encourages civic participation

Respond ONLY with JSON: { "title": "...", "body": "..." }
Title: max 50 chars. Body: max 120 chars. Be specific, not generic.
`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 150 },
                }),
            }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error('[CivicSentinel] Gemini failed:', e);
        return {
            title: `📍 You entered ${zoneName}`,
            body: `${zoneData?.openIssues ?? 0} open issues reported. Tap to view updates.`,
        };
    }
}
