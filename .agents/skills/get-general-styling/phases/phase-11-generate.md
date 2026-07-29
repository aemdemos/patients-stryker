## Phase 11: Generate / Reconcile Output Files

**Branch on the Phase 0.1 result:**

- **Fresh run** → generate `styles/styles.css` from the template below.
- **Re-run** (prior site-specific `styles.css` already exists) → do NOT regenerate
  from the template. Instead **reconcile**: for each token/rule, compare the
  freshly-extracted value (Phases 1–9) against the current file and edit ONLY the
  differences. Produce an explicit change list (property, old → new, provenance).
  Rewriting wholesale here destroys prior hand-tuning and hides what changed —
  which is the whole point of a re-run.

### 11.1 Generate `styles/styles.css` (fresh run)

**CRITICAL:** Read the existing `styles/styles.css` BEFORE writing. The boilerplate has a specific structure that EDS depends on. You must preserve that structure and replace values — not rewrite from scratch.

**Step 1 — Read the boilerplate:**

**Tool:** Read `styles/styles.css`

**Step 2 — Read all extraction outputs:**

**Tool:** Read these files (all produced by earlier phases):
- `migration-work/color-palette.json` → colors for `:root`
- `migration-work/typography.json` → font families, sizes, weights, line heights
- `migration-work/spacing.json` → margins, paddings, section spacing
- `migration-work/breakpoints.json` → media query values
- `migration-work/layout.json` → container widths, nav height
- `migration-work/decoration.json` → border-radius, box-shadow, borders
- `migration-work/interactions.json` → hover states, transitions, focus styles
- `migration-work/extracted-variables.json` → any site-specific CSS variables

**Step 3 — Write the updated file.**

**Tool:** Write to `styles/styles.css`

Below is the **complete template**. Every `{PLACEHOLDER}` must be replaced with the actual extracted value from the corresponding JSON file. The source for each value is noted in comments.

