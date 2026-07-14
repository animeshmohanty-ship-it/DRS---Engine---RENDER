const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, PageBreak, PageNumber, Header, Footer
} = require("docx");

// ---------- numbering config ----------
const numConfigs = [
  { reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 260 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 1080, hanging: 260 } } } },
  ]},
];
for (let i = 0; i < 60; i++) {
  numConfigs.push({ reference: "n" + i, levels: [
    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 280 } } } }]});
}
let _n = 0; const nextNum = () => "n" + (_n++);

// ---------- helpers ----------
const C = { blue:"1F4E79", lblue:"2E75B6", green:"0A8F4F", amber:"B25600", red:"C0392B",
            grayfill:"F2F2F2", head:"D5E2F0", line:"BBBBBB" };

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children:[new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children:[new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children:[new TextRun(t)] });

// paragraph supporting inline bold via array of [text,bold]
function P(parts, opts={}) {
  const runs = (Array.isArray(parts)?parts:[[parts,false]]).map(p =>
    new TextRun({ text: p[0], bold: !!p[1], italics: !!p[2], color: p[3]||undefined }));
  return new Paragraph({ spacing:{ after: opts.after===undefined?80:opts.after }, children: runs });
}
const label = (lbl, rest="") => P([[lbl, true], [rest, false]]);

function bullets(items) {
  return items.map(it => {
    if (Array.isArray(it) && it[0]==="sub")
      return new Paragraph({ numbering:{reference:"bullets",level:1}, spacing:{after:40},
        children:[new TextRun(it[1])] });
    const parts = Array.isArray(it) ? it : [[it,false]];
    return new Paragraph({ numbering:{reference:"bullets",level:0}, spacing:{after:40},
      children: parts.map(p => new TextRun({ text:p[0], bold:!!p[1] })) });
  });
}
function numbered(items) {
  const ref = nextNum();
  return items.map(it => new Paragraph({ numbering:{reference:ref,level:0}, spacing:{after:40},
    children:[new TextRun(it)] }));
}

function table(headers, rows, widths) {
  const total = 9360;
  const cols = widths || headers.map(()=>Math.floor(total/headers.length));
  const border = { style: BorderStyle.SINGLE, size: 1, color: C.line };
  const borders = { top:border, bottom:border, left:border, right:border };
  const mkCell = (text, w, opts={}) => new TableCell({
    borders, width:{size:w,type:WidthType.DXA},
    shading: opts.head ? { fill:C.head, type:ShadingType.CLEAR } : (opts.fill?{fill:opts.fill,type:ShadingType.CLEAR}:undefined),
    margins:{ top:60, bottom:60, left:110, right:110 },
    children: (Array.isArray(text)?text:[text]).map(t =>
      new Paragraph({ spacing:{after:0}, children:[new TextRun({ text:String(t), bold:!!opts.head, size:opts.head?18:18 })] }))
  });
  const headRow = new TableRow({ tableHeader:true, children: headers.map((h,i)=>mkCell(h,cols[i],{head:true})) });
  const bodyRows = rows.map(r => new TableRow({ children: r.map((c,i)=>mkCell(c,cols[i])) }));
  return new Table({ width:{size:total,type:WidthType.DXA}, columnWidths: cols, rows:[headRow,...bodyRows] });
}

const spacer = () => new Paragraph({ spacing:{after:60}, children:[new TextRun("")] });
const rule = () => new Paragraph({ border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:C.lblue, space:1 } }, spacing:{after:120}, children:[new TextRun("")] });
const pgbreak = () => new Paragraph({ children:[new PageBreak()] });

// ---------- STAGE renderer (mirrors Marketplace BRD skeleton) ----------
function stage(s) {
  const out = [];
  out.push(new Paragraph({ heading:HeadingLevel.HEADING_2, pageBreakBefore:true,
    children:[new TextRun(`Stage ${s.n} — ${s.name}`)] }));
  out.push(P([[`Layer: `,true],[s.layer+"   "],[`Human/AI split: `,true],[s.split+"   "],
              [`DMS Workflow: `,true],[s.dms||"—"]]));
  out.push(H3("Objective"));
  out.push(P(s.objective));
  if (s.entry){ out.push(label("Entry condition: ", s.entry)); }
  out.push(H3("Human Input"));
  out.push(...bullets(s.humanInput));
  out.push(H3("Claude Input (Knowledge Base + Project Memory)"));
  out.push(...bullets(s.claudeInput));
  out.push(H3("Claude Workflow"));
  s.workflows.forEach(w => {
    out.push(P([[w.id+" — "+w.title, true]], {after:30}));
    out.push(...bullets(w.items));
  });
  out.push(H3("Claude Outputs"));
  out.push(...bullets(s.outputs));
  out.push(H3("AI Auditor"));
  out.push(P([["Validates: ",true]],{after:20}));
  out.push(...bullets(s.auditor));
  out.push(P([["Produces: ",true],["Audit Report · Confidence Score · Blocker List · Missing-Information Report"]]));
  out.push(H3("Approval Gate" + (s.gate.code?` — ${s.gate.code}`:"")));
  out.push(label("Business Question: ", s.gate.question));
  if (s.gate.owner) out.push(label("Owner: ", s.gate.owner));
  out.push(label("Claude Recommendation: ", s.gate.rec));
  out.push(P([["Human Actions: ",true]],{after:20}));
  out.push(...bullets(s.gate.actions));
  if (s.gate.branches){ out.push(P([["Branch logic: ",true]],{after:20})); out.push(...bullets(s.gate.branches)); }
  out.push(H3("Data Passed to Next Stage"));
  out.push(...bullets(s.dataPassed));
  out.push(H3("Success Criteria"));
  out.push(...bullets(s.success));
  if (s.ifs){ out.push(H3("Ifs & Buts (edge cases)")); out.push(...bullets(s.ifs)); }
  out.push(label("Next Stage: ", s.next));
  return out;
}

// ============================================================
// CONTENT
// ============================================================
const body = [];

// ---- COVER ----
body.push(new Paragraph({ spacing:{before:1800, after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"Business Requirements Document", size:30, color:C.lblue, bold:true })] }));
body.push(new Paragraph({ spacing:{before:120, after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"DRS Marketing Agent (DMA)", size:56, bold:true, color:C.blue })] }));
body.push(new Paragraph({ spacing:{before:160, after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"The Claude-powered marketing operating system for launching and scaling", size:22, color:"555555" })] }));
body.push(new Paragraph({ spacing:{after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"Deposit Return Systems in any geography", size:22, color:"555555" })] }));
body.push(new Paragraph({ spacing:{before:500, after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"Engine: DMS (DRS Marketing System)  ·  Part of RMOS / Project MARS", size:20, color:"777777" })] }));
body.push(new Paragraph({ spacing:{before:80, after:0}, alignment:AlignmentType.CENTER,
  children:[new TextRun({ text:"Version 1.0  ·  Owner: Director Marketing  ·  Status: Build-ready", size:20, color:"777777" })] }));
body.push(pgbreak());

// ---- TOC ----
body.push(H1("Contents"));
body.push(new TableOfContents("Contents", { hyperlink:true, headingStyleRange:"1-2" }));
body.push(pgbreak());

// ============================================================
// PART 0 — WHAT THIS IS
// ============================================================
body.push(H1("0. What this document is"));
body.push(P([["This document is the complete, build-ready specification of the ",false],
  ["DRS Marketing Agent (DMA)",true],
  [" — a Claude-powered system that runs the marketing lifecycle of launching and scaling a Deposit Return System (DRS) in any geography.",false]]));
body.push(P("It is written so that it can be used in two ways:"));
body.push(...bullets([
  [["To build the agent — ",true],["upload this document to Claude and it contains everything required to construct the DMA: the architecture, every stage, every workflow, every input and output, every approval gate, and every conditional (if/but) branch."]],
  [["To explain the initiative — ",true],["it can be read or presented to leadership to show exactly what we are building, how it works, where humans stay in control, and how each launch makes the next one faster."]],
]));
body.push(P([["Build contract: ",true],["statements marked ",false],["MUST",true],[" are mandatory, ",false],["SHOULD",true],[" are strongly recommended, ",false],["MAY",true],[" are optional. Conditional logic is written as IF … THEN … ELSE …",false]]));
body.push(P([["Relationship to the DMS: ",true],["this document is a superset of the Director’s DRS Marketing System (DMS). It carries the DMS in full — the North Star, the five operating layers, all nine workflows, the RACI, the governance cadence, the KPI tree, the decision points, the feedback loops, the geography instantiation, the minimum-viable definition, and the system-health indicators — and wraps the agent mechanics (orchestrator, auditor, memory, gates) around it.",false]]));

// ============================================================
// PART 1 — SYSTEM FOUNDATIONS
// ============================================================
body.push(H1("1. System foundations"));

body.push(H2("1.1 Purpose & design philosophy"));
body.push(P([["DMS is the reusable marketing operating architecture for launching and scaling Deposit Return Systems across geographies. Its purpose is to help Recykal enter any DRS geography with a repeatable public-acceptance, stakeholder-alignment, launch-readiness, and collection-adoption system.",false]]));
body.push(P([["Core belief: ",true],["DRS is not primarily a waste-management project. DRS is a behaviour-change program. Public acceptance determines collection performance.",false]]));

body.push(H2("1.2 North Star — DRS Adoption Index"));
body.push(P([["DRS Adoption Index = (Public Awareness × Stakeholder Alignment × Return Participation) ÷ (Trust & Friction Barriers)",true]]));
body.push(P("The system improves when more people understand DRS, more stakeholders support it, more containers are returned, and trust/friction barriers decline. Every stage MUST roll its KPIs up to one of these four terms."));

