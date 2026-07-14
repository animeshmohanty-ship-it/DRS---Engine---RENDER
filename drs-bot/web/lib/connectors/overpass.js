// OpenStreetMap Overpass connector — VERIFIED touchpoint counts, free, no key, no billing.
// Returns real counts of the DRS touchpoint universe within a state boundary.

const ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// DRS touchpoint universe (Stage 2 spec). Each subtype maps to OSM tags.
const SUBTYPES = [
  { group: 'Liquor outlets', label: 'Bars / Pubs',        tags: ['amenity=bar', 'amenity=pub'] },
  { group: 'Liquor outlets', label: 'Liquor shops',       tags: ['shop=alcohol'] },
  { group: 'Liquor outlets', label: 'Nightclubs',         tags: ['amenity=nightclub'] },
  { group: 'HORECA',         label: 'Hotels',             tags: ['tourism=hotel'] },
  { group: 'HORECA',         label: 'Restaurants',        tags: ['amenity=restaurant'] },
  { group: 'HORECA',         label: 'Cafés',              tags: ['amenity=cafe'] },
  { group: 'HORECA',         label: 'Fast food',          tags: ['amenity=fast_food'] },
  { group: 'Retail / Kirana', label: 'Convenience / Kirana', tags: ['shop=convenience'] },
  { group: 'Retail / Kirana', label: 'Supermarkets',      tags: ['shop=supermarket'] },
  { group: 'Retail / Kirana', label: 'General stores',    tags: ['shop=general', 'shop=kiosk'] },
  { group: 'Civic Infrastructure', label: 'Material Recovery Facilities (MRFs)', tags: ['amenity=recycling'] },
];

function tagSelector(tag) {
  const [k, v] = tag.split('=');
  return `["${k}"="${v}"]`;
}

function buildQuery(stateName, countryName, adminLevel) {
  let q = '[out:json][timeout:180];\n';
  
  if (countryName) {
    // Restrict area search to boundary within the selected country to prevent global timeout
    q += `area["name"="${countryName}"]["boundary"="administrative"]->.co;\n`;
    if (adminLevel) {
      q += `area["name"="${stateName}"]["boundary"="administrative"]["admin_level"="${adminLevel}"](area.co)->.a;\n`;
    } else {
      q += `area["name"="${stateName}"]["boundary"="administrative"](area.co)->.a;\n`;
    }
  } else {
    if (adminLevel) {
      q += `area["name"="${stateName}"]["boundary"="administrative"]["admin_level"="${adminLevel}"]->.a;\n`;
    } else {
      q += `area["name"="${stateName}"]["boundary"="administrative"]->.a;\n`;
    }
  }

  for (const st of SUBTYPES) {
    const parts = [];
    for (const tag of st.tags) {
      const sel = tagSelector(tag);
      parts.push(`node${sel}(area.a);`);
      parts.push(`way${sel}(area.a);`);
    }
    q += `(${parts.join('')});out count;\n`;
  }
  return q;
}

// Returns { ok, stateName, groups:[{group, total, subtypes:[{label,count}]}], universeTotal, source }.
export async function getTouchpointUniverse(stateName, { countryName = '', adminLevel = '4' } = {}) {
  const query = buildQuery(stateName, countryName, adminLevel);
  let lastError = null;

  for (const endpoint of ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      console.log(`[Overpass] Querying endpoint: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'DRS-Bot/0.1 (Recykal DRS roadmap engine)',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const rawBody = await res.text();

      if (!res.ok) {
        throw new Error(`Overpass ${res.status}: ${rawBody.slice(0, 200)}`);
      }

      let data;
      try {
        data = JSON.parse(rawBody);
      } catch (err) {
        throw new Error(`Overpass returned invalid JSON response: ${rawBody.slice(0, 150)}`);
      }
      const counts = (data.elements || [])
        .filter((el) => el.type === 'count')
        .map((el) => parseInt(el.tags?.total || '0', 10));

      // Map counts back to subtypes by order.
      const subtypeResults = SUBTYPES.map((st, i) => ({
        group: st.group,
        label: st.label,
        count: counts[i] ?? 0,
      }));

      // Aggregate by group.
      const groupMap = new Map();
      for (const s of subtypeResults) {
        if (!groupMap.has(s.group)) groupMap.set(s.group, { group: s.group, total: 0, subtypes: [] });
        const g = groupMap.get(s.group);
        g.total += s.count;
        g.subtypes.push({ label: s.label, count: s.count });
      }
      const groups = [...groupMap.values()];
      const universeTotal = groups.reduce((a, g) => a + g.total, 0);

      return {
        ok: true,
        stateName,
        groups,
        universeTotal,
        source: `OpenStreetMap (Overpass API - ${new URL(endpoint).hostname})`,
        badge: 'Verified',
        note: universeTotal === 0
          ? 'No boundary/data matched — check the state name spelling as it appears in OpenStreetMap.'
          : undefined,
      };
    } catch (e) {
      console.warn(`[Overpass] Endpoint ${endpoint} failed:`, e.message || e);
      lastError = e;
    }
  }

  throw lastError || new Error('All Overpass API endpoints failed');
}

export { SUBTYPES };
