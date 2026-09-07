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

  // Classify each cell by content, not by position/row-count: a cell holding a
  // <picture> (from the converted DM link) is an image cell — the first is
  // desktop, the second mobile; a cell holding a heading/copy is the content
  // cell. This is robust to the authored structure (matches the cards approach).
  [...block.children].forEach((cell) => {
    const pic = cell.querySelector('picture');
    const hasCopy = cell.querySelector('h1, h2, h3, h4, h5, h6, p:not(:has(picture, a[href]))');
    if (pic && !cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      if (!desktopPic) desktopPic = pic;
      else if (!mobilePic) mobilePic = pic;
    } else if (hasCopy) {
      contentCell = cell;
    }
  });

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
    imageDiv.append(desktopPic, mobilePic);
  } else if (desktopPic || mobilePic) {
    imageDiv.append(desktopPic || mobilePic);
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
