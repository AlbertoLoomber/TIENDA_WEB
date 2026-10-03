# 01 · Fase 1: pulido y español

**Objetivo de la fase:** que el sitio se lea bien, esté en español y no tenga detalles
visuales que lo hagan ver como demo. No necesita fotos ni videos nuevos.

**Esfuerzo:** S = pequeño (menos de una hora), M = mediano (una a tres horas), L = grande (más de tres horas).

| Tarea | Qué resuelve | Esfuerzo |
|---|---|---|
| T1.1 | Todo el sitio en español | L |
| T1.2 | Letra legible (mínimo 12 px) | M |
| T1.3 | Tubo sin bordes ni costuras | M |
| T1.4 | Detalle sin texto fantasma y con el perchero centrado | M |
| T1.5 | Portada que dice qué es Nomad | S |
| T1.6 | Logo en SVG | S |
| T1.7 | Accesibilidad | S |
| T1.8 | Perchero grande en tablet vertical | M |
| T1.9 | Indicar que se puede deslizar | S |
| T1.10 | Textos de marca sin promesas difíciles | S |
| T1.11 | Pruebas dentro del repositorio | M |

---

## T1.1 Todo el sitio en español

| | |
|---|---|
| **Objetivo** | Que un visitante en México lea todo en su idioma. |
| **Depende de** | Textos del archivo `05-textos.md` (aprobados o provisionales). |
| **Archivos** | `web/index.html`, `web/app.js`, `web/shop.js`, `web/sections.js`, `catalogo.json`, `tools/catalogo_web.py`, `web/og.jpg` |

### Diseño
- Los nombres de diseño se quedan en inglés porque son la frase del estampado; la categoría va en español.
- **Dos formas del nombre** (nuevo campo `diseno` en los datos, ver `06-datos.md`):
  - **Completo**, en la ficha, el detalle y el texto bajo el perchero: "Playera More Than Money".
  - **Corto**, en la colección, el lookbook y la bolsa: "More Than Money", con la categoría en
    la línea de abajo ("Playera · $690").

  Así las etiquetas de la colección no se parten en tres renglones.
- Precios: `$1,290 MXN`. Fechas: "sáb 24 oct · 20:00 h".

### Implementación
1. **`index.html`:**
   - `lang="es-MX"`, `<title>`, `meta description`, `og:title`, `og:description` y `og:locale = es_MX`;
   - todos los textos visibles y todos los `aria-label` (lista completa en `05-textos.md`).
2. **`app.js`:**
   - constante `MARQUEE`, que pasa a leerse de `site.band`;
   - `setCaption()`, con el formato `${nombre} · ${precio}` y las indicaciones de cursor o toque;
   - `fillDetail()`: `aria-label` "vista de frente" y conteo "01 / 05".
3. **`shop.js`:**
   - filtros desde `categoria_plural` ("Todo", "Sobrecamisas", "Playeras", "Sudaderas");
   - etiqueta "Nuevo";
   - vistas "Frente", "Lado" y "Puesta";
   - mensajes de la bolsa y textos de la guía.
4. **`sections.js`:** etiquetas del lookbook ("Look 01") y contador.
5. **Formatos:**
   ```js
   const mxn = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
   N.price = (n) => `$${mxn.format(n)} MXN`;
   const fecha = new Intl.DateTimeFormat("es-MX", {
     weekday: "short", day: "numeric", month: "short",
     hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
   });
   ```
6. **Datos:** `catalogo.json` con los textos en español; `tools/catalogo_web.py` copia los
   campos nuevos (`diseno`, `categoria_plural`, `slug`, `barra`…).
7. **Imagen para compartir:**
   - el script que generó `og.jpg` vive hoy fuera del repositorio, así que se pasa a
     `tools/imagen_compartir.py`;
   - la imagen se regenera con "Playeras, sudaderas y sobrecamisas de algodón pesado" y el logo en SVG.

### Listo cuando
- [ ] Buscar en los archivos de la página "Shop", "About", "Contact", "Add to bag", "Size", "Details", "Care", "View", "Close", "New", "pieces", "Hover", "Tap" y "Subscribe" no encuentra textos de interfaz.
- [ ] En 705 px y 375 px, ninguna etiqueta de la colección, filtro ni botón se parte donde no debe.
- [ ] Los lectores de pantalla anuncian los textos en español (todos los `aria-label` traducidos).

