// Radar (araña): varias series sobre ejes radiales, con polígonos rellenos y escala común.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, uniq, empty, legend, minus, niceTicks, INK, FRAME } from './kit.js?v=2026.10.25-1';

export const radar = {
  id: 'radar', name: 'Radar (perfil multidimensional)', short: 'Radar',
  desc: 'Perfil de varias dimensiones (p. ej., dominios de calidad de vida, puntajes de riesgo) para uno o más grupos, con polígonos y cuadrícula circular.',
  settings: [
    { k: 'max', label: 'Valor máximo del eje (vacío = automático)', type: 'number', def: '' }, { k: 'min', label: 'Valor mínimo del eje', type: 'number', def: 0 }, { k: 'rings', label: 'Número de anillos', type: 'number', def: 5 }, { k: 'fill', label: 'Rellenar los polígonos', type: 'check', def: true }, { k: 'pts', label: 'Marcar los vértices', type: 'check', def: true },
    { k: 'title', label: 'Título', type: 'text', def: 'Quality-of-Life Domains' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' }, { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.72, step: 0.05 },
  ],
  tables: [{ k: 'data', label: 'Datos', help: 'Una fila por eje y serie. Los ejes se dibujan en el orden de aparición.', cols: [{ k: 'axis', label: 'Eje', type: 'text', w: 200 }, { k: 'series', label: 'Serie', type: 'text', w: 140 }, { k: 'value', label: 'Valor', type: 'num', w: 80 }] }],
  example() { const ax = ['Physical', 'Role', 'Pain', 'General health', 'Vitality', 'Social', 'Mental health']; const a = [72, 65, 70, 58, 62, 80, 74], b = [55, 48, 52, 45, 50, 66, 60]; return { settings: {}, tables: { data: [...ax.map((x, i) => ({ axis: x, series: 'Drug A', value: a[i] })), ...ax.map((x, i) => ({ axis: x, series: 'Placebo', value: b[i] }))] } }; },
  render(st, o) {
    const S = { min: 0, rings: 5, fill: true, pts: true, aspect: 0.72, ...st.settings }, fs = o.fs, W = o.W, d = rowsOf(st, 'data').map(r => ({ a: String(r.axis ?? '').trim(), s: String(r.series ?? '').trim() || ' ', v: num(r.value) })).filter(r => r.a && isFinite(r.v));
    const axes = uniq(d.map(r => r.a)), series = uniq(d.map(r => r.s)); if (axes.length < 3) return empty(o, 'Se necesitan al menos tres ejes.');
    const mn = +S.min || 0, mx = isFinite(num(S.max)) ? num(S.max) : niceTicks(mn, Math.max(...d.map(r => r.v)), 5).at(-1), n = axes.length, ph = W * S.aspect, F = frame(o, { id: S.id, title: S.title, noXAxis: true, noAxisLines: true, noTicks: true, noYLabels: true, x: [0, 1], y: [0, 1], yticks: [], xticks: [], ph }), cx = W / 2, cy = F.top + ph / 2, Rr = Math.min(ph / 2 - fs * 2.2, W * 0.3);
    let body = F.s; const ang = i => (2 * Math.PI * i) / n - Math.PI / 2, P = (i, v) => [cx + Rr * (v - mn) / (mx - mn) * Math.cos(ang(i)), cy + Rr * (v - mn) / (mx - mn) * Math.sin(ang(i))], rings = Math.max(2, +S.rings || 5);
    for (let k = 1; k <= rings; k++) { const v = mn + (mx - mn) * k / rings; body += `<polygon points="${axes.map((_, i) => P(i, v).map(c => c.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#C9CCCC" stroke-width="0.9"/>` + T(cx + fs * 0.3, cy - Rr * k / rings + fs * 0.1, fmt(v, v % 1 ? 1 : 0), { fs: fs * 0.8, fill: '#777' }); }
    axes.forEach((a, i) => { const [x, y] = P(i, mx), [lx, ly] = P(i, mx + (mx - mn) * 0.1), c = Math.cos(ang(i)); body += L(cx, cy, x, y, { w: 0.9, c: '#C9CCCC' }) + T(lx, ly + fs * 0.35, a, { fs, anchor: c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle', bold: true }); });
    series.forEach((s, si) => { const c = lineOf(o, si), vals = axes.map(a => d.find(r => r.a === a && r.s === s)?.v), pts = vals.map((v, i) => (isFinite(v) ? P(i, v) : P(i, mn)));
      body += `<polygon points="${pts.map(p => p.map(q => q.toFixed(1)).join(',')).join(' ')}" fill="${S.fill ? c : 'none'}" fill-opacity="0.22" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`; if (S.pts) pts.forEach(p => (body += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${fs * 0.3}" fill="${c}"/>`)); });
    const lg = series.length > 1 || series[0] !== ' ' ? legend(o, series.map((s, i) => ({ label: s, color: lineOf(o, i) })), fs, F.top + ph + fs * 0.6) : { s: '', y: F.top + ph }; body += lg.s;
    return svgRoot(W, lg.y + fs * 0.6, body, { fs, frame: o.frame });
  },
};
