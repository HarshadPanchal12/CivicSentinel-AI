"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import neo4j from "neo4j-driver";

export const syncToGraph = action({
    args: {},
    handler: async (ctx) => {
        const uri = process.env.NEO4J_URI;
        const user = process.env.NEO4J_USERNAME;
        const password = process.env.NEO4J_PASSWORD;

        if (!uri || !user || !password) {
            throw new Error("Missing Neo4j credentials in environment variables.");
        }

        const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
        const session = driver.session();

        try {
            // 1. Fetch data from Convex
            const booths = await ctx.runQuery(api.booths.list);
            const projects = await ctx.runQuery(api.projects.list);

            // 2. Clear existing graph (for demo sync to avoid duplicates)
            await session.run(`MATCH (n) DETACH DELETE n`);

            // 3. Create Booths
            for (const b of booths) {
                await session.run(
                    `CREATE (b:Booth {id: $id, name: $name, voters: $voters, lat: $lat, lng: $lng})`,
                    { id: b._id, name: b.name, voters: b.totalVoters, lat: b.location.lat, lng: b.location.lng }
                );
            }

            // 4. Create Projects
            for (const p of projects) {
                await session.run(
                    `CREATE (p:Project {id: $id, name: $name, type: $type, status: $status})`,
                    { id: p._id, name: p.name, type: p.type, status: p.status }
                );

                if (p.boothId) {
                    // Link Project to Booth
                    await session.run(
                        `MATCH (b:Booth {id: $boothId})
             MATCH (p:Project {id: $projectId})
             MERGE (b)-[:IS_NEAR]->(p)`,
                        { boothId: p.boothId, projectId: p._id }
                    );
                }
            }

            // 5. Generate Synthetic Citizens
            if (booths.length > 0) {
                const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Kavya", "Suresh", "Pooja"];
                const issues = ["Traffic", "Healthcare", "Education", "Water Supply", "Public Transport"];

                for (let i = 0; i < 20; i++) {
                    const citizenId = `cit_${i}`;
                    const name = `${firstNames[i % firstNames.length]} M.`;
                    const issue = issues[Math.floor(Math.random() * issues.length)];
                    const booth = booths[Math.floor(Math.random() * booths.length)];

                    await session.run(
                        `CREATE (c:Citizen {id: $id, name: $name})
             WITH c
             MATCH (b:Booth {id: $boothId})
             MERGE (c)-[:VOTES_AT]->(b)
             MERGE (i:Issue {name: $issue})
             MERGE (c)-[:CARES_ABOUT]->(i)`,
                        { id: citizenId, name, boothId: booth._id, issue }
                    );
                }
            }

            return "Successfully synced Convex data to Neo4j Knowledge Graph.";
        } catch (err) {
            console.error("Neo4j Sync Error:", err);
            throw new Error("Failed to sync to Neo4j");
        } finally {
            await session.close();
            await driver.close();
        }
    }
});
