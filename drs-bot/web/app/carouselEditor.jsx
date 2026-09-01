'use client';
// DRS carousel maker — Recykal DRS design language (deep green #049769).
// Every slide is a set of positioned element BOXES on a fixed safe grid:
//  - the logo header and url/arrow footer are reserved zones (content can't overlap them),
//  - each text box AUTO-FITS its copy (shrinks to fit — aligned on the first cut),
//  - in Edit mode every box is DRAG-move + RESIZE (overrides saved per slide).
// Exports a multi-page PDF (jspdf) or per-slide PNG (html-to-image).
import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const GREEN = '#049769';
const RATIOS = { '1:1': [1080, 1080], '4:5': [1080, 1350] };
const DISPLAY_W = 384;
const TYPES = ['cover', 'text_image', 'two_block', 'steps', 'sequence', 'stat', 'quote', 'list', 'cta'];

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hlHead(text, keyword) {
  const t = esc(text); if (!keyword) return t;
  const k = esc(keyword); const i = t.toLowerCase().indexOf(k.toLowerCase());
  if (i < 0) return t;
  return t.slice(0, i) + `<span style="color:${GREEN}">` + t.slice(i, i + k.length) + '</span>' + t.slice(i + k.length);
}
// Inline markup: **x** = green+bold, __x__ = plain bold, ==x== = green highlighter.
const mdGreen = (text) => esc(text)
  .replace(/==(.+?)==/g, `<span style="background:rgba(4,151,105,.20);border-radius:3px;padding:0 .12em">$1</span>`)
  .replace(/\*\*(.+?)\*\*/g, `<b style="color:${GREEN}">$1</b>`)
  .replace(/__(.+?)__/g, '<b>$1</b>')
  .replace(/\n/g, '<br>');
// Headline that honors inline markers if present, else greens the keyword.
const richHead = (text, keyword) => (/(\*\*|__|==)/.test(text || '') ? mdGreen(text) : hlHead(text, keyword));
const newId = () => 's' + Math.random().toString(36).slice(2, 8);

// Pick the closest standard image aspect ratio to a box's width/height, so a
// generated photo fills the slide's image slot without awkward cropping.
const ASPECTS = [['1:1', 1], ['5:4', 1.25], ['4:3', 1.3333], ['3:2', 1.5], ['16:9', 1.7778], ['4:5', 0.8], ['3:4', 0.75], ['2:3', 0.6667], ['9:16', 0.5625]];
function nearestAspect(r) { let best = ASPECTS[0]; for (const a of ASPECTS) if (Math.abs(a[1] - r) < Math.abs(best[1] - r)) best = a; return best[0]; }

// Crisp arrow (renders identically in editor + PDF, unlike the unicode →).
const ArrowRt = ({ size = 16, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="4" y1="12" x2="19.5" y2="12" /><polyline points="12.5 5 20 12 12.5 19" />
  </svg>
);

// Stable (module-level) form field — defined outside render so inputs don't
// remount on each keystroke (which would drop focus).
const INP = { width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', boxSizing: 'border-box', marginTop: 2 };
function Field({ label, value, onChange, area, rows = 2, placeholder, format, onSize, size }) {
  const ref = useRef(null);
  // wrap the current selection in a marker (** = green+bold, __ = bold)
  const wrap = (m) => {
    const ta = ref.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd; const v = value || '';
    if (s == null || s === e) return; // need a selection
    onChange(v.slice(0, s) + m + v.slice(s, e) + m + v.slice(e));
  };
  const clearFmt = () => {
    const ta = ref.current; const v = value || '';
    const strip = (t) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/==(.+?)==/g, '$1');
    if (!ta || ta.selectionStart == null || ta.selectionStart === ta.selectionEnd) { onChange(strip(v)); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    onChange(v.slice(0, s) + strip(v.slice(s, e)) + v.slice(e));
  };
  const fb = { fontSize: 10, padding: '2px 7px', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', background: 'var(--bg)', color: 'var(--ink)' };
  const stop = (e) => e.preventDefault(); // keep the field's selection when clicking a button
  return (
    <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-soft)', marginBottom: 6 }}>{label}
      {area
        ? <textarea ref={ref} value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ ...INP, resize: 'vertical' }} />
        : <input ref={ref} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={INP} />}
      {(format || onSize) && (
        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {onSize && <><button type="button" onMouseDown={stop} onClick={() => onSize(0.1)} style={{ ...fb, fontWeight: 700 }} title="Bigger text">A+</button>
            <button type="button" onMouseDown={stop} onClick={() => onSize(-0.1)} style={{ ...fb, fontSize: 8, fontWeight: 700 }} title="Smaller text">A−</button>
            {typeof size === 'number' && Math.abs(size - 1) > 0.001 && <span style={{ fontSize: 9, color: 'var(--ink-soft)' }}>{Math.round(size * 100)}%</span>}</>}
          {format && <>
            <button type="button" onMouseDown={stop} onClick={() => wrap('**')} style={{ ...fb, color: GREEN, fontWeight: 700 }} title="Select text → green + bold">Green</button>
            <button type="button" onMouseDown={stop} onClick={() => wrap('__')} style={{ ...fb, fontWeight: 700 }} title="Select text → bold">Bold</button>
            <button type="button" onMouseDown={stop} onClick={() => wrap('==')} style={{ ...fb, background: 'rgba(4,151,105,.20)' }} title="Select text → highlight">Highlight</button>
            <button type="button" onMouseDown={stop} onClick={clearFmt} style={fb} title="Remove formatting from the selection (or all)">Clear</button>
          </>}
        </div>
      )}
    </label>
  );
}

