# DRS Bot — Build Spec (DRS SKILL)

**Status:** Living document. We lock the flow **one stage at a time**; each stage is written here in full once agreed. This is the source of truth used to build the production-level DRS bot.

**Owner:** Director Marketing / DRS Pod
**Vertical:** DRS (Deposit Return System)

---

## 0. How this document is built

- We fix the flow **stage by stage** in chat.
- The moment a stage is agreed, it is recorded here in detail — Purpose, what we Ask, what the bot Pulls, what it Generates, and what it Shows.
- Stages not yet agreed are marked **[TBD]** and left empty until we lock them.
- Nothing is added to a locked stage without an explicit decision.

---

## 1. Foundations (locked)

**What the bot is:** a roadmap engine. A DRS pod leader enters business context once (Stage 1); the bot then generates a **data-driven roadmap to implement** for the chosen geography — not a status tracker, a guide the pod leader executes.

**Three implementation models** (chosen in Stage 1 — this is the one selection that branches the whole downstream plan):
1. **End-to-End DRS (Scheme Operator)** — Recykal does everything: onboarding producers/brands, printing QR codes, onboarding HORECAs (Hotels/Restaurants/Cafés), onboarding panchayats, deploying RVMs, collection, deposit handling, operations. *Example: Goa DRS.*
2. **RVM-only Provider to Retail** — Recykal only supplies RVM hardware to retailers; the scheme itself is run by someone else (scheme operator / government). Much narrower scope. *Example: UK DRS.*
3. **Tech Solutions (SaaS/Platform)** — Recykal acts purely as the technology and transaction engine (SaaS platform). We set up the central Escrow account clearinghouse, enable end-to-end container traceability, and design the digital flow, but third parties run all physical logistics and RVM operations. *Example: National clearinghouse.*

**Three ways the same plan is sliced (view dimensions):**
- **Process** — the stages of the flow.
- **Geography** — dynamic hierarchy that adapts to the selected state (e.g. Goa → District → Taluka → Village Panchayat → Village → Outlet; Tamil Nadu → District → Corporation → Zone → Ward → Outlet; UK → Nation → County → Town → Store).
- **Material** — Liquor (beer + hard liquor / glass), MLP (Multi-Layered Plastic), Cans, PET (editable/extensible list).

**Material phasing = sequencing only.** Phasing (Phase 1 / 2 / 3, e.g. default Liquor → MLP → Cans) decides only **what rolls out when**. It does **not** change the plan structure. The bot generates the **full plan for every material**; phase is just a rollout-order overlay. Phasing is **flexible and reorderable per state** (a state may put MLP as Phase 1).

**Dynamic geography:** the bot does not assume one geography — the pod leader selects Country → State, and the hierarchy/data adapt.

**Gates:** the product UI has **no approval gates for now** (removed by decision; can be revisited later).

