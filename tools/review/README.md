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

## Files

| File | What |
|---|---|
| `config.js` | What this copy of the tool reviews (above) and the browser storage keys (`main-review-…`) |
| `index.html`, `review.css`, `review.js` | The shell: page, widths, compare, flip / overlay / side by side, sync; the Feedback panel (page status banner and buttons, comments on this page, QA notes, links); Save / Undo changes |
| `pages.js` | The pages of the review (the query index, else `pages.json`) for the tool, the status page and the results |
| `sync.js` | Text-matched scroll sync between the page and the snapshot |
| `notes.js` | Pinned QA notes: a click on the page drops a pin tied to the nearest text run or image, so it keeps its place on reflow; category, text, width, open / resolved |
| `store.js` | Saving and loading through the review backend (invitation in the browser, `rev` per change, conflicts refused, pending changes kept until confirmed) |
| `threads.js` | The shared rules: page statuses, chats, Done |
| `blockkeys.js` | Stable keys of blocks (used by the design side; harmless here) |
| `status.html`, `status.js`, `status.css` | Status of every page: colour-coded states, filters, "waits for me" order |
| `results.html`, `results.js`, `results.css` | Results for invitations with the results right: progress, comments, QA notes, CSV downloads (no design decisions here) |
| `summary.js`, `summarise.mjs`, `set-status.mjs` | The feedback summary for the AOE team (`migration-work/review-summary-main/`) and statuses back to the reviewers |
| `snapshot-map.py`, `capture-snapshots.mjs`, `pack-snapshot-meta.py`, `snapshot-meta/`, `upload-snapshots.sh` | Source snapshots (below) |
| `backend/` | The review backend on App Builder (`backend/README.md`): invitations, state per page, audit; spaces |

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

## Tests

```
node tools/review/backend/test/states.test.mjs        # the shared rules
node tools/review/backend/test/spaces.test.mjs        # the space keys (link backend/node_modules first, see the file)
node tools/review/backend/test/spaces-live.test.mjs   # deployed: a main invitation sees only main (test page, cleans up)
node tools/review/backend/test/backend.test.mjs       # the actions (std space, test page)
```

The standard-pages review's browser and summary tests live on `standardise-v3` (they use its
`/std` sample pages).
