import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/brain/supabaseAdmin.js';
import { getTouchpoints, getTouchpointStats, dataLayerReady } from '../../../lib/datalayer/db.js';

export const dynamic = 'force-dynamic';

// Job queue bridge between the bot and the laptop scraper runner.
// POST { action:'enqueue', city, category, state?, country?, total?, projectId? }
//   → creates a pending job (or reuses a recent pending/running one) → { jobId }
// POST { action:'status', jobId }
//   → { job, rows } — rows = collected touchpoints for that city+category when done
export async function POST(req) {
  try {
    if (!dataLayerReady()) return NextResponse.json({ ok: false, disabled: true });
    const body = (await req.json().catch(() => ({}))) || {};
    const { action } = body;

    if (action === 'enqueue') {
      const { city, category, state = null, country = 'India', total = 40, query = null, projectId = null } = body;
      if (!city || !category) return NextResponse.json({ ok: false, error: 'city and category required' }, { status: 400 });
      // Reuse a job already pending/running for the same target (avoid duplicates).
      const { data: existing } = await supabaseAdmin
        .from('scrape_jobs').select('id, status')
        .eq('country', country).eq('city', city).eq('category', category)
        .in('status', ['pending', 'running'])
        .order('requested_at', { ascending: false }).limit(1);
      if (existing && existing.length) return NextResponse.json({ ok: true, jobId: existing[0].id, reused: true, status: existing[0].status });
      const { data, error } = await supabaseAdmin
        .from('scrape_jobs')
        .insert({ city, category, state, country, total, query, project_id: projectId, status: 'pending' })
        .select('id').single();
      if (error) throw error;
      return NextResponse.json({ ok: true, jobId: data.id, status: 'pending' });
    }

    if (action === 'library') {
      const { country = 'India', state = null } = body;
      const stats = await getTouchpointStats({ country, state });
      return NextResponse.json({ ok: true, ...stats });
    }

    if (action === 'counts') {
      const { country = 'India', state = null } = body;
      const stats = await getTouchpointStats({ country, state });
      return NextResponse.json({ ok: true, byCategory: stats.byCategory });
    }

    if (action === 'status') {
      const { jobId } = body;
      if (!jobId) return NextResponse.json({ ok: false, error: 'jobId required' }, { status: 400 });
      const { data: job, error } = await supabaseAdmin.from('scrape_jobs').select('*').eq('id', jobId).single();
      if (error) throw error;
      let rows = [];
      if (job && (job.status === 'done' || job.status === 'running')) {
        rows = await getTouchpoints({ country: job.country, city: job.city, category: job.category });
      }
      // How long since requested — lets the UI warn if the runner isn't online.
      const waitedMs = job ? Date.now() - new Date(job.requested_at).getTime() : 0;
      return NextResponse.json({ ok: true, job, rows, waitedMs });
    }

    return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
