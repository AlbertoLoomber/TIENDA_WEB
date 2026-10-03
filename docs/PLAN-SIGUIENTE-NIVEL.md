# Plan de implementación: Nomad al siguiente nivel

> **Estado:** plan aprobado, fases 1 a 4. El sitio pasa a **español**. Sin pagos reales:
> la bolsa y el botón de pago son de diseño; la parte funcional (cobro, inventario,
> correos) se hace después.

**Concepto rector: el perchero es la tienda.** Todo cuelga y todo tiene peso. Cada
novedad usa el mismo lenguaje (gancho, etiqueta, tubo, cortina) y nunca le quita
protagonismo al perchero.

Los prompts para fotos y videos están en `docs/PROMPTS.md`, secciones 15 a 24.
Los cuadros de inicio y fin para los videos del giro ya están en `assets/para-video/`.

---

## 0. Reglas del plan

### 0.1 Alcance
| Sí entra (diseño) | No entra todavía (fase funcional) |
|---|---|
| Textos, maquetación, animaciones, estados visuales | Cobro, pasarela de pago, facturas |
| Bolsa guardada en el navegador del visitante | Inventario real y existencias |
| Formularios que muestran confirmación de diseño | Envío real de correos o mensajes |
| Enlaces propios por prenda dentro de la página | Páginas por producto para Google |
| Datos de ejemplo marcados como provisionales | Cuentas de usuario |

### 0.2 Movimiento: cómo evitamos saturar
- **Ninguna sección nueva fija el scroll.** El lookbook sigue siendo la única sección fija.
- **Un solo protagonista por sección**; lo demás acompaña o se queda quieto.
- La respuesta a un clic dura **menos de 1 s**. Las entradas al hacer scroll se reproducen **una vez**.
- En pantallas táctiles no hay efectos que dependan de pasar el cursor.
- Con "reducir movimiento" todo aparece quieto y en su lugar.
- Solo se animan `transform`, `opacity` y `clip-path`.

| Animación nueva | Cuándo ocurre | Intensidad |
|---|---|---|
| Prendas que se mecen al pasar la mano (T3.1) | Cursor rápido sobre el perchero | Máx. 5°, se calma en ~2 s |
| Vuelo a la bolsa (T2.2) | Al agregar una prenda | 0.9 s, una sola vez |
| Arrastrar para girar (T3.2) | El visitante arrastra | Sigue al dedo, frena solo |
| Etiqueta de precio (T3.3) | Cursor sobre una prenda | Columpio de 3 a 4° |
| Líneas de "De cerca" (T3.4) | Al entrar en pantalla | Una vez, 1.2 s en total |
| Cuenta regresiva (T3.5) | Cada segundo | Solo cambia el dígito que cambia |
| Perchero que se desliza detrás del detalle (T1.4) | Al cambiar de prenda | 0.6 s |

### 0.3 Datos provisionales
Todo valor inventado vive en `catalogo.json` con la nota `_provisional` y se marca en este
plan con **(P)**: precios, tiempos y costos de envío, días para cambios, gramaje, técnica de
estampado, estatura y talla de los modelos, reglas del recomendador de talla, fecha del
Drop 02, WhatsApp, correo e Instagram.

### 0.4 Control de calidad en cada fase
1. Capturas en 5 tamaños: 1440, 1280, 820 vertical, 390 y 375 px.
2. Auditoría de accesibilidad (axe): **0 problemas graves o serios**.
3. Sin errores en consola; sin saltos de diseño (CLS < 0.1).
4. Ninguna animación deja restos: nada queda movido, transparente o a medias.
5. Navegación con teclado: Tab, Enter, Escape y foco visible en todos los paneles.
6. Prueba con "reducir movimiento".
7. Textos en español sin cortes ni renglones partidos donde no deben.
8. Publicar la vista previa en la misma dirección, commit y push.

---

## 1. Mapa de la página

