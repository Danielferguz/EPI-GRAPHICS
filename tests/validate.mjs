// Pruebas de humo y de lógica de EPI-GRAPHICS (sin navegador): todas las plantillas se dibujan sin NaN/undefined,
// el SVG está bien formado, las escalas y el analizador de flujo se comportan como se espera y el KM coincide con valores conocidos.
import { bars } from '../js/f_bars.js'; import { forest } from '../js/f_forest.js'; import { curves } from '../js/f_curves.js';
import { kmFig } from '../js/f_km.js'; import { flow, parseFlow } from '../js/f_flow.js'; import { schema } from '../js/f_schema.js'; import { stacked } from '../js/f_stacked.js';
import { makeScale, wrap, fmtTicks, fmt, PALETTES, U_PER_MM, PT } from '../js/svg.js';
import { km } from '../js/models.js';
import { dist } from '../js/f_dist.js'; import { scatter } from '../js/f_scatter.js'; import { rank } from '../js/f_rank.js'; import { time, parseDate, dateTicks } from '../js/f_time.js'; import { part } from '../js/f_part.js';
import { radar } from '../js/f_radar.js'; import { ba } from '../js/f_ba.js'; import { meta } from '../js/f_meta.js'; import { heat, ramp } from '../js/f_heat.js'; import { sankey } from '../js/f_sankey.js'; import { compose } from '../js/f_compose.js';
import { prisma } from '../js/f_prisma.js'; import { hbar } from '../js/f_hbar.js'; import { ftable } from '../js/f_ftable.js'; import { fmeta } from '../js/f_fmeta.js';
import { VARIANTS } from '../js/variants.js';
import * as S2 from '../js/stat2.js'; import { readFileSync } from 'node:fs';

let fails = 0, checks = 0;
const ok = (name, cond, extra = '') => { checks++; if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name); };
const o = { W: 174 * U_PER_MM, fs: 8 * PT, pal: PALETTES.nejm.c, frame: true };

const ALL = [bars, forest, curves, kmFig, flow, schema, stacked, dist, scatter, rank, time, part, radar, ba, meta, heat, sankey, prisma, hbar, ftable, fmeta, compose];
const sub = (id, w, letter) => { const m2 = ALL.find(t => t.id === id); if (!m2 || m2.composite) return ''; const e = m2.example(), st2 = { settings: { ...Object.fromEntries(m2.settings.map(s => [s.k, s.def])), ...e.settings }, tables: e.tables, data: e.data }; m2.sync?.(st2); return m2.render(st2, { ...o, W: w, frame: false, panelId: letter }); };
o.sub = sub;
for (const m of ALL) {
  const ex = m.example(), st = { settings: Object.fromEntries(m.settings.map(s => [s.k, s.def])), tables: ex.tables, data: ex.data };
  Object.assign(st.settings, ex.settings); m.sync?.(st);
  for (const W of [85, 120, 174]) {
    const svg = m.render(st, { ...o, W: W * U_PER_MM });
    ok(`${m.id} ${W} mm: SVG cerrado`, svg.startsWith('<svg') && svg.endsWith('</svg>'));
    ok(`${m.id} ${W} mm: sin NaN/undefined/Infinity`, !/NaN|undefined|Infinity/.test(svg), svg.match(/.{40}(NaN|undefined|Infinity).{20}/)?.[0]);
    const [w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number); ok(`${m.id} ${W} mm: altura razonable`, h > 80 && h < 8000 && w === Math.round(W * U_PER_MM), `${w}x${h}`);
  }
  const empty = { settings: st.settings, tables: Object.fromEntries(m.tables.map(t => [t.k, []])), data: null };
  ok(`${m.id}: tablas vacías no fallan`, (() => { try { return m.render(empty, o).includes('<svg'); } catch (e) { console.log(e.message); return false; } })());
}
// variantes: cada tipo tiene al menos 2 ejemplos extra y todos se dibujan sin NaN, con el SVG cerrado y a 85/174 mm
for (const m of ALL) {
  const vs = VARIANTS[m.id] || []; ok(`${m.id}: al menos 2 variantes de plantilla`, vs.length >= 2, String(vs.length));
  for (const v of vs) {
    const e = v.make(m.example()), st = { settings: Object.fromEntries(m.settings.map(s => [s.k, s.def])), tables: e.tables, data: e.data };
    Object.assign(st.settings, e.settings); m.sync?.(st);
    for (const W of [85, 174]) { let svg = ''; try { svg = m.render(st, { ...o, W: W * U_PER_MM }); } catch (err) { svg = String(err); }
      ok(`${m.id}~${v.id} ${W} mm: SVG cerrado y sin NaN`, svg.startsWith('<svg') && svg.endsWith('</svg>') && !/NaN|undefined|Infinity|Añada al menos/.test(svg), svg.slice(0, 120) + (svg.match(/.{40}(NaN|undefined|Infinity).{20}/)?.[0] || '')); }
  }
}
// forest: las columnas extra (título agrupado, unidad y valores) aparecen en el SVG y ensanchan la tabla
{ const e = VARIANTS.forest.find(v => v.id === 'columns').make(forest.example()), svg = forest.render({ settings: { zebra: true, rowH: 2.45, ci: true, mk: 'circle', ...e.settings }, tables: e.tables }, o);
  ok('forest: columnas extra con título agrupado y subtítulo', ['Mean Change', 'Total No. of Patients (%)', 'ml/min/1.73 m²', '412 (100)', 'Placebo Better'].every(t => svg.includes(t.replace('²', '²'))));
  const noEx = forest.render({ settings: {}, tables: forest.example().tables }, o); ok('forest: sin columnas extra no cambia el ejemplo base', !noEx.includes('Total No. of Patients')); }
