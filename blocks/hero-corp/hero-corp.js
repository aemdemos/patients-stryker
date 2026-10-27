import decorateDMAssets from '../../scripts/dm-support.js';

/**
 * A row cell that only links to a fragment document (a slide image kept as its own
 * fragment, e.g. /us/en/fragments/…/hero-image/master): the link, or null.
 */
function fragmentLinkOf(cell) {
  if (cell.querySelector('picture, img')) return null;
  const links = cell.querySelectorAll('a[href]');
  if (links.length !== 1 || cell.textContent.trim() !== links[0].textContent.trim()) return null;
  const url = new URL(links[0].getAttribute('href'), window.location.href);
  return url.origin === window.location.origin && url.pathname.includes('/fragments/') ? links[0] : null;
}

/**
 * Slide image rows that link to fragment documents: the cell is replaced by the first image
 * of its fragment (fetched as .plain.html, its Dynamic Media links decorated), so the rows read
 * like authored image rows (the whole cell: the page's button decoration may already have
 * wrapped the lone link in a paragraph). All fragments are fetched in parallel; a fragment
 * that cannot be loaded leaves its row empty.
 * @param {Element} block The hero-corp block
 */
async function resolveFragmentImages(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')].filter(fragmentLinkOf);
  await Promise.all(cells.map(async (cell) => {
    const link = fragmentLinkOf(cell);
    const path = new URL(link.getAttribute('href'), window.location.href).pathname.replace(/\/$/, '');
    let media = null;
    try {
      // started early by scripts/corp.js (prefetchHeroFragments) for the first heroes
      const pending = window.hlx && window.hlx.heroFragments && window.hlx.heroFragments.get(path);
      const html = pending ? await pending
        : await fetch(`${path}.plain.html`).then((resp) => (resp.ok ? resp.text() : null));
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        decorateDMAssets(doc.body);
        const found = doc.body.querySelector('picture') || doc.body.querySelector('img');
        if (found) media = document.importNode(found, true);
      }
    } catch {
      media = null;
    }
    if (media && media.tagName === 'IMG') {
      const picture = document.createElement('picture');
      picture.append(media);
      media = picture;
    }
    if (media) cell.replaceChildren(media);
    else cell.replaceChildren();
  }));
}

/**
 * Set up the corp image-slide hero from its authored rows.
 * @param {Element} block The hero-corp block
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
      } else if (!pic && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
        contentCell = cell;
      }
    }
  });

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
  if (desktopPic && mobilePic) {
    desktopPic.classList.add('hero-image-desktop');
    mobilePic.classList.add('hero-image-mobile');

    // Put the visible crop first so the eager LCP image matches the current viewport.
    const desktopShown = window.matchMedia('(width >= 600px)').matches;
    const [lcpPic, otherPic] = desktopShown
      ? [desktopPic, mobilePic] : [mobilePic, desktopPic];
    const lcpImg = lcpPic.querySelector('img');
    const otherImg = otherPic.querySelector('img');
    if (lcpImg) {
      lcpImg.setAttribute('loading', 'eager');
      lcpImg.setAttribute('fetchpriority', 'high');
    }
    if (otherImg) {
      otherImg.setAttribute('loading', 'lazy');
      otherImg.removeAttribute('fetchpriority');
    }
    imageDiv.append(lcpPic, otherPic);
  } else if (desktopPic || mobilePic) {
    const only = desktopPic || mobilePic;
    imageDiv.append(only);
    const img = only.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
  }

  const contentDiv = document.createElement('div');
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

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

export default async function decorate(block) {
  readSlideOptions(block);
  await resolveFragmentImages(block);
  setupHero(block);

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
