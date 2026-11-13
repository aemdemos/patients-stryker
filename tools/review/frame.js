/*
 * Review tool, inside the standard page's frame (loaded by scripts.js with ?review on preview
 * hosts only): the page's switchable blocks and section backgrounds, and switching them. A block
 * is re-rendered from its authored markup (the page's .plain.html) with the chosen variant,
 * decorated like the page (scripts.js decorateMain + loadSections), and swapped in place.
 * The shell drives it through window.stdReview.
 */
import { loadSections } from '../../scripts/aem.js';
import { BACKGROUNDS } from '../importer/standardise/rules/variants.js';
import { variantsOf, groupKey } from './groups.js';

const BG = Object.keys(BACKGROUNDS);
const words = (s) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter((w) => w.length > 2));
/** a block's words: each text node apart (cells don't run together), image alts and titles */
function blockWords(el) {
  const parts = [];
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.nodeValue);
  el.querySelectorAll('img[alt], [title], [aria-label]').forEach((e) => {
    parts.push(e.getAttribute('alt') || '', e.getAttribute('title') || '', e.getAttribute('aria-label') || '');
  });
  return words(parts.join(' '));
}
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  a.forEach((w) => { if (b.has(w)) n += 1; });
  return n / Math.min(a.size, b.size);
};

/** the class list of a block in a variant (and width) */
function classesFor(name, variant, width) {
  if (name === 'hero-corp') return ['hero-corp', 'image-slide', variant];
  return [name, variant, width].filter(Boolean);
}

/* ---------- the authored page ---------- */

async function authoredSections() {
  const resp = await fetch(`${window.location.pathname}.plain.html`);
  if (!resp.ok) return [];
  const doc = new DOMParser().parseFromString(`<body>${await resp.text()}</body>`, 'text/html');
  return [...doc.body.children];
}

const own = (section) => [...section.children].filter((c) => c.matches('div[class]') && !c.matches('.section-metadata, .metadata'));
const sectionStyles = (section) => {
  const row = [...section.querySelectorAll(':scope > .section-metadata > div')].find((r) => r.firstElementChild?.textContent.trim() === 'style');
  return row ? row.lastElementChild.textContent.split(',').map((s) => s.trim()).filter(Boolean) : [];
};

/* ---------- the review state ---------- */

export default async function start(decorateMain) {
  const items = [];
  const sections = await authoredSections();
  // wait for the page's own sections to load before matching
  await new Promise((resolve) => {
    const t0 = Date.now();
    const check = () => {
      const all = [...document.querySelectorAll('main .section')];
      if ((all.length && all.every((s) => s.dataset.sectionStatus === 'loaded')) || Date.now() - t0 > 8000) resolve();
      else window.setTimeout(check, 250);
    };
    check();
  });

  // authored blocks → rendered blocks: same name, best text overlap, in page order
  const rendered = [...document.querySelectorAll('main .block')].filter((b) => !b.closest('header, footer'));
  const used = new Set();
  sections.forEach((section, si) => {
    const blocks = own(section);
    blocks.forEach((block, bi) => {
      const name = block.classList[0];
      const { list, widths } = variantsOf(block);
      const target = blockWords(block);
      let best = null;
      let bestScore = 0;
      const candidates = rendered.filter((r) => !used.has(r) && r.dataset.blockName === name);
      candidates.forEach((r) => {
        const score = overlap(target, blockWords(r));
        if (score > bestScore) {
          best = r;
          bestScore = score;
        }
      });
      // (a rendered block without any words, e.g. a video player: the next one of its kind)
      if (!best || bestScore < 0.5) best = candidates.find((r) => !blockWords(r).size) || null;
      if (!best) return;
      used.add(best);
      const styles = sectionStyles(section);
      const k = blocks.slice(0, bi).filter((b) => b.classList[0] === name).length;
      items.push({
        id: `s${si}b${bi}`,
        name,
        group: groupKey(block),
        si,
        nth: k,
        el: best,
        list,
        widths,
        standard: list[0] ?? null,
        variant: list[0] ?? null,
        width: widths.length ? ([...block.classList].find((c) => c === 'wide-first' || c === 'wide-last') || '') : null,
        background: BG.find((b) => styles.includes(b)) || '',
      });
      const added = items[items.length - 1];
      added.standardWidth = added.width;
      added.standardBackground = added.background;
    });
  });

  const render = async (section) => {
    const main = document.createElement('main');
    main.append(document.importNode(section, true));
    decorateMain(main);
    await loadSections(main);
    return main.querySelector(':scope > .section');
  };

  const changed = () => document.dispatchEvent(new CustomEvent('std-review-change'));

  async function apply(item) {
    const section = sections[item.si].cloneNode(true);
    const block = own(section).filter((b) => b.classList[0] === item.name)[item.nth];
    block.className = classesFor(item.name, item.variant, item.width).join(' ');
    const out = await render(section);
    const fresh = out && [...out.querySelectorAll(`.${item.name}.block`)][item.nth];
    if (!fresh) return false;
    const oldWrap = item.el.closest(`.${item.name}-wrapper`) || item.el;
    const newWrap = fresh.closest(`.${item.name}-wrapper`) || fresh;
    oldWrap.replaceWith(newWrap);
    item.el = fresh;
    if (item.name === 'page-nav') {
      fresh.closest('.section')?.classList.toggle('sticky-nav-container', item.variant === 'sticky');
    }
    changed();
    return true;
  }

  const find = (id) => items.find((i) => i.id === id);
  window.stdReview = {
    list: () => items.map(({ el, ...rest }) => ({
      ...rest, hidden: !el.getClientRects().length, label: el.dataset.blockName,
    })),
    async set(id, { variant, width } = {}) {
      const item = find(id);
      if (!item) return false;
      if (variant !== undefined && item.list.includes(variant)) item.variant = variant;
      if (width !== undefined && item.widths.includes(width)) item.width = width;
      return apply(item);
    },
    setBackground(id, background) {
      const item = find(id);
      if (!item || (background && !BG.includes(background))) return false;
      const section = item.el.closest('main > .section');
      if (!section) return false;
      section.classList.remove(...BG);
      if (background) section.classList.add(background);
      items.filter((i) => i.si === item.si).forEach((i) => { i.background = background; });
      changed();
      return true;
    },
    highlight(id, on) {
      find(id)?.el.classList.toggle('rv-hl', on);
    },
    reveal(id) {
      const el = find(id)?.el;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' });
    },
    backgrounds: ['', ...BG],
    /** rendered blocks not on the page's own document (fragments) or built by the page */
    others: () => rendered
      .filter((r) => !items.some((i) => i.el === r) && r.isConnected)
      .map((r) => ({
        name: r.dataset.blockName,
        where: r.closest('.fragment, .fragment-wrapper') || !r.closest('main > .section') ? 'fragment' : 'built',
      })),
  };
  document.dispatchEvent(new CustomEvent('std-review-ready'));
}
