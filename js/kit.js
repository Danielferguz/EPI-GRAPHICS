// Utilidades compartidas por las plantillas de gráficos: marco de un panel con ejes en L (estilo NEJM), leyenda y lectura de tablas.
import { T, L, R, num, fmt, textW, wrap, tickLabel, fmtTicks, niceTicks, svgRoot, lum, INK, FRAME, minus } from './svg.js?v=2026.10.25-1';
export { T, L, R, num, fmt, textW, wrap, tickLabel, fmtTicks, niceTicks, svgRoot, lum, INK, FRAME, minus };
export const colOf = (o, i) => (o.pal || ['#326A82'])[i % (o.pal || ['x']).length];
export const lineOf = (o, i) => (o.line || o.pal)[i % (o.line || o.pal).length];
export const uniq = a => [...new Set(a)];
export const natural = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true });
export const empty = (o, msg) => svgRoot(o.W, 140, T(20, 70, msg, { fs: o.fs }), { fs: o.fs, frame: o.frame });
export const split = s => String(s ?? '').split(/[,;]+/).map(v => v.trim()).filter(Boolean);
export const splitNum = s => String(s ?? '').split(/[,;\s]+/).map(Number).filter(isFinite);
export const rowsOf = (st, k) => (st.tables?.[k] || []).filter(r => Object.values(r).some(v => String(v ?? '').trim() !== ''));
// celda de color en leyenda con ajuste de línea; devuelve {s, y}
export function legend(o, items, x0, y, { title = '', maxW = null, shape = 'square' } = {}) {
  const fs = o.fs, W = maxW ?? o.W; let x = x0, s = '', yy = y;
  if (title) { s += T(x0, yy, title, { fs, bold: true }); yy += fs * 1.6; }
  for (const it of items) { const w = textW(it.label, fs) + fs * 2.4; if (x + w > W - fs && x > x0 + fs) { x = x0; yy += fs * 1.6; } s += (shape === 'line' ? L(x, yy - fs * 0.3, x + fs * 1.2, yy - fs * 0.3, { w: 3, c: it.color }) : R(x, yy - fs * 0.8, fs * 0.9, fs * 0.9, { fill: it.color })) + T(x + fs * 1.5, yy, it.label, { fs }); x += w + (shape === 'line' ? fs * 0.4 : 0); }
  return { s, y: yy + fs * 0.4 };
}
// Marco de un panel. p: {y0, id, title, x:[lo,hi]|null, y:[lo,hi]|null, xticks, yticks, xcat, ycat, xlab, ylab, ph, left, right, grid, xfmt, yfmt, ycatBold, noXAxis}
// Devuelve {s, sx, sy, ax, top, bot, pw, ph, yEnd}; las categorías se centran en 0..n-1.
export function frame(o, p) {
  const fs = o.fs, W = o.W, pad = fs, lh = 1.22, y0 = p.y0 || 0; p = { ...p, id: p.id || o.panelId || '' };
  const tl = p.title ? wrap(String(p.title), W - 2 * pad - (p.id ? fs * 1.9 : 0), fs, true) : [], titleH = (p.title || p.id ? Math.max(1, tl.length) * fs * lh + fs * 0.9 : fs * 0.7) + (p.topExtra || 0);
  const yt = p.noYLabels ? [] : p.ycat ? p.ycat.map((_, i) => i) : p.y ? (p.yticks?.length ? p.yticks : niceTicks(p.y[0], p.y[1], 5)) : [];
  const ylabsRaw = p.noYLabels ? [] : p.ycat ? p.ycat.map(String) : p.yfmt ? yt.map(p.yfmt) : fmtTicks(yt), ylab = p.ycat ? ylabsRaw.map(l => wrap(l, W * 0.26, fs, !!p.ycatBold)) : ylabsRaw.map(l => [l]);
  const ylabW = Math.max(...ylab.map(a => Math.max(...a.map(l => textW(l, fs, !!p.ycatBold)))), 8), ml = pad + (p.ylab ? fs * 1.7 : 0) + ylabW + fs * 1.1 + (p.left || 0), pw = W - ml - pad - (p.right || 0) - fs * 0.6;
  const ph = p.ph ?? pw * 0.6, top = y0 + titleH, bot = top + ph, ax = ml;
  const xd = p.xcat ? [-0.5, p.xcat.length - 0.5] : p.x, yd = p.ycat ? [p.ycat.length - 0.5, -0.5] : p.y;
  const sx = v => ax + (v - xd[0]) / ((xd[1] - xd[0]) || 1) * pw, sy = v => bot - (v - yd[0]) / ((yd[1] - yd[0]) || 1) * ph;
  let s = (p.id ? T(pad, y0 + fs * 1.55, String(p.id), { fs: fs * 1.3, bold: true }) : '') + (tl.length ? T(pad + (p.id ? fs * 1.9 : 0), y0 + fs * 1.5, tl, { fs, bold: true }) : '');
  const xt = p.xcat ? p.xcat.map((_, i) => i) : p.x ? (p.xticks?.length ? p.xticks : niceTicks(p.x[0], p.x[1], 6)) : [], xl = p.xcat ? p.xcat.map(String) : p.xfmt ? xt.map(p.xfmt) : fmtTicks(xt);
  if (p.grid) { for (const v of yt) if (!p.ycat) s += L(ax, sy(v), ax + pw, sy(v), { w: 0.8, c: '#E3E3E3' }); if (!p.xcat) for (const v of xt) s += L(sx(v), top, sx(v), bot, { w: 0.8, c: '#EEEEEE' }); }
  if (!p.noAxisLines) s += L(ax, top, ax, bot, { w: 1.4 }) + (p.noXAxis ? '' : L(ax, bot, ax + pw, bot, { w: 1.4 }));
  yt.forEach((v, i) => { const ls = ylab[i]; s += (p.noTicks ? '' : L(ax - 6, sy(v), ax, sy(v), { w: 1.4 })) + T(ax - 10, sy(v) + fs * 0.35 - (ls.length - 1) * fs * lh / 2, ls, { fs, anchor: 'end', bold: !!p.ycatBold }); });
  let xlabH = 0; if (!p.noXAxis) { xt.forEach((v, i) => { const lines = p.xcat ? wrap(xl[i], pw / Math.max(1, xt.length) - 4, fs) : [xl[i]]; s += (p.noTicks ? '' : L(sx(v), bot, sx(v), bot + 6, { w: 1.4 })) + T(sx(v), bot + 6 + fs * 1.15, lines, { fs, anchor: 'middle' }); xlabH = Math.max(xlabH, lines.length); }); }
  const yEnd0 = bot + (p.noXAxis ? 0 : 6 + fs * (1.15 + (xlabH - 1) * lh + 0.9));
  if (p.xlab) s += T(ax + pw / 2, yEnd0 + fs * 0.9, p.xlab, { fs, bold: true, anchor: 'middle' });
  if (p.ylab) s += T(pad + fs * 0.9, top + ph / 2, String(p.ylab), { fs, bold: true, anchor: 'middle', rotate: -90 });
  return { s, sx, sy, ax, top, bot, pw, ph, yEnd: yEnd0 + (p.xlab ? fs * 1.9 : fs * 0.4) };
}
// separador gris entre paneles del mismo lienzo
export const sep = (o, y) => (o.frame ? L(0, y, o.W, y, { w: 3, c: FRAME }) : '');
// ajusta el rótulo de un número con sufijo
export const fmtv = (v, dec, suf = '') => `${fmt(v, +dec || 0)}${suf}`;
