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

  // import-sa-resources-body-fragment.js
  var import_sa_resources_body_fragment_exports = {};
  __export(import_sa_resources_body_fragment_exports, {
    default: () => import_sa_resources_body_fragment_default
  });

  // parsers/sa-resources/hero.js
  function parse(element, { document }) {
    const desktopImg = element.querySelector(
      ".experienceFragment-ef .standaloneimage img, .experienceFragment-ef img"
    );
    const mobileImg = element.querySelector(
      ".experienceFragment-ef-mobile .standaloneimage img, .experienceFragment-ef-mobile img"
    );
    const heading = element.querySelector(".largeheadline h1, .overlayparsys h1, h1");
    if (heading && !heading.querySelector("em, strong")) {
      const text = heading.textContent.replace(/\s+/g, " ").trim();
      const em = document.createElement("em");
      const strong = document.createElement("strong");
      strong.textContent = text;
      em.append(strong);
      heading.replaceChildren(em);
    }
    const copyLines = Array.from(
      element.querySelectorAll(".largeheadline p, .overlayparsys p")
    ).filter((p) => p.textContent.trim());
    const cells = [];
    if (desktopImg) cells.push([desktopImg]);
    if (mobileImg && mobileImg !== desktopImg) cells.push([mobileImg]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...copyLines);
    if (contentCell.length) cells.push([contentCell]);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "hero",
      variants: ["band"],
      cells
    });
    element.replaceWith(block);
  }

  // parsers/sa-resources/panel.js
  function parse2(element, { document }) {
    const paragraphs = Array.from(element.querySelectorAll(":scope > p")).filter((p) => p.textContent.trim());
    const contentEls = paragraphs.length ? paragraphs : Array.from(element.querySelectorAll("p")).filter((p) => p.textContent.trim());
    if (!contentEls.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([contentEls]);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "panel",
      variants: ["light"],
      cells
    });
    element.replaceWith(block);
  }

  // parsers/sa-resources/cards-brochure.js
  function parse3(element, { document }) {
    const imageBlocks = Array.from(element.querySelectorAll(".standaloneimage"));
    const cells = [];
    imageBlocks.forEach((imgBlock) => {
      const img = imgBlock.querySelector("img");
      if (!img) return;
      const card = imgBlock.closest('[class*="col-"]') || imgBlock;
      const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
      const links = Array.from(card.querySelectorAll("a")).filter((a) => !a.querySelector("img") && a.textContent.trim());
      const imageCell = document.createElement("div");
      imageCell.append(img);
      const bodyCell = document.createElement("div");
      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.append(...heading.childNodes);
        bodyCell.append(h);
      }
      if (links.length) {
        const p = document.createElement("p");
        links.forEach((a, i) => {
          if (i > 0) p.append(document.createTextNode(" | "));
          p.append(a);
        });
        bodyCell.append(p);
      }
      cells.push([imageCell, bodyCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards",
      variants: ["brochure"],
      cells
    });
    element.replaceWith(block);
  }

  // parsers/sa-resources/columns-related-links.js
  function parse4(element, { document }) {
    const columns = Array.from(element.querySelectorAll(".col-xs-12.col-sm-6.col-md-4"));
    if (!columns.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rowCells = columns.map((col) => {
      const cell = document.createElement("div");
      const paras = Array.from(col.querySelectorAll("p"));
      let prevWasBody = false;
      paras.forEach((p) => {
        const text = p.textContent.replace(/ /g, " ").trim();
        const hasLink = !!p.querySelector("a");
        if (!text && !hasLink) return;
        const label = p.querySelector(".futura-bold");
        if (label && !hasLink) {
          const h3 = document.createElement("h3");
          h3.textContent = label.textContent.replace(/ /g, " ").trim();
          cell.append(h3);
          prevWasBody = false;
          return;
        }
        const out = document.createElement("p");
        if (hasLink) {
          const isCta = prevWasBody;
          Array.from(p.querySelectorAll("a")).forEach((a, i) => {
            if (i > 0) out.append(document.createElement("br"));
            const clean = document.createElement("a");
            clean.setAttribute("href", a.getAttribute("href"));
            const linkText = a.textContent.replace(/ /g, " ").trim();
            clean.textContent = isCta ? linkText.toUpperCase() : linkText;
            out.append(clean);
          });
          prevWasBody = false;
        } else {
          out.textContent = text;
          prevWasBody = true;
        }
        cell.append(out);
      });
      return cell;
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns",
      // `related-links` is a reusable columns variant (blocks/columns/columns.css):
      // gold Futura labels + "Learn more" chevron CTA. The fragment keeps its styling
      // on this variant so it renders identically wherever it is reused, independent
      // of any page template.
      variants: ["related-links"],
      cells: [rowCells]
    });
    element.replaceWith(block);
  }

  // transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isSaResources) {
        element.querySelectorAll("a.btn-gold").forEach((a) => {
          if (a.closest("em") && a.closest("strong")) return;
          a.removeAttribute("class");
          const strong = element.ownerDocument.createElement("strong");
          const em = element.ownerDocument.createElement("em");
          a.replaceWith(strong);
          strong.appendChild(em);
          em.appendChild(a);
        });
        return;
      }
      element.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
        const text = span.textContent.replace(/ /g, " ").trim();
        if (!text) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text) {
          target = parent;
          parent = parent.parentElement;
        }
        let next = target.nextSibling;
        while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
        const alreadyHasBr = next && next.nodeType === 1 && next.tagName === "BR";
        if (alreadyHasBr) {
          target.replaceWith(strong);
        } else {
          target.replaceWith(strong, element.ownerDocument.createElement("br"));
        }
      });
      [...element.querySelectorAll("p")].forEach((p) => {
        const kids = [...p.childNodes].filter((n) => {
          if (n.nodeType === 3) return n.textContent.trim() !== "";
          if (n.nodeType === 1 && n.tagName === "BR") return false;
          return n.nodeType === 1;
        });
        if (kids.length !== 1) return;
        const only = kids[0];
        const isLabel = only.nodeType === 1 && (only.tagName === "B" || only.tagName === "STRONG" || only.classList && only.classList.contains("futura-bold"));
        if (!isLabel) return;
        const nextP = p.nextElementSibling;
        if (!nextP || nextP.tagName !== "P") return;
        nextP.insertBefore(element.ownerDocument.createElement("br"), nextP.firstChild);
        nextP.insertBefore(only, nextP.firstChild);
        p.remove();
      });
      element.querySelectorAll(".standalone-link a").forEach((a) => {
        if (a.querySelector("strong")) return;
        const strong = element.ownerDocument.createElement("strong");
        while (a.firstChild) strong.appendChild(a.firstChild);
        a.appendChild(strong);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#header",
        "footer#footer",
        ".c-back-to-top"
      ]);
      if (isSaResources) {
        WebImporter.DOMUtils.remove(element, ["#publishedDate"]);
      } else {
        WebImporter.DOMUtils.remove(element, [
          ".c-disclaimer",
          "#publishedDate"
        ]);
      }
      WebImporter.DOMUtils.remove(element, [
        "#businessUnitTag",
        "#hiddenPublishedDate"
      ]);
      WebImporter.DOMUtils.remove(element, ["input", "link", "noscript"]);
      const TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
      const PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
      const isOffDomain = (ref) => /^https?:\/\//i.test(ref) && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);
      element.querySelectorAll("img[src], a[href], iframe[src], iframe[data-src]").forEach((node) => {
        const ref = node.getAttribute("src") || node.getAttribute("href") || node.getAttribute("data-src") || "";
        const isPixel = node.tagName === "IMG" && !node.getAttribute("alt") && isOffDomain(ref);
        if (TRACKING_HOST_RE.test(ref) || PLACEHOLDER_RE.test(ref) || isPixel) {
          const wrapper = node.closest("p, picture, div") || node;
          wrapper.remove();
        }
      });
      element.querySelectorAll("p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture, a")) p.remove();
      });
      if (isSaResources) return;
      element.querySelectorAll("h1").forEach((h1) => {
        const h2 = element.ownerDocument.createElement("h2");
        [...h1.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
        while (h1.firstChild) h2.appendChild(h1.firstChild);
        h1.replaceWith(h2);
      });
    }
  }

  // transformers/sa-resources/sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function styleToCell(style) {
    return String(style).trim().split(/\s+/).join(", ");
  }
  function transform2(hookName, element, payload) {
    if (!payload || !payload.template || payload.template.name !== "sa-resources") return;
    const sections = payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [".sectionseparator"]);
      const claimed = /* @__PURE__ */ new Set();
      sections.forEach((section) => {
        section._anchor = null;
        const matches = element.querySelectorAll(section.selector);
        for (const m of matches) {
          if (!claimed.has(m)) {
            claimed.add(m);
            section._anchor = m;
            break;
          }
        }
      });
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        let anchor = section._anchor;
        if (!anchor) continue;
        if (section.id === "social") {
          let prev = anchor.previousElementSibling;
          let headingBlock = null;
          while (prev && prev.matches(".text.parbase")) {
            if (prev.querySelector("h1, h2, h3, h4, h5, h6")) {
              headingBlock = prev;
              break;
            }
            prev = prev.previousElementSibling;
          }
          if (headingBlock) anchor = headingBlock;
        }
        const hr = element.ownerDocument.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        anchor.before(hr);
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
          cells: { style: styleToCell(section.style) }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // transformers/patients-stryker-dm-images.js
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
  function transform3(hookName, element, payload) {
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

  // import-sa-resources-body-fragment.js
  var parsers = {
    hero: parse,
    panel: parse2,
    "cards-brochure": parse3,
    "related-links": parse4
  };
  var transformers = [
    transform,
    transform2,
    transform3
  ];
  var FRAGMENT = {
    name: "sa-resources",
    // where the fragment document is written (DA path, no .html)
    path: "/fragments/sa-resources-body",
    urls: [
      "https://patients.stryker.com/ww/en/stroke-awareness/resources.html"
    ],
    blocks: [
      {
        name: "hero",
        instances: [".carouselslidegroup"]
      },
      {
        name: "panel",
        instances: [".dimensional-box"],
        section: "light"
      },
      {
        name: "cards-brochure",
        instances: [".cols4"],
        section: "brochure"
      },
      {
        name: "related-links",
        instances: [".bg-light-gray .cols3"]
      }
    ],
    // Same sections as the sa-resources template, WITHOUT the disclaimer (kept
    // per-page). The section transformer keys off this list.
    sections: [
      {
        id: "hero",
        name: "Hero",
        selector: ".carouselslidegroup",
        style: null,
        blocks: ["hero"],
        defaultContent: []
      },
      {
        id: "intro",
        name: "Intro (welcome + availability panel)",
        selector: ".cols2 .colctrl",
        style: "flex",
        blocks: ["panel"],
        defaultContent: [".col-sm-6:nth-child(1) .c-rich-text-editor", ".curatedcta a"]
      },
      {
        id: "downloads",
        name: "Downloads (4-up)",
        selector: ".cols4",
        style: "divider",
        blocks: ["cards-brochure"],
        defaultContent: []
      },
      {
        id: "social",
        name: "Social media",
        selector: ".cols4",
        style: "divider",
        blocks: ["cards-brochure"],
        defaultContent: ["h2"]
      },
      {
        id: "related-links",
        name: "Related links",
        selector: ".bg-light-gray .cols3",
        style: "light-gray",
        blocks: ["related-links"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: FRAGMENT });
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
    const claimed = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (claimed.has(element)) return;
          claimed.add(element);
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
  var import_sa_resources_body_fragment_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      WebImporter.DOMUtils.remove(main, [".c-disclaimer"]);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, FRAGMENT);
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
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      return [{
        element: main,
        path: FRAGMENT.path,
        report: {
          title: "Stroke Awareness Resources body (fragment)",
          template: FRAGMENT.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_sa_resources_body_fragment_exports);
})();
