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

Template-agnostic — a new template only needs its page pairs:

```json
{
  "previewBase": "http://localhost:3000",
  "fingerprintFields": ["fontFamily","fontSize","fontWeight","fontStyle","color","textDecorationLine"],
  "pairs": [
    { "name": "vertebroplasty",
      "source":  "https://patients.stryker.com/us/en/ivs/treatments/vertebroplasty.html",
      "migrated": "/content/us/en/ivs/treatments/vertebroplasty" }
  ]
}
```

`migrated` may be a preview path (joined to `previewBase`) or a full URL.
`fingerprintFields` is optional; omit to use the defaults above.

## Output

`migration-work/importer/text-style-diff.json` (git-ignored working artifact)
plus a console summary. Each **cluster** carries:

- `key` — the normalized style delta, e.g.
  `color:rgb(76,125,122)→rgb(255,255,255) | fontFamily:URW→Futura`
- `pages` / `count` — where and how often it occurs (worst-first ordering)
- `samples` — example text, context hint, and both fingerprints

`pairingStats` reports match quality (`exact` / `substring` / `partial` /
`missing` / `countMismatch`) so you can judge whether the pairing is trustworthy
before acting on the clusters.

## How to act on clusters

Each cluster is one fix, applied where it belongs:

- **font-family / weight / the single gold accent** → usually authored emphasis
  markup in the import parsers/transformers (`<strong>`, `<em><strong>`), driven
  by the source's computed leaf — see the procedure-detail cleanup transformer's
  `normalizeEmphasis`.
- **font-size** (from source `em` / `fontsize-*` multipliers) and **non-accent
  colors** → cannot round-trip through markdown/markup; fix in **zone-scoped
  template CSS**.
- **citation reference links** (in `<sup>` or pointing at `#disclaimer`/`#fn-*`)
  → one global rule keyed on that invariant.

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

**Auto-tiering / scoping.** Each cluster's page set decides its scope,
using the per-page `body.pd-<slug>` class the importer stamps (`theme: pd-<slug>`):
- cluster on **all** config pages → template-wide (`body.procedure-detail`)
- cluster on a **subset** → an OR-list of those `body.pd-<slug>` classes
- cluster on **one** page → that single `body.pd-<slug>`
combined with the run's own stable selector (an `href`/`id` anchor, or a
block/section-class + tag). This is how unique per-page fixes live in the shared
template CSS without colliding: every rule names its own page + element scope, so
two pages' rules can't match the same element.

**What is applied vs left for humans.**
- Auto-applied: `color`, `font-family`, `font-weight`, `font-style`,
  `text-decoration` — the fields that encode "what the text is" and match the
  source reliably.
- `font-size` is applied **only** with `--include-size`, because on hand-edited
  sources it's frequently responsive (hero vw) or **inconsistent across pages**
  (e.g. the "Potential risks" link authored 17.5 / 19.5 / 21px) — auto-pinning it
  would make pages *worse* while satisfying the validator. These residuals are
  reported for human judgement.
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
