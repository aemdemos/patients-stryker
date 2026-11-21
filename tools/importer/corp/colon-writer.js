/*
 * The import's readable form, last step: its bracket tags (`[[Gold,1.75×]…]`, settings-writer.js)
 * as colon markers (`:Gold::x1p75:…:end:`), which the server turns into empty spans before it
 * delivers a page, so search engines never read them as text (scripts/colon-tags.js on the
 * readable-settings branch turns them back into the bracket tags). The same rules as the
 * drafts' converter (.cbr/local-scripts/colons-convert.mjs):
 * - a marker runs to :end:, or to the end of the heading, paragraph or cell it is typed in
 *   (no :end: then; inside bold text or a link only when no formatting follows it right away,
 *   which the import's markdown step could merge in; a marker after a word holding http or
 *   urn would stay text on the server, so ends there are left out where they can be);
 * - tags opened one right after the other are one run of markers; when the inner one closes
 *   first, the outer ones open again before the next text of their element;
 * - sizes: 1.75× → x1p75, 5.5vw → vw5p5; a paragraph that is only [[Blank line]] → :blank-line:;
 * - heading ids as the server derives them from the text, markers included;
 * - a page without a Description gets one (the server would take a paragraph, markers
 *   included): its first paragraph of more than 10 words, the first 25 words and " ...".
 */

/**
 * Bracket tags → colon markers, in place (the plain form: sections as <div>s).
 * @param {Element} root the document body in the plain form
 * @returns {string[]} the report
 */
