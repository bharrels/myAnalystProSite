/* =============================================================
   myAnalyst — platform.html snapshot interactivity
   Turns the static "shot" mocks into small, usable examples with
   demo data: a sortable + live-ticking LiveStats grid, hoverable
   guest-origin map points, and a pacing chart with a hover readout.
   All decoration-grade; reduced-motion safe.
   ============================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- LiveStats: click a header to sort; values tick live ---------- */
  document.querySelectorAll(".livegrid").forEach(function (tbl) {
    var tbody = tbl.querySelector("tbody");
    if (!tbody) return;
    var ths = tbl.querySelectorAll("thead th");

    function val(td) {
      var t = (td.textContent || "").trim();
      var n = parseFloat(t.replace(/[^0-9.\-]/g, ""));
      return isNaN(n) ? t.toLowerCase() : n;
    }

    ths.forEach(function (th, ci) {
      th.classList.add("lg-sortable");
      th.setAttribute("role", "button");
      th.setAttribute("tabindex", "0");
      var sort = function () {
        var asc = th.getAttribute("data-dir") !== "asc";
        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
        rows.sort(function (a, b) {
          var x = val(a.children[ci]), y = val(b.children[ci]);
          return x < y ? (asc ? -1 : 1) : x > y ? (asc ? 1 : -1) : 0;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
        ths.forEach(function (t) { t.removeAttribute("data-dir"); t.classList.remove("lg-sorted", "desc"); });
        th.setAttribute("data-dir", asc ? "asc" : "desc");
        th.classList.add("lg-sorted");
        if (!asc) th.classList.add("desc");
      };
      th.addEventListener("click", sort);
      th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sort(); } });
    });

    if (reduce) return;
    var inView = true;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); });
      io.observe(tbl);
    }
    setInterval(function () {
      if (!inView) return;
      var rows = tbody.querySelectorAll("tr");
      if (!rows.length) return;
      var r = rows[Math.floor(Math.random() * rows.length)];
      var cell = r.children[1]; // Net Sales
      if (!cell) return;
      var base = parseFloat((cell.textContent || "").replace(/[^0-9.]/g, ""));
      if (isNaN(base)) return;
      var v = Math.round(base * (1 + (Math.random() * 0.014 - 0.005)));
      cell.textContent = "$" + v.toLocaleString("en-US");
      cell.classList.remove("pf-flash"); void cell.offsetWidth; cell.classList.add("pf-flash");
    }, 2600);
  });

  /* ---------- Map: hover the guest-origin points ---------- */
  var NAMES = ["2087 Holler Lane", "5521 Frankland", "4410 Poplar", "3318 Dent", "3104 Morgantown", "1002 NYC"];
  document.querySelectorAll('.shot svg circle[fill="#3d7ff2"]').forEach(function (c, i) {
    c.classList.add("map-pt");
    var t = document.createElementNS("http://www.w3.org/2000/svg", "title");
    t.textContent = NAMES[i % NAMES.length] + " · " + (38 + ((i * 23) % 54)) + " guests/wk";
    c.appendChild(t);
  });

  /* ---------- Pacing: a hover readout that follows the actual-pace line ---------- */
  document.querySelectorAll(".shot").forEach(function (shot) {
    var line = shot.querySelector('svg path[stroke="#3d7ff2"]');
    if (!line) return;
    var body = shot.querySelector(".shot-body") || shot;
    body.style.position = body.style.position || "relative";
    var tip = document.createElement("span");
    tip.className = "pf-tip";
    tip.setAttribute("aria-hidden", "true");
    body.appendChild(tip);
    var DAYS = 30;
    var START = 182, GOAL = 612; // $K MTD -> projected
    body.addEventListener("pointermove", function (e) {
      var r = body.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      var day = Math.round(1 + x * (DAYS - 1));
      var proj = Math.round((START + (GOAL - START) * x));
      tip.textContent = "Day " + day + " · $" + proj + "K projected";
      tip.style.left = (x * 100) + "%";
      tip.classList.add("on");
    });
    body.addEventListener("pointerleave", function () { tip.classList.remove("on"); });
  });
})();

/* ---------- Store Health snapshot: click a store to switch the live score + pillars ---------- */
(function () {
  "use strict";
  var ring = document.querySelector(".fr-media .score-ring");
  if (!ring) return;
  var card = ring.closest(".card");
  if (!card) return;
  var circles = ring.querySelectorAll("circle");
  var arc = circles[circles.length - 1];
  var grade = card.querySelector(".sc-grade");
  var num = card.querySelector(".sc-num");
  var pillars = card.querySelectorAll(".pillar .pl-fill");
  var pvals = card.querySelectorAll(".pillar .pl-val");
  var nameEl = card.querySelector("div[style*='font-weight:700']");
  var statusEl = card.querySelector("div[style*='color:var(--fg-3)']");
  if (!arc || !grade || !num || pillars.length < 5) return;

  var STORES = [
    { n: "Store 3104 · Morgantown", sc: 78, g: "B", c: "#2dd4b0", status: "Healthy · top quartile", p: [72, 64, 85, 81, 58] },
    { n: "Store 2087 · Holler Lane", sc: 91, g: "A", c: "#1dac92", status: "Healthy · chain leader", p: [100, 84, 88, 89, 84] },
    { n: "Store 4410 · Poplar", sc: 58, g: "C", c: "#fcb041", status: "Watch · slipping", p: [54, 49, 62, 57, 48] },
    { n: "Store 3318 · Dent", sc: 41, g: "D", c: "#e12a56", status: "At risk · needs attention", p: [38, 32, 50, 44, 36] }
  ];

  var chips = document.createElement("div");
  chips.className = "sh-switch";
  chips.innerHTML = '<span class="sh-lbl">Tap a store:</span>';
  STORES.forEach(function (st, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "sh-chip" + (i === 0 ? " on" : "");
    b.textContent = st.n.split("·")[1].trim();
    b.addEventListener("click", function () {
      set(i);
      chips.querySelectorAll(".sh-chip").forEach(function (c) { c.classList.remove("on"); });
      b.classList.add("on");
    });
    chips.appendChild(b);
  });
  card.insertBefore(chips, card.firstChild);

  function set(i) {
    var st = STORES[i];
    arc.setAttribute("stroke", st.c);
    arc.setAttribute("stroke-dasharray", st.sc + " " + (100 - st.sc));
    grade.textContent = st.g; grade.style.color = st.c;
    num.textContent = st.sc + " / 100";
    if (nameEl) nameEl.textContent = st.n;
    if (statusEl) statusEl.textContent = st.status;
    for (var k = 0; k < pillars.length && k < 5; k++) {
      pillars[k].style.width = st.p[k] + "%";
      pillars[k].style.background = st.p[k] >= 70 ? "var(--viz-1)" : st.p[k] >= 50 ? "var(--viz-4)" : "var(--viz-2)";
      if (pvals[k]) pvals[k].textContent = st.p[k];
    }
  }
})();
