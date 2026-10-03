# 03 · Fase 3: interacciones de firma

**Objetivo de la fase:** dos o tres detalles que solo tiene Nomad y que salen del mismo
concepto: **todo cuelga, todo tiene peso**. Todos en intensidad baja.

| Tarea | Qué resuelve | Esfuerzo | Necesita |
|---|---|---|---|
| T3.1 | Las prendas se mecen al pasar la mano | M | — |
| T3.2 | Arrastrar para girar en la ficha | M | Opcional: lado derecho (PROMPTS 16.2) |
| T3.3 | Precio en etiqueta colgante | M | — |
| T3.4 | Sección "De cerca" | L | Fotos macro (PROMPTS 17) |
| T3.5 | Drop 02 con cuenta regresiva | M | Prenda tapada (PROMPTS 23) |

---

## T3.1 Las prendas se mecen al pasar la mano

| | |
|---|---|
| **Objetivo** | Que el perchero responda como uno real cuando lo recorres rápido con el cursor. |
| **Archivos** | `web/app.js` (nuevo bloque `setupBrush`, junto a `setupLean`) |

### Comportamiento
- **Cursor lento** (menos de 0.6 px/ms): pasa lo de hoy; si se detiene 90 ms sobre una prenda, la gira.
- **Cursor rápido** (0.6 px/ms o más): cada prenda que cruza se mece hacia donde va el cursor, sin girar.
- Las prendas lejanas no se mueven: solo las que el cursor cruza.
- **En celular:** al deslizar el perchero, las prendas se inclinan un poco en sentido contrario y
  se enderezan al parar, con la inclinación por velocidad que ya existe para el scroll vertical.

### Parámetros

| Parámetro | Valor | Por qué |
|---|---|---|
| Umbral de velocidad | 0.6 px/ms | Por debajo es un recorrido normal |
| Suavizado | `v = v + (vNueva − v) × 0.35` | Evita saltos por eventos irregulares |
| Fuerza | `clamp(v × 3.2, 1.5°, 5°)` | Nunca más de 5° |
| Sentido | `sway(prenda, −signo(vx) × fuerza)` | Con el pivote arriba, un ángulo negativo lleva la parte de abajo a la derecha |
| Pausa por prenda | 250 ms | Que no vibre si el cursor va y viene |
| Retorno | El `sway()` actual: `elastic.out(1, 0.22)`, 1.9 s | Mismo carácter que todo el perchero |
| Celular: inclinación máxima | 3° | Menor que la vertical (4.5°) |

### Implementación
```js
function setupBrush() {
  if (reduceMotion || !finePointer) return;
  let lastX = null, lastT = 0, v = 0;
  const cooldown = new Map();
  rack.addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (lastX !== null && detailIndex < 0) {
      v += ((e.clientX - lastX) / Math.max(1, now - lastT) - v) * 0.35;
      if (Math.abs(v) >= 0.6) {
        items.forEach((it, i) => {
          const r = it.slot.getBoundingClientRect(), cx = r.left + r.width / 2;
          const crossed = (lastX - cx) * (e.clientX - cx) <= 0;
          if (!crossed || i === active || gsap.isTweening(it.turn)) return;
          if (now - (cooldown.get(i) || 0) < 250) return;
          cooldown.set(i, now);
          sway(it, -Math.sign(v) * clamp(Math.abs(v) * 3.2, 1.5, 5));
        });
      }
    }
    lastX = e.clientX; lastT = now;
  });
  rack.addEventListener("pointerleave", () => { lastX = null; v = 0; });
}
```
- Cuenta como actividad: reinicia el temporizador de la brisa (`IDLE_MS`).
- Las posiciones de las prendas se leen una vez por evento, no por prenda (sin recálculos de diseño repetidos).

