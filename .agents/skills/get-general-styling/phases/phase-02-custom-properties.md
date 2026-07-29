## Phase 2: Extract CSS Custom Properties

Combine variables from two sources: the live DOM (Phase 1.5) and the raw CSS files (static declarations that may not be active on the current page, e.g., dark mode themes or alternate states).

### 2.1 Parse variables from raw CSS corpus

**Tool:** Grep

Search the raw CSS corpus for CSS variable declarations. Run these searches:

```
pattern: --[a-zA-Z][\w-]*\s*:
path: migration-work/raw-css-corpus.txt
output_mode: content
```

This returns all lines containing CSS variable declarations. The context around them reveals which selector they belong to (`:root`, `body`, `html`, `[data-theme]`, etc.).

For a more targeted extraction, also search for the rule blocks that typically contain variables:

```
pattern: :root\s*\{
path: migration-work/raw-css-corpus.txt
output_mode: content
-A: 50
```

This captures up to 50 lines after each `:root {` to get the full variable block. Repeat for `html\s*\{` and `body\s*\{` if the first search showed variables on those selectors.

### 2.2 Merge with live DOM variables

Read `migration-work/live-css-variables.json` (from Phase 1.5). This contains variables that are actually computed and active on the page.

**Merge strategy:**
- Live DOM variables take precedence (they show the resolved, active values)
- Static CSS variables fill in anything not present in the live DOM (theme variants, unused states)
- Note any variable that appears in static CSS but NOT in the live DOM — it may be for a theme or media query and is still worth capturing

### 2.3 Resolve variable references

Some variables reference other variables: `--brand-blue: var(--primary-color)`. For each variable whose value contains `var(--...)`:
1. Look up the referenced variable in the merged set
2. Record both the reference and the resolved value
3. If the reference cannot be resolved, note it as unresolved

### 2.4 Write output

**Tool:** Write

Save to `migration-work/extracted-variables.json` with this structure:

```json
{
  "count": 42,
  "source": "merged from live DOM + raw CSS",
  "variables": {
    "--primary-color": { "value": "#003366", "source": "live-dom", "selector": ":root" },
    "--text-color": { "value": "#333333", "source": "raw-css", "selector": ":root" },
    "--hover-color": { "value": "var(--primary-color)", "resolved": "#003366", "source": "raw-css", "selector": ":root" }
  },
  "unresolved": []
}
```

### Validation

- [ ] All `--var-*` declarations from `:root` / `html` / `body` captured from raw CSS
- [ ] Live DOM variables merged in (Phase 1.5 data included)
- [ ] Variables referencing other variables have a `resolved` value
- [ ] Any unresolved references are listed in the `unresolved` array
- [ ] Total count documented

