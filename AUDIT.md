# myAnalyst website, audit & fix log

Review of all 8 original pages across six dimensions (copy, spacing/layout, visual design, technical SEO, accessibility, AI/answer-engine readiness). 52 issues raised, 49 confirmed after verification. Status reflects work done in this pass.

**Legend:** ✅ fixed · 🟡 improved / noted · ⬜ recommended (not yet done)

---

## 1. Copy & content

| # | Where | Severity | Issue | Resolution | Status |
|---|-------|----------|-------|------------|--------|
| 1 | index hero logo wall | major | Named third-party brands (Jiffy Lube, Valvoline, etc.) under "Trusted across…" read as implied endorsements / trademark risk | Owner confirmed these are **real clients**, restored as a scrolling client marquee ("Trusted by operators across industries"), matching the live site | ✅ |
| 2 | pro.html | minor | Sample briefing says "12 locations" but the testimonial below says "14 locations" | Testimonial aligned to 12 locations | ✅ |
| 3 | pro.html | minor | Contradicts itself: "AI consultant" vs "written, not auto-generated" / "prepared by your team" | Settled on one story: **AI-written, reviewed by your team** | ✅ |
| 4 | customers.html | minor | Labor % KPI shows ▼ with green `up` class, reads as an error | Kept green (lower labor is good) but labeled it "▼ 1.3% labor" | ✅ |
| 5 | index vs industries vs contact | minor | Industry list differed per page (6 vs 7; "QSR" vs "QSR / Fast Food") | Homepage selector now matches the canonical 7 verticals & labels | ✅ |
| 6 | index / industries | minor | "ARO" used but never expanded | Expanded to "ARO (Average Repair Order)" on first use; defined in the new glossary | ✅ |

## 2. Spacing & layout (shared `styles.css`)

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 7 | Footer stayed 2-up on phones (cramped) | Collapses to 1 column ≤760px | ✅ |
| 8 | `.grid-2` panels stayed side-by-side on tablet (761 to 980px) | Collapse at 980px alongside feature rows | ✅ |
| 9 | Contact form fields cramped on tablet | Resolved by the grid-2 collapse above | ✅ |
| 10 | Pricing "Most popular" ribbon nearly touched the card above when stacked | Added 34px gap on stacked price grid | ✅ |
| 11 | 4-up stat strip jumped 4→1 (tight at ~768px) | Now steps 4 → 2 → 1 | ✅ |
| 12 | Store Health pillar labels ("Operations · 15%") wrapped in a fixed 92px column | Added `.pillars--wide` (128px) + nowrap | ✅ |
| 13 | Ineffective inline `width:auto` on platform retention pillars | Cleaned up in retrofit | ✅ |
| 14 | Inconsistent `.section` / `.section-sm` rhythm on homepage | Reviewed; kept intentional secondary bands | 🟡 |
| 15 | Industry tabs wrap raggedly on small screens | Acceptable; left as-is | 🟡 |

## 3. Visual design & token consistency

| # | Where | Issue | Resolution | Status |
|---|-------|-------|------------|--------|
| 16 | customers.html | Leftover light-theme `#e8f0fe` pill background on the dark page (near-invisible text) | Switched to `var(--info-bg)` | ✅ |
| 17 | platform/customers | Two ambers for the same role (`--amber` vs `--amber-600`) | Standardized on `--amber` | ✅ |
| 18 | index score rings | Hardcoded warm-brown `#2c2a20` track | Now `rgba(255,255,255,.10)` matching the token | ✅ |
| 19 | index score rings | One-off `#5fcdb8` grade color | Now `var(--teal-600)` | ✅ |
| 20 | index/pro | Legacy `--d-*` aliases used in markup | Switched to canonical tokens | ✅ |
| 21 | styles.css | Dead `.logo-mark` rule | Deleted | ✅ |
| 22 | styles.css | `--danger-bg` built from a different red than `--danger` | Aligned to `rgba(255,92,124,.16)` | ✅ |

