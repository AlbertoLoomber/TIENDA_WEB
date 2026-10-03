# 07 · Pruebas

Cómo se comprueba cada fase antes de mostrártela. Las pruebas automáticas viven en
`tools/pruebas/` (T1.11) y corren con el Chromium que ya tiene el entorno. Safari y Firefox se
revisan a mano en tus dispositivos (sección 5).

---

## 1. Matriz

| Tamaño | Puntero | Variantes |
|---|---|---|
| 1440×900 | Mouse | Normal · reducir movimiento |
| 1280×720 | Mouse | Normal |
| 820×1180 | Táctil | Normal · horizontal (1180×820) |
| 390×844 | Táctil | Normal · reducir movimiento · red lenta |
| 375×667 | Táctil | Normal |

**Red lenta:** 4G simulada (9 Mbps de bajada, 150 ms de latencia) y procesador 4 veces más lento.

---

## 2. Scripts

| Script | Qué hace | Aprueba si |
|---|---|---|
| `capturas.js` | Recorre cada sección y estado (portada, giro, detalle, cajón, colección, De cerca, lookbook, Nosotros, preguntas, drop antes/después, pie, ficha, guía, recomendador, bolsa vacía y llena, hojas) y arma hojas de contacto | Se generan sin errores (las reviso yo y luego tú) |
| `accesibilidad.js` | axe en: página, detalle, ficha, guía, recomendador, bolsa y cada hoja | 0 problemas graves o serios |
| `letra.js` | Mide el tamaño de todo texto visible en los 5 tamaños | Nada por debajo de 12 px |
| `restos.js` | Secuencias rápidas: filtros ×5, ficha abrir/cerrar ×5, detalle ‹ › ×5, agregar ×10, bolsa abrir/cerrar ×5 | Sin transformaciones ni opacidades atoradas, sin copias del vuelo, bloqueo de scroll en 0 |
| `rendimiento.js` | Carga inicial con red normal y lenta | ≤ 1.3 MB sin videos · LCP ≤ 2.5 s en red lenta · CLS < 0.1 · 0 errores · 0 archivos faltantes |
| `bolsa.js` | Agregar, cantidad, quitar, recargar; almacenamiento bloqueado | Datos correctos y sin errores en ambos casos |
| `enlaces.js` | Abrir `#/prenda/…` y `#/ayuda/…` directo, atrás y adelante, enlaces del menú | Abre lo correcto; el scroll no salta |
| `recomendador.js` | Tabla de casos (sección 3) | Todas las tallas esperadas |
| `movimiento.js` | Barrido del cursor sobre el perchero; arrastre en la ficha; graba video corto | Máx. 5° y reposo en ≤ 2.2 s; el arrastre termina en una vista exacta |
| `drop.js` | Fecha simulada (`page.clock`) antes, cerca y después | Dígitos correctos y cambio de estado a la hora exacta |

Para que `restos.js` revise el bloqueo, `scroll.js` expone solo en modo de prueba
`NOMAD.scroll.locks` (lectura).

---

## 3. Casos por tarea