### Riesgos
- **El español ocupa 20–30% más.** Mitigación: nombre corto en la colección; revisar el ancho de las líneas que no se parten (`.piece__line`).
- **SplitText vuelve a dividir los títulos:** no hace falta cambiar nada, porque ya divide al cargar la fuente.

---

## T1.2 Letra legible (mínimo 12 px)

| | |
|---|---|
| **Objetivo** | Que todo se lea sin esfuerzo, sobre todo el precio. |
| **Archivos** | `web/styles.css` |

### Cambios (antes → después)

| Elemento | Antes | Después |
|---|---|---|
| Menú (`.top__link`, `.top__close`) | 10.5px, 0.16em | 12px, 0.14em |
| Texto bajo el perchero (`.caption`) | 11px | 13px |
| Botones (`.pill`) | 10px | 12px |
| Encabezados pequeños (`.eyebrow`) | 10px, 0.2em | 12px, 0.16em |
| Filtros (`.filter`) | 10px y contador de 8px | 12px; el contador pasa a texto normal: "Playeras 3" |
| Línea de la colección (`.piece__line`) | 9.5px | Categoría 12.5px y precio 15px |
| "Nuevo" (`.piece__badge`) | 8px | 12px (o etiqueta colgante, T3.3) |
| Categoría del detalle (`.detail__cat`) | 9.5px | 12px |
| Nombre del detalle (`.detail__name`) | `clamp(17px, 2.1vw, 22px)` | `clamp(20px, 2.4vw, 26px)` |
| Precio del detalle (`.detail__price`) | 11px | 17px |
| Cajón de tallas (`.drawer__label`, `.drawer__note`) | 9.5 / 11px | 12 / 13px |
| Chips de talla (`.sizes button`) | 11px | 13px, mínimo 44×44px |
| Barra (`.band__track span`) | 10.5px | 12px |
| Datos de Nosotros (`.facts__k`), pie de foto | 9.5px | 12px |
| Pie (`.foot__k`, `.foot__base`) | 9.5px | 12px, con color `--foot-k` |
| Ficha: cerrar, vistas, acordeones | 10–10.5px | 12px |
| Ficha: precio (`.sheet__price`) | 13px | 17px |
| Guía de tallas: encabezados y nota | 9 / 11px | 12px |

### Implementación
1. Declarar los tokens de `00-sistema-de-diseno.md` §3 en `:root`.
2. Reemplazar los tamaños sueltos por tokens; un solo cambio por selector.
3. Revisar los anchos que dependen del texto:
   - `.piece__meta` (márgenes negativos de 12px);
   - la fila de filtros en celular, que se desliza;
   - el cajón de tallas (`min(420px, …)`).

### Listo cuando
- [ ] El script `letra.js` (T1.11) no encuentra textos visibles por debajo de 12 px en los 5 tamaños.
- [ ] Capturas antes/después de portada, detalle, colección, ficha y pie aprobadas.

### Riesgos
- **La composición de la portada cambia un poco** por el texto más grande. Mitigación: el
  texto bajo el perchero tiene alto fijo (`min-height`) para que no empuje el botón.

---

## T1.3 Tubo sin bordes ni costuras

| | |
|---|---|
| **Objetivo** | Que el tubo se vea como un solo objeto real en las cuatro escalas. |
| **Archivos** | `tools/procesar_rail.py`, `web/rail/left.webp`, `mid.webp`, `right.webp` |

### Problema medido
- La ventana de recorte termina en la fila 460 de la foto, donde la sombra todavía no se ha
  ido: queda un borde recto abajo y en los extremos.
- La pieza central se estira al ancho del perchero y los topes no. En la unión, el brillo y la
  sombra del tubo no coinciden y se nota un escalón de tono.

### Implementación (en `procesar_rail.py`)
1. **Desvanecer la sombra en los bordes de la ventana:**
   ```python
   ramp = np.ones(BOTTOM - TOP)
   ramp[-36:] = smoothstep(np.linspace(1, 0, 36))      # últimas 36 filas
   rgba[..., 3] *= ramp[:, None]                         # solo donde no es el tubo opaco
   ```
   Lo mismo en los 24px exteriores de cada tope (a la izquierda de `X0 + 24` y a la derecha de
   `X1 − 24`), aplicado solo a la sombra y nunca a los píxeles opacos del soporte.
