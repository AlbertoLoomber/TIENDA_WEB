# 08 · Riesgos y decisiones

---

## 1. Riesgos

| # | Riesgo | Prob. | Impacto | Cómo lo evitamos | Tareas |
|---|---|---|---|---|---|
| 1 | **Demasiado movimiento** al sumar efectos | Media | Alto | Reglas de `00-sistema-de-diseno.md` §8, inventario de movimiento, videos para que apruebes, e interruptores para apagar cada efecto (sección 3) | Fase 3 |
| 2 | **Lentitud en celulares de gama media** | Media | Alto | Presupuesto de 1.3 MB iniciales, carga diferida de cuadros y videos, sin WebGL, pruebas con procesador 4× más lento | Todas |
| 3 | **Fotos y videos de IA inconsistentes** (estampado deformado, color distinto) | Alta | Alto | Lista de revisión (PROMPTS 15), prueba primero con la 03 y el giro actual como respaldo | T4.1–T4.5 |
| 4 | **El español no cabe** en etiquetas y botones | Media | Medio | Nombre corto en la colección, revisión en 705 y 375 px | T1.1, T1.2 |
| 5 | **Textos legales** usados sin revisión | Media | Alto | Marcados como BORRADOR en la página y en los datos; no se publican sin abogado | T2.7 |
| 6 | **Datos provisionales tomados como reales** | Media | Alto | Marcas (P) y `_provisional`, aviso del script y "Prototipo, solo diseño" en el pie | Todas |
| 7 | **Capas cruzadas:** el vuelo termina detrás del fondo oscurecido | Media | Medio | Tabla de capas; el vuelo va a la capa 90 y, con la ficha abierta, al botón de bolsa de la ficha | T2.2 |
| 8 | **Enrutador contra enlaces internos** (`#/prenda` contra `#shop`) | Media | Medio | Regla del hash simple en `scroll.js` y prueba `enlaces.js` | T2.4 |
| 9 | **Detalles de Safari en iPhone:** reproducción automática, `backdrop-filter`, alto de pantalla, permisos del portapapeles | Media | Medio | `muted playsinline`, alternativa para copiar y revisión en tu teléfono | T2.4, T4.2 |
| 10 | **Almacenamiento bloqueado** (modo privado) | Baja | Bajo | Todo en `try/catch`; la bolsa funciona en memoria | T2.1, T2.6 |
| 11 | **Vistas previas de WhatsApp** iguales para todas las prendas (el `#` no cuenta) | Alta | Bajo en el prototipo | Documentado para la fase funcional (páginas por producto) | T2.4 |
| 12 | **Repositorio pesado** por videos originales | Media | Medio | En el repositorio solo van los originales de hasta 25 MB y siempre los optimizados; los más pesados se piden de nuevo si hace falta | Fase 4 |
| 13 | **Confusión de hora** del drop | Baja | Medio | Hora del centro de México escrita junto a la fecha | T3.5 |
| 14 | **Funciones que solo sirven con mouse o arrastre** | Media | Medio | Alternativas: pestañas, teclado, tocar para abrir | T2.5, T3.2 |
| 15 | **Prendas tapadas o macros que no convencen** | Media | Bajo | La sección funciona sin ellas: la prenda tapada es opcional y "De cerca" espera a tener las fotos | T3.4, T3.5 |

---

## 2. Decisiones tomadas

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-03 | El sitio va **en español** | Lo pediste; el mercado es México |
| 2026-10-03 | **Sin pagos** por ahora; bolsa y pago solo de diseño | Lo pediste; la parte funcional va después |
| 2026-10-03 | **Ninguna sección nueva fija el scroll** | Evitar saturar; el lookbook es la única |
| 2026-10-03 | En la colección **no se cambia a la foto puesta** al pasar el cursor | Rompería el tubo de prendas recortadas |
| 2026-10-03 | "De cerca" **sin fijar el scroll**, con líneas y círculos | Mismo motivo; más calmado |
| 2026-10-03 | El drop **va dentro de la newsletter** (etiqueta y prenda tapada) | Una sección menos; mismo objeto físico |
| 2026-10-03 | Cuenta regresiva **sin segundos** | Que no haya movimiento constante |
| 2026-10-03 | **Sin talla preelegida** en ficha y cajón | Evita compras en la talla equivocada |
| 2026-10-03 | En celular, encabezado **Tienda · logo · Bolsa** | No caben cinco enlaces en 375 px |
| 2026-10-03 | Nombres: **categoría en español + diseño en inglés** | El diseño es la frase del estampado |
| 2026-10-03 | Fotos en la calle **marcadas como muestra** | No presentar contenido de IA como clientes reales |
| 2026-10-03 | Perfil derecho **generado, no reflejado** | Reflejar invierte el estampado visible |
| 2026-10-03 | Giro real: **primero solo la 03**, comparado con el actual | Decidir con evidencia antes de pedir cuatro videos más |

---

## 3. Interruptores de efectos

Todas las animaciones nuevas se pueden apagar desde un solo lugar (`scroll.js`), sin tocar
nada más:

```js
NOMAD.features = {
  brush: true,        // T3.1 prendas que se mecen al pasar la mano
  dragTurn: true,     // T3.2 arrastrar para girar
  priceTag: true,     // T3.3 etiqueta de precio (false = línea de texto)
  closeupLines: true, // T3.4 líneas que se dibujan
  dropCountdown: true,// T3.5 cuenta regresiva
  flyToBag: true,     // T2.2 vuelo a la bolsa
  quickAdd: true,     // T2.5 tallas rápidas
  heroNote: false,    // T1.5 línea "Drop 01 · 5 prendas" (A/B)
  waFloat: false,     // T2.7 botón flotante de WhatsApp
};
```

Si algo se siente de más, se apaga en segundos y se revisa con calma.

---

## 4. Decisiones pendientes (tuyas)

| # | Decisión | Cuándo hace falta | Mi recomendación |
|---|---|---|---|
| 1 | Aprobar nombres en español (`05-textos.md` §3) | Sesión 1 | Como están |
| 2 | Datos de envío, cambios y contacto (pueden ser provisionales) | Sesión 5 | — |
| 3 | Gramaje, técnica de estampado y dónde se hace | Sesión 7 (De cerca) | — |
| 4 | Fecha del Drop 02 | Sesión 7 | Sábado 24 de octubre, 20:00 h (P) |
| 5 | Línea "Drop 01 · 5 prendas" en la portada | Sesión 2, con capturas | Probar; quedarse solo si no compite con el logo |
| 6 | Precio en etiqueta colgante o en texto | Sesión 6, con capturas | Etiqueta, si se ve limpia a 230 px |
| 7 | "Nuevo" como etiqueta o como texto | Sesión 6, con capturas | Texto junto al nombre |
| 8 | Botón flotante de WhatsApp | Sesión 5, con capturas | No usarlo |
| 9 | Giro real contra giro 3D actual | Sesión 8, con video | Decidir al verlo |
