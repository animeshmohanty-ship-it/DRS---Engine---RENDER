# DRS Engine - Claude Handover Context

Hello Claude! You are taking over the development of the **DRS (Deposit Return System) Roadmap Engine** for Recykal. This document contains the exact state of the project, the architecture, your immediate next tasks, and a strict list of mistakes to avoid based on previous iterations.

## 1. Project Architecture & Workflow
- **The Application**: A Next.js (App Router) web application that acts as a 15-stage AI generation engine for creating Deposit Return System rollouts.
- **Active Directory**: The active codebase is entirely contained within `drs-bot/web/`. **DO NOT edit or analyze files outside of this folder.**
- **Core Files**:
  - `drs-bot/web/app/page.jsx`: The frontend UI dashboard where stages are rendered.
  - `drs-bot/web/app/api/generate/route.js`: The backend API that validates schemas and calls the LLM.
  - `drs-bot/web/lib/prompts.js`: The "brain" of the engine containing the structured prompt schemas for each stage.
- **LLM Strategy**: We force the LLM to output strict JSON schemas (never markdown or prose) so the Next.js frontend can parse and render the data into specific UI components (like tables and cards).

## 2. Hosting & Git Workflow
- **Local Development**: The project is started locally by running `start-nextjs-bot.cmd` at the root, which runs `npm run dev` and opens `http://localhost:3002`.
- **Git & Render**: The live site is hosted on Render.
  - Render is strictly tracking the **`main`** branch (not `master`).
  - To deploy your changes, you must commit and run `git push origin main`.
  - Once pushed, Render takes about 3-5 minutes to build and deploy.

## 3. Current Project State
We recently expanded the roadmap from 10 stages to **15 stages**. 
We found that the LLM was generating generic, "corporate-speak" output (e.g., "Keeping the city green and empowering citizens"). 

To fix this, we just aggressively overhauled **Stage 7 (Narrative & Alignment)**. Instead of a generic story, Stage 7 now forces the LLM to output:
1. `corePillars` (Economic anchors and trigger events instead of environmental slogans).
2. `frictionPersonas` (Targeting hostile opponents based on Loss Aversion and offering tactical concessions).
3. `hostileObjectionKit` (Providing a Public PR Answer vs. the Internal Reality).

## 4. Your Immediate Next Tasks
Your job is to apply this same aggressive, highly pragmatic, and hyper-specific logic to the next stages:
1. **Overhaul Stage 10 (Launch Gate):** Remove generic checklists. Force the LLM to focus on critical political, financial, and operational bottlenecks (e.g., "Has the Escrow account been funded?", "Is the scanner app approved by the Kirana union?").
2. **Overhaul Stage 13 (Reputation):** Move away from generic PR tracking. Focus on crisis management, political fallout, and tracking local media sentiment aggressively.

*For each stage, you will need to: Update the JSON schema in `lib/prompts.js`, update the validation in `route.js`, and redesign the UI block in `app/page.jsx`.*

## 5. CRITICAL MISTAKES TO AVOID (Strict Rules)
The previous AI made several major blunders. You must avoid these at all costs:

1. **The Cache Corruption Bug:** NEVER run `npm run build` locally in the background if the user's `npm run dev` server is active. This corrupts the Next.js Turbopack cache and causes a "Manifest file is empty" fatal error. If you need to clear the cache, you must kill the node server first, then `rmdir /s /q .next`.
2. **The `route.js` Crash:** Whenever you change the JSON structure in `lib/prompts.js` (e.g., changing `faqKit` to `hostileObjectionKit`), you **MUST** instantly update the corresponding `case` in `app/api/generate/route.js`. If the validation schema doesn't match the new prompt output, the UI will crash and fail to load the stage.
3. **Careless File Replacements:** When using regex or multi-line replacements on `prompts.js` or `page.jsx`, be hyper-aware of duplicate case numbers or matching blocks. Verify your line numbers using terminal searches first so you don't accidentally overwrite the wrong stage.
4. **Workspace Isolation:** Completely ignore legacy root files (like `server.js` or old `.cmd` files other than `start-nextjs-bot.cmd`), `.next/`, and `node_modules/`. All work happens in `drs-bot/web/`.

Good luck, Claude! Keep the LLM prompts ruthless and economically driven.
