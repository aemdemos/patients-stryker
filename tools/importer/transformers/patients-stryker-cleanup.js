/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: patients-stryker site-wide cleanup.
 *
 * Strips non-authorable site chrome so the import contains only the
 * authorable rich-text reading column that lives inside #aem-specific-data.
 *
 * All selectors below were verified against migration-work/cleaned.html:
 *   - <header id="header" class="g-header"> ............. line 6  (incl. utility nav + #c-country-switch-modal)
 *   - <div id="onetrust-consent-sdk"> .................... line 307 (OneTrust cookie consent SDK)
 *   - <footer id="footer" class="footer"> ............... line 253
 *   - <div class="c-back-to-top ..."> ................... line 246 (back-to-top button)
 *   - <div class="container c-disclaimer page-section"> . line 242 (auto-generated "Last Updated December/2025" doc-id line)
 *   - <p id="publishedDate"> ............................ line 243 (auto-generated document id, NOT the authored "Last Updated: February 2025")
 *   - hidden AEM inputs #businessUnitTag / #hiddenPublishedDate lines 240-241, #indexUrl / #hdnRunMode / #hdnShow* etc. inside header
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  // The sa-resources template shares this site-wide cleanup, but a handful of the
  // behaviours below are specific to the /legal/ long-form text pages and would
  // corrupt sa-resources: (a) the ".c-disclaimer" removal (on legal it strips the
  // auto "Last Updated" chrome, but on sa-resources ".c-disclaimer" holds the
  // AUTHORABLE disclaimer paragraphs — lines 880-887 of that page's cleaned.html),
  // and (b) the h1->h2 title demotion (sa-resources authors its hero title as an
  // <h1>, matching the migrated index.plain.html hero). The gold-label / paragraph-
  // merge / standalone-link rewrites are likewise legal-copy formatting. Guard all of
  // them so ONLY the truly universal chrome removal runs on sa-resources; legal-page
  // behaviour is unchanged (isSaResources is false whenever the template isn't
  // sa-resources, including the current legal import).
  const isSaResources = !!(payload && payload.template && payload.template.name === 'sa-resources');

  if (hookName === TransformHook.beforeTransform) {
    // Cookie consent SDK / preference center - third-party chrome (cleaned.html line 307).
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);

    if (isSaResources) {
      // sa-resources gold CTA: the source renders "Download the full kit" as a filled
      // gold button — <a class="btn btn-gold" href=".../Stroke-Awareness-Full-Kit.zip">
      // (cleaned.html line 244). The project has no color/button control in default
      // content, so gold CTAs are encoded as a BOLD + ITALIC link: decorateButtons()
      // (scripts.js) promotes a `p a` whose anchor is wrapped in BOTH <strong> and <em>
      // to `.button.accent` (the gold button). Wrap the ANCHOR ITSELF (strong>em>a) so
      // a.closest('strong') and a.closest('em') are both truthy — the opposite of the
      // legal standalone-link case, which wraps the anchor's CONTENTS to AVOID buttonizing.
      // Drop the source btn* classes so no stale styling hooks survive the round-trip.
      element.querySelectorAll('a.btn-gold').forEach((a) => {
        if (a.closest('em') && a.closest('strong')) return; // idempotent
        a.removeAttribute('class');
        const strong = element.ownerDocument.createElement('strong');
        const em = element.ownerDocument.createElement('em');
        a.replaceWith(strong);
        strong.appendChild(em);
        em.appendChild(a);
      });
      return; // remaining beforeTransform work is legal-copy formatting only
    }

    // Gold section labels ("Introduction", "Scope", ...) render as bold + gold #ffb500
    // (source: <span style="color:#ffb500"> nested in a bold/futura-bold wrapper).
    // DA/EDS default content has no color control, so we encode gold as BOLD + ITALIC:
    // rewrite each gold span to <strong><em>text</em></strong> and drop the color style,
    // stray <br>, and &nbsp; so WebImporter emits a clean ***label*** markdown token.
    // Black bold labels have no #ffb500 span and are left untouched (stay **bold**).
    element.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
      const text = span.textContent.replace(/ /g, ' ').trim();
      if (!text) return;
      const strong = element.ownerDocument.createElement('strong');
      const em = element.ownerDocument.createElement('em');
      em.textContent = text;
      strong.appendChild(em);
      // Replace the highest bold/futura-bold wrapper around this span to avoid nested/duplicate emphasis.
      let target = span;
      let parent = span.parentElement;
      while (parent
        && (parent.tagName === 'B' || parent.tagName === 'STRONG'
          || (parent.classList && parent.classList.contains('futura-bold')))
        && parent.textContent.replace(/ /g, ' ').trim() === text) {
        target = parent;
        parent = parent.parentElement;
      }
      // Source puts each gold label on its own line — the line break appears either
      // nested INSIDE the gold span (stripped above via textContent) or as a <br>
      // SIBLING right after the wrapper. Ensure exactly ONE <br> follows the label:
      // only add one when the next sibling isn't already a <br> (otherwise Scope-type
      // labels, which keep their sibling <br>, would get a doubled empty line).
      let next = target.nextSibling;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
      const alreadyHasBr = next && next.nodeType === 1 && next.tagName === 'BR';
      if (alreadyHasBr) {
        target.replaceWith(strong);
      } else {
        target.replaceWith(strong, element.ownerDocument.createElement('br'));
      }
    });

    // Some labels ("Updates to Privacy Statement", "Contact") sit in their OWN
    // paragraph in the source (`<p>label<br></p>` followed by a separate `<p>body</p>`),
    // unlike the inline labels (`<p>label<br>body</p>`). Left as-is these import as two
    // paragraphs with a full paragraph gap (an empty line). Merge a label-only paragraph
    // into the following paragraph so it renders like the other labels: label + <br> + body.
    [...element.querySelectorAll('p')].forEach((p) => {
      // meaningful children = elements + non-empty text nodes, ignoring <br>
      const kids = [...p.childNodes].filter((n) => {
        if (n.nodeType === 3) return n.textContent.trim() !== '';
        if (n.nodeType === 1 && n.tagName === 'BR') return false;
        return n.nodeType === 1;
      });
      if (kids.length !== 1) return;
      const only = kids[0];
      const isLabel = only.nodeType === 1
        && (only.tagName === 'B' || only.tagName === 'STRONG'
          || (only.classList && only.classList.contains('futura-bold')));
      if (!isLabel) return;
      const nextP = p.nextElementSibling;
      if (!nextP || nextP.tagName !== 'P') return;
      // move the label to the front of the next paragraph, followed by a <br>
      nextP.insertBefore(element.ownerDocument.createElement('br'), nextP.firstChild);
      nextP.insertBefore(only, nextP.firstChild);
      p.remove();
    });

    // Standalone callout links (span.standalone-link > a — the all-caps
    // "FOR ADDITIONAL INFORMATION ABOUT OUR USE OF COOKIES…" and California notice)
    // render BOLD teal text in the source (NOT a filled button).
    // Wrap the anchor's CONTENTS in <strong> ( <a><strong>text</strong></a> ), not the
    // anchor itself: EDS decorateButtons checks a.closest('strong'), which is null when
    // strong is a child, so the link is NOT auto-converted into a button — it stays a
    // bold (Futura 700) teal link, matching the source.
    element.querySelectorAll('.standalone-link a').forEach((a) => {
      if (a.querySelector('strong')) return;
      const strong = element.ownerDocument.createElement('strong');
      while (a.firstChild) strong.appendChild(a.firstChild);
      a.appendChild(strong);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Site header, navigation, country-switch modal (cleaned.html lines 6-94),
    // footer (line 253), back-to-top control (line 246).
    WebImporter.DOMUtils.remove(element, [
      '#header',
      'footer#footer',
      '.c-back-to-top',
    ]);

    if (isSaResources) {
      // sa-resources authors its legal/educational disclaimer paragraphs inside
      // ".c-disclaimer" (cleaned.html lines 880-887) — that is AUTHORABLE content and
      // must survive (it becomes the trailing "compact" disclaimer section). The
      // "Last Updated December/2025" line (`p#publishedDate`, line 892) is
      // auto-generated document chrome, not authored disclaimer copy, so strip it.
      WebImporter.DOMUtils.remove(element, ['#publishedDate']);
    } else {
      // Legal pages: ".c-disclaimer" only ever holds the auto-generated document-id /
      // "Last Updated December/2025" chrome (lines 242-244), distinct from the authored
      // "Last Updated: February 2025" paragraph inside the rich-text region. Strip it all.
      WebImporter.DOMUtils.remove(element, [
        '.c-disclaimer',
        '#publishedDate',
      ]);
    }

    // Hidden AEM helper inputs that carry no authorable content (lines 240-241).
    WebImporter.DOMUtils.remove(element, [
      '#businessUnitTag',
      '#hiddenPublishedDate',
    ]);

    // Empty leftover disclaimer wrapper (lines 235-238) plus any stray inputs/links/noscript.
    WebImporter.DOMUtils.remove(element, ['input', 'link', 'noscript']);

    // Runtime-injected marketing tracking markup (Marketo Munchkin pixels, Adobe
    // demdex / Adobe ID syncing iframes). These are NOT present in the static
    // cleaned.html — they are added by martech scripts during a live headless
    // import — so they must be matched by their tracking domains at import time.
    // Remove images/anchors pointing at known tracking hosts, then drop any
    // now-empty wrapper paragraphs they leave behind.
    // Match iframes too: WebImporter's built-in rules convert tracking <iframe>
    // elements into anchors AFTER this transformer runs, so at afterTransform
    // time the Adobe ID / demdex sync beacon is still an <iframe src="...">.
    // Two signals identify these beacons:
    //  1. Known tracking hosts (Adobe demdex/omtrdc, Marketo Munchkin, ad-tech pixels).
    //  2. Unresolved marketing template placeholders in the URL ({{Page_URL}},
    //     ${GPP_STRING}) — real content images never contain these.
    // Three signals identify these beacons (any one triggers removal):
    //  1. Known tracking hosts (Adobe demdex/omtrdc, Marketo, ad-tech pixels).
    //  2. Unresolved marketing template placeholders ({{Page_URL}}, ${GPP_STRING}).
    //  3. An off-domain <img> with empty alt — the generic tracking-pixel shape.
    //     (Legitimate content images on these legal pages are on-domain / aem.page
    //     and carry alt text; there are no decorative inline images to protect.)
    const TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
    const PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
    const isOffDomain = (ref) => /^https?:\/\//i.test(ref) && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);
    element.querySelectorAll('img[src], a[href], iframe[src], iframe[data-src]').forEach((node) => {
      const ref = node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src') || '';
      const isPixel = node.tagName === 'IMG' && !node.getAttribute('alt') && isOffDomain(ref);
      if (TRACKING_HOST_RE.test(ref) || PLACEHOLDER_RE.test(ref) || isPixel) {
        const wrapper = node.closest('p, picture, div') || node;
        wrapper.remove();
      }
    });
    element.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
    });

    // Normalise the page title to <h2>. Most legal pages author the title as an
    // <h2> already, but a few use a native <h1>. Demote any <h1> to <h2> so every
    // legal page title is consistently an <h2>.
    // sa-resources is exempt: it authors its hero title as an <h1> ("Resources"),
    // matching the migrated stroke-awareness index hero, so its <h1> must be preserved.
    if (isSaResources) return;
    element.querySelectorAll('h1').forEach((h1) => {
      const h2 = element.ownerDocument.createElement('h2');
      [...h1.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
      while (h1.firstChild) h2.appendChild(h1.firstChild);
      h1.replaceWith(h2);
    });
  }
}
