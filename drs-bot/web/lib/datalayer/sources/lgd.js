// Source: Local Government Directory (LGD) district list, via the planemad
// community mirror (single uncompressed CSV; the official portal 403s automated
// fetch and the daily ramSeraph dump is 7z-compressed).
// Adds the official LGD `District Code` (a stable join key) + Census 2011 code
// onto the census-loaded district rows, matched by normalized state+district
// name. Best-effort: LGD districts with no census-2011 match are skipped (they
// carry no demographics here anyway).
//
// Run AFTER `census`.
import { parseCSVObjects } from '../csv.js';
import { getDistricts } from '../db.js';

const LGD_URL = process.env.LGD_DISTRICTS_URL
  || 'https://raw.githubusercontent.com/planemad/india-local-government-directory/main/administrative/2-district.csv';
const UA = 'DRS-Bot/1.0 (Recykal DRS research)';

const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function loadLgd() {
  const existing = await getDistricts({});
  if (!existing.length) throw new Error('load `census` first — LGD attaches codes to district rows by name');
  const byKey = new Map();
  for (const d of existing) byKey.set(norm(d.state) + '|' + norm(d.district), d);

  const res = await fetch(LGD_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`LGD fetch ${res.status}`);
  const objs = parseCSVObjects(await res.text());

  const prov = { source: 'lgd', confidence: 'Verified' };
  const out = [];
  let matched = 0;
  for (const o of objs) {
    const state = o['State Name'];
    const district = o['District Name'];
    const code = o['District Code'];
    const census2011 = o['Census 2011 Code'] || null;
    const match = byKey.get(norm(state) + '|' + norm(district));
    if (!match) continue;
    matched++;
    out.push({
      state: match.state, district: match.district,
      ...(code ? { lgd_code: code } : {}),
      extra: { ...(match.extra || {}), ...(census2011 ? { census_2011_code_lgd: census2011 } : {}) },
      sources: { ...(match.sources || {}), ...(code ? { lgd_code: prov } : {}) },
    });
  }
  if (!matched) throw new Error('LGD matched 0 districts by name — check census loaded first');
  return out;
}
