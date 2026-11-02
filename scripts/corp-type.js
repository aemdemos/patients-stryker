/*
 * Inline text sizes and fonts on www.stryker.com pages: lift and shift of the source's span
 * classes where the section styles cannot carry them (text in its own size or font inside a
 * paragraph, a line in a vw size, a cell next to differently set copy). The importer writes
 * them as bracket tags (tools/importer/corp-richtext.js finishRuns); scripts/span-tags.js has
 * made them spans:
 *   - size-<n>vw (size-2vw, size-2-5vw): the source .fontsize-<n>vw classes — 2 × <n>vw below
 *     600px (source 840px), from 600px <n>vw up to <n> × 14px (the source's fixed size from
 *     1439px); styles/styles-corp.css span.corp-vw
 *   - size-<n>em (size-1-75em, size-2-19em): <n> × the base copy (14px) in copy, <n> × the
 *     heading's size in a heading (the source's nested .fontsize-<x>em classes, multiplied),
 *     <n> × the source h1 (28px) in an h1
 *   - serif: Egyptienne copy (source span.urw-egyptienne), styles-corp.css span.serif
 */

const SIZE = /^size-(\d+)(?:-(\d+))?(em|vw)$/;

/* line heights of the source's .fontsize-<n>em classes (stryker.com base.min.css); a size the
   source has no class for keeps the paragraph's */
const LINE_HEIGHTS = {
  1: 'var(--body-line-height)', 1.25: '1.15', 1.5: '1.06', 1.75: '1.06', 2: '1.06', 2.5: '1.06',
};

/**
 * Gives the size tags of a container (main, or a fragment) their size.
 * @param {Element} main The container
 */
export default function decorateTypeTags(main) {
  main.querySelectorAll('span[class*="size-"]').forEach((span) => {
    [...span.classList].forEach((cls) => {
      const m = cls.match(SIZE);
      if (!m) return;
      const value = Number(`${m[1]}.${m[2] || 0}`);
      // an em run inside a superscript is em of the superscript on the source, so it keeps
      // the superscript's 75% (bone-cements citations 13.1px after 17.5px copy); em sizes in a
      // heading are relative and already get it. A vw size is absolute, also in a superscript
      // (inbone ® 21px: span.fontsize-1-5-vw inside the sup)
      const inSup = !!span.closest('sup, sub');
      if (m[3] === 'vw') {
        span.style.setProperty('--corp-vw', value);
        span.classList.add('corp-vw');
      } else if (span.closest('h1') && !span.parentElement.closest('[class*="size-"]')) {
        // an h1's run: × the source h1 (28px), whatever the h1's own size here (a Columns cell
        // sets its h1s to the Large Headline scale, 56px: broadway-system "Broadway® System"
        // came out 112px); in a superscript × its 0.75 (the ® 42px)
        const sup = inSup ? ' * 0.75' : '';
        span.style.fontSize = `calc(${value} * var(--heading-font-size-xxl)${sup})`;
      } else if (span.closest('h1, h2, h3, h4, h5, h6')) {
        span.style.fontSize = `${value}em`;
      } else {
        span.style.fontSize = `calc(${value} * var(--body-font-size-m)${inSup ? ' * 0.75' : ''})`;
        if (LINE_HEIGHTS[value]) span.style.lineHeight = LINE_HEIGHTS[value];
      }
    });
  });
}
