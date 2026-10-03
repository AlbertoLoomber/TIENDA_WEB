"""Prepara los cuadros de inicio y fin para generar el giro de cada prenda con video.

Los generadores de video (Kling, Veo, Runway) inventan movimiento de cámara si el
primer y el último cuadro no coinciden en escala y posición. Por eso se parte de
los recortes ya alineados de web/prendas (gancho siempre en el mismo punto) y se
ponen sobre el mismo fondo gris, en vertical 9:16:

  assets/para-video/<prenda>/frente.jpg   la prenda de frente
  assets/para-video/<prenda>/lado.jpg     de perfil (su lado izquierdo, como en el perchero)

El perfil derecho no se obtiene reflejando el izquierdo: el pedazo de estampado
que se alcanza a ver quedaría al revés. Se genera aparte (docs/PROMPTS.md, 16.2).

Uso:  python tools/preparar_video.py
"""
from pathlib import Path
import json

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "para-video"
SIZE = (1080, 1920)            # 9:16, el formato vertical que aceptan todos
BG = (231, 230, 225)           # #E7E6E1, el gris de la página y de las fotos
TOP = 300                      # px desde arriba hasta el borde superior del lienzo de la prenda


def place(cutout: Image.Image) -> Image.Image:
    """La prenda (lienzo 1000x1300) centrada, con una sombra suave como en el estudio."""
    frame = Image.new("RGB", SIZE, BG)
    x = (SIZE[0] - cutout.width) // 2
    alpha = cutout.split()[-1]
    shadow = Image.new("L", SIZE, 0)
    shadow.paste(alpha.point(lambda a: a * 0.22), (x + 10, TOP + 18))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    frame.paste((150, 148, 142), (0, 0), shadow)
    frame.paste(cutout, (x, TOP), alpha)
    return frame


def main():
    web = json.loads((ROOT / "web" / "prendas.json").read_text(encoding="utf8"))
    for item in web["items"]:
        frames = sorted(item["frames"], key=lambda f: f["angle"])
        front = Image.open(ROOT / "web" / frames[0]["src"]).convert("RGBA")
        side = Image.open(ROOT / "web" / frames[-1]["src"]).convert("RGBA")
        folder = OUT / item["id"]
        folder.mkdir(parents=True, exist_ok=True)
        place(front).save(folder / "frente.jpg", quality=92)
        place(side).save(folder / "lado.jpg", quality=92)
        print("escrito", folder.relative_to(ROOT))


if __name__ == "__main__":
    main()
