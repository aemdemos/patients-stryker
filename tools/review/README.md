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
| `groups.js` | The variants a block's content fits and its group ("blocks like this": block type + standard variant + for Columns the cell kinds of its first row, more rows flagged); used by `frame.js` and `build-groups.mjs` |
| `build-groups.mjs`, `groups.json` | The 34 groups over the 672 standard pages with their size (blocks, pages); `node tools/review/build-groups.mjs` against the workspace preview |
| `results.html`, `results.js`, `results.css` | Review results from every row of the sheet: progress (pages marked reviewed, activity, reviewers), design decisions (group choices with their reach; single-block choices named by block type and design, values equal to the block's own design left out), comments by block type and per page, QA notes (open / resolved, by category) with links that open the tool at the pin (`index.html?page=…&vp=…&note=<id>`); CSV downloads of comments and QA notes; test entries hidden by default |
| `store.js` | Saving and loading the review state (below) |
| `notes.js` | Pinned QA notes: note mode (button or N, Esc), a click on the standard page drops a pin tied to the nearest text run or image (`sync.js` key + spot in its box, else the page position), so it keeps its place on reflow and variant switches; pins live in the frame; category, text, width, open / resolved, deleted. Saved as item `note:<id>`, kind `note` |
| `capture-snapshots.mjs` | Source snapshots: per page and width (1440, 375) JPEG tiles (4000 px) + text / image anchors of www.stryker.com, ALTCHA / cookie banner / trackers blocked; resumable. `--map` = EDS path → source URL (from `.migration/xf-mapping` file names) |
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
- **Save button** (Ctrl+S / ⌘S): changes stay in the browser (`std-review-drafts`, per page)
  until Save; a change back to the value it had before (the saved one, else the page's own) is no
  change. Save writes one row per changed item, its final value. Leaving a page with unsaved
  changes asks (save now / keep for later); closing the tab warns. A name is needed to save.
- The form service can only append rows, so earlier saves stay in the sheet as history (who chose
  what, when); the tool reads the newest row per item.
- **Groups:** "Use this design for all" saves the group's choice as item `group:<key>` (kinds
  `variant`, `width`) on page `*` (read with every page). A block's design: its own choice, else
  its group's, else its standard design; a block with its own choice that differs is shown as an
  exception, "Stop" clears the group's choice (value null). Item keys may hold `|` (group keys):
  split `item|kind` at the last `|`.
- Tested end to end 2026-11-13: reviewer A's changes seen by a fresh browser after 22 s.

Note: the sheet's export lags up to about a minute, so another browser can briefly show a note's
or choice's previous state (the reviewer who changed it sees the change at once).

## Source snapshots

"Compare with: Source" shows the snapshot of the page at the current width (tiles + anchors in
`snapshots/<page>/<width>/`), synced by its recorded text positions. Locally `snapshots` is a
git-ignored link to the capture folder on the local disk. For the branch preview the tiles go to
Document Authoring under `/review-snapshots/…` (tested with one file 2026-11-13: the preview serves
it after a redirect to its `media_<hash>.jpg` copy); the anchors with the tool.

Next: blocks in fragments, the group option ("all blocks like this"), hosting the snapshots on
the branch preview, a results summary and export for `apply`.
