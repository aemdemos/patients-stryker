# Corp typography: where we stand (2026-10-30)

Measured on the 39 pilot pages (product-detail, long-page-detail, tier2 landing, news) against
live www.stryker.com at 1440 / 375px with `.migration/plans/pilot-tools/compare.mjs`; style
differences now 3 / 6 (product-detail + long-page) and 3 / 4 (tier2 + news). Batches and
results: `step7b-news-rebuild.md`.

## Done (approved or in use)
- Run tags where section styles cannot carry the look: `[[size-<n>vw]]`, `[[size-<n>em]]`,
  `[[serif]]`, `[[body-font]]` (corp-richtext.js `markRuns` / `finishRuns`, scripts/corp-type.js)
- h4 14px on phones site-wide (Columns too); Statistics (fast-facts); Large Headline copy in
  Egyptienne; Hero Corp lines carry their own sizes (no size-<n> / copy-size-<n> from the
  engine); promoted Large Headline h1 plain bold; band headline size on the band's own headings
- Futura bold links alone on their line: text link with `[[futura-bold]]` inside (not a
  button); `[[color-black]]`, `[[color-light-gray]]`, `[[color-silver]]`, `[[color-dark-gold]]`
- Egyptienne inside Futura bold = Egyptienne bold; Large Headline h4 Futura bold unless
  Egyptienne; curated CTA title Egyptienne / black link; label sizes kept

## To approve (names in use)
`[[size-<n>vw]]`, `[[size-<n>em]]`, `[[serif]]`, `[[futura-bold]]`, `[[color-black]]`,
`[[color-light-gray]]`, `[[color-silver]]`, `[[color-dark-gold]]`, `Statistics (fast-facts)`.
All need Block Library / authoring-guide entries (typography-map.json rules marked proposed).

## Open
1. **Decision:** rich-text h1 in a Columns cell (cardiovascular-health): the Block Library makes
   a cell h1 a Large Headline (56px); live 28px. Options: a Columns option for page-type
   headings, or keep the library rule.
2. EMS hero on phones: live text black, ours the authored white (the slide has a mobile XF;
   cause not confirmed).
3. EMS tabs next to a column: imported as a flex section, the tab labels show as headings
   (structural, not typography).
4. lifepak-15 "Connect with an expert": a heading on live, a button here.
5. isolibrium image-right hero h2 (1.25em: 30.6px live, 21px here) and its `#323232` heading
   colour (no tag; rounded to grey).
6. news national-direct-to-patient "References" label: 11.2px here, 14px live.
7. Large Headline plain lines: 21px on phones, 1vw up to 14px on desktop on live; not carried
   (only the 1440px size matches).
8. The light-grey "In my practice" quote and similar: exact now; rgb(237,238,236) values in
   gradients / boxes not re-checked.
