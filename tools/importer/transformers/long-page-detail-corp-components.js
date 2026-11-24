/* global WebImporter */
/**
 * long-page-detail-corp: stryker.com components that map to existing blocks and section
 * styles (step 1c, #487). Run by long-page-detail-corp-sections.js after the column rows
 * are built and before the article builder; each component is replaced by a block in a
 * section of its own (`data-keep="section"`) or by its content in a section with a style
 * (`data-keep="nodes"`). The content of a component is built as a Columns cell is
 * (`cellNodes`), so it imports as everywhere else on these pages.
 *
 *   - tabs (.c-tabs): a `tabbed` section; each tab label a heading one level below the
 *     deepest heading of the tab content, the tab content (text, blocks) after it
 *   - accordions (.panel-group): `Accordion`, one row per panel (label, body); panels that
 *     hold a table: an `accordion-panel` section per panel (heading = label)
 *     (an accordion in a column of a row with other content: the row is unwrapped, the
 *     accordion then the other columns' content, as a Columns cell can't hold a block)
 *   - navigation bars (.c-navigation-bar): `Sticky Nav`, one row per link (label, link to
 *     the id of the section title it scrolls to on the source)
 *   - full-bleed panels (.c-full-bleed-panel): their content in a `<colour>, full-bleed`
 *     section
 *   - a rich-text box (dimensional box, coloured box) the width of the page: `Panel`, the
 *     variant from its look (white box: `left`; gold: `gold`; light grey: `gray`)
 *   - group lists (.c-grouplist): their title as a Heading 2, the groups as
 *     `Columns (columns-50-50, link-groups)` (Heading 3 + list of links per cell)
 *   - page heroes (.c-page-hero): their content (H1, subhead, text, image) as text
 *   - engagement CTAs (.c-engagementcta): their description, and each button as a button
 *     link (label: its text or its icon's alt text; the icon is not imported)
 *   - interactive images (.interactivemedia): the image (its hotspots are not imported)
 *   - number counters (.numbercounter): the figure in bold and its label, as text
 *   - event calendars (.c-event): dropped (the events load in the browser on stryker.com)
 */

import { STD_DRAFT_IMPORT } from './corp-text-markers.js';

const COMPONENT = '[class^="c-"], [class*=" c-"]';
// the components a Columns cell takes (rich text, images, videos, headlines, CTAs, button
// sets, tables) and blocks already built
const UNIT = `[data-keep], ${COMPONENT}, .buttonset, table`;
const PARSED = '.c-resourcesanddownload, .c-customizeable, .c-autocarousel';

/** The section colour style of a stryker.com background class (`bg-…`), or ''. */
function colourStyle(el) {
  const m = (el.className || '').match(/\bbg-([a-z-]+)\b/);
  if (!m) return '';
  const bg = m[1];
  if (/^(gold|golden-gradient|yellow)$/.test(bg)) return 'gold';
  // the grey-to-light-grey and purple panels (OR staff band titles, Mako refreshers bands,
  // ispies event boxes): template colour styles
  if (bg === 'gray-gradient') return 'gray-gradient';
  if (bg === 'purple') return 'purple';
  if (bg === 'dark-purple-gradient') return 'purple-gradient';
  if (/^(light-gray|gray|grey|light-gray-gradient)$/.test(bg)) return 'light-gray';
  if (/^(blue|navy)$/.test(bg)) return 'blue';
  if (/^(dark|dark-gray|black)$/.test(bg) || /^dark-.*-gradient$/.test(bg)) return 'dark';
  return '';
}

/**
 * The content nodes of a source container, in source order: blocks already built
 * (`data-keep` tables) as they are, every other outermost component as a Columns cell
 * holds it.
 */
function contentUnits(container) {
  const units = [...container.querySelectorAll(UNIT)].filter((el) => {
    const outer = el.parentElement.closest(UNIT);
    return !outer || outer === container || !container.contains(outer);
  });
  // a component holding no other component (e.g. a rich-text box) is its own content
  if (!units.length && container.matches(COMPONENT)) return [container];
  return units;
}

/**
 * A block built with a section style (a Columns row: `p-1-5`, `serif`) that moves into
 * another section (a tab, a band) loses the style: the copy it set keeps its size and font
 * as bracket tags (`[[text-1-5,serif]…]`; neurosurgical events card titles).
 */
function inlineSectionStyle(unit, doc, h) {
  const parts = (unit.getAttribute('data-section-style') || '').split(',').map((s) => s.trim());
  const size = parts.find((s) => /^p-\d/.test(s));
  const serif = parts.includes('serif');
  if (!size && !serif) return;
  [...unit.querySelectorAll('td > p, td > ul, td > ol, div > p, div > ul, div > ol')]
    .filter((n) => typeof n.copyStyle === 'string')
    .forEach((n) => {
      const own = n.copyStyle.split(',').map((s) => s.trim());
      const tags = [size && own.includes(size) ? `text-${size.slice(2)}` : '', serif && own.includes('serif') ? 'serif' : '']
        .filter(Boolean);
      if (!tags.length) return;
      h.tagCopy(n, tags.join(','), doc);
    });
  unit.removeAttribute('data-section-style');
}

function unitNodes(unit, doc, h) {
  // components a block parser converts after this step (downloads, related cards, hero
  // carousels): moved as they are, the parser finds them in their new place
  if (unit.matches(PARSED)) return [unit];
  if (unit.hasAttribute('data-keep')) {
    const nodes = unit.getAttribute('data-keep') === 'nodes' ? [...unit.children] : [unit];
    if (unit.getAttribute('data-keep') === 'section') inlineSectionStyle(unit, doc, h);
    unit.removeAttribute('data-keep');
    return nodes;
  }
  const box = doc.createElement('div');
  box.append(unit.cloneNode(true));
  return h.cellNodes(box, doc);
}

function contentNodes(container, doc, h) {
  return contentUnits(container).flatMap((unit) => unitNodes(unit, doc, h));
}

function keepNodes(doc, nodes, style) {
  const box = doc.createElement('div');
  box.setAttribute('data-keep', 'nodes');
  if (style) box.setAttribute('data-section-style', style);
  box.append(...nodes);
  return box;
}

