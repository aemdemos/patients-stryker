/*
 * news-detail — corp news article template (`template: news-detail`); called with the
 * document by scripts/corp.js loadTemplate, after the main content is decorated.
 */

/**
 * The siblings of a node up to the next line break (<br>) or the end of its parent.
 * @param {Node} node The starting node
 * @param {'previousSibling'|'nextSibling'} direction Where to walk
 * @returns {string} The text on that side of the node, on the same line
 */
function lineText(node, direction) {
  let text = '';
  let sibling = node[direction];
  while (sibling && sibling.nodeName !== 'BR') {
    text += sibling.textContent;
    sibling = sibling[direction];
  }
  return text.trim();
}

/**
 * The `first-published` metadata as the date line below the title shows it ("05-Mar-2018").
 * Accepts "YYYY-MM-DD" or an already formatted "DD-Mon-YYYY"; '' when absent/invalid.
 * @returns {string} The formatted date
 */
function firstPublished() {
  const meta = document.querySelector('meta[name="first-published"]');
  const raw = (meta?.content || '').trim();
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return '';
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${String(date.getUTCDate()).padStart(2, '0')}-${month}-${date.getUTCFullYear()}`;
}

/**
 * Shows the `first-published` date as an H5 in the title section: after the H1, before an
 * authored location line (H5), or — on pages without a title section (the title is a
 * Large Headline or a hero) — in a title section of its own at the top of the page.
 * Runs before the first section is shown (scripts/corp.js loadTemplate), so it does not
 * shift the layout.
 * @param {Document} doc The document
 */
function decorateFirstPublished(doc) {
  const value = firstPublished();
  const main = doc.querySelector('main');
  if (!value || !main) return;
  const h5 = doc.createElement('h5');
  h5.className = 'first-published';
  h5.textContent = value;

  const first = main.querySelector(':scope > .section');
  const content = first?.querySelector(':scope > .default-content-wrapper');
  const lead = content?.firstElementChild;
  if (lead?.tagName === 'H1') {
    lead.after(h5);
  } else if (lead?.tagName === 'H5') {
    lead.before(h5);
  } else {
    const section = doc.createElement('div');
    section.className = 'section';
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';
    const wrapper = doc.createElement('div');
    wrapper.className = 'default-content-wrapper';
    wrapper.append(h5);
    section.append(wrapper);
    main.prepend(section);
  }
}

/**
 * Bold text in a news article keeps the body font when it sits in a sentence, but bold
 * text on a line of its own stays Futura bold: a paragraph or list item that is bold as a
 * whole ("References:"), or a label on its own line before a line break ("About AVS",
 * "Media contact"). Marks those standalone <strong> elements so news-detail.css can tell
 * them apart; CSS alone can't, as it ignores the text around an element.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  decorateFirstPublished(doc);
  doc.querySelectorAll('main .default-content-wrapper :is(p, li) > strong').forEach((strong) => {
    if (!lineText(strong, 'previousSibling') && !lineText(strong, 'nextSibling')) {
      strong.classList.add('standalone');
    }
  });
}
