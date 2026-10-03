/* Nomad — everything below the rack, and the way the page moves while you scroll.
 *
 * One lead movement per section, everything else supporting it:
 *   hero      → the rack recedes as the page below slides over it like a sheet
 *   titles    → rise line by line from behind a mask
 *   about     → "Nomad" writes itself; the studio photo opens from the centre;
 *               the fact lines draw in
 *   de cerca  → closeup.js: the details' lines draw themselves once
 *   newsletter→ the hang tag swings in on its string, then its title; the
 *               covered Drop 02 garment follows a beat later
 *   footer    → uncovered from underneath as the newsletter lifts away
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

    const sheets = [more, document.querySelector(".newsletter")].filter(Boolean);
    const align = () => sheets.forEach((el) => alignDots(el, page));
    align();
    addEventListener("resize", align);
    addEventListener("load", align);
    // Realign after each re-measure (fonts and photos change the heights above).
    if (hasScrollTrigger) ScrollTrigger.addEventListener("refresh", align);

    if (!hasScrollTrigger || reduceMotion) return;

    // Created top to bottom, so each trigger measures the page after the pins above it.
    heroExit(motion);
    marquee();
    reveals(motion);
    about(motion);
    hangTag(motion);
    footer();
    titles(motion);
    // Photos load lazily; once they're in, re-measure so pins and triggers are exact.
    addEventListener("load", () => ScrollTrigger.refresh());
    // Anything that changes the page's height later (lazy photos, hints that go
    // away, a section filled in) re-measures the triggers too, once it settles.
    let lastH = document.documentElement.scrollHeight;
    let remeasure = 0;
    new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(remeasure);
      remeasure = setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(document.body);
  }

  /* Sheets that slide over other content carry their own copy of the dot grid;
     shift each one so its dots line up exactly with the wall behind. */
  function alignDots(el, page) {
    const step = 22;
    const y = el.getBoundingClientRect().top - page.getBoundingClientRect().top;
    el.style.setProperty("--dots-y", `${-(Math.round(y) % step)}px`);
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

  /* ---------- marquee: its pace follows the scroll ---------- */

  // The band runs at its own calm pace; scrolling down hurries it along,
  // scrolling up turns it around, and it eases back to calm when you stop.
  function marquee() {
    const track = document.getElementById("band-track");
    if (!track) return;
    track.classList.add("is-driven");
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    let direction = 1;
    let calmTimer = 0;
    const calm = () => gsap.to(loop, { timeScale: direction, duration: 1.2, ease: "power2.out", overwrite: true });

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        const v = self.getVelocity();
        if (Math.abs(v) < 20) return;
        direction = v > 0 ? 1 : -1;
        const boost = 1 + Math.min(Math.abs(v) / 450, 5);   // at most 6× its calm pace
        gsap.to(loop, { timeScale: direction * boost, duration: 0.3, ease: "power2.out", overwrite: true });
        clearTimeout(calmTimer);
        calmTimer = setTimeout(calm, 160);
      },
    });

    const band = track.parentElement;
    band.addEventListener("mouseenter", () => gsap.to(loop, { timeScale: 0, duration: 0.6, overwrite: true }));
    band.addEventListener("mouseleave", calm);
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
    gsap.utils.toArray(".more .eyebrow:not(.tag .eyebrow)").forEach((el) => {
      gsap.from(el, {
        opacity: 0, letterSpacing: "0.34em", duration: motion.base, ease: motion.easeOut,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // (The collection's entrance lives in shop.js, next to its filters, so the two never overlap.)

    if (document.querySelector(".studio__row img")) {
      gsap.from(".studio__row img", {
        y: -24, opacity: 0, duration: 0.7, ease: "back.out(1.5)", stagger: motion.stagger,
        scrollTrigger: { trigger: "#about-photo", start: "top 80%", once: true },
      });
    }
  }

  /* ---------- about: the name writes itself, the studio opens ---------- */

  function about(motion) {
    const logo = document.querySelector(".about__logo");
    if (logo) {
      // Revealed left to right along its own slant, like a pen stroke.
      // The inset runs past the box so the script's swashes are never cut.
      gsap.fromTo(logo,
        { clipPath: "inset(-40% 100% -40% -8%)" },
        { clipPath: "inset(-40% -8% -40% -8%)", duration: 1.8, ease: "power2.inOut",
          scrollTrigger: { trigger: logo, start: "top 82%", once: true } });
    }

    const fig = document.getElementById("about-photo");
    const media = fig?.querySelector(":scope > img, .studio, .about__media");
    if (media) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 80%", once: true } });
      tl.fromTo(media, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: motion.slow, ease: "expo.inOut" })
        .fromTo(media, { scale: 1.1 }, { scale: 1, duration: motion.slow + 0.6, ease: motion.easeOut }, 0)
        .from(fig.querySelector("figcaption"), { opacity: 0, y: 6, duration: motion.fast, ease: motion.easeOut }, motion.slow - 0.4);
    }

    const facts = document.querySelector(".facts");
    if (facts) {
      const rows = [...facts.children];
      const tl = gsap.timeline({ scrollTrigger: { trigger: facts, start: "top 86%", once: true } });
      tl.fromTo([facts, ...rows], { "--draw": 0 }, { "--draw": 1, duration: 1.1, ease: motion.easeInOut, stagger: 0.12 })
        .from(rows.flatMap((r) => [...r.children]), { opacity: 0, y: 8, duration: motion.fast, ease: motion.easeOut, stagger: 0.05 }, 0.25);
    }
  }

  /* ---------- newsletter: the tag swings in on its string ---------- */

  function hangTag(motion) {
    const swing = document.getElementById("tag-swing");
    if (!swing) return;
    gsap.timeline({ scrollTrigger: { trigger: "#tag-hang", start: "top 80%", once: true } })
      .from(".tag-hang__rod", { opacity: 0, scaleX: 0.4, duration: motion.fast, ease: motion.easeOut })
      .fromTo(swing, { rotation: -11, opacity: 0 }, { rotation: 0, duration: 2.4, ease: "elastic.out(1, 0.32)" }, 0.1)
      .to(swing, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0.1);
    // The covered garment on the same rod: same character, a beat later, 70% of
    // the swing and starting on the far side, so the two never swing in step
    // (or into each other).
    const drop = document.getElementById("drop-hang");
    if (drop && !drop.hidden && getComputedStyle(drop).display !== "none") {
      gsap.fromTo("#drop-swing", { rotation: 7.7, opacity: 0 }, {
        rotation: 0, duration: 2.4, delay: 0.35, ease: "elastic.out(1, 0.32)",
        scrollTrigger: { trigger: "#tag-hang", start: "top 80%", once: true },
      });
      gsap.to("#drop-swing", { opacity: 1, duration: 0.4, delay: 0.35, ease: "power1.out",
        scrollTrigger: { trigger: "#tag-hang", start: "top 80%", once: true } });
    }
  }

  /* ---------- footer: uncovered from underneath ---------- */

  function footer() {
    const foot = document.querySelector(".foot");
    const inner = foot?.querySelector(".foot__inner");
    if (!inner) return;
    // While the newsletter lifts away, the footer's content rises gently into place.
    // It ends exactly at the bottom of the page, so the footer is never left half faded.
    gsap.fromTo(inner, { yPercent: -18, opacity: 0.3 }, {
      yPercent: 0, opacity: 1, ease: "none",
      scrollTrigger: { trigger: ".newsletter", start: "bottom bottom", end: "max", scrub: true },
    });
  }

  /* ---------- titles rise line by line ---------- */

  function titles(motion) {
    if (typeof SplitText === "undefined") return;

    const groups = [
      // [selector, distance (% of line height), duration, delay]
      [".section-title", 110, motion.base, 0],
      ["#tag-front .tag__title", 110, motion.base, 0.35],
      [".about__body", 70, motion.fast + 0.2, 0.1],
      ["#tag-front .tag__body", 70, motion.fast + 0.2, 0.45],
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
            // Lines only, so the text reads the same split or not: no aria-label
            // on the paragraph (not allowed on a <p>) and nothing hidden.
            aria: "none",
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

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  N.sections = { setup };
})();
