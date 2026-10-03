/* Ningún texto visible por debajo de 12 px, en todos los tamaños. */
const { TAMANOS, navegador, abrir, recorrer } = require("./comun");

module.exports = async function letra() {
  const b = await navegador();
  const fallas = [];
  for (const t of TAMANOS) {
    const p = await abrir(b, t);
    await recorrer(p);
    const chicos = await p.evaluate(() => {
      const out = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode, el = n.parentElement;
        if (!n.textContent.trim() || !el) continue;
        if (el.closest('[hidden], .sr-only, [aria-hidden="true"]')) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const fs = parseFloat(cs.fontSize);
        if (fs < 12) out.add(`${fs}px «${n.textContent.trim().slice(0, 24)}»`);
      }
      return [...out];
    });
    if (chicos.length) fallas.push(`${t.nombre}: ${chicos.join(", ")}`);
    await p.close();
  }
  await b.close();
  return { nombre: "letra", ok: !fallas.length, detalle: fallas.join(" | ") || "nada por debajo de 12 px" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