// AUTO-FLOW model: each slide has a text STACK box (elements flow top→down with
// a FIXED gap, so head↔body spacing is identical on every slide) and an optional
// IMAGE box. Both are draggable/resizable units. Fractions of the card (x,y,w,h);
// content lives in the safe band y∈[0.14,0.86].
const LAYOUTS = {
  cover:      { stack: [.06, .15, .5, .64],  image: [.60, .17, .34, .58] },
  text_image: { stack: [.06, .15, .5, .7],   image: [.58, .18, .36, .5] },
  two_block:  { stack: [.06, .15, .5, .7],   image: [.58, .2, .36, .44] },
  steps:      { stack: [.06, .15, .56, .7],  image: [.66, .34, .28, .42] },
  sequence:   { stack: [.06, .15, .88, .7] },
  stat:       { stack: [.06, .16, .5, .66],  image: [.6, .18, .34, .58] },
  quote:      { stack: [.08, .2, .84, .55] },
  list:       { stack: [.06, .15, .56, .7],  image: [.66, .32, .28, .42] },
  cta:        { stack: [.06, .2, .82, .6] },
};
// Ordered elements inside each type's stack.
const FLOW = {
  cover: ['headline', 'divider', 'sub'],
  text_image: ['headline', 'body', 'callout'],
  two_block: ['body', 'divider', 'headline', 'callout'],
  steps: ['headline', 'sub', 'steps'],
  sequence: ['headline', 'sub', 'seq', 'callout'],
  stat: ['stat', 'headline', 'caption'],
  quote: ['quote', 'attribution'],
  list: ['headline', 'bullets'],
  cta: ['headline', 'sub', 'cta'],
};