| # | Sección | Hoy | Después |
|---|---|---|---|
| 1 | Encabezado | Shop · About · logo · Contact | Tienda · Nosotros · logo · Contacto · **Bolsa (0)** |
| 2 | Portada | Perchero y barra en inglés | Perchero en español, precio en el texto, barra con mensajes útiles |
| 3 | Colección | Tubo con 5 prendas | Zona de compra: tallas rápidas, etiqueta de precio y beneficios |
| 4 | **De cerca** (nueva) | — | La prenda con 3 detalles señalados: estampado, cuello y tela |
| 5 | Lookbook | 5 fotos | 5 fotos o clips en loop; looks 02 y 04 con modelo |
| 6 | Nosotros | Texto y foto del estudio | Historia real, datos de la prenda y video del estudio |
| 7 | **Cómo se hace** (nueva, fase 4) | — | Boceto → malla → estampado → perchero |
| 8 | **Así se usa** (nueva, fase 4) | — | Fotos en la calle; luego, fotos reales de clientes |
| 9 | **Preguntas frecuentes** (nueva) | — | Envíos, cambios, tallas, cuidados y drops |
| 10 | Drop y newsletter | Etiqueta "Subscribe" | Etiqueta "Drop 02" con cuenta regresiva y la prenda tapada al lado |
| 11 | Pie | 3 columnas cortas | Tienda · Ayuda · Marca · Contacto, más aviso de privacidad y términos |

Paneles que se abren encima: detalle del perchero, ficha de producto, guía de tallas,
"¿Qué talla soy?", **bolsa** y **hojas de información** (envíos, cambios, aviso de privacidad, términos).

---

## 2. Fase 1: pulido y español

No necesita fotos nuevas. Es la base de todo lo demás.

### T1.1 Todo el sitio en español
**Qué se ve:** todos los textos en español de México. Los nombres de los diseños se quedan en
inglés (son la frase del estampado) y la categoría va en español: "Playera More Than Money".

**Cómo:**
- `index.html`: `lang="es-MX"`, título, descripción, Open Graph, textos y `aria-label`.
- `app.js`: barra, indicaciones del perchero, textos accesibles del detalle.
- `shop.js`: filtros en plural ("Playeras"), "Nuevo", "Agregar a la bolsa", vistas
  ("Frente", "Lado", "Puesta"), guía de tallas ("Pecho", "Largo", "Manga") y mensajes.
- `catalogo.json`: nombre, categoría, descripción, detalles y cuidados en español
  (Anexo A). `tools/catalogo_web.py` agrega los campos nuevos.
- Precio con formato `$1,290 MXN` usando `Intl.NumberFormat("es-MX")` sin decimales.
- Regenerar `og.jpg` con la frase en español.

**Ojo:** el español ocupa 20–30% más. Revisar las líneas que no deben partirse (etiquetas de
la colección, filtros, botones) en 705 px y 375 px.

**Listo cuando:** no queda texto en inglés salvo los nombres de diseño y los estampados.

### T1.2 Escala de letra legible
**Qué se ve:** nada por debajo de 12 px; el precio se lee a la primera.

**Cómo:** tokens nuevos en `styles.css` y reemplazo de los tamaños sueltos.

| Token | Valor | Dónde |
|---|---|---|
| `--fs-label` | 12px, espaciado 0.14em | Menú, botones, filtros, encabezados pequeños |
| `--fs-meta` | 12.5px | Categoría en la colección y en el detalle |
| `--fs-price` | 15px | Precio en la colección |
| `--fs-price-lg` | 17px | Precio en el detalle y en la ficha |
| `--fs-badge` | 12px, con menos relleno | Etiqueta "Nuevo" |
| `--fs-body` | 16px | Párrafos (ya está) |

El espaciado de los encabezados pequeños baja de 0.34em a 0.18em para que no se vean
dispersos con la letra más grande.

**Listo cuando:** el script de medición no encuentra textos por debajo de 12 px.

### T1.3 Tubo sin bordes ni costuras
**Qué se ve:** la sombra del tubo se desvanece suave y no se nota dónde se unen las piezas.

**Cómo:** `tools/procesar_rail.py`:
1. Desvanecer el canal alfa de la sombra hacia abajo y hacia los lados (degradado de 24 px)
   para que no termine en línea recta.
2. Igualar el tono del tubo en la unión tope–centro: tomar el perfil vertical del centro y
   mezclarlo en los últimos 20 px de cada tope.
3. Volver a exportar `web/rail/*` y revisar con zoom al 300% en portada, colección y estudio.

**Listo cuando:** con el contraste aumentado no se ve ningún borde ni cambio de tono.

### T1.4 Vista de detalle más limpia
**Qué se ve:**
- Desaparecen el texto y el botón del perchero que se veían borrosos detrás.
- **El perchero de fondo se desliza** para que el gancho vacío quede justo detrás de la prenda
  abierta, con prendas desenfocadas a ambos lados. Al cambiar de prenda con las flechas, el
  perchero se desliza a la siguiente (0.6 s), como si caminaras frente a él.
- Precio a 17 px.

