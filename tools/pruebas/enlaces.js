/* Enlace propio por prenda, botón atrás, enlace inválido, compartir y tallas rápidas. */
const path = require("path");
const { OUT, TAMANOS, BASE, navegador, abrir, ir } = require("./comun");

module.exports = async function enlaces() {
  const b = await navegador();
  const fallas = [];
  const t = TAMANOS[0];
  let p = await abrir(b, t);
  // abrir desde la colección pone la dirección; atrás la cierra
  await ir(p, "#shop"); await p.waitForTimeout(1500);
  await p.click(".piece:nth-child(5) .piece__hang"); await p.waitForTimeout(1400);
  if (!p.url().endsWith("#/prenda/create-good-habits-crewneck")) fallas.push(`dirección al abrir: ${p.url()}`);
  if (!(await p.title()).startsWith("Create Good Habits Crewneck")) fallas.push(`título: ${await p.title()}`);
  await p.goBack(); await p.waitForTimeout(1500);
  if (!(await p.evaluate(() => document.getElementById("sheet").hidden))) fallas.push("atrás no cerró la ficha");
  if (p.url().includes("#/prenda")) fallas.push("la dirección no volvió");
  // cerrar con el botón deja la dirección limpia
  await p.click(".piece:nth-child(2) .piece__hang"); await p.waitForTimeout(1400);
  await p.click(".sheet__close"); await p.waitForTimeout(1500);
  if (p.url().includes("#/prenda")) fallas.push("cerrar no limpió la dirección");
  // compartir (sin navigator.share en este navegador): copiar enlace
  await p.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(BASE).origin });
  await p.click(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(1400);
  const hasShare = await p.evaluate(() => !!navigator.share);
  if (!hasShare) {
    await p.click("#sheet-share"); await p.waitForTimeout(200);
    if (await p.isHidden("#share-menu")) fallas.push("no abrió el menú de compartir");
    const wa = await p.getAttribute("#share-wa", "href");
    if (!wa.startsWith("https://wa.me/?text=") || !decodeURIComponent(wa).includes("#/prenda/more-than-money-tee")) fallas.push(`enlace de WhatsApp: ${wa}`);
    await p.click("#share-copy"); await p.waitForTimeout(300);
    const copied = await p.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    if (!copied.endsWith("#/prenda/more-than-money-tee")) fallas.push(`copiado: ${copied}`);
  }
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500);
  // tallas rápidas: con el cursor encima aparecen y agregan sin abrir la ficha
  await p.evaluate(() => localStorage.removeItem("nomad.bolsa.v1"));
  await ir(p, "#shop"); await p.waitForTimeout(800);
  await p.hover(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "tallas-rapidas.png") });
  await p.click(".piece:nth-child(3) .piece__size:nth-child(2)"); await p.waitForTimeout(1300);
  if (!(await p.evaluate(() => document.getElementById("sheet").hidden))) fallas.push("talla rápida abrió la ficha");
  if (await p.evaluate(() => window.NOMAD.bag.count()) !== 1) fallas.push("talla rápida no agregó");
  if (!(await p.evaluate(() => document.querySelector(".piece:nth-child(1) .piece__size:nth-child(4)").disabled))) fallas.push("XL de Camo debería estar agotada");
  if (p.errores.length) fallas.push(`consola: ${p.errores.join(" / ")}`);
  await p.close();
  // enlace directo y enlace inválido
  for (const [hash, espera] of [["#/prenda/good-people-tee", "Good People Tee"], ["#/prenda/no-existe", null]]) {
    p = await abrirEn(b, t, hash);
    const open = !(await p.evaluate(() => document.getElementById("sheet").hidden));
    if (espera && (!open || (await p.textContent("#sheet-name")) !== espera)) fallas.push(`${hash} no abrió ${espera}`);
    if (!espera && (open || p.url().includes("#/prenda"))) fallas.push(`${hash} no se ignoró`);
    if (p.errores.length) fallas.push(`${hash} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  await b.close();
  return { nombre: "enlaces", ok: !fallas.length, detalle: fallas.join(" | ") || "abrir, atrás, cerrar, compartir, enlace directo, inválido y tallas rápidas" };
};

// abrir() de comun.js va a la portada; aquí la misma preparación pero con un hash.
async function abrirEn(b, t, hash) {
  const comun = require("./comun");
  const orig = comun.BASE;
  const page = await b.newPage({ viewport: { width: t.width, height: t.height } });
  page.errores = [];
  page.on("pageerror", (e) => page.errores.push(e.message));
  const fs = require("fs");
  const NM = path.join(__dirname, "node_modules");
  for (const [f, l] of Object.entries({ "gsap.min.js": "gsap/dist/gsap.min.js", "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js", "SplitText.min.js": "gsap/dist/SplitText.min.js", "lenis.min.js": "lenis/dist/lenis.min.js" }))
    if (fs.existsSync(path.join(NM, l))) await page.route(`**/${f}`, (r) => r.fulfill({ path: path.join(NM, l), contentType: "text/javascript" }));
  await page.goto(orig + hash); await page.waitForTimeout(4000);
  return page;
}
if (require.main === module) module.exports().then((r) => console.log(r));
