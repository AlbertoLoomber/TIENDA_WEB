# Tienda web tipo "perchero interactivo": análisis y plan

Referencia: video de 13.6 s (582×356) analizado fotograma por fotograma.
Capturas en [`docs/referencia/`](./referencia).

---

## 1. Qué hace la página de referencia

### 1.1 Estructura visual

| Elemento | Detalle observado | Cómo se hace |
|---|---|---|
| Fondo | Gris cálido claro (~`#E7E6E1`) con una retícula de puntos muy tenue | CSS `radial-gradient` repetido; no es una imagen |
| Header | `ABOUT` a la izquierda, logo en letra script azul marino al centro, `CONTACT` a la derecha; tipografía mayúscula muy pequeña y espaciada | HTML + fuente de Google Fonts o fuente propia |
| Perchero | Tubo cromado horizontal con soportes en los extremos | PNG/WebP recortado (foto o render 3D) |
| Prendas | ~10 prendas en ganchos de madera, **vistas de perfil** (angostas), muy juntas | Fotos recortadas sin fondo, **una prenda por imagen** |
| Nombre de prenda | Texto pequeño bajo la prenda activa ("Made This Tee — Black") | Aparece con fade al hacer hover |
| Botón | Píldora con borde, `SEE AVAILABILITY` | CSS |
| Marquee inferior | Barra azul marino con texto corrido: `NEW DESIGNS DAILY • SUBSCRIBE TO OUR NEWSLETTER` | Animación CSS infinita |

### 1.2 Interacciones (lo que hace especial al sitio)

1. **Hover sobre una prenda (0 s – 7 s del video)**
   - La prenda **gira de perfil a frente** (≈90°) como si alguien la girara en el gancho.
   - Al girar se hace más ancha y **empuja a las prendas vecinas** hacia los lados (con un rebote suave tipo resorte).
   - Tiene un ligero **balanceo** (péndulo) desde el gancho.
   - Aparece el nombre debajo.
   - Al salir el cursor, la prenda regresa a su posición de perfil.
   - En el fotograma de 2.4 s se ve la prenda en un ángulo intermedio (¾), lo que indica que **no es un simple cambio de foto**: es una **secuencia de imágenes** (o un modelo 3D) de la prenda girando.

2. **Clic → vista de detalle (7.2 s – 12.4 s)**
   - El perchero se **desenfoca y se desvanece** al fondo (blur + opacidad).
   - La prenda elegida viaja al **centro**, más grande, de frente.
   - Header cambia a solo `CLOSE`.
   - Flechas ← → para navegar entre prendas, con **crossfade** entre una y otra.
   - Debajo: categoría (texto diminuto), nombre en itálica azul marino, botón `SEE AVAILABILITY`.
   - Una pequeña barra/"handle" abajo: sugiere un **panel deslizable** (drawer) con tallas, precio y detalles.

3. **Cerrar (12.4 s – 13.6 s)**
   - La prenda **vuelve al perchero** y se "cuelga" con un pequeño balanceo; el fondo se re-enfoca.

---

## 2. ¿Fotos, videos o 3D? (la decisión más importante)

El 80 % del efecto depende de los **assets de las prendas**, no del código. Todas las imágenes deben verse como tomadas con la **misma cámara, misma luz, misma altura y mismo gancho**; si no, el perchero se ve "pegado".

### Opción A — Fotografía real con giro (recomendada si ya tienes las prendas)

Por cada prenda:

- Colgarla en el **mismo gancho de madera** desde un punto fijo (un tubo o un gancho en el techo).
- Cámara en **tripié**, lente 50–85 mm, a la altura del pecho de la prenda, **misma distancia siempre**.
- Fondo liso gris/blanco y luz suave (2 softbox o ventana grande + rebotador) → facilita el recorte.
- Girar la prenda de **perfil (0°) a frente (90°)** y tomar:
  - **Mínimo viable:** 2 fotos (perfil y frente) + 1 espalda si tiene estampado atrás.
  - **Ideal:** 16–24 fotos cada ~5° (o grabar video 4K a 60 fps girándola lento y extraer fotogramas).
