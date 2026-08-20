// Dependency-free delimited-text parser (handles quotes, embedded delims/newlines).
// Good enough for the government/community CSV & TSV files we ingest; no native
// deps so it deploys cleanly on Render.
export function parseDelimited(text, delim = ',') {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); field = ''; row = []; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}

export const parseCSV = (text) => parseDelimited(text, ',');

// Parse into array of objects keyed by header row.
export function parseDelimitedObjects(text, delim = ',') {
  const rows = parseDelimited(text, delim);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
}

export const parseCSVObjects = (text) => parseDelimitedObjects(text, ',');
export const parseTSVObjects = (text) => parseDelimitedObjects(text, '\t');

export const num = (v) => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
};
