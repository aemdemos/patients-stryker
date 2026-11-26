/* global WebImporter */
// www.stryker.com gated-content, event and form pages (#520, #521), built like the event pages
// (long-page-detail-corp builder). The Marketo forms become `Marketo Form` blocks, a form beside
// an aside a `flex` section; every other embed is a marked placeholder line.
import { preprocess } from './legal.js';
import { videoLink } from '../parsers/video.js';
import heroImageSlide from '../parsers/hero-image-slide.js';
import { transformEventPage } from './events.js';

const WIDTH = /\bcol-sm-(\d+)\b/;

const lineText = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

// A form in the 8/12 column of a two column row: the section styles `flex, flex-67-33` (form
// first) or `flex, flex-33-67`, so the form keeps its source width, with or without an aside.
function formLayouts(document) {
  document.querySelectorAll('.c-marketo-form').forEach((component) => {
    const col = component.closest('[class*="col-sm-"]');
    const cols = col ? [...col.parentElement.children].filter((c) => WIDTH.test(c.className)) : [];
    if (cols.length !== 2 || Number(col.className.match(WIDTH)[1]) !== 8) return;
    component.setAttribute('data-form-style', cols[0] === col ? 'flex, flex-67-33' : 'flex, flex-33-67');
  });
}

// Every source Marketo form carries the Altcha captcha the stryker.com widget adds at runtime
// (not in the static markup): the block's captcha rows, as the other corp form pages.
function captchas(document) {
  document.querySelectorAll('.c-marketo-form').forEach((component) => {
    component.setAttribute('data-captcha', '');
  });
}

// Copy in the form's own column (the "Register now to watch the webinar!" band above it) moves
// out of the row, before it (after it when it follows the form), as the bands above the other
// forms: the form's section keeps only the form and its aside.
function formCopy(document) {
  document.querySelectorAll('.c-marketo-form').forEach((component) => {
    const col = component.closest('[class*="col-sm-"]');
    const colctrl = col && col.closest('.colctrl');
    if (!colctrl) return;
    const own = component.closest('.marketoform') || component;
    const row = own.parentElement;
    if (!row || row === col.parentElement || !col.contains(row)) return;
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className)
      ? colctrl.parentElement : colctrl;
    const siblings = [...row.children];
    const at = siblings.indexOf(own);
    const filled = (el) => lineText(el) || el.querySelector('img, [data-asset-path]');
    siblings.slice(0, at).filter(filled).forEach((el) => wrapper.before(el));
    siblings.slice(at + 1).filter(filled).reverse().forEach((el) => wrapper.after(el));
  });
}

// The empty section title that is a jump target (`#contact`): its id becomes the Section
// Metadata `Id` of the spacer section it is imported as.
function jumpTargets(document) {
  document.querySelectorAll('.c-section-title[id]').forEach((title) => {
    if (!lineText(title)) title.setAttribute('data-section-id', title.id);
  });
}

// Source lists are one item per list: side by side in a Columns cell they need one list per
// cell (the block lays out its direct children), so adjacent lists of a column become one.
function mergeLists(document) {
  document.querySelectorAll('.colctrl .c-rich-text-editor').forEach((editor) => {
    const holders = new Set([editor, ...editor.querySelectorAll('div')]);
    holders.forEach((holder) => {
      let list = null;
      [...holder.children].forEach((child) => {
        if (child.tagName !== 'UL') {
          list = null;
        } else if (list) {
          list.append(...child.children);
          child.remove();
        } else {
          list = child;
        }
      });
    });
  });
}

