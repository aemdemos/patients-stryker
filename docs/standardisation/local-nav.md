# Local Nav: the navigation of a section, one switch

*A walkthrough of the Local Nav block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 46 local navigations shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Some groups of stryker.com pages (Corporate Responsibility, the ASC pages, SKILL, the iSuite experience, Spine medical education …) have a **local navigation** at the top: the section's parent page on the left and the pages of the section on the right, the current page in black. In AEM the links come from the page tree; authors could hide the grey line above it and a line below it. |
| **The risk** | Edge Delivery has no page tree, and copying both line settings would give a choice that does nothing (the line below never shows on the live site). |
| **What we did** | We counted every local navigation on the live site. They share one look; the only visible difference is the grey line above. The block holds its links (the parent page, then the pages), and one switch in the **Block options panel** turns the line above off. |
| **The result** | The navigation looks as today. On the review page the parent title, the pages, the "\|" between them, the grey line and the phone list match stryker.com in place, font, size and colour. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Line above | on / off | 46 | 1 switch (`no-top-line`) | **100%** | off on 22 (all instances, shown or not) |
| Line below | on / off | 46 | none | **100%** | set on 19, but it never shows on the live site |
| The links | the AEM page tree | 46 | written in the block | **100%** | 2 to 6 pages per section |
| The look | 1 | 46 | none needed | **100%** | |
| Navigations without links | | 4 | not migrated as links | | they show only the parent title on the live site |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| The line above | **Block options panel**: *No top line* |
| The parent page and the pages of the section | the block: row 1 the parent page (a link), row 2 the list of pages (links) |
| The current page | nothing to do: the page whose address matches is shown in black |

---

## 3. The variant on stryker.com

### 3.1 Local navigation (`local-nav`)

From 600px: a 1px grey rule (#b2b4ae), 15px of space, then the parent page's title on the left (Futura
bold 17.5px, capitals, black) and the section's pages on the right (Futura 14px, capitals, grey #9f9d9d,
a light grey "|" between them, the current page in black). On phones: the current page's title (Futura
bold 14px, capitals) and a small gold up / down arrow that opens a white list of the parent page (bold) and
the pages (#404040, the current page bold and black), 40px a line.

| | |
|---|---|
| Navigations on the live site | **46** on 46 pages |
| Example pages | [Room design](https://www.stryker.com/us/en/communications/systems/-isuite-experience/room-design.html), [Employee benefits](https://www.stryker.com/us/en/about/corporate-responsibility/employee-benefits-and-resources.html), [ASC pre-operative](https://www.stryker.com/us/en/care-settings/asc/pre-operative.html), [1788 platform](https://www.stryker.com/us/en/endoscopy/products/1788-platform.html) |

## 4. The options (Block options panel)

### 4.1 No top line

| Choice | Option | Navigations on stryker.com |
|---|---|---|
| With the grey line above (default) | | the others |
| No top line | `no-top-line` | 22 (all instances, shown or not) |

## 5. The text (Text style, not Block options)

The links are plain links; the block sets their font, size and colour. No Text style is needed or used.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Line above | 1px #b2b4ae, 15px above the navigation | the same | **100%** |
| Parent title | Futura bold 17.5px, capitals, black | the same | **100%** |
| Pages | Futura 14px, capitals, #9f9d9d, "\|" #c2c2c2, current black, right-aligned, ending 55px before the edge | the same | **100%** |
| Phones (below 600px) | current page's title + gold arrow; white list of 40px lines | the same | **100%** |

**Checked on the review page.** The Local Nav review page has four real local navigations (room design,
employee benefits, ASC pre-operative, 1788 platform). At 1,440px the room design pages sit at 788, 1,071 and
1,209px (stryker.com 791, 1,072 and 1,209), the parent title and the current page in black; at 390px the
current page's title is Futura bold 14px with the arrow at the right, and the open list matches line by
line (the parent bold, the pages #404040, the current page bold and black).

**What differs, by design:**

- **The switch to the phone layout** happens at 600px; stryker.com switches at 841px (the site's
  breakpoints: 841px becomes 600px).
- **The arrow** is drawn by the page (two gold triangles) instead of stryker.com's image of them.
- **A navigation with many pages** wraps onto a second line; stryker.com moves the last pages into a "more"
  menu. No local navigation on stryker.com has enough pages for that (6 at most).

---

## 7. To review (outliers)

| What | Navigations | Example pages | Proposal |
|---|---|---|---|
| Every page in black (none grey) | 1 section | [Spine medical education events](https://www.stryker.com/us/en/training-and-education/orthopaedics/spine/spine-medical-education/events.html) | the standard look: only the current page in black |
| A navigation that shows only its parent title (no links) | 4 | [1688 AIM platform](https://www.stryker.com/us/en/endoscopy/systems/1688-aim-platform.html), [Augment](https://www.stryker.com/us/en/foot-and-ankle/products/augment.html) | the parent link alone, or nothing |
| Parent title "Home" for a section | Spine medical education, Instruments | [Tech support](https://www.stryker.com/us/en/surgical-technologies/services/instruments/tech-support.html) | kept as written |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The page tree as the source of the links | the links are written in the block (one block per section, copied on each of its pages, or a fragment) |
| "Hide bottom line" | nothing: it has no visible effect on the live site |
| The "more" menu for long navigations | the pages wrap (no section needs it) |
| Older imports of the same navigation under other names (`local-nav-corp` on 32 pages, `sticky-nav local` on 55 blocks) | the Local Nav block when those pages are imported again; until then they render as today |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One look and one switch | The links are written by hand: a new page in the section means updating its navigation |
| The current page is found from the address, nothing to mark | |
| Phones keep the current page's title and the list | |

---

## 10. Decisions we need from the business

**To approve:**

1. One local navigation look and the *No top line* switch.
2. Removing the review-only gate (section *Review status*).

**Proposed, still open (from the package):**

- **Is the local navigation in scope?** If yes: write the links in each section's pages (one shared
  fragment per section is the simplest to keep up to date), or build them from the site's page index, which
  needs a "section" setting on every page.

---

## Glossary

| Term | Meaning |
|---|---|
| Local navigation | the row of links to the pages of one section, at the top of each of them |
| Parent page | the page the section belongs to (its title on the left) |
| Current page | the page the visitor is on, shown in black |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Fragment | a piece of content kept once and shown on several pages |

## Which choices fit which navigation

The Block options panel reads the selected block and shows only the choices that fit it; a
choice that would do nothing is not shown.

| Needs | Choices |
|---|---|
| Any local navigation | No top line |

## Review status (draft pages only)

While the standardisation is reviewed, the Local Nav block renders **only on draft pages** (`/drafts/…`)
and in the authoring panels' previews. No stryker.com page imported today uses it, so nothing else
changes; patients pages are not touched.

The migration works the same way: today's migration already writes each stryker.com local navigation as a
Local Nav block (the parent page, then the pages). Only a review build used for the draft pages also sets
*No top line* where stryker.com hides the line. A normal re-import of a real page gives exactly the same
output as before (compared file by file on room design, 1788 platform, employee benefits, ASC
pre-operative and SKILL e-Lab).

On the review page no link is the current page (the review page is not one of the section's pages), so
every page is grey and the phone title is the review page's own title; the current-page look was checked on
a local copy whose address is one of its links.
