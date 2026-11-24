# Chart: three chart types, one switch

*A walkthrough of the Chart block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 11 charts shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | A few stryker.com product and evidence pages show **charts**: columns (jump distance, Raymond scores, radial pressure), one bar chart (push force) and one pie (aneurysm locations). Authors typed each value, its label and its colour, picked a number format, a height and whether the values show on the bars; the page drew the chart with an outside charting tool. |
| **The risk** | Turning the charts into pictures would freeze the numbers; copying the charting tool would add a heavy outside script for 11 charts. |
| **What we did** | We counted every chart on the live site and kept what a visitor sees: the chart type, the values, labels and exact colours, the title and axis title, and the values on the bars. The Chart block draws them itself (no outside script), and the **Block options panel** offers the type and one switch. |
| **The result** | Charts look as today. On the review page the bar chart matches stryker.com to the pixel (bars, axis, steps, phone layout), the column charts keep their bars, steps and value colours, and the pie keeps its slices, values and legend. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Chart type | 3 | 11 | 3 (`column`, `bar`, `pie`) | **100%** | column 9 (on 7 pages), bar 1, pie 1 |
| Values on the bars | on / off | 11 | 1 switch (`data-labels`) | **100%** | on 2, off 7; the pie always shows its values |
| Number format | 3 (percentage 5, currency 2, number 2) | 9 | none | **100%** of what shows | the format only showed in stryker.com's hover boxes, never on the chart |
| Colours | one per bar or slice | 11 | the rows' own colours | **100%** | exact stryker.com values, nothing blended |
| Pie hole | 0 | 1 | none (a full pie) | **100%** | |
| Chart height | 200, 300, 400px | 11 | none: column charts 200px, bar charts one 61px row per bar | see section 7 | |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Chart type, values on the bars | **Block options panel** |
| The bars or slices | the block: one row per bar or slice (label, value, colour) |
| Title | the block's first row (one cell); its sizes and fonts with **Text style** |
| Axis title, axis maximum | the block: a row `Axis title` or `Axis maximum` |

---

## 3. The variants on stryker.com

### 3.1 Column chart (`column`)

Vertical bars, half as wide as their slot, on a scale with a light line at each step and a lighter one
half way, a black base line, the steps on the left and the labels under the bars (two lines at most).

