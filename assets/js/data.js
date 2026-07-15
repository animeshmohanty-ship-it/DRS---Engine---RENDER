/* ============================================================
   DIIP — DRS Implementation Intelligence Platform
   Product Vision Portal — content / data model
   ------------------------------------------------------------
   This is a VISION PORTAL. Numbers shown are illustrative
   targets and sample values used to convey how the platform
   measures success — not live production data.
   ============================================================ */

const PLATFORM = {
  name: "DIIP",
  full: "DRS Implementation Intelligence Platform",
  tagline: "The operating system for launching Deposit Return Schemes — from Goa to any geography.",
};

/* ---------- LEFT NAVIGATION ---------- */
const NAV = [
  { group: "PLATFORM", items: [
    { id: "vision",        name: "Platform Vision",        ic: "◎" },
    { id: "architecture",  name: "Platform Architecture",  ic: "▦" },
    { id: "portfolio",     name: "Project Portfolio",      ic: "▤" },
    { id: "project-config",name: "Project Configuration",  ic: "⚙" },
    { id: "geography-engine",name: "Geography Engine",     ic: "◍" },
    { id: "exec-dashboard",name: "Executive Dashboard",    ic: "▣" },
  ]},
  { group: "IMPLEMENTATION", items: [
    { id: "market-intel",   name: "Market Intelligence",    ic: "🛰" },
    { id: "market-assess",  name: "Market Assessment",      ic: "🧭" },
    { id: "government",     name: "Government Engagement",  ic: "🏛" },
    { id: "stakeholder-intel",name: "Stakeholder Intelligence", ic: "🕸" },
    { id: "resistance",     name: "Resistance & Risk",      ic: "🛡", badge:"KEY" },
    { id: "narrative",      name: "Narrative & Alignment",  ic: "🖋", badge:"NEW" },
    { id: "marketing-system",name: "DRS Marketing System",  ic: "📣" },
    { id: "gtm",            name: "Go-To-Market",           ic: "🚀" },
    { id: "consumer",       name: "Consumer Engagement",    ic: "👥" },
    { id: "acquisition",    name: "Acquisition",            ic: "🤝", badge:"DEEP" },
    { id: "partnerships",   name: "Partnership Management", ic: "🔗" },
    { id: "communication",  name: "Communication Center",   ic: "✉" },
    { id: "btl",            name: "BTL Command Center",     ic: "🎪" },
    { id: "infrastructure", name: "Infrastructure Planning",ic: "🏗" },
    { id: "deployment",     name: "Deployment Tracking",    ic: "📍" },
    { id: "operations",     name: "Operations Coordination",ic: "♻" },
    { id: "launch-ready",   name: "Launch Readiness",       ic: "✅", badge:"GATE" },
    { id: "launch-mgmt",    name: "Launch Management",      ic: "🎬" },
    { id: "reputation",     name: "Reputation Management",  ic: "📡", badge:"NEW" },
    { id: "post-launch",    name: "Post-Launch Optimization",ic: "📈" },
  ]},
  { group: "PERFORMANCE", items: [
    { id: "kras",       name: "KRAs",        ic: "◆" },
    { id: "kpis",       name: "KPIs",        ic: "◇" },
    { id: "metrics",    name: "Metrics",     ic: "∿" },
    { id: "scorecards", name: "Scorecards",  ic: "▥" },
    { id: "analytics",  name: "Analytics",   ic: "📊", badge:"LIVE" },
    { id: "reports",    name: "Reports",     ic: "🗎" },
  ]},
  { group: "KNOWLEDGE", items: [
    { id: "knowledge-hub", name: "Knowledge Hub",   ic: "📚" },
    { id: "sop",           name: "SOP Library",     ic: "📋" },
    { id: "templates",     name: "Templates",       ic: "🗂" },
    { id: "case-studies",  name: "Case Studies",    ic: "📁" },
    { id: "lessons",       name: "Lessons Learned", ic: "💡" },
    { id: "best-practices",name: "Best Practices",  ic: "⭐" },
  ]},
  { group: "AI", items: [
    { id: "ai-assistant",  name: "AI Assistant",        ic: "✦", badge:"AI" },
    { id: "ai-search",     name: "AI Knowledge Search", ic: "✦", badge:"AI" },
    { id: "ai-content",    name: "AI Content Generator",ic: "✦", badge:"AI" },
    { id: "ai-meeting",    name: "AI Meeting Assistant",ic: "✦", badge:"AI" },
    { id: "ai-report",     name: "AI Report Generator", ic: "✦", badge:"AI" },
    { id: "ai-analytics",  name: "AI Analytics Assistant",ic:"✦", badge:"AI" },
  ]},
  { group: "—", items: [
    { id: "roadmap",   name: "Product Roadmap",  ic: "🗺" },
    { id: "how",       name: "How DIIP Works",   ic: "⮑", badge:"FLOW" },
  ]},
];

/* ---------- DEFAULT FRAMEWORK GENERATOR ---------- */
/* Every module renders the same 20 sections. This builder
   produces sensible, domain-aware defaults so a lightly-authored
   module still reads as professionally complete; flagship
   modules override the fields that matter most. */
function M(cfg) {
  const name = cfg.name;
  const d = {
    id: cfg.id,
    name,
    ic: cfg.ic || "◇",
    group: cfg.group || "Implementation",
    tagline: cfg.tagline || "",
    overview: cfg.overview || "",
    objectives: cfg.objectives || [],
    why: cfg.why || "",
    executionFlow: cfg.executionFlow || [],
    activities: cfg.activities || [],
    deliverables: cfg.deliverables || [],
    owners: cfg.owners || [],
    dependencies: cfg.dependencies || [],
    workflow: cfg.workflow || [],
    kras: cfg.kras || [],
    kpis: cfg.kpis || [],
    metrics: cfg.metrics || [],
    calculations: cfg.calculations || [],
    dashboard: cfg.dashboard || [],
    barviz: cfg.barviz || null,
    reports: cfg.reports || [],
    ai: cfg.ai || [],
    knowledge: cfg.knowledge || [],
    future: cfg.future || [],
    custom: cfg.custom || null,        // id of a special renderer
    hideFramework: cfg.hideFramework || false,
  };
  return d;
}

/* ============================================================
   MODULE CONTENT
   ============================================================ */
const MODULES = {};

/* ---------------- PLATFORM: VISION (custom hero page) ---------------- */
MODULES["vision"] = M({
  id:"vision", name:"Platform Vision", ic:"◎", group:"Platform",
  custom:"vision", hideFramework:true,
});

/* ---------------- PLATFORM: ARCHITECTURE ---------------- */
MODULES["architecture"] = M({
  id:"architecture", name:"Platform Architecture", ic:"▦", group:"Platform",
  custom:"architecture", hideFramework:true,
});

/* ---------------- PLATFORM: PORTFOLIO ---------------- */
MODULES["portfolio"] = M({
  id:"portfolio", name:"Project Portfolio", ic:"▤", group:"Platform",
  custom:"portfolio", hideFramework:true,
});

/* ---------------- PLATFORM: PROJECT CONFIG ---------------- */
MODULES["project-config"] = M({
  id:"project-config", name:"Project Configuration", ic:"⚙", group:"Platform",
  tagline:"Define the implementation model, scope, geography and operating parameters once — every module inherits the context.",
  overview:"Project Configuration is the control panel for a single DRS implementation. When a new opportunity becomes a project, the Director chooses an <strong>implementation model</strong> (Government-led, PIBO-led, Hybrid, or Pilot), sets the geographic scope, deposit values, target dates and partner roles. Those choices cascade automatically — the Geography Engine loads the right templates, KPIs adopt the right targets, and every downstream module starts pre-populated.",
  why:"Without a single source of configuration, every team re-enters assumptions and the numbers stop reconciling. Configuration once, inherited everywhere, is what lets the same platform run Goa and a future state without re-building.",
  objectives:[
    {t:"Single source of truth", d:"One place defines model, scope, deposit value and timeline for the whole project."},
    {t:"Model-driven defaults", d:"Choosing an implementation model auto-loads the right workflows, owners and KPI targets."},
    {t:"Inherited context", d:"Every module reads project config so teams never re-key the same parameters."},
    {t:"Governance & versioning", d:"Configuration changes are logged with owner, date and rationale."},
  ],
  executionFlow:["Opportunity → Project","Select Implementation Model","Set Geography Scope","Define Deposit & Economics","Assign Owners & Roles","Lock Baseline","Cascade to Modules"],
  activities:["Capture project charter & sponsor","Select model & lifecycle template","Configure deposit value, handling fee, redemption rules","Define phase gates & target launch date","Map RACI across modules","Set data & integration parameters"],
  deliverables:["Project Charter","Implementation Model Selection","Configuration Baseline (locked)","RACI Matrix","Phase-Gate Calendar"],
  owners:[
    {r:"Implementation Director", x:"Owns model selection & baseline sign-off"},
    {r:"Program Manager", x:"Maintains configuration & versioning"},
    {r:"Geography Lead", x:"Validates scope & template fit"},
  ],
  dependencies:["Project Portfolio (project must exist)","Geography Engine (scope templates)","KPIs (target library)"],
  workflow:[
    {t:"Draft", d:"Configuration created, parameters being entered."},
    {t:"Review", d:"Director & leads validate model fit and economics."},
    {t:"Baselined", d:"Locked version cascades to all modules."},
    {t:"Change-controlled", d:"Further edits require logged approval."},
  ],
  kras:["Configuration completeness","Time-to-baseline","Change-control discipline"],
  kpis:[
    {n:"Configuration completeness", t:"100% mandatory fields", f:"completed_fields / mandatory_fields"},
    {n:"Time to baseline", t:"≤ 5 working days", f:"baseline_date − project_created_date"},
    {n:"Unapproved changes", t:"0", f:"count(changes without approval)"},
  ],
  metrics:["Fields completed","Days in draft","Config versions","Modules inheriting baseline"],
  calculations:[
    {n:"Readiness to start", f:"completeness% × gate_signoffs%", d:"How ready the project is to begin Market Intelligence."},
  ],
  dashboard:[
    {l:"Active Model", v:"Hybrid", t:"Govt + PIBO", trend:"flat"},
    {l:"Config Completeness", v:"96%", t:"+8% this week", trend:"up"},
    {l:"Days to Baseline", v:"4", t:"target ≤5", trend:"up"},
    {l:"Modules Inheriting", v:"24", t:"all cascaded", trend:"flat"},
  ],
  reports:["Project Charter PDF","Configuration Baseline Report","Change Log","RACI Export"],
  ai:["Recommend an implementation model from market & stakeholder signals","Auto-draft the project charter from intake notes","Flag inconsistent economics (deposit vs handling fee)"],
  knowledge:["Implementation Model Playbooks","Goa Configuration as reference","Deposit economics templates"],
  future:[
    {ph:"Next", t:"Scenario compare — model A vs B side-by-side before locking."},
    {ph:"Planned", t:"Economic simulator for deposit value sensitivity."},
    {ph:"Vision", t:"AI proposes full configuration from a one-line opportunity brief."},
  ],
});

/* ---------------- PLATFORM: GEOGRAPHY ENGINE ---------------- */
MODULES["geography-engine"] = M({
  id:"geography-engine", name:"Geography Engine", ic:"◍", group:"Platform",
  tagline:"Reusable geography templates that make the same playbook scale from a Goa taluka to any state, nation or international market.",
  overview:"The Geography Engine stores DRS implementation as <strong>reusable geographic templates</strong>. A template captures the administrative hierarchy (Country → State → District → Taluka → Panchayat → Village → Cluster → Outlet), the stakeholder mix, density assumptions and channel norms for a region type. When a project loads a template, every module is seeded with the right structure — so launching the next geography is configuration, not reinvention.",
  why:"DRS programs fail to scale because each new region is rebuilt from zero. By turning geography into a template that carries structure, stakeholders and benchmarks, DIIP converts a one-off Goa launch into a repeatable blueprint.",
  objectives:[
    {t:"Hierarchy as data", d:"Every level from nation to outlet is a navigable, roll-up-able node."},
    {t:"Template reuse", d:"Goa becomes a template the next geography inherits and tunes."},
    {t:"Density & benchmark library", d:"Outlet density, return rates and channel mix per region type."},
    {t:"Roll-up everywhere", d:"Any metric aggregates cleanly up the hierarchy."},
  ],
  executionFlow:["Define Hierarchy","Map Administrative Units","Attach Stakeholder Density","Set Regional Benchmarks","Publish Template","Load into Project"],
  activities:["Build/import administrative boundaries","Estimate outlet & population density per level","Encode channel mix (retail, HORECA, institutional)","Define benchmark return & redemption rates","Version & publish templates"],
  deliverables:["Geography Template","Hierarchy Map","Density & Benchmark Sheet","Roll-up Schema"],
  owners:[
    {r:"Geography Lead", x:"Owns templates & benchmarks"},
    {r:"Data Analyst", x:"Maintains density & boundary data"},
  ],
  dependencies:["Census / administrative data","Project Configuration (scope selection)","Analytics (roll-up consumption)"],
  workflow:[
    {t:"Modeled", d:"Hierarchy & units defined."},
    {t:"Benchmarked", d:"Density and rate assumptions attached."},
    {t:"Published", d:"Available to load into any project."},
    {t:"Tuned", d:"Project-specific overrides captured back as learning."},
  ],
  kras:["Template coverage","Benchmark accuracy","Reuse rate"],
  kpis:[
    {n:"Geographies templated", t:"Goa + 2 ready", f:"count(published_templates)"},
    {n:"Benchmark accuracy", t:"±10% vs actuals", f:"abs(benchmark − actual)/actual"},
    {n:"Reuse on new project", t:"≥ 80% inherited", f:"inherited_fields / total_fields"},
  ],
  metrics:["Nodes mapped","Levels deep","Templates published","Overrides per project"],
  calculations:[
    {n:"Outlet universe", f:"Σ(outlet_density × units) per level", d:"Total addressable outlets across the hierarchy."},
  ],
  dashboard:[
    {l:"Hierarchy Levels", v:"8", t:"Nation→Outlet", trend:"flat"},
    {l:"Goa Nodes Mapped", v:"4,120", t:"talukas→outlets", trend:"up"},
    {l:"Templates Ready", v:"3", t:"Goa + 2 draft", trend:"up"},
    {l:"Benchmark Accuracy", v:"92%", t:"vs actuals", trend:"up"},
  ],
  reports:["Geography Template Spec","Outlet Universe by Level","Benchmark vs Actual"],
  ai:["Estimate outlet density for an unmapped region from comparable templates","Suggest the closest matching template for a new geography","Explain roll-up discrepancies between levels"],
  knowledge:["Goa hierarchy reference","Region-type benchmark library","International DRS geography notes"],
  future:[
    {ph:"Next", t:"Map-based picker for scope selection."},
    {ph:"Planned", t:"Auto-import boundaries from open administrative datasets."},
    {ph:"Vision", t:"Predictive density modeling for never-launched geographies."},
  ],
});

/* ---------------- PLATFORM: EXECUTIVE DASHBOARD ---------------- */
MODULES["exec-dashboard"] = M({
  id:"exec-dashboard", name:"Executive Dashboard", ic:"▣", group:"Platform",
  custom:"exec", hideFramework:true,
});

/* ============================================================
   IMPLEMENTATION MODULES
   ============================================================ */

MODULES["market-intel"] = M({
  id:"market-intel", name:"Market Intelligence", ic:"🛰", group:"Implementation",
  tagline:"Continuously gather the external signals — policy, packaging volumes, competitor and consumer behaviour — that shape a DRS launch.",
  overview:"Market Intelligence is the always-on sensing layer. It tracks regulatory movement (EPR, plastic bans, state notifications), beverage packaging volumes by material, competitor and comparable-scheme activity, and consumer sentiment. It feeds Market Assessment with the evidence base and continuously updates risk signals for the Resistance module.",
  why:"A DRS launch lives or dies on timing and framing relative to policy and market readiness. Intelligence gathered ad-hoc gets lost; captured systematically it compounds into a defensible launch case.",
  objectives:[
    {t:"Sense policy early", d:"Detect regulatory shifts before they become surprises."},
    {t:"Quantify the opportunity", d:"Packaging volumes, material split, addressable deposit base."},
    {t:"Watch the field", d:"Competitor, comparable-scheme and consumer signals."},
    {t:"Feed the funnel", d:"Hand a clean evidence base to Market Assessment."},
  ],
  executionFlow:["Define Signals","Collect Sources","Validate & Tag","Synthesize","Brief Stakeholders","Feed Assessment"],
  activities:["Regulatory & policy scanning","Packaging volume & material analysis","Competitor / comparable-scheme tracking","Consumer sentiment monitoring","Source validation & tagging"],
  deliverables:["Market Intelligence Brief","Regulatory Tracker","Packaging Volume Model","Signal Log"],
  owners:[
    {r:"Market Intelligence Lead", x:"Owns signal framework & briefs"},
    {r:"Policy Analyst", x:"Regulatory tracking"},
    {r:"Data Analyst", x:"Volume & material modeling"},
  ],
  dependencies:["Geography Engine (scope)","Government Engagement (policy validation)","Feeds → Market Assessment, Resistance"],
  workflow:[
    {t:"Scanning", d:"Sources monitored continuously."},
    {t:"Validated", d:"Signals confirmed and tagged by theme."},
    {t:"Synthesized", d:"Patterns turned into a brief."},
    {t:"Actioned", d:"Insights routed to assessment & risk."},
  ],
  kras:["Signal coverage","Insight timeliness","Forecast accuracy"],
  kpis:[
    {n:"Signal coverage", t:"≥ 95% of priority sources", f:"sources_monitored / priority_sources"},
    {n:"Insight latency", t:"≤ 48 hrs", f:"avg(brief_time − signal_time)"},
    {n:"Volume forecast accuracy", t:"±12%", f:"abs(forecast − actual)/actual"},
  ],
  metrics:["Signals logged","Sources monitored","Briefs issued","Regulatory events tracked"],
  calculations:[
    {n:"Addressable deposit base", f:"annual_containers × deposit_value", d:"Total deposit value flowing through the region."},
    {n:"Material recoverable", f:"containers × capture_rate × material_yield", d:"Recyclable tonnage potential."},
  ],
  dashboard:[
    {l:"Priority Signals", v:"42", t:"7 new this week", trend:"up"},
    {l:"Regulatory Watch", v:"6", t:"2 high impact", trend:"flat"},
    {l:"Addressable Base", v:"₹148 Cr", t:"deposit value/yr", trend:"up"},
    {l:"Forecast Accuracy", v:"89%", t:"vs actuals", trend:"up"},
  ],
  barviz:{title:"Container volume by material (M units/yr)", bars:[["PET",78],["Glass",54],["Aluminium",31],["HDPE",18],["Other",9]]},
  reports:["Market Intelligence Brief","Regulatory Impact Tracker","Packaging Volume Model","Opportunity Sizing"],
  ai:["Summarize new regulatory notifications into impact briefs","Cluster consumer sentiment into themes","Draft an opportunity-sizing narrative from the volume model"],
  knowledge:["Comparable DRS schemes (global)","EPR & plastic policy library","Packaging data sources"],
  future:[
    {ph:"Next", t:"Automated regulatory feed ingestion."},
    {ph:"Planned", t:"Live sentiment dashboard from social & news."},
    {ph:"Vision", t:"Predictive 'launch window' recommendation engine."},
  ],
});

