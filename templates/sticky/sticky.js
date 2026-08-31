/**
 * Sticky landing-page template.
 *
 * A page becomes a sticky landing page by setting page metadata `template: sticky`,
 * which adds `body.sticky` via decorateTemplateAndTheme() and loads this template's
 * CSS/JS automatically. Used by the stroke-awareness landing pages (/ww and /us),
 * which pair a full-bleed hero with an in-page sticky-nav anchor bar and a sequence
 * of alternating content bands.
 *
 * No DOM restructuring is required — the page is authored with standard blocks
 * (hero, sticky-nav, columns, video, icon-list, fragment). This file exists to
 * satisfy the template contract and can carry any sticky-specific decoration later.
 *
 * @param {Document} doc The document
 */
// eslint-disable-next-line no-unused-vars
export default async function decorate(doc) {
  // no-op: sticky landing pages are composed entirely from existing blocks.
}
