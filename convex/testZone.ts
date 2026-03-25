import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates the Vidyalankar Institute of Technology test zone and accountability data.
 * Run this once via 'npx convex run testZone:createVidyalankarZone'
 */
export const createVidyalankarZone = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Check if it already exists
        const existing = await ctx.db
            .query("geoFences")
            .filter((q) => q.eq(q.field("name"), "Vidyalankar Institute of Technology"))
            .first();

        if (existing) return { status: "exists", id: existing._id };

        // 2. Create the Geofence
        const zoneId = await ctx.db.insert("geoFences", {
            name: "Vidyalankar Institute of Technology",
            description: "Center of educational excellence in Wadala, Mumbai.",
            type: "college",
            status: "active",
            center: { lat: 19.0216, lng: 72.8708 },
            radius: 400, // 400 meters
            triggerCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 3. Create Blockchain Accountability Record
        await ctx.db.insert("accountabilityRecords", {
            zoneId: zoneId,
            zoneName: "Vidyalankar Institute of Technology",
            officialName: "Shri. Rajesh Patil",
            officialPost: "Regional MLA & Education Overseer",
            partyName: "Independent / Local Coalition",
            projectClaim: "Smart Student Transit & Safety Upgrade",
            startDate: "2025-06-01",
            claimedCompletionDate: "2026-03-30",
            actualStatus: "95% Complete (Testing Phase)",
            dataHash: "a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2",
            txHash: "0x4f5e6d7c8b9a0f1e2d3c4b5a6978890abcdef1234567890abcdef",
            createdAt: Date.now(),
        });

        // 4. Add a sample report for better visualization
        await ctx.db.insert("reports", {
            userId: "tester_01",
            userName: "Student Council VIT",
            geoFenceId: zoneId,
            content: "Smart lighting installed on the main approach road is working perfectly. Feeling much safer during late-night studies!",
            type: "verification",
            status: "resolved",
            actionRequests: 0,
            likes: 15,
            createdAt: Date.now(),
        });

        return { status: "created", id: zoneId };
    },
});
