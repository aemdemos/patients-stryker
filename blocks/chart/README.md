# Chart Block (POC)

One reusable EDS block supports **Chart (pie)**, **Chart (doughnut)**,
**Chart (bar)**, and **Chart (column)** using Google Charts `corechart`.
No framework, build step, jQuery, API key, or AEM component configuration.

## Authoring model

Author the heading and optional description as regular content **outside** the
chart table. The Chart Block contains only a header and repeating data rows.
Format, Currency, and Axis title are optional **Section Metadata** key/value pairs.

| Where | Field | Meaning |
| --- | --- | --- |
| Regular content | Heading | Normal heading above the chart, not a chart field. Recommended for a meaningful accessible name. |
| Regular content | Description | Optional normal paragraph below the heading. |
| Block name | Variant | Exactly one of pie, doughnut, bar, column. |
| Chart table | Category | Required plain-text category per row. |
| Chart table | Value | Required finite, unformatted number per row. |
| Chart table | Color | Optional three- or six-digit hex color; blank uses the palette. |
| Section Metadata | Format | Number (default), Percentage, or Currency; case-insensitive. |
| Section Metadata | Currency | Three-letter code or supported symbol; default USD. Used only with Currency format. |
| Section Metadata | Axis title | Value-axis label: X-axis for horizontal bar, Y-axis for vertical column. Ignored for pie/doughnut. |

Merge the first row of each table into one block-name cell. Leave the remaining
rows unmerged. The literal **Category / Value / Color** header belongs inside the
Chart table. A two-column Category / Value table is also supported.

All charts in one section share its metadata settings. Separate examples with
an EDS section break (`---` in DA) when they need different formats, currencies,
or axis titles. Section Metadata belongs to the same section as the chart,
not a separate section. Place one Section Metadata table in each section;
unrelated section metadata continues to work through the site's existing handler.

The project converts the table to `data-format`, `data-currency`, and
`data-axis-title` on `.section` before decorating charts. Published DA content
with those attributes is supported too. No global script change is needed.

### Migration from the earlier POC

- Move Title out of the Chart table into a regular heading.
- Move Subtitle out into a normal paragraph.
- Move Format, Currency, and Axis title into the Section Metadata table.
- Keep only the Category / Value / Color header and data rows in Chart.

Legacy configuration rows before the data header are rejected with a useful
warning and authored-content fallback. Category names such as "Title" or "Format"
are valid when they appear as data after the header.

## Examples

All figures below are fictional sample data, not patient or clinical data.
Descriptions and headings below are ordinary content, not chart fields.
Each example must occupy its own section.

### Sample workshop attendance

Pie charts show parts of a whole. This example tests percentage-point inputs.

| Chart (pie) | | |
| --- | --- | --- |
| Category | Value | Color |
| United States | 64 | |
| Europe | 23 | |
| Other | 13 | |

| Section Metadata | |
| --- | --- |
| Format | Percentage |

---

### Sample resource requests

Doughnut charts use the pie data model with a fixed hole. Blank colors use the palette.

| Chart (doughnut) | | |
| --- | --- | --- |
| Category | Value | Color |
| Guides | 48 | #545857 |
| Videos | 32 | #007C8A |
| Checklists | 20 | |

| Section Metadata | |
| --- | --- |
| Format | Number |

---

### Sample event registrations

Horizontal bars compare quantities. Axis title labels the horizontal value axis.

| Chart (bar) | | |
| --- | --- | --- |
| Category | Value | Color |
| North | 120 | |
| South | 85 | |
| West | 105 | |

| Section Metadata | |
| --- | --- |
| Format | Number |
| Axis title | Registrations |

---

### Sample outreach budget

Vertical columns compare monetary amounts. Axis title labels the vertical value axis.

| Chart (column) | | |
| --- | --- | --- |
| Category | Value | Color |
| Q1 | 12500 | |
| Q2 | 15000 | |
| Q3 | 13750 | |
| Q4 | 16000 | |

| Section Metadata | |
| --- | --- |
| Format | Currency |
| Currency | USD |
| Axis title | Budget (USD) |

`examples.html` contains the equivalent EDS markup, including regular headings,
descriptions, and Section Metadata tables. No CMS demo page or library entry
has been created or changed.

## Formatting and presentation

- Values stay numeric in the Google DataTable; formatted strings accompany them.
- **Percentage means percentage points:** `64` displays as `64%`. Pie proportions
  use the numeric sum; the block does not enforce a total of 100 or recompute shares.
- Number format uses document language (fallback en-US) and up to two decimals.
- Currency codes such as USD, EUR, GBP, JPY, CAD, AUD use `Intl.NumberFormat`
  currency precision. Prefer codes to ambiguous symbols. Supported symbol characters
  are $, €, £, ¥, ₹, ₩, ₽; symbols prefix a localized number with up to two decimals.
  Defaults do not infer the visitor's currency.
- Axis labels use a numeric pattern with a literal percentage suffix or currency
  identifier; their localization may differ from labels and tooltips.
- Existing site font, spacing, surface, and color tokens; no global style changes.
- Full container width, 300–420px responsive height derived from spacing tokens.
- Palette cycles navy-bright, primary-dark, purple, secondary, accent-link-hover,
  primary-active. Defaults contrast at least 3:1 with white. Custom colors require review.
