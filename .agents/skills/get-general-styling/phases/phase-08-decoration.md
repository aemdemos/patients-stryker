## Phase 8: Extract Borders, Shadows, and Border-Radius

### 8.1 Collect from computed styles

Read `migration-work/computed-styles.json`. Extract decoration properties from:

- `buttons` → `border-radius`, `box-shadow`, `border-width`, `border-style`, `border-color`
- `cards` → `border-radius`, `box-shadow`, `border-width`, `border-style`, `border-color`
- `inputs` → `border-radius`, `border-width`, `border-style`, `border-color`
- `images` → `border-radius`

### 8.2 Scan raw CSS for shadow and radius patterns

**Tool:** Grep — search for box-shadow values:

```
pattern: box-shadow\s*:\s*[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 20
```

**Tool:** Grep — search for border-radius values:

```
pattern: border-radius\s*:\s*[^;]+
path: migration-work/raw-css-corpus.txt
output_mode: content
head_limit: 20
```

### 8.3 Categorize

#### Heuristic: Border-radius tier assignment

1. Collect all unique border-radius pixel values from computed-styles + grep results.
2. Parse to numbers, sort ascending, exclude `0`.
3. Assign tiers:

| Tier | Range | How to assign |
|------|-------|--------------|
| **small** | 1px–5px | The **smallest non-zero** value found. If only one value exists, it is both small and the default. |
| **medium** | 6px–12px | The **most common** non-zero value, if different from small. |
| **large** | 13px–30px | Any value in this range. Often used for modals, large cards. |
| **full** | 50%, 9999px, or values > 100px | Fully rounded. Check for values like `50%`, `9999px`, `100px`, `2.4em`. |

4. **If only one non-zero value exists** → set `small` to that value, set `medium` and `large` to `null`.
5. **If no border-radius found** → all tiers are `"0px"`. The site uses square corners.
6. **The `--border-radius` custom property** in `:root` should be set to the **most common** value (the one appearing most in buttons + cards + inputs).

#### Heuristic: Box-shadow tier assignment

1. Collect all unique box-shadow values from computed-styles + grep results.
2. Parse the **blur radius** (3rd numeric value in the shorthand: `offset-x offset-y blur spread color`).
3. Assign tiers:

| Tier | Blur radius | How to assign |
|------|------------|--------------|
| **subtle** | 0–5px | Smallest blur. Typically: `0 1px 3px rgba(0,0,0,0.1)`. |
| **medium** | 6–15px | Mid-range blur. Typically: `0 4px 12px rgba(0,0,0,0.15)`. |
| **strong** | 16px+ | Largest blur. Typically: `0 8px 30px rgba(0,0,0,0.2)`. |

4. **If only one shadow found** → assign to `subtle`.
5. **If `none` is the only value** → all tiers are `null`. The site does not use shadows. This is a valid result.
6. **`box-shadow: none`** in computed styles often means the element has no shadow — not that shadows don't exist on the site. Check grep results for shadows that may not be on the sampled page.

#### Heuristic: Default border style

1. From all `border-width + border-style + border-color` values across cards, inputs, and tables:
2. **Most frequent combination** = the "default" border.
3. If multiple distinct borders exist (e.g., `1px solid #ddd` on cards but `1px solid #ccc` on inputs), use the card border as default (cards are more prominent in EDS layouts).

### 8.4 Write output

**Tool:** Write

Save to `migration-work/decoration.json`:

```json
{
  "borderRadius": {
    "small": "4px",
    "medium": "8px",
    "large": "16px",
    "full": "9999px",
    "allValues": ["0px", "4px", "8px", "16px"]
  },
  "boxShadow": {
    "subtle": "0 1px 3px rgba(0,0,0,0.1)",
    "medium": "0 4px 12px rgba(0,0,0,0.15)",
    "allValues": ["0 1px 3px rgba(0,0,0,0.1)", "0 4px 12px rgba(0,0,0,0.15)"]
  },
  "borders": {
    "default": "1px solid #dddddd",
    "input": "1px solid #cccccc",
    "divider": "1px solid #eeeeee"
  }
}
```

### Validation

- [ ] Button border-radius captured (or noted as 0/none)
- [ ] Card/teaser border-radius captured (if cards exist on the page)
- [ ] Box-shadow patterns captured (if any exist; "none found" is a valid result)
- [ ] Input border style captured (if forms exist on the page)
- [ ] Border-radius scale documented
- [ ] All unique values listed

