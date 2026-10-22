// EPI-GRAPHICS · interfaz: galería de plantillas, editor de tablas, vista previa en vivo, formato y exportación.
import { bars } from './f_bars.js?v=2026.10.22-1';
import { forest } from './f_forest.js?v=2026.10.22-1';
import { curves } from './f_curves.js?v=2026.10.22-1';
import { kmFig } from './f_km.js?v=2026.10.22-1';
import { flow } from './f_flow.js?v=2026.10.22-1';
import { schema } from './f_schema.js?v=2026.10.22-1';
import { stacked } from './f_stacked.js?v=2026.10.22-1';
import { PALETTES, U_PER_MM, PT, esc } from './svg.js?v=2026.10.22-1';
import { exportFigure, printFigure, widthMM, save } from './figs.js?v=2026.10.22-1';
import { readFile, parseCSV, toCSV, download } from './io.js?v=2026.10.22-1';
import { HELP_HTML } from './help.js?v=2026.10.22-1';

const TYPES = [bars, forest, curves, kmFig, flow, schema, stacked], $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const STORE = 'epi-graphics-v1';
const style = { widthKey: 'double', mm: 174, dpi: 600, font: 'arial', pt: 8, pal: 'nejm', frame: true };
const figs = {}; let cur = 'bars';

const initState = m => { const ex = m.example(), settings = {}; m.settings.forEach(s => (settings[s.k] = s.def)); return { settings: { ...settings, ...clone(ex.settings) }, tables: clone(ex.tables), data: ex.data ? clone(ex.data) : null }; };
const stOf = id => (figs[id] ||= initState(TYPES.find(t => t.id === id)));
const mod = () => TYPES.find(t => t.id === cur);

