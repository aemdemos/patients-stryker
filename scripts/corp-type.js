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
 *     heading's size in a heading (the source's nested .fontsize-<x>em classes, multiplied)
 *   - serif: Egyptienne copy (source span.urw-egyptienne), styles-corp.css span.serif
 */

const SIZE = /^size-(\d+)(?:-(\d+))?(em|vw)$/;

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
      if (m[3] === 'vw') {
        span.style.setProperty('--corp-vw', value);
        span.classList.add('corp-vw');
      } else if (span.closest('h1, h2, h3, h4, h5, h6')) {
        span.style.fontSize = `${value}em`;
      } else {
        span.style.fontSize = `calc(${value} * var(--body-font-size-m))`;
      }
    });
  });
}
