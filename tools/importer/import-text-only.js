/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import cardsCorpResourcesParser from './parsers/cards-corp-resources.js';
import videoParser from './parsers/video.js';

// TRANSFORMER IMPORTS
import representativeNormaliseTransformer from './transformers/news-representative-normalise.js';
import newsDetailSectionsTransformer from './transformers/news-detail-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import textOnlyTransformer from './transformers/news-text-only.js';
import pageCorrectionsTransformer from './transformers/patients-stryker-page-corrections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'text-only',
  description: 'www.stryker.com text-only news releases and product-security bulletins: title, date, optional lead image, rich text in the 66.66% column, `separator` sections (About Stryker, media contacts) and small print. Imported with the news-detail parsers and transformers as news-detail pages on the `basic` theme (newsGroup: the `basic` group of news-representative-normalise.js for every page not listed in another group); news-text-only.js sets ™ / ® as superscript and drops a spacer directly before a separator.',
  // the news-representative-normalise.js group for pages it does not list itself
  newsGroup: 'basic',
  urls: [
    'https://www.stryker.com/us/en/about/news/2024/stryker-announces-definitive-agreement-to-acquire-artelon--inc--.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-care-ai.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-nico-corporation--expanding-min.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-molli-surgical.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-artelon-inc.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-serf-sas.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-expands-foot---ankle-portfolio-with-specialized-offering.html',
    'https://www.stryker.com/us/en/about/news/2024/stryker-expands-prophecy-surgical-planning-system-to-include-the.html',
    'https://www.stryker.com/us/en/about/news/2023/stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet.html',
    'https://www.stryker.com/us/en/about/news/2023/stryker-s-pangea-systems-receive-fda-clearance.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a.html',
    'https://www.stryker.com/us/en/about/news/2022/2022-ana-innovation-award-winners-address-gaps-in-health-equity-.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-announces-first-patient-case-using--new-tornier-perform-.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-launches--free-your-feet--campaign-to-raise-awareness-ab.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-launches-prostep--mica-solo-guide--to-simplify-minimally.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-.html',
    'https://www.stryker.com/us/en/about/news/2022/stryker-launches-insignia--femoral-hip-stem-at-the-american-acad.html',
    'https://www.stryker.com/us/en/about/news/2021/stryker-enters-national-partnership-with-minor-league-baseball-t.html',
    'https://www.stryker.com/us/en/about/news/2021/stryker-introduces-market-leading-tornier-shoulder-arthroplasty-.html',
    'https://www.stryker.com/us/en/about/news/2021/stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v.html',
    'https://www.stryker.com/us/en/about/news/2020/awareness-campaign-launched-to-support-world-restart-a-heart-day.html',
    'https://www.stryker.com/us/en/about/news/2020/stryker-releases-emergency-relief-bed.html',
    'https://www.stryker.com/us/en/about/news/2020/stryker-completes-acquisition-of-wright-medical.html',
    'https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html',
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html',
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html',
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html',
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html',
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html',
  ],
  blocks: [
    { name: 'hero-image-slide', instances: ['.c-autocarousel'] },
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-teaser', instances: ['.c-customizeable', '.c-latestnews'] },
    { name: 'cards-corp-resources', instances: ['.c-resourcesanddownload'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-image-slide': heroImageSlideParser,
  video: videoParser,
  'cards-corp-teaser': cardsCorpTeaserParser,
  'cards-corp-resources': cardsCorpResourcesParser,
};

// TRANSFORMER REGISTRY — as import-news-detail.js: the representative group first (every
// page here gets the `basic` group unless it is listed in another one), the sections
// transformer rebuilds the body, the shared cleanup (links without .html) and the DM image
// rewrite run after it, then the text-only rules (™ / ® superscript, no spacer before a
// separator) on the final body, and last each page's reviewed DA edits.
const transformers = [
  representativeNormaliseTransformer,
  newsDetailSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
  textOnlyTransformer,
  // persisted DA edits (excat-persist-content-edit): last, on the final page
  pageCorrectionsTransformer,
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
    // " | Stryker" from the title (it would show twice) — every trailing copy of it, as a few
    // source titles carry it twice ("Closing the gap in fecal management | Stryker | Stryker")
    if (meta.Title) meta.Title = meta.Title.replace(/(\s*\|\s*Stryker)+\s*$/i, '');
    // keywords, as on the source page (<meta name="keywords">, e.g. "News, Our impact")
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    // metadata a page correction sets (patients-stryker-page-corrections.js: `data-meta-<name>`
    // on the body, e.g. the `tags` authors added in DA, which the source page does not carry),
    // in the DA order: after Keywords
    [...main.attributes].filter((a) => a.name.startsWith('data-meta-')).forEach((a) => {
      meta[a.name.slice('data-meta-'.length)] = a.value;
      main.removeAttribute(a.name);
    });
    meta.site = 'corp';
    // text-only pages render with the news-detail template, on the `basic` theme (the group's
    // theme; `basic` if none was set), listed right after the template as in DA
    meta.template = 'news-detail';
    meta.theme = main.getAttribute('data-news-theme') || 'basic';
    main.removeAttribute('data-news-theme');
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
    const xf = main.getAttribute('data-news-xf');
    if (xf) main.removeAttribute('data-news-xf');
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
        fragments: xf || '',
      },
    }];
  },
};
