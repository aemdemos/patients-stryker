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
| `compare` | `src` only: the source snapshot (as-is `rs` hidden) |
| `design` | off: no design panel (variants, widths, backgrounds, text sets, groups); its "Open in a new tab" links are in the Feedback panel |
| `widths` | Desktop 1440, Tablet 860 (source and EDS both in their tablet layouts), Phone 375 |
| `mode` | side by side (flip and overlay stay available) |
| `pages` | the site's query index `/us/en/query-index.json`, read on every visit: new pages appear at once; fragments left out |
| `snapshots` | Document Authoring `/review-snapshots-main/<page>/<width>/<n>.jpg` through the branch preview; locally `./snapshots` (a git-ignored link to the capture folder) |
| `edit` | the DA editor of the site's content source (`https://da.live/edit#/strykerenterprise/stryker-com`): the AOE team's "Edit in Document Authoring" links (below) |

## Files

| File | What |
|---|---|
| `config.js` | What this copy of the tool reviews (above) and the browser storage keys (`main-review-…`) |
| `index.html`, `review.css`, `review.js` | The shell: page, widths, compare, flip / overlay / side by side, sync; the Feedback panel (page status banner and buttons, comments on this page, QA notes, links); Save / Undo changes |
| `pages.js` | The pages of the review (the query index, else `pages.json`) for the tool, the status page and the results |
| `batches.js` | Review batches, groups and representative pages, and the filters (batch, group, representatives, area) shared by the status page and the tool (below) |
| `sync.js` | Text-matched scroll sync between the page and the snapshot |
| `notes.js` | Pinned QA notes: a click on the page drops a pin tied to the nearest text run or image, so it keeps its place on reflow; category, text, width, open / resolved |
| `store.js` | Saving and loading through the review backend (invitation in the browser, `rev` per change, conflicts refused, pending changes kept until confirmed) |
| `threads.js` | The shared rules: page statuses, chats, Done |
| `blockkeys.js` | Stable keys of blocks (used by the design side; harmless here) |
| `status.html`, `status.js`, `status.css` | Status of every page: colour-coded states, batch chips, filters (area, state, search, new), "waits for me" order; the AOE team's batch and group marking |
| `results.html`, `results.js`, `results.css` | Results for invitations with the results right: progress, comments, QA notes, CSV downloads (no design decisions here) |
| `summary.js`, `summarise.mjs`, `set-status.mjs` | The feedback summary for the AOE team (`migration-work/review-summary-main/`) and statuses back to the reviewers |
| `snapshot-map.py`, `capture-snapshots.mjs`, `pack-snapshot-meta.py`, `snapshot-meta/`, `upload-snapshots.sh` | Source snapshots (below) |
| `backend/` | The review backend on App Builder (`backend/README.md`): invitations, state per page, audit; spaces |

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

## Edit in Document Authoring (AOE team)

AOE invitations get a link to the page's document in the DA editor: "Edit in Document
Authoring" in the tool's Feedback panel ("Open in a new tab") and "Edit in DA" next to each page
on the status page. `editUrl(path)` (`pages.js`): `config.edit` + the base prefix + the path (a
folder's page: `…/index`). Reviewers don't see the links; editing needs DA rights anyway. A page
whose document is no longer in DA (it is still published) opens an empty document: don't save it
there by mistake.

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

## Source snapshots

Per page and width (1440, 860, 375): JPEG tiles (4000 px) and the text / image anchors of the
live page, ALTCHA, the cookie banner and trackers blocked; resumable.

```
python3 -I tools/review/snapshot-map.py <query-index.json> .migration/xf-mapping <map.json>   # page → source URL (export file names)
node tools/review/capture-snapshots.mjs --map <map.json> --out <dir> --widths 1440,860,375
python3 -I tools/review/pack-snapshot-meta.py <dir> tools/review/snapshot-meta                          # the facts the tool reads (committed)
bash tools/review/upload-snapshots.sh <dir> <branch> <log> review-snapshots-main                       # tiles to DA + branch preview, only on request
```

The source URLs come from the export file names (letter case kept), never from EDS paths. New
pages in the index: capture them, pack, upload (on request).

## Planned

- **Refresh a source shot:** capture one page's source snapshot again from the tool.
- **Invitations admin (AOE team):** a page where the AOE team creates, lists and revokes
  invitations itself (name, role, pages, days; the link to copy), instead of `backend/admin.mjs`
  run by the developers. Needs an `invites` right on AOE invitations in the backend's admin
  action, limited to the invitation's space.
- Port spaces, batches, groups and the edit links to `standardise-v3` (its backend code has no
  spaces yet: never deploy the backend from there before that).

## Tests

```
node tools/review/backend/test/states.test.mjs        # the shared rules
node tools/review/backend/test/spaces.test.mjs        # the space keys (link backend/node_modules first, see the file)
node tools/review/backend/test/spaces-live.test.mjs   # deployed: a main invitation sees only main (test page, cleans up)
node tools/review/backend/test/backend.test.mjs       # the actions (std space, test page)
```

The standard-pages review's browser and summary tests live on `standardise-v3` (they use its
`/std` sample pages).
