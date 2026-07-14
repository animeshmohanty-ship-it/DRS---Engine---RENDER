// Provider abstraction — the whole app calls the LLM through here.
// Swapping Gemini -> Claude later is a one-line change (add a claude.js adapter
// exposing the same generateGrounded(prompt) signature, then set LLM_PROVIDER=claude).

import * as gemini from './gemini.js';
import * as groq from './groq.js';
import * as vertex from './vertex.js';

export function getProvider() {
  const p = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  switch (p) {
    case 'gemini':
      return gemini;
    case 'groq':
      return groq;
    case 'gemini-vertex':
    case 'vertex':
      return vertex;
    // case 'claude':
    //   return claude;
    default:
      throw new Error(`Unknown LLM_PROVIDER "${p}" (expected: gemini, groq, gemini-vertex)`);
  }
}