```css
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* === Design tokens extracted from: {SOURCE_URL} === */
/* === Extraction date: {TIMESTAMP} === */

:root {
  /* colors — source: color-palette.json */
  --background-color: {color-palette.backgrounds.main};
  --light-color: {color-palette.backgrounds.light};
  --dark-color: {color-palette.backgrounds.dark};
  --text-color: {color-palette.text.primary};
  --link-color: {color-palette.links.default};
  --link-hover-color: {color-palette.links.hover};
  --overlay-background-color: {color-palette.backgrounds.light, with ~50% opacity if available, else same as --light-color};

  /* fonts — source: typography.json (+ typography.cjk if CJK site) */
  /* IMPORTANT: If typography.cjk.isCjk is true, use typography.cjk.fullBodyFontFamily instead of
     typography.body.fontFamily. This includes the web font + CJK system fallback chain.
     If NOT a CJK site, use typography.body.fontFamily and append the -fallback font name. */
  --body-font-family: {IF CJK: typography.cjk.fullBodyFontFamily — ELSE: typography.body.fontFamily, {body-font-name}-fallback, sans-serif};
  --heading-font-family: {IF CJK and sameAsBody: var(--body-font-family) — IF CJK and different: heading web font + CJK fallback chain — ELSE: typography.headings.fontFamily, {heading-font-name}-fallback, sans-serif};
  --fixed-font-family: {typography.fixed.fontFamily — or 'Menlo, Consolas, "Liberation Mono", monospace' if not detected};

  /* body sizes (mobile-first: these are mobile values) — source: typography.json */
  --body-font-size-m: {typography.body.fontSize};
  --body-font-size-s: {typography.body.fontSize minus ~2-3px, or from smaller text detected};
  --body-font-size-xs: {typography.body.fontSize minus ~4-5px, or from fine print detected};

  /* heading sizes (mobile-first) — source: typography.json */
  /*
   * If typography.responsive.hasResponsiveTypography is TRUE:
   *   Use typography.responsive.mobileSizes here (mobile values as base)
   *   Desktop overrides go in the @media block below
   *
   * If typography.responsive.hasResponsiveTypography is FALSE:
   *   Use typography.headings.sizes directly (single set of values)
   *   DELETE the @media block for heading size overrides
   */
  --heading-font-size-xxl: {IF responsive: typography.responsive.mobileSizes.h1.fontSize — ELSE: typography.headings.sizes.h1.fontSize};
  --heading-font-size-xl: {IF responsive: typography.responsive.mobileSizes.h2.fontSize — ELSE: typography.headings.sizes.h2.fontSize};
  --heading-font-size-l: {IF responsive: typography.responsive.mobileSizes.h3.fontSize — ELSE: typography.headings.sizes.h3.fontSize};
  --heading-font-size-m: {IF responsive: typography.responsive.mobileSizes.h4.fontSize — ELSE: typography.headings.sizes.h4.fontSize};
  --heading-font-size-s: {IF responsive: typography.responsive.mobileSizes.h5.fontSize — ELSE: typography.headings.sizes.h5.fontSize};
  --heading-font-size-xs: {IF responsive: typography.responsive.mobileSizes.h6.fontSize — ELSE: typography.headings.sizes.h6.fontSize};

  /* nav heights — source: layout.json */
  --nav-height: {layout.navHeight or layout.headerHeight — MUST be extracted from Phase 7.2};
  --breadcrumbs-height: 34px; /* EDS internal default — breadcrumbs are generated by EDS, not extracted from source. Record as "eds-default" provenance, not "extracted". Adjust later if breadcrumbs render at a different height. */
  --header-height: var(--nav-height);

  /* site-specific tokens — source: extracted-variables.json, color-palette.json, decoration.json, interactions.json */
  /* Only include these if values were found. Delete any line where the extraction returned null/none. */
  --brand-primary: {color-palette.brand.primary};
  --brand-secondary: {color-palette.brand.secondary};
  --border-color: {color-palette.borders.default};
  --border-radius: {decoration.borderRadius.small or the most common border-radius};
  --box-shadow: {decoration.boxShadow.subtle or 'none' if no shadows found};
  --section-spacing: {spacing.tokens.sectionPaddingVertical — use the mode from Step 5.1b; may be '0px' if sections are tightly stacked};
  --transition-duration: {interactions.transitions.duration};
  --transition-easing: {interactions.transitions.easing};
}

/* fallback fonts — source: typography.json */
/*
 * Generate a fallback @font-face for each custom web font used in --body-font-family
 * and --heading-font-family. Use size-adjust to match the web font's metrics.
 *
 * CHOOSING THE CORRECT SYSTEM FALLBACK:
 *
 * For LATIN (non-CJK) sites:
 *   - Sans-serif web fonts → src: local('Arial')
 *   - Serif web fonts → src: local('Times New Roman')
 *   - Monospace web fonts → src: local('Courier New')
 *
 * For JAPANESE sites (typography.cjk.scriptType === 'japanese'):
 *   - Sans-serif (gothic) → src: local('Hiragino Kaku Gothic ProN'), local('Yu Gothic Medium'), local('Meiryo')
 *   - Serif (mincho) → src: local('Hiragino Mincho ProN'), local('Yu Mincho')
 *   NOTE: The -fallback @font-face is LESS critical for CJK since the full system
 *   fallback chain is already in --body-font-family. But it still helps with CLS
 *   (Cumulative Layout Shift) if the web font loads late.
 *
 * For KOREAN sites: src: local('Apple SD Gothic Neo'), local('Malgun Gothic')
 * For CHINESE SIMPLIFIED: src: local('PingFang SC'), local('Microsoft YaHei')
 * For CHINESE TRADITIONAL: src: local('PingFang TC'), local('Microsoft JhengHei')
 *
 * If you cannot determine size-adjust, use 100% as default.
 * For CJK fonts, size-adjust is typically 95%-105% relative to the system CJK font.
 */
@font-face {
  font-family: {body-font-name}-fallback;
  size-adjust: {calculated percentage, e.g. 99.5%};
  src: local('{system fallback — see table above for correct font by script type}');
}

/* Only include a second fallback if heading font differs from body font */
@font-face {
  font-family: {heading-font-name}-fallback;
  size-adjust: {calculated percentage};
  src: local('{system fallback}');
}

/* Responsive adjustments — source: breakpoints.json, typography.json → responsive */
/*
 * CONDITIONAL: Only include this @media block if typography.responsive.hasResponsiveTypography is true.
 * If the site does NOT have responsive typography (same sizes at all breakpoints), DELETE this entire @media block.
 *
 * When included:
 * - The :root block above uses MOBILE values (from typography.responsive.mobileSizes)
 * - This @media block overrides with DESKTOP values (from typography.responsive.desktopSizes)
 * - The breakpoint value comes from breakpoints.edsMapping.desktopBreakpoint (never hardcoded)
 */
@media (width >= {breakpoints.edsMapping.desktopBreakpoint}) {
  :root {
    /* body sizes — desktop values from typography.responsive.desktopSizes */
    --body-font-size-m: {typography.responsive.desktopSizes.body.fontSize — only if different from mobile};
    --body-font-size-s: {desktop smaller text size};
    --body-font-size-xs: {desktop fine print size};

    /* heading sizes — desktop values from typography.responsive.desktopSizes */
    --heading-font-size-xxl: {typography.responsive.desktopSizes.h1.fontSize};
    --heading-font-size-xl: {typography.responsive.desktopSizes.h2.fontSize};
    --heading-font-size-l: {typography.responsive.desktopSizes.h3.fontSize};
    --heading-font-size-m: {typography.responsive.desktopSizes.h4.fontSize};
    --heading-font-size-s: {typography.responsive.desktopSizes.h5.fontSize};
    --heading-font-size-xs: {typography.responsive.desktopSizes.h6.fontSize};
  }
}

body {
  display: none;
  margin: 0;
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: var(--body-font-family);
  font-size: var(--body-font-size-m);
  line-height: {typography.body.lineHeight — CJK sites typically use 1.7-2.0; if extracted value is below 1.5 on a CJK site, verify against CJK-heavy paragraphs before using};
  letter-spacing: {typography.body.letterSpacing — omit this line if '0px' or 'normal'};
}

body.appear {
  display: block;
}

header {
  height: var(--header-height);
}

header .header,
footer .footer {
  visibility: hidden;
}

header .header[data-block-status="loaded"],
footer .footer[data-block-status="loaded"] {
  visibility: visible;
}

@media (width >= {breakpoints.edsMapping.desktopBreakpoint}) {
  body[data-breadcrumbs] {
    --header-height: calc(var(--nav-height) + var(--breadcrumbs-height));
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin-top: {spacing.headings.h2.marginTop — MUST be extracted; if not found, record as defaulted and use '0.8em'};
  margin-bottom: {spacing.headings.h2.marginBottom — MUST be extracted; if not found, record as defaulted and use '0.25em'};
  font-family: var(--heading-font-family);
  font-weight: {typography.headings.sizes.h2.fontWeight — MUST be extracted; if not found, record as defaulted and use '600'};
  line-height: {typography.headings.sizes.h2.lineHeight — MUST be extracted; if not found, record as defaulted and use '1.25'};
  scroll-margin: 40px;
}

h1 { font-size: var(--heading-font-size-xxl); }
h2 { font-size: var(--heading-font-size-xl); }
h3 { font-size: var(--heading-font-size-l); }
h4 { font-size: var(--heading-font-size-m); }
h5 { font-size: var(--heading-font-size-s); }
h6 { font-size: var(--heading-font-size-xs); }

/* Per-heading overrides — source: computed-styles.headings.h1-h6 */
/* ONLY include these if a specific heading level has a DIFFERENT font-weight, line-height,
   or margin than the shared rule above. Check each level against h2 (used as the shared default).
   If all levels match h2, DELETE this entire block. Common case: h1 is bolder (700) while h2-h6 are 600. */
h1 {
  font-weight: {headings.h1.font-weight — ONLY if different from shared rule above; otherwise omit};
  line-height: {headings.h1.line-height — ONLY if different; otherwise omit};
}
/* Repeat for h3-h6 only if they differ from the shared defaults. Delete any empty rule. */

p,
dl,
ol,
ul,
pre,
blockquote {
  margin-top: {spacing.paragraph.marginTop — MUST be extracted from computed-styles.text.p; if not found, record as defaulted};
  margin-bottom: {spacing.paragraph.marginBottom — MUST be extracted from computed-styles.text.p; if not found, record as defaulted};
}

code,
pre {
  font-size: var(--body-font-size-s);
}

/* inline code — source: computed-styles.codeElements.codeInline */
/* Only include this block if the source site styles inline <code> differently from surrounding text.
   If codeInline returned null or has no background-color, OMIT this entire block. */
code:not(pre code) {
  background-color: {codeElements.codeInline.background-color — omit block if transparent or not found};
  padding: {codeElements.codeInline padding values — e.g. '2px 4px'};
  border-radius: {codeElements.codeInline.border-radius — e.g. '3px'};
}

pre {
  padding: {codeElements.pre.padding-top — or '16px'};
  border-radius: {decoration.borderRadius.medium or '8px'};
  background-color: var(--light-color);
  overflow-x: auto;
  white-space: pre;
}

/* blockquote — source: computed-styles.text.blockquote */
/* Only include if blockquote has distinctive styling (border-left, italic, different color).
   If blockquote returned null, OMIT this entire block. */
blockquote {
  border-left: {blockquote.border-left-width} {blockquote.border-left-style} {blockquote.border-left-color — omit line if no left border};
  padding-left: {blockquote.padding-left — omit line if '0px'};
  font-style: {blockquote.font-style — omit line if 'normal'};
  color: {blockquote.color — omit line if same as body text color};
}

/* horizontal rule — source: computed-styles.hr */
/* Only include if hr was found on the page. If hr returned null, OMIT this entire block. */
hr {
  border: 0;
  border-top: {hr.border-top-width} {hr.border-top-style} {hr.border-top-color — e.g. '1px solid #ddd'};
  margin: {hr.margin-top} 0 {hr.margin-bottom} 0;
}

/* lists — source: computed-styles.lists */
/* Only include if list styling differs from browser defaults.
   Default padding-left is ~40px. Only set if different. */
ul, ol {
  padding-left: {lists.ul.padding-left — omit block if '40px' or default};
}

/* Only include li margin if the source site spaces list items apart */
li {
  margin-bottom: {text.li.margin-bottom — omit block entirely if '0px'};
}

/* tables — source: computed-styles.tableElements */
/* Only include if tables exist on the source site. If tableElements.table returned null, OMIT all table rules. */
table {
  border-collapse: {tableElements.table.border-collapse — usually 'collapse'};
  width: {tableElements.table.width — e.g. '100%'};
}

th, td {
  border: {tableElements.th.border-width} {tableElements.th.border-style} {tableElements.th.border-color};
  padding: {tableElements.th.padding-top} {tableElements.th.padding-right} {tableElements.th.padding-bottom} {tableElements.th.padding-left};
  text-align: {tableElements.td.text-align — usually 'left'; omit if 'left'};
  vertical-align: {tableElements.td.vertical-align — omit if 'middle' or default};
}

th {
  background-color: {tableElements.th.background-color — omit line if transparent};
  font-weight: {tableElements.th.font-weight — omit if same as body or '700' (default for th)};
}

/* figure/figcaption — source: computed-styles.figure */
/* Only include if figures exist on the source site. If figure.figure returned null, OMIT. */
figure {
  margin: {figure.figure.margin-* values — e.g. '1em 0'};
}

figcaption {
  font-size: {figure.figcaption.font-size — e.g. 'var(--body-font-size-s)' or a concrete value};
  color: {figure.figcaption.color — omit line if same as body text color};
}

main > div {
  margin: {spacing.tokens.sectionPaddingVertical — from extraction} {spacing.tokens.containerPaddingHorizontal — from extraction};
}
/* NOTE: The 'main > div' rule above is the EDS fallback for unsectioned content.
   The section rules below (main > .section) take precedence for sectioned pages. */

input,
textarea,
select,
button {
  font: inherit;
}

/* links — source: color-palette.json, interactions.json */
a:any-link {
  color: var(--link-color);
  text-decoration: {interactions.hoverStates.link.before.textDecoration — usually 'none'};
  overflow-wrap: break-word;
  transition: color var(--transition-duration, 0.2s) var(--transition-easing, ease);
}

a:hover {
  color: var(--link-hover-color);
  text-decoration: {interactions.hoverStates.link.after.textDecoration — usually 'underline'};
}

/* buttons — source: color-palette.json, decoration.json, interactions.json */
/*
 * CONDITIONAL: Use ONE of the two blocks below depending on whether
 * color-palette.buttons is null or has values.
 */

/* === IF color-palette.buttons is NOT null (real buttons detected) === */
a.button:any-link,
button {
  box-sizing: border-box;
  display: inline-block;
  max-width: 100%;
  margin: 12px 0;
  border: {decoration.borders.default — e.g. '2px solid transparent'};
  border-radius: {decoration.borderRadius for buttons — e.g. '2.4em'};
  padding: 0.5em 1.2em;
  font-family: var(--body-font-family);
  font-style: normal;
  font-weight: {typography.body.fontWeight for buttons — usually '500' or '600'};
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  background-color: {color-palette.buttons.primaryBg};
  color: {color-palette.buttons.primaryText};
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--transition-duration, 0.2s) var(--transition-easing, ease);
}

a.button:hover,
a.button:focus,
button:hover,
button:focus {
  background-color: {color-palette.buttons.primaryHoverBg};
  cursor: pointer;
}

button:disabled,
button:disabled:hover {
  background-color: var(--light-color);
  cursor: unset;
}

a.button.secondary,
button.secondary {
  background-color: unset;
  border: 2px solid currentcolor;
  color: var(--text-color);
}

/* === IF color-palette.buttons IS null (no real buttons detected) === */
/* a.button:any-link stays link-like — no border, background, or border-radius */
a.button:any-link {
  color: var(--link-color);
  font-weight: 500;
  text-decoration: none;
}

a.button:hover,
a.button:focus {
  color: var(--link-hover-color);
  text-decoration: {interactions.hoverStates.link.after.textDecoration — usually 'underline'};
}

/* native button elements get minimal styling */
button {
  font: inherit;
  border: none;
  background-color: transparent;
  color: var(--link-color);
  cursor: pointer;
}

button:hover,
button:focus {
  color: var(--link-hover-color);
}

button:disabled,
button:disabled:hover {
  color: var(--light-color);
  cursor: unset;
}

/* === END conditional === */

main img {
  max-width: 100%;
  width: auto;
  height: auto;
  border-radius: {decoration.borderRadius for images — omit this line if '0px' or not found};
}

.icon {
  display: inline-block;
  height: 24px;
  width: 24px;
}

.icon img {
  height: 100%;
  width: 100%;
}

/* sections — source: spacing.json, layout.json */
/*
 * CONDITIONAL: Use ONE of the two blocks below depending on the value of
 * layout.sectionLayout ("full-bleed" vs "constrained") and layout.contentMaxWidthType.
 *
 * Read layout.json and spacing.json to determine which block to use.
 */

/* === IF layout.sectionLayout is "full-bleed" (sections span viewport, inner div constrains) === */
/* This is common on CMS sites where outer section wrappers are full-width and an inner
   container handles the max-width constraint. */
main > .section {
  margin: {spacing.tokens.sectionPaddingVertical — MUST be extracted from Phase 5.1b live section measurement} 0;
}

main > .section > div {
  max-width: {layout.contentMaxWidth — MUST be extracted from Phase 7; use the raw value e.g. '85%' or '1200px'};
  margin: auto;
  padding: 0 {spacing.tokens.containerPaddingHorizontal — MUST be extracted from Phase 7 innermost container};
}

main > .section:first-of-type {
  margin-top: 0;
}

/*
 * Desktop padding override: Only include this @media block if layout.desktopContainerPadding
 * is NOT null (i.e., there is CSS evidence for a different padding at desktop).
 * If layout.desktopContainerPadding is null, DELETE this entire @media block.
 * Do NOT fabricate a 32px desktop override — use only values backed by source CSS evidence.
 */
@media (width >= {breakpoints.edsMapping.desktopBreakpoint}) {
  main > .section > div {
    padding: 0 {layout.desktopContainerPadding.left — ONLY if not null};
  }
}

/*
 * Narrow section variant: Only include if layout.nestedContainers is true.
 * This replicates the double-nested container pattern from the source site.
 * Sections with Section Metadata style "narrow" get a tighter inner width.
 * If layout.nestedContainers is false, DELETE this entire block.
 */
main > .section.narrow > div {
  max-width: {layout.nestedEffectiveMaxWidth — e.g. '72.25%' — computed in Phase 7.3.3};
}

/* section metadata */
main .section.light,
main .section.highlight {
  background-color: var(--light-color);
  margin: 0;
  padding: {spacing.tokens.sectionPaddingVertical — from extraction; use same value as section margin above} 0;
}

/* === IF layout.sectionLayout is "constrained" (sections themselves have max-width/padding) === */
/* Use this block when the source site constrains content at the section level, not an inner div. */
main > .section {
  max-width: {layout.contentMaxWidth — MUST be extracted from Phase 7};
  margin: {spacing.tokens.sectionPaddingVertical — MUST be extracted from Phase 5.1b} auto;
  padding: 0 {spacing.tokens.containerPaddingHorizontal — MUST be extracted from Phase 7};
}

main > .section > div {
  max-width: unset;
  margin: 0;
  padding: 0;
}

main > .section:first-of-type {
  margin-top: 0;
}

/* Desktop padding override — same rule as full-bleed: only if desktopContainerPadding is not null */
@media (width >= {breakpoints.edsMapping.desktopBreakpoint}) {
  main > .section {
    padding: 0 {layout.desktopContainerPadding.left — ONLY if not null};
  }
}

/*
 * Narrow section variant (constrained mode): Only include if layout.nestedContainers is true.
 * In constrained mode, the section itself constrains — so narrow overrides the section max-width.
 * If layout.nestedContainers is false, DELETE this entire block.
 */
main > .section.narrow {
  max-width: {layout.nestedEffectiveMaxWidth — e.g. '72.25%' or '1015px'};
}

/* section metadata */
main .section.light,
main .section.highlight {
  background-color: var(--light-color);
  margin: 0 auto;
  padding: {spacing.tokens.sectionPaddingVertical — from extraction} {spacing.tokens.containerPaddingHorizontal — from extraction};
}

/* === END conditional === */

/* focus styles — source: interactions.json */
/* Only include if the source site has custom focus styles. Delete if using browser defaults. */
:focus-visible {
  outline: {interactions.focusStyles.outline};
  outline-offset: {interactions.focusStyles.outlineOffset};
}
```

