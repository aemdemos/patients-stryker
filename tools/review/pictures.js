/*
 * Pictures in the chats (25 Nov 2026): a screenshot of what a page shows after a click, on the
 * migrated or the source page. Getting one in (a Picture button, pasting into the message box,
 * dropping onto it), making a big one smaller in the browser, uploading it in parts (a request
 * may not be over 1 MB; backend action `images`), showing the pictures of a message, and the
 * viewer: the picture large in a dialog, zoom in / out (buttons, Ctrl+wheel, + − 0 1 F keys), Fit
 * (all of it in the window), Fill (the window's whole width and height, the rest scrolls),
 * dragged around when it is larger than the window, the message's other pictures with ‹ ›.
 * Fast (25 Nov 2026): a picture never changes, so each one is kept in the browser (Cache
 * Storage) the first time it is shown and never downloaded again; the chat shows a small version
 * (made when it is sent, ~640 px wide), the viewer the whole picture; a page's links come with
 * its messages (store.js). DOM only (no innerHTML).
 */
import { call } from './store.js';
import { links, knownLink } from './picture-links.js';

const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = './pictures.css';
document.head.append(css);

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
};

export const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_PICTURES = 6;
// kept as they are up to this size; bigger ones are made smaller (still sharp enough to read)
const KEEP_BYTES = 1.5 * 1024 * 1024;
const MAX_SIDE = 4096;
const MAX_PIXELS = 12e6;
const PART = 600 * 1024;

/** the pictures among a paste's or a drop's files */
export const picturesIn = (list) => [...(list || [])].filter((f) => f && TYPES.includes(f.type));

const toBlob = (canvas, type, quality) => new Promise((done) => {
  canvas.toBlob(done, type, quality);
});

const encode = async (canvas, quality) => {
  const webp = await toBlob(canvas, 'image/webp', quality);
  return webp && webp.type === 'image/webp' ? webp : toBlob(canvas, 'image/jpeg', quality);
};

// the chat's small version: up to 640 px wide, its top (the chat shows a picture's top-left part)
const THUMB_W = 640;
const THUMB_MAX_H = 800;
async function thumbOf(bitmap) {
  const { width, height } = bitmap;
  const scale = Math.min(1, THUMB_W / width);
  const cropH = Math.min(height, Math.round(THUMB_MAX_H / scale));
  if (scale === 1 && cropH === height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(cropH * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, cropH, 0, 0, canvas.width, canvas.height);
  const blob = await encode(canvas, 0.82);
  return { blob, w: canvas.width, h: canvas.height };
}

/**
 * A picture ready to send: { blob, w, h, url (to show it before it is sent), thumb? }. Small ones
 * as they are; big ones drawn smaller and saved as WebP (JPEG where the browser can't write
 * WebP); thumb: the chat's small version, for pictures larger than it
 */
export async function prepare(file) {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  let blob = file;
  const thumb = await thumbOf(bitmap);
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_PIXELS / (w * h)));
  if (file.size > KEEP_BYTES || scale < 1) {
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await encode(canvas, 0.9);
  }
  bitmap.close?.();
  return {
    blob, w, h, url: URL.createObjectURL(blob), thumb,
  };
}

const base64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return window.btoa(s);
};

/** uploads a prepared picture for a page, in parts → its id (throws with the backend's message) */
export async function upload(page, pic, onProgress = () => {}) {
  const total = Math.max(1, Math.ceil(pic.blob.size / PART));
  // (one part after the other: each names the picture the first one got, the last one puts it
  // together)
  const id = await Array.from({ length: total }, (_, n) => n).reduce(async (before, n) => {
    const got = await before;
    onProgress(n / total);
    const { status, body } = await call('images', {
      method: 'POST',
      body: JSON.stringify({
        op: 'part', page, n, total, id: got, data: await base64(pic.blob.slice(n * PART, (n + 1) * PART)),
      }),
    });
    if (status !== 200 || !body?.id) throw new Error(body?.error?.message || `The picture could not be sent (${status})`);
    return body.id;
  }, Promise.resolve(undefined));
  onProgress(1);
  return id;
}

// the pictures' short-lived links (picture-links.js): the missing ones asked for together
let asking = null;
const waiting = new Set();

async function askLinks() {
  const ids = [...waiting];
  waiting.clear();
  asking = null;
  const chunks = [];
  for (let i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));
  await Promise.all(chunks.map(async (chunk) => {
    const { status, body } = await call(`images?ids=${chunk.join(',')}`);
    const until = Date.now() + 50 * 60 * 1000;
    chunk.forEach((id) => {
      const url = status === 200 ? body?.urls?.[id] : null;
      links.set(id, { url, until: url ? until : Date.now() + 60 * 1000 });
    });
  }));
}

