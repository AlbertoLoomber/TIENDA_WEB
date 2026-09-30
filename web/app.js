/* Nomad rack prototype.
 *
 * Every garment is a stack of cut-outs (side 80° → … → front 0°) that share one
 * canvas with the hanger hook at the same point, so turning a garment is just a
 * crossfade across the stack while its slot on the rail widens and pushes the
 * neighbours aside. Garments with only side + front get a squash on the front
 * image to fake the turn.
 */
(() => {
  "use strict";

  const CANVAS_RATIO = 1000 / 1300;   // width / height of every cut-out
  const RAIL_Y = 0.034;               // rail height as a fraction of the garment canvas
  const PACK_SIDE = 0.78;             // how tightly side views pack on the rail
  const PACK_FRONT = 0.9;             // same for the garment that is turned
  const MARQUEE = ["New designs daily", "Subscribe to our newsletter"];

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  const page = $("page");
  const rack = $("rack");
  const row = $("rack-row");
  const caption = $("caption");
  const detail = $("detail");
  const figure = $("detail-figure");
  const detailImg = $("detail-img");
  const drawer = $("drawer");
  const handle = $("handle");
  const detailSee = $("detail-see");
  const closeBtn = $("close");

  let items = [];
  let garmentW = 320;
  let active = -1;
  let detailIndex = -1;
  let busy = false;

  const lerp = (a, b, t) => a + (b - a) * t;
  const extent = (f) => f.right - f.left;
  const dur = (s) => (reduceMotion ? 0 : s);

  /* ---------- geometry ---------- */

  function extentAt(item, p) {
    const n = item.frames.length;
    const x = Math.min(Math.max(p, 0), 1) * (n - 1);
    const i = Math.min(Math.floor(x), n - 2);
    return lerp(extent(item.frames[i]), extent(item.frames[i + 1]), x - i);
  }

  function slotWidth(item) {
    // wp may overshoot 1 (elastic ease) so the push bounces; frames use p.
    const wp = item.wp;
    const e = wp <= 1 ? extentAt(item, wp) : extentAt(item, 1) * (1 + (wp - 1) * 0.6);
    return e * lerp(PACK_SIDE, PACK_FRONT, Math.min(Math.max(wp, 0), 1)) * garmentW;
  }

  function layout() {
    const stage = rack.parentElement;
    const availH = stage.clientHeight - 110;
    const narrow = stage.clientWidth <= 640;
    const availW = stage.clientWidth - 32 - (narrow ? 36 : 70);
    const sides = items.reduce((s, it) => s + extent(it.frames[0]) * PACK_SIDE, 0);
    const growth = Math.max(...items.map((it) => extent(it.frames.at(-1)) * PACK_FRONT - extent(it.frames[0]) * PACK_SIDE));
    const perHeight = (sides + growth) * CANVAS_RATIO;   // rack width per px of garment height
    const h = Math.max(180, Math.min(availH, 560, availW / perHeight));
    garmentW = h * CANVAS_RATIO;

    rack.style.setProperty("--g-h", `${h}px`);
    rack.style.setProperty("--g-w", `${garmentW}px`);
    rack.style.setProperty("--rail-y", `${h * RAIL_Y - 5}px`);
    rack.style.width = `${perHeight * h}px`;

    // Detail garment: leave room for the name block, and on phones for the full width.
    const roomW = stage.clientWidth - (narrow ? 32 : 32 + 2 * 130);
    const d = Math.min(stage.clientHeight - 160, 760, roomW / CANVAS_RATIO);
    detail.style.setProperty("--d-h", `${Math.max(220, d)}px`);
    items.forEach(render);
  }

  /* ---------- rendering ---------- */

  function render(item) {
    const n = item.frames.length;
    const p = Math.min(Math.max(item.p, 0), 1);
    const x = p * (n - 1);
    const i = Math.min(Math.floor(x), n - 1);
    const f = x - i;

    item.imgs.forEach((img, k) => {
      img.style.opacity = k === i ? 1 : k === i + 1 ? f : 0;
    });

    if (n === 2) {
      // Only side + front: start the front squeezed to the side's width.
      const ratio = extent(item.frames[0]) / extent(item.frames[1]);
      item.imgs[1].style.transform = `scaleX(${lerp(ratio, 1, p)})`;
    }

    item.slot.style.width = `${slotWidth(item)}px`;
  }

  function tick(item) {
    return () => render(item);
  }

  /* ---------- motion ---------- */

  function sway(item, from) {
    if (reduceMotion) return;
    gsap.fromTo(item.box, { rotation: from }, { rotation: 0, duration: 1.9, ease: "elastic.out(1, 0.22)", overwrite: "auto" });
  }

  function turn(item, to, { instant = false } = {}) {
    gsap.killTweensOf(item, "p,wp");
    if (instant || reduceMotion) {
      item.p = to;
      item.wp = to;
      render(item);
      return;
    }
    gsap.to(item, { p: to, duration: 0.7, ease: "power2.inOut", onUpdate: tick(item) });
    gsap.to(item, {
      wp: to,
      duration: to ? 1.1 : 0.8,
      ease: to ? "elastic.out(1, 0.55)" : "power3.out",
      onUpdate: tick(item),
    });
  }

  function activate(i, opts = {}) {
    if (i === active) return;
    const prev = active;
    if (prev >= 0) {
      items[prev].slot.classList.remove("is-active");
      turn(items[prev], 0, opts);
    }
    active = i;
    const item = items[i];
    item.slot.classList.add("is-active");
    turn(item, 1, opts);
    if (!opts.instant) {
      const dir = prev < 0 ? 1 : Math.sign(i - prev);
      sway(item, -5 * dir);
      [i - 1, i + 1].forEach((j) => items[j] && j !== prev && sway(items[j], j < i ? 2.2 : -2.2));
    }
    caption.textContent = `${item.name} — ${item.category}`;
  }

  /* ---------- detail view ---------- */

  function fillDetail(item) {
    detailImg.src = item.frames.at(-1).src;
    detailImg.alt = `${item.name}, front view`;
    $("detail-cat").textContent = item.category;
    $("detail-name").textContent = item.name;
  }

  function flight(fromEl, toEl) {
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, scale: a.height / b.height };
  }

  const detailChrome = () => [$("prev"), $("next"), detail.querySelector(".detail__info"), handle];

  function openDetail(i) {
    if (busy || !items.length) return;
    busy = true;
    activate(i, { instant: true });
    const item = items[i];
    gsap.killTweensOf(item.box);
    gsap.set(item.box, { rotation: 0 });

    detailIndex = i;
    fillDetail(item);
    page.classList.add("is-detail");
    detail.hidden = false;
    closeBtn.hidden = false;

    const from = flight(item.box, figure);
    item.box.style.visibility = "hidden";
    gsap.fromTo(figure, { ...from, transformOrigin: "0 0" }, {
      x: 0, y: 0, scale: 1, duration: dur(0.85), ease: "power3.inOut",
      onComplete: () => { busy = false; },
    });
    gsap.fromTo(detailChrome(), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.45), delay: dur(0.4), stagger: 0.05 });
    closeBtn.focus({ preventScroll: true });
  }

  function closeDetail() {
    if (busy || detailIndex < 0) return;
    busy = true;
    setDrawer(false);
    const item = items[detailIndex];
    page.classList.remove("is-detail");
    gsap.to(detailChrome(), { opacity: 0, duration: dur(0.2) });

    const to = flight(item.box, figure);
    gsap.to(figure, {
      ...to, transformOrigin: "0 0", duration: dur(0.75), ease: "power3.inOut",
      onComplete: () => {
        item.box.style.visibility = "";
        detail.hidden = true;
        closeBtn.hidden = true;
        gsap.set(figure, { clearProps: "transform" });
        sway(item, 4);
        item.slot.focus({ preventScroll: true });
        detailIndex = -1;
        busy = false;
      },
    });
  }

  function step(dir) {
    if (busy || detailIndex < 0) return;
    busy = true;
    setDrawer(false);
    const prev = items[detailIndex];
    const nextI = (detailIndex + dir + items.length) % items.length;
    const next = items[nextI];

    prev.box.style.visibility = "";
    activate(nextI, { instant: true });
    next.box.style.visibility = "hidden";
    detailIndex = nextI;

    gsap.to(detailImg, {
      opacity: 0, x: -dir * 28, duration: dur(0.2), ease: "power2.in",
      onComplete: () => {
        fillDetail(next);
        gsap.fromTo(detailImg, { opacity: 0, x: dir * 28 }, {
          opacity: 1, x: 0, duration: dur(0.4), ease: "power2.out",
          onComplete: () => { busy = false; },
        });
      },
    });
  }

  function setDrawer(open) {
    if (open === !drawer.hidden) return;
    handle.setAttribute("aria-expanded", String(open));
    detailSee.setAttribute("aria-expanded", String(open));
    if (open) {
      drawer.hidden = false;
      gsap.fromTo(drawer, { yPercent: 100 }, { yPercent: 0, duration: dur(0.45), ease: "power3.out" });
    } else {
      gsap.to(drawer, { yPercent: 100, duration: dur(0.3), ease: "power2.in", onComplete: () => { drawer.hidden = true; } });
    }
  }

  /* ---------- build ---------- */

  function buildBand() {
    const track = $("band-track");
    const run = Array.from({ length: 6 }, () => MARQUEE).flat();
    [...run, ...run].forEach((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      track.appendChild(span);
    });
  }

  function buildRack(data) {
    items = data.items.map((d, i) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "slot";
      slot.setAttribute("aria-label", `${d.name}, ${d.category}`);

      const frames = document.createElement("div");
      frames.className = "slot__frames";
      const imgs = d.frames.map((f, k) => {
        const img = document.createElement("img");
        img.src = f.src;
        img.alt = "";
        img.decoding = "async";
        img.draggable = false;
        img.style.zIndex = String(k);
        frames.appendChild(img);
        return img;
      });
      slot.appendChild(frames);
      row.appendChild(slot);

      const item = { ...d, slot, box: frames, imgs, p: 0, wp: 0 };
      slot.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && detailIndex < 0) activate(i); });
      // Keyboard focus turns the garment; a tap's focus is left to the click handler.
      slot.addEventListener("focus", () => { if (detailIndex < 0 && slot.matches(":focus-visible")) activate(i); });
      slot.addEventListener("click", () => {
        if (active !== i) activate(i);
        else openDetail(i);
      });
      return item;
    });
  }

  function wire() {
    $("see").addEventListener("click", () => openDetail(active >= 0 ? active : 0));
    closeBtn.addEventListener("click", closeDetail);
    $("prev").addEventListener("click", () => step(-1));
    $("next").addEventListener("click", () => step(1));
    handle.addEventListener("click", () => setDrawer(drawer.hidden));
    detailSee.addEventListener("click", () => setDrawer(drawer.hidden));
    drawer.querySelectorAll(".sizes button").forEach((b, _, all) => {
      b.addEventListener("click", () => all.forEach((o) => o.setAttribute("aria-checked", String(o === b))));
    });
    document.addEventListener("keydown", (e) => {
      if (detailIndex < 0) return;
      if (e.key === "Escape") closeDetail();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    let raf = 0;
    addEventListener("resize", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    });

    // Swipe between garments in the detail view.
    let startX = null;
    figure.addEventListener("pointerdown", (e) => { startX = e.clientX; });
    figure.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
  }

  async function init() {
    buildBand();
    const data = await fetch("prendas.json").then((r) => r.json());
    buildRack(data);
    wire();
    layout();
    // Open on a turned garment, like a shop assistant holding one up.
    setTimeout(() => activate(0), reduceMotion ? 0 : 450);
  }

  init().catch((err) => {
    caption.textContent = "The collection could not be loaded. Reload the page to try again.";
    console.error(err);
  });
})();
