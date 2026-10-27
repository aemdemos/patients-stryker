import { toClassName } from '../../scripts/aem.js';
import { fetchQueryIndex, getLocalePrefix, toIndexPath } from '../../scripts/utils.js';

/* deepest level styled on its own; deeper pages share its look (source h6 / p) */
const MAX_LEVEL = 5;

/**
 * Reads the key/value rows (Path, optional Index).
 * @returns {Object<string,string>} config keyed by toClassName(key)
 */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const link = valueCell.querySelector('a[href]');
    config[toClassName(keyCell.textContent)] = link
      ? link.getAttribute('href')
      : valueCell.textContent.trim();
  });
  return config;
}

/* pages the source sitemap leaves out: fragments, drafts, noindex pages */
const isListed = (row, path) => !/\/(fragments|drafts)(\/|$)/.test(path)
  && !/noindex/i.test(row.robots || '');

/* a folder without a page (or a page without a title) is named by its path segment */
function segmentLabel(segment) {
  const text = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Nests the index pages under `root` by path segment.
 * @returns {Object} root node: { children: Map<segment, node> }; node = { label, page, href }
 */
function buildTree(index, root) {
  const tree = { children: new Map() };
  const base = root === '/' ? '' : root;
  index.forEach((row, path) => {
    if (!(path === root || path.startsWith(`${base}/`)) || !isListed(row, path)) return;
    const title = String(row.title || '').replace(/\s+/g, ' ').trim();
    // the root page itself (the locale home page) is listed as a top-level entry
    const segments = path === root ? [''] : path.slice(base.length + 1).split('/');
    let node = tree;
    segments.forEach((segment) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, {
          label: segmentLabel(segment || root.split('/').pop() || 'Home'),
          page: false,
          children: new Map(),
        });
      }
      node = node.children.get(segment);
    });
    node.page = true;
    // the row path keeps the trailing slash of index pages (/us/en/about/news/)
    node.href = row.path;
    if (title) node.label = title;
  });
  return tree;
}

const byLabel = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
const sorted = (node) => [...node.children.values()].sort(byLabel);

/* the page link, or the folder name when the folder has no page */
function buildLabel(node) {
  if (!node.page) {
    const span = document.createElement('span');
    span.className = 'sitemap-corp-folder';
    span.textContent = node.label;
    return span;
  }
  const a = document.createElement('a');
  a.href = node.href;
  a.textContent = node.label;
  return a;
}

function buildList(nodes, level) {
  const ul = document.createElement('ul');
  ul.className = `sitemap-corp-level-${Math.min(level, MAX_LEVEL)}`;
  nodes.forEach((node) => {
    const li = document.createElement('li');
    li.append(buildLabel(node));
    if (node.children.size) li.append(buildList(sorted(node), level + 1));
    ul.append(li);
  });
  return ul;
}

async function render(block, { root, indexUrl }) {
  const localePrefix = root.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/i)?.[0].toLowerCase() || getLocalePrefix();
  const index = await fetchQueryIndex(localePrefix, indexUrl);
  const tree = buildTree(index, root);

  const content = document.createDocumentFragment();
  sorted(tree).forEach((section) => {
    const h2 = document.createElement('h2');
    h2.append(buildLabel(section));
    content.append(h2);
    if (section.children.size) content.append(buildList(sorted(section), 1));
  });
  block.replaceChildren(content);
  block.removeAttribute('aria-busy');
}

/**
 * Sitemap Corp: the page tree under a path (source stryker.com c-map sitemap), built from
 * the query index: an H2 per top-level section, its pages as nested link lists (one level
 * per path segment), alphabetical. A section's own page is its heading link; folders
 * without a page are named by their path segment. Fragments, drafts and `noindex` pages
 * (index `robots` column) are left out, as on the source.
 * Rows: Path (default the locale folder) | Index (optional query index URL, default the
 * locale's). The index is fetched once the block is near the viewport, never in the eager phase.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = readConfig(block);
  const root = toIndexPath(config.path || getLocalePrefix() || '/');
  const indexUrl = config.index ? new URL(config.index, window.location.href).pathname : undefined;
  block.replaceChildren();
  block.setAttribute('aria-busy', 'true');

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    render(block, { root, indexUrl });
  }, { rootMargin: '200px 0px' });
  observer.observe(block);
}
