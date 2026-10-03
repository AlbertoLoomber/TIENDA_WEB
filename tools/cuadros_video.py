"""Convierte el video del giro de una prenda en los cuadros que usa la página (T4.1).

El video se genera con los cuadros de `assets/para-video/<prenda>/` (frente y
lado, lienzo de 1000×1300 en (40, 300) sobre 1080×1920; docs/PROMPTS.md §16).
Este script:

1. Lee el video y lo lleva a 1080×1920 si viene en otro tamaño vertical 9:16.
2. Revisa que la cámara no se movió: compara la zona del gancho con la del primer
   cuadro. Más de 3 px se corrige; más de 20 px, el video se rechaza.
3. Recorta el lienzo de la prenda (x 40–1040, y 300–1600).
4. Quita el fondo (rembg, isnet-general-use, como las fotos actuales) en hasta
   48 cuadros candidatos y mide el ancho de la prenda en cada uno.
5. Elige 12 cuadros en pasos iguales de ancho, no de tiempo, de perfil a frente:
   así un giro que no fue a velocidad constante se ve parejo.
6. Alinea el gancho en (500, 30) e iguala la altura con la foto de frente.
7. Iguala el color (LAB) con la foto de perfil al inicio y con la de frente al
   final, mezclando según el avance del giro: sin "imagen doble" ni saltos.
8. Usa las fotos actuales como primer y último cuadro, para que el perchero en
   reposo se vea igual que hoy y el giro empiece y termine sin brincos.
9. Exporta `web/prendas/<id>/giro/NN.webp` (1300 px, para la ficha) y
   `NN-700.webp` (700 px, para el perchero), una hoja de revisión en
   `assets/revision/` y actualiza `catalogo.json` (`tienda.giro`).

Uso:
  python tools/cuadros_video.py assets/raw/video/giro-03-izquierda.mp4
  python tools/cuadros_video.py VIDEO --prenda 03-white-tee-dollar --cuadros 12
  python tools/cuadros_video.py --prueba     # video sintético, salida en tools/pruebas/salida/

Después: python tools/catalogo_web.py
"""
from pathlib import Path
import argparse
import json
import re
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FRAME_W, FRAME_H = 1080, 1920
CANVAS_X, CANVAS_Y = 40, 300
CANVAS_W, CANVAS_H = 1000, 1300
HOOK_X, HOOK_Y = 500, 30
SMALL_H = 700
MAX_CANDIDATES = 48
LIMIT_FULL_KB, LIMIT_SMALL_KB = 70, 30


class Rechazo(Exception):
    """El video no sirve: el mensaje dice qué pedir de nuevo."""


# ---------- lectura y estabilidad ----------

def read_frames(path):
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise Rechazo(f"no se pudo abrir {path}")
    frames = []
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        h, w = bgr.shape[:2]
        if abs(w / h - FRAME_W / FRAME_H) > 0.01:
            raise Rechazo(f"el video mide {w}×{h}; debe ser vertical 9:16 (como los cuadros de assets/para-video)")
        if (w, h) != (FRAME_W, FRAME_H):
            bgr = cv2.resize(bgr, (FRAME_W, FRAME_H), interpolation=cv2.INTER_LANCZOS4)
        frames.append(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    cap.release()
    if len(frames) < 24:
        raise Rechazo(f"el video tiene {len(frames)} cuadros; se esperan unos 120 (5 s a 24 fps)")
    return frames


def stabilize(frames):
    """Corrige el desplazamiento de cámara midiendo la zona del gancho."""
    hx, hy = CANVAS_X + HOOK_X, CANVAS_Y + HOOK_Y
    tpl_box = (hx - 70, hy - 25, hx + 70, hy + 75)
    pad = 30
    gray = lambda f: cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)
    x0, y0, x1, y1 = tpl_box
    tpl = gray(frames[0])[y0:y1, x0:x1]
    out, shifts = [], []
    for f in frames:
        g = gray(f)[y0 - pad:y1 + pad, x0 - pad:x1 + pad]
        res = cv2.matchTemplate(g, tpl, cv2.TM_CCOEFF_NORMED)
        _, _, _, (mx, my) = cv2.minMaxLoc(res)
        dx, dy = mx - pad, my - pad
        shifts.append(max(abs(dx), abs(dy)))
        if max(abs(dx), abs(dy)) > 20:
            raise Rechazo(f"la cámara se movió {max(abs(dx), abs(dy))} px en el gancho; pide el video de nuevo con cámara fija")
        if max(abs(dx), abs(dy)) > 3:
            m = np.float32([[1, 0, -dx], [0, 1, -dy]])
            f = cv2.warpAffine(f, m, (FRAME_W, FRAME_H), borderMode=cv2.BORDER_REPLICATE)
        out.append(f)
    return out, max(shifts)


