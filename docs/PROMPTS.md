# Prompts para generar las imágenes (solo diseño)

Objetivo: tener todas las imágenes que necesita el prototipo del perchero, con un aspecto parecido al video de referencia.
Los prompts están en **inglés** porque los generadores de imagen dan mejores resultados así. Cambia lo que está entre `[CORCHETES]`.

---

## 0. Reglas para que todo se vea consistente

El perchero solo se ve bien si **todas las prendas parecen de la misma sesión de fotos**. Por eso:

1. **Primero genera la vista de FRENTE** de cada prenda (es la imagen "maestra").
2. Las demás vistas (perfil, ¾, espalda) se hacen **editando esa imagen maestra**, o sea, subiéndola como referencia. No las generes desde cero, porque el estampado y el color cambiarían.
   - Herramientas que editan bien a partir de una imagen: ChatGPT (imágenes), Gemini (Nano Banana), Flux Kontext, Midjourney con `--cref` / `--oref`.
3. Usa **siempre el mismo bloque de estilo** (sección 1), pegado al final de cada prompt.
4. Formato: **vertical 3:4** (ej. 1536×2048) y el gancho **arriba al centro**, siempre en el mismo lugar.
5. El fondo va **liso gris claro**. Luego se le quita el fondo (Photoroom, remove.bg o `rembg`) y el fondo con puntos lo pone la página con CSS.
6. Evita copiar los diseños exactos de la marca del video. Usa tus propios textos o gráficos.

---

## 1. Bloque de estilo (pégalo al final de TODOS los prompts de prendas)

```
Studio product photography, single garment hanging on a natural light-wood clothes hanger with a curved chrome hook, hook at the top center of the frame, garment centered, no person, no mannequin, no clothing rack visible. Plain seamless light warm-gray background (#E7E6E1), soft diffused lighting from the front-left, very subtle soft shadow, realistic cotton fabric texture with natural soft folds and slight wrinkles, true-to-life colors, sharp focus, high detail, eye-level camera, 85mm lens, orthographic-like flat perspective. Vertical 3:4 composition with generous empty space around the garment. No text other than the garment print, no watermark, no logo other than the print.
```

---

## 2. Prenda maestra, vista de FRENTE (una por prenda)

Plantilla:

```
Front view of a [COLOR] [TIPO DE PRENDA] with [DESCRIPCIÓN DEL ESTAMPADO], hanging straight and facing the camera. [BLOQUE DE ESTILO]
```

### Colección sugerida (10 prendas, igual que en el video)

Copia cada línea en la plantilla de arriba y agrega el bloque de estilo.

| # | Archivo | Prenda y estampado (para el prompt) |
|---|---|---|
| 01 | `01-camo-overshirt` | `oversized button-up overshirt in a muted brown and taupe abstract camouflage print` |
| 02 | `02-black-tee-minimal` | `black heavyweight oversized t-shirt with a tiny white embroidered wordmark "[MARCA]" centered on the chest` |
| 03 | `03-white-tee-dollar` | `white heavyweight oversized t-shirt with a large vintage graphic of a green banknote and elegant black script lettering "[FRASE]" on the chest` |
| 04 | `04-black-tee-script` | `black heavyweight oversized t-shirt with large cream-white elegant italic serif lettering "[FRASE DE 3-4 PALABRAS]" stacked in three lines across the chest` |
| 05 | `05-green-crewneck` | `forest green crewneck sweatshirt with bold off-white serif lettering "[FRASE CORTA]" in three stacked lines and a small round emblem below` |
| 06 | `06-black-longsleeve` | `black long-sleeve t-shirt with a large cream-white retro varsity graphic: an arched word "[PALABRA]" above a big outlined number "3" and small text lines below` |
| 07 | `07-white-tee-flowers` | `white heavyweight oversized t-shirt with black flowing script lettering "[FRASE]" surrounded by small colorful hand-drawn flowers (red, blue, purple, orange)` |
| 08 | `08-white-tee-blank` | `plain white heavyweight oversized t-shirt, no print` |
| 09 | `09-white-tee-photo` | `white heavyweight oversized t-shirt with a large black-and-white grainy photographic print on the front` |
| 10 | `10-grey-tee-washed` | `washed charcoal grey vintage oversized t-shirt with a faded small chest print` |

Ejemplo completo (prenda 07):

```
Front view of a white heavyweight oversized t-shirt with black flowing script lettering "Made By Us" surrounded by small colorful hand-drawn flowers (red, blue, purple, orange), hanging straight and facing the camera. Studio product photography, single garment hanging on a natural light-wood clothes hanger with a curved chrome hook, hook at the top center of the frame, garment centered, no person, no mannequin, no clothing rack visible. Plain seamless light warm-gray background (#E7E6E1), soft diffused lighting from the front-left, very subtle soft shadow, realistic cotton fabric texture with natural soft folds and slight wrinkles, true-to-life colors, sharp focus, high detail, eye-level camera, 85mm lens, orthographic-like flat perspective. Vertical 3:4 composition with generous empty space around the garment. No text other than the garment print, no watermark, no logo other than the print.
```

> Tip: si el texto sale con errores, genera la prenda **sin texto** y pon el texto después en Photoshop o Canva. Los generadores todavía se equivocan con las letras.

---

