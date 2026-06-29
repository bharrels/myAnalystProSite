/* =============================================================
   Integrations page — on mobile, collapse each category's chip
   list to the first two rows with a "Show more" toggle, so the
   long lists (especially Point of Sale) don't force endless
   scrolling. Desktop shows every chip.
   ============================================================= */
(function () {
  "use strict";
  var grid = document.querySelector(".intg-grid");
  if (!grid) return;
  var mq = window.matchMedia("(max-width: 760px)");
  var cards = [].slice.call(grid.querySelectorAll(".intg-cat"));

  cards.forEach(function (card) {
    var chips = card.querySelector(".intg-chips");
    if (!chips) return;
    var spans = [].slice.call(chips.children);
    if (spans.length < 4) return; // short lists never need a toggle

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "intg-more";
    btn.hidden = true;
    chips.insertAdjacentElement("afterend", btn);
    var expanded = false;

    function apply() {
      spans.forEach(function (s) { s.style.display = ""; }); // reset/measure
      if (!mq.matches) { btn.hidden = true; return; }        // desktop: show all
      if (expanded) { btn.hidden = false; btn.textContent = "Show less"; return; }
      // collapsed: keep only the first two rows of chips
      var tops = [];
      spans.forEach(function (s) { var t = s.offsetTop; if (tops.indexOf(t) === -1) tops.push(t); });
      tops.sort(function (a, b) { return a - b; });
      if (tops.length <= 2) { btn.hidden = true; return; }   // already fits in 2 rows
      var cutoff = tops[1];
      var hidden = 0;
      spans.forEach(function (s) { if (s.offsetTop > cutoff) { s.style.display = "none"; hidden++; } });
      btn.hidden = false;
      btn.textContent = "Show " + hidden + " more";
    }

    btn.addEventListener("click", function () { expanded = !expanded; apply(); });
    apply();
    // re-measure once web fonts settle (chip widths shift row breaks)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!expanded) apply(); });
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(function () { if (!expanded) apply(); }, 150); });
  });
})();