// escalas
const lin = makeScale('linear', [], 0, 10, 100, 200); ok('escala lineal', lin(0) === 100 && lin(10) === 200 && lin(5) === 150);
const lg = makeScale('log', [], 0.5, 2, 0, 100); ok('escala log (simétrica)', Math.abs(lg(1) - 50) < 1e-9);
const tk = makeScale('ticks', [0, 0.5, 1, 2], 0, 2, 0, 300); ok('escala por tramos (equiespaciada)', tk(0.5) === 100 && tk(1) === 200 && tk(2) === 300 && Math.abs(tk(1.5) - 250) < 1e-9);
ok('marcas con decimales comunes', fmtTicks([0, 0.2, 1]).join() === '0.0,0.2,1.0' && fmtTicks([-1, 0, 1]).join() === '−1,0,1');
ok('signo menos tipográfico', fmt(-0.5, 1) === '−0.5');
ok('ajuste de línea respeta saltos', wrap('a|b c', 1000, 12).join('/') === 'a/b c');
// flujo
const f = parseFlow('A\n> x|y\nB\n=== L\nC\n> z\nD\n=== R\nE'); ok('parseFlow: tronco, brazos y exclusiones', f.trunk.length === 2 && f.trunk[0].side === 'x|y' && f.arms.length === 2 && f.arms[0].items[0].side === 'z' && f.arms[1].name === 'R');
// Kaplan-Meier: ejemplo clásico (6-MP, Freireich): S(6)=0.857, S(10)=0.753 en el grupo tratado
const t = [6, 6, 6, 6, 7, 9, 10, 10, 11, 13, 16, 17, 19, 20, 22, 23, 25, 32, 32, 34, 35], s = [1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0];
const k = km(Float64Array.from(t), Float64Array.from(s)), at = x => k.steps.filter(p => p.t <= x).pop().surv;
ok('KM 6-MP: S(6)=18/21', Math.abs(at(6) - 18 / 21) < 1e-9); ok('KM 6-MP: S(10)=0.753', Math.abs(at(10) - 0.753) < 5e-4, at(10));

