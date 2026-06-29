/* =============================================================
   myAnalyst — hero "living operations network"
   Paints a slow, premium constellation of locations (with the odd
   amber "signal" flare) behind the headline on #hero.hero-cinema.
   Purely a backdrop: it never blocks scrolling or interaction, and
   it's disabled under reduced-motion.
   ============================================================= */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  if (!hero || !hero.classList.contains("hero-cinema")) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- "opens from glass" dashboard reveal ----------
     Publishes scroll progress as --rv (0 = full glass / stretched,
     1 = settled, crisp, functional board). Not pinned: the page scrolls
     normally and the board is always reachable & interactive.
     QA: append ?rv=0.5 to freeze a progress for screenshots. */
  (function () {
    var reveal = hero.querySelector("[data-hero-reveal]");
    if (!reveal) return;
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function setRv(v) { hero.style.setProperty("--rv", v.toFixed(4)); }

    var forced = null;
    try {
      var qp = new URLSearchParams(window.location.search);
      if (qp.has("rv")) forced = clamp01(parseFloat(qp.get("rv")) || 0);
    } catch (e) {}

    if (reduce) { setRv(1); }
    else if (forced !== null) { setRv(forced); }
    else {
      var ticking = false;
      var update = function () {
        ticking = false;
        // Fully clear & usable by the time the board's center reaches the
        // upper-middle of the viewport (i.e. when it's centered on screen).
        var vh = window.innerHeight || 1;
        var rect = reveal.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        setRv(clamp01((vh - center) / (vh * 0.42)));
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }
  })();

  var canvas = hero.querySelector(".hero-net");
  if (!canvas || !canvas.getContext || reduce) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, nodes = [], raf = null, running = false, t0 = 0, lastDraw = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    W = hero.clientWidth;
    H = hero.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(12, Math.min(26, Math.round(W / 64)));
    var cols = Math.max(2, Math.ceil(Math.sqrt(count * (W / Math.max(H, 1)))));
    var rows = Math.ceil(count / cols);
    nodes = [];
    var i = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (i >= count) break;
        var cellW = W / cols, cellH = H / rows;
        var x = (c + 0.5) * cellW + rand(-cellW * 0.32, cellW * 0.32);
        var y = (r + 0.5) * cellH + rand(-cellH * 0.32, cellH * 0.32);
        nodes.push({
          bx: x, by: y, x: x, y: y,
          ph: rand(0, Math.PI * 2),
          sp: rand(0.00035, 0.00095),
          amp: rand(7, 18),
          rad: rand(1.6, 3.1),
          hot: 0,
          hotAt: rand(1600, 14000),
          hue: Math.random() < 0.2 ? "amber" : "teal"
        });
        i++;
      }
    }
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (ts - lastDraw < 32) return; // ~30fps cap — ambient backdrop, halves canvas CPU
    lastDraw = ts;
    if (!t0) t0 = ts;
    var t = ts - t0;
    ctx.clearRect(0, 0, W, H);

    var n, i;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.x = n.bx + Math.cos(n.ph + t * n.sp) * n.amp;
      n.y = n.by + Math.sin(n.ph * 1.3 + t * n.sp * 0.9) * n.amp * 0.66;
      if (t > n.hotAt) { n.hot = 1; n.hotAt = t + rand(7000, 19000); }
      if (n.hot > 0) n.hot = Math.max(0, n.hot - 0.011);
    }

    // edges between nearby locations
    var maxD = Math.min(W, H) * 0.16 + 64;
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          var al = (1 - d / maxD) * 0.16;
          ctx.strokeStyle = "rgba(21,169,140," + al.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // location nodes + signal flares
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var hotAmber = n.hue === "amber" && n.hot > 0.02;
      var rr = n.rad + n.hot * 3.4;

      if (n.hot > 0.02) {
        var ringR = rr + (1 - n.hot) * 26;
        ctx.beginPath();
        ctx.strokeStyle = hotAmber
          ? "rgba(252,176,65," + (n.hot * 0.5).toFixed(3) + ")"
          : "rgba(21,169,140," + (n.hot * 0.45).toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      if (hotAmber) {
        ctx.fillStyle = "rgba(252,176,65," + (0.55 + n.hot * 0.45).toFixed(3) + ")";
        ctx.shadowColor = "rgba(252,176,65,0.85)";
        ctx.shadowBlur = 16;
      } else {
        ctx.fillStyle = "rgba(21,169,140," + (0.62 + n.hot * 0.38).toFixed(3) + ")";
        ctx.shadowColor = "rgba(21,169,140,0.6)";
        ctx.shadowBlur = n.hot > 0.02 ? 14 : 8;
      }
      ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

  }

  function start() { if (running) return; running = true; t0 = 0; lastDraw = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  build();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0 });
    io.observe(hero);
  } else {
    start();
  }

  var rt = false;
  window.addEventListener("resize", function () {
    if (!rt) { rt = true; requestAnimationFrame(function () { rt = false; build(); }); }
  }, { passive: true });
})();
