# Standardise while you QA: implementation plan (pilot on a fork, played as the customer)

## The idea in one paragraph

Today every migrated block carries the source's one-off values (readable settings such as `Text box | column 2: top 3%`, `Grid | …`, `Cell colours | …`, size tags), so pages look like live but the site has no standard. The proposal works per block type:

1. Group all instances of a block type by how they look.
2. Turn the most common looks (about 3 per block type) into **standard variants**: named, token-based, no numeric settings.
3. During the manual page QA the customer has to do anyway, show each block **as it is** next to **each standard variant filled with that block's own content**.
4. The reviewer picks one, and the document is rewritten with the choice.
5. "Keep original" stays possible, but it is counted and labelled legacy.

The customer standardises by choosing, not by rebuilding. The EDS team gets a small governed catalogue and a shrinking, measurable legacy remainder.

## How the pilot is run

- **We play every role.** The customer is not involved yet. We act as the customer's reviewers (manual page QA and choosing), as customer design (approving the look of the standards) and as the EDS team (proposing standards along EDS best practices). Real sign-offs come only if the pilot convinces.
- **Manual QA, no internal tools in the review.** The customer's QA is their own manual look at each page, comparing it with live. The pilot reproduces exactly that: we open each page on the fork's preview, compare it by eye with stryker.com, and choose.
  - The QA tool, css-blast-radius and our measuring scripts are **never shown in, or needed by, anything customer-facing**: not in the overlay, the decisions or the docs.
  - We may use them internally to prepare the pilot and to evaluate it afterwards.
- **We measure our own effort.** Time per page, choices per page and decisions per cluster. Since the pilot copies what the customer would do, those numbers estimate what the real exercise would cost them.
- **Open to better ways of choosing.** The pilot tests the obvious flow (page by page) against two smarter ones (cluster board, pre-selection), so we learn which one makes the customer's work bearable. See "Ways to make choosing cheaper" below.

## Where the experiment lives (fork, isolated)

The experiment must not affect PR #531 or the `/rs` pages, because we don't know where it will end up.

