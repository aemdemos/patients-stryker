/*
 * Experience Workspace (DA canvas) preview of text markers. The canvas re-runs decoration,
 * then swaps every authored text node for a ProseMirror editor built from the SOURCE text,
 * so `:start-…:` / `:end:` markers show as typed text there (EDS turns them into marker spans
 * only on the server, for the delivered page). In quick-edit mode only: an editor whose text
 * holds markers is shown as a styled, non-editable copy (the same decoration as the page);
 * clicking the copy brings the editor back to edit the source, leaving it shows the copy
 * again. The editor itself is never changed. The published page never runs this.
 */
import decorateSpanMarkers from './span-markers.js';
import { isQuickEdit } from './dm-support.js';

const PREVIEW = 'tm-qe-preview';
const HIDDEN = 'tm-qe-hidden';
const MARKER = /(:(?:start-[a-z0-9-]+|end):)/i;
let observer;

/**
 * Typed markers in a copy of the source → the marker spans EDS makes from them.
 * @param {Element} root The copy
 */
function markersToSpans(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) {
    if (MARKER.test(walker.currentNode.textContent)) texts.push(walker.currentNode);
  }
  texts.forEach((text) => {
    const nodes = text.textContent.split(MARKER).filter(Boolean).map((part) => {
      if (!MARKER.test(part) || part.split(':').length !== 3) return part;
      const span = document.createElement('span');
      span.className = `icon icon-${part.slice(1, -1).toLowerCase()}`;
      return span;
    });
    text.replaceWith(...nodes);
  });
}

/** the element of an editor that takes the focus */
const editable = (editor) => (editor.isContentEditable
  ? editor : editor.querySelector('[contenteditable="true"]') || editor);

/**
 * A styled, non-editable copy of an editor; a click on it hands over to the editor.
 * @param {Element} editor A `.prosemirror-editor`
 * @returns {Element} The copy
 */
function previewOf(editor) {
  const copy = editor.cloneNode(true);
  copy.classList.remove('prosemirror-editor', HIDDEN);
  copy.classList.add(PREVIEW);
  [copy, ...copy.querySelectorAll('[contenteditable]')].forEach((el) => el.removeAttribute('contenteditable'));
  // no second element with the editor's ids (heading anchors)
  [copy, ...copy.querySelectorAll('[id]')].forEach((el) => el.removeAttribute('id'));
  copy.setAttribute('contenteditable', 'false');
  copy.dataset.source = editor.textContent;
  markersToSpans(copy);
  decorateSpanMarkers(copy);
  copy.addEventListener('mousedown', (event) => {
    event.preventDefault();
    editor.classList.remove(HIDDEN);
    copy.remove();
    editable(editor).focus();
  });
  return copy;
}

function sync() {
  document.querySelectorAll(`.${PREVIEW}`).forEach((copy) => {
    const editor = copy.nextElementSibling;
    const current = editor?.classList.contains('prosemirror-editor')
      && editor.textContent === copy.dataset.source && !editor.contains(document.activeElement);
    if (current) return;
    editor?.classList.remove(HIDDEN);
    copy.remove();
  });
  document.querySelectorAll('main .prosemirror-editor').forEach((editor) => {
    // being edited, or without markers: the editor shows as it is
    if (editor.contains(document.activeElement) || !MARKER.test(editor.textContent)) {
      editor.classList.remove(HIDDEN);
      return;
    }
    if (editor.previousElementSibling?.classList.contains(PREVIEW)) return;
    editor.before(previewOf(editor));
    editor.classList.add(HIDDEN);
  });
}

/**
 * Starts (once) the canvas preview of text markers. Observes <body> because the canvas
 * replaces <main> on every body sync.
 */
export default function previewTextMarkers() {
  if (observer || !isQuickEdit()) return;
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  };
  const own = (n) => n.classList?.contains(PREVIEW) || n.parentElement?.closest?.(`.${PREVIEW}`);
  observer = new MutationObserver((records) => {
    const ours = records.every((r) => (r.type === 'attributes' && r.target.classList?.contains('prosemirror-editor'))
      || (r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].every(own)));
    if (!ours) schedule();
  });
  observer.observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'],
  });
  document.addEventListener('focusout', schedule);
  schedule();
}