export function writeColonMarkers(root) {
  const doc = root.ownerDocument;
  root.normalize();
  const INLINE = new Set(['A', 'B', 'BR', 'DEL', 'EM', 'I', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']);
  const containerOf = (node) => {
    let el = node.parentElement;
    while (INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  };
  const textNodes = (container) => {
    const out = [];
    const w = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (containerOf(w.currentNode) === container) out.push(w.currentNode);
    return out;
  };
  const NAME = /^[a-z_-]+[a-z\d]*$/i;
  const marker = (token) => {
    const t = token.trim();
    const size = t.match(/^(\d+)(?:\.(\d+))?\s*(×|x|vw)$/i);
    if (size) return `${size[3].toLowerCase() === 'vw' ? 'vw' : 'x'}${size[1]}${size[2] ? `p${size[2]}` : ''}`;
    return NAME.test(t) ? t : null;
  };
  const errors = [];
  let markers = 0;
  // blank lines first: a paragraph that is only the tag
  root.querySelectorAll('p').forEach((p) => {
    if (/^\[\[\s*blank line\s*\]\]$/i.test(p.textContent.trim())) {
      p.textContent = ':blank-line:';
      markers += 1;
    }
  });
  const containers = new Set();
  const all = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (all.nextNode()) {
    const n = all.currentNode;
    if (n.nodeValue.includes('[[') && !n.parentElement.closest('code, pre')) containers.add(containerOf(n));
  }
  containers.forEach((container) => {
    const nodes = textNodes(container);
    const before = nodes.map((n) => n.nodeValue);
    // (open tags: groups of tags opened one right after the other, `[[A][[B]…`, which the
    // colon form writes as one run of markers; when the inner one closes first, the outer
    // ones open again as a run of their own: before the next text of the element they were
    // in (after a line break, not before it), or right after the close when the next text is
    // in an element inside it, a superscript say)
    const stack = [];
    const ends = [];
    let ok = true;
    let pending = null;
    const after = [];
    const reopen = (k) => {
      if (!pending) return;
      const runOf = pending.frames.flat().map((x) => `:${x}:`).join('');
      markers += pending.frames.flat().length;
      const here = nodes[k].parentElement === pending.parent;
      if (here) after[k] += runOf;
      else after[pending.k] += runOf;
      stack.push({ frames: pending.frames, parent: pending.parent });
      pending = null;
    };
    before.forEach((text, k) => {
      after[k] = '';
      let i = 0;
      let lastWasOpen = false;
      while (i < text.length) {
        const open = text.slice(i).match(/^\[\[([^\][]+)\]/);
        const literal = text.slice(i).match(/^\[[^\][]*\]/);
        if (text[i] === ']' && pending) {
          // (an outer tag closing before any more text: nothing to open again)
          pending.frames.pop();
          if (!pending.frames.length) pending = null;
          i += 1;
        } else if (open) {
          reopen(k);
          const names = open[1].split(',').map(marker);
          if (names.some((x) => !x)) ok = false;
          after[k] += names.map((x) => `:${x}:`).join('');
          markers += names.length;
          if (lastWasOpen && stack.length) stack[stack.length - 1].frames.push(names);
          else stack.push({ frames: [names], parent: nodes[k].parentElement });
          lastWasOpen = true;
          i += open[0].length;
        } else if (literal && !text.startsWith('[[', i)) {
          reopen(k);
          after[k] += literal[0];
          lastWasOpen = false;
          i += literal[0].length;
        } else if (text[i] === ']' && stack.length) {
          const group = stack.pop();
          group.frames.pop();
          const id = `\uE000E${ends.length}\uE000`;
          ends.push({ id, parent: group.parent });
          after[k] += id;
          i += 1;
          if (group.frames.length) {
            pending = { frames: group.frames, k, parent: nodes[k].parentElement };
          }
          lastWasOpen = false;
        } else {
          reopen(k);
          after[k] += text[i];
          lastWasOpen = false;
          i += 1;
        }
      }
    });
    if (!ok || stack.length) {
      errors.push(container.textContent.slice(0, 80));
      return;
    }
    nodes.forEach((n, k) => { n.nodeValue = after[k]; });
    // closes at the end of the element it was opened in (the heading, the bold text …):
    // no :end: needed, the marker runs to there
    const PLACE = /\uE000E\d+\uE000/g;
    // (inside bold text or a link only when no formatting follows it right away, at any level up
    // to the paragraph: the import's markdown step afterwards merges neighbouring bold text,
    // italics and superscripts, `<strong><em>a</em></strong><strong><em>b</em></strong>`, which
    // would move the end of the element a marker runs to)
    const MERGES = /^(A|B|EM|I|S|SPAN|STRONG|SUB|SUP|U)$/;
    const followed = (el) => {
      let x = el;
      while (x !== container && !x.nextSibling) x = x.parentElement;
      const next = x === container ? null : x.nextSibling;
      return next?.nodeType === 1 && MERGES.test(next.tagName);
    };
    const drop = new Set(ends.filter(({ id, parent }) => {
      if (parent !== container && followed(parent)) return false;
      const t = parent.textContent;
      const at = t.indexOf(id);
      return at >= 0 && !t.slice(at + id.length).replace(PLACE, '').trim();
    }).map((e) => e.id));
    // a tag closing outside the element it was opened in (`**[[Gold]a** b]`): a marker can't
    ends.filter(({ id, parent }) => !parent.textContent.includes(id))
      .forEach(() => errors.push(`cross: ${container.textContent.slice(0, 80)}`));
    // a marker right after a word holding "http" or "urn" (burns:end:, journey:end:) stays text
    // on the server (its rule skips markers inside URLs): a zero-width no-break space before
    // the marker ends the word for that rule and shows nothing
    const AFTER_URL = /(\S*?)(:[a-z_-]+[a-z\d]*:)/gi;
    nodes.forEach((n) => {
      n.nodeValue = n.nodeValue.replace(PLACE, (id) => (drop.has(id) ? '' : ':end:'))
        .replace(AFTER_URL, (m, run, mark) => (/https?|urn/i.test(run) ? `${run}\uFEFF${mark}` : m));
    });
  });
  root.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').forEach((h) => {
    if (!h.textContent.includes(':')) return;
    h.id = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  });
  const left = errors.length ? `; left as bracket tags: ${errors.length} (${errors.slice(0, 3).join(' | ')})` : '';
  return [`colon markers: ${markers}${left}`];
}

const isRow = (row, name) => new RegExp(`^${name}$`, 'i').test(row.firstElementChild?.textContent.trim() || '');
const MARKER = /(?<!(?:https?|urn)[^\s]*):(#?[a-z_-]+[a-z\d]*):/gi;

/**
 * A Description row for a page without one (the server's own pick would hold markers).
 * @param {Element} root the document body in the plain form
 * @returns {string[]} the report
 */
export function ensureDescription(root) {
  const meta = root.querySelector('.metadata');
  if (!meta || [...meta.children].some((r) => isRow(r, 'description'))) return [];
  const clean = (t) => t.replace(MARKER, '').replace(/\s+/g, ' ').trim();
  const text = [...root.querySelectorAll('p')]
    .filter((x) => !x.closest('.metadata, .section-metadata'))
    .map((x) => clean(x.textContent))
    .find((t) => !/^box(:| end)/i.test(t) && t.split(' ').length > 10);
  if (!text) return ['description: none found'];
  const words = text.split(' ');
  const doc = root.ownerDocument;
  const row = doc.createElement('div');
  const k = doc.createElement('div');
  const v = doc.createElement('div');
  k.textContent = 'Description';
  v.textContent = words.length > 25 ? `${words.slice(0, 25).join(' ')} ...` : text;
  row.append(k, v);
  const title = [...meta.children].find((r) => isRow(r, 'title'));
  if (title) title.after(row);
  else meta.prepend(row);
  return ['description: added'];
}
