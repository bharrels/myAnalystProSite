/* =============================================================
   Signature "Signal story" — a scroll-triggered, cinematic demo of
   the myAnalyst loop: a store slips (score ring drains green->red),
   an SMS Signal fires to the right person, the store recovers, and
   dollars saved count up. Faithful light tokens, reduced-motion safe.
   Builds into [data-signalstory].
   ============================================================= */
(function () {
  "use strict";
  var host = document.querySelector("[data-signalstory]");
  if (!host) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tone(s) { return s >= 85 ? "#1dac92" : s >= 70 ? "#15a98c" : s >= 55 ? "#3d7ff2" : s >= 40 ? "#fcb041" : "#e12a56"; }
  function grade(s) { return s >= 85 ? "A" : s >= 70 ? "B" : s >= 55 ? "C" : s >= 40 ? "D" : "F"; }

  var SIZE = 168, STROKE = 13, R = (SIZE - STROKE) / 2, C = 2 * Math.PI * R;

  host.classList.add("appboard");
  host.innerHTML =
    '<div class="ss-grid">' +
      '<div class="ss-card" data-ss-card>' +
        '<div class="ss-chead"><div><div class="ss-name">Georgetown</div><div class="ss-sub">#4789 &middot; Dana Ruiz, DM</div></div>' +
          '<span class="ss-status" data-ss-status>Healthy</span></div>' +
        '<div class="ss-ringwrap"><svg width="' + SIZE + '" height="' + SIZE + '" viewBox="0 0 ' + SIZE + ' ' + SIZE + '">' +
          '<circle cx="' + SIZE / 2 + '" cy="' + SIZE / 2 + '" r="' + R + '" fill="none" stroke="#f0efec" stroke-width="' + STROKE + '"/>' +
          '<circle data-ss-arc transform="rotate(-90 ' + SIZE / 2 + ' ' + SIZE / 2 + ')" cx="' + SIZE / 2 + '" cy="' + SIZE / 2 + '" r="' + R + '" fill="none" stroke="#1dac92" stroke-width="' + STROKE + '" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="0"/>' +
          '</svg><div class="ss-ringc"><span class="ss-grade" data-ss-grade>A</span><span class="ss-score" data-ss-score>92</span></div></div>' +
        '<div class="ss-pillars">' +
          pillarRow("Budget pace", "pace") + pillarRow("Bay speed", "speed") + pillarRow("Reviews", "rev") +
        '</div>' +
        '<div class="ss-cap" data-ss-cap><span class="ss-cap-dot"></span>9:00 AM &middot; on plan</div>' +
      '</div>' +
      '<div class="ss-phone" aria-hidden="true">' +
        '<div class="ss-phone-top"><span class="ss-phone-ear"></span></div>' +
        '<div class="ss-phone-hd"><span class="ss-ava">mA</span><div><div class="ss-from">myAnalyst Signals</div><div class="ss-pres">texts the right person, automatically</div></div></div>' +
        '<div class="ss-feed" data-ss-feed></div>' +
      '</div>' +
    '</div>' +
    '<div class="ss-outcome" data-ss-outcome>' +
      '<div class="ss-out-row"><span class="ss-check">✓</span><span class="ss-out-text" data-ss-outtext>Caught and fixed the same afternoon</span>' +
      '<span class="ss-out-stat"><span data-ss-saved>$0</span> <em>recovered today</em></span></div>' +
    '</div>';

  function pillarRow(label, key) {
    return '<div class="ss-prow"><span class="ss-plabel">' + label + '</span>' +
      '<span class="ss-ptrack"><span class="ss-pfill" data-ss-p="' + key + '"></span></span></div>';
  }

  var arc = host.querySelector("[data-ss-arc]");
  var gradeEl = host.querySelector("[data-ss-grade]");
  var scoreEl = host.querySelector("[data-ss-score]");
  var statusEl = host.querySelector("[data-ss-status]");
  var capEl = host.querySelector("[data-ss-cap]");
  var feed = host.querySelector("[data-ss-feed]");
  var card = host.querySelector("[data-ss-card]");
  var savedEl = host.querySelector("[data-ss-saved]");
  var outcome = host.querySelector("[data-ss-outcome]");
  var pf = { pace: host.querySelector('[data-ss-p="pace"]'), speed: host.querySelector('[data-ss-p="speed"]'), rev: host.querySelector('[data-ss-p="rev"]') };

  function setRing(s) {
    var t = tone(s);
    arc.setAttribute("stroke", t);
    arc.setAttribute("stroke-dashoffset", C * (1 - s / 100));
    gradeEl.textContent = grade(s); gradeEl.style.color = t;
    scoreEl.textContent = Math.round(s);
  }
  function setStatus(label, kind) { statusEl.textContent = label; statusEl.className = "ss-status " + kind; }
  function setCap(html) { capEl.innerHTML = '<span class="ss-cap-dot"></span>' + html; }
  function setPillars(p, sp, rv) { pf.pace.style.width = p + "%"; pf.speed.style.width = sp + "%"; pf.rev.style.width = rv + "%"; pf.pace.style.background = tone(p); pf.speed.style.background = tone(sp); pf.rev.style.background = tone(rv); }
  function bubble(kind, html, meta) {
    var b = document.createElement("div");
    b.className = "ss-bubble " + kind;
    b.innerHTML = html + (meta ? '<span class="ss-meta">' + meta + "</span>" : "");
    feed.appendChild(b); return b;
  }
  function typing() {
    var t = document.createElement("div");
    t.className = "ss-bubble in ss-typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    feed.appendChild(t); return t;
  }

  var raf;
  function animateValue(from, to, dur, cb, done) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      cb(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(step); else if (done) done();
    }
    raf = requestAnimationFrame(step);
  }

  // FINAL/static composite (reduced motion or fallback)
  function showFinal() {
    setRing(84); setStatus("Recovered", "good"); setCap("2:30 PM &middot; back on plan");
    setPillars(86, 80, 78);
    feed.innerHTML = "";
    bubble("in", "<b>Signal &middot; Georgetown #4789</b>Pacing 18% behind budget at 11:02 AM. Likely cause: bay wait time. Suggested fix inside.", "to Dana Ruiz, DM &middot; 11:03 AM");
    bubble("out", "On it. Re-staffed bay 2 and cleared the queue.", "11:09 AM");
    savedEl.textContent = "$3,420"; outcome.classList.add("show");
  }

  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function run() {
    clearTimers();
    // reset
    setRing(92); setStatus("Healthy", "good"); setCap("9:00 AM &middot; on plan");
    setPillars(90, 88, 84); feed.innerHTML = ""; savedEl.textContent = "$0"; outcome.classList.remove("show");
    card.classList.remove("alert");

    // BEAT 1: the slip
    at(1000, function () {
      card.classList.add("alert");
      setStatus("Slipping", "warn");
      setCap("11:02 AM &middot; pace slips 18% behind budget");
      animateValue(92, 38, 1500, function (v) { setRing(v); });
      pf.pace.style.width = "34%"; pf.pace.style.background = tone(34);
      pf.speed.style.width = "44%"; pf.speed.style.background = tone(44);
    });

    // BEAT 2: the signal fires
    at(2900, function () { var t = typing(); timers.push(setTimeout(function () { t.remove(); }, 1100)); });
    at(4050, function () {
      bubble("in", "<b>Signal &middot; Georgetown #4789</b>Pacing 18% behind budget at 11:02 AM. Likely cause: bay wait time. Suggested fix inside.", "to Dana Ruiz, DM &middot; 11:03 AM");
    });
    at(5200, function () { var t = typing(); timers.push(setTimeout(function () { t.remove(); }, 1000)); });
    at(6200, function () { bubble("out", "On it. Re-staffed bay 2 and cleared the queue.", "11:09 AM"); });

    // BEAT 3: recovery
    at(7000, function () {
      card.classList.remove("alert"); card.classList.add("recover");
      setStatus("Recovering", "info");
      setCap("1:15 PM &middot; climbing back");
      animateValue(38, 84, 1700, function (v) { setRing(v); }, function () { setStatus("Recovered", "good"); setCap("2:30 PM &middot; back on plan"); card.classList.remove("recover"); });
      animateValue(34, 86, 1700, function (v) { pf.pace.style.width = v + "%"; pf.pace.style.background = tone(v); });
      animateValue(44, 80, 1700, function (v) { pf.speed.style.width = v + "%"; pf.speed.style.background = tone(v); });
    });

    // BEAT 4: dollars saved
    at(9000, function () {
      outcome.classList.add("show");
      animateValue(0, 3420, 1400, function (v) { savedEl.textContent = "$" + Math.round(v).toLocaleString("en-US"); });
    });
  }

  if (reduce) { showFinal(); return; }

  // initial visual state before play
  setRing(92); setPillars(90, 88, 84);
  var played = false, io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !played) { played = true; run(); }
      else if (!e.isIntersecting && e.boundingClientRect.top > 0) { played = false; clearTimers(); /* allow replay when scrolled back up to it */ }
    });
  }, { threshold: 0.45 });
  io.observe(host);

  // let visitors replay
  host.addEventListener("click", function (ev) {
    if (ev.target.closest(".ss-phone")) return;
    run();
  });
})();
