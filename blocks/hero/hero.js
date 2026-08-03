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

  // First matching <source> wins: <=840px picks the portrait mobile asset,
  // wider viewports fall through to the desktop sources / <img> default.
  const mobileMediaSource = document.createElement('source');
  mobileMediaSource.media = '(max-width: 840px)';
  mobileMediaSource.srcset = mobileSrcset;
  if (mobileSource && mobileSource.type) mobileMediaSource.type = mobileSource.type;
  desktopPic.prepend(mobileMediaSource);
}

/**
 * Set up the fullbleed hero from its authored, labeled rows.
 *
 * Authoring model (2-column labeled rows so authors clearly manage each image):
 *   | desktop | <wide image> |
 *   | mobile  | <portrait image> |
 *   | <heading + supporting copy> |   (single cell)
 *
 * scripts/dm-support.js has already turned each authored DM link into its own
 * <picture>. Here we read the labels, merge the two into one responsive
 * <picture> (mobile served via a `(max-width: 840px)` source), and rebuild the
 * block into the [image][content] structure the CSS overlays.
 * @param {Element} block the hero block
 */
function setupFullbleed(block) {
  let desktopPic = null;
  let mobilePic = null;
  let contentCell = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      // labeled image row: [label | image]
      const label = cells[0].textContent.trim().toLowerCase();
      const pic = cells[1].querySelector('picture');
      if (label === 'mobile') mobilePic = pic || mobilePic;
      else desktopPic = pic || desktopPic; // 'desktop' or any unlabeled image row
    } else if (cells.length === 1 && cells[0].querySelector('h1, h2, h3, p')) {
      // content row: heading + supporting copy
      [contentCell] = cells;
    }
  });

  // Fallback: if labels weren't matched (e.g. authored as one cell), take the
  // first two pictures in document order as desktop then mobile.
  if (!desktopPic && !mobilePic) {
    const pics = [...block.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
  }

  if (desktopPic && mobilePic) foldMobileSource(desktopPic, mobilePic);
  const heroPicture = desktopPic || mobilePic;

  // Rebuild: a clean [image][content] pair the CSS stacks/overlays.
  const imageDiv = document.createElement('div');
  if (heroPicture) imageDiv.append(heroPicture);

  const contentDiv = document.createElement('div');
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

export default function decorate(block) {
  // Fullbleed variant: rebuild from labeled image rows, merge the responsive
  // pair, then split the two-tone headline (lead sentence in the light serif
  // heading font, remainder in Futura bold via an accent span).
  if (block.classList.contains('fullbleed')) {
    setupFullbleed(block);

    const h1 = block.querySelector('h1');
    if (h1 && h1.childElementCount === 0) {
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

  // A hero with no image (e.g. a text-only banner) flips to dark-on-light text.
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
