# BRD — DRS Marketing Agent (DMA)

**Document type:** Build-ready Business Requirements Document
**Vertical:** DRS (Deposit Return System)
**Engine:** DMS (DRS Marketing System) · part of RMOS / Project MARS
**Version:** 1.0
**Owner:** Director Marketing
**Status:** Ready to build

---

## 0. How to use this document

This document is **self-contained and build-ready**. Upload it to Claude with no other context and it contains everything needed to construct the full DRS Marketing Agent: the architecture, every stage, every workflow, every input and output, every approval gate, and every conditional branch ("if / but" logic).

**Reading order for a builder:**
1. Sections 1–6 define the *machine* (what the bot is, its rules, its orchestrator, its memory).
2. Section 7 defines how a project starts (geography instantiation).
3. Section 8 defines every *stage* in full operating detail — this is the bulk.
4. Sections 9–13 define the cross-cutting systems (gates, governance, metrics, knowledge, appendices).

**Build contract:** anything stated as `MUST` is mandatory. `SHOULD` is strongly recommended. `MAY` is optional. Conditional logic is written as `IF … THEN … ELSE …`.

---

## 1. System overview

The **DRS Marketing Agent (DMA)** is a Claude-powered system that runs the marketing lifecycle of launching and scaling a Deposit Return System in any geography. It automates the majority of the work — research, stakeholder intelligence, narrative, campaigns, content, readiness tracking, performance analysis, and knowledge capture — while humans provide context, attend real-world meetings, and approve at every gate.

DMA is **instantiated per geography** (e.g. Goa, Tamil Nadu, United Kingdom). Each instantiation is a *project* that runs through the stages, produces a launch, and ends by writing a **reusable geography blueprint** back to the Knowledge Base — making the next geography faster.

DMA is the DRS-specific instance of the same operating philosophy used by the Marketplace agent (AI MOS) and the enterprise agent (SMS). It keeps DRS's **own native shape**: 5 layers and 16 stages, with the DMS 9 workflows living inside the marketing core.

### 1.1 What makes DRS different (and why this BRD is not a copy of the Marketplace agent)
1. **DRS is a behaviour-change program, not a digital product.** Public acceptance determines collection performance. The bot manufactures awareness, alignment, and participation — not just web traffic.
2. **DRS touches the physical and political world** — government approvals, machine installation, retail onboarding, reverse logistics. The bot **prepares, drafts, tracks, predicts and recommends**; humans and field teams **execute and approve**.
3. **DRS carries depth Marketplace does not** — a dynamic Geography Engine, Resistance Intelligence, Infrastructure and Operations dependencies, and a T-minus launch engine.
4. **Heavier human-in-the-loop.** Stages involving government, field activation, and launch are human-led; the bot is the staff officer, not the decision-maker.

---

## 2. Philosophy & North Star

### 2.1 Design philosophy
> **DRS is not primarily a waste-management project. DRS is a behaviour-change program. Public acceptance determines collection performance.**

Every workflow exists to raise public legitimacy and participation, or to lower the trust and friction barriers that block it.

### 2.2 North Star — DRS Adoption Index
```
DRS Adoption Index = (Public Awareness × Stakeholder Alignment × Return Participation) ÷ (Trust & Friction Barriers)
```
The system is healthy when more people understand DRS, more stakeholders support it, more containers are returned, and trust/friction barriers fall. **Every stage MUST roll its KPIs up to one of these four terms** (Section 11).

### 2.3 The cardinal rule (a hard guardrail)
> **Communication readiness MUST NEVER exceed operational readiness.**

The bot MUST refuse to scale public communication ahead of operational reality. This rule is enforced by the AI Auditor at Gates 4 and 5 (Sections 3.3, 8, 9).

---

## 3. Core architecture

DMA has four architectural components that operate on every project: the **DRS Project Manager**, the **AI Auditor**, **Project Memory**, and the **Knowledge Base**. They run the universal per-stage loop.

### 3.1 The per-stage loop (the heartbeat)
```
Create / resume project
        ↓
DRS Project Manager loads Knowledge Base + Project Memory
        ↓
Run Stage  (Claude executes the stage's workflows)
        ↓
Collect Outputs  →  Update Project Memory
        ↓
Run AI Auditor   →  Audit Report + Confidence Score + Missing-Info Report
        ↓
Approval Gate    →  human decision (Approve / Revise / Reject / Defer)
        ↓
IF approved → unlock next stage, transfer outputs
IF revise   → re-run named workflow(s) with corrections
IF reject   → branch per gate logic (loop back / park / escalate)
        ↓
Repeat until final stage → write Geography Blueprint to Knowledge Base → close project
```

### 3.2 DRS Project Manager (DPM) — the orchestrator
The DPM is the central coordinator of the whole lifecycle. **It never produces marketing deliverables — it orchestrates while Claude performs the work.**

**Responsibilities (MUST):**
- **Project initialization** — on *Create Project*, create the project workspace and metadata (Section 7).
- **Stage management** — before/during/after each stage: validate entry conditions → create stage folder → load KB + memory → track Claude progress, files generated, knowledge used, risks found → collect outputs.
- **Context / Project Memory management** — thread all prior-stage outputs forward (Section 3.4).
- **Workflow orchestration** — run each stage's sub-workflows in order; respect dependencies.
- **Auditor coordination** — before each gate: lock stage → send outputs to Auditor → attach audit report → present Claude's recommendation + audit findings together → await human decision → on approval, unlock next stage and transfer outputs.
- **Approval management** — render the gate, capture the decision, execute the branch.
- **Timeline management** — track the D-Day countdown and the T-minus launch milestones (Section 8, Stage 6/Execution).
- **Risk register** — continuously maintain Government / Operational / Reputation / Consumer / Resistance risks.
- **Governance hooks** — surface the daily/weekly/monthly cadence artifacts (Section 10).
- **Project completion** — on final gate: write blueprint, archive, generate executive closure report.

