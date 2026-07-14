/* ============================================================
   DIIP — Product Vision Portal — application / renderer
   ============================================================ */

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const el = (id) => document.getElementById(id);

/* ---------------- SIDEBAR ---------------- */
function renderSidebar() {
  const nav = el("nav");
  let html = "";
  NAV.forEach(group => {
    if (group.group && group.group !== "—") html += `<div class="nav-group-label">${esc(group.group)}</div>`;
    else html += `<div style="height:14px"></div>`;
    group.items.forEach(it => {
      const badge = it.badge ? `<span class="badge ${it.badge==="AI"?"ai":""}">${esc(it.badge)}</span>` : "";
      html += `<div class="nav-item" data-id="${it.id}"><span class="ic">${it.ic||"◇"}</span><span>${esc(it.name)}</span>${badge}</div>`;
    });
  });
  nav.innerHTML = html;
  nav.querySelectorAll(".nav-item").forEach(n => n.addEventListener("click", () => go(n.dataset.id)));
}

function setActiveNav(id) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.id === id));
}

/* ---------------- NAV HELPERS ---------------- */
function navItemById(id){
  for (const g of NAV) for (const it of g.items) if (it.id===id) return {item:it, group:g.group};
  return {item:{id, name:id, ic:"◇"}, group:""};
}

/* ---------------- ROUTER ---------------- */
function go(id) {
  const mod = MODULES[id] || (AI_MODULES[id] ? null : null);
  setActiveNav(id);
  window.scrollTo({top:0, behavior:"instant"});
  const content = el("content");

  // breadcrumb
  const {item, group} = navItemById(id);
  el("breadcrumb").innerHTML = `<span>DIIP</span><span class="sep">›</span><span>${esc(group||"")}</span><span class="sep">›</span><b>${esc(item.name)}</b>`;

  if (AI_MODULES[id]) { content.innerHTML = renderAIModule(AI_MODULES[id]); afterRender(id); return; }

  const m = MODULES[id];
  if (!m) { content.innerHTML = `<div class="card">Coming soon.</div>`; return; }

  if (m.custom && m.hideFramework) {
    content.innerHTML = CUSTOM[m.custom] ? CUSTOM[m.custom](m) : "";
  } else {
    content.innerHTML = renderModule(m);
  }
  afterRender(id);
  try { location.hash = id; } catch(e){}
}

function afterRender(id){
  // chip nav scroll-spy + click
  const chips = document.querySelectorAll(".chip");
  chips.forEach(c => c.addEventListener("click", () => {
    const t = el(c.dataset.target);
    if (t) window.scrollTo({top: t.getBoundingClientRect().top + window.scrollY - 130, behavior:"smooth"});
  }));
  // attach any custom interactions
  if (CUSTOM_INIT[id]) CUSTOM_INIT[id]();
  // generic stakeholder cards / e2e links
  document.querySelectorAll("[data-goto]").forEach(n => n.addEventListener("click", () => go(n.dataset.goto)));
  // close mobile sidebar
  el("sidebar").classList.remove("open");
}

/* ============================================================
   GENERIC MODULE (the consistent 20-section framework)
   ============================================================ */
const SECTIONS = [
  ["overview","Overview"],["objectives","Objectives"],["why","Why This Module Exists"],
  ["flow","Execution Flow"],["activities","Activities"],["deliverables","Deliverables"],
  ["owners","Owners"],["dependencies","Dependencies"],["workflow","Workflow"],
  ["kras","KRAs"],["kpis","KPIs"],["metrics","Metrics"],["calc","Calculations"],
  ["dashboard","Dashboard Preview"],["reports","Reports Generated"],["ai","AI Assistance"],
  ["knowledge","Knowledge Base"],["future","Future Enhancements"],
];

function chipNav(extra){
  let chips = SECTIONS.map(([k,label]) => `<div class="chip" data-target="sec-${k}">${esc(label)}</div>`);
  if (extra) chips.unshift(`<div class="chip" data-target="sec-${extra.k}">${esc(extra.label)}</div>`);
  return `<div class="chipnav">${chips.join("")}</div>`;
}

function sec(k, num, title, sub, body){
  return `<section class="section" id="sec-${k}">
    <h2><span class="num">${num}</span>${esc(title)}</h2>
    ${sub?`<div class="sub">${sub}</div>`:""}
    ${body}
  </section>`;
}

function pageHead(m){
  return `<div class="page-head">
    <div class="picon">${m.ic}</div>
    <div>
      <div class="kicker">${esc(m.group)} MODULE</div>
      <h1>${esc(m.name)}</h1>
      <p class="tagline">${m.tagline||""}</p>
    </div>
  </div>`;
}

