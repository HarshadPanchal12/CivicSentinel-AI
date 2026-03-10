"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Uses Geoapify Routing API to get real-world driving/walking distance between two lat/lng points
// This replaces the mock triggers with actual geospatial logic.
export const calculateProximity = action({
    args: {
        citizenId: v.string(),
        citizenLat: v.number(),
        citizenLng: v.number(),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GEOAPIFY_API_KEY; // The same key we use for map tiles
        if (!apiKey) {
            console.warn("GEOAPIFY_API_KEY not found. Falling back to straight-line math.");
        }

        const projects = await ctx.runQuery(api.projects.list);
        let triggeredAnAlert = false;

        for (const project of projects) {
            if (!project.location) continue;

            const targetLat = project.location.lat;
            const targetLng = project.location.lng;

            let distanceMeters = 0;

            if (apiKey) {
                // Use Geoapify Routing API to calculate actual walking distance
                try {
                    const url = `https://api.geoapify.com/v1/routing?waypoints=${args.citizenLat},${args.citizenLng}|${targetLat},${targetLng}&mode=walk&apiKey=${apiKey}`;
                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.features && data.features.length > 0) {
                        // Geoapify returns distance in meters
                        distanceMeters = data.features[0].properties.distance;
                        console.log(`Real walking distance to ${project.name}: ${distanceMeters}m`);
                    } else {
                        throw new Error("No route found in Geoapify");
                    }
                } catch (e) {
                    console.error("Geoapify Routing failed, falling back to basic math", e);
                    distanceMeters = calculateStraightLine(args.citizenLat, args.citizenLng, targetLat, targetLng);
                }
            } else {
                distanceMeters = calculateStraightLine(args.citizenLat, args.citizenLng, targetLat, targetLng);
            }

            // In our system, the default radius for all projects is 2000m (2km) for demo purposes
            const geoFenceRadius = 2000;

            // If citizen is inside the distance radius 
            if (distanceMeters <= geoFenceRadius) {
                console.log(`CITIZEN ENTERED GEOFENCE for ${project.name} (${distanceMeters}m)`);
                triggeredAnAlert = true;

                // 1. Log the Enter Event for Analytics
                await ctx.runMutation(api.analytics.logEvent, {
                    eventType: "geofence_enter",
                    userId: args.citizenId,
                    metadata: JSON.stringify({ projectId: project._id, distance: distanceMeters })
                });

                // 2. Trigger Gemini AI to generate custom SMS alert sent to citizen!
                const language = Math.random() > 0.5 ? "English" : "Marathi";
                await ctx.runAction(api.ai.generateNotification, { projectId: project._id, language });

                // 3. Increment the Geo-Fence Global Trigger Count for the Dashboard
                await ctx.runMutation(api.geoFences.incrementByProjectId, { projectId: project._id });

                // In a production system, we'd break here or add idempotency checks
                // so we don't spam the user 10 times if they are near 10 projects at once.
                break;
            }
        }

        return { success: true, triggered: triggeredAnAlert };
    }
});

// Haversine formula for straight-line distance if API fails
function calculateStraightLine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
