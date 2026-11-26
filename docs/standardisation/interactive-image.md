# Interactive Image: an image with lettered hotspots

*A walkthrough of the Interactive Image block for business, content and design teams. No technical
knowledge needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)):
measure what stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 5 interactive images shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | A few stryker.com pages (the ASC operating, pre-operative and post-operative rooms, Isolibrium, NSE) show a large picture with **lettered products**. The letters are part of the picture; on three pages each letter is also a **hotspot**: a round white ring over the letter that opens the product's page. The hotspots are kept in Dynamic Media (the image library) with the picture, not in the page. |
| **The risk** | Copying the Dynamic Media viewer means an outside script for 5 pictures; a plain picture loses the links. |
| **What we did** | We kept what a visitor sees: the picture, and a ring over each letter that opens its product. The migration reads the hotspots from Dynamic Media and writes them into the page, one row per hotspot (letter, place, link), so authors see and can change them. The **Interactive Image** block draws them itself. |
| **The result** | The pictures look as today, with the rings in the same places (the centre of each Dynamic Media hotspot) and the same size on desktop (56px). |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Interactive image | 1 (hotspots) | 5 | 1 block, no options | **100%** | the package: "no style choices" |
| Hotspots | in Dynamic Media | 20 on 3 images (11, 5, 4) | one row per hotspot in the page | **100%** | read from Dynamic Media while importing |
| Hotspot look | 1 (Dynamic Media's 56px white ring) | 20 | none | **100%** | |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| The picture | the block's first row (a Dynamic Media image link) |
| Each hotspot | a row: its letter, its place on the picture (across and down, in percent), its link |
| The list of products under the picture | normal text (as on stryker.com) |

---

## 3. The variant on stryker.com

### 3.1 Hotspots (`Interactive Image`)

The picture the width of its column; each hotspot a 56px white ring centred on its letter, brighter on
hover. A hotspot opens its product page. On phones the picture shrinks with the page and the rings keep
their 56px.

| | |
|---|---|
| Images on the live site | **5** on 5 pages; 3 with hotspots (20 hotspots) |
| Example pages | [Operating room](https://www.stryker.com/us/en/care-settings/asc/operating-room.html), [Pre-operative](https://www.stryker.com/us/en/care-settings/asc/pre-operative.html), [Post-operative](https://www.stryker.com/us/en/care-settings/asc/post-operative.html) |

## 4. The options (Block options panel)

None: stryker.com has one look for these pictures.

## 5. The text (Text style, not Block options)

The block has no text of its own; the letters are part of the picture. The list of products under the
picture (operating room: *A. Mako SmartRobotics* to *K. Fortress*) is normal text with **Text style**, as in
every block.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Hotspot places | the centre of each Dynamic Media area | the same, in percent of the picture | **100%** (e.g. A at 5.9% across, 80.8% down) |
| Hotspot look | 56px white ring (85%), white on hover | the same, drawn by the site | **100%** of the size; the ring is drawn, not the Dynamic Media icon |
| Links | the product pages | the same pages, on the new site | **100%** |
| Picture | the width of its column | the same | **100%** |

**Checked on the review page.** The Interactive Image review page holds the three stryker.com pictures with
hotspots (operating room with its product list, pre-operative and post-operative rooms), measured on both
sites at 1,440px and 390px: the 20 rings sit at the same places on the picture.

**What differs, by design:**

- **Width**: the picture is the site's content width (1,380px at 1,440px; stryker.com 1,410px).
- **Rings on phones**: stryker.com draws them much larger on phones, with a white disc that covers the
  letter (the package's phone screenshot); the block keeps the 56px ring, so the letter stays readable.
- **Zoom**: stryker.com's viewer zooms the picture on click; the block opens the product instead (as the
  rings do on stryker.com) and has no zoom.

---

## 7. To review (outliers)

| What | Images | Example pages | Proposal |
|---|---|---|---|
| Hotspots named "Hotspot 1" to "Hotspot 3" instead of a letter in Dynamic Media | 1 (post-operative) | [Post-operative](https://www.stryker.com/us/en/care-settings/asc/post-operative.html) | the letter cell shows that name; authors can write the letter |
| Interactive images without hotspots (the letters only) | 2 (Isolibrium, NSE) | [Isolibrium](https://www.stryker.com/us/en/acute-care/products/isolibrium.html) | a plain image, as today |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The Dynamic Media viewer (an outside script) | the block draws the rings itself |
| The hotspots kept only in Dynamic Media | one row per hotspot in the page |
| Zoom | nothing: the picture shows at its column's width |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One block, no options | A hotspot moved in Dynamic Media must be moved in the page too |
| The hotspots are in the page: authors see and change them | Places are written as numbers (percent across and down) |
| No outside viewer script | No zoom |

---

## 10. Decisions we need from the business

**To approve:**

1. An Interactive Image block with the hotspots written in the page (letter, place, link).
2. No zoom.
3. Removing the review-only gate (section *Review status*).

**Proposed, still open (from the package):**

- **A hotspot block, or a plain image followed by a lettered list of links?** The proposal is the block for
  the 3 pictures with hotspots (the lettered list stays as text under them, as on stryker.com), and a plain
  image for the 2 without.

---

## Glossary

| Term | Meaning |
|---|---|
| Hotspot | a round ring over a letter on the picture, which opens that product's page |
| Place | where a hotspot sits: how far across and down the picture, in percent |
| Dynamic Media | the image library that serves stryker.com's pictures |
| Block options panel | the editor panel where authors pick a block's choices from named options |

## Which choices fit

The block has no Block options.

## Review status (draft pages only)

While the standardisation is reviewed, the Interactive Image block renders **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews. No stryker.com page imported today uses it, so nothing
else changes; patients pages are not touched.

The migration works the same way: today's migration writes these pictures as plain images (without the
hotspots). Only a review build used for the draft pages writes a picture with hotspots as an Interactive
Image block, reading its hotspots from Dynamic Media. A normal re-import of a real page gives exactly the
same output as before (compared file by file on the operating, pre-operative and post-operative rooms and
Isolibrium).
