# Newly published pages: design (not built yet)

The client review reads its pages from the main site's query index, so a page published on main
is in the review at once. Its comparison and its evidence need a **first source shot**, and
nothing takes one today: the tool shows "No source shot of this page yet" and Refresh is refused
("new pages are added another way"). This document is the design for that other way. Facts
first (measured 2026-11-23), then the design, then the decisions it needs.

## Facts

| What | Measured |
|---|---|
| Pages in the review (query index, fragments left out) | 569; all 569 were there at the first capture (23 Nov): no new page yet |
| Pages with a first shot | 568 |
| Today's page without one | `/us/en/joint-replacement/sps-blog/2018/bpci-a-team-last-but-not-least`: no export, and its source answers **404** in a browser, in either letter case. A page with **no source page** already exists |
| Source pages known to the migration | 2,553 in the committed catalog `tools/importer/data/catalog/site.json` (key = the source path, letter case kept, with template and title), the same as the exports (2,552, snapshot of 27 Oct 2026) |
| Source path from the EDS path | **Can't be derived**: 568 of the 2,552 source paths change when cleaned (letter case `T2-Ankle`, `--`, trailing `-`, `_`). Only the catalog (or the exports) gives it |
| Two source pages, one EDS path | 1 pair (`…/shoulder-arthroplasty/primary-reversed` and `…/primary-reversed-`) |
| What a page carries | Its `template` meta; no source URL (its canonical is the EDS page) |
| Checking a source URL | **Needs a real browser.** stryker.com answers **404 to every plain request** (curl), also for pages that exist (`/us/en/search.html`): a quick check without a browser says nothing. A browser load (ALTCHA blocked, as the capture does) gives the real answer: 200, 404 (`404 \| Stryker`), or a redirect |
| Capture of a missing page | Refused (status ≥ 400): a page is never compared with an error page by accident. From the second version on, a shot records the HTTP status and the **final URL** (redirects show) |
| Who takes shots | Me, on request (it writes to Document Authoring; no DA technical account, decision of 17 Nov) |

## Design

### 1. Find the pages that need a first shot
- The backend lists the pages that have a shot history (file names in `<space>/shots/`, one
  cheap list call). The **status page** gets, for the AOE team, a count and a filter
  **"Without a source shot"** (pages in the index but not in the history, not marked "no source
  page", see 4). The tool shows the same on the page itself.
- The first time a page is seen without a history, the backend records **when it came into the
  review** (`firstSeen`, from the status page or the tool's visit; the query index has no
  publish date, only `lastModified`). The first shot is later compared with this date (see 5).

### 2. Its source address: proposed, then confirmed
- The tool proposes the source from a small **source paths file** committed with the tool,
  generated from the catalog (`site.json`): EDS path → source path(s). It covers every source
  page the migration knows. It holds only public page paths (no export content), like the
  catalog it comes from.
- The AOE team **confirms** the proposal, picks one of two (the one collision), or types another
  `https://www.stryker.com/….html` address (renamed pages, pages newer than the catalog). The
  address is kept with the request and, after the shot, in the history (every version has its
  `url`).
- No proposal (a page the catalog doesn't know): the AOE team types it, or marks the page "no
  source page" (4).

### 3. Taking the first shot
- **Add the source page** (AOE team, in the tool and in bulk on the status page: paste pages, or
  "Use the pages shown"): a request like Refresh, with the confirmed source address.
- I take the requests when asked ("take the requested source shots"), with the same script as
  refreshes (`refresh-shots.mjs`, extended: a request with an address and no history becomes the
  first version). Same rules as every shot: own folder, never over a file, hashes, read back.
- **Checks before the first shot is kept** (in the browser, as the capture):
  - the source answers 200; a 404 fails the request with "the source page is gone (404)";
  - **no redirect to another page**: a final URL other than the address (e.g. to the home page)
    fails the request with "the source redirects to …", so a page is never compared with a
    wrong page; the AOE team can confirm the final page as the source and ask again;
  - the page's title is kept next to the shot, so a reviewer sees what was compared.

### 4. Pages that have no source page
- The AOE team marks a page **"No source page"**, with the reason (new on the new site only; the
  source was removed; it redirects elsewhere). Organisation data, like batches: who and when, in
  the audit; can be taken back.
- The tool then shows "This page has no source page on stryker.com: <reason>" instead of a
  comparison; the status page shows it as such and leaves it out of "Without a source shot".
- Today's case: the 2018 BPCI blog page.

### 5. Evidence for late first shots
- A page's first shot can only show the source **as it is when the shot is taken**, never as it
  was earlier. So the gap is shown, not hidden: "First shot taken 3 Dec 2026; the page came into
  the review on 28 Nov 2026" (history and tool), from `firstSeen` (1).
- The shorter the gap, the better the evidence: take first shots in the same session as the
  pages are noticed (3); with an automatic daily check (decision 2) the gap is a day at most.

### 6. Batches, groups and representatives
- Pages without a first shot can be organised (batches, groups: no review yet), with a warning
  sign in the status page's Batch / group column.
- A **representative page** is what the customer reviews for its whole group, so it needs a
  source shot or a "No source page" mark: "Make the representative of its group" refuses pages
  without either, with the reason (decision 4).

### What it changes
- Backend: history list (pages with shots), `firstSeen`, requests with a source address, kind
  `source` (no source page + reason) as organisation data. Deploy to Stage.
- Tool: the page without a shot: proposal, confirm / type, Add the source page, No source page;
  the gap in the history box. Status page: count, filter, bulk add, column sign.
- Scripts: `refresh-shots.mjs` takes first-shot requests (address, redirect and 404 checks,
  title); a script that writes the source paths file from the catalog.
- Tests like the earlier ones (test pages, test invitations).

## Decisions needed (recommendation first)

1. **Source address:** proposed from the catalog and confirmed by the AOE team
   *(recommended)*, or always typed by the AOE team.
2. **When first shots are taken:** when you ask me, as for refreshes *(recommended for now: no
   DA technical account)*; or automatically every day (needs a DA technical account and a
   scheduled job; the gap would be a day at most).
3. **Pages with no source:** the AOE team marks them "No source page" with a reason
   *(recommended)*, or they are simply left without a comparison.
4. **Representatives:** must have a source shot or a "No source page" mark *(recommended)*, or
   only a warning.
