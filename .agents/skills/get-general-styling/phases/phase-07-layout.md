## Phase 7: Extract Layout and Container Widths

This phase identifies how the source site constrains content width, pads content areas, and nests containers. The goal is to produce layout values that replicate the source site's content-centering strategy — **not just the rendered pixel values**, but the underlying mechanism (percentage-based max-width, fixed pixel max-width, padding-only constraint, etc.).

### 7.1 Collect from computed styles

Read `migration-work/computed-styles.json`. Extract from these entries:

- `containers` → `max-width`, `width`, `padding-left`, `padding-right`
- `header` → `max-width`, `height`, `min-height`
- `nav` → `height`
- `sections` → `max-width`, `display`, `gap`

### 7.2 Deep-measure content containers via Playwright

Computed styles from Phase 3 may show `max-width: none` if the constraint is on a deeper nested container. This step walks into the actual DOM to find the **innermost element that constrains content width** and measures its properties precisely.

**Tool:** `browser_evaluate`

```js
() => {
  const cs = (el) => el ? getComputedStyle(el) : null;

  // --- Header / Nav ---
  const headerHeight = (() => {
    const h = document.querySelector('header, [role="banner"]');
    return h ? Math.round(h.getBoundingClientRect().height) : null;
  })();
  const navHeight = (() => {
    const n = document.querySelector('nav');
    return n ? Math.round(n.getBoundingClientRect().height) : null;
  })();

  // --- Find the main content area ---
  // Try common patterns: <main>, [role="main"], first large container child of body
  const mainEl = document.querySelector('main, [role="main"]')
    || document.querySelector('[class*="content"]')
    || document.body;
  const mainRect = mainEl.getBoundingClientRect();
  const mainCs = cs(mainEl);

  // --- Walk visible sections and their inner containers ---
  //
  // Strategy: Find the main structural wrapper, then iterate its
  // visible children (the "sections"). For each section, walk
  // inward to find the innermost container that constrains width
  // (via max-width, a narrower rendered width, or horizontal padding).
  //
  // We collect layout props for EVERY visible section so that
  // Phase 5 and the CSS template can reason about variance.

  // Heuristic: find the element whose direct children are the
  // page-level "sections". This is typically <main>, <main> > div,
  // or a deep grid/container wrapper.
  const findSectionParent = () => {
    // Try standard selectors first
    for (const sel of [
      'main',
      '[role="main"]',
      'main > div',
      'main > section',
    ]) {
      const el = document.querySelector(sel);
      if (el && el.children.length >= 2) return el;
    }
    // AEM / CMS patterns: look for a grid wrapper with many children
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
    return mainEl;
  };

  const sectionParent = findSectionParent();
  const viewportWidth = window.innerWidth;

  const sections = [];
  Array.from(sectionParent.children).forEach((section, i) => {
    const sCs = cs(section);
    if (sCs.display === 'none') return;

    const sectionData = {
      index: i,
      tag: section.tagName,
      className: (section.className || '').substring(0, 120),
      width: sCs.width,
      maxWidth: sCs.maxWidth,
      paddingTop: sCs.paddingTop,
      paddingBottom: sCs.paddingBottom,
      paddingLeft: sCs.paddingLeft,
      paddingRight: sCs.paddingRight,
      marginTop: sCs.marginTop,
      marginBottom: sCs.marginBottom,
      backgroundColor: sCs.backgroundColor,
      innerContainers: []
    };

    // Walk inward to find content-constraining containers
    const walkInner = (el, depth) => {
      if (depth > 6) return;
      Array.from(el.children).slice(0, 12).forEach(child => {
        const childCs = cs(child);
        if (childCs.display === 'none') return;
        const mw = childCs.maxWidth;
        const hasMW = mw !== 'none' && mw !== '0px';
        const hasPad = childCs.paddingLeft !== '0px' || childCs.paddingRight !== '0px';
        const ml = childCs.marginLeft;
        const mr = childCs.marginRight;
        const centered = (ml === 'auto' || mr === 'auto')
          || (ml === mr && ml !== '0px');

        if (hasMW || hasPad || centered) {
          sectionData.innerContainers.push({
            depth,
            tag: child.tagName,
            className: (child.className || '').substring(0, 80),
            renderedWidth: Math.round(child.getBoundingClientRect().width),
            maxWidth: mw,
            paddingLeft: childCs.paddingLeft,
            paddingRight: childCs.paddingRight,
            marginLeft: ml,
            marginRight: mr,
          });
        }
        walkInner(child, depth + 1);
      });
    };

    walkInner(section, 0);
    sections.push(sectionData);
  });

  return JSON.stringify({
    viewportWidth,
    headerHeight,
    navHeight,
    main: {
      renderedWidth: Math.round(mainRect.width),
      maxWidth: mainCs.maxWidth,
      paddingLeft: mainCs.paddingLeft,
      paddingRight: mainCs.paddingRight,
    },
    sectionCount: sections.length,
    sections,
  }, null, 2);
}
```