| | |
|---|---|
| Charts on the live site | **9** on 7 pages |
| Example pages | [Modular dual mobility](https://www.stryker.com/us/en/joint-replacement/products/modular-dual-mobility.html), [ULTRA registry](https://www.stryker.com/us/en/neurovascular/c/driven-by-evidence/ultra-registry.html), [Surpass Evolve](https://www.stryker.com/us/en/neurovascular/products/surpass-evolve.html) |

### 3.2 Bar chart (`bar`)

Horizontal bars (30px in a 61px row), the labels on the left, the steps under the bars and the axis title
below them.

| | |
|---|---|
| Charts on the live site | **1** |
| Example page | [Surpass Evolve](https://www.stryker.com/us/en/neurovascular/products/surpass-evolve.html) (push force) |

### 3.3 Pie chart (`pie`)

A full pie (360px, or 55% of the width on phones), the values in white in their slices, starting at the top
and going clockwise, the legend on the right.

| | |
|---|---|
| Charts on the live site | **1** |
| Example page | [ULTRA registry](https://www.stryker.com/us/en/neurovascular/c/driven-by-evidence/ultra-registry.html) (aneurysm locations) |

## 4. The options (Block options panel)

### 4.1 Chart type

| Choice | Option | Charts |
|---|---|---|
| Columns | `column` | 9 |
| Bars | `bar` | 1 |
| Pie | `pie` | 1 |

### 4.2 Values on the bars

| Choice | Option | Charts |
|---|---|---|
| Values on the bars | `data-labels` | 2 |

The value sits above its column (or at the end of its bar) in a darker shade of the bar's colour, black on
grey and black bars, as on stryker.com.

## 5. The text (Text style, not Block options)

The chart's own text (steps, labels, values, legend) uses stryker.com's chart font (Cambo 14px). The
**title** is normal text: on most charts the default (Futura 14px); where stryker.com sizes it (ULTRA
registry: "Raymond I & II" in Futura bold 1.5×, "at one year" in Egyptienne 1.5×) it uses **Text style**
markers, with the same limited sizes as every other block.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Bar chart (Surpass Evolve, push force) | bars at 121px, 390 / 412 / 647px long, 30px high, 61px apart; steps 0 to 300 by 50 (0-200-400 on phones) | the same | **100%** |
| Column chart (ULTRA registry) | bars 126px wide at 148 / 401px, 101 / 112px high; steps 0-50-100 | 127px at 147 / 401px, 103 / 114px high; the same steps | **98%** |
| Value colours | 70% shade of the bar (#866126, #5d3061, #b37f00, #7f6482), black on grey and black | the same | **100%** |
| Pie | 360px, values in white, legend on the right | the same (values 7/8 of the way out, as on stryker.com) | **98%** |
| Fonts | Cambo 14px; titles Futura 14px or Text style | the same | **100%** |

**Checked on the review page.** The Chart review page holds the five stryker.com charts, each in the section
it sits in there (beside its text, a side-by-side section where the import makes one). A comparison
measured the bars, steps, labels, values, legend and title on both sites at 1,440px and 390px.

**What differs, by design:**

- **Chart height**: every column chart is 200px (stryker.com: 200px, and 400px on one Surpass Evolve chart),
  so that chart is half as high, with steps 0 to 6 by 2 instead of by 1.
- **Labels under columns on phones** wrap onto two lines; stryker.com cuts them short (*28mm fixed b…*) and
  staggers them.
- **Hover boxes**: hovering a bar shows its label and value as a simple tooltip, without the number format
  (percentage, currency) stryker.com's hover box adds.
- **The modular dual mobility chart** fills the page width on the review page: the review import doesn't put
  it in a side-by-side section with the text beside it yet.

---

## 7. To review (outliers)

| What | Charts | Example pages | Proposal |
|---|---|---|---|
| A column chart 400px high | 1 | [Surpass Evolve](https://www.stryker.com/us/en/neurovascular/products/surpass-evolve.html) (radial pressure) | 200px, as the others |
| A number format that never shows | 9 | | not carried over |
| Chart in a half column beside text | modular dual mobility | [Modular dual mobility](https://www.stryker.com/us/en/joint-replacement/products/modular-dual-mobility.html) | a side-by-side section (as the ULTRA registry and Surpass Evolve charts) |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The outside charting tool (Google Charts) | the block draws the charts itself: no outside script, nothing to load from another site |
| The number format (percentage, currency, number) | nothing: it only showed in hover boxes |
| The chart height | one height per type |
| A chart as a picture | not needed: the numbers stay text, readable and editable |
| Older imports of the same charts as `chart-corp` (26 blocks) | the same rows (`Format`, `Axis title`, `Labels`, label / value / colour) work in the Chart block; they render as Chart when the block name is changed or the page is imported again |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Three types and one switch | One Surpass Evolve chart is half as high |
| The values stay editable text, with their exact colours | A new colour is written as a colour code (#rrggbb) in the row |
| No outside script | Labels on phones wrap instead of being cut short |

---

## 10. Decisions we need from the business

**To approve:**

1. A Chart block (not pictures of the charts), with three types and *Values on the bars*.
2. One height per chart type, and no number format.
3. Removing the review-only gate (section *Review status*).

**Proposed, still open (from the package):**

- **Build a chart block, or replace the charts with images?** The proposal is the block: 11 charts, their
  numbers stay text and the colours stay exact.

---

## Glossary

| Term | Meaning |
|---|---|
| Column chart | vertical bars, one per value |
| Bar chart | horizontal bars, one per value |
| Pie chart | a circle cut into slices, one per value |
| Step | a value on the scale, with a light line across the chart |
| Values on the bars | the number written above each column or at the end of each bar |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which chart

The Block options panel reads the selected chart and greys out the choices that would do nothing.

| Needs | Choices |
|---|---|
| A column or bar chart (a pie always shows its values) | Values on the bars |
| Any chart | Columns, Bars, Pie |

## Review status (draft pages only)

While the standardisation is reviewed, the Chart block renders **only on draft pages** (`/drafts/…`) and in
the authoring panels' previews. No stryker.com page imported today uses it (the older `chart-corp` blocks
are untouched), so nothing else changes; patients pages are not touched.

The migration works the same way: today's migration leaves stryker.com charts out of the page. Only a review
build used for the draft pages writes each chart as a Chart block (its type, title, rows, axis title and
maximum, values on the bars), in a side-by-side section when it sits beside text. A normal re-import of a
real page gives exactly the same output as before (compared file by file on modular dual mobility, ULTRA
registry and Surpass Evolve).
