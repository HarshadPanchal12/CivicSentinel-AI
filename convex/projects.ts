import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        type: v.union(
            v.literal("hospital"), v.literal("bridge"), v.literal("road"),
            v.literal("school"), v.literal("metro"), v.literal("college"),
            v.literal("government_office"), v.literal("other")
        ),
        status: v.union(
            v.literal("completed"), v.literal("in_progress"),
            v.literal("planned"), v.literal("delayed")
        ),
        budget: v.number(),
        completionDate: v.optional(v.string()),
        impact: v.string(),
        location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
        boothId: v.optional(v.id("booths")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("projects", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("projects").collect();
    },
});

export const getById = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("projects").collect();
        const completed = all.filter((p) => p.status === "completed").length;
        const inProgress = all.filter((p) => p.status === "in_progress").length;
        const planned = all.filter((p) => p.status === "planned").length;
        const totalBudget = all.reduce((sum, p) => sum + p.budget, 0);
        return { total: all.length, completed, inProgress, planned, totalBudget };
    },
});
