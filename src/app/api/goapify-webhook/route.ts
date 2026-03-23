import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Goapify sends this when a user enters or exits a geofence
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[Goapify Webhook] Received:', JSON.stringify(body, null, 2));

        // ── Validate it's a real Goapify event ─────────────────────────────────
        const secret = req.headers.get('x-goapify-secret');
        if (secret !== process.env.GOAPIFY_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Extract event data ─────────────────────────────────────────────────
        const {
            eventType,    // 'enter' | 'exit'
            geofenceId,   // Goapify geofence ID
            geofenceName, // zone name
            userId,       // user ID you passed to Goapify
            timestamp,
            deviceId,
        } = body;

        // We only care about zone entry for now
        if (eventType !== 'enter') {
            return NextResponse.json({ ok: true, skipped: 'exit event' });
        }

        // ── Get zone details from your database ────────────────────────────────
        const zoneData = await getZoneData(geofenceId, geofenceName);

        // ── Trigger Convex action → sends AI notification to user's phone ──────
        await convex.action('notifications:sendZoneEntryNotification' as any, {
            userId: userId || deviceId || "user_citizen_123", // Fallback to demo user if missing
            geoFenceId: geofenceId,
            zoneName: geofenceName || 'Your current zone',
            zoneData,
        });

        // ── Also log the zone entry in Convex ──────────────────────────────────
        await convex.mutation('zoneEntries:logEntry' as any, {
            userId: userId || deviceId || "user_citizen_123",
            geoFenceId: geofenceId,
            enteredAt: Date.now(),
            notified: true,
        });

        return NextResponse.json({ ok: true, sent: true });

    } catch (error) {
        console.error('[Goapify Webhook] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Helper: build zone context for Gemini
async function getZoneData(geofenceId: string, zoneName: string) {
    try {
        return {
            openIssues: 0,
            recentWork: 'None',
            workStatus: 'None',
            lastInspected: 'Unknown',
            type: 'General',
        };
    } catch {
        return { openIssues: 0 };
    }
}
