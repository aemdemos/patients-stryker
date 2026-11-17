/* global WebImporter */
// www.stryker.com webinar and on-demand video pages → template corp-webinar (#519): the
// webinar pages (title, speaker, description, video), the webinar thank-you pages, the
// page-hero video pages and the FocusRN on-demand webinars index.

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { videoLink } from './parsers/video.js';

const PAGE_TEMPLATE = {
  name: 'corp-webinar',
  description: 'www.stryker.com webinars and on-demand videos (#519). Webinar: H1 + speaker in a `serif` section, the description in a `p-1-25` section, then the Video block (`Video (border)` unless the source hides the border). Thank-you: gold H1 (bold + italic) + H2 in a `h1-1-5, h-serif` section, the paragraph in `p-1-25`, then the Video. Page hero: gold H1 (+ H2) in a `h-serif` section, `Video (border)` in a `separator` section, the speaker byline in a `serif, p-1-25` section, then the description as body copy. Index: Back link + linked FocusRN wordmark in a `back-link, image-link` section, H1 + intro + register link (a plain link, not bold, alone on its line), then one `accordion-panel, image-link, large-labels` section per accordion panel (H2 label + one Columns 3-up row, Bold H3 webinar titles). The source document code closes the page as a `disclaimer` section; `published` and `last-updated: show` from the source date.',
  urls: [
    'https://www.stryker.com/us/en/emergency-care/webinars/ems1-webinar_with-or-without-capnography/webinar.html',
    'https://www.stryker.com/us/en/emergency-care/webinars/improving-cognitive-offloading-for-nurses/webinar.html',
    'https://www.stryker.com/us/en/sage/videos/sage-mp-mats-2-demo.html',
    'https://www.stryker.com/us/en/sage/webinars.html',
    'https://www.stryker.com/us/en/sage/webinars/guidelines-practice-pip-fireside-chat.html',
    'https://www.stryker.com/us/en/sage/webinars/hap-human-financial-cost.html',
    'https://www.stryker.com/us/en/sage/webinars/managing-urinary-incontinence-webinar.html',
    'https://www.stryker.com/us/en/sage/webinars/mobility-matters-impact-safe-patient-mobilization.html',
    'https://www.stryker.com/us/en/sage/webinars/nv-hap-hidden-plain-sight.html',
    'https://www.stryker.com/us/en/sage/webinars/risk-of-pip-procedural-operational-areas.html',
    'https://www.stryker.com/us/en/sage/webinars/safe-patient-handling-mobility-webinar.html',
    'https://www.stryker.com/us/en/sage/webinars/sepsis-hospital-acquired-pneumonia.html',
    'https://www.stryker.com/us/en/sage/webinars/sepsis-non-vent-pneumonia-risk-prevention-recognition.html',
  ],
  blocks: [],
};

// www.stryker.com pages that are not migrated: their links stay on www.stryker.com
const LIVE_PAGES = /^\/us\/en\/training-and-education\/medical-and-surgical-equipment--\/sage\/focusrn(\/upcoming-events)?\.html$/;

const transformers = [cleanupTransformer, dmImagesTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

const clean = (s) => (s || '').replace(/[\s\u00a0]+/g, ' ').trim();
const text = (node) => (node ? clean(node.textContent) : '');
const GOLD = /255\s*,\s*181\s*,\s*0|#ffb500/i;

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

function el(document, tag, value) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  return node;
}

/** wrap a node in nested formatting elements, outermost first: wrap(d, a, 'strong', 'u') */
function wrap(document, node, ...tags) {
  return tags.reduceRight((inner, tag) => {
    const outer = document.createElement(tag);
    outer.append(inner);
    return outer;
  }, node);
}

/** a source link → a fresh link; a new-tab link gets the author `#_blank` marker */
function link(document, source, label) {
  const a = document.createElement('a');
  const href = source.getAttribute('href').trim();
  if (LIVE_PAGES.test(href)) a.setAttribute('data-live', `https://www.stryker.com${href}`);
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  a.href = newTab ? `${href}#_blank` : href;
  a.textContent = label ?? text(source);
  return a;
}

