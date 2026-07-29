## Phase 1: Collect Raw CSS and Computed Styles

This phase gathers ALL raw material. Everything else depends on this being thorough.

### 1.1 Navigate to the source site

**Tool:** `browser_navigate`

Navigate to the source URL, then wait for fonts, CSS, and lazy-loaded resources to fully load.

**Tool:** `browser_navigate`
```
url: {source URL}
```

**Tool:** `browser_wait_for`
```
time: 5
```

Why 5 seconds: some sites lazy-load CSS or use font services (TypeSquare, Google Fonts) that take a moment to deliver. Waiting too little means missing stylesheets.

### 1.1b Detect CJK / Japanese content

Run this immediately after navigation. The result determines behavior in later phases (font fallbacks, line-height ranges, font service detection).

**Tool:** `browser_evaluate`

```js
() => {
  const html = document.documentElement;
  const lang = (html.getAttribute('lang') || '').toLowerCase();
  const text = document.body?.innerText || '';

  // Detect CJK character ranges in page text
  const cjkChars = (text.match(/[\u3000-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}]/gu) || []).length;
  const totalChars = text.replace(/\s/g, '').length || 1;
  const cjkRatio = cjkChars / totalChars;

  // Detect common CJK font services
  const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
  const links = Array.from(document.querySelectorAll('link[href]')).map(l => l.href);
  const all = [...scripts, ...links].join(' ');

  const fontServices = {
    typesquare: /typesquare/i.test(all),
    fontplus: /fontplus/i.test(all),
    googleFonts: /fonts\.googleapis/i.test(all),
    typekit: /use\.typekit|fonts\.adobe/i.test(all),
  };

  // Detect CJK font families in computed body style
  const bodyFont = getComputedStyle(document.body).fontFamily;
  const cjkFontPatterns = [
    'noto sans jp', 'noto serif jp', 'noto sans kr', 'noto sans sc', 'noto sans tc',
    'hiragino', 'yu gothic', 'yu mincho', 'meiryo', 'ms pgothic', 'ms pmincho',
    'malgun gothic', 'apple sd gothic', 'simhei', 'simsun', 'microsoft yahei',
    'source han', 'kozuka', 'ipa', 'kinto',
  ];
  const hasCjkFont = cjkFontPatterns.some(p => bodyFont.toLowerCase().includes(p));

  // Determine script type
  let scriptType = 'latin';
  if (lang.startsWith('ja') || (cjkRatio > 0.2 && hasCjkFont)) scriptType = 'japanese';
  else if (lang.startsWith('ko')) scriptType = 'korean';
  else if (lang.startsWith('zh')) scriptType = 'chinese';
  else if (cjkRatio > 0.3) scriptType = 'cjk-unspecified';

  return JSON.stringify({
    lang,
    scriptType,
    cjkRatio: Math.round(cjkRatio * 100) + '%',
    cjkCharCount: cjkChars,
    hasCjkFont,
    bodyFontFamily: bodyFont,
    fontServices,
  }, null, 2);
}
```

Save the returned JSON to `migration-work/cjk-detection.json` using the Write tool.

**Why this matters:**
- **Japanese/CJK sites** need different system font fallbacks (not Arial/Times)
- CJK fonts are much larger (~5-20MB), so they're typically loaded via font services with unicode-range subsetting
- CJK text needs taller `line-height` (1.7–2.0) vs Latin (1.4–1.6)
- Font weight availability is often limited (typically only 400 and 700)
- This detection result is used in Phase 4 (font fallback chains) and Phase 11 (output template)

### 1.2 Fetch all linked stylesheets and inline styles

This is a two-step process. First, discover all CSS sources. Then download each one.

**Step 1 — Discover CSS sources.** Tool: `browser_evaluate`

