// Claude adapter for Anthropic Claude 3.5 Sonnet.

const BASE = 'https://api.anthropic.com/v1/messages';

function apiKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  return k;
}

function model() {
  return 'claude-3-5-sonnet-20241022';
}

export async function generateGrounded(prompt, { temperature = 0.2, jsonMode = false } = {}) {
  // Claude's messages API requires system prompt to be in a top-level field, not in messages array.
  let system = 'You are a professional Deposit Return Scheme (DRS) planning assistant.';
  if (jsonMode) {
    system += ' You must output valid JSON data matching the requested schema. Do not add markdown code fences or conversational fluff.';
  } else {
    system += ' Provide helpful, conversational, and highly structured answers in markdown.';
  }

  const messages = [
    {
      role: 'user',
      content: prompt
    }
  ];

  const body = {
    model: model(),
    max_tokens: 4096,
    system: system,
    messages: messages,
    temperature: temperature
  };

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey(),
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Claude ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  
  // Return empty sources as Claude does not have native search grounding built into its raw API
  return { text, sources: [] };
}

export const name = 'claude';
