# Newly published pages: design (not built yet)

The client review reads its pages from the main site's query index, so a page published on main
shows up at once, but nothing pairs it with its source page or takes its first source shot. This
is the design for adding pages to the review, with the user's decisions of 23 Nov 2026. Facts
first, then the design.

## Facts (measured 2026-11-23)

| What | Measured |
|---|---|
| Pages in the query index (fragments left out) | 569, all there at the first capture (23 Nov): no new page yet |
| Pages with a first shot | 568, each paired with its source from the AOE exports |
| The one without | `/us/en/joint-replacement/sps-blog/2018/bpci-a-team-last-but-not-least`: no export; its guessed source answers 404 in a browser. Per the user, a missing source means a **wrong pair** (a deleted source page needs no migration), not a page without a source |
| Source address from the EDS path | Not reliable: 568 of 2,552 source paths change when cleaned (letter case, `--`, trailing `-`, `_`). Hence **pairs** |
| Checking a source address | **Only with a real browser**: stryker.com answers 404 to every plain request (curl), also for pages that exist. A browser load (ALTCHA blocked) gives the real answer |
| A capture of a missing page | Refused (status ≥ 400); from the second shot on, every shot records the HTTP status and the final URL (redirects show) |

## Decisions (user, 2026-11-23)

1. **Pages are added by the AOE team, by hand, when they are ready**, as pairs
   `sourceURL,edsURL` (one per line, the QA tool's format). The batch and group are given then
   or later.
2. **The first shot is taken when the page is added.**
3. **No "no source page" case**: a source that doesn't answer 200 is a wrong pair; the add fails
   with the reason and the AOE team corrects the pair.
4. **Representatives are optional suggestions**, chosen or changed any time. A group without one
   has the **first page of the group** as its representative. **Approving one page of a group
   approves the whole group.**

## Design

### 1. Adding pages (status page, AOE team)
- "Add pages" box: paste lines `https://www.stryker.com/….html,https://main--stryker-com--strykerenterprise.aem.page/us/en/…`
  (the EDS URL on any of the site's hosts, or a path); optionally a batch and a group for all of
  them.
- Checked at once, line by line, with the reason for each refusal:
  - the source on `www.stryker.com`, ending `.html`;
  - the EDS page **published** (in the query index);
  - the EDS page not added already (a page is added once; a wrong pair is corrected with
    "Change the source", which takes a new first shot and keeps the earlier ones in the
    history, marked as a corrected pair);
  - each source and each EDS page in one pair only.
- Accepted lines become **add requests** (backend, audited: who, when, the pair). The page shows
  as "Being added" until its first shot is there, or "Not added: <reason>" (then the AOE team
  corrects the line and adds it again).

### 2. The first shot, when the page is added
- The capture runs in a browser (ALTCHA blocked), at every width, as every other shot. It checks
  the source: **200 and no redirect to another page** (a final URL other than the source fails
  the add with "the source redirects to …", so a page is never compared with a wrong page) and
  keeps the page title with the shot.
- Recorded as the page's first version, with everything a shot keeps (dates, URL, status, final
  URL, SHA-256 of every tile), plus who added the page and when.
- **"Taken when the page is added" needs a capture that is always running** (nothing in the
  review today runs a browser by itself: I take shots when asked). See *Open decisions* below.

### 3. Which pages the review lists
- The review lists the **pages that have been added** (the 568 paired pages count as added by
  the first capture). Reviewers see only these.
- The AOE team also sees, on the status page, **"Published, not added yet"**: pages in the query
  index that are not added, so none is forgotten (today: the BPCI blog page).

### 4. Groups, representatives, group approval
- A group's representative is a **suggestion**: set or changed any time ("Make the
  representative of its group"), or none. Without one, the **first page of the group** (path
  order, as in the lists) is its representative; the lists mark it as such ("★ first page").
  "Representative pages only" shows one page per group (the chosen or the first).
- **Group approval:** when a page of a group is **approved** (its page status), every page of
  the group counts as approved: the status page and the tool show "Approved with its group
  (<page>, <who>, <when>)". Nothing is written on the other pages (derived from the group and the
  approved page), so moving a page out of the group takes it out of the approval. A page of the
  group that has its own open comments shows both, so nothing is hidden.
- Group approval is new: today a page's status counts for that page only.

### What it changes
- Backend: add requests (pairs, checks, states), the page list = added pages, "Change the
  source", group approval in the page states (overview), the implicit representative.
- Status page: Add pages, "Published, not added yet", Being added / Not added, group approval.
  Tool: the same states on the page; the page list from the added pages.
- The capture runner (see below), tests.

## Open decisions

**A. Which pages the review lists:** only the added pages, the others shown to the AOE team as
"Published, not added yet" *(recommended, as above)*; or every published page, adding only
giving it its source.

**B. What takes the first shot when a page is added.** Options:
- **A scheduled job in the repository's GitHub Actions** (every ~15 minutes, or started by the
  add): a browser on GitHub's machines takes the shots and stores the tiles **in the review
  backend's own storage** (no DA account needed). Needs: a repository secret (the backend's
  credential) set by a repository admin; works only if stryker.com lets GitHub's machines load
  its pages (to test first).
- **A browser inside the review backend** (App Builder): no extra service; may not fit the
  backend's size and memory limits, and the same question about stryker.com (to test first).
- **Me, when you ask** (as refreshes today): works now, but the shot is taken when you ask, not
  when the page is added.
Recommendation: test the first two on one page (both are reversible and need nothing from the
customer), then choose.
