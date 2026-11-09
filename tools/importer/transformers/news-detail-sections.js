/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: www.stryker.com news articles (template news-detail) — page structure.
 *
 * beforeTransform rebuilds <body> as the article's authorable content, in source order:
 *   1. title section: the page H1 (`.h1-title`, only when the source has one — no H1 is
 *      created) and the H5 publish date (`.c-publish-date`)
 *   2. lead media: the single-slide `.c-autocarousel` (own section; the hero-image-slide
 *      parser turns it into `Hero (image-slide)`), or a standalone image (own section)
 *   3. article sections: rich text, standalone images and `.c-standalone-video` (left for
 *      the video parser). A run of centred content (centred rich text, `.c-curatedcta`
 *      buttons) becomes its own section with the `center` section style.
 *   3a. a video with a Large Headline beside it (col-sm-8 + col-sm-4 row, e.g. the
 *       StrykerTalks podcasts) → `Columns (columns-67-33, large-headline, gray-lead)`, full
 *       width: the video link, then the headline as a Heading 2 statement in the grey box;
 *       the page gets `theme: full-width` (title and small print full width, as on the source).
 *       A one-third column authored as rich text instead (a grey box, then the quote, e.g.
 *       Ellys' maxillofacial surgery story): the Video block, then the text as default
 *       content beside it, in a `video-text` section (`background: light-gray` for the box).
 * A page without a title whose article opens with a 2vw Large Headline gets that headline
 * as its H1, in a `headline-2vw` section below the date.
 * A `spacer` section follows the title section when it holds the H1 (or before such a
 * headline), unless the article
 * opens with a lead image directly below the date (outside a column layout).
 *   3b. section separators (`.c-section-separator` rule) → the `separator` style on the
 *       section that follows the rule
 *   3c. purple / blue buttons (a.btn-purple, a.btn-blue) → their section gets the
 *       btn-purple / btn-blue style (the authoring conventions' button colours)
 *   4. related-content cards (`.c-customizeable`): their heading plus the grid, left for
 *      the cards-corp-teaser parser, in a section of their own (full width)
 *   5. `.c-disclaimer` references (numbered paragraphs → an ordered list, so the
 *      citation superscripts link to them) and document code → a small-print `disclaimer` section
 * The "Last Updated" line is not content (scripts/corp.js renders it from `published`).
 *
 * Text normalisation (news-detail spec): source font spans are dropped (body text is
 * Humanist 14px); a rich text whose copy is all in one size span (fontsize-1-25em,
 * fontsize-1-5em, fontsize-1-75em) or font span (urw-egyptienne) gets the matching section
 * style (p-1-25, p-1-5, p-1-75, serif), and an h3 all in urw-egyptienne adds `h-serif`; a
 * paragraph that is plain bold (<b>) as a whole gets a section of its own with the
 * `bold-body` style (bold in the body font), and so does a paragraph that is only a link
 * in span.futura-bold (a teal Futura bold text link, e.g. the SPS blog BACK, authored
 * [[color-teal]**[BACK](…)**]; the text before it gets `ps-0`, as it is one paragraph
 * gap above the link); inline `span.futura-bold` becomes
 * <strong><em> (Futura bold) and `<b>` <strong> (body-font bold), gold buttons (a.btn-gold) become bold + italic links (the
 * authoring convention for the gold .button.accent), other buttons bold links, and
 * standalone links (span.standalone-link) bold + underline links (a.link-strong).
 * Gold text (colour #ffb500) is the `[[color-gold]…]` bracket tag around its formatting
 * (bold + italic alone renders black in news articles).
 * Asset links (/content/dam/...) point at www.stryker.com, where the files live; links
 * that open in a new tab on the source get the `#_blank` marker.
 */

import { videoLink } from '../parsers/video.js';
import xfFragmentPath from '../xf-fragment-path.js';

const SOURCE_ORIGIN = 'https://www.stryker.com';

const COMPONENTS = [
  '.c-autocarousel',
  // a Full Width Image (.fullWidthImage: the container-wide image, e.g. Eli's osteoid
  // osteoma story), before its parts are taken for components
  '.fullWidthImage',
  '.c-standalone-image',
  '.c-rich-text-editor',
  '.c-standalone-video',
  '.c-curatedcta',
  // a Button Set (.buttonset > .button-group > a.btn, e.g. the gold "Read the full
  // statement" / "DONATE" buttons on Sage news) imports like a Curated CTA
  '.buttonset',
  '.c-largeheadline',
  '.c-section-title',
  '.c-customizeable',
  // a Latest News list ("Related stories" cards, e.g. the DE&I Summit feature) imports like
  // the related-content grid
  '.c-latestnews',
  '.c-section-separator',
  '.sectionseparator',
  '.c-marketo-form',
  '.c-resourcesanddownload',
  // an Accordion (e.g. the FAQs of the AED pad placement guide); its panels' rich texts
  // are part of it, not article text of their own
  '.c-accordion:not(.edit-header)',
  // a Curated Link List (e.g. the "Learn more" links under the police car AED article)
  '.c-curated-link-list',
  '.xf-fragment',
].join(', ');

// Shared Experience Fragments: the delivered HTML has no XF path, so each is recognised by
// the start of its text and mapped to its XF path (xf-fragment-map.js lists them as shared).
// An XF that matches none is not shared: its components are imported inline.
const SHARED_XF_SIGNATURES = [
  ['Connect with us Have feedback', '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master'],
  ['Contact Information Customer support product feedback', '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master'],
  ['Contact information Product feedback Customer service', '/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master'],
  ['Resources Explore Sage homepage', '/content/experience-fragments/stryker/sage/en/footer/footer/master'],
  ['Resources Explore Acute Care homepage', '/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master'],
  ['Resources Explore Emergency Care homepage', '/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master'],
  ['Colonoscopy and colorectal cancer screening procedures are on the rise', '/content/experience-fragments/stryker/surgical-technologies/en/news/technology-helps-imp/body-copy/master'],
  ['Research and development (R&D) play a crucial role in improving the health', '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker-boosts-innovation-r-and-d-expands-with-medical-device-testing-facility/body-copy/master'],
  ['2-minute read More than 350,000 people experience a sudden cardiac arrest', '/content/experience-fragments/stryker/emergency-care/en/news/why-all-police-cars-need-aeds/body'],
  ['2-minute read When it comes to medical emergencies like sudden cardiac arrest', '/content/experience-fragments/stryker/emergency-care/en/news/understanding-the-basics-of-a-lucas-chest-compression-system/body'],
  ['Dr. Homer Stryker, an orthopaedic surgeon, established The O', '/content/experience-fragments/stryker/corporate/en/about/news/features/_80_years_together/test---body-copy/master'],
  ['Back in 2021, we hosted our first global Diversity, Equity a', '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/employees_share_why_/body-copy/master'],
  ['As a patient, preparing for surgery can bring up a mix of em', '/content/experience-fragments/stryker/communications/en/news/_2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite/body-copy/master'],
  ["At Stryker, we care about every patient's journey. And throu", '/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy/master'],
  ['These offerings are designed to help advance product and pro', '/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy-2/master'],
  ['Whether it be a healthcare emergency, natural disaster or un', '/content/experience-fragments/stryker/corporate/en/about/news/features/putting_people_first/body-copy/master'],
  ['What if joint replacement surgery could do more for surgeons', '/content/experience-fragments/stryker/corporate/en/about/news/features/mako_smartrobotics_h/body-text/master'],
  ['No parent is prepared to hear that their newborn baby has a ', '/content/experience-fragments/stryker/corporate/en/about/news/features/mother_and_son_take_/body-copy/master'],
  ['When Pam Mizerany, RN, learned that one of her best friends ', '/content/experience-fragments/stryker/corporate/en/about/news/features/some_people_say_they/body-copy/master'],
  ['“I get to look back at all the things I’ve accomplished over', '/content/experience-fragments/stryker/corporate/en/patient/jordan_3_17_23/jordan/master'],
  ['“I told Sue in person how very grateful I was that she’d mad', '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/springing_into_actio/body-copy/master'],
  ['Boris was driving his grandson Benjamin to soccer practice w', '/content/experience-fragments/stryker/corporate/en/patient/boris_story_5_15_23/news-content/master'],
  ['“In life there are hard things, and there are good things. A', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/katherine_s_catastro/body-copy/master'],
  ['When Lin was diagnosed with stage 3 colon cancer, he was tol', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/defying_the_odds/body-content/master'],
  ['Last year, we shared an ambitious carbon reduction goal that', '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/woman_holding_recycl/body-copy/master'],
  ['Out-of-hospital sudden cardiac arrest can happen anywhere, w', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/why_aeds_belong_on_b/body-copy/master'],
  ['In 2007, Emily began experiencing muscle spasms in her jaw.', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/restoring_form_funct/body/master'],
  ['Heart attack and sudden cardiac arrest (SCA) are very differ', '/content/experience-fragments/stryker/corporate/en/about/news/features/is_it_a_heart_attack/body-copy/master'],
  ['Osteoarthritis is the most common form of arthritis, impacti', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/carolyn_s_mako_total/body-copy/master'],
  ['When Janet fell to the floor after tripping on the stairs in', '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/focusing_on_her_mobi/body-copy/master'],
  ['Our passionate employees are behind everything we do, includ', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/three_things_to_know/body-copy/master'],
  ['Learn how Stryker incorporated the latest healthcare technol', '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/tour_the_amsterdam_s/body-copy/master'],
  ['Bracing for the COVID-19 pandemic surges that have swelled a', '/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_donates_22_5/text/text/master'],
  ['What are the symptoms and signs of stroke?', '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/what_are_the_symptom/body-copy/master'],
  ['Day in and day out, healthcare workers navigate the complexi', '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/a_partnership_promot/body-copy/master'],
  ['3-minute read Sudden cardiac arrest (SCA) affects more than 347,000', '/content/experience-fragments/stryker/emergency-care/en/news/help-increase-patient-outcomes-both-in-and-out-of-the-hospital/body'],
  ['Nurses are at the forefront of innovation within healthcare systems', '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/these_nurses_share_h/body-copy/master1'],
  ['Together, Stryker and Operation Smile are changing lives and strengthe', '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/celebrating_hispanic/body-copy/master'],
  ["More about Stryker’s Mako SmartRobotics™ Our robotic surgery expertise", '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/mako_robotics_drivin/infographic-text/master'],
  ["Values align for military members and veterans at Stryker", '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/military_members_on_/body-copy/master11'],
  ["Humans are fallible and errors are unavoidable, even in the best organ", '/content/experience-fragments/stryker/surgical-technologies/en/news/the_journey_to_zero_/body-copy/master'],
  ["Julie Greenhalgh, RN, BSN, CNOR, never smoked a day in her life", '/content/experience-fragments/stryker/surgical-technologies/en/news/protect_your_patient/body-copy/master'],
  ["At Stryker, we believe that Pride is more than a single month or momen", '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/a_safe_space_at_stry/body-copy/master'],
  ["Victoria lived with back pain for years – impeding her ability to walk", '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/back_pain_and_scolio/body-copy/master'],
  ["Knowing the warning signs of sudden cardiac arrest helped saved his li", '/content/experience-fragments/stryker/corporate/en/patient/derrick_10_2_23/derrick/master'],
  ["2-minute read Sudden cardiac arrest is a life-threatening condition th", '/content/experience-fragments/stryker/emergency-care/en/news/when-to-use-and-aed/body'],
  ["Confined to a single operating room suite and the constant need to ada", '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_stryker_is_innov/body-copy/master'],
  ["In the gastrointestinal (GI) suite, a focus on safety is often associa", '/content/experience-fragments/stryker/surgical-technologies/en/news/how_technology_helps/how-technology-helps-address-gi-suite-challenges/master'],
  ["Stryker's Global Volunteer Network highlights importance of volunteeri", '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_s_global_vol/body/master'],
  ["According to the American Heart Association, many people who’ve had a", '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/five_things_you_need/body-copy/master'],
  ["Making healthcare better is our mission, but it doesn’t belong to us a", '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/promoting_high_quali/body-copy/master'],
  ["Arthritis is a widespread health challenge, serving as the leading cau", '/content/experience-fragments/stryker/corporate/en/about/news/-2026/features/myths-realities-and-real-innovation-what-everyone-should-know-about-arthritis/myths--realities-and-real-innovation--what-everyone-should-know/master'],
  ["To help improve patient outcomes, Stryker provides extensive medical e", '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/advancing_healthcare/body-copy/master'],
  ["The facts are staggering. An estimated 1.3 million Americans are livin", '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_is_doubling_/body-text/master'],
  ["2-minute read If you’re a business owner or responsible for monitoring", '/content/experience-fragments/stryker/emergency-care/en/news/3-ways-aed-remote-monitoring-makes-a-difference/blog'],
  ["For under-resourced countries around the world, healthcare professionals", '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/stryker_gets_medical/2-8-24-body-copy/master'],
  ["When Amanda Baumann started at Mako Surgical Corp. in 2008, she was wor", '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/women_leading_the_ch/body/master'],
];

const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE']);
const KEEP_ATTRS = { A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'] };

function text(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function rename(el, tagName) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function absoluteAsset(href) {
  return href && href.startsWith('/content/dam/') ? `${SOURCE_ORIGIN}${href}` : href;
}

/**
 * A source link that opens in a new tab (target="_blank"), and every link to a PDF,
 * gets the author `#_blank` marker (scripts.js decorateLinkTargets sets target="_blank"
 * from it). The address itself is kept (PDFs stay on www.stryker.com, see
 * absoluteAsset). Links that already carry a #hash, mailto: and tel: are left as they are.
 */
function newTabHref(source, href) {
  if (!href || href.includes('#') || /^(mailto|tel):/i.test(href)) return href;
  const isPdf = /\.pdf(\?|$)/i.test(href);
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  return isPdf || newTab ? `${href}#_blank` : href;
}

// source copy spans → the corp section style that sets the same copy size / font
const SIZE_STYLES = [
  // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph),
  // on the paragraph's 14px lines (references-body-lines)
  ['fontsize-8em', 'disclaimer, references-body-lines'],
  ['fontsize-1-25em', 'p-1-25'],
  ['fontsize-1-5em', 'p-1-5'],
  ['fontsize-1-75em', 'p-1-75'],
  ['fontsize-2em', 'p-2'],
];
const FONT_STYLES = [
  ['urw-egyptienne', 'serif'],
];

/**
 * The copy section styles of a rich-text fragment: when the whole text of every
 * paragraph and list item sits in one source size span (e.g. span.fontsize-1-25em,
 * 17.5px) the matching size style (p-1-25), and when it all sits in one source font
 * span (span.urw-egyptienne) the matching font style (serif). Copy that is only partly
 * styled keeps the defaults (14px Humanist).
 * @returns {string|null} the styles, comma-separated ('' for default copy, null when the
 *   fragment has no paragraph or list item)
 */
function copyStyles(root) {
  const candidates = root.matches && root.matches('p, li') ? [root] : [...root.querySelectorAll('p, li')];
  const copy = candidates.filter((el) => text(el) && !el.querySelector('p, li'));
  if (!copy.length) return null;
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  const covers = (cls) => copy.every((el) => {
    const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
    return squash(spans.map((span) => span.textContent).join('')) === squash(el.textContent);
  });
  const size = SIZE_STYLES.find(([cls]) => covers(cls));
  const font = FONT_STYLES.find(([cls]) => covers(cls));
  return [size && size[1], font && font[1]].filter(Boolean).join(', ');
}

/**
 * Cleans a copied rich-text fragment in place: bold/italic to <strong>/<em>, font spans
 * dropped, attributes stripped, empty paragraphs removed. Returns whether every
 * paragraph of the fragment is centred and its copy section styles (copyStyles).
 */
/**
 * The text next to a node on its own line: its siblings up to the next <br> (or the
 * start / end of the parent) in one direction.
 */
function sameLineText(node, direction) {
  let value = '';
  let sibling = node[direction];
  while (sibling && sibling.nodeName !== 'BR') {
    value += sibling.textContent;
    sibling = sibling[direction];
  }
  return value.replace(/[\s\u00a0]+/g, '');
}

/**
 * Plain-bold (<b>) labels on a line of their own ("For investor inquiries:") are in the
 * body font on the source, while bold labels are Futura on the site. Both become
 * <strong> on import, so these are wrapped in the `[[body-font]…]` bracket tag
 * (scripts/span-tags.js → span.body-font, styles-corp.css). A paragraph that is plain
 * bold as a whole gets the `bold-body` section style instead, unless wholeParagraphs is
 * set (small print, which stays one section).
 */
function tagPlainBoldLabels(root, wholeParagraphs) {
  const doc = root.ownerDocument;
  [...root.querySelectorAll('b')].forEach((b) => {
    if (b.closest('.futura-bold') || b.querySelector('.futura-bold') || b.parentElement.closest('b')) return;
    if (!text(b) || sameLineText(b, 'previousSibling') || sameLineText(b, 'nextSibling')) return;
    const block = b.closest('p, li, h1, h2, h3, h4, h5, h6');
    if (!block || block.matches('h1, h2, h3, h4, h5, h6')) return;
    if (!wholeParagraphs && text(block) === text(b)) return;
    b.before(doc.createTextNode('[[body-font]'));
    b.after(doc.createTextNode(']'));
  });
}

/**
 * Gold text (inline colour #ffb500 / rgb(255,181,0)) is the `[[color-gold]…]` bracket tag
 * (corp authoring conventions: in news articles bold + italic alone is black, gold Futura
 * text is bold + italic inside the tag). A text is gold when its nearest colour is gold
 * (a gold span around a black one, e.g. a quote name, is not). The tag goes around the
 * formatting it fills (`[[color-gold]<span class=futura-bold>…</span>]` →
 * `[[color-gold]***…***]`), not past a paragraph, heading, list item or link.
 */
const GOLD = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i;

function ownColour(el) {
  const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  return m ? m[1].trim() : '';
}

/** Whether a node holds text in a colour other than gold. */
function hasOtherColour(node) {
  if (node.nodeType !== 1) return false;
  const coloured = [node, ...node.querySelectorAll('[style*="color"]')]
    .filter((el) => ownColour(el) && !GOLD.test(ownColour(el)));
  return coloured.some((el) => [...el.childNodes].some((child) => (child.nodeType === 3
    ? child.textContent.trim() : !ownColour(child) && text(child))));
}

/**
 * Wraps a run of sibling nodes in the `[[<classes>]…]` bracket tag, moving the tag out of
 * the formatting the run fills (bold, italic, spans) but not past a paragraph, heading,
 * list item, link or div. Line breaks and spaces at either end stay outside.
 */
function bracketTag(nodes, classes, root) {
  const doc = root.ownerDocument;
  const run = [...nodes];
  const loose = (n) => n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim());
  while (run.length && loose(run[0])) run.shift();
  while (run.length && loose(run[run.length - 1])) run.pop();
  if (!run.length || !run.some((n) => n.textContent.trim())) return;
  const open = doc.createTextNode(`[[${classes}]`);
  const close = doc.createTextNode(']');
  run[0].before(open);
  run[run.length - 1].after(close);
  const edge = (n, dir) => {
    let s = n[dir];
    while (s && s.nodeType === 3 && !s.textContent.trim()) s = s[dir];
    return s;
  };
  let parent = open.parentElement;
  while (parent && parent !== root && parent === close.parentElement
    && !parent.matches('p, li, h1, h2, h3, h4, h5, h6, a, div')
    && !edge(open, 'previousSibling') && !edge(close, 'nextSibling')) {
    parent.before(open);
    parent.after(close);
    parent = open.parentElement;
  }
}

/**
 * A 1.25em size span on part of a paragraph or list item (e.g. a bold release dateline
 * at the start of the text) is the `[[text-1-25]…]` bracket tag (styles-corp.css). A span
 * that holds the whole paragraph is left to the p-1-25 section style (copyStyles). In an
 * h2–h6 the span is the bracket tag too, whole heading or part (e.g. the IP BRAVoE article
 * subheadings, h2 > span.fontsize-1-25em: 30.625px); an h1 keeps the h1-1-25 section style.
 */
function tagTextSize(root) {
  const squash = (value) => value.replace(/[\s ]+/g, '');
  [...root.querySelectorAll('.fontsize-1-25em')].forEach((span) => {
    if (span.parentElement.closest('.fontsize-1-25em') || !text(span)) return;
    if (span.closest('h1')) return;
    const heading = span.closest('h2, h3, h4, h5, h6');
    const block = heading || span.closest('p, li');
    if (!block) return;
    if (!heading && squash(block.textContent) === squash(span.textContent)) return;
    bracketTag([span], 'text-1-25', root);
  });
}

function tagGoldText(root) {
  const tagged = new Set();
  const wrap = (nodes) => bracketTag(nodes, 'color-gold', root);
  root.querySelectorAll('[style*="color"]').forEach((el) => {
    if (!GOLD.test(ownColour(el)) || [...tagged].some((t) => t.contains(el))) return;
    tagged.add(el);
    if (!hasOtherColour(el)) {
      wrap([el]);
      return;
    }
    // mixed: each run of children without another colour
    let run = [];
    [...el.childNodes].forEach((child) => {
      if (hasOtherColour(child)) {
        wrap(run);
        run = [];
      } else run.push(child);
    });
    wrap(run);
  });
}

function cleanRichText(root, { wholeParagraphs = false } = {}) {
  const blocks = [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => text(el));
  const centred = blocks.length > 0
    && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute('style') || ''));
  const size = copyStyles(root);
  const doc = root.ownerDocument;
  // links without an address (<a> wrappers, e.g. a Large Headline title) are plain text
  root.querySelectorAll('a:not([href]), a[href=""]').forEach(unwrap);

  // a line break typed inside the formatting ("<span class=futura-bold>About Stryker<br></span>",
  // possibly followed by empty size spans, or nested: <b><span>…<br></span></b>) belongs
  // after it: inside <strong> it would be lost on import, merging the label into the next
  // line. Innermost formatting first, so the break moves out of every level; done before
  // the plain-bold labels are found (a "<b>About Stryker<br></b>" label is on its own line).
  // A space typed at the end of the formatting ("2023&nbsp;</span>–") stays between the words.
  const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== 'BR'
    && !node.textContent.trim() && !node.querySelector('img, br');
  const trailingSpace = /[\s\u00a0]+$/;
  [...root.querySelectorAll('span.futura-bold, b, i, em, strong')].reverse().forEach((el) => {
    let last = el.lastChild;
    while (last && (last.nodeName === 'BR' || emptyElement(last)
      || (last.nodeType === 3 && !last.textContent.trim()))) {
      if (emptyElement(last)) {
        // an empty element that only held a space (e.g. <sup>&nbsp;</sup>) keeps the space
        if (/[\s\u00a0]/.test(last.textContent) && !(el.nextSibling && /^[\s\u00a0]/.test(el.nextSibling.textContent))) {
          el.after(doc.createTextNode(' '));
        }
        last.remove();
      } else el.after(last);
      last = el.lastChild;
    }
    if (last && last.nodeType === 3 && trailingSpace.test(last.textContent)) {
      last.textContent = last.textContent.replace(trailingSpace, '');
      el.after(doc.createTextNode(' '));
    }
  });
  tagPlainBoldLabels(root, wholeParagraphs);
  tagGoldText(root);
  tagTextSize(root);

  // standalone links (span.standalone-link: Futura bold, uppercase, teal, with a
  // triangle — e.g. "Read the full report") → bold + underline link, the authoring
  // convention for that CTA (a.link-strong): <strong><a><u>text</u></a></strong>
  const standalone = new Set();
  root.querySelectorAll('.standalone-link').forEach((span) => {
    const a = span.closest('a') || span.querySelector('a');
    if (a) standalone.add(a);
  });
  standalone.forEach((a) => {
    const u = doc.createElement('u');
    while (a.firstChild) u.append(a.firstChild);
    a.append(u);
    const strong = doc.createElement('strong');
    a.replaceWith(strong);
    strong.append(a);
  });

  // span.futura-bold in a paragraph or list item → <strong><em> (Futura bold, upright, body
  // colour in news-detail.css); <b> → <strong> (bold in the body font). Headings keep a
  // plain <strong>.
  root.querySelectorAll('span.futura-bold').forEach((el) => {
    if (!el.closest('p, li') || el.closest('h1, h2, h3, h4, h5, h6')) {
      rename(el, 'strong');
      return;
    }
    const strong = rename(el, 'strong');
    const em = root.ownerDocument.createElement('em');
    while (strong.firstChild) em.append(strong.firstChild);
    strong.append(em);
  });
  root.querySelectorAll('b').forEach((el) => rename(el, 'strong'));
  root.querySelectorAll('i').forEach((el) => rename(el, 'em'));
  root.querySelectorAll('span, font').forEach(unwrap);
  // bold inside bold (e.g. <b><span class="futura-bold">) is one bold run
  root.querySelectorAll('strong strong, em em').forEach(unwrap);
  // a heading that is bold throughout keeps the bold (Futura); empty formatting goes
  root.querySelectorAll('strong, em').forEach((el) => { if (!el.textContent.trim() && !el.querySelector('img, br')) el.remove(); });

  root.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('href', newTabHref(a, absoluteAsset(a.getAttribute('href'))));
  });
  root.querySelectorAll('*').forEach((el) => {
    const keep = KEEP_ATTRS[el.tagName] || [];
    [...el.attributes].forEach((attr) => { if (!keep.includes(attr.name)) el.removeAttribute(attr.name); });
  });

  // trailing <br> and empty paragraphs (&nbsp; spacers)
  root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
    while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) {
      el.lastChild.remove();
    }
    if (!text(el) && !el.querySelector('img')) el.remove();
  });
  return { centred, size };
}

/** The rich-text content of a component as top-level block elements. */
/**
 * Paragraphs that are plain bold (<b>, not span.futura-bold) as a whole: on the source
 * they stay in the body font (Humanist bold). Both kinds of bold become <strong> on
 * import, so these get the `bold-body` section style instead.
 */
function plainBoldParagraphs(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.querySelectorAll('p')].filter((p) => {
    const all = squash(p.textContent);
    if (!all || p.querySelector('.futura-bold')) return false;
    const bold = [...p.querySelectorAll('b')].filter((b) => !b.parentElement.closest('b'));
    return squash(bold.map((b) => b.textContent).join('')) === all;
  }));
}

/**
 * Paragraphs that are only a link set in span.futura-bold (stryker.com <p><a><span
 * class="futura-bold">BACK</span></a></p>, the end of the SPS blog posts): a teal Futura
 * bold text link, not a button. Authored as a bold link in the teal colour tag
 * ([[color-teal]**[BACK](…)**], authoring conventions: Futura text = bold in a colour tag)
 * in a `bold-body` section, where the news-detail template keeps it a text link.
 */
function futuraLinkParagraphs(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.children].filter((p) => {
    if (p.tagName !== 'P') return false;
    const links = p.querySelectorAll('a[href]');
    const all = squash(p.textContent);
    if (links.length !== 1 || !all || squash(links[0].textContent) !== all) return false;
    if (/\bbtn\b/.test(links[0].className) || p.querySelector('img')) return false;
    const spans = [...p.querySelectorAll('.futura-bold')].filter((span) => !span.parentElement.closest('.futura-bold'));
    return squash(spans.map((span) => span.textContent).join('')) === all;
  }));
}

