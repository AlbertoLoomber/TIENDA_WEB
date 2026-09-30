"""Genera dist/index.html: la misma página de web/index.html pero como fragmento
(sin <!doctype>, <html>, <head> ni <body>), que es el formato que pide la
vista previa publicada. Las rutas relativas (styles.css, app.js, prendas/...) no
cambian: esos archivos se publican junto a la página.

Uso:  python tools/build_artifact.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "web" / "index.html").read_text(encoding="utf8")

head = re.search(r"<head>(.*?)</head>", src, re.S).group(1)
keep = [line.strip() for line in head.splitlines()
        if line.strip().startswith(("<title", "<link"))]
page = re.search(r"<!-- PAGE:START -->(.*?)<!-- PAGE:END -->", src, re.S).group(1)
scripts = re.findall(r"<script[^>]*></script>", src.split("<!-- PAGE:END -->")[1])

out = ROOT / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text("\n".join(keep) + "\n" + page.strip() + "\n" + "\n".join(scripts) + "\n", encoding="utf8")
print("escrito", out.relative_to(ROOT))