function flowHTML(steps){
  return `<div class="flow">${steps.map((s,i)=>`<div class="step"><span class="n">${i+1}</span><span>${esc(s)}</span></div>`).join("")}</div>`;
}
function vflowHTML(steps){
  return `<div class="vflow">${steps.map((s,i)=>`<div class="vstep"><span class="dot">${i+1}</span><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("")}</div>`;
}
function tilesHTML(items){
  return `<div class="grid cols-2">${items.map(o=>`<div class="tile"><div class="t-ic">◆</div><h4>${esc(o.t)}</h4><p>${esc(o.d)}</p></div>`).join("")}</div>`;
}
function checklistHTML(items, cls=""){
  return `<ul class="checklist ${cls}">${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
}
function ownersHTML(owners){
  return `<table class="dtable"><thead><tr><th>Role</th><th>Responsibility</th></tr></thead><tbody>${
    owners.map(o=>`<tr><td><span class="owner-tag">${esc(o.r)}</span></td><td>${esc(o.x)}</td></tr>`).join("")
  }</tbody></table>`;
}
function kpisHTML(kpis){
  return `<div class="grid cols-3">${kpis.map(k=>`<div class="kpi"><div class="k-name">${esc(k.n)}</div><div class="k-target">🎯 ${esc(k.t)}</div>${k.f?`<div class="k-formula">${esc(k.f)}</div>`:""}</div>`).join("")}</div>`;
}
function calcHTML(calcs){
  return `<table class="dtable"><thead><tr><th>Calculation</th><th>Formula</th><th>What it tells you</th></tr></thead><tbody>${
    calcs.map(c=>`<tr><td><b>${esc(c.n)}</b></td><td><span class="formula">${esc(c.f)}</span></td><td>${esc(c.d)}</td></tr>`).join("")
  }</tbody></table>`;
}
function dashHTML(tiles, barviz){
  let h = `<div class="grid cols-4">${tiles.map(t=>`<div class="stat"><div class="s-label">${esc(t.l)}</div><div class="s-value">${esc(t.v)}</div><div class="s-trend ${t.trend}">${t.trend==="up"?"▲":t.trend==="down"?"▼":"●"} ${esc(t.t)}</div></div>`).join("")}</div>`;
  if (barviz){
    const max = Math.max(...barviz.bars.map(b=>b[1]));
    h += `<div class="card" style="margin-top:14px"><div style="font-size:13px;color:var(--ink-500);margin-bottom:6px">${esc(barviz.title)}</div>
      <div class="barviz">${barviz.bars.map((b,i)=>`<div class="bar"><div class="col ${i%2?'alt':''}" style="height:${Math.round(b[1]/max*100)}%"></div><small>${esc(b[0])}</small></div>`).join("")}</div></div>`;
  }
  h += `<p class="note">Figures are illustrative targets &amp; sample values used to show how success is measured — not live data.</p>`;
  return h;
}
function pillsHTML(items, cls=""){
  return `<div class="pills">${items.map(i=>`<span class="pill ${cls}">${esc(i)}</span>`).join("")}</div>`;
}
function aiHTML(m){
  const caps = (AI_IN_MODULE[m.id] || m.ai || []);
  return `<div class="ai-block">
    <div class="ai-head"><div class="ai-ic">✦</div><div><h3>AI inside ${esc(m.name)}</h3><p>AI isn't a separate tool — it works inside this module to accelerate the work.</p></div></div>
    ${caps.map(c=>`<div class="ai-cap"><span class="sparkle">✦</span><span>${esc(c)}</span></div>`).join("")}
    <div class="ai-prompt"><span>✦</span><span>Ask the assistant about ${esc(m.name)}…</span><button class="go" data-goto="ai-assistant">Open AI Assistant</button></div>
  </div>`;
}
function futureHTML(items){
  const cls = p => p==="Next"?"next":p==="Vision"?"vision":"";
  return `<div class="card">${items.map(f=>`<div class="future-item"><span class="ph ${cls(f.ph)}">${esc(f.ph)}</span><div><p>${esc(f.t)}</p></div></div>`).join("")}</div>`;
}

function renderModule(m){
  let custom = "";
  let extraChip = null;
  if (m.custom && CUSTOM_INLINE[m.custom]) {
    custom = CUSTOM_INLINE[m.custom](m);
    extraChip = CUSTOM_CHIP[m.custom] || null;
  }
  return pageHead(m) + chipNav(extraChip) +
    sec("overview","1","Overview","", `<div class="card"><p class="lead">${m.overview}</p></div>`) +
    sec("objectives","2","Objectives","What this module is built to achieve.", tilesHTML(m.objectives)) +
    sec("why","3","Why This Module Exists","", `<div class="callout"><strong>Why it matters.</strong> ${m.why}</div>`) +
    (custom || "") +
    sec("flow","4","Execution Flow","The end-to-end sequence this module runs.", flowHTML(m.executionFlow)) +
    sec("activities","5","Activities","The core work performed.", `<div class="card">${checklistHTML(m.activities)}</div>`) +
    sec("deliverables","6","Deliverables","Tangible outputs produced.", `<div class="card">${checklistHTML(m.deliverables,"arrow")}</div>`) +
    sec("owners","7","Owners","Who is accountable.", `<div class="card">${ownersHTML(m.owners)}</div>`) +
    sec("dependencies","8","Dependencies","What this module relies on and feeds.", `<div class="card">${checklistHTML(m.dependencies,"dot")}</div>`) +
    sec("workflow","9","Workflow","The stages an item moves through.", vflowHTML(m.workflow)) +
    sec("kras","10","KRAs","Key result areas this module is accountable for.", pillsHTML(m.kras,"green")) +
    sec("kpis","11","KPIs","Indicators with targets & formulas.", kpisHTML(m.kpis)) +
    sec("metrics","12","Metrics","Granular measurements captured.", pillsHTML(m.metrics)) +
    sec("calc","13","Calculations","How the headline numbers are derived.", calcHTML(m.calculations)) +
    sec("dashboard","14","Dashboard Preview","What leadership sees at a glance.", dashHTML(m.dashboard, m.barviz)) +
    sec("reports","15","Reports Generated","", pillsHTML(m.reports,"amber")) +
    sec("ai","16","AI Assistance","", aiHTML(m)) +
    sec("knowledge","17","Knowledge Base","Linked SOPs, templates & cases.", `<div class="card">${checklistHTML(m.knowledge,"dot")}</div>`) +
    sec("future","18","Future Enhancements","Where this module is headed.", futureHTML(m.future)) +
    `<div class="footer-note">DIIP — DRS Implementation Intelligence Platform · Product Vision Portal · ${esc(m.name)}</div>`;
}

