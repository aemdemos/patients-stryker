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
| `index.html`, `review.css` | The shell: toolbar (page, desktop / phone, flip / overlay / side by side, sync, reviewer name), the page view, two panels that fold to a strip (kept per browser): **Designs on this page** on the left (blocks and text sections with their design switches, links that open the page versions in a new tab) and **Feedback** on the right (the page status banner and its buttons, Comments on this page, QA notes, their chats; resizable) |
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
| `RUNBOOK.md` | **Start here in a new session**: backstory, where everything is, credentials, operations, writing into DA, recovery |
| `da/` | Uploading `/std` documents to DA, checking them, previewing them on a branch (only on the user's request; RUNBOOK section 8) |
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

## Page status and chats (`threads.js`)

The back and forth between the customer's reviewers and the AOE team happens in the tool, not in
calls. The rules are one shared module, `threads.js`, used by the backend, the tool, the results
page and the summary.

- **The page status says whose turn it is**, shown as a coloured banner at the top of the Feedback
  panel (with who set it) and as a badge in the toolbar. Reviewers set **In review**, **Send to the
  AOE team** (Waiting for the AOE team), **Approve** and **Skip: don't migrate**; the AOE team sets
  **Send back to the customer** (Waiting for the customer). Pressing the current one clears it.
  Shown: Not reviewed yet (gray, nothing yet), In review (yellow, also any activity), Waiting for
  the AOE team (red), Waiting for the customer (blue), Approved as is (light green, never any
  feedback) / Resolved (green, after feedback), Skipped (black). The older reviewed mark counts as
  approved.
- **Chats**: every comment (block, text section, page) and QA note is a chat, WhatsApp-like: the
  newest message at the bottom, mine on the right, everyone else's on the left, each with its
  author (AOE badge); everyone sees every message. The first message on a block, section or the
  page is the comment itself. A block's chat opens with one click, its message box focused; Send
  or Ctrl+Enter. The AOE team may add a status to a message (in progress, done, won't do, open
  again; a release) for the summary's work items.
- **Done**: either side ticks a chat Done when it is dealt with (unticks it again); a QA note's
  Done is its resolved pin. The status page counts open and done chats.
- **Everything waits for Save**: messages, the page status, Done ticks, notes and design choices
  are unsaved changes (marked "unsaved", × removes a message) until Save; Undo changes takes them
  back. The panels keep their place when a chat redraws; the right panel resizes by dragging its
  left edge.
- Entries: messages `reply:<comment|note>:<id>` (written once), value `{ text, status }`; Done
  `done:<comment|note>` (true / false); the page status `state` on item `page`. Older data: a
  chat closed with `action: resolve` counts as done; `status:<kind>` rows as AOE statuses.
- `set-status.mjs` (many rows at once) writes AOE messages with a status (`admin answer`, `--by`
  the name; `--send-back` also sets those pages to Waiting for the customer). The summary gives
  every piece of evidence its chat (done, messages, last writer, latest status).
- **Mentions** (`@name` emails to invited people): planned, waiting for an email service.

## Status of every page (`status.html`, `status.js`, `status.css`)

Where each page stands in the back and forth, for the reviewers and the AOE team alike: every
page of the invitation's scope (`pages.json`, now with each page's template), filtered by
template, business unit, state, search and "only new since my last visit"; links into the tool.
The states come from the web action `overview` (`threads.js`), each a colour **and** a label,
worded for the viewer:

| State | Colour | When |
|---|---|---|
| Waiting for the customer | blue | the AOE team sent the page back to the customer |
| Waiting for the AOE team | red | a reviewer sent the page to the AOE team |
| In review | yellow | marked In review, or any activity |
| Resolved | green | approved after feedback (chats or design choices) |
| Approved as is | light green | approved, never any feedback |
| Not reviewed yet | gray | nothing yet |
| Skipped: not migrated | black | a reviewer chose "Skip: don't migrate" |

Order "what waits for me first": reviewers see blue, red, yellow, green, light green, gray, black;
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
(reviewer: page chat, Send to the AOE team, a design switch → summary → set-status sends it back
with a status → the reviewer answers and sends it again → the AOE team writes with a status and
sends it back in the tool → the reviewer ticks Done and approves: resolved → results page): `backend/test/tool.test.mjs`;
the shared rules: `backend/test/states.test.mjs`.

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

