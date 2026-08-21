// Goa DRS Brand Kit — extracted from the official Brand Guidelines.
// Single source of truth for creative copy tone + template styling.
// (Logo files get uploaded later for Phase C visual rendering.)
export const BRAND_KIT = {
  name: 'Goa DRS',
  fullName: 'Goa Deposit Refund Scheme',
  site: 'goadrs.com',
  tagline: 'Real change starts with you.', // placeholder — confirm exact wording
  about: 'Goa\'s Deposit Refund Scheme (DRS): return your beverage containers and get your deposit back. The infinity mark = circularity — everything consumed is returned. Mission: drive behaviour change at scale to keep Goa clean.',
  colors: {
    primary: '#009B60',   // Verdant Teal
    accent: '#2ECC71',    // Action Green
    secondary: '#1D6ADB', // Goa Azure
    alert: '#E74C3C',     // Alert Red
    surface: '#F4F5F7',   // Neutral Grey
    text: '#000000',      // Text / Black
  },
  // tint scales (from the guidelines) for template flexibility
  tints: {
    primary: { 70: '#4CB284', 50: '#80C6A7', 30: '#B2CACA', 10: '#E5EDED' },
    accent: { 70: '#5CD68E', 50: '#96E3B2', 30: '#CFF2D9', 10: '#F2FCF6' },
    secondary: { 70: '#4D87FF', 50: '#80A9FF', 30: '#B3CBFF', 10: '#E6EFFF' },
    alert: { 70: '#F06B5E', 50: '#F49C95', 30: '#F8C0BC', 10: '#FDEDED' },
  },
  font: {
    family: 'Poppins',
    weights: [300, 400, 500, 600, 700],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  },
  tone: 'Simple, direct, and action-oriented. Turn personal responsibility into collective ownership ("you" → "we"). Warm, inclusive, and positive — speaks to both residents and tourists. Clean/circular/sustainable framing. Never preachy, never guilt-trippy; make returning containers feel easy, rewarding, and part of Goa\'s identity.',
  logo: { light: null, dark: null }, // populated when the user uploads SVG/PNG
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
