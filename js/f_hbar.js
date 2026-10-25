// Barras horizontales: apiladas (porcentajes o frecuencias), agrupadas o de una serie, con etiquetas directas, cuadrícula suave y leyenda arriba o abajo.
import { T, L, R, num, fmt, textW, wrap, svgRoot, lum, niceTicks, INK, FRAME } from './svg.js?v=2026.10.25-2';

const COLS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
export const hbar = {
  id: 'hbar', name: 'Barras horizontales (apiladas, agrupadas o simples)', short: 'Barras horiz.',
  desc: 'Una barra por categoría con hasta 6 series apiladas o agrupadas, valores sobre las barras, borde opcional (estilo RevMan), cuadrícula suave y leyenda arriba o abajo.',
  settings: [
    { k: 'letter', label: 'Letra del panel', type: 'text', def: 'A' },
    { k: 'title', label: 'Título', type: 'text', def: 'Awareness and use of AI chatbots (all participants)' },
    { k: 'xlab', label: 'Título del eje X', type: 'text', def: 'Students (%)' },
    { k: 'mode', label: 'Tipo', type: 'select', opts: [['stack', 'Apiladas'], ['group', 'Agrupadas'], ['single', 'Una serie']], def: 'stack' },
    { k: 'normalize', label: 'Normalizar cada barra a 100 % (apiladas)', type: 'check', def: false },
    { k: 'xmax', label: 'Máximo del eje (vacío = automático)', type: 'number', def: 100 },
    { k: 'step', label: 'Separación entre marcas del eje', type: 'number', def: 20 },
    { k: 'unit', label: 'Sufijo de los valores', type: 'text', def: '%' },
    { k: 'dec', label: 'Decimales', type: 'number', def: 1 },
    { k: 'labels', label: 'Valores sobre las barras', type: 'select', opts: [['first', 'Solo la 1.ª serie'], ['all', 'Todos los segmentos'], ['none', 'Ninguno']], def: 'first' },
    { k: 'sort', label: 'Orden de las barras', type: 'select', opts: [['none', 'Orden de la tabla'], ['desc', 'Por la 1.ª serie (mayor primero)'], ['asc', 'Por la 1.ª serie (menor primero)']], def: 'none' },
    { k: 'outline', label: 'Borde de las barras', type: 'select', opts: [['none', 'Sin borde'], ['black', 'Negro fino (estilo RevMan)']], def: 'none' },
    { k: 'grid', label: 'Cuadrícula vertical suave', type: 'check', def: true },
    { k: 'legendPos', label: 'Leyenda', type: 'select', opts: [['top', 'Arriba'], ['bottom', 'Abajo'], ['none', 'Sin leyenda']], def: 'top' },
    { k: 'barH', label: 'Alto de barra (× tamaño de letra)', type: 'number', def: 2.2, step: 0.1 },
  ],
  tables: [
    { k: 'series', label: 'Series (orden = orden de los segmentos)', cols: [{ k: 'name', label: 'Serie', type: 'text', w: 260 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'data', label: 'Datos', help: 'Una fila por barra; «Valor 1…6» siguen el orden de las series. Deje vacío lo que no se use.', cols: [{ k: 'label', label: 'Barra', type: 'text', w: 230 }, ...COLS.map((c, i) => ({ k: c, label: `Valor ${i + 1}`, type: 'num', w: 80 }))] },
  ],
  example() {
    const rows = [['ChatGPT', 50.4, 34.3, 15.3], ['Bing Chat', 6.2, 17.1, 76.7], ['You.com', 4.0, 9.7, 86.3], ['Perplexity', 3.8, 9.4, 86.8], ['Copy.ai', 2.7, 12.3, 85.0], ['Bard', 2.2, 8.6, 89.2], ['Consensus', 1.9, 11.0, 87.1], ['Elicit', 1.7, 7.2, 91.1]];
    return { settings: {}, tables: { series: [{ name: 'Have used it', color: '#1F5FA8' }, { name: 'Aware of it, not used', color: '#85B6EE' }, { name: 'Unaware of it', color: '#E6E4DE' }], data: rows.map(([label, a, b, c]) => ({ label, v1: a, v2: b, v3: c, v4: '', v5: '', v6: '' })) } };
  },
  render(st, o) {
    const S = { letter: '', title: '', xlab: '', mode: 'stack', normalize: false, xmax: '', step: 20, unit: '', dec: 1, labels: 'first', sort: 'none', outline: 'none', grid: true, legendPos: 'top', barH: 2.2, ...st.settings }, fs = o.fs, W = o.W, pad = fs, lh = 1.22;
    const series = (st.tables.series || []).map((s, i) => ({ name: String(s.name ?? '').trim(), color: s.color || o.pal[i % o.pal.length], i })).filter(s => s.name).slice(0, 6);
    let data = (st.tables.data || []).filter(r => String(r.label ?? '').trim()).map(r => ({ label: String(r.label), v: series.map(s => num(r[COLS[s.i]])) }));
    if (!series.length || !data.length) return svgRoot(W, 120, T(20, 60, 'Defina las series y los datos.', { fs }), { fs, frame: o.frame });
    const mode = S.mode === 'single' ? 'single' : S.mode, ns = mode === 'single' ? 1 : series.length;
    if (S.sort !== 'none') data = [...data].sort((a, b) => (S.sort === 'desc' ? 1 : -1) * ((b.v[0] || 0) - (a.v[0] || 0)));
    data.forEach(d => { if (mode === 'stack' && S.normalize) { const t = d.v.reduce((a, b) => a + (isFinite(b) ? b : 0), 0) || 1; d.v = d.v.map(v => (isFinite(v) ? v / t * 100 : 0)); } });
    const maxV = mode === 'stack' ? Math.max(...data.map(d => d.v.reduce((a, b) => a + (isFinite(b) ? b : 0), 0))) : Math.max(...data.flatMap(d => d.v.slice(0, ns).filter(isFinite)), 0);
    const xmax = isFinite(num(S.xmax)) ? num(S.xmax) : (mode === 'stack' && S.normalize ? 100 : niceTicks(0, maxV * 1.05, 5).pop()), step = num(S.step) > 0 ? num(S.step) : niceTicks(0, xmax, 5)[1] || xmax / 5, dec = +S.dec || 0;
    const labW = Math.max(...data.map(d => textW(d.label, fs)), 10), x0 = pad + labW + fs * 1.4, pw = W - x0 - pad - fs * 1.6, sx = v => x0 + Math.min(v, xmax) / xmax * pw, bh = fs * S.barH, rowGap = fs * (mode === 'group' ? 1.1 : 0.9), grpH = mode === 'group' ? ns * bh * 0.78 : bh;
    const sw = S.outline === 'black' ? { stroke: '#000', sw: 1 } : { stroke: '#fff', sw: 1.4 };
    let y = pad * 0.6, body = '';
    if (S.letter) body += T(pad, y + fs * 1.3, S.letter, { fs: fs * 1.6, bold: true });
    if (S.title) body += T(pad + (S.letter ? fs * 2.4 : 0), y + fs * 1.15, S.title, { fs });
    y += S.title || S.letter ? fs * 2.1 : 0;
    const legend = (yy) => { let lx = pad + (S.letter ? fs * 2.4 : fs * 0.3), ly = yy, s = ''; series.slice(0, mode === 'single' ? 1 : 6).forEach(sr => { const w = textW(sr.name, fs) + fs * 3; if (lx + w > W - pad && lx > pad + fs * 3) { lx = pad + fs * 0.3; ly += fs * 1.6; } s += R(lx, ly - fs * 0.75, fs * 1.4, fs * 0.9, { fill: sr.color, stroke: S.outline === 'black' ? '#000' : 'none', sw: 1 }) + T(lx + fs * 1.9, ly, sr.name, { fs }); lx += w; }); return { s, y: ly + fs * 1.1 }; };
    if (S.legendPos === 'top' && mode !== 'single') { const lg = legend(y + fs * 0.4); body += lg.s; y = lg.y; }
    const top = y + fs * 0.3, nb = data.length, H0 = nb * (grpH + rowGap) - rowGap, bot = top + H0 + fs * 0.9;
    if (S.grid) for (let v = step; v <= xmax + 1e-9; v += step) body += L(sx(v), top - fs * 0.3, sx(v), bot, { w: 0.9, c: '#E4E4E1' });
    data.forEach((d, i) => {
      const yy = top + i * (grpH + rowGap);
      body += T(x0 - fs * 0.9, yy + grpH / 2 + fs * 0.35, d.label, { fs, anchor: 'end' }) + L(x0 - fs * 0.45, yy + grpH / 2, x0, yy + grpH / 2, { w: 1.2, c: '#777' });
      if (mode === 'stack') {
        let cum = 0; d.v.forEach((v, k) => { if (!isFinite(v) || v <= 0 || k >= series.length) return; const xa = sx(cum), xb = sx(cum + v), w = xb - xa; cum += v; body += R(xa, yy, w, bh, { fill: series[k].color, ...sw });
          const lab = fmt(v, dec) + S.unit, show = S.labels === 'all' || (S.labels === 'first' && k === 0), fits = w > textW(lab, fs, true) + fs * 0.8;
          if (show && fits) body += T(xa + w - fs * 0.45, yy + bh / 2 + fs * 0.35, lab, { fs, bold: true, anchor: 'end', fill: lum(series[k].color) < 0.5 ? '#fff' : INK });
          else if (show && S.labels === 'first' && k === 0) { const nx = d.v.slice(1).findIndex(q => isFinite(q) && q > 0); if (nx >= 0) body += T(xb + fs * 0.4, yy + bh / 2 + fs * 0.35, lab, { fs, bold: true }); } });
      } else {
        const sub = bh * 0.78; (mode === 'single' ? [0] : d.v.map((_, k) => k).slice(0, ns)).forEach((k, q) => { const v = d.v[k]; if (!isFinite(v)) return; const yb = yy + q * sub, w = sx(v) - sx(0); body += R(x0, yb, w, sub * 0.92, { fill: series[k].color, ...sw });
          if (S.labels !== 'none') body += T(x0 + w + fs * 0.4, yb + sub * 0.46 + fs * 0.35, fmt(v, dec) + S.unit, { fs, bold: true }); });
      }
    });
    body += L(x0, top - fs * 0.3, x0, bot, { w: 1.2, c: '#9A9A96' }) + L(x0, bot, x0 + pw, bot, { w: 1.2, c: '#9A9A96' });
    for (let v = 0; v <= xmax + 1e-9; v += step) body += L(sx(v), bot, sx(v), bot + 5, { w: 1.2, c: '#555' }) + T(sx(v), bot + 5 + fs * 1.2, fmt(v, step < 1 ? 1 : 0), { fs, anchor: 'middle', fill: '#444' });
    let yEnd = bot + 5 + fs * 1.2;
    if (S.xlab) { body += T(x0 + pw / 2, yEnd + fs * 1.6, S.xlab, { fs, anchor: 'middle' }); yEnd += fs * 2.0; }
    if (S.legendPos === 'bottom' && mode !== 'single') { const lg = legend(yEnd + fs * 1.8); body += lg.s; yEnd = lg.y; }
    return svgRoot(W, yEnd + fs * 1.0, body, { fs, frame: o.frame });
  },
};