2. **Perfil uniforme del tubo:**
   - calcular la columna mediana del tubo entre las columnas 900 y 1100 de la foto (color y alfa por fila);
   - mezclar hacia esa columna los primeros y últimos 40px de `mid`;
   - mezclar también los últimos 30px del lado del tubo en `left` y `right`.

   Así las dos caras de cada unión son idénticas.
3. Volver a exportar con la misma calidad (WebP 88). `rail.json` no cambia.

### Listo cuando
- [ ] En recortes al 300%, con el contraste ×1.8, no se ve ni el borde de la sombra ni el escalón en las uniones (portada, colección, estudio, mini tubo de la etiqueta).
- [ ] La sombra llega a 0 antes del borde inferior de la pieza.

---

## T1.4 Detalle sin texto fantasma y con el perchero centrado

| | |
|---|---|
| **Objetivo** | Que el fondo del detalle se vea intencional: un perchero real detrás de ti. |
| **Archivos** | `web/app.js` (`openDetail`, `step`, `closeDetail`, `restingRect`), `web/styles.css` |

### Diseño

```
ANTES                                   DESPUÉS
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ ═══════════════════════════  │        │ ═══════════════════════════  │
│        ┌──────┐   ░░  ░░     │        │   ░░  ░░ ┌──────┐ ░░  ░░     │
│   (‹)  │PRENDA│   ░░  ░░ (›) │        │ (‹) ░░  │PRENDA│ ░░  ░░ (›) │
│        │      │              │        │         │      │            │
│        └──────┘              │        │         └──────┘            │
│   ▒▒▒ texto borroso ▒▒▒      │        │        SOBRECAMISA · 01/05  │
│      SOBRECAMISA · 01/05     │        │         Sobrecamisa Camo    │
│        Sobrecamisa Camo      │        │           $1,290 MXN        │
└──────────────────────────────┘        └──────────────────────────────┘
 Perchero sin centrar: el lado           El gancho vacío queda detrás de la
 izquierdo vacío.                        prenda; hay prendas a ambos lados.
```

### Comportamiento

| Momento | Perchero de fondo | Prenda | Texto y botón del perchero |
|---|---|---|---|
| Abrir | `scale 1 → 0.95` y `x 0 → x₁`, 0.85 s `power3.inOut` | Vuela al centro (ya existe) | `opacity → 0`, 0.3 s, luego `visibility: hidden` |
| Cambiar con ‹ › | `x₁ → x₂`, 0.6 s `power3.inOut`, al mismo tiempo que el fundido | Fundido (ya existe) | Ocultos |
| Cerrar | `x → 0` y `scale → 1`, 0.75 s | Vuelve a su gancho | Reaparecen al terminar |

- Desenfoque del perchero: de 9px a **6px**; opacidad de 0.26 a **0.4**. Las prendas se reconocen sin competir.

### Implementación
1. **CSS:** el texto y el botón del perchero ya no se desenfocan; se ocultan:
   ```css
   .is-detail .caption, .is-detail #see { opacity: 0; visibility: hidden; filter: none;
     transition: opacity .3s var(--ease-out), visibility 0s .3s; }
   .is-detail .rack { filter: blur(6px); opacity: .4; }
   ```
2. **Desplazamiento:** con el perchero escalado `s` alrededor de su centro `c`, el centro del
   gancho activo `g` queda en `c + (g − c)·s`. Para que coincida con el centro de la prenda `f`:
   ```js
   const x = f - (c + (g - c) * s);
   ```
   Se calcula con las posiciones en reposo (`offsetLeft` del gancho y ancho del perchero),
   nunca con medidas tomadas a mitad de una animación.
3. **`restingRect`:** hoy deshace solo la escala. Debe deshacer también `x`:
   ```js
   left = c + (r.left - x - c) / s
   ```
   Así la prenda vuelve a su gancho exacto aunque el perchero esté desplazado.