**The DPM MUST NOT** advance a stage whose entry conditions or prior gate are not satisfied.

### 3.3 AI Auditor (DRS-tuned)
After Claude finishes a stage and before the human gate, the AI Auditor independently validates the stage's outputs. For DRS it is stricter than a generic auditor because it enforces public-acceptance and the cardinal rule.

**The Auditor checks (per stage, tailored):**
- **Completeness** — are all required outputs present and non-placeholder?
- **Evidence quality** — are claims backed by proof points / data sources? Are claims within the Claims Guardrails (no unverifiable promises)?
- **Knowledge correctness** — was the correct, latest KB used? Were prior geographies considered?
- **Alignment** — does the output align with the geography thesis, objectives, and North Star?
- **Localization** — are mandatory languages covered where the stage requires public-facing assets?
- **Cardinal-rule check** — at any stage that touches public communication or launch: *does communication readiness exceed operational readiness?* IF yes → **Auditor MUST flag BLOCKER** and recommend Hold/No-Go.
- **Missing information** — list gaps that must be filled before the gate can pass.

**Auditor outputs (MUST):** Audit Report, Confidence Score (0–100), Blocker list, Missing-Information Report. The DPM attaches these to the gate.

**Auditor authority:** the Auditor *recommends*; it cannot approve or override a human. But a **BLOCKER on the cardinal rule MUST visually dominate the gate** so a human cannot approve it casually.

### 3.4 Project Memory
A persistent, structured store the DPM maintains across all stages. Schema in Appendix A. At minimum it threads:
```
Project Metadata → Geography Intelligence → Market Intelligence (+ scores)
→ Stakeholder Map → Resistance Register → Narrative & FAQ → GTM → Acquisition
→ Consumer/Behaviour data → Comms & BTL → Infra/Ops readiness (ingested)
→ Analytics → Metrics → Knowledge/Lessons
```
Every stage reads the relevant slice and writes its outputs back. Nothing is re-derived from scratch.

### 3.5 Knowledge Base (KB)
Read at the start of every project, written to at the end. Contents:
- DMS architecture, workflow library, RACI, KPI tree, governance cadence
- Geography instantiation template + all prior **Geography Blueprints** (e.g. Goa)
- Narrative houses, FAQ kits, proof-point banks, claims guardrails
- Government document templates, SOP library, playbooks, campaign assets
- Behaviour-barrier libraries, resistance-mitigation patterns
- Prior performance reports and lessons learned

---

## 4. Scope

### 4.1 In scope — the bot runs these (marketing engine)
Stages **1–10, 13–16** (Project Configuration, Geography, Market, Stakeholder, Resistance, DRS Marketing System, GTM, Acquisition, Consumer Engagement, Communication & BTL, Analytics, Metrics, Knowledge, AI Copilot) plus the **Governance & Cadence** layer.

### 4.2 Tracked dependencies — the bot coordinates but does NOT run these
Stages **11 (Infrastructure)** and **12 (Operations)** are physical/operational. The bot **ingests readiness and performance data** from them, tracks them as dependencies, gates against them (Launch Go/No-Go reads machine/retail readiness; Collection Optimization reads return data), and **raises risks** — but it does not install machines or run reverse logistics. Human/ops teams own execution.

### 4.3 Out of scope
- Actual publishing/transacting/field execution (the bot prepares; humans/integrations execute).
- Government approvals, contract signing, and any legally binding action (human-only).
- Physical machine deployment and logistics (Operations team).

---

## 5. Global rules & guardrails

1. **Cardinal rule** — communication readiness MUST never exceed operational readiness (Section 2.3).
2. **Gate discipline** — no stage advances without passing its gate. The DPM enforces this.
3. **Claims guardrails** — the bot MUST NOT generate public claims it cannot evidence; all public claims pass the Auditor's evidence check.
4. **Localization gate** — public-facing assets MUST cover the geography's mandatory languages before Awareness Scale-Up (Gate 4).
5. **Human-only actions** — government engagement, approvals, signatures, and field execution are human-only; the bot prepares briefs and recommendations.
6. **Loop-backs are normal** — a rejected gate is not failure; it routes to a defined corrective workflow (Section 9).
7. **Everything is owned** — every output, risk, and gate has a RACI owner (Section 10).
8. **Memory before re-work** — the bot MUST read Project Memory before regenerating anything.
9. **Audit before gate** — no gate is shown to a human without an attached Audit Report.

---

## 6. Human / AI split model

For each stage, this BRD specifies a **split tag**:
- **AI-LED** — Claude does ~90%; human approves at the gate. (e.g. Market Intelligence, Narrative drafting.)
- **CO-PILOT** — Claude prepares; human executes the real-world action, then feeds results back. (e.g. Stakeholder Alignment workshops, Acquisition meetings.)
- **HUMAN-LED / BOT-TRACKED** — humans/field own it; the bot tracks, analyzes, and recommends. (e.g. Infrastructure, Operations, government approvals.)

The split is stated in each stage spec (Section 8).

---

## 7. Geography instantiation (project creation)

When a user clicks **Create DRS Project**, the DPM creates a workspace and stores metadata:

```
Project ID        : DRS-GOA-001            (DRS-{GEO}-{seq})
Vertical          : DRS
Geography         : Goa, India
Scope zones       : Panaji, Margao, Mapusa, Vasco, airport/beach corridors
Implementation    : (deposit model / PRO model — from config)
Languages         : English, Konkani, Marathi, Hindi
D-Day             : (target launch date OR "readiness-only")
Budget            : (optional)
Objective         : Public acceptance + return participation
Status            : Active
Current Stage     : 1
Owner / Pod Lead  : (e.g. Alokesh)
```

**Human input at creation (the only mandatory human inputs):**
- Geography (country + region)
- Implementation model (deposit amount / operating model, if known)
- Business objective
- D-Day / timeline (or "readiness-only")
- Budget (optional), Target KPIs (optional), Special instructions (optional)

