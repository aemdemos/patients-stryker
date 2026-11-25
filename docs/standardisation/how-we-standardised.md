---
title: "stryker.com standardisation: values before and after"
subtitle: "Every free setting of stryker.com, the named choices that replace it, and how close the new site stays"
date: "November 24, 2026"
---

# 1. Key numbers

| | stryker.com today | New site |
|---|---|---|
| Inner spacing values (padding, per side) | **15 to 44** | **4** steps |
| Outer spacing values (margin, per side) | **18 to 35** | **0**: one standard gap |
| Font sizes | **49** | **11**: normal, 6 text sizes, 4 headline sizes |
| Fonts | **9** ways of writing them | **3** |
| Text colours | **27** | **11** |
| Box and background colours | **25** | **10** |
| Image border colours | **12** | **3** |
| Section style names | **255** | **35** author choices (in Block options → Section) + 12 template looks |
| Block variants | **70** | **49** |
| Uses that keep their look | | **95% to 100%** for spacing inside boxes, sizes, fonts and colours; **77% to 96%** for outer spacing |
| Real pages changed during review | | **0** (checked element by element) |

*Source: every page of stryker.com measured on desktop (1,440px) and phone (390px), tabs and
accordions opened: 2,340 live pages. Only what the live site shows is counted.*

# 2. Every free setting: values before and after

| Setting | Values on stryker.com | Uses | Choices on the new site | Fewer values | Kept |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | 31 | 1,885 | 4 steps | −87% | 96% |
| Inner spacing, bottom | 44 | 1,620 | 4 steps | −91% | 98% |
| Inner spacing, left | 18 | 1,470 | 4 steps | −78% | 99% |
| Inner spacing, right | 15 | 959 | 4 steps | −73% | 99% |
| Outer spacing, top (margin %) | 35 | 813 | none (standard gap) | −100% | 77% |
| Outer spacing, bottom | 23 | 613 | none (standard gap) | −100% | 96% |
| Outer spacing, left | 18 | 323 | none (standard gap) | −100% | 80% |
| Outer spacing, right | 19 | 216 | none (standard gap) | −100% | 87% |
| Font size | 49 | 16,907 | 11 (normal + 6 text + 4 headline) | −78% | 96% |
| Headline size (grows with the screen) | 17 | 3,584 | 4 (S, M, L, XL) | −76% | 96% within a quarter step |
| Font | 9 | 11,648 | 3 | −67% | 99% |
| Text colour | 27 | 5,867 | 11 | −59% | 97% |
| Box / background colour | 25 | 959 | 10 | −60% | 98% |
| Image border colour | 12 | 415 | 3 | −75% | 95% |
| Video border colour | 5 | 875 | 1 (black) | −80% | 99% |
| Text alignment | 4 | 9,171 | 2 (left, centred) | −50% | 100% |
| Banner headline position (Hero) | 189 | 478 banners | 12 (3 columns × 4 heights) | −94% | 93% within 10% |
| Column widths (Columns) | 5 + the news articles' 3/4 + 1/4 | 2,419 rows + 8 news rows | 6 layouts | 0% | 100% |
| Statistic number size | 10 | 70 numbers | 3 | −70% | each joins the nearest of the 3 |
| Carousel speed | 6 | 17 carousels | 1 (5 seconds) | −83% | by design |
| News list length | 5 | 13 lists | 1 (20 articles) | −80% | by design |

**Kept** = the share of uses that look the same or almost the same with the new choices (rules in
section 4).

# 3. The new choices

| Setting | Choices | Where authors set it |
|---|---|---|
| Inner spacing | none, small (3%), medium (5%, default), large (10%) | Block options |
| Outer spacing | no setting: each block has one standard gap | — |
| Text size | normal, 0.8×, 1.25×, 1.5×, 1.75×, 2×, 2.5× | Text style |
| Headline size | S (1.5), M (2), L (3), XL (4.5), in % of the screen width | Text style |
| Font | body (Humanist), serif (Egyptienne), sans (Futura bold) | Text style |
| Text colour | gold, white, blue, purple, teal, grey, light grey (brand colours), black, mid grey #b2b4ae, dark gold #af6d04, pale grey #dfe1de | Text style |
| Box around one line | gold, blue, purple, teal, dark grey, dark purple gradient | Text style |
| Box colour | white, light grey, gold, blue, purple, teal, dark grey, gold gradient, blue gradient, purple gradient | Block options |
| Image border | grey, teal, black | Block options |
| Text alignment | left (default), centred | Block options |

