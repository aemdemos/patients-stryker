/*
 * The review's top bar on every page (25 Nov 2026): the brand (to the start page), the tools in
 * the order of the work (Summary, Status, Review tool; Invitations for the AOE team), who you are
 * (a red AOE team chip or a blue Reviewer chip), then Start and ⓘ (help.js). DOM only.
 * mountBar(page, bar) → { setRole(role, name) }; page: review | status | summary | people | invites
 */
import { mountHelp } from './help.js';

const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = './ui.css';
// (first in the head: the pages' own stylesheets refine it)
if (!document.querySelector('link[href="./ui.css"]')) document.head.prepend(css);

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.filter((c) => c !== null && c !== undefined && c !== false).forEach((c) => e.append(c));
  return e;
};

// the order of the work: where things stand, the list of pages, each page
export const TOOLS = [
  { key: 'summary', href: './summary.html', label: 'Summary' },
  { key: 'status', href: './status.html', label: 'Status' },
  { key: 'review', href: './index.html', label: 'Review tool' },
  {
    key: 'people', href: './people.html', label: 'People', aoe: true,
  },
];

export function mountBar(page, bar) {
  bar.classList.add('ui-bar');
  const brand = el(
    'a',
    { class: 'ui-brand', href: './launch.html', title: 'The start page' },
    el('span', { class: 'ui-mark', 'aria-hidden': 'true' }),
    el('span', {}, el('b', {}, 'Adobe'), ' ', el('span', { class: 'ui-brand-name' }, 'Review')),
  );
  const nav = el('nav', { class: 'ui-nav', 'aria-label': 'The review' }, ...TOOLS.map((t) => el('a', {
    class: `ui-nav-${t.key}`,
    href: t.href,
    'aria-current': t.key === page ? 'page' : null,
    hidden: t.aoe,
  }, t.label)));
  const who = el('span', { class: 'ui-who', hidden: true });
  bar.prepend(brand, nav);
  bar.append(who);
  const help = mountHelp(page, bar);
  let shown = '';
  return {
    setRole(role, name) {
      const aoe = role === 'aoe';
      help.setRole(role);
      nav.querySelector('.ui-nav-people').hidden = !aoe;
      // (drawn again only when it changes: the pages call this on every update)
      const key = `${aoe}|${name || ''}`;
      if (key === shown) return;
      shown = key;
      who.replaceChildren(...[
        name ? el('span', { class: 'ui-who-name' }, name) : null,
        el('span', { class: `ui-role ui-role-${aoe ? 'aoe' : 'reviewer'}` }, aoe ? 'AOE team' : 'Reviewer'),
      ].filter(Boolean));
      who.hidden = false;
    },
  };
}
