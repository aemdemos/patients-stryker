/* global STD_DRAFT */
/**
 * Corp text styles → Text style markers (scripts/span-markers.js, the Text style panel).
 *
 * The corp transformers mark styled runs of text with bracket tags (`[[text-2,serif]Get in
 * touch with]`), which the site no longer renders (#542). Run last (afterTransform), this turns
 * every bracket tag into the marker pair the site and the Text style panel use:
 *
 *   [[text-2,serif]Get in touch with]   →   :start-xxxl-serif:Get in touch with:end:
 *
 * Tags directly inside each other with nothing else between them (`[[box-gold][[text-2]X]]`)
 * become one marker (`:start-box-gold-xxxl:X:end:`): stacked markers keep only the inner style.
 * Classes without a Text style word are dropped (their text stays).
 */

// in review: only a staging build for draft pages turns this on (esbuild
// --define:STD_DRAFT=true); the committed bundles keep the bracket tags, so a re-import of a
// real page renders as today until the standardisation is approved
export const STD_DRAFT_IMPORT = typeof STD_DRAFT !== 'undefined' && STD_DRAFT === true;

// bracket class → Text style word ('' = no word, the text stays plain)
const SIZE_WORDS = {
  '0-8': 's', '1-25': 'l', '1-5': 'xl', '1-75': 'xxl', 2: 'xxxl', '2-5': 'xxxxl',
};
const COLOURS = ['gold', 'white', 'blue', 'purple', 'teal', 'navy', 'grey', 'light-gray'];
const LOOKS = ['rule-gold', 'box-white', 'box-gray', 'box-gold', 'box-blue', 'box-purple', 'box-teal',
  'box-dark', 'box-dark-blue-gradient', 'box-dark-purple-gradient'];
// the package's four headline sizes (S, M, L, XL); every stryker.com size (17 values) takes the
// nearest, by ratio: 1 → S, 2.5 → L, 3.5 → L, 4 → XL, 5 and up → XL
const HEADLINE_STEPS = [1.5, 2, 3, 4.5];
const headlineWord = (n) => {
  const off = (step) => Math.abs(Math.log(step / n));
  const step = HEADLINE_STEPS.reduce((a, b) => (off(b) < off(a) ? b : a));
  return `hl${String(step).replace('.', '')}`;
};

/**
 * The Text style words of a bracket tag's classes.
 * @param {string} raw The text between `[[` and `]`, e.g. `text-2,serif`
 * @param {Set<string>} dropped Collects the classes without a word
 * @returns {string[]} The words
 */
export function markerWords(raw, dropped) {
  return raw.split(',').map((c) => c.trim().toLowerCase()).flatMap((c) => {
    let m = c.match(/^(?:text|size)-(\d+(?:-\d+)?)(?:em)?$/);
    if (m && SIZE_WORDS[m[1]]) return [SIZE_WORDS[m[1]]];
    if (m && m[1] === '1') return [];
    // any other text size takes the nearest of the text steps (3.5 → 2.5×)
    if (m && /^\d+(-\d+)?$/.test(m[1])) {
      const n = Number(m[1].replace('-', '.'));
      const steps = Object.keys(SIZE_WORDS).map((k) => [Number(String(k).replace('-', '.')), SIZE_WORDS[k]]);
      const off = ([v]) => Math.abs(Math.log(v / n));
      return [steps.reduce((a, b) => (off(b) < off(a) ? b : a))[1]];
    }
    m = c.match(/^(?:headline-(\d+(?:-\d+)?)|size-(\d+(?:-\d+)?)-?vw)$/);
    if (m) return [headlineWord(Number((m[1] || m[2]).replace('-', '.')))];
    m = c.match(/^color-([a-z-]+)$/);
    if (m && COLOURS.includes(m[1])) return [m[1]];
    if (c === 'serif') return ['serif'];
    if (c === 'body-font') return ['body'];
    if (c === 'futura-bold') return ['sans'];
    if (LOOKS.includes(c)) return [c];
    dropped.add(c);
    return [];
  });
}

