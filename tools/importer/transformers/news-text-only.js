/**
 * Text-only news and security pages (import-text-only.js: news-detail template, `basic`
 * theme). Runs after the news-detail sections and the shared cleanup, on the final body:
 *
 * - trademark symbols: every ™ and ® in the page text is a superscript, `<sup>®</sup>`, as
 *   the reviewed pages are authored in DA (e.g. "Stryker expands Prophecy<sup>®</sup>
 *   Surgical Planning…", "Mako SmartRobotics<sup>™</sup>"). A symbol already in a <sup>
 *   stays as it is. The page metadata (title, og:title) is added later and keeps the plain
 *   symbol.
 * - a `spacer` section directly before a `separator` section goes: the `basic` theme puts
 *   the rule 50px below the text above it, so the spacer would add to that gap (e.g. the
 *   Tornier shoulder arthroplasty release: 85px instead of 50px above its second rule).
 */

const SYMBOLS = /[™®]/;

/** Wraps each ™ / ® of the text nodes under `root` that are not in a <sup> in its own <sup>. */
function superscriptSymbols(root, doc) {
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (SYMBOLS.test(node.textContent) && !node.parentElement.closest('sup, script, style')) nodes.push(node);
  }
  nodes.forEach((node) => {
    const parts = node.textContent.split(/([™®])/);
    const frag = doc.createDocumentFragment();
    parts.forEach((part) => {
      if (!part) return;
      if (SYMBOLS.test(part)) {
        const sup = doc.createElement('sup');
        sup.textContent = part;
        frag.append(sup);
      } else {
        frag.append(doc.createTextNode(part));
      }
    });
    node.replaceWith(frag);
  });
}

/** The Section Metadata `style` value of a section-metadata table (lowercased), or ''. */
function sectionStyle(table) {
  if (!table || table.tagName !== 'TABLE') return '';
  const head = (table.querySelector('tr th, tr td')?.textContent || '').trim().toLowerCase();
  if (head !== 'section metadata') return '';
  const row = [...table.querySelectorAll('tr')].find((tr) => (tr.cells[0]?.textContent || '').trim().toLowerCase() === 'style');
  return row ? (row.cells[1]?.textContent || '').trim().toLowerCase() : '';
}

/** Drops each spacer-only section that sits directly before a separator section. */
function dropSpacersBeforeSeparators(main) {
  // sections: the body's children between <hr> markers
  const sections = [[]];
  [...main.children].forEach((el) => {
    if (el.tagName === 'HR') sections.push([]);
    else sections[sections.length - 1].push(el);
  });
  const styleOf = (section) => {
    const table = section.find((el) => sectionStyle(el));
    return table ? sectionStyle(table).split(',').map((s) => s.trim()) : [];
  };
  for (let i = 0; i < sections.length - 1; i += 1) {
    const section = sections[i];
    const isSpacerOnly = section.length === 1 && styleOf(section).includes('spacer');
    if (isSpacerOnly && styleOf(sections[i + 1]).includes('separator')) {
      const table = section[0];
      // the section's opening <hr> (or, for the first section, the one after it) goes too
      const hr = table.previousElementSibling?.tagName === 'HR' ? table.previousElementSibling : table.nextElementSibling;
      table.remove();
      if (hr && hr.tagName === 'HR') hr.remove();
    }
  }
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  // only the text-only template's pages (the transformer is shared code)
  if (payload && payload.template && payload.template.name !== 'text-only') return;
  const doc = element.ownerDocument;
  superscriptSymbols(element, doc);
  dropSpacersBeforeSeparators(element);
}

export { superscriptSymbols, dropSpacersBeforeSeparators };
