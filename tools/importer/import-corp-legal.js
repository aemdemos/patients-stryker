/* global WebImporter */
// www.stryker.com legal, governance and policy pages, built by the long-page-detail-corp builder.
import longPageDetailSectionsTransformer, {
  keepHeadlineBlankLines, edsLinkPaths,
} from './transformers/long-page-detail-corp-sections.js';
import { cleanRichText } from './transformers/long-page-detail-corp-article.js';
import { contactUs } from './transformers/contact-division-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

const PAGE_TEMPLATE = {
  name: 'corp-legal',
  description: 'www.stryker.com legal, governance and policy pages (#517): built as the long-page-detail-corp pages (H1 or underlined H2 title, rich text, section titles as underlined H2 with their ids, Accordion, conventions buttons, Columns, small print as a `disclaimer` section); source tables as `Table (no-header, striped)` blocks; `published` with `last-updated: false`.',
  urls: [
    'https://www.stryker.com/us/en/legal/terms-of-use.html',
    'https://www.stryker.com/us/en/about/governance/bylaws.html',
    'https://www.stryker.com/us/en/about/governance/lifecycle-support.html',
  ],
  blocks: [],
};

const transformers = [
  longPageDetailSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
];

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

const text = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

// .c-table → Table (no-header, striped); columns empty in every row are dropped.
function tables(main, document) {
  let count = 0;
  main.querySelectorAll('.c-table').forEach((component) => {
    const source = component.querySelector('table');
    if (!source) return;
    const rows = [...source.querySelectorAll('tr')].map((tr) => [...tr.children]);
    const width = Math.max(0, ...rows.map((r) => r.length));
    const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i] && text(r[i])));
    const cells = rows.filter((r) => r.some((td) => text(td))).map((r) => used.map((i) => {
      const box = document.createElement('div');
      if (r[i]) box.append(...[...r[i].childNodes].map((n) => n.cloneNode(true)));
      cleanRichText(box);
      const trailing = (n) => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()));
      while (trailing(box.lastChild)) box.lastChild.remove();
      return [...box.childNodes];
    }));
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'Table (no-header, striped)',
      cells,
    });
    block.setAttribute('data-keep', 'flow');
    (component.closest('.table.parbase') || component).replaceWith(block);
    count += 1;
  });
  return count;
}

// .c-contactus → underlined H2 + Columns (columns-50-50), in a section of its own.
function contacts(main, document, report) {
  main.querySelectorAll('.c-contactus').forEach((component) => {
    const nodes = contactUs(component, document, report);
    const holder = document.createElement('div');
    holder.setAttribute('data-keep', 'nodes');
    holder.append(...nodes);
    (component.closest('.contactus') || component).replaceWith(holder);
  });
}

// #hiddenPublishedDate (MM/DD/YYYY) → `published` (YYYY-MM-DD).
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

export default {
  // before the importer's own cleanup, which drops empty paragraphs
  preprocess: ({ document }) => {
    keepHeadlineBlankLines(document);
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const hcp = !!document.querySelector('.g-hcpbanner');
    const published = publishedDate(document);

    const tableCount = tables(main, document);
    const contactReport = { phones: [] };
    contacts(main, document, contactReport);
    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);
    edsLinkPaths(main);

    // site + template are repeated on the page so it renders the same without bulk metadata
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (hcp) meta['hcp-banner'] = 'true';
    if (published) {
      meta.published = published;
      meta['last-updated'] = 'false';
    }
    main.removeAttribute('data-xf-unresolved');
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: Array(tableCount).fill('table'),
        phones: contactReport.phones,
      },
    }];
  },
};