body.push(H2("1.3 The five DMS operating layers"));
body.push(P("The marketing engine operates in five layers; the agent’s stages sit inside them."));
body.push(table(["Layer","Purpose","Core modules","Primary owner"],[
  ["1 · Evidence","Establish why DRS matters here","Impact research, waste leakage & litter, tourism/public-space impact, international benchmarks, economic & environmental cases, local behaviour insights","Marketing"],
  ["2 · Coalition","Align stakeholders before public launch","Stakeholder mapping, champion identification, government/regulator alignment, retailer/brand/NGO/school/media/academic engagement","Government Affairs, Marketing, Partnerships"],
  ["3 · Narrative","Give every stakeholder a reason to support & repeat","Core story, persona messages, FAQ kits, whitepapers, op-eds, roundtables, demonstration content","Marketing & Communications"],
  ["4 · Public Adoption","Drive awareness, participation & repeat returns","School/retail/airport/transit awareness, social & influencer activation, launch events, machine demos, return nudges","Marketing, Retail/Partner, Operations"],
  ["5 · Trust & Optimization","Protect reputation, reduce friction, improve collection","Media monitoring, rapid response, testimonials, milestone comms, return-rate / cost-per-container / active-user / retail-participation tracking","Communications, Operations, Marketing"],
], [1500,2100,4360,1400]));

body.push(H2("1.4 The DRS Narrative Adoption Flywheel"));
body.push(P("Research → Stakeholder Mapping → Narrative Development → Stakeholder Alignment → Consumer Awareness → Launch Readiness → Reputation Management → Collection Optimization → Narrative Amplification → (back to) Research."));
body.push(P("It is a flywheel, not a straight line: each completed cycle strengthens the next, and proof from one geography becomes the starting evidence for the next."));

body.push(H2("1.5 Scope"));
body.push(label("In scope — the agent runs these: ","Stages 1–10 and 13–16 (configuration, geography, market, stakeholder, resistance, DRS marketing system, GTM, acquisition, consumer engagement, communication & BTL, analytics, metrics, knowledge, AI copilot) plus the governance & cadence layer."));
body.push(label("Tracked dependencies — the agent coordinates but does NOT run these: ","Stage 11 (Infrastructure) and Stage 12 (Operations). The agent ingests their readiness and performance data, gates against them, and raises risks; physical execution is owned by humans/operations."));
body.push(label("Out of scope: ","actual publishing/field execution, government approvals and signatures, and physical machine deployment & logistics. The agent prepares, drafts, tracks, predicts and recommends; humans and the field execute and approve."));

body.push(H2("1.6 Core architecture"));
body.push(P("DMA has four components that operate on every project, running one universal per-stage loop."));
body.push(P([["The per-stage loop: ",true],["Create/resume project → DRS Project Manager loads Knowledge Base + Project Memory → Run Stage (Claude executes the workflows) → Collect outputs & update Project Memory → AI Auditor produces report + scores → Approval Gate (human decision) → IF approved unlock next stage & transfer outputs / IF revise re-run named workflow / IF reject branch per gate logic → repeat to the final stage → write Geography Blueprint to Knowledge Base → close project.",false]]));
body.push(H3("DRS Project Manager (DPM) — the orchestrator"));
body.push(P("The DPM is the central coordinator of the whole lifecycle. It never produces marketing deliverables — it orchestrates while Claude performs the work."));
body.push(...bullets([
  [["Project initialization ",true],["— on Create Project, build the workspace and metadata."]],
  [["Stage management ",true],["— validate entry conditions, create folders, load KB + memory, track progress/files/risks, collect outputs."]],
  [["Context / Project Memory ",true],["— thread all prior-stage outputs forward; nothing is re-derived."]],
  [["Workflow orchestration ",true],["— run each stage’s sub-workflows in order; respect dependencies."]],
  [["Auditor coordination ",true],["— lock stage, send outputs to the Auditor, attach the report, present Claude’s recommendation and the audit findings together, await the human decision."]],
  [["Approval management ",true],["— render the gate, capture the decision, execute the branch."]],
  [["Timeline, Risk Register, governance hooks, project completion.",true]],
]));
body.push(H3("AI Auditor (DRS-tuned)"));
body.push(P("After Claude finishes a stage and before the human gate, the AI Auditor independently validates the outputs. For DRS it is stricter than a generic auditor: it enforces the cardinal rule (below). It checks completeness, evidence quality (within Claims Guardrails), knowledge correctness, alignment to the thesis/objectives/North Star, localization, and missing information; and it runs the cardinal-rule check on any stage that touches public communication or launch. It produces an Audit Report, Confidence Score (0–100), Blocker list, and Missing-Information Report. It recommends; it cannot approve — but a cardinal-rule BLOCKER MUST dominate the gate so a human cannot approve it casually."));
body.push(H3("Project Memory"));
body.push(P("A persistent, structured store the DPM maintains across all stages (schema in Appendix A). It threads: project metadata → geography intelligence → market intelligence (+ scores) → stakeholder map → resistance register → narrative & FAQ → GTM → acquisition → consumer/behaviour data → comms & BTL → infra/ops readiness (ingested) → analytics → metrics → knowledge/lessons."));
body.push(H3("Knowledge Base"));
body.push(P("Read at the start of every project, written to at the end. Contents in Appendix B: DMS architecture, workflow library, RACI, KPI tree, cadence; geography instantiation template and all prior Geography Blueprints; narrative houses, FAQ kits, proof-point banks, claims guardrails; government document templates, SOP library, playbooks, campaign assets; behaviour-barrier libraries; resistance-mitigation patterns; prior performance reports and lessons learned."));

body.push(H2("1.7 The cardinal rule (a hard guardrail)"));
body.push(P([["Communication readiness MUST NEVER exceed operational readiness. ",true],["The agent MUST refuse to scale public communication ahead of operational reality. This rule is enforced by the AI Auditor at Gate 4 (Awareness Scale-Up) and Gate 5 (Launch Go/No-Go).",false]]));

body.push(H2("1.8 Human / AI split model"));
body.push(P("Each stage carries a split tag:"));
body.push(...bullets([
  [["AI-LED ",true],["— Claude does ~90%; a human approves at the gate (e.g. Market Intelligence, narrative drafting)."]],
  [["CO-PILOT ",true],["— Claude prepares; a human performs the real-world action (government meeting, workshop, field activation) and feeds results back (e.g. Stakeholder Alignment, Acquisition)."]],
  [["HUMAN-LED / BOT-TRACKED ",true],["— humans/field own it; the agent tracks, analyzes and recommends (e.g. Infrastructure, Operations, approvals)."]],
]));

body.push(H2("1.9 Global rules & guardrails"));
body.push(...numbered([
  "Cardinal rule — communication readiness MUST never exceed operational readiness.",
  "Gate discipline — no stage advances without passing its gate; the DPM enforces this.",
  "Claims guardrails — the agent MUST NOT generate public claims it cannot evidence.",
  "Localization gate — public-facing assets MUST cover the geography’s mandatory languages before Awareness Scale-Up.",
  "Human-only actions — government engagement, approvals, signatures and field execution are human-only.",
  "Loop-backs are normal — a rejected gate routes to a defined corrective workflow, not failure.",
  "Everything is owned — every output, risk and gate has a RACI owner.",
  "Memory before re-work — the agent MUST read Project Memory before regenerating anything.",
  "Audit before gate — no gate is shown to a human without an attached Audit Report.",
]));

// ============================================================
// PART 2 — GEOGRAPHY INSTANTIATION
// ============================================================
body.push(H1("2. Geography instantiation (project creation)"));
body.push(P("When a user clicks Create DRS Project, the DPM creates a workspace and stores metadata:"));
body.push(table(["Field","Example value"],[
  ["Project ID","DRS-GOA-001  (DRS-{GEO}-{seq})"],
  ["Geography","Goa, India"],
  ["Scope zones","Panaji, Margao, Mapusa, Vasco, airport/beach corridors"],
  ["Implementation model","deposit / PRO model (from config)"],
  ["Languages","English, Konkani, Marathi, Hindi"],
  ["D-Day","target launch date OR “readiness-only”"],
  ["Budget / Objective","optional / public acceptance + return participation"],
  ["Status / Current Stage / Pod Lead","Active / 1 / (e.g. Alokesh)"],
],[3000,6360]));
body.push(label("Mandatory human inputs at creation: ","Geography (country + region); implementation model (if known); business objective; D-Day / timeline (or “readiness-only”). Optional: budget, target KPIs, special instructions."));
body.push(P("The DPM then loads the DMS Knowledge Base, the geography instantiation template, all prior Geography Blueprints, and the narrative/FAQ banks, and tells Claude: Start Stage 1."));
body.push(label("IF a Blueprint already exists for this geography ","→ the DPM MUST pre-fill Stage 1–3 drafts from it and mark each item “validate,” rather than starting blank."));
body.push(H2("2.1 Geography instantiation parameters"));
body.push(P("Each geography is launched by filling the instantiation template: Country · State/region · Population · Tourism index · Deposit amount · Retailer count · Languages · Machine count · Budget · Government/regulatory context · Priority stakeholders · Public behaviour barriers · Media landscape · Launch timeline · Minimum viable assets."));

// ============================================================
// PART 3 — THE STAGES
// ============================================================
body.push(H1("3. The stages"));
body.push(P("Each stage uses the same skeleton: Objective → Human Input → Claude Input → Claude Workflow → Claude Outputs → AI Auditor → Approval Gate → Data Passed → Success Criteria → Next Stage. The nine DMS workflows are mapped into their stages."));
body.push(table(["DMS Workflow","Lives in"],[
  ["WF1 Research Impact Assessment","Stage 3 Market Intelligence"],
  ["WF2 Stakeholder Mapping","Stage 4 Stakeholder Intelligence"],
  ["WF3 Narrative Development","Stage 6 DRS Marketing System"],
  ["WF4 Stakeholder Alignment","Stage 6 (+ Stage 4 inputs)"],
  ["WF5 Consumer Awareness","Stage 9 Consumer Engagement"],
  ["WF6 Launch Readiness (T-minus)","Stage 6 / Execution"],
  ["WF7 Reputation Management","Stage 10 / post-launch"],
  ["WF8 Collection Optimization","Stage 12 Operations (tracked)"],
  ["WF9 Narrative Amplification","Stage 15 Knowledge Hub"],
],[4680,4680]));

