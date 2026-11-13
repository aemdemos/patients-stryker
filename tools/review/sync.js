/*
 * Review tool: text-matched scroll sync between two renderings of the same content (the standard
 * page and its as-is version, later the source snapshot). The approach of the QA tool's Sync,
 * simplified: text runs and images that appear once on each side are paired; the longest chain
 * of pairs in the same order on both sides is kept (moved content would fold the map); a point
 * maps between its neighbouring pairs, proportionally.
 */

export const TEXT = 'h1, h2, h3, h4, h5, h6, p, li, td, th, dt, dd, figcaption, blockquote';
const MIN_TEXT = 12;

const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** the anchor key of an element: its text (an innermost text holder) or its image's file name */
export function keyOf(el) {
  if (el.tagName === 'IMG') {
    const file = (el.currentSrc || el.src || '').split('?')[0].split('/').pop();
    return file ? `i:${file}` : null;
  }
  const text = norm(el.textContent);
  return text ? `t:${text.slice(0, 90)}` : null;
}

/** the element of a document with an anchor key (the first one), or null */
export function findKey(doc, key) {
  const root = doc.querySelector('main') || doc.body;
  const sel = key.startsWith('i:') ? 'img' : TEXT;
  return [...root.querySelectorAll(sel)]
    .find((el) => (sel === 'img' || !el.querySelector(TEXT)) && keyOf(el) === key) || null;
}

/**
 * The anchors of a document: innermost text holders (key = their text) and images (key = the
 * file name), with their page position.
 * @param {Document} doc
 * @returns {{key: string, y: number}[]}
 */
export function leaves(doc) {
  const win = doc.defaultView;
  const root = doc.querySelector('main') || doc.body;
  const out = [];
  root.querySelectorAll(TEXT).forEach((el) => {
    if (el.querySelector(TEXT)) return;
    const text = norm(el.textContent);
    if (text.length < MIN_TEXT) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    out.push({ key: `t:${text.slice(0, 90)}`, y: r.top + win.scrollY });
  });
  root.querySelectorAll('img').forEach((img) => {
    const file = (img.currentSrc || img.src || '').split('?')[0].split('/').pop();
    const r = img.getBoundingClientRect();
    if (!file || !r.width || !r.height) return;
    out.push({ key: `i:${file}`, y: r.top + win.scrollY });
  });
  return out;
}

/** indexes of the longest strictly increasing run of values (patience sorting) */
function longestIncreasing(values) {
  const tails = [];
  const prev = new Array(values.length).fill(-1);
  values.forEach((v, i) => {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (values[tails[mid]] < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    tails[lo] = i;
  });
  const out = [];
  for (let i = tails.length ? tails[tails.length - 1] : -1; i >= 0; i = prev[i]) out.unshift(i);
  return out;
}

/**
 * Pairs of positions [y on side a, y on side b], top to bottom on both sides.
 * @param {{key: string, y: number}[]} a
 * @param {{key: string, y: number}[]} b
 * @returns {number[][]}
 */
export function buildAnchors(a, b) {
  const once = (list) => {
    const seen = new Map();
    list.forEach((l) => seen.set(l.key, seen.has(l.key) ? null : l));
    return seen;
  };
  const sa = once(a);
  const sb = once(b);
  const pairs = [...sa.entries()]
    .filter(([key, l]) => l && sb.get(key))
    .map(([key, l]) => [l.y, sb.get(key).y])
    .sort((p, q) => p[0] - q[0]);
  const chain = longestIncreasing(pairs.map((p) => p[1])).map((i) => pairs[i]);
  return [[0, 0], ...chain.filter((p) => p[0] > 0 && p[1] > 0)];
}

/**
 * A position on one side mapped to the other: between its neighbouring pairs, proportionally;
 * past the last pair, moved by the last pair's offset.
 * @param {number[][]} anchors from buildAnchors
 * @param {number} y the position
 * @param {number} from 0 when y is on side a, 1 when on side b
 */
export function mapY(anchors, y, from = 0) {
  const to = 1 - from;
  if (!anchors.length) return y;
  let i = 0;
  while (i + 1 < anchors.length && anchors[i + 1][from] <= y) i += 1;
  const lo = anchors[i];
  const hi = anchors[i + 1];
  if (!hi || hi[from] === lo[from]) return lo[to] + (y - lo[from]);
  const t = (y - lo[from]) / (hi[from] - lo[from]);
  return lo[to] + t * (hi[to] - lo[to]);
}
