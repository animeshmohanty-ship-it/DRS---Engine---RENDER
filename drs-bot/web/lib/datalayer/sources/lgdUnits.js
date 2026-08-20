// Source: LGD sub-unit counts (planemad mirror) — fills the district table's
// level2_count (sub-districts / taluks) and level3_count (blocks). Counts rows
// per District Code, then joins onto geo_districts by the LGD code already stored.
//
// Run AFTER `census` + `lgd` (needs lgd_code on the district rows).
import { parseCSVObjects } from '../csv.js';
import { getDistricts } from '../db.js';

const SUBDIST_URL = process.env.LGD_SUBDISTRICT_URL
  || 'https://raw.githubusercontent.com/planemad/india-local-government-directory/main/administrative/3-subdistrict.csv';
const BLOCKS_URL = process.env.LGD_BLOCKS_URL
  || 'https://raw.githubusercontent.com/planemad/india-local-government-directory/main/administrative/blocks.csv';
const UA = 'DRS-Bot/1.0 (Recykal DRS research)';

async function countByDistrictCode(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const objs = parseCSVObjects(await res.text());
  const counts = new Map();
  for (const o of objs) {
    const code = o['District Code'];
    if (!code) continue;
    counts.set(String(code), (counts.get(String(code)) || 0) + 1);
  }
  return counts;
}

export async function loadLgdUnits() {
  const existing = await getDistricts({});
  if (!existing.length) throw new Error('load `census` + `lgd` first');
  const byLgd = new Map();
  for (const d of existing) if (d.lgd_code != null) byLgd.set(String(d.lgd_code), d);
  if (!byLgd.size) throw new Error('no lgd_code on districts — run `lgd` first');

  const [subCounts, blockCounts] = await Promise.all([
    countByDistrictCode(SUBDIST_URL),
    countByDistrictCode(BLOCKS_URL),
  ]);

  const prov = { source: 'lgd', confidence: 'Verified' };
  const out = [];
  for (const [code, d] of byLgd) {
    const level2 = subCounts.get(code);       // sub-districts / taluks
    const level3 = blockCounts.get(code);     // blocks
    if (level2 == null && level3 == null) continue;
    out.push({
      state: d.state, district: d.district,
      ...(level2 != null ? { level2_count: level2 } : {}),
      ...(level3 != null ? { level3_count: level3 } : {}),
      sources: {
        ...(d.sources || {}),
        ...(level2 != null ? { level2_count: prov } : {}),
        ...(level3 != null ? { level3_count: prov } : {}),
      },
    });
  }
  return out;
}
