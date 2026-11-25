/* global STD_DRAFT, STD_REVIEW_PAGES */
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
// a review run of chosen pages (esbuild --define:STD_REVIEW_PAGES=true on top of STD_DRAFT):
// the pages listed in review-pages-xf.js import as product pages, with the review-run rules
// (stdReviewPage) on top. The two builds used today (committed, and the review build for
// product pages) don't set it, so their output is unchanged
export const STD_REVIEW_IMPORT = STD_DRAFT_IMPORT
  && typeof STD_REVIEW_PAGES !== 'undefined' && STD_REVIEW_PAGES === true;

/**
 * Whether the page being imported is a stryker.com product page (its body has
 * `data-template="product-detail"`), in the staging build: the product-detail review rules
 * (Page intro banner, Panels beside other content, template product-detail) apply only there,
 * so long-page-detail and news-detail pages keep their own import.
 * @param {Document} doc The source document
 * @returns {boolean}
 */
export function stdProductPage(doc) {
  return STD_DRAFT_IMPORT && doc?.body?.getAttribute('data-template') === 'product-detail';
}

/**
 * Whether the rules made for the review run of pages of other templates (STD_REVIEW_PAGES)
 * apply: those rules leave every other build's output as it was, product pages' too.
 * @param {Document} doc The source document
 * @returns {boolean}
 */
export function stdReviewPage(doc) {
  return STD_REVIEW_IMPORT && stdProductPage(doc);
}

// bracket class → Text style word ('' = no word, the text stays plain)
const SIZE_WORDS = {
  '0-8': 's', '1-25': 'l', '1-5': 'xl', '1-75': 'xxl', 2: 'xxxl', '2-5': 'xxxxl',
};
// only the words the Text style panel offers (tools/text-markers): no navy (no stryker.com text
// uses it); line boxes in every colour stryker.com puts round a line (exact, never the nearest)
const COLOURS = ['gold', 'white', 'blue', 'purple', 'teal', 'grey', 'light-gray'];
// the Stryker colours the Text style panel adds (library sheet words, class ts-<word>)
const EXTRA_COLOURS = {
  black: 'black', 'dark-gold': 'darkgold', 'mid-grey': 'midgrey', 'pale-grey': 'palegrey',
};
const LOOKS = ['rule-gold', 'box-gold', 'box-blue', 'box-purple', 'box-teal', 'box-dark',
  'box-dark-purple-gradient', 'box-dark-blue-gradient', 'box-dark-gold', 'box-gold-gradient', 'box-gray-gradient',
  'box-teal-gradient', 'box-orange-gradient', 'box-mid-gray', 'box-pale-gray', 'box-black'];
// the package's four headline sizes (S, M, L, XL); every stryker.com size (17 values) takes the
// nearest, by ratio: 1 → S, 2.5 → L, 3.5 → L, 4 → XL, 5 and up → XL
const HEADLINE_STEPS = [1.5, 2, 3, 4.5];
// the text steps by word; two size tags right inside each other multiply on stryker.com (1.25em in
// 1.5em = 1.875×), so one merged marker takes the step nearest to the product
const STEP_OF = {
  s: 0.8, l: 1.25, xl: 1.5, xxl: 1.75, xxxl: 2, xxxxl: 2.5,
};
const stepOff = (w, n) => Math.abs(Math.log(STEP_OF[w] / n));
const nearestStep = (n) => Object.keys(STEP_OF)
  .reduce((a, b) => (stepOff(b, n) < stepOff(a, n) ? b : a));
const oneSize = (words) => {
  const sizes = words.filter((w) => STEP_OF[w]);
  if (sizes.length < 2) return words;
  const step = nearestStep(sizes.reduce((p, w) => p * STEP_OF[w], 1));
  return [...words.filter((w) => !STEP_OF[w]), step];
};
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
    if (m && EXTRA_COLOURS[m[1]]) return [EXTRA_COLOURS[m[1]]];
    if (c === 'serif') return ['serif'];
    if (c === 'body-font') return ['body'];
    if (c === 'futura-bold') return ['sans'];
    // a product page's Futura bold run (long-page-detail-corp-article.js): kept only inside a
    // serif or body run (convertContainer)
    if (c === 'std-sans') return ['std-sans'];
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
// the kind of a Text style word: one size, colour and font per marker
const SIZE_SET = new Set([...Object.values(SIZE_WORDS), 'hl15', 'hl2', 'hl3', 'hl45']);
const COLOUR_SET = new Set([...COLOURS, ...Object.values(EXTRA_COLOURS)]);
function kindOf(word) {
  if (SIZE_SET.has(word)) return 'size';
  if (COLOUR_SET.has(word)) return 'colour';
  if (['serif', 'body', 'sans'].includes(word)) return 'font';
  return '';
}

