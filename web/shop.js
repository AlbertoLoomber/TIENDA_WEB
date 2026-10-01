/* Nomad — the collection and the product sheet.
 *
 * Collection: every piece hangs from its own short rod; filters re-hang the
 * rail with GSAP Flip (cards that stay glide to their new place, the others
 * step out). Product sheet: the garment flies from its card to the sheet's
 * stage; views (front, side, worn), sizes, a size guide that swings in like a
 * hang tag, and an "Add to bag" that only previews (no store is connected).
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");

  N.price = (amount) => {
    if (amount == null) return "";
    const currency = N.site?.currency || "MXN";
    return `$${Number(amount).toLocaleString("en-US")} ${currency}`;
  };

  let items = [];
  let reduceMotion = false;
  let current = null;     // item shown in the sheet
  let originCard = null;  // card the sheet opened from (to fly back and refocus)
  let returnFocus = null;
  let busy = false;

  /* ---------- collection ---------- */

  function setup() {
    items = N.items || [];
    reduceMotion = !!N.reduceMotion;
    if (typeof Flip !== "undefined") gsap.registerPlugin(Flip);
    buildGrid();
    buildFilters();
    buildGuide();
    wireSheet();
  }

  const frontSrc = (item) => item.frames.at(-1).src;
  const sideSrc = (item) => item.frames[0].src;

  function buildGrid() {
    const grid = $("shop-grid");
    $("shop-count").textContent = pad(items.length);
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "card";
      li.dataset.cat = item.category;
      li.innerHTML = `
        <button class="card__frame" type="button">
          <span class="card__rod" aria-hidden="true"></span>
          <img class="card__garment" alt="" loading="lazy" decoding="async">
          <span class="card__view" aria-hidden="true">View</span>
        </button>
        <div class="card__meta">
          <p class="card__name"></p>
          <p class="card__line"><span class="card__cat"></span><span class="card__price"></span></p>
        </div>`;
      const btn = li.querySelector(".card__frame");
      const img = li.querySelector(".card__garment");
      img.src = frontSrc(item);
      btn.setAttribute("aria-label", `${item.name}, ${item.category}, ${N.price(item.price)}. View details`);
      if (item.isNew) {
        const badge = document.createElement("span");
        badge.className = "card__badge";
        badge.textContent = "New";
        btn.appendChild(badge);
      }
      li.querySelector(".card__name").textContent = item.name;
      li.querySelector(".card__cat").textContent = item.category;
      li.querySelector(".card__price").textContent = N.price(item.price);

      // A nudge on hover: the garment swings on its hook.
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || reduceMotion) return;
        gsap.fromTo(img, { rotation: -3 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.28)", overwrite: true });
      });
      btn.addEventListener("click", () => open(item, { card: li }));
      item.card = li;
      grid.appendChild(li);
    });
  }

  function buildFilters() {
    const wrap = $("shop-filters");
    const cats = [...new Set(items.map((i) => i.category))];
    const options = [["All", null], ...cats.map((c) => [c, c])];
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
    const cards = items.map((i) => i.card);
    const show = (card) => !cat || card.dataset.cat === cat;
    if (typeof Flip === "undefined" || reduceMotion) {
      cards.forEach((c) => { c.hidden = !show(c); });
      if (N.hasScrollTrigger) ScrollTrigger.refresh();
      return;
    }
    const state = Flip.getState(cards, { props: "opacity" });
    cards.forEach((c) => { c.hidden = !show(c); });
    Flip.from(state, {
      duration: 0.7,
      ease: "power3.inOut",
      absolute: true,
      nested: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.4)", stagger: 0.05 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3, ease: "power2.in" }),
      // Sections below (the pinned lookbook) depend on this height: re-measure.
      onComplete: () => N.hasScrollTrigger && ScrollTrigger.refresh(),
    });
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
    const from = card?.querySelector(".card__garment");
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
      if (card) card.querySelector(".card__garment").style.visibility = "";
      N.scroll?.unlock();
      busy = false;
      (card?.querySelector(".card__frame") || returnFocus)?.focus?.({ preventScroll: true });
    };
    if (reduceMotion) return finish();

    const stageImg = $("sheet-stage").querySelector(".sheet__img.is-on");
    const target = card?.querySelector(".card__garment");
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
      { key: "front", label: "Front", src: frontSrc(item), kind: "garment" },
      { key: "side", label: "Side", src: sideSrc(item), kind: "garment" },
    ];
    if (item.look?.photo) views.push({ key: "worn", label: "Worn", src: item.look.photo, kind: "photo" });

    const stage = $("sheet-stage");
    stage.querySelectorAll(".sheet__img").forEach((n) => n.remove());
    const tabs = $("sheet-views");
    tabs.replaceChildren();
    views.forEach((v, i) => {
      const img = document.createElement("img");
      img.className = `sheet__img sheet__img--${v.kind}${i === 0 ? " is-on" : ""}`;
      img.src = v.src;
      img.alt = `${item.name}, ${v.label.toLowerCase()} view`;
      img.dataset.view = v.key;
      stage.appendChild(img);

      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "sheet__view";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(i === 0));
      tab.textContent = v.label;
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
      t.setAttribute("aria-selected", String(t.textContent.toLowerCase() === key)));
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
      status.textContent = "Choose a size first.";
      if (!reduceMotion) gsap.fromTo("#sheet-sizes", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    status.textContent = `${current.name}, size ${chosen.textContent}: this is a design preview, so the bag isn't connected yet.`;
  }

  /* ---------- size guide: a hang tag that swings in ---------- */

  function buildGuide() {
    const g = N.site?.sizeGuide;
    if (!g) return;
    $("guide-unit").textContent = g.unit || "cm";
    const head = `<thead><tr><th scope="col">Size</th>${(g.columns || []).map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>`;
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