Every colour is the exact stryker.com value: no colour was blended or approximated.

**Not offered in Text style, because no stryker.com text uses it** (content export, 50,437 styled runs
of text): capitals (0 runs), navy (0 runs; still a box and number colour), spacing around words
(padding and margin belong to the box: Block options, or the block's standard gap), and boxes around a
line in white, light grey or dark blue gradient (those are cell and card box colours).

**Special looks fit only some text.** The gold rule goes under a **heading**; a line box goes around a
**whole line**. The Text style panel greys out a look that doesn't fit the selected words and says why on
hover ("it goes under a heading", "select the whole line"), as Block options do for blocks.

# 4. How values were grouped

| Setting | Rule | Example |
|---|---|---|
| Spacing inside a box | joins the nearest step when within **2 points** | 2% → 3%, 4% → 5%, 8% → 10% |
| Spacing around a box | no setting; values within 2 points of 0 / 3 / 5 / 10% count as kept | a 20% left indent becomes the standard gap |
| Text size | joins the nearest step when within about **10%** | 1.3× → 1.25×, 3.5× → 2.5× |
| Headline size | joins the nearest step by proportion | 1% → S, 2.5% → L, 6% → XL |
| Colour | **exact values only**; the same colour written two ways counts once | `#ffb500` and `rgb(255,181,0)` are one gold |
| Anything else rare | the nearest choice, and the page is listed for review | an orange box → gold |

**The rule:** every value on stryker.com joins exactly one choice, so the new site never has more choices than stryker.com had values; where stryker.com had only one look, there is nothing to choose.

**Why these steps:** each step is the most used value of its group on stryker.com, so most pages don't
move at all. Example (Columns, space above the text in a box, 483 boxes): 5% (104) → medium, 3% (101) →
small, 2% (62) → small, 0% (43) → none, 15% and 20% (47) → listed for review, proposal large.

**How headline steps were chosen:** of the sets of four compared, S 1.5 / M 2 / L 3 / XL 4.5 keeps
the most headlines: 862 join S, 787 M, 1,245 L, 690 XL; 73% are within 12.5% of their step.

# 5. Block by block: values before and after

*Format: values on stryker.com → choices on the new site (kept). Spacing is listed as top / bottom /
left / right. Fonts, sizes and text colours are **one shared Text style set** for the whole site (49 →
11 sizes, 9 → 3 fonts, 27 → 11 colours): each value a block used joins one step, so a block uses at
most as many steps as it had values, never more.*

**Columns** (2,419 rows)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 23 / 15 / 11 / 10 values | 4 steps | 89 / 98 / 98 / 100% |
| Outer spacing | 27 / 17 / 7 / 8 values | standard gap | 82 / 97 / 61 / 98% |
| Font size | 39 | 11 (the shared set) | 97% |
| Font | 6 | 3 (the shared set) | 99% |
| Text colour | 22 | 11 (the shared set) | 98% |
| Box colour (cell boxes) | 9 colours on 242 rows | 9 + none | 100% |
| Image border colour | 9 | 3 | 96% |
| Text alignment | 4 | 2 | 99% |
| Column widths | 5 patterns + 3/4 + 1/4 in news articles (8 rows); 4 other widths on 10 rows from older imports | 6 layouts; the 4 other widths join the nearest | 99.6% |

**Cards** (2,548 cards)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 17 / 25 / 11 / 10 values | 4 steps | 96 / 96 / 99 / 99% |
| Outer spacing | 18 / 11 / 5 / 5 values | standard gap | 64 / 97 / 100 / 100% |
| Font size | 26 | 11 (the shared set) | 95% |
| Font | 7 | 3 (the shared set) | 99% |
| Text colour | 23 | 11 (the shared set) | 97% |
| Box colour | 19 | 7 + none | 95% |
| Image border colour | 10 | 3 | 95% |
| Text alignment | 3 | 2 | 100% |
| Cards per row | any | 2 to 6 | 100% |

**Panel** (863 boxes)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 20 / 31 / 12 / 10 values | 4 steps | 99 / 99 / 100 / 99% |
| Outer spacing | 23 / 15 / 15 / 14 values | standard gap | 77 / 93 / 94 / 82% |
| Font size | 12 | 11 (the shared set) | 96% |
| Font | 4 | 3 (the shared set) | 100% |
| Text colour | 12 | 11 (the shared set) | 99% |
| Box colour | 22 | 10 | 99% |
| Gradient direction | 4 | 3 | 97% |
| Text alignment | 4 | 2 | 100% |

**Hero** (1,248 heroes)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 11 / 9 / 9 / 8 values | 4 steps | 96 / 97 / 96 / 97% |
| Outer spacing | 12 / 9 / 9 / 11 values | standard gap | 95 / 99 / 91 / 32% |
| Font size | 30 | 11 (the shared set) | 87% |
| Font | 4 | 3 (the shared set) | 100% |
| Text colour | 19 | 11 (the shared set) | 97% |
| Box colour | 10 | 8 + none | 100% |
| Headline position | 189 | 12 | 93% within 10% |
| Text alignment | 4 | 2 | 99% |

**Accordion** (249)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing (top) | 2 values | none: standard spacing | 100% |
| Outer spacing | 4 / 2 values | standard gap | 70 / 100% |
| Font size | 9 | up to 9 of the shared 11 sizes | 100% |
| Font | 4 | 3 (the shared set) | 99% |
| Text colour | 11 | 11 (the shared set) | 97% |
| Box colour | 2 (pale grey 7, gold 4) | 1 switch: *Lists in a light grey box* | 36% exact (pale grey lists become light grey; gold lists listed) |
| Text alignment | 4 | 2 | 99% |

**Tabs** (198)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 4 / 5 / 4 / 4 values | none: standard spacing | 100% |
| Outer spacing (top) | 1 value | standard gap | 100% |
| Font size | 9 | up to 9 of the shared 11 sizes | 100% |
| Font | 2 | up to 2 of the shared 3 fonts | 100% |
| Text colour | 14 | 11 (the shared set) | 97% |
| Text alignment | 4 | 2 | 99% |

**Section layout** (side-by-side rows, 1,054)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 6 / 4 / 5 / 3 values | none: standard spacing | 88 / 100 / 92 / 100% |
| Outer spacing | 6 / 4 / 2 / 2 values | standard gap | 95 / 86 / 0 / 100% |
| Font size | 11 | 11 (the shared set) | 98% |
| Text colour | 8 | up to 8 of the shared 11 colours | 100% |
| Column widths | any | 4 section styles | 100% |

**Carousel** (30)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Font size | 14 | 11 (the shared set) | 82% |
| Font | 2 | up to 2 of the shared 3 fonts | 100% |
| Text colour | 8 | up to 8 of the shared 11 colours | 100% |
| Speed | 6 (2.5 to 10 seconds) | 1 (5 seconds) | by design |

**Statistics** (82)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Number colour | 6 | 5 | 99% (dark gold joins gold) |
| Number size | 10 | 3 (2.5–4 → small 11, 4.5–6 → medium 42, 6.5–9 → large 17) | nearest step |
| Label font size | 6 | up to 6 of the shared 11 sizes | 68% |
| Label colour | 9 | up to 9 of the shared 11 colours | 88% |
| Alignment | 2 | 2 | 100% |

**Video** (1,255)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Border colour | 5 | 1 (black) | 100% (grey frames become black) |
| Player | Dynamic Media, YouTube, 1 old file | from the link | 100% |
| Playback | autoplay + loop, loop, autoplay | 2 switches | 100% |

**Other blocks**

| Block | stryker.com | New site | Kept |
|---|---|---|---|
| Table (160) | header row 2 ways, width 3 values, phone layout 2, rows from Excel | header row or none, full width, rows-as-lines switch, sheet switch | 98 to 100% |
| Form (832) | 4 form types | Marketo form as it is (779); 3 types wait for Stryker (53) | 100% of Marketo forms |
| Widget (30) | 5 app types | 5 variants, embedded as they are | 100% |
| Chart (11) | 3 types, 3 heights, 3 number formats | 3 types, 1 height per type, values switch | 100% of what shows |
| Media gallery (17) | 3 gallery types | 2 (gallery, 360° spin) | 100% |
| News list (13) | 5 list lengths, dates on/off | 1 length (20), dates switch | by design |
| Local navigation (46) | line above on/off, line below (never shown) | 1 switch | 100% |
| Social share (5) | 2 icon colours, 2 alignments | 2 switches | 100% |
| Sticky navigation (181), Interactive image (5), Event calendar (3), Fragment (1,390) | 1 look | 1 look, nothing to choose | 100% |

# 6. Variants and properties per block

| Block | Variants on stryker.com | Variants now | Properties |
|---|---|---|---|
| Columns | 6 | 6 layouts: the 5 grid layouts + 3/4 + 1/4 of news articles (the division contact is the two equal layout with a map) | 45 |
| Panel | 1 | 1 | 19 |
| Cards | 12 | 8 card types | 27 |
| Hero | 9 | 5 layouts | 43 |
| Section layout | 4 | 4 section styles | 0 |
| Video | 3 | 1 | 3 |
| Statistics | 5 | 1 | 15 |
| Table | 3 | 1 | 4 |
| Accordion | 2 | 1 | 3 |
| Tabs | 1 | 1 | 0 |
| Carousel | 2 | 2 | 5 |
| Widget | 5 | 5 | 0 |
| Form | 4 | 1 (+ 3 waiting for Stryker) | 0 |
| Sticky navigation | 1 | 1 | 0 |
| Local navigation | 1 | 1 | 1 |
| Chart | 3 | 3 | 1 |
| Media gallery | 3 | 2 | 0 |
| Interactive image | 1 | 1 | 0 |
| News list | 1 | 1 | 1 |
| Event calendar | 1 | 1 | 0 |
| Social share | 1 | 1 | 2 |
| Fragment | 1 | 1 | 0 |
| **Total** | **70** | **49** | **169** |

*Properties* counts every named choice except the variant, including each group's default. Section layout's 4 variants and Carousel's 5 properties are section styles, so they are also part of the 35 section-style choices in section 9: don't add the two totals together.

**The properties, block by block**

| Block | Properties |
|---|---|
| Columns | cell box (9 colours or none); which cell (last, first, every); spacing (4 steps); image border (none, grey, teal, black); centred; first line (as written, light grey box, gold, dark grey or blue bar); text look (6 switches: large headline, serif lead, serif captions, pull quote in the last cell, large pull quote beside a photo, numbered quotes); row looks (12 switches: linked images, one per row on phones, related links, link groups, icon beside text, page title beside a photo, caption under the photo, images centred, photo two thirds on phones, rule under the first cell, line below the row, first cell right-aligned) |
| Panel | box colour (10); gradient direction (left to right, right to left, bottom to top); spacing (4 steps); soft shadow; centred |
| Cards | cards per row (2, 3, 4, 5, 6); image border (none + 3); card box (7 colours or none); spacing (4 steps); soft shadow, centred, title above the image, image only, card text in a box; no description (teasers) |
| Hero | image slide: headline box (8 colours or none), column (left, right, wide), height (top, upper, middle, lower), title colour and subline colour (as written, gold, white, light grey, blue), stripe (none, gold, gold gradient), framed, video background, phones (text over, below or above), black text on phones; tagline band colour (gold, purple gradient, gold gradient); page intro: no image, no grey rule, black title |
| Section layout | equal, wide + narrow, narrow + wide, side by side on phones (the variants) |
| Video | black border, autoplay (muted), loop |
| Statistics | number colour (gold, navy, purple, teal, white); number size (small, medium, large); numbers per row (1, 2, 3, 4, 6); centred; number and text on one line |
| Table | header row or none; rows as lines on phones; data from a sheet |
| Accordion | panels start open; line under each label; lists in a light grey box |
| Carousel | autoplay; fade; split slide band (purple gradient, blue gradient, dark grey) |
| Local navigation | no top line |
| Chart | values on the bars (not for pies) |
| News list | show dates |
| Social share | grey icons; right aligned |

The Block options panel greys out a property that doesn't fit the selected block (for example *Image
border* on a row without images) and says why on hover.

