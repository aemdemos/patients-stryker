# Stryker Patients
Website for Stryker's patient-facing content, built with Adobe Edge Delivery Services.

## Environments
- Preview: https://main--patients-stryker--aemdemos.aem.page/
- Live: https://main--patients-stryker--aemdemos.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Accessibility testing

Playwright and axe-core scan rendered pages using WCAG 2.0, 2.1 and 2.2 Level A/AA
rules. This complements Lighthouse; automated scans do not establish full WCAG
conformance or replace manual keyboard and assistive-technology testing.

The a11y workflow uses Node.js 20. Install dependencies with:

```sh
npm install
```

As in the reference implementation, `postinstall` downloads Chromium.

```sh
# Configured patients landing pages; requires the local AEM server
npm run test:a11y

# Same paths on a preview host (or set A11Y_BASE_URL)
npm run test:a11y -- --base-url https://main--patients-stryker--aemdemos.aem.page

# One page (a corp preview URL works here too)
npm run test:a11y -- https://main--patients-stryker--aemdemos.aem.page/us/en/ivs/

# Usage, options and examples ("--" is required, or npm shows its own help)
npm run test:a11y -- --help
```

Set WCAG tags, blocking impacts and page paths in
[`tests/a11y/a11y.config.js`](tests/a11y/a11y.config.js). The initial paths are the
IVS and ENT landing pages. Add authored block demos and representative template
paths as coverage grows; use `A11Y_BASE_URL` only with paths present on that host.

Critical/serious violations fail the command; moderate/minor violations do not.
The reference custom reporter displays page status, details for failed scans and
a short summary, without assertion diffs or source snippets. It replays captured
output only for failed scans, so warning-only passing scans show a pass summary.
The runner waits for `networkidle`, with a 30-second test timeout, as in the
reference implementation. Scans cover the initial rendered state at Playwright's
default desktop viewport, not every interactive state or responsive layout.

The **A11y / a11y** PR workflow scans the first `- After: https://...` URL in the
description. Supply a real plain URL, not a placeholder or Markdown link.
For a corp-only change, remove the unused patients Test URLs section so the
first After URL points to the corp page. Missing After URLs fail the check.
Use feature-preview `.aem.page` URLs to test the branch's code. Description edits
alone do not trigger this reference workflow. To repeat a scan, open its Actions
run and choose **Re-run jobs**.