**The DPM then loads:** DMS KB, geography instantiation template, all prior Geography Blueprints, narrative/FAQ banks, SOP library — and tells Claude: *Start Stage 1.*

**IF the geography already has a Blueprint in the KB** (a prior or similar launch) → the DPM MUST pre-fill Stage 1–3 drafts from it and flag what to validate, rather than starting blank.

---

## 8. The stages

Each stage is specified with the same skeleton:
**Layer · Split · Objective · Entry condition · Human Input · Claude Input · Claude Workflow (sub-workflows) · Claude Outputs · AI Auditor checks · Approval Gate (with branch logic) · Data Passed · Success Criteria · Ifs & Buts · Next Stage.**

DMS workflow mapping (where the 9 DMS workflows live across the stages):

| DMS Workflow | Lives in (12-Stage Build Spec) |
|---|---|
| WF1 Research Impact Assessment | Stage 3 Market Intelligence |
| WF2 Stakeholder Mapping | Stage 4 Stakeholder Intelligence |
| WF3 Narrative Development | Stage 6 Narrative & Alignment |
| WF4 Stakeholder Alignment | Stage 6 Narrative & Alignment |
| WF5 Consumer Awareness | Stage 8 Execution (WS5) + Stage 9 Engagement |
| WF6 Launch Readiness (T-minus) | Stage 8 Execution (WS7) |
| WF7 Reputation Management | Stage 10 Reputation Management |
| WF8 Collection Optimization | Stage 11 Performance & KPI |
| WF9 Narrative Amplification | Stage 12 Knowledge / Reusable Blueprint |

---

### STAGE 1 — Platform Foundation
- **Layer:** 1 (Project Configuration) · **Split:** AI-LED
- **Objective:** Understand the requirement and create the project foundation.
- **Entry condition:** Project created (Section 7).
- **Human Input:** Geography, implementation model, objective, D-Day, budget (opt), KPIs (opt), special instructions (opt).
- **Claude Input:** Project metadata; KB (DMS README, prior Blueprints, SOPs); geography template.
- **Claude Workflow:**
  - WF1.1 Requirement understanding — what geography, why now, what outcome.
  - WF1.2 Historical learning — pull similar prior geographies, lessons, best/failed approaches.
  - WF1.3 Project definition — Business/Geography Brief, objectives, scope, assumptions, constraints, timeline, success KPIs.
  - WF1.4 Foundation — executive summary, initial risk register, project metadata, recommended implementation model + module list.
- **Claude Outputs:** Geography Brief (v0), Project Scope, Objectives, KPIs, Timeline, Risk Register (initial), Executive Summary.
- **AI Auditor checks:** objectives defined; scope complete; KPIs present; timeline realistic; correct KB used; similar projects considered; missing info.
- **Approval Gate — `GATE 0 · Geography Triage`:**
  - **Question:** *Is this geography worth researching?* (cheap, hypothesis-based prioritization — not a launch decision)
  - **Owner:** Director Marketing.
  - **Claude recommendation:** Explore / Park.
  - **Branch logic:**
    - IF **Explore** → unlock Stage 2.
    - IF **Park** → set status `Parked`, store the brief, stop. (Revisit later; no further cost incurred.)
    - IF **Revise / Add info** → re-run WF1.3–1.4 with new input.
- **Data Passed:** Geography Brief, objectives, timeline, KPIs, risks.
- **Success Criteria:** geography hypothesis defined; leadership has chosen to explore or park.
- **Ifs & Buts:**
  - IF objective is vague → Auditor flags Missing-Info; DPM blocks gate until clarified.
  - IF a Blueprint exists for this geography → pre-fill and mark "validate," don't start blank.
- **Next Stage:** 2.

---

### STAGE 2 — Geography Intelligence Engine
- **Layer:** 2 (Geography Intelligence) · **Split:** AI-LED
- **Objective:** Build the dynamic administrative + business hierarchy down to outlet level, and the geography's consumption/tourism/retail profile.
- **Entry condition:** Gate 0 = Explore.
- **Human Input:** None (validation only).
- **Claude Input:** Geography Brief; KB geography templates; prior Blueprints; public datasets the bot can cite.
- **Claude Workflow:**
  - WF2.1 Administrative hierarchy — build the geography-specific tree (e.g. Goa: District→Taluka→Village Panchayat→Village→Outlet; Tamil Nadu: District→Corporation→Zone→Ward→Outlet; UK: Nation→County→Town→Store). **The hierarchy MUST adapt to the geography.**
  - WF2.2 Business hierarchy & outlet mapping — retail landscape, hotels, restaurants, institutions, commercial clusters → outlet universe.
  - WF2.3 Demand context — population, consumption estimates, tourism index, seasonality.
  - WF2.4 Localization scope — set mandatory languages (hard gate input for later).
  - WF2.5 Rollout intelligence — priority talukas/zones, high-consumption areas, tourism hotspots, recommended rollout sequence.
- **Claude Outputs:** Geography Hierarchy, Outlet Universe, Consumption/Tourism profile, Language requirements, Recommended rollout sequence.
- **AI Auditor checks:** hierarchy matches the real geography; outlet universe plausible; data sources cited; languages set; coverage gaps.
- **Approval Gate:** *Is the geography intelligence complete and correct?* → Approve / Revise. (No commit decision here.)
  - IF Revise → re-run named WF2.x.
- **Data Passed:** Hierarchy, outlet universe, demand profile, languages, rollout sequence.
- **Success Criteria:** geography fully mapped to outlet level; languages locked.
- **Ifs & Buts:**
  - IF reliable data is unavailable for a parameter → mark `To be validated by [owner]` rather than fabricating; Auditor flags as Missing-Info (not a blocker yet).
  - IF tourism index is high → tag geography "tourism-sensitive" (affects narrative + rollout).
- **Next Stage:** 3.

---