MODULES["market-assess"] = M({
  id:"market-assess", name:"Market Assessment", ic:"🧭", group:"Implementation",
  tagline:"Turn raw intelligence into a go / no-go readiness verdict for a specific geography and model.",
  overview:"Market Assessment converts intelligence into a structured readiness verdict. It scores the market across regulatory readiness, infrastructure feasibility, stakeholder receptivity, economic viability and consumer propensity — producing a single Market Readiness Index that informs the Director's go / phased / hold decision.",
  why:"Intelligence without a decision framework leads to analysis paralysis. A scored, comparable assessment lets leadership commit with confidence and sequence geographies rationally.",
  objectives:[
    {t:"Score readiness", d:"A transparent index across five readiness dimensions."},
    {t:"Make it comparable", d:"Same scoring lets geographies be ranked and sequenced."},
    {t:"Surface gaps", d:"Show exactly which dimension blocks readiness."},
    {t:"Support the decision", d:"A clear go / phased / hold recommendation."},
  ],
  executionFlow:["Ingest Intelligence","Score Dimensions","Weight & Aggregate","Identify Gaps","Recommend Decision","Brief Leadership"],
  activities:["Regulatory readiness scoring","Infrastructure feasibility study","Stakeholder receptivity scan","Economic viability modeling","Consumer propensity analysis"],
  deliverables:["Market Readiness Index","Gap Analysis","Go/No-Go Recommendation","Assessment Deck"],
  owners:[
    {r:"Strategy Lead", x:"Owns the assessment & recommendation"},
    {r:"Finance Analyst", x:"Economic viability"},
    {r:"Geography Lead", x:"Infrastructure feasibility"},
  ],
  dependencies:["Market Intelligence (evidence)","Stakeholder Intelligence (receptivity)","Infrastructure Planning (feasibility)"],
  workflow:[
    {t:"Scoped", d:"Geography & model defined."},
    {t:"Scored", d:"All five dimensions assessed."},
    {t:"Reviewed", d:"Index validated with leads."},
    {t:"Decided", d:"Go / phased / hold recorded."},
  ],
  kras:["Assessment rigor","Decision clarity","Predictive validity"],
  kpis:[
    {n:"Market Readiness Index", t:"≥ 70 to launch", f:"Σ(dimension_score × weight)"},
    {n:"Dimensions scored", t:"5 / 5", f:"scored / 5"},
    {n:"Decision turnaround", t:"≤ 2 weeks", f:"decision_date − assessment_start"},
  ],
  metrics:["Index score","Dimension scores","Gaps identified","Geographies ranked"],
  calculations:[
    {n:"Market Readiness Index (MRI)", f:"(Reg×.25)+(Infra×.20)+(Stake×.20)+(Econ×.20)+(Cons×.15)", d:"Weighted composite, 0–100."},
  ],
  dashboard:[
    {l:"Readiness Index", v:"74", t:"GO threshold 70", trend:"up"},
    {l:"Weakest Dimension", v:"Infra", t:"score 61", trend:"flat"},
    {l:"Economic Viability", v:"81", t:"strong", trend:"up"},
    {l:"Recommendation", v:"GO", t:"phased rollout", trend:"up"},
  ],
  barviz:{title:"Readiness by dimension (0–100)", bars:[["Regulatory",78],["Infra",61],["Stakeholder",72],["Economic",81],["Consumer",69]]},
  reports:["Market Readiness Report","Dimension Scorecard","Go/No-Go Brief"],
  ai:["Explain why a dimension scored low and what would move it","Compare readiness across candidate geographies","Draft the leadership recommendation memo"],
  knowledge:["Readiness scoring rubric","Goa baseline assessment","Comparable-market benchmarks"],
  future:[
    {ph:"Next", t:"Sensitivity sliders on dimension weights."},
    {ph:"Planned", t:"Auto-pull scores from upstream modules."},
    {ph:"Vision", t:"Continuous readiness tracking, not point-in-time."},
  ],
});

MODULES["government"] = M({
  id:"government", name:"Government Engagement", ic:"🏛", group:"Implementation",
  tagline:"Secure the mandate, approvals and ongoing alignment of government bodies that make a DRS legally and operationally possible.",
  overview:"Government Engagement manages the relationships and approvals across pollution control boards, urban development, panchayati raj, tourism, and municipal bodies. It tracks every authority, the approval each one owns, meeting history, commitments made, and the status of notifications or sanctions required for launch.",
  why:"A DRS cannot launch without policy backing and operating permissions. Government relationships are long, multi-body and memory-dependent — DIIP makes them institutional rather than living in one person's inbox.",
  objectives:[
    {t:"Map the authorities", d:"Every body and the specific approval it controls."},
    {t:"Drive approvals", d:"Track each sanction from request to issuance."},
    {t:"Institutional memory", d:"Meetings, commitments and contacts never lost to turnover."},
    {t:"Sustain alignment", d:"Keep officials engaged through and beyond launch."},
  ],
  executionFlow:["Map Authorities","Identify Approvals Needed","Engage & Brief","Track Commitments","Secure Notifications","Sustain Alignment"],
  activities:["Authority & contact mapping","Briefing notes & policy memos","Approval & notification tracking","Meeting scheduling & minutes","Commitment follow-through"],
  deliverables:["Authority Map","Approval Tracker","Briefing Notes","MoU / Notification copies","Engagement Log"],
  owners:[
    {r:"Government Affairs Lead", x:"Owns relationships & approvals"},
    {r:"Policy Analyst", x:"Briefing notes & memos"},
    {r:"Implementation Director", x:"Senior-level engagement"},
  ],
  dependencies:["Market Intelligence (policy context)","Resistance (political risk)","Launch Readiness (approvals are gates)"],
  workflow:[
    {t:"Identified", d:"Authority & required approval logged."},
    {t:"Engaged", d:"Briefed; meeting cadence established."},
    {t:"Committed", d:"Verbal / in-principle support secured."},
    {t:"Sanctioned", d:"Formal approval / notification issued."},
  ],
  kras:["Approval velocity","Relationship health","Commitment conversion"],
  kpis:[
    {n:"Approvals secured", t:"100% of launch-critical", f:"approvals_issued / approvals_required"},
    {n:"Approval cycle time", t:"≤ 45 days avg", f:"avg(issued_date − request_date)"},
    {n:"Commitment conversion", t:"≥ 80%", f:"commitments_honored / commitments_made"},
  ],
  metrics:["Authorities mapped","Meetings held","Approvals pending","Commitments open"],
  calculations:[
    {n:"Approval readiness", f:"launch_critical_approved / launch_critical_total", d:"Share of must-have approvals secured."},
  ],
  dashboard:[
    {l:"Authorities Mapped", v:"18", t:"6 critical", trend:"flat"},
    {l:"Approvals Secured", v:"11/14", t:"79%", trend:"up"},
    {l:"Avg Cycle Time", v:"38d", t:"target ≤45", trend:"up"},
    {l:"Open Commitments", v:"5", t:"2 overdue", trend:"down"},
  ],
  reports:["Approval Status Report","Authority Engagement Log","Commitment Tracker","Briefing Note Pack"],
  ai:["Summarize meeting minutes into action items & commitments","Draft briefing notes tailored to each authority","Track approval status and flag stalls","Search policy & precedent for talking points"],
  knowledge:["Goa government engagement playbook","Approval precedent library","Authority contact directory"],
  future:[
    {ph:"Next", t:"Approval dependency graph (what unblocks what)."},
    {ph:"Planned", t:"Automated reminder cadence on commitments."},
    {ph:"Vision", t:"Sentiment tracking across official relationships."},
  ],
});

MODULES["stakeholder-intel"] = M({
  id:"stakeholder-intel", name:"Stakeholder Intelligence", ic:"🕸", group:"Implementation",
  tagline:"A living map of everyone who can accelerate or block the scheme — their influence, interest, stance and the strategy for each.",
  overview:"Stakeholder Intelligence maintains the relationship graph behind the whole program: government bodies, PIBOs, brands, retailers, HORECA, institutions, collectors, recyclers, NGOs and media. Each stakeholder carries influence, interest, current stance (support ↔ resistance) and an engagement strategy — and this map feeds both Acquisition and Resistance.",
  why:"DRS is a coalition program. Knowing who matters, how they lean, and what moves them is the difference between a launch with momentum and one fighting friction at every step.",
  objectives:[
    {t:"Map influence & interest", d:"Classic power-interest grid, kept current."},
    {t:"Track stance over time", d:"Support and resistance scored and trended."},
    {t:"Strategy per stakeholder", d:"Engage, partner, neutralize or monitor."},
    {t:"Feed Acquisition & Resistance", d:"One graph powers conversion and risk."},
  ],
  executionFlow:["Identify","Classify (Power/Interest)","Score Stance","Assign Strategy","Engage","Re-score"],
  activities:["Stakeholder identification & mapping","Influence / interest classification","Stance & sentiment scoring","Engagement strategy definition","Relationship logging"],
  deliverables:["Stakeholder Map","Power-Interest Grid","Stance Tracker","Engagement Strategy Sheet"],
  owners:[
    {r:"Stakeholder Lead", x:"Owns the map & strategies"},
    {r:"Module Owners", x:"Maintain stance for their stakeholders"},
  ],
  dependencies:["Feeds → Acquisition, Resistance, Government","Communication (messaging by segment)"],
  workflow:[
    {t:"Mapped", d:"Stakeholder identified & classified."},
    {t:"Scored", d:"Influence, interest & stance quantified."},
    {t:"Strategized", d:"Engagement approach assigned."},
    {t:"Active", d:"Engaged and re-scored on cadence."},
  ],
  kras:["Map completeness","Stance accuracy","Coalition strength"],
  kpis:[
    {n:"Stakeholders mapped", t:"100% of priority", f:"mapped / priority_universe"},
    {n:"Net support index", t:"≥ +40", f:"avg(support_score − resistance_score)"},
    {n:"Strategy coverage", t:"100% high-influence", f:"with_strategy / high_influence"},
  ],
  metrics:["Stakeholders mapped","High-influence count","Avg support","Avg resistance"],
  calculations:[
    {n:"Coalition strength", f:"Σ(influence × support) − Σ(influence × resistance)", d:"Influence-weighted net backing."},
  ],
  dashboard:[
    {l:"Stakeholders Mapped", v:"214", t:"+18 this month", trend:"up"},
    {l:"Net Support Index", v:"+46", t:"target ≥+40", trend:"up"},
    {l:"High-Influence Allies", v:"31", t:"of 44", trend:"up"},
    {l:"Active Resistors", v:"9", t:"see Resistance", trend:"down"},
  ],
  reports:["Stakeholder Map Export","Power-Interest Grid","Stance Trend Report"],
  ai:["Prioritize which stakeholders to engage next for maximum coalition gain","Draft tailored engagement strategies","Detect stance shifts from meeting & comms logs"],
  knowledge:["Stakeholder mapping methodology","Goa stakeholder registry","Coalition-building playbook"],
  future:[
    {ph:"Next", t:"Interactive power-interest bubble chart."},
    {ph:"Planned", t:"Relationship network graph visualization."},
    {ph:"Vision", t:"Influence-path finder: who to engage to move whom."},
  ],
});

MODULES["resistance"] = M({
  id:"resistance", name:"Resistance & Risk Intelligence", ic:"🛡", group:"Implementation",
  tagline:"Anticipate, log and neutralize every source of opposition — government, retail, hotels, consumers, media, political, operational and financial.",
  overview:"Resistance & Risk Intelligence is one of DIIP's strongest pages. It treats opposition as a managed pipeline: every resistance is captured with its source, root cause, impact, mitigation, owner, timeline and resolution. Categories span government, retail, hotels, consumers, media, political, operational and financial. The module turns scattered pushback into a visible, owned, trackable risk register.",
  why:"DRS programs are rarely defeated by logistics — they're defeated by unmanaged resistance that compounds quietly. Making opposition explicit, owned and time-bound is how a launch survives contact with reality.",
  objectives:[
    {t:"Surface resistance early", d:"Capture pushback before it hardens into blockage."},
    {t:"Diagnose root cause", d:"Treat the cause, not the symptom."},
    {t:"Own every mitigation", d:"Each risk has an owner, plan and deadline."},
    {t:"Track to resolution", d:"Close the loop and record the outcome."},
  ],
  executionFlow:["Identify Resistance","Categorize Source","Root-Cause Analysis","Assess Impact","Plan Mitigation","Assign & Track","Resolve & Record"],
  activities:["Resistance identification across 8 categories","Root-cause analysis","Impact & likelihood scoring","Mitigation planning","Owner assignment & tracking","Resolution recording"],
  deliverables:["Risk & Resistance Register","Mitigation Plans","Root-Cause Logs","Resolution Outcomes"],
  owners:[
    {r:"Risk Lead", x:"Owns the register & cadence"},
    {r:"Module Owners", x:"Own mitigations in their domain"},
    {r:"Implementation Director", x:"Escalation & high-impact calls"},
  ],
  dependencies:["Stakeholder Intelligence (resistor stance)","Government, Acquisition, Operations (source domains)","Launch Readiness (open high-impact risks are gates)"],
  workflow:[
    {t:"Logged", d:"Resistance captured & categorized."},
    {t:"Analyzed", d:"Root cause & impact assessed."},
    {t:"Mitigating", d:"Owner executing the plan."},
    {t:"Resolved", d:"Closed with outcome recorded."},
  ],
  kras:["Risk visibility","Mitigation effectiveness","Time-to-resolution"],
  kpis:[
    {n:"Open high-impact risks", t:"0 at launch", f:"count(impact=high AND status≠resolved)"},
    {n:"Avg time to resolve", t:"≤ 21 days", f:"avg(resolved_date − logged_date)"},
    {n:"Mitigation success rate", t:"≥ 85%", f:"resolved_favorably / total_resolved"},
  ],
  metrics:["Risks logged","Open vs resolved","By category","Avg age"],
  calculations:[
    {n:"Risk exposure score", f:"Σ(impact × likelihood) of open risks", d:"Aggregate live exposure across the register."},
    {n:"Resolution velocity", f:"resolved_this_period / opened_this_period", d:">1 means the register is shrinking."},
  ],
  dashboard:[
    {l:"Open Risks", v:"23", t:"4 high impact", trend:"down"},
    {l:"Exposure Score", v:"118", t:"−22 this month", trend:"up"},
    {l:"Avg Time to Resolve", v:"17d", t:"target ≤21", trend:"up"},
    {l:"Mitigation Success", v:"88%", t:"favorable", trend:"up"},
  ],
  barviz:{title:"Open resistance by category", bars:[["Retail",7],["Govt",4],["Consumer",4],["Hotels",3],["Political",2],["Operational",2],["Financial",1]]},
  reports:["Risk & Resistance Register","High-Impact Risk Brief","Mitigation Status Report","Resolution Outcomes Log"],
  ai:["Suggest mitigations from how similar resistance was resolved before","Cluster incoming complaints into root-cause themes","Draft escalation briefs for high-impact risks","Predict which risks are likely to escalate"],
  knowledge:["Resistance playbook by category","Goa resolution case library","Objection-handling scripts"],
  custom:"resistance",
  future:[
    {ph:"Next", t:"Risk heatmap (impact × likelihood) by category."},
    {ph:"Planned", t:"Early-warning signals from comms & field feedback."},
    {ph:"Vision", t:"Predictive resistance modeling per stakeholder segment."},
  ],
});

