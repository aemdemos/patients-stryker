/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import videoParser from './parsers/video.js';

// TRANSFORMER IMPORTS
import newsDetailSectionsTransformer from './transformers/news-detail-sections.js';
import newsTypographyTransformer from './transformers/news-typography.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'news-detail-xf',
  description: 'www.stryker.com news articles whose body is an Experience Fragment (XF): the news-detail import, plus the XF handling. A shared XF (Resources links of Acute Care / Emergency Care) becomes a `fragment` block before the small print; any other XF is unwrapped in place and its AEM grid rows (2+ filled columns) become `columns` blocks with the variant nearest the span ratio (50-50, 67-33, 33-67, 75-25; 3+ cells no variant); blank section titles and empty rich text are dropped; a dimensional box becomes `Panel (left)`. Page metadata template stays news-detail.',
  urls: [
    'https://www.stryker.com/us/en/acute-care/news/acute-care-training-and-education-resources.html',
    'https://www.stryker.com/us/en/acute-care/news/nurse-led-innovation-and-the-power-of-partnership.html',
    'https://www.stryker.com/us/en/emergency-care/news/2024/life-saving-journey-inspires-community.html',
    'https://www.stryker.com/us/en/about/news/2026/a-message-to-our-customers-03-2026.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-launches-next-generation-of-surgicount--to-help-improve-.html',
    'https://www.stryker.com/us/en/about/news/2025/features/stryker-releases-2024-comprehensive-report.html',
    'https://www.stryker.com/us/en/about/news/features/improving-safety--spreading-truth-about-surgical-smoke.html',
    'https://www.stryker.com/us/en/about/news/2023/features/how-stryker-is-accelerating-innovation-in-additive-manufacturing.html',
    'https://www.stryker.com/us/en/about/news/features/employees-inspire-a-new-generation-of-robotics-engineers-through.html',
    'https://www.stryker.com/us/en/about/news/features/from-behind-the-scenes-to-the-front-line.html',
    'https://www.stryker.com/us/en/about/news/features/restoring-spines-and-hope.html',
    'https://www.stryker.com/us/en/about/news/2023/features/stryker-releases-comprehensive-report-highlighting-2022-performa.html',
    'https://www.stryker.com/us/en/about/news/2026/stryker-announces-leadership-succession.html',
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

// TRANSFORMER REGISTRY — the sections transformer rebuilds the body first (template
// news-detail-xf turns on its XF handling), then the news typography; the shared cleanup
// and DM image rewrite run after them.
const transformers = [
  newsDetailSectionsTransformer,
  newsTypographyTransformer,
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
    // the date below the title (`first-published`, YYYY-MM-DD): shown by the news-detail
    // template, as the bottom "Last Updated" line is rendered from `published`
    const firstPublished = main.getAttribute('data-first-published');
    if (firstPublished) {
      meta['first-published'] = firstPublished;
      main.removeAttribute('data-first-published');
    }
    if (published) meta.published = published;
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
