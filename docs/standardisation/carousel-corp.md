# Carousel: rotating slides, one standard speed

*A walkthrough of the Carousel block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the carousels shown on the live site are counted: 17 carousels of image slides (57 slides) and 13
split slides on 4 pages.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a carousel rotates 2 to 5 slides: full-width image slides with a headline (product and landing pages), or split slides with an image beside a title on a coloured band (event pages of 2018–2019). Each carousel had its own speed, transition and looping. |
| **The risk** | Six different speeds, two transitions and optional looping for what is one behaviour; and the image slides would need their own copy of the banner's headline settings. |
| **What we did** | We counted every carousel. A carousel is now a **run of sections**, one section per slide, with the section style `carousel`. Each image slide is a **Hero (corp) image slide** with the banner's own Block options, so banners and slides share one list of choices. The carousel keeps two switches (autoplay, fade), one standard speed and always loops. |
| **The result** | Carousels look and move as today. On the review page the slides match stryker.com in size (480px high at 1440, as the source), headline colours and fonts, the split band colours, title and link styles, arrows on desktop and dots on phones. Headline sizes follow the 4 headline steps. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a carousel, how many different values stryker.com uses today, and the named choices on
the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, bottom | **1** | 6 | 4 | **100%** | 4 (6) |
| Outer spacing, bottom | **1** | 3 | 0 (standard) | **100%** | 7 (3) |
| Font size | **14** | 77 | 6 + 4 | **82%** | headline 2.5 (11), 1.25× (9), headline 1.5 (8), 1.75× (8) |
| Font | **2** | 59 | 3 | **100%** | Futura bold (44), Egyptienne (15) |
| Text colour | **8** | 66 | 8 | **100%** | gold (23 + 11 written differently), black (10 + 7) |
| Text alignment | **2** | 33 | 2 | **100%** | left (31 + 2) |
| Carousel speed | **6** speeds (2.5 to 10 s) | 17 carousels | 1 standard speed (5 s) | (by design) | 5 s (3), 7 s (3), 3.977 s (2) on the 12 autoplay carousels |

The text settings belong to the slides' text: fonts, sizes and colours are the site-wide **Text style**, and
the headline position, box and colours are the Hero (corp) image-slide choices.

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| One slide | a section with the style `carousel`; consecutive `carousel` sections are one carousel |
| The slide's image, headline position, box, title colour, phone layout | the slide's **Hero (corp)** block, in the **Block options panel** (hero chapter) |
| Autoplay, fade, split slides | section styles on the slides: `autoplay`, `fade`, `split` |
| The band colour of a split slide | a section style on that slide: `box-purple-gradient` (default), `box-blue-gradient`, `box-dark` |
| Fonts, sizes and colours of words | the site-wide **Text style** |

---

## 3. The variants on stryker.com

### 3.1 Image slides (`carousel`)

A rotating carousel of 2 to 5 full-width image slides, each a banner with its own headline. Arrows on the
sides on desktop (a thin white chevron, 14px in from the edge), dots under the slide on phones.