4. **Celular:** el perchero se desliza con scroll horizontal propio; ahí no se usa `x`, sino
   `rack.scrollTo({ left })` animado con GSAP (`scrollLeft`) para centrar el gancho.

### Listo cuando
- [ ] Con cualquiera de las 5 prendas abierta hay prendas visibles a ambos lados (salvo en los extremos, donde se ve el tope del tubo).
- [ ] Al cerrar, la prenda cae en su gancho sin saltos (prueba de restos: posición final ±1px).
- [ ] No se ve texto borroso detrás en ningún tamaño.

---

## T1.5 Portada que dice qué es Nomad

| | |
|---|---|
| **Objetivo** | Que quien llega por primera vez entienda qué vende la marca, sin ensuciar el perchero. |
| **Archivos** | `web/index.html`, `web/app.js`, `web/styles.css`, `catalogo.json` (`sitio.barra`) |

### Diseño
- **Texto bajo el perchero:**
  - sin prenda activa: "Pasa el cursor para girar · Clic para ver" (táctil: "Toca para girar · Toca otra vez para ver");
  - con prenda activa: "Playera More Than Money · $690".
- **Botón:** "Ver tallas".
- **Título principal** (oculto a la vista, presente para buscadores y lectores):
  `<h1 class="sr-only">Nomad: playeras, sudaderas y sobrecamisas de algodón pesado</h1>`.
- **Prueba A/B:** línea "Drop 01 · 5 prendas" centrada bajo el encabezado, 12px `--ink-soft`.
  Aparece al terminar la entrada del perchero y se oculta en el detalle. **Se queda solo si
  en las capturas no compite con el logo.**
- **Barra:** "Drop 01 ya en el perchero • Envíos a todo México • Algodón pesado • Avísame del Drop 02", leída de `sitio.barra`.

### Listo cuando
- [ ] La portada pasa la auditoría con un h1.
- [ ] Decisión A/B tomada con capturas en 1440 y 390 px.

---

## T1.6 Logo en SVG

| | |
|---|---|
| **Objetivo** | Logo nítido en cualquier tamaño y una fuente menos (−1 petición, unos 20 KB). |
| **Archivos** | `web/index.html`, `web/styles.css`, `assets/marca/logo-nomad-navy.svg` |

### Implementación
1. Insertar el SVG en línea (`<svg viewBox=… role="img" aria-label="Nomad">`) con
   `fill="currentColor"`, en tres lugares:
   - encabezado: alto de 30px en escritorio y 26px en celular, calibrado contra la captura
     actual con una tolerancia de ±2px;
   - pie, en color `--band-ink`;
   - Nosotros: mismo tamaño que hoy, `clamp(84px, 12vw, 170px)` de alto de letra.
2. Se conserva `transform: rotate(-7deg)`. La animación "se escribe solo" de Nosotros usa
   `clip-path`, así que funciona igual con SVG.
3. Quitar `Yellowtail` de la petición de Google Fonts:
   `family=Archivo:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap`.
4. La imagen para compartir (T1.1) también usa el SVG.

### Listo cuando
- [ ] Capturas antes/después: el logo se ve igual o mejor, sin cambios de posición.
- [ ] En la pestaña de red ya no aparece Yellowtail.

---

## T1.7 Accesibilidad

| | |
|---|---|
| **Objetivo** | 0 problemas graves o serios en axe, y una página que se puede usar con teclado. |
| **Archivos** | `web/index.html`, `web/styles.css`, `web/sections.js` |

### Cambios
1. **h1** (T1.5).
2. **Contraste del pie:** `.foot__k` y `.foot__base` pasan a `--foot-k` (`#CCD0DE`, 5.1:1).
3. **SplitText:** hoy agrega `aria-label` a los párrafos (`.about__body`, `.tag__body`), y eso
   no está permitido en un `<p>`. Se crea con `aria: "none"`; como la división es solo por
   líneas, el lector de pantalla lee el texto completo.
   ```js
   SplitText.create(el, { type: "lines", mask: "lines", aria: "none", … })
   ```
4. **Foco visible:** revisar filtros, chips, flechas, vistas de la ficha, acordeones y enlaces del pie.
5. **Textos alternativos** en español: "Sobrecamisa Camo, vista de frente".

