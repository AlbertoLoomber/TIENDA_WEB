# 06 · Datos, direcciones y almacenamiento

---

## 1. Cómo fluyen los datos (no cambia)

```
catalogo.json  ──(tools/catalogo_web.py)──►  web/prendas.json  ──►  app.js · shop.js · bag.js · info.js
(fuente, en español)                          (lo que lee la página)
```

- `catalogo.json` sigue siendo la **única fuente**. La página nunca se edita a mano.
- `tools/catalogo_web.py` copia, traduce las claves y **valida** (sección 4). Si algo no cuadra, se detiene con un mensaje claro.

---

## 2. Prenda: ejemplo completo (03)

Los campos actuales se conservan (`front`, `side`, `approved_angles`, `revision_60`…). Lo nuevo va marcado con `// nuevo`.

```jsonc
{
  "id": "03-white-tee-dollar",
  "slug": "playera-more-than-money",                 // nuevo: dirección de la ficha
  "nombre": "Playera More Than Money",               // ahora en español
  "diseno": "More Than Money",                       // nuevo: nombre corto
  "categoria": "Playera",
  "categoria_plural": "Playeras",                    // nuevo: filtros
  "tienda": {
    "precio": 690,                                   // (P)
    "nuevo": false,
    "tallas": ["S", "M", "L", "XL"],
    "agotadas": [],                                  // nuevo (P): estado tachado; en el prototipo la 01 lleva ["XL"] para mostrarlo
    "descripcion": "Playera blanca de algodón pesado con un billete de un dólar…",
    "detalles": ["Algodón pesado", "Corte oversized", "Serigrafía"],
    "cuidados": "Lava en frío y al revés, sin blanqueador. Seca colgada. Plancha por el revés sin tocar el estampado.",
    "look": {
      "tono": "#3e4874", "tinta": "#eceae3",
      "foto": "fotos/look-03-money.webp",
      "clip": "video/clip-look-03",                  // nuevo (fase 4): sin extensión; .mp4 y .webm
      "modelo": { "articulo": "El", "estatura": 1.78, "talla": "L" }   // nuevo (P)
    },
    "cerca": { "foto": "fotos/cerca-03-estampado.webp" },             // nuevo (fase 3)
    "giro": {                                                          // nuevo (fase 4)
      "video": "assets/raw/video/giro-03-izquierda.mp4",
      "cuadros": [ { "angulo": 72, "src": "prendas/03-white-tee-dollar/giro/01.webp", "left": 0.33, "right": 0.69 } ]
    },
    "_provisional": ["precio", "agotadas", "look.modelo"]             // nuevo: qué falta confirmar
  }
}
```

---

## 3. Sitio: bloque completo

```jsonc
"sitio": {
  "_nota": "Precios, textos, medidas y contactos son PROVISIONALES: confirmar antes de publicar.",
  "moneda": "MXN",
  "barra": ["Drop 01 ya en el perchero", "Envíos a todo México", "Algodón pesado", "Avísame del Drop 02"],
  "foto_estudio": "fotos/studio.webp",
  "video_estudio": "video/video-estudio",                       // fase 4
  "guia_tallas": {
    "unidad": "cm",
    "columnas": ["Pecho", "Largo", "Manga"],
    "filas": { "S": [112, 72, 23], "M": [118, 74, 24], "L": [124, 76, 25], "XL": [130, 78, 26] },
    "nota": "Medidas de la prenda en plano; pueden variar ±1 cm."
  },
  "recomendador": {
    "orden": ["S", "M", "L", "XL"],
    "peso": [[60, "S"], [73, "M"], [86, "L"], [999, "XL"]],
    "estatura_alta": 185, "estatura_baja": 160,
    "ajuste": { "justa": -1, "normal": 0, "holgada": 1 },
    "limites": { "estatura": [140, 210], "peso": [40, 150] }
  },
  "envio": { "preparacion": "1 a 2 días hábiles", "entrega": "3 a 5 días hábiles", "costo": 149, "gratis_desde": 1500 },
  "cambios": { "dias": 30, "primer_cambio_gratis": true },
  "contacto": { "instagram": "@nomad", "whatsapp": "52XXXXXXXXXX", "correo": "hola@nomad.example" },
  "drop": {
    "nombre": "Drop 02",
    "fecha": "2026-10-24T20:00:00-06:00",
    "foto": "drop/drop-02.webp"
  },
  "cerca": { "prenda": "03-white-tee-dollar", "puntos": [ /* ver 03-fase-3, T3.4 */ ] },
  "proceso": [ { "titulo": "Boceto", "texto": "Cada diseño empieza a mano, en papel.", "foto": "fotos/proceso-1-boceto.webp" } ],
  "calle": { "muestra": true, "fotos": [ { "foto": "fotos/calle-1.webp", "prenda": "01-camo-overshirt" } ] },
  "preguntas": [ { "p": "¿Cuánto tarda mi envío?", "r": "Preparamos tu pedido en 1 a 2 días hábiles…" } ],
  "hojas": {
    "envios":     { "titulo": "Envíos", "secciones": [ { "t": "Tiempos", "p": "…" } ] },
    "cambios":    { "titulo": "Cambios y devoluciones", "secciones": [] },
    "privacidad": { "titulo": "Aviso de privacidad", "borrador": true, "secciones": [] },
    "terminos":   { "titulo": "Términos", "borrador": true, "secciones": [] }
  },
  "_provisional": ["barra", "envio", "cambios", "contacto", "drop.fecha", "recomendador", "cerca.puntos", "proceso", "preguntas", "hojas"]
}
```

