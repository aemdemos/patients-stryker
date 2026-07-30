/*
 * AEM Assets Plugin support — enables global Dynamic Media (DM) image handling
 * across all blocks and default content.
 *
 * Any authored link (or img) whose URL is a Dynamic Media image is converted
 * into a responsive <picture> that keeps the original external DM source (no
 * ingest/rehost by Edge Delivery). Detection is host-independent: it matches DM
 * URL path patterns rather than specific hostnames, covering both:
 *   - Scene7 / classic DM ("/is/image/")
 *   - DM OpenAPI delivery ("/adobe/assets/")
 */

const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// plugin-owned blocks (loaded via the plugin's loadBlock). None for now.
const blocks = [];

// host-independent DM URL signatures
const DM_SCENE7 = /\/is\/image\//i;
const DM_OPENAPI = /\/adobe\/assets\//i;

/**
 * Add a query param to every source/img URL of a <picture>.
 * @param {Element} picture the picture element to patch
 * @param {string} key param name
 * @param {string} value param value
 */
function addPictureParam(picture, key, value) {
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
  // the aspect ratio. fit=constrain keeps classic DM images proportional.
  const renderScene7 = (src, alt) => {
    const picture = createOptimizedPictureForDM(src, alt);
    addPictureParam(picture, 'fit', 'constrain');
    return picture;
  };

  // DM OpenAPI delivery URLs use their own width/avif params and aspect handling.
  const renderOpenAPI = (src, alt) => createOptimizedPictureForDMOpenAPI(src, alt);

  /**
   * Pick the right renderer for a DM URL, or null if it isn't a DM image.
   * @param {string} src the image URL
   * @returns {(src: string, alt: string) => Element | null}
   */
  const dmRendererFor = (src) => {
    if (DM_OPENAPI.test(src)) return renderOpenAPI;
    if (DM_SCENE7.test(src)) return renderScene7;
    return null;
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
      if (!src) return;
      const render = dmRendererFor(src);
      if (!render) return;
      // for links, only convert autolinks whose visible text is the URL itself
      if (el.tagName === 'A' && el.textContent.trim() !== src) return;

      const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
      el.replaceWith(render(src, alt));
    });
  };

  window.hlx.aemassets = {
    codeBasePath,
    blocks,
    loadBlock,
    createOptimizedPicture,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
    // responsive breakpoints for OpenAPI smart crops (used when enabled)
    smartCrops: {
      Small: { minWidth: 0, maxWidth: 767 },
      Medium: { minWidth: 768, maxWidth: 1023 },
      Large: { minWidth: 1024, maxWidth: 9999 },
    },
    // plugin's own prefix-based decorator, kept for reference/reuse
    decorateExternalImagesByPrefix: decorateExternalImages,
    // our generic, host-independent decorator (used by decorateMain)
    decorateExternalImages: decorateDmImages,
  };
}
