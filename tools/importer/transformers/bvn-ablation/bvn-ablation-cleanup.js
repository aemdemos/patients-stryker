/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: bvn-ablation cleanup (global chrome + page-specific).
 *
 * Copied from transformers/procedure-detail/procedure-detail-cleanup.js and
 * adapted to basivertebral-nerve-ablation.html, so later changes to the
 * procedure-detail template can't alter this page's re-import. Like that file it
 * deliberately does NOT use the legal-page patients-stryker-cleanup.js (which
 * demotes every <h1> and removes the authored `.c-disclaimer` footnotes).
 *
 * Differences from the procedure-detail copy:
 *   - emphasis normalization covers EVERY content heading (this page has more
 *     heading zones: dark band, symptoms box, How it works, What you can expect,
 *     risks) — safe because the decision is driven by the leaf's computed style;
 *   - empty rich-text shells (the `&nbsp;` paragraph under the video) and the
 *     empty `.cols` spacer rows are dropped;
 *   - empty-slot removal in `.cols4` is limited to the Resources tabs grid.
 *
 * Page-specific chrome runs in beforeTransform (it sits inside the content flow
 * and would otherwise reach the block parsers / section transformer); global
 * chrome runs in afterTransform.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Runtime-injected marketing/tracking hosts (Adobe demdex/omtrdc, Marketo
// Munchkin, ad-tech pixels) — not in the static cleaned.html but added by
// martech scripts during a live headless import. Matched by host / unresolved
// template placeholder / generic off-domain empty-alt pixel shape.
const TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
const PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
const isOffDomain = (ref) => /^https?:\/\//i.test(ref)
  && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);

/**
 * True when an element carries no authorable content: no media/link
 * descendants and no non-whitespace text. Used to remove only the EMPTY
 * placeholder slots in the Resources grid, never a slot with a real
 * brochure image / "Learn more" link.
 */
function isEmptyPlaceholder(el) {
  if (el.querySelector('img, picture, a, iframe, video, h1, h2, h3, h4, h5, h6')) return false;
  return el.textContent.replace(/ /g, ' ').trim() === '';
}

// The gold accent (--color-accent: #ffb500) in the rgb form getComputedStyle returns.
const GOLD_RGB = 'rgb(255, 181, 0)';

/**
 * Resolve the heading elements whose inline typography must be re-encoded as
 * emphasis markup: every content heading except the hero (its parser rebuilds
 * the headline) and the footnotes. The decision per text run is made by
 * classifyLeaf from the COMPUTED style, so a serif heading stays plain.
 */
function collectEmphasisHeadings(root) {
  return [...root.querySelectorAll('h1, h2, h3, h4')]
    .filter((h) => !h.closest('.fullWidthImageHero, .c-disclaimer, .tabs-nav'));
}

/**
 * Map a text run's deepest styled leaf to the project's typography contract,
 * reading what the SOURCE ACTUALLY RENDERS rather than guessing from class names
 * or inline styles (which higher-specificity site rules routinely override — the
 * dark band's leaf carries inline `color:#ffffff` yet computes teal). Only two
 * properties round-trip through DA/EDS markup, so only these are classified:
 *   - gold accent  → `<em><strong>` (styles.css: `h* em strong` → gold + Futura)
 *   - Futura, non-gold → `<strong>`  (styles.css: `h* :is(strong,b)` → display face)
 *   - serif / normal  → plain (leave; base color/size come from block/template CSS)
 *
 * `win.getComputedStyle` is the source of truth in the browser import (the
 * document is live and un-cloned — verified in html2md). Under jsdom (offline
 * validation / no author stylesheets) computed values are empty, so fall back to
 * the class-name / inline-color heuristic to stay useful there.
 * @returns {'em-strong'|'strong'|'plain'}
 */