**How to use this template:**

1. For each `{placeholder}`, look up the value in the named JSON file
2. **CRITICAL — Provenance tracking:** As you resolve each placeholder, classify it as one of:
   - **`extracted`** — value came directly from computed styles, raw CSS, or Playwright measurement of the source site
   - **`derived`** — value was calculated from extracted values (e.g., body-font-size-s = body-font-size minus 2px)
   - **`defaulted`** — value could not be extracted and falls back to an EDS boilerplate or hardcoded default

   **Build a running list of defaulted values** as you work. Every defaulted value MUST be recorded in `migration-work/design-system-extracted.json` → `summary.defaultedValues` (see Phase 12.3). This is how future sessions know which values are real and which are placeholders.
3. If a comment says "omit this line if...", delete the entire CSS property line when the condition is met
4. If the source site has NO responsive typography (same sizes at all breakpoints), delete the `@media` block that adjusts `:root` heading sizes
5. Delete any site-specific `--brand-*` or `--border-*` or `--transition-*` variables that were not actually found during extraction — do not leave placeholders in the final output
6. **NEVER silently substitute a boilerplate default for a value that should have been extracted.** If a core value (colors, fonts, breakpoints, body typography) cannot be extracted, this is an extraction failure — investigate why before falling back.

**Common pitfall:** Do not leave any `{placeholder}` strings in the final file. Every value must be a real CSS value. If you cannot determine a value, first try to extract it from a different page on the source site. Only use a default as a last resort, and ALWAYS record it in the `defaultedValues` list.

