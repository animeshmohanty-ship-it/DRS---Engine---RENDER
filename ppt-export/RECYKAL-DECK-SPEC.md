# Recykal Deck — Design Specification

> Extracted mechanically from `Recykal_Deck_New Template_2026.pptx` (slide XML, EMU → inches).
> This document is the single source of truth for generating Recykal-branded PowerPoint files.
> Companion code: [`recykalDeck.js`](recykalDeck.js) implements every layout below with PptxGenJS.

## 1. Canvas

| Property | Value |
|---|---|
| Slide size | **10.0" × 5.625"** (16:9 — Google Slides sizing, NOT PowerPoint's 13.33×7.5) |
| PptxGenJS | `pptx.defineLayout({ name:'RECYKAL_16x9', width:10, height:5.625 })` |

⚠️ All coordinates in this spec assume the 10 × 5.625 canvas. Do not use PptxGenJS's default `LAYOUT_16x9`.

## 2. Brand colors

| Token | Hex | Usage |
|---|---|---|
| Bright Blue | `005DFF` | Primary accent — capsule outlines, links, highlights |
| Purple | `6E5CFA` | Secondary accent (rings, step circles) |
| Purple (deco) | `6E5CE1` | Right-edge pill decoration |
| Light Blue | `567DE8` | Tertiary accent |
| Bright Green | `1DC797` | Left-edge pill, rings, positive accents |
| Dark Green | `048C69` | Capsule outline variant |
| Dark panel | `141414` | Cover left panel, table header |
| Black | `000000` | Dark slide backgrounds |
| Text secondary | `434343` | Body/secondary text |
| Text muted | `7F7F7F` | Footer text |
| Label gray | `4C4C4C` | Small labels |
| Circle fill | `EFEFEF` | Icon/number circle fill, parallelogram backdrop |
| Table alt row | `F3F3F3` | Alternating table rows |

(Slide 19 of the template lists "Black HEX 005DFF" — that is a typo in the template itself; black is `000000`.)

## 3. Typography — Poppins family

| Element | Font | Size | Weight |
|---|---|---|---|
| Slide title | Poppins + Poppins Light | 30pt | Mixed: **bold part** + light part |
| Dark-slide title (topic/separator) | Poppins | 25pt | Bold, white |
| "Thank You!" | Poppins | 30pt | Bold, white |
| Big stat number | Poppins Medium | 24pt | — |
| Step number in circle | Poppins Medium | 20–22pt | — |
| Subtitle on dark slides | Poppins Medium | 15pt | — |
| Card/step heading | Poppins SemiBold | 12–14pt | Bold |
| Body text | Poppins / Poppins Light | 10–11pt | — |
| Stat row text | Poppins | 12pt | — |
| Table header | Poppins | 10pt | Bold, white on `141414` |
| Table body | Poppins | 9.5pt | `434343` |
| Contact labels | Poppins | 7pt | `4C4C4C` |
| Footer | Poppins | 6pt | `7F7F7F` |

Fonts are NOT embedded by PptxGenJS. Machines without Poppins fall back (Calibri-ish). For internal Recykal use, Poppins is typically installed; otherwise accept the fallback or install [Poppins](https://fonts.google.com/specimen/Poppins).

## 4. Recurring motifs (every slide)

### 4.1 Footer — on ALL slides
- Left: `Private & Confidential` — 6pt Poppins `7F7F7F` @ (0.25, 5.31), left-aligned
- Right: `© <YEAR>, All rights reserved` — same style @ right edge (x 7.55, w 2.2), right-aligned

### 4.2 Edge pills (signature decoration)
- **Left pill**: green `1DC797` capsule at the top-left edge — (0, 0) 0.62w × 2.40h (rounded, hugs edge)
- **Right pill**: purple `6E5CE1` capsule at (9.43, 3.43) 0.57 × 2.20 (color varies: blue `005DFF` on topic slide, green `1DC797` on cover)

### 4.3 Capsule outlines (dark slides)
Large vertical rounded-rectangle OUTLINES, stroke **5pt**, no fill, radius = width/2:
- Cover: blue `005DFF` @ (3.71, 0) 1.48 × 5.63 (full height)
- Topic/Separator: blue @ (3.75, −0.01) 1.46 × 3.46 AND green/dark-green @ (7.06, 2.07) 1.46 × 3.46 — drawn OVER the right-side photo

## 5. Layout catalog

Each layout = one builder in `recykalDeck.js`. Coordinates are exact template values.

### L1 · COVER (template slide 1) → `deck.cover({title, subtitle})`
- Background `141414`
- White logo (`assets/logo-white.png`) @ (0.57, 0.50) 1.51 × 0.56
- Title: white, ~26pt bold @ (1.37, 2.25) w≈3.2
- `www.recykal.com` 10pt white @ top-right (8.0, 0.50)
- Blue capsule outline @ (3.71, 0) full height
- Circularity globe art (`assets/cover-art.png`) @ (4.72, 1.18) 4.24 × 3.18
- Right pill GREEN on this slide

### L2 · TOPIC INTRO (slide 10) → `deck.topic({title, subtitle, image})`
- Background `000000`; right-half photo @ (3.61, 0) 5.0 × 5.63
- Capsules: blue @ (3.75,−0.01), dark-green @ (7.06, 2.07)
- Title 25pt bold white @ (0.95, 1.83) w 2.98; subtitle 15pt Poppins Medium @ (0.95, 2.89)
- Pills: left green, right BLUE

### L3 · SEPARATOR (slide 11) → `deck.separator({title, subtitle, image})`
- Same as L2 but capsules blue + bright-green, right pill purple `6E5CE1`
- Title @ (0.90, 2.25), subtitle @ (0.90, 2.89)

### L4 · THANK YOU (slide 12) → `deck.thankYou({email, phone, website})`
- White background; BLACK panel right half @ (5.18, 0) 4.79 × 5.63
- Blue capsule outline straddling the split @ (4.97, 0) 1.46 × full height
- Dark logo @ (2.22, 1.91) 2.25 × 0.83 on white half
- Contact block @ (2.22, 2.98→3.9): website 10pt blue / "Reach out to us on" 7pt gray / email 10pt blue / "or call at **phone**"
- "Thank You!" 30pt bold white on black half @ (6.82, 3.02)

### L5 · DATA STATS (slide 13, "Data Representation Temp 1") → `deck.dataStats({titleBold, titleLight, intro, bullets[], stats[], image})`
- Title 30pt mixed @ (0.81, 0.29)
- Gray parallelogram `EFEFEF` @ (0.63, 2.73) 5.34 × 2.40 (backdrop, 25% skew)
- Intro 11pt @ (1.14, 1.70) w 4.10; bullets 10pt @ (1.01, 2.95) w 4.36
- Right: image @ (5.98, 0.54) 3.26 × 2.19; up to 4 stat rows — circle Ø0.33 `EFEFEF` @ x 6.20, y 3.06 + n·0.51; text 12pt @ x 6.55

### L6 · BIG NUMBERS (slide 14, "Temp 3") → `deck.dataNumbers({titleBold, titleLight, items[{value,text}]})`
- 2×2 grid, cells @ (0.94, 2.26) (4.75, 2.26) (0.94, 3.67) (4.75, 3.67)
- Each: `EFEFEF` circle Ø0.50 + OFFSET ring (−0.07 x) 1.5pt alternating blue/green
- Number 24pt Poppins Medium inline with caption in Poppins Light

### L7 · TABLE (slide 15, "Temp 2") → `deck.dataTable({titleBold, titleLight, headers[], rows[][], colW[]})`
- Table @ (0.79, 1.48), total width ≤ 8.4
- Header row: fill `141414`, white bold 10pt
- Body: alternating `FFFFFF` / `F3F3F3`, text `434343` 9.5pt, thin `E6E6E6` borders
- **Use this for roadmap KPI tables and timelines** (auto-pages if too many rows)

### L8 · PROCESS HORIZONTAL (slide 16, "Process Temp 1") → `deck.process({titleBold, titleLight, steps[{title,text}]})`
- Up to 5 columns. Template (4-col): circles Ø0.74 `EFEFEF` @ y 2.59, x from 1.92 step 1.80
- Step title 13pt SemiBold above (y 2.02, centered); description 10pt Light below (y 3.42, w 1.51, centered)
- Builder redistributes columns evenly for 2–5 steps

### L9 · PROCESS ZIGZAG (slide 17, "Process Temp 2") → `deck.processNumbered({titleBold, titleLight, steps[]})`
- 6 numbered steps in two rows: odd steps top (circles @ y 1.83, x 0.56/3.08/5.98), even steps bottom (circles @ y 4.49, x 1.41/4.38/7.00)
- Circles Ø0.44: `EFEFEF` shadow + offset 1.5pt ring — colors green/purple/green/purple/green/lightblue; number 22pt Medium
- Text right of top circles; ABOVE bottom circles (y 3.71); decorative Ø0.11 outline dots along y 3.40

### L10 · BENEFITS (slide 18, "Benefits Temp 1") → `deck.benefits({titleBold, titleLight, intro, image, items[]})`
- Left: intro 11pt Light @ (0.83, 1.55) w 4.11; image @ (0.37, 2.73) 4.56 × 2.39
- Right: up to 4 rows @ y 1.48 + n·1.0 — number circle Ø0.63 `EFEFEF` + 0.8pt dark outline @ x 5.62, number 21pt Light `434343`; heading 14pt Medium + desc 10pt Light @ x 6.36 w ~2.9

### L11 · BLANK BRANDED → `deck.blank({titleBold, titleLight, dark})`
- Escape hatch: background + pills + title + footer only; returns the slide for custom PptxGenJS content.

## 6. Assets

| File | Contents | Used on |
|---|---|---|
| `assets/logo-white.png` | White Recykal logo + tagline | dark backgrounds (cover) |
| `assets/logo-dark.png` | Black Recykal logo + tagline | light backgrounds (thank-you) |
| `assets/cover-art.png` | White circularity globe illustration (transparent) | cover right side |
| `assets/side-photo.jpg` | Right-half photo used on topic/separator slides | L2/L3 default |
| `assets.js` | All four as base64 data-URIs (`RECYKAL_ASSETS`) — no fetch/CORS issues | everywhere |

## 7. Known template quirks

- Template origin is Google Slides — hence 10×5.625 canvas and `Google Shape;N` names.
- The original file embeds Poppins font binaries (`ppt/fonts/`); PptxGenJS cannot embed fonts, so generated decks rely on installed Poppins (graceful fallback otherwise).
- Slide 19 "Black = HEX 005DFF" is a typo in the template (that hex is Bright Blue).
- Footer year: builder uses the current year by default; override via `footerRight` option.
