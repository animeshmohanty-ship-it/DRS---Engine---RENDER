// Groq adapter for ultra-fast Llama 3.3 generation.

const BASE = 'https://api.groq.com/openai/v1/chat/completions';

function apiKey() {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error('GROQ_API_KEY is not set in environment variables');
  return k;
}

function model() {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

export async function generateGrounded(prompt, { temperature = 0.2, jsonMode = true } = {}) {
  const messages = [];
  if (jsonMode) {
    messages.push({
      role: 'system',
      content: 'You are a professional Deposit Return Scheme (DRS) planning assistant. You must output JSON data exactly matching the requested schema. Do not add markdown code fences, headers, or explanations.'
    });
  } else {
    messages.push({
      role: 'system',
      content: 'You are a professional Deposit Return Scheme (DRS) assistant. Provide helpful, conversational, and highly structured answers in markdown.'
    });
  }
  messages.push({
    role: 'user',
    content: prompt
  });

  const body = {
    messages,
    model: model(),
    temperature: temperature,
    max_tokens: 2048
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey()}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  
  // Return empty sources as Groq does not have built-in web search grounding
  return { text, sources: [] };
}

export const name = 'groq';
