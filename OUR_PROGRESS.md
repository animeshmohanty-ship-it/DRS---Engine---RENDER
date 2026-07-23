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
- **2026-07-16** — **Working mode: design-first.** For new phases, design the framework/flow as a doc/HTML and agree it BEFORE touching the bot. Stay at the right altitude (pre-planning = direction, not budgets/execution). See [[design-first-then-build]].
- **2026-07-17** — **BUILT: Orchestrator tab — skill-based task assignment to team.** Scope decision: NOT full bot-dispatch orchestration yet; near-term goal = assign each planned task to the right *person* by skill. New Orchestrator tab (after Planning) pulls Planning content-calendar tasks → table: Task | Funnel | Skill Required | Assignee. Planning tasks now carry `requiredSkills` (taxonomy aligned to team skills). Seeded the **DRS POD roster** (Alokesh POD Lead; Akanksha PR; Vinod Implementation; Tarak Video; Siva/Sai Kiran Data; Narendra Social; Richard/Yash Execution/Events) with skills in `TEAM_MEMBERS`. Token-overlap matcher picks the best-fit default assignee (overridable dropdown); "Auto-assign by skill" fills + persists. Deploy `bbe06fe`. **Verified: 8 tasks auto-assigned correctly (PR→Akanksha, Events→Yash, Video→Tarak, Field→Vinod, Ads→Siva).** Roster seeded in code (org-level); a Team-management screen is a fast-follow. Approval workflow (GM Shreyash locks Pre-planning→Planning) still pending discussion.
- **2026-07-17** — **Planning is now STRATEGY-FIRST: Greenfield/Brownfield-aware Market-Entry Strategy.** case 17 leads with a `marketEntry` block whose whole logic branches on Operations Status — Greenfield = build-from-zero (secure mandate first, then infra/anchors/broaden, longer ramp); Brownfield = leverage-and-expand (convert existing partners first, faster acquisition). Names the incumbent (e.g. TOMRA) + our wedge; derives Beachhead→Expand→Scale sequencing from P0/P1/P2 stakeholders; states honest trade-offs (implications). Grounded on Stage 4/5 (now fed into the prompt). Also added `funnelStrategy` (Branding/Acquisition/Engagement) + a funnel tag on every campaign/content row. Deploy `e294bc7`. **Verified live (Arunachal, Greenfield): entry posture secures Excise/SBM mandate first, wedge vs TOMRA, Beachhead = Excise + top vendors.** Server note: user's dev server had stopped; restarted via launch config `drs-bot`.
- **2026-07-17** — **Streamlined the flow to 4 phases + folded Narrative & BTL into Planning.** Sidebar now: Setup → Market Research → Pre-planning → Planning. Stages 7–15 removed from the active flow (code + render blocks retained, non-destructive — revisit for Orchestration/Execution/Monitoring). Planning case 17 now also outputs a compact **Narrative** block (pillars/personas/objection kit, from the brief's Ask) + requires on-ground/BTL rows; new "Narrative & Messaging" card. Verdicts: KEEP+club → Narrative(7), BTL(12) into Planning; REMOVE-for-now → Blueprint(8), Execution(9), Launch Readiness(10), GTM(11), Reputation(13), KPIs(14), Knowledge Base(15). Deploy `f34cb71`. Verified live. **NOTE: user wants a follow-up "logical + cosmetic" pass next.**
- **2026-07-17** — **FIX: Planning returned empty on longer timelines.** Cause: the weekly content calendar JSON exceeded the model output limit → truncated → unparseable → null → empty tables. Fix: capped the plan (content 8–12 rows, campaigns 3–6, moments 3–5, compact JSON) + raised Vertex maxOutputTokens 8192→16384 + a "plan came back empty — Re-draft" card instead of blank tables. Deploy `f487c17`. Verified: Poland re-drafted cleanly (18 rows, localized moments incl. "Święta").
- **2026-07-17** — **BUILT: Planning stage (v1).** New phase after Pre-planning (internally stage 17). buildStagePrompt case 17 turns the locked brief into 3 parts: **Moments & Seasonality** (grounded festivals/seasons), **Campaign Calendar** (strategic), **Content Calendar** (weekly rows — each an atomic **task** with a suggested executor: Social bot / WhatsApp bot / Ad Runner / BTL Agency / PR). The task shape is the Orchestration contract. Same AI-authored/read-only/Copilot pattern; sidebar "PL" item, auto-open Copilot, "Campaign Plan Co-author" header. Deploy `dd3a9f6`. **Verified live on Arunachal: 200 OK, real grounded moments + calendars with executors (19 task rows).** Copilot on Planning is discuss+Re-draft for now (structured propose→apply into calendar rows = fast-follow).
- **2026-07-16** — **FIX: Market Research stages were vanishing on Generate-All.** Cause: the sequential Generate-All loop rebuilt each write from a stale `projectStages` closure, so each stage overwrote the previous (only the last survived). Fix: added `projectStagesRef` (live mirror) and merge every write into `ref.current` (synced synchronously); also thread `ref.current` into the API `projectData`. Deploy `5670a9a`. **Verified live: Generate-All kept stages 2,3,4,5 all ✓ at once while 6 finished — no vanishing.**
- **2026-07-16** — **BUILT: Porter's Five Forces (Stage 5) + PESTLE (Stage 6)** as additive synthesis lenses (prompt + UI). Deploy `31500d6`. Verified compile.
- **2026-07-16** — **BUILT: Pre-planning stage (full).** Campaign Brief with SWOT + 7 editable sections + chat co-author (copilot proposes `::brief-update::` blocks → Apply/Dismiss cards write into the brief). Backend = buildStagePrompt case 16 synthesizing Stages 2–6; routed via activeStageNum→16 reusing generate/stale plumbing. Deploy `5a3bf57`. **Verified live on Arunachal: draft returned 200, SWOT + all 7 sections rendered, no errors.** Minor cosmetic: copilot drawer header still shows "(Setup)" label on the pre-planning tab — functionality unaffected.
- **2026-07-16** — **Delivery TATs set** (build targets): **Pre-planning → 17 Jul · Planning → 20 Jul · Orchestration → 22 Jul.** Execution = later. Added to framework doc v0.4 (lifecycle nodes + phase badges).
- **2026-07-16** — **ULTIMATE VISION locked (from manager/director):** the bot is the BRAIN + CONDUCTOR of **360° campaigns**. Full pipeline: **Setup → Market Research → Pre-planning → Planning → Orchestration → Execution.** Planning breaks the campaign into atomic **tasks**; Orchestration adds **ownership + approvals + skill-based routing to a capable executor + dispatch + control tower**; Execution runs them. **Execution is ultimately built natively here** (the goal); the team's existing execution bots (ad runner, WhatsApp, social) are an **interim** dispatch target. The **task model is the contract** — same shape whether run by an external bot now or a native module later. **Sequencing:** build the brain first → get everything working through Orchestration → only then decide native vs separate execution bots. **Orchestration = the near-term milestone.** Captured in framework doc v0.3. See [[drs-ultimate-vision]].
- **2026-07-16** — **Added analytical frameworks as ADDITIVE synthesis layers** (not replacements): **SWOT** in Pre-planning (drawn from Stages 2–6; feeds Situation & Challenge), **Porter's Five Forces** atop Stage 5, **PESTLE** atop Stage 6. Each is a synthesis of that stage's own data (the "so what"), shown above the raw findings. Dropped TAM/SAM/SOM (too heavy). Generation stays **one-tap Generate All (stages run one by one) + per-stage regenerate** — frameworks generate WITH their stage, no separate button. Captured in framework doc v0.2.
- **2026-07-16** — **Pre-planning = the Campaign Brief (Charter)** [flavor B]. Its one job: write a locked brief that Planning/Strategy/Execution obey. It decides WHAT/WHY/FOR-WHOM/LIMITS, never HOW. Agreed 7 sections: Situation, Challenge, Objectives & North Star, Target Audience, The Ask, Scope In/Out, Mandatories & Constraints. First human+AI phase (AI drafts from research → human decides → AI challenges → lock). The Copilot upgrades to a brief co-author (propose→approve, grounded, completeness-nudging).

---

## 6. CHANGELOG (append every change here)

- **2026-07-18** — **Export to Sheets (formatted XLSX).** New `app/api/export/route.js` (ExcelJS) builds a styled multi-tab workbook — Task Calendar (grouped by campaign, frozen bold header, funnel-colored cells, assignees), Campaigns, Moments — returned as a download. "⬇ Export to Sheets" button in the Orchestrator section. Opens in Google Sheets/Excel; free, no cloud/API. Added `exceljs` dep. Deploy `bc1619a`. Route syntax-checked; browser compile-verify was unavailable (classifier down) — verify on Render.
- **2026-07-23** — **Binny full-page toggle (flexible Copilot).** Binny was locked to a fixed 340px sidebar; added a display-mode toggle so it can expand to a full-screen overlay and dock back. New `copilotFullpage` state + "⤢ Full page / ⤡ Dock" button in the Copilot header (`app/page.jsx`); `.copilot-panel.fullpage` CSS (`position:fixed; inset:0`, centered 900px conversation, 720px message column) in `globals.css`. Pure UI — no backend/logic touched, fully reversible. First step toward a future conversational-first shell (three-pane chat + artifact canvas — designed, deferred). `next build` passed. Deploy `8644f19`. Verify on Render.

_Discussed, not built:_ Stage-2 data reliability — grounded AI web search is non-deterministic; Consensus Engine (`lib/utils/consensus.js`, mode across `drs_generation_runs`) already stabilizes it. Explored replacing volatile touchpoint counts with **Google Places API** (enabled on `travel-elry` but rejected: paid + 60-result cap) → leaning to **OpenStreetMap Overpass** (free, real coords, no cap) for touchpoints + official stats APIs (data.gov.in/ONS/Eurostat) for population. Deferred. Also designed (deferred): full conversational-first UI (Setup→Research→Charter→Plan→Orchestrator as chat turns + gates + artifact canvas), to be built as a parallel `/chat` route so current UI stays default and reversible.

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
- **2026-07-15** - **Stage 5 benchmarks now DOMESTIC-only.** - `lib/prompts/competitors.js` + `app/page.jsx` (benchmark table). - benchmarkSchemes must come ONLY from within the target country (prioritise the target state); foreign schemes (Germany/Lithuania/Australia) forbidden. **Recykal's live Goa DRS deployment** is the sanctioned domestic precedent (also added to the Recykal capability blurb in Stage 4 & 5 prompts). Anti-fabrication guardrail: if no domestic scheme exists, cite closest real precedent labelled by type, or return empty + note in dataGaps. UI benchmark table gained Location + Type columns and is retitled "Domestic Benchmarks & Precedents (country)". Fixes the "Germany benchmarks are useless for Arunachal" problem. - compiles clean.
- **2026-07-17** - **Merged Campaign & Content Calendars into grouped UI.** - `app/page.jsx`. - The two separate tables in the Planning stage were disjointed. Replaced them with a single "Omnichannel Campaign Matrix" card. It renders each Master Campaign as a header block (showing Window, Objective, KPI) and directly nests all of its granular tactical tasks (from the content calendar) underneath it. This clearly visualizes the Parent-Child relationship between strategic initiatives and POD execution tasks. - verified live.
- **2026-07-18** — **Cleaned Binny formatting.** Chat now renders markdown (bold/italic/code/links/breaks) via a CSP-safe escape-then-whitelist renderer instead of showing raw `**`; TTS speaks stripMarkdown(text) so it no longer reads symbols aloud. Deploy `23f03a4`.
- **2026-07-18** — **Talking Binny — Google TTS voice replies.** — new `app/api/tts/route.js` + `app/page.jsx`. — TTS via Google Cloud Text-to-Speech using the SAME Vertex service account (`travel-elry`, verified HTTP 200); default voice `en-IN-Neural2-B` (Hindi voices available). Copilot header gets a "🔊 Voice" toggle; when on, Binny speaks each reply (proposal JSON stripped from spoken text). Apply stays a click. Deploy `1e98c0b`. Verified creds/TTS call works; local `/api/tts` 404'd only because the running dev server hadn't hot-loaded the new route — builds fresh on Render. Next-tier options: hands-free auto-send loop, voice picker (Hindi/Indian English), premium voice per-language.
- **2026-07-18** — **Binny chat-editing extended to ALL sections (was Pre-planning only).** — `app/api/copilot/route.js` + `app/page.jsx`. — Co-author "propose → approve" now works on Pre-planning (brief), Planning (edit/add/remove campaigns & tasks), Orchestrator (reassign by chat), and Market Research rows (stakeholders/competitors/resistance). Universal `::content-update:: {op,target,index,field,value}` proposal format; generic `applyContentUpdate()` patches the right stage via the live-ref merge; Apply/Dismiss cards. Human-approval gate unchanged; Setup stays a form. Deploy `8418576`. Compile-clean; user to verify on Render.
- **2026-07-17** - **Added "Stop Generating" AbortController functionality.** - `app/page.jsx`. - The generation buttons used to trap the user for 30+ seconds. Added `AbortController` instances to the React state and injected `signal: controller.signal` into all `fetch('/api/generate')` backend calls (for Research, Pre-planning, and Planning). The button now turns red ("🛑 Stop Generating") while active, and clicking it aborts the generation cleanly without crashing the UI. - verified live.


- **2026-07-17 [Antigravity]** - **Model Selector UI Upgrade.** - `app/page.jsx` - Replaced standard `<select>` with a custom React dropdown featuring SVG logos for Gemini, Meta (Llama), and Anthropic (Claude) to improve premium look and feel. - verified live.
- **2026-07-17 [Antigravity]** - **Orchestrator Copilot Header Fix.** - `app/page.jsx` - Fixed a bug where the Copilot header defaulted to "Setup" on the Orchestrator tab due to a missing switch condition. It now correctly reads "Task Orchestrator". - verified live.
- **2026-07-17 [Antigravity]** - **Binny Persistent & Multi-Thread Chat.** - `app/page.jsx` - Overhauled Copilot memory. Chats are now persistently saved in `localStorage` scoped to `projectId` (no more disappearing on refresh). Replaced the "Reset" button with a sleek "Chats ?" dropdown allowing users to create new chat threads, switch between past threads, and delete them, bringing it up to parity with ChatGPT/Gemini UI. - verified live.

---

## 6b. DONE (2026-07-17) — multi-query Planning generation (dense calendars)

**Built + deployed `4f7af46`.** Planning now generates in multiple progressive calls: `case 17` (action 'core') returns strategy + funnel + moments + narrative + a RICH campaign calendar (6-12 campaigns across the real timeline) with `contentCalendar` left empty; new `case 18` generates the DENSE content calendar for ONE campaign (~1 entry / 3 days). `generatePlan()` runs core then loops per-campaign, appending content rows via the projectStagesRef live-merge, with a progress line. `generateStage(17)` short-circuits into it. **Verified live (Arunachal): content grew to 35+ rows progressively, no truncation, no errors.** (Original spec kept below for reference.)

### Original spec — richer, multi-query Planning generation

**Problem:** Campaign + Content calendars are too thin (~1 campaign/month) because case 17 output was capped to avoid truncation. Need dense, timeline-driven calendars (campaigns spread across the real Setup dates; content/social calendar at ~1 entry per 3 days) with proper flow.

**Solution (agreed):** split Planning's single generation (case 17) into MULTIPLE sequential API calls — one per section — each loading progressively (same pattern as Market Research "Generate All" 2→6). Small calls = no truncation + each section can be rich.

**Proposed flow (Generate Plan):**
1. Market Entry (call 1, from brief+research) → 2. Funnel Strategy (call 2, uses entry) → 3. Moments (call 3) → 4. Narrative (call 4) → 5. Campaign Calendar (call 5 — RICH: many campaigns across the timeline, not 1/month) → 6. Content Calendar (call 6+ — DENSE).

**Density logic:** content cadence derived from Setup timeline (e.g. totalDays/3 ≈ entries). For long timelines, generate the content calendar **per campaign** (a loop) so each call stays small but the aggregate is dense (~every 3 days). Each row keeps `requiredSkills` + `funnel` + `executor` (feeds Orchestrator).

**Implementation notes:**
- Backend: add a `planSection` param (or cases 17a-f) so the prompt builder can return ONE section's JSON at a time. Reuse `buildStagePrompt`/route generic path.
- Frontend: a `generatePlan()` orchestrator that runs the sections in order, merging each into `projectStages.stage17.data.<section>` via the **projectStagesRef live-merge pattern** (avoids the vanishing-stages bug), with per-section progress UI ("Market Entry ✓ · Funnel ✓ · Content ⏳").
- Keep the existing single-call case 17 as a fallback or replace it.
- Raise/keep Vertex maxOutputTokens (currently 16384); per-section calls should comfortably fit.

## 7. NEXT UP (candidate work — not yet started)

- **DONE (2026-07-15):** Stage 4 & Stage 5 rebuilt to MRD standard (pending user's live Render test).
- **Awaiting user verdict:** does the Stage 4/5 output on Render hit the bar? If yes, apply the same MRD treatment to the remaining research stages.
- **Deferred research stages:** Stage 2 (Geography → market-sizing base), Stage 3 (Market → TAM/SAM/SOM + break-even), Stage 6 (Resistance → behavioral-econ + likelihood×impact). Not started — user not yet aligned.
- **Pre-planning framework — DONE (design only, 2026-07-16):** flavor + 7 brief sections + chat co-author + flow agreed. Captured as an HTML framework doc (artifact): https://claude.ai/code/artifact/22f90e4d-ca7f-4fd5-962d-0c7c005bfd59 (source: scratchpad/drs-framework.html). NOT built in the bot yet.
- **NEXT (open — "we'll see"):** options — (a) build the Pre-planning stage in the bot per this framework; (b) design the downstream phases (Planning/Strategy/Execution) as docs first; (c) resolve where Narrative & Alignment (7) lives (currently proposed as "The Ask" in the brief vs downstream Strategy).
- **Other candidates (not started):**
  1. **Fix broken/risky items** — rotate committed GCP secret, fix latent Stage 2 crash (route.js:549), remove dead code, make Claude/Copilot options honest.
  2. **Prototype execution layer** — turn one stage from "writes a plan" into "produces a real asset/action" (human-approved). The biggest vision gap.
