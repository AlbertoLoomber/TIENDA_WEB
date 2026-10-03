# Prompts para generar las imágenes (solo diseño)

Objetivo: tener todas las imágenes que necesita el prototipo del perchero, con un aspecto parecido al video de referencia.
Los prompts están en **inglés** porque los generadores de imagen dan mejores resultados así. Cambia lo que está entre `[CORCHETES]`.

> Las secciones **15 a 24** son las fotos y videos del plan "siguiente nivel" (`docs/PLAN-SIGUIENTE-NIVEL.md`).

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

> **Decisión:** el prototipo usa solo las prendas **01 a 05**. Las 06–10 quedan como ideas para después.

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

> Versión actualizada y con cuadros ya alineados: **sección 16**.

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

---

## 11. Lookbook (fotos con modelo)

Para la sección Lookbook: **5 fotos verticales 4:5** (ej. 1600×2000), una por prenda.
Sube la **foto de frente de la prenda** como referencia para que el estampado no cambie.
Todas comparten el mismo bloque de estilo, así parecen de la misma sesión.

Bloque de estilo del lookbook (pégalo al final de cada prompt):

```
Editorial streetwear lookbook photo, full body, model standing relaxed, plain seamless light warm-gray studio wall (#E7E6E1) with a matte concrete floor, soft diffused daylight from the left, gentle natural shadow on the wall, muted colors, subtle 35mm film grain, calm and minimal, the garment is the hero and fills a large part of the frame, sharp focus on the garment print. Vertical 4:5. No text, no logos other than the garment print, no watermark. Fictional model, not a real person.
```

| # | Archivo | Prompt (antes del bloque de estilo) |
|---|---|---|
| 01 | `look-01-camo.jpg` | `Using the attached garment as exact reference, a young man wearing this oversized camouflage overshirt open over a plain white t-shirt, loose stone-colored trousers, white sneakers, hands in pockets.` |
| 02 | `look-02-nomad.jpg` | `Using the attached garment as exact reference, a young woman wearing this oversized black t-shirt with the small white NOMAD wordmark, tucked loosely into wide light-gray trousers, black loafers, looking slightly away from the camera.` |
| 03 | `look-03-money.jpg` | `Using the attached garment as exact reference, a young man wearing this oversized white t-shirt with the green dollar bill print and "More Than Money" lettering, black baggy jeans, black sneakers, sitting on a simple wooden stool.` |
| 04 | `look-04-good-people.jpg` | `Using the attached garment as exact reference, a young woman wearing this oversized black t-shirt with cream "Good People Better Days" lettering, olive cargo pants, silver chain necklace, walking toward the camera mid-step.` |
| 05 | `look-05-habits.jpg` | `Using the attached garment as exact reference, a young man wearing this forest green crewneck sweatshirt with "CREATE GOOD HABITS" print, cream wide trousers, brown suede shoes, holding a coffee cup.` |

> Revisa que el estampado salga igual que en la foto de frente. Si cambia, pide de nuevo "keep the print exactly as in the reference".

---

## 12. Estudio / Nosotros

Para la sección Nosotros: **1 foto horizontal 3:2** (ej. 2400×1600).

```
Editorial interior photo of a small minimalist streetwear studio: a brushed-chrome clothing rod mounted on a light warm-gray wall (#E7E6E1) with a few oversized t-shirts and a camouflage overshirt on natural wooden hangers, a simple wooden worktable with folded t-shirts, a stack of screen-printing frames leaning on the wall, a small plant, soft daylight from a large window on the left, calm and tidy, muted colors, subtle 35mm film grain, no people, no text, no logos. Horizontal 3:2.
```

Opcional, una segunda foto vertical 4:5 de detalle para la misma sección:

```
Close-up editorial photo of hands folding an oversized black t-shirt on a wooden worktable in a minimalist studio, light warm-gray wall in the background, soft daylight from the left, muted colors, subtle 35mm film grain, no face visible, no text. Vertical 4:5.
```

---

## 13. Detalle de tela y estampado (para más adelante)

> Reemplazada por la **sección 17**, más completa.

Para una futura sección sobre la prenda: **3 fotos cuadradas 1:1**, con la foto de frente como referencia.