function classifyLeaf(el, win) {
  let family = '';
  let color = '';
  if (win && typeof win.getComputedStyle === 'function') {
    const cs = win.getComputedStyle(el);
    family = (cs.fontFamily || '').trim();
    color = (cs.color || '').replace(/\s+/g, ' ').trim();
  }

  let isFutura;
  let isGold;
  if (family) {
    isFutura = /futura/i.test(family);
    isGold = color === GOLD_RGB;
  } else {
    // jsdom fallback: no computed styles — infer from source markup.
    isFutura = !!el.closest('.futura-bold') || /futura/i.test(el.getAttribute('style') || '');
    isGold = !!el.closest('[style*="ffb500" i]') || /ffb500/i.test(el.getAttribute('style') || '');
  }

  if (isGold) return 'em-strong'; // gold is the accent signal (always Futura on this site)
  if (isFutura) return 'strong';
  return 'plain';
}

/**
 * Wrap a single text node in the contract markup for its decision.
 * `em-strong` → `<em><strong>text</strong></em>` (gold + Futura);
 * `strong`    → `<strong>text</strong>` (Futura). Spans flatten to text during
 * md conversion, so wrapping the text node itself is precise and sufficient.
 */
function wrapTextNode(textNode, decision, doc) {
  const strong = doc.createElement('strong');
  strong.textContent = textNode.textContent;
  let outer = strong;
  if (decision === 'em-strong') {
    const em = doc.createElement('em');
    em.append(strong);
    outer = em;
  }
  textNode.replaceWith(outer);
}

/**
 * Re-encode inline gold/Futura typography as emphasis markup, segment-aware and
 * driven by the COMPUTED style of each text run's deepest leaf. Replaces the old
 * class-name `encodeEmphasis` + `encodeHowItWorksHeading` heuristics: it handles
 * partial emphasis (intro's gold sub-phrase), whole-heading Futura (How it works),
 * and the per-page-varying dark band from one code path. Runs in beforeTransform
 * so the markup exists before span flattening and before the block parsers lift
 * the headings into cells.
 */
function normalizeEmphasis(root) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  collectEmphasisHeadings(root).forEach((heading) => {
    // Gather text runs first (wrapping mutates the tree as we go).
    const walker = doc.createTreeWalker(heading, 0x4 /* SHOW_TEXT */);
    const runs = [];
    let node = walker.nextNode();
    while (node) {
      if (node.textContent.trim()) runs.push(node);
      node = walker.nextNode();
    }
    runs.forEach((run) => {
      const host = run.parentElement;
      if (!host) return;
      if (host.closest('em, strong')) return; // already contract-marked
      // Skip footnote reference markers and any link text: a <sup> or an anchor
      // (the references point to #disclaimer, e.g. a superscript "11" or a bare
      // "*") is never typographic emphasis. Wrapping it in <strong>/<em> both
      // mis-styles it and emits stray "**" in the markdown. Link emphasis (the
      // contract that turns a link into a button) is handled by decorateButtons,
      // not here; the gold phrases we DO want to wrap are plain spans, not links.
      if (host.closest('sup, a')) return;
      const decision = classifyLeaf(host, win);
      if (decision === 'plain') return;
      wrapTextNode(run, decision, doc);
    });
  });
}

/**
 * Normalize citation superscripts to a BARE `<sup>` (drop the wrapping
 * `#disclaimer` reference anchor). Source markup is `<sup><a href="#disclaimer">
 * 1-5</a></sup>`, but the md round-trip inverts it to `<a href="#disclaimer">
 * <sup>1-5</sup></a>`. Left as-is, the runtime `decorateFootnotes` (scripts.js)
 * splits "1-5" into per-number `#fn-N` links INSIDE the outer `#disclaimer`
 * anchor — nested anchors (invalid) that render as broken split links. Stripping
 * the citation anchor leaves a bare `<sup>1-5</sup>`, which decorateFootnotes then
 * turns into clean footnote links (matching how balloon-kyphoplasty already works).
 * Scoped to anchors whose href is exactly the on-page `#disclaimer` reference so
 * real content links are untouched.
 */
