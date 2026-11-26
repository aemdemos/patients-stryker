# Tabs: one look, a section per tab

*A walkthrough of the Tabs block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 198 tab sets shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a tab set shows one panel at a time under a row of tab labels: product information and videos, resources, related products. The panels hold whole components: 863 blocks (column rows, downloads, product cards) sit inside tab panels. |
| **The risk** | A tab panel that holds blocks can't be a simple text cell, and copying the free spacing and colours inside the panels would bring back values the other blocks no longer have. |
| **What we did** | We counted every tab set on the live site. They share one look (Futura uppercase labels, a gold line under the active one, a thin divider between labels), and stryker.com has no style choices for them. Each tab is a **section** with the style `tab-panel`, as accordion panels are: the heading at its top is the label, the rest of the section is the panel. Consecutive tab sections become one tab set. |
| **The result** | Tab sets look and switch as today. On the review page every tab set matches stryker.com in label font, size, case, colour, width and the gold line, on desktop and phone; the panels keep their blocks. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a tab set, how many different values stryker.com uses today, and the named choices on
the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Inner spacing, top (padding %) | **4** | 25 | 4 | **100%** | 5 (9), 2 (7), 10 (5), 3 (4) |
| Inner spacing, bottom | **5** | 24 | 4 | **100%** | 5 (9), 2 (5), 10 (5), 3 (4) |
| Inner spacing, left | **4** | 10 | 4 | **100%** | 10 (5), 2 (2), 3 (2), 7 (1) |
| Inner spacing, right | **4** | 10 | 4 | **100%** | 10 (5), 2 (2), 3 (2), 7 (1) |
| Outer spacing, top (margin %) | **1** | 2 | 0 (standard) | **100%** | 2 (2) |
| Font size | **9** | 210 | 6 + 4 | **100%** | 1.25× (88), 1.5× (55), 1.75× (21), headline 1.5 (16) |
| Font | **2** | 152 | 3 | **100%** | Futura bold (118), Egyptienne (34) |
| Text colour | **14** | 154 | 8 | **97%** | gold #ffb500 (34), white (21), black (20 + 18 written differently) |
| Text alignment | **4** | 171 | 2 | **99%** | left (165), centred (3), right (1) |

These are the settings of the content **inside** the panels: spacing belongs to the boxes and blocks in the
panel (their own choices), and fonts, sizes and colours are the site-wide Text style. The tab set itself has
nothing to choose.

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| One tab | a section with the style `tab-panel`; its first heading is the tab label |
| The blocks in a tab | blocks in that section (Columns, Cards, Video …), with their own choices |
| A band behind the tab set | a section style on the tab sections (for example `full-bleed`), kept on the tab set's section |
| Fonts, sizes and colours of words | the site-wide **Text style** |

---

## 3. The variant on stryker.com

### 3.1 Tabs (`tabs`)

A horizontal tab bar; each tab's panel holds a section of content and blocks.

| | |
|---|---|
| Tab sets on the live site | **198** on 169 pages |
| One tab only | 38 tab sets (kept as a one-tab tab set: the business decision) |
| Example pages | [Contact](https://www.stryker.com/us/en/about/contact.html), [Product security](https://www.stryker.com/us/en/about/governance/product-security.html), [Fall prevention webinar](https://www.stryker.com/us/en/acute-care/c/applying-technology-to-fall-prevention/webinar.html), [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html), [ProCare](https://www.stryker.com/us/en/acute-care/services/procare.html), [Craniomaxillofacial](https://www.stryker.com/us/en/craniomaxillofacial.html) |

**How it is authored:** one section per tab, each with the section style `tab-panel`. The heading at the
top of the section is the tab label; everything after it (text, images, blocks) is the tab. Tab sections
that follow one another make one tab set; any other section between them starts a new tab set. Imported
pages that use the older `tabbed` section (all tabs in one section, split at headings) keep working.

---

## 4. The options (Block options panel)

None. stryker.com has no style choices for tabs, so the Block options panel offers none: the look is the
same for every tab set.

---

## 5. The text in the panels (Text style, not Block options)

Bold, italic, links and lists are normal formatting. Coloured, sized or serif words use the site-wide
**Text style**, with the same limited sizes and brand colours as every other block. The tab labels have one
look (Futura 14px uppercase) and take no Text style.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Label look (font, size, case, colour, gold line, divider) | one look | the same look | **100%** |
| Label widths | the label plus 30px each side | the same | **100%** (Maxface 123 / 124px, Cranial restoration 213 / 214px) |
| Blocks in a panel | components in the panel | blocks in the tab section | **100%** of the panels keep their blocks |
| One-tab sets | 38 | one-tab tab sets | **100%** |

**Checked on the review page.** The Tabs review page holds four real stryker.com tab sets (text and images,
downloads and product cards, a single tab, a tab set in a band). A comparison measured the tab labels on both
sites at 1,440px and 390px: Futura 14px uppercase in black, the gold line under the active label, the label
widths and the 30px gap to the panel all match. The label row is 39px high (stryker.com: 40px).

**What differs, by design:**

- **The label height on review pages only:** the shared tab button added the label's spacing twice, which
  made corp tabs 58px high; on the review pages it is 39px, as on stryker.com. Real pages keep 58px until
  the gate is removed.
- **On phones** stryker.com starts the tab bar 20px further in than the page text; the new site lines it up
  with the text.

---

## 7. To review (outliers)

| What | Tab sets | Proposal |
|---|---|---|
| Tab sets with a single tab | 38 | keep as a one-tab tab set (decided) |
| Two tab sets right after each other with nothing between them | none on the pages imported for this review | a short text or a heading between them, or a new tab set style if it is needed |

---

## 8. What we did not carry over, and why

| Not carried over as a Tabs option | Where it goes instead |
|---|---|
| Spacing inside the panels | the boxes and blocks in the panel (their own choices) |
| Fonts, sizes and colours in the panels | Text style |
| All tabs in one section split at headings (`tabbed`) | still read on imported pages; new tab sets use one `tab-panel` section per tab |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Each tab is its own section, so it can hold any block and keep its own section styles | Authors add one section per tab instead of headings in one section |
| One look for every tab set: nothing to set | Two tab sets need something between them to stay apart |
| The same way of working as accordion panels | |

---

## 10. Decisions we need from the business

**To approve:**

1. One tab section per tab (`tab-panel`), as the business decided, with the heading at its top as the label.
2. The tab label height of 40px as on stryker.com (corp tabs are 58px today), on every page once the gate is
   removed.
3. Removing the review-only gate (section *Review status*).

**Proposed, still open:** nothing for tabs.

---

## Glossary

| Term | Meaning |
|---|---|
| Tab set | a row of tab labels with one panel shown at a time |
| Tab label | the word you click to show a panel |
| Tab section | a section with the style `tab-panel`: one tab, its heading the label |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which tab set

Tabs have no Block options.

## Review status (draft pages only)

While the standardisation is reviewed, `tab-panel` sections become tab sets **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews, where the tab labels are also 40px high as on
stryker.com. stryker.com pages imported today render exactly as before (checked element by element on Sage
SPS and Sage TAP 1.0, which use the older `tabbed` section); patients pages are not touched.

The migration works the same way: only a review build used for the draft pages writes each tab as a
`tab-panel` section. A normal re-import of a real page gives exactly the same output as before (compared
file by file on 7 pages: Craniomaxillofacial, Contact, Product security, ProCare, Arise 1000 EX, LD 304 and
the fall prevention webinar).
