# Standardisation (branch `standardise-v3`)

An experiment, kept off the main line: the migrated corp pages move from one-off measured
values (the readable settings: `Text box`, `Grid`, `Column widths`, size tags …) to a few
**standard variants** per block type. Per block type: group every instance by similarity, make
the largest N groups exactly N variants with their own CSS, and put every instance of the type
on one of them, its content kept and its presentation dropped. The look changes; the content and
EDS authoring practice stay. First block type: Columns (below). The first pilot (30 pages,
block-by-block review, layout-only standards) is kept below for reference.

- Code: this branch only (forked from `readable-settings-v3` at 48bac1b).
- Content: `/std/…`, copies of every product page (672) and their fragments (`/rs` is untouched).
- Previews: `https://standardise-v3--stryker-com--strykerenterprise.aem.page/std/…` once the
  `/std` documents are uploaded (on request only); locally a second dev server on this
  worktree (`aem up --html-folder content --port 3001`).
- The review flow uses no internal tool (no QA tool, no blast radius): reviewers compare the
  page with stryker.com by eye, as the customer would.

## Files

| File | What |
|---|---|
| `inventory.mjs` | Every block instance of the documents: settings, cell kinds, tags, ids and content hashes |
| `lib/features.js` | The block features and content hash of an instance (shared by the inventory and apply) |
| `cluster.py` | Columns instances → groups (structure + layout) → clusters (design options); report of what standardising drops |
| `pick-pilot.py` | The pilot pages: every cluster of the 10 largest groups, 30 pages |
| `copy-pilot.py` | Copies the pilot pages and their fragments `/rs` → `/std` |
| `rules/variants.js` | Every Columns block → one of the six standard variants, content kept, presentation dropped (DOM only) |
| `apply-variants.mjs` | Applies `rules/variants.js` to every `/std` document (backup, changed sections only, report) |
| `test/rules-variants.test.mjs` | The variant rules on every `/rs` document with Columns, against their invariants |
| `rules/columns.js` | First pilot: the transfer rules, an instance → a layout standard |
| `test/rules-columns.test.mjs` | The rules on one example per cluster, against the standard's invariants |
| `gallery.mjs` | The standards gallery draft (`/std/drafts/standards`) |
| `preselect.mjs` | Renders each pilot block as it is and in each standard it fits (1440 and 375 wide), compares boxes and styles; a standard with no difference is pre-selected |
| `candidates.py` | `data/candidates.json`, what the review overlay reads: pilot pages (live URL, blocks, groups), groups (plain label, size), pre-selection |
| `apply.mjs` | Applies the review decisions to the `/std` documents: the block's own decision > its group's choice > pre-selected; skips blocks changed since the review (content hash); rewrites only the changed sections; backs the originals up; writes the apply report |
| `check-standardised.mjs` | The style coverage check in a standardised mode: runs it on the documents before and after apply; a style lost on purpose by a standard (blank lines, boxes of a standardised block) is expected, anything else is flagged |
| `report.mjs` | The results as markdown: blocks on a standard, the legacy tail, effort per flow, checks, review notes |
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

## The standard Columns variants (current model, 2026-11-11)

Every Columns block of the site becomes one of **six variants**. The variant owns the whole look
(layout and type); the author owns only the content: heading levels, Bold, Italic, links. Nothing
presentational is authored any more. The first pilot's block-by-block review (keep as is, layout
standards with options, the overlay) is superseded by this model; its tools stay for reference.

| Variant | Class | Content | Blocks (site) | Model on stryker.com |
|---|---|---|---|---|
| Media + text | `media-text` | an image or video beside text, either order | 905 | barimatt-plus, comfortgel-se |
| Cards | `card-grid` | 2–4+ cells, each an image above its text | 489 | arise-1000-ex, bari-10a |
| Product intro | `page-intro` | the product page's opening image + text | 298 | (the template's own, unchanged) |
| Text columns | `text-columns` | 2–4 text cells | 272 | arise-1000-ex "at a glance" |
| Feature statement | `feature-statement` | a statement beside an image (was Large Headline) | 160 | dermacell, spy-elite |
| Image row | `image-row` | 2–5 images, no text | 52 | the media-pair grid |

