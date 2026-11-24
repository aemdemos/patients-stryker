# The review backend on App Builder Database

Status (24 Nov 2026): **step 1 of the move running**: the database is a second, live copy of
State. Every write of the backend to State is made in the database too (`lib/mirror.mjs`,
collection `kv`, one document per State key: the key, its value as it is, its parts); all 667
existing keys were copied and compared equal; the write-heavy tests left both copies equal; every
night after the backup the two are compared key by key and the database put right from State
(report in Files `mirror/compare/<day>.json`; failed mirrored writes in `mirror/failures/`, none
so far). State is still what everything reads. Saves with the mirror: 220 changes ~3.4 s (2.9 s
without), one change ~0.25 s. Admin: `db-compare`, `db-sync`.

**Measured 24 Nov 2026 (Stage, amer):** a write ~20–90 ms, a read ~20–50 ms, **200 documents in
one call ~30–60 ms** (State: 220 changes ~3 s). **Reads must ask for the primary**
(`readPreference: 'primary'`, `lib/db.mjs` PRIMARY): a read right after its write missed it 9 of
40 and 94 of 200 times by default (served by a replica not yet up to date), never on the primary
(0 of 240). The credential survives our deploys (`deploy.mjs` keeps the package's parameters).

## Why

- **Durable:** App Builder Database Storage (Data Services) is Amazon DocumentDB on replica sets:
  every write is kept on several storage nodes and the service repairs failed ones itself
  (Adobe: "Data is synchronously persisted across multiple storage nodes"). State keeps a key a
  year at most and has no backups.
- **Faster:** queries and bulk writes (State: one call per key, ~80 a second at most).
- **Still our own backups:** Adobe restores accidental deletions only "best-effort" through
  support, so the daily backups to Files stay, taken from the database once it is the store.

## 1. The credential (once, by a developer with Developer Console access and the aio CLI)

The database needs an IMS access token, which the actions get from the workspace's **OAuth
Server-to-Server** credential (added with the App Builder Data Services API). Adobe's `aio app
deploy` injects it into the actions (`include-ims-credentials`); this backend is deployed with
the Runtime API instead, so the credential goes once on the backend's **package**, where every
action receives it. It is never in git, never in the chat, never printed by our scripts
(`deploy.mjs` keeps the package's parameters as they are).

Project "Stryker std review", workspace **Stage** (Runtime namespace
`892544-strykerstdreview-stage`, package `std-review`):

1. Developer Console → the project → Stage → the OAuth Server-to-Server credential of App
   Builder Data Services: its client ID, client secret, organization ID and scopes.
2. With the aio CLI logged in to that organization and the Stage workspace selected
   (`aio app use`, or `aio console … select`), make sure the workspace has its database
   (`aio app db status`; else `aio app db provision --region amer`), then:

   ```
   aio runtime package update std-review \
     --param __ims_oauth_s2s '{"client_id":"…","client_secret":"…","org_id":"…@AdobeOrg","scopes":["…","…"]}' \
     --param __ims_env prod
   ```

   (The same parameter `aio app deploy` would set on each action; anyone with access to the
   namespace can read it, as with Adobe's own deploys.)
3. Tell the review's maintainer; `node tools/review/backend/admin.mjs db-check` then connects,
   writes, reads and writes 200 documents at once, and answers `ok: true` with the timings.

Production: the same with the Production workspace when the backend moves there.

## 2. The move (done by the maintainer once db-check passes), without losing anything

1. **Measure:** db-check's timings; a test collection with the review's real volume.
2. **Write to both:** every save writes State (still the store everything reads) and the
   database; a daily comparison of the two (every key, its value) reports any difference.
3. **Copy what exists:** every entry and invitation of both reviews from State into the
   database (from the day's backup), counted and compared key by key.
   **Reading its own writes (tested 24 Nov 2026, `admin.mjs db-listtest` / `db-listchange`):**
   a write, then at once a read of it:

   | Read | Missed |
   |---|---|
   | list (`find`), default | 1 of 180 new; 4 of 300 new, 1 of 300 changed, 4 of 300 deleted |
   | list, `readConcern: majority` | 1 of 180 |
   | list, `readConcern: local` | 0 of 180 (same mechanism: not relied on) |
   | `aggregate` with `$match` | 1 of 180 |
   | `countDocuments` with the primary | 0 of 180 |
   | **one document per page, `findOne` with the primary** | **0 of 220** |
   | `findOne` with the primary | 0 of 240 |
   | `findOne`, default | 10–12 of 40 |

   Lists of any kind can be a moment behind (~1%; `find` refuses `readPreference`); only single
   reads from the primary always see the newest write. **So for step 4: a page's entries in one
   document** (`_id` = space + page, the entries as fields), written in place (`updateOne` with
   `$set` / `$unset` of the changed entries) and read with one `findOne` from the primary: a page
   always shows what was just saved. The rev check becomes part of the write (the update's
   filter names the rev it started from: someone else's change in between is refused by the
   database itself, which State can't do). Lists across pages (the overview) stay on the
   review's summary; a moment's lag there is harmless. Group choices (page `*`) and
   invitations: one document each, read by `_id` from the primary.
4. **Read from the database:** once the comparison has been clean for several days; State keeps
   being written as the second copy for a few weeks, then stops. Backups go on daily, from the
   database to Files.
5. **Shots, audit, Live copies, tiles** stay in Files (blobs: not database documents).

Every step can be undone by reading from State again; nothing is deleted from State until the
database has been the store for a few weeks with clean comparisons and backups.
