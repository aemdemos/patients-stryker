/*
 * The tool's one way to confirm (26 Nov 2026, the user's rule: confirmations look and behave
 * the same everywhere): a modal dialog over the page with what will happen, then the choices.
 * Used by the review page (group approval, withdrawing a message), the status page (a change to
 * many pages) and the invitations page (revoking). Esc picks the last choice (Cancel / Keep it).
 */

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat()
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
}

/**
 * The message of a confirmation in parts: the question, boxes of what it touches (a title and up
 * to six items, "and N more" after), a note below. parts: [{ title, items }] (empty ones left out).
 */
export function askMessage({ head, parts = [], foot = '' }) {
  const box = ({ title, items = [] }) => {
    const shown = items.slice(0, 6).map((i) => el('li', {}, i));
    if (items.length > 6) shown.push(el('li', {}, `and ${items.length - 6} more`));
    return el(
      'div',
      { class: 'ui-ask-part' },
      el('p', {}, el('b', {}, title)),
      shown.length ? el('ul', {}, ...shown) : null,
    );
  };
  return el(
    'div',
    { class: 'ui-ask' },
    el('p', { class: 'ui-ask-head' }, head),
    ...parts.filter((p) => p && p.title).map(box),
    foot ? el('p', { class: 'ui-ask-foot' }, foot) : null,
  );
}

/**
 * Ask, in a modal dialog: text (a string or a node, e.g. askMessage) and choices
 * [[label, value, 'primary' | 'danger' | '']] → a promise of the value picked.
 */
export default function ask(text, choices) {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'ui-dialog', 'aria-label': 'Confirm' });
    const done = (value) => {
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(value);
    };
    // (Esc: the last choice)
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      done(choices[choices.length - 1][1]);
    });
    dialog.append(
      typeof text === 'string' ? el('div', { class: 'ui-ask' }, el('p', { class: 'ui-ask-head' }, text)) : text,
      el('div', { class: 'ui-ask-actions' }, ...choices.map(([label, value, kind]) => el('button', {
        type: 'button',
        class: `ui-ask-btn${kind ? ` ui-ask-${kind}` : ''}`,
        onclick: () => done(value),
      }, label))),
    );
    document.body.append(dialog);
    dialog.showModal();
  });
}
