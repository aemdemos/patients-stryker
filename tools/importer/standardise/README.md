# Standardise while you QA (pilot, branch `standardise-v3`)

An experiment, kept off the main line: can the migrated corp pages move from one-off measured
values (the readable settings: `Text box`, `Grid`, `Column widths`, size tags …) to a few
named **standard variants**, chosen block by block while the pages are reviewed?

- Code: this branch only (forked from `readable-settings-v3` at 48bac1b).
- Content: `/std/…`, copies of 30 pilot product pages and their fragments (`/rs` is untouched).
- Previews: `https://standardise-v3--stryker-com--strykerenterprise.aem.page/std/…` once the
  `/std` documents are uploaded (on request only); locally a second dev server on this
  worktree (`aem up --html-folder content --port 3001`).
- The review flow uses no internal tool (no QA tool, no blast radius): reviewers compare the
  page with stryker.com by eye, as the customer would.

## Files

| File | What |
|---|---|
| `inventory.mjs` | Every block instance of the documents: settings, cell kinds, tags, ids and content hashes |
| `cluster.py` | Columns instances → groups (structure + layout) → clusters (design options); report of what standardising drops |
| `pick-pilot.py` | The pilot pages: every cluster of the 10 largest groups, 30 pages |
| `copy-pilot.py` | Copies the pilot pages and their fragments `/rs` → `/std` |
| `rules/columns.js` | The transfer rules: an instance → a standard (DOM only: browser and Node) |
| `test/rules-columns.test.mjs` | The rules on one example per cluster, against the standard's invariants |
| `gallery.mjs` | The standards gallery draft (`/std/drafts/standards`) |
| `data/` | `clusters-columns.json` / `.md`, `pilot-pages.txt` |

## What the data says (Columns, 2176 instances on 667 product pages)

- 144 structure + layout groups. The 10 largest cover **76%** of the instances, and the 3
  largest 42%. Exact look (with every measured value) is far more scattered: the top 10 of those
  clusters cover only 35%.
- The largest groups are:
  - an image beside its text (left or right, equal widths: 465);
  - the product intro (276, the template's own, already a named variant);
  - 3 image + text columns (193);
  - image + text at 1/3 : 2/3 (181);
  - image + text with the Large Headline type (129);
  - two text columns (103);
  - 4 image + text columns (91).
- So the variety is in the numbers, not in the layouts: three standards (Media + text, Cards,
  Text columns) take the bulk.

## The standard Columns variants (draft)

| Standard | Class | Fits | Options |
|---|---|---|---|
| Media + text | `std-media-text` | 2 cells: image/video and text, either order | `narrow-image` (1/3), `wide-image` (2/3) |
| Cards | `std-cards` | 2–4 cells, each image + text | — |
| Text columns | `std-text` | 2–4 text cells | — |

- **Kept (design names):**
  - section styles (serif, background colours);
  - `Cell colours` and `Image borders` by palette name;
  - named text styles (Gold, Large …);
  - the `large-headline` and `center` options.
- **Dropped (measured values):**
  - `Text box`, `Grid`, `Column widths` (except the media + text options) and `Columns`;
  - size values (`[[1.75×]`, `[[5vw]`);
  - Box lines and blank lines in cells;
  - numeric Copy / Heading / Label sizes;
  - section padding / margin when the section holds only that block.
- **Already standard:** `page-intro` (the product intro) is never offered a standard.
- CSS: `blocks/columns/columns-corp.css` (top of the file). The block's own layout carries the
  standards; they only fix alignment and the media + text widths.

## Notes as "design" and "EDS team" (pilot roles)

- Media + text loses the per-page text offsets (`Text box` 3–20% insets). That is the visible
  change reviewers will notice most. The standard text column starts at the top, beside the
  image.
- Cards and Text columns are what the block already does without settings. The EDS team would
  likely accept them as they are.
- Large Headline and the colour palette are kept as names. The EDS team may still want fewer
  colours; out of scope for the pilot.
- **Legacy tier (proposal to put to the EDS team):**
  - allowed on migrated pages only;
  - kept as the readable settings, with the page flagged `legacy`;
  - counted in the report;
  - removed when the page is next edited, or by an agreed date.

## Run

```
node tools/importer/standardise/inventory.mjs --content <content> --root rs --out /tmp/…/instances.jsonl
python3 -I tools/importer/standardise/cluster.py /tmp/…/instances.jsonl /tmp/… --block columns --min 3
python3 -I tools/importer/standardise/pick-pilot.py /tmp/…/clusters-columns.json /tmp/…/instances.jsonl /tmp/…/pilot-pages.txt
python3 -I tools/importer/standardise/copy-pilot.py <content> /tmp/…/pilot-pages.txt
node tools/importer/standardise/test/rules-columns.test.mjs --content <content>
node tools/importer/standardise/gallery.mjs --content <content> --instances … --clusters … --out <content>/std/drafts/standards.plain.html
```
