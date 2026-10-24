// Esquema del diseño del estudio: fases → aleatorización → brazos de tratamiento → seguimiento, con línea de tiempo.
import { T, L, R, arrow, textW, wrap, svgRoot, INK } from './svg.js?v=2026.10.24-2';

export const schema = {
  id: 'schema', name: 'Esquema del diseño del estudio', short: 'Diseño',
  desc: 'Fases del estudio, aleatorización, brazos de tratamiento coloreados, periodo de seguimiento y línea de tiempo con interrupciones.',
  settings: [
    { k: 'armsTitle', label: 'Título sobre los brazos', type: 'text', def: '24-wk Treatment Period' },
    { k: 'followTitle', label: 'Título del seguimiento', type: 'text', def: 'Safety Follow-up' },
    { k: 'splitAt', label: 'Inicio de los brazos (% del ancho)', type: 'number', def: 54 },
    { k: 'armsW', label: 'Ancho de los brazos (% del ancho)', type: 'number', def: 26 },
  ],
  tables: [
    { k: 'stages', label: 'Fases iniciales (de izquierda a derecha)', help: 'La nota se escribe debajo de la fase (sin recuadro); use | para saltar de línea.', cols: [{ k: 'text', label: 'Fase', type: 'text', w: 200 }, { k: 'note', label: 'Nota bajo la fase', type: 'text', w: 360 }] },
    { k: 'arms', label: 'Brazos de tratamiento', cols: [{ k: 'text', label: 'Texto (use | para saltar de línea)', type: 'text', w: 340 }, { k: 'fill', label: 'Color de relleno', type: 'color', w: 90 }, { k: 'follow', label: 'Seguimiento', type: 'select', opts: ['sí', 'no'], w: 90 }] },
    { k: 'timeline', label: 'Línea de tiempo', help: 'Posición = % del ancho (0–100). «Interrupción» dibuja // entre esta marca y la siguiente.', cols: [{ k: 'label', label: 'Rótulo (1.ª línea en negrita)', type: 'text', w: 280 }, { k: 'pos', label: 'Posición %', type: 'num', w: 90 }, { k: 'brk', label: 'Interrupción después', type: 'select', opts: ['', 'sí'], w: 120 }] },
  ],
  example() {
    return {
      settings: {},
      tables: {
        stages: [{ text: 'Screening', note: '' }, { text: 'Kidney biopsy', note: '' }, { text: 'Randomization', note: 'Adults with eGFR 25–60 ml/min/1.73 m² and UPCR ≥1.0 g/g after ≥3 months of stable RAS blockade' }],
        arms: [{ text: 'Drug A, low dose:|10 mg once daily', fill: '#DBEBF6', follow: 'sí' }, { text: 'Drug A, high dose:|20 mg once daily', fill: '#AFD5EA', follow: 'sí' }, { text: 'Active comparator:|Drug B, 40 mg once daily', fill: '#FBF6DA', follow: 'sí' }, { text: 'Placebo once daily', fill: '#DADCE0', follow: 'sí' }],
        timeline: [{ label: 'Day|−28', pos: 4.5, brk: 'sí' }, { label: 'Day 1|(randomization)', pos: 24, brk: '' }, { label: 'Week 24|(end of treatment)', pos: 80, brk: 'sí' }, { label: 'Week 28|(end-of-trial visit)', pos: 92.5, brk: '' }],
      },
    };
  },
  render(st, o) {
    const S = { armsTitle: '', followTitle: '', splitAt: 54, armsW: 26, ...st.settings }, fs = o.fs, W = o.W, lh = 1.22, px = fs * 0.9, py = fs * 0.8, margin = fs * 1.2;
    const stages = (st.tables.stages || []).filter(s => String(s.text ?? '').trim()), arms = (st.tables.arms || []).filter(a => String(a.text ?? '').trim()), tl = (st.tables.timeline || []).filter(t => isFinite(parseFloat(t.pos)));
    if (!stages.length && !arms.length) return svgRoot(W, 120, T(20, 60, 'Añada fases y brazos.', { fs }), { fs, frame: o.frame });
    const ax0 = W * S.splitAt / 100, aw = W * S.armsW / 100, followX0 = ax0 + aw, followX1 = W - margin - fs * 0.5;
    // brazos
    const armBoxes = arms.map(a => { const ls = wrap(a.text, aw - 2 * px, fs); return { ...a, ls, h: ls.length * fs * lh + 2 * py }; });
    const armGap = fs * 0.9, titleH = fs * 2.4, topY = margin + titleH;
    let yy = topY; armBoxes.forEach(b => { b.y = yy; yy += b.h + armGap; });
    const armsBottom = arms.length ? yy - armGap : topY + fs * 6, armsMid = (topY + armsBottom) / 2;
    // fases
    const n = stages.length, leftEnd = ax0 - W * 0.05, gap = W * 0.04, left0 = margin + fs * 0.6, bw = n ? Math.min((leftEnd - left0 - (n - 1) * gap) / n, W * 0.2) : 0;
    const sbx = stages.map((s, i) => { const ls = wrap(s.text, bw - 2 * px, fs); return { ...s, ls, x: left0 + i * (bw + gap), h: ls.length * fs * lh + 2 * py }; });
    const stageH = Math.max(fs * 3.4, ...sbx.map(b => b.h));
    let body = '';
    sbx.forEach((b, i) => {
      const y0 = armsMid - stageH / 2;
      body += R(b.x, y0, bw, stageH, { fill: '#F5F8F7' }) + T(b.x + bw / 2, y0 + stageH / 2 - (b.ls.length - 1) * fs * lh / 2 + fs * 0.35, b.ls, { fs, anchor: 'middle' });
      if (i < n - 1) body += arrow(b.x + bw + 4, armsMid, sbx[i + 1].x - 4, armsMid, { w: 1.5, s: 9 });
      if (b.note) { const nl = wrap(b.note, Math.max(bw * 1.25, fs * 8), fs); b.noteLines = nl; body += T(b.x + bw / 2, y0 + stageH + fs * 1.6, nl, { fs, anchor: 'middle' }); b.noteH = nl.length * fs * lh + fs * 1.6; }
    });
    // conexión a los brazos
    const lastB = sbx[n - 1], splitX = ax0 - W * 0.025;
    if (arms.length) {
      if (lastB) body += L(lastB.x + bw, armsMid, splitX, armsMid, { w: 1.5 });
      const ys = armBoxes.map(b => b.y + b.h / 2);
      if (arms.length > 1) body += L(splitX, ys[0], splitX, ys[ys.length - 1], { w: 1.5 });
      armBoxes.forEach((b, i) => { body += arrow(splitX, ys[i], ax0 - 3, ys[i], { w: 1.5, s: 9 }); body += R(ax0, b.y, aw, b.h, { fill: b.fill || '#DBEBF6' }) + T(ax0 + aw / 2, b.y + b.h / 2 - (b.ls.length - 1) * fs * lh / 2 + fs * 0.35, b.ls, { fs, anchor: 'middle' }); });
      if (S.armsTitle) body += T(ax0 + aw / 2, margin + fs * 1.1, S.armsTitle, { fs, bold: true, anchor: 'middle' });
      const fol = armBoxes.filter(b => b.follow !== 'no');
      if (S.followTitle && fol.length) body += T((followX0 + followX1) / 2, margin + fs * 1.1, S.followTitle, { fs, bold: true, anchor: 'middle' });
      fol.forEach(b => { const y = b.y + b.h / 2, brk = followX0 + (followX1 - followX0) * 0.45; body += L(followX0, y, brk, y, { w: 1.5 }) + arrow(brk + fs * 0.6, y, followX1, y, { w: 1.5, s: 9 }); });
    }
    // línea de tiempo
    const contentBottom = Math.max(armsBottom, ...sbx.map(b => armsMid + stageH / 2 + (b.noteH || 0))), axY = contentBottom + fs * 3.2;
    if (tl.length) {
      const xs = tl.map(t => W * parseFloat(t.pos) / 100), x0 = Math.min(...xs) - fs * 0.2, x1 = W - margin * 0.6;
      body += L(x0, axY, x1, axY, { w: 1.5 });
      // rótulos: ancho acotado por la distancia a los vecinos y desplazamiento horizontal para evitar solapes
      const lab = tl.map((t, i) => {
        const near = Math.min(...xs.map((x, k) => (k === i ? Infinity : Math.abs(x - xs[i])))), maxW = Math.max(fs * 5.5, Math.min(W * 0.2, near * 0.92));
        const wl = String(t.label ?? '').split('|').flatMap((l, k) => wrap(l, maxW, fs, k === 0).map(w => ({ t: w, b: k === 0 })));
        return { wl, w: Math.max(...wl.map(l => textW(l.t, fs, l.b))), c: xs[i] };
      });
      for (let pass = 0; pass < 6; pass++) for (let i = 1; i < lab.length; i++) { const need = (lab[i - 1].w + lab[i].w) / 2 + fs * 0.8, d = lab[i].c - lab[i - 1].c; if (d < need) { const sh = (need - d) / 2; lab[i - 1].c -= sh; lab[i].c += sh; } }
      lab.forEach(l => { l.c = Math.min(Math.max(l.c, margin + l.w / 2), W - margin - l.w / 2); });
      tl.forEach((t, i) => {
        body += L(xs[i], axY, xs[i], axY + 8, { w: 1.5 });
        lab[i].wl.forEach((l, k) => { body += T(lab[i].c, axY + 8 + fs * 1.5 + k * fs * lh, l.t, { fs, bold: l.b, anchor: 'middle' }); });
        if (t.brk && i < tl.length - 1) { const bx = (xs[i] + xs[i + 1]) / 2; body += `<rect x="${(bx - 5).toFixed(1)}" y="${(axY - 3).toFixed(1)}" width="10" height="6" fill="#fff"/>` + L(bx - 6, axY + 5, bx + 2, axY - 5, { w: 1.3 }) + L(bx - 2, axY + 5, bx + 6, axY - 5, { w: 1.3 }); }
      });
      const maxLines = Math.max(...lab.map(l => l.wl.length)) + 0.5;
      return svgRoot(W, axY + 8 + fs * 1.5 + maxLines * fs * lh + margin, body, { fs, frame: o.frame });
    }
    return svgRoot(W, contentBottom + margin, body, { fs, frame: o.frame });
  },
};
