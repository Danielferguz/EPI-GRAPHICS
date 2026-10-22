// Pruebas de humo y de lógica de EPI-GRAPHICS (sin navegador): todas las plantillas se dibujan sin NaN/undefined,
// el SVG está bien formado, las escalas y el analizador de flujo se comportan como se espera y el KM coincide con valores conocidos.
import { bars } from '../js/f_bars.js'; import { forest } from '../js/f_forest.js'; import { curves } from '../js/f_curves.js';
import { kmFig } from '../js/f_km.js'; import { flow, parseFlow } from '../js/f_flow.js'; import { schema } from '../js/f_schema.js'; import { stacked } from '../js/f_stacked.js';
import { makeScale, wrap, fmtTicks, fmt, PALETTES, U_PER_MM, PT } from '../js/svg.js';
import { km } from '../js/models.js';

let fails = 0, checks = 0;
const ok = (name, cond, extra = '') => { checks++; if (!cond) { fails++; console.log('FAIL', name, extra); } else console.log('ok  ', name); };
const o = { W: 174 * U_PER_MM, fs: 8 * PT, pal: PALETTES.nejm.c, frame: true };

for (const m of [bars, forest, curves, kmFig, flow, schema, stacked]) {
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
console.log(`\n${checks - fails}/${checks} comprobaciones correctas`); process.exit(fails ? 1 : 0);
