/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ivs-home cleanup (page-specific + global chrome).
 *
 * Self-sufficient for the ivs-home singleton — it does NOT reuse the legal-page
 * `patients-stryker-cleanup.js` (that transformer demotes <h1>→<h2>, which would
 * strip the hero headline, and removes all `.c-disclaimer`, which here includes
 * the AUTHORED footnotes/references we keep). The safe subset of global-chrome
 * removal is inlined below.
 *
 * Selectors verified against migration-work/cleaned.html (the IVS homepage snapshot):
 *
 * Page-specific chrome (beforeTransform — sits in the content flow, so it must be
 * gone before the block parsers / section transformer see it):
 *   - .tabs / .c-tabs .................. Resources brochure widget — DEFERRED this
 *                                        pass (an incoming block will handle it);
 *                                        removed so the cards parser never picks up
 *                                        its `.cols4` brochures.
 *   - .c-navigation-bar .menu-trigger .. mobile menu toggle ("X") chrome.
 *   - .c-navigation-bar h3.page-title .. duplicate page-title heading in the nav bar.
 *   - .jumpbarparsys / .section-title .. empty in-page anchor-target divs (the
 *                                        #overview/#testimonials/… markers). The
 *                                        section anchors are re-created as
 *                                        `data-anchor` Section Metadata, so these
 *                                        source markers are redundant.
 *   - .c-full-bleed-panel.bg-gray ...... empty gray spacer band between the
 *                                        testimonials and the "find a doctor" CTA.
 *   - .localpagenavigation ............. empty local-page-navigation config box.
 *
 * The Marketo form scaffold (.marketoform) is NOT removed here — the ivs-home
 * marketo transformer (which runs before this one) reads its identifiers and
 * replaces it in place with an authored `marketo-form` block.
 *
 * Global chrome (afterTransform — mirrors the shared legal cleanup timing):
 *   - #header / footer#footer / .c-back-to-top / #onetrust-consent-sdk /
 *     #c-country-switch-modal
 *   - .container.c-disclaimer.page-section + #publishedDate .. auto-generated
 *     "Last Updated May/2026" chrome ONLY (the authored footnotes/references are
 *     `.c-disclaimer.page-section` WITHOUT `.container`, and are preserved).
 *   - #businessUnitTag / #hiddenPublishedDate .. hidden AEM helper inputs.
 *   - stray input / link / noscript, and runtime tracking pixels/iframes.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Runtime-injected marketing/tracking hosts (Adobe demdex/omtrdc, Marketo
// Munchkin, ad-tech pixels) — added by martech during a live headless import.
const TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
const PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
const isOffDomain = (ref) => /^https?:\/\//i.test(ref)
  && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);

/**
 * Normalize citation superscripts to a BARE `<sup>` (drop the wrapping
 * `#disclaimer` reference anchor). Source markup is `<a href="#disclaimer">
 * <sup>1*</sup></a>` (statistics + intro references); left as-is the runtime
 * decorateFootnotes would nest per-number links inside the surviving anchor.
 * Stripping the citation anchor leaves a bare `<sup>` the runtime decorates cleanly.
 * Scoped to digit-bearing `#disclaimer` markers so symbol markers (*, †) and real
 * content links are untouched.
 */
function normalizeCitationSups(root) {
  root.querySelectorAll('a[href="#disclaimer"]').forEach((a) => {
    const inSup = a.closest('sup');
    const wrapsSup = a.querySelector('sup');
    if (!inSup && !wrapsSup) return;
    if (!/\d/.test(a.textContent || '')) return;
    a.replaceWith(...a.childNodes);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Citation superscripts → bare <sup> so runtime footnote decoration is clean.
    normalizeCitationSups(element);

    // Deferred Resources brochure widget — remove entirely so the cards parser
    // never picks up its `.cols4` brochures (this pass excludes Resources).
    WebImporter.DOMUtils.remove(element, ['.tabs', '.c-tabs']);

    // Nav-bar chrome that must not survive next to the sticky-nav block.
    element.querySelectorAll('.c-navigation-bar .menu-trigger, .c-navigation-bar h3.page-title').forEach((el) => el.remove());

    // Empty in-page anchor-target markers (anchors re-created via Section Metadata).
    WebImporter.DOMUtils.remove(element, ['.jumpbarparsys', '.section-title']);

    // Empty gray spacer band between testimonials and the find-a-doctor CTA.
    element.querySelectorAll('.c-full-bleed-panel.bg-gray').forEach((el) => {
      (el.closest('.fullbleedpanel') || el).remove();
    });

    // Empty local-page-navigation configuration box.
    WebImporter.DOMUtils.remove(element, ['.localpagenavigation']);
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

    // Auto-generated "Last Updated May/2026" chrome — the `.container.c-disclaimer.
    // page-section`, NOT the authored footnotes/references (which are
    // `.c-disclaimer.page-section` WITHOUT `.container`, preserved as content).
    WebImporter.DOMUtils.remove(element, [
      '.container.c-disclaimer.page-section',
      '#publishedDate',
    ]);

    // Hidden AEM helper inputs.
    WebImporter.DOMUtils.remove(element, ['#businessUnitTag', '#hiddenPublishedDate']);

    // Stray leftover inputs / stylesheet links / noscript.
    WebImporter.DOMUtils.remove(element, ['input', 'link', 'noscript']);

    // Runtime-injected marketing tracking markup (Munchkin pixels, demdex/ID
    // sync iframes). Match by known tracking host, unresolved template
    // placeholder, or the generic off-domain empty-alt tracking-pixel shape.
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
