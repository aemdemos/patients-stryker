# Keyboard test results: folders and file format

Results of `npm run test:a11y:keyboard`, for reading them later and for building
reports or other tools on top of them. Format version: **`schemaVersion: 1`**
(in every file). A change that removes or renames a field raises the version;
new fields may be added without a new version.

## Where results are kept

```text
a11y-results/keyboard/                       (git-ignored, local to the machine that ran the tests)
  index.json                                 every run, newest first
  latest.json                                the newest run
  2026-11-24_140512_neuroelite/              one folder per run, never overwritten
    report.html                              open in a browser; self-contained, share it on its own
    run.json                                 the run: when, options, git, pairs, totals, results
    pages/<name>__<viewport>__<site>.json    one page (site = source or eds)
    compare/<name>__<viewport>.json          source vs EDS for one pair at one viewport
```

- **Folder name:** `<YYYY-MM-DD_HHMMSS>_<label>`, in local time, so folders sort in run
  order. The label is `--label`, otherwise the CSV file name, otherwise the pair
  name (one pair), otherwise `pairs` (configured pairs). If the name is already
  taken, `-2`, `-3`, … is added.
- **Finding a run:** search `index.json` by label, date or URL. Every entry lists
  its pairs with their source and EDS URLs.
- **Cleaning up:** delete run folders you no longer need. Their entries leave
  `index.json` at the next run.
- **Rebuilding a report:** `npm run test:a11y:keyboard:report -- [run-folder]`
  (default: the latest run).

## `index.json`

```json
{
  "schemaVersion": 1,
  "runs": [
    {
      "runId": "2026-11-24_140512_neuroelite",
      "folder": "2026-11-24_140512_neuroelite",
      "label": "neuroelite",
      "startedAt": "2026-11-24T14:05:12+01:00",
      "finishedAt": "2026-11-24T14:06:01+01:00",
      "status": "failed",
      "pairs": [{ "name": "neuroelite", "source": "https://…", "eds": "https://…" }],
      "totals": { "pairs": 1, "pages": 4, "errors": 0, "edsFailed": 1, "regressions": 0, "improvements": 1, "bothFail": 2 },
      "report": "2026-11-24_140512_neuroelite/report.html"
    }
  ]
}
```

`latest.json`: `{ "schemaVersion": 1, "runId": "…", "folder": "…", "report": "…/report.html" }`.

## `run.json`

| Field | Meaning |
|---|---|
| `runId`, `label` | Folder name and its label part |
| `startedAt`, `finishedAt` | ISO 8601 with time zone offset |
| `durationMs` | Whole run |
| `status` | `running` (in progress), `passed`, `failed` (an EDS page failed or a test errored), `interrupted` (stopped before the end) |
| `command` | The command line used |
| `git` | `{ branch, commit }` of the working copy (code under test when EDS pages are local) |
| `options` | `{ viewports, workers, sourceConcurrency, baseUrl, csv }` |
| `pairs` | `[{ name, source, eds }]`, full URLs; `source` is `null` for EDS-only rows |
| `totals` | `pairs`, `pages` (page tests run), `errors` (pages that could not be tested), `edsFailed` (pair × viewport results where EDS fails), `regressions`, `improvements`, `bothFail` |
| `results` | One row per pair and viewport: `{ pair, viewport, eds, source, edsFailures, regressions, improvements, bothFail, files }`. `eds`: `pass`, `fail`, `error`, `not tested`. `source`: `tested`, `error`, `not tested`. `files`: paths of the page and comparison files, relative to the run folder |
| `report` | `report.html`, or `null` if it could not be built |

## `pages/<name>__<viewport>__<site>.json`

One page at one viewport. Fields:

| Field | Meaning |
|---|---|
| `pair`, `site`, `viewport`, `width`, `url`, `finalUrl` | What was tested (`finalUrl` after redirects) |
| `startedAt`, `durationMs` | Timing of this page |
| `error` | Present only when the page could not be tested |
| `cookieBanner` | `{ present, selector, dismissName, reachedAfterTabs, dismissedByKeyboard }` |
| `tabOrder` | `count`, `completed`, `limitReached`, `presses`, `positiveTabindex[]`, `hiddenFocusable[]`, `visualJumps[]`, `stops[]`. Each stop: `{ i, role, name, tag, href, container, rect, hidden? }` |
| `reverse` | Shift+Tab walk: `{ count, matches, mismatch, trap }` |
| `traps` | `[{ type, direction, location, stops, inDialog, escapedBackward, releasedByEscape, failure }]` |
| `focusVisible` | `checked`, `missing[]` (stops without visible focus, each with a `reason`), `notChecked[]` |
| `skipLink` | `{ status: works | broken | missing, how?, reason?, link? }` |
| `components` | Lists `menus`, `disclosures`, `accordions`, `hiddenSubmenus`, `tablists`, `carousels`, `modalOpeners`, `openDialogs`, `fields`. Each item: `{ kind, name, where, keys }`, where `keys` maps a key or check (e.g. `Enter`, `Escape`, `Reachable`) to `{ result: pass | fail | n/a, note?, severity: failure | warning }` |
| `guard` | `{ navigations[], blockedActions }`: off-page navigations that were reloaded, and clicks or submits the read-only guard cancelled |

Failures and warnings are not stored in the page file: they are derived from these
fields by `pageVerdict()` in `tests/a11y/lib/compare.mjs`, so the rules stay in one
place. `results` in `run.json` holds the counts.

## `compare/<name>__<viewport>.json`

| Field | Meaning |
|---|---|
| `pair`, `viewport`, `sourceUrl`, `edsUrl` | The pair |
| `differences` | Checks found on both sites with a different or failing result: `{ label: Regression | Improvement | Both fail, check, source: { status, detail? }, eds: { status, detail? } }` |
| `onlySource`, `onlyEds` | Checks found on one site only: `{ check, status, detail? }` |
| `tabStops` | `{ source, eds, onlySource[], onlyEds[] }`: stop counts, and stops (role + name) found on one site only |
| `escalations` | Failures only the comparison can find, e.g. a skip link on the source but not on EDS |
