# Table: one look, a header row and two switches

*A walkthrough of the Table block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 160 tables shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a table is a grid of text: product numbers, sizes, course times, downloads, voice commands, and the long patent and trademark lists. Authors could set a width in percent, turn on a "mobile design" that puts each cell on its own line on phones, and the patent lists come from an Excel file. |
| **The risk** | Copying every setting means tables at 55%, 75% and 100% width, and two ways to keep the patent lists, for what is one table look. |
| **What we did** | We counted every table on the live site. They all share one look (no borders, every other row on a light grey, the body text at 14px), so there is nothing to choose for it. The settings become one choice and two switches in the **Block options panel**: the header row (or none), rows as lines on phones, and data from a sheet. |
| **The result** | Tables look as today. On the review page every table matches stryker.com in font, size, colour, stripes, cell spacing and column widths; on phones the stacked tables put each cell on its own line, as today. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a table, how many different values stryker.com uses today, and the named choices on
the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Header row | 2 (a bold or header first row, none) | 160 | 2 | **100%** | with header 96, no header 52, patent list 12 |
| Phones | 2 (cells side by side, or each on its own line) | 160 | 1 switch | **100%** | own line on 11 tables + the 12 patent lists |
| Width | 3 (full width, 55%, 75%) | 160 | none (full width) | **98%** | 55% on 1 table, 75% on 2 |
| Where the rows come from | 2 (the page, an Excel file) | 160 | 1 switch | **100%** | Excel file on the 12 patent lists (up to 1,322 rows) |

The look itself has no values to group: every stryker.com table uses the same one.

