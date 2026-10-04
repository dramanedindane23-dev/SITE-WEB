// Carrousels glissants (doigt, souris, flèches), une rangée à la fois, et apparition au défilement.
(function () {
  var drag = null;

  function bouton(g, dir, label, txt) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "car-btn car-" + dir;
    b.setAttribute("aria-label", label); b.textContent = txt;
    b.addEventListener("click", function () {
      g.scrollBy({ left: (dir === "next" ? 1 : -1) * Math.max(240, g.clientWidth * 0.8), behavior: "smooth" });
    });
    return b;
  }

  function carrousel(g) {
    if (g.parentNode.classList.contains("carousel")) return;
    var wrap = document.createElement("div");
    wrap.className = "carousel";
    g.parentNode.insertBefore(wrap, g);
    wrap.appendChild(g);
    wrap.append(bouton(g, "prev", "Éléments précédents", "‹"), bouton(g, "next", "Éléments suivants", "›"));

    function maj() {
      var max = g.scrollWidth - g.clientWidth - 2;
      wrap.classList.toggle("at-start", g.scrollLeft <= 2);
      wrap.classList.toggle("at-end", g.scrollLeft >= max);
      wrap.classList.toggle("no-scroll", max <= 0);
    }
    g.addEventListener("scroll", maj, { passive: true });
    window.addEventListener("resize", maj);
    new MutationObserver(maj).observe(g, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    maj();

    g.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      drag = { g: g, sx: e.clientX, sl: g.scrollLeft, moved: false };
    });
    g.addEventListener("click", function (e) {
      if (g._bloque) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.sx;
    if (Math.abs(dx) > 5) { drag.moved = true; drag.g.classList.add("dragging"); }
    drag.g.scrollLeft = drag.sl - dx;
  });
  window.addEventListener("pointerup", function () {
    if (!drag) return;
    var g = drag.g;
    g.classList.remove("dragging");
    if (drag.moved) { g._bloque = true; setTimeout(function () { g._bloque = false; }, 0); }
    drag = null;
  });

  function initTous() { document.querySelectorAll(".pizza-cards").forEach(carrousel); }
  document.addEventListener("mp:data", initTous);
  initTous();

  var calme = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !calme) {
    var els = document.querySelectorAll(".hero, .accordion-section, .menu-intro");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
