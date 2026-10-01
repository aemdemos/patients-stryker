/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patient-information-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// PAGE CONFIGURATION
// The Neurovascular "Patient Information" page — a STANDALONE page (it shares no
// layout with any sibling, so it uses a `theme` rather than a shared template).
// Main content maps onto existing blocks:
//   - title bar ................ hero (band)         — gold H1 over the Resources gradient bar
//   - intro line ............... default content     — <h2>
//   - patient-guide cards ...... cards (brochure-cta)— portrait covers + PDF link + gold CTA
//   - gold CTA band ............ default content in a `gold, full-bleed` section
//   - resources footer ......... columns (related-links) — 3-column link band in a
//                                `light-gray, full-bleed` section (inline, no fragment)
//   - disclaimer ............... default content in a `compact` section
//
// Styling ships via the `patient-information` theme (styles/themes.css, scoped
// under body.patient-information) — see meta.theme below.
const PAGE_TEMPLATE = {
  name: 'patient-information',
  description: 'Neurovascular Patient Information page (standalone): gold title bar (hero band), intro line, a row of patient-guide brochure cards (cards brochure-cta), a gold "for more information" CTA band, a 3-column resources footer (columns related-links) on a light-gray, full-bleed band, and a trademark/disclaimer block. Reuses existing blocks only; styled via the patient-information theme.',
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

/**
 * Build the 3-column resources band as a `columns (related-links)` block. The
 * variant carries ALL of the band's display (gold Futura labels, CTA links with
 * chevron, plain regional links, 3-up/2-up layout); the gray full-bleed band comes
 * from the section's `light-gray, full-bleed` metadata, not from the block.
 * Each column keeps its gold label, supporting copy and links, moved from the source.
 */
function buildResourcesColumns(doc, source) {
  const cols = [...source.querySelectorAll('.bg-light-gray .cols3 .col-md-4')];
  const cells = cols.map((col) => {
    const cell = doc.createElement('div');
    // Move every authored paragraph across (labels, copy, links), skipping the
    // empty `&nbsp;` spacer paragraphs the source uses for vertical rhythm.
    [...col.querySelectorAll('.text .c-rich-text-editor > div')].forEach((rt) => {
      [...rt.children].forEach((node) => {
        const txt = node.textContent.replace(/ /g, ' ').trim();
        if (!txt && !node.querySelector('a, img, picture')) return; // drop spacers
        cell.append(node);
      });
    });
    // Column labels: the cleanup transformer encodes the source's gold labels as a
    // bold+italic paragraph. Author them as real <h3><em><strong> headings — the
    // related-links variant styles `h3` (gold Futura 24.5px) and they're proper
    // headings for the column, not body copy.
    // The label may sit inside source wrapper spans (e.g. a font-size span), so
    // match any bold+italic descendant that makes up the paragraph's whole text.
    [...cell.children].forEach((node) => {
      if (node.tagName !== 'P' || node.querySelector('a')) return;
      const label = node.querySelector('strong > em, em > strong');
      const text = node.textContent.trim();
      if (!label || !text || label.textContent.trim() !== text) return;
      const em = doc.createElement('em');
      const strong = doc.createElement('strong');
      strong.textContent = text;
      em.append(strong);
      node.replaceWith(heading(doc, 'h3', em));
    });
    // CTA links ("Spread the word" / "Learn More") — author as UNDERLINE-ONLY
    // (<a><u>…</u></a>). The related-links variant styles the underline-authored
    // CTA as the flat Futura-bold uppercase teal link + chevron. The CTA is NOT
    // wrapped in <strong>: a bold link would trip decorateButtons (strong+u →
    // .link-strong strips the <u>; bold alone → a filled button). Underline-only
    // makes decorateButtons bail, so the <u> survives. Regional links get no <u>.
    [...cell.querySelectorAll('a')].forEach((a) => {
      const isCta = a.closest('.standalone-link') || a.querySelector('.standalone-link');
      if (!isCta || a.querySelector('u')) return;
      const u = doc.createElement('u');
      while (a.firstChild) u.appendChild(a.firstChild);
      a.appendChild(u);
    });
    return cell;
  });
  return WebImporter.DOMUtils.createTable([['Columns (related-links)'], cells], doc);
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
 * Build the cards (brochure-cta) block from the four `.col-md-3` brochure columns.
 * Each card row = [ cover image | body ]:
 *   - cover: bare DM autolink of the thumbnail (rendered as a portrait <picture>)
 *   - body:  <h3> title linking to the patient-guide PDF, an "Additional product
 *            information:" line, and a gold product-page CTA button.
 */
function buildCards(doc, source) {
  const cols = [...source.querySelectorAll('.cols4 .col-md-3')];
  const rows = [['Cards (brochure-cta)']];

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

    // --- Section 4: 3-column resources footer (inline columns related-links) ---
    // Authored inline on the page (no fragment). The block variant owns the band's
    // link/CTA display; the section metadata owns the gray full-bleed band.
    main.append(buildResourcesColumns(document, source));
    main.append(sectionMetadata(document, 'light-gray, full-bleed'));
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
    // Assign the `patient-information` theme so this standalone page gets
    // body.patient-information (via decorateTemplateAndTheme) and scripts.js lazily
    // loads styles/themes.css, where all of this page's styling lives scoped under
    // that selector. A theme (not a per-page template) is used because the page is
    // a singleton — we don't create template folders for one-off pages, and theme
    // names carry single-owner governance so they can't collide across authors.
    // Key must be lowercase `theme` — getMetadata('theme') matches case-sensitively.
    meta.theme = 'patient-information';
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
