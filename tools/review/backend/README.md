# Review backend (App Builder)

The review tool's store for the final scope (plan: `../backend-plan.md`): reviewers without an
Adobe ID save with an **invitation link**; the state per page and block lives in App Builder.
Project "Stryker std review", Stage workspace `892544-strykerstdreview-stage` (Production not set up).

| Action | Kind | What |
|---|---|---|
| `state` | web | `GET ?page=` + header `x-review-invite` → `{ reviewer, scope, expires, rows }` (the page's entries and every group choice, AOE statuses among them) |
| `save` | web | `POST { page, changes: [{ page?, item, kind, value, rev }] }` + header `x-review-invite` → per change saved / conflict |
| `results` | web | `GET` + header `x-review-invite` (an invitation with the results right) → every entry in its scope and every group choice, for the results page |
| `admin` | private | `setup`, `invite`, `revoke`, `invites`, `export`, `status`, `import`, `rekey`, `audit`, `purge-invite`, `purge-test` (see the action's header) |

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
- **Limits:** reviewer kinds `variant`, `width`, `background`, `text`, `comment`, `reviewed`,
  `note`; values up to 20 KB; 100 changes per save.

## Use

```
node tools/review/backend/deploy.mjs [--only state,save,admin] [--dry-run]
node tools/review/backend/admin.mjs invite --name "Jane Doe" --paths /us/en/foot-and-ankle --days 30 [--page /us/en/…] [--no-groups] [--results]
node tools/review/backend/admin.mjs invites | revoke --id <id> | purge-invite --id <id> | export
node tools/review/backend/admin.mjs audit --json '{"date":"2026-11-17","page":"/us/en/…"}'   # who changed what, before / after
node tools/review/backend/test/backend.test.mjs     # the actions (test page /test/backend, cleaned up)
node tools/review/backend/test/tool.test.mjs        # the whole loop in a browser (local preview): reviewer → summary → AOE status → reviewer, results;
                                                    # only on a page nobody has saved anything on (it never touches a reviewer's entries)
```

`deploy.mjs` bundles each action into one file with esbuild; the libraries (`package.json`) are
installed outside the project, in `/tmp/run-outputs/review-backend-deps` (again after a workspace
restart, automatically). The invitation link opens the tool on the branch preview; the tool keeps
the token in the browser and removes it from the address bar. With the results right
(`--results`) the invitation also gives a results page link. The backend is the tool's only store
since 2026-11-17 (the pilot's Google Sheet route is retired).
