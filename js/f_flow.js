// Diagrama de flujo de participantes (CONSORT/STROBE) a partir de un texto sencillo.
//   Línea normal  = cuadro principal (flujo hacia abajo)        >  texto|subtexto = cuadro lateral de exclusiones
//   === Nombre    = comienza un brazo (columna); lo anterior es el tronco común
import { T, L, R, arrow, esc, textW, wrap, svgRoot, INK } from './svg.js?v=2026.10.25-2';

export function parseFlow(text) {
  const trunk = [], arms = []; let cur = trunk;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const ln = raw.replace(/\s+$/, ''); if (!ln.trim()) continue;
    if (/^\s*={3,}/.test(ln)) { arms.push({ name: ln.replace(/^\s*=+\s*/, '').trim(), items: [] }); cur = arms[arms.length - 1].items; continue; }
    if (/^\s*>/.test(ln)) { const it = cur[cur.length - 1]; if (it) it.side = ln.replace(/^\s*>\s*/, '').trim(); continue; }
    cur.push({ text: ln.trim(), side: '' });
  }
  return { trunk, arms };
}
const EX = `750 Patients were assessed for eligibility
> 319 Did not meet eligibility criteria and were excluded|   180 Estimated GFR <20 ml/min/1.73 m²|   139 Declined to participate
431 Underwent randomization
428 Received drug A or placebo
=== Drug A
214 Received drug A and were included in the full-analysis and safety-analysis populations
106 Were included in the interim-analysis population
> 7 Discontinued drug A|   5 Withdrew|   1 Had adverse event|   1 Had protocol deviation
99 (93.4%) Continued to receive drug A
=== Placebo
214 Received placebo and were included in the full-analysis and safety-analysis populations
97 Were included in the interim-analysis population
> 13 Discontinued placebo|   7 Had adverse event|   3 Withdrew|   2 Were withdrawn by physician|   1 Had protocol deviation
84 (86.6%) Continued to receive placebo`;