/** the link of each picture id (asked for once for all the ids of a redraw) */
async function linksOf(ids) {
  const now = Date.now();
  ids.filter((id) => !(links.get(id)?.until > now)).forEach((id) => waiting.add(id));
  if (waiting.size) {
    asking = asking || new Promise((done) => {
      window.setTimeout(() => askLinks().then(done, done), 0);
    });
    await asking;
  }
  return new Map(ids.map((id) => [id, links.get(id)?.url || null]));
}

/* ---------- the pictures kept in the browser ---------- */

const CACHE = 'review-pictures-v1';
const cacheKey = (id) => new URL(`./__pictures/${id}`, window.location.href).href;
// this visit's pictures: id → object URL (shown at once on a redraw), and the ones on their way
const ready = new Map();
const loading = new Map();
const openCache = () => (window.caches
  ? window.caches.open(CACHE).catch(() => null) : Promise.resolve(null));

/** a picture just sent from this browser: kept, never downloaded */
export async function keepPicture(id, blob) {
  if (!id || !blob) return;
  ready.set(id, URL.createObjectURL(blob));
  const cache = await openCache();
  await cache?.put(cacheKey(id), new Response(blob, { headers: { 'content-type': blob.type } })).catch(() => null);
}

/**
 * A picture to show (an object URL): kept in the browser, else downloaded once and kept. Where
 * the browser keeps nothing (or the download is refused) its link is used as it is.
 */
export function pictureUrl(id) {
  if (ready.has(id)) return Promise.resolve(ready.get(id));
  if (loading.has(id)) return loading.get(id);
  const job = (async () => {
    const cache = await openCache();
    let res = await cache?.match(cacheKey(id)).catch(() => null);
    if (!res) {
      const link = knownLink(id) || (await linksOf([id])).get(id);
      if (!link) return null;
      res = await fetch(link).catch(() => null);
      if (!res?.ok) return link;
      await cache?.put(cacheKey(id), res.clone()).catch(() => null);
    }
    const url = URL.createObjectURL(await res.blob());
    ready.set(id, url);
    return url;
  })().finally(() => loading.delete(id));
  loading.set(id, job);
  return job;
}

/* ---------- the viewer ---------- */

let viewer = null;

