/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: procedure-detail cleanup (global chrome + page-specific).
 *
 * This transformer is SELF-SUFFICIENT for the procedure-detail template — it
 * deliberately does NOT reuse the legal-page's `patients-stryker-cleanup.js`.
 * That shared transformer is legal-specific and DESTRUCTIVE on this page: it
 * unconditionally demotes every <h1> to <h2> (which would strip the hero's
 * authored h1) and removes ALL `.c-disclaimer` (which on this page includes
 * the AUTHORED footnotes/references at cleaned.html line 1247, not just the
 * auto-generated "Last Updated" chrome at line 1288). It also rewrites gold
 * `[style*=ffb500]` spans and `.standalone-link` anchors that don't exist on
 * IVS pages. So the safe subset of global-chrome removal is inlined here and
 * the legal cleanup is intentionally excluded from the import registry.
 *
 * All selectors below were verified by reading migration-work/cleaned.html
 * (the balloon-kyphoplasty snapshot):
 *
 * Global chrome (afterTransform — the safe subset of the legal cleanup):
 *   - #header ...................................... line 6    (global nav)
 *   - footer#footer ................................ line 1299
 *   - #c-country-switch-modal ...................... line 261  (country switch modal, OUTSIDE the header)
 *   - #onetrust-consent-sdk ........................ (OneTrust cookie consent SDK)
 *   - .c-back-to-top ............................... line 1292 (back-to-top control)
 *   - .container.c-disclaimer.page-section ......... line 1288 (auto-generated "Last Updated May/2026" chrome ONLY — the authored footnotes at line 1247 are `.c-disclaimer.page-section` WITHOUT `.container` and are preserved)
 *   - #publishedDate / #businessUnitTag / #hiddenPublishedDate .. lines 1286-1289 (hidden AEM helper inputs)
 *   - tracking pixels/iframes (Marketo/Adobe demdex/omtrdc, ad-tech) injected at import time
 *
 * Page-specific chrome (beforeTransform):
 *   - .marketoform / .c-marketo-form ............... lines 720-721 (JS-injected lead-capture widget)
 *   - #find-a-doctor ............................... line 680  (empty jump-bar anchor target preceding the Marketo form)
 *   - #alert_4893 .................................. line 751  (Marketo "Thank you!" success alert)
 *   - .jumpbarparsys / .section-title .............. lines 679-680, 1196-1197, 1226-1227 (empty jump-bar anchor-target divs)
 *   - .localpagenavigation ......................... line 295  (empty local-page-navigation configuration box)
 *   - .curatedcta (empty ones) ..................... only the first two brochure slots carry content; empty grid slots carry none
 *
 * Page-specific chrome runs in beforeTransform (these sit inside the content
 * flow and would otherwise be seen by the block parsers / section transformer).
 * Global chrome runs in afterTransform (mirrors the shared legal cleanup timing).
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

// DEFAULT-CONTENT zones that carry inline gold/Futura emphasis in their headings
// and need it re-encoded as markup. Scoped deliberately: the block zones
// (panel, cards, hero) self-style their headings, so we must NOT touch them —
// only default content that renders through the global heading/emphasis CSS.
const EMPHASIS_ZONES = ['.cols2 > .colctrl .row > .col-sm-6:first-child'];

/**
 * Re-encode a default-content heading's inline GOLD segment into the emphasis
 * markup this project's global CSS understands (styles/styles.css): a gold span
 * (source `color:#ffb500`, kept as a `.futura-bold` wrapper after color-stripping)
 * → `<em><strong>` → gold + Futura, upright. Example: the intro h3's "minimally
 * invasive solution". Runs in beforeTransform so the markup exists before span
 * flattening. Scoped to EMPHASIS_ZONES so block-owned headings (e.g. panel-dark's
 * gold title, which panel.css already colors) are never rewritten.
 */
function encodeEmphasis(root) {
  const doc = root.ownerDocument;
  const wrapGold = (span) => {
    const em = doc.createElement('em');
    const strong = doc.createElement('strong');
    while (span.firstChild) strong.append(span.firstChild);
    em.append(strong);
    span.replaceWith(em);
  };
  EMPHASIS_ZONES.forEach((zoneSel) => {
    root.querySelectorAll(zoneSel).forEach((zone) => {
      // gold span (explicit color) OR the .futura-bold sub-segment inside a
      // heading (the color is stripped during cleaning, but .futura-bold marks
      // the same gold phrase). Only PARTIAL emphasis — skip a span that covers
      // the whole heading (those headings get their face from heading rules).
      zone.querySelectorAll('h1, h2, h3').forEach((heading) => {
        const seg = heading.querySelector('span[style*="ffb500" i], .futura-bold');
        if (!seg) return;
        if (seg.textContent.trim() === heading.textContent.trim()) return;
        if (seg.querySelector('strong, em')) return;
        wrapGold(seg);
      });
    });
  });
}

/**
 * The standalone "How it works" section heading is a default-content h3 whose
 * text is FULLY wrapped in `.futura-bold` (no gold) — i.e. the whole heading
 * renders in the Futura display face, not the global serif. DA/EDS reproduces
 * that per the project's typography contract by authoring the heading text in
 * `<strong>` (styles.css: `h3 :is(strong,b)` → display font). This heading sits
 * as a rich-text block immediately before the `.cols3` step cards, so target it
 * structurally (the preceding rich-text heading of `.cols3`) rather than by
 * page-specific text, keeping the template reusable across procedure pages.
 */
function encodeHowItWorksHeading(root) {
  const doc = root.ownerDocument;
  root.querySelectorAll('.cols3').forEach((cols3) => {
    // walk back to the nearest preceding sibling that carries a heading
    let prev = cols3.previousElementSibling;
    while (prev && !prev.querySelector('h1, h2, h3, h4')) prev = prev.previousElementSibling;
    if (!prev) return;
    const heading = prev.querySelector('h1, h2, h3, h4');
    if (!heading) return;
    const seg = heading.querySelector('.futura-bold');
    // only a FULL-heading Futura-bold wrapper (the whole title is display face);
    // skip partial/gold segments (handled by encodeEmphasis) and already-marked.
    if (!seg) return;
    if (seg.textContent.trim() !== heading.textContent.trim()) return;
    if (heading.querySelector('strong, b, em')) return;
    const strong = doc.createElement('strong');
    while (heading.firstChild) strong.append(heading.firstChild);
    heading.append(strong);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Re-encode inline gold emphasis in default-content headings as markup BEFORE
    // anything strips/flattens the spans (styles.css then paints it gold+Futura).
    encodeEmphasis(element);

    // Re-encode the full-Futura "How it works" section heading as <strong> so it
    // renders in the display face (styles.css h3 :is(strong,b)) instead of serif.
    encodeHowItWorksHeading(element);

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
    element.querySelectorAll('.cols4 .col-md-3').forEach((col) => {
      if (isEmptyPlaceholder(col)) col.remove();
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
