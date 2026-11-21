# qa-tool API gate test, 2026-11-06

Gate: https://chest-copied-finite-trial.trycloudflare.com (build from `/api/health`). Requests sent without an Authorization header (the environment adds the gate token). Raw requests and responses: `/tmp/run-outputs/qa-api3/` (local disk, `req_*`, `h_*`, `b_*`).

Runs used: evidence run `3641ce18-2af1-466a-ad4a-463b98c8a7c2` (3 pairs: LIFEPAK 15, SpineJack, Insignia; 1440 + 375), cancel run `9f28e03c-322f-4478-b5a0-af96337c20b9` (8 pairs), threads run `d0374304-ca89-4dc9-8b57-19580cf20604` (1 pair, cancelled at once), deleted run `7bb2f6b4-17ba-4c99-bfa4-4d7074af439e`.

## Results

| Step | Result |
|---|---|
| 1. Docs and schema | PASS. `requests.createRun` and `requests.updateRun` present. Discrepancies listed below. |
| 2. Evidence and crops | PASS. Evidence and crops show the right element on both sides for a missing, a drift and a font finding. Missing (SpineJack "Resources" + 16 links) and drift (LIFEPAK TOUGH +129.5px) are correct; the font finding (button text-align center → left) is correct as a computed value but invisible (button shrink-wraps its text; crops identical). |
| 3. Cancel | PASS. 202 `{status: running, stage: cancelling, pairsDone: 2}`, `cancelled` 5 s later; pairStatus `ok, ok, cancelled ×6`; pages/findings/clusters/summary readable with `runStatus: cancelled`; second cancel 409 `run_ended`. |
| 4. Retention PATCH | PASS with one gap: 30 → 200, `expiresAt` = `endedAt` + 30 days in the response and in `GET /api/runs/<id>`; 0, 91, 2.5, null, extra field, `{}`, array, non-JSON → 400; unknown id → 404. Gap: `"30"` (string) → 200. |
| 5. Expiry | PASS. `{"retainDays": 1}` on 7bb2f6b4 → `deleted: true`; every legacy and v1 route (run, results, files, pages, findings, cancel, PATCH, diff) → 410 `run_expired` with `runId`, `expiredAt`. |
| 6. Access | PARTIAL. DELETE run, recipes → 403; unknown paths → 404; wrong method → 405 with `Allow`; disallowed file → 403 with the list; `%2F`, `%5C`, `//` → 400. Glossary and Web UI → 404, not 403; malformed path code `bad_request`, not `invalid_path`; `%2e%2e` → 404. |

Extra: same idempotencyKey → 200 `deduplicated: true`; `threads: 8` → 201 with `adjusted.threads {requested 8, used 4}`; pages of a run cancelled before any pair → 404 `results_not_found`.