/* ============================================================
   AI MODULE PAGE
   ============================================================ */
function renderAIModule(a){
  return `<div class="page-head">
      <div class="picon" style="background:linear-gradient(135deg,#8b6cf2,#6a47e8);color:#fff;border:0">✦</div>
      <div><div class="kicker" style="color:var(--violet-500)">AI · CROSS-PLATFORM</div>
      <h1>${esc(a.name)}</h1><p class="tagline">${esc(a.tagline)}</p></div>
    </div>
    <section class="section"><div class="card"><p class="lead">${esc(a.overview)}</p></div></section>
    <section class="section"><h2><span class="num">✦</span>What it does</h2>
      <div class="ai-block">
        ${a.caps.map(c=>`<div class="ai-cap"><span class="sparkle">✦</span><span>${esc(c)}</span></div>`).join("")}
        <div class="ai-prompt"><span>✦</span><span>${esc(a.example)}</span><button class="go">Ask</button></div>
      </div>
    </section>
    <section class="section"><h2><span class="num">◎</span>AI is everywhere, not a silo</h2>
      <div class="callout amber"><strong>Design principle.</strong> AI in DIIP is not a separate destination — it lives <em>inside</em> every module (drafting briefings in Government, prioritizing accounts in Acquisition, explaining KPIs in Analytics). These AI pages are the dedicated home for each capability; the same intelligence surfaces contextually wherever you work.</div>
      <div class="grid cols-3" style="margin-top:14px">
        ${Object.entries(AI_IN_MODULE).map(([mid,caps])=>`<div class="tile" data-goto="${mid}" style="cursor:pointer"><div class="t-ic" style="background:var(--violet-100);color:var(--violet-500)">✦</div><h4>${esc(MODULES[mid].name)}</h4><p>${caps.map(esc).join(" · ")}</p></div>`).join("")}
      </div>
    </section>
    <div class="footer-note">DIIP · AI Capability · ${esc(a.name)}</div>`;
}

/* ============================================================
   CUSTOM INLINE SECTIONS (injected mid-framework)
   ============================================================ */
const CUSTOM_CHIP = {
  acquisition:{k:"stakeholders", label:"Stakeholder Universe"},
  resistance:{k:"resmap", label:"Resistance Map"},
  communication:{k:"commgrid", label:"Streams & Assets"},
  analytics:{k:"geo", label:"Geography Explorer"},
};

