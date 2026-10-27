/*
 * Transformer: www.stryker.com page structure for every corp template except news-detail.
 *
 * The work is done by tools/importer/corp-page.js (section builder + component handlers),
 * which the corp import scripts pass in the payload (payload.corp = CORP_PAGE from
 * corp-page.js), so this transformer imports nothing:
 *   beforeTransform  payload.corp.buildBody(element, payload): rebuilds <body> as the page's
 *                    sections, components in authored order (decisions/component-map.json)
 *   afterTransform   payload.corp.rewriteLinks(element): www.stryker.com links → EDS form
 * Without payload.corp (any other template, or the patients importers) it does nothing.
 */
export default function transform(hookName, element, payload) {
  const corp = payload && payload.corp;
  if (!corp) return;
  if (hookName === 'beforeTransform') {
    corp.buildBody(element, payload);
  } else if (hookName === 'afterTransform') {
    corp.rewriteLinks(element);
  }
}
