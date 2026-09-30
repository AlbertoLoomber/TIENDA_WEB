/* Nomad rack prototype.
 *
 * Every garment is a stack of cut-outs (side 80° → … → front 0°) that share one
 * canvas with the hanger hook at the same point. A "turn" renders a progress p
 * (0 = side, 1 = front) over that stack: garments with real in-between angles
 * step through them (each new view starts squeezed to the previous one's width
 * and opens up underneath it, so there is no see-through double image);
 * garments with only side + front get a 3D swing instead.
 * The rack slot widens with the turn and pushes its neighbours aside.
 */
(() => {
  "use strict";

  const CANVAS_RATIO = 1000 / 1300;   // width / height of every cut-out
  const HOOK_Y = 0.029;               // inner top of the hook curl, as a fraction of the canvas height
  const PACK_SIDE = 0.78;             // how tightly side views pack on the rail
  const PACK_FRONT = 0.9;             // same for the garment that is turned
  const RAIL_OVER = 56;               // rail length past the outer garments, px
  const HOVER_DELAY = 90;             // ms the cursor must rest before a garment turns
  const LEAVE_DELAY = 260;            // ms after leaving the rack before it settles back
  const IDLE_MS = 6500;               // quiet time before the rack stirs on its own
  const LIFT = 14;                    // px a garment rises to come off the hook
  const MARQUEE = ["New designs daily", "Subscribe to our newsletter"];

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (id) => document.getElementById(id);

  const page = $("page");
  const rack = $("rack");
  const rackInner = $("rack-inner");
  const rail = $("rail");
  const glint = $("glint");
  const row = $("rack-row");
  const caption = $("caption");
  const detail = $("detail");
  const figure = $("detail-figure");
  const info = detail.querySelector(".detail__info");
  const drawer = $("drawer");
  const handle = $("handle");
  const detailSee = $("detail-see");
  const closeBtn = $("close");

  let items = [];
  let garmentH = 420;
  let garmentW = 323;
  let narrow = false;
  let active = -1;
  let detailIndex = -1;
  let detailTurn = null;
  let busy = false;
  let hoverTimer = 0;
  let leaveTimer = 0;
  let lastInput = performance.now();
  let lastPointer = "mouse";

  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const extent = (f) => f.right - f.left;
  const dur = (s) => (reduceMotion ? 0 : s);

  /* ---------- the turn ---------- */

  function makeTurn(container, frames) {
    const box = document.createElement("div");
    box.className = "turn";
    const imgs = frames.map((f, k) => {
      const img = document.createElement("img");
      img.src = f.src;
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.style.zIndex = String(k);
      box.appendChild(img);
      return img;
    });
    container.appendChild(box);
    // Give each step time in proportion to how much the silhouette changes,
    // so near-identical views don't stall the turn.
    const weights = frames.slice(1).map((f, k) => Math.max(0.22, Math.abs(extent(f) - extent(frames[k]))));
    const total = weights.reduce((a, b) => a + b, 0);
    const stops = [0];
    weights.forEach((w) => stops.push(stops.at(-1) + w / total));
    stops[stops.length - 1] = 1;
    return { frames, imgs, stops, p: 0 };
  }

  function renderTurn(t) {
    const { frames, imgs } = t;
    const n = frames.length;
    const p = clamp(t.p);

    if (n === 2) {
      // The side view swings away while the front swings in from the hook. The
      // front becomes opaque before the side fades, so the garment never looks
      // see-through halfway.
      const a = clamp(p / 0.6);
      const b = clamp((p - 0.2) / 0.8);
      const ratio = extent(frames[0]) / extent(frames[1]);
      imgs[0].style.opacity = 1 - smooth(clamp((p - 0.3) / 0.3));
      imgs[0].style.transform = `rotateY(${62 * smooth(a)}deg)`;
      imgs[1].style.opacity = smooth(clamp((p - 0.12) / 0.3));
      imgs[1].style.transform = `rotateY(${-58 * (1 - smooth(b))}deg) scaleX(${lerp(ratio, 1, smooth(b))})`;
      return;
    }

    const [i, f] = segment(t, p);
    const ratio = extent(frames[i]) / extent(frames[i + 1]);
    imgs.forEach((img, k) => {
      if (k === i) {
        // Outgoing view stays on top and fades, easing toward the next width.
        img.style.zIndex = "2";
        img.style.opacity = 1 - smooth(clamp((f - 0.15) / 0.6));
        img.style.transform = `scaleX(${lerp(1, Math.min(1 / ratio, 1.3), smooth(f))})`;
      } else if (k === i + 1) {
        // Incoming view sits underneath, starts at the outgoing width and opens up.
        img.style.zIndex = "1";
        img.style.opacity = smooth(clamp(f / 0.25));
        img.style.transform = `scaleX(${lerp(ratio, 1, smooth(f))})`;
      } else {
        img.style.zIndex = "0";
        img.style.opacity = 0;
        img.style.transform = "";
      }
    });
  }

  // Which step of the turn p falls in, and how far through it.
  function segment(t, p) {
    const { stops } = t;
    let i = 0;
    while (i < stops.length - 2 && p >= stops[i + 1]) i++;
    return [i, clamp((p - stops[i]) / (stops[i + 1] - stops[i]))];
  }

  /* ---------- geometry ---------- */

  function extentAt(t, p) {
    const [i, f] = segment(t, clamp(p));
    return lerp(extent(t.frames[i]), extent(t.frames[i + 1]), smooth(f));
  }

  function slotWidth(item) {
    // wp may overshoot 1 (elastic ease) so the push bounces; the images use p.
    const wp = item.wp;
    const e = wp <= 1 ? extentAt(item.turn, wp) : extentAt(item.turn, 1) * (1 + (wp - 1) * 0.6);
    return e * lerp(PACK_SIDE, PACK_FRONT, clamp(wp)) * garmentW;
  }

  function layout() {
    const stage = rack.parentElement;
    narrow = stage.clientWidth <= 640;
    const availH = stage.clientHeight - (narrow ? 120 : 110);
    const sides = items.reduce((s, it) => s + extent(it.frames[0]) * PACK_SIDE, 0);
    const growth = Math.max(...items.map((it) => extent(it.frames.at(-1)) * PACK_FRONT - extent(it.frames[0]) * PACK_SIDE));
    const perHeight = (sides + growth) * CANVAS_RATIO;   // rack width per px of garment height

    if (narrow) {
      // Phones: bigger garments on a rack you swipe.
      garmentH = clamp(Math.min(availH, 470, stage.clientWidth * 1.2), 200, 470);
    } else {
      const availW = stage.clientWidth - 32 - 2 * RAIL_OVER;
      garmentH = clamp(Math.min(availH, 560, availW / perHeight), 180, 560);
    }
    garmentW = garmentH * CANVAS_RATIO;
    const tube = clamp(Math.round(garmentH * 0.021), 7, 12);
    const over = narrow ? 18 : RAIL_OVER;

    const s = rackInner.style;
    s.setProperty("--g-h", `${garmentH}px`);
    s.setProperty("--g-w", `${garmentW}px`);
    s.setProperty("--tube", `${tube}px`);
    s.setProperty("--rail-top", `${garmentH * HOOK_Y}px`);
    s.setProperty("--rail-over", `${over}px`);
    s.setProperty("--rack-w", `${perHeight * garmentH}px`);
    rackInner.style.paddingInline = narrow ? `${over + 16}px` : "";

    const roomW = stage.clientWidth - (narrow ? 32 : 32 + 2 * 130);
    const d = Math.min(stage.clientHeight - 160, 760, roomW / CANVAS_RATIO);
    detail.style.setProperty("--d-h", `${Math.max(220, d)}px`);
    // Until the cursor moves it, the highlight sits where a ceiling light would put it.
    if (!glintMoved) gsap.set(glint, { x: glint.parentElement.clientWidth * 0.32 });
    items.forEach(render);
  }

  function render(item) {
    renderTurn(item.turn);
    item.slot.style.width = `${slotWidth(item)}px`;
  }

  /* ---------- motion ---------- */

  function sway(item, from, delay = 0) {
    if (reduceMotion) return;
    gsap.fromTo(item.swing, { rotation: from }, {
      rotation: 0, duration: 1.9, delay, ease: "elastic.out(1, 0.22)", overwrite: "auto",
    });
  }

  function turn(item, to, { instant = false } = {}) {
    gsap.killTweensOf(item.turn, "p");
    gsap.killTweensOf(item, "wp");
    if (instant || reduceMotion) {
      item.turn.p = to;
      item.wp = to;
      render(item);
      return;
    }
    const update = () => render(item);
    const d = item.frames.length > 2 ? 1 : 0.8;
    gsap.to(item.turn, { p: to, duration: to ? d : 0.6, ease: "power2.inOut", onUpdate: update });
    // The slot widens with the garment (not ahead of it) and settles with a small push.
    gsap.to(item, to
      ? { keyframes: [{ wp: 1.05, duration: d * 0.85, ease: "power2.inOut" }, { wp: 1, duration: 0.4, ease: "power2.out" }], onUpdate: update }
      : { wp: 0, duration: 0.6, ease: "power2.inOut", onUpdate: update });
  }

  function ripple(i, strength) {
    items.forEach((it, j) => {
      if (j === i) return;
      const d = j - i;
      sway(it, (d < 0 ? strength : -strength) / Math.abs(d), Math.abs(d) * 0.07);
    });
  }

  function setCaption(item) {
    if (item) {
      caption.textContent = `${item.name} — ${item.category}`;
      caption.classList.remove("is-hint");
    } else {
      caption.textContent = finePointer ? "Hover to turn · Click to view" : "Tap to turn · Tap again to view";
      caption.classList.add("is-hint");
    }
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
      sway(item, prev < 0 || i > prev ? -5 : 5);
      ripple(i, 2.8);
    }
    setCaption(item);
  }

  function settle() {
    if (active < 0 || detailIndex >= 0) return;
    const item = items[active];
    item.slot.classList.remove("is-active");
    turn(item, 0);
    sway(item, 3);
    active = -1;
    setCaption(null);
  }

  function breeze() {
    items.forEach((it, j) => {
      gsap.to(it.swing, {
        keyframes: [
          { rotation: 1.4, duration: 1, ease: "sine.inOut" },
          { rotation: -0.9, duration: 1.2, ease: "sine.inOut" },
          { rotation: 0, duration: 1.3, ease: "sine.inOut" },
        ],
        delay: j * 0.14,
        overwrite: "auto",
      });
    });
  }

  function intro() {
    const swings = items.map((it) => it.swing);
    const tail = [caption, $("see")];
    if (reduceMotion) return Promise.resolve();
    gsap.set(swings, { y: -garmentH * 0.2, opacity: 0 });
    gsap.set(tail, { opacity: 0 });
    gsap.set(rail, { scaleX: 0, transformOrigin: "50% 50%" });
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(rail, { scaleX: 1, duration: 0.8, ease: "power3.inOut" });
      items.forEach((it, j) => {
        tl.to(it.swing, {
          keyframes: [
            { y: 0, opacity: 1, duration: 0.42, ease: "power2.in" },
            { y: -5, duration: 0.13, ease: "power1.out" },
            { y: 0, duration: 0.17, ease: "power1.in" },
          ],
          onComplete: () => sway(it, j % 2 ? 3.5 : -3.5),
        }, 0.45 + j * 0.1);
      });
      tl.to(tail, { opacity: 1, duration: 0.5, ease: "power2.out" }, ">-0.2");
    });
  }

  /* ---------- detail view ---------- */

  // Rect of an element in the rack as it will be once the rack is back at scale 1.
  function restingRect(el) {
    const r = el.getBoundingClientRect();
    const s = gsap.getProperty(rack, "scale");
    if (s === 1) return r;
    const c = rack.getBoundingClientRect();
    const cx = c.left + c.width / 2;
    const cy = c.top + c.height / 2;
    return { left: cx + (r.left - cx) / s, top: cy + (r.top - cy) / s, width: r.width / s, height: r.height / s };
  }

  function fillDetail(item, p = 1) {
    figure.replaceChildren();
    detailTurn = makeTurn(figure, item.frames);
    detailTurn.p = p;
    renderTurn(detailTurn);
    figure.setAttribute("aria-label", `${item.name}, front view`);
    $("detail-cat").textContent = item.category;
    $("detail-count").textContent = `${String(items.indexOf(item) + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    $("detail-name").textContent = item.name;
  }

  const detailChrome = () => [$("prev"), $("next"), info, handle];

  function openDetail(i) {
    if (busy || !items.length || detailIndex >= 0) return;
    busy = true;
    clearTimeout(hoverTimer);
    clearTimeout(leaveTimer);
    activate(i, { instant: true });
    const item = items[i];
    gsap.killTweensOf(item.swing);

    // Lift the garment off the hook, then carry it to the centre.
    gsap.to(item.swing, {
      y: -LIFT, rotation: 0, duration: dur(0.2), ease: "power2.out",
      onComplete: () => {
        detailIndex = i;
        fillDetail(item);
        page.classList.add("is-detail");
        detail.hidden = false;
        closeBtn.hidden = false;

        const a = item.swing.getBoundingClientRect();
        const b = figure.getBoundingClientRect();
        item.swing.style.visibility = "hidden";
        gsap.set(item.swing, { y: 0 });

        gsap.to(rack, { scale: 0.95, duration: dur(0.85), ease: "power3.inOut" });
        gsap.fromTo(figure,
          { x: a.left - b.left, y: a.top - b.top, scale: a.height / b.height, opacity: 1, transformOrigin: "0 0" },
          { x: 0, y: 0, scale: 1, duration: dur(0.85), ease: "power3.inOut", onComplete: () => { busy = false; } });
        gsap.fromTo(detailChrome(), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.45), delay: dur(0.45), stagger: 0.05 });
        closeBtn.focus({ preventScroll: true });
      },
    });
  }

  function closeDetail() {
    if (busy || detailIndex < 0) return;
    busy = true;
    setDrawer(false);
    const item = items[detailIndex];
    page.classList.remove("is-detail");
    gsap.to(detailChrome(), { opacity: 0, duration: dur(0.2) });

    const to = restingRect(item.swing);
    const from = figure.getBoundingClientRect();
    gsap.to(rack, { scale: 1, duration: dur(0.75), ease: "power3.inOut" });
    gsap.to(figure, {
      x: to.left - from.left,
      y: to.top - LIFT - from.top,
      scale: to.height / from.height,
      transformOrigin: "0 0",
      duration: dur(0.75),
      ease: "power3.inOut",
      onComplete: () => {
        // Hang it back up: drop onto the hook and swing.
        item.swing.style.visibility = "";
        gsap.fromTo(item.swing, { y: -LIFT }, { y: 0, duration: dur(0.45), ease: "bounce.out" });
        sway(item, 4);
        detail.hidden = true;
        closeBtn.hidden = true;
        gsap.set(figure, { clearProps: "transform,opacity" });
        detailIndex = -1;
        busy = false;
        item.slot.focus({ preventScroll: true });
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

    // Keep the rack behind in step with the detail view.
    prev.swing.style.visibility = "";
    activate(nextI, { instant: true });
    next.swing.style.visibility = "hidden";
    detailIndex = nextI;

    // The current garment turns to its side and slides out; the next one
    // slides in on its side and turns to face you.
    const out = detailTurn;
    const tl = gsap.timeline();
    tl.to(out, { p: 0, duration: dur(0.42), ease: "power2.in", onUpdate: () => renderTurn(out) }, 0)
      .to(figure, { x: -dir * 80, opacity: 0, duration: dur(0.36), ease: "power2.in" }, dur(0.12))
      .to(info, { opacity: 0, y: 6, duration: dur(0.2) }, 0)
      .add(() => {
        fillDetail(next, 0);
        gsap.set(figure, { x: dir * 80 });
      })
      .to(figure, { x: 0, opacity: 1, duration: dur(0.45), ease: "power2.out" })
      .to(info, { opacity: 1, y: 0, duration: dur(0.3) }, "<0.1")
      .add(() => {
        const t = detailTurn;
        gsap.to(t, {
          p: 1, duration: dur(0.75), ease: "power2.inOut", onUpdate: () => renderTurn(t),
          onComplete: () => { busy = false; },
        });
      }, "<0.05");
  }

  function setDrawer(open) {
    if (open === !drawer.hidden) return;
    handle.setAttribute("aria-expanded", String(open));
    detailSee.setAttribute("aria-expanded", String(open));
    if (open) {
      drawer.hidden = false;
      gsap.fromTo(drawer, { xPercent: -50, yPercent: 100 }, { xPercent: -50, yPercent: 0, duration: dur(0.45), ease: "power3.out" });
    } else {
      gsap.to(drawer, { yPercent: 100, duration: dur(0.3), ease: "power2.in", onComplete: () => { drawer.hidden = true; } });
    }
  }

  /* ---------- rail glint ---------- */

  let glintX = null;
  let glintMoved = false;

  function setupGlint() {
    if (!finePointer) return;
    glintX = gsap.quickTo(glint, "x", { duration: reduceMotion ? 0 : 0.9, ease: "power3" });
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = glint.parentElement.getBoundingClientRect();
      glintX(clamp(e.clientX - r.left, 0, r.width));
      glintMoved = true;
    }, { passive: true });
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

      const contact = document.createElement("span");
      contact.className = "slot__contact";
      const swing = document.createElement("div");
      swing.className = "slot__swing";
      slot.append(contact, swing);
      row.appendChild(slot);

      const item = { ...d, slot, swing, turn: makeTurn(swing, d.frames), wp: 0 };

      slot.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || detailIndex >= 0) return;
        clearTimeout(leaveTimer);
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => activate(i), HOVER_DELAY);
      });
      slot.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(hoverTimer);
      });
      // Keyboard focus turns the garment; a tap's focus is left to the click handler.
      slot.addEventListener("focus", () => { if (detailIndex < 0 && slot.matches(":focus-visible")) activate(i); });
      slot.addEventListener("click", () => {
        if (lastPointer === "mouse") return openDetail(i);
        if (active !== i) {
          activate(i);
          if (narrow) setTimeout(() => slot.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" }), 250);
        } else {
          openDetail(i);
        }
      });
      return item;
    });

    row.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(settle, LEAVE_DELAY);
    });
    row.addEventListener("pointerenter", () => clearTimeout(leaveTimer));
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

    addEventListener("pointerdown", (e) => { lastPointer = e.pointerType || "mouse"; }, { capture: true });
    document.addEventListener("keydown", (e) => {
      lastPointer = "keyboard";
      lastInput = performance.now();
      if (detailIndex < 0) return;
      if (e.key === "Escape") closeDetail();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    ["pointermove", "pointerdown", "wheel"].forEach((t) =>
      addEventListener(t, () => { lastInput = performance.now(); }, { passive: true }));
    rack.addEventListener("scroll", () => { lastInput = performance.now(); }, { passive: true });

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

    // Every so often, when nobody is touching it, the rack stirs.
    if (!reduceMotion) {
      setInterval(() => {
        if (detailIndex >= 0 || busy || document.hidden) return;
        if (performance.now() - lastInput < IDLE_MS) return;
        lastInput = performance.now();
        breeze();
      }, 1000);
    }
  }

  function firstFramesReady() {
    const decodes = items.map((it) => it.turn.imgs[0].decode().catch(() => {}));
    return Promise.race([Promise.all(decodes), new Promise((r) => setTimeout(r, 3000))]);
  }

  async function init() {
    buildBand();
    const data = await fetch("prendas.json").then((r) => r.json());
    buildRack(data);
    wire();
    setupGlint();
    layout();
    setCaption(null);
    await firstFramesReady();
    await intro();
    // Open on a turned garment, like a shop assistant holding one up.
    if (active < 0) activate(0);
  }

  init().catch((err) => {
    caption.textContent = "The collection could not be loaded. Reload the page to try again.";
    console.error(err);
  });
})();
