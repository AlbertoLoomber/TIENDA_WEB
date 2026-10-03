# 02 · Fase 2: que se sienta tienda (solo diseño)

**Objetivo de la fase:** que el prototipo se use como una tienda real: elegir talla, agregar,
ver la bolsa, compartir una prenda y encontrar envíos y cambios. **Sin pagos:** el botón de
pago muestra un aviso de vista previa.

| Tarea | Qué resuelve | Esfuerzo |
|---|---|---|
| T2.1 | Bolsa (panel lateral y contador) | L |
| T2.2 | Vuelo a la bolsa | M |
| T2.3 | Botón fijo de compra en la ficha (celular) | S |
| T2.4 | Enlace propio por prenda y compartir | M |
| T2.5 | Colección como zona de compra | M |
| T2.6 | ¿Qué talla soy? y talla del modelo | M |
| T2.7 | Confianza: beneficios, preguntas, WhatsApp, hojas y pie | L |

Archivos nuevos de la fase: `web/bag.js` (bolsa y vuelo) y `web/info.js` (preguntas y hojas).
Orden de scripts: gsap, ScrollTrigger, SplitText, **MotionPathPlugin**, lenis, `scroll.js`,
`sections.js`, **`bag.js`**, `shop.js`, **`info.js`**, `app.js`.

---

## T2.1 Bolsa

| | |
|---|---|
| **Objetivo** | Ver y ajustar lo elegido, y que la tienda "responda" al agregar. |
| **Archivos** | `web/bag.js` (nuevo), `web/index.html`, `web/styles.css`, `web/app.js` (encabezado en el detalle), `catalogo.json` (`sitio.envio`) |

### Diseño: encabezado

```
ESCRITORIO Y TABLET
┌──────────────────────────────────────────────────────────────────┐
│ TIENDA   NOSOTROS                Nomad            CONTACTO  BOLSA ⓪ │
└──────────────────────────────────────────────────────────────────┘

CELULAR (≤ 640 px)
┌────────────────────────────────────┐
│ TIENDA            Nomad     BOLSA ⓪ │
└────────────────────────────────────┘
```

- En celular, "Nosotros" y "Contacto" salen del encabezado: siguen en el pie y en la página.
- **Contador:** círculo de 18px; con 0 lleva solo borde y con 1 o más va relleno de azul marino.
- En el detalle del perchero, los enlaces se ocultan (como hoy), pero **"Bolsa" se queda visible**.

### Diseño: panel de la bolsa

```
ESCRITORIO (panel de 420 px a la derecha)          BOLSA VACÍA
                         ┌──────────────────────┐  ┌──────────────────────┐
                         │ Tu bolsa (2)  CERRAR │  │ Tu bolsa      CERRAR │
                         │──────────────────────│  │                      │
                         │ ┌────┐ More Than Money│  │      ═══╤═══         │
                         │ │foto│ PLAYERA · M   │  │        ╱ ╲           │
                         │ │    │ (−) 1 (+) $690│  │                      │
                         │ └────┘ Quitar        │  │ Tu bolsa está vacía. │
                         │──────────────────────│  │ Las prendas que      │
                         │ ┌────┐ Camo          │  │ agregues aparecen    │
  página oscurecida      │ │foto│ SOBRECAMISA·L │  │ aquí.                │
                         │ │    │ (−)1(+) $1,290│  │                      │
                         │ └────┘ Quitar        │  │ ( VER LA COLECCIÓN ) │
                         │──────────────────────│  │                      │
                         │ ╞═════════⊂╤══════╡  │  └──────────────────────┘
                         │ Tu envío es gratis   │
                         │ Subtotal  $1,980 MXN │
                         │ El envío se calcula  │
                         │ al pagar.            │
                         │ ( FINALIZAR COMPRA ) │
                         │   Seguir comprando   │
                         └──────────────────────┘
```

- **Celular:** el panel ocupa toda la pantalla. El encabezado del panel y la zona del subtotal quedan fijos y la lista se desplaza.
- **Línea de prenda:**
  - miniatura de 72×94px (recorte de frente sobre `#EFEEE9`, radio 6px);
  - nombre corto en cursiva 15px;
  - "CATEGORÍA · TALLA" en 12px;
  - control de cantidad con botones de 32px;
  - precio a la derecha (15px);
  - "Quitar" con subrayado.