```js
() => {
  const result = { external: [], inline: [], fontLinks: [] };

  // External stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    result.external.push(link.href);
  });

  // Inline style blocks — return METADATA ONLY (length), never the CSS text.
  // Returning inline content here will truncate/blow the token budget on real
  // sites (which routinely have a 100KB+ critical-CSS block).
  document.querySelectorAll('style').forEach((style, i) => {
    result.inline.push({ index: i, length: style.textContent.length });
  });

  // Preloaded fonts / font service links (capture separately for Phase 4)
  document.querySelectorAll('link[rel="preload"][as="font"], link[href*="fonts.googleapis"], link[href*="use.typekit"], link[href*="typesquare"], link[href*="webfont.fontplus"]').forEach(link => {
    result.fontLinks.push(link.href);
  });

  return JSON.stringify(result, null, 2);
}
```

Save the returned JSON to `migration-work/stylesheet-urls.json` using the Write tool.

**Step 2 — Download each external stylesheet to disk (do NOT return CSS text).**

The corpus can be hundreds of KB. It must go straight to a file, never through a
tool result. Choose the fetch method by reachability:

- **Public URLs (the common case) → `curl` to disk.** Build the corpus with the
  Bash tool, appending a source header before each file:

  ```bash
  cd migration-work
  for url in <url1> <url2> ...; do
    echo "/* === SOURCE: $url === */" >> raw-css-corpus.txt
    curl -fsSL "$url" >> raw-css-corpus.txt
    echo "" >> raw-css-corpus.txt
  done
  ls -lh raw-css-corpus.txt
  ```

  Skip obviously irrelevant third-party sheets (video players, ad networks,
  analytics) — note them in `stylesheet-urls.json` as excluded.

- **CORS/auth-gated URLs only → fetch in `browser_evaluate`, but write each result
  to disk immediately** and return only `{url, size}` from the evaluate call.
  Never return the CSS text in the result.

**IMPORTANT:** Use the URLs literally from Step 1. Do not guess or abbreviate.

**Step 3 — Capture inline `<style>` blocks selectively.**

Do NOT dump inline blocks into the corpus wholesale (one may be 100KB+ of
critical CSS that merely duplicates the external sheets). Instead:

- If `@font-face`, CSS custom properties, or `:root` rules might live inline,
  extract just those with a targeted `browser_evaluate` regex that returns the
  matched rules only (deduplicated), then append them to the corpus with a
  `/* === SOURCE: inline === */` header.
- Otherwise the external sheets are authoritative; skip the inline blocks.

Confirm the corpus is non-empty and contains expected tokens
(e.g. `grep -c "@font-face" raw-css-corpus.txt`).

### 1.3 Take a full-page screenshot for visual reference

**Tool:** `browser_take_screenshot`
```
fullPage: true
type: png
filename: migration-work/design-reference.png
```

### 1.4 Collect computed styles from representative elements

This runs a single large evaluation that samples every element type needed by later phases. Run it as one call to avoid multiple round-trips.

**Tool:** `browser_evaluate`

