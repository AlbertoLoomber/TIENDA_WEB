/* Nomad — "De cerca": one garment on a short rod with its details pointed out
 * (print, collar, fabric). Each detail is a dot on the garment, a fine line and
 * a round macro photo with a short text.
 *
 * The lines are drawn in an SVG over the section from the real positions of the
 * dots and the circles (horizontal out of the garment, then straight to the
 * edge of the circle), and are redrawn whenever the layout changes. They draw
 * themselves once, when the section comes into view; nothing pins the scroll.
 * Phones get no lines: numbered dots on the garment and the list below.
 *
 * Data: site.closeup in prendas.json (catalogo.json → sitio.cerca). Photos that
 * are still samples (tools/fotos_web.py) are labelled as such under the section.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const SVG = "http://www.w3.org/2000/svg";
  const HOOK_Y = 0.029;
  const RATIO = 1000 / 1300;
  const pad = (n) => String(n).padStart(2, "0");

  let points = [];       // { data, dot, row, circle, path }
  let entered = false;
  let reduceMotion = false;

  const isPhone = () => innerWidth <= 640;

  /* ---------- build ---------- */

  function build(data, item) {
    $("closeup-eyebrow").textContent = data.eyebrow || "De cerca";
    $("closeup-title").textContent = data.title || "";
    const img = $("closeup-img");
    img.src = item.frames.find((f) => f.angle === 0)?.src || item.frames.at(-1).src;
    img.alt = `${item.name}, de frente`;

    const body = $("closeup-body");
    const lines = $("closeup-lines");
    points = data.points.map((p, i) => {
      const dot = document.createElement("span");
      dot.className = "closeup__dot";
      dot.setAttribute("aria-hidden", "true");
      dot.style.left = `${p.x * 100}%`;
      dot.style.top = `${p.y * 100}%`;
      dot.innerHTML = `<span class="closeup__ring"></span><span class="closeup__num-dot">${i + 1}</span>`;
      body.appendChild(dot);

      const row = document.createElement("li");
      row.className = "closeup__item";
      row.dataset.point = p.id;
      row.innerHTML = `<span class="closeup__circle"><img alt="" loading="lazy" decoding="async"></span>
        <p class="closeup__text"><span class="closeup__num"></span><span class="closeup__title"></span><span class="closeup__desc"></span></p>`;
      const photo = row.querySelector("img");
      if (p.photo) {
        photo.src = p.photo.src;
        photo.alt = `${item.name}, ${p.title.toLowerCase()} de cerca`;
      } else {
        row.querySelector(".closeup__circle").classList.add("is-empty");
        photo.remove();
      }
      row.querySelector(".closeup__num").textContent = pad(i + 1);
      row.querySelector(".closeup__title").textContent = p.title;
      row.querySelector(".closeup__desc").textContent = p.text;
      $(p.side === "izq" ? "closeup-left" : "closeup-right").appendChild(row);

      const path = document.createElementNS(SVG, "path");
      path.setAttribute("class", "closeup__line");
      lines.appendChild(path);

      const pulse = () => pulseDot(dot);
      row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pulse(); });
      row.addEventListener("click", pulse);
      return { data: p, dot, row, circle: row.querySelector(".closeup__circle"), path };
    });
    $("closeup-note").hidden = !data.points.some((p) => p.photo?.sample);
  }

  /* ---------- layout: garment size, rod and lines ---------- */

  function layout() {
    const stage = $("closeup-stage");
    const w = innerWidth;
    const h = w <= 640 ? 340 : w <= 900 ? 360 : 420;
    const tube = Math.max(7, Math.min(11, Math.round(h * 0.026)));
    const k = tube / (N.rail?.tubeHeight || 47);
    const rail = N.rail || { height: 235, tubeTop: 53, left: 232, right: 234 };
    const s = stage.style;
    s.setProperty("--cu-h", `${h}px`);
    s.setProperty("--cu-w", `${h * RATIO}px`);
    s.setProperty("--cu-rail-top", `${h * HOOK_Y - rail.tubeTop * k}px`);
    s.setProperty("--cu-rail-h", `${rail.height * k}px`);
    // Whole pixels for the ends, so no hairline shows where they meet the tube.
    s.setProperty("--rail-lw", `${Math.round(rail.left * k)}px`);
    s.setProperty("--rail-rw", `${Math.round(rail.right * k)}px`);
    // The rod sits on whole pixels: at a fractional position a hairline shows
    // where its pieces meet.
    const rod = stage.querySelector(".closeup__rail");
    rod.style.transform = "";
    const frac = rod.getBoundingClientRect().left % 1;
    if (frac) rod.style.transform = `translateX(${-frac}px)`;
    drawLines();
  }

  // From the dot, out of the garment horizontally, then straight to the edge
  // of the circle: M dot H elbow L edge.
  function drawLines() {
    const svg = $("closeup-lines");
    const box = $("closeup-stage").getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const body = $("closeup-body").getBoundingClientRect();
    points.forEach(({ data, dot, circle, path }) => {
      if (isPhone()) { path.setAttribute("d", ""); return; }
      const d = dot.getBoundingClientRect();
      const c = circle.getBoundingClientRect();
      const px = d.left + d.width / 2 - box.left;
      const py = d.top + d.height / 2 - box.top;
      const cx = c.left + c.width / 2 - box.left;
      const cy = c.top + c.height / 2 - box.top;
      const r = c.width / 2 + 6;
      const left = data.side === "izq";
      // The elbow sits just outside the garment's widest part, on the circle's side.
      const elbow = left ? body.left - box.left + body.width * 0.12 : body.right - box.left - body.width * 0.12;
      const ex = left ? Math.min(elbow, px - 12) : Math.max(elbow, px + 12);
      const ang = Math.atan2(cy - py, cx - ex);
      const tx = cx - Math.cos(ang) * r;
      const ty = cy - Math.sin(ang) * r;
      path.setAttribute("d", `M${px.toFixed(1)} ${py.toFixed(1)}H${ex.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}`);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      if (entered || reduceMotion) path.style.strokeDashoffset = "0";
      else path.style.strokeDashoffset = `${len}`;
    });
  }

  /* ---------- motion ---------- */

  function pulseDot(dot) {
    if (reduceMotion) return;
    const ring = dot.querySelector(".closeup__ring");
    gsap.fromTo(ring, { scale: 1, opacity: 0.7 }, { scale: 2.4, opacity: 0, duration: 1.2, ease: "power2.out", overwrite: true });
  }

  function enter() {
    if (entered) return;
    entered = true;
    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.fromTo("#closeup-garment", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out" });
    points.forEach(({ dot, path, circle, row }, i) => {
      const at = 0.35 + i * 0.18;
      tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, at);
      if (!isPhone()) tl.to(path, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, at + 0.1);
      tl.fromTo(circle, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(50% at 50% 50%)", duration: 0.7, ease: "expo.out" }, at + (isPhone() ? 0.1 : 0.55));
      tl.fromTo(row.querySelector(".closeup__text"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, at + (isPhone() ? 0.2 : 0.65));
    });
    tl.add(() => gsap.set(points.map((p) => p.circle), { clearProps: "clipPath" }));
  }

  function setup() {
    const data = N.site?.closeup;
    const item = data && N.items?.find((it) => it.id === data.item);
    const section = $("cerca");
    if (!data || !item || !section) return;
    reduceMotion = !!N.reduceMotion;
    section.hidden = false;
    build(data, item);
    layout();

    let raf = 0;
    const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
    new ResizeObserver(redraw).observe($("closeup-stage"));
    $("closeup-img").addEventListener("load", redraw);
    points.forEach((p) => p.circle.querySelector("img")?.addEventListener("load", redraw, { once: true }));
    document.fonts?.ready.then(redraw);

    const animate = !reduceMotion && N.hasScrollTrigger && N.features?.closeupLines !== false;
    if (!animate) { entered = true; drawLines(); return; }
    // Hidden until the entrance (set here, so without JS everything shows).
    gsap.set("#closeup-garment", { opacity: 0 });
    gsap.set(points.flatMap((p) => [p.dot]), { scale: 0 });
    gsap.set(points.map((p) => p.circle), { clipPath: "circle(0% at 50% 50%)" });
    gsap.set(points.map((p) => p.row.querySelector(".closeup__text")), { opacity: 0 });
    ScrollTrigger.create({ trigger: "#closeup-stage", start: "top 70%", once: true, onEnter: enter });
  }

  N.closeup = { setup, redraw: () => layout() };
})();