```
Using the attached garment as exact reference, macro close-up of [the print / the ribbed collar / the hem stitching] on this garment, heavyweight cotton texture clearly visible, soft studio light from the left, plain light warm-gray background, muted colors, sharp focus. Square 1:1. No text other than the existing print.
```

---

## 14. Entrega de las fotos nuevas

- [ ] `look-01-camo.jpg` … `look-05-habits.jpg` (4:5)
- [ ] `studio.jpg` (3:2) y, si quieres, `studio-detail.jpg` (4:5)
- [ ] Opcional: `detail-print.jpg`, `detail-collar.jpg`, `detail-hem.jpg` (1:1)

No hace falta quitarles el fondo: van como fotos completas. Mándamelas por aquí o súbelas a `assets/raw/`.

---

# Fotos y videos del plan "siguiente nivel"

Orden recomendado para generarlos (yo avanzo con el diseño mientras tanto):
**16.1 → 17 → 18 → 23 → 19 → 20 → 21 → 22.** La lista completa con nombres de archivo está en la sección 24.

---

## 15. Reglas para los videos (de imagen a video)

**Herramientas** (usa la que tengas):
- **Kling 3.0**: la recomendada para el giro. Acepta cuadro inicial y final, y tiene campo de "negative prompt".
- **Google Veo 3.1** (en Flow, opción "Frames to video"): muy buena con la tela y la luz.
- **Runway Gen-4.5** (keyframes inicial y final): controla bien la cámara.

**Ajustes:**
- Calidad máxima (1080p, modo "Professional" o "High quality").
- Duración: **5 s** para giros y clips; **8 a 10 s** para el video del estudio.
- Formato: **9:16 vertical** para los giros (los cuadros de `assets/para-video/` ya vienen así); 4:5 o 9:16 para el lookbook; 16:9 para el estudio. Si no existe el formato exacto, usa el más parecido y yo recorto.
- Sin música. Si la herramienta agrega audio no importa: yo lo quito.
- Cámara fija siempre.

**Negative prompt** (pégalo si la herramienta tiene ese campo):

```
camera movement, zoom, pan, tilt, dolly, cut, scene change, morphing, warped print, distorted text, flickering, extra sleeves, extra hanger, second garment, hands, people, text overlay, watermark, logo, blur
```

**Antes de mandármelo, revisa:**
- [ ] El estampado no se deforma ni cambia de letras.
- [ ] El gancho se queda fijo arriba al centro.
- [ ] El color de la prenda y del fondo no cambia.
- [ ] No hay cortes ni saltos; el movimiento es parejo.

**Entrega:** el MP4 **original**, descargado de la herramienta. No lo reenvíes por WhatsApp porque lo comprime. Usa el nombre de archivo que indica cada prompt.

---

## 16. Giro real de cada prenda (video)

**Para qué:** que el giro del perchero pase por ángulos reales y que en la ficha se pueda arrastrar para girar (plan, T4.1 y T3.2).

**Ya preparado:** en `assets/para-video/<prenda>/` están `frente.jpg` y `lado.jpg`, sobre el mismo fondo y con el gancho exactamente en el mismo punto. Úsalos tal cual, sin recortarlos ni cambiarles el tamaño.

### 16.1 Frente → lado izquierdo (empieza solo con la 03)

1. Cuadro inicial: `assets/para-video/03-white-tee-dollar/frente.jpg`
2. Cuadro final: `assets/para-video/03-white-tee-dollar/lado.jpg`
3. Prompt:

```
The white heavyweight t-shirt with the green dollar-bill print and black script lettering hangs on a natural wooden hanger with a curved chrome hook and slowly rotates on the hook, turning smoothly from facing the camera to an edge-on side view. One continuous, steady rotation of about 80 degrees at a constant speed, as if gently turned by an unseen hand. The hook stays fixed at the top center; the garment keeps its exact shape, fabric, color and print; the fabric sways only slightly. Static locked-off camera, no zoom, no pan. Plain seamless light warm-gray studio background (#E7E6E1), soft diffused light from the front-left, subtle soft shadow. Photorealistic product video.
```

4. Archivo: `giro-03-izquierda.mp4`