### STAGE 3 — Market Intelligence  *(DMS begins · WF1)*
- **Layer:** 3 (Implementation Intelligence) · **Split:** AI-LED
- **Objective:** Build the evidence base and the decision scores that determine whether to commit to launch.
- **Entry condition:** Stage 2 approved.
- **Human Input:** None (validation only).
- **Claude Input:** Geography Brief + intelligence; KB benchmarks, prior research; proof-point bank.
- **Claude Workflow (WF1 Research Impact Assessment):**
  - WF3.1 Evidence — environmental impact, economic impact, waste ecosystem, litter/leakage context, tourism/public-space relevance.
  - WF3.2 Policy & benchmarks — regulatory context, international DRS case studies, competitor study.
  - WF3.3 Consumer behaviour & barriers — initial behaviour-barrier hypotheses (barrier → evidence → audience → message → owner).
  - WF3.4 ESG & opportunity — ESG alignment, opportunity assessment, business case, **proof-point bank**, **claims guardrails**.
  - WF3.5 Scoring — compute **Market Readiness Score**, **Implementation Complexity**, **Opportunity Score**.
- **Claude Outputs:** Research Impact Brief, Business Case, Proof-Point Bank, Claims Guardrails, Behaviour-barrier hypotheses, the three scores.
- **AI Auditor checks:** evidence sourced; benchmarks relevant; claims within guardrails; scores justified by data; missing evidence.
- **Approval Gate — `GATE 1 · Geography Selection` (the real commit):**
  - **Question:** *Is this geography worth launching / committing to?*
  - **Owner:** Director Marketing **+ Leadership**.
  - **Required evidence:** validated thesis, regulatory context, feasibility, **the three scores**.
  - **Claude recommendation:** Select / Defer.
  - **Branch logic:**
    - IF **Select** → unlock Stage 4; project enters expensive execution.
    - IF **Defer** → status `Deferred`, store evidence, stop. (Park until conditions change.)
    - IF Opportunity Score < threshold OR regulatory blocked → bot MUST recommend Defer.
    - IF Revise → re-run WF3.x.
- **Data Passed:** Research brief, business case, proof points, claims guardrails, barriers, scores.
- **Success Criteria:** leadership has a defensible Select/Defer decision backed by scores.
- **Ifs & Buts:**
  - IF scores conflict (high opportunity, high complexity) → Auditor surfaces the trade-off explicitly; gate stays a human judgement call.
  - IF evidence cannot answer a likely stakeholder objection → flag as a research gap to close before Stage 6.
- **Next Stage:** 4 (only on Select).

---

### STAGE 4 — Stakeholder Intelligence  *(WF2)*
- **Layer:** 3 · **Split:** CO-PILOT (bot maps; humans engage)
- **Objective:** Identify everyone who can accelerate or block adoption, and score them.
- **Entry condition:** Gate 1 = Select.
- **Human Input:** Known contacts, prior relationships, field knowledge (fed in as available).
- **Claude Input:** Geography intelligence; regulatory context; KB stakeholder patterns; prior Blueprints.
- **Claude Workflow (WF2 Stakeholder Mapping):**
  - WF4.1 Government track — departments, officials, pollution board, municipal authorities, tourism dept.
  - WF4.2 Ecosystem track — PIBO/brands, retail, hotels, restaurants, municipality, panchayat, collectors, NGOs, media, universities, influencers.
  - WF4.3 Scoring — for each: influence × current stance × desired role × priority (P0–P2).
  - WF4.4 Outputs — **Influence Matrix, Champion List, Blocker/Risk List, Engagement Priority Plan.**
  - WF4.5 Per-stakeholder record — Support · Influence · Interest · Resistance · Engagement · Meetings · Follow-ups · Documents · Communication History.
- **Claude Outputs:** Stakeholder Map, Influence Matrix, Champion List, Blocker List, Engagement Plan.
- **AI Auditor checks:** all categories covered; P0 stakeholders identified; champions & blockers named; single-threading risk; missing roles.
- **Approval Gate:** *Have all launch-critical stakeholders been identified and prioritized?* → Approve / Revise / Request more.
- **Data Passed:** Stakeholder map + matrices to Stage 5 and Stage 6.
- **Success Criteria:** complete, scored stakeholder universe with champions and blockers.
- **Ifs & Buts:**
  - IF a P0 government stakeholder is "Unknown" stance → flag as top risk; the bot drafts a first-meeting brief but the **meeting is human-led**.
  - IF a blocker has high influence → auto-create a Resistance item (Stage 5) and a mitigation owner.
- **Next Stage:** 5.

---

### STAGE 5 — Resistance Intelligence
- **Layer:** 3 · **Split:** AI-LED (prediction) + CO-PILOT (mitigation)
- **Objective:** Consolidate everything that could block adoption and plan mitigation. (DRS-specific; no Marketplace/EPR equivalent.)
- **Entry condition:** Stage 4 approved.
- **Human Input:** Field signals, political context.
- **Claude Input:** Stakeholder blockers/concerns; behaviour barriers; media signals; KB resistance-mitigation patterns.
- **Claude Workflow:**
  - WF5.1 Fronts — Government, Retail, Consumer, Brand, Media, Political, Operational.
  - WF5.2 Per item — Root Cause → Impact → Probability → Severity → Mitigation → Owner → Status → Review Date.
  - WF5.3 Signals — compute Resistance Index, Sentiment Map, Heat Map, Trend.
  - WF5.4 Prediction — predict likely future resistance and recommend pre-emptive mitigation.
- **Claude Outputs:** Resistance Register, Resistance Index, Sentiment Map, Heat Map, Mitigation plan with owners.
- **AI Auditor checks:** each front assessed; high-severity items have owners + mitigation; index justified.
- **Approval Gate — `GATE 2 · Stakeholder Readiness`:**
  - **Question:** *Are launch-critical stakeholders aligned enough to proceed?*
  - **Claude recommendation:** Proceed / Engage more.
  - **Branch logic:**
    - IF **Proceed** → unlock Stage 6.
    - IF **Engage more** → loop back to Stage 4/alignment activities; re-gate after.
    - IF a high-severity blocker is unmitigated → bot MUST recommend Engage more.