// ---------- persistencia ----------
function persist() { try { localStorage.setItem(STORE, JSON.stringify({ style, figs, cur })); } catch { /* sin almacenamiento */ } }
function restore(obj) {
  if (!obj) return;
  Object.assign(style, obj.style || {});
  for (const [k, v] of Object.entries(obj.figs || {})) if (TYPES.some(t => t.id === k)) figs[k] = v;
  if (TYPES.some(t => t.id === obj.cur)) cur = obj.cur;
}
try { restore(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch { /* ignorar */ }

// ---------- pestañas ----------
function showTab(name) {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('main > section.tab').forEach(s => s.classList.toggle('active', s.id === `tab-${name}`));
  const ws = name === 'contenido' || name === 'formato';
  $('main').classList.toggle('ws-on', ws); $('#preview').hidden = !ws;
  if (ws) refresh(false);
  window.scrollTo({ top: 0 });
}
$$('.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) showTab(g.dataset.go); });

// ---------- dibujo ----------
function renderSVG(m = mod(), st = stOf(m.id), W = null) {
  const o = { W: W || widthMM(style) * U_PER_MM, fs: style.pt * PT, pal: PALETTES[style.pal].c, line: PALETTES[style.pal].line || PALETTES[style.pal].c, frame: style.frame };
  return m.render(st, o);
}
function refresh(save_ = true) {
  const m = mod(), st = stOf(m.id); m.sync?.(st);
  let svg = '';
  try { svg = renderSVG(m, st); $('#pv-err').hidden = true; }
  catch (e) { console.error(e); $('#pv-err').hidden = false; $('#pv-err').textContent = `No se pudo dibujar: ${e.message}`; }
  $('#pv-out').innerHTML = svg;
  const el = $('#pv-out svg');
  if (el) { const [, , w, h] = el.getAttribute('viewBox').split(/\s+/).map(Number), mm = widthMM(style); $('#pv-size').textContent = `${mm} mm × ${(mm * h / w).toFixed(0)} mm · letra ${style.pt} pt`; const px = Math.round(mm / 25.4 * style.dpi); $('#fig-info').innerHTML = `<p>Tamaño final: <b>${mm} × ${(mm * h / w).toFixed(0)} mm</b>. PNG/TIFF a ${style.dpi} dpi: <b>${px} × ${Math.round(px * h / w)} px</b>. Letra de ${style.pt} pt (texto mínimo recomendado por la mayoría de revistas: 6 pt).</p>`; }
  if (save_) persist();
}
let timer = null; const later = () => { clearTimeout(timer); timer = setTimeout(() => refresh(), 120); };

// ---------- galería ----------
function buildGallery() {
  $('#gallery').innerHTML = TYPES.map(m => {
    let th = ''; try { th = renderSVG(m, initState(m), 1000); } catch (e) { th = `<p class="err">${esc(e.message)}</p>`; }
    return `<div class="gcard${m.id === cur ? ' active' : ''}" data-type="${m.id}"><div class="thumb">${th}</div><b>${esc(m.name)}</b><small>${esc(m.desc)}</small><button class="primary" data-use="${m.id}">Usar esta plantilla</button></div>`;
  }).join('');
  $$('[data-use]').forEach(b => b.addEventListener('click', () => { cur = b.dataset.use; $$('.gcard').forEach(c => c.classList.toggle('active', c.dataset.type === cur)); buildEditor(); persist(); showTab('contenido'); }));
}

// ---------- editor ----------
function buildEditor() {
  const m = mod(), st = stOf(m.id);
  $('#ed-title').textContent = m.name; $('#ed-desc').textContent = m.desc;
  // datos individuales (Kaplan-Meier)
  const dEl = $('#ed-data'); dEl.innerHTML = '';
  if (m.needsData) {
    dEl.innerHTML = `<div class="drop slim"><input type="file" id="km-file" accept=".csv,.txt,.tsv,.xlsx,.xls"><label for="km-file"><b>Cargar base (CSV/Excel)</b> o <a href="#" id="km-ex">usar el ejemplo simulado</a></label></div><p class="sub" id="km-info"></p>`;
    const info = () => { $('#km-info').textContent = st.data ? `Base «${st.data.name}»: ${st.data.rows.length} filas · variables: ${Object.keys(st.data.rows[0] || {}).join(', ')}` : 'Sin base cargada.'; };
    info();
    $('#km-ex').addEventListener('click', e => { e.preventDefault(); const ex = m.example(); st.data = ex.data; Object.assign(st.settings, ex.settings); st.tables = clone(ex.tables); buildEditor(); refresh(); });
    $('#km-file').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const r = await readFile(f), name = Object.keys(r.sheets)[0], rows = r.sheets[name]; if (!rows.length) throw new Error('El archivo no tiene filas.'); st.data = { name: f.name, rows }; const cols = Object.keys(rows[0]); const guess = re => cols.find(c => re.test(c)) || ''; st.settings.time ||= guess(/time|tiempo|month|mes|day|dia|días|dias|follow/i); st.settings.status ||= guess(/status|event|evento|death|muerte|fail/i); buildEditor(); refresh(); }
      catch (err) { $('#km-info').textContent = `Error: ${err.message}`; }
    });
  }
  // ajustes
  const cols = st.data?.rows?.[0] ? Object.keys(st.data.rows[0]) : [];
  $('#ed-settings').innerHTML = m.settings.map(s => {
    const v = st.settings[s.k] ?? s.def ?? '';
    if (s.type === 'check') return `<label class="inline"><input type="checkbox" data-s="${s.k}" ${v ? 'checked' : ''}> ${esc(s.label)}</label>`;
    if (s.type === 'select') return `<label>${esc(s.label)}<select data-s="${s.k}">${s.opts.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}"${String(v) === String(val) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}</select></label>`;
    if (s.type === 'var') return `<label>${esc(s.label)}<select data-s="${s.k}">${s.optional ? '<option value="">— ninguna —</option>' : ''}${cols.map(c => `<option${v === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>`;
    if (s.type === 'textarea') return `<label class="wide">${esc(s.label)}<textarea data-s="${s.k}" rows="${s.rows || 8}" spellcheck="false">${esc(v)}</textarea></label>`;
    return `<label>${esc(s.label)}<input data-s="${s.k}" type="${s.type === 'number' ? 'number' : 'text'}"${s.step ? ` step="${s.step}"` : ''} value="${esc(v)}"></label>`;
  }).join('');
  $$('#ed-settings [data-s]').forEach(el => el.addEventListener('input', () => {
    const k = el.dataset.s, def = m.settings.find(s => s.k === k); st.settings[k] = el.type === 'checkbox' ? el.checked : def.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value;
    if (def.type === 'var') { m.sync?.(st); buildTables(); }
    later();
  }));
  buildTables();
}

function buildTables() {
  const m = mod(), st = stOf(m.id), host = $('#ed-tables'); host.innerHTML = '';
  for (const T of m.tables) {
    const rows = (st.tables[T.k] ||= []), card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="row between wrap gap"><h3 class="nm">${esc(T.label)}</h3><div class="row gap wrap"><button class="ghost sm" data-a="add">+ Fila</button><button class="ghost sm" data-a="paste">Pegar desde Excel</button><button class="ghost sm" data-a="csv">CSV ↓</button><label class="ghost filebtn sm">CSV ↑<input type="file" accept=".csv,.txt,.tsv" hidden></label></div></div>${T.help ? `<p class="sub">${esc(T.help)}</p>` : ''}<div class="tablewrap"><table class="data grid"><thead></thead><tbody></tbody></table></div>`;
    host.appendChild(card);
    const head = $('thead', card), body = $('tbody', card);
    head.innerHTML = `<tr>${T.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr>`;
    const draw = () => {
      body.innerHTML = rows.map((r, i) => `<tr>${T.cols.map(c => `<td>${cell(c, r[c.k], i)}</td>`).join('')}<td><button class="x" data-del="${i}" title="Eliminar fila" aria-label="Eliminar fila">×</button></td></tr>`).join('');
    };
    const cell = (c, v, i) => {
      v = v ?? '';
      if (c.type === 'select') return `<select data-r="${i}" data-c="${c.k}">${c.opts.map(o => `<option${String(v) === String(o) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      if (c.type === 'color') return `<span class="colorcell"><input type="color" data-r="${i}" data-c="${c.k}" value="${/^#[0-9a-f]{6}$/i.test(v) ? v : '#cccccc'}"${v ? '' : ' class="auto"'} title="${v ? '' : 'automático (paleta)'}"><button class="x" data-clr="${i}|${c.k}" title="Color automático">auto</button></span>`;
      return `<input data-r="${i}" data-c="${c.k}" type="text" inputmode="${c.type === 'num' ? 'decimal' : 'text'}" style="width:${c.w || 120}px" value="${esc(v)}">`;
    };
    draw();
    card.addEventListener('input', e => { const el = e.target; if (el.dataset.r == null) return; rows[+el.dataset.r][el.dataset.c] = el.value; if (el.type === 'color') el.classList.remove('auto'); later(); });
    card.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.del != null) { rows.splice(+t.dataset.del, 1); draw(); later(); }
      else if (t.dataset.clr) { const [i, k] = t.dataset.clr.split('|'); rows[+i][k] = ''; draw(); later(); }
      else if (t.dataset.a === 'add') { const last = rows[rows.length - 1] || {}, nr = Object.fromEntries(T.cols.map(c => [c.k, c.k === 'panel' ? last.panel ?? '' : ''])); rows.push(nr); draw(); later(); }
      else if (t.dataset.a === 'csv') download(`${m.id}_${T.k}.csv`, toCSV(rows, T.cols.map(c => c.k)), 'text/csv');
      else if (t.dataset.a === 'paste') pasteDialog(T, rows, () => { draw(); later(); });
    });
    $('input[type=file]', card).addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; applyText(await f.text(), T, rows); draw(); later(); e.target.value = ''; });
  }
}

