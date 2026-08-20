// Import touchpoints from a local scraper CSV (e.g. the existing gmaps-scraper
// output) into geo_touchpoints. Runs on your laptop — free, residential IP.
// Flexible column mapping: matches common header names case-insensitively.
import { readFileSync } from 'node:fs';
import { parseCSVObjects, num } from '../csv.js';

const pick = (o, names) => {
  for (const n of names) {
    const k = Object.keys(o).find((h) => h.toLowerCase().trim() === n);
    if (k && o[k] !== '') return o[k];
  }
  return null;
};

// Map DRS category from a free-text scraper "category" value.
const CAT_MAP = [
  [/liquor|wine|alcohol|tasmac|beer/i, 'liquor'],
  [/restaurant|bar|hotel|cafe|horeca|food/i, 'horeca'],
  [/super|grocery|retail|kirana|store|mart/i, 'retail'],
  [/scrap|recycl|mrf|kabad|junk/i, 'mrf'],
  [/school/i, 'school'], [/mall/i, 'mall'], [/fuel|petrol|gas/i, 'fuel'],
  [/cinema|theatre|theater|multiplex/i, 'cinema'],
];
const toCategory = (v, fallback) => {
  const s = String(v || '');
  for (const [re, cat] of CAT_MAP) if (re.test(s)) return cat;
  return fallback || (s || null);
};

export async function loadScraperCsv(arg) {
  const [path, defCity, defCat] = String(arg || '').split('::');
  if (!path) throw new Error('usage: node worker/ingest.js import <csvPath>[::City[::category]]');
  const objs = parseCSVObjects(readFileSync(path, 'utf8'));
  const rows = [];
  for (const o of objs) {
    const name = pick(o, ['name', 'title', 'business', 'place']);
    if (!name) continue;
    const city = pick(o, ['city', 'town']) || defCity;
    const category = toCategory(pick(o, ['category', 'type']), defCat);
    if (!city || !category) continue;
    rows.push({
      country: 'India',
      state: pick(o, ['state']) || null,
      city, category, name,
      address: pick(o, ['address', 'addr', 'full_address', 'location']),
      lat: num(pick(o, ['lat', 'latitude'])),
      lon: num(pick(o, ['lon', 'lng', 'longitude'])),
      phone: pick(o, ['phone', 'phone_number', 'mobile', 'contact']),
      rating: num(pick(o, ['rating', 'stars', 'score'])),
      source: 'scraper',
      meta: {},
    });
  }
  return rows;
}
