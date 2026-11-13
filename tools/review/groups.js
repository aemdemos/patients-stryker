/*
 * Review tool: the variants an authored block's content fits, and its group ("blocks like this":
 * the choice for one block can be made for all of them). Shared by frame.js (the page) and
 * build-groups.mjs (the counts of every group over the standard pages). DOM only.
 * Group: block type + its standard variant + for Columns its content shape (the cell kinds of its
 * first row; more rows flagged), the things that decide which variants fit.
 */
import {
  VARIANTS, CARD_VARIANTS, HERO_VARIANTS, TEXT_SETS, cellKind,
} from '../importer/standardise/rules/variants.js';

/** the variants an authored block's content fits, its own variant first; widths for two cells */
export function variantsOf(block) {
  const name = block.classList[0];
  const cls = [...block.classList].slice(1);
  if (name === 'columns') {
    const cells = [...block.children].flatMap((r) => [...r.children]).filter((c) => cellKind(c) !== 'empty');
    const kinds = cells.map(cellKind);
    const media = kinds.some((k) => k !== 'text');
    const text = kinds.some((k) => k !== 'media');
    const current = cls.find((c) => VARIANTS[c]) || 'text-columns';
    if (current === 'page-intro') return { list: ['page-intro'], widths: [] };
    const fits = Object.keys(VARIANTS).filter((v) => {
      if (v === 'page-intro') return false;
      if (v === 'image-row') return media && !text;
      if (v === 'text-columns') return text && !media;
      if (v === 'media-text') return cells.length === 2 && media && text;
      if (v === 'feature-statement') return media && text;
      if (v === 'card-grid') return cells.length >= 2 && media;
      return true;
    });
    const list = [current, ...fits.filter((v) => v !== current)];
    return { list, widths: cells.length === 2 ? ['', 'wide-first', 'wide-last'] : [] };
  }
  const firstOf = (all, fallback) => {
    const current = cls.find((c) => all[c]) || fallback;
    return { list: [current, ...Object.keys(all).filter((v) => v !== current)], widths: [] };
  };
  if (name === 'cards-corp') return firstOf(CARD_VARIANTS, 'teaser');
  if (name === 'hero-corp') return firstOf(HERO_VARIANTS, 'banner');
  if (name === 'video') return { list: cls.includes('autoplay') ? ['autoplay', ''] : ['', 'autoplay'], widths: [] };
  if (name === 'page-nav' && !cls.includes('local')) {
    return { list: cls.includes('sticky') ? ['sticky', ''] : ['', 'sticky'], widths: [] };
  }
  return { list: [], widths: [] };
}

const KIND = {
  media: 'image', text: 'text', 'media+text': 'image & text',
};

/** a Columns block's shape: the kinds of its first row's filled cells, more rows flagged */
function shapeOf(block) {
  const rows = [...block.children]
    .map((r) => [...r.children].map(cellKind).filter((k) => k !== 'empty'))
    .filter((r) => r.length);
  if (!rows.length) return 'empty';
  return `${rows[0].join(',')}${rows.length > 1 ? '/more' : ''}`;
}

/** the group of an authored block (null when it has no other variant) */
export function groupKey(block) {
  const name = block.classList[0];
  const { list } = variantsOf(block);
  if (list.length < 2) return null;
  const standard = list[0] || 'default';
  return name === 'columns' ? `columns|${standard}|${shapeOf(block)}` : `${name}|${standard}`;
}

/** the group of an authored section with text of its own (its standard text set), else null */
export function sectionGroupKey(section) {
  const loose = [...section.children].filter((c) => !c.matches('div[class]') && c.textContent.trim().length > 8);
  if (!loose.length) return null;
  const row = [...section.querySelectorAll(':scope > .section-metadata > div')]
    .find((r) => r.firstElementChild?.textContent.trim() === 'style');
  const styles = row ? row.lastElementChild.textContent.split(',').map((x) => x.trim()) : [];
  const set = Object.keys(TEXT_SETS).filter(Boolean).find((k) => styles.includes(k)) || 'default';
  return `section|${set}`;
}

/** a group in plain words, e.g. "Columns now media text, image | text" */
export function groupLabel(key) {
  const [name, standard, shape] = key.split('|');
  if (name === 'section') {
    return `Text sections now ${(TEXT_SETS[standard === 'default' ? '' : standard] || standard).replace(/ \(.*\)$/, '').toLowerCase()}`;
  }
  const names = {
    columns: 'Columns', 'cards-corp': 'Cards', 'hero-corp': 'Hero', video: 'Video', 'page-nav': 'Page Nav',
  };
  const design = standard === 'default' ? 'default' : standard.replace(/-/g, ' ');
  if (!shape) return `${names[name] || name} now ${design}`;
  const [first, more] = shape.split('/');
  const cells = first.split(',').map((k) => KIND[k] || k).join(' | ');
  return `${names[name] || name} now ${design}, ${cells}${more ? ', several rows' : ''}`;
}