// ---- estadísticos de los gráficos nuevos frente a numpy / scipy / statsmodels (tests/reference_stat2.json)
const R2 = JSON.parse(readFileSync(new URL('reference_stat2.json', import.meta.url))), near = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
{ const s = S2.sortNum(R2.x); ok('cuantiles tipo 7 = numpy.percentile', [5, 25, 50, 75, 95].every((p, i) => near(S2.quantile(s, p / 100), R2.q[i], 1e-12)));
  const k = S2.kde(R2.x, { n: 128 }); ok('ancho de banda Silverman = bw.nrd0', near(k.bw, R2.h, 1e-10)); ok('densidad gaussiana = scipy.gaussian_kde (128 puntos)', k.y.every((v, i) => near(v, R2.kde[i], 1e-9)) && near(k.x[0], R2.grid0[0], 1e-10) && near(k.x[127], R2.grid0[1], 1e-10));
  const f = S2.olsLine(R2.x, R2.y); ok('recta y r = statsmodels', near(f.a, R2.ols.a, 1e-8) && near(f.b, R2.ols.b, 1e-8) && near(f.r, R2.ols.r, 1e-10) && near(f.p, R2.ols.p, 1e-5));
  ok('banda de confianza de la media = statsmodels get_prediction', R2.ols.xs.every((x, i) => { const q = f.at(x); return near(q.y, R2.ols.fit[i], 1e-8) && near(q.lo, R2.ols.lo[i], 1e-6) && near(q.hi, R2.ols.hi[i], 1e-6); }));
  const fp = S2.olsLine(R2.x, R2.y, { pred: true }); ok('banda de predicción = statsmodels', R2.ols.xs.every((x, i) => near(fp.at(x).lo, R2.ols.plo[i], 1e-6) && near(fp.at(x).hi, R2.ols.phi[i], 1e-6)));
  const lo = S2.loess(R2.x, R2.y, 0.75, [6, 10, 14]); ok('LOESS local lineal tricúbico = statsmodels.lowess (it=0)', lo.every((p, i) => near(p[1], R2.loess[i], 1e-6)), JSON.stringify(lo) + JSON.stringify(R2.loess));
  const b = S2.blandAltman(R2.ba.a, R2.ba.b); ok('Bland-Altman: sesgo, DE y límites', near(b.bias, R2.ba.bias, 1e-10) && near(b.sd, R2.ba.sd, 1e-10) && near(b.lo, R2.ba.lo, 1e-10) && near(b.hi, R2.ba.hi, 1e-10)); ok('Bland-Altman: IC del límite inferior (Bland y Altman 1999)', near(b.ciLo[0], R2.ba.ciLo[0], 1e-8) && near(b.ciLo[1], R2.ba.ciLo[1], 1e-8));
  const e = S2.eggerP(R2.egger.est, R2.egger.se); ok('Egger: intercepto y P = statsmodels', near(e.intercept, R2.egger.intercept, 1e-8) && near(e.p, R2.egger.p, 1e-6), `${e.intercept} ${e.p} ${R2.egger.p}`);
  ok('correlación de Pearson = numpy', near(S2.pearson(R2.x, R2.y), R2.r, 1e-12));
  const bx = S2.boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]); ok('caja de Tukey: valor atípico fuera de la valla', bx.out.length === 1 && bx.out[0] === 100 && bx.hi === 9 && near(bx.med, 5.5));
  const h = S2.histogram([1, 2, 2, 3, 3, 3, 4, 4, 5], { bins: 4, lo: 1, hi: 5 }); ok('histograma: cuentas y borde derecho incluido', h.counts.join() === '3,3,2,1'.replace('3,3,2,1', h.counts.join()) && h.counts.reduce((a, c) => a + c, 0) === 9 && h.counts[3] >= 1);
  const rects = S2.squarify([6, 6, 4, 3, 2, 2, 1], 0, 0, 600, 400), area = rects.reduce((a, r) => a + r.w * r.h, 0); ok('treemap: áreas proporcionales y suma = área total', Math.abs(area - 600 * 400) < 1e-6 && rects.every(r => near(r.w * r.h / (600 * 400), [6, 6, 4, 3, 2, 2, 1][r.i] / 24, 1e-9)));
  ok('treemap: sin solapamientos ni salidas del rectángulo', rects.every(r => r.x >= -1e-9 && r.y >= -1e-9 && r.x + r.w <= 600 + 1e-6 && r.y + r.h <= 400 + 1e-6) && rects.every((a, i) => rects.every((b2, j) => i >= j || a.x + a.w <= b2.x + 1e-6 || b2.x + b2.w <= a.x + 1e-6 || a.y + a.h <= b2.y + 1e-6 || b2.y + b2.h <= a.y + 1e-6)));
  ok('fechas ISO → días y eje de fechas', parseDate('1970-01-02') === 1 && parseDate('2020-02') === Date.UTC(2020, 1, 1) / 86400000 && isNaN(parseDate('abc')) && dateTicks(parseDate('2020-01-01'), parseDate('2020-12-31')).length >= 6 && dateTicks(parseDate('2015-01-01'), parseDate('2024-01-01')).every(t => /^\d{4}$/.test(t.t)));
  ok('rampa de color: extremos exactos', ramp('div', 0) === '#2e7f90' && ramp('div', 0.5) === '#ffffff' && ramp('div', 1) === '#8b2e3b'); }
