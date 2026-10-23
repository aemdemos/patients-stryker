/**
 * Set up the hero from its authored rows.
 *
 * Authoring model (single-column rows):
 *   | <desktop image> |
 *   | <mobile image>  |  (optional)
 *   | <heading + supporting copy> |
 *
 * Keeps desktop + mobile as SEPARATE pictures (each with its own alt) so authors
 * can describe each crop distinctly, matching the source site. CSS toggles their
 * visibility at the 900px crossover (.hero-image-desktop / .hero-image-mobile).
 * The block is rebuilt into an [image][content] structure the CSS overlays.
 * @param {Element} block the hero block
 * @param {string} desktopQuery media query of the breakpoint that shows the desktop crop
 */
function setupHero(block, desktopQuery = '(width >= 900px)') {
  let desktopPic = null;
  let mobilePic = null;
  let contentCell = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const pic = cells[1].querySelector('picture');
      if (label === 'mobile') mobilePic = pic || mobilePic;
      else desktopPic = pic || desktopPic;
    } else if (cells.length === 1) {
      const cell = cells[0];
      const pic = cell.querySelector('picture');
      if (pic && !cell.querySelector('h1, h2, h3, p')) {
        if (!desktopPic) desktopPic = pic;
        else if (!mobilePic) mobilePic = pic;
      } else if (cell.querySelector('h1, h2, h3, p')) {
        contentCell = cell;
      } else if (!pic && cell.textContent.trim()) {
        // a single line of copy is delivered without its <p> (e.g. a bold headline)
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
        contentCell = cell;
      }
    }
  });

  // If no dedicated image rows found, look for pictures inside the content cell
  // (DM links converted to <picture> by dm-support.js live alongside the heading)
  if (!desktopPic && !mobilePic && contentCell) {
    const pics = [...contentCell.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
    pics.forEach((pic) => {
      const wrapper = pic.closest('p, div');
      if (wrapper && wrapper.parentNode === contentCell) wrapper.remove();
      else pic.remove();
    });
  }

  if (!desktopPic && !mobilePic) {
    const pics = [...block.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
  }

  const imageDiv = document.createElement('div');
  // keep both pictures (each with its own alt); CSS shows one per breakpoint.
  // When only one is authored it carries no toggle class and always shows.
  if (desktopPic && mobilePic) {
    desktopPic.classList.add('hero-image-desktop');
    mobilePic.classList.add('hero-image-mobile');

    // The hero image is the LCP element on every breakpoint, and aem.js's
    // waitForFirstImage eager-loads only the FIRST <img> in DOM order. With the
    // desktop crop first, on mobile the visible mobile crop was left lazy and its
    // fetch deferred — the cause of the poor mobile LCP. Order the crop shown at
    // the CURRENT breakpoint (crossover 900px, per hero.css) FIRST so it is the
    // eager LCP candidate and mark it high priority; the hidden crop is
    // display:none and set lazy, so it never enters the viewport and its fetch is
    // skipped (no double download competing for the mobile connection).
    const desktopShown = window.matchMedia(desktopQuery).matches;
    const [lcpPic, otherPic] = desktopShown
      ? [desktopPic, mobilePic] : [mobilePic, desktopPic];
    const lcpImg = lcpPic.querySelector('img');
    const otherImg = otherPic.querySelector('img');
    if (lcpImg) { lcpImg.setAttribute('loading', 'eager'); lcpImg.setAttribute('fetchpriority', 'high'); }
    if (otherImg) { otherImg.setAttribute('loading', 'lazy'); otherImg.removeAttribute('fetchpriority'); }
    imageDiv.append(lcpPic, otherPic);
  } else if (desktopPic || mobilePic) {
    const only = desktopPic || mobilePic;
    imageDiv.append(only);
    const img = only.querySelector('img');
    if (img) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }
  }

  const contentDiv = document.createElement('div');
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

/**
 * Image-slide variant (corp): option classes place the headline on the image the way
 * the source slide does, e.g. `hero (image-slide, top-15, left-56, right-10, size-2)`:
 *   top-<n> / left-<n> / right-<n>  headline box inset, % of the image (7-5 = 7.5%)
 *   size-<n>                        headline size in vw on desktop, doubled on phones
 *   text-below                      phones: headline under the image (hero-corp.css)
 * @param {Element} block the hero block
 */
function readSlideOptions(block) {
  [...block.classList].forEach((name) => {
    const match = name.match(/^(top|left|right|size)-(\d+)(?:-(\d+))?$/);
    if (!match) return;
    const [, option, whole, fraction] = match;
    const value = Number(fraction ? `${whole}.${fraction}` : whole);
    if (option === 'size') block.style.setProperty('--hero-slide-text-size', value);
    else block.style.setProperty(`--hero-slide-${option}`, `${value}%`);
  });
}

export default function decorate(block) {
  // image-slide swaps to the desktop crop at 600px (source 840px), the others at 900px
  if (block.classList.contains('image-slide')) {
    readSlideOptions(block);
    setupHero(block, '(width >= 600px)');
  } else {
    setupHero(block);
  }

  // Fullbleed variant: split the two-tone headline (lead sentence in light serif,
  // remainder in Futura bold via an accent span). The poster modifier keeps the
  // headline as a single serif style (matches the stroke-awareness banner), so
  // skip the split there.
  if (block.classList.contains('fullbleed') && !block.classList.contains('poster')) {
    const h1 = block.querySelector('h1');
    if (h1 && (h1.childElementCount === 0
      || (h1.childElementCount === 1 && h1.querySelector(':scope > strong')))) {
      const text = h1.textContent.trim();
      const match = text.match(/^(.*?[.!?])\s+(.+)$/s);
      if (match) {
        const [, lead, rest] = match;
        h1.textContent = `${lead} `;
        const accent = document.createElement('span');
        accent.className = 'hero-headline-accent';
        accent.textContent = rest;
        h1.append(accent);
      }
    }
  }

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // stroke headline: the published pipeline drops the space before the inline
  // gold accent ("Understanding<em>stroke</em>") while the editor keeps it.
  // Restore it when missing so the gap is one space in both — no margin hack
  // that would double the gap in the editor.
  if (block.closest('.hero-stroke')) {
    block.querySelectorAll('h1 em').forEach((em) => {
      const prev = em.previousSibling;
      if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent
        && !/\s$/.test(prev.textContent)) {
        prev.textContent += ' ';
      }
    });
  }
}
