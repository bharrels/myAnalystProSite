---
description: Apply pending click-to-comment edit requests from tools/comments.json
---

You are processing visual edit requests the user left by clicking elements on the
locally-served site. Each request names the exact element they clicked.

Do the following:

1. Read `tools/comments.json`. Work only on items whose `status` is `open`
   (skip `applied`). If `$ARGUMENTS` names a specific page, only process items whose
   `page` matches it.

2. For each open comment, locate the element in the **source** HTML file named by
   `page` (e.g. `index.html`). Find it using, in order of reliability:
   - distinctive `attrs` (id, href, src, aria-label, data-*) — grep for these
   - `text` content — grep the source for a distinctive substring
   - `nearbyHeading` to disambiguate which section
   - `selector` / `outerHTML` as structural confirmation
   Confirm you have the right element before editing — the rendered DOM closely
   matches this hand-authored static source, but verify text/attributes line up.

3. Make the change the `comment` describes. If a change touches CSS, edit
   `assets/css/styles.css` (or `assets/css/pro.css` for pro.html). Match the
   surrounding code style. Keep edits minimal and scoped to the request.

4. After applying each one, update that item in `tools/comments.json`:
   set `status` to `"applied"`, add `"appliedNote"` (one line: what you changed)
   and `"appliedAt"` (ISO timestamp). Preserve all other fields and the array order.

5. If a request is ambiguous or you cannot confidently locate the element, leave
   its status `open`, add `"needsInfo"` with a short question, and continue with the rest.

6. End with a concise summary: what was applied (file + change), and any items left
   open with their question. Remind the user the running server auto-reloads, so they
   can refresh the browser to see the changes and the pins turn green (✓).