**Cómo (`app.js`, `styles.css`):**
- `.is-detail .caption, .is-detail #see { opacity: 0; visibility: hidden }` con transición.
- En `openDetail`, además de `scale: 0.95`, mover el perchero con `x` para centrar el gancho
  activo; en `step`, animar `x` al nuevo gancho; en `closeDetail`, regresar a `x: 0`.
- `restingRect` debe calcular la posición final sin el desplazamiento, para que la prenda
  vuelva exactamente a su gancho.
- Desenfoque un poco menor (las prendas se reconocen) y opacidad pareja.

**Listo cuando:** con cualquier prenda abierta se ven prendas a ambos lados y al cerrar la
prenda cae en su gancho sin saltos.

### T1.5 Portada que dice qué es Nomad
**Qué se ve:**
- Texto bajo el perchero: "Playera More Than Money · $690" (sin repetir la categoría).
- Indicación inicial: "Pasa el cursor para girar · Clic para ver" (táctil: "Toca para girar · Toca otra vez para ver").
- Botón "Ver tallas".
- Título principal (h1) para buscadores y lectores de pantalla: "Nomad: playeras, sudaderas
  y sobrecamisas de algodón pesado". Visualmente oculto.
- Prueba A/B de una línea discreta bajo el encabezado: "Drop 01 · 5 prendas". Se queda solo si
  no ensucia la composición.
- Barra: "Drop 01 ya en el perchero • Envíos a todo México (P) • Algodón pesado • Avísame del Drop 02".

### T1.6 Logo en SVG
**Qué se ve:** el mismo logo, más nítido, y una fuente menos que cargar.

**Cómo:** insertar `assets/marca/logo-nomad-navy.svg` en línea, con `fill: currentColor`, en el
encabezado, el pie y Nosotros. La animación de "se escribe solo" sigue igual porque es un
recorte (`clip-path`). Quitar Yellowtail de la petición a Google Fonts.

### T1.7 Accesibilidad
- Agregar el h1 (T1.5).
- Contraste del pie a 4.5:1 como mínimo: los títulos de columna pasan de `#b2b4bf` a un tono más claro, y se verifica con axe.
- SplitText no debe poner `aria-label` en los párrafos: opción `aria: "none"`. La división es
  solo por líneas, así que el lector de pantalla lee el texto completo. Verificar con axe.
- Revisar el foco visible en botones de filtros, tallas y flechas.

### T1.8 Perchero más grande en tablet vertical
**Cómo:** en `layout()` de `app.js`, si la pantalla es vertical y mide hasta 900 px, usar el
modo de celular (prendas grandes y perchero que se desliza) en lugar de encoger todo para que
quepa. Probar en 768 y 820 px.

### T1.9 Indicar que se puede deslizar
**Qué se ve:** en celular y tablet, el borde derecho del perchero y de la colección se desvanece
y aparece una indicación pequeña "Desliza →" que se va después del primer deslizamiento.
Con mouse no aparece.

**Cómo:** `mask-image` con degradado en `.shelf` y `.rack`; la indicación se oculta con el
primer evento de scroll horizontal y se recuerda en `sessionStorage`.

### T1.10 Textos de marca sin promesas difíciles
- Cambiar "New designs daily" en la barra y en los datos de Nosotros (Drops → "Cada mes" (P)).
- Nosotros: el texto nuevo del Anexo A y datos reales cuando los tengas (dónde se hace, gramaje, técnica).

### T1.11 Pruebas dentro del repositorio
Llevar los scripts de prueba (capturas, axe, restos de animación y medición de letra) a
`tools/pruebas/`, con un `README` de cómo correrlos. Así cada fase se verifica igual.

---

## 3. Fase 2: que se sienta tienda (solo diseño)

No necesita fotos nuevas.

### T2.1 Bolsa
**Qué se ve:**
- En el encabezado: "Bolsa" con un contador (0, 1, 2…).
- Al abrirla, un panel lateral desde la derecha (en celular ocupa toda la pantalla):
  - cada prenda con miniatura, nombre, talla, cantidad (− 1 +), precio y "Quitar";
  - el subtotal;
  - **barra de envío gratis con forma de tubo**: un ganchito avanza sobre el tubo según el
    subtotal. Texto: "Te faltan $310 para el envío gratis" (P: desde $1,500). Al llegar:
    "Tu envío es gratis";
  - el botón "Finalizar compra" muestra: "Vista previa: el pago todavía no está conectado".
- Bolsa vacía: un gancho solo con el texto "Tu bolsa está vacía" y el botón "Ver la colección".

**Cómo:**
- Archivo nuevo `web/bag.js` con `NOMAD.bag.add(item, talla, { desde })`, `remove`, `setQty`,
  `open`, `close` y un evento `nomad:bag` para actualizar el contador.
