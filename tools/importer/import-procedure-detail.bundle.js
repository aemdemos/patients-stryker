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

  // tools/importer/import-procedure-detail.js
  var import_procedure_detail_exports = {};
  __export(import_procedure_detail_exports, {
    default: () => import_procedure_detail_default
  });

  // tools/importer/parsers/procedure-detail/hero.js
  var DESKTOP_DM_URL = "https://media-assets.stryker.com/is/image/stryker/balloon-kyphoplasty-hero_1920x640-rev1-1?$max_width_1410$";
  var MOBILE_DM_URL = "https://media-assets.stryker.com/is/image/stryker/balloon-kyphoplasty-mobile-hero_1200x680-rev-1?$max_width_720$";
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
    const visibleEl = element.querySelector(".largeheadline h1, .c-largeheadline h1");
    const pageTitleEl = element.querySelector(".hero-space h1");
    const visibleText = visibleEl && visibleEl.textContent.trim() || pageTitleEl && pageTitleEl.textContent.trim() || "Balloon kyphoplasty";
    const heading = document.createElement("h1");
    const headingEm = document.createElement("em");
    const headingStrong = document.createElement("strong");
    headingStrong.textContent = visibleText;
    headingEm.append(headingStrong);
    heading.append(headingEm);
    const ctaAnchor = element.querySelector(".curatedcta a[href], a.btn-gold[href], a.btn[href]");
    const contentCell = [heading];
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

  // tools/importer/parsers/procedure-detail/panel-cta.js
  function parse2(element, { document }) {
    const contentCell = [];
    const heading = element.querySelector(".c-rich-text-editor h3, h3");
    if (heading) contentCell.push(heading);
    const list = element.querySelector(".c-rich-text-editor ul, ul");
    if (list) contentCell.push(list);
    const risksLink = element.querySelector('a[href="#potential-risks"], a[href*="potential-risks"]');
    if (risksLink) {
      const p = document.createElement("p");
      p.append(risksLink);
      contentCell.push(p);
    }
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
    if (!heading && !list) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Panel (cta, wide)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/procedure-detail/panel-dark.js
  function parse3(element, { document }) {
    const contentCell = [];
    const heading = element.querySelector(
      ".c-rich-text-editor h1, .c-rich-text-editor h2, .c-rich-text-editor h3, h1, h2, h3"
    );
    if (heading) contentCell.push(heading);
    const paras = element.querySelectorAll(".c-rich-text-editor p, p");
    paras.forEach((p) => {
      if (p.textContent.trim()) contentCell.push(p);
    });
    if (!heading && contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Panel (dark, wide)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/procedure-detail/panel-gold.js
  function parse4(element, { document }) {
    const contentCell = [];
    const paras = element.querySelectorAll(":scope > p, p");
    paras.forEach((p) => {
      if (p.textContent.trim()) contentCell.push(p);
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

  // tools/importer/parsers/procedure-detail/cards.js
  function parse5(element, { document }) {
    const cells = [];
    const cards = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-4"]');
    cards.forEach((card) => {
      const img = card.querySelector(".standaloneimage img, img");
      const heading = card.querySelector(".c-rich-text-editor h4, h4");
      const para = card.querySelector(".c-rich-text-editor p, p");
      if (!img && !heading) return;
      const imageCell = img || "";
      const bodyCell = [];
      if (heading) bodyCell.push(heading);
      if (para) bodyCell.push(para);
      cells.push([imageCell, bodyCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/procedure-detail/cards-resources.js
  function parse6(element, { document }) {
    const cells = [];
    const cols = element.querySelectorAll(':scope > .row > [class*="col-"], .row > [class*="col-md-3"]');
    cols.forEach((col) => {
      const img = col.querySelector(".cta-img img, img");
      const learnMore = col.querySelector("a.btn[href], a.btn-teal[href]");
      if (!img && !learnMore) return;
      const imageCell = img || "";
      const bodyCell = [];
      if (learnMore) {
        const label = learnMore.textContent.trim();
        learnMore.textContent = "";
        const strong = document.createElement("strong");
        strong.textContent = label;
        learnMore.append(strong);
        const p = document.createElement("p");
        p.append(learnMore);
        bodyCell.push(p);
      }
      cells.push([imageCell, bodyCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (resources)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/procedure-detail/procedure-detail-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
  var PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
  var isOffDomain = (ref) => /^https?:\/\//i.test(ref) && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);
  function isEmptyPlaceholder(el) {
    if (el.querySelector("img, picture, a, iframe, video, h1, h2, h3, h4, h5, h6")) return false;
    return el.textContent.replace(/ /g, " ").trim() === "";
  }
  var EMPHASIS_ZONES = [".cols2 > .colctrl .row > .col-sm-6:first-child"];
  function encodeEmphasis(root) {
    const doc = root.ownerDocument;
    const wrapGold = (span) => {
      const em = doc.createElement("em");
      const strong = doc.createElement("strong");
      while (span.firstChild) strong.append(span.firstChild);
      em.append(strong);
      span.replaceWith(em);
    };
    EMPHASIS_ZONES.forEach((zoneSel) => {
      root.querySelectorAll(zoneSel).forEach((zone) => {
        zone.querySelectorAll("h1, h2, h3").forEach((heading) => {
          const seg = heading.querySelector('span[style*="ffb500" i], .futura-bold');
          if (!seg) return;
          if (seg.textContent.trim() === heading.textContent.trim()) return;
          if (seg.querySelector("strong, em")) return;
          wrapGold(seg);
        });
      });
    });
  }
  function encodeHowItWorksHeading(root) {
    const doc = root.ownerDocument;
    root.querySelectorAll(".cols3").forEach((cols3) => {
      let prev = cols3.previousElementSibling;
      while (prev && !prev.querySelector("h1, h2, h3, h4")) prev = prev.previousElementSibling;
      if (!prev) return;
      const heading = prev.querySelector("h1, h2, h3, h4");
      if (!heading) return;
      const seg = heading.querySelector(".futura-bold");
      if (!seg) return;
      if (seg.textContent.trim() !== heading.textContent.trim()) return;
      if (heading.querySelector("strong, b, em")) return;
      const strong = doc.createElement("strong");
      while (heading.firstChild) strong.append(heading.firstChild);
      heading.append(strong);
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      encodeEmphasis(element);
      encodeHowItWorksHeading(element);
      WebImporter.DOMUtils.remove(element, [
        ".marketoform",
        ".c-marketo-form",
        "#find-a-doctor",
        "#alert_4893"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".jumpbarparsys",
        ".section-title"
      ]);
      WebImporter.DOMUtils.remove(element, [".localpagenavigation"]);
      element.querySelectorAll(".sectionseparator hr, hr.section-separator").forEach((hr) => hr.remove());
      WebImporter.DOMUtils.remove(element, [".tabs-nav"]);
      element.querySelectorAll(".curatedcta").forEach((cta) => {
        if (isEmptyPlaceholder(cta)) cta.remove();
      });
      element.querySelectorAll(".cols4 .col-md-3").forEach((col) => {
        if (isEmptyPlaceholder(col)) col.remove();
      });
    }
    if (hookName === TransformHook.afterTransform) {
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
      WebImporter.DOMUtils.remove(element, [
        "#businessUnitTag",
        "#hiddenPublishedDate"
      ]);
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

  // tools/importer/transformers/procedure-detail/procedure-detail-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        const hr = element.ownerDocument.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/transformers/procedure-detail/procedure-detail-marketo.js
  var DEFAULTS = {
    baseUrl: "//lp.stryker.com",
    munchkinId: "338-WAP-571",
    formId: "4893",
    captchaScript: "https://patients.stryker.com/etc.clientlibs/stryker/components/content/altcha/altcha.js",
    captchaChallengeUrl: "https://patients.stryker.com/bin/stryker/captcha/challenge"
  };
  var STRYKER_ORIGIN = "https://patients.stryker.com";
  var STASH = "data-excat-marketo";
  function readMarketoConfig(element) {
    const cfg = __spreadValues({}, DEFAULTS);
    const scaffold = element.querySelector(".marketoform, .c-marketo-form");
    if (!scaffold) return cfg;
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
    const widget = scaffold.querySelector("altcha-widget[challengeurl]") || element.querySelector("altcha-widget[challengeurl]");
    const challenge = widget && widget.getAttribute("challengeurl");
    if (challenge) {
      cfg.captchaChallengeUrl = /^https?:\/\//i.test(challenge) ? challenge : `${STRYKER_ORIGIN}${challenge.startsWith("/") ? "" : "/"}${challenge}`;
    }
    return cfg;
  }
  var RESOURCES_SELECTOR = ".tabs";
  function transform3(hookName, element, payload) {
    const doc = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const cfg2 = readMarketoConfig(element);
      element.setAttribute(STASH, JSON.stringify(cfg2));
      return;
    }
    if (hookName !== "afterTransform") return;
    let cfg = DEFAULTS;
    const stashed = element.getAttribute(STASH);
    if (stashed) {
      try {
        cfg = JSON.parse(stashed);
      } catch (e) {
        cfg = DEFAULTS;
      }
      element.removeAttribute(STASH);
    }
    const resources = element.querySelector(RESOURCES_SELECTOR);
    if (!resources) return;
    let anchor = resources.previousElementSibling;
    if (!anchor || anchor.tagName !== "HR") anchor = resources;
    const block = WebImporter.Blocks.createBlock(doc, {
      name: "Marketo Form",
      cells: {
        "Base URL": cfg.baseUrl,
        "Munchkin ID": cfg.munchkinId,
        "Form ID": cfg.formId,
        "Captcha Script": cfg.captchaScript,
        "Captcha Challenge URL": cfg.captchaChallengeUrl
      }
    });
    const hr = doc.createElement("hr");
    anchor.before(hr, block);
  }

  // tools/importer/transformers/procedure-detail/procedure-detail-dm.js
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

  // tools/importer/import-procedure-detail.js
  var parsers = {
    hero: parse,
    "panel-cta": parse2,
    "panel-dark": parse3,
    "panel-gold": parse4,
    cards: parse5,
    "cards-resources": parse6
  };
  var transformers = [
    transform3,
    transform,
    transform2,
    transform4
  ];
  var PAGE_TEMPLATE = {
    name: "procedure-detail",
    description: 'IVS treatment/procedure detail page. Zones: hero (banner) + Find a doctor CTA; a flex section with default-content intro left + panel (cta) benefits right; a full-bleed dark panel (dark wide) evidence band; an h3 + cards "How it works"; a panel (gold) mid-page CTA; an h2 + cards (resources) brochure grid; a compact section of risks + references. Header/footer and the Marketo doctor-locator form are stripped on import.',
    urls: [
      "https://patients.stryker.com/us/en/ivs/treatments/balloon-kyphoplasty.html"
    ],
    blocks: [
      { name: "hero", section: "hero", instances: [".fullWidthImageHero"] },
      { name: "panel-cta", section: "flex", instances: [".cols2 > .colctrl .row > .col-sm-6:nth-child(2)"] },
      { name: "panel-dark", section: "dark", instances: [".fullbleedpanel .c-full-bleed-panel"] },
      { name: "cards", instances: [".cols3 > .colctrl"] },
      { name: "panel-gold", instances: [".text.parbase .c-rich-text-editor .bg-gold"] },
      { name: "cards-resources", section: "resources", instances: [".tabs .c-tabs .tabs-content .cols4 .colctrl"] }
    ],
    sections: [
      { id: "hero", name: "Hero / title", selector: ".fullWidthImageHero", style: null, blocks: ["hero"], defaultContent: [] },
      { id: "intro-benefits", name: "Intro hook + Benefits", selector: ".cols2 > .colctrl", style: "flex", blocks: ["panel-cta"], defaultContent: [".cols2 > .colctrl .row > .col-sm-6:nth-child(1)"] },
      { id: "evidence", name: "Clinical-evidence callout", selector: ".fullbleedpanel .c-full-bleed-panel", style: "dark", blocks: ["panel-dark"], defaultContent: [] },
      { id: "how-it-works", name: "How it works (3 steps)", selector: ".sectionseparator", style: null, blocks: ["cards"], defaultContent: [".cols:has(h3) .c-rich-text-editor"] },
      { id: "midpage-cta", name: "Mid-page CTA", selector: ".text.parbase .c-rich-text-editor .bg-gold", style: null, blocks: ["panel-gold"], defaultContent: [] },
      { id: "resources", name: "Resources", selector: ".tabs", style: null, blocks: ["cards-resources"], defaultContent: [".tabs .c-tabs h2.component-subheading"] },
      { id: "risks", name: "Potential risks", selector: ".text.parbase .c-rich-text-editor .bg-light-gray", style: "light-gray", blocks: [], defaultContent: [".text.parbase .c-rich-text-editor .bg-light-gray"] },
      { id: "footnotes", name: "Footnotes + references", selector: ".c-disclaimer.page-section:not(.container)", style: "compact", blocks: [], defaultContent: [".c-disclaimer.page-section:not(.container)"] }
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
  var import_procedure_detail_default = {
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
      meta.template = "procedure-detail";
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
  return __toCommonJS(import_procedure_detail_exports);
})();
