import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // append the current year to a copyright item ending in a hyphen (e.g. "© Stryker 1998-")
  footer.querySelectorAll('li').forEach((li) => {
    if (/\d{4}-\s*$/.test(li.textContent)) {
      li.textContent = `${li.textContent.trimEnd()}${new Date().getFullYear()}`;
    }
  });

  block.append(footer);
}