/** a source paragraph's text and links only (the size/font spans are carried by section styles) */
function inline(document, source, tag = 'p') {
  const out = document.createElement(tag);
  const walk = (node, into) => node.childNodes.forEach((child) => {
    if (child.nodeType === 3) into.append(child.textContent.replace(/\u00a0/g, ' '));
    else if (child.nodeType === 1 && child.matches('a[href]')) into.append(link(document, child));
    else if (child.nodeType === 1 && !child.matches('br')) walk(child, into);
  });
  walk(source, out);
  out.normalize();
  const { firstChild, lastChild } = out;
  if (firstChild?.nodeType === 3) firstChild.textContent = firstChild.textContent.trimStart();
  if (lastChild?.nodeType === 3) lastChild.textContent = lastChild.textContent.trimEnd();
  out.childNodes.forEach((child) => {
    if (child.nodeType === 3) child.textContent = child.textContent.replace(/\s+/g, ' ');
  });
  return out;
}

/** a heading; gold (#ffb500) → Bold + Italic, the gold heading convention; the page title
 * (Futura bold on stryker.com) → Bold, as the other corp page titles */
function heading(document, source, tag) {
  const value = text(source);
  const gold = GOLD.test(source.getAttribute('style') || '')
    || [...source.querySelectorAll('[style]')].some((s) => GOLD.test(s.getAttribute('style')));
  if (gold) return wrap(document, el(document, 'strong', value), tag, 'em');
  return tag === 'h1' ? wrap(document, el(document, 'strong', value), tag) : el(document, tag, value);
}

/** #hiddenPublishedDate (MM/DD/YYYY) → `published` (YYYY-MM-DD) */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/** the .c-standalone-video as a Video block (`border` unless the source hides it) */
function video(document, src) {
  const component = src.querySelector('.c-standalone-video');
  const a = component && videoLink(component, document);
  if (!a) return null;
  const name = component.classList.contains('hide-border') ? 'Video' : 'Video (border)';
  return WebImporter.Blocks.createBlock(document, { name, cells: [[a]] });
}

/** rich-text headings and paragraphs with text, in source order (excluding the disclaimer) */
function richText(src) {
  return [...src.querySelectorAll('.c-rich-text-editor')]
    .filter((rte) => !rte.closest('.c-disclaimer, .c-accordion'))
    .flatMap((rte) => [...rte.querySelectorAll('h1, h2, h3, h4, h5, h6, p')])
    .filter((node) => text(node));
}

/** A: webinar page / A thank-you: rich text (H1, speaker or H2, description), then the video */
function layoutA(document, src) {
  const nodes = richText(src);
  const h1 = nodes.find((n) => n.matches('h1'));
  const rest = nodes.filter((n) => n !== h1);
  const out = [];
  const thankYou = h1 && GOLD.test(h1.innerHTML);
  if (thankYou) {
    out.push(heading(document, h1, 'h1'));
    rest.filter((n) => /^H/.test(n.tagName)).forEach((n) => out.push(el(document, 'h2', text(n))));
    out.push(sectionMetadata(document, 'h1-1-5, h-serif'), el(document, 'hr'));
    rest.filter((n) => n.matches('p')).forEach((n) => out.push(inline(document, n)));
    out.push(sectionMetadata(document, 'p-1-25'), el(document, 'hr'));
  } else {
    const [speaker, ...copy] = rest;
    if (h1) out.push(heading(document, h1, 'h1'));
    if (speaker) out.push(inline(document, speaker));
    out.push(sectionMetadata(document, 'serif'), el(document, 'hr'));
    copy.forEach((n) => out.push(inline(document, n)));
    if (copy.length) out.push(sectionMetadata(document, 'p-1-25'), el(document, 'hr'));
  }
  const block = video(document, src);
  if (block) out.push(block);
  return out;
}

