## Phase 10: Map to EDS Custom Properties

Take all extracted data and map to EDS variable names. Use this mapping table:

### Colors
```css
--background-color: /* body background-color */
--light-color: /* light section background, e.g., light gray */
--dark-color: /* dark section background or border color */
--text-color: /* body text color */
--link-color: /* link color */
--link-hover-color: /* link hover color */
```

### Typography
```css
--body-font-family: /* body font-family (include fallbacks) */
--heading-font-family: /* heading font-family (include fallbacks) */
--fixed-font-family: /* code/monospace font-family */

--body-font-size-m: /* body font-size */
--body-font-size-s: /* smaller body text (e.g., captions) */
--body-font-size-xs: /* smallest body text (e.g., fine print) */

--heading-font-size-xxl: /* h1 font-size */
--heading-font-size-xl: /* h2 font-size */
--heading-font-size-l: /* h3 font-size */
--heading-font-size-m: /* h4 font-size */
--heading-font-size-s: /* h5 font-size */
--heading-font-size-xs: /* h6 font-size */
```

### Layout
```css
--nav-height: /* header/nav height */
```

### Additional custom properties

If the source site uses tokens that don't map to standard EDS variables, create new custom properties following the EDS naming pattern:
```css
--brand-primary: /* primary brand color */
--brand-secondary: /* secondary brand color */
--border-radius: /* default border-radius */
--section-spacing: /* vertical space between sections */
--transition-duration: /* default transition speed */
```

### Base element styles (beyond variables)

EDS does not use CSS variables for every property. Many base element styles are set directly. Map these from `computed-styles.json`:

**Headings** — from `computed-styles.headings.*`:
| Property | Source | EDS target |
|----------|--------|------------|
| `font-weight` | `headings.h2.font-weight` (use h2 as default, override per-level if they differ) | `h1,h2,h3,h4,h5,h6 { font-weight }` |
| `line-height` | `headings.h2.line-height` | `h1,h2,h3,h4,h5,h6 { line-height }` |
| `margin-top` | `headings.h2.margin-top` | `h1,h2,h3,h4,h5,h6 { margin-top }` |
| `margin-bottom` | `headings.h2.margin-bottom` | `h1,h2,h3,h4,h5,h6 { margin-bottom }` |
| Individual overrides | If h1 has a different weight or line-height than h2-h6 | Separate `h1 { font-weight: 700 }` rule |

**Paragraphs & block elements** — from `computed-styles.text.p`:
| Property | Source | EDS target |
|----------|--------|------------|
| `margin-top` | `text.p.margin-top` | `p,dl,ol,ul,pre,blockquote { margin-top }` |
| `margin-bottom` | `text.p.margin-bottom` | `p,dl,ol,ul,pre,blockquote { margin-bottom }` |

**Lists** — from `computed-styles.lists.*`:
| Property | Source | EDS target |
|----------|--------|------------|
| `list-style-type` | `lists.ul.list-style-type` | `ul { list-style-type }` (only if non-default) |
| `padding-left` | `lists.ul.padding-left` | `ul, ol { padding-left }` |
| `li margin-bottom` | `text.li.margin-bottom` | `li { margin-bottom }` (only if non-zero) |

**Blockquote** — from `computed-styles.text.blockquote`:
| Property | Source | EDS target |
|----------|--------|------------|
| `border-left` | `blockquote.border-left-width/style/color` | `blockquote { border-left }` |
| `padding-left` | `blockquote.padding-left` | `blockquote { padding-left }` |
| `font-style` | `blockquote.font-style` | `blockquote { font-style }` (only if italic) |
| `color` | `blockquote.color` | `blockquote { color }` (only if different from body) |

**Inline code** — from `computed-styles.codeElements.codeInline`:
| Property | Source | EDS target |
|----------|--------|------------|
| `background-color` | `codeInline.background-color` | `code { background-color }` |
| `padding` | `codeInline.padding-*` | `code { padding }` |
| `border-radius` | `codeInline.border-radius` | `code { border-radius }` |
| `font-size` | `codeInline.font-size` | `code { font-size }` |

**Pre (code blocks)** — from `computed-styles.codeElements.pre`:
| Property | Source | EDS target |
|----------|--------|------------|
| `padding` | `pre.padding-*` | `pre { padding }` |
| `border-radius` | `pre.border-radius` | `pre { border-radius }` |
| `background-color` | `pre.background-color` | `pre { background-color }` |

**Horizontal rule** — from `computed-styles.hr`:
| Property | Source | EDS target |
|----------|--------|------------|
| `border-top` | `hr.border-top-*` | `hr { border }` |
| `margin` | `hr.margin-top/bottom` | `hr { margin }` |
| `background-color` | `hr.background-color` | `hr { background-color }` (only if visible/non-default) |

**Tables** — from `computed-styles.tableElements.*`:
| Property | Source | EDS target |
|----------|--------|------------|
| `border-collapse` | `table.border-collapse` | `table { border-collapse }` |
| `th background` | `th.background-color` | `th { background-color }` |
| `th/td border` | `th.border-*` | `th, td { border }` |
| `th/td padding` | `th.padding-*` | `th, td { padding }` |
| `th text-align` | `th.text-align` | `th { text-align }` |
| `th font-weight` | `th.font-weight` | `th { font-weight }` |

**Images** — from `computed-styles.images`:
| Property | Source | EDS target |
|----------|--------|------------|
| `max-width` | `images.max-width` | `main img { max-width }` |
| `border-radius` | `images.border-radius` | `main img { border-radius }` (only if non-zero) |
| `object-fit` | `images.object-fit` | `main img { object-fit }` (only if not `fill`) |

**Figure/figcaption** — from `computed-styles.figure.*`:
| Property | Source | EDS target |
|----------|--------|------------|
| `figure margin` | `figure.margin-*` | `figure { margin }` |
| `figcaption font-size` | `figcaption.font-size` | `figcaption { font-size }` |
| `figcaption color` | `figcaption.color` | `figcaption { color }` (only if different from body) |

**Rule for "only if different":** Many of these elements inherit from `body`. Only add an explicit CSS rule if the extracted value is DIFFERENT from the body or parent default. For example, if `li` has the same `color` as `body`, do not add a `li { color }` rule.

### Validation

- [ ] Every standard EDS variable has a mapped value
- [ ] Additional custom properties created for site-specific tokens
- [ ] All values are valid CSS (no typos, proper units)
- [ ] Base element styles mapped from computed-styles.json
- [ ] Heading font-weight checked per level (h1 may differ from h2-h6)
- [ ] Paragraph/blockquote margins mapped
- [ ] Table styles mapped (if tables exist on the source site)
- [ ] `hr` styles mapped (if horizontal rules exist)
- [ ] Only non-inherited, non-default values produce explicit CSS rules

