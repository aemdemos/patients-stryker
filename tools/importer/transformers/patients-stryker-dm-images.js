/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: patients-stryker Dynamic Media / Scene7 images.
 *
 * Converts DM/Scene7 `<img src="DM-URL">` tags into anchors so the original
 * media-assets.stryker.com URL round-trips through docx → markdown intact
 * (a raw `<img src>` would not). This matches the convention already in the
 * migrated sibling page content/ww/en/stroke-awareness/index.plain.html, where
 * DM images are authored as anchors, e.g.
 *   <a href="https://media-assets.stryker.com/is/image/stryker/Poster-1?$max_width_1440$">WSD Poster</a>
 *
 * Client-side rendering back to <picture> is ALREADY IN PLACE in this project via
 * scripts/dm-support.js (decorateDMAssets, wired into decorateMain BEFORE
 * buildAutoBlocks). That module matches `a[href*="/is/image/"]` /
 * `a[href*="/adobe/assets/"]`, reads the anchor's display text/title as alt, and
 * renders a Scene7/OpenAPI <picture> using the authored URL (params preserved).
 * So we deliberately do NOT install the excat buildDynamicMediaImages auto-block
 * or the aem.js __dmRender__ dispatcher — this project has its own renderer and
 * adding the excat one would duplicate/conflict. This file emits anchors ONLY.
 *
 * Detection (metadata.json .images.mapping): 10 Scene7 /is/image/ URLs on
 * sa-resources (hero background, 4 brochure previews, 4 social banners). No
 * DM OpenAPI or linked-DM images on this page — every DM image is a standalone
 * unlinked <img>, so the unlinked branch below covers all of them. The linked
 * and mixed-content branches are retained for correctness on future pages.
 *
 * WHY afterTransform only: block parsers run BETWEEN beforeTransform and
 * afterTransform and extract `<img>` refs into their block cells (hero / cards
 * image cells here). Rewriting imgs to anchors in beforeTransform would leave
 * parsers with no <img> and produce empty cells. Running afterTransform lets
 * parsers build cells first; we then rewrite whatever DM imgs remain.
 *
 * NOTE ON VALIDATION: the PostToolUse hook validates against the local
 * migration-work/cleaned.html snapshot, whose <img src> values were rewritten by
 * the scraper to local ./images/<hash>.png paths — those are NOT DM URLs, so this
 * transformer is a no-op during hook validation (expected). During the real
 * import, helix-importer fetches the LIVE page where <img src> is the original
 * media-assets.stryker.com DM URL, and detectDynamicMediaUrl matches directly.
 * This is exactly why DM detection is done against metadata.json, not cleaned.html.
 */

// ---- Canonical helpers (subset; kept in sync with dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch { return false; }
  // Scene7 detected by path alone — hostname is irrelevant because customer
  // sites routinely CNAME a vanity domain to Scene7 (here:
  // media-assets.stryker.com). Keep byte-identical with dm-scene7-helpers.js.
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

// Walk up from a DM <img> through allow-listed inline wrappers (<picture>) to
// find the carrier anchor for the linked-image round-trip. Returns the outer
// <a> when the img is its sole meaningful descendant; null otherwise.
const LINKED_DM_INLINE_WRAPPER_TAGS = new Set(['PICTURE']);
const LINKED_DM_WRAPPER_SIBLING_TAGS = new Set(['SOURCE']);
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

    // Preserve alt verbatim, including empty string for decorative images.
    const alt = img.getAttribute('alt') || '';

    // Linked image (incl. parser-wrapped `<a><picture><img></picture></a>`).
    // Stash DM URL in title, keep the navigation href; textContent replaces any
    // wrapper descendants with the link text.
    const linkedAnchor = findLinkedDmCarrier(img);
    if (linkedAnchor) {
      linkedAnchor.setAttribute('title', src);
      linkedAnchor.textContent = altToLinkText(alt);
      return;
    }

    // Inside an anchor but not a sole-meaningful-child shape — mixed content.
    // No clean single-anchor markdown representation; skip and warn.
    const parent = img.parentElement;
    if (parent && parent.tagName === 'A') {
      // eslint-disable-next-line no-console
      console.warn('DM image inside mixed-content anchor, skipped:', src);
      return;
    }

    // Unlinked image (every DM image on sa-resources): create an anchor whose
    // href is the DM URL. dm-support.js renders this back to a <picture> at load.
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = altToLinkText(alt);
    img.replaceWith(a);
  });
}