const stages = [
{ n:1, name:"Platform Foundation", layer:"1 · Project Configuration", split:"AI-LED", dms:"—",
  objective:"Understand the requirement and create the project foundation.",
  entry:"Project created.",
  humanInput:["Geography","Implementation model","Business objective","D-Day / timeline","Budget (optional), Target KPIs (optional), Special instructions (optional)"],
  claudeInput:["Project metadata","Knowledge Base: DMS README, prior Geography Blueprints, SOPs","Geography instantiation template"],
  workflows:[
    {id:"WF1.1", title:"Requirement understanding", items:["What geography, why now, what outcome is expected"]},
    {id:"WF1.2", title:"Historical learning", items:["Pull similar prior geographies, lessons, best and failed approaches"]},
    {id:"WF1.3", title:"Project definition", items:["Geography/Business Brief, objectives, scope, assumptions, constraints, timeline, success KPIs"]},
    {id:"WF1.4", title:"Project foundation", items:["Executive summary, initial risk register, project metadata, recommended implementation model + module list"]},
  ],
  outputs:["Geography Brief (v0)","Project Scope","Objectives & KPIs","Timeline","Risk Register (initial)","Executive Summary"],
  auditor:["Objectives defined; scope complete; KPIs present; timeline realistic","Correct, latest KB used; similar projects considered","Missing information; contradictions; business alignment"],
  gate:{code:"GATE 0 · Geography Triage", question:"Is this geography worth researching? (a cheap, hypothesis-based prioritization — not a launch decision)",
    owner:"Director Marketing", rec:"Explore / Park", actions:["Approve (Explore)","Park","Revise / Add information"],
    branches:[[["IF Explore ",true],["→ unlock Stage 2."]],[["IF Park ",true],["→ status Parked, store the brief, stop (no further cost)."]],[["IF Revise ",true],["→ re-run WF1.3–1.4 with new input."]]]},
  dataPassed:["Geography Brief","Objectives","Timeline","KPIs","Risks"],
  success:["Geography hypothesis defined","Leadership has chosen to explore or park"],
  ifs:[[["IF objective is vague ",true],["→ Auditor flags Missing-Info; DPM blocks the gate until clarified."]],[["IF a Blueprint exists for this geography ",true],["→ pre-fill and mark “validate,” do not start blank."]]],
  next:"Stage 2 — Geography Intelligence Engine"},

{ n:2, name:"Geography Intelligence Engine", layer:"2 · Geography Intelligence", split:"AI-LED", dms:"—",
  objective:"Build the dynamic administrative + business hierarchy down to outlet level, and the geography’s consumption / tourism / retail profile.",
  entry:"Gate 0 = Explore.",
  humanInput:["None (validation only)"],
  claudeInput:["Geography Brief","KB geography templates; prior Blueprints","Public datasets the agent can cite"],
  workflows:[
    {id:"WF2.1", title:"Administrative hierarchy (adapts to the geography)", items:["Goa: District → Taluka → Village Panchayat → Village → Outlet","Tamil Nadu: District → Corporation → Zone → Ward → Outlet","United Kingdom: Nation → County → Town → Store"]},
    {id:"WF2.2", title:"Business hierarchy & outlet mapping", items:["Retail landscape, hotels, restaurants, institutions, commercial clusters → outlet universe"]},
    {id:"WF2.3", title:"Demand context", items:["Population, consumption estimates, tourism index, seasonality"]},
    {id:"WF2.4", title:"Localization scope", items:["Set mandatory languages (hard-gate input for later public-facing stages)"]},
    {id:"WF2.5", title:"Rollout intelligence", items:["Priority talukas/zones, high-consumption areas, tourism hotspots, recommended rollout sequence"]},
  ],
  outputs:["Geography Hierarchy","Outlet Universe","Consumption / Tourism profile","Language requirements","Recommended rollout sequence"],
  auditor:["Hierarchy matches the real geography; outlet universe plausible","Data sources cited; languages set; coverage gaps flagged"],
  gate:{question:"Is the geography intelligence complete and correct?", rec:"Approve / Revise", actions:["Approve","Revise"],
    branches:[[["IF Revise ",true],["→ re-run the named WF2.x."]]]},
  dataPassed:["Hierarchy","Outlet universe","Demand profile","Languages","Rollout sequence"],
  success:["Geography fully mapped to outlet level","Languages locked"],
  ifs:[[["IF reliable data is unavailable ",true],["→ mark “To be validated by [owner]” rather than fabricating; Auditor flags Missing-Info (not a blocker yet)."]],[["IF tourism index is high ",true],["→ tag the geography “tourism-sensitive” (affects narrative + rollout)."]]],
  next:"Stage 3 — Market Intelligence"},

{ n:3, name:"Market Intelligence  (DMS begins · WF1)", layer:"3 · Implementation Intelligence", split:"AI-LED", dms:"WF1 Research Impact Assessment",
  objective:"Build the evidence base and the decision scores that determine whether to commit to launch.",
  entry:"Stage 2 approved.",
  humanInput:["None (validation only)"],
  claudeInput:["Geography Brief + intelligence","KB benchmarks, prior research, proof-point bank"],
  workflows:[
    {id:"WF3.1", title:"Evidence", items:["Environmental impact, economic impact, waste ecosystem, litter/leakage context, tourism / public-space relevance"]},
    {id:"WF3.2", title:"Policy & benchmarks", items:["Regulatory context, international DRS case studies, competitor study"]},
    {id:"WF3.3", title:"Consumer behaviour & barriers", items:["Behaviour-barrier hypotheses (barrier → evidence → audience → message → owner)"]},
    {id:"WF3.4", title:"ESG & opportunity", items:["ESG alignment, opportunity assessment, business case, proof-point bank, claims guardrails"]},
    {id:"WF3.5", title:"Scoring", items:["Compute Market Readiness Score, Implementation Complexity, Opportunity Score"]},
  ],
  outputs:["Research Impact Brief","Business Case","Proof-Point Bank","Claims Guardrails","Behaviour-barrier hypotheses","The three decision scores"],
  auditor:["Evidence sourced; benchmarks relevant; claims within guardrails","Scores justified by data; missing evidence flagged"],
  gate:{code:"GATE 1 · Geography Selection (the real commit)", question:"Is this geography worth launching / committing to?",
    owner:"Director Marketing + Leadership", rec:"Select / Defer", actions:["Approve (Select)","Defer","Revise"],
    branches:[[["IF Select ",true],["→ unlock Stage 4; the project enters expensive execution."]],[["IF Defer ",true],["→ status Deferred, store evidence, stop."]],[["IF Opportunity Score < threshold OR regulatory blocked ",true],["→ the agent MUST recommend Defer."]]]},
  dataPassed:["Research brief, business case","Proof points, claims guardrails","Behaviour barriers","The three scores"],
  success:["Leadership has a defensible Select/Defer decision backed by scores"],
  ifs:[[["IF scores conflict (high opportunity, high complexity) ",true],["→ the Auditor surfaces the trade-off explicitly; the gate stays a human judgement."]],[["IF evidence cannot answer a likely stakeholder objection ",true],["→ flag as a research gap to close before Stage 6."]]],
  next:"Stage 4 — Stakeholder Intelligence (only on Select)"},

{ n:4, name:"Stakeholder Intelligence  (WF2)", layer:"3 · Implementation Intelligence", split:"CO-PILOT", dms:"WF2 Stakeholder Mapping",
  objective:"Identify everyone who can accelerate or block adoption, and score them.",
  entry:"Gate 1 = Select.",
  humanInput:["Known contacts, prior relationships, field knowledge (fed in as available)"],
  claudeInput:["Geography intelligence; regulatory context","KB stakeholder patterns; prior Blueprints"],
  workflows:[
    {id:"WF4.1", title:"Government track", items:["Departments, officials, pollution board, municipal authorities, tourism department"]},
    {id:"WF4.2", title:"Ecosystem track", items:["PIBO/brands, retail, hotels, restaurants, municipality, panchayat, collectors, NGOs, media, universities, influencers"]},
    {id:"WF4.3", title:"Scoring", items:["For each: influence × current stance × desired role × priority (P0–P2)"]},
    {id:"WF4.4", title:"Outputs", items:["Influence Matrix, Champion List, Blocker/Risk List, Engagement Priority Plan"]},
    {id:"WF4.5", title:"Per-stakeholder record", items:["Support · Influence · Interest · Resistance · Engagement · Meetings · Follow-ups · Documents · Communication History"]},
  ],
  outputs:["Stakeholder Map","Influence Matrix","Champion List","Blocker List","Engagement Plan"],
  auditor:["All categories covered; P0 stakeholders identified","Champions & blockers named; single-threading risk; missing roles"],
  gate:{question:"Have all launch-critical stakeholders been identified and prioritized?", rec:"Approve / Revise / Request more", actions:["Approve","Revise","Request additional analysis"]},
  dataPassed:["Stakeholder map + matrices (to Stage 5 and Stage 6)"],
  success:["Complete, scored stakeholder universe with champions and blockers"],
  ifs:[[["IF a P0 government stakeholder is “Unknown” stance ",true],["→ flag as top risk; the agent drafts a first-meeting brief but the meeting is human-led."]],[["IF a blocker has high influence ",true],["→ auto-create a Resistance item (Stage 5) and a mitigation owner."]]],
  next:"Stage 5 — Resistance Intelligence"},

{ n:5, name:"Resistance Intelligence", layer:"3 · Implementation Intelligence", split:"AI-LED + CO-PILOT", dms:"—",
  objective:"Consolidate everything that could block adoption and plan mitigation. DRS-specific; no Marketplace/EPR equivalent.",
  entry:"Stage 4 approved.",
  humanInput:["Field signals, political context"],
  claudeInput:["Stakeholder blockers/concerns; behaviour barriers; media signals","KB resistance-mitigation patterns"],
  workflows:[
    {id:"WF5.1", title:"Fronts", items:["Government, Retail, Consumer, Brand, Media, Political, Operational"]},
    {id:"WF5.2", title:"Per item", items:["Root Cause → Impact → Probability → Severity → Mitigation → Owner → Status → Review Date"]},
    {id:"WF5.3", title:"Signals", items:["Compute Resistance Index, Sentiment Map, Heat Map, Trend"]},
    {id:"WF5.4", title:"Prediction", items:["Predict likely future resistance and recommend pre-emptive mitigation"]},
  ],
  outputs:["Resistance Register","Resistance Index","Sentiment Map","Heat Map","Mitigation plan with owners"],
  auditor:["Each front assessed; high-severity items have owners + mitigation; index justified"],
  gate:{code:"GATE 2 · Stakeholder Readiness", question:"Are launch-critical stakeholders aligned enough to proceed?", rec:"Proceed / Engage more", actions:["Proceed","Engage more"],
    branches:[[["IF Proceed ",true],["→ unlock Stage 6."]],[["IF Engage more ",true],["→ loop back to Stage 4 alignment activities; re-gate after."]],[["IF a high-severity blocker is unmitigated ",true],["→ the agent MUST recommend Engage more."]]]},
  dataPassed:["Resistance Register + index (to Stage 6 and Reputation in Stage 10)"],
  success:["Known resistance is mapped, owned, and mitigated or accepted"],
  ifs:[[["IF the Resistance Index rises above threshold at any later stage ",true],["→ the DPM re-opens this stage (loop-back) before proceeding."]]],
  next:"Stage 6 — DRS Marketing System"},

{ n:6, name:"DRS Marketing System (Core)  (WF3 + WF4 + WF6)", layer:"3 · Implementation Intelligence", split:"AI-LED + CO-PILOT", dms:"WF3 Narrative · WF4 Alignment · WF6 Launch Readiness",
  objective:"Turn evidence + stakeholders into a repeatable narrative, align stakeholders, and run launch readiness. This is the DMS core.",
  entry:"Gate 2 = Proceed.",
  humanInput:["Stakeholder feedback from workshops","Government alignment outcomes"],
  claudeInput:["Research brief, proof points, claims guardrails","Stakeholder map, behaviour barriers, languages"],
  workflows:[
    {id:"WF6a", title:"Narrative Development (DMS WF3)", items:["Narrative House → Persona Messaging Matrix → FAQ Kit → whitepapers/op-eds/roundtable briefs → localized message bank (mandatory languages)"]},
    {id:"WF6b", title:"Stakeholder Alignment (DMS WF4)", items:["Workshop agendas, briefing kits, demonstration plans, Commitment Tracker, updated Concern Log (workshops are human-led; the agent prepares and captures)"]},
    {id:"WF6c", title:"Launch Readiness (DMS WF6 — the T-minus engine)", items:["Build T-90 / T-60 / T-30 / T-15 / Launch / T+14 plan; each milestone has owner, status, and a go/no-go confidence score","Ingests Infrastructure (Stage 11) and Operations (Stage 12) readiness"]},
  ],
  outputs:["Narrative House","FAQ Kit","Persona Matrix","Localized Message Bank","Commitment Tracker","T-minus Launch Plan"],
  auditor:["Narrative evidence-backed & within claims guardrails; persona coverage; FAQ completeness","Localization complete","Cardinal-rule check: comms readiness vs ops readiness on the T-minus plan"],
  gate:{code:"GATE 3 · Narrative Approval", question:"Is the story clear, consistent, and evidence-backed?", owner:"Director Marketing", rec:"Approve / Revise", actions:["Approve","Revise"],
    branches:[[["IF Approve ",true],["→ unlock Stage 7."]],[["IF Revise ",true],["→ re-run WF6a with stakeholder input."]]]},
  dataPassed:["Narrative + FAQ + message bank + T-minus plan (to Stages 7–10)"],
  success:["One approved narrative every stakeholder can repeat","Launch plan exists"],
  ifs:[[["IF stakeholders interpret DRS inconsistently in workshops ",true],["→ loop WF6a (narrative revision) before proceeding."]],[["IF localization incomplete ",true],["→ Auditor BLOCKER; cannot pass into public-facing stages."]]],
  next:"Stage 7 — Go-To-Market Engine"},

{ n:7, name:"Go-To-Market Engine", layer:"3 · Implementation Intelligence", split:"AI-LED", dms:"—",
  objective:"Convert the approved narrative into a complete go-to-market plan.",
  entry:"Gate 3 = Approve.",
  humanInput:["Budget constraints, channel preferences"],
  claudeInput:["Narrative, personas, message bank","Geography rollout sequence, budget"],
  workflows:[
    {id:"WF7.1", title:"GTM build", items:["Segmentation → Target Personas → Positioning → Messaging → Channels → Campaign Calendar → Budget allocation → Execution plan → Monitoring → Optimization"]},
  ],
  outputs:["GTM Blueprint","Campaign Framework","Channel Plan","Campaign Calendar","Budget plan","KPI plan"],
  auditor:["GTM complete; channels matched to behaviour barriers; budget aligned; KPI coverage"],
  gate:{question:"Is the GTM strategy approved?", rec:"Approve / Revise", actions:["Approve","Revise"]},
  dataPassed:["GTM blueprint (to Stages 8–10)"],
  success:["Complete, costed GTM aligned to the rollout sequence"],
  ifs:[[["IF budget insufficient for full rollout ",true],["→ the agent proposes a phased rollout matched to priority zones."]]],
  next:"Stage 8 — Acquisition Engine"},

{ n:8, name:"Acquisition Engine", layer:"3 · Implementation Intelligence", split:"CO-PILOT", dms:"—",
  objective:"Build and prioritize the partner universe and pipeline.",
  entry:"Stage 7 approved.",
  humanInput:["Meeting outcomes, proposals, negotiations (real-world)"],
  claudeInput:["Stakeholder map, GTM, geography outlet universe"],
  workflows:[
    {id:"WF8.1", title:"Universe", items:["Government · PIBO · Brands · Retail · Hotels · Restaurants · Bars · Beach Shacks · Casinos · Schools · Colleges · Municipality · Panchayat · CSR · NGOs · Collectors · Recyclers"]},
    {id:"WF8.2", title:"Pipeline", items:["Universe → Priority → Target → Contact → Meeting → Proposal → Negotiation → Approval → Agreement → Onboarding → Activation"]},
    {id:"WF8.3", title:"Intelligence", items:["Lead score, priority, suggested follow-up, meeting-summary drafting"]},
  ],
  outputs:["Target universe","Prioritized pipeline","Lead scores","Follow-up plans","Meeting-summary drafts"],
  auditor:["Universe coverage; prioritization logic; pipeline hygiene; retail readiness inputs for Gate 4"],
  gate:{code:"GATE 4 · Awareness Scale-Up", question:"Can public communication begin?", owner:"DMS Pod Lead", rec:"Scale / Hold", actions:["Scale","Hold"],
    branches:[[["IF retail readiness < threshold OR operational readiness absent OR localization incomplete ",true],["→ MUST Hold (Auditor BLOCKER, cardinal rule)."]],[["IF Scale ",true],["→ unlock Stage 9 (public awareness)."]]]},
  dataPassed:["Pipeline + activation data (to Stages 9–10)"],
  success:["Partner pipeline live; readiness confirmed before public comms"],
  ifs:[[["IF P0 retail partners are not onboarded ",true],["→ Hold; do not scale awareness in those zones."]]],
  next:"Stage 9 — Consumer Engagement"},

{ n:9, name:"Consumer Engagement  (WF5)", layer:"4 · Execution Intelligence", split:"AI-LED + CO-PILOT", dms:"WF5 Consumer Awareness",
  objective:"Build public understanding and participation intent; drive behaviour change.",
  entry:"Gate 4 = Scale.",
  humanInput:["Field activation results, consumer feedback"],
  claudeInput:["Narrative, message bank, behaviour barriers, channels, languages"],
  workflows:[
    {id:"WF9.1", title:"Engagement journey", items:["Awareness → Education → School → College → Community → Retail → Airport → Tourism → Digital → CSR → Feedback → Sentiment → Behaviour Change"]},
    {id:"WF9.2", title:"Behaviour-barrier activation", items:["For each barrier: deploy the matched message at the right return-moment channel; assign owner; measure comprehension"]},
    {id:"WF9.3", title:"Asset production", items:["Awareness creatives, explainers, school kits, retail signage, social/influencer briefs (localized)"]},
  ],
  outputs:["Consumer Awareness Plan","Localized assets","Channel calendar","Behaviour-barrier tracker","Sentiment baseline"],
  auditor:["Assets localized; messages matched to barriers; comprehension-test plan present; claims within guardrails"],
  gate:{question:"Is the consumer awareness program approved to run?", rec:"Approve / Revise", actions:["Approve","Revise"]},
  dataPassed:["Awareness data + sentiment (to Stage 10 and Analytics)"],
  success:["Awareness live; behaviour barriers actively addressed and measured"],
  ifs:[[["IF consumers don’t understand deposit/return/reward mechanics (low comprehension) ",true],["→ loop to revise messaging."]],[["IF return points are not yet live ",true],["→ publish education only, not location/process guidance (cardinal rule)."]]],
  next:"Stage 10 — Communication & BTL"},

{ n:10, name:"Communication & BTL  (+ WF7 Reputation)", layer:"4 · Execution Intelligence", split:"AI-LED + CO-PILOT", dms:"WF7 Reputation Management",
  objective:"Run audience-specific communication, execute BTL, and protect reputation through launch.",
  entry:"Stage 9 approved.",
  humanInput:["BTL vendor execution, event delivery, spokesperson actions"],
  claudeInput:["Narrative, stakeholder map, resistance register, media landscape"],
  workflows:[
    {id:"WF10.1", title:"Communication", items:["Internal · Government · Retail · Consumer · Media · Brand · Partner comms plans + assets"]},
    {id:"WF10.2", title:"BTL", items:["Planning → Calendar → Vendor brief → Material → Execution plan → Attendance → Bottle-collection capture → ROI → Reports"]},
    {id:"WF10.3", title:"Reputation (DMS WF7)", items:["Media monitoring, social listening, misinformation detection, Rapid Response Brief (with SLA), retail testimonials, milestone comms"]},
  ],
  outputs:["Communication plans","BTL plan + ROI tracker","Rapid Response protocol","Media monitoring + sentiment reports"],
  auditor:["Audience coverage; BTL ROI tracking; rapid-response SLA defined; escalation paths set"],
  gate:{code:"GATE 5 · Launch Go / No-Go", question:"Is the public promise operationally ready to launch?", owner:"DMS Pod Lead + Operations", rec:"Go / Go-with-conditions / Delay", actions:["Go","Go with conditions","Delay"],
    branches:[[["IF machine readiness < threshold at T-15 OR retail readiness < threshold ",true],["→ No-Go or Conditional (limited zones)."]],[["IF Go ",true],["→ proceed to launch + post-launch."]],[["IF Delay ",true],["→ reset T-minus, loop readiness items."]]]},
  dataPassed:["Launch package + reputation feeds (to Analytics and Operations)"],
  success:["Synchronized launch where the public promise matches operational reality"],
  ifs:[[["IF negative sentiment spikes pre-launch ",true],["→ trigger Rapid Response within SLA; escalate to Communications Head; may force Delay."]]],
  next:"Stages 11/12 (tracked) → Stage 13"},

{ n:11, name:"Infrastructure  (TRACKED DEPENDENCY)", layer:"4 · Execution Intelligence", split:"HUMAN-LED / BOT-TRACKED", dms:"—",
  objective:"Stand up machines/return points. The agent does not execute this — it ingests readiness.",
  entry:"In parallel with Stages 9–10.",
  humanInput:["Readiness status per site (from ops/field)"],
  claudeInput:["Site/installation status feeds"],
  workflows:[
    {id:"WF11.1", title:"Bot role (track, don’t execute)", items:["Track Site Identification → Survey → Power → Internet → Permission → Installation → Commissioning → Maintenance → Machine Analytics","Surface readiness % into Gates 4 and 5; raise risks; recommend sequencing aligned to priority zones"]},
  ],
  outputs:["Infrastructure readiness dashboard (ingested)","Launch-risk flags"],
  auditor:["Feeds the cardinal-rule check (comms vs ops readiness)"],
  gate:{question:"(No standalone gate — feeds Gate 5 Launch Go/No-Go)", rec:"—", actions:["—"]},
  dataPassed:["Readiness % (to Stage 6 T-minus plan and Gate 5)"],
  success:["Accurate, current site readiness available to the launch decision"],
  ifs:[[["IF readiness lags the T-minus plan ",true],["→ the agent raises a launch risk and recommends Conditional Launch or Delay."]]],
  next:"Stage 12 — Operations"},

{ n:12, name:"Operations  (TRACKED DEPENDENCY · WF8 Collection Optimization)", layer:"4 · Execution Intelligence", split:"HUMAN-LED / BOT-TRACKED", dms:"WF8 Collection Optimization",
  objective:"Run the return-to-recycler loop. The agent tracks and optimizes; it does not run logistics.",
  entry:"Post-launch.",
  humanInput:["Operational execution (collection, sorting, transport, recycling)"],
  claudeInput:["Return/collection/cost data feeds; consumer & retailer feedback"],
  workflows:[
    {id:"WF12.1", title:"Ingest", items:["Bottle Return → Validation → Refund → Collection → Sorting → Transport → Recycler → PCR → Brand → Reporting"]},
    {id:"WF12.2", title:"Collection Optimization (DMS WF8)", items:["Diagnose location friction, behaviour gaps, cost per container, repeat participation; recommend nudges and comms updates"]},
  ],
  outputs:["Collection dashboard","Location performance report","Friction log","Optimization recommendations","Updated awareness messages"],
  auditor:["Data quality; KPI accuracy; recommendation quality"],
  gate:{code:"GATE 6 · Post-Launch Optimization", question:"What must improve first?", owner:"Operations + Marketing", rec:"Pick the workflow to fix", actions:["Continue","Investigate","Optimize (pick workflow)"],
    branches:[[["Route the chosen fix back to the relevant stage ",true],["(awareness / retail / location / messaging) as a loop-back."]]]},
  dataPassed:["Optimization insights (to Stage 9 awareness, Stage 10 comms)"],
  success:["Return rate and cost improving; friction reduced"],
  ifs:[[["IF return rate < target OR cost per container rises ",true],["→ auto-open an optimization loop and feed insights to Stages 9 and 10."]]],
  next:"Stage 13 — Analytics"},

{ n:13, name:"Analytics", layer:"5 · Performance Intelligence", split:"AI-LED", dms:"—",
  objective:"Provide role-based dashboards, all filtering by geography + implementation model, all rolling up to the Adoption Index.",
  entry:"Launch onward.",
  humanInput:["None (review only)"],
  claudeInput:["All performance, awareness, stakeholder, ops and finance data feeds"],
  workflows:[
    {id:"WF13.1", title:"Dashboards", items:["Generate/refresh Executive · Project · Marketing · Stakeholder · Government · Acquisition · BTL · Infrastructure · Operations · Finance · Knowledge dashboards"]},
    {id:"WF13.2", title:"Reporting", items:["Daily / weekly / monthly reports; Adoption Index trend"]},
  ],
  outputs:["Dashboards","Daily/weekly/monthly reports","Adoption Index trend"],
  auditor:["Data quality, KPI accuracy, dashboard consistency, decision-support readiness"],
  gate:{question:"Is performance meeting objectives?", rec:"Continue / Investigate / Optimize", actions:["Continue","Investigate","Move to Optimization"]},
  dataPassed:["Performance insights (to Stage 12 loop and governance reviews)"],
  success:["Performance fully measured; objectives validated; optimization opportunities identified"],
  ifs:[[["IF the Adoption Index declines for 2 cycles ",true],["→ the DPM raises a system-health alert for the monthly review."]]],
  next:"Stage 14 — Metrics Engine"},

{ n:14, name:"Metrics Engine", layer:"5 · Performance Intelligence", split:"AI-LED", dms:"—",
  objective:"Expose every module’s metrics with full transparency; separate leading from lagging indicators.",
  entry:"Continuous.",
  humanInput:["None"],
  claudeInput:["Every module’s KPI definitions and data sources"],
  workflows:[
    {id:"WF14.1", title:"Metrics contract", items:["Each module exposes: Objective · KRA · KPI · Formula · Data Source · Frequency · Target · Actual · Variance · Trend · Owner"]},
    {id:"WF14.2", title:"Leading vs lagging", items:["Leading: stakeholders mapped/briefed, champion commitments, concerns resolved, message comprehension, retail readiness, launch-readiness score","Lagging: containers returned, return rate, active users, repeat returns, retail participation, cost per container, sentiment trend"]},
  ],
  outputs:["Metrics tree mapped to the North Star"],
  auditor:["Formula correctness; data-source validity; North-Star alignment"],
  gate:{question:"(No gate — continuous metrics layer)", rec:"—", actions:["—"]},
  dataPassed:["Metrics tree (to Analytics and governance)"],
  success:["Transparent, owned metrics rolling up to the Adoption Index"],
  ifs:[[["IF a KPI lacks a data source ",true],["→ the Auditor flags it as Missing-Info."]]],
  next:"Stage 15 — Knowledge Hub"},

{ n:15, name:"Knowledge Hub  (WF9 Narrative Amplification + cloning)", layer:"5 · Performance Intelligence", split:"AI-LED", dms:"WF9 Narrative Amplification",
  objective:"Capture everything reusable and produce the next-geography blueprint.",
  entry:"Milestones achieved.",
  humanInput:["Manual notes, leadership observations, special learnings (optional)"],
  claudeInput:["The complete project history"],
  workflows:[
    {id:"WF15.1", title:"Narrative Amplification (DMS WF9)", items:["Turn milestones into case studies, PR, social proof; equip stakeholders with proof"]},
    {id:"WF15.2", title:"Knowledge capture", items:["SOP library, playbooks, templates, government documents, campaign assets, research papers, lessons learned, best practices"]},
    {id:"WF15.3", title:"Reusable Geography Blueprint", items:["Package evidence, narrative, FAQ, stakeholder patterns, and playbook so the next geography starts ahead"]},
  ],
  outputs:["Updated Knowledge Base","Geography Blueprint","Lessons-learned report","Executive closure report"],
  auditor:["Correct categorization; version control; duplicate detection; reusability"],
  gate:{code:"GATE 7 · Amplification", question:"Is there credible proof to share?", owner:"Marketing + Communications", rec:"Amplify / Wait", actions:["Amplify","Wait"],
    branches:[[["IF no credible milestone yet ",true],["→ Wait; capture internally, do not publish externally."]]]},
  dataPassed:["Geography Blueprint (to the Knowledge Base, for the next geography)"],
  success:["Knowledge Base updated; Blueprint generated; project officially completed"],
  ifs:[[["IF a milestone is achieved but not communicated ",true],["→ the agent prompts amplification at the weekly review."]]],
  next:"Project close (or loop to the next geography)"},

{ n:16, name:"AI Copilot  (CROSS-CUTTING)", layer:"Cross-cutting", split:"AI-LED (assist only)", dms:"—",
  objective:"Embed AI assistance throughout every stage — not a standalone chatbot.",
  entry:"All stages.",
  humanInput:["Questions / requests in context"],
  claudeInput:["Project Memory + Knowledge Base"],
  workflows:[
    {id:"WF16.1", title:"Capabilities", items:["Research summarization, case-study retrieval, stakeholder insights, meeting summaries, GTM drafting, campaign/FAQ/PR generation, KPI explanations, trend analysis, resistance recommendations, report/presentation generation, knowledge search"]},
  ],
  outputs:["In-context assistance across every stage"],
  auditor:["Outputs respect claims guardrails and the cardinal rule"],
  gate:{question:"(Cross-cutting — no gate)", rec:"—", actions:["—"]},
  dataPassed:["Accelerated outputs into each stage"],
  success:["AI advises and accelerates; approvals and execution stay with humans"],
  ifs:[[["Principle ",true],["— AI advises and accelerates; approvals and execution stay with the marketing and implementation teams."]]],
  next:"—"},
];