### 11.2 Generate `styles/fonts.css`

If @font-face declarations were found in Phase 4, write them to `styles/fonts.css`. This file handles the actual web font loading — separate from the fallback `@font-face` entries in `styles.css` which only provide size-adjusted system font fallbacks.

**Template for self-hosted fonts:**

```css
/* Fonts extracted from: {SOURCE_URL} */
/* Source: typography.json → fontFaces array */

/* For each entry in typography.fontFaces, generate one @font-face block: */
@font-face {
  font-family: '{typography.fontFaces[n].family}';
  src: url('{typography.fontFaces[n].src}') format('{format: woff2, woff, etc.}');
  font-weight: {typography.fontFaces[n].weight};
  font-style: {typography.fontFaces[n].style};
  font-display: {typography.fontFaces[n].display — default to 'swap' if not specified};
  unicode-range: {typography.fontFaces[n].unicodeRange — only include if present, critical for CJK subsetted fonts};
}
```

**Template for CDN fonts (Google Fonts):**

```css
/* Fonts loaded from Google Fonts CDN */
@import url('https://fonts.googleapis.com/css2?family={font-name}:wght@{weights}&display=swap');
```

**For TypeSquare, FONTPLUS, Adobe Fonts (Typekit):** These services load via `<script>` or `<link>` tags in `<head>`, NOT via CSS `@import`. In this case:
- Leave `styles/fonts.css` empty or with a comment noting the service
- The actual loading happens in `head.html` (see 11.3)

