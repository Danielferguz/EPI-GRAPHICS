// Barras con corchetes de comparación (estilo NEJM: porcentaje de pacientes por grupo, OR/RR y valor p sobre los corchetes).
import { T, L, R, esc, num, fmt, minus, textW, wrap, lines, niceTicks, tickLabel, fmtTicks, svgRoot, INK, FRAME } from './svg.js?v=2026.10.25-1';

const A = (id, o = {}) => ({ id, ...o });
export const bars = {
  id: 'bars', name: 'Barras con comparaciones', short: 'Barras',
  desc: 'Porcentaje (o media) por grupo con corchetes que muestran OR, RR, diferencia y valor p. Uno o varios paneles (A, B…).',
  settings: [
    { k: 'layout', label: 'Disposición de paneles', type: 'select', opts: [['row', 'Lado a lado'], ['col', 'Apilados']], def: 'row' },
    { k: 'aspect', label: 'Altura del área de barras (proporción del ancho)', type: 'number', def: 0.5, step: 0.05 },
    { k: 'barW', label: 'Ancho de las barras (% del espacio)', type: 'number', def: 52 },
    { k: 'showVal', label: 'Mostrar el valor sobre cada barra', type: 'check', def: true },
    { k: 'dec', label: 'Decimales del valor', type: 'number', def: 0 },
    { k: 'suffix', label: 'Sufijo del valor (p. ej. %)', type: 'text', def: '' },
  ],
  tables: [
    { k: 'panels', label: 'Paneles', help: 'Una fila por panel. Escala del eje Y: mínimo, máximo y paso de las marcas.', cols: [
      { k: 'id', label: 'Panel', type: 'text', w: 54 }, { k: 'title', label: 'Título del panel', type: 'text', w: 330 }, { k: 'ylab', label: 'Título del eje Y', type: 'text', w: 200 },
      { k: 'ymin', label: 'Y mín.', type: 'num', w: 64 }, { k: 'ymax', label: 'Y máx.', type: 'num', w: 64 }, { k: 'ystep', label: 'Paso', type: 'num', w: 60 }] },
    { k: 'bars', label: 'Barras', help: 'Use | dentro de la etiqueta para cambiar de línea. Color vacío = paleta automática.', cols: [
      { k: 'panel', label: 'Panel', type: 'text', w: 54 }, { k: 'label', label: 'Etiqueta (use | para saltar de línea)', type: 'text', w: 280 }, { k: 'value', label: 'Valor', type: 'num', w: 70 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'brackets', label: 'Corchetes de comparación', help: 'Barras numeradas 1, 2, 3… dentro de cada panel. El texto admite | para saltar de línea.', cols: [
      { k: 'panel', label: 'Panel', type: 'text', w: 54 }, { k: 'from', label: 'Desde barra', type: 'num', w: 80 }, { k: 'to', label: 'Hasta barra', type: 'num', w: 80 }, { k: 'text', label: 'Texto sobre el corchete', type: 'text', w: 360 }] },
  ],
  example() {
    return {
      settings: {},
      tables: {
        panels: [A('A', { title: 'Complete Remission of Proteinuria at Week 24 (primary end point)', ylab: 'Percentage of Patients', ymin: 0, ymax: 100, ystep: 10 }), A('B', { title: 'Improvement in eGFR Slope with No Worsening of Albuminuria (secondary end point)', ylab: 'Percentage of Patients', ymin: 0, ymax: 100, ystep: 10 })],
        bars: [['A', 'Drug A,|0.5 mg|(N=60)', 22], ['A', 'Drug A,|1 mg|(N=62)', 38], ['A', 'Drug A,|2 mg|(N=59)', 57], ['A', 'Placebo|(N=61)', 15],
          ['B', 'Drug A,|0.5 mg|(N=60)', 41], ['B', 'Drug A,|1 mg|(N=62)', 29], ['B', 'Drug A,|2 mg|(N=59)', 44], ['B', 'Placebo|(N=61)', 31]].map(([panel, label, value]) => A(0, { panel, label, value, color: '' })),
        brackets: [['A', 1, 4, 'Odds ratio, 2.03 (95% CI, 0.84–4.91)'], ['A', 2, 4, 'Odds ratio, 3.65 (95% CI, 1.58–8.44)'], ['A', 3, 4, 'Odds ratio, 7.57|(95% CI, 3.17–17.63)|P<0.001'],
          ['B', 1, 4, 'Odds ratio, 1.55 (95% CI, 0.71–3.37)'], ['B', 2, 4, 'Odds ratio, 0.89 (95% CI, 0.41–1.93)'], ['B', 3, 4, 'Odds ratio, 1.78 (95% CI, 0.82–3.86)|P=0.15']].map(([panel, from, to, text]) => A(0, { panel, from, to, text })),
      },
    };
  },
  render(st, o) {
    const S = { layout: 'row', aspect: 0.5, barW: 52, showVal: true, dec: 0, suffix: '', ...st.settings }, fs = o.fs, W = o.W;
    const panels = (st.tables.panels || []).filter(p => String(p.id ?? '').trim() !== '' || (st.tables.bars || []).some(b => b.panel === p.id));
    if (!panels.length) return svgRoot(W, 120, T(20, 60, 'Añada al menos un panel y sus barras.', { fs }), { fs, frame: o.frame });
    const n = panels.length, row = S.layout !== 'col', pw = row ? W / n : W, pad = fs * 0.9, lh = 1.22;
    const preps = panels.map(p => prep(p, pw));
    function prep(p, pw) {
      const bs = (st.tables.bars || []).filter(b => String(b.panel) === String(p.id) && String(b.label ?? '') !== '' || (String(b.panel) === String(p.id) && isFinite(num(b.value))));
      const ymin = isFinite(num(p.ymin)) ? num(p.ymin) : 0, ymax = isFinite(num(p.ymax)) ? num(p.ymax) : Math.max(100, ...bs.map(b => num(b.value) || 0)), step = num(p.ystep) > 0 ? num(p.ystep) : null;
      const ticks = step ? (() => { const t = []; for (let v = ymin; v <= ymax + step * 1e-6; v += step) t.push(+v.toFixed(8)); return t; })() : niceTicks(ymin, ymax, 5);
      const tickW = Math.max(...fmtTicks(ticks).map(v => textW(v, fs)), 10);
      const axisX = pad + fs * 1.3 + tickW + fs * 0.9, plotW = pw - axisX - pad - fs * 0.5, ph = Math.max(80, pw * S.aspect);
      const slot = plotW / Math.max(bs.length, 1), bw = slot * Math.min(0.95, S.barW / 100);
      const tops = bs.map(b => ph * (1 - ((num(b.value) || 0) - ymin) / ((ymax - ymin) || 1)));
      // corchetes: del más corto al más largo para apilarlos hacia arriba
      const leg = fs * 1.1, labelH = S.showVal ? fs * 1.5 : fs * 0.3;
      const brs = (st.tables.brackets || []).filter(b => String(b.panel) === String(p.id) && isFinite(num(b.from)) && isFinite(num(b.to))).map((b, i) => {
        let a = Math.min(num(b.from), num(b.to)) - 1, e = Math.max(num(b.from), num(b.to)) - 1; a = Math.max(0, a); e = Math.min(bs.length - 1, e);
        const cx = axisX + slot * (a + e + 1) / 2, half = Math.max(fs * 6, Math.min(cx - pad, pw - pad - cx));
        return { a, e, i, cx, ls: wrap(b.text ?? '', half * 2, fs) };
      }).filter(b => b.e >= b.a).sort((x, y) => (x.e - x.a) - (y.e - y.a) || x.i - y.i);
      const placed = [];
      for (const b of brs) {
        const spanTop = Math.min(...tops.slice(b.a, b.e + 1)) - labelH;
        let line = spanTop - fs * 0.6 - leg;
        for (const q of placed) if (q.a <= b.e && b.a <= q.e) line = Math.min(line, q.textTop - fs * 0.5 - leg);
        b.line = line; b.textTop = line - fs * 0.5 - (b.ls.length - 1) * fs * lh - fs * 0.85; placed.push(b);
      }
      const headroom = placed.length ? Math.max(0, -Math.min(...placed.map(b => b.textTop)) + fs * 0.4) : 0;
      const tl = wrap(String(p.title ?? ''), pw - pad * 2 - fs * 1.7, fs, true), hdrH = Math.max(1, tl.length) * fs * lh + fs * 0.9;
      const xl = bs.map(b => wrap(b.label ?? '', slot * 1.02, fs, true)), xlH = Math.max(1, ...xl.map(a => a.length)) * fs * lh + fs * 1.6;
      return { p, bs, ymin, ymax, ticks, tickW, axisX, plotW, ph, slot, bw, tops, brs: placed, headroom, tl, hdrH, xl, xlH };
    }
    const head = Math.max(...preps.map(q => q.hdrH + q.headroom)), xlH = Math.max(...preps.map(q => q.xlH)), ph = preps[0].ph;
    const panelH = head + ph + xlH + fs * 0.4;
    const H = row ? panelH : panelH * n;
    let body = '';
    preps.forEach((q, k) => {
      const px = row ? k * pw : 0, py = row ? 0 : k * panelH, top = py + head;
      body += T(px + pad, py + fs * 1.55, String(q.p.id ?? ''), { fs: fs * 1.3, bold: true });
      body += T(px + pad + (q.p.id ? fs * 1.7 : 0), py + fs * 1.5, q.tl, { fs, bold: true });
      const ax = px + q.axisX, ay = top + q.ph;
      body += L(ax, top, ax, ay, { w: 1.4 });
      const tlab = fmtTicks(q.ticks); q.ticks.forEach((v, ti) => { const y = top + q.ph * (1 - (v - q.ymin) / ((q.ymax - q.ymin) || 1)); body += L(ax - 6, y, ax, y, { w: 1.4 }) + T(ax - 10, y + fs * 0.35, tlab[ti], { fs, anchor: 'end' }); });
      body += L(ax, ay, ax + q.plotW, ay, { w: 1.4 });
      body += T(px + pad + fs * 0.6, top + q.ph / 2, String(q.p.ylab ?? ''), { fs, bold: true, anchor: 'middle', rotate: -90 });
      q.bs.forEach((b, i) => {
        const cx = ax + q.slot * (i + 0.5), top0 = top + q.tops[i], v = num(b.value) || 0, col = b.color || o.pal[i % o.pal.length];
        body += R(cx - q.bw / 2, top0, q.bw, ay - top0, { fill: col });
        if (S.showVal && isFinite(num(b.value))) body += T(cx, top0 - fs * 0.5, `${fmt(v, +S.dec || 0)}${S.suffix}`, { fs, anchor: 'middle' });
        body += T(cx, ay + fs * 1.55, q.xl[i], { fs, bold: true, anchor: 'middle' });
      });
      for (const b of q.brs) {
        const x1 = ax + q.slot * (b.a + 0.5), x2 = ax + q.slot * (b.e + 0.5), y = top + b.line, leg = fs * 1.1;
        body += `<path d="M${x1.toFixed(1)},${(y + leg).toFixed(1)}V${y.toFixed(1)}H${x2.toFixed(1)}V${(y + leg).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
        body += T((x1 + x2) / 2, y - fs * 0.5 - (b.ls.length - 1) * fs * lh, b.ls, { fs, anchor: 'middle' });
      }
    });
    if (o.frame && n > 1) for (let k = 1; k < n; k++) body += row ? L(k * pw, 0, k * pw, H, { w: 3, c: FRAME }) : L(0, k * panelH, W, k * panelH, { w: 3, c: FRAME });
    return svgRoot(W, H, body, { fs, frame: o.frame });
  },
};
