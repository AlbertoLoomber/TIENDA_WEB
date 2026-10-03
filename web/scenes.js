/* Nomad — two sections about the clothes outside the rack:
 *
 *   Cómo se hace → four steps (sketch, screen, print, rack) under a short rod;
 *                  a hanger walks along the rod with the scroll (or with the
 *                  sideways swipe on phones). Nothing is pinned.
 *   Así se usa   → six photos out in the street; each one opens the sheet of
 *                  the garment it shows (#/prenda/<slug>).
 *
 * Data: site.process and site.street in prendas.json (catalogo.json → sitio.proceso,
 * sitio.calle). Sample photos (tools/fotos_web.py) are labelled as such.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Cómo se hace ---------- */

  function buildProcess(data) {
    $("process-eyebrow").textContent = data.eyebrow || "Cómo se hace";
    $("process-title").textContent = data.title || "";
    const list = $("process-list");
    data.steps.forEach((step, i) => {
      const li = document.createElement("li");
      li.className = "process__step";
      li.innerHTML = `<div class="process__frame"></div>
        <p class="process__num"></p><h3 class="process__title"></h3><p class="process__text"></p>`;
      const frame = li.querySelector(".process__frame");
      if (step.photo) {
        const img = document.createElement("img");
        img.src = step.photo.src;
        img.alt = `${step.title}: ${step.text}`;
        img.loading = "lazy";
        img.decoding = "async";
        frame.appendChild(img);
      } else {
        frame.classList.add("is-empty");
      }
      const clip = N.media?.clip(step.clip && { ...step.clip, poster: step.clip.poster || step.photo?.src }, "process__clip");
      if (clip) frame.appendChild(clip);
      li.querySelector(".process__num").textContent = pad(i + 1);
      li.querySelector(".process__title").textContent = step.title;
      li.querySelector(".process__text").textContent = step.text;
      list.appendChild(li);
    });
    $("process-note").hidden = !data.steps.some((s) => s.photo?.sample);
  }

  function processMotion() {
    const hanger = $("process-hanger");
    const rod = hanger.parentElement;
    const viewport = $("process-viewport");
    const steps = [...$("process-list").children];
    const phone = () => innerWidth <= 640;
    let p = 0;

    // Where the hanger sits for progress p: over the first card at 0, over the
    // last at 1 (on phones, along the whole rod).
    const place = () => {
      const r = rod.getBoundingClientRect();
      const hw = hanger.getBoundingClientRect().width;
      let x;
      if (phone() || steps.length < 2) {
        x = p * (r.width - hw);
      } else {
        const centre = (el) => { const b = el.getBoundingClientRect(); return b.left + b.width / 2 - r.left - hw / 2; };
        x = lerp(centre(steps[0]), centre(steps.at(-1)), p);
      }
      hanger.style.transform = `translateX(${Math.max(0, Math.min(r.width - hw, x)).toFixed(1)}px)`;
    };

    const fromSwipe = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      p = max > 0 ? viewport.scrollLeft / max : 0;
      place();
    };
    viewport.addEventListener("scroll", () => { if (phone()) fromSwipe(); }, { passive: true });
    // A row you can scroll must also be reachable by keyboard (arrow keys scroll it).
    const focusable = () => {
      const scrolls = viewport.scrollWidth > viewport.clientWidth + 1;
      if (scrolls) Object.entries({ tabindex: "0", role: "region", "aria-label": "Pasos, desliza para verlos" }).forEach(([k, v]) => viewport.setAttribute(k, v));
      else ["tabindex", "role", "aria-label"].forEach((k) => viewport.removeAttribute(k));
    };
    focusable();
    addEventListener("resize", () => { focusable(); phone() ? fromSwipe() : place(); });

    if (N.hasScrollTrigger) {
      ScrollTrigger.create({
        trigger: "#process-list",
        start: "top 70%",
        end: "bottom 40%",
        onUpdate: (self) => { if (!phone()) { p = self.progress; place(); } },
        onRefresh: (self) => { if (!phone()) { p = self.progress; place(); } },
      });
    }
    place();
    N.swipeHint?.(viewport, "proceso");

    // The cards open like the lookbook's curtains, shorter, once.
    if (!N.reduceMotion && N.hasScrollTrigger) {
      gsap.fromTo(steps.map((s) => s.querySelector(".process__frame")), { clipPath: "inset(100% 0% 0% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out", stagger: 0.12,
        scrollTrigger: { trigger: "#process-list", start: "top 80%", once: true },
        onComplete() { gsap.set(this.targets(), { clearProps: "clipPath" }); },
      });
    }
  }

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
    const process = N.site?.process;
    if (process?.steps?.length) {
      $("proceso").hidden = false;
      buildProcess(process);
    }
    const street = N.site?.street;
    if (street?.shots?.length) {
      $("calle").hidden = false;
      buildStreet(street);
    }
  }

  // Scroll-driven parts, created after the sections above (the pinned lookbook
  // adds scroll space that these triggers must measure).
  function motion() {
    if (!$("proceso").hidden) processMotion();
    if (!$("calle").hidden) streetMotion();
  }

  N.scenes = { setup, motion };
})();