/**
 * h3 headings set in Egyptienne on the source (the whole text in span.urw-egyptienne, or
 * a plain h3 with no bold and no styled span, the live h3 face): the template's h3 is
 * Futura bold, so their section gets the `h-serif` style.
 */
function serifHeadings(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.querySelectorAll('h3')].filter((h) => {
    if (!text(h) || h.querySelector('.futura-bold, b, strong')) return false;
    // a size span (e.g. span.fontsize-1-25em around Eli's subtitle) keeps the h3's own font
    if (![...h.querySelectorAll('[class]')].some((el) => [...el.classList].some((c) => !c.startsWith('fontsize-')))) return true;
    const spans = [...h.querySelectorAll('.urw-egyptienne')].filter((span) => !span.parentElement.closest('.urw-egyptienne'));
    return squash(spans.map((span) => span.textContent).join('')) === squash(h.textContent);
  }));
}

// press-release boilerplate labels; a few pages set them as h3 headings, the rest as a
// Futura bold label paragraph
const LABEL_HEADING = /^(about stryker|media contacts?|contacts?|investor contacts?)\s*:?$/i;

/**
 * "About Stryker" / "Media contact" headings → a paragraph with the same content, so they
 * import like on the other news pages (span.futura-bold → <p><em><strong>, Futura bold).
 */
function labelHeadingsToParagraphs(root) {
  root.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
    if (!LABEL_HEADING.test(text(h))) return;
    const p = root.ownerDocument.createElement('p');
    while (h.firstChild) p.append(h.firstChild);
    // the heading's own size span (e.g. fontsize-8em) is not copy size: the label is 14px
    p.querySelectorAll('span[class*="fontsize-"]').forEach(unwrap);
    if (!p.querySelector('.futura-bold')) {
      p.querySelectorAll('b, strong').forEach(unwrap);
      const bold = root.ownerDocument.createElement('span');
      bold.className = 'futura-bold';
      while (p.firstChild) bold.append(p.firstChild);
      p.append(bold);
    }
    h.replaceWith(p);
  });
}

/**
 * h2 headings the source sets at 0.8em (the whole text in span.fontsize-8em, e.g. a news
 * subtitle): their own section with the `h2-0-8` style (styles-corp.css).
 */
// headings the source sizes with a span (the whole text in it): [tag, span class, style]
const HEADING_SIZES = [
  ['H2', 'fontsize-8em', 'h2-0-8'],
  ['H2', 'fontsize-1-5em', 'h2-1-5'],
  ['H1', 'fontsize-1-25em', 'h1-1-25'],
];

