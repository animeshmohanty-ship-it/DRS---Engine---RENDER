// FREE open-data connector — Wikidata (no key). Gives the bot real, structured
// administrative + demographic data so it researches instead of waiting to be fed.
const WD_API = 'https://www.wikidata.org/w/api.php';
const SPARQL = 'https://query.wikidata.org/sparql';
const UA = 'DRS-Bot/1.0 (Recykal DRS research)';

async function resolveQID(name) {
  try {
    const u = `${WD_API}?action=wbsearchentities&format=json&language=en&type=item&limit=1&search=${encodeURIComponent(name)}`;
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    return j.search?.[0]?.id || null;
  } catch { return null; }
}

// Real administrative subdivisions located in a place, with population + area.
// Works for any state/country Wikidata covers (India districts, UK counties, …).
export async function getSubdivisions(placeName, opts = {}) {
  try {
    const qid = await resolveQID(placeName);
    if (!qid) return [];
    const q = `SELECT ?dLabel ?pop ?area ?typeLabel WHERE {
      ?d wdt:P131 wd:${qid} .
      ?d wdt:P1082 ?pop .
      OPTIONAL { ?d wdt:P2046 ?area }
      OPTIONAL { ?d wdt:P31 ?type }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY DESC(?pop) LIMIT ${opts.limit || 80}`;
    const r = await fetch(`${SPARQL}?format=json&query=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': UA, 'Accept': 'application/sparql-results+json' },
    });
    if (!r.ok) return [];
    const j = await r.json();
    const seen = new Set(); const out = [];
    for (const b of (j.results?.bindings || [])) {
      const name = b.dLabel?.value;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({
        name,
        population: b.pop?.value ? Number(b.pop.value) : null,
        areaKm2: b.area?.value ? Math.round(Number(b.area.value)) : null,
        type: b.typeLabel?.value || null,
      });
    }
    return out;
  } catch { return []; }
}

// Format subdivisions as an authoritative seed block for the LLM prompt.
export function formatSubdivisionsSeed(rows) {
  if (!rows || !rows.length) return '';
  const lines = rows.slice(0, 60).map((r) =>
    `- ${r.name}${r.population != null ? ` · pop ${r.population.toLocaleString('en-IN')}` : ''}${r.areaKm2 != null ? ` · ${r.areaKm2} km²` : ''}${r.type ? ` · ${r.type}` : ''}`);
  return `

AUTHORITATIVE OPEN-DATA SEED (from Wikidata — treat as VERIFIED ground truth; use these exact names + populations, then research/estimate the remaining columns per unit):
${lines.join('\n')}`;
}
