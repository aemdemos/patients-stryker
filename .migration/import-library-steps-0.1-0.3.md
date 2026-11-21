# Import library: steps 0.1–0.3 (2026-11-07)

Plan: `.migration/plan-2026-11-07.md`. All local, nothing pushed.

## 0.1 Baselines

- **Samples:** 22 product-detail and 13 news pages, with their 64 XFs; 97 documents.
  - Product detail: 6 hard pages, then a greedy cover of all 54 components product-detail pages use.
  - News: 3 hard pages, then a cover of all 34 components.
  - Picked by `.cbr/local-scripts/baseline-pick.py`.
- **How they were made:** imported offline from the page cache (`.cbr/local-scripts/import-baseline.sh`, the same steps as `full-import.sh`, without the copy into the preview), in the class form and converted.
- **Reproducible:** two imports of each are identical. Stored in `.cbr/baselines/` (README there).
- **Two XFs can't be built:** the mobile hero XFs (1788-platform, Insignia), because the cache holds desktop snapshots. The pages don't link them, so phones get the desktop hero. An existing gap, for step A.

## 0.2 One library: `tools/importer/corp/`

- **Source:** the news-detail-engine copy (a superset of the product-detail copy), plus `import-corp-fragments.js`, which builds every XF of our templates.
  - The template check is gone: no more own / shared split.
  - `import-product-detail.js` and `import-news-detail-engine.js` are the profiles (name, description, page facts) on top of `./corp/corp-import.js`.
- **Impact on the samples:**
  - News: 31 of 31 identical.
  - Product detail: 16 of 66 changed, all by the news-side fixes:
    - phone grids for 4-column controls (`grid-m-12-12-12-12`);
    - `bold-body` disclaimers;
    - heading em sizes relative to the plain heading;
    - a lone column's desktop width (`col-md` before `col-sm`).
- **Checked against live** (`probe.mjs`, the baseline vs the library, `content/drafts/impact/pd-a|pd-lib`):

  | Item | Live | Baseline | Library |
  |---|---|---|---|
  | LUCAS 3 h1 | 49px | 39.2px | 49px |
  | Neptune S h4 | 26.25px | 17.5px | 26.25px |
  | Pivot Guardian h4 | 43.75px | 29.2px | 43.75px (size tag) |

- **One regression found and fixed:** the Insignia size-specific-collar XF lost its two columns.
  - Cause: the news rule "a lone column gets the row rules" also hit a lone 2/6 image inside a nested 6-column grid.
  - The rule now applies in a 12-column grid only (`corp-section-builder.js`). The XF is back to its columns, and news is unchanged.
- **Existing, not caused by the library:**
  - 1788-platform "Contact us" sits in a centred 1/3 column on live (x 675) but at x 339 (baseline) / 220 (library). For step A.
  - The phone grids could not be checked on live: Adaptable Arm Positioner's text has changed since the cache was recorded. Also for step A.

## 0.3 The import writes the readable form

- **The writer:** `tools/importer/corp/settings-writer.js`, the converter's function, now in the library.
  - `convertReadable(root)` works on `.plain.html` form documents. The command-line converter (`.cbr/local-scripts/settings-convert.mjs`) now loads it from the library: one copy of the code. Its output on the baselines is byte-for-byte unchanged.
  - `writeReadableSettings(main, document)` is the last step of the page import (`corp-import.js`) and of the fragment import (`xf-fragments.js`, every path).
  - It bridges the import DOM to the `.plain.html` form and back: sections between `<hr>`s; blocks keep their tables; Section Metadata and Metadata are rebuilt with `createBlock`. It also adds `style-settings: on`.
  - It drops the source's own plain `<span>`s first, which the runner would drop too.
- **Result:** the readable import equals "library import + converter" on all 97 documents. The only differences are heading ids (the runner numbers duplicates; EDS derives ids itself) and whitespace between tags (`impact-diff.py --ignore-ids`).
- **Two bugs found on the way, both fixed:**
  - the emptied tables stayed in the body;
  - the source spans became bracket tags.
- **`scripts/span-tags.js`** now has its own `toClassName` (the same 6 lines as aem.js). The import bundles include it, and importing `aem.js` would run its page `init()` (RUM) inside import pages. Same behaviour on the site; lint clean.
- **New baselines:** `.cbr/baselines/<t>/library/` (the library's readable output, accepted).

## Left as they were

- The per-template copies `tools/importer/product-detail/`, `tools/importer/news-detail-engine/` and their `import-*-fragments.js`: unused now, to delete after review.
- `import-xf-fragments.js` and the shared rules at `tools/importer/*.js` stay for the other importers.
- Local preview drafts of the review: `content/drafts/impact/pd-a`, `pd-lib` (local only).

## 0.4 The /rs root

- **`tools/importer/corp/root.js`:** `ROOT = '/rs'`, `rooted(path)` and `rootFragmentLinks(main)`. Page, XF and modal documents are saved under `/rs`. Links to fragments and modals point under it; links to pages keep their real paths.
- **Modals:** `corp/modal-fragments.js` + `import-corp-modal-fragments.js`, the library's copy of `import-modal-fragments.js` (readable, under `/rs`). 40 product-detail pages link the 6 ProCare modals.
- **`fast-import.mjs`:** `?modal=` no longer counts in the page cache key (the modal is in its product page's snapshot).
- **Checked** (`.cbr/local-scripts/rs-check.py`):
  - with the root taken out, all 66 product-detail and 31 news documents equal the import without the root;
  - every fragment link points to a document of the output;
  - the 6 modals equal the existing modals, converted.

## 0.5 Import impact check and rule finder: `tools/importer/impact/` (README there)

- **The check:**
  - `templates.json`, `samples/<template>.txt`, `baselines/<template>/` (accepted: 72 + 37 documents);
  - `impact.sh [template …] [--accept]`, built on `import-sample.sh` (offline, page cache) and `compare.py` (same / changed / new / missing, hunks, broken fragment links).
  - About 3 minutes for both templates.
- **Proven:**
  - two runs give 72/72 and 37/37 the same;
  - with the nested-grid fix undone, exactly 1 document is reported changed (the Insignia collar XF, with its differences); restored, all the same again.
- **`rule-finder.py <component | class | word>`:** decision, handler with its doc comment, library lines (or the class's family, e.g. `fontsize-…vw`), pages per template, samples that cover it. Example: `filteredcontenttypegrid` has an approved decision, no handler, 126 pages and no sample.
- **`pick-sample.py`:** the sample picker. `README.md` has the workflow and the draft recipe for a new template (step 0.6, for the team).
