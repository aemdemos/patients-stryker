# Visual-review batch on arise-1000-ex (2026-11-08), local only

No QA run or full re-import yet: the user asked to batch unrelated fixes first. Every fix was
checked against live (stryker.com) by measuring at 1440 / 1100 / 860 / 375, with the impact
check on both template samples (`/tmp/import-impact/batch3`; baseline not accepted yet).

## Fixed (local, not pushed, not uploaded)

1. **Hero image 600–899px** (`blocks/hero-corp/hero-corp.css`): image-right + text-below heroes
   without a mobile image lay out side by side from 600px, as live from 840px. arise at 860:
   image x430 w430 (live 442), text x69 w289 (live 69 / 289).
2. **Gold gradient bar padding** (`spacingOf`, corp-component-handlers.js): live scripts rewrite
   the style attribute as shorthand (`padding: 3% 3% 2%`); spacing is now read through
   `box.style`. arise bar: padding 41.4 / 27.6px at 1440, 10.3 / 6.9px at 375 = live.
3. **Resources XF grid** (`corp/news-shared-fragments.js` buildResources): the columns keep their
   AEM grid (outermost grid column of each text): acute care 3, 3, 3 (desktop) and 12s below
   1200px; emergency care 3 × 4, two per row on phones; sage 4 × 3, phone 6s with a new line.
   arise at 1440: x30 / x383 (live x31 / x383); stacked at 1100 / 860 / 375 as live.
4. **Empty component slots → spacer sections** (corp-section-builder.js, corp-component-handlers.js,
   styles-corp.css). Live: an empty column control is 1px + the 20 / 30px component gap, a
   hidden section title 0 + the gap (2,249 empty column controls in the exports, none styled).
   - Consecutive slots → one section `spacer` / `spacer, large|xlarge|xxlarge` (1–4 slots;
     more → several); corp height = slots × `--corp-component-gap`.
   - Anchors and pending styles stay with the next content section.
   - Slots inside a column are dropped (they only lengthen that column).
   - `spacer, continued` after unboxed text or an accordion: they have no component gap on live
     (aed-pad-placement-guide: text → FAQs 67 / 99px = live 67 / 101).
   - arise at 1440, live / before / now: intro→bar 408 / 374 / 404, bar→cards 456 / 424 / 454,
     cards→contact 316 / 207 / 297. spinejack: every component gap = live ±4px.
   - Impact: 20 product + 6 news docs differ only by spacers (90 + 13).
5. **Contained full-width-image heroes** (`contained` Hero Corp option, hero-corp.css): the source
   fullWidthImageHero sits in `.pDiv.container` (all 23 in the cache). spinejack: x30 w1380 at
   1440, x15 w1070 at 1100, x15 w345 at 375 = live. Carousel heroes stay full bleed (live too).

6. **Blank lines** (`&nbsp;` paragraphs; user chose spacers + a blank-line tag, 2026-11-08).
   Live: one 14px line (19.25px) + 15px = 34.25px at every width.
   - In a text with content (start, middle, end): `[[Blank line]]` paragraphs in place
     (scripts/corp-settings.js → `p.blank-line` with a no-break space, 14px whatever the copy
     size). Start / end lines stay in the text too: on live they are inside the text's box
     (a coloured box keeps its colour behind them).
   - A blank-only text component: an empty slot of N lines. On the page → spacer section
     `spacer, no-gap` + `Blank lines | N`; the only content of a column control → `spacer` +
     `Blank lines | N` (slot + lines); in a column / panel with other content → `[[Blank line]]`
     paragraphs there.
   - Spacer height = slots × `--corp-component-gap` + lines × `--corp-blank-line`.
   - pivot-guardian at 1440: blank texts 34px = live, empty control + blank text 64 vs 65px.
   - Samples: 14 `[[Blank line]]` paragraphs, 15 line spacers.

