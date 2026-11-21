# Product detail on the readable-settings approach: QA at 4 widths (step A, 2026-11-07)

**Run:** local QA tool, f5a17f26.
- Source www.stryker.com vs `/rs/…` on readable-settings-v3.
- 672 pairs at 1440 / 1100 / 860 / 375 px, text-only, evidence.
- All ok, 2 h 43 min.
- Triage: `.cbr/qa-pd-rs/triage.txt` (`.cbr/local-scripts/qa-triage.py`).

| Width | Health min | p10 | median |
|---|---|---|---|
| 1440 | 57 | 86 | 92 |
| 1100 | 56 | 83 | 91 |
| 860 | 54 | 82 | 90 |
| 375 | 55 | 83 | 92 |

## Shared findings, by pages affected

| # | Finding | Pages | Cause | Fix |
|---|---|---|---|---|
| 1 | Related Categories empty (the source's tag crumbs: "Related categories", category links) | 349 | The block reads `/us/en/tags.json`. The sheet exists locally (`content/us/en/tags.json`, 183 tags) but was never uploaded: 404 in DA and on every preview, so the block renders on no corp page | Upload the sheet to DA `/us/en/tags.json` and preview it. Same path for both approaches |
| 2 | Footer legal links 158 px to the left at 1100 px | 672 | Footer layout rule at a different width than the source's 1024 px desktop step | Footer CSS (blast radius: every corp page) |
| 3 | "Connect with us" (gold box) line height 49.98 vs 38.955 px | 182 | A scaled heading in a boxed section keeps the default heading line height; the source uses 1.06 | `styles-corp.css`, with blast radius |
| 4 | Contact-aside fragment link text-align center → start | 170 | To check: likely invisible (shrink-wrapped button) | Check visually first |
| 5 | Contact form fields missing (16 texts on trauma pages, 21 on foot & ankle) | many of the worst pages | Lazy form: the capture runs before the form loads (known, identical when scrolled slowly) | Measurement: `waitForTarget` on the form in the QA request; re-run those pages |
| 6 | Marketo labels line height 16.8 → 18 px, button weight 300 → 400 | 321 | Weight: known false positive (only 400/700 Futura faces load). Line height: real, small | Low priority |
| 7 | Footer paragraph line height 20 → 19.25 px | 672 | Footer CSS | With #2 |

## Known before the run

- 2 mobile hero XFs can't be built from desktop snapshots (1788-platform, Insignia); phones get the desktop hero.
- 6 hosted carousel XFs no page links (Sonopet iQ, CoPilot, NPseal).
- 8 pages with missing text (`check-coverage.js`; the same before the library).
- A source link to `/content/preview/…/ibed-wireless.html` (401 on live) in the analytics-cta XF.
- 1788-platform "Contact us": a boxed section in a column. The boxed rule overrides the column position, and the box padding uses the wrong reference width. 7 sections on 4 documents.

## Worst page

`joint-replacement/products/triathlon-ts`: health 54–57 at every width, 48 missing / 33 extra / 9 edited texts. To look at first (visual comparison and root cause).

## After the first fixes (60-page sample, run 78e78c4f, the same pairs as in f5a17f26)

Fixes:
- **Footer:** the legal row and gap from 900px (PR #531, 780be7d).
- **Tag sheet:** uploaded to DA and previewed.
- **`getLocalePrefix`:** ignores the `/rs` root (8cc1927). `/rs/us` read as a locale, so the locale sheets, tags.json among them, were fetched from `/rs/us/…`.

Diff route, f5a17f26 → 78e78c4f, 240 page-widths:

| Width | Health Δ (mean) | Improved / worse pages | Findings closed / new |
|---|---|---|---|
| 1440 | +1.4 | 22 / 0 | 183 / 77 |
| 1100 | +2.8 | 57 / 0 | 500 / 123 |
| 860 | +1.1 | 22 / 2 | 225 / 201 |
| 375 | +1.6 | 23 / 1 | 178 / 68 |

- **Closed:** all footer findings at 1100px (300 on 60 pages), and "related categories" plus the category links (missing before).
- **New:** mostly the now-rendered Related Categories block placed differently from the source (3 pages per signature). Next to look at.
- **Worse:** variax-2 (860) and infinity (375). A Marketo form's fields not loaded in time in this run; the form loads when scrolled (`mktoForm_3079`). Measurement noise.
- **Final full run:** split the pages. The 321 Marketo pages get `waitForTarget` on the form fields; the rest run without it.

## Layout fixes (2026-11-08, PR #531 4fbc8b4; 60-page sample eb275b93 vs 78e78c4f)

- **Corp flex sections side by side from 600px** (source col-sm-*, 841px), not the patients 900px. ankle-truss-system contact band at 860px: two columns as live.
- **Boxed section in a column** keeps the column's place, with its side margins outside the colour; the padding resolves against the column. 1788-platform "Contact us" equals live at 1440 / 1100 / 375px (x 522, 396px wide, padding 22 / 22 / 8.8 / 26.4).
- **Shadow box side margin** replaces the 10px. axs-universal equals live (x 99, 1242px, padding 55.2px).
- **Import:** a column control of two one-wrapper columns keeps its split (`flex-67-33`); 5 product pages.
- **Content drift:** 3 pages changed on live after the 30 Oct page cache (triathlon-ts, blueprint, inspace; `.cbr/local-scripts/live-drift.py`). Re-recorded and re-imported. triathlon-ts now has the live content.
- **Uploaded to DA:** the 7 changed `/rs` documents. Their preview is pending the user's request.
- **Result:**

  | Width | Health Δ | Better / worse | Closed / new |
  |---|---|---|---|
  | 1440 | −0.05 | 0 / 1 | 15 / 17 |
  | 1100 | −0.13 | 0 / 1 | 30 / 48 |
  | 860 | +0.68 | 16 / 3 | 282 / 219 |
  | 375 | +0.15 | 1 / 0 | 32 / 21 |

  The two drops are known noise: variax-2's lazy Marketo form, and blu62's counters.

**Product intro right column: done locally (user chose "button inside the block", 2026-11-08).**
- **Related Categories block:** an optional first row of links (the column's buttons), shown above the heading; the block stays when the page has no categories but has a button.
  - Its link colour is limited to the category links.
  - `--corp-tag-button-gap` 37px, measured on live.
- **Import (corp library):** a column of button(s) followed by the Related Categories block becomes the block with the buttons in its first row, so the column is one wrapper and the split follows (`flex-67-33`). A flex section also keeps its buttons' colour (`btn-purple` / `btn-blue`; lost before).
- **Checked on medpor-neurosurgery against live at 1440 / 860 / 375:** button and heading at the same x and width, purple button with white text, 75px from button to heading.
- **Full re-import (1,010 docs):**
  - links ok; coverage unchanged (996 ok, 8 known);
  - 153 docs differ from DA: 141 buttons moved into the block (+10 of the same move), 29 intro sections with their split and button colour, 2 colour-only.
  - List: `.cbr/pd-full/changed-153.txt`.
- **Pending the user's go-ahead:** push the block + token to PR #531; upload the 153 docs to DA and preview them (plus the 7 uploaded earlier); then QA.
- **Block Library:** the Related Categories entry needs its new optional first row.

**Was open: the product intro's right column.**
- On live it holds the "Request information" button above Related Categories (col-sm-4).
- Ours puts the button under the intro text, because default content and blocks are separate wrappers.
- Affects about 150 pages.
- Options:
  1. The Related Categories block takes the button as an optional first row (content model change).
  2. The flex-67-33 section becomes a grid that stacks the wrappers after the first in the right column (CSS only, but the button would come after the block in the DOM).
