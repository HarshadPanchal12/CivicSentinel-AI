import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new comment on a report
export const create = mutation({
    args: {
        reportId: v.id("reports"),
        userId: v.string(),
        userName: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const commentId = await ctx.db.insert("comments", {
            reportId: args.reportId,
            userId: args.userId,
            userName: args.userName,
            text: args.text,
            createdAt: Date.now(),
        });
        return commentId;
    },
});

// List comments for a specific report, ordered by creation time
export const listByReport = query({
    args: { reportId: v.id("reports") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
            .order("desc")
            .take(50);
        return comments;
    },
});
