# Fragment: shared content, placed by reference

*A walkthrough of the Fragment block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the fragments shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | stryker.com places shared content on many pages as **Experience Fragments**: a division's "Connect with us" band, its contact links, the Quick links beside a form, footnotes, a back button. 1,390 placements on 814 pages. Editing the fragment once changes every page that places it. |
| **The risk** | Copying the shared content into each page would make 1,390 copies to keep in step. |
| **What we did** | The existing **Fragment** block places a fragment document by its link, as AEM does. Each Experience Fragment becomes one fragment document at the path derived from its AEM path; the migration writes a Fragment block wherever a page places it. There is nothing to choose: the look comes from the fragment's own content (text formatting, Text style, section styles). |
| **The result** | On the review page the Endoscopy band and contact links and the Acute Care Quick links look as on stryker.com at 1,440px and 390px. Checking them showed that some fragment documents on the new site are **older imports** that no longer look right; today's migration writes them correctly (section 6). |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Shared content | any Experience Fragment | 1,390 on 814 pages | the Fragment block, no choices | **100%** | the package: one variant, `reference` |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Which fragment | the block's one row: the link to the fragment document |
| The fragment's look | in the fragment document itself: formatting, Text style, section styles |
| Its place beside other content | the section of the page (e.g. `flex, flex-67-33` beside a form; see the Section layout chapter) |

---

## 3. The variant on stryker.com

### 3.1 Shared content (`Fragment`)

| | |
|---|---|
| Placements on the live site | **1,390** on 814 pages |
| Most placed | Endoscopy contact header and contact links (70 pages each), Sports Medicine contact header and contact (65 / 66), Acute Care footer links (46), Acute Care Quick links (39), Sage footer (37), Sage social icons (34) |
| Example pages | [Acute Care](https://www.stryker.com/us/en/acute-care.html), [About](https://www.stryker.com/us/en/about.html), [Endoscopy](https://www.stryker.com/us/en/endoscopy.html) |

## 4. The options (Block options panel)

None: the package lists no choices for a fragment, so the Block options panel has no Fragment entry.

## 5. The text (Text style, not Block options)

The text of a fragment is set in the fragment document, with the same formatting and **Text style** as any
page. One rule matters more for fragments: a fragment can't count on a **section copy size** of the page
it is placed in (a section style such as *text 1.25×* belongs to one section), so its sizes are Text style
on its own lines. The Quick links title is the example: *Quick links* in Text style 1.25× (Futura bold
17.5px, black), as on stryker.com.

---

## 6. How close is it to stryker.com?

| Fragment | On stryker.com | On the review page | How close |
|---|---|---|---|
| Endoscopy "Connect with us" band (70 pages) | gold box 1,379 × 161px from 31px; title Futura bold 36.75px (31.5px on phones, box 359 × 83px); two lines of Humanist 14px with teal links | 1,380 × 162px from 30px; 36.75px (31.5px, 360 × 83px); the same lines | **100%** |
| Endoscopy contact links (70 pages) | underlined links in teal Futura bold 14px capitals; group titles Futura bold 17.5px black | the same | **100%** |
| Acute Care Quick links (39 pages) | title Futura bold 17.5px black; three teal Futura bold 14px capital links; Facebook and LinkedIn icons side by side, 48px (35px on phones) | the same: icons at 970 and 1,048px (stryker.com 971 and 1,049px), 35px from 15 and 80px on phones | **100%** |

**What the check found: older fragment documents.** On the new site today, the pages that place these
fragments show older imports of them:

- the Endoscopy band is a full-width gold strip 34px high with a 24.5px title (instead of the 161px box
  with the 36.75px title);
- the Quick links title is gold 14px (it was imported as bold italic, the gold convention) and its two
  icons don't show (they were written as links whose image only sits in the link's title).

Today's migration writes the Endoscopy fragments right, so **re-importing the fragment documents** fixes
them on every page that places them. The Quick links needs the review build as well (section *Review
status*): its title becomes Text style and its two icons one row that stays side by side.

---

## 7. To review (outliers)

| What | Fragments | Example pages | Proposal |
|---|---|---|---|
| Fragment documents imported with an older importer | at least the Endoscopy header and the Acute Care Quick links (109 placements) | [Endoscopy](https://www.stryker.com/us/en/endoscopy.html), [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html) | re-import the shared fragments with today's importer once the business approves (section 10) |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| A copy of the shared content in every page | one fragment document, placed by its link |
| A copy size set for a whole section inside a fragment | Text style on the fragment's own lines (section 5) |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Edit once, every page changes, as today | The fragment documents must be re-imported to pick up importer fixes |
| No choices to learn | A fragment's look depends on its own document, so it has to be checked once on its own |

---

## 10. Decisions we need from the business

**To approve:**

1. The Fragment block as it is, with no choices.
2. **Re-import the shared fragment documents** with today's importer (the review build for the Quick links
   style of fragment), so the 1,390 placements show them as on stryker.com.
3. Removing the review-only gate (section *Review status*).

---

## Glossary

| Term | Meaning |
|---|---|
| Fragment | shared content kept in one document and placed on many pages |
| Experience Fragment | AEM's name for a fragment on stryker.com |
| Fragment document | the document that holds a fragment on the new site, e.g. /us/en/fragments/stryker/endoscopy/en/contact-information/header/master |
| Section copy size | a section style that sets the size of a section's text; inside a fragment, Text style is used instead |

## Which choices fit

The block has no choices, so the Block options panel shows nothing for it.

## Review status (draft pages only)

The Fragment block and how pages render are unchanged. The review page places review copies of the three
fragments (under /drafts/astha/blocks/fragment/), imported with today's importer.

The migration's review build of the shared fragments adds two things, for draft pages only:

- a section's copy size (`p-1-25` …) becomes Text style on each of its lines (*Quick links* →
  `:start-l:` *Quick links* `:end:`), so the fragment looks the same wherever it is placed;
- consecutive linked icons (each its own image-link section) become one row that stays side by side
  (`flex, flex-row-mobile, image-link`, the Section layout style).

A normal re-import of a real page gives exactly the same output as before (compared file by file on Arise
1000 EX and the three calendar pages); the committed fragments import is unchanged.
