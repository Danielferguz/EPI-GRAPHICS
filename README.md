# EPI-GRAPHICS

Módulo de **EPI-LAB** para **hacer figuras de revista con el aspecto del *New England Journal of Medicine***: marco gris, letras de panel en negrita, Arial y paleta azul-gris. Se escriben (o pegan desde Excel) los datos, se ve la figura al instante y se descarga en **SVG vectorial, PNG o TIFF** al ancho de columna y los DPI que pide la revista.

Todo se dibuja en el navegador: los datos no salen de tu computadora. Sitio estático (GitHub Pages / Cloudflare Pages), sin instalación.

## Plantillas

| Plantilla | Para qué sirve | Datos |
|---|---|---|
| **Barras con comparaciones** | Porcentaje de pacientes por brazo con corchetes de OR/RR/p (uno o varios paneles A, B…) | paneles, barras, corchetes |
| **Forest plot por subgrupos** | HR/RR/diferencia por subgrupo con n por brazo, referencia punteada, escala lineal / log / por tramos y flechas «a favor de» | paneles, filas |
| **Curvas con IC y número en riesgo** | Razones o medias en el tiempo con barras de error, anotación del último valor y tabla «No. at Risk» | puntos por serie y tiempo |
| **Kaplan-Meier** | Supervivencia o incidencia acumulada desde datos individuales, con IC, censuras y número en riesgo | CSV/Excel (tiempo, evento, grupo) |
| **Diagrama CONSORT** | Flujo de participantes con exclusiones laterales y brazos | texto: una línea por cuadro, `>` exclusiones, `=== Brazo` |
| **Esquema del diseño** | Fases → aleatorización → brazos coloreados → seguimiento, con línea de tiempo e interrupciones | fases, brazos, marcas |
| **Barras apiladas** | Distribución de escalas ordinales (mRS, Likert, estadios) por grupo | categorías y valores |

Cada plantilla trae un ejemplo con **datos simulados de nefrología**. Las tablas admiten «Pegar desde Excel», importar/exportar CSV y guardar/abrir el proyecto completo (`.json`).

## Formato de salida

* Ancho: 1 columna (85 mm), 1,5 columnas (120 mm), 2 columnas (174 mm) o personalizado. El lienzo está definido en milímetros y el texto en **puntos tipográficos reales** (por defecto 8 pt), de modo que la vista previa es fiel al tamaño impreso.
* Resolución 300/600/1200 dpi incrustada en PNG (chunk `pHYs`) y TIFF (RGB sin compresión).
* Fuente Arial/Helvetica/Times, fondo blanco, texto negro; paleta NEJM, EPI-LAB, escala de grises o apta para daltonismo.
* PDF vectorial mediante «Guardar como PDF» del cuadro de impresión (página del tamaño exacto de la figura).

## Uso local

```bash
python3 -m http.server 8000   # luego http://localhost:8000
node tests/validate.mjs       # pruebas de humo y lógica
```

## Estructura

```
index.html · css/style.css
js/svg.js        primitivas SVG, medición de texto, escalas, paletas
js/f_*.js        una plantilla por archivo (bars, forest, curves, km, flow, schema, stacked)
js/app.js        galería, editor de tablas, vista previa y exportación
js/figs.js       exportación SVG/PNG/TIFF/PDF
js/models.js     Kaplan-Meier (motor de EPI-DATA, validado frente a statsmodels/scipy)
```

## Advertencias

* La escala «ticks» del forest plot (marcas equiespaciadas con interpolación por tramos) reproduce un estilo editorial, pero **deforma las distancias**; no la use para comparar longitudes.
* Revise las instrucciones de autores de su revista: anchos, fuente y formatos cambian.
* Los datos de los ejemplos son simulados; no representan resultados de ningún estudio.

## Licencia y cita

© Daniel Fernández-Guzmán. Licencia **CC BY-NC-ND 4.0**. Usar la aplicación y publicar las figuras generadas está permitido citando EPI-GRAPHICS (ver `CITATION.cff`).

## Publicar una versión nueva

`python3 tools/bump_version.py AAAA.MM.DD-N` añade `?v=…` a todos los módulos y a la hoja de estilos.
