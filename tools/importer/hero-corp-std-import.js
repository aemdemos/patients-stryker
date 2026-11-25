/*
 * In review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/hero-corp.md): the
 * stryker.com slide values → the named hero-corp options and Text style.
 *   position     slide margin-left / width / top → text-left / -right / -wide and text-top /
 *                -upper / -middle / -lower (slide-position.js, the nearest of each)
 *   box          the headline's bg-* class → box-white / -gold / -blue / -gray / -dark /
 *                -gold-gradient / -purple-gradient / -blue-gradient
 *   title colour the colour of most bold runs (black = none) → title-gold / -white /
 *                -light-gray / -blue; subline colour: the same for the plain runs
 *   phone        mobile_Bottom → mobile-below; mobile-text-black stays
 *   text sizes   each fontsize-N-vw / fontsize-Nem run → a bracket tag ([[size-N-vw]…]),
 *                which corp-text-markers.js turns into its Text style marker (hl15 … hl45,
 *                l … xxxxl)
 */
import { slidePosition } from './slide-position.js';

const BOXES = {
  'bg-white': 'box-white',
  'bg-gold': 'box-gold',
  'bg-blue': 'box-blue',
  'bg-light-gray': 'box-gray',
  'bg-dark-gray': 'box-dark',
  'bg-golden-gradient': 'box-gold-gradient',
  'bg-dark-purple-gradient': 'box-purple-gradient',
  'bg-dark-blue-gradient': 'box-blue-gradient',
  'bg-purple': 'box-purple',
  'bg-teal': 'box-teal',
  'bg-black': 'box-black',
  'bg-lighter-gray': 'box-pale-gray',
  'bg-gray': 'box-mid-gray',
  'bg-orange': 'box-dark-gold',
  'bg-gray-gradient': 'box-gray-gradient',
  'bg-dark-teal-gradient': 'box-teal-gradient',
  'bg-dark-orange-gradient': 'box-orange-gradient',
};

