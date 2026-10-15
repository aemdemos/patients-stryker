/* global WebImporter */

/**
 * Import: IVS condition-detail pages.
 * Sources (tools/importer/urls-condition-detail.txt):
 *   /us/en/ivs/conditions/{back,hip,knee,shoulder}-pain.html
 *   /us/en/ivs/treatments/genicular-radiofrequency-ablation.html
 *
 * Output mirrors the authored DA documents. The page walks the source's top-level
 * components in order and emits one section each, with spacer sections between:
 *   spacer · Hero (banner) · spacer (xlarge before a plain intro)
 *   intro    — cols2 with a .dimensional-box → default text + Panel (cta), style `flex`
 *              (back pain: a plain text intro section instead)
 *   conditions (back pain) — each cols2 → Panel (dark) + [image] + Panel (left)
 *              + "Related treatment" links, style `flex`, spacer between
 *   dark band — .fullbleedpanel: cols2 → Columns (50-50), style `dark, full-bleed`;
 *              single text → Panel (dark, wide), style `dark`
 *   spacer, large · Panel (gold) · Marketo Form
 *   resources — .tabs: one tab → h2 + Cards (resources); several tabs → spacer + h2,
 *              then an h3 + Cards (resources) per tab, style `tabbed`
 *   risks    — light-gray default content (genicular RFA)
 *   disclaimer — footnotes, references and the job code, style `compact`
 *   Metadata — Title, Description, Image, og:title, canonical, nav, footer and
 *              template `condition-detail` (templates/condition-detail/).
 *
 * Source markup is rebuilt with the emphasis the site's CSS relies on: a partly
 * bold (`.futura-bold`) heading → <em><strong> on the bold part; a fully bold
 * heading → plain (bold in a dark panel); gold buttons → <em><strong> links; teal
 * card buttons → <strong> links. Footnote links (#disclaimer) are unwrapped, as the
 * site links citations itself.
 */

const ORIGIN = 'https://patients.stryker.com';
const NAV = '/us/en/ivs/nav-ivs';
const FOOTER = '/us/en/ivs/footer-ivs';
const TEMPLATE = 'condition-detail';

const MARKETO_DEFAULTS = {
  baseUrl: '//lp.stryker.com',
  munchkinId: '338-WAP-571',
  formId: '4893',
  captchaScript: `${ORIGIN}/etc.clientlibs/stryker/components/content/altcha/altcha.js`,
  captchaChallengeUrl: `${ORIGIN}/bin/stryker/captcha/challenge`,
};

const COMPONENTS = '.fullWidthImageHero, .cols2, .text.parbase, .fullbleedpanel, .marketoform, .tabs';

// Per-page settings (keyed by the last path segment) so the output matches the
// authored DA documents where pages were set up differently. Text always comes
// from the source page.
const PAGE_SETTINGS = {
  // the dark band section is authored as `full-bleed` + a `background: dark` row
  'hip-pain': { darkBandSection: { style: 'full-bleed', background: 'dark' } },
  // reference URLs in the disclaimer are links
  'back-pain': { linkReferenceUrls: true },
  // "Resources" heading underlined only (not bold); no canonical / footer rows
  'genicular-radiofrequency-ablation': {
    resourcesHeadingBold: false,
    omitMetadata: ['canonical', 'footer'],
  },
};

const squash = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
const text = (el) => (el ? squash(el.textContent).trim() : '');

/**
 * Normalises a source href: footnote anchors are dropped (null), DAM assets become
 * absolute on the source origin, site pages lose the origin and `.html`.
 * @param {string} href the source href
 * @returns {string|null} the authored href, or null to unwrap the link
 */
