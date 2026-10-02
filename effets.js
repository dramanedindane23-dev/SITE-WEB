// Carrousel glissant (doigt, souris, flèches) et apparition au défilement.
(function () {
  var g = document.getElementById("pizza-gallery");
  if (g) {
    var wrap = document.createElement("div");
    wrap.className = "carousel";
    g.parentNode.insertBefore(wrap, g);
    wrap.appendChild(g);

    function bouton(dir, label, txt) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "car-btn car-" + dir;
      b.setAttribute("aria-label", label); b.textContent = txt;
      b.addEventListener("click", function () {
        g.scrollBy({ left: (dir === "next" ? 1 : -1) * Math.max(240, g.clientWidth * 0.8), behavior: "smooth" });
      });
      return b;
    }
    wrap.append(bouton("prev", "Pizzas précédentes", "‹"), bouton("next", "Pizzas suivantes", "›"));

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

    // Glisser avec la souris
    var down = false, moved = false, sx = 0, sl = 0;
    g.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = g.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; g.classList.add("dragging"); }
      g.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false; g.classList.remove("dragging");
    });
    g.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  }

  // Apparition douce des sections au défilement vertical
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
