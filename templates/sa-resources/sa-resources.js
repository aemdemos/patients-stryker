/**
 * Stroke-Awareness Resources page template.
 *
 * A page becomes an sa-resources page by setting page metadata
 * `template: sa-resources`. The template CSS (sa-resources.css) is loaded
 * automatically by scripts.js loadTemplate(); this JS file exists to satisfy the
 * template contract and can be extended with any page-specific decoration logic.
 *
 * @param {Document} doc The document
 */
// eslint-disable-next-line no-unused-vars
export default async function decorate(doc) {
  // no DOM restructuring required — the page is authored with standard blocks
  // (hero, panel, cards, fragment) styled via sa-resources.css.
}