- Truco para girar parejo: un **plato giratorio** (turntable) invertido en el techo o un gancho giratorio motorizado de exhibidor (los hay económicos para fotografía de producto). A mano también funciona si marcas los ángulos.

Post-producción:

- Recorte de fondo en lote: Photoroom / remove.bg (de pago, rápidos) o `rembg` (gratis, open source, se automatiza con un script).
- Corrección de color igual para todas.
- Exportar **WebP/AVIF con transparencia**, alineadas en el mismo lienzo (el gancho siempre en el mismo píxel). Dos tamaños: ~600 px (perchero) y ~1400 px (detalle).

**Video vs. secuencia de imágenes:** aunque grabes video, en la web conviene usar **secuencia de imágenes** (o un sprite sheet), porque el video con transparencia no funciona igual en todos los navegadores (Safari necesita HEVC con alfa, Chrome WebM VP9) y no se puede controlar frame a frame con el cursor tan fácil. El video sirve como **materia prima** para extraer los fotogramas.

### Opción B — 3D (si aún no tienes las prendas físicas o quieres escalar)

- Modelar la prenda en **CLO3D** o **Marvelous Designer** (simulación de tela real), aplicar el estampado como textura, render en **Blender** con una cámara fija y la prenda girando 0→90° → misma secuencia de imágenes que la opción A.
- Ventaja: consistencia perfecta, sin sesión de fotos, puedes lanzar diseños "diarios" (como dice el marquee de la referencia) sin fabricar la prenda antes.
- Alternativa más pesada: cargar el modelo `.glb` directo en la web con **Three.js / React Three Fiber**. Más flexible (giro 360° real) pero más pesado y más trabajo; no lo recomiendo para la v1.

### Opción C — IA (atajo para prototipo)

- Generar/limpiar fotos de producto con herramientas de IA (Photoroom, generadores de imagen, Canva).
- Animar el giro con image-to-video (Runway, Kling, etc.) a partir de la foto de frente y extraer fotogramas.
- Problema: el estampado suele **deformarse** en el giro. Útil para maquetar y probar, **no** para el catálogo final.

### Recomendación

1. **Ahora:** prototipo con 2 fotos por prenda (perfil + frente) → ya se logra el 70 % del efecto (el cambio de ancho + empuje + balanceo disimula el salto).
2. **Después:** secuencia de 16–24 frames por prenda para el giro realista.

Otros assets que necesitas:

- Foto/render del **perchero** (tubo cromado + soportes) y del **gancho** si lo separas de la prenda.
- **Logo** en SVG.
- Fotos adicionales por prenda para el detalle: espalda, close-up del estampado, en modelo (opcional).
- Video: **no es obligatorio** para el sitio; sí útil para redes y como fuente de frames.

---

## 3. Cómo se hacen las animaciones

Stack sugerido: **Next.js (React) + GSAP** (o **Motion**, antes Framer Motion) + Tailwind CSS.

| Efecto | Técnica |
|---|---|
| Retícula de puntos | `background-image: radial-gradient(#0001 1px, transparent 1px); background-size: 24px 24px;` |
| Marquee inferior | Texto duplicado dentro de un contenedor con `@keyframes` `translateX(0 → -50%)` en bucle infinito |
| Prendas juntas y el "empuje" | Cada prenda es un elemento en fila (`flex`) con ancho angosto; en hover se **anima su ancho** al ancho de frente. Como están en flex, las vecinas se recorren solas. Con GSAP (`ease: "elastic.out"` o `back.out`) o Motion (`layout` + `type: "spring"`) sale el rebote |
| Giro perfil → frente | **Secuencia de imágenes en `<canvas>`** (o cambiando `src` precargados): un tween de GSAP anima `frame` de 0 a N en ~0.5 s al entrar y de regreso al salir. Con solo 2 fotos: crossfade + `scaleX` de 0.3→1 para simular el giro |
| Balanceo desde el gancho | `transform-origin` en el punto del gancho (arriba al centro) y un `rotate` pequeño (±3°) con resorte amortiguado |
| Nombre bajo la prenda | Fade + ligero `translateY` |
| Abrir detalle | **GSAP Flip** (o `layoutId` compartido de Motion): la prenda "vuela" de su lugar en el perchero al centro de la pantalla escalándose. Al mismo tiempo el perchero recibe `filter: blur(8px)` + `opacity: .3` |
| Carrusel en detalle | Flechas, teclado (← →) y swipe en móvil; crossfade entre prendas (opacidad + leve escala) |
| Cerrar | Flip inverso: vuelve a su lugar y dispara el balanceo |
| Drawer de disponibilidad | Panel inferior que sube (`translateY`), con tallas, precio y "Agregar al carrito" |

