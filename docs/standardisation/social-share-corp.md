# Social Share: the share row, two switches

*A walkthrough of the Social Share block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 5 share rows shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Five stryker.com news pages show a **share row**: four small square icons (Facebook, LinkedIn, email, copy the page link). Authors could make the icons grey instead of their brand colours, and put the row on the right. |
| **The risk** | None to speak of: one look, two switches. The risk was losing the row: the news migration left it out. |
| **What we did** | The existing **Social Share** block (corp) keeps stryker.com's look; the two switches are choices in the **Block options panel** (*Grey icons*, *Right aligned*). The migration's review build writes the row where it stands in the article, with its switches. |
| **The result** | The rows look as today: on the review page every icon sits at the same place, in the same size and colour as on stryker.com, at 1,440px and 390px. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Icon colour | brand colours 3, grey 2 | 5 | `gray` switch | **100%** | the package |
| Alignment | left 4, right 1 | 5 | `right` switch | **100%** | the package |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Grey icons, right aligned | **Block options panel** (Options) |
| Which icons, in which order | the block: one icon per row (`:facebook:`, `:linkedin:`, `:email:`, `:copy-link:`) |
| The links | nothing to author: they are built from the page's own address and title |

---

## 3. The variant on stryker.com

### 3.1 Share row (`Social Share Corp`)

Four 30 × 30px squares with rounded corners (5px), 64px apart, 15px above and below, the same at every
width: Facebook blue (#1677f2), LinkedIn blue (#0077b5), email and copy link in gold (#ffb500), each with
its white sign. *Copy link* puts the page address on the clipboard and says *Copied to clipboard!*.

| | |
|---|---|
| Rows on the live site | **5** on 5 pages |
| Example pages | [Amplitude Vascular Systems](https://www.stryker.com/us/en/about/news/2026/stryker-signs-definitive-agreement-acquire-amplitude-vascular-systems.html), [Spencer Stiles](https://www.stryker.com/us/en/about/news/2025/stryker-names-spencer-stiles-president-and-chief-operating-officer.html) (grey), [Driven to give](https://www.stryker.com/us/en/about/news/features/driven-to-give--three-ways-stryker-employees-are-giving-back.html) (right) |

## 4. The options (Block options panel)

### 4.1 Options

| Choice | Option | Rows | Example page |
|---|---|---|---|
| Grey icons | `gray` | 2 | [Spencer Stiles](https://www.stryker.com/us/en/about/news/2025/stryker-names-spencer-stiles-president-and-chief-operating-officer.html), [Shane Lowry](https://www.stryker.com/us/en/about/news/2026/stryker-partners-professional-golfer-shane-lowry-caregiver-journey.html) |
| Right aligned | `right` | 1 | [Driven to give](https://www.stryker.com/us/en/about/news/features/driven-to-give--three-ways-stryker-employees-are-giving-back.html) |

Grey is mid grey (#b2b4ae), the Stryker grey of image borders and rules.

## 5. The text (Text style, not Block options)

The row has no text.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Icons (1,440px) | 30 × 30px from 30, 94, 158, 222px; right aligned from 1,188 to 1,410px | the same | **100%** |
| Icons (390px) | from 15, 79, 143, 207px; right aligned from 153 to 375px | the same | **100%** |
| Colours | #1677f2, #0077b5, #ffb500 (grey: all #b2b4ae) | the same | **100%** |
| Space above and below | 15px | the same | **100%** |

**Checked on the review page.** The Social Share review page holds the three looks (brand colours, grey,
right aligned) from their stryker.com pages, measured on both sites at 1,440px and 390px: every icon sits
at the same place, in the same size and colour.

---

## 7. To review (outliers)

None: every row uses the two switches as they are.

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| Links written into the page | the block builds them from the page's own address and title, so a moved page keeps working links |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| The same look and two switches, as today | None found |
| The links can't go stale | |

---

## 10. Decisions we need from the business

**To approve:**

1. The two switches, *Grey icons* and *Right aligned*.
2. Writing the share row on news pages in the migration (today it is left out; section *Review status*).

---

## Glossary

| Term | Meaning |
|---|---|
| Share row | the four icons that share the page on Facebook, LinkedIn, by email or copy its address |
| Block options panel | the editor panel where authors pick a block's choices from named options |

## Which choices fit

Both switches fit every share row, so the Block options panel greys nothing out.

## Review status (draft pages only)

The block renders as it does today on every page (its look is unchanged). The new parts are only in the
authoring and the migration:

- The **Block options panel** offers *Grey icons* and *Right aligned*.
- Today's news migration leaves the share row out of the page (the four imported pages that have one got it
  by hand). Only a review build used for the draft pages writes the row as a Social Share block where it
  stands in the article, with `gray` and `right` as the source sets them. A normal re-import gives exactly
  the same output as before (compared file by file on the Amplitude, Spencer Stiles, Shane Lowry and Driven
  to give pages).
