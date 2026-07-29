## Phase 3: Extract Color Palette

### 3.1 Collect colors from computed styles

Read `migration-work/computed-styles.json` and extract every `color`, `background-color`, and `border-color` value. Build a deduplicated list.

**Tool:** Read `migration-work/computed-styles.json`, then parse all color values from every entry.

Record each color with its context:
```json
{ "value": "rgb(0, 51, 102)", "hex": "#003366", "usedBy": ["body color", "h2 color"], "category": "text" }
```

### 3.2 Collect colors from CSS variables

Read `migration-work/extracted-variables.json`. Any variable whose value is a color (hex, rgb, rgba, hsl, hsla, or a named color) should be added to the palette.

### 3.3 Scan raw CSS for additional colors

**Tool:** Grep — run these searches against `migration-work/raw-css-corpus.txt`:

Search for hex colors:
```
pattern: #[0-9a-fA-F]{3,8}
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 100
```

Search for rgb/rgba:
```
pattern: rgba?\([^)]+\)
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 100
```

Search for hsl/hsla:
```
pattern: hsla?\([^)]+\)
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 50
```

Search for gradients:
```
pattern: (linear|radial|conic)-gradient\([^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 20
```

### 3.4 Extract hover states via Playwright

Hover states cannot be read from static CSS or computed styles without interaction. Follow this exact sequence:

**Step 1 — Get a snapshot to find element refs.**

**Tool:** `browser_snapshot`

Look in the snapshot output for link (`a`) and button elements. Note their `ref` values.

**Step 2 — Read pre-hover color of a body link (not nav link).**

**Tool:** `browser_evaluate`

```js
() => {
  const link = document.querySelector('main a, article a, .content a, a:not(header a):not(nav a):not(footer a)');
  if (!link) return JSON.stringify({ error: 'no body link found' });
  const cs = getComputedStyle(link);
  return JSON.stringify({
    element: 'body-link-before-hover',
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    textDecoration: cs.textDecorationLine || cs.textDecoration,
  });
}
```

**Step 3 — Hover the link.**

**Tool:** `browser_hover`

```
ref: {ref value of a body link from the snapshot}
element: body link
```

**Step 4 — Read post-hover color while still hovered.**

**Tool:** `browser_evaluate`

```js
() => {
  const link = document.querySelector('main a:hover, article a:hover, .content a:hover, a:not(header a):not(nav a):not(footer a):hover');
  if (!link) {
    // Fallback: just read the first link's current state (should still be hovered)
    const fallback = document.querySelector('main a, article a, .content a');
    if (!fallback) return JSON.stringify({ error: 'no link found' });
    const cs = getComputedStyle(fallback);
    return JSON.stringify({
      element: 'body-link-after-hover',
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      textDecoration: cs.textDecorationLine || cs.textDecoration,
    });
  }
  const cs = getComputedStyle(link);
  return JSON.stringify({
    element: 'body-link-after-hover',
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    textDecoration: cs.textDecorationLine || cs.textDecoration,
  });
}
```

**Step 5 — Repeat for a button element** (only if a **real** button exists on the page — i.e., a button with non-transparent background-color AND not an icon font. Skip this step if the only buttons found were transparent-background icon elements).

Use the same hover-then-evaluate pattern:
1. Read button pre-hover styles (background-color, color, border-color)
2. `browser_hover` on the button ref
3. Read button post-hover styles

If no real button was found, set `button` to `null` in the interactions output (not derived from link hover states).

**Step 6 — Extract hover rules from raw CSS as backup.**

**Tool:** Grep

```
pattern: :hover\s*\{[^}]*
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 3
head_limit: 30
```

This catches hover rules that may not be testable via Playwright (e.g., elements not visible on the sampled page).

### 3.5 Categorize the palette

Group all collected colors into categories using these **concrete heuristics**:

#### Automatic assignments (no judgment needed)

These come directly from computed styles — no ambiguity:

| Category | Exact source | Fallback |
|----------|-------------|----------|
| **Background (main)** | `computed-styles.body.background-color` | `#ffffff` |
| **Text (primary)** | `computed-styles.body.color` | `#333333` |
| **Link (default)** | `computed-styles.links.a.color` | Same as brand primary |
| **Link (hover)** | Hover state captured in Phase 3.4, Step 4 | 15% darker than link default |
| **Link hover text-decoration** | Hover state captured in Phase 3.4, Step 4 | `underline` |

#### Heuristic: Primary brand color

Use this decision tree in order — stop at the first match:

1. **Check button background.** If `computed-styles.buttons[0].background-color` is a non-neutral, non-white, non-black color → that is the primary brand color. (Buttons are the strongest intentional brand signal.)
2. **Check heading color.** If `computed-styles.headings.h1.color` or `h2.color` is different from body text AND is not black/near-black → that is the primary brand color.
3. **Check link color.** If `computed-styles.links.a.color` is not a generic blue (#0000ff, #0066cc, #0000ee) → it's likely the primary brand color.
4. **Check CSS variables.** If `extracted-variables.json` contains a variable named `--primary`, `--brand`, `--accent`, or `--main-color` → use its resolved value.
5. **Frequency analysis.** From `allUniqueColors`, exclude neutrals (see below). The most frequent remaining color is the primary brand.

**What counts as "neutral":** Any color where the R, G, B channels are within 30 of each other (i.e., grayscale or near-grayscale). In hex: `#000`–`#333` (dark neutrals), `#666`–`#999` (medium neutrals), `#ccc`–`#fff` (light neutrals). Also white (`#fff`, `#ffffff`), black (`#000`, `#000000`), and `transparent`.

#### Heuristic: Secondary brand color

1. If a second non-neutral color appears on hover states, secondary buttons, or links that differ from the primary → that is secondary.
2. If only one non-neutral color exists site-wide → set secondary to `null` (no secondary brand).
3. If two non-neutral colors exist → the one NOT used on primary CTA buttons is secondary.

#### Heuristic: Background (light)

1. Check `computed-styles.sections` — look for any section with a `background-color` that is lighter than body background but not identical to it. Common values: `#f5f5f5`, `#f8f8f8`, `#fafafa`, `#f0f0f0`, `rgb(245,245,245)`.
2. If no distinct light background found → use the body background color with 3% darkened lightness.
3. If `extracted-variables.json` contains `--light-bg`, `--bg-light`, `--gray-100`, or similar → use that.

#### Heuristic: Background (dark)

1. Check `computed-styles.sections` for any section with a dark background (lightness < 30% in HSL).
2. Check `computed-styles.footer.background-color` — footers often use the dark background.
3. If no dark section found → use the body text color (often works as `--dark-color` in EDS).

#### Heuristic: Text (secondary)

1. Check `computed-styles.text.small.color` — if lighter than body text, that's text-secondary.
2. Check `computed-styles.figure.figcaption.color` — captions often use secondary text.
3. If `extracted-variables.json` contains `--text-muted`, `--gray-600`, `--secondary-text` → use that.
4. If no distinct secondary text found → set to body text color with 40% reduced opacity (approximate with a lighter gray).

#### Heuristic: Text (heading)

1. If `computed-styles.headings.h1.color` equals body text color → heading color is the same; set to `null` (no separate heading color needed).
2. If h1/h2 color differs from body text → that's the heading text color.
3. Common pattern: headings use the brand primary color as text.

#### Heuristic: Border (default)

1. Check `computed-styles.cards[*].border-color` — card borders are the most representative.
2. Check `computed-styles.inputs[*].border-color` — input borders are a close second.
3. If neither exists, check `computed-styles.tableElements.th.border-color`.
4. If nothing found → `#dddddd` (safe default).

#### Heuristic: Button colors

A button counts as "detected" only if ALL of these are true:
- `computed-styles.buttons` array is non-empty
- `buttons[0].background-color` is **not** `transparent`, `rgba(0,0,0,0)`, or any fully-transparent value
- `buttons[0].font-family` is **not** an icon font (e.g., `custom-icons`, `FontAwesome`, `Material Icons`)

If a real button is detected:
1. `primaryBg` = `computed-styles.buttons[0].background-color`
2. `primaryText` = `computed-styles.buttons[0].color`
3. `primaryHoverBg` = button hover state from Phase 3.4, Step 5. If not captured → darken primaryBg by 10-15%.

If NO real button is detected (no buttons found, or only transparent/icon-font elements matched) → set `buttons` to `null` in color-palette.json. Do NOT derive button background colors from link text colors — that is a color-role mismatch (link `color` is a text property, button `background-color` is a fill property). The CSS template will use its built-in fallback (`var(--link-color)` / `var(--link-hover-color)`) which keeps values connected to the design tokens via CSS variables.

### 3.6 Write output

**Tool:** Write

Save to `migration-work/color-palette.json`:

```json
{
  "brand": {
    "primary": "#003366",
    "secondary": "#0066cc"
  },
  "backgrounds": {
    "main": "#ffffff",
    "light": "#f5f5f5",
    "dark": "#1a1a2e"
  },
  "text": {
    "primary": "#333333",
    "secondary": "#666666",
    "heading": "#003366"
  },
  "links": {
    "default": "#0066cc",
    "hover": "#004499",
    "hoverTextDecoration": "underline"
  },
  "borders": {
    "default": "#dddddd",
    "focus": "#0066cc"
  },
  "buttons": null,
  "gradients": [],
  "allUniqueColors": ["#003366", "#0066cc", "#333333", "#666666", "#ffffff", "#f5f5f5", "#dddddd"]
}
```

### Validation

- [ ] Body background color captured (non-null)
- [ ] Body text color captured (non-null)
- [ ] Link default color captured
- [ ] Link hover color captured (via Playwright hover sequence, not guessed)
- [ ] At least one brand/accent color identified
- [ ] Button colors captured (if real buttons with non-transparent background exist), or set to `null` if only transparent/icon-font buttons found
- [ ] All unique colors listed in `allUniqueColors` array
- [ ] Each color has a category assignment