# 7. Comparison with stryker.com: the review pages

Each block has a review page (`/drafts/astha/blocks/<block>`) with real stryker.com content for every
variant and property, measured against the source page at 1,440px and 390px.

| Block | Matches stryker.com | Differences |
|---|---|---|
| Columns | 48 of 50 rows exact (text colour, size, font) | 2 rows: headline one step larger by design |
| Panel | 19 of 19 boxes (background, gradient, shadow); 25 of 27 text lines | 1 title 35px instead of 36.75px (nearest size); 1 call-to-action link |
| Cards | 28 of 33 rows (text); cards per row and phone stacking on every row | 3 rows move one size step; 1 bronze bar (colour not in the list); 1 demo |
| Hero | every box, band and gradient colour; page intro, tagline, large header, long text exact; 29 of 38 text lines | 8 headlines move to the nearest step; 1 title 49px instead of 42px (to fix in the migration) |
| Section layout | every column edge at desktop; stacking on phones | between 600 and 840px parts stand side by side (stryker.com stacks) |
| Video | 10 of 10 frames and playback; captions exact | width 1,380px instead of 1,410px |
| Statistics | number colours 7 of 7; rows 7 of 7; labels 6 of 7 | 4 number sizes move one step |
| Table | every table: font, stripes, cell spacing, widths | 3 narrower tables become full width |
| Accordion | labels, spacing (55px vs 56px), open and closed | — |
| Tabs | labels, widths, gold line | tab height 39px vs 40px |
| Carousel | slide size (480px), arrows, dots, colours, fonts | 2 headlines move one step; split slides 5 to 14px taller |
| Widget | explorers and calculators at the same heights (on stryker.com addresses) | on the preview site all apps show as links: Stryker's app server refuses other addresses |
| Form | fields, labels, inputs, Submit button | form heights within 35px |
| Sticky navigation | label positions, colours, jumps, phone menu | pinned bar stays 80px (stryker.com shrinks to 70px) |
| Local navigation | link positions within 3px; fonts, colours, line | phone layout from 600px (stryker.com 841px) |
| Chart | bar chart to the pixel; columns within 2px; colours exact | all column charts 200px high (1 is 400px on stryker.com) |
| Media gallery | thumbnails (56px, 66px apart), arrows | half-width column 675px vs 705px |
| Interactive image | rings on the letters, desktop and phone | rings stay 56px on phones |
| News list | tabs, count, rows, image, Load more to the pixel | no dates yet (not in the page index) |
| Event calendar | filters, month grid, event bars, list | empty until the events are in the page index |
| Social share | pixel-exact | — |
| Fragment | the 3 shared parts checked | older fragment imports need re-importing |

