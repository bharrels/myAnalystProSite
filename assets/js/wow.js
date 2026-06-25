/* =============================================================
   myAnalyst — "wow" layer (loaded sitewide after main.js)
   1) ⌘K command palette  2) confetti on form success  3) live ops map
   ============================================================= */

/* ---------- 1) ⌘K command palette ---------- */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEST = [
    { l: "Home", u: "index.html", k: "overview start" },
    { l: "Platform", u: "platform.html", k: "livestats store health pacing map retention reports" },
    { l: "myAnalyst Pro", u: "pro.html", k: "ai analyst briefing consultant" },
    { l: "Add-ons", u: "add-ons.html", k: "signals mapping data pipelines" },
    { l: "Integrations", u: "integrations.html", k: "pos quickbooks adp connect stack data stream" },
    { l: "Industries", u: "industries.html", k: "auto care car wash qsr fitness retail hospitality" },
    { l: "Customers", u: "customers.html", k: "case studies proof testimonials" },
    { l: "Built for every role", u: "roles.html", k: "vp regional district store manager" },
    { l: "Resources", u: "resources.html", k: "guides glossary faq" },
    { l: "Pricing", u: "pricing.html", k: "cost plans tiers" },
    { l: "LiveStats", u: "livestats.html", k: "real time live sales cars labor 5 minutes" },
    { l: "Store Health score", u: "store-health-score.html", k: "grade pillars 0 to 100" },
    { l: "Pacing & Forecast", u: "pacing-forecast.html", k: "budget projection shape adjusted ahead behind" },
    { l: "Geospatial Map", u: "geospatial-map.html", k: "heatmap drive time isochrone trade area guest origin" },
    { l: "Retention", u: "retention.html", k: "lifecycle rfm clv churn win back due for service" },
    { l: "myAnalyst vs. BI", u: "compare-myanalyst-vs-bi.html", k: "power bi tableau spreadsheets compare" },
    { l: "FAQ", u: "faq.html", k: "questions answers" },
    { l: "Glossary", u: "glossary.html", k: "terms definitions" },
    { l: "About", u: "about.html", k: "company team sitetech systems" },
    { l: "Book a demo", u: "contact.html", k: "contact sales call schedule" },
    { l: "See a sample report", u: "customers.html#sample", k: "example briefing live" }
  ];
  var root = document.createElement("div");
  root.className = "cmdk"; root.hidden = true;
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Search and navigate");
  root.innerHTML =
    '<div class="cmdk-scrim" data-cmdk-close></div>' +
    '<div class="cmdk-panel">' +
      '<div class="cmdk-top"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '<input type="text" class="cmdk-input" placeholder="Search pages, jump anywhere…" aria-label="Search" autocomplete="off" spellcheck="false" />' +
        '<kbd class="cmdk-esc">esc</kbd></div>' +
      '<ul class="cmdk-list" role="listbox"></ul>' +
      '<div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span class="cmdk-brand">myAnalyst</span></div>' +
    '</div>';
  document.body.appendChild(root);
  var input = root.querySelector(".cmdk-input"), list = root.querySelector(".cmdk-list");
  var sel = 0, filtered = DEST.slice(), lastFocus = null;
  function render() {
    list.innerHTML = "";
    filtered.forEach(function (d, i) {
      var li = document.createElement("li");
      li.className = "cmdk-item" + (i === sel ? " on" : ""); li.setAttribute("role", "option");
      li.innerHTML = '<span class="ci-l">' + d.l + '</span><span class="ci-go">↵</span>';
      li.addEventListener("click", function () { go(d.u); });
      li.addEventListener("mousemove", function () { if (sel !== i) { sel = i; paint(); } });
      list.appendChild(li);
    });
    if (!filtered.length) { var e = document.createElement("li"); e.className = "cmdk-empty"; e.textContent = "No matches"; list.appendChild(e); }
  }
  function items() { return list.querySelectorAll(".cmdk-item"); }
  function paint() { var its = items(); Array.prototype.forEach.call(its, function (li, i) { li.classList.toggle("on", i === sel); }); if (its[sel]) its[sel].scrollIntoView({ block: "nearest" }); }
  function filter(q) { q = (q || "").trim().toLowerCase(); filtered = !q ? DEST.slice() : DEST.filter(function (d) { return (d.l + " " + d.k).toLowerCase().indexOf(q) >= 0; }); sel = 0; render(); }
  function open() { if (!root.hidden) return; lastFocus = document.activeElement; root.hidden = false; document.body.classList.add("cmdk-open"); input.value = ""; filter(""); requestAnimationFrame(function () { root.classList.add("show"); input.focus(); }); }
  function close() { root.classList.remove("show"); document.body.classList.remove("cmdk-open"); var done = function () { root.hidden = true; }; if (reduce) done(); else setTimeout(done, 240); if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } }
  function go(u) { close(); window.location.href = u; }
  input.addEventListener("input", function () { filter(input.value); });
  root.addEventListener("click", function (e) { if (e.target.hasAttribute("data-cmdk-close")) close(); });
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); }
    else if (e.key === "Enter") { e.preventDefault(); var d = filtered[sel]; if (d) go(d.u); }
  });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); if (root.hidden) open(); else close(); }
    else if (k === "/" && root.hidden) { var t = (e.target.tagName || ""); if (t === "INPUT" || t === "TEXTAREA" || e.target.isContentEditable) return; e.preventDefault(); open(); }
  });
  render();
  try { if (new URLSearchParams(window.location.search).has("cmdk")) requestAnimationFrame(open); } catch (e) {}
  var navcta = document.querySelector(".nav-cta");
  if (navcta) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "cmdk-launch"; btn.setAttribute("aria-label", "Search the site (Control or Command + K)");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><kbd>⌘K</kbd>';
    btn.addEventListener("click", open);
    navcta.insertBefore(btn, navcta.firstChild);
  }
})();

/* ---------- 2) brand confetti on successful demo / lead submit ---------- */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var COLORS = ["#15a98c", "#2dd4b0", "#fcb041", "#e12a56", "#3d7ff2"];
  function burst(x, y) {
    var cv = document.createElement("canvas");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr;
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998";
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    var P = [];
    for (var i = 0; i < 130; i++) {
      var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
      P.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, g: 0.22 + Math.random() * 0.12, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5, c: COLORS[(Math.random() * COLORS.length) | 0] });
    }
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts; var e = (ts - t0) / 1000; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var alive = false;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
        var life = Math.max(0, 1 - e / 1.8);
        if (life > 0 && p.y < window.innerHeight + 40) { alive = true; ctx.save(); ctx.globalAlpha = life; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore(); }
      }
      if (alive) requestAnimationFrame(step); else cv.remove();
    }
    requestAnimationFrame(step);
  }
  function at(el) { var r = el ? el.getBoundingClientRect() : null; return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 3 }; }
  document.querySelectorAll(".demo-form").forEach(function (f) {
    f.addEventListener("submit", function () { var ok = f.querySelector(".form-success"); setTimeout(function () { if (ok && getComputedStyle(ok).display !== "none") { var p = at(ok); burst(p.x, p.y); } }, 0); });
  });
  document.querySelectorAll(".lead-form").forEach(function (f) {
    f.addEventListener("submit", function () { var ok = f.querySelector(".lead-msg"); setTimeout(function () { if (ok && getComputedStyle(ok).display !== "none") { var p = at(f.querySelector("button") || f); burst(p.x, p.y); } }, 0); });
  });
})();
