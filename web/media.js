/* Nomad — short looping clips (studio, process): silent, inline,
 * with the photo as their poster.
 *
 * Nothing downloads until the clip is about a screen away; it plays only while
 * at least half of it is in view and pauses when it leaves (IntersectionObserver
 * measures real positions, transforms included).
 * With "reduce motion" or data saver on, the photo simply stays.
 *
 * Data: { webm, mp4, poster } from prendas.json (tools/comprimir_video.py).
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});

  const allowed = () => !N.reduceMotion && !navigator.connection?.saveData;

  let near = null;
  let seen = null;

  function observers() {
    if (near) return;
    near = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const v = e.target;
        near.unobserve(v);
        v.querySelectorAll("source[data-src]").forEach((s) => { s.src = s.dataset.src; s.removeAttribute("data-src"); });
        v.load();
        seen.observe(v);
      });
    }, { rootMargin: "100% 100%" });
    seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.intersectionRatio >= 0.5 && !document.hidden) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: [0, 0.5, 1] });
    document.addEventListener("visibilitychange", () => {
      document.querySelectorAll("video.clip").forEach((v) => { if (document.hidden) v.pause(); });
    });
  }

  /** A <video> for the clip, or null when clips are off (keep the photo then). */
  function clip(data, className = "") {
    if (!data?.webm || !allowed() || !("IntersectionObserver" in window)) return null;
    observers();
    const v = document.createElement("video");
    v.className = `clip ${className}`.trim();
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "none" });
    ["muted", "loop", "playsinline"].forEach((a) => v.setAttribute(a, ""));
    v.setAttribute("aria-hidden", "true");
    v.disablePictureInPicture = true;
    if (data.poster) v.poster = data.poster;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(([k, type]) => {
      if (!data[k]) return;
      const s = document.createElement("source");
      s.dataset.src = data[k];
      s.type = type;
      v.appendChild(s);
    });
    requestAnimationFrame(() => near.observe(v));   // once it's on the page
    return v;
  }

  N.media = { clip };
})();
