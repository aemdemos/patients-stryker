/*
 * Carousel (corp): stryker.com rotating slides (docs/standardisation/carousel-corp.md).
 *
 * Authored as consecutive sections with the section style `carousel`, one section per slide
 * (scripts/corp.js buildCarousels turns each run into this block, so every slide keeps its own
 * blocks and their Block options: a Hero (corp) image slide, or a Columns row for a split
 * slide). Each row of the block is one slide.
 *
 * Options (section styles on the slides, read by buildCarousels into block classes):
 *   autoplay  the slides move on by themselves every 5 seconds (stryker.com autoplay-N: one
 *             standard speed); paused on hover, on focus and when motion is reduced
 *   fade      slides cross-fade (default: they slide)
 *   split     split slides: image and text on a coloured band; each slide's band colour is
 *             box-purple-gradient (default), box-blue-gradient or box-dark
 * The slides always loop. Arrows on desktop (from 600px), dots on phones for image slides;
 * split slides keep their arrows on phones, as on stryker.com.
 */

const SPEED = 5000;

/**
 * Shows one slide.
 * @param {Element} block The carousel
 * @param {number} index The slide to show (wraps around)
 */
function show(block, index) {
  const slides = [...block.querySelectorAll(':scope .carousel-corp-slide')];
  const count = slides.length;
  const next = ((index % count) + count) % count;
  block.dataset.slide = next;
  const track = block.querySelector('.carousel-corp-track');
  if (!block.classList.contains('fade')) track.style.transform = `translateX(${-100 * next}%)`;
  slides.forEach((slide, i) => {
    const active = i === next;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.inert = !active;
  });
  block.querySelectorAll('.carousel-corp-dots button').forEach((dot, i) => {
    dot.setAttribute('aria-current', String(i === next));
  });
}

/**
 * A control button.
 * @param {string} className Its class
 * @param {string} label Its accessible name
 * @param {Function} onClick What it does
 * @returns {HTMLButtonElement} The button
 */
function button(className, label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.setAttribute('aria-label', label);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Moves on every few seconds, paused while the pointer or focus is in the carousel.
 * @param {Element} block The carousel
 */
function autoplay(block) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    timer = setInterval(() => show(block, Number(block.dataset.slide) + 1), SPEED);
  };
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', (e) => { if (!block.contains(e.relatedTarget)) start(); });
  start();
}

export default function decorate(block) {
  const rows = [...block.children];
  const track = document.createElement('div');
  track.className = 'carousel-corp-track';
  rows.forEach((slide, i) => {
    slide.classList.add('carousel-corp-slide');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${rows.length}`);
    track.append(slide);
  });
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.replaceChildren(track);
  if (rows.length < 2) {
    show(block, 0);
    return;
  }

  const go = (step) => () => show(block, Number(block.dataset.slide) + step);
  block.append(
    button('carousel-corp-prev', 'Previous slide', go(-1)),
    button('carousel-corp-next', 'Next slide', go(1)),
  );
  const dots = document.createElement('div');
  dots.className = 'carousel-corp-dots';
  rows.forEach((_, i) => dots.append(button('', `Slide ${i + 1}`, () => show(block, i))));
  block.append(dots);

  // swipe on touch screens
  let x = null;
  track.addEventListener('touchstart', (e) => { x = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (x === null) return;
    const dx = e.changedTouches[0].clientX - x;
    if (Math.abs(dx) > 40) show(block, Number(block.dataset.slide) + (dx < 0 ? 1 : -1));
    x = null;
  });

  show(block, 0);
  if (block.classList.contains('autoplay')) autoplay(block);
}
