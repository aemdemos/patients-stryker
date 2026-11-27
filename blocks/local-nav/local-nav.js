/*
 * Local Nav: the navigation of a section of stryker.com pages (docs/standardisation/local-nav.md),
 * in review on draft pages. Authored as two rows: the section's parent page (a link), then the
 * list of its pages (links). Option: `no-top-line` (no grey rule above it).
 *
 * From 600px: the parent page's title on the left, the pages on the right with "|" between
 * them, the current page in black. On phones: the current page's title and a button that opens
 * the parent page and the pages in a list.
 */

/** A path without its .html, index and trailing slash, to compare links with the page. */
const pathOf = (href) => {
  try {
    return new URL(href, window.location.href).pathname
      .replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  } catch (e) {
    return '';
  }
};

/** The anchor for a link of the menu, marked when it is the current page. */
function menuLink(source, current) {
  const a = document.createElement('a');
  a.href = source.href;
  a.textContent = source.textContent.trim();
  if (current) a.setAttribute('aria-current', 'page');
  return a;
}

export default function decorate(block) {
  // in review: only draft pages render it (body.std-draft, scripts/corp.js)
  if (!document.body.classList.contains('std-draft')) return;
  const links = [...block.querySelectorAll('a[href]')];
  const parentRow = [...block.children].find((row) => !row.querySelector('ul, ol') && row.querySelector('a[href]'));
  const parent = parentRow && parentRow.querySelector('a[href]');
  const pages = links.filter((a) => a !== parent);
  const here = pathOf(window.location.href);
  // a review copy of a page (/drafts/…/connected-or-operating-system-v5) is that page: its
  // name without the -vN version
  const lastName = (path) => path.split('/').pop().replace(/-v\d+$/, '');
  const review = here.startsWith('/drafts/');
  const isCurrent = (a) => pathOf(a.href) === here
    || (review && lastName(pathOf(a.href)) === lastName(here));

  const nav = document.createElement('nav');
  nav.className = 'local-nav-bar';
  nav.setAttribute('aria-label', parent ? parent.textContent.trim() : 'Section');

  if (parent) {
    const title = menuLink(parent, isCurrent(parent));
    title.className = 'local-nav-parent';
    nav.append(title);
  }

  const list = document.createElement('ul');
  list.className = 'local-nav-links';
  pages.forEach((a) => {
    const li = document.createElement('li');
    li.append(menuLink(a, isCurrent(a)));
    list.append(li);
  });
  nav.append(list);

  // phones: the current page's title, and a button that opens the section's pages
  const currentLink = links.find(isCurrent);
  const current = document.createElement('p');
  current.className = 'local-nav-current';
  current.textContent = currentLink ? currentLink.textContent.trim()
    : document.title.split(' | ')[0].trim();
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'local-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Pages in this section');
  const menu = document.createElement('ul');
  menu.className = 'local-nav-menu';
  menu.id = `local-nav-menu-${Math.random().toString(36).slice(2, 8)}`;
  menu.hidden = true;
  toggle.setAttribute('aria-controls', menu.id);
  [parent, ...pages].filter(Boolean).forEach((a) => {
    const li = document.createElement('li');
    const item = menuLink(a, isCurrent(a));
    if (a === parent) li.className = 'local-nav-menu-parent';
    li.append(item);
    menu.append(li);
  });
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  });
  nav.append(current, toggle, menu);

  block.replaceChildren(nav);
}
