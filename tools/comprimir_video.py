"""Prepara los clips en loop para la página (T4.2, T4.3 y el clip opcional de T4.4).

Toma los videos de `assets/raw/video/` con el nombre de docs/PROMPTS.md §24 y deja
en `web/video/` dos formatos (MP4 H.264 y WebM VP9, sin audio) y su portada:

  clip-look-NN      lookbook       4:5, 720×900, 24 fps, máx. 1.5 MB
  video-estudio     Nosotros       3:2, 1280×852, 24 fps, máx. 2.5 MB
  clip-estampado    Cómo se hace   4:5, 720×900, 24 fps, máx. 1.5 MB

Cada clip se recorta al centro a su proporción. Si el primer y el último cuadro no
coinciden, el clip se arma de ida y vuelta (normal y al revés) para que el loop no
salte. La portada es el primer cuadro (WebP), que también se ve sin video.
`tools/catalogo_web.py` conecta los clips que encuentre.

Necesita ffmpeg: `pip install imageio-ffmpeg` (trae el suyo).

Uso:  python tools/comprimir_video.py            (todos los de assets/raw/video/)
      python tools/comprimir_video.py VIDEO…     (solo esos)
      python tools/comprimir_video.py --salida DIR VIDEO…
"""
from pathlib import Path
import argparse
import subprocess
import sys
import tempfile

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "raw" / "video"
OUT = ROOT / "web" / "video"

KINDS = {
    "clip-look-": ((720, 900), 1.5),
    "video-estudio": ((1280, 852), 2.5),   # 3:2 en medidas pares (H.264)
    "clip-estampado": ((720, 900), 1.5),
}
LOOP_DIFF = 6.0     # diferencia media (0–255) aceptable entre el primer y el último cuadro


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("falta ffmpeg: pip install imageio-ffmpeg")


def kind_of(name):
    return next((v for k, v in KINDS.items() if name.startswith(k)), None)


def probe(path):
    cap = cv2.VideoCapture(str(path))
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    ok, first = cap.read()
    last = first
    while True:
        ok, f = cap.read()
        if not ok:
            break
        last = f
    cap.release()
    return w, h, n / fps if fps else 0, first, last


def loop_gap(first, last):
    small = lambda f: cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (90, 120)).astype(np.float32)
    return float(np.abs(small(first) - small(last)).mean())


def crop_filter(w, h, size):
    tw, th = size
    if w / h > tw / th:
        cw, ch = round(h * tw / th), h
    else:
        cw, ch = w, round(w * th / tw)
    cw -= cw % 2
    ch -= ch % 2
    return f"crop={cw}:{ch}:{(w - cw) // 2}:{(h - ch) // 2},scale={tw}:{th}:flags=lanczos,fps=24,setsar=1"


def encode(src, out_dir, log=print):
    name = Path(src).stem
    spec = kind_of(name)
    if not spec:
        log(f"  ¿{Path(src).name}? no sé de qué sección es (PROMPTS.md §24)")
        return None
    size, limit_mb = spec
    w, h, secs, first, last = probe(src)
    if not w:
        log(f"  no se pudo leer {src}")
        return None
    vf = crop_filter(w, h, size)
    gap = loop_gap(first, last)
    pingpong = gap > LOOP_DIFF and secs <= 8
    if pingpong:
        vf_full = f"[0:v]{vf},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]"
    else:
        vf_full = f"[0:v]{vf}[v]"
    out_dir.mkdir(parents=True, exist_ok=True)
    exe = ffmpeg()
    results = {}
    for ext, codec, crfs in (("mp4", ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "slow", "-movflags", "+faststart"], (28, 31, 34)),
                             ("webm", ["-c:v", "libvpx-vp9", "-b:v", "0", "-row-mt", "1", "-pix_fmt", "yuv420p"], (36, 40, 44))):
        dest = out_dir / f"{name}.{ext}"
        for crf in crfs:
            cmd = [exe, "-y", "-loglevel", "error", "-i", str(src), "-filter_complex", vf_full, "-map", "[v]", "-an",
                   *codec, "-crf", str(crf), str(dest)]
            subprocess.run(cmd, check=True)
            mb = dest.stat().st_size / 1e6
            if mb <= limit_mb:
                break
        results[ext] = mb
        if mb > limit_mb:
            log(f"  aviso: {dest.name} pesa {mb:.2f} MB (máx. {limit_mb})")
    # Portada: el primer cuadro, ya recortado.
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "p.png"
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", str(src), "-vf", vf, "-frames:v", "1", str(png)], check=True)
        from PIL import Image
        Image.open(png).convert("RGB").save(out_dir / f"{name}.webp", quality=80, method=6)
    log(f"{name}: {results['mp4']:.2f} MB mp4 · {results['webm']:.2f} MB webm"
        + (f" · ida y vuelta (el loop saltaba {gap:.1f})" if pingpong else f" · loop limpio ({gap:.1f})"))
    return {"name": name, "pingpong": pingpong, "mb": results}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("videos", nargs="*")
    ap.add_argument("--salida", default=str(OUT))
    args = ap.parse_args()
    videos = [Path(v) for v in args.videos] or sorted(p for p in RAW.glob("*") if p.suffix.lower() in {".mp4", ".mov", ".webm"})
    if not videos:
        print(f"no hay videos en {RAW.relative_to(ROOT)}")
        return
    for v in videos:
        encode(v, Path(args.salida))
    print("listo; corre tools/catalogo_web.py para conectarlos")


if __name__ == "__main__":
    main()
