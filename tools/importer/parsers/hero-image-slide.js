/* eslint-disable */
/* global WebImporter */
import { STD_DRAFT_IMPORT, stdProductPage, stdReviewPage } from '../transformers/corp-text-markers.js';
import {
  dropColourTags, introCopy, productSlide, sizeBrackets, slideOptions, slideVideo, takeStripe,
} from '../hero-corp-std-import.js';
import { tagStdColours } from '../transformers/long-page-detail-corp-article.js';

/**
 * Parser: www.stryker.com single-slide `.c-autocarousel` → `Hero Corp (image-slide)`.
 *
 * Source shape (one slide per carousel on every news article):
 *   .carouselslide
 *     .experienceFragment-ef        img  (desktop crop, 3:1)
 *     .experienceFragment-ef-mobile img  (mobile crop)
 *     .overlayparsys.mobile_Overlay|mobile_Bottom style="top:15%; margin-left:56%;
 *        width:calc(100% - 56% - 10%)"  → .largeheadline .line > .fontsize-2vw > .futura-bold
 *
 * Block (blocks/hero-corp/hero-corp.js, image-slide), one column:
 *   | Hero Corp (image-slide, top-15, left-56, right-10, size-2[, text-below]) |
 *   | <desktop image> |
 *   | <mobile image>  |   (when the slide has one)
 *   | <headline>      |   heading kept as on the source; a plain headline line stays a
 *                           paragraph (no H1 is created)
 * The variant options carry the source headline box: top/left/right inset in % of the
 * image, size-<n> the fontsize-<n>vw class (2-5 = 2.5), text-below for mobile_Bottom.
 * A headline in a gold box adds gold-box. Bold (span.futura-bold) becomes <strong>. Image alt text is copied as-is (an empty alt
 * stays empty — the DM transformer imports it as a bare link).
 */

function copyImage(source, document) {
  const img = document.createElement('img');
  img.setAttribute('src', source.getAttribute('src'));
  img.setAttribute('alt', source.getAttribute('alt') || '');
  return img;
}

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** The headline lines as <hN>/<p>, with source bold as <strong>. */
function headline(overlay, document) {
  const out = [];
  const headings = [...overlay.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  // each headline line (span.line): its heading, or the line itself — a plain second line
  // under a heading is the subtitle (e.g. "Turn on any TV medical drama…" under the H1 of
  // "Is it a heart attack or sudden cardiac arrest?")
  const lineEls = [...overlay.querySelectorAll('.line')];
  let lines = headings.length ? headings : [...overlay.querySelectorAll('.line, p')];
  const product = STD_DRAFT_IMPORT && stdProductPage(document);
  if (headings.length && lineEls.length && product) {
    // in review (product pages): every heading and paragraph of each line, in order (TPX HD's
    // "Total Joint and Trauma" heading and its "Prepares you to perform at your best" line)
    lines = lineEls.flatMap((line) => {
      const parts = [...line.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
        .filter((el) => !el.parentElement.closest('h1, h2, h3, h4, h5, h6, p'));
      return parts.length ? parts : [line];
    });
  } else if (!headings.length && lineEls.length && product && stdReviewPage(document)) {
    // …and lines of paragraphs: each paragraph once (Connected OR "Stryker's Connected OR
    // Integration Platform" / "Created to Connect.", two paragraphs in one line)
    lines = lineEls.flatMap((line) => {
      const parts = [...line.querySelectorAll('p')].filter((el) => !el.parentElement.closest('p'));
      return parts.length ? parts : [line];
    });
  } else if (headings.length && lineEls.length) {
    lines = lineEls.map((line) => line.querySelector('h1, h2, h3, h4, h5, h6') || line);
  } else if (STD_DRAFT_IMPORT && headings.length) {
    // in review (staging build only): the text paragraphs after the headings too, in their
    // order (the description under LIFEPAK 35's and Isolibrium's title); a paragraph that is
    // only a button stays with the slide's buttons
    lines = [...overlay.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
      .filter((el) => !el.parentElement.closest('h1, h2, h3, h4, h5, h6, p')
        && !el.closest('.curatedcta, .buttonset, .c-curatedcta')
        && !(el.tagName === 'P' && el.querySelector('a') && clean(el.textContent) === clean(el.querySelector('a').textContent)));
  }
  lines.forEach((line) => {
    if (!clean(line.textContent)) return;
    const el = document.createElement(/^H[1-6]$/.test(line.tagName) ? line.tagName.toLowerCase() : 'p');
    const box = document.createElement('div');
    box.innerHTML = line.innerHTML;
    // in review (staging build only): the run sizes as bracket tags → Text style markers
    if (STD_DRAFT_IMPORT) sizeBrackets(box);
    // in review (product pages): each run's own colour as a Text style colour (a banner's bold
    // words can be black and white in one headline)
    if (product) tagStdColours(box, { gold: true });
    box.querySelectorAll('span.futura-bold, b').forEach((span) => {
      const strong = document.createElement('strong');
      while (span.firstChild) strong.append(span.firstChild);
      span.replaceWith(strong);
    });
    box.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
    // an anchor without a link (the source's <a> wrapper around a headline word, e.g. "How"
    // in "How Stryker is innovating in operating room design"): its text only
    box.querySelectorAll('a').forEach((a) => {
      if (!(a.getAttribute('href') || '').trim()) a.replaceWith(...a.childNodes);
    });
    box.querySelectorAll('strong strong').forEach((s) => s.replaceWith(...s.childNodes));
    box.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attr) => { if (!(node.tagName === 'A' && attr.name === 'href')) node.removeAttribute(attr.name); });
    });
    // trim the source's surrounding whitespace text nodes
    while (box.firstChild && box.firstChild.nodeType === 3 && !box.firstChild.textContent.trim()) box.firstChild.remove();
    while (box.lastChild && box.lastChild.nodeType === 3 && !box.lastChild.textContent.trim()) box.lastChild.remove();
    while (box.firstChild) el.append(box.firstChild);
    out.push(el);
  });
  return out;
}

