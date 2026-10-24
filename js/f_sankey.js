// Diagrama de flujo proporcional (Sankey / aluvial): trayectorias de pacientes a lo largo de varias etapas.
import { T, L, R, num, fmt, textW, svgRoot, colOf, rowsOf, uniq, empty, lum, split, INK, FRAME } from './kit.js?v=2026.10.24-2';

export const sankey = {
  id: 'sankey', name: 'Flujo de pacientes (Sankey / aluvial)', short: 'Sankey',
  desc: 'Trayectorias entre etapas (p. ej., estadio de ERC basal → 12 meses → desenlace): el ancho de cada banda es proporcional al número de pacientes.',
  settings: [
    { k: 'stages', label: 'Nombre de las etapas (separadas por coma)', type: 'text', def: 'Baseline,Week 26,Week 52' }, { k: 'colorBy', label: 'Color de las bandas', type: 'select', opts: [['source', 'Según el nodo de origen'], ['first', 'Según la primera etapa']], def: 'first' },
    { k: 'pct', label: 'Mostrar porcentaje en las etiquetas', type: 'check', def: true }, { k: 'title', label: 'Título', type: 'text', def: 'Patient Flow Across CKD Stages' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' }, { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.55, step: 0.05 },
  ],
  tables: [{ k: 'paths', label: 'Trayectorias', help: 'Una fila por trayectoria: el nodo en cada etapa (deje vacío si ya no hay dato) y el número de pacientes.', cols: [{ k: 's1', label: 'Etapa 1', type: 'text', w: 120 }, { k: 's2', label: 'Etapa 2', type: 'text', w: 120 }, { k: 's3', label: 'Etapa 3', type: 'text', w: 120 }, { k: 's4', label: 'Etapa 4', type: 'text', w: 120 }, { k: 'n', label: 'N', type: 'num', w: 70 }] }],
  example() { const P = [['Stage 2', 'Stage 2', 'Stage 2', 42], ['Stage 2', 'Stage 2', 'Stage 3', 18], ['Stage 2', 'Stage 3', 'Stage 3', 9], ['Stage 3', 'Stage 2', 'Stage 2', 11], ['Stage 3', 'Stage 3', 'Stage 3', 58], ['Stage 3', 'Stage 3', 'Stage 4', 21], ['Stage 3', 'Stage 4', 'Stage 4', 8], ['Stage 4', 'Stage 4', 'Stage 4', 24], ['Stage 4', 'Stage 4', 'Kidney failure', 14], ['Stage 4', 'Kidney failure', 'Kidney failure', 9]]; return { settings: {}, tables: { paths: P.map(([s1, s2, s3, n]) => ({ s1, s2, s3, s4: '', n })) } }; },
  render(st, o) {
    const S = { stages: '', colorBy: 'first', pct: true, aspect: 0.55, ...st.settings }, fs = o.fs, W = o.W, P = rowsOf(st, 'paths').map(r => ({ s: [r.s1, r.s2, r.s3, r.s4].map(x => String(x ?? '').trim()), n: num(r.n) })).filter(r => r.n > 0);
    const K = Math.max(0, ...P.map(r => r.s.reduce((a, x, i) => (x ? i + 1 : a), 0))); if (!P.length || K < 2) return empty(o, 'Añada trayectorias con al menos dos etapas.');
    const names = split(S.stages), nodes = Array.from({ length: K }, (_, k) => { const m = new Map(); P.forEach(r => { if (r.s[k]) m.set(r.s[k], (m.get(r.s[k]) || 0) + r.n); }); return [...m].map(([name, v]) => ({ name, v })); });
    const order = uniq(P.flatMap(r => r.s.filter(Boolean))); nodes.forEach(col => col.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)));
    const colorOf = n => colOf(o, order.indexOf(n)), pad = fs, top = fs * (S.title ? 3.4 : 2) + fs, H = W * S.aspect * 0.8, nw = fs * 0.9, gap = fs * 0.9, labW = Math.max(...nodes.flat().map(n => textW(`${n.name} ${S.pct ? '(100%)' : ''}`, fs))) + fs * 1.5;
    const totals = nodes.map(c => c.reduce((a, n) => a + n.v, 0)), maxN = Math.max(...nodes.map(c => c.length)), sc = (H - (maxN - 1) * gap) / Math.max(...totals), x0 = pad + labW * 0.6, x1 = W - pad - labW * 0.9, xs = Array.from({ length: K }, (_, k) => x0 + (x1 - x0 - nw) * k / (K - 1));
    let body = (S.id ? T(pad, fs * 1.55, S.id, { fs: fs * 1.3, bold: true }) : '') + (S.title ? T(pad + (S.id ? fs * 1.9 : 0), fs * 1.5, S.title, { fs, bold: true }) : '');
    nodes.forEach((col, k) => { let y = top + (H - (col.reduce((a, n) => a + n.v * sc, 0) + (col.length - 1) * gap)) / 2; col.forEach(n => { n.y = y; n.h = n.v * sc; n.outY = n.y; n.inY = n.y; y += n.h + gap; }); });
    const find = (k, name) => nodes[k].find(n => n.name === name);
    for (let k = 0; k < K - 1; k++) { const fl = new Map(); P.forEach(r => { if (r.s[k] && r.s[k + 1]) { const key = `${r.s[k]}\u0001${r.s[k + 1]}\u0001${r.s[0]}`; fl.set(key, (fl.get(key) || 0) + r.n); } });
      const list = [...fl].map(([key, v]) => { const [a, b, f] = key.split('\u0001'); return { a: find(k, a), b: find(k + 1, b), v, f }; }).sort((p, q) => nodes[k].indexOf(p.a) - nodes[k].indexOf(q.a) || nodes[k + 1].indexOf(p.b) - nodes[k + 1].indexOf(q.b) || order.indexOf(p.f) - order.indexOf(q.f));
      for (const f of list) { const h = f.v * sc, ya = f.a.outY, yb = f.b.inY, xa = xs[k] + nw, xb = xs[k + 1], mx = (xa + xb) / 2; f.a.outY += h; f.b.inY += h;
        body += `<path d="M${xa},${ya}C${mx},${ya} ${mx},${yb} ${xb},${yb}L${xb},${yb + h}C${mx},${yb + h} ${mx},${ya + h} ${xa},${ya + h}Z" fill="${S.colorBy === 'first' ? colorOf(f.f) : colorOf(f.a.name)}" fill-opacity="0.42"/>`; } }
    nodes.forEach((col, k) => { const tot = totals[k]; col.forEach(n => { body += R(xs[k], n.y, nw, n.h, { fill: colorOf(n.name) }); const lab = `${n.name}${S.pct ? ` (${fmt(100 * n.v / tot, 0)}%)` : ''}`, right = k > 0; body += T(right ? xs[k] + nw + fs * 0.5 : xs[k] - fs * 0.5, n.y + n.h / 2 + fs * 0.35, lab, { fs, anchor: right ? 'start' : 'end', bold: true }).replace('<text ', '<text style="paint-order:stroke;stroke:#fff;stroke-width:3.4px;stroke-linejoin:round" '); }); body += T(xs[k] + nw / 2, top - fs * 0.7, names[k] || `Etapa ${k + 1}`, { fs, anchor: 'middle', bold: true }); });
    return svgRoot(W, top + H + fs * 1.2, body, { fs, frame: o.frame });
  },
};
