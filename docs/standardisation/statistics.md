# Statistics: big numbers, few choices

*A walkthrough of the Statistics block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 82 number rows shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, big coloured numbers (74%, $174,896, 56K) with a short text are built with a "number counter" that counts up, or typed as large text. Authors could pick any colour, any of ten sizes as a share of the screen width, left or centred, and place them in any column grid, sometimes next to images or a video. |
| **The risk** | Copying every value means ten number sizes and six colours combined freely, for what is one look: a row of big numbers with a text under each. |
| **What we did** | We counted every number row on the live site and turned the free settings into a few named choices in the **Block options panel**: the number colour, three number sizes, the numbers per row, centred text, and the fast facts' number beside its text. The text under each number keeps its stryker.com size, font and colour through the site-wide **Text style**. |
| **The result** | Number rows look the same or almost the same as today: every number keeps its exact colour, every row its columns, and the texts their size and font. Numbers between two sizes take the nearest of the three (a one-step change by design). |

---

## 2. The problem, in numbers: values today vs named choices

The settings of the number rows, how many different values stryker.com uses today, and the named choices
on the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Outer spacing, top (margin %) | **1** | 3 | 0 (standard) | **100%** | 2 (3) |
| Font size (the texts) | **6** | 47 | 6 + 4 | **68%** | fontsize-2-5em (15), fontsize-1-5em (11), fontsize-1-25em (8), fontsize-2em (5) |
| Font (the texts) | **2** | 23 | 3 | **100%** | futura-bold (18), urw-egyptienne (5) |
| Text colour (the texts) | **9** | 34 | 8 | **88%** | #4c7d7a (10), #ffb500 (7), #85458a (5), #af6d04 (4) |
| Text alignment | **2** | 15 | 2 | **100%** | left (default) (8), center (7) |

And the counters' own settings:

| Setting | On stryker.com | Choices | Instances |
|---|---|---|---|
| Number colour | 6 colours | **5**: gold (default), navy, purple, teal, white | gold 29, navy 27, purple 9, teal 6, white 2, dark gold 1 (joins gold) |
| Number size | **10** sizes from 2.5 to 9 hundredths of the screen width | **3**: small, medium (default), large | 2.5 to 4 → small (11), 4.5 to 6 → medium (42), 6.5 to 9 → large (17) |
| Alignment | left, centred | **2**: left (default), centred | centred 35, left 32 |
| Count-up animation | always on | always on, no choice | 48 |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Number colour, number size, numbers per row, centred, number beside its text | **Block options panel** (section 4) |
| One number in its own colour | a **colour word** (gold, navy, purple, teal) in the row's first cell, as today |
| An image with a number | an **image cell** in the row |
| Size, font and colour of the text under a number | the site-wide **Text style** (section 5) |
| A dark or grey band behind the row | a **section style** (*dark, full-bleed*, *light-gray, full-bleed*) |

---

## 3. The variants on stryker.com (one block)

All five stryker.com looks are one Statistics block; what differs is a choice or the content.

### 3.1 A row of numbers (`grid`)

A row of 2 to 4 big coloured numbers, each with its text, one per column.

