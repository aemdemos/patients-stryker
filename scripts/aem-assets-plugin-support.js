/*
 * AEM Assets Plugin support — enables global Dynamic Media (DM) / Scene7 image
 * handling across all blocks and default content.
 *
 * Any authored link (or img) whose URL is a Dynamic Media image is converted
 * into a responsive <picture> that keeps the original external DM source (no
 * ingest/rehost by Edge Delivery). Detection is host-independent: it matches
 * the Scene7 "/is/image/" path pattern rather than a specific hostname.
 */

const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// plugin-owned blocks (loaded via the plugin's loadBlock). None for now.
const blocks = [];

// host-independent Scene7 / Dynamic Media URL signature
const DM_URL = /\/is\/image\//i;

/**
 * Add a Scene7/DM query param to every source/img URL of a <picture>.
 * @param {Element} picture the picture element to patch
 * @param {string} key param name
 * @param {string} value param value
 */
function addDmParam(picture, key, value) {
  picture.querySelectorAll('source, img').forEach((el) => {
    const attr = el.tagName === 'SOURCE' ? 'srcset' : 'src';
    const raw = el.getAttribute(attr);
    if (!raw) return;
    const url = new URL(raw, window.location.href);
    url.searchParams.set(key, value);
    el.setAttribute(attr, url.toString());
  });
}

export default async function assetsInit() {
  const {
    loadBlock,
    createOptimizedPicture,
    decorateExternalImages,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
  } = await import(`${codeBasePath}/scripts/aem-assets.js`);

  // Scene7 upscales width but clips height to the asset's native box, distorting
  // the aspect ratio. fit=constrain keeps DM images proportional at any width.
  const renderDmPicture = (src, alt) => {
    const picture = createOptimizedPictureForDM(src, alt);
    addDmParam(picture, 'fit', 'constrain');
    return picture;
  };

  /**
   * Generic (host-independent) external DM image decoration. Replaces any
   * authored DM link/img with an optimized <picture>. Overrides the plugin's
   * prefix-based decorator so no specific hostname is hardcoded.
   * @param {Element} main the container to decorate
   */
  const decorateDmImages = (main) => {
    main.querySelectorAll('a[href], img[src]').forEach((el) => {
      const src = el.tagName === 'A' ? el.getAttribute('href') : el.getAttribute('src');
      if (!src || !DM_URL.test(src)) return;
      // for links, only convert autolinks whose visible text is the URL itself
      if (el.tagName === 'A' && el.textContent.trim() !== src) return;

      const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
      const picture = renderDmPicture(src, alt);
      el.replaceWith(picture);
    });
  };

  window.hlx.aemassets = {
    codeBasePath,
    blocks,
    loadBlock,
    createOptimizedPicture,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
    // plugin's own prefix-based decorator, kept for reference/reuse
    decorateExternalImagesByPrefix: decorateExternalImages,
    // our generic, host-independent decorator (used by decorateMain)
    decorateExternalImages: decorateDmImages,
  };
}
