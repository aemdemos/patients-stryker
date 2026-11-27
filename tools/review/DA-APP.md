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

## Steps 2–4 (after the proof, to be agreed)

2. **Backend:**
   - a people list replaces invitations: email, role (AOE team / reviewer), the pages they review,
     added by whom and when, removed;
   - every action takes the DA token (checked with Adobe, the email kept for a few minutes per
     token so pages stay fast), and the audit records emails;
   - per project: the site (org/site) and its people, so the same backend serves other projects.
3. **Tool:**
   - an authorisation admin replaces the Invitations page;
   - every page of the tool opens through its DA address (an old address forwards there) and reads
     the sign-in from the SDK;
   - the frames use the app's host;
   - optionally, the admin keeps the site's access list (`access.preview.allow`) in step.
4. **Switch-over:** on one agreed day, with no period running both logins. Each invitation's
   entries move to its person's email (the AOE team provides the emails), then all invitation
   links are revoked.
