/*
 * news-cards — the www.stryker.com c-latestnews 4-up on the home page: a row of
 * story cards (thumbnail, Egyptienne h3 title, teaser, "Read More" action link)
 * closed by the 1px grey rule (.border-bottom-gold). Reconstructive: one authored
 * row per card.
 *
 * Authoring model:
 *   | picture | <h3>Title</h3> <p>teaser</p> <p><a href>Read More</a></p> |
 *   Either cell order; the image cell is the one carrying only a picture. The link
 *   paragraph is a plain `<p><a>` (no strong/em), so decorateButtons leaves it a
 *   flat action link.
 *
 * Decode: the authored row <div> becomes the card (`.news-card`), its two cells the
 * image / body columns — classes only; every authored node stays where it is
 * (EW1–EW3), CTAs stay in their <p>.
 *
 * D2 — query-index top-up (document-first, stardust/dynamic-features.md § Listings
 * contract): the authored cards stay the source of truth and render untouched. After
 * decoration the block reads /query-index.json for `news-detail` pages of this
 * page's `division` (meta[name=division]; none on the home page = every division)
 * and, when one is NEWER than an authored card (by `published`, the authored cards'
 * dates read from their own index rows), inserts it at the front and hides the
 * oldest authored card(s) so the visible count stays the authored one — the live
 * c-latestnews always shows the n newest. Index rows older than every authored card
 * are not rendered (the 4-up has no paging); authored cards whose page is not
 * indexed keep their slot. Index-sourced cards are the only created elements; a
 * failed fetch leaves the authored state as is.
 */

import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

const READ_MORE_TEXT = 'Read More';
const INDEX_URL = '/query-index.json';
const INDEX_LIMIT = 500;
const ITEM_TEMPLATE = 'news-detail';

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell carries an image and no text
 */
function isImageCell(cell) {
  return !!cell.querySelector('picture, img') && !cell.textContent.trim();
}

/* ---------- D2: query-index top-up ---------- */

/**
 * @param {string} href a link href or index path
 * @returns {string} the comparable path (root-relative, no extension, lowercase)
 */
function pathKey(href) {
  try {
    const { pathname } = new URL(href, window.location.href);
    return pathname.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
  } catch (e) {
    return '';
  }
}

/**
 * @param {string} division this page's division (meta[name=division]); empty = all
 * @returns {Promise<object[]>} the division's news-detail rows, newest first
 */
async function fetchIndex(division) {
  try {
    const resp = await fetch(`${INDEX_URL}?limit=${INDEX_LIMIT}`);
    if (!resp.ok) return [];
    const { data = [] } = await resp.json();
    return data
      .filter((row) => row.template === ITEM_TEMPLATE && (!division || row.division === division))
      .sort((a, b) => (b.published || '').localeCompare(a.published || ''));
  } catch (e) {
    return [];
  }
}

/**
 * @param {object} row an index row
 * @returns {Element} a card built from the row (index-sourced: created nodes)
 */
function buildIndexCard(row) {
  const card = document.createElement('div');
  card.className = 'news-card';
  card.dataset.source = 'index';
  const image = document.createElement('div');
  image.className = 'news-card-image';
  if (row.image) {
    const p = document.createElement('p');
    p.append(createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]));
    image.append(p);
  }
  const body = document.createElement('div');
  body.className = 'news-card-body';
  const h3 = document.createElement('h3');
  h3.textContent = row.title || row.path;
  body.append(h3);
  if (row.description) {
    const teaser = document.createElement('p');
    teaser.textContent = row.description;
    body.append(teaser);
  }
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = row.path;
  a.textContent = READ_MORE_TEXT;
  p.append(a);
  body.append(p);
  card.append(image, body);
  return card;
}

/**
 * Surfaces index rows newer than the authored cards, keeping the visible count.
 * @param {Element} block the decorated block
 * @param {Element[]} cards the authored cards
 */
async function topUp(block, cards) {
  const rows = await fetchIndex(getMetadata('division'));
  if (!rows.length) return;
  const byPath = new Map(rows.map((row) => [pathKey(row.path), row]));
  const dated = cards.map((card) => {
    const link = card.querySelector('a[href]');
    const row = link ? byPath.get(pathKey(link.href)) : undefined;
    return { card, published: row ? row.published || '' : '' };
  });
  const authoredKeys = new Set(dated.map(({ card }) => {
    const link = card.querySelector('a[href]');
    return link ? pathKey(link.href) : '';
  }));
  // the oldest authored card whose date the index knows bounds what counts as "newer"
  const known = dated.filter((d) => d.published)
    .sort((a, b) => a.published.localeCompare(b.published));
  if (!known.length) return;
  // an unauthored row displaces an authored card only when it is newer than EVERY dated
  // authored card (the live 4-up shows the newest stories; an index row whose `published`
  // merely beats the oldest card — e.g. a wave-2 story carrying a migration-month date —
  // must not hide a curated card, 2026-10-05 home regression). Undated authored cards are
  // never displaced. Candidates are taken newest-first.
  const newest = known[known.length - 1].published;
  const candidates = rows
    .filter((row) => !authoredKeys.has(pathKey(row.path)) && (row.published || '') > newest)
    .sort((a, b) => (b.published || '').localeCompare(a.published || ''));
  const fresh = [];
  known.forEach(({ card }, i) => {
    const row = candidates[i];
    if (row) {
      fresh.push(row);
      card.hidden = true;
    }
  });
  fresh.reverse().forEach((row) => block.prepend(buildIndexCard(row)));
}

/**
 * @param {Element} block the news-cards block
 */
export default function decorate(block) {
  const cards = [...block.children];
  block.classList.add(`news-cards-${cards.length}-up`);
  cards.forEach((row) => {
    row.classList.add('news-card');
    [...row.children].forEach((cell) => {
      cell.classList.add(isImageCell(cell) ? 'news-card-image' : 'news-card-body');
    });
  });
  // document-first: the authored cards are on screen; the index tops them up asynchronously
  topUp(block, cards);
}