const CUSTOM_INLINE = {
  /* ---- ACQUISITION: full stakeholder universe ---- */
  acquisition(m){
    let cats = STAKEHOLDERS.map(c=>{
      const cards = c.items.map((s,i)=>{
        const idx = STAKEHOLDERS.flatMap(x=>x.items).indexOf(s);
        return `<div class="stk" data-stk="${idx}">
          <div class="stk-top"><span class="stk-ic">${s.ic}</span><span class="stk-name">${esc(s.n)}</span><span class="stk-pri p${s.pri}">P${s.pri}</span></div>
          <div class="stk-metrics">
            <div class="sm"><div class="l">Accounts</div><div class="v">${esc(s.accounts)}</div></div>
            <div class="sm"><div class="l">Stage</div><div class="v" style="font-size:12px">${esc(s.stage)}</div></div>
            <div class="sm"><div class="l">Support</div><div class="v">${s.support}</div><div class="bar-mini"><span style="width:${s.support}%;background:var(--green-400)"></span></div></div>
            <div class="sm"><div class="l">Resistance</div><div class="v">${s.resistance}</div><div class="bar-mini"><span style="width:${s.resistance}%;background:var(--rose-500)"></span></div></div>
          </div>
        </div>`;
      }).join("");
      return `<div class="stk-cat"><div class="stk-cat-label">${esc(c.cat)}</div><div class="stk-grid">${cards}</div></div>`;
    }).join("");
    return sec("stakeholders","★","Stakeholder Universe",
      `Acquisition runs a structured pipeline for <b>every</b> stakeholder type. Click any card to see its full profile — universe, strategy, scores and KPIs.`,
      cats +
      `<div class="card" style="margin-top:16px"><div style="font-size:13px;color:var(--ink-500);margin-bottom:10px">Every stakeholder carries the same attribute set:</div>${pillsHTML(STK_ATTRIBUTES,"green")}</div>`);
  },

  /* ---- RESISTANCE: category map + register ---- */
  resistance(m){
    const catCards = `<div class="grid cols-4">${RESISTANCE_CATS.map(c=>`<div class="tile"><div class="t-ic" style="background:var(--rose-100);color:var(--rose-500)">🛡</div><h4>${esc(c)}</h4><p>Resistance tracked & owned</p></div>`).join("")}</div>`;
    const reg = `<table class="dtable" style="margin-top:14px"><thead><tr><th>Source</th><th>Root Cause</th><th>Impact</th><th>Mitigation</th><th>Owner</th><th>Status</th></tr></thead><tbody>${
      RESISTANCE_SAMPLE.map(r=>`<tr><td><b>${esc(r.src)}</b></td><td>${esc(r.cause)}</td><td><span class="pill ${r.impact==="High"?"":"amber"}" style="${r.impact==="High"?"background:var(--rose-100);color:var(--rose-500);border-color:#f6cdd4":""}">${esc(r.impact)}</span></td><td>${esc(r.mit)}</td><td><span class="owner-tag">${esc(r.owner)}</span></td><td>${esc(r.status)}</td></tr>`).join("")
    }</tbody></table>`;
    return sec("resmap","★","Resistance Map & Register",
      `Opposition is managed as a pipeline across 8 categories. Each resistance carries: ${RESISTANCE_FIELDS.join(", ")}.`,
      catCards + reg);
  },

  /* ---- COMMUNICATION: streams x assets ---- */
  communication(m){
    const streams = `<div class="grid cols-4">${COMM_STREAMS.map(s=>`<div class="tile"><div class="t-ic" style="background:var(--blue-100);color:var(--blue-500)">✉</div><h4>${esc(s)}</h4><p>Dedicated communication stream</p></div>`).join("")}</div>`;
    const assets = `<div class="card" style="margin-top:14px"><div style="font-size:13px;color:var(--ink-500);margin-bottom:10px">Asset library spans every format & channel:</div>${pillsHTML(COMM_ASSETS,"green")}</div>`;
    return sec("commgrid","★","Communication Streams & Asset Library",
      `Communication is organized into ${COMM_STREAMS.length} audience streams, each producing a governed, reusable asset library.`,
      streams + assets);
  },

  /* ---- ANALYTICS: interactive geography ---- */
  analytics(m){
    const tree = GEO_TREE.map((g,i)=>`<div class="geo-node ${i===0?'active':''}" data-geo="${i}"><span class="gico">${g.gico}</span><span>${esc(g.name)}</span><span class="lvl">${esc(GEO_LEVELS[g.level])}</span></div>`).join("");
    return sec("geo","★","Interactive Geography Explorer",
      `Select any level — <b>${GEO_LEVELS.join(" → ")}</b>. Every domain panel updates in context.`,
      `<div class="geo-wrap">
        <div class="geo-tree">${tree}</div>
        <div class="geo-panel" id="geo-panel">${geoPanel(0)}</div>
      </div>`);
  },
};

function geoPanel(i){
  const g = GEO_TREE[i];
  const s = g.sample;
  const tiles = [
    {l:"Return Rate", v:`${s.returnRate}%`, trend:"up", t:"vs target"},
    {l:"Accounts Onboarded", v:`${s.accounts}`, trend:"up", t:"active"},
    {l:"RVMs Live", v:`${s.rvms}`, trend:"flat", t:"in network"},
    {l:"Containers Returned", v:`${s.returns}`, trend:"up", t:"MTD"},
  ];
  const domainCards = GEO_DOMAINS.map(d=>`<div class="tile"><div class="t-ic">${d.ic}</div><h4>${esc(d.k)}</h4><p>${esc(d.metric(s))}</p><div style="font-size:18px;font-weight:800;margin-top:6px;color:var(--green-600)">${esc(d.val(s))}</div></div>`).join("");
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="font-size:22px">${g.gico}</span>
      <div><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-400)">${esc(GEO_LEVELS[g.level])} LEVEL</div>
      <div style="font-size:19px;font-weight:700">${esc(g.name)}</div></div>
    </div>
    <div class="grid cols-4">${tiles.map(t=>`<div class="stat"><div class="s-label">${esc(t.l)}</div><div class="s-value">${esc(t.v)}</div><div class="s-trend ${t.trend}">${t.trend==="up"?"▲":"●"} ${esc(t.t)}</div></div>`).join("")}</div>
    <div style="font-size:12px;color:var(--ink-500);margin:16px 0 4px;font-weight:600">All domains, contextualized to this geography:</div>
    <div class="geo-domains">${domainCards}</div>
    <p class="note">Selecting any level instantly re-contextualizes Marketing, Acquisition, Engagement, BTL, Government, Infrastructure, Operations, Finance &amp; Reports. (Illustrative values.)</p>`;
}

/* ============================================================
   CUSTOM INIT (interactions for inline custom sections)
   ============================================================ */
