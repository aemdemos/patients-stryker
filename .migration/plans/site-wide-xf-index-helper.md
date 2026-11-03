# Plan: site-wide fragment handling, export helper and migration rules from the AEM exports

## Goal
Settle every migration rule the AEM exports can inform **before** the main corp migration starts, so all pages are migrated the same way:
- Every experience fragment (XF) and content fragment a page uses becomes its own fragment document at a path that mirrors AEM.
- Page metadata, anchors, disclaimers, forms and card lists come from the exports instead of guesswork.
- Text formatting maps to the authoring conventions through a single site-wide table.
- AEM components map to blocks, variants and section styles through a single site-wide table.
- Every page is classified, so we know the import order and which already-migrated pages must be re-imported.

Amendments happen as we find the need. *Implementation needs Execute mode. This is the plan only.*

## Decisions
- **Every XF becomes a fragment document, hero and carousel slides included.**
- **Content fragments (DAM) also become their own fragment documents**, at `/us/en/fragments/content-fragments/<rest of DAM path>`. For example, `/content/dam/stryker/content-fragments/eemea/en/contact-information/russia` → `/us/en/fragments/content-fragments/eemea/en/contact-information/russia`. Segments are normalised with the XF rule (lowercase, `_` and repeated `-` → `-`). This can't collide with XF paths, which start `/us/en/fragments/stryker/`.
- **XF paths:** always the `eds*` value. It is identical to `xfToFragmentPath()`, checked on all 1,180 variations with no mismatches and no collisions.
- **Skipped:** the 26 redirects to the home page, the `not_an_xf` entries, and regional variations no page uses.
- **Unpublished variations** (about 7): the importer reports them and never invents their content.
- **The exports produce rules; the scraped page supplies the content.** Rich text and layout are analysed site-wide from the exports and turned into decision tables. The importers then apply those tables to the scraped DOM, which carries the same font classes, column classes and inline styles. That keeps import bundles small and keeps the live page as the source of truth.
- **No guessing:** every table entry is backed by counts from the exports and a measured example page. New variants, section styles, themes and metadata names are proposed to you first.

## Constraint that shapes the helper
Import scripts are bundled and run in the browser-based importer, so they **can't read `.migration/`**. The helper is a Node build step, like `build-fragment-index.js`. It writes small JS data files for the importers and JSON catalogs for us to make decisions from.
- **Bundle size:** if a per-template data file gets too large, split it into batches.

## Part 1: Export helper `tools/importer/migration-index/` (`npm run build:migration-index`)

One entry script with a module per output. It reads `.migration/xf-mapping/**`, `.migration/xf-content/**` and, once exported, `.migration/cf-content/**`. It writes to `tools/importer/data/` and never into `.migration/`.

### Importer data (bundled by the importers)
- **`data/xf-index.js`**
  - **`FRAGMENTS`**, per XF variation:
    - the EDS path
    - the parent XF and its sibling variations
    - master yes/no
    - status: `published` / `unpublished` / `redirect` / `not-an-xf`
    - nested XFs and content fragments
    - the pages that use it
  - **`PAGES`**, per source page, an **ordered** list of XF references:
    - AEM path and EDS path
    - kind: `fragment` or `slide` (desktop and mobile paired)
    - the content area it sits in
    - the `text` summary used for matching
- **`data/cf-index.js`:** per content fragment:
  - its EDS path
  - its fields (once exported)
  - the field sets (`elementNames`) each use shows
  - the XFs and pages that use it
- **`data/page-facts/<template>.js`:** per page:
  - **Metadata:** `jcr:title`, `jcr:description`, `thumbnailAltText`, `cq:tags`, `originallyPublished` / `lastPublished`, `contentID`, template
  - **Hidden anchors:** `deepLinkingId`, in order
  - **Page disclaimer**
  - **Marketo forms:** `formId`, `afterSubmitAction`, `message`
  - **Tab titles** (`tabsGrid`)
  - **Card lists:** the `customizable` target pages, resolved from those pages' exports to title, description, thumbnail image and alt text. Used to check the scraped cards and fill gaps.
  - **Images without alt text**

### Catalogs (for decisions; committed so the decisions can be traced)
- **`data/catalog/xf-report.json`:**
  - fragment counts and the most-reused fragments
  - unpublished variations and the pages that reference them
  - skipped references
  - nested XFs
  - XFs per template
