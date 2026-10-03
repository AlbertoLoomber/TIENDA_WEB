/* Peso de la carga inicial, LCP, saltos de diseño y archivos faltantes. */
const { TAMANOS, navegador, abrir } = require("./comun");
const LIMITE_KB = 1300;

module.exports = async function rendimiento() {
  const b = await navegador();
  const fallas = [], notas = [];
  for (const t of TAMANOS.filter((t) => ["1440", "390"].includes(t.nombre))) {
    const page = await abrir(b, t);
    const faltan = [];
    page.on("response", (r) => { if (r.status() >= 400) faltan.push(`${r.status()} ${r.url()}`); });
    const m = await page.evaluate(() => new Promise((res) => {
      let lcp = 0, cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { lcp = e.startTime; })).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) cls += e.value; })).observe({ type: "layout-shift", buffered: true });
      setTimeout(() => {
        const kb = performance.getEntriesByType("resource").reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) / 1024;
        res({ kb: Math.round(kb), lcp: Math.round(lcp), cls: +cls.toFixed(3) });
      }, 300);
    }));
    notas.push(`${t.nombre}: ${m.kb} KB, LCP ${m.lcp} ms, CLS ${m.cls}`);
    if (m.kb > LIMITE_KB) fallas.push(`${t.nombre}: ${m.kb} KB (> ${LIMITE_KB})`);
    if (m.cls >= 0.1) fallas.push(`${t.nombre}: CLS ${m.cls}`);
    if (faltan.length) fallas.push(`${t.nombre}: ${faltan.join(", ")}`);
    if (page.errores.length) fallas.push(`${t.nombre} consola: ${page.errores.join(" / ")}`);
    await page.close();
  }
  await b.close();
  return { nombre: "rendimiento", ok: !fallas.length, detalle: [...fallas, ...notas].join(" | ") };
};
if (require.main === module) module.exports().then((r) => console.log(r));
