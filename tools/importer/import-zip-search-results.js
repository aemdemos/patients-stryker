/* eslint-disable */
/* global WebImporter */

/**
 * Import: Zip skin closure — search-results landing page, as it renders when
 * opened on its own (no query string, so no results list).
 * Source: https://patients.stryker.com/us/en/zip-skin-closure/index/search-results.html
 *
 * Output (one section each):
 *   1. headline — the source "large headline" (two styled spans, no heading tag):
 *      <h1><em><strong>Love Zip?</strong></em></h1> (bold + italic = the project's
 *      gold Futura) + <p>Talk to a professional to learn more.</p>
 *   2. `Find a doctor (anatomy)` block — key/value rows taken from the source
 *      FIND A DOCTOR button's data-* attributes (area of body, business units,
 *      procedures) plus the area-of-body option list; section style
 *      `light-gray, full-bleed` (the gray band).
 *   3. empty section, style `spacer` — the 30px gap below the gray band
 *   4. disclaimer paragraph(s) — section style `compact`.
 *   Metadata: Title / Description (from the page) + theme `search-results` (shared with the IVS search-results page).
 *
 * Dropped (chrome or runtime-only): header/nav, footer, cookie banner, the
 * surgeon-locator results widget (filters/list/map — empty without a search),
 * the auto-generated "Last Updated" line (the site adds its own) and scripts.
 * nav/footer come from the bulk metadata sheet (/us/en/zip-skin-closure/**).
 */

// the source's area-of-body list, used when the live dropdown isn't populated
const FALLBACK_ANATOMY = ['Hip and knee', 'Shoulder and neck', 'Skin', 'Spine (Back)'];

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function buildHeadline(document) {
  const box = document.querySelector('.c-largeheadline .largeheadline');
  const nodes = [];
  if (!box) return nodes;
  const line1 = text(box.querySelector('.line1'));
  const line2 = text(box.querySelector('.line2'));
  if (line1) {
    const h1 = document.createElement('h1');
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    strong.textContent = line1;
    em.append(strong);
    h1.append(em);
    nodes.push(h1);
  }
  if (line2) {
    const p = document.createElement('p');
    p.textContent = line2;
    nodes.push(p);
  }
  return nodes;
}

function buildSearch(document) {
  const button = document.querySelector('#find-surgeon');
  if (!button) return null;
  const optionEls = [...document.querySelectorAll('#anatomy-listbox [role="option"]')];
  const options = optionEls.length ? optionEls.map((o) => text(o)) : FALLBACK_ANATOMY;
  // data-anatomy holds the option value (e.g. "skin"); author the readable label
  const value = (button.dataset.anatomy || '').toLowerCase();
  const toValue = (label) => label.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
  const selected = options.find((label) => toValue(label) === value) || '';

  const cells = [];
  if (selected) cells.push(['Area of body', selected]);
  cells.push(['Area of body options', options.join(', ')]);
  if (button.dataset.businessunits) cells.push(['Business units', button.dataset.businessunits]);
  if (button.dataset.procedures) cells.push(['Procedures', button.dataset.procedures]);
  return WebImporter.Blocks.createBlock(document, { name: 'Find a doctor (anatomy)', cells });
}

function buildDisclaimer(document) {
  // the authored disclaimer is `.c-disclaimer.page-section` WITHOUT `.container`
  // (`.container.c-disclaimer` is the auto "Last Updated" line)
  const box = document.querySelector('.c-disclaimer.page-section:not(.container)');
  if (!box) return [];
  return [...box.querySelectorAll('p')]
    .map((p) => text(p))
    .filter(Boolean)
    .map((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    });
}

const sectionMetadata = (document, style) => WebImporter.Blocks.createBlock(document, {
  name: 'Section Metadata',
  cells: { style },
});

export default {
  transform: ({ document, params }) => {
    const main = document.createElement('div');

    // 1. headline
    main.append(...buildHeadline(document));

    // 2. search bar (gray full-bleed band)
    const search = buildSearch(document);
    if (search) {
      main.append(document.createElement('hr'), search, sectionMetadata(document, 'light-gray, full-bleed'));
    }

    // 3. spacer (30px gap below the gray band, as authored in DA), then the disclaimer
    const disclaimer = buildDisclaimer(document);
    if (disclaimer.length) {
      main.append(document.createElement('hr'), sectionMetadata(document, 'spacer'));
      main.append(document.createElement('hr'), ...disclaimer, sectionMetadata(document, 'compact'));
    }

    // page metadata
    const meta = WebImporter.Blocks.getMetadata(document);
    // own theme only: the `zip-skin-closure` theme is page-wide styling for the
    // zip index (15% padding on gray sections, find-a-doctor band margins, …)
    meta.theme = 'search-results';
    main.append(document.createElement('hr'), WebImporter.Blocks.getMetadataBlock(document, meta));

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );
    return [{
      element: main,
      path,
      report: { title: document.title, blocks: search ? ['find-a-doctor (anatomy)'] : [] },
    }];
  },
};
