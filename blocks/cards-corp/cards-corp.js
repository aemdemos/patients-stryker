import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';
import {
  fetchPlaceholders, fetchQueryIndex, getLocalePrefix, toIndexPath,
} from '../../scripts/utils.js';
import { isVideoUrl, videoPlayerFor } from '../video/video.js';

/**
 * video variant: the player for a cell that holds only a video — a Dynamic Media player
 * (rendered by decorateDMAssets) or a single YouTube/DM link. Null for any other cell.
 * @param {Element} cell a card cell
 * @returns {HTMLElement|null}
 */
function videoIn(cell) {
  const text = cell.textContent.trim();
  const dm = cell.querySelectorAll('.dm-video-wrapper');
  if (dm.length === 1 && text === dm[0].textContent.trim()) return dm[0];
  const links = cell.querySelectorAll('a[href]');
  if (links.length !== 1 || cell.querySelector('picture, img')) return null;
  if (text !== links[0].textContent.trim()) return null;
  return videoPlayerFor(links[0]);
}

function buildCardCells(entry, href, ctaLabel) {
  const imageCell = document.createElement('div');
  if (entry.image && isDMSrc(entry.image)) {
    // authored DM images are bare links; decorateDMAssets renders them (URL text → empty alt)
    const dmLink = document.createElement('a');
    dmLink.href = entry.image;
    dmLink.textContent = entry.image;
    imageCell.append(dmLink);
  } else if (entry.image) {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = entry.image;
    // the title right below names the card; the image link is hidden from AT
    img.alt = '';
    img.loading = 'lazy';
    picture.append(img);
    imageCell.append(picture);
  }

  const body = document.createElement('div');
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = href;
  titleLink.textContent = entry.title;
  h3.append(titleLink);
  body.append(h3);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    body.append(p);
  }
  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.href = href;
  cta.className = 'link-strong';
  cta.textContent = ctaLabel;
  ctaP.append(cta);
  body.append(ctaP);

  return [imageCell, body];
}

/* Rows authored as a single page link are filled from the query index;
   links to pages not (yet) published are dropped. In the video variant a lone
   video link is a video tile, not a page. */
async function hydrateLinkRows(block) {
  const isVideo = block.classList.contains('video');
  const linkRows = [...block.children].filter((row) => {
    const links = row.querySelectorAll('a[href]');
    return links.length === 1 && !row.querySelector('picture, img, h1, h2, h3, h4, h5, h6')
      && row.textContent.trim() === links[0].textContent.trim()
      && !(isVideo && isVideoUrl(links[0].getAttribute('href')));
  });
  if (!linkRows.length) return;

  const prefix = getLocalePrefix();
  const [index, placeholders] = await Promise.all([
    fetchQueryIndex(prefix),
    fetchPlaceholders(prefix),
  ]);
  const ctaLabel = placeholders.learnMore || 'Learn more';
  linkRows.forEach((row) => {
    const path = toIndexPath(row.querySelector('a').getAttribute('href'));
    const entry = index.get(path);
    if (!entry?.title) {
      row.remove();
      return;
    }
    row.replaceChildren(...buildCardCells(entry, path, ctaLabel));
  });
}

/**
 * Cards Corp: one row per card — an image cell and a body cell (H3, text, CTA).
 * The image links to the card's last link ("Learn more", else the H3 link), like the
 * source Related Products teasers.
 * text variant: the first cell holds the title (gold band) instead of an image.
 * video variant: a cell holding only a YouTube/Dynamic Media link is an inline player.
 * A row holding only a page link is built from that page's query-index entry.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  await hydrateLinkRows(block);

  // convert DM links to <picture>; the canvas re-renders fields from source, so re-run here
  decorateDMAssets(block);

  const isText = block.classList.contains('text');
  const isVideo = block.classList.contains('video');

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div, i) => {
      const video = isVideo && videoIn(div);
      if (video) {
        // lift the player out of the editor wrapper so the canvas can't re-render over it
        div.className = 'cards-corp-card-video';
        div.replaceChildren(video);
      } else if (isText && i === 0) div.className = 'cards-corp-card-title';
      else if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-corp-card-image';
      else div.className = 'cards-corp-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  ul.querySelectorAll('li').forEach((li) => {
    const cell = li.querySelector('.cards-corp-card-image');
    const picture = cell?.querySelector('picture');
    if (!picture) return;
    let link = picture.closest('a');
    const cta = [...li.querySelectorAll('.cards-corp-card-body a[href]')].pop();
    if (!link && cta) {
      // duplicate of the card's CTA: keep it out of the tab order and the a11y tree
      link = document.createElement('a');
      link.href = cta.getAttribute('href');
      link.tabIndex = -1;
      link.setAttribute('aria-hidden', 'true');
      picture.replaceWith(link);
      link.append(picture);
    }
    // lift the image out of the editor wrapper so the canvas can't re-render over it
    cell.replaceChildren(link || picture);
  });

  block.replaceChildren(ul);
}