- **Data Passed:** Resistance Register + index to Stage 6 and to Reputation (Stage 10).
- **Success Criteria:** known resistance is mapped, owned, and mitigated or accepted.
- **Ifs & Buts:**
  - IF Resistance Index rises above threshold at any later stage → DPM re-opens this stage (loop-back) before proceeding.
- **Next Stage:** 6.

---

### STAGE 6 — DRS Marketing System (Core)  *(WF3 + WF4 + WF6)*
- **Layer:** 3 · **Split:** AI-LED (drafting) + CO-PILOT (alignment, launch)
- **Objective:** Turn evidence + stakeholders into a repeatable narrative, align stakeholders, and run launch readiness. This is the DMS core.
- **Entry condition:** Gate 2 = Proceed.
- **Human Input:** Stakeholder feedback from workshops; government alignment outcomes.
- **Claude Input:** Research brief, proof points, claims guardrails, stakeholder map, behaviour barriers, languages.
- **Claude Workflow:**
  - **WF6a Narrative Development (DMS WF3):** Narrative House → Persona Messaging Matrix → FAQ Kit → whitepapers/op-eds/roundtable briefs → **localized message bank** (mandatory languages).
  - **WF6b Stakeholder Alignment (DMS WF4):** workshop agendas, briefing kits, demonstration plans, **Commitment Tracker**, updated Concern Log. *(Workshops are human-led; bot prepares + captures.)*
  - **WF6c Launch Readiness (DMS WF6 — the T-minus engine):** build T-90 / T-60 / T-30 / T-15 / Launch / T+14 plan, each milestone with owner, status, and a **go/no-go confidence score**. Ingests Infrastructure (Stage 11) and Operations (Stage 12) readiness.
  - Each workflow carries: Objectives · Activities · Deliverables · Templates · Budget · Owners · Dependencies · KRAs · KPIs · Reports · Lessons Learned.
- **Claude Outputs:** Narrative House, FAQ Kit, Persona Matrix, Localized Message Bank, Commitment Tracker, T-minus Launch Plan.
- **AI Auditor checks:** narrative evidence-backed & within claims guardrails; persona coverage; FAQ completeness; **localization complete**; **cardinal-rule check** (comms readiness vs ops readiness on the T-minus plan).
- **Approval Gate — `GATE 3 · Narrative Approval`:**
  - **Question:** *Is the story clear, consistent, and evidence-backed?*
  - **Owner:** Director Marketing.
  - **Claude recommendation:** Approve / Revise.
  - IF Approve → unlock Stage 7. IF Revise → re-run WF6a with stakeholder input.
- **Data Passed:** Narrative + FAQ + message bank + T-minus plan to Stages 7–10.
- **Success Criteria:** one approved narrative every stakeholder can repeat; launch plan exists.
- **Ifs & Buts:**
  - IF stakeholders interpret DRS inconsistently in workshops → loop WF6a (narrative revision) before proceeding.
  - IF localization incomplete → Auditor BLOCKER; cannot pass into public-facing stages.
- **Next Stage:** 7.

---

### STAGE 7 — Go-To-Market Engine
- **Layer:** 3 · **Split:** AI-LED
- **Objective:** Convert narrative into a complete GTM plan.
- **Entry condition:** Gate 3 = Approve.
- **Human Input:** Budget constraints, channel preferences.
- **Claude Input:** Narrative, personas, message bank, geography rollout sequence, budget.
- **Claude Workflow:** Segmentation → Target Personas → Positioning → Messaging → Channels → Campaign Calendar → Budget allocation → Execution plan → Monitoring plan → Optimization plan.
- **Claude Outputs:** GTM Blueprint, Campaign Framework, Channel Plan, Campaign Calendar, Budget plan, KPI plan.
- **AI Auditor checks:** GTM complete; channels matched to behaviour barriers; budget aligned; KPI coverage.
- **Approval Gate:** *Is the GTM strategy approved?* → Approve / Revise.
- **Data Passed:** GTM blueprint to Stages 8–10.
- **Success Criteria:** complete, costed GTM aligned to the rollout sequence.
- **Ifs & Buts:** IF budget insufficient for full rollout → bot proposes a phased rollout matched to priority zones.
- **Next Stage:** 8.

---

### STAGE 8 — Acquisition Engine
- **Layer:** 3 · **Split:** CO-PILOT (bot scores/drafts; humans meet/close)
- **Objective:** Build and prioritize the partner universe and pipeline.
- **Entry condition:** Stage 7 approved.
- **Human Input:** Meeting outcomes, proposals, negotiations (real-world).
- **Claude Input:** Stakeholder map, GTM, geography outlet universe.
- **Claude Workflow:**
  - WF8.1 Universe — Government · PIBO · Brands · Retail · Hotels · Restaurants · Bars · Beach Shacks · Casinos · Schools · Colleges · Municipality · Panchayat · CSR · NGOs · Collectors · Recyclers.
  - WF8.2 Pipeline — Universe → Priority → Target → Contact → Meeting → Proposal → Negotiation → Approval → Agreement → Onboarding → Activation.
  - WF8.3 Intelligence — lead score, priority, suggested follow-up, meeting-summary drafting.
- **Claude Outputs:** Target universe, prioritized pipeline, lead scores, follow-up plans, meeting-summary drafts.
- **AI Auditor checks:** universe coverage; prioritization logic; pipeline hygiene; readiness inputs (retail) for Gate 4.
- **Approval Gate — `GATE 4 · Awareness Scale-Up`:**
  - **Question:** *Can public communication begin?*
  - **Required evidence:** FAQ kit ready, retail readiness ≥ threshold, **operational readiness** present, **localization done**.
  - **Claude recommendation:** Scale / Hold.
  - **Branch logic (cardinal rule applies):**
    - IF retail readiness < threshold OR operational readiness absent OR localization incomplete → **MUST Hold** (Auditor BLOCKER).
    - IF Scale → unlock Stage 9 (public awareness).
