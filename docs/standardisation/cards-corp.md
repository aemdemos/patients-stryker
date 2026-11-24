# Cards: one block for every row of tiles

*A walkthrough of the Cards (corp) block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns and Panel walkthroughs ([columns](columns.md),
[panel](panel.md)): measure what stryker.com actually uses, keep its look, and offer a small set of named
choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only card rows shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, rows of cards come from many different components (column rows, related products, resources and downloads, product grids, category tiles, latest news, featured grids), each with its own free settings: any number per row, any box colour, any spacing in percent, any image border colour, the title above or below the image. |
| **The risk** | Copying every component means a dozen look-alike blocks and free values for what is mostly the same card: an image, a title, a short text and a link. |
| **What we did** | Following the business decision, every row of tiles is now one block, **Cards (corp)**: one row per card, an image (or video) and its text. The kind of card is the first choice (image, video, teaser, resources, product grid, category tiles, text only, one wide card); everything else is a few named choices in the **Block options panel**: cards per row, image border, card box colour, text spacing, soft shadow, centred text, title above the image, image only and the teaser's no-description. |
| **The result** | Card rows look the same or almost the same as today: 95% of box colours and image borders and 96% to 99% of inner spacing values keep their look. The text in the cards uses the site-wide **Text style**, with the same small set of sizes and brand colours as Columns and Panel. On the review page, every card type and choice is shown with real stryker.com cards, and the card text matches stryker.com in colour, font and size on 28 of 33 rows (the other 5 by design, section 6). |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a card row, how many different values stryker.com uses today, and the named choices
on the new site. *Kept* is the share of instances whose look stays the same or almost the same: spacing
within 2 points of a step (4% becomes 5%), a font size within about 10% of a size step, a colour that is
one of the named colours.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **17** | 479 | 4 | **96%** | 5 (140), 3 (111), 4 (51), 10 (45) |
| Inner spacing, bottom | **25** | 484 | 4 | **96%** | 3 (146), 5 (67), 10 (56), 2 (45) |
| Inner spacing, left | **11** | 396 | 4 | **99%** | 3 (106), 5 (88), 2 (71), 0 (45) |
| Inner spacing, right | **10** | 383 | 4 | **99%** | 3 (132), 5 (78), 2 (70), 4 (39) |
| Outer spacing, top (margin %) | **18** | 249 | 0 (standard) | **64%** | -7 (46), 3 (36), -1 (30), 5 (24) |
| Outer spacing, bottom | **11** | 134 | 0 (standard) | **97%** | 5 (35), 2 (25), 10 (18), 3 (18) |
| Outer spacing, left | **5** | 60 | 0 (standard) | **100%** | 5 (27), 0 (16), 2 (7), 3 (7) |
| Outer spacing, right | **5** | 66 | 0 (standard) | **100%** | 5 (33), 0 (16), 2 (7), 10 (5) |
| Font size | **26** | 4,535 | 6 + 4 | **95%** | 1.25× (2,000), 1.5× (1,352), 1.75× (367), 0.8× (278) |
| Font | **7** | 3,678 | 3 | **99%** | Futura bold (2,787), Egyptienne (869), Roboto (15) |
| Text colour | **23** | 1,692 | 11 | **97%** | gold (483), pale grey #edeeec (240), black (234), white (144) |
| Box / background colour | **19** | 150 | 10 | **95%** | light grey (25 + 19 written differently), gold (24 + 19) |
| Image border colour | **10** | 252 | 3 | **95%** | black (93), teal (61), grey (36), a lighter grey (19) |
| Text alignment | **3** | 3,533 | 2 | **100%** | left (2,506 + 84), centred (943) |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Card type, cards per row, image border, card box (colour, spacing, shadow), centred text, title above the image, image only, no description | **Block options panel** (sections 4 and 5) |
| Font size, font, text colour of words in the cards; a box around one line | the site-wide **text layer**: formatting and the **Text style panel**, the same choices in every block (section 5.6) |
| Outer spacing (margins), including the negative top margins | **no setting**: the block keeps its standard gap |
| Section backgrounds behind card rows (slate, grey, gold, green, plum, bronze, dark: 19 rows) | a **section style** |

---

## 3. What moved into Cards (decisions taken with the business)