## Shared with the client review (ported 23 Nov 2026)

The tool's code is the same on both branches; `config.js` is the one file that differs (here:
space `std`, the standard page under `/std`, compared with as-is or the source, the design
panel on, Desktop and Phone, flip by default, pages from `pages.json`, snapshots in
`/review-snapshots`, the tool on `standardise-v3`). The backend is one (both spaces); deploy it
from either branch: its code is the same. The sections below come from the client review's
README.

### The status page (customer and AOE team)


One page for both sides (`status.html`, opened with the review link, or from the tool's
"Review status of every page"): what it shows depends on the invitation. **The customer**
(reviewer invitations) sees the published pages of its review with their states, batches,
groups and filters, worded for its side; **the AOE team** also gets the organising box, the
Migration scope box, "Not published yet", Edit in DA and Invitations. The backend refuses the
AOE team's operations to reviewers anyway. Pages open in a new tab. **The page keeps its state
on refresh** (in the browser): the picked status tiles, search, template, state, order, "only
new", how many rows are shown and the scroll position; the batch, group, representatives and
area filters are shared with the tool; "new since my last visit" counts from the tab's first
load, so a refresh isn't a new visit.

### Review batches and filters (`batches.js`)


The AOE team splits the pages into numbered **review batches** (one batch per page) and works
through them one by one; everyone filters by batch and by area.

