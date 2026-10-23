/*
 * news-detail — corp news article template (`template: news-detail`); called with the
 * document by scripts/corp.js loadTemplate, after the main content is decorated.
 */

/**
 * Bold text in a news article keeps the body font when it sits in a sentence, but a
 * paragraph or list item that is bold as a whole (a label such as "References:") stays
 * Futura bold. Marks those standalone <strong> elements so news-detail.css can tell them
 * apart; CSS alone can't, as it ignores the text around an element.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  doc.querySelectorAll('main .default-content-wrapper :is(p, li) > strong').forEach((strong) => {
    if (strong.parentElement.textContent.trim() === strong.textContent.trim()) {
      strong.classList.add('standalone');
    }
  });
}
