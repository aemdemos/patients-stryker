/* global WebImporter */
/**
 * In review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/event-calendar.md):
 * - a stryker.com events calendar (`.c-event`, the eventcalendar component) → an
 *   `Event Calendar` block with the folder of its event pages (the component's `data-sp`), its
 *   title as a Heading 2 before it;
 * - an event page → the facts the calendar's filters use, as page metadata (event-city,
 *   event-state, event-type, audience, business-unit, specialty), read from stryker.com's own
 *   calendar feed (/bin/stryker/calevent) while importing.
 * The committed bundles keep today's output: the calendar is left out and the event pages carry
 * the facts they carry today.
 */

// stryker.com tag → the title its calendars show (the filter labels of the three calendars)
const TAG_TITLES = {
  'stryker:event-type/bioskills': 'Bioskills',
  'stryker:event-type/lab': 'Lab',
  'stryker:event-type/associationmeetings': 'Association meetings',
  'stryker:event-type/medical_education': 'Medical Education',
  'stryker:event-type/symposium': 'Symposium',
  'stryker:event-type/Trade_Show': 'Trade Show',
  'stryker:audience/medical_professionals': 'Medical professionals',
  'stryker:audience/trainees': 'Residents, fellows and surgical trainees',
  'stryker:audience/nurses': 'Nurses',
  'stryker:audience/or-professionals': 'OR professionals',
  'stryker:business-unit/ems': 'Emergency care',
  'stryker:business-unit/surgical': 'Surgical',
  'stryker:business-unit/SAGE': 'SAGE',
  'stryker:business-unit/sports-medicine': 'Sports medicine',
  'stryker:business-unit/acute-care': 'Acute care',
  'stryker:business-unit/medical': 'Medical',
  'stryker:business-unit/surgical_technologies': 'Surgical Technologies',
  'stryker:business-unit/endoscopy': 'Endoscopy',
  'stryker:custom/endoscopy': 'Endoscopy',
  'stryker:capability/temperature-management': 'Temperature management',
  'stryker:specialty/precision-temperature-management': 'Precision temperature management',
  'stryker:services/procare/acute-care/temperature-management': 'Temperature management',
  'stryker:event-speciailty/sports-medicine': 'Sports medicine',
  'stryker:specialty/surgical-visualization': 'Surgical Visualization',
};

// a tag without a known title: its last part, words separated
const tagTitle = (tag) => TAG_TITLES[tag] || String(tag).split('/').pop()
  .replace(/[_-]+/g, ' ')
  .replace(/^\w/, (c) => c.toUpperCase());

/** an AEM content path → the page path on the new site (as WebImporter.FileUtils.sanitizePath) */
export function sitePath(aemPath) {
  const path = String(aemPath || '').replace(/^\/content\/stryker/, '').replace(/\.html?$/, '');
  return path.split('/').map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).join('/');
}

function calendarFeed(searchPath) {
  try {
    // synchronous on purpose: the import transformers are synchronous
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/bin/stryker/calevent?searchPath=${encodeURIComponent(searchPath)}`, false);
    xhr.send();
    if (xhr.status !== 200) return [];
    return JSON.parse(xhr.responseText).data || [];
  } catch (e) {
    return [];
  }
}

/**
 * The calendar facts of an event page, from stryker.com's calendar feed.
 * @param {string} pathname The source page's path (/us/en/global-events/…/x.html)
 * @returns {Object<string,string>} Metadata rows (empty when the page isn't in the feed)
 */
export function eventFacets(pathname) {
  const folder = `/content/stryker${pathname.replace(/\/[^/]*$/, '')}`;
  const event = calendarFeed(folder).find((e) => {
    try {
      return new URL(e.url, 'https://www.stryker.com').pathname.endsWith(pathname);
    } catch (err) {
      return false;
    }
  });
  if (!event) return {};
  // several values are separated by semicolons: some titles hold commas ("Residents, fellows
  // and surgical trainees")
  const titles = (tags) => [...new Set([].concat(tags || []).map(tagTitle))].join('; ');
  return {
    'event-city': event.cities || '',
    'event-state': event.stateProvinces || '',
    'event-type': titles(event.eventTypes),
    audience: titles(event.audiences),
    'business-unit': titles(event.bus),
    specialty: titles(event.specialities),
  };
}

/**
 * Turns each events calendar of the page into an Event Calendar block.
 * @param {Element} main The page content
 * @param {Document} doc The document
 */
export function eventCalendarBlocks(main, doc) {
  main.querySelectorAll('.c-event').forEach((component) => {
    const sp = component.querySelector('[data-sp]');
    const from = component.closest('.event') || component;
    if (!sp) {
      from.remove();
      return;
    }
    const parts = [];
    const title = component.querySelector('.title-container h2');
    if (title && title.textContent.trim()) {
      const h2 = doc.createElement('h2');
      h2.textContent = title.textContent.trim();
      h2.setAttribute('data-keep', 'section');
      parts.push(h2);
    }
    const block = WebImporter.Blocks.createBlock(doc, {
      name: 'Event Calendar',
      cells: [['Folder', sitePath(sp.getAttribute('data-sp'))]],
    });
    block.setAttribute('data-std-table', '');
    // kept as a component of the page (as the other blocks of long-page-detail-corp-components)
    block.setAttribute('data-keep', 'section');
    parts.push(block);
    from.replaceWith(...parts);
  });
}
