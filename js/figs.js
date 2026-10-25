// Exportación de figuras para revistas: SVG vectorial, PNG y TIFF con DPI incrustado, ancho en mm, fondo blanco y fuente elegida.
import { U_PER_MM } from './svg.js?v=2026.10.25-2';
export const WIDTHS = { single: 85, onehalf: 120, double: 174 };
export const FONTS = { arial: 'Arial, Helvetica, sans-serif', helvetica: 'Helvetica, Arial, sans-serif', times: '"Times New Roman", Times, serif' };
export const widthMM = st => (st.widthKey === 'custom' ? Math.max(40, +st.mm || 174) : WIDTHS[st.widthKey] || 174);

function prepare(svg, { mm, font }) {
  const c = svg.cloneNode(true), [, , w, h] = c.getAttribute('viewBox').split(/\s+/).map(Number);
  c.setAttribute('width', `${mm}mm`); c.setAttribute('height', `${(mm * h / w).toFixed(2)}mm`); c.removeAttribute('class');
  c.setAttribute('font-family', FONTS[font] || FONTS.arial);
  return { s: new XMLSerializer().serializeToString(c).replace(/font-family='[^']*'/, `font-family='${FONTS[font] || FONTS.arial}'`), w, h };
}
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function pngWithDpi(buf, dpi) {
  const src = new Uint8Array(buf), ppm = Math.round(dpi / 0.0254), chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1; dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const at = 8 + 25, out = new Uint8Array(src.length + 21); out.set(src.subarray(0, at)); out.set(chunk, at); out.set(src.subarray(at), at + 21); return out;
}
function tiff(img, dpi) {
  const { width: W, height: H, data } = img, n = W * H * 3, ifdN = 12, hdr = 8, ifdSize = 2 + ifdN * 12 + 4, bpsOff = hdr + ifdSize, resOff = bpsOff + 6, dataOff = resOff + 16;
  const buf = new ArrayBuffer(dataOff + n), dv = new DataView(buf), u8 = new Uint8Array(buf);
  u8.set([0x49, 0x49]); dv.setUint16(2, 42, true); dv.setUint32(4, hdr, true);
  let p = hdr; dv.setUint16(p, ifdN, true); p += 2;
  const ent = (tag, type, count, val) => { dv.setUint16(p, tag, true); dv.setUint16(p + 2, type, true); dv.setUint32(p + 4, count, true); if (type === 3 && count === 1) dv.setUint16(p + 8, val, true); else dv.setUint32(p + 8, val, true); p += 12; };
  ent(256, 4, 1, W); ent(257, 4, 1, H); ent(258, 3, 3, bpsOff); ent(259, 3, 1, 1); ent(262, 3, 1, 2); ent(273, 4, 1, dataOff); ent(277, 3, 1, 3); ent(278, 4, 1, H); ent(279, 4, 1, n); ent(282, 5, 1, resOff); ent(283, 5, 1, resOff + 8); ent(296, 3, 1, 2);
  dv.setUint32(p, 0, true);
  [8, 8, 8].forEach((v, i) => dv.setUint16(bpsOff + 2 * i, v, true));
  dv.setUint32(resOff, dpi, true); dv.setUint32(resOff + 4, 1, true); dv.setUint32(resOff + 8, dpi, true); dv.setUint32(resOff + 12, 1, true);
  for (let i = 0, j = dataOff; i < W * H; i++) { u8[j++] = data[4 * i]; u8[j++] = data[4 * i + 1]; u8[j++] = data[4 * i + 2]; }
  return u8;
}
export function save(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
export async function exportFigure(svg, name, fmt, style) {
  const set = { mm: widthMM(style), dpi: +style.dpi || 600, font: style.font }, { s, w, h } = prepare(svg, set);
  const base = name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80) || 'figure';
  if (fmt === 'svg') return save(`${base}.svg`, new Blob([s], { type: 'image/svg+xml' }));
  const pxW = Math.round(set.mm / 25.4 * set.dpi), pxH = Math.round(pxW * h / w);
  if (pxW * pxH > 120e6) throw new Error('La imagen sería demasiado grande; reduzca el ancho o la resolución.');
  const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })), img = new Image(); img.decoding = 'sync';
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const cv = document.createElement('canvas'); cv.width = pxW; cv.height = pxH;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pxW, pxH); ctx.drawImage(img, 0, 0, pxW, pxH); URL.revokeObjectURL(url);
  if (fmt === 'png') { const blob = await new Promise(r => cv.toBlob(r, 'image/png')); return save(`${base}_${set.dpi}dpi.png`, new Blob([pngWithDpi(await blob.arrayBuffer(), set.dpi)], { type: 'image/png' })); }
  return save(`${base}_${set.dpi}dpi.tif`, new Blob([tiff(ctx.getImageData(0, 0, pxW, pxH), set.dpi)], { type: 'image/tiff' }));
}
// PDF vectorial mediante el diálogo de impresión del navegador («Guardar como PDF»), página del tamaño exacto de la figura
export function printFigure(svg, style) {
  const mm = widthMM(style), { s, w, h } = prepare(svg, { mm, font: style.font }), hmm = (mm * h / w).toFixed(2);
  const win = window.open('', '_blank'); if (!win) throw new Error('El navegador bloqueó la ventana emergente.');
  win.document.write(`<!doctype html><title>Figura</title><style>@page{size:${mm}mm ${hmm}mm;margin:0}html,body{margin:0}svg{display:block}</style>${s}`); win.document.close(); setTimeout(() => win.print(), 300);
}
