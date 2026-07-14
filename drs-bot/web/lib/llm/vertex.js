// Vertex AI adapter — Google Gen AI SDK (current standard as of 2025+).
// Supports TWO credential modes:
//   1. LOCAL DEV:  GOOGLE_APPLICATION_CREDENTIALS = absolute path to JSON key file
//   2. VERCEL/CLOUD: GCP_CREDENTIALS_JSON = full JSON key file contents as a string

import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

let _tempCredPath = null;

function resolveCredentials() {
  // Mode 1: Vercel / cloud — JSON contents pasted as env var
  const jsonContents = process.env.GCP_CREDENTIALS_JSON;
  if (jsonContents && jsonContents.trim().startsWith('{')) {
    if (!_tempCredPath) {
      // Write to a temp file once so the SDK can read it
      _tempCredPath = join(tmpdir(), 'gcp-vertex-key.json');
      writeFileSync(_tempCredPath, jsonContents, 'utf8');
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = _tempCredPath;
    return;
  }

  // Mode 2: Local dev — absolute file path set in .env.local
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
    return;
  }

  throw new Error(
    'Vertex AI credentials missing. Set either:\n' +
    '  GCP_CREDENTIALS_JSON (paste full JSON contents — for Vercel/cloud)\n' +
    '  GOOGLE_APPLICATION_CREDENTIALS (absolute file path — for local dev)'
  );
}

function getClient() {
  resolveCredentials();

  const project = process.env.GCP_PROJECT_ID;
  if (!project) throw new Error('GCP_PROJECT_ID is not set');

  const location = process.env.GCP_LOCATION || 'global';

  console.log(`[VertexAI] Project: ${project} | Location: ${location}`);
  console.log(`[VertexAI] Credentials path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

  return new GoogleGenAI({ vertexai: true, project, location });
}

function getModelName() {
  return process.env.VERTEX_MODEL || 'gemini-3.1-pro-preview';
}

// Grounded generation. Returns { text, sources:[{title,uri}] }
// Same interface as gemini.js and groq.js so provider.js swaps seamlessly.
export async function generateGrounded(prompt, { temperature = 0.1, customModel = null, grounding = false } = {}) {
  const ai = getClient();
  const modelName = customModel || getModelName();

  console.log(`[VertexAI] Calling model: ${modelName} | Grounding: ${grounding}`);

  const config = {
    temperature,
    maxOutputTokens: 8192,
  };

  if (grounding) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config,
  });

  const text = response.text || '';

  // Extract grounding sources if present
  const groundingChunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const sources = groundingChunks
    .map((c) => (c.web ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null))
    .filter(Boolean);

  if (!text) {
    throw new Error(`[VertexAI] Empty response from ${modelName}. Check your GCP project quota.`);
  }

  return { text, sources };
}

export const name = 'gemini-vertex';
