// Source: Census of India 2011 — district-level religion (C-01), via a verified
// community mirror (single flat CSV; the official portal has no fetchable file).
// This is the source that fixes the identical-religion bug: real per-district
// counts for all 640 districts, with State + District names + Population inline.
//
// Column-consistency: we compute each STATE's top-4 religions (by total count)
// and give every district in that state those SAME 4 (in the same order), each
// with the district's own %. So the table columns stay aligned per state and
// adapt per state — exactly the intended behaviour.
import { parseCSVObjects, num } from '../csv.js';

const CENSUS_URL = process.env.CENSUS_RELIGION_URL
  || 'https://raw.githubusercontent.com/nishusharma1608/India-Census-2011-Analysis/master/india-districts-census-2011.csv';
const UA = 'DRS-Bot/1.0 (Recykal DRS research)';

// CSV column → display name
const REL_COLS = [
  ['Hindus', 'Hindu'], ['Muslims', 'Muslim'], ['Christians', 'Christian'],
  ['Sikhs', 'Sikh'], ['Buddhists', 'Buddhist'], ['Jains', 'Jain'],
  ['Others_Religions', 'Other'], ['Religion_Not_Stated', 'Not stated'],
];

function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).trim();
}
const pct = (part, whole) => (whole ? Math.round((part / whole) * 10000) / 100 : null);

export async function loadCensusReligion() {
  const res = await fetch(CENSUS_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`census fetch ${res.status}`);
  const objs = parseCSVObjects(await res.text());

  // Pass 1: collect districts + per-state religion totals.
  const districts = [];
  const stateTotals = new Map();        // state -> { relName: totalCount }
  for (const o of objs) {
    const state = titleCase(o['State name']);
    const district = titleCase(o['District name']);
    const population = num(o['Population']);
    if (!state || !district || !population) continue;
    const counts = {};
    for (const [col, name] of REL_COLS) counts[name] = num(o[col]) || 0;
    districts.push({
      state, district, population, counts, code: num(o['District code']),
      households: num(o['Households']),
      urbanHH: num(o['Urban_Households']),
      ruralHH: num(o['Rural_Households']),
      literate: num(o['Literate']),
    });
    const st = stateTotals.get(state) || {};
    for (const [, name] of REL_COLS) st[name] = (st[name] || 0) + counts[name];
    stateTotals.set(state, st);
  }
  if (!districts.length) throw new Error('census CSV parsed 0 districts — mirror layout may have changed');

  // Pass 2: state top-4 religion names (ordered), then emit rows.
  const stateTop4 = new Map();
  for (const [state, tot] of stateTotals) {
    const top4 = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name);
    stateTop4.set(state, top4);
  }
  const prov = { source: 'census_2011_c01', confidence: 'Verified' };
  return districts.map((d) => {
    const row = {
      state: d.state,
      district: d.district,
      population: d.population,
      religions: stateTop4.get(d.state).map((name) => ({ name, pct: pct(d.counts[name], d.population) })),
      extra: { census_2011_code: d.code },
      sources: { population: prov, religions: prov },
    };
    // Everything below is in the SAME census file → 640/640 coverage.
    if (d.households != null) { row.households = d.households; row.sources.households = prov; }
    // Urban% = urban share of households (census gives rural/urban household counts).
    if (d.urbanHH != null && d.ruralHH != null && d.urbanHH + d.ruralHH > 0) {
      row.urban_pct = Math.round((d.urbanHH / (d.urbanHH + d.ruralHH)) * 1000) / 10;
      row.sources.urban_pct = prov;
    }
    // Baseline literacy (literates as % of total population); SHRUG later overrides
    // with the official 7+ rate where available.
    if (d.literate != null && d.population) {
      row.literacy_pct = Math.round((d.literate / d.population) * 1000) / 10;
      row.sources.literacy_pct = prov;
    }
    return row;
  });
}
