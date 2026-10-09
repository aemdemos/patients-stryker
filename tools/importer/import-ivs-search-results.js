/* eslint-disable */
/* global WebImporter */

/**
 * Import: IVS find-a-doctor search-results landing page, as it renders when
 * opened on its own (no query string, so no results list).
 * Source: https://patients.stryker.com/us/en/ivs/find-a-doctor/search-results.html
 *
 * Output (one section each):
 *   0. empty section, style `spacer, large` — the ~60px gap above the heading
 *   1. intro — the page h1 + a `Panel (colored-border)` block with the two
 *      gray info boxes (gold / purple top bar). Each row: <p>title</p> + the
 *      body paragraph(s), links kept.
 *   2. empty sections, styles `spacer` then `divider` — the gap below the boxes
 *      and the source hr.c-section-separator (a full-width gray rule with ~50px
 *      below it)
 *   3. `Find a doctor (anatomy)` block — the area-of-body option list (no area is
 *      preselected on this page, so the block shows "No filters selected");
 *      section style `light-gray, full-bleed` (the gray band).
 *   4. empty section, style `spacer` — the 30px gap above the disclaimer
 *   5. disclaimer paragraph(s) — section style `compact`.
 *   Metadata: Title / Description (from the page) + theme `search-results` (shared with the zip search-results page;
 *   the source h1 text is a fontsize-1-5em span: 42px instead of the default 28px).
 *
 * Dropped (chrome or runtime-only): header/nav, footer, cookie banner, the
 * surgeon-locator results widget (filters/list/map — empty without a search),
 * the colored-bar spacer paragraphs (the panel variant draws the bars), the
 * auto-generated "Last Updated" line (the site adds its own) and scripts.
 * nav/footer come from the bulk metadata sheet (/us/en/ivs/**).
 */

const ORIGIN = 'https://patients.stryker.com';

// the source's area-of-body list, used when the live dropdown isn't populated
const FALLBACK_ANATOMY = ['Hip and knee', 'Shoulder and neck', 'Skin', 'Spine (Back)'];

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

// rebuild a paragraph's inline content as plain text + links (drops the
// source's font-size / font-family spans)
function cleanParagraph(document, src) {
  const p = document.createElement('p');
  src.childNodes.forEach(function walk(node) {
    if (node.nodeType === 3) {
      p.append(document.createTextNode(node.textContent.replace(/[\s\u00a0]+/g, ' ')));
    } else if (node.nodeName === 'A') {
      const a = document.createElement('a');
      const href = node.getAttribute('href') || '';
      a.href = href.startsWith('/') ? `${ORIGIN}${href}` : href;
      a.textContent = text(node);
      p.append(a);
    } else if (node.nodeName !== 'BR') {
      node.childNodes.forEach(walk);
    }
  });
  // trim the outer whitespace and collapse doubled spaces between nodes
  p.normalize();
  const first = p.firstChild;
  const last = p.lastChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return p.textContent.trim() ? p : null;
}

function buildHeading(document) {
  const h1 = document.querySelector('.c-rich-text-editor h1');
  if (!h1) return null;
  const heading = document.createElement('h1');
  heading.textContent = text(h1).replace(/\u00a0/g, ' ');
  return heading;
}

function buildInfoPanel(document) {
  // the gray boxes of the two-column control (the gold/purple bars are separate
  // empty rich-text boxes above them)
  const boxes = [...document.querySelectorAll('.colctrl .has-background.bg-light-gray')];
  if (!boxes.length) return null;
  const cells = boxes.map((box) => {
    const [titleP, ...bodyPs] = [...box.querySelectorAll(':scope > p')];
    const cell = document.createElement('div');
    // the title is a plain first paragraph: the variant styles it in the light
    // serif (source Egyptienne, regular) \u2014 <strong> would switch it to Futura bold
    if (titleP && text(titleP)) {
      const p = document.createElement('p');
      p.textContent = text(titleP).replace(/\u00a0/g, ' ');
      cell.append(p);
    }
    bodyPs.map((p) => cleanParagraph(document, p)).filter(Boolean).forEach((p) => cell.append(p));
    return [cell];
  });
  return WebImporter.Blocks.createBlock(document, { name: 'Panel (colored-border)', cells });
}

function buildSearch(document) {
  const button = document.querySelector('#find-surgeon');
  if (!button) return null;
  const optionEls = [...document.querySelectorAll('#anatomy-listbox [role="option"]')];
  const options = optionEls.length ? optionEls.map((o) => text(o)) : FALLBACK_ANATOMY;
  // data-anatomy holds a preselected option value (e.g. "skin"), if any
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
    const blocks = [];

    // 0. large spacer above the heading (the source's gap below the header)
    main.append(sectionMetadata(document, 'spacer, large'), document.createElement('hr'));

    // 1. intro: heading + colored-border info boxes
    const heading = buildHeading(document);
    if (heading) main.append(heading);
    const panel = buildInfoPanel(document);
    if (panel) {
      main.append(panel);
      blocks.push('panel (colored-border)');
    }

    // 2. separator rule between the intro and the search bar (the importer
    // strips the source hr.c-section-separator before transform, so it can't
    // be detected — the page always has it there)
    const search = buildSearch(document);
    // (a spacer first: the source rule sits ~30-40px below the boxes)
    if ((heading || panel) && search) {
      main.append(document.createElement('hr'), sectionMetadata(document, 'spacer'));
      main.append(document.createElement('hr'), sectionMetadata(document, 'divider'));
    }

    // 3. search bar (gray full-bleed band)
    if (search) {
      main.append(document.createElement('hr'), search, sectionMetadata(document, 'light-gray, full-bleed'));
      blocks.push('find-a-doctor (anatomy)');
    }

    // 4. + 5. spacer, then the disclaimer
    const disclaimer = buildDisclaimer(document);
    if (disclaimer.length) {
      main.append(document.createElement('hr'), sectionMetadata(document, 'spacer'));
      main.append(document.createElement('hr'), ...disclaimer, sectionMetadata(document, 'compact'));
    }

    // page metadata
    const meta = WebImporter.Blocks.getMetadata(document);
    // page theme: the source h1 is enlarged 1.5x (42px) — see styles/themes.css
    meta.theme = 'search-results';
    main.append(document.createElement('hr'), WebImporter.Blocks.getMetadataBlock(document, meta));

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );
    return [{
      element: main,
      path,
      report: { title: document.title, blocks },
    }];
  },
};
