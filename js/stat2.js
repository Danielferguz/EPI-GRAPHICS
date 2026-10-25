// Estadísticos pequeños que usan los gráficos nuevos (cuantiles, densidad, histograma, regresión y LOESS, correlación, Bland-Altman, Egger, treemap).
import { qt, pt, qnorm } from './dist.js?v=2026.10.25-1';

export const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
// cuantil tipo 7 (como numpy.percentile y R por defecto)
export function quantile(sorted, p) { const n = sorted.length; if (!n) return NaN; const h = (n - 1) * p, i = Math.floor(h); return sorted[i] + (h - i) * ((sorted[Math.min(i + 1, n - 1)]) - sorted[i]); }
export const sortNum = a => Float64Array.from(a).sort();
export function boxStats(v, coef = 1.5) {
  const s = sortNum(v), q1 = quantile(s, 0.25), med = quantile(s, 0.5), q3 = quantile(s, 0.75), iqr = q3 - q1, lo = s.find(x => x >= q1 - coef * iqr), hi = [...s].reverse().find(x => x <= q3 + coef * iqr);
  return { n: s.length, q1, med, q3, lo, hi, mean: mean(s), out: s.filter(x => x < lo || x > hi), min: s[0], max: s[s.length - 1] };
}
// ancho de banda de Silverman (bw.nrd0 de R)
export function bwNrd0(v) { const s = sortNum(v), lo = Math.min(sd(s), (quantile(s, 0.75) - quantile(s, 0.25)) / 1.34) || sd(s) || 1; return 0.9 * lo * Math.pow(s.length, -0.2); }
// densidad gaussiana en una rejilla; bw opcional
export function kde(v, { n = 128, bw = null, lo = null, hi = null, cut = 3 } = {}) {
  const h = bw || bwNrd0(v), a = lo ?? Math.min(...v) - cut * h, b = hi ?? Math.max(...v) + cut * h, xs = [], ys = [], c = 1 / (v.length * h * Math.sqrt(2 * Math.PI));
  for (let i = 0; i < n; i++) { const x = a + (b - a) * i / (n - 1); let s = 0; for (const xi of v) { const z = (x - xi) / h; s += Math.exp(-0.5 * z * z); } xs.push(x); ys.push(c * s); }
  return { x: xs, y: ys, bw: h };
}
// histograma: bins = número de clases, 'fd' (Freedman-Diaconis) o 'sturges'
export function histogram(v, { bins = 'fd', lo = null, hi = null } = {}) {
  const s = sortNum(v), a = lo ?? s[0], b = hi ?? s[s.length - 1], n = s.length; let k;
  if (typeof bins === 'number') k = bins; else if (bins === 'sturges') k = Math.ceil(Math.log2(n) + 1); else { const h = 2 * (quantile(s, 0.75) - quantile(s, 0.25)) * Math.pow(n, -1 / 3); k = h > 0 ? Math.ceil((b - a) / h) : Math.ceil(Math.log2(n) + 1); }
  k = Math.max(1, Math.min(200, k)); const w = (b - a) / k || 1, counts = new Array(k).fill(0);
  for (const x of s) counts[Math.min(k - 1, Math.max(0, Math.floor((x - a) / w)))]++;
  return { edges: Array.from({ length: k + 1 }, (_, i) => a + i * w), counts, width: w, n };
}
// regresión lineal simple con banda de confianza (media) o de predicción
export function olsLine(x, y, { level = 0.95, pred = false } = {}) {
  const n = x.length, mx = mean(x), my = mean(y); let sxx = 0, sxy = 0, syy = 0; for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
  const b = sxy / sxx, a = my - b * mx, rss = y.reduce((s, yi, i) => s + (yi - a - b * x[i]) ** 2, 0), s2 = rss / (n - 2), t = qt(1 - (1 - level) / 2, n - 2), r = sxy / Math.sqrt(sxx * syy);
  const at = v => { const f = a + b * v, se = Math.sqrt(s2 * ((pred ? 1 : 0) + 1 / n + (v - mx) ** 2 / sxx)); return { y: f, lo: f - t * se, hi: f + t * se }; };
  return { a, b, r, r2: r * r, n, s: Math.sqrt(s2), seB: Math.sqrt(s2 / sxx), p: 2 * (1 - pt(Math.abs(b / Math.sqrt(s2 / sxx)), n - 2)), at };
}
// LOESS local lineal con pesos tricúbicos (sin iteraciones robustas)
export function loess(x, y, span = 0.75, xs = null) {
  const n = x.length, q = Math.max(3, Math.min(n, Math.ceil(span * n))), grid = xs || Array.from({ length: 60 }, (_, i) => Math.min(...x) + (Math.max(...x) - Math.min(...x)) * i / 59), out = [];
  for (const x0 of grid) {
    const d = Float64Array.from(x, v => Math.abs(v - x0)), h = Float64Array.from(d).sort()[q - 1] || 1e-12; let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
    for (let i = 0; i < n; i++) { const u = d[i] / h; if (u >= 1) continue; const w = (1 - u ** 3) ** 3; sw += w; swx += w * x[i]; swy += w * y[i]; swxx += w * x[i] * x[i]; swxy += w * x[i] * y[i]; }
    const den = sw * swxx - swx * swx, b = Math.abs(den) < 1e-12 ? 0 : (sw * swxy - swx * swy) / den, a = (swy - b * swx) / sw; out.push([x0, a + b * x0]);
  }
  return out;
}
export function pearson(x, y) { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); }
// Bland-Altman: sesgo, límites de acuerdo e IC (Bland y Altman 1999)
export function blandAltman(a, b, { pct = false, level = 0.95 } = {}) {
  const n = a.length, m = a.map((v, i) => (v + b[i]) / 2), d = a.map((v, i) => (pct ? 100 * (v - b[i]) / ((v + b[i]) / 2) : v - b[i])), bias = mean(d), s = sd(d), z = qnorm(0.975), t = qt(1 - (1 - level) / 2, n - 1);
  const seBias = s / Math.sqrt(n), seLoa = Math.sqrt(s * s * (1 / n + z * z / (2 * (n - 1))));
  return { n, m, d, bias, sd: s, lo: bias - z * s, hi: bias + z * s, ciBias: [bias - t * seBias, bias + t * seBias], ciLo: [bias - z * s - t * seLoa, bias - z * s + t * seLoa], ciHi: [bias + z * s - t * seLoa, bias + z * s + t * seLoa] };
}
// prueba de Egger: z = est/se sobre la precisión 1/se; intercepto = asimetría
export function egger(est, se) { const z = est.map((e, i) => e / se[i]), p = se.map(s => 1 / s), f = olsLine(p, z); return { intercept: f.a, se: Math.sqrt(f.s ** 2 * (1 / est.length + mean(p) ** 2 / p.reduce((s, v) => s + (v - mean(p)) ** 2, 0))), p: null, f }; }
export function eggerP(est, se) { const e = egger(est, se), df = est.length - 2; e.p = 2 * (1 - pt(Math.abs(e.intercept / e.se), df)); return e; }
// treemap «squarified» (Bruls et al.): devuelve rectángulos [{i, x, y, w, h}] dentro de (x0, y0, W, H)
export function squarify(values, x0, y0, W, H) {
  const items = values.map((v, i) => ({ i, v })).filter(o => o.v > 0).sort((a, b) => b.v - a.v), tot = items.reduce((s, o) => s + o.v, 0), out = []; if (!tot) return out;
  const sc = W * H / tot; let rect = { x: x0, y: y0, w: W, h: H }, row = [];
  const worst = (r, side) => { const s = r.reduce((a, o) => a + o.v * sc, 0), mx = Math.max(...r.map(o => o.v * sc)), mn = Math.min(...r.map(o => o.v * sc)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
  const layout = r => { const s = r.reduce((a, o) => a + o.v * sc, 0), horiz = rect.w >= rect.h, side = horiz ? rect.h : rect.w, thick = s / side; let p = 0;
    for (const o of r) { const len = o.v * sc / thick; out.push(horiz ? { i: o.i, x: rect.x, y: rect.y + p, w: thick, h: len } : { i: o.i, x: rect.x + p, y: rect.y, w: len, h: thick }); p += len; }
    rect = horiz ? { x: rect.x + thick, y: rect.y, w: rect.w - thick, h: rect.h } : { x: rect.x, y: rect.y + thick, w: rect.w, h: rect.h - thick }; };
  for (const o of items) { const side = Math.min(rect.w, rect.h); if (!row.length || worst([...row, o], side) <= worst(row, side)) row.push(o); else { layout(row); row = [o]; } }
  if (row.length) layout(row); return out;
}
// generador pseudoaleatorio determinista (para el desplazamiento de puntos)
export function lcg(seed = 7) { let s = seed >>> 0; return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296); }