function keepBlock(block, from) {
  block.setAttribute('data-keep', 'section');
  // the source row spacing after the component it replaces (markRowEnds; ispies: the empty row
  // after each accordion)
  const end = from && from.getAttribute('data-row-end');
  if (end) block.setAttribute('data-row-end', end);
  return block;
}

const headingLevel = (node) => (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : 0);

function tabs(main, doc, h) {
  main.querySelectorAll('.c-tabs').forEach((component) => {
    const labels = [...component.querySelectorAll('.tabs-nav a.tab-link')].map((a) => h.text(a));
    const panels = [...component.querySelectorAll('.tabs-content > .tab-content')];
    if (!panels.length) return;
    const contents = panels.map((panel) => contentNodes(panel, doc, h));
    // the tab labels are the deepest headings of the section (the `tabbed` rule)
    const deepest = Math.max(0, ...contents.flat().map(headingLevel));
    const level = Math.min(6, Math.max(2, deepest + 1));
    const nodes = [];
    const panelSections = [];
    contents.forEach((content, i) => {
      if (!content.length) return;
      const heading = doc.createElement(`h${level}`);
      heading.textContent = labels[i] || `Tab ${i + 1}`;
      nodes.push(heading, ...content);
      panelSections.push([heading, ...content]);
    });
    if (!nodes.length) return;
    // in review (staging build only, docs/standardisation/tabs.md): each tab is a `tab-panel`
    // section (its heading the tab label), as accordion panels are; scripts/corp.js builds the tabs
    if (STD_DRAFT_IMPORT) {
      const style = ['tab-panel', component.hasAttribute('data-image-aside') ? 'image-aside' : '']
        .filter(Boolean).join(', ');
      (component.closest('.tabs') || component)
        .replaceWith(...panelSections.map((panel) => keepNodes(doc, panel, style)));
      return;
    }
    const style = component.hasAttribute('data-image-aside') ? 'tabbed, image-aside' : 'tabbed';
    (component.closest('.tabs') || component).replaceWith(keepNodes(doc, nodes, style));
  });
}

/**
 * An accordion in a column of a row with other content (Mako surgeon campaign: the clinical
 * studies beside an image) can't be a block in a Columns cell: the row is unwrapped (its
 * columns' content one after the other: the image, then the accordion), so the accordion
 * stays an Accordion, closed as on the source; in a tab the image goes beside it again
 * (`image-aside`).
 */
function accordionsInColumns(main, doc, h) {
  main.querySelectorAll('.panel-group').forEach((group) => {
    const col = group.closest('[class*="col-sm-"], [class*="col-md-"]');
    const row = col && col.parentElement;
    // filled as the column rows count it (text or media), so the row would become Columns
    const filled = (c) => h.text(c) || c.querySelector('img, iframe, [data-asset-path], form, table');
    if (!row || [...row.children].filter((c) => c !== col && filled(c)).length === 0) return;
    const colctrl = row.closest('.colctrl');
    if (!colctrl) return;
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
    // an image in the third before the accordion's two thirds (Mako surgeon campaign tabs):
    // the tab section gets `image-aside` (tabs, below)
    const cols = [...row.children];
    if (cols.length === 2 && cols[1] === col && /\bcol-sm-4\b/.test(cols[0].className)
      && cols[0].querySelector('img') && !h.text(cols[0])) {
      const tabSet = colctrl.closest('.c-tabs');
      if (tabSet) tabSet.setAttribute('data-image-aside', '');
    }
    wrapper.replaceWith(...cols.flatMap((c) => [...c.children]));
  });
}

