/* global WebImporter */
/*
 * www.stryker.com page → EDS sections, template-agnostic (every corp importer).
 *
 * The builder walks the rendered page (or experience fragment) in authored order. Every AEM
 * component is found by its wrapper class (div.text, div.cols2, div.experienceFragment, …)
 * and handed to the handler registered for it (tools/importer/corp-component-handlers.js,
 * one per row of tools/importer/decisions/component-map.json). Layout wrappers (parsys,
 * aem-Grid, rows, columns) are walked through. A handler returns items:
 *   flow      default content (paragraphs, headings, images, buttons); nodes carry their copy
 *             style (copyStyle, boldBody, serifHeading) and the item its role / box / size
 *   block     a block that joins the current section (Video); cellNodes = its form in a
 *             Columns cell (the video link)
 *   own       nodes in a section of their own (hero, columns, tabs, widgets …), with styles
 *   fragment  a Fragment block (an XF on the page) in a section of its own
 *   form      a Marketo Form block in a section of its own
 *   counter   a number counter (Statistics row), see corp-component-handlers.js
 *   anchor    a section id for the next section (hidden section titles: deepLinkingId)
 *   separator the next section starts with a rule (section style divider)
 *   boundary  the next content starts a new section (a one-column column control)
 *   group     items inside a full-bleed panel: every section they make gets the panel style
 * Components without a handler are kept as cleaned default content and reported.
 * The items are then placed into sections (place) and rendered as <hr>-separated sections
 * with Section Metadata (style, id).
 */
import { text, finishRuns } from './corp-richtext.js';

// elements that are never content
const NOT_CONTENT = new Set(['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT', 'INPUT', 'TEMPLATE', 'META', 'BUTTON']);

/**
 * The layout of a responsive-grid column, from its aem-GridColumn classes: per breakpoint
 * (default, tablet, phone) the width, offset and behaviour (newline, hide, none), or null
 * where the class is not set. Null for an element without a default width.
 */
export function gridSpec(el) {
  const cls = String(el.className);
  const get = (re) => (cls.match(re) || [])[1] ?? null;
  const at = (bp) => {
    const w = get(new RegExp(`\\baem-GridColumn--${bp}--(\\d+)\\b`));
    const o = get(new RegExp(`\\baem-GridColumn--offset--${bp}--(\\d+)\\b`));
    return {
      w: w === null ? null : Number(w),
      o: o === null ? null : Number(o),
      beh: get(new RegExp(`\\baem-GridColumn--${bp}--(newline|hide|none)\\b`)),
    };
  };
  const spec = { d: at('default'), t: at('tablet'), m: at('phone') };
  return spec.d.w ? spec : null;
}

/** The number of columns of a responsive grid (aem-Grid--N; a nested grid has its column's). */
const gridTotal = (el) => Number((String(el.className).match(/\baem-Grid--(\d+)\b/) || [])[1]) || 12;

/** An element the page hides (marked in onLoad from the live page's computed style). */
export const isHidden = (el) => el.getAttribute('data-corp-hidden') === 'true';

/**
 * Marks the elements the live page does not show (display: none at the import viewport) with
 * data-corp-hidden, for the builder to skip them (hideComponent, empty panels, modals).
 * Run in the import script's onLoad, on the live document. Inactive tab panes are not
 * marked, nor collapsed accordion panels: their content is the tab's / panel's.
 * Also keeps what the live page knows of each Marketo form (the forms2 script it loads and
 * the captcha), as data attributes on the form component.
 */
export function markLivePage(document) {
  const root = document.querySelector('#aem-specific-data') || document.body;
  root.querySelectorAll('*').forEach((el) => {
    // inactive tab panes and collapsed accordion panels hold content the user opens
    if (NOT_CONTENT.has(el.tagName) || el.matches('.tab-content, .panel-collapse')) return;
    const view = el.ownerDocument.defaultView;
    if (view && view.getComputedStyle(el).display === 'none') el.setAttribute('data-corp-hidden', 'true');
  });
  root.querySelectorAll('.c-marketo-form').forEach((form) => {
    const script = form.querySelector('script[src*="forms2"]');
    const m = script && script.getAttribute('src').match(/^((?:https?:)?\/\/[^/]+)/);
    if (m) form.setAttribute('data-corp-marketo-base', m[1]);
    const captcha = form.querySelector('altcha-widget[challengeurl]');
    if (captcha) form.setAttribute('data-corp-captcha', captcha.getAttribute('challengeurl'));
  });
}