- Pie/doughnut use a bottom category legend and formatted in-slice value labels.
  Label text uses whichever of black or white has higher contrast with each slice.
  Google may omit labels on slices too small to fit them; tooltips retain exact values.
  No small-slice grouping; white slice boundary; doughnut hole is 50%.
- Bar/column: one numeric series, category labels, formatted value annotations,
  no redundant legend, automatic zero-inclusive range, 500ms startup animation.
  Reduced-motion disables animation; later redraws do not animate.
- Native Google hover/tooltips are used without custom selection handlers.
- ResizeObserver redraws changed positive-size containers via requestAnimationFrame.
  Older browsers use a frame-batched resize listener. Multiple charts are independent.

## Accessibility, validation, and fallback

The block does not create or modify headings or descriptions. Its visual's
accessible name is the nearest preceding regular heading in the same section
(`.default-content-wrapper`, h1–h6). If no preceding heading exists, it uses "Chart";
this is not a validation error. A following heading or a heading in another section
does not name the chart. Add a meaningful regular heading before each chart.

A captioned semantic data table with column and row headers is visible during
loading and on validation/rendering failure. It is hidden after successful rendering.
There is no "View chart data" disclosure. Successful charts rely on Google's
generated accessible markup; the independent semantic table is a failure fallback.

Missing variant/header/data, malformed numbers, nonempty extra columns, invalid
format/currency settings, or negative/all-zero pie data prevent rendering. Original
authored rows are preserved in the visible fallback rather than silently dropped.
An invalid color warns and uses the palette without discarding valid data.
Bar/column values can be negative. Entirely empty rows are ignored.
Network, CSP, package timeout, formatter, and rendering errors display an explicit
message and the table. Development warnings identify the chart using its heading.

Without JavaScript, original EDS row/cell content remains visible but is not enhanced
into a semantic table. EW live data/metadata edits require a preview reload in this
POC. The rendered chart host is outside authored editable wrappers.

## Google dependency and CSP

The official `https://www.gstatic.com/charts/loader.js` loads only for valid charts.
A module-scoped promise shares script injection and package readiness across blocks:
`google.charts.load('current', { packages: ['corechart'] })`. Existing loader scripts
are adopted. Loading times out after 15 seconds; failures are shared, so reload to retry.

The current CSP is unchanged (`strict-dynamic`, `require-trusted-types-for 'script'`).
The user-approved `stryker-chart-loader` policy accepts only the exact official loader
URL. Google's own `goog#html` policy for subsequent resources needs production review.
If policy names are restricted, permit the names used by the chosen Google release.
Host-allowlisted deployments must review Google resources on www.gstatic.com and
www.google.com, including applicable styles/fonts. Never weaken CSP or add a
permissive default policy to bypass loading failures.

Corechart requires no API key. Data is passed to browser visualization objects,
not a chart-image API. Third-party dependency requests still require privacy,
consent, licensing, hosting, and version-pinning review.

## Local testing

Use the repository's Node-based test approach; no new test dependency:

```sh
node --experimental-default-type=module --test test/chart/chart.test.mjs
node --experimental-default-type=module tools/importer/xf-fragment-path.test.mjs
npm run lint:fix
npm run lint
npx -y @adobe/aem-cli up --no-open --forward-browser-logs --html-folder blocks/chart
```

Node 20 needs the module flag because browser ES modules coexist with CommonJS
ESLint configuration. No application build or npm test command exists.

Open `http://localhost:3000/blocks/chart/examples` for real Google rendering under
the current CSP. Check section settings, names, labels, tooltips, resize, and failure.
Open `http://localhost:3000/test/chart/chart.browser.html` for deterministic browser
assertions using a Google API double. Run in a visible tab; hidden tabs can suspend
ResizeObserver/animation frames. VS Code automation can use CDP focus emulation.

### Verified section-metadata POC results

- Chart unit command above: 17 tests passed.
- Browser test page: 72 assertions passed, including section settings, shared
  settings, currency isolation, heading-derived names, and no generated titles.
- Existing importer regression command: 17 cases passed.
- `npm run lint:fix` and `npm run lint`: passed with zero errors; four intentional
  console-diagnostic warnings remain, without lint suppression.
- Real Google Charts: all four authored Section Metadata tables were consumed
  by the existing site handler, and their formats/axis titles rendered correctly.
- At 375, 600, 900, and 1200px, all four SVGs matched their container widths with
  no horizontal overflow.
- Blocking the Google loader showed four visible fallback tables named using
  the regular headings, without generating any headings inside Chart Blocks.
- No build command exists; no build system was added.

## Known POC limitations and production confirmations

- Single series only; no remote/CSV datasets, export, or AEM migration automation.
- No authored dimensions, typography, axis limits, animation timing, or hole size.
- Section-level settings are shared, not per-chart overrides.
- Confirm final palette, precision, USD default, percentage semantics, legend behavior,
  and fallback-only table accessibility with screen readers.
- Confirm EW re-decoration/removal lifecycle, localized UI messages, CSP/privacy,
  and a pinned Google release.
- The Block Library remains unchanged, as requested.
