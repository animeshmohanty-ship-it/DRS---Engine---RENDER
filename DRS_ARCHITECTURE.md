# DRS Bot: System Architecture & Logic Flow

This document serves as the master technical blueprint for the DRS (Deposit Return System) Bot. It outlines the technology stack, data flow, logical dependencies, and the step-by-step LLM generation pipelines that power the application.

---

## 1. System Overview & Technology Stack

The DRS Bot is a React-based web application designed to synthesize complex rollout plans, market research, and GTM (Go-To-Market) strategies by orchestrating multiple Large Language Model (LLM) calls.

*   **Frontend Interface:** React (Next.js/Vite environment). The primary UI logic and state orchestration live within `app/page.jsx`.
*   **Backend Generation:** A Node.js API route (`/api/generate`) that handles secure communication with the LLM providers (Vertex AI, AI Studio, Groq, Anthropic).
*   **State Management & Persistence:**
    *   **In-Memory State:** Managed via React `useState` and `useRef` (e.g., `projectStages`, `loading`, `activeStageNum`).
    *   **Persistence:** Data is automatically saved to the browser's `localStorage`. Each "Blueprint" or Project is a JSON object containing all generated stages.
*   **AI Models:** The system supports dynamic model switching (e.g., Gemini 3.1 Pro, Claude 3.5 Sonnet, Llama 3.3). The selected model string is passed in the payload to the API.

---

## 2. The Generation Engine (How Data is Created)

When a user clicks a "Generate" button, the following pipeline executes:

1.  **State Initialization & Abort Controller:**
    *   The UI sets `loading[stageNum] = true`.
    *   A new `AbortController` is instantiated and saved to state. This enables the **"🛑 Stop Generating"** feature, allowing the user to cleanly abort the request mid-flight.
2.  **Payload Construction:**
    *   The frontend aggregates the "Global Context" (from Stage 1) and the specific `stage` ID.
    *   The payload is sent via `fetch('/api/generate')` using `POST`.
3.  **Backend Prompt Assembly:**
    *   The backend imports the appropriate prompt template from the `lib/prompts/` directory based on the requested stage.
    *   Dynamic variables (Location, Materials, Constraints) are injected into the LLM system prompt.
4.  **LLM Execution & Response Parsing:**
    *   The LLM generates the response (often mandated to return structured JSON or specific Markdown tables).
    *   The backend returns the raw text to the frontend.
    *   The frontend attempts to parse the response (via `JSON.parse` or custom regex/substring extraction for Markdown).
5.  **State Update:**
    *   If successful, the parsed data is injected into `projectStages.stage[N]`.
    *   The project is re-saved to `localStorage`, and the UI re-renders to display the newly generated cards, tables, or matrices.

---

## 3. Stage-by-Stage Breakdown & Logic

The application is structured into a cascading flow of dependencies.

### **Phase 1: Global Setup (Stage 1)**
*   **Purpose:** Establishes the baseline rules for the entire project.
*   **Data Captured:** Country, State/Region, Implementation Model (Greenfield/Brownfield), Packaging Materials (PET, Glass, Alu), Timeline (Start/End dates), and Custom Constraints.
*   **Logic:** Every downstream stage heavily relies on this data. If Stage 1 is modified after downstream stages are generated, an **"Out of Date / Stale"** warning triggers on the affected stages, prompting the user to regenerate them to ensure data consistency.

### **Phase 2: Market Research (Stages 2 - 6)**
*   **Purpose:** Gathers foundational intelligence about the target region.
*   **Stages:**
    *   **Stage 2:** Geography & Demographics
    *   **Stage 3:** Market Intelligence
    *   **Stage 4:** Stakeholder Mapping
    *   **Stage 5:** Competitors & Benchmarks (Includes a strict constraint to only utilize **Domestic Precedents** to prevent irrelevant foreign comparisons).
    *   **Stage 6:** Resistance & Risk Mitigation
*   **Execution Logic:** These can be generated individually or sequentially using the **"⚡ Generate All Research"** button, which iterates through the array `[2, 3, 4, 5, 6]`, awaiting each API call before moving to the next.

### **Phase 3: Operational Execution (Stages 7 - 15)**
*   **Purpose:** The core building blocks of the physical DRS rollout.
*   **Topics Covered:** Legal frameworks, IT Infrastructure, Reverse Logistics, Financial Models, RVM deployment, etc.
*   **Execution Logic:** Independent stages that query specific domains based on the Stage 1 context.

### **Phase 4: Pre-Planning & Strategy (Stage 16)**
*   **Purpose:** Synthesizes the raw research into a unified **Campaign Brief**.
*   **Dependencies:** Relies heavily on the context gathered in Stages 2-15.
*   **Output:** Generates a comprehensive SWOT analysis and strategic pillars. The user reviews and "locks" this brief.

### **Phase 5: Omnichannel Planning (Stages 17 & 18)**
*   **Purpose:** Translates the Campaign Brief into actionable, chronological deliverables.
*   **Execution Logic (The Multi-Query Engine):**
    *   This is the most complex generation phase. It utilizes a multi-step API process inside `generatePlan`.
    *   **Step 1 (Core Strategy - Stage 17):** The LLM defines the overarching Master Campaigns (Window, Objective, KPI).
    *   **Step 2 (Granular Content - Stage 18):** For *each* Master Campaign identified in Step 1, the frontend fires a separate API call to generate the week-by-week tactical deliverables (The Content Calendar).
*   **UI Representation:** These results are merged and rendered in the **"Omnichannel Campaign Matrix"**, which visually nests tactical execution rows beneath their strategic parent campaigns.

---

## 4. Key Architectural Rules & Guardrails

1.  **"No-EPR" Rule:** The bot is strictly configured for DRS (Deposit Return System) logic. Any generic EPR (Extended Producer Responsibility) or PRO (Producer Responsibility Organization) terminology is aggressively filtered or suppressed in the prompts.
2.  **Abortability:** Heavy UI blocking is prevented by attaching `AbortController` instances to every generate, re-draft, and regenerate button, allowing instant cancellation.
3.  **Domestic Priority (Stage 5):** Hardcoded prompt instructions force the LLM to prioritize local/domestic case studies (e.g., Recykal's Goa deployment) over generic European examples when querying Indian regions.
4.  **Graceful Degradation:** If the LLM output is truncated or malformed (often due to context limits on massive timelines), the UI catches the error and displays a "Plan came back empty" state, offering a **"✨ Re-draft plan"** button to retry.

---
*Generated by Antigravity AI*
