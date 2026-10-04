/* Video lado a lado para decidir el giro (T4.1): a la izquierda el giro actual
   de dos fotos (?giro=foto), a la derecha el giro real. Las dos mitades giran
   la misma prenda al mismo tiempo, tres veces.

   tools/pruebas/con-servidor.sh node tools/pruebas/comparar_giro.js [--prueba] [--prenda 06-cream-tee-nomad]
     --prueba  usa los cuadros del video sintético (sin video real todavía)
   Sale en tools/pruebas/salida/giro-comparacion.webm */
const fs = require("fs");
const path = require("path");
const { BASE, OUT, navegador } = require("./comun");
const { conGiro, cuadros } = require("./giro");

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const prueba = process.argv.includes("--prueba");
const ID = arg("--prenda") || "06-cream-tee-nomad";
const NM = path.join(__dirname, "node_modules");
const LIBS = { "gsap.min.js": "gsap/dist/gsap.min.js", "ScrollTrigger.min.js": "gsap/dist/ScrollTrigger.min.js", "SplitText.min.js": "gsap/dist/SplitText.min.js", "lenis.min.js": "lenis/dist/lenis.min.js" };

(async () => {
  const b = await navegador();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 800 }, recordVideo: { dir: OUT, size: { width: 1600, height: 800 } } });
  for (const [f, l] of Object.entries(LIBS)) await ctx.route(`**/${f}`, (r) => r.fulfill({ path: path.join(NM, l), contentType: "text/javascript" }));
  const page = await ctx.newPage();
  if (prueba) await conGiro(cuadros(), { antes: 0, chicos: new Set(), grandes: new Set(), cargada: true })(page);
  const html = `<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;background:#e7e6e1;font:500 14px Arial;color:#242c52}
    figure{margin:0;position:relative}iframe{width:800px;height:800px;border:0;display:block}
    figcaption{position:absolute;left:0;right:0;top:76px;text-align:center;letter-spacing:.12em}</style>
    <figure><iframe src="${BASE}?giro=foto"></iframe><figcaption>GIRO ACTUAL (2 FOTOS)</figcaption></figure>
    <figure><iframe src="${BASE}"></iframe><figcaption>GIRO REAL (${prueba ? "VIDEO DE PRUEBA" : "VIDEO"})</figcaption></figure>`;
  await page.setContent(html);
  await page.waitForTimeout(8000);   // entrada y descarga de los cuadros en tiempo libre
  const frames = page.frames().filter((f) => f !== page.mainFrame());
  const turn = (to) => Promise.all(frames.map((f) => f.evaluate(([id, to]) => {
    const N = window.NOMAD;
    const it = N.items.find((i) => i.id === id);
    const opts = { bubbles: false, pointerType: "mouse" };
    if (to) it.slot.dispatchEvent(new PointerEvent("pointerenter", opts));
    else it.slot.parentElement.dispatchEvent(new PointerEvent("pointerleave", opts));
  }, [ID, to])));
  // Que ninguna mitad empiece con otra prenda girada.
  await Promise.all(frames.map((f) => f.evaluate(() => document.querySelector(".rack__row")?.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" })))));
  await page.waitForTimeout(1500);
  for (let k = 0; k < 3; k++) {
    await turn(true); await page.waitForTimeout(1800);
    await turn(false); await page.waitForTimeout(1800);
  }
  const video = page.video();
  await ctx.close();
  const dest = path.join(OUT, "giro-comparacion.webm");
  fs.renameSync(await video.path(), dest);
  await b.close();
  console.log("escrito", path.relative(process.cwd(), dest));
})();
