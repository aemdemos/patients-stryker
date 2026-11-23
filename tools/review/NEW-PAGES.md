# Migration scope, published pages and first shots: design (not built yet)

How pages come into the client review, are paired with their source page, get their first
source shot and are organised, after the user's decisions of 23 Nov 2026. Facts first (measured
that day), then the design, then what is still to decide.

## Facts

| What | Measured |
|---|---|
| Published pages | The live query index (`main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json`) lists the published pages: 569 today, the same as the preview index |
| Pages with a first shot | 568 (the 569th, a 2018 BPCI blog page, has no known source pair) |
| Source ↔ EDS | **Source → EDS is a fixed rule** (the importer's cleaned names: lowercase, every run of other characters one `-`; `…/index` → `…/`), **EDS → source is not** (568 of 2,552 source paths change when cleaned): pairs are kept, never worked out backwards |
| Known source pages | 2,553 in the migration catalog (`tools/importer/data/catalog/site.json`: source path, AEM template, title) |
| Checking a source page | Only with a real browser (stryker.com answers 404 to every plain request) |
| **A browser inside the review backend** | **Works** (tested 23 Nov with a throwaway action, removed after): Chromium starts in ~1.7 s, `www.stryker.com/us/en/search.html` and `…/foot-and-ankle/products/T2-Ankle.html` load with status 200 and their real titles, ALTCHA and the cookie banner blocked, the page rendered with its own fonts (checked by eye); a full-page shot in ~3 s per page and width |
| What it took | The backend runs Debian 10 (an old system library, glibc 2.28): the browser build is pinned to the last one for Amazon Linux 2 (Chromium 133), plus Debian 10's own NSS / NSPR libraries shipped with the action (Amazon's base image has them, Debian's lacks them). 2 GB memory |

## Decisions (user, 23 Nov 2026)

1. **A migration scope table in Document Authoring** pairs every source page with its EDS page
   and defines the scope of the migration.
2. **Batches and groups are organised on the whole scope**, from the AOE team's admin pages
   (status page and Invitations), not only on the published pages.
3. **The review tool shows the published pages only**, by itself, from the live query index.
   The batch, group, template and area filters show how many of them are published. **A page
   published later joins the review** with the status "Not reviewed yet".
4. **The first shot is taken when the page joins**, by a **browser inside the backend**.
5. No "no source page" case: a source that doesn't answer is a wrong pair, to correct in the
   table.
6. **Representatives are optional suggestions**, chosen or changed any time; without one, the
   **first page of the group** is its representative. **Approving one page approves its group.**

## Design

### 1. The migration scope table (Document Authoring)
- A sheet in DA, e.g. `/review/migration-scope`, one row per page in scope:
  `source` (`https://www.stryker.com/….html`), `eds` (the EDS path), `template` (the AEM
  template, for the filter). The AOE team edits it in DA and **previews** it; the backend reads
  the previewed sheet (`…aem.page/review/migration-scope.json`): no DA credential needed.
- Checked on every read, problems listed for the AOE team in the admin pages: a source or EDS
  page in two rows, a source not on `www.stryker.com/….html`, an EDS path that isn't the
  source's cleaned name (allowed, but shown: a renamed page).
- **Initial content** (see *Still to decide*): the 568 pairs we have, plus the other catalog
  pages with their EDS path by the importer's rule and their template; the AOE team removes what
  is out of scope.

### 2. Organising the scope (admin pages, AOE team)
- The status page lists **every page of the scope table**, published or not, with its state
  ("Not published yet" for the others), and keeps the batch and group marking, the
  representative, the filters. Batches and groups are kept in the backend, as today, on the
  EDS path.
- Pages **published but not in the scope table** are listed as such (no source pair, so no
  shot and no review) until a row is added.

### 3. What reviewers see
- The review tool, the status page and the results for reviewers show the pages that are **in
  the scope table and published** (in the live index). Counts in the filters (batch, group,
  template, area) are counts of those pages.
- A page that becomes published **joins by itself** as "Not reviewed yet"; its review data
  stays when it is unpublished and comes back with it.

### 4. First shots, taken by the backend
- A **scheduled backend action** (every 15 minutes) compares the live index with the shot
  histories: every published page of the scope table without a shot gets its **first shot**, in
  the backend's browser, at every width, with the source from the table.
- Checks before it is kept: status 200 and no redirect to another page; otherwise the page is
  listed for the AOE team as "Source to correct: answers 404 / redirects to …" (a wrong pair),
  tried again after the row changes.
- **Tiles in the backend's own storage** (not DA: the backend has no DA credential, and only the
  backend can write there, which is better evidence), served to the tool by a web action. The
  first shots of 23 Nov stay in DA where they are; each version says where its tiles are.
- Every shot keeps what shots keep today: dates, URL, status, final URL, the page title, a
  SHA-256 of every tile; plus **when the page was first seen published**, so the gap (at most
  ~15 minutes) is on record.
- **Refresh source shot** then needs no one: the AOE team's click starts the same capture, and
  the new shot shows within minutes.
- A daily health check (one known page) reports in the admin pages if the backend's browser
  stops working (e.g. after a change of Adobe's container).

### 5. Groups, representatives, group approval
- Representative: a suggestion, set or changed any time, or none; without one, the **first page
  of the group** (path order) is shown as the representative ("★ first page").
- **Group approval**: a page of a group approved → every page of the group counts as approved
  ("Approved with its group: <page>, <who>, <when>"), derived (nothing written on the other
  pages), so a page moved out of the group leaves the approval; a page with open comments of its
  own still shows them.

### What it changes
- Backend: reading and checking the scope table; page lists = scope ∩ live; the scheduled
  capture action (browser, tiles in its storage, a tile web action); Refresh through it; group
  approval and the implicit representative in the page states.
- Admin pages: the whole scope with "Not published yet", "Published, not in the scope",
  "Source to correct", the health check.
- Tool: pages from scope ∩ live; tiles from either store; group approval shown.
- `refresh-shots.mjs` and the DA uploads stay for the first shots of 23 Nov only.

## Still to decide
- **The scope table's first content** (it is written to DA): the 568 published pairs only (the
  AOE team adds the rest), or all 2,553 catalog pages with their EDS path by the importer's rule
  and their template (the AOE team removes what is out of scope).
