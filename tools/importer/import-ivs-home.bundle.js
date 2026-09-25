/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-ivs-home.js
  var import_ivs_home_exports = {};
  __export(import_ivs_home_exports, {
    default: () => import_ivs_home_default
  });

  // tools/importer/parsers/ivs-home/hero.js
  var DESKTOP_DM_URL = "https://media-assets.stryker.com/is/image/stryker/homepage-hero_1920x640-1?$max_width_1410$";
  var MOBILE_DM_URL = "https://media-assets.stryker.com/is/image/stryker/hompeage-hero_1200x680-1?$max_width_720$";
  function parse(element, { document }) {
    const picture = element.querySelector(".imgBoxId picture, .full-width-img picture, picture");
    const srcImg = element.querySelector(".imgBoxId img, .full-width-img img, picture img");
    const alt = srcImg && srcImg.getAttribute("alt") || "";
    let desktopSrc = "";
    const source = picture && picture.querySelector("source[srcset]");
    if (source) desktopSrc = source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
    if (!desktopSrc) desktopSrc = DESKTOP_DM_URL;
    const desktopImg = document.createElement("img");
    desktopImg.setAttribute("src", desktopSrc);
    desktopImg.setAttribute("alt", alt);
    const mobileSrc = srcImg && srcImg.getAttribute("src") || MOBILE_DM_URL;
    const mobileImg = document.createElement("img");
    mobileImg.setAttribute("src", mobileSrc);
    mobileImg.setAttribute("alt", alt);
    const visibleEl = element.querySelector(".c-largeheadline h1, .largeheadline h1");
    const pageTitleEl = element.querySelector(".hero-space h1");
    const visibleText = visibleEl && visibleEl.textContent.trim() || pageTitleEl && pageTitleEl.textContent.trim() || "Pain doesn\u2019t hold the power. You do.";
    const GOLD_TAIL = "You do.";
    const heading = document.createElement("h1");
    const idx = visibleText.lastIndexOf(GOLD_TAIL);
    if (idx > 0) {
      const leadText = visibleText.slice(0, idx).trim();
      const leadStrong = document.createElement("strong");
      leadStrong.textContent = `${leadText} `;
      heading.append(leadStrong);
      const goldEm = document.createElement("em");
      const goldStrong = document.createElement("strong");
      goldStrong.textContent = GOLD_TAIL;
      goldEm.append(goldStrong);
      heading.append(goldEm);
    } else {
      const strong = document.createElement("strong");
      strong.textContent = visibleText;
      heading.append(strong);
    }
    const contentCell = [heading];
    const subEl = element.querySelector(".c-largeheadline h2, .largeheadline h2");
    const subText = subEl && subEl.textContent.trim();
    if (subText) {
      const h2 = document.createElement("h2");
      h2.textContent = subText;
      contentCell.push(h2);
    }
    const ctaAnchor = element.querySelector(".curatedcta a[href], a.btn-gold[href], a.btn[href]");
    if (ctaAnchor) {
      const ctaText = ctaAnchor.textContent.trim();
      ctaAnchor.textContent = "";
      const ctaEm = document.createElement("em");
      const ctaStrong = document.createElement("strong");
      ctaStrong.textContent = ctaText;
      ctaEm.append(ctaStrong);
      ctaAnchor.append(ctaEm);
      const p = document.createElement("p");
      p.append(ctaAnchor);
      contentCell.push(p);
    }
    const cells = [];
    cells.push([desktopImg]);
    cells.push([mobileImg]);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (banner)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/sticky-nav.js
  var LABEL_TO_ANCHOR = {
    overview: "overview",
    testimonials: "testimonials",
    "find a doctor": "find-a-doctor",
    resources: "resources",
    disclaimer: "disclaimer"
  };
  function parse2(element, { document }) {
    const anchors = element.querySelectorAll("nav a.anchor, a.anchor, nav a");
    const cells = [];
    anchors.forEach((a) => {
      const label = a.textContent.trim().replace(/\s+/g, " ");
      if (!label) return;
      const anchorId = (a.getAttribute("data-linking") || "").trim() || LABEL_TO_ANCHOR[label.toLowerCase()];
      if (!anchorId) return;
      const labelCell = document.createElement("p");
      labelCell.textContent = label;
      const targetCell = document.createElement("p");
      targetCell.textContent = `#${anchorId}`;
      cells.push([[labelCell], [targetCell]]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Sticky Nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/columns.js
  var VIDEO_BY_CONTAINER = {
    // Intro — "IVS Purpose Video"
    dynamicmedia_65056368: {
      src: "https://media-assets.stryker.com/is/content/stryker/IVS%20Purpose%20Video-1-AVS.m3u8",
      poster: "https://media-assets.stryker.com/is/image/stryker/IVS%20Purpose%20Video-1-AVS"
    },
    // Janet testimonial — VCF patient testimonial
    dynamicmedia_267939408: {
      src: "https://media-assets.stryker.com/is/content/stryker/1659642804_VCF-Patient-Testimonial_Janet-Kliebert-FINAL_Resized-1-AVS.m3u8",
      poster: "https://media-assets.stryker.com/is/image/stryker/1659642804_VCF-Patient-Testimonial_Janet-Kliebert-FINAL_Resized-1-AVS"
    },
    // Lynn testimonial — mild® procedure
    dynamicmedia_66170736: {
      src: "https://media-assets.stryker.com/is/content/stryker/Martha-Lynn-mild-patient-testimonial-thumbnail.m3u8",
      poster: "https://media-assets.stryker.com/is/image/stryker/Martha-Lynn-mild-patient-testimonial-thumbnail"
    }
  };
  function videoLink(col, document) {
    const viewer = col.querySelector('[id^="dynamicmedia_"]');
    const id = viewer && viewer.id.match(/^(dynamicmedia_\d+)/);
    const entry = id && VIDEO_BY_CONTAINER[id[1]];
    if (!entry) return null;
    const href = `${entry.src}?poster=${encodeURIComponent(entry.poster)}`;
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = href;
    return a;
  }
  var HEADING_GOLD_TAILS = {
    "making every moment matter.": "matter."
  };
  function applyTwoTone(heading, document) {
    const text = heading.textContent.replace(/\s+/g, " ").trim();
    const tail = HEADING_GOLD_TAILS[text.toLowerCase()];
    if (!tail) return;
    const idx = text.toLowerCase().lastIndexOf(tail.toLowerCase());
    if (idx <= 0) return;
    const lead = text.slice(0, idx).trim();
    heading.textContent = "";
    const leadStrong = document.createElement("strong");
    leadStrong.textContent = `${lead} `;
    heading.append(leadStrong);
    const em = document.createElement("em");
    const strong = document.createElement("strong");
    strong.textContent = text.slice(idx);
    em.append(strong);
    heading.append(em);
  }
  function textCell(col, document) {
    const frag = document.createElement("div");
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (el.matches("h1, h2, h3, h4, h5, h6, p, ul, ol")) {
            if (/^H[1-6]$/.test(el.tagName)) applyTwoTone(el, document);
            frag.append(el);
          } else if (!el.matches(".standalonevideo")) {
            pick(el);
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          frag.append(child);
        }
      });
    };
    pick(col);
    return [...frag.childNodes];
  }
  function parse3(element, { document }) {
    const row = element.querySelector(".colctrl .row, .row");
    if (!row) return;
    const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
    if (cols.length < 2) return;
    const cells = cols.map((col) => {
      if (col.querySelector(".standalonevideo")) {
        const link = videoLink(col, document);
        if (link) return [link];
      }
      return textCell(col, document);
    });
    const filled = cells.filter((cell) => cell.length > 0);
    if (filled.length < 2) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Columns",
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/panel-gold.js
  function parse4(element, { document }) {
    const contentCell = [];
    const nodes = element.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p");
    nodes.forEach((n) => {
      if (n.textContent.trim()) contentCell.push(n);
    });
    if (contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Panel (gold)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/panel-gold-cta.js
  function parse5(element, { document }) {
    const contentCell = [];
    const paras = element.querySelectorAll(":scope > p, p");
    paras.forEach((p) => {
      if (p.textContent.trim()) contentCell.push(p);
    });
    if (contentCell.length === 0) {
      const headings = element.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6");
      headings.forEach((h) => {
        if (h.textContent.trim()) contentCell.push(h);
      });
    }
    if (contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Panel (gold)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/cards.js
  function parse6(element, { document }) {
    const cells = [];
    const cards = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-3"]');
    cards.forEach((card) => {
      const img = card.querySelector(".standaloneimage img, img");
      const headingLink = card.querySelector(".c-rich-text-editor a[href], .text a[href], a[href]");
      if (!img && !headingLink) return;
      const imageCell = img || "";
      const bodyCell = [];
      if (headingLink) {
        const label = headingLink.textContent.trim();
        const href = headingLink.getAttribute("href");
        const h = document.createElement("h3");
        const a = document.createElement("a");
        a.setAttribute("href", href);
        a.textContent = label;
        h.append(a);
        bodyCell.push(h);
      }
      cells.push([imageCell, bodyCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (linked)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-home/statistics.js
  var PALETTE = ["gold", "dark-gold", "teal", "navy", "sage", "purple"];
  function statCells(colctrl) {
    const row = colctrl.querySelector(".row");
    if (!row) return [];
    return [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
  }
  function parse7(element, { document }) {
    const firstCols3 = element.closest(".cols3");
    if (!firstCols3 || !firstCols3.parentElement) return;
    const grids = [...firstCols3.parentElement.children].filter((c) => c.classList && c.classList.contains("cols3"));
    if (grids[0] !== firstCols3) return;
    const cells = [];
    let idx = 0;
    grids.forEach((grid) => {
      const colctrl = grid.querySelector(".colctrl") || grid;
      statCells(colctrl).forEach((cell) => {
        const valueEl = cell.querySelector("h2, h3, .fontsize-2-5em");
        const descEl = cell.querySelector("p");
        const value = valueEl && valueEl.textContent.trim();
        if (!value && !descEl) return;
        const color = PALETTE[idx % PALETTE.length];
        idx += 1;
        const valueCell = document.createElement("p");
        valueCell.textContent = value || "";
        const descCell = descEl || document.createElement("p");
        cells.push([color, [valueCell], [descCell]]);
      });
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Statistics (cols-3)", cells });
    firstCols3.replaceWith(block);
    grids.slice(1).forEach((g) => g.remove());
  }

  // tools/importer/parsers/ivs-home/panel-cta.js
  function parse8(element, { document }) {
    const contentCell = [];
    const heading = element.querySelector(".dimensional-box h3, .c-rich-text-editor h3, h3");
    if (heading) contentCell.push(heading);
    const para = element.querySelector(".dimensional-box p, .c-rich-text-editor p, p");
    if (para) contentCell.push(para);
    const ctaLink = element.querySelector(".buttonset a[href], .button-group a[href], a.btn-gold[href]");
    if (ctaLink) {
      const ctaText = ctaLink.textContent.trim();
      ctaLink.textContent = "";
      const em = document.createElement("em");
      const strong = document.createElement("strong");
      strong.textContent = ctaText;
      em.append(strong);
      ctaLink.append(em);
      const p = document.createElement("p");
      p.append(ctaLink);
      contentCell.push(p);
    }
    if (!heading && !para) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Panel (cta, wide)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/ivs-home/ivs-home-marketo.js
  var DEFAULTS = {
    baseUrl: "//lp.stryker.com",
    munchkinId: "338-WAP-571",
    formId: "4893"
  };
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function readMarketoConfig(element) {
    const cfg = __spreadProps(__spreadValues({}, DEFAULTS), { present: false });
    const scaffold = element.querySelector(".marketoform, .c-marketo-form");
    if (!scaffold) return cfg;
    cfg.present = true;
    const form = scaffold.querySelector('form[id^="mktoForm_"]');
    const idMatch = form && form.id.match(/^mktoForm_(\d+)$/);
    if (idMatch) cfg.formId = idMatch[1];
    if (form) {
      const baseAttr = form.getAttribute("data-marketo-base-url");
      const munchkinAttr = form.getAttribute("data-marketo-munchkin-id");
      if (baseAttr) cfg.baseUrl = baseAttr;
      if (munchkinAttr) cfg.munchkinId = munchkinAttr;
    }
    const html = scaffold.innerHTML;
    if (cfg.baseUrl === DEFAULTS.baseUrl) {
      const m = html.match(/data-marketo-base-url\s*=\s*"([^"]+)"/i) || html.match(/URL:-\s*"([^"]+)"/i);
      if (m) cfg.baseUrl = m[1];
    }
    if (cfg.munchkinId === DEFAULTS.munchkinId) {
      const m = html.match(/data-marketo-munchkin-id\s*=\s*"([^"]+)"/i) || html.match(/MunchkinId:-\s*"([^"]+)"/i);
      if (m) cfg.munchkinId = m[1];
    }
    return cfg;
  }
  function transform(hookName, element, payload) {
    if (hookName !== TransformHook.beforeTransform) return;
    const doc = element.ownerDocument;
    const scaffold = element.querySelector(".marketoform");
    const cfg = readMarketoConfig(element);
    if (!cfg.present || !scaffold) return;
    const block = WebImporter.Blocks.createBlock(doc, {
      name: "Marketo Form",
      cells: {
        "Base URL": cfg.baseUrl,
        "Munchkin ID": cfg.munchkinId,
        "Form ID": cfg.formId
      }
    });
    scaffold.replaceWith(block);
  }

  // tools/importer/transformers/ivs-home/ivs-home-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
  var PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
  var isOffDomain = (ref) => /^https?:\/\//i.test(ref) && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);
  function normalizeCitationSups(root) {
    root.querySelectorAll('a[href="#disclaimer"]').forEach((a) => {
      const inSup = a.closest("sup");
      const wrapsSup = a.querySelector("sup");
      if (!inSup && !wrapsSup) return;
      if (!/\d/.test(a.textContent || "")) return;
      a.replaceWith(...a.childNodes);
    });
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      normalizeCitationSups(element);
      WebImporter.DOMUtils.remove(element, [".tabs", ".c-tabs"]);
      element.querySelectorAll(".c-navigation-bar .menu-trigger, .c-navigation-bar h3.page-title").forEach((el) => el.remove());
      WebImporter.DOMUtils.remove(element, [".jumpbarparsys", ".section-title"]);
      element.querySelectorAll(".c-full-bleed-panel.bg-gray").forEach((el) => {
        (el.closest(".fullbleedpanel") || el).remove();
      });
      WebImporter.DOMUtils.remove(element, [".localpagenavigation"]);
    }
    if (hookName === TransformHook2.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#header",
        "#c-country-switch-modal",
        "footer#footer",
        ".c-back-to-top",
        "#onetrust-consent-sdk"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".container.c-disclaimer.page-section",
        "#publishedDate"
      ]);
      WebImporter.DOMUtils.remove(element, ["#businessUnitTag", "#hiddenPublishedDate"]);
      WebImporter.DOMUtils.remove(element, ["input", "link", "noscript"]);
      element.querySelectorAll("img[src], a[href], iframe[src], iframe[data-src]").forEach((node) => {
        const ref = node.getAttribute("src") || node.getAttribute("href") || node.getAttribute("data-src") || "";
        const isPixel = node.tagName === "IMG" && !node.getAttribute("alt") && isOffDomain(ref);
        if (TRACKING_HOST_RE.test(ref) || PLACEHOLDER_RE.test(ref) || isPixel) {
          const wrapper = node.closest("p, picture, div") || node;
          wrapper.remove();
        }
      });
    }
  }

  // tools/importer/transformers/ivs-home/ivs-home-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SPACER_MARKER_ATTR = "data-excat-spacer-before";
  function hasMetadata(section) {
    return Boolean(section.style || section.anchor);
  }
  function metadataCells(section) {
    const cells = {};
    if (section.style) cells.style = section.style;
    if (section.anchor) cells.anchor = section.anchor;
    return cells;
  }
  function transform3(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        const hr = element.ownerDocument.createElement("hr");
        if (hasMetadata(section)) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        if (section.spacerBefore) hr.setAttribute(SPACER_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!hasMetadata(section)) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchorEl = marker || element.querySelector(section.selector);
        if (!anchorEl) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: "Section Metadata",
          cells: metadataCells(section)
        });
        anchorEl.after(metadataBlock);
        if (marker) marker.removeAttribute(SECTION_MARKER_ATTR);
      }
      const spacerMarkers = [...element.querySelectorAll(`[${SPACER_MARKER_ATTR}]`)];
      for (let i = spacerMarkers.length - 1; i >= 0; i -= 1) {
        const targetBreak = spacerMarkers[i];
        const doc = element.ownerDocument;
        const spacerBreak = doc.createElement("hr");
        const spacerMeta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: "spacer" }
        });
        targetBreak.before(spacerBreak, spacerMeta);
        targetBreak.removeAttribute(SPACER_MARKER_ATTR);
      }
    }
  }

  // tools/importer/transformers/ivs-home/ivs-home-dm.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform4(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-ivs-home.js
  var parsers = {
    hero: parse,
    "sticky-nav": parse2,
    columns: parse3,
    "panel-gold": parse4,
    "panel-gold-cta": parse5,
    cards: parse6,
    statistics: parse7,
    "panel-cta": parse8
  };
  var transformers = [
    transform3,
    transform,
    transform2,
    transform4
  ];
  var PAGE_TEMPLATE = {
    name: "ivs-home",
    description: `IVS patient homepage (standalone singleton, theme ivs-home). Zones: hero (banner) + Find a doctor CTA; sticky-nav anchor bar; a flex intro (text left + video right); a gold panel "There's hope ahead"; a 4-up cards (linked) pain grid; a statistics dashboard (6 metrics); a flex pair of panel (cta) spotlights; two testimonial columns (text + video) on a dark-teal band; a gold panel "Tired of living in pain?"; a marketo-form doctor finder; a compact disclaimer/references section. Resources tabs (zone 11) DEFERRED. Header/footer + Scene7 video chrome stripped on import.`,
    urls: [
      "https://patients.stryker.com/us/en/ivs/index.html"
    ],
    blocks: [
      { name: "hero", section: "hero", instances: [".fullWidthImageHero"] },
      { name: "sticky-nav", section: "anchor-nav", instances: [".c-navigation-bar .nav-wrap"] },
      { name: "columns", instances: [".cols2:has(.standalonevideo)"] },
      { name: "panel-gold", section: "hope", instances: [".c-rich-text-editor .bg-gold:has(.fontsize-1-25em)"] },
      { name: "cards", section: "pain-cards", instances: [".cols4 > .colctrl"] },
      { name: "statistics", section: "statistics", instances: [".cols3 > .colctrl"] },
      { name: "panel-cta", section: "spotlights", instances: [".cols2 > .colctrl:has(.dimensional-box) > .row > [class*='col-sm-6']"] },
      { name: "panel-gold-cta", section: "find-doctor", instances: [".c-rich-text-editor .bg-gold:has(a[href*='physicianlocator'])"] }
    ],
    sections: [
      { id: "hero", name: "Hero banner", selector: ".fullWidthImageHero", style: null, anchor: null, blocks: ["hero"], defaultContent: [] },
      { id: "anchor-nav", name: "Sticky anchor bar", selector: ".c-navigation-bar", style: null, anchor: null, blocks: ["sticky-nav"], defaultContent: [] },
      { id: "intro-video", name: "Intro: text + video", selector: ".cols2:has(.standalonevideo):not(.fullbleedpanel *)", style: "flex", anchor: "overview", blocks: ["columns"], defaultContent: [] },
      { id: "hope", name: "There's hope ahead (gold)", selector: ".text.parbase:has(.bg-gold .fontsize-1-25em)", style: null, anchor: null, blocks: ["panel-gold"], defaultContent: [] },
      { id: "pain-cards", name: "Pain-type cards", selector: ".cols4", style: null, anchor: null, blocks: ["cards"], defaultContent: [] },
      { id: "statistics", name: "Statistics dashboard", selector: ".cols3", style: "divider", anchor: null, spacerBefore: true, blocks: ["statistics"], defaultContent: [] },
      { id: "spotlights", name: "Condition/treatment spotlights", selector: ".cols2:has(.dimensional-box)", style: "flex", anchor: null, blocks: ["panel-cta"], defaultContent: [] },
      { id: "testimonials", name: "Patient testimonials (dark teal)", selector: ".fullbleedpanel:has(.bg-dark-teal-gradient)", style: "dark", anchor: "testimonials", blocks: ["columns"], defaultContent: [] },
      { id: "find-doctor", name: "Find a doctor (gold)", selector: ".text.parbase:has(.bg-gold a[href*='physicianlocator'])", style: null, anchor: "find-a-doctor", blocks: ["panel-gold-cta"], defaultContent: [] },
      { id: "marketo", name: "Doctor-finder form", selector: ".marketoform", style: null, anchor: "resources", blocks: ["marketo-form"], defaultContent: [] },
      { id: "disclaimer", name: "Disclaimer + references", selector: ".c-disclaimer.page-section:not(.container)", style: "compact", anchor: "disclaimer", blocks: [], defaultContent: [".c-disclaimer.page-section:not(.container)"] }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_ivs_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document);
      meta.theme = "ivs-home";
      meta.nav = "/us/en/ivs/nav-ivs";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_ivs_home_exports);
})();