- Se guarda en `localStorage` (`nomad.bolsa.v1`) dentro de `try/catch`: si el navegador no deja
  guardar, la bolsa funciona igual mientras la página está abierta.
- Diálogo accesible: `role="dialog"`, foco atrapado, Escape cierra y devuelve el foco al botón.
- Se suma al bloqueo de scroll con contador (`NOMAD.scroll.lock`).

**Listo cuando:** agregar, cambiar cantidad, quitar y recargar la página conserva la bolsa,
y funciona con teclado.

### T2.2 Vuelo a la bolsa
**Qué se ve:** al agregar desde la ficha o desde la colección, una copia de la prenda se
encoge, se dobla (se aplana de abajo hacia arriba) y vuela en curva hasta "Bolsa". El
contador sube con un pequeño columpio. Duración total: 0.9 s.

**Cómo:** MotionPathPlugin de GSAP (gratis) para la curva; la copia es la imagen de frente;
al llegar se elimina. Con "reducir movimiento" solo cambia el número.

### T2.3 Botón fijo en la ficha (celular)
**Qué se ve:** cuando "Agregar a la bolsa" sale de la pantalla dentro de la ficha, aparece abajo
una barra con nombre, precio, talla elegida y "Agregar". No ocupa todo el ancho, como
recomienda Baymard.

**Cómo:** `IntersectionObserver` con el panel de la ficha como contenedor.

### T2.4 Enlace propio por prenda y compartir
**Qué se ve:**
- Abrir una prenda cambia la dirección a `#/prenda/playera-more-than-money`. Si alguien abre
  ese enlace, la página carga con esa ficha abierta. El botón "atrás" del navegador cierra la ficha.
- Botón "Compartir" en la ficha: en celular abre el menú del teléfono; en computadora ofrece
  "Copiar enlace" y "Enviar por WhatsApp".

**Cómo:**
- `slug` por prenda en `catalogo.json` (Anexo B). `history.pushState` al abrir y `popstate`
  para cerrar.
- **Corregir `scroll.js`:** hoy intercepta todos los enlaces con `#` y hace
  `document.querySelector(hash)`, que falla con `#/prenda/...`. Solo debe tomar los que son un `id` válido.
- `navigator.share` cuando exista; si no, copiar al portapapeles y
  `https://wa.me/?text=` con el nombre y el enlace.
- Si la ficha se abre desde un enlace (sin tarjeta desde donde volar), entra con un fundido.

### T2.5 Colección como zona de compra
**Qué se ve (con mouse):** al pasar el cursor por una prenda, bajo su nombre aparece
"Agregar rápido: S M L XL". Al elegir talla, la prenda vuela a la bolsa (T2.2). Las tallas
agotadas (P) se ven tachadas. En táctil se toca la prenda y abre la ficha, como hoy.

**Ajuste respecto a la propuesta:** la foto con la prenda puesta no aparece al pasar el
cursor porque rompería el tubo (las prendas cuelgan recortadas). La foto puesta se queda en
la ficha (vista "Puesta") y en el lookbook.

**Cómo:** `shop.js` agrega el bloque de tallas en `.piece__meta`. Se ve con `:hover` y
`:focus-within`, así funciona también con teclado.

### T2.6 "¿Qué talla soy?" y la talla del modelo
**Qué se ve:**
- En la ficha, junto a "Guía de tallas", el enlace "¿Qué talla soy?" abre una etiqueta colgante
  (mismo estilo que la guía) con:
  - estatura (cm), peso (kg) y "¿Cómo te gusta que te quede?": Justa / Normal / Holgada;
  - el resultado: "Te recomendamos la **M**. Si te gusta más holgada, prueba la L.";
  - la aclaración "Es una sugerencia según nuestra guía de tallas".
- Bajo las vistas de la ficha: "El modelo mide 1.78 m y usa talla L" (P).

**Cómo:** reglas (P) en `catalogo.json`, fáciles de ajustar cuando haya datos reales:

| Paso | Regla |
|---|---|
| Talla base por peso | menos de 60 kg → S · 60–72 → M · 73–85 → L · más de 85 → XL |
| Estatura | 185 cm o más → una talla arriba (por el largo) · 160 cm o menos → una abajo |
| Ajuste | Justa → una abajo (el corte ya es amplio) · Normal → igual · Holgada → una arriba |
| Límite | Nunca menos de S ni más de XL |

