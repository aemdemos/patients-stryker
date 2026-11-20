/*
 * Shared by the `base` template importers (legal, patents, webinar, people, footnotes):
 * the group of a page, its page metadata and the bracket-tag cleanup of the builder's text.
 */
import PAGE_TAGS from '../page-tags.json';

export const GROUPS = ['legal', 'patents', 'webinar', 'people', 'footnotes', 'events'];

// The empty news-archive and global-events pages and the 2018/2019 event and LINNC pages (#527),
// scattered over the site, so listed one by one (lower case: the EDS path)
const EVENT_PAGES = new Set([
  ...['2011', '2012', '2013', '2014', '2015', '2016', '2017', 'features', 'press-kit'].map((n) => `/us/en/about/news/${n}`),
  ...['2018/acfas', '2018/aofas2018', '2018/ormanagers', '2019/2019-post-ota-newsletter-page', '2019/acfas',
    '2019/asbrs-2019', '2019/assh', '2019/global-power-tools', '2019/iahcsmm-2019', '2019/rebuild-lives'].map((n) => `/us/en/c/${n}`),
  '/us/en/global-events',
  '/us/en/global-events/sports-medicine',
  '/us/en/global-events/sports-medicine/association-meetings',
  '/us/en/global-events/sports-medicine/training',
  '/us/en/global-events/trauma-and-extremities/association-meetings/2018/ota-2018',
  '/us/en/neurovascular/c/linnc-paris',
  '/us/en/neurovascular/c/linnc-paris/index',
  '/us/en/training-and-education/orthopaedics/trauma-extremities',
]);

const pathOf = (url) => new URL(url, 'https://www.stryker.com').pathname
  .replace(/\/$/, '').replace(/\.html?$/, '');

/**
 * The group of a source URL, which picks the importer and the theme.
 * @param {string} url source URL
 * @returns {string} one of GROUPS, legal being every page the others do not claim
 */
export function groupOf(url) {
  const path = pathOf(url);
  if (/^\/us\/en\/about\/(patents|trademarks)(\/|$)/.test(path)) return 'patents';
  if (/^\/us\/en\/(sage\/webinars|emergency-care\/webinars|sage\/videos\/sage-mp-mats-2-demo)/.test(path)) return 'webinar';
  if (/^\/us\/en\/about\/(our-management\/leaders|our-board-of-directors\/directors)/.test(path)) return 'people';
  if (path.startsWith('/us/en/interventional-spine/footnotes')) return 'footnotes';
  if (EVENT_PAGES.has(path.toLowerCase())) return 'events';
  return 'legal';
}

// Pages whose theme the bulk metadata sheet does not assign (see the PR): legal pages and one video
const PAGE_THEME = { legal: 'legal', footnotes: '', events: '' };

/** Page metadata of every `base` page: template, theme (when the sheet has none) and tags. */
export function applyBaseMeta(meta, url, group) {
  meta.template = 'base';
  const path = pathOf(url);
  const theme = group === 'webinar' && path === '/us/en/sage/videos/sage-mp-mats-2-demo'
    ? 'webinar' : PAGE_THEME[group];
  if (theme) meta.theme = theme;
  const tags = PAGE_TAGS[path];
  if (tags?.length) meta.tags = tags.join(', ');
}

// Bracket tags (`[[tag]text]`, the span-tags.js runtime #542 removes) the builder emits become
// semantic content or a section style: gold → Bold + Italic, `body-font` → `bold-body`, the
// Large Headline sizes → their `headline-*vw` section style, the other size tags are dropped.
export const TAG_SECTION_STYLES = {
  'body-font': 'bold-body',
  'headline-2': 'headline-2vw',
  'headline-2-5': 'headline-2-5vw',
  serif: 'serif',
};
const BRACKET = /\[\[([a-z0-9,-]+)\]|\]/g;

function sectionIndex(main, node) {
  let top = node;
  while (top.parentElement && top.parentElement !== main) top = top.parentElement;
  let count = 0;
  for (let n = top.previousElementSibling; n; n = n.previousElementSibling) {
    if (n.tagName === 'HR') count += 1;
  }
  return count;
}

