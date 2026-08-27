/**
 * Legal pages template.
 *
 * A page becomes a legal page by setting page metadata `template: legal-pages`
 * (or `theme: legal`). The template CSS (legal-pages.css) is loaded automatically
 * by aem.js; this JS file exists to satisfy the template contract and can be
 * extended with any legal-page-specific decoration logic.
 *
 * @param {Document} doc The document
 */
// eslint-disable-next-line no-unused-vars
export default async function decorate(doc) {
  // no DOM restructuring required — legal pages are authored with standard blocks
}
