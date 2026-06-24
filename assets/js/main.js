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
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-drawer a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
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
        metrics.style.opacity = "1";
      }, reduceMotion ? 0 : 180);
    }
  }
  indTabs.forEach(function (t) {
    t.addEventListener("click", function () { setIndustry(t.getAttribute("data-ind")); });
  });

  /* ---------- Contact form (front-end only, accessible validation) ---------- */
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
      var ok = form.querySelector(".form-success");
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

  /* ---------- Newsletter / lead capture (front-end only) ---------- */
  document.querySelectorAll(".lead-form").forEach(function (lf) {
    lf.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = lf.querySelector('input[type="email"]');
      var msg = lf.querySelector(".lead-msg");
      var v = input ? (input.value || "").trim() : "";
      var ok = /.+@.+\..+/.test(v);
      if (input) input.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) { if (input) input.focus(); return; }
      /* TODO: POST the email to your CRM / Formspree endpoint here to persist the lead. */
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
    var tiltEls = document.querySelectorAll(".hero-media .dash, .hero-media .report, .fr-media .shot, .fr-media .report");
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
