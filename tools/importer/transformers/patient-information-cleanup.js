/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: patient-information page cleanup (shared by the page import and
 * the resources-fragment import).
 *
 * Strips non-authorable site chrome (header, footer, cookie consent, back-to-top,
 * auto-generated document-id / "Last Updated" line, hidden AEM inputs, marketing
 * tracking beacons) so only the authorable main content survives, then normalises
 * a few source quirks so the block parsers see a clean DOM.
 *
 * Selectors verified against migration-work/patient-information/raw-origin.html
 * (the live-rendered DOM this import runs against):
 *   - header#header .................. site header + utility nav + country switch
 *   - #onetrust-consent-sdk .......... OneTrust cookie consent SDK
 *   - footer#footer .................. site footer
 *   - .c-back-to-top ................. back-to-top control
 *   - .c-disclaimer / #publishedDate . auto-generated doc-id + "Last Updated July/2026"
 *                                      NOTE: the "Last Updated July/2026" line here IS
 *                                      authored source content on this page (it sits in
 *                                      the disclaimer region), so it is PRESERVED — see
 *                                      the afterTransform note below.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// tracking beacons injected at runtime by martech (Adobe demdex, Marketo, etc.)
const TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
const PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
const isOffDomain = (ref) => /^https?:\/\//i.test(ref)
  && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Third-party cookie consent SDK / preference center.
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);

    // Gold section labels ("Stroke awareness resources", "Understanding stroke",
    // "Regional information") render as bold + gold #ffb500 via nested spans.
    // DA/EDS default content has no colour control, so encode gold as BOLD + ITALIC
    // (***text***): rewrite each gold span to <strong><em>text</em></strong> and drop
    // the colour style + stray <br>/&nbsp;. The block parsers read these back out.
    element.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
      const text = span.textContent.replace(/ /g, ' ').trim();
      if (!text) return;
      const strong = element.ownerDocument.createElement('strong');
      const em = element.ownerDocument.createElement('em');
      em.textContent = text;
      strong.appendChild(em);
      // replace the highest bold/futura-bold wrapper around this span
      let target = span;
      let parent = span.parentElement;
      while (parent
        && (parent.tagName === 'B' || parent.tagName === 'STRONG'
          || (parent.classList && parent.classList.contains('futura-bold')))
        && parent.textContent.replace(/ /g, ' ').trim() === text) {
        target = parent;
        parent = parent.parentElement;
      }
      target.replaceWith(strong);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Site header, footer, back-to-top control.
    WebImporter.DOMUtils.remove(element, [
      '#header',
      'header#header',
      'footer#footer',
      '#footer',
      '.c-back-to-top',
      '.g-header',
    ]);

    // Auto-generated document-id chrome. The publishedDate paragraph ("Last Updated
    // July/2026") IS authored content on THIS page (part of the disclaimer block),
    // so keep it: only strip the hidden helper inputs.
    WebImporter.DOMUtils.remove(element, [
      '#businessUnitTag',
      '#hiddenPublishedDate',
      'input',
      'link',
      'noscript',
      'style',
      'script',
    ]);

    // Runtime marketing tracking markup (Adobe demdex / Marketo pixels, ID-sync
    // iframes). Match by tracking host, unresolved template placeholder, or the
    // generic off-domain empty-alt pixel shape; then drop emptied wrappers.
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