- **Barra de envío gratis:** el mini tubo (pieza central del tubo, 7px de alto) con un ícono de gancho que avanza según `subtotal / gratis_desde` (P: $1,500).
  - Por debajo del monto: "Te faltan $310 para el envío gratis".
  - Al llegar: "Tu envío es gratis" y el gancho se columpia una vez.
- **"Finalizar compra"** (píldora grande llena): aviso "Vista previa: el pago todavía no está conectado."

### Estados y animación

| Evento | Qué pasa | Tiempo |
|---|---|---|
| Abrir | Fondo oscurecido de 0 a 0.35; panel desde la derecha (`x: 100% → 0`); las líneas entran con desplazamiento de 12px y fundido, una tras otra | 0.3 s / `uiIn` 0.45 s / 0.3 s con 0.04 s entre líneas y 0.15 s de retraso |
| Cerrar | Panel a la derecha, fondo se aclara | `uiOut` 0.3 s |
| Cambiar cantidad | El número sube o baja (`count`) | 0.35 s |
| Quitar | La línea se desvanece; las de abajo suben con transform (FLIP manual) | 0.2 s + 0.3 s |
| Llegar al envío gratis | Texto nuevo y columpio del gancho | 0.8 s |
| Reducir movimiento | Panel con fundido de 0.15 s; sin desplazamientos | — |

### Implementación

**Datos guardados** en `localStorage`, clave `nomad.bolsa.v1`, dentro de `try/catch`. El precio
no se guarda: se toma del catálogo al dibujar, para que nunca quede un precio viejo.
```json
{ "v": 1, "lineas": [ { "id": "03-white-tee-dollar", "talla": "M", "cantidad": 1 } ] }
```

**API pública** (`window.NOMAD.bag`):
```js
NOMAD.bag = {
  add(itemId, talla, { desde } = {}),   // desde: imagen de origen para el vuelo (T2.2)
  setQty(itemId, talla, n),             // 1 a 10; 0 quita la línea
  remove(itemId, talla),
  count(), subtotal(), lines(),
  open({ volverA } = {}), close(),
};
// Cada cambio emite: document.dispatchEvent(new CustomEvent("nomad:bolsa", { detail }))
```

**Marcado:**
```html
<button class="top__bag" id="bag-open" type="button" aria-haspopup="dialog" aria-controls="bag">
  Bolsa <span class="top__bag-count" id="bag-count">0</span>
</button>
<aside class="bag" id="bag" role="dialog" aria-modal="true" aria-labelledby="bag-title" hidden>…</aside>
```

**Reglas:**
- Una línea por prenda y talla; agregar la misma suma 1 a la cantidad (máximo 10).
- Si `localStorage` falla, la bolsa funciona igual mientras la página está abierta.
- Bloqueo de scroll con contador; Escape cierra solo la capa de más arriba.

### Accesibilidad
- El botón del encabezado dice "Bolsa, 2 prendas" (`aria-label`, actualizado en cada cambio).
- Diálogo con foco atrapado; al abrir, el foco va al título; al cerrar, vuelve al botón que lo abrió.
- Botones de cantidad: "Quitar una" y "Agregar una". Región `aria-live="polite"` con "Cantidad: 2".

### Listo cuando
- [ ] Agregar, cambiar cantidad, quitar y recargar la página conserva la bolsa.
- [ ] Se puede usar entero con teclado y Escape.
- [ ] En modo privado o con almacenamiento bloqueado no hay errores.
- [ ] axe: 0 graves o serios con la bolsa abierta.

---

## T2.2 Vuelo a la bolsa

| | |
|---|---|
| **Objetivo** | Que agregar se sienta físico: la prenda se dobla y va a la bolsa. |
| **Archivos** | `web/bag.js`, `web/index.html` (MotionPathPlugin desde jsDelivr, `gsap@3.13.0/dist/MotionPathPlugin.min.js`) |

### Destino según desde dónde se agrega

