// Ranking y comparaciones pareadas: mancuerna (antes–después), piruleta, barras horizontales y pendientes, con columnas de valores a la derecha.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, empty, legend, minus, INK, FRAME, sep } from './kit.js?v=2026.10.25-2';
import { ZEBRA } from './svg.js?v=2026.10.25-2';

const KINDS = [['dumbbell', 'Mancuerna (dos valores por fila)'], ['lollipop', 'Piruleta (un valor por fila)'], ['bars', 'Barras horizontales'], ['slope', 'Pendientes (antes → después)']];
export const rank = {
  id: 'rank', name: 'Ranking y antes–después (mancuerna, piruleta, pendientes)', short: 'Ranking',
  desc: 'Ordena categorías (regiones, centros, subgrupos) y compara dos valores (antes y después) con líneas de unión y columnas de valores y diferencia a la derecha.',
  settings: [
    { k: 'kind', label: 'Tipo', type: 'select', opts: KINDS, def: 'dumbbell' },
    { k: 'sort', label: 'Orden', type: 'select', opts: [['v1d', 'Valor 1, de mayor a menor'], ['v1a', 'Valor 1, de menor a mayor'], ['v2d', 'Valor 2, de mayor a menor'], ['dd', 'Diferencia, de mayor a menor'], ['da', 'Diferencia, de menor a mayor'], ['none', 'Como en la tabla']], def: 'v1d' },
    { k: 'n1', label: 'Nombre del valor 1', type: 'text', def: 'Before COVID-19 lockdown' }, { k: 'n2', label: 'Nombre del valor 2', type: 'text', def: 'After COVID-19 lockdown' },
    { k: 'suf', label: 'Sufijo de los valores (%, etc.)', type: 'text', def: '%' }, { k: 'dec', label: 'Decimales', type: 'number', def: 1 },
    { k: 'cols', label: 'Mostrar columnas de valores a la derecha', type: 'check', def: true }, { k: 'zebra', label: 'Filas con sombreado alterno', type: 'check', def: true },
    { k: 'ref', label: 'Línea de referencia (vacío = ninguna)', type: 'number', def: '' }, { k: 'xmin', label: 'X mínimo (vacío = auto)', type: 'number', def: '' }, { k: 'xmax', label: 'X máximo (vacío = auto)', type: 'number', def: '' },
    { k: 'title', label: 'Título', type: 'text', def: '' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' }, { k: 'xlab', label: 'Título del eje X', type: 'text', def: 'Proportion of past-year HIV testing (%)' }, { k: 'rowH', label: 'Alto de fila (× letra)', type: 'number', def: 1.9, step: 0.1 },
  ],
  tables: [{ k: 'data', label: 'Datos', help: 'Valor 2 es opcional (piruleta y barras usan solo el valor 1). «Negrita» = x resalta la fila.', cols: [{ k: 'label', label: 'Categoría', type: 'text', w: 200 }, { k: 'v1', label: 'Valor 1', type: 'num', w: 80 }, { k: 'v2', label: 'Valor 2', type: 'num', w: 80 }, { k: 'bold', label: 'Negrita', type: 'text', w: 60 }] }],
  example() {
    const d = [['Tumbes', 30.6, 27.3], ['Moquegua', 30.0, 22.9], ['Madre de Dios', 29.7, 23.3], ['Loreto', 29.7, 28.8], ['Ica', 27.1, 21.6], ['Pasco', 27.0, 22.4], ['Tacna', 26.1, 18.2], ['Callao', 25.1, 21.4], ['Arequipa', 24.5, 18.7], ['Huanuco', 24.1, 17.8], ['San Martin', 24.0, 18.6], ['Junin', 23.8, 17.8], ['Ucayali', 22.4, 16.4], ['Lima', 21.8, 17.2], ['Overall', 20.7, 17.1], ['Piura', 20.0, 17.7], ['Amazonas', 18.9, 19.9], ['La Libertad', 17.5, 15.2], ['Ayacucho', 16.5, 12.8], ['Cusco', 14.9, 12.1], ['Puno', 13.4, 10.8], ['Cajamarca', 11.7, 12.5]];
    return { settings: {}, tables: { data: d.map(([label, v1, v2]) => ({ label, v1, v2, bold: label === 'Overall' ? 'x' : '' })) } };
  },
  render(st, o) {
    const S = { kind: 'dumbbell', sort: 'v1d', suf: '', dec: 1, cols: true, zebra: true, rowH: 1.9, ...st.settings }, fs = o.fs, W = o.W, two = ['dumbbell', 'slope'].includes(S.kind);
    let rows = rowsOf(st, 'data').map(r => ({ l: String(r.label ?? '').trim(), a: num(r.v1), b: num(r.v2), bold: String(r.bold ?? '').trim() !== '' })).filter(r => r.l && isFinite(r.a) && (!two || isFinite(r.b)));
    if (!rows.length) return empty(o, 'Añada categorías con su valor 1' + (two ? ' y valor 2.' : '.'));
    const sorters = { v1d: (x, y) => y.a - x.a, v1a: (x, y) => x.a - y.a, v2d: (x, y) => y.b - x.b, dd: (x, y) => (y.b - y.a) - (x.b - x.a), da: (x, y) => (x.b - x.a) - (y.b - y.a) }; if (sorters[S.sort]) rows = [...rows].sort(sorters[S.sort]);
    const vals = rows.flatMap(r => (two ? [r.a, r.b] : [r.a])), lo = isFinite(num(S.xmin)) ? num(S.xmin) : S.kind === 'bars' ? Math.min(0, ...vals) : Math.min(...vals) - (Math.max(...vals) - Math.min(...vals)) * 0.06, hi = isFinite(num(S.xmax)) ? num(S.xmax) : Math.max(...vals) + (Math.max(...vals) - Math.min(...vals)) * 0.08;
    const f = v => `${fmt(v, +S.dec || 0)}${S.suf}`, fd = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v), +S.dec || 0)}${S.suf}`.replace('+', '+'), c1 = lineOf(o, 1) === lineOf(o, 0) ? colOf(o, 0) : colOf(o, 2), c2 = colOf(o, 1);
    const colList = S.cols ? (two ? [['v1', S.n1 || 'Valor 1', r => f(r.a)], ['v2', S.n2 || 'Valor 2', r => f(r.b)], ['d', 'Δ', r => fd(r.b - r.a)]] : [['v1', S.n1 || 'Valor', r => f(r.a)]]) : [];
    const cw = colList.map(([, h, g]) => Math.max(textW(h.split(' ')[0], fs, true), ...rows.map(r => textW(g(r), fs))) + fs * 1.4), right = cw.reduce((a, b) => a + b, 0) + (colList.length ? fs * 0.8 : 0);
    if (S.kind === 'slope') {
      const ph = Math.max(W * 0.45, rows.length * fs * 1.4), F = frame(o, { id: S.id, title: S.title, xcat: [S.n1 || '1', S.n2 || '2'], y: [lo, hi], ylab: S.xlab, ph, left: fs * 4, right: fs * 4 });
      let body = F.s; const dec = rows.length > 0, ys = rows.map(r => [r.a, r.b]);
      rows.forEach((r, i) => { const down = r.b < r.a, c = down ? c2 : c1; body += L(F.sx(0), F.sy(r.a), F.sx(1), F.sy(r.b), { w: r.bold ? 3.4 : 2, c }) + `<circle cx="${F.sx(0)}" cy="${F.sy(r.a)}" r="${fs * 0.3}" fill="${c}"/><circle cx="${F.sx(1)}" cy="${F.sy(r.b)}" r="${fs * 0.3}" fill="${c}"/>` + T(F.sx(0) - fs * 0.7, F.sy(r.a) + fs * 0.3, `${r.l} ${f(r.a)}`, { fs: fs * 0.85, anchor: 'end', bold: r.bold }) + T(F.sx(1) + fs * 0.7, F.sy(r.b) + fs * 0.3, `${f(r.b)} ${r.l}`, { fs: fs * 0.85, bold: r.bold }); });
      return svgRoot(W, F.yEnd + fs * 0.6, body, { fs, frame: o.frame });
    }
    const slot = fs * S.rowH, ph = slot * rows.length, F = frame(o, { id: S.id, title: S.title, x: [lo, hi], ycat: rows.map(r => r.l), ycatBold: false, xlab: S.xlab, ph, right, grid: true, topExtra: colList.length ? fs * 1.5 : 0 });
    let body = '';
    if (S.zebra) rows.forEach((r, i) => { if (i % 2 === 0) body += R(0, F.sy(i) - slot / 2, W, slot, { fill: ZEBRA }); });
    body += F.s;
    if (isFinite(num(S.ref))) body += L(F.sx(num(S.ref)), F.top, F.sx(num(S.ref)), F.bot, { w: 1.4, c: INK, dash: '6 5' });
    rows.forEach((r, i) => { const y = F.sy(i), xa = F.sx(r.a);
      if (S.kind === 'dumbbell') { body += L(xa, y, F.sx(r.b), y, { w: fs * 0.55, c: '#C9C9C9' }) + `<circle cx="${F.sx(r.b)}" cy="${y}" r="${fs * 0.5}" fill="${c2}"/><circle cx="${xa}" cy="${y}" r="${fs * 0.5}" fill="${c1}"/>`; }
      else if (S.kind === 'lollipop') body += L(F.sx(Math.max(lo, Math.min(0, hi))), y, xa, y, { w: 2.4, c: c1 }) + `<circle cx="${xa}" cy="${y}" r="${fs * 0.5}" fill="${c1}"/>`;
      else body += R(Math.min(F.sx(0), xa), y - slot * 0.32, Math.abs(xa - F.sx(0)), slot * 0.64, { fill: c1 });
      let x = F.ax + F.pw + fs * 0.8; colList.forEach(([k, h, g], ci) => { body += T(x + cw[ci] - fs * 0.9, y + fs * 0.35, g(r), { fs, anchor: 'end', bold: r.bold }); x += cw[ci]; }); });
    let x = F.ax + F.pw + fs * 0.8; colList.forEach(([k, h], ci) => { body += T(x + cw[ci] - fs * 0.9, F.top - fs * 0.6, h.split(' ').slice(0, 1), { fs, anchor: 'end', bold: true }); x += cw[ci]; });
    let y = F.yEnd;
    if (two) { const lg = legend(o, [{ label: S.n1 || 'Valor 1', color: c1 }, { label: S.n2 || 'Valor 2', color: c2 }], F.ax, y + fs * 0.5); body += lg.s; y = lg.y; }
    return svgRoot(W, y + fs * 0.6, body, { fs, frame: o.frame });
  },
};