stages.forEach(s => body.push(...stage(s)));

// ============================================================
// PART 4 — THE DMS ENGINE IN FULL (9 workflows)
// ============================================================
body.push(new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore:true, children:[new TextRun("4. The DMS engine in full — the nine workflows")] }));
body.push(P("The agent’s stages are powered by the DMS’s nine workflows. Each is specified here with its purpose, inputs, activities, outputs, KPIs, RACI, AI agents, templates, review frequency, and optimization triggers, so nothing from the Director’s DMS is lost."));

const dmsWF = [
{id:"WF1", name:"Research Impact Assessment", owner:"Marketing", outcome:"Evidence base for DRS adoption",
 purpose:"Understand the environmental, economic and social case for DRS in the target geography.",
 inputs:"Geography context · waste/litter data · tourism/public-space data · consumption estimates · international DRS benchmarks · regulatory context · past pilot/collection data.",
 activities:"Study comparable DRS systems; estimate local environmental & tourism impact; build the economic & social case; identify behaviour barriers; convert evidence into proof points.",
 outputs:"Research impact brief · case studies · business case · behaviour-insight notes · proof-point bank.",
 kpis:"Research brief completed · validated proof points · stakeholder questions answered by evidence · evidence gaps · narrative inputs on time.",
 raci:"R: Marketing · A: Marketing Head · C: Operations, Government Affairs, ESG, Data · I: Director Marketing, Pod Lead.",
 ai:"Research synthesis agent · benchmarking agent · evidence-to-message agent.",
 templates:"Research impact brief · case study · proof-point bank.",
 review:"Weekly before narrative approval; monthly after launch.",
 triggers:"Stakeholders ask questions evidence cannot answer; public objections on impact/credibility; collection data contradicts assumptions."},
{id:"WF2", name:"Stakeholder Mapping", owner:"Government Affairs", outcome:"Influence map and champion list",
 purpose:"Identify stakeholders who can accelerate, enable, influence or block adoption.",
 inputs:"Geography brief · regulatory context · retailer/brand landscape · municipality/pollution-board context · media/influencer landscape · NGO/school/academic ecosystem.",
 activities:"Map government & regulatory stakeholders, retailers, brands, municipalities, NGOs, journalists, academics, influencers; score influence & stance; identify champions & blockers; set engagement priority.",
 outputs:"Stakeholder map · influence matrix · champion list · blocker/risk list · engagement priority plan.",
 kpis:"Map completion · priority stakeholders identified · champion completeness · stakeholders engaged · readiness score.",
 raci:"R: Government Affairs · A: Gov Affairs Head · C: Marketing, Partnerships, Operations · I: Director Marketing, Pod Lead.",
 ai:"Stakeholder mapping assistant · influence scoring assistant · briefing-note agent.",
 templates:"Stakeholder map · influence matrix · champion list.",
 review:"Weekly before launch; monthly after.",
 triggers:"A priority stakeholder is unengaged; a blocker gains influence; coalition gaps delay launch."},
{id:"WF3", name:"Narrative Development", owner:"Marketing", outcome:"Geography-specific DRS narrative",
 purpose:"Create the core DRS story and stakeholder-specific messages for the geography.",
 inputs:"Research brief · proof-point bank · stakeholder map · behaviour barriers · local-language needs · sentiment signals.",
 activities:"Build narrative house; draft persona messaging; create FAQ kit; develop whitepapers/op-eds/roundtable themes; validate with priority stakeholders; translate & localize.",
 outputs:"Narrative house · persona messaging matrix · FAQ kit · whitepaper/op-ed · roundtable brief · localized message bank.",
 kpis:"Narrative approved · priority-stakeholder message fit · FAQ completeness · content assets completed · message recall/comprehension.",
 raci:"R: Marketing · A: Marketing Head · C: Gov Affairs, Communications, Operations, Legal/Policy · I: Director Marketing, Pod Lead.",
 ai:"Narrative strategist · persona messaging agent · FAQ generator · localization assistant.",
 templates:"Narrative house · persona messaging matrix · FAQ kit.",
 review:"Weekly before launch; monthly after.",
 triggers:"Stakeholders interpret DRS inconsistently; consumer questions reveal confusion; media frames DRS incorrectly."},
{id:"WF4", name:"Stakeholder Alignment", owner:"Government Affairs", outcome:"Coalition support & readiness",
 purpose:"Prepare influential stakeholders to support, explain and participate in the launch.",
 inputs:"Stakeholder map · champion list · narrative house · FAQ kit · demonstration plan · pilot/site-visit options.",
 activities:"Conduct workshops; share FAQ kits & briefing notes; host demonstration visits; arrange pilot visits; capture concerns and update assets; secure visible champions and participation commitments.",
 outputs:"Workshop report · stakeholder briefing kits · demonstration log · commitment tracker · updated concern log.",
 kpis:"Priority stakeholders briefed · readiness score · champion commitments · open concerns resolved · partner participation commitments.",
 raci:"R: Government Affairs · A: Gov Affairs Head · C: Marketing, Operations, Partnerships, Communications · I: Director Marketing, Pod Lead.",
 ai:"Briefing-kit assistant · concern-summarization agent · commitment-tracker assistant.",
 templates:"Stakeholder briefing kit · workshop agenda · concern & commitment tracker.",
 review:"Weekly before launch.",
 triggers:"Stakeholder readiness stays low; repeated concerns emerge; a launch-critical stakeholder is not aligned."},
{id:"WF5", name:"Consumer Awareness", owner:"Marketing", outcome:"Public understanding & participation intent",
 purpose:"Build public understanding and participation intent before and during launch.",
 inputs:"Narrative house · behaviour barriers · language requirements · launch locations · retail/machine locations · school/airport/transit/social/influencer channels.",
 activities:"Run school awareness; activate retail awareness; activate airport/transit comms; publish social & influencer content; use local-language explainers; promote how/where/why to return.",
 outputs:"Consumer awareness plan · channel calendar · retail/store assets · school activation kit · social content · influencer briefs.",
 kpis:"Awareness reach · message comprehension · retail asset deployment · sessions completed · social engagement · inquiry volume · participation intent.",
 raci:"R: Marketing · A: Marketing Head · C: Retail/Partner, Operations, Communications, Influencer Partners · I: Director Marketing, Pod Lead.",
 ai:"Consumer copy agent · local-language adaptation agent · social content agent · channel-planning assistant.",
 templates:"Consumer awareness plan · retail asset checklist · school activation kit · influencer brief.",
 review:"Weekly before and during launch.",
 triggers:"Awareness reach low; consumers don’t understand deposit/return/reward; retail teams report repeated questions."},
{id:"WF6", name:"Launch Readiness", owner:"DMS Pod Lead", outcome:"Synchronized comms & operational readiness",
 purpose:"Synchronize communication, stakeholder, retail, machine-demo and launch-day execution.",
 inputs:"Launch date · awareness plan · stakeholder readiness · retail onboarding · machine deployment/demo status · media plan · event plan.",
 activities:"Run T-90 awareness, T-60 retail onboarding, T-30 mass-media, T-15 machine-demo readiness; prepare launch-day plan; conduct go/no-go review.",
 outputs:"Launch readiness tracker · T-minus plan · go/no-go decision · launch-day runbook · issue log.",
 kpis:"T-minus milestones completed · retail onboarding readiness · machine/demo readiness · awareness deployment · issue closure · go/no-go confidence.",
 raci:"R: DMS Pod Lead · A: DMS Pod Lead · C: Marketing, Operations, Retail/Partner, Communications, Gov Affairs · I: Director Marketing, Leadership.",
 ai:"Launch-checklist assistant · issue-log summarizer · runbook generator.",
 templates:"Launch readiness tracker · launch-day runbook · go/no-go checklist.",
 review:"Weekly T-90 to T-30; twice weekly T-30 to launch.",
 triggers:"Any T-minus milestone delayed; communication readiness exceeds operational readiness; risks unresolved at T-15."},
{id:"WF7", name:"Reputation Management", owner:"Communications", outcome:"Trust protection & rapid response",
 purpose:"Protect trust before and after launch by monitoring narratives, responding quickly, and amplifying credible proof.",
 inputs:"Media monitoring · social listening · stakeholder concerns · retail feedback · collection milestones · incident reports.",
 activities:"Monitor sentiment; identify misinformation; prepare rapid responses; capture testimonials; communicate milestones; route operational issues to owners.",
 outputs:"Media monitoring report · rapid response brief · issue response log · testimonial bank · milestone communication.",
 kpis:"Response turnaround · negative-issue closure · sentiment trend · misinformation resolved · testimonials collected · milestones communicated.",
 raci:"R: Communications · A: Communications Head · C: Marketing, Operations, Gov Affairs, Legal/Policy · I: Director Marketing, Pod Lead.",
 ai:"Media-monitoring summarizer · rapid-response drafting agent · sentiment classifier.",
 templates:"Rapid response brief · media monitoring log · testimonial capture.",
 review:"Daily during launch window; weekly post-launch.",
 triggers:"Negative sentiment rises; misinformation spreads; operational issues create reputation risk."},
{id:"WF8", name:"Collection Optimization", owner:"Operations", outcome:"Improved return rate & efficiency",
 purpose:"Improve return behaviour, retail participation and collection efficiency using operational and behavioural data.",
 inputs:"Containers returned · return rate · cost per container · active users · retail participation · location performance · consumer & retailer feedback.",
 activities:"Analyze return patterns; identify low-performing locations & friction; recommend behaviour nudges; update retail/machine comms; feed insights to awareness & reputation.",
 outputs:"Collection dashboard · location performance report · friction log · optimization recommendations · updated awareness messages.",
 kpis:"Containers returned · return rate · cost per container · active users · retail participation · repeat returns · location improvement.",
 raci:"R: Operations · A: Operations Head · C: Marketing, Retail/Partner, Data · I: Director Marketing, Pod Lead.",
 ai:"Collection data analyst · friction classifier · optimization recommendation assistant.",
 templates:"Collection dashboard · friction log · location optimization brief.",
 review:"Weekly after launch.",
 triggers:"Return rate below target; cost per container rises; specific locations underperform; consumer friction repeats."},
{id:"WF9", name:"Narrative Amplification", owner:"Marketing", outcome:"Proof-led adoption story for scale",
 purpose:"Turn milestones and proof into stronger adoption stories for the current and future geographies.",
 inputs:"Collection milestones · impact data · stakeholder & retail testimonials · media wins · before/after visuals · community stories.",
 activities:"Build milestone stories; publish case studies; create PR & social amplification; equip stakeholders with proof; update research & narrative; package learnings for the next geography.",
 outputs:"Milestone campaign · case study · PR story · social proof assets · updated playbook · next-geography briefing.",
 kpis:"Milestones amplified · earned media · stakeholder endorsements · case studies completed · next-geography assets updated · positive sentiment movement.",
 raci:"R: Marketing · A: Marketing Head · C: Communications, Operations, Gov Affairs, Retail/Partner · I: Director Marketing, Leadership.",
 ai:"Case-study writer · PR-angle generator · social-proof asset assistant.",
 templates:"Milestone story · case study · next-geography briefing.",
 review:"Monthly after launch.",
 triggers:"Milestones achieved but not communicated; future-geography teams lack proof; stakeholder confidence needs reinforcement."},
];
dmsWF.forEach(w => {
  body.push(H2(`${w.id} — ${w.name}`));
  body.push(P([["Primary owner: ",true],[w.owner+"    "],["Primary outcome: ",true],[w.outcome]]));
  body.push(label("Purpose: ", w.purpose));
  body.push(label("Inputs: ", w.inputs));
  body.push(label("Activities: ", w.activities));
  body.push(label("Outputs: ", w.outputs));
  body.push(label("KPIs: ", w.kpis));
  body.push(label("RACI: ", w.raci));
  body.push(label("AI agents: ", w.ai));
  body.push(label("Templates: ", w.templates));
  body.push(label("Review frequency: ", w.review));
  body.push(label("Optimization triggers: ", w.triggers));
});

