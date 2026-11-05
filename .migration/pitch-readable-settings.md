# www.stryker.com on EDS: readable settings instead of hidden classes

*For the teams who will maintain www.stryker.com. 2026-11-05.*

## In one paragraph

The migrated stryker.com pages were rejected because they rely on many cryptic classes and hidden conventions. That concern is right, and it is fixable without redesigning the site. stryker.com is not random: it is the values authors set in AEM component dialogs (padding, widths, colours, font sizes). We moved those values out of class names into **readable settings rows** and **named text styles**, kept the ~85 real design names as normal EDS section styles and variants, and listed every remaining convention on one page with live examples. A converter turns the existing pages into this form automatically: **98.6% of all 2,023 imported pages and fragments convert completely, and the converted pages render identically.**

## What authors see: one real section, before and after

**Today** (LIFEPAK 15, intro headline):

| Section Metadata | |
|---|---|
| style | center, large-headline, padding-top-5, padding-bottom-5, padding-left-20, padding-right-20 |

Heading text: `[[color-gold][[size-3vw]High-performance defibrillation]]`

**Readable settings:**

| Section Metadata | |
|---|---|
| Style | large-headline, center |
| Padding | top 5%, bottom 5%, sides 20% |
| Headings | Gold, Display |

Heading text: `High-performance defibrillation` (no brackets).

