import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        boothNumber: v.string(),
        name: v.string(),
        constituency: v.string(),
        location: v.object({ lat: v.number(), lng: v.number() }),
        totalVoters: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("booths", {
            ...args,
            activeVoters: 0,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("booths"),
        name: v.optional(v.string()),
        activeVoters: v.optional(v.number()),
        totalVoters: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            lastUpdated: Date.now(),
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("booths").collect();
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const booths = await ctx.db.query("booths").collect();
        const totalVoters = booths.reduce((sum, b) => sum + b.totalVoters, 0);
        const activeVoters = booths.reduce((sum, b) => sum + b.activeVoters, 0);
        return {
            totalBooths: booths.length,
            totalVoters,
            activeVoters,
            avgVotersPerBooth: booths.length > 0 ? Math.round(totalVoters / booths.length) : 0,
        };
    },
});
