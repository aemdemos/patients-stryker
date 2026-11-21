# Responsive styles on www.stryker.com: where they come from, how we cover them (2026-11-06)

Question: the source changes styles between desktop and mobile (e.g. the news title is Futura bold on desktop, Egyptienne on phones). Which cases exist, and how can authoring cover them without writing everything two or three times?

## Example: news title

`https://www.stryker.com/us/en/about/news/2017/Stryker-reports-first-quarter-2017-results.html`

- The heading is the page title (`jcr:title`), rendered by the news-detail template; the export has no style for it.
- The switch is one rule in the site stylesheet (`components.min.css`): `@media (min-width: 840px) { .h1-title h1 { font-family: "Futura for Stryker"…; font-weight: bold } }`. Below 840px the default `h1` font applies (Egyptienne Light, 500).
- Ours already does the same, with no authoring. `templates/news-detail/news-detail.css` (main; owner InasPlayground) switches at 900px, but the breakpoint table maps 840 → 600, so between 600 and 899px that title is serif where the source's is Futura (from 840px). Left to its owner. Our `templates/news-detail-engine` switches at 600px.

## Three possible sources, measured

| Source | What it is | Count | Where it belongs |
|---|---|---|---|
| Site stylesheet, per component | Rules in width media queries for components and structure: grid 678, header/nav/forms ~150, banners, carousels, heroes, tables… Font rules: 150, nearly all header, nav, forms, banners, heading sizes and the page title. | 2,335 rules in `base.min.css` + `components.min.css` | Block / template CSS, once. Authors do nothing. |
| Site stylesheet, per authored style | Only the vw text sizes: `.fontsize-1vw` … `.fontsize-9vw` double below 840px and become fixed px from 1439px (n × 14px). No media rule names any other authored class (`fontsize-*em`, `futura-bold`, `urw-egyptienne`, colours… 41 classes). | 17 classes, ~3,580 uses in the exports | The definition of the size value: `[[5.5vw]…]` already does it (`styles-corp.css`, `span.corp-vw`). Authors write the value once. |
| Authored per device in AEM | `cq:responsive` widths per tablet / phone; carousel `mobileOverlay` (478); `experienceFragmentPathMobile` (243 slides); `table.mobileDesign` (11); `pagehero.hideInMobile` (1). No per-device font, size, colour or spacing exists in any dialog, and no visibility classes (`visible-xs`…) in authored text. | cq:responsive: 1,150 tablet + full-width phone; 1,002 full-width phone only; 427 other phone widths (231 with a tablet width); 13 hide | AEM authors already set these per device. One row each: `Grid` (desktop / tablet / phone units in one row), `Column` (`col-phone`), mobile slides of the hero. |

**Rule:** responsive behaviour belongs to the definition of a name or a value, never to the author. The one exception is layout widths, where AEM itself asked authors per device; these stay one row with up to three values.

## Finding the cases we don't know about

QA at two widths shows them: a style finding at 375px with no counterpart at 1440px on the same text is a responsive gap. `.cbr/local-scripts/resp-gaps.py <findings.jsonl>` lists them.

On the 50 converted product-detail pages (run 4ce76928):
- Of 1,654 font findings at 375px, 189 occur only at that width:
  - 150 are line heights of vw-sized text (measurement, same values);
  - 12 font families are SVG chart labels (ClotTriever);
  - 1 is real: Neptune S, text in a `tabbed` section renders 21px instead of 11.3px. The section's `Text` / `Headings` rows didn't reach the tab panels (the tabs are built first). Fixed in `scripts/corp-settings.js` (2026-11-06). The 6 converted pages with such a section now match the real-path pages at 1440 and 375 (206 text runs, 0 differences).
- So product detail has practically no uncovered responsive styles.

The stylesheet survey (`resp-survey.py`, `resp-survey2.py`) lists which components have responsive rules. It doubles as a checklist per block.

## Tablet widths

Source breakpoints 840 / 1024 map to EDS 600 / 900, so in 600–839px and 900–1023px the two sites are in different bands by design. A tablet QA width should sit where both agree (e.g. 860px: tablet on both; 1100px: desktop on both); otherwise it reports the mapping, not a defect.

## All templates on preview (2026-11-07, local qa-tool, run 32117c5d)

37 pairs, 7 templates (base, contact division, event detail, long page detail, news detail, product detail, search), source www.stryker.com vs integration-v3 preview, at 1440 / 860 / 375 px. All pairs ok. Findings at 375 or 860 px with no counterpart at 1440 px on the same text (`resp-gaps2.py`, list in `.cbr/qa-resp/gaps.txt`):

| Template | Gap | Cause | Where it belongs |
|---|---|---|---|
| contact division (6 of 6 pages) | Contact labels (`Address:`, `Phone:` …) Futura 17.5 px on ours at every width; source Humanist 14 px below 840 px | Component rule `@media (min-width: 840px) { .c-contactus .contact-label { font-family: Futura; font-size: 17.5px } }` | Template CSS of contact-division (no template folder yet), switch at 600 px; no authoring |
| news detail (main's template) | Bob's sudden cardiac arrest story: video-text quote 21 px on ours at every width; source `fontsize-1-5-vw` (12.9 px at 860, 11.3 px at 375) | The importer dropped the vw size in the video-text section; at 1440 both are 21 px (the cap), so it only shows narrower | The news-detail importer (owner InasPlayground); no authoring |
| event detail, long page detail, product detail | Line heights with equal values; a date split in two spans on the source (wraps at 375) | Measurement and text matching | Nothing |

Base, search: nothing. So across the migrated templates, the per-width differences found are component rules (CSS, once) and one import gap. None needs authoring per device.
