# The review tool as a Document Authoring app (branch `da-app-v3`, from 27 Nov 2026)

The goal: one Adobe login instead of invitation links, and a tool that can serve other projects
than stryker.com. Everything on `client-review-v3` and `standardise-v3` (invitations included)
stays as it is until this is proven and agreed.

## Why not the Sidekick login alone (findings, 27 Nov 2026)

- Sidekick keeps its login token in the extension. The browser adds it (declarativeNetRequest
  rules, `src/extension/auth.js` of adobe/aem-sidekick) only to requests going to Adobe's admin
  service (`x-auth-token`) and the site's own `*.aem.page` / `*.aem.live` hosts
  (`authorization: token …`). Page code never sees it, so a malicious page can't steal it.
- Its page API (`getAuthInfo`) returns only the names of the signed-in organisations. Its page
  events carry the profile with the email, but only as page data, which anyone can fake.
- The admin service answers `/profile` (email included) to our pages. The answer goes through the
  page, so our backend can't trust it.
- Writing a signed audit-log entry (`POST /log`) needs `log:write`, which only site admins have.
- Adobe's admin tokens can be checked offline (public keys at `admin.hlx.page/auth/discovery/keys`),
  but only Sidekick receives them from Adobe's login (`?extensionId=…`). Our own extension could
  probably receive them too, but every reviewer would have to install it, and the behaviour isn't
  documented.

So it isn't a hole on Adobe's side: Adobe's services check the token themselves. Only a backend
that believed the page would be fooled.

## The DA app route

- `https://da.live/app/{org}/{site}/{path}?ref={branch}` loads `{path}.html` of the branch in a
  frame (adobe/da-nx `nx/blocks/shell/shell.js`):
  - signed-in users get `https://{ref}--{site}--{org}.preview.da.live` (DA's preview, cookie from
    `/gimme_cookie`);
  - everyone else gets `https://{ref}--{site}--{org}.aem.live`.
- DA posts `{ ready, token, email, context }` to the frame with a MessagePort
  (`nx/utils/sdk.js`, `DA_SDK`). `token` is the user's Adobe IMS access token (client
  `darkalley`).
- Apps outside Adobe's own organisations show a warning ("may take any action on your
  behalf") with Continue / Cancel, once per site and branch in each browser.
- The backend checks the token with Adobe IMS (`/ims/profile/v1`): Adobe refuses faked or expired
  tokens and returns the verified email. The token is never stored or logged. Action `whoami`
  (Stage only for now) does exactly this; it accepts only tokens issued to DA.

## Step 1: the proof (now)

`tools/review/da-proof.html`, opened as
`https://da.live/app/strykerenterprise/stryker-com/tools/review/da-proof?ref=da-app-v3`, checks:

1. opened in DA (the SDK's hello came from https://da.live);
2. where the app runs (DA preview or published site);
3. who DA says you are, and that a token came with it;
4. who Adobe says you are, checked by the backend, and the same email;
5. a faked sign-in and no sign-in are refused;
6. a migrated page loads in a frame on the app's host and the tool can read it (needed for side by
   side and Scroll Sync).

