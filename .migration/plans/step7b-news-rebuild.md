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

## Applied (2026-10-28, table approved as proposed)
- **Preview measurement:** the local dev server loaded the old `templates/news-detail` CSS / JS
  from the remote branch while the template had no files of its own. The first comparison above
  includes that CSS; the results below don't.
- **Item 1:** the publish date is a Heading 5 under the title, Futura bold 14px (template CSS).
  `published` metadata is kept, and component-map row `publishdate` is now approved.
- **Items 2 and 3:** new `templates/news-detail/news-detail.css`.
  - Title and date run the full container width. From 600px the article sits in the left two
    thirds (910px at 1440, 570px at 900, as live). Full width below 600.
  - The section gap after the date already matches live (135 vs 131px at 1440, 161 vs 150 at 900),
    so no extra margin is needed.
  - Found while measuring, same layer:
    - the title is Egyptienne on phones and Futura bold from 600px (as long-page-detail);
    - plain h2 / h3 24.5 / 21px from 600px (as product-detail and tier2);
    - h4 14px on phones.
- **Item 4:** `h-0-8` in `corp-richtext.js` headingSizeStyle and `styles-corp.css` (scale 0.8).
  The EP h3s are 16.8px / 14px, as live.
- **Item 5: not applied.** The source authors the statement as a Heading 2 at 1.5vw. In this
  Columns block (no large-headline modifier) a paragraph renders 14px, further from live (21px)
  than the heading's 24.5px. Left as a one-off.
- **Item 6:** a Futura bold link ending in ► becomes the Bold + Underline link (link-strong). The
  triangle, font and colour spans are dropped (vocera: as live).
- **Item 7:** normalised (approved rule).
- **Item 8:** the sustainability "Connect with us" XF now goes through the corp section builder,
  like its endoscopy / sports-medicine twins (bg-gold, h-1-5: Futura 36.75px, as live), and is
  out of `import-news-shared-fragments.js`.

**Result on the 15 pilots:**
- 4 text-style differences at 1440 and 4 at 375, all from items 5 and 7. Before: 16 / 16.
- No missing texts.
- Heights 0.79–1.19 of live. Highest: a-safe-space 1.19, surgical-icu 1.18. Lowest: EP 0.79.
  The rest is spacing.

## Re-import of the 95 local news pages (2026-10-28, scratch folder; nothing uploaded)
- 95/95 imported with 4 XFs. Coverage 99/99 ok, no `.html` / `/index` links.
- Every component handled. One note on 3 StrykerTalks pages: a Large Headline next to rich
  text, so the large-headline modifier is left off.
- Regression on the product-detail, long-page-detail and tier2 pilots: only anchor IDs changed
  (the source generates them on every load).

