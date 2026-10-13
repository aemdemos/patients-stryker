/**
 * Search block: renders an in-page search field (same markup pattern as the
 * header search form), submitting `?q=` to the current page.
 * Authored structure: one optional cell holding the placeholder text
 * (defaults to "Search this site").
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const placeholder = block.textContent.trim() || 'Search this site';

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.action = window.location.pathname;
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'search-submit';
  submit.setAttribute('aria-label', 'Search');

  form.append(input, submit);
  block.replaceChildren(form);
}
