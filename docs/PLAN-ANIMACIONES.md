# Plan de implementación: animaciones al bajar

> **Estado:** etapa 1 completa (T1–T5) y fase 2 completa (nombre que se escribe, foto del estudio, líneas de datos, etiqueta columpiándose y girando, pie de página como cortina). Pendiente: fase 3.

Etapa 1: la base premium (Fase 1) y el lookbook fijo con cortina.
Concepto rector: **todo cuelga, todo tiene peso**. Cada animación es una extensión
física del perchero (péndulo, tela, cortina de probador), nunca un efecto aislado.

---

## 0. Principios y medidas comunes

**Tokens de movimiento** (constantes en `app.js`, usados por todas las animaciones):

| Token | Valor | Uso |
|---|---|---|
| `EASE_OUT` | `expo.out` | Entradas: títulos, cortinas, fotos |
| `EASE_INOUT` | `power3.inOut` | Movimientos ligados al scroll y vuelos |
| `EASE_SWING` | `elastic.out(1, 0.3)` | Asentarse de prendas y etiquetas |
| `D_FAST` | 0.6 s | Microinteracciones |
| `D_BASE` | 1.0 s | Títulos, fotos |
| `D_SLOW` | 1.4 s | Cortinas grandes |
| `STAGGER` | 0.08 s | Entre líneas o elementos |

**Reglas:**
- Un solo protagonista por sección; lo demás acompaña.
- Solo se animan `transform`, `opacity` y `clip-path`, que no recalculan el diseño.
- Nada bloquea el scroll más de una pantalla, salvo el lookbook fijo.
- Con `prefers-reduced-motion: reduce`, Lenis se apaga, no hay pin ni scrub y todo aparece estático.
- Todo el contenido se ve sin JavaScript: los estados ocultos solo los pone JS.

---

## 1. Preparación técnica

### 1.1 Librerías (CDN permitidos por la vista publicada)
- GSAP **3.12.5 → 3.13.0** (cdnjs): `gsap.min.js`, `ScrollTrigger.min.js` y `SplitText.min.js`, ahora gratis.
- Lenis **1.3.26** (unpkg): `lenis.min.js` y `lenis.css`.
- Respaldo si cdnjs no tuviera 3.13.0: `cdn.jsdelivr.net/npm/gsap@3.13.0/dist/...`, también permitido.
- Para las pruebas locales, las mismas versiones salen de npm.

### 1.2 Organización del código
`app.js` hoy es un solo archivo. Lo separo en bloques claros, sin herramientas de build:

```
web/
  app.js          perchero, detalle (lo actual)
  scroll.js       Lenis + ScrollTrigger + tokens de movimiento (nuevo)
  sections.js     portada, títulos, lookbook, nosotros… (nuevo)
```

Se cargan en orden y comparten un objeto `window.NOMAD`, con `items`, `lenis` y los tokens.
`tools/build_artifact.py` ya copia todos los `<script>`; solo hay que publicar los archivos nuevos.

### 1.3 Políticas por dispositivo
| Caso | Lenis | Pin del lookbook | Scrub |
|---|---|---|---|
| Escritorio | Sí | Sí | Sí |
| Táctil (celular / tablet) | No (scroll nativo) | No: carrusel deslizable | No: animaciones al entrar |
| Reducir movimiento | No | No | No |

Se decide con `gsap.matchMedia()`, que deshace todo solo al cambiar de condición.

---

## 2. Tareas

### T1. Scroll suave con inercia (Lenis)
**Qué se ve:** el desplazamiento con rueda o trackpad tiene inercia suave y "caro"; las animaciones ligadas al scroll dejan de dar saltos.

