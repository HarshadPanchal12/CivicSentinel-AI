import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
    args: {
        userId: v.optional(v.string()),
        geoFenceId: v.optional(v.id("geoFences")),
        projectId: v.optional(v.id("projects")),
        title: v.string(),
        content: v.string(),
        type: v.union(
            v.literal("governance_update"),
            v.literal("project_milestone"),
            v.literal("proximity_alert"),
            v.literal("system")
        ),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            ...args,
            status: "sent",
            createdAt: Date.now(),
        });
    },
});

export const listForUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("notifications")
            .order("desc")
            .take(100);
    },
});

export const markRead = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: "read" });
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("notifications").collect();
        const sent = all.filter((n) => n.status === "sent").length;
        const delivered = all.filter((n) => n.status === "delivered").length;
        const read = all.filter((n) => n.status === "read").length;
        return { total: all.length, sent, delivered, read };
    },
});
