# Step 7 brief: corp page importers (pilot first)

Repo: /backups/aemdemos/patients-stryker/repo. Work ALONE on the shared preview (http://localhost:3000, serves
this working tree; local pages under /content/<path>). Branch: `import-product-detail` (based on
`corp-integration`). Commit as `git -c user.name=iustinp -c user.email=iustinp@adobe.com commit …`, message
ending with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`;
push `git push -u origin import-product-detail`. Commit and push after every completed page so a restart
loses nothing (a service restart can clear /tmp: keep pilot output you need under /tmp only as a cache and
re-create it when missing).

## Read first (binding)
- AGENTS.md: Hard Rules (no new eslint-disable; no innerHTML in new code), "Corp source exports" (incl.
  "Corp section builder", migration index, coverage check, source URLs from export file names), "Link
  rewriting", "Image alt text", "Authoring conventions" (fetch fresh), "Style variation within a template".
- tools/importer/decisions/*.json (typography-map, component-map, content-fragments, site-classification).
- The engine: tools/importer/corp-page.js, corp-section-builder.js, corp-component-handlers.js,
  transformers/corp-sections.js (imports nothing; the import script passes the builder as payload.corp),
  import-product-detail.js; shared: corp-richtext.js, corp-components.js, xf-fragment-path.js; parsers
  hero-image-slide, cards-corp-teaser, video; data/page-facts/product-detail.js.
- Block contracts: each target block's JS header/CSS and its draft sample under content/drafts/blocks/<branch>/.

## Pilot pages (product-detail)
1. /us/en/acute-care/products/isolibrium (done in 608f1b1: re-check for regressions)
2. /us/en/ent/products/clarifix-cryotherapy-device
3. /us/en/emergency-care/products/lifepak-15
4. /us/en/endoscopy/products/1788-platform (unpublished mobile hero variation: report it, never invent)
5. /us/en/sports-medicine/products/inspace
6. /us/en/sage/products/sage-barrier-cream-cloths
Source URLs from the export file names (pageExportFile in tools/importer/migration-index/lib.js).

## Per page
- Import: `WORKSPACE_PATH=/tmp/pilotPD node /home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js --import-script tools/importer/import-product-detail.bundle.js --urls <file> --force`
  (bundle first with aem-import-bundle.sh in the same scripts folder); also its XFs (pageXfRefs: fragment +
  slide refs + nested) with import-xf-fragments.bundle.js into the same WORKSPACE_PATH.
- Checks: (a) check-coverage.js on /tmp/pilotPD/content: 0 MISSING; (b) AGENTS.md link check; (c) preview:
  page copy at content/drafts/reimport/<path>.plain.html with fragment links rewritten to
  /content/us/en/fragments/…, fragment documents as exact copies under content/us/en/fragments/…; compare
  with the live source at 1440 and 375 section by section (order, presence, heading levels, block types,
  images, buttons) and the page height ratio; (d) no JS errors from the page itself.
- Content first: add handlers for unhandled components, fix importer bugs; no styling work yet.

## Styling (after all six): AGENTS.md "Style variation within a template" step 2
One table of every visible difference across the six pages: difference, pages affected, measured source
values (URL), cause, proposed layer (template CSS templates/product-detail/product-detail.css / block option /
authoring convention), consistent (→ template default) vs inconsistent (→ normalise). Do not implement it
until the user confirms.

## Browser rules
One page at a time; page.setDefaultTimeout(15000); ALWAYS `filename: "<name>.json"` in browser_run_code on
www.stryker.com pages (saved in /tmp/playwright/); disable the cache; browser_close at the end.
