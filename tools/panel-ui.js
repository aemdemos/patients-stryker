/*
 * The choice buttons the Block options and Section style panels share: an element helper, a
 * group's radio buttons (a colour list in its Light · Accent · Dark · Gradients rows, swatch
 * dots) and the "— default" mark on a group's default.
 */
import { colourGroupOf, colourRows, isColourList } from './colour-groups.js';

/** an element with attributes (`on…` are listeners) and children */
export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v !== undefined) node.setAttribute(k, v === true ? '' : v);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

/** a choice may set several classes ("box-white shadow"): the class names it adds */
export const tokensOf = (value) => value.split(/\s+/).filter(Boolean);

/** the choice of a group the options hold: the one whose classes are all there (the fullest) */
export function selectedIn(group, options) {
  return group.options.map(([v]) => v)
    .filter((v) => v && tokensOf(v).every((t) => options.includes(t)))
    .sort((a, b) => tokensOf(b).length - tokensOf(a).length)[0] || '';
}

// a group's "" choice is its default, marked so; a none ("None", "Not set", "As written" …)
// says what it is itself
const NONE_LABEL = /^(none|not set|no\b|as |a normal)|default/i;
export const withDefault = (value, label) => (value || NONE_LABEL.test(label) ? label : `${label} — default`);

// a box or text colour choice (box-…, stat-…; a "" colour names its own with `swatch`)
const colourOf = (value, meta) => {
  const swatch = meta?.swatch || value;
  return /^(box|stat)-/.test(swatch) && colourGroupOf(swatch) ? swatch : '';
};

/** one choice of a group (a radio button); a colour shows its swatch dot */
export function choiceButton(value, label, meta, checked, onPick) {
  const swatch = colourOf(value, meta);
  const dot = swatch ? el('span', { class: 'tm-dot', 'aria-hidden': 'true' }) : null;
  return el('button', {
    type: 'button',
    role: 'radio',
    class: 'tm-choice',
    'aria-checked': String(checked),
    'data-swatch': dot ? swatch : undefined,
    title: [meta?.hint, value ? `Option “${value}”` : 'No option'].filter(Boolean).join('\n'),
    onclick: onPick,
  }, dot, withDefault(value, label));
}

/**
 * A group's radio buttons: one row, or a colour list in its Light · Accent · Dark · Gradients rows.
 * @param {string} label The group's title
 * @param {Array<[string, string, object]>} choices The choices shown
 * @param {(value: string, label: string, meta: object) => Element} button Builds a choice
 * @returns {Element} The buttons
 */
export function choiceLayout(label, choices, button) {
  const items = choices
    .map(([value, text, meta]) => [colourOf(value, meta), button(value, text, meta)]);
  const box = el('div', { class: 'tm-choice-rows', role: 'radiogroup', 'aria-label': label });
  const row = (buttons) => el('div', { class: 'tm-choices' }, ...buttons);
  if (isColourList(choices.map(([value, , meta]) => (value || meta?.swatch ? colourOf(value, meta) || '-' : '')))) {
    box.append(...colourRows(items, row, el));
  } else {
    box.append(row(items.map(([, b]) => b)));
  }
  return box;
}
