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
| **The result** | Rows look the same or almost the same as today. Authors pick a layout and, when needed, a box colour, the cell that holds it, the spacing, an image border, centred text or a *Text look* for the whole row. Coloured, sized or serif words inside the text use the site-wide **Text style** with the same small set of sizes and brand colours. On the review page, 48 of 50 rows match stryker.com exactly in text colour, size and font; the other 2 move by one headline step by design. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a column row, how many different values stryker.com uses today, and the named
choices on the new site. *Kept* is the share of instances whose look stays the same or almost the same:
spacing within 2 points of a step (4% becomes 5%), a font size within about 10% of a size step, a colour
that is one of the named colours.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **23** | 483 | 4 | **89%** | 5 (104), 3 (101), 2 (62), 0 (43) |
| Inner spacing, bottom | **15** | 330 | 4 | **98%** | 3 (99), 5 (82), 2 (59), 0 (43) |
| Inner spacing, left | **11** | 256 | 4 | **98%** | 0 (76), 3 (55), 5 (54), 2 (40) |
| Inner spacing, right | **10** | 249 | 4 | **100%** | 3 (83), 5 (68), 2 (43), 0 (31) |
| Outer spacing, top (margin %) | **27** | 303 | 0 (standard) | **82%** | 3 (44), 5 (38), 1 (35), 2 (26) |
| Outer spacing, bottom | **17** | 176 | 0 (standard) | **97%** | 2 (47), 3 (47), 5 (25), 4 (18) |
| Outer spacing, left | **7** | 138 | 0 (standard) | **61%** | 20 (49), 0 (43), 3 (30), 5 (6) |
| Outer spacing, right | **8** | 43 | 0 (standard) | **98%** | 4 (14), 5 (9), 2 (6), 3 (5) |
| Font size | **39** | 8,473 | 6 + 4 | **97%** | 1.25× (4,580), 1.5× (1,432), 1.75× (489), 2× (430) |
| Font | **6** | 4,905 | 3 | **99%** | Futura bold (3,040), Egyptienne (1,827) |
| Text colour | **22** | 2,087 | 11 | **98%** | gold (703 + 401 written differently), black (195), white (147) |
| Box / background colour | **6** | 74 | 10 | **100%** | light grey (52 + 8), gold (8 + 3) |
| Image border colour | **9** | 161 | 3 | **96%** | grey (93 + 10), black (38), teal (6) |
| Video border colour | **1** | 1 | 1 | **100%** | black (1) |
| Text alignment | **4** | 3,379 | 2 | **99%** | left (3,264 + 54), centred (38), right (23) |

Two settings have nothing to choose, because stryker.com always uses the same value:

| Setting | Values today | Choices | Kept |
|---|---|---|---|
| Column ratio | 5 cell-width patterns | 5 layouts | **100%** (2,419 rows) |
| Vertical alignment of the cells | 1 (always top) | none needed | **100%** |
| Phone layout | 1 (every row stacks in source order: 4,112 of 4,112 measured) | none needed | **100%** |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Layout, cell box (colour and cell), inner spacing, image border, centred text, the row's *Text look* | **Block options panel** (section 5) |
| Font size, font, text colour of a few words; a box around one line | the site-wide **text layer**: formatting and the **Text style panel**, the same choices in every block (section 5.7) |
| Outer spacing (margins) | **no setting**: the block keeps its standard gap |

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

**Six layouts, no more.** stryker.com builds every Columns row on its 12-column grid in one of five
widths, and its news articles add one more: **three quarters + quarter** (9 + 3 of the grid, 8 rows on
5 articles), kept as the sixth layout (*Wide + narrow (3/4 + 1/4)*, `columns-75-25`). 10 rows from older
imports of news fragments carry widths stryker.com doesn't use (quarter + three quarters 8, 70 / 30 1,
quarter + quarter + half 1; icon + text 0): they are not choices. The panel reads them as the nearest
layout (narrow + wide, wide + narrow, three equal), they render as today until the row is saved again,
and they are listed in section 7.

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

### 4.6 Wide + narrow, three quarters + quarter (`columns-75-25`)

A wide first cell (three quarters) and a narrow second cell (one quarter): the 9 + 3 rows of
stryker.com news articles, for example a photo or a quote beside the article text.