**Real pages:** 16 stryker.com pages and 5 patients pages compared element by element, desktop and
phone, against the site before this work: **no difference**. The new look shows only on review pages
until the business approves.

# 8. Where each setting lives

| Layer | Holds | Example |
|---|---|---|
| Variant | the structure of a block | Columns *two equal* |
| Block options | how a block looks | box colour, spacing, border, alignment |
| Section style | a whole section | side by side, tab panel, carousel slide, background, line above, centred text …: picked in **Block options → Section**, which copies the Style to paste into the section's Section Metadata (section 9) |
| Text style | a few words inside a text | a gold name, a serif sentence, a 2× size |

Rule for authors: the whole block → Block options; a few words → Text style.

# 9. Section styles

A **section** is the part of a page between two section breaks. A **section style** changes the whole
section: puts its parts side by side, makes it a tab or a carousel slide, gives it a background.
Authors set it in the section's Section Metadata (Style row); the **Block options panel → Section**
offers the ones that fit and copies the Style to paste.

## 9.1 Values before and after

*Section style names written on the imported stryker.com pages (2,340 live pages): **255 names, 35,817
uses**.*

| Kind | Names today | Uses | New site | Status |
|---|---|---|---|---|
| Side by side and column widths | 29 | 6,071 | **4**: side by side (equal, wide + narrow, narrow + wide), side by side on phones | built |
| Section roles: tab, accordion, carousel | 11 | 1,066 | **3** roles + 7 follow-up choices (starts open; autoplay, fade, split slide, 3 band colours) | built |
| Background and boxes | 38 | 4,123 | **10** background colours (the box colours) + full width, soft shadow, gradient direction | built (review pages) |
| Text look of the whole section (fonts, sizes, bold, centred) | 56 | 11,394 | **Text style** for the words, + **1** section style: centred text | built |
| Spacing (padding, margin, spacer sections) | 95 | 6,194 | **0**: the standard gap between sections | by design |
| Lines between sections | 5 | 3,348 | **1**: line above the section | built (review pages) |
| Template and shared parts (disclaimer, contact aside, Connect band …) | 12 | 3,450 | **12** kept as they are, set by the migration with their template or fragment; not an author choice | kept |
| Button colour | 2 | 96 | **2**: purple buttons, blue buttons | built (names kept) |
| Desktop or phone only | 2 | 28 | **2**: desktop only, phone only | built (names kept) |
| Image looks (borders, linked images) | 5 | 47 | **0** section styles: Block options of the block (image border, linked images) | built |
| **Total** | **255** | **35,817** | **35 author choices**, all in Block options → Section (shown on review pages) **+ 12 template looks** | |