| Origen | Destino |
|---|---|
| Ficha abierta | Botón "Bolsa ⓪" **dentro de la ficha**, junto a "Cerrar" (el encabezado queda bajo el fondo oscurecido) |
| Cajón de tallas del detalle | "Bolsa" del encabezado (sigue visible) |
| Tallas rápidas de la colección | "Bolsa" del encabezado (es fijo, siempre visible) |

### Línea de tiempo (0.9 s)

| Tiempo | Copia de la prenda | Bolsa |
|---|---|---|
| 0.00–0.22 s | Escala a 0.6 y gira −6° (se "levanta") · `power2.out` | — |
| 0.12–0.82 s | Recorre una curva hasta el centro del botón; el punto alto queda 120px sobre el más alto de los dos · `power1.inOut` · escala a 0.1 | — |
| 0.40–0.60 s | Se aplana (`scaleY` 0.7): se dobla | — |
| 0.76–0.86 s | Se desvanece | — |
| 0.80 s | — | El contador se columpia (14° → 0°, `easeSwing`) y el dígito sube |

- La copia es `position: fixed` en la capa 90 y se elimina al terminar.
- Si el usuario agrega dos veces rápido, cada vuelo es independiente y el contador suma.
- **Reducir movimiento:** sin vuelo; el número cambia con fundido de 0.2 s.
- En todos los casos aparece el aviso "Agregado a tu bolsa · Talla M", con el botón "Ver bolsa".

### Listo cuando
- [ ] El vuelo llega exactamente al contador en los 3 orígenes y en los 5 tamaños.
- [ ] No quedan copias en la página después de 10 agregados seguidos.

---

## T2.3 Botón fijo de compra en la ficha (celular)

| | |
|---|---|
| **Objetivo** | Agregar sin tener que buscar el botón al bajar en la ficha. |
| **Archivos** | `web/shop.js`, `web/styles.css`, `web/index.html` |

### Diseño

```
┌──────────────────────────────────────┐
│ …ficha desplazada…                   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ More Than Money   ( AGREGAR )  │  │  ← flotante, a 12px de los bordes
│  │ Talla M · $690                 │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- Caja de radio 16px, fondo `--paper` y sombra de panel. No ocupa el ancho de borde a borde, como recomienda Baymard.
- Sin talla elegida, el botón dice "Elige talla": lleva a las tallas y activa el estado de error.

### Implementación
- `IntersectionObserver` sobre `#sheet-add` con `root: #sheet-panel`. La barra aparece
  siempre que el botón principal no se ve, ya sea arriba o abajo.
- Entra y sale subiendo 100% en 0.3 s (`power3.out` / `power2.in`).
- Solo en celular y tablet (≤ 900 px); en escritorio el botón siempre está a la vista.

### Cambio relacionado: sin talla preelegida
Hoy la ficha y el cajón traen una talla marcada. Se quita: elegir talla es obligatorio y
evita compras en la talla equivocada.
- Si se presiona "Agregar a la bolsa" sin talla, la fila de tallas se mueve ±4px dos veces
  (0.3 s) y aparece "Elige una talla" en una región `aria-live`.

---

## T2.4 Enlace propio por prenda y compartir

| | |
|---|---|
| **Objetivo** | Que una prenda se pueda mandar por WhatsApp o Instagram y abra directo. |
| **Archivos** | `web/shop.js` (abrir y cerrar), `web/scroll.js` (enlaces internos), `web/app.js` (arranque), `catalogo.json` (`slug`) |

### Comportamiento

| Acción | Dirección | Resultado |
|---|---|---|
| Abrir una prenda | `#/prenda/playera-more-than-money` (`pushState`) | Título de la pestaña: "Playera More Than Money · Nomad" |
| Cerrar con "Cerrar" o Escape | Vuelve a la anterior (`history.back()` si la abrimos nosotros) | Título original |
| Botón "atrás" del navegador | `popstate` | Cierra la ficha |
| Abrir un enlace directo | Carga con la ficha abierta | Entra con fundido y escala de 0.98 a 1 (no hay tarjeta de donde volar) |
| Enlace con `slug` que no existe | Se limpia la dirección (`replaceState`) | Página normal |

### Implementación
1. `slug` por prenda en los datos:
   - `sobrecamisa-camo`, `playera-nomad-minimal`, `playera-more-than-money`;
   - `playera-good-people`, `sudadera-create-good-habits`.
