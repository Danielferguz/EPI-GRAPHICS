// Diagrama de flujo PRISMA 2020 de una revisión sistemática: identificación (bases de datos y otros métodos), cribado e inclusión.
import { T, L, R, arrow, num, textW, wrap, svgRoot } from './svg.js?v=2026.10.25-2';

const TEAL = '#69B6C0', TEAL_BG = '#D3EAEC', YEL = '#F6C94E', YEL_BG = '#FBF3D5';
const EX = { dbs: [['PubMed', 24], ['Embase', 17], ['Web of Science', 22], ['Virtual Health Library', 16], ['Cochrane library', 34]], other: [['Google Scholar', 100], ['References of included studies', 8]] };
const reasonsOf = s => String(s ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const m = /^(\d+)\s+(.*)$/.exec(l); return m ? { n: +m[1], t: m[2] } : { n: NaN, t: l }; });
const sumN = a => a.reduce((s, v) => s + (isFinite(v) ? v : 0), 0);

export const prisma = {
  id: 'prisma', name: 'Diagrama de flujo PRISMA 2020 (revisión sistemática)', short: 'PRISMA',
  desc: 'Identificación en bases de datos y otros métodos, cribado, elegibilidad e inclusión con las cifras de cada fase; los totales se calculan solos si deja vacías las casillas derivadas.',
  settings: [
    { k: 'otherOn', label: 'Incluir la columna «otros métodos»', type: 'check', def: true },
    { k: 'h1', label: 'Encabezado de bases de datos', type: 'text', def: 'Identification of studies via databases and registers' },
    { k: 'h2', label: 'Encabezado de otros métodos', type: 'text', def: 'Identification of studies via other methods' },
    { k: 'dup', label: 'Duplicados eliminados antes del cribado', type: 'number', def: 55 },
    { k: 'autoRem', label: 'Registros marcados como no elegibles por automatización', type: 'number', def: '' },
    { k: 'otherRem', label: 'Registros eliminados por otras razones', type: 'number', def: '' },
    { k: 'screened', label: 'Registros cribados (vacío = identificados − eliminados)', type: 'number', def: '' },
    { k: 'exclScreen', label: 'Registros excluidos en el cribado', type: 'number', def: 43 },
    { k: 'soughtDb', label: 'Informes buscados (bases de datos; vacío = cribados − excluidos)', type: 'number', def: '' },
    { k: 'notRetDb', label: 'Informes no recuperados (bases de datos)', type: 'number', def: 1 },
    { k: 'assessedDb', label: 'Informes evaluados para elegibilidad (bases; vacío = buscados − no recuperados)', type: 'number', def: '' },
    { k: 'reasonsDb', label: 'Informes excluidos (bases): una razón por línea con «n razón»', type: 'textarea', def: '', rows: 4 },
    { k: 'soughtOther', label: 'Informes buscados (otros métodos; vacío = identificados)', type: 'number', def: 7 },
    { k: 'notRetOther', label: 'Informes no recuperados (otros métodos)', type: 'number', def: '' },
    { k: 'assessedOther', label: 'Informes evaluados (otros métodos; vacío = buscados − no recuperados)', type: 'number', def: '' },
    { k: 'reasonsOther', label: 'Informes excluidos (otros métodos): una razón por línea con «n razón»', type: 'textarea', def: '', rows: 3 },
    { k: 'included', label: 'Estudios incluidos (vacío = calculado)', type: 'number', def: 21 },
    { k: 'reportsIncl', label: 'Informes de los estudios incluidos (opcional)', type: 'number', def: '' },
    { k: 'lblIncl', label: 'Texto de «incluidos»', type: 'text', def: 'Studies included in review' },
  ],
  tables: [
    { k: 'dbs', label: 'Bases de datos y registros', cols: [{ k: 'name', label: 'Fuente', type: 'text', w: 280 }, { k: 'n', label: 'Registros (n)', type: 'num', w: 100 }] },
    { k: 'other', label: 'Otros métodos (búsqueda manual, citas, sitios web…)', cols: [{ k: 'name', label: 'Fuente', type: 'text', w: 280 }, { k: 'n', label: 'Registros (n)', type: 'num', w: 100 }] },
  ],
  example() { return { settings: {}, tables: { dbs: EX.dbs.map(([name, n]) => ({ name, n })), other: EX.other.map(([name, n]) => ({ name, n })) } }; },
  render(st, o) {
    const S = { otherOn: true, h1: '', h2: '', dup: '', autoRem: '', otherRem: '', screened: '', exclScreen: '', soughtDb: '', notRetDb: '', assessedDb: '', reasonsDb: '', soughtOther: '', notRetOther: '', assessedOther: '', reasonsOther: '', included: '', reportsIncl: '', lblIncl: 'Studies included in review', ...st.settings };
    const fs = o.fs, W = o.W, pad = fs, lh = 1.22, px = fs * 0.7, py = fs * 0.6, N = k => num(S[k]);
    const dbs = (st.tables.dbs || []).filter(r => String(r.name ?? '').trim()), oth = S.otherOn ? (st.tables.other || []).filter(r => String(r.name ?? '').trim()) : [], hasOther = S.otherOn && (oth.length > 0 || isFinite(N('soughtOther')));
    const idDb = sumN(dbs.map(r => num(r.n))), idOth = sumN(oth.map(r => num(r.n))), removed = sumN([N('dup'), N('autoRem'), N('otherRem')]);
    const screened = isFinite(N('screened')) ? N('screened') : idDb - removed, excl = isFinite(N('exclScreen')) ? N('exclScreen') : 0, sought = isFinite(N('soughtDb')) ? N('soughtDb') : screened - excl, notRet = isFinite(N('notRetDb')) ? N('notRetDb') : 0;
    const assessed = isFinite(N('assessedDb')) ? N('assessedDb') : sought - notRet, rDb = reasonsOf(S.reasonsDb), exDb = rDb.some(r => isFinite(r.n)) ? sumN(rDb.map(r => r.n)) : 0;
    const soughtO = isFinite(N('soughtOther')) ? N('soughtOther') : idOth, notRetO = isFinite(N('notRetOther')) ? N('notRetOther') : 0, assessedO = isFinite(N('assessedOther')) ? N('assessedOther') : soughtO - notRetO, rO = reasonsOf(S.reasonsOther), exO = rO.some(r => isFinite(r.n)) ? sumN(rO.map(r => r.n)) : 0;
    const included = isFinite(N('included')) ? N('included') : assessed - exDb + (hasOther ? assessedO - exO : 0);
    if (!dbs.length && !oth.length) return svgRoot(W, 120, T(20, 60, 'Añada las fuentes de búsqueda y las cifras de cada fase.', { fs }), { fs, frame: o.frame });
    // geometría de columnas
    const phW = fs * 2.5, X1 = pad + phW + fs * 0.9, gap1 = fs * 3.2, gap2 = fs * 2.2, avail = W - X1 - pad - gap1 - (hasOther ? gap2 : 0), wMain = hasOther ? avail * 0.33 : avail * 0.5, wSide = hasOther ? avail * 0.36 : avail * 0.5, wOth = hasOther ? avail * 0.31 : 0;
    const X2 = X1 + wMain + gap1, X3 = X2 + wSide + gap2;
    // cajas: líneas {t, ind}; center = texto centrado
    const mk = (lines, w, center = false) => { const L2 = []; lines.forEach(l => { const ind = typeof l === 'object' ? l.ind || 0 : 0, t = typeof l === 'object' ? l.t : l; wrap(t, w - 2 * px - ind, fs).forEach((x, j) => L2.push({ t: x, ind: ind + (j ? fs * 0.9 : 0) })); }); return { lines: L2, w, center, h: L2.length * fs * lh + 2 * py }; };
    const list = (head, items) => [head, ...items.map(r => ({ t: `${r.name} (n=${isFinite(num(r.n)) ? num(r.n) : ''})`, ind: fs * 1.1 }))];
    const r1 = { main: mk(list(`Records identified from: (n=${idDb})`, dbs), wMain), side: mk(['Records removed before screening:', ...(isFinite(N('dup')) ? [{ t: `Duplicate records removed (n=${N('dup')})`, ind: fs * 1.1 }] : []), ...(isFinite(N('autoRem')) ? [{ t: `Records marked as ineligible by automation tools (n=${N('autoRem')})`, ind: fs * 1.1 }] : []), ...(isFinite(N('otherRem')) ? [{ t: `Records removed for other reasons (n=${N('otherRem')})`, ind: fs * 1.1 }] : [])], wSide), other: hasOther ? mk(list('Records identified from:', oth), wOth) : null };
    const r2 = { main: mk([`Records screened`, `(n=${screened})`], wMain, true), side: mk([`Records excluded`, `(n=${excl})`], wSide, true) };
    const r3 = { main: mk([`Reports sought for retrieval`, `(n=${sought})`], wMain, true), side: mk([`Reports not retrieved`, `(n=${notRet})`], wSide, true), other: hasOther ? mk([`Reports sought for retrieval`, `(n=${soughtO})`], wOth, true) : null };
    const reasonLines = (rs, ex) => (rs.length ? [`Reports excluded (n=${ex}):`, ...rs.map(r => ({ t: isFinite(r.n) ? `${r.t} (n=${r.n})` : r.t, ind: fs * 1.1 }))] : ['Reports excluded', `(n=${ex})`]);
    const r4 = { main: mk([`Reports assessed for eligibility`, `(n=${assessed})`], wMain, true), side: mk(reasonLines(rDb, exDb), wSide, !rDb.length), other: hasOther ? mk([`Reports assessed for eligibility`, `(n=${assessedO})`], wOth, true) : null };
    const r5 = { main: mk([S.lblIncl, `(n=${included})`, ...(isFinite(N('reportsIncl')) ? [`Reports of included studies (n=${N('reportsIncl')})`] : [])], wMain, true) };
    // alturas de encabezados y filas
    const hdr1 = wrap(S.h1, X2 + wSide - X1 - 2 * px, fs), hdr2 = hasOther ? wrap(S.h2, wOth - 2 * px, fs) : [], hh = Math.max(hdr1.length, hdr2.length, 1) * fs * lh + 2 * py, vg = fs * 2.6, rows = [r1, r2, r3, r4, r5];
    let y = pad; const hy = y; y += hh + fs * 1.4; const ys = [];
    rows.forEach(r => { const h = Math.max(...['main', 'side', 'other'].map(k => r[k]?.h || 0)); ys.push({ y, h }); y += h + vg; });
    const bottom = y - vg + pad;
    let body = '';
    const box = (b, x, yy, h) => { body += R(x, yy, b.w, h, { fill: '#fff', stroke: TEAL, sw: 1.6 }); const cy = yy + (h - b.h) / 2; b.lines.forEach((l, i) => { const ty = cy + py + fs * 0.88 + i * fs * lh; body += b.center ? T(x + b.w / 2, ty, l.t, { fs, anchor: 'middle' }) : T(x + px + l.ind, ty, l.t, { fs }); }); };
    const ar = (x1, y1, x2, y2) => { body += arrow(x1, y1, x2, y2, { w: 1.6, c: TEAL, s: 9 }); };
    // encabezados
    body += R(X1, hy, X2 + wSide - X1, hh, { fill: YEL_BG, stroke: YEL, sw: 1.6 }) + T((X1 + X2 + wSide) / 2, hy + py + fs * 0.88 - (hdr1.length - 1) * 0 , hdr1, { fs, anchor: 'middle' });
    if (hasOther) body += R(X3, hy, wOth, hh, { fill: YEL_BG, stroke: YEL, sw: 1.6 }) + T(X3 + wOth / 2, hy + py + fs * 0.88, hdr2, { fs, anchor: 'middle' });
    rows.forEach((r, i) => {
      const { y: yy, h } = ys[i];
      if (r.main) box(r.main, X1, yy, h); if (r.side) box(r.side, X2, yy, h); if (r.other) box(r.other, X3, yy, h);
      if (r.main && r.side) ar(X1 + wMain, yy + h / 2, X2, yy + h / 2);
      if (i < 4) { if (i === 0 || i === 1 || i === 2) ar(X1 + wMain / 2, yy + h, X1 + wMain / 2, ys[i + 1].y); if (i === 3) ar(X1 + wMain / 2, yy + h, X1 + wMain / 2, ys[4].y); }
    });
    if (hasOther) { // otros métodos: identificación → buscados → evaluados → incluidos
      ar(X3 + wOth / 2, ys[0].y + ys[0].h, X3 + wOth / 2, ys[2].y); ar(X3 + wOth / 2, ys[2].y + ys[2].h, X3 + wOth / 2, ys[3].y);
      const yb = ys[3].y + ys[3].h, yi = ys[4].y + ys[4].h / 2; body += L(X3 + wOth / 2, yb, X3 + wOth / 2, yi, { w: 1.6, c: TEAL }); ar(X3 + wOth / 2, yi, X1 + wMain + 1, yi);
    }
    // etiquetas de fase (verticales)
    const phase = (name, a, b) => { const y0 = ys[a].y, y1 = ys[b].y + ys[b].h; body += R(pad, y0, phW, y1 - y0, { fill: TEAL_BG, stroke: TEAL, sw: 1.6 }) + T(pad + phW / 2 + fs * 0.3, (y0 + y1) / 2, name, { fs: Math.min(fs, fs * (y1 - y0 - fs * 0.8) / textW(name, fs)), anchor: 'middle', rotate: -90 }); };
    phase('Identification', 0, 0); phase('Screening', 1, 3); phase('Included', 4, 4);
    return svgRoot(W, bottom, body, { fs, frame: o.frame });
  },
};
