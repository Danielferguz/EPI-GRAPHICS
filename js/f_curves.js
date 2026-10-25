// Curvas con IC (barras de error o bandas), anotaciones finales y tabla «No. at Risk» (estilo NEJM).
import { T, L, R, num, fmt, minus, textW, wrap, tickLabel, fmtTicks, niceTicks, marker, svgRoot, INK, FRAME } from './svg.js?v=2026.10.25-2';

// ---- motor de dibujo compartido con Kaplan-Meier -----------------------------------------------------------------
// panels: [{id,title,ylab,ymin,ymax,ystep,xlab,xticks,xmin,xmax,ref,riskTitle,series:[{name,color,marker,pts,step,band,censor,labelPos,endText,errbars,line}], risk:[{name,vals:[]}]}]
export function drawCurves(panels, o, S = {}) {
  const fs = o.fs, W = o.W, pad = fs * 1.0, lh = 1.22;
  let y = 0, body = '';
  panels.forEach((p, pi) => {
    const tl = wrap(String(p.title ?? ''), W - pad * 2 - fs * 1.8, fs, true), titleH = Math.max(1, tl.length) * fs * lh + fs * 1.5;
    const ymin = p.ymin, ymax = p.ymax, ticksY = p.ystep > 0 ? (() => { const t = []; for (let v = ymin; v <= ymax + p.ystep * 1e-6; v += p.ystep) t.push(+v.toFixed(8)); return t; })() : niceTicks(ymin, ymax, 5);
    const ylabs = fmtTicks(ticksY), tickW = Math.max(...ylabs.map(v => textW(v, fs)), 10);
    const riskRows = p.risk || [], rlabW = Math.max(0, ...riskRows.map(r => textW(r.name, fs)), textW(p.riskTitle || '', fs, true) * 0);
    const ml = Math.max(fs * 1.3 + tickW + fs * 2.4, riskRows.length ? rlabW + fs * 2.6 : 0);
    const rl = Math.max(0, ...p.series.filter(q => q.labelPos === 'right' && q.name).map(q => textW(q.name, fs, true))), ax = ml, plotW = W - ml - pad - fs * 0.5 - (rl ? rl + fs * 1.4 : 0), ph = Math.max(100, W * (S.aspect || 0.4));
    const xticks = p.xticks.length ? p.xticks : niceTicks(p.xmin, p.xmax, 6);
    const xmin = isFinite(p.xmin) ? p.xmin : Math.min(...xticks), xmax = isFinite(p.xmax) ? p.xmax : Math.max(...xticks) + (Math.max(...xticks) - Math.min(...xticks)) * 0.03;
    const sx = v => ax + (v - xmin) / ((xmax - xmin) || 1) * plotW, sy = v => y + titleH + ph * (1 - (v - ymin) / ((ymax - ymin) || 1));
    const top = y + titleH, bot = top + ph;
    body += T(pad, y + fs * 1.55, String(p.id ?? ''), { fs: fs * 1.3, bold: true }) + T(pad + (p.id ? fs * 1.9 : 0), y + fs * 1.5, tl, { fs, bold: true });
    // ejes
    body += L(ax, top, ax, bot, { w: 1.4 }) + L(ax, bot, ax + plotW, bot, { w: 1.4 });
    ticksY.forEach((v, ti) => { body += L(ax - 6, sy(v), ax, sy(v), { w: 1.4 }) + T(ax - 10, sy(v) + fs * 0.35, ylabs[ti], { fs, anchor: 'end' }); });
    for (const v of xticks) body += L(sx(v), bot, sx(v), bot + 6, { w: 1.4 }) + T(sx(v), bot + 6 + fs * 1.15, tickLabel(v), { fs, anchor: 'middle' });
    body += T(ax - 10 - tickW - fs * 0.9, top + ph / 2, String(p.ylab ?? ''), { fs, bold: true, anchor: 'middle', rotate: -90 });
    if (p.xlab) body += T(ax + plotW / 2, bot + 6 + fs * 3.2, p.xlab, { fs, bold: true, anchor: 'middle' });
    if (isFinite(p.ref)) body += L(ax, sy(p.ref), ax + plotW, sy(p.ref), { w: 1.4, dash: '6 5' });
    if (isFinite(p.vline)) body += L(sx(p.vline), top, sx(p.vline), bot, { w: 1.4, dash: '6 5' }) + (p.vtext ? T(sx(p.vline) - fs * 0.4, top + fs * 1.1, p.vtext, { fs, anchor: 'end', bold: true }) : '');
    if (p.note?.text) { const ls = String(p.note.text).split(/\||\n/), pos = p.note.pos || 'bl', right = pos.endsWith('r'), bottom = pos.startsWith('b'); body += T(right ? ax + plotW - fs * 0.6 : ax + fs * 0.8, bottom ? bot - fs * 0.9 - (ls.length - 1) * fs * lh : top + fs * 1.4, ls, { fs, anchor: right ? 'end' : 'start' }); }
    // series
    const ends = [];
    p.series.forEach((s, si) => {
      const col = s.color || (o.line || o.pal)[si % (o.line || o.pal).length], pts = s.pts.filter(q => isFinite(q.x) && isFinite(q.y)).sort((a, b) => a.x - b.x);
      if (!pts.length) return;
      if (s.band && pts.some(q => isFinite(q.lo))) {
        const up = [], dn = [];
        pts.forEach((q, i) => { if (s.step && i) { up.push([q.x, pts[i - 1].hi]); dn.push([q.x, pts[i - 1].lo]); } up.push([q.x, q.hi]); dn.push([q.x, q.lo]); });
        body += `<path d="M${up.map(([a, b]) => `${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join('L')}L${dn.reverse().map(([a, b]) => `${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join('L')}Z" fill="${col}" fill-opacity=".15" stroke="none"/>`;
      }
      if (s.line !== false) {
        let d = '';
        pts.forEach((q, i) => { d += i === 0 ? `M${sx(q.x).toFixed(1)},${sy(q.y).toFixed(1)}` : s.step ? `H${sx(q.x).toFixed(1)}V${sy(q.y).toFixed(1)}` : `L${sx(q.x).toFixed(1)},${sy(q.y).toFixed(1)}`; });
        body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;
      }
      if (s.errbars) for (const q of pts) if (isFinite(q.lo) && isFinite(q.hi)) { const c = fs * 0.35; body += L(sx(q.x), sy(q.lo), sx(q.x), sy(q.hi), { w: 1.7, c: col }) + L(sx(q.x) - c, sy(q.lo), sx(q.x) + c, sy(q.lo), { w: 1.7, c: col }) + L(sx(q.x) - c, sy(q.hi), sx(q.x) + c, sy(q.hi), { w: 1.7, c: col }); }
      for (const c of s.censor || []) body += L(sx(c[0]), sy(c[1]) - fs * 0.3, sx(c[0]), sy(c[1]) + fs * 0.3, { w: 1.3, c: col });
      if (s.marker && s.marker !== 'none') for (const q of pts) body += marker(s.marker, sx(q.x), sy(q.y), fs * 0.5, col);
      const last = pts[pts.length - 1];
      // etiqueta de la serie
      if (s.name && s.labelPos !== 'none') {
        const k = Math.min(pts.length - 1, Math.max(0, pts.findIndex(q => q.x >= xmin + (xmax - xmin) * 0.6))), q = pts[k] || last;
        if (s.labelPos === 'right') body += T(sx(last.x) + fs * 0.9, sy(last.y) + fs * 0.35, s.name, { fs, bold: true, fill: col });
        else if (s.labelPos === 'above') body += T(sx(q.x), sy(q.y) - fs * (s.errbars ? 2.0 : 1.0), s.name, { fs, bold: true, fill: col, anchor: 'middle' });
        else body += T(sx(q.x), sy(q.y) + fs * (s.errbars ? 3.1 : 2.0), s.name, { fs, bold: true, fill: col, anchor: 'middle' });
      }
      ends.push({ s, col, last });
    });
    // anotación de cada punto con su IC (estilo «−8.5 (−15.8 to 0.5)»): la serie más alta rotula por encima, las demás por debajo
    if (S.annotate === 'all') { const dec = S.dec ?? 1, xsA = [...new Set(p.series.flatMap(q => q.pts.map(r => r.x)))].sort((a, b) => a - b);
      xsA.forEach(xv => { const at = p.series.map((q, si) => ({ q, si, r: q.pts.find(r => r.x === xv) })).filter(e => e.r && isFinite(e.r.y) && xv > xmin); at.sort((a, b) => b.r.y - a.r.y);
        at.forEach((e, k) => { const col = e.q.color || (o.line || o.pal)[e.si % (o.line || o.pal).length], txt = [fmt(e.r.y, dec), isFinite(e.r.lo) ? `(${fmt(e.r.lo, dec)} to ${fmt(e.r.hi, dec)})` : ''].filter(Boolean), up = k === 0, yy = up ? sy(isFinite(e.r.hi) ? e.r.hi : e.r.y) - fs * 0.8 - (txt.length - 1) * fs * lh : sy(isFinite(e.r.lo) ? e.r.lo : e.r.y) + fs * 1.5;
          body += T(sx(xv), yy, txt, { fs: fs * 0.95, anchor: 'middle', fill: col }); }); }); }
    // anotación final: la serie con el valor final más alto va por encima, el resto por debajo
    const sorted = [...ends].sort((a, b) => b.last.y - a.last.y);
    sorted.forEach((e, i) => {
      let txt = e.s.endText;
      if (txt === 'none') return;
      if (S.annotate === 'all' || S.annotate === 'none') return;
      if (!txt && S.autoEnd && isFinite(e.last.lo)) txt = `${fmt(e.last.y, S.dec ?? 2)} (95% CI,|${fmt(e.last.lo, S.dec ?? 2)}–${fmt(e.last.hi, S.dec ?? 2).replace(/^−?/, m => m)})`;
      if (!txt) return;
      const ls = String(txt).split(/\||\n/), xx = ax + plotW - fs * 0.2;
      const yu = e.s.errbars && isFinite(e.last.hi) ? sy(e.last.hi) : sy(e.last.y), yl = e.s.errbars && isFinite(e.last.lo) ? sy(e.last.lo) : sy(e.last.y);
      if (i === 0) body += T(xx, yu - fs * 0.9 - (ls.length - 1) * fs * lh, ls, { fs, anchor: 'end', fill: e.col });
      else body += T(xx, yl + fs * 1.9, ls, { fs, anchor: 'end', fill: e.col });
    });
    let yEnd = bot + 6 + fs * (p.xlab ? 3.9 : 2.2);
    // número en riesgo
    if (riskRows.length) {
      const yr = yEnd + fs * 1.3;
      body += T(pad, yr, p.riskTitle || 'No. at Risk', { fs, bold: true });
      riskRows.forEach((r, ri) => {
        const yy = yr + fs * 1.6 * (ri + 1);
        body += T(pad, yy, r.name, { fs });
        xticks.forEach((t, ti) => { const v = r.vals[ti]; if (v !== '' && v != null && v !== undefined) body += T(sx(t), yy, String(v), { fs, anchor: 'middle' }); });
      });
      yEnd = yr + fs * 1.6 * riskRows.length + fs * 0.8;
    }
    y = yEnd + fs * 0.6;
    if (p.inset) { const I = p.inset, [bx0, by0, bx1, by1] = I.box, X0 = ax + plotW * bx0, X1 = ax + plotW * bx1, Y0 = top + ph * by0, Y1 = top + ph * by1, f2 = fs * 0.85, ix0 = X0 + fs * 3.4, ix1 = X1 - fs * 0.6, iy0 = Y0 + fs * 0.9, iy1 = Y1 - fs * 2.6, isx = v => ix0 + (v - I.x[0]) / ((I.x[1] - I.x[0]) || 1) * (ix1 - ix0), isy = v => iy1 - (v - I.y[0]) / ((I.y[1] - I.y[0]) || 1) * (iy1 - iy0), cid = `ins${pi}${Math.round(W)}`;
      body += R(X0, Y0, X1 - X0, Y1 - Y0, { fill: '#fff', stroke: '#9AA1A3', sw: 1.2 }) + L(ix0, iy0, ix0, iy1, { w: 1.2 }) + L(ix0, iy1, ix1, iy1, { w: 1.2 }) + `<clipPath id="${cid}"><rect x="${ix0}" y="${iy0 - 2}" width="${ix1 - ix0}" height="${iy1 - iy0 + 4}"/></clipPath><g clip-path="url(#${cid})">`;
      p.series.forEach((s, si) => { const col = s.color || (o.line || o.pal)[si % (o.line || o.pal).length], pts = s.pts.filter(q => isFinite(q.x) && isFinite(q.y)).sort((a, b) => a.x - b.x); let d = ''; pts.forEach((q, i) => { d += i === 0 ? `M${isx(q.x).toFixed(1)},${isy(q.y).toFixed(1)}` : s.step ? `H${isx(q.x).toFixed(1)}V${isy(q.y).toFixed(1)}` : `L${isx(q.x).toFixed(1)},${isy(q.y).toFixed(1)}`; }); body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.4"/>`; }); body += '</g>';
      niceTicks(I.y[0], I.y[1], 4).filter(v => v >= I.y[0] - 1e-9 && v <= I.y[1] + 1e-9).forEach(v => (body += L(ix0 - 5, isy(v), ix0, isy(v), { w: 1.2 }) + T(ix0 - 8, isy(v) + f2 * 0.35, fmtTicks([v])[0], { fs: f2, anchor: 'end' }))); niceTicks(I.x[0], I.x[1], 5).filter(v => v >= I.x[0] - 1e-9 && v <= I.x[1] + 1e-9).forEach(v => (body += L(isx(v), iy1, isx(v), iy1 + 5, { w: 1.2 }) + T(isx(v), iy1 + 5 + f2 * 1.15, tickLabel(v), { fs: f2, anchor: 'middle' }))); if (p.xlab) body += T((ix0 + ix1) / 2, iy1 + 5 + f2 * 2.5, p.xlab, { fs: f2, bold: true, anchor: 'middle' }); }
    if (o.frame && pi < panels.length - 1) body += L(0, y, W, y, { w: 3, c: FRAME });
    y += pi < panels.length - 1 ? 0.5 : 0;
  });
  return svgRoot(W, y, body, { fs, frame: o.frame });
}

const split = s => String(s ?? '').split(/[,;\s]+/).map(Number).filter(isFinite);
export const curves = {
  id: 'curves', name: 'Curvas con IC y número en riesgo', short: 'Curvas',
  desc: 'Medias o razones a lo largo del tiempo con barras de error, referencia punteada, anotación del último valor y tabla «No. at Risk». Uno o varios paneles.',
  settings: [
    { k: 'aspect', label: 'Altura del gráfico (proporción del ancho)', type: 'number', def: 0.4, step: 0.05 },
    { k: 'errbars', label: 'Barras de error (IC)', type: 'check', def: true },
    { k: 'autoEnd', label: 'Anotar el último valor con su IC', type: 'check', def: true },
    { k: 'dec', label: 'Decimales de la anotación', type: 'number', def: 2 },
    { k: 'annotate', label: 'Anotación de valores con IC', type: 'select', opts: [['last', 'Solo el último punto'], ['all', 'Todos los puntos'], ['none', 'Ninguna']], def: 'last' },
  ],
  tables: [
    { k: 'panels', label: 'Paneles', help: 'Marcas X = tiempos que se rotulan (y en que se muestra el número en riesgo), separados por coma.', cols: [
      { k: 'id', label: 'Panel', type: 'text', w: 50 }, { k: 'title', label: 'Título', type: 'text', w: 300 }, { k: 'ylab', label: 'Título eje Y', type: 'text', w: 200 }, { k: 'ymin', label: 'Y mín.', type: 'num', w: 60 }, { k: 'ymax', label: 'Y máx.', type: 'num', w: 60 },
      { k: 'ystep', label: 'Paso Y', type: 'num', w: 60 }, { k: 'xlab', label: 'Título eje X', type: 'text', w: 90 }, { k: 'xticks', label: 'Marcas X', type: 'text', w: 140 }, { k: 'ref', label: 'Línea de ref.', type: 'num', w: 70 }, { k: 'vline', label: 'Línea vertical en X', type: 'num', w: 80 }, { k: 'vtext', label: 'Texto de la línea vertical', type: 'text', w: 140 }, { k: 'risk', label: 'No. en riesgo', type: 'select', opts: ['sí', 'no'], w: 80 }] },
    { k: 'series', label: 'Series', cols: [
      { k: 'name', label: 'Serie', type: 'text', w: 130 }, { k: 'color', label: 'Color', type: 'color', w: 90 }, { k: 'marker', label: 'Marcador', type: 'select', opts: ['square', 'triangle', 'circle', 'diamond', 'none'], w: 90 },
      { k: 'labelPos', label: 'Etiqueta', type: 'select', opts: ['below', 'above', 'right', 'none'], w: 80 }, { k: 'endText', label: 'Anotación final (vacío = automática; none = ninguna)', type: 'text', w: 230 }] },
    { k: 'points', label: 'Puntos', help: 'Una fila por serie y tiempo. n en riesgo es opcional.', cols: [
      { k: 'panel', label: 'Panel', type: 'text', w: 50 }, { k: 'series', label: 'Serie', type: 'text', w: 120 }, { k: 'x', label: 'Tiempo', type: 'num', w: 70 }, { k: 'y', label: 'Valor', type: 'num', w: 70 }, { k: 'lo', label: 'IC inf.', type: 'num', w: 70 }, { k: 'hi', label: 'IC sup.', type: 'num', w: 70 }, { k: 'nrisk', label: 'n en riesgo', type: 'num', w: 80 }] },
  ],
  example() {
    const wk = [0, 4, 13, 26, 39], mk = (panel, series, ys, los, his, nr) => wk.map((x, i) => ({ panel, series, x, y: ys[i], lo: los[i], hi: his[i], nrisk: nr[i] }));
    return {
      settings: {},
      tables: {
        panels: [{ id: 'A', title: 'GMR of 24-Hr Urinary Protein-to-Creatinine Ratio Relative to Baseline', ylab: 'GMR Relative to Baseline', ymin: 0, ymax: 1.2, ystep: 0.2, xlab: 'Week', xticks: '0,4,13,26,39', ref: 1, risk: 'sí' },
          { id: 'B', title: 'Absolute Mean Value of 24-Hr Urinary Protein-to-Creatinine Ratio', ylab: '24-Hr Urinary Protein-to-Creatinine Ratio', ymin: 0, ymax: 1.8, ystep: 0.2, xlab: 'Week', xticks: '0,4,13,26,39', ref: '', risk: 'sí' }],
        series: [{ name: 'Placebo', color: '#8E8E8E', marker: 'triangle', labelPos: 'below', endText: '' }, { name: 'Drug A', color: '#00729E', marker: 'square', labelPos: 'below', endText: '' }],
        points: [...mk('A', 'Placebo', [1, 1.02, 0.93, 0.92, 0.91], [1, 0.95, 0.86, 0.83, 0.81], [1, 1.09, 1.01, 1.02, 1.02], [160, 159, 154, 137, 121]), ...mk('A', 'Drug A', [1, 0.82, 0.62, 0.48, 0.41], [1, 0.77, 0.57, 0.43, 0.37], [1, 0.88, 0.67, 0.52, 0.46], [160, 160, 159, 156, 153]),
          ...mk('B', 'Placebo', [1.56, 1.61, 1.46, 1.38, 1.29], [1.42, 1.44, 1.30, 1.23, 1.16], [1.70, 1.77, 1.62, 1.52, 1.43], [160, 159, 154, 137, 121]), ...mk('B', 'Drug A', [1.44, 1.23, 1.0, 0.83, 0.74], [1.32, 1.11, 0.88, 0.72, 0.64], [1.56, 1.34, 1.11, 0.94, 0.83], [160, 160, 159, 156, 153])],
      },
    };
  },
  render(st, o) {
    const S = { aspect: 0.4, errbars: true, autoEnd: true, dec: 2, ...st.settings }, T_ = st.tables;
    const panels = (T_.panels || []).filter(p => String(p.id ?? '').trim() || (T_.points || []).some(r => r.panel === p.id)).map(p => {
      const pts = (T_.points || []).filter(r => String(r.panel) === String(p.id));
      const names = (T_.series || []).map(s => s.name).filter(Boolean), used = [...new Set(pts.map(r => r.series))];
      const sers = [...names, ...used.filter(u => !names.includes(u))];
      const xt = split(p.xticks), allx = pts.map(r => num(r.x)).filter(isFinite), ys = pts.flatMap(r => [num(r.y), num(r.lo), num(r.hi)]).filter(isFinite);
      const ymin = isFinite(num(p.ymin)) ? num(p.ymin) : Math.min(0, ...ys), ymax = isFinite(num(p.ymax)) ? num(p.ymax) : Math.max(...ys, 1);
      const ticks = xt.length ? xt : [...new Set(allx)].sort((a, b) => a - b);
      const series = sers.map((n, i) => {
        const def = (T_.series || []).find(s => s.name === n) || {};
        return { name: n, color: def.color || (o.line || o.pal)[i % (o.line || o.pal).length], marker: def.marker || ['square', 'triangle', 'circle', 'diamond'][i % 4], labelPos: S.annotate === 'all' ? 'right' : (def.labelPos || 'below'), endText: def.endText || '', errbars: S.errbars, step: false,
          pts: pts.filter(r => r.series === n).map(r => ({ x: num(r.x), y: num(r.y), lo: num(r.lo), hi: num(r.hi) })) };
      });
      const risk = String(p.risk ?? 'sí') !== 'no' && pts.some(r => isFinite(num(r.nrisk))) ? series.map(s => ({ name: s.name, vals: ticks.map(t => { const r = pts.find(q => q.series === s.name && num(q.x) === t); return r && isFinite(num(r.nrisk)) ? num(r.nrisk) : ''; }) })) : [];
      return { id: p.id, title: p.title, ylab: p.ylab, ymin, ymax, ystep: num(p.ystep), xlab: p.xlab, xticks: ticks, xmin: ticks.length ? Math.min(...ticks) : 0, xmax: ticks.length ? Math.max(...ticks) + (Math.max(...ticks) - Math.min(...ticks)) * 0.03 : 1, ref: num(p.ref), vline: num(p.vline), vtext: p.vtext, series, risk };
    });
    if (!panels.length) return svgRoot(o.W, 120, T(20, 60, 'Añada un panel y sus puntos.', { fs: o.fs }), { fs: o.fs, frame: o.frame });
    return drawCurves(panels, o, S);
  },
};
