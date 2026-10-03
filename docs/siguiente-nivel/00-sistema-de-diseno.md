# 00 · Sistema de diseño

Base común para todas las tareas del plan. Cada tarea nueva usa estos colores, tamaños,
capas y tiempos; si algo no está aquí, se agrega aquí primero.

---

## 1. Principios visuales

1. **La pared:** fondo cálido `#E7E6E1` con puntos cada 22 px. Es la misma pared en todas
   las secciones y paneles.
2. **El azul marino** es el único color de marca. Todo lo demás lo ponen las prendas.
3. **Dos voces tipográficas:**
   - cursiva de Archivo para nombres y títulos (la voz de la marca);
   - mayúsculas espaciadas para etiquetas y botones (la voz de la tienda).
4. **Objetos físicos en lugar de adornos:** tubo, gancho, etiqueta de cartón, cordón y
   cortina. Si un elemento nuevo necesita forma, toma la de uno de estos objetos.
5. **Calma:** un protagonista por sección; el movimiento explica, no decora.

---

## 2. Colores

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--paper` | `#E7E6E1` | Fondo de página y paneles | — |
| `--dot` | `rgba(36,44,82,.13)` | Puntos de la pared | Decorativo |
| `--ink` | `#242C52` | Texto principal, botones llenos, íconos | 10.8:1 sobre `--paper` |
| `--ink-soft` | `#5D6177` | Texto secundario y etiquetas | 4.9:1 sobre `--paper` |
| `--band` | `#454F7C` | Barra y pie | — |
| `--band-ink` | `#ECEAE3` | Texto sobre `--band` | 6.6:1 |
| **`--foot-k`** (nuevo) | `#CCD0DE` | Títulos de columna del pie | 5.1:1 sobre `--band` |
| **`--tag`** (nuevo; hoy está escrito a mano) | `#F3F1EA` | Etiquetas grandes (drop, guía, recomendador) | `--ink` 11.9:1 |
| **`--kraft`** (nuevo) | `#D9C7A7` | Etiqueta de precio de cartón | `--ink` 8.1:1 |
| **`--string`** (nuevo; hoy escrito a mano) | `#9B907C` | Cordones de las etiquetas | Decorativo |
| **`--line`** (nuevo) | `rgba(36,44,82,.15)` | Divisiones y bordes finos | Decorativo |
| **`--scrim`** (nuevo) | `rgba(20,22,40,.35)` | Fondo oscurecido detrás de paneles | — |

**Reglas:**
- Ningún texto de interfaz usa un gris más claro que `--ink-soft`.
- Las tallas agotadas usan `--ink-soft` tachado; nunca un gris claro.
- No hay rojo de error: los avisos usan `--ink` con un ícono y texto claro.

---

## 3. Tipografía

Una sola familia: **Archivo** (400, 500, 600 y cursiva 400/500), de Google Fonts.
El logo pasa a SVG y deja de usar la fuente Yellowtail (T1.6).

| Token | Tamaño / interlineado | Peso y estilo | Uso |
|---|---|---|---|
| `--fs-display` | `clamp(28px, 4.4vw, 54px)` / 1.05 | Cursiva 400 | Títulos de sección |
| `--fs-title-lg` | `clamp(28px, 3.4vw, 44px)` / 1.05 | Cursiva 400 | Nombre en la ficha |
| `--fs-title-md` | `clamp(22px, 2.6vw, 30px)` / 1.1 | Cursiva 400 | Etiquetas grandes, título de la bolsa y de las hojas |
| `--fs-name` | 15–17px / 1.25 | Cursiva 400 | Nombre en colección, lookbook y bolsa |
| `--fs-body` | 16px / 1.65 | 400 | Párrafos |
| `--fs-body-sm` | 14px / 1.6 | 400 | Textos de etiquetas y respuestas cortas |
| `--fs-label` | 12px / 1.2, espaciado 0.14em | 500, mayúsculas | Menú, botones, filtros, encabezados pequeños |
| `--fs-meta` | 12.5px / 1.4, espaciado 0.08em | 500, mayúsculas | Categoría |
| `--fs-price` | 15px / 1, espaciado 0.04em | 500, números de ancho fijo | Precio en colección y bolsa |
| `--fs-price-lg` | 17px / 1 | 500, números de ancho fijo | Precio en detalle y ficha |
| `--fs-badge` | 12px / 1, espaciado 0.1em | 500, mayúsculas | "Nuevo", "Agotado" |
| `--fs-digit` | `clamp(28px, 3.2vw, 36px)` / 1 | 500, números de ancho fijo | Cuenta regresiva |

**Reglas:**
- **Mínimo 12 px** para cualquier texto visible.
- Los encabezados pequeños bajan su espaciado de 0.2–0.34em a 0.14–0.18em.
- Precios y números siempre con `font-variant-numeric: tabular-nums`, para que no bailen.
- `text-wrap: balance` en títulos; `text-wrap: pretty` en párrafos.

---

## 4. Espaciado

Escala: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 120 px.**

