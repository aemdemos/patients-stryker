/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Dynamic Media / Scene7 IMAGE handling for the ivs-home page.
 *
 * The homepage serves its hero and pain-type card images from Scene7 IS/Image
 * (https://media-assets.stryker.com/is/image/stryker/...). This transformer swaps
 * every DM/Scene7 <img> for an anchor so the URL round-trips through markdown:
 *   - unlinked img          -> <a href="DM-URL">alt</a>
 *   - linked img (<a href="/page"><img src=DM></a>) -> <a href="/page" title="DM-URL">alt</a>
 * The companion client-side auto-block in scripts/scripts.js rebuilds these
 * anchors into responsive <picture> at render time.
 *
 * VIDEOS are NOT handled here — the ivs-home columns parser already emits the DM
 * `/is/content/` video streams as plain links (dm-support.js renders them as
 * <video>). This transformer only touches `/is/image/` (and DM OpenAPI) stills.
 *
 * Runs in afterTransform ONLY: block parsers run between the two hooks and lift
 * <img> references into block cells (hero, cards); rewriting imgs to anchors in
 * beforeTransform would leave those parsers with empty image cells.
 *
 * Helpers below are copied verbatim from the canonical dm-scene7-helpers.js (the
 * subset the transformer needs) — keep byte-identical with that source of truth.
 */

// ---- Begin canonical helpers (copy from dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch { return false; }
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

const LINKED_DM_INLINE_WRAPPER_TAGS = new Set(['PICTURE']);
const LINKED_DM_WRAPPER_SIBLING_TAGS = new Set(['SOURCE']); // standard <picture> siblings
function findLinkedDmCarrier(img) {
  if (!img || !img.parentElement) return null;
  let node = img;
  let parent = img.parentElement;
  while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
    let foundNode = false;
    for (const child of parent.children) {
      if (child === node) {
        foundNode = true;
      } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
        return null;
      }
    }
    if (!foundNode) return null;
    node = parent;
    parent = parent.parentElement;
  }
  if (!parent || parent.tagName !== 'A') return null;
  if (parent.children.length !== 1 || parent.children[0] !== node) return null;
  if (parent.textContent.trim() !== '') return null;
  return parent;
}

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function altToLinkText(alt) {
  return alt || EMPTY_ALT_SENTINEL;
}
// ---- End canonical helpers ----

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!detectDynamicMediaUrl(src)) return;

    const alt = img.getAttribute('alt') || '';

    // Linked image (incl. parser-wrapped `<a><picture><img></picture></a>`):
    // stash DM URL in title, keep the outer href.
    const linkedAnchor = findLinkedDmCarrier(img);
    if (linkedAnchor) {
      linkedAnchor.setAttribute('title', src);
      linkedAnchor.textContent = altToLinkText(alt);
      return;
    }

    // Inside an anchor but not a sole-meaningful-child shape — mixed content.
    const parent = img.parentElement;
    if (parent && parent.tagName === 'A') {
      // eslint-disable-next-line no-console
      console.warn('DM image inside mixed-content anchor, skipped:', src);
      return;
    }

    // Unlinked image: create an anchor whose href is the DM URL.
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = altToLinkText(alt);
    img.replaceWith(a);
  });
}
