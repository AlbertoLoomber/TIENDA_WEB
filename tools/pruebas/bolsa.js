/* Bolsa: agregar desde la ficha y el cajón, cantidades, quitar, recargar,
   almacenamiento bloqueado, teclado, vuelo y barra fija en celular. */
const path = require("path");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

async function abrirFicha(p, n = 6) {
  await ir(p, "#shop"); await p.waitForTimeout(1500);
  await p.click(`.piece:nth-child(${n}) .piece__hang`); await p.waitForTimeout(1400);
}
const cuenta = (p) => p.evaluate(() => window.NOMAD.bag.count());

module.exports = async function bolsa() {
  const b = await navegador();
  const fallas = [];
  const t = TAMANOS[0];

  // 1. ficha → sin talla no agrega; con talla agrega y vuela
  let p = await abrir(b, t);
  await p.evaluate(() => localStorage.clear());
  await abrirFicha(p, 6);
  await p.click("#sheet-add"); await p.waitForTimeout(400);
  if (await cuenta(p) !== 0) fallas.push("agregó sin talla");
  if (!(await p.textContent("#sheet-status")).includes("Elige")) fallas.push("no pidió talla");
  await p.click("#sheet-sizes button:nth-child(2)");
  await p.click("#sheet-add"); await p.waitForTimeout(300);
  if (!(await p.$(".fly"))) fallas.push("no hubo vuelo");
  await p.waitForTimeout(900);
  if (await p.$(".fly")) fallas.push("la copia del vuelo no se borró");
  await p.click("#sheet-add"); await p.waitForTimeout(1100);
  await p.click("#sheet-sizes button:nth-child(3)"); await p.click("#sheet-add"); await p.waitForTimeout(1400);
  if (await cuenta(p) !== 3) fallas.push(`cuenta ${await cuenta(p)} en vez de 3`);
  const sheetBadge = await p.textContent(".sheet__bag [data-bag-count]");
  if (sheetBadge.trim() !== "3") fallas.push(`contador de la ficha: ${sheetBadge}`);
  // 2. abrir la bolsa desde la ficha, cambiar cantidad y quitar
  await p.click(".sheet__bag"); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, "bolsa-llena.png") });
  const lineas = await p.$$eval(".bag__line", (l) => l.length);
  if (lineas !== 2) fallas.push(`${lineas} líneas en vez de 2`);
  const sub = await p.textContent("#bag-subtotal");
  if (!sub.includes("2,070")) fallas.push(`subtotal ${sub}`);
  if (!(await p.textContent("#bag-ship-text")).includes("gratis")) fallas.push("texto de envío");
  await p.click('.bag__line:nth-child(2) .bag__remove'); await p.waitForTimeout(700);
  await p.click('.bag__line:nth-child(1) .bag__step[data-step="-1"]'); await p.waitForTimeout(400);
  if (await cuenta(p) !== 1) fallas.push(`tras quitar: ${await cuenta(p)}`);
  // 3. Escape cierra la bolsa y deja la ficha abierta
  await p.keyboard.press("Escape"); await p.waitForTimeout(600);
  if (!(await p.evaluate(() => document.getElementById("bag").hidden))) fallas.push("Escape no cerró la bolsa");
  if (await p.evaluate(() => document.getElementById("sheet").hidden)) fallas.push("Escape cerró también la ficha");
  if (await p.evaluate(() => document.getElementById("sheet").inert)) fallas.push("la ficha quedó inerte");
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500);
  // 4. recargar conserva
  await p.reload(); await p.waitForTimeout(3500);
  if (await cuenta(p) !== 1) fallas.push("no se conservó al recargar");
  // 5. cajón del detalle
  await ir(p, 0); await p.waitForTimeout(500);
  await p.click("#see"); await p.waitForTimeout(1500);
  await p.click("#detail-see"); await p.waitForTimeout(700);
  await p.click("#drawer-add"); await p.waitForTimeout(300);
  if (await cuenta(p) !== 1) fallas.push("el cajón agregó sin talla");
  await p.click("#drawer-sizes button:nth-child(1)"); await p.click("#drawer-add"); await p.waitForTimeout(1200);
  if (await cuenta(p) !== 2) fallas.push("el cajón no agregó");
  // 6. bolsa vacía
  await p.evaluate(() => { localStorage.clear(); });
  await p.click("#close"); await p.waitForTimeout(1500);
  if (p.errores.length) fallas.push(`consola: ${p.errores.join(" / ")}`);
  await p.close();

  // 7. almacenamiento bloqueado
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("bloqueado"); } }); });
  p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const { BASE } = require("./comun");
  for (const [f, l] of Object.entries({ "gsap.min.js": "gsap/dist/gsap.min.js", "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js", "SplitText.min.js": "gsap/dist/SplitText.min.js", "lenis.min.js": "lenis/dist/lenis.min.js" }))
    await p.route(`**/${f}`, (r) => r.fulfill({ path: path.join(__dirname, "node_modules", l), contentType: "text/javascript" }));
  await p.goto(BASE); await p.waitForTimeout(3500);
  await p.click("#bag-open"); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, "bolsa-vacia.png") });
  if (!(await p.isVisible("#bag-empty"))) fallas.push("bolsa vacía no se ve");
  if (errs.length) fallas.push(`sin almacenamiento: ${errs.join(" / ")}`);
  await ctx.close();

  // 8. celular: barra fija y panel a pantalla completa
  p = await abrir(b, TAMANOS[3]);
  await abrirFicha(p, 6);
  await p.waitForTimeout(500);
  const barra = await p.evaluate(() => !document.getElementById("sheet-sticky").hidden);
  if (!barra) fallas.push("celular: no apareció la barra fija");
  await p.screenshot({ path: path.join(OUT, "bolsa-barra-celular.png") });
  await p.click("#sticky-add"); await p.waitForTimeout(800);
  if (!(await p.textContent("#sheet-status")).includes("Elige")) fallas.push("celular: barra sin talla no avisó");
  // al elegir la talla el botón principal queda a la vista y la barra se va;
  // al volver arriba regresa, ya con la talla elegida
  await p.click("#sheet-sizes button:nth-child(2)"); await p.waitForTimeout(500);
  if (!(await p.evaluate(() => document.getElementById("sheet-sticky").hidden))) fallas.push("celular: la barra no se fue con el botón a la vista");
  await p.evaluate(() => { document.getElementById("sheet-panel").scrollTop = 0; }); await p.waitForTimeout(700);
  if (!(await p.textContent("#sticky-meta")).includes("Talla M")) fallas.push("celular: la barra no muestra la talla");
  await p.click("#sticky-add"); await p.waitForTimeout(1200);
  if (await cuenta(p) !== 1) fallas.push("celular: la barra no agregó");
  await p.click(".sheet__bag"); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, "bolsa-celular.png") });
  if (p.errores.length) fallas.push(`celular consola: ${p.errores.join(" / ")}`);
  await p.close();
  await b.close();
  return { nombre: "bolsa", ok: !fallas.length, detalle: fallas.join(" | ") || "agregar, cantidades, quitar, recargar, sin almacenamiento, teclado y barra fija" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
