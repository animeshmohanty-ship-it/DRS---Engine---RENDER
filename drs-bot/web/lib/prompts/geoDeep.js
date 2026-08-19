// Deep-geography sub-generation prompts for Geo Intel (Stage 2).
// One small call per section → merged client-side. Universal: works for any
// country/state, keyed off the Setup brief. Brain-first, grounded fallback.

function header(input) {
  const { country = '', state = '', implementationModel = '', materials = [], selectedMaterials = [] } = input || {};
  const mats = (materials.length ? materials : selectedMaterials) || [];
  const isNat = !state || /national|whole country/i.test(state);
  const place = isNat ? country : `${state}, ${country}`;
  return { place, isNat, mats };
}

const RULES = `
YOU ARE AN AUTONOMOUS RESEARCHER — not a database reader. Your job is to FIND the data, not wait for it.
RULES (critical):
- RESEARCH FIRST via grounded web search. Actively consult AUTHORITATIVE sources: the national census (for India: Census of India / District Census Handbooks), the government local-government directory (for India: LGD — Local Government Directory, which lists districts→blocks→panchayats→wards with counts), the national statistics office / data.gov.in, state statistical handbooks, and well-maintained encyclopaedic pages (e.g. Wikipedia district pages, which reliably carry per-district population, households, area, literacy). Cross-check across sources.
- The DRS BRAIN facts below are a HEAD START / cache — use them if present, but NEVER depend on them: research the web thoroughly for everything they don't cover. An empty Brain must NOT produce empty output.
- FILL EVERY FIELD. Do not leave a field blank if it can be reasonably derived. If a hard figure isn't published, compute a clearly-labelled REASONED ESTIMATE and mark its confidence "Inferred" (e.g. households ≈ population ÷ average household size, ~4.3–4.6 for India; local-body counts from LGD or state directories). Only use null + "Assumption" as a genuine last resort.
- Confidence per item: "Verified" (found in a named authoritative source), "Inferred" (reasoned/derived — show the basis in a note), "Assumption" (weak). Label estimates honestly — never mark an estimate "Verified".
- Adapt to the country's real administrative structure and currency (districts in India, counties/councils in the UK, powiats/voivodeships in Poland). Do NOT use another country's units.
- Return STRICT JSON only, no prose, no markdown fences.`;