### Fixed while comparing (shared rich-text rules)
- **Plain-bold labels on their own line** ("About Stryker", "For investor inquiries please
  contact:") now get `[[body-font]…]` again. The line break inside `<b>About Stryker<br></b>`
  now moves out before the label check runs. Live shows Humanist bold; before the fix the
  preview showed Futura.
- **A space held only by an empty element** is kept: "software<sup>&nbsp;</sup></b>continues"
  (autonomous-guidance).
- **No `[[color-teal]]` tag on a link**: teal is the link colour (pangea, triathlon).

### Compared with DA (corp preview; DA reads return 401, the preview matched DA where checked)
Section styles, H5 dates, spacer sections and section splits ignored, 34 of 95 pages still
differ. By cause:
- **Our rules (expected):**
  - XF content in Fragment blocks; hero slides as Hero Corp fragments (surgical-icu,
    a-message-to-our-customers).
  - "About Stryker" in span.futura-bold → Bold + Italic (Futura), 12 pages; DA has Bold, which
    the old template JS made Futura (same look).
  - Labels authored as Heading 3 stay Heading 3, 7 pages (#451 turned them into paragraphs).
  - StrykerTalks statements keep their authored level: Heading 3 on marucci / pierce / stiles
    (DA: Heading 2).
  - The source's blank line inside a paragraph stays a `<br><br>` (q-guidance-system; #457 split
    the paragraph).
  - `http://www.stryker.com` links become `https://`.
  - The fixes above.
- **Probably author edits in DA (a re-import would undo them):**
  - endoscopys-rosales-shares: video poster StrykerTalks23_8.30.23_1200x675_Vs1 (source:
    ST-Endo-Final-TS_1-AVS)
  - stryker-s-heath-shares: video poster AnnieHeathStrykerTalks_thumbnail (source:
    AnnieHeathStrykerTalks-AVS)
  - kevin-on-insideout-podcast: Columns with `gray-lead`
  - `[[text-1-25]]` on the References / About Stryker labels (national-direct-to-patient,
    over-2400-surgical-cases)
- **Needs a decision: images in a narrow source column.** An image in a col-sm-4 / col-sm-6
  column with the other column empty is narrower on live, e.g. the cerus-endovascular logo at
  440px at 1440. Ours renders at the article width (910px). DA has #457's `image-1-3` /
  `image-1-2` section styles on 13 sections. Matching it needs a section style: propose
  `image-1-3` / `image-1-2` (name to approve).

### Measured in the preview after the fixes (1440 / 375)
- **Lead image** (stryker-unveils-niagara): 910 x 504px, 15px under the date; 345px and 15px at
  375. As live.
- **Narrow-column image** (cerus-endovascular logo): 740px wide (its own size, within the
  910px article) and 29px lower, against live 440px. This is the narrow-column item above.
- **Fixes confirmed:**
  - "software</strong> continues" (space kept);
  - no [[color-teal]] around links on pangea / triathlon;
  - [[body-font]] on the vocera labels.
- **Regression** (product-detail, long-page-detail and tier2 pilots, after the last fixes): two
  pages changed, both with a teal tag dropped inside a link (tier2
  business-association-agreement, news pangea). Everything else changed only in anchor IDs.

## Batch 2026-10-29: explicit spacing names, approved map items (one re-import)
- **Spacing tokens** use explicit names: `padding-top-5`, `padding-left-3-6`,
  `margin-top-minus-8`, `padding-top-10px`. Columns cells use `cell-<N>-<token>`, mixed content
  uses `[[spacing,…]]` markers (now also inside tab panels and block cells). The Hero Corp
  text box takes them as block options (`spaceBlock` in scripts/corp-spacing.js). In a
  coloured box (`boxed`, `box-*`) they replace the box padding, as in AEM.
- **Map items implemented:**
  - box colours: section styles plus `boxed`; new bg-purple, bg-teal, bg-silver (approved);
    bg-slate / bg-plum / bg-forest dropped (not rendered on live);
  - shadow-box; image-border / -grey / -black; btn-purple / btn-blue;
  - white-hr = section break, grey-hr = divider;
  - Statistics `left`; Sticky Nav (local) `no-rule`;
  - Video `no-border` / `autoplay`; Hero Corp `box-<colour>`;
  - transparent hero titles not imported.
- **Re-import:** 39 pilots and 53 fragments, no failures; coverage 95/95; no .html or /index
  links.
- **Measured** (inspace verma-quote, shadow-box with padding-top-5 …): ours x 40 / width
  1360 / padding 68px, against live 41 / 1359 / 68.9px.
- **Comparison** (`node compare.mjs`, results in pilot-tools/out, git-ignored; the old base
  files were lost when /tmp was cleared):
  - pd + lpd: height distance 0.96 / 1.07 (1440 / 375), style diffs 57 / 56;
  - t2 + news: height distance 1.80 / 2.13, style diffs 84 / 276 (188 of them were Table
    cells at 12px on phones; fixed with blocks/table/table-corp.css: 14px at every width, as
    live).
- **Follow-up fixes (no re-import needed):**
  - Cards (resources) video cards (inspace, 15 titles): the page-wide DM pass turned the
    title link to the .mp4 into an inline player, so the title text disappeared. Cards Corp
    now turns it back into the title link (new tab, as live), and the importer adds the
    `#_blank` marker so new imports keep a plain link. The image box is 240px high with the
    image centred (live `.img-container`); at 375 / 1440 the card now matches live to the
    pixel (image y 29 / 62, title y 248, next card y 315).
  - "Link lists rendering as LI 14px" (blueprint, surgical learn, ems) was a comparison tool
    error: it measured the card's list item instead of the title inside it. The tool now
    skips wrapper elements (DIV, SECTION, …); blueprint has 0 differences.

## Batch 2026-10-29 (2): tier2 typography, run by run (lift and shift)
- **Run tags.** AEM sets sizes and fonts on spans inside paragraphs; section styles only carry
  one look per section. The importer now records each text run's size and font before
  cleaning (`markRuns`) and writes bracket tags only where the section styles do not already
  give the run its look (`finishRuns`, per section, in the section builder):
  - `[[size-<n>vw]…]`: the source .fontsize-<n>vw classes (2 × <n>vw on phones, <n>vw up to
    <n> × 14px from 600px; the live CSS: 2 × <n>vw below 840px, <n>vw, <n> × 14px from 1439px)
  - `[[size-<n>em]…]`: the product of nested .fontsize-*em classes (2.1875 = 1.25 × 1.75), × 14px
    in copy, × the heading in headings, when it differs from the section's p-* / h-* size
  - `[[serif]…]`: Egyptienne copy where the section is not serif, serif inside a plain bold;
    a plain bold in an h1–h3 (Egyptienne bold on live)
  - `[[body-font]…]`: a plain bold inside a line of copy (Humanist bold on live)
  - Large Headline copy without a font class is Egyptienne (the component default)
  - rendered by scripts/corp-type.js and styles-corp.css (span.corp-vw, span.serif)
- **Also:** h4 14px on phones site-wide (was news only); Statistics (fast-facts) for the
  stryker.com Fast Facts panel (title row + number beside text, measured on surgical/learn);
  a Large Headline line promoted to h1 is plain bold (was gold); the Large Headline band size
  only on the section's own headings (not card titles in it), h-serif wins in the band; Hero
  Corp without size-<n> keeps the page type (vw lines carry tags); colour tags leave nested
  own colours out at any depth.
- **Tools:** compare.mjs measures the first text run (the leaf), probe.mjs (box tree of one
  component, live vs preview), authored.mjs (where a text is authored in the exports),
  run-all.sh (batch re-import + comparison in the background).
- **Result** (39 pilots, live re-measured): style diffs pd+lpd 51 / 50 → 17 / 19, t2+news
  66 / 70 → 17 / 22 (1440 / 375); height distance t2+news 1.80 / 1.84 → 1.75 / 1.40. Coverage
  91/91, no regressions (one page 1% shorter).
- **Left:** nailing product links (a black bold link 21px on live, a button here); inspace
  banner h4 (Columns large-headline sets h4 in serif, Futura on live); inspace hero h1 line
  without a vw size takes the hero size-3-5; curated CTA title (Egyptienne, black link on
  live); "In my practice" light grey rgb(237,238,236) rounded to white; focusrn h1 56px in a
  Columns cell (28px live); EMS footer labels 21px (17.5px live).

## Batch 2026-10-29 (3): remaining tier2 typography
- Futura bold links alone on their line (357 on 112 pages): a text link with
  `[[futura-bold]…]` inside it, not a button; black link text `[[color-black]]`.
- Exact corp colours: `[[color-light-gray]]` (#edeeec, 613 uses), `[[color-silver]]` (#b2b4ae),
  `[[color-dark-gold]]` (#af6d04) instead of rounding to the nearest shared colour.
- Futura bold around Egyptienne text is Egyptienne bold (innermost class), paragraphs and
  headings: plain bold + `[[serif]]` (orthopaedic "Ask for Stryker", inspace "InSpace:").
- Large Headline h4 not set in Egyptienne: bold h4 (Futura, as live); the Columns
  large-headline plain h4 stays the library's light serif title.
- Curated CTA title: `[[serif]]`, linked `[[serif,color-black]]`.
- Hero Corp: the corp engine writes no size-<n> / copy-size-<n>; each line carries its own
  tags, lines without a size keep the page type (the options stay supported for DA content).
- Labels: a label authored at another size than the section's label-<n> keeps it (EMS footer).
- Columns h4: the corp h4 scale (14px phones, 17.5px from 600px).
- **Result** (39 pilots): style diffs pd+lpd 17 / 19 → 3 / 6, t2+news 17 / 22 → 3 / 4.
- **Left:** cardiovascular-health rich-text h1 in a Columns cell (the library contract makes
  a cell h1 a Large Headline, 56px; live 28px: needs a decision); EMS hero on phones (live
  shows black text, ours the authored white; the slide has a mobile XF, cause not confirmed);
  EMS tabs next to a column become a flex section without tabs (structural); Large Headline
  default size of plain lines (21px phones, 1vw to 14px desktop, not carried); isolibrium h2
  1.25em in an image-right hero and the #323232 heading colour; lifepak-15 "Connect with an
  expert" (a button on ours, an h2 on live); news "References" label 11.2px (14px live).
