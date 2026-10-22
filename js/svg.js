// Primitivas SVG para figuras de revista: medición de texto, ajuste de línea, ejes, flechas y colores.
// Unidades: 1 unidad = 1/5.75 mm (un lienzo de 174 mm mide 1000 unidades). El texto se define en pt.
export const U_PER_MM = 5.75;
export const PT = 0.3528 * U_PER_MM; // unidades por punto tipográfico
export const INK = '#252525', FRAME = '#606064', ZEBRA = '#F1F3F2', GREY = '#8E8E8E';
export const FAMILY = 'Arial, Helvetica, "Liberation Sans", sans-serif';

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const num = v => (v === '' || v == null ? NaN : Number(String(v).replace(',', '.')));
export const minus = s => String(s).replace(/-(?=\d)/g, '−'); // signo menos tipográfico
export const fmt = (v, d = 2) => (isFinite(v) ? minus(Number(v).toFixed(d)) : '');

// ancho de texto: lienzo del navegador o aproximación de Arial en Node
let ctx = null;
const ARIAL = { ' ': .278, i: .222, l: .222, j: .222, t: .278, f: .278, r: .333, I: .278, '.': .278, ',': .278, ':': .278, ';': .278, '|': .26, '(': .333, ')': .333, '-': .333, '/': .278, m: .833, w: .722, W: .944, M: .833, '%': .889 };
export function textW(s, fs, bold = false, italic = false) {
  s = String(s);
  if (typeof document !== 'undefined') {
    ctx ||= document.createElement('canvas').getContext('2d');
    ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fs}px Arial, "Liberation Sans", Helvetica, sans-serif`;
    return ctx.measureText(s).width;
  }
  let w = 0; for (const ch of s) w += ARIAL[ch] ?? (/[A-Z]/.test(ch) ? .68 : /\d/.test(ch) ? .556 : .5); return w * fs * (bold ? 1.06 : 1);
}
// ajusta el texto a un ancho máximo; '|' o '\n' fuerzan salto de línea
export function wrap(s, maxW, fs, bold = false) {
  const out = [];
  for (const para of String(s ?? '').split(/\||\n/)) {
    const words = para.trim().split(/\s+/).filter(Boolean); let cur = '';
    if (!words.length) { out.push(''); continue; }
    for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (cur && textW(t, fs, bold) > maxW) { out.push(cur); cur = w; } else cur = t; }
    out.push(cur);
  }
  return out;
}
export const lines = s => String(s ?? '').split(/\||\n/);

// texto (varias líneas) con ancla; y = línea base de la primera línea
export function T(x, y, str, { fs = 16, bold = false, italic = false, anchor = 'start', fill = INK, lh = 1.22, rotate = null, op = null } = {}) {
  const ls = Array.isArray(str) ? str : lines(str);
  const tr = rotate != null ? ` transform="rotate(${rotate} ${x.toFixed(1)} ${y.toFixed(1)})"` : '';
  const sp = ls.map((l, i) => `<tspan x="${x.toFixed(1)}" dy="${i ? (fs * lh).toFixed(1) : 0}">${esc(l)}</tspan>`).join('');
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}"${bold ? ' font-weight="bold"' : ''}${italic ? ' font-style="italic"' : ''} text-anchor="${anchor}" fill="${fill}"${op != null ? ` fill-opacity="${op}"` : ''}${tr}>${sp}</text>`;
}
export const L = (x1, y1, x2, y2, { w = 1.5, c = INK, dash = null, cap = 'butt' } = {}) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
export const R = (x, y, w, h, { fill = 'none', stroke = 'none', sw = 1.5, rx = 0 } = {}) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${rx ? ` rx="${rx}"` : ''}/>`;
// punta de flecha rellena en (x,y) que mira hacia el ángulo ang (rad)
export function head(x, y, ang, { s = 9, c = INK } = {}) {
  const p = [[0, 0], [-s, -s * 0.42], [-s, s * 0.42]].map(([a, b]) => `${(x + a * Math.cos(ang) - b * Math.sin(ang)).toFixed(1)},${(y + a * Math.sin(ang) + b * Math.cos(ang)).toFixed(1)}`).join(' ');
  return `<polygon points="${p}" fill="${c}"/>`;
}
export function arrow(x1, y1, x2, y2, o = {}) {
  const ang = Math.atan2(y2 - y1, x2 - x1), s = o.s ?? 9;
  return L(x1, y1, x2 - s * 0.8 * Math.cos(ang), y2 - s * 0.8 * Math.sin(ang), o) + head(x2, y2, ang, { s, c: o.c || INK });
}
export function marker(shape, x, y, r, c) {
  if (shape === 'square') return `<rect x="${(x - r).toFixed(1)}" y="${(y - r).toFixed(1)}" width="${2 * r}" height="${2 * r}" fill="${c}"/>`;
  if (shape === 'triangle') return `<polygon points="${x.toFixed(1)},${(y - r * 1.2).toFixed(1)} ${(x - r * 1.15).toFixed(1)},${(y + r * .95).toFixed(1)} ${(x + r * 1.15).toFixed(1)},${(y + r * .95).toFixed(1)}" fill="${c}"/>`;
  if (shape === 'diamond') return `<polygon points="${x.toFixed(1)},${(y - r * 1.3).toFixed(1)} ${(x + r * 1.3).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${(y + r * 1.3).toFixed(1)} ${(x - r * 1.3).toFixed(1)},${y.toFixed(1)}" fill="${c}"/>`;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>`;
}

