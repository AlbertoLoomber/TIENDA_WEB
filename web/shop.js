/* Nomad — the collection and the product sheet.
 *
 * Collection: one rail with every piece hanging face-on. Filters slide the
 * pieces along the rail like a real rack: the ones that don't match lift off,
 * the rest slide over to close the gap and settle with a small swing. Product sheet: the garment flies from its card to the sheet's
 * stage; views (front, side, worn, up close), sizes, a size guide that swings in like a
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
  const PACK = 0.92;
  const TAG_REST = [-4, 3, -2, 5, -3];   // price tags don't all hang at the same angle                 // how closely the front views hang together

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
    N.swipeHint?.($("shelf"), "coleccion");
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
          <span class="piece__body"><img class="piece__garment" alt="" decoding="async"></span>
        </button>
        <div class="piece__meta">
          <p class="piece__name"><span></span></p>
          <p class="piece__line"><span class="piece__price"></span></p>
          <div class="piece__quick" role="group"></div>
        </div>`;
      const btn = li.querySelector(".piece__hang");
      const img = li.querySelector(".piece__garment");
      const body = li.querySelector(".piece__body");   // garment + its price tag: they move together
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

      // The price also hangs from the hanger on a little card (aria-hidden: the
      // line below says it for screen readers).
      if (N.features?.priceTag !== false) {
        li.classList.add("has-tag");
        const tag = document.createElement("span");
        tag.className = "piece__tag";
        tag.setAttribute("aria-hidden", "true");
        tag.style.setProperty("--rest", `${TAG_REST[items.indexOf(item) % TAG_REST.length]}deg`);
        tag.innerHTML = '<span class="piece__tag-string"></span><span class="piece__tag-card"></span>';
        tag.querySelector(".piece__tag-card").textContent = N.price(item.price, { short: true });
        body.appendChild(tag);
      }

      // Quick add (mouse and keyboard): the sizes appear under the price.
      const quick = li.querySelector(".piece__quick");
      if (N.features?.quickAdd === false) quick.remove();
      quick.setAttribute("aria-label", `Agregar rápido ${item.name}`);
      if (N.features?.quickAdd !== false) (item.sizes || []).forEach((size) => {
        const q = document.createElement("button");
        q.type = "button";
        q.className = "piece__size";
        q.textContent = size;
        if ((item.soldOut || []).includes(size)) {
          q.disabled = true;
          q.setAttribute("aria-label", `Talla ${size} agotada`);
        } else {
          q.setAttribute("aria-label", `Agregar ${item.name}, talla ${size}`);
          q.addEventListener("click", (e) => {
            e.stopPropagation();
            N.bag?.add(item, size, { from: img });
            q.classList.add("is-added");
            setTimeout(() => q.classList.remove("is-added"), 900);
          });
        }
        quick.appendChild(q);
      });

      // A nudge on hover: the garment swings on its hook.
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || reduceMotion) return;
        gsap.fromTo(body, { rotation: -3 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.28)", overwrite: "auto" });
        // the tag trails a little behind the garment
        const tag = body.querySelector(".piece__tag");
        if (tag) gsap.fromTo(tag, { rotation: 0 }, { keyframes: [{ rotation: 8, duration: 0.35, ease: "power2.out" }, { rotation: 0, duration: 1.3, ease: "elastic.out(1, 0.3)" }], delay: 0.08, overwrite: "auto" });
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
    const hung = pieces.map((c) => c.querySelector(".piece__body"));
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
    const garment = (p) => p.querySelector(".piece__body");
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

  function open(item, { card = null, route = "push" } = {}) {
    if (busy || !item) return;
    busy = true;
    current = item;
    N.turn?.loadSpin?.(item, "full");   // the real turn's large frames, for dragging
    setRoute(item, route);
    originCard = card;
    returnFocus = document.activeElement;
    fill(item);
    N.scroll?.lock();

    const el = sheet();
    el.hidden = false;
    // A true modal: the page behind can't be reached by Tab or by screen readers.
    $("page").inert = true;
    N.shop.checkSticky?.();
    showHint();
    const stageImg = $("sheet-stage").querySelector(".sheet__img.is-on");
    const chrome = [...el.querySelectorAll(".sheet__info > *, .sheet__views, .sheet__top")];

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
      card.querySelector(".piece__body").style.visibility = "hidden";
    } else {
      gsap.fromTo(stageImg, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.4)", onComplete: done });
    }
    function done() {
      busy = false;
      $("sheet-panel").querySelector(".sheet__close").focus({ preventScroll: true });
    }
  }

  function close({ fromHistory = false } = {}) {
    if (busy || sheet().hidden) return;
    busy = true;
    closeGuide(true);
    closeFit(true);
    N.shop.closeShare?.();
    N.shop.hideSticky?.();
    const el = sheet();
    const card = originCard;
    const finish = () => {
      el.hidden = true;
      gsap.set([".sheet__scrim", "#sheet-panel", "#sheet-stage"], { clearProps: "opacity,backgroundColor,backgroundImage,boxShadow,background" });
      gsap.set(el.querySelectorAll(".sheet__info, .sheet__views, .sheet__top, .sheet__rod"), { clearProps: "opacity" });
      if (card) card.querySelector(".piece__body").style.visibility = "";
      $("page").inert = false;
      N.scroll?.unlock();
      clearRoute(fromHistory);
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
      const chrome = [...el.querySelectorAll(".sheet__info, .sheet__views, .sheet__top, .sheet__rod")];
      gsap.to(chrome, { opacity: 0, duration: 0.25, ease: "power2.in" });
      gsap.set("#sheet-panel", { backgroundColor: "rgba(231, 230, 225, 0)", backgroundImage: "none", boxShadow: "none" });
      gsap.set("#sheet-stage", { background: "transparent" });
      gsap.to(stageImg, { x: a.left - b.left, y: a.top - b.top, scale: a.width / b.width, transformOrigin: "0 0", duration: 0.7, ease: "power3.inOut" });
      gsap.to(".sheet__scrim", { opacity: 0, duration: 0.7, ease: "power2.inOut", onComplete: () => {
        finish();
        gsap.fromTo(target.closest(".piece__body"), { rotation: 3 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.28)" });
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
    const soldOut = item.soldOut || [];
    sizes.replaceChildren(...(item.sizes || []).map((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.textContent = s;
      if (soldOut.includes(s)) {
        // Sold out: shown struck through, can't be chosen.
        b.setAttribute("aria-disabled", "true");
        b.setAttribute("aria-label", `${s}, agotada`);
        b.classList.add("is-soldout");
        return b;
      }
      b.addEventListener("click", () => {
        sizes.querySelectorAll("button").forEach((o) => o.setAttribute("aria-checked", String(o === b)));
        $("sheet-status").textContent = "";
        paintSticky();
      });
      return b;
    }));

    // Who is wearing it, for the worn photo (provisional data).
    const model = item.look?.photo && item.look?.model;
    $("sheet-model").textContent = model
      ? `${model.articulo} modelo mide ${Number(model.estatura).toFixed(2)} m y usa talla ${model.talla}.` : "";
    paintSuggestion();

    // Views: front and side on the rod, plus the lookbook photo when there is one.
    const views = [
      { key: "front", label: "Frente", alt: "vista de frente", src: frontSrc(item), kind: "garment" },
      { key: "side", label: "Lado", alt: "vista de lado", src: sideSrc(item), kind: "garment" },
    ];
    if (item.look?.photo) views.push({ key: "worn", label: "Puesta", alt: "puesta", src: item.look.photo, kind: "photo" });
    // The print up close (a sample crop until the macro photo arrives).
    if (item.closeup?.src) views.push({ key: "closeup", label: "De cerca", alt: "detalle del estampado", src: item.closeup.src, kind: "photo", sample: item.closeup.sample });

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
      if (v.sample) img.dataset.sample = "";
      if (v.key === "closeup") img.loading = "lazy";
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
    $("sheet-sample").hidden = true;
    stage.setAttribute("aria-label", `${item.name}: vista de frente. Usa las flechas o arrastra para girarla.`);
    paintSticky();
  }

  function showView(key, { instant = false } = {}) {
    const stage = $("sheet-stage");
    const next = stage.querySelector(`.sheet__img[data-view="${key}"]`);
    const prev = stage.querySelector(".sheet__img.is-on");
    if (!next || next === prev) return;
    $("sheet-views").querySelectorAll(".sheet__view").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.view === key)));
    prev.classList.remove("is-on");
    next.classList.add("is-on");
    stage.classList.toggle("is-photo", next.classList.contains("sheet__img--photo"));
    $("sheet-sample").hidden = !("sample" in next.dataset);
    stage.setAttribute("aria-label", `${current?.name || ""}: ${next.alt.replace(`${current?.name}, `, "")}. Usa las flechas o arrastra para girarla.`);
    if (reduceMotion || instant) {
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
    status.textContent = "";
    const from = $("sheet-stage").querySelector(".sheet__img.is-on");
    N.bag?.add(current, chosen.textContent, { from });
  }

  /* ---------- drag to turn ---------- */

  // In the sheet the garment turns on its hook under the finger or the mouse:
  // drag one way and it shows its side (the view it has on the rack), let go
  // and it settles on the nearest view. The other way it only gives a little
  // and comes back, until a right-side photo exists (docs/PROMPTS.md 16.2).
  // The tabs stay the accessible way to change views; arrows work too.
  function setupDragTurn() {
    if (N.features?.dragTurn === false) return;
    const stage = $("sheet-stage");
    stage.tabIndex = 0;
    stage.setAttribute("role", "img");
    stage.setAttribute("aria-roledescription", "visor");
    let st = null;

    const viewNow = () => stage.querySelector(".sheet__img.is-on")?.dataset.view;
    const paint = (p, s = st) => {
      if (p >= 0) {
        s.turn.p = 1 - p;           // the turn runs side (0) → front (1)
        s.box.style.transform = "";
      } else {
        s.turn.p = 1;
        s.box.style.transform = `perspective(1200px) rotateY(${p * 14}deg)`;
      }
      N.turn.render(s.turn);
    };
    const begin = () => {
      const box = document.createElement("div");
      box.className = "sheet__turn";
      stage.appendChild(box);
      st.box = box;
      const { frames, video } = N.turn.framesFor?.(current, "full") || { frames: current.frames, video: false };
      st.turn = N.turn.make(box, frames, { video });
      st.w = stage.clientWidth;
      stage.classList.add("is-turning");
      hideHint();
    };
    const end = () => {
      const s0 = st;
      st = null;
      if (!s0.box) return;
      const p = s0.p;
      // where to settle: past halfway, or flicked, goes to the side; else front
      let target = p > 0.5 ? 1 : 0;
      if (s0.v < -0.6 && p > 0.15) target = 1;
      if (s0.v > 0.6 && p < 0.85) target = 0;
      if (p < 0) target = 0;
      const finish = () => {
        showView(target ? "side" : "front", { instant: true });
        s0.box.remove();
        stage.classList.remove("is-turning");
      };
      if (reduceMotion) return finish();
      const o = { p };
      gsap.to(o, { p: target, duration: 0.6, ease: "power3.out", onUpdate: () => paint(o.p, s0), onComplete: finish });
    };

    stage.addEventListener("pointerdown", (e) => {
      if (busy || !current || !N.turn || e.button > 0) return;
      const view = viewNow();
      if (view !== "front" && view !== "side") return;
      st = { id: e.pointerId, x: e.clientX, y: e.clientY, p0: view === "side" ? 1 : 0, p: view === "side" ? 1 : 0, v: 0, lastX: e.clientX, lastT: performance.now(), box: null };
    });
    stage.addEventListener("pointermove", (e) => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x;
      if (!st.box) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - st.y)) return;
        stage.setPointerCapture?.(e.pointerId);
        begin();
      }
      const now = performance.now();
      st.v += ((e.clientX - st.lastX) / Math.max(1, now - st.lastT) - st.v) * 0.4;
      st.lastX = e.clientX;
      st.lastT = now;
      st.p = Math.max(-1, Math.min(1, st.p0 - dx / (st.w * 0.45)));
      paint(st.p);
    });
    const up = (e) => { if (st && e.pointerId === st.id) end(); };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); showView("side"); }
      if (e.key === "ArrowRight") { e.preventDefault(); showView("front"); }
    });
  }

  // "Arrastra para girar": once per visit, gone at the first drag or after 4 s.
  let hintTimer = 0;
  function showHint() {
    if (N.features?.dragTurn === false) return;
    try { if (sessionStorage.getItem("nomad.arrastra") === "1") return; } catch (e) { /* show it */ }
    const hint = $("sheet-drag-hint");
    hint.hidden = false;
    if (!reduceMotion) gsap.fromTo(hint, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.9, ease: "power2.out" });
    clearTimeout(hintTimer);
    hintTimer = setTimeout(hideHint, 4800);
  }
  function hideHint() {
    const hint = $("sheet-drag-hint");
    clearTimeout(hintTimer);
    if (hint.hidden) return;
    try { sessionStorage.setItem("nomad.arrastra", "1"); } catch (e) { /* fine */ }
    gsap.to(hint, { opacity: 0, duration: 0.3, onComplete: () => { hint.hidden = true; gsap.set(hint, { clearProps: "opacity,transform" }); } });
  }

  /* ---------- sticky "Agregar" bar (phones and tablets) ---------- */

  // When the main button scrolls out of the sheet, a small bar keeps it at hand.
  let stickyObserver = null;
  function setupSticky() {
    const bar = $("sheet-sticky");
    const narrow = matchMedia("(max-width: 900px)");
    $("sticky-add").addEventListener("click", () => {
      if ($("sheet-sizes").querySelector('[aria-checked="true"]')) return addToBag();
      // No size yet: take the visitor to the sizes and say so.
      $("sheet-sizes").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      addToBag();
    });
    let shown = false;
    const show = (on) => {
      if (on === shown) return;
      shown = on;
      if (on) {
        bar.hidden = false;
        if (!reduceMotion) gsap.fromTo(bar, { yPercent: 130 }, { yPercent: 0, duration: 0.3, ease: "power3.out" });
      } else if (reduceMotion) {
        bar.hidden = true;
      } else {
        gsap.to(bar, { yPercent: 130, duration: 0.25, ease: "power2.in", onComplete: () => { if (!shown) bar.hidden = true; } });
      }
    };
    stickyObserver = new IntersectionObserver(([entry]) => {
      show(narrow.matches && !sheet().hidden && !entry.isIntersecting);
    }, { root: $("sheet-panel"), threshold: 0 });
    stickyObserver.observe($("sheet-add"));
    N.shop.hideSticky = () => show(false);
    // The observer only reports changes; a sheet that opens with the button
    // already out of view is not one, so ask again on every opening.
    N.shop.checkSticky = () => { stickyObserver.unobserve($("sheet-add")); stickyObserver.observe($("sheet-add")); };
  }

  function paintSticky() {
    const chosen = $("sheet-sizes").querySelector('[aria-checked="true"]');
    $("sticky-name").textContent = current?.name || "";
    $("sticky-meta").textContent = `${chosen ? `Talla ${chosen.textContent} · ` : ""}${N.price(current?.price)}`;
    $("sticky-add").textContent = chosen ? "Agregar" : "Elige talla";
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

  /* ---------- a link of its own for every garment ---------- */

  // Opening a garment puts #/prenda/<slug> in the address bar, so it can be
  // shared and opened directly; the browser's back button closes it again.
  const ROUTE = /^#\/prenda\/([\w-]+)$/;
  let pushed = false;            // we added a history entry for the open sheet
  let baseTitle = document.title;
  const linkFor = (item) => `${location.href.split("#")[0]}#/prenda/${item.slug}`;

  function setRoute(item, mode) {
    document.title = `${item.name} · Nomad`;
    if (mode === "none" || !item.slug) return;
    const hash = `#/prenda/${item.slug}`;
    try {
      if (mode === "push" && location.hash !== hash) { history.pushState({ prenda: item.slug }, "", hash); pushed = true; }
      else if (mode === "replace") history.replaceState({ prenda: item.slug }, "", hash);
    } catch (e) { /* sandboxed frames may refuse: the sheet works without it */ }
  }

  function clearRoute(fromHistory) {
    document.title = baseTitle;
    if (fromHistory) { pushed = false; return; }
    try {
      if (pushed) history.back();
      else if (ROUTE.test(location.hash)) history.replaceState(null, "", location.href.split("#")[0]);
    } catch (e) { /* see above */ }
    pushed = false;
  }

  function followRoute({ initial = false } = {}) {
    const m = location.hash.match(ROUTE);
    const item = m && items.find((it) => it.slug === m[1]);
    if (item && sheet().hidden) open(item, { route: "none" });
    else if (!item && !sheet().hidden && !initial) close({ fromHistory: true });
    else if (m && !item) {
      try { history.replaceState(null, "", location.href.split("#")[0]); } catch (e) { /* fine */ }
    }
  }

  /* ---------- share ---------- */

  function setupShare() {
    const btn = $("sheet-share");
    const menu = $("share-menu");
    const toggle = (on) => { menu.hidden = !on; btn.setAttribute("aria-expanded", String(on)); };
    btn.addEventListener("click", async () => {
      const url = linkFor(current);
      const text = `Mira esta prenda de Nomad: ${current.name}`;
      if (navigator.share) {
        try { await navigator.share({ title: `${current.name} · Nomad`, text, url }); return; } catch (e) { if (e.name === "AbortError") return; }
      }
      $("share-wa").href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      toggle(menu.hidden);
      if (!menu.hidden) $("share-copy").focus();
    });
    $("share-copy").addEventListener("click", async () => {
      const url = linkFor(current);
      try { await navigator.clipboard.writeText(url); N.toast?.("Enlace copiado"); }
      catch (e) { N.toast?.(url); }
      toggle(false);
      btn.focus();
    });
    $("share-wa").addEventListener("click", () => toggle(false));
    document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".share")) toggle(false); });
    N.shop.closeShare = () => { if (menu.hidden) return false; toggle(false); btn.focus(); return true; };
  }

  /* ---------- "¿Qué talla soy?" ---------- */

  const FIT_KEY = "nomad.medidas";
  let fitChoice = "normal";

  // Weight sets the base size; height and the preferred fit move it one step.
  function recommend({ height, weight, fit }, r = N.site?.recommender) {
    if (!r) return null;
    const order = r.orden;
    let i = order.indexOf((r.peso.find(([max]) => weight < max) || r.peso.at(-1))[1]);
    if (height >= r.estatura_alta) i++;
    if (height <= r.estatura_baja) i--;
    i += r.ajuste[fit] || 0;
    i = Math.max(0, Math.min(order.length - 1, i));
    return { size: order[i], roomier: order[Math.min(order.length - 1, i + 1)] };
  }
  N.recommend = recommend;   // exposed for the tests

  function readMeasures() {
    try { return JSON.parse(localStorage.getItem(FIT_KEY) || "null"); } catch (e) { return null; }
  }

  // With saved measures every sheet shows its suggestion next to "Talla".
  function paintSuggestion() {
    const m = readMeasures();
    const rec = m && current && recommend(m);
    $("sheet-suggest").textContent = rec ? `Tu talla sugerida: ${rec.size}` : "";
  }

  function computeFit({ quiet = false } = {}) {
    const r = N.site?.recommender;
    const h = Number($("fit-height").value);
    const w = Number($("fit-weight").value);
    const [hMin, hMax] = r?.limites?.estatura || [140, 210];
    const [wMin, wMax] = r?.limites?.peso || [40, 150];
    const err = $("fit-error");
    $("fit-result").hidden = true;
    $("fit-use").hidden = true;
    if (!h || !w) { err.textContent = ""; return; }
    if (h < hMin || h > hMax) { if (!quiet) err.textContent = "Escribe tu estatura en centímetros, por ejemplo 175."; return; }
    if (w < wMin || w > wMax) { if (!quiet) err.textContent = "Escribe tu peso en kilos, por ejemplo 70."; return; }
    err.textContent = "";
    const rec = recommend({ height: h, weight: w, fit: fitChoice });
    if (!rec) return;
    try { localStorage.setItem(FIT_KEY, JSON.stringify({ height: h, weight: w, fit: fitChoice })); } catch (e) { /* fine */ }
    const soldOut = current?.soldOut || [];
    let size = rec.size;
    if (soldOut.includes(size)) {
      $("fit-answer").textContent = `La ${size} está agotada.`;
      size = current.sizes.find((s) => !soldOut.includes(s) && current.sizes.indexOf(s) > current.sizes.indexOf(rec.size)) || null;
      $("fit-alt").textContent = size ? `La ${size} te quedará un poco más holgada.` : "Prueba con otra prenda o vuelve pronto.";
    } else {
      $("fit-answer").textContent = `Te recomendamos la ${size}.`;
      $("fit-alt").textContent = rec.roomier !== size ? `Si te gusta más holgada, prueba la ${rec.roomier}.` : "";
    }
    $("fit-result").hidden = false;
    if (size) {
      $("fit-use").hidden = false;
      $("fit-use").textContent = `Usar talla ${size}`;
      $("fit-use").dataset.size = size;
    }
    paintSuggestion();
  }

  function openFit() {
    const fit = $("fit");
    if (!fit.hidden) return;
    closeGuide(true);
    const m = readMeasures();
    if (m) {
      $("fit-height").value = m.height; $("fit-weight").value = m.weight;
      fitChoice = m.fit || "normal";
    }
    fit.querySelectorAll("[data-fit]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.fit === fitChoice)));
    computeFit({ quiet: true });
    fit.hidden = false;
    $("sheet-fit-open").setAttribute("aria-expanded", "true");
    if (!reduceMotion) gsap.fromTo("#fit-swing", { rotation: -10, opacity: 0 }, { rotation: 0, opacity: 1, duration: 2, ease: "elastic.out(1, 0.32)" });
    $("fit-height").focus({ preventScroll: true });
  }

  function closeFit(silent = false) {
    const fit = $("fit");
    if (fit.hidden) return;
    $("sheet-fit-open").setAttribute("aria-expanded", "false");
    const hide = () => { fit.hidden = true; if (!silent) $("sheet-fit-open").focus({ preventScroll: true }); };
    if (reduceMotion || silent) return hide();
    gsap.to("#fit-swing", { opacity: 0, y: -12, duration: 0.25, ease: "power2.in", onComplete: () => { hide(); gsap.set("#fit-swing", { clearProps: "y" }); } });
  }

  function setupFit() {
    $("sheet-fit-open").addEventListener("click", openFit);
    $("fit-close").addEventListener("click", () => closeFit());
    $("fit-form").addEventListener("submit", (e) => { e.preventDefault(); computeFit(); });
    ["fit-height", "fit-weight"].forEach((id) => {
      $(id).addEventListener("input", () => computeFit({ quiet: true }));
      $(id).addEventListener("change", () => computeFit());
    });
    $("fit").querySelectorAll("[data-fit]").forEach((b, _, all) => b.addEventListener("click", () => {
      fitChoice = b.dataset.fit;
      all.forEach((o) => o.setAttribute("aria-checked", String(o === b)));
      computeFit();
    }));
    $("fit-use").addEventListener("click", () => {
      const btn = [...$("sheet-sizes").children].find((o) => o.textContent === $("fit-use").dataset.size);
      btn?.click();
      closeFit(true);
      btn?.focus({ preventScroll: true });
    });
  }

  /* ---------- wiring ---------- */

  function wireSheet() {
    sheet().querySelectorAll("[data-sheet-close]").forEach((b) => b.addEventListener("click", close));
    $("sheet-add").addEventListener("click", addToBag);
    $("sheet-guide-open").addEventListener("click", () => { closeFit(true); openGuide(); });
    setupSticky();
    setupShare();
    setupFit();
    setupDragTurn();
    addEventListener("popstate", () => followRoute());
    addEventListener("hashchange", () => followRoute());
    $("guide-close").addEventListener("click", () => closeGuide());

    // Escape closes the guide first, then the sheet; Tab stays inside the sheet.
    window.addEventListener("keydown", (e) => {
      if (sheet().hidden) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        if (N.shop.closeShare?.()) return;
        if (!$("fit").hidden) closeFit();
        else if (!$("guide").hidden) closeGuide();
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

  N.shop = Object.assign(N.shop || {}, {
    setup,
    open: (item, opts) => open(item, opts),
    close: () => close(),
    followRoute: (opts) => followRoute(opts),
  });
})();
