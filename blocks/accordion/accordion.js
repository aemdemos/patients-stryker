/*
 * Accordion Block
 * Collapsible content sections built with ul/li + button so that links inside
 * the panel body remain accessible (passes axe-core, unlike details/summary).
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'accordion-list';

  [...block.children].forEach((row) => {
    const [label, content] = row.children;

    const item = document.createElement('li');
    item.className = 'accordion-item';
    moveInstrumentation(row, item);

    const button = document.createElement('button');
    button.className = 'accordion-item-label';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    moveInstrumentation(label, button);
    button.append(...label.childNodes);

    content.className = 'accordion-item-body';
    content.hidden = true;

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', open ? 'false' : 'true');
      content.hidden = open;
      item.classList.toggle('accordion-item-open', !open);
    });

    item.append(button, content);
    list.append(item);
  });

  block.replaceChildren(list);
}
