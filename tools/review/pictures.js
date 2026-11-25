/*
 * Pictures in the chats (25 Nov 2026): a screenshot of what a page shows after a click, on the
 * migrated or the source page. Getting one in (a Picture button, pasting into the message box,
 * dropping onto it), making a big one smaller in the browser, uploading it in parts (a request
 * may not be over 1 MB; backend action `images`), showing the pictures of a message, and the
 * viewer: the picture large in a dialog, zoom in / out (buttons, Ctrl+wheel, + − 0 1 keys),
 * dragged around when it is larger than the window, the message's other pictures with ‹ ›.
 * DOM only (no innerHTML).
 */
import { call } from './store.js';

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

/**
 * A picture ready to send: { blob, w, h, url (to show it before it is sent) }. Small ones as they
 * are; big ones drawn smaller and saved as WebP (JPEG where the browser can't write WebP)
 */
export async function prepare(file) {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  let blob = file;
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
    blob = await toBlob(canvas, 'image/webp', 0.9);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.9);
  }
  bitmap.close?.();
  return {
    blob, w, h, url: URL.createObjectURL(blob),
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

// the pictures' short-lived links: asked for together, kept until shortly before they expire
const links = new Map();
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

/** a link already known (to show a picture at once on a redraw) */
const knownLink = (id) => {
  const l = links.get(id);
  return l?.until > Date.now() ? l.url : null;
};

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
    const src = p.url || knownLink(p.id);
    const set = (url) => {
      if (!url) return;
      img.onload = () => {
        setZoom(fitZoom());
        img.style.visibility = '';
      };
      img.src = url;
      open.href = url;
    };
    if (src) set(src);
    else linksOf([p.id]).then((m) => set(m.get(p.id)));
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
    btn('Fit', 'Fit the window (0)', () => setZoom(fitZoom())),
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
    const img = el('img', {
      alt: `Picture ${i + 1} of ${pics.length}`,
      width: p.w || null,
      height: p.h || null,
      loading: 'lazy',
      decoding: 'async',
      'data-picture': p.id || null,
      src: p.url || (p.id && knownLink(p.id)) || null,
    });
    box.append(el('button', {
      type: 'button',
      class: 'pv-thumb',
      title: 'Show it larger',
      onclick: () => openViewer(pics, i),
    }, img));
  });
  // (the links of pictures not shown yet)
  const missing = pics.filter((p) => p.id && !p.url && !knownLink(p.id));
  if (missing.length) {
    linksOf(missing.map((p) => p.id)).then((urls) => {
      box.querySelectorAll('img[data-picture]').forEach((img) => {
        const url = urls.get(img.dataset.picture);
        if (url) img.src = url;
        else if (!img.src) img.closest('.pv-thumb').classList.add('pv-missing');
      });
    });
  }
  return box;
}
