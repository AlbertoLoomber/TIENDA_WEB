"""Prepara la foto del tubo para la web.

Quita la pared de la foto (rembg) pero conserva la sombra que el tubo proyecta
en ella, y la parte en tres piezas: soporte izquierdo, tubo central (se estira
al ancho del perchero) y soporte derecho.

Entrada:  assets/raw/rail-photo.webp
Salida:   web/rail/left.webp, mid.webp, right.webp y web/rail/rail.json

Uso:  python tools/procesar_rail.py
"""
from pathlib import Path
import json

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "raw" / "rail-photo.webp"
OUT = ROOT / "web" / "rail"

# Medidas en píxeles de la foto original (2000 × 667).
TOP, BOTTOM = 225, 460          # ventana vertical: soportes + sombra
TUBE_TOP, TUBE_BOTTOM = 278, 325
CUT_LEFT, CUT_RIGHT = 262, 1738  # dónde termina cada soporte y empieza el tubo
X0, X1 = 30, 1972
SHADOW_RGB = np.array([38, 36, 33], np.float32)


def main():
    photo = Image.open(SRC).convert("RGB")
    rgb = np.array(photo).astype(np.float32)
    alpha = np.array(remove(photo, session=new_session("isnet-general-use")))[:, :, 3].astype(np.float32) / 255

    # Sombra: cuánto más oscura está la pared que su propio degradado.
    gray = rgb.mean(2)
    h = gray.shape[0]
    rows = np.r_[40:200, 470:640]
    coef = np.polyfit(rows, gray[rows, :], 2)
    ys = np.arange(h)[:, None]
    wall = cv2.GaussianBlur(coef[0] * ys**2 + coef[1] * ys + coef[2], (0, 0), 25)
    shade = np.clip(1 - gray / wall, 0, 1) * 1.15
    shade[alpha > 0.05] = 0
    shade = np.clip(cv2.GaussianBlur(shade, (0, 0), 2), 0, 1)

    out_a = alpha + shade * (1 - alpha)
    out_rgb = (rgb * alpha[..., None] + SHADOW_RGB * (shade * (1 - alpha))[..., None]) / np.maximum(out_a, 1e-4)[..., None]
    rgba = np.dstack([np.clip(out_rgb, 0, 255), out_a * 255]).astype(np.uint8)[TOP:BOTTOM]

    OUT.mkdir(parents=True, exist_ok=True)
    pieces = {"left": (X0, CUT_LEFT), "mid": (CUT_LEFT, CUT_RIGHT), "right": (CUT_RIGHT, X1)}
    for name, (a, b) in pieces.items():
        Image.fromarray(rgba[:, a:b]).save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)

    geometry = {
        "height": BOTTOM - TOP,
        "tubeTop": TUBE_TOP - TOP,
        "tubeHeight": TUBE_BOTTOM - TUBE_TOP,
        "left": CUT_LEFT - X0,
        "right": X1 - CUT_RIGHT,
        # dónde está el borde exterior de cada soporte dentro de su pieza
        "leftEdge": 47 - X0,
        "rightEdge": X1 - 1955,
    }
    (OUT / "rail.json").write_text(json.dumps(geometry, indent=2) + "\n", encoding="utf8")
    print("escrito", OUT.relative_to(ROOT), geometry)


if __name__ == "__main__":
    main()