- **`data/catalog/cf-to-export.txt`:** the unique content-fragment paths for you to export (see Part 3).
- **`data/catalog/typography.json`:** every distinct formatting combination in text components across pages and XFs, with counts, templates and 3 example pages. Each combination covers:
  - the tag (h1–h6, p, li, a)
  - font classes (`futura-bold`, `font-egyptienne`, …)
  - `fontsize-*` classes
  - inline colours
  - `standalone-link` and similar classes
- **`data/catalog/components.json`:**
  - every `sling:resourceType` with counts per template
  - column-control types and `cq:responsive` width/offset patterns
  - `backgroundColor` and padding properties
  - section-title usage
  - hidden (`hideComponent`), empty and `ghost` components
  - mobile/desktop pairs
- **`data/catalog/site.json`:** every page with:
  - its template
  - its component signature (the ordered component types per area)
  - its XFs and content fragments
  - its signature group within the template, and any outliers
  - whether it already exists in the migrated content (it then needs a re-import)
  - which `page-templates.json` template covers it, or none

## Part 2: Replace `xf-fragment-map.js` with the site-wide index
1. **`tools/importer/xf-fragment-path.js`**
   - `xfFragmentPath(xf)` returns the EDS path for every **published** XF in the index and `null` for skipped ones.
   - New `pageXfRefs(pagePath)`.
   - New `cfToFragmentPath(cf)`, using the rule under Decisions.
   - `xfKey` and `xfToFragmentPath` stay as they are.
2. **Delete** `xf-fragment-map.js` and `xf-fragment-map.json`.
3. **Update `xf-fragment-path.test.mjs`:**
   - The rule must match every manifest `edsPath`.
   - Skipped references must return `null`.
   - Add content-fragment path cases.
4. **`import-news-shared-fragments.js`:** keep only the per-fragment styling (type, section style, image overrides). Paths come from the index.
5. **Wording updates:**
   - the `page-templates.json` description
   - AGENTS.md "Corp source exports": drop "extend the map", and document the helper, the content-fragment rule and the decision tables

## Part 3: Content fragments
1. The helper lists the unique content-fragment paths. **You export each one** with the same approach as for the XFs: `{cfPath}/jcr:content/data/master.json`, plus `{cfPath}/jcr:content.json` for title and metadata. Save them to `.migration/cf-content/<path without /content/dam/>.json`.
2. The helper adds the fields to `data/cf-index.js`.
3. **Decision checkpoint (you approve):** each use shows a chosen subset of fields (`elementNames`; e.g. Russia shows 4 fields, Cork shows 2). The catalog shows whether every content fragment is always used with the same field set.
   - **If it is:** one fragment document per content fragment.
   - **If not:** I bring options (e.g. a full document plus a display variant per use).
4. **Block for the location box:** check the Block Library first, then:
   1. an existing variant
   2. an existing variant plus a section style
   3. a new variant (proposed to you)
5. `import-cf-fragments.js` creates the documents. The XF fragments that contain them link to them with the fragment block.

## Part 4: Formatting → authoring conventions (site-wide table)
1. Fetch the authoring conventions page fresh.
2. Measure the **leaf** computed style on live pages for each frequent combination in `typography.json`. Combinations that cover ≥95% of uses are measured; the rare tail gets grouped.
3. Write the decision table **`data/typography-map.json`**. For each combination, exactly one outcome:
   - convention markup (heading level, `<strong>`, `<em>`, `<u>`, link alone on its line)
   - template CSS (font size, other colours, following the memory-backed rule: markup carries family and gold only)
   - an inconsistency, normalised to the template default
4. **Decision checkpoint:** you review the table, with counts and example URLs.
5. Write the shared transformer `transformers/corp-typography.js`, which applies the table to the scraped DOM for every corp importer. Reuse the existing computed-leaf normaliser where it fits rather than forking it.
6. If new conventions are needed, tell you that the conventions page needs updating.

## Part 5: AEM components → blocks, variants and section styles (site-wide table)
1. For each component and pattern in `components.json`, by frequency, pick the Block Library entry in AGENTS.md order of preference:
   1. an existing variant
   2. a variant plus a section style
   3. a new variant
   4. a new block (explained first)
