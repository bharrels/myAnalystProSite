/* =============================================================
   myAnalyst interactive dashboard demo (vanilla, no dependencies)
   Builds a faithful, interactive product preview into [data-demo].
   Mirrors the real app's data model: store-level metrics with
   last-year compare, a 0 to 100 Store Health score with five
   pillars, and budget pacing.
   ============================================================= */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-demo]");
  if (!hosts.length) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STORES = [
    { id: "0142", name: "Rio Rancho",   net: 6240, cars: 78, ticket: 80.0, labor: 26.1, revhr: 148, ly: 9.4,  health: 86, grade: "A", status: "Healthy",  pillars: [88, 84, 90, 85, 79] },
    { id: "0188", name: "Albuquerque",  net: 5910, cars: 74, ticket: 79.9, labor: 27.4, revhr: 139, ly: 5.1,  health: 81, grade: "B", status: "Healthy",  pillars: [80, 78, 85, 82, 74] },
    { id: "0205", name: "Santa Fe",     net: 5030, cars: 69, ticket: 72.9, labor: 28.9, revhr: 131, ly: 2.3,  health: 74, grade: "B", status: "Watch",    pillars: [72, 70, 79, 76, 68] },
    { id: "0261", name: "Los Lunas",    net: 4760, cars: 64, ticket: 74.4, labor: 27.0, revhr: 134, ly: 3.6,  health: 77, grade: "B", status: "Healthy",  pillars: [76, 74, 80, 78, 71] },
    { id: "0305", name: "Las Cruces",   net: 4120, cars: 61, ticket: 67.5, labor: 31.8, revhr: 104, ly: -6.0, health: 58, grade: "D", status: "At risk",  pillars: [54, 49, 66, 61, 52] },
    { id: "0377", name: "Roswell",      net: 3990, cars: 58, ticket: 68.8, labor: 30.2, revhr: 112, ly: -1.4, health: 64, grade: "C", status: "Watch",    pillars: [60, 58, 70, 66, 60] },
    { id: "0411", name: "Farmington",   net: 3880, cars: 55, ticket: 70.6, labor: 29.7, revhr: 118, ly: -3.2, health: 61, grade: "C", status: "Watch",    pillars: [58, 55, 68, 63, 57] },
    { id: "0455", name: "Gallup",       net: 3510, cars: 52, ticket: 67.5, labor: 30.9, revhr: 109, ly: 1.2,  health: 67, grade: "C", status: "Watch",    pillars: [64, 62, 72, 68, 61] }
  ];
  var PILLAR_LABELS = ["Growth", "Goal", "Loyalty", "Standing", "Operations"];
  var PACING = [13, 26, 40, 52, 66, 79, 93, 106, 119, 133, 146, 160, 173, 182]; // cumulative MTD net sales ($K)
  var BUDGET_END = 178; // budget-pace cumulative at day 14 ($K)

  function money(n, d) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var maxNet = Math.max.apply(null, STORES.map(function (s) { return s.net; }));

  hosts.forEach(function (host) { build(host); });

  function build(host) {
    host.classList.add("mademo");
    host.innerHTML =
      '<div class="mademo-bar"><i></i><i></i><i></i>' +
      '<span class="mademo-title mono"><span class="live-dot"></span>myAnalyst · Portfolio · 8 stores · live</span></div>' +
      '<div class="mademo-tabs" role="tablist" aria-label="Dashboard views">' +
        '<button class="mademo-tab active" role="tab" aria-selected="true" data-view="livestats">LiveStats</button>' +
        '<button class="mademo-tab" role="tab" aria-selected="false" data-view="health">Store Health</button>' +
        '<button class="mademo-tab" role="tab" aria-selected="false" data-view="pacing">Pacing</button>' +
      '</div>' +
      '<div class="mademo-body"></div>';

    var body = host.querySelector(".mademo-body");
    var tabs = host.querySelectorAll(".mademo-tab");
    var views = { livestats: liveStatsView(), health: healthView(), pacing: pacingView() };
    var current = "livestats";
    body.appendChild(views.livestats);

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var v = t.getAttribute("data-view");
        if (v === current) return;
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle("active", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        body.innerHTML = ""; body.appendChild(views[v]); current = v;
        if (v === "pacing") drawPacing(views.pacing);
        if (v === "health") animateHealth(views.health);
      });
    });

    // live tick on the LiveStats numbers
    if (!reduceMotion) {
      setInterval(function () {
        if (current !== "livestats") return;
        views.livestats.querySelectorAll("[data-net]").forEach(function (cell) {
          var base = parseFloat(cell.getAttribute("data-net"));
          var j = base * (0.004 + Math.random() * 0.01) * (Math.random() > 0.5 ? 1 : -1);
          cell.querySelector(".v").textContent = money(Math.round(base + j));
        });
      }, 2600);
    }
  }

  /* ---------- LiveStats: sortable, hoverable grid ---------- */
  function liveStatsView() {
    var wrap = el("div", "mademo-view");
    var cols = [
      { k: "name", label: "Store", num: false },
      { k: "net", label: "Net Sales", num: true },
      { k: "cars", label: "Cars", num: true },
      { k: "ticket", label: "Avg Ticket", num: true },
      { k: "labor", label: "Labor %", num: true },
      { k: "ly", label: "vs LY", num: true }
    ];
    var sortKey = "net", sortDir = -1;
    var table = el("table", "mademo-grid");
    var thead = el("thead");
    var htr = el("tr");
    cols.forEach(function (c) {
      var th = el("th", c.num ? "num" : "", c.label + '<span class="caret"></span>');
      th.setAttribute("role", "button"); th.tabIndex = 0;
      th.addEventListener("click", function () { setSort(c.k); });
      th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSort(c.k); } });
      th.dataset.k = c.k;
      htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el("tbody"); table.appendChild(tbody);
    wrap.appendChild(table);
    wrap.appendChild(el("p", "mademo-hint", "Click a column to sort. Numbers update live."));

    function setSort(k) {
      if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = (k === "name") ? 1 : -1; }
      render();
    }
    function render() {
      var rows = STORES.slice().sort(function (a, b) {
        var x = a[sortKey], y = b[sortKey];
        if (typeof x === "string") return x.localeCompare(y) * sortDir;
        return (x - y) * sortDir;
      });
      tbody.innerHTML = "";
      rows.forEach(function (s) {
        var tr = el("tr");
        var pct = Math.round((s.net / maxNet) * 100);
        tr.innerHTML =
          '<td class="store">' + s.id + ' ' + s.name + '</td>' +
          '<td class="num netcell" data-net="' + s.net + '"><span class="bar" style="width:' + pct + '%"></span><span class="v">' + money(s.net) + '</span></td>' +
          '<td class="num">' + s.cars + '</td>' +
          '<td class="num">' + money(s.ticket, 2) + '</td>' +
          '<td class="num">' + s.labor.toFixed(1) + '%</td>' +
          '<td class="num ' + (s.ly >= 0 ? "pos" : "neg") + '">' + (s.ly >= 0 ? "▲ " : "▼ ") + Math.abs(s.ly).toFixed(1) + '%</td>';
        tbody.appendChild(tr);
      });
      htr.querySelectorAll("th").forEach(function (th) {
        th.classList.toggle("sorted", th.dataset.k === sortKey);
        th.classList.toggle("desc", th.dataset.k === sortKey && sortDir < 0);
      });
    }
    render();
    return wrap;
  }

  /* ---------- Store Health: rings + clickable pillars ---------- */
  function healthView() {
    var wrap = el("div", "mademo-view");
    var avg = Math.round(STORES.reduce(function (a, s) { return a + s.health; }, 0) / STORES.length);
    var top = el("div", "mademo-health-top");
    top.innerHTML =
      ring(avg, gradeFor(avg), 116) +
      '<div class="mademo-health-lead"><div class="hh">Portfolio Store Health</div>' +
      '<div class="hs">Average of 8 locations. Click a store to see its five pillars.</div>' +
      '<div class="mademo-legend"><span class="lg ok">Healthy</span><span class="lg watch">Watch</span><span class="lg bad">At risk</span></div></div>';
    wrap.appendChild(top);

    var grid = el("div", "mademo-health-grid");
    STORES.forEach(function (s, i) {
      var cell = el("button", "mademo-store" + (i === 0 ? " active" : ""));
      cell.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      cell.innerHTML = ring(s.health, s.grade, 54) +
        '<div class="ms-meta"><div class="ms-name">' + s.id + '</div><div class="ms-status ' + statusClass(s.status) + '">' + s.status + '</div></div>';
      cell.addEventListener("click", function () {
        grid.querySelectorAll(".mademo-store").forEach(function (c) { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
        cell.classList.add("active"); cell.setAttribute("aria-pressed", "true");
        showPillars(s);
      });
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);

    var pill = el("div", "mademo-pillars");
    wrap.appendChild(pill);
    function showPillars(s) {
      pill.innerHTML = '<div class="mp-head">' + s.id + ' ' + s.name + ' · ' + s.health + ' / 100 · grade ' + s.grade + '</div>';
      var weights = [25, 25, 20, 15, 15];
      s.pillars.forEach(function (v, i) {
        var row = el("div", "mp-row");
        row.innerHTML = '<span class="mp-label">' + PILLAR_LABELS[i] + ' · ' + weights[i] + '%</span>' +
          '<span class="mp-track"><span class="mp-fill" style="width:0%"></span></span><span class="mp-val">' + v + '</span>';
        pill.appendChild(row);
        var fill = row.querySelector(".mp-fill");
        requestAnimationFrame(function () { setTimeout(function () { fill.style.width = v + "%"; }, reduceMotion ? 0 : 40 * i); });
      });
    }
    wrap._init = function () { showPillars(STORES[0]); };
    return wrap;
  }
  function animateHealth(view) { if (view._init) view._init(); }

  function ring(score, grade, size) {
    var pct = Math.max(0, Math.min(100, score));
    return '<div class="mademo-ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/>' +
      '<circle cx="21" cy="21" r="15.9" fill="none" stroke="' + ringColor(score) + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + pct + ' ' + (100 - pct) + '" transform="rotate(-90 21 21)"/></svg>' +
      '<div class="mr-c"><div class="mr-g" style="color:' + ringColor(score) + '">' + grade + '</div><div class="mr-n">' + score + '</div></div></div>';
  }
  function ringColor(s) { return s >= 80 ? "#2dd4b0" : s >= 65 ? "#6aa5ff" : s >= 60 ? "#fcb041" : "#ff5c7c"; }
  function gradeFor(s) { return s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F"; }
  function statusClass(st) { return st === "Healthy" ? "ok" : st === "Watch" ? "watch" : "bad"; }

  /* ---------- Pacing: chart with hover tooltip ---------- */
  function pacingView() {
    var wrap = el("div", "mademo-view");
    var mtd = PACING[PACING.length - 1];
    wrap.innerHTML =
      '<div class="mademo-kpis">' +
        '<div class="mk"><small>MTD Net Sales</small><strong>$' + Math.round(mtd) + 'K</strong><span class="d pos">on day 14 of 30</span></div>' +
        '<div class="mk"><small>Projected</small><strong>$612K</strong><span class="d pos">vs $600K goal</span></div>' +
        '<div class="mk"><small>To Goal</small><strong>102%</strong><span class="d pos">on pace</span></div>' +
      '</div>' +
      '<div class="mademo-chart"><svg viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true"></svg>' +
      '<div class="mademo-tip" hidden></div></div>' +
      '<div class="mademo-chart-legend"><span><i class="li actual"></i>Actual pace</span><span><i class="li budget"></i>Budget line</span></div>';
    return wrap;
  }
  function drawPacing(view) {
    var svg = view.querySelector("svg");
    if (!svg || svg.dataset.drawn) return;
    var W = 600, H = 200, pad = 10;
    var n = PACING.length, maxV = 195;
    function X(i) { return pad + (i / (n - 1)) * (W - pad * 2); }
    function Y(v) { return H - pad - (v / maxV) * (H - pad * 2); }
    var linePts = PACING.map(function (v, i) { return X(i) + "," + Y(v); });
    var areaD = "M" + linePts.join(" L") + " L" + X(n - 1) + "," + (H - pad) + " L" + X(0) + "," + (H - pad) + " Z";
    var lineD = "M" + linePts.join(" L");
    var budgetD = "M" + X(0) + "," + Y(4) + " L" + X(n - 1) + "," + Y(BUDGET_END);
    svg.innerHTML =
      '<defs><linearGradient id="mdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2dd4b0" stop-opacity=".35"/><stop offset="100%" stop-color="#2dd4b0" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + areaD + '" fill="url(#mdg)"/>' +
      '<path d="' + budgetD + '" fill="none" stroke="#fcb041" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path class="mademo-line" d="' + lineD + '" fill="none" stroke="#2dd4b0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle class="mademo-dot" r="4.5" fill="#0b0d10" stroke="#2dd4b0" stroke-width="2.5" cx="' + X(n - 1) + '" cy="' + Y(PACING[n - 1]) + '"/>';
    svg.dataset.drawn = "1";
    if (!reduceMotion) {
      var line = svg.querySelector(".mademo-line");
      try { var len = line.getTotalLength(); line.style.strokeDasharray = len; line.style.strokeDashoffset = len; line.getBoundingClientRect(); line.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)"; line.style.strokeDashoffset = "0"; } catch (e) {}
    }
    // hover tooltip
    var chart = view.querySelector(".mademo-chart");
    var tip = view.querySelector(".mademo-tip");
    var dot = svg.querySelector(".mademo-dot");
    chart.addEventListener("pointermove", function (e) {
      var r = chart.getBoundingClientRect();
      var rel = (e.clientX - r.left) / r.width;
      var i = Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1))));
      dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(PACING[i]));
      tip.hidden = false;
      tip.innerHTML = "Day " + (i + 1) + " · <b>$" + PACING[i] + "K</b>";
      tip.style.left = (X(i) / W * 100) + "%";
    });
    chart.addEventListener("pointerleave", function () {
      tip.hidden = true; dot.setAttribute("cx", X(n - 1)); dot.setAttribute("cy", Y(PACING[n - 1]));
    });
  }
})();
