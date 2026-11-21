# Import impact check and rule finder

The corp templates of the readable-settings approach share one rule library, `tools/importer/corp/`. A template is a profile on top of it (`tools/importer/import-<template>.js`: name, description, page facts). A change to the library can therefore change the documents of every template. These tools show which documents a library change touches and how, before anyone re-imports or uploads (plan: `.migration/plan-2026-11-07.md`).

## What it answers, and what it doesn't

The impact check answers one question: **which imported documents change, and how, when the import rules change?** It compares documents (the `.plain.html` the import writes), not rendered pages.

| Question | Tool |
|---|---|
| Which documents does an import-rule change touch, and what changes in them? | **This check** (`impact.sh`, `compare.py`) |
| Does the import still carry every text authored in AEM? | `tools/importer/migration-index/check-coverage.js` (run after every import) |
| Does each styled source element (image border, alignment, indent, blank lines, coloured box, new-tab link, list, heading, image) keep its style in the output? Which source classes does no rule name? | `tools/importer/migration-index/check-style-coverage.mjs --run <out> --cache <page cache> [--unknown]` (run after every import, about 2½ minutes for 672 pages) |
| Which rendered pages does a CSS change reach, and do they look different? | css-blast-radius (`.cbr/`, local only: `impact --pages`, `assess --pages`) |
| How close is a rendered page to the live page? | The QA tool (`.qa-tool/`, local only) |

A CSS-only change never shows up here: the documents stay the same. A rule change that only moves text between sections shows up here, but whether it looks right is a question for the live comparison or the QA tool.

## Files

| File | What it is |
|---|---|
| `templates.json` | The templates in the check: their import script and AEM template |
| `samples/<template>.txt` | The template's sample pages (AEM paths): hard pages first, then pages that together use every component of the template (`pick-sample.py`) |
| `baselines/<template>/` | The accepted import of the sample: pages, XFs and modals under `/rs` (`corp/root.js`) |
| `impact.sh` | Imports every sample (offline, from the page cache) and compares it with the baselines |
| `import-sample.sh` | One template's sample import: fast-import.mjs with the library's fragment, modal and page imports |
| `compare.py` | The comparison: same / changed / new / missing documents, the changes as tag-level hunks, broken fragment links |
| `rule-finder.py` | What the library and the decision tables already know about a component, a class or a word |
| `pick-sample.py` | Picks a sample: the given pages, then a greedy cover of the template's components |

Current samples: product-detail 23 pages, news-detail-engine 13 pages; with their fragments and modals the baselines hold 110 documents (73 + 37).

## How a run works

`bash tools/importer/impact/impact.sh [template …] [--accept]` runs, per template in `templates.json` (or the ones named):

1. **Sample import** (`import-sample.sh`):
   - `batch-urls.mjs` turns the sample's page list into the import lists: the pages, and the XFs those pages use (from the migration index);
   - the three import bundles are rebuilt from the current library (`aem-import-bundle.sh`): `import-corp-fragments`, `import-corp-modal-fragments` and the template's own importer;
   - `fast-import.mjs` imports the XFs, then the modals (`data/catalog/modal-urls.txt`), then the pages. It runs offline, from the page cache (rendered snapshots, scripts off). A page or XF not in the cache yet is recorded from the live site once.
2. **Comparison** (`compare.py <baseline> <output>`): every document of the output against the baseline of the same path.
3. **Report**: one block per template in `<out>/report.txt`, also printed. The output folder is `$IMPACT_OUT` (default `/tmp/import-impact/<time>/`): `<template>/content/…` (the imported documents) and `<template>/import.log`.
4. With `--accept`, the new imports replace the baselines (after review, below).

**Timing:** about 3 minutes for both templates. Most of it is page imports at 3 at a time; bundling takes a few seconds. Long runs should go in the background (`setsid nohup … &`) and be announced.

## Reading the report