/** The content of a block table's cells (its rows after the name row), in order. */
function blockCells(table) {
  return [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')].slice(1)
    .flatMap((tr) => [...tr.children].flatMap((td) => [...td.childNodes]));
}

/**
 * The copy of an Accordion panel keeps its source size and font as bracket tags (a panel has
 * no section style; ispies: 17.5px lists `[[text-1-25]…]`).
 */
function tagPanelCopy(nodes, doc, h) {
  nodes.filter((n) => n.nodeType === 1 && typeof n.copyStyle === 'string' && n.copyStyle).forEach((n) => {
    const own = n.copyStyle.split(',').map((s) => s.trim());
    const size = own.find((s) => s.startsWith('p-') && /\d/.test(s[2]));
    const tags = [size ? `text-${size.slice(2)}` : '', own.includes('serif') ? 'serif' : ''].filter(Boolean);
    if (tags.length) h.tagCopy(n, tags.join(','), doc);
  });
}

/**
 * The Accordion options of a source accordion: `open` when every panel starts open
 * (.panel-collapse.in, ispies), `gray-list` when each panel's list sits in a light-grey box
 * (a .has-background.bg-light-gray rich text holding the list).
 */
function accordionOptions(panels) {
  const open = panels.every((p) => p.querySelector('.panel-collapse.in, .panel-collapse.show'));
  const gray = panels.every((p) => [...p.querySelectorAll('.has-background.bg-light-gray')]
    .some((b) => b.querySelector('ul, ol')));
  return [open ? 'open' : '', gray ? 'gray-list' : ''].filter(Boolean).join(', ');
}

function accordions(main, doc, h) {
  main.querySelectorAll('.panel-group').forEach((group) => {
    const panels = [...group.querySelectorAll(':scope > .panel')].filter((p) => p.querySelector('.panel-title'));
    if (!panels.length) return;
    const options = accordionOptions(panels);
    const name = options ? `Accordion (${options})` : 'Accordion';
    const items = panels.map((panel) => ({
      label: h.text(panel.querySelector('.panel-title')),
      body: contentNodes(panel.querySelector('.panel-body') || panel, doc, h),
    }));
    items.forEach(({ body }) => tagPanelCopy(body, doc, h));
    const target = group.closest('.c-accordion') || group;
    // in review (staging build only, docs/standardisation/accordion.md): the accordion's title
    // (heading-above, 16 accordions) is a Heading 3 right before it, in the same section
    const subheading = STD_DRAFT_IMPORT && [...target.querySelectorAll('.component-subheading')]
      .find((el) => !el.closest('.panel') && h.text(el));
    // (Futura bold on stryker.com: a bold Heading 3)
    const title = subheading ? doc.createElement('h3') : null;
    if (title) {
      const bold = doc.createElement('strong');
      bold.textContent = h.text(subheading);
      title.append(bold);
    }
    const keepWithTitle = (block) => {
      if (!title) return [block];
      title.setAttribute('data-keep', 'section');
      block.setAttribute('data-keep', 'join');
      return [title, block];
    };
    const nested = items.some(({ body }) => body.some((n) => n.nodeType === 1 && (n.matches('table') || n.querySelector('table'))));
    // in a tab, panels can't be sections: the blocks in a panel (Columns rows, e.g. the Mako
    // surgeon campaign clinical studies: image | text) give their cells' content, so the
    // panels stay an Accordion (closed, as on the source)
    if (nested && target.closest('.tab-content')) {
      items.forEach((item) => {
        item.body = item.body.flatMap((n) => (n.nodeType === 1 && n.matches('table') ? blockCells(n) : [n]));
      });
      if (items.some(({ body }) => body.some((n) => n.nodeType === 1 && n.matches('table')))) return;
      const rows = items.map(({ label, body }) => {
        const p = doc.createElement('p');
        p.textContent = label;
        return [p, body];
      });
      const block = WebImporter.Blocks.createBlock(doc, { name, cells: rows });
      target.replaceWith(...keepWithTitle(keepBlock(block, target)));
      return;
    }
    if (nested) {
      if (title) target.before(keepNodes(doc, [title]));
      // in review (staging build only, docs/standardisation/accordion.md): panels that all start
      // open keep it, `accordion-open` on the panel sections (scripts/corp.js)
      const style = STD_DRAFT_IMPORT && options.split(', ').includes('open')
        ? 'accordion-panel, accordion-open' : 'accordion-panel';
      items.forEach(({ label, body }) => {
        const heading = doc.createElement('h4');
        heading.textContent = label;
        target.before(keepNodes(doc, [heading, ...body], style));
      });
      target.remove();
      return;
    }
    const rows = items.map(({ label, body }) => {
      const p = doc.createElement('p');
      p.textContent = label;
      return [p, body];
    });
    const block = WebImporter.Blocks.createBlock(doc, { name, cells: rows });
    target.replaceWith(...keepWithTitle(keepBlock(block, target)));
  });
}

/** The id EDS gives a heading with this text (aem.js toClassName). */
function headingId(label) {
  return label.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function navigationBars(main, doc, h) {
  main.querySelectorAll('.c-navigation-bar').forEach((component) => {
    const rows = [...component.querySelectorAll('.nav-wrap a.anchor')]
      .map((a) => h.text(a))
      .filter(Boolean)
      .map((label) => {
        const p = doc.createElement('p');
        p.textContent = label;
        const a = doc.createElement('a');
        a.href = `#${headingId(label)}`;
        a.textContent = label;
        return [p, a];
      });
    if (!rows.length) {
      component.remove();
      return;
    }
    (component.closest('.navigationbar') || component)
      .replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name: 'Sticky Nav', cells: rows })));
  });
}

function fullBleedPanels(main, doc, h) {
  main.querySelectorAll('.c-full-bleed-panel').forEach((component) => {
    const colour = colourStyle(component);
    const style = [colour, 'full-bleed'].filter(Boolean).join(', ');
    // the panel's content in band sections; a section it holds (tabs, accordion panels:
    // `data-keep="nodes"` with a style) keeps its style and gets the band's (Mako surgeon
    // campaign: `blue, full-bleed, tabbed`)
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length) out.push(keepNodes(doc, run, style));
      run = [];
    };
    contentUnits(component).forEach((unit) => {
      if (unit.getAttribute('data-keep') === 'nodes' && unit.hasAttribute('data-section-style')) {
        flush();
        unit.setAttribute('data-section-style', `${style}, ${unit.getAttribute('data-section-style')}`);
        out.push(unit);
      } else run.push(...unitNodes(unit, doc, h));
    });
    flush();
    // an empty gold panel (OR staff: the 34px gold band under the page title): `gold-bar`
    if (!out.length && colour === 'gold' && !h.text(component)) {
      const bar = keepNodes(doc, [], 'gold-bar');
      // the row spacing after it (markRowEnds: the gold bar ends the title row)
      const end = component.getAttribute('data-row-end');
      if (end) bar.setAttribute('data-row-end', end);
      out.push(bar);
    }
    if (!out.length) return;
    (component.closest('.fullbleedpanel') || component).replaceWith(...out);
  });
}

// in review (staging build only, STD_DRAFT_IMPORT): a source box → the Panel choices of the
// package (docs/standardisation/panel.md): the box colour (the rare ones take the nearest),
// the soft shadow of a dimensional box, the gradient direction, the inner spacing step and
// centred text
const PANEL_BOX_COLOURS = {
  white: 'box-white',
  gold: 'box-gold',
  orange: 'box-gold',
  'light-gray': 'box-gray',
  gray: 'box-gray',
  'golden-gradient': 'box-gold-gradient',
  'dark-orange-gradient': 'box-gold-gradient',
  blue: 'box-blue',
  'dark-blue-gradient': 'box-blue-gradient',
  'dark-teal-gradient': 'box-blue-gradient',
  teal: 'box-teal',
  purple: 'box-purple',
  'dark-gray': 'box-dark',
  'dark-purple-gradient': 'box-purple-gradient',
};
// the source padding % per side → the nearest step (the median of the sides; 5% the default);
// a box without one keeps the rich text's own 10px: the small step
const PANEL_SPACE_STEPS = [[0, 'space-none'], [3, 'space-s'], [5, ''], [10, 'space-l']];

/**
 * The Panel options of a source box, or '' when it isn't a box (a white box without the
 * dimensional shadow reads as the page).
 * @param {Element} box The .has-background / .dimensional-box element
 * @param {Element} component Its rich text component
 */