### 11.3 Update `head.html` (if needed)

Read the existing `head.html` first. If external font services require `<link>` or `<script>` tags, add them.

**Tool:** Read `head.html`

Then add the font service tags. Examples:

```html
<!-- TypeSquare -->
<script src="https://typesquare.com/3/tsst/script/{PROJECT_ID}.js" charset="utf-8"></script>

<!-- FONTPLUS -->
<script src="https://webfont.fontplus.jp/accessor/script/face.js?{PARAMS}" charset="utf-8"></script>

<!-- Adobe Fonts (Typekit) -->
<link rel="stylesheet" href="https://use.typekit.net/{KIT_ID}.css">

<!-- Google Fonts (alternative to @import in fonts.css) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={font}&display=swap" rel="stylesheet">
```

**Also add `fonts.css` link if it has content:**

```html
<link rel="stylesheet" href="/styles/fonts.css">
```

### Validation

- [ ] `styles/styles.css` has been updated — NO `{placeholder}` strings remain in the file
- [ ] `:root` block contains all standard EDS variables with site-specific values
- [ ] Every `{placeholder}` was resolved to an actual CSS value or the EDS boilerplate default was kept
- [ ] `--body-font-family` is not `roboto` (unless the source site actually uses Roboto)
- [ ] `--heading-font-family` is not `roboto-condensed` (unless the source site actually uses Roboto Condensed)
- [ ] `--link-color` and `--link-hover-color` reflect the source site, not EDS blue defaults
- [ ] `--text-color` and `--background-color` reflect the source site
- [ ] Body `line-height` is from the source site (not the boilerplate `1.6` unless that matches)
- [ ] Heading `font-weight` is from the source site
- [ ] Heading/paragraph margins are from the source site
- [ ] Link hover `text-decoration` matches the source site behavior
- [ ] Button styles reflect the source site (border-radius, colors, hover state)
- [ ] Section max-width matches the source site's content container width (percentage or pixel, as extracted in layout.json)
- [ ] If `layout.contentMaxWidthType` is `"percentage"` → the CSS uses the percentage value (e.g., `85%`), not a pixel approximation
- [ ] Section margin reflects `spacing.tokens.sectionPaddingVertical` — if `0px`, sections are tightly stacked (not `40px` by default)
- [ ] Container padding matches the innermost constraining container (Phase 7), not a generic fallback
- [ ] Desktop padding `@media` block is ABSENT if `layout.desktopContainerPadding` is null (no fabricated `32px`)
- [ ] Correct section layout conditional used (`full-bleed` vs `constrained`) based on `layout.sectionLayout`
- [ ] Responsive `@media` block uses the source site's breakpoint (or is deleted if not responsive)
- [ ] Fallback `@font-face` entries use the correct system font for the font category
- [ ] `styles/fonts.css` created with @font-face or @import (or documented as CDN-loaded in head.html)
- [ ] `head.html` updated with font service tags if applicable
- [ ] No EDS boilerplate default values remain for properties where an extracted value was available
- [ ] **Provenance tracking:** Every CSS property that used a fallback/default has been added to the running `defaultedValues` list (for Phase 12.3)
- [ ] **Provenance tracking:** Verify the `defaultedValues` list is accurate — an empty list means every value was extracted, which should be confirmed, not assumed
- [ ] **Responsive typography:** If `typography.responsive.hasResponsiveTypography` is true, `:root` uses mobile sizes and `@media` block uses desktop sizes
- [ ] **Responsive typography:** If false, `@media` block for heading sizes is DELETED (not left with duplicate values)
- [ ] **Base elements:** Per-heading font-weight overrides included if h1 differs from h2-h6
- [ ] **Base elements:** Blockquote styled (border-left, padding-left, color) if blockquote was found on the source site
- [ ] **Base elements:** Inline `code` background/padding/radius set if the source site styles it
- [ ] **Base elements:** `hr` styled if horizontal rules were found on the source site
- [ ] **Base elements:** Table `th`/`td` borders and padding set if tables were found
- [ ] **Base elements:** Any base element block for a null/missing element type was OMITTED (not left with placeholders)
- [ ] **Base elements:** No rule was added for an element whose styles are identical to the inherited body defaults