/** B: page hero (gold H1, H2) → `h-serif`; the hero rule → `separator` with the video, then the
 * speaker byline after the video → `serif, p-1-25` and the description as body copy */
function layoutB(document, src) {
  const hero = src.querySelector('.c-page-hero');
  const out = [];
  hero.querySelectorAll('h1, h2').forEach((h) => {
    if (text(h)) out.push(heading(document, h, h.tagName.toLowerCase()));
  });
  out.push(sectionMetadata(document, 'h-serif'), el(document, 'hr'));
  const block = video(document, src);
  if (block) out.push(block);
  if (hero.querySelector('.border-bottom-gold')) out.push(sectionMetadata(document, 'separator'));
  const desc = [...src.querySelectorAll('.c-standalone-video .desc-content :is(h1, h2, h3, h4, h5, h6, p)')]
    .filter((n) => text(n));
  // the speaker byline (an h3 on stryker.com) is a serif paragraph, the description body copy
  const speakers = desc.filter((n) => /^H/.test(n.tagName));
  const copy = desc.filter((n) => !/^H/.test(n.tagName));
  if (speakers.length) {
    out.push(el(document, 'hr'), ...speakers.map((n) => inline(document, n)));
    out.push(sectionMetadata(document, 'serif, p-1-25'));
  }
  if (copy.length) out.push(el(document, 'hr'), ...copy.map((n) => inline(document, n)));
  return out;
}

/** a DM image as an <img> (the DM transformer turns it into a link; link text = alt) */
function image(document, source) {
  const img = document.createElement('img');
  img.src = source.getAttribute('src');
  img.alt = clean(source.getAttribute('alt'));
  return img;
}

/** a link alone on its line right after an image: the `image-link` target of the image */
function imageTarget(document, source, label) {
  const anchor = source.closest('a[href]');
  if (!anchor) return null;
  const p = document.createElement('p');
  p.append(link(document, anchor, label));
  return p;
}

/** C: the index — Back link + wordmark, H1 + intro + register link, an accordion of webinars */
function layoutC(document, src) {
  const out = [];
  // the "< BACK" link and the linked FocusRN wordmark (experience fragment)
  const xf = src.querySelector('.experiencefragment');
  if (xf) {
    xf.querySelectorAll('.c-rich-text-editor p a[href]').forEach((a) => {
      const p = document.createElement('p');
      p.append(link(document, a));
      out.push(p);
    });
    xf.querySelectorAll('.c-standalone-image img').forEach((img) => {
      const p = document.createElement('p');
      p.append(image(document, img));
      out.push(p);
      const target = imageTarget(document, img, clean(img.getAttribute('alt')));
      if (target) out.push(target);
    });
    out.push(sectionMetadata(document, 'back-link, image-link'), el(document, 'hr'));
  }

  // H1, intro and the register link (plain on the source: a bold link would become a button)
  richText(src).filter((n) => !n.closest('.experiencefragment')).forEach((n) => {
    if (n.matches('h1')) out.push(heading(document, n, 'h1'));
    else if (n.querySelector('.standalone-link') && n.querySelectorAll('a[href]').length === 1) {
      const p = document.createElement('p');
      p.append(link(document, n.querySelector('a[href]')));
      out.push(p);
    } else if (/^H/.test(n.tagName)) out.push(el(document, n.tagName.toLowerCase(), text(n)));
    else out.push(inline(document, n));
  });
  // the 42px title (h1 > span.fontsize-1-5em on stryker.com)
  out.push(sectionMetadata(document, 'h1-1-5'));

  // each accordion panel → an `accordion-panel` section: H2 label + one Columns row
  src.querySelectorAll('.c-accordion .panel').forEach((panel) => {
    const label = text(panel.querySelector('.panel-title'));
    const cells = [...panel.querySelectorAll('.panel-body [class*="col-md-"]')].map((col) => {
      const cell = [];
      const img = col.querySelector('.c-standalone-image img');
      const title = text(col.querySelector('.c-rich-text-editor h4'));
      if (img) {
        const p = document.createElement('p');
        p.append(image(document, img));
        cell.push(p);
        const target = imageTarget(document, img, title || clean(img.getAttribute('alt')));
        if (target) cell.push(target);
      }
      col.querySelectorAll('.c-rich-text-editor :is(h1, h2, h3, h4, h5, h6, p)').forEach((n) => {
        if (!text(n)) return;
        // the webinar title (h4 on stryker.com) → H3 under the H2 panel label, Bold (Futura bold)
        if (/^H/.test(n.tagName)) cell.push(wrap(document, el(document, 'strong', text(n)), 'h3'));
        else if (n.querySelector('.standalone-link') && n.querySelectorAll('a[href]').length === 1) {
          // "Watch now": Bold + Underline link alone on its line (teal standalone link)
          const p = document.createElement('p');
          p.append(wrap(document, link(document, n.querySelector('a[href]')), 'strong', 'u'));
          cell.push(p);
        } else cell.push(inline(document, n));
      });
      return cell;
    }).filter((cell) => cell.length);
    out.push(el(document, 'hr'));
    if (label) out.push(el(document, 'h2', label));
    if (cells.length) out.push(WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [cells] }));
    out.push(sectionMetadata(document, 'accordion-panel, image-link, large-labels'));
  });
  return out;
}