MODULES["narrative"] = M({
  id:"narrative", name:"Narrative & Alignment", ic:"🖋", group:"Implementation",
  tagline:"Generate the core story, persona messages, and FAQ kits before going into execution.",
  overview:"Narrative & Alignment ensures every stakeholder repeats the same evidence-backed story. It explicitly drafts the Narrative House, Persona Messaging Matrix, and FAQ kits. Execution teams cannot proceed without an aligned script.",
  why:"Execution fails when teams tell different stories. The Narrative House acts as the single source of truth for all downstream communications.",
  objectives:[
    {t:"Draft the Core Story", d:"Define the central positioning and environmental/economic angle."},
    {t:"Tailor by Persona", d:"Create tailored messages addressing specific stakeholder resistance."},
    {t:"Anticipate Questions", d:"Build comprehensive FAQ kits for field teams."},
  ],
  executionFlow:["Synthesize Evidence","Draft Core Story","Build Persona Matrix","Develop FAQ Kit","Review & Align","Lock Narrative"],
  activities:["Drafting Narrative House","Building Persona Matrix","Developing FAQ Kits","Running alignment workshops"],
  deliverables:["Narrative House v1","FAQ Kit","Stakeholder Briefing Kit"],
  owners:[
    {r:"Content Lead", x:"Owns narrative drafting & FAQs"},
    {r:"Marketing Head", x:"Approves core story"},
  ],
  dependencies:["Market Intelligence (evidence)","Stakeholder Intelligence (personas)","Resistance (objections)"],
  workflow:[
    {t:"Drafted", d:"Core story and FAQs generated."},
    {t:"Aligned", d:"Workshopped with stakeholders."},
    {t:"Locked", d:"Approved for field execution."},
  ],
  kras:["Narrative consistency","Localization completeness","Persona coverage"],
  kpis:[
    {n:"Narrative Readiness %", t:"100% before execution", f:"completed_assets / required_assets"},
  ],
  metrics:["Personas mapped","FAQs drafted","Workshops held"],
  dashboard:[
    {l:"Narrative Readiness", v:"100%", t:"locked", trend:"flat"},
    {l:"Personas Covered", v:"8/8", t:"100%", trend:"up"},
    {l:"FAQs Generated", v:"42", t:"across 3 languages", trend:"up"},
  ],
  reports:["Narrative House","Persona Matrix Export","FAQ Document"],
  ai:["Auto-draft the Narrative House from Market Assessment data","Generate localized FAQs based on common resistance"],
});

MODULES["marketing-system"] = M({
  id:"marketing-system", name:"DRS Marketing System", ic:"📣", group:"Implementation",
  tagline:"The orchestration layer that aligns brand, messaging and campaigns across every audience and channel.",
  overview:"The DRS Marketing System is the umbrella that aligns positioning, brand, messaging architecture and campaign orchestration across audiences — government, trade, consumers, media. It sets the narrative once and ensures GTM, Consumer Engagement, Communication and BTL all execute a consistent story.",
  why:"Fragmented messaging confuses every audience at once. A single marketing system keeps the deposit-return story coherent from a minister's briefing to a consumer poster.",
  objectives:[
    {t:"Own the narrative", d:"One positioning & messaging architecture for all audiences."},
    {t:"Align the channels", d:"GTM, Consumer, Comms & BTL execute the same story."},
    {t:"Localize at scale", d:"Adapt the core message per geography & language."},
    {t:"Measure resonance", d:"Track message recall and brand awareness."},
  ],
  executionFlow:["Define Positioning","Build Messaging Architecture","Set Brand System","Plan Campaign Themes","Brief Channels","Measure Resonance"],
  activities:["Positioning & narrative development","Messaging architecture by audience","Brand & visual identity system","Campaign theme planning","Message localization"],
  deliverables:["Brand & Messaging Guide","Positioning Statement","Campaign Theme Calendar","Localization Kit"],
  owners:[
    {r:"Marketing Head", x:"Owns brand, narrative & system"},
    {r:"Brand Manager", x:"Visual identity & guidelines"},
    {r:"Content Lead", x:"Messaging & localization"},
  ],
  dependencies:["Market Assessment (positioning inputs)","Feeds → GTM, Consumer, Communication, BTL"],
  workflow:[
    {t:"Positioned", d:"Narrative & positioning agreed."},
    {t:"Systematized", d:"Brand & messaging architecture built."},
    {t:"Briefed", d:"All channels aligned to the story."},
    {t:"Optimized", d:"Refined by resonance data."},
  ],
  kras:["Message consistency","Brand awareness","Campaign efficiency"],
  kpis:[
    {n:"Aided brand awareness", t:"≥ 60% by launch", f:"aware_respondents / surveyed"},
    {n:"Message recall", t:"≥ 45%", f:"recalled_message / surveyed"},
    {n:"Channel alignment", t:"100% on-brand", f:"on_brand_assets / total_assets"},
  ],
  metrics:["Awareness %","Recall %","Assets on-brand","Campaign themes live"],
  calculations:[
    {n:"Share of voice", f:"DRS_mentions / total_category_mentions", d:"Presence vs competing messages."},
  ],
  dashboard:[
    {l:"Brand Awareness", v:"54%", t:"target 60%", trend:"up"},
    {l:"Message Recall", v:"41%", t:"+6pp", trend:"up"},
    {l:"On-Brand Assets", v:"97%", t:"governed", trend:"flat"},
    {l:"Active Themes", v:"4", t:"this quarter", trend:"flat"},
  ],
  reports:["Brand Health Report","Message Resonance Study","Campaign Theme Calendar"],
  ai:["Generate on-brand campaign concepts","Adapt core messaging per audience & language","Audit assets for brand consistency"],
  knowledge:["Brand & messaging guide","Goa campaign archive","Localization glossary"],
  future:[
    {ph:"Next", t:"Asset library with brand-compliance scoring."},
    {ph:"Planned", t:"A/B message testing framework."},
    {ph:"Vision", t:"AI brand guardian reviewing every asset automatically."},
  ],
});

MODULES["gtm"] = M({
  id:"gtm", name:"Go-To-Market", ic:"🚀", group:"Implementation",
  tagline:"The end-to-end launch strategy — research, segmentation, positioning, channels, budget, timeline and the launch calendar.",
  overview:"Go-To-Market is the strategic plan that sequences the launch: who we target first, how we position, which channels carry the message, what it costs, and when each move happens. It is not just planning — it is the live launch calendar that coordinates every implementation module toward go-live.",
  why:"Without an explicit GTM, modules optimize locally and the launch lacks sequence. GTM is the conductor that turns parallel workstreams into one coordinated launch.",
  objectives:[
    {t:"Sequence the launch", d:"Phased rollout with clear first-movers."},
    {t:"Segment & position", d:"Right message to the right segment first."},
    {t:"Plan channels & budget", d:"Allocate spend to highest-return channels."},
    {t:"Own the calendar", d:"A single timeline the whole program runs on."},
  ],
  executionFlow:["Research","Target Segmentation","Positioning","Messaging","Channels","Campaign Planning","Budget","Timeline","Launch Calendar","Performance Review"],
  activities:["Market research synthesis","Segmentation & targeting","Positioning & messaging","Channel strategy","Campaign & budget planning","Launch calendar build"],
  deliverables:["GTM Strategy Document","Segmentation Model","Channel Plan","Budget","Launch Calendar"],
  owners:[
    {r:"GTM Lead", x:"Owns strategy & calendar"},
    {r:"Marketing Head", x:"Positioning & channels"},
    {r:"Finance", x:"Budget allocation"},
  ],
  dependencies:["Marketing System (positioning)","Market Assessment (segments)","Feeds → Consumer, BTL, Communication"],
  workflow:[
    {t:"Researched", d:"Segments & insights consolidated."},
    {t:"Planned", d:"Channels, budget & calendar set."},
    {t:"Executing", d:"Campaigns live per calendar."},
    {t:"Reviewed", d:"Performance assessed & optimized."},
  ],
  kras:["Launch readiness","Channel ROI","Plan adherence"],
  kpis:[
    {n:"Calendar adherence", t:"≥ 90% on-time", f:"milestones_on_time / total"},
    {n:"Cost per acquisition", t:"≤ target by segment", f:"channel_spend / acquisitions"},
    {n:"Budget variance", t:"±10%", f:"(actual − planned)/planned"},
  ],
  metrics:["Milestones on-time","CPA by channel","Budget burn","Segments activated"],
  calculations:[
    {n:"Blended CPA", f:"total_spend / total_acquisitions", d:"Overall cost to acquire across channels."},
    {n:"Channel ROI", f:"(value_generated − spend)/spend", d:"Return per channel."},
  ],
  dashboard:[
    {l:"Calendar Adherence", v:"92%", t:"on-time", trend:"up"},
    {l:"Blended CPA", v:"₹46", t:"−12% QoQ", trend:"up"},
    {l:"Budget Burn", v:"63%", t:"on plan", trend:"flat"},
    {l:"Segments Live", v:"5/7", t:"phased", trend:"up"},
  ],
  reports:["GTM Strategy Doc","Launch Calendar","Channel Performance","Budget Tracker"],
  ai:["Recommend channel mix for a target CPA","Draft the GTM narrative & exec summary","Flag calendar slippage risks early"],
  knowledge:["GTM playbook","Goa launch calendar","Channel benchmark library"],
  future:[
    {ph:"Next", t:"Gantt view of the launch calendar."},
    {ph:"Planned", t:"Budget-to-outcome attribution model."},
    {ph:"Vision", t:"Auto-optimizing channel allocation."},
  ],
});

MODULES["consumer"] = M({
  id:"consumer", name:"Consumer Engagement", ic:"👥", group:"Implementation",
  tagline:"Drive citizen awareness, participation and habit — the demand side that makes return rates real.",
  overview:"Consumer Engagement builds the demand side of DRS: awareness, the simple how-to-return behaviour, incentives, and the habit loop that sustains high return rates. It runs campaigns, school and community programs, digital engagement and feedback loops that turn one-time returns into routine behaviour.",
  why:"A DRS only works if people return containers. All the infrastructure in the world fails without consumer participation — this module owns the behaviour that produces return rate.",
  objectives:[
    {t:"Build awareness", d:"Citizens know the scheme, the deposit and how to return."},
    {t:"Reduce friction", d:"Make returning obvious, easy and rewarding."},
    {t:"Form the habit", d:"Convert trial into repeat returns."},
    {t:"Listen & adapt", d:"Feedback loops that improve the experience."},
  ],
  executionFlow:["Awareness","Educate How-to-Return","Incentivize","Activate","Habit Reinforcement","Feedback Loop"],
  activities:["Awareness campaigns","How-to-return education","Incentive & reward design","School & community programs","Digital engagement","Feedback collection"],
  deliverables:["Consumer Campaign Kit","Education Content","Incentive Program","Feedback Dashboard"],
  owners:[
    {r:"Consumer Marketing Lead", x:"Owns campaigns & habit"},
    {r:"Community Lead", x:"School & community programs"},
  ],
  dependencies:["Marketing System (messaging)","Infrastructure (return points must exist)","Operations (refund experience)"],
  workflow:[
    {t:"Aware", d:"Consumer knows the scheme."},
    {t:"Activated", d:"First return completed."},
    {t:"Repeating", d:"Returns becoming routine."},
    {t:"Advocate", d:"Refers others, sustains habit."},
  ],
  kras:["Awareness reach","Participation rate","Habit retention"],
  kpis:[
    {n:"Return rate", t:"≥ 75% mature", f:"containers_returned / containers_sold"},
    {n:"Participation", t:"≥ 50% households", f:"returning_households / total_households"},
    {n:"Repeat return rate", t:"≥ 60%", f:"repeat_returners / total_returners"},
  ],
  metrics:["Awareness %","Active returners","Return rate","Repeat rate"],
  calculations:[
    {n:"Return rate", f:"containers_returned / containers_placed_on_market", d:"The headline DRS success metric."},
    {n:"Habit index", f:"returns_per_active_user / period", d:"Frequency of returning behaviour."},
  ],
  dashboard:[
    {l:"Return Rate", v:"68%", t:"target 75%", trend:"up"},
    {l:"Active Returners", v:"112k", t:"+9% MoM", trend:"up"},
    {l:"Participation", v:"44%", t:"households", trend:"up"},
    {l:"Repeat Rate", v:"57%", t:"target 60%", trend:"up"},
  ],
  barviz:{title:"Return rate ramp (% by month)", bars:[["M1",22],["M2",38],["M3",51],["M4",61],["M5",68]]},
  reports:["Consumer Engagement Report","Return Rate Tracker","Campaign Impact Study","Feedback Summary"],
  ai:["Generate localized awareness content & FAQs","Analyze feedback into improvement themes","Recommend incentive tweaks to lift repeat returns"],
  knowledge:["Behaviour-change playbook","Goa consumer campaign archive","Incentive design library"],
  future:[
    {ph:"Next", t:"Consumer app engagement analytics."},
    {ph:"Planned", t:"Gamified rewards & referral loops."},
    {ph:"Vision", t:"Personalized nudges driven by return behaviour."},
  ],
});

MODULES["acquisition"] = M({
  id:"acquisition", name:"Acquisition", ic:"🤝", group:"Implementation",
  tagline:"Onboard every stakeholder type the scheme needs — government, PIBOs, brands, retail, HORECA, institutions, collectors, recyclers, NGOs and CSR partners.",
  overview:"Acquisition is far deeper than onboarding. It runs a structured pipeline for <strong>every</strong> stakeholder category the scheme depends on — each with its own target universe, target accounts, priority, acquisition & engagement strategy, current stage, owner, documents, meetings, follow-ups, support and resistance scores, conversion rate and KPIs. It is the engine that converts a mapped stakeholder into an active participant.",
  why:"A DRS is only as strong as its weakest stakeholder link. Acquisition makes the conversion of every category — from a beach shack to a recycler — visible, owned and measurable, rather than relying on scattered relationships.",
  objectives:[
    {t:"Cover the full universe", d:"Every stakeholder category has a defined target universe."},
    {t:"Prioritize ruthlessly", d:"Focus owners on the accounts that unlock the most volume."},
    {t:"Run a real pipeline", d:"Stages from identified → active, with conversion tracked."},
    {t:"Tie to support & resistance", d:"Each account carries a support and resistance score."},
  ],
  executionFlow:["Define Universe","Identify Target Accounts","Prioritize","Strategy per Account","Engage","Negotiate","Onboard","Activate","Retain"],
  activities:["Target universe sizing per category","Account prioritization","Acquisition & engagement strategy","Outreach & meetings","Document & agreement management","Onboarding & activation"],
  deliverables:["Acquisition Pipeline","Per-category Target Lists","Signed Agreements","Onboarding Packs","Conversion Reports"],
  owners:[
    {r:"Acquisition Lead", x:"Owns the pipeline & conversion"},
    {r:"Category Owners", x:"Own specific stakeholder categories"},
    {r:"Legal", x:"Agreements & documentation"},
  ],
  dependencies:["Stakeholder Intelligence (who to target)","Partnership Management (agreements)","Communication (outreach assets)"],
  workflow:[
    {t:"Identified", d:"Account in target list."},
    {t:"Engaged", d:"Contacted, meeting underway."},
    {t:"Negotiating", d:"Terms & agreement in progress."},
    {t:"Onboarded", d:"Signed & set up."},
    {t:"Active", d:"Participating in the scheme."},
  ],
  kras:["Universe coverage","Conversion rate","Activation speed"],
  kpis:[
    {n:"Conversion rate", t:"≥ 35% by category", f:"onboarded / engaged"},
    {n:"Universe coverage", t:"≥ 80% priority accounts", f:"engaged / priority_universe"},
    {n:"Time to activate", t:"≤ 30 days", f:"avg(active_date − onboarded_date)"},
    {n:"Net support score", t:"≥ +30", f:"avg(support − resistance) of accounts"},
  ],
  metrics:["Accounts by stage","Conversion by category","Avg support score","Avg resistance score"],
  calculations:[
    {n:"Pipeline conversion", f:"onboarded_accounts / identified_accounts", d:"End-to-end funnel efficiency."},
    {n:"Weighted coverage", f:"Σ(account_volume × onboarded?) / Σ(account_volume)", d:"Coverage weighted by volume potential."},
  ],
  dashboard:[
    {l:"Accounts Onboarded", v:"486", t:"+62 this month", trend:"up"},
    {l:"Conversion Rate", v:"38%", t:"target 35%", trend:"up"},
    {l:"Priority Coverage", v:"74%", t:"target 80%", trend:"up"},
    {l:"Avg Support Score", v:"+34", t:"healthy", trend:"up"},
  ],
  reports:["Acquisition Pipeline Report","Conversion by Category","Coverage Heatmap","Support/Resistance Scorecard"],
  ai:["Prioritize accounts by conversion likelihood & volume","Draft outreach emails & follow-up sequences","Summarize meeting notes into next actions","Predict at-risk accounts from engagement signals"],
  knowledge:["Acquisition playbooks per category","Goa onboarding templates","Negotiation & agreement library"],
  custom:"acquisition",
  future:[
    {ph:"Next", t:"Kanban pipeline board per category."},
    {ph:"Planned", t:"Auto-scored lead prioritization."},
    {ph:"Vision", t:"Predictive churn & re-engagement for active accounts."},
  ],
});