### 7.3 Analyze section-level layout patterns

From the Step 7.2 output, build a summary of the content-constraining strategy.

#### 7.3.1 Identify max-width type (percentage vs pixel)

For each section's `innerContainers`, look at the `maxWidth` property:

- **Percentage-based** (e.g., `85%`, `90%`): Record the percentage AND the computed `renderedWidth` at the measured viewport. Example: `maxWidth: "85%"` → `renderedWidth: 1224` at 1440px viewport.
- **Pixel-based** (e.g., `1200px`, `1140px`): Record directly.
- **None** (no `maxWidth` on any inner container): The section is full-bleed with no content constraint — content fills the viewport.

**Decision logic for `contentMaxWidth`:**

1. Collect all unique `maxWidth` values from the innermost constraining container of each section (the first `innerContainer` in each section's array, or the section itself if it has `maxWidth`).
2. If the **majority** of sections share the same `maxWidth` → use that as `contentMaxWidth`.
3. **If the shared value is a percentage** (e.g., `85%`): set `contentMaxWidth` to the percentage string (e.g., `"85%"`), AND record `contentMaxWidthPx` as the computed pixel equivalent at the measured viewport. Both go into `layout.json`.
4. **If the shared value is a pixel value** (e.g., `1200px`): set `contentMaxWidth` to that value. `contentMaxWidthPx` is the same value.
5. **If sections have mixed or no max-width**: use the most common rendered content width (rounded to nearest 10px) as `contentMaxWidth` in pixels, and note `"contentMaxWidthType": "measured"`.

#### 7.3.2 Identify inner container padding

For the innermost content-constraining containers identified above:

1. Collect all unique `paddingLeft` / `paddingRight` values.
2. Use the **mode** (most frequent) as `containerPadding.left` / `containerPadding.right`.
3. If all inner containers have `0px` padding but sections themselves have padding, use the section-level padding instead.
4. **Cross-validate:** The rendered content width should approximately equal `(max-width constraint) - paddingLeft - paddingRight`. If it doesn't, the padding source may be at a different nesting level — walk up.

#### 7.3.3 Detect nested container pattern

Some sites constrain content through multiple nested layers (e.g., `max-width: 85%` on an outer container, then another `max-width: 85%` on an inner one, yielding ~72% effective width).

1. For each section, count how many levels of `innerContainers` exist with a non-`none` `maxWidth`.
2. If **2 or more** levels have `maxWidth` constraints → record as `nestedContainers: true` in layout.json.
3. Record the effective innermost `renderedWidth` as `nestedContentWidth`.
4. If nested containers are detected, compute the **effective percentage** for the narrow constraint:
   - If both levels use percentage max-width: multiply them (e.g., `85% × 85% = 72.25%`)
   - If one level is pixel-based and the other percentage-based: convert to a single effective percentage relative to the viewport at the reference width (1440px), or use the pixel value directly.
   - Record this as `nestedEffectiveMaxWidth` in layout.json (e.g., `"72.25%"` or `"1015px"`).
5. **CSS generation note:** When `nestedContainers: true`, the CSS template MUST generate a `.section.narrow` variant that applies the tighter constraint. EDS uses a single `main > .section > div` container, so the default CSS maps to the **outermost** content constraint. Sections that originally had double nesting should use `Section Metadata` with `style | narrow` to get the tighter width.
6. During page migration, any section identified as having double-nested containers should receive `Section Metadata` with `style | narrow` (or `style | light, narrow` if it also has a background style).

#### 7.3.4 Detect full-bleed sections

A section is "full-bleed" when:
- The section itself has `maxWidth: none` or no `maxWidth`
- The section has `padding: 0` on all sides
- The section spans the full viewport width
- Background color is applied at the section level (not the inner container)

If **all or most** sections are full-bleed (content is constrained only by inner containers, not the section wrapper):
- Set `sectionLayout: "full-bleed"` in layout.json
- This means `main > .section` should NOT have horizontal padding or margin — only `main > .section > div` should constrain width.

If sections themselves have max-width or padding:
- Set `sectionLayout: "constrained"`

### 7.4 Scan raw CSS for max-width patterns

**Tool:** Grep

```
pattern: max-width\s*:\s*[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 30
```

Look for values like `1200px`, `1140px`, `1280px`, `1440px`, or percentage values like `85%`, `90%`, `80%`. Record both pixel and percentage max-width values found.

### 7.5 Determine desktop container padding

The container padding may differ between mobile and desktop. From Step 7.2, the measurement was taken at one viewport width. To check for responsive padding changes:

1. Check the raw CSS corpus for media-query-scoped padding values on container-like selectors.
2. If the Phase 6 breakpoints show a desktop breakpoint, check whether any padding rules apply above that breakpoint.
3. If no responsive padding difference is found in the CSS, use the same padding for both mobile and desktop (do NOT invent a `32px` desktop override).

**Tool:** Grep

```
pattern: (padding-left|padding-right|padding)\s*:\s*[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 40
```

Cross-reference any padding values found with the container padding from Step 7.3.2. Only record a separate `desktopContainerPadding` if there is explicit CSS evidence for a different value at a larger breakpoint.

### 7.6 Write output

**Tool:** Write

Save to `migration-work/layout.json`:

```json
{
  "contentMaxWidth": "85%",
  "contentMaxWidthPx": "1224px",
  "contentMaxWidthType": "percentage",
  "nestedContainers": false,
  "nestedContentWidth": null,
  "nestedEffectiveMaxWidth": null,
  "sectionLayout": "full-bleed",
  "headerHeight": "162px",
  "navHeight": "64px",
  "containerPadding": { "left": "15px", "right": "15px" },
  "desktopContainerPadding": null,
  "mainDisplay": "block",
  "sectionGap": "0px",
  "commonMaxWidths": ["85%", "1200px"],
  "note": "Site uses full-bleed sections with percentage-based inner container max-width (85%). Content is centered via auto margins on the inner container."
}
```

**Field descriptions:**

| Field | Description |
|-------|-------------|
| `contentMaxWidth` | The max-width value as written in CSS (may be `%` or `px`) |
| `contentMaxWidthPx` | The computed pixel equivalent at the measured viewport width |
| `contentMaxWidthType` | `"percentage"`, `"pixel"`, or `"measured"` |
| `nestedContainers` | Whether content is constrained through 2+ nested max-width layers |
| `nestedContentWidth` | The innermost effective content width if nested (else `null`) |
| `nestedEffectiveMaxWidth` | The CSS `max-width` value to apply on `.section.narrow > div` (e.g., `"72.25%"`). Computed by multiplying nested percentage constraints. `null` if `nestedContainers` is `false`. |
| `sectionLayout` | `"full-bleed"` (sections span viewport, inner div constrains) or `"constrained"` (sections themselves are narrowed) |
| `containerPadding` | Horizontal padding on the content-constraining container |
| `desktopContainerPadding` | Different padding at desktop breakpoint, or `null` if same as mobile |

### Validation

- [ ] Content area max-width captured — either from CSS or measured rendered width
- [ ] `contentMaxWidthType` is set (`"percentage"`, `"pixel"`, or `"measured"`)
- [ ] If percentage-based max-width: both percentage string AND pixel equivalent recorded
- [ ] Header height captured → maps to `--nav-height`
- [ ] Container horizontal padding captured from the **innermost** content-constraining container (not a generic `[class*="container"]` match)
- [ ] `desktopContainerPadding` is `null` OR backed by CSS evidence (NOT a fabricated `32px` default)
- [ ] `sectionLayout` is set (`"full-bleed"` or `"constrained"`)
- [ ] `nestedContainers` is documented (true/false)
- [ ] If `nestedContainers` is true: `nestedEffectiveMaxWidth` is computed (e.g., `"72.25%"`) and `nestedContentWidth` recorded
- [ ] At least one max-width value found in raw CSS or computed styles

