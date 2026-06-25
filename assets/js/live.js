/* =============================================================
   Faithful, interactive recreation of the myAnalyst LIVE dashboard
   ("Today, so far" KPIs + Live Stats store table). Mirrors LivePulse +
   LiveStats + Delta from the real app, with demo data that ticks to
   feel live. Click a store row to DRILL IN inline (no navigation):
   it reveals that store's intraday detail + net-sales-by-hour. -> [data-livedash]
   ============================================================= */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-livedash]");
  if (!hosts.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rnd = (function () { var s = 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();

  function money(n) { n = Math.round(n); return n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : "$" + n.toLocaleString("en-US"); }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function money2(n) { return "$" + n.toFixed(2); }
  function dpct(ty, ly) { return ((ty - ly) / Math.abs(ly)) * 100; }
  function pill(ty, ly, id) { var p = dpct(ty, ly), up = p >= 0; return '<span class="lv-delta ' + (up ? "up" : "down") + '" data-d="' + id + '">' + (up ? "▲" : "▼") + " " + Math.abs(p).toFixed(1) + "% vs LY</span>"; }
  function badge(ty, ly, id) { var p = dpct(ty, ly), up = p >= 0; return '<span class="lv-badge ' + (up ? "up" : "down") + '"' + (id ? ' data-b="' + id + '"' : "") + ">" + (up ? "+" : "") + p.toFixed(1) + "%</span>"; }
  function asOf() { try { return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch (e) { return "now"; } }

  var HRS = ["7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p"];
  var CURVE = [0.34, 0.52, 0.71, 0.86, 1.0, 0.94, 0.83, 0.72, 0.58, 0.4];
  var CH = { sales_ty: 94280, sales_ly: 88110, cars_ty: 2512, cars_ly: 2388, labor_ty: 18420, labor_ly: 17900, reporting: 30 };
  var STORES = [
    { store: "3104", name: "Morgantown", dm: "Brendan Kraft", s: 4120, c: 108, ls: 3760, lc: 101 },
    { store: "2087", name: "Holler Lane", dm: "Brendan Kraft", s: 3890, c: 103, ls: 3610, lc: 99 },
    { store: "5521", name: "Frankland", dm: "Brendan Kraft", s: 3540, c: 96, ls: 3380, lc: 94 },
    { store: "4410", name: "Poplar", dm: "Brendan Kraft", s: 3210, c: 88, ls: 2980, lc: 83 },
    { store: "1002", name: "NYC", dm: "Tyler Richard", s: 2980, c: 79, ls: 2870, lc: 78 },
    { store: "3318", name: "Dent", dm: "Tyler Richard", s: 2740, c: 74, ls: 2690, lc: 73 },
    { store: "2206", name: "Nitro", dm: "Tyler Richard", s: 2210, c: 61, ls: 2330, lc: 64 },
    { store: "4789", name: "Georgetown", dm: "Dana Ruiz", s: 1980, c: 55, ls: 2120, lc: 60 }
  ];
  STORES.forEach(function (s, i) {
    var jitter = 0.85 + ((i * 37) % 30) / 100; // deterministic per store
    s.hours = CURVE.map(function (v, h) { return Math.round(s.s * v * jitter / CURVE.reduce(function (a, b) { return a + b; }, 0)); });
    s.peak = Math.max.apply(null, s.hours);
  });

  function detailHTML(s, i) {
    var tk = s.s / s.c, labor = s.s * 0.196, d = dpct(s.s, s.ls);
    var peakHr = HRS[s.hours.indexOf(s.peak)];
    var bars = s.hours.map(function (v, h) {
      var hot = v === s.peak;
      return '<div class="lv-bcol"><div class="lv-bar' + (hot ? " hot" : "") + '" style="height:' + Math.max(8, (v / s.peak) * 100) + '%"><span class="lv-btip">' + money(v) + "</span></div><span class=\"lv-bh\">" + HRS[h] + "</span></div>";
    }).join("");
    var mini = function (l, v, cls) { return '<div class="lv-mini"><span>' + l + '</span><b' + (cls ? ' class="' + cls + '"' : "") + ">" + v + "</b></div>"; };
    return '<div class="lv-detailwrap"><div class="lv-detail">' +
      '<div class="lv-dhead">' + s.name + ' &middot; <span class="lv-dmute">#' + s.store + " &middot; " + s.dm + "</span></div>" +
      '<div class="lv-dgrid">' +
        mini("Cars", fmt(s.c)) + mini("Avg Ticket", money2(tk)) + mini("Labor $", money(labor)) +
        mini("vs LY", (d >= 0 ? "+" : "") + d.toFixed(1) + "%", d >= 0 ? "up" : "down") +
        mini("Peak hour", peakHr) +
      "</div>" +
      '<div class="lv-hwrap"><div class="lv-hcap">Net sales by hour</div><div class="lv-bars">' + bars + "</div></div>" +
      "</div></div>";
  }

  hosts.forEach(function (host) {
    host.classList.add("appboard", "livedash");
    function kpi(label, val, ty, ly, id) {
      return '<div class="lv-kpi"><p class="lv-klabel">' + label + '</p><p class="lv-kval" data-k="' + id + '">' + val + "</p>" + pill(ty, ly, id) + "</div>";
    }
    var tkTy = CH.sales_ty / CH.cars_ty, tkLy = CH.sales_ly / CH.cars_ly;
    host.innerHTML =
      '<div class="lv-head"><span class="lv-dot"></span><span class="lv-today">Today, so far</span>' +
        '<span class="lv-asof"><span data-k="rep">' + CH.reporting + "</span> reporting &middot; as of <span data-k=\"asof\">" + asOf() + "</span></span></div>" +
      '<div class="lv-kpis">' +
        kpi("Net Sales", money(CH.sales_ty), CH.sales_ty, CH.sales_ly, "sales") +
        kpi("Cars", fmt(CH.cars_ty), CH.cars_ty, CH.cars_ly, "cars") +
        kpi("Ticket Average", money2(tkTy), tkTy, tkLy, "ticket") +
        kpi("Labor $", money(CH.labor_ty), CH.labor_ty, CH.labor_ly, "labor") +
      "</div>" +
      '<div class="lv-tblwrap"><div class="lv-tcap">Top stores &middot; live <span class="lv-hint">tap a store to drill in</span></div>' +
        '<table class="lv-tbl"><tbody>' +
        STORES.map(function (s, i) {
          return '<tr class="lv-row" data-row="' + i + '" tabindex="0" role="button" aria-expanded="false">' +
            '<td class="lv-store"><span class="lv-chev" aria-hidden="true">▸</span><span class="lv-num">#' + s.store + "</span> " + s.name + "</td>" +
            '<td class="lv-mono" data-r="' + i + 's">' + money(s.s) + "</td>" +
            '<td class="lv-mono lv-mute lv-hide">' + money(s.ls) + "</td>" +
            "<td>" + badge(s.s, s.ls, i + "sb") + "</td>" +
            '<td class="lv-mono lv-hide2" data-r="' + i + 'c">' + fmt(s.c) + "</td>" +
            "<td>" + badge(s.c, s.lc) + "</td></tr>" +
            '<tr class="lv-drow" data-detail="' + i + '"><td colspan="6">' + detailHTML(s, i) + "</td></tr>";
        }).join("") +
        "</tbody></table></div>";

    // click / keyboard to drill in (accordion, no navigation)
    function toggle(i) {
      var row = host.querySelector('.lv-row[data-row="' + i + '"]');
      var det = host.querySelector('.lv-drow[data-detail="' + i + '"]');
      var open = det.classList.contains("open");
      host.querySelectorAll(".lv-drow.open").forEach(function (d) { d.classList.remove("open"); });
      host.querySelectorAll('.lv-row[aria-expanded="true"]').forEach(function (r) { r.setAttribute("aria-expanded", "false"); });
      if (!open) { det.classList.add("open"); row.setAttribute("aria-expanded", "true"); }
    }
    host.querySelectorAll(".lv-row").forEach(function (row) {
      var i = row.getAttribute("data-row");
      row.addEventListener("click", function () { toggle(i); });
      row.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } });
    });

    if (reduce) return;
    var inView = true;
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); }); io.observe(host); }
    function setK(k, v) { var e = host.querySelector('[data-k="' + k + '"]'); if (e && e.textContent !== v) { e.textContent = v; flash(e); } }
    function setR(k, v) { var e = host.querySelector('[data-r="' + k + '"]'); if (e && e.textContent !== v) { e.textContent = v; flash(e); } }
    function setPill(id, ty, ly) { var e = host.querySelector('[data-d="' + id + '"]'); if (!e) return; var p = dpct(ty, ly), up = p >= 0; e.className = "lv-delta " + (up ? "up" : "down"); e.textContent = (up ? "▲" : "▼") + " " + Math.abs(p).toFixed(1) + "% vs LY"; }
    function setBadge(id, ty, ly) { var e = host.querySelector('[data-b="' + id + '"]'); if (!e) return; var p = dpct(ty, ly), up = p >= 0; e.className = "lv-badge " + (up ? "up" : "down"); e.textContent = (up ? "+" : "") + p.toFixed(1) + "%"; }
    function flash(e) { e.classList.remove("lv-flash"); void e.offsetWidth; e.classList.add("lv-flash"); }
    setInterval(function () {
      if (!inView) return;
      CH.sales_ty += 90 + Math.floor(rnd() * 360); CH.cars_ty += 2 + Math.floor(rnd() * 6); CH.labor_ty += 24 + Math.floor(rnd() * 90);
      var tk = CH.sales_ty / CH.cars_ty;
      setK("sales", money(CH.sales_ty)); setPill("sales", CH.sales_ty, CH.sales_ly);
      setK("cars", fmt(CH.cars_ty)); setPill("cars", CH.cars_ty, CH.cars_ly);
      setK("ticket", money2(tk)); setPill("ticket", tk, CH.sales_ly / CH.cars_ly);
      setK("labor", money(CH.labor_ty)); setPill("labor", CH.labor_ty, CH.labor_ly);
      var af = host.querySelector('[data-k="asof"]'); if (af) af.textContent = asOf();
      var i = Math.floor(rnd() * STORES.length), s = STORES[i];
      s.s += 18 + Math.floor(rnd() * 80); if (rnd() < 0.45) s.c += 1;
      setR(i + "s", money(s.s)); setR(i + "c", fmt(s.c)); setBadge(i + "sb", s.s, s.ls);
    }, 3200);
  });
})();