| | |
|---|---|
| Rows on the live site | **43** on 17 pages |
| On the new site | Statistics; *Numbers per row* gives the columns |
| Example pages | [Isolibrium](https://www.stryker.com/us/en/acute-care/products/isolibrium.html), [ProCare](https://www.stryker.com/us/en/acute-care/services/procare.html), [ASC care setting](https://www.stryker.com/us/en/care-settings/asc.html) |

### 3.2 One number alone (`single`)

| | |
|---|---|
| Rows on the live site | **4** on 2 pages |
| On the new site | Statistics with *Numbers per row: One* |
| Example pages | [iSuite experience](https://www.stryker.com/us/en/communications/systems/-isuite-experience.html), [Prophecy](https://www.stryker.com/us/en/foot-and-ankle/products/prophecy.html) |

### 3.3 Numbers with an image (`with-image`)

Big numbers with a short line above and below, and an illustration under each (the About page's 61
countries, 56K employees, 150M patients). These are typed as large text on stryker.com, not counters.

| | |
|---|---|
| Rows on the live site | **11** on 4 pages (3 per row 7, 6 per row 3, 2 per row 1) |
| On the new site | Statistics with an image cell in each row; the line above the number is a small line in the number cell |
| Example pages | [About](https://www.stryker.com/us/en/about.html), [Mako SmartRobotics](https://www.stryker.com/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility.html) |

### 3.4 Numbers next to images or a video (`in-mixed-column`)

Counters stacked in a column beside images, a video or a headline.

| | |
|---|---|
| Rows on the live site | **22** on 7 pages |
| On the new site | a Statistics block in a **side-by-side section** with the other content (blocks can't sit inside Columns), as the Section layout chapter does for a box next to other content. To confirm with the business (section 10); the migration keeps these numbers as text until then. |
| Example pages | [Global power tools](https://www.stryker.com/us/en/c/2019/global-power-tools.html), [PneumoClear](https://www.stryker.com/us/en/endoscopy/products/pneumoclear.html), [Innovation inspired by insights](https://www.stryker.com/us/en/about/news/features/innovation-inspired-by-insights--the-next-generation--first-comp.html) |

### 3.5 Fast facts (`fast-facts`)

A title with a rule, then number + statement pairs, each number beside its text, white on a dark band.

| | |
|---|---|
| Rows on the live site | **2** on 2 pages |
| On the new site | a Heading 2 and Statistics with *Number and text on one line*, in a *dark, full-bleed* section |
| Example pages | [Guarantee programs](https://www.stryker.com/us/en/c/2018/guaranteeprograms.html), [Surgical: learn](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn.html) |

---

## 4. The options (Block options panel)

### 4.1 Number colour

| Choice | Option | Rows on stryker.com |
|---|---|---|
| Gold (default) | none | 29 + 1 dark gold |
| Navy (the stryker.com blue #1c5687) | `stat-navy` | 27 |
| Purple | `stat-purple` | 9 |
| Teal | `stat-teal` | 6 |
| White (for a dark band) | `stat-white` | 2 |

When the numbers of a row have different colours (Isolibrium: gold, navy, gold), each number keeps its
own with a colour word in its first cell, as the block reads today.

### 4.2 Number size

The sizes grow with the screen width, as on stryker.com (a share of the page width, twice that share on
phones).

| Choice | Option | Size | stryker.com sizes it covers |
|---|---|---|---|
| Small | `stat-s` | 3.25 hundredths of the width | 2.5 to 4 (11) |
| Medium (default) | none | 5 | 4.5 to 6 (42) |
| Large | `stat-l` | 7.5 | 6.5 to 9 (17) |

Each step is the middle (by proportion) of the sizes it covers, the same way the headline sizes were
grouped.

### 4.3 Numbers per row

| Choice | Option | On stryker.com |
|---|---|---|
| Three (default) | none | most rows |
| One | `cols-1` | single numbers, numbers beside other content |
| Two | `cols-2` | 2-up rows, fast facts |
| Four | `cols-4` | 4-up rows |
| Six | `cols-6` | the 6-up image rows |

On phones every number takes the full width, in order, as on stryker.com.

### 4.4 Centred and number beside its text

| Choice | Option | On stryker.com |
|---|---|---|
| Centred (left by default) | `text-center` | 35 rows centred, 32 left |
| Number and text on one line | `inline` | the 2 fast facts: the number beside its text from 600px wide, above it on phones, both in the serif, no count-up |

**Imported names that are existing choices:** `left` is the default, `count-up` and `count-once` are always
on, `fast-facts` is *Number and text on one line*. The panel shows them as these choices.

---

## 5. The text under the numbers (Text style, not Block options)

The text under each number keeps its stryker.com look through the site-wide **Text style**, with the
same small set of sizes and brand colours as every block: *reduction in HAPIs…* on Isolibrium is bold
Futura at the small headline size (S, 21px on desktop and 11.7px on phones, exactly as stryker.com);
*minutes faster…* on Prophecy is the serif at headline size M (28px). Bold words are Futura bold.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Number colour | 6 colours | 5 colours | **100%** keep their colour (the 1 dark gold becomes gold) |
| Number size | 10 sizes | 3 sizes | sizes on a step stay exact; the others move to the nearest step |
| Alignment | left, centred | left, centred | **100%** |
| Columns | 1 to 6 per row | 1, 2, 3, 4, 6 | **100%** |
| Texts under the numbers | 6 sizes, 2 fonts, 9 colours | Text style | **68%** / **100%** / **88%** (section 2) |

**Checked on the review page** (desktop 1440 and phone 390): 7 real stryker.com rows, plus a demo of each
choice those rows don't use (marked on the page).

| What | Matches stryker.com |
|---|---|
| Number colour | **7 of 7** rows |
| Numbers per row and phone stacking | **7 of 7** |
| Text under the numbers (font, size, weight, colour) | **6 of 7** |
| Number size | **3 of 7** exact (Prophecy's three numbers, the fast facts, the About numbers on desktop); the other 4 move one step |

**What differs, by design:**

- Numbers between two steps take the nearest: Isolibrium 6 → medium (70px instead of 84px), CLOUT 6.5
  and Prophecy 7 → large (106px instead of 91px and 98px), iSuite 5.5 → medium (70px instead of 77px).
- Prophecy's *+ cases… and counting* text: 4 and 3.5 hundredths of the width take headline sizes XL and
  L (63px and 42px instead of 56px and 49px).
- The About page numbers are a fixed 70px on stryker.com; on the new site they grow with the screen like
  every number (70px on desktop, 39px on phones), and their images fill their column (stryker.com's row is
  narrower, with an indent, which is not carried over).
- The fast facts title takes the page's Heading 2 size (24.5px instead of 27px) and the Heading 2's grey
  rule (white on stryker.com).

---

## 7. To review (outliers)

| What | Rows | Example pages | Proposal |
|---|---|---|---|
| Dark gold number | 1 | | gold |
| Numbers next to images or a video | 22 on 7 pages | [Global power tools](https://www.stryker.com/us/en/c/2019/global-power-tools.html), [Save simply](https://www.stryker.com/us/en/sage/save-simply.html) | a Statistics block in a side-by-side section (section 10) |
| An indented, narrower image row (offset 1 of 12, 8 or 10 of 12 wide) | 4 | [About](https://www.stryker.com/us/en/about.html) | the full width |

---

## 8. What we did not carry over, and why

| Not carried over as a Statistics option | Where it goes instead |
|---|---|
| Ten number sizes | three steps (section 4.2) |
| Fonts, sizes and colours of the texts | the site-wide Text style |
| Row indents and narrower rows | the standard width |
| The count-up on or off | always on (it never was off on stryker.com), except numbers beside their text |
| The dark band behind fast facts | a section style (*dark, full-bleed*) |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One block for every number row, with five choices | Numbers between two sizes move one step |
| Every number keeps its exact colour | A row with mixed colours needs a colour word per number |
| Texts keep their stryker.com size and font through Text style | Numbers beside images or a video need a side-by-side section |

---

## 10. Decisions we need from the business

**To approve:**

1. The three number sizes and five colours (section 4).
2. *Number and text on one line* for the 2 fast facts rows, instead of a separate look.
3. An image cell for the 11 rows with images, instead of moving them to Cards.
4. Removing the review-only gate (section *Review status*).

**Open (from the analysis):**

- The 22 numbers next to images or a video (and the Section layout chapter's 24 number-counter rows,
  which are these rows and the 2 fast facts): a Statistics block in a side-by-side section (proposal), or
  keep the number as large text without the count-up?

---

## Glossary

| Term | Meaning |
|---|---|
| Statistics block | a row of big numbers, each with a text under it |
| Number counter | the stryker.com component that counts a number up when it comes into view |
| Colour word | gold, navy, purple or teal in a row's first cell: that number's own colour |
| Fast facts | a title with number + statement pairs on a dark band |
| Side-by-side section | a section that places a block next to other content (`flex`) |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which block

The Block options panel reads the selected block and shows only the choices that fit it; a
choice that would do nothing is not shown.
Hovering a choice shows what it does.

| Needs | Choices |
|---|---|
| 2 or more numbers | Numbers per row: Two |
| 4 or more numbers | Numbers per row: Four |
| 6 or more numbers | Numbers per row: Six |
| Text | Number and text on one line |

## Review status (draft pages only)

While the standardisation is reviewed, the new Statistics rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: the number colours and sizes, the numbers per row
from 600px wide, left alignment by default, the image cell, the small lines above a number, fast facts
and the count-up for every number. stryker.com pages imported today render exactly as before (checked on
Prophecy, Isolibrium, CLOUT and Infinity, at both widths); patients pages are not touched.

The migration works the same way: number counters become Statistics blocks (with their colour, size,
alignment and the texts' Text style) only in a review build used for the draft pages. A normal re-import
of a real page gives exactly the same output as before (compared file by file on nine pages with
counters). Today's migration writes the counters as bold text (the number) and a paragraph (its text).
