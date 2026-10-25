// Barras apiladas horizontales (distribución de categorías ordinales, p. ej. escala mRS, Likert, estadios de ERC).
import { T, L, R, num, fmt, textW, wrap, tickLabel, svgRoot, lum, INK, FRAME } from './svg.js?v=2026.10.25-2';

export const stacked = {
  id: 'stacked', name: 'Barras apiladas (distribución ordinal)', short: 'Apiladas',
  desc: 'Distribución porcentual de categorías (escala ordinal) por grupo, con leyenda y valores dentro de los segmentos.',
  settings: [
    { k: 'normalize', label: 'Normalizar cada barra a 100 %', type: 'check', def: true },
    { k: 'inside', label: 'Mostrar valores dentro de los segmentos', type: 'check', def: true },
    { k: 'dec', label: 'Decimales', type: 'number', def: 0 },
    { k: 'barH', label: 'Alto de barra (× tamaño de letra)', type: 'number', def: 2.2, step: 0.1 },
    { k: 'legendTitle', label: 'Título de la leyenda', type: 'text', def: '' },
  ],
  tables: [
    { k: 'panels', label: 'Paneles', cols: [{ k: 'id', label: 'Panel', type: 'text', w: 54 }, { k: 'title', label: 'Título', type: 'text', w: 360 }, { k: 'xlab', label: 'Título del eje X', type: 'text', w: 200 }] },
    { k: 'cats', label: 'Categorías (orden = orden de los segmentos)', cols: [{ k: 'name', label: 'Categoría', type: 'text', w: 220 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'data', label: 'Datos', help: 'Una fila por grupo y categoría (formato largo). Se admiten porcentajes o frecuencias.', cols: [{ k: 'panel', label: 'Panel', type: 'text', w: 54 }, { k: 'group', label: 'Grupo', type: 'text', w: 220 }, { k: 'cat', label: 'Categoría', type: 'text', w: 220 }, { k: 'value', label: 'Valor', type: 'num', w: 80 }] },
  ],
  example() {
    const cats = ['No symptoms', 'Mild', 'Moderate', 'Severe', 'Kidney failure'], d = { 'Drug A': [14, 31, 30, 17, 8], Placebo: [8, 24, 32, 23, 13] }, e = { 'Drug A': [22, 35, 25, 12, 6], Placebo: [15, 30, 29, 18, 8] };
    const rows = []; for (const [pn, dd] of [['A', d], ['B', e]]) for (const g of Object.keys(dd)) cats.forEach((c, i) => rows.push({ panel: pn, group: g, cat: c, value: dd[g][i] }));
    return { settings: {}, tables: { panels: [{ id: 'A', title: 'Symptom Burden at Week 12', xlab: 'Percentage of Patients' }, { id: 'B', title: 'Symptom Burden at Week 24', xlab: 'Percentage of Patients' }], cats: cats.map(name => ({ name, color: '' })), data: rows } };
  },
  render(st, o) {
    const S = { normalize: true, inside: true, dec: 0, barH: 2.2, legendTitle: '', ...st.settings }, fs = o.fs, W = o.W, pad = fs, lh = 1.22;
    const cats = (st.tables.cats || []).map(c => c.name).filter(Boolean), colors = cats.map((c, i) => (st.tables.cats.find(x => x.name === c)?.color) || o.pal[i % o.pal.length]);
    const panels = (st.tables.panels || []).filter(p => String(p.id ?? '').trim() || (st.tables.data || []).some(r => r.panel === p.id));
    if (!panels.length || !cats.length) return svgRoot(W, 120, T(20, 60, 'Defina las categorías y los datos.', { fs }), { fs, frame: o.frame });
    let y = 0, body = '';
    panels.forEach((p, pi) => {
      const data = (st.tables.data || []).filter(r => String(r.panel) === String(p.id)), groups = [...new Set(data.map(r => r.group))];
      const gl = groups.map(g => wrap(String(g), W * 0.24, fs, true)), labW = Math.max(...gl.map(a => Math.max(...a.map(l => textW(l, fs, true)))), 10);
      const ax = pad + labW + fs * 1.2, plotW = W - ax - pad - fs * 0.8, bh = fs * S.barH, rowGap = fs * 1.1, tl = wrap(String(p.title ?? ''), W - 2 * pad - fs * 1.8, fs, true);
      const titleH = Math.max(1, tl.length) * fs * lh + fs * 0.8, top = y + titleH + fs * 0.6;
      body += T(pad, y + fs * 1.55, String(p.id ?? ''), { fs: fs * 1.3, bold: true }) + T(pad + (p.id ? fs * 1.9 : 0), y + fs * 1.5, tl, { fs, bold: true });
      groups.forEach((g, gi) => {
        const rows = cats.map(c => num(data.find(r => r.group === g && r.cat === c)?.value) || 0), tot = rows.reduce((a, b) => a + b, 0) || 1, yy = top + gi * (bh + rowGap);
        let x = ax;
        rows.forEach((v, ci) => {
          const pc = S.normalize ? v / tot * 100 : v, w = plotW * pc / 100;
          if (w <= 0) return;
          body += R(x, yy, w, bh, { fill: colors[ci], stroke: '#fff', sw: 1.2 });
          const lab = fmt(pc, +S.dec || 0), dark = lum(colors[ci]) < 0.45;
          if (S.inside && w > textW(lab, fs) + 6) body += T(x + w / 2, yy + bh / 2 + fs * 0.35, lab, { fs, anchor: 'middle', fill: dark ? '#fff' : INK });
          x += w;
        });
        body += T(ax - fs * 0.8, yy + bh / 2 - (gl[gi].length - 1) * fs * lh / 2 + fs * 0.35, gl[gi], { fs, bold: true, anchor: 'end' });
      });
      const bot = top + groups.length * (bh + rowGap) - rowGap, axY = bot + fs * 0.9;
      body += L(ax, axY, ax + plotW, axY, { w: 1.4 });
      for (let v = 0; v <= 100; v += 20) body += L(ax + plotW * v / 100, axY, ax + plotW * v / 100, axY + 6, { w: 1.4 }) + T(ax + plotW * v / 100, axY + 6 + fs * 1.15, String(v), { fs, anchor: 'middle' });
      if (p.xlab) body += T(ax + plotW / 2, axY + 6 + fs * 3.0, p.xlab, { fs, bold: true, anchor: 'middle' });
      y = axY + 6 + fs * (p.xlab ? 4.0 : 2.4);
      if (pi < panels.length - 1) { if (o.frame) body += L(0, y, W, y, { w: 3, c: FRAME }); y += 1; }
    });
    // leyenda
    let lx = pad + fs * 0.3, ly = y + fs * 1.4;
    if (S.legendTitle) { body += T(lx, ly, S.legendTitle, { fs, bold: true }); ly += fs * 1.6; }
    cats.forEach((c, i) => { const w = textW(c, fs) + fs * 2.4; if (lx + w > W - pad && lx > pad + fs) { lx = pad + fs * 0.3; ly += fs * 1.6; } body += R(lx, ly - fs * 0.8, fs * 0.9, fs * 0.9, { fill: colors[i] }) + T(lx + fs * 1.3, ly, c, { fs }); lx += w; });
    return svgRoot(W, ly + fs * 1.0, body, { fs, frame: o.frame });
  },
};
