/*
 * product-detail — www.stryker.com product pages (`template: product-detail`); called with the
 * document by scripts/corp.js loadTemplate. Product pages use the standard blocks, section
 * styles and Text style (product-detail.css holds the rest; the review pages' icon rows are
 * decorated with the sections, scripts/corp.js productIconRows, so fragments get them too).
 *
 * In review (draft pages): the ProCare tile, a template part. Page metadata `procare: <unit>`
 * (e.g. acute-care) shows that business unit's shared ProCare tile fragment
 * (stryker/<unit>/en/procare-tile, tools/importer/import-procare-tile.js) after the page
 * content, before the small print, as on stryker.com: the fragment's first section is the
 * tile image (with a gold round arrow on it), the rest opens in a pop-up from it.
 */
import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../../blocks/fragment/fragment.js';

/**
 * The folder of the shared fragments: next to the review pages for a draft page
 * (/drafts/astha/pages/fragments/, /us/en/drafts/fragments/), else the site's /us/en/fragments/.
 */
function fragmentsFolder() {
  const { pathname } = window.location;
  if (/^\/(drafts|us\/en\/drafts)\//.test(pathname)) return `${pathname.replace(/\/[^/]*$/, '')}/fragments/`;
  return '/us/en/fragments/';
}

function button(className, label) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.setAttribute('aria-label', label);
  return el;
}

/**
 * The pop-up: the fragment's sections after the tile, a close button in its corner; it closes
 * with the button, Escape (the dialog's own) or a click on the dimmed page around it.
 */
function buildDialog(sections) {
  const dialog = document.createElement('dialog');
  dialog.className = 'procare-dialog';
  const body = document.createElement('div');
  body.className = 'procare-dialog-body';
  body.append(...sections);
  const heading = body.querySelector('h1, h2, h3');
  if (heading && heading.id) dialog.setAttribute('aria-labelledby', heading.id);
  const close = button('procare-dialog-close', 'Close');
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.append(close, body);
  return dialog;
}

async function procareTile(main) {
  const unit = toClassName(getMetadata('procare'));
  if (!unit) return;
  const fragment = await loadFragment(`${fragmentsFolder()}stryker/${unit}/en/procare-tile`);
  if (!fragment) return;
  const [first, ...rest] = [...fragment.children].filter((el) => el.classList.contains('section'));
  const media = first && (first.querySelector('picture') || first.querySelector('img'));
  if (!media) return;
  const img = media.tagName === 'IMG' ? media : media.querySelector('img');

  const section = document.createElement('div');
  section.className = 'section procare';
  section.dataset.sectionStatus = 'loaded';
  const tile = document.createElement('div');
  tile.className = 'procare-tile';
  const open = button('procare-open', (img && img.alt) || 'ProCare');
  const arrow = document.createElement('span');
  arrow.className = 'procare-arrow';
  open.append(media, arrow);
  tile.append(open);
  section.append(tile);
  if (rest.length) {
    const dialog = buildDialog(rest);
    open.setAttribute('aria-haspopup', 'dialog');
    open.addEventListener('click', () => dialog.showModal());
    section.append(dialog);
  }
  // after the page content, before the small print (stryker.com: the tiles above the
  // disclaimers)
  const disclaimer = main.querySelector(':scope > .section.disclaimer');
  main.insertBefore(section, disclaimer);
}

export default function decorate(doc) {
  if (!doc.body.classList.contains('std-draft') || !getMetadata('procare')) return;
  const main = doc.querySelector('main');
  // below the fold: once the page has loaded
  const start = () => procareTile(main);
  if (doc.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
