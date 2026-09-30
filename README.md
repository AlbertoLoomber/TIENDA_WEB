# Nomad — tienda web

Prototipo de diseño del perchero interactivo (sin inventario, pagos ni envíos).

- `web/`: el sitio (HTML, CSS y JS con GSAP). Para verlo en local:
  `python3 -m http.server -d web 8080` y abrir http://localhost:8080
- `assets/raw`, `assets/aprobadas`: fotos originales aprobadas por prenda y ángulo.
- `catalogo.json`: prendas, nombres y estado de cada ángulo.
- `tools/procesar_assets.py`: quita fondos y alinea el gancho de todas las vistas → `web/prendas/`.
- `tools/validar_assets.py`: revisa nombres, tamaños y ángulos faltantes.
- `tools/build_artifact.py`: arma `dist/index.html` para publicar la vista previa.
- `docs/`: análisis del sitio de referencia, plan y prompts para generar imágenes.