## 9.2 The section styles

**Layout and roles (Block options → Section)**

| Choice | Style name | Replaces today | Fits when |
|---|---|---|---|
| Side by side, equal parts | `flex` | flex (1,630), video-text (43), form-with-aside (18), text-video, image-aside | the section has 2 or more parts |
| Side by side, wide + narrow | `flex, flex-67-33` | flex-67-33 (323), form-right, video-right | 2 or more parts |
| Side by side, narrow + wide | `flex, flex-33-67` | flex-33-67 (7) | 2 or more parts |
| Side by side on phones too | `flex-row-mobile` | (icon rows) | side by side is picked |
| A tab | `tab-panel` | tabbed (346) | the section opens with a heading (the tab label) |
| An accordion panel | `accordion-panel` | accordion-panel (564), accordion-continue (31) | the section opens with a heading |
| … starts open | `accordion-open` | | accordion panel is picked |
| A carousel slide | `carousel` | carousel (103), banner | the section holds a Hero block, or a Columns row next to a slide |
| … autoplay (one speed, 5 s) | `autoplay` | autoplay-2500 … autoplay-6500 (6 speeds) | carousel slide is picked |
| … cross-fade | `fade` | fade (11) | carousel slide is picked |
| … split slide | `split` | | carousel slide with a Columns row |
| … split band colour | purple gradient (default), `box-blue-gradient`, `box-dark` | | split slide is picked |

