# OUR PROGRESS — DRS Engine Build Log

> **THE RULE:** This file is the single living record of the entire build. Where we stand, what we decide, and every change we make gets recorded here. It must be updated as we work — before/after each meaningful change. Trust THIS file and the code over any older `.md` doc (the skill files and `CLAUDE_HANDOVER.md` are partly stale).

- **Owner:** Animesh Mohanty (animesh.mohanty@recykal.com)
- **Started logging:** 2026-07-15
- **Active codebase:** `drs-bot/web/` ONLY. Ignore everything else in the repo.
- **Live hosting:** Render, tracking the `main` branch. Push to `main` → deploys in ~3–5 min.
- **Local dev:** `start-nextjs-bot.cmd` → `npm run dev` → http://localhost:3002 (port hardcoded).

---

## 1. THE VISION (what we are building toward)

An **AI marketing team** for **Recykal + Retearn** — not a generic tool.

- A system of agents that stands in for a **5–6 person marketing team**, carrying any Recykal/Retearn DRS campaign through the full lifecycle:
  **Research → Pre-planning → Planning → Strategy → Execution.**
- **Human approval at every gate** (agents propose; humans approve; then it acts).
- **Domain = DRS (Deposit Return System)**, and it's wide because DRS sells in three configurations:
  | Configuration | What's marketed |
  |---|---|
  | **Tech Solutions** | Retearn software — QR tracking, computer vision, digital Deposit Refund System, merchant apps, APIs |
  | **RVM** | Retearn **reklaim Pro / reklaim Mini** hardware |
  | **End-to-End Operations** | Recykal's full stack — collection network, aggregation, scheme operated for the client |
- **The content/data must be genuinely Recykal-grade** — not just renaming things "Recykal." The substance of each stage should be what a real Recykal DRS researcher/strategist would produce.