### T2.7 Información que da confianza (datos provisionales)
**Qué se ve:**
- **Beneficios** bajo la colección, 3 íconos de línea dibujados en el estilo de la marca:
  "Envíos a todo México · 3 a 5 días hábiles" (P), "Envío gratis desde $1,500" (P) y
  "Cambios de talla en 30 días" (P). Los mismos datos, en corto, bajo el botón de la ficha.
- **Preguntas frecuentes**: sección nueva antes del drop, con el título a la izquierda y las
  preguntas en acordeón a la derecha. La altura se anima al abrir.
- **WhatsApp:** "¿Dudas con tu talla? Escríbenos por WhatsApp" en la ficha, en preguntas
  frecuentes y en el pie. El botón flotante queda en duda: se prueba y se decide con capturas.
- **Hojas de información:** Envíos, Cambios y devoluciones, Aviso de privacidad y Términos se
  abren en un panel con el estilo de la ficha. Llevan texto provisional y el aviso de
  privacidad queda marcado como borrador hasta tener los datos del negocio.
- **Pie completo:** columnas Tienda / Ayuda / Marca / Contacto, íconos de Instagram y WhatsApp
  con enlace, y la línea legal.

---

## 4. Fase 3: interacciones de firma

### T3.1 Pasar la mano por el perchero
**Qué se ve:** si mueves el cursor rápido sobre el perchero, las prendas que vas rozando se
mecen según la velocidad, como al pasar la mano por un perchero real. Si te detienes, gira la
prenda como hoy. En celular, el deslizamiento del perchero inclina un poco las prendas.

**Cómo (`app.js`):**
- En `pointermove` se calcula la velocidad horizontal suavizada. Cada vez que el cursor cruza
  el centro de una prenda a más de 0.6 px/ms, se llama a `sway(prenda, ±fuerza)`, con fuerza
  entre 1.5° y 5° según la velocidad y una pausa de 250 ms por prenda.
- No afecta a la prenda activa ni a la que está girando. Se apaga con el detalle abierto y con
  "reducir movimiento".
- En celular se reutiliza la inclinación por velocidad que ya existe (`setupLean`), ahora
  también con el scroll horizontal del perchero.

**Listo cuando:** se siente sutil, nunca pasa de 5° y no choca con el giro ni con la brisa.

### T3.2 Arrastrar para girar
**Qué se ve:** en la ficha, arrastras la prenda de lado a lado y gira sobre su gancho. Al soltar
frena sola y se acomoda en la vista más cercana (frente o lado). La primera vez aparece
"Arrastra para girar ↔" y se va al primer uso.

**Cómo:**
- Draggable + InertiaPlugin de GSAP (gratis), cargados desde jsDelivr, versión 3.13.0.
- El arrastre se convierte en un avance de −1 a 1:
  - de 0 a 1 se usa el giro 3D actual hacia el lado izquierdo;
  - hacia el otro lado, si existe la vista del lado derecho (PROMPTS 16.2), se usa esa;
  - si no existe, ese lado ofrece una resistencia elástica.
- Con los cuadros reales del video (T4.1) el giro se vuelve continuo.
- En celular: `touch-action: pan-y` y bloqueo del eje, para que el scroll vertical no se rompa.

### T3.3 Precio en etiqueta colgante
**Qué se ve:** en la colección, cada prenda tiene una pequeña etiqueta de cartón colgada del
gancho con el precio. Las prendas nuevas llevan además una etiqueta azul "Nuevo". La etiqueta
se columpia con la prenda.

**Cómo:** elemento dentro de `.piece__hang`, a la altura del cuello del gancho, con su cordón;
inclinación de reposo distinta por prenda (−4°, 3°, −2°, 5°, −3°) y un columpio retrasado al
pasar el cursor. El precio sigue presente para lectores de pantalla.

**Se decide con capturas:** si a 230 px de alto se ve recargado, se queda la línea de texto
con el precio más grande (T1.2).

### T3.4 Sección "De cerca" (sin fijar el scroll)
**Qué se ve:**
- **En computadora:** la playera 03 al centro, colgada de un tubo corto. De ella salen 3 líneas
  finas hacia círculos con fotos macro:
  - "Serigrafía": tintas base agua (P);
  - "Cuello": acanalado que no se deforma (P);
  - "Tela": 100% algodón de 240 g/m² (P).
- Al entrar en pantalla, las líneas se dibujan y los círculos aparecen uno tras otro.
- Al pasar el cursor sobre un círculo, su punto en la prenda late suavemente.
- **En celular:** la prenda arriba y los 3 detalles en lista, numerados igual que los puntos.
- En la ficha aparece una cuarta vista, "De cerca", con el estampado de esa prenda.