### Listo cuando
- [x] Prueba automática: barrido a 1.2 px/ms; ninguna prenda pasa de 5° y todas vuelven a 0° antes de 2.2 s.
- [ ] Barrido lento (0.3 px/ms): sin vaivén; el giro por hover funciona como hoy.
- [ ] No interfiere con el giro, la onda a los vecinos ni la brisa.

---

## T3.2 Arrastrar para girar en la ficha

| | |
|---|---|
| **Objetivo** | Girar la prenda con el dedo o el mouse, como en una tienda. |
| **Archivos** | `web/shop.js` (escenario de la ficha), `web/index.html` (`gsap@3.13.0/dist/Draggable.min.js`), `web/styles.css` |

### Comportamiento
- Se arrastra horizontalmente sobre la prenda en la ficha (no en el detalle del perchero, donde
  deslizar cambia de prenda).
- La prenda gira siguiendo el dedo. Al soltar, se acomoda en la vista más cercana:

| Vista | Avance `p` | Imagen |
|---|---|---|
| Lado (la del perchero) | +1 | Vista de perfil actual |
| Frente | 0 | Vista de frente |
| Lado derecho | −1 | Solo si existe (PROMPTS 16.2); si no, ese lado ofrece resistencia y regresa |

- **Dirección:** la que hace que el estampado siga al dedo. Con las fotos actuales, el estampado
  queda a la izquierda en la vista de perfil, así que arrastrar a la izquierda lleva a "Lado".
- Las pestañas "Frente" y "Lado" se sincronizan con el arrastre, y elegir una pestaña anima el giro.
- **Primera vez:** píldora "Arrastra para girar ↔" bajo la prenda. Se va al primer arrastre o a los 4 s
  y se recuerda en `sessionStorage` (`nomad.arrastra`).
- **Cursor:** `grab` y, al arrastrar, `grabbing`.

### Cálculo
```js
// dx desde el inicio del arrastre; W = ancho del escenario
p = clamp(p0 - dx / (W * 0.45), -1, 1);
// lado de perfil (p >= 0): el giro 3D actual con turn.p = 1 - p   (0 = perfil, 1 = frente)
// lado derecho (p < 0): con fotos, segundo giro con turnR.p = 1 + p; sin fotos, p_vis = p * 0.15
```

**Al soltar** se calcula el destino con la posición y la velocidad (sin InertiaPlugin):
- `|p| > 0.5` o velocidad mayor a 600 px/s hacia un lado → ese lado;
- si no → frente;
- animación 0.6 s `power3.out`;
- con "reducir movimiento", sin animación.

**Draggable:** `type: "x"`, `lockAxis: true`, `allowNativeTouchScrolling: true`. La prenda no
se mueve de lugar, solo se lee el desplazamiento. CSS: `touch-action: pan-y` en el escenario,
para que el scroll vertical de la ficha siga funcionando en celular.

**Con los cuadros del video** (T4.1): `turn.p` recorre todos los cuadros reales y el giro se vuelve continuo.

### Accesibilidad
- Arrastrar es un extra: las pestañas siguen siendo la forma accesible de ver cada vista.
- Con teclado, ← y → sobre el escenario enfocado cambian de vista. El escenario lleva
  `aria-roledescription="visor"` y su `aria-label` dice qué vista está a la vista.

### Listo cuando
- [ ] En celular, arrastrar horizontal gira y arrastrar vertical hace scroll, sin trabarse.
- [x] Al soltar, siempre termina en una vista exacta (sin ángulos a medias).
- [x] Las pestañas y el giro nunca se desincronizan.

---

## T3.3 Precio en etiqueta colgante

| | |
|---|---|
| **Objetivo** | Que el precio sea parte del objeto (como en una tienda física) y se lea mejor. |
| **Archivos** | `web/shop.js` (`buildRail`), `web/styles.css` |

### Diseño

```
          ═══════╤═══════
                 │
            ┌────┴────┐
            │  cuello │╲          ← el cordón sale de la base del gancho
            │         │ ╲
            │         │ ┌o──────┐
            │ PRENDA  │ │ $690  │  ← cartón kraft, 52×26 px, inclinado −4° a 5°
            │         │ └───────┘
            └─────────┘
          More Than Money
          PLAYERA
```

