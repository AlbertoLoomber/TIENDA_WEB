# 04 · Fase 4: contenido nuevo

**Objetivo de la fase:** sumar material que hoy no existe (giro real, video, proceso, calle)
sin hacer la página más pesada ni más lenta. Todo depende de las fotos y videos de
`docs/PROMPTS.md` (secciones 16 a 22).

| Tarea | Qué resuelve | Esfuerzo | Necesita |
|---|---|---|---|
| T4.1 | Giro real a partir de video | L | PROMPTS 16 |
| T4.2 | Clips del lookbook | M | PROMPTS 18 y 19 |
| T4.3 | Video del estudio en Nosotros | S | PROMPTS 20 |
| T4.4 | Sección "Cómo se hace" | M | PROMPTS 21 |
| T4.5 | Sección "Así se usa" | M | PROMPTS 22 |
| T4.6 | Lista para la fase funcional | — | — |

---

## 0. Cómo recibo y preparo cada archivo

1. **Recibo** el archivo (por aquí o en `assets/raw/` y `assets/raw/video/`).
2. **Reviso** la lista de la sección 15 de PROMPTS: estampado, gancho, color, fondo y cortes.
   Si algo falla, te digo exactamente qué pedir de nuevo.
3. **Proceso** con los scripts del repositorio (recorte, fondo, color, compresión).
4. **Integro** en la página detrás de lo actual, sin quitar lo que ya funciona.
5. **Te muestro** capturas o un video corto del resultado y tú apruebas.

### Formatos y pesos de destino

| Tipo | Formato final | Medida | Peso máximo | Carga |
|---|---|---|---|---|
| Cuadros del giro (perchero) | WebP con transparencia | 700px de alto | 30 KB por cuadro | Después de cargar la página, en tiempo libre |
| Cuadros del giro (ficha) | WebP con transparencia | 1300px de alto | 70 KB por cuadro | Al abrir la ficha |
| Fotos del lookbook | WebP | 1200×1500 | 180 KB | Al acercarse |
| Clips del lookbook | MP4 H.264 y WebM VP9, sin audio | 720×900, 24 fps, 5 s | 1.5 MB | Al acercarse; solo se reproducen a la vista |
| Video del estudio | MP4 y WebM | 1280×852 | 2.5 MB | Al acercarse |
| Fotos macro (círculos) | WebP | 300×300 | 60 KB | Al acercarse |
| Fotos macro (ficha) | WebP | 1200×1200 | 160 KB | Al elegir la vista |
| Proceso y calle | WebP | 1000×1250 / 1000×1000 | 140 KB | Al acercarse |

**Regla:** la carga inicial de la página (sin videos) se queda en **1.3 MB o menos**.

---

## T4.1 Giro real a partir de video

> **Listo para recibir el video (sesión 8).**
> - `tools/cuadros_video.py VIDEO` hace todo el proceso de abajo, deja una hoja de revisión en `assets/revision/` y escribe `tienda.giro` en `catalogo.json`; luego `tools/catalogo_web.py`.
> - La página ya usa los cuadros cuando existen (`item.spin`): los de 700 px en tiempo libre después de la primera pintura, los de 1300 px al abrir la ficha, y el giro actual mientras tanto. `?giro=foto` lo apaga para comparar.
> - Video comparativo: `tools/pruebas/con-servidor.sh node tools/pruebas/comparar_giro.js` → `tools/pruebas/salida/giro-comparacion.webm`.
> - Probado de punta a punta con un video sintético (`--prueba`, prueba `giro.js`). El primer y el último cuadro son las fotos actuales, así el perchero en reposo no cambia.

| | |
|---|---|
| **Objetivo** | Que el giro de lado a frente pase por ángulos reales y consistentes. |
| **Archivos** | `tools/cuadros_video.py` (nuevo), `web/prendas/<id>/giro/`, `catalogo.json`, `web/prendas.json`, `web/app.js` (`makeTurn`, `renderTurn`), `web/shop.js` (escenario de la ficha) |

### Proceso del script
1. **Leer** el MP4 con OpenCV: 5 s a 24 fps son unos 120 cuadros.
2. **Revisar que la cámara no se movió:** se compara la zona del gancho de cada cuadro con la del
   primero (`matchTemplate`). Si se desplaza más de 3px, se corrige moviendo el cuadro; si se
   desplaza más de 20px, el video se rechaza y se pide de nuevo.
3. **Recortar** el lienzo de la prenda. Los cuadros de `assets/para-video/` ponen el lienzo de
   1000×1300 en (40, 300), así que el recorte es directo: `x 40–1040`, `y 300–1600`.
4. **Elegir 12 cuadros parejos por ángulo, no por tiempo.** El ancho visible de la prenda baja
   de frente a perfil, así que se eligen los cuadros en pasos iguales de ancho. Esto corrige un
   giro que no fue a velocidad constante.
5. **Quitar el fondo** con rembg (`isnet-general-use`), igual que las fotos actuales.
6. **Igualar el color** (LAB) con la foto de frente en los cuadros cercanos al frente y con la
   de perfil en los cercanos al perfil, mezclando según el ángulo. Así no aparece la "imagen
   doble" que tuvimos antes.
