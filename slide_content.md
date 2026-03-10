# GeoFenceAI - Exact PPT Slide Content

*Copy and paste this section by section into your presentation template.*

## SLIDE 1: Problem Statement
**The Challenge:**
Governments spend billions on localized public infrastructure (schools, clinics, roads), but the citizens living right next to them often have no idea these projects exist, what they do, or how to use them.

**The Gaps & Inefficiencies:**
*   **Irrelevant Broadcasting:** Sending blanket SMS messages to a whole city (e.g., about a new bridge in North Delhi) creates notification fatigue for citizens in South Delhi.
*   **Language & Context Barriers:** Traditional billboards and generic texts treat a 20-year-old local college student and a 60-year-old shop owner identically.
*   **Lack of Proof:** Governments currently have no mathematical, auditable proof that localized information actually reached the right demographic at the right time.

---

## SLIDE 2: Solution
**Our Approach:** Hyper-Local, AI-Driven Geo-Fencing.
We built a dual-layer system (a web Command Center for Planners and a React Native App for Citizens) that bridges the physical and digital divide.

*   **Innovation:** We replace "As the Crow Flies" radius drawing with the Geoapify Routing API to calculate true walking distances. We only ping a citizen's phone if they can actually walk to the project.
*   **Impact:** When a citizen physically enters a 1.5km walking radius of a government project, our engine hits Gemini AI to generate a hyper-personalized, translated notification explaining exactly how that specific project benefits *them*.
*   **Practicality:** The system is "Zero-Touch" for the government. It hooks directly into the Indian Open Gov Data (OGD) API, automatically drawing new geo-fences the second public facility data is published online.

---

## SLIDE 3: Architecture
*(Insert the `architecture.png` diagram I gave you earlier on this slide)*

**Key Components & Data Flow:**
1.  **Frontend (The Pulse):** Next.js 15 Web Dashboard featuring a Three.js 3D map for visual command and control.
2.  **Edge Node (The Citizen):** React Native mobile app performing continuous, low-battery background GPS tracking.
3.  **Real-Time Engine (The Synapse):** Convex Serverless backend computing live geospatial intersection logic.
4.  **Knowledge Graph:** Neo4j Database mapping the complex relationships between citizen demographics and infrastructure types.
5.  **Audit Layer (The Lock):** Polygon Blockchain smart contracts that cryptographically hash every successful notification delivery to ensure transparent, undeniable proof of governance.

---

## SLIDE 4: Technology Used
**Frontend & Edge:**
*   **Next.js 15 / React 19:** Drives the high-performance Government Web Dashboard.
*   **Three.js / React Three Fiber:** Renders the 3D Command Center map for intuitive spatial awareness.
*   **React Native / Expo:** Powers the native Android citizen app for reliable GPS access.

**Backend & Intelligence:**
*   **Convex Cloud:** Acts as the real-time database and serverless API router, instantly syncing the web and mobile apps.
*   **Google Gemini 2.5 Flash:** Provides rapid, context-aware translation and demographic personalization for alert messages.
*   **Geoapify:** Calculates complex routing geometry (roads, rivers, walls) instead of flawed straight-line math.
*   **Neo4j:** Graph database to deduce relationships (e.g., "Find citizens who are voters AND live near a delayed hospital").

**Security & Data:**
*   **OGD API (data.gov.in):** Fetches live, authenticated government facility datasets.
*   **Polygon Blockchain (Ethers.js):** Ensures immutable, public audit trails of all communication.

---

## SLIDE 5: Features / USP (Unique Selling Proposition)
1.  **True Walking-Distance Logic:** We discard basic circle-based geofences. Our engine understands actual street routes to prevent false-positive notifications caused by physical barriers.
2.  **Zero-Touch Gov Operations (Live Sync):** Automatic pipeline from the Open Government Data (OGD) portal directly into active, actionable 3D geofences without manual data entry.
3.  **Cryptographic Proof of Governance:** Every localized notification sent to a citizen is irrefutably logged on the Polygon Blockchain, providing permanent transparency.
4.  **Demographic AI Personalization:** The system doesn't just translate languages; Gemini AI changes the *tone and content* based on the citizen's profile (e.g., highlighting job opportunities for youth vs. accessibility features for the elderly).

---

## SLIDE 6: References / Data Sources
1.  **Indian Open Government Data (OGD) Portal:** 
    *   *URL:* api.data.gov.in
    *   *Usage:* Sourcing live health center and public infrastructure geographical datasets.
2.  **Geoapify Routing Service:**
    *   *Docs:* apidocs.geoapify.com/docs/routing
    *   *Usage:* Real-world pedestrian distance calculations.
3.  **Google Gemini AI API:**
    *   *Docs:* ai.google.dev/docs
    *   *Usage:* Multi-lingual Natural Language Processing (NLP) for notification generation.
4.  **Convex Backend Documentation:**
    *   *Docs:* docs.convex.dev
    *   *Usage:* Serverless function infrastructure and real-time WebSockets synchronization.
5.  **Polygon PoS Network:**
    *   *Docs:* polygon.technology/docs
    *   *Usage:* Decentralized audit logging layer.
