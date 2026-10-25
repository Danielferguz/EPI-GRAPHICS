// Variantes de plantilla: cada tipo de figura tiene varios ejemplos distintos (otro diseño, otra opción o datos de otro tipo).
// make(ex) recibe una copia del ejemplo base del tipo y devuelve el ejemplo de la variante ({settings, tables, data?}).
// Todos los datos son ficticios. Cualquier variante puede editarse igual que la plantilla base (títulos, columnas, filas, paleta).
const only = (ex, panel) => { const t = ex.tables; t.panels = t.panels.filter(p => p.id === panel); for (const k of Object.keys(t)) if (k !== 'panels' && t[k].length && 'panel' in t[k][0]) t[k] = t[k].filter(r => r.panel === panel); return ex; };
const set = (patch) => ex => { Object.assign(ex.settings, patch); return ex; };
const tbl = (ex, k, rows) => { ex.tables[k] = rows; return ex; };

// generador determinista (para series y nubes de puntos de los ejemplos)
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

const egfrPoints = () => {
  const wk = [0, 4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104], r = rng(11), out = [];
  const A = [0, 1.5, 1.1, 0.8, 0.6, 0.55, 0.3, 1.7, 1.2, 1.15, 1.4, 1.3, 1.15, 1.65, 1.3], P = [0, 0.3, -0.5, -1.3, -2.8, -3.5, -3.7, -4.2, -5.4, -5.9, -6, -6.7, -7.2, -6.8, -7.9];
  wk.forEach((x, i) => {
    const se = i === 0 ? 0 : 0.9 + 0.01 * x, nA = Math.round(259 - 45 * x / 104 - (i ? 3 : 0)), nP = Math.round(251 - 57 * x / 104 - (i ? 4 : 0));
    out.push({ panel: 'A', series: 'Placebo', x, y: P[i], lo: +(P[i] - se * 1.4).toFixed(1), hi: +(P[i] + se * 1.4).toFixed(1), nrisk: nP }, { panel: 'A', series: 'Drug A, 400 mg', x, y: A[i] + 0 * r(), lo: +(A[i] - se).toFixed(1), hi: +(A[i] + se).toFixed(1), nrisk: nA });
  });
  return out;
};