// "Latest …" cards without images (.c-latestnews: title, Read More link per item, then the
// view-all button) → a section's Columns row, one cell per item (title, bold underlined link),
// then the button as a bold link.
function latestNews(document) {
  document.querySelectorAll('.c-latestnews').forEach((news) => {
    const cells = [...news.querySelectorAll('.item')].map((item) => {
      const cell = [];
      const h3 = item.querySelector('h3');
      if (h3 && lineText(h3)) {
        const heading = document.createElement('h3');
        heading.textContent = lineText(h3);
        cell.push(heading);
      }
      const link = item.querySelector('a[href]');
      if (link && lineText(link)) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        const u = document.createElement('u');
        u.textContent = lineText(link);
        a.append(u);
        const strong = document.createElement('strong');
        strong.append(a);
        const p = document.createElement('p');
        p.append(strong);
        cell.push(p);
      }
      return cell;
    }).filter((cell) => cell.length);
    const parts = [];
    if (cells.length) {
      const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [cells] });
      block.setAttribute('data-keep', 'flow');
      parts.push(block);
    }
    const all = news.querySelector('.c-latestnews-btn a[href]');
    if (all && lineText(all)) {
      const holder = document.createElement('div');
      holder.className = 'c-rich-text-editor';
      const a = document.createElement('a');
      a.href = all.getAttribute('href');
      a.textContent = lineText(all);
      const strong = document.createElement('strong');
      strong.append(a);
      const p = document.createElement('p');
      p.append(strong);
      holder.append(p);
      parts.push(holder);
    }
    (news.closest('.latestnews') || news).replaceWith(...parts);
  });
}

// The hero of the calculator pages (.c-hero-content: title, subhead and text beside an image):
// the title is the page title, then one Columns (columns-50-50) row, text | image. The source
// image has no alt text and imports with an empty alt.
function heroContent(document) {
  document.querySelectorAll('.c-hero-content').forEach((hero) => {
    const h1 = hero.querySelector('h1');
    const hold = hero.closest('.hero') || hero;
    if (h1 && lineText(h1)) {
      const title = document.createElement('div');
      title.className = 'h1-title';
      const heading = document.createElement('h1');
      heading.textContent = lineText(h1);
      title.append(heading);
      hold.before(title);
    }
    const first = [];
    const subhead = hero.querySelector('.subhead');
    if (subhead && lineText(subhead)) {
      const h2 = document.createElement('h2');
      h2.textContent = lineText(subhead);
      first.push(h2);
    }
    const content = hero.querySelector('p.content');
    if (content && lineText(content)) {
      const p = document.createElement('p');
      p.textContent = lineText(content);
      first.push(p);
    }
    const second = [];
    const img = hero.querySelector('picture img, img');
    if (img) {
      const source = hero.querySelector('picture source[srcset]');
      const copy = document.createElement('img');
      copy.setAttribute('src', (source || img).getAttribute(source ? 'srcset' : 'src'));
      copy.setAttribute('alt', (img.getAttribute('alt') || '').trim());
      const p = document.createElement('p');
      p.append(copy);
      second.push(p);
    }
    if (first.length && second.length) {
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'Columns (columns-50-50)',
        cells: [[first, second]],
      });
      block.setAttribute('data-keep', 'section');
      hold.replaceWith(block);
    } else {
      hold.remove();
    }
  });
}

function placeholder(document, type, name, href) {
  const holder = document.createElement('div');
  holder.className = 'c-rich-text-editor';
  const p = document.createElement('p');
  const label = document.createElement('strong');
  label.textContent = 'Embedded form placeholder:';
  p.append(label, ` ${type}${name ? ` (${name})` : ''} is not migrated.`);
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = 'Source embed';
    p.append(' ', a);
  }
  holder.append(p);
  return holder;
}

const outermost = (el, selector) => !el.parentElement.closest(selector);

// Adobe Sign, Stryker remote component (microapp.stryker.com) and Cvent calendar embeds are not
// rebuilt: each one is a single marked line at its position, with the source embed link.
function embeds(document) {
  document.querySelectorAll('.adobesignwebform').forEach((el) => {
    if (!outermost(el, '.adobesignwebform')) return;
    const href = el.querySelector('iframe[src]')?.getAttribute('src');
    if (href) el.replaceWith(placeholder(document, 'Adobe Sign form', '', href));
  });
  document.querySelectorAll('.remotecomponent').forEach((el) => {
    const [name, href] = (el.querySelector('input.hdnSelComp')?.getAttribute('value') || '').split('|');
    el.replaceWith(placeholder(document, 'Stryker remote component', name, href));
  });
  document.querySelectorAll('.cventcomponent').forEach((el) => {
    el.replaceWith(placeholder(document, 'Cvent calendar widget', '', ''));
  });
}

