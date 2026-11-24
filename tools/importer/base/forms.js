/* global WebImporter */
// www.stryker.com gated-content, event and form pages (#520, #521), built like the event pages
// (long-page-detail-corp builder). The Marketo forms become `Marketo Form` blocks, a form beside
// an aside a `flex` section; every other embed is a marked placeholder line.
import { preprocess } from './legal.js';
import { videoLink } from '../parsers/video.js';
import heroImageSlide from '../parsers/hero-image-slide.js';
import { transformEventPage } from './events.js';

const WIDTH = /\bcol-sm-(\d+)\b/;

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

const lineText = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

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

export default {
  preprocess,
  transform: (payload) => transformEventPage(payload, 'forms', (document) => {
    videoCarousels(document);
    videos(document);
    formLayouts(document);
    embeds(document);
  }, heroSlides),
};
