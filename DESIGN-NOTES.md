# myAnalyst, design system / style notes

The style the site is built in, so new pages stay consistent. **The site is a light theme** (converted from the original dark concept).

## The look in one line
A **clean, light SaaS** aesthetic: an off-white canvas, generous whitespace, soft shadows, hairline borders, one confident teal accent, with the product shown as **dark "screenshot" frames** that pop against the light page. Calm, credible, operator-focused.

## Foundations

**Typography**
- **Plus Jakarta Sans**, UI + headings. Large, medium-weight (600), tight tracking, line-height ~1.05.
- **JetBrains Mono**, numbers, KPI values, window-chrome labels (`.mono`, tabular-nums). Signals "real data."
- Body 17px / line-height 1.6; secondary text in muted slate.

**Color (token-driven, always use the CSS variables, never raw hex)**
- Canvas: `--bg-1 #f6f7f9` (page), `--bg-2 #ffffff` (cards), `--bg-3 #eef0f3` (recessed bands / inputs).
- Text: `--fg-1 #0e1116` → `--fg-2 #495160` → `--fg-3 #646d7a`.
- Borders: dark-on-light hairlines `--border-1/2/strong`.
- **Accents (tuned for AA contrast on white):** teal fill `--teal #15a98c`; teal text/links `--teal-600 #0a7d66`; deep amber `--amber #a86a12` (+ `--amber-fill #fcb041` for bars); crimson `--crimson #d6315a`; info blue `--info #2563eb`.
- Semantic tints `--success/-bg`, `--warning/-bg`, `--danger/-bg` are light washes for chips/badges.
- Shadows are soft and gray (`--shadow-*`); no heavy glows on the light chrome.

**The dark-frame technique (important).** The product "window" mocks (`.dash`, `.shot`, `.report`, `.phone`) keep a **dark UI palette**, applied by *scoping the dark token values as CSS-variable overrides on those containers*. So a dashboard mock renders as a crisp dark screenshot on the light page without any per-element overrides. (These are placeholders, see "Pending" in AUDIT.md, to be swapped for real screenshots from the myanalystplatform app.)

## Signature elements
- **Light glass header**, sticky, blurred white; hairline + soft shadow appear on scroll; animated teal underline on nav links; black `logo-full.webp` wordmark.
- **Dark product frames**, faux traffic-light title bar; used for LiveStats tables, dashboards, maps, AI briefings.
- **Score ring**, 0 to 100 Store Health donut + A to F grade; track color is theme-aware (dark on light cards, light inside dark frames).
- **Teal CTA band**, the closing call-to-action is a teal-gradient block with white text; the page's brand anchor.
- **Eyebrow labels**, small teal uppercase kickers with a short gradient rule.
- **Client logo marquee**, infinite seamless scroll of real client logos (grayscale, colorize on hover), pause-on-hover, edge-masked.

## Component vocabulary
`.section`/`.section-sm`/`.dark-section` (light recessed band) · `.section-head.center` · `.card.hover` grids (`.grid-2/3/4`, `data-stagger`) with colored `.c-ico` · `.feature-row[.flip]` · `.stats` strip · `.persona` · `.cta-band` · chips `.tag`/`.badge`/`.spill` · buttons `.btn-amber` (dark loud CTA), `.btn-primary` (teal), `.btn-ghost` (light outline), `.btn-link`.
SEO/AEO components: `.crumbs` breadcrumb, `.faq` accordion (`<details>`), `.glossary` `<dl>`, `.cmp` comparison table, `.prose` article body.
Data capture: `.cookie-bar` (consent), `.footer-cta` + `.lead-form` (newsletter).

## Motion ("wow", reduced-motion-safe)
Transform/opacity only, rAF-throttled, fully disabled under `prefers-reduced-motion`: scroll reveals (+ `data-stagger`), top scroll-progress bar, cursor spotlight on cards, subtle 3D tilt on product frames, button sheen, animated nav underline, drifting hero aurora, count-up stats, live KPI tickers, logo marquee.

## Voice
Operator-to-operator, concrete, outcome-led. Money and time as the payoff. Confident, not hypey.

## Rules of thumb for new pages
1. Reuse the verbatim header, mobile-drawer, and footer (incl. newsletter) from `index.html`.
2. Build from existing components; use tokens, never raw hex.
3. One `<h1>` (in `.page-hero`); breadcrumb right below the header.
4. Keep the full SEO `<head>` (canonical, OG/Twitter, JSON-LD) and the `main.js` include.
5. Deep/per-industry report pages are linked **contextually** (from industry cards), never added to the top nav.
