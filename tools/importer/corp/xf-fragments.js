/* global WebImporter */

/*
 * Experience Fragments → EDS fragment documents, with the corp rule library in this folder
 * (tools/importer/corp/, shared by every template of the readable-settings approach).
 *
 * Builds every XF the library's templates show, once (one document per XF, whatever the
 * templates that show it, data/xf-index.js FRAGMENTS[xf].templates). XFs nested in an XF become
 * Fragment blocks in it (matched against FRAGMENTS[xf].refs). The shared news fragments with a
 * styling of their own go through news-shared-fragments.js.
 * Run it on the fragment URLs of the pages (tools/importer/import-corp-fragments.js).
 */

import corpSectionsTransformer from './transformers/corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { CORP_PAGE } from './corp-page.js';
import { markLivePage } from './corp-section-builder.js';

import sharedFragmentsImport, { FRAGMENTS as SHARED } from './news-shared-fragments.js';
import { xfKey, xfInfo, hostedFragmentPath } from '../xf-fragment-path.js';
import { contactDirectorySections, matchXfWrappers, markXfSlides } from './corp-components.js';
import { writeReadableSettings } from './settings-writer.js';
import { rooted, rootFragmentLinks } from './root.js';
import swapOversizedImages from './swap-oversized.js';

// every XF: the corp section builder, as the page importers (corp-import.js)
const CORP_XF_TEMPLATE = { name: 'corp-xf', site: 'corp' };
const corpTransformers = [corpSectionsTransformer, cleanupTransformer, dmImagesTransformer];

/**
 * The rendering of a hosted XF on its host page (or XF) → the document's whole content: the
 * XF wrapper matched to it (matchXfWrappers), or the slide image area of the carousel slide
 * marked with its fragment path (markXfSlides).
 * @param {Document} document the host page
 * @param {string} host the host page or XF URL
 * @param {string} xf the hosted XF path
 */
function hostedContent(document, host, xf) {
  const eds = hostedFragmentPath(xf);
  const root = document.querySelector('#aem-specific-data') || document.body;
  let found = null;
  matchXfWrappers(root, host).matches.forEach((match, wrapper) => {
    if (!found && match.eds === eds) found = wrapper;
  });
  if (!found) {
    markXfSlides(root, host);
    const slide = [...root.querySelectorAll('.carouselslide')]
      .find((s) => s.dataset.xfDesktop === eds || s.dataset.xfMobile === eds);
    if (slide) {
      found = slide.querySelector(slide.dataset.xfDesktop === eds ? '.experienceFragment-ef' : '.experienceFragment-ef-mobile');
    }
  }
  if (!found) throw new Error(`hosted XF ${xf} is not rendered on ${host}`);
  const content = found.cloneNode(true);
  // the content starts where an XF page starts (its body)
  document.body.replaceChildren(content);
}

const classImport = {
  // on the live XF page: what it hides and what its forms load (used by the corp builder)
  onLoad: ({ document }) => markLivePage(document),

  transform: (payload) => {
    const { document, url, params } = payload;
    const address = new URL(params.originalURL || url);
    // an XF without a published copy (unpublished, redirect) that a page or XF renders:
    // <host>.html?xf=<XF path>; its fragment is built from that rendering
    const hostedXf = address.searchParams.get('xf');
    if (hostedXf) hostedContent(document, `${address.origin}${address.pathname}`, hostedXf);
    const key = xfKey(hostedXf || address.href);
    const info = hostedXf
      ? {
        eds: hostedFragmentPath(hostedXf), templates: [], pages: [address.pathname], refs: [],
      }
      : xfInfo(key);
    if (SHARED[key]) return sharedFragmentsImport.transform(payload);
    if (!info || !info.eds) throw new Error(`Not an XF in data/xf-index.js: ${key}`);

    const main = document.body;
    if (main.querySelector('dl.cmp-contentfragment[data-path]')) {
      const { sections, unknown } = contactDirectorySections(main, document);
      if (unknown.length) console.warn(`[import-xf-fragments] ${key}: ${unknown.join(' | ')}`);
      const out = [];
      sections.forEach((section, i) => {
        if (i) out.push(document.createElement('hr'));
        out.push(...section.nodes);
        if (section.style) {
          out.push(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: section.style } }));
        }
      });
      main.replaceChildren(...out);
      return [{
        element: main,
        path: info.eds,
        report: {
          title: info.eds, template: 'contact-directory', source: key, pages: info.pages,
        },
      }];
    }
    const templates = info.templates || [];
    const corpPayload = {
      ...payload,
      template: CORP_XF_TEMPLATE,
      corp: CORP_PAGE,
      xf: key,
      // an XF shown next to a Marketo form: the contact-aside style (component-map)
      sectionStyles: info.aside ? ['contact-aside'] : [],
    };
    corpTransformers.forEach((fn) => {
      try {
        fn.call(null, 'beforeTransform', main, corpPayload);
      } catch (e) {
        console.error('Transformer failed at beforeTransform:', e);
      }
    });
    const corpReport = JSON.parse(main.getAttribute('data-corp-report') || '{}');
    main.removeAttribute('data-corp-report');
    corpTransformers.forEach((fn) => {
      try {
        fn.call(null, 'afterTransform', main, corpPayload);
      } catch (e) {
        console.error('Transformer failed at afterTransform:', e);
      }
    });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    return [{
      element: main,
      path: info.eds,
      report: {
        title: info.eds,
        template: `corp (${templates.join(', ')})`,
        source: key,
        pages: info.pages,
        unhandled: (corpReport.unhandled || []).join(' | '),
        notes: (corpReport.notes || []).join(' | '),
      },
    }];
  },
};

// the library's last steps: every fragment document in the readable-settings form, under our
// root, its links to other fragments too (root.js)
export default {
  onLoad: classImport.onLoad,
  transform: (payload) => classImport.transform(payload).map((result) => {
    // (images over 20 MB → the smaller version: news feature fragments, globe-ar-sm, ProCuity)
    const swapped = swapOversizedImages(result.element);
    const report = swapped.length
      ? { ...result.report, notes: [result.report && result.report.notes, ...swapped].filter(Boolean).join(' | ') }
      : result.report;
    writeReadableSettings(result.element, payload.document);
    rootFragmentLinks(result.element);
    return { ...result, report, path: rooted(result.path) };
  }),
};
