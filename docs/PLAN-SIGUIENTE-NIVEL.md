# Plan de implementación: Nomad al siguiente nivel

> **Estado:** plan detallado, **todavía sin implementar**. El sitio pasa a español. Sin pagos:
> la bolsa y el botón de pago son de diseño; la parte funcional (cobro, inventario, correos)
> se hace después.

**Concepto rector: el perchero es la tienda.** Todo cuelga y todo tiene peso. Cada novedad usa
el mismo lenguaje (gancho, etiqueta, tubo, cortina) y nunca le quita protagonismo al perchero.

---

## Cómo está organizado

| Documento | Qué contiene |
|---|---|
| **Este archivo** | Resumen, fases, mapa de la página, orden de trabajo y lo que necesito de ti |
| [`siguiente-nivel/00-sistema-de-diseno.md`](siguiente-nivel/00-sistema-de-diseno.md) | Colores, tipografía, espaciado, capas, tamaños de pantalla, tiempos de animación y componentes |
| [`siguiente-nivel/01-fase-1-pulido-y-espanol.md`](siguiente-nivel/01-fase-1-pulido-y-espanol.md) | Fase 1, tarea por tarea |
| [`siguiente-nivel/02-fase-2-tienda.md`](siguiente-nivel/02-fase-2-tienda.md) | Fase 2, con bocetos de bolsa, ficha, colección, preguntas, hojas y pie |
| [`siguiente-nivel/03-fase-3-interacciones.md`](siguiente-nivel/03-fase-3-interacciones.md) | Fase 3, con parámetros de movimiento y bocetos de "De cerca" y del drop |
| [`siguiente-nivel/04-fase-4-contenido.md`](siguiente-nivel/04-fase-4-contenido.md) | Fase 4: cómo se procesan fotos y videos y dónde entran |
| [`siguiente-nivel/05-textos.md`](siguiente-nivel/05-textos.md) | Todos los textos en español, listos para revisar |
| [`siguiente-nivel/06-datos.md`](siguiente-nivel/06-datos.md) | Datos de `catalogo.json`, direcciones de la página y lo que se guarda en el navegador |
| [`siguiente-nivel/07-pruebas.md`](siguiente-nivel/07-pruebas.md) | Pruebas automáticas, casos por tarea y revisión en tus dispositivos |
| [`siguiente-nivel/08-riesgos-y-decisiones.md`](siguiente-nivel/08-riesgos-y-decisiones.md) | Riesgos, decisiones tomadas, interruptores de efectos y decisiones pendientes |
| [`PROMPTS.md`](PROMPTS.md), secciones 15 a 24 | Prompts para fotos y videos |
| `assets/para-video/` | Cuadros de inicio y fin para generar los giros |

**Cada tarea trae:**
- objetivo y archivos que toca;
- diseño por tamaño de pantalla (con boceto cuando hace falta);
- estados y animación (pasos, tiempos y curvas);
- implementación paso a paso;
- accesibilidad;
- "listo cuando" y riesgos.

**Marcas:** **(P)** = dato provisional · S, M, L = esfuerzo pequeño, mediano y grande.

---

## Alcance

| Sí entra (diseño) | No entra todavía (fase funcional) |
|---|---|
| Textos, maquetación, animaciones y estados visuales | Cobro, pasarela de pago y facturas |
| Bolsa guardada en el navegador del visitante | Inventario real y existencias |
| Formularios que muestran una confirmación de diseño | Envío real de correos o mensajes |
| Enlace propio por prenda dentro de la página | Páginas por producto para Google y redes |
| Datos de ejemplo marcados como provisionales | Cuentas de usuario |

---

## Las cuatro fases

| Fase | Objetivo | Tareas | Necesita fotos o video |
|---|---|---|---|
| **1. Pulido y español** | Que se lea bien, esté en español y no parezca demo | T1.1 español · T1.2 letra · T1.3 tubo · T1.4 detalle · T1.5 portada · T1.6 logo SVG · T1.7 accesibilidad · T1.8 tablet · T1.9 "Desliza" · T1.10 textos de marca · T1.11 pruebas | No |
| **2. Que se sienta tienda** | Elegir talla, agregar, ver la bolsa, compartir y resolver dudas | T2.1 bolsa · T2.2 vuelo a la bolsa · T2.3 botón fijo · T2.4 enlace y compartir · T2.5 tallas rápidas · T2.6 ¿Qué talla soy? · T2.7 confianza (beneficios, preguntas, WhatsApp, hojas, pie) | No |
| **3. Interacciones de firma** | Detalles que solo tiene Nomad, en intensidad baja | T3.1 pasar la mano · T3.2 arrastrar para girar · T3.3 etiqueta de precio · T3.4 De cerca · T3.5 drop con cuenta regresiva | Macros (17) y prenda tapada (23) |
| **4. Contenido nuevo** | Giro real, video, proceso y calle | T4.1 giro real · T4.2 clips del lookbook · T4.3 video del estudio · T4.4 Cómo se hace · T4.5 Así se usa · T4.6 lista funcional | Videos y fotos (16 a 22) |

