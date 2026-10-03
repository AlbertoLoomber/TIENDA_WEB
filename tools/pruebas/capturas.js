/* Capturas de cada sección y de los paneles, en todos los tamaños, más una hoja
   de contacto por tamaño (salida/contacto-<tamaño>.png). Se revisan a ojo. */
const path = require("path");
const fs = require("fs");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

module.exports = async function capturas() {
  const b = await navegador();
  const hechas = [];
  for (const t of TAMANOS) {
    const p = await abrir(b, t);
    const fotos = [];
    const foto = async (nombre) => { const f = path.join(OUT, `${t.nombre}-${nombre}.png`); await p.screenshot({ path: f }); fotos.push(f); };
    await foto("01-portada");
    await p.click("#see"); await p.waitForTimeout(1600); await foto("02-detalle");
    await p.click("#close"); await p.waitForTimeout(1800);
    for (const [sel, n] of [["#shop", "03-coleccion"], ["#calle", "04-asi-se-usa"], ["#about", "05-nosotros"], ["#newsletter", "06-newsletter"]]) {
      await ir(p, sel); await p.waitForTimeout(2600); await foto(n);
    }
    await ir(p, await p.evaluate(() => document.documentElement.scrollHeight)); await p.waitForTimeout(1500); await foto("07-pie");
    await ir(p, "#shop"); await p.waitForTimeout(1500);
    await p.click(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(1500); await foto("08-ficha");
    await p.click("#sheet-guide-open"); await p.waitForTimeout(1300); await foto("09-guia");
    // hoja de contacto
    await p.setViewportSize({ width: 1600, height: 1200 });
    await p.setContent(`<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${fotos.map((f) => `<img style="width:100%" src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}">`).join("")}</body>`);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, `contacto-${t.nombre}.png`), fullPage: true });
    hechas.push(`${t.nombre}: ${fotos.length}`);
    await p.close();
  }
  await b.close();
  return { nombre: "capturas", ok: true, detalle: `${hechas.join(", ")} (en tools/pruebas/salida/)` };
};
if (require.main === module) module.exports().then((r) => console.log(r));