MODULES["partnerships"] = M({
  id:"partnerships", name:"Partnership Management", ic:"🔗", group:"Implementation",
  tagline:"Govern the formal agreements, obligations and value exchange with PIBOs, recyclers, logistics and CSR partners.",
  overview:"Partnership Management governs the contractual layer: MoUs and agreements, each partner's obligations and SLAs, commercial terms, and the ongoing health of the relationship. Where Acquisition converts, Partnership Management sustains — ensuring partners deliver what they signed up for.",
  why:"Signed partners that don't perform are worse than no partners. This module makes obligations explicit and monitored so the operating model actually holds together.",
  objectives:[
    {t:"Formalize relationships", d:"Every partner under a clear agreement."},
    {t:"Track obligations & SLAs", d:"What each side owes, monitored."},
    {t:"Manage value exchange", d:"Commercial terms & settlements."},
    {t:"Sustain partner health", d:"Proactive relationship management."},
  ],
  executionFlow:["Define Terms","Sign Agreement","Onboard Partner","Track Obligations","Monitor SLAs","Renew / Expand"],
  activities:["Agreement drafting & signing","Obligation & SLA definition","Performance monitoring","Issue & dispute resolution","Renewals & expansion"],
  deliverables:["Partner Agreements","SLA Register","Performance Scorecards","Renewal Calendar"],
  owners:[
    {r:"Partnerships Lead", x:"Owns agreements & health"},
    {r:"Legal", x:"Contracts & compliance"},
    {r:"Operations", x:"SLA performance"},
  ],
  dependencies:["Acquisition (converted partners)","Operations (SLA data)","Finance (settlements)"],
  workflow:[
    {t:"Drafted", d:"Terms agreed, agreement prepared."},
    {t:"Signed", d:"Executed & onboarded."},
    {t:"Active", d:"Delivering against SLAs."},
    {t:"Renewed", d:"Extended or expanded."},
  ],
  kras:["SLA compliance","Partner retention","Dispute resolution"],
  kpis:[
    {n:"SLA compliance", t:"≥ 95%", f:"slas_met / slas_total"},
    {n:"Partner retention", t:"≥ 90%", f:"retained / total_partners"},
    {n:"Renewal rate", t:"≥ 85%", f:"renewed / due_for_renewal"},
  ],
  metrics:["Active partners","SLAs met","Open disputes","Renewals due"],
  calculations:[
    {n:"Partner health score", f:"(SLA% × .5)+(engagement × .3)+(commercial × .2)", d:"Composite relationship health."},
  ],
  dashboard:[
    {l:"Active Partners", v:"57", t:"+5 this quarter", trend:"up"},
    {l:"SLA Compliance", v:"94%", t:"target 95%", trend:"up"},
    {l:"Open Disputes", v:"3", t:"−2 MoM", trend:"up"},
    {l:"Renewals Due", v:"8", t:"next 90d", trend:"flat"},
  ],
  reports:["Partner Scorecard","SLA Compliance Report","Renewal Pipeline","Dispute Log"],
  ai:["Summarize agreement terms & obligations","Flag SLA breaches & at-risk partners","Draft renewal & negotiation briefs"],
  knowledge:["Standard agreement templates","SLA benchmark library","Goa partner registry"],
  future:[
    {ph:"Next", t:"Obligation calendar with auto-reminders."},
    {ph:"Planned", t:"Partner self-service portal."},
    {ph:"Vision", t:"Smart-contract settlement automation."},
  ],
});

MODULES["communication"] = M({
  id:"communication", name:"Communication Center", ic:"✉", group:"Implementation",
  tagline:"The content engine — every message, asset and channel for internal, government, retail, consumer, brand, media and partner audiences.",
  overview:"The Communication Center is the content engine of the platform. It organizes communication by audience stream — internal, government, retail, consumer, brand, media, partner — and manages the full asset library: emails, WhatsApp, SMS, posters, flyers, FAQs, presentations, press releases, videos, social media and website content. It ensures the right message reaches the right audience through the right channel, on-brand and on-time.",
  why:"Communication scattered across inboxes and drives can't be reused, governed or measured. Centralizing it turns every asset into a reusable, on-brand, trackable resource — and is what makes localization to a new geography fast.",
  objectives:[
    {t:"Stream by audience", d:"Seven distinct communication streams, each owned."},
    {t:"Centralize assets", d:"One governed library across all formats & channels."},
    {t:"Reuse & localize", d:"Adapt proven assets to new geographies fast."},
    {t:"Measure reach & response", d:"Track delivery, open and response per channel."},
  ],
  executionFlow:["Plan by Audience","Create Assets","Brand Review","Localize","Distribute","Measure Response"],
  activities:["Audience stream planning","Asset creation across formats","Brand & approval review","Localization","Multi-channel distribution","Response tracking"],
  deliverables:["Asset Library","Communication Calendar","Channel Distribution Logs","Response Reports"],
  owners:[
    {r:"Communications Lead", x:"Owns streams & calendar"},
    {r:"Content Designers", x:"Asset production"},
    {r:"Brand Manager", x:"Approval & consistency"},
  ],
  dependencies:["Marketing System (messaging & brand)","All modules (consume assets)","AI Content Generator"],
  workflow:[
    {t:"Briefed", d:"Audience & message defined."},
    {t:"Produced", d:"Asset created & reviewed."},
    {t:"Approved", d:"On-brand, sign-off complete."},
    {t:"Distributed", d:"Sent & tracked across channels."},
  ],
  kras:["Asset reuse","Channel reach","Response rate"],
  kpis:[
    {n:"Asset reuse rate", t:"≥ 60%", f:"reused_assets / total_assets"},
    {n:"On-time delivery", t:"≥ 95%", f:"on_time_sends / total_sends"},
    {n:"Response rate", t:"≥ benchmark/channel", f:"responses / delivered"},
  ],
  metrics:["Assets produced","Reuse rate","Reach by channel","Response rate"],
  calculations:[
    {n:"Effective reach", f:"Σ(delivered × open_rate) per channel", d:"Audience genuinely reached."},
  ],
  dashboard:[
    {l:"Assets in Library", v:"640", t:"+48 this month", trend:"up"},
    {l:"Reuse Rate", v:"58%", t:"target 60%", trend:"up"},
    {l:"On-time Delivery", v:"96%", t:"governed", trend:"up"},
    {l:"Avg Response Rate", v:"7.2%", t:"above bench", trend:"up"},
  ],
  reports:["Communication Calendar","Asset Library Index","Channel Reach Report","Response Analytics"],
  ai:["Draft emails, WhatsApp, SMS, FAQs & press releases on-brand","Localize any asset to a new language/geography","Suggest the best channel & timing per audience"],
  knowledge:["Brand & tone guide","Asset templates by format","Goa communication archive"],
  custom:"communication",
  future:[
    {ph:"Next", t:"Channel-integrated send & tracking (WhatsApp/email)."},
    {ph:"Planned", t:"Asset performance ranking."},
    {ph:"Vision", t:"AI-composed multi-channel campaigns from one brief."},
  ],
});

MODULES["btl"] = M({
  id:"btl", name:"BTL Command Center", ic:"🎪", group:"Implementation",
  tagline:"Plan and run on-ground activations end-to-end — calendar, vendors, materials, execution, leads, registrations, bottle collection and ROI.",
  overview:"The BTL Command Center runs below-the-line activation: the campaign calendar, vendor and material management, on-ground execution, attendance, lead capture, registration, bottle collection at events, and ROI / impact assessment. It is where the brand meets the public at markets, beaches, schools and events — and where early return behaviour is seeded.",
  why:"On-ground activation is where awareness becomes action. Without disciplined planning, vendor coordination and ROI tracking, BTL spend evaporates with nothing measured. This module makes every activation accountable.",
  objectives:[
    {t:"Plan the calendar", d:"All activations scheduled & resourced."},
    {t:"Coordinate vendors & materials", d:"Right kit, right place, on time."},
    {t:"Capture every lead & return", d:"Attendance, registrations, bottles collected."},
    {t:"Prove ROI", d:"Cost per lead, per registration, per bottle."},
  ],
  executionFlow:["Plan","Campaign Calendar","Vendor Management","Material Management","Execution","Attendance","Lead Capture","Registration","Bottle Collection","ROI","Impact Assessment"],
  activities:["Activation planning & calendar","Vendor sourcing & management","Material & kit logistics","On-ground execution","Lead & registration capture","Bottle collection","ROI analysis"],
  deliverables:["Activation Calendar","Vendor Register","Event Reports","Lead Database","ROI Analysis"],
  owners:[
    {r:"BTL Lead", x:"Owns activations & ROI"},
    {r:"Field Coordinators", x:"On-ground execution"},
    {r:"Procurement", x:"Vendors & materials"},
  ],
  dependencies:["GTM (calendar & budget)","Communication (event assets)","Acquisition (leads handoff)"],
  workflow:[
    {t:"Planned", d:"Event scheduled & resourced."},
    {t:"Prepped", d:"Vendors & materials confirmed."},
    {t:"Executed", d:"Activation run, data captured."},
    {t:"Assessed", d:"ROI & impact recorded."},
  ],
  kras:["Activation throughput","Lead yield","Cost efficiency"],
  kpis:[
    {n:"Cost per lead", t:"≤ ₹120", f:"event_cost / leads_captured"},
    {n:"Leads per activation", t:"≥ 150", f:"total_leads / activations"},
    {n:"Bottles collected", t:"≥ target/event", f:"Σ bottles_collected"},
    {n:"Activation ROI", t:"≥ 3×", f:"value_generated / activation_cost"},
  ],
  metrics:["Activations run","Footfall","Leads captured","Bottles collected","Cost per lead"],
  calculations:[
    {n:"Cost per registration", f:"activation_cost / registrations", d:"Efficiency of converting footfall to sign-ups."},
    {n:"Activation ROI", f:"(downstream_value − cost) / cost", d:"Return on each activation."},
  ],
  dashboard:[
    {l:"Activations (QTD)", v:"38", t:"+11 vs plan", trend:"up"},
    {l:"Total Footfall", v:"61k", t:"this quarter", trend:"up"},
    {l:"Cost per Lead", v:"₹104", t:"target ≤₹120", trend:"up"},
    {l:"Bottles Collected", v:"94k", t:"at events", trend:"up"},
  ],
  barviz:{title:"Leads captured by activation type", bars:[["Beach",1240],["Markets",980],["Schools",1520],["Events",760],["Retail",640]]},
  reports:["Activation Calendar","Event ROI Report","Lead Capture Summary","Vendor Performance"],
  ai:["Generate activation ideas & event checklists","Summarize event performance into ROI narratives","Recommend the highest-ROI activation mix"],
  knowledge:["BTL playbook & checklists","Vendor directory","Goa activation case studies"],
  future:[
    {ph:"Next", t:"Mobile field-app for live lead & bottle capture."},
    {ph:"Planned", t:"Geo-tagged activation heatmap."},
    {ph:"Vision", t:"Predictive activation siting by footfall potential."},
  ],
});

MODULES["infrastructure"] = M({
  id:"infrastructure", name:"Infrastructure Planning", ic:"🏗", group:"Implementation",
  tagline:"Site the return network — identification, survey, power, network, permissions, RVM installation, testing, commissioning and maintenance.",
  overview:"Infrastructure Planning manages the physical return network lifecycle: identifying locations, surveying sites for power and connectivity, securing permissions, installing Reverse Vending Machines (RVMs) and manual return points, testing, commissioning, and ongoing maintenance. It ensures consumers have convenient, working places to return containers.",
  why:"Return convenience drives return rate. A well-planned, reliable network is the physical backbone of the scheme — poorly sited or unreliable infrastructure quietly kills participation.",
  objectives:[
    {t:"Site for convenience", d:"Locations that maximize accessible coverage."},
    {t:"De-risk each site", d:"Power, connectivity & permissions confirmed before install."},
    {t:"Deploy reliably", d:"Install, test, commission to standard."},
    {t:"Sustain uptime", d:"Proactive maintenance keeps machines live."},
  ],
  executionFlow:["Location Identification","Site Survey","Power Availability","Network Availability","Permissions","RVM Installation","Testing","Commissioning","Maintenance","Performance"],
  activities:["Location identification & ranking","Site surveys","Utility & connectivity checks","Permission acquisition","RVM / return-point installation","Testing & commissioning","Maintenance scheduling"],
  deliverables:["Site Plan","Survey Reports","Permission Records","Installation & Commissioning Logs","Maintenance Schedule"],
  owners:[
    {r:"Infrastructure Lead", x:"Owns the network lifecycle"},
    {r:"Site Survey Team", x:"Surveys & feasibility"},
    {r:"Maintenance Vendor", x:"Uptime & repairs"},
  ],
  dependencies:["Geography Engine (siting density)","Government (site permissions)","Operations (collection from sites)"],
  workflow:[
    {t:"Identified", d:"Candidate location ranked."},
    {t:"Surveyed", d:"Power, network, permissions checked."},
    {t:"Installed", d:"RVM / point deployed & tested."},
    {t:"Live", d:"Commissioned & maintained."},
  ],
  kras:["Network coverage","Deployment velocity","Uptime"],
  kpis:[
    {n:"RVM uptime", t:"≥ 97%", f:"uptime_hours / total_hours"},
    {n:"Sites live vs planned", t:"100% by launch", f:"live_sites / planned_sites"},
    {n:"Install cycle time", t:"≤ 14 days", f:"avg(live_date − survey_date)"},
  ],
  metrics:["Sites identified","Surveys done","RVMs live","Uptime %","Avg install time"],
  calculations:[
    {n:"Coverage ratio", f:"return_points / target_points_per_population", d:"Network density vs convenience target."},
    {n:"Mean time to repair", f:"Σ repair_time / incidents", d:"Maintenance responsiveness."},
  ],
  dashboard:[
    {l:"RVMs Live", v:"142", t:"of 180 planned", trend:"up"},
    {l:"Network Uptime", v:"97.4%", t:"target 97%", trend:"up"},
    {l:"Avg Install Time", v:"11d", t:"target ≤14", trend:"up"},
    {l:"Sites in Survey", v:"23", t:"pipeline", trend:"flat"},
  ],
  reports:["Site Plan & Coverage","Installation Status","Uptime & Maintenance Report","Permission Tracker"],
  ai:["Rank candidate sites by coverage & footfall","Predict maintenance needs from uptime patterns","Summarize survey reports into go/no-go calls"],
  knowledge:["Site selection criteria","RVM spec & install SOP","Maintenance playbook"],
  future:[
    {ph:"Next", t:"Live network map with uptime status."},
    {ph:"Planned", t:"IoT telemetry from RVMs."},
    {ph:"Vision", t:"Predictive siting & demand-based capacity planning."},
  ],
});

MODULES["deployment"] = M({
  id:"deployment", name:"Deployment Tracking", ic:"📍", group:"Implementation",
  tagline:"A real-time rollout view of where the network and program stand across the geography hierarchy.",
  overview:"Deployment Tracking is the rollout cockpit — a real-time view of how far the program has deployed across the geography hierarchy: sites live, accounts onboarded, coverage achieved, and what's pending per taluka, panchayat and cluster. It synthesizes signals from Infrastructure, Acquisition and Operations into one rollout picture.",
  why:"Leadership needs to know, at a glance, where the rollout actually stands versus plan — not chase status across five teams. Deployment Tracking is that single answer.",
  objectives:[
    {t:"One rollout picture", d:"Coverage, sites & accounts on one map."},
    {t:"Plan vs actual", d:"Where we are versus where we said we'd be."},
    {t:"Surface bottlenecks", d:"Which geographies are lagging and why."},
    {t:"Drive cadence", d:"Power weekly rollout reviews."},
  ],
  executionFlow:["Aggregate Signals","Map to Hierarchy","Compare vs Plan","Flag Bottlenecks","Report Cadence"],
  activities:["Rollout data aggregation","Coverage mapping","Plan-vs-actual tracking","Bottleneck identification","Cadence reporting"],
  deliverables:["Rollout Dashboard","Coverage Map","Plan-vs-Actual Report","Bottleneck Log"],
  owners:[
    {r:"Program Manager", x:"Owns rollout cadence"},
    {r:"Geography Leads", x:"Region-level rollout"},
  ],
  dependencies:["Infrastructure, Acquisition, Operations (signals)","Geography Engine (hierarchy)"],
  workflow:[
    {t:"Aggregated", d:"Signals pulled together."},
    {t:"Mapped", d:"Coverage placed on hierarchy."},
    {t:"Reviewed", d:"Plan-vs-actual assessed."},
    {t:"Actioned", d:"Bottlenecks assigned."},
  ],
  kras:["Rollout pace","Coverage achievement","Plan adherence"],
  kpis:[
    {n:"Coverage achieved", t:"per phase plan", f:"covered_units / planned_units"},
    {n:"Rollout adherence", t:"≥ 90%", f:"on_schedule_units / total_units"},
    {n:"Bottleneck resolution", t:"≤ 7 days", f:"avg(resolved − flagged)"},
  ],
  metrics:["Units covered","Sites live","Accounts active","Behind-plan units"],
  calculations:[
    {n:"Rollout completion", f:"deployed_units / total_target_units", d:"Overall program rollout %."},
  ],
  dashboard:[
    {l:"Rollout Complete", v:"71%", t:"vs 74% plan", trend:"flat"},
    {l:"Talukas Live", v:"9/12", t:"phased", trend:"up"},
    {l:"Behind Plan", v:"2", t:"units flagged", trend:"down"},
    {l:"Coverage", v:"68%", t:"of target", trend:"up"},
  ],
  reports:["Rollout Status Report","Coverage by Geography","Plan-vs-Actual","Bottleneck Tracker"],
  ai:["Explain why a geography is behind plan","Forecast completion dates from current pace","Recommend resource reallocation to lagging areas"],
  knowledge:["Rollout playbook","Goa phasing plan","Coverage benchmark library"],
  future:[
    {ph:"Next", t:"Animated rollout timeline by geography."},
    {ph:"Planned", t:"Predictive completion forecasting."},
    {ph:"Vision", t:"Auto-rebalancing of rollout resources."},
  ],
});