**Companies:**
- **Recykal** — parent. Collection/aggregation network, marketplace, EPR/traceability.
- **Retearn** (child, https://retearn.in/tech/) — the technology layer. Products: **reklaim Pro**, **reklaim Mini**; capabilities: QR-based tracking, computer vision material ID, connected device network, explainable AI, a digital Deposit Refund System with secured payments.

---

## 2. WHERE WE STAND TODAY (baseline audit — 2026-07-15)

**One-line verdict:** A working MVP of a **generic, single-shot DRS *plan generator***. It researches and writes a 15-stage rollout document for *any* company. It is **not Recykal-specific yet**, and it **executes nothing**.

### Architecture
- The **entire UI + all logic + state** lives in ONE file: `app/page.jsx` (~3,655 lines, `'use client'`). ~40 `useState` hooks, no components/Redux/context.
- **One workhorse API:** `POST /api/generate` — builds a stage prompt → calls an LLM → parses JSON → saves. ~90% of the engine.
- **Chat assistant:** `POST /api/copilot` — the "Binny" context-aware chat drawer.
- **Persistence:** browser talks **directly to Supabase** (`projects` table), with `localStorage` fallback. Server also logs every run to `drs_generation_runs` (also powers a Stage-2 "consensus" cache).
- **Prompts:** `lib/prompts.js` (giant switch, stages 3–15) + `lib/prompts/stage2.js` + `lib/prompts/competitors.js` (stage 5).
- **LLM adapters:** `lib/llm/` — Gemini (AI Studio), Vertex, Groq, Claude — all behind a common `generateGrounded()` interface with a fallback chain + 240s timeout.
- **Default model:** Gemini 3.1 Pro (Vertex) — `gemini-3.1-pro-preview`.

### The 15 stages
1. Setup (form, no LLM) · 2. Geography Intel · 3. Market Intel · 4. Stakeholders · 5. Competitors · 6. Resistance · 7. Narrative & Alignment · 8. Blueprint · 9. Execution · 10. Launch Readiness · 11. GTM Launch & Funnel · 12. BTL Activation · 13. Reputation Management · 14. KPIs · 15. Knowledge Base.
- Each stage = bespoke prompt → strict JSON → bespoke UI render block.
- **Grounded (real web search):** stages 2, 3, 4, 5, 6, 12. Everything else is ungrounded synthesis.
- **Dependency chain (loose, mostly optional):** 1→all; 2→6,8,9,11,12,15; 3→4,6,14; 4→6,7; 8→12,15; 9→10.

### What's genuinely good (don't rebuild)
- Real grounded research on 6 stages (actually sourced, not hallucinated) — our strongest asset.
- Multi-provider LLM fallback (rarely hard-crashes).
- Cascading sub-projects (national master → regional children inherit real numbers).
- Stage data chains forward (roadmap is somewhat coherent).

---

## 3. THE GAPS vs THE VISION

- **Gap A — Identity:** Content is generic ("the DRS operator," "RVMs," "scanner app"). Never sells Retearn's real products (reklaim Pro/Mini, QR/CV tech, digital DRS). Hardcoded India/Goa leakage (e.g. "Miramar Beach" injected even for non-India projects).
- **Gap B — Execution:** **No stage does anything in the real world.** Even "Execution"/"Launch" stages only output *text describing* plans. No asset files, no sends, no onboarding, no media buys. This is the heart of the agent-team vision and is 100% unbuilt.

---

## 4. KNOWN ISSUES / TECH DEBT (from baseline audit)

| Sev | Issue | Note |
|---|---|---|
| 🔴 | **Validation is dead code** | `validateStageData()` (route.js:200) is defined but **NEVER called**. Real gate = "did JSON parse?". The `CLAUDE_HANDOVER.md` rule "you MUST keep route.js validation in sync or the UI crashes" is a **myth** — prompt changes are lower-risk than documented. |
| 🔴 | **Latent crash** | route.js:549 references undefined `materials` in Stage 2 finalize fallback → 500 instead of graceful fallback. |
| 🟠 | **Committed secret** | Google service-account key `travel-elry-b6087829f510.json` committed in `drs-bot/web/`. Should be rotated + removed. |
| 🟠 | **Claude option fake** | Selecting "Claude 3.5 Sonnet" in the generator silently uses Gemini (no Claude branch in `/api/generate`; commented out in `provider.js`). Works only in Copilot. |
| 🟠 | **Copilot lies about grounding** | Prompt says "Google Search is active" but `grounding:true` is never passed. Its facts aren't verified. |
| 🟡 | **Dead code** | `/api/stage2` route, `lib/connectors/overpass.js`, `data/projects.json`, and empty stub `buildStage2Prompt` are all unused. |
| 🟡 | **Validation shape mismatches** | Even if it were called, cases 4/5/8 check the wrong keys. Harmless today (never called) but a trap. |
| 🟡 | **"Select All" bug** | Setup dropdown "Select All" picks only stages 2–11 (omits 12–15). Three different notions of "all stages" across the code. |
| 🟡 | **No JSON schema enforcement** | Gemini/Vertex/Claude rely on prompt discipline + regex repair (no `response_mime_type`/`responseSchema`). Groq is the only one using real JSON mode. |

---

## 5. DECISIONS LOG

- **2026-07-15** — Established the vision above (AI marketing team, Recykal/Retearn, human-approved, DRS-wide with 3 configs).
- **2026-07-15** — Agreed: **code is source of truth**, skill `.md` files treated as stale.
- **2026-07-15** — Created this file as the standing build log (THE RULE).
- **2026-07-15** — Set `"autoPort": false` for the `drs-bot` config in `.claude/launch.json` (app needs port 3002; do not kill the user's running dev server — Turbopack cache risk).
- **2026-07-15** — Adopted the **Market Research Director standard** (`market-research-director-drs` skill) for the research phase. Core rule: never fabricate — label every number measured / benchmark(approx) / estimate(with logic). This directly fixes the "made-up facts" problem.
- **2026-07-15** — Scope for this pass: **only Stage 4 & Stage 5** rebuilt to MRD standard. Stages 2, 3, 6 explicitly deferred (user not yet aligned on those).
- **2026-07-15** — **HARD RULE: no EPR anywhere.** The product is DRS-only. All EPR/PRO logic and terminology stripped; never reintroduce. Legit regulators (SPCB, Excise) stay but framed as DRS/deposit regulators.
- **2026-07-15** — **Benchmarks are same-country only.** Recykal's Goa DRS rollout is the go-to domestic (India) precedent. Never cite foreign schemes as benchmarks; never fabricate a domestic one.

---

## 6. CHANGELOG (append every change here)

_Format: date — what changed — files touched — why — verified?_

- **2026-07-15** — Created `OUR_PROGRESS.md` with vision + full baseline audit. — `OUR_PROGRESS.md` — establish single source of truth for the build. — n/a.
- **2026-07-15** — Added `"autoPort": false` to `drs-bot` launch config. — `.claude/launch.json` — record that app requires port 3002. — verified preview loads (HTTP 200).
- **2026-07-15** — Ingested the `market-research-director-drs` skill and adopted its standard (clarify question → method fits question → separate fact/estimate/opinion → lead with answer → tie to decision; DRS math: return-rate elasticity, breakage, TAM/SAM/SOM, break-even). Agreed to apply it to research stages; user aligned on **Stage 4 & Stage 5 only** for now (not 2/3/6 yet). — n/a — approach agreed.
- **2026-07-15** — **Rebuilt Stage 4 (Stakeholders) to MRD standard.** — `lib/prompts.js` (case 4) + `app/page.jsx` (stage 4 UI). — Added Power/Interest quadrant, stance evidence + confidence label (Verified/Inferred/Assumption), loss-aversion + named Recykal/Retearn leverage (reklaim Pro/Mini etc.), concession, mandatory Informal-Sector stakeholder, min 6 stakeholders, plus executiveSummary / assumptions / dataGaps. UI gained an exec-read banner, a Stakeholder Playbook card grid, and an assumptions/data-gaps section. Schema is additive (kept alignmentReadiness/champions/blockers). — compiles clean, no console errors; full generation test to be run on Render.
- **2026-07-15** — **Rebuilt Stage 5 (Competitors) to MRD standard.** — `lib/prompts/competitors.js` + `app/page.jsx` (stage 5 UI). — Added positioningVerdict, per-competitor presenceInMarket + returnRatePerformance + structured marketShare{global,local} with confidence labels, benchmarkSchemes[] (the performance bar), baselineNoDRS (no-DRS floor), dataGaps; moat strategy must name a real Retearn/Recykal capability. UI gained verdict banner, presence/return-rate columns (marketShare object rendered safely with back-compat for old string form), a benchmark-schemes table, and baseline/data-gaps section. — compiles clean, no console errors; full generation test to be run on Render.
- **2026-07-15** — Did NOT touch `route.js` validation: `validateStageData` is dead code (never called), so the new schemas need no validation update. Left it alone to keep the change surgical. — n/a.
- **2026-07-15** — **Added Brief Adherence Mandate (forced tailoring).** — `lib/prompts.js` (shared `contextHeader`, hits stages 3–15) + `lib/prompts/competitors.js` (Stage 5). — Every stage must now honor the brief: reason only about selected materials, stay within the implementation model, serve the stated objective, and account for custom constraints; generic location-agnostic output declared a failure. Stage 2 left untouched (already country/material-tailored by its search-anchor design). — compiles clean, no console errors.
- **2026-07-15** — **Added non-destructive stale-flagging on Setup change.** — `app/page.jsx`. — Each generated stage is now stamped with a `_brief` signature (country, state, model, materials, objective, ops status, timeline, constraints) at generation time (4 write sites: stage2, stage6, standard, stage11). `isStageStale(n)` compares the stamp to the live brief. When they differ: a ⚠️ badge shows on the sidebar item and an orange "Out of date — Regenerate" banner shows atop the stage. Data is KEPT (non-destructive). Old projects with no stamp never falsely flag. — compiles clean, no console errors.
- **2026-07-15** — **Stripped ALL EPR / PRO references (DRS-only rule).** — `lib/prompts.js`, `lib/prompts/competitors.js`, `lib/prompts/stage2.js`, `app/page.jsx`, `app/api/generate/route.js`. — Removed 14 references: "EPR/traceability", "Extended Producer Responsibility (EPR) laws/mandates/regulations", "PRO registration fees / recycling credits", "Digital EPR/PRO platform", "Producer Responsibility Organisation", the "EPR Objective" report label, and dropped **Karo Sambhav** (an EPR company) as a competitor/example. Kept SPCB/Pollution Control Board but reframed as plain DRS/deposit regulators (no EPR framing). Boundary per user: remove EPR/PRO, keep SPCB, drop Karo Sambhav. — compiles clean, no console errors. See [[no-epr-drs-only]] rule.
- **2026-07-15** — **Consolidated Market Research into ONE combined page (sub-tabs).** — `app/page.jsx`. — Per user (Option B): sidebar now has a single "Market Research" item (no sub-items); clicking it opens one page with 5 sub-tabs (2. Geography · 3. Market · 4. Stakeholders · 5. Competitors · 6. Resistance) + a "⚡ Generate All Research" button (runs 2→6 in order) + per-sub-tab "Regenerate Stage". Implementation: added `activeStageNum` (= researchTab when on the research page) so the EXISTING stage 2-6 render blocks are reused verbatim — **zero content/schema changes**; only guards (`activeTab===N` → `activeStageNum===N`), nav jumps (loadProject/handleSetupSubmit → activeTab 'research'), header title, regenerate button, empty-state, and stale banner were rewired. Sub-tabs show ✓ (generated) / ⚠️ (stale). — verified live on the Arunachal project: page loads, tabs switch, Competitors content (positioning verdict) renders; no console errors.
- **2026-07-15** — **Introduced the PHASE layer — grouped research stages under a collapsible "Market Research" phase.** (superseded same day by the combined-page consolidation above; the collapsible sidebar group was replaced by a single Market Research page.) — `app/page.jsx` (sidebar). — Setup stays independent; stages 2–6 (Geography, Market, Stakeholders, Competitors, Resistance) now nest under a collapsible "Market Research" header (▼/▶ toggle, always clickable, remembers open/closed in-session). Stages 7–15 left flat & untouched. Purely organizational (option 1) — each sub-stage still generates individually. This is step 1 of restructuring the flat 15 stages into the marketing-lifecycle phases (Research → Pre-planning → Planning → Strategy → Execution), where each phase = one marketing-team role. — verified live: groups, collapses, and re-expands cleanly; no console errors.
- **2026-07-15** — **Stage 5 benchmarks now DOMESTIC-only.** — `lib/prompts/competitors.js` + `app/page.jsx` (benchmark table). — benchmarkSchemes must come ONLY from within the target country (prioritise the target state); foreign schemes (Germany/Lithuania/Australia) forbidden. **Recykal's live Goa DRS deployment** is the sanctioned domestic precedent (also added to the Recykal capability blurb in Stage 4 & 5 prompts). Anti-fabrication guardrail: if no domestic scheme exists, cite closest real precedent labelled by type, or return empty + note in dataGaps. UI benchmark table gained Location + Type columns and is retitled "Domestic Benchmarks & Precedents (country)". Fixes the "Germany benchmarks are useless for Arunachal" problem. — compiles clean.

---

## 7. NEXT UP (candidate work — not yet started)

- **DONE (2026-07-15):** Stage 4 & Stage 5 rebuilt to MRD standard (pending user's live Render test).
- **Awaiting user verdict:** does the Stage 4/5 output on Render hit the bar? If yes, apply the same MRD treatment to the remaining research stages.
- **Deferred research stages:** Stage 2 (Geography → market-sizing base), Stage 3 (Market → TAM/SAM/SOM + break-even), Stage 6 (Resistance → behavioral-econ + likelihood×impact). Not started — user not yet aligned.
- **NEXT — Pre-planning phase design (lots to decide):** where does Narrative & Alignment (7) go — Research, or the start of Pre-planning? What stages/sub-stages does Pre-planning contain? Then continue grouping 7–15 into their phases (Pre-planning → Planning → Strategy → Execution), mirroring the Market Research group already built.
- **Other candidates (not started):**
  1. **Fix broken/risky items** — rotate committed GCP secret, fix latent Stage 2 crash (route.js:549), remove dead code, make Claude/Copilot options honest.
  2. **Prototype execution layer** — turn one stage from "writes a plan" into "produces a real asset/action" (human-approved). The biggest vision gap.
