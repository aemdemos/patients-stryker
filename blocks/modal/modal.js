/*
 * Modal: a fragment document shown in a dialog (as the AEM Block Collection modal). Links to
 * a `/modals/` document open it (scripts/corp.js autolinkModals), e.g. the stryker.com ProCare
 * tile → /us/en/fragments/modals/procare/<name>. The dialog closes with its close button,
 * Escape or a click outside it.
 */
import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

/**
 * Builds a modal block holding the given content.
 * @param {Node[]} contentNodes the dialog content
 * @returns {Promise<{block: Element, showModal: Function}>}
 */
export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.append(...contentNodes);
  dialog.append(content);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'modal-close';
  close.setAttribute('aria-label', 'Close');
  close.addEventListener('click', () => dialog.close());
  dialog.prepend(close);

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // a click on the backdrop (outside the dialog box) closes it
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const outside = e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom;
    if (outside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.replaceChildren(dialog);
  return {
    block,
    showModal: () => {
      dialog.showModal();
      content.scrollTop = 0;
      document.body.classList.add('modal-open');
    },
  };
}

/**
 * Opens a fragment document in a modal.
 * @param {string} fragmentUrl the document URL or path
 */
export async function openModal(fragmentUrl) {
  const path = new URL(fragmentUrl, window.location.href).pathname;
  const fragment = await loadFragment(path);
  if (!fragment) return;
  const { showModal } = await createModal([...fragment.childNodes]);
  showModal();
}

/** The block itself has nothing to decorate (createModal fills it). */
export default function decorate() {}
