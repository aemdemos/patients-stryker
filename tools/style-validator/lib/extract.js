/* eslint-disable import/prefer-default-export, no-restricted-syntax, no-continue */
/*
 * In-browser text-run extraction (runs inside page.evaluate).
 *
 * Visibility gate + block-ish tag set adapted from qa-tool's
 * extractVisibleTextInBrowser (lib/visible-text.js). Unlike qa-tool, which
 * emits innerText lines for content-completeness, we emit ELEMENT-level runs:
 * the deepest element that owns a contiguous, directly-held text run, so its
 * getComputedStyle is unambiguous (the "measure the leaf" principle). Each run
 * carries the computed-style fingerprint the validator compares.
 */

/**
 * Returns a serializable extractor function body as a string is unnecessary —
 * Playwright serializes the function. This module exports the function to be
 * passed to page.evaluate(extractRuns, options).
 */
/* eslint-disable no-undef */
export function extractRunsInBrowser(options) {
  const opts = options || {};
  const minLen = opts.minLength || 2;
  const BOILERPLATE = [
    'accept all', 'accept cookies', 'cookie preferences',
    'we use cookies', 'this website uses cookies', 'cookies settings',
    'reject all',
  ];

  const zeroWidth = new RegExp(`[${String.fromCharCode(0xFEFF, 0x200B, 0x200C, 0x200D)}]`, 'g');
  function normalize(raw) {
    return (raw || '')
      .replace(zeroWidth, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  // `allowShort` lets meaningful short runs through the length floor. The floor
  // exists to skip stray prose fragments, but a citation marker ("1", "*", "†")
  // is real content we specifically want to compare — its element opts in.
  function isBoilerplate(n, allowShort) {
    if (!n) return true;
    if (!allowShort && n.length < minLen) return true;
    return BOILERPLATE.some((s) => n.includes(s));
  }
  // Is this element a citation/reference marker (a <sup>, or a link into the
  // on-page reference targets)? Such markers are kept even when very short.
  function isReferenceMarker(el) {
    if (el.closest('sup')) return true;
    const href = el.getAttribute && el.getAttribute('href');
    return !!(href && (href === '#disclaimer' || href.startsWith('#fn-')));
  }
  function visible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    return true;
  }
  function familyName(ff) {
    return (ff || '').split(',')[0].replace(/["']/g, '').trim();
  }
  // Coarse context hint (never used for matching — only to help humans/AI read
  // clusters): nearest heading vs body vs a known block/section class.
  function contextHint(el) {
    const h = el.closest('h1,h2,h3,h4,h5,h6');
    const block = el.closest('[class*="panel"],[class*="cards"],[class*="hero"]');
    const section = el.closest('.section');
    const parts = [];
    if (h) parts.push(`heading:${h.tagName.toLowerCase()}`);
    if (block) {
      const cls = [...block.classList].filter((c) => /panel|cards|hero/.test(c)).join('.');
      if (cls) parts.push(`block:${cls}`);
    } else if (section) {
      const cls = [...section.classList].filter((c) => c !== 'section').join('.');
      parts.push(`section:${cls || 'default'}`);
    }
    if (el.closest('sup')) parts.push('sup');
    return parts.join(' ') || 'body';
  }
  // Coarse ROLE bucket — used to gate pairing so identical short text in
  // different roles (e.g. a nav "Resources" vs a heading "Resources") is not
  // paired. Order matters: sup (reference marker) > heading > link > body.
  function roleBucket(el) {
    if (el.closest('sup')) return 'sup';
    if (el.closest('h1,h2,h3,h4,h5,h6')) return 'heading';
    if (el.tagName === 'A' || el.closest('a')) return 'link';
    if (el.closest('li')) return 'listitem';
    return 'body';
  }

  // A STABLE, semantic-leaning CSS selector for the run's element, on the
  // migrated side only — used by the auto-fix generator to write a targeted rule.
  // Prefers durable signals (href, block/section class + tag) over fragile
  // structural paths. Returns null when no stable signal exists (then the fix
  // must be authored, not auto-generated).
  // The BLOCK element for scoping — a real EDS block (`.panel`, `.cards`, `.hero`),
  // NEVER the structural `*-container` / `*-wrapper` element EDS auto-wraps blocks
  // and sections in. Those wrappers differ between the authoring preview and the
  // published render (extra/empty divs), so a selector scoped to them is fragile
  // and breaks in one environment. We match the block by an EXACT class token from
  // a known set, not a substring, so `panel-container` can never qualify as a block.
  const BLOCK_CLASSES = ['panel', 'cards', 'hero'];
  const VARIANT_CLASSES = ['wide', 'dark', 'cta', 'gold', 'resources', 'banner', 'light'];
  function blockScope(el) {
    // nearest ancestor that carries an exact block class token (not "*-container")
    let node = el;
    while (node && node.classList) {
      const classes = [...node.classList];
      if (classes.some((c) => BLOCK_CLASSES.includes(c))) {
        return classes.filter((c) => BLOCK_CLASSES.includes(c) || VARIANT_CLASSES.includes(c)).join('.');
      }
      node = node.parentElement;
    }
    return null;
  }
  // Semantic SECTION-STYLE scope (e.g. `.section.flex`, `.section.dark`) — the
  // Style token authors set, which is environment-stable. Excludes the generated
  // `*-container` / `*-wrapper` classes.
  function sectionScope(el) {
    const sec = el.closest('.section');
    if (!sec) return null;
    const scls = [...sec.classList]
      .filter((c) => c !== 'section' && !c.endsWith('-container') && !c.endsWith('-wrapper'))
      .join('.');
    return scls ? `.section.${scls}` : null;
  }
  function stableSelector(el) {
    const tag = el.tagName.toLowerCase();
    const href = el.getAttribute && el.getAttribute('href');
    if (tag === 'a' && href && href.startsWith('#')) {
      // reference/anchor links — MUST be scoped to a real block or a section-style
      // so the rule can't leak to the same href elsewhere. Prefer block, then
      // section-style; if neither, return null (unscopable → not auto-fixable).
      const block = blockScope(el);
      if (block) return `.${block} a[href="${href}"]`;
      const sec = sectionScope(el);
      if (sec) return `${sec} a[href="${href}"]`;
      return null;
    }
    // block/section-scoped heading or element by tag.
    const block = blockScope(el);
    if (block) {
      if (/^h[1-6]$/.test(tag)) return `.${block} :is(h1,h2,h3,h4,h5,h6)`;
      if (el.closest('sup')) return `.${block} sup`;
      return `.${block} ${tag}`;
    }
    const section = sectionScope(el);
    if (section) {
      if (/^h[1-6]$/.test(tag)) return `${section} :is(h1,h2,h3,h4,h5,h6)`;
      if (el.closest('sup')) return `${section} sup`;
      return `${section} ${tag}`;
    }
    return null;
  }

  // A "text run" = an element that directly holds non-whitespace text in one or
  // more of its immediate child text nodes. We read the fingerprint from that
  // element (its own computed style governs the directly-held text).
  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el = walker.currentNode;
  const seenOrder = new Map(); // normalizedText -> running count for dup ranking
  while (el) {
    const directText = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ');
    const norm = normalize(directText);
    const allowShort = isReferenceMarker(el);
    if (norm && !isBoilerplate(norm, allowShort) && visible(el)) {
      const cs = getComputedStyle(el);
      const rank = seenOrder.get(norm) || 0;
      seenOrder.set(norm, rank + 1);
      runs.push({
        normalizedText: norm,
        rawText: directText.replace(/\s+/g, ' ').trim(),
        dupRank: rank,
        contextHint: contextHint(el),
        roleBucket: roleBucket(el),
        selector: stableSelector(el),
        tokenCount: norm.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean).length,
        fingerprint: {
          fontFamily: familyName(cs.fontFamily),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontStyle: cs.fontStyle,
          color: cs.color,
          textDecorationLine: cs.textDecorationLine,
        },
      });
    }
    el = walker.nextNode();
  }
  return runs;
}