---

## Mapa de la página

| # | Sección | Hoy | Después |
|---|---|---|---|
| 1 | Encabezado | Shop · About · logo · Contact | Tienda · Nosotros · logo · Contacto · **Bolsa ⓪** (celular: Tienda · logo · Bolsa) |
| 2 | Portada | Perchero y barra en inglés | Perchero en español, precio bajo el perchero y barra útil; detalle con el perchero centrado |
| 3 | Colección | Tubo con 5 prendas | Tallas rápidas, etiqueta de precio y beneficios |
| 4 | **De cerca** (nueva) | — | La prenda 03 con estampado, cuello y tela señalados |
| 5 | Lookbook | 5 fotos (2 en gancho) | 5 looks con modelo, en clips de loop |
| 6 | Nosotros | Texto y foto | Texto nuevo, datos reales y video del estudio |
| 7 | **Cómo se hace** (nueva) | — | Boceto → malla → estampado → perchero |
| 8 | **Así se usa** (nueva) | — | 6 fotos en la calle conectadas a cada ficha |
| 9 | **Preguntas frecuentes** (nueva) | — | Envíos, cambios, tallas, cuidados y drops |
| 10 | Drop y newsletter | Etiqueta "Subscribe" | Etiqueta "Drop 02" con cuenta regresiva y la prenda tapada al lado |
| 11 | Pie | 3 columnas cortas | Tienda · Ayuda · Marca · Contacto, más la línea legal |

Paneles encima de la página: detalle del perchero, ficha, guía de tallas, "¿Qué talla soy?",
**bolsa** y **hojas de información** (envíos, cambios, aviso de privacidad, términos).

---

## Orden de trabajo

| Sesión | Tareas | Entregable | Necesita de ti |
|---|---|---|---|
| 1 | T1.1, T1.2, T1.6, T1.7 | Sitio en español con letra legible, logo SVG y axe limpio | Aprobar textos (`05-textos.md`); si no, uso los propuestos |
| 2 | T1.3, T1.4, T1.5, T1.8–T1.11 | Fase 1 completa con pruebas en el repositorio | Elegir la línea A/B con capturas |
| 3 | T2.1, T2.2, T2.3 | Bolsa con vuelo y botón fijo | — |
| 4 | T2.4, T2.5, T2.6 | Enlaces, compartir, tallas rápidas y recomendador | — |
| 5 | T2.7 | Beneficios, preguntas, hojas y pie | Datos de envío, cambios y contacto (P) |
| 6 | T3.1, T3.2, T3.3 | Pasar la mano, arrastrar y etiqueta de precio (con videos para revisar) | Elegir etiqueta o texto |
| 7 | T3.4, T3.5 | De cerca y drop | Macros (17), prenda tapada (23), fecha del drop |
| 8 | T4.1 | Giro real de la 03 contra el actual, en video lado a lado | Video 16.1; elegir |
| 9 | T4.2–T4.5 | Clips, estudio, proceso y calle | Archivos 18 a 22 |

**Al terminar cada sesión:**
1. Pruebas de `07-pruebas.md`.
2. Capturas antes y después.
3. Vista previa publicada en la misma dirección.
4. Commit y push.

---

## Fotos y videos

Mientras hago las sesiones 1 a 5 (que no necesitan archivos nuevos), puedes generar en este orden:

**16.1 giro de la 03 → 17 macros → 18 looks 02 y 04 → 23 prenda tapada → 19 clips → 20 estudio → 21 proceso → 22 calle.**

Los prompts, nombres de archivo y la lista de revisión están en `PROMPTS.md` (secciones 15 a 24).

---

## Lo que necesito de ti

La lista completa, con cuándo hace falta cada cosa y mi recomendación, está en
`siguiente-nivel/08-riesgos-y-decisiones.md` §4. En corto:

1. Aprobar los nombres y textos en español.
2. Datos (pueden ser provisionales):
   - envío: tiempos, costo y monto para envío gratis;
   - cambios: días;
   - tela: gramaje y técnica;
   - dónde se hace;
   - WhatsApp, Instagram y correo;
   - fecha del Drop 02.
3. Fotos y videos, en el orden de arriba.

---

## Glosario

| Término | Qué es |
|---|---|
| Perchero | El tubo de la portada con las prendas que giran |
| Detalle | La vista que se abre en la portada al elegir una prenda (con flechas y cajón de tallas) |
| Colección | El tubo de la sección "Todo en el perchero." |
| Ficha | El panel con toda la información de una prenda |
| Bolsa | El carrito de compras |
| Hoja de información | Panel con texto de ayuda o legal (envíos, cambios, privacidad, términos) |
| Etiqueta colgante | El cartón con agujero y cordón: newsletter, guía, recomendador y precio |
| (P) | Dato provisional, por confirmar |
