/* Nomad — everything below the rack, and the way the page moves while you scroll.
 *
 * One lead movement per section, everything else supporting it:
 *   hero      → the rack recedes as the lookbook slides over it like a sheet
 *   titles    → rise line by line from behind a mask
 *   lookbook  → pinned on desktop: photos travel sideways, each revealed like a
 *               fitting-room curtain; a small hanger on a rod tracks the way
 *   about     → "Nomad" writes itself; the studio photo opens from the centre;
 *               the fact lines draw in
 *   newsletter→ the hang tag swings in on its string, then its title
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
    // Pinned sections add space above the newsletter; realign after each re-measure.
    if (hasScrollTrigger) ScrollTrigger.addEventListener("refresh", align);

    if (!hasScrollTrigger || reduceMotion) {
      // No motion: the lookbook still gets its swipeable row and counter.
      lookbook(motion, { animate: false });
      return;
    }

    // Created top to bottom, so each trigger measures the page after the pins above it.
    heroExit(motion);
    lookbook(motion, { animate: true });
    marquee();
    reveals(motion);
    about(motion);
    hangTag(motion);
    footer();
    titles(motion);
    // Photos load lazily; once they're in, re-measure so pins and triggers are exact.
    addEventListener("load", () => ScrollTrigger.refresh());
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
    gsap.utils.toArray(".more .eyebrow:not(.look__meta .eyebrow):not(.tag .eyebrow)").forEach((el) => {
      gsap.from(el, {
        opacity: 0, letterSpacing: "0.34em", duration: motion.base, ease: motion.easeOut,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // (The collection's entrance lives in shop.js, next to its filters, so the two never overlap.)

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
    const media = fig?.querySelector(":scope > img, .studio");
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
  }

  /* ---------- footer: uncovered from underneath ---------- */

  function footer() {
    const foot = document.querySelector(".foot");
    const inner = foot?.querySelector(".foot__inner");
    if (!inner) return;
    // While the newsletter lifts away, the footer's content rises gently into place.
    gsap.fromTo(inner, { yPercent: -18, opacity: 0.3 }, {
      yPercent: 0, opacity: 1, ease: "none",
      scrollTrigger: { trigger: ".newsletter", start: "bottom bottom", end: () => `+=${foot.offsetHeight}`, scrub: true },
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
