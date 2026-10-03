"""Pule las tres piezas del tubo para que se vean como un solo objeto.

Parte de las piezas sin pulir que deja procesar_rail.py (copiadas en
assets/raw/rail-piezas/) y escribe las finales en web/rail/:

1. El tubo central se vuelve uniforme: cada fila toma la mediana de la parte
   media de la foto. Así, al estirarse al ancho del perchero, no arrastra el
   brillo que la foto tenía junto al soporte izquierdo.
2. En las uniones, los últimos píxeles del tubo en cada soporte se mezclan
   hacia ese mismo perfil, para que no haya escalón de tono.
3. La sombra en la pared se desvanece hacia abajo y hacia los extremos, en
   lugar de cortarse en línea recta donde termina el recorte.

Se puede correr las veces que sea: siempre lee las piezas originales.

Uso:  python tools/pulir_rail.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "raw" / "rail-piezas"
OUT = ROOT / "web" / "rail"

MEDIAN_COLS = (300, 1300)   # parte del tubo central sin reflejos de los soportes
JOIN = 40                   # px de cada soporte que se mezclan hacia el perfil
FADE_BOTTOM = 48            # filas finales donde la sombra se desvanece
FADE_SIDE = 17              # px exteriores de cada soporte (fuera del metal)


def load(name):
    return np.array(Image.open(SRC / f"{name}.webp").convert("RGBA")).astype(np.float32)


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def main():
    left, mid, right = load("left"), load("mid"), load("right")
    h = mid.shape[0]

    # 1. Perfil uniforme del tubo (color premultiplicado para que la mediana sea limpia).
    a = mid[..., 3:4] / 255
    premul = np.concatenate([mid[..., :3] * a, a], axis=2)[:, MEDIAN_COLS[0]:MEDIAN_COLS[1]]
    prof = np.median(premul, axis=1)                      # (h, 4)
    alpha = prof[:, 3:4]
    prof_rgba = np.concatenate([prof[:, :3] / np.maximum(alpha, 1e-4), alpha * 255], axis=1)
    mid = np.repeat(prof_rgba[:, None, :], mid.shape[1], axis=1)

    # 2. Uniones: los soportes terminan exactamente en el perfil.
    w = smoothstep(np.linspace(0, 1, JOIN))[None, :, None]
    p = prof_rgba[:, None, :]
    left[:, -JOIN:] = left[:, -JOIN:] * (1 - w) + p * w
    right[:, :JOIN] = right[:, :JOIN] * w + p * (1 - w)

    # 3. Sombra que se desvanece: abajo en las tres piezas y en los extremos exteriores.
    ramp = np.ones(h, np.float32)
    ramp[-FADE_BOTTOM:] = smoothstep(np.linspace(1, 0, FADE_BOTTOM))
    for piece in (left, mid, right):
        shadow = piece[..., 3] < 200                      # nunca el metal opaco
        piece[..., 3] = np.where(shadow, piece[..., 3] * ramp[:, None], piece[..., 3])
    side = smoothstep(np.linspace(0, 1, FADE_SIDE))
    for piece, cols in ((left, side[None, :]), (right, side[::-1][None, :])):
        sl = slice(0, FADE_SIDE) if piece is left else slice(-FADE_SIDE, None)
        region = piece[:, sl]
        shadow = region[..., 3] < 200
        region[..., 3] = np.where(shadow, region[..., 3] * cols, region[..., 3])

    for name, piece in (("left", left), ("mid", mid), ("right", right)):
        Image.fromarray(np.clip(piece, 0, 255).astype(np.uint8)).save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)
    print("escrito", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
