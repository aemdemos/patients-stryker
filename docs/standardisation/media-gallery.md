# Media Gallery: one gallery and a 360° spin

*A walkthrough of the Media Gallery block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 17 galleries shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Some stryker.com product, caregiver-story and employee-network pages show **photo galleries**: a large photo and a strip of small square thumbnails under it, with arrows when the strip doesn't fit. One page (RISE) shows a product **all round** (a 360° spin). The photos are not in the page: each gallery points to a *set* kept in Dynamic Media (the image library), which the page's Dynamic Media viewer reads. |
| **The risk** | Copying the Dynamic Media viewer means an outside script with its own look on every gallery page; turning the galleries into single pictures loses the photos. |
| **What we did** | We counted every gallery on the live site and kept what a visitor sees: the large photo, the thumbnail strip and its arrows, and the spin. The migration reads each set and writes its photos into the page, one per row, so authors see and can reorder them. The **Media Gallery** block draws the gallery itself (no outside viewer), and the **Block options panel** offers its two types. |
| **The result** | Galleries look as today. On the review page the thumbnails are the same size and spacing as on stryker.com (56px squares, 66px apart, the selected one framed darker), the arrows sit at the same places, and as many thumbnails show between them. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Gallery type | 3 (mixed media 15, image set 1, spin set 1) | 17 | 2 (gallery, `spin-set`) | **100%** | mixed media and image sets look the same: a photo and a thumbnail strip |
| Style choices | none | 17 | none | **100%** | the package: "no style choices" |
| The photos | a set in Dynamic Media | 17 | one row per photo in the page | **100%** | read from the set while importing |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Gallery or 360° spin | **Block options panel** |
| The photos and their order | the block: one row per photo (a Dynamic Media image link) |
| A gallery beside its text | a **side-by-side section** (section style `flex`), as every block beside text |

---

## 3. The variants on stryker.com

### 3.1 Gallery (mixed media sets and image sets)

The selected photo the width of its column, keeping the first photo's shape (a portrait photo sits in the
middle). 20px under it, a strip of square thumbnails (56px, 66px apart, a thin light grey frame, darker on the
selected one), centred. When they don't fit, a grey arrow at each end and the thumbnails that fit between
them, a page at a time; the arrow at an end is lighter.

