// Standalone ingestion runner. Fetches an authoritative source, validates, and
// upserts into the verified data layer. Run one source at a time.
//
//   node worker/ingest.js <source> [arg]
//
// Sources:
//   census   — district-level religion (Census 2011 C-01, verified mirror)
//   shrug     — district socioeconomic (SHRUG)
//   lgd       — current district list + LGD codes
//   osm <City>[:category] — touchpoints for one city (all categories if none)
//
// On Render this is invoked by scheduled Cron Jobs (see docs/RENDER_SETUP.md).
import './loadEnv.js';
import { startRun, finishRun, touchSource, upsertDistricts, upsertTouchpoints } from '../lib/datalayer/db.js';
import { validateDistricts, validateTouchpoints } from '../lib/datalayer/validate.js';

async function runDistrictSource(sourceId, loader) {
  const runId = await startRun(sourceId);
  try {
    const rows = await loader();                          // [{state,district,...}]
    const { clean, rejected, flags } = validateDistricts(rows);
    const { written } = await upsertDistricts(clean);
    const status = flags.length ? 'flagged' : 'ok';
    await finishRun(runId, { status, rowsIn: rows.length, rowsWritten: written, rowsRejected: rejected.length, message: flags.join(' | '), details: { flags } });
    await touchSource(sourceId, status);
    console.log(`[${sourceId}] in=${rows.length} written=${written} rejected=${rejected.length} ${flags.length ? 'FLAGS: ' + flags.join('; ') : 'clean'}`);
    if (rejected.length) console.log(`  rejected sample:`, rejected.slice(0, 3));
  } catch (e) {
    await finishRun(runId, { status: 'failed', message: e.message });
    await touchSource(sourceId, 'failed');
    console.error(`[${sourceId}] FAILED:`, e.message);
    process.exitCode = 1;
  }
}

async function runOsm(arg) {
  const [city, category] = String(arg || '').split(':');
  if (!city) throw new Error('osm needs a city: node worker/ingest.js osm Chennai[:retail]');
  const { fetchOsmTouchpoints, OSM_CATEGORIES } = await import('../lib/datalayer/sources/osm.js');
  const cats = category ? [category] : OSM_CATEGORIES;
  const runId = await startRun('osm');
  let totalIn = 0, totalWritten = 0, totalRej = 0;
  try {
    for (const cat of cats) {
      const rows = await fetchOsmTouchpoints({ city, category: cat });
      const { clean, rejected } = validateTouchpoints(rows);
      const { written } = await upsertTouchpoints(clean);
      totalIn += rows.length; totalWritten += written; totalRej += rejected.length;
      console.log(`  [osm] ${city}/${cat}: +${written}`);
      await new Promise((r) => setTimeout(r, 1500));      // be polite to public Overpass
    }
    await finishRun(runId, { status: 'ok', rowsIn: totalIn, rowsWritten: totalWritten, rowsRejected: totalRej, message: `${city}: ${cats.length} categories` });
    await touchSource('osm', 'ok');
    console.log(`[osm] ${city} done — written=${totalWritten}`);
  } catch (e) {
    await finishRun(runId, { status: 'failed', message: e.message });
    await touchSource('osm', 'failed');
    console.error('[osm] FAILED:', e.message);
    process.exitCode = 1;
  }
}

async function main() {
  const [source, arg] = process.argv.slice(2);
  if (!source) { console.error('usage: node worker/ingest.js <census|shrug|lgd|osm> [arg]'); process.exit(1); }
  switch (source) {
    case 'census': { const { loadCensusReligion } = await import('../lib/datalayer/sources/census.js'); return runDistrictSource('census_2011_c01', () => loadCensusReligion(arg)); }
    case 'shrug':  { const { loadShrug }           = await import('../lib/datalayer/sources/shrug.js');  return runDistrictSource('shrug', () => loadShrug(arg)); }
    case 'lgd':    { const { loadLgd }             = await import('../lib/datalayer/sources/lgd.js');    return runDistrictSource('lgd', () => loadLgd(arg)); }
    case 'osm':    return runOsm(arg);
    case 'import': {
      const { loadScraperCsv } = await import('../lib/datalayer/sources/scraperImport.js');
      const { validateTouchpoints } = await import('../lib/datalayer/validate.js');
      const { upsertTouchpoints } = await import('../lib/datalayer/db.js');
      const runId = await startRun('scraper');
      try {
        const rows = await loadScraperCsv(arg);
        const { clean, rejected } = validateTouchpoints(rows);
        const { written } = await upsertTouchpoints(clean);
        await finishRun(runId, { status: 'ok', rowsIn: rows.length, rowsWritten: written, rowsRejected: rejected.length, message: 'scraper CSV import' });
        await touchSource('scraper', 'ok');
        console.log(`[import] in=${rows.length} written=${written} rejected=${rejected.length}`);
      } catch (e) {
        await finishRun(runId, { status: 'failed', message: e.message });
        console.error('[import] FAILED:', e.message); process.exitCode = 1;
      }
      return;
    }
    default: console.error(`unknown source: ${source}`); process.exit(1);
  }
}

main();
