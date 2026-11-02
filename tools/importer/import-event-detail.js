/* global WebImporter */

// PARSER IMPORTS
import eventDetailParser from './parsers/event-detail/event-detail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'event-detail',
  description: 'www.stryker.com event pages (/us/en/global-events/**, #499). The H2 event title becomes the H1; the event fields go in one Columns (columns-67-33): main cell = Meeting time / Location / Country / Contact (H5 + text), Details and Registration as underlined H5s (divider convention) with their text, the bold "Disclaimer:" paragraph and the register link in bold (primary button); sidebar cell = Related links or empty. Customizable Area extras (e.g. Contact Us, PDFs) follow as default content in their own section; a document code (.c-disclaimer, e.g. "1000903067 Rev A") as a small-print `disclaimer` section. Map, PRINT and ADD TO CALENDAR are dropped; the event facts are kept as event-* page metadata (ISO start/end, timezone, location, country, registration, contact). Template CSS (templates/event-detail) sets the Futura bold title and 14px field headings.',
  urls: [
    'https://www.stryker.com/us/en/global-events/emergency-care/association-meetings/refractory-cardiac-arrest-symposium.html',
  ],
  blocks: [
    { name: 'columns-67-33', instances: ['.c-event-detail-component'] },
  ],
};

const transformers = [cleanupTransformer];

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

/**
 * `published` (YYYY-MM-DD) from the source's #hiddenPublishedDate (MM/DD/YYYY), which drives
 * its "Last Updated" line.
 */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

/**
 * The page's document code (e.g. "1000903067 Rev A" in .c-disclaimer below the event), as
 * paragraphs; not the "Last Updated" line (#publishedDate).
 */
function documentCode(document) {
  return [...document.querySelectorAll('.c-disclaimer')]
    .filter((el) => !el.querySelector('#publishedDate') && !el.closest('.c-event-detail-component'))
    .flatMap((el) => [...el.querySelectorAll('p')])
    .filter((p) => p.textContent.trim())
    .map((p) => {
      const out = document.createElement('p');
      out.textContent = p.textContent.replace(/\s+/g, ' ').trim();
      return out;
    });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const published = publishedDate(document);
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim();
    const docCode = documentCode(document);

    executeTransformers('beforeTransform', main, payload);

    // rebuild the body: the title and the event Columns in one section (+ the Customizable
    // Area extras in a section of their own, + the document code as a small-print
    // `disclaimer` section)
    const event = eventDetailParser(document);
    const blocks = [];
    if (event) {
      const parts = [event.title, event.columns];
      blocks.push('columns');
      if (event.extras.length) parts.push(document.createElement('hr'), ...event.extras);
      if (docCode.length) {
        parts.push(document.createElement('hr'), ...docCode, WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: [['style', 'disclaimer']],
        }));
      }
      main.replaceChildren(...parts);
    } else {
      console.error('event-detail: no .c-event-detail-component on', params.originalURL);
    }

    executeTransformers('afterTransform', main, payload);

    // metadata
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    const facts = event ? event.facts : {};
    // the visible title (h2), not og:title: they differ on one page; the corp bulk
    // metadata adds the " | Stryker" suffix
    if (facts.title) meta.Title = facts.title;
    else if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    if (keywords) meta.Keywords = keywords;
    if (ogImage && !meta.Image) {
      const img = document.createElement('img');
      img.src = ogImage;
      meta.Image = img;
    }
    meta.site = 'corp';
    meta.template = 'event-detail';
    if (published) meta.published = published;
    // event facts for the event calendar (query index)
    const rows = {
      'event-start': facts.start,
      'event-end': facts.end,
      'event-timezone': facts.timezone,
      'event-location': facts.location,
      'event-country': facts.country,
      'event-registration': facts.registration,
      'event-contact-name': facts.contactName,
      'event-contact-email': facts.contactEmail,
    };
    Object.entries(rows).forEach(([k, v]) => { if (v) meta[k] = v; });
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
        blocks,
        extras: event ? event.extras.length : 0,
      },
    }];
  },
};
