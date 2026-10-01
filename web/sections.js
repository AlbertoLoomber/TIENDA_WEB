/* Nomad — everything below the rack, and the way the page moves while you scroll.
 *
 * One lead movement per section, everything else supporting it:
 *   hero      → the rack recedes as the lookbook slides over it like a sheet
 *   titles    → rise line by line from behind a mask
 *   lookbook  → garments drop onto their rods; cards drift sideways
 *   about     → photo and facts settle in after the copy
 *   newsletter→ the hang tag arrives, then its title
 * With "reduce motion" nothing moves: content is simply there.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});

  function setup() {
    const { motion, reduceMotion, hasScrollTrigger } = N;
    const page = document.getElementById("page");
    const more = document.querySelector(".more");

    // Header gets its paper backing once the page leaves the very top.
    const onScroll = () => page.classList.toggle("is-scrolled", window.scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    alignDots(more);
    addEventListener("resize", () => alignDots(more));

    if (!hasScrollTrigger || reduceMotion) return;

    heroExit(motion);
    reveals(motion);
    titles(motion);
    lookbookDrift();
  }

  /* The sheet that slides over the hero carries its own copy of the dot grid;
     shift it so its dots line up exactly with the wall behind. */
  function alignDots(el) {
    if (!el) return;
    const step = 22;
    el.style.setProperty("--dots-y", `${-(el.offsetTop % step)}px`);
  }

  /* ---------- hero: the rack recedes, the next section slides over it ---------- */

  function heroExit(motion) {
    const stage = document.querySelector(".hero .stage");
    if (!stage) return;
    // Scale leads and the fade follows late, so the rack never looks like it jumps.
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    })
      .to(stage, { yPercent: 16, scale: 0.94, duration: 1 }, 0)
      .to(stage, { opacity: 0.4, duration: 0.6 }, 0.4);
  }

  /* ---------- quiet entrances ---------- */

  function reveals(motion) {
    // Blocks that aren't text: a short rise and fade, once.
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 24, opacity: 0, duration: motion.base, ease: motion.easeOut,
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });

    // Small labels arrive with their letters drawing slightly together.
    gsap.utils.toArray(".more .eyebrow:not(.look__meta .eyebrow):not(.tag .eyebrow)").forEach((el) => {
      gsap.from(el, {
        opacity: 0, letterSpacing: "0.34em", duration: motion.base, ease: motion.easeOut,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Lookbook: garments drop onto their rods one after another, then settle.
    const garments = gsap.utils.toArray(".look__garment");
    if (garments.length) {
      gsap.from(garments, {
        y: -36, opacity: 0, duration: 0.7, ease: "back.out(1.5)", stagger: motion.stagger,
        scrollTrigger: { trigger: "#lookbook-track", start: "top 80%", once: true },
        onComplete: () => garments.forEach((g, i) =>
          gsap.fromTo(g, { rotation: i % 2 ? 2 : -2 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.25)" })),
      });
    }
    // Lookbook photos: a slow settle from slightly closer, like a lens easing back.
    gsap.utils.toArray(".look__photo").forEach((img) => {
      gsap.from(img, {
        scale: 1.08, duration: motion.slow, ease: motion.easeOut,
        scrollTrigger: { trigger: img, start: "top 85%", once: true },
      });
    });

    if (document.querySelector(".studio__row img")) {
      gsap.from(".studio__row img", {
        y: -24, opacity: 0, duration: 0.7, ease: "back.out(1.5)", stagger: motion.stagger,
        scrollTrigger: { trigger: "#about-photo", start: "top 80%", once: true },
      });
    }
  }

  /* ---------- titles rise line by line ---------- */

  function titles(motion) {
    if (typeof SplitText === "undefined") return;

    const groups = [
      // [selector, distance (% of line height), duration, delay]
      [".section-title", 110, motion.base, 0],
      [".tag__title", 110, motion.base, 0.15],
      [".about__body", 70, motion.fast + 0.2, 0.1],
      [".tag__body", 70, motion.fast + 0.2, 0.25],
    ];

    // Split only once the real fonts are in, so lines break where they will stay.
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, wait(1500)]) : Promise.resolve();
    fontsReady.then(() => {
      groups.forEach(([selector, distance, duration, delay]) => {
        document.querySelectorAll(selector).forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, {
              yPercent: distance,
              duration,
              delay,
              ease: motion.easeOut,
              stagger: motion.stagger,
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
            }),
          });
        });
      });
      ScrollTrigger.refresh();
    });
  }

  /* ---------- lookbook: cards drift sideways as you pass (desktop) ---------- */

  function lookbookDrift() {
    gsap.matchMedia().add("(min-width: 641px)", () => {
      const track = document.getElementById("lookbook-track");
      if (!track) return;
      const viewport = track.parentElement;
      gsap.to(track, {
        x: () => Math.min(0, viewport.clientWidth - track.scrollWidth),
        ease: "none",
        scrollTrigger: { trigger: "#lookbook", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
    });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  N.sections = { setup };
})();
