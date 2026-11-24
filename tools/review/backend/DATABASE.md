# The review backend on App Builder Database

Status (24 Nov 2026): **prepared, waiting for the credential** (step 1 below). The backend still
stores its entries in State (key–value), with daily backups to Files (README, *Backups*).

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
4. **Read from the database:** once the comparison has been clean for several days; State keeps
   being written as the second copy for a few weeks, then stops. Backups go on daily, from the
   database to Files.
5. **Shots, audit, Live copies, tiles** stay in Files (blobs: not database documents).

Every step can be undone by reading from State again; nothing is deleted from State until the
database has been the store for a few weeks with clean comparisons and backups.