Cuando apruebes cómo queda la 03, se hacen las demás con el mismo prompt, cambiando la descripción del inicio y los cuadros de su carpeta:

| # | Carpeta | Cambia "The white heavyweight t-shirt … lettering" por | Archivo |
|---|---|---|---|
| 01 | `01-camo-overshirt` | `The oversized camouflage overshirt in muted brown and taupe` | `giro-01-izquierda.mp4` |
| 02 | `02-black-tee-minimal` | `The black heavyweight t-shirt with a small white NOMAD wordmark on the chest` | `giro-02-izquierda.mp4` |
| 04 | `04-black-tee-script` | `The black heavyweight t-shirt with cream serif lettering stacked down the front` | `giro-04-izquierda.mp4` |
| 05 | `05-green-crewneck` | `The forest green crewneck sweatshirt with a cream text print and a small globe emblem` | `giro-05-izquierda.mp4` |

### 16.2 Lado derecho (opcional, para girar hacia los dos lados)

No se puede reflejar el lado izquierdo: el pedazo de estampado que se alcanza a ver quedaría al revés. Se hace en dos pasos.

**Paso 1, imagen** (sube `frente.jpg` como referencia):

```
Using the attached image as the exact reference, show the SAME garment on the SAME hanger, rotated about 80 degrees on the hook toward its RIGHT side, so it is seen almost edge-on from the right: we mainly see the right side seam, the right sleeve hanging toward the camera and only a thin sliver of the front print at the right edge. Keep identical fabric, color, print, hanger, lighting, background, camera position, framing and scale; the hook stays at exactly the same position at the top center. Plain seamless light warm-gray background (#E7E6E1). Vertical 9:16, same size as the reference.
```

Archivo: `lado-derecho-03.jpg`

**Paso 2, video:** igual que 16.1, pero con `lado-derecho-03.jpg` como cuadro final. Archivo: `giro-03-derecha.mp4`.

### 16.3 Espalda (opcional)

1. Genera la espalda con el prompt de la sección 5, subiendo `frente.jpg` como referencia. Archivo: `espalda-03.jpg`.
2. Video: cuadro inicial `lado.jpg` y cuadro final `espalda-03.jpg`:

```
The same garment keeps rotating slowly on its hook, from the edge-on side view until its back faces the camera. One continuous, steady rotation at a constant speed; the hook stays fixed at the top center; identical fabric, color and hanger. Static locked-off camera, no zoom, no pan. Plain seamless light warm-gray studio background (#E7E6E1), soft diffused light from the front-left. Photorealistic product video.
```

Archivo: `giro-03-espalda.mp4`

---

## 17. Fotos "De cerca" (macro)

**Para qué:** la sección "De cerca" (plan, T3.4) y la vista "De cerca" de la ficha.
**Formato:** cuadrado 1:1, 2048×2048 (mínimo 1600). Sube siempre la foto de frente de la prenda como referencia (sirve `assets/para-video/<prenda>/frente.jpg`).

Bloque de estilo macro (pégalo al final de cada prompt de esta sección):

```
Extreme macro product photograph, 100mm macro lens, soft diffused studio light from the upper left with a gentle raking light that reveals the fabric texture, true-to-life colors, razor-sharp focus on the subject with a soft falloff at the edges, plain light warm-gray background (#E7E6E1) where visible, muted calm tones. Square 1:1. No text other than the existing print, no watermark.
```

### 17.1 Estampado de cada prenda (5 fotos)

Plantilla:

```
Using the attached garment as exact reference, an extreme macro close-up of [DETALLE] on this exact garment, filling most of the frame. Visible cotton texture and slightly raised matte screen-print ink with tiny natural imperfections; the fabric lies flat with one soft fold in a corner. [BLOQUE MACRO]
```

| # | [DETALLE] | Archivo |
|---|---|---|
| 01 | `the camouflage cotton twill weave and one brown button on the chest pocket` | `cerca-01-estampado.jpg` |
| 02 | `the small white printed NOMAD wordmark on the black chest` | `cerca-02-estampado.jpg` |
| 03 | `the green one-dollar bill print and the black script lettering "More Than Money"` | `cerca-03-estampado.jpg` |
| 04 | `the cream serif letters "Good People" on the black fabric` | `cerca-04-estampado.jpg` |
| 05 | `the cream "Create Good Habits" print and the small globe emblem on green brushed fleece` | `cerca-05-estampado.jpg` |

