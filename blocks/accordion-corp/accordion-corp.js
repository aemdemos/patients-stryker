/*
 * Accordion Block
 * Collapsible content sections built with ul/li + button so that links inside
 * the panel body remain accessible (passes axe-core, unlike details/summary).
 */

export default function decorate(block) {
  // `open` variant: every panel starts expanded
  const openAtRest = block.classList.contains('open');
  const list = document.createElement('ul');
  list.className = 'accordion-list';

  [...block.children].forEach((row) => {
    const [label, content] = row.children;

    const item = document.createElement('li');
    item.className = 'accordion-item';

    const button = document.createElement('button');
    button.className = 'accordion-item-label';
    button.type = 'button';
    button.setAttribute('aria-expanded', openAtRest ? 'true' : 'false');
    button.append(...label.childNodes);
    if (!button.textContent.trim()) {
      // empty authored label: name the toggle after the nearest heading above the block
      let heading = null;
      for (let el = block.previousElementSibling; el && !heading; el = el.previousElementSibling) {
        heading = el.matches('h2, h3, h4') ? el : el.querySelector('h2, h3, h4');
      }
      button.setAttribute('aria-label', heading ? `${heading.textContent.trim()} — expand` : 'Expand section');
    }

    content.className = 'accordion-item-body';
    content.hidden = !openAtRest;
    if (openAtRest) item.classList.add('accordion-item-open');

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
