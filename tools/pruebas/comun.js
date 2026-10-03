/* Lo que comparten todas las pruebas: la dirección del sitio, los tamaños de
   pantalla y cómo abrir una página lista para medir.

   Las librerías (GSAP, Lenis) se sirven desde node_modules si están instaladas,
   así las pruebas funcionan sin internet y siempre con las mismas versiones
   que pide index.html. */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const BASE = process.env.NOMAD_URL || "http://localhost:8765/";
const OUT = path.join(__dirname, "salida");
fs.mkdirSync(OUT, { recursive: true });

const TAMANOS = [
  { nombre: "1440", width: 1440, height: 900, touch: false },
  { nombre: "1280", width: 1280, height: 720, touch: false },
  { nombre: "820", width: 820, height: 1180, touch: true },
  { nombre: "390", width: 390, height: 844, touch: true },
  { nombre: "375", width: 375, height: 667, touch: true },
];

const NM = path.join(__dirname, "node_modules");
const LIBS = {
  "gsap.min.js": "gsap/dist/gsap.min.js",
  "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js",
  "SplitText.min.js": "gsap/dist/SplitText.min.js",
  "MotionPathPlugin.min.js": "gsap/dist/MotionPathPlugin.min.js",
  "Draggable.min.js": "gsap/dist/Draggable.min.js",
  "lenis.min.js": "lenis/dist/lenis.min.js",
};

const navegador = () => chromium.launch();

/** Abre el sitio en un tamaño y junta los errores de consola. */
async function abrir(browser, t, { reducir = false } = {}) {
  const page = await browser.newPage({
    viewport: { width: t.width, height: t.height },
    isMobile: t.touch, hasTouch: t.touch,
    reducedMotion: reducir ? "reduce" : "no-preference",
  });
  page.errores = [];
  page.on("pageerror", (e) => page.errores.push(e.message));
  // Errores de la página. Los recursos que no cargan se revisan aparte y solo los
  // del propio sitio (las fuentes de Google pueden fallar sin internet).
  page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) page.errores.push(m.text()); });
  const origen = new URL(BASE).origin;
  page.on("requestfailed", (r) => { if (r.url().startsWith(origen)) page.errores.push(`no cargó ${r.url()}`); });
  page.on("response", (r) => { if (r.url().startsWith(origen) && r.status() >= 400) page.errores.push(`${r.status()} ${r.url()}`); });
  for (const [archivo, local] of Object.entries(LIBS)) {
    const ruta = path.join(NM, local);
    if (fs.existsSync(ruta)) await page.route(`**/${archivo}`, (r) => r.fulfill({ path: ruta, contentType: "text/javascript" }));
  }
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(3500);       // entrada del perchero
  return page;
}

/** Recorre la página de arriba abajo para que se disparen todas las entradas. */
async function recorrer(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 400) {
    await page.evaluate((y) => window.NOMAD.scroll.to(y, { immediate: true }), y);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1200);
}

const ir = (page, destino) => page.evaluate((d) => window.NOMAD.scroll.to(d, { immediate: true }), destino);

module.exports = { BASE, OUT, TAMANOS, navegador, abrir, recorrer, ir };
