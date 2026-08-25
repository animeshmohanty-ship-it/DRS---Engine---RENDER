// Recykal MASTER BRAND kit — the single brand that appears on every creative,
// for any state/market. Colors + typeface are from Recykal's official brand
// guidelines (deck slide 19). Recykal is the operator; individual programmes
// (e.g. the live Goa DRS) sit UNDER this master brand.
export const BRAND_KIT = {
  name: 'Recykal',
  fullName: 'Recykal',
  site: 'recykal.com',
  tagline: 'Sustainable Circularity',
  about: 'Recykal is India\'s circular-economy technology platform. It designs and runs Deposit Refund Scheme (DRS) programmes — you return your beverage containers and get your deposit back — starting with the live Goa DRS and scaling the model to other states. The mark reads as circularity: everything consumed is returned.',
  colors: {
    primary: '#005DFF',   // Recykal Bright Blue (brand primary)
    accent: '#1DC797',     // Recykal Bright Green
    secondary: '#6E5CFA', // Recykal Purple
    alert: '#E74C3C',     // Alert Red
    surface: '#F4F5F7',   // Neutral Grey
    text: '#000000',      // Text / Black
  },
  // tint scales for template flexibility (approx. brand-hue steps)
  tints: {
    primary: { 70: '#4D87FF', 50: '#80AEFF', 30: '#B3CEFF', 10: '#E6EFFF' },
    accent: { 70: '#5AD6B4', 50: '#8EE3CB', 30: '#C2F1E5', 10: '#EAFBF6' },
    secondary: { 70: '#9B8DFC', 50: '#B7AEFD', 30: '#D4CEFE', 10: '#EFECFF' },
    alert: { 70: '#F06B5E', 50: '#F49C95', 30: '#F8C0BC', 10: '#FDEDED' },
  },
  font: {
    family: 'Poppins',
    weights: [300, 400, 500, 600, 700],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  },
  tone: 'Simple, direct, and action-oriented. Turn personal responsibility into collective ownership ("you" → "we"). Warm, inclusive, positive. Clean/circular/sustainable framing. Never preachy, never guilt-trippy; make returning containers feel easy, rewarding, and part of local identity. Adapt the place reference to the campaign market — never hardcode Goa unless the market IS Goa.',
  // Official master-brand logo lockups (in /public). White for dark/photo
  // backgrounds, dark for light backgrounds.
  logo: { white: '/logo-white.png', dark: '/logo-dark.png', mark: '/recykal-mark.png' },
};

// Channel spec library — real platform limits, used to constrain copy generation.
export const CHANNEL_SPECS = {
  meta_ads: {
    label: 'Meta Ads (Facebook + Instagram)',
    formats: ['Feed 1:1 (1080×1080)', 'Story/Reel 9:16 (1080×1920)'],
    fields: 'primaryText (≤125 chars ideal), headline (≤40), description (≤30), cta (button label)',
  },
  google_ads: {
    label: 'Google Ads',
    formats: ['Search', 'Responsive Display'],
    fields: 'search: 3 headlines (≤30 each) + 2 descriptions (≤90 each); display: shortHeadline (≤30), longHeadline (≤90), description (≤90), businessName (≤25)',
  },
  linkedin: {
    label: 'LinkedIn',
    formats: ['Organic post', 'Single-image ad'],
    fields: 'post: text (≤1300, professional) + 3-5 hashtags; ad: introText (≤150), headline (≤70), cta',
  },
  whatsapp: {
    label: 'WhatsApp',
    formats: ['Broadcast message'],
    fields: 'message (short, friendly, 1-2 lines + a clear next step; may use tasteful emoji), cta',
  },
  email: {
    label: 'Email',
    formats: ['Campaign email'],
    fields: 'subject (≤55), preheader (≤90), body (3-5 short paragraphs), cta',
  },
};
