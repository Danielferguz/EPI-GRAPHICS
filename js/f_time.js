// Evolución temporal: líneas, áreas, áreas apiladas y curva epidémica (barras por periodo), con eventos marcados y fechas en el eje.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, uniq, natural, empty, legend, minus, niceTicks, INK, FRAME } from './kit.js?v=2026.10.24-2';
import { lcg } from './stat2.js?v=2026.10.24-2';

const MESES = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
// fecha ISO (AAAA, AAAA-MM, AAAA-MM-DD) → días desde 1970-01-01; NaN si no es fecha
export function parseDate(s) { const m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(String(s).trim()); if (!m) return NaN; return Date.UTC(+m[1], (m[2] || 1) - 1, +(m[3] || 1)) / 86400000; }
const fromDays = d => new Date(d * 86400000);
export function dateTicks(lo, hi, lang = 'en') {
  const MES = MESES[lang] || MESES.en;
  const a = fromDays(lo), b = fromDays(hi), years = (hi - lo) / 365.25, out = [];
  const step = years > 8 ? 12 : years > 3 ? 6 : years > 1.4 ? 3 : years > 0.45 ? 1 : 0; // meses
  if (!step) { for (let d = Math.ceil(lo / 7) * 7; d <= hi; d += 7 * Math.max(1, Math.round((hi - lo) / 7 / 8))) out.push(d); return out.map(d => ({ d, t: `${fromDays(d).getUTCDate()} ${MES[fromDays(d).getUTCMonth()]}` })); }
  let y = a.getUTCFullYear(), m = Math.ceil(a.getUTCMonth() / step) * step; if (m >= 12) { y++; m = 0; }
  for (;;) { const d = Date.UTC(y, m, 1) / 86400000; if (d > hi) break; if (d >= lo) out.push({ d, t: step >= 12 ? String(y) : `${MES[m]} ${y}` }); m += step; if (m >= 12) { y += Math.floor(m / 12); m %= 12; } }
  return out;
}
const KINDS = [['line', 'Líneas'], ['area', 'Áreas'], ['stacked', 'Áreas apiladas'], ['stacked100', 'Áreas apiladas al 100 %'], ['epi', 'Curva epidémica (barras apiladas)']];
export const time = {
  id: 'time', name: 'Evolución temporal (líneas, áreas, curva epidémica)', short: 'Tiempo',
  desc: 'Series a lo largo del tiempo: líneas, áreas, áreas apiladas y curva epidémica (casos por periodo), con fechas ISO en el eje, eventos marcados y media móvil opcional.',
  settings: [
    { k: 'kind', label: 'Tipo', type: 'select', opts: KINDS, def: 'epi' }, { k: 'lang', label: 'Idioma de los meses del eje', type: 'select', opts: [['en', 'Inglés (Jan, Feb…)'], ['es', 'Español (ene, feb…)']], def: 'en' }, { k: 'smooth', label: 'Media móvil (nº de puntos; 1 = sin suavizar)', type: 'number', def: 1 },
    { k: 'markers', label: 'Marcadores en las líneas', type: 'check', def: false }, { k: 'title', label: 'Título', type: 'text', def: 'Weekly Confirmed Cases' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' },
    { k: 'xlab', label: 'Título del eje X', type: 'text', def: '' }, { k: 'ylab', label: 'Título del eje Y', type: 'text', def: 'No. of Cases' }, { k: 'ymax', label: 'Y máximo (vacío = auto)', type: 'number', def: '' },
    { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.5, step: 0.05 },
  ],
  tables: [
    { k: 'groups', label: 'Grupos (orden y color)', cols: [{ k: 'name', label: 'Grupo', type: 'text', w: 200 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'data', label: 'Datos', help: 'X puede ser un número o una fecha (AAAA-MM-DD, AAAA-MM o AAAA). Una fila por grupo y momento.', cols: [{ k: 'x', label: 'Fecha o tiempo', type: 'text', w: 120 }, { k: 'group', label: 'Grupo', type: 'text', w: 160 }, { k: 'value', label: 'Valor', type: 'num', w: 90 }] },
    { k: 'events', label: 'Eventos (líneas verticales)', cols: [{ k: 'x', label: 'Fecha o tiempo', type: 'text', w: 120 }, { k: 'text', label: 'Texto', type: 'text', w: 260 }] },
  ],
  example() {
    const r = lcg(9), rows = []; let d0 = Date.UTC(2020, 1, 3) / 86400000;
    for (let w = 0; w < 40; w++) { const d = new Date((d0 + 7 * w) * 86400000).toISOString().slice(0, 10); for (const [g, sc, pk] of [['Lima', 90, 14], ['Cusco', 30, 20], ['Loreto', 40, 11]]) rows.push({ x: d, group: g, value: Math.round(sc * Math.exp(-((w - pk) ** 2) / 40) * (0.8 + 0.4 * r()) + 2) }); }
    return { settings: {}, tables: { groups: [{ name: 'Lima', color: '' }, { name: 'Cusco', color: '' }, { name: 'Loreto', color: '' }], data: rows, events: [{ x: '2020-03-16', text: 'National lockdown' }] } };
  },
  render(st, o) {
    const S = { kind: 'epi', smooth: 1, markers: false, aspect: 0.5, ...st.settings }, fs = o.fs, W = o.W;
    const raw = rowsOf(st, 'data').map(r => ({ xs: String(r.x ?? '').trim(), g: String(r.group ?? '').trim() || ' ', v: num(r.value) })).filter(r => r.xs && isFinite(r.v));
    if (!raw.length) return empty(o, 'Añada fechas (o tiempos), grupo y valor.');
    const isDate = raw.every(r => isFinite(parseDate(r.xs))), X = r => (isDate ? parseDate(r.xs) : num(r.xs)); const data = raw.map(r => ({ ...r, x: X(r) })).filter(r => isFinite(r.x));
    const xsAll = [...new Set(data.map(d => d.x))].sort((a, b) => a - b), ord = rowsOf(st, 'groups').map(r => String(r.name).trim()).filter(Boolean), groups = [...ord.filter(g => data.some(d => d.g === g)), ...uniq(data.map(d => d.g)).filter(g => !ord.includes(g))];
    const col = g => rowsOf(st, 'groups').find(r => String(r.name).trim() === g)?.color || (['line', 'area'].includes(S.kind) ? lineOf(o, groups.indexOf(g)) : colOf(o, groups.indexOf(g)));
    const k = Math.max(1, Math.round(+S.smooth || 1)), mat = groups.map(g => { const m = new Map(data.filter(d => d.g === g).map(d => [d.x, d.v])); let ys = xsAll.map(x => m.get(x)); const bar = ['epi', 'stacked', 'stacked100'].includes(S.kind);
      // huecos: cero en barras y apiladas; interpolación lineal en líneas y áreas
      if (bar) ys = ys.map(v => v ?? 0); else for (let i = 0; i < ys.length; i++) if (ys[i] == null) { let a = i - 1, b = i + 1; while (a >= 0 && ys[a] == null) a--; while (b < ys.length && ys[b] == null) b++; ys[i] = a < 0 ? (ys[b] ?? 0) : b >= ys.length ? ys[a] : ys[a] + (ys[b] - ys[a]) * (xsAll[i] - xsAll[a]) / (xsAll[b] - xsAll[a]); }
      if (k > 1) ys = ys.map((_, i) => { const lo = Math.max(0, i - Math.floor(k / 2)), hi = Math.min(ys.length - 1, lo + k - 1), s = ys.slice(lo, hi + 1); return s.reduce((a, b) => a + b, 0) / s.length; });
      return ys; });
    const stack = ['epi', 'stacked', 'stacked100'].includes(S.kind), tot = xsAll.map((_, i) => mat.reduce((a, ys) => a + ys[i], 0));
    let ytop = S.kind === 'stacked100' ? 100 : stack ? Math.max(...tot) : Math.max(...mat.flat()); if (isFinite(num(S.ymax))) ytop = num(S.ymax); const yt = niceTicks(0, ytop, 5), ymaxT = Math.max(ytop, yt.at(-1));
    const step = xsAll.length > 1 ? Math.min(...xsAll.slice(1).map((x, i) => x - xsAll[i])) : 1, xlo = xsAll[0] - (S.kind === 'epi' ? step * 0.55 : 0), xhi = xsAll.at(-1) + (S.kind === 'epi' ? step * 0.55 : 0), dt = isDate ? dateTicks(xlo, xhi, S.lang) : null;
    const F = frame(o, { id: S.id, title: S.title, x: [xlo, xhi], y: [0, ymaxT], xticks: dt ? dt.map(t => t.d) : null, xfmt: dt ? (v => dt.find(t => t.d === v)?.t ?? '') : null, yticks: niceTicks(0, ymaxT, 5), xlab: S.xlab, ylab: S.ylab, ph: W * 0.8 * S.aspect });
    let body = F.s; const cum = xsAll.map(() => 0), norm = i => (S.kind === 'stacked100' ? 100 / (tot[i] || 1) : 1);
    groups.forEach((g, gi) => { const c = col(g), ys = mat[gi];
      if (S.kind === 'epi') xsAll.forEach((x, i) => { const bw = step * 0.9 * F.pw / (xhi - xlo), y1 = F.sy(cum[i] + ys[i]), y0 = F.sy(cum[i]); if (ys[i] > 0) body += R(F.sx(x) - bw / 2, y1, bw, y0 - y1, { fill: c, stroke: '#fff', sw: 0.8 }); cum[i] += ys[i]; });
      else if (stack) { const up = xsAll.map((x, i) => [F.sx(x), F.sy(cum[i] + ys[i] * norm(i))]), dn = xsAll.map((x, i) => [F.sx(x), F.sy(cum[i])]).reverse(); body += `<path d="M${[...up, ...dn].map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z" fill="${c}" stroke="#fff" stroke-width="0.8"/>`; xsAll.forEach((_, i) => (cum[i] += ys[i] * norm(i))); }
      else { const pts = xsAll.map((x, i) => `${F.sx(x).toFixed(1)},${F.sy(ys[i]).toFixed(1)}`);
        if (S.kind === 'area') body += `<path d="M${F.sx(xsAll[0])},${F.sy(0)}L${pts.join('L')}L${F.sx(xsAll.at(-1))},${F.sy(0)}Z" fill="${c}" fill-opacity="0.28"/>`;
        body += `<path d="M${pts.join('L')}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`; if (S.markers) xsAll.forEach((x, i) => (body += `<circle cx="${F.sx(x)}" cy="${F.sy(ys[i])}" r="${fs * 0.3}" fill="${c}"/>`)); } });
    for (const e of rowsOf(st, 'events')) { const x = isDate ? parseDate(e.x) : num(e.x); if (!isFinite(x) || x < xlo || x > xhi) continue; body += L(F.sx(x), F.top, F.sx(x), F.bot, { w: 1.5, c: INK, dash: '6 5' }) + T(F.sx(x) + fs * 0.4, F.top + fs * 1.2, String(e.text ?? ''), { fs, bold: true }); }
    const lg = groups.length > 1 || groups[0] !== ' ' ? legend(o, groups.map(g => ({ label: g, color: col(g) })), F.ax, F.yEnd + fs * 0.5) : { s: '', y: F.yEnd }; body += lg.s;
    return svgRoot(W, lg.y + fs * 0.6, body, { fs, frame: o.frame });
  },
};
