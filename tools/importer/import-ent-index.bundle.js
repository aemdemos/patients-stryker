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

  // tools/importer/import-ent-index.js
  var import_ent_index_exports = {};
  __export(import_ent_index_exports, {
    default: () => import_ent_index_default
  });

  // tools/importer/parsers/ent-hero.js
  function parse(element, { document }) {
    const row = element.querySelector(".c-page-hero-content .row, .row");
    if (!row) return;
    const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
    const filled = cols.filter((c) => c.textContent.trim() || c.querySelector("picture, img"));
    if (filled.length < 2) return;
    const cells = cols.map((col) => {
      const frag = document.createElement("div");
      const pick = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 1) {
            const el = child;
            if (el.matches("picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol")) {
              frag.append(el);
            } else {
              pick(el);
            }
          } else if (child.nodeType === 3 && child.textContent.trim()) {
            frag.append(child);
          }
        });
      };
      pick(col);
      return [...frag.childNodes];
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Columns",
      variants: ["columns-50-50"],
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/ent-condition.js
  function parse2(element, { document }) {
    const row = element.querySelector(".colctrl .row, .row");
    if (!row) return;
    const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
    if (cols.length < 2) return;
    const textCol = cols.find((c) => c.querySelector("h1, h2, h3, h4")) || cols[1];
    const imageCol = cols.find((c) => c !== textCol) || cols[0];
    const imageFirst = cols.indexOf(imageCol) < cols.indexOf(textCol);
    const blueBox = textCol.querySelector(".bg-blue");
    const statNodes = [];
    if (blueBox) {
      const numberFrag = document.createDocumentFragment();
      const labelFrag = document.createDocumentFragment();
      let afterBreak = false;
      const collect = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 3) {
            const t = child.textContent.replace(/ /g, " ");
            if (t.trim()) (afterBreak ? labelFrag : numberFrag).append(document.createTextNode(t));
          } else if (child.nodeType === 1) {
            if (child.tagName === "BR") {
              afterBreak = true;
              return;
            }
            if (child.tagName === "SUP") {
              (afterBreak ? labelFrag : numberFrag).append(child.cloneNode(true));
            } else {
              collect(child);
            }
          }
        });
      };
      collect(blueBox);
      const trimFrag = (frag) => {
        const p = document.createElement("p");
        p.append(frag);
        p.innerHTML = p.innerHTML.replace(/\s+/g, " ").trim();
        return p;
      };
      const numberText = numberFrag.textContent.trim();
      if (numberText) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const code = document.createElement("code");
        const holder = trimFrag(numberFrag);
        while (holder.firstChild) code.append(holder.firstChild);
        strong.append(code);
        p.append(strong);
        statNodes.push(p);
      }
      const labelText = labelFrag.textContent.trim();
      if (labelText) {
        const p = document.createElement("p");
        const code = document.createElement("code");
        const holder = trimFrag(labelFrag);
        while (holder.firstChild) code.append(holder.firstChild);
        p.append(code);
        statNodes.push(p);
      }
    }
    const collectTextCell = () => {
      const frag = document.createElement("div");
      let statInserted = false;
      const pick = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 1) {
            const el = child;
            if (blueBox && el === blueBox) {
              statNodes.forEach((n) => frag.append(n));
              statInserted = true;
              return;
            }
            if (blueBox && blueBox.contains(el)) return;
            if (el.matches("picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol")) {
              frag.append(el);
            } else {
              pick(el);
            }
          } else if (child.nodeType === 3 && child.textContent.trim()) {
            frag.append(child);
          }
        });
      };
      pick(textCol);
      if (!statInserted) statNodes.forEach((n) => frag.append(n));
      return [...frag.childNodes];
    };
    const collectImageCell = () => {
      const frag = document.createElement("div");
      const pick = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 1) {
            const el = child;
            if (el.matches("picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol")) frag.append(el);
            else pick(el);
          } else if (child.nodeType === 3 && child.textContent.trim()) {
            frag.append(child);
          }
        });
      };
      pick(imageCol);
      return [...frag.childNodes];
    };
    const textCell = collectTextCell();
    const imageCell = collectImageCell();
    const cells = imageFirst ? [imageCell, textCell] : [textCell, imageCell];
    const columnsBlock = WebImporter.Blocks.createBlock(document, {
      name: "Columns",
      variants: ["columns-50-50"],
      cells: [cells]
    });
    const fragment = document.createDocumentFragment();
    fragment.append(columnsBlock);
    const meta = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [["Style", "compact"]]
    });
    fragment.append(meta);
    element.replaceWith(fragment);
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      WebImporter.DOMUtils.remove(element, [
        ".s7container",
        ".s7videoplayer",
        '[id*="s7" i]',
        '[class*="s7videoviewer" i]'
      ]);
      element.querySelectorAll('img[src*="s7viewers" i], img[src*="s7sdk" i]').forEach((img) => {
        const wrapper = img.closest("p, picture, div") || img;
        wrapper.remove();
      });
      const presetSize = (url) => {
        const m = /\$([^$]+)\$/.exec(url || "");
        if (!m) return -1;
        const nums = m[1].match(/\d+/g);
        return nums ? Math.max(...nums.map(Number)) : 0;
      };
      element.querySelectorAll("picture").forEach((picture) => {
        const img = picture.querySelector('img[src*="/is/image/" i]');
        if (!img) return;
        let best = img.getAttribute("src");
        picture.querySelectorAll("source[srcset]").forEach((source) => {
          const cand = source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
          if (/\/is\/image\//i.test(cand) && presetSize(cand) > presetSize(best)) best = cand;
        });
        if (best && best !== img.getAttribute("src")) img.setAttribute("src", best);
      });
      const GOLD = '[style*="ffb500" i], [style*="255,181,0" i], [style*="255, 181, 0" i]';
      [...element.querySelectorAll(GOLD)].forEach((node) => {
        if (!node.isConnected) return;
        const overridden = node.querySelector('[style*="#000" i], [style*="rgb(0" i], [style*="black" i]');
        if (overridden) return;
        if (!node.textContent.replace(/ /g, " ").trim()) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        while (node.firstChild) em.appendChild(node.firstChild);
        strong.appendChild(em);
        em.querySelectorAll("b, strong").forEach((inner) => {
          inner.replaceWith(...inner.childNodes);
        });
        if (/^H[1-6]$/.test(node.tagName)) {
          node.appendChild(strong);
          return;
        }
        let target = node;
        let parent = node.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.childNodes.length === 1) {
          target = parent;
          parent = parent.parentElement;
        }
        target.replaceWith(strong);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#header",
        "footer#footer",
        ".c-back-to-top"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#publishedDate"
      ]);
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
    }
  }

  // tools/importer/transformers/ent-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const doc = element.ownerDocument;
    const root = element;
    const testimonialsH2 = [...root.querySelectorAll("h1, h2, h3")].find((h) => h.textContent.trim().toLowerCase() === "testimonials");
    if (testimonialsH2) {
      let sib = testimonialsH2.nextElementSibling;
      const toRemove = [testimonialsH2];
      while (sib && !/^H[1-6]$/.test(sib.tagName) && sib.tagName !== "HR") {
        if (sib.querySelector && sib.querySelector('a[href*="risk-and-safety" i]')) break;
        toRemove.push(sib);
        sib = sib.nextElementSibling;
      }
      toRemove.forEach((n) => n.remove());
    }
    [...root.querySelectorAll("p")].forEach((p) => {
      const t = p.textContent.trim();
      if (/^Clark Darrah, a Stryker employee/i.test(t) || /\bThis testimonial reflects our mission\b/i.test(t)) {
        p.remove();
      }
    });
    WebImporter.DOMUtils.remove(root, ["iframe", "video", "[data-video]", ".video, .c-video"]);
    const insertBreakBefore = (node) => {
      let anchor = node;
      let n = node;
      while (n && n !== root) {
        if (n.tagName === "TABLE") anchor = n;
        n = n.parentElement;
      }
      if (!anchor.parentElement) return;
      if (anchor.previousElementSibling && anchor.previousElementSibling.tagName === "HR") return;
      anchor.parentElement.insertBefore(doc.createElement("hr"), anchor);
    };
    const blockTables = [...root.querySelectorAll("table")];
    const tableName = (t) => t.querySelector("tr") ? t.querySelector("tr").textContent.trim().toLowerCase() : "";
    const entHeading = [...root.querySelectorAll("h1, h2, h3")].find((h) => h.textContent.trim().toLowerCase() === "ent patient conditions");
    if (entHeading) insertBreakBefore(entHeading);
    blockTables.forEach((t) => {
      if (!/^columns \(columns-50-50\)/.test(tableName(t))) return;
      let sib = t.nextElementSibling;
      while (sib && sib.tagName !== "TABLE") sib = sib.nextElementSibling;
      if (sib && /^section metadata/.test(tableName(sib))) insertBreakBefore(t);
    });
    const riskLink = [...root.querySelectorAll('a[href*="risk-and-safety" i]')][0];
    if (riskLink) insertBreakBefore(riskLink.closest("p") || riskLink);
    const refs = [...root.querySelectorAll("p")].find((p) => {
      const t = p.textContent.trim();
      return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
    });
    if (refs) insertBreakBefore(refs);
  }

  // tools/importer/import-ent-index.js
  var parsers = {
    "ent-hero": parse,
    "ent-condition": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "ent-index",
    description: "ENT homepage: page-hero intro (columns 50-50), a repeating condition pattern (columns 50-50 + blue panel stat box + learn-more link per condition, compact sections), a testimonials section (excluded), and a references/disclaimer list.",
    urls: [
      "https://patients.stryker.com/us/en/ent/index.html"
    ],
    blocks: [
      { name: "ent-hero", instances: [".c-page-hero"] },
      { name: "ent-condition", instances: ["div.cols2:has(.bg-blue)"] }
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
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_ent_index_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name
        }
      }];
    }
  };
  return __toCommonJS(import_ent_index_exports);
})();
