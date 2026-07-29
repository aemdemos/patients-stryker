## Phase 5: Extract Spacing System

### 5.1 Collect all spacing values from computed styles

Read `migration-work/computed-styles.json`. For every entry that has margin or padding properties, extract the pixel values. Build a flat list of all spacing values.

Parse values as follows:
- `"16px"` → `16`
- `"0px"` → `0` (include — shows intentional zero spacing)
- `"1.5em"` → convert using the element's font-size as reference (or note as `em`-based)
- `"auto"` → skip (not a spacing token)

Organize by context:

```json
{
  "sectionVertical": {
    "paddingTop": ["40px", "60px", "80px"],
    "paddingBottom": ["40px", "60px", "80px"],
    "marginTop": ["0px"],
    "marginBottom": ["0px"]
  },
  "headings": {
    "h1": { "marginTop": "0px", "marginBottom": "16px" },
    "h2": { "marginTop": "32px", "marginBottom": "12px" },
    "h3": { "marginTop": "24px", "marginBottom": "8px" }
  },
  "paragraph": { "marginBottom": "16px" },
  "containerHorizontal": { "paddingLeft": "24px", "paddingRight": "24px" }
}
```

### 5.1b Measure section spacing from the live page

The computed-styles `sections` entry (Phase 3) samples only a few elements using generic selectors (`main > div`, `main > section`, `section`). These may not capture the actual section containers on CMS-heavy sites. Use the per-section data from **Phase 7, Step 7.2** (which walks the real DOM structure) for a more accurate picture.

If Phase 7 has already run, read its output. If not, run the following to collect section-level vertical spacing across ALL visible sections:

**Tool:** `browser_evaluate`

```js
() => {
  // Reuse the same section-parent detection as Phase 7
  const findSectionParent = () => {
    for (const sel of ['main', '[role="main"]', 'main > div', 'main > section']) {
      const el = document.querySelector(sel);
      if (el && el.children.length >= 2) return el;
    }
    for (const sel of [
      '[class*="Grid"] > [class*="Grid"]',
      '[class*="container"] > [class*="Grid"]',
      '.root [class*="Grid"]',
    ]) {
      const candidates = document.querySelectorAll(sel);
      for (const c of candidates) {
        if (c.children.length >= 3) return c;
      }
    }
    return document.querySelector('main') || document.body;
  };

  const parent = findSectionParent();
  const sections = [];
  Array.from(parent.children).forEach((el, i) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    sections.push({
      index: i,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
    });
  });

  // Compute statistics
  const vals = (prop) => sections.map(s => parseFloat(s[prop]) || 0);
  const mode = (arr) => {
    const freq = {};
    arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const median = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const marginTops = vals('marginTop');
  const marginBottoms = vals('marginBottom');
  const paddingTops = vals('paddingTop');
  const paddingBottoms = vals('paddingBottom');

  return JSON.stringify({
    sectionCount: sections.length,
    sections,
    stats: {
      marginTop: { mode: mode(marginTops), median: median(marginTops), values: [...new Set(marginTops)].sort((a,b)=>a-b) },
      marginBottom: { mode: mode(marginBottoms), median: median(marginBottoms), values: [...new Set(marginBottoms)].sort((a,b)=>a-b) },
      paddingTop: { mode: mode(paddingTops), median: median(paddingTops), values: [...new Set(paddingTops)].sort((a,b)=>a-b) },
      paddingBottom: { mode: mode(paddingBottoms), median: median(paddingBottoms), values: [...new Set(paddingBottoms)].sort((a,b)=>a-b) },
    }
  }, null, 2);
}
```

**Interpretation:**

- If the **mode** of `marginTop` and `marginBottom` is `0` → most sections have no vertical spacing at the section level. The `sectionPaddingVertical` token should be `0px`, and any non-zero values are exceptions (handled per-section, not as a global default).
- If the mode is non-zero (e.g., `40`) → that's the standard section spacing.
- If values vary widely with no clear mode → use the **median** and note as irregular.

### 5.2 Scan raw CSS for spacing patterns

**Tool:** Grep

Search for common spacing properties to catch values not on the sampled page:

```
pattern: (margin|padding|gap)\s*:\s*[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 60
```

### 5.3 Identify the spacing scale

Collect all unique numeric spacing values (deduplicated, sorted ascending).

#### Heuristic: Detecting the scale base

