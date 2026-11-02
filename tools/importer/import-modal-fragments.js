/*
 * stryker.com modals that no page or XF holds → fragment documents under
 * /us/en/fragments/modals/ (approved 2026-10-30; corp-modal-path.js). The ProCare tile's modal
 * is added by the product template per business unit, so each distinct modal is imported once,
 * from one product page that shows it, named in the query:
 *   https://www.stryker.com/us/en/acute-care/products/symmetry-plus.html?modal=procare
 * (list: tools/importer/data/catalog/modal-urls.txt). The pages link the documents from
 * their tile (corp-component-handlers.js promoTile); blocks/modal opens them.
 */
import { createBuilder } from './corp-section-builder.js';
import { CORP_HANDLERS, procareModalItems } from './corp-component-handlers.js';
import { rewriteCorpLinks } from './corp-page.js';
import { text } from './corp-richtext.js';
import procareModalPath from './corp-modal-path.js';

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL || url);
    const kind = source.searchParams.get('modal');
    if (kind !== 'procare') throw new Error(`Unknown modal kind: ${kind}`);
    const info = document.querySelector('#c-procare-tile-modal .c-procare-tile-info');
    const title = info && info.querySelector('.c-procare-tile-title');
    const path = title && procareModalPath(text(title));
    if (!path) throw new Error(`No ProCare modal on ${source.pathname}`);

    const ctx = createBuilder({ doc: document, handlers: CORP_HANDLERS, source: source.href });
    ctx.place(procareModalItems(info, ctx));
    const main = document.createElement('div');
    main.append(...ctx.render());
    rewriteCorpLinks(main);
    document.body.replaceChildren(main);

    return [{
      element: main,
      path,
      report: {
        title: text(title),
        template: 'modal',
        source: source.pathname,
        notes: ctx.report.notes,
      },
    }];
  },
};