MODULES["operations"] = M({
  id:"operations", name:"Operations Coordination", ic:"♻", group:"Implementation",
  tagline:"Run the deposit-return value chain — from bottle returned through validation, refund, collection, sorting, transport, recycler, PCR and back to brand.",
  overview:"Operations Coordination runs the live circular value chain: a bottle is returned, validated, the deposit refunded, then collected, sorted, transported to a recycler, processed into PCR (post-consumer recycled material), and supplied back to brands. It coordinates the reverse-logistics flow and the financial reconciliation of deposits and refunds.",
  why:"This is the engine that actually closes the loop — turning returns into recycled material and refunds. If operations stutter, refunds stall, material doesn't flow, and trust collapses. This module keeps the circular economy turning.",
  objectives:[
    {t:"Validate & refund fast", d:"Every genuine return refunded promptly."},
    {t:"Move material reliably", d:"Collection, sorting & transport on cadence."},
    {t:"Close the loop", d:"Recycler → PCR → brand supply chain."},
    {t:"Reconcile finances", d:"Deposits and refunds balanced & auditable."},
  ],
  executionFlow:["Bottle Returned","Validation","Deposit Refund","Collection","Sorting","Transport","Recycler","PCR","Brand"],
  activities:["Return validation","Deposit refund processing","Collection scheduling","Sorting & baling","Transport coordination","Recycler handoff","Financial reconciliation"],
  deliverables:["Operations Dashboard","Refund Ledger","Material Flow Report","Reconciliation Statements"],
  owners:[
    {r:"Operations Lead", x:"Owns the value chain"},
    {r:"Logistics Coordinator", x:"Collection & transport"},
    {r:"Finance", x:"Deposit / refund reconciliation"},
  ],
  dependencies:["Infrastructure (return points)","Partnerships (recyclers, logistics)","Consumer (return volume)"],
  workflow:[
    {t:"Returned", d:"Container received & validated."},
    {t:"Refunded", d:"Deposit paid to consumer."},
    {t:"Collected", d:"Aggregated, sorted, transported."},
    {t:"Recycled", d:"Processed to PCR, supplied to brand."},
  ],
  kras:["Refund integrity","Material throughput","Reconciliation accuracy"],
  kpis:[
    {n:"Refund accuracy", t:"≥ 99.5%", f:"correct_refunds / total_refunds"},
    {n:"Collection cycle time", t:"≤ 48 hrs", f:"avg(collected − returned)"},
    {n:"Material recovery rate", t:"≥ 90%", f:"recycled_tonnage / collected_tonnage"},
    {n:"Reconciliation variance", t:"≤ 0.5%", f:"abs(deposits − refunds − held)/deposits"},
  ],
  metrics:["Bottles returned","Refunds processed","Tonnage collected","PCR output","Variance %"],
  calculations:[
    {n:"Loop closure rate", f:"PCR_to_brand_tonnage / collected_tonnage", d:"Share of collected material genuinely re-circulated."},
    {n:"Deposit float", f:"deposits_collected − refunds_paid", d:"Outstanding deposit liability at any time."},
  ],
  dashboard:[
    {l:"Bottles Returned (MTD)", v:"1.9M", t:"+14% MoM", trend:"up"},
    {l:"Refund Accuracy", v:"99.7%", t:"target 99.5%", trend:"up"},
    {l:"Material Recovery", v:"91%", t:"to PCR", trend:"up"},
    {l:"Recon Variance", v:"0.3%", t:"within tol.", trend:"up"},
  ],
  barviz:{title:"Material flow (tonnes/month)", bars:[["Collected",420],["Sorted",398],["Recycled",362],["PCR",340],["To Brand",318]]},
  reports:["Operations Dashboard","Refund Ledger","Material Flow Report","Reconciliation Statement"],
  ai:["Detect refund anomalies & potential fraud patterns","Forecast collection volumes for logistics planning","Explain reconciliation variances"],
  knowledge:["Reverse-logistics SOP","Recycler & PCR spec library","Reconciliation procedures"],
  future:[
    {ph:"Next", t:"Live value-chain flow visualization."},
    {ph:"Planned", t:"Predictive logistics route optimization."},
    {ph:"Vision", t:"Blockchain-traced material provenance to brand."},
  ],
});

MODULES["launch-ready"] = M({
  id:"launch-ready", name:"Launch Readiness", ic:"✅", group:"Implementation",
  tagline:"The go-live gate — a cross-module readiness checklist that must be green before launch.",
  overview:"Launch Readiness is the formal go-live gate. It aggregates readiness signals from every module — approvals secured, infrastructure live, accounts onboarded, risks closed, communication primed — into a single readiness scorecard. Nothing launches until the critical criteria are green and the Director signs off.",
  why:"Launches fail when one unready workstream is missed in the rush to go-live. A structured, cross-module gate makes readiness explicit and prevents launching on hope.",
  objectives:[
    {t:"One readiness view", d:"Every module's go-live status in one place."},
    {t:"Enforce the gate", d:"Critical criteria must be green to proceed."},
    {t:"Surface blockers", d:"Exactly what stands between us and launch."},
    {t:"Formal sign-off", d:"Director go-decision on the record."},
  ],
  executionFlow:["Define Criteria","Collect Module Status","Score Readiness","Resolve Blockers","Go/No-Go Sign-off"],
  activities:["Readiness criteria definition","Cross-module status collection","Blocker resolution","Dry-runs & rehearsals","Go/No-Go review"],
  deliverables:["Readiness Scorecard","Blocker Log","Go/No-Go Decision Record","Launch Runbook"],
  owners:[
    {r:"Program Manager", x:"Owns the readiness gate"},
    {r:"Implementation Director", x:"Go/No-Go decision"},
    {r:"Module Owners", x:"Submit readiness status"},
  ],
  dependencies:["All implementation modules (status)","Government (approvals)","Resistance (open high-impact risks)"],
  workflow:[
    {t:"Criteria Set", d:"Launch criteria agreed."},
    {t:"Assessed", d:"Module statuses collected."},
    {t:"Blockers Cleared", d:"Critical items resolved."},
    {t:"Go", d:"Director signs off."},
  ],
  kras:["Readiness completeness","Blocker closure","Decision confidence"],
  kpis:[
    {n:"Readiness score", t:"100% critical green", f:"green_critical / total_critical"},
    {n:"Open blockers", t:"0 critical", f:"count(critical_blockers_open)"},
    {n:"Criteria coverage", t:"100% modules", f:"submitted / total_modules"},
  ],
  metrics:["Criteria green","Blockers open","Modules reporting","Dry-runs passed"],
  calculations:[
    {n:"Composite readiness", f:"Σ(module_readiness × criticality_weight)", d:"Weighted go-live readiness, 0–100%."},
  ],
  dashboard:[
    {l:"T-Minus Tracker", v:"T-15", t:"on schedule", trend:"flat"},
    {l:"Readiness Score", v:"94%", t:"critical 100%", trend:"up"},
    {l:"Cardinal Rule Gate", v:"BLOCKER", t:"Ops < Comms", trend:"down"},
    {l:"Decision", v:"NO-GO", t:"pending Ops resolution", trend:"down"},
  ],
  reports:["Readiness Scorecard","Blocker Log","Go/No-Go Brief","Launch Runbook"],
  ai:["Summarize readiness status into a one-page brief","Flag criteria at risk of slipping","Draft the Go/No-Go decision memo"],
  knowledge:["Launch readiness checklist","Goa go-live runbook","Dry-run protocols"],
  future:[
    {ph:"Next", t:"Live readiness traffic-light board."},
    {ph:"Planned", t:"Automated status pull from each module."},
    {ph:"Vision", t:"Predictive launch-date confidence modeling."},
  ],
});

MODULES["launch-mgmt"] = M({
  id:"launch-mgmt", name:"Launch Management", ic:"🎬", group:"Implementation",
  tagline:"Command the launch window — coordinate the moment of go-live and the critical first days.",
  overview:"Launch Management is mission control for the launch window itself: coordinating the go-live event, real-time monitoring of the first hours and days, rapid issue triage, stakeholder communication, and a war-room cadence to stabilize the program before it transitions to steady-state optimization.",
  why:"The launch window is high-stakes and time-compressed — issues that take days normally must be resolved in hours. A dedicated command structure prevents a strong build from stumbling at the most visible moment.",
  objectives:[
    {t:"Coordinate go-live", d:"Orchestrate the launch event & first moves."},
    {t:"Monitor in real time", d:"Watch returns, refunds, uptime live."},
    {t:"Triage fast", d:"War-room resolution of launch issues."},
    {t:"Communicate constantly", d:"Keep stakeholders & public informed."},
  ],
  executionFlow:["Pre-launch Brief","Go-Live","Real-time Monitoring","Issue Triage","Stakeholder Comms","Stabilize"],
  activities:["Launch event coordination","Real-time monitoring","War-room issue triage","Stakeholder & media communication","Stabilization tracking"],
  deliverables:["Launch Runbook (live)","Real-time Dashboard","Issue Triage Log","Launch Comms","Stabilization Report"],
  owners:[
    {r:"Implementation Director", x:"Launch commander"},
    {r:"Program Manager", x:"War-room coordination"},
    {r:"All Module Owners", x:"On-call for their domain"},
  ],
  dependencies:["Launch Readiness (gate passed)","Operations & Infrastructure (live monitoring)","Communication (launch comms)"],
  workflow:[
    {t:"Briefed", d:"War-room & roles set."},
    {t:"Live", d:"Program launched, monitored."},
    {t:"Triaging", d:"Issues resolved in real time."},
    {t:"Stable", d:"Steady-state reached, handed over."},
  ],
  kras:["Launch stability","Issue resolution speed","Stakeholder confidence"],
  kpis:[
    {n:"Critical issues at launch", t:"0 unresolved", f:"count(critical_open_at_T+72h)"},
    {n:"Issue resolution time", t:"≤ 4 hrs critical", f:"avg(resolved − raised)"},
    {n:"System uptime (launch wk)", t:"≥ 98%", f:"uptime / total"},
  ],
  metrics:["Issues raised","Issues resolved","Uptime","Returns day-1","Refunds day-1"],
  calculations:[
    {n:"Launch stability index", f:"(uptime% × .4)+(issue_close% × .4)+(refund_accuracy × .2)", d:"Composite first-week stability."},
  ],
  dashboard:[
    {l:"Launch Stability", v:"96", t:"index /100", trend:"up"},
    {l:"Open Issues", v:"2", t:"0 critical", trend:"up"},
    {l:"Uptime (wk1)", v:"98.6%", t:"target 98%", trend:"up"},
    {l:"Day-1 Returns", v:"42k", t:"above forecast", trend:"up"},
  ],
  reports:["Launch Runbook","Real-time Launch Dashboard","Issue Triage Log","Launch Wrap Report"],
  ai:["Triage and route incoming issues by severity","Draft real-time stakeholder & media updates","Summarize launch-day performance hourly"],
  knowledge:["Launch war-room protocol","Goa launch retrospective","Incident response playbook"],
  future:[
    {ph:"Next", t:"Live launch command dashboard."},
    {ph:"Planned", t:"Automated anomaly alerts during launch."},
    {ph:"Vision", t:"AI launch co-pilot recommending interventions live."},
  ],
});

MODULES["reputation"] = M({
  id:"reputation", name:"Reputation Management", ic:"📡", group:"Implementation",
  tagline:"Active post-launch crisis handling and sentiment tracking to protect trust. Rapid response to negative media or operational friction.",
  overview:"Reputation Management is the active post-launch shield for the DRS. It pulls live media monitoring, social sentiment, and operational friction logs to anticipate backlash. The AI Copilot actively drafts Rapid Response Briefs to counter misinformation, governed by a strict SLA.",
  why:"A DRS requires public trust. Unanswered friction in week one can derail a multi-year program. Rapid response is the difference between a minor hiccup and a media crisis.",
  objectives:[
    {t:"Monitor Sentiment", d:"Live tracking of positive, neutral, and negative press."},
    {t:"Enforce Response SLAs", d:"Rapid Response Briefs drafted and approved within hours."},
    {t:"Combat Misinformation", d:"Flag false narratives and issue factual corrections."},
  ],
  executionFlow:["Monitor Media","Detect Friction","Draft Response","Approve Brief","Publish","Capture Testimonial"],
  activities:["Media & social monitoring","Rapid Response drafting","SLA tracking","Retail testimonial capture"],
  deliverables:["Rapid Response Briefs","Sentiment Trend Map","Misinformation Log","Milestone Press Releases"],
  owners:[
    {r:"Communications Head", x:"Owns reputation & rapid response"},
    {r:"Implementation Director", x:"Approves high-risk statements"},
  ],
  dependencies:["Operations (friction logs)","Consumer Engagement (feedback)"],
  workflow:[
    {t:"Monitoring", d:"Live listening active."},
    {t:"Incident Logged", d:"Negative signal detected."},
    {t:"Drafted", d:"Response ready for approval."},
    {t:"Published", d:"SLA met and statement out."},
  ],
  kras:["Response time","Sentiment preservation","Misinformation countered"],
  kpis:[
    {n:"Reputation Trust Score", t:"≥ 80/100", f:"sentiment_index * trust_multiplier"},
  ],
  metrics:["Open incidents","SLA breaches","Positive testimonials"],
  dashboard:[
    {l:"Reputation Score", v:"82", t:"target 80", trend:"flat"},
    {l:"Open Incidents", v:"1", t:"within SLA", trend:"down"},
    {l:"Avg Response Time", v:"2.5h", t:"target <4h", trend:"up"},
    {l:"Positive Sentiment", v:"68%", t:"post-launch", trend:"up"},
  ],
  reports:["Sentiment Trend Map","Misinformation Log","Rapid Response Archive"],
  ai:["Draft Rapid Response statements automatically from friction logs","Extract retail testimonials from raw feedback","Analyze sentiment trends daily"],
});

MODULES["post-launch"] = M({
  id:"post-launch", name:"Post-Launch Optimization", ic:"📈", group:"Implementation",
  tagline:"Move from launch to sustained performance — optimize return rate, cost, satisfaction and capture learnings as a reusable blueprint.",
  overview:"Post-Launch Optimization turns a live program into a continuously improving one. It tracks performance against targets, runs experiments to lift return rate and reduce cost-to-serve, gathers stakeholder and consumer feedback, and — critically — captures everything learned into the Knowledge Hub as a reusable blueprint for the next geography.",
  why:"The launch is the beginning, not the end. Optimization compounds performance, and disciplined learning-capture is what makes the next DRS launch faster and cheaper. This is where Goa becomes a blueprint.",
  objectives:[
    {t:"Optimize performance", d:"Lift return rate, cut cost-to-serve."},
    {t:"Experiment continuously", d:"Test, learn, scale what works."},
    {t:"Sustain satisfaction", d:"Keep stakeholders & consumers happy."},
    {t:"Capture the blueprint", d:"Codify learnings for reuse."},
  ],
  executionFlow:["Track vs Targets","Identify Opportunities","Run Experiments","Scale Wins","Capture Learnings","Update Blueprint"],
  activities:["Performance tracking","Opportunity identification","Experimentation","Feedback analysis","Cost optimization","Knowledge capture"],
  deliverables:["Optimization Backlog","Experiment Results","Performance Reports","Reusable Blueprint"],
  owners:[
    {r:"Operations Lead", x:"Performance & cost"},
    {r:"Program Manager", x:"Optimization backlog"},
    {r:"Knowledge Lead", x:"Blueprint capture"},
  ],
  dependencies:["All modules (performance data)","Analytics (insights)","Knowledge Hub (blueprint)"],
  workflow:[
    {t:"Measured", d:"Performance vs targets tracked."},
    {t:"Experimenting", d:"Improvements being tested."},
    {t:"Scaled", d:"Wins rolled out."},
    {t:"Codified", d:"Learnings captured as blueprint."},
  ],
  kras:["Performance lift","Cost efficiency","Knowledge reuse"],
  kpis:[
    {n:"Return rate improvement", t:"+10pp post-launch", f:"return_rate_now − return_rate_launch"},
    {n:"Cost-to-serve reduction", t:"−15%", f:"(cost_launch − cost_now)/cost_launch"},
    {n:"Blueprint completeness", t:"100% modules", f:"documented_modules / total"},
  ],
  metrics:["Return rate trend","Cost-to-serve","NPS","Experiments run","Learnings captured"],
  calculations:[
    {n:"Cost-to-serve", f:"total_program_cost / containers_processed", d:"Unit economics of the running scheme."},
    {n:"Improvement velocity", f:"validated_improvements / period", d:"Rate of compounding optimization."},
  ],
  dashboard:[
    {l:"Return Rate", v:"79%", t:"+11pp since launch", trend:"up"},
    {l:"Cost-to-Serve", v:"−13%", t:"vs launch", trend:"up"},
    {l:"Consumer NPS", v:"+48", t:"+9 QoQ", trend:"up"},
    {l:"Blueprint Done", v:"88%", t:"modules", trend:"up"},
  ],
  reports:["Performance Report","Experiment Log","Optimization Backlog","Reusable Blueprint"],
  ai:["Identify the highest-impact optimization opportunities","Summarize experiments into learnings","Auto-draft the reusable blueprint from program data"],
  knowledge:["Optimization playbook","Experiment library","Goa blueprint (the template for next geography)"],
  future:[
    {ph:"Next", t:"Experiment tracker with statistical significance."},
    {ph:"Planned", t:"Auto-generated blueprint per geography."},
    {ph:"Vision", t:"Self-optimizing program with AI recommendations."},
  ],
});

/* ============================================================
   PERFORMANCE MODULES
   ============================================================ */

