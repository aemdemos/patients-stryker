# Hero: five layouts, named positions

*A walkthrough of the Hero block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the banner walkthrough ([README](README.md)) and the Columns, Panel and
Cards chapters ([columns](columns.md), [panel](panel.md), [cards](cards-corp.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only heroes shown on the live site are counted. This chapter checks the banner walkthrough's four layouts
against the live site and adds the layout that was missing: the page intro.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, the top of a page is one of several components: a banner image with a headline placed anywhere (189 different positions), a page intro with the title and an image side by side, a coloured tagline band, a large header or a long-text hero. Each headline's size, colour and box were typed freely. |
| **The risk** | Copying every value means hundreds of positions, 30 font sizes and 19 text colours for what is mostly the same handful of heroes. |
| **What we did** | We counted every hero on the live site and kept **five layouts** (image slide, page intro, tagline band, large header, long text). The banner's free settings became named choices in the **Block options panel**: the headline box colour (the same colour list as every block), 3 columns × 4 heights for the headline, the colour of the bold and plain words, the stripe, a framed banner, a video background and the phone layout. The page intro gets three switches: no image, no rule, black title. |
| **The result** | Heroes look the same or almost the same as today: 93% of banner headlines stay within 10% of their position and every box keeps its colour. Sizes, fonts and coloured words of the headline use the site-wide **Text style**, with the same small set of sizes and colours as Columns, Panel and Cards. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a hero, how many different values stryker.com uses today, and the named choices on
the new site. *Kept* is the share of instances whose look stays the same or almost the same: spacing within
2 points of a step, a font size within about 10% of a size step (headlines: within a quarter of a step),
a colour that is one of the named colours.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Headline position (banner) | **189** combinations | 478 banners | 3 columns × 4 heights | **93%** within 10% | left column 326, wide 54, right 26; upper 173, top 123, middle 50, lower 18 |
| Inner spacing, top (padding %) | **11** | 113 | the box's standard spacing | **96%** | 4 (41), 3 (25), 5 (21), 7 (6) |
| Inner spacing, bottom | **9** | 69 | the box's standard spacing | **97%** | 3 (20), 4 (12), 2 (10), 1 (6) |
| Inner spacing, left | **9** | 93 | the box's standard spacing | **96%** | 4 (37), 5 (31), 10 (13), 0 (4) |
| Inner spacing, right | **8** | 37 | the box's standard spacing | **97%** | 5 (25), 1 (3), 10 (2), 0 (2) |
| Outer spacing, top (margin %) | **12** | 66 | 0 (standard) | **95%** | 7 (25), 2 (14), 3 (8), 5 (5) |
| Outer spacing, bottom | **9** | 124 | 0 (standard) | **99%** | 7 (95), 5 (11), 1 (4), 2 (3) |
| Outer spacing, left | **9** | 23 | 0 (standard) | **91%** | 5 (7), 0 (5), 2 (3), 1 (3) |
| Outer spacing, right | **11** | 19 | 0 (standard) | **32%** | 40 (4), 1 (3), 30 (2), 20 (2) |
| Font size | **30** | 1,067 | 6 + 4 | **87%** | 1.5× (171), 1.25× (145), 1.5% of the width (133), 3% of the width (113) |
| Font | **4** | 872 | 3 | **100%** | Futura bold (585), Egyptienne (285) |
| Text colour | **19** | 862 | 11 | **97%** | gold (222 + 166 written differently), black (124), white (122) |
| Box / background colour | **10** | 52 | 10 | **100%** | gold (35 + 1), dark grey (7), dark gold (3) |
| Video border colour | **2** | 6 | 1 | **83%** | black (5), grey (1) |
| Text alignment | **4** | 506 | 2 | **99%** | left (480 + 14), centred (7), right (5) |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Layout, headline box, headline column and height, title and subline colour, stripe, framed, video background, phone layout, page intro switches | **Block options panel** (section 4) |
| Font size, font, text colour of words in the headline or the intro | the site-wide **text layer**: formatting and the **Text style panel**, the same choices in every block (section 5) |
| Inner and outer spacing | **no setting**: the hero's standard spacing |

---

## 3. The layouts (one per hero, required)

The layout is the first choice when adding the block.

### 3.1 Image slide (`image-slide`)

A full-width image with a headline over it, optionally in a box, and a button. It is the stryker.com
single-slide carousel, at the top of a page or in the body; 41 in-body banners look the same and use the
same layout.

| | |
|---|---|
| Heroes on the live site | **437** on 408 pages |
| Example pages | [XPR restraints](https://www.stryker.com/us/en/emergency-care/products/xpr-restraints.html), [Craniomaxillofacial](https://www.stryker.com/us/en/craniomaxillofacial.html), [Packaging for a better planet](https://www.stryker.com/us/en/about/news/features/packaging-for-a-better-planet.html) |

The mid-page banners (a wide image with a text box on one side, 57 on 54 pages, and with the text in
the top half, 17 on 12 pages) are image slides too: the box width becomes the nearest column, the side
the left or right column, the shadow the *Framed* switch and the "text top" banners *Text above the
image* on phones. Examples: [S3 bed](https://www.stryker.com/us/en/acute-care/products/s3.html),
[ACFAS 2018](https://www.stryker.com/us/en/c/2018/acfas.html),
[IT terms](https://www.stryker.com/us/en/legal/it.html).

### 3.2 Page intro (`page-hero`, new)

The top of product, specialty and landing pages: the title, a subhead and short copy on the left, an
image on the right, a thin grey rule underneath. On phones the image goes under the text. The title is
Futura bold 28px, gold; the subhead Egyptienne light 24.5px; the copy the normal text.

| | |
|---|---|
| Heroes on the live site | **494** (page hero 481 + hero 13), and **164** without an image |
| Example pages | [Awards](https://www.stryker.com/us/en/about/awards/awards.html), [Reprocessed HARMONIC](https://www.stryker.com/us/en/sustainability/products/harmonic.html), [Stryker's Women's Network](https://www.stryker.com/us/en/about/corporate-responsibility/i/stryker-womens-network.html) (no image) |

This replaces the `page-intro` rows that the earlier import wrote as two columns (801 rows, see the
Columns chapter): the page intro is a hero, not a row of columns.

### 3.3 Tagline band (`tagline-band`)

A coloured band with the page title (Futura bold) and a message (Egyptienne light), in the page width.

| | |
|---|---|
| Heroes on the live site | **1** visible (and 1 hidden on its live page), plus the media inquiries page whose gold-gradient band comes from its page template |
| Example pages | [Contact](https://www.stryker.com/us/en/about/contact.html), [Recall](https://www.stryker.com/us/en/about/contact/recall.html), [Media inquiries](https://www.stryker.com/us/en/about/contact/media-inquiries.html) |

### 3.4 Large header (`large-header`)

The page title in Futura bold, flush under the site header, above a carousel.

| | |
|---|---|
| Heroes on the live site | **6** on 6 pages |
| Example pages | [Rotator cuff repair](https://www.stryker.com/us/en/sports-medicine/procedures/Rotator_Cuff_Repair.html), [ASSH 2019](https://www.stryker.com/us/en/c/2019/ASSH.html) |

### 3.5 Long text (`long-text`)

A subheading, a title, a description and paragraphs beside an image, half and half; on phones the image
is hidden.

| | |
|---|---|
| Heroes on the live site | **5** on 5 pages (4 with an image) |
| Example pages | [History](https://www.stryker.com/us/en/about/history.html), [iSuite live video](https://www.stryker.com/us/en/communications/products/isuite-live-video.html) |

---

## 4. The options (Block options panel)

### 4.1 Headline box (image slide)

The colour names are the same as in Panel, Columns and Cards, so authors see one colour list everywhere.
On blue, dark grey and the blue and purple gradients the text is white by default.

| Choice | Option | Slides |
|---|---|---|
| None (text on the image) | — | 343 |
| Gold | `box-gold` | 46 |
| White | `box-white` | 37 |
| Dark grey | `box-dark` | 4 |
| Gold gradient | `box-gold-gradient` | 3 |
| Blue gradient | `box-blue-gradient` | 3 |
| Blue | `box-blue` | 1 |
| Light grey | `box-gray` | 1 |
| Purple gradient | `box-purple-gradient` | 1 |

### 4.2 Headline column and height (image slide)

| Group | Choices | Slides |
|---|---|---|
| Column | Left (about 45% wide) `text-left`, Right (about 40%) `text-right`, Wide (almost full width) `text-wide` | 326, 26, 54 |
| Height | Top (5%) `text-top`, Upper (18%) `text-upper`, Middle (30%) `text-middle`, Lower (45%) `text-lower` | 123, 173, 50, 18 |

Every stryker.com position takes the nearest column and height. A headline too tall for the space below
its height moves up, so it always stays inside the banner.

### 4.3 Title and subline colour (image slide)

The colour of all bold words (title) or all plain words (subline) of the headline, so the headline needs
no colour in its text. A Text style colour on a word still wins.

| Group | Choices | Slides |
|---|---|---|
| Title colour | Gold `title-gold`, White `title-white`, Light grey `title-light-gray`, Blue `title-blue` | 59, 10, 4, 1 (others: black, the default) |
| Subline colour | Gold `subline-gold`, White `subline-white`, Light grey `subline-light-gray`, Blue `subline-blue` | 2, 13, 12, 0 |

### 4.4 Stripe, framed banner, video background (image slide)

| Choice | Option | Slides |
|---|---|---|
| Gold stripe under the slide | `stripe-gold` | 27 |
| Gold gradient stripe | `stripe-gradient` | 8 |
| Framed, with shadow (in the page width, not full width) | `framed` | 32 (page-top) + the mid-page banners with a shadow (34) |
| Video background (the video in the first row plays muted and looping) | `video-background` | 68 on 66 pages |

### 4.5 On phones (image slide)

| Choice | Option | Slides |
|---|---|---|
| Text over the image (default, with a phone image) | — | |
| Text below the image | `mobile-below` | 109 |
| Text above the image (the "text top" banners) | `mobile-above` | 17 |
| Black text | `mobile-text-black` | 33 + 2 mid-page banners |

**Without a phone image** (181 slides), phones show the desktop image with the text below it, as
stryker.com does. (The earlier hero hid the image on phones.)

### 4.6 Tagline band colour

| Choice | Option | Bands |
|---|---|---|
| Gold (default) | — | 1 |
| Purple gradient | `purple-gradient` | 1 |
| Gold gradient (media inquiries) | `gold-gradient` | 1 (from the page template) |

### 4.7 Page intro switches

| Choice | Option | Intros |
|---|---|---|
| No image (the title, subhead and copy alone) | `no-image` | 164 |
| No grey rule | `no-rule` | 20 |
| Black title (instead of gold) | `title-black` | 2 |

Following the authoring conventions, a gold title is a Heading 1 in italic and a black one a plain
Heading 1, so `title-black` is only needed when an italic title must stay black (section 10).

**Earlier names keep working.** Imported pages written before (`gold-box`, `white-box`, `blue-box`,
`gray-box`, `dark-box`, `text-below`) show in the panel as the new choices. The free positions
(`top-15`, `left-56`, `right-10`, `size-2`) show as other options until the page is re-imported or the
author picks a column and height.

---

## 5. Text inside the hero (Text style, not Block options)

Colour, size and font of **a few words** are set with the site-wide **Text style panel**, the same in
every block: the panel wraps the words in a pair of markers written in the text, for example
`:start-hl3:Craniomaxillofacial:end:`. On the page the markers disappear and the words take the look. For
Hero there is no *Text look* group: everything inside the headline or the intro is Text style.

| Setting | Choices |
|---|---|
| Headline size (grows with the screen) | S 1.5, M 2, L 3, XL 4.5 (% of the width): stryker.com's banner sizes, 1% to 9% of the width, join the nearest (2.5% joins L) |
| Text size | normal, 0.8×, 1.25×, 1.5×, 1.75×, 2×, 2.5× |
| Font | body, serif (Egyptienne), sans (Futura bold); in a banner, bold words are Futura bold and plain words Egyptienne light |
| Text colour | the 8 brand colours and black, mid grey, dark gold, pale grey |

A headline line without a size keeps stryker.com's line size (21px on phones, 14px on wide screens). The
title and subline colour options (section 4.3) colour whole headlines; Text style colours single words.
Rare title, subline and phone text colours (purple, teal, mid grey, pale grey: 9 slides) are Text style
colours.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Layout | 9 components and variants | 5 layouts | **100%** keep their layout |
| Headline position | 189 combinations | 3 columns × 4 heights | **93%** within 10% of today; 72% within 5% (banner walkthrough) |
| Headline box colour | 10 values | 10 named colours | **100%** |
| Inner and outer spacing | 8–12 values per side | the standard spacing | **95%–99%** (outer right: 32%, section 7) |
| Font size, font, text colour | 30 / 4 / 19 values | the text layer | **87%** / **100%** / **97%** |
| Phone layout | over, below, above, black text | 3 + 1 | **100%** |

**What moves more:** the font sizes (87% kept), because stryker.com banner headlines use 17 sizes in
percent of the width that join 4 headline steps; and the outer spacing on the right, where most values
are a wide right margin (40%, 30%, 20%) that the named column replaces.

**Checked on the review page:** 29 of 38 measured lines match stryker.com exactly on desktop and 29 of
39 on phones; 8 more move by one headline or text step by design. Details in *Review status* at the end.

---

## 7. To review (outliers)

These heroes don't fit a choice exactly. They take the nearest choice unless the business decides
otherwise.

| What | Heroes | Proposal |
|---|---|---|
| Headline moves more than 10 points when snapped to the 3 columns × 4 heights | 25 slides | accept, or add one more column (`text-narrow`, about 33%) |
| Text column 25%, 33% or 66% wide (framed banners) | 6 slides | the nearest column (left or wide) |
| Mid-page banner box widths (1/4 3, 1/3 16, 1/2 20, 2/3 14, full 4) | 57 banners | 1/4 to 1/2 → left (or right with the box on the right), 2/3 and full → wide |
| CTA button in grey, teal or purple | 12 slides | the button follows the authoring conventions (gold or teal); section styles for other colours to decide |
| Rare title, subline or phone text colours (purple, teal, mid grey, pale grey, gold on phones) | 9 slides | Text style colours |
| Slide without a desktop image | 5 slides | review: the image is missing on stryker.com |
| Video border colour grey | 1 video | black, the one video border colour |
| A wide right outer margin (40%, 30%, 20%) | 8 heroes | the named column |
| Centred (7) or right-aligned (5) hero text | 12 heroes | left, the default (the alignment is not a Hero option) |

---

## 8. What we did not carry over, and why

| Not carried over as a Hero option | Where it goes instead |
|---|---|
| Font size, font and text colour of headline words | the site-wide **text layer** (Text style, section 5); the migration writes them as Text style markers, for the review pages only until the business approves |
| Free headline positions in percent | the nearest of 3 columns × 4 heights |
| Inner and outer spacing in percent | the hero's standard spacing |
| Carousels with several slides (17 carousels, 57 slides) and the split slides (13) | a separate block, **Carousel (corp)**, whose slides reuse the image slide options |
| Hidden taglines (11, `hideTagLineComp`) | not migrated (not shown on the live site) |
| The page title of framed banners hidden in white (35 pages) | the page title metadata; the 4 visible gold titles above the image are a Heading 1 before the block |
| Section text sizes `title-N` / `subline-N` from the banner walkthrough | Text style markers on the headline words, the same everywhere |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Five layouts and named choices instead of free positions, sizes and colours | 25 banners move more than 10 points (section 7) |
| One colour list across Hero, Panel, Columns and Cards | Headline sizes join 4 steps: a 2.5% headline is drawn at 3% |
| The page intro becomes one hero layout instead of a row of columns | Authors learn one rule: whole hero in Block options, a few words in Text style |
| Phones show the desktop image when there is no phone image, as on stryker.com | |
| The panel shows only the choices that fit the selected layout | |

---

## 10. Decisions we need from the business

**To approve:**

1. The five layouts, including the new **page intro** (`page-hero`) for the 494 page intros (and 164
   without an image), in place of the two-column `page-intro` rows.
2. In-body single-slide banners (41) use the same image slide as page-top ones.
3. **Framed** banners (`framed`) for the 32 framed heroes and the mid-page banners with a shadow, the
   mid-page banners as image slides, and **Text above the image** on phones for the "text top" banners.
4. Phones show the desktop image when a slide has no phone image (181 slides).
5. **Video background** on image slides (68).
6. The media inquiries band as a tagline band with the **gold gradient**.
7. Removing the review-only gate (section *Review status*).

**Still open (from the analysis):**

- `text-narrow` (about 33%) as a fourth column for the 25 banners that move more?
- CTA buttons in grey, teal or purple (19): section styles like the blue one, or gold?
- Large header on the 2 pages whose carousel has no slides: keep the block, or a plain Heading 1?
- Page intros with a black title (8 on the export, 2 visible): a plain Heading 1 (the conventions) or the
  `title-black` switch?
- Page intros whose image is the page thumbnail (157): the migration copies the thumbnail in.
- The framed banners' hidden page titles (35) and the `location` property without a visible effect.

---

## Glossary

| Term | Meaning |
|---|---|
| Hero | the block at the top of a page (or a banner in the body) |
| Image slide | a wide image with a headline over it |
| Page intro | title, subhead and copy beside an image, with a grey rule below |
| Headline box | a coloured box behind the headline of an image slide |
| Column, height | where the headline sits on the image: 3 columns, 4 heights |
| Title, subline | the bold and the plain words of a banner headline |
| Framed | a banner in the page width with a soft shadow, instead of full width |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text layer, Text style | fonts, sizes and coloured words, set with formatting and the Text style panel, the same on every block |
| Text style marker | the pair `:start-…:` / `:end:` the Text style panel writes around a few words; hidden on the page |
| Headline step | one of the 4 headline sizes (S, M, L, XL) that grow with the screen width |

## Which choices fit which hero

The Block options panel reads the selected hero and shows only the choices that fit it; a choice or a
whole group that would do nothing is not shown. Hovering a choice shows what it does.

| Needs | Choices |
|---|---|
| The image slide layout | Headline box, Headline column, Headline height, Title colour, Subline colour, Stripe, Banner (framed, video background), On phones, Phone text |
| A video link in the first row | Video background |
| The tagline band layout | Band colour |
| The page intro layout | No image, No grey rule, Black title |
| Text in the hero | Tagline band, Large header, Long text, Black text, Black title |

## Review status (draft pages only)

While the standardisation is reviewed, the new Hero rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: the five layouts with their named options, the page
intro, the framed banner, the phone image fallback and *Text above the image*, and the headline text with
Text style markers. stryker.com pages imported today keep their free positions and sizes
(`top-15 left-56 right-10 size-2 …`, about 1,000 heroes) and render exactly as before; patients pages are
not touched.

The migration works the same way: the named options, the page intro layout and the Text style markers
are written only by a review build used for the draft pages. A normal re-import of a real page gives
exactly the same output as before (compared file by file on Craniomaxillofacial, Awards, About
Interventional Spine and the AED back-to-school feature), and the heroes on the pages imported today
render exactly as before (checked element by element on six pages, desktop and phone).

**The review page** (`/drafts/astha/blocks/hero-corp`) has one section per layout and per choice (42),
each with a real stryker.com hero and its source page; a choice its page doesn't use is shown on another
real slide and says so.

**Result of the check (desktop 1440 and phone 390):** every headline box, band and gradient keeps its
exact stryker.com colour, and the page intro, tagline band, large header and long text match exactly.

| What | Matches stryker.com |
|---|---|
| Text colour, font and size (each line measured) | **29 of 38** lines on desktop, **29 of 39** on phones |
| Lines one headline or text step away, by design | 8 on desktop, 8 on phones |

The lines that differ:

- **By design (one step):** stryker.com headline sizes between two steps join the nearest one (2.5% of
  the width → L on Craniomaxillofacial and Climate and the environment; 3.5% → L on the CR hub; 4% and
  6% → XL on Endoscopy), and the 3.5 times text of MOLLI joins 2.5 times (the largest text step).
- **XPR restraints:** the title is drawn at 49px on desktop (42px on stryker.com): two nested sizes on
  the source become 2 times the heading. Same on phones (42px). Open point for the migration.
- **On phones:** the framed banner's line is 24.5px (21px on stryker.com), and the *hero* component's
  subhead (HARMONIC) keeps the page intro's 24.5px where stryker.com shrinks it to 14px: one page intro
  look for both components.
- Not counted: a serif line drawn at the font's one weight (400 where stryker.com asks 500, which looks
  the same); two lines where the measurement found another text with the same words on stryker.com.

**Corrections made by hand on the review page**, all open points for the migration:

- The gold headline box of XPR and MOLLI is a rich-text box on stryker.com that the page migration
  unwraps before the hero reads it (MOLLI's title also loses its black).
- The stripe under the Donations and Annual review slides, and the Endoscopy background video, are
  removed or moved by the page migration before the hero reads them.
- The framed banner's image is moved out of the banner by the page migration (also in today's import),
  and its hidden page title is not banner text.
- The Craniomaxillofacial education slide: stryker.com holds its copy twice (one copy hidden) and colours
  one word gold; the review page keeps one copy and the gold word.
- The CR hub slide's last line stays black beside the gold sublines (a Text style colour).
- The line break after "Endoscopy" (a break inside the bold title on stryker.com) is lost on import.
- Tagline bands, large headers and long-text heroes are not imported yet: their text is copied from
  stryker.com. The page intro's copy keeps its footnote numbers as plain text.
