# Review backend (App Builder)

The review tool's store for the final scope (plan: `../backend-plan.md`): reviewers without an
Adobe ID save with an **invitation link**; the state per page and block lives in App Builder.
Project "Stryker std review": the live review on the **Production** workspace
`892544-strykerstdreview` (since 24 Nov 2026), tests on **Stage** `892544-strykerstdreview-stage`
(below). The scripts and tests on this machine find it in
`target.mjs`; the move itself: `move.mjs` (DATABASE.md, "The move to Production").

## Source change history (pilot on Stage, 24 Nov 2026)

What the capture does today on Production: every 15 minutes, the **first** shot of a page just
published (none yet) and the AOE team's Refresh requests; a page with its shot is never shot
again by itself. A set (1440 / 860 / 375) is ~0.2 MB (max 0.3).

The pilot of a **daily change check** (the user's request: a history of every change to the
sources, to tell a source change from a migration fault): every day each source page's
**content fingerprint** (`lib/fingerprint.mjs`), screenshots only for a confirmed change.
Measured on 50 pages of every template (`test/change-bench.mjs`, capture op `bench`, results
archived in `.cbr/archives/change-pilot-2026-11-24.tar.gz`):

| Per page | Content check (lite: no images, media, fonts) | Full load | + visual fingerprint |
|---|---|---|---|
| Real time (5 runs in parallel, 4 pages each) | ~0.3 s | ~0.8 s | 1.4 – 7.5 s |
| Backend time | ~0.95 s | ~1.9 s | 2.8 – 9 s |
| GB-seconds (2 GB) | ~1.9 | ~3.8 | 5.6 – 18 |

- JavaScript off (~0.5 s) misses content some pages build in the browser: not used.
- **Noise:** two loads of a page differed on 2–5 of 49 pages, every cause found and fixed:
  Dynamic Media players' `blob:` addresses, their own menus, their asset name (taken from the
  component's `data-asset-path` instead), Marketo forms arriving late (counted by form number).
  What remains is absorbed by **variants** (the first check loads a page 3 times, every
  version of a part seen counts as known) and a **confirming load** (a part counts as changed
  only when never seen and the same on a second load): 0 false changes in 196 daily checks.
- **Capture runs one per container** (`concurrency: 1`): runs sharing a container shared its
  CPU (~10x slower per page); the browser is unpacked once per container (several runs
  unpacking it at once: `spawn ETXTBSY`).
- The visual fingerprint needs every image and video: at 20 pages at once stryker.com slowed
  down (one page timed out after 90 s), and it showed 1 false difference in 40 pages: so it
  runs once a week, spread out, one page at a time, and a difference is confirmed by a second
  load (below).
- **Tried and dropped (24 Nov 2026): the files' ETags / dates as triggers.** The CSS / JS files'
  versions (release stamp, size) change with any edit, even a comment, and say nothing about
  which pages look different: as a trigger they would mark every page using a file as changed.
  (Measured on the way: every HTML / CSS / JS file and image answers with an ETag; the same CSS /
  JS file has a different ETag on each stryker.com server, only its size part steady; Dynamic
  Media images' ETags change when a rendition is regenerated, their dates don't.)

### The daily check (built 24 Nov 2026; pilot on Stage, 50 pages, from the night of 25 Nov)

`lib/changes.mjs`, capture op `check`, schedule `review-check` (Stage only: every 5 minutes from
01:00 to 03:55 UTC; `admin schedule {"only":["check"]}`). Each run checks the pages of the
check's list (`admin changes-scope`) not checked today, one at a time, with a pause:

- **Every day: the content.** One lite load (no images, media or fonts, ~1 s): the content
  fingerprint; a part never seen counts only when a confirming load shows the same new content
  (the variants of dynamic parts are learned). For all 2,553 pages: ~45–60 minutes a night.
- **Once a week, spread out: the look.** Each night the pages whose night it is (a hash of the
  path picks one of 7; then every 7 days): one full load at 1440 (~3–5 s) and its visual
  fingerprint (a difference hash per screen of 900 px, videos / embeds / carousels hidden),
  compared with the look of the page's last shot; different above 10 bits of 64 in a screen (or
  a height change of more than a screen) on a confirming load too = a change. About 365 pages a
  night for the full scope: ~20–30 minutes more.
- **Screenshots** (the usual three widths, ~15 s a page, in the page's shot history, labelled in
  the tool): only when the page's history starts and it has none yet, and on a confirmed change
  (content or look). With each shot its look is stored, the one the next visual check compares.
- **Records**: each page's `changes/pages/<b64>.json` (one log line a day: baseline, unchanged,
  variant, changed, unreachable, gone after 3 days; the day's visual result: baseline, same,
  noise), the runs in `changes/site.json` (timings, counts). `admin changes-page {page}` /
  `changes-site`.
