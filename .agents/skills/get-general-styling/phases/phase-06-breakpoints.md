## Phase 6: Extract Breakpoints and Media Queries

Breakpoints can ONLY be extracted from the raw CSS. Computed styles are viewport-specific and reveal nothing about breakpoints.

### 6.1 Extract all @media rules from raw CSS

**Tool:** Grep

Search for all media query declarations:

```
pattern: @media[^{]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 100
```

### 6.2 Extract pixel values from media queries

From the grep results, extract all pixel values. These patterns will appear:

- `min-width: 768px` → breakpoint at 768px (mobile-first, desktop starts here)
- `max-width: 767px` → breakpoint at 768px (desktop-first, mobile is below this)
- `min-width: 1024px and max-width: 1279px` → range breakpoint

**Tool:** Grep — a more targeted search for just the numeric values:

```
pattern: (min|max)-width\s*:\s*\d+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 100
```

### 6.3 Deduplicate and sort

From the extracted values, build a unique sorted list. Typical results look like:

```
[480, 600, 768, 900, 1024, 1200, 1440]
```

### 6.4 Identify the approach

#### Heuristic: Mobile-first vs Desktop-first

1. Count how many media queries use `min-width` vs `max-width` from the grep results.
2. **If min-width count > max-width count by 2x or more** → mobile-first.
3. **If max-width count > min-width count by 2x or more** → desktop-first.
4. **If roughly equal** → mixed.
5. **If 0 of both** → non-responsive site (no breakpoints). Document this explicitly.

### 6.5 Map to purpose

#### Heuristic: Assigning the "desktop" breakpoint

The **desktop breakpoint** is the single most important one — it determines when EDS switches from mobile to desktop layout. Use this decision tree:

1. **Find the breakpoint with the highest `matchCount`** (most media query rules). This is usually the primary layout breakpoint.
2. **If two breakpoints are close in count**, prefer the one in the 768px–1024px range (that's the tablet-to-desktop transition).
3. **Cross-reference with the content max-width** from Phase 7. The desktop breakpoint should be LESS than the content max-width. Example: if content max-width is 1200px (or the pixel equivalent of a percentage-based max-width like 85%), the desktop breakpoint is likely 768px or 1024px (not 1200px, which would be the wide breakpoint). If the content max-width is percentage-based, use the `contentMaxWidthPx` value from layout.json for comparison.

#### Heuristic: Mapping to EDS breakpoints

EDS uses two main breakpoints in `styles/styles.css`:
- **900px** — the primary mobile/desktop switch (the `@media (width >= 900px)` block)
- This is used for `:root` variable overrides and section layout

Decision logic for `edsMapping.desktopBreakpoint` (the value to use in all `@media` rules in `styles/styles.css` and block CSS):

1. **If the site's primary desktop breakpoint is 768px** → set `desktopBreakpoint` to `900px`. The 132px difference is negligible — EDS's 900px captures the same intent.
2. **If the site's primary desktop breakpoint is 900px–1024px** → set `desktopBreakpoint` to the site's value. It's close enough to EDS default to replace it directly.
3. **If the site's primary desktop breakpoint is >1024px** → this is probably a "wide" breakpoint, not desktop. Look for a lower breakpoint (tablet) that serves as the real mobile/desktop split.
4. **If the site's primary desktop breakpoint is <768px** (e.g., 600px) → set `desktopBreakpoint` to `900px` and note the discrepancy.

**IMPORTANT:** `desktopBreakpoint` is the **CSS-ready value** — the exact pixel value to use in `@media (width >= Xpx)` throughout the project. It is NOT the raw site value. The raw site value is stored separately in `siteRawDesktopBreakpoint` for reference only. Every `@media` rule in `styles/styles.css` and in block CSS files MUST use `desktopBreakpoint`, never `siteRawDesktopBreakpoint`.

| Breakpoint range | Typical purpose | EDS mapping |
|-----------------|----------------|-------------|
| 320–480px | Small → large mobile | No EDS equivalent needed |
| 481–767px | Large mobile → tablet | No EDS equivalent needed |
| 768–1024px | Tablet → desktop | → `desktopBreakpoint` (the CSS-ready value used in all `@media` rules) |
| 1025–1279px | Desktop → wide | → secondary breakpoint (optional) |
| 1280px+ | Wide → ultra-wide | → for content max-width only |

### 6.6 Write output

**Tool:** Write

Save to `migration-work/breakpoints.json`:

```json
{
  "approach": "mobile-first",
  "breakpoints": [
    { "value": "480px", "purpose": "small-mobile", "matchCount": 12 },
    { "value": "768px", "purpose": "tablet", "matchCount": 45 },
    { "value": "1024px", "purpose": "desktop", "matchCount": 38 },
    { "value": "1280px", "purpose": "wide-desktop", "matchCount": 8 }
  ],
  "edsMapping": {
    "siteRawDesktopBreakpoint": "1024px",
    "desktopBreakpoint": "1024px",
    "note": "Site uses 1024px for desktop. This is in the 900-1024px range, so we use the site's value directly as the CSS-ready breakpoint."
  },
  "rawMediaQueries": ["(min-width: 480px)", "(min-width: 768px)", "(min-width: 1024px)", "(min-width: 1280px)"]
}
```

### Validation

- [ ] All unique breakpoint pixel values listed and sorted
- [ ] Desktop breakpoint identified
- [ ] Tablet breakpoint identified (if exists)
- [ ] Mobile breakpoint identified (if exists)
- [ ] Mobile-first vs desktop-first approach noted
- [ ] At least 1 breakpoint found (if 0 found, the site may not be responsive — document this)
- [ ] `desktopBreakpoint` is the CSS-ready value (not the raw site value) and is stored in `edsMapping.desktopBreakpoint`
- [ ] `siteRawDesktopBreakpoint` stores the original site value for reference

