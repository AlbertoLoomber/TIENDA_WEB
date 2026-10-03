/* "De cerca": las líneas llegan exactas a los puntos y a los círculos en los
   cinco tamaños (también después de cambiar el tamaño de la ventana), la
   entrada ocurre una vez, el peso de las fotos y la vista "De cerca" en la ficha. */
const fs = require("fs");
const path = require("path");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

const WEB = path.join(__dirname, "..", "..", "web");

// Para cada línea: distancia del inicio al centro del punto y del final al borde del círculo.
const medir = (page) => page.evaluate(() => {
  const box = document.getElementById("closeup-stage").getBoundingClientRect();
  const dots = [...document.querySelectorAll(".closeup__dot")];
  const lines = [...document.querySelectorAll(".closeup__line")];
  const items = dots.map((_, i) => document.querySelector(`.closeup__item[data-point="${window.NOMAD.site.closeup.points[i].id}"] .closeup__circle`));
  return lines.map((ln, i) => {
    const d = ln.getAttribute("d");
    if (!d) return { vacia: true };
    const len = ln.getTotalLength();
    const a = ln.getPointAtLength(0);
    const z = ln.getPointAtLength(len);
    const dr = dots[i].getBoundingClientRect();
    const cr = items[i].getBoundingClientRect();
    const cx = cr.left + cr.width / 2 - box.left;
    const cy = cr.top + cr.height / 2 - box.top;
    return {
      inicio: Math.hypot(a.x - (dr.left + dr.width / 2 - box.left), a.y - (dr.top + dr.height / 2 - box.top)),
      borde: Math.abs(Math.hypot(z.x - cx, z.y - cy) - (cr.width / 2 + 6)),
      offset: parseFloat(getComputedStyle(ln).strokeDashoffset) || 0,
    };
  });
});

module.exports = async function cerca() {
  const b = await navegador();
  const fallas = [];
  for (const t of TAMANOS) {
    const p = await abrir(b, t);
    if (await p.isHidden("#cerca")) { fallas.push(`${t.nombre}: sección oculta`); await p.close(); continue; }
    const filas = await p.$$eval(".closeup__item", (l) => l.length);
    if (filas !== 3) fallas.push(`${t.nombre}: ${filas} detalles`);
    if (await p.$$eval(".closeup__circle img", (l) => l.some((i) => i.loading !== "lazy"))) fallas.push(`${t.nombre}: fotos sin carga diferida`);
    await ir(p, "#cerca"); await p.waitForTimeout(3200);
    const sinCargar = await p.$$eval(".closeup__circle img, #closeup-img", (l) => l.filter((i) => !i.complete || !i.naturalWidth).length);
    if (sinCargar) fallas.push(`${t.nombre}: ${sinCargar} fotos sin cargar`);
    const m = await medir(p);
    if (t.width <= 640) {
      if (m.some((x) => !x.vacia)) fallas.push(`${t.nombre}: líneas en celular`);
      if (await p.isHidden(".closeup__num-dot")) fallas.push(`${t.nombre}: puntos sin número`);
    } else {
      m.forEach((x, i) => {
        if (x.vacia) return fallas.push(`${t.nombre}: línea ${i + 1} vacía`);
        if (x.inicio > 2 || x.borde > 2) fallas.push(`${t.nombre}: línea ${i + 1} desfasada (${x.inicio.toFixed(1)} / ${x.borde.toFixed(1)} px)`);
        if (x.offset > 1) fallas.push(`${t.nombre}: línea ${i + 1} sin dibujar`);
      });
    }
    await p.screenshot({ path: path.join(OUT, `cerca-${t.nombre}.png`) });
    if (t.nombre === "1440") {
      // cambia el tamaño: las líneas se recalculan; la entrada no se repite
      await p.setViewportSize({ width: 1100, height: 800 }); await p.waitForTimeout(500);
      const r = await medir(p);
      if (r.some((x) => x.vacia || x.inicio > 2 || x.borde > 2 || x.offset > 1)) fallas.push("1100: líneas desfasadas después de cambiar el tamaño");
      const op = await p.$eval("#closeup-garment", (e) => getComputedStyle(e).opacity);
      if (op !== "1") fallas.push("la prenda volvió a esconderse");
      // la ficha de la 03 tiene la vista "De cerca", marcada como muestra
      await p.evaluate(() => window.NOMAD.shop.open(window.NOMAD.items.find((i) => i.id === "03-white-tee-dollar")));
      await p.waitForTimeout(1400);
      const tab = await p.$('.sheet__view[data-view="closeup"]');
      if (!tab) fallas.push("ficha sin vista De cerca");
      else {
        await tab.click(); await p.waitForTimeout(700);
        if (await p.isHidden("#sheet-sample")) fallas.push("ficha: la muestra no dice que es muestra");
        await p.click('.sheet__view[data-view="front"]'); await p.waitForTimeout(500);
        if (await p.isVisible("#sheet-sample")) fallas.push("ficha: aviso de muestra en la vista de frente");
      }
    }
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  // Peso: las fotos de la sección, menos de 250 KB en total.
  const data = JSON.parse(fs.readFileSync(path.join(WEB, "prendas.json"), "utf8"));
  const kb = data.site.closeup.points.reduce((s, x) => s + (x.photo ? fs.statSync(path.join(WEB, x.photo.src)).size : 0), 0) / 1024;
  if (kb > 250) fallas.push(`fotos de De cerca: ${kb.toFixed(0)} KB`);
  await b.close();
  return { nombre: "cerca", ok: !fallas.length, detalle: fallas.join(" | ") || `líneas exactas en 5 tamaños y al cambiar el tamaño, ficha con De cerca, fotos ${kb.toFixed(0)} KB` };
};
if (require.main === module) module.exports().then((r) => console.log(r));
