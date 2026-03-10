import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(
            v.literal("hospital"), v.literal("bridge"), v.literal("road"),
            v.literal("school"), v.literal("metro"), v.literal("college"),
            v.literal("government_office"), v.literal("other")
        ),
        center: v.object({ lat: v.number(), lng: v.number() }),
        radius: v.number(),
        polygon: v.optional(v.array(v.object({ lat: v.number(), lng: v.number() }))),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("geoFences", {
            ...args,
            status: "active",
            triggerCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("geoFences"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
        radius: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("geoFences") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("geoFences").collect();
    },
});

export const getById = query({
    args: { id: v.id("geoFences") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const listActive = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("geoFences")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();
    },
});

export const incrementTrigger = mutation({
    args: { id: v.id("geoFences") },
    handler: async (ctx, args) => {
        const fence = await ctx.db.get(args.id);
        if (fence) {
            await ctx.db.patch(args.id, {
                triggerCount: fence.triggerCount + 1,
                updatedAt: Date.now(),
            });
        }
    },
});

export const incrementByProjectId = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const fence = await ctx.db
            .query("geoFences")
            .filter((q) => q.eq(q.field("linkedProjectId"), args.projectId))
            .first();

        if (fence) {
            await ctx.db.patch(fence._id, {
                triggerCount: (fence.triggerCount || 0) + 1,
                updatedAt: Date.now(),
            });
        } else {
            // Fallback for old seeded data or OGD syncs before foreign key was added
            const project = await ctx.db.get(args.projectId);
            if (project && project.location) {
                const fences = await ctx.db.query("geoFences").collect();
                // Find matching fence by exact lat/lang or name substring
                const matching = fences.find(f => Math.abs(f.center.lat - project.location!.lat) < 0.001);

                if (matching) {
                    await ctx.db.patch(matching._id, {
                        triggerCount: (matching.triggerCount || 0) + 1,
                        linkedProjectId: project._id
                    });
                }
            }
        }
    }
});