| ID | Tarea | Caso | Esperado |
|---|---|---|---|
| 1.1-a | Español | Buscar textos en inglés en la página | Ninguno, salvo nombres de diseño y estampados |
| 1.2-a | Letra | `letra.js` en los 5 tamaños | Nada < 12 px |
| 1.3-a | Tubo | Recortes al 300% con contraste ×1.8 | Sin bordes ni escalones |
| 1.4-a | Detalle | Abrir la prenda 01 (extremo izquierdo) | Se ve el tope del tubo a la izquierda y prendas a la derecha; nada vacío en medio |
| 1.4-b | Detalle | ‹ › ×5 y cerrar | La prenda cae en su gancho (±1px) |
| 1.4-c | Detalle | Tablet y celular | No hay texto borroso detrás |
| 1.8-a | Tablet | 820×1180 | Prendas ≥ 480px de alto; perchero deslizable |
| 1.9-a | Desliza | 390×844, cargar y deslizar | La indicación aparece y desaparece; con mouse nunca |
| 2.1-a | Bolsa | Agregar M y L de la 03, cantidad 3 en M, quitar L, recargar | 1 línea: 03 talla M ×3, subtotal $2,070 |
| 2.1-b | Bolsa | `localStorage` bloqueado | Sin errores; la bolsa funciona en la sesión |
| 2.1-c | Bolsa | Teclado: abrir, recorrer, Escape | Foco atrapado; al cerrar vuelve a "Bolsa" |
| 2.1-d | Bolsa | Subtotal $1,380 → $2,070 | El texto cambia a "Tu envío es gratis" y el gancho llega al final |
| 2.2-a | Vuelo | Agregar desde ficha, cajón y colección | El vuelo termina en el contador correcto en los 3 casos |
| 2.2-b | Vuelo | Reducir movimiento | Sin vuelo; el número y el aviso sí cambian |
| 2.3-a | Botón fijo | Ficha en 390 px, bajar | La barra aparece cuando el botón principal no se ve |
| 2.3-b | Sin talla | Agregar sin elegir | La fila de tallas se mueve, aparece "Elige una talla" y no se agrega nada |
| 2.4-a | Enlaces | Abrir `#/prenda/sudadera-create-good-habits` en pestaña nueva | Ficha de la 05 abierta |
| 2.4-b | Enlaces | Atrás con la ficha abierta | Se cierra; la dirección vuelve a la anterior |
| 2.4-c | Enlaces | `#/prenda/no-existe` | Página normal; dirección limpia |
| 2.4-d | Compartir | Sin `navigator.share` | Ventana con "Copiar enlace" y WhatsApp; copiar muestra el aviso |
| 2.5-a | Tallas rápidas | Mouse sobre la 03 y clic en M | Vuelo a la bolsa; la ficha no se abre |
| 2.5-b | Tallas rápidas | Táctil | No aparecen; tocar abre la ficha |
| 2.6-a | Recomendador | 170 cm, 65 kg, normal | M |
| 2.6-b | Recomendador | 188 cm, 80 kg, normal | XL |
| 2.6-c | Recomendador | 158 cm, 55 kg, justa | S (límite inferior) |
| 2.6-d | Recomendador | 175 cm, 90 kg, holgada | XL (límite superior) |
| 2.6-e | Recomendador | Estatura 17 | Error "Escribe tu estatura en centímetros…" |
| 2.6-f | Recomendador | Sugerida agotada (01, XL) | Mensaje de agotada y alternativa |
| 2.7-a | Hojas | Abrir las 4 por enlace directo y desde el pie | Abren, Escape y atrás cierran |
| 2.7-b | Pie | 375×667 al final de la página | Pie completo visible |
| 3.1-a | Pasar la mano | Barrido a 1.2 px/ms | Cada prenda ≤ 5°, reposo ≤ 2.2 s |
| 3.1-b | Pasar la mano | Barrido a 0.3 px/ms | Sin vaivén; giro por hover normal |
| 3.2-a | Arrastrar | Arrastrar 60% a la izquierda y soltar | Termina en "Lado"; la pestaña cambia |
| 3.2-b | Arrastrar | Celular: gesto vertical sobre la prenda | Scroll de la ficha, sin giro |
| 3.4-a | De cerca | Entrar, salir y volver | La animación ocurre una sola vez |
| 3.4-b | De cerca | Cambiar el ancho de la ventana | Las líneas siguen tocando puntos y círculos |
| 3.5-a | Drop | Reloj en 2026-10-24 19:58 −06:00 | 0 días · 0 horas · 2 min |
| 3.5-b | Drop | Reloj en 2026-10-24 20:00 −06:00 | Estado "ya disponible" |
| 4.1-a | Giro real | Recargar con red lenta | La carga inicial no aumenta; los cuadros llegan después |
| 4.2-a | Clips | Lookbook en celular | Se reproducen en línea, sin sonido y solo a la vista |

---

## 4. Revisión visual (la hago antes de mostrarte)

- Hojas de contacto por tamaño, con antes y después.
- Recortes al 300% de bordes delicados: tubo, cordones y etiquetas.
- Video corto de cada animación nueva (Playwright) para juzgar tiempos y suavidad.
- Lista: ¿hay algún momento con más de dos animaciones de sección a la vez? Si sí, se ajusta.

---

## 5. Revisión en tus dispositivos

Con el enlace de la vista previa, en tu iPhone (Safari) y en un Android (Chrome) si tienes:

- [ ] El perchero se desliza y gira; el detalle abre y cierra.
- [ ] La ficha hace scroll vertical sin trabarse y se puede arrastrar para girar.
- [ ] Bolsa: agregar, cambiar cantidad, recargar y que siga ahí.
- [ ] "Compartir" abre el menú del teléfono.
- [ ] Los clips del lookbook se reproducen sin pantalla completa.
- [ ] Nada se ve cortado arriba (zona de la cámara) ni abajo (barra del navegador).

---

## 6. Criterio de "fase terminada"

1. Todos los scripts de la sección 2 aprueban.
2. La revisión visual no tiene pendientes.
3. Tú apruebas las capturas o videos de la fase y la revisión en tu teléfono.
4. Vista previa publicada, commit y push.