### 17.2 Cuello de la 03

```
Using the attached garment as exact reference, an extreme macro close-up of the ribbed crew-neck collar of this exact white t-shirt seen from slightly above: thick 1x1 rib knit, neat double-needle stitching and the inside neck tape. [BLOQUE MACRO]
```

Archivo: `cerca-03-cuello.jpg`

### 17.3 Grosor de la tela

```
Side view at eye level of a neat stack of three folded heavyweight cotton t-shirts (black, white, black) on a light wooden table, emphasizing the thickness and density of the fabric at the folded edges. [BLOQUE MACRO]
```

Archivo: `cerca-tela.jpg`

### 17.4 Dobladillo (opcional)

```
Using the attached garment as exact reference, an extreme macro close-up of the bottom hem of this exact white t-shirt: even double-needle stitching, the hem slightly folded back to show the fabric thickness. [BLOQUE MACRO]
```

Archivo: `cerca-03-dobladillo.jpg`

### 17.5 Etiqueta del cuello (opcional)

```
Using the attached garment as exact reference, an extreme macro close-up of a small woven neck label sewn inside the collar of this exact white t-shirt: an off-white label with the word "NOMAD" woven in navy blue script lettering. [BLOQUE MACRO]
```

Archivo: `cerca-03-etiqueta.jpg`. Si la palabra sale mal, pide la etiqueta **sin texto** y yo le pongo el logo.

---

## 18. Looks 02 y 04 con modelo (reemplazan las fotos en gancho)

**Para qué:** que los 5 looks del lookbook sean de la misma sesión.
**Sube 2 imágenes:** 1) la foto de frente de la prenda; 2) `look-01-camo` (en `assets/raw/fotos/`) solo como referencia de estilo, luz y fondo.

Look 02:

```
Use image 1 as the exact garment reference and image 2 only as the reference for style, set, lighting and color grading. Editorial streetwear lookbook photo, full body: a young woman with shoulder-length dark hair wearing this exact oversized black t-shirt with the small white NOMAD wordmark on the chest, loosely tucked into wide light-gray pleated trousers, black leather loafers, standing relaxed with one hand in her pocket, looking slightly away from the camera. Same plain light warm-gray studio wall and matte concrete floor as image 2, soft diffused daylight from the left, gentle natural shadow on the wall, muted colors, subtle 35mm film grain. The print must stay exactly as in image 1: same size, position and lettering. Vertical 4:5 (1600×2000). Fictional model, not a real person. No text other than the garment print, no watermark.
```

Archivo: `look-02-nomad.jpg`

Look 04:

```
Use image 1 as the exact garment reference and image 2 only as the reference for style, set, lighting and color grading. Editorial streetwear lookbook photo, full body: a young woman with curly hair tied back wearing this exact oversized black t-shirt with the cream serif lettering "Good People Better Days" stacked down the front, olive cargo pants, white sneakers and a thin silver chain necklace, caught mid-step walking toward the camera. Same plain light warm-gray studio wall and matte concrete floor as image 2, soft diffused daylight from the left, gentle natural shadow on the wall, muted colors, subtle 35mm film grain. The print must stay exactly as in image 1: same size, position and lettering. Vertical 4:5 (1600×2000). Fictional model, not a real person. No text other than the garment print, no watermark.
```

Archivo: `look-04-good-people.jpg`

> Si el estampado cambia, vuelve a pedir agregando: "keep the print exactly as in image 1".

---

## 19. Clips del lookbook (video en loop)

**Para qué:** que las fotos del lookbook tengan un movimiento muy sutil (plan, T4.2).
**Cuadro inicial y cuadro final: la misma foto del look.** Así el clip empieza y termina igual y se repite sin corte. Duración: 5 s.

Bloque final (pégalo después de la acción de cada look):

```
Very subtle natural movement only, gentle fabric motion and breathing. Static locked-off camera, no zoom, no pan, same lighting, same background, same framing. The last frame matches the first frame for a seamless loop.
```