Identical rendering (the same classes, section heights and every text run's style and position). Every value still means what it meant in the AEM dialog ("5%" is 5% of the column width), so authors who know the old site recognise it.

## The numbers

### What each route costs

| Route | What it takes |
|---|---|
| Templates, themes and block variants for every look | **~1,500 items**: 909 distinct section-style combinations and 598 distinct block + variant combinations are in use today. Combinations multiply; each one would be a variant or theme to maintain. |
| Standardise the design to a few templates and variants | **1,573 of 2,023 documents (78%)** carry at least one measured value; under a standard set each of them can change, and each change needs the customer's approval. |
| Today's migration (classes) | ~660 distinct number-carrying classes (`cell-2-padding-left-3`, `grid-of3-6-3`, `size-1-75em` …) plus 11,791 bracket tags with class names. This is what was rejected. |
| **Readable settings** | **~85 design names** (normal EDS section styles and variants) + **13 settings rows** + **20 named text styles** with sizes written as values (`1.75×`, `5.5vw`) + **27 documented conventions**. |

### The vocabulary, complete

| Layer | Size | Examples |
|---|---|---|
| Design names (what a thing *is*) | ~85 | `large-headline`, `bg-gold`, `divider`, `Hero Corp (image-slide, text-below)`, `Cards Corp (resources, six-up)` |
| Settings rows (measured values, readable) | 13 | `Padding`, `Margin`, `Text box`, `Column widths`, `Grid`, `Cell colours`, `Column`, `Copy size`, `Label size`, `Heading size`, `Autoplay`, `Headings`, `Text` (+ `(2)` for a section's second Columns block) |
| Text styles | 20 names + values | `Display`, `Title`, `Lead`, `Large`, `Serif`, `Futura`, the 11 palette colours; `[[1.75×]…]`, `[[5.5vw]…]` |
| Padded boxes inside text | 1 form | a line `Box: top 3%, all 6%` … `Box end` |
| Conventions (formatting or structure that triggers a style) | 27 | listed below |

### Is it complete? Measured, not assumed

- **Source side** (the AEM exports of all 2,553 pages and fragments): all 93 component types have a decision; of 236 styling properties, every mapped one has a readable form. The open ones (about 5% of uses) are behaviour, not vocabulary (carousel options, query-filled product grids), plus a few small undecided items (page hero title colour, video border colour).
- **Converted, all of it**: the converter ran on every imported corp document (1,407 pages, 616 fragments) in under a minute. **1,994 (98.6%) convert completely; number classes 13,691 → 27** (one Statistics option, `cols-3`, which can stay a name).
- **Growth**: going from the dozen pages the vocabulary was designed on to all 2,023 documents added five items and no new kind of rule.

### Does it render the same? Proven, not hoped

- Exact before/after comparison (every section's classes and height, every text run's font, size, weight, line height, colour and position) at 1440 and 375 px on **11 pages** chosen for difficulty, including one page per new setting: **identical** (differences only from load timing, e.g. a lazy form, which the same page shows against itself).
- The QA tool (live site against the current page, and against the converted page) on 5 of them: **identical scores and identical findings**.

## The conventions: short, named, shown

All 27 are on one page, **Authoring rules on www.stryker.com**, each with the rendered result next to the same content as it looks in Document Authoring (tables, Section Metadata, formatting as typed):

| Group | Rules | Notes |
|---|---|---|
| A. Formatting → style | 14 | bold / italic / bold + italic link alone → buttons, bold + underline → CTA with ►, underlined heading → rule: the patients site's existing conventions |
| B. Smart links | 7 | `#_blank` → new tab, fragment and Dynamic Media links, modal links, Maps embed |
| C. Footnotes | 2 | superscripts and symbols link to their references |
| D. Structure | 4 | `accordion-panel`, `tabbed`, `carousel`, `continued` sections |

- **15 are shared with patients.stryker.com** and already in its authoring conventions.
- **6 are genuinely hidden** today (five corp formatting tricks inside blocks, e.g. a bold paragraph under an image becomes its caption; one image address in a link title). They are the candidates to make explicit (a named text style or a documented variant rule).
- **2 are unused** and can be removed.

Building that page and checking it against live also found real bugs (a bold link inside a sentence renders as a button on both sites, a fragile italic rule, section backgrounds not applying inside fragments, a console error per padded box, column and gradient colours dropped by the import — the last two fixed).

## For developers

- **One registry**: every name, row and text style, and what it stands for, is in one file (`scripts/corp-settings.js`, today a translation layer onto the existing styling). It could be a DA sheet instead, so the documentation is the configuration.
- **No per-value CSS**: settings are values, not classes; there is no rule per padding or width.
- **Safe changes**: the CSS blast-radius tool lists every page a style change reaches; the QA tool and the exact comparison show whether anything changed visually.
- **The conventions page is the reference** for every rule, with a live example — no hidden behaviour that is not on it.

## For authors and consistency

- **New pages use the names and a small set of values**; the full measured-value settings exist only where migrated pages need them (legacy).
- A check flags legacy settings appearing on pages that did not have them, so the long tail does not grow.
- Pages move to the standard set when they are rewritten — standardisation over time, without asking the customer to redesign 1,573 documents up front.
- Later: a picker in the DA library, so authors choose names and settings instead of typing them.

## What we ask

1. **Agree the model**: design names as classes, measured values as readable settings rows, inline styles by name or value, conventions documented on one page.
2. **Agree the names** (all proposals today): the text style names (`Display`, `Title`, `Lead` …), the new rows (`Column`, `Grid`, `Cell colours`), `boxed`.
3. **Decide where the registry lives**: a DA sheet (authors can read it) or a file in the repo (reviewed in pull requests).
4. **A pilot**: convert one template's pages (e.g. product detail, 672 pages) in DA, with the QA comparison before and after, and let the maintaining team author with it.

Not yet done, and needed before a rollout: the importer writing readable settings directly (today a converter runs after it), Block Library entries for the rows and new names, an authoring guide built from the conventions page, and the six hidden rules made explicit.

## Where to look

The demo pages need the prototype code, which is on the branch `readable-settings-v3` (not merged): open them on that branch's preview.


| What | Where |
|---|---|
| Conventions with live examples | https://readable-settings-v3--stryker-com--strykerenterprise.aem.page/drafts/style-settings/authoring-rules |
| A converted page next to the original | https://readable-settings-v3--stryker-com--strykerenterprise.aem.page/drafts/style-settings/lifepak-15 (original: https://readable-settings-v3--stryker-com--strykerenterprise.aem.page/us/en/emergency-care/products/lifepak-15); also `spinejack-system`, `pivot-guardian-distraction-system`, `flowtriever-system`, `insignia` under `/drafts/style-settings/` |
| The documents, as authored | DA: `strykerenterprise/stryker-com` → `/drafts/style-settings/` |
| Coverage and dry run numbers | `.migration/vocabulary-coverage.md` |
| The full rules inventory | `.migration/authoring-rules-inventory.md` |
| The first sketch and its evidence | `.migration/authoring-sketch-lifepak-15.md` |