function cleanHref(href) {
  if (!href) return null;
  if (href === '#disclaimer' || href === '#') return null;
  if (href.startsWith('#')) return href;
  let url;
  try {
    url = new URL(href, ORIGIN);
  } catch (e) {
    return href;
  }
  if (url.origin !== ORIGIN) return url.href;
  if (url.pathname.startsWith('/content/dam/')) return `${ORIGIN}${url.pathname}`;
  return `${url.pathname.replace(/\.html$/, '')}${url.hash === '#disclaimer' ? '' : url.hash}`;
}

/**
 * Copies a source node's inline content as clean authored markup: bold/italic/
 * underline/superscript/links/line breaks are kept; layout spans are unwrapped and
 * `.futura-bold` spans become <strong>.
 * @param {Document} document the import document
 * @param {Node} node the source node
 * @param {Node} target the element receiving the copy
 */
function copyInline(document, node, target) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      target.append(document.createTextNode(squash(child.textContent)));
      return;
    }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    let el = null;
    if (tag === 'br') {
      target.append(document.createElement('br'));
      return;
    }
    if (tag === 'b' || tag === 'strong' || (tag === 'span' && child.classList.contains('futura-bold'))) el = document.createElement('strong');
    else if (tag === 'i' || tag === 'em') el = document.createElement('em');
    else if (tag === 'u') el = document.createElement('u');
    else if (tag === 'sup') el = document.createElement('sup');
    else if (tag === 'a') {
      const href = cleanHref(child.getAttribute('href'));
      if (href) {
        el = document.createElement('a');
        el.href = href;
      }
    }
    if (el) {
      copyInline(document, child, el);
      if (el.textContent.trim() || el.querySelector('br')) target.append(el);
    } else {
      copyInline(document, child, target);
    }
  });
}

/** Collapses whitespace runs, trims the element's edges and drops empty formatting. */
function tidy(el) {
  el.normalize();
  el.querySelectorAll('strong, em, u').forEach((f) => {
    // move edge whitespace out of formatting:
    // "Identifying<strong> your" → "Identifying <strong>your"
    const first = f.firstChild;
    if (first && first.nodeType === 3 && /^\s/.test(first.textContent)) {
      first.textContent = first.textContent.replace(/^\s+/, '');
      f.before(f.ownerDocument.createTextNode(' '));
    }
    const last = f.lastChild;
    if (last && last.nodeType === 3 && /\s$/.test(last.textContent)) {
      last.textContent = last.textContent.replace(/\s+$/, '');
      f.after(f.ownerDocument.createTextNode(' '));
    }
  });
  el.normalize();
  const walker = el.ownerDocument.createTreeWalker(el, 4);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => { n.textContent = n.textContent.replace(/ {2,}/g, ' '); });
  // trim the block's outer edges and around line breaks
  const edge = (node, side) => {
    let cur = node;
    while (cur && cur.nodeType === 1 && cur.tagName !== 'BR') cur = side === 'start' ? cur.firstChild : cur.lastChild;
    if (cur && cur.nodeType === 3) {
      cur.textContent = side === 'start' ? cur.textContent.replace(/^\s+/, '') : cur.textContent.replace(/\s+$/, '');
    }
  };
  edge(el, 'start');
  edge(el, 'end');
  el.querySelectorAll('br').forEach((br) => {
    if (br.previousSibling && br.previousSibling.nodeType === 3) {
      br.previousSibling.textContent = br.previousSibling.textContent.replace(/\s+$/, '');
    }
    if (br.nextSibling && br.nextSibling.nodeType === 3) {
      br.nextSibling.textContent = br.nextSibling.textContent.replace(/^\s+/, '');
    }
  });
  // a text-free trailing <sup> link wrapper etc. is fine; drop empty formatting
  el.querySelectorAll('strong, em, u').forEach((f) => { if (!f.textContent.trim()) f.replaceWith(...f.childNodes); });
  return el;
}

/**
 * Heading emphasis: a fully bold heading is authored plain (or <strong> when
 * `keepBold`); a partly bold one keeps <em><strong> on the bold run.
 */
