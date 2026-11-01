/*
 * Hero carousel on www.stryker.com pages (the .c-autocarousel slide group, approved
 * 2026-11-01). Each slide is authored as a Hero Corp block in its own section with the
 * `carousel` section style; consecutive ones are one carousel, showing one slide at a time.
 * The first slide's section holds the source options: `autoplay-<ms>` (rotate every <ms>),
 * `fade` (the slide fades in, else it slides in from the right), `banner` (the large hero
 * carousel: gold arrow tabs at the edges at every width, no dots). The slides stay sections of
 * their own, so each keeps its section styles (copy sizes, fonts).
 *
 * Measured on /us/en/foot-and-ankle/products/augment.html and
 * /us/en/sports-medicine/products/versitomic-flexible-reaming-system.html: from 600px
 * (source 841px) 36 x 65px white chevrons 14px in from the sides, no dots; below 600px no
 * chevrons, 16px dots 29px apart, centred 10px under the slide (gold = the current slide).
 */

const AUTOPLAY = /^autoplay-(\d+)$/;

/**
 * Wires one carousel: its controls (moved into the slide shown) and rotation.
 * @param {Element[]} slides The slide sections, in order
 */
function wire(slides) {
  const doc = slides[0].ownerDocument;
  const options = [...slides[0].classList];
  const interval = Number((options.map((c) => c.match(AUTOPLAY)).find(Boolean) || [])[1]) || 0;
  const effect = options.includes('fade') ? 'fade' : 'slide';
  // `banner` (the large hero carousel's look): every slide carries it, for its styles
  if (options.includes('banner')) slides.forEach((slide) => slide.classList.add('hero-corp-carousel-banner'));
  let current = 0;

  const controls = doc.createElement('nav');
  controls.className = 'hero-corp-carousel-controls';
  controls.setAttribute('aria-label', 'Carousel');
  const prev = doc.createElement('button');
  prev.type = 'button';
  prev.className = 'hero-corp-carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  const next = doc.createElement('button');
  next.type = 'button';
  next.className = 'hero-corp-carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  const dots = doc.createElement('ul');
  dots.className = 'hero-corp-carousel-dots';
  controls.append(prev, next, dots);
  let dotButtons = [];

  const show = (index, animate = true) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('hero-corp-carousel-active', active);
      slide.classList.remove('hero-corp-carousel-fade', 'hero-corp-carousel-slide-in');
      slide.setAttribute('aria-hidden', String(!active));
    });
    const slide = slides[current];
    if (animate) {
      // restart the entrance animation
      slide.getBoundingClientRect();
      slide.classList.add(effect === 'fade' ? 'hero-corp-carousel-fade' : 'hero-corp-carousel-slide-in');
    }
    slide.append(controls);
    dotButtons.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };

  dotButtons = slides.map((slide, i) => {
    const li = doc.createElement('li');
    const button = doc.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    button.addEventListener('click', () => show(i));
    li.append(button);
    dots.append(li);
    return button;
  });
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  show(0, false);

  // every slide as tall as the tallest, so the page under the carousel does not move when it
  // rotates: each hidden slide is laid out for a moment (no paint in between) to be measured,
  // again when its images load and when the window is resized
  let frame = 0;
  const equalize = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      // the slides' content (their first wrapper): the controls sit under it in the slide shown
      const boxes = slides.map((slide) => slide.querySelector(':scope > div') || slide);
      boxes.forEach((box) => { box.style.minHeight = ''; });
      const heights = slides.map((slide, i) => {
        slide.classList.add('hero-corp-carousel-measure');
        const height = boxes[i].offsetHeight;
        slide.classList.remove('hero-corp-carousel-measure');
        return height;
      });
      const max = Math.max(...heights);
      boxes.forEach((box) => { box.style.minHeight = `${max}px`; });
    });
  };
  slides.forEach((slide) => {
    slide.addEventListener('load', equalize, true);
    new ResizeObserver(equalize).observe(slide);
  });
  window.addEventListener('resize', equalize, { passive: true });
  equalize();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!interval || reduced) return;
  let timer = null;
  const start = () => {
    if (!timer) timer = window.setInterval(() => show(current + 1), interval);
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };
  // paused while the pointer or the keyboard focus is on the slide shown
  slides.forEach((slide) => {
    slide.addEventListener('mouseenter', stop);
    slide.addEventListener('mouseleave', start);
    slide.addEventListener('focusin', stop);
    slide.addEventListener('focusout', start);
  });
  start();
}

/**
 * Turns each run of consecutive `carousel` sections into one carousel. Runs in
 * decorateSections (after the section metadata is applied, before the blocks are decorated
 * and before the page shows), so only the first slide is ever laid out at first.
 * @param {Element} main The container element
 */
export default function buildCarouselSections(main) {
  const runs = [];
  main.querySelectorAll(':scope > .section.carousel').forEach((section) => {
    const run = runs[runs.length - 1];
    if (run && run[run.length - 1].nextElementSibling === section) run.push(section);
    else runs.push([section]);
  });
  runs.filter((run) => run.length > 1).forEach((slides) => {
    slides.forEach((slide, i) => {
      slide.classList.add('hero-corp-carousel-item');
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    });
    wire(slides);
  });
}
