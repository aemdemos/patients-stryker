---
title: "Same look, fewer choices"
subtitle: "How the stryker.com blocks were standardised for the new site, and how close values were grouped into named choices"
date: "November 24, 2026"
---

# About this guide

This guide is for the business, content and design teams. It explains, without technical terms,
how we turned the many free settings of www.stryker.com into a short list of named choices on the
new site, and how we decided which values belong together. The **Columns** block (rows of two, three
or four cells side by side) is used as the worked example throughout; every other block follows the
same method.

> In one sentence: we measured what every page of stryker.com really shows, grouped the values that
> look the same to a visitor, gave each group one plain name, and checked how close every page stays.

# 1. Why we standardised

On stryker.com, authors could type **any** number or colour into a component: the spacing inside a
box in percent, a colour code, a font size, the position of a headline. Over the years this produced
hundreds of slightly different values for what is really the same design.

| What authors could set freely | Different values on stryker.com today | Named choices on the new site |
|---|---|---|
| Spacing inside a box, top | **31** values | **4** steps: none, small, medium, large |
| Spacing inside a box, bottom | **44** values | the same **4** steps |
| Font size | **49** values | normal + **6** text sizes, **4** headline sizes |
| Font | **9** ways of writing it | **3** fonts: Futura, Egyptienne, Humanist |
| Text colour | **27** values | **8** brand colours + **4** more Stryker colours (black, mid grey, dark gold, pale grey) |
| Box / background colour | **25** values | **10** named colours |
| Image border colour | **12** values | **3**: grey, teal, black |
| Column widths | **5** patterns | **5** layouts |

*Measured on the 2,340 live pages of the migration list.*

Most of these differences are invisible to a visitor: a box with 4% spacing and one with 5% look
the same. But every distinct value has to be built, tested and maintained, and every new page
drifts a little further from the others. Copying them all would make the new site harder to author,
slower to migrate and more expensive to run.

# 2. How we did it: five steps

| Step | What we did |
|---|---|
| **1. Measure** | We opened **every page** of stryker.com on a desktop and on a phone, with tabs and accordions opened, and recorded what is really **shown**: every spacing, size, colour and width, and how often each one is used. We also read the content export, to know what authors set. |
| **2. Group** | We put together the values that look the same, or almost the same, to a visitor (the next section explains exactly how). |
| **3. Name** | Each group gets **one choice with a plain name**: *Medium spacing*, *Gold box*, *Last cell*. The value of each choice is the **most common value on stryker.com** in its group, so most pages do not move at all. |
| **4. Check** | We measured how far every page moves with the named choices, and listed by address the pages that move more, for review. |
| **5. Deliver** | The choices appear in the editor's **Block options panel**, with a live preview; the migration writes them automatically for every page. |

Four principles guided every decision:

1. **Evidence, not taste.** Every choice comes from what stryker.com uses most. The live site is the source.
2. **Keep the look.** We measure how close each page stays and list the pages that move more.
3. **Fewer, named choices.** Authors pick words, not numbers or codes.
4. **One vocabulary.** A colour has the same name in every block: *Gold* is the same gold in a banner, a box, a column or a card.

# 3. How close values were grouped

This is the heart of the method. For each kind of setting we looked at all the values in use,
counted how often each appears, and placed a small number of **steps** where the values naturally
gather. Every value then joins the **nearest step**, as long as the difference is too small to see.

## 3.1 Spacing: steps of none, 3%, 5% and 10%

Spacing inside a box is written in percent of the box width. Here is what the Columns block uses
today for the space above the text in a box (483 boxes):

| Spacing today | Boxes | Joins the step |
|---|---|---|
| 5% | 104 | **Medium (5%)** |
| 3% | 101 | **Small (3%)** |
| 2% | 62 | **Small (3%)**, 1 point away |
| 0% | 43 | **None** |
| 15% | 25 | more than 2 points from any step: listed for review (proposal: **Large**) |
| 20% | 22 | listed for review (proposal: **Large**) |
| 17 other values | the rest | the nearest step when within 2 points, otherwise listed |

**The rule:** a value joins a step when it is **within 2 points** of it: 2% becomes 3%, 4% becomes
5%, 7% becomes 5%, 8% and 12% become 10%. At the sizes used on the site, a 2-point difference is a
few pixels, which a visitor does not notice. The four steps were placed where the values already
gather: 5%, 3% and 0% are three of the four most used values on their own, and 10% collects the
larger ones.

