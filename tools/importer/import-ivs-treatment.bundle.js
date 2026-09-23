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

  // tools/importer/import-ivs-treatment.js
  var import_ivs_treatment_exports = {};
  __export(import_ivs_treatment_exports, {
    default: () => import_ivs_treatment_default
  });

  // tools/importer/parsers/ivs-treatment/hero.js
  function parse(element, { document }) {
    const picture = element.querySelector(".imgBoxId picture");
    const heading = element.querySelector(".largeheadline h1, h1");
    const ctaAnchor = element.querySelector(".curatedcta a[href]");
    const cells = [];
    const source = picture && picture.querySelector("source[srcset]");
    const baseImg = picture && picture.querySelector("img");
    const desktopUrl = source ? source.getAttribute("srcset") : null;
    const alt = baseImg ? baseImg.getAttribute("alt") || "" : "";
    if (desktopUrl) {
      const desktopImg = document.createElement("img");
      desktopImg.setAttribute("src", desktopUrl);
      desktopImg.setAttribute("alt", alt);
      cells.push([desktopImg]);
    }
    if (baseImg) {
      const mobileUrl = baseImg.getAttribute("src");
      if (mobileUrl && mobileUrl !== desktopUrl) {
        const mobileImg = document.createElement("img");
        mobileImg.setAttribute("src", mobileUrl);
        mobileImg.setAttribute("alt", alt);
        cells.push([mobileImg]);
      } else if (!desktopUrl) {
        cells.push([baseImg]);
      }
    }
    const contentCell = [];
    if (heading) {
      const text = heading.textContent.replace(/\s+/g, " ").trim();
      const h1 = document.createElement("h1");
      const em = document.createElement("em");
      const strong = document.createElement("strong");
      strong.textContent = text;
      em.append(strong);
      h1.append(em);
      contentCell.push(h1);
    }
    if (ctaAnchor && ctaAnchor.textContent.trim()) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.setAttribute("href", ctaAnchor.getAttribute("href"));
      a.textContent = ctaAnchor.textContent.replace(/\s+/g, " ").trim();
      strong.append(a);
      em.append(strong);
      p.append(em);
      contentCell.push(p);
    }
    if (contentCell.length) cells.push([contentCell]);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "hero",
      variants: ["banner"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/panel.js
  function parse2(element, { document }) {
    const box = element.querySelector(".dimensional-box");
    if (!box) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = [];
    const heading = box.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.append(...heading.childNodes);
      cell.push(h);
    }
    const list = box.querySelector("ul, ol");
    if (list) cell.push(list);
    const risksP = Array.from(box.querySelectorAll(":scope > p")).find((p) => {
      const a = p.querySelector("a[href]");
      return a && /potential risks/i.test(a.textContent);
    });
    if (risksP) cell.push(risksP);
    const talk = Array.from(element.querySelectorAll("a[href]")).find((a) => !box.contains(a) && a.textContent.trim());
    if (talk) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.setAttribute("href", talk.getAttribute("href"));
      a.textContent = talk.textContent.replace(/\s+/g, " ").trim();
      strong.append(a);
      em.append(strong);
      p.append(em);
      cell.push(p);
    }
    if (!cell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "panel",
      variants: ["cta", "wide"],
      cells: [[cell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/panel-cta.js
  function parse3(element, { document }) {
    const anchor = element.querySelector("a[href]");
    const cell = [];
    const p = document.createElement("p");
    const linkText = anchor ? anchor.textContent.replace(/\s+/g, " ").trim() : "";
    let promptText = element.textContent.replace(/\s+/g, " ").trim();
    if (linkText) promptText = promptText.replace(linkText, "").trim();
    if (promptText) {
      p.append(document.createTextNode(promptText));
      p.append(document.createElement("br"));
    }
    if (anchor) {
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.setAttribute("href", anchor.getAttribute("href"));
      a.textContent = linkText;
      strong.append(a);
      p.append(strong);
    }
    if (!p.childNodes.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cell.push(p);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "panel",
      variants: ["gold"],
      cells: [[cell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/columns-50-50.js
  function parse4(element, { document }) {
    const row = element.querySelector(".colctrl .row") || element.querySelector(".row");
    const columns = row ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className)) : [];
    const cells = [];
    columns.forEach((col) => {
      const cellNodes = [];
      col.querySelectorAll(".text.parbase, .c-rich-text-editor").forEach((rte) => {
        if (rte.querySelector(".c-rich-text-editor")) return;
        Array.from(rte.children).forEach((wrapper) => {
          Array.from(wrapper.children).forEach((node) => {
            if (!node.textContent.replace(/ /g, " ").trim() && !(node.querySelector && node.querySelector("img, picture"))) return;
            cellNodes.push(node);
          });
        });
      });
      const img = col.querySelector(".standaloneimage img, img");
      if (img && !cellNodes.includes(img)) cellNodes.push(img);
      if (cellNodes.length) cells.push(cellNodes);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns",
      variants: ["columns-50-50"],
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/columns.js
  function isEmptyNode(node) {
    if (node.querySelector && node.querySelector("img, picture")) return false;
    return !node.textContent.replace(/ /g, " ").trim();
  }
  function parse5(element, { document }) {
    const row = element.querySelector(".colctrl .row") || element.querySelector(".row");
    const columns = row ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className)) : [];
    const cells = [];
    columns.forEach((col) => {
      const cellNodes = [];
      const img = col.querySelector(".standaloneimage img, img");
      if (img) cellNodes.push(img);
      col.querySelectorAll(".text.parbase, .c-rich-text-editor").forEach((rte) => {
        if (rte.querySelector(".c-rich-text-editor")) return;
        Array.from(rte.children).forEach((wrapper) => {
          Array.from(wrapper.children).forEach((node) => {
            if (isEmptyNode(node)) return;
            cellNodes.push(node);
          });
        });
      });
      if (cellNodes.length) cells.push(cellNodes);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns",
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/cards-brochure.js
  function parse6(element, { document }) {
    const row = element.querySelector(".colctrl .row") || element.querySelector(".row");
    const columns = row ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className)) : [];
    const cells = [];
    columns.forEach((col) => {
      const img = col.querySelector(".cta-img img, img");
      if (!img) return;
      const learnMore = Array.from(col.querySelectorAll("a[href]")).find((a) => !a.querySelector("img") && a.textContent.trim());
      const imageCell = document.createElement("div");
      imageCell.append(img);
      const bodyCell = document.createElement("div");
      if (learnMore) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.setAttribute("href", learnMore.getAttribute("href"));
        a.textContent = learnMore.textContent.replace(/\s+/g, " ").trim();
        strong.append(a);
        p.append(strong);
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
      variants: ["resources"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ivs-treatment/marketo-form.js
  var CONFIG_ROWS = [
    ["Base URL", "//lp.stryker.com"],
    ["Munchkin ID", "338-WAP-571"],
    ["Form ID", "4893"],
    ["Captcha Script", "https://patients.stryker.com/etc.clientlibs/stryker/components/content/altcha/altcha.js"],
    ["Captcha Challenge URL", "https://patients.stryker.com/bin/stryker/captcha/challenge"]
  ];
  function parse7(element, { document }) {
    const cells = CONFIG_ROWS.map(([key, value]) => {
      const k = document.createElement("div");
      k.textContent = key;
      const v = document.createElement("div");
      v.textContent = value;
      return [k, v];
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "marketo-form",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && payload.template.name === "ivs-treatment");
    const isSkinnedContent = isSaResources || isIvsTreatment;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          heading.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text = span.textContent.replace(/ /g, " ").trim();
            if (!text) return;
            const em = element.ownerDocument.createElement("em");
            const strong = element.ownerDocument.createElement("strong");
            while (span.firstChild) strong.appendChild(span.firstChild);
            em.appendChild(strong);
            span.replaceWith(em);
          });
        });
        return;
      }
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
      if (isSkinnedContent) {
        WebImporter.DOMUtils.remove(element, ["#publishedDate", ".container.c-disclaimer.page-section"]);
        if (isIvsTreatment) {
          element.querySelectorAll('a[href="#disclaimer"]').forEach((a) => {
            const sup = a.querySelector("sup");
            if (sup) a.replaceWith(sup);
            else a.replaceWith(...a.childNodes);
          });
          const hiw = [...element.querySelectorAll("h3")].find((h) => h.textContent.replace(/ /g, " ").trim() === "How it works" && !h.querySelector("strong, b"));
          if (hiw) {
            const strong = element.ownerDocument.createElement("strong");
            while (hiw.firstChild) strong.appendChild(hiw.firstChild);
            hiw.appendChild(strong);
          }
        }
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
      if (isSkinnedContent) return;
      element.querySelectorAll("h1").forEach((h1) => {
        const h2 = element.ownerDocument.createElement("h2");
        [...h1.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
        while (h1.firstChild) h2.appendChild(h1.firstChild);
        h1.replaceWith(h2);
      });
    }
  }

  // tools/importer/transformers/ivs-treatment/sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function styleToCell(style) {
    return String(style).split(",").map((s) => s.trim()).filter(Boolean).join(", ");
  }
  function transform2(hookName, element, payload) {
    if (!payload || !payload.template || payload.template.name !== "ivs-treatment") return;
    const sections = payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [".sectionseparator"]);
      const claimed = /* @__PURE__ */ new Set();
      sections.forEach((section) => {
        section._anchor = null;
        const candidates = String(section.selector).split(",").map((s) => s.trim()).filter(Boolean);
        for (const sel of candidates) {
          let matched = false;
          const matches = element.querySelectorAll(sel);
          for (const m of matches) {
            if (!claimed.has(m)) {
              claimed.add(m);
              section._anchor = m;
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      });
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const anchor = section._anchor;
        if (!anchor) continue;
        const hr = element.ownerDocument.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        anchor.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      if (payload.template.topSpacer) {
        const doc = element.ownerDocument;
        const hr = doc.createElement("hr");
        const spacerMeta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: "spacer, large" }
        });
        element.prepend(hr);
        element.prepend(spacerMeta);
      }
      if (payload.template.heroBottomSpacer && sections.length > 1) {
        const doc = element.ownerDocument;
        const after = sections[1];
        let nextBreak = after.style ? element.querySelector(`[${SECTION_MARKER_ATTR}="${after.id}"]`) : null;
        if (!nextBreak) {
          const candidates = String(after.selector).split(",").map((s) => s.trim()).filter(Boolean);
          for (const sel of candidates) {
            nextBreak = element.querySelector(sel);
            if (nextBreak) break;
          }
        }
        if (nextBreak) {
          const spacerMeta = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: "spacer, large" }
          });
          const hr = doc.createElement("hr");
          nextBreak.before(spacerMeta);
          spacerMeta.before(hr);
        }
      }
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const candidates = String(section.selector).split(",").map((s) => s.trim()).filter(Boolean);
        let fallback = null;
        for (const sel of candidates) {
          fallback = element.querySelector(sel);
          if (fallback) break;
        }
        const anchor = marker || fallback;
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

  // tools/importer/transformers/patients-stryker-dm-images.js
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

  // tools/importer/import-ivs-treatment.js
  var parsers = {
    hero: parse,
    panel: parse2,
    "panel-cta": parse3,
    "columns-50-50": parse4,
    columns: parse5,
    "cards-brochure": parse6,
    "marketo-form": parse7
  };
  var transformers = [
    transform,
    transform2,
    transform3
  ];
  var PAGE_TEMPLATE = {
    name: "ivs-treatment",
    description: "Interventional Spine (IVS) treatment page (mild\xAE procedure).",
    // Prepend one empty spacer section (Style `spacer, large`, ~60px) above the
    // hero to match the source's ~60px top offset. Uses the .section.spacer.large
    // variant in styles.css — a single empty section, no theme.
    topSpacer: true,
    // Add the same `spacer, large` empty section BELOW the hero (between the hero
    // and the first content section) to match the reference spacing under the hero.
    heroBottomSpacer: true,
    urls: [
      "https://patients.stryker.com/us/en/ivs/treatments/mild.html"
    ],
    blocks: [
      { name: "hero", instances: [".pDiv.bg-shadow"], section: "banner" },
      { name: "panel", instances: [".col-xs-12.col-sm-6:has(.dimensional-box)"], section: "cta wide" },
      { name: "panel-cta", instances: [".has-background.bg-gold"], section: "gold" },
      { name: "columns-50-50", instances: [".c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h3):not(:has(h4))"] },
      {
        name: "columns",
        instances: [
          ".cols2:has(.standaloneimage):not(.c-full-bleed-panel .cols2)",
          ".c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h4)",
          ".cols3"
        ]
      },
      { name: "cards-brochure", instances: [".cols4"], section: "resources" },
      { name: "marketo-form", instances: [".marketoform"] }
    ],
    sections: [
      { id: "hero", name: "Hero banner", selector: ".pDiv.bg-shadow", style: null, blocks: ["hero"], defaultContent: [] },
      {
        id: "get-back-benefits",
        name: "Get back on your feet + Benefits panel (side-by-side)",
        selector: ".cols2:has(.dimensional-box)",
        style: "flex",
        blocks: ["panel"],
        defaultContent: [".cols2:has(.dimensional-box) .col-xs-12.col-sm-6:not(:has(.dimensional-box)) .c-rich-text-editor"]
      },
      {
        id: "what-is-lss",
        name: "What is LSS? (dark)",
        selector: ".c-full-bleed-panel.bg-dark-teal-gradient:not(:has(h4))",
        style: "dark, full-bleed",
        blocks: ["columns-50-50"],
        defaultContent: []
      },
      {
        id: "proven-results",
        name: "A procedure with proven results",
        selector: ".text.parbase:has(h3):has(+ .cols2)",
        style: null,
        blocks: ["columns"],
        defaultContent: [".text.parbase:has(h3):has(+ .cols2) .c-rich-text-editor"]
      },
      {
        id: "before-after",
        name: "Before / After comparison (dark)",
        selector: ".c-full-bleed-panel.bg-dark-teal-gradient:has(h4)",
        style: "dark, full-bleed",
        blocks: ["columns"],
        defaultContent: []
      },
      {
        id: "how-it-works",
        name: "How it works (3-up text columns)",
        selector: ".text.parbase:has(h3):has(+ .cols3)",
        style: null,
        blocks: ["columns"],
        defaultContent: [".text.parbase:has(h3):has(+ .cols3) .c-rich-text-editor"]
      },
      {
        id: "tired-of-pain",
        name: "Tired of living in pain? (CTA panel)",
        selector: ".has-background.bg-gold",
        style: null,
        blocks: ["panel-cta"],
        defaultContent: []
      },
      {
        id: "contact-form",
        name: "Physician contact form",
        selector: ".marketoform",
        style: null,
        blocks: ["marketo-form"],
        defaultContent: []
      },
      {
        id: "resources",
        name: "Resources",
        selector: ".c-tabs",
        style: null,
        blocks: ["cards-brochure"],
        defaultContent: ["h2.component-subheading"]
      },
      {
        id: "potential-risks",
        name: "Potential risks of the procedure",
        selector: ".has-background.bg-lighter-gray",
        style: "light-gray",
        blocks: [],
        defaultContent: [".has-background.bg-lighter-gray"]
      },
      {
        id: "disclaimer",
        name: "Disclaimer + footnotes",
        selector: ".c-disclaimer",
        style: "compact",
        blocks: [],
        defaultContent: [".c-disclaimer"]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
  var import_ivs_treatment_default = {
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
      meta.theme = "ivs-treatment";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
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
  return __toCommonJS(import_ivs_treatment_exports);
})();
