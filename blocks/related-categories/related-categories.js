import { getMetadata } from '../../scripts/aem.js';
import { getLocalePrefix } from '../../scripts/utils.js';

/*
 * Related Categories: the page's categories, built from its `tags` metadata (stryker.com
 * product pages, the template's tag crumb; EDS publishes the field as article:tag metas). The
 * block holds its heading, after an optional row of links (the column's buttons, shown above
 * the categories); the tag list sheet (`/us/en/tags`: Tag | Label | Link) gives
 * each tag its label and landing page. One line
 * per namespace, portfolio → capability → specialty, the page's tags in their metadata order;
 * tags without a row in the sheet are not shown (as on stryker.com). Without any, the block
 * is removed.
 */

const GROUPS = ['portfolio', 'capability', 'specialty'];

// the sheet in the page's locale folder; pages previewed under /content/… (local import
// preview) read it from there too
function tagListUrl() {
  const { pathname } = window.location;
  // the locale after the local /content prefix and the readable-settings /rs root
  const path = pathname.replace(/^\/content(?=\/)/, '').replace(/^\/rs(?=\/)/, '');
  const locale = getLocalePrefix() || (path.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/)/i) || ['/us/en'])[0].toLowerCase();
  return `${pathname.startsWith('/content/') ? '/content' : ''}${locale}/tags.json`;
}

let tagList;
function fetchTagList() {
  tagList ||= fetch(tagListUrl())
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then(({ data = [] }) => new Map(data.filter((row) => row.Tag && row.Link)
      .map((row) => [row.Tag.trim().toLowerCase(), row])))
    .catch(() => new Map());
  return tagList;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // an optional row of links first: the column's button(s) above the categories (stryker.com
  // product intro: "Request information" over the tag crumb, medpor-neurosurgery)
  const rows = [...block.children];
  const actionRows = rows.filter((row) => row.querySelector('a[href]'));
  const titleRow = rows.find((row) => !actionRows.includes(row));
  const title = (titleRow ? titleRow.textContent.trim() : '') || 'Related categories';
  const actions = actionRows.flatMap((row) => [...row.querySelectorAll(':scope > div > *')]);
  // the `tags` metadata field: EDS writes it as one <meta property="article:tag"> per tag
  const tags = (getMetadata('article:tag') || getMetadata('tags')).split(',')
    .map((tag) => tag.trim().replace(/^[\w-]+:/, '').toLowerCase()).filter(Boolean);
  const list = await fetchTagList();
  const groups = GROUPS.map((ns) => tags.filter((tag) => tag.split('/')[0] === ns)
    .map((tag) => list.get(tag)).filter(Boolean)).filter((group) => group.length);
  if (!groups.length) {
    if (actions.length) block.replaceChildren(...actions);
    else (block.parentElement || block).remove();
    return;
  }

  const heading = document.createElement('h4');
  heading.className = 'related-categories-title';
  heading.textContent = title;
  const lines = groups.map((group) => {
    const ul = document.createElement('ul');
    group.forEach((row) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = row.Link;
      a.textContent = row.Label || row.Tag;
      li.append(a);
      ul.append(li);
    });
    return ul;
  });
  block.replaceChildren(...actions, heading, ...lines);
}