const CUSTOM_INIT = {
  acquisition(){
    document.querySelectorAll(".stk").forEach(c => c.addEventListener("click", ()=> openStakeholder(+c.dataset.stk)));
  },
  analytics(){
    document.querySelectorAll(".geo-node").forEach(n => n.addEventListener("click", ()=>{
      document.querySelectorAll(".geo-node").forEach(x=>x.classList.remove("active"));
      n.classList.add("active");
      el("geo-panel").innerHTML = geoPanel(+n.dataset.geo);
    }));
  },
};

/* ---------------- STAKEHOLDER MODAL ---------------- */
function openStakeholder(idx){
  const s = STAKEHOLDERS.flatMap(x=>x.items)[idx];
  const stratFor = name => {
    return {
      acq:`Targeted ${s.pri===1?"executive":"field"} outreach with tailored value proposition; ${s.pri===1?"senior sponsor engagement":"localized on-ground activation"}.`,
      eng:`Ongoing ${s.support>=70?"partnership deepening":"trust-building"} via meetings, workshops & co-created communication.`,
    };
  };
  const st = stratFor(s.n);
  const net = s.support - s.resistance;
  const body = `
    <div class="grid cols-2" style="margin-bottom:14px">
      <div class="kpi"><div class="k-name">Target Universe</div><div class="k-target">${esc(s.universe)}</div></div>
      <div class="kpi"><div class="k-name">Target Accounts</div><div class="k-target">${esc(s.accounts)}</div></div>
    </div>
    <table class="dtable">
      <tbody>
        <tr><td style="width:42%"><b>Priority</b></td><td><span class="stk-pri p${s.pri}" style="font-size:11px">P${s.pri} — ${s.pri===1?"Critical":s.pri===2?"Important":"Selective"}</span></td></tr>
        <tr><td><b>Current Stage</b></td><td>${esc(s.stage)}</td></tr>
        <tr><td><b>Owner</b></td><td><span class="owner-tag">${esc(s.owner)}</span></td></tr>
        <tr><td><b>Acquisition Strategy</b></td><td>${esc(st.acq)}</td></tr>
        <tr><td><b>Engagement Strategy</b></td><td>${esc(st.eng)}</td></tr>
        <tr><td><b>Support Score</b></td><td>${s.support} / 100 <div class="bar-mini" style="max-width:160px"><span style="width:${s.support}%;background:var(--green-400)"></span></div></td></tr>
        <tr><td><b>Resistance Score</b></td><td>${s.resistance} / 100 <div class="bar-mini" style="max-width:160px"><span style="width:${s.resistance}%;background:var(--rose-500)"></span></div></td></tr>
        <tr><td><b>Net Support</b></td><td style="color:${net>=30?'var(--green-600)':'var(--amber-500)'};font-weight:700">${net>=0?'+':''}${net}</td></tr>
        <tr><td><b>Conversion Rate</b></td><td><b>${s.conv}%</b></td></tr>
        <tr><td><b>Documents</b></td><td class="muted">MoU draft · Onboarding pack · Agreement (per account)</td></tr>
        <tr><td><b>Meetings & Follow-ups</b></td><td class="muted">Logged in timeline · AI-summarized · auto-reminders</td></tr>
        <tr><td><b>KPIs</b></td><td>Conversion %, Time-to-activate, Net support, Coverage of universe</td></tr>
      </tbody>
    </table>`;
  el("modal-ic").textContent = s.ic;
  el("modal-title").textContent = s.n;
  el("modal-sub").textContent = "Acquisition stakeholder profile";
  el("modal-body").innerHTML = body;
  el("modal").classList.add("open");
}
function closeModal(){ el("modal").classList.remove("open"); }

/* ============================================================
   FULL CUSTOM PAGES (vision, architecture, portfolio, exec, roadmap, how)
   ============================================================ */