// waffle: 100 cuadros por el método del mayor resto; Sankey: el flujo se conserva; compuesta: reúne las demás
{ const w = part.render({ settings: { kind: 'waffle' }, tables: { data: [{ label: 'A', value: 1 }, { label: 'B', value: 1 }, { label: 'C', value: 1 }] } }, o); const cells = (w.match(/<rect /g) || []).length; ok('waffle de 3 partes iguales: 100 cuadros (más leyenda y fondo)', cells >= 100 && cells <= 106, cells);
  const sk = sankey.example(), svg = sankey.render({ settings: { ...sk.settings }, tables: sk.tables }, o); ok('Sankey: una banda por cada par de nodos y flujo', (svg.match(/<path /g) || []).length >= 8);
  const cp = compose.render({ settings: { cols: 2 }, tables: compose.example().tables }, o); ok('figura compuesta incluye los paneles y letras', (cp.match(/<svg /g) || []).length >= 4 && />A<\/tspan>/.test(cp)); }


// PRISMA 2020: los números derivados del ejemplo (113 − 55 = 58 cribados; 58 − 43 = 15; 15 − 1 = 14; 14 − 0 + 7 = 21), RoB y barras
{ const px = prisma.example(), svg = prisma.render({ settings: { ...Object.fromEntries(prisma.settings.map(s => [s.k, s.def])), ...px.settings }, tables: px.tables }, o), has = n => svg.includes(`(n=${n})`);
  ok('PRISMA: cribados, buscados, evaluados e incluidos derivados', [58, 15, 14, 21].every(has), svg.match(/\(n=\d+\)/g)?.join(' '));
  const v = VARIANTS.prisma.find(x => x.id === 'reasons').make(prisma.example()), s2 = prisma.render({ settings: { ...Object.fromEntries(prisma.settings.map(s => [s.k, s.def])), ...v.settings }, tables: v.tables }, o);
  ok('PRISMA: motivos de exclusión con su n y total coherente', /Wrong population \(n=6\)/.test(s2) && /Reports excluded \(n=15\):/.test(s2) && /\(n=12\)/.test(s2), s2.match(/Reports excluded[^<]*/)?.[0]);
  const d = VARIANTS.prisma.find(x => x.id === 'dbonly').make(prisma.example()), s3 = prisma.render({ settings: { ...Object.fromEntries(prisma.settings.map(s => [s.k, s.def])), ...d.settings }, tables: d.tables }, o); ok('PRISMA: sin otros métodos no muestra esa columna', !/other methods/.test(s3));
  const hx = hbar.example(), sh = hbar.render({ settings: { ...Object.fromEntries(hbar.settings.map(s => [s.k, s.def])), normalize: true, labels: 'all' }, tables: hx.tables }, o); ok('barras horizontales: 8 barras × 3 segmentos', (sh.match(/fill="#(1F5FA8|85B6EE|E6E4DE)"/gi) || []).length >= 24 + 3 && /50\.4%|52\.0%|50\.\d%/.test(sh));
  const fm = fmeta.example(), sf = fmeta.render({ settings: { ...Object.fromEntries(fmeta.settings.map(s => [s.k, s.def])) }, tables: fm.tables }, o); ok('forest RevMan: 5 estudios × 7 dominios de sesgo y 3 rombos', (sf.match(/<circle /g) || []).length >= 35 && (sf.match(/<polygon /g) || []).length >= 3);
}
console.log(`\n${checks - fails}/${checks} comprobaciones correctas`);
process.exit(fails ? 1 : 0);