// splits the text nodes of one element into text, open and close tokens next to its elements
function bracketTokens(parent) {
  const tokens = [];
  [...parent.childNodes].forEach((node) => {
    if (node.nodeType !== 3) {
      tokens.push({ node });
      return;
    }
    const value = node.nodeValue;
    let last = 0;
    [...value.matchAll(BRACKET)].forEach((m) => {
      if (m.index > last) tokens.push({ text: value.slice(last, m.index) });
      tokens.push(m[1] ? { open: m[1].split(',') } : { close: true });
      last = m.index + m[0].length;
    });
    if (last < value.length) tokens.push({ text: value.slice(last) });
  });
  return tokens;
}

// Rebuilds the children of `parent` from its tokens: a matched pair is unwrapped, gold text
// is wrapped in <em><strong>; an unmatched `]` stays text. Returns the tags removed.
function stripBracketTokens(parent, document) {
  const tokens = bracketTokens(parent);
  const removed = [];
  const isHeading = /^H[1-6]$/.test(parent.tagName);
  const build = (from, closes) => {
    const nodes = [];
    let i = from;
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.open) {
        const inner = build(i + 1, true);
        i = inner.next;
        let content = inner.nodes;
        // a serif run inside a heading is italic text (<em>), not a serif section
        const asEm = isHeading && t.open.includes('serif') && !t.open.includes('color-gold');
        removed.push(...t.open.filter((tag) => !(asEm && tag === 'serif')));
        if (asEm) {
          // only the plain runs: a nested gold (<em><strong>) run keeps its own markup
          const wrapped = [];
          let run = null;
          content.forEach((n) => {
            if (n.nodeType === 1) {
              run = null;
              wrapped.push(n);
              return;
            }
            if (!run) {
              run = document.createElement('em');
              wrapped.push(run);
            }
            run.append(n);
          });
          content = wrapped;
        }
        if (t.open.includes('color-gold')) {
          const tail = [];
          const isBlank = (n) => n.nodeName === 'BR'
            || (n.nodeType === 3 && !n.nodeValue.trim());
          while (content.length && isBlank(content[content.length - 1])) {
            tail.unshift(content.pop());
          }
          if (content.some((n) => n.nodeType === 3 && n.nodeValue.trim())) {
            const strong = document.createElement('strong');
            strong.append(...content);
            content = [strong];
          }
          const em = document.createElement('em');
          em.append(...content);
          content = [em, ...tail];
        }
        nodes.push(...content);
      } else if (t.close) {
        if (closes) return { nodes, next: i + 1 };
        nodes.push(document.createTextNode(']'));
        i += 1;
      } else {
        nodes.push(t.node || document.createTextNode(t.text));
        i += 1;
      }
    }
    return { nodes, next: i };
  };
  const { nodes } = build(0, false);
  parent.replaceChildren(...nodes);
  return removed;
}

// Every bracket tag of the page → semantic markup; returns { sectionIndex → styles }.
export function stripBrackets(main, document) {
  const styles = new Map();
  const parents = [...main.querySelectorAll('*')].filter((el) => [...el.childNodes]
    .some((n) => n.nodeType === 3 && /\[\[[a-z0-9,-]+\]/.test(n.nodeValue)));
  parents.forEach((parent) => {
    if (!parent.isConnected) return;
    const index = sectionIndex(main, parent);
    stripBracketTokens(parent, document).forEach((tag) => {
      const style = TAG_SECTION_STYLES[tag];
      if (!style) return;
      if (!styles.has(index)) styles.set(index, new Set());
      styles.get(index).add(style);
    });
  });
  return styles;
}

/** Adds a variant to the name of a block table: `Columns (a)` → `Columns (a, b)`. */
export function addVariant(table, variant) {
  const head = table.querySelector('th') || table.querySelector('tr > *');
  if (!head) return;
  const [, name, variants] = head.textContent.trim().match(/^([^(]*?)\s*(?:\((.*)\))?$/);
  const list = (variants || '').split(',').map((v) => v.trim()).filter(Boolean);
  if (!list.includes(variant)) list.push(variant);
  head.textContent = `${name} (${list.join(', ')})`;
}

/** The blocks of a page whose name starts with `name` (e.g. 'Columns'). */
export function blockTables(main, name) {
  return [...main.querySelectorAll('table')]
    .filter((t) => (t.querySelector('th') || t.querySelector('tr > *'))?.textContent.trim().startsWith(name));
}
