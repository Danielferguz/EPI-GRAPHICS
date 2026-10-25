// Figura compuesta: reúne varias figuras ya creadas en una cuadrícula con letras de panel (A, B, C…) y marco, como en las figuras de varios paneles de las revistas.
import { T, L, R, num, svgRoot, rowsOf, empty, INK, FRAME } from './kit.js?v=2026.10.25-2';

export const compose = {
  id: 'compose', name: 'Figura compuesta (varios paneles)', short: 'Compuesta', composite: true,
  desc: 'Combina las demás plantillas (con los datos que haya cargado en cada una) en una sola figura con paneles A, B, C…, columnas de ancho variable y separadores grises.',
  settings: [{ k: 'cols', label: 'Columnas de la cuadrícula', type: 'number', def: 2 }, { k: 'letters', label: 'Letras de panel', type: 'select', opts: [['auto', 'Automáticas (A, B, C…)'], ['none', 'Sin letras añadidas']], def: 'auto' }, { k: 'rules', label: 'Separadores grises entre paneles', type: 'check', def: true }],
  tables: [{ k: 'panels', label: 'Paneles (en orden de lectura)', help: 'Elija la plantilla de cada panel y cuántas columnas ocupa. Edite el contenido de cada una en su propia plantilla.', cols: [{ k: 'fig', label: 'Plantilla', type: 'select', opts: ['curves', 'km', 'bars', 'forest', 'stacked', 'flow', 'schema', 'dist', 'scatter', 'rank', 'time', 'part', 'radar', 'ba', 'meta', 'heat', 'sankey'], w: 160 }, { k: 'span', label: 'Columnas que ocupa', type: 'num', w: 100 }] }],
  example() { return { settings: {}, tables: { panels: [{ fig: 'curves', span: 2 }, { fig: 'dist', span: 1 }, { fig: 'part', span: 1 }] } }; },
  render(st, o) {
    const S = { cols: 2, letters: 'auto', rules: true, ...st.settings }, panels = rowsOf(st, 'panels'), cols = Math.max(1, Math.min(4, Math.round(+S.cols) || 2)); if (!panels.length || !o.sub) return empty(o, 'Añada paneles a la figura compuesta.');
    const fs = o.fs, W = o.W; let x = 0, y = 0, rowH = 0, body = '', k = 0; const rows = [], pos = [];
    for (const p of panels) { const span = Math.max(1, Math.min(cols, Math.round(num(p.span)) || 1)); if (x + span > cols) { rows.push(rowH); y += rowH; x = 0; rowH = 0; }
      const w = W * span / cols, letter = S.letters === 'auto' ? String.fromCharCode(65 + k) : '', svg = o.sub(String(p.fig), w, letter); if (!svg) continue; k++;
      const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg), h = m ? +m[2] * (w / +m[1]) : 0, px = W * x / cols; body += svg.replace(/^<svg /, `<svg x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `); rowH = Math.max(rowH, h); pos.push({ px, y, w, h }); x += span; }
    rows.push(rowH); const Hh = y + rowH;
    // las celdas de una fila se estiran hasta la altura de la fila: separadores
    if (S.rules && o.frame) { let yy = 0; rows.forEach((h, i) => { yy += h; if (i < rows.length - 1) body += L(0, yy, W, yy, { w: 3, c: FRAME }); }); const rowTop = [0]; rows.forEach(h => rowTop.push(rowTop.at(-1) + h)); pos.forEach(q => { const ri = rowTop.findIndex(t => Math.abs(t - q.y) < 1e-6); if (q.px > 1 && ri >= 0) body += L(q.px, q.y, q.px, q.y + rows[ri], { w: 3, c: FRAME }); }); }
    return svgRoot(W, Hh, body, { fs, frame: o.frame });
  },
};
