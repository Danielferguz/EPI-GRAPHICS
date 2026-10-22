// Kaplan-Meier desde datos individuales (tiempo, evento, grupo): supervivencia o incidencia acumulada, IC, marcas de censura y número en riesgo.
import { drawCurves } from './f_curves.js?v=2026.10.22-1';
import { km, logrank } from './models.js?v=2026.10.22-1';
import { rng } from './dist.js?v=2026.10.22-1';
import { T, svgRoot, num, fmt } from './svg.js?v=2026.10.22-1';

export function exampleRows() {
  const r = rng(11), rows = [];
  for (let i = 0; i < 360; i++) {
    const trt = i % 2 ? 'Drug A' : 'Placebo', rate = (trt === 'Drug A' ? 0.0125 : 0.021) * Math.exp(0.25 * r.norm());
    const t = -Math.log(r.u()) / rate, c = 12 + 36 * r.u();
    rows.push({ id: i + 1, arm: trt, months: +Math.min(t, c, 48).toFixed(2), kidney_failure: t <= Math.min(c, 48) ? 1 : 0 });
  }
  return rows;
}
const natural = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true });
export const km_ = {
  id: 'km', name: 'Kaplan-Meier (datos individuales)', short: 'Kaplan-Meier', needsData: true,
  desc: 'Curvas de supervivencia o de incidencia acumulada con IC 95 %, censuras y número en riesgo, calculadas desde su base (tiempo, evento, grupo).',
  settings: [
    { k: 'time', label: 'Variable de tiempo', type: 'var', def: '' }, { k: 'status', label: 'Variable de evento', type: 'var', def: '' }, { k: 'event', label: 'Valor que indica evento', type: 'text', def: '1' },
    { k: 'group', label: 'Variable de grupo (opcional)', type: 'var', def: '', optional: true },
    { k: 'cuminc', label: 'Mostrar incidencia acumulada (1 − S)', type: 'check', def: false }, { k: 'percent', label: 'Eje Y en porcentaje', type: 'check', def: true },
    { k: 'ci', label: 'Banda de IC 95 %', type: 'check', def: true }, { k: 'cens', label: 'Marcas de censura', type: 'check', def: true }, { k: 'risk', label: 'Tabla «No. at Risk»', type: 'check', def: true },
    { k: 'xmax', label: 'Tiempo máximo del eje X', type: 'number', def: 48 }, { k: 'xstep', label: 'Paso del eje X', type: 'number', def: 12 },
    { k: 'title', label: 'Título', type: 'text', def: 'Kidney Failure' }, { k: 'ylab', label: 'Título eje Y', type: 'text', def: 'Probability of Kidney-Failure–free Survival' }, { k: 'xlab', label: 'Título eje X', type: 'text', def: 'Months' },
    { k: 'note', label: 'Texto dentro del gráfico (| = salto de línea)', type: 'text', def: 'Hazard ratio, 0.58 (95% CI, 0.44–0.77)|P<0.001' }, { k: 'notePos', label: 'Posición del texto', type: 'select', opts: [['bl', 'Abajo izquierda'], ['br', 'Abajo derecha'], ['tl', 'Arriba izquierda'], ['tr', 'Arriba derecha']], def: 'bl' },
    { k: 'aspect', label: 'Altura del gráfico (proporción del ancho)', type: 'number', def: 0.55, step: 0.05 },
  ],
  tables: [{ k: 'groups', label: 'Grupos (nombre en la leyenda y color)', help: 'Se rellena al elegir la variable de grupo; cambie el nombre o el color si lo desea.', cols: [{ k: 'value', label: 'Valor en la base', type: 'text', w: 140 }, { k: 'label', label: 'Nombre en la figura', type: 'text', w: 180 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] }],
  example() { return { settings: { time: 'months', status: 'kidney_failure', event: '1', group: 'arm' }, tables: { groups: [] }, data: { name: 'ejemplo simulado', rows: exampleRows() } }; },
  // mantiene la tabla de grupos al día con los valores de la variable de grupo
  sync(st) {
    const g = st.settings.group, rows = st.data?.rows || [];
    const vals = g ? [...new Set(rows.map(r => String(r[g] ?? '')).filter(v => v !== ''))].sort(natural) : [];
    const cur = st.tables.groups || [];
    if (vals.join('|') !== cur.map(x => x.value).join('|')) st.tables.groups = vals.map(v => cur.find(c => c.value === v) || { value: v, label: v, color: '' });
  },
  render(st, o) {
    const S = { event: '1', cuminc: false, percent: true, ci: true, cens: true, risk: true, xmax: 48, xstep: 12, aspect: 0.55, notePos: 'bl', ...st.settings }, rows = st.data?.rows || [];
    if (!rows.length || !S.time || !S.status) return svgRoot(o.W, 140, T(20, 70, 'Cargue una base y elija las variables de tiempo y evento.', { fs: o.fs }), { fs: o.fs, frame: o.frame });
    const xmax = +S.xmax || 48, step = +S.xstep > 0 ? +S.xstep : xmax / 4, ticks = []; for (let v = 0; v <= xmax + 1e-9; v += step) ticks.push(+v.toFixed(8));
    const sc = S.percent ? 100 : 1, groups = S.group ? (st.tables.groups?.length ? st.tables.groups : [...new Set(rows.map(r => String(r[S.group])))].map(v => ({ value: v, label: v, color: '' }))) : [{ value: null, label: '', color: '' }];
    const series = [], risk = [];
    groups.forEach((g, gi) => {
      const sub = rows.filter(r => (g.value == null || String(r[S.group]) === String(g.value)) && isFinite(num(r[S.time])));
      const time = Float64Array.from(sub, r => num(r[S.time])), status = Float64Array.from(sub, r => (String(r[S.status]).trim() === String(S.event).trim() ? 1 : 0));
      if (!time.length) return;
      const k = km(time, status), col = g.color || (o.line || o.pal)[gi % (o.line || o.pal).length];
      const f = v => (S.cuminc ? 1 - v : v) * sc;
      const pts = [{ x: 0, y: f(1), lo: f(1), hi: f(1) }], cens = [];
      for (const s of k.steps) {
        if (s.t > xmax) break;
        pts.push({ x: s.t, y: f(s.surv), lo: S.cuminc ? f(s.hi) : f(s.lo), hi: S.cuminc ? f(s.lo) : f(s.hi) });
        if (s.ncens > 0) cens.push([s.t, f(s.surv)]);
      }
      const lastp = pts[pts.length - 1]; if (lastp.x < xmax) pts.push({ ...lastp, x: xmax });
      series.push({ name: g.label || '', color: col, marker: 'none', step: true, band: !!S.ci, censor: S.cens ? cens : [], pts, labelPos: 'none', endText: 'none' });
      risk.push({ name: g.label || 'All', vals: ticks.map(t => time.reduce((a, v) => a + (v >= t ? 1 : 0), 0)) });
    });
    // leyenda interna: nombre de cada grupo junto a su curva (por la derecha)
    series.forEach(s => { if (s.name) { s.labelPos = 'right'; } });
    const panel = { id: S.letter || '', title: S.title, ylab: S.ylab, ymin: 0, ymax: sc, ystep: sc / 5, xlab: S.xlab, xticks: ticks, xmin: 0, xmax, ref: NaN, series, risk: S.risk ? risk : [], riskTitle: 'No. at Risk', note: S.note ? { text: S.note, pos: S.notePos } : null };
    return drawCurves([panel], o, { aspect: +S.aspect });
  },
};
export { km_ as kmFig };
