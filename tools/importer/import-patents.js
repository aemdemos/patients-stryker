/* global WebImporter */
// www.stryker.com patents and trademarks pages → template patents (#518): the patents index,
// the patents tables per business and the trademarks list.

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

const PAGE_TEMPLATE = {
  name: 'patents',
  description: 'www.stryker.com patents and trademarks pages (#518). Patents index: Columns (columns-50-50, stack) hero [gold H1 (bold + italic) + notice | image], the product-line links as plain paragraphs in a `separator` section, the document code in a `disclaimer` section. Patents tables and trademarks: each source table as one `Table (no-header, striped, stacked)` (columns empty in every row dropped); trademarks first has its H1 and description in a `serif, p-1-5, width-50` section. `published` from the source date with `last-updated: show`.',
  urls: [
    'https://www.stryker.com/us/en/about/patents.html',
    'https://www.stryker.com/us/en/about/patents/Spine-patents.html',
    'https://www.stryker.com/us/en/about/trademarks.html',
  ],
  blocks: [],
};

// an author-host link on the index → the live (unmigrated) page on www.stryker.com
const AUTHOR_LINKS = [[
  /^https:\/\/author-stryker-prod\.adobecqms\.net\/editor\.html\/content\/stryker(\/us\/en\/about\/patents\/peripheral-vascular\.html)$/,
  'https://www.stryker.com$1',
]];

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
const text = (el) => (el ? clean(el.textContent) : '');

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

function para(document, value) {
  const p = document.createElement('p');
  p.textContent = value;
  return p;
}

/** #hiddenPublishedDate (MM/DD/YYYY) → `published` (YYYY-MM-DD) */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/** .c-page-hero → gold H1, then Columns (columns-50-50) [text | image]; its rule → `separator` */
function pageHero(document, src) {
  const component = src.querySelector('.c-page-hero');
  if (!component) return { nodes: [], rule: false };
  const heading = [];
  const copy = [];
  component.querySelectorAll('h1, p').forEach((el) => {
    if (!text(el)) return;
    if (el.matches('h1')) {
      const h1 = document.createElement('h1');
      const strong = document.createElement('strong');
      strong.textContent = text(el);
      const gold = /255\s*,\s*181\s*,\s*0|#ffb500/i.test(el.getAttribute('style') || '');
      if (gold) {
        const em = document.createElement('em');
        em.append(strong);
        h1.append(em);
      } else h1.append(strong);
      heading.push(h1);
    } else copy.push(para(document, text(el)));
  });
  const media = [];
  const img = component.querySelector('img');
  if (img) {
    const source = img.closest('picture')?.querySelector('source[srcset]');
    const out = document.createElement('img');
    out.src = source ? source.getAttribute('srcset').split(/\s+/)[0] : img.getAttribute('src');
    out.alt = img.getAttribute('alt') || '';
    media.push(out);
  }
  const nodes = media.length
    ? [...heading, WebImporter.Blocks.createBlock(document, { name: 'Columns (columns-50-50, stack)', cells: [[copy, media]] })]
    : [...heading, ...copy];
  return { nodes, rule: !!component.querySelector('.border-bottom-gold') };
}

/** .c-curated-link-list links → one plain link paragraph each */
function linkList(document, src) {
  return [...src.querySelectorAll('.c-curated-link-list a[href]')].filter((a) => text(a)).map((link) => {
    const href = link.getAttribute('href');
    const live = AUTHOR_LINKS.reduce((v, [re, to]) => v.replace(re, to), href);
    const a = document.createElement('a');
    a.href = href;
    if (live !== href) a.setAttribute('data-live', live);
    a.textContent = text(link);
    const p = document.createElement('p');
    p.append(a);
    return p;
  });
}

/** .c-longtexthero → bold H1 + description paragraphs in a `serif, p-1-5, width-50` section */
function longTextHero(document, src) {
  const component = src.querySelector('.c-longtexthero');
  if (!component) return [];
  const title = component.querySelector('h1');
  const nodes = [];
  if (text(title)) {
    const h1 = document.createElement('h1');
    const strong = document.createElement('strong');
    strong.textContent = text(title);
    h1.append(strong);
    nodes.push(h1);
  }
  component.querySelectorAll('.description p').forEach((p) => {
    if (text(p)) nodes.push(para(document, text(p)));
  });
  if (!nodes.length) return [];
  return [...nodes, sectionMetadata(document, 'serif, p-1-5, width-50'), document.createElement('hr')];
}

/** .c-patenttables → Table (no-header, striped, stacked); columns empty in every row are dropped */
function tables(document, src) {
  return [...src.querySelectorAll('.c-patenttables table')].map((table) => {
    const rows = [...table.querySelectorAll('tbody tr')]
      .map((tr) => [...tr.children].map((td) => text(td.querySelector('.cell-content') || td)))
      .filter((r) => r.some(Boolean));
    const width = Math.max(0, ...rows.map((r) => r.length));
    const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i]));
    if (!rows.length || !used.length) return null;
    return WebImporter.Blocks.createBlock(document, {
      name: 'Table (no-header, striped, stacked)',
      cells: rows.map((r) => used.map((i) => r[i] || '')),
    });
  }).filter(Boolean);
}

/** the `.c-disclaimer` document code as a closing small-print section */
function disclaimerSection(document, src) {
  const paras = [...src.querySelectorAll('.c-disclaimer p:not(#publishedDate)')]
    .filter((p) => text(p)).map((p) => para(document, text(p)));
  if (!paras.length) return [];
  return [document.createElement('hr'), ...paras, sectionMetadata(document, 'disclaimer')];
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const published = publishedDate(document);
    const dateLine = document.querySelector('#publishedDate');
    const showDate = !!dateLine && !dateLine.classList.contains('hidden');
    const meta = WebImporter.Blocks.getMetadata(document);
    const src = document.querySelector('[role="main"]') || document.body;

    const main = document.createElement('div');
    const { nodes: hero, rule } = pageHero(document, src);
    const links = linkList(document, src);
    const blocks = tables(document, src);
    if (hero.length) main.append(...hero, document.createElement('hr'));
    if (links.length) main.append(...links);
    if (rule && links.length) main.append(sectionMetadata(document, 'separator'));
    main.append(...longTextHero(document, src), ...blocks);
    main.append(...disclaimerSection(document, document.body));
    document.body.replaceChildren(main);

    executeTransformers('afterTransform', main, payload);
    // set after the cleanup, which would rewrite a www.stryker.com link to an EDS path
    main.querySelectorAll('a[data-live]').forEach((a) => {
      a.setAttribute('href', a.getAttribute('data-live'));
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

    return [{
      element: main,
      path,
      report: {
        title: meta.Title || document.title,
        template: PAGE_TEMPLATE.name,
        blocks: blocks.length ? Array(blocks.length).fill('table') : [],
        rows: blocks.map((b) => b.querySelectorAll('tr').length - 1),
      },
    }];
  },
};