function smallHeadings(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  const styles = new Map();
  root.querySelectorAll('h1, h2').forEach((h) => {
    if (!text(h)) return;
    const match = HEADING_SIZES.find(([tag, cls]) => {
      if (h.tagName !== tag) return false;
      const spans = [...h.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join('')) === squash(h.textContent);
    });
    if (match) styles.set(h, match[2]);
  });
  return styles;
}

/**
 * A paragraph that opens with a styled lead (the whole run in one source size / font
 * span, e.g. an Egyptienne 21px subtitle) followed by a blank line (<br><br>) and the
 * article text is split there, so the lead gets its own copy style.
 */
function splitStyledLeads(root) {
  const doc = root.ownerDocument;
  const styled = [...SIZE_STYLES, ...FONT_STYLES].map(([cls]) => `.${cls}`).join(', ');
  [...root.children].filter((el) => el.tagName === 'P').forEach((p) => {
    const nodes = [...p.childNodes];
    const at = nodes.findIndex((node, i) => node.nodeName === 'BR'
      && nodes.slice(i + 1).find((next) => next.nodeType !== 3 || next.textContent.trim())?.nodeName === 'BR');
    if (at < 1) return;
    const lead = doc.createElement('p');
    nodes.slice(0, at).forEach((node) => lead.append(node));
    const leadText = text(lead).replace(/[\s\u00a0]+/g, '');
    const covered = [...lead.querySelectorAll(styled)].filter((span) => !span.parentElement.closest(styled))
      .map((span) => span.textContent).join('').replace(/[\s\u00a0]+/g, '');
    if (!leadText || covered !== leadText || !text(p)) {
      p.prepend(...lead.childNodes);
      return;
    }
    // drop the blank-line breaks between the lead and the text
    while (p.firstChild && (p.firstChild.nodeName === 'BR' || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) p.firstChild.remove();
    p.before(lead);
  });
}

/**
 * The title line a rich text opens with when the page has no title: the run before the
 * first line break of its first paragraph, all in a 1.5em size span and bold (Futura
 * bold 21px on the source). Taken out of the component (with the breaks after it) and
 * returned as an <h1>; null when the text does not open that way. The h1's `titleStyle`
 * is its section style: `h1-42` when the line is also in a 2em span (Futura bold 42px,
 * e.g. the "Trees, landfills and the environment" feature), else `h1-21`; a title that
 * is gold as a whole is in the `[[color-gold]…]` tag.
 */
function richTextTitle(component, doc) {
  const p = component.querySelector('p');
  if (!p) return null;
  const nodes = [...p.childNodes];
  const at = nodes.findIndex((node) => node.nodeName === 'BR');
  const lead = at < 0 ? nodes : nodes.slice(0, at);
  const squash = (value) => value.replace(/[\s ]+/g, ' ').trim();
  const leadText = squash(lead.map((node) => node.textContent).join(''));
  if (!leadText) return null;
  const box = doc.createElement('div');
  lead.forEach((node) => box.append(node.cloneNode(true)));
  const covered = (cls) => squash([...box.querySelectorAll(`.${cls}`)]
    .filter((span) => !span.parentElement.closest(`.${cls}`))
    .map((span) => span.textContent).join('')) === leadText;
  // 1.5em → h1-21 (with a 2em span too → h1-42); 2.5em (35px, e.g. "Smart devices deliver
  // actionable insights") → h1-2-5
  let titleStyle = null;
  if (covered('fontsize-1-5em')) titleStyle = covered('fontsize-2em') ? 'h1-42' : 'h1-21';
  else if (covered('fontsize-2-5em')) titleStyle = 'h1-2-5';
  if (!titleStyle || !box.querySelector('.futura-bold, b')) return null;
  // gold words keep their colour tag: the whole title, or a part of it ("Smart devices")
  const goldOf = (node) => {
    const el = node.parentElement && node.parentElement.closest('[style*="color"]');
    return !!el && box.contains(el) && GOLD.test(ownColour(el));
  };
  const runs = [];
  const walker = doc.createTreeWalker(box, 4);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const gold = goldOf(t);
    const last = runs[runs.length - 1];
    if (last && last.gold === gold) last.text += t.textContent;
    else runs.push({ gold, text: t.textContent });
  }
  const title = runs.map((run) => (run.gold && squash(run.text) ? `[[color-gold]${squash(run.text)}]` : run.text)).join('');
  lead.forEach((node) => node.remove());
  while (p.firstChild && (p.firstChild.nodeName === 'BR' || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) p.firstChild.remove();
  if (!text(p)) p.remove();
  const h1 = doc.createElement('h1');
  // a 2.5em title is Futura bold on the source: Bold (the corp H1 is the light serif);
  // h1-21 / h1-42 set the Futura bold themselves
  if (titleStyle === 'h1-2-5') {
    const strong = doc.createElement('strong');
    strong.textContent = squash(title);
    h1.append(strong);
  } else {
    h1.textContent = squash(title);
  }
  h1.titleStyle = titleStyle;
  return h1;
}

/**
 * The top-level blocks of a cleaned fragment, in source order, without losing copy:
 * block elements as they are, <div>s unwrapped (at any depth), images and runs of
 * loose text / inline elements (e.g. a small-print `<div>A surgeon must…</div>`) as
 * paragraphs of their own.
 */
function blockNodes(container, doc) {
  const nodes = [];
  let run = [];
  const flush = () => {
    if (run.some((n) => (n.nodeType === 3 ? n.textContent.trim() : text(n) || n.querySelector?.('img')))) {
      const p = doc.createElement('p');
      p.append(...run);
      // no line breaks at either end
      while (p.firstChild && (p.firstChild.nodeName === 'BR' || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) p.firstChild.remove();
      while (p.lastChild && (p.lastChild.nodeName === 'BR' || (p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim()))) p.lastChild.remove();
      nodes.push(p);
    }
    run = [];
  };
  [...container.childNodes].forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
      flush();
      if (text(node) || node.querySelector('img')) nodes.push(node);
    } else if (node.nodeType === 1 && node.tagName === 'IMG') {
      flush();
      const p = doc.createElement('p');
      p.append(node);
      nodes.push(p);
    } else if (node.nodeType === 1 && ['DIV', 'SECTION', 'ARTICLE'].includes(node.tagName)) {
      flush();
      nodes.push(...blockNodes(node, doc));
    } else if (node.nodeType === 1 || node.nodeType === 3) {
      run.push(node);
    }
  });
  flush();
  return nodes;
}

const squashText = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, '');
const isBlankLine = (el) => !!el && /^(P|H3)$/.test(el.tagName) && !el.querySelector('img') && !squashText(el);

/**
 * The Heading 4 texts the source page follows with an empty paragraph (<p>&nbsp;</p> or an
 * empty h3), read from the raw page HTML: the importer drops empty paragraphs from the
 * document before the transformers run, so they are only in `payload.html`.
 * @param {string} html the raw source HTML
 * @returns {Set<string>} the subheads' texts, whitespace removed
 */
function rawSpacedSubheads(html) {
  if (!html || typeof DOMParser === 'undefined') return new Set();
  const raw = new DOMParser().parseFromString(html, 'text/html');
  return new Set([...raw.querySelectorAll('.c-rich-text-editor h4')]
    .filter((h) => squashText(h) && isBlankLine(h.nextElementSibling))
    .map(squashText));
}
let spacedSubheadTexts = new Set();

/**
 * Whether the rich text sets its subheads between blank lines: every Heading 4 is followed
 * by an empty paragraph on the source (<p>&nbsp;</p>, or an empty h3), e.g. the
 * Sustainability "Reprocessing in the EP Lab" release. EDS drops empty paragraphs, so the
 * section gets the `h4-spaced` style instead (styles-corp.css: a blank line above and below
 * each h4).
 */
function spacedSubheads(root) {
  const subheads = [...root.children].filter((el) => el.tagName === 'H4' && squashText(el));
  return subheads.length > 0 && subheads.every((h) => isBlankLine(h.nextElementSibling)
    || spacedSubheadTexts.has(squashText(h)));
}

/** The rich text of the source grid item right before the one holding `component`, or null. */
function previousRichText(component) {
  const item = component.closest('.text');
  const prev = item && item.previousElementSibling;
  return prev && prev.matches('.text') ? prev.querySelector('.c-rich-text-editor') : null;
}

/**
 * True when the rich text's box sets no margin or padding on that side (the source's
 * empty `margin-bottom: %;` inline values).
 */
function unspaced(component, side) {
  const box = component && component.querySelector(':scope > div[style]');
  const style = box ? box.getAttribute('style') : '';
  return !new RegExp(`(margin|padding)-${side}:\\s*[\\d.]+`).test(style);
}

function richTextNodes(component, doc) {
  const box = doc.createElement('div');
  const source = component.querySelector(':scope > div') || component;
  box.innerHTML = source.innerHTML;
  labelHeadingsToParagraphs(box);
  splitStyledLeads(box);
  const plainBold = plainBoldParagraphs(box);
  const futuraLinks = futuraLinkParagraphs(box);
  const serifHeads = serifHeadings(box);
  const smallHeads = smallHeadings(box);
  const spaced = spacedSubheads(box);
  // copy styles per top-level element, so one serif lead paragraph in an otherwise
  // plain rich text keeps its font (its own section)
  const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
  // a paragraph indented 40px per step (p style margin-left: 40px / 80px, e.g. the steps
  // of the Sage bed bath guide): its text in one `[[indent]…]` tag per step, nested
  // (news-detail.css), once its copy size is read
  const indents = new Map([...box.querySelectorAll(':scope > p[style*="margin-left"]')].map((p) => {
    const px = (p.getAttribute('style').match(/margin-left:\s*(\d+)px/) || [])[1];
    return [p, Math.round(Number(px || 0) / 40)];
  }).filter(([, level]) => level > 0));
  const { centred, size } = cleanRichText(box);
  indents.forEach((level, p) => {
    if (!box.contains(p)) return;
    for (let i = 0; i < level; i += 1) bracketTag([...p.childNodes], 'indent', p);
  });
  const nodes = blockNodes(box, doc);
  nodes.forEach((node) => {
    if (plainBold.has(node)) node.boldBody = true;
    if (futuraLinks.has(node)) {
      // span.futura-bold became <strong><em> (cleanRichText): a bold link in the teal tag
      const link = node.querySelector('a');
      link.textContent = link.textContent.trim();
      const strong = doc.createElement('strong');
      strong.append(link);
      node.replaceChildren('[[color-teal]', strong, ']');
      node.boldBody = true;
      node.followsText = true;
    }
    if (serifHeads.has(node)) node.serifHeading = true;
    if (smallHeads.has(node)) node.headingStyle = smallHeads.get(node);
  });
  // elements without copy of their own (headings, images) follow the copy around them
  let last = null;
  nodes.forEach((node) => {
    const style = elementStyles.get(node);
    node.copyStyle = style === undefined || style === null ? last : style;
    if (node.copyStyle !== null) last = node.copyStyle;
  });
  const first = nodes.find((node) => node.copyStyle !== null);
  // a rich text in the corp blue box (.has-background.bg-blue outside a column row, e.g.
  // the quote of "Following in her mother's footsteps"): blue-box, serif when its copy is
  // Egyptienne (span.urw-egyptienne beside a Futura bold phrase)
  const blue = !component.closest('.colctrl') && source.matches('.has-background.bg-blue');
  const boxStyles = blue ? [source.querySelector('.urw-egyptienne') ? 'serif' : '', 'blue-box'] : [];
  nodes.forEach((node) => {
    if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : (size || '');
    if (spaced) node.copyStyle = [node.copyStyle, 'h4-spaced'].filter(Boolean).join(', ');
    if (blue) {
      const styles = (node.copyStyle || '').split(', ').filter(Boolean);
      node.copyStyle = [...new Set([...styles, ...boxStyles.filter(Boolean)])].join(', ');
    }
  });
  return { nodes, centred, size };
}

/**
 * The section style of an image the source sets in a one-third / one-half grid column
 * with the other columns of the row empty: col-sm-4 → `image-1-3`, col-sm-6 →
 * `image-1-2` (styles-corp.css caps the image box at that column's width); '' otherwise.
 */
function imageColumnStyle(component) {
  const col = component.closest('[class*="col-sm-"]');
  const match = col && col.className.match(/\bcol-sm-(4|6)\b/);
  if (!match) return '';
  const others = [...col.parentElement.children].filter((el) => el !== col);
  if (others.some((el) => text(el) || el.querySelector('img, video, iframe'))) return '';
  return match[1] === '4' ? 'image-1-3' : 'image-1-2';
}

/**
 * A source column row of two columns, one third + two thirds (col-sm-4 / col-sm-8, either
 * order) or one half each (col-sm-6), where one column is a single standalone photo with at
 * most one caption rich text below it and the other is rich text only (e.g. Darryl
 * Conway's headshot and bio beside the ABCDEFG steps; the AED pad placement guide's text
 * beside each placement diagram): { photo, caption, texts, photoFirst, name } with the
 * Columns variant for the widths; null otherwise. `component` is any component of the row.
 */
function photoTextRow(component) {
  const col = component.closest('.colctrl [class*="col-sm-"]');
  const row = col && col.parentElement;
  if (!row || !row.closest('.colctrl')) return null;
  const cols = [...row.children];
  if (cols.length !== 2) return null;
  const widths = cols.map((c) => Number((c.className.match(/\bcol-sm-(\d+)\b/) || [])[1]));
  const variants = { '4-8': 'columns-33-67', '8-4': 'columns-67-33', '6-6': 'columns-50-50' };
  const variant = variants[widths.join('-')];
  if (!variant) return null;
  const media = 'img, video, iframe, .c-standalone-image, .c-standalone-video';
  const photoCol = cols.find((c) => c.querySelectorAll('.c-standalone-image').length === 1
    && c.querySelectorAll('img').length === 1 && c.querySelectorAll('.c-rich-text-editor').length <= 1);
  const textCol = photoCol && cols.find((c) => c !== photoCol);
  if (!textCol || textCol.querySelector(media)) return null;
  const texts = [...textCol.querySelectorAll('.c-rich-text-editor')].filter((t) => text(t));
  if (!texts.length) return null;
  // the narrow column of a 1/3 + 2/3 row is the photo's
  if (variant !== 'columns-50-50' && !/\bcol-sm-4\b/.test(photoCol.className)) return null;
  return {
    photo: photoCol.querySelector('.c-standalone-image'),
    caption: photoCol.querySelector('.c-rich-text-editor'),
    texts,
    photoFirst: cols[0] === photoCol,
    name: `Columns (${variant})`,
  };
}

/**
 * The standalone images of a source column row (.colctrl) when every column of the row
 * holds exactly one image and nothing else (e.g. the three photos of the Smart Hospital
 * Summit, col-sm-6 col-md-4); null otherwise.
 */
