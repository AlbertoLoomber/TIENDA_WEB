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
    "proceso-": (900, 1200),
    "calle-": (900, 1200),
}

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


def main():
    real = convert_real()
    made = make_samples(set(real))
    print(f"fotos reales: {len(real)}" + (f" ({', '.join(real)})" if real else ""))
    print(f"muestras: {len(made)}" + (f" ({', '.join(made)})" if made else ""))


if __name__ == "__main__":
    main()