```js
() => {
  const get = (selector, props) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = { selector };
    props.forEach(p => { r[p] = cs.getPropertyValue(p).trim(); });
    return r;
  };

  const getAll = (selector, props, max = 3) => {
    return Array.from(document.querySelectorAll(selector)).slice(0, max).map((el, i) => {
      const cs = getComputedStyle(el);
      const r = { selector, index: i };
      props.forEach(p => { r[p] = cs.getPropertyValue(p).trim(); });
      return r;
    });
  };

  const COLOR = ['color', 'background-color', 'border-color'];
  const TYPO = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform'];
  const SPACING = ['margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
  const LAYOUT = ['max-width', 'width', 'display', 'gap', 'position'];
  const DECOR = ['border-radius', 'box-shadow', 'border-width', 'border-style', 'border-color'];
  const TRANS = ['transition', 'transition-duration', 'transition-property', 'transition-timing-function'];
  const ALL = [...new Set([...COLOR, ...TYPO, ...SPACING, ...LAYOUT, ...DECOR, ...TRANS])];

  return JSON.stringify({
    body: get('body', ALL),
    headings: {
      h1: get('h1', [...TYPO, ...COLOR, ...SPACING]),
      h2: get('h2', [...TYPO, ...COLOR, ...SPACING]),
      h3: get('h3', [...TYPO, ...COLOR, ...SPACING]),
      h4: get('h4', [...TYPO, ...COLOR, ...SPACING]),
      h5: get('h5', [...TYPO, ...COLOR, ...SPACING]),
      h6: get('h6', [...TYPO, ...COLOR, ...SPACING]),
    },
    text: {
      p: get('p', [...TYPO, ...COLOR, ...SPACING]),
      li: get('li', [...TYPO, ...COLOR, ...SPACING]),
      small: get('small', [...TYPO, ...COLOR]),
      strong: get('strong', [...TYPO, ...COLOR]),
      em: get('em', [...TYPO]),
      blockquote: get('blockquote', [...TYPO, ...COLOR, ...SPACING, ...DECOR,
        'border-left-width', 'border-left-style', 'border-left-color']),
    },
    lists: {
      ul: get('ul', [...SPACING, 'list-style-type', 'padding-left']),
      ol: get('ol', [...SPACING, 'list-style-type', 'padding-left']),
    },
    codeElements: {
      codeInline: get('code', [...TYPO, ...COLOR, ...SPACING, 'background-color', 'border-radius',
        'padding-top', 'padding-bottom', 'padding-left', 'padding-right']),
      pre: get('pre', [...TYPO, ...COLOR, ...SPACING, ...DECOR, 'background-color',
        'overflow-x', 'white-space']),
    },
    hr: get('hr', ['border-top-width', 'border-top-style', 'border-top-color',
      'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
      'margin-top', 'margin-bottom', 'height', 'background-color', 'color']),
    tableElements: {
      table: get('table', ['border-collapse', 'border-spacing', 'width', ...SPACING]),
      th: get('th', [...TYPO, ...COLOR, ...SPACING, 'background-color', 'border-width',
        'border-style', 'border-color', 'text-align', 'vertical-align']),
      td: get('td', [...TYPO, ...COLOR, ...SPACING, 'border-width',
        'border-style', 'border-color', 'text-align', 'vertical-align']),
    },
    figure: {
      figure: get('figure', [...SPACING]),
      figcaption: get('figcaption', [...TYPO, ...COLOR, ...SPACING]),
    },
    links: {
      a: get('a:not(header a):not(nav a)', [...TYPO, ...COLOR, ...TRANS, 'text-decoration', 'text-decoration-color']),
      navLink: get('nav a, header a', [...TYPO, ...COLOR]),
    },
    buttons: getAll('button, .btn, [class*="cta"], [class*="button"], input[type="submit"]', [...TYPO, ...COLOR, ...DECOR, ...SPACING, ...TRANS, 'cursor']),
    containers: getAll('main, [role="main"], [class*="container"], [class*="wrapper"]', [...LAYOUT, ...SPACING]),
    sections: getAll('main > div, main > section, section', [...SPACING, ...COLOR, ...LAYOUT], 5),
    cards: getAll('[class*="card"], [class*="teaser"]', [...DECOR, ...SPACING, ...COLOR]),
    inputs: getAll('input:not([type="hidden"]), select, textarea', [...TYPO, ...COLOR, ...DECOR, ...SPACING]),
    images: get('img', ['border-radius', 'max-width', 'width', 'height', 'object-fit']),
    header: get('header, [role="banner"]', [...COLOR, ...LAYOUT, 'height', 'min-height']),
    nav: get('nav', [...COLOR, ...LAYOUT, 'height']),
    footer: get('footer, [role="contentinfo"]', [...COLOR, ...LAYOUT, ...SPACING]),
    selection: (() => {
      const testEl = document.createElement('span');
      testEl.textContent = 'test';
      testEl.style.position = 'absolute';
      testEl.style.opacity = '0';
      document.body.appendChild(testEl);
      const sel = getComputedStyle(testEl, '::selection');
      const result = { color: sel.color, 'background-color': sel.backgroundColor };
      testEl.remove();
      return result;
    })(),
    globals: (() => {
      // Commonly missed global properties
      const html = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      const result = {};

      // Scroll behavior
      result.scrollBehavior = html.scrollBehavior; // 'smooth' or 'auto'

      // Font smoothing / antialiasing
      result.webkitFontSmoothing = body.webkitFontSmoothing || body.getPropertyValue('-webkit-font-smoothing');
      result.mozOsxFontSmoothing = body.getPropertyValue('-moz-osx-font-smoothing');
      result.textRendering = body.textRendering;

      // Box sizing
      result.boxSizing = body.boxSizing;

      // Body overflow (common: overflow-x hidden to prevent horizontal scroll on mobile)
      result.overflowX = body.overflowX;
      result.overflowY = body.overflowY;

      // Accent color (form elements: checkboxes, radios, range sliders)
      result.accentColor = body.accentColor;

      // Color scheme
      result.colorScheme = html.colorScheme || body.colorScheme;

      // Header position (sticky/fixed)
      const header = document.querySelector('header, [role="banner"]');
      if (header) {
        const hcs = getComputedStyle(header);
        result.headerPosition = hcs.position;
        result.headerZIndex = hcs.zIndex;
      }

      // Check for ::placeholder styling on first input
      const input = document.querySelector('input[type="text"], input[type="email"], input[type="search"], textarea');
      if (input) {
        const placeholder = getComputedStyle(input, '::placeholder');
        result.placeholder = {
          color: placeholder.color,
          opacity: placeholder.opacity,
          fontStyle: placeholder.fontStyle,
        };
      }

      // Link underline details
      const link = document.querySelector('main a, article a, a:not(header a):not(nav a)');
      if (link) {
        const lcs = getComputedStyle(link);
        result.linkUnderlineOffset = lcs.textUnderlineOffset;
        result.linkDecorationThickness = lcs.textDecorationThickness;
        result.linkDecorationStyle = lcs.textDecorationStyle;
      }

      // Input focus styles (for later reference)
      // Note: can't trigger :focus in evaluate, this is captured in Phase 9.4

      return result;
    })(),
  }, null, 2);
}
```

