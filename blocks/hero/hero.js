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
 */
function setupHero(block) {
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
    const desktopShown = window.matchMedia('(width >= 900px)').matches;
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

export default function decorate(block) {
  setupHero(block);

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
}
