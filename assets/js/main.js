/* =============================================================
   myAnalyst, site interactions (vanilla, no dependencies)
   ============================================================= */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header shrink ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer (with focus management) ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".mobile-drawer");
  function setDrawerHidden(hidden) {
    if (!drawer) return;
    try { drawer.inert = hidden; } catch (e) { /* older browsers */ }
    drawer.setAttribute("aria-hidden", hidden ? "true" : "false");
  }
  function isDrawerOpen() { return document.body.classList.contains("nav-open"); }
  function closeDrawer(returnFocus) {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    setDrawerHidden(true);
    if (returnFocus && toggle) toggle.focus();
  }
  function openDrawer() {
    document.body.classList.add("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    setDrawerHidden(false);
    if (drawer) { var first = drawer.querySelector("a, button"); if (first) first.focus(); }
  }
  if (drawer) setDrawerHidden(true);
  if (toggle && drawer) {
    toggle.addEventListener("click", function () { if (isDrawerOpen()) closeDrawer(true); else openDrawer(); });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { closeDrawer(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (!isDrawerOpen()) return;
      if (e.key === "Escape") { closeDrawer(true); return; }
      if (e.key === "Tab") {
        var f = drawer.querySelectorAll("a, button");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Mark active nav link ---------- */
  // Normalize so it matches whether links are "pro.html" or pretty URLs ("/pro").
  function maNorm(u) { u = (u || "").split(/[?#]/)[0].replace(/\/+$/, ""); u = u.slice(u.lastIndexOf("/") + 1); return u.replace(/\.html$/, "") || "index"; }
  var path = maNorm(location.pathname);
  document.querySelectorAll(".nav-links a, .mobile-drawer a").forEach(function (a) {
    if (maNorm(a.getAttribute("href")) === path) a.classList.add("active");
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-scale");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var dur = 1400, start = null;
    if (reduceMotion) { el.textContent = format(target, decimals); return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(target, decimals);
    }
    requestAnimationFrame(step);
  }
  function format(n, d) {
    return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---------- Hero live KPI ticking ---------- */
  var tickEls = document.querySelectorAll("[data-tick]");
  if (tickEls.length && !reduceMotion) {
    setInterval(function () {
      tickEls.forEach(function (el) {
        var base = parseFloat(el.getAttribute("data-base"));
        var prefix = el.getAttribute("data-prefix") || "";
        var suffix = el.getAttribute("data-suffix") || "";
        var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var jitter = base * (0.004 + Math.random() * 0.012) * (Math.random() > 0.45 ? 1 : -1);
        var val = base + jitter;
        el.textContent = prefix + format(val, dec) + suffix;
      });
    }, 2200);
  }

  /* ---------- Signal alert reveal (hero) ---------- */
  var signal = document.querySelector(".signal-alert");
  if (signal) {
    setTimeout(function () { signal.classList.add("in"); }, reduceMotion ? 0 : 1100);
  }

  /* ---------- Signals phone demo (staggered) ---------- */
  var phone = document.querySelector(".phone");
  if (phone) {
    var msgs = phone.querySelectorAll(".sms");
    function playPhone() {
      msgs.forEach(function (m, i) {
        setTimeout(function () { m.classList.add("in"); }, reduceMotion ? 0 : i * 650);
      });
    }
    if ("IntersectionObserver" in window && !reduceMotion) {
      var po = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { playPhone(); po.unobserve(e.target); } });
      }, { threshold: 0.4 });
      po.observe(phone);
    } else { playPhone(); }
  }

  /* ---------- Industry morph ---------- */
  // Data: label/value/delta sets per industry.
  var INDUSTRIES = {
    autocare:    { name: "Auto Care", kpis: [["Avg Revenue / Order", "$78.40", "+6.2%", "up"], ["Car Count", "1,284", "+4.1%", "up"], ["Labor %", "27.6%", "-1.3%", "up"]], note: "ARO, car count, bay productivity, technician efficiency, and coupon ROI, the numbers quick-lube and repair operators actually run on." },
    carwash:     { name: "Car Wash", kpis: [["Wash Count", "9,420", "+7.8%", "up"], ["Membership Mix", "63%", "+3.4%", "up"], ["Revenue / Car", "$14.20", "+2.1%", "up"]], note: "Wash counts, unlimited-plan retention, capture rate, and chemical cost per car across every tunnel and site." },
    hospitality: { name: "Hospitality", kpis: [["RevPAR", "$112", "+5.0%", "up"], ["Occupancy", "81%", "+2.6%", "up"], ["Labor %", "31.2%", "-0.8%", "up"]], note: "RevPAR, occupancy, ADR, and labor across properties, consolidated nightly without chasing PMS exports." },
    qsr:         { name: "QSR / Fast Food", kpis: [["Avg Ticket", "$11.85", "+3.9%", "up"], ["Throughput", "92/hr", "+5.2%", "up"], ["Food Cost %", "29.4%", "-1.1%", "up"]], note: "Ticket, throughput, drive-thru times, food cost, and daypart performance across all stores in one view." },
    fitness:     { name: "Fitness", kpis: [["Active Members", "4,310", "+4.7%", "up"], ["Churn", "2.9%", "-0.6%", "up"], ["Rev / Member", "$48", "+2.2%", "up"]], note: "Membership growth, churn, check-ins, and revenue per member by club, with retention alerts." },
    retail:      { name: "Retail / C-Store", kpis: [["Basket Size", "$22.10", "+3.1%", "up"], ["Inside Sales", "$58.4K", "+6.0%", "up"], ["Margin %", "31.8%", "+0.9%", "up"]], note: "Inside sales, fuel margin, basket size, and shrink across every location and shift." },
    homeservices:{ name: "Home Services", kpis: [["Avg Job Value", "$612", "+8.3%", "up"], ["Close Rate", "47%", "+3.0%", "up"], ["Tech Revenue / Day", "$1,840", "+5.5%", "up"]], note: "Job value, close rate, tech utilization, and marketing ROI across crews and territories." }
  };
  // Per-industry trend shape (9 y-points on the 0..110 viewBox) so the chart
  // actually changes with the selector, not just the KPI numbers.
  var IND_SPARK = {
    autocare:     [82, 76, 80, 62, 66, 48, 52, 34, 38],
    carwash:      [88, 84, 78, 80, 66, 60, 50, 46, 34],
    hospitality:  [80, 74, 78, 64, 58, 62, 48, 44, 40],
    qsr:          [86, 82, 76, 72, 66, 58, 54, 44, 40],
    fitness:      [84, 80, 82, 70, 66, 56, 58, 46, 38],
    retail:       [82, 78, 74, 70, 64, 60, 54, 48, 42],
    homeservices: [90, 86, 80, 72, 62, 56, 46, 40, 30]
  };
  var IND_X = [0, 40, 80, 120, 160, 200, 240, 280, 320];
  function indPaths(ys) {
    var line = "M" + IND_X.map(function (x, i) { return x + "," + ys[i]; }).join(" L");
    return { line: line, area: line + " L320,110 L0,110 Z" };
  }
  var indTabs = document.querySelectorAll(".ind-tab");

  /* ARIA tab semantics + keyboard nav */
  var indTablist = document.querySelector(".ind-tabs");
  if (indTablist && indTabs.length) {
    indTablist.setAttribute("role", "tablist");
    indTablist.setAttribute("aria-label", "Industry");
    indTabs.forEach(function (t) {
      t.setAttribute("role", "tab");
      var active = t.classList.contains("active");
      t.setAttribute("aria-selected", active ? "true" : "false");
      t.tabIndex = active ? 0 : -1;
    });
    var liveRegion = document.querySelector(".ind-panel-metrics");
    if (liveRegion) { liveRegion.setAttribute("aria-live", "polite"); liveRegion.setAttribute("aria-atomic", "true"); }
    indTablist.addEventListener("keydown", function (e) {
      var arr = Array.prototype.slice.call(indTabs);
      var idx = arr.indexOf(document.activeElement);
      if (idx < 0) return;
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = arr[(idx + 1) % arr.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = arr[(idx - 1 + arr.length) % arr.length];
      else if (e.key === "Home") next = arr[0];
      else if (e.key === "End") next = arr[arr.length - 1];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  }

  function setIndustry(key) {
    var d = INDUSTRIES[key];
    if (!d) return;
    indTabs.forEach(function (t) {
      var sel = t.getAttribute("data-ind") === key;
      t.classList.toggle("active", sel);
      t.setAttribute("aria-selected", sel ? "true" : "false");
      t.tabIndex = sel ? 0 : -1;
    });
    var metrics = document.querySelector(".ind-panel-metrics");
    var noteEl = document.querySelector(".ind-note");
    if (metrics) {
      metrics.style.opacity = "0";
      setTimeout(function () {
        var bs = metrics.querySelectorAll(".b");
        d.kpis.forEach(function (k, i) {
          if (!bs[i]) return;
          bs[i].querySelector("small").textContent = k[0];
          bs[i].querySelector("strong").textContent = k[1];
          var dd = bs[i].querySelector(".d");
          dd.textContent = k[2];
          dd.className = "d " + k[3];
        });
        var titleEl = document.querySelector(".ind-title");
        if (titleEl) titleEl.textContent = d.name;
        if (noteEl) noteEl.textContent = d.note;
        // Redraw the trend chart for this industry
        var spark = IND_SPARK[key];
        var svg = metrics.parentElement ? metrics.parentElement.querySelector("svg") : null;
        if (svg && spark) {
          var ps = svg.querySelectorAll("path");
          var area = svg.querySelector(".ind-area") || ps[0];
          var line = svg.querySelector(".ind-line") || ps[1];
          var pth = indPaths(spark);
          if (area) area.setAttribute("d", pth.area);
          if (line) {
            line.setAttribute("d", pth.line);
            if (!reduceMotion && line.getTotalLength) {
              var len = line.getTotalLength();
              line.style.transition = "none";
              line.style.strokeDasharray = len;
              line.style.strokeDashoffset = len;
              line.getBoundingClientRect();
              line.style.transition = "stroke-dashoffset .85s cubic-bezier(.22,.61,.36,1)";
              line.style.strokeDashoffset = "0";
            }
          }
        }
        metrics.style.opacity = "1";
      }, reduceMotion ? 0 : 180);
    }
  }
  indTabs.forEach(function (t) {
    t.addEventListener("click", function () { setIndustry(t.getAttribute("data-ind")); });
  });

  /* ---------- Contact form (posts to Netlify Forms; accessible validation) ---------- */
  var form = document.querySelector(".demo-form");
  if (form) {
    var requiredEls = form.querySelectorAll("[required]");
    function fieldValid(el) {
      var v = (el.value || "").trim();
      if (!v) return false;
      if (el.type === "email") return /.+@.+\..+/.test(v);
      return true;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.parentNode.querySelector(".form-success") || document.querySelector(".form-success");
      var invalid = [];
      requiredEls.forEach(function (el) {
        var valid = fieldValid(el);
        el.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) invalid.push(el);
      });
      if (invalid.length) {
        if (ok) ok.style.display = "none";
        invalid[0].focus();
        return;
      }
      // Post to Netlify Forms (read the data before we clear the fields). Local/offline
      // posts simply fail and are ignored — the inline success still shows.
      // Netlify STRIPS the data-netlify attribute on deploy, so detect the form by
      // its hidden form-name field (which survives) and POST to "/" — Netlify routes
      // the submission by the form-name in the body, not the path.
      if (form.querySelector('input[name="form-name"]')) {
        var payload = new URLSearchParams(new FormData(form)).toString();
        fetch(form.getAttribute("action") || "/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload
        }).catch(function () {});
      }
      if (ok) { ok.style.display = "block"; }
      form.querySelectorAll("input,select,textarea").forEach(function (el) {
        if (el.type !== "submit") el.value = "";
      });
      if (ok) ok.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
    requiredEls.forEach(function (el) {
      el.addEventListener("input", function () { if (fieldValid(el)) el.setAttribute("aria-invalid", "false"); });
      el.addEventListener("change", function () { if (fieldValid(el)) el.setAttribute("aria-invalid", "false"); });
    });
  }

  /* ---------- Newsletter / lead capture (Netlify-ready; opt in per form) ---------- */
  document.querySelectorAll(".lead-form").forEach(function (lf) {
    lf.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = lf.querySelector('input[type="email"]');
      var msg = lf.querySelector(".lead-msg");
      var v = input ? (input.value || "").trim() : "";
      var ok = /.+@.+\..+/.test(v);
      if (input) input.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) { if (input) input.focus(); return; }
      // Post to Netlify Forms when the form opts in (add name + data-netlify + a hidden
      // form-name field to the footer form to enable site-wide newsletter capture).
      if (lf.querySelector('input[name="form-name"]')) {
        var leadBody = new URLSearchParams(new FormData(lf)).toString();
        fetch(lf.getAttribute("action") || "/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: leadBody
        }).catch(function () {});
      }
      if (msg) msg.style.display = "block";
      lf.querySelectorAll("input").forEach(function (el) { el.value = ""; });
    });
  });

  /* ---------- Cookie consent (stores choice; analytics only after Accept) ---------- */
  (function () {
    var KEY = "ma_consent", choice = null;
    function enableAnalytics() { /* Drop your analytics snippet (GA4 / Plausible / etc.) here, loads only after consent. */ }
    try { choice = localStorage.getItem(KEY); } catch (e) {}
    if (choice) { if (choice === "accept") enableAnalytics(); return; }
    var bar = document.createElement("div");
    bar.className = "cookie-bar";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookie consent");
    bar.innerHTML = '<p>We use cookies to improve your experience and measure site traffic. See our <a href="privacy.html">privacy notice</a>.</p>' +
      '<div class="cb-actions"><button class="btn btn-ghost" type="button" data-cc="decline">Decline</button>' +
      '<button class="btn btn-primary" type="button" data-cc="accept">Accept</button></div>';
    function decide(v) { try { localStorage.setItem(KEY, v); } catch (e) {} bar.remove(); if (v === "accept") enableAnalytics(); }
    bar.addEventListener("click", function (e) { var b = e.target.closest("[data-cc]"); if (b) decide(b.getAttribute("data-cc")); });
    document.body.appendChild(bar);
  })();

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ============================================================
     Motion / "wow" effects (all gated by reduced-motion)
     ============================================================ */
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Spatial background field (orbs + bounded scroll parallax) ---------- */
  (function () {
    var field = document.createElement("div");
    field.className = "bg-field";
    field.setAttribute("aria-hidden", "true");
    var defs = [["o1", 1], ["o2", -1.2], ["o3", 1.5], ["o4", -1.3]];
    var wraps = [];
    defs.forEach(function (d) {
      var w = document.createElement("div"); w.className = "orb-wrap";
      var o = document.createElement("div"); o.className = "orb " + d[0];
      w.appendChild(o); field.appendChild(w);
      wraps.push({ el: w, f: d[1] });
    });
    document.body.appendChild(field);
    if (reduceMotion) return;
    var tick = false;
    function update() {
      tick = false;
      var h = document.documentElement;
      var denom = (h.scrollHeight - h.clientHeight) || 1;
      var prog = (h.scrollTop || window.scrollY || 0) / denom; // 0..1
      wraps.forEach(function (w) {
        w.el.style.transform = "translate3d(0," + ((prog - 0.5) * 230 * w.f).toFixed(1) + "px,0)";
      });
    }
    window.addEventListener("scroll", function () {
      if (!tick) { tick = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------- Scroll progress bar ---------- */
  if (!reduceMotion) {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var barTick = false;
    function updateBar() {
      barTick = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var st = h.scrollTop || window.scrollY || 0;
      bar.style.width = (max > 0 ? (st / max) * 100 : 0).toFixed(2) + "%";
    }
    window.addEventListener("scroll", function () {
      if (!barTick) { barTick = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- Cursor spotlight on cards ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".card, .persona").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Subtle 3D tilt on product frames ---------- */
  if (!reduceMotion && finePointer) {
    var tiltEls = document.querySelectorAll(".hero-media .dash, .hero-media .report, .hero-media .appshot, .fr-media .shot, .fr-media .report");
    tiltEls.forEach(function (el) {
      var raf = null, lastE = null;
      el.addEventListener("pointermove", function (e) {
        lastE = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var px = (lastE.clientX - r.left) / r.width - 0.5;
          var py = (lastE.clientY - r.top) / r.height - 0.5;
          var max = 5;
          el.style.transform = "rotateY(" + (px * max).toFixed(2) + "deg) rotateX(" + (-py * max).toFixed(2) + "deg)";
        });
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Auto-stagger reveal children ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.slice.call(group.children).forEach(function (child, i) {
      if (child.classList.contains("reveal") || child.classList.contains("reveal-scale")) {
        child.style.transitionDelay = (i * 0.06).toFixed(2) + "s";
      }
    });
  });

  /* ---------- Cinematic headline word reveal ---------- */
  if (!reduceMotion) {
    var heads = document.querySelectorAll(".hero h1, .page-hero h1");
    if (heads.length) {
      var splitWords = function (el) {
        if (el.getAttribute("data-split")) return;
        el.setAttribute("data-split", "1");
        var nodes = Array.prototype.slice.call(el.childNodes);
        el.textContent = "";
        nodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent.split(/(\s+)/).forEach(function (part) {
              if (part === "") return;
              if (!part.trim()) { el.appendChild(document.createTextNode(part)); return; }
              var w = document.createElement("span"); w.className = "w";
              var wi = document.createElement("span"); wi.className = "wi"; wi.textContent = part;
              w.appendChild(wi); el.appendChild(w);
            });
          } else if (node.nodeType === 1 && node.tagName === "BR") {
            el.appendChild(node);
          } else if (node.nodeType === 1) {
            node.classList.add("wi");
            var w2 = document.createElement("span"); w2.className = "w";
            w2.appendChild(node); el.appendChild(w2);
          } else { el.appendChild(node); }
        });
        el.querySelectorAll(".wi").forEach(function (wi, i) { wi.style.transitionDelay = (i * 0.05).toFixed(2) + "s"; });
        el.classList.add("reveal-words");
      };
      heads.forEach(splitWords);
      if ("IntersectionObserver" in window) {
        var hw = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); hw.unobserve(e.target); } });
        }, { threshold: 0 });
        heads.forEach(function (h) { hw.observe(h); });
      } else { heads.forEach(function (h) { h.classList.add("in"); }); }
    }
  }

  /* ---------- Charts draw themselves in on scroll ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var drawMock = function (container) {
      container.querySelectorAll('svg path[fill="none"]').forEach(function (path) {
        try {
          var len = path.getTotalLength();
          if (!len || len < 60) return;
          path.style.transition = "none";
          path.style.strokeDasharray = len;
          path.style.strokeDashoffset = len;
          path.getBoundingClientRect();
          path.style.transition = "stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)";
          path.style.strokeDashoffset = "0";
        } catch (e) {}
      });
    };
    var dm = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { drawMock(e.target); dm.unobserve(e.target); } });
    }, { threshold: 0.3 });
    document.querySelectorAll(".dash, .shot, .report").forEach(function (m) { dm.observe(m); });
  }

})();

/* ============================================================
   Interactive ROI calculator ([data-roi])
   ============================================================ */
(function () {
  "use strict";
  var hosts = document.querySelectorAll("[data-roi]");
  if (!hosts.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PER = 2600; // $/location/yr, client-reported avg recovery (labor, voids, discount leakage)
  function money(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
  hosts.forEach(function (host) {
    host.classList.add("roi");
    host.innerHTML =
      '<div class="roi-grid"><div class="roi-control">' +
        '<h3>What could myAnalyst recover for you?</h3>' +
        '<p class="lead" style="margin:.5rem 0 1.4rem;font-size:1rem">Drag to your number of locations. Estimated from client-reported recovery of labor, voids, and discount leakage.</p>' +
        '<div class="roi-loclabel"><label for="roiRange">Locations</label><span class="n" data-loc>12</span></div>' +
        '<input id="roiRange" type="range" min="2" max="250" value="12" step="1" aria-label="Number of locations" />' +
        '<div class="roi-ticks"><span>2</span><span>250+</span></div>' +
      '</div><div class="roi-result">' +
        '<div class="roi-amount-label">Estimated annual recovery</div>' +
        '<div class="roi-amount" data-amount>$0</div>' +
        '<div class="roi-row"><div class="b"><strong data-month>$0</strong><small>per month</small></div><div class="b"><strong>~10x</strong><small>avg client ROI</small></div></div>' +
        '<p class="roi-note">Illustrative estimate, not a guarantee. We size it on your real numbers in a demo.</p>' +
        '<a href="contact.html" class="btn btn-amber" style="margin-top:1rem">See your number</a>' +
      '</div></div>';
    var range = host.querySelector("input"), locEl = host.querySelector("[data-loc]"),
        amtEl = host.querySelector("[data-amount]"), moEl = host.querySelector("[data-month]");
    function paintTrack(){ var p=(range.value-range.min)/(range.max-range.min)*100; range.style.background="linear-gradient(90deg,var(--teal) "+p+"%,var(--bg-3) "+p+"%)"; }
    function setNow(){ var loc=+range.value; locEl.textContent=loc+(loc>=250?"+":""); var yr=loc*PER; amtEl.textContent=money(yr); moEl.textContent=money(yr/12); paintTrack(); }
    function animateTo(){ var loc=+range.value; locEl.textContent=loc+(loc>=250?"+":""); var yr=loc*PER; paintTrack();
      if(reduce){ amtEl.textContent=money(yr); moEl.textContent=money(yr/12); return; }
      var start=null,dur=900; function step(ts){ if(start===null)start=ts; var k=Math.min((ts-start)/dur,1); var e=1-Math.pow(1-k,3); amtEl.textContent=money(yr*e); moEl.textContent=money(yr/12*e); if(k<1)requestAnimationFrame(step); } requestAnimationFrame(step); }
    range.addEventListener("input", setNow);
    if (!reduce && "IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ animateTo(); io.unobserve(e.target); } }); },{threshold:.4});
      io.observe(host);
    }
    setNow();
  });
})();
