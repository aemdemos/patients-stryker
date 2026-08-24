/**
 * DOM Helper Functions - Utilities for creating and manipulating DOM elements
 *
 * Example Usage:
 * div({ class: 'card' },
 *   a({ href: '/page' },
 *     h3('Title'),
 *     p('Description')
 *   )
 * )
 */

/**
 * Helper for creating DOM elements with attributes and children
 * @param {string} tag HTML tag of the desired element
 * @param {...(Object|Element|string)} items First item can be attributes object,
 *  rest are child elements or text nodes
 * @returns {Element} The constructed DOM element
 */
export function domEl(tag, ...allItems) {
  const element = document.createElement(tag);

  if (!allItems || allItems.length === 0) return element;

  let items = allItems;

  // Check if first item is attributes object
  if (
    !(items[0] instanceof Element || items[0] instanceof HTMLElement)
    && typeof items[0] === 'object'
  ) {
    const [attributes, ...rest] = items;
    items = rest;

    Object.entries(attributes).forEach(([key, value]) => {
      if (!key.startsWith('on')) {
        element.setAttribute(
          key,
          Array.isArray(value) ? value.join(' ') : value,
        );
      } else {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      }
    });
  }

  items.forEach((currentItem) => {
    let item = currentItem;
    if (item === null || item === undefined) return;
    item = item instanceof Element || item instanceof HTMLElement
      ? item
      : document.createTextNode(item);
    element.appendChild(item);
  });

  return element;
}

// Shorthand helpers for common elements
export const div = (attrs, ...children) => domEl('div', attrs, ...children);
export const a = (attrs, ...children) => domEl('a', attrs, ...children);
export const h1 = (attrs, ...children) => domEl('h1', attrs, ...children);
export const h2 = (attrs, ...children) => domEl('h2', attrs, ...children);
export const h3 = (attrs, ...children) => domEl('h3', attrs, ...children);
export const h4 = (attrs, ...children) => domEl('h4', attrs, ...children);
export const h5 = (attrs, ...children) => domEl('h5', attrs, ...children);
export const h6 = (attrs, ...children) => domEl('h6', attrs, ...children);
export const p = (attrs, ...children) => domEl('p', attrs, ...children);
export const span = (attrs, ...children) => domEl('span', attrs, ...children);
export const ul = (attrs, ...children) => domEl('ul', attrs, ...children);
export const li = (attrs, ...children) => domEl('li', attrs, ...children);
export const button = (attrs, ...children) => domEl('button', attrs, ...children);
export const img = (attrs) => domEl('img', attrs);
export const picture = (attrs, ...children) => domEl('picture', attrs, ...children);
export const source = (attrs) => domEl('source', attrs);

/**
 * Removes empty DOM elements
 * @param {Element} block The container element
 */
export const removeEmptyTags = (block) => {
  block.querySelectorAll('*').forEach((x) => {
    const tagName = `</${x.tagName}>`;
    if (x.outerHTML.slice(tagName.length * -1).toUpperCase() === tagName
      && x.innerHTML.trim().length === 0) {
      x.remove();
    }
  });
};

/**
 * Waits for a DOM element to appear
 * @param {string} selector The CSS selector
 * @param {number} timeout Maximum wait time in milliseconds
 * @returns {Promise<Element>} Resolves with the element when found
 */
export const waitForElement = (selector, timeout = 3000) => new Promise((resolve, reject) => {
  const interval = 100;
  let elapsedTime = 0;

  const check = () => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
    } else {
      elapsedTime += interval;
      if (elapsedTime >= timeout) {
        reject(new Error(`Element not found: ${selector}`));
      } else {
        setTimeout(check, interval);
      }
    }
  };

  check();
});
