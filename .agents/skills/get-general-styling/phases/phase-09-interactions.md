## Phase 9: Extract Transitions and Interactive States

### 9.1 Collect transition properties from computed styles

Read `migration-work/computed-styles.json`. Extract the `transition`, `transition-duration`, `transition-property`, and `transition-timing-function` values from `links.a` and `buttons` entries.

Common patterns:
- `"all 0.3s ease"` → duration: 0.3s, easing: ease
- `"color 0.2s, background-color 0.2s"` → duration: 0.2s, properties: color + background-color
- `"all 0s ease 0s"` → no transition (default/none)

#### Heuristic: Determining the default transition

The `--transition-duration` and `--transition-easing` custom properties should represent the **site-wide default** — the transition applied to most interactive elements. Use this decision tree:

1. **Collect all transition-duration values** from links AND buttons in computed-styles.
2. **Exclude `0s`** — this means "no transition" (browser default).
3. **If all remaining values are the same** (e.g., all `0.3s ease`) → use that.
4. **If values differ** (e.g., links use `0.2s` and buttons use `0.3s`) → use the **link transition**, since links are more numerous and the link transition defines the general feel of the site.
5. **If computed styles show `0s` for everything** → check the grep results from 9.2. The site may declare transitions in CSS but they didn't compute on the sampled elements.
6. **If truly no transitions found anywhere** → set `--transition-duration` to `0.2s` and `--transition-easing` to `ease` (safe, unobtrusive default), and note `"detected": false` in the JSON.

#### Heuristic: Transition easing function

| Computed value | Simplified name | When to use |
|---------------|----------------|-------------|
| `ease` | ease | Default; good for most transitions |
| `ease-in-out` | ease-in-out | Smoother; common on premium sites |
| `ease-out` | ease-out | Common for entrance animations |
| `ease-in` | ease-in | Common for exit animations |
| `linear` | linear | Rarely used for UI; usually for progress bars |
| `cubic-bezier(...)` | custom | Preserve the exact value |

If multiple easing functions are found, use the one on links (same reasoning as duration).

### 9.2 Scan raw CSS for transition and animation rules

**Tool:** Grep

```
pattern: transition\s*:[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 30
```

Also search for keyframe animations (for awareness — not mapped to EDS variables, but noted):

```
pattern: @keyframes\s+[\w-]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 20
```

### 9.3 Extract hover states via Playwright

If not already done in Phase 3.4, or if additional elements need testing, follow this sequence. If Phase 3.4 already captured link and button hover states, skip to 9.4.

**Link hover — full sequence:**

1. **Tool:** `browser_snapshot` — find a body link ref (look for `a` elements in `main` content, not nav/header)

2. **Tool:** `browser_evaluate` — capture pre-hover state:
```js
(el) => {
  const cs = getComputedStyle(el);
  return JSON.stringify({
    state: 'before-hover',
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    textDecoration: cs.textDecorationLine,
    borderBottomColor: cs.borderBottomColor,
    opacity: cs.opacity,
  });
}
```
Set `ref` to the link's ref value. Set `element` to "body link".

3. **Tool:** `browser_hover` — `ref: {link ref}`, `element: "body link"`

4. **Tool:** `browser_evaluate` — capture post-hover state (same code as step 2, same ref)

5. Diff the before/after to identify what changed.

**Button hover — full sequence:**

Repeat steps 1-5 using a button element ref. Capture `backgroundColor`, `color`, `borderColor`, `boxShadow`, `transform` (some buttons scale on hover).

### 9.4 Extract focus-visible styles

Focus styles are important for accessibility. Test by tabbing to an element.

**Tool:** `browser_press_key`
```
key: Tab
```

Then immediately read the focused element's styles:

**Tool:** `browser_evaluate`

```js
() => {
  const focused = document.activeElement;
  if (!focused || focused === document.body) return JSON.stringify({ error: 'no focused element' });
  const cs = getComputedStyle(focused);
  return JSON.stringify({
    element: focused.tagName + (focused.className ? '.' + focused.className.split(' ')[0] : ''),
    outline: cs.outline,
    outlineColor: cs.outlineColor,
    outlineWidth: cs.outlineWidth,
    outlineOffset: cs.outlineOffset,
    outlineStyle: cs.outlineStyle,
    boxShadow: cs.boxShadow,
  });
}
```

Press Tab a few more times and re-evaluate to sample focus styles on different element types (links, buttons, inputs).

### 9.5 Scan raw CSS for focus/hover rules as backup

**Tool:** Grep

```
pattern: :focus(-visible)?\s*\{[^}]*
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 3
head_limit: 20
```

### 9.6 Write output

**Tool:** Write

Save to `migration-work/interactions.json`:

```json
{
  "transitions": {
    "default": "all 0.3s ease",
    "duration": "0.3s",
    "easing": "ease",
    "properties": ["color", "background-color", "border-color", "box-shadow"]
  },
  "hoverStates": {
    "link": {
      "before": { "color": "#0066cc", "textDecoration": "none" },
      "after": { "color": "#004499", "textDecoration": "underline" },
      "changes": ["color", "textDecoration"]
    },
    "button": null
  },
  "focusStyles": {
    "outline": "2px solid #0066cc",
    "outlineOffset": "2px",
    "boxShadow": "none"
  },
  "animations": ["fadeIn", "slideUp"]
}
```

### Validation

- [ ] Link hover color change captured (before + after)
- [ ] Button hover state captured (before + after) if real buttons exist, or set to `null` if only transparent/icon-font buttons found
- [ ] Transition duration and easing captured
- [ ] Focus/focus-visible outline styles captured
- [ ] Hover rules from raw CSS captured as backup
- [ ] All changed properties documented per element type