function normalizeCitationSups(root) {
  root.querySelectorAll('a[href="#disclaimer"]').forEach((a) => {
    // Only unwrap when the anchor is purely a citation marker (wraps a <sup>, or
    // sits inside one). Replace the anchor with its children, preserving the <sup>.
    const inSup = a.closest('sup');
    const wrapsSup = a.querySelector('sup');
    if (!inSup && !wrapsSup) return;
    // Only unwrap DIGIT citations. The nested-anchor breakage this guards against
    // is digit-specific: decorateFootnotes splits "1-5" into per-number #fn-N links
    // and would nest them inside a surviving outer anchor. Symbol markers (*, †)
    // carry no digits, so decorateFootnotes never splits them — keep their anchor
    // so the reference styling (sup a:any-link / a[href="#disclaimer"]) applies.
    if (!/\d/.test(a.textContent || '')) return;
    a.replaceWith(...a.childNodes);
  });
}

/**
 * Normalize footnote-SYMBOL reference markers (`*`, `†`, `‡`, `§`, `¶`) that the
 * source authors as an inline LINK inside a gold heading phrase. Two things break
 * on import (verified on radiofrequency-ablation, the "*" after "back and neck
 * pain"):
 *
 *   1. The href is mangled from `#disclaimer` to the site root `/` by the markdown
 *      round-trip — so the marker both navigates to the homepage (a real bug) and
 *      escapes every reference styling rule keyed on `#disclaimer` / `#fn-*`.
 *   2. The marker lands as a SIBLING of the phrase's `<strong>` inside the gold
 *      `<em>` (`em > strong` + `em > a`), so it misses the `em strong` heading
 *      emphasis rule (Futura 700, heading size) and falls back to the heading's
 *      serif face + the default link underline.
 *
 * The SOURCE renders this marker at full heading size, Futura bold, teal, no
 * underline — i.e. it inherits the gold heading's emphasis treatment, only
 * recoloured teal by the link colour. It is NOT a small superscript. So the
 * faithful fix is structural, not a size hack: re-point the href at `#disclaimer`
 * and, when the marker is a trailing sibling of a `<strong>` inside an `<em>`,
 * move it INSIDE that `<strong>` so `em strong` supplies Futura + size while the
 * existing `a[href="#disclaimer"]` rule supplies teal + no-underline. Scoped to
 * pure symbol strings so real content links (which contain words) are untouched.
 */
function normalizeSymbolRefs(root) {
  const SYMBOL_RE = /^[*†‡§¶]+$/;
  root.querySelectorAll('a').forEach((a) => {
    if (!SYMBOL_RE.test((a.textContent || '').trim())) return;
    // Re-point the mangled root href at the on-page disclaimer reference so the
    // reference styling rules recognise it as a citation marker.
    a.setAttribute('href', '#disclaimer');
    // If the marker sits inside a gold `<em>` as a sibling of the phrase's
    // `<strong>`, relocate it to the end of that `<strong>` so it inherits the
    // heading's Futura + size emphasis (matching the source). Skip when it is
    // already inside a strong or a sup.
    if (a.closest('strong, sup')) return;
    const em = a.closest('em');
    if (!em) return;
    const strong = [...em.querySelectorAll('strong')].pop();
    if (strong) strong.append(a);
  });
}

/**
 * Keep a trailing reference marker on the same line as the gold intro phrase.
 * The intro heading's gold segment is wrapped in `<em>` (by normalizeEmphasis)
 * and the template CSS gives that `<em>` `display: block` so the gold phrase
 * drops to its own line — matching the source, where line 2 is e.g.
 * "restorative solution¹". But the reference marker (a `<sup>` or a bare
 * `#disclaimer`/footnote `*` link) sits as a SIBLING right after the `<em>`, so
 * the block `<em>` strands it on the next line (and its `position:relative` sup
 * overlaps the following text). Move a marker that immediately follows the gold
 * `<em>` INSIDE that `<em>` so the phrase and its reference stay together on one
 * line, as authored. Scoped to the intro default-content column.
 */
