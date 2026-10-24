// Dispersión: puntos (con burbujas opcionales), recta con banda de confianza o curva LOESS, estadísticos y línea de identidad.
import { T, L, R, num, fmt, textW, svgRoot, frame, colOf, lineOf, rowsOf, uniq, natural, empty, legend, minus, niceTicks, INK, FRAME } from './kit.js?v=2026.10.24-2';
import { olsLine, loess, pearson, lcg } from './stat2.js?v=2026.10.24-2';

const norm = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const P_ = p => (p < 0.001 ? 'P<0.001' : `P=${p.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`);
export const scatter = {
  id: 'scatter', name: 'Dispersión y regresión (burbujas, LOESS, banda de IC)', short: 'Dispersión',
  desc: 'Relación entre dos variables cuantitativas: puntos por grupo, recta con banda de confianza o curva LOESS, r y valor P, burbujas y línea de identidad. Admite ejes logarítmicos.',
  settings: [
    { k: 'fit', label: 'Ajuste', type: 'select', opts: [['linear', 'Recta (mínimos cuadrados)'], ['loess', 'LOESS (curva suave)'], ['none', 'Sin ajuste']], def: 'linear' },
    { k: 'band', label: 'Banda de confianza 95 % (recta)', type: 'check', def: true }, { k: 'fitBy', label: 'Ajustar por grupo', type: 'select', opts: [['group', 'Un ajuste por grupo'], ['all', 'Un solo ajuste']], def: 'group' },
    { k: 'span', label: 'Suavizado LOESS (0,2–1)', type: 'number', def: 0.75, step: 0.05 }, { k: 'stats', label: 'Mostrar r, pendiente y P', type: 'check', def: true },
    { k: 'ident', label: 'Línea de identidad (y = x)', type: 'check', def: false }, { k: 'logx', label: 'Eje X logarítmico', type: 'check', def: false }, { k: 'logy', label: 'Eje Y logarítmico', type: 'check', def: false },
    { k: 'alpha', label: 'Opacidad de los puntos (0–1)', type: 'number', def: 0.7, step: 0.1 }, { k: 'rad', label: 'Tamaño del punto (× letra)', type: 'number', def: 0.28, step: 0.02 },
    { k: 'title', label: 'Título', type: 'text', def: 'Baseline Proteinuria and Change in eGFR' }, { k: 'id', label: 'Letra del panel', type: 'text', def: '' },
    { k: 'xlab', label: 'Título del eje X', type: 'text', def: 'Urinary Protein-to-Creatinine Ratio at Baseline' }, { k: 'ylab', label: 'Título del eje Y', type: 'text', def: 'Change in eGFR (ml/min/1.73 m²)' },
    { k: 'aspect', label: 'Altura (proporción del ancho)', type: 'number', def: 0.62, step: 0.05 },
  ],
  tables: [
    { k: 'groups', label: 'Grupos (orden y color; vacío = por aparición)', cols: [{ k: 'name', label: 'Grupo', type: 'text', w: 200 }, { k: 'color', label: 'Color', type: 'color', w: 90 }] },
    { k: 'data', label: 'Datos', help: 'Una fila por punto. Grupo, tamaño (burbuja) y etiqueta son opcionales.', cols: [{ k: 'x', label: 'X', type: 'num', w: 80 }, { k: 'y', label: 'Y', type: 'num', w: 80 }, { k: 'group', label: 'Grupo', type: 'text', w: 150 }, { k: 'size', label: 'Tamaño', type: 'num', w: 70 }, { k: 'label', label: 'Etiqueta', type: 'text', w: 120 }] },
  ],
  example() {
    const r = lcg(3), rows = [];
    for (const [g, slope, ic] of [['Placebo', -2.4, -1.5], ['Atacicept', -0.5, 0.8]]) for (let i = 0; i < 70; i++) { const lx = Math.log(0.4) + r() * (Math.log(8) - Math.log(0.4)), x = Math.exp(lx); rows.push({ x: +x.toFixed(2), y: +(ic + slope * Math.log(x) + 2.2 * norm(r)).toFixed(2), group: g, size: '', label: '' }); }
    return { settings: { logx: true }, tables: { groups: [{ name: 'Placebo', color: '' }, { name: 'Atacicept', color: '' }], data: rows } };
  },
  render(st, o) {
    const S = { fit: 'linear', band: true, fitBy: 'group', span: 0.75, stats: true, ident: false, logx: false, logy: false, alpha: 0.7, rad: 0.28, aspect: 0.62, ...st.settings }, fs = o.fs, W = o.W;
    let data = rowsOf(st, 'data').map(r => ({ x: num(r.x), y: num(r.y), g: String(r.group ?? '').trim(), s: num(r.size), l: String(r.label ?? '').trim() })).filter(r => isFinite(r.x) && isFinite(r.y) && (!S.logx || r.x > 0) && (!S.logy || r.y > 0));
    if (data.length < 2) return empty(o, 'Pegue al menos dos puntos (X e Y).');
    const tx = v => (S.logx ? Math.log10(v) : v), ty = v => (S.logy ? Math.log10(v) : v), ordered = rowsOf(st, 'groups').map(r => String(r.name).trim()).filter(Boolean);
    const groups = uniq(data.map(d => d.g)).sort((a, b) => (ordered.includes(a) ? ordered.indexOf(a) : 99) - (ordered.includes(b) ? ordered.indexOf(b) : 99) || natural(a, b)), col = g => rowsOf(st, 'groups').find(r => String(r.name).trim() === g)?.color || lineOf(o, groups.indexOf(g));
    const xs = data.map(d => tx(d.x)), ys = data.map(d => ty(d.y)), padx = (Math.max(...xs) - Math.min(...xs)) * 0.04 || 1, pady = (Math.max(...ys) - Math.min(...ys)) * 0.06 || 1;
    let xlo = Math.min(...xs) - padx, xhi = Math.max(...xs) + padx, ylo = Math.min(...ys) - pady, yhi = Math.max(...ys) + pady;
    const ticks = (lo, hi, lg) => (lg ? (() => { const t = []; for (let k = Math.floor(lo) - 1; k <= Math.ceil(hi); k++) for (const m of [1, 2, 5]) { const v = Math.log10(m) + k; if (v >= lo - 1e-9 && v <= hi + 1e-9) t.push(v); } return t.length >= 2 ? t : [lo, hi]; })() : niceTicks(lo, hi, 6)), fm = lg => (lg ? v => minus(String(+Math.pow(10, v).toPrecision(3))) : null);
    if (S.logx) { /* el dominio no se extiende hasta la siguiente potencia de 10 */ } else { const t = niceTicks(xlo, xhi, 6); xlo = Math.min(xlo, t[0]); xhi = Math.max(xhi, t.at(-1)); }
    if (S.logy) { /* idem */ } else { const t = niceTicks(ylo, yhi, 5); ylo = Math.min(ylo, t[0]); yhi = Math.max(yhi, t.at(-1)); }
    const F = frame(o, { y0: 0, id: S.id, title: S.title, x: [xlo, xhi], y: [ylo, yhi], xticks: ticks(xlo, xhi, S.logx), yticks: ticks(ylo, yhi, S.logy), xfmt: fm(S.logx), yfmt: fm(S.logy), xlab: S.xlab, ylab: S.ylab, ph: W * 0.8 * S.aspect });
    let body = F.s; const clipId = 'sc' + Math.abs(W | 0) + groups.length;
    body += `<clipPath id="${clipId}"><rect x="${F.ax}" y="${F.top}" width="${F.pw}" height="${F.ph}"/></clipPath><g clip-path="url(#${clipId})">`;
    if (S.ident) { const a = Math.max(xlo, ylo), b = Math.min(xhi, yhi); body += L(F.sx(a), F.sy(a), F.sx(b), F.sy(b), { w: 1.4, c: '#8E8E8E', dash: '6 5' }); }
    const sizes = data.map(d => d.s).filter(isFinite), smax = Math.max(...sizes, 0);
    const radOf = d => (smax > 0 && isFinite(d.s) ? fs * (S.rad * 1.4 + 1.3 * Math.sqrt(d.s / smax)) : fs * S.rad);
    const sets = S.fitBy === 'all' ? [{ g: null, pts: data, c: INK }] : groups.map(g => ({ g, pts: data.filter(d => d.g === g), c: col(g) }));
    // ajuste (debajo de los puntos para que no los tape)
    const statsTxt = [];
    for (const set of sets) { const px = set.pts.map(d => tx(d.x)), py = set.pts.map(d => ty(d.y)); if (px.length < 4 || S.fit === 'none') continue;
      if (S.fit === 'linear') { const f = olsLine(px, py), g0 = Math.min(...px), g1 = Math.max(...px), grid = Array.from({ length: 41 }, (_, i) => g0 + (g1 - g0) * i / 40);
        if (S.band) { const up = grid.map(v => [F.sx(v), F.sy(f.at(v).hi)]), dn = grid.map(v => [F.sx(v), F.sy(f.at(v).lo)]).reverse(); body += `<path d="M${[...up, ...dn].map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z" fill="${set.c}" fill-opacity="0.16"/>`; }
        body += `<path d="M${grid.map(v => `${F.sx(v).toFixed(1)},${F.sy(f.a + f.b * v).toFixed(1)}`).join('L')}" fill="none" stroke="${set.c}" stroke-width="3"/>`;
        statsTxt.push({ c: set.c, t: `${set.g ? set.g + ': ' : ''}r = ${fmt(f.r, 2)}, ${S.logx ? 'pendiente' : 'β'} = ${fmt(f.b, 2)}, ${P_(f.p)}` });
      } else { const c = loess(px, py, +S.span || 0.75); body += `<path d="M${c.map(p => `${F.sx(p[0]).toFixed(1)},${F.sy(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="${set.c}" stroke-width="3"/>`; statsTxt.push({ c: set.c, t: `${set.g ? set.g + ': ' : ''}r = ${fmt(pearson(px, py), 2)}` }); } }
    for (const d of data) { const c = col(d.g); body += `<circle cx="${F.sx(tx(d.x)).toFixed(1)}" cy="${F.sy(ty(d.y)).toFixed(1)}" r="${radOf(d).toFixed(1)}" fill="${c}" fill-opacity="${S.alpha}" stroke="${smax > 0 ? '#fff' : 'none'}" stroke-width="0.8"/>`; }
    body += '</g>';
    for (const d of data) if (d.l) body += T(F.sx(tx(d.x)) + radOf(d) + fs * 0.3, F.sy(ty(d.y)) + fs * 0.3, d.l, { fs: fs * 0.9 });
    if (S.stats && statsTxt.length) statsTxt.forEach((s, i) => (body += T(F.ax + fs * 0.8, F.top + fs * (1.4 + 1.3 * i), s.t, { fs, fill: s.c, bold: true })));
    let y = F.yEnd;
    if (groups.length > 1 || groups[0]) { const lg = legend(o, groups.filter(Boolean).map(g => ({ label: g, color: col(g) })), F.ax, y + fs * 0.5, { shape: 'circle' }); body += lg.s; y = lg.y; }
    if (smax > 0) { body += T(F.ax, y + fs * 0.9, `Área de la burbuja ∝ tamaño (máx. = ${fmt(smax, smax < 10 ? 1 : 0)})`, { fs: fs * 0.9 }); y += fs * 1.6; }
    return svgRoot(W, y + fs * 0.6, body, { fs, frame: o.frame });
  },
};
