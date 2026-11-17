# Standard pages review tool (branch `standardise-v3`)

**Where the review's output goes:** the tool never changes documents; it shows `/std` and applies
the saved choices in the browser. Since 2026-11-17 the choices are saved in the **review backend
on App Builder** (`backend/`, plan `backend-plan.md`); reviewers open the tool with an
**invitation link**, no Adobe ID needed. The apply step (plan phase 4) writes the choices into the
`/std` documents in DA. Variants are additive (they only grow; changes to a variant are CSS/JS
and apply everywhere), so no versioning of `/std`. Comments and QA notes become the AOE team's
work items, never applied automatically. The real paths (`/us/en/…`) only at go-live.

A review shell for the customer: the standard page (`/std/…`) as the base, its as-is version
(`/rs/…`) to compare, scroll-synced by matched text. Not part of the site: it runs on preview
hosts only (the branch preview, the local dev server) and never touches content. Plan and
decisions: `tools/importer/standardise/README.md` and the review plan.

Open with an invitation link (`node tools/review/backend/admin.mjs invite …`):
`/tools/review/index.html?page=/us/en/foot-and-ankle/products/prophecy&invite=<token>`; the
browser keeps the token, later visits need no link (locally the frames read `/content/std/…` and
`/content/rs/…`).

| File | What |
|---|---|
| `index.html`, `review.css` | The shell: toolbar (page, desktop / phone, flip / overlay / side by side, sync, reviewer name), block panel, the two frames |
| `review.js` | Frames, layout and scaling, readiness, sync wiring, flip (Space), page stepping (Alt+← / →), block list; state in the URL (`page`, `vp`, `mode`, `show`, `op`) |
| `sync.js` | Text-matched sync: text runs and images found once on each side are paired, the longest same-order chain kept, the middle of the screen mapped between neighbouring pairs (the QA tool's Sync, simplified) |
| `frame.js` | Runs inside the standard page (scripts.js loads it with `?review` on preview hosts): matches the page's authored blocks (its `.plain.html`) to the rendered ones (name + words incl. alt texts; a wordless block, e.g. a video player, by order), offers the variants the content fits (Columns by cell kinds, widths for two cells; Cards, Hero, Video, Page Nav jump / sticky), re-renders a block in another variant like the page (`decorateMain` + `loadSections`) and swaps it, switches section backgrounds; `window.stdReview` for the shell. Blocks from fragments and the ones the page builds (tabs, accordions) are listed, not switchable |
| `pages.json` | The 672 standard pages (title, business unit); `python3 -I tools/importer/standardise/review-pages.py content tools/review/pages.json` |
| `groups.js` | The variants a block's content fits and its group ("blocks like this": block type + standard variant + for Columns the cell kinds of its first row, more rows flagged); used by `frame.js` and `build-groups.mjs` |
| `build-groups.mjs`, `groups.json` | The 34 groups over the 672 standard pages with their size (blocks, pages); `node tools/review/build-groups.mjs` against the workspace preview |
| `status.html`, `status.js`, `status.css` | The status of every page: colour-coded states, filters, "waits for me" order (below) |
| `results.html`, `results.js`, `results.css` | Review results from every entry in the scope of an invitation with the results right (`results.html?invite=…`): progress (pages marked reviewed, activity, reviewers), design decisions (group choices with their reach; single-block choices named by block type and design, values equal to the block's own design left out), comments by block type and per page, QA notes (open / resolved, by category) with links that open the tool at the pin (`index.html?page=…&vp=…&note=<id>`); CSV downloads of comments and QA notes; test entries hidden by default |
| `store.js` | Saving and loading the review state (below) |
| `blockkeys.js` | Stable keys for blocks and text sections (below): what choices are saved under |
| `notes.js` | Pinned QA notes: note mode (button or N, Esc), a click on the standard page drops a pin tied to the nearest text run or image (`sync.js` key + spot in its box, else the page position), so it keeps its place on reflow and variant switches; pins live in the frame; category, text, width, open / resolved, deleted. Saved as item `note:<id>`, kind `note` |
| `upload-snapshots.sh`, `pack-snapshot-meta.py`, `snapshot-meta/` | The tiles to Document Authoring + branch preview; the per-page snapshot facts the tool reads (below) |
| `capture-snapshots.mjs` | Source snapshots: per page and width (1440, 375) JPEG tiles (4000 px) + text / image anchors of www.stryker.com, ALTCHA / cookie banner / trackers blocked; resumable. `--map` = EDS path → source URL (from `.migration/xf-mapping` file names) |
| `backend/`, `backend-plan.md` | The review backend on App Builder (invitation links, state per page and block, audit) and its plan |
| `summary.js`, `summarise.mjs`, `set-status.mjs`, `test/` | The feedback summary for the AOE team, the agent's readings and the status back to the reviewers (below) |

## Saving (`store.js`)

Every change is an entry in the review backend (App Builder, `backend/README.md`): the state per
page and block, updated in place, with an audit file per save; no sign-in for reviewers.

- **Invitation:** the link's token (`?invite=`) is kept in the browser (`std-review-invite`) and
  removed from the address bar; every call sends it (header `x-review-invite`). The reviewer's
  name comes from it (the name field is read only); its scope (path prefixes, the group right,
  the results right) decides what can be read and saved. An expired or withdrawn link: the tool
  says so.
- **Load:** `state?page=…` gives the page's entries and every group choice (page `*`), AOE
  statuses among them; merged per `item|kind`.
- **Save:** each change carries the `rev` it started from; a change someone else made meanwhile is
  a conflict: refused, dropped here, the tool asks to reload. Until the backend confirms a change
  it stays in the browser (`std-review-pending-backend`) and counts as saved here.
- Items: a block or text section by its **key** (`b:<type>:<fingerprint>`, `t:<fingerprint>`,
  below), `page`, `note:<id>`, `group:<key>`; entries saved by position before the keys
  (`s<section>b<block>`, `s<section>`) are still read. Kinds: `variant`, `width`, `background`, `text`, `comment`, `reviewed`, `note`;
  values JSON-encoded.
- **Save button** (Ctrl+S / ⌘S): changes stay in the browser (`std-review-drafts`, per page)
  until Save; **Undo changes** drops this page's unsaved changes and shows it at its last saved
  state again (after a confirmation); a change back to the value it had before (the saved one, else the page's own) is no
  change. Save sends the changes of one Save in one request. Leaving a page with unsaved changes
  asks (save now / keep for later); closing the tab warns.
- **Groups:** "Use this design for all" saves the group's choice as item `group:<key>` (kinds
  `variant`, `width`, `text`) on page `*` (read with every page). A block's design: its own choice,
  else its group's, else its standard design; a block with its own choice that differs is shown as
  an exception, "Stop" clears the group's choice (value null). Item keys may hold `|` (group keys):
  split `item|kind` at the last `|`.
- **A save cut off** (the tab closed while it was sent): sent again on the next visit to the
  page; closing the tab while changes are still being sent warns.
- **History:** the pilot saved to a Google Sheet through Adobe's form submission service
  (2026-11-13 to 11-17, test data only); retired on 2026-11-17, its rows not imported.

## Threads and the AOE team in the tool

Every comment (block, text section, page) and QA note is a **thread**: the reviewer's comment
opens it, replies come below it. The back and forth happens here, not in calls.

- **Reviewers** reply, or **Resolve** (any reviewer of the page; a reply after that reopens it).
- **The AOE team** opens the tool with an AOE invitation (`admin.mjs invite --role aoe`): the
  name shows "(AOE)", their replies carry an AOE badge and may carry a status (in progress, done in
  rN, won't do, open again) and a release. Their activity is recorded under their own names; they
  can use everything else in the tool too (their choices are recorded with role `aoe`).
- **State**, from the last message: *open* (waiting for the AOE team), *answered* (waiting for the
  reviewers), *resolved*. The thread shows whom it waits for, from where the viewer stands.
- Replies are sent at once (not held for Save) and written once (no edits); entries
  `reply:<comment|note>:<id>`, value `{ text, action: 'resolve', status: { state, release } }`.
  The backend checks the roles: only reviewers close, only the AOE team gives a status.
- `set-status.mjs` (many rows at once) writes AOE answers into the threads (`admin answer`,
  `--by` the name); older `status:<kind>` rows show as AOE answers.
- The summary gives every piece of evidence its thread (state, replies, last writer, the AOE
  team's latest status) and work items their thread counts; a reviewer's reply newer than the
  agent's reading makes the reading stale. The results page's AOE column: the thread state and the
  latest status.

## Status of every page (`status.html`, `status.js`, `status.css`)

Where each page stands in the back and forth, for the reviewers and the AOE team alike: every
page of the invitation's scope (`pages.json`, now with each page's template), filtered by
template, business unit, state, search and "only new since my last visit"; links into the tool.
The states come from the web action `overview` (`backend/lib/states.mjs`), each a colour **and** a
label, worded for the viewer:

| State | Colour | When |
|---|---|---|
| Answered: waiting for the reviewers | yellow | every unresolved thread was answered by the AOE team |
| Waiting for the AOE team | red | a thread waits for the AOE team |
| In review | grey-blue | activity, not marked reviewed, nothing open |
| Resolved | green | marked reviewed after feedback (threads, all closed, or design choices) |
| Approved as is | light green | marked reviewed, never any feedback |
| Not reviewed yet | black | nothing yet |

Order "what waits for me first": reviewers see yellow, red, grey-blue, green, light green, black;
the AOE team red first. "New": the latest activity is by someone else and after the viewer's last
visit (kept in the browser). Counts per state on top (click to filter) and a bar in the state
colours. Any invitation opens it (`status.html?invite=…`, or the tool's link once the browser has
the invitation). Tests: `backend/test/states.test.mjs` (the state rules), `backend/test/status.test.mjs`
(the page in a browser, one page per state, both views).

## Block keys (`blockkeys.js`)

A choice is saved under its block's **key**, not its position: positions (`s14b0`) move when the
conversion re-runs (sections removed, title lines in their own section), the content does not.

- Key: block type + a fingerprint of its text and image alt texts, whitespace ignored
  (`b:columns:3f2a9c1b`; text sections `t:<fingerprint>` of their own text). Not image or link
  addresses: Document Authoring stores images under its own names and pages with line breaks
  between elements, so only this gives the same key on the branch preview and in the workspace
  (checked on the demo pages: every block of the DA copies has its workspace key).
- A design choice changes classes, never content, so a block keeps its key.
- **Twins** (identical content on one page, e.g. the same jump links twice): named by the nearest
  unique block or section before them (`~<…>`), a number (`#1`) only when that is the same too
  (4 of 10,915 keys on the 672 pages). A key not found exactly is looked up by its content alone
  when exactly one block has it (a twin whose other twin is gone).
- **A text fix** gives that block a new key: its saved choices are not found any more; the tool
  leaves them out, the summary lists them as re-check questions; never guessed.
- The tool, the results page and the summary compute keys from the page they show, map entries
  to positions on load and save under keys; summary links name blocks by key (`?block=b:…`).
- Tests: `test/blockkeys.test.mjs` (a page changed as a re-run would: every block keeps its key
  while its position moves; a text fix changes one key); the loop test saves a design switch
  under its key.

## Feedback summary for the AOE team (`summary.js`, `summarise.mjs`)

The review's entries as **work items** for the engineers who implement them (AOE: Agentic Outcome
Engineers), each with its target, reach and evidence (the reviewers' rows with links that open
the tool at the block, text section or pin: `?block=s1b0`, `?section=s3`, `?note=<id>`).

```
node tools/review/summarise.mjs [--csv rows.csv] [--out migration-work/review-summary] [--themes …/themes.json]
```

Reads every entry from the review backend (its private `admin export`; `--csv` reads a file
instead, for the tests). Writes `report.md` (for people) and `work-items.json` (the same for
agents) to the git-ignored `migration-work/review-summary/`. Rows are merged like the tool merges
them (newest per item and kind); test reviewers are left out (`--include-tests` keeps them); every standard page is read for
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

It saves one status per reviewer row of the item (or only `--refs`) in the review backend (its
private `admin status`): reviewer `AOE`, kind `status:<kind>` on the
reviewer's own item, value `{ state, release, reason, workItem, commit }`. The tool shows it under
the comment or QA note ("AOE: done in r1 · image column widened"), the results page in an AOE
column (AOE rows are no reviewer there), and the next summary per row (mixed states = "partly").
`open` takes a status back. Decisions get no status here: the apply step will record what it
applied. `release` is free text; the commit is recorded with every status.

Tests: `node tools/review/test/summary.test.mjs` (the sample `test/sample-rows.csv`, made-up
feedback on real standard pages, from `test/sample-rows.mjs`); the whole loop on the backend
(reviewer → summary → AOE status → reviewer replies → the AOE team answers in the tool → the
reviewer resolves → results page): `backend/test/tool.test.mjs`.

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
