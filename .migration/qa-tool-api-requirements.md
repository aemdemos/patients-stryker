# QA tool: requirements for an API an agent can use well

Written 2026-11-04 from the stryker.com news / product-detail work: what an agent (or any script)
needs from the QA tool to act on every finding without missing any, and without re-measuring the
pages itself. Ordered by priority; P1 alone would close most of the gap.

## Why

- **Snapshots aren't enough.** Today the API returns per width a list of texts with a category
  (missing / extra / drift `large` / font `property`). It has no values, no scores and no
  location, so every finding has to be measured again in a browser before it can be fixed.
- **The full report is too big.** Downloaded, it is complete but large: 40 pages gave 2,056
  findings that had to be clustered by a script before they could be worked on.
- **Things got missed.** In practice, findings were missed: summaries kept the averages, and the
  per-element drift data was not read.
- **What's needed:** one flat, complete list of findings with their values; a stable key that
  groups identical findings across pages and runs; and a diff between runs. With those, the
  agent works from tens of clusters instead of thousands of items, and nothing gets dropped.

## P1: complete findings, flat, with values

`GET /api/v1/runs/<id>/findings` (JSON Lines, or JSON with paging): **one record per finding**, every
kind the tool knows, nothing summarised away. Every record:

| field | content |
|---|---|
| `runId`, `pair` (slug), `sourceUrl`, `targetUrl`, `width`, `ua` | where |
| `kind` | `missing`, `extra`, `edited`, `moved`, `drift`, `font`, `image-missing`, `image-extra`, `height`, `hidden`, `load-error` |
| `severity` | number (0–100 or px), not only `large` / `medium` |
| `text` | raw text (≤ 200 chars) and normalised text |
| `source`, `target` | box `{x, y, w, h}`, tag, classes, a CSS path; on the target also the **EDS block** (nearest `.block` class list) and the **section** classes it sits in |
| `values` | font: `{property, source, target}` for **every** property that differs (font-family, size, weight, style, line-height, letter-spacing, text-align, colour, decoration, transform); drift: `sourceY`, `targetY`, `gapDelta`, the offset before / after; image: src, natural and rendered size; height: both page heights |
| `signature` | a stable key the tool computes, e.g. `font | line-height | 20.125px → 21.25px | target: p in .section.p-1-25`, or `drift | lower | columns.large-headline | 1440`. Same finding on another page or another run → same signature |
| `match` | for edited / moved / drift: how the source and target texts were matched (`exact`, `case-only`, `fuzzy`) and whether the text occurs more than once on the page (see *Known false positives*) |

Also `GET /api/v1/runs/<id>/pages`: per pair and width, the scores (health, content, drift,
fonts), counts per kind, page heights (source / target / ratio), capture status, load errors,
timings. That is the table to rank pages by.

Filters on both: `?kind=`, `?width=`, `?pair=`, `?minSeverity=`, `limit` / `cursor`. Responses
gzip-encoded.

## P2: clusters and run-to-run diff

- `GET /api/v1/runs/<id>/clusters`: findings grouped by `signature`: count, pages (list), widths, the worst example, a few sample records. Sorted by number of pages.
- `GET /api/v1/runs/<a>/diff/<b>`: by signature: **closed** (in a, not in b), **new**, **still open** (with count change), and per page the score deltas. That is the regression check after every fix round.
- **Suppression rules in the run request:** `suppress: [{kind, pattern, reason}]`. Matching findings are still returned, but marked `suppressed` with the reason, so known noise is visible and countable, not silently gone. Examples from this site:
  - "Last Updated <Month>/<Year>" lines: a metadata-sheet setting, not the import.
  - Video player timers ("0:00 / 4:54").
  - Letter-case-only edits.

## P3: evidence, so findings don't have to be re-measured

Per finding, on request (`GET /api/v1/runs/<id>/findings/<findingId>/evidence`, or `?evidence=1` on the findings route):
- **Styles up the tree:** the computed styles of the element and up to 6 ancestors, on both sides (tag, classes, font-size, line-height, box height, margin, padding, display / grid / flex). This was the most-run manual step in this project.
- **Markup:** the `outerHTML` of the element on both sides, truncated to 1–2 KB.
- **Crops:** URLs of the two screenshot crops. Images aren't needed for every finding, but useful for human review.

Downloads for people: the per-page zip, the full report and the customer report (what the Web UI's Download buttons give), as `GET` routes on the same token. An agent mostly needs P1–P3; the zips are for sharing.

## P4: measurement changes that remove false positives at the source

Found while checking findings by hand on this site:

1. **Line height: compare rendered line spacing, not the computed value.**
   - **Example:** on 24 pages, a `1.25em` span inside a `14px / 19.25px` paragraph computes `line-height: 20.125px` on the source, while ours sets `21.25px` on the paragraph.
   - **Rendering:** the lines are 21.25 px apart on both, with identical heights, so 1,062 findings were false positives.
   - **Fix:** measure the distance between line boxes and the element's height. Keep the computed value as a detail.
2. **Wait for lazy content before capturing.**
   - **Example:** a Marketo form loads only when scrolled into view, and its height then shifts the text next to it.
   - **Fix:** scroll through the page, wait for the network to settle, and accept `waitFor: [selectors]` in the run request (for example `form.mktoForm`).
   - **Report:** list what was still loading at capture time as a `load-error` or `incomplete` finding.
3. **Repeated texts.** When the same text appears twice on a page (a title in the hero and in the body), drift matched the wrong occurrence and reported +364 px instead of +77 px. Match by position or order, and say in `match` when a text is ambiguous.
4. **Case-only edits** (`text-transform: uppercase`): return them as `edited` with `match: case-only`, so they can be suppressed by kind.
5. **Bot challenges:** detect challenge pages (ALTCHA, captcha, a 403 or 429) on either side and report them as `load-error`, not as missing content.

## Running runs

- **Request settings:** `threads` (≤ 8 for this site) and `requestDelayMs` per run, plus a per-host cap across runs, so the customer's site and the EDS previews aren't hit too hard.
- **Back off when limited:** respect `429` / `Retry-After`.
- **Progress:** `GET /api/runs/<id>` with progress per pair (done / failed), an ETA, and the settings it actually used (echoed back), the engine commit and a config hash. That last part already exists.
- **Own runs:** cancel your own run, and list your own runs (by label prefix or idempotency key). Not others' runs.
- **Results kept for a while** (e.g. 14 days), so a diff against an older run is possible.

## Shape of the API

- **Versioning:** a `/api/v1/` prefix on everything, and `apiVersion` in every response.
- **Schema:** JSON Schema for each response at `GET /api/v1/schema`, so a client can validate and notice changes.
- **Errors:** one error shape, `{error: {code, message}}`. Return `403` for a route that exists but isn't allowed with the token, and `404` only for routes that don't exist. Today every closed route answers 404, which looked like a broken route rather than a closed one.
- **Credential:** taken from a header that the calling environment adds. Scope it to the routes above.

## Priorities in one line

P1 (findings with values plus the page table) → P2 (clusters plus diff) → P4.1 and P4.2 (line height,
lazy content) → P3 (evidence) → the rest.