// stryker.com colour values → the title / subline colour names (black = the default)
const COLOURS = [
  [/^(#ffb500|rgba?\(\s*255\s*,\s*181\s*,\s*0\s*(,\s*1\s*)?\))$/i, 'gold'],
  [/^(#fff(fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(,\s*1\s*)?\))$/i, 'white'],
  [/^(#edeeec|rgba?\(\s*237\s*,\s*238\s*,\s*236\s*(,\s*1\s*)?\))$/i, 'light-gray'],
  [/^(#1c5687|rgba?\(\s*28\s*,\s*86\s*,\s*135\s*(,\s*1\s*)?\))$/i, 'blue'],
];
const CLASS_COLOURS = {
  'color-gold': 'gold', 'color-white': 'white', 'color-light-gray': 'light-gray', 'color-blue': 'blue',
};

function colourOf(node, stop) {
  let el = node.nodeType === 1 ? node : node.parentElement;
  while (el && el !== stop) {
    const style = (el.getAttribute && el.getAttribute('style')) || '';
    const m = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    if (m) {
      const value = m[1].trim();
      const hit = COLOURS.find(([re]) => re.test(value));
      return hit ? hit[1] : 'other';
    }
    const cls = [...(el.classList || [])].find((c) => CLASS_COLOURS[c]);
    if (cls) return CLASS_COLOURS[cls];
    el = el.parentElement;
  }
  return '';
}

/**
 * The title / subline colour options of a headline: the colour most of its bold (title) or
 * plain (subline) text has, when it is one of the four named colours.
 * @param {Element} headline the source .c-largeheadline (or overlay)
 * @returns {string[]} the options
 */
export function colourOptions(headline) {
  const counts = { title: {}, subline: {} };
  const doc = headline.ownerDocument;
  const walker = doc.createTreeWalker(headline, 4);
  let node = walker.nextNode();
  while (node) {
    const len = node.textContent.trim().length;
    if (len) {
      const bold = !!node.parentElement.closest('.futura-bold, b, strong');
      const role = bold ? 'title' : 'subline';
      const colour = colourOf(node, headline) || 'black';
      counts[role][colour] = (counts[role][colour] || 0) + len;
    }
    node = walker.nextNode();
  }
  return ['title', 'subline'].flatMap((role) => {
    const [top] = Object.entries(counts[role]).sort((a, b) => b[1] - a[1]);
    return top && ['gold', 'white', 'light-gray', 'blue'].includes(top[0]) ? [`${role}-${top[0]}`] : [];
  });
}

/**
 * Wraps the text of each sized run (span.fontsize-N-vw / span.fontsize-Nem) in a bracket tag
 * of its size, for corp-text-markers.js. Call before the spans are unwrapped.
 * @param {Element} root a copy of the headline line
 */
export function sizeBrackets(root) {
  const doc = root.ownerDocument;
  root.querySelectorAll('span[class*="fontsize-"]').forEach((span) => {
    if (!span.textContent.trim()) return;
    const cls = [...span.classList].find((c) => /^fontsize-/.test(c));
    let tag = '';
    let m = cls.match(/^fontsize-(\d+(?:-\d+)?)-?vw$/);
    if (m) tag = `size-${m[1]}-vw`;
    m = cls.match(/^fontsize-(\d+(?:-\d+)?)em$/);
    if (m) tag = `text-${m[1]}`;
    if (!tag || span.querySelector('span[class*="fontsize-"]')) return;
    span.prepend(doc.createTextNode(`[[${tag}]`));
    span.append(doc.createTextNode(']'));
  });
}

/**
 * The named options of a slide.
 * @param {object} slide the source values
 * @param {number|null} slide.left margin-left in %
 * @param {number|null} slide.right the right inset in %
 * @param {number|null} slide.top top in %
 * @param {Element|null} slide.overlay the .overlayparsys (phone layout, mobile-text-black)
 * @param {Element|null} slide.headline the .c-largeheadline (box, colours)
 * @returns {string[]} the options after image-slide
 */
export function slideOptions({
  left, right, top, overlay, headline,
}) {
  const options = [...slidePosition(left, right, top).options];
  const boxed = headline && headline.querySelector('.has-background[class*="bg-"]');
  // the box colour noted before the page steps unwrapped a rich-text box (sections transformer)
  const bg = (boxed && [...boxed.classList].find((c) => BOXES[c]))
    || (overlay && BOXES[overlay.getAttribute('data-std-box')] && overlay.getAttribute('data-std-box'));
  if (bg) options.push(BOXES[bg]);
  if (headline) options.push(...colourOptions(headline));
  if (overlay && overlay.classList.contains('mobile_Bottom')) options.push('mobile-below');
  if (overlay && (overlay.classList.contains('mobile-text-black') || overlay.querySelector('.mobile-text-black'))) options.push('mobile-text-black');
  return options;
}

/**
 * Removes the colour of bracket tags that only repeat what the options already give: the
 * title / subline colour of the slide, or white on a dark headline box. Other classes of a
 * tag stay; a tag left without classes goes (its text stays).
 * @param {Element[]} lines the headline lines
 * @param {Set<string>} colours the colour names to drop (gold, white …)
 */
export function dropColourTags(lines, colours) {
  if (!colours.size) return;
  const TOKEN = /\[\[([^\][]+)\]|\]/g;
  lines.forEach((line) => {
    const doc = line.ownerDocument;
    const walker = doc.createTreeWalker(line, 4);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    const stack = [];
    const edits = [];
    nodes.forEach((node) => {
      TOKEN.lastIndex = 0;
      let m = TOKEN.exec(node.nodeValue);
      while (m) {
        if (m[1] !== undefined) {
          const classes = m[1].split(',').map((c) => c.trim());
          const kept = classes.filter((c) => !colours.has((c.match(/^color-(.+)$/) || [])[1]));
          const token = {
            node,
            start: m.index,
            end: m.index + m[0].length,
            kept,
            changed: kept.length !== classes.length,
          };
          stack.push(token);
          if (token.changed) edits.push(token);
        } else if (stack.length) {
          const open = stack.pop();
          if (open.changed && !open.kept.length) {
            edits.push({
              node, start: m.index, end: m.index + 1, kept: null, changed: true,
            });
          }
        }
        m = TOKEN.exec(node.nodeValue);
      }
    });
    // last first, so the offsets in each node stay valid
    edits.reverse().forEach((e) => {
      let out = '';
      if (e.kept && e.kept.length) out = `[[${e.kept.join(',')}]`;
      e.node.nodeValue = e.node.nodeValue.slice(0, e.start) + out + e.node.nodeValue.slice(e.end);
    });
  });
}

/**
 * The empty gold or gold-gradient band right after a slide (stryker.com c-full-bleed-panel):
 * the stripe option; the band itself is removed.
 * @param {Element} element the slide's carousel
 * @returns {string} stripe-gold, stripe-gradient or ''
 */
export function takeStripe(element) {
  let el = element;
  for (let i = 0; el && i < 6; i += 1) {
    const next = el.nextElementSibling;
    if (next) {
      const panel = next.matches('.fullbleedpanel') ? next.querySelector('.c-full-bleed-panel') : null;
      if (!panel || panel.textContent.replace(/[\s\u00a0]+/g, '') || panel.querySelector('img, iframe')) return '';
      let stripe = '';
      if (panel.classList.contains('bg-gold')) stripe = 'stripe-gold';
      else if (panel.classList.contains('bg-golden-gradient')) stripe = 'stripe-gradient';
      if (stripe) next.remove();
      return stripe;
    }
    el = el.parentElement;
  }
  return '';
}

/**
 * The slide's background video (a Dynamic Media standalone video in the slide) as the link the
 * video block reads, with its poster.
 * @param {Element} slide the carousel slide
 * @returns {string} the video URL, or ''
 */
export function slideVideo(slide) {
  const asset = slide.querySelector('.c-standalone-video [data-asset-path], [data-asset-type^="video"][data-asset-path]');
  const path = asset && asset.getAttribute('data-asset-path');
  if (!path || path.startsWith('/content/dam/')) return '';
  const base = 'https://media-assets.stryker.com/is';
  return `${base}/content/${path}.m3u8?poster=${base}/image/${path}?fit=constrain,1&wid=909&hei=511`;
}

/*
 * A single slide whose image is a product cut-out in the right half of the grid
 * (.standaloneimage with aem-GridColumn--offset--default--6 / --default--6, on a white XF) and
 * the text on the left: stryker.com's page intro, not a banner, so the Hero Corp (page-hero)
 * layout, text left, image right (Isolibrium, LIFEPAK 35).
 * @param {Element} slide The .carouselslide
 * @param {Element|null} overlay Its .overlayparsys
 * @returns {boolean} Whether it is a page intro
 */
export function productSlide(slide, overlay) {
  const ef = slide.querySelector('.experienceFragment-ef');
  const col = ef && ef.querySelector('.standaloneimage');
  if (!overlay || !col) return false;
  const offset = Number((col.className.match(/aem-GridColumn--offset--default--(\d+)/) || [])[1] || 0);
  const width = Number((col.className.match(/aem-GridColumn--default--(\d+)/) || [])[1] || 0);
  const dark = /\bbg-(?!white)[a-z-]+/.test(ef.className);
  return offset >= 5 && width > 0 && offset + width <= 12 && !dark;
}

const cleanText = (value) => (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * One line of the page intro: its words and inline formatting, and the size, serif and gold
 * it has on stryker.com (a fontsize-<n>em span, or the size tag an earlier step wrote).
 * @param {Element} el The source line
 * @returns {{node: Element, size: string, serif: boolean, gold: boolean}} The line
 */
function introLine(el) {
  const doc = el.ownerDocument;
  const box = doc.createElement('div');
  [...el.childNodes].forEach((n) => box.append(n.cloneNode(true)));
  const sizeSpan = box.querySelector('[class*="fontsize-"]');
  let size = sizeSpan ? ((sizeSpan.className.match(/fontsize-(\d+(?:-\d+)?)em/) || [])[1] || '') : '';
  // a size tag an earlier step wrote counts from the 14px text, not from the line
  let tagged = false;
  let serif = !!box.querySelector('.urw-egyptienne');
  let gold = !!box.querySelector('[style*="ffb500" i], [style*="255, 181, 0"], [style*="255,181,0"]');
  // size / font / colour tags an earlier step wrote ([[text-1-5,serif]…]): read, then dropped
  const walker = doc.createTreeWalker(box, 4);
  const texts = [];
  for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
  let open = 0;
  texts.forEach((t) => {
    t.nodeValue = t.nodeValue.replace(/\[\[([^\]]+)\]/g, (m, raw) => {
      open += 1;
      raw.split(',').map((c) => c.trim()).forEach((c) => {
        const s = c.match(/^(?:text|size)-(\d+(?:-\d+)?)$/);
        if (s && !size) {
          [, size] = s;
          tagged = true;
        }
        if (c === 'serif') serif = true;
        if (c === 'color-gold') gold = true;
      });
      return '';
    });
  });
  for (let i = texts.length - 1; i >= 0 && open > 0; i -= 1) {
    while (open > 0 && texts[i].nodeValue.includes(']')) {
      const at = texts[i].nodeValue.lastIndexOf(']');
      texts[i].nodeValue = texts[i].nodeValue.slice(0, at) + texts[i].nodeValue.slice(at + 1);
      open -= 1;
    }
  }
  box.querySelectorAll('span, font').forEach((span) => span.replaceWith(...span.childNodes));
  box.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (!(node.tagName === 'A' && attr.name === 'href')) node.removeAttribute(attr.name);
    });
  });
  return {
    node: box, size, serif, gold, tagged,
  };
}

/**
 * The page intro's copy rows: the title (h1, gold as bold + italic when gold on the source),
 * the subhead (the next heading, h2) and the text, each sized once with its Text style tag.
 * @param {Element} overlay The slide's .overlayparsys
 * @returns {Element[]} The lines
 */
export function introCopy(overlay) {
  const doc = overlay.ownerDocument;
  const lines = [...overlay.querySelectorAll('h1, h2, h3, p')]
    .filter((el) => !el.parentElement.closest('h1, h2, h3, p')
      && !el.closest('.curatedcta, .buttonset, .c-curatedcta')
      && cleanText(el.textContent.replace(/\[\[[^\]]+\]|\]/g, '')));
  let title = false;
  return lines.map((el) => {
    const line = introLine(el);
    let tag = 'p';
    if (/^H[1-3]$/.test(el.tagName)) tag = title ? 'h2' : 'h1';
    if (tag === 'h1') title = true;
    const out = doc.createElement(tag);
    if (tag === 'h1') {
      // the title is bold (Futura); gold is the conventions' bold + italic
      line.node.querySelectorAll('strong, b').forEach((s) => s.replaceWith(...s.childNodes));
      const strong = doc.createElement('strong');
      const inner = line.gold ? doc.createElement('em') : strong;
      while (line.node.firstChild) inner.append(line.node.firstChild);
      if (inner !== strong) strong.append(inner);
      out.append(strong);
    } else {
      while (line.node.firstChild) out.append(line.node.firstChild);
    }
    // the size relative to the line's own size in the page intro (title 28px, subhead 24.5px,
    // text 14px); a tag from an earlier step is relative to the 14px text
    let size = Number((line.size || '1').replace('-', '.'));
    if (line.tagged) size = (size * 14) / ({ h1: 28, h2: 24.5 }[tag] || 14);
    const words = [];
    if (Math.abs(size - 1) >= 0.1) words.push(`text-${String(Math.round(size * 100) / 100).replace('.', '-')}`);
    // the subhead is serif already (page-hero); a serif text line keeps its serif
    if (line.serif && tag === 'p') words.push('serif');
    if (words.length) {
      out.prepend(doc.createTextNode(`[[${words.join(',')}]`));
      out.append(doc.createTextNode(']'));
    }
    return out;
  });
}