This implements local and PR testing, following
[ise-boilerplate PR #62](https://github.com/aemdemos/ise-boilerplate/pull/62).
Scheduled scans, sitemap crawling and additional artifact uploads are not
included.

### Keyboard tests (source page vs EDS page)

Keyboard tests press real keys in Chromium on an original (source) page and its
matching EDS page, then compare the two. They run separately from the axe scan and
are not part of the PR workflow.

#### Quick start

```sh
# Compare one page: source URL first, then the EDS URL
npm run test:a11y:keyboard -- https://patients.stryker.com/us/en/ivs/index.html http://localhost:3000/us/en/ivs/

# Compare a list of pages from a CSV file (columns: source,eds,name)
npm run test:a11y:keyboard -- --csv my-pages.csv

# All options, defaults and examples
npm run test:a11y:keyboard -- --help
```

Every run is kept in its own folder, with an HTML report:
`a11y-results/keyboard/<date>_<time>_<label>/report.html`. The last lines of the
terminal output show its path.

Put `--` before any argument or option. Without it, npm reads them itself:
`npm run test:a11y:keyboard --help` shows npm's own help, not the test's.

#### Usage and options

```text
npm run test:a11y:keyboard -- [options] <source-url> <eds-url>   compare one pair
npm run test:a11y:keyboard -- [options] <eds-url>                one EDS page, no comparison
npm run test:a11y:keyboard -- [options] --csv <file>             every pair in a CSV file
npm run test:a11y:keyboard -- [options]                          pairs in tests/a11y/keyboard.config.mjs
```

| Option | Environment variable | Default | What it does |
|---|---|---|---|
| `--csv <file>` | `A11Y_KBD_CSV` | | Test the pairs in a CSV file (see below) |
| `--name <name>` | `A11Y_KBD_NAME` | last part of the EDS path (e.g. `ivs`) | Short name for one pair in the output and result file names |
| `--label <text>` | `A11Y_KBD_LABEL` | `--name`, CSV file name, pair name or `pairs` | Label of the run, used in its folder name (e.g. `before-fix`, `after-fix`) |
| `--viewport <names>` | `A11Y_VIEWPORTS` | all (`desktop` 1280px, `mobile` 390px) | Viewports to test, comma-separated |
| `--workers <n>` | `A11Y_WORKERS` | `2` | Pages tested in parallel. Each worker starts its own browser |
| `--source-concurrency <n>` | `A11Y_SOURCE_CONCURRENCY` | `2` | Most pages open at once on one source host |
| `--base-url <url>` | `A11Y_BASE_URL` | `http://localhost:3000` | Host for EDS paths (configured pairs, or an EDS path instead of a URL) |
| `-h`, `--help` | | | Show usage, options, examples and where results go |

The environment variables do the same as the options (useful in CI); an option
given on the command line wins. Defaults for workers, concurrency and viewports
come from `tests/a11y/keyboard.config.mjs`.

```sh
# Desktop only, one worker, a custom name
npm run test:a11y:keyboard -- --name neuroelite --viewport desktop --workers 1 <source-url> <eds-url>

# Configured pairs, EDS paths on a preview host instead of the local server
npm run test:a11y:keyboard -- --base-url https://main--patients-stryker--aemdemos.aem.page

# The same pages before and after a fix, with labels to tell the runs apart
npm run test:a11y:keyboard -- --label before-fix <source-url> <eds-url>
npm run test:a11y:keyboard -- --label after-fix <source-url> <eds-url>
```

#### A list of pages: CSV input

```csv
# lines starting with # and empty lines are ignored
source,eds,name
https://patients.stryker.com/us/en/ivs/index.html,/us/en/ivs/,ivs-home
https://patients.stryker.com/us/en/ent/index.html,https://main--patients-stryker--aemdemos.aem.page/us/en/ent/,
,/us/en/ivs/get-the-facts,
```

- The header row is required. Columns: `source`, `eds`, and optionally `name`.
- `source`: the original page as a full URL. Leave it empty to test only the EDS page.
- `eds`: a full URL, or a path joined with `--base-url`.
- `name`: optional. Default: the last part of the EDS path, with `-2`, `-3` added if two rows end the same way.
- Values containing commas go in double quotes.
- Problems are listed with their line number, and nothing is tested until the file is correct.
- Example: [`tests/a11y/keyboard-pages.example.csv`](tests/a11y/keyboard-pages.example.csv).

#### Reading the results

**Every run is kept**, never overwritten, in its own folder outside git:

```text
a11y-results/keyboard/
  index.json                                 every run, newest first (label, date, URLs, totals)
  latest.json                                the newest run
  2026-11-24_140512_neuroelite/              <date>_<time>_<label>
    report.html                              open in a browser: overview and details
    run.json                                 when, options, git commit, pairs, totals, status
    pages/<name>__<viewport>__<site>.json    one per page
    compare/<name>__<viewport>.json          source vs EDS, one per pair and viewport
```

- **The label** is `--label` if given, otherwise the CSV file name, the pair name
  (one pair) or `pairs` (configured pairs), so a folder name is never only a date.
- **To find an earlier run,** search `index.json` by label, date or URL.
- **To clean up,** delete run folders you no longer need.
- **The format** of every file is described in
  [`tests/a11y/RESULTS.md`](tests/a11y/RESULTS.md), for building other reports
  or tools on top of it.

**The HTML report** (`report.html`) is one file that works offline:
- **Totals:** pairs, pages, EDS results failing, regressions, improvements, both fail.
- **Overview:** one row per pair and viewport.
- **Per pair:** expandable sections with each site's summary, the EDS failures,
  the differences, checks and tab stops found on one site only, warnings, and
  links to the JSON files.

To rebuild a report from the JSON files:
`npm run test:a11y:keyboard:report -- [run-folder]`. Without a folder, it rebuilds
the latest run.

**The terminal** shows, in order:

1. One line per page test as it finishes: `✓` / `✘`, then pair, site and viewport.
2. **Pages tested**: the source and EDS URL of each pair.
3. Per pair and viewport:
   - one summary line per site: tab stops, traps, stops without visible focus, skip link, component key checks
   - the EDS failures (`✘`)
   - the differences between the two sites
4. The report path and the run folder.

Differences are labelled **Regression** (passes on source, fails on EDS),
**Improvement** (fails on source, passes on EDS) and **Both fail**. Checks found on
one site only (e.g. a menu that exists only on EDS) are counted separately.

**Pass/fail.** Source results are information only. An EDS page fails on a keyboard
trap, a stop without visible focus, a component that does not respond to its keys,
or a missing skip link when the source page has one. Everything else is a warning.
The command exits with a non-zero code when an EDS page fails.

#### What is checked

Each page is tested once per viewport.

| Check | How |
|---|---|
| Tab order | Tab until focus returns to the start, then walk back with Shift+Tab. Reports the stops, positive `tabindex`, focusable elements that are hidden, off-screen or inside `aria-hidden`, and jumps back up the page. |
| Visible focus | Each stop is captured unfocused, then focused; identical pixels mean no visible focus. Elements fully covered when focused (e.g. by a sticky header) also count. |
| Keyboard traps | Focus that does not move, or loops, within part of the page. An open modal may hold focus only if Escape releases it. |
| Skip link | One of the first three stops links to a target on the page, and Enter moves focus there. |
| Menus, disclosures, accordions | Elements with `aria-expanded` and `details`/`summary`: Enter and Space toggle, Escape closes and returns focus, arrow keys for `role=menu`, Tab moves into an opened panel. Navigation submenus without `aria-expanded` must open on focus or with ArrowDown. Toggles in the header or nav count as menus. |
| Tabs | `role=tablist` (including `aria-owns`): arrow keys, Home/End, Enter/Space select, Tab moves into the panel. |
| Carousels | `aria-roledescription=carousel` or common slider class names: previous/next/slide picker with Enter and Space; a pause control if it autoplays. |
| Modals | Openers (`aria-haspopup=dialog`, `data-(bs-)toggle=modal`, controls pointing at a dialog): focus moves in, stays inside, Escape closes, focus returns. |
| Forms | Fields are reachable and named; typing works; Space ticks checkboxes; arrow keys work on radios and selects. |
| Cookie banner | Reached by Tab and dismissed with Enter; then dismissed for the rest of the run. |

#### Running pages in parallel

Tests are split by page, site and viewport, each in its own browser context; the
comparison runs once all tests have finished, so the order does not matter. Each
worker starts its own browser: fit `--workers` to the machine or CI runner (use `1`
on small machines, e.g. 2 CPUs / 5 GB, and when debugging), and use fewer workers
against `aem up` than against a hosted preview. `--source-concurrency` keeps the
load on a live source site low.

#### Safety on the source site

Off-page link clicks and form submission are cancelled in the page, Enter is never
pressed in form fields, and a page that navigates away anyway is reloaded (the
check fails). Before the checks, each page is scrolled through once so lazy-loaded
content (forms, embeds) is present.

#### Limits

- Any visible change near the element counts as focus (e.g. a validation message
  shown on focus), so a pass is not proof of a good focus indicator.
- Controls that fade in and out on a timer (e.g. video player controls) can give
  different counts between runs.
- Focus-indicator contrast (WCAG 2.4.11 / 2.4.13), whether the tab order makes
  sense and screen reader output still need a manual review.

#### Configuration and code

| File | Purpose |
|---|---|
| `tests/a11y/keyboard.config.mjs` | Pairs, viewports, defaults and limits (each setting is commented) |
| `tests/a11y/run-keyboard.js` | Command line: options, `--help`, CSV, creates the run folder, starts Playwright |
| `tests/a11y/keyboard.test.js` | One test per page, site and viewport |
| `tests/a11y/keyboard.reporter.js` | Terminal output; finishes the run (comparison, totals, `index.json`, report) |
| `tests/a11y/report-keyboard.js` | `npm run test:a11y:keyboard:report`: rebuilds a run's report |
| `tests/a11y/keyboard-pages.example.csv` | Example CSV input |
| `tests/a11y/RESULTS.md` | Result folders and file format |
| `tests/a11y/lib/` | The checks: `tab-walk.js`, `focus-visible.js`, `components.js`. Results: `compare.mjs` (verdicts, source vs EDS), `report.mjs` (HTML report), `run-store.mjs` (run folders, `index.json`), `pairs.mjs` (pairs and CSV). Helpers: `page-helpers.js` (in-page helpers, read-only guard), `host-slots.js` (per-host page limit) |

## Local development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `patients-stryker` directory in your favorite IDE and start coding :)
