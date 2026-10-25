// Bland-Altman: concordancia entre dos métodos de medición, con sesgo, límites de acuerdo e intervalos de confianza.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, uniq, natural, empty, legend, minus, niceTicks, INK, FRAME } from './kit.js?v=2026.10.25-1';
import { blandAltman, olsLine, lcg } from './stat2.js?v=2026.10.25-1';

const norm = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
export const ba = {
  id: 'ba', name: 'Bland-Altman (concordancia entre métodos)', short: 'Bland-Altman',
  desc: 'Diferencia frente a promedio de dos métodos de medición: sesgo, límites de acuerdo del 95 % con sus IC y, opcionalmente, la recta de la diferencia sobre el promedio.',
  settings: [
    { k: 'pct', label: 'Diferencia en porcentaje del promedio', type: 'check', def: false }, { k: 'ci', label: 'Mostrar IC 95 % del sesgo y de los límites', type: 'check', def: true }, { k: 'reg', label: 'Recta de la diferencia sobre el promedio', type: 'check', def: false },
    { k: 'dec', label: 'Decimales de los valores', type: 'number', def: 1 }, { k: 'unit', label: 'Unidad (se muestra en las etiquetas)', type: 'text', def: 'mg/dL' },
    { k: 'title', label: 'Título', type: 'text', def: 'Agreement Between Point-of-Care and Laboratory Creatinine' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' },
    { k: 'xlab', label: 'Título del eje X', type: 'text', def: 'Mean of the Two Methods' }, { k: 'ylab', label: 'Título del eje Y', type: 'text', def: 'Difference (Point-of-Care − Laboratory)' }, { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.55, step: 0.05 },
  ],
  tables: [{ k: 'data', label: 'Pares de mediciones', help: 'Una fila por sujeto: método A y método B (la diferencia es A − B). Grupo opcional.', cols: [{ k: 'a', label: 'Método A', type: 'num', w: 100 }, { k: 'b', label: 'Método B', type: 'num', w: 100 }, { k: 'group', label: 'Grupo', type: 'text', w: 140 }] }],
  example() { const r = lcg(17), rows = []; for (let i = 0; i < 60; i++) { const t = 0.7 + 3 * r(), b = t + 0.12 * norm(r), a = t * 1.03 + 0.06 + 0.16 * norm(r); rows.push({ a: +a.toFixed(2), b: +b.toFixed(2), group: '' }); } return { settings: {}, tables: { data: rows } }; },
  render(st, o) {
    const S = { pct: false, ci: true, reg: false, dec: 1, unit: '', aspect: 0.55, ...st.settings }, fs = o.fs, W = o.W, d = rowsOf(st, 'data').map(r => ({ a: num(r.a), b: num(r.b), g: String(r.group ?? '').trim() })).filter(r => isFinite(r.a) && isFinite(r.b));
    if (d.length < 3) return empty(o, 'Añada al menos tres pares de mediciones.');
    const B = blandAltman(d.map(r => r.a), d.map(r => r.b), { pct: S.pct }), u = S.pct ? '%' : S.unit ? ` ${S.unit}` : '', dec = +S.dec || 0, f = v => `${fmt(v, dec)}${u}`;
    const xlo0 = Math.min(...B.m), xhi0 = Math.max(...B.m), pad = (xhi0 - xlo0) * 0.05 || 1, ylim = Math.max(Math.abs(B.ciLo[0]), Math.abs(B.ciHi[1]), ...B.d.map(Math.abs)) * 1.12, tk = niceTicks(-ylim, ylim, 6), yl = Math.ceil(ylim / (tk[1] - tk[0])) * (tk[1] - tk[0]), xt = niceTicks(xlo0 - pad, xhi0 + pad, 6);
    const right = Math.max(...[`+1.96 SD ${f(B.hi)}`, `Sesgo ${f(B.bias)}`, `−1.96 SD ${f(B.lo)}`].map(t => textW(t, fs, true))) + fs * 1.2;
    const F = frame(o, { id: S.id, title: S.title, x: [Math.min(xt[0], xlo0 - pad), Math.max(xt.at(-1), xhi0 + pad)], y: [-yl, yl], yticks: niceTicks(-yl, yl, 6), xlab: S.xlab, ylab: S.pct ? 'Difference (% of the mean)' : S.ylab, ph: W * 0.8 * S.aspect, right });
    let body = F.s; const x0 = F.ax, x1 = F.ax + F.pw, band = (a, b, c) => R(x0, F.sy(b), F.pw, F.sy(a) - F.sy(b), { fill: c }).replace('/>', ' fill-opacity="0.16"/>'), cb = colOf(o, 0), cl = lineOf(o, 0);
    if (S.ci) body += band(B.ciHi[0], B.ciHi[1], '#8E8E8E') + band(B.ciLo[0], B.ciLo[1], '#8E8E8E') + band(B.ciBias[0], B.ciBias[1], cl);
    body += L(x0, F.sy(0), x1, F.sy(0), { w: 1, c: '#BBBBBB' }); const clip = 'ba' + d.length, groups = uniq(d.map(r => r.g));
    d.forEach((r, i) => { body += `<circle cx="${F.sx(B.m[i]).toFixed(1)}" cy="${F.sy(B.d[i]).toFixed(1)}" r="${fs * 0.28}" fill="${groups.length > 1 ? lineOf(o, groups.indexOf(r.g)) : INK}" fill-opacity="0.6"/>`; });
    if (S.reg) { const fit = olsLine(B.m, B.d), a = Math.min(...B.m), b = Math.max(...B.m); body += L(F.sx(a), F.sy(fit.a + fit.b * a), F.sx(b), F.sy(fit.a + fit.b * b), { w: 2, c: '#C46B78' }); }
    body += L(x0, F.sy(B.bias), x1, F.sy(B.bias), { w: 2.4, c: cl }) + L(x0, F.sy(B.hi), x1, F.sy(B.hi), { w: 1.8, c: INK, dash: '7 5' }) + L(x0, F.sy(B.lo), x1, F.sy(B.lo), { w: 1.8, c: INK, dash: '7 5' });
    const lab = (y, t, c) => T(x1 + fs * 0.5, F.sy(y) + fs * 0.35, t, { fs, bold: true, fill: c }); body += lab(B.hi, `+1.96 SD ${f(B.hi)}`, INK) + lab(B.bias, `Sesgo ${f(B.bias)}`, cl) + lab(B.lo, `−1.96 SD ${f(B.lo)}`, INK);
    let y = F.yEnd; const lines = [`n = ${B.n}; sesgo ${f(B.bias)} (IC 95 %, ${fmt(B.ciBias[0], dec)} a ${fmt(B.ciBias[1], dec)}); DE de las diferencias ${f(B.sd)}.`, S.ci ? `Límites de acuerdo ${fmt(B.lo, dec)} a ${fmt(B.hi, dec)}${u}; IC 95 % del límite inferior ${fmt(B.ciLo[0], dec)} a ${fmt(B.ciLo[1], dec)} y del superior ${fmt(B.ciHi[0], dec)} a ${fmt(B.ciHi[1], dec)}.` : ''].filter(Boolean);
    lines.forEach((t, i) => (body += T(fs, y + fs * (1.0 + 1.3 * i), t, { fs: fs * 0.92 }))); y += fs * (1.0 + 1.3 * lines.length);
    return svgRoot(W, y + fs * 0.4, body, { fs, frame: o.frame });
  },
};