| Look | Acción (va antes del bloque) | Archivo |
|---|---|---|
| 01 | `The model stands relaxed, shifts his weight slightly, lightly adjusts the open camouflage overshirt at the chest with one hand and returns to the same pose.` | `clip-look-01.mp4` |
| 02 | `The model slowly turns her head toward the camera and back, with a small natural movement of the hand in her pocket.` | `clip-look-02.mp4` |
| 03 | `Sitting on the stool, the model leans back slightly, rests his hands on his knees, then returns to the same pose.` | `clip-look-03.mp4` |
| 04 | `The model shifts her weight from one foot to the other and lightly touches her necklace, then returns to the same pose.` | `clip-look-04.mp4` |
| 05 | `The model lifts the coffee cup slightly as if about to drink, smiles softly and lowers it back to the same pose.` | `clip-look-05.mp4` |

Los looks 02 y 04 se hacen después de tener sus fotos con modelo (sección 18).

---

## 20. Video del estudio (Nosotros)

### 20.1 Recorrido por el perchero

Cuadro inicial: la foto del estudio (`assets/raw/fotos/studio.webp`; si la herramienta no acepta WebP, conviértela a JPG). Formato 16:9, de 8 a 10 s.

```
Very slow, smooth lateral camera dolly from left to right along the clothing rail in this exact studio. The garments on the wooden hangers sway very gently as if moved by a soft breeze from the open window, a few dust particles float in the sunbeam, the light stays soft and natural. No people. Calm, cinematic, 24 fps. Keep every object identical to the reference image, no new objects.
```

Archivo: `video-estudio.mp4`

### 20.2 Manos doblando (opcional)

```
Close-up of hands folding an oversized black t-shirt on a light wooden worktable in a minimalist studio, light warm-gray wall in the background, soft daylight from the left, slow calm movements, muted colors, subtle 35mm film grain, no face visible, no text, static camera. Vertical 4:5.
```

Archivo: `video-doblando.mp4`

---

## 21. Cómo se hace (4 fotos + 1 clip opcional)

**Para qué:** la sección "Del boceto al perchero" (plan, T4.4). Formato vertical 4:5 (1600×2000).

Bloque de estilo del proceso:

```
Editorial documentary photo in a small minimalist screen-printing studio, light warm-gray walls (#E7E6E1), soft daylight from a large window on the left, calm and tidy, muted colors, subtle 35mm film grain, no faces visible, no text other than the design, no logos, no watermark. Vertical 4:5 (1600×2000).
```

| Paso | Prompt (antes del bloque) | Archivo |
|---|---|---|
| 1. Boceto | `Top-down view of a hand-drawn pencil and ink sketch of a t-shirt graphic, a banknote outline with the words "More Than Money" in script, on off-white paper, with a pencil, an eraser and three color swatches (green, black, cream) on a light wooden table.` | `proceso-1-boceto.jpg` |
| 2. Malla | `A screen-printing frame (aluminum frame with fine yellow mesh) showing the exposed stencil of a banknote graphic, leaning against the wall on a worktable, light passing through the mesh.` | `proceso-2-malla.jpg` |
| 3. Estampado | `Close-up of gloved hands pulling a squeegee across a screen on a manual printing press, printing green ink onto a white t-shirt; the ink texture is visible.` | `proceso-3-estampado.jpg` |
| 4. Al perchero | `Freshly printed white t-shirts on natural wooden hangers on a brushed-chrome rail mounted on the wall; the one in front shows the green banknote print.` | `proceso-4-perchero.jpg` |

Clip opcional (cuadro inicial: `proceso-3-estampado.jpg`):

```
The squeegee is pulled slowly across the screen in one smooth stroke and then lifted. Static locked-off camera, no zoom, same lighting and framing.
```

Archivo: `clip-estampado.mp4`

---

## 22. Así se usa (6 fotos en la calle)

**Para qué:** la sección "En la calle" (plan, T4.5). En la página dirán **"Fotos de muestra"** hasta tener fotos reales de clientes.
**Formato:** cuadrado 1:1 (2048×2048). Sube la foto de frente de la prenda en cada una.

Bloque de estilo:

