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
 * size span) is left as it is. The group's pages get the theme `mix-width, sustainability`
 * (the theme carries the copy / subhead sizes and the footnote list), so the sections
 * transformer drops their size section styles and writes the footnotes as a numbered list.
 */

const GROUPS = [
  {
    name: 'sustainability-news',
    // the group's page theme (templates/news-detail/news-detail-themes.css): it sets the
    // copy / subhead sizes and the footnote list, so the pages carry no size section styles
    // (news-detail-sections.js reads data-representative-theme)
    theme: 'mix-width, sustainability',
    paths: [
      '/us/en/sustainability/news/supplychainweek.html',
      '/us/en/sustainability/news/asc.html',
      '/us/en/sustainability/news/ep.html',
      '/us/en/sustainability/news/expectmore.html',
      '/us/en/sustainability/news/leader.html',
      '/us/en/sustainability/news/lca0.html',
      '/us/en/sustainability/news/say-yes-to-reprocessing.html',
      '/us/en/sustainability/news/quality-you-can-count-on--five-quality-standards-in-medical-devi.html',
      '/us/en/sustainability/news/world-environment-day-2025-.html',
    ],
  },
  {
    // news releases on the `basic` theme, representative "Stryker expands Mako robotics
    // portfolio with full market release of Mako RPS" (/us/en/about/news/2026/stryker-expands-
    // mako-robotics-portfolio): only the theme here, no text rewrite; news-basic-pages.js gives
    // them the representative's markup (rules: 'basic') and each page's reviewed DA corrections.
    // The serif subtitle's size style goes (the theme's italic Heading 4), and the text split
    // off one source component (`join`) is one section again
    name: 'basic',
    theme: 'basic',
    rewrite: false,
    rules: 'basic',
    sizes: ['serif'],
    mergeJoined: true,
    paths: [
      '/us/en/about/news/2020/stryker-launches-industry-s-first-completely-wireless-hospital-b.html',
      '/us/en/about/news/2020/stryker-s-neuroform-atlas--stent-system-granted-an-expanded-indi.html',
      '/us/en/about/news/2022/john-collings-named-chair-of-asia-pacific-medical-technology-ass.html',
      '/us/en/about/news/2022/stryker-announces-definitive-agreement-to-acquire-vocera-communi.html',
      '/us/en/about/news/2022/stryker-earns-100-percent-on-hrc-equality-index.html',
      '/us/en/about/news/2022/stryker-fulfills-carbon-reduction-goal-early--commits-to-100--re.html',
      '/us/en/about/news/2022/stryker-launches-new-gamma4-hip-fracture-nailing-system.html',
      '/us/en/about/news/2022/stryker-launches-q-guidance-system-with-spine-guidance-software.html',
      '/us/en/about/news/2022/stryker-launches-the-connected-power-pro-2-powered-ambulance-cot.html',
      '/us/en/about/news/2022/stryker-strengthens-its-r-d-capabilities-with-advanced-global-te.html',
      '/us/en/about/news/2023/a-clearer-vision-of-surgery-stryker-releases-its-next-generation-of-advanced-surgical-cameras.html',
      '/us/en/about/news/2023/cd-nxt-power-tool-system-empowers-surgeons-through-real-time-dep.html',
      '/us/en/about/news/2023/cerus-endovascular.html',
      '/us/en/about/news/2023/stryker-awarded-transparency-partner-distinction-by-the-healthca.html',
      '/us/en/about/news/2023/stryker-celebrates-wind-power-milestone-on-our-way-to-become-carbon-neutral.html',
      '/us/en/about/news/2023/stryker-launches-prostep--mis-lapidus--a-new-minimally-invasive-.html',
      '/us/en/about/news/2023/stryker-receives-the-don-clifton-strengths-based-culture-award.html',
      '/us/en/about/news/2024/new-intermediate-nail-and-rc-lag-screw-expand-gamma4-portfolio-to-meet-the-needs-of-surgeons-and-their-patients.html',
      '/us/en/about/news/2024/stryker-announces-definitive-agreement-to-acquire-vertos-medical.html',
      '/us/en/about/news/2024/stryker-announces-launch-of-pangea-plating-system.html',
      '/us/en/about/news/2024/stryker-receives-don-clifton-strengths-based-culture-award-for-f.html',
      '/us/en/about/news/2024/stryker-unveils-oculan-lighting-platform.html',
      '/us/en/about/news/2025/inari-medical-stryker-launches-all-new-inthrill-thrombectomy-system.html',
      '/us/en/about/news/2025/stryker-launches-steri-shield-8-personal-protection-system.html',
      '/us/en/about/news/2025/stryker-launches-surpass-elite-flow-diverter.html',
      '/us/en/about/news/2025/stryker-launches-sync-badge.html',
      '/us/en/about/news/2025/stryker-names-spencer-stiles-president-and-chief-operating-officer.html',
      '/us/en/about/news/2025/stryker-receives-fda-clearance-for-optablate-bvn-ablation-system.html',
      '/us/en/about/news/2025/stryker-unveils-new-intracranial-base-catheter.html',
      '/us/en/about/news/2026/avs-now-part-of-stryker-enrolls-first-patient-in-first-in-human-coronary-intravascular-lithotripsy-study.html',
      '/us/en/about/news/2026/stryker-cmr-surgical-announce-strategic-alliance-advance-robotic-assisted-surgery.html',
      '/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio.html',
      '/us/en/about/news/2026/stryker-launches-synchfix-evt-expanding-options-for-flexible-syndesmotic-fixation.html',
      '/us/en/about/news/2026/stryker-launches-t2-alpha-humerus-nailing-system.html',
      '/us/en/about/news/2026/stryker-partners-professional-golfer-shane-lowry-caregiver-journey.html',
      '/us/en/about/news/2026/stryker-showcases-continued-innovation-across-orthopaedics-at-aaos-2026-annual-meeting.html',
      '/us/en/about/news/2026/stryker-signs-definitive-agreement-to-acquire-zurimed-to-enhance.html',
    ],
  },
  {
    // the `full-width, basic` theme pair (copy, H1 and serif H2 sizes from the pair): only the
    // theme, no text rewrite; news-basic-pages.js gives each page its reviewed DA corrections
    name: 'full-width-basic',
    theme: 'full-width, basic',
    rewrite: false,
    rules: 'basic',
    // the pages keep their section styles and footnotes as authored
    keepStyles: true,
    paths: [
      '/us/en/sage/news/2026/perioperative-care-air-assisted-patient-transfer-system.html',
      '/us/en/emergency-care/news/2024/aed-buying-guide.html',
      '/us/en/emergency-care/news/2024/ems-powered-products.html',
    ],
  },
  {
    // a feature with several patient-story video rows, its title, intro and story headings
    // and copy set by the multiple-video theme (measured on "When Stryker employees and their
    // family members become patients"); the video rows keep the news-video-quote structure.
    // Only the theme: the source text is not rewritten. The size and serif section styles
    // the theme replaces go, and the text split off one source component (`join`) is one
    // section again
    name: 'multiple-video',
    theme: 'full-width, news-video-quote, multiple-video',
    rewrite: false,
    sizes: ['h1-1-25', 'h2-1-5', 'serif'],
    mergeJoined: true,
    paths: [
      '/us/en/about/news/2023/features/when-stryker-employees-and-their-family-members-become-patients.html',
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

/**
 * The text of a heading-like element as the representative's <h4><br>Subhead</h4>: its
 * font / size spans, bold and line breaks go, its inline content stays (a footnote
 * superscript, e.g. "Saving the environment yields big savings for hospitals²" in the World
 * Environment Day 2025 article, or a link)
 */
function toSubhead(el, doc) {
  const h4 = doc.createElement('h4');
  unwrapFontSpans(el);
  el.querySelectorAll('b, strong').forEach((b) => b.replaceWith(...b.childNodes));
  el.querySelectorAll('br').forEach((br) => br.remove());
  // a superscript is kept as a footnote marker only (digits, commas, * † ‡); words in one
  // are a typing slip (e.g. the whole "Strong focus on sustainability" subhead of Expect more)
  el.querySelectorAll('sup').forEach((sup) => {
    if (!/^[\s\d,*†‡-]*$/.test(sup.textContent)) sup.replaceWith(...sup.childNodes);
  });
  el.normalize();
  // runs of spaces (typed &nbsp;) are one space; none at either end
  const texts = [];
  const walker = doc.createTreeWalker(el, 4);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
  texts.forEach((n) => { n.textContent = n.textContent.replace(/[\s\u00a0]+/g, ' '); });
  if (texts.length) {
    texts[0].textContent = texts[0].textContent.replace(/^ /, '');
    texts[texts.length - 1].textContent = texts[texts.length - 1].textContent.replace(/ $/, '');
  }
  h4.append(doc.createElement('br'), ...el.childNodes);
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
  // a page listed in a group gets that group; otherwise the import script's template can name
  // the group for all its pages (import-text-only.js: `newsGroup: 'basic'`)
  const fallback = payload.template && payload.template.newsGroup;
  const group = GROUPS.find((g) => g.paths.includes(path))
    || (fallback ? GROUPS.find((g) => g.name === fallback) : undefined);
  if (!group) return;
  if (group.theme) element.setAttribute('data-representative-theme', group.theme);
  if (group.sizes) element.setAttribute('data-representative-sizes', group.sizes.join(','));
  if (group.mergeJoined) element.setAttribute('data-representative-merge', '');
  if (group.rules) element.setAttribute('data-representative-rules', group.rules);
  if (group.keepStyles) element.setAttribute('data-representative-keep', '');
  if (group.rewrite === false) return;
  const doc = element.ownerDocument;
  element.querySelectorAll('.c-rich-text-editor').forEach((rte) => {
    // shared Experience Fragments (the contact header / form) and forms keep their markup
    if (rte.closest('.experiencefragment, form, header, footer, .c-disclaimer')) return;
    normaliseRichText(rte, doc);
  });
}
