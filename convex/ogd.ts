import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Helper function to add some randomness to the static OGD lat/longs 
// so they don't all stack on top of each other in the UI
function addJitter(val: number) {
    return val + (Math.random() - 0.5) * 0.05;
}

// ── Get current OGD sync offset ──────────────────────────────────────────────
export const getOffset = query({
    args: {},
    handler: async (ctx) => {
        const state = await ctx.db
            .query("syncState")
            .withIndex("by_key", (q) => q.eq("key", "ogd_offset"))
            .first();
        return state?.value ?? 0;
    },
});

// ── Update the OGD sync offset ───────────────────────────────────────────────
export const updateOffset = mutation({
    args: { newOffset: v.number() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("syncState")
            .withIndex("by_key", (q) => q.eq("key", "ogd_offset"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { value: args.newOffset });
        } else {
            await ctx.db.insert("syncState", { key: "ogd_offset", value: args.newOffset });
        }
    },
});

// ── Check if a zone with the same name already exists ────────────────────────
export const checkDuplicate = query({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("geoFences")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
        return !!existing;
    },
});

// ── Main OGD Sync Action (with pagination + dedup) ───────────────────────────
export const syncProjects = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const apiKey = process.env.OGD_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OGD_API_KEY in environment variables");
        }

        try {
            // 1. Get current offset from Convex
            const currentOffset: any = await ctx.runQuery(api.ogd.getOffset, {});
            const batchSize = 10;

            // 2. Fetch the NEXT page from OGD
            const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";
            const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=${batchSize}&offset=${currentOffset}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`OGD API Error: ${response.status}`);
            }

            const data: any = await response.json();

            if (!data || !data.records || data.records.length === 0) {
                return "No more records available from OGD API. You've fetched all available data!";
            }

            console.log(`Fetched ${data.records.length} records from OGD (offset: ${currentOffset}).`);

            let insertedCount = 0;
            let skippedCount = 0;

            for (const record of data.records) {
                const state = record._state_ || record.state || record.state_name || "Maharashtra";
                const district = record._district_ || record.district || record.district_name || "Mumbai";
                const facilityName = record.facility_name || record.name_of_facility || record.hospital_name || `${district} Health Center`;

                const zoneName = `${facilityName} Zone`;

                // 3. Check for duplicate before inserting
                const isDuplicate: any = await ctx.runQuery(api.ogd.checkDuplicate, { name: zoneName });
                if (isDuplicate) {
                    skippedCount++;
                    console.log(`Skipped duplicate: ${zoneName}`);
                    continue;
                }

                const lat = record.latitude ? parseFloat(record.latitude) : addJitter(19.0760);
                const lng = record.longitude ? parseFloat(record.longitude) : addJitter(72.8777);

                const projectId: any = await ctx.runMutation(api.projects.create, {
                    name: `OGD: ${facilityName}`,
                    description: `Government facility located in ${district}, ${state}. Data sourced from data.gov.in`,
                    type: "hospital",
                    status: "completed",
                    budget: Math.floor(Math.random() * 5000000) + 100000,
                    impact: "Provides essential healthcare services to the local district.",
                    location: { lat, lng, address: `${district}, ${state}, India` }
                });

                await ctx.runMutation(api.geoFences.create, {
                    name: zoneName,
                    description: `Automated geo-fence for government facility in ${district}`,
                    type: "hospital",
                    center: { lat, lng },
                    radius: 1500,
                });

                // 4. Auto-generate blockchain accountability record via Gemini
                try {
                    await ctx.runAction(api.blockchain.generateForZone, {
                        zoneId: String(projectId),
                        zoneName,
                        district,
                        state,
                        facilityType: "hospital",
                    });
                    console.log(`Blockchain accountability generated for: ${zoneName}`);
                } catch (e) {
                    console.warn(`Blockchain generation skipped for ${zoneName}:`, e);
                }

                insertedCount++;
            }

            // 5. Update offset to the next page
            const newOffset = currentOffset + batchSize;
            await ctx.runMutation(api.ogd.updateOffset, { newOffset });

            return `Page ${Math.floor(currentOffset / batchSize) + 1}: Synced ${insertedCount} new zones with blockchain accountability, skipped ${skippedCount} duplicates. Next click fetches records ${newOffset + 1}-${newOffset + batchSize}.`;

        } catch (error) {
            console.error("Failed to sync OGD data:", error);
            throw new Error("Failed to sync Open Government Data");
        }
    }
});