MODULES["kras"] = M({
  id:"kras", name:"KRAs", ic:"◆", group:"Performance",
  tagline:"Key Result Areas — the handful of outcomes each module and owner is ultimately accountable for.",
  overview:"KRAs define the critical outcomes the program is accountable for, rolled up from every module. They are the bridge between strategy and measurement: each KRA is owned, weighted, and decomposed into KPIs and metrics. The KRA layer is what keeps the platform focused on results rather than activity.",
  why:"Activity is easy to measure and easy to mistake for progress. KRAs force the program to declare what actually matters and hold owners to those outcomes.",
  objectives:[
    {t:"Define accountability", d:"Clear result areas per module & owner."},
    {t:"Weight what matters", d:"Not all outcomes are equal."},
    {t:"Cascade to KPIs", d:"Each KRA decomposes into measurable KPIs."},
    {t:"Roll up to strategy", d:"Module KRAs aggregate to program goals."},
  ],
  executionFlow:["Define KRAs","Assign Owners","Set Weights","Map to KPIs","Review Cadence"],
  activities:["KRA definition per module","Owner & weight assignment","KPI mapping","Quarterly review"],
  deliverables:["KRA Framework","KRA-KPI Map","Owner Accountability Matrix"],
  owners:[{r:"Implementation Director", x:"Owns the KRA framework"},{r:"Module Owners", x:"Own their KRAs"}],
  dependencies:["KPIs (decomposition)","Scorecards (display)"],
  workflow:[{t:"Defined",d:"KRAs articulated."},{t:"Owned",d:"Assigned & weighted."},{t:"Mapped",d:"Linked to KPIs."},{t:"Reviewed",d:"Tracked on cadence."}],
  kras:["Framework completeness","Owner accountability","Strategic alignment"],
  kpis:[
    {n:"KRA coverage", t:"100% modules", f:"modules_with_kras / total_modules"},
    {n:"KRA-KPI linkage", t:"100%", f:"kras_with_kpis / total_kras"},
    {n:"On-target KRAs", t:"≥ 80%", f:"on_target / total_kras"},
  ],
  metrics:["KRAs defined","On-target %","Owners assigned","KPIs mapped"],
  calculations:[{n:"Weighted KRA attainment", f:"Σ(kra_score × weight)", d:"Program-level result attainment."}],
  dashboard:[
    {l:"KRAs Defined", v:"68", t:"all modules", trend:"flat"},
    {l:"On-Target", v:"81%", t:"target 80%", trend:"up"},
    {l:"Weighted Attainment", v:"83%", t:"+4pp QoQ", trend:"up"},
    {l:"Unmapped KRAs", v:"0", t:"fully linked", trend:"flat"},
  ],
  reports:["KRA Framework","Attainment Report","Owner Accountability Matrix"],
  ai:["Suggest KRAs from module objectives","Flag KRAs without supporting KPIs","Summarize attainment for leadership"],
  knowledge:["KRA design methodology","Goa KRA framework"],
  future:[{ph:"Next",t:"KRA tree visualization."},{ph:"Planned",t:"Auto-roll-up from KPIs."},{ph:"Vision",t:"Dynamic KRA weighting by program phase."}],
});

MODULES["kpis"] = M({
  id:"kpis", name:"KPIs", ic:"◇", group:"Performance",
  tagline:"The measurable indicators — with targets and formulas — that show whether each KRA is being achieved.",
  overview:"The KPI layer is the platform's measurement library. Every KPI carries a definition, a formula, a target, an owner and a data source — and links up to a KRA and down to raw metrics. This is what makes DIIP's numbers trustworthy and comparable across geographies.",
  why:"KPIs without explicit formulas and owners drift into vanity numbers. A governed KPI library is what lets a Director trust a green dashboard and compare Goa to the next launch fairly.",
  objectives:[
    {t:"Define every KPI", d:"Formula, target, owner, source — no ambiguity."},
    {t:"Link up and down", d:"KPI ↔ KRA and KPI ↔ metrics."},
    {t:"Standardize across geos", d:"Same definitions everywhere."},
    {t:"Govern changes", d:"KPI definitions are version-controlled."},
  ],
  executionFlow:["Define KPI","Set Formula & Target","Assign Owner & Source","Link KRA & Metrics","Monitor"],
  activities:["KPI definition & formula","Target setting","Owner & source assignment","Linkage to KRAs/metrics"],
  deliverables:["KPI Library","KPI Definition Sheets","Target Book"],
  owners:[{r:"Performance Analyst", x:"Owns the KPI library"},{r:"Module Owners", x:"Own their KPIs"}],
  dependencies:["KRAs (parent)","Metrics (inputs)","Analytics (display)"],
  workflow:[{t:"Defined",d:"Formula & target set."},{t:"Linked",d:"KRA & metrics mapped."},{t:"Live",d:"Tracking against target."},{t:"Reviewed",d:"Recalibrated per phase."}],
  kras:["Definition rigor","Target realism","Measurement integrity"],
  kpis:[
    {n:"KPIs with formulas", t:"100%", f:"defined_formula / total_kpis"},
    {n:"KPIs on-target", t:"≥ 75%", f:"on_target / total_kpis"},
    {n:"Data freshness", t:"≤ 24 hrs", f:"avg(now − last_update)"},
  ],
  metrics:["KPIs defined","On-target %","Off-target count","Data freshness"],
  calculations:[{n:"KPI attainment", f:"actual / target (capped 100%+)", d:"Per-KPI achievement vs target."}],
  dashboard:[
    {l:"KPIs Tracked", v:"180+", t:"all modules", trend:"flat"},
    {l:"On-Target", v:"77%", t:"target 75%", trend:"up"},
    {l:"Off-Target", v:"24", t:"−6 MoM", trend:"up"},
    {l:"Data Freshness", v:"<24h", t:"governed", trend:"flat"},
  ],
  reports:["KPI Library Export","Attainment Dashboard","Off-Target Report"],
  ai:["Explain what's driving a KPI off-target","Suggest realistic targets from benchmarks","Detect KPIs with stale data"],
  knowledge:["KPI definition standards","Goa target book","Benchmark library"],
  future:[{ph:"Next",t:"KPI drill-down to source metrics."},{ph:"Planned",t:"Anomaly detection on every KPI."},{ph:"Vision",t:"Self-calibrating targets by phase & geography."}],
});

MODULES["metrics"] = M({
  id:"metrics", name:"Metrics", ic:"∿", group:"Performance",
  tagline:"The granular, raw measurements captured across every module — the foundation KPIs are computed from.",
  overview:"Metrics are the raw, granular measurements the whole performance stack is built on — counts, durations, amounts, rates captured by each module's activity. KPIs are computed from metrics; metrics are the audit trail. This layer ensures every number on the platform is traceable to a source.",
  why:"You can't trust a KPI you can't trace. A clean metric layer makes the entire performance system auditable and debuggable.",
  objectives:[
    {t:"Capture at source", d:"Metrics recorded where activity happens."},
    {t:"Standardize units", d:"Consistent definitions & units everywhere."},
    {t:"Feed KPIs", d:"Reliable inputs to every calculation."},
    {t:"Stay auditable", d:"Every metric traceable to its source."},
  ],
  executionFlow:["Capture","Validate","Store","Aggregate","Serve to KPIs"],
  activities:["Metric capture","Validation & cleansing","Aggregation","Serving to KPI engine"],
  deliverables:["Metric Catalog","Data Quality Report","Aggregation Schema"],
  owners:[{r:"Data Engineer", x:"Owns capture & quality"},{r:"Module Owners", x:"Metric definitions"}],
  dependencies:["All modules (source)","KPIs (consumer)"],
  workflow:[{t:"Captured",d:"Recorded at source."},{t:"Validated",d:"Quality-checked."},{t:"Aggregated",d:"Rolled to hierarchy."},{t:"Served",d:"Available to KPIs."}],
  kras:["Capture coverage","Data quality","Traceability"],
  kpis:[
    {n:"Metric completeness", t:"≥ 98%", f:"captured / expected"},
    {n:"Data quality score", t:"≥ 95%", f:"valid_records / total_records"},
    {n:"Traceability", t:"100%", f:"traceable_kpis / total_kpis"},
  ],
  metrics:["Metrics cataloged","Completeness %","Quality score","Sources connected"],
  calculations:[{n:"Data quality index", f:"(completeness × .5)+(validity × .3)+(timeliness × .2)", d:"Overall trustworthiness of the data layer."}],
  dashboard:[
    {l:"Metrics Cataloged", v:"540+", t:"governed", trend:"flat"},
    {l:"Completeness", v:"98.4%", t:"target 98%", trend:"up"},
    {l:"Quality Score", v:"96%", t:"target 95%", trend:"up"},
    {l:"Sources Live", v:"24", t:"all modules", trend:"flat"},
  ],
  reports:["Metric Catalog","Data Quality Report","Source Health"],
  ai:["Flag metrics with quality issues","Suggest missing metrics for a KPI","Explain data lineage for any number"],
  knowledge:["Metric definition standards","Data quality playbook"],
  future:[{ph:"Next",t:"Data lineage explorer."},{ph:"Planned",t:"Automated quality monitoring."},{ph:"Vision",t:"Self-healing data pipelines."}],
});

MODULES["scorecards"] = M({
  id:"scorecards", name:"Scorecards", ic:"▥", group:"Performance",
  tagline:"Role- and module-level scorecards that summarize performance at a glance for owners and leadership.",
  overview:"Scorecards present performance in a consistent, at-a-glance format for each owner, module and geography. They combine KRA attainment, KPI status and trend into a single graded view — the artifact used in reviews to hold the program accountable.",
  why:"Dashboards show everything; scorecards show what matters to a specific owner. They turn the measurement system into accountable, reviewable performance.",
  objectives:[
    {t:"Summarize cleanly", d:"One graded view per owner/module."},
    {t:"Standardize grading", d:"Same scoring logic everywhere."},
    {t:"Drive reviews", d:"The artifact for performance cadence."},
    {t:"Compare fairly", d:"Across owners, modules & geographies."},
  ],
  executionFlow:["Aggregate KRAs/KPIs","Apply Grading","Generate Scorecard","Review","Action"],
  activities:["Scorecard configuration","Grading logic","Generation & distribution","Review facilitation"],
  deliverables:["Module Scorecards","Owner Scorecards","Geography Scorecards"],
  owners:[{r:"Performance Analyst", x:"Owns scorecard system"},{r:"Module Owners", x:"Reviewed parties"}],
  dependencies:["KRAs, KPIs, Metrics"],
  workflow:[{t:"Configured",d:"Scorecard set up."},{t:"Generated",d:"Auto-built from data."},{t:"Reviewed",d:"Discussed in cadence."},{t:"Actioned",d:"Improvements assigned."}],
  kras:["Coverage","Review discipline","Performance improvement"],
  kpis:[
    {n:"Scorecard coverage", t:"100% owners", f:"owners_with_scorecards / total"},
    {n:"Review cadence adherence", t:"≥ 95%", f:"reviews_held / scheduled"},
    {n:"Avg scorecard grade", t:"≥ B+", f:"mean(scorecard_grades)"},
  ],
  metrics:["Scorecards live","Avg grade","Reviews held","Actions raised"],
  calculations:[{n:"Composite grade", f:"weighted(kra_attainment, kpi_status, trend)", d:"Single grade per scorecard."}],
  dashboard:[
    {l:"Scorecards Live", v:"42", t:"all owners", trend:"flat"},
    {l:"Avg Grade", v:"B+", t:"+ trend", trend:"up"},
    {l:"Review Adherence", v:"96%", t:"on cadence", trend:"up"},
    {l:"Actions Open", v:"31", t:"tracked", trend:"flat"},
  ],
  reports:["Owner Scorecards","Module Scorecards","Review Pack"],
  ai:["Auto-generate the narrative for each scorecard","Highlight biggest movers","Suggest focus areas per owner"],
  knowledge:["Scorecard grading rubric","Review facilitation guide"],
  future:[{ph:"Next",t:"Interactive scorecard drill-down."},{ph:"Planned",t:"Peer & geography benchmarking."},{ph:"Vision",t:"AI performance coach per owner."}],
});

MODULES["analytics"] = M({
  id:"analytics", name:"Analytics", ic:"📊", group:"Performance",
  tagline:"Interactive geography-driven analytics — select any level from India to a single outlet and every domain updates.",
  overview:"Analytics is DIIP's interactive intelligence surface. Select any level of the geography hierarchy — India → State → District → Taluka → Panchayat → Village → Cluster → Outlet — and every domain panel updates in context: Marketing, Acquisition, Engagement, BTL, Government, Infrastructure, Operations, Finance and Reports. It is how leadership explores performance from the whole program down to a single return point.",
  why:"A national number hides local truth. Geography-driven analytics lets the program find exactly where it's winning and where it's stuck, at any altitude, in one consistent view.",
  objectives:[
    {t:"Explore at any level", d:"Nation to outlet, one click."},
    {t:"Context everywhere", d:"Every domain reflects the selected geography."},
    {t:"Find the signal", d:"Spot outliers and patterns fast."},
    {t:"Drive decisions", d:"From insight to action, in context."},
  ],
  executionFlow:["Select Geography","Load Domain Context","Compare & Drill","Spot Patterns","Decide & Act"],
  activities:["Geography selection","Domain panel rendering","Comparison & drill-down","Pattern detection"],
  deliverables:["Interactive Analytics Workspace","Domain Insight Panels","Comparison Views"],
  owners:[{r:"Analytics Lead", x:"Owns the analytics surface"},{r:"All Owners", x:"Consume insights"}],
  dependencies:["Geography Engine (hierarchy)","Metrics/KPIs (data)","All modules (domain data)"],
  workflow:[{t:"Selected",d:"Geography chosen."},{t:"Loaded",d:"Domains contextualized."},{t:"Explored",d:"Drilled & compared."},{t:"Actioned",d:"Insight to decision."}],
  kras:["Insight accessibility","Decision support","Data trust"],
  kpis:[
    {n:"Geography depth available", t:"8 levels", f:"levels_navigable"},
    {n:"Domains contextualized", t:"9 / 9", f:"domains_loaded / 9"},
    {n:"Insight-to-action rate", t:"track", f:"actions_from_analytics / insights_viewed"},
  ],
  metrics:["Levels navigable","Domains live","Drill-downs/session","Outliers flagged"],
  calculations:[{n:"Roll-up integrity", f:"Σ(child_values) == parent_value", d:"Lower levels must sum to the level above."}],
  dashboard:[
    {l:"Hierarchy Levels", v:"8", t:"India→Outlet", trend:"flat"},
    {l:"Domains Linked", v:"9", t:"all contextual", trend:"flat"},
    {l:"Outliers Flagged", v:"14", t:"this week", trend:"up"},
    {l:"Roll-up Integrity", v:"100%", t:"reconciled", trend:"flat"},
  ],
  reports:["Geography Performance Pack","Domain Comparison","Outlier Report"],
  ai:["Explain KPI movements & trends in plain language","Compare any two geographies","Surface the most important insight for the selected level"],
  knowledge:["Analytics interpretation guide","Goa performance baselines"],
  custom:"analytics",
  future:[{ph:"Next",t:"Map-based geography selection."},{ph:"Planned",t:"Natural-language analytics queries."},{ph:"Vision",t:"Proactive insight push to owners."}],
});

MODULES["reports"] = M({
  id:"reports", name:"Reports", ic:"🗎", group:"Performance",
  tagline:"On-demand and scheduled reports across every module, audience and geography — board, government and operational.",
  overview:"The Reports module is the program's publishing house: standardized, on-demand and scheduled reports for every audience — board decks, government submissions, operational reports, partner updates — generated from the same governed data so every report tells a consistent story.",
  why:"Reporting consumes enormous effort and still produces inconsistent numbers. A central report engine working off governed data makes reporting fast, consistent and trustworthy.",
  objectives:[
    {t:"Standardize outputs", d:"Consistent templates per audience."},
    {t:"Automate generation", d:"Scheduled & on-demand from live data."},
    {t:"Single source", d:"Every report off the same numbers."},
    {t:"Audience-fit", d:"Right depth for board vs ops vs government."},
  ],
  executionFlow:["Select Template","Set Scope & Period","Generate","Review","Distribute"],
  activities:["Template management","Report generation","Review & approval","Scheduled distribution"],
  deliverables:["Report Library","Board Pack","Government Submissions","Operational Reports"],
  owners:[{r:"Reporting Lead", x:"Owns templates & cadence"},{r:"Module Owners", x:"Provide content"}],
  dependencies:["Analytics, KPIs, Metrics","AI Report Generator"],
  workflow:[{t:"Configured",d:"Template & scope set."},{t:"Generated",d:"Built from data."},{t:"Approved",d:"Reviewed & signed off."},{t:"Distributed",d:"Sent on schedule."}],
  kras:["Reporting efficiency","Consistency","Timeliness"],
  kpis:[
    {n:"On-time reports", t:"≥ 98%", f:"on_time / scheduled"},
    {n:"Generation time", t:"≤ minutes", f:"avg(generated − requested)"},
    {n:"Data consistency", t:"100%", f:"reports_off_single_source / total"},
  ],
  metrics:["Reports generated","On-time %","Templates","Avg gen time"],
  calculations:[{n:"Reporting effort saved", f:"manual_hours_baseline − automated_hours", d:"Time reclaimed via automation."}],
  dashboard:[
    {l:"Report Templates", v:"36", t:"all audiences", trend:"flat"},
    {l:"On-time Rate", v:"98%", t:"governed", trend:"up"},
    {l:"Avg Gen Time", v:"<2m", t:"automated", trend:"up"},
    {l:"Effort Saved", v:"~60%", t:"vs manual", trend:"up"},
  ],
  reports:["Board Pack","Government Submission","Operational Report","Partner Update"],
  ai:["Generate a full report from a template & scope","Write the executive summary","Translate & localize reports"],
  knowledge:["Report templates","Board reporting standards","Government submission formats"],
  future:[{ph:"Next",t:"One-click board deck export."},{ph:"Planned",t:"Narrative auto-generation per report."},{ph:"Vision",t:"Conversational report building."}],
});

