/**
 * recykalDeck.js — Recykal-branded PowerPoint generator (PptxGenJS wrapper)
 * ==========================================================================
 * Design extracted 1:1 from `Recykal_Deck_New Template_2026.pptx` (slide XML,
 * EMU coordinates converted to inches). Slide size: 10" x 5.625" (16:9).
 *
 * Works in BROWSER (classic <script>) and NODE (require).
 *   Browser:  <script src="pptxgen.bundle.js"></script>
 *             <script src="assets.js"></script>
 *             <script src="recykalDeck.js"></script>
 *             const deck = new RecykalDeck(new PptxGenJS(), { assets: RECYKAL_ASSETS });
 *   Node:     const PptxGenJS = require('pptxgenjs');
 *             const assets    = require('./assets.js');
 *             const { RecykalDeck } = require('./recykalDeck.js');
 *             const deck = new RecykalDeck(new PptxGenJS(), { assets });
 *
 * Vite/React: import './assets.js'; import './recykalDeck.js';
 *             then use window.RecykalDeck / window.RECYKAL_ASSETS
 *             (or convert this file to an ES module by appending exports).
 *
 * See RECYKAL-DECK-SPEC.md for the full design spec.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Brand constants (from template XML + slide 19 brand guidelines)
   * ------------------------------------------------------------------ */
  var COLORS = {
    blue:      '005DFF', // Bright Blue  (brand primary)
    purple:    '6E5CFA', // Purple       (brand)
    purpleDeco:'6E5CE1', // Purple used on the right-edge pill decoration
    lightBlue: '567DE8', // Light Blue
    green:     '1DC797', // Bright Green
    darkGreen: '048C69', // Dark Green
    dark:      '141414', // Dark panel (cover / table header)
    black:     '000000',
    text:      '000000', // Primary text on light bg
    textSub:   '434343', // Secondary text
    textMuted: '7F7F7F', // Footer text
    grayLabel: '4C4C4C', // Small labels (thank-you slide)
    circle:    'EFEFEF', // Icon-circle / number-circle fill
    tableAlt:  'F3F3F3', // Table alternating row
    white:     'FFFFFF'
  };

  // Poppins is the brand typeface. If the viewer's machine lacks Poppins,
  // PowerPoint falls back automatically (same behaviour as the original deck
  // when fonts are not embedded).
  var FONT       = 'Poppins';
  var FONT_LIGHT = 'Poppins Light';
  var FONT_MED   = 'Poppins Medium';
  var FONT_SEMI  = 'Poppins SemiBold';

  var PAGE_W = 10;
  var PAGE_H = 5.625;

  /* ------------------------------------------------------------------ */
  function RecykalDeck(pptxInstance, opts) {
    opts = opts || {};
    this.pptx = pptxInstance;
    this.assets = opts.assets || {};             // { logoWhite, logoDark, coverArt, sidePhoto } data-URIs or paths
    this.footerLeft  = opts.footerLeft  || 'Private & Confidential';
    this.footerRight = opts.footerRight || '© ' + new Date().getFullYear() + ', All rights reserved';

    this.pptx.defineLayout({ name: 'RECYKAL_16x9', width: PAGE_W, height: PAGE_H });
    this.pptx.layout = 'RECYKAL_16x9';
    this.pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };
  }

  /* ------------------------------------------------------------------ *
   * Internal helpers
   * ------------------------------------------------------------------ */

  // Image helper: PptxGenJS wants {data:...} for data-URIs, {path:...} for URLs/files
  RecykalDeck.prototype._img = function (src, o) {
    if (!src) return null;
    var im = /^data:/.test(src) ? { data: src } : { path: src };
    for (var k in o) im[k] = o[k];
    return im;
  };

  // Footer: "Private & Confidential" left, copyright right — 6pt Poppins #7F7F7F @ y 5.31"
  RecykalDeck.prototype._footer = function (slide) {
    slide.addText(this.footerLeft, {
      x: 0.25, y: 5.28, w: 2.2, h: 0.18, fontFace: FONT, fontSize: 6,
      color: COLORS.textMuted, align: 'left', valign: 'middle', margin: 0
    });
    slide.addText(this.footerRight, {
      x: 7.55, y: 5.28, w: 2.2, h: 0.18, fontFace: FONT, fontSize: 6,
      color: COLORS.textMuted, align: 'right', valign: 'middle', margin: 0
    });
  };

  // Edge pill decorations (the template's signature motif):
  //  - left pill  : capsule @ (0,0)      0.62 x 2.40  (default green #1DC797)
  //  - right pill : capsule @ (9.43,3.43) 0.57 x 2.20 (default purple #6E5CE1)
  RecykalDeck.prototype._pills = function (slide, o) {
    o = o || {};
    if (o.left !== false) slide.addShape('roundRect', {
      x: -0.31, y: -1.2, w: 0.93, h: 3.6, fill: { color: o.left || COLORS.green },
      rectRadius: 0.46, line: { type: 'none' }
    });
    if (o.right !== false) slide.addShape('roundRect', {
      x: 9.43, y: 3.43, w: 0.86, h: 2.2, fill: { color: o.right || COLORS.purpleDeco },
      rectRadius: 0.43, line: { type: 'none' }
    });
  };

  // Big vertical capsule OUTLINE (5pt) used on cover / topic / separator slides
  RecykalDeck.prototype._capsuleOutline = function (slide, x, y, w, h, color) {
    slide.addShape('roundRect', {
      x: x, y: y, w: w, h: h, rectRadius: w / 2,
      fill: { type: 'none' }, line: { color: color, width: 5 }
    });
  };

  // Mixed-weight title: bold part + light part, 30pt @ (0.81, 0.29) — template header style
  RecykalDeck.prototype._title = function (slide, boldPart, lightPart, color) {
    var runs = [];
    if (boldPart)  runs.push({ text: boldPart,        options: { fontFace: FONT, bold: true,  fontSize: 30 } });
    if (lightPart) runs.push({ text: ' ' + lightPart, options: { fontFace: FONT_LIGHT, bold: false, fontSize: 30 } });
    slide.addText(runs, {
      x: 0.81, y: 0.29, w: 8.5, h: 1.1, color: color || COLORS.text,
      align: 'left', valign: 'middle', margin: 0
    });
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 1 — COVER  (template slide 1)
   * deck.cover({ title, subtitle })
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.cover = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.dark };

    // Blue capsule outline @ (3.71,0) 1.48 x 5.63 (full height, bleeds top+bottom)
    this._capsuleOutline(s, 3.71, -0.6, 1.48, 6.8, COLORS.blue);

    // Cover art (circularity globe) right side @ (4.72,1.18) 4.24 x 3.18
    if (this.assets.coverArt) s.addImage(this._img(this.assets.coverArt, { x: 4.72, y: 1.18, w: 4.24, h: 3.18 }));

    // White logo top-left @ (0.57,0.50) 1.51 x 0.56
    if (this.assets.logoWhite) s.addImage(this._img(this.assets.logoWhite, { x: 0.57, y: 0.50, w: 1.51, h: 0.56 }));

    // Title @ (1.37,2.25) — white
    s.addText(o.title || 'Sustainable Circularity', {
      x: 1.30, y: 2.10, w: 3.2, h: 1.4, fontFace: FONT_SEMI, bold: true, fontSize: 26,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0
    });
    if (o.subtitle) s.addText(o.subtitle, {
      x: 1.30, y: 3.45, w: 3.2, h: 0.5, fontFace: FONT_MED, fontSize: 13,
      color: COLORS.green, align: 'left', valign: 'top', margin: 0
    });

    // www.recykal.com top right — 10pt white
    s.addText('www.recykal.com', {
      x: 8.0, y: 0.50, w: 1.6, h: 0.25, fontFace: FONT, fontSize: 10,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0
    });

    // Green pill bottom-right edge
    this._pills(s, { left: false, right: COLORS.green });
    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 2 — TOPIC INTRO  (template slide 10 — "Procurement of Plastic")
   * deck.topic({ title, subtitle, image })   image: right-side photo (optional)
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.topic = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.black };

    // Right-side photo @ (3.61,0) 5.00 x 5.63
    var photo = o.image || this.assets.sidePhoto;
    if (photo) s.addImage(this._img(photo, { x: 3.61, y: 0, w: 5.0, h: PAGE_H }));

    // Capsule outlines over the photo: blue @ (3.75,-0.01) + dark-green @ (7.06,2.07), both 1.46 x 3.46
    this._capsuleOutline(s, 3.75, -0.01, 1.46, 3.46, COLORS.blue);
    this._capsuleOutline(s, 7.06, 2.07, 1.46, 3.46, COLORS.darkGreen);

    // Title 25pt bold white @ (0.95,1.83) w 2.98
    s.addText(o.title || '', {
      x: 0.95, y: 1.63, w: 2.98, h: 1.2, fontFace: FONT, bold: true, fontSize: 25,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0
    });
    // Subtitle 15pt Poppins Medium @ (0.95,2.89) w 2.2
    if (o.subtitle) s.addText(o.subtitle, {
      x: 0.95, y: 2.89, w: 2.2, h: 1.0, fontFace: FONT_MED, fontSize: 15,
      color: COLORS.white, align: 'left', valign: 'top', margin: 0
    });

    this._pills(s, { left: COLORS.green, right: COLORS.blue });
    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 3 — SECTION SEPARATOR  (template slide 11)
   * deck.separator({ title, subtitle, image })
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.separator = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.black };

    var photo = o.image || this.assets.sidePhoto;
    if (photo) s.addImage(this._img(photo, { x: 3.61, y: 0, w: 5.0, h: PAGE_H }));

    this._capsuleOutline(s, 3.75, -0.01, 1.46, 3.46, COLORS.blue);
    this._capsuleOutline(s, 7.06, 2.07, 1.46, 3.46, COLORS.green);

    // Title 25pt bold @ (0.90,2.25), subtitle 15pt Medium @ (0.90,2.89)
    s.addText(o.title || '', {
      x: 0.90, y: 2.05, w: 3.0, h: 0.7, fontFace: FONT, bold: true, fontSize: 25,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0
    });
    if (o.subtitle) s.addText(o.subtitle, {
      x: 0.90, y: 2.89, w: 2.5, h: 0.5, fontFace: FONT_MED, fontSize: 15,
      color: COLORS.white, align: 'left', valign: 'top', margin: 0
    });

    this._pills(s, { left: COLORS.green, right: COLORS.purpleDeco });
    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 4 — THANK YOU  (template slide 12)
   * deck.thankYou({ email, phone, website })
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.thankYou = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };

    // Black right panel @ (5.18,0) 4.79 x 5.63
    s.addShape('rect', { x: 5.18, y: 0, w: 4.82, h: PAGE_H, fill: { color: COLORS.black }, line: { type: 'none' } });

    // Blue capsule outline straddling the boundary @ (4.97,0) 1.46 x 5.63 (bleeds)
    this._capsuleOutline(s, 4.97, -0.6, 1.46, 6.8, COLORS.blue);

    // Dark logo on the white half @ (2.22,1.91) 2.25 x 0.83
    if (this.assets.logoDark) s.addImage(this._img(this.assets.logoDark, { x: 2.22, y: 1.91, w: 2.25, h: 0.83 }));

    // Contact block
    s.addText(o.website || 'www.recykal.com', {
      x: 2.22, y: 2.98, w: 2.2, h: 0.25, fontFace: FONT, fontSize: 10,
      color: COLORS.blue, align: 'left', valign: 'middle', margin: 0
    });
    s.addText([
      { text: 'Reach out to us on', options: { fontFace: FONT, fontSize: 7, color: COLORS.grayLabel, breakLine: true } },
      { text: o.email || 'marketing@recykal.com', options: { fontFace: FONT, fontSize: 10, color: COLORS.blue, breakLine: true } },
      { text: 'or call at ', options: { fontFace: FONT, fontSize: 7, color: COLORS.grayLabel } },
      { text: o.phone || '+91 7799996255', options: { fontFace: FONT_SEMI, bold: true, fontSize: 10, color: COLORS.text } }
    ], { x: 2.22, y: 3.28, w: 2.4, h: 0.75, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.15 });

    // "Thank You!" 30pt bold white on the black panel @ (6.82,3.02)
    s.addText('Thank You!', {
      x: 6.60, y: 2.90, w: 2.6, h: 1.0, fontFace: FONT, bold: true, fontSize: 30,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0
    });

    this._pills(s, { left: COLORS.green, right: COLORS.purpleDeco });
    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 5 — DATA / STAT LIST  (template slide 13 — "Data Representation Temp 1")
   * deck.dataStats({ titleBold, titleLight, intro, bullets:[...], stats:[{text}], image })
   *   - left column: intro paragraph + bullet list over a light parallelogram
   *   - right column: image (optional) + up to 4 stat rows (icon circle + text)
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.dataStats = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, {});
    this._title(s, o.titleBold || 'Data', o.titleLight || '');

    // Light gray parallelogram backdrop @ (0.63,2.73) 5.34 x 2.40
    s.addShape('parallelogram', {
      x: 0.63, y: 2.73, w: 5.34, h: 2.40, fill: { color: COLORS.circle }, line: { type: 'none' }
    });

    // Intro paragraph 11pt @ (1.14,1.70) w 4.10
    if (o.intro) s.addText(o.intro, {
      x: 1.14, y: 1.55, w: 4.10, h: 1.0, fontFace: FONT, fontSize: 11,
      color: COLORS.text, align: 'left', valign: 'top', margin: 0
    });

    // Bullets 10pt @ (1.01,2.95) w 4.36
    if (o.bullets && o.bullets.length) {
      s.addText(o.bullets.map(function (b) {
        return { text: b, options: { bullet: { characterCode: '2022', indent: 10 }, fontFace: FONT, fontSize: 10, color: COLORS.text, paraSpaceAfter: 6 } };
      }), { x: 1.01, y: 2.95, w: 4.36, h: 2.06, align: 'left', valign: 'top', margin: 4 });
    }

    // Right image @ (5.98,0.54) 3.26 x 2.19
    if (o.image) s.addImage(this._img(o.image, { x: 5.98, y: 0.54, w: 3.26, h: 2.19 }));

    // Stat rows: circle 0.33 @ x 6.20, text @ x 6.55 — rows start y 3.06, step ~0.51
    var stats = (o.stats || []).slice(0, 4);
    for (var i = 0; i < stats.length; i++) {
      var y = 3.06 + i * 0.51;
      s.addShape('ellipse', { x: 6.20, y: y, w: 0.33, h: 0.33, fill: { color: COLORS.circle }, line: { type: 'none' } });
      s.addText(String(i + 1), {
        x: 6.20, y: y, w: 0.33, h: 0.33, fontFace: FONT_MED, fontSize: 10,
        color: COLORS.textSub, align: 'center', valign: 'middle', margin: 0
      });
      s.addText(stats[i].text || String(stats[i]), {
        x: 6.60, y: y - 0.04, w: 2.6, h: 0.42, fontFace: FONT, fontSize: 12,
        color: COLORS.text, align: 'left', valign: 'middle', margin: 0
      });
    }

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 6 — BIG-NUMBER GRID  (template slide 14 — "Data Representation Temp 3")
   * deck.dataNumbers({ titleBold, titleLight, items: [{ value:'1,20,000', text:'MT diverted' }] })
   *   2x2 grid; icon circle with alternating blue/green outline, big number + light caption
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.dataNumbers = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, {});
    this._title(s, o.titleBold || 'Data', o.titleLight || '');

    var cells = [ { x: 0.94, y: 2.26 }, { x: 4.75, y: 2.26 }, { x: 0.94, y: 3.67 }, { x: 4.75, y: 3.67 } ];
    var ringColors = [COLORS.blue, COLORS.green, COLORS.green, COLORS.blue];
    var items = (o.items || []).slice(0, 4);

    for (var i = 0; i < items.length; i++) {
      var c = cells[i];
      // filled circle + offset ring (template motif)
      s.addShape('ellipse', { x: c.x, y: c.y, w: 0.50, h: 0.52, fill: { color: COLORS.circle }, line: { type: 'none' } });
      s.addShape('ellipse', { x: c.x - 0.07, y: c.y, w: 0.50, h: 0.52, fill: { type: 'none' }, line: { color: ringColors[i], width: 1.5 } });
      // number (24pt Medium) + caption (Poppins Light)
      s.addText([
        { text: (items[i].value || '') + ' ', options: { fontFace: FONT_MED, fontSize: 24, color: COLORS.text } },
        { text: items[i].text || '', options: { fontFace: FONT_LIGHT, fontSize: 11, color: COLORS.text } }
      ], { x: c.x + 0.51, y: c.y - 0.17, w: 3.3, h: 1.1, align: 'left', valign: 'top', margin: 0 });
    }

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 7 — DATA TABLE  (template slide 15 — "Data Representation Temp 2")
   * deck.dataTable({ titleBold, titleLight, headers:[...], rows:[[...]], colW:[...], x, y, w })
   *   Table style from template: dark #141414 header w/ white text,
   *   alternating white / #F3F3F3 body rows, Poppins.
   *   THIS is the layout for roadmap KPI tables / timelines.
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.dataTable = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, {});
    this._title(s, o.titleBold || 'Data', o.titleLight || '');

    var headers = o.headers || [];
    var rows = o.rows || [];
    var tableRows = [];

    if (headers.length) tableRows.push(headers.map(function (h) {
      return { text: String(h), options: { fill: { color: COLORS.dark }, color: COLORS.white, bold: true, fontFace: FONT, fontSize: 10, align: 'left', valign: 'middle' } };
    }));
    for (var r = 0; r < rows.length; r++) {
      var fillC = (r % 2 === 0) ? COLORS.white : COLORS.tableAlt;
      tableRows.push(rows[r].map(function (cell) {
        return { text: String(cell), options: { fill: { color: fillC }, color: COLORS.textSub, fontFace: FONT, fontSize: 9.5, align: 'left', valign: 'middle' } };
      }));
    }

    var tw = o.w || 8.4;
    s.addTable(tableRows, {
      x: o.x || 0.80, y: o.y || 1.55, w: tw, colW: o.colW,
      border: { type: 'solid', color: 'E6E6E6', pt: 0.5 },
      rowH: 0.34, margin: 0.06, autoPage: true, autoPageRepeatHeader: true
    });

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 8 — HORIZONTAL PROCESS  (template slide 16 — "Explaining a Process Temp 1")
   * deck.process({ titleBold, titleLight, steps: [{ title, text }] })  — up to 5 steps
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.process = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, {});
    this._title(s, o.titleBold || 'Process', o.titleLight || '');

    var steps = (o.steps || []).slice(0, 5);
    var n = steps.length || 1;
    // Template: 4 columns of width 1.51 centred on circles at x 1.92..7.31 (step 1.80)
    var colW = 1.62, gap = (PAGE_W - 1.2 - n * colW) / (n - 1 || 1);
    for (var i = 0; i < n; i++) {
      var cx = 0.6 + i * (colW + gap) + colW / 2;   // column centre
      // step title 13pt SemiBold @ y 2.02
      s.addText(steps[i].title || '', {
        x: cx - colW / 2, y: 1.98, w: colW, h: 0.45, fontFace: FONT_SEMI, bold: true, fontSize: 13,
        color: COLORS.text, align: 'center', valign: 'middle', margin: 0
      });
      // circle 0.74 @ y 2.59 with step number
      s.addShape('ellipse', { x: cx - 0.37, y: 2.59, w: 0.74, h: 0.74, fill: { color: COLORS.circle }, line: { type: 'none' } });
      s.addText(String(i + 1), {
        x: cx - 0.37, y: 2.59, w: 0.74, h: 0.74, fontFace: FONT_MED, fontSize: 20,
        color: COLORS.textSub, align: 'center', valign: 'middle', margin: 0
      });
      // description 10pt Light @ y 3.42
      s.addText(steps[i].text || '', {
        x: cx - colW / 2, y: 3.45, w: colW, h: 1.3, fontFace: FONT_LIGHT, fontSize: 10,
        color: COLORS.text, align: 'center', valign: 'top', margin: 0
      });
      // connector dots between circles
      if (i < n - 1) {
        s.addText('. . . .', {
          x: cx + 0.40, y: 2.80, w: gap + colW - 0.80, h: 0.30, fontFace: FONT, fontSize: 12,
          color: 'BBBBBB', align: 'center', valign: 'middle', margin: 0
        });
      }
    }

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 9 — NUMBERED ZIGZAG PROCESS  (template slide 17 — "Process Temp 2")
   * deck.processNumbered({ titleBold, titleLight, steps: [{ title, text }] }) — up to 6
   *   Odd steps on the top row, even steps on the bottom row, numbered circles
   *   with alternating green / purple / light-blue rings (exact template colors).
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.processNumbered = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, { left: COLORS.green, right: COLORS.purpleDeco });
    this._title(s, o.titleBold || 'Process', o.titleLight || '');

    var steps = (o.steps || []).slice(0, 6);
    // Template positions (6 steps): odd (1,3,5) circles top @ y1.83; even (2,4,6) circles bottom @ y4.50
    var topX = [0.56, 3.08, 5.98];
    var botX = [1.41, 4.38, 7.00];
    var rings = [COLORS.green, COLORS.purple, COLORS.green, COLORS.purple, COLORS.green, COLORS.lightBlue];

    for (var i = 0; i < steps.length; i++) {
      var top = (i % 2 === 0);
      var idx = Math.floor(i / 2);
      var cxCircle = top ? topX[idx] : botX[idx];
      var cyCircle = top ? 1.83 : 4.49;

      // shadow circle + ring + number (22pt Medium)
      s.addShape('ellipse', { x: cxCircle + 0.06, y: cyCircle, w: 0.44, h: 0.45, fill: { color: COLORS.circle }, line: { type: 'none' } });
      s.addShape('ellipse', { x: cxCircle, y: cyCircle, w: 0.44, h: 0.45, fill: { type: 'none' }, line: { color: rings[i], width: 1.5 } });
      s.addText(String(i + 1), {
        x: cxCircle, y: cyCircle, w: 0.44, h: 0.45, fontFace: FONT_MED, fontSize: 20,
        color: COLORS.text, align: 'center', valign: 'middle', margin: 0
      });

      // text block: title 12 SemiBold + desc 10
      var tx = top ? cxCircle + 0.60 : cxCircle + 0.56;
      var ty = top ? cyCircle + 0.09 : 3.71;
      s.addText([
        { text: steps[i].title || '', options: { fontFace: FONT_SEMI, bold: true, fontSize: 12, color: COLORS.text, breakLine: true } },
        { text: steps[i].text || '', options: { fontFace: FONT, fontSize: 9.5, color: COLORS.textSub } }
      ], { x: tx, y: ty, w: 2.1, h: 1.45, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.05 });
    }

    // decorative mid-line dots (template motif at y ~3.4)
    var dotX = [0.71, 1.56, 3.27, 4.54, 6.17, 7.14];
    var dotC = [COLORS.green, COLORS.lightBlue, COLORS.green, COLORS.purple, COLORS.green, COLORS.lightBlue];
    for (var d = 0; d < dotX.length; d++) {
      s.addShape('ellipse', { x: dotX[d], y: 3.40, w: 0.11, h: 0.11, fill: { color: COLORS.white }, line: { color: dotC[d], width: 0.8 } });
    }

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 10 — BENEFITS  (template slide 18 — "Benefits of Solutions Temp 1")
   * deck.benefits({ titleBold, titleLight, intro, image, items: [{ title, text }] }) — up to 4
   *   Left: intro text + optional image. Right: numbered rows.
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.benefits = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: COLORS.white };
    this._pills(s, { left: COLORS.green, right: COLORS.purpleDeco });
    this._title(s, o.titleBold || 'Benefits', o.titleLight || '');

    if (o.intro) s.addText(o.intro, {
      x: 0.83, y: 1.50, w: 4.11, h: 1.1, fontFace: FONT_LIGHT, fontSize: 11,
      color: COLORS.text, align: 'left', valign: 'top', margin: 0
    });
    if (o.image) s.addImage(this._img(o.image, { x: 0.37, y: 2.73, w: 4.56, h: 2.39 }));

    var items = (o.items || []).slice(0, 4);
    for (var i = 0; i < items.length; i++) {
      var y = 1.48 + i * 1.0;
      // number circle 0.63 @ x 5.62
      s.addShape('ellipse', { x: 5.62, y: y, w: 0.63, h: 0.63, fill: { color: COLORS.circle }, line: { color: COLORS.textSub, width: 0.8 } });
      s.addText(String(i + 1), {
        x: 5.62, y: y, w: 0.63, h: 0.63, fontFace: FONT_LIGHT, fontSize: 21,
        color: COLORS.textSub, align: 'center', valign: 'middle', margin: 0
      });
      // heading 14 Medium + desc 10 Light @ x 6.36
      s.addText([
        { text: items[i].title || '', options: { fontFace: FONT_MED, fontSize: 14, color: COLORS.text, breakLine: true } },
        { text: items[i].text || '', options: { fontFace: FONT_LIGHT, fontSize: 10, color: COLORS.textSub } }
      ], { x: 6.36, y: y - 0.05, w: 3.0, h: 0.95, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.05 });
    }

    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * LAYOUT 11 — BLANK BRANDED CANVAS (escape hatch for custom content)
   * deck.blank({ titleBold, titleLight, dark })  → returns the slide;
   * caller adds anything else via PptxGenJS API directly.
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.blank = function (o) {
    o = o || {};
    var s = this.pptx.addSlide();
    s.background = { color: o.dark ? COLORS.black : COLORS.white };
    this._pills(s, {});
    if (o.titleBold || o.titleLight) this._title(s, o.titleBold, o.titleLight, o.dark ? COLORS.white : COLORS.text);
    this._footer(s);
    return s;
  };

  /* ------------------------------------------------------------------ *
   * Save helpers
   * ------------------------------------------------------------------ */
  RecykalDeck.prototype.save = function (fileName) {
    return this.pptx.writeFile({ fileName: fileName || 'Recykal_Deck.pptx' });
  };
  RecykalDeck.prototype.blob = function () {
    return this.pptx.write({ outputType: 'blob' });   // browser: for custom download handling
  };

  RecykalDeck.COLORS = COLORS;
  RecykalDeck.FONTS = { base: FONT, light: FONT_LIGHT, medium: FONT_MED, semibold: FONT_SEMI };

  /* UMD-ish export */
  var api = { RecykalDeck: RecykalDeck, COLORS: COLORS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.RecykalDeck = RecykalDeck; root.RECYKAL_COLORS = COLORS; }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