- **Data Passed:** Pipeline + activation data to Stages 9–10.
- **Success Criteria:** partner pipeline live; readiness confirmed before public comms.
- **Ifs & Buts:** IF P0 retail partners not onboarded → Hold; do not scale awareness in those zones.
- **Next Stage:** 9.

---

### STAGE 9 — Consumer Engagement  *(WF5)*
- **Layer:** 4 (Execution Intelligence) · **Split:** AI-LED (content) + CO-PILOT (field activation)
- **Objective:** Build public understanding and participation intent; drive behaviour change.
- **Entry condition:** Gate 4 = Scale.
- **Human Input:** Field activation results, consumer feedback.
- **Claude Input:** Narrative, message bank, behaviour barriers, channels, languages.
- **Claude Workflow (WF5 Consumer Awareness):**
  - WF9.1 Journey — Awareness → Education → School → College → Community → Retail → Airport → Tourism → Digital → CSR → Feedback → Sentiment → **Behaviour Change**.
  - WF9.2 **Behaviour-barrier activation** — for each barrier: deploy the matched message at the right return-moment channel; owner; measure comprehension.
  - WF9.3 Asset production — awareness creatives, explainers, school kits, retail signage, social/influencer briefs (localized).
- **Claude Outputs:** Consumer Awareness Plan, localized assets, channel calendar, behaviour-barrier tracker, sentiment baseline.
- **AI Auditor checks:** assets localized; messages matched to barriers; comprehension-test plan present; claims within guardrails.
- **Approval Gate:** *Is the consumer awareness program approved to run?* → Approve / Revise.
- **Data Passed:** Awareness data + sentiment to Stage 10 and Analytics.
- **Success Criteria:** awareness live; behaviour barriers being actively addressed and measured.
- **Ifs & Buts:**
  - IF consumers don't understand deposit/return/reward mechanics (low comprehension) → loop to revise messaging.
  - IF return points are not yet live → publish *education* only, not *location/process* guidance (cardinal rule).
- **Next Stage:** 10.

---

### STAGE 10 — Communication & BTL  *(+ WF7 Reputation)*
- **Layer:** 4 · **Split:** AI-LED (comms drafting) + CO-PILOT (BTL execution) + Reputation monitoring
- **Objective:** Run audience-specific communication, execute BTL, and protect reputation through launch.
- **Entry condition:** Stage 9 approved.
- **Human Input:** BTL vendor execution, event delivery, spokesperson actions.
- **Claude Input:** Narrative, stakeholder map, resistance register, media landscape.
- **Claude Workflow:**
  - WF10.1 Communication — Internal · Government · Retail · Consumer · Media · Brand · Partner comms plans + assets.
  - WF10.2 BTL — Planning → Calendar → Vendor brief → Material → Execution plan → Attendance → Bottle-collection capture → ROI → Reports.
  - WF10.3 **Reputation (DMS WF7):** media monitoring, social listening, misinformation detection, **Rapid Response Brief (with SLA)**, retail testimonials, milestone comms.
- **Claude Outputs:** Communication plans, BTL plan + ROI tracker, Rapid Response protocol, media monitoring + sentiment reports.
- **AI Auditor checks:** audience coverage; BTL ROI tracking; rapid-response SLA defined; escalation paths set.
- **Approval Gate — `GATE 5 · Launch Go / No-Go`:**
  - **Question:** *Is the public promise operationally ready to launch?*
  - **Required evidence:** T-minus tracker, Infrastructure & Operations readiness (ingested), rapid-response protocol live.
  - **Owner:** DMS Pod Lead + Operations.
  - **Claude recommendation:** Go / Go-with-conditions / Delay.
  - **Branch logic (cardinal rule is decisive):**
    - IF Consumer Awareness readiness (Marketing) > Infrastructure/Machine readiness (Ops) → **CARDINAL RULE VIOLATION → NO-GO BLOCKER**.
    - IF machine readiness < threshold at T-15 OR retail readiness < threshold → **No-Go or Conditional (limited zones)**.
    - IF Go → proceed to launch + post-launch.
    - IF Delay → reset T-minus, loop readiness items.
- **Data Passed:** Launch package + reputation feeds to Analytics and Operations.
- **Success Criteria:** synchronized launch where the public promise matches operational reality.
- **Ifs & Buts:**
  - IF negative sentiment spikes pre-launch → trigger Rapid Response within SLA; escalate to Comms Head; may force Delay.
- **Next Stage:** 11/12 (tracked) → 13.

---

### STAGE 11 — Infrastructure  *(TRACKED DEPENDENCY)*
- **Layer:** 4 · **Split:** HUMAN-LED / BOT-TRACKED
- **Objective:** Stand up machines/return points. **The bot does not execute this** — it ingests readiness.
- **Bot role:** track Site Identification → Survey → Power → Internet → Permission → Installation → Commissioning → Maintenance → Machine Analytics; surface readiness % into Gates 4 and 5; raise risks; recommend sequencing aligned to priority zones.
- **Inputs to bot:** readiness status per site (from ops/field).
- **Auditor use:** feeds the cardinal-rule check.
- **Ifs & Buts:** IF readiness lags the T-minus plan → bot raises a launch risk and recommends Conditional Launch or Delay.

---

### STAGE 12 — Operations  *(TRACKED DEPENDENCY · WF8 Collection Optimization)*
- **Layer:** 4 · **Split:** HUMAN-LED / BOT-TRACKED (bot analyzes)
- **Objective:** Run the return-to-recycler loop. **Bot tracks + optimizes; it does not run logistics.**
- **Bot role:** ingest Bottle Return → Validation → Refund → Collection → Sorting → Transport → Recycler → PCR → Brand → Reporting data; run **WF8 Collection Optimization** — diagnose location friction, behaviour gaps, cost per container, repeat participation; recommend nudges and comms updates.
- **Approval Gate — `GATE 6 · Post-Launch Optimization`:**
  - **Question:** *What must improve first?*
  - **Claude recommendation:** which workflow to fix (awareness / retail / location / messaging).
  - Branch: route the chosen fix back to the relevant stage (loop-back).
