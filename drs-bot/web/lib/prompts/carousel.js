import { BRAND_KIT } from '../creative/brandKit.js';

// Plan a full DRS carousel. The model decides what goes on each slide (or obeys a
// requested count), in the Recykal DRS design language. Output STRICT JSON.
// Slide types map 1:1 to the renderers in carouselEditor.jsx.
export function buildCarouselPrompt({ topic = '', slides = 6, market = '', narrative = '', platform = 'instagram' } = {}) {
  const b = BRAND_KIT;
  const n = Math.max(3, Math.min(10, Number(slides) || 6));
  return `You are a 30-year brand & content strategist for Recykal's Deposit Refund Scheme (DRS). Plan a ${n}-slide social carousel about the topic below, in Recykal's DRS voice. Output STRICT JSON only — no prose, no markdown fences.

TOPIC / BRIEF: "${topic || 'How a Deposit Refund Scheme drives real behaviour change'}"
MARKET: ${market || 'India'}  (adapt the place reference to this market; never say Goa unless the market is Goa)
${narrative ? `NARRATIVE PILLARS: ${String(narrative).slice(0, 600)}` : ''}
BRAND: ${b.about}
VOICE: ${b.tone}

STRUCTURE RULES:
- Exactly ${n} slides. First slide MUST be type "cover". Last slide MUST be type "cta".
- Choose the best type for each middle slide from: text_image, two_block, steps, sequence, stat, quote, list.
- Vary the types — don't repeat the same type back-to-back. Use "steps" or "sequence" when explaining a process; "stat" for a number; "quote" for a punchy line.
- Never invent statistics — for "stat" slides use a plausible ROUND illustrative figure and set "caption" so it reads as illustrative, OR pull only from the narrative pillars.

LENGTH LIMITS (write to fit the layout — this is critical, obey strictly):
- headline: <= 6 words. Pick ONE word/phrase from it as "keyword" (renders green) — keyword MUST appear verbatim in the headline.
- sub: <= 14 words. body: <= 26 words. callout: <= 12 words.
- steps: exactly 3, each "text" <= 7 words. sequence: exactly 3 labels, each 1 word (e.g. NOTICE/ACT/REPEAT). list bullets: 3-4, each <= 6 words.
- stat: "value" is a short number (e.g. "2.4B", "85%"), "unit" <= 2 words, "caption" <= 12 words. quote: <= 16 words. cta sub: <= 16 words, ctaLabel: <= 4 words.
- Tight, benefit-led, "you"/"we" language. No filler. Prefer short punchy sentences over long ones.

IMAGE RULES (imageBrief): an AMBIENT lifestyle scene only — a person returning empty bottles/cans, a clean street/market/store, everyday circular-economy moments in the market. NEVER depict reverse-vending machines, kiosks, bins, devices, hardware, logos, or any on-image text. Bright natural light, generous empty space.

Return EXACTLY this JSON shape:
{
  "title": "<short internal name>",
  "slides": [
    {"type":"cover","headline":"","keyword":"","sub":"","imageBrief":""},
    {"type":"text_image","headline":"","keyword":"","body":"","callout":"","calloutStyle":"filled|outline","imageBrief":""},
    {"type":"two_block","headTop":"","headBottom":"","keyword":"","body":"","callout":"","imageBrief":""},
    {"type":"steps","headline":"","keyword":"","sub":"","steps":[{"text":"","keyword":""},{"text":"","keyword":""},{"text":"","keyword":""}],"imageBrief":""},
    {"type":"sequence","headline":"","keyword":"","sub":"","seq":[{"label":"","imageBrief":""},{"label":"","imageBrief":""},{"label":"","imageBrief":""}],"callout":""},
    {"type":"stat","value":"","unit":"","caption":"","headline":"","keyword":"","imageBrief":""},
    {"type":"quote","quote":"","attribution":""},
    {"type":"list","headline":"","keyword":"","bullets":["","",""],"imageBrief":""},
    {"type":"cta","headline":"","keyword":"","sub":"","ctaLabel":""}
  ]
}
Include ONLY ${n} slide objects in the "slides" array (cover first, cta last), each populated for its chosen type. Omit fields not used by a slide's type.`;
}