## 4. Technical SEO (was entirely absent)

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 23 | No `robots.txt` | Created, allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot…) + sitemap reference | ✅ |
| 24 | No `sitemap.xml` | Created, all 18 pages with lastmod/priority | ✅ |
| 25 | No canonical tags | Self-referencing canonical on every page | ✅ |
| 26 | No Open Graph tags | Added sitewide (+ 1200×630 share image) | ✅ |
| 27 | No Twitter Card tags | Added `summary_large_image` sitewide | ✅ |
| 28 | No JSON-LD structured data | Organization + WebSite sitewide; SoftwareApplication, FAQPage, Article, DefinedTermSet, BreadcrumbList per page | ✅ |
| 29 | Pricing FAQ had no FAQPage schema | Added (matches visible text) | ✅ |
| 30 | No BreadcrumbList | Added to every interior/new page | ✅ |
| 31 | Inconsistent title format | Standardized on a ` | myAnalyst` suffix | ✅ |
| 32 | Only an SVG favicon | Added `apple-touch-icon.png` | ✅ |
| 33 | Raw `&` in platform/pro meta descriptions | Escaped to `&amp;` | ✅ |

## 5. Accessibility

| # | Where | Severity | Issue | Resolution | Status |
|---|-------|----------|-------|------------|--------|
| 34 | mobile drawer | major | Off-screen links stayed in the tab order when closed | `inert` + `aria-hidden` when closed; `aria-controls` added | ✅ |
| 35 | mobile drawer | major | No focus management / Escape to close | Focus moves in on open, trapped, Escape closes & restores focus | ✅ |
| 36 | industry tabs | minor | No ARIA tab semantics / arrow keys | `role=tablist/tab`, `aria-selected`, roving tabindex, arrow/Home/End keys | ✅ |
| 37 | industry panel | minor | Content swapped silently for screen readers | Added `aria-live="polite"` | ✅ |
| 38 | footer address | minor | `href="#"` non-functional link | Now a semantic `<address>` with a real `tel:` link | ✅ |
| 39 | logo wall / metrics | major | `--fg-3` at `opacity:.65` failed contrast (~2.8:1) | Raised to `--fg-2` at `.8` (passes) | ✅ |
| 40 | demo form | major | `novalidate` + always-success: required fields never enforced | Accessible validation: `aria-invalid`, focus first invalid, success only when valid | ✅ |

## 6. AI / answer-engine optimization (AEO/GEO)

| # | Issue | Resolution | Status |
|---|-------|------------|--------|
| 41 | No `llms.txt` | Created, plain-text entity + page map for AI crawlers | ✅ |
| 42 | No structured data | See #28 | ✅ |
| 43 | FAQ content not machine-readable | New `faq.html` with ~18 schema-marked Q&As | ✅ |
| 44 | Domain terms never defined | New `glossary.html` with ~30 `DefinedTerm` entries | ✅ |
| 45 | No glossary/definitional content | See #44 | ✅ |
| 46 | Unattributed statistics | Added a `proof-note` clarifying figures are aggregate / client-reported | ✅ |
| 47 | No canonical/OG for AI preview crawlers | See #25 to 27 | ✅ |
| 48 | No robots/sitemap for AI crawler access | See #23 to 24 | ✅ |
| 49 | Signature term "Store Health" had no canonical explainer | New `store-health-score.html` (methodology + worked example) | ✅ |

---

## New pages added (SEO + AEO)
`about.html` · `faq.html` · `glossary.html` · `auto-service-analytics.html` · `multi-location-dashboard-software.html` · `store-health-score.html` · `compare-myanalyst-vs-bi.html` · `resources.html` · `quick-lube-kpis.html` · `auto-service-customer-retention.html`

## Before launch
- The production domain is hardcoded as `https://www.myanalystpro.com` in canonical/OG/sitemap/JSON-LD/robots/llms. If that changes, find-and-replace it.
- Statistics (1,100+ locations, $2B+, 10:1 ROI) are presented as aggregate/client-reported, confirm the basis you want shown.
- Client marquee uses text names; swap in logo images when available.