// lee texto tabular (Excel pega con tabuladores) y reemplaza las filas de la tabla
function applyText(text, T, rows) {
  const first = text.split(/\r?\n/)[0] || '', delim = first.includes('\t') ? '\t' : (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const grid = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '').map(l => l.split(delim).map(c => c.trim().replace(/^"|"$/g, '')));
  if (!grid.length) return;
  const norm = s => String(s).toLowerCase().replace(/\s+/g, ''), keys = T.cols.map(c => [norm(c.k), norm(c.label)]);
  const map = grid[0].map(h => keys.findIndex(k => k.includes(norm(h)))), isHead = map.filter(i => i >= 0).length >= Math.max(1, Math.min(2, T.cols.length)) && grid[0].every(h => isNaN(parseFloat(h)));
  const data = isHead ? grid.slice(1) : grid;
  const out = data.map(r => { const o = Object.fromEntries(T.cols.map(c => [c.k, ''])); r.forEach((v, j) => { const idx = isHead ? map[j] : j; if (idx >= 0 && T.cols[idx]) o[T.cols[idx].k] = v; }); return o; });
  rows.splice(0, rows.length, ...out);
}
function pasteDialog(T, rows, done) {
  const d = document.createElement('dialog'); d.innerHTML = `<form method="dialog"><h3>Pegar desde Excel</h3><p class="sub">Copie las celdas en Excel (con o sin encabezado) y péguelas aquí. Columnas esperadas: <b>${T.cols.map(c => esc(c.label)).join(' · ')}</b>. Reemplaza las filas actuales.</p><textarea rows="10" placeholder="Pegue aquí…"></textarea><div class="row gap mt"><button value="ok" class="primary">Aplicar</button><button value="cancel" class="ghost">Cancelar</button></div></form>`;
  document.body.appendChild(d); d.showModal();
  d.addEventListener('close', () => { if (d.returnValue === 'ok') { applyText($('textarea', d).value, T, rows); done(); } d.remove(); });
}

