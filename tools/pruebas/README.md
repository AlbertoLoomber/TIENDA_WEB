# Pruebas del prototipo

Comprueban cada fase igual (ver `docs/siguiente-nivel/07-pruebas.md`).

| Script | Qué revisa |
|---|---|
| `letra.js` | Ningún texto visible por debajo de 12 px, en 5 tamaños |
| `accesibilidad.js` | axe en la página, el detalle y la ficha: 0 problemas graves o serios |
| `restos.js` | Detalle, filtros y ficha repetidos rápido: nada movido, transparente ni bloqueado; sin errores |
| `rendimiento.js` | Carga inicial ≤ 1.3 MB, CLS < 0.1, sin archivos faltantes |
| `capturas.js` | Capturas de cada sección y hojas de contacto en `salida/` |

## Cómo correrlas

```bash
cd tools/pruebas && npm install          # una vez
python3 -m http.server -d ../../web 8765 # en otra terminal
node todo.js                             # todas
node todo.js letra restos                # solo algunas
```

Las librerías (GSAP, Lenis) salen de `node_modules`, así funcionan sin internet.
La carpeta `salida/` no se sube al repositorio.
