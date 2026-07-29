## Phase 4: Extract Typography and @font-face

> **Heading VARIANTS are real.** A single heading level often renders differently
> in different contexts — e.g. an `h2` may be a bold display font with an
> underline rule in a section header, but a light serif when used as a page
> subheading; an `h4` may be body-weight normally but a distinct display font
> inside an FAQ accordion. Sample across the pages chosen in Phase 0.3. When a
> level has variants, record ALL of them in `typography.json` (a
> `fontFamiliesByLevel`/`variants` note), pick the **most common** as the base
> rule, and flag the others so they can be handled as block/section variants
> during page migration. Do not average or silently pick one.

### 4.1 Font families

From `computed-styles.json`, extract `font-family` for:
- `body` → maps to `--body-font-family`
- `h1`–`h6` → maps to `--heading-font-family`
- `code, pre` → maps to `--fixed-font-family`

#### Heuristic: "Same as body" test for heading font

Compare `computed-styles.headings.h2.font-family` with `computed-styles.body.font-family`:

1. **Exact match** (same string after trimming) → `sameAsBody: true`, set `--heading-font-family: var(--body-font-family)`.
2. **First font name matches** (e.g., body is `'Noto Sans JP', sans-serif` and h2 is `'Noto Sans JP', 'Hiragino Kaku Gothic', sans-serif`) → `sameAsBody: true`. Fallback differences don't matter.
3. **Different first font name** → `sameAsBody: false`, set `--heading-font-family` to the heading font stack.

Use h2 as the representative heading (most common heading level on most pages). If h1 uses a different font from h2-h6, note it as a per-level override, not the shared heading font.

#### Heuristic: Fixed font family

1. Check `computed-styles.codeElements.codeInline.font-family` and `computed-styles.codeElements.pre.font-family`.
2. If found → use the extracted value.
3. If `code` and `pre` elements don't exist on the page → set `--fixed-font-family` to `'Menlo, Consolas, "Liberation Mono", monospace'` (safe default).
4. Mark as `"detected": false` in the JSON if no code elements were sampled.

### 4.2 Font sizes

From computed styles, extract `font-size` for:
- `body` → maps to `--body-font-size-m`
- `h1` → maps to `--heading-font-size-xxl`
- `h2` → maps to `--heading-font-size-xl`
- `h3` → maps to `--heading-font-size-l`
- `h4` → maps to `--heading-font-size-m`
- `h5` → maps to `--heading-font-size-s`
- `h6` → maps to `--heading-font-size-xs`

#### Heuristic: Deriving body-font-size-s and body-font-size-xs

These are NOT separate elements — they're size tiers for body text. Derive them as follows:

