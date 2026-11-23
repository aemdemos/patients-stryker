/*
 * Review tool: stable keys for the blocks and text sections of a standard page, so a saved choice
 * stays on its own block when the page changes around it (a conversion re-run adds or removes
 * sections; positions like `s14b0` move, the content does not). A key is the block's type and a
 * fingerprint of its content: its text and image alt texts (not image or link addresses: Document
 * Authoring stores images under its own names, so the branch preview and the workspace would
 * differ). A design choice changes a block's classes, never its content, so the key stays.
 *   block   `b:<type>:<fingerprint>`, e.g. `b:columns:3f2a9c1b`
 *   section `t:<fingerprint>` (a section's own text, outside its blocks)
 * Identical content on one page (twins, e.g. the same jump links twice): `~<the nearest unique
 * block or section before it>`, and `#1`, `#2` only when that is the same too.
 * A block whose content changes (a text fix) gets a new key: its saved choices are not found any
 * more and go to the re-check list (summary.js), never guessed. DOM only; works on the page's
 * authored markup (`.plain.html`, sections as top-level divs).
 */

/** a polynomial hash of the text (modulo the largest prime below 2^32), as 8 hex digits */
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = (h * 33 + text.charCodeAt(i)) % 4294967291;
  return h.toString(16).padStart(8, '0');
}

const isBlock = (el) => el.matches('div[class]') && !el.matches('.section-metadata, .metadata');

// all whitespace out: Document Authoring stores pages with line breaks between elements, the
// workspace copies have none ("contact us about" vs "contact usabout"), the words are the same
const squeeze = (s) => s.replace(/\s+/g, '').toLowerCase();

/** the content a key is made of: the text, then the alt texts of the images (no whitespace) */
export function contentOf(el) {
  const alts = [...el.querySelectorAll('img[alt]')].map((i) => squeeze(i.getAttribute('alt'))).filter(Boolean);
  return `${squeeze(el.textContent)}\n${alts.join('|')}`;
}

/**
 * The keys of an authored page: { byId: { s14b0: 'b:columns:…', s3: 't:…' }, byKey: { … → id } }
 * @param {Element} body the page's body (sections as top-level divs)
 */
export function pageKeys(body) {
  // every block and text section in page order, with its content key
  const all = [];
  [...body.children].forEach((section, si) => {
    const loose = [...section.children].filter((c) => !isBlock(c));
    if (loose.some((c) => c.textContent.trim().length > 8)) {
      all.push({ id: `s${si}`, base: `t:${hash(loose.map(contentOf).join('\n'))}` });
    }
    [...section.children].filter(isBlock).forEach((block, bi) => {
      all.push({ id: `s${si}b${bi}`, base: `b:${block.classList[0]}:${hash(contentOf(block))}` });
    });
  });
  const count = new Map();
  all.forEach((x) => count.set(x.base, (count.get(x.base) || 0) + 1));
  // identical content (twins): named by the nearest unique block or section before it, so
  // removing or adding a twin does not rename the others; a number only as the last resort
  const byId = {};
  const seen = new Map();
  let anchor = 'top';
  all.forEach((x) => {
    let key = x.base;
    if (count.get(x.base) > 1) key = `${x.base}~${anchor === 'top' ? 'top' : hash(anchor)}`;
    else anchor = x.base;
    const n = seen.get(key) || 0;
    seen.set(key, n + 1);
    byId[x.id] = n ? `${key}#${n}` : key;
  });
  const byKey = Object.fromEntries(Object.entries(byId).map(([id, key]) => [key, id]));
  return { byId, byKey };
}

/** the keys of a page's authored markup (its `.plain.html` text) */
export function keysOfHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return pageKeys(doc.body);
}

/** an entry's item → the current position id (`b:` / `t:` keys looked up; anything else as is) */
export function toPosition(item, keys) {
  if (!/^[bt]:/.test(item)) return item;
  if (keys.byKey[item]) return keys.byKey[item];
  // a twin whose other twin is gone (or one that became a twin): its content alone, when exactly
  // one block or section on the page has it
  const base = item.replace(/[~#].*$/, '');
  const same = Object.entries(keys.byId).filter(([, key]) => key.replace(/[~#].*$/, '') === base);
  return same.length === 1 ? same[0][0] : null;
}

/** a position id → the key to save it under (blocks and text sections; anything else as is) */
export function toKey(item, keys) {
  if (/^s\d+(b\d+)?$/.test(item)) return keys.byId[item] || item;
  return item;
}
