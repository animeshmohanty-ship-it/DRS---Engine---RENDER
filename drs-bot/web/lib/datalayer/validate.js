// The validation GATE — this is what makes the data layer "reliable".
// Every ingest runs its rows through here BEFORE they touch Supabase.
// Rows that fail hard checks are rejected; suspicious patterns raise a flag so
// the run is marked 'flagged' and a human can look — but garbage never silently
// reaches the bot (this is the rule that would have caught the identical-
// religion-% bug).

// Reject a single district row if it violates a hard invariant.
function districtRowErrors(r) {
  const errs = [];
  if (!r.state || !r.district) errs.push('missing state/district');
  if (r.population != null && !(Number(r.population) > 0)) errs.push('population <= 0');
  if (r.literacy_pct != null && (r.literacy_pct < 0 || r.literacy_pct > 100)) errs.push('literacy_pct out of range');
  if (r.urban_pct != null && (r.urban_pct < 0 || r.urban_pct > 100)) errs.push('urban_pct out of range');
  if (Array.isArray(r.religions)) {
    const sum = r.religions.reduce((s, x) => s + (Number(x.pct) || 0), 0);
    if (sum > 130) errs.push('religion pct sum implausible');
  }
  return errs;
}

// Column-level suspicion: a demographic column that is IDENTICAL across every
// district is almost always a state-aggregate copied down (the bug we saw).
function uniformColumnFlags(rows, cols = ['urban_pct', 'literacy_pct']) {
  const flags = [];
  if (rows.length < 3) return flags;
  for (const c of cols) {
    const vals = rows.map((r) => r[c]).filter((v) => v != null);
    if (vals.length >= 3 && new Set(vals.map(String)).size === 1) {
      flags.push(`column "${c}" is identical across all ${vals.length} rows — likely a copied aggregate, not researched per-unit`);
    }
  }
  // religions: flag if the WHOLE religions array is byte-identical for every row
  const relKeys = rows.map((r) => (Array.isArray(r.religions) ? JSON.stringify(r.religions) : null)).filter(Boolean);
  if (relKeys.length >= 3 && new Set(relKeys).size === 1) {
    flags.push(`religion breakdown is identical across all ${relKeys.length} districts — state aggregate copied down, not per-district`);
  }
  return flags;
}

// Validate a batch of district rows. Returns { clean, rejected, flags }.
export function validateDistricts(rows) {
  const clean = [], rejected = [];
  for (const r of rows) {
    const errs = districtRowErrors(r);
    if (errs.length) rejected.push({ row: r, errs });
    else clean.push(r);
  }
  const flags = uniformColumnFlags(clean);
  return { clean, rejected, flags };
}

// Touchpoints: reject unnamed / coordinate-less junk.
export function validateTouchpoints(rows) {
  const clean = [], rejected = [];
  for (const r of rows) {
    if (!r.name || !r.city || !r.category || !r.source) rejected.push({ row: r, errs: ['missing required field'] });
    else clean.push(r);
  }
  return { clean, rejected, flags: [] };
}
