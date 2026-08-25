import { BRAND_KIT, CHANNEL_SPECS } from '../creative/brandKit.js';

// Single-asset generation — for a specific plan row (channel + format + hook) or
// an independent create. Produces the FULL deliverable + fields for a visual.
export function buildCreativeAssetPrompt({ channel = '', format = '', hook = '', objective = '', market = '', narrative = '' } = {}) {
  const b = BRAND_KIT;
  return `You are a 30-year PR Director and senior Content Strategist for ${b.fullName} (${b.name}). Produce ONE launch-ready deliverable for the exact spec below. Output STRICT JSON only.

BRAND: ${b.about}
Tagline: "${b.tagline}". Voice (non-negotiable): ${b.tone}

SPEC:
- Channel: ${channel || '(any)'}
- Format: ${format || '(pick best)'}
- Objective: ${objective || 'awareness'}
- Market: ${market || 'India'}
- HOOK / core angle (build the whole piece around this): "${hook || 'Deposit Refund Scheme'}"
${narrative ? `- Narrative pillars: ${String(narrative).slice(0, 600)}` : ''}
- Place reference: use the Market above; do NOT mention Goa unless the Market is Goa.

CRAFT BY FORMAT (obey the matching one):
- op-ed / byline: 600-800 words, first person, one sharp argument, evidence, forward CTA.
- press release: FOR IMMEDIATE RELEASE, headline, dateline, inverted-pyramid lede, body, an attributed quote, "About ${b.name}" boilerplate, media contact, end with ###.
- blog / article: 700-1200 words, hook, subheads, insight, takeaways.
- email / broadcast (email): subject + preheader + scannable body + one CTA.
- whatsapp / broadcast (whatsapp): 1-3 lines, tasteful emoji, one clear action, value-first.
- booth / BTL: a short on-ground demo SCRIPT + a punchy poster line.
- social / linkedin: hook-led post + 3-5 hashtags.
- media pitch: short journalist email, news hook, one ask, <150 words.

RULES: brand voice throughout; factual — never invent statistics; if a named quote is needed, use "[DRAFT QUOTE — approve/replace]". Clean, final, publish-ready.

VISUAL BRIEF RULES (critical): the visualBrief is an AMBIENT, on-brand scene only. NEVER depict any physical hardware — no reverse-vending machine, kiosk, collection bin, device or product of any kind (we do not have real product photos and must not invent them). NEVER include logos, brand marks, or on-image text. Describe people and place instead: a person returning empty bottles/cans, hands holding a container, a clean street/market/beach in the Market, everyday circular-economy moments, bright natural light, Recykal blue/green palette, generous empty space for text overlay.

Return EXACTLY:
{"title":"<short label>","content":"<the FULL written deliverable; markdown allowed>","headline":"<≤40 chars, for a visual>","sub":"<≤90 chars supporting line>","cta":"<button label>","hasVisual":true,"visualBrief":"<ambient scene per the rules above; no hardware/logos/text>"}`;
}


// Build the all-channel creative-copy prompt. Returns strict JSON the studio renders.
export function buildCreativePrompt({ market = '', objective = '', narrative = '', focus = '', channels = null } = {}) {
  const b = BRAND_KIT;
  const chosen = (channels && channels.length ? channels : Object.keys(CHANNEL_SPECS));
  const specLines = chosen.map((k) => `- ${k}: ${CHANNEL_SPECS[k]?.fields || ''}`).join('\n');

  return `You are a senior brand copywriter for ${b.fullName} (${b.name}). Write launch-ready ad/marketing copy that OBEYS the brand guidelines below. Output STRICT JSON only — no markdown, no prose outside the JSON.

BRAND:
- What it is: ${b.about}
- Tagline: "${b.tagline}"
- Tone (non-negotiable): ${b.tone}
- Site: ${b.site}

CAMPAIGN CONTEXT:
- Market / location: ${market || 'India'}
- Objective: ${objective || 'Drive awareness and participation in the Deposit Refund Scheme.'}
${narrative ? `- Narrative pillars to draw from: ${String(narrative).slice(0, 800)}` : ''}
${focus ? `- Specific campaign focus for THIS run: ${focus}` : ''}

RULES:
- Respect every character limit below; keep copy punchy and action-oriented; lead with the benefit ("get your deposit back", "keep ${market || 'your city'} clean").
- Use "you"/"we" language; make returning containers feel easy and rewarding. No jargon, no guilt.
- Adapt the place reference to the Market above; do NOT mention Goa unless the Market is Goa.
- Every asset MUST include a "visualBrief": a 1-2 sentence AMBIENT image concept (scene, mood, subject). NEVER depict physical hardware (no reverse-vending machine, kiosk, bin, device or product — we have no real product photos and must not invent them); NEVER include logos, brand marks, or text in the image. Show people and place: someone returning bottles/cans, a clean street/market/beach in the Market, circular-economy moments — Recykal blue/green palette, clean, bright. Text is overlaid by the template.
- Provide a "cta" as a short button label where relevant (e.g. "Return & Earn", "Find a drop-off", "Learn more").

CHANNELS TO PRODUCE (${chosen.join(', ')}), with these fields/limits:
${specLines}

Return EXACTLY this JSON shape (include only the requested channels):
{
  "meta_ads": { "feed": {"primaryText":"","headline":"","description":"","cta":"","visualBrief":""}, "story": {"primaryText":"","headline":"","cta":"","visualBrief":""} },
  "google_ads": { "search": {"headlines":["","",""],"descriptions":["",""]}, "display": {"shortHeadline":"","longHeadline":"","description":"","businessName":"Recykal","visualBrief":""} },
  "linkedin": { "post": {"text":"","hashtags":["","",""]}, "ad": {"introText":"","headline":"","cta":"","visualBrief":""} },
  "whatsapp": { "message":"", "cta":"", "visualBrief":"" },
  "email": { "subject":"", "preheader":"", "body":"", "cta":"", "visualBrief":"" }
}`;
}
