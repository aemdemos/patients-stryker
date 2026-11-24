/* global WebImporter */
/**
 * In review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/social-share-corp.md):
 * a stryker.com share row (.c-socialsharing) → `Social Share Corp`, one icon per row in the
 * source order (`:facebook:`, `:linkedin:`, `:email:`, `:copy-link:`), with the options the
 * component sets: `gray` (syk-social-share-g, all icons grey) and `right`
 * (syk-social-share-ra, right-aligned). The committed bundles leave the row out, as today.
 */

const ICONS = {
  facebook: 'facebook', linkedin: 'linkedin', email: 'email', 'copy-url': 'copy-link',
};

/**
 * @param {Element} component The .c-socialsharing component
 * @param {Document} doc The document
 * @returns {Element} The block table
 */
export default function shareRowBlock(component, doc) {
  const icons = [...component.querySelectorAll('a.social-icon, .social-icon')]
    .map((a) => Object.keys(ICONS).find((name) => a.classList.contains(name)))
    .filter(Boolean)
    .map((name) => [`:${ICONS[name]}:`]);
  const options = [
    component.classList.contains('syk-social-share-g') ? 'gray' : '',
    component.classList.contains('syk-social-share-ra') ? 'right' : '',
  ].filter(Boolean);
  return WebImporter.Blocks.createBlock(doc, {
    name: options.length ? `Social Share Corp (${options.join(', ')})` : 'Social Share Corp',
    cells: icons.length ? icons : [[':facebook:'], [':linkedin:'], [':email:'], [':copy-link:']],
  });
}
