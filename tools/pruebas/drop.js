/* Drop 02: fecha y cuenta regresiva, cambio de minuto alineado al reloj, los
   dígitos que no se mueven de lugar, el estado "después", y la prenda tapada que
   se columpia sin chocar con la etiqueta. */
const path = require("path");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

const leer = (p) => p.evaluate(() => ({
  ceja: document.getElementById("tag-eyebrow").textContent,
  titulo: document.getElementById("newsletter-title").textContent,
  cuenta: [...document.querySelectorAll(".count__num")].map((n) => [...n.querySelectorAll(".count__d")].map((d) => d.lastElementChild.textContent).join("")),
  oculto: document.getElementById("drop-count").hidden,
  forma: !document.getElementById("newsletter-form").hidden,
  ver: !document.getElementById("drop-see").hidden,
  voz: document.getElementById("drop-left").textContent,
  xs: [...document.querySelectorAll(".count__unit, .count__d")].map((u) => u.offsetLeft),   // sin el columpio
}));

module.exports = async function drop() {
  const b = await navegador();
  const fallas = [];
  // Antes: en los cinco tamaños
  for (const t of TAMANOS) {
    const p = await abrir(b, t);
    await ir(p, "#newsletter"); await p.waitForTimeout(400);
    // Lo esperado justo antes y justo después de leer: si el minuto cambia en
    // medio, cualquiera de los dos vale.
    const r0 = await p.evaluate(() => window.NOMAD.drop.remaining());
    const e = await leer(p);
    const r1 = await p.evaluate(() => window.NOMAD.drop.remaining());
    if (!/^Drop 02 · \S+ \d+ \S+ · 20:00 h$/.test(e.ceja)) fallas.push(`${t.nombre}: encabezado "${e.ceja}"`);
    if (e.oculto || !e.forma) fallas.push(`${t.nombre}: sin cuenta o sin formulario`);
    const como = (r) => [r.days, r.hours, r.min].map((n) => String(n).padStart(2, "0")).join();
    if (e.cuenta.join() !== como(r0) && e.cuenta.join() !== como(r1)) fallas.push(`${t.nombre}: cuenta ${e.cuenta} ≠ ${como(r1)}`);
    if (!e.voz.startsWith("Faltan")) fallas.push(`${t.nombre}: texto oculto "${e.voz}"`);
    // clientWidth, no innerWidth: en celular innerWidth crece con lo que se desborda
    const desborda = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (desborda) fallas.push(`${t.nombre}: la página se sale a lo ancho`);
    const conPrenda = await p.isVisible("#drop-hang");
    if (conPrenda !== (t.width > 820)) fallas.push(`${t.nombre}: prenda tapada ${conPrenda ? "visible" : "oculta"}`);
    if (conPrenda) {
      // se columpian: la funda nunca toca la etiqueta
      await p.evaluate(() => window.scrollBy(0, -innerHeight)); await p.waitForTimeout(300);
      await ir(p, "#newsletter");
      let choque = 0;
      for (let i = 0; i < 30; i++) {
        choque = Math.max(choque, await p.evaluate(() => {
          const a = document.getElementById("drop-swing").getBoundingClientRect();
          const z = document.getElementById("tag").getBoundingClientRect();
          return a.right - z.left;
        }));
        await p.waitForTimeout(100);
      }
      if (choque > 0) fallas.push(`${t.nombre}: la funda se encima ${choque.toFixed(0)} px con la etiqueta`);
    }
    await p.waitForTimeout(2000);
    await p.screenshot({ path: path.join(OUT, `drop-antes-${t.nombre}.png`) });
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  // Después: ?drop=despues
  for (const t of [TAMANOS[1], TAMANOS[3]]) {
    const p = await abrir(b, t, { ruta: "?drop=despues" });
    await ir(p, "#newsletter"); await p.waitForTimeout(2500);
    const e = await leer(p);
    if (!e.ceja.endsWith("ya disponible") || !e.oculto || e.forma || !e.ver) fallas.push(`${t.nombre}: estado después incompleto (${e.ceja})`);
    await p.screenshot({ path: path.join(OUT, `drop-despues-${t.nombre}.png`) });
    await p.close();
  }
  // El minuto cambia a tiempo y, al llegar la hora, la etiqueta pasa a "ya disponible"
  {
    const t = TAMANOS[0];
    const p = await abrir(b, t, { antes: (pg) => pg.clock.install({ time: new Date("2026-10-24T19:58:30-06:00") }) });
    await ir(p, "#newsletter"); await p.waitForTimeout(500);
    const a = await leer(p);
    if (a.cuenta.join() !== "00,00,01") fallas.push(`reloj: cuenta ${a.cuenta} a las 19:58`);
    await p.clock.fastForward(60000); await p.waitForTimeout(800);
    const z = await leer(p);
    if (z.cuenta.join() !== "00,00,00") fallas.push(`reloj: cuenta ${z.cuenta} a las 19:59`);
    if (a.xs.join() !== z.xs.join()) fallas.push(`reloj: los dígitos se movieron (${a.xs} → ${z.xs})`);
    await p.clock.fastForward(31000); await p.waitForTimeout(800);
    const d = await leer(p);
    if (!d.ceja.endsWith("ya disponible")) fallas.push(`reloj: a las 20:00 dice "${d.ceja}"`);
    await p.close();
  }
  await b.close();
  return { nombre: "drop", ok: !fallas.length, detalle: fallas.join(" | ") || "fecha y cuenta en 5 tamaños, minuto a tiempo, dígitos quietos, estado después y sin choques" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
