/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
// XF → EDS fragment path lookup (xf-fragment-map.js, shared by every importer)
import xfFragmentPath from './xf-fragment-path.js';

/*
 * News-detail shared fragments (stryker.com, #443).
 *
 * Imports the shared Experience Fragments of the news-detail pages from their own
 * XF master URL (https://www.stryker.com/content/experience-fragments/…/master.html)
 * into fragment documents. Pages then include them with the `fragment` block.
 * Each fragment gets a section style, so it can be styled and checked on its own
 * preview URL; the fragment block hoists the section into the page, so the same
 * `main .section.{style}` rules apply when embedded.
 *
 * Keys are the XF paths from the customer's "Experience Fragment References" export.
 * Each fragment is saved at the path derived from its XF path (tools/importer/xf-fragment-path.js,
 * e.g. /content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master
 * → /us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master), the same lookup
 * every page importer uses to emit the fragment block.
 */
const FRAGMENTS = {
  '/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master': {
    type: 'resources', style: 'bu-resources, p-1-25',
  },
  '/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master': {
    type: 'resources', style: 'bu-resources, p-1-25, label-1-5',
  },
  '/content/experience-fragments/stryker/sage/en/footer/footer/master': {
    type: 'resources', style: 'bu-resources, p-1-25',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master': {
    type: 'connect', style: 'connect-band',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master': {
    type: 'contact', style: 'contact-aside',
  },
  '/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master': {
    type: 'contact', style: 'contact-aside',
  },
  // The talent banner is a carousel slide. The XF master holds an older desktop image
  // with a button drawn into it; the slide on the 4 pages that share it shows the _v2
  // images (no drawn button) with a real CTA button on top, so those are carried here.
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop': {
    type: 'banner',
    style: 'talent-banner',
    desktopImage: 'https://media-assets.stryker.com/is/image/stryker/JoinOurTalentNetwork_carousel_desktop_v2?$max_width_auto$',
    mobileImage: 'https://media-assets.stryker.com/is/image/stryker/JoinOurTalentNetwork_carousel_mobile_v2?$max_width_1440$',
    cta: { text: 'Join our talent network', href: 'http://adtrk.tw/tp/rj6.uW9E.z-K' },
  },
};

const PAGE_TEMPLATE = {
  name: 'news-shared-fragments',
  description: 'Shared Experience Fragments of the news-detail pages, imported as fragment documents.',
  urls: Object.keys(FRAGMENTS).map((p) => `https://www.stryker.com${p}.html`),
  blocks: [],
};

const transformers = [cleanupTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

// www.stryker.com links to this site's own pages become root-relative EDS paths
// (the corp equivalent of the shared cleanup's source-host rule, which covers
// patients.stryker.com only): /us/en/….html → /us/en/…, index.html → folder/.
function corpLink(href) {
  const m = (href || '').match(/^https?:\/\/www\.stryker\.com(\/us\/en\/[^?#]*?)(index)?\.html([?#].*)?$/i);
  if (!m) return href;
  return `${m[2] ? m[1] : m[1]}${m[3] || ''}`;
}

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

// a clean <p><a href>label</a></p>; `standalone` marks the stryker.com
// "standalone-link" style (uppercase Futura link), authored as an underlined link
function linkPara(document, a, standalone) {
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.href = corpLink(a.getAttribute('href'));
  if (standalone) {
    const u = document.createElement('u');
    u.textContent = text(a);
    link.append(u);
  } else {
    link.textContent = text(a);
  }
  p.append(link);
  return p;
}

// stryker.com "standalone-link" (uppercase Futura link with a chevron): the class sits on
// a span around the anchor or on a span inside it; both render the same on the source
const isStandalone = (a) => !!(a.closest('.standalone-link') || a.querySelector('.standalone-link'));

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
}

function buildResources(document, src) {
  const out = [];
  const h2 = document.createElement('h2');
  h2.textContent = text(src.querySelector('.c-section-title h2')) || 'Resources';
  out.push(h2);
  const cells = [...src.querySelectorAll('.c-rich-text-editor')].map((rte) => {
    const cell = [];
    rte.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a[href]');
      if (a) {
        cell.push(linkPara(document, a, false));
      } else if (text(p)) {
        // column label (Explore / Learn / Support / More): bold paragraph
        const lp = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = text(p);
        lp.append(strong);
        cell.push(lp);
      }
    });
    return cell;
  }).filter((c) => c.length);
  out.push(WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [cells] }));
  return out;
}