**DRS Operating Model — collection mechanics (liquor phase · reference, informs Stages 7–13):**
- **QR is applied to the bottle upstream** (at production/filling — Recykal's "QR printing"). Liquor shops sell already-QR-tagged bottles.
- **Deposit lifecycle:** deposit charged at point of sale (liquor shop) → refunded at return.
- **Two return channels:**
  - Consumer → **panchayat RVM** → **consumer** refunded
  - Bar/HORECA → **scheduled pickup** → **the bar** refunded
- **Touchpoint roles & onboarding (liquor):**
  - **Liquor shops** — point of sale; **NOT onboarded** (stakeholder only — they sell the QR bottles)
  - **Bars / HORECA serving liquor** — onboarded via **GST + FSSAI + agreement**; **no RVM**; **scheduled pickup** of empties; refund to the bar
  - **Panchayats** — onboarded via **NOC + agreement**; **1 RVM each** (count flows from Stage 2 panchayat counts); consumer returns + refund
- **RVMs are deployed at panchayats only (1 per panchayat).** Bars/HORECA use pickup; liquor shops are sale points.
**All materials use the SAME deposit-return process** — QR applied upstream → deposit charged at point of sale → return → cash refund. The only variable is the **return device:**
- **RVMs** — at panchayats and larger return points.
- **Small scanners** — lighter devices for **MLP** and **smaller/distributed return points** (kirana, communities).

**Per-material operating model:**
- **Liquor** (locked above) — liquor shops (sell QR, not onboarded) · bars/HORECA (GST+FSSAI → scheduled pickup → bar refund) · panchayats (NOC+agreement → 1 RVM → consumer refund).
- **PET** — QR + deposit at POS (retail/kirana/supermarket/HORECA) → return → consumer refund. Touchpoints: retail/kirana/supermarkets (point of sale; larger may host return) · panchayats (NOC+agreement → RVM) · HORECA/retail hosting collection (GST+FSSAI → pickup/RVM). Recyclate: high (food-grade rPET).
- **Cans** — ≈ PET; **highest recyclate value** (aluminium), crush cleanly in RVMs. Same touchpoints and return channels.
- **MLP** — **same process as the others** (NOT a separate take-back/reward model): QR + deposit at POS → return via **RVM or small scanner** → consumer refund. Touchpoints: retail/kirana/communities/schools (sale + small-scanner return) · panchayats (RVM) · brands (funding).

| Material | QR + Deposit | Return device | Refund |
|---|---|---|---|
| Liquor | ✅ at POS | Panchayat RVM + bar pickup | Cash |
| PET | ✅ at POS | RVM (+ HORECA/retail pickup) | Cash |
| Cans | ✅ at POS | RVM (crush) | Cash |
| MLP | ✅ at POS | **RVM or small scanner** | Cash |

**AI Section (cross-cutting — embedded in EVERY tab/stage/workstream):**
- Every tab carries an embedded **context-aware AI copilot** the pod leader can ask anything.
- **Scoped + fully informed:** it knows *that tab's* data **plus** the entire project — all stages/workstreams in Project Memory + the Knowledge Base + live connector data. (Government tab → "draft a follow-up to the Excise Commissioner"; Onboarding tab → "which panchayats in Bardez aren't onboarded yet?")
- **Four capabilities:** (1) answer questions about the tab's data · (2) explain any figure + its source · (3) **draft/redraft the documents** (emails, agreements, notifications) · (4) suggest the next action / surface blockers & dependencies.
- **Grounded:** always cites sources, uses real data, flags estimates — never invents facts.
- **Guardrailed:** AI **advises and drafts; the pod leader approves and executes** (clear read-vs-act line).
- **One assistant, many contexts:** the same copilot everywhere, auto-scoped to the open tab.
- **Governance & Cadence Engine:** The AI automatically prepares agendas for the Weekly DMS Workflow Standup and Monthly Health Review, pulling the biggest friction barriers and assigning next actions based on the active tab's data.

**History tab (cross-cutting):**
- Once a project's plan is prepared, it is **saved**. A top-level **History tab** lists all projects (e.g. DRS-GOA-001, DRS-TAM-001) with metadata — state · implementation model · materials · date · status.
- Clicking a project **revisits the full plan** — every stage/tab (Setup → … → Knowledge/Blueprint) exactly as generated, with its data, scores, and generated documents.
- Read-only revisit + **resume / edit / clone** options. Powered by Project Memory.

---

## 2. Per-stage spec template

Every stage below is recorded against this template:

- **Purpose** — one line.
- **Ask** — what the bot asks the pod leader (mostly Stage 1).
- **Pull** — what real data the bot fetches, and from where (connector).
- **Generate** — the roadmap/plan output the bot produces.
- **Show** — what appears on the page; what the pod leader can edit/act on.

---

## 3. Stages

### Stage 1 — Project Setup  **[LOCKED]**

**Purpose:** Capture the business context once. Stage 1 is **input only** — generation begins from Stage 2.

**Ask** — the complete set of inputs the pod leader enters (do not add or remove):

**A · Project basics**
- **Vertical** → DRS *(locked for now)*
- **Implementation model** *(required)* → End-to-End DRS (Scheme Operator) | RVM-only Provider to Retail
- **Geography** *(required)* → Country → State/region *(drives the geography engine)*
- **Business objective** *(required)* → what success looks like
- **D-Day / target launch** *(required)* → date, or "readiness-only"
- **Budget** *(optional)*

**B · Materials & phasing** *(required)*
- **Material list** *(editable / extensible)* → Liquor (beer + hard liquor), MLP, Cans, PET, + add
- **Phase order** *(reorderable)* → assign materials to Phase 1 / 2 / 3… *(default Liquor → MLP → Cans, fully changeable)*
- **Deposit value per material** *(optional)* → deposit can differ by material (bottle vs can vs PET)

**C · Localization & stakeholders**
- **Languages** *(auto-suggested from geography, editable)*
- **Priority stakeholders / special instructions** *(optional)*

**Pull:** *(none in Stage 1 — input only)*
**Generate:** *(none in Stage 1 — generation starts Stage 2)*
**Show:** the input form only. On submit → proceed to Stage 2.

**Notes:**
- The **implementation model** branches everything downstream (full scheme vs RVM-to-retail).
- The **material list + phase order** is captured here once; the bot then generates the plan for **every material**, with phase = rollout sequence.

---

### Stage 2 — Geography Intelligence & Rollout  **[LOCKED]**

**Purpose:** Take the state chosen in Stage 1, build the **adaptive geography hierarchy**, pull the **real data**, and produce the **recommended rollout sequence**. This is the first generated section of the roadmap.

**Ask:** minimal. Stage 1 already captured inputs. At most, the pod leader may **confirm or override the recommended launch zones**. Otherwise nothing.

**Pull (real data for the selected state, each figure source-badged):**
- Administrative hierarchy (districts → talukas/wards → panchayats/municipalities → villages/wards)
- Population per unit
- **Consumption per material** (Liquor / MLP / Cans / PET)
- Tourism index / footfall
- **Touchpoint universe** (see breakdown below)
- Regulatory context
- Sources: Census · Excise · Tourism Dept · Places/retail data · internal CRM (validate)

**Generate:**
- The **dynamic hierarchy** for that state, down to outlet/store level
- The **touchpoint universe** mapped per unit, **broken down by type**
- A **demand profile per material**
- A **recommended rollout sequence** (which talukas/zones first, with data reasoning) — shown **per material**

**Show — exactly this layout:**

**① State summary (top of page)** — geography + model + population + tourism + districts/talukas count; **consumption per material**; **touchpoint universe totals**; all source-badged.

**② Drill-down table** — expandable hierarchy:
`State ▸ District ▸ Taluka ▸ Panchayat/Municipality ▸ Village/Ward ▸ Touchpoints`
Every row carries the same columns: **Population · Tourism · Consumption (per material) · Touchpoints by type · Recommended phase**.

**③ Per-unit detail (when a level is expanded)** — population, tourism, consumption per material, and the **touchpoint breakdown by type** (the onboarding universe), each both a point-of-sale and a return point:

| Touchpoint type | Examples | Most relevant materials |
|---|---|---|
| **Liquor outlets** | Bars/pubs, liquor/wine shops, beach shacks, casinos, clubs | Liquor |
| **HORECA** | Hotels, restaurants, cafés | Liquor, Cans, PET |
| **Retail / Kirana** | Kirana, supermarkets, convenience | MLP, PET, Cans |
| **Collection / civic** | Panchayat/municipal centres, RVM sites | All (return points) |

Plus a **Recommended phase** per unit with its data rationale.

**④ Material toggle (top-right):** select a material → the table foregrounds that material's relevant touchpoints + its consumption (e.g. Liquor → bars/liquor shops/beach shacks/casinos/HORECA-with-bar; PET → retail/kirana/HORECA). Same plan, sliced per material.

**⑤ Recommended rollout (geography sequence):** phased list of talukas/zones with rationale, **editable** (pod leader can reorder).

**Implementation-model difference:**
- **End-to-End (Goa):** full depth — districts, talukas, **panchayats, HORECA, beach shacks, casinos**, retail, outlets, RVM sites (Recykal onboards all).
- **RVM-only (UK):** shallower — `Nation → County → Town → Retail stores/chains` with store counts + footfall only; no panchayat/HORECA onboarding depth (Recykal isn't running the scheme).

**Worked example (Goa, End-to-End) — Tiswadi taluka (HQ Panaji):**
- Population 1.8 L · tourism High
- Consumption: Liquor ~1.4 Cr units/yr · PET 3.1 Cr · Cans 0.9 Cr · MLP 1.3 Cr
- Touchpoints — Liquor outlets 251 (bars 120 · liquor shops 85 · beach shacks 40 · casinos 6) · HORECA 590 (hotels 180 · restaurants 320 · cafés 90) · Retail/Kirana 735 (kirana 640 · supermarkets 25 · convenience 70) · Collection/civic 26 (centres 8 · RVM sites 18)
- → Recommended **Phase 1** (highest liquor consumption + tourist footfall + densest liquor & HORECA outlets)
- Rollout: Phase 1 Tiswadi + Salcete → Phase 2 Bardez + Mormugao → Phase 3 interior talukas
*(All figures illustrative — pulled live from connectors in production, source-badged, estimates flagged for validation.)*

---

### Stage 3 — Market Intelligence  **[LOCKED]**

**Purpose:** Build the **deep evidence base + business case** for the DRS in this geography, **per material** (Liquor / MLP / Cans / PET). Goes deeper than Stage 2 — does **not** repeat geography/consumption/touchpoints. **DRS-only — no EPR framing.**

**Ask:** minimal — pod leader may add known context / specific competitors. Otherwise fully generated.

**Pull (real data, source-badged):**
- Regulatory/policy per material (Excise for liquor; PWM 2022 for MLP/PET; metal rules for cans)
- Environmental impact data (litter, leakage, beach/marine pollution, landfill diversion)
- Economic / market data (market size, recyclate value, waste-management cost)
- International DRS benchmarks (return rates, deposit values, model design)
- Competitor / PRO landscape
- Consumer behaviour & barriers

**Generate:** the six evidence sections below — **each with very in-depth, data-backed analysis (not summaries)** — plus a **0–100 opportunity score per material** derived from them.

**Show — exactly this layout:**

**① Per-material opportunity summary (top):** a card for each material (Liquor · MLP · Cans · PET), each carrying:
- **Opportunity score (0–100)** ← the headline, derived from the six sections (market size + recovery potential + regulatory strength + recyclate value + consumer readiness)
- Market size/volume · recovery opportunity · regulatory driver (strong/medium/weak) · one-line read

**② Six evidence sections — each filterable per material, each in deep detail:**

| Section | Depth required |
|---|---|
| **A · Impact Case** | Fully quantified environmental (litter, leakage, beach/marine pollution, landfill diversion) + economic (recyclate value, waste-cost saved, tourism/civic value) |
| **B · Policy & Regulatory** | The *actual rules* per material — Excise clauses (liquor), PWM 2022 (MLP/PET), metal rules (cans) — obligations, deposit-mandate basis, precise leverage points |
| **C · International Benchmarks** | Detailed case studies per material — return rates, deposit values, model design, what worked/failed |
| **D · Competitor / PRO Landscape** | Deep map of existing PROs, recyclers, competitors in the geography |
| **E · Consumer Behaviour & Barriers** | Detailed behavioural analysis — awareness, willingness, friction (tourist transience, deposit-mechanic confusion) |
| **F · Business Case** | Recovery potential, cost–benefit, **deposit-value modelling**, recyclate economics per material |

**③ Material toggle:** every section viewable per material. All figures source-badged; estimates flagged for validation.

**Scoring:** each material gets its own **0–100 opportunity score** (Liquor, MLP, Cans, PET independently), computed from the six sections and shown on the summary card.

**Implementation-model aware:** End-to-End = full depth; RVM-only = shallower (retail-market-focused).

**Worked example (Goa · Liquor):**
- **Opportunity score: ~82/100** — large liquor volume (~9 Cr units/yr), tourism-driven, glass = high recyclate value, visible beach/public litter, strong regulatory lever via Excise.
- Policy: Excise Dept regulates liquor licensing → leverage to mandate deposit at point of sale; SPCB on waste.
- Benchmark: glass-bottle DRS abroad ~85–95% return at deposit ₹X.
- Competitor/PRO: existing Goa recyclers/PROs.
- Consumer: tourists transient → short return window; residents receptive.
- Business case: recover ~N Cr bottles/yr, recyclate value ₹X, cleaner tourism zones.
*(Figures illustrative — pulled live + source-badged in production.)*

---

### Stage 4 — Stakeholder & Partner Intelligence  **[LOCKED]**

**Purpose:** Map **everyone Recykal must align with** to run the scheme — armed with the Stage 3 evidence — with deep per-stakeholder analysis, champions/blockers, and the engagement sequence. Produces an **Alignment Readiness Score (0–100)**, overall + per material.

**Scope:** this is the **alignment / coalition layer only.** Onboarding individual touchpoints (every bar / shop / HORECA) is a **separate later stage**, not here.

**Ask:** minimal — pod leader adds known contacts, current relationships, and stances.

**Pull (per state, source-badged):**
- Government/regulatory bodies + key officials (Excise — key for liquor — SPCB, Tourism Dept, Municipal bodies, Panchayats, State govt)
- Producer/brand landscape per material (liquor distilleries/brands; beverage PIBOs for PET/cans/MLP)
- Associations (bar & restaurant, beach-shack, HORECA/hotel, retail-kirana, liquor-traders)
- Collection/recyclers
- From public data + internal CRM

**Generate (deep):** stakeholder map by the 4 categories; per stakeholder → role · influence · current stance · interest · **priority (P0–P2)** · **what-to-secure** · dependencies · engagement order · **talking points drawn from Stage 3**; **champions & blockers**; **Influence × Interest** positioning; engagement sequence; the **Alignment Readiness Score** (overall + per material).

**Show — exactly this layout:**

**① Alignment summary (top):**
- **Alignment Readiness Score (0–100)** ← headline, **overall + per material** (Liquor / MLP / Cans / PET each)
- Counts by category · # P0 · # champions / # blockers · one-line read

**② Influence × Interest map** — quadrant visual positioning every stakeholder (high-influence/high-interest = engage first).

**③ Stakeholder table** — grouped by the 4 categories, filterable by **material + taluka:**

| Category | Examples |
|---|---|
| **Government / Regulatory** | Excise Dept (key for liquor), SPCB, Tourism Dept, Municipal bodies, Panchayats, State govt |
| **Producers / Brands** | Liquor distilleries/brands, beverage PIBOs (PET/cans/MLP) |
| **Associations** | Bar & restaurant, beach-shack, HORECA/hotel, retail-kirana, liquor-traders |
| **Collection / Recyclers** | Recyclers, aggregators, collectors |

Each row: **body/name · role · influence · stance · priority · what-to-secure · status · next action.**

**④ Per-stakeholder detail (expand):** full profile + **talking points from Stage 3** + dependencies + engagement history.

**⑤ Champions & Blockers panel · ⑥ Engagement sequence (who first).**

**Scoring:** **Alignment Readiness Score (0–100)** — overall + per material — computed from stance distribution, P0 coverage, champions-vs-blockers, and influence coverage.

**Implementation-model aware:** End-to-End = full ecosystem; RVM-only = mostly retail chains/customers + the scheme operator.

**Worked example (Goa):**
- **Alignment Readiness — Liquor: 64/100** (strong opportunity, several P0 stances "unknown"); PET: 48/100.
- Excise Dept — P0 · High · stance Unknown · secure: deposit-at-POS notification · talking point: revenue-neutral + clean-tourism.
- Tourism Dept — P0 · **Champion** · secure: clean-tourism endorsement + airport/beach access.
- Bar & Restaurant Assoc. — P0 · secure: member bars as return points.
- Liquor brands — P0 · secure: participation + deposit funding.
- Beach-shack assoc. — P1 · potential **Blocker** (deposit-friction).
*(Figures illustrative — pulled live + source-badged in production.)*

---

### Stage 5 — Resistance Intelligence  **[LOCKED]**

**Purpose:** Map **everything that could block adoption** — resistance across **7 fronts**, not generic "risk" — with root cause, severity, and mitigation, **per material**. Produces a **Resistance Index (0–100)** (higher = more resistance). Builds directly on Stage 4 **blockers** + Stage 3 **consumer barriers**.

**Ask:** minimal — pod leader adds field/political signals.

**Draw from (source-badged):** Stage 4 blockers · Stage 3 consumer behaviour & barriers · media/sentiment signals · regulatory friction.

**Generate (deep):** a resistance register; per item → **front · root cause · impact · probability · severity · mitigation · owner · status · review date**; + **predicted future resistance** & pre-emptive mitigation; + the Resistance Index.

**Show — exactly this layout:**

**① Resistance summary (top):**
- **Resistance Index (0–100)** — overall + **per material** (Liquor/MLP/Cans/PET), colour-coded (red = high, green = low)
- # high-severity items · trend arrow · one-line read

**② Heat map** — grid of **7 fronts (rows) × material (columns)**, colour intensity = resistance level (also switchable to fronts × taluka). One glance shows hotspots.

**③ Resistance register** — table, filterable by **material + taluka + front.** Each row: **front · root cause · impact · probability · severity · mitigation · owner · status · review date.**

The 7 fronts:
| Front | Example (Goa, Liquor) |
|---|---|
| **Government / Regulatory** | Excise hesitancy on mandating deposit |
| **Retail / Trade** | Bars & liquor traders fear deposit friction/cost |
| **Consumer** | Tourists transient — won't return bottles |
| **Brand** | Liquor brands wary of funding deposits |
| **Media** | Misframed as "tax on drinking" |
| **Political** | Trade-lobby pushback |
| **Operational** | Reverse logistics for glass, refund handling |

**④ Per-item detail (expand):** full analysis + evidence + mitigation plan + dependencies + history.

**⑤ Predicted / future resistance panel:** AI-predicted resistance not yet surfaced + recommended pre-emptive mitigation.

**⑥ Material + geography toggles · all source-badged.**

**Scoring:** **Resistance Index (0–100) per material** — computed from severity × probability across the 7 fronts, weighted by front importance. Higher = more resistance.

**Implementation-model aware:** End-to-End = all 7 fronts (public/government-heavy); RVM-only = mainly **Retail/Trade + Operational** (Recykal isn't running the public scheme).

**Worked example (Goa · Liquor) — Resistance Index 58/100:**
| Front | Root cause | Severity | Mitigation | Owner |
|---|---|---|---|---|
| Retail/Trade | Liquor traders fear deposit friction/cost | High | Simple POS handling, margin-neutral, bar-assoc co-design | Pod + Bar Assoc |
| Consumer | Tourists transient — won't return | High | Instant refund + airport/beach return points | Marketing |
| Operational | Glass reverse logistics | Med-High | Route planning, recycler tie-ups | Operations |
| Political | Trade-lobby pushback | Med | Early excise + association alignment | Gov Affairs |
| Media | Misframed as "tax on drinking" | Med | Clean-tourism narrative (from Stage 3) | Comms |
*(Figures illustrative — pulled live + source-badged in production.)*

---

### Stage 6 — Narrative & Alignment  **[LOCKED]**

**Purpose:** Generate the core story, persona messages, and FAQ kits before going into execution. Ensures every stakeholder repeats the same evidence-backed narrative.

**Ask:** minimal — pod leader reviews and approves the narrative direction.

**Draw from:** Stage 3 (evidence, proof points) · Stage 4 (stakeholders) · Stage 5 (consumer & government resistance).

**Generate (+ docs):** Narrative House; Persona Messaging Matrix; FAQ Kit; Localized Message Bank (based on Stage 1 languages). *Generated documents:* Narrative House v1 · FAQ Kit · Stakeholder Briefing Kit.

**Show — exactly this layout:**
**① Narrative summary:** Core story · primary proof points · local pride/environmental angle.
**② Persona matrix:** Stakeholder category → tailored message → addressing specific resistance.
**③ FAQ kit:** Anticipated questions + official answers (filterable by audience).
**④ Commitment tracker:** To be filled post-alignment workshops.

**Score:** **Narrative Readiness %** (based on localization completeness and persona coverage).

---

### Stage 7 — Execution Blueprint (master on-ground plan)  **[LOCKED]**

**Purpose:** The master, sequenced **on-ground action plan** — all 7 workstreams needed to put the scheme on the ground, **phased by material × geography × readiness**, with owners, timelines, dependencies, and key actions. The pod leader's "do this, then this, on the ground" roadmap. Each workstream drills into its own detailed stage (7+).

**Principle (objective):** the bot gives the **real plan — what needs to be done on the ground** — not abstract strategy. Narrative/deposit-model/messaging live *inside* the concrete workstreams where they get executed, not as a standalone theory stage.

**Ask:** minimal — pod leader confirms D-Day, team/owners, budget, and phasing.

**Draw from:** Stage 1 phasing · Stage 2 geography rollout · Stage 3 market evidence · Stage 4 stakeholders · Stage 5 resistance.

**Generate (deep):** the 7 workstreams sequenced with dependencies (critical path); each with objective · key on-ground actions · owner · dependencies · timeline · status; a master timeline phased by material × geography.

**Show — exactly this layout:**

**① Blueprint summary (top):** D-Day · current phase · # workstreams · overall progress/readiness · **critical-path alert** (what's blocking).

**② Master timeline (Gantt-style):** the 7 workstreams (rows) across time/phases, driven by Stage 1 material order + Stage 2 geography rollout.

**③ Workstream cards (the 7) — each clickable into its detailed stage:**
| # | Workstream | Key on-ground actions |
|---|---|---|
| 1 | **Government & Regulatory** | Secure Excise mandate/notification, SPCB backing, deposit legality |
| 2 | **Brand/Producer & Deposit** | Onboard brands, lock deposit value per material, funding |
| 3 | **Touchpoint Onboarding** | Bars, liquor shops, HORECA, kirana, panchayats — QR printing, training, return-point setup |
| 4 | **Infrastructure & RVM Deployment** | RVM siting, collection points, QR/logistics |
| 5 | **Consumer Awareness** | On-ground campaigns, behaviour change |
| 6 | **Operations & Collection** | Reverse logistics, refund handling, recycler offtake |
| 7 | **Launch & Scale** | Go-live, monitor, expand to next phase |

Each card: objective · key actions · owner · dependencies · status.

**④ Critical path & dependencies:** dependency map — e.g. Excise mandate (WS1) → deposit lock (WS2) → touchpoint onboarding (WS3) + RVM deployment (WS4) → launch (WS7). Nothing on the ground starts before its blocker clears.

**⑤ Per material + per taluka toggle.**

**Worked example (Goa · Phase 1 = Liquor, Tiswadi + Salcete):**
```
WS1 Government (secure Excise mandate)        D-90 → D-60
WS2 Brand/Deposit (onboard brands, lock ₹X)   D-60 → D-45
WS3 Touchpoint onboarding (bars/shops/HORECA) D-45 → D-15   ⟵ needs WS2
WS4 Infrastructure (RVM siting, QR printing)  D-45 → D-15   ⟵ needs WS1
WS5 Awareness (clean-tourism campaign)        D-30 → Launch
WS6 Operations (reverse logistics, refund)    D-15 → Launch
WS7 Launch & scale                            Launch → Phase 2 (Bardez+Mormugao) → MLP phase…
```
Critical path: Excise mandate blocks everything downstream.
*(Illustrative — driven live by prior-stage data + chosen phasing.)*

**Workstream stages (to be detailed next, Stage 7+):** 1 Government & Regulatory · 2 Brand/Producer & Deposit · 3 Touchpoint Onboarding · 4 Infrastructure & RVM Deployment · 5 Consumer Awareness · 6 Operations & Collection · 7 Launch & Scale.

---

### Stage 8 — Execution (ALL workstreams in ONE stage)  **[STRUCTURE LOCKED]**

**Why one stage:** all 7 workstreams live in this **single Execution stage as tabs/sections — NOT 7 separate stages** (avoids stage sprawl). The master timeline & critical path come from Stage 6; this stage holds the **detailed plan + generated documents** for each workstream.

**How it displays:** workstream tabs across the top —
**1 Government & Regulatory · 2 Brand/Deposit · 3 Touchpoint Onboarding · 4 Infrastructure & RVM · 5 Awareness · 6 Operations · 7 Launch.**
Each tab opens that workstream's detailed plan. **Per material + per taluka toggle** applies across all tabs.

---

#### Workstream 1 — Government & Regulatory  **[LOCKED]**

**Purpose:** The concrete on-ground action plan to secure the **regulatory foundation** that makes the scheme legal and enforceable — **the legal enablers only**: Excise · State Government · SPCB · Tourism. Per material (liquor → Excise primary; plastics → SPCB primary). On the **critical path** — nothing downstream starts until this clears.

**Scope (important):** Stage 7 = **legal enablers only.** Panchayat NOC+agreement, bar/HORECA GST+FSSAI onboarding, and RVM deployment are **NOT** here — they live in the operational onboarding / infrastructure stages.

**Ask:** minimal — pod leader confirms which officials are already engaged and existing relationships.

**Draw from:** Stage 4 government stakeholders · Stage 3 policy/regulatory evidence + impact case · Stage 5 government resistance.

**Generate — a per-stakeholder execution plan for each enabler, plus the real documents:**
- Per stakeholder → who (body + official) · **the ask** (instrument to secure) · **talking points** (from Stage 3) · **generated documents** · sequence/dependency · status · next action
- Regulatory instruments per material — Excise notification (deposit-at-POS, liquor) · State Govt order/notification · SPCB endorsement (PWM, plastics) · Tourism endorsement
- **Generated documents (ready to use):** representation/proposal to each body · draft notification language · business-case deck · official FAQ
- Approval pathway / milestones with dependencies
- Resistance handling (addresses Stage 5 government resistance)

**Show — exactly this layout:**

**① Regulatory readiness status (top):** what's secured vs pending · critical pending instrument · target dates · a **Regulatory Readiness** indicator.

**② Government stakeholder board (the enablers):** ordered by sequence/dependency, each clickable into its per-stakeholder plan.

**③ Per-stakeholder plan (on expand):** ask · talking points · generated documents · sequence · status · next action.

**④ Regulatory instruments tracker (table):** each instrument, per material — what · who issues · status · owner · target date.

**⑤ Generated documents panel:** drafted deliverables (proposal · notification clause · deck · endorsement/MoU · FAQ) — view / edit / download.

**⑥ Approval pathway / milestones (timeline).**

**⑦ Per material + per taluka toggle.**

**The enablers (Goa · Liquor):**
| Stakeholder | Ask (what-to-secure) | Generated docs |
|---|---|---|
| **Excise Dept** (Commissioner) | In-principle approval → notification mandating ₹X deposit-at-POS + return/refund for liquor | Representation · draft notification clause · business-case deck · FAQ |
| **State Government / Cabinet** | Formal order/notification giving the scheme legal force | Cabinet note · draft order |
| **SPCB** | Waste-side backing / alignment under PWM (sets up plastics phases) | Representation · alignment note |
| **Tourism Dept** (Champion) | Endorsement + access to airport/beach/tourist zones | Endorsement request · clean-tourism partnership note |

**Sequence:** Excise in-principle → State notification → (parallel: SPCB, Tourism). **Excise mandate is the critical-path blocker.**

**Resistance handling:** Excise hesitancy → revenue-neutral framing + phased-pilot proposal (from Stage 5).

**Implementation-model aware:** End-to-End = all enablers; RVM-only = minimal/none (the scheme operator owns regulatory).
*(Figures illustrative — pulled live + source-badged in production.)*

---

Every workstream below follows the same pattern: **Purpose · Ask · Draw from · Generate (+ generated documents) · Show · Score · model-aware**, with a **per material + per taluka** toggle and a **per-tab AI section** (see §1 AI Section).

#### Workstream 2 — Brand/Producer & Deposit  **[LOCKED]**
- **Purpose:** onboard the producers/brands whose containers enter the market, **lock the deposit value per material**, set up the **upstream QR application**, and the funding/financial flows.
- **Ask:** minimal — pod leader confirms known brand contacts.
- **Draw from:** Stage 4 producer/brand landscape · Stage 3 economics · operating model (QR upstream).
- **Generate (+ docs):** brand onboarding pipeline; deposit model per material; QR-integration setup; funding/fee model. *Generated documents:* producer participation agreement · deposit-structure doc · QR-integration spec · funding/fee agreement.
- **Show:** ① brand onboarding board (target → contacted → agreed → onboarded), per material · ② deposit model table per material (deposit value · refund · funding source) · ③ upstream QR setup status · ④ funding tracker.
- **Score:** **Producer Onboarding Coverage %** (per material).
- **Model-aware:** End-to-End = full producer onboarding + deposit; RVM-only = N/A (scheme operator owns deposit).

#### Workstream 3 — Touchpoint Onboarding  **[LOCKED]**
- **Purpose:** onboard the operational touchpoints per the DRS Operating Model — **panchayats (NOC + agreement → RVM)** and **bars/HORECA (GST + FSSAI → pickup)**. **Liquor shops are NOT onboarded** (they only sell QR bottles).
- **Ask:** minimal.
- **Draw from:** Stage 2 touchpoint universe (counts per taluka) · operating model.
- **Generate (+ docs):** onboarding pipeline per touchpoint type; per-unit tracking. *Generated documents:* panchayat **NOC + agreement**; bar/HORECA **onboarding agreement + GST/FSSAI collection checklist**.
- **Show:** ① onboarding pipeline by touchpoint type × taluka (target vs onboarded — e.g. 12/18 panchayats in Tiswadi) · ② document tracker (NOC/agreement per panchayat; GST/FSSAI per bar) · ③ generated templates · ④ unit list/map with status.
- **Score:** **Onboarding Coverage %** per touchpoint type per taluka.
- **Model-aware:** End-to-End = panchayats + bars/HORECA; RVM-only = retail stores (the RVM hosts). *Liquor shops excluded from onboarding.*

#### Workstream 4 — Infrastructure & RVM Deployment  **[LOCKED]**
- **Purpose:** deploy **1 RVM per onboarded panchayat**; set up pickup collection points; QR/logistics infrastructure.
- **Ask:** minimal — confirm RVM stock/vendor.
- **Draw from:** Stage 2 panchayat counts (= RVM counts) · WS3 onboarding status.
- **Generate (+ docs):** RVM deployment plan per panchayat (site → procure → install → commission → connectivity → live); pickup collection-point setup; QR provisioning logistics.
- **Show:** ① RVM deployment tracker per taluka/panchayat (sited / installed / commissioned / live) · ② readiness % per taluka · ③ dependencies (needs panchayat onboarded [WS3] + Excise mandate [WS1]) · ④ pickup-point setup for bars/HORECA.
- **Score:** **Infrastructure Readiness %** per taluka.
- **Model-aware:** End-to-End = RVMs at panchayats + pickup points; RVM-only = RVMs at retail stores.

#### Workstream 5 — Consumer Awareness  **[LOCKED]**
- **Purpose:** on-ground campaigns to drive participation & behaviour change — what to return, **where (RVM/panchayat)**, the deposit/refund mechanic; address consumer barriers.
- **Ask:** minimal — budget/channel preferences.
- **Draw from:** Stage 3 consumer behaviour · Stage 5 consumer resistance · Stage 1 languages.
- **Generate (+ docs):** awareness plan by channel (retail · airport · beach · tourism · digital · school · community); behaviour-barrier activation. *Generated documents:* campaign plan · creatives/messaging **per language** · FAQs · signage.
- **Show:** ① awareness plan by channel × taluka · ② localized asset library (by language) · ③ behaviour-barrier tracker (barrier → message → channel) · ④ reach/comprehension targets.
- **Score:** **Awareness Readiness / comprehension** target.
- **Model-aware:** End-to-End = full public awareness; RVM-only = in-store/retail awareness only.

#### Workstream 6 — Operations & Collection  **[LOCKED]**
- **Purpose:** run the return-to-recycler loop — **RVM collection (panchayats)**, **scheduled pickup (bars/HORECA)**, reverse logistics, **refund reconciliation** (consumer via RVM; bar via pickup), recycler offtake.
- **Ask:** minimal — confirm logistics partner, recycler.
- **Draw from:** operating model · WS3 onboarded units · WS4 RVMs.
- **Generate (+ docs):** pickup schedule & routes; RVM collection & servicing plan; reverse-logistics plan; refund-reconciliation process; recycler offtake. *Generated documents:* operations SOP · pickup schedule · refund-reconciliation process · recycler agreement.
- **Show:** ① operations plan (collection model · routes · reconciliation) · ② pickup schedule by taluka · ③ refund-reconciliation flow · ④ recycler offtake tracker · (post-launch: live collection volume, return rate, cost/container).
- **Score:** **Operational Readiness %.**
- **Model-aware:** End-to-End = full ops; RVM-only = RVM servicing + offtake only.

#### Workstream 7 — Launch & Scale  **[LOCKED]**
- **Purpose:** go-live readiness across all workstreams, launch execution, monitoring, and **scale to the next phase** (geography + material).
- **Ask:** confirm go-live date.
- **Draw from:** all workstreams' readiness.
- **Generate (+ docs):** Strict **T-Minus Launch Readiness Tracker** (T-90, T-60, T-30, T-15); go-live runbook; launch/activation event plan. *Generated documents:* Launch Go/No-Go Checklist · runbook · event plan.
- **Show:** ① Launch readiness board (T-minus milestones with owners and status) · ② **Go/No-Go Gate Indicator (AI Auditor)**: visually flags a **NO-GO BLOCKER** if Consumer Awareness readiness (WS5) exceeds Infrastructure readiness (WS4) — enforcing the Cardinal Rule · ③ post-launch monitoring · ④ next-phase plan.
- **Score:** **Launch Readiness %** (hard gate metric).
- **Model-aware:** both.

*All seven workstreams are tabs within Stage 8 — no separate stages.*

---

### Stage 9 — Engagement & BTL  **[LOCKED]**

**Purpose:** The location-by-location on-ground engagement & **below-the-line activation plan** to drive public participation (return behaviour). Built on a **comprehensive location-data layer**, with a BTL activity plan per location. This is the **detailed execution layer** that WS5 (the high-level awareness summary, in Stage 7) references.

**Distinct from Stage 2:** Stage 2 maps touchpoints for *onboarding/collection* (liquor outlets, HORECA, retail, panchayats/RVM). **Stage 8 maps the engagement/footfall universe** (schools, airports, petrol pumps, communities…) for *awareness & activation* — not onboarding.

**Ask:** minimal — budget, priority venue types/zones.

**Pull (real data per state, source-badged):** the full BTL location universe — each location with **type · area/taluka · footfall/reach · relevance · permission/contact needs:**

| Category | Venue types |
|---|---|
| **Transit / high-footfall** | Airports · railway stations · bus stands/depots · petrol pumps · toll plazas · ferry/jetty points |
| **Tourism / leisure** | Beaches · beach shacks · tourist spots/monuments · hotels/resorts · casinos · nightlife districts |
| **Community / residential** | Communities/housing societies · markets/bazaars · malls · religious places (temples/churches/mosques) · community halls/panchayat ghars |
| **Education / youth** | Schools · colleges/universities |
| **Civic / institutional** | Police stations · government offices · hospitals/PHCs · post offices |
| **Events / gathering** | Stadiums/sports grounds · exhibition & event grounds · festivals/fairs (seasonal) |

**Generate (deep):** location database mapped per taluka/area; **BTL activity plan per venue type**; per activity → calendar · owner · material relevance · reach estimate · permission/vendor needs · budget; localized creatives/assets (languages from Stage 1); the BTL Engagement Reach score.

**Show — exactly this layout:**
**①** BTL summary (top) — **BTL Engagement Reach score (0–100)** per taluka + overall · # locations mapped · # activities planned · total reach estimate · budget.
**②** Location map + database — all venues by category, on a **map** + listable, filterable by **taluka + venue type + material**. Each: type · area · footfall · relevance · status.
**③** BTL activity plan — per venue type → activity · calendar · owner · reach · permissions · vendor · budget.
**④** Calendar view — BTL activities across the timeline, per taluka.
**⑤** Creative/asset library — localized BTL materials (signage, kiosks, event kits) by language.
**⑥** Per material + per taluka toggle + AI copilot.

**Scoring:** **BTL Engagement Reach score (0–100) per taluka** — from venue coverage × footfall reached × activity density vs population/footfall.

**Implementation-model aware:** End-to-End = full BTL across all venues; RVM-only = retail/in-store BTL only.

**Worked example (Goa · Tiswadi) — BTL Engagement Reach 71/100:**
- Locations mapped: petrol pumps 22 · schools 48 · colleges 6 · police stations 5 · beaches 6 · bus stands 4 · markets 8 · malls 2 · religious places 30 · community halls 18 · tourist spots 12 · airport (Dabolim, regional).
- BTL activities: school awareness drives (48) · airport tourist messaging · petrol-pump signage/kiosks (22) · beach activations (6) · community events (18 panchayat areas) · mall/market booths.
- Calendar: pre-launch awareness wave → launch activation → sustain.
*(Figures illustrative — pulled live + source-badged in production.)*

---

### Stage 10 — Reputation Management  **[LOCKED]**

**Purpose:** Active post-launch crisis handling and sentiment tracking to protect trust. Rapid response to negative media or operational friction.

**Ask:** pod leader logs any field incidents or negative press signals.

**Draw from:** Live media monitoring · WS6 operational friction · Stage 5 resistance register.

**Generate (+ docs):** Sentiment trend map; Misinformation flags; **Rapid Response Briefs** with enforced SLA. *Generated documents:* Rapid Response statements · Retail Testimonial capture forms · Milestone press releases.

**Show — exactly this layout:**
**① Sentiment tracker:** Positive/neutral/negative trendline post-launch.
**② Issue Log:** Open issues · risk level · SLA status · owner.
**③ Rapid Response panel:** AI-drafted statements ready for approval to counter misinformation.

**Score:** **Reputation Trust Score (0–100)**.

---

### Stage 11 — Performance & KPI  **[LOCKED]**

**Purpose:** Define the complete performance framework — **North Star + KPI tree + targets + formulas + data sources + cadence + owners** — per material + per taluka. This is *what success looks like and how it's measured.* **Roadmap-not-tracker:** it **defines** the measurement (targets/formulas/sources); *once live* it shows **actuals vs targets** from connectors — it is not a standalone status board.

**Ask:** minimal — pod leader confirms/sets targets.

**Draw from:** objective (S1) · benchmarks (S3) · the per-stage scores (S3 opportunity · S4 alignment · S5 resistance · S7 readiness · S8 BTL reach) · operating model (return/refund/collection).

**North Star:** **Return Rate** (containers returned ÷ containers sold) — overall + **per material** + **per taluka**; optional composite **DRS Performance Index** (return + collection + cost + sentiment).

**KPI tree:**
- **Leading (pre/during launch):** regulatory readiness · brand onboarding % · touchpoint onboarding % · RVM deployment % · BTL reach · awareness/comprehension · alignment score.
- **Lagging (post-launch):** containers returned · return rate · active participants · repeat returns · refund volume · collection volume · cost per container · recyclate value · sentiment.

Each KPI: **name · definition · formula · data source · frequency · target · (actual · variance once live) · owner.**

**Show — exactly this layout:**
**①** North Star (top) — Return Rate / Performance Index, **target + actual**, overall + per material.
**②** KPI tree — leading vs lagging.
**③** KPI table — name · definition · formula · source · frequency · target · actual · variance · owner — per material + taluka.
**④** Targets & benchmarks (from S3).
**⑤** Reporting cadence.
**⑥** Per material + taluka toggle + AI copilot.

**Scoring:** the score here *is* the **DRS Performance Index (0–100)** — per material + per taluka — the North Star roll-up.

**Model-aware:** End-to-End = full KPI set; RVM-only = RVM throughput + retail metrics.

**Worked example (Goa):**
- Return Rate target: Liquor 80% · PET 70% (from S3 benchmarks).
- Leading now: onboarding 64%, RVM deployment 40%, BTL reach 71.
- Lagging (post-launch): containers returned, cost/container ₹3.10, repeat returns.
- DRS Performance Index — Liquor: tracked vs target once live.
*(Figures illustrative — pulled live + source-badged in production.)*

---

### Stage 12 — Knowledge / Reusable Blueprint  **[LOCKED]**

**Purpose:** The **compounding intelligence layer.** Capture every completed geography → **enrich the bot's Knowledge Base** so future plans reuse proven precedent → and produce a **human-facing reusable blueprint.** Build once in Goa → clone faster into the next geography (Tamil Nadu, UK…).

**Mechanism (important):** the "bot gets smarter" via **Knowledge Base + retrieval (RAG), NOT model fine-tuning.** Captured knowledge is read as context when generating the next geography — not used to retrain the model.

**Ask:** minimal — pod leader may add manual notes, leadership observations, special learnings.

**Capture (the complete project):** all stages' outputs · the **generated documents that worked** (Excise notification, agreements, decks, NOC, MoU) · actual data / benchmarks / return rates achieved · stakeholder patterns · resistance mitigations that worked · BTL activities that drove reach · lessons learned.

**Generate:**
- The **Reusable Geography Blueprint** — packaged playbook (evidence, narrative, document templates, stakeholder patterns, BTL playbook, operating model, lessons).
- **Knowledge Base entries** — fed back into the bot's KB for retrieval.
- Lessons-learned report · best-practices / SOP library updates · **document/template library** (proven generated docs become reusable templates).

**Cloning rule:** when a new geography is created (Stage 1), the bot **retrieves the most similar prior Blueprint and pre-fills/grounds the new plan**, each seeded item marked "validate" — so each launch is faster, cheaper, more credible.

**Show — exactly this layout:**
**①** Knowledge summary (top) — blueprints captured · templates · lessons · **Blueprint Completeness / Reusability score.**
**②** Reusable Blueprint — packaged playbook, view/export.
**③** Document/template library — proven generated docs (notification · agreements · decks · NOC · MoU) as reusable templates.
**④** Lessons learned + best practices.
**⑤** Benchmarks/data captured (feeds future Stage 3).
**⑥** "Clone to next geography" — seed a new project from this blueprint.
**⑦** AI copilot.

**Scoring:** **Blueprint Completeness / Reusability score (0–100)** — how complete and reusable the captured blueprint is.

**Model-aware:** captures whichever model was run (End-to-End or RVM-only).

**Worked example (Goa):** Goa Blueprint captured — evidence, narrative, **Excise-notification template, panchayat NOC/agreement templates**, BTL playbook, achieved return rates → seeds the next geography (e.g. Tamil Nadu) so its Stages 1–3 start pre-filled.
*(Figures illustrative — pulled live + source-badged in production.)*

---

## 4. Flow complete

Stages **1–10 + the cross-cutting AI Section + the DRS Operating Model** are locked. This is the complete DRS roadmap-engine flow:

**1 Setup → 2 Geography → 3 Market → 4 Stakeholders → 5 Resistance → 6 Execution Blueprint → 7 Execution (7 workstreams) → 8 Engagement & BTL → 9 Performance & KPI → 10 Knowledge/Blueprint**, with the AI copilot embedded in every tab.

All four material operating models (Liquor · PET · Cans · MLP) are defined in §1.

---

## 5. Build requirements (corrected — marketing engine, not tracker)

**This is a marketing / planning engine, not a tracker.** It *generates* the plan from the framework; external data only sharpens number-accuracy.

- **Required:** the **LLM API key**. The framework itself = this skill file.
- **Optional accuracy layer:** web/search grounding + a **Places API** — only to make specific *numbers* (population, venue counts, current regulations) live and source-badged instead of estimates. Without them the bot still produces the full plan, labelling those figures as estimates (flagged for validation).
- **NOT needed (explicitly):** CRM · RVM inventory · recycler network · telemetry · GST/FSSAI verification · ops/finance — all tracker/execution-system data.

### 5.1 Data accuracy — the never-invent rule
The bot **MUST NOT** recall any figure from the model's memory. **Every fact/number comes from a connected source (a tool call); if no source exists, it is flagged, never fabricated.** Split the jobs: **LLM = reasoning / structure / writing · connected sources = every fact/number.**
- Every figure is badged: ✅ **Verified** (source + date) · ⚠️ **Estimated** (modeled, assumption shown) · ❔ **To-validate** (blank/flagged, never faked).
- Prefer authoritative sources over general web · carry an "as-of date" on regulations · cross-check critical figures · **flag any government-facing figure for pod-leader validation.**

### 5.2 Connector map (data → source)
| Data | Connector / API / MCP | Stages |
|---|---|---|
| **Venues & touchpoints** — bars, HORECA, retail, kirana, schools, petrol pumps, airports, police stations, markets, malls, religious places | **Google Places / Maps API** *(alt: Foursquare, HERE, OpenStreetMap Overpass)* | 2, 8 |
| **Regulations** (Excise/PWM/CPCB/SPCB), tourism stats, **DRS benchmarks**, competitor/PRO list, **govt bodies & officials**, consumption reports | **Web-search grounding** — built-in `web_search` + `web_fetch` on the Claude API *(alt/MCP: Tavily, Brave Search, Serper)* | 3, 4, 5, 7 |
| **Admin hierarchy + population** (districts/talukas/panchayats/wards) | **data.gov.in (OGD India) API** + Census / LGD *(or via web search)* | 2 |
| **Sentiment / media** | News API (NewsAPI / GDELT) + optional social listening | 5, 9 |
| **Consumption per material** | modeled (population × per-capita benchmark) from web-search inputs → **always flagged "estimate"** | 2, 3 |

### 5.3 Minimal starting set (unlocks ~90%)
1. **Google Maps/Places API key** — the one paid connector that matters (venue/touchpoint counts).
2. **Web search** — free/built-in on the Claude API (or a Tavily/Brave key for a dedicated one).
3. **data.gov.in API key** — free (population/admin), or fall back to web search.
- *Later:* news/social for sentiment.

### 5.4 MCP option
Available as MCP servers if preferred: **Google Maps MCP · Tavily/Brave search MCP · fetch MCP** — same data, cleaner integration.

### 5.5 Self-sufficiency (cold-start build)
This document is a **standalone build brief.** A fresh Claude account/session can read **this file alone** and construct the bot — no prior conversation context required. It contains: the engine concept, the two implementation models, the operating model for all four materials, the 10-stage flow with per-stage Purpose/Ask/Pull/Generate/Show/Score, the cross-cutting AI Section + History tab, the build requirements, the data-accuracy rules, the connector map, and the new-geography generalization approach.

---

## 6. New-geography / generalization approach

The spec is a **universal framework, not a Goa plan.** A new state runs the **same 10 stages**, re-populated with that state's reality.

- **Adapts automatically per state:** geography hierarchy (dynamic engine) · regulatory bodies (same categories, that state's instances) · market/consumption · touchpoints · languages · materials.
- **State-nuance rules the bot MUST detect (and reshape the plan):**
  - **Dry / prohibition states** (Gujarat, Bihar, Nagaland, Mizoram) → **drop the liquor phase**; lead with PET/MLP/Cans.
  - **TASMAC-style government liquor monopoly** (Tamil Nadu) → reshape the liquor stakeholder + onboarding model (Excise + state corporation, not private liquor shops/bars).
  - **Non-coastal / non-tourism states** → no beach shacks/casinos; touchpoint mix shifts to malls/kirana/markets; tourism stakeholders drop in weight.
  - **Metro vs rural** → touchpoint mix + rollout sequence differ.
  - Per-material opportunity scores (Stage 3) reorder the phasing per state.
- **Grounding:** state facts come from connectors + Knowledge Base + search grounding (source-badged; unknowns flagged "validate").
- **Cloning logic (Stage 10):** retrieve the **most similar prior blueprint** → pre-fill/accelerate Stages 1–3 → **re-validate every item against the new state** → mark seeded items "validate." A prior geography (Goa) accelerates the next state; it never overrides its reality.
