/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import videoParser from './parsers/video.js';

// TRANSFORMER IMPORTS
import newsDetailSectionsTransformer from './transformers/news-detail-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
// authored page data from the AEM export (npm run build:migration-index)
import PAGE_FACTS from './data/page-facts/news-detail.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'news-detail',
  description: 'www.stryker.com news feature articles (/us/en/about/news/YEAR/features/). Title section (H1 only when the source has one, H5 publish date); lead media: single-slide autocarousel as Hero Corp (image-slide) with the source headline position/size as variant options, or a standalone image; article sections (rich text, images, Video block) in the 66.66% centred column (template CSS); centred rich text + gold curated CTA as a `center` section; references and document code as a small-print `disclaimer` section; `published` metadata drives the corp Last Updated line.',
  urls: [
    'https://www.stryker.com/us/en/about/news/2022/features/this-surgical-icu-team-is-bound-by-unspeakable-trauma-and-miracu.html',
    'https://www.stryker.com/us/en/about/news/2026/features/stryker-releases-2025-comprehensive-report.html',
    'https://www.stryker.com/us/en/smart-care/news/building-a-connected-smart-hospital.html',
    'https://www.stryker.com/us/en/about/news/2026/avs-now-part-of-stryker-enrolls-first-patient-in-first-in-human-coronary-intravascular-lithotripsy-study.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-introduces-first-of-its-kind-fda-authorized-surgical-application-for-apple-vision-pro-with-hip-arthroscopy-case.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-signs-definitive-agreement-to-acquire-zurimed-to-enhance.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-introduces-mako-handheld-robotics-mako-rps.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-showcases-prophecy-surgical-planning-for-incompass-at-aofas.html',
  ],
  blocks: [
    { name: 'hero-image-slide', instances: ['.c-autocarousel'] },
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-teaser', instances: ['.c-customizeable'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-image-slide': heroImageSlideParser,
  video: videoParser,
  'cards-corp-teaser': cardsCorpTeaserParser,
};

// TRANSFORMER REGISTRY — the sections transformer rebuilds the body first (it runs
// only for news-detail); the shared cleanup and DM image rewrite run after it.
const transformers = [
  newsDetailSectionsTransformer,
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

/**
 * The article date as `published` (YYYY-MM-DD): the source's hidden published date
 * (#hiddenPublishedDate, MM/DD/YYYY), which also drives its "Last Updated" line.
 */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const updated = document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);
  if (!updated) return '';
  const month = new Date(`${updated[1]} 1, 2000`).getMonth() + 1;
  return `${updated[2]}-${String(month).padStart(2, '0')}`;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const published = publishedDate(document);

    // 1. beforeTransform: rebuild the article content, strip chrome
    executeTransformers('beforeTransform', main, payload);

    // 2. block parsers
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    // 3. afterTransform: links, DM images, final cleanup
    executeTransformers('afterTransform', main, payload);

    // 4. metadata. The corp bulk sheet sets site + template on /us/en/about/news/**; they
    // are repeated on the page so it renders the same anywhere (drafts, local preview).
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    // the corp bulk metadata adds `title:suffix` "| Stryker", so drop the source's own
    // " | Stryker" from the title (it would show twice)
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    // keywords, as on the source page (<meta name="keywords">, e.g. "News, Our impact")
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = 'news-detail';
    if (published) meta.published = published;
    // page facts from the AEM export (approved 2026-10-27): regulatory document ID, AEM tags,
    // first publication date, share image alt text
    const facts = PAGE_FACTS[new URL(params.originalURL).pathname.replace(/\.html?$/, '')];
    if (facts) {
      const m = facts.metadata;
      if (m.contentID) meta['content-id'] = m.contentID;
      if (m.tags && m.tags.length) meta.tags = m.tags.join(', ');
      if (m.originallyPublished) meta['originally-published'] = m.originallyPublished.slice(0, 10);
      if (m.imageAlt) meta['image-alt'] = m.imageAlt;
    }
    // the share image (og:image) is the original /content/dam file, which can exceed the
    // 20MB preview limit (e.g. a 27MB PNG on the OR of the Future page). When the article
    // shows the same picture from Dynamic Media, the share image uses that rendition.
    const shareImage = meta.Image && (meta.Image.querySelector ? meta.Image.querySelector('img') || meta.Image : meta.Image);
    const shareSrc = shareImage && shareImage.getAttribute && shareImage.getAttribute('src');
    if (shareSrc && /\/content\/dam\//.test(shareSrc)) {
      const fileName = (u) => decodeURIComponent(u.split('?')[0].split('/').pop()).replace(/\.[a-z0-9]+$/i, '').toLowerCase();
      const name = fileName(shareSrc);
      const dm = [...main.querySelectorAll('a[href*="media-assets.stryker.com/is/image/"], img[src*="media-assets.stryker.com/is/image/"]')]
        .map((el) => el.getAttribute('href') || el.getAttribute('src'))
        .find((u) => fileName(u) === name);
      if (dm) shareImage.setAttribute('src', dm);
    }
    // pages the sections transformer marks (a video + Large Headline row) run the title
    // and small print full width: the news-detail `full-width` theme
    const theme = main.getAttribute('data-news-theme');
    if (theme) {
      meta.theme = theme;
      main.removeAttribute('data-news-theme');
    }
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
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
