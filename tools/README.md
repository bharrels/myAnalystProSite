# Visual edit tool — click & comment, then let Claude Code apply it

A local, Claude-Designs-style commenting layer for this site. View your real site
in the browser, click any element, type what you want changed, and Claude Code
applies every edit to the source — knowing exactly which element you meant.

Your real `.html` files are **never** modified by the server. The overlay is only
injected into pages served locally on `localhost`.

## 1. Start it

Double-click **`edit-site.cmd`** in the project root, or run:

```powershell
node tools/edit-server.js
```

Your browser opens at `http://localhost:4321`. Navigate the site normally —
every page (index, pricing, pro, reports, …) gets the overlay.

## 2. Leave comments

- Click **✎ Comment mode** (bottom-right), or press **Ctrl+Shift+C**.
- Hover — the element under your cursor highlights in gold with its tag/class.
- Click the element you want changed → a box opens → type the change
  (e.g. *"make this headline shorter and bold"*) → **Save** (or Ctrl+Enter).
- A numbered pin drops on the element. **List** shows all comments for the page.
- Comments auto-save to `tools/comments.json`.

## 3. Apply with Claude Code

Two equally easy ways to hand them over:

- **Slash command (recommended):** in Claude Code, run **`/edits`**
  (optionally `/edits pricing.html` to limit to one page). Claude reads
  `tools/comments.json`, finds each clicked element in the source, makes the
  change, and marks it applied.
- **Copy/paste:** click **Copy for Claude** to copy a formatted list to your
  clipboard, then paste it into Claude Code.

## 4. See the result

The server live-reloads the browser when source files change. After Claude
applies edits, the page refreshes and applied pins turn green (**✓**). Anything
Claude couldn't place confidently is left open with a question.

## What gets captured per click

So Claude can pinpoint the exact source location: the page file, a CSS selector
path, the element tag/id/classes, its visible text, identifying attributes
(`href`, `src`, `aria-label`, `data-*`…), the nearest section heading, an
`outerHTML` snippet, and the on-screen position.

## Notes

- Change the port: `node tools/edit-server.js 5000` or `PORT=5000 node tools/edit-server.js`.
- `tools/comments.json` is your working queue. Delete a comment from the **List**
  panel, or clear all via the trash icons.
- To keep the repo clean you can add `tools/comments.json` to `.gitignore`
  (the tool code itself is worth committing).
