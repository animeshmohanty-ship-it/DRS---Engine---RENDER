// DRS Brain — config + feature flag.
// The whole Brain is OFF unless BRAIN_ENABLED=true, so the app is never at
// risk before the SQL/env are in place.
export const BRAIN_ENABLED = process.env.BRAIN_ENABLED === 'true';
export const EMBED_MODEL = process.env.BRAIN_EMBED_MODEL || 'text-embedding-004';
export const EMBED_DIMS = 768;

// Retrieval defaults
export const RECALL_K = 8;              // chunks pulled per query
export const RECALL_MIN_SIMILARITY = 0.18;
