/*
 * stryker.com content fragments (DAM, contact-us-information model) → EDS fragment documents
 * at /us/en/fragments/content-fragments/<path> (decision: decisions/content-fragments.json).
 *
 * A content fragment has no page of its own, so each one is imported from the publish page of
 * an XF that renders it, with the fragment named in the query:
 *   https://www.stryker.com/content/experience-fragments/…/master.html?cf=/content/dam/…
 * (list: tools/importer/data/catalog/cf-urls.txt, npm run build:migration-index). The document
 * holds a `Cards (contact)` card with the fields the live pages show and a Metadata block with
 * the rest (tools/importer/corp-components.js contentFragmentBlocks). The XFs that contain
 * content fragments link them with Fragment blocks (import-xf-fragments.js).
 */
import { CONTENT_FRAGMENTS } from './data/cf-index.js';
import { contentFragmentBlocks } from './corp-components.js';

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const cf = source.searchParams.get('cf');
    const info = cf && CONTENT_FRAGMENTS[cf];
    if (!info) throw new Error(`Not a content fragment in data/cf-index.js: ${cf}`);

    const rendered = document.querySelector(`dl.cmp-contentfragment[data-path="${cf}"]`);
    if (!rendered) console.warn(`[import-cf-fragments] ${cf} is not rendered on ${source.pathname}: fields from the export only`);

    const main = document.createElement('div');
    main.append(...contentFragmentBlocks(document, info, rendered));
    document.body.replaceChildren(main);

    return [{
      element: main,
      path: info.eds,
      report: {
        title: info.title || info.eds,
        template: 'content-fragment',
        source: cf,
        uses: info.uses.length,
      },
    }];
  },
};