/** the `.c-disclaimer` document code as a closing small-print section */
function disclaimerSection(document, src) {
  const paras = [...src.querySelectorAll('.c-disclaimer p:not(#publishedDate)')]
    .filter((p) => text(p)).map((p) => el(document, 'p', text(p)));
  if (!paras.length) return [];
  return [el(document, 'hr'), ...paras, sectionMetadata(document, 'disclaimer')];
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const published = publishedDate(document);
    const dateLine = document.querySelector('#publishedDate');
    const showDate = !!dateLine && !dateLine.classList.contains('hidden');
    const meta = WebImporter.Blocks.getMetadata(document);
    const src = document.querySelector('[role="main"]') || document.querySelector('.main.content') || document.body;

    let layout = 'A';
    if (src.querySelector('.c-accordion')) layout = 'C';
    else if (src.querySelector('.c-page-hero')) layout = 'B';
    const content = { A: layoutA, B: layoutB, C: layoutC }[layout](document, src);

    const main = document.createElement('div');
    main.append(...content, ...disclaimerSection(document, document.body));
    // no empty trailing section before the disclaimer / metadata
    while (main.lastElementChild?.matches('hr')) main.lastElementChild.remove();
    document.body.replaceChildren(main);

    executeTransformers('afterTransform', main, payload);
    // set after the cleanup, which would rewrite a www.stryker.com link to an EDS path
    main.querySelectorAll('a[data-live]').forEach((a) => {
      const hash = a.getAttribute('href').endsWith('#_blank') ? '#_blank' : '';
      a.setAttribute('href', `${a.getAttribute('data-live')}${hash}`);
      a.removeAttribute('data-live');
    });

    // `site: corp` and the " | Stryker" title suffix come from the corp bulk metadata;
    // site + template are repeated on the page so it renders the same anywhere
    main.appendChild(document.createElement('hr'));
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (published) meta.published = published;
    if (published && showDate) meta['last-updated'] = 'show';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = source.pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
    const blocks = [...main.querySelectorAll('table')]
      .map((t) => text(t.querySelector('tr')).toLowerCase())
      .filter((name) => !/^(section metadata|metadata)$/.test(name));

    return [{
      element: main,
      path,
      report: {
        title: meta.Title || document.title,
        template: PAGE_TEMPLATE.name,
        layout,
        blocks,
      },
    }];
  },
};