// ============================================================
// PART 5 — GATES MASTER TABLE
// ============================================================
body.push(new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore:true, children:[new TextRun("5. Decision gates — master table")] }));
body.push(table(["Gate","Fires after","Question","Owner","Outcomes & branches"],[
  ["0 · Geography Triage","Stage 1","Worth researching?","Director Marketing","Explore → Stage 2 · Park → stop/store · Revise → re-run WF1.3"],
  ["1 · Geography Selection","Stage 3","Worth launching/committing?","Director Mktg + Leadership","Select → Stage 4 · Defer → park · auto-Defer IF Opportunity<threshold or regulatory blocked"],
  ["2 · Stakeholder Readiness","Stage 5","Stakeholders aligned to proceed?","Gov Affairs + Pod Lead","Proceed → Stage 6 · Engage more → loop Stage 4"],
  ["3 · Narrative Approval","Stage 6","Story clear & evidence-backed?","Director Marketing","Approve → Stage 7 · Revise → loop WF6a"],
  ["4 · Awareness Scale-Up","Stage 8","Can public comms begin?","Pod Lead","Scale → Stage 9 · Hold (MUST IF readiness/localization incomplete)"],
  ["5 · Launch Go/No-Go","Stage 10","Public promise ops-ready?","Pod Lead + Operations","Go · Conditional (limited zones) · Delay (MUST IF readiness<threshold)"],
  ["6 · Post-Launch Optimization","Stage 12","What to improve first?","Operations + Marketing","Pick workflow → loop to Stage 9/10/retail"],
  ["7 · Amplification","Stage 15","Credible proof to share?","Marketing + Comms","Amplify → publish · Wait → capture internally"],
],[1500,1100,1900,1760,3100]));
body.push(P([["Universal branch rules: ",true],["Revise = re-run the named workflow, re-audit, re-gate. Reject/Hold/No-Go = do not advance; route to the corrective stage; notify the RACI owner. A cardinal-rule BLOCKER overrides any “Go/Scale” recommendation until resolved. Every loop-back updates Project Memory and the Risk Register.",false]]));

