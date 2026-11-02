/*
 * www.stryker.com news articles (AEM template news-detail, 710 pages: press releases,
 * features, StrykerTalks) → EDS pages with template news-detail-engine, through the shared
 * corp import (corp-import.js: section builder, page facts metadata), like every corp template.
 * The EDS template has its own name so these pages can sit next to the news-detail template
 * (import-news-detail.js) and the two approaches can be compared (agreed 2026-11-02).
 *
 * Import: run with the news-detail URLs taken from the export file names, together with the
 * template's XF lists (data/catalog/xf-urls-news-detail.txt, xf-urls-slides-news-detail.txt).
 */
import { createCorpImport } from './corp-import.js';
import PAGE_FACTS from './data/page-facts/news-detail.js';

export default createCorpImport({
  name: 'news-detail-engine',
  description: 'www.stryker.com news articles: page title (h1-title) and publish date, lead slide (Hero Corp) or image, article rich text, images and videos, curated CTAs, related cards, XFs (Fragment), references and document code (page disclaimer).',
  urls: [
    'https://www.stryker.com/us/en/about/news/2023/stryker-s-pangea-systems-receive-fda-clearance.html',
  ],
  facts: PAGE_FACTS,
});
