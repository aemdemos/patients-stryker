/*
 * Standardise pilot: the typography rules. A readable-settings document → the same document on
 * the standard type scale (scripts/corp-settings.js TYPE_STEPS, styles-corp.css --corp-type-*):
 * every size in the text and in the size rows becomes one of 10 named steps, the same size
 * wherever it is used, instead of a measured value (`[[1.75×]`, `[[3.5vw]`, `Copy size | 2×`)
 * or a size relative to the text around it.
 *
 * - a size tag's desktop size is worked out from its context, as the page renders it: a vw size
 *   is N × 14px; a multiple (`1.75×`, `Large` = 1.25×) is that many times the text around it
 *   (the enclosing tag, else the element: a heading's level size × the section's Heading size,
 *   a label's Label size, a paragraph's Copy size); the named sizes Display, Headline, Title,
 *   Lead, Fluid are 3, 2.5, 2, 1.5, 1vw;
 * - the size becomes the nearest step (by ratio); when that is the step the text has anyway,
 *   the size goes; colours, fonts and alignment stay;
 * - Copy size / Label size rows → a step name; Heading size rows go, the headings they enlarged
 *   (the section's h2 / h3, not in cards) get the step as a tag; Text / Headings rows: their
 *   sizes → step names;
 * - the page gets `type-scale: standard` metadata (fragments follow the page they are on).
 * DOM only, so the same code runs in the browser and in Node (on a Playwright page).
 */

/** the steps: name → desktop size (px) */
export const STEPS = {
  Small: 11.2,
  Body: 14,
  Large: 17.5,
  Lead: 21,
  Subtitle: 24.5,
  Title: 28,
  Headline: 35,
  Display: 42,
  Statement: 56,
  Hero: 70,
};
/** a size (px) → the nearest step, by ratio */
export function stepOf(px) {
  return Object.entries(STEPS).reduce((best, [name, v]) => (
    Math.abs(Math.log(px / v)) < Math.abs(Math.log(px / STEPS[best])) ? name : best), 'Body');
}

const ORDER = Object.keys(STEPS);
/** two sizes this far apart (ratio) stay at least one step apart */
const CONTRAST = 1.25;
/**
 * The steps of a section's sizes (px): the nearest step each, but a size clearly smaller than
 * the next larger one (by CONTRAST) gets a smaller step than it, so the scale's ends (above Hero,
 * below Small) keep a section's hierarchy: a 115px figure over 63px text → Hero over Statement.
 * @param {number[]} list the sizes
 * @returns {Map<number, string>} size → step name
 */
export function contrastSteps(list) {
  const map = new Map();
  let prev = null;
  [...new Set(list)].sort((a, b) => b - a).forEach((px) => {
    let k = ORDER.indexOf(stepOf(px));
    if (prev) {
      k = Math.min(k, prev.k);
      if (prev.px / px >= CONTRAST) k = Math.max(0, Math.min(k, prev.k - 1));
    }
    map.set(px, ORDER[k]);
    prev = { px, k };
  });
  return map;
}

const BASE = 14;
const NAMED_VW = {
  display: 3, headline: 2.5, title: 2, lead: 1.5, fluid: 1,
};
const LEVEL = {
  H1: 28, H2: 24.5, H3: 21, H4: 17.5, H5: 15, H6: 14,
};
/** desktop sizes in Columns with Large Headline (blocks/columns/columns-corp.css) */
const LARGE_HEADLINE = {
  H2: 28, H4: 35, P: 14, LI: 17.5,
};
const COPY = { small: 11.2, large: 17.5, 'x-large': 21 };
const LABEL = { large: 24.5 };
const MULTIPLE = /^(\d+(?:\.\d+)?)\s*[×x]$/i;
const VW = /^(\d+(?:\.\d+)?)\s*vw$/i;
const STEP_NAMES = Object.keys(STEPS).map((s) => s.toLowerCase());

/** the size (px) a size token gives, in text of `around` px; null when it is not a size */
function tokenSize(token, around) {
  const t = token.trim();
  const low = t.toLowerCase();
  let m = t.match(VW);
  if (m) return Number(m[1]) * BASE;
  m = t.match(MULTIPLE);
  if (m) return Number(m[1]) * around;
  if (NAMED_VW[low]) return NAMED_VW[low] * BASE;
  if (low === 'large') return 1.25 * around;
  if (STEP_NAMES.includes(low)) return STEPS[t.charAt(0).toUpperCase() + low.slice(1)];
  return null;
}
const isSize = (token) => tokenSize(token, BASE) !== null;

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** a section's settings rows: key → [value, row element] */
function settingsRows(section) {
  const meta = section.querySelector(':scope > .section-metadata');
  const rows = new Map();
  if (meta) {
    [...meta.children].forEach((row) => {
      const [k, v] = [...row.children];
      if (k) rows.set(text(k), [text(v), row]);
    });
  }
  return rows;
}

