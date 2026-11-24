# Sticky Nav: the jump bar, nothing to choose

*A walkthrough of the Sticky Nav block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer named choices only where stryker.com varies.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 181 jump bars shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Long stryker.com pages have a dark grey **jump bar** under the header: a few labels (*Overview*, *Covered products*, *Related*) that jump to the sections of the page, stay at the top while the visitor scrolls, and light up gold for the section in view. On phones the bar is hidden and a round ⋮ button opens the same list. |
| **The risk** | The bar's labels point at **section titles**, and on most pages those titles are hidden (1,169 hidden titles). Copying the page without them gives a bar whose labels jump nowhere. |
| **What we did** | We counted every jump bar on the live site. They all share one look, so there is nothing to choose. The labels stay the block's rows, and each hidden section title becomes the section's **anchor** (a line in its Section Metadata), so every label still jumps to its section. |
| **The result** | The bar looks and behaves as today. On the review page every label is in the same place, size, font and colour as on stryker.com, jumps to its section and turns gold; on phones the ⋮ button and its list match. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| The bar's look | 1 | 181 | none needed | **100%** | dark grey bar (#545857), white labels, the label in view on gold |
| Labels and targets | free text | 181 bars | the block's rows | **100%** | the labels are the section titles |
| Hidden section titles (jump targets) | 1,169 | | the section's **anchor** | **100%** | an invisible title on stryker.com, a Section Metadata line on the new site |
| Bars that render nothing | 13 pages | | not migrated | | switched on in AEM but empty on the live site (e.g. about/history, ent/products/suction) |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| The labels and the sections they jump to | the block: one row per label (the label, then a link to `#the-section`) |
| A jump target without a visible title | the section's **Section Metadata**: `anchor` (e.g. `overview`) |
| A jump target with a visible title | nothing to do: the heading is the target |

---

## 3. The variant on stryker.com

### 3.1 Jump bar (`sticky-nav`)

A dark grey bar under the header with up to five labels, each 193px wide, in capitals, in the middle of
the page. It sticks to the top of the window as the visitor scrolls; the label of the section in view is on
a gold box. On phones the bar is hidden: a black round button with three gold dots, at the bottom right,
opens a grey list of the same labels over 80% of the screen.

| | |
|---|---|
| Bars on the live site | **181** on 181 pages |
| Example pages | [ProCare](https://www.stryker.com/us/en/emergency-care/services/procare.html), [CR hub](https://www.stryker.com/us/en/about/corporate-responsibility/cr-hub.html), [Global quality](https://www.stryker.com/us/en/about/global-quality.html), [Acute Care](https://www.stryker.com/us/en/acute-care.html) |

## 4. The options (Block options panel)

None. Every jump bar on stryker.com has the same look, so the block has no entry in the Block options
panel. What an author sets is the content: the labels and their targets.

## 5. The text (Text style, not Block options)

The labels are plain text: the bar sets their font (Futura 14px, capitals, white; black on gold for the
section in view). No Text style is needed or used.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Bar | 1,440px wide, 80px high, #545857 | the same | **100%** |
| Labels | 193px each, from 334px at 1,440 (4 labels), Futura 14px capitals, white | the same | **100%** |
| Jumps | the section's title just below the bar | the same | **100%** |
| Section in view | gold box (#ffb500), black label | the same | **100%** |
| Phones | bar hidden, ⋮ button 40px at 8px / 17px from the corner, grey list 80% wide | the same | **100%** |

**Checked on the review page.** The Sticky Nav review page is a real ProCare page with its jump bar (two
labels with hidden titles, two with visible ones). At 1,440px the four labels sit at 334, 527, 720 and
913px, as on stryker.com; each click scrolls its section to just below the bar and turns that label gold.
At 390px the bar is hidden and the ⋮ button opens the list (Futura 17.5px, 40px lines with white rules).

**What differs, by design:**

- **The bar while pinned**: stryker.com shrinks it from 80px to 70px once it sticks to the top; the new
  bar stays 80px, so a section lands 10px lower (80px instead of 70px from the top).

---

## 7. To review (outliers)

| What | Pages | Example pages | Proposal |
|---|---|---|---|
| A jump bar that is switched on but shows nothing | 13 | about/history, ent/products/suction | not migrated |
| A label whose title is written in lower case (*products*) | a few | [Acute Care](https://www.stryker.com/us/en/acute-care.html) | kept: the bar shows every label in capitals |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| Hidden section titles | the section's `anchor` (Section Metadata); nothing shows on the page, as today |
| The 10px shrink of the pinned bar | the bar keeps its height |
| The 13 empty jump bars | not migrated |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Nothing to set: one look for every bar | An author adding a label also has to name its target (a heading, or an `anchor` line) |
| Every label still jumps to its section, also where the title is hidden | The pinned bar is 10px taller than on stryker.com |
| Phones keep the ⋮ button and its list | |

---

## 10. Decisions we need from the business

**To approve:**

1. One jump bar look, no choices.
2. Hidden section titles become the section's `anchor`.
3. Not migrating the 13 jump bars that show nothing.
4. Removing the review-only gate (section *Review status*).

---

## Glossary

| Term | Meaning |
|---|---|
| Jump bar (Sticky Nav) | the grey bar of labels that jump to the sections of a long page |
| Section title | the title a label jumps to; visible (a heading) or hidden on stryker.com |
| Anchor | the name of a section a label jumps to, in its Section Metadata |
| Section Metadata | the small table at the end of a section with its settings |
| Pinned | the bar stuck to the top of the window while the page scrolls |

## Which choices fit which bar

The block has no Block options, so nothing is greyed out.

## Review status (draft pages only)

While the standardisation is reviewed, the changes apply **only on draft pages** (`/drafts/…`) and in the
authoring panels' previews: the labels sit in the middle of the bar, a jump lands just below the bar (it
landed under it before the window was resized), and the ⋮ button shows on phones. stryker.com pages
imported today render exactly as before (checked element by element on CR hub and 1788 platform at 1,440px
and 390px); patients pages are not touched.

The migration works the same way: today's migration turns hidden section titles into empty space. Only a
review build used for the draft pages also writes each hidden title as the section's `anchor`. A normal
re-import of a real page gives exactly the same output as before (compared file by file on ProCare, Acute
Care, Global quality and CR hub).
