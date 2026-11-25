/*
 * The review tool's page picker (25 Nov 2026): a box with the page's title and, below it, its
 * path without the start every page shares (the part people quote); a click (or /) opens the
 * list right below it: a search box at the top (every word in the title or the path), what the
 * filters show (with Clear all), the pages in the chosen order with their status, the current one
 * highlighted in the middle with its neighbours around it. ↑ ↓ (Page Up / Down) move, Enter opens,
 * Esc closes. DOM only (no innerHTML).
 *
 * mountPicker(box, hooks) → { update() }; hooks: list() (the pages the filters show, in order),
 * total(), current() (path), find(path) (any page), go(path), filters() (what they show, '' for
 * none), clear(), extra(page) (a short label, e.g. the batch)
 */
import { searchMatches } from './batches.js';

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
};

/** the start of the path every page shares ("/us/en/"): left out, the rest is what differs */
export function commonStart(paths) {
  if (!paths.length) return '/';
  const split = paths.map((p) => p.split('/').slice(0, -1));
  const first = split[0];
  const same = (n) => split.every((s) => s[n] === first[n]);
  let n = 0;
  while (n < first.length && same(n)) n += 1;
  return `${first.slice(0, n).join('/')}/`;
}

/** text with the search's words marked */
function marked(text, words) {
  if (!words.length) return [text];
  const low = text.toLowerCase();
  const hits = [];
  words.forEach((w) => {
    let i = low.indexOf(w);
    while (i >= 0) {
      hits.push([i, i + w.length]);
      i = low.indexOf(w, i + w.length);
    }
  });
  if (!hits.length) return [text];
  hits.sort((a, b) => a[0] - b[0]);
  const out = [];
  let at = 0;
  hits.forEach(([s, e]) => {
    if (e <= at) return;
    const from = Math.max(s, at);
    if (from > at) out.push(text.slice(at, from));
    out.push(el('mark', {}, text.slice(from, e)));
    at = e;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export function mountPicker(box, hooks) {
  let start = '/';
  const short = (path) => (path.startsWith(start) ? path.slice(start.length) : path) || path;
  const title = el('span', { class: 'rv-pick-title' });
  const path = el('span', { class: 'rv-pick-path' });
  const button = el('button', {
    type: 'button', class: 'rv-pick', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', title: 'Choose a page (/)',
  }, title, path, el('span', { class: 'rv-pick-caret', 'aria-hidden': 'true' }, '▾'));
  const search = el('input', {
    type: 'search',
    class: 'rv-pick-search',
    placeholder: 'Search: words of the title or path…',
    'aria-label': 'Search the pages',
    'aria-controls': 'rv-pick-list',
    autocomplete: 'off',
  });
  const shows = el('p', { class: 'rv-pick-shows' });
  const list = el('ul', {
    class: 'rv-pick-list', id: 'rv-pick-list', role: 'listbox', 'aria-label': 'Pages',
  });
  const foot = el('p', { class: 'rv-pick-foot' });
  const pop = el('div', { class: 'rv-pick-pop', hidden: true }, search, shows, list, foot);
  box.replaceChildren(button, pop);
  let items = [];
  let active = -1;
  const hooksGo = (p) => {
    if (p && p !== hooks.current()) hooks.go(p);
  };
  // (filled in below: closing needs the button)
  let choose = () => {};

  const setActive = (i, scroll = true) => {
    if (!items.length) return;
    active = Math.max(0, Math.min(items.length - 1, i));
    list.querySelectorAll('.rv-pick-on').forEach((x) => x.classList.remove('rv-pick-on'));
    const li = list.children[active];
    if (!li) return;
    li.classList.add('rv-pick-on');
    search.setAttribute('aria-activedescendant', li.id);
    if (scroll) li.scrollIntoView({ block: 'nearest' });
  };
  const draw = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    const all = hooks.list();
    items = all.filter((p) => searchMatches(search.value, p));
    const current = hooks.current();
    list.replaceChildren(...items.map((p, i) => el(
      'li',
      {
        id: `rv-pick-${i}`,
        role: 'option',
        class: `rv-pick-item${p.path === current ? ' rv-pick-current' : ''}`,
        'aria-selected': String(p.path === current),
        onmousedown: (e) => e.preventDefault(),
        onclick: () => choose(p.path),
        onmousemove: () => { if (active !== i) setActive(i, false); },
      },
      el('span', { class: `rv-dot st-${p.state || 'unreviewed'}`, title: p.stateLabel || '' }),
      el(
        'span',
        { class: 'rv-pick-text' },
        el('span', { class: 'rv-pick-item-title' }, ...marked(p.title || p.path, words)),
        el('span', { class: 'rv-pick-item-path' }, ...marked(short(p.path), words)),
      ),
      hooks.extra?.(p) ? el('span', { class: 'rv-pick-extra' }, hooks.extra(p)) : null,
      p.path === current ? el('span', { class: 'rv-pick-here' }, 'current') : null,
    )));
    if (!items.length) list.append(el('li', { class: 'rv-pick-none' }, all.length ? 'No page has these words.' : 'No page passes the filters.'));
    const filters = hooks.filters();
    shows.replaceChildren(...[
      el('span', {}, filters ? `Filtered: ${filters}` : `All ${hooks.total()} pages`),
      filters ? el('button', {
        type: 'button',
        class: 'rv-pick-clear',
        onclick: () => {
          hooks.clear();
          draw();
          search.focus();
        },
      }, 'Clear all filters') : null,
    ].filter(Boolean));
    foot.textContent = `${items.length} of ${hooks.total()} pages · ↑↓ move · Enter opens · Esc closes`;
    return words;
  };
  const close = (focus = true) => {
    if (pop.hidden) return;
    pop.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (focus) button.focus();
  };
  // (the current page in the middle, its neighbours around it)
  const open = () => {
    start = commonStart(hooks.paths());
    pop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    search.value = '';
    draw();
    const i = items.findIndex((p) => p.path === hooks.current());
    setActive(i >= 0 ? i : 0, false);
    const li = list.children[Math.max(0, i)];
    if (li) list.scrollTop = li.offsetTop - list.clientHeight / 2 + li.offsetHeight / 2;
    search.focus();
  };
  choose = (p) => {
    close();
    hooksGo(p);
  };
  button.addEventListener('click', () => (pop.hidden ? open() : close()));
  search.addEventListener('input', () => {
    draw();
    // (the first match; the current page when the search is empty)
    const i = search.value ? 0 : items.findIndex((p) => p.path === hooks.current());
    setActive(Math.max(0, i));
  });
  search.addEventListener('keydown', (e) => {
    const moves = {
      ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10,
    };
    if (moves[e.key]) {
      e.preventDefault();
      setActive(active + moves[e.key]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) choose(items[active].path);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  document.addEventListener('mousedown', (e) => {
    if (!pop.hidden && !box.contains(e.target)) close(false);
  });
  // "/" opens it (not while typing somewhere)
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    open();
  });
  return {
    /** the box: the current page's title and short path; the list again when it is open */
    update() {
      start = commonStart(hooks.paths());
      const p = hooks.find(hooks.current());
      title.textContent = p?.title || hooks.current() || 'Choose a page';
      path.textContent = hooks.current() ? short(hooks.current()) : '';
      button.title = `${hooks.current() || ''}\nChoose a page (/)`;
      if (!pop.hidden) draw();
    },
    close,
  };
}
