import { mutation } from "./_generated/server";

// Seed function to populate the database with demo data
export const seedDatabase = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if already seeded
        const existingFences = await ctx.db.query("geoFences").take(1);
        if (existingFences.length > 0) return "Already seeded";

        // ====== SEED BOOTHS ======
        const booth1 = await ctx.db.insert("booths", {
            boothNumber: "BT-0012",
            name: "Tembhipada Ward Office",
            constituency: "Mumbai South",
            location: { lat: 19.0176, lng: 72.8562 },
            totalVoters: 8450,
            activeVoters: 3200,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        });

        const booth2 = await ctx.db.insert("booths", {
            boothNumber: "BT-0045",
            name: "Dadar Community Hall",
            constituency: "Mumbai Central",
            location: { lat: 19.0178, lng: 72.8478 },
            totalVoters: 12300,
            activeVoters: 5100,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        });

        const booth3 = await ctx.db.insert("booths", {
            boothNumber: "BT-0089",
            name: "Andheri Public School",
            constituency: "Mumbai North",
            location: { lat: 19.1197, lng: 72.8464 },
            totalVoters: 9800,
            activeVoters: 4300,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        });

        const booth4 = await ctx.db.insert("booths", {
            boothNumber: "BT-0123",
            name: "Bandra Library Hall",
            constituency: "Mumbai West",
            location: { lat: 19.0596, lng: 72.8295 },
            totalVoters: 6750,
            activeVoters: 2800,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        });

        // ====== SEED PROJECTS ======
        const proj1 = await ctx.db.insert("projects", {
            name: "Tembhipada Community Health Center",
            description: "New multi-specialty health center serving 50,000+ residents with OPD, emergency, and diagnostic services.",
            type: "hospital",
            status: "completed",
            budget: 45000000,
            completionDate: "2025-12-15",
            impact: "Reduces hospital travel time by 45 minutes for 50,000 residents",
            location: { lat: 19.0176, lng: 72.8562, address: "Tembhipada, Byculla, Mumbai 400027" },
            boothId: booth1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const proj2 = await ctx.db.insert("projects", {
            name: "Mahim-Dadar Flyover Bridge",
            description: "4-lane elevated bridge connecting Mahim to Dadar, easing traffic congestion for 200,000 daily commuters.",
            type: "bridge",
            status: "in_progress",
            budget: 120000000,
            impact: "Saves 20 minutes daily commute for 200,000 commuters",
            location: { lat: 19.0282, lng: 72.8432, address: "Mahim-Dadar Link, Mumbai 400016" },
            boothId: booth2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const proj3 = await ctx.db.insert("projects", {
            name: "Andheri Metro Line Extension",
            description: "3km metro extension from Andheri East to SEEPZ with 2 new stations.",
            type: "metro",
            status: "in_progress",
            budget: 350000000,
            impact: "Connects 100,000 tech workers to metro network, reducing commute by 30 minutes",
            location: { lat: 19.1197, lng: 72.8464, address: "Andheri East, Mumbai 400069" },
            boothId: booth3,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const proj4 = await ctx.db.insert("projects", {
            name: "Bandra Government College Renovation",
            description: "Complete renovation of heritage college building with modern labs, library, and smart classrooms.",
            type: "college",
            status: "planned",
            budget: 28000000,
            impact: "Benefits 3,500 students with world-class learning infrastructure",
            location: { lat: 19.0596, lng: 72.8295, address: "Bandra West, Mumbai 400050" },
            boothId: booth4,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // ====== SEED GEO-FENCES ======
        await ctx.db.insert("geoFences", {
            name: "Tembhipada Health Center Zone",
            description: "500m radius around the new community health center",
            type: "hospital",
            status: "active",
            center: { lat: 19.0176, lng: 72.8562 },
            radius: 500,
            linkedProjectId: proj1,
            triggerCount: 1247,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("geoFences", {
            name: "Mahim-Dadar Bridge Construction",
            description: "800m radius covering the flyover construction zone",
            type: "bridge",
            status: "active",
            center: { lat: 19.0282, lng: 72.8432 },
            radius: 800,
            linkedProjectId: proj2,
            triggerCount: 3892,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("geoFences", {
            name: "Andheri Metro Extension Zone",
            description: "1km radius around metro construction site",
            type: "metro",
            status: "active",
            center: { lat: 19.1197, lng: 72.8464 },
            radius: 1000,
            linkedProjectId: proj3,
            triggerCount: 5621,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("geoFences", {
            name: "Bandra College Renovation Area",
            description: "300m radius around the college campus",
            type: "college",
            status: "pending",
            center: { lat: 19.0596, lng: 72.8295 },
            radius: 300,
            linkedProjectId: proj4,
            triggerCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await ctx.db.insert("geoFences", {
            name: "Western Express Highway Upgrade",
            description: "2km zone along the road widening project",
            type: "road",
            status: "active",
            center: { lat: 19.1070, lng: 72.8607 },
            radius: 2000,
            triggerCount: 8912,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // ====== SEED NOTIFICATIONS ======
        await ctx.db.insert("notifications", {
            title: "🏥 New Health Center Open!",
            content: "The Tembhipada Community Health Center is now open with OPD services. Free checkups this week! Reduces your hospital travel by 45 minutes.",
            type: "governance_update",
            status: "delivered",
            language: "en",
            createdAt: Date.now() - 86400000,
        });

        await ctx.db.insert("notifications", {
            title: "🌉 Bridge Construction Update",
            content: "Mahim-Dadar Flyover is 65% complete. Expected completion in March 2026. Will save you 20 minutes of daily commute.",
            type: "project_milestone",
            status: "sent",
            language: "en",
            createdAt: Date.now() - 43200000,
        });

        await ctx.db.insert("notifications", {
            title: "🚇 Metro Extension Progress",
            content: "Andheri Metro Line Extension has reached 40% completion. Two new stations will serve SEEPZ and MIDC areas.",
            type: "project_milestone",
            status: "sent",
            language: "en",
            createdAt: Date.now() - 7200000,
        });

        await ctx.db.insert("notifications", {
            title: "📍 You're near a government project!",
            content: "You're within 500m of the Western Express Highway upgrade. Current progress: 78% complete. 4 lanes are being added.",
            type: "proximity_alert",
            status: "sent",
            language: "en",
            createdAt: Date.now() - 3600000,
        });

        await ctx.db.insert("notifications", {
            title: "🎓 College Renovation Approved",
            content: "Bandra Government College renovation has been approved with ₹2.8 Cr budget. Smart classrooms and modern labs coming soon!",
            type: "governance_update",
            status: "sent",
            language: "en",
            createdAt: Date.now(),
        });

        // ====== SEED ANALYTICS ======
        const eventTypes = ["geofence_enter", "notification_sent", "notification_read", "dashboard_view"] as const;
        for (let i = 0; i < 15; i++) {
            await ctx.db.insert("analyticsEvents", {
                eventType: eventTypes[i % eventTypes.length],
                timestamp: Date.now() - Math.random() * 604800000,
            });
        }

        // ====== SEED AUDIT LOG ======
        await ctx.db.insert("auditLog", {
            action: "NOTIFICATION_SENT",
            entityType: "notification",
            entityId: "notif_001",
            details: "Governance update delivered to 1,247 citizens near Tembhipada Health Center",
            txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7890",
            verified: true,
            timestamp: Date.now() - 86400000,
        });

        await ctx.db.insert("auditLog", {
            action: "GEOFENCE_CREATED",
            entityType: "geoFence",
            entityId: "gf_001",
            details: "New geo-fence created: Western Express Highway Upgrade (2km radius)",
            verified: false,
            timestamp: Date.now() - 172800000,
        });

        await ctx.db.insert("auditLog", {
            action: "PROJECT_UPDATE",
            entityType: "project",
            entityId: "proj_002",
            details: "Mahim-Dadar Flyover progress updated to 65% completion",
            txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1234",
            verified: true,
            timestamp: Date.now() - 259200000,
        });

        return "Database seeded successfully!";
    },
});

export const createVidyalankarZone = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Check if it already exists
        const existing = await ctx.db
            .query("geoFences")
            .filter((q) => q.eq(q.field("name"), "Vidyalankar Institute of Technology"))
            .first();

        if (existing) return { status: "exists", id: existing._id };

        // 2. Create the Geofence
        const zoneId = await ctx.db.insert("geoFences", {
            name: "Vidyalankar Institute of Technology",
            description: "Center of educational excellence in Wadala, Mumbai.",
            type: "college",
            status: "active",
            center: { lat: 19.0216, lng: 72.8708 },
            radius: 400,
            triggerCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 3. Create Blockchain Accountability Record
        await ctx.db.insert("accountabilityRecords", {
            zoneId: zoneId,
            zoneName: "Vidyalankar Institute of Technology",
            officialName: "Shri. Rajesh Patil",
            officialPost: "Regional MLA & Education Overseer",
            partyName: "Independent / Local Coalition",
            projectClaim: "Smart Student Transit & Safety Upgrade",
            startDate: "2025-06-01",
            claimedCompletionDate: "2026-03-30",
            actualStatus: "95% Complete (Testing Phase)",
            dataHash: "a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2",
            txHash: "0x4f5e6d7c8b9a0f1e2d3c4b5a6978890abcdef1234567890abcdef",
            createdAt: Date.now(),
        });

        // 4. Add a sample report for better visualization
        await ctx.db.insert("reports", {
            userId: "tester_01",
            userName: "Student Council VIT",
            geoFenceId: zoneId,
            content: "Smart lighting installed on the main approach road is working perfectly. Feeling much safer during late-night studies!",
            type: "verification",
            status: "resolved",
            actionRequests: 0,
            likes: 15,
            createdAt: Date.now(),
        });

        return { status: "created", id: zoneId };
    },
});