/* ============================================================
   KNOWLEDGE MODULES
   ============================================================ */

MODULES["knowledge-hub"] = M({
  id:"knowledge-hub", name:"Knowledge Hub", ic:"📚", group:"Knowledge",
  tagline:"The searchable institutional memory — everything learned, reusable, across every DRS implementation.",
  overview:"The Knowledge Hub is DIIP's institutional memory: a searchable home for SOPs, templates, case studies, lessons and best practices generated across every implementation. Powered by AI semantic search, it lets a team launching a new geography stand on everything learned in Goa.",
  why:"The biggest cost in DRS scaling is re-learning what's already known. A living knowledge base turns each launch's hard-won lessons into reusable assets for the next.",
  objectives:[
    {t:"Capture everything", d:"SOPs, templates, cases, lessons in one home."},
    {t:"Make it findable", d:"AI semantic search across all knowledge."},
    {t:"Drive reuse", d:"Past work as a starting point, not a memory."},
    {t:"Grow with every launch", d:"Each geography enriches the hub."},
  ],
  executionFlow:["Capture","Categorize","Index (semantic)","Search & Reuse","Curate"],
  activities:["Knowledge capture","Categorization & tagging","Semantic indexing","Curation & quality"],
  deliverables:["Knowledge Hub","Search Index","Curated Collections"],
  owners:[{r:"Knowledge Lead", x:"Owns the hub & curation"},{r:"All Owners", x:"Contribute knowledge"}],
  dependencies:["All modules (content)","AI Knowledge Search"],
  workflow:[{t:"Captured",d:"Knowledge added."},{t:"Indexed",d:"Semantically searchable."},{t:"Reused",d:"Applied to new work."},{t:"Curated",d:"Kept fresh & accurate."}],
  kras:["Knowledge coverage","Reuse rate","Findability"],
  kpis:[
    {n:"Search success rate", t:"≥ 85%", f:"successful_searches / total"},
    {n:"Reuse rate", t:"≥ 50%", f:"reused_assets / new_work"},
    {n:"Coverage", t:"all modules", f:"modules_with_content / total"},
  ],
  metrics:["Articles","Searches","Reuse events","Coverage %"],
  calculations:[{n:"Knowledge reuse value", f:"reuse_events × avg_hours_saved", d:"Time saved by not re-creating."}],
  dashboard:[
    {l:"Knowledge Items", v:"1,240", t:"+90 this month", trend:"up"},
    {l:"Search Success", v:"87%", t:"target 85%", trend:"up"},
    {l:"Reuse Rate", v:"53%", t:"target 50%", trend:"up"},
    {l:"Module Coverage", v:"100%", t:"all modules", trend:"flat"},
  ],
  reports:["Knowledge Coverage Report","Search Analytics","Top Reused Assets"],
  ai:["Semantic search across all knowledge","Find similar past implementation cases","Reuse & adapt past proposals"],
  knowledge:["This is the hub itself"],
  future:[{ph:"Next",t:"AI-suggested knowledge while you work."},{ph:"Planned",t:"Auto-summarized knowledge cards."},{ph:"Vision",t:"Knowledge graph linking every learning."}],
});

["sop","templates","case-studies","lessons","best-practices"].forEach(()=>{});

MODULES["sop"] = M({
  id:"sop", name:"SOP Library", ic:"📋", group:"Knowledge",
  tagline:"Standard Operating Procedures for every repeatable process — the how-to backbone of consistent execution.",
  overview:"The SOP Library holds the standard operating procedures for every repeatable process across the program — from site survey to refund reconciliation to government briefing. SOPs make execution consistent regardless of who runs it, and accelerate onboarding in new geographies.",
  why:"Consistency at scale comes from documented process, not heroics. SOPs are what let a new geography execute to the same standard as Goa from day one.",
  objectives:[
    {t:"Document the how", d:"Step-by-step for every key process."},
    {t:"Ensure consistency", d:"Same standard regardless of operator."},
    {t:"Speed onboarding", d:"New teams ramp fast."},
    {t:"Keep current", d:"SOPs versioned & reviewed."},
  ],
  executionFlow:["Identify Process","Document SOP","Review & Approve","Publish","Maintain"],
  activities:["Process identification","SOP authoring","Review & approval","Versioning"],
  deliverables:["SOP Library","Process Index","Version History"],
  owners:[{r:"Knowledge Lead", x:"Owns SOP governance"},{r:"Process Owners", x:"Author SOPs"}],
  dependencies:["All modules (processes)","Knowledge Hub (housing)"],
  workflow:[{t:"Drafted",d:"SOP written."},{t:"Approved",d:"Reviewed & signed."},{t:"Published",d:"In use."},{t:"Maintained",d:"Reviewed on cadence."}],
  kras:["SOP coverage","Currency","Adoption"],
  kpis:[
    {n:"Process coverage", t:"100% critical", f:"documented / critical_processes"},
    {n:"SOP currency", t:"≤ 6 mo old", f:"avg(now − last_review)"},
    {n:"Adoption", t:"≥ 90%", f:"following_sop / total_executions"},
  ],
  metrics:["SOPs published","Coverage %","Avg age","Adoption %"],
  calculations:[{n:"SOP health", f:"(coverage × .5)+(currency × .3)+(adoption × .2)", d:"Overall SOP-system health."}],
  dashboard:[
    {l:"SOPs Published", v:"148", t:"all critical", trend:"up"},
    {l:"Coverage", v:"100%", t:"critical proc.", trend:"flat"},
    {l:"Avg Age", v:"3.2mo", t:"fresh", trend:"up"},
    {l:"Adoption", v:"91%", t:"target 90%", trend:"up"},
  ],
  reports:["SOP Index","Currency Report","Adoption Report"],
  ai:["Draft an SOP from a process description","Flag SOPs overdue for review","Find the right SOP for a task"],
  knowledge:["SOP authoring standards","Goa SOP set"],
  future:[{ph:"Next",t:"In-context SOP surfacing."},{ph:"Planned",t:"SOP adherence tracking."},{ph:"Vision",t:"AI-maintained living SOPs."}],
});

MODULES["templates"] = M({
  id:"templates", name:"Templates", ic:"🗂", group:"Knowledge",
  tagline:"Reusable starting points — documents, decks, agreements, plans — that make every output faster and on-standard.",
  overview:"The Templates library provides reusable starting points for the documents the program produces repeatedly: agreements, briefing notes, campaign kits, project plans, report formats. Templates cut creation time and guarantee outputs meet standard.",
  why:"Re-creating documents from scratch is slow and inconsistent. A strong template library is one of the fastest levers for both speed and quality across a scaling program.",
  objectives:[
    {t:"Cover key outputs", d:"A template for every recurring document."},
    {t:"Guarantee standard", d:"On-brand, complete, compliant by default."},
    {t:"Cut creation time", d:"Start from 70%, not zero."},
    {t:"Localize-ready", d:"Built to adapt per geography."},
  ],
  executionFlow:["Identify Need","Build Template","Approve","Publish","Refresh"],
  activities:["Template identification","Authoring","Approval","Maintenance"],
  deliverables:["Template Library","Template Index"],
  owners:[{r:"Knowledge Lead", x:"Owns the library"},{r:"Module Owners", x:"Author templates"}],
  dependencies:["Communication, Reports (consumers)","Knowledge Hub"],
  workflow:[{t:"Drafted",d:"Template built."},{t:"Approved",d:"Standard-checked."},{t:"Published",d:"Available."},{t:"Refreshed",d:"Kept current."}],
  kras:["Template coverage","Usage","Time saved"],
  kpis:[
    {n:"Template usage rate", t:"≥ 70%", f:"from_template / total_documents"},
    {n:"Coverage of recurring docs", t:"≥ 90%", f:"templated / recurring_doc_types"},
    {n:"Avg time saved", t:"track", f:"baseline_time − template_time"},
  ],
  metrics:["Templates","Usage rate","Coverage %","Time saved"],
  calculations:[{n:"Time saved", f:"uses × (scratch_time − template_time)", d:"Aggregate creation time reclaimed."}],
  dashboard:[
    {l:"Templates", v:"96", t:"all key docs", trend:"up"},
    {l:"Usage Rate", v:"72%", t:"target 70%", trend:"up"},
    {l:"Coverage", v:"91%", t:"recurring docs", trend:"up"},
    {l:"Time Saved", v:"~55%", t:"per doc", trend:"up"},
  ],
  reports:["Template Index","Usage Report"],
  ai:["Pre-fill a template from project context","Suggest the right template for a task","Generate new templates from past documents"],
  knowledge:["Template standards","Goa template set"],
  future:[{ph:"Next",t:"Smart auto-fill from project data."},{ph:"Planned",t:"Template usage analytics."},{ph:"Vision",t:"AI composes documents from templates + context."}],
});

MODULES["case-studies"] = M({
  id:"case-studies", name:"Case Studies", ic:"📁", group:"Knowledge",
  tagline:"Documented implementations — what was tried, what happened, what worked — as evidence and as a playbook.",
  overview:"Case Studies document real implementations end-to-end: context, approach, results and what made the difference. They serve as persuasive evidence for stakeholders and as a detailed playbook for teams launching comparable geographies.",
  why:"Decision-makers trust evidence over theory. Well-documented cases both win stakeholder confidence and shortcut the learning curve for the next launch.",
  objectives:[
    {t:"Document end-to-end", d:"Context → approach → results."},
    {t:"Extract what worked", d:"The transferable lessons."},
    {t:"Persuade stakeholders", d:"Evidence for new geographies."},
    {t:"Guide replication", d:"A playbook for similar contexts."},
  ],
  executionFlow:["Select Case","Gather Data","Write Case","Extract Lessons","Publish"],
  activities:["Case selection","Data gathering","Writing","Lesson extraction"],
  deliverables:["Case Study Library","Goa Flagship Case","Lesson Extracts"],
  owners:[{r:"Knowledge Lead", x:"Owns case program"},{r:"Program Manager", x:"Provides data"}],
  dependencies:["Post-Launch (results)","Knowledge Hub"],
  workflow:[{t:"Scoped",d:"Case chosen."},{t:"Drafted",d:"Written from data."},{t:"Reviewed",d:"Validated."},{t:"Published",d:"In library."}],
  kras:["Case coverage","Quality","Influence"],
  kpis:[
    {n:"Cases published", t:"≥ 1 per geography", f:"count(published_cases)"},
    {n:"Use in pitches", t:"track", f:"cases_used_in_pitches"},
    {n:"Lessons extracted", t:"≥ 5 per case", f:"lessons / cases"},
  ],
  metrics:["Cases published","Lessons extracted","Pitch usage"],
  calculations:[{n:"Replication value", f:"cases_reused × avg_ramp_time_saved", d:"Faster ramp from learning by example."}],
  dashboard:[
    {l:"Cases Published", v:"7", t:"+Goa flagship", trend:"up"},
    {l:"Lessons Extracted", v:"58", t:"transferable", trend:"up"},
    {l:"Pitch Usage", v:"22", t:"this year", trend:"up"},
    {l:"Geographies Covered", v:"4", t:"+ comparables", trend:"up"},
  ],
  reports:["Case Study Library","Flagship Goa Case","Lessons Digest"],
  ai:["Draft a case study from program data","Find the most relevant case for a context","Extract transferable lessons automatically"],
  knowledge:["Case writing standards","Goa flagship case"],
  future:[{ph:"Next",t:"Interactive case explorer."},{ph:"Planned",t:"Auto-generated cases from project data."},{ph:"Vision",t:"Case-matching to recommend approaches."}],
});

MODULES["lessons"] = M({
  id:"lessons", name:"Lessons Learned", ic:"💡", group:"Knowledge",
  tagline:"The candid record of what worked, what didn't and why — so mistakes aren't repeated geography to geography.",
  overview:"Lessons Learned is the program's candid memory: what worked, what failed, what surprised us, and what we'd do differently. Captured continuously (not just at the end), tagged to modules and contexts, it ensures hard lessons translate into changed practice — not repeated mistakes.",
  why:"Organizations repeat expensive mistakes because lessons live in people's heads and leave with them. Systematic lesson capture is how a program actually gets wiser over time.",
  objectives:[
    {t:"Capture candidly", d:"Including failures, without blame."},
    {t:"Capture continuously", d:"As lessons happen, not just post-mortem."},
    {t:"Tag for retrieval", d:"By module, context & geography."},
    {t:"Change practice", d:"Lessons feed SOPs & best practices."},
  ],
  executionFlow:["Capture Lesson","Categorize","Validate","Apply to Practice","Share"],
  activities:["Lesson capture","Categorization","Validation","Application to SOPs/practices"],
  deliverables:["Lessons Register","Applied-Lessons Log"],
  owners:[{r:"Knowledge Lead", x:"Owns lessons program"},{r:"All Owners", x:"Contribute lessons"}],
  dependencies:["All modules","Best Practices, SOPs (downstream)"],
  workflow:[{t:"Captured",d:"Lesson logged."},{t:"Validated",d:"Confirmed & tagged."},{t:"Applied",d:"Practice updated."},{t:"Shared",d:"Broadcast to teams."}],
  kras:["Capture rate","Application rate","Repeat-mistake reduction"],
  kpis:[
    {n:"Lessons captured", t:"continuous", f:"count(lessons_logged)"},
    {n:"Application rate", t:"≥ 60%", f:"applied / captured"},
    {n:"Repeat mistakes", t:"↓ trend", f:"recurring_issues / period"},
  ],
  metrics:["Lessons logged","Applied %","Repeat issues","By module"],
  calculations:[{n:"Learning conversion", f:"lessons_applied / lessons_captured", d:"How much learning becomes changed practice."}],
  dashboard:[
    {l:"Lessons Logged", v:"312", t:"continuous", trend:"up"},
    {l:"Applied Rate", v:"63%", t:"target 60%", trend:"up"},
    {l:"Repeat Issues", v:"−40%", t:"YoY", trend:"up"},
    {l:"Modules Covered", v:"24", t:"all", trend:"flat"},
  ],
  reports:["Lessons Register","Applied-Lessons Report","Repeat-Issue Trend"],
  ai:["Cluster lessons into themes","Recommend lessons relevant to current work","Convert lessons into SOP/best-practice updates"],
  knowledge:["Lesson capture method","Goa lessons register"],
  future:[{ph:"Next",t:"Contextual lesson prompts during work."},{ph:"Planned",t:"Theme trend analysis."},{ph:"Vision",t:"Predictive 'you may hit this' warnings."}],
});

MODULES["best-practices"] = M({
  id:"best-practices", name:"Best Practices", ic:"⭐", group:"Knowledge",
  tagline:"The validated, recommended way to do each thing — distilled from lessons and cases into authoritative guidance.",
  overview:"Best Practices distill validated lessons and case evidence into the authoritative, recommended way to execute each part of a DRS implementation. They are the program's accumulated wisdom, promoted from lessons that proved repeatable and adopted as standard.",
  why:"Lessons are raw; best practices are refined. Promoting validated lessons into authoritative guidance is how a program converts experience into a durable competitive advantage.",
  objectives:[
    {t:"Promote what works", d:"Validated lessons become standards."},
    {t:"Be authoritative", d:"The recommended way, clearly stated."},
    {t:"Drive adoption", d:"Practices embedded into SOPs & training."},
    {t:"Evolve continuously", d:"Updated as better ways emerge."},
  ],
  executionFlow:["Identify Candidate","Validate","Document Practice","Adopt","Review"],
  activities:["Candidate identification","Validation","Documentation","Adoption & training"],
  deliverables:["Best Practice Library","Adoption Guidance"],
  owners:[{r:"Knowledge Lead", x:"Owns best-practice library"},{r:"Module Owners", x:"Validate & adopt"}],
  dependencies:["Lessons Learned, Case Studies (source)","SOPs, training (downstream)"],
  workflow:[{t:"Candidate",d:"Promising practice spotted."},{t:"Validated",d:"Proven repeatable."},{t:"Adopted",d:"Made standard."},{t:"Reviewed",d:"Kept current."}],
  kras:["Practice quality","Adoption","Performance impact"],
  kpis:[
    {n:"Best practices documented", t:"all key areas", f:"count(documented)"},
    {n:"Adoption rate", t:"≥ 80%", f:"teams_adopting / total"},
    {n:"Performance lift", t:"positive", f:"metric_delta_post_adoption"},
  ],
  metrics:["Practices documented","Adoption %","Performance lift"],
  calculations:[{n:"Practice impact", f:"avg(metric_after − metric_before)", d:"Measured uplift from adopting a practice."}],
  dashboard:[
    {l:"Best Practices", v:"74", t:"validated", trend:"up"},
    {l:"Adoption Rate", v:"82%", t:"target 80%", trend:"up"},
    {l:"Avg Perf Lift", v:"+12%", t:"post-adoption", trend:"up"},
    {l:"Areas Covered", v:"all", t:"modules", trend:"flat"},
  ],
  reports:["Best Practice Library","Adoption Report","Impact Analysis"],
  ai:["Promote validated lessons into best practices","Recommend relevant practices for current work","Measure practice impact automatically"],
  knowledge:["Best-practice standards","Goa best-practice set"],
  future:[{ph:"Next",t:"Practice recommendations in-context."},{ph:"Planned",t:"Impact measurement automation."},{ph:"Vision",t:"Self-evolving best-practice engine."}],
});

