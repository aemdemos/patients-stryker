/**
 * Fold a mobile <picture> into a desktop <picture> as a leading, media-scoped
 * <source> so the browser downloads only the asset that matches the viewport
 * (keeps the hero a single-download LCP element).
 * @param {HTMLPictureElement} desktopPic the wide desktop picture (kept)
 * @param {HTMLPictureElement} mobilePic the portrait mobile picture (folded in)
 */
function foldMobileSource(desktopPic, mobilePic) {
  const mobileImg = mobilePic.querySelector('img');
  const mobileSource = mobilePic.querySelector('source');
  const mobileSrcset = (mobileSource && mobileSource.srcset)
    || (mobileImg && mobileImg.getAttribute('src'));
  if (!mobileSrcset) return;

  const mobileMediaSource = document.createElement('source');
  // serve the mobile asset below the 840px desktop crossover (matches source)
  mobileMediaSource.media = '(max-width: 839px)';
  mobileMediaSource.srcset = mobileSrcset;
  if (mobileSource && mobileSource.type) mobileMediaSource.type = mobileSource.type;
  desktopPic.prepend(mobileMediaSource);
}

/**
 * Set up the hero from its authored rows.
 *
 * Authoring model (single-column rows):
 *   | <desktop image> |
 *   | <mobile image>  |  (optional)
 *   | <heading + supporting copy> |
 *
 * Merges desktop + mobile pictures into one responsive <picture> and rebuilds
 * the block into [image][content] structure the CSS overlays.
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

  if (desktopPic && mobilePic) foldMobileSource(desktopPic, mobilePic);
  const heroPicture = desktopPic || mobilePic;

  const imageDiv = document.createElement('div');
  if (heroPicture) imageDiv.append(heroPicture);

  const contentDiv = document.createElement('div');
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

export default function decorate(block) {
  setupHero(block);

  // Fullbleed variant: split the two-tone headline (lead sentence in light serif,
  // remainder in Futura bold via an accent span).
  if (block.classList.contains('fullbleed')) {
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
