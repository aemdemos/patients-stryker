# Review backend on App Builder: plan (2026-11-17)

Replaces the pilot's saving route (Adobe form submission service → Google Sheet) with an App
Builder backend for the final scope: every corp template, reviewers without Adobe IDs, the AOE
team's work items as report + file (`summarise.mjs`). Phases 0 and 1 are built (below).

## Decisions it builds on

- **Additive variants** (2026-11-17): variants only grow (cap ~10 per block type); a change to an
  existing variant is CSS/JS by us and applies everywhere, untracked. Tracked: blocks moved to
  another variant (by a reviewer or by the AOE team, on one or N pages), text sets, backgrounds,
  comments, QA notes, reviewed marks.
- **State, not a log**: the backend holds the current state per page and block; a save updates it.
  A short history per entry is kept for audit only.
- **Reviewers have no login**: identity and permissions come from invitation links.
- **Choices end up in the `/std` documents in DA**, which then hold the result (with DA's own
  version history); the preview shows it.

## Architecture

```
review tool (static, on the branch preview)        AOE scripts (this workspace)
   │  invitation token                                │  AOE token
   ▼                                                  ▼
App Builder web actions (I/O Runtime) ── state store (App Builder State, key-value)
   │                                    └─ audit + exports (App Builder Files)
   └── apply job ──► DA source API (/std documents), technical account (phase 4)
```

- The tool stays a static page on the branch preview (as now); only its store module changes
  (`store.js` talks to the backend; the pilot's sheet route was retired on 2026-11-17).
- Conversion, snapshot capture and the block index / groups per template stay in this workspace.

## Data model (State store, key → JSON)

| Key | Value |
|---|---|
| `s:<page>:<item>:<kind>` | `{ value, key, by, at, rev }`: a block / section / page entry; `item` = position (`s14b0`, `s3`, `page`, `note:<id>`), `key` = the stable block key (phase 3) |
| `g:<group>:<kind>` | a group choice ("for all blocks like this") |
| `t:<page>:<item>:<kind>` | the AOE status of a comment / note (`{ state, release, reason, workItem }`) |
| `i:<id>` | an invitation: `{ name, scope: [path prefixes or templates], expires, revoked }` |

- `rev` increases on every write; a save carries the `rev` it started from. A different stored
  `rev` = someone else changed it: the save of that entry is refused ("reload"), the others go through.
- Every write also goes to the audit (Files, one JSON line per change: who, when, before, after).

**Storage test, 2026-11-17** (a temporary action in the Stage workspace, `@adobe/aio-lib-state`
5.4.0 and `@adobe/aio-lib-files` 4.1.4, region amer; removed after the run):

| Check | Result |
|---|---|
| Keys | letters, digits, `-`, `_`, `.` only, up to 1 KB: a colon is refused. Page paths are encoded (base64url: `p.<path>.s14b0.variant`, 78 characters for Prophecy) |
| Values | strings up to just under 1 MB (900 KB stored, 1,100 KB refused); our entries are a few hundred bytes |
| Expiry | default 24 hours, at most one year (set on every write) |
| Conditional writes | only "if it exists" / "if it doesn't": no "if unchanged", so the `rev` check is done in the action (read, compare, write) |
| Listing | by key pattern (`p.<page>.*`): a page's entries in one call |
| Speed | about 20–100 ms per read or write from an action; 20 parallel reads 450 ms (one 900 KB write took 21 s once) |
| Files | write, read, list, delete work (230 ms for all four) |

What follows from it:
- **Entries expire after at most a year**, so the State store holds the live state only (written
  with the one-year expiry, renewed on every change), and **Files hold the durable record**: one
  audit file per save batch (before / after of every change), from which the store can be
  rebuilt; `export` gives the whole state on demand. The review never depends on an entry
  outliving its expiry.
- Keys: `p.<page>.<item>.<kind>` (AOE statuses too: kind `status:<kind>`), `g.<item>.<kind>`,
  `i.<id>`, the parts base64url-encoded (group keys and note ids hold `|` and `:`).
- The newer App Builder database storage is not needed for this: queries across pages run on the
  block index in this workspace (the `bulk` action gets the block list from it).

## API (web actions, JSON, CORS for the preview hosts only)

| Action | Who | What |
|---|---|---|
| `GET state?page=` | reviewer | the page's entries + every group choice + AOE statuses |
| `POST save` | reviewer | `{ page, changes: [{ item, key, kind, value, rev }] }` → per change saved / conflict |
| `GET export?since=` | AOE | every entry (for `summarise.mjs` and the apply job) |
| `POST status` | AOE | AOE statuses for a work item's rows (`set-status.mjs`) |
| `POST bulk` | AOE | "these blocks → variant X" on N pages (the query runs here, against the block index) |
| `POST invite`, `POST revoke`, `GET invites` | admin | invitation links |
| `POST apply` | AOE | phase 4: choices into the `/std` documents in DA |

## Security

- **Invitation token**: signed (HMAC) by the backend with the reviewer's name, scope and expiry;
  checked on every call; revocable (the `i:` entry). The link is
  `…/tools/review/index.html?invite=<token>`; the tool keeps the token in the browser.
- **AOE and admin calls** go to a private action, callable only with the workspace's credential
  (added by the environment from Settings): no extra secret.
- The signing key is created inside App Builder (`admin setup`) and kept in its Files storage: it
  never leaves the project. Later secrets (the DA technical account) the same way or as action
  parameters; never in git, never in the chat.
- No personal data beyond the reviewer's name; input sizes and rates limited per token.

## Order of work

0. **Access check** (done 2026-11-17): project "Stryker std review", Stage namespace
   `892544-strykerstdreview-stage`; the Stage runtime credential reaches this workspace through
   Settings (Basic, host `adobeioruntime.net`); actions are deployed with the OpenWhisk REST API
   (no sign-in), bundled into one file with esbuild when they use libraries; `std-review/hello`
   deployed and called.
1. **State API + invitations** (built 2026-11-17, `tools/review/backend/`): web actions `state` and
   `save` (invitation checked on every call, scope by path prefix, group right, rev conflicts,
   limits, CORS for our previews), private `admin` (setup, invite, revoke, invites, export,
   status, import, purge-invite, purge-test), audit in Files; the tool's backend store, chosen by
   an invitation link (name from the link, read only; the link leaves the address bar), the sheet
   still the default. Tests: `backend/test/backend.test.mjs` (22 checks) and
   `backend/test/tool.test.mjs` (the tool in a browser), all passing on Stage.
2. **Moving over** (done 2026-11-17): the sheet held only test data, so nothing was imported; the
   tool uses the backend only (the sheet store removed); `summarise.mjs` reads `admin export`,
   `set-status.mjs` writes `admin status`; the results page reads the web action `results` (an
   invitation with the results right). Test: `backend/test/tool.test.mjs`, the whole loop.
3. **Stable block keys** (built 2026-11-17, `tools/review/blockkeys.js`): simpler than the map
   first planned: a block's key is its type + a fingerprint of its own content (text and alt
   texts, whitespace ignored), so no map file is needed and the key is the same on the branch
   preview (DA) and in the workspace; twins named by their unique neighbour. The tool saves under
   keys and maps them to positions on load; the summary and the results page do the same; a key
   not on the page = re-check question. The two positional entries saved before (test_reviewer,
   Prophecy) were moved to their keys (`admin rekey`, computed on the DA copy they were made on).
   Also: Undo changes in the tool, an interrupted save sent again, `admin audit` and `rekey`.
