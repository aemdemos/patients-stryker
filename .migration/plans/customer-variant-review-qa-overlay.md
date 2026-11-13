# Customer Variant Review & QA Overlay — Plan

## Goal

Customer reviewers go through the standard pages, pick a variant for each block from the variants that block type has, comment where no variant fits, and do the QA at the same pass. They compare against the as-is page (`/rs`) and a snapshot of the original stryker.com page, with synced scrolling. They save, and the state is kept on a server so other people on the customer side can reopen, continue and assess it. The output tells us exactly which variant each block gets on the standard pages, plus a QA issue list.

The review tool doesn't need to meet EDS standards. It never loads in production, and it never changes the content itself: decisions are applied afterwards by us.

## Decisions taken

| Topic | Decision |
|---|---|
| Base view | **The standard page.** The reviewer switches variants in place; the as-is page and the source snapshot are layers on top (flip / opacity / side by side), scroll-synced |
| Source page | **Snapshots only** (the framing check ruled out a plain frame; extension route not wanted) |
| Saving | **Adobe's form submission service → a Google Sheet**; reading back from the sheet **published to the web** as CSV. No sync script, no DA step |
| Login | **None** for reviewers. The audience is limited, and the pages aren't final |

## Framing check — done 2026-11-13

- Every stryker.com response (pages and error pages) sends `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: … frame-ancestors 'self' *.adobecqms.net`.
- From the branch preview, a normal browser refuses the frame (frame-ancestors violation, empty error page).
- With those two headers removed (the fullyframe method), the Prophecy page loads completely in a frame. The surrounding page still can't read or scroll it.
- **Outcome:** a plain frame is impossible, and you didn't want the extension route, so the source layer is snapshots.
- **Also found:** the branch preview enforces a strict script policy (per-page script key, trusted types). The review tool must load its scripts like the page's own scripts do, and build its interface with plain DOM calls, never inserted HTML.

## What already exists (reused)

- **The first pilot's review overlay** (`scripts/standardise-preview.js`, `?standardise`, preview hosts only), with:
  - per-block bars;
  - "use for the whole group";
  - group boards;
  - export as JSON;
  - `apply.mjs`, which applies decisions with content-hash protection.

  It covers Columns only and keeps state in the browser only. It will be rebuilt on the current variants, not extended as it is.
- **The QA tool's Sync** (`.qa-tool/lib/review-sync.js`): text runs and images matched between the two pages, and a scroll point mapped through the nearest match. It can be ported almost as is.
- **The rules already produce every variant from the same content:** a variant is a class on blocks that share one content model. The apply report lists every block with its section, index, original classes and assigned variant.
- **The page cache's live-page recording** (`fast-import.mjs`), the base for the snapshot capture.

## Which blocks get a switcher

| Block | Variants offered | Note |
|---|---|---|
| Columns | media-text, card-grid, page-intro, text-columns, feature-statement, image-row (+ wide-first / wide-last / equal) | Only the variants the content fits (rule check) |
| Cards | resources, teaser | |
| Hero | product-hero, banner, banner-light | |
| Video | video, autoplay | |
| Page Nav | jump links, sticky | `local` is a different content model, so it isn't switchable |
| Section background | grey-band, gold-box, purple-band, blue-band, none | Section-level switcher |
| Accordion, Statistics, Related Categories, Chart, Gallery, Tabs, Table, Marketo | none, one design each | Comment only |

## Architecture

```
Review shell (tools/review/, on the branch preview *.aem.page, ?review only)
├── Standard frame — /std/<page>   same site → full access: variant switchers, block outlines, pins
├── As-is frame — /rs/<page>       same site → full access: text anchors for the sync
├── Source layer — snapshot of www.stryker.com/<page> (picture + recorded text boxes), 1440 or 375
├── Toolbar: page list / next page, viewport 1440 ↔ 375, layer (as-is / source), mode (flip / opacity /
│            side by side), Sync on/off, reviewer name, Save, status (saved · waiting to show · shared)
└── Panel: the page's blocks with their variant, comments, QA notes; "page reviewed" ✓
```

1. **One shell page frames all versions** and sets each frame's width, so the phone view is part of the review. The standard and as-is frames are on the same site as the shell, so it reads and scrolls them directly.
2. **Variant switching** happens in the standard frame. Each switchable block keeps a copy of its undecorated content. Switching sets the variant class and re-decorates that block only, so the result is identical to the future page. "Next variant" cycles only the variants the content fits.
3. **Block identity:** an id from the block's section and block index plus a content hash, matching the apply report. Decisions map back to the documents, and a block whose content changed after review is flagged.
4. **Sync:**
   - standard ↔ as-is: the QA tool's anchor matching runs live on both DOMs (text runs + images);
   - standard ↔ source: the snapshot's recorded text boxes are matched against the standard page's live text the same way;
   - plus click-to-pin, and Sync on/off.
5. **Feedback types:**
   - a variant choice per block, with an optional "apply to all blocks like this";
   - a block comment ("none fits", "add a variant like …");
   - a QA note pinned to a spot and tied to the nearest text so it survives reflow, with a category (text / layout / image / link / other) and the viewport;
   - a page comment and a "page reviewed" mark.
