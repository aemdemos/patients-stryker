/*
 * Interactive Image: a stryker.com image with lettered hotspots that link to products
 * (docs/standardisation/interactive-image.md), in review on draft pages.
 *
 * Authored rows:
 *   - the image (a Dynamic Media image link or an image); the letters are part of the image;
 *   - one row per hotspot: its letter | its place on the image, across and down in percent
 *     ("5.9, 80.8") | the link it opens.
 * The hotspot is stryker.com's 56px ring, centred on its place.
 */

/** "5.9, 80.8" / "5.9% 80.8%" → [5.9, 80.8], or null. */
function placeOf(text) {
  const n = String(text).match(/-?\d+(?:\.\d+)?/g);
  if (!n || n.length < 2) return null;
  const [x, y] = n.map(Number);
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return [x, y];
}

export default function decorate(block) {
  // in review: only draft pages render it (body.std-draft, scripts/corp.js)
  if (!document.body.classList.contains('std-draft')) return;
  const rows = [...block.children];
  const imageRow = rows.find((row) => row.querySelector('picture, img'));
  if (!imageRow) return;
  const figure = document.createElement('div');
  figure.className = 'interactive-image-figure';
  figure.append(imageRow.querySelector('picture') || imageRow.querySelector('img'));

  const list = document.createElement('ul');
  list.className = 'interactive-image-hotspots';
  rows.filter((row) => row !== imageRow).forEach((row) => {
    const cells = [...row.children];
    const label = (cells[0] && cells[0].textContent.trim()) || '';
    const place = cells[1] && placeOf(cells[1].textContent);
    const link = row.querySelector('a[href]');
    if (!place || !link) return;
    const li = document.createElement('li');
    li.style.setProperty('--hotspot-x', `${place[0]}%`);
    li.style.setProperty('--hotspot-y', `${place[1]}%`);
    const a = document.createElement('a');
    a.href = link.href;
    if (link.target) a.target = link.target;
    const name = link.textContent.trim();
    const named = name && name !== label && name !== link.getAttribute('href') ? name : '';
    a.setAttribute('aria-label', [label, named].filter(Boolean).join(': ') || link.href);
    a.className = 'interactive-image-hotspot';
    li.append(a);
    list.append(li);
  });
  figure.append(list);
  block.replaceChildren(figure);
}
