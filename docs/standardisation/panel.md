# Panel: one box, ten colours

*A walkthrough of the Panel block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 1,033 boxes shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a text could be put in a box freely: any background colour, written as any colour code, a "dimensional box" shadow on or off, any inner spacing in percent per side, any outer spacing, and a gradient in any direction. |
| **The risk** | Copying every value means 27 written colours and dozens of spacing values for what is mostly the same handful of boxes. |
| **What we did** | We counted every box on the live site, kept the ten colours it really uses (the same names as every other block), and turned the free settings into a few named choices in the **Block options panel**: colour, gradient direction, inner spacing, a soft shadow and centred text. |
| **The result** | Boxes look the same or almost the same as today: 99% keep their exact colour. The box sets its text colour (white on the dark colours); coloured, sized or serif words inside use the site-wide **Text style**, with the same small set of sizes and brand colours as Columns. On the review page every box keeps its exact stryker.com background and shadow. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a box, how many different values stryker.com uses today, and the named choices on
the new site. *Kept* is the share of instances whose look stays the same or almost the same: spacing within
2 points of a step (4% becomes 5%), a font size within about 10% of a size step, a colour that is one of
the named colours.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **20** | 770 | 4 | **99%** | 4 (406), 5 (107), 3 (95), 2 (45) |
| Inner spacing, bottom | **31** | 700 | 4 | **99%** | 3 (429), 2 (82), 5 (47), 4 (30) |
| Inner spacing, left | **12** | 703 | 4 | **100%** | 2 (396), 5 (114), 3 (64), 8 (31) |
| Inner spacing, right | **10** | 277 | 4 | **99%** | 5 (102), 3 (52), 8 (29), 7 (25) |
| Outer spacing, top (margin %) | **23** | 159 | 0 (standard) | **77%** | 5 (23), 0 (20), 2 (16), 10 (13) |
| Outer spacing, bottom | **15** | 166 | 0 (standard) | **93%** | 5 (59), 3 (31), 2 (18), 15 (10) |
| Outer spacing, left | **15** | 100 | 0 (standard) | **94%** | 0 (43), 5 (14), 10 (10), 4 (9) |
| Outer spacing, right | **14** | 84 | 0 (standard) | **82%** | 0 (28), 5 (20), 4 (9), 10 (8) |
| Font size | **12** | 1,447 | 6 + 4 | **96%** | 1.5× (653), 1.25× (494), 1.75× (108), 2× (94) |
| Font | **4** | 1,313 | 3 | **100%** | Futura bold (986), Egyptienne (323) |
| Text colour | **12** | 837 | 11 | **99%** | gold (356), black (190), white (179), purple (51) |
| Box / background colour | **22** | 670 | 10 | **99%** | gold (411 + 77 written differently), light grey (33 + 26) |
| Text alignment | **4** | 863 | 2 | **100%** | left (742 + 29), centred (91), right (1) |

Two settings have a simple answer:

| Setting | Values today | Choices | Kept |
|---|---|---|---|
| Shadow (the "dimensional box") | on 287, off 746 | **Soft shadow** on / off | **100%** |
| Gradient direction (gradient boxes) | 4 directions on 70 boxes | left to right (default), right to left, bottom to top | **97%** |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Box colour, gradient direction, inner spacing, shadow, centred text | **Block options panel** (section 4) |
| Font size, font, text colour of words inside the box | the site-wide **text layer**: formatting and the **Text style panel**, the same choices in every block (section 5) |
| Text colour of the whole box | **no setting**: the box colour sets it (white on blue, teal, purple, dark grey and the blue and purple gradients; black on white, gold, light grey and the gold gradient) |
| Outer spacing (margins) | **no setting**: the block keeps its standard gap |

---

## 3. Where the boxes sit (decisions taken with the business)

Not every box on stryker.com becomes a Panel. Following the decisions taken with the business:

| Placement | Boxes | Now |
|---|---|---|
| Full width in the page | 167 | a **Panel** in the section |
| In a column next to other content | 809 | a **Panel** in a **side-by-side section** with that content, or the Columns **cell box** when it is a box in a column row (Columns walkthrough, section 5.1) |
| In a row of boxes (tiles) | 170 | **Cards** (text tiles) with the same colour names |
| In a shared fragment grid cell | 57 | as above, inside the fragment |

That leaves **863** Panel boxes. The colour counts below are for all 1,033 boxes measured, as the colour
names are the same in Panel, Cards and the Columns cell box.

---

## 4. The options (Block options panel)

### 4.1 Box colour (required)

The same colour names as Hero, Columns and Cards, so authors see one colour list everywhere.