function keepRefWithGoldLine(root) {
  const isMarker = (el) => el && el.nodeType === 1
    && (el.tagName === 'SUP' || (el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('#')));
  const intro = '.cols2:has(.dimensional-box) .row > .col-sm-6:first-child';
  root.querySelectorAll(`${intro} h1, ${intro} h2, ${intro} h3`).forEach((heading) => {
    const gold = [...heading.querySelectorAll('em')].pop();
    if (!gold) return;
    // Absorb consecutive trailing markers (e.g. a sup, or a "*" link) into the em.
    let next = gold.nextSibling;
    while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling; // skip whitespace
    while (isMarker(next)) {
      const after = next.nextSibling;
      gold.append(next);
      next = after;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
    }
  });
}

/**
 * Re-point the in-page "Potential risks" link. The source targets an empty
 * jump-bar anchor (`#potential-risks`, a `.section-title` div removed below);
 * on EDS the only anchor is the id generated from the risks heading's text, so
 * point the link there (same slug rule as the rendered heading ids).
 */
function retargetRisksLink(root) {
  const heading = root.querySelector('.bg-lighter-gray h4, .bg-lighter-gray h3');
  if (!heading) return;
  const slug = heading.textContent.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ’']/g, '')
    .replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');
  root.querySelectorAll('a[href="#potential-risks"]').forEach((a) => a.setAttribute('href', `#${slug}`));
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    retargetRisksLink(element);

    // Re-encode inline gold/Futura typography as emphasis markup BEFORE anything
    // strips/flattens the spans. Driven by the COMPUTED style of each heading's
    // deepest leaf (styles.css then paints em-strong gold+Futura, strong Futura).
    // Covers the intro gold sub-phrase, the full-Futura "How it works" heading,
    // and the per-page-varying dark evidence band from one code path.
    normalizeEmphasis(element);

    // Citation superscripts → bare <sup> (drop the #disclaimer reference anchor)
    // so the runtime footnote decoration produces clean links, not nested anchors.
    normalizeCitationSups(element);

    // Keep a trailing reference marker on the same line as the gold intro phrase
    // (the block-display <em> would otherwise strand the sup/ref on the next line).
    // This ALSO pulls a trailing symbol-link marker (the "*") INTO the gold <em>,
    // which normalizeSymbolRefs (next) then relocates into the phrase's <strong>.
    keepRefWithGoldLine(element);

    // Symbol reference markers (*, †, ‡ …) that the source authored as an inline
    // link in a gold heading phrase → re-point at #disclaimer and, once inside the
    // gold <em> (moved there by keepRefWithGoldLine above), relocate into the
    // phrase's <strong> so they inherit the source's Futura emphasis instead of
    // the heading's serif face + the default link underline. Runs LAST so the
    // marker is already inside the <em> when it looks for the <strong>.
    normalizeSymbolRefs(element);

    // Marketo lead-capture "Find a doctor" form that follows the gold CTA.
    // JS-injected widget, not authorable content. #find-a-doctor is the
    // empty jump-bar anchor target immediately preceding it; #alert_4893 is
    // the form's success-message node.
    WebImporter.DOMUtils.remove(element, [
      '.marketoform',
      '.c-marketo-form',
      '#find-a-doctor',
      '#alert_4893',
    ]);

    // Sticky jump-bar sub-navigation anchor targets (#find-a-doctor,
    // #potential-risks, #disclaimer). These render as an on-page jump bar
    // on the live site and are empty anchor-only divs in the source — not
    // authorable content.
    WebImporter.DOMUtils.remove(element, [
      '.jumpbarparsys',
      '.section-title',
    ]);

    // Empty "local page navigation" configuration box (site chrome slot).
    WebImporter.DOMUtils.remove(element, ['.localpagenavigation']);

    // Decorative source separators: the live page draws a thin rule between the
    // evidence band and "How it works" via `.sectionseparator > hr.section-separator`.
    // The section transformer anchors the how-it-works break at `.sectionseparator`
    // (inserting its own <hr> before it), so drop the inner decorative <hr> to
    // avoid a doubled section break — but KEEP the `.sectionseparator` wrapper as
    // the break anchor.
    element.querySelectorAll('.sectionseparator hr, hr.section-separator').forEach((hr) => hr.remove());

    // Resources tabs chrome: the Resources zone is wrapped in a single-tab
    // `c-tabs` widget. The visible content is the one tab-content panel; the
    // tab navigation (`.tabs-nav`, empty `ul.tab`) is JS chrome that otherwise
    // imports as a stray empty list after the "Resources" heading.
    WebImporter.DOMUtils.remove(element, ['.tabs-nav']);

    // Empty curatedcta placeholder slots in the Resources grid. Only the
    // slots with a real brochure image + "Learn more" link are authorable;
    // remove the empty placeholder curatedcta blocks and empty grid columns
    // so the cards-resources parser doesn't emit empty brochure cards.
    // Guarded by isEmptyPlaceholder so populated slots are never touched.
    element.querySelectorAll('.curatedcta').forEach((cta) => {
      if (isEmptyPlaceholder(cta)) cta.remove();
    });
    element.querySelectorAll('.tabs .cols4 .col-md-3').forEach((col) => {
      if (isEmptyPlaceholder(col)) col.remove();
    });

    // Empty rich-text shells (e.g. the `<p><br>&nbsp;</p>` under the dark-band
    // video) and the empty full-width `.cols` spacer rows between components.
    element.querySelectorAll('.text.parbase, .cols').forEach((el) => {
      if (isEmptyPlaceholder(el)) el.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global site chrome (nav, country modal, footer, back-to-top, cookie SDK).
    WebImporter.DOMUtils.remove(element, [
      '#header',
      '#c-country-switch-modal',
      'footer#footer',
      '.c-back-to-top',
      '#onetrust-consent-sdk',
    ]);

    // Auto-generated document-id / "Last Updated May/2026" chrome. This is the
    // `.container.c-disclaimer.page-section` at line 1288 — NOT the authored
    // footnotes/references at line 1247 (which are `.c-disclaimer.page-section`
    // WITHOUT `.container`, and are preserved as section-7 default content).
    WebImporter.DOMUtils.remove(element, [
      '.container.c-disclaimer.page-section',
      '#publishedDate',
    ]);

    // Hidden AEM helper inputs that carry no authorable content.
    WebImporter.DOMUtils.remove(element, [
      '#businessUnitTag',
      '#hiddenPublishedDate',
    ]);

    // Any stray leftover inputs / stylesheet links / noscript.
    WebImporter.DOMUtils.remove(element, ['input', 'link', 'noscript']);

    // Runtime-injected marketing tracking markup (Marketo Munchkin pixels,
    // Adobe demdex / Adobe ID syncing iframes). Match by known tracking host,
    // unresolved marketing template placeholder, or the generic off-domain
    // empty-alt tracking-pixel shape, then drop any now-empty wrapper.
    element.querySelectorAll('img[src], a[href], iframe[src], iframe[data-src]').forEach((node) => {
      const ref = node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src') || '';
      const isPixel = node.tagName === 'IMG' && !node.getAttribute('alt') && isOffDomain(ref);
      if (TRACKING_HOST_RE.test(ref) || PLACEHOLDER_RE.test(ref) || isPixel) {
        const wrapper = node.closest('p, picture, div') || node;
        wrapper.remove();
      }
    });
  }
}
