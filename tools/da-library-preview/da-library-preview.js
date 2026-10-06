/*
 * DA / Experience Workspace block library preview.
 *
 * EW's "Insert block" dialog previews a block by loading its library document
 * (/.da/library/blocks/<block>) from this site in an iframe, with every variant
 * stacked on one page. This module makes that page read like the Sidekick
 * Library: the library-metadata tables (name / description / searchtags) and
 * the library-container-start/end markers are removed, and each variant is
 * framed with a small name label so variants are easy to tell apart.
 *
 * Only the preview is affected — EW inserts blocks from the DA source document.
 *
 * To remove: delete this folder and the `/.da/library/` hook in loadEager()
 * in scripts/scripts.js.
 */
import { loadCSS, toClassName } from '../../scripts/aem.js';

const MARKER_START = 'library-container-start';
const MARKER_END = 'library-container-end';

/**
 * Reads the `name` row of a library-metadata table.
 * @param {Element} metadata The library-metadata block
 * @returns {string} The variant name, or an empty string
 */
function readName(metadata) {
  const row = [...metadata.children]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'name');
  return row?.children[1]?.textContent.trim() || '';
}

/**
 * Groups the raw sections into variants. Sections between a container-start
 * and a container-end marker form one variant; any other section is its own.
 * @param {Element[]} sections The raw `main > div` sections
 * @returns {Element[][]} The sections of each variant
 */
function groupVariants(sections) {
  const variants = [];
  let inContainer = false;
  sections.forEach((section) => {
    const starts = !!section.querySelector(`:scope > .${MARKER_START}`);
    const ends = !!section.querySelector(`:scope > .${MARKER_END}`);
    if (starts || !inContainer) variants.push([]);
    variants[variants.length - 1].push(section);
    inContainer = (starts || inContainer) && !ends;
  });
  return variants;
}

/**
 * Cleans up and frames the variants of a library document. Runs on the raw
 * content, before decorateMain(), so the removed tables are never decorated.
 * @param {Element} main The main element
 */
export default function decorateLibraryPreview(main) {
  document.body.classList.add('library-preview');
  loadCSS(`${window.hlx.codeBasePath}/tools/da-library-preview/da-library-preview.css`);

  const usedIds = new Set();
  groupVariants([...main.querySelectorAll(':scope > div')]).forEach((variant) => {
    const metadata = variant.flatMap((s) => [...s.querySelectorAll(':scope > .library-metadata')]);
    const name = metadata.map(readName).find(Boolean) || '';
    metadata.forEach((table) => table.remove());
    variant.forEach((s) => s.querySelectorAll(`:scope > .${MARKER_START}, :scope > .${MARKER_END}`)
      .forEach((marker) => marker.remove()));

    // sections left empty are dropped, unless their style is the variant
    // itself (e.g. the Section Metadata divider / spacer examples)
    const sections = variant.filter((s) => {
      if (s.children.length || s.classList.length) return true;
      s.remove();
      return false;
    });
    if (!sections.length) return;

    sections.forEach((s) => {
      s.classList.add('library-variant');
      if (!s.children.length) s.classList.add('library-variant-empty');
    });
    const first = sections[0];
    first.classList.add('library-variant-start');
    sections[sections.length - 1].classList.add('library-variant-end');
    if (!name) return;

    first.dataset.libraryLabel = name;
    let id = toClassName(name);
    for (let i = 2; usedIds.has(id); i += 1) id = `${toClassName(name)}-${i}`;
    usedIds.add(id);
    first.id = id;
  });
}