// ============================================================
// PART 6 — GOVERNANCE
// ============================================================
body.push(H1("6. Governance, cadence & RACI"));
body.push(H2("6.1 Roles (RACI)"));
body.push(...bullets([
  "Director Marketing — owns DMS architecture, system health, capability building.",
  "DMS Pod Lead — owns geography-level execution and launch readiness.",
  "Marketing Head — owns evidence, narrative, awareness, amplification.",
  "Government Affairs Head — owns stakeholder mapping and alignment.",
  "Communications Head — owns reputation, media monitoring, rapid response.",
  "Operations Head — owns launch operational readiness and collection optimization.",
  "Retail/Partner Teams — own retail onboarding, site coordination, partner activation.",
  "Data Team — supports evidence, collection dashboard, optimization analysis.",
  "Leadership — approves geography priority and major launch decisions.",
]));
body.push(H2("6.2 Decision points"));
body.push(table(["Decision point","Owner","Trigger","Output"],[
  ["Select DRS geography","Director Marketing + Leadership","New geography priority","Geography instantiation brief"],
  ["Approve core narrative","Director Marketing","Research & stakeholder inputs complete","Narrative house"],
  ["Move to stakeholder alignment","Marketing + Gov Affairs","Stakeholder map complete","Alignment plan"],
  ["Move to consumer awareness","DMS Pod Lead","Coalition & operational minimums ready","Awareness plan"],
  ["Approve launch readiness","Pod Lead + Operations","T-30 readiness review","Launch go/no-go decision"],
  ["Trigger rapid response","Communications","Negative media, misinformation, stakeholder concern","Response brief"],
  ["Shift optimization focus","Operations + Marketing","Return rate, cost, or friction issue","Collection optimization plan"],
  ["Amplify success story","Marketing + Communications","Milestone or proof point achieved","Case study or campaign"],
],[2400,2100,2660,2200]));
body.push(H2("6.3 Cadence"));
body.push(...bullets([
  [["Daily (T-7 → T+14): ",true],["launch-window check-in — issues, sentiment, escalations, rapid-response approvals."]],
  [["Weekly: ",true],["workflow standup — readiness, narrative gaps, biggest friction barrier, next actions; updates the weekly dashboard."]],
  [["Biweekly: ",true],["workflow improvement review — fix the one workflow dragging adoption."]],
  [["Monthly: ",true],["system-health review — Adoption Index trend, architecture changes, geography priority."]],
  [["Quarterly: ",true],["geography performance review + Blueprint refresh."]],
]));
body.push(H2("6.4 Feedback loops"));
body.push(...bullets([
  "Weekly: stakeholder feedback updates narrative & FAQs; consumer questions update awareness; retail/machine friction updates launch readiness; media sentiment updates rapid-response priorities.",
  "Monthly: collection data updates optimization; milestones update amplification; reputation signals update stakeholder comms; research gaps update the evidence plan.",
  "Quarterly: geography performance review; coalition review; public-adoption review; playbook update for the next geography.",
]));
body.push(H2("6.5 Escalation rules"));
body.push(...bullets([
  "Narrative disputed/unclear → Director Marketing.",
  "Any T-minus milestone delayed / readiness out of sync / go-no-go confidence drops → DMS Pod Lead.",
  "Negative media / misinformation / stakeholder concern goes public → Communications Head.",
  "Return rate / participation / friction below target → Operations Head.",
]));

