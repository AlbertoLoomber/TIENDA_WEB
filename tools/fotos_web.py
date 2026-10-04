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
# de la vista "De cerca" de la ficha; 3:4 para la prenda tapada; 4:5 para la calle.
SIZES = {
    "cerca-": (960, 1200),       # vista "De cerca" de la ficha, 4:5
    "drop-": (750, 1000),
    "calle-": (800, 1000),      # se muestran a ~370 px (740 en pantallas retina)
}
SAMPLE_SIZE = (800, 1000)   # las muestras de la calle, 4:5

# Muestras: (prenda, centro x, centro y, lado del recorte) en el lienzo de 1000×1300.
SAMPLES = {
    "cerca-01-estampado": ("01-camo-overshirt", 590, 590, 300),
    "cerca-02-estampado": ("02-black-tee-minimal", 500, 492, 190),
    "cerca-03-estampado": ("03-white-tee-dollar", 500, 600, 400),
    "cerca-04-estampado": ("04-black-tee-script", 500, 560, 420),
    "cerca-05-estampado": ("05-green-crewneck", 500, 640, 440),
    "cerca-06-bordado": ("06-cream-tee-nomad", 636, 522, 190),
}


# Muestras de "Así se usa": (cómo se arma, de dónde sale).
STREET = {
    "calle-1": ("foto", "look-01-camo.webp", 0.5, 0.42, 1.0),
    "calle-2": ("prenda", "02-black-tee-minimal", "#cdd0d4"),
    "calle-3": ("foto", "look-03-money.webp", 0.5, 0.4, 1.0),
    "calle-4": ("prenda", "04-black-tee-script", "#c4b5a3"),
    "calle-5": ("foto", "look-05-habits.webp", 0.5, 0.42, 1.0),
    "calle-6": ("prenda", "06-cream-tee-nomad", "#d9d3c4"),
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


def hang(im, size, hook_y=0.029, height=0.92):
    """Quita el fondo (rembg) si hace falta y coloca la prenda con la punta del
    gancho arriba al centro (hook_y del alto), ocupando `height` del lienzo."""
    import numpy as np
    if im.mode not in ("RGBA", "LA"):
        from rembg import new_session, remove
        im = remove(im.convert("RGB"), session=new_session("isnet-general-use"))
    arr = np.array(im.convert("RGBA"))
    a = arr[:, :, 3]
    a[a < 12] = 0
    ys, xs = np.where(a > 128)
    top, bottom = ys.min(), ys.max()
    hook_x = xs[ys < top + max(6, int((bottom - top) * 0.015))].mean()
    w, h = size
    scale = h * height / (bottom - top)
    img = Image.fromarray(arr).resize((round(arr.shape[1] * scale), round(arr.shape[0] * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(img, (round(w / 2 - hook_x * scale), round(h * hook_y - top * scale)))
    return canvas


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
        if src.stem.startswith("drop-"):
            # La prenda tapada cuelga del tubo como las demás: sin fondo y con
            # el gancho en el mismo punto que los recortes del perchero.
            out = hang(im, size)
        else:
            out = cover(im.convert("RGB"), size)
        OUT.mkdir(parents=True, exist_ok=True)
        out.save(OUT / f"{src.stem}.webp", quality=78 if src.stem.startswith("calle-") else 82, method=6)
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
