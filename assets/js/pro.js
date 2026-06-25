/* =============================================================
   myAnalyst PRO — hero word cycle (quarter / month / day / week)
   The circled word in the headline rotates to show Pro adapts to
   whatever cadence the operator runs on. Width is locked to the
   widest word so the headline never reflows. Reduced-motion shows
   a single static word.
   ============================================================= */
(function () {
  "use strict";

  var el = document.querySelector("[data-cycle]");
  if (!el) return;

  var WORDS = ["quarter", "month", "week", "day"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Lock the wrapper width to the widest word so layout stays put.
  var wrap = el.closest(".cycle-wrap") || el.parentNode;
  function lockWidth() {
    var probe = document.createElement("span");
    var cs = window.getComputedStyle(el);
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;" +
      "font:" + cs.font + ";font-weight:" + cs.fontWeight + ";letter-spacing:" + cs.letterSpacing + ";";
    document.body.appendChild(probe);
    var max = 0;
    WORDS.forEach(function (w) { probe.textContent = w; max = Math.max(max, probe.offsetWidth); });
    document.body.removeChild(probe);
    if (max) el.style.minWidth = Math.ceil(max) + "px";
  }
  // fonts may load late — relock once they're ready
  lockWidth();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockWidth);

  if (reduce) return;

  var i = 0;
  setInterval(function () {
    el.classList.add("swap");
    setTimeout(function () {
      i = (i + 1) % WORDS.length;
      el.textContent = WORDS[i];
      el.classList.remove("swap");
    }, 480);
  }, 2600);
})();