function imageRow(component) {
  const col = component.closest('.colctrl [class*="col-sm-"]');
  const row = col && col.parentElement;
  if (!row || !row.closest('.colctrl')) return null;
  const cols = [...row.children];
  if (cols.length < 2) return null;
  // each column one image (its caption title / line, inside the image component, may come
  // with it, e.g. "ThermaClear" under the urology launch's product shots) or nothing at all
  // (an empty column keeps the row's widths: an empty cell)
  const images = cols.map((c) => {
    const found = c.querySelectorAll('.c-standalone-image');
    if (!found.length && !text(c) && !c.querySelector('img, video, iframe')) return 'empty';
    const own = found.length === 1 && text(c) === text(found[0]);
    return own && c.querySelectorAll('img').length === 1 ? found[0] : null;
  });
  const filledCount = images.filter((image) => image && image !== 'empty').length;
  return images.every(Boolean) && filledCount >= 2 ? images : null;
}

/**
 * A source column row (.colctrl) of equal columns where each column holds exactly one rich
 * text (and nothing else) or nothing, at least two with text (e.g. the ProCuity key
 * features); the rich texts, 'empty' for an empty column, or null.
 */
function textRow(component) {
  const col = component.closest('.colctrl [class*="col-sm-"]');
  const row = col && col.parentElement;
  if (!row || !row.closest('.colctrl')) return null;
  const cols = [...row.children];
  if (cols.length < 2 || cols.some((c) => c.className !== cols[0].className)) return null;
  const texts = cols.map((c) => {
    if (!text(c) && !c.querySelector('img, video, iframe')) return 'empty';
    const found = c.querySelectorAll('.c-rich-text-editor');
    const only = found.length === 1 && !c.querySelector('img, video, iframe, .c-largeheadline, .c-curatedcta')
      && text(c) === text(found[0]) && !found[0].querySelector('.has-background, .dimensional-box');
    return only ? found[0] : null;
  });
  return texts.every(Boolean) && texts.filter((t) => t !== 'empty').length >= 2 ? texts : null;
}

/**
 * The rich texts of a source column row (.colctrl) when every column holds exactly one
 * rich text in a gold box (.has-background.bg-gold) and no media (e.g. the three
 * workplace violence figures, col-sm-6 col-md-4); null otherwise.
 */
function goldBoxRow(component) {
  const col = component.closest('.colctrl [class*="col-sm-"]');
  const row = col && col.parentElement;
  if (!row || !row.closest('.colctrl')) return null;
  const cols = [...row.children];
  if (cols.length < 2) return null;
  const boxes = cols.map((c) => {
    const found = c.querySelectorAll('.c-rich-text-editor');
    return found.length === 1 && found[0].querySelector('.has-background.bg-gold')
      && !c.querySelector('img, video, iframe') ? found[0] : null;
  });
  return boxes.every(Boolean) ? boxes : null;
}

/**
 * Drops the `[[…]]` bracket tags from the text of `root` (an opening tag and the `]` that
 * closes it), keeping the text: the section style sets the size instead.
 */
function dropBracketTags(root) {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  let open = 0;
  let node = walker.nextNode();
  while (node) {
    let value = node.textContent.replace(/\[\[[a-z0-9,-]+\]/g, () => {
      open += 1;
      return '';
    });
    while (open > 0 && value.includes(']')) {
      value = value.replace(']', '');
      open -= 1;
    }
    node.textContent = value;
    node = walker.nextNode();
  }
}

/**
 * The content of one gold box, authored with plain formatting only: the figure that opens
 * a paragraph is Bold (stryker.com span.futura-bold, which the bold cleanup makes Bold +
 * Italic) on a line of its own (the source's <br> after it, which that cleanup drops), and
 * no size tags (the `gold-boxes` section style sets the 21px figure and 17.5px text).
 */
function goldBoxCell(component, doc) {
  const { nodes } = richTextNodes(component, doc);
  nodes.filter((node) => node.tagName === 'P').forEach((p) => {
    dropBracketTags(p);
    p.querySelectorAll('em > strong:only-child, strong > em:only-child').forEach((inner) => {
      const outer = inner.parentElement;
      const strong = doc.createElement('strong');
      strong.append(...inner.childNodes);
      outer.replaceWith(strong);
    });
    const lead = p.firstElementChild;
    const first = [...p.childNodes].find((n) => n.nodeType !== 3 || n.textContent.trim());
    if (!lead || first !== lead || lead.tagName !== 'STRONG') return;
    while (lead.lastChild && lead.lastChild.nodeName === 'BR') lead.lastChild.remove();
    const next = lead.nextSibling;
    if (next && next.nodeName !== 'BR') next.before(doc.createElement('br'));
    // no space at the start of a line
    p.querySelectorAll('br').forEach((br) => {
      const after = br.nextSibling;
      if (after && after.nodeType === 3) after.textContent = after.textContent.replace(/^\s+/, '');
    });
  });
  return nodes;
}

/**
 * The caption under a standalone video (.desc-content): its paragraphs, taken out of the
 * video component (the Video block parser keeps only the player); [] when it has none.
 */
function videoCaption(component) {
  const caption = component.querySelector('.desc-content');
  if (!caption) return [];
  // its paragraphs, and a subheading (.m-c-subheading-description h3, e.g. "Learn more about
  // the clinical and economic value of LATERA from Dr. Setzen." under the ENT study video)
  const nodes = [...caption.querySelectorAll('p, h2, h3, h4')].filter((p) => text(p));
  caption.remove();
  return nodes;
}

function imageNodes(component, doc) {
  const nodes = [...component.querySelectorAll('img')].flatMap((source) => {
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    const p = doc.createElement('p');
    p.append(img);
    // a linked image (a[href] around the img): its link alone on the next line, in a section
    // with the `image-link` style (scripts/corp.js makes the image clickable from it); the
    // link text is the image's alt, else the address (no text is made up)
    const sourceLink = source.closest('a[href]');
    if (!sourceLink) return [p];
    const href = absoluteAsset(sourceLink.getAttribute('href'));
    const a = doc.createElement('a');
    a.setAttribute('href', newTabHref(sourceLink, href));
    a.textContent = (source.getAttribute('alt') || '').trim() || href;
    const linkLine = doc.createElement('p');
    linkLine.append(a);
    p.imageLink = true;
    return [p, linkLine];
  });
  // the image's caption heading (.title-content h4.title, Futura bold under the image)
  // follows it as a Heading 4 (news-detail.css sets the source h4)
  if (nodes.length) {
    component.querySelectorAll('.title-content :is(h2, h3, h4, h5)').forEach((title) => {
      if (!text(title)) return;
      const h4 = doc.createElement('h4');
      h4.textContent = text(title);
      // a title linked like its image (a product category tile): the link, for xfColumns
      const titleLink = title.querySelector('a[href]');
      const imageLink = component.querySelector('a[href] img') && component.querySelector('a[href] img').closest('a');
      if (titleLink && imageLink && titleLink.getAttribute('href') === imageLink.getAttribute('href')) {
        h4.tileHref = newTabHref(titleLink, absoluteAsset(titleLink.getAttribute('href')));
      }
      nodes.push(h4);
    });
    // a caption line under the image (p.u-white-space-pre, body text on the source, e.g.
    // "Working together to clear the brush") follows it as a paragraph
    component.querySelectorAll('.c-standalone-image-content > p.u-white-space-pre').forEach((caption) => {
      if (!text(caption)) return;
      const p = doc.createElement('p');
      p.textContent = text(caption);
      nodes.push(p);
    });
  }
  return nodes;
}

function buttonNodes(component, doc) {
  return [...component.querySelectorAll('a[href]')].filter((a) => text(a)).map((source) => {
    const a = doc.createElement('a');
    a.setAttribute('href', newTabHref(source, absoluteAsset(source.getAttribute('href'))));
    a.textContent = text(source);
    // purple / blue source buttons (a.btn-purple, a.btn-blue): a bold link in a section with
    // the btn-purple / btn-blue style (authoring conventions); marked here, set on the section
    const colour = ['btn-purple', 'btn-blue'].find((cls) => source.classList.contains(cls));
    if (colour) a.setAttribute('data-btn-style', colour);
    const strong = doc.createElement('strong');
    if (source.classList.contains('btn-gold')) {
      const em = doc.createElement('em');
      em.append(a);
      strong.append(em);
    } else {
      strong.append(a);
    }
    const p = doc.createElement('p');
    p.append(strong);
    return p;
  });
}

/**
 * A large headline outside the slide: each non-empty line as a paragraph (a heading in a
 * line gives its text, not the heading). The line spans become divs first: cleanRichText
 * unwraps spans, which would empty them.
 */
function headlineNodes(component, doc) {
  const box = doc.createElement('div');
  box.innerHTML = component.innerHTML;
  const lines = [...box.querySelectorAll('.line')].map((line) => rename(line, 'div'));
  lines.forEach((line) => line.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(unwrap));
  cleanRichText(box);
  return (lines.length ? lines : [box]).map((line) => {
    if (!text(line)) return null;
    const p = doc.createElement('p');
    while (line.firstChild) p.append(line.firstChild);
    return p;
  }).filter(Boolean);
}

/**
 * A Large Headline in the one-third column next to a video (the col-sm-8 / col-sm-4
 * row of the StrykerTalks podcast pages), or null.
 */
function videoAside(video) {
  const col = video.closest('[class*="col-sm-8"], [class*="col-sm-6"]');
  const row = col && col.parentElement;
  // 2/3 video + 1/3 headline (podcasts), or a 50/50 row (e.g. Carolyn, headline first)
  const width = col && /\bcol-sm-6\b/.test(col.className) ? 6 : 4;
  const aside = row && [...row.children].find((el) => el !== col && new RegExp(`\\bcol-sm-${width}\\b`).test(el.className));
  const headline = aside && aside.querySelector('.c-largeheadline');
  return headline && text(headline) ? headline : null;
}

/**
 * Rich text in the one-third column next to a video (col-sm-8 + col-sm-4, no Large
 * Headline, e.g. Ellys' maxillofacial surgery story): a grey box first, then the quote.
 * Only text in the column. Returns the grey-box rich text, or null.
 */
function videoRichTextAside(video) {
  const col = video.closest('[class*="col-sm-8"]');
  const row = col && col.parentElement;
  const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-4\b/.test(el.className));
  if (!aside || aside.querySelector('.c-largeheadline, .c-marketo-form, img, video, iframe, [data-asset-path]')) return null;
  const first = aside.querySelector('.c-rich-text-editor');
  const box = first && first.querySelector('.has-background, [class*="bg-light-gray"]');
  return box && text(box) ? first : null;
}

/**
 * In default content Bold inside running text keeps the copy font, so a source Futura bold
 * run in a line of text (e.g. "I would like to say thank you…") becomes Bold + Italic, the
 * news-detail convention for Futura bold in text; a bold line on its own stays Bold.
 */
function boldInTextItalic(nodes, doc) {
  nodes.forEach((node) => node.querySelectorAll('strong').forEach((strong) => {
    if (strong.closest('em') || text(strong) === text(node)) return;
    const em = doc.createElement('em');
    strong.replaceWith(em);
    em.append(strong);
    // a space at either end of the run stays between the words, outside the formatting
    const first = strong.firstChild;
    const last = strong.lastChild;
    if (first && first.nodeType === 3 && /^[\s ]/.test(first.textContent)) {
      first.textContent = first.textContent.replace(/^[\s ]+/, '');
      em.before(doc.createTextNode(' '));
    }
    if (last && last.nodeType === 3 && /[\s ]$/.test(last.textContent)) {
      last.textContent = last.textContent.replace(/[\s ]+$/, '');
      em.after(doc.createTextNode(' '));
    }
  }));
}

/** The paragraphs of a grey-box rich text (the lead of a rich-text side column). */
function leadNodes(component) {
  const box = component.ownerDocument.createElement('div');
  box.innerHTML = component.innerHTML;
  cleanRichText(box);
  return [...box.querySelectorAll('p')].filter((p) => text(p));
}

/** The video of a 50/50 row whose Large Headline column comes first (e.g. Carolyn), or null. */
function headlineVideo(headline) {
  const col = headline.closest('[class*="col-sm-6"]');
  const row = col && col.parentElement;
  const videoCol = row && [...row.children].find((el) => el !== col && /\bcol-sm-6\b/.test(el.className));
  const video = videoCol && videoCol.querySelector('.c-standalone-video');
  return video && video.querySelector('[data-asset-path], iframe[src]') ? video : null;
}

/**
 * Article text in the other half of a col-sm-6 + col-sm-6 row next to a video (e.g. the
 * InsideOut podcast page), or null.
 */
function videoTextAside(video) {
  const col = video.closest('[class*="col-sm-6"]');
  const row = col && col.parentElement;
  const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-6\b/.test(el.className));
  const rte = aside && aside.querySelector('.c-rich-text-editor');
  if (!rte || !text(rte) || aside.querySelector('img, video, iframe, .c-standalone-video')) return null;
  // only text after the video (video left, e.g. InsideOut): text before it (the DE&I Summit
  // 2023 intro, quote box and text left of the video) is already in the article
  if ([...row.children].indexOf(aside) < [...row.children].indexOf(col)) return null;
  return rte;
}

/** The video + text row as `Columns (columns-50-50)` (the library's Video + text). */
function videoTextColumns(video, rte, doc) {
  const link = videoLink(video, doc);
  const { nodes } = richTextNodes(rte, doc);
  if (!link || !nodes.length) return null;
  const media = doc.createElement('p');
  media.append(link);
  const block = WebImporter.Blocks.createBlock(doc, {
    name: 'Columns (columns-50-50)',
    cells: [[media, nodes]],
  });
  // the text's copy style is the section's (e.g. the 1.25em copy beside the Ease video)
  const copy = nodes.map((n) => n.copyStyle).find((c) => c);
  return { block, copy };
}

/**
 * A quote Large Headline under the grey box (survivor stories: the quote, a rule, the
 * name, the role) as the library's Video + quote cell: gold quote marks →
 * `[[color-gold]` Bold + Italic `]`, Futura words → Bold, one paragraph per line (the
 * name a fully Bold paragraph).
 */
