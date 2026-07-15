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

---

## 6. CHANGELOG (append every change here)

_Format: date — what changed — files touched — why — verified?_

- **2026-07-15** — Created `OUR_PROGRESS.md` with vision + full baseline audit. — `OUR_PROGRESS.md` — establish single source of truth for the build. — n/a.
- **2026-07-15** — Added `"autoPort": false` to `drs-bot` launch config. — `.claude/launch.json` — record that app requires port 3002. — verified preview loads (HTTP 200).

---

## 7. NEXT UP (candidate work — not yet started)

Options on the table (no decision yet):
1. **Deepen research phase for Recykal** — make stages 2–6 Recykal-grade, Retearn-aware, decision-grade.
2. **Fix broken/risky items** — rotate secret, fix latent crash, remove dead code, make Claude/Copilot options honest.
3. **Prototype execution layer** — turn one stage from "writes a plan" into "produces a real asset/action" (human-approved).
4. (Foundational, in progress) — this progress doc.
