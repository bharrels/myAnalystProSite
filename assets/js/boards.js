/* =============================================================
   Interactive deep-dive boards, in the same spirit as board.js /
   live.js but each in its own module style. Self-contained IIFEs,
   demo data, design tokens 1:1, reduced-motion safe.
     [data-paceboard]  Pacing & Forecast  (blue)
     [data-mapboard]   Geospatial Map     (info/teal)
     [data-retboard]   Retention          (amber)
   ============================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function onView(el, cb) {
    if (reduce || !("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cb(); io.unobserve(e.target); } });
    }, { threshold: 0.18 });
    io.observe(el);
  }
  function money(n) { n = Math.round(n); return n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(0) + "K" : "$" + n; }

  /* ========================================================
     PACING & FORECAST  ->  [data-paceboard]
     ======================================================== */
  (function () {
    var hosts = document.querySelectorAll("[data-paceboard]");
    if (!hosts.length) return;
    var DAY = 12, DAYS = 30, prog = DAY / DAYS;
    // back-loaded month curve (cumulative fraction of month done by each day)
    function curveAt(day) { var t = day / DAYS; return Math.min(1, t * (0.78 + 0.22 * t)); }
    var SHAPE = curveAt(DAY); // fraction of month "earned" by day 12 on the shape curve
    var STORES = [
      { store: "3104", name: "Morgantown", goal: 120000, mtd: 49600 },
      { store: "2087", name: "Holler Lane", goal: 118000, mtd: 45900 },
      { store: "5521", name: "Frankland", goal: 112000, mtd: 38600 },
      { store: "1002", name: "NYC", goal: 105000, mtd: 34100 },
      { store: "2206", name: "Nitro", goal: 98000, mtd: 27400 }
    ];
    STORES.forEach(function (s) {
      s.linear = s.mtd / prog;
      s.shape = s.mtd / SHAPE;
      s.pct = s.shape / s.goal;
      s.status = s.pct >= 1.01 ? "ahead" : s.pct >= 0.965 ? "ontrack" : "behind";
      // build daily cumulative actual using the shape curve scaled to mtd
      s.daily = [];
      for (var d = 0; d <= DAY; d++) s.daily.push(s.mtd * (curveAt(d) / SHAPE));
    });
    var CHAIN = STORES.reduce(function (a, s) { return { goal: a.goal + s.goal, mtd: a.mtd + s.mtd, shape: a.shape + s.shape }; }, { goal: 0, mtd: 0, shape: 0 });
    var ST = {
      ahead: { c: "var(--success)", bg: "var(--success-bg)", g: "▲", l: "Ahead" },
      ontrack: { c: "var(--info)", bg: "var(--info-bg)", g: "●", l: "On track" },
      behind: { c: "var(--danger)", bg: "var(--danger-bg)", g: "▼", l: "Behind" }
    };
    function pill(st) { var t = ST[st]; return '<span class="pc-pill" style="color:' + t.c + ';background:' + t.bg + ';border-color:color-mix(in srgb,' + t.c + ' 24%,transparent)"><i>' + t.g + '</i>' + t.l + '</span>'; }

    function chartSVG(s, mode) {
      var W = 520, H = 190, padL = 8, padR = 8, padT = 14, padB = 22;
      var proj = mode === "linear" ? s.linear : s.shape;
      var maxY = Math.max(s.goal, proj) * 1.08;
      var x = function (day) { return (padL + (day / DAYS) * (W - padL - padR)).toFixed(1); };
      var y = function (v) { return (padT + (1 - v / maxY) * (H - padT - padB)).toFixed(1); };
      // actual line (day 0..DAY)
      var act = s.daily.map(function (v, d) { return x(d) + "," + y(v); }).join(" ");
      var actArea = "M" + x(0) + "," + y(0) + " L" + s.daily.map(function (v, d) { return x(d) + "," + y(v); }).join(" L") + " L" + x(DAY) + "," + y(0) + " Z";
      // projection from last actual to projected end
      var lastV = s.daily[DAY];
      var projLine = x(DAY) + "," + y(lastV) + " " + x(DAYS) + "," + y(proj);
      // confidence band around projection
      var band = "M" + x(DAY) + "," + y(lastV) + " L" + x(DAYS) + "," + y(proj * 1.06) + " L" + x(DAYS) + "," + y(proj * 0.94) + " Z";
      // budget straight line
      var budget = x(0) + "," + y(0) + " " + x(DAYS) + "," + y(s.goal);
      // gridlines (4)
      var grid = [0.25, 0.5, 0.75, 1].map(function (f) { return '<line x1="' + x(0) + '" y1="' + y(maxY * f) + '" x2="' + x(DAYS) + '" y2="' + y(maxY * f) + '" stroke="var(--border-2)" stroke-width="1"/>'; }).join("");
      var todayX = x(DAY);
      var goalY = y(s.goal), projY = y(proj);
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pc-svg" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--info)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--info)" stop-opacity="0"/></linearGradient></defs>' +
        grid +
        '<line x1="' + todayX + '" y1="' + padT + '" x2="' + todayX + '" y2="' + (H - padB) + '" stroke="var(--fg-3)" stroke-width="1" stroke-dasharray="3 4" opacity=".5"/>' +
        '<path d="' + actArea + '" fill="url(#pc-fill)"/>' +
        '<path d="' + band + '" fill="var(--info)" opacity=".1"/>' +
        '<polyline points="' + budget + '" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="6 5"/>' +
        '<polyline class="pc-proj" points="' + projLine + '" fill="none" stroke="var(--info)" stroke-width="2.2" stroke-dasharray="2 5" stroke-linecap="round"/>' +
        '<polyline class="pc-act" points="' + act + '" fill="none" stroke="var(--info)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + x(DAYS) + '" cy="' + projY + '" r="4" fill="var(--info)"/>' +
        '<circle cx="' + x(DAYS) + '" cy="' + goalY + '" r="3.5" fill="none" stroke="var(--amber)" stroke-width="2"/>' +
        '<circle cx="' + todayX + '" cy="' + y(lastV) + '" r="3.5" fill="var(--info)"/>' +
        '</svg>';
    }

    function detail(s, mode) {
      var proj = mode === "linear" ? s.linear : s.shape;
      var toGoal = proj - s.goal;
      var t = ST[s.status];
      return '<div class="pc-kpis">' +
          '<div class="pc-k"><small>MTD net sales</small><b>' + money(s.mtd) + '</b><span class="pc-sub">day ' + DAY + ' of ' + DAYS + '</span></div>' +
          '<div class="pc-k"><small>Projected EOM</small><b style="color:var(--info)">' + money(proj) + '</b><span class="pc-sub">' + (mode === "linear" ? "linear" : "shape-adjusted") + '</span></div>' +
          '<div class="pc-k"><small>To goal</small><b style="color:' + t.c + '">' + Math.round(s.pct * 100) + '%</b><span class="pc-sub" style="color:' + t.c + '">' + (toGoal >= 0 ? "+" : "−") + money(Math.abs(toGoal)) + '</span></div>' +
        '</div>' +
        '<div class="pc-chart">' + chartSVG(s, mode) +
          '<div class="pc-legend"><span><i style="background:var(--info)"></i>Actual pace</span><span><i style="background:var(--info);opacity:.5"></i>Projection</span><span><i class="dash" style="background:var(--amber)"></i>Budget line</span></div>' +
        '</div>';
    }

    hosts.forEach(function (host) {
      host.classList.add("appboard");
      var sel = 0, mode = "shape", filter = "all";
      function render() {
        var s = STORES[sel];
        host.innerHTML =
          '<div class="pc-top">' +
            '<div class="pc-head"><div class="pc-title">' + s.name + ' <span class="pc-mute">#' + s.store + '</span></div>' +
              '<div class="pc-sub2">Chain projected ' + money(CHAIN.shape) + ' vs ' + money(CHAIN.goal) + ' goal · ' + Math.round(CHAIN.shape / CHAIN.goal * 100) + '% on pace</div></div>' +
            '<div class="pc-modes"><button data-m="shape"' + (mode === "shape" ? ' class="on"' : "") + '>Shape-adjusted</button><button data-m="linear"' + (mode === "linear" ? ' class="on"' : "") + '>Linear</button></div>' +
          '</div>' +
          detail(s, mode) +
          '<div class="pc-filters"><button data-f="all"' + (filter === "all" ? ' class="on"' : "") + '>All ' + STORES.length + '</button>' +
            '<button data-f="behind"' + (filter === "behind" ? ' class="on"' : "") + '>Behind</button>' +
            '<button data-f="ontrack"' + (filter === "ontrack" ? ' class="on"' : "") + '>On track</button>' +
            '<button data-f="ahead"' + (filter === "ahead" ? ' class="on"' : "") + '>Ahead</button></div>' +
          '<div class="pc-rows">' + STORES.map(function (st, i) {
            var hide = filter !== "all" && st.status !== filter;
            return '<button class="pc-row' + (i === sel ? " sel" : "") + '" data-i="' + i + '"' + (hide ? ' hidden' : "") + '>' +
              '<span class="pc-rn"><b>' + st.name + '</b><i>#' + st.store + '</i></span>' +
              '<span class="pc-rv">' + money(st.mtd) + '<i>MTD</i></span>' +
              '<span class="pc-rv">' + money(st.shape) + '<i>proj</i></span>' +
              pill(st.status) + '</button>';
          }).join("") + '</div>';
        wire();
        animate();
      }
      function wire() {
        host.querySelectorAll(".pc-row").forEach(function (b) { b.addEventListener("click", function () { sel = +b.getAttribute("data-i"); render(); }); });
        host.querySelectorAll(".pc-modes button").forEach(function (b) { b.addEventListener("click", function () { mode = b.getAttribute("data-m"); render(); }); });
        host.querySelectorAll(".pc-filters button").forEach(function (b) { b.addEventListener("click", function () { filter = b.getAttribute("data-f"); render(); }); });
      }
      function animate() {
        if (reduce) return;
        var act = host.querySelector(".pc-act"); if (!act) return;
        var len = act.getTotalLength ? act.getTotalLength() : 0;
        if (len) { act.style.strokeDasharray = len; act.style.strokeDashoffset = len; act.getBoundingClientRect(); act.style.transition = "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)"; act.style.strokeDashoffset = 0; }
      }
      onView(host, render);
    });
  })();

  /* ========================================================
     GEOSPATIAL MAP  ->  [data-mapboard]
     ======================================================== */
  (function () {
    var hosts = document.querySelectorAll("[data-mapboard]");
    if (!hosts.length) return;
    var STORES = [
      { store: "3104", name: "Morgantown", x: 168, y: 96, pct3: 68, zip: "North end", pull: "3.1 mi", guests: 4120, sales: 1.00, ret: 0.74 },
      { store: "2087", name: "Holler Lane", x: 232, y: 72, pct3: 61, zip: "Riverside", pull: "3.8 mi", guests: 3880, sales: 0.86, ret: 0.69 },
      { store: "5521", name: "Frankland", x: 250, y: 138, pct3: 57, zip: "West side", pull: "4.4 mi", guests: 3210, sales: 0.71, ret: 0.66 },
      { store: "4410", name: "Poplar", x: 96, y: 132, pct3: 52, zip: "Uptown", pull: "5.2 mi", guests: 2740, sales: 0.58, ret: 0.61 }
    ];
    var LAYERS = { sales: { c: "#15a98c", l: "Gross sales" }, guests: { c: "#3d7ff2", l: "Guest count" }, retention: { c: "#fcb041", l: "Retention" } };
    var ORIGINS = [[120, 64], [210, 70], [150, 124], [206, 116], [132, 98], [190, 50], [240, 100], [100, 80], [180, 140], [220, 130]];

    hosts.forEach(function (host) {
      host.classList.add("appboard");
      var sel = 0, layer = "guests", mode = "heat";
      function val(s) { return layer === "sales" ? s.sales : layer === "retention" ? s.ret : (s.guests / 4500); }
      function render() {
        var s = STORES[sel], col = LAYERS[layer].c;
        var rings = mode === "heat" ? STORES.map(function (st) {
          var k = i(st), r1 = 14 + k * 30, op = 0.10 + val(st) * 0.18;
          return '<circle cx="' + st.x + '" cy="' + st.y + '" r="' + (r1 + 18) + '" fill="' + col + '" opacity="' + (op * 0.5).toFixed(2) + '"/>' +
            '<circle cx="' + st.x + '" cy="' + st.y + '" r="' + r1 + '" fill="' + col + '" opacity="' + op.toFixed(2) + '"/>';
        }).join("") : "";
        function i(st) { return st === s ? 1 : 0.55; }
        // selected store drive-time isochrones
        var iso = '<circle cx="' + s.x + '" cy="' + s.y + '" r="46" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-dasharray="3 4" opacity=".5"/>' +
          '<circle cx="' + s.x + '" cy="' + s.y + '" r="30" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-dasharray="3 4" opacity=".7"/>' +
          '<circle cx="' + s.x + '" cy="' + s.y + '" r="16" fill="none" stroke="' + col + '" stroke-width="1.4" stroke-dasharray="3 4"/>';
        var choro = mode === "choro" ? gridCells(col) : "";
        var origins = mode === "points" ? ORIGINS.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="' + col + '" opacity=".7"/>'; }).join("") : "";
        var pins = STORES.map(function (st, idx) {
          var on = idx === sel;
          return '<g class="gm-pin" data-i="' + idx + '" style="cursor:pointer">' +
            '<circle cx="' + st.x + '" cy="' + st.y + '" r="' + (on ? 7 : 5) + '" fill="' + (on ? col : "var(--bg-1)") + '" stroke="' + col + '" stroke-width="2.4"/>' +
            (on ? '<circle cx="' + st.x + '" cy="' + st.y + '" r="3" fill="#fff"/>' : "") + '</g>';
        }).join("");
        host.innerHTML =
          '<div class="gm-top">' +
            '<div class="gm-layers">' + Object.keys(LAYERS).map(function (k) { return '<button data-l="' + k + '"' + (k === layer ? ' class="on"' : "") + '><i style="background:' + LAYERS[k].c + '"></i>' + LAYERS[k].l + '</button>'; }).join("") + '</div>' +
            '<div class="gm-modes">' + [["heat", "Heatmap"], ["points", "Points"], ["choro", "Choropleth"]].map(function (m) { return '<button data-mo="' + m[0] + '"' + (m[0] === mode ? ' class="on"' : "") + '>' + m[1] + '</button>'; }).join("") + '</div>' +
          '</div>' +
          '<div class="gm-stage"><svg viewBox="0 0 320 200" class="gm-svg" aria-hidden="true">' +
            '<rect width="320" height="200" rx="10" fill="var(--bg-3)"/>' +
            '<g stroke="var(--border-2)" stroke-width="1">' + [40, 80, 120, 160].map(function (yy) { return '<line x1="0" y1="' + yy + '" x2="320" y2="' + yy + '"/>'; }).join("") + [64, 128, 192, 256].map(function (xx) { return '<line x1="' + xx + '" y1="0" x2="' + xx + '" y2="200"/>'; }).join("") + '</g>' +
            choro + rings + origins + iso + pins +
          '</svg></div>' +
          '<div class="gm-read">' +
            '<div class="gm-r"><small>Selected</small><b>' + s.name + ' <span class="pc-mute">#' + s.store + '</span></b></div>' +
            '<div class="gm-r"><small>Within 3-mi drive</small><b style="color:' + col + '">' + s.pct3 + '%</b></div>' +
            '<div class="gm-r"><small>Top guest origin</small><b>' + s.zip + '</b></div>' +
            '<div class="gm-r"><small>Trade-area pull</small><b>' + s.pull + '</b></div>' +
          '</div>';
        host.querySelectorAll(".gm-pin").forEach(function (g) { g.addEventListener("click", function () { sel = +g.getAttribute("data-i"); render(); }); });
        host.querySelectorAll(".gm-layers button").forEach(function (b) { b.addEventListener("click", function () { layer = b.getAttribute("data-l"); render(); }); });
        host.querySelectorAll(".gm-modes button").forEach(function (b) { b.addEventListener("click", function () { mode = b.getAttribute("data-mo"); render(); }); });
      }
      function gridCells(col) {
        var out = "", vals = [0.2, 0.5, 0.35, 0.8, 0.6, 0.25, 0.7, 0.45, 0.9, 0.3, 0.55, 0.15];
        var k = 0;
        for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
          if ((r + c) % 3 === 0) continue;
          out += '<rect x="' + (c * 80 + 2) + '" y="' + (r * 50 + 2) + '" width="76" height="46" rx="4" fill="' + col + '" opacity="' + (0.08 + vals[k % vals.length] * 0.3).toFixed(2) + '"/>';
          k++;
        }
        return out;
      }
      onView(host, render);
    });
  })();

  /* ========================================================
     RETENTION  ->  [data-retboard]
     ======================================================== */
  (function () {
    var hosts = document.querySelectorAll("[data-retboard]");
    if (!hosts.length) return;
    var LIFE = [["ontrack", "On-track", "var(--viz-1)"], ["duesoon", "Due-soon", "var(--viz-4)"], ["overdue", "Overdue", "var(--viz-2)"], ["lapsed", "Lapsed", "var(--viz-3)"]];
    var STORES = [
      { store: "3104", name: "Morgantown", life: { ontrack: 61, duesoon: 19, overdue: 13, lapsed: 7 }, atrisk: 6200, overdueN: 38, repeat: 64, clv: 1180,
        rfm: { champions: 412, loyal: 690, atrisk: 224, hibernating: 168 },
        due: [["Household A", "Overdue 14d", "$420 CLV"], ["Household B", "Due in 5d", "$960 CLV"], ["Household C", "Overdue 31d", "$380 CLV"]] },
      { store: "2087", name: "Holler Lane", life: { ontrack: 57, duesoon: 21, overdue: 15, lapsed: 7 }, atrisk: 7100, overdueN: 41, repeat: 59, clv: 1090,
        rfm: { champions: 358, loyal: 612, atrisk: 268, hibernating: 196 },
        due: [["Household D", "Overdue 9d", "$510 CLV"], ["Household E", "Due in 3d", "$1,120 CLV"], ["Household F", "Overdue 22d", "$340 CLV"]] },
      { store: "4410", name: "Poplar", life: { ontrack: 54, duesoon: 21, overdue: 16, lapsed: 9 }, atrisk: 8400, overdueN: 47, repeat: 55, clv: 1020,
        rfm: { champions: 296, loyal: 548, atrisk: 312, hibernating: 244 },
        due: [["Household G", "Overdue 18d", "$470 CLV"], ["Household H", "Due in 2d", "$880 CLV"], ["Household I", "Overdue 40d", "$300 CLV"]] }
    ];
    var SEG = { champions: { c: "var(--success)", l: "Champions" }, loyal: { c: "var(--info)", l: "Loyal" }, atrisk: { c: "var(--warning)", l: "At-risk" }, hibernating: { c: "var(--danger)", l: "Hibernating" } };

    hosts.forEach(function (host) {
      host.classList.add("appboard");
      var sel = 0;
      function render() {
        var s = STORES[sel];
        host.innerHTML =
          '<div class="rt-switch">' + STORES.map(function (st, i) { return '<button data-i="' + i + '"' + (i === sel ? ' class="on"' : "") + '>' + st.name + ' <i>#' + st.store + '</i></button>'; }).join("") + '</div>' +
          '<div class="rt-grid">' +
            '<div class="rt-life">' +
              '<div class="rt-cap">Service lifecycle <span>VIN-level</span></div>' +
              '<div class="rt-stack">' + LIFE.map(function (l) { return '<span class="rt-seg" data-w="' + s.life[l[0]] + '" style="background:' + l[2] + '"></span>'; }).join("") + '</div>' +
              '<div class="rt-bars">' + LIFE.map(function (l) {
                return '<div class="rt-bar"><span class="rt-bl"><i style="background:' + l[2] + '"></i>' + l[1] + '</span><span class="rt-bt"><span class="rt-bf" data-w="' + s.life[l[0]] + '" style="background:' + l[2] + '"></span></span><b>' + s.life[l[0]] + '%</b></div>';
              }).join("") + '</div>' +
            '</div>' +
            '<div class="rt-side">' +
              '<div class="rt-cap">RFM segments <span>households</span></div>' +
              '<div class="rt-rfm">' + Object.keys(SEG).map(function (k) { return '<div class="rt-cell" style="--sc:' + SEG[k].c + '"><b>' + s.rfm[k] + '</b><small>' + SEG[k].l + '</small></div>'; }).join("") + '</div>' +
              '<div class="rt-stats"><div><b>' + s.repeat + '%</b><small>repeat rate</small></div><div><b>' + money(s.clv) + '</b><small>avg household CLV</small></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="rt-risk"><div class="rt-riskhead"><strong>' + s.overdueN + ' households overdue</strong> · ≈ ' + money(s.atrisk) + ' at-risk revenue<span class="rt-export">Export due-for-service ↓</span></div>' +
            '<div class="rt-list">' + s.due.map(function (d) { return '<div class="rt-li"><span class="rt-av">' + d[0].charAt(0) + '</span><span class="rt-name">' + d[0] + '</span><span class="rt-due">' + d[1] + '</span><span class="rt-clv">' + d[2] + '</span></div>'; }).join("") + '</div>' +
          '</div>';
        host.querySelectorAll(".rt-switch button").forEach(function (b) { b.addEventListener("click", function () { sel = +b.getAttribute("data-i"); render(); }); });
        animate();
      }
      function animate() {
        if (reduce) {
          host.querySelectorAll(".rt-seg,.rt-bf").forEach(function (e) { e.style.width = e.getAttribute("data-w") + "%"; });
          return;
        }
        host.querySelectorAll(".rt-seg,.rt-bf").forEach(function (e) { e.style.width = "0%"; });
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          host.querySelectorAll(".rt-seg,.rt-bf").forEach(function (e) { e.style.width = e.getAttribute("data-w") + "%"; });
        }); });
      }
      onView(host, render);
    });
  })();
})();
