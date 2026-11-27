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

## The plan for steps 2–4 (draft, 27 Nov 2026: for the user's review before building)

### Who sees what: by role (the user's choice)

- **The AOE team:** the tool moves to the branch preview (`*.aem.page`). It shows preview content,
  pages not published yet included. They need Sidekick signed in to the site (they have it).
- **Reviewers:** the tool moves to the published site (`*.aem.live`). It shows only what is live,
  the rule that reviewers see published pages. They sign in with the normal Adobe sign-in page
  that DA shows. A free Adobe account on their own email is enough: no Sidekick, no DA editing
  rights, no entry in the site's access list. The review's people list decides what they may do.
- What follows from it:
  1. **A fix reaches reviewers only once it's published.** Today they see the preview. When the
     AOE team hands a page to the reviewers, the tool warns if the page's preview is newer than
     what is live ("publish it first, or the reviewer still sees the old page").
  2. **The source screenshots in DA** (`/review-snapshots-main`, the first shots) are on the
     preview only, so the published site answers 404 for them. They move into the backend's
     storage, where the newer shots already are (recommended), or get published.
  3. **DA's warning**, once per browser: "may take any action on your behalf, including deleting
     content". For a reviewer without DA rights, the token can't change the site's content. The
     start page and the welcome email say so in a sentence.
  4. **Signed in, but not on the list** (often another email): the tool says "You're signed in as
     x@y.com, which isn't part of this review: ask the AOE team", and the AOE team adds that email.
  5. The tool must run on the published site: today the review and status pages refuse it.

### Step 2: backend

- **Projects:** `{ id, org, site, title, space, hosts: { aoe, reviewer } }`; stryker.com is the
  first one (space `main`). Another project is a new entry, with its own people, scope and
  entries.
- **People (in the App Builder database):** per project, `{ email (lower case), name, role
  (aoe | reviewer), paths, addedBy, addedAt, removedBy, removedAt }`. Admin ops: add, change,
  remove, list; the first AOE admins are added by an admin op (names from the user).
- **Sign-in on every web action:** `authorization: Bearer <DA token>`.
  - The backend checks it with Adobe once and keeps the email for 10 minutes per token
    (its hash, never the token), so page loads stay fast.
  - It looks the email up in the project's people list.
  - It gives the actions the same internal shape as an invitation today (name, role, scope), so
    the actions barely change.
  - The audit records emails.
- Invitations keep working for the existing branches until the switch-over: the live review
  doesn't change.
- **Allowed addresses (CORS):** the published site and DA's preview are added.
- **Tests:** real Adobe tokens can't be made in tests, so the Stage backend gets test sign-ins.
  They are signed by the backend itself, issued by an admin op, refused on Production.

### Step 3: the tool

- **One way in:** `https://da.live/app/strykerenterprise/stryker-com/tools/review/<page>?…`.
  - The page loads DA's SDK first, asks the backend who you are, then moves to your role's host,
    keeping the page and its parameters. DA passes them on and says hello again.
  - Opened outside DA (old links, bookmarks), any tool page forwards to its DA address.
- **Every page** keeps the token in memory only, takes DA's refreshed tokens, and sends the
  token instead of the invitation. The top bar shows the name, email and role.
- **People page (AOE team)** replaces Invitations: list and search; add an email with name, role
  and pages; change; remove (asked first, in the shared dialog).
- **The not-on-the-list page** (above).
- **Links** in the Summary, Status and emails become DA addresses.
- **The published site** opens for reviewers; the source screenshots come from the backend.
- The hand-over warning (step 2, point 1).
- **Tests:** the stand-in for DA used for the proof (a page that frames the tool and says hello
  like DA) plus Stage test sign-ins, for the start, the move, the People page and refusals.

### Step 4: switch-over (one agreed day)

- The AOE team gives an email for each person invited today.
- Their invitations' entries keep the names; each person's email is added with the same name and
  role.
- All invitation links are revoked; the old addresses forward to DA.

### Other projects

- The tool has to run on each project's own hosts: only there can it read the project's pages
  in its frames (side by side, Scroll Sync).
- So each project gets a copy of the `tools/review` folder with its own `config.js`, and shares
  the backend, with one project entry per site.
- A central copy of the tool on one site could not read other sites' pages.

### Open decisions

- The hand-over warning before reviewers see a page (point 1).
- The first source screenshots: into the backend's storage, or published.
- Who the first AOE admins are.