const INLINE = new Set(['A', 'B', 'BR', 'DEL', 'EM', 'I', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']);
const TOKEN = /\[\[([^\][]+)\]|\]/g;

const containerOf = (node) => {
  let el = node.parentElement;
  while (el && INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
  return el;
};

/**
 * Converts the bracket tags of one container (a paragraph, heading, list item or cell).
 * @param {Text[]} nodes Its text nodes, in order
 * @param {Set<string>} dropped Collects the classes without a word
 */
function convertContainer(nodes, dropped) {
  // the tokens, with their offset in the container's text
  const tokens = [];
  let offset = 0;
  let all = '';
  nodes.forEach((node) => {
    const value = node.nodeValue;
    TOKEN.lastIndex = 0;
    let m = TOKEN.exec(value);
    while (m) {
      const end = m.index + m[0].length;
      tokens.push({
        node, start: m.index, end, at: offset + m.index, to: offset + end, raw: m[1],
      });
      m = TOKEN.exec(value);
    }
    offset += value.length;
    all += value;
  });
  // pair each closer with the nearest open tag; a closer without one is plain text
  const stack = [];
  const pairs = [];
  tokens.forEach((t) => {
    if (t.raw !== undefined) {
      stack.push(t);
    } else if (stack.length) {
      const open = stack.pop();
      open.close = t;
      t.pair = open;
      pairs.push(open);
    } else {
      t.literal = true;
    }
  });
  stack.forEach((t) => { t.literal = true; });
  const gap = (a, b) => all.slice(a.to, b.at).trim() === '';
  // words; a tag right inside another (nothing between the openers nor the closers) joins it
  pairs.sort((a, b) => a.at - b.at).forEach((p) => { p.words = markerWords(p.raw, dropped); });
  pairs.forEach((inner) => {
    const outer = pairs.find((o) => o !== inner && !o.merged && o.at < inner.at
      && o.close.at > inner.close.at && gap(o, inner) && gap(inner.close, o.close));
    if (!outer) return;
    let target = outer;
    while (target.into) target = target.into;
    target.words.push(...inner.words);
    inner.merged = true;
    inner.into = target;
  });
  // replace, last first so the offsets in each node stay valid
  tokens.filter((t) => !t.literal).sort((a, b) => b.at - a.at).forEach((t) => {
    const open = t.raw !== undefined ? t : t.pair;
    // a word with digits (hl15 …) goes last: EDS reads `:name:` as a marker only when its
    // digits end the name
    const unique = [...new Set(open.words)];
    const words = [...unique.filter((w) => !/\d/.test(w)), ...unique.filter((w) => /\d/.test(w))];
    let out = '';
    if (!open.merged && words.length) out = t.raw !== undefined ? `:start-${words.join('-')}:` : ':end:';
    t.node.nodeValue = t.node.nodeValue.slice(0, t.start) + out + t.node.nodeValue.slice(t.end);
  });
}

/**
 * Turns every bracket tag under `main` into Text style markers.
 * @param {Element} main The page content
 * @returns {string[]} The classes that had no Text style word
 */
export function bracketsToMarkers(main) {
  const doc = main.ownerDocument;
  const walker = doc.createTreeWalker(main, 4 /* NodeFilter.SHOW_TEXT */);
  const byContainer = new Map();
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue.includes('[') || node.nodeValue.includes(']')) {
      const container = containerOf(node);
      if (container && !container.closest('code, pre, script, style')) {
        if (!byContainer.has(container)) byContainer.set(container, []);
      }
    }
    node = walker.nextNode();
  }
  const dropped = new Set();
  byContainer.forEach((_, container) => {
    const texts = [];
    const tw = doc.createTreeWalker(container, 4);
    let t = tw.nextNode();
    while (t) {
      if (containerOf(t) === container) texts.push(t);
      t = tw.nextNode();
    }
    if (texts.some((x) => x.nodeValue.includes('[['))) convertContainer(texts, dropped);
  });
  return [...dropped];
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform' || !STD_DRAFT_IMPORT) return;
  const dropped = bracketsToMarkers(element);
  // the classes without a word, for the import report
  if (payload && dropped.length) payload.textMarkersDropped = dropped;
}
