/*
 * Containers (prototype, branch standardise-v3, 2026-11-19): content arranged by section styles
 * instead of by Columns blocks and heading-split tabs.
 * - `layout` sections (with halves / thirds / quarters / fifths / sixths / wide-first /
 *   wide-last, and `middle`): the section's content (text and blocks) side by side in columns;
 *   a `Column break` line ends a column. Also inside tab and accordion panels.
 * - `tab` sections: a run of them is one tabs block, one tab per section; the `continued`
 *   sections after a tab section belong to that tab (text, then columns, then text). A tab's
 *   label is the first heading of its first section.
 * (Accordion items: the existing `accordion-panel` sections, scripts/corp.js; a `continued`
 * section joins the item before it in the same way.)
 */
import { buildBlock } from './aem.js';

const BREAK = /^column break$/i;

/** the section styles that lay out a panel's own section (they stay on it, not on the host) */
export const LAYOUT_STYLES = ['layout', 'halves', 'thirds', 'quarters', 'fifths', 'sixths',
  'wide-first', 'wide-last', 'middle'];

/**
 * `layout` sections: their content in one column per run between `Column break` lines, each a
 * `layout-column` holding its text and blocks in authored order. After the blocks are decorated
 * (a wrapper moved into a column would no longer read as a block).
 * @param {Element} root <main>, or a panel holding inline sections
 */
export function decorateLayouts(root) {
  root.querySelectorAll('.section.layout:not([data-layout])').forEach((section) => {
    section.dataset.layout = '';
    const wrappers = [...section.children];
    const blockWrappers = new Set(wrappers.filter((w) => !w.classList.contains('default-content-wrapper')));
    const items = wrappers.flatMap((w) => (blockWrappers.has(w) ? [w] : [...w.children]));
    const columns = [[]];
    items.forEach((el) => {
      if (el.tagName === 'P' && BREAK.test(el.textContent.trim())) columns.push([]);
      else columns[columns.length - 1].push(el);
    });
    const built = columns.map((items2) => {
      const column = document.createElement('div');
      column.className = 'layout-column';
      let text = null;
      items2.forEach((el) => {
        if (blockWrappers.has(el)) {
          column.append(el);
          text = null;
          return;
        }
        if (!text) {
          text = document.createElement('div');
          text.className = 'default-content-wrapper';
          column.append(text);
        }
        text.append(el);
      });
      return column;
    });
    section.replaceChildren(...built);
  });
}

/**
 * Runs of `tab` sections → one tabs block each (the `continued` sections after a tab section
 * join that tab). Each tab's sections go to the tabs block as inline sections, keeping their
 * layout styles; the other section styles go to the first section, which holds the block.
 * Runs after decorateSections (the section styles are classes), before decorateBlocks.
 * @param {Element} main The container element
 */
export function buildTabRuns(main) {
  const runs = [];
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const run = runs[runs.length - 1];
    const part = run?.[run.length - 1];
    const follows = part && part[part.length - 1].nextElementSibling === section;
    if (section.classList.contains('tab')) {
      if (follows) run.push([section]);
      else runs.push([[section]]);
    } else if (section.classList.contains('continued') && follows) {
      part.push(section);
    }
  });
  runs.forEach((run) => {
    const rows = run.map((part) => {
      let title = null;
      const panel = document.createElement('div');
      part.forEach((section, i) => {
        // default content and (still undecorated) blocks, in authored order
        const nodes = [...section.children].flatMap((wrapper) => [...wrapper.children]);
        if (i === 0 && /^H[1-6]$/.test(nodes[0]?.tagName)) title = nodes.shift();
        const inline = document.createElement('div');
        inline.dataset.tabsSection = '';
        inline.classList.add(...LAYOUT_STYLES.filter((c) => section.classList.contains(c)));
        inline.append(...nodes);
        panel.append(inline);
      });
      const label = document.createElement('p');
      label.textContent = title ? title.textContent.trim() : '';
      return [{ elems: [label] }, { elems: [panel] }];
    });
    const [host, ...rest] = run.flat();
    rest.forEach((section) => {
      host.classList.add(...[...section.classList]
        .filter((c) => !['tab', 'continued', ...LAYOUT_STYLES].includes(c)));
      section.remove();
    });
    host.classList.remove('tab', ...LAYOUT_STYLES);
    const wrapper = document.createElement('div');
    wrapper.append(buildBlock('tabs', rows));
    host.replaceChildren(wrapper);
  });
}
