/* =============================================================
   Faithful, interactive recreation of the myAnalyst Store Health
   board. Mirrors the real app components (ScoreRing, ScoreCard,
   PillarBar, Sparkline, StatusPill) and design tokens 1:1, with
   demo data. Builds into [data-shboard].
   ============================================================= */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-shboard]");
  if (!hosts.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GRADE_TONES = { A: "var(--brand-teal)", B: "var(--success)", C: "var(--info)", D: "var(--warning)", F: "var(--danger)" };
  var PILLARS = [["growth", "Growth"], ["goal", "Goal"], ["loyalty", "Loyalty"], ["standing", "Standing"], ["operations", "Operations"]];
  function scoreTone(s) { return s == null ? "var(--fg-3)" : s >= 70 ? "var(--success)" : s >= 55 ? "var(--info)" : s >= 40 ? "var(--warning)" : "var(--danger)"; }

  function trend(start, end) { var a = [], n = 7; for (var i = 0; i < n; i++) a.push({ score: Math.round(start + (end - start) * (i / (n - 1))) }); return a; }
  var STORES = [
    { name: "Morgantown", store: "3104", rank: 1, dm: "Brendan Kraft", score: 93, grade: "A", status: "healthy", pillars: { growth: 100, goal: 88, loyalty: 90, standing: 91, operations: 86 }, yoy: 13.2, trend: trend(78, 93) },
    { name: "Holler Lane", store: "2087", rank: 2, dm: "Brendan Kraft", score: 91, grade: "A", status: "healthy", pillars: { growth: 100, goal: 84, loyalty: 88, standing: 89, operations: 84 }, yoy: 10.7, trend: trend(80, 91) },
    { name: "Frankland", store: "5521", rank: 3, dm: "Brendan Kraft", score: 88, grade: "A", status: "healthy", pillars: { growth: 96, goal: 80, loyalty: 85, standing: 87, operations: 82 }, yoy: 6.4, trend: trend(79, 88) },
    { name: "Poplar", store: "4410", rank: 4, dm: "Brendan Kraft", score: 86, grade: "A", status: "healthy", pillars: { growth: 100, goal: 78, loyalty: 83, standing: 85, operations: 80 }, yoy: 8.9, trend: trend(77, 86) },
    { name: "NYC", store: "1002", rank: 9, dm: "Tyler Richard", score: 78, grade: "B", status: "healthy", pillars: { growth: 84, goal: 72, loyalty: 80, standing: 78, operations: 74 }, yoy: 4.0, trend: trend(72, 78) },
    { name: "Dent", store: "3318", rank: 12, dm: "Tyler Richard", score: 74, grade: "B", status: "healthy", pillars: { growth: 80, goal: 70, loyalty: 76, standing: 73, operations: 68 }, yoy: 3.4, trend: trend(70, 74) },
    { name: "Nitro", store: "2206", rank: 21, dm: "Tyler Richard", score: 62, grade: "C", status: "watch", pillars: { growth: 60, goal: 55, loyalty: 66, standing: 61, operations: 52 }, yoy: -1.2, trend: trend(66, 62) },
    { name: "Georgetown", store: "4789", rank: 24, dm: "Tyler Richard", score: 58, grade: "C", status: "watch", pillars: { growth: 54, goal: 49, loyalty: 62, standing: 57, operations: 48 }, yoy: -3.1, trend: trend(64, 58) },
    { name: "Bridgeport", store: "5140", rank: 29, dm: "Dana Ruiz", score: 41, grade: "D", status: "at_risk", pillars: { growth: 38, goal: 32, loyalty: 50, standing: 44, operations: 36 }, yoy: -7.4, trend: trend(52, 41) }
  ];
  var CHAIN = { grade: "C", score: 69, total: 30, healthy: 8, watch: 17, at_risk: 5 };
  var STATUS = {
    healthy: { color: "var(--success)", bg: "var(--success-bg)", glyph: "✓", label: "Healthy" },
    watch: { color: "var(--warning)", bg: "var(--warning-bg)", glyph: "◑", label: "Watch" },
    at_risk: { color: "var(--danger)", bg: "var(--danger-bg)", glyph: "▼", label: "At risk" }
  };

  function ringSVG(score, grade, size, stroke) {
    var tone = GRADE_TONES[grade] || "var(--fg-3)";
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, target = c * (1 - score / 100);
    var ls = Math.round(size * 0.32), ns = Math.round(size * 0.15);
    return '<div class="sh-ring" style="position:relative;width:' + size + 'px;height:' + size + 'px;flex-shrink:0">' +
      '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);display:block">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--bg-3)" stroke-width="' + stroke + '"/>' +
      '<circle class="sh-arc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (reduce ? target : c) + '" data-target="' + target + '" style="transition:stroke-dashoffset .9s cubic-bezier(.16,1,.3,1)"/></svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1">' +
      '<span style="font-size:' + ls + 'px;font-weight:800;color:' + tone + ';letter-spacing:-.02em">' + grade + '</span>' +
      '<span style="font-size:' + ns + 'px;font-weight:700;color:var(--fg-3);margin-top:3px;font-variant-numeric:tabular-nums">' + score + '</span></div></div>';
  }
  function pillar(label, score) {
    var tone = scoreTone(score);
    return '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:10.5px;font-weight:600;color:var(--fg-3);width:72px;flex-shrink:0;text-transform:uppercase;letter-spacing:.03em">' + label + '</span>' +
      '<div style="flex:1;height:5px;background:var(--bg-3);border-radius:999px;overflow:hidden"><div class="sh-pill" data-w="' + score + '" style="height:100%;width:0%;background:' + tone + ';border-radius:999px;transition:width .6s cubic-bezier(.16,1,.3,1)"></div></div>' +
      '<span style="font-size:11px;font-weight:700;color:var(--fg-2);width:22px;text-align:right;font-variant-numeric:tabular-nums">' + score + '</span></div>';
  }
  function sparkline(points) {
    var w = 104, h = 26, pad = 3;
    var xs = function (i) { return (pad + (i / (points.length - 1)) * (w - pad * 2)).toFixed(1); };
    var ys = function (v) { return (pad + (1 - v / 100) * (h - pad * 2)).toFixed(1); };
    var pts = points.map(function (p, i) { return xs(i) + "," + ys(p.score); }).join(" ");
    var rising = points[points.length - 1].score >= points[0].score;
    return '<svg width="' + w + '" height="' + h + '" style="display:block;overflow:visible"><polyline points="' + pts + '" fill="none" stroke="var(--brand-teal)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
      '<circle cx="' + xs(points.length - 1) + '" cy="' + ys(points[points.length - 1].score) + '" r="2.5" fill="' + (rising ? "var(--success)" : "var(--danger)") + '"/></svg>';
  }
  function pill(status) {
    var t = STATUS[status]; if (!t) return "";
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;line-height:1;color:' + t.color + ';background:' + t.bg + ';border:1px solid color-mix(in srgb,' + t.color + ' 22%,transparent);white-space:nowrap"><span style="font-size:10px">' + t.glyph + '</span>' + t.label + '</span>';
  }
  function card(s, i) {
    return '<div class="sh-card sh-rise" data-status="' + s.status + '" style="background:var(--bg-2);border:1px solid var(--border-1);border-radius:var(--r-lg);box-shadow:var(--shadow-xs);padding:16px 18px;cursor:pointer;display:flex;flex-direction:column;gap:12px;transition:transform .15s ease,box-shadow .15s ease;animation-delay:' + (Math.min(i, 12) * 35) + 'ms">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px"><div style="min-width:0">' +
      '<div style="font-size:14px;font-weight:700;color:var(--fg-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + s.name + '</div>' +
      '<div style="font-size:11px;color:var(--fg-3);margin-top:2px">#' + s.store + ' · <span style="font-weight:600">Rank ' + s.rank + '</span> · ' + s.dm + '</div></div>' + pill(s.status) + '</div>' +
      '<div style="display:flex;align-items:center;gap:16px">' + ringSVG(s.score, s.grade, 74, 7) +
      '<div style="flex:1;display:flex;flex-direction:column;gap:5px;min-width:0">' + PILLARS.map(function (p) { return pillar(p[1], s.pillars[p[0]]); }).join("") + '</div></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--border-2);padding-top:10px">' + sparkline(s.trend) +
      '<span style="font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;color:' + (s.yoy >= 0 ? "var(--success)" : "var(--danger)") + '">' + (s.yoy >= 0 ? "▲" : "▼") + " " + Math.abs(s.yoy).toFixed(1) + '% YoY</span></div></div>';
  }

  hosts.forEach(function (host) {
    host.classList.add("appboard");
    var distSeg = function (n, color) { return '<i style="width:' + (n / CHAIN.total * 100) + '%;background:' + color + '"></i>'; };
    host.innerHTML =
      '<div class="shb-summary">' + ringSVG(CHAIN.score, CHAIN.grade, 104, 9) +
        '<div class="txt"><div style="font-size:15px;font-weight:700;color:var(--fg-1)">Your chain grades ' + CHAIN.grade + ' (' + CHAIN.score + ') across ' + CHAIN.total + ' stores</div>' +
        '<div style="font-size:12.5px;color:var(--fg-2);margin-top:3px">' + CHAIN.healthy + ' healthy · ' + CHAIN.watch + ' to watch · ' + CHAIN.at_risk + ' at risk</div>' +
        '<div class="shb-dist">' + distSeg(CHAIN.healthy, "var(--success)") + distSeg(CHAIN.watch, "var(--warning)") + distSeg(CHAIN.at_risk, "var(--danger)") + '</div>' +
        '<div class="shb-legend"><span><b style="background:var(--success)"></b>Healthy</span><span><b style="background:var(--warning)"></b>Watch</span><span><b style="background:var(--danger)"></b>At risk</span></div></div></div>' +
      '<div class="shb-filters">' +
        '<button class="active" data-f="all">All ' + CHAIN.total + '</button>' +
        '<button data-f="at_risk">At risk ' + CHAIN.at_risk + '</button>' +
        '<button data-f="watch">Watch ' + CHAIN.watch + '</button>' +
        '<button data-f="healthy">Healthy ' + CHAIN.healthy + '</button></div>' +
      '<div class="shb-grid">' + STORES.map(card).join("") + '</div>' +
      '<button class="shb-more" type="button" hidden></button>';

    // hover lift
    host.querySelectorAll(".sh-card").forEach(function (c) {
      c.addEventListener("mouseover", function () { c.style.transform = "translateY(-2px)"; c.style.boxShadow = "var(--shadow-md)"; });
      c.addEventListener("mouseout", function () { c.style.transform = "none"; c.style.boxShadow = "var(--shadow-xs)"; });
    });
    // filters + mobile "show more" (cap the long single-column list on phones,
    // so you get the chain summary + a few cards instead of endless scrolling)
    var MOBILE_CAP = 3, expanded = false, activeFilter = "all";
    var moreBtn = host.querySelector(".shb-more");
    function isMobile() { return window.matchMedia("(max-width:560px)").matches; }
    function applyView() {
      var mob = isMobile(), shown = 0, total = 0;
      host.querySelectorAll(".sh-card").forEach(function (c) {
        var match = activeFilter === "all" || c.getAttribute("data-status") === activeFilter;
        if (match) total++;
        var show = match && !(mob && !expanded && shown >= MOBILE_CAP);
        if (show) shown++;
        c.style.display = show ? "" : "none";
      });
      if (moreBtn) {
        var need = mob && !expanded && total > MOBILE_CAP;
        moreBtn.hidden = !need;
        if (need) moreBtn.textContent = "Show all " + total + " stores";
      }
    }
    var btns = host.querySelectorAll(".shb-filters button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.toggle("active", x === b); });
        activeFilter = b.getAttribute("data-f");
        expanded = false;
        applyView();
      });
    });
    if (moreBtn) moreBtn.addEventListener("click", function () { expanded = true; applyView(); });
    applyView();
    window.addEventListener("resize", applyView);
    // animate rings + pillars on first reveal
    function play() {
      host.querySelectorAll(".sh-arc").forEach(function (a) { a.setAttribute("stroke-dashoffset", a.getAttribute("data-target")); });
      host.querySelectorAll(".sh-pill").forEach(function (p) { p.style.width = p.getAttribute("data-w") + "%"; });
    }
    if (reduce || !("IntersectionObserver" in window)) { play(); }
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { play(); io.unobserve(e.target); } }); }, { threshold: 0.2 });
      io.observe(host);
    }
  });
})();
