# Step 7b: news-detail rebuilt on the corp engine (2026-10-28)

Branch `news-detail-rebuild` (from `import-tier2-landing-page`, without `main`). Decision (user,
2026-10-28): discard the earlier news-detail template and import scripts (#451 / #457) and
rebuild news-detail like the other corp templates, so a re-import is based on our work only.
The earlier pilot with #457 merged stays on branch `import-news-detail` for reference.

## Removed
- `templates/news-detail/` (news-detail.css, news-detail.js, news-detail-themes.css)
- `tools/importer/import-news-detail.js` (+ bundle), `transformers/news-detail-sections.js`,
  `transformers/news-typography.js` (unused), `urls-news-detail.txt`
- the news-detail branch of `import-xf-fragments.js`: every XF now goes through the corp
  section builder
- the news-detail check in the cleanup transformer (corp templates are recognised by
  `template.site`)

## Kept (shared, from the earlier news work; the other templates depend on them)
Removing these would mean rewriting the core of the engine:
- `corp-richtext.js`: about 385 of its 467 lines started as the #451 rich-text rules.
  - It has since been extended: effective copy size, colour rounding, h-serif, heading sizes,
    label sizes.
  - Every component handler uses it.
- `styles-corp.css`: about 260 lines come from #441 (heading conventions: gold rule, h-serif),
  #443 (shared fragment styles: contact-aside, connect-band, bu-resources) and #451.
- `import-news-shared-fragments.js` (#443): it builds 7 shared XFs that our product-detail and
  tier2 pilots also use:
  - business-unit footers;
  - sage social icons;
  - the sustainability contact band and contact block;
  - the talent banner.

  Candidate to move into the corp builder later.

## New
- **`import-news-detail.js`**: `createCorpImport({ name: 'news-detail', facts })`, the same as
  the other templates.
- **Corp handlers for the news template's own slots** (outside the AEM component wrappers):
  - the lead image slot (`c-standalone-image`) and the intro rich-text slot (`c-rich-text-editor`)
    go to the image and text handlers;
  - the publish date (`c-publish-date`) is the `published` metadata (component map: established);
  - the event location (`c-event-location-properties`) becomes a Heading 5 when it has text;
  - the template's "back" link (`c-back-button`) is skipped.
- **Shared fixes:**
  - A line break typed in nested formatting
    (`<b><span class=futura-bold>About Stryker<br></span></b>`) is now kept. Before, the label ran
    into the text (national-direct-to-patient-marketing-campaign).
  - A space typed at the end of bold text stays between the words. Before, "The solution" ran
    into "you've" (inspace) and "The 1788" into "Platform".
  - Regression check on the product-detail, long-page-detail and tier2 pilots: only those pages
    changed.

## Pilot: 15 pages (.migration/plans/pilot-tools/nd-pilots.txt)
- **Pages:** press releases, features with a slide and XFs, StrykerTalks (video + headline),
  podcast (video + text), references, a product-security bulletin, a sustainability page with a
  form, an EMS video story.
- **Coverage:** 15/15 ok, no `.html` links.
- **Reports:** every component handled. One note: a Large Headline next to rich text, so the
  large-headline modifier is left off.
- **Text styles:** 16 differences at 1440 and 16 at 375, over 15 pages, with no news template
  CSS yet.

## Styling table (measured on the live pages, 1440 / 900 / 375 px, leaf computed style)

| # | Difference | Pages | Live → preview | Cause | Proposed layer | Kind |
|---|---|---|---|---|---|---|
| 1 | Publish date under the title | all 15 (710 pages) | H5 Futura bold 14px, 15px under the H1 → not shown | component map: publishdate = metadata only | importer: the date as a Heading 5 in the title section (as live), `published` metadata kept. **Needs approval:** changes an established component-map row | consistent |
| 2 | Article column position | all | live: copy 2/3 of the container (col-sm-8, 910px at 1440), at the left; title full width (1380px) → preview: 910px centred, title 910px | the default-content width is centred | template CSS `templates/news-detail`: from 600px, title section full width, article sections left-aligned at 2/3 | consistent |
| 3 | Space under the title | all | live 131–150px from the date to the copy → preview 82–119px | template slots (date, empty event location) | template CSS: the title section's bottom margin (measured) | consistent |
| 4 | Heading 3 at 0.8em (16.8px / 14px) | EP (10) | Egyptienne 16.8 → 21px | the heading-size styles cover 1.25 / 1.5 only | heading size style for 0.8 (`h-0-8`, **new name to approve**), like h-1-25 / h-1-5 | follows source |
| 5 | StrykerTalks statement in 1.5vw | heath (1) | H2 21px → 24.5px | a Large Headline line set at 1.5vw becomes a Heading 2 at the corp size | importer: a 1.5vw statement stays a paragraph (Large Headline copy size) | follows source |
| 6 | Teal Futura link with ► ("READ MORE ON OUR INVESTOR RELATIONS SITE HERE") | vocera (1; press releases) | Futura bold teal → plain link | rich text: span.futura-bold teal link with ► | importer: the standalone-link convention (Bold + Underline link, link-strong), as span.standalone-link | follows source |
| 7 | Large Headline vw copy next to an image in an XF | promoting-high-quality (3) | 21px → 14px | vw copy in default content | normalise (approved rule, as tier2 item 4) | per instance |
| 8 | "Connect with us" band heading | EP (1) | Futura → Egyptienne | shared fragment (connect-band, #443) + h-serif | check the fragment's heading rule | one-off |

Heights after these: 0.6–1.08 of live; the low ones (StrykerTalks, video stories, podcast) come
from 2 and 3 (column width and title spacing).

## Next (after approval)
Apply the table, re-run the 15 pilots, and run the regression check on the product-detail,
long-page-detail and tier2 pilots. Then re-import the 95 local news pages into a scratch folder
and diff them against local content and DA. Report the differences, including the probable
author edits in DA.