2. **Corregir `scroll.js`:** hoy intercepta todos los enlaces que empiezan con `#` y hace
   `document.querySelector(hash)`, que falla con `#/prenda/...`. Solo debe actuar si el hash es
   un `id` simple (`/^#[\w-]+$/`).
3. Arranque: después de cargar los datos y las primeras imágenes, si la dirección coincide se
   abre esa ficha.
4. `history.scrollRestoration = "manual"` mientras la ficha está abierta, para que el
   navegador no salte al volver.

### Compartir
Botón "Compartir" con ícono, al lado del precio en la ficha.
- **Si existe `navigator.share`** (celulares y algunos navegadores de escritorio): menú del
  sistema con título, texto "Mira esta prenda de Nomad" y enlace.
- **Si no existe:** una pequeña ventana con:
  - "Copiar enlace": `navigator.clipboard.writeText` y aviso "Enlace copiado";
  - "Enviar por WhatsApp": `https://wa.me/?text=` con el nombre y el enlace, en pestaña nueva.

  Se cierra con Escape o con clic fuera.

### Listo cuando
- [ ] Abrir `…/#/prenda/sudadera-create-good-habits` en una pestaña nueva muestra esa ficha.
- [ ] Atrás y adelante abren y cierran sin errores ni saltos de scroll.
- [ ] Los enlaces del menú (`#shop`, `#about`) siguen funcionando con Lenis.

### Nota para la fase funcional
Las vistas previas de WhatsApp leen la imagen y el título de la página, no del `#`. Para que
cada prenda tenga su propia vista previa se necesitarán páginas por producto. Eso queda para
cuando el sitio se publique de verdad.

---

## T2.5 Colección como zona de compra

| | |
|---|---|
| **Objetivo** | Agregar desde la colección sin abrir la ficha. |
| **Archivos** | `web/shop.js` (`buildRail`), `web/styles.css` |

### Diseño

```
        ═══════╤═══════
               │
          ┌─────────┐
          │ PRENDA  │
          │ colgada │
          └─────────┘
              Camo
        SOBRECAMISA · $1,290
      ( S ) ( M ) ( L ) ( X̶L̶ )   ← aparece al pasar el cursor; espacio reservado
                                   (XL agotada en el ejemplo)
```

- Chips de 30px de alto y 12px de letra, con el estado "agotada" tachado.
- **Con mouse:** el renglón de tallas aparece al pasar por la prenda (opacidad y 4px hacia arriba, `micro`). Su espacio está reservado, así nada salta.
- **Táctil:** no hay tallas rápidas (el renglón no existe); tocar la prenda abre la ficha, como hoy.
- **Teclado:** al enfocar la prenda, el renglón aparece (`:focus-within`) y Tab recorre las tallas.

### Implementación
- En `buildRail()` se agrega `<div class="piece__quick" role="group" aria-label="Agregar rápido">`
  con un botón por talla. Un clic agrega con `NOMAD.bag.add(id, talla, { desde: img })` y **no**
  abre la ficha (`stopPropagation`).
- El chip elegido muestra una palomita 0.8 s y vuelve a su estado.
- Las tallas agotadas vienen de `tienda.agotadas` (P).
- **Ajuste respecto a la propuesta:** no se muestra la foto puesta al pasar el cursor, porque
  rompería el tubo de prendas recortadas. La foto puesta vive en la ficha y en el lookbook.

### Listo cuando
- [ ] Agregar desde la colección hace el vuelo y suma en la bolsa.
- [ ] La entrada de la colección y los filtros no dejan restos (prueba `restos.js`).
- [ ] En táctil el comportamiento es el de hoy.

---

## T2.6 ¿Qué talla soy? y talla del modelo

| | |
|---|---|
| **Objetivo** | Elegir talla con confianza; hoy la guía da medidas, pero no una recomendación. |
| **Archivos** | `web/shop.js`, `web/index.html`, `web/styles.css`, `catalogo.json` (`sitio.recomendador`, `look.modelo`) |

### Diseño