def crop(f):
    return f[CANVAS_Y:CANVAS_Y + CANVAS_H, CANVAS_X:CANVAS_X + CANVAS_W]


# ---------- fondo ----------

class Background:
    def __init__(self, flat=False):
        self.flat = flat
        self.session = None
        if not flat:
            from rembg import new_session
            self.session = new_session("isnet-general-use")

    def cutout(self, rgb):
        if self.flat:
            return flat_key(rgb)
        from rembg import remove
        rgba = np.array(remove(Image.fromarray(rgb), session=self.session))
        a = rgba[:, :, 3]
        a[a < 12] = 0
        return rgba


def flat_key(rgb):
    """Solo para el video de prueba: fondo de un color, tomado de las esquinas."""
    corners = np.concatenate([rgb[:20, :20].reshape(-1, 3), rgb[:20, -20:].reshape(-1, 3),
                              rgb[-20:, :20].reshape(-1, 3), rgb[-20:, -20:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    d = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    a = np.clip((d - 40) / 40, 0, 1)
    # Quita el tinte del fondo en los bordes semitransparentes.
    out = rgb.astype(np.float32)
    k = a[..., None]
    out = np.where(k > 0, (out - bg * (1 - k)) / np.maximum(k, 1e-3), out)
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), (a * 255).astype(np.uint8)])


# ---------- medidas ----------

def width_of(alpha):
    """Ancho visible de la prenda (sin el gancho), en px del lienzo."""
    body = alpha[int(0.22 * CANVAS_H):] > 128
    cols = np.where(body.any(axis=0))[0]
    if len(cols) < 2:
        return 0.0
    return float(cols[-1] - cols[0] + 1)


def hook_anchor(alpha):
    ys, xs = np.where(alpha > 128)
    top, bottom = ys.min(), ys.max()
    band = ys < top + max(6, int((bottom - top) * 0.015))
    return float(xs[band].mean()), int(top), int(bottom)


def extent(alpha):
    xs = np.where(alpha.max(axis=0) > 128)[0]
    return round(xs.min() / CANVAS_W, 4), round((xs.max() + 1) / CANVAS_W, 4)


def pick(widths, n):
    """Índices en pasos iguales de ancho, de perfil (angosto) a frente (ancho)."""
    w = np.convolve(widths, np.ones(3) / 3, mode="same")
    w[0], w[-1] = widths[0], widths[-1]
    targets = np.linspace(w[0], w[-1], n)
    chosen, start = [0], 0
    for t in targets[1:-1]:
        later = np.arange(start + 1, len(w) - 1)
        if not len(later):
            break
        k = later[np.argmin(np.abs(w[later] - t))]
        chosen.append(int(k))
        start = k
    chosen.append(len(w) - 1)
    # sin repetidos, en orden
    return sorted(set(chosen))


# ---------- alineación y color ----------

