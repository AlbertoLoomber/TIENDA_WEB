/* Nomad — "Así se usa": six photos out in the street; each one opens the sheet
 * of the garment it shows (#/prenda/<slug>).
 *
 * Data: site.street in prendas.json (catalogo.json → sitio.calle). Sample photos
 * (tools/fotos_web.py) are labelled as such.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);

  /* ---------- Así se usa ---------- */

  function buildStreet(data) {
    $("street-eyebrow").textContent = data.eyebrow || "Así se usa";
    $("street-title").textContent = data.title || "";
    $("street-sample").hidden = !data.sample;
    if (data.button) $("street-button").textContent = data.button;
    const grid = $("street-grid");
    data.shots.forEach((shot) => {
      const item = N.items?.find((it) => it.id === shot.item);
      if (!item || !shot.photo) return;
      const li = document.createElement("li");
      li.className = "street__item";
      li.innerHTML = `<a class="street__card"><span class="street__frame"><img alt="" loading="lazy" decoding="async"></span>
        <span class="street__caption"><span class="street__k">Lleva:</span> <span class="street__name"></span> <span aria-hidden="true">→</span></span></a>`;
      const a = li.querySelector("a");
      a.href = `#/prenda/${item.slug}`;
      const img = li.querySelector("img");
      img.dataset.src = shot.photo.src;   // set when the section is near (see below)
      img.alt = `${item.name} en la calle`;
      li.querySelector(".street__name").textContent = item.name;
      grid.appendChild(li);
    });
    // The photos come in only when the section is about to be seen: it sits
    // high on the page, close enough that the browser's own lazy loading would
    // fetch them with the first screen.
    const imgs = [...grid.querySelectorAll("img[data-src]")];
    const load = () => imgs.forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
      }, { rootMargin: "300px 0px" });
      io.observe(grid);
    } else {
      load();
    }
    N.swipeHint?.(grid, "calle");
  }

  function streetMotion() {
    const grid = $("street-grid");
    if (!N.reduceMotion && N.hasScrollTrigger) {
      gsap.from(grid.children, {
        y: 24, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: grid, start: "top 82%", once: true },
      });
    }
  }

  function setup() {
    const street = N.site?.street;
    if (street?.shots?.length) {
      $("calle").hidden = false;
      buildStreet(street);
    }
  }

  // Scroll-driven parts, created after the sections above so their triggers
  // measure the final page.
  function motion() {
    if (!$("calle").hidden) streetMotion();
  }

  N.scenes = { setup, motion };
})();
