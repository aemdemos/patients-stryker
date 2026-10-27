/* global WebImporter */
/*
 * www.stryker.com components → EDS default content, shared by every corp importer
 * (decision table: tools/importer/decisions/component-map.json).
 */
import { text, cleanRichText } from './corp-richtext.js';
import { pageXfRefs, xfInfo, cfToFragmentPath } from './xf-fragment-path.js';

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

/**
 * A www.stryker.com link in authored content → its EDS form: this site's pages
 * (/us/en/…[.html], also as /content/stryker/us/en/… or https://www.stryker.com/us/en/…)
 * become EDS paths (…/index → …/); other www.stryker.com paths (other countries'
 * sites, DAM assets) become absolute www.stryker.com URLs, as they are not on this site.
 * mailto:, tel:, #anchors and other hosts are kept.
 */
export function corpLinkHref(href) {
  const value = String(href || '').trim();
  if (!value || /^(mailto|tel):|^#/i.test(value)) return value;
  const m = value.match(/^(?:https?:\/\/www\.stryker\.com)?(\/[^?#]*)([?#].*)?$/i);
  if (!m) return value;
  const path = m[1].replace(/^\/content\/stryker(?=\/)/, '');
  const rest = m[2] || '';
  if (/^\/us\/en(\/|$)/.test(path) && !path.startsWith('/content/')) {
    const eds = path.replace(/\.html?$/, '').replace(/\/index$/, '/');
    return `${eds || '/'}${rest}`;
  }
  return `https://www.stryker.com${path}${rest}`;
}

// content-fragment fields in display order (contact-us-information-fragment-model)
const CF_FIELDS = ['locationName', 'ShortDesc', 'addressBlock1', 'PhoneNumbers', 'Emails', 'RelatedLinks', 'BusinessHomePage'];

/** An authored field value (HTML or text) as clean block nodes. */
function fieldNodes(doc, html) {
  const parsed = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html').body.firstElementChild;
  const box = doc.importNode(parsed, true);
  // a value authored as bare text is one paragraph
  if (![...box.children].some((el) => /^(P|UL|OL|DIV|H[1-6])$/.test(el.tagName)) && text(box)) {
    const p = doc.createElement('p');
    p.append(...box.childNodes);
    box.append(p);
  }
  // a link without an address (authoring leftover) keeps its text
  box.querySelectorAll('a').forEach((a) => { if (!(a.getAttribute('href') || '').trim()) a.replaceWith(...a.childNodes); });
  cleanRichText(box);
  box.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', corpLinkHref(a.getAttribute('href'))));
  return [...box.children].filter((el) => text(el) || el.querySelector('img'));
}

/**
 * A content fragment (DAM, contact-us-information model) → the content of its fragment
 * document (decision: tools/importer/decisions/content-fragments.json):
 *   - a one-card `Cards (contact)` block with the fields the live pages show (the union of
 *     elementNames over every use), in model order: the location name as a heading at the
 *     level the use renders it (title_h2 / h4 / h5), the other fields as authored, the
 *     business home page link as Bold + Underline (the Futura CTA convention);
 *   - a `Metadata` block with every other non-empty field and all *Label fields (kept, not
 *     rendered).
 * Shown values are taken from the live render (dd of the rendered dl) when the use renders
 * them, else from the export.
 * @param {Document} doc the import document
 * @param {object} info the cf-index entry ({ eds, fields, uses })
 * @param {Element|null} rendered the rendered dl.cmp-contentfragment of one use, or null
 * @returns {Element[]} the blocks
 */
export function contentFragmentBlocks(doc, info, rendered) {
  const shown = new Set(info.uses.flatMap((u) => u.elementNames || []));
  const wrapper = rendered && rendered.closest('.contentfragment');
  const level = ((wrapper && wrapper.className.match(/\btitle_h([1-6])\b/)) || [])[1] || '4';
  const renderedValue = (field) => {
    const dd = rendered && rendered.querySelector(`.cmp-contentfragment__element--${field} .cmp-contentfragment__element-value`);
    return dd ? dd.innerHTML : null;
  };
  const cell = [];
  CF_FIELDS.filter((field) => shown.has(field)).forEach((field) => {
    const html = renderedValue(field) ?? info.fields[field];
    if (field === 'locationName') {
      const value = text(fieldNodes(doc, html)[0] || doc.createElement('p'));
      if (!value) return;
      const h = doc.createElement(`h${level}`);
      h.textContent = value;
      cell.push(h);
      return;
    }
    const nodes = fieldNodes(doc, html);
    if (field === 'BusinessHomePage') {
      // the source's CTA link (Futura bold uppercase teal + chevron): Bold + Underline link
      nodes.forEach((node) => node.querySelectorAll('a[href]').forEach((a) => {
        if (a.closest('strong')) return;
        const u = doc.createElement('u');
        u.append(...a.childNodes);
        a.append(u);
        const strong = doc.createElement('strong');
        a.replaceWith(strong);
        strong.append(a);
      }));
    }
    cell.push(...nodes);
  });
  const blocks = [WebImporter.Blocks.createBlock(doc, { name: 'Cards (contact)', cells: [[cell]] })];

  // everything else: kept in the document, not rendered
  const rows = Object.entries(info.fields)
    .filter(([field, value]) => (field.endsWith('Label') || !shown.has(field))
      && String(value || '').replace(/<[^>]+>/g, '').trim())
    .map(([field, value]) => [field, field.endsWith('Label') ? String(value).trim() : fieldNodes(doc, value)]);
  if (rows.length) blocks.push(WebImporter.Blocks.createBlock(doc, { name: 'Metadata', cells: rows }));
  return blocks;
}

/**
 * A contact-directory XF (large-headline group bands + rendered content fragments, e.g.
 * /content/experience-fragments/stryker/corporate/en/contact_information/directory---asia)
 * → sections: each group band (.largeheadline.has-background) as a heading in its own
 * section (styles `large-headline` + bg-gold / bg-gray), then a section with one Fragment
 * block per content fragment, in authored order (fragment.js merges the one-card blocks
 * into one grid). Rich text other than empty spacers is kept as default content.
 * @returns {{sections: {style: string, nodes: Element[]}[], unknown: string[]}}
 */
export function contactDirectorySections(root, doc) {
  const sections = [];
  const unknown = [];
  let current = null;
  const start = (style) => {
    current = { style, nodes: [] };
    sections.push(current);
    return current;
  };
  const items = [...root.querySelectorAll('.largeheadline, .contentfragment, .c-rich-text-editor, .c-standalone-image')]
    .filter((el) => !el.parentElement.closest('.largeheadline, .contentfragment, .c-rich-text-editor, .c-standalone-image'));
  items.forEach((item) => {
    if (item.matches('.largeheadline')) {
      const band = item.querySelector('.has-background') || item;
      const words = text(band);
      if (!words) return;
      const bg = band.classList.contains('bg-gold') ? 'bg-gold' : 'bg-gray';
      const h2 = doc.createElement('h2');
      h2.textContent = words;
      start(`large-headline, ${bg}`).nodes.push(h2);
      current = null;
      return;
    }
    if (item.matches('.contentfragment')) {
      const cf = (item.querySelector('dl[data-path]') || {}).getAttribute?.('data-path');
      const eds = cf && cfToFragmentPath(cf);
      if (!eds) {
        unknown.push(`content fragment without path: ${text(item).slice(0, 40)}`);
        return;
      }
      const link = doc.createElement('a');
      link.href = eds;
      link.textContent = eds;
      if (!current) start('');
      current.nodes.push(WebImporter.Blocks.createBlock(doc, { name: 'Fragment', cells: [[link]] }));
      return;
    }
    // images and rich text between the boxes (e.g. a "United States" label and its intro)
    // get a section of their own: fragment.js merges all cards of a section into its first
    // grid, which would move the boxes after the text in front of it (skip &nbsp; spacers)
    let nodes;
    if (item.matches('.c-standalone-image')) {
      nodes = standaloneImageNodes(item, doc);
    } else {
      const box = doc.importNode(item, true);
      cleanRichText(box);
      nodes = [...box.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol')]
        .filter((el) => !el.parentElement.closest('p, ul, ol') && text(el));
    }
    if (!nodes.length) return;
    start('').nodes.push(...nodes);
    current = null;
  });
  root.querySelectorAll('.map, [class*="googlemap"], iframe[src*="google.com/maps"]').forEach((el) => unknown.push(`map (client input pending): ${el.className || el.tagName}`));
  return { sections, unknown };
}
