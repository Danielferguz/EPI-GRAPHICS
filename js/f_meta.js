// Gráfico de embudo (sesgo de publicación, con prueba de Egger) y gráfico de volcán.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, empty, legend, minus, niceTicks, INK, FRAME } from './kit.js?v=2026.10.24-2';
import { eggerP } from './stat2.js?v=2026.10.24-2';

export const meta = {
  id: 'meta', name: 'Embudo (sesgo de publicación) y volcán', short: 'Embudo / volcán',
  desc: 'Gráfico de embudo con efecto combinado, pseudo-IC 95 y 99 % y prueba de Egger; o gráfico de volcán (efecto frente a −log10 P) con umbrales y etiquetas de los puntos más extremos.',
  settings: [
    { k: 'kind', label: 'Tipo', type: 'select', opts: [['funnel', 'Embudo'], ['volcano', 'Volcán']], def: 'funnel' }, { k: 'ratio', label: 'Embudo: el efecto es log(razón) y se muestra como razón', type: 'check', def: true },
    { k: 'center', label: 'Embudo: efecto de referencia (vacío = combinado de efecto fijo)', type: 'number', def: '' }, { k: 'egger', label: 'Embudo: mostrar la prueba de Egger', type: 'check', def: true },
    { k: 'pcut', label: 'Volcán: umbral de P', type: 'number', def: 0.05, step: 0.01 }, { k: 'xcut', label: 'Volcán: umbral del efecto absoluto', type: 'number', def: 1 }, { k: 'nlab', label: 'Volcán: etiquetar los N más significativos', type: 'number', def: 8 },
    { k: 'title', label: 'Título', type: 'text', def: 'Funnel Plot of Trial Results' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' }, { k: 'xlab', label: 'Título del eje X', type: 'text', def: 'Risk Ratio' }, { k: 'ylab', label: 'Título del eje Y', type: 'text', def: '' }, { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.7, step: 0.05 },
  ],
  tables: [{ k: 'data', label: 'Datos', help: 'Embudo: efecto (log si es razón) y error estándar. Volcán: efecto y valor P. Etiqueta opcional.', cols: [{ k: 'label', label: 'Etiqueta', type: 'text', w: 160 }, { k: 'est', label: 'Efecto', type: 'num', w: 90 }, { k: 'se', label: 'Error estándar', type: 'num', w: 100 }, { k: 'p', label: 'Valor P', type: 'num', w: 90 }] }],
  example() { const s = [[0.04, -0.35], [0.08, -0.5], [0.1, -0.2], [0.12, -0.62], [0.15, -0.3], [0.18, -0.9], [0.22, -0.4], [0.25, -1.05], [0.3, -0.75], [0.33, -1.2], [0.36, -0.1], [0.4, -1.1], [0.05, -0.28], [0.09, -0.41], [0.14, -0.15], [0.2, -0.7]]; return { settings: {}, tables: { data: s.map(([se, est], i) => ({ label: `Trial ${i + 1}`, est, se, p: '' })) } }; },
  render(st, o) {
    const S = { kind: 'funnel', ratio: true, egger: true, pcut: 0.05, xcut: 1, nlab: 8, aspect: 0.7, ...st.settings }, fs = o.fs, W = o.W, rows = rowsOf(st, 'data').map(r => ({ l: String(r.label ?? '').trim(), e: num(r.est), s: num(r.se), p: num(r.p) }));
    if (S.kind === 'volcano') {
      const d = rows.filter(r => isFinite(r.e) && r.p > 0 && r.p <= 1).map(r => ({ ...r, y: -Math.log10(r.p) })); if (d.length < 2) return empty(o, 'Añada puntos con efecto y valor P.');
      const xm = Math.max(...d.map(r => Math.abs(r.e)), +S.xcut) * 1.1, ym = Math.max(...d.map(r => r.y), -Math.log10(+S.pcut)) * 1.1, F = frame(o, { id: S.id, title: S.title === 'Funnel Plot of Trial Results' ? 'Volcano Plot' : S.title, x: [-xm, xm], y: [0, ym], xlab: S.xlab === 'Risk Ratio' ? 'Effect' : S.xlab, ylab: S.ylab || '−log10(P)', ph: W * 0.75 * S.aspect }); let body = F.s;
      const yc = -Math.log10(+S.pcut); body += L(F.ax, F.sy(yc), F.ax + F.pw, F.sy(yc), { w: 1.3, c: INK, dash: '6 5' }) + L(F.sx(-S.xcut), F.top, F.sx(-S.xcut), F.bot, { w: 1.3, c: INK, dash: '6 5' }) + L(F.sx(S.xcut), F.top, F.sx(S.xcut), F.bot, { w: 1.3, c: INK, dash: '6 5' });
      const cls = r => (r.y >= yc && r.e >= +S.xcut ? 0 : r.y >= yc && r.e <= -S.xcut ? 1 : -1), cc = [lineOf(o, 1) === '#8E8E8E' ? colOf(o, 2) : lineOf(o, 1), lineOf(o, 0)]; d.forEach(r => { const c = cls(r); body += `<circle cx="${F.sx(r.e).toFixed(1)}" cy="${F.sy(r.y).toFixed(1)}" r="${fs * 0.3}" fill="${c < 0 ? '#B5B5B5' : c ? cc[1] : cc[0]}" fill-opacity="0.8"/>`; });
      [...d].sort((a, b) => b.y - a.y).slice(0, +S.nlab || 0).filter(r => r.l).forEach(r => (body += T(F.sx(r.e) + (r.e >= 0 ? 1 : -1) * fs * 0.5, F.sy(r.y) + fs * 0.3, r.l, { fs: fs * 0.9, anchor: r.e >= 0 ? 'start' : 'end' })));
      return svgRoot(W, F.yEnd + fs * 0.6, body, { fs, frame: o.frame });
    }
    const d = rows.filter(r => isFinite(r.e) && r.s > 0); if (d.length < 3) return empty(o, 'Añada al menos tres estudios con efecto y error estándar.');
    const w = d.map(r => 1 / r.s ** 2), pooled = isFinite(num(S.center)) ? (S.ratio ? Math.log(num(S.center)) : num(S.center)) : d.reduce((a, r, i) => a + r.e * w[i], 0) / w.reduce((a, b) => a + b, 0), smax = Math.max(...d.map(r => r.s)) * 1.08;
    const tr = v => (S.ratio ? Math.exp(v) : v), lo = Math.min(pooled - 1.96 * smax, ...d.map(r => r.e)), hi = Math.max(pooled + 1.96 * smax, ...d.map(r => r.e)), pad = (hi - lo) * 0.04;
    const xt = S.ratio ? (() => { const c = [0.1, 0.2, 0.25, 0.33, 0.5, 0.67, 1, 1.5, 2, 3, 4, 5, 10].filter(v => Math.log(v) >= lo - pad && Math.log(v) <= hi + pad); return c.map(v => Math.log(v)); })() : niceTicks(lo - pad, hi + pad, 6);
    const F = frame(o, { id: S.id, title: S.title, x: [lo - pad, hi + pad], y: [smax, 0], xticks: xt, xfmt: S.ratio ? v => String(+Math.exp(v).toPrecision(2)) : null, yticks: niceTicks(0, smax, 5), xlab: S.xlab, ylab: S.ylab || 'Standard Error', ph: W * 0.8 * S.aspect }); let body = F.s;
    const tri = (z, c, op, dash) => { const a = [[F.sx(pooled - z * smax), F.sy(smax)], [F.sx(pooled), F.sy(0)], [F.sx(pooled + z * smax), F.sy(smax)]]; return `<path d="M${a.map(p => p.map(q => q.toFixed(1)).join(',')).join('L')}Z" fill="${c}" fill-opacity="${op}" stroke="${INK}" stroke-width="1.2" ${dash ? 'stroke-dasharray="6 5"' : ''}/>`; };
    body += tri(2.576, '#8E8E8E', 0.1, true) + tri(1.96, '#8E8E8E', 0.14, false) + L(F.sx(pooled), F.sy(0), F.sx(pooled), F.sy(smax), { w: 1.6, c: INK });
    if (S.ratio) body += L(F.sx(0), F.top, F.sx(0), F.bot, { w: 1, c: '#999', dash: '3 4' });
    d.forEach(r => (body += `<circle cx="${F.sx(r.e).toFixed(1)}" cy="${F.sy(r.s).toFixed(1)}" r="${fs * 0.34}" fill="${lineOf(o, 0)}" fill-opacity="0.85" stroke="#fff" stroke-width="0.8"/>`));
    let y = F.yEnd; const e = S.egger && d.length >= 3 ? eggerP(d.map(r => r.e), d.map(r => r.s)) : null, tx = [`Efecto combinado (efecto fijo): ${fmt(tr(pooled), 2)}; zonas: pseudo-IC 95 % (continuo) y 99 % (discontinuo).`, e ? `Prueba de Egger: intercepto ${fmt(e.intercept, 2)} (EE ${fmt(e.se, 2)}), P${e.p < 0.001 ? '<0.001' : '=' + fmt(e.p, 3)}; k = ${d.length}.` : ''].filter(Boolean);
    tx.forEach((t, i) => (body += T(fs, y + fs * (1 + 1.3 * i), t, { fs: fs * 0.92 }))); y += fs * (1 + 1.3 * tx.length);
    return svgRoot(W, y + fs * 0.4, body, { fs, frame: o.frame });
  },
};