function makeViewer() {
  const img = el('img', { class: 'pv-img', alt: '', draggable: 'false' });
  const stage = el('div', { class: 'pv-stage' }, img);
  const count = el('span', { class: 'pv-count' });
  const zoomLabel = el('output', { class: 'pv-zoom', 'aria-live': 'polite' });
  const btn = (label, title, onclick, cls = '') => el('button', {
    type: 'button', class: `pv-btn ${cls}`, title, 'aria-label': title, onclick,
  }, label);
  const open = el('a', {
    class: 'pv-btn pv-open', target: '_blank', rel: 'noopener', title: 'Open the picture in a new tab',
  }, 'Open ↗');
  const dialog = el('dialog', { class: 'pv-dialog', 'aria-label': 'Picture', closedby: 'any' });
  const v = {
    dialog, img, stage, pics: [], index: 0, zoom: 1, fit: 1,
  };
  const setZoom = (z, at) => {
    const before = v.zoom;
    v.zoom = Math.min(8, Math.max(0.05, z));
    const nw = Math.round((img.naturalWidth || 1) * v.zoom);
    // (zoomed around the pointer, or the middle)
    const r = stage.getBoundingClientRect();
    const ax = at ? at.x - r.left : r.width / 2;
    const ay = at ? at.y - r.top : r.height / 2;
    const cx = (stage.scrollLeft + ax) / before;
    const cy = (stage.scrollTop + ay) / before;
    img.style.width = `${nw}px`;
    stage.classList.toggle('pv-big', nw > stage.clientWidth || img.offsetHeight > stage.clientHeight);
    stage.scrollLeft = cx * v.zoom - ax;
    stage.scrollTop = cy * v.zoom - ay;
    zoomLabel.textContent = `${Math.round(v.zoom * 100)}%`;
  };
  const fitZoom = () => {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    v.fit = Math.min(1, (stage.clientWidth - 32) / w, (stage.clientHeight - 32) / h);
    return v.fit;
  };
  // (the window's whole width and height: the rest of the picture scrolls)
  const fillZoom = () => {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    return Math.max((stage.clientWidth - 32) / w, (stage.clientHeight - 32) / h);
  };
  v.show = (i) => {
    v.index = (i + v.pics.length) % v.pics.length;
    const p = v.pics[v.index];
    count.textContent = v.pics.length > 1 ? `${v.index + 1} / ${v.pics.length}` : '';
    dialog.classList.toggle('pv-many', v.pics.length > 1);
    img.removeAttribute('src');
    img.style.width = '';
    // (shown once it fits the window: no flash at full size)
    img.style.visibility = 'hidden';
    zoomLabel.textContent = '';
    const set = (url) => {
      if (!url || v.pics[v.index] !== p) return;
      img.onload = () => {
        setZoom(fitZoom());
        img.style.visibility = '';
      };
      img.src = url;
      open.href = url;
    };
    if (p.url) set(p.url);
    else pictureUrl(p.id).then(set);
  };
  const head = el(
    'div',
    { class: 'pv-head' },
    btn('‹', 'Previous picture (←)', () => v.show(v.index - 1), 'pv-nav'),
    count,
    btn('›', 'Next picture (→)', () => v.show(v.index + 1), 'pv-nav'),
    el('span', { class: 'pv-gap' }),
    btn('−', 'Zoom out (−)', () => setZoom(v.zoom / 1.25)),
    zoomLabel,
    btn('+', 'Zoom in (+)', () => setZoom(v.zoom * 1.25)),
    btn('Fit', 'Fit: all of it in the window (0)', () => setZoom(fitZoom())),
    btn('Fill', 'Fill the window\'s whole width and height (F)', () => setZoom(fillZoom())),
    btn('100%', 'Actual size (1)', () => setZoom(1)),
    open,
    btn('×', 'Close (Esc)', () => dialog.close(), 'pv-close'),
  );
  dialog.append(head, stage);
  // the backdrop and the empty space around the picture close it (light dismiss, also where
  // closedby isn't known yet)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target === stage && !stage.classList.contains('pv-big'))) dialog.close();
  });
  stage.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(v.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
  }, { passive: false });
  img.addEventListener('dblclick', (e) => setZoom(Math.abs(v.zoom - 1) < 0.01 ? fitZoom() : 1, { x: e.clientX, y: e.clientY }));
  // dragged around when it is larger than the window
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (!stage.classList.contains('pv-big') || e.button !== 0) return;
    drag = {
      x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop,
    };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('pv-dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (e.clientX - drag.x);
    stage.scrollTop = drag.top - (e.clientY - drag.y);
  });
  const stop = () => {
    drag = null;
    stage.classList.remove('pv-dragging');
  };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  dialog.addEventListener('keydown', (e) => {
    const keys = {
      '+': () => setZoom(v.zoom * 1.25),
      '=': () => setZoom(v.zoom * 1.25),
      '-': () => setZoom(v.zoom / 1.25),
      0: () => setZoom(fitZoom()),
      1: () => setZoom(1),
      f: () => setZoom(fillZoom()),
      F: () => setZoom(fillZoom()),
      ArrowLeft: () => v.pics.length > 1 && v.show(v.index - 1),
      ArrowRight: () => v.pics.length > 1 && v.show(v.index + 1),
    };
    if (keys[e.key] && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      keys[e.key]();
    }
  });
  window.addEventListener('resize', () => {
    if (dialog.open && Math.abs(v.zoom - v.fit) < 0.001) setZoom(fitZoom());
  });
  document.body.append(dialog);
  return v;
}

/** the viewer on one of a message's pictures */
export function openViewer(pics, index = 0) {
  viewer = viewer || makeViewer();
  viewer.pics = pics;
  viewer.dialog.showModal();
  viewer.show(index);
}

/**
 * The pictures of a message: thumbnails (their place kept from their size, so the chat doesn't
 * jump), each opening the viewer. pics: [{ id, w, h }] (or prepared ones: { url, w, h })
 */
export function picturesOf(pics) {
  const box = el('div', { class: `pv-thumbs pv-thumbs-${Math.min(pics.length, 3)}` });
  pics.forEach((p, i) => {
    // (the chat shows the small version, when there is one)
    const shown = p.t || p.id;
    const img = el('img', {
      alt: `Picture ${i + 1} of ${pics.length}`,
      width: p.w || null,
      height: p.h || null,
      decoding: 'async',
      src: p.url || (shown && ready.get(shown)) || null,
    });
    const thumb = el('button', {
      type: 'button',
      class: 'pv-thumb',
      title: 'Show it larger',
      onclick: () => openViewer(pics, i),
    }, img);
    box.append(thumb);
    if (!img.getAttribute('src') && shown) {
      thumb.classList.add('pv-loading');
      pictureUrl(shown).then((url) => {
        thumb.classList.remove('pv-loading');
        if (url) img.src = url;
        else thumb.classList.add('pv-missing');
      });
    }
  });
  return box;
}
