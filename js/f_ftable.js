// Tabla-resumen con forest: desenlace/subgrupo, n.º de estudios y participantes, método estadístico, forest, efecto (IC), I², P de interacción y enlace «View at».
import { T, L, R, arrow, num, fmt, minus, textW, wrap, fmtTicks, niceTicks, makeScale, svgRoot, INK, ZEBRA } from './svg.js?v=2026.10.25-2';

const row = (kind, label, x = {}) => ({ kind, label, k: '', n: '', method: '', est: '', lo: '', hi: '', i2: '', pint: '', view: '', ...x });
export const ftable = {
  id: 'ftable', name: 'Tabla resumen con forest (desenlaces y subgrupos)', short: 'Tabla forest',
  desc: 'Una fila por desenlace o subgrupo con nº de estudios, participantes, método estadístico, forest con IC, I², P de interacción y columna «View at». Desenlaces como encabezado en negrita y subgrupos sangrados.',
  settings: [
    { k: 'title', label: 'Título', type: 'text', def: '' },
    { k: 'h0', label: 'Encabezado de la primera columna', type: 'text', def: 'Outcome or subgroup' },
    { k: 'hm', label: 'Encabezado de la medida', type: 'text', def: 'Effect size (95% CI)' },
    { k: 'scale', label: 'Escala', type: 'select', opts: [['log', 'Logarítmica (razones)'], ['linear', 'Lineal (diferencias)']], def: 'log' },
    { k: 'ref', label: 'Valor de referencia', type: 'number', def: 1 },
    { k: 'ticks', label: 'Marcas del eje (coma)', type: 'text', def: '0.25,0.5,1,2,4' },
    { k: 'left', label: 'A favor de (izquierda)', type: 'text', def: 'Favours intervention' },
    { k: 'right', label: 'A favor de (derecha)', type: 'text', def: 'Favours control' },
    { k: 'dec', label: 'Decimales', type: 'number', def: 2 },
    { k: 'cK', label: 'Columna: nº de estudios', type: 'check', def: true },
    { k: 'cN', label: 'Columna: nº de participantes', type: 'check', def: true },
    { k: 'cM', label: 'Columna: método estadístico', type: 'check', def: true },
    { k: 'cI', label: 'Columna: I²', type: 'check', def: true },
    { k: 'cP', label: 'Columna: P de interacción', type: 'check', def: true },
    { k: 'cV', label: 'Columna: «View at»', type: 'check', def: false },
    { k: 'zebra', label: 'Filas sombreadas alternas', type: 'check', def: true },
    { k: 'rowH', label: 'Alto de fila (× tamaño de letra)', type: 'number', def: 2.3, step: 0.05 },
  ],
  tables: [{ k: 'rows', label: 'Filas', help: 'Tipo: out (desenlace, negrita; puede llevar efecto), sub (subgrupo, sangrado), tot (efecto global, rombo), h (solo texto). I² en % y P de interacción en la fila del desenlace o del primer subgrupo.', cols: [
    { k: 'kind', label: 'Tipo', type: 'select', opts: ['out', 'sub', 'tot', 'h'], w: 70 }, { k: 'label', label: 'Desenlace / subgrupo', type: 'text', w: 230 }, { k: 'k', label: 'Estudios', type: 'text', w: 70 }, { k: 'n', label: 'Participantes', type: 'text', w: 90 }, { k: 'method', label: 'Método', type: 'text', w: 170 },
    { k: 'est', label: 'Efecto', type: 'num', w: 70 }, { k: 'lo', label: 'IC inf.', type: 'num', w: 70 }, { k: 'hi', label: 'IC sup.', type: 'num', w: 70 }, { k: 'i2', label: 'I² %', type: 'text', w: 60 }, { k: 'pint', label: 'P interacción', type: 'text', w: 90 }, { k: 'view', label: 'View at', type: 'text', w: 80 }] }],
  example() {
    const M = 'Risk ratio (M-H, random)';
    return { settings: {}, tables: { rows: [
      row('out', 'All-cause mortality', { k: 9, n: '4,120', method: M, est: 0.84, lo: 0.72, hi: 0.98, i2: '21' }),
      row('sub', 'Age < 65 years', { k: 5, n: '2,310', method: M, est: 0.78, lo: 0.62, hi: 0.98, i2: '12', pint: '0.41' }), row('sub', 'Age ≥ 65 years', { k: 4, n: '1,810', method: M, est: 0.91, lo: 0.74, hi: 1.12, i2: '30' }),
      row('out', 'Hospital admission', { k: 6, n: '3,035', method: M, est: 0.71, lo: 0.55, hi: 0.92, i2: '48' }),
      row('sub', 'Community setting', { k: 4, n: '1,820', method: M, est: 0.62, lo: 0.45, hi: 0.86, i2: '37', pint: '0.09' }), row('sub', 'Hospital setting', { k: 2, n: '1,215', method: M, est: 0.92, lo: 0.66, hi: 1.28, i2: '0' }),
      row('out', 'Serious adverse events', { k: 7, n: '3,560', method: M, est: 1.05, lo: 0.88, hi: 1.25, i2: '0' }),
      row('tot', 'Composite (any event)', { k: 12, n: '5,210', method: M, est: 0.80, lo: 0.70, hi: 0.91, i2: '27' })] } };
  },
  render(st, o) {
    const S = { title: '', h0: 'Outcome or subgroup', hm: 'Effect size (95% CI)', scale: 'log', ref: 1, ticks: '', left: '', right: '', dec: 2, cK: true, cN: true, cM: true, cI: true, cP: true, cV: false, zebra: true, rowH: 2.3, ...st.settings }, fs = o.fs, W = o.W, pad = fs, lh = 1.22, dec = +S.dec || 0;
    const rows = (st.tables.rows || []).filter(r => String(r.label ?? '').trim() || isFinite(num(r.est)));
    if (!rows.length) return svgRoot(W, 120, T(20, 60, 'Añada filas de desenlaces y subgrupos.', { fs }), { fs, frame: o.frame });
    const kind = S.scale === 'log' ? 'log' : 'linear', ref = isFinite(num(S.ref)) ? num(S.ref) : kind === 'log' ? 1 : 0;
    const vals = rows.filter(r => isFinite(num(r.est))).flatMap(r => [num(r.est), num(r.lo), num(r.hi)]).filter(isFinite);
    let ticks = String(S.ticks ?? '').split(/[,;\s]+/).map(Number).filter(isFinite); if (!ticks.length) ticks = kind === 'log' ? [0.1, 0.2, 0.25, 0.5, 1, 2, 4, 5, 10].filter(v => v >= Math.min(...vals, ref) * 0.7 && v <= Math.max(...vals, ref) * 1.4) : niceTicks(Math.min(...vals, ref), Math.max(...vals, ref), 5);
    const x0v = Math.min(...ticks), x1v = Math.max(...ticks), txt = r => (isFinite(num(r.est)) ? `${fmt(num(r.est), dec)} [${fmt(num(r.lo), dec)}, ${fmt(num(r.hi), dec)}]` : '');
    const defs = { cK: ['k', 'No. of|studies'], cN: ['n', 'No. of|participants'], cM: ['method', 'Statistical|method'], cI: ['i2', 'I²|(%)'], cP: ['pint', 'P|interaction'], cV: ['view', 'View at'] };
    const pre = ['cK', 'cN', 'cM'].filter(c => S[c]), post = ['cI', 'cP', 'cV'].filter(c => S[c]), mcap = W * 0.12;
    const wr = (r, key) => (key === 'method' ? wrap(String(r[key] ?? ''), mcap, fs) : [String(r[key] ?? '')]);
    const cwOf = c => { const [key, h] = defs[c]; return Math.max(...h.split('|').map(x => textW(x, fs, true)), ...rows.flatMap(r => wr(r, key).map(l => textW(l, fs))), 10) + fs * 1.2; };
    const indent = fs * 1.2, labW = Math.min(W * 0.26, Math.max(textW(S.h0, fs, true), ...rows.map(r => textW(r.label ?? '', fs, r.kind === 'out' || r.kind === 'tot') + (r.kind === 'sub' ? indent : 0)), 30)), tW = Math.max(...rows.map(r => textW(txt(r), fs, true)), ...String(S.hm).split('|').map(l => textW(l, fs, true)), 10);
    const xL = pad; let a = xL + labW + fs * 1; const place = list => list.map(c => { const w = cwOf(c), m = a + w / 2; a += w; return [c, m]; });
    const preX = place(pre), xP0 = a + fs * 0.4; a = W - pad; const postRev = [...post].reverse().map(c => { const w = cwOf(c); a -= w; return [c, a + w / 2]; }).reverse();
    const xT = a - fs * 0.6, xP1 = xT - tW - fs * 1.0, sc = makeScale(kind, ticks, x0v, x1v, xP0 + fs * 0.5, xP1 - fs * 0.5), rhMin = fs * S.rowH;
    const rowsH = rows.map(r => Math.max(rhMin, wr(r, 'method').length * fs * lh + fs * 0.9));
    let y = pad * 0.5, body = '';
    if (S.title) { const tl = wrap(S.title, W - 2 * pad, fs, true); body += T(pad, y + fs * 1.1, tl, { fs, bold: true }); y += tl.length * fs * lh + fs * 0.6; }
    const hn = 2, hb = y + hn * fs * lh + fs * 0.3, hm = String(S.hm).split('|');
    body += T(xL, hb - fs * 0.1, S.h0, { fs, bold: true }) + T(xT - tW / 2, hb - hm.length * fs * lh + fs * 1.0, hm, { fs, bold: true, anchor: 'middle' });
    [...preX, ...postRev].forEach(([c, x]) => { const h = defs[c][1].split('|'); body += T(x, hb - h.length * fs * lh + fs * 1.0, h, { fs, bold: true, anchor: 'middle' }); });
    body += L(pad * 0.5, hb + fs * 0.4, W - pad * 0.5, hb + fs * 0.4, { w: 1.1, c: '#444' });
    const top = hb + fs * 0.4, ry = []; { let q = top; rowsH.forEach(h => { ry.push(q); q += h; }); } const axisY = top + rowsH.reduce((s2, h) => s2 + h, 0) + fs * 0.3;
    if (S.zebra) rows.forEach((r, i) => { if (i % 2 === 1) body += R(pad * 0.4, ry[i], W - pad * 0.8, rowsH[i], { fill: ZEBRA }); });
    if (isFinite(sc(ref))) body += L(sc(ref), top, sc(ref), axisY, { w: 1.3, dash: '5 5' });
    rows.forEach((r, i) => {
      const rh = rowsH[i], cy = ry[i] + rh / 2, base = cy + fs * 0.35, k = r.kind || 'sub', bold = k === 'out' || k === 'tot';
      body += T(xL + (k === 'sub' ? indent : 0), base, r.label ?? '', { fs, bold });
      if (k === 'h') return;
      [...preX, ...postRev].forEach(([c, x]) => { const key = defs[c][0], ls = wr(r, key); if (ls.join('') !== '') body += T(x, cy + fs * 0.35 - (ls.length - 1) * fs * lh / 2, ls, { fs, anchor: 'middle' }); });
      const e = num(r.est), lo = num(r.lo), hi = num(r.hi); if (!isFinite(e)) return;
      body += T(xT, base, txt(r), { fs, anchor: 'end', bold });
      if (k === 'tot') { const q = rhMin * 0.3; body += `<polygon points="${sc(lo).toFixed(1)},${cy.toFixed(1)} ${sc(e).toFixed(1)},${(cy - q).toFixed(1)} ${sc(hi).toFixed(1)},${cy.toFixed(1)} ${sc(e).toFixed(1)},${(cy + q).toFixed(1)}" fill="${INK}"/>`; return; }
      const xa = isFinite(lo) ? Math.max(lo, x0v) : e, xb = isFinite(hi) ? Math.min(hi, x1v) : e, q = fs * (k === 'out' ? 0.5 : 0.4);
      body += L(sc(xa), cy, sc(xb), cy, { w: 1.6 }) + R(sc(e) - q, cy - q, 2 * q, 2 * q, { fill: k === 'out' ? INK : '#3C6E91' });
    });
    body += L(sc(x0v), axisY, sc(x1v), axisY, { w: 1.3 });
    { const tl = fmtTicks(ticks); let lastX = -1e9; ticks.forEach((v, i) => { const shown = sc(v) - lastX >= textW(tl[i], fs) + fs * 0.7; if (shown) lastX = sc(v); body += L(sc(v), axisY, sc(v), axisY + 6, { w: 1.3 }) + (shown ? T(sc(v), axisY + 6 + fs * 1.15, tl[i], { fs, anchor: 'middle' }) : ''); }); }
    const ay = axisY + 6 + fs * 2.6, gap = fs * 0.5;
    if (S.left) body += arrow(sc(ref) - gap, ay, sc(x0v) - fs * 0.3, ay, { w: 1.2, s: 8 }) + T(sc(ref) - gap, ay + fs * 1.5, S.left, { fs, anchor: 'end' });
    if (S.right) body += arrow(sc(ref) + gap, ay, sc(x1v) + fs * 0.3, ay, { w: 1.2, s: 8 }) + T(sc(ref) + gap, ay + fs * 1.5, S.right, { fs, anchor: 'start' });
    return svgRoot(W, ay + fs * 2.8, body, { fs, frame: o.frame });
  },
};
