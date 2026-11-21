/*
 * Authoring example (documentation pages): one example document, shown twice side by side.
 * Left: the document rendered by the site's own code as a page of its own (in a frame, so
 * page-level rules such as section backgrounds and carousels apply as on any page; the site
 * header and footer are hidden). The frame is as wide as the column, so the layout is the one
 * for that width.
 * Right: the same document as it looks in the Document Authoring editor: blocks as tables with
 * their name in a header row, Section Metadata as a table, section breaks, text formatting and
 * bracket tags as typed. Links show their address, which the editor shows in its link popup.
 * It is drawn in a shadow root (styles: authoring-example-doc.css), so no page style changes it.
 *
 * Content: one row, one cell, a link to the example document (a page with `site: corp`
 * metadata). Its Metadata block is shown only with the `with-metadata` variant, for examples
 * whose metadata matters.
 */
import fetchPlainHtml from '../../scripts/plain-html.js';

/** `hero-corp` → `Hero Corp`, `section-metadata` → `Section Metadata` */
const blockTitle = (name) => name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function el(tag, className, ...children) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.append(...children);
  return e;
}

/**
 * A copy of authored content as the editor shows it: icons as their `:name:` text, links with
 * their address (and an image address in the title) after them.
 * @param {Node} node The authored node (from the fetched document)
 * @returns {Node} The copy
 */
function editorCopy(node) {
  const copy = document.importNode(node, true);
  if (copy.nodeType !== Node.ELEMENT_NODE) return copy;
  copy.querySelectorAll('span.icon').forEach((icon) => {
    const name = [...icon.classList].find((c) => c.startsWith('icon-'));
    icon.replaceWith(name ? `:${name.slice(5)}:` : '');
  });
  copy.querySelectorAll('a[href]').forEach((a) => {
    const parts = [a.getAttribute('href')];
    if (a.title) parts.push(`title: ${a.title}`);
    a.removeAttribute('title');
    a.after(el('span', 'authoring-example-href', parts.join(' · ')));
  });
  copy.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  copy.removeAttribute('id');
  return copy;
}

/**
 * A block as the editor's table: a header row with the block name and its variants, then one
 * table row per block row.
 * @param {Element} block The authored block (div with the block classes)
 * @returns {Element} The table
 */
function blockTable(block) {
  const [name, ...variants] = [...block.classList];
  const rows = [...block.children];
  const columns = Math.max(1, ...rows.map((r) => r.children.length));
  const th = el('th', '', `${blockTitle(name)}${variants.length ? ` (${variants.join(', ')})` : ''}`);
  th.colSpan = columns;
  const table = el('table', 'authoring-example-table', el('thead', '', el('tr', '', th)));
  const tbody = el('tbody', '');
  rows.forEach((row) => {
    const tr = el('tr', '');
    const cells = [...row.children];
    cells.forEach((cell, i) => {
      const td = el('td', '', ...[...cell.childNodes].map(editorCopy));
      if (i === cells.length - 1 && cells.length < columns) td.colSpan = columns - cells.length + 1;
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

/**
 * The editor view of a document: its sections, separated by section breaks.
 * @param {Document} doc The parsed .plain.html
 * @returns {Element} The view
 */
function editorView(doc) {
  const view = el('div', 'authoring-example-doc');
  view.lang = doc.documentElement.lang || 'en';
  [...doc.body.children].filter((s) => s.tagName === 'DIV').forEach((section, i) => {
    if (i) view.append(el('div', 'authoring-example-break', '---'));
    [...section.children].forEach((child) => {
      view.append(child.tagName === 'DIV' && child.classList.length ? blockTable(child) : editorCopy(child));
    });
  });
  return view;
}

/**
 * The example as a page in a frame, without the site header and footer, as tall as its content.
 * @param {string} path The example document path
 * @returns {HTMLIFrameElement} The frame
 */
function pageFrame(path) {
  const frame = document.createElement('iframe');
  frame.className = 'authoring-example-frame';
  frame.title = `Example: ${path.split('/').pop()}`;
  frame.loading = 'lazy';
  // in the local preview, documents are served under /content/ (scripts/plain-html.js)
  const local = window.location.pathname.startsWith('/content/') && !path.startsWith('/content/');
  frame.src = local ? `/content${path}` : path;
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc) return;
    const style = doc.createElement('style');
    style.textContent = 'html body > header, html body > footer, html body .back-to-top { display: none; }';
    doc.head.append(style);
    const fit = () => {
      const main = doc.querySelector('main');
      if (main) frame.style.height = `${Math.ceil(main.getBoundingClientRect().bottom + doc.defaultView.scrollY)}px`;
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(doc.body);
    fit();
  });
  return frame;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  const path = link ? new URL(link.href, window.location).pathname : '';
  const result = el('div', 'authoring-example-result');
  const source = el('div', 'authoring-example-source');
  block.replaceChildren(
    el('div', 'authoring-example-pane', el('p', 'authoring-example-label', 'On the page'), result),
    el('div', 'authoring-example-pane', el('p', 'authoring-example-label', 'In the document'), source),
  );
  if (!path) return;

  result.append(pageFrame(path));
  const resp = await fetchPlainHtml(path);
  if (resp.ok) {
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    if (!block.classList.contains('with-metadata')) {
      doc.querySelectorAll('div.metadata').forEach((meta) => meta.closest('body > div')?.remove());
    }
    const root = source.attachShadow({ mode: 'open' });
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${window.hlx.codeBasePath}/blocks/authoring-example/authoring-example-doc.css`;
    root.append(css, editorView(doc));
  }
}
