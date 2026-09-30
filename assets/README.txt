NOMAD — CATÁLOGO MAESTRO (5 prendas)

assets/raw: frentes originales y perfiles individuales del paquete anterior.
assets/candidatas_60: propuestas a 60°, TODAVÍA NO APROBADAS.
assets/aprobadas: depositar únicamente ángulos aprobados por revisión visual.
assets/optimized: salida del validador cuando se ejecute con --optimize.

Secuencia para cada prenda: cargar front + side, generar UNA imagen de UN ángulo (60°, luego 45°, luego 25°), revisar texto/patrón, aprobar y copiar a assets/aprobadas/NN-nombre-angulo.png. No generar 5 prendas a la vez ni componer mosaicos.

Estado inicial: 5 frentes + 5 perfiles disponibles; 5 candidatas 60° por validar; 10 imágenes (45° y 25°) por generar. Una aprobación de silueta no garantiza fidelidad exacta del estampado.

Ejecutar: python tools/validar_assets.py [--optimize]
El script revisa nombres, tamaño, relación de aspecto, duplicados exactos y ángulos ausentes; crea reporte_validacion.json y, opcionalmente, copias WebP. No aprueba automáticamente estampados ni inventa ángulos.