| | |
|---|---|
| Carousels on the live site | **17** on 17 pages (57 slides) |
| Slide options used today | headline column left 42, height upper 19, title gold 12, height top 11, text below on phones 7, height middle 6, white box 4, wide column 3, purple gradient box 3, subline white 3, height lower 1, title white 1 |
| Example pages | [Augment](https://www.stryker.com/us/en/foot-and-ankle/products/augment.html), [OnSite](https://www.stryker.com/us/en/services-and-solutions/onsite.html), [LIFEPAK 35](https://www.stryker.com/us/en/emergency-care/products/lifepak-35.html) |

Each slide uses the **same options as a single banner** (Hero (corp) image slide), so a slide's headline
can sit higher or lower than the next one, as on stryker.com (Augment: upper, then top).

### 3.2 Split slides (`split`)

Rotating slides with the image on one side and a white Egyptienne title (56px, 24px on phones), a Futura
subtitle and a gold link on a coloured band. The band is 370px high in a 490px slide and the image stands
20px above and below it. Arrows in a small gold box at both edges, on desktop and phones.

| | |
|---|---|
| Slides on the live site | **13** on 4 event pages (2018–2019) |
| Band colours | `box-purple-gradient` 7, `box-blue-gradient` 3, `box-dark` 3 |
| Example pages | [Malis forceps](https://www.stryker.com/us/en/nse/products/malis-disposable-non-stick-bipolar-forceps.html), [ACFAS 2018](https://www.stryker.com/us/en/c/2018/acfas.html), [AOFAS 2018](https://www.stryker.com/us/en/c/2018/aofas2018.html), [ACFAS 2019](https://www.stryker.com/us/en/c/2019/acfas.html) |

Each split slide is a **Columns** row (text | image, or image | text) in the slide's section; the
image comes first on phones, as on stryker.com.

---

## 4. The options (section styles on the slides)

The carousel has no block of its own in the document: its choices are section styles on the slide
sections, set in each slide's Section Metadata (the Block options panel offers block choices only; the
slides' Hero (corp) choices are in the panel).

### 4.1 Autoplay

| Choice | Style | Carousels on stryker.com |
|---|---|---|
| The slides move on by themselves | `autoplay` | **12** of 17 |

One standard speed, **5 seconds**, replaces the 6 speeds of today (2.5 s 1, 3.977 s 2, 5 s 3, 6.5 s 1, 7 s
3, 10 s 1). Autoplay stops while the pointer or keyboard focus is on the carousel, and does not start
for visitors who ask their device for reduced motion. Imported names such as `autoplay-2500` read as
`autoplay`.

### 4.2 Transition

| Choice | Style | Carousels on stryker.com |
|---|---|---|
| Slide (default) | none | 9 |
| Cross-fade | `fade` | **8** |

### 4.3 Loop

Always on: after the last slide comes the first (10 of 17 carousels loop today; the others stop at the
last slide). No choice.

### 4.4 Split slides and band colour

| Choice | Style | Slides on stryker.com |
|---|---|---|
| Split slides | `split` (or a band colour) | 13 |
| Purple gradient band (default) | `box-purple-gradient` | 7 |
| Blue gradient band | `box-blue-gradient` | 3 |
| Dark grey band | `box-dark` | 3 |

The band colours are the same names as the boxes in Hero, Panel and Cards. Imported names
(`bg-dark-purple-gradient`, `bg-dark-blue-gradient`, `bg-dark-gray`, `banner`) read as these.

---

## 5. The text on the slides (Text style, not Block options)

Words in a different size, colour or font on a slide use the site-wide **Text style**, with the same
limited sets as every block: text sizes normal, 0.8×, 1.25×, 1.5×, 1.75×, 2×, 2.5×; headline sizes S 1.5,
M 2, L 3, XL 4.5 (% of the screen width); the 8 brand colours plus black, mid grey, dark gold and pale grey.
The split slides' title, subtitle and link look is the variant's own (white Egyptienne title, Futura
subtitle, gold Futura bold link), so authors write them as a heading, a paragraph and a link.

---

## 6. How close is it to stryker.com?

Checked on the review page against the live pages at 1440 and 390 wide.

| What | stryker.com | Review page | How close |
|---|---|---|---|
| Image slide height (Augment, 1440) | 480px, full width | 480px, full width | **same** |
| Arrows (image slides) | thin white chevron 36 × 65, 14px in, desktop only | the same | **same** |
| Dots (image slides, phones) | 19px dots, gold when active, under the slide | the same | **same** |
| Headline colours and fonts | gold Futura bold, black Futura bold, black Egyptienne | the same | **same** |
| "Trust Augment" (5.5% headline) | 77px | 63px (XL, 4.5%) | one step, by design |
| "for all your hindfoot…" (2.5% headline) | 35px | 42px (L, 3%) | one step, by design |
| "Recommended more often than autograft." | 28px Egyptienne | 28px Egyptienne | **same** |
| LIFEPAK slide text | 35px white Futura bold in a purple gradient box | the same | **same** |
| Split band | dark grey → plum gradient, 370px in a 490px slide | the same; slide 504px (Malis), 495px (ACFAS) | within 14px |
| Split title / subtitle / link | 56px (24px on phones) white Egyptienne / 17.5px white Futura / 14px gold Futura bold uppercase | the same | **same** |
| Split arrows | gold box 35 × 25 at both edges, desktop and phones | the same | **same** |
| Speed | 6 values | 5 s | by design |

**What moves more:** the text column of an image-first split slide starts 64px further right at 1440 (the
Columns gap), and on phones the ACFAS text sits 13px further in. The headlines between two steps move by
one step, as everywhere.

---

## 7. To review (outliers)

| What | Carousels / slides | Example pages | Proposal |
|---|---|---|---|
| Speeds other than 5 s | 8 autoplay carousels (2.5 s 1, 3.977 s 2, 6.5 s 1, 7 s 3, 10 s 1) | [Augment](https://www.stryker.com/us/en/foot-and-ankle/products/augment.html) (2.5 s), [ProCare](https://www.stryker.com/us/en/services-and-solutions/procare.html) (10 s) | 5 s |
| Carousels that stop at the last slide | 7 | [Core 2 console](https://www.stryker.com/us/en/nse/products/core-2-console.html), [Complex instability](https://www.stryker.com/us/en/sports-medicine/procedures/complex-instability.html) | always loop |
| Slide headline positions more than 10 points from a named position | 2 carousels (product security: 12, LIFEPAK: 13 and 20) | [Product security](https://www.stryker.com/us/en/about/governance/product-security.html), [LIFEPAK 35](https://www.stryker.com/us/en/emergency-care/products/lifepak-35.html) | nearest position (hero chapter) |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| A free speed per carousel | one standard speed (5 s) |
| "Stop at the last slide" | always loop |
| A carousel block holding the slides' content | a run of slide sections (no blocks inside blocks); each slide keeps its own Hero (corp) or Columns block |
| Slide headline settings of their own | the Hero (corp) image-slide choices, one list for banners and slides |
| Fonts, sizes and colours of the slide text | the site-wide **Text style** |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One list of headline choices for banners and slides | A carousel is several sections, which authors need to know |
| Two switches instead of speed, transition and loop settings | 8 carousels change speed |
| Slides keep their own headline position, as on stryker.com | The carousel's switches are section styles, not in the Block options panel |
| Autoplay respects reduced motion and pauses on hover and focus | |

---

## 10. Decisions we need from the business

**To approve:**

1. Carousels as a run of `carousel` sections, each slide a Hero (corp) image slide (the package's
   proposal), rather than reducing them to their first slide.
2. One standard speed (5 s) and always loop.
3. The split slides as a carousel variant (`split`), rather than turning each slide into a Columns row in a
   coloured section. They are 13 slides on 4 event pages from 2018–2019.
4. Removing the review-only gate (section *Review status*).

**Proposed, still open:**

- The carousel switches (autoplay, fade, split, band colour) are now in the *Section* area of the Block
  options panel (in review): it copies them to paste into each slide's Section Metadata.
- The migration of split slides: today's import already writes them as `carousel` sections with a band
  colour; the review build does not yet read the stryker.com hero-large-carousel itself.

---

## Glossary

| Term | Meaning |
|---|---|
| Carousel | rotating slides, one shown at a time, with arrows and dots |
| Slide | one section with the style `carousel` |
| Image slide | a full-width image with a headline: a Hero (corp) image-slide block |
| Split slide | an image beside a title on a coloured band: a Columns row in a `split` slide |
| Autoplay | the slides move on by themselves every 5 seconds |
| Fade | slides cross-fade instead of sliding |
| Band | the coloured background of a split slide |

## Which choices fit which carousel

| Needs | Choices |
|---|---|
| Image slides (Hero (corp) image slides) | the Hero (corp) headline choices per slide; `autoplay`, `fade` |
| Split slides (Columns rows) | `split` and a band colour per slide; `autoplay`, `fade` |

## Review status (draft pages only)

While the standardisation is reviewed, `carousel` sections become a carousel **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews. stryker.com pages imported today (215 files carry the
`carousel` section style) render exactly as before, with their slides one under the other; patients pages
are not touched.

The migration works the same way: only a review build used for the draft pages writes a carousel of several
slides as one `carousel` section per slide (with `autoplay` and `fade` from the source). A normal re-import
of a real page gives exactly the same output as before (compared file by file on Augment, LIFEPAK 35 and the
ambulatory surgery centers feature).
