/* "¿Qué talla soy?": la regla con casos conocidos y el panel de la ficha. */
const { TAMANOS, navegador, abrir, ir } = require("./comun");
const CASOS = [
  [{ height: 170, weight: 65, fit: "normal" }, "M"],
  [{ height: 188, weight: 80, fit: "normal" }, "XL"],
  [{ height: 158, weight: 55, fit: "justa" }, "S"],
  [{ height: 175, weight: 90, fit: "holgada" }, "XL"],
  [{ height: 175, weight: 70, fit: "holgada" }, "L"],
];

module.exports = async function recomendador() {
  const b = await navegador();
  const fallas = [];
  const p = await abrir(b, TAMANOS[0]);
  for (const [m, esperada] of CASOS) {
    const r = await p.evaluate((m) => window.NOMAD.recommend(m), m);
    if (r?.size !== esperada) fallas.push(`${JSON.stringify(m)} → ${r?.size} (esperada ${esperada})`);
  }
  await p.evaluate(() => localStorage.removeItem("nomad.medidas"));
  await ir(p, "#shop"); await p.waitForTimeout(1500);
  await p.click(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(1400);
  await p.click("#sheet-fit-open"); await p.waitForTimeout(800);
  await p.fill("#fit-height", "17"); await p.fill("#fit-weight", "70"); await p.press("#fit-weight", "Tab");
  await p.press("#fit-height", "Tab"); await p.waitForTimeout(200);
  if (!(await p.textContent("#fit-error")).includes("estatura")) fallas.push("no avisó estatura inválida");
  await p.fill("#fit-height", "170"); await p.fill("#fit-weight", "65"); await p.waitForTimeout(200);
  if (!(await p.textContent("#fit-answer")).includes("la M")) fallas.push(`respuesta: ${await p.textContent("#fit-answer")}`);
  await p.click("#fit-use"); await p.waitForTimeout(400);
  const marcada = await p.$eval('#sheet-sizes [aria-checked="true"]', (n) => n.textContent).catch(() => null);
  if (marcada !== "M") fallas.push(`"Usar talla" marcó ${marcada}`);
  if (!(await p.textContent("#sheet-suggest")).includes("M")) fallas.push("no mostró la talla sugerida");
  if (!(await p.textContent("#sheet-model")).includes("1.78")) fallas.push(`línea del modelo: ${await p.textContent("#sheet-model")}`);
  // prenda con la sugerida agotada (Camo, XL)
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500);
  await p.evaluate(() => localStorage.setItem("nomad.medidas", JSON.stringify({ height: 188, weight: 80, fit: "normal" })));
  await p.click(".piece:nth-child(1) .piece__hang"); await p.waitForTimeout(1400);
  await p.click("#sheet-fit-open"); await p.waitForTimeout(800);
  if (!(await p.textContent("#fit-answer")).includes("agotada")) fallas.push(`agotada: ${await p.textContent("#fit-answer")}`);
  if (p.errores.length) fallas.push(`consola: ${p.errores.join(" / ")}`);
  await b.close();
  return { nombre: "recomendador", ok: !fallas.length, detalle: fallas.join(" | ") || `${CASOS.length} casos, validación, usar talla, sugerencia, agotada y modelo` };
};
if (require.main === module) module.exports().then((r) => console.log(r));
