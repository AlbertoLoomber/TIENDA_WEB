/* Fase 4 sin pin: "Cómo se hace" (el gancho sigue a las tarjetas con el scroll o
   el deslizamiento), "Así se usa" (cada foto abre su ficha, leyenda de muestra) y
   los clips en loop (no cargan antes de acercarse, se reproducen a la vista, se
   pausan al salir y no existen con "reducir movimiento"). El clip de prueba
   sale de tools/comprimir_video.py con videos sintéticos. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { OUT, TAMANOS, navegador, abrir, ir } = require("./comun");

const ROOT = path.join(__dirname, "..", "..");
const VID = path.join(OUT, "video");

// Clip sintético (una vez): un acercamiento lento sobre la foto del estudio.
function clipsDePrueba() {
  if (fs.existsSync(path.join(VID, "video-estudio.webm"))) return;
  const tmp = path.join(OUT, "video-crudo");
  fs.mkdirSync(tmp, { recursive: true });
  const py = `
import cv2, numpy as np
from PIL import Image
def kb(src, out, size, secs=4):
    im = np.array(Image.open(src).convert('RGB'))[:, :, ::-1]
    W, H = size
    vw = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*'mp4v'), 24, (W, H))
    for i in range(secs * 24):
        z = 1 + 0.06 * np.sin(np.pi * i / (secs * 24))
        h, w = im.shape[:2]; s = max(W / w, H / h) * z
        r = cv2.resize(im, (int(w * s) + 1, int(h * s) + 1)); y = (r.shape[0] - H) // 2; x = (r.shape[1] - W) // 2
        vw.write(r[y:y + H, x:x + W])
    vw.release()
kb('web/fotos/studio.webp', '${tmp}/video-estudio.mp4', (1920, 1080))
`;
  execFileSync("python3", ["-c", py], { cwd: ROOT, stdio: "ignore" });
  execFileSync("python3", [path.join(ROOT, "tools", "comprimir_video.py"), "--salida", VID,
    path.join(tmp, "video-estudio.mp4")], { cwd: ROOT, stdio: "ignore" });
}

const conClips = (registro) => async (page) => {
  await page.route("**/prendas.json", async (route) => {
    const res = await route.fetch();
    const data = await res.json();
    data.site.studioVideo = { webm: "video/video-estudio.webm", mp4: "video/video-estudio.mp4", poster: data.site.studioPhoto };
    await route.fulfill({ response: res, json: data });
  });
  await page.route("**/video/*", (r) => {
    const f = path.basename(new URL(r.request().url()).pathname);
    if (/\.(webm|mp4)$/.test(f)) registro.push(f);
    r.fulfill({ path: path.join(VID, f) });
  });
};

const ganchoSobre = (p) => p.evaluate(() => {
  const h = document.getElementById("process-hanger").getBoundingClientRect();
  const cards = [...document.querySelectorAll(".process__step")].map((s) => { const b = s.getBoundingClientRect(); return b.left + b.width / 2; });
  return { x: h.left + h.width / 2, cards };
});

