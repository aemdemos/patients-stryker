# Runbook: the standardisation and the customer review (stryker.com, branch `standardise-v3`)

For an agent (or a person) picking this up in a fresh session, with none of the earlier
conversation. Read this first, then the documents it points to. Facts here were true on
2026-11-17; check them against the code before relying on them.

## 1. The backstory in short

- **The migration.** www.stryker.com (AEM) is being migrated to Edge Delivery Services with
  Document Authoring (DA). The corp pages were imported "lift and shift": every authored value
  (sizes, fonts, colours, widths, paddings) carried over exactly.
- **Readable settings (`/rs`).** The lift-and-shift values were first rewritten as readable
  settings (Section Metadata and named styles instead of number-carrying classes): branch
  `readable-settings-v3`, PR #531 (draft, into `integration-v3`). The 672 product-detail pages
  and their fragments (1,012 documents) exist in that form under `/rs/…`.
- **Standardisation (`/std`).** The customer liked the idea of moving from one-off measured
  styling to a few standard designs. The user's model: per block type, group every instance by
  similarity; the largest N groups become exactly N variants with their own CSS; **every**
  instance is moved onto one of them, its content kept and its presentation dropped. Default
  content (text outside blocks) got six text sets the same way. A new look, the same content,
  EDS authoring best practice. Branch `standardise-v3`, PR #540 (stacked on #531). The standard
  copies live under `/std/…` (985 documents), produced from `/rs` by DOM-only rules.
  Details, numbers and every design decision: `tools/importer/standardise/README.md`.
- **The variant model is additive** (decided 2026-11-17): variants only grow (cap about 10 per
  block type); a change to an existing variant is CSS/JS and applies everywhere, untracked; only
  moving blocks to another variant is tracked. So `/std` needs no versioning.
