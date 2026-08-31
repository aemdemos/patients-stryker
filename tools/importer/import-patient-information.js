/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patient-information-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
// The Neurovascular "Patient information" landing page. Main content maps onto
// existing blocks:
//   - title bar ................ hero (band)      — gold H1 over the Resources gradient bar
//   - intro line ............... default content  — <h2>
//   - 4 patient-guide cards .... cards (resources)— 4-up portrait covers + PDF/product links
//   - gold CTA band ............ default content in a `gold, full-bleed` section
//   - resources footer ......... columns          — 3-column link band in a `light-gray` section
//   - disclaimer / doc id ...... default content
const PAGE_TEMPLATE = {
  name: 'patient-information',
  description: 'Neurovascular patient-information landing page: gold title bar (hero band), intro line, a 4-up row of patient-guide brochure cards (cards resources), a gold "for more information" CTA band, a 3-column resources footer (columns) on a light-gray band, and a trademark/disclaimer block. Reuses existing blocks only.',
  urls: [
    'https://patients.stryker.com/us/en/stroke-awareness/patient-information.html',
  ],
  blocks: ['hero', 'cards', 'columns'],
};

const DM_HOST_RE = /media-assets\.stryker\.com\/is\/image\//i;

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/** A bare Dynamic Media autolink (href = text = the DM URL). dm-support.js
 * converts these to native <picture> at native quality on the live site. Using
 * setAttribute (not .href) preserves the Scene7 `$..._png$` preset verbatim. */
function dmAutolink(doc, url, title) {
  const a = doc.createElement('a');
  a.setAttribute('href', url);
  a.textContent = url;
  if (title) a.setAttribute('title', title);
  return a;
}

/** Wrap a set of nodes in a fresh <p>. */
function p(doc, ...nodes) {
  const el = doc.createElement('p');
  nodes.forEach((n) => n && el.append(n));
  return el;
}

/** A gold accent CTA: <a><em><strong>text</strong></em></a> — decorateButtons
 * promotes bold+italic links to the gold `.button.accent` (source `.btn-gold`). */
function goldButton(doc, href, text) {
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  const em = doc.createElement('em');
  const strong = doc.createElement('strong');
  strong.textContent = text;
  em.append(strong);
  a.append(em);
  return a;
}

/** A plain (teal) standalone link, left un-buttonized by decorateButtons. */
function plainLink(doc, href, text) {
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  return a;
}

/** Heading of the given level with the supplied (moved or created) child nodes. */
function heading(doc, level, ...nodes) {
  const h = doc.createElement(level);
  nodes.forEach((n) => n && h.append(n));
  return h;
}

/** A `Fragment` block table referencing the fragment path (href = text = path).
 * Matches the project's authored convention (see /us/en/ivs/resources). The
 * fragment block fetches `${path}.plain.html` and inlines its decorated content. */
function fragmentBlock(doc, path) {
  return WebImporter.DOMUtils.createTable([
    ['Fragment'],
    [plainLink(doc, path, path)],
  ], doc);
}

/**
 * Build the hero (band) block: gold "Patient information" title overlaid on the
 * Resources gradient bar. Desktop + mobile background images are authored as
 * their own single-cell rows (matching blocks/hero + the hero-band draft).
 */
function buildHeroBand(doc, source) {
  // The two decorative banner backgrounds live in the top autocarousel as
  // <img class="img-responsive u-inline-block" src="...Resources-background...">.
  const bgImgs = [...source.querySelectorAll('img.img-responsive.u-inline-block')]
    .filter((img) => /Resources-background/i.test(img.getAttribute('src') || ''));
  const desktop = bgImgs.find((i) => !/mobile/i.test(i.getAttribute('src')));
  const mobile = bgImgs.find((i) => /mobile/i.test(i.getAttribute('src')));

  const rows = [['Hero (band)']];
  if (desktop) rows.push([dmAutolink(doc, desktop.getAttribute('src'))]);
  if (mobile) rows.push([dmAutolink(doc, mobile.getAttribute('src'))]);

  // gold title — bold+italic paints it gold (see styles.css)
  const strong = doc.createElement('strong');
  const em = doc.createElement('em');
  em.textContent = 'Patient information';
  strong.append(em);
  rows.push([heading(doc, 'h1', strong)]);

  return WebImporter.DOMUtils.createTable(rows, doc);
}

/**
 * Build the cards (resources) block from the four `.col-md-3` brochure columns.
 * Each card row = [ cover image | body ]:
 *   - cover: bare DM autolink of the thumbnail (rendered as a portrait <picture>)
 *   - body:  <h3> title linking to the patient-guide PDF, an "Additional product
 *            information:" line, and a gold product-page button.
 */
