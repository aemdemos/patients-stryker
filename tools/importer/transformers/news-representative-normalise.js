/**
 * Pages normalised to a representative article (news-detail import): the article text of
 * each listed source page is rewritten to the markup of its representative page before the
 * news-detail sections transformer reads it, so every page in the group imports with the
 * representative's headings, fonts and sizes whatever its source authors typed.
 *
 * Group "sustainability news" — representative
 * https://www.stryker.com/us/en/sustainability/news/Supplychainweek.html:
 *   - body copy: <p><span class="fontsize-1-25em">…</span></p> (Humanist 17.5px), so copy
 *     typed as Heading 3 (h3 > span.fontsize-8em, Egyptienne 16.8px) or in the serif
 *     (span.urw-egyptienne) becomes body copy
 *   - subheads: <h4><br>Subhead</h4> (Futura bold 17.5px, a blank line above), so a Heading 3
 *     subhead, a paragraph that is all bold / span.futura-bold, or a Heading 4 in another
 *     size becomes that Heading 4
 * Content outside the article (shared Experience Fragments, forms, small print without a
 * size span) is left as it is.
 */

const GROUPS = [
  {
    name: 'sustainability-news',
    paths: [
      '/us/en/sustainability/news/supplychainweek.html',
      '/us/en/sustainability/news/asc.html',
      '/us/en/sustainability/news/ep.html',
      '/us/en/sustainability/news/expectmore.html',
      '/us/en/sustainability/news/leader.html',
      '/us/en/sustainability/news/lca0.html',
      '/us/en/sustainability/news/say-yes-to-reprocessing.html',
      '/us/en/sustainability/news/quality-you-can-count-on--five-quality-standards-in-medical-devi.html',
    ],
  },
];

// a subhead is a short line; longer bold text stays copy
const SUBHEAD_MAX = 160;
const squash = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

/** Unwraps the size and font spans (not inside a superscript, which keeps its own size). */
function unwrapFontSpans(el) {
  el.querySelectorAll('span[class*="fontsize-"], span.urw-egyptienne, span.futura-bold, span.futura, span.humanist').forEach((span) => {
    if (span.closest('sup')) return;
    span.replaceWith(...span.childNodes);
  });
}

/** The text of a heading-like element as the representative's <h4><br>Subhead</h4>. */
function toSubhead(el, doc) {
  const h4 = doc.createElement('h4');
  h4.append(doc.createElement('br'), squash(el));
  el.replaceWith(h4);
  return h4;
}

/** The copy of an element as the representative's <p><span class="fontsize-1-25em">…</span></p>. */
function toCopy(el, doc) {
  unwrapFontSpans(el);
  // leading / trailing line breaks are typed spacing, not copy
  const trim = (pick) => {
    for (let n = pick(); n && ((n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'BR'); n = pick()) n.remove();
  };
  trim(() => el.firstChild);
  trim(() => el.lastChild);
  // a numbered point typed with a run of spaces after its number ("1.&nbsp;&nbsp;&nbsp; Waste
  // Reduction…", LCA0) keeps one space: a run would read as a list item holding code
  const lead = el.firstChild;
  if (lead && lead.nodeType === 3) lead.textContent = lead.textContent.replace(/^(\s*\d+\.)[\s\u00a0]+/, '$1 ');
  const p = doc.createElement('p');
  const span = doc.createElement('span');
  span.className = 'fontsize-1-25em';
  span.append(...el.childNodes);
  p.append(span);
  el.replaceWith(p);
  return p;
}

/** A paragraph whose text is all bold (b / strong / span.futura-bold): a typed subhead. */
function isBoldLine(p) {
  const text = squash(p);
  if (!text || text.length > SUBHEAD_MAX || p.querySelector('a, img, picture')) return false;
  const bold = [...p.querySelectorAll('b, strong, span.futura-bold')]
    .filter((b) => !b.parentElement.closest('b, strong, span.futura-bold'))
    .map(squash)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return bold === text;
}

/** Rewrites one source rich text to the representative's markup. */
function normaliseRichText(rte, doc) {
  const box = rte.querySelector(':scope > div') || rte;
  [...box.children].forEach((el) => {
    const text = squash(el);
    if (!text) return;
    if (el.tagName === 'H3') {
      // copy typed as a Heading 3 (it carries a size span: span.fontsize-8em) or a subhead
      if (el.querySelector('span[class*="fontsize-8em"]') || text.length > SUBHEAD_MAX) toCopy(el, doc);
      else toSubhead(el, doc);
    } else if (el.tagName === 'H4') {
      toSubhead(el, doc);
    } else if (el.tagName === 'P' && isBoldLine(el)) {
      toSubhead(el, doc);
    } else if (el.tagName === 'P' && el.querySelector('span[class*="fontsize-1-25em"], span.urw-egyptienne')) {
      toCopy(el, doc);
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const url = (payload.params && payload.params.originalURL) || payload.url || '';
  let path = '';
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch (e) {
    return;
  }
  const group = GROUPS.find((g) => g.paths.includes(path));
  if (!group) return;
  const doc = element.ownerDocument;
  element.querySelectorAll('.c-rich-text-editor').forEach((rte) => {
    // shared Experience Fragments (the contact header / form) and forms keep their markup
    if (rte.closest('.experiencefragment, form, header, footer, .c-disclaimer')) return;
    normaliseRichText(rte, doc);
  });
}
