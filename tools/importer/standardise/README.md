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
| `preselect.mjs` | Renders each pilot block as it is and in each standard it fits (1440 and 375 wide), compares boxes and styles; a standard with no difference is pre-selected |
| `candidates.py` | `data/candidates.json`, what the review overlay reads: pilot pages (live URL, blocks, groups), groups (plain label, size), pre-selection |
| `data/` | `clusters-columns.json` / `.md`, `pilot-pages.txt`, `candidates.json` |
| `scripts/standardise-preview.js` / `.css` | The review overlay (loaded by `scripts.js` only on preview hosts with `?standardise`) |
| `tools/sidekick/standardise.html` | The Sidekick "Standardise this page" button (opens the page with the overlay) |

## Reviewing (the overlay)

- **Page review:** a pilot page with `?standardise=1` (Sidekick: *Standardise this page*).
  - Each Columns block gets a bar: *Keep as is*, the standards it fits (hover to compare, click to
    choose), *Use this choice for the whole group*, *Live page* (stryker.com at the block's text)
    and what the standard changes, in plain words.
  - A block alone in its section swaps with its section; beside other content (or from a fragment)
    only the block swaps. Blocks in closed tabs show their bar when the tab is open; blocks not
    on the page (pop-ups) are counted in the panel and decided on the group boards.
  - Badges: *decided for the whole group*, *looks the same as today* (pre-selected).
- **Group boards:** `/std/drafts/standards?standardise=board` (Sidekick: *Standardise: group
  boards*). Groups that fit a standard, largest first; per group every pilot block as it is next to
  its standards, one choice for the group, exceptions to decide on their pages.
- Choices stay in the browser and are exported with *Export decisions* (JSON: page choices, group
  choices with exceptions, time per page / board).
- Order of a block's choice: its page choice, else its group's (unless an exception), else the
  pre-selection.

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
| Media + text | `std-media-text` | 2 cells: image/video and text, either order | `narrow-image` (1/3), `wide-image` (2/3), `text-middle` (the text centred beside the image) |
| Cards | `std-cards` | 2–4 cells, each image + text | — |
| Text columns | `std-text` | 2–4 text cells | — |

These are layout standards: the text sizes stay as authored. Typography is its own later step
(a named type scale; `dropSizeTags` in `rules/columns.js` is ready for it).

- **Kept (design names):**
  - section styles (serif, background colours);
  - `Cell colours` and `Image borders` by palette name;
  - named text styles (Gold, Large …) and the text sizes (`[[1.75×]`, `[[5vw]`, Copy /
    Heading / Label size);
  - the `large-headline` and `center` options, and the design boxes `boxed-last` (a white
    shadow card) and `gold-first` (a gold card);
  - coloured Box lines, by their colour only (`Box: Gold, top 5%, left 5%` → `Box: Gold`), with
    the standard's padding and gap. A coloured column holding several boxes (`Cell colours
    1: Gold` + Box lines) becomes that many coloured boxes; a coloured cell gets the same
    standard padding;
  - empty trailing columns (2 cards in a 3-column grid keep the width of the 3-up rows beside
    them).
- **Dropped (measured values):**
  - `Text box`, `Grid`, `Column widths` (except the media + text options) and `Columns`;
  - measured and white Box lines, and blank lines in cells;
  - section padding / margin when the section holds only that block.
- **Text in the middle:** a Media + text column set well down (top padding + margin from
  `Text box` or an opening Box line, counted as a share of the block: 5% or more) is the AEM
  way of centring the text beside a tall image; it takes `text-middle` (the text cell is
  centred, the image stays at the top when the text is the taller).
- **Already standard:** `page-intro` (the product intro) is never offered a standard.
- CSS: `blocks/columns/columns-corp.css` (top of the file). The block's own layout carries the
  standards; they only fix alignment, the media + text widths and the box padding.

## Notes as "design" and "EDS team" (pilot roles)

- Media + text loses the per-page text offsets (`Text box` 3–20% insets). The text starts at
  the top beside the image, or in the middle when the source set it well down (flow 1 found
  top-aligned text beside a tall image looks unfinished).
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
python3 -I tools/importer/standardise/candidates.py /tmp/…/instances.jsonl tools/importer/standardise/data/clusters-columns.json tools/importer/standardise/data/pilot-pages.txt tools/importer/data/catalog/site.json tools/importer/standardise/data/candidates.json
# local preview of this worktree on port 3001, then:
node tools/importer/standardise/preselect.mjs --base http://localhost:3001/content --candidates tools/importer/standardise/data/candidates.json --out /tmp/…/preselect.json
python3 -I tools/importer/standardise/candidates.py … tools/importer/standardise/data/candidates.json --preselect /tmp/…/preselect.json
```