2. Map the layout hints:
   - column-control type and `cq:responsive` → variant
   - `backgroundColor` and padding → section style
   - hidden section titles → anchors
3. Write the decision table **`data/component-map.json`**:
   - AEM component and pattern
   - block, variant and section style
   - the DOM selector on the live page
   - whether a parser already handles it
   - the measured source URL
4. **Decision checkpoint:** you approve the table. Any new variant or section style is listed separately.
5. **Skip rules** go into the shared cleanup transformer, after checking how each one renders:
   - empty containers
   - `ghost` components
   - `hideComponent: "true"` components
6. Update `page-templates.json` block mappings to match. Tell you which Block Library entries need adding or updating.

## Part 6: Site classification and import order
1. From `site.json`, report per template:
   - the number of pages
   - the signature groups
   - outliers, to classify as **intentional design** or **inconsistency** (AGENTS.md style process)
   - fragments needed
   - pages already migrated
2. **Decision checkpoint:** you confirm the template list, the outlier classification and the import order:
   1. fragments first (XF, then content fragments)
   2. then templates, by size
3. The list of already-migrated corp pages to re-import under the new rules (news-detail and others) follows the "re-import must not regress author edits" rule: diff each page, fix importers rather than single pages, and patch Document Authoring only surgically and only when you ask.

## Part 7: Importers use it all

### 7a. Generic XF importer `import-xf-fragments.js`
- Imports XF variations from publish and saves each at its EDS path.
- Applies cleanup, Dynamic Media images, typography and the component map.
- Nested XFs and content fragments become fragment blocks.
- URL lists are generated per template.
- Types with special parsing (resources, connect, contact, banner) keep their overrides, sharing code with `import-news-shared-fragments.js`.

### 7b. Shared transformer `transformers/xf-references.js` (runs before the parsers)
- Matches `.experienceFragment` and `.carouselslide` elements in document order against `PAGES`.
- Checks each match by the `text` summary or the Dynamic Media asset name.
- On a match: replaces the element with a fragment block.
- On a mismatch: leaves the element as it is and reports it.

### 7c. Hero and carousel slides as fragments
- The `hero-image-slide` and `sa-resources/hero` parsers emit fragment links: desktop, plus mobile when it exists.
- `blocks/hero-corp/hero-corp.js` loads them with `loadFragment()` and lifts the picture out. Direct images keep working.
- ⚠️ **LCP risk:** measure PageSpeed on the feature preview. If the score drops below 100, stop and propose a fix (e.g. loading the fragment early).
- The Hero Corp Block Library entry needs updating.

### 7d. Page facts in every corp importer
- **Metadata:** filled in from the page facts. Field names are proposed to you if the template doesn't define them yet.
- **Anchors:** applied as section IDs, exactly as authored.
- **Disclaimer and Marketo settings:** added from the page facts.
- **Card lists:** checked against the resolved targets.
- **Missing alt text:** listed in the import report.

## Rollout and PRs
| PR | Content | Visible change |
|---|---|---|
| **A** (`455-import-xf-mapping`) | Exports, AGENTS.md, helper (Part 1), map replacement (Part 2) | None (tooling) |
| **B** | Decision tables plus `corp-typography` and the cleanup skip rules (Parts 4, 5, 6) | Formatting on re-imported pages |
| **C** | XF and content-fragment importers, `xf-references` transformer, location-box block or variant (Parts 3, 7a, 7b) | Fragments |
| **D** | Hero Corp slides as fragments (7c) | Hero block |
| **E** | Page facts in the importers (7d) and re-import of already-migrated corp pages | Content |

Each PR includes a demo path: `/us/en/smart-care`, `/us/en/about/news/2026/a-message-to-our-customers-03-2026`, and a contact-directory page for C.

## Decision checkpoints (your approval needed before implementation continues)
1. The content-fragment field-set handling and the location-box block or variant (Part 3)
2. The typography decision table (Part 4)
3. The component decision table, plus any new variants or section styles (Part 5)
4. The template list, outlier classification and import order (Part 6)
5. Any new metadata field names (7d)
6. The LCP fix, if the hero change costs score (7c)

## What I need from you
- The content-fragment export (Part 3, step 1), once the helper has produced `cf-to-export.txt`.