function quoteNodes(headline, doc, { sizes = false } = {}) {
  const box = doc.createElement('div');
  box.innerHTML = headline.innerHTML;
  // rich text (a rich-text side column, e.g. Ellys): a 1.25em run (the rule under the
  // quote, 26.25px) is the `[[text-1-25]…]` tag — the line breaks typed inside it go
  // after it first, innermost formatting first, so they stay out of the tag
  if (sizes) {
    box.querySelectorAll('.fontsize-1-25em').forEach((span) => {
      [span, ...span.querySelectorAll('*')].reverse().forEach((el) => {
        while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) {
          el.after(el.lastChild);
        }
      });
    });
    tagTextSize(box);
  }
  // a gold quote mark at the start or end of a longer bold run
  // (<span class=futura-bold><span style="color: rgb(255,181,0)">”</span>The first…</span>)
  // is a bold run of its own, so it can take the gold tag
  box.querySelectorAll('.futura-bold [style*="color"]').forEach((span) => {
    const bold = span.closest('.futura-bold');
    if (!GOLD.test(ownColour(span)) || !/^[“”"‘’']+$/.test(text(span)) || text(bold) === text(span)) return;
    const atStart = text(bold).startsWith(text(span));
    const mark = doc.createElement('span');
    mark.className = 'futura-bold';
    mark.append(span);
    if (atStart) bold.before(mark);
    else bold.after(mark);
  });
  tagGoldText(box);
  box.querySelectorAll('.futura-bold').forEach((span) => {
    const strong = doc.createElement('strong');
    while (span.firstChild) strong.append(span.firstChild);
    if (/^[“”"‘’']+$/.test(text(strong))) {
      const em = doc.createElement('em');
      em.append(strong);
      span.replaceWith(em);
    } else span.replaceWith(strong);
  });
  box.querySelectorAll('span, font').forEach(unwrap);
  box.querySelectorAll('strong strong').forEach(unwrap);
  // bold runs that touch are one run (two would merge on import and take the paragraph
  // breaks after them along)
  [...box.querySelectorAll('strong')].forEach((strong) => {
    if (!strong.parentNode) return;
    let next = strong.nextSibling;
    // the next bold run, maybe after a space
    const following = (node) => (node && node.nodeType === 3 && !node.textContent.trim() ? node.nextSibling : node);
    while (following(next) && following(next).nodeName === 'STRONG') {
      if (next.nodeType === 3) strong.append(next);
      const run = strong.nextSibling;
      while (run.firstChild) strong.append(run.firstChild);
      run.remove();
      next = strong.nextSibling;
    }
  });
  // a gold mark right against a Bold run goes inside it (<strong><em>“</em>I would…</strong>):
  // two touching emphasis runs would merge on import
  box.querySelectorAll('em').forEach((em) => {
    const mark = em.firstElementChild;
    if (!mark || mark.tagName !== 'STRONG' || em.childNodes.length !== 1) return;
    const next = em.nextSibling;
    const prev = em.previousSibling;
    const inner = doc.createElement('em');
    while (mark.firstChild) inner.append(mark.firstChild);
    if (next && next.nodeName === 'STRONG') {
      next.prepend(inner);
      em.remove();
    } else if (prev && prev.nodeName === 'STRONG') {
      prev.append(inner);
      em.remove();
    } else {
      mark.append(...inner.childNodes);
    }
  });
  // line breaks typed inside the bold belong after it
  [...box.querySelectorAll('em, strong')].reverse().forEach((el) => {
    while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) {
      el.after(el.lastChild);
    }
  });
  // a line break inside a bold run (the rule and the name in one run, e.g. Ellys:
  // <b>_____<br><br>Ellys</b>) splits it, so each line is a paragraph of its own
  box.querySelectorAll('strong').forEach((strong) => {
    if (!strong.querySelector(':scope > br')) return;
    const parts = [doc.createElement('strong')];
    [...strong.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') parts.push(node, doc.createElement('strong'));
      else parts[parts.length - 1].append(node);
    });
    strong.replaceWith(...parts.filter((part) => part.nodeName === 'BR' || text(part)));
  });
  const out = [];
  const blocks = box.querySelectorAll('p').length ? [...box.querySelectorAll('p')] : [box];
  blocks.forEach((block) => {
    let line = doc.createElement('p');
    const flush = () => {
      if (text(line)) out.push(line);
      line = doc.createElement('p');
    };
    [...block.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') flush();
      else line.append(node);
    });
    flush();
  });
  out.forEach((p) => p.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
  }));
  return out;
}

/** The video + headline row as `Columns (columns-67-33, large-headline, gray-lead)`. */
function videoHeadlineColumns(video, headline, doc, asideQuotes = [], ctas = [], asideCtas = [], mirrored = false) {
  const link = videoLink(video, doc);
  // no grey box in the headline column (only a quote, e.g. the last story of "When Stryker
  // employees…"): every headline there is a quote and the block has no gray-lead
  const boxed = !!headline.querySelector('.has-background, [class*="bg-light-gray"]');
  const quotes = boxed ? asideQuotes : [headline, ...asideQuotes];
  const lines = boxed ? headlineNodes(headline, doc) : [];
  if (!link || (boxed && !lines.length)) return null;
  const media = doc.createElement('p');
  media.append(link);
  // a button under the video: a Bold link on its own line in the wide cell
  const buttons = ctas.flatMap((cta) => buttonNodes(cta, doc));
  // a 2vw headline (28px at 1440px, e.g. Stiles) is the Heading 2 statement; a 1.5vw one
  // (21px, e.g. Heath) stays a paragraph, the large-headline text size
  const firstLine = headline.querySelector('.line') || headline;
  const big = firstLine.querySelector('[class*="fontsize-2vw"]')
    || !headline.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
  const statement = big && lines.length ? [rename(lines[0], 'h2'), ...lines.slice(1)] : lines;
  const half = /\bcol-sm-6\b/.test((video.closest('[class*="col-sm-"]') || video).className);
  return WebImporter.Blocks.createBlock(doc, {
    name: `Columns (${half ? 'columns-50-50' : 'columns-67-33'}, large-headline${boxed ? ', gray-lead' : ''})`,
    cells: [((mediaCell, textCell) => (mirrored ? [textCell, mediaCell] : [mediaCell, textCell]))(
      [media, ...buttons],
      [
        ...statement,
        ...quotes.flatMap((q) => quoteNodes(q, doc)),
        // a button in the narrow column (under the quote, e.g. Esley) stays there
        ...asideCtas.flatMap((cta) => buttonNodes(cta, doc)),
      ],
    )],
  });
}

/**
 * References authored as numbered paragraphs ("1: Author…", "2: …") become an ordered
 * list, so the article's citation superscripts link to them: scripts.js
 * decorateFootnotes links <sup>N</sup> to the Nth item of the last <ol> on the page.
 * Only a run numbered 1, 2, 3… in order is converted; the source's "N:" / "N." prefix is kept (the
 * list numbers the items). Other paragraphs (e.g. the document code) are left as they are.
 */
function footnoteList(nodes, doc) {
  const NUMBERED = /^\s*(\d+)\s*[:.)]\s*/;
  const out = [];
  let ol = null;
  nodes.forEach((node) => {
    const match = node.tagName === 'P' && node.textContent.match(NUMBERED);
    const next = ol ? ol.children.length + 1 : 1;
    if (match && Number(match[1]) === next) {
      if (!ol) {
        ol = doc.createElement('ol');
        out.push(ol);
      }
      // the source's own "1:" / "1." prefix stays in the text (references-spaced hides
      // the list marker), so each entry reads as on the source
      const li = doc.createElement('li');
      while (node.firstChild) li.append(node.firstChild);
      ol.append(li);
      return;
    }
    ol = null;
    out.push(node);
  });
  out.converted = out.some((node) => node.tagName === 'OL' && !nodes.includes(node));
  return out;
}

/*
 * Template news-detail-xf (import-news-xf.js): news articles whose body is an Experience
 * Fragment (XF). Everything below runs for that template only.
 */

// text that renders blank: braille / hangul fillers, left-to-right marks, &nbsp;
const BLANK = /[\s\u00a0\u00ad\u2800\u3164\u200e\u200b]/g;
const DIVIDER = /_{3,}/;

function fragmentBlock(path, doc) {
  const a = doc.createElement('a');
  a.setAttribute('href', path);
  a.textContent = path;
  return WebImporter.Blocks.createBlock(doc, { name: 'fragment', cells: [[a]] });
}

// each shared XF becomes a marker (`.xf-fragment[data-fragment]`) in place; the others are
// returned so the import report can list them
function markSharedFragments(main, doc) {
  const inlined = [];
  main.querySelectorAll('.experiencefragment').forEach((xf) => {
    if (!xf.isConnected || xf.closest('header, footer, .modal')) return;
    const signature = text(xf);
    // a signature opens the XF's text, or (a sentence of 40+ characters) sits anywhere in it:
    // an article body XF can open with its title or a video player's text
    const match = SHARED_XF_SIGNATURES.find(([start]) => signature.startsWith(start)
      || (start.length >= 40 && signature.includes(start)));
    const path = match && xfFragmentPath(match[1]);
    if (!path) {
      if (signature) inlined.push(signature.slice(0, 80));
      return;
    }
    const marker = doc.createElement('div');
    marker.className = 'xf-fragment';
    marker.setAttribute('data-fragment', path);
    xf.replaceWith(marker);
  });
  return inlined;
}

const gridNumber = (el, re) => {
  const m = (el.className || '').match(re);
  return m ? Number(m[1]) : null;
};
const gridColumns = (grid) => gridNumber(grid, /\baem-Grid--(\d+)\b/) || 12;
const itemSpan = (item, n) => gridNumber(item, /\baem-GridColumn--default--(\d+)\b/) || n;
const itemOffset = (item) => gridNumber(item, /\baem-GridColumn--offset--default--(\d+)\b/) || 0;
const gridItems = (grid) => [...grid.children].filter((el) => el.classList.contains('aem-GridColumn'));
const nestedGrid = (item) => item.querySelector(':scope > .aem-Grid');
const filled = (el) => !!el.querySelector('img') || !!(el.textContent || '').replace(BLANK, '');

// columns variant by the spans of two unequal filled cells (nearest existing variant)
const SPAN_VARIANTS = {
  '5/3': 'columns-67-33',
  '5/2': 'columns-67-33',
  '8/4': 'columns-67-33',
  '3/4': 'columns-33-67',
  '3/5': 'columns-33-67',
  '4/8': 'columns-33-67',
  '3/9': 'columns-33-67',
  '9/3': 'columns-75-25',
  '9/2': 'columns-75-25',
  // a small icon beside its text (e.g. the statistics of "Following in her mother's footsteps")
  '1/11': 'icon-text',
};

function spanVariant(spans) {
  // equal cells (and three or more) are the plain Columns layout
  if (spans.length !== 2 || spans[0] === spans[1]) return '';
  const known = SPAN_VARIANTS[spans.join('/')];
  if (known) return known;
  const ratio = spans[0] / (spans[0] + spans[1]);
  const [[, nearest]] = [[0.5, 'columns-50-50'], [2 / 3, 'columns-67-33'], [1 / 3, 'columns-33-67'], [0.75, 'columns-75-25']]
    .sort(([a], [b]) => Math.abs(a - ratio) - Math.abs(b - ratio));
  return nearest;
}

/**
 * A dimensional box (rich text in a `.dimensional-box` wrapper) inside a building block of
 * a column row cannot sit in a Columns cell as a block: the box and the items after it in
 * the building block move after the row (they follow it in the article).
 */
function liftDimensionalBox(item) {
  const box = item.querySelector('.dimensional-box');
  const boxItem = box && box.closest('.aem-GridColumn');
  if (!boxItem || boxItem === item) return [];
  const moved = [];
  for (let el = boxItem; el; el = el.nextElementSibling) {
    if (el.classList.contains('aem-GridColumn')) moved.push(el);
  }
  return moved;
}

/**
 * The AEM grid of an XF as rows: grid items fill a row up to the grid's column count
 * (offset + span); an item that wraps but has the narrow column's span joins that column
 * (the AEM grid floats it under the narrow cell, next to the taller wide one). A row with
 * two or more filled cells becomes a `.xf-columns` marker (cells `.xf-cell`, the variant in
 * data-variant); a row with one filled cell stays as it is, a building block in it is read
 * as a grid of its own. `fraction` is the grid's width share of the page column; a lone
 * image item gets data-xf-image-style (image-1-3 / image-1-2) from its share.
 */
function gridRows(grid, doc, fraction = 1) {
  const n = gridColumns(grid);
  const rows = [];
  let row = null;
  gridItems(grid).forEach((item) => {
    const span = itemSpan(item, n);
    const offset = itemOffset(item);
    if (row && row.used + offset + span <= n) {
      row.cells.push({ span, items: [item] });
      row.used += offset + span;
      return;
    }
    const last = row && row.cells[row.cells.length - 1];
    const others = row && row.cells.slice(0, -1).reduce((sum, cell) => sum + cell.span, 0);
    if (row && row.cells.length > 1 && span === last.span && row.cells[0].span !== span && others + span <= n) {
      last.items.push(item);
      return;
    }
    row = { used: offset + span, cells: [{ span, items: [item] }] };
    rows.push(row);
  });
  rows.forEach((r) => {
    const lifted = r.cells.length > 1 ? r.cells.flatMap((cell) => cell.items.flatMap(liftDimensionalBox)) : [];
    lifted.forEach((el) => el.setAttribute('data-xf-lifted', ''));
    const cells = r.cells.filter((cell) => cell.items.some((item) => {
      if (!lifted.length) return filled(item);
      const copy = item.cloneNode(true);
      copy.querySelectorAll('[data-xf-lifted]').forEach((el) => el.remove());
      return filled(copy);
    }));
    lifted.forEach((el) => el.removeAttribute('data-xf-lifted'));
    if (cells.length < 2) {
      r.cells.forEach((cell) => cell.items.forEach((item) => {
        const share = (fraction * cell.span) / n;
        const nested = nestedGrid(item);
        if (nested) gridRows(nested, doc, share);
        else if (item.querySelector('.c-standalone-image img')) {
          const style = (share <= 1 / 3 + 0.01 && 'image-1-3') || (share <= 0.5 + 0.01 && 'image-1-2') || '';
          if (style) item.querySelector('.c-standalone-image').setAttribute('data-xf-image-style', style);
        }
      }));
      return;
    }
    const marker = doc.createElement('div');
    marker.className = 'xf-columns';
    const spans = cells.map((cell) => cell.span);
    marker.setAttribute('data-variant', spanVariant(spans));
    // equal cells that leave the row part empty (4 + 4 of 12) keep their width: empty cells
    const pad = spans.every((s) => s === spans[0]) ? Math.floor(n / spans[0]) - cells.length : 0;
    r.cells[0].items[0].before(marker);
    cells.forEach((cell) => {
      const div = doc.createElement('div');
      div.className = 'xf-cell';
      div.append(...cell.items);
      marker.append(div);
    });
    for (let i = 0; i < pad; i += 1) {
      const div = doc.createElement('div');
      div.className = 'xf-cell';
      marker.append(div);
    }
    marker.after(...lifted);
  });
}

/** A paragraph-level element of a rich text: <p> or a leaf <div>. */
const paragraphsOf = (root) => [...root.querySelectorAll('.c-rich-text-editor p, .c-rich-text-editor div')]
  .filter((el) => el.tagName === 'P' || !el.querySelector('p, div, ul, ol, h1, h2, h3, h4, h5, h6, table'));
const ruleText = (el) => (el.textContent || '').replace(/_{3,}/g, '').replace(BLANK, ' ').replace(/\s+/g, ' ').trim();
const isDividerOnly = (el) => !!el && DIVIDER.test(el.textContent) && !ruleText(el);