function buildConnect(document, src) {
  const out = [];
  const h2 = document.createElement('h2');
  h2.textContent = text(src.querySelector('h2'));
  out.push(h2);
  src.querySelectorAll('.c-rich-text-editor p').forEach((p) => {
    if (!text(p)) return;
    const np = document.createElement('p');
    p.childNodes.forEach((n) => {
      if (n.nodeType === 3) np.append(document.createTextNode(n.textContent.replace(/ /g, ' ')));
      else if (n.nodeName === 'A') {
        const a = document.createElement('a');
        a.href = corpLink(n.getAttribute('href'));
        a.textContent = text(n);
        np.append(a);
      } else np.append(document.createTextNode(n.textContent));
    });
    const last = np.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
    out.push(np);
  });
  return out;
}

function buildContact(document, src) {
  const out = [];
  src.querySelectorAll('.c-rich-text-editor p').forEach((p) => {
    const a = p.querySelector('a[href]');
    if (a) out.push(linkPara(document, a, isStandalone(a)));
  });
  // teal buttons (LinkedIn / X / YouTube): bold standalone links = primary buttons
  src.querySelectorAll('a.btn').forEach((btn) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = corpLink(btn.getAttribute('href'));
    a.textContent = text(btn);
    strong.append(a);
    p.append(strong);
    out.push(p);
  });
  // social icon images (LinkedIn / Facebook) → icon links in one paragraph
  const icons = [...src.querySelectorAll('.c-standalone-image a[href]')].map((a) => {
    const href = a.getAttribute('href');
    const name = /linkedin/i.test(href) ? 'linkedin' : /facebook/i.test(href) ? 'facebook' : '';
    return name ? { href, name } : null;
  }).filter(Boolean);
  // (side by side, no space between them: the contact-aside style sets the gap)
  if (icons.length) {
    const p = document.createElement('p');
    icons.forEach(({ href, name }) => {
      const a = document.createElement('a');
      a.href = href;
      a.title = name === 'linkedin' ? 'LinkedIn' : 'Facebook';
      a.textContent = `:${name}:`;
      p.append(a);
    });
    out.push(p);
  }
  return out;
}

function buildBanner(document, src, def) {
  const out = [];
  const img = src.querySelector('img[src]');
  const dmLink = (href, label) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    p.append(a);
    return p;
  };
  const desktop = def.desktopImage || (img && img.getAttribute('src'));
  if (desktop) out.push(dmLink(desktop, 'Join our talent network'));
  if (def.mobileImage) out.push(dmLink(def.mobileImage, 'Join our talent network (mobile)'));
  if (def.cta) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = def.cta.href;
    a.textContent = def.cta.text;
    strong.append(a);
    p.append(strong);
    out.push(p);
  }
  return out;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const key = new URL(params.originalURL || url).pathname.replace(/\.html$/, '');
    const def = FRAGMENTS[key];
    if (!def) throw new Error(`Not a mapped shared fragment: ${key}`);

    const src = document.body;
    const main = document.createElement('div');
    const build = { resources: buildResources, connect: buildConnect, contact: buildContact, banner: buildBanner }[def.type];
    main.append(...build(document, src, def));
    main.append(sectionMetadata(document, def.style));
    document.body.replaceChildren(main);

    executeTransformers('afterTransform', main, payload);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = xfFragmentPath(key);
    if (!path) throw new Error(`Shared fragment missing from xf-fragment-map.js: ${key}`);
    return [{
      element: main,
      path,
      report: {
        title: path,
        template: PAGE_TEMPLATE.name,
        source: key,
        style: def.style,
      },
    }];
  },
};