### 11.4 Commonly Missed Items — Pre-flight Sweep

After writing `styles/styles.css`, run this sweep to catch items that are frequently overlooked. For each item, check the raw CSS corpus and computed styles. If found, add the corresponding CSS to `styles/styles.css`.

**Step 1 — Scan raw CSS for commonly missed patterns.**

Run these Grep searches against `migration-work/raw-css-corpus.txt`:

**Smooth scrolling:**
```
pattern: scroll-behavior\s*:\s*smooth
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 5
```
If found → add `html { scroll-behavior: smooth; }` to `styles/styles.css`

**Font smoothing / antialiasing:**
```
pattern: -webkit-font-smoothing|text-rendering|font-smooth|-moz-osx-font-smoothing
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 10
```
Also check `computed-styles.json → globals.webkitFontSmoothing` and `globals.textRendering`.
If the site uses antialiasing → add to body rule:
```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* only if textRendering is not 'auto': */
  text-rendering: optimizeLegibility;
}
```

**Box-sizing reset:**
```
pattern: box-sizing\s*:\s*border-box
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 10
```
If found on `*` or `html` → add at the top of `styles/styles.css` (before `:root`):
```css
*, *::before, *::after {
  box-sizing: border-box;
}
```
Note: The EDS boilerplate does NOT include a global box-sizing reset. Many modern sites do. If the source site uses it, add it — otherwise block layout calculations may differ.

