'use client';
// DRS carousel maker — renders slides in Recykal's DRS design language
// (deep green #049769, white bg, logo top-left, url + green swipe-arrow footer),
// template-controlled per slide type, editable in place, with per-slide AI/real
// images, and export to a multi-page PDF or per-slide PNG.
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const GREEN = '#049769';
const RATIOS = { '1:1': [1080, 1080], '4:5': [1080, 1350] };
const DISPLAY_W = 384;
const TYPES = ['cover', 'text_image', 'two_block', 'steps', 'sequence', 'stat', 'quote', 'list', 'cta'];

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// headline with one keyword rendered green
function hlHead(text, keyword) {
  const t = esc(text);
  if (!keyword) return t;
  const k = esc(keyword);
  const i = t.toLowerCase().indexOf(k.toLowerCase());
  if (i < 0) return t;
  return t.slice(0, i) + `<span style="color:${GREEN}">` + t.slice(i, i + k.length) + '</span>' + t.slice(i + k.length);
}
// body: **bold** -> green bold
const mdGreen = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, `<b style="color:${GREEN}">$1</b>`);

function newId() { return 's' + Math.random().toString(36).slice(2, 8); }

export default function CarouselEditor({ id, market = '', model, doc: docProp, onChange, onError }) {
  const [doc, setDoc] = useState(() => {
    const d = docProp && Array.isArray(docProp.slides) ? { ...docProp } : { ratio: '1:1', slides: [], images: {} };
    d.ratio = d.ratio || '1:1';
    d.images = d.images || {};
    d.slides = (d.slides || []).map((s) => (s.id ? s : { ...s, id: newId() }));
    return d;
  });
  const [cur, setCur] = useState(0);
  const [edit, setEdit] = useState(true);
  const [busy, setBusy] = useState({});      // slideId -> generating image
  const [exporting, setExporting] = useState(false);
  const exportRefs = useRef({});             // slideId -> node (hidden full render for export)

  const commit = useCallback((next) => { setDoc(next); onChange?.(next); }, [onChange]);
  const setSlide = (idx, patch) => commit({ ...doc, slides: doc.slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const setImage = (slideId, url) => commit({ ...doc, images: { ...doc.images, [slideId]: url } });

  const [dw, dh] = doc.ratio === '4:5' ? [DISPLAY_W, Math.round(DISPLAY_W * 1.25)] : [DISPLAY_W, DISPLAY_W];

  // ---- per-slide image: AI scene (Nano Banana) or real upload ----
  const genImage = async (slide) => {
    setBusy((b) => ({ ...b, [slide.id]: true }));
    try {
      const res = await fetch('/api/creative-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: slide.imageBrief || `people returning empty bottles in ${market || 'a clean market'}`, aspectRatio: doc.ratio === '4:5' ? '4:5' : '1:1', market }),
      }).then((r) => r.json()).catch(() => null);
      if (res?.ok && res.dataUrl) {
        const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: res.dataUrl }) }).then((r) => r.json()).catch(() => null);
        setImage(slide.id, (up && up.ok && up.url) ? up.url : res.dataUrl);
      } else onError?.(res?.error || 'Image generation failed');
    } catch (e) { onError?.(e.message); }
    setBusy((b) => ({ ...b, [slide.id]: false }));
  };
  const uploadImage = (slide, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      const up = await fetch('/api/creative-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `${id}_${slide.id}`, dataUrl: r.result }) }).then((x) => x.json()).catch(() => null);
      setImage(slide.id, (up && up.ok && up.url) ? up.url : r.result);
    };
    r.readAsDataURL(file);
  };

  // ---- slide ops ----
  const addSlide = (type) => {
    const s = { id: newId(), type, headline: type === 'cover' ? 'New headline' : type === 'cta' ? 'Your call to action' : 'New slide', keyword: '', sub: '', body: '', callout: '', calloutStyle: 'filled', bullets: ['', '', ''], steps: [{ text: '', keyword: '' }], seq: [], imageBrief: '' };
    const slides = [...doc.slides]; const at = cur + 1; slides.splice(at, 0, s); commit({ ...doc, slides }); setCur(at);
  };
  const delSlide = (idx) => { if (doc.slides.length <= 1) return; const slides = doc.slides.filter((_, i) => i !== idx); commit({ ...doc, slides }); setCur(Math.max(0, idx - 1)); };
  const move = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= doc.slides.length) return; const slides = [...doc.slides]; [slides[idx], slides[j]] = [slides[j], slides[idx]]; commit({ ...doc, slides }); setCur(j); };

  // ---- export ----
  const pxRatio = 1080 / dw;
  const exportPNG = async (slide) => {
    const node = exportRefs.current[slide.id]; if (!node) return;
    try { const { toPng } = await import('html-to-image'); const url = await toPng(node, { pixelRatio: pxRatio, cacheBust: true }); const a = document.createElement('a'); a.href = url; a.download = `recykal-carousel-${cur + 1}.png`; a.click(); }
    catch (e) { onError?.('PNG export failed: ' + e.message); }
  };
  const exportPDF = async () => {
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const [pw, ph] = RATIOS[doc.ratio];
      const pdf = new jsPDF({ orientation: pw >= ph ? 'landscape' : 'portrait', unit: 'px', format: [pw, ph] });
      for (let i = 0; i < doc.slides.length; i++) {
        const node = exportRefs.current[doc.slides[i].id]; if (!node) continue;
        const url = await toPng(node, { pixelRatio: pxRatio, cacheBust: true });
        if (i > 0) pdf.addPage([pw, ph], pw >= ph ? 'landscape' : 'portrait');
        pdf.addImage(url, 'PNG', 0, 0, pw, ph);
      }
      pdf.save('recykal-carousel.pdf');
    } catch (e) { onError?.('PDF export failed: ' + e.message); }
    setExporting(false);
  };

  const slide = doc.slides[cur];
  const btn = { fontSize: 12, padding: '6px 10px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 };

  return (
    <div style={{ marginTop: 6 }}>
      {/* top controls */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>ratio</span>
        {['1:1', '4:5'].map((r) => <button key={r} onClick={() => commit({ ...doc, ratio: r })} style={doc.ratio === r ? { ...btn, background: GREEN, color: '#fff', borderColor: GREEN } : btn}>{r}</button>)}
        <span style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
        <button onClick={() => setEdit((v) => !v)} style={edit ? { ...btn, background: GREEN, color: '#fff', borderColor: GREEN } : btn}>{edit ? '✓ Editing' : '✏️ Edit'}</button>
        <button onClick={() => exportPNG(slide)} style={btn}>⬇ PNG (this)</button>
        <button onClick={exportPDF} disabled={exporting} style={{ ...btn, background: GREEN, color: '#fff', borderColor: GREEN }}>{exporting ? 'Exporting…' : '⬇ PDF (all)'}</button>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>Slide {cur + 1} / {doc.slides.length}</span>
      </div>

      {/* filmstrip */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
        {doc.slides.map((s, i) => (
          <button key={s.id} onClick={() => setCur(i)} title={s.type} style={{ flexShrink: 0, width: 46, height: doc.ratio === '4:5' ? 58 : 46, borderRadius: 8, border: i === cur ? `2px solid ${GREEN}` : '1px solid var(--line)', background: '#fff', color: GREEN, fontSize: 11, fontWeight: 700, cursor: 'pointer', position: 'relative' }}>
            {i + 1}
            <span style={{ position: 'absolute', bottom: 1, left: 0, right: 0, fontSize: 7, color: 'var(--ink-soft)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '-.2px' }}>{s.type.slice(0, 5)}</span>
          </button>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <select onChange={(e) => { if (e.target.value) { addSlide(e.target.value); e.target.value = ''; } }} defaultValue="" style={{ fontSize: 10.5, borderRadius: 7, border: '1px solid var(--line)', padding: '3px', background: 'var(--bg)', color: 'var(--ink)' }}>
            <option value="">+ add</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* current slide + per-slide controls */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Slide ref={null} slide={slide} idx={cur} total={doc.slides.length} ratio={doc.ratio} dw={dw} dh={dh} edit={edit} imgUrl={doc.images[slide?.id]} set={(patch) => setSlide(cur, patch)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{slide?.type}</div>
          {slideUsesImage(slide?.type) && <>
            <button onClick={() => genImage(slide)} disabled={busy[slide.id]} style={btn}>{busy[slide.id] ? <><RefreshCw size={12} className="spin" /> generating…</> : doc.images[slide.id] ? '🖼️ regenerate scene' : '🖼️ AI scene'}</button>
            <label style={btn}>📷 Real photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { uploadImage(slide, e.target.files?.[0]); e.target.value = ''; }} /></label>
            {doc.images[slide.id] && <button onClick={() => setImage(slide.id, null)} style={btn}>✕ clear image</button>}
          </>}
          <div style={{ height: 6 }} />
          <button onClick={() => move(cur, -1)} disabled={cur === 0} style={btn}><ChevronLeft size={13} /> move left</button>
          <button onClick={() => move(cur, 1)} disabled={cur === doc.slides.length - 1} style={btn}>move right <ChevronRight size={13} /></button>
          <button onClick={() => delSlide(cur)} disabled={doc.slides.length <= 1} style={{ ...btn, color: '#b45309' }}><Trash2 size={12} /> delete slide</button>
          <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 4 }}>Double-click text on the slide to edit it. Keyword shows green.</div>
        </div>
      </div>

      {/* hidden full-render stack for export (all slides) */}
      <div style={{ position: 'absolute', left: -99999, top: 0 }} aria-hidden>
        {doc.slides.map((s, i) => (
          <div key={s.id} ref={(n) => { exportRefs.current[s.id] = n; }}>
            <Slide slide={s} idx={i} total={doc.slides.length} ratio={doc.ratio} dw={dw} dh={dh} edit={false} imgUrl={doc.images[s.id]} set={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
}

function slideUsesImage(type) { return ['cover', 'text_image', 'two_block', 'steps', 'sequence', 'stat', 'list'].includes(type); }

// ---------- one slide ----------
function Slide({ slide, idx, total, ratio, dw, dh, edit, imgUrl, set }) {
  if (!slide) return <div style={{ width: dw, height: dh, background: '#fff', border: '1px dashed var(--line)', borderRadius: 16 }} />;
  const isLast = idx === total - 1;
  const PAD = Math.round(dw * 0.06);
  const EText = ({ field, html, style, tag = 'div' }) => {
    const Tag = tag;
    return <Tag
      contentEditable={edit} suppressContentEditableWarning
      onBlur={edit ? (e) => set({ [field]: e.currentTarget.innerText }) : undefined}
      style={{ outline: 'none', cursor: edit ? 'text' : 'default', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />;
  };
  const imgCard = (w, h) => (
    <div style={{ width: w, height: h, borderRadius: 14, overflow: 'hidden', background: imgUrl ? `center/cover no-repeat url(${imgUrl})` : '#EAF6F1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: imgUrl ? 'none' : `1px dashed ${GREEN}55` }}>
      {!imgUrl && <span style={{ color: GREEN, fontSize: 10, opacity: .7, textAlign: 'center', padding: 6 }}>image</span>}
    </div>
  );

  const frame = (inner) => (
    <div style={{ width: dw, height: dh, background: '#fff', borderRadius: 16, position: 'relative', overflow: 'hidden', fontFamily: 'Poppins, system-ui, sans-serif', boxShadow: '0 6px 24px rgba(10,20,40,.14)', color: '#111', boxSizing: 'border-box', padding: PAD, display: 'flex', flexDirection: 'column' }}>
      {/* header logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <img src="/recykal-mark.png" alt="" style={{ height: 22, width: 'auto' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em' }}>recykal</div>
          <div style={{ fontSize: 8.5, color: '#333', marginTop: 1 }}>Sustainable Circularity</div>
        </div>
      </div>
      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 6 }}>{inner}</div>
      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#111', fontWeight: 500 }}>www.recykal.com</span>
        {!isLast && <div style={{ width: 30, height: 30, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>→</div>}
      </div>
      {/* corner bar */}
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: dw * 0.22, height: 5, background: '#111' }} />
    </div>
  );

  const H = (extra = {}) => ({ fontSize: dw * 0.075, fontWeight: 800, lineHeight: 1.12, ...extra });
  const green = { color: GREEN };

  switch (slide.type) {
    case 'cover':
      return frame(
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', height: '100%' }}>
          <div style={{ flex: 1 }}>
            <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H()} />
            <div style={{ width: 46, height: 4, background: GREEN, borderRadius: 3, margin: '12px 0' }} />
            <EText field="sub" html={mdGreen(slide.sub)} style={{ fontSize: dw * 0.04, color: '#222', lineHeight: 1.45 }} />
          </div>
          {imgCard(dw * 0.42, dh * 0.6)}
        </div>
      );
    case 'text_image':
      return frame(<>
        <div style={{ display: 'flex', gap: 12 }}>
          <EText field="body" html={mdGreen(slide.body)} style={{ flex: 1, fontSize: dw * 0.045, lineHeight: 1.5, color: '#111' }} />
          {imgCard(dw * 0.38, dh * 0.42)}
        </div>
        {slide.callout != null && slide.callout !== '' && <Callout slide={slide} edit={edit} set={set} dw={dw} />}
      </>);
    case 'two_block':
      return frame(<>
        <EText field="body" html={mdGreen(slide.body)} style={{ fontSize: dw * 0.044, lineHeight: 1.5, color: '#111' }} />
        <div style={{ width: 46, height: 4, background: GREEN, borderRadius: 3, margin: '10px 0' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <EText field="headline" html={hlHead(slide.headTop ? `${slide.headTop} ${slide.headBottom || ''}`.trim() : slide.headline, slide.keyword)} style={{ flex: 1, ...H({ fontSize: dw * 0.055 }) }} />
          {imgCard(dw * 0.34, dh * 0.34)}
        </div>
        {slide.callout && <Callout slide={slide} edit={edit} set={set} dw={dw} filled />}
      </>);
    case 'steps':
      return frame(<>
        <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H({ fontSize: dw * 0.06 })} />
        <EText field="sub" html={mdGreen(slide.sub)} style={{ fontSize: dw * 0.038, color: '#555', margin: '6px 0 10px' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: '#F4F6F5', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(slide.steps || []).map((st, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: dw * 0.036, fontWeight: 600, lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: hlHead(st.text, st.keyword) }} />
              </div>
            ))}
          </div>
          {imgCard(dw * 0.34, dh * 0.42)}
        </div>
      </>);
    case 'sequence':
      return frame(<>
        <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H({ fontSize: dw * 0.058 })} />
        <EText field="sub" html={mdGreen(slide.sub)} style={{ fontSize: dw * 0.038, color: '#555', margin: '6px 0 10px' }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          {(slide.seq || []).map((q, i) => (
            <React.Fragment key={i}>
              <div style={{ textAlign: 'center' }}>
                {imgCard(dw * 0.24, dw * 0.24)}
                <div style={{ fontSize: dw * 0.03, fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginTop: 5 }}>{q.label}</div>
              </div>
              {i < (slide.seq.length - 1) && <div style={{ color: GREEN, fontSize: 20, fontWeight: 800 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        {slide.callout && <Callout slide={slide} edit={edit} set={set} dw={dw} filled />}
      </>);
    case 'stat':
      return frame(<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <EText field="value" html={esc(slide.value)} style={{ fontSize: dw * 0.16, fontWeight: 800, color: GREEN, lineHeight: 1 }} tag="span" />
            <EText field="unit" html={esc(slide.unit)} style={{ fontSize: dw * 0.05, fontWeight: 700, color: GREEN }} tag="span" />
          </div>
          <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H({ fontSize: dw * 0.05, marginTop: 8 })} />
          <EText field="caption" html={mdGreen(slide.caption)} style={{ fontSize: dw * 0.032, color: '#777', marginTop: 6 }} />
        </div>
        {imgCard(dw * 0.36, dh * 0.5)}
      </div>);
    case 'quote':
      return frame(<div>
        <div style={{ fontSize: dw * 0.14, color: GREEN, fontWeight: 800, lineHeight: 0.6 }}>&ldquo;</div>
        <EText field="quote" html={esc(slide.quote)} style={{ fontSize: dw * 0.06, fontWeight: 700, lineHeight: 1.3, color: '#111' }} />
        <EText field="attribution" html={esc(slide.attribution)} style={{ fontSize: dw * 0.035, color: GREEN, fontWeight: 600, marginTop: 12 }} />
      </div>);
    case 'list':
      return frame(<>
        <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H({ fontSize: dw * 0.058 })} />
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(slide.bullets || []).filter(Boolean).map((bl, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: dw * 0.038, lineHeight: 1.35 }} dangerouslySetInnerHTML={{ __html: mdGreen(bl) }} />
              </div>
            ))}
          </div>
          {imgCard(dw * 0.32, dh * 0.4)}
        </div>
      </>);
    case 'cta':
      return frame(<div style={{ textAlign: 'left' }}>
        <EText field="headline" html={hlHead(slide.headline, slide.keyword)} style={H({ fontSize: dw * 0.08 })} />
        <EText field="sub" html={mdGreen(slide.sub)} style={{ fontSize: dw * 0.042, color: '#222', margin: '12px 0 18px', lineHeight: 1.45 }} />
        <span style={{ display: 'inline-block', background: GREEN, color: '#fff', fontSize: dw * 0.042, fontWeight: 700, padding: '11px 22px', borderRadius: 30 }} contentEditable={edit} suppressContentEditableWarning onBlur={edit ? (e) => set({ ctaLabel: e.currentTarget.innerText }) : undefined}>{slide.ctaLabel || 'Learn more'}</span>
      </div>);
    default:
      return frame(<div style={{ color: '#999' }}>Unknown slide type: {slide.type}</div>);
  }
}

function Callout({ slide, edit, set, dw, filled: forceFilled }) {
  const filled = forceFilled || slide.calloutStyle === 'filled';
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', borderRadius: 14, padding: '10px 14px', background: filled ? GREEN : 'transparent', border: filled ? 'none' : `2px solid ${GREEN}` }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: filled ? '#fff' : GREEN, color: filled ? GREEN : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>→</div>
      <div contentEditable={edit} suppressContentEditableWarning onBlur={edit ? (e) => set({ callout: e.currentTarget.innerText }) : undefined}
        style={{ fontSize: dw * 0.04, fontWeight: 700, lineHeight: 1.3, color: filled ? '#fff' : '#111', outline: 'none' }}
        dangerouslySetInnerHTML={{ __html: esc(slide.callout) }} />
    </div>
  );
}
