// Partes de un todo: anillo, pastel, waffle (cuadrícula de 100) y treemap.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, rowsOf, empty, legend, lum, minus, INK, FRAME } from './kit.js?v=2026.10.25-1';
import { squarify } from './stat2.js?v=2026.10.25-1';

const KINDS = [['donut', 'Anillo'], ['pie', 'Pastel'], ['waffle', 'Waffle (100 cuadros)'], ['treemap', 'Treemap']];
const arc = (cx, cy, r0, r1, a0, a1) => { const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)], large = a1 - a0 > Math.PI ? 1 : 0, A = p(r1, a0), B = p(r1, a1), C = p(r0, a1), D = p(r0, a0);
  return r0 > 0 ? `M${A}A${r1},${r1} 0 ${large} 1 ${B}L${C}A${r0},${r0} 0 ${large} 0 ${D}Z` : `M${cx},${cy}L${A}A${r1},${r1} 0 ${large} 1 ${B}Z`; };
export const part = {
  id: 'part', name: 'Partes de un todo (anillo, pastel, waffle, treemap)', short: 'Partes',
  desc: 'Composición de un total: anillo o pastel con porcentajes, waffle de 100 cuadros (1 cuadro = 1 %) y treemap proporcional.',
  settings: [
    { k: 'kind', label: 'Tipo', type: 'select', opts: KINDS, def: 'donut' }, { k: 'dec', label: 'Decimales del porcentaje', type: 'number', def: 0 }, { k: 'showN', label: 'Mostrar el número además del porcentaje', type: 'check', def: true },
    { k: 'center', label: 'Texto central del anillo (| = salto de línea)', type: 'text', def: 'Total|n=428' }, { k: 'title', label: 'Título', type: 'text', def: 'Primary Cause of Kidney Disease' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' },
    { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.55, step: 0.05 },
  ],
  tables: [{ k: 'data', label: 'Partes', cols: [{ k: 'label', label: 'Categoría', type: 'text', w: 220 }, { k: 'value', label: 'Valor', type: 'num', w: 90 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] }],
  example() { return { settings: {}, tables: { data: [['IgA nephropathy', 214], ['Diabetic kidney disease', 82], ['Hypertensive nephrosclerosis', 51], ['Glomerulonephritis, other', 46], ['Polycystic kidney disease', 22], ['Unknown', 13]].map(([label, value]) => ({ label, value, color: '' })) } }; },
  render(st, o) {
    const S = { kind: 'donut', dec: 0, showN: true, aspect: 0.55, ...st.settings }, fs = o.fs, W = o.W, rows = rowsOf(st, 'data').map((r, i) => ({ l: String(r.label ?? '').trim(), v: num(r.value), c: r.color || colOf(o, i) })).filter(r => r.l && r.v > 0);
    if (!rows.length) return empty(o, 'Añada categorías con valores positivos.');
    const tot = rows.reduce((a, r) => a + r.v, 0), pc = r => r.v / tot * 100, lab = r => `${fmt(pc(r), +S.dec || 0)}%${S.showN ? ` (${fmt(r.v, Number.isInteger(r.v) ? 0 : 1)})` : ''}`, ph = W * S.aspect;
    const F = frame(o, { id: S.id, title: S.title, noXAxis: true, noAxisLines: true, noTicks: true, noYLabels: true, x: [0, 1], y: [0, 1], yticks: [], xticks: [], ph }); let body = F.s; const top = F.top;
    if (S.kind === 'donut' || S.kind === 'pie') {
      const lgW = Math.max(...rows.map(r => textW(`${r.l}  ${lab(r)}`, fs))) + fs * 3, cx = Math.min(W * 0.32, (W - lgW) * 0.6), R_ = Math.min(cx - fs, ph / 2 - fs * 0.5), cy = top + ph / 2; let a = 0;
      rows.forEach(r => { const a1 = a + pc(r) / 100 * 2 * Math.PI; body += `<path d="${arc(cx, cy, S.kind === 'donut' ? R_ * 0.58 : 0, R_, a, a1 - (rows.length > 1 ? 0.004 : 0))}" fill="${r.c}" stroke="#fff" stroke-width="1.5"/>`; const am = (a + a1) / 2, rr = S.kind === 'donut' ? R_ * 0.79 : R_ * 0.68; if (pc(r) >= 6) body += T(cx + rr * Math.sin(am), cy - rr * Math.cos(am) + fs * 0.35, `${fmt(pc(r), +S.dec || 0)}%`, { fs, anchor: 'middle', fill: lum(r.c) < 0.45 ? '#fff' : INK, bold: true }); a = a1; });
      if (S.kind === 'donut' && S.center) body += T(cx, cy - (String(S.center).split(/\||\n/).length - 1) * fs * 0.6 + fs * 0.35, String(S.center), { fs: fs * 1.15, anchor: 'middle', bold: true });
      let ly = top + (ph - rows.length * fs * 1.75) / 2 + fs * 0.9; const lx = cx + R_ + fs * 2.2; rows.forEach(r => { body += R(lx, ly - fs * 0.8, fs * 0.9, fs * 0.9, { fill: r.c }) + T(lx + fs * 1.4, ly, r.l, { fs }) + T(W - fs * 1.2, ly, lab(r), { fs, anchor: 'end', bold: true }); ly += fs * 1.75; });
      return svgRoot(W, top + ph + fs * 0.8, body, { fs, frame: o.frame });
    }
    if (S.kind === 'waffle') { // 100 cuadros por el método del mayor resto
      const exact = rows.map(r => pc(r)), base = exact.map(Math.floor); let left = 100 - base.reduce((a, b) => a + b, 0); exact.map((e, i) => [e - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) base[i]++; });
      const cells = []; base.forEach((n, i) => { for (let k = 0; k < n; k++) cells.push(i); }); const sz = Math.min(ph / 10, (W * 0.42) / 10), gap = sz * 0.14, x0 = fs * 2;
      cells.forEach((ci, k) => { const col = Math.floor(k / 10), row = k % 10; body += R(x0 + col * sz, top + fs * 0.5 + (9 - row) * sz, sz - gap, sz - gap, { fill: rows[ci].c }); });
      let ly = top + fs * 1.4; const lx = x0 + 10 * sz + fs * 1.5; rows.forEach((r, i) => { body += R(lx, ly - fs * 0.8, fs * 0.9, fs * 0.9, { fill: r.c }) + T(lx + fs * 1.4, ly, r.l, { fs }) + T(W - fs * 1.2, ly, `${lab(r)}`, { fs, anchor: 'end', bold: true }); ly += fs * 1.75; });
      body += T(x0, top + fs * 0.5 + 10 * sz + fs * 1.2, '1 cuadro = 1 %', { fs: fs * 0.9 });
      return svgRoot(W, top + fs * 0.5 + 10 * sz + fs * 2.4, body, { fs, frame: o.frame });
    }
    const rects = squarify(rows.map(r => r.v), fs, top + fs * 0.2, W - 2 * fs, ph);
    rects.forEach(q => { const r = rows[q.i], dark = lum(r.c) < 0.45, tw = q.w - fs * 0.8; body += R(q.x, q.y, q.w, q.h, { fill: r.c, stroke: '#fff', sw: 2.5 }); if (q.w > fs * 3.5 && q.h > fs * 2.2) body += T(q.x + fs * 0.5, q.y + fs * 1.3, [...(textW(r.l, fs, true) > tw ? r.l.split(/\s+/).reduce((a, w) => { const l = a.at(-1); if (l && textW(`${l} ${w}`, fs, true) <= tw) a[a.length - 1] = `${l} ${w}`; else a.push(w); return a; }, []) : [r.l]), lab(r)], { fs, bold: true, fill: dark ? '#fff' : INK }); });
    return svgRoot(W, top + ph + fs * 1.4, body, { fs, frame: o.frame });
  },
};
