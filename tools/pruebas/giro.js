/* Giro real (T4.1), con los cuadros del video de prueba (tools/cuadros_video.py --prueba):
   no se descargan antes de que cargue la página, después reemplazan al giro de
   dos fotos en la 03, el fundido nunca deja la prenda transparente, ?giro=foto
   lo apaga y la ficha arrastra con los cuadros grandes. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { OUT, TAMANOS, navegador, abrir } = require("./comun");

const ROOT = path.join(__dirname, "..", "..");
const DIR = path.join(OUT, "giro-prueba");
const ID = "03-white-tee-dollar";

function cuadros() {
  if (!fs.existsSync(path.join(DIR, "11-700.webp"))) {
    execFileSync("python3", [path.join(ROOT, "tools", "cuadros_video.py"), "--prueba"], { stdio: "ignore" });
  }
  return fs.readdirSync(DIR).filter((f) => /^\d\d\.webp$/.test(f)).sort();
}

// prendas.json con giro para la 03 y los cuadros servidos desde la salida de la prueba.
const conGiro = (lista, registro) => async (page) => {
  await page.route("**/prendas.json", async (route) => {
    const res = await route.fetch();
    const data = await res.json();
    const it = data.items.find((i) => i.id === ID);
    it.spin = { frames: lista.map((f, k) => ({
      angle: Math.round(80 - (80 * k) / (lista.length - 1)),
      src: `prendas/${ID}/giro-prueba/${f}`, small: `prendas/${ID}/giro-prueba/${f.replace(".webp", "-700.webp")}`,
      left: k === lista.length - 1 ? it.frames.at(-1).left : it.frames[0].left + ((it.frames.at(-1).left - it.frames[0].left) * k) / (lista.length - 1),
      right: k === lista.length - 1 ? it.frames.at(-1).right : it.frames[0].right + ((it.frames.at(-1).right - it.frames[0].right) * k) / (lista.length - 1),
    })) };
    await route.fulfill({ response: res, json: data });
  });
  await page.route("**/giro-prueba/*", (r) => r.fulfill({ path: path.join(DIR, path.basename(new URL(r.request().url()).pathname)), contentType: "image/webp" }));
  page.on("load", () => { registro.cargada = true; });
  page.on("request", (r) => {
    if (!r.url().includes("/giro-prueba/")) return;
    if (!registro.cargada) registro.antes++;
    // direcciones únicas: el interceptor no usa la caché del navegador
    (r.url().endsWith("-700.webp") ? registro.chicos : registro.grandes).add(r.url());
  });
};

const estado = (p) => p.evaluate((id) => {
  const it = window.NOMAD.items.find((i) => i.id === id);
  const vis = it.turn.imgs.map((im) => parseFloat(im.style.opacity || "0"));
  return { video: !!it.turn.video, n: it.turn.imgs.length, vis };
}, ID);

module.exports = async function giro() {
  const lista = cuadros();
  const b = await navegador();
  const fallas = [];
  if (lista.length !== 12) fallas.push(`${lista.length} cuadros en el video de prueba`);

  const t = TAMANOS[0];
  const reg = { antes: 0, chicos: new Set(), grandes: new Set(), cargada: false };
  const p = await abrir(b, t, { antes: conGiro(lista, reg) });
  await p.waitForTimeout(1500);
  if (reg.antes) fallas.push(`${reg.antes} cuadros pedidos antes de cargar la página`);
  if (reg.chicos.size !== 12) fallas.push(`${reg.chicos.size} cuadros chicos descargados en tiempo libre`);
  // ya en reposo, la 03 usa el giro real
  await p.mouse.move(5, 500); await p.waitForTimeout(1500);
  const e = await estado(p);
  if (!e.video || e.n !== 12) fallas.push(`la 03 no tomó el giro real (${e.n} cuadros)`);
  // girarla: en todo momento hay un cuadro opaco y como mucho dos visibles
  const slot = await p.evaluate((id) => { const r = window.NOMAD.items.find((i) => i.id === id).slot.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, ID);
  await p.mouse.move(slot[0], slot[1]);
  let peor = null;
  for (let i = 0; i < 14; i++) {
    await p.waitForTimeout(70);
    const s = await estado(p);
    const visibles = s.vis.filter((v) => v > 0.01).length;
    // lo que se ve es la suma de las capas: 1 − Π(1 − opacidad)
    const total = 1 - s.vis.reduce((a, v) => a * (1 - v), 1);
    if (total < 0.97 || visibles > 2) peor = s.vis.map((v) => v.toFixed(2)).join(" ");
  }
  if (peor) fallas.push(`fundido con la prenda transparente: ${peor}`);
  await p.waitForTimeout(900);
  const fin = await estado(p);
  if (fin.vis.at(-1) !== 1 || fin.vis.slice(0, -1).some((v) => v > 0)) fallas.push(`al terminar no queda de frente (${fin.vis.join(" ")})`);
  await p.screenshot({ path: path.join(OUT, "giro-real-perchero.png") });
  // la ficha descarga los grandes y el arrastre los usa
  await p.evaluate((id) => window.NOMAD.shop.open(window.NOMAD.items.find((i) => i.id === id)), ID);
  await p.waitForTimeout(1800);
  if (reg.grandes.size !== 12) fallas.push(`ficha: ${reg.grandes.size} cuadros grandes`);
  const st = await p.$eval("#sheet-stage", (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.move(st[0], st[1]); await p.mouse.down();
  await p.mouse.move(st[0] - 60, st[1], { steps: 6 });
  const nArr = await p.$$eval(".sheet__turn img", (l) => l.length);
  if (nArr !== 12) fallas.push(`ficha: el arrastre usa ${nArr} cuadros`);
  await p.screenshot({ path: path.join(OUT, "giro-real-ficha.png") });
  await p.mouse.up(); await p.waitForTimeout(900);
  if (p.errores.length) fallas.push(`consola: ${p.errores.join(" / ")}`);
  await p.close();

  // ?giro=foto: nada cambia
  const reg2 = { antes: 0, chicos: new Set(), grandes: new Set(), cargada: false };
  const q = await abrir(b, t, { ruta: "?giro=foto", antes: conGiro(lista, reg2) });
  await q.waitForTimeout(1500);
  const e2 = await estado(q);
  if (e2.video || reg2.chicos.size) fallas.push("?giro=foto no apagó el giro real");
  await q.close();

  await b.close();
  return { nombre: "giro", ok: !fallas.length, detalle: fallas.join(" | ") || "12 cuadros después de cargar, fundido sin transparencias, termina de frente, ficha con cuadros grandes y ?giro=foto" };
};
module.exports.conGiro = conGiro;
module.exports.cuadros = cuadros;
if (require.main === module) module.exports().then((r) => console.log(r));