/**
 * @param {object} options
 * @param {Document} options.doc the import document
 * @param {object} options.handlers { components: wrapper class (or #id) → handler(el, ctx),
 *   row(columns, widths, ctx): a responsive-grid row, fallback(el, ctx): unhandled components }
 * @param {string} options.source the source page path / URL, or the XF path (XF import)
 * @param {object} [options.facts] the page's page facts (data/page-facts/<template>.js)
 * @returns {object} ctx: collect(container) → items, place(items), render() → nodes, report
 */
export function createBuilder({
  doc, handlers, source, facts = null,
}) {
  const report = { unhandled: [], notes: [], hidden: 0 };
  const ctx = {
    doc, source, facts, report, handlers,
  };

  const { components } = handlers;
  const componentName = (el) => {
    if (el.id && components[`#${el.id}`]) return `#${el.id}`;
    const name = [...el.classList].find((c) => components[c]);
    if (name) return name;
    // column controls of any split (cols2_1-4_3-4 …) share the column-control handler
    return [...el.classList].some((c) => /^cols\d/.test(c)) ? 'cols*' : null;
  };
  // an AEM component nobody handles: its wrapper is a parbase, or it is a c-* component root
  const isComponent = (el) => [...el.classList].some((c) => c === 'parbase' || /^c-/.test(c));
  // a section title stays an anchor when hidden
  const keepHidden = (el) => el.matches('.section-title') || !!el.querySelector(':scope > .c-section-title[id]');

  ctx.unknown = (el, why = 'no handler') => {
    const label = `${String(el.className).trim().split(/\s+/)[0] || el.tagName.toLowerCase()}: ${text(el).slice(0, 50)}`;
    report.unhandled.push(`${label} (${why})`);
    return handlers.fallback ? handlers.fallback(el, ctx) : [];
  };

  const collectOne = (el) => {
    if (NOT_CONTENT.has(el.tagName)) return [];
    if (isHidden(el) && !keepHidden(el)) {
      report.hidden += 1;
      return [];
    }
    const name = componentName(el);
    if (name) return components[name === 'cols*' ? 'cols' : name](el, ctx) || [];
    if (isComponent(el)) return ctx.unknown(el);
    // content authored straight in a layout wrapper (rare): kept, reported
    if (/^(P|H[1-6]|UL|OL|TABLE|IMG|A)$/.test(el.tagName) && text(el)) return ctx.unknown(el, 'loose content');
    // a layout wrapper: its children (ctx.collect, defined below)
    return ctx.collect(el);
  };

  /**
   * The items of a container, in order. In a responsive grid of N columns (12, or a nested
   * grid's column width), columns narrower than N fill lines the AEM way (width + offset up
   * to N; a newline column starts a new line; columns hidden on the page take no room). Two
   * or more columns on a line are one row (e.g. image 4 + text 8, or 4 + 6 with 2 left
   * empty): handlers.row (the column-control rules) decides what they become, with each
   * column's layout at every breakpoint (gridSpec).
   */
  ctx.collect = function collect(container) {
    const out = [];
    const total = gridTotal(container);
    let run = [];
    let used = 0;
    const flush = () => {
      if (run.length > 1 && handlers.row) {
        out.push(...handlers.row(
          run.map((r) => collectOne(r.el)),
          run.map((r) => r.spec.d.w),
          ctx,
          { specs: run.map((r) => r.spec), total },
        ));
      } else {
        run.forEach((r) => out.push(...collectOne(r.el)));
      }
      run = [];
      used = 0;
    };
    [...container.children].forEach((child) => {
      const spec = gridSpec(child);
      if (spec && spec.d.w < total) {
        if (isHidden(child) && !keepHidden(child)) {
          report.hidden += 1;
          return;
        }
        const room = (spec.d.o || 0) + spec.d.w;
        if (run.length && (used + room > total || spec.d.beh === 'newline')) flush();
        run.push({ el: child, spec });
        used += room;
        if (used >= total) flush();
        return;
      }
      flush();
      out.push(...collectOne(child));
    });
    flush();
    return out;
  };
  ctx.collectOne = collectOne;

  /* ---------- placement ---------- */
  const sections = [];
  let current = null;
  let pendingIds = [];
  let pendingStyles = [];
  const context = [];

  const start = (kind, styles = []) => {
    const all = [...context, ...pendingStyles, ...styles].filter(Boolean);
    current = {
      kind, styles: [...new Set(all)], id: pendingIds[0] || null, nodes: [],
    };
    if (pendingIds.length > 1) report.notes.push(`anchors without content of their own, dropped: #${pendingIds.slice(1).join(', #')}`);
    pendingIds = [];
    pendingStyles = [];
    sections.push(current);
    return current;
  };
  const close = () => { current = null; };
  ctx.close = close;

  /** The section styles of a default-content node (copy size and font, box, alignment). */
  const nodeStyles = (node, item) => [
    item.centred ? 'center' : '',
    ...String(node.copyStyle || '').split(',').map((s) => s.trim()),
    node.boldBody ? 'bold-body' : '',
    ...(item.styles || []),
    ...(item.spacing || []),
  ].filter(Boolean);
  let spacedBoxes = 0;

  function placeFlow(item) {
    // an image (or image button) joins the default content it follows, whatever its copy style
    if ((item.role === 'image' || item.role === 'cta') && current && current.key && !current.spaced && !item.own) {
      current.nodes.push(...item.nodes);
      return;
    }
    // a box with its own padding / margin (spacing tokens), or an item marked own (a bordered
    // image, coloured buttons: their section style applies to them only), is a section of its own
    if (((item.spacing || []).length || item.own) && !item.spacedBox) {
      spacedBoxes += 1;
      item.spacedBox = spacedBoxes;
    }
    item.nodes.forEach((node) => {
      const styles = nodeStyles(node, item);
      const key = `flow:${styles.join(',')}${item.spacedBox ? `#${item.spacedBox}` : ''}`;
      // an Egyptienne h2 / h3 adds h-serif to its section; a Futura one after it starts a new
      // one. Likewise an h2 / h3 authored larger adds its size style (h-1-25 / h-1-5); one of
      // another size after it starts a new section
      let font = null;
      let size = null;
      if (/^H[23]$/.test(node.tagName)) {
        font = node.serifHeading ? 'serif' : 'futura';
        size = node.headingSize || 'plain';
      }
      if (!current || current.key !== key || (font && current.font && current.font !== font)
        || (size && current.headingSize && current.headingSize !== size)) {
        // a section split off the same source component (its copy changes style) continues
        // it: no component gap before it (section style continued, approved 2026-10-31)
        const continues = !!current && current.item === item;
        start('flow', continues ? [...styles, 'continued'] : styles).key = key;
        current.spaced = !!item.spacedBox;
        current.item = item;
      }
      if (font) {
        if (font === 'serif' && current.font !== 'serif') current.styles.push('h-serif');
        current.font = font;
      }
      if (size) {
        if (size !== 'plain' && current.headingSize !== size) current.styles.push(size);
        current.headingSize = size;
      }
      current.nodes.push(node);
    });
  }

  function place(items) {
    items.forEach((item) => {
      switch (item.type) {
        case 'anchor':
          if (!pendingIds.includes(item.id)) pendingIds.push(item.id);
          close();
          break;
        case 'separator':
          pendingStyles.push('divider');
          close();
          break;
        case 'boundary':
          close();
          break;
        case 'flow':
          placeFlow(item);
          break;
        case 'block':
          if (!current || !current.key) start('flow').key = 'flow:';
          current.nodes.push(item.block);
          break;
        case 'group':
          close();
          context.push(...item.styles);
          place(item.items);
          item.styles.forEach(() => context.pop());
          close();
          break;
        case 'own':
        case 'fragment':
        case 'form':
          start(item.kind || item.type, item.styles).nodes.push(...item.nodes);
          close();
          break;
        default:
          report.notes.push(`item of unknown type ${item.type} dropped`);
      }
    });
  }
  ctx.place = place;

  /** Appends a section built outside the walk (e.g. the page disclaimer). */
  ctx.addSection = (kind, styles, nodes) => {
    close();
    start(kind, styles).nodes.push(...nodes);
    close();
  };

  /** The sections as <hr>-separated content with their Section Metadata. */
  ctx.render = () => {
    if (pendingIds.length) report.notes.push(`anchors at the end without a section: #${pendingIds.join(', #')}`);
    if (pendingStyles.length) report.notes.push(`trailing ${pendingStyles.join(', ')} without a section after it, dropped`);
    const out = [];
    // a stripe (an empty coloured band) is a section without content
    sections.filter((s) => s.nodes.length || s.kind === 'stripe').forEach((section, i) => {
      if (i > 0) out.push(doc.createElement('hr'));
      // run sizes / fonts the section styles do not give → bracket tags (corp-richtext.js)
      finishRuns(section.nodes, section.styles);
      out.push(...section.nodes);
      const cells = {};
      if (section.styles.length) cells.style = section.styles.join(', ');
      if (section.id) cells.id = section.id;
      if (Object.keys(cells).length) {
        out.push(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells }));
      }
    });
    return out;
  };
  ctx.sections = sections;
  return ctx;
}