| Uso | Valor |
|---|---|
| Relleno vertical de sección | `clamp(64px, 8vw, 110px)` |
| Margen lateral de página | 24px (16px en celular) |
| Ancho máximo de contenido | 1200px |
| Separación entre grupos dentro de un panel | 24px |
| Separación entre elementos de un grupo | 8–12px |

---

## 5. Formas y sombras

| Elemento | Radio | Sombra |
|---|---|---|
| Botones y chips | 999px | — |
| Hojas que suben sobre la página (`.more`, newsletter) | 22px arriba o abajo | `0 -22px 44px -18px rgba(28,30,44,.16)` |
| Paneles (ficha, bolsa, hojas de información) | 14px (0 en celular) | `0 30px 80px -30px rgba(20,22,40,.45)` |
| Cajón de tallas, aviso flotante | 14px | `0 -12px 30px rgba(30,32,44,.12)` |
| Fotos | 6px | — |
| Miniaturas en la bolsa | 6px | — |
| Prendas recortadas | — | Las dos `drop-shadow` actuales de `.slot__swing` |

---

## 6. Capas (z-index)

| Capa | Valor | Elementos |
|---|---|---|
| Contenido | 0–5 | Perchero, prendas, secciones |
| Detalle del perchero | 10 | `.detail` (dentro de la portada) |
| Encabezado | 30 | `.top` |
| Botón flotante de WhatsApp (si se aprueba) | 40 | `.wa` |
| Ficha, guía, recomendador | 60 | `.sheet` y sus etiquetas |
| Hojas de información | 62 | `.info` |
| Bolsa | 70 | `.bag` |
| Avisos | 80 | `.toast` |
| Copia que vuela a la bolsa | 90 | `.fly` |

> **Regla:** la copia que vuela siempre va por encima de todo, para que se vea llegar a la
> bolsa aunque haya un panel abierto (ver T2.2).

---

## 7. Tamaños de pantalla

| Nombre | Ancho | Comportamiento clave |
|---|---|---|
| Celular | ≤ 640px | Perchero y colección se deslizan; ficha y bolsa a pantalla completa; menú corto |
| Tablet | 641–900px | Ficha en una columna; en vertical, perchero en modo celular (T1.8) |
| Escritorio | ≥ 901px | Composición completa; lookbook fijo con cortinas |

Tamaños de prueba obligatorios: **1440×900, 1280×720, 820×1180, 390×844 y 375×667.**

---

## 8. Movimiento

### 8.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| `easeOut` | `expo.out` | Entradas de títulos, fotos y cortinas |
| `easeInOut` | `power3.inOut` | Vuelos y desplazamientos |
| `easeSwing` | `elastic.out(1, 0.3)` | Prendas y etiquetas que se asientan |
| `fast` / `base` / `slow` | 0.6 / 1.0 / 1.4 s | Duraciones de sección |
| `stagger` | 0.08 s | Entre elementos de un grupo |
| **`uiIn`** (nuevo) | 0.45 s, `power3.out` | Paneles que entran |
| **`uiOut`** (nuevo) | 0.3 s, `power2.in` | Paneles que salen |
| **`micro`** (nuevo) | 0.25 s, `power2.out` | Hover, chips, íconos |
| **`count`** (nuevo) | 0.35 s, `power2.out` | Dígitos que cambian (bolsa, cuenta regresiva) |

### 8.2 Reglas
1. **Ninguna sección nueva fija el scroll.** El lookbook es la única.
2. Las entradas por scroll ocurren **una vez** (`once: true`).
3. Respuesta a un clic: **< 1 s**. Nada bloquea la interfaz mientras anima, salvo los vuelos (< 0.9 s).
4. Solo `transform`, `opacity` y `clip-path`. Excepción: la altura de los acordeones.
5. **Táctil:** nada depende de pasar el cursor.
6. **Reducir movimiento:** estados finales sin animación; los paneles aparecen con un fundido de 0.15 s.
7. En una misma pantalla no corren a la vez más de **dos** animaciones de sección.

### 8.3 Inventario de movimiento (actual y nuevo)

| Sección | Animación | Disparador | Estado |
|---|---|---|---|
| Portada | Entrada del perchero, brisa, giro, onda a los vecinos, inclinación por scroll | Carga, cursor, scroll | Existe |
| Portada | Prendas que se mecen al pasar la mano | Cursor rápido | **Nueva (T3.1)** |
| Detalle | Prenda que vuela al centro, fundido entre prendas | Clic | Existe |
| Detalle | Perchero que se desliza detrás | Abrir y cambiar | **Nueva (T1.4)** |
| Barra | Velocidad según el scroll | Scroll | Existe |
| Colección | Entrada del tubo y prendas, filtros que deslizan | Scroll, clic | Existe |
| Colección | Tallas rápidas, etiqueta de precio que se columpia | Cursor | **Nueva (T2.5, T3.3)** |
| De cerca | Líneas que se dibujan y círculos que se abren | Scroll, una vez | **Nueva (T3.4)** |
| Lookbook | Sección fija con cortinas | Scroll | Existe |
| Nosotros | Logo que se escribe, estudio que se abre, líneas de datos | Scroll, una vez | Existe |
| Cómo se hace | Ganchito que recorre los pasos | Scroll | **Nueva (T4.4)** |
| Drop | Etiqueta y prenda tapada que se columpian, dígitos | Scroll, cada minuto | **Cambia (T3.5)** |
| Pie | Cortina que se levanta | Scroll | Existe |
| Bolsa | Panel, vuelo, contador, barra de envío | Clic | **Nueva (T2.1, T2.2)** |