7. **Verificar el gancho** en (500, 30) ±2px.
8. **Exportar** dos tamaños: `giro/NN.webp` (1300px) y `giro/NN-700.webp` (700px). También se
   calculan `left` y `right` de cada cuadro (como los cuadros actuales) y un ángulo estimado de 0° a 80°.
9. **Actualizar** `catalogo.json` (`tienda.giro.cuadros`) y correr `tools/catalogo_web.py`.

### En la página
- **Perchero:** si la prenda tiene cuadros de video, el giro los recorre (fundido corto entre
  cuadros vecinos) en vez del giro 3D de dos fotos. Las demás prendas siguen como hoy.
- **Carga:**
  - primero, frente y perfil (como hoy);
  - los cuadros de 700px se descargan en tiempo libre (`requestIdleCallback`) después de la primera
    pintura, o antes si el cursor llega al perchero;
  - mientras no han llegado, se usa el giro 3D actual.
- **Ficha:** al abrir, se descargan los de 1300px para arrastrar (T3.2).

### Decisión
Primero solo con la 03. Te mando un video lado a lado (el giro 3D actual a la izquierda y el
giro real a la derecha) y tú eliges. Si gana el real, se piden los videos de las otras cuatro.

### Listo cuando
- [ ] El giro real no muestra doble imagen, saltos de color ni el gancho moviéndose.
- [x] La carga inicial no aumenta (los cuadros llegan después).
- [ ] Tu aprobación del video comparativo.

---

## T4.2 Clips del lookbook

> **Descartado:** el lookbook se quitó (2026-10-03). `media.js` y `comprimir_video.py` quedan para el video del estudio y el clip del proceso.

> **Listo para recibir los clips (sesión 9).** `tools/comprimir_video.py` (ffmpeg de `imageio-ffmpeg`) recorta, comprime a MP4 y WebM, revisa el loop (ida y vuelta si salta) y saca la portada → `web/video/`. `web/media.js` los carga al acercarse, los reproduce a la vista y los pausa al salir; con reducir movimiento o ahorro de datos se queda la foto. Prueba `escenas.js` con clips sintéticos.

| | |
|---|---|
| **Objetivo** | Que el lookbook tenga vida con un movimiento muy sutil, sin video pesado ni sonido. |
| **Archivos** | `tools/comprimir_video.py` (nuevo), `web/video/`, `web/app.js` (`buildLookbook`), `web/sections.js` (`lookbook`) |

### Preparación de cada clip
1. Instalar `imageio-ffmpeg` (pip), que trae su propio ffmpeg.
2. **Recortar a 4:5**, escalar a 720×900, 24 fps y sin audio:
   ```
   ffmpeg -i clip.mp4 -vf "crop=…,scale=720:900,fps=24" -an -c:v libx264 -profile:v high \
          -pix_fmt yuv420p -crf 28 -preset slow -movflags +faststart clip-look-01.mp4
   ffmpeg -i clip.mp4 -vf "crop=…,scale=720:900,fps=24" -an -c:v libvpx-vp9 -b:v 0 -crf 36 \
          -row-mt 1 clip-look-01.webm
   ```
3. **Revisar el loop:** se compara el primer y el último cuadro. Si no coinciden, el clip se hace
   de ida y vuelta (normal y luego al revés), que en movimientos tan pequeños no se nota.
4. **Portada:** el primer cuadro como WebP; es también la foto que se ve sin video.

### En la página
```html
<video class="look__photo" muted playsinline loop preload="none" poster="fotos/look-01.webp"
       aria-hidden="true">
  <source data-src="video/clip-look-01.webm" type="video/webm">
  <source data-src="video/clip-look-01.mp4" type="video/mp4">
</video>
```
- Las fuentes se asignan al acercarse (1 pantalla antes). Se reproduce con al menos 50% visible
  y se pausa al salir (`IntersectionObserver`, que funciona también dentro del lookbook fijo).
- **Sin video:** con "reducir movimiento" o ahorro de datos (`navigator.connection.saveData`)
  se queda la foto de portada.
- La cortina de entrada del lookbook no cambia: abre el marco y adentro ya está el clip.

### Listo cuando
- [ ] Ningún clip pasa de 1.5 MB y ninguno carga antes de acercarse.
- [ ] En iPhone (Safari) se reproducen sin pantalla completa ni botón de play (`playsinline` y `muted`).
- [ ] El loop no tiene salto visible.

---

## T4.3 Video del estudio en Nosotros

> **Listo (sesión 9):** `video-estudio.mp4` en `assets/raw/video/` → `comprimir_video.py` → `catalogo_web.py`. La entrada de Nosotros se aplica igual al video.

| | |
|---|---|
| **Objetivo** | Que Nosotros se sienta un lugar real. |
| **Archivos** | `web/index.html` (figura del estudio), `web/app.js` (`buildStudio`), `web/video/` |

- Mismo tratamiento que T4.2: 1280×852 (3:2, medidas pares), 24 fps, máximo 2.5 MB, sin audio y con la foto
  actual como portada.