**Cómo:** SVG para líneas y puntos (DrawSVGPlugin de GSAP, gratis). Ocurre una vez y no fija el scroll.

**Necesita:** fotos macro (PROMPTS 17).

### T3.5 Drop 02 con cuenta regresiva (dentro de la newsletter)
**Qué se ve:** la etiqueta colgante de la newsletter se convierte en el aviso del drop:
- "Drop 02 · sábado 24 de octubre · 20:00 h" (P);
- una cuenta regresiva días · horas · min · seg, donde cada dígito sube al cambiar;
- el campo de correo con el botón "Avísame";
- en el mismo tubo de la etiqueta cuelga **una prenda tapada con funda**, con su etiqueta
  "Drop 02", que se columpia junto con la etiqueta;
- cuando llega la fecha: "Ya disponible" y el botón "Ver el drop".

**Cómo:** fecha en `catalogo.json` (`sitio.drop`) con zona horaria de la Ciudad de México
(UTC−6 todo el año). Los dígitos usan números de ancho fijo para que no bailen. Si la pestaña
está oculta, se pausa.

**Necesita:** foto de la prenda tapada (PROMPTS 23).

---

## 5. Fase 4: contenido nuevo

### T4.1 Giro real a partir de video
**Qué se ve:** el giro de lado a frente pasa por ángulos reales, sin saltos ni dobles imágenes.

**Cómo:**
- `tools/cuadros_video.py` (nuevo) lee el MP4 con OpenCV y elige de 10 a 14 cuadros parejos.
- Quita el fondo con rembg (`isnet-general-use`) y alinea cada cuadro al lienzo de
  1000×1300 con el gancho en (500, 30), a la misma altura que la foto de frente.
- Iguala el color con la foto de frente (LAB), exporta WebP y actualiza `catalogo.json` y
  `prendas.json`.
- En `app.js`, el giro con varios cuadros se activa solo para las prendas que los tengan.

**Decisión:** primero con la prenda 03. Te muestro el giro 3D actual y el giro real lado a
lado, y tú eliges antes de hacer las demás.

**Necesita:** videos de giro (PROMPTS 16).

### T4.2 Clips del lookbook
**Qué se ve:** cada foto del lookbook es un clip de 5 s en loop, sin sonido. El modelo apenas
se mueve: se acomoda la prenda o respira.

**Cómo:** `<video muted playsinline loop preload="none">` con la foto como portada. Se
reproduce solo cuando está en pantalla. Con "reducir movimiento" o ahorro de datos se queda la
foto. Peso máximo por clip: 1.5 MB (720×900, H.264 y WebM). La compresión se hace con el
ffmpeg del paquete `imageio-ffmpeg`.

**Necesita:** clips (PROMPTS 19) y looks 02 y 04 con modelo (PROMPTS 18).

### T4.3 Video del estudio en Nosotros
**Qué se ve:** la foto del estudio pasa a ser un video lento: la cámara recorre el perchero y las
prendas se mueven con la brisa. Se abre igual que hoy, desde el centro.

**Necesita:** PROMPTS 20.

### T4.4 "Cómo se hace"
**Qué se ve:** 4 pasos (boceto, malla, estampado, al perchero) con foto y una línea de texto. En
computadora, en fila; en celular, deslizables. Un ganchito recorre un tubo fino sobre los pasos
mientras bajas. Sin fijar el scroll.

**Necesita:** PROMPTS 21.

### T4.5 "Así se usa"
**Qué se ve:** 6 fotos de la colección en la calle y el botón "Etiquétanos en Instagram". En la
vista previa dirá "Fotos de muestra"; no se presentarán como clientes reales. Se cambian por
fotos reales cuando existan.

**Necesita:** PROMPTS 22.

### T4.6 Para la fase funcional
Pagos, inventario, correos, páginas por producto para buscadores y redes, y un asistente de
estilo y tallas con IA.

---

## 6. Orden de trabajo

| Sesión | Tareas | Necesita de ti |
|---|---|---|
| 1 | T1.1 español, T1.2 letra, T1.6 logo, T1.7 accesibilidad | Aprobar los textos del Anexo A |
| 2 | T1.3 tubo, T1.4 detalle, T1.5 portada, T1.8–T1.11 | — |
| 3 | T2.1 bolsa, T2.2 vuelo, T2.3 botón fijo | — |
| 4 | T2.4 enlaces y compartir, T2.5 colección, T2.6 tallas | — |
| 5 | T2.7 confianza: beneficios, preguntas, hojas, pie | Datos de envío, cambios y contacto (pueden ser provisionales) |
| 6 | T3.1 pasar la mano, T3.2 arrastrar, T3.3 etiqueta | Opcional: vista lado derecho (PROMPTS 16.2) |
| 7 | T3.4 De cerca, T3.5 drop | Fotos macro (17) y prenda tapada (23) |
| 8 | T4.1 giro real (prueba con 03) | Video de giro de la 03 (16.1) |
| 9 | T4.2–T4.5 contenido | Clips (19), estudio (20), proceso (21), calle (22) |

