import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logEvent = mutation({
    args: {
        eventType: v.union(
            v.literal("geofence_enter"),
            v.literal("geofence_exit"),
            v.literal("notification_sent"),
            v.literal("notification_read"),
            v.literal("dashboard_view")
        ),
        geoFenceId: v.optional(v.id("geoFences")),
        userId: v.optional(v.string()),
        metadata: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("analyticsEvents", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

export const getOverview = query({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("analyticsEvents").collect();
        const geoFences = await ctx.db.query("geoFences").collect();
        const notifications = await ctx.db.query("notifications").collect();
        const booths = await ctx.db.query("booths").collect();
        const projects = await ctx.db.query("projects").collect();

        const geofenceEnters = events.filter((e) => e.eventType === "geofence_enter").length;
        const notificationsSent = notifications.length;
        const activeGeoFences = geoFences.filter((g) => g.status === "active").length;
        const totalBooths = booths.length;
        const totalProjects = projects.length;
        const completedProjects = projects.filter((p) => p.status === "completed").length;

        return {
            geofenceEnters,
            notificationsSent,
            activeGeoFences,
            totalGeoFences: geoFences.length,
            totalBooths,
            totalProjects,
            completedProjects,
            totalVoters: booths.reduce((sum, b) => sum + b.totalVoters, 0),
        };
    },
});

export const getRecentEvents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("analyticsEvents")
            .order("desc")
            .take(20);
    },
});

// Audit log functions
export const addAuditEntry = mutation({
    args: {
        action: v.string(),
        entityType: v.string(),
        entityId: v.string(),
        details: v.string(),
        txHash: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("auditLog", {
            ...args,
            verified: !!args.txHash,
            timestamp: Date.now(),
        });
    },
});

export const getAuditLog = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("auditLog")
            .order("desc")
            .take(50);
    },
});
