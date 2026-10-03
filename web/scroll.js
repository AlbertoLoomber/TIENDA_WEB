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

  let locks = 0;
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

    /** Freeze page scrolling while an overlay is open. Overlays can stack
        (the product sheet over the rack's detail view), so locks are counted. */
    lock() {
      locks += 1;
      lenis?.stop();
      document.documentElement.classList.add("is-locked");
    },

    unlock() {
      locks = Math.max(0, locks - 1);
      if (locks) return;
      document.documentElement.classList.remove("is-locked");
      lenis?.start();
    },
  };

  /* On touch screens, show that a row goes on sideways: its edges fade where
     there is more to see, and a small "Desliza" note waits under it until the
     first swipe (remembered for the visit). Mouse users never see it. */
  const HANGER = '<svg viewBox="0 0 40 26" aria-hidden="true"><path d="M20 9 V6.5 a3 3 0 1 1 3 -3"/><path d="M20 9 L4 20 Q2 21.6 4.2 22 H35.8 Q38 21.6 36 20 Z"/></svg>';

  function swipeHint(scroller, key) {
    if (!scroller || finePointer) return;
    let hint = null;
    // Only rows that really scroll (a rail can stick out of a box that doesn't).
    const scrolls = () => /auto|scroll/.test(getComputedStyle(scroller).overflowX);
    const overflow = () => (scrolls() ? scroller.scrollWidth - scroller.clientWidth : 0);
    const edges = () => {
      scroller.classList.toggle("can-left", scroller.scrollLeft > 4);
      scroller.classList.toggle("can-right", overflow() - scroller.scrollLeft > 4);
      hint?.classList.toggle("is-gone", overflow() < 8);
    };
    let raf = 0;
    scroller.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(edges); }, { passive: true });
    addEventListener("resize", edges);
    edges();

    const storeKey = `nomad.desliza.${key}`;
    let seen = false;
    try { seen = sessionStorage.getItem(storeKey) === "1"; } catch (e) { /* storage blocked: show it */ }
    if (seen || overflow() < 8) return;

    hint = document.createElement("p");
    hint.className = "swipe-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = `Desliza ${HANGER}`;
    const parent = scroller.parentElement;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    parent.appendChild(hint);
    const place = () => {
      const padBottom = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
      hint.style.top = `${scroller.offsetTop + scroller.offsetHeight - padBottom + 8}px`;
      hint.style.right = `${Math.max(16, parent.clientWidth - (scroller.offsetLeft + scroller.offsetWidth) + 16)}px`;
    };
    place();
    addEventListener("resize", place);
    const done = () => {
      if (scroller.scrollLeft < 8) return;
      scroller.removeEventListener("scroll", done);
      removeEventListener("resize", place);
      try { sessionStorage.setItem(storeKey, "1"); } catch (e) { /* fine */ }
      hint.classList.add("is-gone");
      setTimeout(() => hint.remove(), 500);
    };
    scroller.addEventListener("scroll", done, { passive: true });
  }

  // In-page links (#about, #lookbook, the logo…) glide to their section.
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    // Only plain section ids; "#/prenda/…" links belong to the sheet's router.
    if (!/^#[\w-]*$/.test(hash)) return;
    const target = hash === "#" ? null : document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    scroll.to(hash === "#top" ? 0 : target);
  });

  // Every newer effect can be switched off here in one go, if it ever feels like
  // too much (docs/siguiente-nivel/08-riesgos-y-decisiones.md §3).
  const features = {
    brush: true,         // garments sway when the cursor sweeps fast across the rack
    dragTurn: true,      // drag the garment in the sheet to turn it
    priceTag: true,      // price on a hanging tag on the rail (false = a line of text)
    flyToBag: true,      // a copy of the garment flies into the bag
    quickAdd: true,      // sizes under each piece on hover
    closeupLines: true,  // "De cerca": lines draw and circles open
    dropCountdown: true, // the newsletter tag counts down to the next drop
  };

  window.NOMAD = Object.assign(window.NOMAD || {}, {
    features: Object.assign(features, window.NOMAD?.features || {}),
    motion,
    scroll,
    reduceMotion,
    finePointer,
    swipeHint,
    hasScrollTrigger,
  });
})();
