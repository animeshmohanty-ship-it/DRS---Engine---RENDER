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
const mdGreen = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, `<b style="color:${GREEN}">$1</b>`);
const newId = () => 's' + Math.random().toString(36).slice(2, 8);

// Default element boxes per slide type — fractions of the card (x,y,w,h).
// Content lives inside the safe band y∈[0.14,0.86]; header/footer own the rest.
const LAYOUTS = {
  cover:      { headline: [.06, .15, .5, .45], sub: [.06, .68, .5, .16], image: [.60, .17, .34, .58] },
  text_image: { body: [.06, .15, .5, .46], image: [.60, .15, .34, .44], callout: [.06, .70, .88, .15] },
  two_block:  { body: [.06, .14, .88, .2], headline: [.06, .4, .5, .28], image: [.6, .42, .34, .28], callout: [.06, .74, .88, .12] },
  steps:      { headline: [.06, .14, .88, .12], sub: [.06, .27, .88, .08], steps: [.06, .37, .56, .48], image: [.66, .4, .28, .42] },
  sequence:   { headline: [.06, .14, .88, .12], sub: [.06, .27, .88, .08], seq: [.06, .38, .88, .36], callout: [.06, .74, .88, .12] },
  stat:       { stat: [.06, .18, .5, .28], headline: [.06, .48, .5, .2], caption: [.06, .69, .5, .14], image: [.6, .18, .34, .58] },
  quote:      { quote: [.08, .22, .84, .42], attribution: [.08, .68, .84, .1] },
  list:       { headline: [.06, .14, .88, .14], bullets: [.06, .3, .56, .54], image: [.66, .34, .28, .42] },
  cta:        { headline: [.06, .22, .88, .3], sub: [.06, .55, .74, .16], cta: [.06, .74, .6, .1] },
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
  const setImage = (sid, url) => commit({ ...doc, images: { ...doc.images, [sid]: url } });
  const setLayout = (idx, key, box) => { const s = doc.slides[idx]; const layout = { ...(s.layout || {}), [key]: box }; setSlide(idx, { layout }); };

  const [dw, dh] = doc.ratio === '4:5' ? [DISPLAY_W, Math.round(DISPLAY_W * 1.25)] : [DISPLAY_W, DISPLAY_W];

  const genImage = async (slide) => {
    setBusy((b) => ({ ...b, [slide.id]: true }));
    try {
      const res = await fetch('/api/creative-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: slide.imageBrief || `people returning empty bottles in ${market || 'a clean market'}`, aspectRatio: doc.ratio === '4:5' ? '4:5' : '1:1', market }) }).then((r) => r.json()).catch(() => null);
      if (res?.ok && res.dataUrl) {
        const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: res.dataUrl }) }).then((r) => r.json()).catch(() => null);
        setImage(slide.id, (up && up.ok && up.url) ? up.url : res.dataUrl);
      } else onError?.(res?.error || 'Image generation failed');
    } catch (e) { onError?.(e.message); }
    setBusy((b) => ({ ...b, [slide.id]: false }));
  };
  const uploadImage = (slide, file) => {
    if (!file) return; const r = new FileReader();
    r.onload = async () => { const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: r.result }) }).then((x) => x.json()).catch(() => null); setImage(slide.id, (up && up.ok && up.url) ? up.url : r.result); };
    r.readAsDataURL(file);
  };

  const addSlide = (type) => { const s = { id: newId(), type, headline: type === 'cover' ? 'New headline' : type === 'cta' ? 'Your call to action' : 'New slide', keyword: '', sub: '', body: 'Edit this text.', callout: '', calloutStyle: 'filled', bullets: ['Point one', 'Point two', 'Point three'], steps: [{ text: 'Step one', keyword: '' }, { text: 'Step two', keyword: '' }, { text: 'Step three', keyword: '' }], seq: [{ label: 'NOTICE' }, { label: 'ACT' }, { label: 'REPEAT' }], value: '100', unit: '', caption: '', quote: 'A short quote.', attribution: '', ctaLabel: 'Learn more', imageBrief: '' }; const slides = [...doc.slides]; const at = cur + 1; slides.splice(at, 0, s); commit({ ...doc, slides }); setCur(at); setSel(null); };
  const delSlide = (idx) => { if (doc.slides.length <= 1) return; commit({ ...doc, slides: doc.slides.filter((_, i) => i !== idx) }); setCur(Math.max(0, idx - 1)); setSel(null); };
  const move = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= doc.slides.length) return; const slides = [...doc.slides]; [slides[idx], slides[j]] = [slides[j], slides[idx]]; commit({ ...doc, slides }); setCur(j); };
  const resetLayout = (idx) => { setSlide(idx, { layout: {} }); };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{slide?.type}</div>
          {slideUsesImage(slide?.type) && <>
            <button onClick={() => genImage(slide)} disabled={busy[slide.id]} style={btn}>{busy[slide.id] ? <><RefreshCw size={12} className="spin" /> generating…</> : doc.images[slide.id] ? '🖼️ regenerate scene' : '🖼️ AI scene'}</button>
            <label style={btn}>📷 Real photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { uploadImage(slide, e.target.files?.[0]); e.target.value = ''; }} /></label>
            {doc.images[slide.id] && <button onClick={() => setImage(slide.id, null)} style={btn}>✕ clear image</button>}
          </>}
          <div style={{ height: 6 }} />
          <button onClick={() => move(cur, -1)} disabled={cur === 0} style={btn}><ChevronLeft size={13} /> move left</button>
          <button onClick={() => move(cur, 1)} disabled={cur === doc.slides.length - 1} style={btn}>move right <ChevronRight size={13} /></button>
          <button onClick={() => resetLayout(cur)} style={btn}>↺ reset layout</button>
          <button onClick={() => delSlide(cur)} disabled={doc.slides.length <= 1} style={{ ...btn, color: '#b45309' }}><Trash2 size={12} /> delete slide</button>
          <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 4 }}>{edit ? 'Double-click text to edit. Click an element then drag to move, or drag its ◢ corner to resize. Text auto-fits its box.' : 'Turn on Edit to move, resize & retype.'}</div>
        </div>
      </div>

      {/* hidden full-render stack for export */}
      <div style={{ position: 'absolute', left: -99999, top: 0 }} aria-hidden>
        {doc.slides.map((s, i) => (
          <div key={s.id} ref={(n) => { exportRefs.current[s.id] = n; }}>
            <Slide slide={s} idx={i} total={doc.slides.length} dw={dw} dh={dh} edit={false} sel={null} setSel={() => {}} imgUrl={doc.images[s.id]} set={() => {}} setBox={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
}

function slideUsesImage(type) { return ['cover', 'text_image', 'two_block', 'steps', 'sequence', 'stat', 'list'].includes(type); }

// ---------------- one slide ----------------
function Slide({ slide, idx, total, dw, dh, edit, sel, setSel, imgUrl, set, setBox }) {
  const dragRef = useRef(null);
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

  // one positioned, draggable, resizable element box
  const Box = ({ k, children }) => {
    const [x, y, w, h] = boxOf(k);
    const active = edit && sel === k;
    return (
      <div onPointerDown={(e) => startDrag(e, k, 'move')} style={{ position: 'absolute', left: x * dw, top: y * dh, width: w * dw, height: h * dh, outline: active ? `2px solid ${GREEN}` : (edit ? '1px dashed rgba(4,151,105,.35)' : 'none'), outlineOffset: 2, borderRadius: 6, cursor: edit ? 'grab' : 'default' }}>
        {children}
        {active && <div onPointerDown={(e) => { e.stopPropagation(); startDrag(e, k, 'resize'); }} style={{ position: 'absolute', right: -6, bottom: -6, width: 13, height: 13, background: '#fff', border: `2px solid ${GREEN}`, borderRadius: 3, cursor: 'nwse-resize' }} />}
      </div>
    );
  };

  const eText = (field) => edit ? (e) => set({ [field]: e.currentTarget.innerText }) : undefined;
  const imgFill = (
    <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', background: imgUrl ? `center/cover no-repeat url(${imgUrl})` : '#EAF6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: imgUrl ? 'none' : `1px dashed ${GREEN}55` }}>
      {!imgUrl && <span style={{ color: GREEN, fontSize: 10, opacity: .7 }}>image</span>}
    </div>
  );

  const els = [];
  const L = LAYOUTS[slide.type] || {};
  const has = (k) => k in L || k in layout;
  const push = (k, node) => els.push(<Box key={k} k={k}>{node}</Box>);

  if (has('headline')) push('headline', <Fit editable={edit} onBlur={eText('headline')} html={hlHead(slide.type === 'two_block' && slide.headTop ? `${slide.headTop} ${slide.headBottom || ''}`.trim() : slide.headline, slide.keyword)} maxFs={dw * (slide.type === 'cta' ? 0.085 : slide.type === 'cover' ? 0.078 : 0.06)} weight={800} />);
  if (has('body')) push('body', <Fit editable={edit} onBlur={eText('body')} html={mdGreen(slide.body)} maxFs={dw * 0.046} weight={400} lh={1.5} />);
  if (has('sub')) push('sub', <Fit editable={edit} onBlur={eText('sub')} html={mdGreen(slide.sub)} maxFs={dw * 0.04} color={slide.type === 'steps' || slide.type === 'sequence' ? '#555' : '#222'} lh={1.45} />);
  if (has('caption')) push('caption', <Fit editable={edit} onBlur={eText('caption')} html={mdGreen(slide.caption)} maxFs={dw * 0.034} color="#777" />);
  if (has('image')) push('image', imgFill);
  if (has('callout') && (slide.callout || edit)) push('callout', (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 8, alignItems: 'center', borderRadius: 12, padding: '0 12px', boxSizing: 'border-box', background: (slide.calloutStyle === 'outline') ? 'transparent' : GREEN, border: (slide.calloutStyle === 'outline') ? `2px solid ${GREEN}` : 'none' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: (slide.calloutStyle === 'outline') ? GREEN : '#fff', color: (slide.calloutStyle === 'outline') ? '#fff' : GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>→</div>
      <Fit editable={edit} onBlur={eText('callout')} html={esc(slide.callout)} maxFs={dw * 0.04} weight={700} color={(slide.calloutStyle === 'outline') ? '#111' : '#fff'} extra={{ display: 'flex', alignItems: 'center' }} />
    </div>
  ));
  if (has('steps')) push('steps', (
    <Fit maxFs={dw * 0.04} extra={{ background: '#F4F6F5', borderRadius: 12, padding: 10, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        {(slide.steps || []).map((st, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <div style={{ width: '1.7em', height: '1.7em', borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: '.9em' }}>{i + 1}</div>
            <div style={{ fontWeight: 600, lineHeight: 1.25 }} dangerouslySetInnerHTML={{ __html: hlHead(st.text, st.keyword) }} />
          </div>
        ))}
      </div>
    </Fit>
  ));
  if (has('bullets')) push('bullets', (
    <Fit maxFs={dw * 0.042}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
        {(slide.bullets || []).filter(Boolean).map((bl, i) => (
          <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <div style={{ width: '1.3em', height: '1.3em', borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.8em', marginTop: 2 }}>✓</div>
            <div style={{ lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: mdGreen(bl) }} />
          </div>
        ))}
      </div>
    </Fit>
  ));
  if (has('seq')) push('seq', (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      {(slide.seq || []).map((q, i) => (
        <React.Fragment key={i}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: imgUrl ? `center/cover no-repeat url(${imgUrl})` : '#EAF6F1', border: imgUrl ? 'none' : `1px dashed ${GREEN}55` }} />
            <div style={{ fontSize: dw * 0.028, fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginTop: 5 }}>{q.label}</div>
          </div>
          {i < slide.seq.length - 1 && <div style={{ color: GREEN, fontSize: 20, fontWeight: 800 }}>→</div>}
        </React.Fragment>
      ))}
    </div>
  ));
  if (has('stat')) push('stat', (
    <Fit maxFs={dw * 0.17} extra={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span contentEditable={edit} suppressContentEditableWarning onBlur={eText('value')} style={{ fontWeight: 800, color: GREEN, outline: 'none' }}>{slide.value}</span>
      <span contentEditable={edit} suppressContentEditableWarning onBlur={eText('unit')} style={{ fontSize: '.35em', fontWeight: 700, color: GREEN, outline: 'none' }}>{slide.unit}</span>
    </Fit>
  ));
  if (has('quote')) push('quote', <Fit editable={edit} onBlur={eText('quote')} html={`<span style="color:${GREEN};font-size:1.6em">&ldquo;</span> ` + esc(slide.quote)} maxFs={dw * 0.062} weight={700} lh={1.3} />);
  if (has('attribution')) push('attribution', <Fit editable={edit} onBlur={eText('attribution')} html={esc(slide.attribution)} maxFs={dw * 0.036} weight={600} color={GREEN} />);
  if (has('cta')) push('cta', (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      <span contentEditable={edit} suppressContentEditableWarning onBlur={eText('ctaLabel')} style={{ display: 'inline-block', background: GREEN, color: '#fff', fontSize: dw * 0.042, fontWeight: 700, padding: '11px 22px', borderRadius: 30, outline: 'none' }}>{slide.ctaLabel || 'Learn more'}</span>
    </div>
  ));

  return (
    <div>
      <div onPointerDown={() => edit && setSel(null)} style={{ width: dw, height: dh, background: '#fff', borderRadius: 16, position: 'relative', overflow: 'hidden', fontFamily: 'Poppins, system-ui, sans-serif', boxShadow: '0 6px 24px rgba(10,20,40,.14)', boxSizing: 'border-box' }}>
        {/* header (reserved) */}
        <div style={{ position: 'absolute', left: PAD, top: PAD, display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src="/recykal-mark.png" alt="" style={{ height: 22, width: 'auto' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div style={{ lineHeight: 1 }}><div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>recykal</div><div style={{ fontSize: 8.5, color: '#333', marginTop: 1 }}>Sustainable Circularity</div></div>
        </div>
        {/* content element boxes */}
        {els}
        {/* footer (reserved) */}
        <div style={{ position: 'absolute', left: PAD, bottom: PAD, fontSize: 11, color: '#111', fontWeight: 500 }}>www.recykal.com</div>
        {!isLast && <div style={{ position: 'absolute', right: PAD, bottom: PAD, width: 30, height: 30, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>→</div>}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: dw * 0.22, height: 5, background: '#111' }} />
      </div>
    </div>
  );
}
