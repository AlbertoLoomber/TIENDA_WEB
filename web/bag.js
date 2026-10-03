/* Nomad — the bag.
 *
 * A panel from the right with what the visitor picked (garment, size,
 * quantity), a free-shipping bar shaped like the rail, and a checkout button
 * that only previews: this is a design prototype, nothing is charged.
 * Adding from the sheet, the rack's drawer or the collection sends a copy of
 * the garment flying into the bag. The bag lives in localStorage when the
 * browser allows it; otherwise it lasts while the page is open.
 *
 * Public API: NOMAD.bag.add(item, size, { from }) · open() · close() · count()
 * and NOMAD.toast(text, { action }).
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const KEY = "nomad.bolsa.v1";
  const MAX_QTY = 10;

  let lines = [];                 // { id, size, qty }
  let returnFocus = null;
  let inertBefore = [];           // what was inert before the bag opened (page, sheet)
  const reduceMotion = () => !!N.reduceMotion;
  const items = () => N.items || [];
  const itemById = (id) => items().find((it) => it.id === id);
  const price = (n, opts) => (N.price ? N.price(n, opts) : `$${n}`);

  /* ---------- storage ---------- */

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data?.v === 1 && Array.isArray(data.lines)) lines = data.lines;
    } catch (e) { lines = []; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, lines })); } catch (e) { /* storage blocked: keep it in memory */ }
  }

  /* ---------- totals ---------- */

  const valid = () => lines.filter((l) => itemById(l.id));
  const count = () => valid().reduce((s, l) => s + l.qty, 0);
  const subtotal = () => valid().reduce((s, l) => s + l.qty * (itemById(l.id).price || 0), 0);

  function countLabel(n) {
    return n === 1 ? "Bolsa, 1 prenda" : `Bolsa, ${n} prendas`;
  }

  // Every "Bolsa ⓪" on the page (header and sheet) shows the same number.
  function paintCount({ bump = false } = {}) {
    const n = count();
    document.querySelectorAll("[data-bag-count]").forEach((badge) => {
      // A roll may still be running from a quick previous add: settle it first.
      [...badge.children].slice(0, -1).forEach((n) => n.remove());
      const old = badge.lastElementChild;
      gsap.killTweensOf(old);
      gsap.set(old, { yPercent: 0 });
      badge.classList.toggle("is-full", n > 0);
      badge.closest("button")?.setAttribute("aria-label", countLabel(n));
      if (old.textContent === String(n)) return;
      if (!bump || reduceMotion()) { old.textContent = n; return; }
      // The number rolls up: the old one leaves upwards, the new one comes from below.
      const next = document.createElement("span");
      next.textContent = n;
      badge.appendChild(next);
      gsap.fromTo(old, { yPercent: 0 }, { yPercent: -110, duration: 0.35, ease: "power2.out", onComplete: () => old.remove() });
      gsap.fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(badge, { rotation: 14 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", transformOrigin: "50% 0%" });
    });
  }

  /* ---------- panel ---------- */

  function render() {
    const list = $("bag-lines");
    const shown = valid();
    list.replaceChildren(...shown.map(lineNode));
    const empty = !shown.length;
    $("bag-empty").hidden = !empty;
    $("bag-foot").hidden = empty;
    list.hidden = empty;
    $("bag-title-count").textContent = empty ? "" : `(${count()})`;
    $("bag-subtotal").textContent = price(subtotal());
    paintShipping();
  }

  function lineNode(line) {
    const item = itemById(line.id);
    const li = document.createElement("li");
    li.className = "bag__line";
    li.dataset.key = `${line.id}|${line.size}`;
    li.innerHTML = `
      <span class="bag__thumb"><img alt="" loading="lazy"></span>
      <div class="bag__info">
        <p class="bag__name"></p>
        <p class="bag__meta"></p>
        <div class="bag__qty" role="group">
          <button type="button" class="bag__step" data-step="-1" aria-label="Quitar una">−</button>
          <span class="bag__n" aria-live="polite"></span>
          <button type="button" class="bag__step" data-step="1" aria-label="Agregar una">+</button>
        </div>
        <button type="button" class="bag__remove">Quitar</button>
      </div>
      <p class="bag__price"></p>`;
    li.querySelector("img").src = item.frames.at(-1).src;
    li.querySelector(".bag__name").textContent = item.name;
    li.querySelector(".bag__meta").textContent = `${item.category} · Talla ${line.size}`;
    li.querySelector(".bag__qty").setAttribute("aria-label", `Cantidad de ${item.name}, talla ${line.size}`);
    li.querySelector(".bag__n").textContent = line.qty;
    li.querySelector(".bag__price").textContent = price(item.price * line.qty);
    li.querySelector('[data-step="-1"]').disabled = line.qty <= 1;
    li.querySelector('[data-step="1"]').disabled = line.qty >= MAX_QTY;
    li.querySelectorAll(".bag__step").forEach((b) =>
      b.addEventListener("click", () => setQty(line.id, line.size, line.qty + Number(b.dataset.step))));
    li.querySelector(".bag__remove").addEventListener("click", () => remove(line.id, line.size));
    return li;
  }

  // The rail fills as the subtotal grows; a hanger rides on the tube.
  function paintShipping() {
    const free = N.site?.shipping?.freeFrom;
    const text = $("bag-ship-text");
    const rail = $("bag-fill").parentElement;
    if (!free) { rail.hidden = true; text.textContent = ""; return; }
    const total = subtotal();
    const p = Math.min(1, total / free);
    const reached = p >= 1;
    const wasReached = rail.classList.contains("is-free");
    rail.classList.toggle("is-free", reached);
    text.textContent = reached ? "¡Tu envío es gratis!" : `Te faltan ${price(free - total)} para el envío gratis.`;
    const to = { scaleX: p, duration: reduceMotion() ? 0 : 0.6, ease: "power2.out" };
    gsap.to("#bag-fill", to);
    gsap.to("#bag-hanger", { left: `${p * 100}%`, duration: to.duration, ease: "power2.out" });
    if (reached && !wasReached && !reduceMotion() && !$("bag").hidden) {
      gsap.fromTo("#bag-hanger", { rotation: 16 }, { rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)", transformOrigin: "50% 0%" });
    }
  }

  /* ---------- changes ---------- */

  function changed({ bump = false } = {}) {
    save();
    paintCount({ bump });
    if (!$("bag").hidden) render();
    else paintShipping();
    document.dispatchEvent(new CustomEvent("nomad:bag", { detail: { count: count(), subtotal: subtotal() } }));
  }

  function add(item, size, { from = null } = {}) {
    if (!item || !size) return;
    const line = lines.find((l) => l.id === item.id && l.size === size);
    if (line) line.qty = Math.min(MAX_QTY, line.qty + 1);
    else lines.push({ id: item.id, size, qty: 1 });
    const done = () => changed({ bump: true });
    if (from && !reduceMotion() && N.features?.flyToBag !== false) fly(from, target(), done);
    else done();
    toast(`Agregado a tu bolsa · ${item.name}, talla ${size}`, { action: { label: "Ver bolsa", run: () => open() } });
  }

  function setQty(id, size, qty) {
    const line = lines.find((l) => l.id === id && l.size === size);
    if (!line) return;
    if (qty <= 0) return remove(id, size);
    const dir = qty > line.qty ? 1 : -1;
    line.qty = Math.min(MAX_QTY, qty);
    changed();
    // Re-rendering replaced the buttons: keep the focus on the one just used
    // (or its neighbour if that one is now disabled).
    const row = $("bag-lines").querySelector(`[data-key="${id}|${size}"]`);
    const same = row?.querySelector(`.bag__step[data-step="${dir}"]`);
    (same && !same.disabled ? same : row?.querySelector(`.bag__step[data-step="${-dir}"]`))?.focus();
  }

  function remove(id, size) {
    const node = $("bag-lines").querySelector(`[data-key="${id}|${size}"]`);
    const drop = () => {
      lines = lines.filter((l) => !(l.id === id && l.size === size));
      changed();
      (document.querySelector(".bag__remove") || $("bag-browse"))?.focus();
    };
    if (!node || reduceMotion()) return drop();
    // The line fades, then the ones below slide up into its place.
    const below = [...node.parentElement.children].slice([...node.parentElement.children].indexOf(node) + 1);
    const h = node.offsetHeight;
    gsap.to(node, { opacity: 0, x: 16, duration: 0.2, ease: "power1.in", onComplete: () => {
      drop();
      const fresh = [...$("bag-lines").children].slice(-below.length || 0);
      if (below.length) gsap.fromTo(fresh, { y: h }, { y: 0, duration: 0.3, ease: "power2.out", clearProps: "transform" });
    } });
  }

  /* ---------- the flight ---------- */

  // Where the garment lands: the sheet's own bag button while the sheet is
  // open (the header sits under its scrim), otherwise the header's.
  function target() {
    const sheetOpen = $("sheet") && !$("sheet").hidden;
    return (sheetOpen ? document.querySelector(".sheet__bag") : $("bag-open"))?.querySelector("[data-bag-count]");
  }

  function fly(fromImg, to, onLand) {
    if (!fromImg || !to) return onLand();
    const a = fromImg.getBoundingClientRect();
    const t = to.getBoundingClientRect();
    if (!a.width || !t.width) return onLand();
    const clone = fromImg.cloneNode(false);
    clone.removeAttribute("id");
    clone.className = "fly";
    clone.alt = "";
    Object.assign(clone.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(clone);
    const dx = t.left + t.width / 2 - (a.left + a.width / 2);
    const dy = t.top + t.height / 2 - (a.top + a.height / 2);
    const peak = Math.min(0, dy) - 120;            // the arc's high point, above both ends
    gsap.timeline({ onComplete: () => clone.remove() })
      // lifted off the hook…
      .to(clone, { scale: 0.6, rotation: -6, duration: 0.22, ease: "power2.out" })
      // …folded (it flattens from the bottom up)…
      .to(clone, { clipPath: "inset(0% 0% 42% 0%)", duration: 0.2, ease: "power1.inOut" }, 0.4)
      // …and tossed along an arc into the bag
      .to(clone, { x: dx, duration: 0.7, ease: "power1.inOut" }, 0.12)
      .to(clone, { keyframes: [{ y: peak, duration: 0.3, ease: "power2.out" }, { y: dy, duration: 0.4, ease: "power2.in" }] }, 0.12)
      .to(clone, { scale: 0.08, duration: 0.7, ease: "power1.in" }, 0.12)
      .to(clone, { opacity: 0, duration: 0.1 }, 0.76)
      .add(onLand, 0.8);
  }

  /* ---------- open / close ---------- */

  function open() {
    const el = $("bag");
    if (!el.hidden) return;
    returnFocus = document.activeElement;
    $("toasts")?.replaceChildren();      // the bag itself says it now
    render();
    el.hidden = false;
    // Everything behind is out of reach while the bag is open.
    inertBefore = ["page", "sheet"].map((id) => [$(id), $(id)?.inert]);
    inertBefore.forEach(([node]) => { if (node) node.inert = true; });
    N.scroll?.lock();
    $("bag-title").focus({ preventScroll: true });
    if (reduceMotion()) return;
    gsap.fromTo(".bag__scrim", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.fromTo("#bag-panel", { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out" });
    gsap.fromTo("#bag-lines > li, #bag-empty > *", { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out", stagger: 0.04, delay: 0.15, clearProps: "transform,opacity" });
  }

  function close({ refocus = true } = {}) {
    const el = $("bag");
    if (el.hidden) return;
    const finish = () => {
      el.hidden = true;
      gsap.set(["#bag-panel", ".bag__scrim"], { clearProps: "transform,opacity" });
      inertBefore.forEach(([node, was]) => { if (node) node.inert = !!was; });
      N.scroll?.unlock();
      if (refocus) returnFocus?.focus?.({ preventScroll: true });
    };
    if (reduceMotion()) return finish();
    gsap.to("#bag-panel", { xPercent: 100, duration: 0.3, ease: "power2.in", onComplete: finish });
    gsap.to(".bag__scrim", { opacity: 0, duration: 0.3, ease: "power2.in" });
  }

  /* ---------- toasts ---------- */

  function toast(text, { action = null } = {}) {
    const box = $("toasts");
    if (!box) return;
    while (box.children.length >= 2) box.firstElementChild.remove();
    const t = document.createElement("div");
    t.className = "toast";
    const p = document.createElement("p");
    p.textContent = text;
    t.appendChild(p);
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = action.label;
      b.addEventListener("click", () => { t.remove(); action.run(); });
      t.appendChild(b);
    }
    box.appendChild(t);
    const leave = () => gsap.to(t, { opacity: 0, duration: 0.25, onComplete: () => t.remove() });
    if (!reduceMotion()) gsap.fromTo(t, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    setTimeout(leave, 3200);
  }

  /* ---------- wiring ---------- */

  function setup() {
    load();
    paintCount();
    paintShipping();
    $("bag-open")?.addEventListener("click", open);
    document.querySelectorAll("[data-bag-open]").forEach((b) => b.addEventListener("click", open));
    document.querySelectorAll("[data-bag-close]").forEach((b) => b.addEventListener("click", () => close()));
    $("bag-checkout").addEventListener("click", () => toast("Vista previa: el pago todavía no está conectado."));
    $("bag-browse").addEventListener("click", () => {
      close({ refocus: false });
      N.shop?.close?.();
      setTimeout(() => N.scroll?.to("#shop"), 350);
    });

    // Escape closes the bag first; Tab stays inside it. Registered before the
    // sheet's handler (this script loads first), so it wins while open.
    window.addEventListener("keydown", (e) => {
      if ($("bag").hidden) return;
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      } else if (e.key === "Tab") {
        const f = [...$("bag-panel").querySelectorAll("button:not([disabled]), [tabindex]:not([tabindex='-1'])")].filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === $("bag-title"))) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    }, true);

    // Another tab changed the bag: follow it.
    addEventListener("storage", (e) => { if (e.key === KEY) { load(); changed(); } });
  }

  N.bag = { setup, add, open, close, count, subtotal, lines: () => valid() };
  N.toast = toast;
})();
