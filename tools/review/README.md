# Standard pages review tool (branch `standardise-v3`)

**Where the review's output goes (decided 2026-11-16):** the tool never changes documents; it
shows `/std` and applies the saved choices in the browser. The decisions reach the pages through
the conversion: an apply step (not built yet: it follows once real decisions come in) feeds the
sheet's choices (variant, width, text set, background; per block or per group) into
`tools/importer/standardise/apply-variants.mjs`, so `/std = rules(/rs) + decisions` and a re-run
after any rule fix keeps them. Choices whose block moved (another section / block number after a
rule fix) are flagged, not guessed. Comments and QA notes become a to-do list, never applied
automatically. The real paths (`/us/en/…`) only at go-live, a separate promotion step.

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
| `upload-snapshots.sh`, `pack-snapshot-meta.py`, `snapshot-meta/` | The tiles to Document Authoring + branch preview; the per-page snapshot facts the tool reads (below) |
| `capture-snapshots.mjs` | Source snapshots: per page and width (1440, 375) JPEG tiles (4000 px) + text / image anchors of www.stryker.com, ALTCHA / cookie banner / trackers blocked; resumable. `--map` = EDS path → source URL (from `.migration/xf-mapping` file names) |
| `review-form.json` | The form definition the save route uses (form submission service → the review Google Sheet, `incoming` tab) |
| `summary.js`, `summarise.mjs`, `set-status.mjs`, `test/` | The feedback summary for the AOE team, the agent's readings and the status back to the reviewers (below) |

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

## Feedback summary for the AOE team (`summary.js`, `summarise.mjs`)

The sheet's rows as **work items** for the engineers who implement them (AOE: Agentic Outcome
Engineers), each with its target, reach and evidence (the reviewers' rows with links that open
the tool at the block, text section or pin: `?block=s1b0`, `?section=s3`, `?note=<id>`).

```
node tools/review/summarise.mjs [--csv rows.csv] [--out migration-work/review-summary] [--themes …/themes.json]
```

Writes `report.md` (for people) and `work-items.json` (the same for agents) to the git-ignored
`migration-work/review-summary/`. Rows are merged like the tool merges them (newest per item and
kind); test reviewers are left out (`--include-tests` keeps them); every standard page is read for
the blocks' designs and the reach of each design.

| Kind | From | Who handles it |
|---|---|---|
| `decision` | group choices ("for all blocks like this", with the blocks that are exceptions); single-block and text-section choices, aggregated by block type and from → to | data for the apply step |
| `variant` | comments on blocks and text sections, layout notes: per design the block shows (its own choice, else its group's, else its standard design), reach = every instance of that design | CSS of the design |
| `conversion` | QA notes (text, image, link, other), located by their anchor in the authored page (text, `<img>` or Dynamic Media link) | conversion rules, then re-run |
| `page` | page comments, notes on no block | that page |
| `question` | reviewers disagree (their newest values differ); a choice that no longer fits its block (the page changed after it was saved, e.g. moved block numbers) | back to the reviewer, never applied |

Resolved and deleted notes are left out. The kind is a first guess from the row type; the agent's
reading (below) can split an item into themes with their own kind.

**The agent's reading (themes).** Each run also writes `to-read.json`: the work items (not
decisions) with no reading yet or a stale one, in short form. The agent (asked to "summarise the
review feedback") reads them and writes its readings to the themes file (default
`migration-work/review-summary/themes.json`), then runs the summary again:

```json
{ "items": { "variant:columns:media-text": {
  "by": "agent (Claude)", "time": "<ISO>",
  "summary": "what the feedback says, in one or two sentences",
  "themes": [{ "title": "…", "kind": "variant | conversion | page | question | decision",
               "refs": ["<page>#<item>|<kind>", "…"], "action": "what to do, where" }],
  "questions": ["open questions for the customer"] } } }
```

The report shows it as **Agent reading**, the reviewers' rows stay below it as written. A reading
is **stale** when the item has feedback newer than the reading, or a row it names is gone; stale
items are listed in `to-read.json` again. Example: `test/sample-themes.json`.

**Status back to the reviewers.** When a work item is in progress, done or won't be done:

```
node tools/review/set-status.mjs --item variant:columns:media-text --state done|progress|wontdo|open \
  --release r1 --reason "image column widened" [--refs <ref>,<ref>] [--dry-run]
```

It appends one row per reviewer row of the item (or only `--refs`) to the sheet, the way the tool
saves (posted from a page on the branch preview): reviewer `AOE`, kind `status:<kind>` on the
reviewer's own item, value `{ state, release, reason, workItem, commit }`. The tool shows it under
the comment or QA note ("AOE: done in r1 · image column widened"), the results page in an AOE
column (AOE rows are no reviewer there), and the next summary per row (mixed states = "partly").
`open` takes a status back. Decisions get no status here: the apply step will record what it
applied. `release` is free text until the versioning of `/std` is decided (plan step 2); the
commit is recorded with every status.

Test: `node tools/review/test/summary.test.mjs` (the sample `test/sample-rows.csv`, made-up feedback
on real standard pages, from `test/sample-rows.mjs`).

## Source snapshots

"Compare with: Source" shows the snapshot of the page at the current width, synced by its
recorded text positions.

- Facts (tiles, size, anchors) per page, both widths: `snapshot-meta/<page>.json`, committed
  (`pack-snapshot-meta.py`, 672 files, 5.9 MB).
- Tiles: on the workspace preview from `snapshots/` (a git-ignored link to the capture folder on
  the local disk); elsewhere from Document Authoring through the branch preview,
  `/review-snapshots/<page>/<width>/<n>.jpg` (each redirects once to its `media_<hash>.jpg`).
  `upload-snapshots.sh` uploads and previews them (resumable; never published).
- Captured 2026-11-13: 1,344 snapshots (672 pages × 1440 / 375), 2,412 tiles, 382 MB; all
  uploaded and previewed on standardise-v3 the same day. A copy of the capture folder:
  `.cbr/review-snapshots-2026-11-13.tar` (local only).

Next: blocks in fragments; the apply step (after the review); a release stamp and block
fingerprint on saved rows (versioning of `/std`, parked 2026-11-16, see
`tools/importer/standardise/README.md` → Plan).