The column-width names (col-1-2, col-1-3, col-2-3, col-at-…, image-1-2 / 1-3 / 2-3, width-50 / 67, phone-full:
about 860 uses) map to the nearest side-by-side choice by their widths; the pages are listed for review.

**Backgrounds and the other section styles (Block options → Section, review pages)**

| Choice | Style name | Replaces today (uses) | Measured on stryker.com → new site | Fits when |
|---|---|---|---|---|
| Background: white, light grey, gold, blue, purple, teal, dark grey, gold gradient, blue gradient, purple gradient | `box-white` … `box-purple-gradient` | bg-white 957, bg-gold 539, bg-light-gray 291, bg-dark-purple-gradient 218, bg-dark-blue-gradient 183, dark 127, bg-golden-gradient 92, bg-dark-gray 53, bg-blue 32, bg-purple 18, bg-teal 3 … (38 names) | exact colours (#ffb500, #edeeec, #1c5687, #85458a, #4c7d7a, #545857; gradients #af6d04 → #ffb500 20%, #545857 → #425361, #545857 → #594b61); a box at the content width (1380px from x 30 at 1440px, 360px at 390px), medium spacing above (5%), small at the sides and below (3%) (stryker.com 4% / 2% / 3%); white text on the dark colours | any section |
| Full width (a band) | `full-bleed` | full-bleed 13; every bg-* band (today's look of the old names) | the background to the page edges, the content at the page width (stryker.com c-full-bleed-panel: text from x 30) | a background is picked |
| Soft shadow | `shadow` | boxed 1,235, shadow-box 76 (with a colour: that colour's box) | the stryker.com dimensional box shadow (0 0 10px, 30% black) | a background is picked |
| Gradient direction: right to left, bottom to top | `gradient-reverse`, `gradient-up` | gradient-inverse 37, gradient-top-to-bottom 19 (both together: bottom to top) | −90° / 0° | a gradient background is picked |
| Centred text | `text-center` | center 644 | the section's text centred | any section |
| Narrow column | `narrow` | col-8-centre 171, col-8 132; col-10 59, column-10-12 82 (outliers, below) | the centred 8/12 column from 600px (909px from x 265 at 1440px), full width on phones | any section |
| Line above | `line-above` | divider 2,987, separator 325, separator-row 33, separator-wide 1 | 1px #b2b4ae across the page; the section gap above (30px, 20px on phones), 50px below it (20px on phones) | any section |
| Buttons: purple, blue | `btn-purple`, `btn-blue` (names kept) | btn-purple 77, btn-blue 19 | stryker.com .btn-purple #85458a, .btn-blue #1c5687, darker on hover | the section has a button (a link alone on its line) |
| Show on: desktop only, phones only | `desktop-only`, `mobile-only` (names kept) | desktop-only 15, mobile-only 13 | stryker.com switches at 840px (hidden-xs / visible-xs) → 600px; also on fragments that replace the section | any section |

Old names keep rendering as today on real pages; the panel reads them as the standard choices (e.g.
`bg-gold` = Gold + Full width, `bg-gold, boxed` = Gold + Soft shadow) and **Copy section style** writes
the standard names. Each choice has an example with real stryker.com content on the Section layout
review page.

**Outliers (to review)**

| What | Uses | Proposal |
|---|---|---|
| The 10/12 column (col-10, column-10-12): a second narrow width (1,150px at 1440px) | 141 | the narrow 8/12 column, or full width; to decide |
| col-8 is left-aligned on stryker.com (910px from x 30); the narrow column is centred | 132 | centred |
| Colours outside the list: bg-silver, bg-gray, gray-gradient → light grey; bg-dark-gold, bg-dark-orange-gradient → gold gradient | 33 | the nearest named colour |
| `dark`: the migration's one name for stryker.com's dark grey and its dark teal / orange gradients | 127 | dark grey |
| Spacing inside a box: stryker.com 4% / 2% / 3% | | the steps 5% / 3% / 3% (text 41px in from the box edge at 1440px, 28px on stryker.com) |
| Today's site paints `bg-gold, boxed` as a full-width band; stryker.com shows a box at the content width | | the standard reading follows stryker.com (a box with a soft shadow) |

**Not section styles any more**

| Today | Uses | Now |
|---|---|---|
| Fonts and sizes for the whole section (serif, h-serif, bold-body, p-1-25, large-headline, label-2, h1-1-25 …) | 11,394 | **Text style** on the words; whole-row looks of Columns in Block options → Text look |
| Spacing (spacer sections 4,039, padding-*, margin-*, no-gap, pull-up …) | 6,194 | the **standard gap**; no setting |
| Sections that continue the one above (continued 2,583, join 144) | 2,727 | one section, or the standard gap |
| Image borders and linked images | 47 | **Block options** of the block |

## 9.3 How the Section panel decides what to show

| The section holding the block | The panel shows |
|---|---|
| has 2 or more parts | Side by side |
| opens with a heading | A tab, An accordion panel (folded away) |
| holds a Hero block, or a Columns row next to a carousel slide | A carousel slide (folded away) |
| is next to a tab, accordion panel or carousel slide | the folded part opens: "make this one the same to add it" |
| any section | Background, Text and width (centred text, narrow column, line above), Show on |
| has a background | Full width, Soft shadow; and Gradient direction for a gradient |
| holds a button (a link alone on its line) | Buttons (purple, blue) |
| has a style already | that style, so it can be removed |
| none of these | "No section style applies to this section as it is" |

Follow-up choices (on phones, full width, soft shadow, gradient direction, starts open, autoplay, fade,
split, band colour) appear only after their main choice. Styles that can't apply are listed with why under "Other section styles".

# 10. Values that move more (listed for review)

| What | Uses | Proposal |
|---|---|---|
| Outer spacing far from the standard gap (large or negative margins) | 23% of top margins | the standard gap; boxes that overlap on purpose are listed in the Panel chapter |
| Charcoal text #323232 (typed by authors, not a Stryker component colour) | 93 | black |
| Columns rows in widths stryker.com doesn't use (1/4 + 3/4, 70 / 30, 1/4 + 1/4 + 1/2; older imports of news fragments) | 10 rows | the nearest layout (narrow + wide, wide + narrow, three equal) |
| Text sizes above 2.5× (3.5×) | a few | 2.5× |
| Headlines between two steps | part of 3,584 | the nearest step |
| Rare box colours (orange, dark orange gradient, grey, dark teal gradient in Panel; bronze in Cards) | 11 in Panel, a few in Cards | the nearest named colour |
| Image borders in other colours in Columns (blue, white, dark grey) | 11 | blue → teal, dark grey → black, white → none |

Every page concerned is listed by address in its block chapter.

# 11. Decisions for the business

| Topic | Decision needed |
|---|---|
| All blocks | approve the named choices and the review-page results; then switch the new look on for real pages |
| Columns | *Text look* group in Block options (whole-row text looks); first-line bars → line boxes |
| Panel | the 232 gold "Connect with us" bars; the 809 boxes in column cells; the 46 overlapping boxes |
| Cards | one box colour per row (21 rows colour each card differently); building the filtered product grid |
| Hero | page intro replacing the columns rows; framed banners, text above on phones, video backgrounds |
| Section styles (built) | approve the *Section* area of Block options: side by side, tab, accordion panel, carousel slide, shown only when they fit the section (section 9.3) |
| Section styles (backgrounds and the others) | approve the 21 choices of section 9.2 (10 backgrounds + full width, soft shadow, gradient direction; centred text; narrow column; line above; purple and blue buttons; desktop or phone only), built on review pages; the 10/12 column (141 uses) |
| Section styles (dropped) | whole-section fonts and sizes move to Text style; spacing and spacer sections (4,039) become the standard gap |
| Statistics | the 22 number rows next to images or video |
| Table | legal lists from a sheet or in the page (Trademarks: 1,322 rows) |
| Event calendar | keep the 2018–2021 events as an archive, or retire the pages |
| Chart, Media gallery | chart block or images; keep the 360° spin |

# 12. Tasks outside authoring

| Who | Task |
|---|---|
| Site administrator | add publish dates, tags and event details to the page index; publish the event pages |
| Stryker app team | allow the new site's addresses for the micro-apps; keep the app server running |
| Stryker | decide the division contact, corporate contact and Adobe Sign forms |
| Migration | re-import the older shared fragments; fix the two migration gaps listed in the Panel and Hero chapters |

# 13. Full-page test

Three of stryker.com's most complex product detail pages were migrated with the standardised blocks,
section styles and Text style (the migration's review build, nothing edited by hand) and compared
with stryker.com on desktop and phone. Details, screenshots and the open gaps: **page-comparison.md**
(also as a PDF).

| Page | Blocks | Main sections present | Text as on stryker.com (as designed) |
|---|---|---|---|
| [Isolibrium](https://standardisation--stryker-com--strykerenterprise.aem.page/drafts/astha/pages/isolibrium) | 18 | 14 of 14 | 74 of 76 (97%) |
| [LIFEPAK 35](https://standardisation--stryker-com--strykerenterprise.aem.page/drafts/astha/pages/lifepak-35) | 14 + 3 slides | 11 of 11 | 91 of 92 (99%) |
| [SafeAir smoke evacuation](https://standardisation--stryker-com--strykerenterprise.aem.page/drafts/astha/pages/safeair-smoke-evacuation) | 22 | 15 of 15 | 124 of 132 (94%) |

Fixed after the first review: product-page banners are now the Page intro (text left, product image
right), and a gold heading box over a white shadow box beside an image is a side-by-side section of
Panels; and every section keeps only the standard section styles (whole-section sizes and fonts are
Text style, spacing is the standard gap). The main open items: shared fragments need re-importing; a few text sizes inside boxes and the Futura words in serif
titles need migration fixes; whether bold words in a sentence are Futura or Humanist is to decide.

# Glossary

| Term | Meaning |
|---|---|
| Variant | a block's structure, chosen when adding it (Columns *two equal*) |
| Property | a named choice on top of a variant (*Gold box*, *Medium spacing*) |
| Block options panel | the editor panel where authors pick a block's properties |
| Text style | colour, font or size of a few words, the same choices in every block |
| Section style | a choice for a whole section of the page |
| Step | one of the few values a setting can take |
| Kept | the share of uses that look the same or almost the same |
| Review page | a draft page showing every variant and property of a block with real stryker.com content |