export function panelOptions(box, component) {
  const bg = (box.className.match(/\bbg-([a-z-]+)/) || [])[1] || '';
  const shadow = box.classList.contains('dimensional-box');
  const colour = PANEL_BOX_COLOURS[bg] || (shadow ? 'box-white' : '');
  if (!colour || (colour === 'box-white' && !shadow)) return '';
  let gradient = '';
  if (colour.endsWith('-gradient') && box.classList.contains('inverse')) {
    gradient = box.classList.contains('top-to-bottom') ? 'gradient-up' : 'gradient-reverse';
  }
  const values = ['top', 'right', 'bottom', 'left']
    .map((side) => (box.getAttribute('style') || '').match(new RegExp(`padding-${side}\\s*:\\s*([\\d.]+)%`)))
    .filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
  let space = 'space-s';
  if (values.length) {
    const median = values[Math.floor(values.length / 2)];
    [, space] = PANEL_SPACE_STEPS.reduce((best, step) => (Math.abs(step[0] - median)
      < Math.abs(best[0] - median) ? step : best));
  }
  const items = [...component.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')]
    .filter((el) => el.textContent.trim());
  const centred = items.length > 0 && items.every((el) => !!el.closest('.text-center, [style*="text-align: center"], [style*="text-align:center"]'));
  return [colour, shadow ? 'shadow' : '', gradient, space, centred ? 'text-center' : '']
    .filter(Boolean).join(', ');
}

// a source copy or heading size style → its size tag (Text style marker), relative to the
// text it sits in (a Heading 2 enlarged 1.5 times: `text-1-5`)
const PANEL_SIZE_TAGS = {
  'p-1-25': 'text-1-25',
  'p-1-5': 'text-1-5',
  'p-1-75': 'text-1-75',
  'p-2': 'text-2',
  'p-2-5': 'text-2-5',
  disclaimer: 'text-0-8',
  'h2-0-8': 'text-0-8',
  'h2-1-5': 'text-1-5',
  'h1-1-25': 'text-1-25',
};

/**
 * In review (staging build): the text of a Panel keeps its source sizes and fonts as Text
 * style markers (a page's section styles can't style one block), each paragraph, list or
 * heading with its own. On the boxes whose default text is white (blue, teal, purple, dark
 * grey and the blue and purple gradients) a white colour tag says nothing: it is dropped, so
 * a gold label (Bold + Italic) inside keeps its gold, as on stryker.com.
 */
function panelCopy(cellNodes, options, doc, h, component) {
  const parts = (style) => (style || '').split(',').map((x) => x.trim()).filter(Boolean);
  const squash = (value) => value.replace(/\[\[[^\][]+\]|\]/g, '').replace(/[\s\u00a0]+/g, '');
  // text that is not in a paragraph (a rich text without <p>) becomes one, as the editor writes it
  const nodes = [];
  cellNodes.forEach((n) => {
    const inline = n.nodeType === 3 || (n.nodeType === 1 && n.matches('a, b, br, em, i, span, strong, sub, sup, u'));
    if (!inline) {
      nodes.push(n);
      return;
    }
    let last = nodes[nodes.length - 1];
    if (!last || !last.panelParagraph) {
      if (n.nodeType === 3 && !n.textContent.trim()) return;
      last = doc.createElement('p');
      last.panelParagraph = true;
      last.copyStyle = n.copyStyle;
      nodes.push(last);
    }
    last.append(n);
  });
  // the source paragraphs and headings of the box, by their text
  const sources = new Map([...component.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
    .map((el) => [squash(el.textContent), el]));
  // the size of a source text all in size spans (nested ones multiply: 1.5em in 1.75em is
  // 2.625, the TEACH Talks titles) → the nearest size tag
  const STEPS = [[0.8, 'text-0-8'], [1.25, 'text-1-25'], [1.5, 'text-1-5'], [1.75, 'text-1-75'], [2, 'text-2'], [2.5, 'text-2-5']];
  const sizeOf = (el) => {
    const factor = [...el.querySelectorAll('[class*="fontsize-"]')]
      .filter((span) => squash(span.textContent) === squash(el.textContent))
      .map((span) => (span.className.match(/fontsize-(\d+)(?:-(\d+))?em/) || []))
      .filter((m) => m[1])
      .reduce((f, m) => f * (m[1] === '8' && !m[2] ? 0.8 : Number(`${m[1]}.${m[2] || 0}`)), 1);
    if (Math.abs(factor - 1) < 0.05) return '';
    const off = ([step]) => Math.abs(Math.log(step / factor));
    return STEPS.reduce((a, b) => (off(b) < off(a) ? b : a))[1];
  };
  // serif: all the text outside Futura bold runs is in span.urw-egyptienne
  const serifPlain = (el) => {
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    let plain = 0;
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      // (bracket tags an earlier step wrote around the text don't count)
      if (squash(t.nodeValue) && !t.parentElement.closest('.futura-bold, b, strong')) {
        if (!t.parentElement.closest('.urw-egyptienne')) return false;
        plain += 1;
      }
    }
    return plain > 0;
  };
  // tags the element's text: one tag around it all, or, when bold words must stay Futura in a
  // serif text or the text already has tags, each piece between the tags already there (so
  // the tags stay paired), the serif only outside Bold and nothing a tag around it already sets
  const TOKENS = /(\[\[[^\][]+\]|\])/;
  const SIZE = /^text-\d/;
  const tagRuns = (el, size, serif) => {
    if (!size && !serif) return;
    // one text node per run of text (the cleanup leaves the source's pieces apart)
    el.normalize();
    const hasTags = el.textContent.includes('[[');
    const hasBold = [...el.querySelectorAll('strong, b')].some((b) => b.textContent.trim());
    if (!hasTags && !(serif && hasBold)) {
      if (!el.firstChild) return;
      el.firstChild.before(doc.createTextNode(`[[${[size, serif ? 'serif' : ''].filter(Boolean).join(',')}]`));
      el.lastChild.after(doc.createTextNode(']'));
      return;
    }
    const walker = doc.createTreeWalker(el, 4);
    const texts = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
    const open = [];
    texts.forEach((t) => {
      const b = t.parentElement.closest('strong, b');
      const inBold = !!b && el.contains(b);
      t.nodeValue = t.nodeValue.split(TOKENS).map((x, i) => {
        if (i % 2 === 1) {
          if (x === ']') open.pop();
          else open.push(x.slice(2, -1).split(',').map((c) => c.trim()));
          return x;
        }
        if (!x.trim()) return x;
        const has = (test) => open.some((tags) => tags.some(test));
        const tags = [size && !has((c) => SIZE.test(c)) ? size : '',
          serif && !inBold && !has((c) => c === 'serif') ? 'serif' : ''].filter(Boolean);
        return tags.length ? `[[${tags.join(',')}]${x}]` : x;
      }).join('');
    });
  };
  nodes.filter((n) => n.nodeType === 1).forEach((n) => {
    const heading = /^H\d$/.test(n.tagName);
    const style = heading ? parts(n.headingStyle) : parts(n.copyStyle);
    const src = sources.get(squash(n.textContent));
    const size = (src && sizeOf(src)) || style.map((x) => PANEL_SIZE_TAGS[x]).find(Boolean) || '';
    const serif = (heading ? n.serifHeading : style.includes('serif')) || (!!src && serifPlain(src));
    if (n.matches('ul, ol')) {
      if (size || serif) h.tagCopy(n, [size, serif ? 'serif' : ''].filter(Boolean).join(','), doc);
    } else tagRuns(n, size, serif);
  });
  if (!/\bbox-(blue|teal|purple|dark|blue-gradient|purple-gradient)\b/.test(options)) return nodes;
  nodes.forEach((n) => {
    const walker = doc.createTreeWalker(n, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      t.nodeValue = t.nodeValue.replace(/\[\[([^\][]+)\]/g, (all, raw) => {
        const kept = raw.split(',').map((c) => c.trim()).filter((c) => c !== 'color-white');
        return `[[${kept.length ? kept.join(',') : 'panel-text'}]`;
      });
    }
  });
  return nodes;
}

/** A rich-text component whose content is a box (dimensional box, coloured box): `Panel`. */
function textBoxes(main, doc, h) {
  main.querySelectorAll('.c-rich-text-editor').forEach((component) => {
    if (component.closest('.pDiv, .panel-group, .c-full-bleed-panel, .c-tabs, [data-keep]')) return;
    const box = component.querySelector(':scope > .dimensional-box, :scope > .has-background, :scope > div > .dimensional-box');
    if (!box || !h.text(box)) return;
    // a box in a column of a row with other content: Columns styling (package 2)
    const col = component.closest('[class*="col-sm-"], [class*="col-md-"]');
    const row = col && col.parentElement;
    if (row && [...row.children].filter((c) => c !== col && h.text(c)).length) return;
    let variant = '';
    if (STD_DRAFT_IMPORT) {
      variant = panelOptions(box, component);
      if (!variant) return;
    } else if (box.classList.contains('dimensional-box')) variant = 'left';
    else {
      const colour = colourStyle(box);
      variant = {
        gold: 'gold', 'light-gray': 'gray', dark: 'dark', blue: 'blue',
      }[colour] || '';
      if (!variant) return;
    }
    let nodes = contentNodes(component, doc, h);
    if (!nodes.length) return;
    if (STD_DRAFT_IMPORT) nodes = panelCopy(nodes, variant, doc, h, component);
    const name = variant ? `Panel (${variant})` : 'Panel';
    (component.closest('.text') || component).replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells: [[nodes]] })));
  });
}