function headingEmphasis(document, h, keepBold) {
  const strongs = [...h.querySelectorAll(':scope > strong')];
  const bare = [...h.childNodes].filter((n) => !(n.nodeType === 1 && ['STRONG', 'SUP'].includes(n.tagName))
    && n.textContent.trim());
  if (strongs.length && !bare.length) {
    // fully bold
    strongs.forEach((s) => s.replaceWith(...s.childNodes));
    if (keepBold) {
      const strong = document.createElement('strong');
      strong.append(...h.childNodes);
      h.append(strong);
    }
  } else {
    strongs.forEach((s) => {
      const em = document.createElement('em');
      s.replaceWith(em);
      em.append(s);
    });
  }
  return h;
}

/** Turns plain-text URLs (e.g. in references) into links; trailing punctuation stays outside. */
function linkUrls(document, el) {
  const walker = document.createTreeWalker(el, 4);
  const nodes = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('a')) nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    const parts = node.textContent.split(/(https?:\/\/[^\s<]*[^\s<.,;:)])/);
    if (parts.length < 2) return;
    node.replaceWith(...parts.filter(Boolean).map((part) => {
      if (!/^https?:\/\//.test(part)) return document.createTextNode(part);
      const a = document.createElement('a');
      a.href = part;
      a.textContent = part;
      return a;
    }));
  });
}

/**
 * Rebuilds a rich-text component's blocks (headings, paragraphs, lists).
 * @param {Document} document the import document
 * @param {Element} rte the source `.text.parbase` (or any container)
 * @param {{ keepBold?: boolean, linkUrls?: boolean }} [opts]
 * @returns {Element[]} authored elements
 */
function richText(document, rte, opts = {}) {
  const box = rte.querySelector('.c-rich-text-editor > div') || rte;
  const out = [];
  [...box.children].forEach((child) => {
    const tag = child.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || tag === 'p') {
      const el = document.createElement(tag);
      copyInline(document, child, el);
      tidy(el);
      if (!el.textContent.trim()) return;
      out.push(/^h/.test(tag) ? headingEmphasis(document, el, opts.keepBold) : el);
    } else if (tag === 'ul' || tag === 'ol') {
      const list = document.createElement(tag);
      child.querySelectorAll(':scope > li').forEach((li) => {
        // the item text goes in a <p>: the markdown step otherwise breaks a list
        // item's line before an inline <sup> ("pain <sup>*</sup>"). A tight list
        // still comes out as a plain <li>.
        const para = document.createElement('p');
        copyInline(document, li, para);
        tidy(para);
        if (!para.textContent.trim()) return;
        if (opts.linkUrls) linkUrls(document, para);
        const item = document.createElement('li');
        item.append(para);
        list.append(item);
      });
      if (list.children.length) out.push(list);
    } else if (tag === 'div') {
      out.push(...richText(document, child, opts));
    }
  });
  return out;
}

/** A gold/teal source button → authored link, bold+italic (gold) or bold (teal). */
function buttonLink(document, a, { accent = true, newTab = false } = {}) {
  const link = document.createElement('a');
  const href = cleanHref(a.getAttribute('href')) || a.getAttribute('href');
  link.href = newTab && a.getAttribute('target') === '_blank' ? `${href}#_blank` : href;
  link.textContent = text(a);
  const strong = document.createElement('strong');
  strong.append(link);
  const p = document.createElement('p');
  if (accent) {
    const em = document.createElement('em');
    em.append(strong);
    p.append(em);
  } else {
    p.append(strong);
  }
  return p;
}

/** A Dynamic Media image → `<p><a href="DM url">alt</a></p>` (see scripts/dm-support.js). */
function dmImage(document, src, alt, withTitle = false) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = src;
  a.textContent = alt || src;
  if (withTitle && alt) a.title = alt;
  p.append(a);
  return p;
}

const block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });

function buildHero(document, el) {
  const img = el.querySelector('.imgBoxId img, picture img');
  const source = el.querySelector('picture source[srcset]');
  const alt = img ? img.getAttribute('alt') || '' : '';
  const mobile = img ? img.getAttribute('src') : '';
  const desktop = source ? source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0] : mobile;
  const h1 = document.createElement('h1');
  const em = document.createElement('em');
  const strong = document.createElement('strong');
  strong.textContent = text(el.querySelector('.largeheadline h1')) || text(el.querySelector('h1')).replace(/\s*\|.*$/, '');
  em.append(strong);
  h1.append(em);
  const content = [h1];
  const cta = el.querySelector('.curatedcta a[href], a.btn[href]');
  if (cta) content.push(buttonLink(document, cta, { newTab: true }));
  const rows = [];
  if (desktop) rows.push([dmImage(document, desktop, alt)]);
  if (mobile && mobile !== desktop) rows.push([dmImage(document, mobile, alt)]);
  rows.push([content]);
  return block(document, 'Hero (banner)', rows);
}

/** Intro: left text as default content + right `.dimensional-box` (+ button) as Panel (cta). */
function buildIntro(document, el) {
  const [left, right] = el.querySelectorAll(':scope > .colctrl > .row > div');
  const nodes = [];
  left.querySelectorAll('.text.parbase').forEach((t) => nodes.push(...richText(document, t)));
  const panel = [];
  right.querySelectorAll('.text.parbase').forEach((t) => panel.push(...richText(document, t)));
  right.querySelectorAll('.buttonset a[href]').forEach((a) => panel.push(buttonLink(document, a)));
  nodes.push(block(document, 'Panel (cta)', [[panel]]));
  return nodes;
}

/** Back-pain condition row: Panel (dark) + optional image + Panel (left) + related links. */
function buildCondition(document, el) {
  const nodes = [];
  const texts = [...el.querySelectorAll('.text.parbase')];
  const dark = texts.find((t) => t.querySelector('.bg-dark-teal-gradient'));
  const box = texts.find((t) => t.querySelector('.dimensional-box'));
  const rest = texts.filter((t) => t !== dark && t !== box);
  if (dark) nodes.push(block(document, 'Panel (dark)', [[richText(document, dark, { keepBold: true })]]));
  el.querySelectorAll('.standaloneimage img').forEach((img) => {
    nodes.push(dmImage(document, img.getAttribute('src'), img.getAttribute('alt')));
  });
  if (box) nodes.push(block(document, 'Panel (left)', [[richText(document, box)]]));
  rest.forEach((t) => nodes.push(...richText(document, t)));
  return nodes;
}

/** Dark band: two columns → Columns (50-50); a single text → Panel (dark, wide). */
function buildDarkBand(document, el) {
  const cols = el.querySelector('.cols2');
  if (cols) {
    const cells = [...cols.querySelectorAll(':scope > .colctrl > .row > div')].map((col) => {
      const content = [];
      col.querySelectorAll('.text.parbase').forEach((t) => content.push(...richText(document, t)));
      return content;
    });
    return { nodes: [block(document, 'Columns (columns-50-50)', [cells])], style: 'dark, full-bleed' };
  }
  const content = [];
  el.querySelectorAll('.text.parbase').forEach((t) => content.push(...richText(document, t)));
  return { nodes: [block(document, 'Panel (dark, wide)', [[content]])], style: 'dark' };
}

/** "Tired of living in pain?" gold CTA band. */
function buildGold(document, el) {
  const a = el.querySelector('a[href]');
  const p = document.createElement('p');
  const lead = el.querySelector('.urw-egyptienne');
  p.append(document.createTextNode(text(lead) || text(el).replace(text(a), '').trim()));
  if (a) {
    p.append(document.createElement('br'));
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = cleanHref(a.getAttribute('href')) || a.getAttribute('href');
    const u = document.createElement('u');
    u.textContent = text(a);
    link.append(u);
    strong.append(link);
    p.append(strong);
  }
  return block(document, 'Panel (gold)', [[p]]);
}

