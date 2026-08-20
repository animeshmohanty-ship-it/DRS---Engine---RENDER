// Minimal .env loader for the standalone worker (Next.js loads env itself, but a
// plain `node worker/…` process does not). No dependency. Checks the usual spots.
// On Render, env comes from the service config, so missing files are fine.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  join(here, '..', '.env.local'),
  join(here, '..', '.env'),
  join(here, '..', '..', '..', '.env'),   // repo root
];

for (const file of candidates) {
  if (!existsSync(file)) continue;
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] != null) continue;              // don't override real env
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  } catch { /* ignore */ }
}