// ============================================================
// PART 7 — METRICS
// ============================================================
body.push(H1("7. Metrics engine"));
body.push(H2("7.1 North Star roll-up (KPI tree)"));
body.push(...bullets([
  [["Public Awareness ",true],["← reach · comprehension · retail deployment · sessions · social · inquiry volume"]],
  [["Stakeholder Alignment ",true],["← mapped · briefed · champion commitments · concerns resolved · retail readiness"]],
  [["Return Participation ",true],["← containers returned · return rate · active users · repeat returns · retail participation"]],
  [["Trust & Friction (÷) ",true],["← negative sentiment · misinformation · unresolved concerns · machine friction · cost/container · complaints"]],
]));
body.push(H2("7.2 System-level KPIs"));
body.push(table(["KPI","Cadence","Owner"],[
  ["DRS Adoption Index","Weekly during launch, monthly after","DMS Pod Lead"],
  ["Public Awareness","Weekly","Marketing Head"],
  ["Stakeholder Readiness Score","Weekly before launch","Gov Affairs Head"],
  ["Launch Readiness Score","Weekly / twice-weekly near launch","DMS Pod Lead"],
  ["Return Rate","Weekly after launch","Operations Head"],
  ["Cost per Container","Weekly after launch","Operations Head"],
  ["Sentiment Trend","Weekly during launch","Communications Head"],
],[4360,3000,2000]));
body.push(H2("7.3 First weekly dashboard columns"));
body.push(P("Geography · Launch phase · Days to/since launch · Awareness reach · Message comprehension · Priority stakeholders mapped · Priority stakeholders briefed · Champion commitments · Open concerns · Retail readiness · Machine/demo readiness · T-minus status · Containers returned · Return rate · Active users · Retail participation · Cost per container · Sentiment trend · Top friction point · Owner · Next action."));