All card looks on stryker.com go in Cards (corp). The rule in one line: *rows of the same unit are cards;
two cells with different content are columns; two cells with the same content are cards only when they
have a box, shadow or border.*

| Row on stryker.com | Now | Rows |
|---|---|---|
| Rows of 3 or 4 column cells with the same text unit (value statements, facts, short teasers), rows where every cell is a box, two-cell rows with a box, shadow or border | **Cards: Text only**, with the card box | 250 |
| Rows of curated call-to-action tiles (image with a title link) | **Cards: Image** (the CTA is the card's link) | 68 |
| Rows of 3 or 4 images without text (logos, product shots) and 5 bordered two-image rows | **Cards: Image**, *Image only* | 79 |
| The Columns tile looks (challenge cards 7 rows, icon cards 1, colour profile cards 1, product tiles 3, CTA tiles 2, icon grid 0) | **Cards**, with *Title above the image*, the card box and the image choices | (part of the rows above) |
| The earlier review names `gray-box` and `white-box` (the CLOUT card grids) | read as *Card box: Light grey* and *Card box: White + Soft shadow* | — |

Pages that carry the Columns tile names today keep rendering as before until the business approves.

---

## 4. The card types (one per row, the first choice)

Each row of the block is one card: its image or video first, then its text (title, text, link). On phones
every row of cards stacks the cards in their authored order, as on stryker.com.

### 4.1 Image (default)

An image, a title, a short text and an optional link; the image links to the card's link.

| | |
|---|---|
| Rows on the live site | **823** (about 750 on pages, about 70 inside fragments), plus 68 CTA-tile rows and 79 image-only rows moved from Columns |
| Example pages | [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility.html) |

### 4.2 Video

A video, a title and a short text; the video plays in the card.

| | |
|---|---|
| Rows on the live site | **120** on 77 pages |
| Example pages | [The iSuite experience](https://www.stryker.com/us/en/communications/systems/-isuite-experience.html), [Colorectal surgery resources](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/resources/colorectal-surgery.html) |

### 4.3 Teaser

Related products or news: image, serif title, description and *Learn more*, filled from the linked pages.

| | |
|---|---|
| Rows on the live site | **435** related + **16** latest news (the four newest news pages with a tag; shown as a snapshot, as the migration does today) |
| Example pages | [Vocera Analytics](https://www.stryker.com/us/en/acute-care/products/vocera-analytics.html), [Sage](https://www.stryker.com/us/en/sage.html) |

### 4.4 Resources

Downloads: a PDF cover or thumbnail with the file title below; 2 per row on phones, 4 on tablets, 6 on
desktops, as on stryker.com.

| | |
|---|---|
| Rows on the live site | **558** on 447 pages |
| Example pages | [IsoAir](https://www.stryker.com/us/en/acute-care/products/isoair.html), [Webinar: support surfaces](https://www.stryker.com/us/en/acute-care/c/the-science-behind-support-surfaces/webinar.html) |

### 4.5 Product grid

A product image above a grey rule and the product name.

| | |
|---|---|
| Rows on the live site | **175** on 163 pages (39 grouped lists, 136 grids filled by a tag query, 5 per row) |
| Example pages | [Bedframes](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/bedframes.html), [Lisfranc](https://www.stryker.com/us/en/foot-and-ankle/procedures/lisfranc.html) |

On stryker.com the 136 portfolio grids fill themselves from product tags and offer dropdown filters
(33), *Show: All / Product / System* tabs (37) and *Load more* (18). That list is new code and a separate
step; until then the review page shows the grid with authored cards (section 10).

### 4.6 Category tiles

A large image with a teal label bar and an arrow, linking to a sub-category page; 3 per row.

| | |
|---|---|
| Rows on the live site | **15** on 15 pages |
| Example pages | [Bedframes](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/bedframes.html), [Integration and connectivity](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity.html) |

### 4.7 Text only

Text cards: a title, a short text and a link, no image. With a card box they carry the rows of boxes
moved from Columns (section 3).

| | |
|---|---|
| Rows on the live site | **8** featured grids, plus **250** text-tile rows from column rows |
| Example pages | [Foot & Ankle](https://www.stryker.com/us/en/foot-and-ankle.html) (featured products), [IsoAir](https://www.stryker.com/us/en/acute-care/products/isoair.html), [Alliance](https://www.stryker.com/us/en/c/2021/alliance.html) |

A text card with a separate first cell keeps today's look (a gold title band over a grey body, used on
3 news pages); a text card in one cell is the text alone, as on stryker.com.

### 4.8 One wide card

One product per row: the image beside its title and text, a grey rule between rows.

| | |
|---|---|
| Rows on the live site | **1** (one page) |
| Example pages | [Virtual surgical planning](https://www.stryker.com/us/en/craniomaxillofacial/systems/virtual-surgical-planning--vsp-.html) |

---

## 5. The options (Block options panel)

### 5.1 Cards per row

| Choice | Option | Image | Video | Teaser (related) | Fragments |
|---|---|---|---|---|---|
| Two | `two-up` | 161 | 40 | | 26 |
| Three | `three-up` | 361 | 45 | 263 | 17 |
| Four (default) | none | 236 | 36 | 177 | 26 |
| Five | `five-up` | | | | 2 (+ product grid 136) |
| Six | `six-up` | | | | 3 (+ resources 558) |

98 image rows have fewer cards than columns (2 of 3, 3 of 4, 2 of 4): stryker.com keeps the card width,
so the row doesn't fill. The choice is the authored number per row, not the number of cards, so those
rows keep their width. The chosen number wins over a card type's own count (a video or text row set to
two per row shows two).

### 5.2 Image border

The same three choices as Columns.

| Choice | Option | Example page |
|---|---|---|
| Grey | `image-border` | [Annual review 2025](https://www.stryker.com/us/en/about/annual-review/2025.html) |
| Teal | `image-border-teal` | [OTA annual meeting 2024](https://www.stryker.com/us/en/c/2024/ota-annual-meeting.html) |
| Black | `image-border-black` | |

71 rows set an image border; of the 252 border uses, black 93, teal 61, grey 36 and a lighter grey 19
(which joins grey) are kept (95%).

### 5.3 Card box: colour

A coloured box behind each card's text, in the same colour names as Panel and Columns. The box sets the
text colour: white on blue, teal, purple and dark grey.

| Choice | Option | Example page |
|---|---|---|
| None (default) | | |
| White | `box-white` (with *Soft shadow*: the stryker.com "dimensional box") | [Alliance](https://www.stryker.com/us/en/c/2021/alliance.html) |
| Gold | `box-gold` | [IsoAir](https://www.stryker.com/us/en/acute-care/products/isoair.html) |
| Light grey | `box-gray` | [Global quality](https://www.stryker.com/us/en/about/global-quality.html) |
| Blue | `box-blue` | [Nurses turning experience into innovation](https://www.stryker.com/us/en/about/news/2022/features/these-nurses-share-how-they-re-turning-experience-into-innovatio.html) |
| Teal | `box-teal` | same page |
| Purple | `box-purple` | same page |
| Dark grey | `box-dark` | |

The boxed tiles from column rows: 49 rows of boxes and 27 bordered two-cell rows. The colour is one per
row (section 7 for the rows that give each card its own colour).

### 5.4 Text spacing in a box

| Choice | Option | Source values it covers |
|---|---|---|
| None | `space-none` | 0% |
| Small (3%) | `space-s` | around 3% |
| Medium (5%, default) | `space-m` | around 5% |
| Large (10%) | `space-l` | 10% and more |

96% of top and bottom and 99% of left and right spacing values stay within 2 points (section 2).

### 5.5 Other choices (switches)

| Choice | Option | Rows on stryker.com |
|---|---|---|
| Soft shadow | `shadow` | the white boxes ("dimensional box") |
| Centred text | `text-center` | 943 of 3,533 text alignments |
| Title above the image | `title-above` | 57 image + 13 video rows |
| Image only | `no-text` | 79 rows (from column rows) |
| Card text in a box (a white soft-shadow box with the text, overlapping the image) | `border` | the boxed card cells |
| Teaser: No description | `no-description` | 17 teaser rows |

**Not a choice: the linked image.** Every card with a link already links its image to that link (as the
94 rows with linked images and every teaser do), so there is no separate switch.

### 5.6 Text inside the cards (Text style, not Block options)

Colour, size and font of a few words are set with the site-wide **Text style panel**, the same in every
block, with the package's limited sets: text sizes normal, 0.8×, 1.25×, 1.5×, 1.75×, 2× and 2.5×; the
four headline sizes S 1.5, M 2, L 3, XL 4.5; the 8 brand colours plus black, mid grey, dark gold and pale
grey. A coloured box around one whole line (the coloured title bars of Giving back, the blue title of the
challenge cards) is a Text style **line box**.

Two size tags right inside each other on stryker.com multiply (1.25 times inside 1.5 times = 1.875 times):
the migration now gives them the one size nearest to the product (2 times), instead of keeping only one of
the two.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Card types | about a dozen components | 8 card types | every row has its type |
| Cards per row | 2 to 6 | 5 choices | **100%** (the authored number) |
| Box colour | 19 values | 10 named colours (7 for cards) | **95%** |
| Inner spacing | 10–25 values per side | 4 steps | **96%** top and bottom, **99%** left and right |
| Outer spacing | 5–18 values per side | the block's standard gap | **64%** top, **97%** bottom, **100%** left and right |
| Font size, font, text colour | 26 / 7 / 23 values | the text layer | **95%** / **99%** / **97%** |
| Image border | 10 colours | 3 | **95%** |
| Text alignment | 3 values | left, centred | **100%** |

**What moves more:** the outer spacing on top (64% kept): 46 rows pull the cards up with a negative top
margin of 7% (an overlap effect), which the standard gap replaces (section 7).

**Checked on the review page.** The Cards review page holds real stryker.com cards for every card type
and choice (33 rows). A comparison measured the card text (colour, font, size, weight), the box colour,
the image size and border and the cards per row on both sites, on desktop (1440) and phone (390).

| What | Matches stryker.com |
|---|---|
| Card text colour, font and size | **28 of 33** rows on desktop |
| Box colour and image border | every row that sets them on stryker.com, except the bronze title bar (section 7) |
| Cards per row and phone stacking | every row (resources 2 per row on phones, as on stryker.com) |

The rows that differ, all by design or listed for review:

- *Strategic contracting* on Alliance (2 rows: the white box and the shadow example): two size tags on top
  of each other make it 1.875 times (26.25px); it takes the nearest size, 2 times (28px).
- The challenge cards' 2.5% headline joins step *L (3)* (42px instead of 35px), as the headline grouping
  intends (the same as the Latera rows of Columns).
- *Dark grey* and *Card text in a box* show stryker.com cards with a choice they don't use on their page,
  to show the choice.
- *Title above the image* on Giving back: the first title bar is bronze on stryker.com, a colour not in
  the list; it has no box on the review page (section 7).

On phones the same rows differ, plus three phone-only differences: a Heading 4 (the featured grid titles)
is 17.5px on the new site and 14px on stryker.com below 480px (all blocks, as noted for Panel), the
latest news images fill the card width (stryker.com keeps them at 307px), and the one wide card's title
keeps its 21px.

---

## 7. To review (outliers)

These rows don't fit a choice exactly. They take the nearest choice unless the business decides otherwise.

| What | Rows | Example pages | Proposal |
|---|---|---|---|
| A different text-box colour per card (blue, bronze, purple, teal, plum, slate, taupe: the coloured "cards" look) | 21 image rows | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [7 ways we partner for prevention](https://www.stryker.com/us/en/about/news/features/7_unique_ways_we_partner_for_prevention.html) | one card box colour per row; or each card's title as a Text style line box in its colour (as on the review page); bronze, plum, slate and taupe take the nearest named colour |
| A large headline as the card title | 18 rows | | the text layer (headline size), not an option |
| A sans title font on teasers | 4 teaser rows | [NTI trade show](https://www.stryker.com/us/en/acute-care/c/nti-trade-show.html) | the text layer, not an option |
| Negative top margins (an overlap effect) | 46 rows | | drop the overlap (the standard gap) |
| Image borders in other colours (a lighter grey) | 19 uses | | grey |
| Featured grids: the cards beside an empty left column (stryker.com leaves a quarter of the row empty) | 8 rows | [Foot & Ankle](https://www.stryker.com/us/en/foot-and-ankle.html) | the cards take the full row |

---

## 8. What we did not carry over, and why

| Not carried over as a Cards option | Where it goes instead |
|---|---|
| Font size, font and text colour of words in the cards | the site-wide **text layer** (Text style panel, section 5.6) |
| A box around one title line | a Text style **line box** |
| Outer spacing (margins) around a card | **no setting**: the block's standard gap |
| Section backgrounds behind card rows | a **section style** |
| A linked-image switch | the image always links to the card's link (section 5.5) |
| The product grid's filters, type tabs and Load more | a separate build step (new code), section 10 |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One Cards block for every row of tiles instead of a dozen components and column looks | Rows of tiles change block (from Columns to Cards), which authors need to know |
| The same colour list, image borders and spacing steps as Panel and Columns | Rows with a colour per card get one colour per row (or line boxes) |
| Imported pages keep working: the earlier names are read as the new choices | The filtered product grids need new code before they fill themselves |
| The panel greys out the choices that don't fit the selected cards, with the reason | |

---

## 10. Decisions we need from the business

**To approve:**

1. Every row of tiles is Cards (corp): the 8 card types and the choices above.
2. One card box colour per row (21 rows give each card its own colour today), with the line-box
   alternative for coloured titles.
3. Resources 2 per row on phones, as on stryker.com (the review page does this; real pages show 1 today).
4. The linked image as the default for every card with a link (no switch).
5. Removing the review-only gate (section *Review status*), so real pages get the new rendering and the
   migration writes rows of tiles as Cards for every page.

**Open points from the analysis:**

- 57 rows put the title above the image: the *Title above the image* choice (as built), or reorder to
  image first on import?
- 36 cards come from one shared fragment (Emergency Care services and support) on 36 pages: fine as
  fragment content?
- ProCare / Flex Financial tiles authored as column rows on product pages (about 30 rows, for example
  iBed Wireless): page metadata like the template ProCare tiles, or authored cards?
- The filtered product grid (136 grids: tag query, filters, type tabs, Load more): to build as a
  separate step.

---

## Glossary

| Term | Meaning |
|---|---|
| Card | one tile of a row: its image or video, then its title, text and link |
| Card type | the kind of card of a row (image, video, teaser, resources, product grid, category tiles, text only, one wide card) |
| Card box | a coloured box behind each card's text, in the Panel colour names |
| Dimensional box | stryker.com's name for a white box with a soft shadow |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text layer, Text style | fonts, sizes and coloured words, set with formatting and the Text style panel, the same on every block |
| Line box | a Text style look that puts a coloured box around one whole line |
| Section style | a choice for a whole section of the page, such as a full-width background |

## Which choices fit which cards

The Block options panel reads the selected cards and greys out the choices that would do nothing.
Hovering a greyed choice shows why ("Not available here: needs images in the row.", "pick a Card box
first") and what it does.

| Needs | Choices |
|---|---|
| Images in the cards | Resources, Product grid, Category tiles, One wide card, Image border, Image only |
| Images and text | Title above the image, Card text in a box |
| Links | Video |
| Text | Text only, Card box, Centred text |
| A card box chosen first | Text spacing in a box, Soft shadow |
| The Teaser type | No description |
| Nothing | Image, Teaser, Cards per row |

## Review status (draft pages only)

While the standardisation is reviewed, the new Cards rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: the card box colours, spacing and shadow, the image
borders, centred text, title above the image, image only, no description, the one-cell text card,
resources 2 per row on phones, the chosen cards per row winning over a card type's own count, and the
card text at the Text style sizes. stryker.com pages imported today (resources, teasers, image rows,
people, text cards: about 1,350 pages) render exactly as before (checked element by element on six
pages: Vocera Analytics, Arise 1000 EX, 1788 platform, Leaders, OrthoLoc 2 Lapifuse and a news feature);
patients pages are not touched.

The migration works the same way: rows of tiles become Cards (with their choices) and the Text style
markers are written only by a review build used for the draft pages. A normal re-import of a real page
gives exactly the same output as before (compared file by file on IsoAir, 1788 platform and Alliance).

The review page was assembled from review-build imports of the example pages. Three things were added
by hand, all open points for the migration: the product grid, category tiles, one wide card, featured
grid and latest news cards (their components are not migrated yet, so their cards were taken from the
live pages), the blue box of the challenge card title (a large-headline background the migration doesn't
carry), and the media links under the image-only tiles, which the review build keeps on the ICJR page.
