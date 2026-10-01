/* Nomad — scroll foundation.
 *
 * Shared motion tokens and the page scroll: on desktop the wheel/trackpad gets
 * Lenis smooth scrolling driven by GSAP's ticker, so every scroll-linked
 * animation moves on the same clock. Touch devices and "reduce motion" keep
 * native scrolling. Everything else talks to the scroll through NOMAD.scroll,
 * never to Lenis directly.
 */
(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasScrollTrigger = typeof ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);

  // One set of durations and curves for the whole page, so every movement
  // reads as the same brand.
  const motion = {
    easeOut: "expo.out",
    easeInOut: "power3.inOut",
    easeSwing: "elastic.out(1, 0.3)",
    fast: 0.6,
    base: 1.0,
    slow: 1.4,
    stagger: 0.08,
  };

  let lenis = null;

  // Smooth wheel scrolling only where it helps: a mouse or trackpad, motion allowed.
  if (finePointer && !reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      lerp: 0.1,            // how quickly the page catches up with the wheel
      wheelMultiplier: 1,
      smoothWheel: true,
    });
    if (hasScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const headerHeight = () => document.querySelector(".top")?.offsetHeight || 0;

  const scroll = {
    smooth: !!lenis,

    /** Scroll to a selector, element or y position, leaving room for the header. */
    to(target, { immediate = false } = {}) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (lenis) {
        // Sections carry scroll-margin-top (the header height), which Lenis already honours.
        lenis.scrollTo(typeof target === "number" ? target : el, {
          offset: 0,
          immediate,
          duration: 1.4,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
      } else if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: immediate || reduceMotion ? "instant" : "smooth" });
      } else if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - headerHeight();
        window.scrollTo({ top: y, behavior: immediate || reduceMotion ? "instant" : "smooth" });
      }
      if (immediate && hasScrollTrigger) ScrollTrigger.update();
    },

    /** Freeze page scrolling (detail view open). */
    lock() {
      lenis?.stop();
      document.documentElement.classList.add("is-locked");
    },

    unlock() {
      document.documentElement.classList.remove("is-locked");
      lenis?.start();
    },
  };

  // In-page links (#about, #lookbook, the logo…) glide to their section.
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    const target = hash === "#" ? null : document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    scroll.to(hash === "#top" ? 0 : target);
  });

  window.NOMAD = Object.assign(window.NOMAD || {}, {
    motion,
    scroll,
    reduceMotion,
    finePointer,
    hasScrollTrigger,
  });
})();
