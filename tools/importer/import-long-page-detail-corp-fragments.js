/* global WebImporter */
// www.stryker.com shared Experience Fragments of the long-page-detail pages (#469) →
// fragment documents at /us/en/fragments/<XF path> (xf-fragment-path.js). The shared XFs
// are the ones on 2 or more pages in the export (long-page-detail-corp-xf.js): the
// Virtual Learning Center videos, and the "Connect with us" band / contact aside of the
// endoscopy and communications pages. Each is imported from its XF master page.
//   - Connect with us band (contact_information/header): H2 + copy, `connect-band`
//   - contact aside (contact_information/contact): links (stryker.com "standalone links"
//     underlined), a group label as a Heading 4, buttons as bold links, `contact-aside`
//     (the same structure as the news-detail shared fragments, import-news-shared-fragments.js)
//   - any other XF (the Virtual Learning Center video item): the long-page-detail-corp
//     sections transformer and parsers, as on the pages
// Usage: urls-long-page-detail-corp-fragments.txt (XF master .html URLs).

import videoParser from './parsers/video.js';
import cardsCorpResourcesParser from './parsers/cards-corp-resources.js';
import longPageDetailSectionsTransformer, {
  keepHeadlineBlankLines, edsLinkPaths,
} from './transformers/long-page-detail-corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { xfToFragmentPath, xfKey } from './xf-fragment-path.js';

const PAGE_TEMPLATE = {
  name: 'long-page-detail-corp-fragments',
  description: 'Shared Experience Fragments of the long-page-detail pages, imported as fragment documents (#469).',
  urls: [],
  blocks: [
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-resources', instances: ['.c-resourcesanddownload'] },
  ],
};

const parsers = {
  video: videoParser,
  'cards-corp-resources': cardsCorpResourcesParser,
};

const transformers = [longPageDetailSectionsTransformer, cleanupTransformer, dmImagesTransformer];

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

const text = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');

// www.stryker.com links to this site's own pages become root-relative EDS paths
function corpLink(href) {
  const m = (href || '').match(/^(?:https?:\/\/www\.stryker\.com)?(\/us\/en\/[^?#]*?)(index)?\.html([?#].*)?$/i);
  if (!m) return href;
  return `${m[1]}${m[3] || ''}`;
}

const isStandalone = (a) => !!(a.closest('.standalone-link') || a.querySelector('.standalone-link'));

function linkPara(document, a, standalone) {
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.href = corpLink(a.getAttribute('href'));
  if (standalone) {
    const u = document.createElement('u');
    u.textContent = text(a);
    link.append(u);
  } else {
    link.textContent = text(a);
  }
  p.append(link);
  return p;
}

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

/** "Connect with us": the H2, then each paragraph with its links. */
function buildConnect(document, src) {
  const out = [];
  const h2 = document.createElement('h2');
  h2.textContent = text(src.querySelector('h2'));
  out.push(h2);
  src.querySelectorAll('.c-rich-text-editor p').forEach((p) => {
    if (!text(p)) return;
    const np = document.createElement('p');
    p.childNodes.forEach((n) => {
      if (n.nodeName === 'A') {
        const a = document.createElement('a');
        a.href = corpLink(n.getAttribute('href'));
        a.textContent = text(n);
        np.append(a);
      } else {
        np.append(document.createTextNode(n.textContent.replace(/\u00a0/g, ' ')));
      }
    });
    const last = np.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
    out.push(np);
  });
  return out;
}

/**
 * Contact aside: the links in source order, a paragraph without a link (a group label,
 * e.g. "Endoscopy") as a Heading 4, the teal buttons as bold links (primary buttons).
 */
function buildContact(document, src) {
  const out = [];
  src.querySelectorAll('.c-rich-text-editor p, .buttonset a.btn').forEach((node) => {
    if (node.matches('a.btn')) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = corpLink(node.getAttribute('href'));
      a.textContent = text(node);
      strong.append(a);
      p.append(strong);
      out.push(p);
      return;
    }
    const a = node.querySelector('a[href]');
    if (a) out.push(linkPara(document, a, isStandalone(a)));
    else if (text(node)) {
      const h4 = document.createElement('h4');
      h4.textContent = text(node);
      out.push(h4);
    }
  });
  return out;
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  // before the importer's own cleanup, which drops empty paragraphs
  preprocess: ({ document }) => keepHeadlineBlankLines(document),

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const key = xfKey(params.originalURL || url);
    const path = xfToFragmentPath(key);
    if (!path) throw new Error(`Not an Experience Fragment: ${key}`);
    const src = document.querySelector('.xf-content-height') || main;

    if (/\/contact_information\/(header|contact)\/master$/.test(key)) {
      const isHeader = /\/header\/master$/.test(key);
      const nodes = isHeader ? buildConnect(document, src) : buildContact(document, src);
      main.replaceChildren(...nodes, sectionMetadata(document, isHeader ? 'connect-band' : 'contact-aside'));
    } else {
      executeTransformers('beforeTransform', main, payload);
      findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
        if (!block.element.parentNode) return;
        try {
          parsers[block.name](block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers('afterTransform', main, payload);
    }
    // links to site pages: their EDS paths (after the cleanup's .html rewrite)
    edsLinkPaths(main);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    return [{
      element: main,
      path,
      report: { title: path, template: PAGE_TEMPLATE.name, xf: key },
    }];
  },
};
