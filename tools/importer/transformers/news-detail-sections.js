/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: www.stryker.com news articles (template news-detail) — page structure.
 *
 * beforeTransform rebuilds <body> as the article's authorable content, in source order:
 *   1. title section: the page H1 (`.h1-title`, only when the source has one — no H1 is
 *      created) and the H5 publish date (`.c-publish-date`)
 *   2. lead media: the single-slide `.c-autocarousel` (own section; the hero-image-slide
 *      parser turns it into `Hero Corp (image-slide)`), or a standalone image (own section)
 *   3. article sections: rich text, standalone images and `.c-standalone-video` (left for
 *      the video parser). A run of centred content (centred rich text, `.c-curatedcta`
 *      buttons) becomes its own section with the `center` section style.
 *   3a. a video with a Large Headline beside it (col-sm-8 + col-sm-4 row, e.g. the
 *       StrykerTalks podcasts) → `Columns (columns-67-33, large-headline, gray-lead)`, full
 *       width: the video link, then the headline as a Heading 2 statement in the grey box;
 *       the page gets `theme: full-width` (title and small print full width, as on the source)
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
 * `bold-body` style (bold in the body font); inline `span.futura-bold` becomes
 * <strong><em> (Futura bold) and `<b>` <strong> (body-font bold), gold buttons (a.btn-gold) become bold + italic links (the
 * authoring convention for the gold .button.accent), other buttons bold links, and
 * standalone links (span.standalone-link) bold + underline links (a.link-strong).
 * Asset links (/content/dam/...) point at www.stryker.com, where the files live; links
 * that open in a new tab on the source get the `#_blank` marker.
 */

import { videoLink } from '../parsers/video.js';
// rich-text rules shared by every corp importer (decision table: decisions/typography-map.json)
import {
  BLOCK_TAGS, text, rename, unwrap, absoluteAsset, newTabHref, cleanRichText, copyStyles,
  plainBoldParagraphs, serifHeadings, footnoteList,
} from '../corp-richtext.js';
import { standaloneImageNodes, matchXfWrappers, markXfSlides } from '../corp-components.js';

const COMPONENTS = [
  '.c-autocarousel',
  '.c-standalone-image',
  '.c-rich-text-editor',
  '.c-standalone-video',
  '.c-curatedcta',
  '.c-largeheadline',
  '.c-section-title',
  '.c-customizeable',
  '.c-section-separator',
  '.sectionseparator',
].join(', ');

// the source size / font spans a styled lead sits in (splitStyledLeads)
const STYLED_SPANS = ['fontsize-8em', 'fontsize-1-25em', 'fontsize-1-5em', 'fontsize-1-75em', 'fontsize-2em', 'fontsize-2-5em', 'urw-egyptienne']
  .map((cls) => `.${cls}`).join(', ');

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
    // a size span is relative to the heading (0.8em of a 21px h3), not to body copy: the
    // label keeps the default label size instead of turning into small print
    p.querySelectorAll('[class*="fontsize-"]').forEach(unwrap);
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
function smallHeadings(root) {
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return new Set([...root.querySelectorAll('h2')].filter((h) => {
    const spans = [...h.querySelectorAll('.fontsize-8em')].filter((span) => !span.parentElement.closest('.fontsize-8em'));
    return text(h) && squash(spans.map((span) => span.textContent).join('')) === squash(h.textContent);
  }));
}

/**
 * A paragraph that opens with a styled lead (the whole run in one source size / font
 * span, e.g. an Egyptienne 21px subtitle) followed by a blank line (<br><br>) and the
 * article text is split there, so the lead gets its own copy style.
 */