**Prefers-reduced-motion:**
```
pattern: prefers-reduced-motion
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 5
head_limit: 10
```
If found → add at the end of `styles/styles.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Prefers-color-scheme (dark mode):**
```
pattern: prefers-color-scheme
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 15
head_limit: 30
```
If found → note the dark mode color overrides, but do NOT add them to `styles/styles.css` yet. Document in `migration-work/dark-mode-notes.txt` for future implementation. Dark mode is complex and should be a separate task.

**::placeholder styling:**
```
pattern: ::placeholder|::-webkit-input-placeholder|::-moz-placeholder
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 3
head_limit: 10
```
Also check `computed-styles.json → globals.placeholder`.
If the site styles placeholders → add:
```css
::placeholder {
  color: {placeholder color from extraction};
  opacity: {placeholder opacity, usually 1};
}
```

**Custom scrollbar:**
```
pattern: ::-webkit-scrollbar
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 5
head_limit: 15
```
If found → note for awareness but do NOT add custom scrollbar CSS by default (it's browser-specific and can cause issues). Document in a comment in `styles/styles.css` if the source site uses it.

**Text-wrap: balance for headings:**
```
pattern: text-wrap\s*:\s*balance
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 5
```
If found on headings → add to the shared heading rule:
```css
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}
```

**Link underline fine-tuning:**
Check `computed-styles.json → globals.linkUnderlineOffset` and `globals.linkDecorationThickness`.
If the source site uses `text-underline-offset` or `text-decoration-thickness` with non-default values → add to the `a:any-link` or `a:hover` rule:
```css
a:hover {
  text-underline-offset: {globals.linkUnderlineOffset — omit if 'auto'};
  text-decoration-thickness: {globals.linkDecorationThickness — omit if 'auto'};
}
```

**::selection styling:**
Check `computed-styles.json → selection`.
If the selection background-color is NOT the browser default (usually blue/`#0078d7`) → add:
```css
::selection {
  background-color: {selection.background-color};
  color: {selection.color};
}
```

