# Text-Style Fidelity Validator

Post-import QA for migrated pages. It compares the **computed style of every
visible text run** on a migrated page against the **same text on its source
page** — ignoring DOM structure — and **clusters identical mismatches across all
pages** so each issue can be reasoned about (and fixed) **once per issue-type,
not once per page**.

This exists because on hand-edited source sites the same semantic element (a
heading, a citation superscript) is authored with wildly different nested markup
per page. Per-page CSS/parser patches don't scale. The invariant that *does*
scale: **migrated text should compute the same style as the same source text in
the same place** — which is measurable without AI.

## Why computed style, not markup

`getComputedStyle` is the ground truth for how text reads, and it collapses all
the per-page markup variation. Two runs of the same words in the same visual
role compare equal no matter how the author nested `<span>`s. The matcher pairs
runs by **content** (adapted from the QA tool at
<https://github.com/iustinp/qa-tool> — `normalizeTextLine` + the
exact → substring → contiguous-token-coverage tiers in `auditVisibleText`),
then diffs the style fingerprints of the pairs.

## Requirements

- Node 18+ and Playwright (Chromium). The tool reuses the Playwright install
  from the excat content-import skill by default; override with
  `PLAYWRIGHT_NODE_MODULES=/path/to/node_modules`.
- The migrated pages must be reachable (local preview `http://localhost:3000`
  by default, or any URL).

## Usage

Single ad-hoc pair:

```bash
node tools/style-validator/validate-text-style.js \
  --source  "https://example.com/us/en/some-page.html" \
  --migrated "/content/us/en/some-page"
```

A whole template from a config (recommended):

```bash
node tools/style-validator/validate-text-style.js \
  --config tools/style-validator/configs/procedure-detail.json
```

Options: `--out <dir>` (default `migration-work/importer`). Exit code is `2`
when style-mismatch clusters exist (so CI / a fix loop can gate on it), `0` when
clean, `1` on error.

## Config format

Project-agnostic — only `previewBase` + `pairs` are required. Everything else is
optional and lets you adapt the tool to a site without touching code. A generic
starting point is `configs/example.json`; `configs/procedure-detail.json` is this
repo's real (Stryker) config and doubles as a filled-in example.

```jsonc
{
  "previewBase": "http://localhost:3000",     // joined to a `migrated` path
  "pairs": [                                   // REQUIRED: the source↔migrated pages
    { "name": "<page-name>",
      "source":  "https://<source-site>/<path>.html",
      "migrated": "/<preview-path>"            // or a full URL
    }
  ],

  // ---- optional ----
  "fingerprintFields": ["fontFamily","fontSize","fontWeight","fontStyle","color","textDecorationLine"],
  "minTokensForCluster": 2,                     // shorter runs reported, not auto-fixed
  "excludeContexts": ["some-widget"],           // context-hint substrings to drop (3rd-party forms/embeds)

  // block scoping for stable auto-fix selectors — YOUR site's block + variant
  // class names (exact tokens, never the *-container/*-wrapper structural classes)
  "blockClasses":   ["panel", "cards", "hero"],
  "variantClasses": ["wide", "dark", "cta"],

  // treat differently-named-but-identical fonts as equal (foundry/license renames)
  "fontFamilyAliases": { "Some Font for AcmeCo": "somefont", "SomeFontW01": "somefont" },

  // spacing pass
  "spacing": true,                              // false to disable
  "spacingThresholdPx": 15,
  "spacingBreakpoints": [390, 1200],

  // fix-loop: the import entry the orchestrator rebundles for a MARKUP fix.
  // Set to null for singletons / CSS-only projects to skip re-import entirely.
  "importScript": "tools/importer/import-<template>.js"
}
```

`migrated` may be a preview path (joined to `previewBase`) or a full URL.
The **fix target** (which CSS file fixes land in) is NOT configured — it is
auto-detected from each page's rendered `template`/`theme` metadata (see below).

## Output

`migration-work/importer/text-style-diff.json` (git-ignored working artifact)
plus a console summary. Each **cluster** carries:

- `key` — the normalized style delta, e.g.
  `color:rgb(a)→rgb(b) | fontFamily:X→Y`
- `pages` / `count` — where and how often it occurs (worst-first ordering)
- `samples` — example text, context hint, and both fingerprints

`pairingStats` reports match quality (`exact` / `substring` / `partial` /
`missing` / `countMismatch`) so you can judge whether the pairing is trustworthy
before acting on the clusters.

## How to act on clusters

Each cluster is one fix, applied where its cause lives:

- **font-family / weight / style** on heading/body text → often authored inline
  emphasis (bold/italic), so it round-trips through markup: fix in the import
  parsers/transformers by emitting the right `<strong>`/`<em>` (drive the decision
  from the source's **computed leaf**, not class names — see Principles below).
- **font-size, text-decoration, arbitrary colors** → cannot be expressed by markup
  alone; fix in **scoped CSS** — template CSS for a templated page, or
  `styles/themes.css` (scoped to `body.<theme>`) for a singleton.
- **repeating semantic elements** (e.g. citation links) → one rule keyed on the
  stable invariant (an href/attribute pattern), not per-page markup.

## Principles for a fresh run (zero prior context)

These are the durable lessons this tool encodes — read them before acting on a
new site, because they are *why* the code is shaped this way:

1. **Measure the leaf, not the element.** Hand-edited sources nest many spans; a
   heading's own (or an outer span's) computed style reads the WRONG values — the
   visible result comes from the innermost text-bearing descendant. When matching
   source typography, walk to the deepest leaf and read `getComputedStyle` there.
2. **Style by semantic invariant, not markup.** The same semantic thing (a
   citation, an accent, a heading) is authored with different markup per page.
   Chasing each variant is whack-a-mole. Identify content by a stable signal (an
   href/attribute pattern, or a computed-style signature) and apply ONE rule/
   transform to all of it — self-consistent and scalable.
3. **Not every diff is a bug.** Font-size is frequently responsive or inconsistent
   in a hand-edited source; a single rule that "fixes" one page regresses another.
   The tool leaves size for human judgment (auto-applies only markup-round-trippable
   fields) and its must-not-regress guard reverts an over-fit.
4. **Font renames ≠ mismatches.** A source and its migration may reference the
   identical face under different family names — alias them (`fontFamilyAliases`)
   or every run reports a false mismatch.
5. **Text-style first, then spacing (series).** A spacing symptom can have a
   text-style (font-size) root cause, so spacing is HELD until text-style is clean
   (see the series gate). Fixing an upper element's issue often cascades to gaps
   below it — process top-to-bottom, one fix per iteration, re-measuring each time.

## Autonomous fix loop (optional)

`fix-loop/orchestrate.js` drives a **guarded** cluster → fix → re-import →
re-validate cycle. It owns every deterministic step; the coding agent supplies
the one AI action (the actual fix) per cluster — a Node script can't call an LLM.

**Fully-automatic CSS fixes (`run`)** — generates scoped, per-page CSS from the
clusters, applies it once, and confirms it helped:

```bash
node tools/style-validator/fix-loop/orchestrate.js run --config <cfg> [--include-size]
```

`run` (1) clears the managed AUTO-FIX block and validates a **baseline**, (2)
generates scoped rules from the clusters and writes them into that block, (3)
re-validates and confirms the **non-size field-mismatch metric strictly dropped**
— auto-reverting the block if it somehow didn't. It's one-shot, not a loop: CSS
fixes can't reveal new issues, so iterating would only risk regenerating an empty
block over a working fix.

**Auto-tiering / scoping.** Each cluster's page set decides its scope, read from
the report's auto-detected `fixTarget` (see "Fix target auto-detection"):
- cluster on **all** pages → the whole-target scope (`body.<template>`)
- cluster on a **subset / one** page → an OR-list of those pages' own body/theme
  classes
combined with the run's own stable selector (an `href`/`id` anchor, or a
block/section-class + tag). This is how unique per-page fixes coexist in one
stylesheet without colliding: every rule names its own page + element scope, so
two pages' rules can't match the same element.

**What is applied vs left for humans.**
- Auto-applied: `color`, `font-family`, `font-weight`, `font-style`,
  `text-decoration` — the fields that encode "what the text is" and match the
  source reliably.
- `font-size` is applied **only** with `--include-size`, because on hand-edited
  sources it's frequently responsive (viewport-relative) or **inconsistent across
  pages** (the same element authored at different sizes) — auto-pinning it would
  make pages *worse* while satisfying the validator. These residuals are reported
  for human judgement.
- Fragile/artifact selectors (a bare `<u>`/`<b>`/`<span>` with no stable signal)
  are skipped rather than targeted.

**Progress metric & guard rail.** `check`/`run` measure **non-size field
mismatches** (each run × each differing field, excluding font-size), which
strictly decreases as fields are fixed — unlike raw cluster count, which can
*rise* when a multi-field fix leaves a size residual that splits one cluster into
smaller ones. If the metric doesn't drop, the run reverts and flags for review.

**Lower-level commands** (for the agent-in-the-loop / re-import fixes):
`plan` (list clusters + fix-surface hints), `apply` (regenerate the CSS block),
`reimport --pages a,b` (rebundle + re-import), `check` (re-validate + guard).

## Spacing validator (anchor-based)

Runs in the same pass and reuses the same text pairing. Where the style
validator compares *how text looks*, the spacing validator compares *how far
apart the major elements sit*, source vs migrated.

