# Readable-settings vocabulary: source coverage (2026-11-05)

Question: the readable-settings vocabulary (names, settings rows, text styles, conventions) came from about a dozen pages. Does it cover everything authored on www.stryker.com?

Source: the AEM exports, through the migration index (`tools/importer/data/catalog/properties.json`, `typography.json`, `components.json`: 2,553 page and fragment exports) and the decision tables (`tools/importer/decisions/property-map.json`, `component-map.json`). This checks what is **authored**; whether the import **carries** it is step 2 (conversion dry run) and the visual reviews.

## Components

93 component types: 75 approved, 12 established, 6 skipped (containers, ghosts). None without a decision.

## Styling properties (236)

| Handling | Properties | Page-uses | Readable form |
|---|---|---|---|
| mapped | 65 | 19,382 | see below: all but column colours have one |
| no effect (verified) | 29 | 7,074 | nothing to carry |
| later (dynamic components) | 18 | 1,080 | query-filled product grids (126 pages), event metadata (44) — not vocabulary |
| not mapped | 9 | 1,154 | carousel options (124 pages: nav dot colour, overlay opacity, transitions, speed, HCP banner position), video border colour (250) |
| partly | 2 | 1,194 | disclaimer by path (17 of 849), full-bleed panel colours without a live class |
| to verify | 3 | 793 | page hero title colour (494), hero thumbnail (175), local nav position (124) |
| not in the decision table | 108 | 574 | long tail, 19 pages at most each (e.g. tagline gradient 13) |

### Mapped properties by readable form

| Group | Pages (max) | Readable form |
|---|---|---|
| Box spacing: text / Large Headline padding and margin, all sides | 515 | `Padding` / `Margin` / `Text box` rows |
| Hero text box: slide insets, mobile overlay, image layout | 394 | `Text box` row + names (`text-below`, `top`, `bottom`) |
| Colours and look: box colours, gradients and direction, image borders, video options, button colours | 1,063 | names (`bg-*`, `boxed`, `gradient-*`, `image-border-*`, `no-border`, `autoplay`) and the formatting conventions |
| **Column colours** (`cell-<N>-bg-<colour>`, added 2026-11-05) | ~178 | **none yet**: still class names; needs a settings form (e.g. `Cell colours | 1: Purple, 2: Blue, 3: Teal`) |
| Statistics counters: size, colour, alignment | 26 | block options + a size value |
| Behaviour: new tab, hidden components, jump bar, local nav | 757 | conventions (`#_blank`) and block content |

## Typography (1,122 formatting combinations)

- Font classes: sizes (`fontsize-<n>em`, vw sizes), Futura bold, Egyptienne: all expressible (size values, `Serif`, bold). Editor leftovers (`gr_*`, `tw-*`, `mso*`) are dropped by the import.
- Colours: the named palette (gold, black, white, blue, teal, purple, silver, dark gold, dark gray, light gray, gray) plus ~15 one-offs and near-duplicates used 1–6 times each (`#323232`, `rgb(149,79,114)`, …): name the near-duplicates as their palette colour or keep them as legacy.

## Result

At the source level the vocabulary is close to complete for styling:
- **One real gap in the readable form**: column colours (a settings row to define).
- **Small undecided styling items**: page hero title colour (494 pages, to verify), video border colour (250), panel colours without a class, carousel overlay opacity (7 of 124 non-zero), tagline gradient (13).
- **The rest of the open items are behaviour or dynamic components** (carousel options, product grids, events), not vocabulary.

Not covered by this check: layout data that is not a component property (column control widths, `cq:responsive` offsets → `Column widths` and the `grid-*` / `col-*` options) — measured in step 2.

## Step 2: conversion dry run on every imported corp document (2026-11-05)

`.cbr/local-scripts/settings-convert.mjs --batch` over 2,023 documents (1,407 page drafts in `content/drafts/reimport`, 616 fragments), output on the local disk; counts by `.cbr/local-scripts/convert-leftovers.py`. Took under a minute, no failures.

- Number classes 13,691 → 3,380 (75% converted); 1,015 documents (50%) fully converted; 820 Box lines.
- What stays, almost all column layout:

| Leftover | Uses / documents | Needs |
|---|---|---|
| `col-<n>-<n>`, `col-at-<n>-<n>` (lone AEM column width / start) | 2,558 / ~860 | a settings row, e.g. `Column \| 5 of 6, from 1 of 6` |
| `grid-*` Columns options (widths per breakpoint, offsets) | ~500 / ~200 | `Column widths` with phone / tablet values and offsets |
| `cell-<N>-bg-*` | ~50 / ~30 | `Cell colours` row |
| `cell-<N>-padding*`, `columns-<n>-<n>` in sections with two Columns blocks | ~160 / ~25 | converter limit (one Columns block per section) |
| Statistics `cols-<n>` | 27 / 16 | a name is fine, or a row |
| `[[futura-bold]…]` | 542 / 110 | a text style name (e.g. `Futura`) |
| `[[visually-hidden]…]` | 16 / 15 | already a name |

Growth from ~12 pages to all 2,023 documents: about five additions (two layout rows, the cell colour row, one text style, one converter fix). No new kind of rule.

Not yet verified at scale: identical rendering after conversion (exact check done on 5 pages).

## The five additions (2026-11-05) and the rerun

Added to the prototype (`scripts/corp-settings.js`, converter `.cbr/local-scripts/settings-convert.mjs`), names proposed:

| Row / style | Example | Stands for |
|---|---|---|
| `Column` | `width 2/3, from 1/6, phones too` | `col-2-3 col-at-1-6 col-phone` |
| `Grid` | `desktop: 7, 5 · tablet: 6, 6 · phone: 12, 12` (`skip N`, `new line N`, `hidden`, `… of 6`) | `grid-7-5 grid-t-6-6 grid-m-12-12` |
| `Cell colours` | `2: Light-Gray`, `1: Purple, 2: Blue, 3: Teal` | `cell-2-bg-light-gray` … |
| Rows per Columns block | `Text box (2)`, `Column widths (2)`, `Grid (2)`, `Cell colours (2)` | the same for the section's 2nd block (`(1)` next to a hero, or when the blocks' widths differ) |
| Text style `Futura` | `[[Futura]CONTACT US]` | `[[futura-bold]…]` |

Rerun on all 2,023 documents: **1,994 fully converted (98.6%)**; number classes 13,691 → **27** (Statistics `cols-<n>`, 16 documents); legacy brackets: 16 `[[visually-hidden]]` (a name).

Exact rendering check, one page per addition (converted copies in `content/drafts/style-settings/check/`), 1440 and 375: omega (`Column`), a 2017 news page (`Column`), lifepak-cr2 (`Grid`), sonopet-iq (`Cell colours`), procuity (seven Columns blocks in one section), darco (`Futura`): **all identical** (classes, section heights, every text run). Found and fixed on the way: `Text box (2)` reaches the code as `textBox-2` (a number after a hyphen stays), so the per-block rows were not applied.