| | |
|---|---|
| Rows on the imported pages | **8** on 5 news articles |
| Example pages | [A winning spirit](https://www.stryker.com/us/en/about/news/features/a-winning-spirit.html), [From behind the scenes to the front line](https://www.stryker.com/us/en/about/news/features/from-behind-the-scenes-to-the-front-line.html) |

### 4.7 Division contact (two equal columns with a map)

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
| Dark blue gradient (stryker.com `bg-dark-blue-gradient`, the package's "slate") | `box-dark-blue-gradient` | 1 | [Mako RPS](https://www.stryker.com/us/en/joint-replacement/systems/mako-rps.html) |
| Dark grey | `box-dark` | 1 | [Surgical Technologies education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical-technologies/surgical-technologies-medical-education.html) |
| Dark purple gradient (stryker.com `bg-dark-purple-gradient`, the package's "plum") | `box-dark-purple-gradient` | 1 | [Trauma & Extremities TEACH](https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/teach.html) |

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

A source value goes to the nearest step; 89% of top, 98% of bottom, 98% of left and 100% of right spacing
values stay within 2 points (section 2).

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

### 5.6 Other looks, kept as columns choices

Besides the package's choices, imported stryker.com pages use more columns looks. They are kept as
choices in the Block options panel, without new variants. *The counts below are rows on the imported
pages (not package numbers).*

| Group | Choices | Rows on imported pages |
|---|---|---|
| First line of the text | in a light grey box, a gold bar, a dark grey bar, a **blue bar** (stryker.com coloured heads), **in a white box with a soft shadow** (Mako "More integrated technologies" titles; review pages) | 79, 2, 1, 1, 1 |
| Text look (switches) | large headline type, serif lead paragraph, serif captions, pull quote in the last cell, large pull quote beside a photo, numbered quotes | 479, 1, 3, 1, 1, 4 |
| Row looks (switches) | linked images, one per row on phones, related links, link groups, icon beside text, page title beside a photo, caption right under the photo, images centred at their size, photo two thirds wide on phones, rule under the first cell, **line below the row**, **first cell right-aligned (labels)** | 315, 72, 11, 1, 4, 1, 1, 1, 3, 3, **750**, **7** |

A first-line bar replaces a cell box (both colour the cell), so picking one clears the other.

**Moved to Cards:** the six tile looks (challenge cards 7 rows, icon cards 1, colour profile cards 1,
product tiles 3, CTA tiles 2, icon grid 0) are rows of tiles, which the package puts in Cards. They are
no longer Columns choices; pages that carry those names render as before until the Cards session.

**Text look (in Block options, to approve by the business).** Large headline type (479 rows), serif
lead paragraph, serif captions and the pull quotes style a whole row's text on stryker.com (one
component style). They are one choice each in a *Text look* group of Block options, using the same
sizes and fonts as the Text style panel, while words inside a line stay with the Text style panel.
Like every Block option a Text look is a name on the block (`Columns (columns-50-50, large-headline)`),
**not** a colon marker in the text, so the author never edits markers for it; they are switches,
as rows combine them (large headline + numbered quotes). This departs from the package rule "fonts
and sizes of text are never block options" for row-wide looks only.

**The rule for authors:** if it changes the **whole row**, it is in Block options; if it changes
**a few words**, it is in Text style.

**Imported names that are existing choices** (no new variant; the panel shows them as these choices):

| Imported name | Rows | Is |
|---|---|---|
| `page-intro` | 801 | not a Columns row: the product page intro (title, subhead, copy, image, line below) is the **Hero page intro** layout of the package (hero walkthrough, 493 rows); until that session the rows keep `page-intro` and render as today |
| `color-heads` | 1 | First line of the text: **in a blue bar** |
| `media-text` | 5 | the cell content (video or image with text); nothing to choose |
| `image-left`, `thumbnails` | 1 each | the authoring order and *Wide + narrow (3/4 + 1/4)* with *Linked images*; nothing to choose |
| `striped` | 1 | a stryker.com table (rows striped #f5f5f5): the **Table** block, not columns |

**Not carried over:** `text-columns`, `card-grid`, `feature-statement`, `wide-first`, `wide-last` and
`image-row`, and 19 of the 24 `media-text` rows, appear only in the `std/` trial copy of 17 pages
whose normal imports use the standard names.

### 5.7 Text inside the cells (Text style, not Block options)

Colour, size and font of **a few words** are set with the site-wide **Text style panel**, the same in
every block. The panel wraps the words in a pair of markers written in the text, for example
`:start-white-xxxl:Get in touch:end:`. On the page the markers disappear and the words take the
look. A **line box** puts a coloured box around one whole line (TEACH "Trauma & Extremities", the
quotes of "A winning spirit"), in the same colour names as the cell boxes, 10px inside as on
stryker.com.

Only the package's limited sets are offered; every stryker.com value joins the nearest one:

| Setting | Choices | How the values were grouped |
|---|---|---|
| Text size | normal, 0.8×, 1.25×, 1.5×, 1.75×, 2×, 2.5× | within about 10% of a step. 2.5× is kept (753 uses, mostly big figures in boxes); 3.5× was dropped and joins 2.5× |
| Headline size (grows with the screen) | **S 1.5**, **M 2**, **L 3**, **XL 4.5** (% of the width) | 17 values today, each joins the nearest by proportion: 1–1.5 → S (862 uses), 2 → M (787), 2.5–3.5 → L (1,245), 4–9 → XL (690). 73% are within 12.5% of their step, 96% within a quarter step |
| Font | body, serif (Egyptienne), sans (Futura bold) | the 6 font looks of stryker.com |
| Text colour | the 7 brand colours stryker.com text uses (blue, gold, purple, teal, grey, white, light grey) and 4 more Stryker colours: black, mid grey #b2b4ae, dark gold #af6d04, pale grey #dfe1de | exact values only, never blended; the same colour written two ways counts once. A charcoal (#323232, 93 uses) is a code typed by authors, not a component colour, so it is not a choice (section 7) |
| Line box | the 6 colours stryker.com puts around a single line: gold, blue, purple, teal, dark grey, dark purple gradient | exact values |
| Gold rule | a gold rule under a heading (stryker.com feature titles) | the heading's own rule, in gold |

The panel shows only the looks that fit the selection: the gold rule for a heading, a line box when
the whole line is selected.

Two fixes make the text read as on stryker.com:

- **Bold links inside a sentence** (for example the AED link) show as bold teal text links in the
  sentence's own font, as on stryker.com, instead of a teal button. A bold link alone on its line
  stays a button, per the authoring conventions.
- **A plain Futura bold Heading 2** (no size of its own) keeps the heading size (24.5px) instead of
  the larger bold heading size (35px): the importer leaves it without bold, on the review page only,
  until the 55 such headings on 33 pages are measured (section 10).

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Column ratio | 5 cell-width patterns | 5 layouts | **100%** keep their layout (rows with unusual widths, such as 58/42 or 25/75 in shared fragments, take the nearest layout) |
| Box colour | 6 values | 10 named colours | **100%** keep their colour; rows with several colours in one row are listed below |
| Inner spacing | 10–23 values per side | 4 steps | **89%** top, **98%** bottom, **98%** left, **100%** right |
| Outer spacing | 7–27 values per side | the block's standard gap | **82%** top, **97%** bottom, **61%** left, **98%** right |
| Font size, font, text colour | 39 / 6 / 22 values | the text layer | **97%** / **99%** / **98%** |
| Image border | 9 colours | 3 | **96%** |
| Text alignment | 4 values | left, centred | **99%** |
| Phone layout | always stacked | as today | **100%** |

**What moves more:** the outer spacing on the left, where 61% are kept: most of the others are a 20% left
margin (49 instances), which the standard gap replaces.

**Checked on the review page.** The Columns review page holds a real stryker.com row for every layout
and choice (53 sections). A comparison measured every piece of text in those rows on both sites
(font, size, weight, colour, background). **48 of the 50 comparable rows match exactly.** The other 2
are the blue-box rows of the Latera implant page: their 2.5% headline joins step *L (3)*, so it is one
step larger, as the grouping intends.

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
| Rows in widths stryker.com doesn't use (1/4 + 3/4, 70 / 30, 1/4 + 1/4 + 1/2) | 10 rows (older imports of news fragments) | | the nearest layout: narrow + wide, wide + narrow, three equal |
| Charcoal text (#323232, typed by authors, not a Stryker component colour) | 93 uses | | black (the nearest Stryker colour), unless the business adds charcoal to the brand list |
| Headline sizes between two steps (2.5% joins L, 3.5% joins L, 1% joins S) | part of 3,584 headlines | [Latera implant](https://www.stryker.com/us/en/ent/products/latera-absorbable-nasal-implant-system.html) | nearest step (section 5.7) |
| Text sizes above 2.5× (3.5×) | a few uses | | 2.5× |
| Bold **and underlined** links inside a sentence | | | teal on stryker.com, gold on the new site today; to align with the authoring conventions (section 10) |

---

## 8. What we did not carry over, and why

| Not carried over as a Columns option | Where it goes instead |
|---|---|
| Font size, font and text colour of words inside the cells | the site-wide **text layer** (formatting and the Text style panel, section 5.7). Cell text on stryker.com starts with one of 6 looks: body Humanist 14px (70%), Egyptienne 21 / 24.5 / 28px (25%), Futura bold 17.5px (3%), Egyptienne 14px (2%). The migration writes them as Text style markers (`:start-xxxl-serif:…:end:`), for the review pages only until the business approves. |
| The same look on the whole row's text (large headline, serif lead, captions, pull quotes) | a **Text look** in Block options (section 5.6) |
| A coloured box around one line in the middle of a cell (TEACH "Trauma & Extremities", the quotes of "A winning spirit") | a Text style **line box** in the same colour names as the cell boxes (`box-dark-purple-gradient` …), 10px inside as the source default |
| Sizes, headline sizes and colours outside the limited sets | the nearest step or Stryker colour (section 5.7); none added to match a single page |
| Outer spacing (margins) around a cell | **no setting**: the block's standard gap (section 6) |
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
| The panel shows only the choices that fit the selected row, so authors don't pick options that do nothing | Authors learn one rule: whole row in Block options, a few words in Text style |
| Text keeps stryker.com's colours, sizes and fonts with normal and 6 text sizes, 4 headline sizes and 11 colours | Headlines between two steps (and 3.5× text) move by one step |

---

## 10. Decisions we need from the business

**To approve:**

1. **Text look** in Block options (section 5.6): whole-row text looks as one choice per row, a small
   departure from the package rule "fonts and sizes are never block options".
2. The **limited text sets** (section 5.7): normal and 6 text sizes, headline sizes S 1.5 / M 2 / L 3 / XL 4.5,
   11 colours (7 brand colours plus black, mid grey, dark gold and pale grey). Charcoal and navy are
   not text choices.
3. Removing the review-only gate (section *Review status*), so real pages get the new rendering and
   the migration writes Text style markers for every page.

**Proposed, still open:**

- The **first-line bars** (gold, dark grey, blue) become Text style line boxes, and *In a light grey
  box* becomes a light grey **cell box**, since on stryker.com that grey box wraps the whole cell.
- **Bold Futura Heading 2** (55 headings on 33 pages): measure them before the migration stops
  enlarging every plain one (section 5.7).
- **Bold and underlined links** inside a sentence: teal as on stryker.com, or gold as the authoring
  conventions render them today.
- The news and contact pages still bring their own copy styles; they move to Text style in their own
  sessions.

The other rows listed in section 7 follow the proposal shown there unless the business asks otherwise.

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
| Text look | a Block option that styles the whole row's text (large headline, serif lead, captions, pull quotes) |
| Text style marker | the pair `:start-…:` / `:end:` the Text style panel writes around a few words; hidden on the page |
| Line box | a Text style look that puts a coloured box around one whole line |
| Headline step | one of the 4 headline sizes (S, M, L, XL) that grow with the screen width |
| Section style | a choice for a whole section of the page, such as a full-width background |
| Cards | the block for rows of the same unit (tiles, boxes, image rows) |
| Side-by-side section | a section that places a block next to other content (`flex`) |

## Which choices fit which row

The Block options panel reads the selected row and shows only the choices that fit it; a choice or a
whole group that would do nothing is not shown (e.g. *Images* without images, *Which cell* until a
Cell box is picked). A choice the row already has always shows, so it can be removed.

| Needs | Choices |
|---|---|
| A cell box chosen first | Which cell, Text spacing in a box |
| Images in the row | Image border, Linked images, Images centred, Photo two thirds wide on phones |
| A photo with a caption under it | Serif captions, Caption right under the photo |
| An image in the first cell, text beside it | Icon beside text, Page title beside a photo, Large pull quote beside a photo |
| Exactly 2 cells | the two-cell layouts, First cell right-aligned, Rule under the first cell |
| 2 or more cells | Pull quote in the last cell |
| 3 cells / 3 or more / 4 cells | Three equal, Numbered quotes / One per row on phones / Four equal |
| Links / lists of links | Related links / Link groups |
| Any text | Centred, the first-line bars, Large headline, Serif lead paragraph |

The same needs are written in each Columns sample of the **Block Library** ("When it fits: …"), so
authors see them before inserting a row.

## Review status (draft pages only)

While the standardisation is reviewed, the new rendering applies **only on draft pages** (`/drafts/…`)
and in the authoring panels' previews (`body.std-draft`, scripts/corp.js): the Text style markers and
the Columns rules for class names that real pages already carry (`image-border`, `border-bottom`,
`label-right`, `columns-25-75`, the related-links titles), and bold links inside a sentence shown
as bold teal text links in the sentence's font, as on stryker.com, instead of teal buttons (49 such
links on 34 pages today). Every other page renders exactly as on the
branch's starting code (checked element by element on product, news, fragment and trial pages).
Removing the gate is one line in scripts/corp.js once the business approves.

The migration works the same way: the Text style markers, the line boxes and the plain Futura bold
Heading 2 are written only by a review build used for the draft pages. A normal re-import of a real
page gives exactly the same output as before (compared file by file on the TEACH and ClotTriever
pages).
