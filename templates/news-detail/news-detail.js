/*
 * news-detail — corp news article template (`template: news-detail`); called with the
 * document by scripts/corp.js loadTemplate, after the main content is decorated.
 */

/**
 * The siblings of a node up to the next line break (<br>) or the end of its parent.
 * @param {Node} node The starting node
 * @param {'previousSibling'|'nextSibling'} direction Where to walk
 * @returns {string} The text on that side of the node, on the same line
 */
function lineText(node, direction) {
  let text = '';
  let sibling = node[direction];
  while (sibling && sibling.nodeName !== 'BR') {
    text += sibling.textContent;
    sibling = sibling[direction];
  }
  return text.trim();
}

/**
 * Bold text in a news article keeps the body font when it sits in a sentence, but bold
 * text on a line of its own stays Futura bold: a paragraph or list item that is bold as a
 * whole ("References:"), or a label on its own line before a line break ("About AVS",
 * "Media contact"). Marks those standalone <strong> elements so news-detail.css can tell
 * them apart; CSS alone can't, as it ignores the text around an element.
 * @param {Element} root The content to mark
 */
function markStandalone(root) {
  root.querySelectorAll('.default-content-wrapper :is(p, li) > strong').forEach((strong) => {
    if (!lineText(strong, 'previousSibling') && !lineText(strong, 'nextSibling')) {
      strong.classList.add('standalone');
    }
  });
}

/**
 * Marks the article's standalone bold, including the content of fragments (an article body
 * kept as its own experience fragment document), which loads after this runs.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;
  markStandalone(main);
  new MutationObserver((records) => records.forEach((record) => {
    record.addedNodes.forEach((node) => { if (node.nodeType === 1) markStandalone(node); });
  })).observe(main, { childList: true, subtree: true });
}