**Accent-color for form elements:**
Check `computed-styles.json → globals.accentColor`.
If the site sets a custom `accent-color` (not `auto`) → add to body or `:root`:
```css
:root {
  accent-color: {globals.accentColor};
}
```

**Sticky/fixed header:**
Check `computed-styles.json → globals.headerPosition`.
If `sticky` or `fixed` → note for awareness (header styling is handled by a dedicated skill), but ensure `--nav-height` is accurate since sticky headers affect page layout.

**Step 2 — After scanning, update `styles/styles.css` with any findings.**

Use the Edit tool to add the relevant CSS rules to the appropriate locations in the file:
- Global resets (`box-sizing`) go at the very top, before `:root`
- Body-level properties (`font-smoothing`, `text-rendering`) go in the `body` rule
- Element-level properties (`::selection`, `::placeholder`, heading `text-wrap`) go after the base element rules
- Media queries (`prefers-reduced-motion`) go at the very end of the file

### 11.4 Validation

- [ ] Smooth scrolling: checked raw CSS, added if found
- [ ] Font smoothing: checked computed + raw, added if used
- [ ] Box-sizing reset: checked raw CSS, added if `* { box-sizing: border-box }` was found
- [ ] Prefers-reduced-motion: checked raw CSS, added if found
- [ ] Dark mode: checked raw CSS, documented in notes if found (not added to styles.css)
- [ ] Placeholder styling: checked computed + raw, added if custom
- [ ] Custom scrollbar: checked raw CSS, documented in comment if found
- [ ] Text-wrap balance: checked raw CSS, added to headings if found
- [ ] Link underline offset/thickness: checked computed, added if non-default
- [ ] Selection styling: checked computed, added if non-default
- [ ] Accent-color: checked computed, added if non-auto
- [ ] Sticky header: checked computed, noted for nav-height accuracy

