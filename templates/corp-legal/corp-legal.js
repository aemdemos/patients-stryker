/*
 * corp-legal — corp legal, governance and policy pages (`template: corp-legal`); styled by
 * corp-legal.css, scripts/corp.js still loads this file.
 */
// A line of bold + underline links split by `|` separators (icrc "CHINESE | 中国 | 中國") is not
// a standalone link for decorateButtons(), so its links stay inline. Each gets the arrow link look.
export default function decorate(doc) {
  doc.querySelectorAll('main .columns p').forEach((p) => {
    const links = [...p.querySelectorAll('strong > a.link-inline:has(u)')];
    if (links.length < 2) return;
    const rest = [...p.childNodes].filter((n) => !links.some((a) => n.contains(a)))
      .map((n) => n.textContent).join('');
    if (!/^[\p{L}\s|]+$/u.test(rest) || !rest.includes('|')) return;
    links.forEach((a) => {
      a.classList.replace('link-inline', 'link-strong');
      a.querySelector('u').replaceWith(...a.querySelector('u').childNodes);
      a.parentElement.replaceWith(a);
    });
  });
}
