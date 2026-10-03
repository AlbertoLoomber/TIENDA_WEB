"""Pasa los datos de tienda de catalogo.json a web/prendas.json.

Precios, descripciones, tallas, el lookbook, la guía de tallas y los datos de
contacto viven en catalogo.json; este script los copia a la página sin volver a
procesar las imágenes (eso lo hace procesar_assets.py).

Uso:  python tools/catalogo_web.py
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


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
    }
    # Validaciones: mejor detenerse con un mensaje claro que publicar datos rotos.
    slugs = [it["slug"] for it in web["items"]]
    assert len(slugs) == len(set(slugs)), "hay dos slug iguales"
    for it in web["items"]:
        assert all(c.isalnum() or c == "-" for c in it["slug"]), f"slug inválido: {it['slug']}"
        assert set(it["soldOut"]) <= set(it["sizes"]), f"{it['id']}: agotadas fuera de tallas"
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