/** a Copy size / Label size value → px */
function rowSize(value, names) {
  const low = (value || '').trim().toLowerCase();
  const m = low.match(MULTIPLE);
  if (m) return Number(m[1]) * BASE;
  if (names[low]) return names[low];
  if (STEP_NAMES.includes(low)) return STEPS[low.charAt(0).toUpperCase() + low.slice(1)];
  return null;
}

const LABEL_P = (p) => p.tagName === 'P' && !!p.querySelector(':scope > strong:only-child, :scope > em:only-child > strong:only-child')
  && text(p) === text(p.querySelector('strong'));

/**
 * The document on the standard type scale.
 * @param {Element} body the document's body (the sections as top-level divs), changed in place
 * @param {{page: boolean}} options page: the document is a page (gets the metadata)
 * @returns {{changes: string[], sizes: {text: string, px: number, step: string}[]}} what
 *   changed in plain words, and each size tag's worked-out desktop size and step
 */
export function transformDocument(body, { page = true } = {}) {
  const changes = [];
  const sizes = [];
  const moved = {};
  const note = (from, to) => { moved[`${from} → ${to}`] = (moved[`${from} → ${to}`] || 0) + 1; };
  let rowsChanged = 0;

  [...body.children].forEach((section) => {
    const rows = settingsRows(section);
    const get = (key) => (rows.get(key) || [])[0];
    const copy = rowSize(get('Copy size'), COPY) || BASE;
    const label = rowSize(get('Label size'), LABEL);
    const factor = Number(((get('Heading size') || '').match(MULTIPLE) || [])[1]) || 1;
    const scaled = (h) => /^H[23]$/.test(h.tagName) && !h.closest('.cards, .cards-corp');
    // (blocks/columns/columns.css: an h3 in Columns of a serif section is 1.5× the h3)
    const serif = (get('style') || '').split(',').map((t) => t.trim()).includes('serif');
    // (blocks/columns/columns-corp.css: Columns with Large Headline have their own sizes)
    const headline = (el) => !!el.closest('.columns.large-headline');
    const level = (h) => {
      if (headline(h) && LARGE_HEADLINE[h.tagName]) return LARGE_HEADLINE[h.tagName];
      return LEVEL[h.tagName] * (serif && h.tagName === 'H3' && h.closest('.columns') ? 1.5 : 1);
    };

    // the base size of an element's text, before its tags (and after: the step it becomes)
    const baseOf = (el) => {
      if (!el) return copy;
      if (/^H[1-6]$/.test(el.tagName)) return level(el) * (scaled(el) ? factor : 1);
      if (headline(el) && LARGE_HEADLINE[el.tagName]) return LARGE_HEADLINE[el.tagName];
      if (label && LABEL_P(el)) return label;
      return copy;
    };

    // inline size tags: a stream over the section's text (tags span elements); run twice: first
    // to collect the section's sizes (so sizes that differ clearly keep a step between them),
    // then to write the steps
    const content = [...section.children].filter((c) => !c.classList.contains('section-metadata'));
    const used = new Set();
    let stepFor = (px) => {
      used.add(Math.round(px * 100) / 100);
      return stepOf(px);
    };
    const walk = (write) => content.forEach((root) => {
      const walker = root.ownerDocument.createTreeWalker(root, 4);
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      const stack = [];
      nodes.forEach((node) => {
        const s = node.nodeValue;
        const el = node.parentElement.closest('h1, h2, h3, h4, h5, h6, p, li, td, th');
        const heading = el && /^H[1-6]$/.test(el.tagName);
        const sup = node.parentElement.closest('sup, sub') ? 0.75 : 1;
        let out = '';
        let i = 0;
        while (i < s.length) {
          const m = s.slice(i).match(/^\[\[([^\]]+)\]/);
          if (m && m[1].trim() !== 'Blank line') {
            const tokens = m[1].split(',').map((t) => t.trim()).filter(Boolean);
            // the text's size without this tag (what it is compared with)
            const sizedAbove = stack.filter((x) => x.sized);
            const around = sizedAbove.length ? sizedAbove[sizedAbove.length - 1].px : baseOf(el);
            // what a multiple multiplies, as scripts/corp-type.js sizes it: in copy always the
            // 14px copy (× 0.75 in a superscript), in an h1 the 28px h1, in other headings the
            // heading's (or the enclosing tag's) size
            let unit = BASE * sup;
            if (heading && el.tagName === 'H1' && !sizedAbove.length) unit = LEVEL.H1 * sup;
            else if (heading) unit = around;
            const sized = tokens.filter(isSize);
            const kept = tokens.filter((t) => !isSize(t));
            let px = around;
            sized.forEach((t) => { px = tokenSize(t, /^(\d|large$)/i.test(t) ? unit : px); });
            if (sized.length) {
              const step = stepFor(px);
              // (without the tag, text in a superscript is 0.75 × the text around it)
              const plain = stepFor(around * sup);
              if (write) {
                const tagText = s.slice(i + m[0].length).split(']')[0];
                sizes.push({ text: tagText, px: Math.round(px * 100) / 100, step });
                note(sized.join('+'), step === plain ? 'as the text around it' : step);
              }
              if (step !== plain) kept.push(step);
            }
            stack.push({ px, sized: sized.length > 0, keep: kept.length > 0 });
            if (kept.length) out += `[[${kept.join(',')}]`;
            i += m[0].length;
          } else if (s[i] === ']' && stack.length) {
            if (stack.pop().keep) out += ']';
            i += 1;
          } else {
            out += s[i];
            i += 1;
          }
        }
        if (write && out !== s) node.nodeValue = out;
      });
    });
    walk(false);
    const map = contrastSteps([...used]);
    stepFor = (px) => map.get(Math.round(px * 100) / 100) || stepOf(px);
    walk(true);

    // Heading size: the headings it enlarged get their step as a tag, the row goes
    if (rows.has('Heading size')) {
      content.forEach((root) => [...root.querySelectorAll('h2, h3')].concat(/^H[23]$/.test(root.tagName) ? [root] : [])
        .filter(scaled).forEach((h) => {
          const step = stepOf(level(h) * factor);
          if (step === stepOf(level(h)) || !text(h)) return;
          const walker = h.ownerDocument.createTreeWalker(h, 4);
          const first = walker.nextNode();
          let last = first;
          for (let n = first; n; n = walker.nextNode()) last = n;
          first.nodeValue = `[[${step}]${first.nodeValue}`;
          last.nodeValue = `${last.nodeValue}]`;
        }));
      changes.push(`heading size ${get('Heading size')} → ${stepOf(LEVEL.H2 * factor)} (h2) / ${stepOf(LEVEL.H3 * factor)} (h3) on the headings`);
      rows.get('Heading size')[1].remove();
      rowsChanged += 1;
    }
    // Copy size / Label size → a step name (Body: the row goes)
    [['Copy size', COPY], ['Label size', LABEL]].forEach(([key, names]) => {
      if (!rows.has(key)) return;
      const [value, row] = rows.get(key);
      const px = rowSize(value, names);
      if (!px) return;
      const step = stepOf(px);
      if (step === value) return;
      if (step === 'Body') row.remove();
      else row.lastElementChild.textContent = step;
      changes.push(`${key.toLowerCase()} ${value} → ${step === 'Body' ? 'the normal copy size' : step}`);
      rowsChanged += 1;
    });
    // Text / Headings: their size names → step names
    ['Text', 'Headings'].forEach((key) => {
      if (!rows.has(key)) return;
      const [value, row] = rows.get(key);
      const names = value.split(',').map((t) => t.trim()).filter(Boolean);
      const out = names.map((t) => {
        const px = tokenSize(t, key === 'Text' ? copy : LEVEL.H2);
        return px === null ? t : stepOf(px);
      }).filter((t, i, list) => t !== 'Body' && list.indexOf(t) === i);
      if (out.join(', ') === names.join(', ')) return;
      if (out.length) row.lastElementChild.textContent = out.join(', ');
      else row.remove();
      changes.push(`${key.toLowerCase()} row ${value} → ${out.join(', ') || 'none'}`);
      rowsChanged += 1;
    });
    const meta = section.querySelector(':scope > .section-metadata');
    if (meta && !meta.children.length) meta.remove();
  });

  // the page on the standard scale
  if (page) {
    const metadata = body.querySelector('.metadata');
    const has = metadata && [...metadata.children].some((row) => text(row.firstElementChild) === 'type-scale');
    if (metadata && !has) {
      const row = body.ownerDocument.createElement('div');
      ['type-scale', 'standard'].forEach((t) => {
        const cell = body.ownerDocument.createElement('div');
        cell.textContent = t;
        row.append(cell);
      });
      metadata.append(row);
      changes.push('page on the standard type scale');
    }
  }
  const total = Object.values(moved).reduce((a, b) => a + b, 0);
  if (total) {
    const top = Object.entries(moved).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, n]) => `${k} (${n})`)
      .join(', ');
    changes.unshift(`${total} sizes in the text → steps: ${top}`);
  }
  if (rowsChanged) changes.push(`${rowsChanged} size rows → steps`);
  return { changes, sizes };
}