/* ============================================================
   AI MODULES  (AI is also embedded INSIDE every module)
   ============================================================ */
const AI_MODULES = {
  "ai-assistant": {
    id:"ai-assistant", name:"AI Assistant", ic:"✦",
    tagline:"A conversational copilot that understands the whole platform — ask anything, act anywhere.",
    overview:"The AI Assistant is the conversational layer across DIIP. It understands the project context, every module's data and the knowledge base — so a Director can ask 'what's blocking launch in North Goa?' or 'draft a briefing for the Pollution Control Board' and get a grounded, actionable answer.",
    caps:["Answer questions grounded in live project data","Navigate & explain any module","Draft documents & communications","Surface risks, blockers & next actions","Hand off to specialized AI tools"],
    example:"What are the top 3 risks to our launch date, and who owns them?",
  },
  "ai-search": {
    id:"ai-search", name:"AI Knowledge Search", ic:"✦",
    tagline:"Semantic search across all SOPs, cases, lessons, proposals and assets — find by meaning, not keywords.",
    overview:"AI Knowledge Search lets anyone find institutional knowledge by meaning. Instead of guessing filenames, ask 'how did we handle hotel resistance in Goa?' and get the relevant cases, lessons and assets — making the Knowledge Hub genuinely usable.",
    caps:["Semantic search across all knowledge","Find similar past implementation cases","Reuse & adapt past proposals","Surface relevant SOPs & templates in-context"],
    example:"Find proposals where we convinced municipalities to host return points.",
  },
  "ai-content": {
    id:"ai-content", name:"AI Content Generator", ic:"✦",
    tagline:"Generate on-brand content for any audience and channel — emails, posts, FAQs, scripts, localized.",
    overview:"The AI Content Generator produces on-brand communication for every channel and audience — emails, WhatsApp, SMS, social posts, FAQs, press releases — and localizes to any language or geography, working hand-in-hand with the Communication Center and Marketing System.",
    caps:["Draft any communication on-brand","Localize content per geography & language","Generate campaign concepts & variants","Produce FAQs & objection-handling scripts"],
    example:"Write a WhatsApp message in Konkani explaining how to claim a deposit refund.",
  },
  "ai-meeting": {
    id:"ai-meeting", name:"AI Meeting Assistant", ic:"✦",
    tagline:"Turn meetings into structured outcomes — summaries, decisions, commitments and follow-ups.",
    overview:"The AI Meeting Assistant converts government and stakeholder meetings into structured records: summaries, decisions, commitments and action items — automatically routed to Government Engagement, Acquisition and follow-up trackers so nothing is lost.",
    caps:["Summarize meetings into decisions & actions","Extract commitments & assign owners","Draft follow-up communications","Feed records into Government & Acquisition"],
    example:"Summarize today's meeting with the Tourism Department and list every commitment made.",
  },
  "ai-report": {
    id:"ai-report", name:"AI Report Generator", ic:"✦",
    tagline:"Generate complete, audience-fit reports and narratives from live data in minutes.",
    overview:"The AI Report Generator builds complete reports — board decks, government submissions, operational updates — from live platform data, writing the narrative and executive summary so reporting takes minutes, not days.",
    caps:["Generate full reports from templates & data","Write executive summaries & narratives","Tailor depth per audience","Translate & localize reports"],
    example:"Generate this month's board update for the Goa DRS program.",
  },
  "ai-analytics": {
    id:"ai-analytics", name:"AI Analytics Assistant", ic:"✦",
    tagline:"Ask questions of your data in plain language — explanations, trends and comparisons, instantly.",
    overview:"The AI Analytics Assistant makes the data conversational. Ask why return rate dipped in a taluka, compare two districts, or explain a KPI movement — and get a plain-language answer grounded in the numbers, working alongside the Analytics module.",
    caps:["Explain KPI movements in plain language","Compare any geographies or periods","Surface trends & anomalies","Recommend where to focus"],
    example:"Why did return rate drop in Bardez last week, and is it a trend?",
  },
};

/* ---------- AI-inside-every-module map (from the brief) ---------- */
const AI_IN_MODULE = {
  government:["Meeting summaries","Approval tracking","Briefing notes","Policy search"],
  "marketing-system":["Campaign ideas","Social posts","Localized messaging","FAQs"],
  acquisition:["Stakeholder prioritization","Outreach drafts","Follow-up summaries"],
  btl:["Activation ideas","Event checklists","Campaign performance summaries"],
  analytics:["KPI explanations","Trend analysis","Comparative insights"],
  "knowledge-hub":["Semantic search","Reusing past proposals","Finding similar implementation cases"],
};

/* ============================================================
   ROADMAP  (custom page)
   ============================================================ */
MODULES["roadmap"] = M({
  id:"roadmap", name:"Product Roadmap", ic:"🗺", group:"—",
  custom:"roadmap", hideFramework:true,
});

/* ============================================================
   HOW DIIP WORKS  (custom end-to-end flow page)
   ============================================================ */
MODULES["how"] = M({
  id:"how", name:"How DIIP Works", ic:"⮑", group:"—",
  custom:"how", hideFramework:true,
});

/* ============================================================
   SPECIAL DATA: ACQUISITION STAKEHOLDERS
   ============================================================ */
const STAKEHOLDERS = [
  { cat:"Government & Civic", items:[
    {n:"Government", ic:"🏛", pri:1, universe:"State + local bodies", accounts:"18 bodies", stage:"Negotiating", owner:"Govt Affairs", support:78, resistance:22, conv:62},
    {n:"Municipalities", ic:"🏢", pri:1, universe:"14 municipalities", accounts:"14", stage:"Engaged", owner:"Govt Affairs", support:64, resistance:30, conv:50},
    {n:"Village Panchayats", ic:"🏡", pri:2, universe:"191 panchayats", accounts:"191", stage:"Engaging", owner:"Field Team", support:58, resistance:28, conv:41},
  ]},
  { cat:"Industry & Brands", items:[
    {n:"PIBOs", ic:"🏭", pri:1, universe:"Producers/Importers/Brand-Owners", accounts:"120", stage:"Onboarding", owner:"Industry Lead", support:71, resistance:19, conv:55},
    {n:"Brands", ic:"🥤", pri:1, universe:"Beverage brands", accounts:"86", stage:"Negotiating", owner:"Industry Lead", support:66, resistance:24, conv:48},
    {n:"CSR Partners", ic:"🎗", pri:2, universe:"Corporate CSR arms", accounts:"40", stage:"Engaged", owner:"Partnerships", support:74, resistance:12, conv:52},
  ]},
  { cat:"Retail", items:[
    {n:"Retail Chains", ic:"🏬", pri:1, universe:"Organized retail", accounts:"32", stage:"Onboarding", owner:"Retail Lead", support:69, resistance:26, conv:58},
    {n:"Independent Retail", ic:"🏪", pri:2, universe:"~9,000 kirana", accounts:"9,000", stage:"Engaging", owner:"Field Team", support:52, resistance:34, conv:33},
  ]},
  { cat:"HORECA", items:[
    {n:"Hotels", ic:"🏨", pri:1, universe:"Star + boutique", accounts:"410", stage:"Negotiating", owner:"HORECA Lead", support:55, resistance:38, conv:39},
    {n:"Restaurants", ic:"🍽", pri:2, universe:"Licensed F&B", accounts:"2,200", stage:"Engaging", owner:"HORECA Lead", support:58, resistance:30, conv:42},
    {n:"Bars", ic:"🍸", pri:2, universe:"Licensed bars", accounts:"1,400", stage:"Engaging", owner:"HORECA Lead", support:51, resistance:36, conv:35},
    {n:"Beach Shacks", ic:"🏖", pri:2, universe:"Seasonal shacks", accounts:"360", stage:"Awareness", owner:"Field Team", support:47, resistance:33, conv:28},
    {n:"Casinos", ic:"🎰", pri:3, universe:"Offshore + onshore", accounts:"12", stage:"Engaged", owner:"HORECA Lead", support:60, resistance:22, conv:45},
  ]},
  { cat:"Institutions", items:[
    {n:"Schools", ic:"🏫", pri:2, universe:"Schools", accounts:"1,300", stage:"Onboarding", owner:"Community", support:82, resistance:8, conv:64},
    {n:"Colleges", ic:"🎓", pri:2, universe:"Colleges/universities", accounts:"110", stage:"Engaged", owner:"Community", support:79, resistance:10, conv:58},
  ]},
  { cat:"Value Chain", items:[
    {n:"Waste Collectors", ic:"🧹", pri:1, universe:"Informal + formal", accounts:"~3,500", stage:"Engaging", owner:"Operations", support:63, resistance:25, conv:44},
    {n:"Aggregators", ic:"📦", pri:1, universe:"Scrap aggregators", accounts:"180", stage:"Negotiating", owner:"Operations", support:67, resistance:20, conv:51},
    {n:"Recyclers", ic:"♻", pri:1, universe:"PET/glass recyclers", accounts:"24", stage:"Onboarding", owner:"Operations", support:75, resistance:14, conv:60},
  ]},
  { cat:"Civil Society", items:[
    {n:"NGOs", ic:"🤲", pri:2, universe:"Environmental NGOs", accounts:"55", stage:"Engaged", owner:"Partnerships", support:80, resistance:9, conv:57},
  ]},
];

const STK_ATTRIBUTES = ["Target Universe","Target Accounts","Priority","Acquisition Strategy","Engagement Strategy","Current Stage","Owner","Documents","Meetings","Follow-ups","Support Score","Resistance Score","Conversion Rate","KPIs"];

/* ============================================================
   SPECIAL DATA: ENGAGEMENT ACTIVITIES (referenced on Consumer/Stakeholder)
   ============================================================ */
const ENGAGEMENT_FLOW = ["Awareness","Education","Workshops","Training","Community Meetings","School Programs","Retail Sessions","Government Workshops","Industry Roundtables","Brand Sessions","NGO Engagement","Media Briefings","CSR Activities","Consumer Campaigns","Feedback Collection","Sentiment Tracking"];
const ENGAGEMENT_CAPTURE = ["Audience","Attendance","Reach","Feedback Score","Questions Raised","Issues Identified","Action Items","Impact Score"];

/* ============================================================
   SPECIAL DATA: COMMUNICATION
   ============================================================ */
const COMM_STREAMS = ["Internal","Government","Retail","Consumer","Brand","Media","Partner"];
const COMM_ASSETS = ["Emails","WhatsApp","SMS","Posters","Flyers","FAQs","Presentations","Press Releases","Videos","Social Media","Website Content"];

/* ============================================================
   SPECIAL DATA: RESISTANCE CATEGORIES
   ============================================================ */
const RESISTANCE_CATS = ["Government","Retail","Hotels","Consumers","Media","Political","Operational","Financial"];
const RESISTANCE_FIELDS = ["Root Cause","Impact","Mitigation","Owner","Timeline","Status","Resolution","Outcome"];
const RESISTANCE_SAMPLE = [
  {src:"Hotels", cause:"Fear of guest friction & extra handling", impact:"High", mit:"Concierge-return model + staff training", owner:"HORECA Lead", status:"Mitigating"},
  {src:"Retail", cause:"Space & labour for return handling", impact:"High", mit:"Compact RVM + handling fee", owner:"Retail Lead", status:"Mitigating"},
  {src:"Consumers", cause:"Perceived inconvenience of returning", impact:"Medium", mit:"Dense return network + awareness", owner:"Consumer Lead", status:"Mitigating"},
  {src:"Political", cause:"Concern over price perception", impact:"Medium", mit:"Framing as refundable deposit, not tax", owner:"Govt Affairs", status:"Monitoring"},
  {src:"Operational", cause:"Reverse-logistics capacity in peak season", impact:"Medium", mit:"Seasonal collection surge plan", owner:"Operations", status:"Planned"},
];

/* ============================================================
   SPECIAL DATA: GEOGRAPHY (Analytics interactive)
   ============================================================ */
const GEO_LEVELS = ["India","State","District","Taluka","Panchayat","Village","Cluster","Outlet"];
const GEO_TREE = [
  { name:"India", level:0, gico:"🇮🇳",
    sample:{returnRate:71, accounts:486, rvms:142, returns:"1.9M", coverage:68, support:46, leads:"24k", recovery:91} },
  { name:"Goa (State)", level:1, gico:"📍",
    sample:{returnRate:71, accounts:486, rvms:142, returns:"1.9M", coverage:68, support:46, leads:"24k", recovery:91} },
  { name:"North Goa (District)", level:2, gico:"🧭",
    sample:{returnRate:74, accounts:288, rvms:86, returns:"1.1M", coverage:72, support:49, leads:"15k", recovery:92} },
  { name:"Bardez (Taluka)", level:3, gico:"🗺",
    sample:{returnRate:77, accounts:142, rvms:44, returns:"560k", coverage:78, support:52, leads:"8.2k", recovery:93} },
  { name:"Calangute (Panchayat)", level:4, gico:"🏘",
    sample:{returnRate:79, accounts:38, rvms:12, returns:"180k", coverage:81, support:55, leads:"2.4k", recovery:94} },
  { name:"Calangute Village", level:5, gico:"🏡",
    sample:{returnRate:80, accounts:14, rvms:5, returns:"72k", coverage:83, support:57, leads:"940", recovery:94} },
  { name:"Beach Road Cluster", level:6, gico:"📌",
    sample:{returnRate:82, accounts:6, rvms:3, returns:"31k", coverage:86, support:60, leads:"410", recovery:95} },
  { name:"RVM-Calangute-03 (Outlet)", level:7, gico:"🔵",
    sample:{returnRate:84, accounts:1, rvms:1, returns:"9.8k", coverage:100, support:62, leads:"120", recovery:96} },
];
const GEO_DOMAINS = [
  {k:"Marketing", ic:"📣", metric:s=>`${s.support>50?"Strong":"Building"} awareness`, val:s=>`${Math.round(s.returnRate*0.78)}% aware`},
  {k:"Acquisition", ic:"🤝", metric:()=>"Accounts onboarded", val:s=>`${s.accounts}`},
  {k:"Engagement", ic:"👥", metric:()=>"Net support index", val:s=>`+${s.support}`},
  {k:"BTL", ic:"🎪", metric:()=>"Leads captured", val:s=>`${s.leads}`},
  {k:"Government", ic:"🏛", metric:()=>"Approvals / alignment", val:s=>`${s.support>50?"Aligned":"In progress"}`},
  {k:"Infrastructure", ic:"🏗", metric:()=>"RVMs live", val:s=>`${s.rvms}`},
  {k:"Operations", ic:"♻", metric:()=>"Containers returned", val:s=>`${s.returns}`},
  {k:"Finance", ic:"💰", metric:()=>"Material recovery", val:s=>`${s.recovery}%`},
  {k:"Reports", ic:"🗎", metric:()=>"Coverage achieved", val:s=>`${s.coverage}%`},
];

/* ============================================================
   END-TO-END EXECUTION FLOW (How DIIP Works)
   ============================================================ */
const E2E_FLOW = [
  {t:"Opportunity Identified", d:"A new geography or mandate enters the funnel.", link:"market-intel"},
  {t:"Project Created", d:"Opportunity becomes a tracked project in the portfolio.", link:"portfolio"},
  {t:"Implementation Model Selected", d:"Government-led, PIBO-led, hybrid or pilot.", link:"project-config"},
  {t:"Geography Template Loaded", d:"Hierarchy, stakeholders & benchmarks seeded.", link:"geography-engine"},
  {t:"Market Intelligence", d:"External signals gathered & synthesized.", link:"market-intel"},
  {t:"Market Assessment", d:"Readiness scored; go / phased / hold decided.", link:"market-assess"},
  {t:"Stakeholder Mapping", d:"Influence, interest & stance mapped.", link:"stakeholder-intel"},
  {t:"Government Engagement", d:"Approvals secured; officials aligned.", link:"government"},
  {t:"Resistance Assessment", d:"Opposition logged, owned & mitigated.", link:"resistance"},
  {t:"DRS Marketing System", d:"Narrative, brand & messaging set.", link:"marketing-system"},
  {t:"Go-To-Market Strategy", d:"Segments, channels, budget & calendar.", link:"gtm"},
  {t:"Acquisition & Partnerships", d:"Every stakeholder onboarded & governed.", link:"acquisition"},
  {t:"Consumer Engagement", d:"Awareness, participation & habit built.", link:"consumer"},
  {t:"Communication & BTL", d:"Assets distributed; activations run.", link:"btl"},
  {t:"Infrastructure Coordination", d:"Return network sited & installed.", link:"infrastructure"},
  {t:"Deployment Tracking", d:"Rollout monitored across the hierarchy.", link:"deployment"},
  {t:"Launch Readiness", d:"Cross-module go-live gate cleared.", link:"launch-ready"},
  {t:"Launch Management", d:"Go-live commanded; first days stabilized.", link:"launch-mgmt"},
  {t:"Post-Launch Optimization", d:"Performance lifted; learnings captured.", link:"post-launch"},
  {t:"Performance Analytics", d:"Measured at every geographic level.", link:"analytics"},
  {t:"Knowledge Capture", d:"SOPs, cases & lessons codified.", link:"knowledge-hub"},
  {t:"Reusable Blueprint", d:"Goa becomes the template for the next DRS — any domestic or international geography.", link:"geography-engine", final:true},
];