- La animación de entrada (se abre desde el centro y la escala baja de 1.1 a 1) se aplica al video igual que a la foto.
- Si el recorrido de cámara no hace loop limpio, se hace de ida y vuelta.

---

## T4.4 Sección "Cómo se hace"

> **Quitada** (2026-10-03): saturaba la página.

> **Hecho con muestras (sesión 9).** `web/scenes.js`; datos en `sitio.proceso`. Las 4 fotos son muestras armadas con las prendas (boceto a lápiz, malla, estampado y perchero; `tools/fotos_web.py`) hasta que lleguen las de PROMPTS 21. El clip opcional del paso 3 entra solo cuando exista `clip-estampado`.

| | |
|---|---|
| **Objetivo** | Contar el proceso (boceto → malla → estampado → perchero), lo que da valor al precio. |
| **Archivos** | `web/index.html` (sección después de Nosotros), `web/sections.js` (`process`), `web/styles.css`, `catalogo.json` (`sitio.proceso`) |

### Diseño

```
ESCRITORIO
 CÓMO SE HACE
 Del boceto al perchero.

 ╞════⊂╤══════════════════════════════════════════════════════════╡  ← mini tubo; el gancho avanza al bajar
 ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
 │  foto    │   │  foto    │   │ foto o   │   │  foto    │
 │  4:5     │   │  4:5     │   │ clip     │   │  4:5     │
 └──────────┘   └──────────┘   └──────────┘   └──────────┘
 01 Boceto      02 Malla       03 Estampado   04 Al perchero
 Cada diseño    Se graba el    Se imprime a   Se revisa,
 empieza a mano diseño en…     mano, tinta…   se dobla…

TABLET: 2 × 2.   CELULAR: fila deslizable, con el mismo gancho siguiendo el deslizamiento.
```

### Movimiento
- **Tarjetas:** cortina desde abajo (como el lookbook, pero más corta, 0.9 s `expo.out`), una vez y con 0.12 s entre tarjetas.
- **Gancho sobre el tubo:**
  - en escritorio va del paso 1 al 4 según el scroll (`scrub`, inicio en "top 70%" y fin en
    "bottom 40%"), sin fijar la sección;
  - en celular sigue el deslizamiento horizontal de la fila.
- El clip opcional del paso 3 se comporta como los del lookbook.

### Listo cuando
- [x] No fija el scroll; el gancho nunca se adelanta ni se queda atrás de las tarjetas.
- [x] Textos (P) marcados en `catalogo.json`.

---

## T4.5 Sección "Así se usa"

> Ocupa el lugar del lookbook, justo después de "De cerca".

> **Hecho con muestras (sesión 9).** Datos en `sitio.calle`; las 6 fotos son recortes del lookbook y prendas sobre su color hasta que lleguen las de PROMPTS 22. La leyenda "Fotos de muestra" se ve mientras `sitio.calle.muestra` sea `true` o quede alguna muestra.

| | |
|---|---|
| **Objetivo** | Mostrar las prendas en la vida real y conectar cada foto con su prenda. |
| **Archivos** | `web/index.html` (sección después de Cómo se hace), `web/sections.js`, `web/styles.css`, `catalogo.json` (`sitio.calle`) |

### Diseño

```
 ASÍ SE USA
 En la calle.                                   Fotos de muestra
 ┌────────┐ ┌────────┐ ┌────────┐
 │ calle-1│ │ calle-2│ │ calle-3│        Al pasar el cursor:
 └────────┘ └────────┘ └────────┘        "Lleva: Sobrecamisa Camo  →"
 ┌────────┐ ┌────────┐ ┌────────┐
 │ calle-4│ │ calle-5│ │ calle-6│
 └────────┘ └────────┘ └────────┘
 ( ETIQUÉTANOS EN INSTAGRAM )
```

- 3×2 en escritorio, 2×3 en tablet, fila deslizable en celular.
- **Al pasar el cursor:** la foto crece a 1.03 dentro de su marco y aparece "Lleva: [prenda] →".
  Un clic abre la ficha de esa prenda (enlace de T2.4). En táctil, el texto se ve siempre debajo.
- **"Fotos de muestra"** visible mientras no sean fotos reales de clientes. No se agregan
  nombres de usuarios ni reseñas inventadas.

### Listo cuando
- [x] Cada foto abre la ficha correcta.
- [x] La leyenda "Fotos de muestra" está presente mientras `sitio.calle.muestra` sea `true`.

---

## T4.6 Lista para la fase funcional (no se hace ahora)

| Tema | Qué implica |
|---|---|
| Pagos | Proveedor con tarjeta, OXXO y meses sin intereses; checkout seguro |
| Inventario | Existencias reales por talla; "agotada" automática |
| Correos | Proveedor de newsletter y avisos de drop; doble confirmación |
| Páginas por producto | Una página por prenda con su imagen y título para WhatsApp, Instagram y Google (datos estructurados de producto) |
| Legal | Aviso de privacidad y términos revisados por un abogado, con datos del negocio |
| Medición | Analítica respetuosa: qué prendas se giran, se abren y se agregan |
| Asistente con IA | Estilo y tallas conversando, como la tendencia de Brunello Cucinelli |
