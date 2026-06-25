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
  var NAMES = ["0188 Albuquerque", "0205 Santa Fe", "0305 Las Cruces", "0411 Farmington", "0142 Rio Rancho", "0233 Rio West"];
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