7. **Product hero, second round** (user: text box misplaced after the 600–899px fix; image
   "missing" below 600px). Measured in standards mode against live at 375 / 700 / 860 / 1100 / 1440.
   - Below 600px live shows no image (desktop and phone browsers): unchanged, as live.
   - The 600px grid's padding stayed on above 900px (higher specificity than the desktop rule):
     h1 x264 w266 at 1100 instead of live x88 w462. Replaced by the desktop layout from 600px for
     every image-right text-below hero, mobile image or not (procuity at 860: desktop slide, as live).
   - fitBox keeps the box's top inset in px of the image-high slide before growing it (h1 45px
     down at 860, as live; it moved to 66px).
   - A product hero's bottom margin (margin-bottom-N) is the button's top margin, % of the box
     width (`--hero-copy-gap`, hero-corp.js; `spaceBlock` skips it): button gap 24 / 26 / 33 / 43px
     at 375 / 860 / 1100 / 1440 = live. Text-only slide below 600px: no top padding.
   - arise, tru-fit, procuity: every line within 3px of live at 375 / 860 / 1100 / 1440 (procuity
     h2 16px, wrapping). Left: our slide grows to hold text that runs past the image (860: 299
     vs 249px; live lets it spill 34px); live's image is 12px wider than half (7px taller slide).
8. **Header → page start**: no 10px header gap above a first-section Hero Corp slide that is not
   `contained` (live: carousel slides flush, fullWidthImageHero 10px); `--corp-hcp-band-height`
   95px from 600px (the band is one line). arise main at 204 / 185 / 242 = live; spinejack
   214 / 195 / 252 = live.
9. **Hidden hero title** above a contained banner: 20px gap at every width (spinejack banner at
   264 / 245 / 302 = live).
10. **Tabs**: panel gap = component gap (20px below 600px); a resources list in a tab keeps its
   40px below (arise tabs 379 / 389 vs live 380 / 390).
11. **Columns image → title**: the component gap (20px below 600px; arise cards 20 / 59px = live).

Local preview caveat: localhost content pages have no doctype (quirks mode), so mixed-size lines
measure shorter there than on aem.page / live (hero h1 45 vs 52px). Measure with a doctype.

## Checked, nothing to fix

- ProCare tile overflow at 375: from an older build; current = live (345 × 203, icon x300).
- The visually hidden hero title above fullWidthImageHero takes room on live too (30 + 20px).

## Still open (found on arise / spinejack / aed)

- Marketo form: rows slightly tighter, consent line wraps in the half column, submit → tabs 72 vs
  145px (form CLS work is deferred, see memory).
- "Last Updated" line: bulk metadata (known).
- Pre-existing import failures of 2 hosted XFs (1788 hero mobile, Insignia carousel desktop):
  `page.evaluate` error, also in the baseline run.

## Before the next QA run

Block Library: `spacer` sizes for corp (`no-gap`, `Blank lines`), Hero Corp `contained`, Columns grid
options on the Resources fragments. Authoring conventions: `[[Blank line]]`. Accept the impact baselines once reviewed. Re-import → upload (asked
explicitly) → QA.

## QA run a932dd3e (2026-11-08, 672 pairs × 4 widths, after the batch)

Health vs run f5a17f26 (Marketo timing flips set aside, 76 width results): 1440 91.6 → 94.3,
1100 90.1 → 94.3, 860 89.2 → 92.6, 375 91.2 → 94.6. Worse by more than 1 point: 5 pages, at most −3.

Triage (local, not pushed / uploaded):
- Trauma pages (34) low at every width: the division contact form (AEM email form, not Marketo)
  is left out by the 2026-10-27 decision until the client supplies Marketo form IDs; the user
  chose to keep waiting. Its 16 missing texts are expected.
- surpass-evolve: a 1/3 + 2/3 column of text | chart + footnote came out as three equal pieces.
  - New readable setting `Columns | 1 + 2` (class `flex-cols-1-2`): the import writes how many
    pieces (wrappers) each source column holds; corp.js groups them into one div per column after
    the blocks are decorated (new hook `decorateBlockLayout`, scripts.js). Approved by the user.
  - Written on 9 of the 12 affected pages; 4 pages keep some ungrouped sections, where a column
    ending in text meets one starting with text (one wrapper in EDS): bone-cements, vcf-accessories,
    omnicurve, modular-dual-mobility. Needs a column-break line to fix (not done).
  - Chart Corp `Height` row (source chartHeight): Google's chart area 19% / 62% of the height;
    bar labels cut with "…" to their slot; axis titles italic. surpass-evolve charts = live.