Detalles de calidad:

- **Precarga inteligente:** al cargar solo el primer frame de cada prenda; la secuencia completa se descarga en segundo plano (o al acercar el cursor). 10 prendas × 20 frames × ~30 KB ≈ 6 MB: no debe bloquear la carga inicial.
- **Accesibilidad:** cada prenda es un `<button>` con nombre accesible; navegable con teclado; respetar `prefers-reduced-motion` (sin giro/balanceo, solo fade).
- **Móvil:** no hay hover. Propuesta: el perchero se vuelve **scroll horizontal con snap**; la prenda centrada se gira automáticamente al quedar al centro, y un tap abre el detalle.

---

## 4. La tienda (lo que hay detrás)

El sitio de referencia es básicamente un "lookbook"; para vender necesitas catálogo, inventario, carrito y pagos.

Recomendación: **Shopify como backend + frontend propio (headless)** con la Storefront API.

- Shopify maneja productos, tallas/variantes, inventario, checkout, pagos (tarjeta, OXXO, Mercado Pago según la configuración en México), envíos e impuestos.
- Nuestro frontend (Next.js) pinta el perchero y las animaciones y consulta a Shopify.
- "SEE AVAILABILITY" → tallas con stock real desde Shopify.
- Hosting del frontend: Vercel (plan gratis suficiente al inicio).

Alternativas: Shopify con tema propio en Liquid (menos flexible para estas animaciones), o Stripe + CMS (Sanity) si no quieres pagar Shopify (más trabajo tuyo en inventario y pedidos).

---

## 5. Plan por fases

| Fase | Qué se hace | Entregable |
|---|---|---|
| **0. Definición** (1–2 días) | Nombre/marca, logo, paleta, tipografías, lista de prendas (nombre, precio, tallas, colores), textos del marquee | Brief + moodboard |
| **1. Prototipo** (3–5 días) | Next.js + GSAP. Perchero, hover con 2 fotos (o imágenes placeholder), empuje de vecinas, balanceo, marquee, vista de detalle con carrusel y cierre | Página navegable para validar la sensación |
| **2. Sesión de fotos / 3D** (en paralelo) | Guía de sesión (sección 2), fotos de perfil/frente/espalda y secuencias de giro; recorte y exportación | Carpeta de assets normalizados |
| **3. Giro realista** (2–3 días) | Reproductor de secuencias en canvas, precarga, optimización (AVIF/WebP, tamaños) | Giro fluido a 60 fps |
| **4. Tienda** (4–6 días) | Shopify: productos y variantes; integración Storefront API; drawer de tallas, carrito, checkout | Compra de punta a punta |
| **5. Páginas y extras** (2–3 días) | About, Contact, newsletter (Klaviyo/Mailchimp/Shopify Email), SEO, Open Graph, analytics | Sitio completo |
| **6. Móvil, accesibilidad y QA** (2–3 días) | Versión táctil, `prefers-reduced-motion`, Lighthouse, pruebas en Safari/iOS | Lanzamiento |

---

## 6. Lo que necesito de ti para empezar

- [ ] Nombre de la marca y logo (ideal en SVG).
- [ ] Lista de prendas de la primera colección (nombre, precio, tallas, colores).
- [ ] ¿Ya tienes las prendas físicas? → define si vamos por fotos (opción A) o 3D (opción B).
- [ ] ¿Ya tienes Shopify o prefieres otra plataforma?
- [ ] Colores y tipografías, o me dejas proponer.
- [ ] Dominio (si ya tienes).

Mientras tanto se puede construir la **fase 1 con imágenes provisionales** para validar las animaciones sin esperar la sesión de fotos.
