# Section layout: blocks side by side

*A walkthrough of the side-by-side sections for business, content and design teams. No technical
knowledge needed. It follows the same approach as the Columns, Panel, Cards and Hero walkthroughs
([columns](columns.md), [panel](panel.md), [cards](cards-corp.md), [hero](hero-corp.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only rows shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a column row could hold anything in its cells: a form, an accordion, a table, a gallery, a box, a shared fragment. The new site does not allow a block inside a block, so those rows can't be Columns. |
| **The risk** | Without a rule, each row would be rebuilt by hand, or the content would lose its place beside the other cell and stack under it. |
| **What we did** | We counted every row that holds a block beside other content, kept the three column widths stryker.com uses for them, and made each one a **section style**: the parts of the section (blocks and text) stand side by side in that width. One more style keeps a row side by side on phones too. |
| **The result** | The rows keep their layout: the same widths, the same 30px gutter, top-aligned, stacked on phones as today. On the review page every example lands on stryker.com's column edges at desktop, and at phone width every part stacks in order, as on stryker.com. |

---

## 2. The problem, in numbers: values today vs named choices

The free settings of the cells of these rows (side-by-side sections), how many different values
stryker.com uses today, and the named choices on the new site. *Kept* is the share of instances whose
look stays the same or almost the same: spacing within 2 points of a step (4% becomes 5%), a font size
within about 10% of a size step, a colour that is one of the named colours.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **6** | 8 | 4 | **88%** | 0 (3), 25 (1), 3 (1), 10 (1) |
| Inner spacing, bottom | **4** | 7 | 4 | **100%** | 2 (3), 5 (2), 0 (1), 3 (1) |
| Inner spacing, left | **5** | 12 | 4 | **92%** | 5 (8), 8 (1), 3 (1), 1 (1) |
| Inner spacing, right | **3** | 3 | 4 | **100%** | 8 (1), 5 (1), 1 (1) |
| Outer spacing, top (margin %) | **6** | 21 | 0 (standard) | **95%** | 2 (11), 5 (4), 4 (3), 10 (1) |
| Outer spacing, bottom | **4** | 7 | 0 (standard) | **86%** | 4 (3), 0 (2), 14 (1), 8 (1) |
| Outer spacing, left | **2** | 2 | 0 (standard) | **0%** | 15 (1), -25 (1) |
| Outer spacing, right | **2** | 4 | 0 (standard) | **100%** | 2 (3), 5 (1) |
| Font size | **11** | 143 | 6 + 4 | **98%** | 1.25× (84), 1.5× (36), 1.75× (8), 1× (6) |
| Font | **2** | 73 | 3 | **100%** | Futura bold (60), Egyptienne (13) |
| Text colour | **8** | 31 | 11 | **100%** | gold (9), purple (9), black (7), white (2) |
| Box / background colour | **2** | 2 | 10 | **100%** | gold (1 + 1 written differently) |
| Image border colour | **2** | 2 | 3 | **50%** | dark grey (1), black (1) |
| Video border colour | **1** | 1 | 1 | **100%** | black (1) |
| Text alignment | **4** | 104 | 2 | **98%** | left (99 + 2), right (2), centred (1) |

The layout of the rows has a simple answer:

| Setting | Values today | Choices | Kept |
|---|---|---|---|
| Column widths of the row | wide + narrow (2/3 + 1/3) 459, two halves 155, narrow + wide 26, three equal 19, four equal 4 | **4 section styles** (section 4) | **100%** |
| Vertical alignment | always top | none needed | **100%** |
| Phone layout | stacked in order; social icon rows stay side by side (227) | stacked, or `flex-row-mobile` | **100%** |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Side by side, and in which widths | the **Section Metadata** of the section: *Style* (section 4) |
| The look of each block in the section (box colour, accordion, form) | that block's own choices (**Block options panel**, or the block's own content) |
| Font size, font, text colour of words | the site-wide **text layer**: formatting and the **Text style panel**, the same choices in every block |
| Outer spacing (margins), inner spacing of a cell | **no setting**: the parts sit one standard gutter apart; a box has the spacing of its Panel |

**Why a section style and not a Block option:** the choice is about how several blocks share the
width of the page, not about the look of one block. The Block options panel edits one block, so the
side-by-side styles are picked where every section style is picked: the *Style* row of the section's
Section Metadata (the list DA offers for sections).

---

## 3. What these rows are (decisions taken with the business)

| Row on stryker.com | Rows | Pages | Now |
|---|---|---|---|
| A **form** beside contact text or a shared contact aside (Quick links, social icons) | **540** | 540 | a side-by-side section: the **Marketo Form** block beside the text or the **Fragment** |
| A **block** (accordion, table, number counters, gallery, chart, tabs, fragment) beside text or an image | **118** | 79 | a side-by-side section: the block beside the text |
| A **box** beside other content (text, accordion, image) | **169** | 123 | a side-by-side section: a **Panel** beside the content (Panel walkthrough, section 3) |
| A row of a shared fragment that stays side by side on phones (social icons) | **227** | 176 | a side-by-side section with `flex-row-mobile` |

What the form rows hold: a form and a shared contact aside **420**, a form beside text **120**, a form
beside an accordion **1**, a form beside a table **1**. What the block rows hold: tables **30**,
accordions **29**, number counters **24**, galleries **12**, animated bar charts **8**, fragments **4**,
tabs **3**, interactive media **2**, titles **2**, and one each of nested columns, a table with a
fragment, an accordion with a fragment, columns with a title, an accordion with a table, a news list and
a pie chart with a table.

Rows of tiles (the same unit in every cell) are **Cards**; rows of two different contents without a
block in them stay **Columns** (a table in a Columns cell is content, not a block, so it stays there).

---

## 4. The choices (Section Metadata → Style)

Each side-by-side section holds its parts in the order the author writes them: a block is one part, and
the text between two blocks is one part. On phones every part stacks in that order, as on stryker.com;
from 600px (stryker.com 841px) the parts stand side by side, top-aligned, 30px apart, on the 15px page
edge.

### 4.1 Wide + narrow (`flex, flex-67-33`)

The first part two thirds wide, the last one third. stryker.com's most used row with a block: a form
and the business unit's contact aside on product pages.

| | |
|---|---|
| Rows on the live site | forms **440**, blocks **19**, and the boxes in a 2/3 + 1/3 row |
| Measured on stryker.com (1440) | form column 910px from 30px, aside 440px from 970px; stacked below 841px |
| On the review page (1440) | form 910px from 30px, aside 440px from 970px: **the same** |
| Example pages | [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html), [Governance](https://www.stryker.com/us/en/about/governance.html) |

**More than two parts:** when the wide column holds a text and a block under it (Governance: the
policies text and the accordion of languages, beside a box), the section keeps two columns: the **last
part is the narrow column** and the other parts stack in the wide one.

### 4.2 Narrow + wide (`flex, flex-33-67`)

The first part one third wide, the rest two thirds; the mirror of 4.1 (with more parts, the **first
part is the narrow column**).

| | |
|---|---|
| Rows on the live site | forms **6**, blocks **20** |
| Measured on stryker.com (1440) | text 440px from 30px, form 910px from 500px |
| On the review page (1440) | text 440px from 30px, form 910px from 500px: **the same** |
| Example page | [Acute Care contact](https://www.stryker.com/us/en/acute-care/contact.html) |

### 4.3 Equal parts (`flex`)

Every part the same width: two halves, or three or four equal parts. Three and four parts stand two per
row from 600px and all in one row from 900px (stryker.com 1024px), as stryker.com's tablet columns do.

| | |
|---|---|
| Rows on the live site | two halves: forms **96**, blocks **59**; three equal **19**; four equal **4** |
| Measured on stryker.com (1440) | text 675px from 30px, form 675px from 735px |
| On the review page (1440) | text 675px from 30px, form 675px from 735px: **the same** |
| Example page | [Caregiver stories](https://www.stryker.com/us/en/acute-care/c/caregiver-stories.html) |

### 4.4 Side by side on phones too (`flex, flex-row-mobile`)

The row never stacks: on stryker.com these are the social icons of a business unit's contact aside
(Facebook, LinkedIn: 310 icons in 227 rows on 176 pages). Each line of the text (here each icon, linked
to the line under it with the existing `image-link` style) is one item of the row.

| | |
|---|---|
| Measured on stryker.com | icons 48px, 30px apart (1440); 35px, 29px apart (390) |
| On the review page | icons 48px, 30px apart (1440); 35px, 30px apart (390): **the same** |
| Example pages | [Acute Care](https://www.stryker.com/us/en/acute-care.html), [Sage](https://www.stryker.com/us/en/sage.html), [Emergency Care](https://www.stryker.com/us/en/emergency-care.html) |

### 4.5 Tab panels (`tab-panel`)

The package also adds a `tab-panel` section style (198 tabs blocks): a section that is one tab panel,
so a tab can hold blocks. It is built and documented with the **Tabs** block.

---

## All section styles on stryker.com (beyond side by side)

*Section style names written on the imported stryker.com pages (2,340 live pages): **255 names, 35,817
uses**.*

| Kind | Names today | Uses | New site | Status |
|---|---|---|---|---|
| Side by side and column widths | 29 | 6,071 | **4**: side by side (equal, wide + narrow, narrow + wide), side by side on phones | built |
| Section roles: tab, accordion, carousel | 11 | 1,066 | **3** roles + 7 follow-up choices (starts open; autoplay, fade, split slide, 3 band colours) | built |
| Background and boxes | 38 | 4,123 | **10** background colours (the box colours) + full width, soft shadow box, gradient direction | proposed |
| Text look of the whole section (fonts, sizes, bold, centred) | 56 | 11,394 | **Text style** for the words, + **1** section style: centred text | Text style built; centred proposed |
| Spacing (padding, margin, spacer sections) | 95 | 6,194 | **0**: the standard gap between sections | by design |
| Lines between sections | 5 | 3,348 | **1**: line above the section | proposed |
| Template and shared parts (disclaimer, contact aside, Connect band …) | 12 | 3,450 | **12** kept as they are, set by the migration with their template or fragment; not an author choice | kept |
| Button colour | 2 | 96 | **2**: purple buttons, blue buttons | proposed (kept) |
| Desktop or phone only | 2 | 28 | **2**: desktop only, phone only | proposed (kept) |
| Image looks (borders, linked images) | 5 | 47 | **0** section styles: Block options of the block (image border, linked images) | built |
| **Total** | **255** | **35,817** | **35 author choices** (14 built, 21 proposed) **+ 12 template looks** | |


The full list of built and proposed section styles, and how the Block options panel decides which to
show, is in the business guide (how-we-standardised.md, section 9).

---

## 5. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Column widths | 5 width patterns | 3 section styles (+ the phone row) | **100%**: every row keeps its widths |
| Gutter and page edge | 30px between cells, 15px edge | the same | **100%** |
| Alignment | top | top | **100%** |
| Phones | stacked in order; icon rows side by side | the same | **100%** |
| Inner spacing | 3–6 values per side | the blocks' own spacing | **88%** to **100%** |
| Outer spacing | 2–6 values per side | the standard gap | **0%** to **100%** (6 rows, below) |
| Font size, font, text colour | 11 / 2 / 8 values | the text layer | **98%** / **100%** / **100%** |

**Checked on the review page.** The review page holds a real stryker.com row for every choice. At 1440
every part lands on stryker.com's column edges (sections 4.1 to 4.4); at 390 every part stacks in order.
From 600 to 840px the parts already stand side by side, where stryker.com still stacks them: the
site's tablet breakpoint (841px) maps to 600px, as for every block. The text beside the forms keeps
its size and font: *Throughout the year…* 17.5px Futura bold, *We know all caregivers…* 17.5px
Egyptienne, the contact text 14px Humanist, the box text 28px Egyptienne, as on stryker.com.

**What moves more:** outer spacing on the left (2 cells: 15% and −25%), which the standard gutter
replaces.

---

## 6. To review (outliers)

| What | Rows | Example pages | Proposal |
|---|---|---|---|
| Number counters in a row of three or two (24 rows) | 24 | [Isolibrium](https://www.stryker.com/us/en/acute-care/products/isolibrium.html), [ProCare](https://www.stryker.com/us/en/acute-care/services/procare.html) | the **Statistics** block's own three / two per row, not a section layout (Statistics walkthrough) |
| Three tables in a row of three | 1 | [Transend guidewires](https://www.stryker.com/us/en/neurovascular/products/transend--guidewires.html) | Columns (three equal), the tables in its cells |
| A cell with a negative left margin (−25%) | 1 | | the standard gutter |
| The Quick links fragment's text looks (gold 14px title, uppercase links) differ from stryker.com (black 17.5px title, 17.5px links) | the 420 form rows' asides | [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html) | fix with the **Fragment** block (the shared contact aside), not here |

---

## 7. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| A block inside a column cell | the block **beside** the content in a side-by-side section (no blocks inside blocks) |
| The 12-column names (`cols-8-4`, `cols-6-6`, `cols-4-8`, `cols-4-4-4`) | the existing section names `flex-67-33`, `flex`, `flex-33-67`, already used by 330 imported sections |
| Inner and outer spacing of the cells | each block's own spacing; the standard gutter |
| Font size, font and text colour in the cells | the site-wide **text layer** (Text style panel) |
| A block option | the Section Metadata *Style*, offered in the *Section* area of the Block options panel: the layout is the section's, not the block's |

---

## 8. Pros and cons

| Pros | Cons |
|---|---|
| Three widths and one phone rule instead of 12-column combinations | The panel copies the section's Style; the author pastes it into the Section Metadata |
| The names already exist on imported pages (form rows) | With more than two parts, the author must know which part is the narrow column (the last for wide + narrow, the first for narrow + wide) |
| Forms, accordions, boxes and fragments stay beside their text, as today | From 600 to 840px rows stand side by side where stryker.com stacks them (the agreed breakpoint) |
| Phones behave as today | |

---

## 9. Decisions we need from the business

**To approve:**

1. The four section styles: `flex` (equal), `flex, flex-67-33`, `flex, flex-33-67`, `flex, flex-row-mobile`.
2. The names: keep the existing `flex-…` names (proposal) rather than the 12-column `cols-…` names.
3. The rule for more than two parts: the narrow column is the last part (wide + narrow) or the first
   (narrow + wide).
4. Removing the review-only gate, so real pages get the new rendering and the migration writes the
   side-by-side sections for every page.

**Open (from the package):**

- The 420 forms with the shared contact aside: a **Marketo Form** block beside a **Fragment** (proposal,
  as the import already does), or the aside as part of the form block?
- The 24 number counter rows: **Statistics** (proposal) or a section layout?
- The section styles in the **Block options panel**: built (in review). Below a block's options, a
  *Section* area offers side by side (equal, wide + narrow, narrow + wide, on phones too) and the
  section's role (tab, accordion panel, carousel slide), greyed out with the reason when they don't fit
  ("needs 2 or more parts in the section"). It copies the new Style to paste into the section's Section
  Metadata (or a whole Section Metadata table when the section has none): the editor lets an extension
  replace only the block at the cursor, not the section's metadata table.

---

## Glossary

| Term | Meaning |
|---|---|
| Section | a part of the page between two section breaks; it holds text and blocks |
| Section Metadata | the small table at the end of a section where its *Style* is set |
| Section style | a choice for a whole section, such as a background or side by side |
| Side-by-side section | a section whose parts stand next to each other (`flex`) |
| Part | one block, or the text between two blocks, of a section |
| Wide + narrow | two thirds + one third of the width |
| Gutter | the space between two parts (30px) |
| Contact aside | a business unit's Quick links and social icons, a shared fragment beside the form |

## Which style fits which row

| The row holds | Style |
|---|---|
| A form and a contact aside or text, the form two thirds wide | `flex, flex-67-33` |
| Text and a form, the text one third wide | `flex, flex-33-67` |
| Two, three or four parts of the same width | `flex` |
| A text and a block under it, beside a box (wide + narrow) | `flex, flex-67-33`, the box last |
| Social icons that stay in a row on phones | `flex, flex-row-mobile` (with `image-link` for linked icons) |
| Two contents without a block (image and text) | not a section style: **Columns** |
| The same unit in every cell | not a section style: **Cards** |

## Review status (draft pages only)

While the standardisation is reviewed, the new rendering applies **only on draft pages** (`/drafts/…`)
and in the authoring panels' previews (`body.std-draft`): the equal `flex` parts from 600px, top-aligned
and 30px apart, the grouping of more than two parts into two columns, and `flex-row-mobile`. The
existing `flex-67-33` / `flex-33-67` rendering is unchanged (it already matches stryker.com). Every other
page renders as before: product, contact and governance pages with side-by-side sections were checked
section by section at 1440, 700 and 390 against the branch's starting code.

The migration works the same way: the side-by-side sections for form rows (in their source order, with
the text beside the form keeping its size and font) are written only by the review build. A normal
re-import of a real page gives exactly the same output as before (compared file by file on Arise 1000
EX, Caregiver stories, Surgical tables and Governance).

**Not migrated automatically yet** (the review page has them by hand, from the review import):

- Blocks beside content (Governance: the text and the accordion beside the box): the import puts the
  three parts one under the other; they are put in one `flex, flex-67-33` section by hand.
- The social icon row: the import writes the icons inside the contact aside; the review page shows it
  as its own `flex, flex-row-mobile` section.
- *Throughout the year…* on Caregiver stories is bold Futura on stryker.com inside a serif paragraph;
  the import marks the paragraph serif, so it is set as a 1.25× size only by hand.