2176 blocks on 672 pages and their fragments, measured at 1440px on the models:
- 30px gutter, equal cells, top aligned; phones one column, from 600px side by side (media +
  text, feature) or two per row (cards, text, images), from 900px a row in one line.
- Type from the 10-step scale: titles Title (media + text), Subtitle (cards), Headline (text
  columns' h2, the feature statement), copy Large (17.5px); the feature statement's copy Body
  serif, its Bold words Futura bold and other words the light serif.
- Gold is Bold + Italic (the authoring convention). Corp copy elsewhere keeps its colour for
  Bold + Italic (the source's black Futura bold labels); in the variants those labels are Bold.

`rules/variants.js` (apply: `apply-variants.mjs`, tests: `test/rules-variants.test.mjs`):
- the variant from the content's shape (page-intro stays; Large Headline with an image →
  feature-statement; images only → image-row; an image beside text → media-text; cells of image +
  text → card-grid; text only → text-columns; other mixes → the nearest);
- the block's classes: `columns <variant>` only;
- every readable tag inside the block goes (4472: sizes, fonts, colours, alignment); gold text
  becomes Bold + Italic (837, none lost); Bold + Italic labels become Bold (1339);
- a paragraph wholly in size tags of 21px and up becomes the variant's title (767: h3; in a
  feature statement its statement h2 from 28px), so the hierarchy stays;
- Box / Box end / Column break / blank lines (1031) and empty cells (125) go;
- the Columns' settings rows go (Column widths, Text box, Grid, Cell colours, Image borders); in a
  section holding only Columns (96% of them) its type and spacing rows and type styles (serif,
  bold-body, center …) too: 3977 rows, 676 styles. **Kept for a later pass:** section backgrounds,
  dividers, ids, structural styles (tabbed, accordion-panel, carousel).

`blocks/columns/columns.js` adds no formatting markers (columns-bold / -gold / -number) to the
variants, so the older formatting-driven Columns styles do not reach them.

Checks (all documents): words, links, images, sections the same; headings the same in order
(plus the promoted titles); no tag or box line left in a Columns block; gold kept. Renders of 30
pages at 1440 and 375: no errors, every block loaded, no tag left as text.

Open points for design / the EDS team:
- 59 Columns rows on 58 pages are in-page jump links (Contact us / About / …): a navigation
  pattern that probably wants its own block, not Text columns.
- The feature statement is 35px (its models); hero-like statements (LMH, Endotrac EPF) were up
  to 70px.
- Text colours from tags (white on gold bands) are gone; the band's own text colour applies
  until the section-style pass.
- The Block Library needs one entry per variant (sample + authoring rules).

## The standard Cards variants (2026-11-11)

615 `cards-corp` blocks; 98% were already in the block's two designs. Two variants (the user's
choice; the 11 three-up / two-up content cards become Teasers):

| Variant | Class | Content | Blocks |
|---|---|---|---|
| Resources | `cards-corp resources` | document thumbnail + linked h5 title; 6 per row from 900px, 4 from 600px | 403 |
| Teaser | `cards-corp teaser` | image + linked h3 title + short copy + link; 4 per row from 600px (no image: text card) | 212 |

The same pass as Columns (`rules/variants.js`, `apply-variants.mjs`): classes `cards-corp
<variant>` only; tags go (74); a title-sized paragraph becomes the card's h3 (29, the content
cards' gold titles); gold is Bold + Italic (14). Resources is always six-up
(`cards-corp.css`), and Bold + Italic copy in the two variants is gold: no existing card copy on
the site uses Bold + Italic, so neither change reaches other pages.

## The standard Hero variants (2026-11-11)

