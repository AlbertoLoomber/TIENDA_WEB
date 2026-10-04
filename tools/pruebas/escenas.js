/* Fase 4 sin pin: "Así se usa" (cada foto abre su ficha, leyenda de muestra) y
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

module.exports = async function escenas() {
  clipsDePrueba();
  const b = await navegador();
  const fallas = [];

  // Así se usa: cada foto abre la ficha de su prenda; leyenda de muestra.
  for (const t of [TAMANOS[0], TAMANOS[3]]) {
    const p = await abrir(b, t);
    const fotos = await p.$$eval(".street__card", (l) => l.map((a) => a.getAttribute("href")));
    const total = await p.evaluate(() => window.NOMAD.site.street.shots.length);
    if (fotos.length !== total || total < 1) fallas.push(`${t.nombre}: ${fotos.length} fotos de calle de ${total}`);
    // la leyenda "Fotos de muestra" aparece solo mientras alguna lo sea
    const debe = await p.evaluate(() => window.NOMAD.site.street.sample);
    if (debe === (await p.isHidden("#street-sample"))) fallas.push(`${t.nombre}: leyenda de muestra ${debe ? "faltante" : "sobrante"}`);
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
  return { nombre: "escenas", ok: !fallas.length, detalle: fallas.join(" | ") || "fotos de calle a su ficha, clips al acercarse, a la vista y en pausa al salir" };
};
if (require.main === module) module.exports().then((r) => console.log(r));