function groupLists(main, doc, h) {
  main.querySelectorAll('.c-grouplist').forEach((component) => {
    const title = component.querySelector(':scope > h2');
    const cells = [...component.querySelectorAll('.list-container')].map((group) => {
      const nodes = [];
      const heading = group.querySelector('h3');
      if (heading && h.text(heading)) {
        const h3 = doc.createElement('h3');
        h3.textContent = h.text(heading);
        nodes.push(h3);
      }
      const ul = doc.createElement('ul');
      group.querySelectorAll('li a[href]').forEach((link) => {
        const li = doc.createElement('li');
        const a = doc.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = h.text(link);
        li.append(a);
        ul.append(li);
      });
      if (ul.children.length) nodes.push(ul);
      return nodes;
    }).filter((nodes) => nodes.length);
    if (!cells.length) return;
    const out = [];
    if (title && h.text(title)) {
      const h2 = doc.createElement('h2');
      h2.textContent = h.text(title);
      out.push(h.richText(doc, [h2]));
    }
    out.push(keepBlock(WebImporter.Blocks.createBlock(doc, { name: 'Columns (columns-50-50, link-groups)', cells: [cells] })));
    (component.closest('.grouplist') || component).replaceWith(...out);
  });
}

/**
 * Fast facts (OR staff: the "Mako Total Knee / Hip / Partial Knee" band titles the sticky
 * navigation scrolls to): the title as a Heading 2, any other text as paragraphs.
 */
