# Recykal PPT Export Module

Generate Recykal-branded PowerPoint decks **at runtime, in the browser** (or Node) — design
extracted 1:1 from `Recykal_Deck_New Template_2026.pptx`. Built for the DRS Bot dashboard's
"Export PPT" feature: feed it roadmap data, get an instant branded .pptx download. No AI, no
server round-trip, fully deterministic.

## Files

| File | Purpose |
|---|---|
| `recykalDeck.js` | The deck builder — 11 layouts wrapping PptxGenJS (UMD: browser global `RecykalDeck` + CommonJS) |
| `assets.js` | Brand images as base64 (`RECYKAL_ASSETS` global) — logos, cover art, side photo |
| `assets/` | Same images as raw files (reference / optional) |
| `RECYKAL-DECK-SPEC.md` | Full design spec: colors, fonts, exact geometry per layout |
| `demo.html` | Standalone demo — serve this folder and click **Export Sample PPT** |
| `SAMPLE_Recykal_DRS_Roadmap.pptx` | Pre-generated sample using every layout (open in PowerPoint to review) |

## Quick start (browser)

```html
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
<script src="assets.js"></script>
<script src="recykalDeck.js"></script>
<script>
  const deck = new RecykalDeck(new PptxGenJS(), { assets: RECYKAL_ASSETS });
  deck.cover({ title: 'DRS Roadmap', subtitle: 'Ireland' });
  deck.dataTable({
    titleBold: 'Rollout', titleLight: 'KPIs',
    headers: ['Phase','Timeline','Volume (MT)'],
    rows: [['Pilot','Q1 2027','2,400'], ['National','Q4 2028','52,000']]
  });
  deck.thankYou({});
  deck.save('Roadmap.pptx');       // triggers browser download
</script>
```

## React / Vite integration

```bash
npm install pptxgenjs
```

```js
import PptxGenJS from 'pptxgenjs';
import './ppt-export/assets.js';       // sets window.RECYKAL_ASSETS
import './ppt-export/recykalDeck.js';  // sets window.RecykalDeck

export async function exportRoadmapPPT(roadmap) {
  const deck = new window.RecykalDeck(new PptxGenJS(), { assets: window.RECYKAL_ASSETS });
  deck.cover({ title: `DRS Roadmap — ${roadmap.location}` });
  deck.dataNumbers({ titleBold: 'Projected', titleLight: 'Impact', items: roadmap.kpis });
  deck.dataTable({ titleBold: 'Timeline', headers: roadmap.tableHeaders, rows: roadmap.tableRows });
  deck.thankYou({});
  await deck.save(`Recykal_DRS_${roadmap.location}.pptx`);
}
```

Wire `exportRoadmapPPT(data)` to the "Export PPT" button. That's it.

## API — one builder per template layout

Every method adds one slide and returns the PptxGenJS slide object.

| Method | Template slide | Use for |
|---|---|---|
| `deck.cover({title, subtitle})` | 1 | Title slide |
| `deck.topic({title, subtitle, image})` | 10 | Project/topic intro (dark + photo) |
| `deck.separator({title, subtitle, image})` | 11 | Section divider |
| `deck.thankYou({email, phone, website})` | 12 | Closing slide |
| `deck.dataStats({titleBold, titleLight, intro, bullets, stats, image})` | 13 | Narrative + up to 4 stat rows |
| `deck.dataNumbers({titleBold, titleLight, items})` | 14 | Up to 4 big KPI numbers |
| `deck.dataTable({titleBold, titleLight, headers, rows, colW})` | 15 | **Roadmap KPI tables / timelines** (auto-paginates) |
| `deck.process({titleBold, titleLight, steps})` | 16 | 2–5 step horizontal process |
| `deck.processNumbered({titleBold, titleLight, steps})` | 17 | Up to 6 step zigzag process |
| `deck.benefits({titleBold, titleLight, intro, image, items})` | 18 | Up to 4 numbered benefits |
| `deck.blank({titleBold, titleLight, dark})` | — | Branded empty canvas (escape hatch) |

Constructor options:
```js
new RecykalDeck(pptxInstance, {
  assets: RECYKAL_ASSETS,                    // required for logos/art
  footerLeft:  'Private & Confidential',     // default
  footerRight: '© 2026, All rights reserved' // default: current year
});
```

Brand constants exported as `RecykalDeck.COLORS` and `RecykalDeck.FONTS`
(e.g. `RecykalDeck.COLORS.blue === '005DFF'`).

## Notes & constraints

- **Slide size is 10" × 5.625"** (matches the template, which came from Google Slides). Handled automatically by the constructor — don't set `pptx.layout` yourself.
- **Poppins** is referenced but not embedded (PptxGenJS can't embed fonts). Viewers without Poppins get a system fallback — install Poppins for pixel-perfect output.
- Titles use the template's mixed-weight style: `titleBold` renders bold, `titleLight` renders in Poppins Light after it.
- To try the demo: `npx serve ppt-export` (or any static server) → open `demo.html`. Opening via `file://` also works since assets are base64-embedded.
- Full geometry/colors documented in `RECYKAL-DECK-SPEC.md` — consult it before adding new layouts, and keep new code consistent with it.