function convertContainer(nodes, dropped, chains = false) {
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
  // product pages (chains): a chain of tags directly inside each other (a colour, a size and the
  // copy size of the cell, SafeAir "65mm suction sleeve") is one marker: the tokens of the tags
  // between two of them don't count as content
  const between = (a, b) => all.slice(a.to, b.at);
  const gap = (a, b) => (chains ? between(a, b).replace(/\[\[[^\][]+\]|\]/g, '') : between(a, b))
    .trim() === '';
  // words; a tag right inside another (nothing between the openers nor the closers) joins it
  pairs.sort((a, b) => a.at - b.at).forEach((p) => { p.words = markerWords(p.raw, dropped); });
  // (a tag right inside a merged one joins that one's target: `[[box-gold][[xxl][[color-white]X]]]`
  // is one marker)
  pairs.forEach((inner) => {
    const outer = pairs.find((o) => o !== inner && o.at < inner.at
      && o.close.at > inner.close.at && gap(o, inner) && gap(inner.close, o.close));
    if (!outer) return;
    let target = outer;
    while (target.into) target = target.into;
    // a chain (product pages): the inner tag's size, colour and font win, as stacked markers do
    if (chains) {
      const kinds = inner.words.map(kindOf);
      // …except two text sizes (em in em): they multiply on stryker.com (Pangea's 1.5em in 2em
      // is 3×), so both stay and the marker takes the step nearest their product (oneSize)
      const innerText = inner.words.some((x) => STEP_OF[x]);
      target.words = target.words.filter((w) => !kindOf(w) || !kinds.includes(kindOf(w))
        || (innerText && STEP_OF[w]));
    }
    target.words.push(...inner.words);
    inner.merged = true;
    inner.into = target;
  });
  // a product page's Futura bold run: the `sans` word inside a serif or body run (the run's font
  // would cover it), nothing elsewhere; a whole serif run that is Futura bold is Futura bold
  pairs.forEach((p) => { p.hadFont = p.words.some((w) => w === 'serif' || w === 'body'); });
  pairs.forEach((p) => {
    if (!p.words.includes('std-sans')) return;
    const target = p.merged ? p.into : p;
    if (p.merged) {
      const font = target.words.some((w) => w === 'serif' || w === 'body') || target.hadFont;
      target.words = target.words.filter((w) => w !== 'serif' && w !== 'body' && w !== 'std-sans');
      if (font) target.words.push('sans');
      return;
    }
    const around = pairs.some((o) => o !== p && o.at < p.at && o.close.at > p.close.at
      && (o.merged ? o.into : o).words.some((w) => w === 'serif' || w === 'body'));
    p.words = p.words.filter((w) => w !== 'std-sans');
    if (around) p.words.push('sans');
  });
  // replace, last first so the offsets in each node stay valid
  tokens.filter((t) => !t.literal).sort((a, b) => b.at - a.at).forEach((t) => {
    const open = t.raw !== undefined ? t : t.pair;
    // a word with digits (hl15 …) goes last: EDS reads `:name:` as a marker only when its
    // digits end the name
    const unique = [...new Set(oneSize(open.words))];
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
    if (texts.some((x) => x.nodeValue.includes('[['))) convertContainer(texts, dropped, stdProductPage(doc));
    // a product page's `sans` around a run that already has its marker: one marker (the site
    // keeps only the inner one of two stacked markers); adjacent text joined first
    if (!texts.some((x) => x.nodeValue.includes(':start-sans:') || x.nodeValue.includes('-sans:'))) return;
    container.normalize();
    const joined = [];
    const jw = doc.createTreeWalker(container, 4);
    for (let j = jw.nextNode(); j; j = jw.nextNode()) joined.push(j);
    joined.forEach((x) => {
      x.nodeValue = x.nodeValue.replace(
        /:start-sans::start-([a-z0-9-]+):([^:]*?):end::end:/g,
        (all, inner, words) => {
          const list = [...new Set([...inner.split('-'), 'sans'])];
          const ordered = [...list.filter((w) => !/\d/.test(w)), ...list.filter((w) => /\d/.test(w))];
          return `:start-${ordered.join('-')}:${words}:end:`;
        },
      ).replace(
        /:start-([a-z0-9-]*?)-?sans::start-([a-z0-9-]+):([^:]*?):end::end:/g,
        (all, outer, inner, words) => {
          const list = [...new Set([...outer.split('-').filter(Boolean), ...inner.split('-'), 'sans'])];
          const ordered = [...list.filter((w) => !/\d/.test(w)), ...list.filter((w) => /\d/.test(w))];
          return `:start-${ordered.join('-')}:${words}:end:`;
        },
      );
    });
  });
  return [...dropped];
}

// EDS skips a `:name:` right after a word holding "http" or "urn" (its guard for addresses,
// e.g. "journey.:end:" stays as text): a space before the marker keeps it a marker
const ADDRESS_GUARD = /((?:https?|urn)\S*?)(:(?:start-[a-z0-9-]+|end):)/gi;

/**
 * Puts a space before every marker the address guard would skip.
 * @param {Element} main The page content
 */
export function keepMarkersReadable(main) {
  // review build, product pages: the text as EDS reads it, adjacent pieces joined (Mako
  // "…setup and turnover." and its end marker were two pieces: the guard missed it)
  if (stdReviewPage(main.ownerDocument)) main.normalize();
  const walker = main.ownerDocument.createTreeWalker(main, 4 /* NodeFilter.SHOW_TEXT */);
  let node = walker.nextNode();
  while (node) {
    ADDRESS_GUARD.lastIndex = 0;
    if (ADDRESS_GUARD.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(ADDRESS_GUARD, '$1 $2');
    node = walker.nextNode();
  }
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform' || !STD_DRAFT_IMPORT) return;
  const dropped = bracketsToMarkers(element);
  keepMarkersReadable(element);
  // the classes without a word, for the import report
  if (payload && dropped.length) payload.textMarkersDropped = dropped;
}