## 3. Vista de PERFIL (cómo se ve en el perchero)

Sube la imagen maestra como referencia y pide:

```
Using the attached image as the exact reference, show the SAME garment on the SAME hanger, but rotated about 80 degrees on the hanger hook so it is seen almost edge-on from its left side. The garment now looks narrow: we mainly see the side seam, the sleeve hanging toward the camera, and only a thin sliver of the front print. Keep identical fabric, color, print, hanger, lighting, background, camera position, framing and scale. The hanger hook stays at exactly the same position at the top center. [BLOQUE DE ESTILO]
```

Si sale demasiado de lado (una línea) o demasiado de frente, cambia `80 degrees` por `70` o `85`.

---

## 4. Vistas intermedias para el giro

Con estas imágenes el giro de perfil a frente se ve fluido y no como un salto. Con 2–3 ángulos intermedios basta para el prototipo.

```
Using the attached image as the exact reference, show the SAME garment on the SAME hanger rotated [60 / 45 / 25] degrees away from facing the camera (turned toward its left side), a three-quarter view. Keep identical fabric, color, print, hanger, lighting, background, camera position, framing and scale. The hanger hook stays at exactly the same position at the top center. [BLOQUE DE ESTILO]
```

Orden final de cuadros por prenda: `perfil (80°) → 60° → 45° → 25° → frente (0°)`.

### Alternativa: generar el giro con video (image-to-video)

Sube la **vista de perfil** como primer cuadro y la **de frente** como último cuadro (Kling, Runway, Veo y Luma permiten poner cuadro inicial y final):

```
A single t-shirt hanging on a wooden hanger slowly rotates on its hook from a side view to face the camera, smooth and steady rotation, gentle fabric movement, static locked-off camera, no zoom, no camera movement, plain light warm-gray studio background, soft studio lighting, product video.
```

Después se extraen 16–24 cuadros del video (yo puedo hacerlo con un script). Revisa que el estampado no se deforme.

---

## 5. Vista de ESPALDA (opcional, para la vista de detalle)

```
Using the attached image as the exact reference, show the back side of the SAME garment on the SAME hanger, rotated 180 degrees so we see the back. The back is [plain / has a small print "[TEXTO]" below the collar]. Keep identical fabric, color, hanger, lighting, background, camera position, framing and scale. [BLOQUE DE ESTILO]
```

---

## 6. Perchero (tubo cromado)

```
Studio product photo of a horizontal polished chrome clothing rail: a long straight round steel tube with two small round wall-mount brackets at each end, perfectly horizontal, seen straight-on at eye level, centered, very wide panoramic composition, plain seamless light warm-gray background (#E7E6E1), soft diffused lighting with realistic chrome reflections and subtle highlights, no clothes, no hangers, no shadows on the wall, high detail. Aspect ratio 8:1.
```

> Si el generador no admite 8:1, pide 16:9 y recórtalo. También se puede dibujar el tubo con CSS (un degradado cromado) si la foto no queda bien. Yo puedo hacerlo.

---

## 7. Gancho solo (opcional)

Sirve si queremos que el gancho se quede fijo y solo gire la prenda.

```
Studio product photo of a single empty natural light-wood clothes hanger with a curved chrome hook, front view, centered, plain seamless light warm-gray background (#E7E6E1), soft diffused lighting, high detail, vertical 3:4.
```

---

## 8. Logo (script estilo firma, como el del video)

```
Minimal clothing brand logo, the words "[NOMBRE DE LA MARCA]" written in a flowing vintage baseball-script signature lettering, two words stacked and slightly offset diagonally, deep navy blue (#2E3A6B) on a plain white background, flat vector style, no background elements, no icon, clean edges.
```

Después conviene pasarlo a SVG (Illustrator "Image Trace", vectorizer.ai o Canva).

---

## 9. Opcionales para las páginas About y Contact

Estudio o taller:

```
Editorial photo of a small minimalist streetwear studio, clothing rack with t-shirts on wooden hangers, light warm-gray walls, soft natural window light, calm and clean, muted colors, 35mm film look, no people.
```

Detalle del estampado:

```
Macro close-up photo of a screen-printed graphic on heavyweight cotton t-shirt fabric, visible fabric texture and ink texture, soft studio light, muted tones.
```

---

## 10. Lista de entrega (qué necesito que me pases)

Por cada prenda (nombre `NN-nombre-vista.png`):

- [ ] `NN-...-front.png`: frente (obligatoria)
- [ ] `NN-...-side.png`: perfil (obligatoria)
- [ ] `NN-...-60.png`, `-45.png`, `-25.png`: intermedias (recomendadas)
- [ ] `NN-...-back.png`: espalda (opcional)

Generales:

- [ ] `rail.png`: perchero
- [ ] `logo.png` o `logo.svg`
- [ ] Nombre de cada prenda y su categoría (ej. "Made By Us Flowers Tee", "T-SHIRT")
- [ ] Textos del marquee (ej. `NEW DESIGNS DAILY • SUBSCRIBE TO OUR NEWSLETTER`)

Súbelas a `assets/raw/` en este repo (o pásamelas por aquí). Yo me encargo de:
quitar fondos, alinear todas al mismo lienzo con el gancho en el mismo punto, optimizar (WebP/AVIF) y montarlas en el prototipo.
