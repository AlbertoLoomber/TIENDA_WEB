/* Nomad — everything below the rack, and the way the page moves while you scroll.
 *
 * One lead movement per section, everything else supporting it:
 *   hero      → the rack recedes as the lookbook slides over it like a sheet
 *   titles    → rise line by line from behind a mask
 *   lookbook  → pinned on desktop: photos travel sideways, each revealed like a
 *               fitting-room curtain; a small hanger on a rod tracks the way
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

    if (!hasScrollTrigger || reduceMotion) {
      // No motion: the lookbook still gets its swipeable row and counter.
      lookbook(motion, { animate: false });
      return;
    }

    // Created top to bottom, so each trigger measures the page after the pins above it.
    heroExit(motion);
    lookbook(motion, { animate: true });
    reveals(motion);
    titles(motion);
    // Photos load lazily; once they're in, re-measure so pins and triggers are exact.
    addEventListener("load", () => ScrollTrigger.refresh());
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

  /* ---------- lookbook: pinned gallery with fitting-room curtains ---------- */

  const CURTAIN_CLOSED = "inset(100% 0% 0% 0%)";
  const CURTAIN_OPEN = "inset(0% 0% 0% 0%)";
  const pad = (n) => String(n).padStart(2, "0");

  function lookbook(motion, { animate }) {
    const section = document.getElementById("lookbook");
    const viewport = document.getElementById("lookbook-viewport");
    const track = document.getElementById("lookbook-track");
    const rod = document.getElementById("lookbook-rod");
    const hanger = document.getElementById("lookbook-hanger");
    const now = document.getElementById("lookbook-now");
    if (!section || !track) return;

    const cards = [...track.children];
    const frames = cards.map((c) => c.querySelector(".look__frame"));
    const photos = frames.map((f) => f.querySelector(".look__photo"));
    document.getElementById("lookbook-total").textContent = pad(cards.length);

    // The hanger slides along its rod; the number changes as each look takes the stage.
    let current = -1;
    const setProgress = (p) => {
      const max = rod.clientWidth - hanger.getBoundingClientRect().width;
      hanger.style.transform = `translateX(${Math.max(0, max) * p}px)`;
      const i = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
      if (i === current) return;
      current = i;
      now.textContent = pad(i + 1);
      if (animate) gsap.fromTo(now, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: motion.easeOut });
    };
    setProgress(0);

    const headerHeight = () => document.querySelector(".top")?.offsetHeight || 0;

    // Both conditions listed: matchMedia only runs the callback when one of them matches.
    gsap.matchMedia().add({ wide: "(min-width: 641px)", narrow: "(max-width: 640px)" }, ({ conditions }) => {
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      // Desktop: the section holds still while the photos travel past.
      if (conditions.wide && animate) {
        section.classList.add("is-pinned");
        if (distance() > 40) {
          const travel = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: () => `top ${headerHeight()}`,
              end: () => `+=${distance() * 1.35}`,   // a little more scroll than travel: unhurried
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => setProgress(self.progress),
            },
          });

          const firstScreen = viewport.clientWidth * 0.95;
          let opening = 0;
          cards.forEach((card, i) => {
            const frame = frames[i];
            const photo = photos[i];
            if (card.offsetLeft < firstScreen) {
              // Looks already in view open one after another as the section arrives.
              const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 72%", once: true }, delay: opening++ * 0.14 });
              tl.fromTo(frame, { clipPath: CURTAIN_CLOSED }, { clipPath: CURTAIN_OPEN, duration: motion.slow, ease: motion.easeOut });
              if (photo) tl.fromTo(photo, { scale: 1.16 }, { scale: 1, duration: motion.slow + 0.4, ease: motion.easeOut }, 0);
            } else {
              // The rest open as they travel in from the right, tied to the scroll.
              const st = (end) => ({ trigger: card, containerAnimation: travel, start: "left 96%", end, scrub: true });
              gsap.fromTo(frame, { clipPath: CURTAIN_CLOSED }, { clipPath: CURTAIN_OPEN, ease: "power1.out", scrollTrigger: st("left 58%") });
              if (photo) gsap.fromTo(photo, { scale: 1.16 }, { scale: 1, ease: "none", scrollTrigger: st("left 30%") });
            }
          });
        }
        return () => {
          section.classList.remove("is-pinned");
          gsap.set(track, { clearProps: "x" });
          gsap.set([...frames, ...photos.filter(Boolean)], { clearProps: "clipPath,scale,transform" });
        };
      }

      // Phones (and wide screens without motion): swipe the row; the counter follows it.
      const onScroll = () => {
        const max = viewport.scrollWidth - viewport.clientWidth;
        setProgress(max > 0 ? viewport.scrollLeft / max : 0);
      };
      viewport.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      if (animate) {
        gsap.fromTo(frames, { clipPath: CURTAIN_CLOSED }, {
          clipPath: CURTAIN_OPEN, duration: motion.slow, ease: motion.easeOut, stagger: 0.12,
          scrollTrigger: { trigger: viewport, start: "top 80%", once: true },
        });
      }
      return () => viewport.removeEventListener("scroll", onScroll);
    });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  N.sections = { setup };
})();