| Look | On stryker.com and the new site |
|---|---|
| Text | the body font (Humanist), 14px, 20px lines, black |
| Header row | the first row, in bold |
| Rows | no borders; rows 1, 3, 5 … on a light grey (#f5f5f5), the header row counting as row 1 |
| Cells | 10px above and below, 8px left and right |
| Links | teal, not underlined |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Header row, rows as lines on phones, data from a sheet | **Block options panel** (section 4) |
| The rows and cells | the block itself (one table row per row) |
| Bold, italic, links and coloured words in a cell | formatting and the site-wide **Text style** |

---

## 3. The variants on stryker.com (one block)

All three are the same Table block; what differs is the header row and where the rows come from.

### 3.1 With a header row (`header`)

The first row names the columns, in bold.

| | |
|---|---|
| Tables on the live site | **96** on 58 pages |
| What they hold | product and part numbers, sizes, course times, downloads, service plans |
| Example pages | [ProCare](https://www.stryker.com/us/en/acute-care/services/procare.html), [SVIN annual meeting](https://www.stryker.com/us/en/c/2021/svin-annual-meeting.html), [Hydro irrigation](https://www.stryker.com/us/en/ent/products/hydro-irrigation-system.html), [SafeAir smoke evacuation](https://www.stryker.com/us/en/surgical-technologies/products/safeair-smoke-evacuation.html) |

### 3.2 Without a header row (`no-header`)

Plain rows, often a one-column list of documents in a box of stripes.

| | |
|---|---|
| Tables on the live site | **52** on 19 pages |
| Example pages | [Acute Care resources](https://www.stryker.com/us/en/acute-care/resources.html), [Vocera easter eggs](https://www.stryker.com/us/en/acute-care/vocera/support/easter-eggs.html), [Lifecycle support](https://www.stryker.com/us/en/about/governance/lifecycle-support.html) |

### 3.3 Patent lists (`sheet`)

The patent and trademark lists, kept by legal as an Excel file and shown as a table, each cell on its own
line on phones.

| | |
|---|---|
| Tables on the live site | **12** on 12 pages (up to 1,322 rows) |
| Example pages | [Craniomaxillofacial patents](https://www.stryker.com/us/en/about/patents/Craniomaxillofacial-Patents.html), [Endoscopy patents](https://www.stryker.com/us/en/about/patents/endoscopy-patents.html), [Medical patents](https://www.stryker.com/us/en/about/patents/medical-patents.html) |

---

## 4. The options (Block options panel)

### 4.1 Header row

| Choice | Option | Tables on stryker.com |
|---|---|---|
| Header (default) | none | 96 |
| No header | `no-header` | 52 |

**How the migration reads it:** the first row is the header when it uses table header cells (8 tables) or
when every filled cell of it is all in bold (87 tables). A first row that is only partly bold (for example
"**Action** | **Voice Command** *(examples in italics)*") stays a data row with its bold words.

### 4.2 Rows as lines on phones

| Choice | Option | Tables on stryker.com |
|---|---|---|
| Rows as lines on phones | `mobile-stacked` | 11 + the 12 patent lists |

On phones each cell is a line of its own and the rows keep their stripes, as stryker.com's "mobile design"
does. Without it a table keeps its columns on phones and can be scrolled sideways when it is wide.

### 4.3 Data from a sheet

| Choice | Option | Tables on stryker.com |
|---|---|---|
| Data from a sheet | `sheet` | 12 (the patent lists) |

The block holds only a link to a sheet; the page shows the sheet's rows (its column names as the header
row, unless *No header* is picked), each cell on its own line on phones. Legal keeps the list in one
sheet, as it keeps the Excel file today. Whether legal keeps a sheet or the rows are written in the page is
a decision for the business (section 10); the migration writes the rows in the page today.

---

## 5. The text in the cells (Text style, not Block options)

Bold, italic and links in a cell are normal formatting. Coloured, sized or serif words use the site-wide
**Text style**, with the same limited sizes and brand colours as every other block. stryker.com tables use
none today: every table text is the body font at 14px in black.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Look (font, size, colour, stripes, cell spacing) | one look | the same look | **100%** |
| Header row | header or none | the same two choices | **100%** |
| Phones | own line or side by side | one switch | **100%** |
| Width | full, 55%, 75% | full width | **98%** (3 tables become full width) |

**Checked on the review page.** The Table review page holds a real stryker.com table for every choice
(9 sections). A comparison measured the cells on both sites at 1,440px and 390px: font (Humanist 14px,
bold header 700), colour (black, links teal), line height (20px), cell spacing (10px / 8px), stripes
(#f5f5f5 on rows 1, 3, 5 …) and column widths (Hydro irrigation 1,057px + 323px, patent list 89px +
565px …) all match. On phones the stacked tables put each cell on its own line across the full width, as on
stryker.com.

**What differs, by design:**

- **Centred cells** (ProCare's plan names and bullets) are left-aligned: tables have no alignment choice.
- **Tables in a row of columns** with a heading and a note in each column (Transend's three tables) follow
  one another at full width: blocks are never inside Columns. A table beside other content (the Vocera
  easter eggs and their quick links) stays side by side, in a side-by-side section (`flex, flex-67-33`).
- **Empty columns** (a third column empty in every row on Vocera easter eggs) are dropped, so the other
  columns are a little wider.
- **The patent lists on phones**: stryker.com leaves an empty label column (138px) beside each cell; the new
  site uses the full width.
- **The patent lists' Load More button** is set on all 12 lists but hidden on stryker.com (every row shows);
  the new site shows every row too.

---

## 7. To review (outliers)

| What | Tables | Example pages | Proposal |
|---|---|---|---|
| Width 55% or 75% | 3 | | full width |
| Centred cells | ProCare and a few others | [ProCare](https://www.stryker.com/us/en/acute-care/services/procare.html) | left |
| Several tables side by side in columns, each with a heading | Transend (3) | [Transend guidewires](https://www.stryker.com/us/en/neurovascular/products/transend--guidewires.html) | one after the other at full width |
| A first row that is only partly bold | Vocera voice commands | [Voice commands](https://www.stryker.com/us/en/acute-care/vocera/support/voice-commands.html) | a data row (its bold words kept) |

---

## 8. What we did not carry over, and why

| Not carried over as a Table option | Where it goes instead |
|---|---|
| The width in percent | full width (3 tables) |
| The table look (borders, stripes, fonts) | one look for every table, nothing to choose |
| Cell alignment | left |
| A table inside a column | a side-by-side section, or the tables one after the other (blocks are never inside Columns) |
| The Load More button of the patent lists | not built: it is hidden on stryker.com (every row shows) |
| Coloured or sized words in a cell | Text style |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| One look for every table: nothing to set | 3 tables lose their narrower width |
| Two switches cover every phone layout and the patent lists | Centred cells become left-aligned |
| Long lists can stay in a sheet that legal keeps | Tables that sat side by side in columns follow one another |

---

## 10. Decisions we need from the business

**To approve:**

1. One table look, a *Header row* choice and two switches (*Rows as lines on phones*, *Data from a sheet*).
2. The header rule: a first row in header cells or all in bold is the header (87 tables only bold it; 8 use
   header cells).
3. Full width for the 3 tables at 55% / 75%, and left-aligned cells.
4. Removing the review-only gate (section *Review status*).

**Proposed, still open:**

- **Patent lists:** should legal keep a sheet (published as a site sheet and read by the Table block, with
  *Data from a sheet*) or write the rows directly in the page, as the migration does today? Trademarks has
  1,322 rows.
- **Tables side by side in columns** (Transend): one after the other at full width (the proposal), or
  side by side without their headings and notes?

---

## Glossary

| Term | Meaning |
|---|---|
| Table block | a grid of rows and cells on the page |
| Header row | the first row, naming the columns, in bold |
| Rows as lines on phones | on a phone each cell is shown on a line of its own |
| Sheet | a spreadsheet published with the site; the Table block can show its rows |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Side-by-side section | a section that places a block next to other content (`flex`) |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which table

The Block options panel reads the selected table and greys out the choices that would do nothing.
Hovering a greyed choice shows why.

| Needs | Choices |
|---|---|
| 2 or more columns | Rows as lines on phones |
| Only a link to a sheet (its .json) | Data from a sheet |
| Any table | Header, No header |

Older imported names read as the new choices: `striped` is always on (every table is striped), `stacked`
is *Rows as lines on phones*.

## Review status (draft pages only)

While the standardisation is reviewed, the new Table rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews. stryker.com pages imported today render exactly as
before (checked element by element on Medical patents, Sternal plate, Ankle truss system and Futura CSI);
patients pages are not touched.

The migration works the same way: today's migration leaves the full-width stryker.com tables out of the
page and keeps the ones in columns as raw tables. Only a review build used for the draft pages writes every
stryker.com table as a Table block with its choices (and keeps tables out of the Cards rule for rows of
tiles). A normal re-import of a real page gives exactly the same output as before (compared file by file on
8 pages: Acute Care resources, Craniomaxillofacial patents, Hydro irrigation, ProCare, MDI, SafeAir, SVIN and
Vocera easter eggs).