- **Marking** (AOE invitations, status page, "Mark pages for a batch"): paste the pages, one per
  line (client URLs `https://www.stryker.com/us/en/….html`; this site's URLs and paths work too),
  give the batch number, **Mark for this batch**; **Take them out of their batch** unmarks them;
  **Use the pages shown** fills the list with what the filters show. Lines that are no page of the
  review are listed back, never guessed (the page name: the importer's cleaned segments, `.html`
  and `/index` dropped). Marking moves a page out of any other batch.
- **Filters:** batch chips on the status page (several at once; none = all; "No batch"), the
  Filter popover by the tool's page picker (batches and area); the page picker, the count and
  page stepping go through the filtered pages. The chosen filters are kept in the browser, the
  same for both pages. The status page also shows each page's batch and area; the tool shows the
  page's batch by its status badge.
- **Data:** kind `batch` on item `page` (a number 1–999, or null), saved by the AOE team only
  (the backend refuses reviewers), several pages in one save, the newest wins (no rev check).
  Organisation data, not review activity (`threads.js` ORG_KINDS): it never changes a page's
  state, threads, latest activity or "new". The overview action returns each page's batch.

### Groups and representative pages

(Groups here are the AOE team's page groups for the review, not the design panel's "groups" of blocks like this.)


**Groups** are pages of exactly the same structure (called groups, not templates: "template"
means something else here), numbered, one group per page. Each group has one **representative
page**: the only page the customer reviews, to approve the whole group. Set by hand, like batches:

- **Marking** (AOE, status page, "Organise pages: batches and groups"): choose **Group**, give the
  number, paste the pages, **Mark** (or **Take them out**). A page moved to another group (or
  out) is no representative any more. **Make the representative of its group**: each pasted page
  becomes its group's representative and the group's earlier one is one no more; pages in no
  group, or two pages of one group in the list, are refused with the reason.
- **Filters:** Group (one group, or "In no group") and **Representative pages only** on the status
  page and in the tool's Filter popover (kept with the batch and area filters). The status page's
  Batch / group column and the tool's badge show "Batch 2 · Group 5 ★" (★ = the representative).
- **Data:** kinds `group` (a number 1–999 or null) and `representative` (true / false) on item
  `page`, AOE only, newest wins; organisation data, no review activity. A page is only a
  representative while it is in a group. The overview action returns `group` and `representative`.
- **The representative is a suggestion** (user, 23 Nov 2026): chosen or changed any time, or
  none; a group without one has its **first published page** (path order) as representative,
  shown ☆ ("Group 5 ☆"; ★ = chosen) and counted by "Representative pages only".
- **Approving one page approves its group:** when a page of a group is approved, every other page
  of the group shows "Approved with its group" (status page, tool); those not reviewed yet or in
  review count as approved, the others keep their own state too (`withGroupApproval` in
  `threads.js`, used by the overview). Derived, nothing written: a page moved out of the group
  leaves the approval.

**Changing it** (status page, AOE team), besides the paste box:
- **A page's row:** **Edit** in its Batch / group cell: the batch, the group, "Representative
  of its group"; an empty number takes the page out. Save or Cancel.
- **Several pages:** tick them (the header's tick: every page shown); the selection bar moves
  them to a batch or a group, takes them out of their batch or group, makes them the
  representatives of their groups (one per group) or clears that.
- **Groups and their representatives:** every group with its pages; choose its representative
  from its pages, or **None chosen** (its first published page stands in, ☆); **Take out** a
  page of the group (its page list stays open while you work).
- Every change is saved at once and kept in the audit; the message under the selection bar
  says what was done once the page shows it.

### Edit in Document Authoring (AOE team)

Here the link opens the standard page's document (`/std/…`).


AOE invitations get a link to the page's document in the DA editor: "Edit in Document
Authoring" in the tool's Feedback panel ("Open in a new tab") and "Edit in DA" next to each page
on the status page. `editUrl(path)` (`pages.js`): `config.edit` + the base prefix + the path (a
folder's page: `…/index`). Reviewers don't see the links; editing needs DA rights anyway. A page
whose document is no longer in DA (it is still published) opens an empty document: don't save it
there by mistake.

### Invitations (AOE team)


The **Invitations** page (`invites.html`; linked from the status page's bar and the tool's
"Open in a new tab", AOE invitations only) lets the AOE team manage the invitations of its own
review without the developers (backend web action `invites`, `backend/lib/invites.mjs`, shared
with `backend/admin.mjs`):

- **Make** an invitation: name (or email), role (reviewer, or AOE team: the AOE team always has
  the results page), valid for 1–365 days (default 90), the results page for a reviewer, and the
  pages (path prefixes; default and limit: the AOE's own invitation's pages). The link points to
  the tool on the host the page was opened on (the branch preview before the merge, then main).
  **The link is shown once**: the backend keeps no tokens, and nobody can see or copy another
  person's link later (a link is that person's identity in the review). Lost link: revoke it and
  make a new one.
- **List**: every invitation of this review (another review's never), newest first: name, role,
  pages, made when and by whom, valid until, state (active, expired, revoked: when and by whom);
  revoked and expired ones on request; search by name.
- **Revoke** any invitation of this review except one's own, in two steps (Revoke → Yes, revoke):
  the link stops working at once, for good. The invitation stays listed as revoked.
- Every make and revoke is in the review's audit (who, when, which invitation; never a token).

Developers can still use `backend/admin.mjs invite | invites | revoke` (made "by admin"). Test
invitations (names `tool test …`, `zz-test-…`) are removed from the lists after revoking with
`admin.mjs forget-test-invites`; nobody else's ever are.

### The review backend and its spaces


One App Builder backend (project "Stryker std review", **Production** workspace `892544-strykerstdreview` (since 24 Nov 2026; Stage,
`892544-strykerstdreview-stage`, ran it before and is frozen: it refuses writes with "moved")) serves both reviews. An invitation's scope names its **space**;
the actions read and write only that space's entries:

- `std` (no space named, the invitations of before): keys `p.…` / `g.…`, audit files `audit/…`.
- `main`: keys `main.p.…` / `main.g.…`, audit files `main/audit/…`.

The admin action takes `--space` on every op (default `std`). Invitations (the credential is the
workspace's, in Settings):

```
node tools/review/backend/admin.mjs invite --space main --name "Jane Doe" --paths /us/en --days 30 [--results] [--host client-review-v3--stryker-com--strykerenterprise.aem.page]
node tools/review/backend/admin.mjs invite --space main --name "AOE_name" --paths / --days 90 --role aoe
node tools/review/backend/admin.mjs invites --space main
node tools/review/backend/admin.mjs export --space main
```

`--host` points the link at another preview (a branch before its merge). Treat links like
passwords. Deploy after backend changes: `node tools/review/backend/deploy.mjs` (both reviews use
it: keep std's keys and behaviour unchanged).

### Source shots and their history

This review's first shots (two widths) are in DA `/review-snapshots` and in `snapshot-meta/`; they are not in the backend's history yet (record them with `record-shots.mjs --space std` from their capture folder to give them a history and Refresh). Until then the tool shows them from `snapshot-meta/`.


A **shot** is a snapshot of the source page (www.stryker.com) at one width (1440, 860, 375):
JPEG tiles (4000 px) and the text / image anchors of the live page (`shoot.mjs`; ALTCHA, the
cookie banner and trackers blocked). One capture of a page at every width is a **version** of
its shot history.

**The history is evidence: kept back to the first shot, never changed, never removed.**
- Every version is kept with the date and time each width was taken, the source URL, the HTTP
  status and final URL (from the second version on), who asked for it and when, when it was
  recorded, and the **SHA-256 of every tile**.
- It lives in the backend's file store (`backend/lib/shots.mjs`, `<space>/shots/<page>.json`),
  not in its entry store (entries there expire after a year at most). The backend refuses a
  version whose id is there already, and has no operation that removes a real page's shots
  (`purge-test` removes `/test/…` pages only).
- The tiles are in Document Authoring: the first shots at `<folder><page>/<width>/<n>.jpg`, later
  ones at `<folder><page>/<shot id>/<width>/<n>.jpg` (id `s-YYYYMMDD-HHMMSS`, UTC). Uploads never
  go over a file that is there already. **To check a tile**, compare the SHA-256 of the
  original in Document Authoring (`admin.da.live/source/…`) with the history: the preview serves
  a re-optimised copy, whose hash differs.
- The first shots (23 Nov 2026, 568 pages × 3 widths, 1,964 tiles) were recorded with
  `record-shots.mjs` after every tile was checked against its original in Document Authoring
  (all identical).

**In the tool** (Feedback panel, "Source shot"): the history, newest first (first shot and
newest marked), the shot's date and source URL; an earlier shot can be shown (the source tag
says so). The AOE team's **Refresh source shot** asks for a new shot (backend action `shots`,
one open request per page, kept in the backend's audit). The request shows in the box until the
new shot is there, or with the reason it failed (then **Ask again**). Pages without a first shot
can't be refreshed (see *Planned*).

**Taking the requested shots** (writes to Document Authoring: only when asked to):

```
node tools/review/refresh-shots.mjs --out <dir> --space main --ref <branch>   # every pending request
node tools/review/refresh-shots.mjs --out <dir> --dry-run                     # capture only, nothing written
```

Per request: a new shot at every width from the newest version's source URL, the tiles to DA
(each read back and its hash compared), previewed on the branch, the version into the history
(closing the request); a failure is recorded on the request with its reason.

**The first shots** (a new review, or pages added to it):

```
python3 -I tools/review/snapshot-map.py <query-index.json> .migration/xf-mapping <map.json>   # page → source URL (export file names)
node tools/review/capture-snapshots.mjs --map <map.json> --out <dir>                            # 1440, 860, 375
bash tools/review/upload-snapshots.sh <dir> <branch> <log> review-snapshots-main               # tiles to DA + preview, only on request
node tools/review/record-shots.mjs --dir <dir> --space main [--verify <path → sha256 of DA originals>]  # the first versions
python3 -I tools/review/pack-snapshot-meta.py <dir> tools/review/snapshot-meta                  # the tool's fallback without the backend
```

The source URLs come from the export file names (letter case kept), never from EDS paths.

### Migration scope and published pages

**Client review only** (space `main`): this review has no scope table; its pages are `pages.json`.


The review's pages come from the **migration scope table** in Document Authoring,
`review/migration-scope` (a sheet: `source` = `https://www.stryker.com/….html`, `eds` = the EDS
path, `template` = the AEM template), together with the **live query index** (the published
pages). The backend's `pages` action reads both (the previewed sheet: edit it in DA, then
**preview** it) and checks the table.

- **Reviewers** see the pages of the scope that are **published**. A page published later joins
  by itself, "Not reviewed yet"; the filters (batch, group, template, area) count the published
  pages.
- **The AOE team** sees the whole scope on the status page ("Not published yet" for the others)
  and organises batches and groups on all of it. The **Migration scope** box lists: pages
  published but not in the table, rows of the table to correct (a source or an EDS page in two
  rows, an address that isn't a stryker.com page), sources to correct (a first shot failed: the
  source answers 404 or redirects to another page), pages waiting for their first shot, the
  capture's last run and its browser check.
- The table started (23 Nov 2026) with all 2,553 pages of the migration catalog
  (`scope-sheet.py`): the 568 pages with a first shot keep their known pair, the others have
  their EDS path by the importer's rule (renamed pages: change the row). The AOE team removes
  what is out of scope. A local copy is in the workspace (`content/review/migration-scope.json`).

### Live: the source page, rendered now

**Live** (next to Source) shows a **live copy of the stryker.com page**, rendered on request by
the backend's browser (action `live`) at the width being viewed, next to the page under review,
synced by text like the as-is page.

- **Why a copy:** stryker.com refuses to be shown inside another site (`X-Frame-Options:
  SAMEORIGIN`, a strict CSP) and answers 404 to every request that isn't a real browser, so the
  page can't be framed or fetched directly. The backend's browser (which loads it as for the
  shots) gives its rendered page with **every script removed** and a `<base>` to stryker.com;
  the reviewer's browser loads its stylesheets, images and fonts from stryker.com (its fonts
  allow any site). Shown in a same-origin frame (a blob URL, sandboxed, no scripts), so the sync
  reads it like the as-is page.
- **What it is not:** not clickable as on stryker.com (menus, tabs, carousels stay as rendered;
  a link opens the real page in a new tab), and **not evidence**: the dated shots are. No
  analytics, trackers or ALTCHA run, so the copy leaves no traces on stryker.com's statistics.
- **Per width:** stryker.com builds some parts with its scripts for each width (the main menu at
  1024 px), so each width is its own copy. A copy is kept 10 minutes (the tag says when it was
  rendered; **Render again** makes a fresh one). Measured: ~5 s the first time (the browser
  starts), ~3 s with a warm browser, instant when kept.
- The source: the migration scope table's (client review), else the newest shot's, else the
  tool's snapshot facts (standard review).
- **How close it is** (measured 24 Nov 2026, `backend/test/live-fidelity.mjs`: the real page in a
  browser vs its copy, 7 pages of 6 templates at 1440 and 375): the same page height and text on
  every page, 0% of pixels different on all but the home page at 1440 (5%: its banner video
  shows its poster frame). Two causes were found and fixed: count-up numbers caught mid-count
  (the backend now waits until the page's text stops changing, at most 4 s: pages with count-ups
  take ~4 s) and videos played from an in-browser stream (now their poster image).
- **What can still differ:** anything moving (videos show their poster, carousels the slide at
  render time, animations their end state); embedded players and widgets in frames (videos,
  maps, Marketo forms) that need their own scripts; parts that depend on the window's height
  (the Live frame is as tall as the pane); content stryker.com varies by visitor (location,
  personalisation: the backend is a first-time visitor without cookies); the page changing
  after the copy was made (kept 10 minutes: Render again). A source that redirects is refused
  (never another page than the one in the table).

### Source shots taken by the backend

**Client review only** for first shots (they follow the scope table). Refresh source shot works for any page that has a shot history.


The backend takes the source shots itself (action `capture`, a browser inside App Builder):

- **First shots:** every 15 minutes (a scheduled trigger, `admin.mjs schedule`) it takes the
  first shot of every published page of the scope without one, with the source from the table,
  within ~15 minutes of the page being published. When the page was first seen published is
  recorded with the shot.
- **Refresh source shot** (AOE team): the request starts a capture at once; the new shot shows
  in the tool within minutes (the tool looks for it by itself).
- **Checks:** the source must answer 200 and not redirect to another page, else the page is
  listed as a source to correct (tried again when its row changes, or after a day); a failed
  Refresh shows its reason in the tool.
- **Evidence** as for every shot: never replaced or removed, the date each width was taken, the
  URL, status, final URL and title, a SHA-256 of every tile. The backend's tiles are in its own
  storage (only the backend writes there) and reach the tool through the `tile` action (a
  redirect to a short-lived read link); the first shots of 23 Nov stay in DA.
- **The browser** (`backend/browser/`): the Runtime container is Debian 10 (glibc 2.28), so
  Chromium is pinned to 133 (the last build with Amazon Linux 2 libraries), with Debian 10's own
  NSS / NSPR shipped in the action (`debian-libs.json`, checked by SHA-256 at deploy). A daily
  browser check reports in the Migration scope box if it stops working (e.g. after a change of
  Adobe's container). Measured: ~15 s per page (three widths), about 14 pages per run.
- Admin: `admin.mjs capture-state --space main`, `admin.mjs schedule --json '{"enabled":false}'`
  (off) or `'{"cron":"*/15 * * * *"}'` (on).

### Storage and speed

The backend keeps the review in two App Builder stores:
- **App Builder Database** (Data Services: Amazon DocumentDB, every write kept on several
  storage nodes; `backend/lib/dbstate.mjs`, `backend/DATABASE.md`): **one document per page**
  of a review, its saved items as fields (a comment, a reply, a page status, a batch number…,
  each `{ v, by, at, rev }`); one document for the group choices, one per invitation. A page is
  read with one request from the primary (it always shows what was just saved), a save writes
  its items in place, and the rev check (someone else changed it meanwhile → a conflict) is done
  by the database inside the write. No end date. Since 24 Nov 2026 (the old State store held
  test data only: copied over, then emptied; its final copy is in Files,
  `backups/state-final/`).
- **Files** (blob storage): what must stay or is large: the audit, the shot history and its
  images, the capture's record, the Live copies, the signing key, the daily backups and the
  **review's summary**.

**The review's summary** (`backend/lib/summary.mjs`, `<space>/summary/overview.json`): every
page's state in one file, so the overview (status page, the tool's batches and groups) reads one
file (~0.1 s) instead of every entry (5 s and more, growing with the review). Saves keep it
current (organisation directly, other changes their page computed again); built again from every
entry when missing, after admin operations that change entries, on the status page's
**Refresh**, and every 15 minutes by the capture's schedule. Each page's part carries the time
it was computed; writers merge by keeping the newer part.

**Backups (the data must not be lost):** Adobe restores deleted database data only
best-effort, so every day at 02:15 UTC (schedule `review-backup`, admin `backup`, ~0.5 s) the
backend writes a full copy of every entry and invitation of both reviews to Files,
`backups/<YYYY-MM-DD>/state.json`, kept. `admin.mjs backups` lists them,
`restore-check --json '{"day":"…"}'` compares one with the store (missing, changed),
`restore --json '{"day":"…","only":["main.p."]}'` puts back the entries missing now (never over
an existing one; audited). The audit (every change with its value before) stays the second
record. `admin.mjs db-stats`: page documents per review, invitations.

**Saving:** changes are written 20 at a time (the changes to one item in their order), each
with its rev check; organisation changes (batches, groups, representatives: the newest wins) go
to the database in bulk, 500 a call, without reading first (their value before, for the audit,
comes from the summary), up to 3,000 a request. Measured 24 Nov 2026: 220 pages moved to a batch
in ~0.5 s (State: ~3 s, at first ~8.5 s), a single change ~0.15 s, the overview ~0.1 s; six
saves of one item at the same moment: one written, five conflicts.

## Tests of the shared parts

The standard review's own tests stay (`backend/test/tool.test.mjs`, `status.test.mjs`, `test/summary.test.mjs`, `test/blockkeys.test.mjs`). The shared ones:


```
node tools/review/backend/test/states.test.mjs        # the shared rules
node tools/review/backend/test/spaces.test.mjs        # the space keys (link backend/node_modules first, see the file)
node tools/review/backend/test/spaces-live.test.mjs   # deployed: a main invitation sees only main (test page, cleans up)
node tools/review/backend/test/backend.test.mjs       # the actions (std space, test page)
node tools/review/backend/test/shots-live.test.mjs    # deployed: shot history and requests (test page, cleans up)
node tools/review/backend/test/shots-tool.test.mjs <dev server>   # the tool's Source shot box (read only on a real page; test page); the client review's dev server (its shots)
node tools/review/backend/test/invites-live.test.mjs  # deployed: the AOE team's invitations (test invitations, forgotten after)
node tools/review/backend/test/invites-tool.test.mjs <dev server> # the Invitations page and its links
node tools/review/backend/test/scope-live.test.mjs    # deployed: scope pages, a capture by the backend, tiles, group approval (test pages)
node tools/review/backend/test/scope-tool.test.mjs <dev server>   # the scope on the status page, a backend shot in the tool, ☆
node tools/review/backend/test/status-view.test.mjs <dev server>  # the customer's status page (no AOE parts), new tabs, state kept on refresh
node tools/review/backend/test/live-tool.test.mjs <dev server> [page] [space]   # the Live comparison: the copy, fonts, no scripts, sync, links, widths
node tools/review/backend/test/org-edit.test.mjs <dev server> [space] [prefix of 3 pages]   # changing batches, groups, representatives (pages nobody used; purged after)
```

The standard-pages review's browser and summary tests live on `standardise-v3` (they use its
`/std` sample pages).