1. Parse all spacing values to numbers (strip `px`). Exclude `0`.
2. Find the **Greatest Common Divisor (GCD)** of the 5 most frequent values. This is likely the scale base.
   - If GCD = 4 → **4px base scale** (values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
   - If GCD = 8 → **8px base scale** (values: 8, 16, 24, 32, 48, 64, 96)
   - If GCD = 5 or 10 → **5px/10px base** (less common but valid)
   - If GCD = 1 → **Irregular** (no consistent scale)
3. **Tolerance:** Allow ±1px rounding. If extracted values are `[7, 15, 23, 31, 47]`, these are likely `[8, 16, 24, 32, 48]` with sub-pixel rounding. Round each value to the nearest scale step and note the original.

#### Heuristic: Assigning key spacing tokens

| Token | How to determine | Fallback |
|-------|-----------------|----------|
| `sectionPaddingVertical` | Use the **mode** of `marginTop` + `paddingTop` values from Step 5.1b (live section measurement). If the mode is `0` across most sections, use `0px` — this indicates the site uses tight section spacing or utility classes. Only use a non-zero value if it is the **dominant** pattern. If sections have varying padding with no clear mode, use the **median**. | `40px` |
| `headingMarginTop` | `computed-styles.headings.h2.margin-top`. Use h2 (most representative). | `0.8em` |
| `headingMarginBottom` | `computed-styles.headings.h2.margin-bottom`. | `0.25em` |
| `paragraphMarginBottom` | `computed-styles.text.p.margin-bottom`. | `0.25em` |
| `containerPaddingHorizontal` | Use the value from Phase 7, Step 7.3.2 (innermost content-constraining container padding). This is more accurate than `computed-styles.containers[0].padding-left` which may match an outer non-constraining container. Only fall back to `computed-styles.containers[0]` if Phase 7 data is not yet available. | `24px` |
| `gap` | Most common `gap` value from `computed-styles.sections` or `containers`. If not set (no flex/grid), use `16px`. | `16px` |

**em vs px:** If the source site uses `em` values for heading/paragraph margins (common), keep them as `em` — they scale better. Only convert to `px` if the site uses explicit pixel values.

### 5.4 Write output

**Tool:** Write

Save to `migration-work/spacing.json`:

```json
{
  "scale": [0, 4, 8, 16, 24, 32, 48, 64],
  "scaleBase": "8px",
  "tokens": {
    "sectionPaddingVertical": "0px",
    "headingMarginTop": "32px",
    "headingMarginBottom": "12px",
    "paragraphMarginBottom": "16px",
    "containerPaddingHorizontal": "15px",
    "gap": "16px"
  },
  "sectionSpacingDetail": {
    "marginTopMode": "0px",
    "marginBottomMode": "0px",
    "paddingTopMode": "0px",
    "paddingBottomMode": "0px",
    "hasVariance": true,
    "exceptionalValues": ["40px"],
    "note": "Most sections have 0px margin/padding. One section has 40px margin-top."
  },
  "allValues": ["0px", "4px", "8px", "12px", "15px", "16px", "24px", "32px", "40px", "48px", "64px", "80px"]
}
```

**Key: `sectionSpacingDetail`**

This object captures per-section spacing variance discovered in Step 5.1b:

| Field | Description |
|-------|-------------|
| `marginTopMode` | The most common `margin-top` across all visible sections |
| `marginBottomMode` | The most common `margin-bottom` across all visible sections |
| `paddingTopMode` | The most common `padding-top` across all visible sections |
| `paddingBottomMode` | The most common `padding-bottom` across all visible sections |
| `hasVariance` | `true` if any section differs from the mode |
| `exceptionalValues` | Non-zero values that differ from the mode (for awareness) |
| `note` | Human-readable summary |

The CSS template uses `sectionPaddingVertical` (the mode) as the global `main > .section` margin. If this is `0px`, sections are tightly stacked and any spacing comes from inner content, not section wrappers.

### Validation

- [ ] Section top/bottom spacing captured using **live section measurement** (Step 5.1b), not just computed-styles samples
- [ ] `sectionSpacingDetail` recorded with mode, variance flag, and exceptional values
- [ ] `sectionPaddingVertical` reflects the **mode** (most common value), not a single sample or fallback
- [ ] Heading margins captured for at least h2 and h3
- [ ] Paragraph bottom margin captured
- [ ] `containerPaddingHorizontal` sourced from Phase 7 innermost container (not a generic container match)
- [ ] Spacing scale pattern identified (or explicitly noted as irregular)
- [ ] All unique spacing values listed in `allValues`

