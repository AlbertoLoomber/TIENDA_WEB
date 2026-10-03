"""Prepara las fotos nuevas para la página (fases 3 y 4).

Dos trabajos:

1. **Fotos reales.** Todo lo que pongas en `assets/raw/fotos-nuevas/` (JPG, PNG o
   WebP, con el nombre de `docs/PROMPTS.md` §24) se recorta al tamaño que usa la
   página y se guarda en `web/fotos/<nombre>.webp`.
2. **Muestras.** Mientras una foto no exista, se arma una muestra en
   `web/fotos/muestra/` a partir de las fotos de las prendas (un acercamiento del
   estampado, del cuello o de la tela). La página la marca como "Foto de muestra".

`tools/catalogo_web.py` elige sola: si existe `web/fotos/<nombre>.webp` usa esa;
si no, la muestra. Para cambiar una muestra por la foto real basta con dejar la
foto en `assets/raw/fotos-nuevas/` y volver a correr este script y catalogo_web.py.

Uso:  python tools/fotos_web.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw" / "fotos-nuevas"
OUT = ROOT / "web" / "fotos"
SAMPLE = OUT / "muestra"
PAPER = (231, 230, 225)

# Tamaño final por prefijo de archivo: (ancho, alto). Cuadradas para los círculos
# de "De cerca"; 3:4 para la prenda tapada, el proceso y la calle.
SIZES = {
    "cerca-": (600, 600),
    "drop-": (750, 1000),
    "proceso-": (1000, 1250),
    "calle-": (1000, 1250),
}
SAMPLE_SIZE = (800, 1000)   # las muestras de proceso y calle, 4:5

# Muestras: (prenda, centro x, centro y, lado del recorte) en el lienzo de 1000×1300.
SAMPLES = {
    "cerca-01-estampado": ("01-camo-overshirt", 590, 590, 300),
    "cerca-02-estampado": ("02-black-tee-minimal", 500, 492, 190),
    "cerca-03-estampado": ("03-white-tee-dollar", 500, 600, 400),
    "cerca-04-estampado": ("04-black-tee-script", 500, 560, 420),
    "cerca-05-estampado": ("05-green-crewneck", 500, 640, 440),
    "cerca-03-cuello": ("03-white-tee-dollar", 548, 296, 190),
    "cerca-tela": ("03-white-tee-dollar", 540, 980, 200),
}


# Muestras de "Cómo se hace" y "Así se usa": (cómo se arma, de dónde sale).
PROCESS = {
    "proceso-1-boceto": ("boceto", "03-white-tee-dollar"),
    "proceso-2-malla": ("malla", "03-white-tee-dollar"),
    "proceso-3-estampado": ("estampado", "03-white-tee-dollar"),
    "proceso-4-perchero": ("perchero", "03-white-tee-dollar"),
}
STREET = {
    "calle-1": ("foto", "look-01-camo.webp", 0.5, 0.42, 1.0),
    "calle-2": ("prenda", "02-black-tee-minimal", "#cdd0d4"),
    "calle-3": ("foto", "look-03-money.webp", 0.5, 0.4, 1.0),
    "calle-4": ("prenda", "04-black-tee-script", "#c4b5a3"),
    "calle-5": ("foto", "look-05-habits.webp", 0.5, 0.42, 1.0),
    "calle-6": ("foto", "look-03-money.webp", 0.5, 0.5, 0.62),
}


def cover(im, size):
    """Recorta al centro para llenar `size` sin deformar."""
    w, h = size
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((left, top, left + w, top + h))


def size_for(name):
    return next((s for p, s in SIZES.items() if name.startswith(p)), None)


def convert_real():
    done = []
    for src in sorted(RAW.glob("*")) if RAW.exists() else []:
        if src.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        size = size_for(src.stem)
        if not size:
            print(f"  ¿{src.name}? no sé de qué sección es; revisa el nombre (PROMPTS.md §24)")
            continue
        im = Image.open(src)
        if im.mode in ("RGBA", "LA") and src.stem.startswith("drop-"):
            # La prenda tapada llega recortada: se queda transparente.
            out = cover(im.convert("RGBA"), size)
        else:
            out = cover(im.convert("RGB"), size)
        OUT.mkdir(parents=True, exist_ok=True)
        out.save(OUT / f"{src.stem}.webp", quality=82, method=6)
        done.append(src.stem)
    return done


def make_samples(skip):
    SAMPLE.mkdir(parents=True, exist_ok=True)
    made = []
    for name, (item, cx, cy, side) in SAMPLES.items():
        if name in skip or (OUT / f"{name}.webp").exists():
            continue
        im = Image.open(ROOT / "web" / "prendas" / item / "0.webp").convert("RGBA")
        bg = Image.new("RGBA", im.size, PAPER + (255,))
        bg.alpha_composite(im)
        half = side // 2
        crop = bg.crop((cx - half, cy - half, cx + half, cy + half)).convert("RGB")
        cover(crop, SIZES["cerca-"]).save(SAMPLE / f"{name}.webp", quality=80, method=6)
        made.append(name)
    return made


def garment(item):
    return Image.open(ROOT / "web" / "prendas" / item / "0.webp").convert("RGBA")


def on_ground(fg, color, size, scale=0.92, top=0.04):
    """La prenda colgada, centrada sobre un color liso, con su sombra."""
    from PIL import ImageFilter
    w, h = size
    bg = Image.new("RGBA", size, color)
    gh = round(h * scale)
    g = fg.resize((round(gh * fg.width / fg.height), gh), Image.LANCZOS)
    x, y = (w - g.width) // 2, round(h * top)
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    a = g.split()[-1].point(lambda v: v * 0.18)
    shadow.paste((20, 22, 32, 255), (x + 12, y + 20), a)
    bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    bg.alpha_composite(g, (x, y))
    return bg.convert("RGB")


def process_sample(kind, item):
    import numpy as np
    from PIL import ImageFilter, ImageOps
    size = SAMPLE_SIZE
    paper = Image.new("RGB", size, (236, 233, 224))
    if kind == "boceto":
        # Efecto de lápiz: gris, invertido, difuminado y "sobreexpuesto".
        base = on_ground(garment(item), (236, 233, 224), size, 0.86, 0.07).convert("L")
        inv = ImageOps.invert(base).filter(ImageFilter.GaussianBlur(10))
        a, b = np.asarray(base, np.float32), np.asarray(inv, np.float32)
        dodge = np.clip(a * 255 / np.maximum(255 - b, 1), 0, 255)
        sketch = Image.fromarray(dodge.astype("uint8")).filter(ImageFilter.SMOOTH)
        sketch = ImageOps.grayscale(sketch.convert("RGB")).point(lambda v: 255 * (v / 255) ** 4)   # trazo más marcado
        tint = Image.merge("RGB", [sketch.point(lambda v: v * 0.98), sketch.point(lambda v: v * 0.97), sketch.point(lambda v: v * 0.93)])
        return tint
    print_crop = Image.open(SAMPLE / "cerca-03-estampado.webp").convert("RGB")
    if kind == "estampado":
        return cover(print_crop, size)
    if kind == "malla":
        # El estampado visto a través de una malla amarilla, dentro de un marco de aluminio.
        img = ImageOps.grayscale(cover(print_crop, size)).convert("RGB")
        img = Image.blend(img, Image.new("RGB", size, (232, 214, 120)), 0.45)
        arr = np.asarray(img).copy()
        arr[::4, :] = (arr[::4, :] * 0.86).astype("uint8")
        arr[:, ::4] = (arr[:, ::4] * 0.86).astype("uint8")
        img = Image.fromarray(arr)
        frame = Image.new("RGB", size, (168, 170, 172))
        inner = img.resize((size[0] - 96, size[1] - 96), Image.LANCZOS)
        frame.paste(inner, (48, 48))
        return frame
    if kind == "perchero":
        return on_ground(garment(item), (226, 224, 218), size, 0.9, 0.06)
    return paper


def street_sample(spec):
    if spec[0] == "prenda":
        _, item, color = spec
        return on_ground(garment(item), color, SAMPLE_SIZE, 0.9, 0.05)
    _, photo, cx, cy, zoom = spec
    im = Image.open(OUT / photo).convert("RGB")
    w, h = SAMPLE_SIZE
    cw = round(im.width * zoom)
    ch = round(cw * h / w)
    left = min(max(0, round(im.width * cx - cw / 2)), im.width - cw)
    top = min(max(0, round(im.height * cy - ch / 2)), im.height - ch)
    return im.crop((left, top, left + cw, top + ch)).resize(SAMPLE_SIZE, Image.LANCZOS)


def make_scene_samples(skip):
    made = []
    for name, (kind, item) in PROCESS.items():
        if name in skip or (OUT / f"{name}.webp").exists():
            continue
        process_sample(kind, item).save(SAMPLE / f"{name}.webp", quality=78, method=6)
        made.append(name)
    for name, spec in STREET.items():
        if name in skip or (OUT / f"{name}.webp").exists():
            continue
        street_sample(spec).save(SAMPLE / f"{name}.webp", quality=78, method=6)
        made.append(name)
    return made


def main():
    real = convert_real()
    made = make_samples(set(real))
    made += make_scene_samples(set(real))
    print(f"fotos reales: {len(real)}" + (f" ({', '.join(real)})" if real else ""))
    print(f"muestras: {len(made)}" + (f" ({', '.join(made)})" if made else ""))


if __name__ == "__main__":
    main()
