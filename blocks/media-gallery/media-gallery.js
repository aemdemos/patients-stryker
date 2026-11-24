/*
 * Media Gallery: the stryker.com Dynamic Media galleries (docs/standardisation/media-gallery.md),
 * in review on draft pages.
 *
 * Authored rows: one image per row (a Dynamic Media image link or an image), in the order they
 * show. A block with a single Dynamic Media set link (…/is/image/stryker/<set>) shows the set's
 * images as Dynamic Media lists them, so a set kept in DAM stays the source.
 * Variants:
 *   - (default) gallery: the selected image, a strip of square thumbnails under it, with
 *     arrows when the strip doesn't fit (stryker.com mixed media and image sets);
 *   - `spin-set`: a 360° view of a product: drag the image or use the arrows below it to turn it.
 * Older names: `mixed-media` and `image-set` are the gallery.
 */

const DM_IMAGE = /\/is\/image\//i;

/** The URL of a Dynamic Media image without its query (the asset itself). */
const assetOf = (src) => src.split('?')[0];

/** A Dynamic Media image URL at a given size. */
const sized = (src, w, h) => `${assetOf(src)}?wid=${w}${h ? `&hei=${h}` : ''}&fit=constrain,1&fmt=jpg&qlt=85`;

/** The images of the block's rows: [{ src, alt }] (a link or an image per row). */
function authoredItems(block) {
  return [...block.children].map((row) => {
    const img = row.querySelector('img');
    if (img) return { src: img.currentSrc || img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    const a = row.querySelector('a[href]');
    if (a) return { src: a.getAttribute('href'), alt: a.textContent.trim() === a.getAttribute('href') ? '' : a.textContent.trim() };
    return null;
  }).filter((item) => item && item.src);
}

/**
 * The images of a Dynamic Media set (`req=set,json`), or null when the URL is not a set.
 * @param {string} src A Dynamic Media image or set URL
 * @returns {Promise<Array<{src: string, alt: string, w: number, h: number}>|null>}
 */
async function setItems(src) {
  if (!DM_IMAGE.test(src)) return null;
  try {
    const resp = await fetch(`${assetOf(src)}?req=set,json`);
    if (!resp.ok) return null;
    const text = await resp.text();
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const items = json.set && [].concat(json.set.item || []);
    if (!items || !items.length || !json.set.type || json.set.type === 'img') return null;
    const base = assetOf(src).replace(/\/is\/image\/.*$/, '/is/image/');
    return items.filter((item) => item.i && item.i.n).map((item) => ({
      src: `${base}${item.i.n}`,
      alt: '',
      w: Number(item.dx) || 0,
      h: Number(item.dy) || 0,
    }));
  } catch {
    return null;
  }
}

function imageEl(src, alt, width, eager) {
  const img = document.createElement('img');
  img.src = DM_IMAGE.test(src) ? sized(src, width) : src;
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  return img;
}

function arrow(className, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  return button;
}

/** The gallery: the selected image and the thumbnail strip. */
function buildGallery(block, items) {
  const stage = document.createElement('div');
  stage.className = 'media-gallery-stage';
  const first = items[0];
  if (first.w && first.h) stage.style.setProperty('--media-gallery-ratio', `${first.w} / ${first.h}`);
  const main = imageEl(first.src, first.alt, 1440, false);
  // authored rows carry no size: the first image sets the stage's shape once it has loaded
  main.addEventListener('load', () => {
    if (!stage.style.getPropertyValue('--media-gallery-ratio') && main.naturalWidth) {
      stage.style.setProperty('--media-gallery-ratio', `${main.naturalWidth} / ${main.naturalHeight}`);
    }
  }, { once: true });
  stage.append(main);

  const strip = document.createElement('div');
  strip.className = 'media-gallery-strip';
  const prev = arrow('media-gallery-prev', 'Previous images');
  const next = arrow('media-gallery-next', 'Next images');
  const view = document.createElement('div');
  view.className = 'media-gallery-view';
  const list = document.createElement('ul');
  list.className = 'media-gallery-thumbs';
  const thumbs = items.map((item, i) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', item.alt || `Image ${i + 1} of ${items.length}`);
    button.append(imageEl(item.src, '', 112, false));
    li.append(button);
    list.append(li);
    return button;
  });
  view.append(list);
  strip.append(prev, view, next);

  let page = 0;
  // stryker.com's strip: every thumbnail, centred, when they fit; otherwise as many whole
  // thumbnails as fit between the two arrows (at least a gap from each), a page at a time
  const layout = () => {
    const styles = getComputedStyle(block);
    const size = parseFloat(styles.getPropertyValue('--media-gallery-thumb')) || 56;
    const gap = parseFloat(styles.getPropertyValue('--media-gallery-gap')) || 10;
    const pitch = size + gap;
    const width = strip.clientWidth;
    const fits = items.length * pitch - gap <= width;
    const count = fits ? items.length
      : Math.max(1, Math.floor((width - 2 * (size + gap) + gap) / pitch));
    strip.classList.toggle('media-gallery-scrolls', !fits);
    view.style.width = `${count * pitch - gap}px`;
    page = Math.min(page, Math.ceil(items.length / count) - 1);
    const offset = Math.min(page * count, items.length - count);
    list.style.transform = offset ? `translateX(${-offset * pitch}px)` : '';
    prev.disabled = offset === 0;
    next.disabled = offset + count >= items.length;
  };

  const select = (i) => {
    thumbs.forEach((t, j) => t.setAttribute('aria-current', String(i === j)));
    const item = items[i];
    main.src = DM_IMAGE.test(item.src) ? sized(item.src, 1440) : item.src;
    main.alt = item.alt;
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  prev.addEventListener('click', () => { page = Math.max(0, page - 1); layout(); });
  next.addEventListener('click', () => { page += 1; layout(); });
  select(0);

  block.replaceChildren(stage);
  if (items.length > 1) {
    block.append(strip);
    new ResizeObserver(layout).observe(strip);
  }
}

/** The 360° spin: one frame at a time, turned by dragging or with the arrows. */
function buildSpin(block, items) {
  const stage = document.createElement('div');
  stage.className = 'media-gallery-stage media-gallery-spin';
  const first = items[0];
  if (first.w && first.h) stage.style.setProperty('--media-gallery-ratio', `${first.w} / ${first.h}`);
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', first.alt || 'Product 360° view: drag or use the arrow keys to turn it');
  const frames = items.map((item, i) => {
    const img = imageEl(item.src, '', 1440, false);
    img.hidden = i > 0;
    // the other frames load once the first one has
    if (i > 0) img.loading = 'lazy';
    stage.append(img);
    return img;
  });
  let current = 0;
  const show = (i) => {
    const n = ((i % frames.length) + frames.length) % frames.length;
    frames[current].hidden = true;
    frames[n].hidden = false;
    frames[n].loading = 'eager';
    current = n;
  };
  const controls = document.createElement('div');
  controls.className = 'media-gallery-spin-buttons';
  const left = arrow('media-gallery-spin-left', 'Turn left');
  const right = arrow('media-gallery-spin-right', 'Turn right');
  left.addEventListener('click', () => show(current - 1));
  right.addEventListener('click', () => show(current + 1));
  controls.append(left, right);

  let startX = null;
  let startFrame = 0;
  stage.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startFrame = current;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    // one turn across the image's width
    const step = stage.clientWidth / frames.length;
    show(startFrame + Math.round((startX - e.clientX) / step));
  });
  const end = () => { startX = null; };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { show(current - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { show(current + 1); e.preventDefault(); }
  });
  block.replaceChildren(stage, controls);
}

export default async function decorate(block) {
  // in review: only draft pages render it (body.std-draft, scripts/corp.js)
  if (!document.body.classList.contains('std-draft')) return;
  let items = authoredItems(block);
  if (items.length === 1) items = (await setItems(items[0].src)) || items;
  if (!items.length) return;
  if (block.classList.contains('spin-set')) buildSpin(block, items);
  else buildGallery(block, items);
}
