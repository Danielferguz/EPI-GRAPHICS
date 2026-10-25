// Mapa de calor y correlograma: matriz de valores (o correlaciones de Pearson calculadas desde una base) con escala de color y valores en las celdas.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, rowsOf, uniq, empty, lum, minus, niceTicks, INK, FRAME, split } from './kit.js?v=2026.10.25-2';
import { pearson, lcg } from './stat2.js?v=2026.10.25-2';

const hex = h => { const v = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)); }, mix = (a, b, t) => `#${a.map((x, i) => Math.round(x + (b[i] - x) * t).toString(16).padStart(2, '0')).join('')}`;
export const SCALES = { teal: { name: 'Secuencial azul verdoso', stops: ['#F3F8F9', '#8FBDC8', '#2E7F90', '#15404A'] }, viridis: { name: 'Viridis', stops: ['#440154', '#3B528B', '#21908C', '#5DC863', '#FDE725'] }, gray: { name: 'Escala de grises', stops: ['#F5F5F5', '#A6A6A6', '#262626'] }, div: { name: 'Divergente azul–blanco–burdeos', stops: ['#2E7F90', '#FFFFFF', '#8B2E3B'] }, divgray: { name: 'Divergente azul–blanco–gris oscuro', stops: ['#00729E', '#FFFFFF', '#4D4D4D'] } };
export const ramp = (name, t) => { const st = (SCALES[name] || SCALES.teal).stops.map(hex), x = Math.max(0, Math.min(1, t)) * (st.length - 1), i = Math.min(st.length - 2, Math.floor(x)); return mix(st[i], st[i + 1], x - i); };
export const heat = {
  id: 'heat', name: 'Mapa de calor y correlograma', short: 'Mapa de calor', needsData: true,
  desc: 'Matriz de valores con escala de color y números en las celdas; o correlaciones de Pearson entre las variables de una base (correlograma con cuadrados o círculos y triángulo inferior).',
  settings: [
    { k: 'mode', label: 'Origen de los valores', type: 'select', opts: [['long', 'Tabla de celdas (fila, columna, valor)'], ['corr', 'Correlaciones desde una base de datos']], def: 'long' }, { k: 'vars', label: 'Correlograma: variables (separadas por coma; vacío = todas las numéricas)', type: 'text', def: '' },
    { k: 'scale', label: 'Escala de color', type: 'select', opts: Object.entries(SCALES).map(([k, v]) => [k, v.name]), def: 'div' }, { k: 'shape', label: 'Forma de la celda', type: 'select', opts: [['square', 'Cuadrado'], ['circle', 'Círculo (tamaño ∝ |valor|)']], def: 'square' },
    { k: 'vals', label: 'Mostrar valores', type: 'check', def: true }, { k: 'dec', label: 'Decimales', type: 'number', def: 2 }, { k: 'lower', label: 'Solo triángulo inferior (matrices simétricas)', type: 'check', def: false },
    { k: 'vmin', label: 'Valor mínimo de la escala (vacío = automático)', type: 'number', def: '' }, { k: 'vmax', label: 'Valor máximo de la escala (vacío = automático)', type: 'number', def: '' }, { k: 'barTitle', label: 'Título de la barra de color', type: 'text', def: 'Correlation' },
    { k: 'title', label: 'Título', type: 'text', def: 'Correlation Between Baseline Characteristics' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' }, { k: 'xlab', label: 'Título del eje X', type: 'text', def: '' }, { k: 'ylab', label: 'Título del eje Y', type: 'text', def: '' },
  ],
  tables: [{ k: 'cells', label: 'Celdas', help: 'Una fila por celda: fila, columna y valor. Para una matriz simétrica repita ambos sentidos o use el triángulo inferior.', cols: [{ k: 'row', label: 'Fila', type: 'text', w: 160 }, { k: 'col', label: 'Columna', type: 'text', w: 160 }, { k: 'value', label: 'Valor', type: 'num', w: 90 }] }],
  example() {
    const v = ['eGFR', 'UPCR', 'SBP', 'Age', 'BMI'], m = [[1, -0.52, -0.21, -0.38, -0.12], [-0.52, 1, 0.31, 0.08, 0.17], [-0.21, 0.31, 1, 0.29, 0.34], [-0.38, 0.08, 0.29, 1, 0.1], [-0.12, 0.17, 0.34, 0.1, 1]], cells = [];
    v.forEach((a, i) => v.forEach((b, j) => cells.push({ row: a, col: b, value: m[i][j] }))); const r = lcg(21), base = Array.from({ length: 120 }, () => { const a = r() + r() + r() - 1.5, b = -0.6 * a + 0.5 * (r() - 0.5), c = 0.3 * a + 0.5 * (r() - 0.5), d = 0.4 * (r() + r() - 1), e = 0.3 * c + 0.4 * (r() + r() - 1); return { eGFR: +(60 + 20 * a).toFixed(1), UPCR: +(2 + 3 * (b + 0.9)).toFixed(2), SBP: +(130 + 25 * c).toFixed(0), Age: +(50 + 30 * d).toFixed(0), BMI: +(27 + 8 * e).toFixed(1) }; });
    return { settings: { lower: true, mode: 'long' }, tables: { cells }, data: { name: 'ejemplo simulado', rows: base } };
  },
  render(st, o) {
    const S = { mode: 'long', scale: 'div', shape: 'square', vals: true, dec: 2, lower: false, barTitle: '', ...st.settings }, fs = o.fs, W = o.W; let rows, cols, val = new Map();
    if (S.mode === 'corr') { const r0 = st.data?.rows || []; if (!r0.length) return empty(o, 'Cargue una base de datos para calcular las correlaciones.'); const all = Object.keys(r0[0]).filter(k => r0.every(r => r[k] === '' || isFinite(num(r[k])))), vs = (split(S.vars).length ? split(S.vars) : all).filter(k => all.includes(k)); if (vs.length < 2) return empty(o, 'Indique al menos dos variables numéricas.');
      rows = cols = vs; vs.forEach(a => vs.forEach(b => { const ok = r0.filter(r => isFinite(num(r[a])) && isFinite(num(r[b]))); val.set(`${a}\u0001${b}`, pearson(ok.map(r => num(r[a])), ok.map(r => num(r[b])))); })); }
    else { const c = rowsOf(st, 'cells').map(r => ({ r: String(r.row ?? '').trim(), c: String(r.col ?? '').trim(), v: num(r.value) })).filter(r => r.r && r.c && isFinite(r.v)); if (!c.length) return empty(o, 'Añada celdas (fila, columna y valor).'); rows = uniq(c.map(r => r.r)); cols = uniq(c.map(r => r.c)); c.forEach(r => val.set(`${r.r}\u0001${r.c}`, r.v)); }
    const vv = [...val.values()], div = S.scale.startsWith('div'), lo = isFinite(num(S.vmin)) ? num(S.vmin) : div ? -Math.max(...vv.map(Math.abs)) : Math.min(...vv), hi = isFinite(num(S.vmax)) ? num(S.vmax) : div ? Math.max(...vv.map(Math.abs)) : Math.max(...vv), t = v => (v - lo) / ((hi - lo) || 1);
    const cell = Math.min((W * 0.72) / cols.length, fs * 4.2), barW = fs * 6, ph = cell * rows.length, F = frame(o, { id: S.id, title: S.title, xcat: cols, ycat: rows, xlab: S.xlab, ylab: S.ylab, ph, right: barW, noAxisLines: true, noTicks: true }); let body = F.s;
    // (el marco en L se sustituye por la cuadrícula de celdas)
    rows.forEach((a, i) => cols.forEach((b, j) => { if (S.lower && j > i) return; const v = val.get(`${a}\u0001${b}`); if (v == null) return; const c = ramp(S.scale, t(v)), cw = F.pw / cols.length, ch = F.ph / rows.length, cx = F.ax + (j + 0.5) * cw, cy = F.top + (i + 0.5) * ch;
      if (S.shape === 'circle') body += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(Math.min(cw, ch) / 2 * 0.92 * (div ? Math.abs(v) / (Math.max(Math.abs(lo), Math.abs(hi)) || 1) : Math.sqrt(Math.max(0, t(v)))) + 1).toFixed(1)}" fill="${c}"/>`; else body += R(cx - cw / 2, cy - ch / 2, cw, ch, { fill: c, stroke: '#fff', sw: 1.2 });
      if (S.vals) body += T(cx, cy + fs * 0.35, fmt(v, +S.dec || 0), { fs: fs * 0.88, anchor: 'middle', fill: S.shape === 'circle' ? INK : lum(c) < 0.45 ? '#fff' : INK }); }));
    const bx = F.ax + F.pw + fs * 1.2, bh = F.ph * 0.8, by = F.top + F.ph * 0.1, steps = 40; for (let k = 0; k < steps; k++) body += R(bx, by + bh * (1 - (k + 1) / steps), fs * 0.9, bh / steps + 0.6, { fill: ramp(S.scale, k / (steps - 1)) });
    niceTicks(lo, hi, 4).filter(v => v >= lo - 1e-9 && v <= hi + 1e-9).forEach(v => (body += L(bx + fs * 0.9, by + bh * (1 - t(v)), bx + fs * 1.3, by + bh * (1 - t(v)), { w: 1.2 }) + T(bx + fs * 1.5, by + bh * (1 - t(v)) + fs * 0.35, fmt(v, Math.abs(hi - lo) <= 3 ? 1 : 0), { fs: fs * 0.88 })));
    if (S.barTitle) body += T(bx, by - fs * 0.6, S.barTitle, { fs: fs * 0.9, bold: true });
    return svgRoot(W, F.yEnd + fs * 0.4, body, { fs, frame: o.frame });
  },
};