| | |
|---|---|
| Galleries on the live site | **15** mixed media sets on 12 pages, and **1** image set |
| Example pages | [Adherus](https://www.stryker.com/us/en/craniomaxillofacial/products/adherus.html), [Caregiver stories](https://www.stryker.com/us/en/acute-care/c/caregiver-stories.html), [SAAN](https://www.stryker.com/us/en/about/corporate-responsibility/i/the-stryker-african-american-network--saan--.html), [SAFE](https://www.stryker.com/us/en/about/corporate-responsibility/i/strykers-allies-for-equality-safe.html) (image set) |

On stryker.com every "mixed media" set holds photos only (the videos on those pages are separate video
players, which become Video blocks), so a mixed media set and an image set are the same gallery.

### 3.2 360° spin (`spin-set`)

One product photographed all round (17 photos for RISE). The photo the width of its column; dragging it, the
two arrows under it or the keyboard arrows turn the product.

| | |
|---|---|
| Spins on the live site | **1** |
| Example page | [RISE](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity/or-integration/rise.html) |

## 4. The options (Block options panel)

### 4.1 Type

| Choice | Option | Galleries |
|---|---|---|
| Gallery (default) | none | 16 |
| 360° spin | `spin-set` | 1 |

Older imported names read as the gallery: `mixed-media` and `image-set`.

## 5. The text (Text style, not Block options)

A gallery has no text of its own. The text beside it (Caregiver stories: the story's title and copy) is
normal text with **Text style**, as in every block.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Thumbnails | 56px squares, 66px apart, frame #ddd, selected #666 | the same | **100%** |
| Strip | 20px under the photo; arrows 56px, 2px from each end; the thumbnails that fit between them, centred | the same (8 thumbnails between the arrows in a half-width column at 1,440px) | **100%** |
| Thumbnails that fit, no arrows | centred (SAFE 4, Adherus 2) | the same | **100%** |
| Photo | the width of its column, the set's first photo's shape | the same | **100%** |
| Spin arrows | two 28px arrows, centred under the photo | the same | **100%** |

**Checked on the review page.** The Media Gallery review page holds five stryker.com galleries (Adherus,
Caregiver stories, SAFE, SAAN from its set link, RISE), measured on both sites at 1,440px and 390px.

**What differs, by design:**

- **Column width**: a gallery beside text is half the page as on stryker.com, with the site's standard
  gutter (675px wide at 1,440px instead of 705px), so its photo is 450px high instead of 470px.
- **On phones** the gallery keeps the page's side margins (stryker.com runs it edge to edge), so 3
  thumbnails fit between the arrows instead of 4.
- **Zoom and full screen**: stryker.com's viewer has zoom buttons, a zoom on hover and a full-screen button.
  They are not carried over (section 8).
- **Gallery width**: the SAFE gallery sits in a two-thirds column on stryker.com; the review import writes it
  full width.

---

## 7. To review (outliers)

| What | Galleries | Example pages | Proposal |
|---|---|---|---|
| 360° spin | 1 | [RISE](https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity/or-integration/rise.html) | keep it as a spin (`spin-set`), or show one still photo (the package's open question) |
| Gallery in a two-thirds column | SAFE | [SAFE](https://www.stryker.com/us/en/about/corporate-responsibility/i/strykers-allies-for-equality-safe.html) | a side-by-side section `flex-67-33` with the text beside it |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The Dynamic Media viewer (an outside script) | the block draws the gallery itself |
| Zoom (buttons, zoom on hover) and full screen | nothing: the photo shows at the column's width; to add later if the business wants it |
| The set as the only list of photos | the photos are written in the page, one per row (a block holding only the set's link still shows the set, for sets that change in Dynamic Media) |
| Older imports of the same galleries as `gallery-corp` (on 6 product pages) | the same rows (one Dynamic Media image link per row) work in the Media Gallery block; they render as Media Gallery when the block name is changed or the page is imported again |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Two types, no style choices | No zoom or full screen |
| The photos are in the page: authors see, reorder and remove them | A photo added to the set in Dynamic Media later doesn't appear until it is added to the page (or the block keeps the set link) |
| No outside viewer script | On phones one thumbnail fewer fits |

---

## 10. Decisions we need from the business

**To approve:**

1. A Media Gallery block drawn by the site (not the Dynamic Media viewer), with the photos written in the
   page, and its two types.
2. No zoom and no full screen.
3. Removing the review-only gate (section *Review status*).

**Proposed, still open (from the package):**

- **Build a gallery block, or embed the Dynamic Media viewer?** The proposal is the block: the same look,
  no outside script, and the photos visible to authors. Someone no longer has to resolve each set by hand:
  the migration reads it.
- **The 360° spin (1 page): keep a spin or a still photo?** The proposal keeps the spin.

---

## Glossary

| Term | Meaning |
|---|---|
| Gallery | a large photo with a strip of thumbnails under it; clicking a thumbnail shows its photo |
| Thumbnail | a small square copy of a photo |
| 360° spin | photos of one product taken all round, shown one at a time to turn it |
| Set | a list of photos kept in Dynamic Media (the image library) |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Side-by-side section | a section that places a block next to other content (`flex`) |

## Which choices fit which gallery

The Block options panel reads the selected gallery and greys out the choices that would do nothing.

| Needs | Choices |
|---|---|
| Photos in the block | 360° spin |
| Any gallery | Gallery |

## Review status (draft pages only)

While the standardisation is reviewed, the Media Gallery block renders **only on draft pages** (`/drafts/…`)
and in the authoring panels' previews. No stryker.com page imported today uses it (the older `gallery-corp`
blocks are untouched), so nothing else changes; patients pages are not touched.

The migration works the same way: today's migration leaves the Dynamic Media galleries out of the page.
Only a review build used for the draft pages writes each gallery as a Media Gallery block, reading the
photos of its set (or, if the set can't be read, its set link), in a side-by-side section when it sits
beside text. A normal re-import of a real page gives exactly the same output as before (compared file by
file on Adherus, Caregiver stories, SAAN, SAFE and RISE).