```
TALLA                 ¿Qué talla soy? · Guía de tallas
( S ) ( M ) ( L ) ( X̶L̶ )     Tu talla sugerida: M        ← si ya calculó antes

            │
   ┌────────o─────────────────────┐   ← etiqueta mediana que se columpia (como la guía)
   │ ¿QUÉ TALLA SOY?              │
   │ Estatura  [ 175 ] cm         │
   │ Peso      [  70 ] kg         │
   │ ¿Cómo te gusta que te quede? │
   │ ( Justa ) (Normal) (Holgada) │
   │                              │
   │ Te recomendamos la M.        │
   │ Si te gusta más holgada,     │
   │ prueba la L.                 │
   │ Es una sugerencia según      │
   │ nuestra guía de tallas.      │
   │ ( USAR TALLA M )    Cerrar   │
   └──────────────────────────────┘
```

- "Usar talla M" marca la M en la ficha y cierra la etiqueta.
- Si la talla sugerida está agotada: "La M está agotada; la L te quedará un poco más holgada."
- **Bajo las vistas de la ficha:** "El modelo mide 1.78 m y usa talla L" (P), desde `look.modelo`.

### Reglas (P, en `catalogo.json`)
```js
function recomendar({ estatura, peso, ajuste }, r, orden = ["S", "M", "L", "XL"]) {
  let i = orden.indexOf(r.peso.find(([max]) => peso < max)[1]);   // por peso
  if (estatura >= r.estatura_alta) i++;                            // largo
  if (estatura <= r.estatura_baja) i--;
  i += r.ajuste[ajuste];                                           // justa −1, normal 0, holgada +1
  i = Math.max(0, Math.min(orden.length - 1, i));
  return { talla: orden[i], holgada: orden[Math.min(orden.length - 1, i + 1)] };
}
```
| Paso | Regla |
|---|---|
| Por peso | menos de 60 kg → S · 60–72 → M · 73–85 → L · 86 o más → XL |
| Por estatura | 185 cm o más → una arriba · 160 cm o menos → una abajo |
| Por ajuste | Justa → una abajo (el corte ya es amplio) · Normal → igual · Holgada → una arriba |

### Validación
- Estatura de 140 a 210 cm y peso de 40 a 150 kg. Fuera de rango: "Escribe tu estatura en
  centímetros, por ejemplo 175."
- Campos `inputmode="numeric"`, con etiquetas visibles y errores asociados (`aria-describedby`).

### Recordar las medidas
Se guardan en `localStorage` (`nomad.medidas`, dentro de `try/catch`). Así, en las demás
fichas aparece directamente "Tu talla sugerida: M", sin volver a llenar nada.

### Listo cuando
- [ ] Casos de prueba (ver `07-pruebas.md`): 170 cm / 65 kg / normal → M; 188 cm / 80 kg / normal → XL; 158 cm / 55 kg / justa → S (límite).
- [ ] Con teclado: abrir, llenar, ver el resultado (anunciado en `aria-live`) y usar la talla.

---

## T2.7 Confianza: beneficios, preguntas, WhatsApp, hojas y pie

| | |
|---|---|
| **Objetivo** | Responder las dudas que frenan una compra en México: envío, cambios y a quién preguntar. |
| **Archivos** | `web/info.js` (nuevo), `web/index.html`, `web/styles.css`, `catalogo.json` (`sitio.envio`, `sitio.cambios`, `sitio.preguntas`, `sitio.hojas`, `sitio.contacto`) |

### a) Beneficios bajo la colección

```
 ┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
 │ [caja]  Envíos a todo     │ [gancho] Envío gratis     │ [flechas] Cambios de     │
 │ México                    │ desde $1,500              │ talla en 30 días         │
 │ 3 a 5 días hábiles        │ En toda la tienda         │ La primera vez, sin costo│
 └──────────────────────────┴──────────────────────────┴──────────────────────────┘
```
- Tres columnas en escritorio; en celular, una fila deslizable.
- Íconos de línea de 24px; título en 15px cursiva; detalle en 13px `--ink-soft`. Todo (P).
- Aparecen con un fundido simple en la misma entrada de la colección; no tienen animación propia.
- Versión corta bajo "Agregar a la bolsa" en la ficha: "Envío gratis desde $1,500 · Cambios en 30 días".

### b) Preguntas frecuentes (sección nueva, antes del drop)

