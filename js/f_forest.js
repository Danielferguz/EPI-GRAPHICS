// Forest plot por subgrupos / desenlaces (estilo NEJM): etiquetas, n por brazo, estimador con IC, texto a la derecha y flechas «mejor».
import { T, L, R, arrow, num, fmt, minus, textW, wrap, tickLabel, fmtTicks, niceTicks, makeScale, svgRoot, INK, FRAME, ZEBRA } from './svg.js?v=2026.10.22-1';

const row = (panel, label, n1, n2, est, lo, hi, kind = '') => ({ panel, label, n1, n2, est, lo, hi, kind });
export const forest = {
  id: 'forest', name: 'Forest plot por subgrupos', short: 'Forest',
  desc: 'Estimador (IC 95 %) por subgrupo con n por brazo, línea de referencia, escala lineal/log y flechas «a favor de…». Uno o varios paneles.',
  settings: [
    { k: 'zebra', label: 'Filas sombreadas alternas', type: 'check', def: true },
    { k: 'rowH', label: 'Alto de fila (× tamaño de letra)', type: 'number', def: 2.45, step: 0.05 },
    { k: 'ci', label: 'Mostrar IC como texto a la derecha', type: 'check', def: true },
    { k: 'mk', label: 'Marcador', type: 'select', opts: [['circle', 'Círculo'], ['square', 'Cuadrado'], ['diamond', 'Rombo']], def: 'circle' },
  ],
  tables: [
    { k: 'panels', label: 'Paneles', help: 'Escala: lineal, log o «ticks» (marcas equiespaciadas, como en algunas figuras del NEJM). Marcas = valores separados por coma.', cols: [
      { k: 'id', label: 'Panel', type: 'text', w: 50 }, { k: 'title', label: 'Título', type: 'text', w: 230 }, { k: 'h0', label: 'Encabezado de etiquetas', type: 'text', w: 120 }, { k: 'h1', label: 'Encabezado n1', type: 'text', w: 100 }, { k: 'h2', label: 'Encabezado n2', type: 'text', w: 100 },
      { k: 'hn', label: 'Subtítulo de n', type: 'text', w: 100 }, { k: 'hm', label: 'Encabezado de la medida', type: 'text', w: 230 }, { k: 'ref', label: 'Referencia', type: 'num', w: 70 },
      { k: 'scale', label: 'Escala', type: 'select', opts: ['linear', 'log', 'ticks'], w: 80 }, { k: 'ticks', label: 'Marcas del eje', type: 'text', w: 170 },
      { k: 'left', label: 'Flecha izquierda', type: 'text', w: 130 }, { k: 'right', label: 'Flecha derecha', type: 'text', w: 130 }, { k: 'dec', label: 'Decimales', type: 'num', w: 70 }, { k: 'sep', label: 'Separador del IC', type: 'text', w: 70 }] },
    { k: 'rows', label: 'Filas', help: 'Tipo «h» = encabezado de grupo (sin marcador). Deje n1/n2 vacíos si no desea mostrarlos.', cols: [
      { k: 'panel', label: 'Panel', type: 'text', w: 50 }, { k: 'label', label: 'Etiqueta', type: 'text', w: 250 }, { k: 'n1', label: 'n brazo 1', type: 'text', w: 70 }, { k: 'n2', label: 'n brazo 2', type: 'text', w: 70 },
      { k: 'est', label: 'Estimador', type: 'num', w: 80 }, { k: 'lo', label: 'IC inf.', type: 'num', w: 80 }, { k: 'hi', label: 'IC sup.', type: 'num', w: 80 }, { k: 'kind', label: 'Tipo', type: 'select', opts: ['', 'h'], w: 60 }] },
  ],
  example() {
    return {
      settings: {},
      tables: {
        panels: [
          { id: 'A', title: 'Kidney Failure or Sustained ≥40% eGFR Decline', h0: 'Populations', h1: 'Drug A', h2: 'Placebo', hn: 'no. of patients', hm: 'Hazard Ratio vs. Placebo (95% CI)', ref: 1, scale: 'log', ticks: '0.4,0.6,0.8,1,1.25,1.5', left: 'Drug A Better', right: 'Placebo Better', dec: 2, sep: ' to ' },
          { id: 'B', title: 'Change from Baseline in eGFR Slope (ml/min/1.73 m²/yr)', h0: 'Populations', h1: 'Drug A', h2: 'Placebo', hn: 'no. of patients', hm: 'LS Mean Difference vs. Placebo (95% CI)', ref: 0, scale: 'linear', ticks: '-1,0,1,2,3,4', left: 'Placebo Better', right: 'Drug A Better', dec: 1, sep: ' to ' }],
        rows: [
          row('A', 'Total population', 1203, 1198, 0.72, 0.62, 0.84), row('A', 'Diabetes', '', '', '', '', '', 'h'), row('A', 'Yes', 640, 631, 0.70, 0.58, 0.85), row('A', 'No', 563, 567, 0.76, 0.60, 0.96),
          row('A', 'eGFR <45 ml/min/1.73 m²', 702, 698, 0.66, 0.55, 0.80), row('A', 'eGFR ≥45 ml/min/1.73 m²', 501, 500, 0.83, 0.64, 1.07), row('A', 'UACR >1000 mg/g', 598, 601, 0.69, 0.57, 0.84),
          row('B', 'Total population', 1180, 1176, 1.6, 1.1, 2.1), row('B', 'Diabetes', '', '', '', '', '', 'h'), row('B', 'Yes', 628, 619, 1.4, 0.8, 2.0), row('B', 'No', 552, 557, 1.9, 1.2, 2.6),
          row('B', 'eGFR <45 ml/min/1.73 m²', 690, 683, 1.2, 0.6, 1.8), row('B', 'eGFR ≥45 ml/min/1.73 m²', 490, 493, 2.2, 1.4, 3.0), row('B', 'UACR >1000 mg/g', 587, 590, 1.7, 1.0, 2.4)],
      },
    };
  },
  render(st, o) {
    const S = { zebra: true, rowH: 2.45, ci: true, mk: 'circle', ...st.settings }, fs = o.fs, W = o.W, pad = fs * 1.0, lh = 1.22;
    const panels = (st.tables.panels || []).filter(p => String(p.id ?? '').trim() || (st.tables.rows || []).some(r => r.panel === p.id));
    if (!panels.length) return svgRoot(W, 120, T(20, 60, 'Añada al menos un panel y sus filas.', { fs }), { fs, frame: o.frame });
    let y = 0, body = '';
    for (const p of panels) {
      const rows = (st.tables.rows || []).filter(r => String(r.panel) === String(p.id));
      const dec = isFinite(num(p.dec)) ? num(p.dec) : 2, sep = p.sep === undefined || p.sep === '' ? ' to ' : p.sep;
      const kind = p.scale || 'linear', ref = isFinite(num(p.ref)) ? num(p.ref) : (kind === 'log' ? 1 : 0);
      let ticks = String(p.ticks ?? '').split(/[,;\s]+/).map(Number).filter(isFinite);
      const vals = rows.filter(r => r.kind !== 'h').flatMap(r => [num(r.lo), num(r.hi), num(r.est)]).filter(isFinite);
      let lo = Math.min(...vals, ref), hi = Math.max(...vals, ref);
      if (!ticks.length) { if (kind === 'log') { const c = [0.1, 0.2, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 10, 20]; ticks = c.filter(v => v >= lo * 0.85 && v <= hi * 1.15); if (ticks.length < 3) ticks = [lo, ref, hi].map(v => +v.toPrecision(2)); } else ticks = niceTicks(lo, hi, 6); }
      const x0v = Math.min(...ticks), x1v = Math.max(...ticks);
      const hasN = rows.some(r => String(r.n1 ?? '') !== '' || String(r.n2 ?? '') !== '');
      const estTxt = r => (r.kind === 'h' || !isFinite(num(r.est)) ? '' : `${fmt(num(r.est), dec)} (${fmt(num(r.lo), dec)}${minus(sep)}${fmt(num(r.hi), dec)})`);
      const labW = Math.min(W * 0.36, Math.max(textW(p.h0 || '', fs, true), ...rows.map(r => textW(r.label ?? '', fs, r.kind === 'h')), 20));
      const c1 = hasN ? Math.max(textW(p.h1 || '', fs, true), ...rows.map(r => textW(String(r.n1 ?? ''), fs)), 10) + fs * 1.2 : 0;
      const c2 = hasN ? Math.max(textW(p.h2 || '', fs, true), ...rows.map(r => textW(String(r.n2 ?? ''), fs)), 10) + fs * 1.2 : 0;
      const tW = S.ci ? Math.max(...rows.map(r => textW(estTxt(r), fs)), 10) : 0;
      const xLab = pad, xN1 = xLab + labW + fs * 1.0 + c1 / 2, xN2 = xLab + labW + fs * 1.0 + c1 + c2 / 2;
      const xp0 = xLab + labW + fs * 1.0 + c1 + c2 + fs * 1.5, xp1 = W - pad - tW - fs * 1.8;
      const sc = makeScale(kind, ticks, x0v, x1v, xp0 + fs * 0.5, xp1 - fs * 0.5);
      const rh = fs * S.rowH, tl = wrap(String(p.title ?? ''), W - pad * 2 - fs * 1.8, fs, true);
      const hdr1 = y + fs * 1.55, titleH = Math.max(1, tl.length) * fs * lh + fs * 0.9;
      const hy = y + titleH + fs * 1.1, headH = fs * 2.7, top = y + titleH + headH;
      body += T(pad, hdr1, String(p.id ?? ''), { fs: fs * 1.3, bold: true }) + T(pad + (p.id ? fs * 1.9 : 0), y + fs * 1.5, tl, { fs, bold: true });
      body += T(xLab, hy + fs * 0.6, p.h0 || '', { fs, bold: true });
      if (hasN) { body += T(xN1, hy - fs * 0.1, p.h1 || '', { fs, bold: true, anchor: 'middle' }) + T(xN2, hy - fs * 0.1, p.h2 || '', { fs, bold: true, anchor: 'middle' }); if (p.hn) body += T((xN1 + xN2) / 2, hy + fs * 1.35, p.hn, { fs, italic: true, anchor: 'middle' }); }
      if (p.hm) body += T((xp0 + W - pad) / 2, hy + fs * 0.6, p.hm, { fs, bold: true, anchor: 'middle' });
      rows.forEach((r, i) => {
        const yy = top + i * rh;
        if (S.zebra && i % 2 === 0) body += R(pad * 0.4, yy, W - pad * 0.8, rh, { fill: ZEBRA });
      });
      const axisY = top + rows.length * rh + fs * 0.6;
      if (isFinite(sc(ref))) body += L(sc(ref), top - fs * 0.3, sc(ref), axisY, { w: 1.4, dash: '5 5' });
      rows.forEach((r, i) => {
        const yy = top + i * rh, cy = yy + rh / 2, base = cy + fs * 0.35, h = r.kind === 'h';
        body += T(xLab, base, r.label ?? '', { fs, bold: h });
        if (h) return;
        if (hasN) body += T(xN1, base, String(r.n1 ?? ''), { fs, anchor: 'middle' }) + T(xN2, base, String(r.n2 ?? ''), { fs, anchor: 'middle' });
        const e = num(r.est), a = num(r.lo), b = num(r.hi);
        if (isFinite(e)) {
          const xa = isFinite(a) ? Math.max(a, x0v - (x1v - x0v) * 0.04) : e, xb = isFinite(b) ? Math.min(b, x1v + (x1v - x0v) * 0.04) : e;
          body += L(sc(xa), cy, sc(xb), cy, { w: 1.7 });
          if (a < xa) body += L(sc(xa), cy - fs * 0.25, sc(xa), cy + fs * 0.25, { w: 1.7 });
          if (b > xb) body += L(sc(xb), cy - fs * 0.25, sc(xb), cy + fs * 0.25, { w: 1.7 });
          const rr = fs * 0.5;
          body += S.mk === 'square' ? R(sc(e) - rr, cy - rr, 2 * rr, 2 * rr, { fill: INK }) : S.mk === 'diamond' ? `<polygon points="${sc(e).toFixed(1)},${(cy - rr * 1.3).toFixed(1)} ${(sc(e) + rr * 1.3).toFixed(1)},${cy.toFixed(1)} ${sc(e).toFixed(1)},${(cy + rr * 1.3).toFixed(1)} ${(sc(e) - rr * 1.3).toFixed(1)},${cy.toFixed(1)}" fill="${INK}"/>` : `<circle cx="${sc(e).toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr}" fill="${INK}"/>`;
        }
        if (S.ci) body += T(W - pad, base, estTxt(r), { fs, anchor: 'end' });
      });
      // eje
      body += L(sc(x0v), axisY, sc(x1v), axisY, { w: 1.4 });
      { const tlab = fmtTicks(ticks); ticks.forEach((v, ti) => { body += L(sc(v), axisY, sc(v), axisY + 6, { w: 1.4 }) + T(sc(v), axisY + 6 + fs * 1.15, tlab[ti], { fs, anchor: 'middle' }); }); }
      const ay = axisY + 6 + fs * 2.4, xr = sc(ref), gap = fs * 0.6, ax0 = sc(x0v) - fs * 0.5, ax1 = sc(x1v) + fs * 0.5;
      if (p.left) { body += arrow(xr - gap, ay, ax0, ay, { w: 1.4, s: 9 }) + T((xr - gap + ax0) / 2, ay + fs * 1.75, p.left, { fs, bold: true, anchor: 'middle' }); }
      if (p.right) { body += arrow(xr + gap, ay, ax1, ay, { w: 1.4, s: 9 }) + T((xr + gap + ax1) / 2, ay + fs * 1.75, p.right, { fs, bold: true, anchor: 'middle' }); }
      y = ay + fs * 3.0;
      if (o.frame && p !== panels[panels.length - 1]) body += L(0, y, W, y, { w: 3, c: FRAME });
      y += 0.5;
    }
    return svgRoot(W, y, body, { fs, frame: o.frame });
  },
};
