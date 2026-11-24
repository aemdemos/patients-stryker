# Migrated pages review tool (client review, branch `client-review-v3`)

The customer reviews the migrated www.stryker.com pages **at their final paths on the main
branch** (`/us/en/…`), side by side with a snapshot of the source page, and talks to the AOE
team (Agentic Outcome Engineers) in the tool: page status, page comments, pinned QA notes, each
a chat. Authoring-agnostic: the tool reads the rendered page, so it works whatever system a page
was authored with (colon markers, bracket tags, plain formatting). It never changes documents.
Not part of the site: it runs on preview hosts only (`*.aem.page`, the workspace preview).

The same code is the standard-pages review on `standardise-v3` (design switches, as-is
comparison); **`config.js` is the one file that differs** between the two (see below).

Open with an invitation link:
`https://main--stryker-com--strykerenterprise.aem.page/tools/review/index.html?invite=<token>`
(before the merge: `client-review-v3--stryker-com--strykerenterprise.aem.page`); the browser
keeps the invitation, later visits need no link.

## What this review has (`config.js`)

| Setting | Here |
|---|---|
| `space` | `main`: its entries and invitations in the review backend are its own (the standard-pages review is `std`; never mixed) |
| `base` | the page at its final path on the same host (prefix `''`; the workspace preview proxies those paths to main) |
| `compare` | `src`: the source snapshot, `live`: a live copy of the source page (as-is `rs` hidden) |
| `design` | off: no design panel (variants, widths, backgrounds, text sets, groups); its "Open in a new tab" links are in the Feedback panel |
| `widths` | Desktop 1440, Tablet 860 (source and EDS both in their tablet layouts), Phone 375 |
| `mode` | side by side (flip and overlay stay available) |
| `pages` | the site's query index `/us/en/query-index.json`, read on every visit: new pages appear at once; fragments left out |
| `snapshots` | Document Authoring `/review-snapshots-main/<page>/<width>/<n>.jpg` (the first shots; later ones `<page>/<shot id>/<width>/…`) through the preview; locally `./snapshots` (a git-ignored link to the capture folder) |
| `edit` | the DA editor of the site's content source (`https://da.live/edit#/strykerenterprise/stryker-com`): the AOE team's "Edit in Document Authoring" links (below) |

## Files

| File | What |
|---|---|
| `config.js` | What this copy of the tool reviews (above) and the browser storage keys (`main-review-…`) |
| `index.html`, `review.css`, `review.js` | The shell: page, widths, compare, flip / overlay / side by side, sync; the Feedback panel (page status banner and buttons, comments on this page, QA notes, links); Save / Undo changes |
| `pages.js` | The pages of the review for the tool, the status page and the results: the migration scope and the published pages through the backend (below), else the query index, else `pages.json` |
| `scope-sheet.py` | The migration scope table's first content (from the migration catalog), written once to DA |
| `batches.js` | Review batches, groups and representative pages, and the filters (batch, group, representatives, area) shared by the status page and the tool (below) |
| `sync.js` | Text-matched scroll sync between the page and the snapshot |
| `notes.js` | Pinned QA notes: a click on the page drops a pin tied to the nearest text run or image, so it keeps its place on reflow; category, text, width, open / resolved |
| `store.js` | Saving and loading through the review backend (invitation in the browser, `rev` per change, conflicts refused, pending changes kept until confirmed) |
| `threads.js` | The shared rules: page statuses, chats, Done |
| `blockkeys.js` | Stable keys of blocks (used by the design side; harmless here) |
| `status.html`, `status.js`, `status.css` | Status of every page: colour-coded states, batch chips, filters (area, state, search, new), "waits for me" order; the AOE team's batch and group marking |
| `NEW-PAGES.md` | The design of the migration scope, published pages and the backend's first shots (built 23 Nov 2026), with the facts and decisions behind it |
| `invites.html`, `invites.js`, `invites.css` | The AOE team's invitations: make, list, revoke (below) |
| `results.html`, `results.js`, `results.css` | Results for invitations with the results right: progress, comments, QA notes, CSV downloads (no design decisions here) |
| `summary.js`, `summarise.mjs`, `set-status.mjs` | The feedback summary for the AOE team (`migration-work/review-summary-main/`) and statuses back to the reviewers |
| `shots.js` | The page's source shots in the tool: the history, one version, the AOE team's request for a new one |
| `shoot.mjs`, `snapshot-map.py`, `capture-snapshots.mjs`, `upload-snapshots.sh`, `record-shots.mjs`, `refresh-shots.mjs`, `pack-snapshot-meta.py`, `snapshot-meta/` | Source shots and their history (below) |
| `backend/` | The review backend on App Builder (`backend/README.md`): invitations, state per page, audit; spaces |

## The status page (customer and AOE team)

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

## Migration scope and published pages

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

## Live: the source page, rendered now

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

## Source shots taken by the backend

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

## Review batches and filters (`batches.js`)

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

## Groups and representative pages

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

## Edit in Document Authoring (AOE team)

AOE invitations get a link to the page's document in the DA editor: "Edit in Document
Authoring" in the tool's Feedback panel ("Open in a new tab") and "Edit in DA" next to each page
on the status page. `editUrl(path)` (`pages.js`): `config.edit` + the base prefix + the path (a
folder's page: `…/index`). Reviewers don't see the links; editing needs DA rights anyway. A page
whose document is no longer in DA (it is still published) opens an empty document: don't save it
there by mistake.

## Invitations (AOE team)

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

## The review backend and its spaces

One App Builder backend (project "Stryker std review", Stage workspace
`892544-strykerstdreview-stage`) serves both reviews. An invitation's scope names its **space**;
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

## Source shots and their history

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

## Planned

- Port spaces, batches, groups and the edit links to `standardise-v3` (its backend code has no
  spaces yet: never deploy the backend from there before that).

## Tests

```
node tools/review/backend/test/states.test.mjs        # the shared rules
node tools/review/backend/test/spaces.test.mjs        # the space keys (link backend/node_modules first, see the file)
node tools/review/backend/test/spaces-live.test.mjs   # deployed: a main invitation sees only main (test page, cleans up)
node tools/review/backend/test/backend.test.mjs       # the actions (std space, test page)
node tools/review/backend/test/shots-live.test.mjs    # deployed: shot history and requests (test page, cleans up)
node tools/review/backend/test/shots-tool.test.mjs <dev server>   # the tool's Source shot box (read only on a real page; test page)
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
