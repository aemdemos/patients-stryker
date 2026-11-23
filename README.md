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

# Same paths on a preview host
A11Y_BASE_URL=https://main--patients-stryker--aemdemos.aem.page npm run test:a11y

# One page (a corp preview URL works here too)
npm run test:a11y -- https://main--patients-stryker--aemdemos.aem.page/us/en/ivs/

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

```sh
# Configured pairs (tests/a11y/keyboard.config.js); EDS paths use the local AEM server
npm run test:a11y:keyboard

# Configured pairs, EDS paths on a preview host
A11Y_BASE_URL=https://main--patients-stryker--aemdemos.aem.page npm run test:a11y:keyboard

# One pair: source URL first, then the EDS URL
npm run test:a11y:keyboard -- https://patients.stryker.com/us/en/ivs/index.html http://localhost:3000/us/en/ivs/

# One EDS page only, without comparison
npm run test:a11y:keyboard -- http://localhost:3000/us/en/ivs/

# Only one viewport, more workers, one source page at a time
A11Y_VIEWPORTS=desktop A11Y_WORKERS=4 A11Y_SOURCE_CONCURRENCY=1 npm run test:a11y:keyboard
```

Each page is tested once per viewport (desktop 1280px, mobile 390px). Checks:

| Check | How |
|---|---|
| Tab order | Tab until focus returns to the start, then walk back with Shift+Tab. Reports the stops, positive `tabindex`, focusable elements that are hidden, off-screen or inside `aria-hidden`, and jumps back up the page. |
| Visible focus | Each stop is captured unfocused, then focused; identical pixels mean no visible focus. Elements fully covered when focused (e.g. by a sticky header) also count. |
| Keyboard traps | Focus that does not move, or loops, within part of the page. An open modal may hold focus only if Escape releases it. |
| Skip link | One of the first three stops links to a target on the page, and Enter moves focus there. |
| Menus, disclosures, accordions | Elements with `aria-expanded` and `details`/`summary`: Enter and Space toggle, Escape closes and returns focus, arrow keys for `role=menu`, Tab moves into an opened panel. Navigation submenus without `aria-expanded` must open on focus or with ArrowDown. |
| Tabs | `role=tablist` (including `aria-owns`): arrow keys, Home/End, Enter/Space select, Tab moves into the panel. |
| Carousels | `aria-roledescription=carousel` or common slider class names: previous/next/slide picker with Enter and Space; a pause control if it autoplays. |
| Modals | Openers (`aria-haspopup=dialog`, `data-(bs-)toggle=modal`, controls pointing at a dialog): focus moves in, stays inside, Escape closes, focus returns. |
| Forms | Fields are reachable and named; typing works; Space ticks checkboxes; arrow keys work on radios and selects. |
| Cookie banner | Reached by Tab and dismissed with Enter; then dismissed for the rest of the run. |

**Results.** The terminal shows a line per page, the EDS failures and the
differences per pair. JSON files are written to `test-results/keyboard/`: one per
page (`<pair>__<viewport>__<site>.json`) and one comparison per pair
(`<pair>__<viewport>.compare.json`). Differences are labelled **Regression**
(passes on source, fails on EDS), **Improvement** (fails on source, passes on EDS)
and **Both fail**; checks found on one site only are listed separately.

**Pass/fail.** Source results are information only. An EDS page fails on a keyboard
trap, a stop without visible focus, a component that does not respond to its keys,
or a missing skip link when the source page has one. Everything else is a warning.

**Parallel runs.** Tests are split by page, site and viewport, each in its own
browser context; the comparison runs once all tests have finished. `A11Y_WORKERS`
(default 2) sets the worker count. Each worker starts its own browser, so fit the
count to the machine or CI runner and use fewer workers against `aem up` than
against a hosted preview. `A11Y_SOURCE_CONCURRENCY` (default 2) caps how many pages
are open at once on each source host, so a live site is not loaded heavily. Use
`A11Y_WORKERS=1` when debugging.

**Read-only.** Off-page link clicks and form submission are cancelled in the page,
Enter is never pressed in form fields, and a page that navigates away anyway is
reloaded (the check fails). Before the checks, each page is scrolled through once
so lazy-loaded content (forms, embeds) is present.

**Limits.** Any visible change near the element counts as focus (e.g. a validation
message shown on focus), so a pass is not proof of a good focus indicator.
Controls that fade in and out on a timer (e.g. video player controls) can give
different counts between runs. Focus-indicator contrast (WCAG 2.4.11 / 2.4.13), whether the tab order makes sense
and screen reader output still need a manual review.

## Local development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `patients-stryker` directory in your favorite IDE and start coding :)