// Auto-fit text: fill the box, shrink font-size until it fits (aligned first cut).
function Fit({ html, children, maxFs, minFs = 8, weight, color = '#111', align = 'left', lh = 1.18, editable, onBlur, extra }) {
  const ref = useRef(null);
  const [fs, setFs] = useState(maxFs);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    let s = maxFs; el.style.fontSize = s + 'px';
    let g = 0;
    while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && s > minFs && g < 80) { s -= 1; el.style.fontSize = s + 'px'; g++; }
    setFs(s);
  }, [html, maxFs, children]);
  const style = { width: '100%', height: '100%', overflow: 'hidden', fontSize: fs, fontWeight: weight, color, textAlign: align, lineHeight: lh, outline: 'none', ...extra };
  if (children != null) return <div ref={ref} style={style}>{children}</div>;
  return <div ref={ref} contentEditable={editable} suppressContentEditableWarning onBlur={onBlur} style={{ ...style, cursor: editable ? 'text' : 'default' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function CarouselEditor({ id, market = '', model, doc: docProp, onChange, onError }) {
  const [doc, setDoc] = useState(() => {
    const d = docProp && Array.isArray(docProp.slides) ? { ...docProp } : { ratio: '1:1', slides: [], images: {} };
    d.ratio = d.ratio || '1:1'; d.images = d.images || {};
    d.slides = (d.slides || []).map((s) => (s.id ? s : { ...s, id: newId() }));
    return d;
  });
  const [cur, setCur] = useState(0);
  const [edit, setEdit] = useState(true);
  const [sel, setSel] = useState(null);          // selected element key on current slide
  const [busy, setBusy] = useState({});
  const [exporting, setExporting] = useState(false);
  const exportRefs = useRef({});

  const commit = useCallback((next) => { setDoc(next); onChange?.(next); }, [onChange]);
  const setSlide = (idx, patch) => commit({ ...doc, slides: doc.slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const setSlideById = (sid, patch) => commit({ ...doc, slides: doc.slides.map((s) => (s.id === sid ? { ...s, ...patch } : s)) });
  const setImage = (sid, url) => commit({ ...doc, images: { ...doc.images, [sid]: url } });
  const setLayout = (idx, key, box) => { const s = doc.slides[idx]; const layout = { ...(s.layout || {}), [key]: box }; setSlide(idx, { layout }); };

  const [dw, dh] = doc.ratio === '4:5' ? [DISPLAY_W, Math.round(DISPLAY_W * 1.25)] : [DISPLAY_W, DISPLAY_W];

  // Draft a smart image prompt from THIS slide's copy (user can edit it after).
  const smartFill = async (slide) => {
    setBusy((b) => ({ ...b, ['p_' + slide.id]: true }));
    try {
      const body = [slide.body, slide.sub, slide.callout, ...(slide.steps || []).map((s) => s.text), ...(slide.bullets || []), slide.quote].filter(Boolean).join(' ');
      const res = await fetch('/api/image-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headline: slide.headline || slide.headTop || '', body, market }) }).then((r) => r.json()).catch(() => null);
      if (res?.ok && res.prompt) setSlideById(slide.id, { imagePrompt: res.prompt });
      else onError?.(res?.error || 'Could not draft a prompt');
    } catch (e) { onError?.(e.message); }
    setBusy((b) => ({ ...b, ['p_' + slide.id]: false }));
  };
  const genImage = async (slide) => {
    setBusy((b) => ({ ...b, [slide.id]: true }));
    try {
      const usePrompt = (slide.imagePrompt && slide.imagePrompt.trim()) || slide.imageBrief || `people returning empty bottles in ${market || 'a clean market'}`;
      // Match the generated photo to the slide's image-SLOT aspect ratio (not the whole slide).
      const ib = (slide.layout && slide.layout.image) || (LAYOUTS[slide.type] && LAYOUTS[slide.type].image);
      const aspectRatio = ib ? nearestAspect((ib[2] * dw) / (ib[3] * dh)) : (doc.ratio === '4:5' ? '4:5' : '1:1');
      const res = await fetch('/api/creative-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: usePrompt, aspectRatio, market, enhance: !(slide.imagePrompt && slide.imagePrompt.trim()) }) }).then((r) => r.json()).catch(() => null);
      if (res?.ok && res.dataUrl) {
        const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: res.dataUrl }) }).then((r) => r.json()).catch(() => null);
        // Same storage path each time → bust the cache so a regenerate actually shows.
        setImage(slide.id, (up && up.ok && up.url) ? `${up.url}?v=${Date.now()}` : res.dataUrl);
      } else onError?.(res?.error || 'Image generation failed');
    } catch (e) { onError?.(e.message); }
    setBusy((b) => ({ ...b, [slide.id]: false }));
  };
  const uploadImage = (slide, file) => {
    if (!file) return; const r = new FileReader();
    r.onload = async () => { const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: r.result }) }).then((x) => x.json()).catch(() => null); setImage(slide.id, (up && up.ok && up.url) ? `${up.url}?v=${Date.now()}` : r.result); };
    r.readAsDataURL(file);
  };

  const addSlide = (type) => { const s = { id: newId(), type, headline: type === 'cover' ? 'New headline' : type === 'cta' ? 'Your call to action' : 'New slide', keyword: '', sub: '', body: 'Edit this text.', callout: '', calloutStyle: 'filled', bullets: ['Point one', 'Point two', 'Point three'], steps: [{ text: 'Step one', keyword: '' }, { text: 'Step two', keyword: '' }, { text: 'Step three', keyword: '' }], seq: [{ label: 'NOTICE' }, { label: 'ACT' }, { label: 'REPEAT' }], value: '100', unit: '', caption: '', quote: 'A short quote.', attribution: '', ctaLabel: 'Learn more', imageBrief: '' }; const slides = [...doc.slides]; const at = cur + 1; slides.splice(at, 0, s); commit({ ...doc, slides }); setCur(at); setSel(null); };
  const delSlide = (idx) => { if (doc.slides.length <= 1) return; commit({ ...doc, slides: doc.slides.filter((_, i) => i !== idx) }); setCur(Math.max(0, idx - 1)); setSel(null); };
  const move = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= doc.slides.length) return; const slides = [...doc.slides]; [slides[idx], slides[j]] = [slides[j], slides[idx]]; commit({ ...doc, slides }); setCur(j); };
  const dupSlide = (idx) => { const src = doc.slides[idx]; const nid = newId(); const slides = [...doc.slides]; slides.splice(idx + 1, 0, { ...src, id: nid }); const images = { ...doc.images }; if (doc.images[src.id]) images[nid] = doc.images[src.id]; commit({ ...doc, slides, images }); setCur(idx + 1); setSel(null); };
  const resetLayout = (idx) => { setSlide(idx, { layout: {}, hidden: {} }); };

  const pxRatio = 1080 / dw;
  const exportPNG = async (slide) => { const node = exportRefs.current[slide.id]; if (!node) return; try { const { toPng } = await import('html-to-image'); const url = await toPng(node, { pixelRatio: pxRatio, cacheBust: true }); const a = document.createElement('a'); a.href = url; a.download = `recykal-carousel-${cur + 1}.png`; a.click(); } catch (e) { onError?.('PNG export failed: ' + e.message); } };
  const exportPDF = async () => {
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image'); const { jsPDF } = await import('jspdf');
      const [pw, ph] = RATIOS[doc.ratio]; const pdf = new jsPDF({ orientation: pw >= ph ? 'landscape' : 'portrait', unit: 'px', format: [pw, ph] });
      for (let i = 0; i < doc.slides.length; i++) { const node = exportRefs.current[doc.slides[i].id]; if (!node) continue; const url = await toPng(node, { pixelRatio: pxRatio, cacheBust: true }); if (i > 0) pdf.addPage([pw, ph], pw >= ph ? 'landscape' : 'portrait'); pdf.addImage(url, 'PNG', 0, 0, pw, ph); }
      pdf.save('recykal-carousel.pdf');
    } catch (e) { onError?.('PDF export failed: ' + e.message); }
    setExporting(false);
  };

  const slide = doc.slides[cur];
  const btn = { fontSize: 12, padding: '6px 10px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 };
  const on = { ...btn, background: GREEN, color: '#fff', borderColor: GREEN };

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>ratio</span>
        {['1:1', '4:5'].map((r) => <button key={r} onClick={() => commit({ ...doc, ratio: r })} style={doc.ratio === r ? on : btn}>{r}</button>)}
        <span style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
        <button onClick={() => { setEdit((v) => !v); setSel(null); }} style={edit ? on : btn}>{edit ? '✓ Editing' : '✏️ Edit'}</button>
        <button onClick={() => exportPNG(slide)} style={btn}>⬇ PNG (this)</button>
        <button onClick={exportPDF} disabled={exporting} style={on}>{exporting ? 'Exporting…' : '⬇ PDF (all)'}</button>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>Slide {cur + 1} / {doc.slides.length}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
        {doc.slides.map((s, i) => (
          <button key={s.id} onClick={() => { setCur(i); setSel(null); }} title={s.type} style={{ flexShrink: 0, width: 46, height: doc.ratio === '4:5' ? 58 : 46, borderRadius: 8, border: i === cur ? `2px solid ${GREEN}` : '1px solid var(--line)', background: '#fff', color: GREEN, fontSize: 11, fontWeight: 700, cursor: 'pointer', position: 'relative' }}>
            {i + 1}<span style={{ position: 'absolute', bottom: 1, left: 0, right: 0, fontSize: 7, color: 'var(--ink-soft)', fontWeight: 500, textTransform: 'uppercase' }}>{s.type.slice(0, 5)}</span>
          </button>
        ))}
        <select onChange={(e) => { if (e.target.value) { addSlide(e.target.value); e.target.value = ''; } }} defaultValue="" style={{ fontSize: 10.5, borderRadius: 7, border: '1px solid var(--line)', padding: '3px', background: 'var(--bg)', color: 'var(--ink)', flexShrink: 0 }}>
          <option value="">+ add</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Slide slide={slide} idx={cur} total={doc.slides.length} dw={dw} dh={dh} edit={edit} sel={sel} setSel={setSel} imgUrl={doc.images[slide?.id]} set={(patch) => setSlide(cur, patch)} setBox={(key, box) => setLayout(cur, key, box)} />
        {slide && (() => {
          const S = (patch) => setSlide(cur, patch);
          const sizer = (key) => (d) => S({ size: { ...(slide.size || {}), [key]: Math.max(0.6, Math.min(2, (((slide.size || {})[key]) || 1) + d)) } });
          const szOf = (key) => ((slide.size || {})[key]) || 1;
          const F = Field;
          const arr = (key, i, field) => (v) => S({ [key]: (slide[key] || []).map((it, j) => (j === i ? (field ? { ...it, [field]: v } : v) : it)) });
          const t = slide.type;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 240, maxHeight: dh + 40, overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{t} · content</div>
              {/* per-slide EXACT copy fields */}
              {t === 'two_block' ? <><F label="Heading (top)" value={slide.headTop} onChange={(v) => S({ headTop: v })} format onSize={sizer('headline')} size={szOf('headline')} /><F label="Heading (bottom)" value={slide.headBottom} onChange={(v) => S({ headBottom: v })} format /></>
                : t !== 'quote' ? <F label="Headline" value={slide.headline} onChange={(v) => S({ headline: v })} format onSize={sizer('headline')} size={szOf('headline')} /> : null}
              {t !== 'quote' && t !== 'stat' && <F label="Green keyword (optional — or use Green button)" value={slide.keyword} onChange={(v) => S({ keyword: v })} />}
              {['cover', 'steps', 'sequence', 'cta'].includes(t) && <F label="Subtext" value={slide.sub} onChange={(v) => S({ sub: v })} area format onSize={sizer('sub')} size={szOf('sub')} />}
              {['text_image', 'two_block'].includes(t) && <F label="Body" value={slide.body} onChange={(v) => S({ body: v })} area format onSize={sizer('body')} size={szOf('body')} />}
              {['text_image', 'two_block', 'sequence'].includes(t) && <F label="Callout" value={slide.callout} onChange={(v) => S({ callout: v })} format />}
              {t === 'steps' && (slide.steps || []).map((st, i) => <F key={i} label={`Step ${i + 1}`} value={st.text} onChange={arr('steps', i, 'text')} />)}
              {t === 'sequence' && (slide.seq || []).map((q, i) => <F key={i} label={`Label ${i + 1}`} value={q.label} onChange={arr('seq', i, 'label')} />)}
              {t === 'list' && (slide.bullets || []).map((b, i) => <F key={i} label={`Bullet ${i + 1}`} value={b} onChange={arr('bullets', i)} />)}
              {t === 'stat' && <><F label="Value" value={slide.value} onChange={(v) => S({ value: v })} /><F label="Unit" value={slide.unit} onChange={(v) => S({ unit: v })} /><F label="Caption" value={slide.caption} onChange={(v) => S({ caption: v })} area /></>}
              {t === 'quote' && <><F label="Quote" value={slide.quote} onChange={(v) => S({ quote: v })} area /><F label="Attribution" value={slide.attribution} onChange={(v) => S({ attribution: v })} /></>}
              {t === 'cta' && <F label="Button label" value={slide.ctaLabel} onChange={(v) => S({ ctaLabel: v })} />}

              {/* IMAGE prompt + generation */}
              {slideUsesImage(t) && <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginTop: 6 }}>image</div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--ink-soft)' }}>Image prompt (edit before generating)
                  <textarea value={slide.imagePrompt || slide.imageBrief || ''} onChange={(e) => S({ imagePrompt: e.target.value })} rows={4} placeholder="Describe the photo, or Smart-fill from the copy →" style={{ ...INP, resize: 'vertical' }} />
                </label>
                <button onClick={() => smartFill(slide)} disabled={busy['p_' + slide.id]} style={btn}>{busy['p_' + slide.id] ? <><RefreshCw size={12} className="spin" /> drafting…</> : '✨ Smart-fill from copy'}</button>
                <button onClick={() => genImage(slide)} disabled={busy[slide.id]} style={on}>{busy[slide.id] ? <><RefreshCw size={12} className="spin" /> generating…</> : doc.images[slide.id] ? '🖼️ regenerate image' : '🖼️ Generate image'}</button>
                <label style={btn}>📷 Real photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { uploadImage(slide, e.target.files?.[0]); e.target.value = ''; }} /></label>
                {doc.images[slide.id] && <button onClick={() => setImage(slide.id, null)} style={btn}>✕ clear image</button>}
              </>}

              {/* restore any deleted elements */}
              {Object.keys(slide.hidden || {}).filter((k) => slide.hidden[k]).length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginBottom: 3 }}>Deleted elements — tap to restore:</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {Object.keys(slide.hidden).filter((k) => slide.hidden[k]).map((k) => (
                      <button key={k} onClick={() => S({ hidden: { ...slide.hidden, [k]: false } })} style={{ ...btn, fontSize: 11, padding: '3px 8px' }}>+ {k}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginTop: 6 }}>slide</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => move(cur, -1)} disabled={cur === 0} title="move left" style={{ ...btn, flex: 1 }}><ChevronLeft size={13} /></button>
                <button onClick={() => move(cur, 1)} disabled={cur === doc.slides.length - 1} title="move right" style={{ ...btn, flex: 1 }}><ChevronRight size={13} /></button>
                <button onClick={() => dupSlide(cur)} title="duplicate slide" style={{ ...btn, flex: 1 }}>⧉</button>
                <button onClick={() => resetLayout(cur)} title="reset layout & restore elements" style={{ ...btn, flex: 1 }}>↺</button>
                <button onClick={() => delSlide(cur)} disabled={doc.slides.length <= 1} title="delete whole slide" style={{ ...btn, flex: 1, color: '#b45309' }}><Trash2 size={12} /></button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)', lineHeight: 1.4 }}>Text auto-flows with a fixed, consistent gap on every slide. On the slide (Edit on): drag the text block or image to move, ◢ to resize, double-click text to edit, ✕ on an element to delete it. The 🗑 here deletes the whole slide.</div>
            </div>
          );
        })()}
      </div>

      {/* hidden full-render stack for export */}
      <div style={{ position: 'absolute', left: -99999, top: 0 }} aria-hidden>
        {doc.slides.map((s, i) => (
          <div key={s.id} ref={(n) => { exportRefs.current[s.id] = n; }}>
            <Slide slide={s} idx={i} total={doc.slides.length} dw={dw} dh={dh} edit={false} sel={null} setSel={() => {}} imgUrl={doc.images[s.id]} set={() => {}} setBox={() => {}} bare />
          </div>
        ))}
      </div>
    </div>
  );
}

