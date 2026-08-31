/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patient-information-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// FRAGMENT CONFIGURATION
// Extracts ONLY the "Stroke awareness resources / Understanding stroke / Regional
// information" 3-column band from the US patient-information source page and
// writes it to /fragments/patient-information-resources — a reusable fragment
// document (same pattern as the /fragments/card-* documents). The main
// patient-information page then embeds this via a `fragment` block, so the
// resources band is authored once and shared.
//
// NOTE: this is the US variant, deliberately named distinctly from the existing
// /fragments/stroke-awareness-resources (the WW variant, already in use with a
// different middle column + /ww/ links) so the two never collide.
const FRAGMENT = {
  name: 'patient-information-resources',
  // where the fragment document is written (DA path, no .html)
  path: '/fragments/patient-information-resources',
  urls: [
    'https://patients.stryker.com/us/en/stroke-awareness/patient-information.html',
  ],
  blocks: ['columns'],
};

/** Execute all transformers for a specific hook. */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: FRAGMENT };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Build the 3-column resources band as a `columns` block. Each column keeps its
 * gold heading (bold+italic), supporting copy, and links, moved from the source.
 * Identical extraction to the main page's buildResourcesColumns, so the fragment
 * content matches exactly what the page used to render inline.
 */
function buildResourcesColumns(doc, source) {
  const cols = [...source.querySelectorAll('.bg-light-gray .cols3 .col-md-4')];
  const cells = cols.map((col) => {
    const cell = doc.createElement('div');
    // Move every authored paragraph across (headings, copy, links), skipping the
    // empty `&nbsp;` spacer paragraphs the source uses for vertical rhythm.
    [...col.querySelectorAll('.text .c-rich-text-editor > div')].forEach((rt) => {
      [...rt.children].forEach((node) => {
        const txt = node.textContent.replace(/ /g, ' ').trim();
        if (!txt && !node.querySelector('a, img, picture')) return; // drop spacers
        cell.append(node);
      });
    });
    // CTA links ("Spread the word" / "Learn More") — author as UNDERLINE-ONLY
    // (<a><u>…</u></a>), matching the sibling WW /fragments/stroke-awareness-
    // resources exactly. The columns block's own CSS styles `.section.light-gray
    // .columns a:has(u)` as the flat Futura-bold uppercase teal CTA + chevron, so
    // no template CSS is needed. Crucially the CTA is NOT wrapped in <strong>: a
    // bold link would trip decorateButtons (strong+u → .link-strong, which strips
    // the <u> and breaks the a:has(u) hook, or bold alone → a filled button).
    // Underline-only makes decorateButtons bail (no strong/em), so the <u>
    // survives for the block selector. Regional links get no <u> → stay plain.
    [...cell.querySelectorAll('a')].forEach((a) => {
      const isCta = a.closest('.standalone-link') || a.querySelector('.standalone-link');
      if (!isCta || a.querySelector('u')) return;
      const u = doc.createElement('u');
      while (a.firstChild) u.appendChild(a.firstChild);
      a.appendChild(u);
    });
    return cell;
  });
  return WebImporter.DOMUtils.createTable([['Columns'], cells], doc);
}

/** A `Section Metadata` block table applying the given Style value. */
function sectionMetadata(doc, style) {
  return WebImporter.DOMUtils.createTable([
    ['Section Metadata'],
    ['Style', style],
  ], doc);
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document } = payload;
    const source = document.body;

    // 1. Cleanup: strip chrome + normalise gold labels (so the columns' gold
    //    headings become bold+italic, matching the main page).
    executeTransformers('beforeTransform', source, payload);
    executeTransformers('afterTransform', source, payload);

    // 2. Fragment body = the columns block PLUS its own section metadata. The
    //    band's `light-gray, full-bleed` styling lives INSIDE the fragment (same
    //    as the sibling WW /fragments/stroke-awareness-resources) so it renders
    //    self-contained wherever it's embedded — the host page doesn't need to
    //    re-declare the section style. No page-level metadata block (that's only
    //    for full pages, not fragments).
    const main = document.createElement('div');
    main.append(buildResourcesColumns(document, source));
    main.append(sectionMetadata(document, 'light-gray, full-bleed'));

    // 3. Write to the fragment path (overrides the source URL's derived path).
    return [{
      element: main,
      path: FRAGMENT.path,
      report: {
        title: 'Patient Information Resources (fragment)',
        template: FRAGMENT.name,
        blocks: FRAGMENT.blocks,
      },
    }];
  },
};