```
 AYUDA                              ¿Cuánto tarda mi envío?              +
 Preguntas frecuentes.              ─────────────────────────────────────
                                    ¿Envían a todo México?               +
 ¿No encuentras tu respuesta?       ─────────────────────────────────────
 Escríbenos por WhatsApp →          ¿Puedo cambiar de talla?             ×
                                    Sí. Tienes 30 días desde que recibes
                                    tu pedido…
                                    ─────────────────────────────────────
```
- Columnas 5/7 en escritorio y una sola en celular.
- Pregunta en cursiva 18px; respuesta en 15px, máximo 60 caracteres por línea.
- Acordeón (componente 9.9) y varias abiertas a la vez. Contenido en `05-textos.md` (P).
- El título entra como los demás (líneas que suben); no hay animación extra.

### c) WhatsApp
- **Ficha:** "¿Dudas con tu talla? Escríbenos por WhatsApp", bajo los beneficios.
- **Preguntas frecuentes:** el enlace junto al título.
- **Pie:** ícono y texto en "Contacto".
- Formato del enlace: `https://wa.me/52XXXXXXXXXX?text=Hola%2C%20tengo%20una%20duda%20sobre…` (P).
- **Botón flotante:** se prueba en capturas (círculo de 48px abajo a la derecha, capa 40, que se
  oculta con paneles abiertos) y se decide. Mi recomendación es no usarlo, para conservar la calma.

### d) Hojas de información
Panel con la base del componente 9.7, ancho máximo de 720px, en la capa 62. Cada hoja tiene su
dirección, igual que las prendas:

| Hoja | Dirección | Contenido |
|---|---|---|
| Envíos | `#/ayuda/envios` | Tiempos, costos, cobertura, seguimiento (P) |
| Cambios y devoluciones | `#/ayuda/cambios` | Plazo, condiciones, cómo pedirlo (P) |
| Aviso de privacidad | `#/legal/privacidad` | **Borrador**, con la estructura de la ley; necesita datos del negocio y revisión legal |
| Términos | `#/legal/terminos` | **Borrador** |

```
┌───────────────────────────────────────────┐
│ AYUDA                              CERRAR │
│ Envíos                                    │
│                                           │
│ TIEMPOS                                   │
│ Enviamos en 1 a 2 días hábiles…           │
│ COSTOS                                    │
│ …                                         │
│ ¿Dudas? Escríbenos por WhatsApp           │
└───────────────────────────────────────────┘
```

### e) Pie completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Nomad         TIENDA         AYUDA              MARCA          CONTACTO │
│               El perchero    Envíos             Nosotros       Instagram│
│               Colección      Cambios y devol.   Cómo se hace   WhatsApp │
│               Lookbook       Guía de tallas     Newsletter     Correo   │
│                              Preguntas frec.                            │
│ (ig) (wa)                                                               │
│─────────────────────────────────────────────────────────────────────────│
│ © 2026 Nomad · Aviso de privacidad · Términos     Prototipo, solo diseño │
└─────────────────────────────────────────────────────────────────────────┘
```
- En celular: el logo arriba, las columnas en 2×2 y la línea legal en dos renglones.
- "Guía de tallas" abre la guía sobre la página (sin ficha).
- La cortina actual (el pie se descubre al subir la newsletter) se mantiene. Hay que
  revisar que el pie, ahora más alto, quede completo al final en 375×667.

### Listo cuando
- [ ] Las cuatro hojas abren por su enlace directo y desde el pie; Escape y atrás las cierran.
- [ ] Todos los textos provisionales están marcados (P) en `catalogo.json`.
- [ ] axe: 0 graves o serios con las hojas abiertas; contraste del pie mayor a 4.5:1.

---

## Entregable de la fase 2
- Vista previa publicada.
- Recorrido completo:
  1. Ver la colección.
  2. Agregar rápido.
  3. Abrir la ficha.
  4. Calcular la talla.
  5. Agregar.
  6. Compartir.
  7. Abrir la bolsa.
  8. Llegar al envío gratis.
  9. Finalizar (aviso de vista previa).
- Capturas en los 5 tamaños, pruebas de `07-pruebas.md`, commit y push.
