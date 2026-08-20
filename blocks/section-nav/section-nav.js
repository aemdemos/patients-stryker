/*
 * Section Nav Block
 * Sticky in-page anchor bar (source: c-navigation-bar / bar-nav). Authored as
 * rows of [label][#anchor]; decorated into a horizontal list of links that
 * stick to the top of the viewport once the page scrolls past the header.
 * A scroll-spy highlights the link whose target section is currently in view.
 *
 * Renders a <ul><li><a> list (added directly to the block div) so that, in the
 * Universal Editor, the existing mutation observer in ue/scripts/ue.js moves
 * each authored row's instrumentation onto the matching <li>. Nav semantics are
 * applied to the block element itself via role/aria-label.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

export default function decorate(block) {
  block.setAttribute('role', 'navigation');
  if (!block.hasAttribute('aria-label')) {
    block.setAttribute('aria-label', 'In-page navigation');
  }

  const list = document.createElement('ul');
  list.className = 'section-nav-list';

  const links = [];

  [...block.children].forEach((row) => {
    // Row structure: [label cell][anchor cell]. Prefer an authored anchor;
    // fall back to building one from the label + a following #href cell.
    const cells = [...row.children];
    const anchor = row.querySelector('a[href^="#"]');
    const labelText = (cells[0]?.textContent || anchor?.textContent || '').trim();
    const href = anchor?.getAttribute('href')
      || (cells[1]?.textContent || '').trim();

    if (!labelText || !href || !href.startsWith('#')) return;

    const item = document.createElement('li');
    item.className = 'section-nav-item';
    moveInstrumentation(row, item);

    const link = document.createElement('a');
    link.className = 'section-nav-link';
    link.href = href;
    link.textContent = labelText;

    item.append(link);
    list.append(item);
    links.push(link);
  });

  block.replaceChildren(list);

  const setCurrent = (activeLink) => {
    links.forEach((link) => {
      const isCurrent = link === activeLink;
      link.classList.toggle('current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  // Resolve each link to its in-page target section.
  const targets = links
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const el = id && document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  if (!targets.length) return;

  // Clicking a link highlights it right away — don't wait for the scroll to
  // settle (and don't let the spy briefly pick a neighbour mid-scroll).
  targets.forEach(({ link }) => {
    link.addEventListener('click', () => setCurrent(link));
  });

  // Scroll-spy: highlight the last section whose top has scrolled up past the
  // sticky bar. A position calculation is used rather than IntersectionObserver
  // rootMargin bands, which miss short sections and sections without a heading.
  const barHeight = block.getBoundingClientRect().height || 60;
  const updateCurrent = () => {
    const line = barHeight + 8; // just below the pinned bar
    let active = targets[0];
    targets.forEach((t) => {
      if (t.el.getBoundingClientRect().top <= line) active = t;
    });
    if (active) setCurrent(active.link);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateCurrent();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateCurrent();
}