Mientras yo hago las sesiones 1 a 5, tú puedes ir generando las fotos y videos en este orden:
**16.1 (giro de la 03) → 17 (macros) → 18 (looks 02 y 04) → 23 (prenda tapada) → 19 → 20 → 21 → 22.**

Al terminar cada sesión: capturas, pruebas de la sección 0.4, vista previa publicada, commit y push.

---

## 7. Lo que necesito de ti

1. **Aprobar los textos** del Anexo A, sobre todo los nombres en español.
2. **Datos (pueden ser provisionales):**
   - envío: tiempo, costo y monto para envío gratis;
   - cambios: días y condiciones;
   - tela: gramaje y técnica de estampado;
   - dónde se hacen las prendas;
   - WhatsApp, Instagram y correo;
   - fecha del Drop 02.
3. **Fotos y videos** de `docs/PROMPTS.md`, secciones 15 a 24, en el orden de la sección 6.

---

## Anexo A. Textos en español

### Nombres y categorías
| # | Hoy | Nombre nuevo | Categoría | Plural (filtro) |
|---|---|---|---|---|
| 01 | Camo Overshirt | Sobrecamisa Camo | Sobrecamisa | Sobrecamisas |
| 02 | Nomad Minimal Tee | Playera Nomad Minimal | Playera | Playeras |
| 03 | More Than Money Tee | Playera More Than Money | Playera | Playeras |
| 04 | Good People Tee | Playera Good People | Playera | Playeras |
| 05 | Create Good Habits Crewneck | Sudadera Create Good Habits | Sudadera | Sudaderas |

### Descripciones
- **01:** Sobrecamisa amplia con camuflaje en tonos café y arena. Botones al frente, bolsa en el pecho y manga larga; hecha para usarse abierta sobre una playera.
  Detalles: Sarga de algodón gruesa · Corte oversized · Bolsa en el pecho.
- **02:** Playera negra de algodón pesado con el nombre NOMAD pequeño en el pecho. Cuerpo amplio y hombro caído.
  Detalles: Algodón pesado · Corte oversized · Logo estampado.
- **03:** Playera blanca de algodón pesado con un billete de un dólar estampado en el pecho y "More Than Money" en letra script.
  Detalles: Algodón pesado · Corte oversized · Serigrafía.
- **04:** Playera negra de algodón pesado con "Good People Better Days" en letra serif color crema a lo largo del frente.
  Detalles: Algodón pesado · Corte oversized · Serigrafía.
- **05:** Sudadera verde bosque con el estampado "Create Good Habits" en crema y un pequeño globo terráqueo. Puños y resorte acanalados.
  Detalles: Felpa de algodón perchada · Corte relajado · Serigrafía.
- **Cuidados (todas):** Lavar en frío y al revés. Secar colgada. No usar secadora.