### Listo cuando
- [ ] axe: 0 problemas graves o serios en la página, el detalle, la ficha y la guía.
- [ ] Recorrido completo con Tab: el foco nunca se pierde ni queda detrás de un panel.

---

## T1.8 Perchero grande en tablet vertical

| | |
|---|---|
| **Objetivo** | En tablet vertical las prendas se ven pequeñas con mucho espacio vacío; que llenen la pantalla. |
| **Archivos** | `web/app.js` (`layout`), `web/styles.css` |

### Implementación
1. Nueva condición en `layout()`:
   ```js
   const portraitTablet = stage.clientWidth <= 900 && stage.clientHeight > stage.clientWidth * 1.1;
   narrow = stage.clientWidth <= 640 || portraitTablet;
   ```
2. En modo `narrow`, el alto de prenda pasa a `clamp(min(availH, 560, ancho × 1.2), 200, 560)`:
   en 820×1180, unos 560px (hoy unos 300px). El perchero se desliza como en celular.
3. CSS: las reglas de `@media (max-width: 640px)` del perchero (scroll horizontal, sin barra,
   imán al centro) también aplican en `@media (max-width: 900px) and (orientation: portrait)`.
4. Revisar el detalle en ese tamaño: la prenda y las flechas no se enciman.

### Listo cuando
- [ ] En 768×1024 y 820×1180 las prendas miden al menos 480px de alto y el perchero se desliza con el dedo.
- [ ] En horizontal (1180×820) se ve como en escritorio.

---

## T1.9 Indicar que se puede deslizar

| | |
|---|---|
| **Objetivo** | Que en táctil se entienda que el perchero y la colección siguen a la derecha. |
| **Archivos** | `web/styles.css`, `web/app.js`, `web/shop.js` |

### Diseño
- El borde derecho se desvanece (`mask-image: linear-gradient(to right, #000 85%, transparent)`)
  mientras queda contenido a la derecha. Al llegar al final, el desvanecido pasa a la izquierda.
- Bajo el tubo, a la derecha: "Desliza" con el ícono de gancho. El ícono se mueve 6px a la
  derecha dos veces y se detiene.
- Solo en táctil (`@media (hover: none)`).

### Implementación
- Clases `.can-left` y `.can-right` según `scrollLeft`, actualizadas en `scroll` con `requestAnimationFrame`.
- La indicación se quita con el primer scroll horizontal y se recuerda en `sessionStorage`
  (`nomad.desliza`), dentro de `try/catch`.

### Listo cuando
- [ ] En 390 px se ve la indicación al cargar y desaparece al deslizar; con mouse nunca aparece.

---

## T1.10 Textos de marca sin promesas difíciles

| | |
|---|---|
| **Archivos** | `web/index.html`, `catalogo.json` |

- Quitar "New designs daily" de la barra y de los datos de Nosotros. Drops: "Cada mes" (P).
- Nosotros, texto nuevo: ver `05-textos.md`.
- Cuando tengas los datos reales (dónde se hace, gramaje, técnica), se agrega una cuarta fila a los datos.

---

## T1.11 Pruebas dentro del repositorio

| | |
|---|---|
| **Objetivo** | Que cada fase se verifique igual, con las mismas medidas. |
| **Archivos** | `tools/pruebas/` (nuevo) |

### Implementación
- `tools/pruebas/package.json` con `playwright` y `axe-core` como dependencias de desarrollo.
- Scripts: `capturas.js`, `accesibilidad.js`, `restos.js`, `letra.js` y `rendimiento.js`
  (después se suman `bolsa.js` y `enlaces.js`, en la fase 2). Detalle en `07-pruebas.md`.
- `tools/pruebas/README.md` con cómo correrlos:
  1. `python3 -m http.server -d web 8765`
  2. `node tools/pruebas/todo.js`
- Las capturas se guardan en `tools/pruebas/salida/`, que no se sube al repositorio.

### Listo cuando
- [ ] `node tools/pruebas/todo.js` corre todas las pruebas y termina con un resumen de aprobado o fallado por prueba.

---

## Entregable de la fase 1
- Vista previa publicada en la misma dirección.
- Capturas antes/después en los 5 tamaños.
- Informe de pruebas (axe, letra, restos y rendimiento).
- Commit y push en la rama de trabajo.
