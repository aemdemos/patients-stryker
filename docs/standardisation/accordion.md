# Accordion: one look, panels that can hold blocks

*A walkthrough of the Accordion block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 249 accordions shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, an accordion is a list of labels that open a panel: FAQs, product details, document lists, patent and serial number lists. Some panels hold only text; others hold whole components (tables, column rows, downloads, shared fragments, tabs). Authors could open every panel by default and put a title above the accordion. |
| **The risk** | A panel that holds a component can't be a simple text cell, and copying the free spacing and colours inside the panels would bring back values the other blocks no longer have. |
| **What we did** | We counted every accordion on the live site. They share one look (bold uppercase Futura labels with a plus sign, no borders), so there is nothing to choose for it. A panel of text is a row of the Accordion block; a panel that holds blocks is a section of its own (`accordion-panel`), which the page turns into the same accordion. The one setting becomes a switch: **panels start open**. |
| **The result** | Accordions look and open as today. On the review page every accordion matches stryker.com in label font, size, colour and spacing, in open and closed panels, on desktop and phone. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of an accordion, how many different values stryker.com uses today, and the named choices
on the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **2** | 7 | 4 | **100%** | 2 (5), 3 (2) |
| Outer spacing, top (margin %) | **4** | 10 | 0 (standard) | **70%** | 3 (5), 2 (2), -5 (2), -3 (1) |
| Outer spacing, bottom | **2** | 3 | 0 (standard) | **100%** | 2 (2), 1 (1) |
| Font size | **9** | 908 | 6 + 4 | **100%** | 1.25× (739), 1.5× (62), 1.75× (38), 0.8× (34) |
| Font | **4** | 573 | 3 | **99%** | Futura bold (340), Egyptienne (230) |
| Text colour | **11** | 104 | 8 | **97%** | gold #ffb500 (45), teal (11), white (11), #1c5687 (11) |
| Box / background colour | **2** | 11 | 10 | **36%** | pale grey #dfe1de (7), gold (4) |
| Text alignment | **4** | 567 | 2 | **99%** | left (560), right (4), centred (1) |

The spacing, fonts, sizes and colours are those of the text **inside** the panels: they are the site-wide
text layer (Text style), the same choices in every block. The 11 coloured boxes are to review (section 7).

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Panels start open, and the two imported looks | **Block options panel** (section 4) |
| A panel that holds blocks | a section with the style `accordion-panel` (its heading is the label); `accordion-open` starts those panels open |
| A title above the accordion | a **Heading 3** (bold) right before the block |
| Fonts, sizes and colours of words in a panel | the site-wide **Text style** |

---

## 3. The variants on stryker.com (one block)

### 3.1 Panels of text (`simple`)

Each panel holds text, buttons or links, or a single image. Authored as the Accordion block: one row per
panel, the label in the first cell and the panel in the second.