---

## 9. Componentes

### 9.1 Píldora (`.pill`, `.pill--solid`)
- **Normal:** alto 36px, relleno `10px 20px`, texto `--fs-label`.
- **Grande:** alto 44px, relleno `13px 28px` (Agregar a la bolsa, Finalizar compra).
- **Estados:** se rellena de izquierda a derecha al pasar el cursor (existe); foco con anillo de 2px;
  desactivada con 40% de opacidad y cursor normal.

### 9.2 Enlace subrayado
El subrayado se dibuja de izquierda a derecha al pasar el cursor (existe). Se usa en el menú, el pie y "Guía de tallas".

### 9.3 Chips de talla (`.sizes button`)

| Estado | Aspecto |
|---|---|
| Normal | Borde `--line` más oscuro (35%), texto `--ink` |
| Hover | Borde `--ink` |
| Elegida | Fondo `--ink`, texto `--paper` |
| Agotada | Texto `--ink-soft` tachado, `aria-disabled="true"`, sin hover |
| Foco | Anillo de 2px a 3px de distancia |
| Error (sin talla al agregar) | La fila se mueve ±4px dos veces (0.3 s) y aparece "Elige una talla" |

Tamaños: 44px en ficha y detalle; 30px en las tallas rápidas de la colección (solo con mouse).

### 9.4 Etiqueta colgante
Mismo objeto en tres tamaños: cartón con agujero, cordón y columpio.

| Variante | Medidas | Color | Dónde |
|---|---|---|---|
| Grande | `min(520px, 100%)` | `--tag` | Drop y newsletter |
| Mediana | `min(360px, 100% − 32px)` | `--tag` | Guía de tallas, ¿Qué talla soy? |
| Mini | ≈ 52×26px | `--kraft` (precio) o `--ink` ("Nuevo") | Colección |

### 9.5 Tubo
Las tres piezas de `web/rail/`, en cuatro escalas: perchero, colección, estudio y **mini**
(barra de envío gratis y tubo del drop).

### 9.6 Ícono de gancho
`assets/marca/icono-gancho.svg`, con trazo de 1.6px. Se usa en la bolsa vacía, la barra de
envío gratis, la indicación "Desliza" y el progreso de "Cómo se hace".

### 9.7 Panel (base de ficha, bolsa y hojas)
Comportamiento común:
- fondo oscurecido (`--scrim`) que cierra al hacer clic;
- `role="dialog"`, `aria-modal="true"` y título con `aria-labelledby`;
- foco atrapado dentro, y Escape cierra la capa de más arriba;
- bloqueo del scroll con contador (`NOMAD.scroll.lock` / `unlock`);
- al cerrar, el foco vuelve al botón que lo abrió.

### 9.8 Aviso (toast)
- Abajo al centro, a 24px del borde; fondo `--ink`, texto `--paper`, `--fs-body-sm`, radio 14px.
- Dura 3 s; como máximo dos a la vez, y el nuevo empuja al anterior.
- Región `aria-live="polite"`.
- Entra subiendo 12px con fundido (`micro`) y sale con fundido.

### 9.9 Acordeón
`<details>` con `summary`. El "+" gira a "×" (existe en la ficha). La altura se anima con GSAP
(0.35 s); con "reducir movimiento" abre sin animación.

### 9.10 Contador
Círculo de 18px junto a "Bolsa":
- con 0, solo borde;
- con 1 o más, relleno `--ink`;
- el dígito sube al cambiar (`count`) y el círculo se columpia (14° → 0°, `easeSwing`, 0.8 s).

### 9.11 Íconos de línea (nuevos)
Cuadrícula de 24px, trazo de 1.6px, puntas redondas y color `currentColor`. Los dibujo yo en SVG.
- Bolsa, compartir, WhatsApp, Instagram, envío (caja), cambio (flechas en círculo), gancho, regla (guía) y cerrar.

---

## 10. Accesibilidad base

- `lang="es-MX"` en el documento.
- Contraste: 4.5:1 para texto normal y 3:1 para texto grande y elementos gráficos.
- Foco visible en todo lo que se puede usar con teclado: anillo de 2px `--ink` a 3px de distancia
  (`--band-ink` en el pie).
- Áreas táctiles de al menos 44×44px en celular.
- Cambios importantes anunciados en regiones `aria-live`: bolsa, avisos, errores de formulario
  y recomendación de talla.
- Imágenes de prendas con texto alternativo: "Playera More Than Money, vista de frente".
- Fotos decorativas con `alt=""`.
