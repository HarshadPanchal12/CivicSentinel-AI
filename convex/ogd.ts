"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to add some randomness to the static OGD lat/longs 
// so they don't all stack on top of each other in the UI
function addJitter(val: number) {
    return val + (Math.random() - 0.5) * 0.05;
}

export const syncProjects = action({
    args: {},
    handler: async (ctx) => {
        const apiKey = process.env.OGD_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OGD_API_KEY in environment variables");
        }

        try {
            // Using a specific Health/Hospital dataset from data.gov.in as an example
            // You can change the resource_id to any other dataset on the portal
            const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";
            const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=10`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`OGD API Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.records || data.records.length === 0) {
                return "No records found from OGD API.";
            }

            console.log(`Fetched ${data.records.length} records from OGD.`);

            for (const record of data.records) {
                // The OGD dataset fields vary wildly. We map them to our schema as best as possible.
                // Assuming it's a dataset with State/District/Facility details
                const state = record._state_ || record.state || record.state_name || "Maharashtra";
                const district = record._district_ || record.district || record.district_name || "Mumbai";
                const facilityName = record.facility_name || record.name_of_facility || record.hospital_name || `${district} Health Center`;

                // If the dataset lacks lat/lng, we use a base (Mumbai) and add jitter
                // In a production app with precise datasets, map record.latitude exactly
                const lat = record.latitude ? parseFloat(record.latitude) : addJitter(19.0760);
                const lng = record.longitude ? parseFloat(record.longitude) : addJitter(72.8777);

                const projectId = await ctx.runMutation(api.projects.create, {
                    name: `OGD: ${facilityName}`,
                    description: `Government facility located in ${district}, ${state}. Data sourced natively from data.gov.in`,
                    type: "hospital",
                    status: "completed", // Assuming existing facility
                    budget: Math.floor(Math.random() * 5000000) + 100000,
                    impact: "Provides essential healthcare services to the local district.",
                    location: {
                        lat,
                        lng,
                        address: `${district}, ${state}, India`
                    }
                });

                // Create the associated Geo-Fence using the same location data
                await ctx.runMutation(api.geoFences.create, {
                    name: `${facilityName} Zone`,
                    description: `Automated geo-fence for government facility in ${district}`,
                    type: "hospital",
                    center: { lat, lng },
                    radius: 1500, // 1.5km default radius for OGD projects
                });
            }

            return `Successfully synced ${data.records.length} projects from Open Government Data!`;

        } catch (error) {
            console.error("Failed to sync OGD data:", error);
            throw new Error("Failed to sync Open Government Data");
        }
    }
});