### Interfaz
| Lugar | Texto |
|---|---|
| Menú | Tienda · Nosotros · Contacto · Bolsa |
| Perchero (indicación) | Pasa el cursor para girar · Clic para ver / Toca para girar · Toca otra vez para ver |
| Perchero (prenda) | Playera More Than Money · $690 |
| Botón portada | Ver tallas |
| Barra | Drop 01 ya en el perchero • Envíos a todo México • Algodón pesado • Avísame del Drop 02 |
| Detalle | Elige tu talla · Algodón pesado · Corte oversized · Ver detalles · Cerrar |
| Colección | La colección · 05 prendas / **Todo en el perchero.** / Todo · Sobrecamisas · Playeras · Sudaderas / Nuevo / Agregar rápido |
| De cerca | De cerca / **Hecha para durar.** / Serigrafía · Cuello · Tela |
| Lookbook | Lookbook · Vol. 01 / **Cinco prendas, todos los días.** / Look 01 |
| Nosotros | Nomad es un perchero corto de prendas para todos los días: algodón pesado, cortes amplios y estampados que nosotros mismos usaríamos. Cada diseño nuevo llega primero aquí. |
| Datos de Nosotros | Tela: Algodón pesado · Corte: Oversized · Drops: Cada mes (P) |
| Cómo se hace | **Del boceto al perchero.** / Boceto · Malla · Estampado · Al perchero |
| Así se usa | **En la calle.** / Etiquétanos en Instagram |
| Preguntas | **Preguntas frecuentes** / ¿Cuánto tarda mi envío? · ¿Envían a todo México? · ¿Puedo cambiar de talla? · ¿Cómo elijo mi talla? · ¿Cómo cuido mi prenda? · ¿Cuándo sale el próximo drop? |
| Drop (etiqueta) | Drop 02 · sáb 24 oct · 20:00 h / **Avísame cuando salga** / Las prendas nuevas llegan primero al perchero. Te mandamos un aviso corto el día del drop. / días · horas · min · seg / tu@correo.com / Avísame |
| Drop (reverso) | **Listo, te avisamos.** / Esto es una vista previa del diseño: el registro aún no está conectado y no se envió ningún correo. / Usar otro correo |
| Ficha | Talla · Guía de tallas · ¿Qué talla soy? · Agregar a la bolsa · Detalles · Cuidados · Compartir · Frente · Lado · Puesta · De cerca |
| Guía de tallas | Guía de tallas · cm / Talla · Pecho · Largo · Manga / Medidas de la prenda en plano; pueden variar ±1 cm. |
| ¿Qué talla soy? | Estatura (cm) · Peso (kg) · ¿Cómo te gusta que te quede? Justa · Normal · Holgada / Te recomendamos la M. / Es una sugerencia según nuestra guía de tallas. |
| Bolsa | Tu bolsa · Talla M · Quitar · Subtotal · Te faltan $310 para el envío gratis · Tu envío es gratis · El envío se calcula al pagar · Finalizar compra / Tu bolsa está vacía · Ver la colección |
| Avisos | Agregado a tu bolsa · Talla M / Enlace copiado / Vista previa: el pago todavía no está conectado. |
| Pie | Tienda: El perchero, Colección, Lookbook · Ayuda: Envíos, Cambios y devoluciones, Guía de tallas, Preguntas frecuentes · Marca: Nosotros, Cómo se hace, Newsletter · Contacto: Instagram, WhatsApp, Correo · © 2026 Nomad · Aviso de privacidad · Términos · Prototipo, solo diseño |

---

## Anexo B. Cambios en `catalogo.json`

Por prenda (dentro de cada item):
```json
"slug": "playera-more-than-money",
"nombre": "Playera More Than Money",
"categoria": "Playera",
"categoria_plural": "Playeras",
"tienda": {
  "agotadas": [],
  "look": { "modelo": { "estatura": 1.78, "talla": "L", "articulo": "El" } },
  "cerca": { "foto": "fotos/cerca-03-estampado.webp" },
  "giro": { "cuadros": [] }
}
```

En `sitio`:
```json
"envio": { "dias": "3 a 5 días hábiles", "gratis_desde": 1500 },
"cambios": { "dias": 30 },
"drop": { "nombre": "Drop 02", "fecha": "2026-10-24T20:00:00-06:00" },
"contacto": { "instagram": "@nomad", "whatsapp": "52XXXXXXXXXX", "correo": "hola@nomad.example" },
"recomendador": {
  "peso": [[60, "S"], [73, "M"], [86, "L"], [999, "XL"]],
  "estatura_alta": 185, "estatura_baja": 160,
  "ajuste": { "justa": -1, "normal": 0, "holgada": 1 }
},
"preguntas": [{ "p": "¿Cuánto tarda mi envío?", "r": "…" }],
"guia_tallas": { "columnas": ["Pecho", "Largo", "Manga"] }
```
Todo lo de arriba es **(P)** salvo los nombres, y `tools/catalogo_web.py` lo copia a `web/prendas.json`.

---

## Anexo C. Pruebas automáticas (`tools/pruebas/`)

| Script | Qué revisa |
|---|---|
| `capturas.js` | Capturas de cada sección en los 5 tamaños y con paneles abiertos |
| `accesibilidad.js` | axe en la página, la ficha, la bolsa y las hojas: 0 graves o serios |
| `restos.js` | Filtros, bolsa, ficha y detalle repetidos rápido: sin transformaciones ni opacidades atoradas |
| `letra.js` | Ningún texto visible por debajo de 12 px |
| `rendimiento.js` | Peso inicial ≤ 1.3 MB sin videos, LCP y CLS, sin errores en consola |
| `bolsa.js` | Agregar, cambiar cantidad, quitar, recargar y conservar |
| `enlaces.js` | Abrir `#/prenda/...` directo, botón atrás, compartir |