export const flow = {
  id: 'flow', name: 'Diagrama de flujo CONSORT', short: 'CONSORT',
  desc: 'Flujo de participantes con exclusiones laterales y brazos de aleatorización. Se escribe como texto y se dibuja automáticamente.',
  settings: [
    { k: 'text', label: 'Flujo (una línea por cuadro; > para exclusiones; === Brazo para dividir)', type: 'textarea', def: EX, rows: 18 },
    { k: 'armNames', label: 'Mostrar el nombre de cada brazo como primer cuadro', type: 'check', def: false },
    { k: 'boxW', label: 'Ancho de los cuadros principales (% del ancho)', type: 'number', def: 32 },
    { k: 'sideW', label: 'Ancho de los cuadros laterales (% del ancho)', type: 'number', def: 26 },
    { k: 'gap', label: 'Separación vertical (× tamaño de letra)', type: 'number', def: 2.4, step: 0.1 },
  ],
  tables: [],
  example() { return { settings: { text: EX }, tables: {} }; },
  render(st, o) {
    const S = { text: EX, armNames: false, boxW: 32, sideW: 26, gap: 2.4, ...st.settings }, fs = o.fs, W = o.W, lh = 1.22, px = fs * 0.9, py = fs * 0.75, bsw = 1.6;
    const { trunk, arms } = parseFlow(S.text);
    if (S.armNames) arms.forEach(a => a.items.unshift({ text: a.name, side: '', bold: true }));
    if (!trunk.length && !arms.length) return svgRoot(W, 120, T(20, 60, 'Escriba el flujo en el cuadro de texto.', { fs }), { fs, frame: o.frame });
    const K = arms.length, mw = Math.min(S.boxW / 100 * W, K > 1 ? W * 0.9 / K : W), arrowLen = fs * 3.0;
    const cs = K <= 1 ? [W / 2] : arms.map((_, i) => W * (0.5 + (i - (K - 1) / 2) * (K === 2 ? 0.4 : 0.9 / K)));
    const cTrunk = W / 2, gap0 = fs * S.gap, margin = fs * 1.0;
    const boxH = (txt, w, bold = false) => { const ls = wrap(txt, w - 2 * px, fs, bold); return { ls, h: ls.length * fs * lh + 2 * py }; };
    const sideBox = (txt, wMax) => { // primera línea al ras, el resto con sangría
      const parts = String(txt).split('|'); let out = [];
      parts.forEach((p, i) => { const lead = (p.match(/^\s*/)[0].length > 0 || i > 0) ? fs * 1.1 : 0; wrap(p.trim(), wMax - 2 * px - lead, fs).forEach((l, j) => out.push({ t: l, ind: lead + (i > 0 && j > 0 ? fs * 0.0 : 0) })); });
      const w = Math.min(wMax, Math.max(...out.map(l => textW(l.t, fs) + l.ind)) + 2 * px);
      return { ls: out, w, h: out.length * fs * lh + 2 * py };
    };
    let body = '', y = margin;
    const drawBox = (cx, y0, w, h, ls, bold) => { body += R(cx - w / 2, y0, w, h, { fill: '#fff', stroke: INK, sw: bsw }) + T(cx, y0 + py + fs * 0.88, ls, { fs, anchor: 'middle', bold }); };
    const drawSide = (x0, y0, sb) => { body += R(x0, y0, sb.w, sb.h, { fill: '#fff', stroke: INK, sw: bsw }); sb.ls.forEach((l, i) => { body += T(x0 + px + l.ind, y0 + py + fs * 0.88 + i * fs * lh, l.t, { fs }); }); };
    // columna de una lista de cuadros; devuelve el y del borde inferior del último
    const column = (items, cx, wBox, sideRight, sideMax, startY) => {
      let yy = startY, last = null;
      items.forEach((it, i) => {
        const bx = boxH(it.text, wBox, it.bold); drawBox(cx, yy, wBox, bx.h, bx.ls, it.bold);
        const bottom = yy + bx.h; last = bottom;
        if (i < items.length - 1) {
          const sb = it.side ? sideBox(it.side, sideMax) : null, gap = Math.max(gap0, sb ? sb.h + fs * 1.4 : 0), mid = bottom + gap / 2;
          body += arrow(cx, bottom, cx, bottom + gap, { w: bsw, s: 9 });
          if (sb) { const x0 = sideRight ? cx + arrowLen : cx - arrowLen - sb.w; body += arrow(cx, mid, sideRight ? x0 : x0 + sb.w, mid, { w: bsw, s: 9 }); drawSide(x0, mid - sb.h / 2, sb); }
          yy = bottom + gap;
        }
      });
      return { bottom: last };
    };
    // tronco
    const trunkSideMax = Math.max(60, W - margin - (cTrunk + arrowLen));
    const tw = Math.min(mw, W - 2 * margin);
    let endTrunk = y;
    if (trunk.length) {
      let yy = y;
      trunk.forEach((it, i) => {
        const bx = boxH(it.text, tw); drawBox(cTrunk, yy, tw, bx.h, bx.ls);
        const bottom = yy + bx.h; endTrunk = bottom;
        const hasNext = i < trunk.length - 1 || K > 0;
        if (hasNext) {
          const sb = it.side ? sideBox(it.side, Math.min(trunkSideMax, S.sideW / 100 * W * 1.15)) : null, gap = Math.max(gap0, sb ? sb.h + fs * 1.4 : 0), mid = bottom + gap / 2;
          if (i < trunk.length - 1 || K <= 1) body += arrow(cTrunk, bottom, cTrunk, bottom + gap, { w: bsw, s: 9 });
          else body += L(cTrunk, bottom, cTrunk, bottom + gap * 0.5, { w: bsw });
          if (sb) { const x0 = cTrunk + arrowLen; body += arrow(cTrunk, mid, x0, mid, { w: bsw, s: 9 }); drawSide(x0, mid - sb.h / 2, sb); }
          yy = bottom + gap; if (i === trunk.length - 1) endTrunk = bottom;
        }
      });
      y = endTrunk;
    }
    if (!K) return svgRoot(W, y + margin, body, { fs, frame: o.frame });
    // división hacia los brazos
    const splitY = trunk.length ? y + Math.max(gap0, (trunk[trunk.length - 1].side ? sideBox(trunk[trunk.length - 1].side, 1e4).h + fs * 1.4 : 0)) * 0.5 : y;
    const armTop = splitY + gap0 * 0.55;
    if (K > 1) body += L(cs[0], splitY, cs[K - 1], splitY, { w: bsw });
    // brazos: filas sincronizadas
    const sMax = K === 2 ? S.sideW / 100 * W * 1.1 : Math.max(60, (cs[1] - cs[0]) - arrowLen - fs * 2);
    const levels = Math.max(...arms.map(a => a.items.length));
    let yy = armTop;
    for (let j = 0; j < levels; j++) {
      const bxs = arms.map((a, i) => (a.items[j] ? boxH(a.items[j].text, mw, a.items[j].bold) : null)), hRow = Math.max(...bxs.map(b => (b ? b.h : 0)));
      arms.forEach((a, i) => { const it = a.items[j]; if (it) drawBox(cs[i], yy, mw, hRow, bxs[i].ls, it.bold); });
      const sbs = arms.map((a, i) => (a.items[j + 1] && a.items[j].side ? sideBox(a.items[j].side, Math.max(60, Math.min(sMax, K === 2 ? (i === 0 ? cs[0] - arrowLen - margin : W - margin - cs[i] - arrowLen) : sMax))) : null));
      const nxt = arms.some(a => a.items[j + 1]), gap = Math.max(gap0, ...sbs.map(s => (s ? s.h + fs * 1.4 : 0))), bottom = yy + hRow;
      arms.forEach((a, i) => {
        if (!a.items[j + 1]) return;
        body += arrow(cs[i], bottom, cs[i], bottom + gap, { w: bsw, s: 9 });
        const sb = sbs[i]; if (sb) { const right = K === 2 ? i === K - 1 : true, x0 = right ? cs[i] + arrowLen : cs[i] - arrowLen - sb.w, mid = bottom + gap / 2; body += arrow(cs[i], mid, right ? x0 : x0 + sb.w, mid, { w: bsw, s: 9 }); drawSide(x0, mid - sb.h / 2, sb); }
      });
      if (j === 0) arms.forEach((a, i) => { body += arrow(cs[i], armTop - (armTop - splitY), cs[i], armTop, { w: bsw, s: 9 }); });
      yy = nxt ? bottom + gap : bottom;
      if (!nxt) y = bottom;
    }
    return svgRoot(W, y + margin, body, { fs, frame: o.frame });
  },
};
