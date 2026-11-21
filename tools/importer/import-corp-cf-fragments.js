/*
 * stryker.com content fragments (DAM, contact-us-information model) → EDS fragment documents,
 * through the corp rule library: as import-cf-fragments.js (one document per content fragment,
 * imported from the publish page of an XF that renders it, ?cf=<DAM path>; a `Cards (contact)`
 * card with the fields the live pages show and a Metadata block with the rest), with the
 * library's last steps: the readable form (colon markers) and our root (/rs, corp/root.js).
 * List: tools/importer/data/catalog/cf-urls.txt.
 */
import { CONTENT_FRAGMENTS } from './data/cf-index.js';
import { contentFragmentBlocks } from './corp/corp-components.js';
import { writeReadableSettings } from './corp/settings-writer.js';
import { rooted, rootFragmentLinks } from './corp/root.js';

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const cf = source.searchParams.get('cf');
    const info = cf && CONTENT_FRAGMENTS[cf];
    if (!info) throw new Error(`Not a content fragment in data/cf-index.js: ${cf}`);
    const rendered = document.querySelector(`dl.cmp-contentfragment[data-path="${cf}"]`);
    if (!rendered) console.warn(`[import-corp-cf-fragments] ${cf} is not rendered on ${source.pathname}: fields from the export only`);
    const main = document.createElement('div');
    main.append(...contentFragmentBlocks(document, info, rendered));
    writeReadableSettings(main, document);
    rootFragmentLinks(main);
    document.body.replaceChildren(main);
    return [{
      element: main,
      path: rooted(info.eds),
      report: {
        title: info.title || info.eds,
        template: 'content-fragment',
        source: cf,
        uses: info.uses.length,
      },
    }];
  },
};