- **The customer review.** The customer's reviewers judge the standard pages in a review tool
  (`tools/review/`) and the AOE team (Agentic Outcome Engineers, the user's team) answers there,
  so no calls are needed. The tool shows `/std` with the saved choices applied in the browser; it
  never changes documents. The real paths (`/us/en/…`) are only replaced at go-live.

## 2. Where everything is

| What | Where |
|---|---|
| Code | git branch `standardise-v3` (PR #540; #531 below it) |
| Site | `strykerenterprise/stryker-com`; branch preview `https://standardise-v3--stryker-com--strykerenterprise.aem.page/` |
| Content | DA `strykerenterprise/stryker-com` under `/rs/…` and `/std/…`; locally `content/rs/…`, `content/std/…` (the local preview serves them at `http://localhost:3000/content/…`) |
| Conversion rules | `tools/importer/standardise/rules/variants.js`, run by `apply-variants.mjs` |
| Review tool | `tools/review/` (`README.md` describes every file) |
| Review backend | App Builder project "Stryker std review", **Production** workspace `892544-strykerstdreview` since 24 Nov 2026 (Stage `892544-strykerstdreview-stage` before, emptied, answers "moved"; keys in Settings: Production on `runtime.adobe.io`, Stage on `adobeioruntime.net`; scripts use `backend/target.mjs`); code `tools/review/backend/` (`README.md`, plan `../backend-plan.md`). **One backend for two reviews** (spaces): `std` (this one) and `main` (the client review of the migrated pages, branch `client-review-v3`, PR #559); the code is the same on both branches since 23 Nov 2026 |
| Client review | branch `client-review-v3` (the tool without the design panel, `config.js` space `main`); its migration scope table in DA `review/migration-scope`; the backend takes its first source shots (action `capture`, every 15 minutes) |
| Review config | `tools/review/config.js`: the one file that differs between the two branches |
| Shared review rules | `tools/review/threads.js` (page statuses, chats, Done), `tools/review/blockkeys.js` (block keys) |
| DA helpers | `tools/review/da/` (upload, verify, preview) |

**What is in DA (2026-11-17):** the `/rs` pages; of `/std` only the demo pages (Prophecy, Ankle
Truss System, Smart Toe II, Dartfire Edge, Procedural Oxygen Mask, 3D Systems), their fragments,
the conventions page and the source snapshots (`/review-snapshots/`), all from 2026-11-13. The other
~980 `/std` documents are local only, and the local ones are newer than the DA copies.

## 3. Credentials: Settings only, never the chat

The user enables these in Settings; the environment adds the credentials to requests. Never ask
for a token, never accept one pasted in the chat (tell the user to rotate it), never put one in a
file or a command.

| Needed for | Settings entry |
|---|---|
| The review backend (deploy, admin action) | site `adobeioruntime.net`, Basic: the Stage workspace's runtime `auth` (username = before the colon, password = after) |
| DA uploads and branch previews | LLM Permissions: "Allow LLM to use my Adobe credentials for admin.hlx.page and Document Authoring uploads" |
| git push | the git permissions option |

A 401/403 means the option is off: say so and ask the user to enable it; don't work around it.

## 4. After a workspace restart

`/tmp` is wiped by a restart. Restore what lived there:

- The project's libraries (and the helper tools'): `bash .cbr/local-scripts/helper-tools-local.sh`
  when `.cbr/` exists (local, git-ignored); otherwise `npm install` in the project.
- The backend's libraries: `deploy.mjs` reinstalls them into `/tmp/run-outputs/review-backend-deps`
  by itself.
- The source snapshots for the local preview: `tar -xf .cbr/review-snapshots-2026-11-13.tar -C /tmp/run-outputs/`
  (`tools/review/snapshots` links there). On the branch preview they come from DA.
- The conversion's input backup: `python3 -I tools/importer/standardise/rebuild-backup.py content /tmp/run-outputs/std-apply/before-variants`
  (rebuilds the `/rs` copies the conversion reads; prints "differing: 0" when it matches).

## 5. Everyday operations

All from the project root. The admin calls need the backend credential (section 3).

**Invitations** (reviewers have no Adobe ID; the link carries a signed token):

```
node tools/review/backend/admin.mjs invite --name "Jane Doe" --paths /us/en --days 30 [--results] [--page /us/en/…]
node tools/review/backend/admin.mjs invite --name "AOE_name" --paths / --days 90 --role aoe
node tools/review/backend/admin.mjs invites                  # every invitation (no tokens)
node tools/review/backend/admin.mjs revoke --id <id>
```

Add `--space main` (and `--host client-review-v3--stryker-com--strykerenterprise.aem.page` until
its merge) for the client review. The AOE team can also make and revoke invitations itself on the
**Invitations** page (`tools/review/invites.html`, AOE invitations only).

Give the user the `link` (and `results` link): treat links like passwords. One browser holds one
invitation at a time; opening another link replaces it. Invitations on 2026-11-17: `test_reviewer`
and `test_reviewer2` (customer test reviewers, the user's) and `AOE_iustinp` (the user, AOE).

**The pages** (`tools/review/status.html?invite=…`): every page's status for both sides. **The
results** (`results.html?invite=…`, invitations with the results right): progress, decisions,
comments, QA notes.

**The feedback summary for the AOE team** (when asked to "summarise the review feedback"):

```
node tools/review/summarise.mjs        # → migration-work/review-summary/report.md, work-items.json, to-read.json
```

Then read `to-read.json`, write the readings into `migration-work/review-summary/themes.json`
(format in `tools/review/README.md`), run it again. **Statuses back** for many rows at once:
`node tools/review/set-status.mjs --item <work item id> --state done --release r3 --reason "…" [--send-back]`
(single answers: in the tool with an AOE invitation).

**Rebuilding the lists the tool reads** (after content changes): `pages.json`
(`python3 -I tools/importer/standardise/review-pages.py content tools/review/pages.json`) and
`groups.json` (`node tools/review/build-groups.mjs`, needs the local preview).

## 6. How the review works (the model the user agreed)

- **The page status says whose turn it is**, set with Save: reviewers **In review**, **Send to the
  AOE team**, **Approve**, **Skip: don't migrate**; the AOE team **Send back to the customer**.
  Colours: Not reviewed yet gray, In review yellow, Waiting for the AOE team red, Waiting for the
  customer blue, Approved as is light green / Resolved green, Skipped black.
- **Chats** on every block, text section, the page and every QA note; everyone sees every message;
  either side ticks a chat **Done**. The AOE team may add a status to a message (for the summary).
- **Design choices** per block, per section (text set, background) and "for all blocks like this"
  (groups). **Everything waits for Save; Undo changes takes back what isn't saved.**
- Choices are saved under **block keys** (type + fingerprint of the content), so they stay on their
  block when a conversion re-run moves it. A text fix gives a block a new key: its choices go to the
  summary's re-check questions, never guessed.

## 7. Changing the tool or the backend

- Lint: `npm run lint` (no `eslint-disable`, AGENTS.md hard rules).
- Backend: edit `tools/review/backend/`, then `node tools/review/backend/deploy.mjs [--only state,save,results,overview,admin,…]`.
  The backend serves both reviews: deploy from either branch only when its `backend/` is the same
  as the other branch's (port a change to both), and run both reviews' tests.
- Tests (all must pass before a commit):

```
node tools/review/backend/test/states.test.mjs     # the shared rules
node tools/review/test/blockkeys.test.mjs          # block keys (local preview)
node tools/review/test/summary.test.mjs            # the summary on sample data (local preview)
node tools/review/backend/test/backend.test.mjs    # the actions (test page /test/backend)
node tools/review/backend/test/tool.test.mjs       # the whole loop in a browser (local preview)
node tools/review/backend/test/status.test.mjs     # the status page in a browser
```

- **The browser tests only run on pages nobody has saved anything on**, and clean up after
  themselves (`purge-invite`, `purge-by`, `purge-test`). Never run a test that writes on a page
  reviewers use (2026-11-17 a test overwrote a reviewer's comment; it was restored from the audit).
- Commit as the user (`iustinp <104903342+iustinp@users.noreply.github.com>`) with the
  attribution line, and only when the user asks; push to `standardise-v3`.

## 8. Writing into DA (only when the user asks for it in their current message)

The backend never writes into DA (decided 2026-11-17): it is done here, on request, with the user's
DA credentials. The tool keeps working without it (it shows the choices on top of the documents).
Nothing is ever **published**: uploads and branch previews only.

**a) Uploading `/std` documents** (e.g. the ~980 not yet in DA, before the review starts; or pages
whose content was fixed):

1. Make sure `content/std/…` is what should go up: re-run the conversion if rules changed
   (`apply-variants.mjs` with the backup, section 4) and its checks (`tools/importer/standardise/README.md`, "Run").
2. Write the EDS paths to a file (one per line, without `/std`), e.g. from `pages.json` plus the
   fragments under `content/std/us/en/fragments/`.
3. Upload: `bash tools/review/da/upload.sh strykerenterprise/stryker-com <paths> <log> /std`
   (resumable; reports ok / other).
4. Verify: `python3 -I tools/review/da/verify.py strykerenterprise/stryker-com <paths> 10 /std`
   (every 10th; must say "identical"). If DA differs from the local file, the local file is
   updated to what DA has, never the other way round silently.
5. Preview on the branch: `bash tools/review/da/preview.sh strykerenterprise/stryker-com standardise-v3 <paths with /std prefix> <log>`.
6. Tell the user exactly what changed where: local, DA, branch preview (never "live").

**b) Applying the review's choices to the documents** (at the end of the review): **not built
yet.** The plan: read `admin export`; for each page, map the entries to blocks with
`blockkeys.js` (`keysOfHtml` + `toPosition` on the local `/std` document); apply variant, width,
background and text-set choices (own choice, else the group's) as classes and Section Metadata,
the way `rules/variants.js` writes them; pages marked Skip are left out and listed; entries whose
key isn't found go to a report, never guessed; then the content checks, then (a) for the changed
documents. Build it as `tools/review/apply-choices.mjs` with a `--dry-run`, and show the user the
report before any upload.

## 9. When something goes wrong

- **An entry was overwritten or deleted:** the audit keeps before / after of every change:
  `node tools/review/backend/admin.mjs audit --json '{"date":"YYYY-MM-DD","page":"/us/en/…"}'`;
  put it back with `admin import` (rows with page, item, kind, value, reviewer, time, inv, role).
- **Entries saved under positions** (`s14b0`) that must move to keys: `admin rekey` with the keys
  computed on the copy the reviewer saw (see the migration in `backend-plan.md`, phase 3).
- **The tool shows "not valid / withdrawn":** the invitation expired or was revoked: create a new
  one.
- **Where entries live:** since 24 Nov 2026 in App Builder Database, one document per page
  (`backend/DATABASE.md`); the old State store is empty (test data only, final copy in Files
  `backups/state-final/`). Daily
  backups go to Files (`admin backups`, `restore-check`, `restore`); the audit files are the
  second record. `admin db-stats` counts the documents.

## 10. Rules and lessons that are easy to miss

- Never upload, preview or publish without the user's explicit request in their current message.
- Never accept or use pasted credentials; Settings only.
- Never commit the corp export folders (`.corp-exports/`, `.migration/xf-*`, `cf-content`): local only.
- Block ALTCHA / captcha requests in every browser run on stryker.com.
- Kill processes by PID only. Long runs in the background, announced, with progress.
- Don't mention paths or localhost to the user; the user has no terminal: do the work, never hand
  them commands.
- The user decides designs and models; propose, show, and wait for approval before big changes
  (AGENTS.md "AEM Coder Rules").

## 11. Open (2026-11-17)

- Upload the ~980 `/std` documents to DA before the real review (8a).
- The apply step (8b).
- @mentions by email (only invited people; invitations get an email address): waits for an email
  service.
- Restrict / retire the old Google Sheet's sharing (the user's).
- The other corp templates (block index, groups, snapshots, invitations per template).
- Found, not fixed: 31 jump links without a section id (product-detail importer); several H1s on
  some pages; blocks inside fragments can't be switched in the tool.
