/* Interacciones de la fase 3: el barrido del cursor mece las prendas (máx. 5°
   y vuelven a reposo), un barrido lento no, y arrastrar en la ficha gira la
   prenda y termina en una vista exacta. */
const path = require("path");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

const angulos = (p) => p.evaluate(() => [...document.querySelectorAll(".slot__swing")].map((s) => Math.abs(gsap.getProperty(s, "rotation"))));

// El barrido se simula dentro de la página con eventos de puntero, al ritmo del
// reloj del navegador: desde la prueba cada movimiento tarda demasiado en llegar
// (el navegador de pruebas dibuja sin tarjeta gráfica) y el barrido saldría lento.
async function barrer(p, velocidad) {
  return p.evaluate((v) => new Promise((done) => {
    const rack = document.getElementById("rack");
    const r = rack.getBoundingClientRect();
    const y = r.top + r.height * 0.6;
    const x0 = r.left + 4, dist = r.width * 0.9;
    const t0 = performance.now();
    let over = null, max = 0, events = 0;
    const fire = (el, type, x) => el.dispatchEvent(new PointerEvent(type, { pointerType: "mouse", clientX: x, clientY: y, bubbles: type === "pointermove" }));
    const step = () => {
      const t = performance.now() - t0;
      const x = x0 + Math.min(dist, v * t);
      const slot = document.elementFromPoint(x, y)?.closest(".slot") || null;
      if (slot !== over) { if (over) fire(over, "pointerleave", x); if (slot) fire(slot, "pointerenter", x); over = slot; }
      fire(slot || rack, "pointermove", x);
      events++;
      document.querySelectorAll(".slot__swing").forEach((s) => { max = Math.max(max, Math.abs(gsap.getProperty(s, "rotation"))); });
      if (x < x0 + dist) return setTimeout(step, 12);
      if (over) fire(over, "pointerleave", x);
      fire(rack, "pointerleave", x);
      done({ max, real: dist / (performance.now() - t0), events });
    };
    step();
  }), velocidad);
}

module.exports = async function movimiento() {
  const b = await navegador();
  const fallas = [];
  const p = await abrir(b, TAMANOS[0]);
  await p.waitForTimeout(8000);          // que termine la entrada y la brisa inicial
  // rápido: 1.2 px/ms. Mece sin girar ninguna prenda (el cursor nunca se detiene).
  const activa = () => p.evaluate(() => [...document.querySelectorAll(".slot")].findIndex((s) => s.classList.contains("is-active")));
  const antes = await activa();
  const { max, real } = await barrer(p, 1.2);
  if (real < 0.8) fallas.push(`la prueba no logró barrer rápido (${real.toFixed(2)} px/ms)`);
  if ((await activa()) !== antes) fallas.push("el barrido rápido giró una prenda");
  if (max < 1) fallas.push(`el barrido rápido no meció (máx. ${max.toFixed(1)}°)`);
  if (max > 5.5) fallas.push(`se meció de más (${max.toFixed(1)}°)`);
  await p.waitForTimeout(2300);
  const resto = Math.max(...(await angulos(p)));
  if (resto > 0.3) fallas.push(`no volvió a reposo (${resto.toFixed(2)}°)`);
  // lento: 0.25 px/ms. Al detenerse sobre las prendas las gira, como siempre.
  await p.waitForTimeout(1500);
  await barrer(p, 0.25);
  await p.waitForTimeout(1500);

  // arrastrar en la ficha
  await ir(p, "#shop"); await p.waitForTimeout(1600);
  await p.click(".piece:nth-child(3) .piece__hang"); await p.waitForTimeout(1500);
  const st = await p.evaluate(() => { const r = document.getElementById("sheet-stage").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
  await p.mouse.move(st.x, st.y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(st.x - (st.w * 0.3 * i) / 12, st.y); await p.waitForTimeout(16); }
  await p.screenshot({ path: path.join(OUT, "movimiento-arrastre.png") });
  await p.mouse.up(); await p.waitForTimeout(900);
  const vista = await p.evaluate(() => document.querySelector("#sheet-stage .sheet__img.is-on")?.dataset.view);
  const tab = await p.evaluate(() => document.querySelector('.sheet__view[aria-selected="true"]')?.dataset.view);
  if (vista !== "side" || tab !== "side") fallas.push(`tras arrastrar: vista ${vista}, pestaña ${tab}`);
  if (await p.$(".sheet__turn")) fallas.push("quedó la capa del giro");
  // arrastre corto hacia el otro lado: resiste y vuelve a frente
  await p.click('.sheet__view[data-view="front"]'); await p.waitForTimeout(600);
  await p.mouse.move(st.x, st.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(st.x + (st.w * 0.25 * i) / 8, st.y); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(900);
  const vista2 = await p.evaluate(() => document.querySelector("#sheet-stage .sheet__img.is-on")?.dataset.view);
  if (vista2 !== "front") fallas.push(`el lado sin foto no regresó a frente (${vista2})`);
  // teclado
  await p.focus("#sheet-stage"); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(600);
  if (await p.evaluate(() => document.querySelector("#sheet-stage .sheet__img.is-on")?.dataset.view) !== "side") fallas.push("flecha izquierda no mostró el lado");
  if (p.errores.length) fallas.push(`consola: ${p.errores.join(" / ")}`);
  await b.close();
  return { nombre: "movimiento", ok: !fallas.length, detalle: fallas.join(" | ") || `barrido rápido ${max.toFixed(1)}° sin girar y en reposo después, arrastre, lado que resiste y teclado` };
};
if (require.main === module) module.exports().then((r) => console.log(r));