**How it works.** A source text run and its migrated match (identical
normalized text + role) are trustworthy positional **anchors** — the same words
on both pages. Absolute positions can't be compared (page heights differ), so it
compares the **gap between two consecutive anchors**:

```
sourceGap   = B.top(src) − A.bottom(src)
migratedGap = B.top(mig) − A.bottom(mig)
delta       = migratedGap − sourceGap        # flagged when |delta| ≥ threshold
```

**The adjacency filter (the make-or-break).** A gap only counts as a *spacing*
signal when the two anchors are **structurally adjacent** — nothing but
whitespace/margins between them. It is flagged `contentSpanning` (quarantined,
low confidence) when: an image/embed or other text run sits in the interval on
either side; OR the gap is **negative** (the anchors overlap vertically — they
are side-by-side flex/grid columns or two wrapped lines of one heading, not a
stacked gap). This is what separates a real margin bug from "a third-party
widget rendered taller than the source" and from a two-column zone.

**Noise controls.** Page **chrome** (global nav/header/footer) and **widget
internals** (a form's own field rhythm) are excluded as anchors — they differ
structurally between source and migrated and aren't page-layout signals.
Extend the exclusions per project via `excludeContexts`.
`sup` citation markers are excluded as endpoints (their gaps are superscript
positioning, not layout). Clusters whose delta **sign disagrees across
breakpoints** are down-ranked as likely content reflow, not a fixable margin.

**Output.** Under `spacing` in the report JSON: `stats`, `clusters` (structural,
clustered by landmark-to-landmark transition, sorted **top-to-bottom** so the
topmost issue — whose fix tends to cascade — is first), and `contentSpanning`
(the quarantined gaps). Console prints a `=== Spacing ===` section. Measured at
mobile (390) and desktop (1200) by default. The process exits non-zero when
high-confidence structural spacing clusters exist (so a future fix-loop / CI can
gate on both text-style and spacing).

**Config flags** (all optional): `spacing` (false to disable), `spacingThresholdPx`
(default 15), `spacingBreakpoints` (default `[390, 1200]`). `excludeContexts`
(shared with the style pass) extends the chrome exclusions.

### Series gate: text-style first, then spacing

Text-style and spacing run in **series, not parallel**. A spacing symptom can
have a text-style *root cause* (e.g. a heading's gap driven by a font-size or
font-family difference), so while any actionable (non-size) text-style mismatch
remains, the spacing pass is **HELD**: computed and printed for context, but
excluded from the actionable set, the stop-metric, and the exit code. The gate
opens automatically once non-size text-style mismatches reach 0 — then spacing
becomes actionable, top-to-bottom. The report carries `spacing.active` /
`spacing.heldForTextStyle`; the orchestrator's `plan` surfaces text-style first
and shows the held spacing count.

### Fix target auto-detection (templates AND singletons)

The validator reads each migrated page's rendered `template` / `theme` `<meta>`
and records a `fixTarget` in the report, so the fix-loop knows where CSS fixes
land — no per-project wiring:

| Page metadata | `fixTarget` | Fix lands in | Scope |
|---|---|---|---|
| `template` set | `template` | `templates/<t>/<t>.css` | `body.<t>` (all pages), per-page `body.<theme>` |
| only `theme` (singleton) | `theme` | `styles/themes.css` | `body.<theme>` |
| neither | `none` | — | report-only |

This is what lets **single pages / singletons benefit from the same loop**: with
no template, their fixes are scoped to `body.<theme>` in `styles/themes.css`.
A config may set `"importScript": null` to skip re-import for CSS-only projects
(a markup fix isn't applicable), or name a specific import script.

**Spacing-specific limitations.**
- **Anchor sparsity:** image-only / icon-only regions have no text anchor, so
  spacing there is invisible to this method (a future phase could add matched
  images as non-text anchors).
- **Multi-page vs single-page clusters:** a cluster spanning many pages is a
  *systemic* template spacing issue (fix once in template CSS); a single-page one
  is usually a per-page source-authoring quirk.
- **Uniform template rules can't satisfy an inconsistent source.** When the same
  transition has different source gaps per page, a single margin over-fits one
  page and regresses another — the loop's must-not-regress guard catches this and
  reverts (observed on the CTA→next-section gap).

## Known limitations

- **Pairing is content-based.** Identical short text in different roles (e.g. a
  nav label vs a heading both reading "Resources") can mis-pair; treat clusters
  whose two contexts differ wildly as suspect and confirm against the page.
- **Runs not present in the source** (injected forms, decoration artifacts)
  surface as `missing` and are not style-diffed.
- **Fix interactions:** a CSS fix for one cluster can shift another via
  specificity. Re-run after each fix.

## Attribution

Text extraction + matching algorithm adapted (clean-room) from
<https://github.com/iustinp/qa-tool> (`lib/visible-text.js`, `lib/text-audit.js`,
`lib/text-similarity.js`).
