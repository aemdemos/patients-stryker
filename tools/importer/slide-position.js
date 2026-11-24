/*
 * stryker.com slide headline position → the named hero-corp image-slide options.
 *
 * On stryker.com authors type the headline position freely (slide dialog: marginLeft,
 * marginRight, verticalMargin in % of the slide); 478 slides use 189 combinations. They fall
 * into three columns and four heights, which hero-corp offers as named options (values in
 * blocks/hero-corp/hero-corp.css):
 *   side    text-left (L6 R50), text-right (L55 R5), text-wide (L5 R5)
 *   height  text-top (5), text-upper (18), text-middle (30), text-lower (45)
 * Each slide takes the nearest of each. `shift` is the largest move in percentage points, so
 * an import can list the slides that move noticeably (above 10 points) for a visual check.
 */

export const SLIDE_SIDES = { 'text-left': [6, 50], 'text-right': [55, 5], 'text-wide': [5, 5] };
export const SLIDE_HEIGHTS = {
  'text-top': 5, 'text-upper': 18, 'text-middle': 30, 'text-lower': 45,
};

/**
 * @param {number|null} left the source margin-left in %
 * @param {number|null} right the source right inset in %
 * @param {number|null} top the source top in %
 * @returns {{options: string[], shift: number}} the hero-corp options and the largest move
 */
export function slidePosition(left, right, top) {
  const options = [];
  let shift = 0;
  if (left !== null && right !== null) {
    const [side, [l, r]] = Object.entries(SLIDE_SIDES)
      .map((entry) => [entry, Math.abs(entry[1][0] - left) + Math.abs(entry[1][1] - right)])
      .sort((a, b) => a[1] - b[1])[0][0];
    options.push(side);
    shift = Math.max(shift, Math.abs(l - left), Math.abs(r - right));
  }
  if (top !== null) {
    const [height, t] = Object.entries(SLIDE_HEIGHTS)
      .sort((a, b) => Math.abs(a[1] - top) - Math.abs(b[1] - top))[0];
    options.push(height);
    shift = Math.max(shift, Math.abs(t - top));
  }
  return { options, shift };
}
