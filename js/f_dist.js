// Distribuciones: caja, violín, nube de lluvia (raincloud), puntos, histograma, densidad y crestas (ridgeline).
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, rowsOf, uniq, natural, empty, legend, INK, FRAME, lum, sep } from './kit.js?v=2026.10.25-1';
import { quantile, sortNum, boxStats, kde, histogram, mean, lcg } from './stat2.js?v=2026.10.25-1';

const norm = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const KINDS = [['box', 'Caja (Tukey)'], ['violin', 'Violín'], ['raincloud', 'Nube de lluvia (densidad + caja + puntos)'], ['points', 'Puntos con media e IC 95 %'], ['hist', 'Histograma superpuesto'], ['density', 'Densidad'], ['ridge', 'Crestas (ridgeline)']];
export const dist = {
  id: 'dist', name: 'Distribuciones (caja, violín, nube de lluvia, histograma…)', short: 'Distribuciones',
  desc: 'Compara la distribución de una variable cuantitativa entre grupos con caja, violín, nube de lluvia, puntos, histograma, densidad o crestas. Muestra n, mediana o media y un valor P opcional.',
  settings: [
    { k: 'kind', label: 'Tipo de gráfico', type: 'select', opts: KINDS, def: 'raincloud' },
    { k: 'horizontal', label: 'Horizontal (cajas, violines, puntos)', type: 'check', def: false },
    { k: 'showPts', label: 'Superponer los datos individuales', type: 'check', def: true },
    { k: 'showMean', label: 'Marcar la media (rombo)', type: 'check', def: true },
    { k: 'showN', label: 'Mostrar n bajo el nombre del grupo', type: 'check', def: true },
    { k: 'bins', label: 'Clases del histograma (fd, sturges o un número)', type: 'text', def: 'fd' },
    { k: 'bwMult', label: 'Suavizado de la densidad (× ancho de banda)', type: 'number', def: 1, step: 0.1 },
    { k: 'title', label: 'Título', type: 'text', def: 'Estimated GFR at Week 52' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' },
    { k: 'vlab', label: 'Título del eje de valores', type: 'text', def: 'eGFR (ml/min/1.73 m²)' }, { k: 'glab', label: 'Título del eje de grupos', type: 'text', def: '' },
    { k: 'vmin', label: 'Valor mínimo del eje (vacío = automático)', type: 'number', def: '' }, { k: 'vmax', label: 'Valor máximo del eje (vacío = automático)', type: 'number', def: '' },
    { k: 'pText', label: 'Texto del valor P (vacío = ninguno)', type: 'text', def: 'P<0.001' }, { k: 'pFrom', label: 'P entre el grupo nº', type: 'number', def: 1 }, { k: 'pTo', label: 'y el grupo nº', type: 'number', def: 2 },
    { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.6, step: 0.05 },
  ],
  tables: [
    { k: 'groups', label: 'Grupos (orden y color; vacío = por aparición)', cols: [{ k: 'name', label: 'Grupo', type: 'text', w: 200 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'data', label: 'Datos', help: 'Una fila por observación: grupo y valor. Puede pegar miles de filas desde Excel.', cols: [{ k: 'group', label: 'Grupo', type: 'text', w: 200 }, { k: 'value', label: 'Valor', type: 'num', w: 100 }] },
  ],
  example() {
    const r = lcg(31), rows = [], spec = [['Atacicept', 62, 3, 14], ['Placebo', 55, 2.5, 13], ['Sibeprenlimab', 60, 3.5, 15]];
    for (const [g, mu, , sdv] of spec) for (let i = 0; i < 60; i++) rows.push({ group: g, value: +(mu + sdv * norm(r)).toFixed(1) });
    return { settings: {}, tables: { groups: [{ name: 'Placebo', color: '' }, { name: 'Atacicept', color: '' }, { name: 'Sibeprenlimab', color: '' }], data: rows } };
  },
  render(st, o) {
    const S = { kind: 'raincloud', horizontal: false, showPts: true, showMean: true, showN: true, bins: 'fd', bwMult: 1, aspect: 0.6, pFrom: 1, pTo: 2, ...st.settings }, fs = o.fs;
    const data = rowsOf(st, 'data').map(r => ({ g: String(r.group ?? '').trim(), v: num(r.value) })).filter(r => r.g && isFinite(r.v));
    if (!data.length) return empty(o, 'Pegue los datos (grupo y valor).');
    const ordered = rowsOf(st, 'groups').map(r => String(r.name).trim()).filter(Boolean), groups = [...ordered.filter(g => data.some(d => d.g === g)), ...uniq(data.map(d => d.g)).filter(g => !ordered.includes(g))];
    const col = g => rowsOf(st, 'groups').find(r => String(r.name).trim() === g)?.color || colOf(o, groups.indexOf(g)), vals = Object.fromEntries(groups.map(g => [g, data.filter(d => d.g === g).map(d => d.v)]));
    const all = data.map(d => d.v), lo0 = Math.min(...all), hi0 = Math.max(...all), padv = (hi0 - lo0) * 0.06 || 1, vlo = isFinite(num(S.vmin)) ? num(S.vmin) : lo0 - padv, vhi = (isFinite(num(S.vmax)) ? num(S.vmax) : hi0 + padv) + (S.pText && ['box', 'violin', 'raincloud', 'points'].includes(S.kind) ? (hi0 - lo0 + 2 * padv) * 0.14 : 0), kind = S.kind, W = o.W;
    const lab = g => (S.showN ? `${g}|n=${vals[g].length}` : g);
    let body = '', y = 0;
    const hz = S.horizontal && ['box', 'violin', 'raincloud', 'points'].includes(kind), cat = ['box', 'violin', 'raincloud', 'points'].includes(kind);
    if (cat) {
      const n = groups.length, pwGuess = W * 0.75, ph = hz ? Math.max(W * 0.12 * n, fs * 5 * n) : pwGuess * S.aspect;
      const F = hz ? frame(o, { y0: y, id: S.id, title: S.title, x: [vlo, vhi], ycat: groups.map(lab), ycatBold: true, xlab: S.vlab, ylab: S.glab, ph }) : frame(o, { y0: y, id: S.id, title: S.title, y: [vlo, vhi], xcat: groups.map(lab), ylab: S.vlab, xlab: S.glab, ph });
      body += F.s; const slot = (hz ? F.ph : F.pw) / n, half = slot * 0.36;
      const P = (c, v) => (hz ? [F.sx(v), F.sy(c)] : [F.sx(c), F.sy(v)]), rect = (c, a, b, w0, w1, st_) => { const [x1, y1] = P(c + w0, a), [x2, y2] = P(c + w1, b); return R(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), st_); };
      const off = (c, d) => c + d / slot, jit = lcg(5);
      groups.forEach((g, ci) => {
        const v = vals[g], b = boxStats(v), c = col(g), dark = lum(c) < 0.45, ink = INK, hw = half / slot;
        const dens = ['violin', 'raincloud'].includes(kind) ? kde(v, { lo: Math.max(vlo, Math.min(...v) - 0), hi: Math.min(vhi, Math.max(...v)), bw: undefined, n: 80 }) : null;
        if (dens) { const bwm = S.bwMult !== 1 ? kde(v, { bw: dens.bw * S.bwMult, lo: Math.min(...v), hi: Math.max(...v), n: 80 }) : dens, mx = Math.max(...bwm.y), sgn = sgnOf(hz);
          const poly = kind === 'raincloud' ? [...bwm.x.map((x, i) => P(ci - sgn * (hw * 0.05 + hw * 1.15 * bwm.y[i] / mx), x)), ...[...bwm.x].reverse().map(x => P(ci - sgn * hw * 0.05, x))] : [...bwm.x.map((x, i) => P(ci + hw * bwm.y[i] / mx, x)), ...[...bwm.x].reverse().map(x => P(ci - hw * bwm.y[bwm.x.indexOf(x)] / mx, x))];
          body += `<path d="M${poly.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}Z" fill="${c}" fill-opacity="0.78" stroke="${dark ? c : INK}" stroke-width="1.1"/>`; }
        if (kind === 'box' || kind === 'raincloud') {
          const bw = kind === 'raincloud' ? hw * 0.22 : hw * 0.8, bc = kind === 'raincloud' ? ci + sgnOf(hz) * hw * 0.28 : ci;
          const mid = (a, b2) => { const [x1, y1] = P(bc, a), [x2, y2] = P(bc, b2); return L(x1, y1, x2, y2, { w: 1.4, c: ink }); }, cap = v2 => { const [x1, y1] = P(bc - bw * 0.35, v2), [x2, y2] = P(bc + bw * 0.35, v2); return L(x1, y1, x2, y2, { w: 1.4, c: ink }); };
          body += mid(b.lo, b.q1) + mid(b.q3, b.hi) + cap(b.lo) + cap(b.hi) + rect(bc, b.q1, b.q3, -bw, bw, { fill: kind === 'raincloud' ? '#fff' : c, stroke: ink, sw: 1.4 });
          const [mx1, my1] = P(bc - bw, b.med), [mx2, my2] = P(bc + bw, b.med); body += L(mx1, my1, mx2, my2, { w: 2.4, c: kind === 'raincloud' || !dark ? ink : '#fff' });
          if (kind === 'box') for (const x of b.out) { const [px, py] = P(ci, x); body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${fs * 0.22}" fill="none" stroke="${ink}" stroke-width="1.1"/>`; } }
        if (kind === 'points') { const m = mean(v), se = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)) / Math.sqrt(v.length), t = 1.96 * se; const [x1, y1] = P(ci, m - t), [x2, y2] = P(ci, m + t); body += L(x1, y1, x2, y2, { w: 2, c: ink }); }
        if (S.showPts && kind !== 'violin' && kind !== 'points' || (kind === 'points' && S.showPts)) { const jr = lcg(11 + ci); v.forEach(x => { const jj = kind === 'raincloud' ? sgnOf(hz) * (hw * 0.6 + jr() * hw * 0.5) : (jr() - 0.5) * hw * (kind === 'box' ? 1.0 : 1.4), [px, py] = P(ci + jj, x); body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${fs * 0.2}" fill="${kind === 'box' ? INK : c}" fill-opacity="${kind === 'box' ? 0.35 : 0.65}"/>`; }); }
        if (S.showMean && kind !== 'points') { const [px, py] = P(ci, mean(v)); body += `<polygon points="${px},${py - fs * 0.42} ${px + fs * 0.42},${py} ${px},${py + fs * 0.42} ${px - fs * 0.42},${py}" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`; }
        if (kind === 'points') { const m = mean(v), [px, py] = P(ci, m); body += `<polygon points="${px},${py - fs * 0.5} ${px + fs * 0.5},${py} ${px},${py + fs * 0.5} ${px - fs * 0.5},${py}" fill="${INK}"/>`; }
      });
      const i1 = Math.max(0, Math.min(n - 1, (+S.pFrom || 1) - 1)), i2 = Math.max(0, Math.min(n - 1, (+S.pTo || 2) - 1));
      if (S.pText && i1 !== i2) { const top = Math.max(...vals[groups[i1]], ...vals[groups[i2]]), h = (vhi - vlo) * 0.04, a = P(i1, top + h), b = P(i2, top + h), a2 = P(i1, top + 2 * h), b2 = P(i2, top + 2 * h), m = P((i1 + i2) / 2, top + 2 * h);
        body += `<path d="M${a[0]},${a[1]}L${a2[0]},${a2[1]}L${b2[0]},${b2[1]}L${b[0]},${b[1]}" fill="none" stroke="${INK}" stroke-width="1.4"/>` + (hz ? T(m[0] + fs * 0.6, m[1] + fs * 0.35, S.pText, { fs }) : T(m[0], m[1] - fs * 0.5, S.pText, { fs, anchor: 'middle' })); }
      y = F.yEnd;
    } else if (kind === 'ridge') {
      const n = groups.length, ph = Math.max(W * 0.1 * n, fs * 4 * n), F = frame(o, { y0: y, id: S.id, title: S.title, x: [vlo, vhi], ycat: groups.map(lab), ycatBold: true, xlab: S.vlab, ph }); body += F.s;
      const slot = F.ph / n; groups.forEach((g, i) => { const v = vals[g], d = kde(v, { lo: vlo, hi: vhi, bw: bwOf(v, S), n: 140 }), mx = Math.max(...d.y), base = F.sy(i) + slot * 0.38, pts = d.x.map((x, k) => [F.sx(x), base - d.y[k] / mx * slot * 0.85]);
        body += `<path d="M${F.sx(d.x[0])},${base}L${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}L${F.sx(d.x.at(-1))},${base}Z" fill="${col(g)}" fill-opacity="0.8" stroke="${INK}" stroke-width="1.1"/>` + L(F.ax, base, F.ax + F.pw, base, { w: 0.8, c: '#BBB' });
        if (S.showMean) { const m = mean(v), px = F.sx(m); body += L(px, base, px, base - slot * 0.45, { w: 1.4, c: INK, dash: '4 3' }); } });
      y = F.yEnd;
    } else { // hist / density: x = valor
      const hs = groups.map(g => histogram(vals[g], { lo: vlo, hi: vhi, bins: /^\d+$/.test(String(S.bins)) ? +S.bins : String(S.bins) || 'fd' })), ds = groups.map(g => kde(vals[g], { lo: vlo, hi: vhi, bw: bwOf(vals[g], S), n: 140 }));
      const ymax = kind === 'hist' ? Math.max(...hs.map((h, i) => Math.max(...h.counts.map(c => c / (S.dens ? vals[groups[i]].length * h.width : 1))))) * 1.08 : Math.max(...ds.map(d => Math.max(...d.y))) * 1.08;
      const F = frame(o, { y0: y, id: S.id, title: S.title, x: [vlo, vhi], y: [0, ymax], xlab: S.vlab, ylab: kind === 'hist' ? 'Frecuencia' : 'Densidad', ph: W * 0.75 * S.aspect, yfmt: kind === 'density' ? v => fmt(v, v < 0.01 ? 3 : 2) : null }); body += F.s;
      groups.forEach((g, i) => { const c = col(g);
        if (kind === 'hist') hs[i].counts.forEach((cnt, k) => { const x1 = F.sx(hs[i].edges[k]), x2 = F.sx(hs[i].edges[k + 1]); body += R(x1, F.sy(cnt), x2 - x1, F.sy(0) - F.sy(cnt), { fill: c, stroke: '#fff', sw: 0.8 }).replace('/>', ' fill-opacity="0.55"/>'); });
        else body += `<path d="M${F.sx(ds[i].x[0])},${F.sy(0)}L${ds[i].x.map((x, k) => `${F.sx(x).toFixed(1)},${F.sy(ds[i].y[k]).toFixed(1)}`).join('L')}L${F.sx(ds[i].x.at(-1))},${F.sy(0)}Z" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="2.6"/>`;
        if (S.showMean) { const px = F.sx(mean(vals[g])); body += L(px, F.sy(0), px, F.top + 2, { w: 1.4, c, dash: '5 4' }); } });
      const lg = legend(o, groups.map(g => ({ label: lab(g).replace('|', ' ('). replace(/$/, S.showN ? ')' : ''), color: col(g) })), F.ax, F.yEnd + fs * 0.4); body += lg.s; y = lg.y;
    }
    return svgRoot(W, y + fs * 0.6, body, { fs, frame: o.frame });
  },
};
const sgnOf = hz => (hz ? -1 : 1), bwOf = (v, S) => (S.bwMult !== 1 ? kde(v).bw * S.bwMult : undefined);
