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

## Local development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `patients-stryker` directory in your favorite IDE and start coding :)