// ---------- formato ----------
function bindStyle() {
  $('#fig-pal').innerHTML = Object.entries(PALETTES).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('');
  const set = () => { $('#fig-width').value = style.widthKey; $('#fig-mm').value = style.mm; $('#fig-dpi').value = style.dpi; $('#fig-font').value = style.font; $('#fig-pt').value = style.pt; $('#fig-pal').value = style.pal; $('#fig-frame').checked = style.frame; $('#fig-mm').disabled = style.widthKey !== 'custom'; };
  set();
  const upd = () => { Object.assign(style, { widthKey: $('#fig-width').value, mm: +$('#fig-mm').value || 174, dpi: +$('#fig-dpi').value, font: $('#fig-font').value, pt: +$('#fig-pt').value || 8, pal: $('#fig-pal').value, frame: $('#fig-frame').checked }); $('#fig-mm').disabled = style.widthKey !== 'custom'; later(); };
  ['fig-width', 'fig-mm', 'fig-dpi', 'fig-font', 'fig-pt', 'fig-pal', 'fig-frame'].forEach(id => $(`#${id}`).addEventListener('input', upd));
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-dl]'); if (!b) return;
    const svg = $('#pv-out svg'); if (!svg) return; const t = b.textContent; b.textContent = '…';
    try { await exportFigure(svg, `${mod().id}`, b.dataset.dl, style); $('#dl-msg').textContent = `Descargado (${b.dataset.dl.toUpperCase()}).`; } catch (err) { alert(`No se pudo exportar: ${err.message}`); }
    b.textContent = t;
  });
  $('#dl-pdf').addEventListener('click', () => { try { printFigure($('#pv-out svg'), style); } catch (err) { alert(err.message); } });
  $('#ed-reset').addEventListener('click', () => { if (confirm('¿Restaurar el ejemplo de esta plantilla? Se perderán los cambios de este tipo de figura.')) { figs[cur] = initState(mod()); buildEditor(); refresh(); } });
  $('#pj-save').addEventListener('click', () => save('epi-graphics-proyecto.json', new Blob([JSON.stringify({ app: 'EPI-GRAPHICS', version: '2026.10.22-1', style, figs, cur }, null, 1)], { type: 'application/json' })));
  $('#pj-open').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); if (o.app !== 'EPI-GRAPHICS') throw new Error('No es un proyecto de EPI-GRAPHICS.'); restore(o); set(); buildGallery(); buildEditor(); refresh(); } catch (err) { alert(`No se pudo abrir: ${err.message}`); } e.target.value = ''; });
  // botones de descarga rápida bajo la vista previa
  $('#preview').insertAdjacentHTML('beforeend', '<div class="figbar"><span>Descargar:</span><button type="button" data-dl="svg">SVG</button><button type="button" data-dl="png">PNG</button><button type="button" data-dl="tiff">TIFF</button></div>');
}

$('#help').innerHTML = HELP_HTML;
bindStyle(); buildGallery(); buildEditor();
window.__epi = { renderSVG, TYPES, style, initState };