## Verification
- **Counts:** the tests pass, and the helper reports 837 fragments, 1,180 variations, 2,109 page references, 15 nested references and 26 redirects.
- **No regression:** re-import the 7 existing shared fragments and the news demo page, then diff them. Paths and content must match today's, apart from approved table changes.
- **Smart Care:**
  - The hero (desktop and mobile), sidebar and footer XFs become fragment links.
  - The hidden anchors (`solutions`, `products`, `connect`) work from the jump bar and the hero CTA.
  - The disclaimer and Marketo form 2761 are present.
  - Formatting matches the typography table.
  - The page renders correctly at 600 / 900 / 1200 px.
- **Contact directory:** the location boxes come from the content-fragment documents.
- **Links and lint:** the AGENTS.md link check is clean. `npm run lint` passes with no new `eslint-disable`.
- **Performance:** PageSpeed on the feature previews for PRs B–D.
- **Fidelity:** offer the style validator on the template re-imports.

## Checklist
**Part 1: helper**
- [ ] Create `tools/importer/migration-index/` and the `build:migration-index` npm script
- [ ] Generate `data/xf-index.js` (FRAGMENTS, ordered PAGES, slide pairs)
- [ ] Generate `data/page-facts/<template>.js` (metadata, anchors, disclaimer, Marketo, tabs, resolved card lists, missing alt); check bundle size and split if needed
- [ ] Generate the catalogs: `xf-report.json`, `typography.json`, `components.json`, `site.json`, `cf-to-export.txt`
- [ ] Check the counts against the expected numbers

**Part 2: replace the map**
- [ ] Point `xfFragmentPath()` at the index; add `pageXfRefs()` and `cfToFragmentPath()`
- [ ] Delete `xf-fragment-map.js` / `.json`; update `xf-fragment-path.test.mjs`
- [ ] Keep only the per-fragment styling in `import-news-shared-fragments.js`
- [ ] Update the `page-templates.json` description and AGENTS.md "Corp source exports"
- [ ] Re-import the 7 shared fragments and the news demo page; diff (no regression)
- [ ] Lint, commit and push PR A

**Part 3: content fragments**
- [ ] Send you `cf-to-export.txt` and the export pointers; wait for `.migration/cf-content/`
- [ ] Add the fields to `data/cf-index.js`; report the field sets per content fragment
- [ ] ⏸ Checkpoint: field-set handling and the location-box block or variant
- [ ] Build `import-cf-fragments.js`

**Part 4: typography**
- [ ] Fetch the authoring conventions page; measure the leaf styles for the frequent combinations
- [ ] Draft `data/typography-map.json`
- [ ] ⏸ Checkpoint: typography table
- [ ] Build `transformers/corp-typography.js` (reusing the existing normaliser where it fits)

**Part 5: components**
- [ ] Map `components.json` to Block Library entries; draft `data/component-map.json`
- [ ] ⏸ Checkpoint: component table, new variants and section styles
- [ ] Add the skip rules (empty, ghost, hidden) to the cleanup transformer; update `page-templates.json`

**Part 6: classification**
- [ ] Report templates, signature groups, outliers, needed fragments and already-migrated pages
- [ ] ⏸ Checkpoint: template list, outlier classification, import order
- [ ] Lint, commit and push PR B; tell you which Block Library and conventions entries need updating

**Part 7: importers**
- [ ] Build `import-xf-fragments.js` (generic, per-template URL lists, nested XFs and content fragments)
- [ ] Build `transformers/xf-references.js` (order matching, text/asset check, mismatch report)
- [ ] Lint, commit and push PR C with the demo paths
- [ ] Switch the hero slide parsers to fragment links; update `hero-corp.js`
- [ ] Measure PageSpeed; ⏸ checkpoint if below 100
- [ ] Lint, commit and push PR D; tell you the Hero Corp library entry needs updating
- [ ] Apply page facts in the corp importers (metadata, anchors, disclaimer, Marketo, cards, alt report)
- [ ] Re-import the already-migrated corp pages; diff each one (no regression of author edits)
- [ ] Verify Smart Care, the news demo and a contact-directory page at 600/900/1200 px; offer the style validator
- [ ] Lint, commit and push PR E with the demo paths