function slideUsesImage(type) { return ['cover', 'text_image', 'two_block', 'steps', 'sequence', 'stat', 'list'].includes(type); }

// ---------------- one slide ----------------
function Slide({ slide, idx, total, dw, dh, edit, sel, setSel, imgUrl, set, setBox, bare }) {
  const dragRef = useRef(null);
  const [editingKey, setEditingKey] = useState(null);
  useLayoutEffect(() => {
    if (!edit) return;
    const mv = (e) => {
      const d = dragRef.current; if (!d) return;
      const nx = (e.clientX - d.sx) / dw, ny = (e.clientY - d.sy) / dh;
      let box = [...d.box];
      if (d.mode === 'move') { box[0] = Math.max(0, Math.min(1 - box[2], d.box[0] + nx)); box[1] = Math.max(0, Math.min(1 - box[3], d.box[1] + ny)); }
      else { box[2] = Math.max(0.1, Math.min(1 - box[0], d.box[2] + nx)); box[3] = Math.max(0.06, Math.min(1 - box[1], d.box[3] + ny)); }
      setBox(d.key, box);
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
  }, [edit, dw, dh, setBox]);

  if (!slide) return <div style={{ width: dw, height: dh, background: '#fff', border: '1px dashed var(--line)', borderRadius: 16 }} />;
  const isLast = idx === total - 1;
  const PAD = Math.round(dw * 0.06);
  const layout = slide.layout || {};
  const boxOf = (key) => layout[key] || (LAYOUTS[slide.type] && LAYOUTS[slide.type][key]) || [.06, .15, .5, .3];

  const startDrag = (e, key, mode) => { if (!edit) return; e.stopPropagation(); setSel(key); dragRef.current = { key, mode, sx: e.clientX, sy: e.clientY, box: boxOf(key) }; };

  const hidden = slide.hidden || {};
  const sz = (k) => (slide.size && slide.size[k]) || 1;   // per-element text-size multiplier
  const LAY = LAYOUTS[slide.type] || LAYOUTS.text_image;
  const flow = FLOW[slide.type] || FLOW.text_image;
  const gapPx = Math.round(dh * 0.026);   // FIXED gap between stacked elements → identical head↔body spacing on every slide
  const base = dw * 0.024;                 // 1em ≈ body size (22–26 @1080); the whole stack auto-fits from here
  const hideEl = (k) => set({ hidden: { ...hidden, [k]: true } });
  // Detach an element from the auto-flow and drag it freely (seed its box from
  // its current on-screen position so it doesn't jump).
  const detachDrag = (e, k) => {
    if (!edit) return; e.stopPropagation();
    const card = e.currentTarget.closest('[data-card]'); const wrapEl = e.currentTarget.parentElement;
    if (!card || !wrapEl) return;
    const cr = card.getBoundingClientRect(), r = wrapEl.getBoundingClientRect();
    const box = [Math.max(0, (r.left - cr.left) / dw), Math.max(0, (r.top - cr.top) / dh), Math.min(0.9, r.width / dw), Math.max(0.06, r.height / dh)];
    setBox(k, box); setSel(k);
    dragRef.current = { key: k, mode: 'move', sx: e.clientX, sy: e.clientY, box };
  };
  const reflow = (k) => { const l = { ...(slide.layout || {}) }; delete l[k]; set({ layout: l }); setSel(null); };

  // draggable / resizable UNIT box (the text stack, or the image)
  const Box = ({ k, children }) => {
    const [x, y, w, h] = boxOf(k);
    const active = edit && sel === k;
    return (
      <div onPointerDown={(e) => { if (e.target.isContentEditable) return; startDrag(e, k, 'move'); }}
        style={{ position: 'absolute', left: x * dw, top: y * dh, width: w * dw, height: h * dh, outline: active ? `2px solid ${GREEN}` : (edit ? '1px dashed rgba(4,151,105,.35)' : 'none'), outlineOffset: 2, borderRadius: 6, cursor: edit ? 'grab' : 'default' }}>
        {children}
        {active && <div onPointerDown={(e) => { e.stopPropagation(); startDrag(e, k, 'resize'); }} style={{ position: 'absolute', right: -6, bottom: -6, width: 13, height: 13, background: '#fff', border: `2px solid ${GREEN}`, borderRadius: 3, cursor: 'nwse-resize', zIndex: 5 }} />}
      </div>
    );
  };

  const imgFill = (
    <div style={{ width: '100%', height: '100%', borderRadius: dw * 0.02, overflow: 'hidden', background: imgUrl ? `center/cover no-repeat url(${imgUrl})` : '#EAF6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: imgUrl ? 'none' : `1px dashed ${GREEN}55` }}>
      {!imgUrl && <span style={{ color: GREEN, fontSize: 10, opacity: .7 }}>image</span>}
    </div>
  );

  // a flow element wrapped with: a drag grip (✥, detach + move freely), a delete
  // ✕, and (when it's detached) a reflow ⇤ to snap it back into the stack.
  const wrap = (k, node, deletable = true) => (
    <div key={k} style={{ position: 'relative', width: '100%' }}>
      {node}
      {edit && <div title="Drag to place this element freely" onPointerDown={(e) => detachDrag(e, k)} style={{ position: 'absolute', left: -9, top: -9, width: 17, height: 17, background: '#fff', border: `2px solid ${GREEN}`, color: GREEN, borderRadius: 4, fontSize: 10, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>✥</div>}
      {edit && layout[k] && <div title="Snap back into the flow" onPointerDown={(e) => { e.stopPropagation(); reflow(k); }} style={{ position: 'absolute', left: 13, top: -9, width: 17, height: 17, background: GREEN, color: '#fff', border: '2px solid #fff', borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>⇤</div>}
      {edit && deletable && <div title="Delete this element" onPointerDown={(e) => { e.stopPropagation(); hideEl(k); }} style={{ position: 'absolute', right: -9, top: -9, width: 17, height: 17, background: '#fff', border: '2px solid #d1483a', color: '#d1483a', borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>✕</div>}
    </div>
  );
  // editable text element (em-sized; scales with the stack's auto-fit)
  const T = (k, html, { em = 1, weight = 400, color = '#111', align = 'left', lh = 1.3, field = k } = {}) => wrap(k,
    <div contentEditable={edit && editingKey === k} suppressContentEditableWarning
      onDoubleClick={() => edit && setEditingKey(k)}
      onBlur={(e) => { setEditingKey(null); set({ [field]: e.currentTarget.innerText }); }}
      style={{ fontSize: `${em}em`, fontWeight: weight, color, textAlign: align, lineHeight: lh, outline: editingKey === k ? `1px solid ${GREEN}` : 'none', cursor: edit ? 'text' : 'default' }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );

  const flowNode = (k) => {
    if (hidden[k]) return null;
    switch (k) {
      case 'headline': {
        const txt = slide.type === 'two_block' ? [slide.headTop, slide.headBottom].filter(Boolean).join(' ') : slide.headline;
        if (!txt && !edit) return null;
        return T('headline', richHead(txt, slide.keyword), { em: ((slide.type === 'cover' || slide.type === 'cta') ? 2.0 : 1.55) * sz('headline'), weight: 800, lh: 1.12, field: slide.type === 'two_block' ? 'headTop' : 'headline' });
      }
      case 'body': return (slide.body || edit) ? T('body', mdGreen(slide.body), { em: 1 * sz('body'), lh: 1.5 }) : null;
      case 'sub': return (slide.sub || edit) ? T('sub', mdGreen(slide.sub), { em: 0.92 * sz('sub'), color: (slide.type === 'steps' || slide.type === 'sequence') ? '#555' : '#222', lh: 1.45 }) : null;
      case 'caption': return (slide.caption || edit) ? T('caption', mdGreen(slide.caption), { em: 0.66 * sz('caption'), color: '#777' }) : null;
      case 'quote': return T('quote', `<span style="color:${GREEN};font-size:1.5em">&ldquo;</span> ` + esc(slide.quote), { em: 1.55 * sz('quote'), weight: 700, lh: 1.3 });
      case 'attribution': return (slide.attribution || edit) ? T('attribution', esc(slide.attribution), { em: 0.66, weight: 600, color: GREEN }) : null;
      case 'divider': return <div key="divider" style={{ width: dw * 0.12, height: 4, background: GREEN, borderRadius: 2, margin: '2px 0' }} />;
      case 'callout': return (slide.callout && slide.callout.trim()) ? wrap('callout', (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderRadius: dw * 0.02, padding: '8px 12px', background: slide.calloutStyle === 'outline' ? 'transparent' : GREEN, border: slide.calloutStyle === 'outline' ? `2px solid ${GREEN}` : 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: slide.calloutStyle === 'outline' ? GREEN : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ArrowRt size={14} color={slide.calloutStyle === 'outline' ? '#fff' : GREEN} /></div>
          <div contentEditable={edit && editingKey === 'callout'} suppressContentEditableWarning onDoubleClick={() => edit && setEditingKey('callout')} onBlur={(e) => { setEditingKey(null); set({ callout: e.currentTarget.innerText }); }} style={{ fontSize: '0.92em', fontWeight: 700, color: slide.calloutStyle === 'outline' ? '#111' : '#fff', outline: 'none' }} dangerouslySetInnerHTML={{ __html: esc(slide.callout) }} />
        </div>
      )) : null;
      case 'stat': return wrap('stat', (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span contentEditable={edit && editingKey === 'stat'} suppressContentEditableWarning onDoubleClick={() => edit && setEditingKey('stat')} onBlur={(e) => { setEditingKey(null); set({ value: e.currentTarget.innerText }); }} style={{ fontSize: '3.6em', fontWeight: 800, color: GREEN, lineHeight: 1, outline: 'none' }}>{slide.value}</span>
          <span contentEditable={edit && editingKey === 'stat'} suppressContentEditableWarning onBlur={(e) => set({ unit: e.currentTarget.innerText })} style={{ fontSize: '1.2em', fontWeight: 700, color: GREEN, outline: 'none' }}>{slide.unit}</span>
        </div>
      ));
      case 'steps': return wrap('steps', (
        <div style={{ background: '#F4F6F5', borderRadius: dw * 0.02, padding: 10, display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
          {(slide.steps || []).map((st, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <div style={{ width: '1.7em', height: '1.7em', borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '.85em' }}>{i + 1}</div>
              <div style={{ fontSize: '0.92em', fontWeight: 600, lineHeight: 1.25 }} dangerouslySetInnerHTML={{ __html: hlHead(st.text, st.keyword) }} />
            </div>
          ))}
        </div>
      ));
      case 'bullets': return wrap('bullets', (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
          {(slide.bullets || []).filter(Boolean).map((bl, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <div style={{ width: '1.3em', height: '1.3em', borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.8em', marginTop: 2 }}>✓</div>
              <div style={{ fontSize: '0.92em', lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: mdGreen(bl) }} />
            </div>
          ))}
        </div>
      ));
      case 'seq': return wrap('seq', (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {(slide.seq || []).map((q, i) => (
            <React.Fragment key={i}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: dw * 0.02, background: imgUrl ? `center/cover no-repeat url(${imgUrl})` : '#EAF6F1', border: imgUrl ? 'none' : `1px dashed ${GREEN}55` }} />
                <div style={{ fontSize: '0.7em', fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginTop: 5 }}>{q.label}</div>
              </div>
              {i < slide.seq.length - 1 && <div style={{ flexShrink: 0 }}><ArrowRt size={18} color={GREEN} /></div>}
            </React.Fragment>
          ))}
        </div>
      ));
      case 'cta': return wrap('cta', (
        <span contentEditable={edit && editingKey === 'cta'} suppressContentEditableWarning onDoubleClick={() => edit && setEditingKey('cta')} onBlur={(e) => { setEditingKey(null); set({ ctaLabel: e.currentTarget.innerText }); }} style={{ display: 'inline-block', background: GREEN, color: '#fff', fontSize: '1em', fontWeight: 700, padding: '10px 20px', borderRadius: 30, outline: 'none' }}>{(slide.ctaLabel && slide.ctaLabel.trim()) ? slide.ctaLabel : 'Learn more'}</span>
      ));
      default: return null;
    }
  };

  // elements without a position override auto-flow in the stack; detached ones
  // (dragged out) render as their own free, draggable boxes.
  const stackChildren = flow.filter((k) => !layout[k]).map(flowNode).filter(Boolean);
  const detached = flow.filter((k) => layout[k]).map((k) => { const n = flowNode(k); return n ? <Box key={k} k={k}>{n}</Box> : null; }).filter(Boolean);
  const els = [
    <Box key="stack" k="stack">
      <Fit maxFs={base} extra={{ display: 'flex', flexDirection: 'column', gap: gapPx, justifyContent: 'flex-start' }}>
        {stackChildren}
      </Fit>
    </Box>,
    ...detached,
  ];
  if (LAY.image && !hidden.image) els.push(<Box key="image" k="image">{imgFill}</Box>);

  return (
    <div>
      {/* bare = the exact exported artwork: square full-bleed, no shadow (matches the IG/LinkedIn slide). Editor preview keeps a rounded card + shadow. */}
      <div data-card onPointerDown={() => edit && setSel(null)} style={{ width: dw, height: dh, background: '#fff', borderRadius: bare ? 0 : 14, position: 'relative', overflow: 'hidden', fontFamily: 'Poppins, system-ui, sans-serif', boxShadow: bare ? 'none' : '0 6px 24px rgba(10,20,40,.14)', boxSizing: 'border-box' }}>
        {/* header — official logo lockup, top-left, fixed size (no effects) */}
        <img src="/logo-dark.png" alt="recykal" crossOrigin="anonymous" style={{ position: 'absolute', left: PAD, top: PAD, height: dw * 0.088, width: 'auto' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        {/* content element boxes */}
        {els}
        {/* footer (reserved) — small label scale (14-18 @1080) */}
        <div style={{ position: 'absolute', left: PAD, bottom: PAD, fontSize: dw * 0.016, color: '#111', fontWeight: 500 }}>www.recykal.com</div>
        {!isLast && <div style={{ position: 'absolute', right: PAD, bottom: PAD, width: 32, height: 32, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRt size={17} color="#fff" /></div>}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: dw * 0.22, height: 5, background: '#111' }} />
      </div>
    </div>
  );
}