export function buildGeoDeepPrompt(section, input, brainBlock = '', opts = {}) {
  const { place, isNat, mats } = header(input);
  const ctx = `You are the DRS (Deposit Return System) Geography-Intelligence engine for Recykal.
TARGET PLACE: ${place}
MATERIALS: ${mats.join(', ') || 'n/a'}
Today's date context applies — prefer current data, but historical census/official baselines are valid (label their year).${brainBlock || ''}
${RULES}`;

  if (section === 'economic') {
    return `${ctx}

TASK: Return the economic profile of ${place} relevant to consumer spending / deposit behaviour.
JSON schema:
{"economicProfile":{
  "perCapitaIncome":{"value":"<e.g. ₹3,61,619 or null>","year":"<e.g. 2024-25>","status":"Actual|Projected","source":"<url/authority>","confidence":"Verified|Inferred|Assumption"},
  "gsdp":{"value":"<e.g. ₹31.19 lakh crore or null>","growthPct":"<e.g. 11.19 or null>","year":"","status":"Actual|Projected","source":"","confidence":""},
  "notes":"<1-2 line takeaway for DRS deposit-claim behaviour>"
}}`;
  }

  if (section === 'income') {
    return `${ctx}

TASK: Return the household income-class distribution of ${place} (drives deposit-claim likelihood — lower income = higher claim likelihood).
JSON schema:
{"incomeClasses":[
  {"class":"<e.g. Lower Middle Class>","incomeRange":"<annual HH income range>","pctHouseholds":"<e.g. 15.8>","estHouseholds":"<count or null>","depositClaimLikelihood":"High|Medium|Low","confidence":"Verified|Inferred|Assumption","source":""}
]}
Return the standard tiers (Poor/Low, Lower-Middle, Middle, Upper-Middle, Affluent) for ${place}.`;
  }

  if (section === 'priority') {
    return `${ctx}

TASK: Rank the TOP ${opts.limit || 12} priority rollout units (cities/corporations/municipalities/districts) in ${place} for a DRS launch, by population + urbanisation + commercial density.
JSON schema:
{"priorityUnits":[
  {"rank":1,"unit":"<name>","type":"<Corporation|Municipality|District|County|...>","parent":"<district/region>","population":"<number or string>","urbanPct":"<e.g. 95.5 or null>","rationale":"<why this rank for DRS>"}
]}`;
  }

  if (section === 'districts') {
    const start = opts.start || 0;
    const size = opts.size || 18;
    return `${ctx}

TASK: Research and return administrative sub-divisions of ${place} with demographics, ORDERED BY POPULATION (largest first). Return items ${start + 1} to ${start + size}. ${isNat ? 'National scope → return the top macro-regions/states, not every local body.' : 'Return the districts/equivalent of this state.'} If fewer exist, return only those (and set "endOfList":true).
RESEARCH EVERY FIELD — do not leave blanks:
- population, literacyPct, urbanPct → from Census / Wikipedia district pages.
- households → if not published, ESTIMATE = population ÷ ~4.4 (label confidence "Inferred").
- level2Count (blocks/taluks) & level3Count (panchayats/wards) → from the Local Government Directory (LGD) or state directory; estimate from district norms if needed ("Inferred").
JSON schema:
{"endOfList":<true|false>,"districts":[
  {"name":"<unit name>","population":"<number>","households":"<number — real or estimated, never blank>","urbanPct":"<number>","literacyPct":"<number>","level2Count":"<blocks/taluks count>","level3Count":"<panchayats/wards count>","confidence":"Verified|Inferred|Assumption","source":""}
]}`;
  }

  if (section === 'snapshot') {
    return `${ctx}

TASK: Return a top-line snapshot of ${place} for a DRS launch.
JSON schema:
{"snapshot":{
  "population":"<e.g. 7.76 crore or null>","adminDivisions":"<count + label, e.g. 38 districts>","urbanLocalBodies":"<count or null>","localBodies":"<panchayats/wards count or null>","households":"<count or null>","urbanPct":"<number or null>","literacyPct":"<number or null>","otherKeyStat":"<e.g. HDI / life expectancy / poverty rate, or null>",
  "source":"","confidence":"Verified|Inferred|Assumption"
}}`;
  }

  if (section === 'context') {
    return `${ctx}

TASK: Return the DRS context & threats for ${place}.
JSON schema:
{"context":{
  "wasteScenario":"<current waste-management / plastic-ban / any DRS pilot status>",
  "associations":["<key waste / retailer / distributor associations>"],
  "threats":[{"threat":"<name>","type":"Political|Retailer|Distributor|PIBO|ConsumerForum|Other","note":"<why it's a risk to DRS>"}],
  "channelisation":"<who channelises the waste, where, and how>",
  "confidence":"Verified|Inferred|Assumption","source":""
}}`;
  }

  if (section === 'touchpoints') {
    const cat = opts.category || 'retail';
    return `${ctx}

TASK: For ${place}, summarise the "${cat}" touchpoint category for DRS (prefer real named outlets from the Brain; else grounded estimate). Give counts + notable named examples.
JSON schema:
{"touchpoints":{
  "category":"${cat}","estimatedCount":"<number or range or null>","densityNote":"<concentration by city/area>",
  "examples":[{"name":"<outlet>","area":"<locality/city>","note":"<phone/rating if known>"}],
  "confidence":"Verified|Inferred|Assumption","source":""
}}`;
  }

  if (section === 'narrative') {
    return `${ctx}

TASK: Draft the DRS NARRATIVE for ${place} (${opts.scenario || 'Regional'} scenario). Ground it in the real local context (waste issues, any pilot, culture). Do NOT invent facts.
JSON schema:
{"narrative":[
  {"block":"Current waste-management challenge","content":"<2-3 sentences, locally grounded>","channel":"News/Social/Radio/Events"},
  {"block":"DRS as the solution","content":"<2-3 sentences positioning Recykal/Retearn DRS>","channel":""},
  {"block":"Thought-leader angle","content":"<who should carry it + the message>","channel":""},
  {"block":"Event & speakership plan","content":"<target forums/events>","channel":"Events"}
]}`;
  }

  if (section === 'awareness') {
    return `${ctx}

TASK: Draft the DRS PUBLIC AWARENESS plan for ${place} (${opts.scenario || 'Regional'} scenario) — content ideas per theme, with the channel.
JSON schema:
{"awareness":[
  {"theme":"What is DRS?","content":"<short content idea>","channel":"Social/News/Influencer"},
  {"theme":"Benefits of DRS","content":"","channel":""},
  {"theme":"How DRS works","content":"","channel":""},
  {"theme":"Global success of DRS","content":"","channel":""},
  {"theme":"Counter-narrative","content":"<pre-empt objections>","channel":""},
  {"theme":"Event activation & demos","content":"","channel":"Events"}
]}`;
  }

  return `${ctx}\nReturn {}.`;
}
