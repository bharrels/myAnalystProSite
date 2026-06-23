/* =============================================================
   myAnalyst — site interactions (vanilla, no dependencies)
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

  /* ---------- Mobile drawer ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
      var open = document.body.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".mobile-drawer a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
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
    autocare:    { name: "Auto Care", kpis: [["Avg Revenue / Order", "$78.40", "+6.2%", "up"], ["Car Count", "1,284", "+4.1%", "up"], ["Labor %", "27.6%", "-1.3%", "up"]], note: "ARO, car count, bay productivity, technician efficiency, and coupon ROI — the numbers quick-lube and repair operators actually run on." },
    carwash:     { name: "Car Wash", kpis: [["Wash Count", "9,420", "+7.8%", "up"], ["Membership Mix", "63%", "+3.4%", "up"], ["Revenue / Car", "$14.20", "+2.1%", "up"]], note: "Wash counts, unlimited-plan retention, capture rate, and chemical cost per car across every tunnel and site." },
    hospitality: { name: "Hospitality", kpis: [["RevPAR", "$112", "+5.0%", "up"], ["Occupancy", "81%", "+2.6%", "up"], ["Labor %", "31.2%", "-0.8%", "up"]], note: "RevPAR, occupancy, ADR, and labor across properties — consolidated nightly without chasing PMS exports." },
    qsr:         { name: "QSR / Fast Food", kpis: [["Avg Ticket", "$11.85", "+3.9%", "up"], ["Throughput", "92/hr", "+5.2%", "up"], ["Food Cost %", "29.4%", "-1.1%", "up"]], note: "Ticket, throughput, drive-thru times, food cost, and daypart performance across all stores in one view." },
    fitness:     { name: "Fitness", kpis: [["Active Members", "4,310", "+4.7%", "up"], ["Churn", "2.9%", "-0.6%", "up"], ["Rev / Member", "$48", "+2.2%", "up"]], note: "Membership growth, churn, check-ins, and revenue per member by club, with retention alerts." },
    retail:      { name: "Retail / C-Store", kpis: [["Basket Size", "$22.10", "+3.1%", "up"], ["Inside Sales", "$58.4K", "+6.0%", "up"], ["Margin %", "31.8%", "+0.9%", "up"]], note: "Inside sales, fuel margin, basket size, and shrink across every location and shift." },
    homeservices:{ name: "Home Services", kpis: [["Avg Job Value", "$612", "+8.3%", "up"], ["Close Rate", "47%", "+3.0%", "up"], ["Tech Revenue / Day", "$1,840", "+5.5%", "up"]], note: "Job value, close rate, tech utilization, and marketing ROI across crews and territories." }
  };
  var indTabs = document.querySelectorAll(".ind-tab");
  function setIndustry(key) {
    var d = INDUSTRIES[key];
    if (!d) return;
    indTabs.forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-ind") === key); });
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

  /* ---------- Contact form (front-end only) ---------- */
  var form = document.querySelector(".demo-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.querySelector(".form-success");
      if (ok) { ok.style.display = "block"; }
      form.querySelectorAll("input,select,textarea,button").forEach(function (el) {
        if (el.type !== "submit" && !el.classList.contains("btn")) el.value = "";
      });
      if (ok) ok.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