- **Cartón:**
  - color `--kraft`, borde de 1px `rgba(0,0,0,.08)` y esquinas izquierdas recortadas (como la etiqueta de la newsletter);
  - agujero de 5px color pared;
  - texto `$690` en 12px, peso 600, números de ancho fijo y `--ink` (8.1:1).
- **Cordón:** 1px `--string`, de unos 18px, desde la base del gancho hasta el agujero. El punto
  exacto se calibra con una captura. Es el mismo para todas las prendas, porque el gancho está alineado.
- **Inclinación de reposo** por prenda: −4°, 3°, −2°, 5°, −3°, para que no se vean idénticas.
- **"Nuevo":** dos opciones que se deciden con capturas:
  - A) segunda etiqueta azul marino con "NUEVO" en 12px;
  - B) **(recomendada)** la etiqueta pequeña junto al nombre, como hoy pero en 12px.

### Movimiento
- La etiqueta está dentro del elemento que se mece, así que se mueve con la prenda.
- Al pasar el cursor, además, un columpio propio: reposo → +8° → reposo, `elastic.out(1, 0.3)`, 1.4 s, 0.08 s de retraso.
- En la entrada de la colección cae con su prenda (no tiene entrada propia).

### Accesibilidad
La etiqueta es decorativa (`aria-hidden="true"`) y el precio sigue en la línea de texto, oculto
a la vista (`sr-only`) si la etiqueta lo reemplaza.

### Decisión con capturas
En 1440, 705 y 390 px, con prendas de 230 a 300px de alto. Si se ve recargada, se queda la línea
de texto con el precio en 15px (T1.2).

---

## T3.4 Sección "De cerca"

> **Hecho (sesión 7).** `web/closeup.js`; datos en `sitio.cerca`; prueba `tools/pruebas/cerca.js`. Las fotos son muestras recortadas de las prendas (`tools/fotos_web.py`) hasta que lleguen las macros (PROMPTS 17). En celular, la prenda lleva puntos numerados.

| | |
|---|---|
| **Objetivo** | Mostrar calidad (estampado, cuello, tela) sin otra sección que fije el scroll. |
| **Archivos** | `web/index.html` (sección entre Colección y Lookbook), `web/sections.js` (`closeup`), `web/styles.css`, `catalogo.json` (`sitio.cerca`) |

### Diseño

```
ESCRITORIO (≥ 901 px)
 DE CERCA
 Hecha para durar.

  ┌───────┐                 ═════╤═════                 ┌───────┐
  │ macro │ 01               ┌───┴───┐  ●───────────────│ macro │ 02
  │estampa│ Serigrafía       │ cuello│                  │ cuello│ Cuello
  └───────┘ Tintas base      │       │                  └───────┘ Acanalado que
       ╲    agua (P)    ●────│ PRINT │                            no se deforma (P)
        ╲───────────────╯    │       │
                             │       │                  ┌───────┐
                             │       │  ●───────────────│ macro │ 03
                             └───────┘                  │ tela  │ Tela
                                                        └───────┘ 100% algodón,
                                                                  240 g/m² (P)

CELULAR
 DE CERCA
 Hecha para durar.
       ═════╤═════
        ┌───┴───┐
        │ ② ① ③ │   ← puntos numerados sobre la prenda
        └───────┘
 (○) 01 Serigrafía · Tintas base agua
 (○) 02 Cuello · Acanalado que no se deforma
 (○) 03 Tela · 100% algodón, 240 g/m²
```

