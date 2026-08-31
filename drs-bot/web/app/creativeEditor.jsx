'use client';
// Inline, brand-locked visual editor for one Creative Studio card.
// Renders a Recykal-branded card whose elements can be selected, dragged,
// resized, recolored, and text-edited in place. Positions are stored as
// fractions of the canvas so ratio changes stay graceful. Every change calls
// onChange(doc); the parent debounces + autosaves it into the creative's `doc`.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

const RATIOS = { '1:1': [320, 320], '9:16': [288, 512], '16:9': [452, 254] };
const SWATCHES = ['#FFFFFF', '#005DFF', '#1DC797', '#6E5CFA', '#141414'];

// Build a sensible default layout for a fresh card.
export function defaultDoc({ headline = '', sub = '', cta = '', brand = '#005DFF', hasImage = false } = {}) {
  return {
    ratio: '1:1',
    brand,
    bgType: hasImage ? 'image' : 'gradient',
    overlay: 0.5,
    el: {
      logo: { fx: 0.06, fy: 0.06, h: 26, hidden: false },
      headline: { fx: 0.06, fy: 0.46, fw: 0.88, fs: 28, w: 800, align: 'left', color: '#FFFFFF', text: headline || 'Your headline' },
      sub: { fx: 0.06, fy: 0.68, fw: 0.88, fs: 14, w: 400, align: 'left', color: '#FFFFFF', text: sub || '' },
      cta: { fx: 0.06, fy: 0.86, fs: 14, color: brand, bg: '#FFFFFF', text: cta || 'Learn more', hidden: !cta },
      url: { fx: 0.72, fy: 0.9, fs: 12, w: 500, color: '#FFFFFF', text: 'recykal.com', hidden: false },
    },
  };
}

function gradientFor(c) {
  const map = { '#005DFF': '#6E5CFA', '#1DC797': '#0E9E9E', '#6E5CFA': '#005DFF', '#141414': '#3a3a3a' };
  return `linear-gradient(135deg, ${c}, ${map[c] || '#6E5CFA'})`;
}

