/*
 * www.stryker.com components → EDS default content, shared by every corp importer
 * (decision table: tools/importer/decisions/component-map.json).
 */
import { text } from './corp-richtext.js';
import { pageXfRefs, xfInfo } from './xf-fragment-path.js';

/**
 * Standalone image (stryker/components/content/standaloneimage, .c-standalone-image) →
 * default content, in source order:
 *   image (wrapped in its link when the source image links somewhere: linkInternal /
 *   linkExternal), then the image title (h4.title → <h4>), then the description
 *   (p.u-white-space-pre → <p>, its line breaks kept).
 * 189 standalone images on the site have a title and 72 a description (AEM export).
 * @returns {Element[]} the nodes to place in the section
 */
export function standaloneImageNodes(component, doc) {
  const nodes = [];
  [...component.querySelectorAll('img')].forEach((source) => {
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    const p = doc.createElement('p');
    const link = source.closest('a[href]');
    if (link) {
      const a = doc.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.append(img);
      p.append(a);
    } else {
      p.append(img);
    }
    nodes.push(p);
  });
  const title = component.querySelector('.title-content .title');
  if (title && text(title)) {
    const h4 = doc.createElement('h4');
    h4.textContent = text(title);
    nodes.push(h4);
  }
  const description = component.querySelector('.c-standalone-image-content > p');
  if (description && text(description)) {
    const p = doc.createElement('p');
    description.textContent.trim().split(/\n/).forEach((line, i) => {
      if (i) p.append(doc.createElement('br'));
      p.append(doc.createTextNode(line.trim()));
    });
    nodes.push(p);
  }
  return nodes;
}

const squash = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Experience fragments rendered inline on a source page → their EDS fragment documents.
 * The rendered XF wrapper (.experienceFragment) carries no path, so the wrappers are matched
 * to the authored references in order (xf-index PAGES for a page, FRAGMENTS[xf].refs for the
 * XFs nested in an XF): a reference is taken when the wrapper's text starts like the
 * reference's text summary (when it has one); references that cannot be imported
 * (unpublished, redirect, not an XF) and do not render are skipped. Hero / carousel slide
 * XFs (.experienceFragment-ef / -ef-mobile) are left to the hero parsers.
 * @param {Element} root the source page (or XF) content
 * @param {string} source the source page path or URL (page refs), or an XF path (nested refs)
 * @returns {{matches: Map<Element, {xf: string, eds: string}>, unmatched: string[]}}
 */
export function matchXfWrappers(root, source) {
  const nested = xfInfo(source);
  const refs = nested
    ? nested.refs.map((xf) => ({ kind: 'fragment', xf, eds: (xfInfo(xf) || {}).eds || null }))
    : pageXfRefs(source).filter((r) => r.kind === 'fragment');
  const wrappers = [...root.querySelectorAll('.experienceFragment')]
    .filter((el) => !el.parentElement.closest('.experienceFragment'));
  const matches = new Map();
  const unmatched = [];
  let next = 0;
  wrappers.forEach((wrapper) => {
    const content = squash(wrapper.textContent);
    for (let i = next; i < refs.length; i += 1) {
      const ref = refs[i];
      const summary = squash(ref.text).slice(0, 40);
      const fits = !summary || content.startsWith(summary.slice(0, 20))
        || content.includes(summary);
      if (ref.eds && fits) {
        matches.set(wrapper, { xf: ref.xf, eds: ref.eds });
        next = i + 1;
        return;
      }
      // an importable reference that does not fit: this wrapper is something else
      if (ref.eds) break;
    }
    unmatched.push(content.slice(0, 60));
  });
  return { matches, unmatched };
}

/** The Dynamic Media asset name of an image URL (…/is/image/stryker/<name>?…), lowercase. */
const dmAsset = (src) => decodeURIComponent(String(src || '').split('/is/image/')[1] || '')
  .split('?')[0].split('/').pop().toLowerCase();

/**
 * Hero / carousel slides whose images are experience fragments (.experienceFragment-ef and
 * -ef-mobile in a .carouselslide) → data-xf-desktop / data-xf-mobile with the EDS fragment
 * paths, for the hero parsers to emit fragment links instead of images. Slides are matched to
 * the page's slide references (xf-index PAGES, kind slide) in order; a slide is only marked
 * when its image is the XF's own Dynamic Media asset (FRAGMENTS[xf].assets), otherwise it
 * keeps its images and is reported.
 * @param {Element} root the source page content
 * @param {string} source the source page path or URL
 * @returns {string[]} the slides that could not be matched (their image names)
 */
export function markXfSlides(root, source) {
  const refs = pageXfRefs(source).filter((r) => r.kind === 'slide');
  const slides = [...root.querySelectorAll('.carouselslide:not(.slick-cloned)')]
    .filter((slide) => slide.querySelector('.experienceFragment-ef, .experienceFragment-ef-mobile'));
  const unmatched = [];
  slides.forEach((slide, i) => {
    const ref = refs[i];
    const check = (side, selector) => {
      const target = ref && ref[side];
      const img = slide.querySelector(`${selector} img`);
      if (!target || !target.eds || !img) return null;
      const assets = ((xfInfo(target.xf) || {}).assets || []).map((a) => a.toLowerCase());
      const name = dmAsset(img.getAttribute('src'));
      return !assets.length || assets.includes(name) ? target.eds : null;
    };
    const desktop = check('desktop', '.experienceFragment-ef');
    const mobile = check('mobile', '.experienceFragment-ef-mobile');
    if (desktop) slide.dataset.xfDesktop = desktop;
    if (mobile) slide.dataset.xfMobile = mobile;
    if (!desktop || (slide.querySelector('.experienceFragment-ef-mobile img') && !mobile)) {
      unmatched.push(dmAsset((slide.querySelector('img') || {}).src));
    }
  });
  return unmatched;
}
