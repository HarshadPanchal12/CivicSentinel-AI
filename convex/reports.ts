import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List reports for a specific geofence
export const listByGeoFence = query({
    args: { geoFenceId: v.id("geoFences") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reports")
            .withIndex("by_geoFenceId", (q) => q.eq("geoFenceId", args.geoFenceId))
            .order("desc")
            .collect();
    },
});

// Create a new report
export const create = mutation({
    args: {
        userId: v.string(),
        userName: v.string(),
        geoFenceId: v.id("geoFences"),
        content: v.string(),
        type: v.union(v.literal("issue"), v.literal("verification"), v.literal("suggestion")),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("reports", {
            ...args,
            status: "open",
            actionRequests: 0,
            likes: 0,
            createdAt: Date.now(),
        });
    },
});

// "Take Action" on a report (or general demand for a geofence)
export const requestAction = mutation({
    args: {
        reportId: v.id("reports"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user already requested action for this report
        const existing = await ctx.db
            .query("reportInteractions")
            .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .filter((q) => q.eq(q.field("type"), "action_request"))
            .first();

        if (existing) return;

        // Record interaction
        await ctx.db.insert("reportInteractions", {
            reportId: args.reportId,
            userId: args.userId,
            type: "action_request",
            createdAt: Date.now(),
        });

        // Update report counter
        const report = await ctx.db.get(args.reportId);
        if (report) {
            await ctx.db.patch(args.reportId, {
                actionRequests: report.actionRequests + 1,
            });
        }
    },
});

// Like a report
export const toggleLike = mutation({
    args: {
        reportId: v.id("reports"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("reportInteractions")
            .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .filter((q) => q.eq(q.field("type"), "like"))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reportInteractions", {
                reportId: args.reportId,
                userId: args.userId,
                type: "like",
                createdAt: Date.now(),
            });
        }

        // Update overall report counter
        const report = await ctx.db.get(args.reportId);
        if (report) {
            await ctx.db.patch(args.reportId, {
                likes: existing ? report.likes - 1 : report.likes + 1,
            });
        }
    },
});