- Plain flex sections (about 350: intro | Related Categories, text | Marketo form, grouped
  columns): bootstrap geometry, top-aligned, 30px gap, no column padding. bioprep, Pangea,
  ankle-truss-system form = live (x30 / x735, 675px at 1440; x15 / x445, 400px at 860).
- Small drops: inspace = carousel timing (inactive slide texts); bioprep = the flex geometry
  (fixed); prozip = grouping (fixed); Pangea at 860 = live shows 2 columns per row on tablets
  (not done); axs-infinity-ls −2 at 375 = drift only (not looked at).
- Import side also: blank lines no longer decide columns / accordions (4 large-headline Columns,
  1 boxed-last and 3 accordions were lost in the first re-import pass; fixed before upload).

## Tablet layout of 3 / 4 column controls, column break (2026-11-08, local)

- Every cols3 / cols4 control on stryker.com renders col-sm-6 col-md-4 / col-md-3 (all 843 in
  the page cache): two per row from 841px (EDS 600), all from 1024px (EDS 900). Now so for
  3 / 4-cell Columns (not grid rows, not columns-25-25-50) and for flex sections with 3+ columns
  (the lone last column stays left: `margin-inline: 0` over the shared `margin: 0 auto`).
  arise features at 860: x15 / x445, 400px, third card on the next row (= live); Pangea plate
  groups at 860 = live.
- Not done (needs a vocabulary decision): Cards Corp `three-up` from cols3 is 3 per row from
  600px; live is 2 per row up to 900px (13 docs; anchorage-2). three-up was written for the
  home page "Our focus" (col-sm-4, per its comment), so changing it moves the home page too.
- `Column break` line (approved 2026-11-08): the import puts it between two flex columns of text
  (one wrapper in EDS otherwise); corp.js splits the wrapper there and removes the line before
  grouping. All 12 affected pages now grouped (7 breaks on bone-cements, vcf-accessories,
  omnicurve, modular-dual-mobility). vcf-accessories second column at x735 (1440) / x445 (860)
  = live.

## Large Headline bands and boxes, centring (2026-11-08, local; user: anchorage-2 "Product resources")

- Source: a Large Headline with no background inside a coloured full-bleed panel is a full-width
  band (anchorage-2, inbone, 1488, pneumoclear, medpor: x0 w1440); one with its own
  `.has-background` is a box in the column (axs-infinity-ls golden, bone-mill orange: x30 w1380).
  Counts in the exports: 288 in panels without own background (203 pages), 1,053 with their own.
- Import: own background → `boxed` (and the contact-directory group headings, built by
  corp-components.js). Impact: 11 product + 4 news sample docs, only that word.
- CSS: `large-headline` + gradient without `boxed` paints the section, as the solid colours and
  plain panels do; a boxed Large Headline keeps 20px padding; an unboxed one has none but its
  spacing settings; its lines have no paragraph gaps and, below 600px, the source line box (30px);
  a divider's 50px stays above a band's colour (background-clip). Heights now = live within a few
  px at 1440 and 375 (inbone 281 / 241 vs 279 / 241) except bone-mill (−20 / −30) and 1488 (its
  CTA is a section of its own under the band).
- Centring: the large-headline wrapper had a fixed 15px side margin (left-aligned beyond 1440px);
  now max(15px, centred container). Off-centre scan at 1920 on 12 pages: only flex columns and
  col-* sections (intended) remain.
- Note for a merge into main: the class-form importers would need the same `boxed` on own-background
  Large Headlines, else those render as bands with this CSS.

## Centred Columns text, leading line breaks (2026-11-08, local; user: anchorage-2 link grid, captions)

- Source centres rich text with an inline `text-align: center` (and images with `.text-center`).
  Default content already got section style `center`; Columns cells lost it. Now a Columns block
  whose text columns are all centred gets `center` on its section (mixed blocks reported, left).
  anchorage-2: link grid x122 / x752 / x1185 at 1440, x118 / x43 / x124 at 375; captions
  (Universal CP x122, Screwdriver blade x284) = live.
- The link grid's lines open with a <br> (an empty first line); the document drops a break at a
  paragraph's start. corp-richtext.js keepLeadingBreaks moves it inside the first bracket tag
  ("[[Futura]<br>CONTACT US]"), which survives; not for a link-alone line in default content (the
  settings writer may lift its tags and leave the break before the button). Band 64 / 254 vs live
  66 / 262.