7. **Results:** a summary (choices per block type, comments, QA notes per page) and an export that `apply` (rebuilt on `rules/variants.js`) applies to `/std`.

## Saving — form service → Google Sheet, read back from the published sheet

```
Save (browser) ──POST──▶ Adobe form submission service ──append row──▶ Google Sheet
                                                                          │ "Publish to the web" (CSV)
Open / refresh (browser) ◀──────────── published CSV (refreshes within ~5 min) ◀┘
```

- **Writing:**
  - Each save sends one row per change: page, item id (block / note), kind (variant / comment / note / reviewed), value, reviewer name, time.
  - The rows go to `https://forms.adobe.com/adobe/forms/af/submit/{form id}` with the `x-adobe-routing` header for this site.
  - No reviewer credentials. You set up the sheet once with your Google account and share it with the form service, as its documentation describes.
- **Reading:** the review tool fetches the sheet's published CSV and merges the rows per item, newest first, so reviewers don't overwrite each other. The tool shows who changed what, and when.
- **Delay:** the published CSV updates within about 5 minutes. The reviewer's own unsent and just-sent changes are kept in the browser and shown at once, marked "waiting to show", until they appear in the sheet.
- **Fallback:** export / import of a page's review as a file.
- **Limits:** about 10 million cells per Google Sheet, and 50,000 characters per cell. One row per change is far below both.

**To verify first (small test):**
- the service accepts this site (the docs list Google Sheets, OneDrive and SharePoint as destinations, and don't mention Document Authoring as a content source);
- whether it needs a published form definition on the site to issue the form id;
- CORS for the POST from the branch preview;
- CORS and the refresh delay of the published CSV.

## Snapshots (source layer)

- **Capture:** each stryker.com product page at 1440 and 375 wide, with ALTCHA blocked, as a full-page picture plus the box and text of every text run and image. It's based on the page cache's recording, in batches in the background, with progress updates. About 670 pages × 2 widths, a few hours.
- **Size:** compressed full-page pictures, about 200–400 KB each, roughly 0.3–0.5 GB in all. Their hosting is decided before the capture: DA media through the preview (needs your go-ahead), or captured and uploaded in batches as review proceeds.
- **Freshness:** each snapshot shows its capture date. A page can be re-captured on request.

## Prerequisites (each needs your explicit go-ahead)

- Upload the `/std` documents (985) and confirm the `/rs` documents are in DA, previewed on the review branch.
- Upload the Standard Block Library documents.
- Create the Google Sheet, share it with the form service, and publish it to the web as CSV (your Google account).
- If the service requires one: publish a small form definition for the review tool.
- Host the snapshots.

## Risks

- **The published CSV is readable by anyone with its link,** and the link sits in the review tool's code, which is in a public repository. Review data (choices, comments) is low-sensitivity, but it is effectively public. Anonymous saves also mean anyone who finds the tool could post rows; each row carries the reviewer name, and rows can be filtered.
- **Up to ~5 minutes** before a save is visible to other reviewers.
- **Three frames per page** can be heavy on large pages. The frames load lazily, and the source layer loads only when toggled.
- **Blocks hidden at load** (closed tabs, accordion panels, modals) get their switcher when opened, and are listed in the panel.
- **Fragments shared across pages:** a choice on a fragment's block applies wherever the fragment is used. The panel says so.
- **Snapshot capture** depends on stryker.com availability and its bot protection.

## Checklist

- [x] Framing check: headers on the home page and 4 product pages, framed visit with and without the framing headers
- [x] Decision A: snapshots only
- [x] Decision B: form submission service → Google Sheet, read back from the published CSV
- [ ] Test the save route: Google Sheet shared with the form service and published as CSV; test POST from the branch preview; check the form id requirement, CORS and the CSV delay
- [ ] Define the row format (page, item id, kind, value, reviewer, time) and the merge rules (newest per item, own pending changes shown at once)
- [ ] Build the review shell in `tools/review/`: frames, toolbar, panel, viewport toggle, layer modes; loaded only with `?review` on preview hosts; no inserted HTML (trusted types)
- [ ] Build the variant switcher in the standard frame: block registry from the variant rules, per-block re-decoration, fits-only cycling, section background switcher, group option
- [ ] Port the QA tool's anchor sync for standard ↔ as-is, with Sync on/off and click-to-pin
- [ ] Build the snapshot capture (1440 / 375, picture + text boxes) from the page cache's recording; decide snapshot hosting; capture a first batch
- [ ] Build the snapshot layer with text-matched sync against the standard page
- [ ] Build comments, pinned QA notes (category, viewport) and the page-reviewed mark
- [ ] Build saving (form service POST, published-CSV read, merge, pending state) plus file export / import
- [ ] Build the results summary and the export → rebuilt `apply` on `rules/variants.js` (content-hash protected)
- [ ] Pilot on 3–5 pages yourself, then fix
- [ ] With your go-ahead: upload `/std`, `/rs` and the Standard Block Library, host the snapshots, preview on the review branch, and share the review link
- [ ] After the review round: apply the choices to `/std`, re-run the content check and rule test, and turn the QA notes into fixes

Building any of this needs Execute mode.