export const VARIANTS = {
  bars: [
    { id: 'single', name: 'Un panel con corchetes', desc: 'Solo el desenlace principal, con valores sobre las barras y comparaciones con OR y P.', make: ex => only(ex, 'A') },
    { id: 'means', name: 'Medias por grupo (una decimal)', desc: 'Media de una variable continua por grupo, con diferencias y P entre corchetes.', make: ex => {
      ex.settings = { dec: 1, barW: 56, suffix: '' };
      tbl(ex, 'panels', [{ id: 'A', title: 'eGFR at Week 52', ylab: 'Mean eGFR (ml/min/1.73 m²)', ymin: 0, ymax: 80, ystep: 10 }]);
      tbl(ex, 'bars', [['Placebo|(N=118)', 48.2], ['Drug A,|10 mg|(N=121)', 51.6], ['Drug A,|20 mg|(N=119)', 55.3]].map(([label, value]) => ({ id: 0, panel: 'A', label, value, color: '' })));
      return tbl(ex, 'brackets', [{ id: 0, panel: 'A', from: 1, to: 2, text: 'Difference, 3.4 (95% CI, 0.1–6.7)' }, { id: 0, panel: 'A', from: 1, to: 3, text: 'Difference, 7.1 (95% CI, 3.9–10.3)|P<0.001' }]); } },
    { id: 'col', name: 'Paneles apilados en columna', desc: 'Dos desenlaces uno encima del otro en lugar de lado a lado.', make: set({ layout: 'col', aspect: 0.4 }) },
    { id: 'wide', name: 'Barras anchas sin valores', desc: 'Versión sobria: barras anchas y sin números, para figuras con muchas comparaciones.', make: set({ barW: 70, showVal: false }) },
  ],
  forest: [
    { id: 'columns', name: 'Subgrupos con columnas de n, medias y diferencia', desc: 'Estilo de tabla de subgrupos del NEJM: n (%), media en cada grupo y diferencia entre grupos (IC 95 %).', make: ex => {
      const R = (label, c1, c2, c3, est, lo, hi, kind = '') => ({ panel: '', label, n1: '', n2: '', est, lo, hi, kind, c1, c2, c3, c4: '' });
      tbl(ex, 'panels', [{ id: '', title: '', h0: 'Subgroup', h1: '', h2: '', hn: '', hm: 'Between-Group Difference (95% CI)', ref: 0, scale: 'linear', ticks: '-12,-8,-4,0,4,8,12', cg: 'Mean Change', cg1: 2, cg2: 3, cu: 'ml/min/1.73 m²', c1: 'Total No. of Patients (%)', c2: 'Drug A', c3: 'Placebo', c4: '', left: 'Placebo Better', right: 'Drug A Better', dec: 2, sep: '–' }]);
      return tbl(ex, 'rows', [R('Overall', '412 (100)', '0.21', '−5.33', 5.54, 3.60, 7.48), R('Age', '', '', '', '', '', '', 'h'), R('<40 yr', '180 (44)', '−1.40', '−8.00', 6.60, 3.55, 9.65), R('≥40 yr', '232 (56)', '1.30', '−3.40', 4.70, 2.30, 7.10),
        R('Sex', '', '', '', '', '', '', 'h'), R('Male', '243 (59)', '−0.90', '−5.60', 4.70, 2.20, 7.20), R('Female', '169 (41)', '1.20', '−5.30', 6.50, 3.40, 9.60), R('Geographic region', '', '', '', '', '', '', 'h'), R('Americas and Europe', '210 (51)', '0.90', '−4.50', 5.40, 2.90, 7.90), R('Asia', '202 (49)', '−1.00', '−6.60', 5.60, 2.70, 8.50),
        R('Baseline UPCR', '', '', '', '', '', '', 'h'), R('<1.5', '221 (54)', '0.40', '−3.00', 3.40, 1.00, 5.80), R('≥1.5', '191 (46)', '−0.60', '−8.50', 7.90, 4.90, 10.90), R('Baseline eGFR', '', '', '', '', '', '', 'h'), R('<45 ml/min/1.73 m²', '124 (30)', '−1.10', '−6.30', 5.20, 2.50, 7.90), R('≥45 ml/min/1.73 m²', '288 (70)', '0.50', '−5.40', 5.90, 3.40, 8.40)]); } },
    { id: 'meta', name: 'Meta-análisis por estudio (RR con pesos)', desc: 'Un estudio por fila, eventos/total por brazo, columna de peso y escala logarítmica.', make: ex => {
      const R = (label, n1, n2, w, est, lo, hi, kind = '') => ({ panel: '', label, n1, n2, est, lo, hi, kind, c1: w, c2: '', c3: '', c4: '' });
      set({ mk: 'square', zebra: false })(ex);
      tbl(ex, 'panels', [{ id: '', title: '', h0: 'Study', h1: 'Drug A', h2: 'Control', hn: 'events/total', hm: 'Risk Ratio (95% CI)', ref: 1, scale: 'log', ticks: '0.25,0.5,1,2', c1: 'Weight (%)', left: 'Favors Drug A', right: 'Favors Control', dec: 2, sep: '–' }]);
      return tbl(ex, 'rows', [R('Alvarez 2015', '48/434', '16/138', '8.4', 0.96, 0.57, 1.64), R('Brown 2016', '37/425', '45/407', '13.1', 0.79, 0.52, 1.20), R('Chen 2017', '41/380', '65/464', '14.7', 0.77, 0.54, 1.11), R('Diaz 2018', '12/124', '18/159', '7.2', 0.85, 0.42, 1.71), R('Evans 2019', '44/425', '7/65', '6.0', 0.96, 0.45, 2.05), R('Garcia 2020', '23/203', '28/251', '10.9', 1.02, 0.60, 1.72), R('Huang 2021', '32/292', '50/326', '13.8', 0.71, 0.47, 1.08), R('Ito 2022', '20/241', '26/198', '9.5', 0.63, 0.36, 1.10), R('Kumar 2023', '24/297', '31/276', '10.1', 0.72, 0.43, 1.20), R('Pooled (random effects)', '', '', '100.0', 0.80, 0.69, 0.93, '')]); } },
    { id: 'events', name: 'Desenlaces con eventos por brazo y HR', desc: 'Lista de desenlaces (cada uno una fila) con eventos/total por brazo y razón de riesgos en escala log.', make: ex => {
      const R = (label, n1, n2, est, lo, hi, kind = '') => ({ panel: '', label, n1, n2, est, lo, hi, kind, c1: '', c2: '', c3: '', c4: '' });
      tbl(ex, 'panels', [{ id: '', title: 'Primary and Secondary End Points', h0: 'End Point', h1: 'Drug A', h2: 'Placebo', hn: 'no. of events/no. of patients', hm: 'Hazard Ratio (95% CI)', ref: 1, scale: 'log', ticks: '0.3,0.5,0.7,1,1.5', left: 'Drug A Better', right: 'Placebo Better', dec: 2, sep: '–' }]);
      return tbl(ex, 'rows', [R('Primary composite', '188/1203', '262/1198', 0.68, 0.56, 0.82), R('Components', '', '', '', '', '', 'h'), R('Kidney failure', '61/1203', '97/1198', 0.62, 0.45, 0.85), R('Sustained ≥40% eGFR decline', '153/1203', '221/1198', 0.66, 0.54, 0.81), R('Death from kidney or cardiovascular causes', '40/1203', '55/1198', 0.72, 0.48, 1.08), R('Secondary', '', '', '', '', '', 'h'), R('Hospitalization for heart failure', '38/1203', '52/1198', 0.73, 0.48, 1.11), R('Death from any cause', '77/1203', '86/1198', 0.89, 0.66, 1.21)]); } },
    { id: 'single', name: 'Un panel lineal (diferencia de medias)', desc: 'Solo el panel B de la plantilla: diferencia en la pendiente de eGFR con marcadores cuadrados.', make: ex => { set({ mk: 'square', zebra: false })(ex); return only(ex, 'B'); } },
  ],
  curves: [
    { id: 'single', name: 'Un panel sin número en riesgo', desc: 'Curvas con IC 95 % y anotación del último valor; sin tabla «No. at Risk».', make: ex => { only(ex, 'A'); ex.tables.panels[0].risk = ''; return ex; } },
    { id: 'egfr', name: 'eGFR a lo largo de 24 meses (línea vertical y anotación)', desc: 'Muchos puntos de tiempo, línea de referencia en cero, línea vertical en la semana final y número en riesgo.', make: ex => {
      set({ aspect: 0.5, annotate: 'last', dec: 1 })(ex);
      tbl(ex, 'panels', [{ id: 'A', title: 'Change in eGFR over 24 mo', ylab: 'Least-Squares Mean Change in eGFR (ml/min/1.73 m²)', ymin: -10, ymax: 4, ystep: 2, xlab: 'Weeks', xticks: '0,4,8,16,24,32,40,48,56,64,72,80,88,96,104', ref: 0, vline: 104, vtext: '', risk: 'sí' }]);
      tbl(ex, 'series', [{ name: 'Placebo', color: '#8E8E8E', marker: 'circle', labelPos: 'below', endText: 'Week 104: −7.9 ml/min/1.73 m²|(95% CI, −9.5 to −6.4)' }, { name: 'Drug A, 400 mg', color: '#00729E', marker: 'triangle', labelPos: 'above', endText: 'Week 104: +1.3 ml/min/1.73 m²|(95% CI, −0.3 to 2.8)' }]);
      return tbl(ex, 'points', egfrPoints()); } },
    { id: 'pct', name: 'Cambio porcentual con valor en cada punto', desc: 'Cambio porcentual respecto del basal, con el valor y el IC escritos sobre cada punto (anotación «todos»).', make: ex => {
      set({ annotate: 'all', dec: 1, aspect: 0.55, errbars: true })(ex);
      tbl(ex, 'panels', [{ id: '', title: '', ylab: 'Geometric Mean Percentage|Change from Baseline', ymin: -60, ymax: 10, ystep: 10, xlab: 'Week', xticks: '0,10,26,34', ref: 0, vline: '', vtext: '', risk: '' }]);
      tbl(ex, 'series', [{ name: 'Placebo', color: '#8E8E8E', marker: 'circle', labelPos: 'above', endText: '' }, { name: 'Drug A', color: '#326A82', marker: 'circle', labelPos: 'above', endText: '' }]);
      const P = (series, x, y, lo, hi) => ({ panel: '', series, x, y, lo, hi, nrisk: '' });
      return tbl(ex, 'points', [P('Placebo', 0, 0, 0, 0), P('Placebo', 10, -8.5, -15.8, 0.5), P('Placebo', 26, -7.2, -16.5, 3.1), P('Placebo', 34, -5.6, -15, 4.9), P('Drug A', 0, 0, 0, 0), P('Drug A', 10, -36.7, -42.6, -30.2), P('Drug A', 26, -47.3, -53.4, -40.4), P('Drug A', 34, -46.6, -53.2, -39)]); } },
    { id: 'lines', name: 'Líneas sin barras de error', desc: 'Solo trayectorias medias (sin IC), útil para muchos grupos o mucha superposición.', make: ex => { only(ex, 'A'); ex.tables.panels[0].risk = ''; return set({ errbars: false, annotate: 'none' })(ex); } },
  ],
  km: [
    { id: 'cuminc', name: 'Incidencia acumulada', desc: 'Probabilidad de evento (1 − supervivencia) con IC y número en riesgo.', make: set({ cuminc: true, ylab: 'Cumulative Incidence of Kidney Failure', title: 'Cumulative Incidence', notePos: 'tl' }) },
    { id: 'inset', name: 'Incidencia baja con recuadro ampliado', desc: 'Evento poco frecuente (≈10 % a 4 años): el recuadro amplía el eje de probabilidad, como en las figuras del NEJM.', make: ex => {
      const r = rng(33), rows = [];
      for (const [arm, rate, n] of [['Placebo', 0.0032, 220], ['Drug A', 0.0018, 220]]) for (let i = 0; i < n; i++) { const t = -Math.log(1 - r()) / rate, c = 12 + r() * 40, time = Math.min(t, c, 48); rows.push({ months: +time.toFixed(2), event: t <= Math.min(c, 48) ? 1 : 0, arm }); }
      ex.data = { name: 'ejemplo simulado (evento poco frecuente)', rows }; Object.assign(ex.settings, { time: 'months', status: 'event', event: '1', group: 'arm', cuminc: true, percent: true, title: 'Progression to Kidney Failure', ylab: 'Probability of Event (%)', note: 'Hazard ratio, 0.57 (95% CI, 0.31–1.04)|P=0.07', notePos: 'tl', inset: true, insetYmin: 0, insetYmax: 20, insetXmax: 48 }); ex.tables.groups = []; return ex; } },
    { id: 'minimal', name: 'Solo curvas (sin IC, censuras ni riesgo)', desc: 'Versión mínima para paneles pequeños o figuras compuestas.', make: set({ ci: false, cens: false, risk: false, aspect: 0.5 }) },
  ],
  flow: [
    { id: 'simple', name: 'CONSORT de dos brazos', desc: 'Elegibilidad, aleatorización, pérdidas y análisis en cada brazo.', make: ex => set({ text: `1200 Patients were assessed for eligibility
> 450 Excluded|   300 Did not meet inclusion criteria|   150 Declined to participate
750 Underwent randomization
=== Intervention
375 Were assigned to the intervention
> 25 Discontinued|   15 Withdrew consent|   10 Had adverse events
350 Were included in the primary analysis
=== Control
375 Were assigned to usual care
> 30 Discontinued|   20 Withdrew consent|   10 Were lost to follow-up
345 Were included in the primary analysis` })(ex) },
    { id: 'three', name: 'Tres brazos', desc: 'Dos dosis y placebo con exclusiones por brazo.', make: ex => set({ text: `640 Patients were screened
> 160 Were excluded|   110 Did not meet criteria|   50 Declined
480 Underwent randomization
=== Dose 1
160 Received dose 1
> 9 Discontinued|   6 Had adverse events|   3 Withdrew
151 Completed week 24
=== Dose 2
160 Received dose 2
> 12 Discontinued|   8 Had adverse events|   4 Withdrew
148 Completed week 24
=== Placebo
160 Received placebo
> 15 Discontinued|   5 Had adverse events|   10 Withdrew
145 Completed week 24` })(ex) },
    { id: 'cohort', name: 'Selección de una cohorte observacional', desc: 'Flujo de exclusiones sucesivas desde una base de datos hasta la cohorte analizada (sin brazos).', make: ex => set({ text: `182,450 Adults in the registry, 2012–2020
> 34,120 Were excluded|   21,300 Had prior kidney replacement therapy|   12,820 Had missing baseline creatinine
148,330 Eligible adults
> 22,410 Were excluded|   14,100 Had eGFR <15 ml/min/1.73 m²|   8,310 Had less than 1 year of follow-up
125,920 Were included in the analysis` })(ex) },
  ],
  schema: [
    { id: 'crossover', name: 'Ensayo cruzado (crossover)', desc: 'Dos secuencias con periodo de lavado entre tratamientos.', make: ex => {
      tbl(ex, 'stages', [{ text: 'Screening', note: '' }, { text: 'Run-in', note: '4 weeks, stable therapy' }, { text: 'Randomization', note: 'Adults with hypertension and CKD stage 3' }]);
      tbl(ex, 'arms', [{ text: 'Sequence AB:|Drug A → washout → Placebo', fill: '#AFD5EA', follow: '' }, { text: 'Sequence BA:|Placebo → washout → Drug A', fill: '#DADCE0', follow: '' }]);
      return tbl(ex, 'timeline', [{ label: 'Week|−4', pos: 4.5, brk: '' }, { label: 'Week 0|(randomization)', pos: 24, brk: '' }, { label: 'Week 8|(crossover)', pos: 54, brk: 'sí' }, { label: 'Week 20|(end of trial)', pos: 92.5, brk: '' }]); } },
    { id: 'dose', name: 'Dosis múltiples y seguimiento', desc: 'Tres dosis y comparador activo, con periodo de seguimiento de seguridad.', make: ex => {
      set({ armsTitle: '12-wk Treatment Period', followTitle: 'Safety Follow-up' })(ex);
      tbl(ex, 'arms', [{ text: 'Low dose:|5 mg weekly', fill: '#DBEBF6', follow: 'sí' }, { text: 'Medium dose:|10 mg weekly', fill: '#AFD5EA', follow: 'sí' }, { text: 'High dose:|20 mg weekly', fill: '#6F9AAD', follow: 'sí' }, { text: 'Active comparator:|Standard of care', fill: '#FBF6DA', follow: 'sí' }]);
      return tbl(ex, 'timeline', [{ label: 'Day|−14', pos: 4.5, brk: '' }, { label: 'Day 1', pos: 24, brk: '' }, { label: 'Week 12', pos: 80, brk: 'sí' }, { label: 'Week 16', pos: 92.5, brk: '' }]); } },
  ],
  stacked: [
    { id: 'likert', name: 'Escala Likert en un panel', desc: 'Cinco categorías de acuerdo para tres grupos.', make: ex => {
      set({ legendTitle: 'Response' })(ex);
      tbl(ex, 'panels', [{ id: '', title: 'Satisfaction with Care', xlab: 'Percentage of Respondents' }]);
      tbl(ex, 'cats', ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'].map(name => ({ name, color: '' })));
      const D = { 'Clinic A': [4, 9, 17, 41, 29], 'Clinic B': [6, 12, 22, 38, 22], 'Clinic C': [10, 18, 26, 31, 15] }, rows = [];
      for (const [group, v] of Object.entries(D)) ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'].forEach((cat, i) => rows.push({ panel: '', group, cat, value: v[i] }));
      return tbl(ex, 'data', rows); } },
    { id: 'mrs', name: 'Escala ordinal de 7 niveles (mRS)', desc: 'Distribución de la escala de Rankin modificada (0–6) en dos brazos.', make: ex => {
      set({ legendTitle: 'mRS score', barH: 2.4 })(ex);
      tbl(ex, 'panels', [{ id: '', title: 'Modified Rankin Scale at 90 Days', xlab: 'Percentage of Patients' }]);
      const cats = ['0', '1', '2', '3', '4', '5', '6'];
      tbl(ex, 'cats', cats.map(name => ({ name, color: '' })));
      const D = { 'Drug A': [12, 24, 20, 18, 12, 6, 8], Placebo: [8, 18, 19, 20, 15, 9, 11] }, rows = [];
      for (const [group, v] of Object.entries(D)) cats.forEach((cat, i) => rows.push({ panel: '', group, cat, value: v[i] }));
      return tbl(ex, 'data', rows); } },
    { id: 'counts', name: 'Barras apiladas con recuentos', desc: 'Sin normalizar: la barra muestra el número de pacientes por categoría.', make: ex => { set({ normalize: false, dec: 0 })(ex); const f = { 'Drug A': 1.4, Placebo: 1.2 }; ex.tables.data.forEach(r => { r.value = Math.round(r.value * (f[r.group] || 1.3)); }); return ex; } },
  ],
  dist: [
    { id: 'box', name: 'Diagrama de caja', desc: 'Mediana, cuartiles y valores extremos por grupo, con n y valor P.', make: set({ kind: 'box', showPts: false }) },
    { id: 'violin', name: 'Violín', desc: 'Densidad estimada con mediana y cuartiles.', make: set({ kind: 'violin', showPts: false }) },
    { id: 'points', name: 'Puntos con media', desc: 'Puntos individuales dispersos con la media y su barra.', make: set({ kind: 'points' }) },
    { id: 'hist', name: 'Histograma por grupo', desc: 'Distribución por grupo con ancho de clase automático.', make: set({ kind: 'hist' }) },
    { id: 'density', name: 'Curvas de densidad', desc: 'Densidades superpuestas, con ancho de banda ajustable.', make: set({ kind: 'density' }) },
    { id: 'ridge', name: 'Crestas (ridgeline)', desc: 'Densidades apiladas verticalmente, una por grupo.', make: set({ kind: 'ridge' }) },
  ],
  scatter: [
    { id: 'linear', name: 'Recta ajustada por grupo con banda de IC', desc: 'Recta de mínimos cuadrados, banda del IC 95 %, r y valor P por grupo.', make: set({ fit: 'linear', fitBy: 'group', band: true, logx: false }) },
    { id: 'all', name: 'Una sola recta para todos', desc: 'Todos los puntos con un único ajuste.', make: set({ fit: 'linear', fitBy: 'all', band: true, logx: false }) },
    { id: 'loess', name: 'Curva LOESS', desc: 'Ajuste local no paramétrico, sin supuesto de linealidad.', make: set({ fit: 'loess', fitBy: 'group', band: true, span: 0.8 }) },
    { id: 'bubble', name: 'Burbujas (tamaño = n o peso)', desc: 'El área de cada punto es proporcional a una tercera variable.', make: ex => { ex.settings = { ...ex.settings, fit: 'none', logx: false, alpha: 0.55, rad: 0.5 }; ex.tables.data.forEach((r, i) => { r.size = 4 + (i * 7) % 28; }); return ex; } },
    { id: 'points', name: 'Solo puntos', desc: 'Sin ajuste, con línea de identidad opcional.', make: set({ fit: 'none', ident: true, logx: false, stats: false }) },
  ],
  rank: [
    { id: 'lollipop', name: 'Piruleta', desc: 'Un valor por categoría con palo y círculo, ordenado.', make: set({ kind: 'lollipop' }) },
    { id: 'slope', name: 'Pendientes', desc: 'Una línea por categoría entre dos momentos.', make: set({ kind: 'slope', cols: false }) },
    { id: 'bars', name: 'Barras horizontales', desc: 'Barras por categoría ordenadas por el valor final.', make: set({ kind: 'bars', sort: 'v2d' }) },
  ],
  time: [
    { id: 'line', name: 'Líneas', desc: 'Una serie por grupo a lo largo del tiempo, con marcadores opcionales.', make: set({ kind: 'line', ylab: 'Weekly Cases', title: 'Weekly Confirmed Cases', smooth: 3 }) },
    { id: 'area', name: 'Áreas', desc: 'Áreas translúcidas superpuestas.', make: set({ kind: 'area', ylab: 'Weekly Cases' }) },
    { id: 'stacked', name: 'Áreas apiladas', desc: 'Suma de los grupos a lo largo del tiempo.', make: set({ kind: 'stacked', ylab: 'Weekly Cases' }) },
    { id: 'stacked100', name: 'Áreas apiladas al 100 %', desc: 'Composición proporcional a lo largo del tiempo.', make: set({ kind: 'stacked100', ylab: 'Share of Cases (%)' }) },
  ],
  part: [
    { id: 'pie', name: 'Pastel', desc: 'Pastel con porcentajes en cada sector.', make: set({ kind: 'pie' }) },
    { id: 'waffle', name: 'Waffle de 100 cuadros', desc: 'Cada cuadro representa 1 % del total.', make: set({ kind: 'waffle' }) },
    { id: 'treemap', name: 'Treemap', desc: 'Rectángulos proporcionales al tamaño de cada categoría.', make: set({ kind: 'treemap' }) },
  ],
  radar: [
    { id: 'single', name: 'Un grupo relleno', desc: 'Perfil de un solo grupo con polígono relleno.', make: ex => { ex.tables.data = ex.tables.data.filter(r => r.series === 'Drug A'); return set({ fill: true, title: 'Quality-of-Life Profile, Drug A' })(ex); } },
    { id: 'lines', name: 'Líneas sin relleno', desc: 'Solo contornos, para comparar varios grupos sin tapar la cuadrícula.', make: set({ fill: false, pts: true }) },
  ],
  ba: [
    { id: 'pct', name: 'Diferencias porcentuales', desc: 'Diferencia relativa (%) frente al promedio de los métodos.', make: set({ pct: true, unit: '%', ylab: 'Difference (%)' }) },
    { id: 'reg', name: 'Con recta de la diferencia sobre el promedio', desc: 'Detecta sesgo proporcional: la diferencia crece con la magnitud.', make: set({ reg: true }) },
    { id: 'noci', name: 'Solo sesgo y límites', desc: 'Sin los IC de los límites de acuerdo.', make: set({ ci: false }) },
  ],
  meta: [
    { id: 'mean', name: 'Embudo para diferencias de medias', desc: 'Escala lineal (no log): efecto en unidades de la variable, con pseudo-IC y prueba de Egger.', make: ex => { const r = rng(21); ex.settings = { ...ex.settings, kind: 'funnel', ratio: false, title: 'Funnel Plot of Mean Differences', xlab: 'Mean Difference (mmHg)' }; ex.tables.data = Array.from({ length: 18 }, (_, i) => { const se = +(0.35 + 1.3 * r()).toFixed(2); return { label: `Trial ${i + 1}`, est: +(-4.2 + gauss(r) * se * 1.1).toFixed(2), se, p: '' }; }); return ex; } },
    { id: 'volcano', name: 'Volcán (efecto frente a −log10 P)', desc: 'Resultados de muchas pruebas: umbrales de efecto y P y etiquetas de los más extremos.', make: ex => {
      const r = rng(5); ex.settings = { ...ex.settings, kind: 'volcano', ratio: false, xcut: 0.5, pcut: 0.05, nlab: 4, title: 'Differential Expression', xlab: 'Log2 Fold Change', ylab: '−log10 P' };
      ex.tables.data = Array.from({ length: 60 }, (_, i) => { const est = +(gauss(r) * 0.9).toFixed(2), z = Math.abs(est) / 0.28 + Math.abs(gauss(r)) * 0.6, p = Math.max(1e-8, 2 * Math.exp(-0.717 * z - 0.416 * z * z)); return { label: `Gene ${i + 1}`, est, se: '', p: +p.toPrecision(2) }; });
      return ex; } },
  ],
  heat: [
    { id: 'circles', name: 'Círculos proporcionales', desc: 'El tamaño del círculo indica la magnitud.', make: set({ scale: 'div', shape: 'circle', lower: false, vals: false }) },
    { id: 'viridis', name: 'Escala viridis (apta para daltonismo)', desc: 'Escala secuencial perceptualmente uniforme.', make: set({ scale: 'viridis', shape: 'square', lower: false, vmin: -1, vmax: 1 }) },
    { id: 'gray', name: 'Escala de grises', desc: 'Para impresión en blanco y negro.', make: set({ scale: 'gray', shape: 'square', lower: false }) },
  ],
  sankey: [
    { id: 'four', name: 'Cuatro etapas', desc: 'Trayectorias en cuatro momentos de seguimiento.', make: ex => { ex.settings = { ...ex.settings, stages: 'Baseline,Month 6,Month 12,Month 24', colorBy: 'first' }; const P = (s1, s2, s3, s4, n) => ({ s1, s2, s3, s4, n }); ex.tables.paths = [P('Mild', 'Mild', 'Mild', 'Mild', 60), P('Mild', 'Mild', 'Mild', 'Moderate', 14), P('Mild', 'Mild', 'Moderate', 'Moderate', 10), P('Mild', 'Moderate', 'Moderate', 'Severe', 6), P('Moderate', 'Mild', 'Mild', 'Mild', 12), P('Moderate', 'Moderate', 'Moderate', 'Moderate', 34), P('Moderate', 'Moderate', 'Severe', 'Severe', 16), P('Moderate', 'Severe', 'Severe', 'Severe', 9), P('Severe', 'Moderate', 'Moderate', 'Moderate', 8), P('Severe', 'Severe', 'Severe', 'Severe', 31)]; return ex; } },
    { id: 'source', name: 'Color según el origen de cada tramo', desc: 'Cada tramo toma el color de la etapa anterior.', make: set({ colorBy: 'source', pct: false }) },
  ],
  prisma: [
    { id: 'dbonly', name: 'Solo bases de datos (sin otros métodos)', desc: 'PRISMA 2020 con una sola columna: bases de datos y registros.', make: ex => { ex.settings = { ...ex.settings, otherOn: false }; return ex; } },
    { id: 'reasons', name: 'Con motivos de exclusión', desc: 'Informes excluidos con el número y la razón de cada exclusión.', make: ex => { ex.settings = { ...ex.settings, notRetDb: 2, reasonsDb: '6 Wrong population\n4 Wrong outcome\n3 Not a randomised design\n2 Conference abstract only', soughtDb: 25, included: '', reasonsOther: '2 Duplicate report\n1 Wrong outcome' }; return ex; } },
  ],
  hbar: [
    { id: 'group', name: 'Barras agrupadas (dos series)', desc: 'Dos series por categoría, con el valor al final de cada barra.', make: ex => { ex.settings = { ...ex.settings, mode: 'group', labels: 'all', xmax: 100, legendPos: 'top', title: 'Use of tools by sex', letter: 'B' }; ex.tables.series = ex.tables.series.slice(0, 2).map((x, i) => ({ ...x, name: ['Women', 'Men'][i] })); ex.tables.data = ex.tables.data.slice(0, 5).map((r, i) => ({ ...r, v1: [52, 8, 5, 4, 3][i], v2: [48, 5, 3, 3, 2][i], v3: '' })); return ex; } },
    { id: 'single', name: 'Una serie ordenada de mayor a menor', desc: 'Una sola barra por categoría, ordenada, con borde negro fino.', make: ex => { ex.settings = { ...ex.settings, mode: 'single', sort: 'desc', labels: 'all', outline: 'black', xmax: 60, step: 10, grid: true, legendPos: 'none', title: 'Students who have used each tool', letter: 'C' }; return ex; } },
    { id: 'rob', name: 'Riesgo de sesgo por dominio (estilo RevMan)', desc: 'Barras apiladas al 100 % con colores de riesgo de sesgo y borde negro.', make: ex => { ex.settings = { ...ex.settings, mode: 'stack', outline: 'black', legendPos: 'bottom', labels: 'none', xlab: 'Risk of bias (%)', title: '', letter: '', grid: true, step: 25 }; ex.tables.series = [{ name: 'Low risk of bias', color: '#6EC83C' }, { name: 'Unclear risk of bias', color: '#EBEB4B' }, { name: 'High risk of bias', color: '#D1361F' }]; ex.tables.data = [['Random sequence generation', 60, 35, 5], ['Allocation concealment', 45, 50, 5], ['Blinding of participants', 30, 25, 45], ['Blinding of outcome assessment', 55, 30, 15], ['Incomplete outcome data', 70, 20, 10], ['Selective reporting', 50, 40, 10], ['Other bias', 65, 30, 5]].map(([label, a, b, c]) => ({ label, v1: a, v2: b, v3: c, v4: '', v5: '', v6: '' })); return ex; } },
  ],
  ftable: [
    { id: 'md', name: 'Diferencias de medias (escala lineal)', desc: 'Desenlaces continuos con diferencia de medias y sin columna de I².', make: ex => { ex.settings = { ...ex.settings, scale: 'linear', ref: 0, ticks: '-4,-2,0,2,4', hm: 'Mean difference (95% CI)', cI: false }; const M = 'Mean difference (IV, random)'; ex.tables.rows = [['out', 'Pain (0–10)', 8, '1,020', -1.4, -2.1, -0.7, '', ''], ['sub', 'Acute', 5, '640', -1.9, -2.8, -1.0, '', '0.12'], ['sub', 'Chronic', 3, '380', -0.8, -1.7, 0.1, '', ''], ['out', 'Function score', 6, '780', -0.9, -1.9, 0.1, '', ''], ['tot', 'Overall benefit', 10, '1,300', -1.1, -1.7, -0.5, '', '']].map(([kind, label, k, n, est, lo, hi, i2, pint]) => ({ kind, label, k, n, method: M, est, lo, hi, i2, pint, view: '' })); return ex; } },
    { id: 'lean', name: 'Versión reducida (solo forest y efecto)', desc: 'Sin estudios, participantes ni método: solo etiquetas, forest, efecto e I².', make: set({ cK: false, cN: false, cM: false, cP: false, cV: false }) },
  ],
  fmeta: [
    { id: 'ratio', name: 'Razón de riesgos con eventos (escala log)', desc: 'Desenlace binario con eventos/total por brazo, peso y riesgo de sesgo.', make: ex => { ex.settings = { ...ex.settings, scale: 'log', ref: 1, ticks: '0.2,0.5,1,2,5', hm: 'Risk ratio|M-H, random, 95% CI', h1: 'Events/Total|(Drug)', h2: 'Events/Total|(Control)', left: 'Favours drug', right: 'Favours control' }; const S = (label, c1, c2, weight, est, lo, hi, rob) => ({ kind: 'study', label, c1, c2, weight, est, lo, hi, rob }); ex.tables.rows = [S('Alba 2015', '12/110', '22/108', 17.5, 0.54, 0.28, 1.04, '+ + + + + + +'), S('Bosch 2017', '9/95', '15/97', 14.2, 0.61, 0.28, 1.34, '+ ? + + + ? ?'), S('Costa 2018', '30/240', '41/236', 38.1, 0.72, 0.47, 1.10, '+ + ? ? + + +'), S('Duran 2020', '7/60', '8/62', 10.4, 0.90, 0.35, 2.35, '- ? - - + ? -'), S('Egea 2022', '15/150', '27/148', 19.8, 0.55, 0.31, 0.99, '+ + + + ? + +'), { kind: 'total', label: 'Total (Wald)', c1: '73/655', c2: '113/651', weight: 100, est: 0.65, lo: 0.52, hi: 0.81, rob: '' }, { kind: 'note', label: 'Heterogeneity: Tau² = 0.00; Chi² = 1.90, df = 4 (P = 0.75); I² = 0%' }, { kind: 'note', label: 'Test for overall effect: Z = 3.88 (P = 0.0001)' }].map(r => ({ c1: '', c2: '', weight: '', est: '', lo: '', hi: '', rob: '', ...r })); return ex; } },
    { id: 'norob', name: 'Sin columnas de riesgo de sesgo', desc: 'Forest de metaanálisis limpio: estudios, peso, efecto y subtotales.', make: set({ robOn: false, legend: false }) },
  ],
  compose: [
    { id: 'two', name: 'Dos paneles lado a lado', desc: 'Curvas a la izquierda y distribución a la derecha.', make: ex => { ex.settings.cols = 2; return tbl(ex, 'panels', [{ fig: 'curves', span: 1 }, { fig: 'dist', span: 1 }]); } },
    { id: 'stack', name: 'Paneles apilados (1 columna)', desc: 'Barras y forest uno debajo del otro.', make: ex => { ex.settings.cols = 1; return tbl(ex, 'panels', [{ fig: 'bars', span: 1 }, { fig: 'forest', span: 1 }]); } },
    { id: 'grid', name: 'Cuadrícula de cuatro paneles', desc: 'Dispersión, ranking, partes de un todo y radar en 2 × 2.', make: ex => { ex.settings.cols = 2; return tbl(ex, 'panels', [{ fig: 'scatter', span: 1 }, { fig: 'rank', span: 1 }, { fig: 'part', span: 1 }, { fig: 'radar', span: 1 }]); } },
  ],
};