```
== product-detail
  failed: [45/46] ❌ https://www.stryker.com/us/en/endoscopy/products/1788-platform.html?xf=…/hero-image/mobile: page.evaluate: Error: hosted XF … is not rendered on …
documents 73: same 47, changed 26, new 0, missing 0; broken fragment links 0
  changed /rs/us/en/nse/products/malis-disposable-non-stick-bipolar-forceps (2 differences)
    - <p>
    + <div class="related-categories"><div><div>
```

- **`failed`:** an import that threw. Compare with the previous run's log before blaming the change: some fail every time. For example, the two hosted XFs above aren't rendered in their host page's snapshot.
- **`same / changed / new / missing`:** per document path. `new` and `missing` mean the change created or lost a document (a fragment no page links to any more, or a new modal).
- **`changed … (n differences)`:** the first hunks of each changed document, as tag-level `-` / `+` lines. The HTML is split at every tag, so a hunk is the smallest run of tags that differs.
- **`broken fragment links`:** a link to `/…/fragments/…` with no document of that path in the output. It should always be 0, since every fragment a sample page uses is imported with it.
- **Ignored:** heading ids (EDS derives them when it renders, and the runner numbers repeated headings) and whitespace between tags.

## Using it

### Changing the library

1. **Look first:** `python3 -I tools/importer/impact/rule-finder.py <component or class>`. It shows:
   - the decision (component-map);
   - the existing handler and the library lines that mention it;
   - the pages per template that use it;
   - the samples that cover it.

   If no sample covers it, add a page that uses it to the template's sample (and accept the baseline, step 4) before changing the rule.
2. **Change** the handler or rule in `tools/importer/corp/`. Name the source page that shows the case in the comment next to the change; that is the learnings log.
3. **Check:** `bash tools/importer/impact/impact.sh`.
4. **Review and accept:**
   - Check every changed document against the live page (computed styles, positions; `.cbr/local-scripts/probe.mjs`, the measuring scripts in `.cbr/local-scripts/`, or the QA tool).
   - The owners of the changed templates review their changes.
   - Then `bash tools/importer/impact/impact.sh --accept` makes the new imports the baselines.
   - The PR includes the report and the baseline changes.

A change only one template needs goes into that template's profile as a named override with its reason. When another template needs it too, it moves into the library.

### Comparing with the previous run instead of the baseline

When the baselines are older than several rounds of changes, every run reports those older changes too, and the new round is hard to see. `compare.py` takes any two folders, so compare the new run with the previous one:

```
IMPACT_OUT=/tmp/import-impact/round-2 bash tools/importer/impact/impact.sh
python3 -I tools/importer/impact/compare.py /tmp/import-impact/round-1/product-detail/content /tmp/import-impact/round-2/product-detail/content
```

This is how the 2026-11-08 rounds were reviewed: each round against the one before (`spacing-fix`, `spacers`, `batch1` … `batch4`, `cols`, `colbreak`, `lhbox`, `centre`, `align`).

### Sorting the changes by kind

When a round is meant to add one kind of change (a new section style, a new setting, a tag), sort the changed documents by whether that is all that changed: strip the expected change from the new document and compare again. Documents that still differ are the ones to read. For example, the spacer round:

```python
b2 = re.sub(r'<div><div class="section-metadata"><div><div>style</div><div>spacer[^<]*</div></div></div></div>\n?', '', new)
'only spacers' if b2 == old else 'other'
```

This found the real regressions of 2026-11-08:
- blank lines changing which Columns option a block got (`large-headline`, `boxed-last`);
- accordion panels splitting;
- a line break moved in front of a button.

All were fixed before anything was uploaded. A second useful sort is by block options that disappear: count the `<div class="…">` class lists per document, old against new.

### Checking a single page or a few

For a quick look at one page before running the whole check:

```
node .migration/plans/pilot-tools/fast-import.mjs --import-script tools/importer/import-product-detail.bundle.js --urls <list> --out /tmp/run-outputs/<name> --cache /tmp/run-outputs/import-out/page-cache
python3 -I .cbr/local-scripts/page-preview.py <repo> /tmp/run-outputs/<name>/content /rs/us/en/<path> <draft name>
```

