/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: patients-stryker site-wide cleanup (ENT condition pages).
 *
 * Strips non-authorable site chrome (header, footer, cookie SDK, back-to-top,
 * tracking pixels) and encodes the source's gold text (span[style*=#ffb500])
 * as bold+italic so the blocks' gold-label convention picks it up.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie consent SDK / preference center — third-party chrome.
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);

    // Scene7 video-player chrome (viewer scaffolding, sprite icons, share/embed
    // dialogs). The player injects a large tree of <img src=".../s7viewers/…">
    // and <img src=".../s7sdk/…"> sprites plus email/embed/link dialogs that are
    // not authorable content. Remove the whole player subtree and any stray
    // sprite images so they don't leak into the flattened output.
    WebImporter.DOMUtils.remove(element, [
      '.s7container', '.s7videoplayer', '[id*="s7" i]', '[class*="s7videoviewer" i]',
    ]);
    element.querySelectorAll('img[src*="s7viewers" i], img[src*="s7sdk" i]').forEach((img) => {
      const wrapper = img.closest('p, picture, div') || img;
      wrapper.remove();
    });

    // Scene7 responsive pictures: the source splits an asset across a small
    // <img> (?$preset_400_235$) and a larger desktop <source> (?$preset_666_392$).
    // The importer flattens <picture> to the <img> alone, which would keep the
    // smallest preset. Promote the largest available preset onto the <img> so the
    // higher-resolution rendition survives. Preset size is read from the numbers
    // in the macro (preset_W_H / max_width_N); non-numeric presets rank lowest.
    const presetSize = (url) => {
      const m = /\$([^$]+)\$/.exec(url || '');
      if (!m) return -1;
      const nums = m[1].match(/\d+/g);
      return nums ? Math.max(...nums.map(Number)) : 0;
    };
    element.querySelectorAll('picture').forEach((picture) => {
      const img = picture.querySelector('img[src*="/is/image/" i]');
      if (!img) return;
      let best = img.getAttribute('src');
      picture.querySelectorAll('source[srcset]').forEach((source) => {
        // take the first candidate of the srcset (ignore any density/width descriptor)
        const cand = source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
        if (/\/is\/image\//i.test(cand) && presetSize(cand) > presetSize(best)) best = cand;
      });
      if (best && best !== img.getAttribute('src')) img.setAttribute('src', best);
    });

    // Gold text (span[style*="#ffb500"]) → bold+italic so the blocks' gold-label
    // convention (strong em → --color-accent) renders it gold. DA/EDS default
    // content has no color control, so bold+italic is the agreed marker.
    // Rewrite genuinely-gold spans as bold+italic. Skip a #ffb500 span whose
    // own content is overridden back to black by a nested color style (e.g. the
    // stats box wraps a black caption inside a gold span) — only the innermost
    // truly-gold run should become the gold marker. Preserve inner markup such
    // as <sup> citations (don't flatten to textContent).
    // Match gold either as hex (#ffb500) or rgb (255,181,0, with or without
    // spaces) — the source sets h2 gold via #ffb500 spans but the h1 via an
    // inline `color: rgb(255,181,0)` on the heading itself.
    const GOLD = '[style*="ffb500" i], [style*="255,181,0" i], [style*="255, 181, 0" i]';
    [...element.querySelectorAll(GOLD)].forEach((node) => {
      if (!node.isConnected) return; // already handled inside an earlier rewrite
      // effective-gold test: no descendant re-sets color to black/#000
      const overridden = node.querySelector('[style*="#000" i], [style*="rgb(0" i], [style*="black" i]');
      if (overridden) return;
      if (!node.textContent.replace(/ /g, ' ').trim()) return;

      const strong = element.ownerDocument.createElement('strong');
      const em = element.ownerDocument.createElement('em');
      // move the node's children into <em> to keep <sup>/inline markup intact
      while (node.firstChild) em.appendChild(node.firstChild);
      strong.appendChild(em);

      // Unwrap any redundant bold inside the new <em>: the source sometimes nests
      // a <b>/<strong> inside the gold span (e.g. <span gold><b>11 million</b>),
      // which would leave <strong><em><strong>…</strong></em></strong>. The outer
      // <strong> already makes it bold, so flatten inner b/strong to their contents.
      em.querySelectorAll('b, strong').forEach((inner) => {
        inner.replaceWith(...inner.childNodes);
      });

      // When gold sits on the heading element itself, keep the heading and wrap
      // only its content bold+italic (h1 gold headline). Otherwise replace the
      // gold span, climbing any bold/futura-bold wrapper that wraps ONLY it.
      if (/^H[1-6]$/.test(node.tagName)) {
        node.appendChild(strong);
        return;
      }
      let target = node;
      let parent = node.parentElement;
      while (parent
        && (parent.tagName === 'B' || parent.tagName === 'STRONG'
          || (parent.classList && parent.classList.contains('futura-bold')))
        && parent.childNodes.length === 1) {
        target = parent;
        parent = parent.parentElement;
      }
      target.replaceWith(strong);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Site header, navigation, country-switch modal, footer, back-to-top control.
    WebImporter.DOMUtils.remove(element, [
      '#header',
      'footer#footer',
      '.c-back-to-top',
    ]);

    // Auto-generated document-id / "Last Updated December/2025" chrome — distinct
    // from any authored content. The authored references list is preserved (it
    // lives in the rich-text region, not the .c-disclaimer chrome wrapper).
    WebImporter.DOMUtils.remove(element, [
      '#publishedDate',
    ]);

    // Hidden AEM helper inputs that carry no authorable content.
    WebImporter.DOMUtils.remove(element, [
      '#businessUnitTag',
      '#hiddenPublishedDate',
    ]);

    // Stray non-content elements.
    WebImporter.DOMUtils.remove(element, ['input', 'link', 'noscript']);

    // Runtime-injected marketing tracking markup (Adobe demdex/omtrdc, Marketo
    // Munchkin pixels, ad-tech beacons). Matched by tracking host, unresolved
    // marketing placeholders, or the generic off-domain empty-alt pixel shape.
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
  }
}