```
Candid street-style editorial photo shot on a 35mm film camera, natural daylight, a Mexico City neighborhood with trees and colorful façades (Roma or Condesa style), muted colors, subtle film grain, relaxed and real, fictional people, no readable signs, no brand logos other than the garment print, no watermark. Square 1:1 (2048×2048).
```

| # | Prompt (antes del bloque) | Archivo |
|---|---|---|
| 1 | `A young man wearing this exact camouflage overshirt open over a white tee, crossing a tree-lined street.` | `calle-1.jpg` |
| 2 | `A young woman wearing this exact black NOMAD tee, sitting at a small sidewalk café table with a coffee.` | `calle-2.jpg` |
| 3 | `Two friends laughing on a rooftop at golden hour; one of them wears this exact white "More Than Money" tee.` | `calle-3.jpg` |
| 4 | `A young woman wearing this exact black "Good People Better Days" tee riding a bicycle through a park.` | `calle-4.jpg` |
| 5 | `A young man wearing this exact green "Create Good Habits" crewneck waiting at a bus stop in the morning.` | `calle-5.jpg` |
| 6 | `Close-up of a torso wearing this exact white dollar-print tee, hands holding a skateboard.` | `calle-6.jpg` |

---

## 23. Prenda tapada para el Drop 02

**Para qué:** cuelga junto a la etiqueta del drop, en el mismo tubo (plan, T3.5). Va con el **bloque de estilo de la sección 1**, así queda igual que las demás prendas y se le puede quitar el fondo.

```
A single oversized t-shirt completely covered by a translucent frosted-white garment bag, hanging on a natural light-wood clothes hanger with a curved chrome hook; the garment inside shows only as a soft dark silhouette. A small kraft-paper tag hangs from the hanger neck on a thin cotton string with the handwritten text "Drop 02". [BLOQUE DE ESTILO]
```

Archivo: `drop-02.png` (vertical 3:4).

- Si la palabra sale mal, pide la etiqueta **sin texto** y yo la escribo.
- Variante para dar una pista del color: agrega `The garment bag is slightly open at the bottom, revealing only the hem of a [COLOR] t-shirt.`

---

## 24. Entrega (lista completa)

| Prioridad | Archivos | Sección |
|---|---|---|
| 1 | `giro-03-izquierda.mp4` | 16.1 |
| 2 | `cerca-01-estampado.jpg` … `cerca-05-estampado.jpg`, `cerca-03-cuello.jpg`, `cerca-tela.jpg` | 17 |
| 3 | `look-02-nomad.jpg`, `look-04-good-people.jpg` | 18 |
| 4 | `drop-02.png` | 23 |
| 5 | `clip-look-01.mp4` … `clip-look-05.mp4`, `video-estudio.mp4` | 19, 20 |
| 6 | `proceso-1-boceto.jpg` … `proceso-4-perchero.jpg`, `calle-1.jpg` … `calle-6.jpg` | 21, 22 |
| Después de aprobar el 1 | `giro-01-izquierda.mp4`, `giro-02-…`, `giro-04-…`, `giro-05-…` | 16.1 |
| Opcional | `lado-derecho-NN.jpg` y `giro-NN-derecha.mp4`, `espalda-NN.jpg`, `cerca-03-dobladillo.jpg`, `cerca-03-etiqueta.jpg`, `video-doblando.mp4`, `clip-estampado.mp4` | 16.2, 16.3, 17, 20, 21 |

Mándamelos por aquí o súbelos a `assets/raw/` (los videos en `assets/raw/video/`). Yo me encargo de quitar fondos, alinear al gancho, comprimir y montarlos en la página.

**Mientras no llegan, la página ya los espera con muestras** (marcadas "Foto de muestra"):

- **Fotos** `cerca-…`, `drop-02`, `proceso-…` y `calle-…`: déjalas en `assets/raw/fotos-nuevas/` con el nombre de la tabla y corre
  `python tools/fotos_web.py && python tools/catalogo_web.py`. Se recortan al tamaño de la página, van a `web/fotos/` y reemplazan solas a la muestra.
- `drop-02.png` necesita el fondo quitado para colgar del tubo. Si llega con fondo, se lo quito yo al integrarla.
