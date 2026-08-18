/**
 * Parse a width-ratio class into a CSS grid-template-columns value in fr units.
 * The class is a named variant chosen from the UE dropdown — hyphen-separated
 * proportions with an optional "columns-" prefix, e.g. "columns-70-30" or
 * "columns-1-1-1". The prefix keeps the class a valid CSS selector (a class cannot
 * start with a digit), so each ratio is targetable for per-ratio overrides while
 * the widths themselves are derived here. Ratios are relative (need not sum to 100)
 * and any column count works. Returns null for anything that isn't all
 * hyphen-separated positive numbers, so non-ratio classes are ignored.
 * @param {string} token The class token to test (e.g. "columns-70-30")
 * @returns {string|null} e.g. "70fr 30fr", or null
 */
function parseRatio(token) {
  const parts = token.replace(/^columns-/, '').split('-');
  if (parts.length < 2) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return nums.map((n) => `${n}fr`).join(' ');
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Custom width ratio: the author types hyphen-separated proportions as the block
  // variant (stored in the block name via the UE "Column widths" field), which EDS
  // turns into a class. Find that class, convert it to fr units, and expose it as
  // --columns-ratio for the desktop grid rule in columns.css.
  const ratioClass = [...block.classList].find((c) => parseRatio(c));
  if (ratioClass) {
    block.style.setProperty('--columns-ratio', parseRatio(ratioClass));
    block.classList.add('columns-custom-ratio');
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('p') || pic.parentElement;
        if (picWrapper && picWrapper.children.length === 1 && picWrapper.textContent.trim() === '') {
          // picture is the only content of its own wrapper (a <p> or a <div>),
          // whether or not that wrapper has heading/text siblings elsewhere in the column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