| Item | Value |
|---|---|
| **Code branch** | `standardise-v3`, forked from `readable-settings-v3` at `48bac1b`. Local git worktree outside the repo folder (e.g. `/tmp/run-outputs/std-wt`). No PR at first; a draft PR only if you want the team to see it. |
| **Content root** | `/std/…`: copies of the pilot pages and their fragments, with fragment links rewritten `/rs/` → `/std/`. `/rs` stays exactly as it is. |
| **Previews** | `https://standardise-v3--stryker-com--strykerenterprise.aem.page/std/us/en/…` (the fork's code + the `/std` content) |
| **Block Library** | Standard variants are documented in `/std/.da/library` (separate, like `/rs/.da/library`) |
| **Tooling** | Under `tools/importer/standardise/` on the fork (inventory, clustering, rules, apply, report). Scratch outputs go to `/tmp/run-outputs/std-*`, not into the workspace (file count). |
| **Remote writes** | Uploading `/std` documents to DA and previewing them happens only when you ask, as today. Nothing is published live. |

Merging back is a later decision. If the approach is adopted, the standards, rules and overlay move into the main line as their own PRs. If not, the branch and `/std` are dropped and nothing else changes.

## Why it can work (what we already have)

- **One block vocabulary.** All 1010 `/rs` documents use the shared blocks (Columns, Hero Corp, Cards Corp, …). The page-specific differences sit in settings rows, section styles and inline tags.
- **Settings are explicit and parseable.** Removing or replacing them is a mechanical document change, not a content rewrite. `scripts/corp-settings.js` already holds the parser and the registry of names.
- **Scale** (2026-11-04 counts): 909 section-style combinations and 598 block+variant combinations. 537 of 575 block tokens are numbers, and only about 85 tokens are real design names. Most of the variety is numbers, which is what makes collapsing it plausible.

## Ways to make choosing cheaper (to test in the pilot)

None of these needs a tool the customer doesn't have. They change *what* the reviewer looks at, not how it is measured.

1. **Page by page (baseline).** The reviewer opens a page, steps through its blocks, compares each with live by eye and picks. This is the simplest flow and the closest to the customer's QA.
2. **Cluster board.** One board page per cluster, e.g. "Columns: image | text, 50/50, coloured text cell", showing every instance of that cluster side by side. Each row is the original plus each standard with that instance's content, with a link to the live page.
   - The reviewer decides **once for the cluster** and marks only the exceptions.
   - The later page QA just confirms.
   - Expected to cut choices by an order of magnitude, if clusters are as tight as the token counts suggest.
3. **Pre-selection with an honest reason.** Where a standard's rendering is almost identical to the original, the overlay pre-selects it and says so plainly ("looks the same as today"). The reviewer only glances.
   - The near-identical check is a plain geometry/pixel comparison done when we prepare the pilot, **not** the QA tool, and its result is a yes/no shown as that sentence.
4. **Template-first order.** The customer has no real templates, so the clusters stand in for them. Reviewing the biggest clusters first gives most of the standardisation for the least effort; the tail can stay legacy.

The pilot measures flow 1 on some pages and flows 2+3 on the others, so we can compare the effort.

## Step-by-step implementation

### Step 0: set up the fork
1. **Branch and worktree:** create `standardise-v3` from `readable-settings-v3` in a separate worktree and push the branch. Code Sync then serves its preview. It holds no code changes yet.
2. **Pilot pages:** pick 20–40 product-detail pages, using the feature-cover method restricted to Columns signatures (step 1) so every Columns cluster appears at least once.
3. **Copy content:** copy those pages plus every fragment they link to from `content/rs` into `content/std`, rewriting `/rs/` → `/std/` in fragment links. Then run the existing checks on the copy: broken fragment links, coverage.
4. **Upload (on request):** upload `/std` to DA and preview it on the fork branch. Before any change, the fork preview must match the `/rs` preview; spot-check with the heading-drift script (internal check).

### Step 1: inventory and clustering (offline, internal preparation)
**Script:** `tools/importer/standardise/inventory.mjs`. It loads documents and renders pages in Playwright, one page at a time, like the style check.

- **Instance id:** `<doc path>#s<section index>b<block index>`, plus a content hash so later document changes are detected. Fragments are inventoried in their own documents and linked to the pages that use them.
- **Document features (per block instance):**
  - block name and options (classes);
  - section styles;
  - settings rows, parsed with the same rules as `corp-settings.js`;
  - cell structure: number of cells and the kind of content in each (image, video, heading, text, list, button, fragment);
  - inline tag inventory: names and size values;
  - Box lines and blank lines.
- **Rendered features (fork preview, 1440 and 375):**
  - block box and cell widths, as ratios;
  - padding and background colour per cell;
  - heading and copy sizes;
  - image aspect ratios;
  - vertical alignment;
  - phone stacking order.
- **Signature, three levels:**
  1. *Structure:* block + cell count + cell-kind pattern (e.g. `columns: image | text`).
  2. *Layout:* width bucket (50/50, 33/67, equal 3–4) + phone behaviour (stack / grid) + alignment.
  3. *Treatment:* cell colours present (which family), padding bucket (none / ≤3% / >3%), heading-size bucket, image border.
- **Clustering:**
  - Group exactly on levels 1 and 2 first.
  - Within each group, merge level-3 variants whose weighted distance is under a threshold.
  - Clusters below a minimum size go to the "tail".
- **Outputs:**
  - `instances.jsonl`;
  - `clusters.json`;
  - a readable report: coverage of the top 1/3/5 clusters per block type, and per cluster its typical settings, size and 3–5 example links on the fork preview.

### Step 2: standard variants (we propose and approve, playing EDS team and design)
1. **Proposal:** from the top clusters, up to 3 standards per block type. Example for Columns (to be confirmed by the data):
   - *media + text*: image and text 50/50, top-aligned, standard gap;
   - *text pair*: two text columns;
   - *tiles*: 3–4 equal cells with an optional named colour.
2. **Each standard is defined by:**
   - a Block Library name and a class (`columns (media-text)`, …);
   - a small set of named options (e.g. a colour from the existing palette names, image left/right);
   - tokens only, no numbers;
   - mobile-first CSS at 600/900/1200, in the block's corp CSS, scoped to the variant class.
3. **Tail rules:** e.g. "every padding → the variant's own padding", "size values → the nearest named text style or none".
4. **Review artefact:** a standards gallery in `/std/drafts/standards`, with each standard shown with the content of 3 real instances. We review it as design would and note what the EDS team would likely push back on.
5. **Legacy tier:** write down the rules we would propose for it (migrated pages only, flagged, deprecation path), to put to the real EDS team later.

### Step 3: content transfer rules (one module per block type)
- **Module:** `tools/importer/standardise/rules/columns.js`, a pure ES module working on DOM elements, so the **same code runs in the browser (steps 4 and 5) and in Node (step 7)**.
- **Interface:** `transform(sectionEl, instance, standard) → sectionEl'`.
- **Columns rules:**
  - Keep cells and their content order; swap cells if the standard needs image-first.
  - Drop the `Text box`, `Grid`, `Column widths`, `Cell colours` and `Image borders` rows. When the standard has an equivalent named option, map to it (a cell colour within the palette → the variant's colour option).
  - Tags: size values (`[[1.75×]`, `[[5vw]`) → the nearest named text style if the standard allows one, else drop. Colour names stay, since they are names.
  - Box lines in cells → dropped, or the standard's box option. Blank lines → dropped unless the standard keeps spacing lines.
- **Report:** every transform returns what it dropped or changed, in plain words ("cell padding removed", "heading size → Large"). The reviewer sees that, not numbers.
- **Tests:** unit tests with one fixture per cluster (input section → expected output), run with the repo's node tooling.

### Step 4: page overlay (flow 1, fork preview only)
- **Script:** `scripts/standardise-preview.js`, loaded from `scripts.js` only when the host is `*.aem.page` **and** the URL has `?standardise=1`. It never loads on production.
- **Building a candidate:**
  - fetch `<page>.plain.html` and find the section by instance id;
  - run `rules.transform` for each standard;
  - insert the result into a detached container and decorate it with the same functions the fragment block uses. Each candidate is real EDS rendering, not a mock-up.
- **No extra documents** are created for candidates.
- **UI per block, all customer-safe:**
  - a small sticky bar on the block: `Original | A | B | C | Keep legacy`;
  - clicking swaps the rendered section in place;
  - a "compare" toggle shows original and candidate side by side;
  - a "live" link opens the stryker.com page scrolled to the same heading;
  - the plain-words list of what the transform changes;
  - a badge "decided for the whole group" when the choice comes from a cluster decision, and "looks the same as today" when pre-selected.
- **Effort log:** the overlay records time on page and number of choices, kept with the decisions.
- **Opening it:**
  - pilot: a Sidekick button on the fork (`tools/sidekick/config.json`) that adds `?standardise=1`;
  - fallback: the URL itself.

### Step 5: cluster board (flow 2, fork preview only)
- **Page:** a generated draft `/std/drafts/clusters/<block>-<cluster>` per cluster. The source for every row is one instance, referenced by page and block id.
- **Script:** the same overlay script in board mode (`?standardise=board`). It renders each row as original + candidates with the shared rules.
  - **Header:** cluster description in plain words, number of instances and pages.
  - **Per row:** the instance's page title, a live link, the candidates, and an "exception" toggle that excludes the instance from the cluster choice.
  - **One cluster choice** for the whole board; exceptions get their own choice.
- **Order:** biggest clusters first (template-first order).
- **Page QA afterwards:** the page overlay shows cluster decisions as pre-filled. The reviewer only confirms or overrides them.

### Step 6: recording choices
- **Decision record:** `{ page, block id, content hash, cluster, scope: instance|cluster, choice: A|B|C|legacy, preselected: yes|no, reviewer, date, seconds spent, comment }`.
- **Pilot (no auth involved):** the overlay keeps choices in the browser's local storage and offers **Export decisions** (a JSON download or copy). We merge the files into `decisions.json` on the fork.
- **Later, if adopted:** a small DA app (`tools/standardise/app.html` registered as a DA app) that writes the decisions sheet `/std/.da/standardise/decisions` through the DA SDK, with the reviewer's own session. We never handle credentials.
- **Pre-selection (prepared offline, internal):**
  1. For each instance and standard, render the original and the candidate at 1440 and 375 (`?standardise=1&pick=A`) in Playwright.
  2. Compare the block crops (box geometry + pixel difference). Under a threshold, mark that standard "looks the same".
  3. Store only that yes/no in `candidates.json`. The overlay shows it as the sentence above; no scores or tool names reach the UI.

### Step 7: apply (ours, batch)
- **Script:** `tools/importer/standardise/apply.mjs`.
  1. Resolve each instance's choice: instance > cluster > pre-selected > none (none = unchanged).
  2. Check the content hash.
  3. Run the same `rules/*.js` in a Playwright page used as the DOM host, so no new dependency is needed.
  4. Write the changed documents to `content/std`.
- **Report:** per page, the blocks changed, what each transform dropped, and any skipped instances (hash changed, no decision).
- **Internal checks after apply:**
  - broken fragment links and coverage (unchanged);
  - the style coverage check in a **standardised mode**, which treats the decision's intended drops as expected and flags anything else;
  - css-blast-radius impact for the new variant CSS;
  - heading drift before and after.
- **Upload and preview** of the changed `/std` documents, only when you ask.
- **Final manual pass:** we look through the applied pages on the fork preview against live, as the customer would sign them off.

### Step 8: measure and decide
**Report script:** `tools/importer/standardise/report.mjs`, per block type:
- % of instances on a standard;
- legacy count and pages;
- choices made in flow 1 (page by page) against flows 2+3 (cluster board + pre-selection);
- minutes per page and per cluster, from the effort log;
- what changed visually (our manual notes + internal drift numbers, kept internal).

Then we decide together whether the effort looks bearable for the customer, which flow to propose, and whether to extend it to Hero Corp, Cards Corp and the other templates before involving the customer and the EDS team.

## Where the picker lives

| Option | Pros | Cons |
|---|---|---|
| **Overlay + cluster board on the fork's branch preview, JSON export** (pilot) | Quickest; real EDS rendering; no auth; preview-only; no internal tools exposed | Choices travel as files; not self-service |
| **DA app with the overlay** (if adopted) | Writes the decisions sheet with the reviewer's own DA session; inside the authoring tool | More build effort; DA app registration is a site config change |
| Standalone review app | Full control | Separate login/hosting; one more tool for the customer |

## Risks and open questions

- **Legacy tier:** will the real EDS team accept one? The pilot gives us numbers to argue with: how big the tail is.
- **Per-cluster decisions:** will the customer accept them? The pilot shows whether a cluster board decision survives the page-by-page check.
- **Content fit:** a standard may break with some content. The preview shows it, and the reviewer keeps legacy or picks another standard.
- **Blocks with behaviour** (carousels, tabs, charts, forms) cluster less cleanly, so the pilot covers layout blocks only.
- **Our own bias:** we know the tools and the pages. Our time is a lower bound for the customer's; note where a customer reviewer would struggle.
- **Drift between `/std` and `/rs`:** fixes made on `/rs` meanwhile must be re-copied to `/std` before applying. The content hash detects when that is needed.
- **Fork maintenance:** keep `standardise-v3` rebased on `readable-settings-v3` so the comparison stays fair.

## Phases

| Phase | Content | Who |
|---|---|---|
| A | Fork setup, pilot pages, inventory, clustering, coverage report | Us (internal) |
| B | Standards + CSS on the fork, Columns transfer rules + tests, page overlay, cluster board, pre-selection | Us (as EDS team / design) |
| C | Pilot review: flow 1 on half the pages, flows 2+3 on the rest, decisions + effort log | Us (as customer reviewers) |
| D | Apply, final manual pass, report, decision on scaling and on involving the customer | Us, then you decide |

## Checklist

- [ ] Create branch `standardise-v3` from `readable-settings-v3` (48bac1b) in a separate worktree and push it (no PR yet)
- [ ] Pick 20–40 product-detail pilot pages covering every Columns signature (feature-cover method)
- [ ] Copy the pilot pages and their fragments into `content/std`, rewrite fragment links `/rs` → `/std`, run link and coverage checks
- [ ] On explicit request: upload `/std` to DA, preview on the fork branch, confirm it matches `/rs`
- [ ] Write `tools/importer/standardise/inventory.mjs`: document + rendered features per block instance, stable ids and content hashes
- [ ] Implement the three-level signature and clustering; write `clusters.json` and the coverage report (top 1/3/5 per block type)
- [ ] Draft up to 3 standard Columns variants (names, options, tokens, 600/900/1200 CSS) and the tail rules on the fork
- [ ] Build the standards gallery draft; review it as design and note the likely EDS-team objections and the legacy-tier proposal
- [ ] Write `rules/columns.js` (DOM-only, shared by browser and Node) with a plain-words change list and per-cluster test fixtures
- [ ] Build `scripts/standardise-preview.js` page mode (fork only, `aem.page` + `?standardise=1`): candidates, block bar, compare, live link, change list, effort log
- [ ] Build board mode (`?standardise=board`) and generate one cluster board draft per cluster, biggest first, with exception toggles
- [ ] Prepare pre-selection offline (geometry + pixel difference) and store only the yes/no in `candidates.json`
- [ ] Add the Sidekick "Standardise" button on the fork; implement local-storage choices with JSON export
- [ ] Run flow 1 (page by page) on half the pilot pages, by hand against live; export the decisions and effort log
- [ ] Run flows 2+3 (cluster boards, then page confirmation) on the other half; export the decisions and effort log
- [ ] Write `tools/importer/standardise/apply.mjs` (instance > cluster > pre-selected resolution, hash check, rewrite `content/std`, apply report)
- [ ] Add a standardised mode to the style coverage check; run the internal checks after apply
- [ ] On explicit request: upload and preview the applied `/std` documents on the fork branch, then do the final manual pass against live
- [ ] Write `report.mjs` (% standardised, legacy count, choices and minutes per flow) and present the results to you
- [ ] Decide with you on the flow to propose, whether to scale to other blocks and templates, and when to involve the customer and the EDS team
- [ ] On explicit request: document the standard variants in `/std/.da/library`

> Note: this is a plan only. Building it needs Execute mode, and any DA upload, preview or library write needs your explicit go-ahead.
