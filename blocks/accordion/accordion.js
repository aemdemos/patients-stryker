/*
 * Accordion Block
 * Collapsible content sections built with ul/li + button so that links inside
 * the panel body remain accessible (passes axe-core, unlike details/summary).
 * Panels start closed; a label authored in bold as a whole starts open.
 *
 * `with-nested-blocks` variant (corp): built from `accordion-panel` sections by
 * scripts/corp.js. Each panel body holds its section's content, including blocks,
 * and the label is the section's heading.
 */

import { decorateBlocks, decorateSections, loadSections } from '../../scripts/aem.js';

/**
 * Decorates and loads the blocks of a with-nested-blocks panel, in place. The page
 * has already decorated the panel's text (buttons, icons); only the section wrapper
 * and the nested blocks are missing, since the page's decorateBlocks pass only
 * visits top-level section blocks. Block decoration wraps the cell's content in a
 * <p>, which is dropped here.
 * @param {Element} body The panel body
 */
function decorateNestedBlocks(body) {
  const inline = [...body.querySelectorAll('[data-accordion-section]')];
  if (!inline.length) return;
  const wrapper = inline[0].parentElement;
  body.prepend(...inline);
  if (wrapper !== body && !wrapper.textContent.trim()) wrapper.remove();
  inline.forEach((section) => section.removeAttribute('data-accordion-section'));
  decorateSections(body);
  decorateBlocks(body);
  loadSections(body);
}

/**
 * A label set in bold as a whole (authoring convention: bold label = open) opens its panel
 * when the page loads.
 * @param {Element} label The label cell
 * @returns {boolean} Whether the panel starts open
 */
function startsOpen(label) {
  const all = label.textContent.replace(/\s+/g, '');
  const bold = [...label.querySelectorAll('strong, b')]
    .filter((el) => !el.parentElement.closest('strong, b'))
    .map((el) => el.textContent).join('').replace(/\s+/g, '');
  return !!all && bold === all;
}

export default function decorate(block) {
  const nested = block.classList.contains('with-nested-blocks');
  const list = document.createElement('ul');
  list.className = 'accordion-list';
  const bodies = [];

  [...block.children].forEach((row) => {
    const [label, content] = row.children;

    const item = document.createElement('li');
    item.className = 'accordion-item';
    const open = startsOpen(label);

    const button = document.createElement('button');
    button.className = 'accordion-item-label';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');

    // with-nested-blocks: keep the authored heading in the page outline and put
    // the toggle inside it (heading > button, the WAI-ARIA accordion pattern)
    const heading = nested && label.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      button.append(...heading.childNodes);
      heading.className = 'accordion-item-heading';
      heading.append(button);
    } else {
      button.append(...label.childNodes);
    }
    if (nested && !button.textContent.trim()) button.setAttribute('aria-label', 'Expand section');

    content.className = 'accordion-item-body';
    content.hidden = !open;
    if (open) {
      button.setAttribute('aria-expanded', 'true');
      item.classList.add('accordion-item-open');
    }

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      content.hidden = expanded;
      item.classList.toggle('accordion-item-open', !expanded);
    });

    item.append(heading || button, content);
    list.append(item);
    bodies.push(content);
  });

  block.replaceChildren(list);

  // nested blocks load in the background (also in a panel that starts open), so the
  // accordion (and its section) does not wait for them
  if (nested) bodies.forEach(decorateNestedBlocks);
}
