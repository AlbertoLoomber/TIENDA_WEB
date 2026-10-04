"""Convierte las fotos aprobadas en recortes alineados para la web.

Para cada prenda de catalogo.json toma los ángulos disponibles
(perfil 80° → 60° → 45° → 25° → frente 0°), quita el fondo, escala todas las
vistas a la misma altura y las coloca en un lienzo común con la
punta del gancho siempre en el mismo punto. Así la web puede cambiar de cuadro
sin que la prenda "brinque".

Salida:
  web/prendas/<id>/<angulo>.webp   (lienzo común con el gancho alineado)
  web/prendas.json                 (datos que consume la página)

Uso:  python tools/procesar_assets.py          (todas)
      python tools/procesar_assets.py ID …     (solo esas; las demás no se tocan)
Requiere: pip install "rembg[cpu]" pillow numpy
"""
from pathlib import Path
import json

import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
OUT_IMG = ROOT / "web" / "prendas"
OUT_JSON = ROOT / "web" / "prendas.json"

# Lienzo común: el gancho queda arriba al centro y la prenda mide GARMENT_H.
CANVAS_W, CANVAS_H = 1000, 1300
HOOK_X, HOOK_Y = CANVAS_W // 2, 30
GARMENT_H = 1230

ANGLES = [80, 60, 45, 25, 0]


def source_for(item_id, angle):
    if angle == 80:
        path = ROOT / "assets/raw" / f"{item_id}-side.png"
    elif angle == 0:
        path = ROOT / "assets/raw" / f"{item_id}-front.png"
    else:
        path = ROOT / "assets/aprobadas" / f"{item_id}-{angle}.png"
    return path if path.exists() else None


def cutout(path, session):
    rgba = remove(Image.open(path).convert("RGB"), session=session)
    arr = np.array(rgba)
    alpha = arr[:, :, 3].astype(np.float32)
    # Limpia el halo casi transparente que deja el modelo.
    alpha[alpha < 12] = 0
    arr[:, :, 3] = alpha.astype(np.uint8)
    return arr


def hook_anchor(alpha):
    """Devuelve (x de la punta del gancho, y superior, y inferior) del recorte."""
    ys, xs = np.where(alpha > 128)
    top, bottom = ys.min(), ys.max()
    band = ys < top + max(6, int((bottom - top) * 0.015))
    return float(xs[band].mean()), int(top), int(bottom)


def place(arr, scale):
    alpha = arr[:, :, 3]
    hx, top, _ = hook_anchor(alpha)
    img = Image.fromarray(arr)
    w, h = img.size
    img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.alpha_composite(img, (round(HOOK_X - hx * scale), round(HOOK_Y - top * scale)))
    return canvas


def match_color(canvas, ref):
    """Iguala el color de una vista intermedia al de la vista de frente.

    Los ángulos intermedios se generan aparte y suelen salir con otro tono;
    sin esto el giro "cambia de color" al llegar al frente. Se transfieren
    media y desviación en espacio LAB, midiendo solo la tela (debajo del
    gancho) y sin tocar el gancho.
    """
    import cv2

    def lab_stats(arr):
        lab = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2LAB).astype(np.float32)
        m = arr[:, :, 3] > 200
        m[: int(0.22 * CANVAS_H)] = False
        return lab, lab[m].mean(0), lab[m].std(0) + 1e-3

    arr = np.array(canvas)
    lab, mean, std = lab_stats(arr)
    _, ref_mean, ref_std = lab_stats(np.array(ref))
    graded = (lab - mean) / std * ref_std + ref_mean
    ramp = np.clip((np.arange(CANVAS_H) / CANVAS_H - 0.15) / 0.07, 0, 1)[:, None, None]
    lab = lab * (1 - ramp) + graded * ramp
    arr[:, :, :3] = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return Image.fromarray(arr)


def extent(canvas):
    """Ancho visible de la prenda, medido desde el gancho, en fracción del lienzo."""
    a = np.array(canvas)[:, :, 3]
    xs = np.where(a.max(axis=0) > 128)[0]
    return round((xs.min()) / CANVAS_W, 4), round((xs.max() + 1) / CANVAS_W, 4)


def main():
    import sys
    # Uso: python tools/procesar_assets.py [ID …]  (solo esas prendas; las demás se quedan como están)
    only = set(sys.argv[1:])
    catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf8"))
    session = new_session("isnet-general-use")
    previous = {}
    if only and OUT_JSON.exists():
        previous = {it["id"]: it for it in json.loads(OUT_JSON.read_text(encoding="utf8"))["items"]}
    items = []
    for item in catalog["items"]:
        if not item.get("tienda", {}).get("en_tienda", True):
            continue   # retirada de la tienda (ver catalogo_web.py)
        if only and item["id"] not in only:
            if item["id"] in previous:
                items.append(previous[item["id"]])
            continue
        item_id = item["id"]
        sources = [(a, source_for(item_id, a)) for a in ANGLES]
        sources = [(a, p) for a, p in sources if p]
        cutouts = {a: cutout(p, session) for a, p in sources}

        out_dir = OUT_IMG / item_id
        out_dir.mkdir(parents=True, exist_ok=True)
        # Todas las vistas se escalan a la misma altura (gancho → dobladillo).
        # Una prenda más corta o cuadrada lleva "escala" en catalogo.json para
        # quedar en proporción con las demás en vez de estirarse a esa altura.
        height = GARMENT_H * item.get("escala", 1)

        def placed(arr):
            _, t, b = hook_anchor(arr[:, :, 3])
            return place(arr, height / (b - t))

        front = placed(cutouts[0])
        frames = []
        for angle, arr in cutouts.items():
            canvas = front if angle == 0 else placed(arr)
            if angle not in (0, 80):
                canvas = match_color(canvas, front)
            canvas.save(out_dir / f"{angle}.webp", "WEBP", quality=86, method=6)
            left, right = extent(canvas)
            frames.append({"angle": angle, "src": f"prendas/{item_id}/{angle}.webp", "left": left, "right": right})
            print(item_id, angle, "ok", left, right)

        entry = {
            "id": item_id,
            "name": item.get("nombre", item_id),
            "category": item.get("categoria", ""),
            "frames": frames,
        }
        # Espalda (opcional): misma altura y gancho que el frente, para la vista "Espalda".
        back_src = ROOT / "assets/raw" / f"{item_id}-back.png"
        if back_src.exists():
            back = placed(cutout(back_src, session))
            back.save(out_dir / "back.webp", "WEBP", quality=86, method=6)
            entry["back"] = f"prendas/{item_id}/back.webp"
            print(item_id, "espalda ok")
        items.append(entry)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps({"canvas": [CANVAS_W, CANVAS_H], "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("escrito", OUT_JSON.relative_to(ROOT))

    # Precios, textos y fotos puestas vienen de catalogo.json: vuelve a aplicarlos.
    import runpy
    runpy.run_path(str(ROOT / "tools" / "catalogo_web.py"), run_name="__main__")


if __name__ == "__main__":
    main()