export function niceTicks(lo, hi, n = 5) {
  const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || mag * 10, out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}
// etiquetas de marcas con el mismo número de decimales (0.0, 0.5, 1.0)
export const fmtTicks = vals => { const d = Math.min(3, Math.max(0, ...vals.map(v => { const t = String(+Number(v).toFixed(6)); return t.includes('.') ? t.split('.')[1].length : 0; }))); return vals.map(v => minus(Number(v).toFixed(d))); };
export const tickLabel = (v, d = null) => { const s = d != null ? Number(v).toFixed(d) : String(+Number(v).toPrecision(6)); return minus(s); };

// escala de un eje: lineal, log o por tramos con marcas equiespaciadas
export function makeScale(kind, ticks, lo, hi, a, b) {
  if (kind === 'ticks' && ticks.length > 1) {
    const t = [...ticks].sort((x, y) => x - y), step = (b - a) / (t.length - 1);
    return v => { if (v <= t[0]) return a - (t[0] - v) / (t[1] - t[0]) * step * 0.5; if (v >= t[t.length - 1]) return b + (v - t[t.length - 1]) / (t[t.length - 1] - t[t.length - 2]) * step * 0.5; let i = 0; while (v > t[i + 1]) i++; return a + (i + (v - t[i]) / (t[i + 1] - t[i])) * step; };
  }
  if (kind === 'log') { const A = Math.log(lo), B = Math.log(hi); return v => a + (Math.log(Math.max(v, 1e-12)) - A) / (B - A) * (b - a); }
  return v => a + (v - lo) / ((hi - lo) || 1) * (b - a);
}

// raíz del SVG: lienzo blanco con marco gris opcional
export function svgRoot(W, H, body, { frame = true, fs = 16 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" class="plot" font-family='${FAMILY}' font-size="${fs}" fill="${INK}" role="img"><rect width="${W.toFixed(0)}" height="${H.toFixed(0)}" fill="#fff"/>${body}${frame ? R(1.5, 1.5, W - 3, H - 3, { stroke: FRAME, sw: 3 }) : ''}</svg>`;
}
export const lum = hex => { const h = String(hex).replace('#', ''); const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0'); const [r, g, b] = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const PALETTES = {
  nejm: { name: 'NEJM azul (claro → oscuro, gris)', c: ['#B0C7D3', '#6F9AAD', '#326A82', '#808488', '#4D4D4D', '#A8B5BA'], line: ['#00729E', '#8E8E8E', '#326A82', '#4D4D4D', '#6F9AAD', '#B0C7D3'] },
  nejm2: { name: 'NEJM azul oscuro y gris', c: ['#00729E', '#8E8E8E', '#B0C7D3', '#326A82', '#4D4D4D', '#6F9AAD'] },
  epi: { name: 'EPI-LAB (azul verdoso, burdeos, carbón)', c: ['#2E7F90', '#8B2E3B', '#4D4D4D', '#5BA7B8', '#C46B78', '#8FA9AF'] },
  gray: { name: 'Escala de grises (impresión B/N)', c: ['#D9D9D9', '#A6A6A6', '#737373', '#404040', '#8C8C8C', '#BFBFBF'], line: ['#262626', '#8C8C8C', '#595959', '#BFBFBF', '#404040', '#A6A6A6'] },
  cb: { name: 'Apto para daltonismo (Okabe-Ito)', c: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#56B4E9', '#CC79A7'] },
};
