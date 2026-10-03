/* Corre todas las pruebas y termina con un resumen. Sale con código 1 si alguna falla. */
const pruebas = ["letra", "accesibilidad", "restos", "bolsa", "enlaces", "recomendador", "ayuda", "movimiento", "rendimiento", "capturas"];
(async () => {
  const solo = process.argv.slice(2);
  const res = [];
  for (const n of pruebas.filter((n) => !solo.length || solo.includes(n))) {
    process.stdout.write(`… ${n}\n`);
    try { res.push(await require(`./${n}`)()); }
    catch (e) { res.push({ nombre: n, ok: false, detalle: e.message }); }
  }
  console.log("\nResumen");
  res.forEach((r) => console.log(`${r.ok ? "✔" : "✘"} ${r.nombre}: ${r.detalle}`));
  process.exit(res.every((r) => r.ok) ? 0 : 1);
})();
