// Touchpoint source: OpenStreetMap via the Overpass API (free, legal, no key).
// Best for institutional categories (fuel/schools/malls/cinemas/hotels/supermarkets).
// Small informal retail (liquor/kirana/scrap) is sparse in OSM — the scraper
// covers those. Returns normalized geo_touchpoints rows.
const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const UA = 'DRS-Bot/1.0 (Recykal DRS research; animesh.mohanty@recykal.com)';

// DRS category → Overpass tag filter (OR-ed together inside the area).
const CATEGORY_TAGS = {
  fuel:    ['node["amenity"="fuel"]'],
  school:  ['node["amenity"="school"]'],
  mall:    ['node["shop"="mall"]', 'way["shop"="mall"]'],
  cinema:  ['node["amenity"="cinema"]'],
  hotel:   ['node["tourism"="hotel"]', 'way["tourism"="hotel"]'],
  retail:  ['node["shop"="supermarket"]', 'way["shop"="supermarket"]', 'node["shop"="convenience"]', 'node["shop"="general"]'],
  horeca:  ['node["amenity"~"restaurant|bar|pub|cafe|fast_food"]', 'node["tourism"="hotel"]'],
  liquor:  ['node["shop"="alcohol"]'],
  mrf:     ['node["amenity"="recycling"]', 'node["shop"="second_hand"]'],
};

function buildQuery(city, category) {
  const tags = CATEGORY_TAGS[category] || CATEGORY_TAGS.retail;
  const body = tags.map((t) => `${t}(area.a);`).join('\n  ');
  // admin_level 8 = city/municipality in India; fall back to any boundary named `city`.
  return `[out:json][timeout:90];
area["boundary"="administrative"]["name"="${city}"]->.a;
(
  ${body}
);
out center tags 400;`;
}

// Fetch touchpoints for one city+category. Returns geo_touchpoints-shaped rows.
export async function fetchOsmTouchpoints({ city, category, state = null, country = 'India' }) {
  const query = buildQuery(city, category);
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const { elements = [] } = await res.json();
  const seen = new Set();
  const rows = [];
  for (const el of elements) {
    const name = el.tags?.name || el.tags?.['name:en'];
    if (!name) continue;                       // unnamed POIs are useless as touchpoints
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const lat = el.lat ?? el.center?.lat ?? null;
    const lon = el.lon ?? el.center?.lon ?? null;
    rows.push({
      country, state, city, category, name,
      address: el.tags?.['addr:full'] || [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || null,
      lat, lon,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      rating: null,
      source: 'osm',
      meta: { osm_type: el.type, osm_id: el.id, tags: el.tags || {} },
    });
  }
  return rows;
}

export const OSM_CATEGORIES = Object.keys(CATEGORY_TAGS);
