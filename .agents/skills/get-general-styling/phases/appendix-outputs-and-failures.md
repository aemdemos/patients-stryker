## Output Files Summary

| File | Purpose |
|------|---------|
| `styles/styles.css` | Updated with all extracted design tokens |
| `styles/fonts.css` | @font-face declarations or @import statements |
| `head.html` | Updated if external font links needed |
| `migration-work/design-system-extracted.json` | **Completion signal** — other skills check this |
| `migration-work/cjk-detection.json` | CJK/Japanese detection result (script type, font services) |
| `migration-work/design-reference.png` | Visual reference screenshot |
| `migration-work/computed-styles.json` | Raw computed style data |
| `migration-work/raw-css-corpus.txt` | All CSS from source site |
| `migration-work/color-palette.json` | Categorized color palette |
| `migration-work/typography.json` | Font families, sizes, weights, responsive data |
| `migration-work/typography-mobile.json` | Mobile viewport heading sizes (only if responsive typography detected) |
| `migration-work/spacing.json` | Spacing scale, section spacing variance detail |
| `migration-work/breakpoints.json` | Media query breakpoints |
| `migration-work/layout.json` | Container widths (px or %), section layout pattern, nested containers, nav height |
| `migration-work/decoration.json` | Borders, shadows, radius |
| `migration-work/interactions.json` | Hover states, transitions |

## Failure Conditions

This skill has NOT completed successfully if:
- ❌ Any phase validation checklist has unchecked items
- ❌ Only one page was sampled (Phase 0.3 requires a representative set; single-page runs miss heading variants and section patterns)
- ❌ Responsive typography was NOT verified by a live mobile-viewport re-measure (grep alone is insufficient)
- ❌ A re-run regenerated `styles.css` wholesale instead of reconciling + producing a change list (Phase 0.1 / 11)
- ❌ The raw CSS corpus was fetched through tool results instead of written to disk, or truncated
- ❌ An `@font-face` was emitted pointing at a font file that is not present in `/fonts`
- ❌ A source-used font weight is missing from `fonts.css` without being recorded in `defaultedValues`
- ❌ `styles/styles.css` still contains boilerplate placeholder values for extracted properties
- ❌ Fonts were identified but no @font-face or @import was generated
- ❌ The preview shows obviously wrong colors or fonts
- ❌ No breakpoints were captured from a responsive source site
- ❌ `migration-work/design-system-extracted.json` was not written
- ❌ `design-system-extracted.json` has an empty `defaultedValues` array without explicit verification that every value was extracted
- ❌ `design-system-extracted.json` is missing the `desktopBreakpoint` field
- ❌ `@media` rules in `styles/styles.css` use a breakpoint value that doesn't match `breakpoints.json → edsMapping.desktopBreakpoint`
- ❌ Responsive typography was detected but `:root` uses desktop heading sizes instead of mobile sizes
- ❌ `typography-mobile.json` was not generated for a site with responsive typography
- ❌ CJK site detected but `--body-font-family` uses `Arial` or `Times New Roman` as fallback (will cause tofu characters)
- ❌ CJK site detected but font service `<script>` or `<link>` tag was not captured for `head.html`
