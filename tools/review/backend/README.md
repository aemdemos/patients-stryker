# Review backend (App Builder)

The review tool's store for the final scope (plan: `../backend-plan.md`): reviewers without an
Adobe ID save with an **invitation link**; the state per page and block lives in App Builder.
Project "Stryker std review", Stage workspace `892544-strykerstdreview-stage` (Production not set up).

| Action | Kind | What |
|---|---|---|
| `state` | web | `GET ?page=` + header `x-review-invite` → `{ reviewer, scope, expires, rows }` (the page's entries and every group choice, AOE statuses among them) |
| `save` | web | `POST { page, changes: [{ page?, item, kind, value, rev }] }` + header `x-review-invite` → per change saved / conflict |
| `results` | web | `GET` + header `x-review-invite` (an invitation with the results right) → every entry in its scope and every group choice, for the results page |
| `overview` | web | `GET` + header `x-review-invite` (any invitation) → every page with entries in its scope and its state (`lib/states.mjs`), for the status page |
| `admin` | private | `setup`, `invite`, `revoke`, `invites`, `export`, `answer`, `status`, `import`, `rekey`, `audit`, `purge-invite`, `purge-test` (see the action's header) |

- **Web actions** answer `https://892544-strykerstdreview-stage.adobeioruntime.net/api/v1/web/std-review/<name>`;
  CORS only for the branch previews, `preview-aemcoder.adobe.io` and localhost. Every call needs a
  valid, unexpired, unrevoked invitation; the reviewer's name comes from it; the page must be in its
  scope (path prefixes; group choices only with the group right).
- **The private action** can only be called with the workspace's credential, which the
  environment adds (Settings, host `adobeioruntime.net`, Basic).
- **Storage** (`lib/core.mjs`): State store entries `p.<page>.<item>.<kind>` / `g.<item>.<kind>`
  (parts base64url), value `{ v, by, at, rev, inv }`, written with the one-year expiry; invitations
  `i.<id>`. Files: the signing key (`secrets/signing.json`, created by `setup`, never returned)
  and the audit, one file per save batch (`audit/<date>/…`): the durable record the store can be
  rebuilt from.
- **Conflicts:** a change carries the `rev` it started from; another stored `rev` = someone else
  changed it meanwhile: refused, the tool drops the change and asks to reload.
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