Not tested: 401 (a wrong token can't be sent from here), another owner's run id (none known; only made-up ids), 503 busy.

## Docs vs behaviour

1. Error envelope: `responses.error` (schema) and API.md *Access* say gate errors use `{apiVersion, error: {code, message}}` on any path; the gate answers `{"error": {code, message}}` without `apiVersion` (the gate preamble matches the gate). Errors passed through from qa-tool's v1 routes do carry `apiVersion`.
2. Malformed path: docs `400 invalid_path`; gate `400 bad_request`. `/api/runs/%2e%2e/x` → 404 instead of 400.
3. Preamble: "glossaries and the Web UI are not available (403)". `/api/glossary`, `/api/glossaries`, `/`, `/index.html`, `/runs` → 404. The docs never name the glossary route.
4. Expired run on legacy paths: API.md says `{error, code: "run_expired", runId, expiredAt}` (flat); the gate answers `{"error": {code, message, runId, expiredAt}}`.
5. Legacy cancel of an ended run: API.md says `409 run_ended` for both cancel routes; `POST /api/runs/<id>/cancel` answers `{"error": {"code": "conflict", "message": "Run already ended"}, "status": "cancelled"}`.
6. Cancel prose: "a running one is `cancelling`". `status` stays `running` and `stage` is `cancelling` (matches the schema enum, not the prose).
7. `retainDays: "30"` (string) is accepted; the schema says integer and the docs "a whole number".
8. Runs from before the gate's retention (683e3ea0, 7bb2f6b4) show `retainDays: null`, `expiresAt: null`: kept until deleted, which the preamble says isn't available (and "runs are deleted 14 days after they end").
9. `owner` is `null` on gate runs; API.md says a token run records `owner: {id, name}` (expected, as the gate calls qa-tool as a local client, but the preamble doesn't say so).

## Our side (not the tool)

SpineJack (converted copy and real path): the fragments `/us/en/fragments/stryker/interventional-spine/en/business-unit-page/footer-links/master` and `…/social-icons/master` exist locally but not in DA (404), so the Resources links are missing on the preview.

# Part 2: how much data per QA round (2026-11-06, laptop gate)

Gate `served-seminars-accommodations-article.trycloudflare.com` (build 7e13302). Four text-only runs of converted product-detail pages, 2 widths (1440, 375), 4 threads (the gate's cap): nested sets 10 ⊂ 25 ⊂ 50 (stratified by business unit) and the same 25 at the real path. All pairs ok. Durations: 8.0 / 9.4 / 14.0 / 7.4 min (about 17 s per pair once warm). Scripts: `.cbr/local-scripts/qa-size-*.py`; measurements: `.cbr/qa-size/` (git-ignored).

Tokens are estimated as bytes / 3.5. "Compact" = what an agent keeps after filtering with a script: per page row the scores, non-zero finding counts, capture status and heights; per cluster the signature (110 characters), kind, count and pages; per finding the kind, magnitude, text (60 characters), key values and the element path end.

| | 10 pairs | 25 pairs | 50 pairs |
|---|---|---|---|
| Pages table, raw | 21k | 53k | 106k |
| Pages table, compact | 1.2k | 2.8k | 5.6k |
| Clusters, raw (limit 1000) | 411k | 652k (truncated) | 666k (truncated) |
| Clusters on 2+ pages | 68 | 156 | 357 |
| … compact | 2.0k | 4.5k | 10.6k |
| All findings, raw | 714k (1,357) | 1.68M (3,015) | 3.2M (5,722) |
| One page at one width, raw: median / max | 35k / 79k | 32k / 114k | 32k / 114k |
| One page at one width, compact: median / p90 / max | 2.9k / 5.7k / 6.7k | 2.6k / 5.3k / 9.3k | 2.6k / 5.0k / 9.3k |

Also: one finding's evidence ≈ 1.4k tokens; `findings?evidence=1&limit=20` ≈ 48k; a crop is a small PNG (≈ 20–250 image tokens). Every response took under 1 s once the run's projection was ready.

**Conclusion.**
- The raw responses can't be read by an agent at any run size (one page ≈ 32k tokens, clusters ≈ 650k). Everything must go through a filter script; the API's filters (`pair`, `profile`, `kind`, `grade`, `minMagnitude`, `minPages`, `sort`, `limit`) make that easy, and all of them checked out.
- The overview (every page row + every cluster on 2+ pages) costs about 320 tokens per pair: 50 pairs ≈ 16k, 100 pairs ≈ 32k. Up to about 50 pairs I can read the whole overview each round; from 100 pairs on, only the worst pages and the most shared clusters (≈ 3k tokens whatever the size).
- The real limit is the deep dive: about 5k tokens per page (two widths, compact) before looking at code or crops; 3–5 pages per round fits next to the code work.
- So: run sizes are not limited by my side (a whole template, 672 pairs, is fine as one run). Per round I read the worst 20 rows, the top 40 shared clusters and 3–5 pages; a full read of the overview fits up to about 50 pairs.

**Run-to-run noise.** The same 25 converted pages measured twice (25 vs 50 run, diff route `view=pages`): 134 records closed and 100 new of about 3,000 (≈ 4% each way). Our own count by signature: 234 differences, nearly all on four pages (pneumoclear 1440, epf-xpress 1440, tenfuse 375, versitomic-flexible-reaming-system 375 and 1440). One of them scored health 37 in the 10 run and 72 in the 25 run. A round of fixes must be judged against this noise; those pages likely need `waitFor`.

**Converted vs real path.** Same findings on every page (3,015 vs 2,979 records). The signature differences (202 / 166) are the noisy pages, plus pages whose real-path DA copies predate the 2026-11-05 box-colour fix: the same finding, but the class list in the signature differs (`boxed-last`, `cell-2-bg-light-gray`, `bg-golden-gradient`, `columns-50-50`).

**API notes from this round.**
1. `diff` pairs pages by source and target URL, so two runs of the same sources on different targets can't be diffed (`compared: 0`). Not needed, though: a run can compare any two equivalent pages directly, e.g. a branch page as source and the main page as target (user, 2026-11-06).
2. Signatures include the full class lists of the block and section, so one class change (a variant added, a utility class removed) turns every finding there into closed + new. A signature level without the classes (block name and variant only) would keep diffs meaningful across class changes.
3. Clusters: `limit` max 1000 truncates from 25 pairs on, and each cluster carries its full worst record (≈ 2.3 KB). A `fields=` or compact option (worst id only) would cut the response by ~90%.
4. `findings?evidence=1` is heavy (≈ 2.4k tokens per record); prefer the per-finding route.
5. A queued run has no `pairsDone` / `pairsFailed` (the guide lists them for `GET /api/runs/:id`).
6. Fixed since the first round, rechecked on build 7e13302:
   - `{apiVersion, error}` on every path;
   - malformed paths → `400 invalid_path` (dot segments included);
   - `retainDays: "14"` → 400 ("a JSON integer");
   - legacy cancel of an ended run → `409 run_ended` with `status`;
   - `/api/runs/<id>/glossary` → 403, the Web UI → 404, as the preamble now says;
   - `owner: null` explained in the preamble.

   All 9 first-round items are resolved.

# Part 3: running qa-tool locally (2026-11-07, zip of main, 07 Nov)

Installed over the local copy `.qa-tool/` (233 files; lockfile unchanged, so the installed libraries were kept; backup of the old copy: `.cbr/qa-tool-backup-2026-11-06.tgz`). Server started with `.qa-tool/local-scripts/qa-server.sh` (`node webui/server.js`, runs and API cache on the local disk, memory guard that cancels runs through the API).

**Test suite** (`npm test`, 58 files, 2 min): 422 tests, 414 pass, 2 skipped, 6 fail.
- `capture-deny-retry-browser` "a DNS failure fails fast": environment. This box reaches the web through a proxy, so an unknown host is a proxy error page, not `ERR_NAME_NOT_RESOLVED`. Passes without the proxy.
- `webui-shutdown-cleanup` "deleting a running run … stays deleted": environment. The repo is on a network drive, where a folder with open files can't be removed at once. Passes from the local disk.
- `review-inspect-browser`, 3 subtests + the suite (4 counts): the **Inspect** button of a drift row can't be clicked: the row's `<small>large · 60px · 100,200 → 100,260</small>` covers it (`.row .ins` floats right; Playwright: "intercepts pointer events"). Fails on the local disk too. Confirmed on a real review page of the run (`pairs/pair-0023-…/layout-review-1440.html`, Drift Diffs tab): 15 of 24 Inspect buttons are covered by their row's `<small>` at 1400 and 1100 px wide, so a click lands on the row instead.

**Server and API, local caller (no token):**
- One run, 37 pairs at 3 widths (1440, 860, 375), 4 threads, `evidence: true`: 6.7 min (≈ 11 s per pair), all ok, peak anonymous memory 2.5 GB.
- All 14 API checks of part 2 pass (sorting, paging, filters, `invalid_param`, JSONL count); evidence and crops 200.
- `GET /api/health` → `build.commit`/`branch` are the *enclosing* repo's (`6c9dcbc`, `news-detail-rebuild-v3`): the copy has no `.git`, so git finds our project repo. `codeHash` is right (77f38cde…, same as the laptop). Suggest: report `commit: null` when the tool's own folder isn't the git top level.
- `admission.headroom.freeMemMb` 57,073 here: the host's free memory, not the container's 8 GB cgroup limit, so admission can't protect a container. Suggest reading `/sys/fs/cgroup/memory.max` and `memory.current` when present.

# Part 4: the fixes (2026-11-07, zip of main, 08 Nov)

Changed: `lib/build-info.js`, `lib/headroom.js`, `lib/canonical-review-html.js`, `index.js`, their tests and docs; dependencies unchanged. Installed over `.qa-tool/` (backup of the replaced files: `.cbr/qa-tool-backup-2026-11-07.tgz`), server restarted.

| Issue | Now | Result |
|---|---|---|
| `/api/health` showed the enclosing repo's commit and branch | `commit`, `commitDate`, `branch`: null; `codeHash` b12622effbc07129 | Fixed |
| Free memory was the host's (57,073 MB) | 7,248 MB under the container's 8 GB limit (memory.max − memory.current = 6,216 MB, so page cache counted as free) | Fixed |
| Inspect buttons covered by the drift label | New run 517a089d (2 pairs, evidence): 0 of 86 covered on 4 review pages, at 1400 and 1100 px | Fixed |

Test suite (428 tests): 424 pass, 2 skipped, 2 fail, both environmental:
- the DNS test (this box's proxy, as before);
- `change-monitor-deploy` "resolves and compares commits in this repository": needs the tool to be its own git checkout (`git -C … remote`: not a git repository). It passed in part 3 only because git found our project repo around `.qa-tool/`.

The review-inspect tests pass.
