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
  if (!existing.length) throw new Error('load `census` first — LGD attaches codes onto district rows');
  // Primary key = Census 2011 district code (stored on each row from census.js);
  // both files carry it, so this matches 640/640. Name is only a fallback.
  const byCode = new Map();
  const byName = new Map();
  for (const d of existing) {
    const c = d.extra && d.extra.census_2011_code;
    if (c != null) byCode.set(Number(c), d);
    byName.set(norm(d.state) + '|' + norm(d.district), d);
  }

  const res = await fetch(LGD_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`LGD fetch ${res.status}`);
  const objs = parseCSVObjects(await res.text());

  const prov = { source: 'lgd', confidence: 'Verified' };
  const seen = new Set();
  const out = [];
  for (const o of objs) {
    const code = o['District Code'];
    const c2011 = o['Census 2011 Code'] ? Number(o['Census 2011 Code']) : null;
    const match = (c2011 != null && byCode.get(c2011)) || byName.get(norm(o['State Name']) + '|' + norm(o['District Name']));
    if (!match || !code) continue;
    const key = match.state + '|' + match.district;
    if (seen.has(key)) continue;                            // first LGD row wins per district
    seen.add(key);
    out.push({
      state: match.state, district: match.district,
      lgd_code: code,
      sources: { ...(match.sources || {}), lgd_code: prov },
    });
  }
  if (!out.length) throw new Error('LGD matched 0 districts — check census loaded first');
  return out;
}