213 `hero-corp` blocks (all `image-slide`, with a dozen option combinations and a measured
`Text box` each). Three variants (the user's choice: contained banners become full-width; a
light-text variant for banners on dark images):

| Variant | Class | Blocks | Layout and type (1440px) |
|---|---|---|---|
| Product hero | `hero-corp image-slide product-hero` | 86 | image right half, text over the left half at 8% / 18% (51 of 86); Display title, Title subtitle, Lead copy |
| Banner | `hero-corp image-slide banner` | 100 | image across the page, text over its left half from 5% / 5%; Display headline, Title subtitle, Lead copy |
| Banner (light text) | `hero-corp image-slide banner-light` | 27 | a banner whose text was White / Light-Gray / Silver (or in a dark box): light text over a shade on the image's text side (`--corp-banner-scrim`) |

- Phones: the image (its phone crop when there is one), then the text under it, dark; the
  product hero goes side by side from 600px, banners overlay from 900px.
- Banner sizes are the middle of the 127 banners' headline sizes (a quarter each at 56px and up,
  35-55px, under 35px and the page default); the three first models (gamma4, pangea, pro-pelvis)
  were the 70px end and made long titles run past the image.
- Bold words of a headline are Futura bold, the others the light serif; gold is Bold + Italic.
- The rules (`rules/variants.js`): options and the `Text box` row go (518 tags, 527 rows in
  hero sections); a banner paragraph of 35px and up becomes its h2.
- Fixed on the way (all three block types): a Bold + Italic link is the conventions' gold
  button and stays as it is (the label rule had made 197 of them plain Bold); the test checks it.

### The first pilot: layout standards (superseded)

| Standard | Class | Fits | Options |
|---|---|---|---|
| Media + text | `std-media-text` | 2 cells: image/video and text, either order | `narrow-image` (1/3), `wide-image` (2/3), `text-middle` (the text centred beside the image) |
| Cards | `std-cards` | 2–4 cells, each image + text | 2 cells: `wide-first` / `wide-last` (the wide one 2/3) |
| Text columns | `std-text` | 2–4 text cells | 2 cells: `wide-first` / `wide-last` (the wide one 2/3) |

These are layout standards: the text sizes stay as authored. Typography is its own step (the
type scale, below).

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
  - `Text box`, `Grid`, `Column widths` (except the media + text and wide-column options) and `Columns`;
  - measured and white Box lines, and blank lines in cells;
  - section padding / margin when the section holds only that block.
- **Text in the middle:** a Media + text column set well down (top padding + margin from
  `Text box` or an opening Box line, counted as a share of the block: 5% or more) is the AEM
  way of centring the text beside a tall image; it takes `text-middle` (the text cell is
  centred, the image stays at the top when the text is the taller).
- **Wide first / last column:** 2 cards or text columns of unequal width (one over 55%, the
  source's 2/3 + 1/3 column control) keep the wide one as `wide-first` / `wide-last`.
- **Coloured bands:** a standard in a section with a background style (`bg-…` except `bg-white`,
  `dark`) gets the band's standard space above and below its content (`--corp-std-band-space`,
  34px: the median of the measured stryker.com band edges, 26–47px), instead of the measured
  margins and blank lines that gave it.
- **Already standard:** `page-intro` (the product intro) and a block on a standard already
  are never offered a standard (a standard block keeps its own options).
- CSS: `blocks/columns/columns-corp.css` (top of the file). The block's own layout carries the
  standards; they only fix alignment, the media + text and wide-column widths, the box padding
  and the band space.

## The type scale (draft)

Ten named steps replace every measured size (`[[1.75×]`, `[[5vw]`, `Copy size | 2×`,
`Heading size | 1.25×`). Each step is fluid between a 375px phone and a 1440px desktop
(`--corp-type-*` in `styles/styles-corp.css`):

| Step | Desktop | Phone |
|---|---|---|
| Small | 11.2 | 11.2 |
| Body | 14 | 14 |
| Large | 17.5 | 17.5 |
| Lead | 21 | 21 |
| Subtitle | 24.5 | 22.75 |
| Title | 28 | 24.5 |
| Headline | 35 | 26.25 |
| Display | 42 | 28 |
| Statement | 56 | 31.5 |
| Hero | 70 | 37.5 |

