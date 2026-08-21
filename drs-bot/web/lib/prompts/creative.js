import { BRAND_KIT, CHANNEL_SPECS } from '../creative/brandKit.js';

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
- Market / location: ${market || 'Goa'}
- Objective: ${objective || 'Drive awareness and participation in the Deposit Refund Scheme.'}
${narrative ? `- Narrative pillars to draw from: ${String(narrative).slice(0, 800)}` : ''}
${focus ? `- Specific campaign focus for THIS run: ${focus}` : ''}

RULES:
- Respect every character limit below; keep copy punchy and action-oriented; lead with the benefit ("get your deposit back", "keep Goa clean").
- Use "you"/"we" language; make returning containers feel easy and rewarding. No jargon, no guilt.
- Every asset MUST include a "visualBrief": a 1-2 sentence description of the ideal image concept (scene, mood, subject) for a designer/AI to generate later — on-brand (teal/green, clean, Goa context, circular/return theme). Do NOT put text inside the image concept; text is overlaid by the template.
- Provide a "cta" as a short button label where relevant (e.g. "Return & Earn", "Find a drop-off", "Learn more").

CHANNELS TO PRODUCE (${chosen.join(', ')}), with these fields/limits:
${specLines}

Return EXACTLY this JSON shape (include only the requested channels):
{
  "meta_ads": { "feed": {"primaryText":"","headline":"","description":"","cta":"","visualBrief":""}, "story": {"primaryText":"","headline":"","cta":"","visualBrief":""} },
  "google_ads": { "search": {"headlines":["","",""],"descriptions":["",""]}, "display": {"shortHeadline":"","longHeadline":"","description":"","businessName":"Goa DRS","visualBrief":""} },
  "linkedin": { "post": {"text":"","hashtags":["","",""]}, "ad": {"introText":"","headline":"","cta":"","visualBrief":""} },
  "whatsapp": { "message":"", "cta":"", "visualBrief":"" },
  "email": { "subject":"", "preheader":"", "body":"", "cta":"", "visualBrief":"" }
}`;
}
