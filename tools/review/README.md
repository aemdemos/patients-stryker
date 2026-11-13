# Standard pages review tool (branch `standardise-v3`)

A review shell for the customer: the standard page (`/std/…`) as the base, its as-is version
(`/rs/…`) to compare, scroll-synced by matched text. Not part of the site: it runs on preview
hosts only (the branch preview, the local dev server) and never touches content. Plan and
decisions: `tools/importer/standardise/README.md` and the review plan.

Open: `/tools/review/index.html?page=/us/en/foot-and-ankle/products/prophecy`
(locally the frames read `/content/std/…` and `/content/rs/…`).

| File | What |
|---|---|
| `index.html`, `review.css` | The shell: toolbar (page, desktop / phone, flip / overlay / side by side, sync, reviewer name), block panel, the two frames |
| `review.js` | Frames, layout and scaling, readiness, sync wiring, flip (Space), page stepping (Alt+← / →), block list; state in the URL (`page`, `vp`, `mode`, `show`, `op`) |
| `sync.js` | Text-matched sync: text runs and images found once on each side are paired, the longest same-order chain kept, the middle of the screen mapped between neighbouring pairs (the QA tool's Sync, simplified) |
| `frame.js` | Runs inside the standard page (scripts.js loads it with `?review` on preview hosts): matches the page's authored blocks (its `.plain.html`) to the rendered ones (name + words incl. alt texts; a wordless block, e.g. a video player, by order), offers the variants the content fits (Columns by cell kinds, widths for two cells; Cards, Hero, Video, Page Nav jump / sticky), re-renders a block in another variant like the page (`decorateMain` + `loadSections`) and swaps it, switches section backgrounds; `window.stdReview` for the shell. Blocks from fragments and the ones the page builds (tabs, accordions) are listed, not switchable |
| `pages.json` | The 672 standard pages (title, business unit); `python3 -I tools/importer/standardise/review-pages.py content tools/review/pages.json` |
| `store.js` | Saving and loading the review state (below) |
| `review-form.json` | The form definition the save route uses (form submission service → the review Google Sheet, `incoming` tab) |

## Saving (`store.js`)

Every change is one row in the review Google Sheet (tab `incoming`: `__id__, page, item, kind,
value, reviewer, time`), appended by Adobe's form submission service; no sign-in for reviewers.

- Write: `POST https://forms.adobe.com/adobe/forms/af/submit/<btoa('/tools/review/review-form.json')>`
  with `x-adobe-form-hostname` = the branch preview (the service reads the form definition from
  there, so it must be a host anyone can read, not the workspace preview).
- Read: the sheet's CSV export (`/export?format=csv&gid=0`, no type guessing; a row shows within
  about a minute). Rows are merged per `item|kind`, newest wins, so reviewers don't overwrite each
  other; a reviewer's own rows stay in the browser (`std-review-pending`) until the sheet has them,
  so they count at once.
- Items: a block id (`s<section>b<block>`) or `page`. Kinds: `variant`, `width`, `background`,
  `comment`, `reviewed`. Values JSON-encoded.
- A name is needed to save; changes made before one is entered wait for it.
- Tested end to end 2026-11-13: reviewer A's changes seen by a fresh browser after 22 s.

Next: blocks in fragments, the group option ("all blocks like this"), source snapshots (1440 /
375 with text boxes) with pinned QA notes, a results summary and export for `apply`.
