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
  function isBoilerplate(n) {
    if (!n || n.length < minLen) return true;
    return BOILERPLATE.some((s) => n.includes(s));
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
  function stableSelector(el) {
    const tag = el.tagName.toLowerCase();
    const href = el.getAttribute && el.getAttribute('href');
    if (tag === 'a' && href && href.startsWith('#')) {
      // reference/anchor links — MUST be scoped to a block or section so the rule
      // can't leak to the same href elsewhere (e.g. footnote back-references in
      // the references list). Prefer block, then section; if neither, return null
      // (unscopable → not safely auto-fixable, reported for human handling).
      const block = el.closest('[class*="panel"],[class*="cards"],[class*="hero"]');
      if (block) {
        const cls = [...block.classList].filter((c) => /panel|cards|hero|wide|dark|cta|gold|resources|banner/.test(c)).join('.');
        if (cls) return `.${cls} a[href="${href}"]`;
      }
      const sec = el.closest('.section');
      if (sec) {
        const scls = [...sec.classList].filter((c) => c !== 'section' && !c.endsWith('-container') && !c.endsWith('-wrapper')).join('.');
        if (scls) return `.section.${scls} a[href="${href}"]`;
      }
      return null;
    }
    // block/section-scoped heading or element by tag.
    const block = el.closest('[class*="panel"],[class*="cards"],[class*="hero"]');
    if (block) {
      const cls = [...block.classList].filter((c) => /panel|cards|hero|wide|dark|cta|gold|resources|banner/.test(c)).join('.');
      if (cls) {
        if (/^h[1-6]$/.test(tag)) return `.${cls} :is(h1,h2,h3,h4,h5,h6)`;
        if (el.closest('sup')) return `.${cls} sup`;
        return `.${cls} ${tag}`;
      }
    }
    const section = el.closest('.section');
    if (section) {
      const scls = [...section.classList].filter((c) => c !== 'section' && !c.endsWith('-container')).join('.');
      if (scls) {
        if (/^h[1-6]$/.test(tag)) return `.section.${scls} :is(h1,h2,h3,h4,h5,h6)`;
        if (el.closest('sup')) return `.section.${scls} sup`;
        return `.section.${scls} ${tag}`;
      }
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
    if (norm && !isBoilerplate(norm) && visible(el)) {
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