- **Ifs & Buts:** IF return rate < target OR cost per container rises → auto-open an optimization loop and feed insights to Stage 9 (awareness) and Stage 10 (comms).

---

### STAGE 13 — Analytics
- **Layer:** 5 (Performance Intelligence) · **Split:** AI-LED
- **Objective:** Provide role-based dashboards, all filtering by geography + implementation model, all rolling up to the Adoption Index.
- **Claude Workflow:** generate/refresh Executive · Project · Marketing · Stakeholder · Government · Acquisition · BTL · Infrastructure · Operations · Finance · Knowledge dashboards.
- **Outputs:** dashboards + daily/weekly/monthly reports + Adoption Index trend.
- **AI Auditor checks:** data quality, KPI accuracy, dashboard consistency, decision-support readiness.
- **Approval Gate:** *Is performance meeting objectives?* → Continue / Investigate / Optimize (routes to Stage 12 loop).
- **Ifs & Buts:** IF Adoption Index declines for 2 cycles → DPM raises a system-health alert (monthly review).
- **Next Stage:** 14.

---

### STAGE 14 — Metrics Engine
- **Layer:** 5 · **Split:** AI-LED
- **Objective:** Expose every module's metrics with full transparency; separate leading from lagging.
- **Spec:** every module exposes Objective · KRA · KPI · Formula · Data Source · Frequency · Target · Actual · Variance · Trend · Owner.
- **Leading indicators:** stakeholders mapped/briefed, champion commitments, concerns resolved, message comprehension, retail readiness, launch-readiness score.
- **Lagging indicators:** containers returned, return rate, active users, repeat returns, retail participation, cost per container, sentiment trend.
- **Outputs:** Metrics tree mapped to the North Star.
- **Next Stage:** 15.

---

### STAGE 15 — Knowledge Hub  *(WF9 Narrative Amplification + cloning)*
- **Layer:** 5 · **Split:** AI-LED
- **Objective:** Capture everything reusable and produce the next-geography blueprint.
- **Claude Workflow:**
  - WF15.1 **Narrative Amplification (DMS WF9):** turn milestones into case studies, PR, social proof; equip stakeholders with proof.
  - WF15.2 Knowledge capture — SOP library, playbooks, templates, government documents, campaign assets, research papers, lessons learned, best practices.
  - WF15.3 **Reusable Geography Blueprint** — package evidence, narrative, FAQ, stakeholder patterns, and playbook so the next geography starts ahead.
- **Approval Gate — `GATE 7 · Amplification`:**
  - **Question:** *Is there credible proof to share?* → Amplify / Wait.
- **Outputs:** Updated KB, Geography Blueprint, lessons-learned report, executive closure report.
- **Ifs & Buts:** IF no credible milestone yet → Wait; capture internally, do not publish externally.
- **Next Stage:** project close (or loop to next geography).

---

### STAGE 16 — AI Copilot  *(CROSS-CUTTING)*
- **Layer:** cross-cutting · **Split:** AI-LED (assist only)
- **Objective:** Embed AI assistance throughout every stage — not a standalone chatbot.
- **Capabilities:** research summarization, case-study retrieval, stakeholder insights, meeting summaries, GTM drafting, campaign/FAQ/PR generation, KPI explanations, trend analysis, resistance recommendations, report/presentation generation, knowledge search.
- **Principle:** AI advises and accelerates; **approvals and execution stay with humans.**

---

## 9. Gate & branching logic — master table

| Gate | Fires after | Question | Owner | Outcomes & branches |
|---|---|---|---|---|
| **0 · Geography Triage** | Stage 1 | Worth researching? | Director Marketing | Explore → Stage 2 · Park → stop/store · Revise → re-run WF1.3 |
| **1 · Geography Selection** | Stage 3 | Worth launching/committing? | Director Mktg + Leadership | Select → Stage 4 · Defer → park · (auto-Defer IF Opportunity<threshold or regulatory blocked) |
| **2 · Stakeholder Readiness** | Stage 5 | Stakeholders aligned to proceed? | Gov Affairs + Pod Lead | Proceed → Stage 6 · Engage more → loop Stage 4 |
| **3 · Narrative Approval** | Stage 6 | Story clear & evidence-backed? | Director Marketing | Approve → Stage 7 · Revise → loop WF6a |
| **4 · Awareness Scale-Up** | Stage 8 | Can public comms begin? | Pod Lead | Scale → Stage 9 · Hold (MUST IF readiness/localization incomplete) |
| **5 · Launch Go/No-Go** | Stage 10 | Public promise ops-ready? | Pod Lead + Operations | Go · Go-with-conditions (limited zones) · Delay (MUST IF machine/retail readiness<threshold) |
| **6 · Post-Launch Optimization** | Stage 12 | What to improve first? | Operations + Mktg | Pick workflow → loop to Stage 9/10/retail |
| **7 · Amplification** | Stage 15 | Credible proof to share? | Mktg + Comms | Amplify → publish · Wait → capture internally |

**Universal branch rules:**
- **Revise** = re-run the named workflow(s) with corrections, re-audit, re-gate.
- **Reject/Hold/No-Go** = do not advance; route to the corrective stage per table; notify the RACI owner.
- **A cardinal-rule BLOCKER** overrides any "Go/Scale" recommendation until resolved.
- Every loop-back updates Project Memory and the Risk Register.

---

## 10. Governance, cadence & RACI