- **Prenda:** la 03 de frente, 420px de alto en escritorio, sobre un tubo corto (escala mini).
- **Círculos:** 150px en escritorio, 110px en tablet y 84px en celular; foto macro con `object-fit: cover`.
- **Textos:** número `--fs-label`, título en cursiva 22px y texto en 14px (máximo 26 caracteres por línea).
- **Puntos:** anillo de 10px con un centro de 4px en `--ink`. Líneas de 1px `--ink` al 40%.

### Entrada (una vez, al llegar al 70% de la pantalla)

| Paso | Elemento | Animación | Tiempo |
|---|---|---|---|
| 1 | Prenda | Opacidad 0 → 1 y 24px hacia arriba | 1.0 s `expo.out` |
| 2 | Línea de cada detalle | Se dibuja (`stroke-dashoffset`) | 0.6 s `power2.inOut`, 0.18 s entre una y otra |
| 3 | Punto | Escala 0 → 1 | 0.3 s `back.out(2)` |
| 4 | Círculo | `clip-path: circle(0%) → circle(50%)` | 0.7 s `expo.out` |
| 5 | Texto | 10px hacia arriba y fundido | 0.5 s |

- **Al pasar el cursor sobre un detalle:** su punto late (anillo de escala 1 → 1.6 que se
  desvanece, 1.2 s, una vez) y la foto del círculo crece a 1.06 (0.6 s).
- **En celular:** tocar un renglón hace latir su punto.
- **Reducir movimiento:** todo aparece dibujado.

### Implementación
- Las líneas son un SVG que cubre la sección. Los trazos se calculan en JS con las posiciones de
  los puntos y los círculos: `M px py H bx L cx cy` (horizontal y luego diagonal hasta el
  borde del círculo). Se recalculan con `ResizeObserver`.
- Sin plugin: `getTotalLength()` y `stroke-dasharray` / `stroke-dashoffset`.
- **Datos:**
  ```json
  "cerca": { "prenda": "03-white-tee-dollar", "puntos": [
    { "id": "estampado", "titulo": "Serigrafía", "texto": "Tintas base agua.", "foto": "fotos/cerca-03-estampado.webp", "x": 0.50, "y": 0.36, "lado": "izq" },
    { "id": "cuello", "titulo": "Cuello", "texto": "Acanalado que no se deforma.", "foto": "fotos/cerca-03-cuello.webp", "x": 0.50, "y": 0.12, "lado": "der" },
    { "id": "tela", "titulo": "Tela", "texto": "100% algodón, 240 g/m².", "foto": "fotos/cerca-tela.webp", "x": 0.70, "y": 0.80, "lado": "der" } ] }
  ```
  `x` y `y` son proporciones del lienzo de la prenda (1000×1300), así funcionan en cualquier tamaño.
- **Fotos:** WebP de 300×300 (el doble de 150px), unos 60 KB cada una, con `loading="lazy"`.
- **Ficha:** si la prenda tiene `cerca.foto`, aparece la cuarta pestaña "De cerca", que muestra
  la foto como la vista "Puesta".

### Listo cuando
- [x] La sección no fija el scroll y su entrada ocurre una sola vez.
- [x] Las líneas llegan exactas a puntos y círculos en los 5 tamaños, también después de cambiar el tamaño de la ventana.
- [x] Pesa menos de 250 KB en total y nada carga antes de acercarse a la sección.

---

## T3.5 Drop 02 con cuenta regresiva

> **Hecho (sesión 7).** `web/drop.js`; datos en `sitio.drop`; prueba `tools/pruebas/drop.js` (con reloj falso para el cambio de minuto y la hora del drop). La prenda tapada es un dibujo SVG hasta que llegue `drop-02.png` (PROMPTS 23); se muestra desde 821 px de ancho.

| | |
|---|---|
| **Objetivo** | Dar un motivo para volver y para dejar el correo, con el lenguaje de la etiqueta colgante. |
| **Archivos** | `web/index.html` (newsletter), `web/app.js` (`setupNewsletter`), `web/sections.js` (`hangTag`), `web/styles.css`, `catalogo.json` (`sitio.drop`) |

### Diseño