function buildMarketo(document, el) {
  const cfg = { ...MARKETO_DEFAULTS };
  const form = el.querySelector('form[id^="mktoForm_"]');
  const id = form && form.id.match(/^mktoForm_(\d+)$/);
  if (id) [, cfg.formId] = id;
  const html = el.innerHTML;
  const base = html.match(/data-marketo-base-url\s*=\s*"([^"]+)"/i);
  const munchkin = html.match(/data-marketo-munchkin-id\s*=\s*"([^"]+)"/i);
  if (base) [, cfg.baseUrl] = base;
  if (munchkin) [, cfg.munchkinId] = munchkin;
  const widget = el.querySelector('altcha-widget[challengeurl]');
  const challenge = widget && widget.getAttribute('challengeurl');
  if (challenge) cfg.captchaChallengeUrl = new URL(challenge, ORIGIN).href;
  return block(document, 'Marketo Form', {
    'Base URL': cfg.baseUrl,
    'Munchkin ID': cfg.munchkinId,
    'Form ID': cfg.formId,
    'Captcha Script': cfg.captchaScript,
    'Captcha Challenge URL': cfg.captchaChallengeUrl,
  });
}

/** One tab's brochure cards → Cards (resources): [image link] [LEARN MORE]. */
function buildCards(document, pane) {
  const rows = [];
  pane.querySelectorAll('.colctrl > .row > div').forEach((col) => {
    const img = col.querySelector('.cta-img img');
    const btn = col.querySelector('a.btn[href]');
    if (!img || !btn) return;
    rows.push([
      dmImage(document, img.getAttribute('src'), img.getAttribute('alt'), true),
      buttonLink(document, btn, { accent: false }),
    ]);
  });
  return rows.length ? block(document, 'Cards (resources)', rows) : null;
}

/** Resources tabs → { nodes, tabbed } or null when the tabs hold no brochures. */
function buildResources(document, el, { bold = true } = {}) {
  const heading = document.createElement('h2');
  const u = document.createElement('u');
  u.textContent = text(el.querySelector('.component-subheading')) || 'Resources';
  if (bold) {
    const strong = document.createElement('strong');
    strong.append(u);
    heading.append(strong);
  } else {
    heading.append(u);
  }
  const labels = [...el.querySelectorAll('.tabs-nav li a')].map((a) => text(a));
  const panes = [...el.querySelectorAll('.tabs-content > .tab-content')];
  const tabbed = labels.filter(Boolean).length > 1;
  const nodes = [heading];
  panes.forEach((pane, i) => {
    const cards = buildCards(document, pane);
    if (!cards) return;
    if (tabbed && labels[i]) {
      const h3 = document.createElement('h3');
      h3.textContent = labels[i];
      nodes.push(h3);
    }
    nodes.push(cards);
  });
  return nodes.length > 1 ? { nodes, tabbed } : null;
}

function buildDisclaimer(document, { linkReferences = false } = {}) {
  const nodes = [];
  const box = document.querySelector('.c-disclaimer.page-section:not(.container)');
  if (box) nodes.push(...richText(document, box, { linkUrls: linkReferences }));
  document.querySelectorAll('.c-disclaimer:not(.page-section) p').forEach((p) => {
    const el = document.createElement('p');
    el.textContent = text(p);
    if (el.textContent) nodes.push(el);
  });
  return nodes;
}

function buildMetadata(document, params, omit = []) {
  const meta = WebImporter.Blocks.getMetadata(document) || {};
  // the site appends " | Stryker" to every title itself
  if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
  const h1 = text(document.querySelector('.fullWidthImageHero .largeheadline h1'));
  if (h1) meta['og:title'] = h1;
  meta.canonical = params.originalURL;
  meta.nav = NAV;
  meta.footer = FOOTER;
  meta.template = TEMPLATE;
  delete meta.theme;
  omit.forEach((key) => delete meta[key]);
  return WebImporter.Blocks.getMetadataBlock(document, meta);
}

