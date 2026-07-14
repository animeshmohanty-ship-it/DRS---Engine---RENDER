# DRS Bot — Build Spec (DRS SKILL v2 - Second Cut)

**Status:** Draft Document for discussion. We will lock these specifications section-by-section before executing the updates.
**Purpose:** Details the architectural enhancements for data credibility, full-context AI Copilot, project portability (export/import), user data overrides, and enterprise API migration.

---

## 1. Data Credibility & Assumption Policies

To ensure maximum credibility when presenting the roadmap to excise commissioners and brand executives:

### 1.1 Strict Grounding Rules
- **No Hallucinations:** The LLM must never retrieve a number from its training memory if it is not backed by a verified search citation or the user's setup.
- **Explicit URL Citations:** Every population number, administrative count (districts, talukas), and regulatory law mentioned must cite its source URL directly.
- **The Empty Value Rule:** If a number is genuinely unavailable, it must be returned as `null` (not a generalized guess) and badged as `❔ To-validate`.

### 1.2 Mathematical Derivations & Estimation Badging
- Any calculated or projected figure (e.g., consumption units/year calculated from population × national per-capita averages) must:
  - Be badged as `⚠️ Estimated`.
  - Carry a clear, human-readable math formula explaining the calculation basis (e.g. `"Goa population of 1.59M × average national PET bottle consumption of 19.5 units/capita/year"`).

---

## 2. Full-Context AI Copilot (Omniscient Assistant)

Currently, the Copilot is isolated to the active tab's data. In the Second Cut:

### 2.1 Context Injection
- The frontend will pass the entire `projectStages` state (containing all generated Stage 2 through 10 data) to the `/api/copilot` endpoint.
- The Copilot will act as a unified assistant, meaning it can answer cross-tab questions (e.g., while viewing Stage 7 "Operations", the user can ask: *"How do our collection routes align with the Calangute beach footfall we mapped in Stage 8?"*).

---

## 3. Data Portability (Export & Import)

To make it easy to backup projects, share them with managers, or migrate them across machines without a complex database setup:

### 3.1 Local Storage Baseline
- Projects are stored locally in the browser's `localStorage` (independent of server files).

### 3.2 JSON Project Export
- A **"Download Project JSON"** button will be added in the workspace header.
- This compiles all configuration inputs and generated stage data into a single `.json` file and downloads it to the user's computer.

### 3.3 JSON Project Import
- An **"Import Project JSON"** file uploader will be added on the Project History screen.
- Uploading a valid project file will parse the JSON, append it to the local history, and open the roadmap dashboard immediately.

### 3.4 Manager Report Export (Stage 10)
- Add a **"Download Playbook Report"** button in Stage 10 to download a clean, styled Markdown file summarizing all evidence, timeline, and document drafts in a clean executive report layout.

---

## 4. User Data Overrides (Manual Calibration)

A core requirement is allowing the pod leader to override any generated metric when they have superior internal field intelligence.

### 4.1 Double-Click Editing
- Users can click on numeric cells (e.g. population, touchpoint counts, consumption) and type a manual correction.
- When edited:
  - The local state stores the manual entry.
  - The badge changes to `✍️ Override` (styled with a purple/grey background).
  - The system saves the change.

### 4.2 Downstream Recalculations (Grounded Reactive State)
- Any manual override triggers a cascade recalculation.
- E.g., if the user overrides the number of restaurants in North Goa, the RVM deployment calculations in Stage 7 and BTL activity reach estimates in Stage 8 will dynamically recalculate.

---

## 5. Alternate Enterprise Connectors (Data Migration Plan)

To transition from prototype APIs to enterprise data streams:

| Data Type | Current (Prototype) | Enterprise Target | Implementation Impact |
|---|---|---|---|
| **Touchpoints** | OSM Overpass (Community) | **Google Places API** or **Foursquare API** | Massive improvement in kirana shop and restaurant completeness in semi-urban India. |
| **Admin Boundaries** | Web Grounding | **Local Government Directory (LGD) API** | Returns official LGD block and Panchayat codes, ensuring 100% legal alignment. |
| **Consumption** | Mathematical modeling | **CPCB EPR Portal Scraper** / **Statista** | Incorporates legally registered brand plastics tonnage and beverage sales volumes. |
| **News & Sentiment** | Web Grounding | **GDELT / NewsAPI** | Tracks live local news resistance articles. |

---

## 6. Tech Solutions Model Definition

Act as the SaaS technology and transaction provider for the DRS, rather than executing physical operations or supplying raw hardware.

### 6.1 Ecosystem Mapping
Designs the unified blueprint mapping the flow of:
- **Materials:** From brand filling lines, to POS retail shelves, to consumer returns, and finally recycler offtake.
- **Data:** Serialization and registration at factory, checkouts, and redemption points.
- **Funds:** Deposits flowing into central escrows and refund triggers.

### 6.2 Escrow Central Ledger
- Integrates POS transactions to route deposits instantly to a central secure Escrow Account.
- Triggers instant, direct-to-consumer payouts from the Escrow Account upon return validation.
- Tracks unclaimed deposits (leakage) in real-time.

### 6.3 Serialized Traceability
- Registers unique QR/barcodes at factory-level.
- Modifies container state in the database to prevent double-redemption fraud.
- Monitors reverse-logistics bag handoffs to recyclers via serialized manifest tracking.

---

## 7. GTM Planning vs. CRM Tracker Refactor

Pivots all dashboard components and AI generators from "active progress tracking" (which requires ongoing project execution data) to "forward-looking GTM planning" (which generates target plans, templates, and frameworks before execution starts).

### 7.1 Stage 7 (Execution Workstreams)
- **Brands:** Renders target brand onboarding timelines (e.g. T-Minus weeks) and compliance specifications instead of onboarded vs target counts.
- **Touchpoints:** Renders target acquisition pipelines, merchant density rollout goals, and onboarding SLA requirements instead of onboarded counts.
- **Infrastructure:** Renders Panchayat site-readiness checklists, deployment sequence plans, and technical dependencies instead of Live vs Pending statuses.

### 7.2 Stage 8 (BTL Activation Playbook)
- Renders recommended campaign calendar schedules, channel mixes, target audience reach projections, and creative copywriting assets instead of directory lists of completed events.

### 7.3 Stage 9 (Performance KPIs & Escalation)
- Renders target baseline KPIs, warning/critical thresholds, measurement schedules, and actionable corrective SOPs (e.g. what action to trigger if collection rate drops below threshold) instead of "current scores achieved till now".

---

## 8. Geographic Hierarchy Schema & Setup Dropdowns

Introduces metadata-driven geographic layers and searchable dropdown lists in the Setup phase to ensure data precision and prevent spelling/data entry errors.

### 8.1 Autocomplete Dropdowns (Stage 1 Setup)
- **Parent-Child Mapping:** Selecting a Country (e.g., India) automatically unlocks and filters the State options (e.g. Goa, Gujarat, Tamil Nadu).
- **Searchable Autocomplete:** The user can type a search term (e.g. "g" -> "Gujarat", "Goa") to select the state instantly.

### 8.2 Discovered Hierarchy Schema (Stage 2 Integration)
- The Stage 2 AI generator discovers the official administrative levels for the selected State/Region. It returns a structured `geoSchema` JSON:
  ```json
  "geoSchema": {
    "level1": "District",
    "level2": "Taluka|Corporation|County",
    "level3": "Gram Panchayat|Ward|ZIP Code"
  }
  ```
- This schema is persisted in the project data in Supabase/localStorage.

### 8.3 Dynamic UI Mapping
- All dashboard tables, timelines, and activation widgets replace hardcoded strings (e.g. "Taluka", "Panchayat") with dynamic variables:
  - `project.geoSchema.level2 || 'Sub-division'`
  - `project.geoSchema.level3 || 'Local Body/Ward'`