// ============================================================
// PART 8 — MIN VIABLE DMS + HEALTH
// ============================================================
body.push(H1("8. Readiness & system health"));
body.push(H2("8.1 Minimum viable DMS for a geography"));
body.push(P("A geography is ready for initial launch when these exist:"));
body.push(...bullets([
  "One research impact brief","One stakeholder map","One influence matrix","One champion list",
  "One narrative house","One FAQ kit","One consumer awareness plan","One launch readiness timeline",
  "One reputation response protocol","One collection dashboard",
]));
body.push(H2("8.2 System health indicators"));
body.push(P([["Healthy: ",true],["stakeholders repeat the narrative without heavy prompting; retailers/partners understand their role; consumer awareness rises before launch; the launch-day promise matches operational reality; media sentiment is monitored & managed; return participation improves after launch; milestones become public proof.",false]]));
body.push(P([["Unhealthy: ",true],["DRS is seen only as waste management / machine deployment; government, retailers, brands & consumers hear different stories; awareness starts too late; launch marketing overpromises operational readiness; negative narratives spread unanswered; collection data does not feed back into communication.",false]]));

// ============================================================
// PART 9 — KNOWLEDGE & CLONING
// ============================================================
body.push(H1("9. Knowledge capture & geography cloning"));
body.push(P("On project completion the agent MUST:"));
body.push(...numbered([
  "Write a Geography Blueprint to the KB (evidence + narrative + FAQ + stakeholder patterns + playbook + lessons).",
  "Update narrative/FAQ banks, proof-point bank, resistance-mitigation patterns, behaviour-barrier library.",
  "Produce an executive closure report.",
  "Tag reusable assets for the next geography.",
]));
body.push(P([["Cloning rule: ",true],["when a new geography is created, the DPM seeds Stages 1–3 from the most similar Blueprint and marks every seeded item “validate,” so each launch is faster, cheaper and more credible than the last.",false]]));

// ============================================================
// PART 10 — AI PROJECT MANAGER (lifecycle)
// ============================================================
body.push(new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore:true, children:[new TextRun("10. The DRS Project Manager (lifecycle)")] }));
body.push(P("The DRS Project Manager (DPM) manages the complete lifecycle of a DRS marketing project. It is the central coordinator for all stages — maintaining project context, validating stage readiness, tracking progress, coordinating the AI Auditor, and ensuring smooth transitions. It never generates marketing deliverables; it orchestrates while Claude performs the work."));
body.push(H2("10.1 Before Stage 1 — initialization"));
body.push(P("On Create Project, the DPM creates a workspace, stores the metadata (Section 2), loads the Knowledge Base (DMS KB, geography KB, prior Blueprints, templates, SOP library), and tells Claude: Start Stage 1."));
body.push(H2("10.2 Per-stage responsibilities"));
body.push(...bullets([
  [["Before: ",true],["validate required inputs; create project & stage folders; load KB + memory."]],
  [["During: ",true],["track Claude progress, files generated, knowledge used, risks found."]],
  [["After: ",true],["collect outputs; save into the stage folder; update Project Memory; call the AI Auditor; receive the audit report; show the Approval Gate; on approval, set current stage = next and transfer outputs."]],
]));
body.push(H2("10.3 Auditor coordination (before every gate)"));
body.push(...numbered([
  "Lock the current stage.","Send all stage outputs to the AI Auditor.","Wait for the audit report.",
  "Attach the audit report to the stage.","Present Claude’s recommendation and the audit findings together.",
  "Wait for the human decision.","If approved, unlock the next stage and transfer all approved outputs automatically.",
]));
body.push(H2("10.4 The DPM maintains throughout"));
body.push(...bullets([
  [["Project Memory ",true],["— metadata → geography → market → stakeholder → resistance → narrative → GTM → acquisition → consumer → comms → dependencies → analytics → metrics → knowledge."]],
  [["Timeline ",true],["— current day vs D-Day, T-minus milestones, tasks completed/pending, upcoming milestones, risks."]],
  [["Progress Tracker ",true],["— % complete per stage."]],
  [["Risk Register ",true],["— Government · Operational · Reputation · Consumer · Resistance risks, continuously updated."]],
]));
body.push(H2("10.5 Complete lifecycle"));
body.push(P("Create Project → DRS Project Manager → Load Knowledge Base → Run Stage → Collect Outputs → Run AI Auditor → Approval Gate → Update Project Memory → Start Next Stage → (repeat to the final stage) → Update Knowledge Base (write Geography Blueprint) → Close Project (archive + executive closure report)."));

// ============================================================
// APPENDICES
// ============================================================
body.push(new Paragraph({ heading:HeadingLevel.HEADING_1, pageBreakBefore:true, children:[new TextRun("Appendix A — Project Memory schema (minimum)")] }));
const mem = [
"project: { id, geography, zones, implementation_model, languages, d_day, budget, status, current_stage, pod_lead }",
"geography_intelligence: { hierarchy, outlet_universe, demand_profile, rollout_sequence, languages }",
"market_intelligence: { research_brief, business_case, proof_points, claims_guardrails, scores{readiness, complexity, opportunity}, behaviour_barriers[] }",
"stakeholders: { map[], influence_matrix, champions[], blockers[] }",
"resistance: { register[], index, sentiment_map, heat_map }",
"narrative: { house, persona_matrix, faq_kit, message_bank{by_language}, commitment_tracker, t_minus_plan }",
"gtm: { blueprint, channels, calendar, budget }    acquisition: { universe[], pipeline[], lead_scores }",
"consumer: { awareness_plan, assets{by_language}, barrier_tracker, sentiment }",
"comms_btl: { plans, btl_roi, rapid_response_protocol, media_monitoring }",
"dependencies: { infrastructure_readiness{by_site}, operations{return_rate, cost_per_container, ...} }",
"analytics: { dashboards[], adoption_index_trend }    metrics: { tree, leading[], lagging[] }",
"knowledge: { blueprint, lessons, assets[] }",
"risk_register: [ {type, item, severity, owner, status} ]    gate_log: [ {gate, decision, owner, timestamp, audit_ref} ]",
];
mem.forEach(m => body.push(new Paragraph({ spacing:{after:30}, children:[new TextRun({ text:m, font:"Consolas", size:18 })] })));

body.push(H1("Appendix B — Knowledge Base structure"));
body.push(P("DMS architecture · workflow library · RACI · KPI tree · cadence · geography instantiation template · Geography Blueprints · narrative/FAQ banks · proof-point bank · claims guardrails · government document templates · SOP library · playbooks · campaign assets · behaviour-barrier library · resistance-mitigation patterns · prior performance reports."));

body.push(H1("Appendix C — Stage → DMS workflow → Gate map"));
body.push(table(["Stage","DMS WF","Gate"],[
  ["1 Platform Foundation","—","Gate 0 Triage"],
  ["2 Geography Engine","—","approve/revise"],
  ["3 Market Intelligence","WF1","Gate 1 Selection"],
  ["4 Stakeholder Intelligence","WF2","approve/revise"],
  ["5 Resistance Intelligence","—","Gate 2 Stakeholder Readiness"],
  ["6 DRS Marketing System","WF3, WF4, WF6","Gate 3 Narrative Approval"],
  ["7 Go-To-Market","—","approve/revise"],
  ["8 Acquisition","—","Gate 4 Awareness Scale-Up"],
  ["9 Consumer Engagement","WF5","approve/revise"],
  ["10 Communication & BTL","WF7","Gate 5 Launch Go/No-Go"],
  ["11 Infrastructure","—","tracked (feeds Gate 5)"],
  ["12 Operations","WF8","Gate 6 Post-Launch Optimization"],
  ["13 Analytics","—","continue/investigate/optimize"],
  ["14 Metrics Engine","—","—"],
  ["15 Knowledge Hub","WF9","Gate 7 Amplification"],
  ["16 AI Copilot","—","cross-cutting"],
],[3960,2700,2700]));

body.push(H1("Appendix D — Glossary"));
body.push(...bullets([
  "DRS — Deposit Return System","DMS — DRS Marketing System (the engine)","DMA — DRS Marketing Agent (this bot)",
  "DPM — DRS Project Manager (orchestrator)","PIBO — Producer / Importer / Brand-Owner","PRO — Producer Responsibility Organisation",
  "BTL — Below-The-Line","PCR — Post-Consumer Resin","Adoption Index — the North Star metric",
  "T-minus — the launch countdown (T-90 → T+14)","Blueprint — the reusable geography pack",
]));

body.push(rule());
body.push(P([["End of BRD — DRS Marketing Agent v1.0. ",true],["This document specifies the architecture, all stages, all workflows (including the full DMS), all gates and branch logic, governance, metrics, readiness and reusable schemas required to build the DRS Marketing Agent.",false]]));

// ============================================================
// DOCUMENT
// ============================================================
const doc = new Document({
  creator: "Recykal — Director Marketing",
  title: "BRD — DRS Marketing Agent",
  numbering: { config: numConfigs },
  styles: {
    default: { document: { run: { font:"Arial", size:21 } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:30, bold:true, color:C.blue, font:"Arial" },
        paragraph:{ spacing:{ before:300, after:160 }, outlineLevel:0 } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:25, bold:true, color:C.lblue, font:"Arial" },
        paragraph:{ spacing:{ before:200, after:100 }, outlineLevel:1 } },
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:21, bold:true, color:"333333", font:"Arial" },
        paragraph:{ spacing:{ before:120, after:60 }, outlineLevel:2 } },
    ]
  },
  sections: [{
    properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1320, right:1320, bottom:1320, left:1320 } } },
    headers:{ default: new Header({ children:[ new Paragraph({ alignment:AlignmentType.RIGHT,
      border:{ bottom:{ style:BorderStyle.SINGLE, size:4, color:"DDDDDD", space:2 } },
      children:[ new TextRun({ text:"BRD — DRS Marketing Agent", size:16, color:"999999" }) ] }) ] }) },
    footers:{ default: new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER,
      children:[ new TextRun({ text:"Recykal · RMOS / Project MARS · Confidential    —    Page ", size:16, color:"999999" }),
                 new TextRun({ children:[PageNumber.CURRENT], size:16, color:"999999" }) ] }) ] }) },
    children: body,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("BRD-DRS-Marketing-Agent.docx", buf);
  console.log("WROTE BRD-DRS-Marketing-Agent.docx  (" + buf.length + " bytes)");
});
