# Get General Styling — Design System Extraction Skill

## Purpose

Perform an exhaustive extraction of the original site's design system BEFORE any page migration begins. This ensures that all migrated pages render against the correct visual foundation from the start, rather than against generic EDS boilerplate defaults.

**This skill is a PREREQUISITE for page migration. Run it first.**

## When to Use

- At the very start of any new site migration, before migrating any pages
- When the user says: "migrate", "import", "convert" a site/page — suggest running this first
- When the user explicitly asks to extract design, styling, or CSS from a source site
- When `styles/styles.css` still contains EDS boilerplate defaults

## Scope

This skill extracts and maps **site-wide defaults only** — the visual foundation shared across most pages:

- ✅ CSS custom properties / variables
- ✅ Color palette (backgrounds, text, links, accents, borders)
- ✅ Typography (font families, sizes, weights, line heights, letter spacing, @font-face)
- ✅ Spacing system (margins, paddings, gaps, section spacing)
- ✅ Breakpoints and media queries
- ✅ Layout and container widths
- ✅ Borders, shadows, border-radius
- ✅ Transitions and interactive states (hover, focus)
- ❌ Block-specific styling (handled during block variant creation)
- ❌ Navigation/header/footer styling (handled by dedicated skills)

## How this skill is organized

This file is the **orchestrator**. The detailed, step-by-step instructions for
each phase live in separate files under `phases/`. Work through the phases in
order. For each phase:

1. **Read the phase file** listed in the dispatch table below (use the Read tool
   on the given path) — it contains the exact tools, scripts, heuristics, output
   schema, and per-phase validation checklist.
2. Execute every step in that file.
3. Do not mark the phase complete until its own validation checklist passes.

Read one phase file at a time, as you reach it — do not pre-load all of them.
This keeps context focused on the phase in hand. Phases are sequential: later
phases consume the `migration-work/*.json` artifacts produced by earlier ones.

## Execution Checklist

Every phase below is MANDATORY. Do not skip any. Mark each complete only after extraction AND validation.

```
- [ ] Phase 0: Preflight (idempotency, token budget, page sampling)
- [ ] Phase 1: Collect raw CSS and computed styles
- [ ] Phase 2: Extract CSS custom properties
- [ ] Phase 3: Extract color palette
- [ ] Phase 4: Extract typography and @font-face
- [ ] Phase 5: Extract spacing system
- [ ] Phase 6: Extract breakpoints and media queries
- [ ] Phase 7: Extract layout and container widths
- [ ] Phase 8: Extract borders, shadows, and border-radius
- [ ] Phase 9: Extract transitions and interactive states
- [ ] Phase 10: Map to EDS custom properties
- [ ] Phase 11: Generate / reconcile styles.css, fonts.css, head.html
- [ ] Phase 12: Validate with preview + write completion signal
```

## Phase Dispatch Table

Read the corresponding file when you begin each phase.

| Phase | Purpose | Instructions file | Key artifact(s) produced |
|-------|---------|-------------------|--------------------------|
| 0  | Preflight: idempotency, token budget, page sampling | `phases/phase-00-preflight.md` | (decisions: fresh vs re-run, page set) |
| 1  | Collect raw CSS + computed styles | `phases/phase-01-collect.md` | `raw-css-corpus.txt`, `stylesheet-urls.json`, `computed-styles.json`, `live-css-variables.json`, `cjk-detection.json`, `design-reference.png` |
| 2  | Extract CSS custom properties | `phases/phase-02-custom-properties.md` | `extracted-variables.json` |
| 3  | Extract color palette (incl. hover states) | `phases/phase-03-colors.md` | `color-palette.json` |
| 4  | Typography, @font-face, responsive + variants | `phases/phase-04-typography.md` | `typography.json`, `typography-mobile.json` |
| 5  | Spacing system + live section measurement | `phases/phase-05-spacing.md` | `spacing.json` |
| 6  | Breakpoints and media queries | `phases/phase-06-breakpoints.md` | `breakpoints.json` |
| 7  | Layout and container widths (deep walk) | `phases/phase-07-layout.md` | `layout.json` |
| 8  | Borders, shadows, border-radius | `phases/phase-08-decoration.md` | `decoration.json` |
| 9  | Transitions and interactive states | `phases/phase-09-interactions.md` | `interactions.json` |
| 10 | Map to EDS custom properties | `phases/phase-10-map-eds.md` | (mapping applied in Phase 11) |
| 11 | Generate / reconcile output files | `phases/phase-11-generate.md` | `styles/styles.css`, `styles/fonts.css`, `head.html` |
| 12 | Validate with preview + completion signal | `phases/phase-12-validate.md` | `design-system-extracted.json` (completion signal) |

## Output Files Summary & Failure Conditions

The full list of output files and the conditions under which this skill has NOT
completed successfully are in **`phases/appendix-outputs-and-failures.md`**.
Read it before declaring the skill done, and check every failure condition.
