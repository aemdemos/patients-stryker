import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';
import {
  fetchPlaceholders, fetchQueryIndex, getLocalePrefix, toIndexPath,
} from '../../scripts/utils.js';

const DEFAULT_PAGE_SIZE = 20;
let blockCount = 0;

/* source tags arrive as AEM tag IDs (`stryker:content-type/news/events`) or tag paths
   (`/etc/tags/stryker/content-type/news/events`); compare them in one form */
const normalizeTag = (tag) => tag.trim()
  .replace(/^\/etc\/tags\/([^/]+)\//i, '$1:')
  .toLowerCase();

const splitTags = (value) => String(value || '').split(',').map(normalizeTag).filter(Boolean);

/**
 * Reads the key/value rows (Path, Filters, Page size, Show dates, optional Index).
 * A cell holding a list or several paragraphs is read as one entry per item/paragraph.
 */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const key = toClassName(keyCell.textContent);
    const items = valueCell.querySelectorAll('li, p');
    const link = valueCell.querySelector('a[href]');
    if (items.length > 1) config[key] = [...items].map((el) => el.textContent.trim());
    else if (link && key !== 'filters') config[key] = link.getAttribute('href');
    else config[key] = valueCell.textContent.trim();
  });
  return config;
}

/**
 * Filter entries: `Label (tag-id)` or a bare tag ID (labelled by its last segment);
 * `none` (or nothing) = no filter tabs.
 */
function parseFilters(value) {
  const entries = (Array.isArray(value) ? value : String(value || '').split(/\n|,(?![^(]*\))/))
    .map((entry) => entry.trim())
    .filter((entry) => entry && entry.toLowerCase() !== 'none');
  return entries.map((entry) => {
    const match = entry.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
    if (match && match[1]) return { label: match[1], tag: normalizeTag(match[2]) };
    const tag = normalizeTag(entry);
    const label = tag.split(/[/:]/).pop().replace(/[-_]+/g, ' ').trim();
    return { label: label.charAt(0).toUpperCase() + label.slice(1), tag };
  });
}

/**
 * Index dates: `published` as YYYY-MM-DD (or a spreadsheet serial / Unix timestamp when the
 * index column parses it), else `lastModified` (Unix seconds).
 * @returns {Date|null}
 */
function toDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isNaN(num)) {
    if (num > 1e11) return new Date(num);
    if (num > 1e6) return new Date(num * 1000);
    if (num > 0) return new Date(Math.round((num - 25569) * 86400000));
    return null;
  }
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = iso ? new Date(Date.UTC(iso[1], iso[2] - 1, iso[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* source format: 26-Oct-2026 */
function formatDate(date) {
  const lang = document.documentElement.lang || 'en';
  const month = new Intl.DateTimeFormat(lang.startsWith('en') ? 'en-US' : lang, { month: 'short', timeZone: 'UTC' })
    .format(date).replace(/\.$/, '');
  return `${String(date.getUTCDate()).padStart(2, '0')}-${month}-${date.getUTCFullYear()}`;
}

function buildImage(src) {
  const cell = document.createElement('div');
  cell.className = 'news-list-corp-image';
  if (isDMSrc(src)) {
    // rendered by decorateDMAssets from the original DM source (URL text → empty alt)
    const link = document.createElement('a');
    link.href = src;
    link.textContent = src;
    cell.append(link);
  } else {
    // the title next to it names the item: the thumbnail is decorative
    cell.append(createOptimizedPicture(src, '', false, [{ width: '750' }]));
  }
  return cell;
}

function buildItem(entry, index, { showDates, readMore }) {
  const li = document.createElement('li');
  li.className = 'news-list-corp-item';
  if (entry.image) li.append(buildImage(entry.image));

  const body = document.createElement('div');
  body.className = 'news-list-corp-body';
  if (showDates && entry.date) {
    const p = document.createElement('p');
    p.className = 'news-list-corp-date';
    const time = document.createElement('time');
    time.dateTime = entry.date.toISOString().slice(0, 10);
    time.textContent = formatDate(entry.date);
    p.append(time);
    body.append(p);
  }
  const title = document.createElement('h3');
  title.id = `news-list-corp-${index}-${toClassName(entry.path).slice(-40)}`;
  title.textContent = entry.title;
  body.append(title);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    body.append(p);
  }
  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.className = 'news-list-corp-link';
  cta.href = entry.path;
  cta.textContent = readMore;
  // "Read More" alone is ambiguous: the item title describes the link
  cta.setAttribute('aria-describedby', title.id);
  ctaP.append(cta);
  body.append(ctaP);
  li.append(body);
  return li;
}

/* the heading right before the block ("Filter by:") labels the tabs */
function findLabel(block) {
  const prev = block.parentElement?.previousElementSibling;
  const headings = prev?.querySelectorAll('h1, h2, h3, h4, h5, h6');
  return headings?.length ? headings[headings.length - 1] : null;
}

/**
 * News List Corp: the news under a path, newest first, from the query index, with filter
 * tabs (one per tag) and a "Load More" button (source c-newsandannouncements).
 * Rows: Path | Filters (`Label (tag-id)` per line/list item, or `none`) | Page size |
 * Show dates (true/false) | Index (optional query index URL, default the locale's).
 * Works without the index `published` / `tags` columns (lastModified order, no tabs).
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  const path = toIndexPath(config.path || window.location.pathname);
  const localePrefix = path.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/i)?.[0].toLowerCase() || getLocalePrefix();
  const pageSize = Number.parseInt(config['page-size'], 10) || DEFAULT_PAGE_SIZE;
  const showDates = !/^(false|no|0)$/i.test(String(config['show-dates'] || 'true').trim());
  const filters = parseFilters(config.filters);
  const indexUrl = config.index ? new URL(config.index, window.location.href).pathname : undefined;

  const [index, placeholders] = await Promise.all([
    fetchQueryIndex(localePrefix, indexUrl),
    fetchPlaceholders(getLocalePrefix()),
  ]);
  const text = {
    allNews: placeholders.allNews || 'All news',
    loadMore: placeholders.loadMore || 'Load More',
    readMore: placeholders.readMore || 'Read More',
    count: placeholders.newsCount || 'Showing {count} of {total}',
  };

  const rows = [...index.values()];
  // once the index carries `published`, only dated pages are articles (skips landing pages)
  const hasPublished = rows.some((r) => r.published);
  const hasTags = rows.some((r) => r.tags);
  const entries = rows
    .filter((r) => r.title && toIndexPath(r.path).startsWith(`${path}/`))
    .filter((r) => !hasPublished || r.published)
    .map((r) => ({
      path: toIndexPath(r.path),
      title: r.title,
      description: r.description,
      image: r.image,
      tags: splitTags(r.tags),
      date: toDate(r.published) || toDate(r.lastModified),
    }))
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  const panel = document.createElement('div');
  panel.className = 'news-list-corp-panel';
  const count = document.createElement('p');
  count.className = 'news-list-corp-count';
  count.setAttribute('aria-live', 'polite');
  const list = document.createElement('ul');
  list.className = 'news-list-corp-items';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'button primary news-list-corp-more';
  more.textContent = text.loadMore;
  panel.append(count, list, more);

  let matches = entries;
  let shown = 0;
  const showMore = () => {
    const next = matches.slice(shown, shown + pageSize)
      .map((entry, i) => buildItem(entry, shown + i, { showDates, readMore: text.readMore }));
    list.append(...next);
    decorateDMAssets(list);
    shown += next.length;
    count.textContent = text.count.replace('{count}', shown).replace('{total}', matches.length);
    more.hidden = shown >= matches.length;
    return next[0];
  };
  more.addEventListener('click', () => {
    showMore()?.querySelector('a.news-list-corp-link')?.focus();
  });

  const content = [];
  // tabs need the index `tags` column; without it the list shows every article
  if (filters.length && hasTags) {
    const tablist = document.createElement('div');
    tablist.className = 'news-list-corp-tabs';
    tablist.setAttribute('role', 'tablist');
    const heading = findLabel(block);
    if (heading) {
      heading.id ||= `news-list-corp-label-${toClassName(heading.textContent)}`;
      tablist.setAttribute('aria-labelledby', heading.id);
    } else tablist.setAttribute('aria-label', text.allNews);
    panel.setAttribute('role', 'tabpanel');
    blockCount += 1;
    panel.id = `news-list-corp-panel-${blockCount}`;

    const tabs = [{ label: text.allNews, tag: '' }, ...filters].map((filter, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'news-list-corp-tab';
      tab.id = `${panel.id}-tab-${i}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      const label = document.createElement('span');
      label.className = 'news-list-corp-tab-label';
      label.textContent = filter.label;
      tab.append(label);
      tab.dataset.tag = filter.tag;
      tablist.append(tab);
      return tab;
    });

    const select = (tab) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', selected);
        t.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      const { tag } = tab.dataset;
      matches = tag ? entries.filter((e) => e.tags.includes(tag)) : entries;
      shown = 0;
      list.replaceChildren();
      showMore();
    };
    tablist.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const target = {
        ArrowRight: tabs[(i + 1) % tabs.length],
        ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
        Home: tabs[0],
        End: tabs[tabs.length - 1],
      }[e.key];
      if (!target) return;
      e.preventDefault();
      target.focus();
      select(target);
    });
    content.push(tablist);
    select(tabs[0]);
  } else {
    showMore();
  }

  block.replaceChildren(...content, panel);
}
