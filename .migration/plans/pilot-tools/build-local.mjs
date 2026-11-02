// run the corp section builder (corp-page.js buildCorpBody) on a live page outside the
// browser importer, for debugging: node build-local.mjs <live url> [text to look for]
// Prints the import report and, with a text, whether it is in the output (and its context).
// WebImporter.Blocks.createBlock is stubbed with a plain table (name row + cells), enough for
// the builder; transformers and parsers outside the builder are not run.
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { JSDOM } = require('jsdom');

const [url, needle] = process.argv.slice(2);
const html = await (await fetch(url)).text();
const dom = new JSDOM(html, { url });
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.NodeFilter = window.NodeFilter;
globalThis.Node = window.Node;
const cellNodes = (doc, value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap((v) => cellNodes(doc, v));
  if (typeof value === 'string') return [doc.createTextNode(value)];
  return [value];
};
globalThis.WebImporter = {
  Blocks: {
    createBlock(doc, { name, cells }) {
      const table = doc.createElement('table');
      const head = doc.createElement('tr');
      const th = doc.createElement('th');
      th.textContent = name;
      head.append(th);
      table.append(head);
      const rows = Array.isArray(cells) ? cells : Object.entries(cells).map(([k, v]) => [k, v]);
      rows.forEach((row) => {
        const tr = doc.createElement('tr');
        (Array.isArray(row) ? row : [row]).forEach((cell) => {
          const td = doc.createElement('td');
          td.append(...cellNodes(doc, cell));
          tr.append(td);
        });
        table.append(tr);
      });
      return table;
    },
  },
  DOMUtils: { remove: (el, sels) => sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())) },
};
const { buildCorpBody } = await import('../../../tools/importer/corp-page.js');
const body = window.document.body;
buildCorpBody(body, { params: { originalURL: url } });
const report = JSON.parse(body.getAttribute('data-corp-report') || '{}');
console.log('unhandled:', report.unhandled);
console.log('notes:', report.notes);
if (needle) {
  const out = body.innerHTML;
  const i = out.toLowerCase().indexOf(needle.toLowerCase());
  console.log(i >= 0 ? `found: …${out.slice(Math.max(0, i - 300), i + 200)}…` : 'NOT in the output');
}