const CUSTOM = {
  /* ---------- PLATFORM VISION ---------- */
  vision(){
    return `<div class="hero">
      <div class="h-kicker">DRS Implementation Intelligence Platform</div>
      <h1>One platform to plan, launch and scale Deposit Return Schemes — from Goa to anywhere.</h1>
      <p>DIIP turns a complex, multi-stakeholder DRS rollout into a structured, measurable, repeatable system. Every module explains the business logic, execution flow, KPIs and AI assistance — so the moment Goa succeeds, the same framework launches the next geography.</p>
      <div class="h-stats">
        <div class="h-stat"><div class="v">24+</div><div class="l">Connected modules</div></div>
        <div class="h-stat"><div class="v">8</div><div class="l">Geography levels</div></div>
        <div class="h-stat"><div class="v">180+</div><div class="l">Governed KPIs</div></div>
        <div class="h-stat"><div class="v">∞</div><div class="l">Reusable geographies</div></div>
      </div>
    </div>

    <section class="section"><h2><span class="num">◎</span>The problem DIIP solves</h2>
      <div class="grid cols-3">
        <div class="tile"><div class="t-ic">🧩</div><h4>Fragmented execution</h4><p>Government, acquisition, marketing, infrastructure and operations run in silos, in spreadsheets and inboxes.</p></div>
        <div class="tile"><div class="t-ic">📉</div><h4>Invisible progress</h4><p>Leadership can't see, at a glance, what's blocking launch or how success is being measured.</p></div>
        <div class="tile"><div class="t-ic">🔁</div><h4>No reuse</h4><p>Every new geography is rebuilt from zero — hard-won lessons leave with the people who learned them.</p></div>
      </div>
    </section>

    <section class="section"><h2><span class="num">✦</span>What DIIP delivers</h2>
      <div class="grid cols-2">
        <div class="card"><h3 style="margin:0 0 8px">A single execution operating system</h3><p class="lead" style="font-size:14px">Every workstream — from government engagement to bottle recycling — lives in one connected platform, each module following the same professional framework.</p></div>
        <div class="card"><h3 style="margin:0 0 8px">Measured, not guessed</h3><p class="lead" style="font-size:14px">KRAs → KPIs → Metrics → Calculations make success explicit at every geographic level, from India down to a single return point.</p></div>
        <div class="card"><h3 style="margin:0 0 8px">AI woven throughout</h3><p class="lead" style="font-size:14px">AI isn't a bolt-on. It drafts briefings, prioritizes stakeholders, explains analytics and captures knowledge inside every module.</p></div>
        <div class="card"><h3 style="margin:0 0 8px">A reusable blueprint</h3><p class="lead" style="font-size:14px">Goa becomes a template. Configure a model, load a geography, and the same framework scales to any domestic or international DRS.</p></div>
      </div>
    </section>

    <section class="section"><h2><span class="num">→</span>Explore the platform</h2>
      <div class="callout"><strong>This is a Product Vision Portal.</strong> It looks and navigates like the real DIIP application, but every page explains the business logic, execution flow, KPIs, calculations, dependencies and AI assistance behind each module. Start with <a data-goto="how" style="color:var(--green-600);font-weight:600;cursor:pointer">How DIIP Works</a> for the end-to-end story, or open any module on the left.</p></div>
      <div class="grid cols-4" style="margin-top:14px">
        <div class="tile" data-goto="acquisition" style="cursor:pointer"><div class="t-ic">🤝</div><h4>Acquisition</h4><p>The full stakeholder universe — deep.</p></div>
        <div class="tile" data-goto="resistance" style="cursor:pointer"><div class="t-ic">🛡</div><h4>Resistance</h4><p>Opposition as a managed pipeline.</p></div>
        <div class="tile" data-goto="analytics" style="cursor:pointer"><div class="t-ic">📊</div><h4>Analytics</h4><p>Interactive geography explorer.</p></div>
        <div class="tile" data-goto="how" style="cursor:pointer"><div class="t-ic">⮑</div><h4>How DIIP Works</h4><p>The end-to-end execution flow.</p></div>
      </div>
    </section>
    <div class="footer-note">DIIP — DRS Implementation Intelligence Platform · Product Vision Portal</div>`;
  },

  /* ---------- ARCHITECTURE ---------- */
  architecture(){
    const layer = (title, desc, items, color) =>
      `<div class="card" style="border-left:4px solid ${color}">
        <h3 style="margin:0 0 4px">${esc(title)}</h3><p class="muted" style="margin:0 0 12px;font-size:13px">${esc(desc)}</p>
        <div class="pills">${items.map(i=>`<span class="pill">${esc(i)}</span>`).join("")}</div></div>`;
    return `<div class="page-head"><div class="picon">▦</div><div><div class="kicker">PLATFORM</div><h1>Platform Architecture</h1><p class="tagline">How DIIP is layered — from a single source of project context up through execution, performance, knowledge and AI.</p></div></div>
    <section class="section"><h2><span class="num">▦</span>Layered design</h2>
      <div class="grid" style="gap:14px">
        ${layer("1 · Foundation","Defines context once; everything inherits it.",["Project Configuration","Geography Engine","Implementation Models","Stakeholder Graph"],"#138a69")}
        ${layer("2 · Implementation","The workstreams that plan & launch the scheme.",["Market Intel & Assessment","Government","Acquisition","Marketing / GTM / BTL","Infrastructure","Operations","Launch"],"#2f6fed")}
        ${layer("3 · Performance","Turns activity into measured outcomes.",["KRAs","KPIs","Metrics","Scorecards","Analytics","Reports"],"#e8a317")}
        ${layer("4 · Knowledge","Institutional memory that compounds.",["Knowledge Hub","SOPs","Templates","Cases","Lessons","Best Practices"],"#0e5240")}
        ${layer("5 · AI","An intelligence layer inside every module.",["Assistant","Search","Content","Meeting","Report","Analytics AI"],"#7a5cf0")}
      </div>
    </section>
    <section class="section"><h2><span class="num">⇄</span>How the layers connect</h2>
      <div class="callout"><strong>Inherit down, roll up.</strong> Configuration & geography cascade <em>down</em> into every implementation module. Their activity emits <em>metrics</em>, which compute into <em>KPIs</em> and <em>KRAs</em>, which roll <em>up</em> the geography hierarchy into Analytics and Reports. Knowledge captures learnings from all of it, and AI reads across every layer.</div>
    </section>
    <section class="section"><h2><span class="num">◇</span>Design principles</h2>
      <div class="grid cols-2">
        <div class="tile"><div class="t-ic">♻</div><h4>Configure once, reuse forever</h4><p>A geography is a template, not a rebuild.</p></div>
        <div class="tile"><div class="t-ic">📐</div><h4>Every module, same framework</h4><p>20 consistent sections make the platform feel professionally designed.</p></div>
        <div class="tile"><div class="t-ic">🔢</div><h4>Every number is traceable</h4><p>KPI → metric → source. Trust by design.</p></div>
        <div class="tile"><div class="t-ic">✦</div><h4>AI is ambient</h4><p>Intelligence lives inside the work, not in a separate app.</p></div>
      </div>
    </section>
    <div class="footer-note">DIIP · Platform Architecture</div>`;
  },

  /* ---------- PROJECT PORTFOLIO ---------- */
  portfolio(){
    const projects = [
      {n:"Goa DRS — Flagship", model:"Hybrid (Govt + PIBO)", stage:"Post-Launch Optimization", prog:88, color:"var(--green-500)", note:"Live · scaling across talukas"},
      {n:"Coastal State B", model:"Government-led", stage:"Market Assessment", prog:24, color:"var(--blue-500)", note:"Readiness scoring underway"},
      {n:"Metro City Pilot", model:"PIBO-led Pilot", stage:"Stakeholder Mapping", prog:15, color:"var(--amber-500)", note:"Coalition forming"},
      {n:"International — Island Nation", model:"Hybrid", stage:"Opportunity / Intelligence", prog:6, color:"var(--violet-500)", note:"Exploratory"},
    ];
    return `<div class="page-head"><div class="picon">▤</div><div><div class="kicker">PLATFORM</div><h1>Project Portfolio</h1><p class="tagline">Every DRS implementation as a tracked project — each running the same DIIP framework at its own stage of maturity.</p></div></div>
    <section class="section"><h2><span class="num">▤</span>Active & pipeline projects</h2>
      <div class="grid cols-2">
        ${projects.map(p=>`<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">${esc(p.n)}</h3><span class="pill green">${esc(p.model)}</span></div>
          <p class="muted" style="margin:8px 0 4px;font-size:13px">${esc(p.note)}</p>
          <div style="font-size:12px;color:var(--ink-500);margin:10px 0 4px">Stage: <b style="color:var(--ink-900)">${esc(p.stage)}</b></div>
          <div class="bar-mini" style="height:9px"><span style="width:${p.prog}%;background:${p.color}"></span></div>
          <div style="font-size:12px;color:var(--ink-400);margin-top:6px">${p.prog}% through implementation lifecycle</div>
        </div>`).join("")}
      </div>
    </section>
    <section class="section"><h2><span class="num">◎</span>Why a portfolio view</h2>
      <div class="callout"><strong>The same engine, many launches.</strong> Because every project runs the identical module framework, leadership compares them like-for-like, reuses the strongest project as a template, and sequences the pipeline rationally. This is how a single Goa success becomes a scaling program.</div>
    </section>
    <div class="footer-note">DIIP · Project Portfolio</div>`;
  },

  /* ---------- EXECUTIVE DASHBOARD ---------- */
  exec(){
    const tiles = [
      {l:"Launch Readiness", v:"94%", t:"3 open blockers", trend:"up"},
      {l:"Return Rate (Goa)", v:"79%", t:"+11pp since launch", trend:"up"},
      {l:"Accounts Onboarded", v:"486", t:"+62 this month", trend:"up"},
      {l:"RVMs Live", v:"142", t:"of 180 planned", trend:"up"},
      {l:"Net Stakeholder Support", v:"+46", t:"target +40", trend:"up"},
      {l:"Open High-Impact Risks", v:"4", t:"−3 this month", trend:"up"},
      {l:"Approvals Secured", v:"11/14", t:"79% critical", trend:"flat"},
      {l:"Material Recovery", v:"91%", t:"to PCR", trend:"up"},
    ];
    return `<div class="page-head"><div class="picon">▣</div><div><div class="kicker">PLATFORM</div><h1>Executive Dashboard</h1><p class="tagline">The Director's one-screen view — readiness, performance and risk across the active program. (Illustrative values.)</p></div></div>
    <section class="section"><h2><span class="num">▣</span>Program at a glance — Goa DRS</h2>
      <div class="grid cols-4">${tiles.map(t=>`<div class="stat"><div class="s-label">${esc(t.l)}</div><div class="s-value">${esc(t.v)}</div><div class="s-trend ${t.trend}">${t.trend==="up"?"▲":"●"} ${esc(t.t)}</div></div>`).join("")}</div>
    </section>
    <section class="section"><h2><span class="num">∿</span>Return-rate ramp</h2>
      <div class="card"><div style="font-size:13px;color:var(--ink-500);margin-bottom:6px">Return rate by month since launch (%)</div>
      <div class="barviz">${[["M1",22],["M2",38],["M3",51],["M4",61],["M5",68],["M6",74],["M7",79]].map((b,i)=>`<div class="bar"><div class="col" style="height:${Math.round(b[1]/85*100)}%"></div><small>${b[0]}</small></div>`).join("")}</div></div>
    </section>
    <section class="section"><h2><span class="num">→</span>What needs attention</h2>
      <div class="card">${checklistHTML(["3 launch-readiness blockers open (0 critical) — see Launch Readiness","4 high-impact risks in mitigation — Hotels & Retail handling concerns","3 critical government approvals pending — Tourism & Urban Dev","Independent retail conversion lagging target (33% vs 35%)"],"arrow")}</div>
      <div style="margin-top:14px" class="ai-block">
        <div class="ai-head"><div class="ai-ic">✦</div><div><h3>AI executive briefing</h3><p>The assistant can summarize this dashboard into a board-ready narrative.</p></div></div>
        <div class="ai-prompt"><span>✦</span><span>Summarize program status & top risks for this week's board update</span><button class="go" data-goto="ai-report">Generate</button></div>
      </div>
    </section>
    <div class="footer-note">DIIP · Executive Dashboard</div>`;
  },

  /* ---------- ROADMAP ---------- */
  roadmap(){
    const phases = [
      {ph:"Now · Foundation", color:"var(--green-500)", items:["Core module framework live","Goa flagship instrumented","KPI & metric library governed","AI Assistant + in-module AI"]},
      {ph:"Next · Scale", color:"var(--blue-500)", items:["Map-based geography selection","Live RVM telemetry (IoT)","Mobile field app for BTL & surveys","Automated report & board-deck export"]},
      {ph:"Later · Intelligence", color:"var(--amber-500)", items:["Predictive launch-window engine","Natural-language analytics","Predictive resistance modeling","Auto-generated geography blueprints"]},
      {ph:"Vision · Autonomy", color:"var(--violet-500)", items:["Self-optimizing programs","AI launch co-pilot (live interventions)","Blockchain material provenance","Configuration from a one-line brief"]},
    ];
    return `<div class="page-head"><div class="picon">🗺</div><div><div class="kicker">PRODUCT</div><h1>Product Roadmap</h1><p class="tagline">How DIIP evolves — from a structured execution system today to an intelligent, self-optimizing platform.</p></div></div>
    <section class="section"><h2><span class="num">🗺</span>Phased evolution</h2>
      <div class="grid cols-2">
        ${phases.map(p=>`<div class="card" style="border-top:4px solid ${p.color}"><h3 style="margin:0 0 12px">${esc(p.ph)}</h3>${checklistHTML(p.items)}</div>`).join("")}
      </div>
    </section>
    <section class="section"><h2><span class="num">◎</span>The throughline</h2>
      <div class="callout"><strong>From system → intelligence → autonomy.</strong> Each phase keeps the same promise: make DRS implementation more structured, more measurable, and more reusable — until launching the next geography is nearly turnkey.</div>
    </section>
    <div class="footer-note">DIIP · Product Roadmap</div>`;
  },

  /* ---------- HOW DIIP WORKS (end-to-end) ---------- */
  how(){
    const phaseBreaks = {0:"START", 4:"INTELLIGENCE & STRATEGY", 11:"EXECUTION", 16:"LAUNCH", 19:"LEARN & SCALE"};
    let steps = "";
    E2E_FLOW.forEach((s,i)=>{
      if (phaseBreaks[i]) {
        steps += `<div class="e-step phase"><span class="e-n">◆</span><h4>${esc(phaseBreaks[i])}</h4><p>Phase</p></div>`;
      }
      steps += `<div class="e-step ${s.final?'final':''}" data-goto="${s.link}" style="cursor:pointer">
        <span class="e-n">${s.final?'★':i+1}</span>
        <h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`;
    });
    return `<div class="page-head"><div class="picon">⮑</div><div><div class="kicker">END-TO-END</div><h1>How DIIP Works</h1><p class="tagline">One continuous execution flow — from identifying an opportunity to producing a reusable blueprint for the next DRS. Click any step to open its module.</p></div></div>
    <section class="section">
      <div class="callout amber"><strong>The whole platform, in one line:</strong> identify → configure → assess → align stakeholders → market & acquire → build infrastructure → launch → optimize → measure → capture → <em>reuse</em>. Every loop makes the next geography faster.</div>
    </section>
    <div class="e2e">${steps}</div>
    <div class="footer-note">DIIP · How DIIP Works · The end-to-end DRS execution flow</div>`;
  },
};

/* ============================================================
   BOOT
   ============================================================ */
function boot(){
  renderSidebar();
  el("modal-close").addEventListener("click", closeModal);
  el("modal").addEventListener("click", e => { if (e.target.id==="modal") closeModal(); });
  el("menu-toggle").addEventListener("click", ()=> el("sidebar").classList.toggle("open"));
  document.addEventListener("keydown", e => { if (e.key==="Escape") closeModal(); });

  // global search → jump to matching module
  const search = el("global-search");
  if (search) search.addEventListener("keydown", e=>{
    if (e.key==="Enter"){
      const q = search.value.trim().toLowerCase();
      if (!q) return;
      const all = NAV.flatMap(g=>g.items);
      const hit = all.find(it => it.name.toLowerCase().includes(q)) || all.find(it=>it.id.includes(q));
      if (hit){ go(hit.id); search.value=""; }
    }
  });

  const start = (location.hash || "").replace("#","");
  go(MODULES[start] || AI_MODULES[start] ? start : "vision");
}
document.addEventListener("DOMContentLoaded", boot);