module.exports = async function escenas() {
  clipsDePrueba();
  const b = await navegador();
  const fallas = [];

  // Cómo se hace, escritorio: del primer paso al último con el scroll, sin fijar la sección.
  {
    const p = await abrir(b, TAMANOS[0]);
    if (await p.isHidden("#proceso")) fallas.push("Cómo se hace oculta");
    if (await p.evaluate(() => !!document.querySelector(".pin-spacer #proceso, #proceso.pin-spacer"))) fallas.push("Cómo se hace fija el scroll");
    const lista = async (frac, borde) => {
      await p.evaluate(([frac, borde]) => {
        const r = document.getElementById("process-list").getBoundingClientRect();
        const y = scrollY + (borde === "top" ? r.top : r.bottom) - innerHeight * frac;
        window.NOMAD.scroll.to(y, { immediate: true });
      }, [frac, borde]);
      await p.waitForTimeout(400);
      return ganchoSobre(p);
    };
    const ini = await lista(0.7, "top");
    const mid = await lista(0.3, "top");
    const fin = await lista(0.4, "bottom");
    if (Math.abs(ini.x - ini.cards[0]) > 4) fallas.push(`gancho al inicio a ${(ini.x - ini.cards[0]).toFixed(0)} px del paso 1`);
    if (Math.abs(fin.x - fin.cards[3]) > 4) fallas.push(`gancho al final a ${(fin.x - fin.cards[3]).toFixed(0)} px del paso 4`);
    if (!(ini.x < mid.x && mid.x < fin.x)) fallas.push("el gancho no avanza parejo");
    await p.screenshot({ path: path.join(OUT, "escenas-proceso-1440.png") });
    if (p.errores.length) fallas.push(`1440 consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  // Cómo se hace, celular: el gancho sigue el deslizamiento.
  {
    const p = await abrir(b, TAMANOS[3]);
    await ir(p, "#proceso"); await p.waitForTimeout(500);
    const a = await ganchoSobre(p);
    await p.$eval("#process-viewport", (v) => { v.scrollLeft = v.scrollWidth; });
    await p.waitForTimeout(400);
    const z = await ganchoSobre(p);
    const rod = await p.$eval(".process__rod", (r) => r.getBoundingClientRect().right);
    if (!(z.x > a.x + 100) || rod - z.x > 20) fallas.push(`390: el gancho no siguió el deslizamiento (${a.x.toFixed(0)} → ${z.x.toFixed(0)})`);
    await p.close();
  }
  // Así se usa: cada foto abre la ficha de su prenda; leyenda de muestra.
  for (const t of [TAMANOS[0], TAMANOS[3]]) {
    const p = await abrir(b, t);
    const fotos = await p.$$eval(".street__card", (l) => l.map((a) => a.getAttribute("href")));
    if (fotos.length !== 6) fallas.push(`${t.nombre}: ${fotos.length} fotos de calle`);
    if (await p.isHidden("#street-sample")) fallas.push(`${t.nombre}: sin leyenda de muestra`);
    const esperado = await p.evaluate(() => window.NOMAD.site.street.shots.map((s) => `#/prenda/${window.NOMAD.items.find((i) => i.id === s.item).slug}`));
    if (fotos.join() !== esperado.join()) fallas.push(`${t.nombre}: enlaces ${fotos}`);
    for (const k of [1, 3]) {
      await ir(p, "#calle"); await p.waitForTimeout(600);
      await p.$eval(`.street__item:nth-child(${k + 1}) .street__card`, (a) => a.scrollIntoView({ inline: "center", block: "center" }));
      await p.click(`.street__item:nth-child(${k + 1}) .street__card`);
      await p.waitForTimeout(1400);
      const nombre = await p.textContent("#sheet-name");
      const quiere = await p.evaluate((k) => window.NOMAD.items.find((i) => i.id === window.NOMAD.site.street.shots[k].item).name, k);
      if (nombre !== quiere) fallas.push(`${t.nombre}: la foto ${k + 1} abrió "${nombre}"`);
      await p.keyboard.press("Escape"); await p.waitForTimeout(900);
    }
    await ir(p, "#calle"); await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(OUT, `escenas-calle-${t.nombre}.png`) });
    if (p.errores.length) fallas.push(`${t.nombre} consola: ${p.errores.join(" / ")}`);
    await p.close();
  }
  // Clips: al acercarse, a la vista y al salir.
  {
    const pedidos = [];
    const p = await abrir(b, TAMANOS[1], { antes: conClips(pedidos) });
    if (pedidos.length) fallas.push(`clips pedidos antes de acercarse: ${pedidos}`);
    await ir(p, "#about"); await p.waitForTimeout(2500);
    if (!pedidos.some((f) => f.startsWith("video-estudio"))) fallas.push("el video del estudio no cargó al acercarse");
    const v = await p.$eval("video.about__clip", (v) => ({ t: v.currentTime, paused: v.paused, inline: v.playsInline && v.muted && v.hasAttribute("playsinline") }));
    if (v.paused || v.t < 0.2) fallas.push(`el video no se reproduce a la vista (${v.t.toFixed(2)} s)`);
    if (!v.inline) fallas.push("el video no es muted + playsinline");
    await p.screenshot({ path: path.join(OUT, "escenas-estudio-video.png") });
    await ir(p, "#newsletter"); await p.waitForTimeout(800);
    if (!(await p.$eval("video.about__clip", (v) => v.paused))) fallas.push("el video sigue al salir de la vista");
    if (p.errores.length) fallas.push(`clips consola: ${p.errores.join(" / ")}`);
    await p.close();
    const q = await abrir(b, TAMANOS[1], { reducir: true, antes: conClips([]) });
    if (await q.$("video.clip")) fallas.push("con reducir movimiento hay video");
    await q.close();
  }
  // Pesos de los clips reales que ya estén en la página.
  const dir = path.join(ROOT, "web", "video");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((f) => /\.(webm|mp4)$/.test(f))) {
      const mb = fs.statSync(path.join(dir, f)).size / 1e6;
      if (mb > (f.startsWith("video-estudio") ? 2.5 : 1.5)) fallas.push(`${f}: ${mb.toFixed(2)} MB`);
    }
  }
  await b.close();
  return { nombre: "escenas", ok: !fallas.length, detalle: fallas.join(" | ") || "gancho del proceso al scroll y al deslizar, fotos de calle a su ficha, clips al acercarse, a la vista y en pausa al salir" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
