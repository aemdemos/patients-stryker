/* global WebImporter */
/*
 * The import script of a www.stryker.com template (every corp template except news-detail):
 * createCorpImport({ …template }) returns the object an import-<template>.js exports.
 *
 * The body is built by the corp section builder (corp-page.js through
 * transformers/corp-sections.js): every component in authored order, one handler per row of
 * the approved component table (decisions/component-map.json), XFs as Fragment blocks (their
 * documents come from import-xf-fragments.js), the page disclaimer last.
 * Metadata: title, description, keywords, site corp, template, published (the source "Last
 * Updated" date), hcp-banner, and the approved page facts from the AEM export (content-id,
 * tags, originally-published, image-alt).
 */
import corpSectionsTransformer from './transformers/corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { CORP_PAGE } from './corp-page.js';
import { markLivePage } from './corp-section-builder.js';

// corp-sections rebuilds the body first; the shared cleanup and the DM image rewrite follow
const transformers = [corpSectionsTransformer, cleanupTransformer, dmImagesTransformer];

const pagePath = (url) => new URL(url).pathname.replace(/\.html?$/, '');

/** The source "Last Updated" date (#hiddenPublishedDate, MM/DD/YYYY) as YYYY-MM-DD. */
function publishedDate(document) {
  const input = document.querySelector('#hiddenPublishedDate');
  const m = ((input && input.getAttribute('value')) || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/**
 * @param {object} template
 * @param {string} template.name the EDS template (metadata `template`, templates/<name>/)
 * @param {string} template.description what the template's pages hold
 * @param {string[]} template.urls example source URLs
 * @param {object} template.facts the template's page facts (data/page-facts/<aem template>.js)
 */
export function createCorpImport({
  name, description, urls, facts: PAGE_FACTS,
}) {
  const PAGE_TEMPLATE = {
    name, site: 'corp', description, urls,
  };

  function executeTransformers(hookName, element, payload) {
    const facts = PAGE_FACTS[pagePath(payload.params.originalURL)] || null;
    const enhancedPayload = {
      ...payload, template: PAGE_TEMPLATE, corp: CORP_PAGE, facts,
    };
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }

  return {
    // on the live page, before the import: what it hides and what its forms load
    onLoad: ({ document }) => markLivePage(document),

    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const published = publishedDate(document);
      const hcpBanner = document.querySelector('.g-hcpbanner');
      const hcp = !!(hcpBanner && hcpBanner.textContent.trim());
      const keywords = (document.querySelector('meta[name="keywords" i]') || { content: '' }).content.trim();
      const meta = WebImporter.Blocks.getMetadata(document);

      executeTransformers('beforeTransform', main, payload);
      const report = JSON.parse(main.getAttribute('data-corp-report') || '{}');
      main.removeAttribute('data-corp-report');
      executeTransformers('afterTransform', main, payload);

      // the corp bulk metadata adds the " | Stryker" title suffix
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
      if (keywords) meta.Keywords = keywords;
      meta.site = 'corp';
      meta.template = name;
      if (published) meta.published = published;
      if (hcp) meta['hcp-banner'] = 'true';
      const facts = PAGE_FACTS[pagePath(params.originalURL)];
      if (facts) {
        const m = facts.metadata;
        if (!meta.Title && m.title) meta.Title = m.title;
        if (!meta.Description && m.description) meta.Description = m.description;
        if (m.contentID) meta['content-id'] = m.contentID;
        if (m.tags && m.tags.length) meta.tags = m.tags.join(', ');
        if (m.originallyPublished) meta['originally-published'] = m.originallyPublished.slice(0, 10);
        if (m.imageAlt) meta['image-alt'] = m.imageAlt;
      }
      main.append(document.createElement('hr'));
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

      const path = WebImporter.FileUtils.sanitizePath(pagePath(params.originalURL));
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          unhandled: (report.unhandled || []).join(' | '),
          notes: (report.notes || []).join(' | '),
          hidden: report.hidden || 0,
        },
      }];
    },
  };
}

export default createCorpImport;