### 10.1 Roles (RACI)
Director Marketing (system owner) · DMS Pod Lead (geography execution + launch readiness) · Marketing Head (evidence, narrative, awareness, amplification) · Government Affairs Head (stakeholder mapping + alignment) · Communications Head (reputation, rapid response) · Operations Head (launch ops + collection optimization) · Retail/Partner Teams · Data Team · Leadership (geography priority + major decisions).

### 10.2 Cadence (the DPM surfaces these artifacts)
- **Daily** (T-7 → T+14): launch-window check-in — issues, sentiment, escalations, rapid-response approvals.
- **Weekly:** workflow standup → updates the weekly dashboard; biggest friction barrier; next actions by owner.
- **Biweekly:** workflow improvement review — fix the one workflow dragging adoption.
- **Monthly:** system-health review — Adoption Index trend, architecture changes, geography priority.
- **Quarterly:** geography performance review + Blueprint refresh.

### 10.3 Escalation rules
- Narrative disputed / unclear → Director Marketing.
- Any T-minus milestone delayed / readiness out of sync / go-no-go confidence drops → DMS Pod Lead.
- Negative media / misinformation / stakeholder concern goes public → Communications Head.
- Return rate / participation / friction below target → Operations Head.

---

## 11. Metrics engine (North Star roll-up)

```
DRS Adoption Index
 ├─ Public Awareness        ← reach, comprehension, retail deployment, sessions, social, inquiry
 ├─ Stakeholder Alignment   ← mapped, briefed, champion commitments, concerns resolved, retail readiness
 ├─ Return Participation    ← containers returned, return rate, active users, repeat returns, retail participation
 └─ Trust & Friction (÷)    ← negative sentiment, misinformation, unresolved concerns, machine friction, cost/container, complaints
```
Every stage's KPIs MUST map to one branch. The bot computes the Index weekly during launch, monthly after stabilization.

---

## 12. Knowledge capture & geography cloning

On project completion, DMA MUST:
1. Write a **Geography Blueprint** to the KB (evidence + narrative + FAQ + stakeholder patterns + playbook + lessons).
2. Update narrative/FAQ banks, proof-point bank, resistance-mitigation patterns, behaviour-barrier library.
3. Produce an executive closure report.
4. Tag reusable assets for the next geography.

**Cloning rule:** when a new geography is created, the DPM seeds Stages 1–3 from the most similar Blueprint and marks every seeded item "validate," so each launch is faster, cheaper, and more credible than the last.

---

## 13. Appendices

### Appendix A — Project Memory schema (minimum)
```
project:
  id, geography, zones, implementation_model, languages, d_day, budget, status, current_stage, pod_lead
geography_intelligence: { hierarchy, outlet_universe, demand_profile, rollout_sequence, languages }
market_intelligence: { research_brief, business_case, proof_points, claims_guardrails, scores{readiness,complexity,opportunity}, behaviour_barriers[] }
stakeholders: { map[], influence_matrix, champions[], blockers[] }
resistance: { register[], index, sentiment_map, heat_map }
narrative: { house, persona_matrix, faq_kit, message_bank{by_language}, commitment_tracker, t_minus_plan }
gtm: { blueprint, channels, calendar, budget }
acquisition: { universe[], pipeline[], lead_scores }
consumer: { awareness_plan, assets{by_language}, barrier_tracker, sentiment }
comms_btl: { plans, btl_roi, rapid_response_protocol, media_monitoring }
dependencies: { infrastructure_readiness{by_site}, operations{return_rate, cost_per_container, ...} }
analytics: { dashboards[], adoption_index_trend }
metrics: { tree, leading[], lagging[] }
knowledge: { blueprint, lessons, assets[] }
risk_register: [ {type, item, severity, owner, status} ]
gate_log: [ {gate, decision, owner, timestamp, audit_ref} ]
```

### Appendix B — Knowledge Base structure
DMS architecture · workflow library · RACI · KPI tree · cadence · geography instantiation template · Geography Blueprints · narrative/FAQ banks · proof-point bank · claims guardrails · government doc templates · SOP library · playbooks · campaign assets · behaviour-barrier library · resistance-mitigation patterns · prior performance reports.

### Appendix C — Stage → DMS workflow → Gate map
| Stage | DMS WF | Gate |
|---|---|---|
| 1 Platform Foundation | — | Gate 0 Triage |
| 2 Geography Engine | — | (approve/revise) |
| 3 Market Intelligence | WF1 | Gate 1 Selection |
| 4 Stakeholder Intelligence | WF2 | (approve/revise) |
| 5 Resistance Intelligence | — | Gate 2 Stakeholder Readiness |
| 6 DRS Marketing System | WF3, WF4, WF6 | Gate 3 Narrative Approval |
| 7 Go-To-Market | — | (approve/revise) |
| 8 Acquisition | — | Gate 4 Awareness Scale-Up |
| 9 Consumer Engagement | WF5 | (approve/revise) |
| 10 Communication & BTL | WF7 | Gate 5 Launch Go/No-Go |
| 11 Infrastructure | — | (tracked) |
| 12 Operations | WF8 | Gate 6 Post-Launch Optimization |
| 13 Analytics | — | (continue/investigate/optimize) |
| 14 Metrics Engine | — | — |
| 15 Knowledge Hub | WF9 | Gate 7 Amplification |
| 16 AI Copilot | — | cross-cutting |

### Appendix D — Glossary
DRS (Deposit Return System) · DMS (DRS Marketing System) · DMA (DRS Marketing Agent) · DPM (DRS Project Manager) · PIBO (Producer/Importer/Brand-Owner) · PRO (Producer Responsibility Organisation) · BTL (Below-The-Line) · PCR (Post-Consumer Resin) · Adoption Index (North Star) · T-minus (launch countdown) · Blueprint (reusable geography pack).

---

*End of BRD — DRS Marketing Agent v1.0. This document is build-ready: it specifies the architecture, all stages, all workflows, all gates, all branch logic, governance, metrics, and reusable schemas required to construct the DRS Marketing Agent.*
