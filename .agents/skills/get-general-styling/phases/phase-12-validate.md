## Phase 12: Validate with Preview

### 12.1 Preview a page

If a page has already been migrated, navigate to it in the preview. If not, create a minimal test page with representative content (headings h1–h6, paragraphs, links, a button-style link) and preview that.

### 12.2 Screenshot comparison

Take a screenshot of the preview and compare side-by-side with the source site screenshot from Phase 1. Check:
- [ ] Background color matches
- [ ] Text color matches
- [ ] Font family is correct (or reasonable fallback)
- [ ] Heading sizes are proportionally correct
- [ ] Link color matches
- [ ] Overall spacing feels similar
- [ ] Content width is constrained similarly (not noticeably wider or narrower)
- [ ] Section vertical spacing matches (tight vs spaced)
- [ ] Content horizontal padding matches (content doesn't touch viewport edges differently)

### 12.3 Write completion signal

**Tool:** Write

Save to `migration-work/design-system-extracted.json`:

```json
{
  "status": "complete",
  "sourceUrl": "{source URL}",
  "sourceDomain": "{domain, e.g. www.americanhome.co.jp}",
  "timestamp": "{ISO timestamp}",
  "desktopBreakpoint": "{the CSS-ready breakpoint value from breakpoints.json edsMapping.desktopBreakpoint, e.g. '900px'}",
  "summary": {
    "cssVariablesDefined": 28,
    "fontsIdentified": ["Noto Sans JP"],
    "fontLoadingMethod": "typesquare-cdn",
    "breakpointsMapped": 4,
    "colorsExtracted": 12,
    "hasResponsiveTypography": true,
    "extractedValues": [
      "--background-color",
      "--text-color",
      "--link-color",
      "--link-hover-color",
      "--body-font-family",
      "--heading-font-family",
      "--body-font-size-m",
      "--heading-font-size-xxl",
      "--nav-height"
    ],
    "derivedValues": [
      { "property": "--body-font-size-s", "derivedFrom": "--body-font-size-m minus 2px" },
      { "property": "--body-font-size-xs", "derivedFrom": "--body-font-size-m minus 4px" }
    ],
    "defaultedValues": [
      { "property": "--breadcrumbs-height", "value": "34px", "reason": "EDS internal default — breadcrumbs not present on source site" },
      { "property": "--fixed-font-family", "value": "Menlo, Consolas, monospace", "reason": "No code elements found on sampled pages" }
    ]
  },
  "filesWritten": [
    "styles/styles.css",
    "styles/fonts.css",
    "head.html"
  ]
}
```

**This file is the completion signal.** Other skills check for its existence to know whether design extraction has already been done. Fill in all values from the actual extraction results — do not use the example values above.

**CRITICAL — Provenance fields:**

| Field | Purpose |
|-------|---------|
| `extractedValues` | CSS properties whose values came directly from the source site (computed styles, raw CSS, or Playwright measurement). These are **trustworthy**. |
| `derivedValues` | CSS properties calculated from extracted values (e.g., font-size-s = body font-size minus 2px). These are **approximate**. |
| `defaultedValues` | CSS properties that could NOT be extracted and fell back to EDS boilerplate or hardcoded defaults. Each entry must include the `reason` for the fallback. These are **unreliable** and should be reviewed manually. |

**Rules for classification:**
- A value is `extracted` ONLY if it came from `computed-styles.json`, `raw-css-corpus.txt`, `live-css-variables.json`, or Playwright hover/focus/resize measurement.
- A value is `derived` if it was calculated from extracted values using the heuristics in this skill (e.g., extrapolated heading sizes, darkened hover colors).
- A value is `defaulted` if neither extraction nor derivation produced it, and a hardcoded fallback was used. **An empty `defaultedValues` array means every single CSS property was extracted or derived — this should be verified, not assumed.**
- The `desktopBreakpoint` field at the top level is a convenience for other skills that need to know which breakpoint to use in `@media` rules (e.g., block CSS, header CSS). It MUST match `breakpoints.json → edsMapping.desktopBreakpoint`.

### 12.4 Report

Output a brief summary to the user of:
- Total CSS variables defined
- Fonts identified and how they're loaded
- Number of breakpoints mapped
- Any values that could not be extracted (with reason)

