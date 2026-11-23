# Columns: same layouts, fewer choices

*A walkthrough of the Columns block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the banner walkthrough ([README](README.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only column rows shown on the live site, on the 2,340 pages that don't
redirect, are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a row of columns could be set up freely: any column ratio, any box colour in any cell, any inner spacing in percent, any image border colour. |
| **The risk** | Copying every value means dozens of special cases for what is mostly the same handful of layouts. |
| **What we did** | We counted every column row on the live site, kept the five layouts it really uses, and turned the free settings into a few named choices in the **Block options panel**. |
| **The result** | Rows look the same or almost the same as today. Authors pick a layout and, when needed, a box colour, the cell that holds it, the spacing, an image border or centred text. |

---

## 2. The problem, in numbers

| What authors could set freely | Different values found | Choices now | Kept within a small difference |
|---|---|---|---|
| Column ratio | 5 cell-width patterns | **5 layouts** | 100% |
| Coloured or shadowed box in a cell | 25 colour and cell combinations (250 of 2,487 rows) | **9 colours + 3 cell choices** | 97% |
| Inner spacing of the text (padding, %) | 23 top, 32 bottom, 15 left, 11 right values | **4 steps**: none, small 3%, medium 5%, large 10% | 91% top, 96% bottom, 99% left, 100% right, within 2 points |
| Image border | 7 colours on 230 images | **3**: grey, teal, black | 96% keep their colour group |
| Text alignment in a cell | left 3,430, centre 447, right 9 cells | **2**: left (default), centred | 100% (right: 9 cells to review) |
| Vertical alignment of the cells | 1 (always top) | none needed | 100% |
| Phone layout | 1 (every row stacks in source order: 4,112 of 4,112 measured) | none needed: the block does the same | 100% |

---

## 3. What moved out of Columns (decisions taken with the business)

Not every row of cells on stryker.com is really "columns". Following the decisions taken with the
business, these rows now use the block that fits their content:

| Row on stryker.com | Now | Rows |
|---|---|---|
| Rows of text tiles (incl. rows of boxes and bordered two-cell rows) | **Cards** | 250 |
| Rows of call-to-action tiles | **Cards** | 68 |
| Rows of images only | **Cards** | 79 |
| A box next to other content | a **side-by-side section** with the content and a **Panel** | 169 |
| The page intro (with or without image) | the **Hero** (page intro) | — |

The rule in one line: *rows of the same unit are cards; two cells with different content are columns;
two cells with the same content are cards only when they have a box, shadow or border.*

That leaves **2,419 rows** in Columns. The option counts in this document are for the 2,487 rows measured
before that move, so they include the tile rows; boxes inside shared fragment rows are counted under Panel.

---

## 4. The layouts (one per row, required)

The layout is the first choice when adding the block. On phones every layout stacks the cells in their
authored order, as on stryker.com today.

### 4.1 Two equal columns (`columns-50-50`)

Two cells of the same width, typically an image or video next to text.

| | |
|---|---|
| Rows on the live site | **1,158** on 566 pages |
| What the cells hold | image + text 672, video + text 148, text + text 132, mixed 83, rows of images 31, rows of videos 18 (plus shared-fragment rows) |
| Example pages | [Donations](https://www.stryker.com/us/en/about/contact/donations.html), [Kevin Lobo on Fox Business](https://www.stryker.com/us/en/about/news/2020/watch-kevin-lobo-on-fox-business-network-s-mornings-with-maria.html) |

### 4.2 Narrow + wide (`columns-33-67`)

A narrow first cell (one third) and a wide second cell (two thirds), most often an image beside text.

| | |
|---|---|
| Rows on the live site | **567** on 206 pages |
| What the cells hold | image + text 457 (plus 45 in shared fragments), video + text 27, mixed 23, text + text 12 |
| Example pages | [CR hub](https://www.stryker.com/us/en/about/corporate-responsibility/cr-hub.html), [ProAssure](https://www.stryker.com/us/en/acute-care/services/proassure.html) |

### 4.3 Wide + narrow (`columns-67-33`)

A wide first cell (two thirds) and a narrow second cell (one third). It replaces the old `columns-70-30`
layout, which existing pages keep showing correctly.

| | |
|---|---|
| Rows on the live site | **338** on 213 pages |
| What the cells hold | image + text 136 (plus 78 in shared fragments), mixed 50, text + text 33, video + text 32 |
| Example pages | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [SVA](https://www.stryker.com/us/en/about/corporate-responsibility/i/sva.html) |

### 4.4 Three equal columns (`columns-3-cols`)

| | |
|---|---|
| Rows on the live site | **240** on 183 pages |
| What the cells hold | groups of links (in shared fragments) 129, mixed 38, text + text 32, rows of videos 11, image + text 18, rows of images 12 |
| Example pages | [Interventional Spine physician resources](https://www.stryker.com/us/en/interventional-spine/physician-resources.html) |

### 4.5 Four equal columns (`columns-4-cols`)

| | |
|---|---|
| Rows on the live site | **116** on 51 pages |
| What the cells hold | groups of links (in shared fragments) 60, mixed 25, rows of images 11, text + text 9, video + text 3, image + text 5 |
| Example pages | [About Stryker](https://www.stryker.com/us/en/about.html), [ASSH 2019](https://www.stryker.com/us/en/c/2019/ASSH.html) |

### 4.6 Division contact (two equal columns with a map)

The division contact details: a "Contact us" heading, groups such as *Address* or *Customer support*
with their phone and email links, and a Google map of the address beside them. It is the two-equal layout
with the existing map embed; no extra choice is needed.

| | |
|---|---|
| Rows on the live site | **23** on 23 pages |
| Example pages | [Acute Care contact](https://www.stryker.com/us/en/acute-care/contact.html), [Emergency Care contact](https://www.stryker.com/us/en/emergency-care/contact.html) |

---

## 5. The options (Block options panel)

### 5.1 Cell box: colour

A coloured or shadowed box behind the content of a cell. The colour names are the same as in the banner,
the panel and the cards, so authors see one colour list everywhere.

| Choice | Option | Rows | Example page |
|---|---|---|---|
| White with soft shadow (stryker.com "dimensional box") | `box-white shadow` | 102 | [Donations](https://www.stryker.com/us/en/about/contact/donations.html) |
| Light grey | `box-gray` | 90 | [Acute Care and Vocera](https://www.stryker.com/us/en/about/news/2022/acute-care-s-mathieson-explains-how-vocera-fits-into-stryker-s-g.html) |
| Gold | `box-gold` | 36 | [Prime Series](https://www.stryker.com/us/en/acute-care/products/prime-series.html) |
| Blue | `box-blue` | 7 | [Latera implant](https://www.stryker.com/us/en/ent/products/latera-absorbable-nasal-implant-system.html) |
| Purple | `box-purple` | 2 | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html) |
| Teal | `box-teal` | 2 | [Fluoro-free](https://www.stryker.com/us/en/joint-replacement/c/fluoro-free.html) |
| Slate | `box-slate` | 1 | [Mako RPS](https://www.stryker.com/us/en/joint-replacement/systems/mako-rps.html) |
| Dark grey | `box-dark` | 1 | [Surgical Technologies education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical-technologies/surgical-technologies-medical-education.html) |
| Plum | `box-plum` | 1 | [Trauma & Extremities TEACH](https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/teach.html) |

### 5.2 Cell box: which cell

| Choice | Option | Rows |
|---|---|---|
| Last cell (default) | `box-last` | 138 |
| First cell | `box-first` | 51 |
| Every cell | `box-all` | 58 |

Two choices (colour and cell) cover every combination stryker.com uses. The old combined names on
imported pages keep working and read as the new pair, for example `boxed-last` = *White with soft shadow*
in the *Last cell*, `gold-first` = *Gold* in the *First cell*.

### 5.3 Text spacing in a box

| Choice | Option | Source values it covers |
|---|---|---|
| None | `space-none` | 0% |
| Small (3%) | `space-s` | around 3% |
| Medium (5%, default) | `space-m` | around 5% |
| Large (10%) | `space-l` | 10% and more |

A source value goes to the nearest step; 91% of top, 96% of bottom, 99% of left and 100% of right spacing
values stay within 2 points.

### 5.4 Image border

| Choice | Option | Images on stryker.com |
|---|---|---|
| Grey | `image-border` | 115 |
| Teal | `image-border-teal` | 63 |
| Black | `image-border-black` | 41 |

### 5.5 Centred text

| Choice | Option | Cells on stryker.com |
|---|---|---|
| Centred | `text-center` | 447 |

Left is the default (3,430 cells).

---

## 6. How close is it to stryker.com?

| What | How close |
|---|---|
| Column ratios | **100%** keep their layout (rows with unusual widths, such as 58/42 or 25/75 in shared fragments, take the nearest layout) |
| Box colours | **97%** keep their colour and cell; rows with several colours are listed below |
| Text spacing in boxes | **91–100%** within 2 points, per side |
| Image borders | **96%** keep their colour |
| Text alignment | **100%** (except 9 right-aligned cells) |
| Phone layout | **100%** (every row stacks in order, as today) |

---

## 7. To review (outliers)

These rows don't fit a choice exactly. They take the nearest choice unless the business decides otherwise.

| What | Rows / cells | Example pages | Proposal |
|---|---|---|---|
| Several box colours in one row (blue, purple, teal: the coloured "cards" look) | 4 rows | [Insignia](https://www.stryker.com/us/en/joint-replacement/products/Insignia.html), [Novae dual mobility](https://www.stryker.com/us/en/joint-replacement/products/novae-dual-mobility.html) | Cards (text) |
| Several box colours in one row (blue, bronze, purple, teal) | 2 rows | [BACS balance ACS](https://www.stryker.com/us/en/spine/products/bacs-balance-acs/index.html), [Upper extremities learning](https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities.html) | Cards (text) |
| Several box colours in one row (gold, white with shadow) | 1 row | [Surgical Technologies news](https://www.stryker.com/us/en/surgical-technologies/news.html) | Cards (text) |
| Several box colours in one row (purple, white with shadow) | 1 row | [Spine medical education](https://www.stryker.com/us/en/training-and-education/orthopaedics/spine/spine-medical-education.html) | Cards (text) |
| Top spacing far from the scale (15%: 25, 20%: 22, 10px: 8, and a few others) | | [Celebrate survivors](https://www.stryker.com/us/en/emergency-care/celebrate-survivors.html), [ENT instruments](https://www.stryker.com/us/en/ent/products/instruments.html) | nearest step (*Large* for 15% and more) |
| Bottom spacing far from the scale (15%: 5, 17%: 3, 13%: 3, and a few others) | | [Fluoro-free](https://www.stryker.com/us/en/joint-replacement/c/fluoro-free.html), [Triathlon Revision](https://www.stryker.com/us/en/joint-replacement/products/Triathlon_Revision.html) | nearest step (*Large* for 15% and more) |
| Right-aligned text | 9 cells | [Suppliers](https://www.stryker.com/us/en/about/suppliers.html), [Caregiver stories](https://www.stryker.com/us/en/acute-care/c/caregiver-stories.html) | left |
| Image borders in other colours | blue 6, white 3, dark grey 2 images | | blue → teal, dark grey → black, white → no border (the agreed colour list) |

---

## 8. What we did not carry over, and why

| Not carried over as a Columns option | Where it goes instead |
|---|---|
| Fonts and text sizes inside the cells | the site-wide **text layer** (formatting and the Text style panel). Cell text on stryker.com starts with one of 6 looks: body Humanist 14px (70%), Egyptienne 21 / 24.5 / 28px (25%), Futura bold 17.5px (3%), Egyptienne 14px (2%). |
| Backgrounds behind a whole row (full-width panels) | a **section style** |
| Image on the left or the right | the **order** in which the author places the cells (image first in 76% of rows) |
| Vertical alignment and phone layout | nothing to choose: stryker.com always aligns cells at the top and stacks them in order |
| Blocks inside a column | a **side-by-side section** (no blocks inside blocks) |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Five layouts and a handful of choices instead of free values | A few rows move slightly (the outliers in section 7) |
| One colour list across banner, panel, cards and columns | Rows of tiles change block (to Cards), which authors need to know |
| Imported pages keep working: the old option names are read as the new ones | The old names stay readable for existing pages, so two spellings exist until those pages are re-saved |
| Phones behave exactly as today | |

---

## 10. Decisions we need from the business

None open for Columns. The rows listed in section 7 follow the proposal shown there unless the business
asks otherwise.

---

## Glossary

| Term | Meaning |
|---|---|
| Row | one Columns block: cells side by side |
| Cell | one column of a row |
| Layout | the column widths of a row (the first choice when adding the block) |
| Cell box | a coloured or shadowed background behind the content of one cell, or of every cell |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text layer | fonts, sizes and coloured words, set with formatting and the Text style panel, the same on every block |
| Section style | a choice for a whole section of the page, such as a full-width background |
| Cards | the block for rows of the same unit (tiles, boxes, image rows) |
| Side-by-side section | a section that places a block next to other content (`flex`) |