1. **Check `computed-styles.text.small.font-size`** — if `<small>` exists and is smaller than body, use it for `--body-font-size-s`.
2. **Check `computed-styles.figure.figcaption.font-size`** — captions are often `body-font-size-s`.
3. **Check `computed-styles.footer.font-size`** (via the footer's font-size, if available from computed-styles) — footer text is often smaller.
4. **If none found**, derive by subtracting from body font-size:
   - `--body-font-size-s` = body font-size minus 2px (e.g., body=16px → s=14px)
   - `--body-font-size-xs` = body font-size minus 4px (e.g., body=16px → xs=12px)
5. **If the site uses rem/em**, convert to px using body font-size as reference, then back to the same unit.

#### Heuristic: Missing heading levels

If some heading levels (h4, h5, h6) are not found on the sampled page:

1. Calculate the **scale ratio** between known heading levels. Example: if h1=32px, h2=28px, h3=24px → the scale is approximately -4px per level.
2. Extrapolate missing levels using the same ratio.
3. **Floor:** No heading should be smaller than `--body-font-size-m`. If extrapolation yields a heading smaller than body text, use body text size as the minimum.
4. Mark extrapolated sizes as `"estimated": true` in the JSON.

### 4.3 Font weights and line heights

Extract `font-weight` and `line-height` for body and each heading level.

#### Heuristic: Shared heading weight vs per-level overrides

1. Check weights for all available headings (h1-h6).
2. If **all heading weights are the same** (e.g., all 700) → use a single shared value in the `h1,h2,h3,h4,h5,h6` rule.
3. If **h1 differs from h2-h6** (common: h1=700, h2-h6=600) → use h2 weight as the shared value, add an `h1` override.
4. If **weights vary significantly** across levels → use the most common weight as shared, add overrides for exceptions.

#### Heuristic: Line-height interpretation

Computed `line-height` returns in pixels (e.g., `"25.6px"`). Convert to a unitless ratio:

```
unitless-line-height = parsed line-height px / parsed font-size px
```

Example: line-height `25.6px` with font-size `16px` → `25.6 / 16 = 1.6`.

Use the unitless value in the output (better for scaling). Round to 2 decimal places.

### 4.3b Detect responsive typography (mobile vs desktop heading sizes)

**This step is NOT optional and NOT secondary.** In practice it is the single
most commonly missed thing in the whole skill, and getting it wrong means every
migrated page renders headings at the wrong size on mobile. The **authoritative
signal is a live re-measure at a mobile viewport** — the grep below is only a
cheap pre-check. Always do Step 2 (resize + re-measure) unless the grep proves
there are zero heading/font-size rules in any media query.

The computed styles from Phase 1.4 were captured at whatever viewport width the browser was at (typically desktop). If the source site uses responsive typography (different heading sizes at different breakpoints), the `:root` block needs **mobile values** as the base, with desktop overrides in a `@media` block.

**Step 1 — Pre-check the corpus for responsive heading rules.**

**Tool:** Grep — search the raw CSS corpus for heading-related rules inside media queries:

```
pattern: @media[^{]*\{[^}]*h[1-6]
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 5
head_limit: 30
multiline: true
```

Also search for font-size changes in media queries:

```
pattern: @media.*\{[\s\S]*?font-size
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 20
multiline: true
```

If NO heading-related rules appear inside media queries → the site does NOT use responsive typography. Skip to 4.4. In the CSS template, use the extracted values as-is and DELETE the `@media` block for heading size overrides.

**Step 2 — If responsive typography IS detected, resize to mobile and re-measure.**

**Tool:** `browser_resize`
```
width: 375
height: 812
```

Wait for the layout to reflow:

**Tool:** `browser_wait_for`
```
time: 2
```

**Tool:** `browser_evaluate`

```js
() => {
  const TYPO = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing'];
  const get = (sel, props) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = { selector: sel };
    props.forEach(p => { r[p] = cs.getPropertyValue(p).trim(); });
    return r;
  };

  return JSON.stringify({
    viewportWidth: window.innerWidth,
    body: get('body', TYPO),
    h1: get('h1', TYPO),
    h2: get('h2', TYPO),
    h3: get('h3', TYPO),
    h4: get('h4', TYPO),
    h5: get('h5', TYPO),
    h6: get('h6', TYPO),
    p: get('p', TYPO),
  }, null, 2);
}
```

Save the result to `migration-work/typography-mobile.json` using the Write tool.

**Step 3 — Restore desktop viewport.**

**Tool:** `browser_resize`
```
width: 1440
height: 900
```

**Step 4 — Compare mobile vs desktop values.**

Read both `migration-work/computed-styles.json` (desktop) and `migration-work/typography-mobile.json` (mobile). For each heading level:
- If the mobile font-size differs from the desktop font-size → the site HAS responsive typography
- Record which values change and which stay the same

**Step 5 — Update typography.json.**

Add a `responsive` block to `migration-work/typography.json`:

```json
{
  "responsive": {
    "hasResponsiveTypography": true,
    "mobileViewportWidth": "375px",
    "mobileSizes": {
      "body": { "fontSize": "14px" },
      "h1": { "fontSize": "24px" },
      "h2": { "fontSize": "20px" },
      "h3": { "fontSize": "18px" },
      "h4": { "fontSize": "16px" },
      "h5": { "fontSize": "15px" },
      "h6": { "fontSize": "14px" }
    },
    "desktopSizes": {
      "body": { "fontSize": "16px" },
      "h1": { "fontSize": "32px" },
      "h2": { "fontSize": "28px" },
      "h3": { "fontSize": "24px" },
      "h4": { "fontSize": "20px" },
      "h5": { "fontSize": "18px" },
      "h6": { "fontSize": "16px" }
    }
  }
}
```

If `hasResponsiveTypography` is `true`:
- The `:root` block in `styles/styles.css` should use the **mobile** heading sizes
- The `@media (width >= {desktopBreakpoint})` block should override with **desktop** heading sizes
- Body font-size should also use mobile value in `:root` and desktop value in `@media`, if they differ

If `hasResponsiveTypography` is `false`:
- Use the extracted values directly in `:root`
- DELETE the `@media` block for heading size overrides entirely

### 4.4 @font-face declarations

**Tool:** Grep — search for @font-face blocks:

```
pattern: @font-face\s*\{
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 12
head_limit: 50
```

This captures each `@font-face` block plus up to 12 lines of its contents (font-family, src, weight, style, display, unicode-range).

For each `@font-face` found, record:
- `font-family` name (the string inside quotes)
- `src` URLs (woff2, woff, ttf, otf formats)
- `font-weight` (400, 700, etc.)
- `font-display` (swap, block, auto, etc.)
- `font-style` (normal, italic)
- `unicode-range` (critical for CJK/Japanese subsetted fonts)

**Capture EVERY weight/style as its own face — do not collapse a family to one
entry.** A family commonly ships 400 and 700 (and sometimes italics) as separate
`@font-face` blocks. Then cross-check what the design actually USES: if any
element's computed `font-weight` is bold (600/700) in a given family, that family
needs a bold face.

**Weight-coverage check (do this, and carry it into Phase 11):** compare the set
of `{family, weight}` the source declares against what the generated
`styles/fonts.css` provides. If the source uses a weight that fonts.css lacks
(e.g. source uses `HumanistSlab @700` but only a 400 file is committed), you have
two honest options — pick one and record it in `defaultedValues`:
  1. add the missing face IF the font file is actually available, or
  2. deliberately remap that bold text to another available bold family and
     document it as a design deviation.
Never emit an `@font-face` pointing at a file that isn't in `/fonts`.

### 4.5 Detect external font service references

**Tool:** Read `migration-work/stylesheet-urls.json` and check the `fontLinks` array from Phase 1.2.

Also search the raw CSS and HTML for font service URLs:

**Tool:** Grep

```
pattern: fonts\.googleapis|use\.typekit|typesquare|webfont\.fontplus|fonts\.adobe
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 10
```

And check if any font service scripts are loaded:

**Tool:** `browser_evaluate`

```js
() => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const fontScripts = scripts.filter(s =>
    s.src.match(/typekit|typesquare|fontplus|fonts\.googleapis|webfont/i)
  ).map(s => s.src);

  const fontLinks = Array.from(document.querySelectorAll('link[href*="font"], link[href*="typekit"], link[href*="typesquare"]'))
    .map(l => ({ rel: l.rel, href: l.href }));

  return JSON.stringify({ fontScripts, fontLinks }, null, 2);
}
```

### 4.6 CJK / Japanese font considerations

**Read `migration-work/cjk-detection.json`** from Phase 1.1b. If `scriptType` is `japanese`, `korean`, `chinese`, or `cjk-unspecified`, the following special rules apply:

#### 4.6.1 System font fallback chains for CJK

CJK sites MUST NOT use `Arial` or `Times New Roman` as the system fallback — those fonts lack CJK glyphs and will cause tofu (□□□) characters. Use the correct platform-native CJK fonts:

**Japanese (sans-serif) — use this order:**
```
'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic Medium', 'Yu Gothic', 'Meiryo', sans-serif
```

**Japanese (serif/mincho) — use this order:**
```
'Hiragino Mincho ProN', 'Yu Mincho', 'MS PMincho', serif
```

**Korean (sans-serif):**
```
'Apple SD Gothic Neo', 'Malgun Gothic', 'NanumGothic', sans-serif
```

**Chinese Simplified (sans-serif):**
```
'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif
```

**Chinese Traditional (sans-serif):**
```
'PingFang TC', 'Microsoft JhengHei', sans-serif
```

When building `--body-font-family` and `--heading-font-family`, append the correct CJK system fallback chain AFTER the web font name. Example for a Japanese site using Noto Sans JP via TypeSquare:

```css
--body-font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic Medium', 'Yu Gothic', 'Meiryo', sans-serif;
```

#### 4.6.2 Line-height expectations for CJK

CJK characters are taller and denser than Latin. If the computed `line-height` for body text is:
- **Below 1.5** — flag as potentially too tight for CJK. The extracted value may come from a Latin-only section. Look for CJK-heavy paragraphs and re-measure
- **1.5–1.7** — normal for CJK headings
- **1.7–2.0** — normal for CJK body text
- **Above 2.0** — valid, some Japanese sites use very open spacing

Record the body line-height as-is (don't "correct" it), but note in the JSON if it seems atypically low for CJK.

#### 4.6.3 Font weight availability

CJK web fonts are expensive to serve. Most services only provide a subset of weights:
- **Typical:** 400 (regular) and 700 (bold) only
- **Premium:** 100, 300, 400, 500, 700, 900

If the site's computed `font-weight` for headings is 600 but the font service only provides 400 and 700, the browser will map 600 → 700. Record the computed weight as-is, but note the available weights from the @font-face or font service configuration.

#### 4.6.4 Unicode-range in @font-face

CJK fonts are typically split into multiple @font-face blocks with different `unicode-range` values for subsetting. When capturing @font-face blocks in 4.4, preserve ALL of them — do not deduplicate by font-family name alone. Each range covers a different subset of characters.

Common Japanese unicode ranges:
- `U+3000-303F` — CJK punctuation
- `U+3040-309F` — Hiragana
- `U+30A0-30FF` — Katakana
- `U+4E00-9FFF` — CJK Unified Ideographs (most kanji)
- `U+F900-FAFF` — CJK Compatibility Ideographs
- `U+FF00-FFEF` — Fullwidth Latin, halfwidth katakana

#### 4.6.5 Font service replication

**TypeSquare:** Loads fonts via a `<script>` tag. The script downloads font files based on a project ID. You CANNOT self-host these fonts (license restriction). The migration must keep the TypeSquare `<script>` in `head.html`. Record the exact `<script>` tag for Phase 11.

**FONTPLUS:** Similar to TypeSquare — script-based loading. Keep the original `<script>` tag.

**Google Fonts (Noto Sans JP, etc.):** Can be loaded via `<link>` in `head.html` or `@import` in `fonts.css`. Both work. Prefer `<link>` for performance.

**Self-hosted CJK fonts:** Possible but results in large files (5–20MB total). Only use if the source site self-hosts. Ensure `unicode-range` subsetting is preserved.

### 4.7 Write output

**Tool:** Write

Save to `migration-work/typography.json`:

```json
{
  "body": {
    "fontFamily": "'Noto Sans JP', sans-serif",
    "fontSize": "16px",
    "fontWeight": "400",
    "lineHeight": "1.75",
    "letterSpacing": "0px"
  },
  "headings": {
    "fontFamily": "'Noto Sans JP', sans-serif",
    "sameAsBody": true,
    "sizes": {
      "h1": { "fontSize": "32px", "fontWeight": "700", "lineHeight": "1.3", "marginBottom": "16px" },
      "h2": { "fontSize": "28px", "fontWeight": "700", "lineHeight": "1.3", "marginBottom": "12px" },
      "h3": { "fontSize": "24px", "fontWeight": "600", "lineHeight": "1.4", "marginBottom": "8px" },
      "h4": { "fontSize": "20px", "fontWeight": "600", "lineHeight": "1.4", "marginBottom": "8px" },
      "h5": { "fontSize": "18px", "fontWeight": "600", "lineHeight": "1.5", "marginBottom": "4px" },
      "h6": { "fontSize": "16px", "fontWeight": "600", "lineHeight": "1.5", "marginBottom": "4px" }
    }
  },
  "fixed": {
    "fontFamily": "monospace",
    "detected": false
  },
  "fontFaces": [
    {
      "family": "Noto Sans JP",
      "src": "url('...') format('woff2')",
      "weight": "400",
      "style": "normal",
      "display": "swap",
      "unicodeRange": "U+3000-9FFF"
    }
  ],
  "externalServices": {
    "googleFonts": null,
    "typekit": null,
    "typesquare": "https://typesquare.com/...",
    "fontplus": null
  },
  "loadingMechanism": "typesquare-cdn",
  "cjk": {
    "isCjk": true,
    "scriptType": "japanese",
    "systemFallbackChain": "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic Medium', 'Yu Gothic', 'Meiryo', sans-serif",
    "fullBodyFontFamily": "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic Medium', 'Yu Gothic', 'Meiryo', sans-serif",
    "availableWeights": [400, 700],
    "unicodeRangeSubsets": 12,
    "lineHeightNote": "1.75 is typical for Japanese body text",
    "fontServiceScript": "<script src=\"https://typesquare.com/3/tsst/script/XXXXX.js\" charset=\"utf-8\"></script>"
  }
}
```

**If the site is NOT CJK** (scriptType is `latin`), omit the entire `cjk` block from the JSON.

### Validation

- [ ] Body font family identified (non-null, not just "serif" or "sans-serif" unless that's genuinely what the site uses)
- [ ] Heading font family identified (or noted as same as body with `sameAsBody: true`)
- [ ] All 6 heading sizes extracted (h1-h6). If some heading levels don't exist on the page, note them as "not found on sampled page" but attempt to extrapolate from the scale
- [ ] Body font sizes captured: m (base), s (smaller text), xs (fine print)
- [ ] Line heights captured for body and each heading level
- [ ] Font weights captured for body and headings
- [ ] @font-face declarations captured OR external font service documented
- [ ] Font loading mechanism explicitly documented: "self-hosted", "google-fonts", "typekit", "typesquare", "fontplus", or "system-fonts-only"
- [ ] **Responsive check:** If Step 4.3b detected responsive typography, `typography.responsive` block is present with mobile AND desktop sizes
- [ ] **Responsive check:** If responsive, `:root` heading sizes will use mobile values (not desktop)
- [ ] **CJK check:** If `cjk-detection.json` shows a CJK site, the `cjk` block is present in `typography.json`
- [ ] **CJK check:** System fallback chain uses platform-native CJK fonts (NOT Arial/Times New Roman)
- [ ] **CJK check:** `fullBodyFontFamily` includes both web font + CJK system fallbacks
- [ ] **CJK check:** Font service `<script>` or `<link>` tag captured verbatim if applicable
- [ ] **CJK check:** unicode-range subsetting noted if @font-face blocks use it

