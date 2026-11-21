# Authoring sketch on one real page: LIFEPAK 15

Page: `/us/en/emergency-care/products/lifepak-15` (source: https://www.stryker.com/us/en/emergency-care/products/lifepak-15.html), product detail template.
Picked because it uses every kind of style the corp import writes: section styles, Columns cell spacing, hero text-box positions, copy sizes and bracket markers in the text.

Status: prototype built and checked 2026-11-04 (see *Prototype result* at the end). Names marked *(proposed)* need approval.

## Today, as the author sees it

- 26 sections, **103 style classes**. 67 of them are numbers (`padding-left-20`, `cell-2-margin-left-3`, `top-3 left-15 right-45`, `p-1-25`).
- **58 bracket markers** in the text (`[[size-1-25em]…]`, `[[color-gold][[size-3vw]…]]`). 39 of them are on the FAQ answers alone.
- The markers end up in the stored heading ids, e.g. `id="color-goldsize-3vwhigh-performance-defibrillation"` (the site code re-derives the rendered anchor from the visible text, so visitors don't see this).
- The meaning of every number lives in code (`scripts/corp-spacing.js`, `scripts/corp-type.js`, `styles/styles-corp.css`). Nothing on the page says what `padding-left-20` is (20% of the column width, as in the AEM dialog).

## The proposal: three layers, each with one job

| Layer | What it holds | Who gets it | Example |
|---|---|---|---|
| **Names** | What a thing *is*: section styles and block variants | Everyone, offered in the library | `large-headline`, `bg-gold`, `divider`, `Hero (image-slide, text-below)` |
| **Settings** | The measured values from AEM, as readable rows in Section Metadata, kept exactly | Migrated pages only ("legacy"), not offered for new pages | `Padding: top 5%, bottom 5%, sides 20%` |
| **Text styles** | A short named list instead of sizes in brackets | Everyone | `Display`, `Title`, `Lead`, `Large`, `Small`, `Gold`, `White` |

The names stay classes, the normal EDS way. Only the numbers leave the class names.

## Section by section

`→` = the same look, authored differently. "Before" is exactly what is in the page today.

### Hero (sections 2, 7, 15)

Before: `hero-corp image-slide top-3 left-15 right-45 text-below padding-bottom-2 margin-top-2`

After:
| Hero (image-slide, text-below) |
|---|
| *(fragment link, unchanged)* |

Section Metadata:
| Text box | top 3%, left 15%, right 45% |
|---|---|
| Spacing | padding bottom 2%, margin top 2% |

### Intro headline (section 3)

Before:
- Style: `center, large-headline, padding-top-5, padding-bottom-5, padding-left-20, padding-right-20`
- Heading: `**[[color-gold][[size-3vw]High-performance defibrillation]]**`
- Copy: `[[size-1-5vw,serif]With more than six decades…]`

After, with no brackets left in the text:
| Style | large-headline, center |
|---|---|
| Padding | top 5%, bottom 5%, sides 20% |
| Headings | Display, Gold |
| Copy | Lead, serif |

Each bracket wraps a whole heading or paragraph, so the setting moves to the section.

### Copy sections (4, 5, 21)

Before: `p-1-25, serif`, `p-0-8`.
After: `Copy: Large, serif`, `Copy: Small`.

### Video band (section 6)

Before:
- Section style: `bg-dark-gray`
- Block: `columns columns-33-67 cell-1-padding-top-10 cell-1-padding-bottom-5 large-headline`
- Cell: `[[color-white][[size-2vw,serif]In today's world…]] [[color-gold][[size-2vw,serif]Respond with…]]`

After:
| Style | bg-dark-gray |
|---|---|
| Column widths | 33% / 67% |
| Text box (column 1) | top 10%, bottom 5% |
| Copy | Title, serif |

The block becomes `Columns (large-headline)`. The two colours inside one cell are real inline runs, so they keep a bracket, but with a name instead of a number: `[[White]In today's world…] [[Gold]Respond with…]`.

### Product highlights rows (sections 9–14)

Before: six sections, each like `p-1-5, serif, label-1-75` plus `columns columns-50-50 cell-2-padding-top-3 cell-2-padding-bottom-3 cell-2-padding-right-3 cell-2-margin-left-3` (the text cell alternates left and right).

After, one repeated pattern:
| Style | serif |
|---|---|
| Copy | Lead |
| Labels | Large |
| Column widths | 50% / 50% |
| Text box | boxed *(proposed)* |

`boxed` would be a named setting for "3% on every side of the text column". The two spellings on this page draw the same box, because a left margin is applied as padding. Site-wide, the same box appears 64 times on about 29 pages, so it has earned a name.

### FAQ (sections 16–17)

Before: `[[color-gold]FAQs]`, and `[[size-1-25em]…]` around each of the 39 answer paragraphs.

After: `Copy: Large` on the accordion's section. The heading is `[[Gold]FAQs]`. 39 brackets become one setting.

### Connect band (section 18)

Before:
- Style: `bg-gold, large-headline, padding-top-3, padding-bottom-3, h-serif`
- Heading: `**[[size-3vw]Connect]** [[size-3vw]with an expert]`

After:
| Style | bg-gold, large-headline, h-serif |
|---|---|
| Padding | top 3%, bottom 3% |
| Headings | Display |

### Unchanged

The sections that already carry only names stay as they are: `divider`, `tabbed`, the `Cards (resources, six-up)` and teasers, the fragments, `disclaimer`, `flex` and the Marketo form. `flex-67-33` becomes `Column widths: 67% / 33%`.

## This page in numbers

| | Today | Sketch |
|---|---|---|
| Classes that are names | 36 | about 36 |
| Classes that are numbers | 67 | 0 |
| Settings rows (readable, legacy) | 0 | about 39 |
| Brackets in the text | 58, with sizes in vw/em | about 5, names only |

The number of decisions on a migrated page barely shrinks, because those decisions *are* the customer's design. What changes is that each one says what it does, lives in one documented list, and doesn't spread to new pages.

## What each audience gets

**Authors**
- The library and a style picker offer only names, text styles and a 3-step spacing scale for new pages (`compact`, `normal`, `roomy` *(proposed)*).
- Legacy settings exist only where the migration put them. A check flags a legacy setting added to a page that didn't have one.
- No numbers to type, no brackets to nest.

**Developers**
- One registry of every name, setting and text style: what it does, which code applies it, how many pages use it. It could be a DA sheet the code reads, so the documentation is the configuration and can't drift.
- The spacing code stays, reading `Padding` / `Text box` rows (data attributes on the section) instead of parsing class names. The copy-size CSS keys on six text-style names instead of `p-1-25` and friends.
- A lint step validates every page against the registry. The blast-radius tool lists the pages a change reaches, and the QA tool proves "no visual change".

**The customer**
- Every migrated page looks exactly as it does today.

## Open questions

1. Are percentage values acceptable in settings rows (`Padding: top 5%`), or should migrated values snap to a scale that the QA tool proves is invisible?
2. Inline runs (about half of the bracket paragraphs site-wide): named brackets, or does DA / Experience Workspace offer something better?
3. How does gold map to the authoring conventions? The FAQ label is already bold + italic and also carries `[[color-gold]]`.
4. Where should the registry live: a DA sheet (authors can read it) or a JSON file in the repo (reviewed in PRs)?

## Prototype result (2026-11-04)

- Draft: `content/drafts/style-settings/lifepak-15.plain.html`, converted automatically from the migrated page by `.cbr/local-scripts/settings-convert.mjs`. All 67 numeric classes became settings rows; the 58 sized brackets became 24 named ones (`[[Gold,Lead]…]`, 14 of them `[[Sans]…]` on the FAQ's bold labels), none left with legacy classes.
- Code: `scripts/corp-settings.js` (the registry of names + the translation to the classes the corp styling already reads), called from `scripts/corp.js` only on pages with `style-settings: on` metadata. No other page changes.
- Exact check (`.cbr/local-scripts/settings-compare.mjs`, each page loaded 3 times per width because single loads vary by up to 400px from late images, forms and tabs): at 1440 and 375 every section has the same classes and height (one 2px hero difference at 375, the same as the page against itself), and all 125 text runs have the same font, size, weight, line height, colour and position. The only class difference is the intended one: two highlight rows use `boxed` instead of `margin-left-3` (drawn the same).
- QA tool (live → current page, live → draft, 1440 + 375): identical scores (health 93 / 94, content 99) and identical findings (the same 172 of 173 texts, the same font and drift items).
- Found on the way: a text style applied to whole headings must leave edge spaces unstyled, as brackets do (fixed).

## Four harder pages (2026-11-04)

spinejack-system (most number classes, most `[[spacing]]` markers), pivot-guardian-distraction-system (most bracket styles), flowtriever-system (124 brackets), insignia; drafts in `content/drafts/style-settings/`.

- Settings rows now also take sizes as multiples (`Copy size | 1.75×`, `Heading size | 1.25×`, `Label size | 1.5×`), `Autoplay | 5 s`, and Column widths shared by several Columns blocks in a section.
- Number classes: 252 → 2 (one section with two Columns blocks of different widths, one `col-1-2` grid column). LIFEPAK 15: 67 → 0.
- Exact check: all five pages identical at 1440 and 375 (classes, section heights, every visible text run). One LIFEPAK 15 load had the Marketo form fill in late; the runs after it moved (load race, 0 in the previous run).
- QA tool, live → current vs live → draft: identical scores and findings on all five.

**What doesn't fit yet (decisions needed):**
1. **Text sizes.** The site uses about 30 sizes in brackets (1.25em on 1,432 runs down to 1.66667em, 3.125em, 5.5vw, 8vw). Ten names cover the common ones; the long tail can't get words without inventing dozens. Options: allow sizes as values in brackets (needs a bracket syntax for `1.75×`), snap the tail to the named scale with the QA tool proving it invisible, or keep the tail as legacy brackets.
2. **`[[spacing,…]]` box markers.** 751 on 165 pages, the biggest bracket leftover (67 on these four). They mark where a padded box starts inside text or a block cell, so they can't move to Section Metadata. Most are `padding-top-3` or 3% on several sides. Options: a readable marker line (e.g. `Box: top 3%, sides 3%` on its own line), named boxes for the common cases plus legacy for the rest, or a structural change (a section or a cell per box) where the markup allows.
3. **Colours with no name yet:** purple, light gray, blue, teal, grey, silver.

## Sizes as values and Box lines (2026-11-04, user's choice)

- Brackets take sizes as values: `[[1.75×]…]` (× the surrounding size, the old `size-1-75em`), `[[5.5vw]…]`, mixed with names (`[[Gold,3.125×]…]`). Colours by their own name (Purple, Light-Gray, Blue, Teal, Grey, Silver, Dark-Gold, Black, Navy). The shared bracket code (`scripts/span-tags.js`) is unchanged: on opted-in corp pages `rewriteSizeValues` turns the values into classes before it runs.
- `[[spacing,…]]` markers became lines of their own: `Box: top 3%`, `Box: all 3%`, `Box: top 5%, left 5%, margin bottom 3%`, and `Box end` where a box closes. They become the same marker paragraphs before the spacing code reads them. A line only counts as a box if every entry reads as spacing.
- Five pages: number classes 319 → 2, legacy brackets 0 (one `[[visually-hidden]]`, a name), 74 Box lines.
- Exact check: identical at 1440 and 375 on all five (LIFEPAK 15: a 2px hero difference at 375, the same as the page against itself). QA tool: identical scores and findings on all five.
