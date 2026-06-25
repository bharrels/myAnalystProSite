/* =============================================================
   myAnalyst — page-hero FX engine
   Each .page-hero[data-hero-fx="<theme>"] gets a distinctive animated
   motif that relates to the page's topic. The headline words reveal
   (handled in main.js), then this themed visual builds in behind them.
   Pure decoration: pointer-events none, disabled under reduced motion.
   Themes: addons, grid, bars, nodes, waves, score, tiers, docs, map, signal.
   ============================================================= */
(function () {
  "use strict";
  var hero = document.querySelector(".page-hero[data-hero-fx]");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var fx = hero.getAttribute("data-hero-fx") || "grid";
  var layer = document.createElement("div");
  layer.className = "phfx phfx-" + fx;
  layer.setAttribute("aria-hidden", "true");

  // how many child nodes each theme wants
  var COUNTS = { addons: 9, bars: 7, nodes: 16, waves: 4, score: 1, tiers: 3, docs: 5, map: 8, signal: 4, grid: 0 };
  var n = COUNTS[fx] != null ? COUNTS[fx] : 6;

  // deterministic-ish pseudo random so it differs by index but is stable
  function pr(i, s) { var x = Math.sin((i + 1) * (s || 12.9898)) * 43758.5453; return x - Math.floor(x); }

  for (var k = 0; k < n; k++) {
    var s = document.createElement("span");
    s.style.setProperty("--i", k);
    // scatter the free-floating themes
    if (fx === "nodes" || fx === "map") {
      s.style.left = (6 + pr(k, 12.9) * 88).toFixed(1) + "%";
      s.style.top = (8 + pr(k, 78.2) * 78).toFixed(1) + "%";
      s.style.setProperty("--d", (pr(k, 3.7) * 6).toFixed(2) + "s");
      s.style.setProperty("--sz", (4 + pr(k, 5.1) * 7).toFixed(1) + "px");
    } else if (fx === "docs") {
      s.style.left = (10 + pr(k, 22.1) * 78).toFixed(1) + "%";
      s.style.top = (12 + pr(k, 41.3) * 64).toFixed(1) + "%";
      s.style.setProperty("--d", (pr(k, 9.4) * 5).toFixed(2) + "s");
    }
    layer.appendChild(s);
  }

  hero.insertBefore(layer, hero.firstChild);
})();
