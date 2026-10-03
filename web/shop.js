/* Nomad — the collection and the product sheet.
 *
 * Collection: one rail with every piece hanging face-on. Filters slide the
 * pieces along the rail like a real rack: the ones that don't match lift off,
 * the rest slide over to close the gap and settle with a small swing. Product sheet: the garment flies from its card to the sheet's
 * stage; views (front, side, worn), sizes, a size guide that swings in like a
 * hang tag, and an "Add to bag" that only previews (no store is connected).
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");

  // "$1,290 MXN"; short form "$1,290" where space is tight (the rail).
  N.price = (amount, { short = false } = {}) => {
    if (amount == null) return "";
    const value = `$${Number(amount).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
    return short ? value : `${value} ${N.site?.currency || "MXN"}`;
  };

  let items = [];
  let reduceMotion = false;
  let current = null;     // item shown in the sheet
  let originCard = null;  // card the sheet opened from (to fly back and refocus)
  let returnFocus = null;
  let busy = false;

  /* ---------- collection: one rail ---------- */

  const CANVAS_RATIO = 1000 / 1300;  // every garment cut-out shares this canvas
  const HOOK_Y = 0.029;              // inner top of the hook curl, fraction of canvas height
  const PACK = 0.92;                 // how closely the front views hang together

  let entrance = null;     // the first "garments drop onto the rail" timeline
  let filtering = null;    // the running filter timeline
  let garmentH = 280;

  function setup() {
    items = N.items || [];
    reduceMotion = !!N.reduceMotion;
    buildRail();
    buildFilters();
    buildGuide();
    wireSheet();
    layoutRail();
    addEventListener("resize", () => requestAnimationFrame(layoutRail));
    setupEntrance();
  }

  const frontSrc = (item) => item.frames.at(-1).src;
  const sideSrc = (item) => item.frames[0].src;
  const frontExtent = (item) => { const f = item.frames.at(-1); return f.right - f.left; };

  function buildRail() {
    const row = $("shop-grid");
    $("shop-count").textContent = pad(items.length);
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "piece";
      li.dataset.cat = item.category;
      li.innerHTML = `
        <button class="piece__hang" type="button">
          <img class="piece__garment" alt="" decoding="async">
        </button>
        <div class="piece__meta">
          <p class="piece__name"><span></span></p>
          <p class="piece__line"><span class="piece__price"></span></p>
        </div>`;
      const btn = li.querySelector(".piece__hang");
      const img = li.querySelector(".piece__garment");
      img.src = frontSrc(item);
      btn.setAttribute("aria-label", `${item.name}, ${item.category}, ${N.price(item.price)}. Ver detalles`);
      li.querySelector(".piece__name span").textContent = item.name;
      // Name on top, price below with the "Nuevo" badge beside it. The category is
      // left to the filters (and the button's label): the rail has no room for it.
      li.querySelector(".piece__price").textContent = N.price(item.price, { short: true });
      if (item.isNew) {
        const badge = document.createElement("span");
        badge.className = "piece__badge";
        badge.textContent = "Nuevo";
        li.querySelector(".piece__line").appendChild(badge);
      }

      // A nudge on hover: the garment swings on its hook.
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || reduceMotion) return;
        gsap.fromTo(img, { rotation: -3 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.28)", overwrite: "auto" });
      });
      btn.addEventListener("click", () => open(item, { card: li }));
      item.card = li;
      row.appendChild(li);
    });
  }

  /* Sizes: the garments get as tall as the width allows (max 300px), so all
     pieces fit on one rail on desktop; on phones the rail scrolls sideways. */
  function layoutRail() {
    const shelf = $("shelf");
    const inner = $("shelf-inner");
    const narrow = shelf.clientWidth <= 640;
    const packs = items.reduce((sum, it) => sum + frontExtent(it) * PACK * CANVAS_RATIO, 0);
    const gaps = (items.length - 1) * 24;
    const fit = (Math.min(shelf.clientWidth, 1200) - 128 - gaps) / packs;
    // Never smaller than 230px (labels need the room): below that the rail slides sideways.
    garmentH = narrow ? 240 : Math.max(230, Math.min(300, fit));
    const w = garmentH * CANVAS_RATIO;
    const rail = N.rail || { height: 235, tubeTop: 53, tubeHeight: 47, left: 232, right: 234 };
    const tube = Math.max(7, Math.min(11, Math.round(garmentH * 0.026)));
    const k = tube / rail.tubeHeight;

    const st = inner.style;
    st.setProperty("--p-h", `${garmentH}px`);
    st.setProperty("--p-w", `${w}px`);
    st.setProperty("--rail-top", `${garmentH * HOOK_Y}px`);
    st.setProperty("--rail-h", `${rail.height * k}px`);
    st.setProperty("--rail-tube-top", `${rail.tubeTop * k}px`);
    st.setProperty("--rail-lw", `${rail.left * k}px`);
    st.setProperty("--rail-rw", `${rail.right * k}px`);
    // The rail keeps the length of the full collection, even while a filter
    // leaves fewer pieces on it: they slide along it instead of the rail shrinking.
    let full = gaps;
    items.forEach((it) => {
      const slot = frontExtent(it) * PACK * w;
      full += slot;
      it.card.style.flex = `0 0 ${slot}px`;
      it.card.style.width = `${slot}px`;
    });
    const pad = parseFloat(getComputedStyle(inner).paddingLeft) || 0;
    inner.style.width = `${full + pad * 2}px`;   // border-box: the padding sits outside the row
  }

  /* ---------- entrance: pieces drop onto the rail, once ---------- */

  function setupEntrance() {
    if (reduceMotion || !N.hasScrollTrigger) return;
    const pieces = items.map((i) => i.card);
    const hung = pieces.map((c) => c.querySelector(".piece__garment"));
    const metas = pieces.map((c) => c.querySelector(".piece__meta"));
    entrance = gsap.timeline({
      paused: true,
      onComplete: () => gsap.set([...hung, ...metas], { clearProps: "transform,opacity" }),
    })
      .from(".shelf__rail", { clipPath: "inset(0% 50% 0% 50%)", duration: 0.9, ease: "power3.inOut" })
      .from(hung, { y: -36, opacity: 0, duration: 0.65, ease: "back.out(1.5)", stagger: 0.08 }, 0.35)
      .from(metas, { y: 10, opacity: 0, duration: 0.6, ease: "expo.out", stagger: 0.08 }, 0.6);
    hung.forEach((g, i) => entrance.fromTo(g, { rotation: i % 2 ? 2.4 : -2.4 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.25)" }, 1 + i * 0.08));
    ScrollTrigger.create({ trigger: "#shelf", start: "top 82%", once: true, onEnter: () => entrance.play() });
  }

  // A filter never fights the entrance: if the pieces are still dropping, they land at once.
  function settleEntrance() {
    if (entrance && entrance.progress() < 1) entrance.progress(1);
  }

  /* ---------- filters: slide along the rail ---------- */

  function buildFilters() {
    const wrap = $("shop-filters");
    const cats = [...new Set(items.map((i) => i.category))];
    const plural = (c) => items.find((i) => i.category === c)?.categoryPlural || c;
    const options = [["Todo", null], ...cats.map((c) => [plural(c), c])];
    const buttons = options.map(([label, cat]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "filter";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(cat === null));
      const count = cat ? items.filter((i) => i.category === cat).length : items.length;
      b.innerHTML = `<span></span><sup>${count}</sup>`;
      b.firstChild.textContent = label;
      b.addEventListener("click", () => {
        if (b.getAttribute("aria-checked") === "true") return;
        buttons.forEach((o) => o.setAttribute("aria-checked", String(o === b)));
        applyFilter(cat);
      });
      wrap.appendChild(b);
      return b;
    });
  }

  function applyFilter(cat) {
    settleEntrance();
    if (filtering) filtering.progress(1);    // finish the previous change before starting this one
    // On a scrolled rail (phones) go back to its start so the new set is seen from the first piece.
    const shelf = $("shelf");
    if (shelf.scrollLeft > 0) shelf.scrollTo({ left: 0, behavior: N.reduceMotion ? "auto" : "smooth" });

    const pieces = items.map((i) => i.card);
    const wanted = (p) => !cat || p.dataset.cat === cat;
    const leaving = pieces.filter((p) => !p.hidden && !wanted(p));
    const staying = pieces.filter((p) => !p.hidden && wanted(p));
    const arriving = pieces.filter((p) => p.hidden && wanted(p));

    const rehang = () => {
      pieces.forEach((p) => { p.hidden = !wanted(p); });
      // scroll snapping would otherwise stay on the piece it rested on before the change
      shelf.scrollLeft = 0;
    };
    if (reduceMotion) return rehang();

    // Where the staying pieces hang now, to slide them from there after the re-hang.
    const before = new Map(staying.map((p) => [p, p.getBoundingClientRect().left]));
    const garment = (p) => p.querySelector(".piece__garment");
    const clean = () => {
      const all = pieces.flatMap((p) => [p, garment(p)]);
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: "transform,opacity" });
    };

    filtering = gsap.timeline({ onComplete: () => { clean(); filtering = null; } });
    // 1. Pieces that don't match lift off the rail.
    if (leaving.length) {
      filtering.to(leaving, { y: -22, opacity: 0, duration: 0.32, ease: "power2.in", stagger: 0.03 });
    }
    // 2. Re-hang, then slide the rest along the rail from where they were.
    filtering.add(() => {
      if (leaving.length) gsap.set(leaving, { clearProps: "transform,opacity" });
      rehang();
      staying.forEach((p) => {
        const dx = before.get(p) - p.getBoundingClientRect().left;
        if (Math.abs(dx) < 1) return;
        gsap.fromTo(p, { x: dx }, { x: 0, duration: 0.75, ease: "power3.inOut" });
        gsap.fromTo(garment(p), { rotation: dx > 0 ? 2.4 : -2.4 }, { rotation: 0, duration: 1.5, delay: 0.55, ease: "elastic.out(1, 0.28)" });
      });
      // 3. Pieces coming back drop onto the rail.
      arriving.forEach((p, i) => {
        gsap.fromTo(p, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.25 + i * 0.06, ease: "back.out(1.5)" });
        gsap.fromTo(garment(p), { rotation: i % 2 ? 2.4 : -2.4 }, { rotation: 0, duration: 1.5, delay: 0.75 + i * 0.06, ease: "elastic.out(1, 0.28)" });
      });
    });
    filtering.to({}, { duration: 2.4 });     // keep the timeline alive until every slide and swing has settled
  }

  /* ---------- product sheet ---------- */

  const sheet = () => $("sheet");

  function open(item, { card = null } = {}) {
    if (busy || !item) return;
    busy = true;
    current = item;
    originCard = card;
    returnFocus = document.activeElement;
    fill(item);
    N.scroll?.lock();

    const el = sheet();
    el.hidden = false;
    // A true modal: the page behind can't be reached by Tab or by screen readers.
    $("page").inert = true;
    const stageImg = $("sheet-stage").querySelector(".sheet__img.is-on");
    const chrome = [...el.querySelectorAll(".sheet__info > *, .sheet__views, .sheet__close")];

    if (reduceMotion) {
      busy = false;
      $("sheet-panel").querySelector(".sheet__close").focus({ preventScroll: true });
      return;
    }
    gsap.fromTo(".sheet__scrim", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    gsap.fromTo("#sheet-panel", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
    gsap.fromTo(chrome, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.04, delay: 0.2 });

    // The garment travels from its card to the stage.
    const from = card?.querySelector(".piece__garment");
    if (from && stageImg) {
      const a = from.getBoundingClientRect();
      const b = stageImg.getBoundingClientRect();
      gsap.fromTo(stageImg,
        { x: a.left - b.left, y: a.top - b.top, scale: a.width / b.width, transformOrigin: "0 0" },
        { x: 0, y: 0, scale: 1, duration: 0.85, ease: "power3.inOut", onComplete: done });
      from.style.visibility = "hidden";
    } else {
      gsap.fromTo(stageImg, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.4)", onComplete: done });
    }
    function done() {
      busy = false;
      $("sheet-panel").querySelector(".sheet__close").focus({ preventScroll: true });
    }
  }

  function close() {
    if (busy || sheet().hidden) return;
    busy = true;
    closeGuide(true);
    const el = sheet();
    const card = originCard;
    const finish = () => {
      el.hidden = true;
      gsap.set([".sheet__scrim", "#sheet-panel", "#sheet-stage"], { clearProps: "opacity,backgroundColor,backgroundImage,boxShadow,background" });
      gsap.set(el.querySelectorAll(".sheet__info, .sheet__views, .sheet__close, .sheet__rod"), { clearProps: "opacity" });
      if (card) card.querySelector(".piece__garment").style.visibility = "";
      $("page").inert = false;
      N.scroll?.unlock();
      busy = false;
      (card?.querySelector(".piece__hang") || returnFocus)?.focus?.({ preventScroll: true });
    };
    if (reduceMotion) return finish();

    const stageImg = $("sheet-stage").querySelector(".sheet__img.is-on");
    const target = card?.querySelector(".piece__garment");
    const front = stageImg?.dataset.view === "front";
    if (target && stageImg && front) {
      // Hang it back on its card.
      const a = target.getBoundingClientRect();
      const b = stageImg.getBoundingClientRect();
      // Text and the stage's backdrop leave first, so only the garment travels.
      const chrome = [...el.querySelectorAll(".sheet__info, .sheet__views, .sheet__close, .sheet__rod")];
      gsap.to(chrome, { opacity: 0, duration: 0.25, ease: "power2.in" });
      gsap.set("#sheet-panel", { backgroundColor: "rgba(231, 230, 225, 0)", backgroundImage: "none", boxShadow: "none" });
      gsap.set("#sheet-stage", { background: "transparent" });
      gsap.to(stageImg, { x: a.left - b.left, y: a.top - b.top, scale: a.width / b.width, transformOrigin: "0 0", duration: 0.7, ease: "power3.inOut" });
      gsap.to(".sheet__scrim", { opacity: 0, duration: 0.7, ease: "power2.inOut", onComplete: () => {
        finish();
        gsap.fromTo(target, { rotation: 3 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.28)" });
      } });
    } else {
      gsap.to(["#sheet-panel", ".sheet__scrim"], { opacity: 0, duration: 0.4, ease: "power2.in", onComplete: finish });
    }
  }

  function fill(item) {
    $("sheet-cat").textContent = item.category;
    $("sheet-name").textContent = item.name;
    $("sheet-price").textContent = N.price(item.price);
    $("sheet-desc").textContent = item.description || "";
    $("sheet-care").textContent = item.care || "";
    $("sheet-status").textContent = "";

    const details = $("sheet-details");
    details.replaceChildren(...(item.details || []).map((d) => {
      const li = document.createElement("li");
      li.textContent = d;
      return li;
    }));

    const sizes = $("sheet-sizes");
    sizes.replaceChildren(...(item.sizes || []).map((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.textContent = s;
      b.addEventListener("click", () => {
        sizes.querySelectorAll("button").forEach((o) => o.setAttribute("aria-checked", String(o === b)));
        $("sheet-status").textContent = "";
      });
      return b;
    }));

    // Views: front and side on the rod, plus the lookbook photo when there is one.
    const views = [
      { key: "front", label: "Frente", alt: "vista de frente", src: frontSrc(item), kind: "garment" },
      { key: "side", label: "Lado", alt: "vista de lado", src: sideSrc(item), kind: "garment" },
    ];
    if (item.look?.photo) views.push({ key: "worn", label: "Puesta", alt: "puesta", src: item.look.photo, kind: "photo" });

    const stage = $("sheet-stage");
    stage.querySelectorAll(".sheet__img").forEach((n) => n.remove());
    const tabs = $("sheet-views");
    tabs.replaceChildren();
    views.forEach((v, i) => {
      const img = document.createElement("img");
      img.className = `sheet__img sheet__img--${v.kind}${i === 0 ? " is-on" : ""}`;
      img.src = v.src;
      img.alt = v.key === "worn" ? `${item.name} puesta` : `${item.name}, ${v.alt}`;
      img.dataset.view = v.key;
      stage.appendChild(img);

      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "sheet__view";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(i === 0));
      tab.textContent = v.label;
      tab.dataset.view = v.key;
      tab.addEventListener("click", () => showView(v.key));
      tabs.appendChild(tab);
    });
    stage.classList.toggle("is-photo", false);
  }

  function showView(key) {
    const stage = $("sheet-stage");
    const next = stage.querySelector(`.sheet__img[data-view="${key}"]`);
    const prev = stage.querySelector(".sheet__img.is-on");
    if (!next || next === prev) return;
    $("sheet-views").querySelectorAll(".sheet__view").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.view === key)));
    prev.classList.remove("is-on");
    next.classList.add("is-on");
    stage.classList.toggle("is-photo", next.classList.contains("sheet__img--photo"));
    if (reduceMotion) {
      gsap.set([prev, next], { clearProps: "opacity" });
      return;
    }
    gsap.to(prev, { opacity: 0, duration: 0.35, ease: "power2.out", overwrite: true });
    gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out", overwrite: true });
    if (next.classList.contains("sheet__img--garment")) {
      gsap.fromTo(next, { rotation: -2.5 }, { rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" });
    }
  }

  function addToBag() {
    const chosen = $("sheet-sizes").querySelector('[aria-checked="true"]');
    const status = $("sheet-status");
    if (!chosen) {
      status.textContent = "Elige una talla.";
      if (!reduceMotion) gsap.fromTo("#sheet-sizes", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    status.textContent = `${current.name}, talla ${chosen.textContent}: esto es una vista previa del diseño; la bolsa aún no está conectada.`;
  }

  /* ---------- size guide: a hang tag that swings in ---------- */

  function buildGuide() {
    const g = N.site?.sizeGuide;
    if (!g) return;
    $("guide-unit").textContent = g.unit || "cm";
    const head = `<thead><tr><th scope="col">Talla</th>${(g.columns || []).map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>`;
    const rows = Object.entries(g.rows || {}).map(([size, vals]) =>
      `<tr><th scope="row">${size}</th>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
    $("guide-table").innerHTML = `${head}<tbody>${rows}</tbody>`;
  }

  function openGuide() {
    const guide = $("guide");
    if (!guide.hidden) return;
    guide.hidden = false;
    $("sheet-guide-open").setAttribute("aria-expanded", "true");
    if (!reduceMotion) {
      gsap.fromTo("#guide-swing", { rotation: -10, opacity: 0 }, { rotation: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.32)" });
    }
    $("guide-close").focus({ preventScroll: true });
  }

  function closeGuide(silent = false) {
    const guide = $("guide");
    if (guide.hidden) return;
    $("sheet-guide-open").setAttribute("aria-expanded", "false");
    const hide = () => { guide.hidden = true; if (!silent) $("sheet-guide-open").focus({ preventScroll: true }); };
    if (reduceMotion || silent) return hide();
    gsap.to("#guide-swing", { opacity: 0, y: -12, duration: 0.25, ease: "power2.in", onComplete: () => { hide(); gsap.set("#guide-swing", { clearProps: "y" }); } });
  }

  /* ---------- wiring ---------- */

  function wireSheet() {
    sheet().querySelectorAll("[data-sheet-close]").forEach((b) => b.addEventListener("click", close));
    $("sheet-add").addEventListener("click", addToBag);
    $("sheet-guide-open").addEventListener("click", openGuide);
    $("guide-close").addEventListener("click", () => closeGuide());

    // Escape closes the guide first, then the sheet; Tab stays inside the sheet.
    window.addEventListener("keydown", (e) => {
      if (sheet().hidden) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!$("guide").hidden) closeGuide();
        else close();
      } else if (e.key === "Tab") {
        const focusables = [...$("sheet-panel").querySelectorAll("button, input, summary, [tabindex]:not([tabindex='-1'])")]
          .filter((n) => n.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
  }

  N.shop = { setup, open: (item, opts) => open(item, opts) };
})();