| | |
|---|---|
| Accordions on the live site | **104** on 70 pages |
| Example pages | [Global quality](https://www.stryker.com/us/en/about/global-quality.html), [LD 304](https://www.stryker.com/us/en/acute-care/products/ld-304.html), [Device registration](https://www.stryker.com/us/en/emergency-care/device-registration.html), [Improving access to healthcare](https://www.stryker.com/us/en/about/news/2024/features/how-stryker-improves-access-to-healthcare-globally.html) |

### 3.2 Panels with blocks inside (`with-nested-blocks`)

At least one panel holds a component: a table, a row of columns, downloads, a shared fragment or tabs. A
block can't sit inside another block, so each panel is a **section** with the style `accordion-panel`: the
heading at its top is the label, the rest of the section (text and blocks) is the panel. Consecutive
panel sections become one accordion on the page.

| | |
|---|---|
| Accordions on the live site | **145** on 136 pages |
| Example pages | [Contact](https://www.stryker.com/us/en/about/contact.html), [Governance](https://www.stryker.com/us/en/about/governance.html), [Acute Care resources](https://www.stryker.com/us/en/acute-care/resources.html), [Advanced midface distractor](https://www.stryker.com/us/en/craniomaxillofacial/products/advanced-midface-distractor.html) |

---

## 4. The options (Block options panel)

### 4.1 Panels start open

| Choice | Option | Accordions on stryker.com |
|---|---|---|
| Panels start open | `open` | 95 (26 of text, 69 with blocks inside) |

Every panel starts open, and a click still closes it. On stryker.com the setting opens **every** panel
(not only the first), so the choice does the same. For panels with blocks inside, the panel sections take
the style `accordion-open` too.

### 4.2 Looks kept from imported pages

One look that pages imported earlier use is kept as a choice, without a new variant:

| Choice | Option | What it does |
|---|---|---|
| Lists in a light grey box | `gray-list` | the list in each panel sits in a light grey box, the panel's full width (ISPIES) |

The grey line between items is not a choice: every stryker.com accordion has it (Connected OR, Global
quality, LD 304, Contact, Governance, Device registration), so it is the block's standard look. It sits
under a closed item's label and under an open item's content, 15px below its last line (1px #b2b4ae).
Pages that carry the earlier `divided` option keep it; it is no longer offered.

### 4.3 A title above the accordion (no option)

16 accordions have a title above them on stryker.com (7 of text, 9 with blocks inside). It is a bold
Heading 3 right before the block (Futura bold, 21px; 17.5px on phones), as on stryker.com.

---

## 5. The text in the panels (Text style, not Block options)

Bold, italic, links and lists are normal formatting. Coloured, sized or serif words use the site-wide
**Text style**, with the same limited sizes and brand colours as every other block. The most used size in
the panels is 1.25× (739 uses), the 17.5px FAQ text.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Label look (font, size, colour, case, sign) | one look | the same look | **100%** |
| Open or closed | all open or all closed | one switch | **100%** (one accordion opens 1 of 5 panels: section 7) |
| Panels with blocks | components inside panels | panel sections | **100%** of the panels keep their blocks |
| Text in the panels | 9 sizes, 4 fonts, 11 colours | Text style | **100%** / **99%** / **97%** |

**Checked on the review page.** The Accordion review page holds a real stryker.com accordion for every
choice (7 sections). A comparison measured the labels and panels on both sites at 1,440px and 390px:
labels in Futura bold uppercase 17.5px (14px on phones), black, 40px high, 15px apart (stryker.com: 41px);
panel text in the body font at 14px; the title above in Futura bold 21px (17.5px on phones), 15px above the
accordion; open panels open, closed panels closed. All match.

---

## 7. To review (outliers)

| What | Accordions | Example pages | Proposal |
|---|---|---|---|
| One panel of five open by default | 1 | Vocera third-party legal documents | all closed (no per-panel open state) |
| A coloured box in a panel (pale grey 7, gold 4) | 11 | | Panel block inside the panel section, or the text without its box |
| Negative top margins (pulling the accordion up) | 3 | | the standard gap |
| Right-aligned text in a panel | 4 | | left |

---

## 8. What we did not carry over, and why

| Not carried over as an Accordion option | Where it goes instead |
|---|---|
| Fonts, sizes and colours inside the panels | Text style |
| Margins around the accordion | the standard gap |
| Opening one chosen panel | all open or all closed |
| A component inside a panel | the panel is a section (`accordion-panel`), so the component stays a block |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One look for every accordion: nothing to set | Panels with blocks are authored as sections, a different way from panels of text |
| Panels keep their tables, columns and downloads as blocks | One accordion loses its single open panel |
| One switch opens every panel, for both kinds | |

---

## 10. Decisions we need from the business

**To approve:**

1. One accordion look and the *Panels start open* switch, opening every panel as on stryker.com (the
   package called it "first panel open").
2. `open` on panels with blocks inside (69 accordions): the `accordion-open` section style.
3. The kept look (*Lists in a light grey box*) and the grey line between items as the standard look.
4. Removing the review-only gate (section *Review status*).

**Proposed, still open:**

- **The one accordion that opens 1 of 5 panels** (Vocera third-party legal documents): all closed (the
  proposal), or a per-panel open option?
- **Panels with column rows or downloads inside:** the migration keeps their tables as blocks, but still
  writes the content of column rows inside a panel one after the other; building those rows as blocks in
  the panel is a next migration step.

---

## Glossary

| Term | Meaning |
|---|---|
| Accordion | a list of labels that open and close a panel each |
| Label | the line you click to open a panel |
| Panel | the content under a label |
| Panel section | a section with the style `accordion-panel`: one panel that can hold blocks |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which accordion

The Block options panel reads the selected accordion and shows only the choices that fit it; a choice
that would do nothing is not shown. Hovering a choice shows what it does.

| Needs | Choices |
|---|---|
| A list in a panel | Lists in a light grey box |
| Any accordion | Panels start open |

## Review status (draft pages only)

While the standardisation is reviewed, the new Accordion behaviour applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: `accordion-open` on panel sections. The accordion's
look did not change (it already matched stryker.com), so stryker.com pages imported today render exactly
as before (checked element by element on Osteotomy truss system, CoreTrak, Charlotte Lisfranc and MRI
information); patients pages are not touched.

The migration works the same way: only a review build used for the draft pages writes the title above the
accordion (a bold Heading 3) and `accordion-open` on open panels with blocks inside. A normal re-import of
a real page gives exactly the same output as before (compared file by file on 7 pages: Global quality,
Acute Care resources, Disclosure and safety information, Device registration, LD 304, S-Series equipment
management system and the AED pad placement guide).