function buildCards(doc, source) {
  const cols = [...source.querySelectorAll('.cols4 .col-md-3')];
  const rows = [['Cards (resources)']];

  cols.forEach((col) => {
    const coverAnchor = col.querySelector('.standaloneimage a[href]');
    const coverImg = col.querySelector('.standaloneimage img[src]');
    const pdfHref = coverAnchor ? coverAnchor.getAttribute('href') : null;
    const dmSrc = coverImg ? coverImg.getAttribute('src') : null;
    const alt = coverImg ? (coverImg.getAttribute('alt') || '') : '';

    // The title lives in the first rich-text paragraph after the image
    // (span.futura-bold, may contain a <sup>®</sup>). Move its inline nodes into
    // the PDF anchor so the ® superscript and spacing survive.
    const titleSpan = col.querySelector('.text .futura-bold');
    const titleAnchor = doc.createElement('a');
    if (pdfHref) titleAnchor.setAttribute('href', pdfHref);
    if (titleSpan) {
      [...titleSpan.childNodes].forEach((n) => {
        // drop the trailing empty <br>/<span> spacer nodes the source appends
        if (n.nodeType === 1 && (n.tagName === 'BR')) return;
        if (n.nodeType === 1 && n.tagName === 'SPAN' && !n.textContent.trim()) return;
        titleAnchor.append(n);
      });
    } else if (alt) {
      titleAnchor.textContent = alt;
    }

    // gold product-page button (source .curatedcta a.btn-gold)
    const cta = col.querySelector('.curatedcta a[href]');
    const bodyNodes = [heading(doc, 'h3', titleAnchor)];
    bodyNodes.push(p(doc, doc.createTextNode('Additional product information:')));
    if (cta) {
      bodyNodes.push(p(doc, goldButton(doc, cta.getAttribute('href'), cta.textContent.trim())));
    }

    const bodyCell = doc.createElement('div');
    bodyNodes.forEach((n) => bodyCell.append(n));

    // cover cell — bare DM autolink (kept as a DM link per project convention)
    const coverCell = dmSrc ? p(doc, dmAutolink(doc, dmSrc, alt)) : doc.createElement('div');

    rows.push([coverCell, bodyCell]);
  });

  return WebImporter.DOMUtils.createTable(rows, doc);
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
    const { document, url, params } = payload;
    const source = document.body;

    // 1. Cleanup: strip chrome + normalise gold labels.
    executeTransformers('beforeTransform', source, payload);
    executeTransformers('afterTransform', source, payload);

    // 2. Build a clean main from the surviving source content.
    const main = document.createElement('div');

    // --- Section 0: "Stryker's Neurovascular portfolio" eyebrow link ----------
    // Right-aligned teal standalone link that sits above the title bar. Authored
    // as a plain link (the project's default link colour is the same teal); the
    // template CSS right-aligns it. Kept in its own section so it renders above
    // the hero band.
    const portfolioLink = source.querySelector('a[href*="neurovascular.html"]');
    if (portfolioLink) {
      main.append(p(document, plainLink(
        document,
        portfolioLink.getAttribute('href'),
        portfolioLink.textContent.trim(),
      )));
      main.append(document.createElement('hr'));
    }

    // --- Section 1: hero band -------------------------------------------------
    main.append(buildHeroBand(document, source));
    main.append(document.createElement('hr'));

    // --- Section 2: intro line + patient-guide cards --------------------------
    const introH2 = source.querySelector('.c-rich-text-editor h2');
    if (introH2) main.append(heading(document, 'h2', document.createTextNode(introH2.textContent.trim())));
    main.append(buildCards(document, source));
    main.append(document.createElement('hr'));

    // --- Section 3: gold "for more information" CTA band ----------------------
    const goldBand = source.querySelector('.bg-golden-gradient');
    if (goldBand) {
      const bandP = goldBand.querySelector('p');
      // rebuild as: "For more patient information visit <link>" (drop colour spans)
      const linkEl = bandP && bandP.querySelector('a');
      const para = document.createElement('p');
      const lead = bandP ? bandP.textContent.replace(/\s+/g, ' ').replace(linkEl ? linkEl.textContent.trim() : '', '').trim() : '';
      if (lead) para.append(document.createTextNode(`${lead} `));
      if (linkEl) para.append(plainLink(document, linkEl.getAttribute('href'), linkEl.textContent.trim()));
      main.append(para);
    }
    main.append(sectionMetadata(document, 'gold, full-bleed'));
    main.append(document.createElement('hr'));

    // --- Section 4: 3-column resources footer (embedded as a FRAGMENT) --------
    // The columns band is authored once in /fragments/patient-information-resources
    // and embedded here via a Fragment block so it can be reused across pages. The
    // fragment carries its own `light-gray, full-bleed` section metadata.
    main.append(fragmentBlock(document, '/fragments/patient-information-resources'));
    main.append(document.createElement('hr'));

    // --- Section 5: trademark / disclaimer (compact) --------------------------
    // Trademark/disclaimer paragraphs + AP number in a `compact` section (small
    // footnote text), matching the sibling ww/stroke-awareness/resources page.
    // NOTE: the "Last Updated <month>/<year>" line (#publishedDate) is EXCLUDED —
    // it's handled by a separate, independent component and must not be baked in.
    // `.c-disclaimer` wraps BOTH the authored trademark paragraphs AND the
    // auto-generated `#publishedDate` ("Last Updated …") line. Take the authored
    // paragraphs but explicitly drop #publishedDate (separate component, per above).
    const disclaimerParas = [...source.querySelectorAll('.c-disclaimer p')]
      .filter((node) => node.id !== 'publishedDate' && node.textContent.trim());
    disclaimerParas.forEach((node) => {
      main.append(heading(document, 'p', document.createTextNode(node.textContent.trim())));
    });
    if (disclaimerParas.length) {
      main.append(sectionMetadata(document, 'compact'));
    }

    // 3. Metadata block from the page's own <head> metadata (Title, Description,
    //    og:title, og:description are picked up automatically). Add the canonical
    //    URL explicitly. NOTE: the source has no og:image meta tag, so none is set
    //    here (matching sibling migrated pages, which also omit it).
    const meta = WebImporter.Blocks.getMetadata(document);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.getAttribute('href')) {
      meta.canonical = canonical.getAttribute('href');
    }
    // Assign the shared patient-education template so this page (and future pages
    // in the family) load templates/patient-education/* and get body.patient-education
    // (via decorateTemplateAndTheme). Key must be lowercase `template` —
    // getMetadata('template') matches the meta name case-sensitively.
    meta.template = 'patient-education';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    // 4. Normalise DM asset URLs (leave DM links intact; fix any relative URLs).
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized output path.
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: PAGE_TEMPLATE.blocks,
      },
    }];
  },
};
