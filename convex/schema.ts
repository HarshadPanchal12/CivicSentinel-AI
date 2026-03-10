import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ====== USERS (synced from Clerk) ======
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("citizen"), v.literal("operator")),
        avatar: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
        })),
        segment: v.optional(v.string()), // e.g. "Daily Commuter", "Healthcare Seeker"
        language: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_email", ["email"]),

    // ====== GEO-FENCES ======
    geoFences: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        type: v.union(
            v.literal("hospital"),
            v.literal("bridge"),
            v.literal("road"),
            v.literal("school"),
            v.literal("metro"),
            v.literal("college"),
            v.literal("government_office"),
            v.literal("other")
        ),
        status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
        center: v.object({
            lat: v.number(),
            lng: v.number(),
        }),
        radius: v.number(), // meters
        polygon: v.optional(v.array(v.object({
            lat: v.number(),
            lng: v.number(),
        }))),
        linkedProjectId: v.optional(v.id("projects")),
        triggerCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_type", ["type"]),

    // ====== INFRASTRUCTURE PROJECTS ======
    projects: defineTable({
        name: v.string(),
        description: v.string(),
        type: v.union(
            v.literal("hospital"),
            v.literal("bridge"),
            v.literal("road"),
            v.literal("school"),
            v.literal("metro"),
            v.literal("college"),
            v.literal("government_office"),
            v.literal("other")
        ),
        status: v.union(
            v.literal("completed"),
            v.literal("in_progress"),
            v.literal("planned"),
            v.literal("delayed")
        ),
        budget: v.number(), // in INR
        completionDate: v.optional(v.string()),
        impact: v.string(), // e.g. "Reduces commute by 15 minutes"
        location: v.object({
            lat: v.number(),
            lng: v.number(),
            address: v.string(),
        }),
        boothId: v.optional(v.id("booths")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_type", ["type"]),

    // ====== NOTIFICATIONS ======
    notifications: defineTable({
        userId: v.optional(v.string()), // clerkId
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
        status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("read")),
        language: v.optional(v.string()),
        blockchainTxHash: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_status", ["status"])
        .index("by_type", ["type"]),

    // ====== BOOTHS ======
    booths: defineTable({
        boothNumber: v.string(),
        name: v.string(),
        constituency: v.string(),
        location: v.object({
            lat: v.number(),
            lng: v.number(),
        }),
        totalVoters: v.number(),
        activeVoters: v.number(),
        linkedProjects: v.optional(v.array(v.id("projects"))),
        lastUpdated: v.number(),
        createdAt: v.number(),
    })
        .index("by_constituency", ["constituency"])
        .index("by_boothNumber", ["boothNumber"]),

    // ====== ANALYTICS EVENTS ======
    analyticsEvents: defineTable({
        eventType: v.union(
            v.literal("geofence_enter"),
            v.literal("geofence_exit"),
            v.literal("notification_sent"),
            v.literal("notification_read"),
            v.literal("dashboard_view")
        ),
        geoFenceId: v.optional(v.id("geoFences")),
        userId: v.optional(v.string()),
        metadata: v.optional(v.string()), // JSON string for flexible data
        timestamp: v.number(),
    })
        .index("by_eventType", ["eventType"])
        .index("by_timestamp", ["timestamp"]),

    // ====== BLOCKCHAIN AUDIT LOG ======
    auditLog: defineTable({
        action: v.string(),
        entityType: v.string(),
        entityId: v.string(),
        details: v.string(),
        txHash: v.optional(v.string()),
        verified: v.boolean(),
        timestamp: v.number(),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_entityType", ["entityType"]),
});
