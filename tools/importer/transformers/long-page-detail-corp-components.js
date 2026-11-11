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
    contents.forEach((content, i) => {
      if (!content.length) return;
      const heading = doc.createElement(`h${level}`);
      heading.textContent = labels[i] || `Tab ${i + 1}`;
      nodes.push(heading, ...content);
    });
    if (!nodes.length) return;
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
      target.replaceWith(keepBlock(block, target));
      return;
    }
    if (nested) {
      items.forEach(({ label, body }) => {
        const heading = doc.createElement('h4');
        heading.textContent = label;
        target.before(keepNodes(doc, [heading, ...body], 'accordion-panel'));
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
    target.replaceWith(keepBlock(block, target));
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
    // the band keeps its headings' styles (CLOUT "Established safety outcomes": a centred
    // 1.5em Egyptienne h2 → `center, h2-1-5, h-serif`), `center` when all its content is
    // centred (rich text centred inline, rows with `center`)
    let extras = [];
    let centred = true;
    const CENTRED = '[style*="text-align: center"], [style*="text-align:center"], .text-center';
    const flush = () => {
      // (only a band centred as a whole: its heading styles; a left-aligned band keeps the
      // section's own heading look)
      const styles = [style, ...(centred && run.length ? ['center', ...new Set(extras)] : [])];
      if (run.length) out.push(keepNodes(doc, run, styles.filter(Boolean).join(', ')));
      run = [];
      extras = [];
      centred = true;
    };
    contentUnits(component).forEach((unit) => {
      if (unit.getAttribute('data-keep') === 'nodes' && unit.hasAttribute('data-section-style')) {
        flush();
        unit.setAttribute('data-section-style', `${style}, ${unit.getAttribute('data-section-style')}`);
        out.push(unit);
        return;
      }
      const rowStyle = (unit.getAttribute('data-section-style') || '').split(',').map((s) => s.trim());
      const blocks = unit.matches('.c-rich-text-editor')
        ? [...unit.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].filter((el) => h.text(el)) : [];
      if (unit.matches('.c-rich-text-editor')) {
        // (an empty rich text, CLOUT's "&nbsp;" after the figures, does not count)
        if (!blocks.every((el) => el.closest(CENTRED))) centred = false;
      } else if (!rowStyle.includes('center') && unit.getAttribute('data-centred') !== 'true') centred = false;
      const nodes = unitNodes(unit, doc, h);
      nodes.forEach((n) => {
        if (n.headingStyle) extras.push(n.headingStyle);
        if (n.nodeType === 1 && /^H[2-3]$/.test(n.tagName) && n.serifHeading) extras.push('h-serif');
      });
      run.push(...nodes);
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
    if (box.classList.contains('dimensional-box')) variant = 'left';
    // the gold gradient box (TEACH talks "Course overview": dark gold to gold)
    else if (box.classList.contains('bg-golden-gradient')) variant = 'gold-gradient';
    else {
      const colour = colourStyle(box);
      variant = {
        gold: 'gold', 'light-gray': 'gray', dark: 'dark', blue: 'blue',
      }[colour] || '';
      if (!variant) return;
    }
    const nodes = contentNodes(component, doc, h);
    if (!nodes.length) return;
    // the box's copy sizes and font as tags (the Panel has no section style of its own)
    tagPanelCopy(nodes, doc, h);
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
function pageHeroes(main, doc, h) {
  main.querySelectorAll('.c-page-hero').forEach((component) => {
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
      // the hero's title is Futura bold 28px, its subhead Egyptienne light 24.5px (stryker.com)
      if (el.matches('h1')) {
        const strong = doc.createElement('strong');
        strong.textContent = h.text(el);
        copy.append(doc.createTextNode(gold ? '[[text-2][[color-gold]' : '[[text-2]'), strong, doc.createTextNode(gold ? ']]' : ']'));
      } else if (el.matches('h2')) {
        copy.textContent = `[[text-1-75,serif]${h.text(el)}]`;
      } else copy.textContent = gold ? `[[color-gold]${h.text(el)}]` : h.text(el);
      return [copy];
    });
    const cols = [...component.querySelectorAll('.row > [class*="col-"]')].filter((col) => h.text(col) || col.querySelector('img'));
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
 * Number counters (.numbercounter, CLOUT: an animated figure and its label): one centred
 * paragraph, as stryker.com shows it once counted (type 3 = percent, 2 = currency): the
 * figure in its vw size, bold and in its colour (`[[headline-6-5][[color-purple]0.2%]]`), then
 * the label in its own vw size (`[[headline-1-5]…]`, bold label, plain "(n=499)").
 */
// the Statistics colour keywords of a counter's figure colour
const STAT_COLOURS = [
  [/^(?:#85458a|rgb\(\s*133\s*,\s*69\s*,\s*138\s*\))$/i, 'purple'],
  [/^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i, 'gold'],
  [/^(?:#4c7d7a|rgb\(\s*76\s*,\s*125\s*,\s*122\s*\))$/i, 'teal'],
  [/^(?:#1c5687|rgb\(\s*28\s*,\s*86\s*,\s*135\s*\))$/i, 'navy'],
];

/** The figure of a number counter as stryker.com shows it once counted ('' without one). */
function counterFigure(widget) {
  const end = widget.getAttribute('data-numbercounter-end-number') || '';
  const type = widget.getAttribute('data-numbercounter-number-type');
  const currency = widget.getAttribute('data-numbercounter-currency-type') || '';
  if (!end) return '';
  if (type === '3') return `${end}%`;
  if (type === '2') return `${currency}${end}`;
  return end;
}

/**
 * A row of number counters only (CLOUT "Established safety outcomes" 0.2% / 0% / 5.0%, the
 * 94% under it): the `Statistics (count-up, cols-N)` block, which counts the figures up from 0
 * as stryker.com does. Each row: the colour keyword, the figure, the label (bold) with its
 * plain text ("(n=499)") on the next line. Template CSS gives it the source sizes.
 */
function counterRows(main, doc, h) {
  main.querySelectorAll('.colctrl').forEach((colctrl) => {
    const row = colctrl.querySelector(':scope > .row');
    const cols = row ? [...row.children].filter((el) => /\bcol-(xs|sm|md)-\d+/.test(el.className)) : [];
    const filled = cols.filter((col) => h.text(col) || col.querySelector('img, iframe, [data-widget]'));
    const counters = filled.map((col) => col.querySelectorAll('.numbercounter'));
    if (!filled.length || counters.some((list) => list.length !== 1)) return;
    if (filled.some((col, i) => h.text(col) !== h.text(counters[i][0]))) return;
    const rows = filled.map((col) => {
      const widget = col.querySelector('[data-widget="numbercounter"]');
      const number = widget && widget.querySelector('.numbercounter-number');
      const colour = number && /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(number.getAttribute('style') || '');
      const keyword = colour ? (STAT_COLOURS.find(([re]) => re.test(colour[1].trim())) || [])[1] : '';
      const label = widget && [...widget.children].find((el) => !el.querySelector('.numbercounter-number') && h.text(el));
      const desc = doc.createElement('p');
      if (label) {
        const source = label.querySelector('[class*="fontsize-"]') || label.querySelector('[style*="text-align"]') || label;
        [...source.cloneNode(true).childNodes].forEach((n) => {
          if (n.nodeType === 1 && n.matches('.futura-bold')) {
            const strong = doc.createElement('strong');
            strong.textContent = h.text(n);
            desc.append(strong);
          } else if (n.nodeType === 1 && n.matches('br')) desc.append(doc.createElement('br'));
          else if (n.textContent.trim()) desc.append(doc.createTextNode(n.textContent.trim()));
        });
      }
      return [keyword || 'purple', widget ? counterFigure(widget) : '', desc];
    });
    const block = WebImporter.Blocks.createBlock(doc, {
      name: `Statistics (count-up, cols-${rows.length})`,
      cells: rows,
    });
    // centred as a whole (a band around it keeps `center`, fullBleedPanels)
    block.setAttribute('data-centred', 'true');
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
    wrapper.replaceWith(keepBlock(block, wrapper));
  });
}

function numberCounters(main, doc, h) {
  counterRows(main, doc, h);
  main.querySelectorAll('.numbercounter').forEach((component) => {
    const widget = component.querySelector('[data-widget="numbercounter"]');
    if (!widget) return;
    const end = widget.getAttribute('data-numbercounter-end-number') || '';
    const type = widget.getAttribute('data-numbercounter-number-type');
    const currency = widget.getAttribute('data-numbercounter-currency-type') || '';
    let figure = end;
    if (type === '3') figure = `${end}%`;
    else if (type === '2') figure = `${currency}${end}`;
    const VW = /\bfontsize-(\d+(?:-\d+)?)-?vw\b/;
    const p = doc.createElement('p');
    p.setAttribute('style', 'text-align: center;');
    const number = widget.querySelector('.numbercounter-number');
    if (end) {
      const bold = doc.createElement('span');
      bold.className = 'futura-bold';
      const coloured = doc.createElement('span');
      const colour = number && /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(number.getAttribute('style') || '');
      if (colour) coloured.setAttribute('style', `color: ${colour[1].trim()};`);
      coloured.textContent = figure;
      bold.append(coloured);
      const size = number && (VW.exec(number.className) || [])[1];
      p.append(...(size ? [doc.createTextNode(`[[headline-${size}]`), bold, doc.createTextNode(']')] : [bold]));
    }
    const label = [...widget.children].find((el) => !el.querySelector('.numbercounter-number') && h.text(el));
    if (label) {
      if (p.childNodes.length) p.append(doc.createElement('br'));
      const sized = label.querySelector('[class*="fontsize-"]');
      const size = sized && (VW.exec(sized.className) || [])[1];
      const source = sized && size ? sized : (label.querySelector('[style*="text-align"]') || label);
      const nodes = [...source.cloneNode(true).childNodes];
      // the plain text of the label ("(n=499)") is in the body font (a headline tag is Futura)
      nodes.forEach((n, i) => {
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        nodes[i] = doc.createTextNode(`[[body-font]${n.textContent.trim()}]`);
      });
      p.append(...(size ? [doc.createTextNode(`[[headline-${size}]`), ...nodes, doc.createTextNode(']')] : nodes));
    }
    if (p.childNodes.length) component.replaceWith(h.richText(doc, [p]));
  });
}

/**
 * White text in a coloured box (a large headline, rich text or full-bleed panel with a
 * stryker.com background: the nse "Elite" on gold): the `[[color-white]…]` bracket tag
 * (span-tags.js), as gold text is `[[color-gold]…]`. The box itself keeps the source's
 * default (black) text.
 */
const WHITE = /^(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
const BLACK = /^(?:#000|#000000|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))$/i;
const COLOURED_BOX = '.has-background:not(.bg-white), .c-full-bleed-panel[class*="bg-"]';

function whiteText(main, doc, h) {
  main.querySelectorAll('[style*="color"]').forEach((el) => {
    const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    if (!m || !WHITE.test(m[1].trim()) || !el.closest(COLOURED_BOX) || !h.text(el)) return;
    // text a nested black overrides is not white (NeuroElite: a black span in the white one)
    const own = el.cloneNode(true);
    own.querySelectorAll('[style*="color"]').forEach((c) => {
      const colour = ((c.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i) || [])[1];
      if (colour && BLACK.test(colour.trim())) c.remove();
    });
    if (!h.text(own)) return;
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
