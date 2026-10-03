/* axe en la página, el detalle del perchero y la ficha: 0 problemas graves o serios. */
const path = require("path");
const { TAMANOS, navegador, abrir, recorrer, ir } = require("./comun");
const AXE = path.join(__dirname, "node_modules", "axe-core", "axe.min.js");

async function revisar(p, donde) {
  await p.addScriptTag({ path: AXE });
  const v = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations
    .filter((x) => x.impact === "serious" || x.impact === "critical")
    .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target}`));
  return v.map((x) => `${donde}: ${x}`);
}

module.exports = async function accesibilidad() {
  const b = await navegador();
  const fallas = [];
  for (const t of TAMANOS.filter((t) => ["1440", "390"].includes(t.nombre))) {
    const p = await abrir(b, t);
    await recorrer(p);
    fallas.push(...(await revisar(p, `${t.nombre} página`)));
    await ir(p, 0); await p.waitForTimeout(600);
    await p.click("#see"); await p.waitForTimeout(1600);
    fallas.push(...(await revisar(p, `${t.nombre} detalle`)));
    await p.click("#close"); await p.waitForTimeout(1600);
    await ir(p, "#shop"); await p.waitForTimeout(1600);
    await p.click(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(1500);
    fallas.push(...(await revisar(p, `${t.nombre} ficha`)));
    await p.click("#sheet-sizes button:nth-child(2)"); await p.click("#sheet-add"); await p.waitForTimeout(1300);
    await p.click(".sheet__bag"); await p.waitForTimeout(900);
    fallas.push(...(await revisar(p, `${t.nombre} bolsa`)));
    await p.close();
  }
  await b.close();
  return { nombre: "accesibilidad", ok: !fallas.length, detalle: fallas.join(" | ") || "0 graves o serios" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
