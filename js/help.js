export const HELP_HTML = `
<h2>Cómo usar EPI-GRAPHICS</h2>
<p>EPI-GRAPHICS construye figuras con el aspecto de las del <i>New England Journal of Medicine</i> a partir de tablas que usted rellena o pega desde Excel. El dibujo se hace en su navegador y se descarga como <b>SVG</b> (vectorial), <b>PNG</b> o <b>TIFF</b> con el ancho en milímetros y los DPI que pida la revista.</p>
<h3>Flujo en 3 pasos</h3>
<ol><li><b>Tipo de figura.</b> Elija una plantilla; todas traen un ejemplo con datos simulados de nefrología.</li><li><b>Contenido.</b> Cambie las tablas por sus datos. «Pegar desde Excel» reemplaza las filas de la tabla (con o sin encabezado). Para saltar de línea en un texto use <code>|</code>.</li><li><b>Formato y descarga.</b> Ancho de columna, tamaño de letra en puntos, resolución, fuente y paleta. Lo que ve es lo que se imprime al ancho elegido.</li></ol>
<h3>Plantillas</h3>
<table class="data"><thead><tr><th>Plantilla</th><th>Úsela para…</th><th>Datos que necesita</th></tr></thead><tbody>
<tr><td><b>Barras con comparaciones</b></td><td>Porcentaje de pacientes con un desenlace por brazo, con OR/RR y valor p sobre corchetes</td><td>Paneles; barras (etiqueta, valor, color); corchetes (barra inicial y final, texto)</td></tr>
<tr><td><b>Forest plot por subgrupos</b></td><td>Efecto del tratamiento por subgrupo (HR, RR, diferencia de medias), con n por brazo</td><td>Paneles (escala, referencia, flechas «a favor de»); filas (etiqueta, n, estimador, IC)</td></tr>
<tr><td><b>Curvas con IC y número en riesgo</b></td><td>Evolución de una medida (razón de medias geométricas, eGFR, UPCR) por brazo con barras de error</td><td>Puntos (serie, tiempo, valor, IC, n en riesgo)</td></tr>
<tr><td><b>Kaplan-Meier</b></td><td>Supervivencia o incidencia acumulada desde datos individuales, con IC, censuras y número en riesgo</td><td>Base con tiempo, evento y grupo (CSV/Excel)</td></tr>
<tr><td><b>Diagrama CONSORT</b></td><td>Flujo de participantes con exclusiones y brazos</td><td>Texto: una línea por cuadro, <code>&gt;</code> para exclusiones, <code>=== Brazo</code> para dividir</td></tr>
<tr><td><b>Esquema del diseño</b></td><td>Fases, aleatorización, brazos, seguimiento y línea de tiempo</td><td>Fases, brazos (texto y color), marcas de tiempo</td></tr>
<tr><td><b>Barras apiladas</b></td><td>Distribución de una escala ordinal (mRS, Likert, estadios) por grupo</td><td>Categorías, y valores por grupo y categoría</td></tr></tbody></table>
<h3>Recomendaciones para figuras de revista</h3>
<ul><li>Use una sola familia tipográfica sans-serif (Arial/Helvetica) y letra de 6–8 pt al tamaño final.</li><li>Entregue la figura en el ancho final (85, 120 o 174 mm) y evite reescalarla después: así la letra mantiene su tamaño.</li><li>Prefiera SVG (o PDF vectorial) para gráficos de líneas; use ≥ 600 dpi en PNG/TIFF si la revista pide mapa de bits.</li><li>No dependa solo del color: combine marcadores distintos (cuadrado, triángulo) y la paleta «apta para daltonismo» si lo necesita.</li><li>En forest plots reporte el número de pacientes por brazo, la medida (HR, RR, diferencia) y el IC; en curvas, el número en riesgo.</li><li>Verifique siempre las instrucciones de autores de su revista: los anchos, la fuente y los formatos pueden cambiar.</li></ul>
<h3>Escalas del forest plot</h3>
<p><b>Lineal</b> (diferencias), <b>log</b> (razones: HR, RR, OR) y <b>ticks</b> (marcas equiespaciadas con interpolación por tramos, como se ve en algunas figuras publicadas). La escala «ticks» deforma las distancias: úsela solo para reproducir un estilo y no para comparar longitudes.</p>
<h3>Privacidad y licencia</h3>
<p>Todo se calcula en su navegador. El proyecto (.json) se guarda en su computadora; el navegador recuerda la última sesión en su almacenamiento local. © Daniel Fernández-Guzmán · CC BY-NC-ND 4.0: usar la aplicación y publicar las figuras generadas está permitido citando EPI-GRAPHICS.</p>`;
