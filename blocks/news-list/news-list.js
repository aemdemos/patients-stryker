/*
 * News List: a stryker.com newsroom list (docs/standardisation/news-list.md), in review on
 * draft pages. Built from the site's query index, so new articles appear on their own.
 *
 * Authored rows (all optional but the folder):
 *   - `Folder` | the folder of the articles (/us/en/acute-care/news); several, comma-separated;
 *   - `All` | the label of the first tab (default "All News");
 *   - `Tab` | a tab's label | the keyword of its articles (default: the label), one row per tab.
 * Option: `show-dates` (each article's date above its title, when the index has one).
 * Always: the tabs, "Showing n of N", 20 articles and a Load More button for the next 20.
 * An article: its image, title, description and a Read More link.
 */

const PAGE_SIZE = 20;
const INDEX = '/us/en/query-index.json';

const keyOf = (text) => String(text || '').trim().toLowerCase();

function readConfig(block) {
  const config = { folders: [], all: 'All News', tabs: [] };
  [...block.children].forEach((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    const name = keyOf(cells[0]);
    if (name === 'folder') {
      const links = [...row.querySelectorAll('a[href]')].map((a) => new URL(a.href).pathname);
      config.folders = (links.length ? links : cells[1].split(',')).map((f) => f.trim().replace(/\/$/, '')).filter(Boolean);
    } else if (name === 'all' && cells[1]) {
      [, config.all] = cells;
    } else if (name === 'tab' && cells[1]) {
      config.tabs.push({ label: cells[1], keyword: keyOf(cells[2] || cells[1]) });
    }
  });
  return config;
}

const LIMIT = 500;
const indexPage = (offset) => fetch(`${INDEX}?offset=${offset}&limit=${LIMIT}`)
  .then((resp) => (resp.ok ? resp.json() : { data: [] }))
  .catch(() => ({ data: [] }));

async function articlesIn(folders) {
  // the index comes in pages of up to 500 rows: the first page gives the total
  const first = await indexPage(0);
  const offsets = [];
  for (let at = LIMIT; at < (first.total || 0); at += LIMIT) offsets.push(at);
  const rest = await Promise.all(offsets.map(indexPage));
  const rows = [first, ...rest].flatMap((page) => page.data || []);
  const inFolder = (path) => folders.some((f) => path.startsWith(`${f}/`));
  const dateOf = (r) => Date.parse(r.published || r.date || '') || 0;
  return rows.filter((r) => r.path && inFolder(r.path) && r.title)
    .sort((a, b) => dateOf(b) - dateOf(a));
}

/** "27-Oct-2026", as stryker.com writes the date. */
function formatDate(value) {
  const t = Date.parse(value);
  if (!t) return '';
  const d = new Date(t);
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${String(d.getUTCDate()).padStart(2, '0')}-${month}-${d.getUTCFullYear()}`;
}

function articleEl(row, showDates) {
  const li = document.createElement('li');
  li.className = 'news-list-item';
  const media = document.createElement('div');
  media.className = 'news-list-image';
  if (row.image && !/default-meta-image/.test(row.image)) {
    const img = document.createElement('img');
    const src = new URL(row.image, window.location.href);
    src.searchParams.set('width', '750');
    img.src = src.toString();
    img.alt = '';
    img.loading = 'lazy';
    media.append(img);
  }
  const body = document.createElement('div');
  body.className = 'news-list-body';
  const date = showDates && formatDate(row.published || row.date);
  if (date) {
    const p = document.createElement('p');
    p.className = 'news-list-date';
    p.textContent = date;
    body.append(p);
  }
  const h = document.createElement('h3');
  h.textContent = row.title;
  body.append(h);
  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description;
    body.append(p);
  }
  const a = document.createElement('a');
  a.href = row.path;
  a.className = 'news-list-more';
  a.textContent = 'Read More';
  a.setAttribute('aria-label', `Read More: ${row.title}`);
  body.append(a);
  li.append(media, body);
  return li;
}

export default async function decorate(block) {
  // in review: only draft pages render it (body.std-draft, scripts/corp.js)
  if (!document.body.classList.contains('std-draft')) return;
  const config = readConfig(block);
  if (!config.folders.length) return;
  const showDates = block.classList.contains('show-dates');

  const tabs = document.createElement('div');
  tabs.className = 'news-list-tabs';
  tabs.setAttribute('role', 'tablist');
  const count = document.createElement('p');
  count.className = 'news-list-count';
  count.setAttribute('aria-live', 'polite');
  const list = document.createElement('ul');
  list.className = 'news-list-items';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'news-list-load';
  more.textContent = 'Load More';
  block.replaceChildren(tabs, count, list, more);

  const articles = await articlesIn(config.folders);
  let current = [];
  let shown = 0;
  const render = () => {
    const next = current.slice(shown, shown + PAGE_SIZE);
    list.append(...next.map((row) => articleEl(row, showDates)));
    shown += next.length;
    count.textContent = `Showing ${shown} of ${current.length}`;
    more.hidden = shown >= current.length;
  };
  const select = (button, keyword) => {
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    current = keyword ? articles.filter((r) => keyOf(r.keywords).split(/\s*,\s*/).includes(keyword)) : articles;
    shown = 0;
    list.replaceChildren();
    render();
  };
  [{ label: config.all, keyword: '' }, ...config.tabs].forEach((tab, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.textContent = tab.label;
    button.addEventListener('click', () => select(button, tab.keyword));
    tabs.append(button);
    if (i === 0) select(button, '');
  });
  more.addEventListener('click', render);
}