// A Dynamic Media or YouTube standalone video → `Video` block (`Video (border)` unless the source
// hides the border), the caption line after it.
function videos(document) {
  document.querySelectorAll('.c-standalone-video').forEach((component) => {
    const a = videoLink(component, document);
    if (!a) return;
    const name = component.classList.contains('hide-border') ? 'Video' : 'Video (border)';
    const block = WebImporter.Blocks.createBlock(document, { name, cells: [[a]] });
    block.setAttribute('data-keep', 'section');
    const caption = component.querySelector('.desc-content');
    (component.closest('.standalonevideo') || component).replaceWith(block);
    if (caption && caption.textContent.trim()) {
      const holder = document.createElement('div');
      holder.className = 'c-rich-text-editor';
      holder.append(...[...caption.querySelectorAll('p')].map((p) => {
        const copy = document.createElement('p');
        copy.textContent = p.textContent.trim();
        return copy;
      }));
      block.after(holder);
    }
  });
}

// A hero carousel of video slides (Dynamic Media video behind a headline): one Video block per
// distinct video, then each slide's headline lines.
function videoCarousels(document) {
  document.querySelectorAll('.c-autocarousel').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('.carouselslide:not(.slick-cloned)')];
    const links = [];
    const parts = [];
    slides.forEach((slide) => {
      const video = slide.querySelector('.experienceFragment-ef .c-standalone-video');
      const a = video && videoLink(video, document);
      if (a && !links.includes(a.href)) {
        links.push(a.href);
        const block = WebImporter.Blocks.createBlock(document, { name: 'Video', cells: [[a]] });
        block.setAttribute('data-keep', 'section');
        parts.push(block);
      }
    });
    if (!parts.length) return;
    const lines = slides.flatMap((slide) => [...slide.querySelectorAll('.overlayparsys .line')])
      .filter((line) => lineText(line));
    if (lines.length) {
      const holder = document.createElement('div');
      holder.className = 'c-rich-text-editor';
      lines.forEach((line) => {
        const el = document.createElement(line.querySelector('h1, h2, h3, h4, h5, h6') ? 'h2' : 'p');
        el.textContent = lineText(line);
        holder.append(el);
      });
      parts.push(holder);
    }
    carousel.replaceWith(...parts);
  });
}

// The hero carousel of image slides → `Hero Corp (image-slide)` (the existing parser), once the
// page is built and before its images become Dynamic Media links.
function heroSlides(main, document) {
  main.querySelectorAll('.c-autocarousel').forEach((el) => heroImageSlide(el, { document }));
}

// The event titles are longer than the headline box of the shared image-slide hero: over the
// image the box can run past the image bottom and cover the text that follows (768 and 1200px).
// A white-box headline therefore moves out of the hero: the hero keeps its images and the
// title and date follow as default content, fully readable at every width.
function headlineOutOfHero(main) {
  main.querySelectorAll('table').forEach((table) => {
    const [header, ...rows] = table.rows;
    const name = header && header.cells[0] ? header.cells[0].textContent : '';
    if (!/^\s*Hero Corp\b.*\bwhite box\b/i.test(name) || rows.length < 2) return;
    const last = rows[rows.length - 1];
    const headline = [...last.cells[0].childNodes];
    last.remove();
    header.cells[0].textContent = 'Hero Corp (image Slide)';
    table.after(...headline);
  });
}

export default {
  preprocess,
  transform: (payload) => {
    const result = transformEventPage(payload, 'forms', (document) => {
      videoCarousels(document);
      videos(document);
      formLayouts(document);
      formCopy(document);
      captchas(document);
      jumpTargets(document);
      mergeLists(document);
      latestNews(document);
      heroContent(document);
      embeds(document);
    }, heroSlides);
    headlineOutOfHero(result[0].element);
    return result;
  },
};