The second command copies the page and its fragments into `content/drafts/impact/<draft name>/`, so the local preview shows it next to the workspace copy. Rebuild the bundle (`aem-import-bundle.sh --importjs …`) after every library edit: a stale bundle imports with the old rules.

### A new template (draft, until the team agrees)

1. **Classify its pages** (`data/catalog/site.json`).
2. **See which of its components the library already handles:** run `rule-finder.py` per component. On the remaining templates, 95.5% of component uses are components the library has already run on.
3. **Pick a sample:** `python3 -I tools/importer/impact/pick-sample.py <repo> <aem template> 25 tools/importer/impact/samples/<template>.txt [hard pages …]` (at most 25 pages; it stops once every component is covered and the sample has 10).
4. **Write the profile** `import-<template>.js` (as `import-product-detail.js`) and add the template to `templates.json`.
5. **Import the sample** (`impact.sh <template>`), plus handlers for its new components, in the library.
6. **Check the import:**
   - coverage: `node tools/importer/migration-index/check-coverage.js <out>/content/rs` (run it on the `rs` folder: it maps `/us/en/…` paths to the exports);
   - QA at 375, 860, 1100 and 1440 px, against the live pages;
   - fix in the library (with the impact check) or in the profile.
7. **Accept its baseline,** then open the PR.

## Limits

- **Samples cover components, not every pattern.** A sample is chosen so that every component of the template appears at least once, not every way components are combined. On 2026-11-08 the four pages that needed a column break (bone-cements, vcf-accessories, omnicurve, modular-dual-mobility) weren't in the sample, so the check reported no change for that rule. For a rule about a pattern, import the pages that have it as well (`SAMPLE=<list> import-sample.sh …`, or fast-import on a list), and add one of them to the sample.
- **Documents, not rendering.** An identical document can render differently after a CSS or block JS change, and a changed document can look the same. Review the changes on the rendered page, measured against live, at the widths that matter (375, 860, 1100, 1440).
- **Measure locally with a doctype.** The local dev server serves content pages without one, so the browser is in quirks mode. Lines that mix sizes come out shorter there than on aem.page and live. The measuring scripts in `.cbr/local-scripts/` add the doctype.
- **The page cache is a snapshot.** Imports read the rendered page as it was recorded. If live has changed since, re-record (`fast-import.mjs --refresh`, or `REFRESH=1`) and expect the content changes in the report.
- **Hosted XFs** (`?xf=` URLs: an XF without a published copy, imported from a page that renders it) fail when their host page's snapshot doesn't render them. That happens every run (8 in the full product-detail import). No page links to those documents.
- **Baselines are only as current as the last `--accept`.** The current baselines are from 2026-11-07. Every change since then (spacers, blank lines, Resources grid, contained heroes, Columns setting, chart heights, `boxed` Large Headlines, `center`, leading line breaks, alignment tags) shows up as changed until it is reviewed and accepted.
- **Outputs are on the local disk** (`/tmp/import-impact/…`, `/tmp/run-outputs/…`) and are lost on a restart. Keep what the PR needs (the report) in the PR or under `.migration/`.

## After the check: the rest of the pipeline

1. Full re-import of the template (`LIB=1 bash .cbr/local-scripts/import-baseline.sh <template> <page list> <out> 6`, about 9 minutes for 672 pages).
2. Check it:
   - failures in `import.log`;
   - broken fragment links;
   - source-style `.html` / `/index` links;
   - block options lost against the previous import;
   - the coverage check;
   - the style coverage check (`check-style-coverage.mjs --run <out> --cache <page cache>`): compare its table with the previous run's; a rule whose `wrong` count grows is a regression.
3. Compare with the workspace copy and copy into `content/` (local only).
4. Upload the documents that differ from DA and preview them on the branch, when explicitly asked. `.cbr/local-scripts/da-verify.py` lists the differences and `da-rs-run.sh` uploads, checks and previews.
5. QA run on the branch preview.

## Output form

Every document is written in the readable-settings form (`corp/settings-writer.js`, the library's last step; `style-settings: on`), under the `/rs` root (`corp/root.js`), with fragment and modal links under it too. Links to pages keep their real paths.
