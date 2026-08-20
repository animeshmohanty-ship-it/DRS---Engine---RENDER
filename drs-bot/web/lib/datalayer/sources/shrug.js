// Source: SHRUG (Development Data Lab) via Harvard Dataverse (no key, TSV).
// The district PCA file has NO district names — only numeric pc11 state/district
// ids. We therefore JOIN it onto the already-loaded census rows BY POPULATION
// (pc11_pca_tot_p is the 2011 PCA total, identical to the census file's
// Population), and attach households + literacy %.
//
// Order matters: run `census` before `shrug` (SHRUG has nothing to attach to
// without the census district rows).
import { parseTSVObjects, num } from '../csv.js';
import { getDistricts } from '../db.js';

const SHRUG_PCA_URL = process.env.SHRUG_PCA_URL
  || 'https://dataverse.harvard.edu/api/access/datafile/10742786';
const UA = 'DRS-Bot/1.0 (Recykal DRS research)';

export async function loadShrug() {
  const existing = await getDistricts({});
  if (!existing.length) throw new Error('load `census` first — SHRUG joins onto district rows by population');
  const byPop = new Map();
  for (const d of existing) if (d.population != null) byPop.set(Number(d.population), d);

  const res = await fetch(SHRUG_PCA_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`SHRUG fetch ${res.status}`);
  const objs = parseTSVObjects(await res.text());

  const prov = { source: 'shrug', confidence: 'Verified' };
  const out = [];
  for (const r of objs) {
    const pop = num(r['pc11_pca_tot_p']);
    if (pop == null) continue;
    const match = byPop.get(pop);
    if (!match) continue;                                  // district not in census set (post-2011 split etc.)
    const hh = num(r['pc11_pca_no_hh']);
    const lit = num(r['pc11_pca_p_lit']);
    const p06 = num(r['pc11_pca_p_06']);
    // literacy rate = literates / population aged 7+ (pop - age0-6), per Census definition
    const literacyPct = (lit != null && p06 != null && pop - p06 > 0)
      ? Math.round((lit / (pop - p06)) * 10000) / 100 : null;
    out.push({
      state: match.state, district: match.district,
      ...(hh != null ? { households: hh } : {}),
      ...(literacyPct != null ? { literacy_pct: literacyPct } : {}),
      sources: {
        ...(match.sources || {}),
        ...(hh != null ? { households: prov } : {}),
        ...(literacyPct != null ? { literacy_pct: prov } : {}),
      },
    });
  }
  if (!out.length) throw new Error('SHRUG matched 0 districts by population — check census loaded first');
  return out;
}