function fastFacts(main, doc, h) {
  // in review (staging build only): the title, then the number + text pairs as `Statistics
  // (inline)` (docs/standardisation/statistics.md)
  if (STD_DRAFT_IMPORT) {
    main.querySelectorAll('.c-fastfacts').forEach((component) => {
      const items = [...component.querySelectorAll('.c-fastfacts-item')]
        .map((item) => [item.querySelector('.c-fastfacts-number'), item.querySelector('.c-fastfacts-text')])
        .filter(([n]) => n && h.text(n));
      if (!items.length) return;
      const title = component.querySelector('.c-fastfacts-title');
      const out = [];
      if (title && h.text(title)) {
        const h2 = doc.createElement('h2');
        h2.textContent = h.text(title);
        out.push(h.richText(doc, [h2]));
      }
      const cells = items.map(([n, t]) => [n.textContent.trim(), t ? t.textContent.trim() : '']);
      const options = [items.length !== 3 ? `cols-${Math.min(items.length, 6)}` : '', 'inline'].filter(Boolean);
      const from = component.closest('.fastfacts') || component;
      out.push(keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Statistics (${options.join(', ')})`, cells }), from));
      from.replaceWith(...out);
    });
  }
  main.querySelectorAll('.c-fastfacts').forEach((component) => {
    const nodes = [...component.querySelectorAll('h2, h3, h4, p, li')]
      .filter((el) => h.text(el) && !el.querySelector('h2, h3, h4, p, li'))
      .map((el) => {
        const copy = doc.createElement(el.matches('.c-fastfacts-title') ? 'h2' : 'p');
        copy.textContent = h.text(el);
        return copy;
      });
    if (!nodes.length) {
      component.remove();
      return;
    }
    (component.closest('.fastfacts') || component).replaceWith(h.richText(doc, nodes));
  });
}

/**
 * A page hero (TEACH thank-you): its title (gold when the source colours it), subhead,
 * text and image. Text beside the image (two columns) is `Columns (columns-50-50)`; the
 * image is the desktop one (the picture source from 480px). Its bottom rule
 * (.border-bottom-gold, a 1px grey line on stryker.com) is a separator before what follows.
 */
export function pageHeroes(main, doc, h) {
  // in review (staging build): also the hero component (.c-hero, 13 page intros)
  main.querySelectorAll(STD_DRAFT_IMPORT ? '.c-page-hero, .c-hero' : '.c-page-hero').forEach((component) => {
    const columnNodes = (col) => [...col.querySelectorAll('h1, h2, p, img')].flatMap((el) => {
      if (el.matches('img')) {
        const source = el.closest('picture') && el.closest('picture').querySelector('source[srcset]');
        const img = doc.createElement('img');
        img.setAttribute('src', source ? source.getAttribute('srcset').split(/\s+/)[0] : el.getAttribute('src'));
        img.setAttribute('alt', el.getAttribute('alt') || '');
        const p = doc.createElement('p');
        p.append(img);
        return [p];
      }
      if (!h.text(el)) return [];
      const copy = doc.createElement(el.tagName.toLowerCase());
      const gold = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i
        .test(((el.getAttribute('style') || '').match(/color\s*:\s*([^;]+)/i) || [])[1]?.trim() || '');
      // gold text: bold + italic (the conventions' gold), as the committed bundle (#550) does
      const goldText = () => {
        const strong = doc.createElement('strong');
        const em = doc.createElement('em');
        em.textContent = h.text(el);
        strong.append(em);
        return strong;
      };
      // the hero's title is Futura bold 28px, its subhead Egyptienne light 24.5px (stryker.com)
      if (el.matches('h1')) {
        let strong = goldText();
        if (!gold) {
          strong = doc.createElement('strong');
          strong.textContent = h.text(el);
        }
        copy.append(doc.createTextNode('[[text-2]'), strong, doc.createTextNode(']'));
      } else if (el.matches('h2')) {
        copy.textContent = `[[text-1-75,serif]${h.text(el)}]`;
      } else if (gold) copy.append(goldText());
      else copy.textContent = h.text(el);
      return [copy];
    });
    const cols = [...component.querySelectorAll('.row > [class*="col-"]')].filter((col) => h.text(col) || col.querySelector('img'));
    // in review (staging build only, docs/standardisation/hero-corp.md): the page intro is
    // the hero's page-hero layout — the copy (title plain or gold, subhead, text) and the
    // image as two rows; the grey rule is the layout's own (no-rule without it)
    if (STD_DRAFT_IMPORT) {
      const copy = [];
      const pics = [];
      cols.forEach((col) => col.querySelectorAll('h1, h2, p, img').forEach((el) => {
        if (el.matches('img')) {
          const source = el.closest('picture') && el.closest('picture').querySelector('source[srcset]');
          const img = doc.createElement('img');
          img.setAttribute('src', source ? source.getAttribute('srcset').split(/\s+/)[0] : el.getAttribute('src'));
          img.setAttribute('alt', el.getAttribute('alt') || '');
          pics.push(img);
          return;
        }
        // a paragraph inside the title or subhead is part of it
        if (!h.text(el) || (el.parentElement && el.parentElement.closest('h1, h2'))) return;
        let tag = 'p';
        if (el.matches('h1, p.title')) tag = 'h1';
        else if (el.matches('h2, p.subhead')) tag = 'h2';
        if (tag === 'h1' && copy.some((n) => n.tagName === 'H1')) return;
        const node = doc.createElement(tag);
        // the title is gold on 479 of 481 page heroes (headColor); black when the source sets it
        const styled = el.matches('[style*="color"]') ? el : el.querySelector('[style*="color"]');
        const black = styled && /#000\b|#000000|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/i.test(styled.getAttribute('style') || '');
        const titleGold = tag === 'h1' && !black;
        if (tag === 'h1') {
          const strong = doc.createElement('strong');
          if (titleGold) {
            const em = doc.createElement('em');
            em.textContent = h.text(el);
            strong.append(em);
          } else strong.textContent = h.text(el);
          node.append(strong);
        } else node.textContent = h.text(el);
        copy.push(node);
      }));
      if (!copy.length && !pics.length) return;
      const options = ['page-hero'];
      if (!pics.length) options.push('no-image');
      if (!component.querySelector('.border-bottom-gold')) options.push('no-rule');
      const rows = [[copy]];
      if (pics.length) rows.push([pics[0]]);
      const block = keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Hero Corp (${options.join(', ')})`, cells: rows }));
      (component.closest('.pagehero, .hero') || component).replaceWith(block);
      return;
    }
    const cells = cols.map(columnNodes).filter((nodes) => nodes.length);
    if (!cells.length) return;
    const out = cells.length === 2
      ? [keepBlock(WebImporter.Blocks.createBlock(doc, { name: 'Columns (columns-50-50)', cells: [cells] }))]
      : [h.richText(doc, cells.flat())];
    if (component.querySelector('.border-bottom-gold')) {
      const rule = doc.createElement('div');
      rule.className = 'sectionseparator';
      out.push(rule);
    }
    (component.closest('.pagehero') || component).replaceWith(...out);
  });
}

function engagementCtas(main, doc, h) {
  main.querySelectorAll('.c-engagementcta').forEach((component) => {
    const nodes = [];
    const desc = component.querySelector('.m-c-subheading-description');
    if (desc && h.text(desc)) {
      [...desc.children].filter((el) => h.text(el)).forEach((el) => nodes.push(el.cloneNode(true)));
    }
    // each button (an icon and/or a label: the social buttons on the spine pages) as a
    // button link (bold, on its own line), its label the text or the icon's alt text
    component.querySelectorAll('.btn-container a[href]').forEach((link) => {
      const img = link.querySelector('img');
      const label = h.text(link) || (img && (img.getAttribute('alt') || '').trim()) || link.getAttribute('href');
      const a = doc.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = label;
      const strong = doc.createElement('strong');
      strong.append(a);
      const p = doc.createElement('p');
      p.append(strong);
      nodes.push(p);
    });
    if (!nodes.length) return;
    (component.closest('.engagementcta') || component).replaceWith(h.richText(doc, nodes));
  });
}