Still to learn from a real run: whether a reviewer without DA editing rights can open the app
(and which host they get), and whether the pages shown there are the ones under review (DA's
preview shows DA's current content; the published site shows what is live).

## What the proof showed (27 Nov 2026, the user's runs)

- Opened in DA, the hello comes from https://da.live, on a first, uncached load too (the SDK must
  be a module script of the page itself, listening before the page's load event).
- Adobe confirms the email through the backend (`whoami`); a faked token and no token are refused.
- DA's preview host (`*.preview.da.live`) shows DA's current content, not the published one, and
  serves pages without a doctype (quirks mode: shorter mixed-size lines, the same computed line
  height). So the tool must not show its pages from there: the app moves itself to a host whose
  pages are the real ones, and DA says hello again after every load of the app's frame.
- The move works on both hosts (27 Nov 2026, a normal window): on the branch preview
  (`*.aem.page`, the site's login added by Sidekick even inside DA's frame, Sidekick itself not
  shown there) and on the published site (`*.aem.live`, public). After the move DA's hello came
  again, Adobe confirmed the email through the backend, the page read in a frame was the real one
  and rendered in standards mode. One earlier 401 on `*.aem.page` was most likely an incognito
  window, where Sidekick is off.

**The proof passed:** the tool can run as a DA app, know who is signed in from the Adobe sign-in
alone, and show the real pages, readable for side by side and Scroll Sync.

## The plan for steps 2–4 (27 Nov 2026, with the user's decisions; for a last look before building)

### The architecture

| Part | What | Where |
|---|---|---|
| Sign-in | Adobe's normal sign-in, shown by DA. Nothing of ours to maintain | `da.live/app/<org>/<site>/tools/review/start` |
| Front end | The tool's pages, in the full window, on the project's own hosts (only there can they read the pages in frames for side by side and Scroll Sync) | the project's repo, `tools/review` |
| Back end | Data and rules (entries, people, audit), screenshots and pictures, the browser for captures and Live copies, schedules. A DA app has no server, so App Builder stays | App Builder, **one per project** |
| Publish check | Is a page's preview newer than what is live? Asked from the AOE member's browser, where Sidekick adds their login | Adobe's admin service |

- **One backend per project:** the same code, deployed to the project's own App Builder workspace
  (its own database, file storage and credentials). One project's people, entries and screenshots
  can't reach another's.
- **The two Stryker reviews** (standardisation, client review) keep sharing today's backend: same
  customer, same people (the user's choice). Separate backends start with the next project.
- **Installing on a new project:**
  1. Copy `tools/review` with its `config.js`.
  2. Create its App Builder workspace and database (someone with Developer Console access).
  3. Deploy the backend there and add the first AOE admin.
  4. Optionally list the tool in DA's apps for the site.

### How someone gets in: DA for sign-in, then the full window (the user's choice)

1. They open the tool's DA address and DA signs them in with Adobe.
2. The sign-in page (`start.html`, a DA app) sends the Adobe token to the backend once.
3. The backend checks it with Adobe, finds the email in the project's people list, and issues a
   **review session**:
   - signed by the backend, valid 12 hours, for this project only;
   - unusable with Adobe's services;
   - checked against the people list on every request, so removing someone cuts them off at once.
4. **Open the review** (one click: browsers let a frame take over the whole window only on a click)
   opens the tool in the whole window, on the role's host:
   - the AOE team: the branch preview (`*.aem.page`), preview content and unpublished pages too,
     with Sidekick signed in;
   - reviewers: the published site (`*.aem.live`), only what is live. A free Adobe account on their
     own email is enough: no Sidekick, no DA rights, no entry in the site's access list.
5. The tool then works as today (full screen, new tabs, deep links, the Live extension unchanged),
   with the session in the browser instead of an invitation token. The Adobe token is never kept.
   A page opened without a valid session, or once it has ended, sends the person back through the
   DA address, with the page they wanted.

**Signed in but not on the list** (often another email): "You're signed in as x@y.com, which isn't
part of this review: ask the AOE team".

### Step 2: backend

- **People** (database), per project: `{ email (lower case), name, role (aoe | reviewer), paths,
  addedBy, addedAt, removedBy, removedAt }`.
  - Admin ops: add, change, remove, list.
  - The first AOE admin on Stage: the user.
- **Actions:**
  - `signin` checks the Adobe token (`whoami`'s check) and issues the review session;
  - every web action takes the session (`authorization: Review <session>`) and gives the actions
    the same internal shape as an invitation today (name, role, scope), so they barely change;
  - the audit records emails.
- **Screenshots:** the first source shots, kept in DA at `/review-snapshots-main` and only on the
  preview, are copied into the backend's storage, where the newer shots already are, so reviewers
  on the published site get them.
- **Allowed addresses (CORS):** the published site, and DA's preview for the sign-in page.
- **Invitations** keep working for the existing branches until the switch-over.
- **Tests:** the Stage backend issues test sessions through an admin op (refused on Production),
  since real Adobe tokens can't be made in tests.

### Step 3: the tool

- `start.html`: the DA app sign-in page (the proof's lessons: the SDK as a module script of the page;
  the one-click move).
- Every page:
  - takes the session instead of the invitation;
  - shows name, email and role in the top bar;
  - runs on the published site for reviewers (today it refuses to);
  - with no session, goes back through DA.
- **People page (AOE team)** replaces Invitations: list and search; add an email with name, role
  and pages; change; remove (asked first, in the shared dialog).
- **Hand-over blocked until published** (the user's choice): handing a page to the reviewers is
  refused while its preview is newer than what is live: "Publish this page first: the reviewer
  sees only what is live."
- **Links** in the Summary, Status and emails point to the tool's DA address with the page.
- **Tests:** sign-in through the stand-in for DA (as in the proof), sessions, roles and hosts,
  People page, refusals, the hand-over block.

### Built (27 Nov 2026, Stage only; branch da-app-v3)

- **Backend:**
  - people (`lib/people.mjs`, database collection `people`; admin ops `people`, `person-put`,
    `person-remove`, `person-forget` for @example.com test people, `test-session` on Stage only);
  - `signin` (the Adobe token → a 12-hour session); `people` (the AOE team);
  - sessions accepted by every action like an invitation (`core.mjs` checkInvite);
  - test: `test/people-sessions.test.mjs`.
- **Tool:**
  - `start.html`, the sign-in;
  - `store.js`: the session from `#session=`, out of the address bar; without a session, or once
    it has ended, `goSignIn` to the DA address with the page asked for;
  - `people.html` instead of Invitations;
  - the published site opens every page;
  - sending a page back to the reviewer is blocked until its newest preview is published
    (`review.js` publishedForReviewer);
  - test: `test/da-signin-tool.test.mjs`.
- **Screenshots:** the first shots copied into the backend's Files with `backend/tiles-to-files.mjs`
  (from the local capture folder, each tile's SHA-256 checked against the history), the versions
  marked `store: 'files'` (admin ops `tiles-upload`, `tiles-mark`).
  - Stage: 568 pages, none failed.
  - Production: on the switch-over day.
- **Links:** an old link or bookmark opens the tool, which goes to the sign-in and comes back to
  that page, so the Summary's and emails' links need no change.

### Step 4: switch-over (one agreed day)

- The AOE team gives an email for each person invited today.
- Their invitations' entries keep the names; each person's email is added with the same name and
  role.
- All invitation links are revoked; the old addresses lead to the DA sign-in.
- Production gets the backend of da-app-v3, the copy of the first shots
  (`tiles-to-files.mjs production …`) and its people; main gets the tool.
