// Forest plot de metaanálisis estilo RevMan: estudios con peso, subtotales/total (rombo), líneas de heterogeneidad y columnas de riesgo de sesgo (círculos A–G) con leyenda.
import { T, L, R, arrow, num, fmt, minus, textW, wrap, fmtTicks, niceTicks, makeScale, svgRoot, INK } from './svg.js?v=2026.10.25-2';

const RB = { '+': '#4DAF4A', '?': '#F2C038', '-': '#D1361F' }, GREEN = '#3FA34D';
const row = (kind, label, x = {}) => ({ kind, label, c1: '', c2: '', weight: '', est: '', lo: '', hi: '', rob: '', ...x });
export const fmeta = {
  id: 'fmeta', name: 'Forest de metaanálisis (estilo RevMan, con riesgo de sesgo)', short: 'Forest RevMan',
  desc: 'Estudios con peso, subtotales y total en rombo, líneas de heterogeneidad, prueba de efecto y círculos de riesgo de sesgo A–G con leyenda «Judgement». Se introducen las estimaciones ya calculadas.',
  settings: [
    { k: 'title', label: 'Título', type: 'text', def: '' },
    { k: 'h0', label: 'Encabezado de estudios', type: 'text', def: 'Study or subgroup' },
    { k: 'h1', label: 'Encabezado columna extra 1', type: 'text', def: '' },
    { k: 'h2', label: 'Encabezado columna extra 2', type: 'text', def: '' },
    { k: 'hw', label: 'Encabezado del peso', type: 'text', def: 'Weight|(%)' },
    { k: 'hm', label: 'Encabezado de la medida', type: 'text', def: 'Mean difference|IV, random, 95% CI' },
    { k: 'scale', label: 'Escala', type: 'select', opts: [['linear', 'Lineal'], ['log', 'Logarítmica']], def: 'linear' },
    { k: 'ref', label: 'Valor de referencia', type: 'number', def: 0 },
    { k: 'ticks', label: 'Marcas del eje (coma)', type: 'text', def: '-4,-2,0,2,4' },
    { k: 'left', label: 'A favor de (izquierda)', type: 'text', def: 'Favours experimental' },
    { k: 'right', label: 'A favor de (derecha)', type: 'text', def: 'Favours control' },
    { k: 'dec', label: 'Decimales', type: 'number', def: 2 },
    { k: 'robOn', label: 'Mostrar columnas de riesgo de sesgo', type: 'check', def: true },
    { k: 'legend', label: 'Mostrar leyenda de sesgo (Judgement + dominios)', type: 'check', def: true },
    { k: 'rowH', label: 'Alto de fila (× tamaño de letra)', type: 'number', def: 1.9, step: 0.05 },
  ],
  tables: [
    { k: 'domains', label: 'Dominios de sesgo (columnas A, B, C…)', help: 'El orden define las letras y el de los códigos de la fila de cada estudio.', cols: [{ k: 'name', label: 'Dominio', type: 'text', w: 330 }] },
    { k: 'rows', label: 'Filas', help: 'Tipo: study, sub (subtotal), total, head (encabezado de subgrupo), note (línea de texto: heterogeneidad, prueba de efecto). Riesgo de sesgo: un código por dominio separados por espacio: + bajo, ? poco claro, − alto.', cols: [
      { k: 'kind', label: 'Tipo', type: 'select', opts: ['study', 'sub', 'total', 'head', 'note'], w: 80 }, { k: 'label', label: 'Estudio / texto', type: 'text', w: 250 }, { k: 'c1', label: 'Extra 1', type: 'text', w: 80 }, { k: 'c2', label: 'Extra 2', type: 'text', w: 80 },
      { k: 'weight', label: 'Peso %', type: 'num', w: 70 }, { k: 'est', label: 'Efecto', type: 'num', w: 70 }, { k: 'lo', label: 'IC inf.', type: 'num', w: 70 }, { k: 'hi', label: 'IC sup.', type: 'num', w: 70 }, { k: 'rob', label: 'Sesgo (+ ? −)', type: 'text', w: 150 }] },
  ],
  example() {
    const R_ = (l, w, e, a, b, rob) => row('study', l, { weight: w, est: e, lo: a, hi: b, rob });
    return {
      settings: {},
      tables: {
        domains: ['Random sequence generation (selection bias)', 'Allocation concealment (selection bias)', 'Blinding of participants and personnel (performance bias)', 'Blinding of outcome assessment (detection bias)', 'Incomplete outcome data (attrition bias)', 'Selective reporting (reporting bias)', 'Other bias'].map(name => ({ name })),
        rows: [row('head', '1.1.1 Short follow-up'),
          R_('Almeida 2016', 14.2, -1.10, -2.30, 0.10, '+ + ? - + + ?'), R_('Bianchi 2018', 21.8, -0.60, -1.40, 0.20, '+ ? + + + + +'), R_('Chen 2019', 18.5, -1.90, -3.10, -0.70, '- ? - - + ? ?'),
          row('sub', 'Subtotal (Wald)', { weight: 54.5, est: -1.15, lo: -1.98, hi: -0.32 }), row('note', 'Heterogeneity: Tau² = 0.21; Chi² = 4.10, df = 2 (P = 0.13); I² = 51%'), row('note', 'Test for overall effect: Z = 2.71 (P = 0.007)'),
          row('head', '1.1.2 Long follow-up'),
          R_('Dubois 2020', 25.3, -0.40, -1.00, 0.20, '+ + + + + + +'), R_('Evans 2021', 20.2, -0.90, -1.90, 0.10, '+ ? ? + - + ?'),
          row('sub', 'Subtotal (Wald)', { weight: 45.5, est: -0.63, lo: -1.28, hi: 0.02 }), row('note', 'Heterogeneity: Tau² = 0.00; Chi² = 0.60, df = 1 (P = 0.44); I² = 0%'), row('note', 'Test for overall effect: Z = 1.90 (P = 0.058)'),
          row('total', 'Total (Wald)', { weight: 100, est: -0.92, lo: -1.43, hi: -0.41 }), row('note', 'Heterogeneity: Tau² = 0.10; Chi² = 5.90, df = 4 (P = 0.21); I² = 32%'), row('note', 'Test for overall effect: Z = 3.54 (P = 0.0004)')],
      },
    };
  },
  render(st, o) {
    const S = { title: '', h0: 'Study or subgroup', h1: '', h2: '', hw: 'Weight|(%)', hm: '', scale: 'linear', ref: 0, ticks: '', left: '', right: '', dec: 2, robOn: true, legend: true, rowH: 1.9, ...st.settings }, fs = o.fs, W = o.W, pad = fs, lh = 1.22, dec = +S.dec || 0;
    const rows = (st.tables.rows || []).filter(r => String(r.label ?? '').trim() || isFinite(num(r.est)));
    if (!rows.length) return svgRoot(W, 120, T(20, 60, 'Añada filas de estudios.', { fs }), { fs, frame: o.frame });
    const doms = (st.tables.domains || []).map(d => String(d.name ?? '').trim()).filter(Boolean), nd = S.robOn ? Math.min(doms.length, 12) : 0, letters = i => String.fromCharCode(65 + i);
    const kind = S.scale === 'log' ? 'log' : 'linear', ref = isFinite(num(S.ref)) ? num(S.ref) : kind === 'log' ? 1 : 0;
    const vals = rows.filter(r => isFinite(num(r.est))).flatMap(r => [num(r.est), num(r.lo), num(r.hi)]).filter(isFinite);
    let ticks = String(S.ticks ?? '').split(/[,;\s]+/).map(Number).filter(isFinite); if (!ticks.length) ticks = kind === 'log' ? [0.1, 0.2, 0.5, 1, 2, 5, 10].filter(v => v >= Math.min(...vals, ref) * 0.7 && v <= Math.max(...vals, ref) * 1.4) : niceTicks(Math.min(...vals, ref), Math.max(...vals, ref), 5);
    const x0v = Math.min(...ticks), x1v = Math.max(...ticks), txt = r => (isFinite(num(r.est)) ? `${fmt(num(r.est), dec)} [${fmt(num(r.lo), dec)}, ${fmt(num(r.hi), dec)}]` : '');
    const lab = r => ({ labW: textW(r.label ?? '', fs, ['sub', 'total', 'head'].includes(r.kind)) });
    const labW = Math.min(W * 0.34, Math.max(textW(S.h0, fs, true), ...rows.filter(r => r.kind !== 'note').map(r => lab(r).labW + (r.kind === 'study' ? fs : 0)), 30));
    const hOf = k => String(S[k === 'c1' ? 'h1' : 'h2'] || '').split('|'), colW = k => (hOf(k).join('') || rows.some(r => String(r[k] ?? '') !== '') ? Math.max(...hOf(k).map(h => textW(h, fs, true)), ...rows.map(r => textW(String(r[k] ?? ''), fs)), 10) + fs * 1.4 : 0), c1 = colW('c1'), c2 = colW('c2');
    const hw = String(S.hw ?? '').split('|'), wW = Math.max(...hw.map(h => textW(h, fs, true)), ...rows.map(r => textW(isFinite(num(r.weight)) ? fmt(num(r.weight), 1) : '', fs)), 10) + fs * 1.2, tW = Math.max(...rows.map(r => textW(txt(r), fs)), ...String(S.hm ?? '').split('|').map(h => textW(h, fs, true)), 10) + fs * 0.6;
    const cell = fs * 1.55, robW = nd * cell;
    const xL = pad, xC1 = xL + labW + fs * 0.9 + c1 / 2, xC2 = xL + labW + fs * 0.9 + c1 + c2 / 2, xW = xL + labW + fs * 0.9 + c1 + c2 + wW, xT0 = xW + fs * 0.9, xP0 = xT0 + tW + fs * 1.0, xP1 = W - pad - robW - (nd ? fs * 0.8 : 0);
    const sc = makeScale(kind, ticks, x0v, x1v, xP0 + fs * 0.5, xP1 - fs * 0.5), rh = fs * S.rowH, hdrN = Math.max(2, hw.length, hOf('c1').length, hOf('c2').length, String(S.hm ?? '').split('|').length);
    let y = pad * 0.5, body = '';
    if (S.title) { const tl = wrap(S.title, W - 2 * pad, fs, true); body += T(pad, y + fs * 1.1, tl, { fs, bold: true }); y += tl.length * fs * lh + fs * 0.6; }
    const hy = y + fs * 1.1, hb = y + hdrN * fs * lh + fs * 0.2;
    body += T(xL, hb - fs * 0.15, S.h0, { fs, bold: true }) + T(xC1, hb - hOf('c1').length * fs * lh + fs * 1.0, hOf('c1'), { fs, bold: true, anchor: 'middle' }) + T(xC2, hb - hOf('c2').length * fs * lh + fs * 1.0, hOf('c2'), { fs, bold: true, anchor: 'middle' });
    body += T(xW, hb - (hw.length) * fs * lh + fs * 1.0, hw, { fs, bold: true, anchor: 'end' });
    { const hm = String(S.hm ?? '').split('|'); body += T(xT0 + tW / 2, hb - hm.length * fs * lh + fs * 1.0, hm, { fs, bold: true, anchor: 'middle' }); }
    if (nd) { body += T(xP1 + fs * 0.8 + robW / 2, hb - fs * 1.35, 'Risk of bias', { fs, bold: true, anchor: 'middle' }); for (let d = 0; d < nd; d++) body += T(xP1 + fs * 0.8 + (d + 0.5) * cell, hb - fs * 0.15, letters(d), { fs, bold: true, anchor: 'middle' }); }
    body += L(pad * 0.5, hb + fs * 0.35, W - pad * 0.5, hb + fs * 0.35, { w: 1.1, c: '#444' });
    const top = hb + fs * 0.35 + fs * 0.4, maxW = Math.max(...rows.map(r => num(r.weight)).filter(r => isFinite(r) && r < 99.5), 1);
    let yy = top; const ys = [];
    rows.forEach(r => { const h = r.kind === 'note' ? fs * 1.35 : rh; ys.push([yy, h]); yy += h; });
    const axisY = yy + fs * 0.3;
    if (isFinite(sc(ref))) body += L(sc(ref), top - fs * 0.2, sc(ref), axisY, { w: 1.2 });
    rows.forEach((r, i) => {
      const [ry, h] = ys[i], cy = ry + h / 2, base = cy + fs * 0.35, k = r.kind || 'study', bold = ['sub', 'total', 'head'].includes(k);
      if (k === 'note') { body += T(xL + fs * 0.6, base, r.label ?? '', { fs: fs * 0.92, italic: true }); return; }
      body += T(xL + (k === 'study' ? fs * 0.5 : 0), base, r.label ?? '', { fs, bold });
      if (k === 'head') return;
      body += T(xC1, base, String(r.c1 ?? ''), { fs, anchor: 'middle' }) + T(xC2, base, String(r.c2 ?? ''), { fs, anchor: 'middle' });
      if (isFinite(num(r.weight))) body += T(xW, base, fmt(num(r.weight), 1), { fs, anchor: 'end', bold });
      body += T(xT0 + tW, base, txt(r), { fs, anchor: 'end', bold });
      const e = num(r.est), a = num(r.lo), b = num(r.hi);
      if (isFinite(e)) {
        if (k === 'study') {
          const xa = Math.max(a, x0v), xb = Math.min(b, x1v), q = fs * (0.28 + 0.4 * Math.sqrt((num(r.weight) || maxW * 0.5) / maxW));
          body += L(sc(xa), cy, sc(xb), cy, { w: 1.5 }) + R(sc(e) - q, cy - q, 2 * q, 2 * q, { fill: GREEN, stroke: '#222', sw: 0.6 });
        } else { const q = rh * 0.34; body += `<polygon points="${sc(a).toFixed(1)},${cy.toFixed(1)} ${sc(e).toFixed(1)},${(cy - q).toFixed(1)} ${sc(b).toFixed(1)},${cy.toFixed(1)} ${sc(e).toFixed(1)},${(cy + q).toFixed(1)}" fill="${k === 'total' ? '#111' : '#333'}"/>`; }
      }
      if (nd && k === 'study') String(r.rob ?? '').replace(/−/g, '-').split(/[\s,;]+/).filter(Boolean).slice(0, nd).forEach((c, d) => { if (RB[c]) body += `<circle cx="${(xP1 + fs * 0.8 + (d + 0.5) * cell).toFixed(1)}" cy="${cy.toFixed(1)}" r="${(cell * 0.36).toFixed(1)}" fill="${RB[c]}" stroke="#222" stroke-width="0.7"/>` + T(xP1 + fs * 0.8 + (d + 0.5) * cell, cy + fs * 0.3, c === '-' ? '−' : c, { fs: fs * 0.8, bold: true, anchor: 'middle', fill: '#fff' }); });
    });
    body += L(sc(x0v), axisY, sc(x1v), axisY, { w: 1.3 });
    { const tl = fmtTicks(ticks); let lastX = -1e9; ticks.forEach((v, i) => { const shown = sc(v) - lastX >= textW(tl[i], fs) + fs * 0.7; if (shown) lastX = sc(v); body += L(sc(v), axisY, sc(v), axisY + 6, { w: 1.3 }) + (shown ? T(sc(v), axisY + 6 + fs * 1.15, tl[i], { fs, anchor: 'middle' }) : ''); }); }
    let ay = axisY + 6 + fs * 2.6; const gap = fs * 0.5;
    if (S.left) body += arrow(sc(ref) - gap, ay, sc(x0v) - fs * 0.3, ay, { w: 1.2, s: 8 }) + T(sc(ref) - gap, ay + fs * 1.5, S.left, { fs, anchor: 'end' });
    if (S.right) body += arrow(sc(ref) + gap, ay, sc(x1v) + fs * 0.3, ay, { w: 1.2, s: 8 }) + T(sc(ref) + gap, ay + fs * 1.5, S.right, { fs, anchor: 'start' });
    y = ay + fs * 2.8;
    if (S.legend && nd) {
      body += L(pad * 0.5, y, W - pad * 0.5, y, { w: 1, c: '#999' }); y += fs * 1.5;
      body += T(pad, y, 'Risk of bias legend', { fs, bold: true }); y += fs * 1.6;
      const keys = doms.slice(0, nd).map((d, i) => `(${letters(i)}) ${d}`), half = Math.ceil(keys.length / 2), colw = (W - pad * 2) / 2;
      keys.forEach((k, i) => { const col = i < half ? 0 : 1, rr = col ? i - half : i; body += T(pad + col * colw, y + rr * fs * lh, wrap(k, colw - fs, fs)[0], { fs: fs * 0.92 }); });
      y += half * fs * lh + fs * 0.4;
      let lx = pad; [['Low risk', '+'], ['Unclear', '?'], ['High risk', '-']].forEach(([t, c]) => { body += `<circle cx="${(lx + fs * 0.55).toFixed(1)}" cy="${(y - fs * 0.3).toFixed(1)}" r="${(fs * 0.55).toFixed(1)}" fill="${RB[c]}" stroke="#222" stroke-width="0.7"/>` + T(lx + fs * 1.5, y, t, { fs }); lx += textW(t, fs) + fs * 3.4; });
      y += fs * 1.2;
    }
    return svgRoot(W, y + fs * 0.5, body, { fs, frame: o.frame });
  },
};
