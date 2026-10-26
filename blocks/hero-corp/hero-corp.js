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

export default function decorate(block) {
  readSlideOptions(block);
  setupHero(block);

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