- **What changed:** each page's record keeps its latest content (the parts' text, images, links,
  embeds); a change or a variant logs a short diff: per part, the text around the difference
  before and after, images / links / embeds added and removed. (The pilot's first two "changes",
  25 Nov, showed screenshots identical to the first ones: invisible differences, most likely a
  link's address; without the content they could not be told. Kept from then on.)
- **Cost** (App Builder counts memory x duration; one pack: 6 million GB-s a year, ~16,400 a
  day; the user, 25 Nov 2026: the pack is this backend's alone, the Live warm-up stays 24/7 for
  India, EU and US): the check runs in its own **1 GB** action `check` (the capture's code; the
  capture and the Live copies keep 2 GB), **2 pages at a time** (each with its pause). Measured
  on the 50 pilot pages: a quiet day 1.2 GB-s a page (50 in 60 s), with 3 first histories and 3
  shots 2.15. For 2,553 pages: content ~3,100–3,500 a day, the weekly visual ~1,800, shots for
  changes ~600, Production as it is ~2,100 (Live warm-up ~1,600, capture ~460): ~7,600–8,000 a
  day, ~2.8 million a year, about half the pack; the histories' start ~57,000 once.
- **Redirects:** a source that sends visitors to another address (e.g. `/us/en/about/news.html`
  → `/us/en/about/news/index.html`) is not a failure: its own state, `redirects`, kept daily; a
  redirect that starts (on a page that had content), changes target or ends is a change (an
  ended redirect: a shot). The scope table's pairs are never changed by this: both
  `news.html → /us/en/about/news` and `news/index.html → /us/en/about/news/` stay as they are
  (the tool works from the table's explicit pairs; the EDS rule: a path ending in / is the
  folder's index page, one without is the page of that name).
- **The status page** (AOE) lists the sources that redirect and those not reachable, from the
  check's own summary (`site.json` `sources`, kept by each run: no page record read there).
- **Gentle with stryker.com:** after many hundreds of loads in one afternoon (up to 20 at once),
  stryker.com answered 404 to about half of the pages on Stage, on and off (Production's loads
  were fine). So: one page at a time with a pause; a 404 is tried again at the end of the run
  and only then counts as unreachable; three 404s in a row stop the run (the pages stay due).
- The tool: the Source shot box says since when the content is checked daily, when the look was
  last compared, what the last check found and how many changes were recorded; each shot is
  labelled with why it was taken.
- Test: `test/changes-live.test.mjs` (two test pages: history starts with a shot and its look,
  unchanged, a real change by switching one test page's source, the visual check forced: the
  same, no shot; purged after).

## Two workspaces: Production (the live review) and Stage (tests)

Since 24 Nov 2026 (`target.mjs`):

| | Production `892544-strykerstdreview` | Stage `892544-strykerstdreview-stage` |
|---|---|---|
| What | the live review: customers, the AOE team, real data | the test workspace: test data only |
| Runtime key in Settings | host `runtime.adobe.io` | host `adobeioruntime.net` |
| Signing key | its own (every real invitation) | its own: a Stage invitation is refused on Production and the other way round |
| Schedules | capture every 15 min, live warm-up, daily backup | none (a test starts a capture itself) |
| Shots | the real history | a copy of Production's (`seed-stage.mjs`, run again to refresh) |
| Tool | the reviews' branch previews and main (`client-review-v3`, `standardise-v3`, `main` on .aem.page / .aem.live) | every other host: feature-branch previews, the local preview; a small "Stage backend: test data" label on every page |

The tool chooses by host (`config.js`); `?backend=stage` or `?backend=production` chooses for this
browser on that host until changed (the host's own choice again clears it). Invitations made on
Stage carry `backend=stage` in their link, so they open the tool on Stage from any host.

The scripts: **deploys and the test suites go to Stage** by default; the everyday operations
(`admin.mjs`, `set-status.mjs`, `summarise.mjs`, the shot scripts) act on **Production**.
`REVIEW_TARGET=stage|production` points them all at one workspace; `--ns` names one.

### Releasing a change

1. Build it on a branch; `node tools/review/backend/deploy.mjs` (Stage).
2. Both reviews' tests on Stage (the client review's on its local preview, the standard
   review's on its own; README "Tests"), and a look in the tool on a feature-branch preview or
   with `?backend=stage`.
3. `node tools/review/backend/deploy.mjs --production`: the same code to the live review.
4. A smoke test there: `REVIEW_TARGET=production node tools/review/backend/test/backend.test.mjs`
   and `… spaces-live.test.mjs` (test pages and test invitations only, cleaned up after), then
   `admin.mjs forget-test-invites`.
5. Tool-side changes (the tool's own files) reach reviewers when the branch is pushed; push the
   backend first when the tool needs the new backend.

| Action | Kind | What |
|---|---|---|
| `state` | web | `GET ?page=` + header `x-review-invite` → `{ reviewer, scope, expires, rows }` (the page's entries and every group choice, AOE statuses among them) |
| `save` | web | `POST { page, changes: [{ page?, item, kind, value, rev }] }` + header `x-review-invite` → per change saved / conflict |
| `results` | web | `GET` + header `x-review-invite` (an invitation with the results right) → every entry in its scope and every group choice, for the results page |
| `overview` | web | `GET` + header `x-review-invite` (any invitation) → every page with entries in its scope and its state (`lib/states.mjs`), for the status page |
| `admin` | private | `setup`, `invite`, `revoke`, `invites`, `export`, `answer`, `status`, `import`, `rekey`, `audit`, `purge-invite`, `purge-test` (see the action's header) |

- **Web actions** answer `https://892544-strykerstdreview.adobeioruntime.net/api/v1/web/std-review/<name>`;
  CORS only for the branch previews, `preview-aemcoder.adobe.io` and localhost. Every call needs a
  valid, unexpired, unrevoked invitation; the reviewer's name comes from it; the page must be in its
  scope (path prefixes; group choices only with the group right).
- **The private action** can only be called with the workspace's credential, which the
  environment adds (Settings, Basic: Production's on host `runtime.adobe.io`, Stage's on
  `adobeioruntime.net`; one key per host, the same Runtime API on both).
- **Storage** (`lib/core.mjs`, `lib/dbstate.mjs`, `DATABASE.md`): App Builder Database, one
  document per page of a review (`pages`, `_id` `<space>|<page>`, page `*` the group choices),
  each entry a field `{ v, by, at, rev, inv, role }`; invitations in `invites`. The backend still
  names entries `p.<page>.<item>.<kind>` / `g.<item>.<kind>` (parts base64url, space as prefix)
  and invitations `i.<id>` (exports, backups, admin). Files: the signing key
  (`secrets/signing.json`, created by `setup`, never returned), the audit, one file per save
  batch (`audit/<date>/…`), and the daily backups.
- **Conflicts:** a change carries the `rev` it started from; another stored `rev` = someone else
  changed it meanwhile: refused (by the database, inside the write), the tool drops the change
  and asks to reload.
- **Roles:** an invitation is for a reviewer (default) or the AOE team (`role: aoe`: answers
  threads with a status, results on); every entry records its writer's role.
- **Chats:** messages `reply:<comment|note>:<id>` are written once; only the AOE role gives a
  status (`core.mjs replyProblem`); either side ticks Done (`done:<comment|note>`, true / false).
- **Page status** (kind `state` on item `page`): reviewers in-review / waiting-aoe / approved /
  skip, the AOE team waiting-customer (`threads.js` STATES_BY_ROLE, `core.mjs stateProblem`).
- **Everyone sees every message**; the page status decides whose turn it is (`../threads.js`).
- **Limits:** reviewer kinds `variant`, `width`, `background`, `text`, `comment`, `reviewed`,
  `note`, replies; values up to 20 KB; 100 changes per save.

## Use

```
node tools/review/backend/deploy.mjs [--only state,save,admin] [--dry-run]
node tools/review/backend/admin.mjs invite --name "Jane Doe" --paths /us/en/foot-and-ankle --days 30 [--page /us/en/…] [--no-groups] [--results]
node tools/review/backend/admin.mjs invite --name "Iustin" --paths / --days 90 --role aoe      # an AOE team member
node tools/review/backend/admin.mjs invites | revoke --id <id> | purge-invite --id <id> | export
node tools/review/backend/admin.mjs audit --json '{"date":"2026-11-17","page":"/us/en/…"}'   # who changed what, before / after
node tools/review/backend/test/backend.test.mjs     # the actions (test page /test/backend, cleaned up)
node tools/review/backend/test/states.test.mjs      # the shared rules: page statuses, chats, Done
node tools/review/backend/test/status.test.mjs      # the status page in a browser (pages without entries only)
node tools/review/backend/test/tool.test.mjs        # the whole loop in a browser (local preview): reviewer → summary → AOE status → reviewer, results;
                                                    # only on a page nobody has saved anything on (it never touches a reviewer's entries)
```

`deploy.mjs` bundles each action into one file with esbuild; the libraries (`package.json`) are
installed outside the project, in `/tmp/run-outputs/review-backend-deps` (again after a workspace
restart, automatically). The invitation link opens the tool on the branch preview; the tool keeps
the token in the browser and removes it from the address bar. With the results right
(`--results`) the invitation also gives a results page link. The backend is the tool's only store
since 2026-11-17 (the pilot's Google Sheet route is retired).

## Spaces (2026-11-23)

The backend serves two reviews that share page paths: the standard pages (`std`) and the client
review of the migrated pages on main (`main`). An invitation's scope names its space
(`scope.space`; none = `std`); `state`, `save`, `results` and `overview` read and write only that
space. Keys: `std` as before (`p.…`, `g.…`, audit files `audit/…`), other spaces prefixed
(`main.p.…`, `main.g.…`, `main/audit/…`), so neither space's patterns match the other's keys. The
admin action works in `params.space` (default `std`) for every op; `invite` also takes `host` (the
tool on a branch preview before its merge); `invites` lists every space unless one is named.
Tests: `test/spaces.test.mjs` (the key rules), `test/spaces-live.test.mjs` (deployed: a main
invitation sees only main; test page, cleaned up).
