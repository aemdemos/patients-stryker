/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `statistics` block, count-up + cols-2 (bvn-ablation singleton).
 * Source: .cols2:has(.numbercounter) — two animated number counters, each above
 * a rich-text caption.
 *
 * The counter's number is NOT in the markup: `.numbercounter-number` is empty
 * until the source's JS animates it. The target value lives in
 * `data-numbercounter-end-number`; the colour is the span's inline rgb.
 *
 * Target authored table (3 cells per row), header "Statistics (count-up, cols-2)":
 *   | <color keyword> | <value, e.g. 72%> | <caption> |
 * matching blocks/statistics (keyword cell is consumed during decoration).
 */

// Source inline rgb → statistics block colour keyword (see COLOR_CLASSES in
// blocks/statistics/statistics.js). Unknown colours fall back to the block default.
const RGB_TO_KEYWORD = {
  '255,181,0': 'gold', // --color-accent #ffb500
  '76,125,122': 'teal', // --color-primary #4c7d7a
};

function colorKeyword(counter) {
  const span = counter.querySelector('.numbercounter-number[style]');
  const m = span && span.getAttribute('style').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  return (m && RGB_TO_KEYWORD[`${m[1]},${m[2]},${m[3]}`]) || 'teal';
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.row > [class*="col-"]').forEach((col) => {
    const counter = col.querySelector('[data-numbercounter-end-number]');
    const caption = col.querySelector('.c-rich-text-editor p');
    if (!counter || !caption) return;

    const end = counter.getAttribute('data-numbercounter-end-number').trim();
    // number-type 3 renders as a percentage on the source; the caption repeats
    // the figure ("72% of patients…"), so prefer the caption's own suffix.
    const lead = caption.textContent.trim().match(new RegExp(`^${end}(\\S?)`));
    const suffix = (lead && lead[1] === '%') || counter.getAttribute('data-numbercounter-number-type') === '3' ? '%' : '';

    cells.push([colorKeyword(counter), `${end}${suffix}`, caption]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Statistics (count-up, cols-2)', cells });
  element.replaceWith(block);
}