/** True when the outermost `selector` elements of `el` hold all of its (non-divider) text. */
function coveredBy(el, selector) {
  const all = ruleText(el).replace(/\s/g, '');
  const styled = [...el.querySelectorAll(selector)].filter((s) => !s.parentElement.closest(selector))
    .map(ruleText).join('').replace(/\s/g, '');
  return !!all && styled === all;
}

/** The "____" line drawn under a title (inside it or the next paragraph): {gold, remove} or null. */
function titleDivider(p) {
  const holder = DIVIDER.test(p.textContent) ? p : (isDividerOnly(p.nextElementSibling) && p.nextElementSibling);
  if (!holder) return null;
  const walker = p.ownerDocument.createTreeWalker(holder, 4);
  const lines = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (DIVIDER.test(node.textContent) && /^[\s_\u00a0]*$/.test(node.textContent)) lines.push(node);
  }
  if (!lines.length) return null;
  const gold = [...lines].some((line) => {
    for (let e = line.parentElement; e && e !== holder.parentElement; e = e.parentElement) {
      if (ownColour(e)) return GOLD.test(ownColour(e));
    }
    return false;
  });
  return { gold, remove: () => (holder === p ? lines.forEach((l) => l.remove()) : holder.remove()) };
}

/** A heading `tag` with the title's text; underlined (gold rule `[[rule-gold]…]`) when ruled. */
function titleHeading(p, tag, divider, doc) {
  const h = doc.createElement(tag);
  const value = ruleText(p);
  if (!divider) {
    h.textContent = value;
    return h;
  }
  const u = doc.createElement('u');
  u.textContent = divider.gold ? `[[rule-gold]${value}]` : value;
  h.append(u);
  return h;
}

/**
 * Feature titles drawn as styled paragraphs (corp news typography, #441): with no page
 * title, the first Futura bold paragraph at 2em / 2.5em is the h1; a Futura bold paragraph
 * with a "____" divider line under it is an underlined h2 (the gold rule for a gold line).
 * Returns the h1 (taken out of the article) or null.
 */
function featureTitles(main, doc, hasTitle) {
  let h1 = null;
  paragraphsOf(main).forEach((p) => {
    if (!p.isConnected || !ruleText(p) || !p.querySelector('.futura-bold')) return;
    const divider = titleDivider(p);
    const big = coveredBy(p, '.fontsize-2em, .fontsize-2-5em');
    if (!hasTitle && !h1 && big) {
      h1 = titleHeading(p, 'h1', divider, doc);
      if (divider) divider.remove();
      p.remove();
      return;
    }
    if (!divider || !coveredBy(p, '.futura-bold')) return;
    const h2 = titleHeading(p, 'h2', divider, doc);
    divider.remove();
    p.replaceWith(h2);
  });
  return h1;
}

/** Section titles and rich texts with no visible text (blank fillers, &nbsp; spacers) go. */
function dropBlankComponents(main) {
  main.querySelectorAll('.c-section-title, .c-rich-text-editor').forEach((el) => {
    if (!filled(el)) el.remove();
  });
}

/**
 * Rich-text paragraphs that open with a line break (a blank first line) lose it, and a
 * <sup> between two runs of the same font size joins them (one size for the paragraph).
 */
function tidyParagraphs(main) {
  main.querySelectorAll('.experiencefragment .c-rich-text-editor sup').forEach((sup) => {
    const before = sup.previousSibling;
    const after = sup.nextSibling;
    const size = before && before.nodeType === 1 && [...before.classList].find((c) => c.startsWith('fontsize-'));
    if (!size || !after || after.nodeType !== 1 || !after.classList.contains(size)) return;
    before.append(sup, ...after.childNodes);
    after.remove();
  });
  main.querySelectorAll('.experiencefragment .c-rich-text-editor p').forEach((p) => {
    // a paragraph set in one size over several runs (spans per font) is one size span
    const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
    const sizes = new Set([...p.querySelectorAll('[class*="fontsize-"]')]
      .flatMap((el) => [...el.classList].filter((c) => c.startsWith('fontsize-'))));
    sizes.forEach((size) => {
      const runs = [...p.querySelectorAll(`.${size}`)].filter((el) => !el.parentElement.closest(`.${size}`));
      if (runs.length < 2 || squash(runs.map((el) => el.textContent).join('')) !== squash(p.textContent)) return;
      runs.forEach((el) => el.classList.remove(size));
      const span = p.ownerDocument.createElement('span');
      span.className = size;
      span.append(...p.childNodes);
      p.append(span);
    });
    const walker = p.ownerDocument.createTreeWalker(p, 5);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === 1 && node.tagName === 'BR') {
        node.remove();
        return;
      }
      if (node.nodeType === 3 ? node.textContent.trim() : node.tagName !== 'SPAN') return;
    }
  });
}

/** The nodes of one Columns cell: its components in source order. */
function cellNodes(cell, doc) {
  const selector = COMPONENTS;
  return [...cell.querySelectorAll(selector)]
    .filter((el) => !el.parentElement.closest(selector))
    .flatMap((component) => {
      if (component.matches('.c-rich-text-editor')) return richTextNodes(component, doc).nodes;
      if (component.matches('.c-standalone-image')) return imageNodes(component, doc);
      if (component.matches('.c-curatedcta, .buttonset')) return buttonNodes(component, doc);
      if (component.matches('.c-largeheadline, .c-section-title')) return headlineNodes(component, doc);
      return [];
    });
}

/**
 * A `.xf-columns` marker → { block, style }: a Columns block (the row's variant, plus
 * media-pair when a cell holds a linked image, so the image is clickable) and the copy
 * style of its longest text as the section style.
 */