export default function CreativeEditor({
  id, doc: docProp, headline, sub, cta, imageUrl, imgLoading, filename = 'creative',
  onChange, onGenImage, onUploadPhoto, onClearImage, onError,
}) {
  const [doc, setDoc] = useState(() => docProp && docProp.el ? docProp : defaultDoc({ headline, sub, cta, hasImage: !!imageUrl }));
  const [editing, setEditing] = useState(false);      // edit mode on/off
  const [sel, setSel] = useState(null);               // selected element key
  const [typing, setTyping] = useState(null);         // element key being text-edited
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  // Export the card canvas to a high-res PNG (self-contained).
  const exportPng = async () => {
    const node = canvasRef.current; if (!node) return;
    const wasEditing = editing, wasSel = sel;
    setEditing(false); setSel(null);
    try {
      await new Promise((r) => setTimeout(r, 60)); // let outlines clear
      const { toPng } = await import('html-to-image');
      const url = await toPng(node, { pixelRatio: 3.5, cacheBust: true });
      const a = document.createElement('a'); a.href = url; a.download = `recykal-${String(filename).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; a.click();
    } catch (e) { onError?.('PNG export failed: ' + e.message); }
    finally { setEditing(wasEditing); setSel(wasSel); }
  };

  // Push doc changes up (parent debounces + autosaves).
  const commit = useCallback((next) => { setDoc(next); onChange?.(next); }, [onChange]);
  const mutEl = (key, patch) => commit({ ...doc, el: { ...doc.el, [key]: { ...doc.el[key], ...patch } } });
  const mut = (patch) => commit({ ...doc, ...patch });

  const [W, H] = RATIOS[doc.ratio] || RATIOS['1:1'];

  // ---- drag ----
  useEffect(() => {
    if (!editing) return;
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      const r = canvasRef.current.getBoundingClientRect();
      const fx = Math.max(0, Math.min(0.98, (e.clientX - r.left - d.offX) / r.width));
      const fy = Math.max(0, Math.min(0.98, (e.clientY - r.top - d.offY) / r.height));
      setDoc((prev) => ({ ...prev, el: { ...prev.el, [d.key]: { ...prev.el[d.key], fx, fy } } }));
    };
    const up = () => { if (dragRef.current) { dragRef.current = null; onChange?.(docRef.current); } };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [editing, onChange]);

  // keep a ref of the latest doc for pointerup commit
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  const startDrag = (e, key) => {
    if (typing) return;
    setSel(key);
    const r = canvasRef.current.getBoundingClientRect();
    const el = doc.el[key];
    dragRef.current = { key, offX: e.clientX - (r.left + el.fx * r.width), offY: e.clientY - (r.top + el.fy * r.height) };
    e.preventDefault();
  };

  const bg = (doc.bgType === 'image' && imageUrl)
    ? { backgroundImage: `linear-gradient(180deg, rgba(4,18,48,${doc.overlay * 0.5}), rgba(4,14,40,${doc.overlay})), url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: gradientFor(doc.brand) };

  // ---- element renderer ----
  const renderEl = (key) => {
    const el = doc.el[key]; if (!el || el.hidden) return null;
    const left = `${el.fx * 100}%`, top = `${el.fy * 100}%`;
    const isSel = editing && sel === key;
    const isTyping = typing === key;
    const common = {
      position: 'absolute', left, top,
      outline: isSel ? '2px solid #fff' : '2px solid transparent',
      outlineOffset: 2, borderRadius: 6, cursor: editing ? (isTyping ? 'text' : 'grab') : 'default',
      maxWidth: `${(el.fw || 0.9) * 100}%`,
    };
    const onDown = editing ? (e) => startDrag(e, key) : undefined;
    const textProps = editing ? {
      contentEditable: isTyping, suppressContentEditableWarning: true,
      onDoubleClick: () => { setSel(key); setTyping(key); },
      onBlur: (e) => { setTyping(null); mutEl(key, { text: e.currentTarget.textContent }); },
    } : {};

    if (key === 'logo') {
      return <div key={key} onPointerDown={onDown} style={{ ...common }}>
        <img src="/logo-white.png" crossOrigin="anonymous" alt="Recykal" style={{ height: el.h, width: 'auto', display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.25))', pointerEvents: 'none' }} onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
      </div>;
    }
    if (key === 'cta') {
      return <div key={key} onPointerDown={onDown} style={{ ...common }}>
        <span {...textProps} style={{ background: el.bg, color: el.color, fontSize: el.fs, fontWeight: 700, padding: '8px 16px', borderRadius: 30, display: 'inline-block', whiteSpace: 'nowrap' }}>{el.text}</span>
      </div>;
    }
    // headline / sub / url
    return <div key={key} onPointerDown={onDown} {...textProps}
      style={{ ...common, width: `${(el.fw || 0.5) * 100}%`, fontSize: el.fs, fontWeight: el.w, lineHeight: 1.15, color: el.color, textAlign: el.align, textShadow: key === 'headline' ? '0 1px 8px rgba(0,0,0,.18)' : 'none', opacity: key === 'url' ? 0.92 : 1 }}>
      {el.text}
    </div>;
  };

  // ---- selected-element control strip ----
  const selEl = sel ? doc.el[sel] : null;
  const isText = sel && ['headline', 'sub', 'url', 'cta'].includes(sel);
  const chFont = (d) => mutEl(sel, { fs: Math.max(9, (selEl.fs || 14) + d) });
  const chColor = (c) => sel === 'cta' ? mutEl(sel, { bg: c, color: c === '#FFFFFF' ? doc.brand : '#FFFFFF' }) : mutEl(sel, { color: c });
  const chAlign = () => { const nx = selEl.align === 'left' ? 'center' : selEl.align === 'center' ? 'right' : 'left'; mutEl(sel, { align: nx }); };
  const chBold = () => mutEl(sel, { w: (selEl.w >= 700 ? 400 : 800) });

  const btn = { fontSize: 12, padding: '5px 9px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', borderRadius: 7, cursor: 'pointer' };
  const btnActive = { ...btn, background: '#005DFF', color: '#fff', borderColor: '#005DFF' };

  return (
    <div style={{ marginTop: 4 }}>
      {/* top action row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <button onClick={() => { setEditing((v) => !v); setSel(null); setTyping(null); }} style={editing ? btnActive : btn}>{editing ? '✓ Done editing' : '✏️ Edit'}</button>
        <button onClick={() => onGenImage?.(doc.ratio)} disabled={imgLoading} style={btn}>{imgLoading ? '🖼️ generating…' : imageUrl ? '🖼️ regenerate scene' : '🖼️ AI scene'}</button>
        <label style={btn}>📷 Real photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { onUploadPhoto?.(e.target.files?.[0]); e.target.value = ''; }} /></label>
        {imageUrl && <button onClick={() => { onClearImage?.(); mut({ bgType: 'gradient' }); }} style={btn}>✕ clear image</button>}
        <button onClick={exportPng} style={{ ...btn, background: '#1DC797', color: '#fff', borderColor: '#1DC797' }}>⬇ PNG</button>
      </div>

      {/* EDIT CONTROLS */}
      {editing && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 10, background: 'var(--grey-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* selected element controls */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minHeight: 30 }}>
            {!sel && <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Click an element on the card to edit it · double-click text to retype · drag to move.</span>}
            {sel && <>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginRight: 2 }}>{sel}</span>
              {isText && <><button onClick={() => chFont(3)} style={btn}>A+</button><button onClick={() => chFont(-3)} style={btn}>A−</button></>}
              {isText && sel !== 'cta' && <button onClick={chBold} style={{ ...btn, fontWeight: 800 }}>B</button>}
              {isText && sel !== 'cta' && sel !== 'url' && <button onClick={chAlign} style={btn}>align: {selEl.align}</button>}
              {isText && <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 4 }}>color</span>}
              {isText && SWATCHES.map((c) => <span key={c} onClick={() => chColor(c)} title={c} style={{ width: 20, height: 20, borderRadius: 5, background: c, border: '1px solid var(--line)', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(0,0,0,.05)' }} />)}
              <button onClick={() => mutEl(sel, { hidden: true })} title="Hide" style={{ ...btn, marginLeft: 'auto', color: '#b45309' }}><Trash2 size={12} /></button>
            </>}
          </div>
          {/* hidden elements restore */}
          {Object.keys(doc.el).some((k) => doc.el[k].hidden) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>hidden:</span>
              {Object.keys(doc.el).filter((k) => doc.el[k].hidden).map((k) => <button key={k} onClick={() => mutEl(k, { hidden: false })} style={btn}>+ {k}</button>)}
            </div>
          )}
          {/* background + ratio + brand */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>bg</span>
            <button onClick={() => mut({ bgType: 'gradient' })} style={doc.bgType === 'gradient' ? btnActive : btn}>Gradient</button>
            <button onClick={() => { if (imageUrl) mut({ bgType: 'image' }); else onGenImage?.(doc.ratio); }} style={doc.bgType === 'image' ? btnActive : btn}>Photo/AI</button>
            {doc.bgType === 'image' && imageUrl && <input type="range" min="0" max="0.85" step="0.05" value={doc.overlay} onChange={(e) => mut({ overlay: +e.target.value })} title="overlay darkness" style={{ width: 90 }} />}
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 8 }}>ratio</span>
            {Object.keys(RATIOS).map((r) => <button key={r} onClick={() => mut({ ratio: r })} style={doc.ratio === r ? btnActive : btn}>{r}</button>)}
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 8 }}>brand</span>
            {['#005DFF', '#1DC797', '#6E5CFA', '#141414'].map((c) => <span key={c} onClick={() => mut({ brand: c })} style={{ width: 20, height: 20, borderRadius: 5, background: c, border: doc.brand === c ? '2px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }} />)}
          </div>
        </div>
      )}

      {/* CARD CANVAS */}
      <div
        ref={(n) => { canvasRef.current = n; }}
        onPointerDown={(e) => { if (editing && e.target === canvasRef.current) { setSel(null); } }}
        style={{ position: 'relative', width: W, height: H, maxWidth: '100%', ...bg, borderRadius: 16, overflow: 'hidden', fontFamily: 'Poppins, sans-serif', boxShadow: '0 8px 30px rgba(10,20,40,.16)', userSelect: editing ? 'none' : 'auto' }}
      >
        {['logo', 'headline', 'sub', 'cta', 'url'].map(renderEl)}
      </div>
    </div>
  );
}