**The result for Columns:** 89% to 100% of boxes keep their spacing, depending on the side.

**Spacing around a box** (outer margins) is different: stryker.com uses large and sometimes negative
values that pull a box over the content above it. Here there is **no setting** at all on the new
site; every block keeps one standard gap. 77% to 96% of boxes are within 2 points of that gap; the
others, such as 49 column rows indented by 20%, are listed for review.

## 3.2 Font sizes: multiples of the text around them

Font sizes on stryker.com are mostly written as a multiple of the normal text: 1.25 times, 1.5
times, and so on. In Columns, the most used sizes are:

| Size today | Uses in Columns | Choice |
|---|---|---|
| 1.25 × normal | 4,580 | **Large (1.25×)** |
| 1.5 × | 1,432 | **X-large (1.5×)** |
| 1.75 × | 489 | **XX-large (1.75×)** |
| 2 × | 430 | **2×** |

**The rule:** a size joins a step when it is **within about 10%** of it (1.3× becomes 1.25×).
The steps are 0.8×, 1.25×, 1.5×, 1.75×, 2× and **2.5×**: 2.5× is kept because stryker.com uses it
753 times (more than plain 1×), mostly for big figures in boxes. Larger sizes are not used as text
sizes and take the nearest step.

**Large headlines** grow with the width of the screen on stryker.com, in **17 different sizes**
(from 1% to 9% of the width). They are grouped the same way, into **4 headline sizes**:

| Headline size today (% of the width) | Uses | Joins |
|---|---|---|
| 1 and 1.5 | 862 | **S (1.5)** |
| 2 | 787 | **M (2)** |
| 2.5, 3 and 3.5 | 1,245 | **L (3)** |
| 4 to 9 | 690 | **XL (4.5)** |

Each size joins the nearest step, by proportion. Of the sets of four we compared, this one keeps
the most headlines: **73%** are within 12.5% of their step and **96%** within a quarter of a step.

**The result:** 97% of the text sizes in Columns stay the same.

## 3.3 Colours: the exact brand colours, no blending

Colours are **not** grouped by closeness. A brand colour is either right or wrong, so the new site
uses the **exact** stryker.com values. What we did group is the **same colour written in different
ways**: stryker.com writes its gold as `#ffb500` in some places and as `rgb(255,181,0)` in others,
which a visitor cannot tell apart.

| Box colours | Count |
|---|---|
| Written values on stryker.com | 27 |
| Real colours once duplicates are merged | 14 |
| Named colours on the new site | **10**: white with shadow, light grey, gold, blue, purple, teal, dark grey, and three gradients |

For **text**, the 8 brand colours (blue, gold, purple, teal, navy, grey, white, light grey) are
joined by four more Stryker colours that authors use and that stryker.com's own components use
too: **black** (1,678 uses; the components' *text-black* option), **mid grey** #b2b4ae (132; image
borders and rules), **dark gold** #af6d04 (71; the start of the gold gradient, chart colours) and
**pale grey** #dfe1de (51; the accordion background). A charcoal (#323232, 93 uses) appears only as
a code typed by authors, not in any component, so it is not a choice; its uses are listed for review.

The few rare box colours that remain (an orange, a pale grey, a lighter grey and a mid grey) are
listed by page for the business to decide; nothing is blended silently.

**The result:** 98% to 100% of boxes keep their exact colour.

## 3.4 Column widths: the five patterns already in use

stryker.com builds rows on a grid of twelve columns, so its column widths come in a few fixed
patterns. All 2,419 column rows use one of five: **two equal**, **narrow + wide**, **wide + narrow**,
**three equal** and **four equal**. These become the five layouts, unchanged (**100%** kept). Three
less common widths that real pages use (three quarters + quarter, its mirror, and icon + text) are
kept as extra layouts.

## 3.5 What "kept" means

Throughout this guide, **kept** is the share of uses whose look stays the same or almost the same:

- spacing within 2 points of a step,
- a font size within about 10% of a size step,
- a colour that is one of the named colours.

# 4. Where each setting lives

Not every setting belongs in the same place. We used four layers, so each choice is made once, in
the most natural spot:

| Layer | For | Example | Who chooses |
|---|---|---|---|
| **1. Layout** | the structure of a block | Columns *two equal* or *narrow + wide* | the author, when adding the block |
| **2. Block options** | how a block looks | box colour, which cell, spacing, border, alignment, the row's *Text look* | the author, in the **Block options panel** |
| **3. Section styles** | the background and arrangement of a whole section | a grey band behind several rows | the author, in the section settings |
| **4. Text style** | a few words inside a text | a gold name, one serif sentence, a box around one line | the author, with the **Text style panel** |

