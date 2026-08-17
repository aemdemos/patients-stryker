/**
 * Parse an author-supplied width-ratio class (e.g. "60-40" or "20-50-30") into a
 * CSS grid-template-columns value in fr units. Ratios are relative — they need not
 * sum to 100 — and any column count is supported. Returns null if the class isn't a
 * valid ratio (all hyphen-separated positive numbers), so bad input falls back to
 * the default even columns rather than breaking the layout.
 * @param {string} token The class token to test (e.g. "60-40")
 * @returns {string|null} e.g. "60fr 40fr", or null
 */
function parseRatio(token) {
  const parts = token.split('-');
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
