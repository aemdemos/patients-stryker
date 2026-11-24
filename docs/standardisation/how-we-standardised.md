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
| Block variants | **70** | **53** |
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
| Column widths (Columns) | 5 | 2,419 rows | 5 layouts | 0% | 100% |
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

**Why these steps:** each step is the most used value of its group on stryker.com, so most pages don't
move at all. Example (Columns, space above the text in a box, 483 boxes): 5% (104) → medium, 3% (101) →
small, 2% (62) → small, 0% (43) → none, 15% and 20% (47) → listed for review, proposal large.

**How headline steps were chosen:** of the sets of four compared, S 1.5 / M 2 / L 3 / XL 4.5 keeps
the most headlines: 862 join S, 787 M, 1,245 L, 690 XL; 73% are within 12.5% of their step.

# 5. Block by block: values before and after

*Format: values on stryker.com → choices on the new site (kept). Spacing is listed as top / bottom /
left / right.*

**Columns** (2,419 rows)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 23 / 15 / 11 / 10 values | 4 steps | 89 / 98 / 98 / 100% |
| Outer spacing | 27 / 17 / 7 / 8 values | standard gap | 82 / 97 / 61 / 98% |
| Font size | 39 | 11 | 97% |
| Font | 6 | 3 | 99% |
| Text colour | 22 | 11 | 98% |
| Box colour | 6 | 9 + none | 100% |
| Image border colour | 9 | 3 | 96% |
| Text alignment | 4 | 2 | 99% |
| Column widths | 5 patterns | 5 layouts (+ 5 widths real pages use) | 100% |

**Cards** (2,548 cards)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 17 / 25 / 11 / 10 values | 4 steps | 96 / 96 / 99 / 99% |
| Outer spacing | 18 / 11 / 5 / 5 values | standard gap | 64 / 97 / 100 / 100% |
| Font size | 26 | 11 | 95% |
| Font | 7 | 3 | 99% |
| Text colour | 23 | 11 | 97% |
| Box colour | 19 | 7 + none | 95% |
| Image border colour | 10 | 3 | 95% |
| Text alignment | 3 | 2 | 100% |
| Cards per row | any | 2 to 6 | 100% |

**Panel** (863 boxes)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 20 / 31 / 12 / 10 values | 4 steps | 99 / 99 / 100 / 99% |
| Outer spacing | 23 / 15 / 15 / 14 values | standard gap | 77 / 93 / 94 / 82% |
| Font size | 12 | 11 | 96% |
| Font | 4 | 3 | 100% |
| Text colour | 12 | 11 | 99% |
| Box colour | 22 | 10 | 99% |
| Gradient direction | 4 | 3 | 97% |
| Text alignment | 4 | 2 | 100% |

**Hero** (1,248 heroes)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 11 / 9 / 9 / 8 values | 4 steps | 96 / 97 / 96 / 97% |
| Outer spacing | 12 / 9 / 9 / 11 values | standard gap | 95 / 99 / 91 / 32% |
| Font size | 30 | 11 | 87% |
| Font | 4 | 3 | 100% |
| Text colour | 19 | 11 | 97% |
| Box colour | 10 | 8 + none | 100% |
| Headline position | 189 | 12 | 93% within 10% |
| Text alignment | 4 | 2 | 99% |

**Accordion** (249)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing (top) | 2 values | 4 steps | 100% |
| Outer spacing | 4 / 2 values | standard gap | 70 / 100% |
| Font size | 9 | 11 | 100% |
| Font | 4 | 3 | 99% |
| Text colour | 11 | 11 | 97% |
| Box colour | 2 | 10 | 36% (pale grey lists become *Lists in a light grey box*) |
| Text alignment | 4 | 2 | 99% |

**Tabs** (198)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 4 / 5 / 4 / 4 values | 4 steps | 100% |
| Outer spacing (top) | 1 value | standard gap | 100% |
| Font size | 9 | 11 | 100% |
| Font | 2 | 3 | 100% |
| Text colour | 14 | 11 | 97% |
| Text alignment | 4 | 2 | 99% |

**Section layout** (side-by-side rows, 1,054)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Inner spacing | 6 / 4 / 5 / 3 values | 4 steps | 88 / 100 / 92 / 100% |
| Outer spacing | 6 / 4 / 2 / 2 values | standard gap | 95 / 86 / 0 / 100% |
| Font size | 11 | 11 | 98% |
| Text colour | 8 | 11 | 100% |
| Column widths | any | 4 section styles | 100% |

**Carousel** (30)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Font size | 14 | 11 | 82% |
| Font | 2 | 3 | 100% |
| Text colour | 8 | 11 | 100% |
| Speed | 6 (2.5 to 10 seconds) | 1 (5 seconds) | by design |

**Statistics** (82)

| Setting | stryker.com | New site | Kept |
|---|---|---|---|
| Number colour | 6 | 5 | 99% (dark gold joins gold) |
| Number size | 10 | 3 (2.5–4 → small 11, 4.5–6 → medium 42, 6.5–9 → large 17) | nearest step |
| Label font size | 6 | 11 | 68% |
| Label colour | 9 | 11 | 88% |
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
| Columns | 6 | 10 layouts (5 main + 5 widths real pages use) | 45 |
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
| **Total** | **70** | **53** | **169** |

*Properties* counts every named choice except the variant, including each group's default.

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
| Section style | a whole section | side by side, tab panel, carousel slide |
| Text style | a few words inside a text | a gold name, a serif sentence, a 2× size |

Rule for authors: the whole block → Block options; a few words → Text style.

# 9. Values that move more (listed for review)

| What | Uses | Proposal |
|---|---|---|
| Outer spacing far from the standard gap (large or negative margins) | 23% of top margins | the standard gap; boxes that overlap on purpose are listed in the Panel chapter |
| Charcoal text #323232 (typed by authors, not a Stryker component colour) | 93 | black |
| Text sizes above 2.5× (3.5×) | a few | 2.5× |
| Headlines between two steps | part of 3,584 | the nearest step |
| Rare box colours (orange, dark orange gradient, grey, dark teal gradient in Panel; bronze in Cards) | 11 in Panel, a few in Cards | the nearest named colour |
| Image borders in other colours in Columns (blue, white, dark grey) | 11 | blue → teal, dark grey → black, white → none |

Every page concerned is listed by address in its block chapter.

# 10. Decisions for the business

| Topic | Decision needed |
|---|---|
| All blocks | approve the named choices and the review-page results; then switch the new look on for real pages |
| Columns | *Text look* group in Block options (whole-row text looks); first-line bars → line boxes |
| Panel | the 232 gold "Connect with us" bars; the 809 boxes in column cells; the 46 overlapping boxes |
| Cards | one box colour per row (21 rows colour each card differently); building the filtered product grid |
| Hero | page intro replacing the columns rows; framed banners, text above on phones, video backgrounds |
| Section layout | whether the Block options panel should also offer section styles |
| Statistics | the 22 number rows next to images or video |
| Table | legal lists from a sheet or in the page (Trademarks: 1,322 rows) |
| Event calendar | keep the 2018–2021 events as an archive, or retire the pages |
| Chart, Media gallery | chart block or images; keep the 360° spin |

# 11. Tasks outside authoring

| Who | Task |
|---|---|
| Site administrator | add publish dates, tags and event details to the page index; publish the event pages |
| Stryker app team | allow the new site's addresses for the micro-apps; keep the app server running |
| Stryker | decide the division contact, corporate contact and Adobe Sign forms |
| Migration | re-import the older shared fragments; fix the two migration gaps listed in the Panel and Hero chapters |

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