**A simple rule for authors:** if it changes the **whole row**, it is in Block options; if it
changes **a few words**, it is in Text style. For example, "large headline type" for a whole row is
one click in Block options, while making one name gold is done in Text style. Both use the same
sizes and colours, so they always match.

# 5. What authors see

Authors select a block and open the **Block options panel**. It shows the block's choices grouped by
topic (Layout, Cell box, Which cell, Spacing, Image border, Text look, Row looks), with a **live
preview** of the block.

The panel also reads the selected block and **greys out the choices that would do nothing** for it.
Hovering a greyed choice says why: *"needs images in the row"*, *"needs 3 cells (this row has 2
cells)"*, *"pick a Cell box first"*. So an author never picks an option that has no effect, and
learns what each option is for. A choice the block already has always stays available, so it can be
removed.

![The Block options panel for a two-cell text row: three- and four-cell layouts, image borders and the image and caption looks are greyed out](img/block-options-greyed.jpg){height=15cm}

# 6. How close the new site stays

| Setting | With the named choices | Kept |
|---|---|---|
| Box colours (all blocks) | 10 colours | **98%** |
| Spacing inside boxes and cells | 4 steps | **96% to 99%** |
| Font sizes | 6 text + 4 headline sizes | **96%** |
| Fonts | 3 fonts | **99%** |
| Image borders | 3 colours | **95%** |
| Column layouts | 5 layouts | **100%** |
| Phone behaviour of columns | as today (every row stacks in order) | **100%** |

The pages that move more are listed by address in the block chapters, so the business can review
them one by one. The largest group is outer spacing (margins), which becomes one standard gap.

**How we check it:** for each block we build a review page with a real stryker.com row for every
layout and choice, next to a link to its source page. A comparison measures every piece of text in
those rows (font, size, weight, colour, background) on both sites and lists the differences, so each
one is either fixed or explained.

# 7. Columns: what changed in practice

| Before | After |
|---|---|
| Any column ratio, set by component type | **5 layouts** (+ 3 extra widths real pages use) |
| Any box colour in any cell, written as a code | **Cell box**: 10 named colours, and **Which cell**: first, last or every cell |
| Any spacing in percent, per side | **Text spacing in a box**: none, small, medium, large |
| Any image border colour | **Image border**: grey, teal or black |
| Fonts and sizes typed per paragraph | **Text look** for the whole row, **Text style** for a few words |
| Rows of tiles built as columns | moved to the **Cards** block, which is made for tiles |
| Product page intros built as columns | to the **Hero** block's page intro layout |

# 8. Safe by design

- **Nothing on the live site changes while this is reviewed.** The new looks show only on review
  (draft) pages; every other page renders exactly as before. We check this by comparing real pages
  element by element.
- **The migration keeps today's output** until the business approves; the new choices are written
  only for the review pages.
- **Every change is recorded**: each block has its own chapter with the numbers, the choices and the
  pages that move more.

# 9. Decisions for the business

**To approve:**

1. The named choices per block (sections 3 and 7) and the pages listed to move more.
2. **Text look** in Block options: whole-row text looks (large headline, serif lead, serif captions,
   pull quotes) are one choice per row, instead of styling every paragraph. This departs slightly
   from the rule "fonts and sizes are never block options", for row-wide looks only.
3. Rows of tiles move to Cards; product page intros move to the Hero page intro.

**Proposed, still open:** the first-line bars of Columns (a gold, dark grey or blue bar on a cell's
first line) become Text style line boxes, and the light grey ones become a light grey cell box,
since on stryker.com that grey box wraps the whole cell.

# Glossary

| Term | Meaning |
|---|---|
| Block | a reusable part of a page: Columns, Cards, Hero, Panel… |
| Layout (variant) | a block's structure, such as Columns *two equal* |
| Block option | a named choice for how a block looks, picked in the Block options panel |
| Section style | the background or arrangement of a whole section of a page |
| Text style | colour, font or size of a few words, set with the Text style panel |
| Step | one of the few values a setting can take, such as *Medium (5%)* |
| Kept | the share of uses whose look stays the same or almost the same |
| Review (draft) page | a page that shows every layout and choice of a block with real stryker.com rows |