**Implementación:**
```js
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
- Enlaces internos (About, Contact, Lookbook, logo): `lenis.scrollTo("#about", { offset: -altoEncabezado, duration: 1.4 })`.
- Abrir detalle: `lenis.scrollTo(0, { immediate: true })` y luego `lenis.stop()`; al cerrar, `lenis.start()`. Esto reemplaza la clase `is-locked`.
- El perchero en celular y el lookbook usan scroll horizontal propio: se marcan con `data-lenis-prevent`.

**Listo cuando:** la rueda se siente suave, los anclajes llegan con el encabezado sin tapar el título, el detalle bloquea el scroll y al cerrarlo todo vuelve a funcionar.

---

### T2. Las prendas reaccionan a la velocidad del scroll
**Qué se ve:** al bajar o subir rápido, las prendas del perchero se mecen un poco, como si alguien empujara el tubo. Al detenerte, se asientan con un rebote suave. Es la firma de la página.

**Implementación:**
- Nuevo contenedor `.slot__lean` entre `.slot` y `.slot__swing`. Así no choca con los balanceos que ya existen: los ángulos se suman.
- Un `ScrollTrigger` sobre `.hero` lee `self.getVelocity()` en cada actualización.
- Ángulo objetivo: `clamp(velocidad / 260, -5°, 5°)`. Cada prenda alterna el signo y lleva un pequeño retraso (`quickTo` con duración 0.45 + i·0.06 s), para que se vea como una onda y no como un bloque.
- Cuando la velocidad baja de un umbral, un `gsap.to(rotation: 0, ease: EASE_SWING)` las asienta.
- Solo se activa mientras la portada esté visible, y no con el detalle abierto ni con reducir movimiento.

**Parámetros a afinar en pantalla:** divisor de velocidad (260), tope de ángulo (5°) y retraso entre prendas (0.06 s).

**Listo cuando:** un desplazamiento suave casi no las mueve, uno rápido las mece sin exagerar y nunca se quedan inclinadas.

---

### T3. Salida de la portada con profundidad
**Qué se ve:** al bajar, el perchero sube más lento que la página (parallax), se aleja un poco y pierde intensidad. La sección del lookbook pasa por encima, como una hoja de papel con una sombra suave en su borde superior.

**Implementación:**
- `ScrollTrigger` con `scrub: true`, desde que la portada empieza a salir (`top top`) hasta que sale por completo (`bottom top`).
  - `.stage`: `yPercent 0 → 18`, `scale 1 → 0.94`, `opacity 1 → 0.35`.
  - La barra de texto se queda sin parallax: es el borde de la portada.
- `.more` lleva `position: relative; z-index: 2`, fondo de pared con puntos y `box-shadow: 0 -30px 60px rgba(…)`. Así se ve que la tapa.
- En el primer momento solo se mueve la escala, para que el perchero no "brinque".
- Sin `filter: blur` en escritorio por rendimiento; si se ve plano, se prueba un desenfoque de 4 px solo en pantallas grandes.

**Listo cuando:** la transición se siente como una sola pieza a 60 fps y, al regresar arriba, el perchero queda exactamente como estaba.

---

### T4. Títulos línea por línea
**Qué se ve:** cada título sube línea por línea desde detrás de una máscara invisible. Los párrafos aparecen igual, con menos recorrido. Los eyebrows (`LOOKBOOK · VOL. 01`) aparecen con un fundido y un ligero espaciado de letras.

**Implementación:**
- Se espera a `document.fonts.ready` antes de dividir, para que las líneas se corten con la fuente correcta.
- `SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true, onSplit(self) { return gsap.from(self.lines, {...}) } })`.
  - Títulos: `yPercent 110 → 0`, `D_BASE`, `EASE_OUT`, `STAGGER`.
  - Párrafos: `yPercent 60 → 0` con `opacity`, `D_FAST`.
  - Se dispara a `top 82%`, una sola vez.
- Se aplica a `.section-title`, `.about__body`, `.tag__title`, `.tag__body` y los nombres del lookbook.
- Se quita el `data-reveal` genérico de esos bloques para no animar dos veces.
- `autoSplit` vuelve a cortar las líneas si cambia el ancho, sin repetir la animación ya vista.

**Listo cuando:** ningún título "salta" al cargar la fuente, en celular las líneas se cortan bien y los lectores de pantalla siguen leyendo el texto completo (SplitText conserva `aria-label`).

---

### T5. Lookbook fijo con cortina de probador
**Qué se ve (escritorio):** al llegar al lookbook, la sección se queda fija y, mientras bajas, las fotos avanzan de derecha a izquierda.
- Cada foto se revela como una **cortina de probador**, de abajo hacia arriba, y la imagen interior hace un pequeño zoom hacia atrás.
- Abajo, un **tubo pequeño con un gancho** se desliza marcando el avance, junto a un contador `01 / 05` que cambia con un giro de número.
- Al terminar la última foto, la sección se suelta y sigue el scroll normal.

**Implementación:**
- `ScrollTrigger` con `pin: true` en `.lookbook`, `scrub: 1`, `end: "+=" + recorrido`. El recorrido es lo que el carrusel sobresale de la pantalla, y `invalidateOnRefresh` lo recalcula al cambiar el tamaño.
- Animación principal: `.lookbook__track` → `x: -recorrido`, `ease: "none"`.
- Cortina de cada tarjeta, con el carrusel horizontal como referencia (`containerAnimation`):
  - `.look__frame`: `clip-path inset(100% 0 0 0) → inset(0% 0 0 0)`.
  - Imagen interior: `scale 1.18 → 1`.
  - Empieza cuando la tarjeta entra por la derecha (`left 95%`) y termina a la mitad de la pantalla (`left 55%`).
- Las tarjetas crecen a `height: 64vh` en escritorio, para que las fotos se vean como protagonistas.
- Indicador: `.lookbook__progress` es un tramo del tubo real (`rail/mid.webp`) con un gancho en SVG en línea. Su posición `x` se liga al avance del pin, y el contador cambia al cruzar cada tarjeta.
- Las tarjetas que todavía no tienen foto (02 y 04) usan la misma cortina sobre la prenda colgada.
- Se llama `ScrollTrigger.refresh()` cuando cargan las fotos, para que los tamaños sean correctos.

**Celular / táctil / reducir movimiento:** sin pin. Carrusel horizontal nativo con `scroll-snap`; la cortina se dispara al entrar cada tarjeta en pantalla y el contador sigue la tarjeta centrada.

**Listo cuando:**
- En escritorio no hay salto al fijarse ni al soltarse.
- La última foto queda completa antes de soltar.
- El gancho llega al final del tubo exactamente con la última foto.
- En celular se desliza con el dedo sin pelear con el scroll vertical.

---

## 3. Orden de trabajo y estimación

| Paso | Tarea | Depende de | Estimado |
|---|---|---|---|
| 1 | Preparación: GSAP 3.13, SplitText, Lenis, separar `scroll.js` / `sections.js`, tokens | — | 0.5 día |
| 2 | T1 Lenis + anclajes + bloqueo en el detalle | 1 | 0.5 día |
| 3 | T4 Títulos línea por línea | 1 | 0.5 día |
| 4 | T3 Salida de la portada | 2 | 0.5 día |
| 5 | T2 Prendas reaccionan a la velocidad | 2 | 0.5 día |
| 6 | T5 Lookbook fijo con cortina + indicador | 2, 3 | 1 día |
| 7 | Afinado conjunto, celular, reducir movimiento, rendimiento | todo | 0.5 día |

Entrega sugerida en dos publicaciones:
1. **Pasos 1–4:** base premium, para validar la sensación del scroll.
2. **Pasos 5–7:** prendas reactivas y lookbook.

---

## 4. Cómo se prueba cada entrega

- **Escritorio 1440×860 y 1280×720, celular 390×800** (táctil): recorrido completo arriba → abajo → arriba.
- **Cámara lenta** (`gsap.globalTimeline.timeScale(0.2)`) con capturas cuadro por cuadro de cada transición, como ya hicimos con el giro.
- **Reducir movimiento activado:** todo visible, sin pin ni scrub.
- **Rendimiento:** CPU limitada 4× en Chrome; sin tirones al fijar o soltar el lookbook ni en la salida de la portada.
- **Sin errores en consola** y sin desplazamiento horizontal de la página.
- **Detalle de prenda:** abrir desde la portada y desde abajo, navegar y cerrar; el scroll debe volver a funcionar.

---

## 5. Riesgos y cómo los cubrimos

| Riesgo | Mitigación |
|---|---|
| Lenis dentro del marco de la vista publicada | Probar en la vista publicada en la primera entrega; si falla, se desactiva Lenis sin afectar lo demás |
| Pin + Lenis + cambio de tamaño de ventana | `invalidateOnRefresh`, `refresh()` tras cargar fotos y fuentes, `matchMedia` para revertir |
| Títulos que se cortan distinto al cargar la fuente | Dividir después de `document.fonts.ready`, con `autoSplit` |
| iOS y scroll táctil | Lenis apagado en táctil; carrusel nativo con `data-lenis-prevent` |
| Exceso de movimiento | Cada tarea tiene parámetros a la vista; se afinan con tu revisión antes de seguir |

---

## 6. Después de esta etapa (fase 2 y 3)

- "Nomad" que se escribe solo en Nosotros; foto del estudio que se abre desde el centro; líneas de datos que se dibujan.
- Etiqueta del newsletter que entra columpiándose y gira al suscribirse.
- Pie de página revelado como cortina, fijo detrás del contenido.
- Barra de texto que cambia de velocidad con el scroll.
- Línea de progreso en el encabezado y nombre de la sección actual.
- Botones con relleno de izquierda a derecha y enlaces con subrayado que se dibuja.
- Colección con transiciones de vista (View Transitions API) entre cuadrícula y ficha.
