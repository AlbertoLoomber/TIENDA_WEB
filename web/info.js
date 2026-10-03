/* Nomad — the reassuring parts: shipping and returns at a glance, frequently
 * asked questions, WhatsApp, and the help and legal pages (shipping, returns,
 * size guide, privacy, terms) that open over the page with links of their own
 * (#/ayuda/envios, #/legal/privacidad…).
 *
 * Every figure comes from prendas.json (site.shipping, site.returns, site.faq,
 * site.pages) and is provisional until confirmed. While the contact details are
 * placeholders, contact links say so instead of opening a wrong number.
 */
(() => {
  "use strict";

  const N = (window.NOMAD = window.NOMAD || {});
  const $ = (id) => document.getElementById(id);
  const ROUTE = /^#\/(ayuda|legal)\/([\w-]+)$/;
  const ICON = {
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
    hanger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9V7.4a1.9 1.9 0 1 1 1.9-1.9"/><path d="M12 9 3.3 15.4c-.9.6-.5 1.6.5 1.6h16.4c1 0 1.4-1 .5-1.6z"/></svg>',
    swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8a8 8 0 0 0-14.3-2.7L4 7"/><path d="M4 3v4h4"/><path d="M4 16a8 8 0 0 0 14.3 2.7L20 17"/><path d="M20 21v-4h-4"/></svg>',
  };

  let reduceMotion = false;
  let returnFocus = null;
  let pushed = false;
  let baseTitle = document.title;
  const site = () => N.site || {};
  const price = (n) => (N.price ? N.price(n) : `$${n}`);

  /* ---------- shipping and returns at a glance ---------- */

  function perks() {
    const sh = site().shipping || {};
    const rt = site().returns || {};
    const list = [];
    if (sh.delivery) list.push({ icon: "box", title: "Envíos a todo México", text: sh.delivery });
    if (sh.freeFrom) list.push({ icon: "hanger", title: `Envío gratis desde ${price(sh.freeFrom)}`, text: "En toda la tienda" });
    if (rt.days) list.push({ icon: "swap", title: `Cambios de talla en ${rt.days} días`, text: rt.firstFree ? "La primera vez, sin costo" : "Sin complicaciones" });
    return list;
  }

  function buildPerks() {
    const ul = $("perks");
    const items = perks();
    if (ul) {
      ul.innerHTML = items.map((p) => `<li class="perk">${ICON[p.icon]}<p><span class="perk__title"></span><span class="perk__text"></span></p></li>`).join("");
      [...ul.children].forEach((li, i) => {
        li.querySelector(".perk__title").textContent = items[i].title;
        li.querySelector(".perk__text").textContent = items[i].text;
      });
    }
    const sh = site().shipping || {};
    const rt = site().returns || {};
    const short = [sh.freeFrom && `Envío gratis desde ${price(sh.freeFrom)}`, rt.days && `Cambios en ${rt.days} días`].filter(Boolean);
    if ($("sheet-perks")) $("sheet-perks").textContent = short.join(" · ");
  }

  /* ---------- frequently asked questions ---------- */

  function buildFaq() {
    const box = $("faq-list");
    if (!box) return;
    (site().faq || []).forEach(({ q, a }) => {
      const d = document.createElement("details");
      d.className = "faq__item";
      d.innerHTML = '<summary class="faq__q"></summary><div class="faq__a"><p></p></div>';
      d.querySelector(".faq__q").textContent = q;
      d.querySelector(".faq__a p").textContent = a;
      // The answer opens with its height (the one layout animation we allow).
      d.querySelector("summary").addEventListener("click", (e) => {
        if (reduceMotion) return;
        e.preventDefault();
        const body = d.querySelector(".faq__a");
        if (d.open) {
          gsap.to(body, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "height,opacity" }); } });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "height,opacity" });
        }
      });
      box.appendChild(d);
    });
  }

  /* ---------- contact links ---------- */

  // While the contacts are placeholders the links explain it instead of
  // sending visitors to someone else's number or account.
  function wireContacts() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-contact]");
      if (!a) return;
      const c = site().contact || {};
      const kind = a.dataset.contact;
      if (c.provisional || !c[kind]) {
        e.preventDefault();
        N.toast?.("Vista previa: este contacto todavía no está configurado.");
        return;
      }
      const href = {
        whatsapp: `https://wa.me/${String(c.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(a.dataset.waText || "Hola")}`,
        instagram: `https://instagram.com/${String(c.instagram).replace(/^@/, "")}`,
        correo: `mailto:${c.correo}`,
      }[kind];
      a.href = href;
      if (kind !== "correo") { a.target = "_blank"; a.rel = "noopener"; }
    }, true);
  }

  /* ---------- help and legal pages ---------- */

  function sizeGuidePage() {
    const g = site().sizeGuide;
    if (!g) return null;
    const head = `<tr><th scope="col">Talla</th>${(g.columns || []).map((c) => `<th scope="col">${c}</th>`).join("")}</tr>`;
    const rows = Object.entries(g.rows || {}).map(([s, v]) => `<tr><th scope="row">${s}</th>${v.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("");
    return {
      group: "Ayuda", title: "Guía de tallas", draft: false,
      html: `<table class="guide__table info__table"><thead>${head}</thead><tbody>${rows}</tbody></table>
        <p class="info__note">Medidas de la prenda en plano, en ${g.unit || "cm"}; pueden variar ±1 cm.</p>
        <h3>¿Entre dos tallas?</h3><p>Nuestras prendas son de corte oversized: la menor te queda normal y la mayor más holgada. En cada prenda, «¿Qué talla soy?» te sugiere una con tu estatura y tu peso.</p>`,
    };
  }

  function pageFor(key) {
    if (key === "tallas") return sizeGuidePage();
    const p = site().pages?.[key];
    if (!p) return null;
    const esc = (t) => t.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
    return { ...p, html: p.sections.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`).join("") };
  }

  function open(key, { fromLink = false } = {}) {
    const page = pageFor(key);
    if (!page) return false;
    const el = $("info");
    const wasOpen = !el.hidden;
    $("info-group").textContent = page.group;
    $("info-title").textContent = page.title;
    $("info-draft").hidden = !page.draft;
    $("info-body").innerHTML = page.html;
    $("info-panel").scrollTop = 0;
    document.title = `${page.title} · Nomad`;
    if (wasOpen) return true;
    pushed = fromLink;
    returnFocus = document.activeElement;
    el.hidden = false;
    $("page").inert = true;
    N.scroll?.lock();
    $("info-title").focus({ preventScroll: true });
    if (!reduceMotion) {
      gsap.fromTo(".info__scrim", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo("#info-panel", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });
    }
    return true;
  }

  function close({ fromHistory = false } = {}) {
    const el = $("info");
    if (el.hidden) return;
    const finish = () => {
      el.hidden = true;
      gsap.set(["#info-panel", ".info__scrim"], { clearProps: "transform,opacity" });
      $("page").inert = false;
      N.scroll?.unlock();
      document.title = baseTitle;
      returnFocus?.focus?.({ preventScroll: true });
    };
    if (!fromHistory) {
      try {
        if (pushed) history.back();
        else if (ROUTE.test(location.hash)) history.replaceState(null, "", location.href.split("#")[0]);
      } catch (e) { /* sandboxed: fine */ }
    }
    pushed = false;
    if (reduceMotion) return finish();
    gsap.to("#info-panel", { opacity: 0, y: 16, duration: 0.25, ease: "power2.in", onComplete: finish });
    gsap.to(".info__scrim", { opacity: 0, duration: 0.25 });
  }

  function follow({ initial = false } = {}) {
    const m = location.hash.match(ROUTE);
    if (m && open(m[2], { fromLink: !initial })) return;
    if (m && initial) {
      try { history.replaceState(null, "", location.href.split("#")[0]); } catch (e) { /* fine */ }
    }
    if (!m && !$("info").hidden) close({ fromHistory: true });
  }

  function setup() {
    reduceMotion = !!N.reduceMotion;
    baseTitle = document.title;
    buildPerks();
    buildFaq();
    wireContacts();
    document.querySelectorAll("[data-info-close]").forEach((b) => b.addEventListener("click", () => close()));
    addEventListener("hashchange", () => follow());
    addEventListener("popstate", () => follow());
    window.addEventListener("keydown", (e) => {
      if ($("info").hidden) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); close(); }
      else if (e.key === "Tab") {
        const f = [...$("info-panel").querySelectorAll("a[href], button")].filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === $("info-title"))) { e.preventDefault(); f.at(-1).focus(); }
        else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
      }
    }, true);
    follow({ initial: true });
  }

  N.info = { setup, open, close };
})();
