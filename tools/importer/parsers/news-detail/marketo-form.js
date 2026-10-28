/* eslint-disable */
/* global WebImporter */

/**
 * Parser: www.stryker.com `.c-marketo-form` → `Marketo Form` block (news-detail).
 *
 * Block table: one row per config pair, the key then the value as plain text
 * (blocks/marketo-form/marketo-form.js reads them with readBlockConfig):
 *   | Marketo Form |                          |
 *   | Base URL     | //lp.stryker.com         |
 *   | Munchkin ID  | 338-WAP-571              |
 *   | Form ID      | 2736                     |
 *
 * The three values differ per form (lp.stryker.com / 424-GXO-933.mktoweb.com /
 * 029-IBF-960.mktoweb.com), so they are read from the form's own data-marketo-*
 * attributes, never defaulted. The source has no captcha, so no captcha rows are emitted.
 * The values are text, not links: the shared cleanup drops any link or image whose URL
 * mentions marketo / munchkin.
 * The after-submit behaviour (thank-you text, redirect) is not carried by the block.
 */
export default function parse(element, { document }) {
  const form = element.querySelector('form[data-marketo-form-id]');
  const read = (name) => (form && form.getAttribute(name) || '').trim();
  const rows = [
    ['Base URL', read('data-marketo-base-url')],
    ['Munchkin ID', read('data-marketo-munchkin-id')],
    ['Form ID', read('data-marketo-form-id')],
  ];
  if (rows.some(([, value]) => !value)) {
    element.remove();
    return;
  }

  const cells = rows.map(([key, value]) => {
    const k = document.createElement('div');
    k.textContent = key;
    const v = document.createElement('div');
    v.textContent = value;
    return [k, v];
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'marketo-form', cells }));
}