---

## 4. Validaciones de `catalogo_web.py`

Se detiene con un mensaje claro si:
- hay dos `slug` iguales o un `slug` con caracteres fuera de `a-z`, `0-9` y `-`;
- `agotadas` tiene una talla que no está en `tallas`;
- falta una foto, clip o cuadro referenciado (se revisa que el archivo exista en `web/`);
- `drop.fecha` no es una fecha ISO con zona horaria;
- `recomendador.peso` no está ordenado de menor a mayor o usa tallas fuera de `orden`;
- `cerca.puntos` tiene `x` o `y` fuera de 0–1.

Y avisa (sin detenerse) cuántos campos siguen marcados `_provisional`.

---

## 5. Claves en `web/prendas.json`

| `catalogo.json` | `prendas.json` |
|---|---|
| `slug`, `nombre`, `diseno`, `categoria`, `categoria_plural` | `slug`, `name`, `short`, `category`, `categoryPlural` |
| `tienda.precio`, `nuevo`, `tallas`, `agotadas` | `price`, `isNew`, `sizes`, `soldOut` |
| `tienda.descripcion`, `detalles`, `cuidados` | `description`, `details`, `care` |
| `tienda.look.*` | `look.tone`, `look.ink`, `look.photo`, `look.clip`, `look.model` |
| `tienda.cerca.foto` | `closeup` |
| `tienda.giro.cuadros` | se suman a `frames` con `kind: "video"` |
| `sitio.*` | `site.*` con las mismas claves traducidas (`band`, `sizeGuide`, `recommender`, `shipping`, `returns`, `contact`, `drop`, `closeup`, `process`, `street`, `faq`, `pages`) |

---

## 6. Direcciones de la página

| Dirección | Qué abre |
|---|---|
| `#shop`, `#cerca`, `#lookbook`, `#about`, `#proceso`, `#calle`, `#preguntas`, `#newsletter`, `#contact` | Secciones (scroll suave) |
| `#/prenda/{slug}` | Ficha de esa prenda |
| `#/ayuda/envios` · `#/ayuda/cambios` | Hojas de ayuda |
| `#/legal/privacidad` · `#/legal/terminos` | Hojas legales |
| `?drop=antes` · `?drop=despues` | Solo para revisar los estados del drop en la vista previa |

**Regla para `scroll.js`:** solo se intercepta un enlace si su hash es un `id` simple
(`/^#[\w-]+$/`). Los que empiezan con `#/` los maneja el enrutador de fichas y hojas.

---

## 7. Lo que se guarda en el navegador

| Clave | Dónde | Qué guarda | Si falla |
|---|---|---|---|
| `nomad.bolsa.v1` | `localStorage` | Líneas de la bolsa (prenda, talla, cantidad) | La bolsa funciona mientras la página esté abierta |
| `nomad.medidas` | `localStorage` | Estatura, peso y ajuste del recomendador | Se vuelven a pedir |
| `nomad.desliza` | `sessionStorage` | Ya se mostró la indicación "Desliza" | Se vuelve a mostrar |
| `nomad.arrastra` | `sessionStorage` | Ya se mostró "Arrastra para girar" | Se vuelve a mostrar |

Todas las lecturas y escrituras van dentro de `try/catch`. Ninguna es necesaria para que la página funcione.

---

## 8. Carpetas de archivos

| Carpeta | Contenido |
|---|---|
| `web/prendas/{id}/` | Recortes actuales (`0.webp`, `80.webp`…) |
| `web/prendas/{id}/giro/` | Cuadros del giro por video (`NN.webp`, `NN-700.webp`) |
| `web/fotos/` | `look-*`, `cerca-*`, `proceso-*`, `calle-*`, `studio` |
| `web/video/` | `clip-look-*.mp4` / `.webm`, `video-estudio.*`, `clip-estampado.*` |
| `web/drop/` | `drop-02.webp` (recorte con transparencia) |
| `assets/raw/` y `assets/raw/video/` | Originales que me mandas (no los lee la página) |
| `assets/para-video/` | Cuadros de inicio y fin para generar los giros |
