/* Beneficios, preguntas frecuentes, hojas de ayuda y legales, contactos de prueba y pie. */
const path = require("path");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

module.exports = async function ayuda() {
  const b = await navegador();
  const fallas = [];
  for (const t of [TAMANOS[0], TAMANOS[4]]) {
    const p = await abrir(b, t);
    const perks = await p.$$eval(".perk", (l) => l.length);
    if (perks !== 3) fallas.push(`${t.nombre}: ${perks} beneficios`);
    // preguntas: abre y cierra
    await ir(p, "#preguntas"); await p.waitForTimeout(1500);
    const n = await p.$$eval(".faq__item", (l) => l.length);
    if (n !== 6) fallas.push(`${t.nombre}: ${n} preguntas`);
    await p.click(".faq__item:nth-child(3) summary"); await p.waitForTimeout(600);
    if (!(await p.evaluate(() => document.querySelector(".faq__item:nth-child(3)").open))) fallas.push(`${t.nombre}: la pregunta no abrió`);
    await p.screenshot({ path: path.join(OUT, `ayuda-preguntas-${t.nombre}.png`) });
    // contacto de prueba: avisa en lugar de abrir
    await p.click(".faq__more a"); await p.waitForTimeout(400);
    if (!(await p.textContent("#toasts")).includes("Vista previa")) fallas.push(`${t.nombre}: contacto sin aviso`);
    // pie: abrir Envíos, cerrar con Escape
    await ir(p, await p.evaluate(() => document.documentElement.scrollHeight)); await p.waitForTimeout(1600);
    await p.screenshot({ path: path.join(OUT, `ayuda-pie-${t.nombre}.png`) });
    await p.click('.foot a[href="#/ayuda/envios"]'); await p.waitForTimeout(800);
    if (await p.evaluate(() => document.getElementById("info").hidden)) fallas.push(`${t.nombre}: Envíos no abrió`);
    else if ((await p.textContent("#info-title")) !== "Envíos") fallas.push(`${t.nombre}: título ${await p.textContent("#info-title")}`);
    await p.screenshot({ path: path.join(OUT, `ayuda-envios-${t.nombre}.png`) });
    await p.keyboard.press("Escape"); await p.waitForTimeout(700);
    if (!(await p.evaluate(() => document.getElementById("info").hidden))) fallas.push(`${t.nombre}: Escape no cerró`);
    if (p.url().includes("#/ayuda")) fallas.push(`${t.nombre}: dirección sin limpiar`);
    if (await p.evaluate(() => document.documentElement.classList.contains("is-locked"))) fallas.push(`${t.nombre}: scroll bloqueado`);
    // guía de tallas desde el pie y aviso de privacidad (borrador)
    await p.click('.foot a[href="#/ayuda/tallas"]'); await p.waitForTimeout(700);
    if (!(await p.$("#info-body table"))) fallas.push(`${t.nombre}: guía sin tabla`);
    await p.click(".info__close"); await p.waitForTimeout(700);
    await p.click('.foot a[href="#/legal/privacidad"]'); await p.waitForTimeout(700);
    if (await p.isHidden("#info-draft")) fallas.push(`${t.nombre}: privacidad sin aviso de borrador`);
    await p.goBack(); await p.waitForTimeout(700);
    if (!(await p.evaluate(() => document.getElementById("info").hidden))) fallas.push(`${t.nombre}: atrás no cerró la hoja`);
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  await b.close();
  return { nombre: "ayuda", ok: !fallas.length, detalle: fallas.join(" | ") || "beneficios, preguntas, hojas, contactos de prueba y pie" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