```
ESCRITORIO
            ══════════════════════╤══════════════════════════   ← tubo de 380 px
                 ╭──┴──╮                      │
                 │funda│                      │
                 │ ░░░ │╲                ┌────o──────────────────────┐
                 │ ░░░ │ ┌──────┐        │ DROP 02 · SÁB 24 OCT · 20:00 h │
                 │ ░░░ │ │Drop02│        │ Avísame cuando salga           │
                 │ ░░░ │ └──────┘        │                                │
                 ╰─────╯                 │  21  │  03  │  12              │
              prenda tapada              │ DÍAS │ HORAS│ MIN              │
              (300 px de alto)           │                                │
                                         │ Las prendas nuevas llegan…     │
                                         │ [ tu@correo.com ] ( AVÍSAME )  │
                                         └────────────────────────────────┘
CELULAR: solo la etiqueta (la prenda tapada se oculta para no apretar).
```

- **Tubo** más ancho que hoy (de 132 a 380px en escritorio y 300px en tablet). De él cuelgan la
  prenda tapada (PROMPTS 23, recortada y con el gancho alineado como las demás prendas) y la etiqueta.
- **Cuenta regresiva:** **días · horas · min, sin segundos**, para que no haya movimiento
  constante. Dígitos `--fs-digit` con números de ancho fijo; separadores de 1px `--line`.
- **Fecha** en hora del centro de México: "(hora del centro de México)" en el detalle.

### Estados

| Estado | Encabezado | Contenido |
|---|---|---|
| Antes del drop | "Drop 02 · sáb 24 oct · 20:00 h" | Cuenta regresiva, texto, correo, "Avísame" |
| Enviado | — | Reverso de la etiqueta (gira como hoy): "Listo, te avisamos." |
| Después de la fecha | "Drop 02 · ya disponible" | "Ya está en el perchero" y botón "Ver el drop" (lleva a la colección) |

### Movimiento
- La etiqueta se columpia como hoy. La prenda tapada se columpia con el mismo carácter, con 0.25 s de retraso y 70% de amplitud: dos objetos en el mismo tubo, no sincronizados.
- **Dígitos:** solo el que cambia sube (el viejo sale hacia arriba y el nuevo entra desde abajo,
  `count` 0.35 s) dentro de una caja que recorta. Se actualiza al cambiar el minuto, con un
  `setTimeout` alineado al minuto, no con un intervalo por segundo.
- Si la pestaña está oculta (`visibilitychange`), se pausa y se recalcula al volver.

### Implementación
```js
const objetivo = Date.parse(site.drop.fecha);          // "2026-10-24T20:00:00-06:00"
function restante(ahora = Date.now()) {
  const m = Math.max(0, Math.floor((objetivo - ahora) / 60000));
  return { dias: Math.floor(m / 1440), horas: Math.floor(m / 60) % 24, min: m % 60 };
}
```
- El formulario sigue siendo de diseño: muestra el reverso y no envía nada.
- Para probar los estados: `?drop=antes` y `?drop=despues` en la dirección (solo en la vista previa).

### Accesibilidad
- La fecha escrita es la información principal; la cuenta regresiva lleva `aria-hidden="true"`.
- Hay un texto oculto a la vista con "Faltan 21 días y 3 horas", que se actualiza sin anunciarse.
- Campo de correo con etiqueta, validación y mensaje de error en `aria-live` (existe).

### Listo cuando
- [x] Los estados "antes" y "después" se ven bien en los 5 tamaños.
- [x] Los dígitos no se mueven de lugar al cambiar.
- [x] La prenda tapada y la etiqueta se columpian sin chocar.

---

## Entregable de la fase 3
- Vista previa publicada, con un video corto grabado de cada interacción (lo genero con Playwright) para revisar el movimiento.
- Decisiones tomadas con capturas: etiqueta de precio (T3.3) y "Nuevo".
- Pruebas, commit y push.
