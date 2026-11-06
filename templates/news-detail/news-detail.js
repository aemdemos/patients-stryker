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
 * Shows the `first-published` date as an H5 in the title section: after the H1 (before it
 * in a `date-above` section: the source page has no title component and its title opens
 * the article text, e.g. the Spencer Stiles release), before an authored location line
 * (H5), or — on pages without a title section (the title is a Large Headline or a hero) —
 * in a title section of its own at the top of the page.
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
    lead[first.classList.contains('date-above') ? 'before' : 'after'](h5);
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
 * A bold link alone on its line in a `bold-body` section is bold text, not a button: the
 * older press releases end with "Read the full article:" and a plain bold link on its own
 * line (stryker.com <b><a>, e.g. "PR Newswire" on the fifth K9s for Warriors donation).
 * scripts.js decorateButtons() made it a teal button; put it back in its <strong>, which
 * styles-corp.css shows as bold teal text in the paragraph's font. A bold link in a
 * colour tag ([[color-teal]**[BACK](…)**], stryker.com <a><span class="futura-bold">, e.g.
 * the BACK link that ends the SPS blog posts) is put back the same way, in its tag;
 * news-detail.css shows it as Futura bold text in the tag's colour.
 * @param {Document} doc The document
 */
function decorateBoldBodyLinks(doc) {
  const wrapper = 'main > .section.bold-body > .default-content-wrapper > p.button-wrapper';
  doc.querySelectorAll(`${wrapper} > a.button.primary, ${wrapper} > span[class*="color-"] > a.button.primary`).forEach((a) => {
    const strong = doc.createElement('strong');
    const p = a.closest('p');
    p.classList.remove('button-wrapper');
    if (!p.classList.length) p.removeAttribute('class');
    a.classList.remove('button', 'primary');
    if (!a.classList.length) a.removeAttribute('class');
    a.replaceWith(strong);
    strong.append(a);
  });
}

/**
 * On `news-video` pages the video row's player takes the shape of its Scene7 video, as
 * the stryker.com viewer does (e.g. the 3:2 StrykerTalks ENT episode: 910 x 607px at
 * 1440px); news-detail-themes.css frames it 16:9 until the shape is known. Scene7's set
 * response for the adaptive video (`…/is/image/<asset>?req=set,json`) lists its
 * renditions with their size. The video's URL is the player's data-src (scripts/
 * dm-support.js), or the authored link if the player isn't built yet; the shape is set as
 * --news-video-aspect on the section.
 * @param {Document} doc The document
 */
function sizeNewsVideos(doc) {
  if (!doc.body.classList.contains('news-video')) return;
  doc.querySelectorAll('main > .section.video-text').forEach((section) => {
    const src = section.querySelector('video[data-src]')?.dataset.src
      || section.querySelector('a[href*="/is/content/"]')?.href;
    const asset = src?.match(/^(https:\/\/[^/]+)\/is\/content\/([^?#]+?)\.(?:m3u8|mpd)(?:[?#]|$)/);
    if (!asset) return;
    fetch(`${asset[1]}/is/image/${asset[2]}?req=set,json`)
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        // JSONP: s7jsonResponse({…},"")
        const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const items = [JSON.parse(json).set?.item].flat();
        const video = items.find((item) => Number(item?.v?.dx) && Number(item?.v?.dy))?.v;
        if (video) section.style.setProperty('--news-video-aspect', `${video.dx} / ${video.dy}`);
      })
      .catch(() => {
        // no set response: the player keeps its 16:9 frame
      });
  });
}

/**
 * Bold text in a news article keeps the body font when it sits in a sentence, but bold
 * text on a line of its own stays Futura bold: a paragraph or list item that is bold as a
 * whole ("References:"), or a label on its own line before a line break ("About AVS",
 * "Media contact"). Marks those standalone <strong> elements so news-detail.css can tell
 * them apart; CSS alone can't, as it ignores the text around an element.
 * @param {Document} doc The document
 */
function markStandaloneBold(doc) {
  doc.querySelectorAll('main .default-content-wrapper :is(p, li) > strong:not(.standalone)').forEach((strong) => {
    if (!lineText(strong, 'previousSibling') && !lineText(strong, 'nextSibling')) {
      strong.classList.add('standalone');
    }
  });
}

export default function decorate(doc) {
  decorateFirstPublished(doc);
  decorateBoldBodyLinks(doc);
  sizeNewsVideos(doc);
  markStandaloneBold(doc);

  // content that arrives after the template ran (the sections of a Fragment block, e.g.
  // the article body of "Technology helps improve colonoscopy…") gets the same bold
  // handling once it is in the page
  const main = doc.querySelector('main');
  if (!main) return;
  new MutationObserver((mutations) => {
    const content = mutations.some((mutation) => [...mutation.addedNodes]
      .some((node) => node.nodeType === Node.ELEMENT_NODE
        && (node.matches('.default-content-wrapper') || node.querySelector('.default-content-wrapper'))));
    if (!content) return;
    decorateBoldBodyLinks(doc);
    markStandaloneBold(doc);
  }).observe(main, { childList: true, subtree: true });
}
