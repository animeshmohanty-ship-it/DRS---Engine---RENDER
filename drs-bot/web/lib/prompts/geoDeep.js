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
RULES (critical):
- Base answers on the PROJECT KNOWLEDGE / DRS BRAIN facts below when they cover this place; otherwise use live grounded web search for THIS EXACT place.
- Adapt to the country's real administrative structure and currency (e.g. districts in India, counties/councils in the UK, powiats/voivodeships in Poland). Do NOT use another country's units.
- Every figure: include a "source" (URL or named authority) and a "confidence" of "Verified" (named authoritative source), "Inferred" (reasoned), or "Assumption". NEVER fabricate — if unknown, use null and confidence "Assumption".
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

TASK: Return administrative sub-divisions of ${place} with demographics, ORDERED BY POPULATION (largest first). Return items ${start + 1} to ${start + size}. ${isNat ? 'Since this is a national scope, return the top macro-regions/states, not every local body.' : 'Return the districts/equivalent of this state.'} If fewer exist, return only those (and set "endOfList":true).
JSON schema:
{"endOfList":<true|false>,"districts":[
  {"name":"<unit name>","population":"<number or null>","households":"<number or null>","urbanPct":"<number or null>","literacyPct":"<number or null>","level2Count":"<count of next-tier subdivisions or null>","level3Count":"<count of local bodies or null>","confidence":"Verified|Inferred|Assumption","source":""}
]}`;
  }

  return `${ctx}\nReturn {}.`;
}