/** Source components in page order (outermost matches only). */
function components(document) {
  const root = document.querySelector('.main.content') || document.body;
  const all = [...root.querySelectorAll(COMPONENTS)];
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}

function kindOf(el) {
  if (el.matches('.fullWidthImageHero')) return 'hero';
  if (el.matches('.fullbleedpanel')) return 'dark';
  if (el.matches('.marketoform')) return 'marketo';
  if (el.matches('.tabs')) return 'resources';
  if (el.matches('.cols2')) return el.querySelector('.bg-dark-teal-gradient') ? 'condition' : 'intro';
  if (el.querySelector('.bg-gold')) return 'gold';
  if (el.querySelector('.bg-light-gray, .bg-lighter-gray')) return 'risks';
  return el.textContent.trim() ? 'text' : null;
}

export default {
  transform: ({ document, params }) => {
    const slug = new URL(params.originalURL).pathname
      .replace(/\/$/, '').replace(/\.html$/, '').split('/').pop();
    const settings = PAGE_SETTINGS[slug] || {};
    const sections = [];
    const add = (nodes, style) => sections.push({ nodes, style });
    const spacer = (style = 'spacer') => add([], style);

    const parts = components(document)
      .map((el) => ({ el, kind: kindOf(el) }))
      .filter((p) => p.kind);
    let prev = null;
    parts.forEach(({ el, kind }, i) => {
      const next = parts[i + 1] || null;
      let emitted = kind;
      if (kind === 'hero') {
        spacer();
        add([buildHero(document, el)]);
        spacer(next && next.kind === 'text' ? 'spacer, xlarge' : 'spacer');
      } else if (kind === 'text') {
        add(richText(document, el));
        spacer();
      } else if (kind === 'intro') {
        add(buildIntro(document, el), 'flex');
        // a two-column dark band gets a gap above it; the single dark statement sits flush
        if (next && next.kind === 'dark' && next.el.querySelector('.cols2')) spacer();
      } else if (kind === 'condition') {
        add(buildCondition(document, el), 'flex');
        spacer();
      } else if (kind === 'dark') {
        const { nodes, style } = buildDarkBand(document, el);
        const twoColumns = !!el.querySelector('.cols2');
        add(nodes, twoColumns && settings.darkBandSection ? settings.darkBandSection : style);
        spacer('spacer, large');
      } else if (kind === 'gold') {
        add([buildGold(document, el)]);
      } else if (kind === 'marketo') {
        add([buildMarketo(document, el)]);
      } else if (kind === 'resources') {
        const res = buildResources(document, el, { bold: settings.resourcesHeadingBold !== false });
        if (!res) return;
        if (res.tabbed) spacer();
        add(res.nodes, res.tabbed ? 'tabbed' : null);
        emitted = res.tabbed ? 'resources-tabbed' : 'resources';
      } else if (kind === 'risks') {
        spacer('spacer, large');
        add(richText(document, el), 'light-gray');
      }
      prev = emitted;
    });

    const disclaimer = buildDisclaimer(document, { linkReferences: !!settings.linkReferenceUrls });
    if (disclaimer.length) {
      if (prev === 'resources') spacer('spacer, xxlarge');
      else if (prev !== 'risks') spacer('spacer, large');
      add(disclaimer, 'compact');
    }

    const main = document.createElement('div');
    sections.forEach(({ nodes, style }, i) => {
      if (i) main.append(document.createElement('hr'));
      main.append(...nodes);
      // style is a style string, or an object of Section Metadata rows
      if (style) main.append(block(document, 'Section Metadata', typeof style === 'string' ? { style } : style));
    });
    main.append(
      document.createElement('hr'),
      buildMetadata(document, params, settings.omitMetadata),
    );

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );
    return [{
      element: main,
      path,
      report: { title: document.title, template: TEMPLATE },
    }];
  },
};