Save the returned JSON to `migration-work/computed-styles.json` using the Write tool.

**If any selector returns `null`** (element not found on this page), that is fine — it means that element type is not present on the sampled page. Note it and move on. If critical elements like `body`, `h2`, `p`, or `a` return null, navigate to a different page on the same site that has more content and re-run.

### 1.5 Extract CSS custom properties from the live DOM

This captures variables that are actually active on the page, including those injected by JavaScript or font services at runtime (which may not appear in the static CSS files).

**Tool:** `browser_evaluate`

```js
() => {
  const vars = {};

  // Method 1: Read from computed style on :root
  const rootStyles = getComputedStyle(document.documentElement);
  for (const prop of rootStyles) {
    if (prop.startsWith('--')) {
      vars[prop] = rootStyles.getPropertyValue(prop).trim();
    }
  }

  // Method 2: Also check body (some sites put vars on body)
  const bodyStyles = getComputedStyle(document.body);
  for (const prop of bodyStyles) {
    if (prop.startsWith('--') && !vars[prop]) {
      vars[prop] = bodyStyles.getPropertyValue(prop).trim();
    }
  }

  return JSON.stringify({
    count: Object.keys(vars).length,
    variables: vars,
  }, null, 2);
}
```

Save to `migration-work/live-css-variables.json` using the Write tool.

### Phase 1 validation

Before proceeding, verify ALL of these:
- [ ] `migration-work/raw-css-corpus.txt` exists and is non-empty (check file size with Bash `ls -lh`)
- [ ] `migration-work/stylesheet-urls.json` lists at least 1 external stylesheet
- [ ] `migration-work/computed-styles.json` has non-null data for `body`, at least 2 heading levels, `p`, and `a`
- [ ] `migration-work/live-css-variables.json` exists (may have 0 variables — that is valid for sites that don't use CSS variables)
- [ ] `migration-work/cjk-detection.json` exists with `scriptType` determined
- [ ] `migration-work/design-reference.png` screenshot captured

**Do NOT proceed if `raw-css-corpus.txt` is empty or `computed-styles.json` is missing body/heading data. Navigate to a content-rich page on the site and re-run steps 1.4 and 1.5.**