4. **Writing into DA** (changed 2026-11-17: not in the backend). During the review the tool shows
   the choices on top of the standard pages, so DA keeps the converted base. Writes into DA are
   rare and done by the agent on request, with the user's DA credentials (Settings), never by the
   backend (no DA technical account): read the backend's export, apply the choices to the local
   `/std` documents (block keys → blocks), run the checks, upload the changed documents to DA and
   preview them on the branch. Same route for the ~980 documents not yet uploaded (before the review
   starts) and for pages whose content is fixed from feedback. Step by step in the runbook (7).
5. **Retire the sheet** (done 2026-11-17, with phase 2): `review-form.json` removed, so the form
   service can no longer add rows; closing the sheet's sharing is the user's (Google Sheets).
6. **Status page and conversations** (requested 2026-11-17): the back and forth between reviewers
   and the AOE team happens in the tool, not in calls.
   - **Status page for the customer** (and the AOE team): every page, filtered by template
     (business unit, state, reviewer), with its state as a colour **and** a label, counts per state
     on top, links into the tool. States: *waiting for the reviewer* (yellow: the AOE team answered
     every open thread), *waiting for the AOE team* (red: open feedback without an answer),
     *in review* (grey-blue: activity, not marked reviewed, no open feedback), *resolved* (green:
     marked reviewed, every thread closed after a back and forth), *approved as is* (light green:
     marked reviewed, never any feedback), *not reviewed yet* (black). Order: what waits on the
     viewer first (customer: yellow, red, …; AOE team: red, yellow, …), then resolved / approved,
     then not reviewed. "New since your last visit" markers.
   - **Threads**: a comment or QA note is a thread: the reviewer opens it, the AOE team answers in
     the tool (with a status: in progress / done in rN / won't do + reason), the reviewer confirms
     (closed) or replies (open again). Every reply is an entry with its author and time.
   - **AOE team in the tool**: their own invitations with an AOE role (all pages, answer threads,
     statuses), their activity recorded under their names like the reviewers'.
     `set-status.mjs` stays as the bulk fallback.
   - *Built 2026-11-17: threads, AOE role (any reviewer of the page closes a thread, the user's
     choice), set-status as AOE answers, summary and results with thread states; loop test covers
     the whole back and forth. Status page built the same day: `tools/review/status.html`
     (web action `overview`, states in `backend/lib/states.mjs`), templates in `pages.json`.*
   - *Changed 2026-11-17 (the user's model): explicit handovers (Reply never changes the turn;
     Send to the AOE team / Send back to the reviewers / Resolve do), every message visible to both
     sides at all times (the user's choice: to follow discussions and step in), page states set by
     reviewers (In review, Approved, Skip: don't migrate; Skip black, Not reviewed yet gray), and
     everything waits for Save. Rules in one shared module, `tools/review/threads.js`.*
   - **Mentions** (open): `@name` in a message emails an invited person (invitations get an email
     address; '@' suggests them) with a link to the thread; waits for an email service (App
     Builder has none of its own).
   - Templates on the pages list (`pages.json`) for the filter.
7. **Runbook for new sessions** (requested 2026-11-17): in the project, next to the code
   (`tools/review/RUNBOOK.md`, pointed to from AGENTS.md): the backstory (as-is → standard, the
   variant model, the decisions and why), how the pieces fit, the Settings entries the credentials
   need, everyday operations (invitations, summary, statuses), the DA write step by step with its
   checks, recovery after a workspace restart and from the audit, the lessons learned.
8. **Other templates**: block index, groups and snapshots per template; invitations scoped per
   template.

## Open

- The ~980 standard documents not yet in DA (the DA copies are from 2026-11-13): upload before the
  review starts (phase 4 route).
