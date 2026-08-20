// Rewire: build a `stage2`-shaped geography object from the VERIFIED data layer,
// so downstream stages (Resistance/Narrative/Blueprint/Launch/Brief) that read
// projectData.stage2.* get REAL sourced numbers — replacing the retired,
// LLM-generated Geography Intel stage. India-only (data layer scope); returns
// null otherwise so those prompts keep their existing fallbacks.
import { getDistricts, getTouchpoints } from './db.js';

const isIndia = (c) => !c || /india/i.test(String(c));

export async function synthesizeStage2(country, state) {
  if (!isIndia(country) || !state) return null;
  const districts = await getDistricts({ country: country || 'India', state }).catch(() => []);
  if (!districts.length) return null;

  const sum = (f) => districts.reduce((s, d) => s + (Number(d[f]) || 0), 0);
  const population = sum('population');
  const talukas = sum('level2_count');
  const localBodies = sum('level3_count');

  // Top districts as the hierarchy evidence (name + real demographics).
  const hierarchy = districts.slice(0, 25).map((d) => ({
    name: d.district,
    population: d.population,
    urbanPct: d.urban_pct,
    literacyPct: d.literacy_pct,
    subDivisions: d.level2_count,
    localBodies: d.level3_count,
    religions: d.religions,
  }));

  // Touchpoint counts by category from whatever has been extracted (may be sparse).
  const tps = await getTouchpoints({ country: country || 'India' }).catch(() => []);
  const stTps = tps.filter((t) => !t.state || t.state === state);
  const byCat = {};
  for (const t of stTps) {
    (byCat[t.category] = byCat[t.category] || { category: t.category, count: 0, examples: [] });
    byCat[t.category].count++;
    if (byCat[t.category].examples.length < 6) byCat[t.category].examples.push(t.name);
  }
  const groups = Object.values(byCat);

  return {
    _source: 'verified-data-layer',
    intel: {
      geoSchema: { level1: 'District', level2: 'Taluka / Sub-district', level3: 'Gram Panchayat / Ward' },
      stateSummary: {
        population: { value: population, confidence: 'Verified', source: 'Census 2011' },
        districts: { value: districts.length, confidence: 'Verified', source: 'Census 2011 / LGD' },
        talukasOrTehsils: { value: talukas || null, confidence: 'Verified', source: 'LGD' },
        localBodies: { value: localBodies || null, confidence: 'Verified', source: 'LGD' },
      },
      hierarchy,
    },
    touchpoints: { groups, note: groups.length ? 'From verified OSM/scraper extract' : 'No touchpoints extracted yet for this state' },
  };
}
