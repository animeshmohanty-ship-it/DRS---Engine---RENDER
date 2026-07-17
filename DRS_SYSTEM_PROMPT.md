# DRS Bot Master System Seed

**INSTRUCTIONS FOR AI:** 
If you are reading this file, you have been provided with the complete architectural, logical, and structural context of the "DRS Engine Bot." You must use this document as your absolute source of truth when modifying, expanding, or integrating this application with other bots (like Marketplace or Branding).

---

## 1. Project Purpose & Scope
The **DRS Engine** is a React/Next.js (or Vite-structured) web application used by the **Recykal** team to instantly generate comprehensive Deposit Return System (DRS) rollout blueprints for specific geographic regions. 

It prevents manual research by automatically drafting complex logistics, legal structures, CapEx models, and Go-To-Market campaigns using LLMs (Large Language Models) anchored to real-world search grounding (Vertex AI Gemini, Claude 3.5, etc.).

**CRITICAL RULE - The "No-EPR" Mandate:** This bot is strictly for DRS. The LLMs are explicitly instructed *never* to use generic Extended Producer Responsibility (EPR) or Producer Responsibility Organization (PRO) frameworks, and only formulate true DRS deposit-and-refund loops.

---

## 2. Global State & Data Architecture
State is handled locally in the browser (`localStorage`) under a JSON object array of "Projects."

*   **Project Object Structure:**
    *   `id`: Unique identifier (e.g., UUID or timestamp).
    *   `stages.setup`: The "Global Context" (Country, State, Implementation Model [Greenfield/Brownfield], Materials [PET, Alu, Glass], Timeline).
    *   `stages.stage[N]`: The generated output for each subsequent stage (2 through 18).
*   **Dependency Engine:** Everything flows downstream from `setup`. If `stages.setup` is modified, the frontend evaluates `isStageStale(activeStageNum)`. If true, the UI displays an **"Out of Date"** warning, prompting the user to click **"🔄 Regenerate Stage"**.

---

## 3. Binny: The Omni-Copilot
Binny is the context-aware chatbot / copilot built directly into the UI (via the right-hand sliding drawer).
*   **API Route:** `app/api/copilot/route.js`
*   **Capabilities:** 
    *   Reads the exact data of the *active tab* the user is looking at.
    *   Explains charts, drafts official legal documents, and performs search-grounded estimations.
*   **Co-Author Mode (Stage 16):** When the user is on the "Pre-planning" (Campaign Brief) tab, Binny enters Co-Author mode. If Binny and the user agree on a change to the brief, Binny emits a machine-readable block:
    ```json
    ::brief-update::
    {"section":"objectives","content":"Drafted text..."}
    ::end::
    ```
    The React frontend intercepts this block, parses it, and automatically updates the editable textarea fields on the UI without the user having to copy-paste.

---

## 4. The 18-Stage Generation Pipeline
All generation is handled by `app/api/generate/route.js`, which dynamically pulls prompts from `lib/prompts/` and `lib/prompts.js`, injecting the Stage 1 Global Context. The UI uses `AbortController` on all generation buttons (turning them red with **"🛑 Stop Generating"**) to allow safe cancellation.

### Phase 1: Setup
*   **Stage 1:** Core definitions (Geography, Constraints, Materials).

### Phase 2: Market Research (Auto-Cascading)
Triggered sequentially via `generateAllResearch()`:
*   **Stage 2:** Geography & Demographics
*   **Stage 3:** Market Intelligence
*   **Stage 4:** Stakeholder Mapping
*   **Stage 5:** Competitors & Benchmarks. **CRITICAL GUARDRAIL:** Strict prompt instruction to only use *Domestic* precedents (e.g., Recykal's Goa DRS). Foreign/European benchmarks are strictly banned unless no local precedent exists.
*   **Stage 6:** Resistance & Risk Mitigation

### Phase 3: Operational Building Blocks
Generated individually on demand:
*   **Stages 7 - 15:** Legal frameworks, CapEx/OpEx modeling, IT & Software specs, Reverse Logistics (RVM placement density), Financial forecasting, and System Operators.

### Phase 4: Strategy & Campaigns (The Multi-Query Engine)
*   **Stage 16 (Pre-planning):** The LLM synthesizes Stages 2-15 into a 7-section **Campaign Brief** (Situation, Objectives, Audience, Ask, Mandatories).
*   **Stage 17 & 18 (Planning & Content):**
    *   **The Problem:** Generating a 52-week omnichannel calendar in one LLM call causes context truncation and "empty plans."
    *   **The Solution:** A recursive, multi-call engine. 
        1. Call 1 (Core): LLM identifies the overarching Master Campaigns (e.g., "Q1 Retailer Onboarding").
        2. Call 2...N (Content): The frontend loops through the Master Campaigns and fires isolated API calls to generate the granular week-by-week tasks for *just that campaign*.
    *   **The UI:** Rendered as the **"Omnichannel Campaign Matrix,"** which nests the granular deliverables cleanly underneath their strategic parent campaigns.

---

## 5. File & Folder Architecture

*   **`app/page.jsx`:** The monolith React frontend. Contains the Sidebar, Tabs, State Logic, Binny Copilot UI, the Omnichannel Matrix rendering, and the `fetch` orchestration logic.
*   **`app/api/generate/route.js`:** The primary generation backend. Handles the LLM connection and passes the `AbortController` signals.
*   **`app/api/copilot/route.js`:** The backend for Binny. Injects `history`, `stateData`, and the Co-Author prompt blocks.
*   **`lib/llm/*.js`:** Provider abstractions (Gemini, Claude, Groq, Vertex). Manages API keys, model fallbacks, and the unified `.generateGrounded()` search function.
*   **`lib/prompts/` & `lib/prompts.js`:** The repository of all system instructions. Where the LLM constraints ("No EPR", "Domestic Only") live.
*   **`data/projects.json`** (or `lib/supabase.js`): Future-proofing for remote database sync, though currently relying heavily on `localStorage` for rapid prototyping.

---

## 6. Next-Level Integration Vision (The "Omni-Hub")
If you are tasked with expanding this bot, the goal is to integrate it with the **Marketplace Intelligence Bot** and the **Branding Bot**. 
*   **Architecture Goal:** Create a unified Next.js Shell with a global left-sidebar to switch between bots.
*   **Data Goal:** Share `localStorage` / global context so if the DRS bot dictates "15,000 RVMs", the Marketplace Bot can automatically pull supplier pricing for 15,000 RVMs without user re-entry.
*   **Aesthetic Goal:** Implement a premium "Glassmorphism" UI with deep dark-modes and dynamic accent colors (Emerald for DRS, Sapphire for Market, Amethyst for Branding).
