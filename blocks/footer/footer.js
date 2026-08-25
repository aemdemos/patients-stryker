import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');

  // the <footer> wrapper carries the dark background/padding, so when there is no
  // footer content we must remove the whole element — an empty block would still
  // paint an empty dark bar. Helper: drop the footer entirely.
  const footerEl = block.closest('footer');
  const removeFooter = () => {
    block.textContent = '';
    if (footerEl) footerEl.remove();
  };

  // `none` (or an empty `-none` fragment path) means intentionally no footer —
  // used by the site-root pages, which have no footer at all. Render nothing.
  if (footerMeta && /(^|\/)(none|footer-none)$/i.test(footerMeta.trim())) {
    removeFooter();
    return;
  }

  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // guard: a missing/unpublished fragment resolves to null, and the default
  // `/footer` is an intentionally empty document — in either case remove the
  // footer entirely rather than paint an empty dark bar
  block.textContent = '';
  if (!fragment || !fragment.textContent.trim()) {
    removeFooter();
    return;
  }

  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