function splitStyledLeads(root) {
  const doc = root.ownerDocument;
  const styled = STYLED_SPANS;
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

function richTextNodes(component, doc) {
  const box = doc.createElement('div');
  const source = component.querySelector(':scope > div') || component;
  box.innerHTML = source.innerHTML;
  labelHeadingsToParagraphs(box);
  splitStyledLeads(box);
  const plainBold = plainBoldParagraphs(box);
  const serifHeads = serifHeadings(box);
  const smallHeads = smallHeadings(box);
  // copy styles per top-level element, so one serif lead paragraph in an otherwise
  // plain rich text keeps its font (its own section)
  const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
  const { centred, size } = cleanRichText(box);
  const nodes = [];
  [...box.childNodes].forEach((node) => {
    if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
      nodes.push(node);
    } else if (node.nodeType === 1 && node.tagName === 'IMG') {
      const p = doc.createElement('p');
      p.append(node);
      nodes.push(p);
    } else if (node.nodeType === 1 && node.tagName === 'DIV') {
      nodes.push(...[...node.children].filter((el) => BLOCK_TAGS.has(el.tagName)));
    } else if (text(node)) {
      const p = doc.createElement('p');
      p.append(node.cloneNode(true));
      nodes.push(p);
    }
  });
  nodes.forEach((node) => {
    if (plainBold.has(node)) node.boldBody = true;
    if (serifHeads.has(node)) node.serifHeading = true;
    if (smallHeads.has(node)) node.headingStyle = 'h2-0-8';
  });
  // elements without copy of their own (headings, images) follow the copy around them
  let last = null;
  nodes.forEach((node) => {
    const style = elementStyles.get(node);
    node.copyStyle = style === undefined || style === null ? last : style;
    if (node.copyStyle !== null) last = node.copyStyle;
  });
  const first = nodes.find((node) => node.copyStyle !== null);
  nodes.forEach((node) => {
    if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : (size || '');
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
  cleanRichText(box, { divParagraphs: false });
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
  const col = video.closest('[class*="col-sm-8"]');
  const row = col && col.parentElement;
  const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-4\b/.test(el.className));
  const headline = aside && aside.querySelector('.c-largeheadline');
  return headline && text(headline) ? headline : null;
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
  return rte;
}

/** The video + text row as `Columns (columns-50-50)` (the library's Video + text). */
function videoTextColumns(video, rte, doc) {
  const link = videoLink(video, doc);
  const { nodes } = richTextNodes(rte, doc);
  if (!link || !nodes.length) return null;
  const media = doc.createElement('p');
  media.append(link);
  return WebImporter.Blocks.createBlock(doc, {
    name: 'Columns (columns-50-50)',
    cells: [[media, nodes]],
  });
}

/**
 * A quote Large Headline under the grey box (survivor stories: the quote, a rule, the
 * name, the role) as the library's Video + quote cell: gold quote marks → Bold + Italic,
 * Futura words → Bold, one paragraph per line (the name a fully Bold paragraph).
 */
function quoteNodes(headline, doc) {
  const box = doc.createElement('div');
  box.innerHTML = headline.innerHTML;
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
function videoHeadlineColumns(video, headline, doc, quotes = [], ctas = [], asideCtas = []) {
  const link = videoLink(video, doc);
  const lines = headlineNodes(headline, doc);
  if (!link || !lines.length) return null;
  const media = doc.createElement('p');
  media.append(link);
  // a button under the video: a Bold link on its own line in the wide cell
  const buttons = ctas.flatMap((cta) => buttonNodes(cta, doc));
  // a 2vw headline (28px at 1440px, e.g. Stiles) is the Heading 2 statement; a 1.5vw one
  // (21px, e.g. Heath) stays a paragraph, the large-headline text size
  const small = headline.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
  const statement = small ? lines : [rename(lines[0], 'h2'), ...lines.slice(1)];
  return WebImporter.Blocks.createBlock(doc, {
    name: 'Columns (columns-67-33, large-headline, gray-lead)',
    cells: [[[media, ...buttons], [
      ...statement,
      ...quotes.flatMap((q) => quoteNodes(q, doc)),
      // a button in the narrow column (under the quote, e.g. Esley) stays there
      ...asideCtas.flatMap((cta) => buttonNodes(cta, doc)),
    ]]],
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || payload.template.name !== 'news-detail') return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const sections = [];
  let current = null;
  let separatorNext = false;
  const startSection = (kind, sectionStyle) => {
    const style = separatorNext
      ? ['separator', sectionStyle].filter(Boolean).join(', ')
      : sectionStyle;
    separatorNext = false;
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
  const date = main.querySelector('.c-publish-date h5');
  if (date && text(date)) {
    const h5 = doc.createElement('h5');
    h5.textContent = text(date);
    title.nodes.push(h5);
  }

  // 2.-3. lead media and article components, in source order (outermost only; a
  // slide's own image and headline belong to the carousel)
  const components = [...main.querySelectorAll(COMPONENTS)].filter((el) => {
    const parent = el.parentElement && el.parentElement.closest(COMPONENTS);
    return !parent && !el.closest('header, footer, .modal');
  });

  // experience fragments rendered inline (article body copy, asides, banners) → a Fragment
  // block linking their EDS fragment document (every XF is its own document; site-wide
  // index tools/importer/data/xf-index.js). payload.xf: importing an XF itself (its nested XFs).
  const xfSource = payload.xf || (payload.params && payload.params.originalURL) || '';
  const { matches: xfMatches, unmatched: xfUnmatched } = matchXfWrappers(main, xfSource);
  if (xfUnmatched.length) {
    console.warn(`[news-detail-sections] ${xfSource}: XF not matched to the index, kept inline: ${xfUnmatched.join(' | ')}`);
  }
  const xfDone = new Set();
  // hero / carousel slide XFs: marked for the hero parser (fragment links instead of images)
  const slidesUnmatched = markXfSlides(main, xfSource);
  if (slidesUnmatched.length) {
    console.warn(`[news-detail-sections] ${xfSource}: slide XF not matched to the index, images kept: ${slidesUnmatched.join(' | ')}`);
  }

  const consumed = new Set();
  // a lead image placed directly below the date (not in a column layout) starts 15px
  // below it on the source: no spacer then
  let leadBelowDate = false;
  components.forEach((component) => {
    if (consumed.has(component)) return;
    const wrapper = component.closest('.experienceFragment');
    if (wrapper && xfMatches.has(wrapper)) {
      if (!xfDone.has(wrapper)) {
        xfDone.add(wrapper);
        const link = doc.createElement('a');
        link.href = xfMatches.get(wrapper).eds;
        link.textContent = link.getAttribute('href');
        startSection('fragment').nodes.push(WebImporter.Blocks.createBlock(doc, { name: 'Fragment', cells: [[link]] }));
        current = null;
      }
      return;
    }
    const isFirst = current === title;
    if (component.matches('.c-autocarousel')) {
      if (!component.querySelector('img')) return;
      startSection('hero').nodes.push(component);
      current = null;
      return;
    }
    if (component.matches('.c-standalone-image')) {
      // image, then its title (h4) and description, as on the source
      const nodes = standaloneImageNodes(component, doc);
      if (!nodes.length) return;
      // the lead image, or an image in a narrow source column, is a section of its own
      const columnStyle = imageColumnStyle(component);
      if (isFirst && !component.closest('.colctrl')) leadBelowDate = true;
      if (isFirst || columnStyle) {
        startSection(isFirst ? 'lead' : 'image', columnStyle || undefined).nodes.push(...nodes);
        current = null;
        return;
      }
      // an image joins the article section it follows, whatever its copy size
      if (!current || !current.kind.startsWith('body')) startSection('body');
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
    if (component.matches('.c-customizeable')) {
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
    if (component.matches('.c-standalone-video')) {
      if (!component.querySelector('[data-asset-path], iframe[src]')) return;
      const aside = videoAside(component);
      // further Large Headlines in the narrow column (a quote) and buttons under the video
      const asideCol = aside && aside.closest('[class*="col-sm-4"]');
      const quotes = asideCol ? [...asideCol.querySelectorAll('.c-largeheadline')].filter((h) => h !== aside && text(h)) : [];
      const videoCol = component.closest('[class*="col-sm-8"]');
      const ctas = aside && videoCol ? [...videoCol.querySelectorAll('.c-curatedcta')].filter((c) => text(c)) : [];
      const asideCtas = asideCol ? [...asideCol.querySelectorAll('.c-curatedcta')].filter((c) => text(c)) : [];
      const columns = aside && videoHeadlineColumns(component, aside, doc, quotes, ctas, asideCtas);
      if (columns) {
        consumed.add(aside);
        quotes.forEach((q) => consumed.add(q));
        [...ctas, ...asideCtas].forEach((c) => consumed.add(c));
        // the source runs the title and small print full width on these pages too: the
        // import script sets `theme: full-width` (templates/news-detail/news-detail-themes.css)
        element.setAttribute('data-news-theme', 'full-width');
        startSection('columns').nodes.push(columns);
        current = null;
        return;
      }
      // a video with article text in the other half of the row: Columns (columns-50-50)
      const textAside = videoTextAside(component);
      const textColumns = textAside && videoTextColumns(component, textAside, doc);
      if (textColumns) {
        consumed.add(textAside.closest(COMPONENTS) || textAside);
        // the source row spans the whole container (e.g. InsideOut): full-width theme
        element.setAttribute('data-news-theme', 'full-width');
        startSection('columns').nodes.push(textColumns);
        current = null;
        return;
      }
      // a video in a narrow source column (the other column empty) is a section of its
      // own with the image column style, which caps the video block as well
      const columnStyle = imageColumnStyle(component);
      if (columnStyle) {
        startSection('video', columnStyle).nodes.push(component);
        current = null;
        return;
      }
      if (!current || current.kind !== 'body') startSection('body');
      current.nodes.push(component);
      return;
    }
    // no page title (.h1-title) and the article opens with a 2vw Large Headline below the
    // date (e.g. OptaBlate, ProStep): that headline is the page H1, in its own section with
    // the `headline-2vw` style (the source size)
    if (isFirst && !hasTitle && component.matches('.c-largeheadline')
      && component.querySelector('[class*="fontsize-2vw"]') && text(component)) {
      const lines = headlineNodes(component, doc);
      if (lines.length) {
        const heading = rename(lines[0], 'h1');
        heading.querySelectorAll('strong, em').forEach(unwrap);
        startSection('headline', 'headline-2vw').nodes.push(heading, ...lines.slice(1));
        current = null;
        return;
      }
    }
    if (component.matches('.c-curatedcta')) {
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
      current.nodes.push(...nodes);
      return;
    }
    const { nodes, centred, size } = component.matches('.c-rich-text-editor')
      ? richTextNodes(component, doc)
      : { nodes: headlineNodes(component, doc), centred: false };
    if (!nodes.length) return;
    // a run of rich text with the same alignment and copy styles is one section; the
    // copy styles sit next to `center` (e.g. `center, p-1-25, serif`). A plain-bold
    // paragraph (boldBody) gets a section of its own with `bold-body`.
    nodes.forEach((node) => {
      const copyStyle = node.copyStyle !== undefined ? node.copyStyle : size;
      const extra = node.headingStyle ? [node.headingStyle]
        : [copyStyle || '', node.boldBody ? 'bold-body' : ''].filter(Boolean);
      const styles = [centred ? 'center' : '', ...extra].filter(Boolean);
      const kind = [centred ? 'center' : 'body', ...extra].join(' ');
      // an Egyptienne h2 / h3 adds `h-serif` to its section (it stays with the copy around
      // it); a Futura one in the same run starts a new section
      const h3Font = /^H[23]$/.test(node.tagName) ? (node.serifHeading ? 'serif' : 'futura') : null;
      if (!current || current.kind !== kind || (h3Font && current.h3Font && current.h3Font !== h3Font)) {
        startSection(kind, styles.join(', ') || undefined);
      }
      if (h3Font) {
        if (h3Font === 'serif' && current.h3Font !== 'serif') {
          current.style = [current.style, 'h-serif'].filter(Boolean).join(', ');
        }
        current.h3Font = h3Font;
      }
      current.nodes.push(node);
    });
  });

  // 4. disclaimer: references (when the article has them) and the document code, in
  // source order. The page's own "Last Updated" wrapper (#publishedDate) is not content.
  const disclaimers = [...doc.querySelectorAll('.c-disclaimer')]
    .filter((el) => !el.querySelector('#publishedDate') && !el.parentElement.closest('.c-disclaimer') && text(el));
  const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
    const box = doc.createElement('div');
    box.innerHTML = disclaimer.innerHTML;
    cleanRichText(box, { wholeParagraphs: true });
    return [...box.children].filter((el) => BLOCK_TAGS.has(el.tagName));
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
  if ((title.nodes.some((node) => node.tagName === 'H1') || opensWithHeadline) && !leadBelowDate) {
    sections.splice(sections.indexOf(title) + 1, 0, { kind: 'spacer', style: 'spacer', nodes: [] });
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
    if (section.style) {
      out.push(WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      }));
    }
  });
  element.replaceChildren(...out);
}