- A page on the scale has the metadata `type-scale | standard` (`body.type-standard`, set in
  `scripts/corp.js`). There the step names are text styles (`[[Gold,Title]…]`) and Copy size /
  Label size values; the template's heading sizes map onto the steps too. Other pages are
  unchanged.
- `rules/typography.js` works out each size's desktop size as `scripts/corp-type.js` renders it
  (vw = N × 14px; a multiple of the text around it, or of the 14px copy / 28px h1), then takes
  the nearest step by ratio. A size equal to the step the text has anyway goes. Colours, fonts and
  alignment stay.
- **Contrast kept:** two sizes of a section at least 1.25× apart keep at least one step between
  them. Without it, everything above the top step became Hero (a 115px figure and its 63px line
  the same size).
- `Heading size` rows go; the h2 / h3 they enlarged (not in cards) get their step as a tag.
  `Copy size` / `Label size` rows take a step name (Body: the row goes). `Text` / `Headings` rows:
  their sizes become step names.
- The sizes are worked out per context, as the blocks render them: an h1 has the browser's 2em
  (on the scale: Title, `styles-corp.css`); an h3 in Columns of a serif section is 1.5× (columns.css);
  Columns with Large Headline have their own h2 / h4 / copy sizes; a superscript is 0.75× the text
  around it. Checked against the rendered pages: 97% of the size tags within 1px (the rest match
  a different text of the same words).
- Effect on the 30 pilot pages: distinct text sizes site-wide 31 → 16 on desktop and 36 → 17 on
  phones; per page a median of 10 → 9.5 (desktop) and 11 → 9 (phones), at most 16 → 13. Desktop
  sizes move little. Phones change most: the vw sizes were twice their desktop share below 600px
  (an 11px caption under a 37px heading, headings smaller than their copy), and now follow the
  steps.
- What the scale gives up: three feature figures above the top step (98–119px: high-speed-drills
  "One", pivot-guardian "Zero reported", "Expanding") are Hero (70px). Small print (references,
  document IDs) stays at Small.
- Checks: words, links, headings, blocks, images and sections the same in all 66 documents; 60
  renders (1440 and 375) without errors, every block loaded, no tag left as text. Side findings
  (not caused by the scale, already on /rs): pivot-guardian is 526px wide on phones; a long
  operon-d860 heading and a prime-series reference URL do not wrap.

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
# after the review (the overlay's Export decisions):
node tools/importer/standardise/apply.mjs --content content --candidates tools/importer/standardise/data/candidates.json --decisions <export.json> --backup /tmp/…/before --report /tmp/…/apply-report.json [--dry-run]
node tools/importer/standardise/check-standardised.mjs --check tools/importer/migration-index/check-style-coverage.mjs --content content --backup /tmp/…/before --report /tmp/…/apply-report.json --candidates tools/importer/standardise/data/candidates.json --cache <page cache> --work /tmp/…/check
node tools/importer/standardise/report.mjs --candidates … --decisions <export.json> --apply /tmp/…/apply-report.json --log <review log.jsonl> --check /tmp/…/check.json --out /tmp/…/report.md
# the six Columns variants, on a fresh copy of every page (copy-pilot.py with the full page list):
node tools/importer/standardise/test/rules-variants.test.mjs --content content/ --root rs
node tools/importer/standardise/apply-variants.mjs --content content --backup /tmp/…/before-variants --report /tmp/…/variants-report.json [--dry-run]
# (first pilot) the type scale, on the layout-applied documents:
node tools/importer/standardise/test/rules-typography.test.mjs --content content [--measured <type-measure runs at 1440>]
node tools/importer/standardise/apply-typography.mjs --content content --backup /tmp/…/before-type --report /tmp/…/type-report.json [--dry-run]
```
