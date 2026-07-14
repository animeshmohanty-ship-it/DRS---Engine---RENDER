// Gemini adapter — grounded generation via Google AI Studio (free tier, no billing).
// Uses google_search grounding so every fact is pulled live and cited.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function apiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY is not set (web/.env.local)');
  return k;
}

function model() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let delay = 1500;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      // Retry on 503 Service Unavailable or 429 Too Many Requests
      if (res.status === 503 || res.status === 429) {
        console.warn(`[Gemini] API returned ${res.status}. Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return res;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      console.warn(`[Gemini] Fetch error: ${e.message}. Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return fetch(url, options);
}

// Grounded generation. Returns { text, sources:[{title,uri}] }.
export async function generateGrounded(prompt, { temperature = 0.2, customModel = null, grounding = false } = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  };
  if (grounding) {
    body.tools = [{ google_search: {} }];
  }
  const activeModel = customModel || model();
  const res = await fetchWithRetry(`${BASE}/${activeModel}:generateContent?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 500)}`);
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts || [])
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n');
  const sources = (cand?.groundingMetadata?.groundingChunks || [])
    .map((c) => (c.web ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null))
    .filter(Boolean);
  return { text, sources };
}

export const name = 'gemini';
