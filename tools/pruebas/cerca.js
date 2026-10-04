/* Vista "De cerca" en la ficha: cada prenda con foto de acercamiento la tiene,
   carga solo al pedirla y dice "Foto de muestra" mientras lo sea. */
const path = require("path");
const { OUT, TAMANOS, navegador, abrir } = require("./comun");

module.exports = async function cerca() {
  const b = await navegador();
  const fallas = [];
  for (const t of [TAMANOS[0], TAMANOS[3]]) {
    const p = await abrir(b, t);
    const ids = await p.evaluate(() => window.NOMAD.items.filter((i) => i.closeup?.src).map((i) => i.id));
    if (!ids.length) fallas.push(`${t.nombre}: ninguna prenda con De cerca`);
    for (const id of ids.slice(0, 2)) {
      await p.evaluate((id) => window.NOMAD.shop.open(window.NOMAD.items.find((i) => i.id === id)), id);
      await p.waitForTimeout(1400);
      const tab = await p.$('.sheet__view[data-view="closeup"]');
      if (!tab) { fallas.push(`${t.nombre} ${id}: sin vista De cerca`); continue; }
      if (await p.$eval('.sheet__img[data-view="closeup"]', (i) => i.loading !== "lazy")) fallas.push(`${t.nombre} ${id}: la foto no es diferida`);
      await tab.click(); await p.waitForTimeout(700);
      const muestra = await p.evaluate((id) => window.NOMAD.items.find((i) => i.id === id).closeup.sample, id);
      if (muestra && await p.isHidden("#sheet-sample")) fallas.push(`${t.nombre} ${id}: la muestra no dice que es muestra`);
      if (await p.$eval('.sheet__img[data-view="closeup"]', (i) => !i.complete || !i.naturalWidth)) fallas.push(`${t.nombre} ${id}: la foto no cargó`);
      await p.screenshot({ path: path.join(OUT, `cerca-ficha-${t.nombre}-${id.slice(0, 2)}.png`) });
      await p.click('.sheet__view[data-view="front"]'); await p.waitForTimeout(500);
      if (await p.isVisible("#sheet-sample")) fallas.push(`${t.nombre} ${id}: aviso de muestra en la vista de frente`);
      await p.keyboard.press("Escape"); await p.waitForTimeout(900);
    }
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  await b.close();
  return { nombre: "cerca", ok: !fallas.length, detalle: fallas.join(" | ") || "vista De cerca en la ficha, diferida y con aviso de muestra" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