- Impact: 6 product + 2 news sample docs (center, kept breaks); nothing else.

## Scan for unhandled source formatting (2026-11-08, local)

Scanned the rich text in the exports (inline styles, tags) and the classes in the 2,004 cached
pages that no import rule mentions. Colour / font size / family are read from computed styles
(handled). Found and fixed (user chose all three):
- Standalone images: `.text-center` around 9,555 of 10,079 (1,329 pages, incl. 488 linked):
  an image alone on its line in default content is now centred (medpor hero x120 = live).
- Partly centred texts (27 texts / 16 pages), right-aligned (24 / 17), indented paragraphs
  (margin-left 40px, 30 / 26): whole-paragraph tags `[[Center]…]`, `[[Right]…]`, `[[Indent]…]`
  (class form align-center / align-right / indent, corp-settings.js TEXT_STYLES; a section whose
  every paragraph has one gets a Text row). Mobility-zone news line x55 / x25 = live; sahara
  indent x70 = live; target-tetra lines right-aligned as live. Blank lines are not tagged.
Looked at, nothing to do: border-bottom-none-sm (a 0px chrome element), button-group alignment
(338 left, 1 right), sub / sup (kept).
Needs: authoring conventions / Block Library entries for Center / Right / Indent.

## 2026-11-09: blank lines of one &nbsp; were lost

- Cause: the Helix importer's `preProcess` (`reviewParagraphs`) removes every `<p>` whose text is empty, one space or one `&nbsp;` before the import transform runs. The importer only saw blank paragraphs with two or more characters (`&nbsp; `, `<br>&nbsp;`).
- Scale (page cache, 672 product pages): 1049 one-`&nbsp;` paragraphs on 226 pages were dropped; 236 were kept. The 1294 empty or space-only paragraphs take no room on live and stay dropped.
- Fix: `markLivePage` (corp-section-builder.js) writes those paragraphs as `[[Blank line]]` in onLoad. Only rich-text paragraphs outside lists and tables, with an `&nbsp;` or a `<br>`. `isBlankParagraph` accepts the marker.
- A 1-column control holding only blank lines and a separator becomes a spacer with `Blank lines N`, then the divider.
- Measured at 1440 (top of the heading):
  - ankle-truss-system "First of its kind": live 1122, before 1026, now 1129.
  - "Off-the-shelf": live 1523, before 1340, now 1536.
  - 1788-platform "Tone mode": live 3564, before 3361, now 3600.
  - 1788-platform, gap above the "Advanced imaging" band: live 250, before 173, now 272.
- Impact samples vs the `align` run: product-detail 8 documents with blank lines only and 4 with blank-line sections; news-detail-engine 7 + 2. Nothing else changed.

## 2026-11-09: feature-covering review (42 pages, local batch, not pushed)

- Picked by `.cbr/local-scripts/feature-cover.py`: greedy set cover over 384 features, all of them covered by 42 pages. Compared at 1440 and 375 with `fc-review.sh`, triaged with `fc-segments.py`.
- Fixes in the batch:
  - Large Headline h1 at 28px (101 docs).
  - Egyptienne 1.5× headings at 1.06.
  - Serif 50-50 rows top-aligned, without the patients margins (76 docs).
  - Bottom-text heroes stacked on phones.
  - Hero Corp `shadow` (26 pages).
  - Long-text hero handler (3 pages).
  - Chart data table clipped (phone overflow).
  - Corp video frames take the poster's ratio.
  - Product intro: title break and empty paragraph become blank lines (159 pages).
  - Unpublished phone slide XF: the desktop fragment is desktop-only (insignia; the user's call).
- Blast radius on the branch scan: 177 pages reached, 174 look different. Heading drift on a random 12: most much closer to live (heartsine 610 → 30, lifepak-35 175 → 39), some 10–25px worse.
- Open:
  - 1788-platform / sonopet-iq / npseal: the phone side of slides in carousels or Hero Corp with unpublished phone XFs.
  - target-tetra spin hero (natural size, purple box in the hero overlay).
  - malis banner carousel.
  - Marketo form layout (deferred).