/**
 * Review build, product pages: the text of a slide whose Experience Fragment holds a rich text
 * beside its image and whose overlay has none (Mako "Are you ready for more?", an h2 above the
 * slide's image), as default content before the slide, each line with its size (Text style) and
 * a plain h2 / h3 in Egyptienne, as on stryker.com, its bold words Futura.
 * @returns {Element[]} The lines ([] when the slide has none)
 */
function xfSlideCopy(slide, overlay, document) {
  if (overlay && clean(overlay.textContent)) return [];
  const xf = slide.querySelector('.experienceFragment-ef') || slide.querySelector('.experienceFragment-ef-mobile');
  const texts = xf ? [...xf.querySelectorAll('.c-rich-text-editor')] : [];
  // the slide copy is in the copy size: a heading keeps its level's size on stryker.com (h2
  // 24.5px), times its size span (1.25em: 30.6px → the 2x step)
  const LEVEL = {
    H1: 2, H2: 1.75, H3: 1.5, H4: 1.25,
  };
  const STEPS = ['1-25', '1-5', '1-75', '2', '2-5'];
  const step = (factor) => STEPS.reduce((x, y) => (Math.abs(Math.log(Number(y.replace('-', '.')) / factor))
    < Math.abs(Math.log(Number(x.replace('-', '.')) / factor)) ? y : x));
  const sized = (line) => {
    if (!LEVEL[line.tagName]) return;
    const walker = document.createTreeWalker(line, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const m = t.nodeValue.match(/\[\[text-(\d+(?:-\d+)?)\]/);
      if (m) {
        t.nodeValue = t.nodeValue.replace(m[0], `[[text-${step(LEVEL[line.tagName] * Number(m[1].replace('-', '.')))}]`);
        return;
      }
    }
    line.prepend(document.createTextNode(`[[text-${step(LEVEL[line.tagName])}]`));
    line.append(document.createTextNode(']'));
  };
  return texts.flatMap((rich) => headline(rich, document)).map((line) => {
    sized(line);
    if (!/^H[23]$/.test(line.tagName)) return line;
    const bold = [...line.querySelectorAll('strong')].map((b) => b.textContent).join('');
    const plain = clean(line.textContent.replace(/\[\[[^\][]+\]|\]/g, ''));
    if (clean(bold.replace(/\[\[[^\][]+\]|\]/g, '')) === plain) return line;
    line.querySelectorAll('strong').forEach((b) => {
      b.prepend(document.createTextNode('[[std-sans]'));
      b.append(document.createTextNode(']'));
    });
    line.prepend(document.createTextNode('[[serif]'));
    line.append(document.createTextNode(']'));
    return line;
  });
}

/** A % value of the overlay's inline style as a class token (7.5 → 7-5). */
function percent(style, re) {
  const m = style.match(re);
  return m ? String(parseFloat(m[1])).replace('.', '-') : null;
}

export default function parse(element, context) {
  const { document } = context;
  // in review (staging build only, docs/standardisation/carousel-corp.md): a carousel of
  // several slides becomes one `carousel` section per slide, each slide a Hero Corp
  // (image-slide) with its own options; autoplay (any speed) and fade are slide section styles
  const slides = [...element.querySelectorAll('.carouselslide:not(.slick-cloned)')];
  if (STD_DRAFT_IMPORT && slides.length > 1 && !element.hasAttribute('data-std-slide')) {
    const settings = element.querySelector('.slider-wrapper') || element;
    const styles = ['carousel'];
    if (settings.getAttribute('data-autoplay') === 'true') styles.push('autoplay');
    if (settings.getAttribute('data-transition') === 'true') styles.push('fade');
    const out = [document.createElement('hr')];
    slides.forEach((one) => {
      const holder = document.createElement('div');
      const single = document.createElement('div');
      single.setAttribute('data-std-slide', '');
      single.append(one.cloneNode(true));
      holder.append(single);
      parse(single, context);
      out.push(...holder.childNodes, WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: styles.join(', ') },
      }), document.createElement('hr'));
    });
    element.replaceWith(...out);
    return;
  }
  const slide = element.querySelector('.carouselslide:not(.slick-cloned)') || element;
  const desktop = slide.querySelector('.experienceFragment-ef img');
  const mobile = slide.querySelector('.experienceFragment-ef-mobile img');
  const overlay = slide.querySelector('.overlayparsys');
  let first = desktop || mobile || slide.querySelector('img');
  // review build (standardised pages): a slide holding only an ambient Dynamic Media video
  // (Connected OR) is an image slide with a video background; its poster frame is the image
  let ambient = '';
  if (!first && stdReviewPage(document)) {
    // (the video component may already be a Video block: its Dynamic Media link)
    const link = [...slide.querySelectorAll('table a[href*=".m3u8"]')]
      .map((a) => a.getAttribute('href').match(/\/is\/content\/(.+?)\.m3u8/)).find(Boolean);
    const path = slide.querySelector('[data-asset-path]')?.getAttribute('data-asset-path')
      || (link ? decodeURIComponent(link[1]) : '');
    if (path && !path.startsWith('/content/dam/')) {
      const base = 'https://media-assets.stryker.com/is';
      ambient = `${base}/content/${path}.m3u8?poster=${base}/image/${path}?fit=constrain,1&wid=909&hei=511`;
      first = document.createElement('img');
      first.setAttribute('src', `${base}/image/${path}?$max_width_1440$`);
      first.setAttribute('alt', '');
    }
  }
  if (!first) return;

  if (stdProductPage(document) && productSlide(slide, overlay)) {
    const copy = introCopy(overlay);
    overlay.querySelectorAll('.curatedcta a.btn[href]').forEach((btn) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.setAttribute('href', btn.getAttribute('href'));
      a.textContent = clean(btn.textContent);
      if (btn.classList.contains('btn-gold')) {
        const em = document.createElement('em');
        em.append(a);
        strong.append(em);
      } else strong.append(a);
      p.append(strong);
      copy.push(p);
    });
    // no rule under it on stryker.com (the slide's bottom edge only)
    element.replaceWith(WebImporter.Blocks.createBlock(document, {
      name: 'Hero Corp (page-hero, no-rule)',
      cells: [[copy], [copyImage(desktop || first, document)]],
    }));
    return;
  }

  const variants = ['image-slide'];
  const cells = [[copyImage(first, document)]];
  if (desktop && mobile) cells.push([copyImage(mobile, document)]);

  if (overlay) {
    const lines = headline(overlay, document);
    // a button on the slide (.curatedcta a.btn, e.g. "JOIN OUR TALENT NETWORK" on the talent
    // network banner): a Bold link alone on its line, after the headline
    overlay.querySelectorAll('.curatedcta a.btn[href]').forEach((btn) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.setAttribute('href', btn.getAttribute('href'));
      a.textContent = clean(btn.textContent);
      // in review (staging build only): a gold button (a.btn.btn-gold) is a Bold + Italic link
      // (authoring conventions: gold), not the teal Bold link
      if (STD_DRAFT_IMPORT && btn.classList.contains('btn-gold')) {
        const em = document.createElement('em');
        em.append(a);
        strong.append(em);
      } else strong.append(a);
      p.append(strong);
      lines.push(p);
    });
    if (lines.length) cells.push([lines]);

    const style = overlay.getAttribute('style') || '';
    const top = percent(style, /top:\s*(\d+(?:\.\d+)?)%/i);
    const left = percent(style, /margin-left:\s*(\d+(?:\.\d+)?)%/i);
    const right = percent(style, /width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i);
    if (top !== null) variants.push(`top-${top}`);
    if (left !== null) variants.push(`left-${left}`);
    if (right !== null) variants.push(`right-${right}`);

    const sized = overlay.querySelector('[class*="fontsize-"][class*="vw"]');
    const size = sized && sized.className.match(/fontsize-(\d+)(?:-(5))?-?vw/);
    if (size) variants.push(size[2] ? `size-${size[1]}-5` : `size-${size[1]}`);

    if (overlay.classList.contains('mobile_Bottom')) variants.push('text-below');

    // the headline in a gold box (.largeheadline.has-background.bg-gold, e.g. "Why all police
    // cars need AEDs"): gold-box — on phones the box alone, without the image. A right margin
    // on the box narrows it within the overlay ("Understanding the basics of a LUCAS chest
    // compression system": 20% of the 45% overlay → right-59)
    // …and in a white box (.bg-white, e.g. "Following in her mother's footsteps"): white-box
    if (overlay.querySelector('.has-background.bg-white')) variants.push('white-box');
    // …and in the corp blue box (.bg-blue, e.g. the Project C.U.R.E. bed kits feature): blue-box
    if (overlay.querySelector('.has-background.bg-blue')) variants.push('blue-box');
    const gold = overlay.querySelector('.has-background.bg-gold');
    if (gold) {
      variants.push('gold-box');
      const margin = parseFloat(percent(gold.getAttribute('style') || '', /margin-right:\s*(\d+(?:\.\d+)?)%/i) || '0');
      if (margin) {
        const l = parseFloat((left || '0').replace('-', '.'));
        const r = parseFloat((right || '0').replace('-', '.'));
        const inset = Math.round((r + ((100 - l - r) * margin) / 100) * 10) / 10;
        const i = variants.findIndex((v) => v.startsWith('right-'));
        const token = `right-${String(inset).replace('.', '-')}`;
        if (i >= 0) variants[i] = token; else variants.push(token);
      }
    }
  }

  // in review (staging build only, docs/standardisation/hero-corp.md): the named options
  // instead of the free values
  if (STD_DRAFT_IMPORT && overlay) {
    const style = overlay.getAttribute('style') || '';
    const num = (re) => { const m = style.match(re); return m ? parseFloat(m[1]) : null; };
    const options = slideOptions({
      left: num(/margin-left:\s*(\d+(?:\.\d+)?)%/i),
      right: num(/width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i),
      top: num(/top:\s*(\d+(?:\.\d+)?)%/i),
      overlay,
      headline: overlay.querySelector('.c-largeheadline') || overlay,
    });
    // colour tags that repeat the title / subline colour, or white on a dark box, go
    const colours = new Set(options.map((o) => (o.match(/^(?:title|subline)-(.+)$/) || [])[1]).filter(Boolean));
    if (options.some((o) => /^box-(blue|dark|purple-gradient|blue-gradient)$/.test(o))) colours.add('white');
    const copy = cells[cells.length - 1];
    if (copy && Array.isArray(copy[0])) dropColourTags(copy[0], colours);
    // review run: the text of the slide's Experience Fragment (xfSlideCopy) is the slide's copy,
    // at the top right, above the image on phones (Mako "Are you ready for more?", right of the
    // image's top on stryker.com, above it on phones)
    const lead = stdReviewPage(document) ? xfSlideCopy(slide, overlay, document) : [];
    if (lead.length) {
      cells.push([lead]);
      const placed = ['text-left', 'text-right', 'text-wide', 'text-top', 'text-upper', 'text-middle',
        'text-lower', 'mobile-below', 'mobile-above'];
      options.splice(0, options.length, ...options.filter((o) => !placed.includes(o)), 'text-right', 'text-top', 'mobile-above');
    }
    const video = slideVideo(slide) || ambient;
    if (video) {
      const a = document.createElement('a');
      a.setAttribute('href', video);
      a.textContent = video;
      cells.unshift([a]);
      options.push('video-background');
    }
    const stripe = takeStripe(element);
    if (stripe) options.push(stripe);
    variants.splice(1, variants.length - 1, ...options);
  }

  element.replaceWith(WebImporter.Blocks.createBlock(document, {
    name: `Hero Corp (${variants.join(', ')})`,
    cells,
  }));
}
