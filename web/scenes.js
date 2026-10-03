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
      img.src = shot.photo.src;
      img.alt = `${item.name} en la calle`;
      li.querySelector(".street__name").textContent = item.name;
      grid.appendChild(li);
    });
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
