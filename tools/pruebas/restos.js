/* Secuencias rápidas (filtros, ficha, detalle) y luego: nada movido ni
   transparente a medias, ganchos sobre el tubo, scroll desbloqueado. */
const { TAMANOS, navegador, abrir, ir } = require("./comun");

const estado = (p) => p.evaluate(() => {
  const malas = [];
  document.querySelectorAll(".piece:not([hidden])").forEach((pc, i) => {
    const g = pc.querySelector(".piece__garment");
    const vals = [gsap.getProperty(pc, "x"), gsap.getProperty(pc, "y"), gsap.getProperty(g, "y")];
    if (vals.some((v) => Math.abs(v) > 0.5) || gsap.getProperty(pc, "opacity") < 0.99 || gsap.getProperty(g, "opacity") < 0.99) malas.push(`pieza ${i + 1}`);
  });
  document.querySelectorAll(".slot__swing").forEach((s, i) => {
    if (Math.abs(gsap.getProperty(s, "y")) > 0.5 || s.style.visibility === "hidden") malas.push(`perchero ${i + 1}`);
  });
  const rack = document.getElementById("rack");
  if (Math.abs(gsap.getProperty(rack, "x")) > 0.5 || Math.abs(gsap.getProperty(rack, "scale") - 1) > 0.001) malas.push("perchero desplazado");
  if (document.documentElement.classList.contains("is-locked")) malas.push("scroll bloqueado");
  if (document.getElementById("page").inert) malas.push("página inerte");
  return malas;
});

module.exports = async function restos() {
  const b = await navegador();
  const fallas = [];
  for (const t of TAMANOS.filter((t) => ["1440", "390"].includes(t.nombre))) {
    const p = await abrir(b, t);
    // detalle: abrir, cambiar varias veces, cerrar
    await p.click("#see"); await p.waitForTimeout(1500);
    for (let i = 0; i < 5; i++) { await p.click("#next"); await p.waitForTimeout(250); }
    await p.waitForTimeout(800);
    await p.click("#close"); await p.waitForTimeout(2000);
    // colección: filtros rápidos y ficha
    await ir(p, "#shop"); await p.waitForTimeout(400);
    for (const n of [3, 2, 4, 1, 3, 1]) { await p.click(`.filter:nth-child(${n})`); await p.waitForTimeout(150); }
    await p.waitForTimeout(3000);
    await p.click(".piece:nth-child(2) .piece__hang"); await p.waitForTimeout(1300);
    await p.keyboard.press("Escape"); await p.waitForTimeout(1500);
    const malas = await estado(p);
    if (malas.length) fallas.push(`${t.nombre}: ${malas.join(", ")}`);
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  await b.close();
  return { nombre: "restos", ok: !fallas.length, detalle: fallas.join(" | ") || "sin restos ni errores" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