def place(rgba, target_height):
    hx, top, bottom = hook_anchor(rgba[:, :, 3])
    scale = target_height / max(1, bottom - top)
    img = Image.fromarray(rgba)
    img = img.resize((round(CANVAS_W * scale), round(CANVAS_H * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas.alpha_composite(img, (round(HOOK_X - hx * scale), round(HOOK_Y - top * scale)))
    return np.array(canvas)


def lab_stats(arr):
    lab = cv2.cvtColor(np.ascontiguousarray(arr[:, :, :3]), cv2.COLOR_RGB2LAB).astype(np.float32)
    m = arr[:, :, 3] > 200
    m[: int(0.22 * CANVAS_H)] = False
    if m.sum() < 100:
        return lab, np.zeros(3), np.ones(3)
    return lab, lab[m].mean(0), lab[m].std(0) + 1e-3


def match_color(arr, side, front, t):
    """Lleva media y desviación LAB de la tela hacia las fotos, según el avance t."""
    lab, mean, std = lab_stats(arr)
    _, sm, ss = lab_stats(side)
    _, fm, fs = lab_stats(front)
    ref_m, ref_s = sm * (1 - t) + fm * t, ss * (1 - t) + fs * t
    graded = (lab - mean) / std * ref_s + ref_m
    ramp = np.clip((np.arange(CANVAS_H) / CANVAS_H - 0.15) / 0.07, 0, 1)[:, None, None]   # el gancho no se toca
    lab = lab * (1 - ramp) + graded * ramp
    out = arr.copy()
    out[:, :, :3] = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return out


# ---------- salida ----------

def save_webp(arr, path, height, limit_kb):
    img = Image.fromarray(arr)
    if height != CANVAS_H:
        img = img.resize((round(CANVAS_W * height / CANVAS_H), height), Image.LANCZOS)
    for q in (82, 76, 70, 64, 58):
        img.save(path, "WEBP", quality=q, method=6)
        if path.stat().st_size <= limit_kb * 1024:
            break
    return path.stat().st_size / 1024


def contact_sheet(frames, path):
    th = 260
    tw = round(th * CANVAS_W / CANVAS_H)
    sheet = Image.new("RGB", (tw * len(frames), th + 24), (231, 230, 225))
    d = ImageDraw.Draw(sheet)
    for i, arr in enumerate(frames):
        img = Image.fromarray(arr).resize((tw, th), Image.LANCZOS)
        sheet.paste(img, (i * tw, 0), img)
        d.line([(i * tw + tw // 2, 0), (i * tw + tw // 2, 10)], fill=(200, 40, 40))   # dónde debe estar el gancho
        d.text((i * tw + 6, th + 6), f"{i:02d}", fill=(36, 44, 82))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, quality=88)


def update_catalog(item_id, video, frames_meta):
    path = ROOT / "catalogo.json"
    catalog = json.loads(path.read_text(encoding="utf8"))
    item = next(it for it in catalog["items"] if it["id"] == item_id)
    item.setdefault("tienda", {})["giro"] = {"video": Path(video).name, "cuadros": frames_meta}
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf8")


# ---------- todo junto ----------

def process(video, item_id, n=12, flat=False, out_dir=None, sheet=None, catalog=True, log=print):
    frames = read_frames(video)
    frames, moved = stabilize(frames)
    log(f"{len(frames)} cuadros; el gancho se movió hasta {moved} px" + (" (corregido)" if moved > 3 else ""))
    canvases = [crop(f) for f in frames]

    step = max(1, len(canvases) // MAX_CANDIDATES)
    idx = list(range(0, len(canvases), step))
    if idx[-1] != len(canvases) - 1:
        idx.append(len(canvases) - 1)
    bg = Background(flat)
    cut = {i: bg.cutout(canvases[i]) for i in idx}
    widths = np.array([width_of(cut[i][:, :, 3]) for i in idx])
    if widths[0] > widths[-1]:
        # El video va de frente a perfil (como pide PROMPTS 16.1): se invierte.
        idx, widths = idx[::-1], widths[::-1]
    if widths[-1] - widths[0] < 0.15 * widths[-1]:
        raise Rechazo("la prenda casi no cambia de ancho: el video no muestra el giro de frente a perfil")
    chosen = [idx[k] for k in pick(widths, n)]
    log(f"cuadros elegidos (de perfil a frente): {chosen}")

    web = ROOT / "web" / "prendas" / item_id
    side_photo = np.array(Image.open(web / "80.webp").convert("RGBA"))
    front_photo = np.array(Image.open(web / "0.webp").convert("RGBA"))
    _, ft, fb = hook_anchor(front_photo[:, :, 3])
    height = fb - ft

    out = []
    for k, i in enumerate(chosen):
        t = k / (len(chosen) - 1)
        if k == 0:
            arr = side_photo
        elif k == len(chosen) - 1:
            arr = front_photo
        else:
            arr = match_color(place(cut[i], height), side_photo, front_photo, t)
        hx, top, _ = hook_anchor(arr[:, :, 3])
        if abs(hx - HOOK_X) > 2 or abs(top - (HOOK_Y - 0)) > 30:
            log(f"  aviso: cuadro {k:02d} con el gancho en ({hx:.0f}, {top}) — revisa la hoja")
        out.append(arr)

    out_dir = Path(out_dir or web / "giro")
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.webp"):
        old.unlink()
    meta, heavy = [], []
    w0, w1 = width_of(out[0][:, :, 3]), width_of(out[-1][:, :, 3])
    for k, arr in enumerate(out):
        name = f"{k:02d}"
        kb_full = save_webp(arr, out_dir / f"{name}.webp", CANVAS_H, LIMIT_FULL_KB)
        kb_small = save_webp(arr, out_dir / f"{name}-700.webp", SMALL_H, LIMIT_SMALL_KB)
        if kb_full > LIMIT_FULL_KB or kb_small > LIMIT_SMALL_KB:
            heavy.append(f"{name} ({kb_full:.0f}/{kb_small:.0f} KB)")
        left, right = extent(arr[:, :, 3])
        w = width_of(arr[:, :, 3])
        angle = round(80 * (1 - (w - w0) / max(1, w1 - w0)))
        meta.append({"angulo": max(0, min(80, angle)), "archivo": name, "left": left, "right": right})
    if heavy:
        log("  aviso: cuadros más pesados de lo previsto: " + ", ".join(heavy))
    if sheet:
        contact_sheet(out, Path(sheet))
        log(f"hoja de revisión: {Path(sheet).relative_to(ROOT) if Path(sheet).is_relative_to(ROOT) else sheet}")
    if catalog:
        update_catalog(item_id, video, meta)
        log("catalogo.json actualizado (tienda.giro); corre tools/catalogo_web.py")
    return meta, out_dir


# ---------- video de prueba ----------

def make_test_video(path, item_id="03-white-tee-dollar", frames=96, jitter=True):
    """Un giro sintético (perfil ↔ frente con las fotos actuales) sobre fondo verde,
    de frente a perfil como los videos reales y con la cámara temblando un poco."""
    web = ROOT / "web" / "prendas" / item_id
    front = Image.open(web / "0.webp").convert("RGBA")
    side = Image.open(web / "80.webp").convert("RGBA")
    ef = extent(np.array(front)[:, :, 3])
    es = extent(np.array(side)[:, :, 3])
    ratio = (es[1] - es[0]) / (ef[1] - ef[0])
    path.parent.mkdir(parents=True, exist_ok=True)
    vw = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 24, (FRAME_W, FRAME_H))
    rng = np.random.default_rng(3)
    for i in range(frames):
        t = i / (frames - 1)
        t = t * t * (3 - 2 * t)                      # no a velocidad constante, a propósito
        frame = Image.new("RGB", (FRAME_W, FRAME_H), (0, 177, 64))
        # La vista que va saliendo queda opaca debajo y la que entra se funde
        # encima (como en la página), así el fondo no se transparenta.
        layers = [(front, 1 + (ratio - 1) * t, 1.0), (side, ratio + (1 - ratio) * (1 - t), t)]
        if t > 0.5:
            layers = [(side, layers[1][1], 1.0), (front, layers[0][1], 1 - t)]
        for img, sx, alpha in layers:
            if alpha <= 0.01:
                continue
            w = max(2, round(CANVAS_W * sx / (1 if img is front else ratio)))
            im = img.resize((w, CANVAS_H), Image.LANCZOS)
            im.putalpha(im.split()[-1].point(lambda v, k=alpha: v * k))
            frame.paste(im, (CANVAS_X + HOOK_X - w // 2, CANVAS_Y), im)
        if jitter and 30 < i < 60:
            dx, dy = (int(v) for v in rng.integers(-6, 7, 2))
            frame = Image.fromarray(np.roll(np.roll(np.array(frame), dy, 0), dx, 1))
        vw.write(cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR))
    vw.release()
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video", nargs="?")
    ap.add_argument("--prenda", help="id de la prenda (se deduce de giro-NN-…)")
    ap.add_argument("--cuadros", type=int, default=12)
    ap.add_argument("--fondo-plano", action="store_true", help="fondo de un solo color (sin rembg)")
    ap.add_argument("--prueba", action="store_true", help="genera un video sintético y lo procesa en tools/pruebas/salida/")
    args = ap.parse_args()

    catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf8"))
    ids = [it["id"] for it in catalog["items"]]
    try:
        if args.prueba:
            out = ROOT / "tools" / "pruebas" / "salida"
            video = make_test_video(out / "giro-prueba.mp4")
            process(video, "03-white-tee-dollar", args.cuadros, flat=True, out_dir=out / "giro-prueba",
                    sheet=out / "giro-prueba.jpg", catalog=False)
            return
        if not args.video:
            ap.error("falta el video")
        item_id = args.prenda
        if not item_id:
            m = re.search(r"giro-(\d\d)", Path(args.video).name)
            item_id = next((i for i in ids if m and i.startswith(m.group(1))), None)
        if item_id not in ids:
            ap.error("no sé de qué prenda es; usa --prenda")
        process(args.video, item_id, args.cuadros, flat=args.fondo_plano,
                sheet=ROOT / "assets" / "revision" / f"giro-{item_id}.jpg")
    except Rechazo as e:
        print(f"RECHAZADO: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