function interactiveImages(main, doc) {
  main.querySelectorAll('.interactivemedia').forEach((component) => {
    const asset = component.querySelector('[data-asset-path]');
    const path = asset && asset.getAttribute('data-asset-path');
    if (!path) {
      component.remove();
      return;
    }
    const img = doc.createElement('img');
    img.setAttribute('src', `https://media-assets.stryker.com/is/image/${path}`);
    img.setAttribute('alt', '');
    const box = doc.createElement('div');
    box.className = 'c-standalone-image';
    box.append(img);
    component.replaceWith(box);
  });
}

/**
 * Number counters (.numbercounter, CLOUT: an animated figure and its label): the figure (as
 * stryker.com shows it once counted: type 3 = percent, 2 = currency) in bold, the label
 * below, as text.
 */
// in review (staging build only, STD_DRAFT_IMPORT): number counters → `Statistics`
// (docs/standardisation/statistics.md). A row of only counters is one block with a cell per
// counter; a counter alone is a block of one. Counters next to images or video in a row stay
// text (to decide with the business).
const STAT_COLOURS = {
  '255,181,0': 'gold',
  '175,109,4': 'gold',
  '28,86,135': 'navy',
  '133,69,138': 'purple',
  '76,125,122': 'teal',
  '255,255,255': 'white',
};
const TEXT_COLOURS = {
  '255,181,0': 'gold',
  '28,86,135': 'blue',
  '133,69,138': 'purple',
  '76,125,122': 'teal',
  '255,255,255': 'white',
};
const rgbOf = (el) => ((el && el.getAttribute('style')) || '').replace(/\s/g, '')
  .match(/color:rgba?\((\d+,\d+,\d+)/i)?.[1];

function statFigure(widget) {
  const end = widget.getAttribute('data-numbercounter-end-number') || '';
  const type = widget.getAttribute('data-numbercounter-number-type');
  const currency = widget.getAttribute('data-numbercounter-currency-type') || '';
  if (type === '3') return `${end}%`;
  if (type === '2') return `${currency}${end}`;
  return end;
}

/** a label line as text with its stryker.com size, font and colour as one bracket tag */
function statLine(line, doc) {
  const p = doc.createElement('p');
  const classes = [line, ...line.querySelectorAll('span[class]')].flatMap((s) => [...s.classList]);
  const tags = [];
  const vw = classes.map((c) => c.match(/^fontsize-(\d+(?:-\d+)?)-?vw$/)).find(Boolean);
  const em = classes.map((c) => c.match(/^fontsize-(\d+(?:-\d+)?)em$/)).find(Boolean);
  if (vw) tags.push(`size-${vw[1]}-vw`);
  else if (em) tags.push(`text-${em[1]}`);
  if (classes.includes('urw-egyptienne')) tags.push('serif');
  const bold = classes.includes('futura-bold');
  const coloured = [line, ...line.querySelectorAll('[style*="color"]')].find((el) => rgbOf(el));
  const colour = TEXT_COLOURS[rgbOf(coloured)];
  if (colour) tags.push(`color-${colour}`);
  const copy = line.cloneNode(true);
  copy.querySelectorAll('sup span').forEach((s) => s.replaceWith(...s.childNodes));
  const sups = [...copy.querySelectorAll('sup')];
  sups.forEach((s) => s.remove());
  const text = copy.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  // Futura bold is Bold (corp <strong>); the marker goes inside it
  const run = doc.createTextNode(tags.length ? `[[${tags.join(',')}]${text}]` : text);
  if (bold) {
    const strong = doc.createElement('strong');
    strong.append(run);
    p.append(strong, ...sups);
  } else p.append(run, ...sups);
  return p;
}

function statCell(component, doc) {
  const widget = component.querySelector('[data-widget="numbercounter"]');
  const number = widget.querySelector('.numbercounter-number');
  const value = doc.createElement('p');
  value.textContent = statFigure(widget);
  const label = [...widget.children]
    .find((el) => !el.querySelector('.numbercounter-number') && el.textContent.trim());
  const lines = label ? [...label.children].filter((c) => c.textContent.trim()) : [];
  const desc = (lines.length ? lines : [label].filter(Boolean))
    .map((l) => statLine(l, doc)).filter(Boolean);
  const vw = (number.className.match(/fontsize-(\d+(?:-\d+)?)-?vw/) || [])[1];
  return {
    value,
    desc,
    colour: STAT_COLOURS[rgbOf(number)] || 'gold',
    size: vw ? Number(vw.replace('-', '.')) : 0,
    centred: !!widget.querySelector('.text-center'),
  };
}

function statisticsBlocks(main, doc) {
  const done = new Set();
  main.querySelectorAll('.numbercounter').forEach((component) => {
    if (done.has(component) || !component.querySelector('[data-widget="numbercounter"]')) return;
    const row = component.closest('.colctrl');
    const parts = row ? [...row.querySelectorAll(':scope > .row > [class*="col-"] > .row > *')] : [component];
    const counters = parts.filter((p) => p.matches('.numbercounter'));
    const others = parts.filter((p) => !p.matches('.numbercounter') && p.textContent.trim());
    if (row && (others.length || counters.length < 2)) return; // mixed: stays text
    counters.forEach((c) => done.add(c));
    const stats = counters.map((c) => statCell(c, doc));
    const colours = [...new Set(stats.map((s) => s.colour))];
    const options = [];
    if (counters.length !== 3) options.push(`cols-${Math.min(counters.length, 6)}`);
    if (colours.length === 1 && colours[0] !== 'gold') options.push(`stat-${colours[0]}`);
    const sizes = stats.map((s) => s.size).filter(Boolean);
    const size = sizes.length ? sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)] : 5;
    if (size <= 4) options.push('stat-s');
    else if (size >= 6.5) options.push('stat-l');
    if (stats.some((s) => s.centred)) options.push('text-center');
    const cells = stats.map((s) => {
      const desc = doc.createElement('div');
      desc.append(...s.desc);
      const keyword = colours.length > 1 ? [s.colour === 'white' ? 'gold' : s.colour] : [];
      return [...keyword, s.value, desc];
    });
    const name = options.length ? `Statistics (${options.join(', ')})` : 'Statistics';
    const from = row ? row.closest('[class^="cols"]') || row : component;
    from.replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells }), from));
  });
}

