# Review backend (App Builder)

The review tool's store for the final scope (plan: `../backend-plan.md`): reviewers without an
Adobe ID save with an **invitation link**; the state per page and block lives in App Builder.
Project "Stryker std review": the live review on the **Production** workspace
`892544-strykerstdreview` (since 24 Nov 2026), tests on **Stage** `892544-strykerstdreview-stage`
(below). The scripts and tests on this machine find it in
`target.mjs`; the move itself: `move.mjs` (DATABASE.md, "The move to Production").

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
