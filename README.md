# Nomad — tienda web

Prototipo de diseño del perchero interactivo (sin inventario, pagos ni envíos).

- `web/`: el sitio (HTML, CSS y JS con GSAP). Para verlo en local:
  `python3 -m http.server -d web 8080` y abrir http://localhost:8080
- `assets/raw`, `assets/aprobadas`: fotos originales aprobadas por prenda y ángulo.
- `catalogo.json`: prendas, nombres, estado de cada ángulo y datos de tienda (precio, descripción, tallas, lookbook) más `sitio` (moneda, guía de tallas, contacto). **Precios, textos y medidas son provisionales.**
- `tools/procesar_assets.py`: quita fondos y alinea el gancho de todas las vistas → `web/prendas/`.
- `tools/catalogo_web.py`: copia los datos de tienda de `catalogo.json` a `web/prendas.json` (sin reprocesar imágenes).
- `tools/procesar_rail.py`: recorta la foto del tubo y la parte en tres piezas → `web/rail/`.
- `assets/marca/`: logo "Nomad" en SVG (azul marino, claro, negro) e ícono del gancho.
- `tools/validar_assets.py`: revisa nombres, tamaños y ángulos faltantes.
- `tools/build_artifact.py`: arma `dist/index.html` para publicar la vista previa.
- `tools/preparar_video.py`: cuadros de inicio y fin para generar el giro de cada prenda con video → `assets/para-video/`.
- `docs/`: análisis del sitio de referencia, planes (`PLAN-SIGUIENTE-NIVEL.md` es el vigente) y prompts para generar fotos y videos.