// in review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/widget.md): a
// stryker.com micro-app (.c-remoteComponent, its app address in input.hdnSelComp
// "Name|address") → `Widget (<variant>)` with the app's link; the Cvent events calendar
// (.c-cventComponent) → `Widget (cvent)` with the calendar link. The variant names what the app
// is (the package's list); a stage app address goes to the live host.
const WIDGET_VARIANTS = [
  [/medical-information-request/, 'medical-information-request'],
  [/mapbox|coverage|map\b/, 'map'],
  [/calculator|surfaces-rental/, 'calculator'],
];

function widgetBlock(doc, variant, href) {
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  a.textContent = href;
  return keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Widget (${variant})`, cells: [[a]] }));
}

function microApps(main, doc) {
  main.querySelectorAll('.c-remoteComponent').forEach((component) => {
    const value = (component.querySelector('.hdnSelComp') || {}).value
      || (component.querySelector('.hdnSelComp') && component.querySelector('.hdnSelComp').getAttribute('value')) || '';
    const raw = value.split('|')[1];
    if (!raw) return;
    let url;
    try {
      url = new URL(raw.trim());
    } catch (e) {
      return;
    }
    url.host = 'microapp.stryker.com';
    const hit = WIDGET_VARIANTS.find(([re]) => re.test(url.pathname.toLowerCase()));
    const from = component.closest('.remotecomponent') || component;
    from.replaceWith(widgetBlock(doc, hit ? hit[1] : 'product-explorer', url.href));
  });
  main.querySelectorAll('.c-cventComponent').forEach((component) => {
    const box = component.querySelector('[data-calendar-id]');
    if (!box) return;
    const href = `https://www.cvent.com/c/calendar/${box.getAttribute('data-calendar-id')}?widget=${box.getAttribute('data-widget-id') || ''}`;
    (component.closest('.cventcomponent') || component).replaceWith(widgetBlock(doc, 'cvent', href));
  });
}

function numberCounters(main, doc, h) {
  if (STD_DRAFT_IMPORT) microApps(main, doc);
  if (STD_DRAFT_IMPORT) statisticsBlocks(main, doc);
  main.querySelectorAll('.numbercounter').forEach((component) => {
    const widget = component.querySelector('[data-widget="numbercounter"]');
    if (!widget) return;
    const end = widget.getAttribute('data-numbercounter-end-number') || '';
    const type = widget.getAttribute('data-numbercounter-number-type');
    const currency = widget.getAttribute('data-numbercounter-currency-type') || '';
    let figure = end;
    if (type === '3') figure = `${end}%`;
    else if (type === '2') figure = `${currency}${end}`;
    const nodes = [];
    if (end) {
      const strong = doc.createElement('strong');
      strong.textContent = figure;
      const p = doc.createElement('p');
      p.append(strong);
      nodes.push(p);
    }
    const label = [...widget.children].find((el) => !el.querySelector('.numbercounter-number') && h.text(el));
    if (label) {
      const p = doc.createElement('p');
      label.querySelectorAll('br').forEach((br) => br.replaceWith(doc.createTextNode(' ')));
      p.textContent = h.text(label);
      nodes.push(p);
    }
    if (nodes.length) component.replaceWith(h.richText(doc, nodes));
  });
}

/**
 * White text in a coloured box (a large headline, rich text or full-bleed panel with a
 * stryker.com background: the nse "Elite" on gold): the `[[color-white]…]` bracket tag
 * (span-tags.js), as gold text is `[[color-gold]…]`. The box itself keeps the source's
 * default (black) text.
 */
const WHITE = /^(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
const COLOURED_BOX = '.has-background:not(.bg-white), .c-full-bleed-panel[class*="bg-"]';

function whiteText(main, doc, h) {
  main.querySelectorAll('[style*="color"]').forEach((el) => {
    const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    if (!m || !WHITE.test(m[1].trim()) || !el.closest(COLOURED_BOX) || !h.text(el)) return;
    if (el.parentElement.closest('[style*="color"]') && WHITE.test((el.parentElement.closest('[style*="color"]').getAttribute('style') || '').replace(/.*color\s*:\s*([^;]+).*/i, '$1').trim())) return;
    el.prepend(doc.createTextNode('[[color-white]'));
    el.append(doc.createTextNode(']'));
    // a box in a column row without a Columns box variant drops it again (columnRows)
    el.setAttribute('data-white-tag', '');
  });
}

function eventCalendars(main) {
  main.querySelectorAll('.c-event').forEach((component) => (component.closest('.event') || component).remove());
}

/**
 * Before the column rows are built: the components that become plain components (text,
 * image), so a column holding one keeps it.
 * @param {Element} main the page content
 * @param {Document} doc
 * @param {{ cellNodes: Function, richText: Function, text: Function, tagCopy: Function }} h
 *   helpers of
 *   long-page-detail-corp-sections.js
 */
export function convertBeforeRows(main, doc, h) {
  fastFacts(main, doc, h);
  whiteText(main, doc, h);
  interactiveImages(main, doc);
  numberCounters(main, doc, h);
  accordionsInColumns(main, doc, h);
  eventCalendars(main);
  pageHeroes(main, doc, h);
  engagementCtas(main, doc, h);
  groupLists(main, doc, h);
}

/**
 * After the column rows are built: the components that hold column rows (tabs, panels,
 * accordions) and the ones that become blocks.
 * @param {Element} main the page content
 * @param {Document} doc
 * @param {{ cellNodes: Function, richText: Function, text: Function, tagCopy: Function }} h
 *   helpers of
 *   long-page-detail-corp-sections.js
 */
export function convertAfterRows(main, doc, h) {
  navigationBars(main, doc, h);
  accordions(main, doc, h);
  textBoxes(main, doc, h);
  tabs(main, doc, h);
  fullBleedPanels(main, doc, h);
}