| Choice | Option | Boxes | Source colours | Example pages |
|---|---|---|---|---|
| Gold | `box-gold` | 530 | gold 530 | [Governance](https://www.stryker.com/us/en/about/governance.html), [Ambulatory surgery centers](https://www.stryker.com/us/en/about/news/2023/features/delivering-a-more-efficient-experience-for-surgeons-and-patients-in-ambulatory-surgery-centers.html) |
| White | `box-white` | 248 | white 248 | [Donations](https://www.stryker.com/us/en/about/contact/donations.html), [Governance](https://www.stryker.com/us/en/about/governance.html) |
| Light grey | `box-gray` | 100 | light grey 99, grey 1 | [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility/overview.html), [Supplier inclusion](https://www.stryker.com/us/en/about/corporate-responsibility/responsible-supply-chains/supplier-inclusion.html) |
| Gold gradient | `box-gold-gradient` | 41 | golden gradient 38, dark orange gradient 3 | [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html), [Bari 10A](https://www.stryker.com/us/en/acute-care/products/bari-10a.html) |
| Blue | `box-blue` | 33 | blue 33 | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility/overview.html) |
| Blue gradient | `box-blue-gradient` | 21 | dark blue gradient 20, dark teal gradient 1 | [Magnet trade show](https://www.stryker.com/us/en/acute-care/c/magnet-trade-show.html), [Sternal plate](https://www.stryker.com/us/en/craniomaxillofacial/products/sternalplate.html) |
| Teal | `box-teal` | 18 | teal 18 | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility/overview.html) |
| Purple | `box-purple` | 17 | purple 17 | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility/overview.html) |
| Dark grey | `box-dark` | 11 | dark grey 11 | [Annual review 2024](https://www.stryker.com/us/en/about/annual-review/2024.html), [Annual review 2025](https://www.stryker.com/us/en/about/annual-review/2025.html) |
| Purple gradient | `box-purple-gradient` | 8 | dark purple gradient 8 | [Emergency Care](https://www.stryker.com/us/en/emergency-care.html), [LIFEPAK 35](https://www.stryker.com/us/en/emergency-care/products/lifepak-35.html) |

The colours are the exact stryker.com values: gold #ffb500, white, light grey #edeeec, blue #1c5687,
teal #4c7d7a, purple #85458a, dark grey #545857; the gold gradient runs from dark gold #af6d04 into gold
over the first fifth of the box, the blue gradient from dark grey into slate #425361, the purple gradient
from dark grey into plum #594b61. Imported pages that carry the older names keep working and the panel
shows them as the new choice: `left` = *White* with *Soft shadow*, `gold` = *Gold*, `gray` = *Light grey*,
`gold-gradient` = *Gold gradient*.

### 4.2 Gradient direction (gradient boxes only)

| Choice | Option | Boxes on stryker.com |
|---|---|---|
| Left to right (default: the darker end on the left) | none | 27 |
| Right to left | `gradient-reverse` | 22 |
| Bottom to top | `gradient-up` | 19 |

The 2 diagonal gradient boxes take the default direction (section 7).

### 4.3 Inner spacing

| Choice | Option | Source values it covers |
|---|---|---|
| None | `space-none` | 0% |
| Small (3%) | `space-s` | around 3%, and boxes with no spacing set (the rich text's own 10px) |
| Medium (5%, default) | none | around 5% |
| Large (10%) | `space-l` | 10% and more |

One step for the whole box: a source box takes the step nearest the middle value of its four sides. 99% of
top, 99% of bottom, 100% of left and 99% of right spacing values stay within 2 points (section 2).

### 4.4 Soft shadow

| Choice | Option | Boxes on stryker.com |
|---|---|---|
| Soft shadow (the stryker.com "dimensional box": a soft shadow 10px around the box) | `shadow` | 287 |

### 4.5 Centred text

| Choice | Option | Boxes on stryker.com |
|---|---|---|
| Centred | `text-center` | 156 |

Left is the default (876 boxes); the 1 right-aligned box becomes left (section 7).

---

## 5. Text inside the box (Text style, not Block options)

Colour, size and font of **a few words** are set with the site-wide **Text style panel**, the same in
every block: the panel wraps the words in a pair of markers written in the text, for example
`:start-xl:Did you know?:end:`. On the page the markers disappear and the words take the look. For
Panel there is no *Text look* group: everything inside the box is Text style.

Only the limited sets agreed for Columns are offered; every stryker.com value joins the nearest one:

| Setting | Choices |
|---|---|
| Text size | normal, 0.8×, 1.25×, 1.5×, 1.75×, 2×, 2.5× (relative to the text it sits in, so a 1.5× heading is 1.5 times the heading size) |
| Headline size (grows with the screen) | S 1.5, M 2, L 3, XL 4.5 (% of the width) |
| Font | body, serif (Egyptienne), sans (Futura bold) |
| Text colour | 11: blue, gold, purple, teal, grey, white, light grey, black, mid grey, dark gold, pale grey |

**The box colour sets the text colour.** On blue, teal, purple, dark grey and the blue and purple
gradients the text is white, as stryker.com's boxes set it (179 white text uses in boxes); on white,
gold, light grey and the gold gradient it is black. So authors don't mark the whole text white, and a
gold label (Bold + Italic) inside a dark box stays gold, as on stryker.com. The migration drops a white
colour marker that only repeats the box's own colour.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Box colour | 22 written values (14 distinct colours) | 10 named colours | **99%** keep their exact colour; the rest are listed in section 7 |
| Shadow | on / off | on / off | **100%** |
| Gradient direction | 4 directions | 3 | **97%** |
| Inner spacing | 10–31 values per side | 4 steps | **99%** top, **99%** bottom, **100%** left, **99%** right |
| Outer spacing | 14–23 values per side | the block's standard gap | **77%** top, **93%** bottom, **94%** left, **82%** right |
| Font size, font, text colour | 12 / 4 / 12 values | the text layer | **96%** / **100%** / **99%** |
| Text alignment | 4 values | left, centred | **100%** |

**Checked on the review page.** The Panel review page holds a real stryker.com box for every choice
(19 sections). A comparison measured each box on both sites at desktop and phone width (background,
gradient, shadow, spacing) and every piece of text in it (font, size, weight, colour). See the *Review
status* section for the result.

**What moves more:** the outer spacing on top (77% kept): 46 boxes have a negative top margin that pulls
the box up over the content above it (section 7). Inner spacing moves slightly where a box used different
values per side (for example 4% top, 3% bottom, 2% left becomes 3% all round).

---

## 7. To review (outliers)

These boxes don't fit a choice exactly. They take the nearest choice unless the business decides otherwise.

| What | Boxes | Example pages | Proposal |
|---|---|---|---|
| Orange box (#af6d04) | 6 | [Giving back](https://www.stryker.com/us/en/about/corporate-responsibility/giving-back.html), [These nurses share…](https://www.stryker.com/us/en/about/news/2022/features/these-nurses-share-how-they-re-turning-experience-into-innovatio.html) | gold |
| Dark orange gradient | 3 | [Atlas IDE study](https://www.stryker.com/us/en/neurovascular/c/driven-by-evidence/atlas-ide-study.html), [Interventional spine education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/ivs/interventional-spine-education.html) | gold gradient |
| Grey box | 1 | [Target registry](https://www.stryker.com/us/en/neurovascular/c/driven-by-evidence/target-registry.html) | light grey |
| Dark teal gradient | 1 | [Interventional spine education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/ivs/interventional-spine-education.html) | blue gradient |
| Negative top margin (the box overlaps the content above it) | 46 | [CLOUT](https://www.stryker.com/us/en/peripheral-vascular/clinical/clout.html), [Advanced digital healthcare](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/advanced-digital-healthcare.html) | drop the overlap, or add one `overlap` option if the look must stay |
| Top spacing far from the scale (20%: 9, 15%: 6, and a few others) | 18 | [Urine management](https://www.stryker.com/us/en/sage/urine-management.html), [Interventional spine education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/ivs/interventional-spine-education.html) | nearest step (*Large*) |
| Bottom spacing far from the scale (15%: 3, 13%: 3, and a few others) | 15 | [Fluoro-free](https://www.stryker.com/us/en/joint-replacement/c/fluoro-free.html), [Mako Spine](https://www.stryker.com/us/en/joint-replacement/systems/mako-spine.html) | nearest step (*Large*) |
| Diagonal gradient | 2 | [Atlas IDE study](https://www.stryker.com/us/en/neurovascular/c/driven-by-evidence/atlas-ide-study.html) | left to right |
| Right-aligned text | 1 | | left |
| A link styled as a gold call to action inside a box ("REQUEST A DEMO ▸" on ThermaClear) | | [ThermaClear](https://www.stryker.com/us/en/endoscopy/products/thermaclear.html) | a button link, per the authoring conventions (to align with the Buttons work) |

---

## 8. What we did not carry over, and why

| Not carried over as a Panel option | Where it goes instead |
|---|---|
| Font size, font and text colour of words inside the box | the site-wide **text layer** (formatting and the Text style panel, section 5) |
| The text colour of the whole box | the box colour sets it (section 2) |
| Outer spacing (margins) around a box | **no setting**: the block's standard gap (section 6) |
| Different inner spacing per side | one spacing step for the whole box (section 4.3) |
| A box beside other content | a **side-by-side section** with the content and the Panel (no blocks inside blocks) |
| Rows of boxes | **Cards** (text tiles) with the same colours |
| Sizes and colours outside the limited sets | the nearest step or Stryker colour; none added to match a single page |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Ten colour names, the same in Panel, Columns, Cards and Hero, instead of 27 written values | Boxes that overlapped the content above them (negative margins) no longer overlap unless the business asks for an option |
| The text colour follows the box: no white-text markup on every dark box | Boxes with different spacing per side get one step all round |
| Imported pages keep working: the old names are read as the new ones | Rows of boxes change block (to Cards), which authors need to know |
| The panel shows the gradient direction only for a gradient box | |

---

## 10. Decisions we need from the business

**To approve:**

1. The ten box colours and the outliers' nearest colours (section 7).
2. One inner spacing step per box (none, 3%, 5%, 10%) instead of four sides.
3. The box sets the text colour (white on the dark colours).
4. Removing the review-only gate (section *Review status*), so real pages get the new rendering and the
   migration writes the new Panel choices for every page.

**Open points from the analysis:**

- The gold bars of the shared *Connect with us* contact header (232 boxes, through a fragment): keep them
  as a gold Panel, or make them headings in a gold section?
- Boxes in column cells (809): a side-by-side section of Panels, or the Columns cell box. The Columns
  walkthrough already uses the cell box for rows with a box in one cell; please confirm the rule for the
  rest.
- The free inner and outer spacing of every rich text (2,782 texts): OK for the Panel to set a fixed
  spacing?
- The patients site's Panel looks (`gold`, `gray`, `blue`, `dark`) keep their names there; on
  stryker.com they read as the new `box-*` choices.
- Negative top margins (46 boxes): drop the overlap, or add one `overlap` option?

---

## Glossary

| Term | Meaning |
|---|---|
| Box, Panel | a text with a coloured background and/or a soft shadow, the full width of its place |
| Dimensional box | stryker.com's name for a white box with a soft shadow |
| Gradient box | a box whose colour runs from one shade to another (gold, blue, purple) |
| Inner spacing | the space between the box's edge and its text, a share of the box width |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text layer, Text style | fonts, sizes and coloured words, set with formatting and the Text style panel, the same on every block |
| Text style marker | the pair `:start-…:` / `:end:` the Text style panel writes around a few words; hidden on the page |
| Side-by-side section | a section that places a block next to other content (`flex`) |
| Cards | the block for rows of the same unit (tiles, boxes) |

## Which choices fit which box

The Block options panel reads the selected Panel and shows only the choices that fit it; a
choice that would do nothing is not shown.
Hovering a choice shows what it does.

| Needs | Choices |
|---|---|
| A gradient box colour chosen first (gold, blue or purple gradient) | Gradient direction (the whole group) |
| Text in the box | Centred text |
| Nothing | Box colour, Inner spacing, Soft shadow |

## Review status (draft pages only)

While the standardisation is reviewed, the new Panel rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: the ten box colours, the gradient directions, the
spacing steps, the shadow and centred text, and the text in the box at the page's own sizes with Text
style markers. stryker.com pages imported today use the older Panel names (`left`, `gold`,
`gold-gradient`, `gray`, 17 pages) and render exactly as before; patients pages are not touched.

The migration works the same way: the new Panel choices and the Text style markers in the box are
written only by a review build used for the draft pages. A normal re-import of a real page gives exactly
the same output as before (compared file by file on five pages with boxes: Arise 1000 EX, Mako Total
Hip, Shoulder Talks, Insignia, Global quality), and the Panels on the pages imported today render
exactly as before (checked element by element on five pages).

**Result of the check (desktop 1440 and phone 390):**

| What | Matches stryker.com |
|---|---|
| Box background, gradient and shadow | **19 of 19** boxes, at both widths |
| Text colour, font and size (each line measured) | **25 of 27** lines on desktop, **24 of 27** on phones |

The lines that differ, all by design or listed for review:

- *TEACH Talks: Course overview*: two size spans on top of each other on stryker.com make it 2.625
  times the text (36.75px); it takes the nearest size, 2.5 times (35px).
- *REQUEST A DEMO ▸* on ThermaClear: a gold call to action written as a link inside the box (section 7).
- On phones, a Heading 4 is 17.5px on the new site and 14px on stryker.com below 480px wide (all blocks,
  not only Panel: to look at with the headings of the whole site).

Two more small differences, not counted above: a serif heading is drawn with the serif's regular weight
(400) where stryker.com asks for 500 (the font has one weight, so they look the same), and the one
right-aligned line (the name under a quote on Supplier inclusion) is left-aligned (section 7).

Two corrections made by hand on the review page, both open points for the migration: the heading size
of a box that stryker.com loads from a shared fragment (*Did you know?* on Sage AirTAP, 2 times the
heading) is not in the fragment copy the migration reads, and the same fragment copy has no inner
spacing (ThermaClear's 5%).
