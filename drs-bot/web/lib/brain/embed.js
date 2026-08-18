// Embeddings via Vertex AI (same Google service account as the generator).
import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { EMBED_MODEL } from './config.js';

let _tempCredPath = null;
function resolveCredentials() {
  const jsonContents = process.env.GCP_CREDENTIALS_JSON;
  if (jsonContents && jsonContents.trim().startsWith('{')) {
    if (!_tempCredPath) {
      _tempCredPath = join(tmpdir(), 'gcp-vertex-key.json');
      writeFileSync(_tempCredPath, jsonContents, 'utf8');
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = _tempCredPath;
    return;
  }
  // else rely on GOOGLE_APPLICATION_CREDENTIALS already set (local dev)
}

let _client = null;
function getClient() {
  if (_client) return _client;
  resolveCredentials();
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  _client = new GoogleGenAI({ vertexai: true, project, location });
  return _client;
}

// Returns an array of number[] vectors, one per input string.
// Batches requests so we never exceed the embedding model's per-request token
// cap (~20k). ~4 chars/token, so we keep each batch well under ~12k chars.
const MAX_BATCH_CHARS = 12000;
const MAX_BATCH_ITEMS = 50;

export async function embed(texts) {
  const items = (Array.isArray(texts) ? texts : [texts]).map((t) => String(t || '').slice(0, 8000));
  if (!items.length) return [];
  const ai = getClient();
  const out = [];
  let batch = [], chars = 0;
  const flush = async () => {
    if (!batch.length) return;
    const res = await ai.models.embedContent({ model: EMBED_MODEL, contents: batch });
    for (const e of (res?.embeddings || [])) out.push(e.values || e.value || []);
    batch = []; chars = 0;
  };
  for (const it of items) {
    if (batch.length && (chars + it.length > MAX_BATCH_CHARS || batch.length >= MAX_BATCH_ITEMS)) {
      await flush();
    }
    batch.push(it); chars += it.length;
  }
  await flush();
  return out;
}

export async function embedOne(text) {
  const [v] = await embed([text]);
  return v || [];
}
