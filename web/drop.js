/* Nomad — Drop 02 on the newsletter tag: the date, a countdown in days, hours
 * and minutes (no seconds, so nothing ticks all the time) and "Avísame". The
 * covered garment hangs next to the tag on the same rod. After the date the tag
 * says the drop is out and points to the collection.
 *
 * The countdown updates once a minute, on the minute (a timeout lined up with
 * the clock, not an interval), pauses while the tab is hidden and catches up
 * when it comes back. Only the digits that change roll.
 *
 * Data: site.drop in prendas.json (catalogo.json → sitio.drop). To check the
 * states in the preview: ?drop=antes or ?drop=despues in the address.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const ZONE = "America/Mexico_City";

  let target = 0;
  let timer = 0;
  let shown = null;       // { days, hours, min } on screen
  let state = "";         // "before" | "after"
  let reduceMotion = false;

  const pad = (n) => String(n).padStart(2, "0");

  function remaining(now = Date.now()) {
    const m = Math.max(0, Math.floor((target - now) / 60000));
    return { days: Math.floor(m / 1440), hours: Math.floor(m / 60) % 24, min: m % 60, done: target - now <= 0 };
  }

  // "sáb 24 oct · 20:00 h", always in Mexico City time.
  function dateLine(ms) {
    const parts = (opts) => Object.fromEntries(new Intl.DateTimeFormat("es-MX", { timeZone: ZONE, ...opts })
      .formatToParts(ms).map((p) => [p.type, p.value]));
    const d = parts({ weekday: "short", day: "numeric", month: "short" });
    const t = parts({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const clean = (s) => s.replace(".", "");
    return `${clean(d.weekday)} ${d.day} ${clean(d.month)} · ${t.hour}:${t.minute} h`;
  }

  function spoken({ days, hours, min }) {
    const unit = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    if (days) return `Faltan ${unit(days, "día", "días")} y ${unit(hours, "hora", "horas")}.`;
    if (hours) return `Faltan ${unit(hours, "hora", "horas")} y ${unit(min, "minuto", "minutos")}.`;
    return `Faltan ${unit(min, "minuto", "minutos")}.`;
  }

  /* ---------- digits ---------- */

  function paintUnit(el, value, animate) {
    const text = pad(value);
    let boxes = [...el.children];
    if (boxes.length !== text.length) {
      el.replaceChildren(...[...text].map((ch) => {
        const d = document.createElement("span");
        d.className = "count__d";
        d.innerHTML = `<span>${ch}</span>`;
        return d;
      }));
      return;
    }
    boxes.forEach((box, i) => {
      // Settle a roll still running so a quick change never stacks digits.
      while (box.children.length > 1) box.firstElementChild.remove();
      const old = box.firstElementChild;
      if (old.textContent === text[i]) return;
      if (!animate || reduceMotion) { old.textContent = text[i]; return; }
      const next = document.createElement("span");
      next.textContent = text[i];
      box.appendChild(next);
      gsap.to(old, { yPercent: -100, duration: 0.35, ease: "power2.in", onComplete: () => old.remove() });
      gsap.fromTo(next, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power2.out", delay: 0.05,
        onComplete: () => gsap.set(next, { clearProps: "all" }) });
    });
  }

  function paint(animate) {
    const r = remaining();
    if (r.done) return setState("after");
    const count = $("drop-count");
    ["days", "hours", "min"].forEach((k) => {
      if (!shown || shown[k] !== r[k]) paintUnit(count.querySelector(`[data-unit="${k}"]`), r[k], animate && !!shown);
    });
    shown = r;
    $("drop-left").textContent = spoken(r);
  }

  function schedule() {
    clearTimeout(timer);
    if (state !== "before") return;
    const wait = 60000 - (Date.now() % 60000) + 40;   // just past the next minute
    timer = setTimeout(() => { paint(true); schedule(); }, wait);
  }

  /* ---------- states ---------- */

  function setState(next) {
    const drop = N.site.drop;
    if (state === next) return;
    state = next;
    const before = next === "before";
    $("tag-eyebrow").textContent = before ? `${drop.name} · ${dateLine(target)}` : `${drop.name} · ya disponible`;
    $("newsletter-title").textContent = before ? drop.title : drop.after.title;
    $("drop-count").hidden = !before;
    $("drop-zone").hidden = !before;
    $("drop-left").hidden = !before;
    $("tag-body").hidden = !before;
    $("newsletter-form").hidden = !before;
    $("newsletter-status").hidden = !before;
    $("drop-see").hidden = before;
    $("drop-see").textContent = drop.after.button || "Ver el drop";
    if (before) paint(false);
    else clearTimeout(timer);
  }

  function setup() {
    const drop = N.site?.drop;
    if (!drop) return;
    reduceMotion = !!N.reduceMotion;
    target = Date.parse(drop.date);
    if (Number.isNaN(target)) return;

    // Preview only: force a state to review it.
    const force = new URLSearchParams(location.search).get("drop");
    if (force === "antes" && target <= Date.now()) target = Date.now() + ((21 * 24 + 3) * 60 + 12) * 60000;
    if (force === "despues") target = Date.now() - 60000;

    if (drop.text) $("tag-body").textContent = drop.text;
    $("newsletter-submit").textContent = "Avísame";
    $("tag-back-eyebrow").textContent = drop.name;
    $("tag-thanks").textContent = "Listo, te avisamos.";

    // The covered garment: its photo when there is one, the drawn cover until then.
    if (N.features?.dropCountdown !== false) {
      $("drop-hang").hidden = false;
      $("tag-hang").classList.add("has-drop");
      if (drop.photo) {
        const img = $("drop-photo");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = drop.photo.src;
        img.hidden = false;
        $("drop-bag").remove();
      }
    }

    setState(target > Date.now() ? "before" : "after");
    schedule();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { clearTimeout(timer); return; }
      if (state === "before") { paint(true); schedule(); }
    });
  }

  N.drop = { setup, remaining, dateLine };
})();