function xfColumns(marker, doc) {
  const cells = [...marker.children].map((cell) => cellNodes(cell, doc));
  const nodes = cells.flat();
  // every cell a product category tile (a linked image and the same link on its title):
  // product-tiles, the title keeping its link
  const tiles = cells.length > 1 && cells.every((c) => c.some((node) => node.tileHref));
  if (tiles) {
    nodes.filter((node) => node.tileHref).forEach((h4) => {
      const a = doc.createElement('a');
      a.setAttribute('href', h4.tileHref);
      a.append(...h4.childNodes);
      h4.append(a);
    });
  }
  // icon-text: the source's black Futura bold lead-in ("83%", "Half") is plain Bold in the
  // cell (Bold + Italic there is the gold label), unless it sits in a colour tag
  if (marker.getAttribute('data-variant') === 'icon-text') {
    nodes.filter((node) => node.nodeType === 1).forEach((node) => {
      node.querySelectorAll('em > strong:only-child, strong > em:only-child').forEach((inner) => {
        const outer = inner.parentElement;
        const before = outer.previousSibling;
        if (before && before.nodeType === 3 && /\[\[color-[a-z]+\]$/.test(before.textContent)) return;
        const strong = doc.createElement('strong');
        strong.append(...inner.childNodes);
        outer.replaceWith(strong);
      });
    });
  }
  const linkVariant = tiles ? 'product-tiles' : 'media-pair';
  const variants = [marker.getAttribute('data-variant'), nodes.some((node) => node.imageLink) ? linkVariant : '']
    .filter(Boolean);
  const name = variants.length ? `Columns (${variants.join(', ')})` : 'Columns';
  const copy = nodes.filter((node) => node.copyStyle !== undefined && node.copyStyle !== null)
    .sort((a, b) => text(b).length - text(a).length)[0];
  const style = copy ? copy.copyStyle : '';
  // 1.25em copy in a cell of other-size copy (e.g. a quote beside the article): the
  // `[[text-1-25]…]` bracket tag, the only size with an inline tag
  nodes.forEach((node) => {
    if (!(node.copyStyle || '').split(', ').includes('p-1-25') || style.split(', ').includes('p-1-25')) return;
    const lines = node.matches('ul, ol') ? [...node.querySelectorAll('li')] : [node];
    lines.filter((line) => line.matches('p, li') && text(line)).forEach((line) => {
      line.prepend(doc.createTextNode('[[text-1-25]'));
      line.append(doc.createTextNode(']'));
    });
  });
  const block = WebImporter.Blocks.createBlock(doc, { name, cells: [cells.map((c) => (c.length ? c : ''))] });
  return { block, style };
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const templateName = payload && payload.template && payload.template.name;
  if (templateName !== 'news-detail' && templateName !== 'news-detail-xf') return;
  const xf = templateName === 'news-detail-xf';
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;
  spacedSubheadTexts = rawSpacedSubheads(payload && payload.html);
  const componentSelector = xf ? `${COMPONENTS}, .xf-columns, .xf-fragment` : COMPONENTS;

  const inlinedXf = markSharedFragments(main, doc);
  const hasForm = !!main.querySelector('.c-marketo-form form[data-marketo-form-id]');
  const sections = [];
  let current = null;
  let separatorNext = false;
  // a blank line the source leaves under a component (e.g. the empty last list of a
  // Curated Link List): the next section gets `blank-above`
  let blankNext = false;
  const startSection = (kind, sectionStyle) => {
    const style = [separatorNext ? 'separator' : '', sectionStyle, blankNext ? 'blank-above' : '']
      .filter(Boolean).join(', ') || undefined;
    separatorNext = false;
    blankNext = false;
    current = { kind, style, nodes: [] };
    sections.push(current);
    return current;
  };

  // 1. title section
  const title = startSection('title');
  const h1 = main.querySelector('.h1-title h1');
  const hasTitle = !!(h1 && text(h1));
  if (hasTitle) {
    const heading = doc.createElement('h1');
    heading.innerHTML = h1.innerHTML;
    cleanRichText(heading);
    title.nodes.push(heading);
  }
  // the publish date below the title ("03-Apr-2020") is the `first-published` page
  // metadata (YYYY-MM-DD; import-news-detail.js), shown by templates/news-detail/news-detail.js
  const date = main.querySelector('.c-publish-date h5');
  if (date && text(date)) {
    const value = text(date);
    const m = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    const month = m && 'janfebmaraprmayjunjulaugsepoctnovdec'.indexOf(m[2].toLowerCase()) / 3 + 1;
    element.setAttribute('data-first-published', month >= 1 && Number.isInteger(month)
      ? `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`
      : value);
  }
  // the event location below the date ("Kalamazoo, MI, USA"), an H5 line of its own too
  const location = main.querySelector('.c-event-location-properties h5');
  if (location && text(location)) {
    const h5 = doc.createElement('h5');
    h5.textContent = location.textContent.replace(/[\s ]+/g, ' ').replace(/\s+,/g, ',').trim();
    title.nodes.push(h5);
  }

  // the article body is an XF: shared XFs → fragment markers, blank components go, styled
  // titles → headings, the XF grid rows → Columns markers
  if (xf) {
    dropBlankComponents(main);
    tidyParagraphs(main);
    const feature = featureTitles(main, doc, hasTitle);
    if (feature) title.nodes.push(feature);
    main.querySelectorAll('.experiencefragment').forEach((fragment) => {
      const grid = fragment.querySelector('.aem-Grid');
      if (grid && !fragment.closest('header, footer, .modal')) gridRows(grid, doc);
    });
  }

  // 2.-3. lead media and article components, in source order (outermost only; a
  // slide's own image and headline belong to the carousel)
  const components = [...main.querySelectorAll(componentSelector)].filter((el) => {
    const parent = el.parentElement && el.parentElement.closest(componentSelector);
    return !parent && !el.closest('header, footer, .modal');
  });

  const consumed = new Set();
  // a video with a Large Headline column beside it, video on the left of a 2/3 + 1/3 row:
  // the Video block, then the column as default content beside it in a `video-text`
  // section — `headline-1-5vw` (the Large Headline text sizes), `background: light-gray`
  // for the grey box (its first line a Heading 2 statement when the source sets it at
  // 2vw); a button under the video opens the text, right after the video
  const videoHeadlineRow = (video, headline, quotes, ctas, asideCtas) => {
    const boxed = !!headline.querySelector('.has-background, [class*="bg-light-gray"]');
    const lead = boxed ? headlineNodes(headline, doc) : [];
    if (boxed && !lead.length) return false;
    const firstLine = headline.querySelector('.line') || headline;
    const big = firstLine.querySelector('[class*="fontsize-2vw"]')
      || !headline.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
    const statement = big && lead.length ? [rename(lead[0], 'h2'), ...lead.slice(1)] : lead;
    const nodes = [
      ...statement,
      ...(boxed ? quotes : [headline, ...quotes]).flatMap((q) => quoteNodes(q, doc)),
      ...asideCtas.flatMap((cta) => buttonNodes(cta, doc)),
    ];
    boldInTextItalic(nodes, doc);
    [headline, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
    element.setAttribute('data-news-theme', 'full-width');
    const section = startSection('video-text', 'video-text, headline-1-5vw');
    if (boxed) section.background = 'light-gray';
    // a button under the video comes right after it, before the text (source order: on
    // phones video, button, text; from 900px the template keeps it under the video)
    section.nodes.push(video, ...ctas.flatMap((cta) => buttonNodes(cta, doc)), ...nodes);
    current = null;
    return true;
  };
  // a video with a Large Headline column beside it (2/3 + 1/3 or 50/50):
  // Columns (…, large-headline, gray-lead) in a section of its own; true when built
  const videoRowColumns = (video) => {
    const aside = videoAside(video);
    if (!aside) return false;
    // further Large Headlines in the headline column (a quote) and buttons in either column
    const asideCol = aside.closest('[class*="col-sm-"]');
    const quotes = [...asideCol.querySelectorAll('.c-largeheadline')].filter((h) => h !== aside && text(h));
    const videoCol = video.closest('[class*="col-sm-"]');
    const ctas = [...videoCol.querySelectorAll('.c-curatedcta')].filter((c) => text(c));
    const asideCtas = [...asideCol.querySelectorAll('.c-curatedcta')].filter((c) => text(c));
    // the headline column first in the source row (e.g. Carolyn): the text cell comes first
    const cols = [...asideCol.parentElement.children];
    const mirrored = cols.indexOf(asideCol) < cols.indexOf(videoCol);
    // the video on the left of a 2/3 + 1/3 row (e.g. Bob, Matt): the Video block and the
    // headline column as default content beside it (video-text); a 50/50 or mirrored row
    // (e.g. Carolyn) stays Columns
    if (!/\bcol-sm-6\b/.test(videoCol.className) && !mirrored) {
      return videoHeadlineRow(video, aside, quotes, ctas, asideCtas);
    }
    const columns = videoHeadlineColumns(video, aside, doc, quotes, ctas, asideCtas, mirrored);
    if (!columns) return false;
    [aside, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
    // the source runs the title and small print full width on these pages too: the
    // import script sets `theme: full-width` (templates/news-detail/news-detail-themes.css)
    element.setAttribute('data-news-theme', 'full-width');
    startSection('columns').nodes.push(columns);
    current = null;
    return true;
  };
  // a video with rich text in the one-third column beside it (e.g. Ellys): the Video block,
  // then the text as default content beside it, in a `video-text` section. The source
  // copy's serif and fixed sizes are section styles (serif; p-1-5, 1.5em; quote-1-75, the
  // 1.75em quote) and the grey box its `light-gray` background; true when built
  const videoRichTextRow = (video) => {
    const lead = videoRichTextAside(video);
    if (!lead) return false;
    const asideCol = lead.closest('[class*="col-sm-"]');
    const quotes = [...asideCol.querySelectorAll('.c-rich-text-editor')].filter((c) => c !== lead && text(c));
    const nodes = [...leadNodes(lead), ...quotes.flatMap((q) => quoteNodes(q, doc, { sizes: true }))];
    if (!nodes.length) return false;
    boldInTextItalic(nodes, doc);
    [lead, ...quotes].forEach((c) => consumed.add(c));
    element.setAttribute('data-news-theme', 'full-width');
    const style = [
      'video-text',
      asideCol.querySelector('.urw-egyptienne') && 'serif',
      lead.querySelector('.fontsize-1-5em') && 'p-1-5',
      quotes.some((q) => q.querySelector('.fontsize-1-75em')) && 'quote-1-75',
    ].filter(Boolean).join(', ');
    const section = startSection('video-text', style);
    section.background = 'light-gray';
    section.nodes.push(video, ...nodes);
    current = null;
    return true;
  };
  // the other column(s) of a form's 2/3 + 1/3 (or 50/50) row: the contact aside. Its
  // components go after the form in the form's section, whichever column comes first.
  const formAsides = new Map();
  components.filter((el) => el.matches('.c-marketo-form') && el.querySelector('form[data-marketo-form-id]')).forEach((form) => {
    const formColumn = form.closest('[class*="col-sm-"]');
    const row = formColumn && formColumn.parentElement;
    if (!row || !row.closest('.colctrl')) return;
    const asides = components.filter((el) => el !== form && !el.contains(form) && !formColumn.contains(el)
      && [...row.children].some((col) => col !== formColumn && col.contains(el)));
    asides.forEach((aside) => consumed.add(aside));
    formAsides.set(form, asides);
  });
  // a form page whose source has no H1 (the title only sits in the lead carousel): the
  // carousel's single headline line becomes the H1 (hero-image-slide.js keeps headings)
  if (hasForm && !main.querySelector('h1')) {
    const lines = [...main.querySelectorAll('.c-autocarousel .carouselslide:not(.slick-cloned) .overlayparsys .line')]
      .filter((line) => text(line));
    if (lines.length === 1) {
      lines[0].querySelectorAll('a:not([href])').forEach(unwrap);
      rename(lines[0], 'h1');
    }
  }
  // a lead image placed directly below the date (not in a column layout) starts 15px
  // below it on the source: no spacer then
  let leadBelowDate = false;
  let fullWidthLead = false;
  components.forEach((component) => {
    if (consumed.has(component)) return;
    const isFirst = current === title;
    // a photo (and its caption) beside article text in a 1/3 + 2/3 or 1/2 + 1/2 row:
    // Columns (33-67 / 67-33 / 50-50), the photo and caption in one cell, the text in the
    // other, with plain formatting only (no tags; news-detail.css sizes a caption and keeps
    // Bold lead-ins in the body font); the section takes the text's copy style
    const split = !isFirst && component.matches('.c-standalone-image, .c-rich-text-editor') && photoTextRow(component);
    if (split) {
      [split.photo, split.caption, ...split.texts].filter(Boolean).forEach((c) => consumed.add(c));
      const textNodes = split.texts.flatMap((t) => richTextNodes(t, doc).nodes);
      // the copy style of the longest text (as in xfColumns): a serif bold label opening the
      // column (e.g. "Help protect your patients and OR staff") does not set the body's font
      const copy = textNodes.filter((n) => n.copyStyle !== undefined && n.copyStyle !== null)
        .sort((a, b) => text(b).length - text(a).length).map((n) => n.copyStyle)[0];
      const photo = [...imageNodes(split.photo, doc), ...(split.caption ? richTextNodes(split.caption, doc).nodes : [])];
      [...photo, ...textNodes].forEach((n) => n.nodeType === 1 && dropBracketTags(n));
      const cells = split.photoFirst ? [photo, textNodes] : [textNodes, photo];
      startSection('columns', copy || undefined).nodes.push(WebImporter.Blocks.createBlock(doc, { name: split.name, cells: [cells] }));
      current = null;
      return;
    }
    // a row of equal text columns (each one rich text, or empty: e.g. the ProCuity key
    // features, two per col-md-4 row): Columns, one text per cell, empty cells keeping widths
    const texts = !isFirst && component.matches('.c-rich-text-editor') && textRow(component);
    if (texts) {
      texts.filter((t) => t !== 'empty').forEach((t) => consumed.add(t));
      const cells = texts.map((t) => (t === 'empty' ? '' : richTextNodes(t, doc).nodes));
      const copy = cells.flat().map((n) => n && n.copyStyle).find((c) => c);
      cells.flat().forEach((n) => n && n.nodeType === 1 && dropBracketTags(n));
      startSection('columns', copy || undefined).nodes.push(WebImporter.Blocks.createBlock(doc, { name: 'Columns', cells: [cells] }));
      current = null;
      return;
    }
    if (component.matches('.xf-fragment')) {
      startSection('fragment').nodes.push(fragmentBlock(component.getAttribute('data-fragment'), doc));
      current = null;
      return;
    }
    if (component.matches('.xf-columns')) {
      const { block, style } = xfColumns(component, doc);
      // consecutive rows with the same copy style (e.g. Q&A rows) share a section
      if (!current || current.kind !== 'xf-columns' || current.copy !== style) {
        startSection('xf-columns', style || undefined).copy = style;
      }
      current.nodes.push(block);
      return;
    }
    // a rich text in a dimensional box (a white shadow box, e.g. the pull quotes of the
    // incontinence prevalence article): Panel (left)
    if (component.matches('.c-rich-text-editor') && component.querySelector('.dimensional-box')) {
      const { nodes } = richTextNodes(component, doc);
      if (!nodes.length) return;
      const copy = nodes.find((node) => node.copyStyle);
      startSection('panel', copy ? copy.copyStyle : undefined).nodes.push(
        WebImporter.Blocks.createBlock(doc, { name: 'Panel (left)', cells: [[nodes]] }),
      );
      current = null;
      return;
    }
    if (component.matches('.c-autocarousel')) {
      if (!component.querySelector('img')) return;
      startSection('hero').nodes.push(component);
      current = null;
      return;
    }
    if (component.matches('.fullWidthImage')) {
      // the desktop image (picture source ≥840px) then a different phone image (img src),
      // in a `full-width-image` section (news-detail.css); its text box's text, if any,
      // follows as a paragraph
      const img = component.querySelector('img');
      if (!img) return;
      const source = component.querySelector('source[srcset]');
      const desktop = (source && source.getAttribute('srcset')) || img.getAttribute('src');
      const nodes = [...new Set([desktop, img.getAttribute('src')])].filter(Boolean).map((src) => {
        const image = doc.createElement('img');
        image.setAttribute('src', src);
        image.setAttribute('alt', img.getAttribute('alt') || '');
        const p = doc.createElement('p');
        p.append(image);
        return p;
      });
      const box = component.querySelector('.textBoxId');
      if (box && text(box)) {
        const p = doc.createElement('p');
        p.textContent = text(box);
        nodes.push(p);
      }
      // (the source keeps its empty lead image / text containers above it: a spacer under
      // the date, e.g. Eli's photo 66px below the date at 1440px)
      if (isFirst) fullWidthLead = true;
      startSection('image', 'full-width-image').nodes.push(...nodes);
      current = null;
      return;
    }
    if (component.matches('.c-standalone-image')) {
      // a row of photos (one image per column, nothing else): Columns, one image per cell,
      // in a section of its own (news-detail-themes.css lays it out as the source on
      // full-width pages)
      const row = !isFirst && imageRow(component);
      if (row) {
        row.filter((image) => image !== 'empty').forEach((image) => consumed.add(image));
        const cells = row.map((image) => (image === 'empty' ? '' : imageNodes(image, doc)));
        startSection('columns').nodes.push(WebImporter.Blocks.createBlock(doc, { name: 'Columns', cells: [cells] }));
        current = null;
        return;
      }
      const nodes = imageNodes(component, doc);
      if (!nodes.length) return;
      const linkStyle = nodes.some((node) => node.imageLink) ? 'image-link' : '';
      // the lead image, or an image in a narrow source column, is a section of its own
      const columnStyle = imageColumnStyle(component) || component.getAttribute('data-xf-image-style') || '';
      if (isFirst && !component.closest('.colctrl')) leadBelowDate = true;
      if (isFirst || columnStyle) {
        const style = [columnStyle, linkStyle].filter(Boolean).join(', ');
        startSection(isFirst ? 'lead' : 'image', style || undefined).nodes.push(...nodes);
        current = null;
        return;
      }
      // an image joins the article section it follows, whatever its copy size
      if (!current || !current.kind.startsWith('body')) startSection('body');
      if (linkStyle && !(current.style || '').split(', ').includes(linkStyle)) {
        current.style = [current.style, linkStyle].filter(Boolean).join(', ');
      }
      current.nodes.push(...nodes);
      return;
    }
    // the importer drops <hr> elements before the transform, so the rule is also found by
    // its AEM wrapper (.sectionseparator)
    if (component.matches('.c-section-separator, .sectionseparator')) {
      // a horizontal rule between parts of the article (e.g. before "About AVS"): the
      // next section starts with it — `separator` section style (1px grey rule on top).
      // (A section holding only the rule would be dropped by the importer.)
      separatorNext = true;
      current = null;
      return;
    }
    if (component.matches('.c-section-title') && text(component)) {
      // a section title (.component-subheading, e.g. "This year's goal" on the DE&I Summit
      // 2023 feature: Futura bold with the grey rule under it): an underlined Heading 2
      // (authoring conventions), in the article text around it
      const h2 = doc.createElement('h2');
      const u = doc.createElement('u');
      u.textContent = text(component.querySelector('h1, h2, h3, h4') || component);
      h2.append(u);
      if (!current || !current.kind.startsWith('body')) startSection('body');
      current.nodes.push(h2);
      return;
    }
    if (component.matches('.c-customizeable, .c-latestnews')) {
      // related-content cards: own full-width section — its heading as default
      // content, the grid left for the cards-corp-teaser parser
      if (!component.querySelector('.item img')) return;
      const section = startSection('cards');
      const heading = component.querySelector('h2');
      if (heading && text(heading)) {
        const h2 = doc.createElement('h2');
        h2.textContent = text(heading);
        section.nodes.push(h2);
        heading.remove();
      }
      section.nodes.push(component);
      current = null;
      return;
    }
    // a Marketo form: its own section; the content of the other column of its 2/3 + 1/3
    // row (the contact aside: a shared fragment, kept as a link and never copied, or
    // inline text / images) goes after it in the same section, which gets the
    // `form-with-aside` style
    if (component.matches('.c-marketo-form')) {
      if (!component.querySelector('form[data-marketo-form-id]')) return;
      const nodes = [component];
      (formAsides.get(component) || []).forEach((aside) => {
        if (aside.matches('.xf-fragment')) nodes.push(fragmentBlock(aside.getAttribute('data-fragment'), doc));
        else if (aside.matches('.c-standalone-image')) nodes.push(...imageNodes(aside, doc));
        else if (aside.matches('.c-rich-text-editor')) nodes.push(...richTextNodes(aside, doc).nodes);
        else if (aside.matches('.c-curatedcta')) nodes.push(...buttonNodes(aside, doc));
        else if (aside.matches('.c-largeheadline')) nodes.push(...headlineNodes(aside, doc));
      });
      startSection('form', nodes.length > 1 ? 'form-with-aside' : undefined).nodes.push(...nodes);
      current = null;
      return;
    }
    // a Resources & Download list on a form page (LCA0): kept as default content, its
    // heading and one link per item (the thumbnail is dropped). On other pages (e.g. the
    // Mutual Aid ProCare case study) it is a section of its own: its heading underlined
    // (the grey rule, authoring conventions), the list left for the cards-corp-resources
    // parser (Cards Corp (resources): cover image + Heading 5 link per download)
    // an Accordion: its heading (.component-subheading, e.g. "FAQs") as a Heading 3, then
    // the Accordion block, one row per panel (title | its rich text), plain formatting
    // only; the section takes the copy style of the panel text (e.g. `p-1-25`)
    // a Curated Link List: its links as a list in a section of its own with the
    // `link-list` style (news-detail.css: no bullets, plain links, 15px apart)
    if (component.matches('.c-curated-link-list')) {
      const links = [...component.querySelectorAll('li a[href]')].filter((a) => text(a));
      if (!links.length) return;
      const ul = doc.createElement('ul');
      links.forEach((source) => {
        const li = doc.createElement('li');
        const a = doc.createElement('a');
        a.setAttribute('href', newTabHref(source, absoluteAsset(source.getAttribute('href'))));
        a.textContent = text(source);
        li.append(a);
        ul.append(li);
      });
      startSection('link-list', 'link-list').nodes.push(ul);
      // an empty list item after the links (<li><a> </a></li>, e.g. under "Learn more" on
      // the LUCAS article) is a blank line above whatever follows
      blankNext = [...component.querySelectorAll('li')].some((li) => !text(li));
      current = null;
      return;
    }
    if (component.matches('.c-accordion')) {
      const rows = [...component.querySelectorAll('.panel')].map((panel) => {
        const title = text(panel.querySelector('.panel-title'));
        const body = [...panel.querySelectorAll('.panel-body .c-rich-text-editor')]
          .flatMap((rte) => richTextNodes(rte, doc).nodes);
        body.forEach((n) => n.nodeType === 1 && dropBracketTags(n));
        return title && body.length ? { title, body } : null;
      }).filter(Boolean);
      if (!rows.length) return;
      const nodes = [];
      const heading = component.querySelector('.component-subheading');
      if (heading && text(heading)) {
        const h3 = doc.createElement('h3');
        h3.textContent = text(heading);
        nodes.push(h3);
      }
      nodes.push(WebImporter.Blocks.createBlock(doc, {
        name: 'Accordion',
        cells: rows.map((row) => [row.title, row.body]),
      }));
      const copy = rows.flatMap((row) => row.body).map((n) => n.copyStyle).find((c) => c);
      startSection('accordion', copy || undefined).nodes.push(...nodes);
      current = null;
      return;
    }
    if (component.matches('.c-resourcesanddownload')) {
      if (!hasForm) {
        if (!component.querySelector('.item img')) return;
        const section = startSection('cards');
        const heading = component.querySelector('.title-container :is(h2, h3, h4)');
        if (heading && text(heading)) {
          const h2 = doc.createElement('h2');
          const u = doc.createElement('u');
          u.textContent = text(heading);
          h2.append(u);
          section.nodes.push(h2);
          heading.remove();
        }
        section.nodes.push(component);
        current = null;
        return;
      }
      const nodes = [];
      const heading = component.querySelector('.title-container h2');
      if (heading && text(heading)) {
        const h2 = doc.createElement('h2');
        h2.textContent = text(heading);
        nodes.push(h2);
      }
      component.querySelectorAll('.item').forEach((item) => {
        const link = item.querySelector('a[href]');
        const label = text(item.querySelector('.title') || item);
        if (!link || !label) return;
        const a = doc.createElement('a');
        a.href = newTabHref(link, absoluteAsset(link.getAttribute('href')));
        a.textContent = label;
        const p = doc.createElement('p');
        p.append(a);
        nodes.push(p);
      });
      if (!nodes.length) return;
      if (!current || current.kind !== 'body') startSection('body');
      current.nodes.push(...nodes);
      return;
    }
    // a shared Experience Fragment (e.g. the "Connect with us" band): a fragment block in
    // a section of its own
    if (component.matches('.xf-fragment')) {
      startSection('fragment').nodes.push(fragmentBlock(component.getAttribute('data-fragment'), doc));
      current = null;
      return;
    }
    // a 50/50 row whose Large Headline column comes before the video: build the row now
    if (component.matches('.c-largeheadline') && headlineVideo(component) && !consumed.has(headlineVideo(component))) {
      const video = headlineVideo(component);
      if (videoRowColumns(video)) {
        consumed.add(video);
        return;
      }
    }
    if (component.matches('.c-standalone-video')) {
      if (!component.querySelector('[data-asset-path], iframe[src]')) return;
      if (videoRowColumns(component)) return;
      if (videoRichTextRow(component)) return;
      // a video with article text in the other half of the row: Columns (columns-50-50)
      const textAside = videoTextAside(component);
      const textColumns = textAside && videoTextColumns(component, textAside, doc);
      if (textColumns) {
        consumed.add(textAside.closest(COMPONENTS) || textAside);
        // the source row spans the whole container (e.g. InsideOut): full-width theme
        element.setAttribute('data-news-theme', 'full-width');
        startSection('columns', textColumns.copy || undefined).nodes.push(textColumns.block);
        current = null;
        return;
      }
      // a video in a narrow source column (the other column empty) is a section of its
      // own with the image column style, which caps the video block as well
      // the video's caption (.desc-content, e.g. Derrick Mosley's story under the survivor
      // video) follows it in a section of its own with the `join` style: right under the
      // player, not a section gap below it (the Video block parser keeps only the player)
      const caption = videoCaption(component);
      // …a video in a half / third column beside text that came before it (the DE&I Summit
      // 2023 video right of its text) keeps its column width, stacked under the text
      const besideText = component.closest('.colctrl [class*="col-sm-6"], .colctrl [class*="col-sm-4"]');
      const columnStyle = imageColumnStyle(component)
        || (besideText && (/\bcol-sm-6\b/.test(besideText.className) ? 'image-1-2' : 'image-1-3'));
      if (columnStyle) {
        startSection('video', columnStyle).nodes.push(component);
      } else {
        if (!current || current.kind !== 'body') startSection('body');
        current.nodes.push(component);
      }
      // a caption heading not in Futura on the source (the plain h3 under the ENT study
      // video: Egyptienne 21px) keeps the serif: `h-serif`
      const serifCaption = caption.some((n) => /^H[2-4]$/.test(n.tagName) && !n.querySelector('.futura-bold, b, strong'));
      if (caption.length) startSection('caption', serifCaption ? 'join, h-serif' : 'join').nodes.push(...caption);
      if (columnStyle || caption.length) current = null;
      return;
    }
    // no page title (.h1-title) and the article opens with a 2vw Large Headline below the
    // date (e.g. OptaBlate, ProStep): that headline is the page H1, in its own section with
    // the `headline-2vw` style (the source size); a 1.5vw one (e.g. the Neuroform Atlas
    // expanded-indication release) gets `headline-1-5vw`
    const headlineStyle = component.matches('.c-largeheadline') && [
      ['[class*="fontsize-2vw"]', 'headline-2vw'],
      ['[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]', 'headline-1-5vw'],
    ].find(([selector]) => component.querySelector(selector));
    if (isFirst && !hasTitle && headlineStyle && text(component)) {
      const lines = headlineNodes(component, doc);
      if (lines.length) {
        const heading = rename(lines[0], 'h1');
        heading.querySelectorAll('strong, em').forEach(unwrap);
        startSection('headline', headlineStyle[1]).nodes.push(heading, ...lines.slice(1));
        current = null;
        return;
      }
    }
    // a 2vw Large Headline in a gold box further down (e.g. "Stryker aims to improve
    // healthcare with IoT solutions" under the Smart devices title): its lines in a
    // `headline-2vw` section with `background: bg-gold` (the 20px gold box, news-detail.css)
    if (component.matches('.c-largeheadline') && headlineStyle && headlineStyle[1] === 'headline-2vw'
      && component.querySelector('.has-background.bg-gold') && text(component)) {
      const lines = headlineNodes(component, doc);
      if (lines.length) {
        lines.forEach((line) => line.querySelectorAll('em').forEach(unwrap));
        startSection('headline', 'headline-2vw').nodes.push(...lines);
        current.background = 'bg-gold';
        current = null;
        return;
      }
    }
    // no page title and the first rich text opens with a 1.5em Futura bold line (21px,
    // e.g. the Emergency Relief Bed release): that line is the page H1, in its own
    // section with the `h1-21` style (the source size); the rest of the text follows
    if (isFirst && !hasTitle && component.matches('.c-rich-text-editor')) {
      const heading = richTextTitle(component, doc);
      if (heading) {
        startSection('headline', heading.titleStyle).nodes.push(heading);
        current = null;
      }
    }
    if (component.matches('.c-curatedcta, .buttonset')) {
      const nodes = buttonNodes(component, doc);
      if (!nodes.length) return;
      // a button is centred when the source centres it (an offset grid column, e.g. the
      // ICU "Nominate a hero" CTA) or it follows centred text; otherwise it stays
      // left-aligned under the article text (e.g. "Listen to the podcast episode")
      const offset = component.closest('[class*="aem-GridColumn--offset--default--"]');
      const centred = (offset && !/aem-GridColumn--offset--default--0\b/.test(offset.className))
        || (current && current.kind.startsWith('center'));
      if (centred) {
        if (!current || !current.kind.startsWith('center')) startSection('center', 'center');
      } else if (!current || !current.kind.startsWith('body')) {
        startSection('body');
      }
      // the CTA's subtitle line above its button (p.cta-subtitle, e.g. "Be educated on the
      // warning signs of stroke" on Merryl's story: Futura bold 21px): a Bold-only paragraph
      // in a `label-1-5` section (authoring conventions: the 21px label)
      const subtitle = component.querySelector('.cta-subtitle, .cta-title');
      if (subtitle && text(subtitle)) {
        const p = doc.createElement('p');
        const strong = doc.createElement('strong');
        strong.textContent = text(subtitle);
        p.append(strong);
        nodes.unshift(p);
        if (!(current.style || '').split(', ').includes('label-1-5')) {
          current.style = [current.style, 'label-1-5'].filter(Boolean).join(', ');
        }
      }
      current.nodes.push(...nodes);
      return;
    }
    // a row of gold boxes (one gold rich text per column, e.g. the three figures of the
    // workplace violence article): Columns, one box per cell, in a `gold-boxes` section
    // (news-detail.css); a lone heading just above the row (a rich text of its own) heads it
    const boxes = component.matches('.c-rich-text-editor') && goldBoxRow(component);
    if (boxes) {
      boxes.forEach((box) => consumed.add(box));
      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'Columns',
        cells: [boxes.map((box) => goldBoxCell(box, doc))],
      });
      // 2em figures (span.fontsize-2em, e.g. "92% strongly agree"): the larger-figure box
      const goldStyle = boxes.every((box) => box.querySelector('.futura-bold .fontsize-2em, .fontsize-2em .futura-bold'))
        ? 'gold-boxes, gold-boxes-2' : 'gold-boxes';
      const heading = current && current.nodes.length === 1 && /^H[2-4]$/.test(current.nodes[0].tagName || '');
      if (heading && !current.style) {
        // its size tag ([[text-1-25]…], a 1.25em heading) becomes the `h3-1-25` style
        const sized = /\[\[text-1-25\]/.test(current.nodes[0].textContent);
        dropBracketTags(current.nodes[0]);
        current.style = sized && current.nodes[0].tagName === 'H3' ? `${goldStyle}, h3-1-25` : goldStyle;
        current.nodes.push(block);
      } else {
        startSection('gold-boxes', goldStyle).nodes.push(block);
      }
      current = null;
      return;
    }
    const { nodes, centred, size } = component.matches('.c-rich-text-editor')
      ? richTextNodes(component, doc)
      : { nodes: headlineNodes(component, doc), centred: false };
    if (!nodes.length) return;
    // a run of rich text with the same alignment and copy styles is one section; the
    // copy styles sit next to `center` (e.g. `center, p-1-25, serif`). A plain-bold
    // paragraph (boldBody) gets a section of its own with `bold-body`; a Futura text link
    // after the copy of its rich text (followsText) keeps the paragraph gap above it, so
    // the section before it gets `ps-0`.
    // a rich text right after the one the current section holds, neither spaced by its own
    // margin or padding (e.g. "5-minute read" under "Results are from 4,955 families…"):
    // the two sit one paragraph gap apart on the source, so a new section there is `join`
    const stacked = !!current && current.lastRich === previousRichText(component)
      && unspaced(current.lastRich, 'bottom') && unspaced(component, 'top');
    nodes.forEach((node, i) => {
      const copyStyle = node.copyStyle !== undefined ? node.copyStyle : size;
      const extra = node.headingStyle ? [node.headingStyle]
        : [copyStyle || '', node.boldBody ? 'bold-body' : ''].filter(Boolean);
      const styles = [centred ? 'center' : '', ...extra].filter(Boolean);
      const kind = [centred ? 'center' : 'body', ...extra].join(' ');
      // an Egyptienne h3 adds `h-serif` to its section (it stays with the copy around it);
      // a Futura h3 in the same run starts a new section
      const h3Font = node.tagName === 'H3' ? (node.serifHeading ? 'serif' : 'futura') : null;
      if (!current || current.kind !== kind || (h3Font && current.h3Font && current.h3Font !== h3Font)) {
        if (node.followsText && current && i > 0) {
          current.style = [current.style, 'ps-0'].filter(Boolean).join(', ');
        }
        // a section split off the same rich text (e.g. the plain-bold "A week of
        // celebration" in the IWD story) keeps its paragraph gap above it: `join`
        const join = (i > 0 || stacked) && current && !node.followsText ? ['join'] : [];
        startSection(kind, [...styles, ...join].join(', ') || undefined);
      }
      if (h3Font) {
        if (h3Font === 'serif' && current.h3Font !== 'serif') {
          current.style = [current.style, 'h-serif'].filter(Boolean).join(', ');
        }
        current.h3Font = h3Font;
      }
      current.nodes.push(node);
    });
    if (component.matches('.c-rich-text-editor')) current.lastRich = component;
  });

  // a form page ends with exactly one H1: further ones (a campaign name under the title)
  // are H2s
  if (hasForm) {
    let seen = 0;
    sections.forEach((section) => {
      section.nodes = section.nodes.map((node) => {
        if (node.nodeType !== 1) return node;
        const headings = [...(node.tagName === 'H1' ? [node] : []), ...node.querySelectorAll('h1')];
        let result = node;
        headings.forEach((heading) => {
          seen += 1;
          if (seen === 1) return;
          const h2 = rename(heading, 'h2');
          if (heading === node) result = h2;
        });
        return result;
      });
    });
  }

  // 4. disclaimer: references (when the article has them) and the document code, in
  // source order. The page's own "Last Updated" wrapper (#publishedDate) is not content.
  const disclaimers = [...doc.querySelectorAll('.c-disclaimer')]
    .filter((el) => !el.querySelector('#publishedDate') && !el.parentElement.closest('.c-disclaimer') && text(el));
  const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
    const box = doc.createElement('div');
    box.innerHTML = disclaimer.innerHTML;
    cleanRichText(box, { wholeParagraphs: true });
    return blockNodes(box, doc);
  }), doc);
  // small print: the corp `disclaimer` section style (11.2px copy; references as
  // "N: " entries 15px apart, then the document code)
  // references authored as "1: …" paragraphs keep that look: `references-spaced`
  const disclaimerStyle = disclaimerNodes.converted ? 'disclaimer, references-spaced' : 'disclaimer';
  if (disclaimerNodes.length) startSection('disclaimer', disclaimerStyle).nodes.push(...disclaimerNodes);

  // the title section (when it holds the H1) is followed by a `spacer` section: the
  // article starts 46px below the date on the source (30px spacer + the 15px title gap) —
  // except a lead image placed directly below the date, 15px below it
  const opensWithHeadline = sections.some((section) => section.kind === 'headline');
  if ((title.nodes.some((node) => node.tagName === 'H1') || opensWithHeadline || fullWidthLead) && !leadBelowDate) {
    sections.splice(sections.indexOf(title) + 1, 0, { kind: 'spacer', style: 'spacer', nodes: [] });
  }

  // no title component on the source (its H1 opens the rich text, e.g. the Spencer Stiles
  // release): the date widget, which follows the empty title slot, sits above that H1 —
  // section style `date-above` (templates/news-detail/news-detail.js)
  const opening = sections.find((section) => section.nodes.length);
  if (element.hasAttribute('data-first-published') && !title.nodes.length
    && opening && opening.nodes[0].tagName === 'H1') {
    opening.style = [opening.style, 'date-above'].filter(Boolean).join(', ');
  }

  // rebuild the body: sections separated by <hr>, each with its Section Metadata (a
  // `spacer` section is the metadata alone)
  const out = [];
  sections.filter((section) => section.nodes.length || section.kind === 'spacer').forEach((section, i) => {
    if (i > 0) out.push(doc.createElement('hr'));
    out.push(...section.nodes);
    // a section holding purple / blue buttons gets the btn-purple / btn-blue style
    const marked = section.nodes.flatMap((node) => (node.nodeType === 1
      ? [...(node.matches('[data-btn-style]') ? [node] : []), ...node.querySelectorAll('[data-btn-style]')] : []));
    [...new Set(marked.map((a) => a.getAttribute('data-btn-style')))].forEach((style) => {
      section.style = [section.style, style].filter(Boolean).join(', ');
    });
    marked.forEach((a) => a.removeAttribute('data-btn-style'));
    if (section.style || section.background) {
      const cells = {};
      if (section.style) cells.style = section.style;
      if (section.background) cells.background = section.background;
      out.push(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells }));
    }
  });
  element.replaceChildren(...out);
  const fragments = [...new Set(sections.flatMap((section) => section.nodes)
    .flatMap((node) => (node.nodeType === 1 ? [...node.querySelectorAll('a[href^="/us/en/fragments/"]')] : []))
    .map((a) => a.getAttribute('href')))];
  if (fragments.length || inlinedXf.length) {
    element.setAttribute('data-news-xf', JSON.stringify({ fragments, inlined: inlinedXf }));
  }
}
