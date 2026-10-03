"""Pasa los datos de tienda de catalogo.json a web/prendas.json.

Precios, descripciones, tallas, el lookbook, la guía de tallas y los datos de
contacto viven en catalogo.json; este script los copia a la página sin volver a
procesar las imágenes (eso lo hace procesar_assets.py).

Uso:  python tools/catalogo_web.py
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
FOTOS = ROOT / "web" / "fotos"


def photo(name):
    """La foto real si existe; si no, su muestra (tools/fotos_web.py), marcada como tal."""
    if not name:
        return None
    if (FOTOS / name).exists():
        return {"src": f"fotos/{name}", "sample": False}
    if (FOTOS / "muestra" / name).exists():
        return {"src": f"fotos/muestra/{name}", "sample": True}
    return None


def spin(item_id, giro):
    """Cuadros del giro real (tools/cuadros_video.py), solo si están todos en disco."""
    if not giro or not giro.get("cuadros"):
        return None
    base = f"prendas/{item_id}/giro"
    frames = []
    for c in giro["cuadros"]:
        full, small = f"{base}/{c['archivo']}.webp", f"{base}/{c['archivo']}-700.webp"
        if not ((ROOT / "web" / full).exists() and (ROOT / "web" / small).exists()):
            print(f"aviso: {item_id}: faltan los cuadros del giro ({c['archivo']}); se usa el giro de dos fotos")
            return None
        frames.append({"angle": c["angulo"], "src": full, "small": small, "left": c["left"], "right": c["right"]})
    return {"frames": frames}


def closeup(c):
    if not c:
        return None
    points = []
    for p in c.get("puntos", []):
        assert 0 <= p["x"] <= 1 and 0 <= p["y"] <= 1, f"cerca: {p['id']} fuera del lienzo"
        assert p.get("lado") in ("izq", "der"), f"cerca: {p['id']} sin lado"
        points.append({"id": p["id"], "title": p["titulo"], "text": p["texto"], "photo": photo(p.get("foto")),
                       "x": p["x"], "y": p["y"], "side": p["lado"]})
    return {"item": c["prenda"], "eyebrow": c.get("encabezado", ""), "title": c.get("titulo", ""), "points": points}


def drop(d):
    if not d:
        return None
    from datetime import datetime
    datetime.fromisoformat(d["fecha"])   # falla aquí si la fecha está mal escrita
    after = d.get("despues", {})
    return {"name": d["nombre"], "date": d["fecha"], "title": d.get("titulo", ""), "text": d.get("texto", ""),
            "after": {"title": after.get("titulo", ""), "button": after.get("boton", "")},
            "photo": photo(d.get("foto"))}


def main():
    catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf8"))
    web_path = ROOT / "web" / "prendas.json"
    web = json.loads(web_path.read_text(encoding="utf8"))
    site = catalog.get("sitio", {})
    by_id = {it["id"]: it for it in catalog["items"]}

    for item in web["items"]:
        src = by_id[item["id"]]
        shop = src.get("tienda", {})
        look = shop.get("look", {})
        item.update({
            "name": src.get("nombre", item["name"]),
            "category": src.get("categoria", item["category"]),
            "categoryPlural": src.get("categoria_plural", src.get("categoria", item["category"])),
            "price": shop.get("precio"),
            "isNew": shop.get("nuevo", False),
            "description": shop.get("descripcion", ""),
            "details": shop.get("detalles", []),
            "care": shop.get("cuidados", ""),
            "sizes": shop.get("tallas", []),
            "soldOut": shop.get("agotadas", []),
            "slug": src.get("slug", item["id"]),
            "look": {"tone": look.get("tono"), "ink": look.get("tinta"), "photo": look.get("foto"),
                     "model": look.get("modelo")},
            "closeup": photo(shop.get("cerca")),
            "spin": spin(item["id"], shop.get("giro")),
        })

    web["site"] = {
        "currency": site.get("moneda", "MXN"),
        "band": site.get("barra", []),
        "studioPhoto": site.get("foto_estudio"),
        "sizeGuide": {
            "unit": site.get("guia_tallas", {}).get("unidad", "cm"),
            "columns": site.get("guia_tallas", {}).get("columnas", []),
            "rows": site.get("guia_tallas", {}).get("filas", {}),
        },
        "contact": site.get("contacto", {}),
        "recommender": site.get("recomendador"),
        "faq": [{"q": f["p"], "a": f["r"]} for f in site.get("preguntas", [])],
        "pages": {
            key: {"group": h.get("grupo", ""), "title": h["titulo"], "draft": h.get("borrador", False),
                  "sections": [{"title": x["t"], "text": x["p"]} for x in h.get("secciones", [])]}
            for key, h in site.get("hojas", {}).items()
        },
        "shipping": {
            "prep": site.get("envio", {}).get("preparacion"),
            "delivery": site.get("envio", {}).get("entrega"),
            "cost": site.get("envio", {}).get("costo"),
            "freeFrom": site.get("envio", {}).get("gratis_desde"),
        },
        "returns": {
            "days": site.get("cambios", {}).get("dias"),
            "firstFree": site.get("cambios", {}).get("primer_cambio_gratis", False),
        },
        "closeup": closeup(site.get("cerca")),
        "drop": drop(site.get("drop")),
    }
    # Validaciones: mejor detenerse con un mensaje claro que publicar datos rotos.
    slugs = [it["slug"] for it in web["items"]]
    assert len(slugs) == len(set(slugs)), "hay dos slug iguales"
    for it in web["items"]:
        assert all(c.isalnum() or c == "-" for c in it["slug"]), f"slug inválido: {it['slug']}"
        assert set(it["soldOut"]) <= set(it["sizes"]), f"{it['id']}: agotadas fuera de tallas"
    cu = web["site"].get("closeup")
    if cu:
        assert cu["item"] in by_id, f"cerca: no existe la prenda {cu['item']}"
    rec = web["site"].get("recommender")
    if rec:
        limits = [m for m, _ in rec["peso"]]
        assert limits == sorted(limits), "recomendador: pesos desordenados"
        assert all(t in rec["orden"] for _, t in rec["peso"]), "recomendador: talla desconocida"
    pend = len(site.get("_provisional", [])) + sum(1 for it in catalog["items"] if it.get("tienda", {}).get("_provisional"))
    if pend:
        print(f"aviso: {pend} grupos de datos siguen marcados como provisionales")

    web_path.write_text(json.dumps(web, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("escrito", web_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
