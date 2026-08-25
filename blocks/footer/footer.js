import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');

  // `none` (or an empty `-none` fragment path) means intentionally no footer —
  // used by the site-root pages, which have no footer at all. Render nothing.
  if (footerMeta && /(^|\/)(none|footer-none)$/i.test(footerMeta.trim())) {
    block.textContent = '';
    return;
  }

  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // guard: a missing/unpublished fragment resolves to null — leave the footer
  // empty rather than throwing (which would break the rest of the lazy phase)
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
