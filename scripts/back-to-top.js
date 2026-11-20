/*
 * Back-to-top button — site-wide, as on the source site (.c-back-to-top).
 *
 * Behaviour (mirrors the source widget):
 *   - only on "long" scroll positions: more than half a viewport below the top
 *   - appears once the user scrolls UP at least 50px after the last tracked position
 *   - hides again after scrolling DOWN at least 300px, or when back near the top
 *   - click: smooth scroll to the top (instant when the user prefers reduced motion)
 *   - not added on pages with a sticky jump-bar navigation (the source hides it there)
 */

const SHOW_AFTER_UP = 50; // px scrolled up before the button appears
const HIDE_AFTER_DOWN = 300; // px scrolled down before it hides again

/**
 * Adds the back-to-top button to the page.
 * @param {Document} doc the document
 */
export default function initBackToTop(doc = document) {
  if (doc.querySelector('.back-to-top') || doc.querySelector('.sticky-nav')) return;

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.setAttribute('aria-label', 'Back to top');
  // hidden (and out of the tab order) until it is shown
  button.setAttribute('aria-hidden', 'true');
  button.tabIndex = -1;
  doc.body.append(button);

  const setVisible = (visible) => {
    button.classList.toggle('back-to-top-visible', visible);
    button.setAttribute('aria-hidden', visible ? 'false' : 'true');
    button.tabIndex = visible ? 0 : -1;
  };

  let lastTrack = window.scrollY;
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const goingUp = y < lastY;
    lastY = y;
    if (y <= window.innerHeight * 0.5) {
      setVisible(false);
      lastTrack = y;
      return;
    }
    if (goingUp) {
      if (lastTrack - y >= SHOW_AFTER_UP) {
        setVisible(true);
        lastTrack = y;
      }
    } else if (y - lastTrack >= HIDE_AFTER_DOWN) {
      setVisible(false);
      lastTrack = y;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  button.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // move keyboard focus back to the top of the page as well
    const target = doc.querySelector('header a, main h1') || doc.body;
    target.focus({ preventScroll: true });
    setVisible(false);
  });

  update();
}
