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

  // tools/importer/import-etd.js
  var import_etd_exports = {};
  __export(import_etd_exports, {
    default: () => import_etd_default
  });

  // tools/importer/parsers/columns.js
  function parse(element, { document }) {
    const row = element.querySelector(".colctrl .row, .row");
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
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse2(element, { document }) {
    const group = element.matches(".panel-group") ? element : element.querySelector(".panel-group");
    if (!group) return;
    const rows = [];
    group.querySelectorAll(":scope > .panel, :scope > .panel-default").forEach((panel) => {
      const titleEl = panel.querySelector(".panel-title a, .panel-title");
      const body = panel.querySelector(".panel-body");
      if (!titleEl || !body) return;
      const title = document.createElement("p");
      title.textContent = titleEl.textContent.trim();
      const content = document.createElement("div");
      const pick = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === 1) {
            const el = child;
            if (el.matches("p, ul, ol, h1, h2, h3, h4, h5, h6, picture, img, a")) {
              content.append(el);
            } else {
              pick(el);
            }
          } else if (child.nodeType === 3 && child.textContent.trim()) {
            content.append(child);
          }
        });
      };
      pick(body);
      rows.push([title, [...content.childNodes]]);
    });
    if (!rows.length) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Accordion",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var PATIENTS_HOST_RE = /^https?:\/\/patients\.stryker\.com(?=[/?#]|$)/i;
  var CORP_HOST_RE = /^https?:\/\/www\.stryker\.com(?=[/?#]|$)/i;
  function sourceHostFor(payload) {
    try {
      const { hostname } = new URL(payload.params.originalURL);
      if (hostname === "www.stryker.com") return CORP_HOST_RE;
    } catch (e) {
    }
    return PATIENTS_HOST_RE;
  }
  function rewriteSourceLink(href, hostRe = PATIENTS_HOST_RE) {
    if (!href) return null;
    const value = href.trim();
    let rest;
    if (value.startsWith("/") && !value.startsWith("//")) rest = value;
    else if (hostRe.test(value)) rest = value.replace(hostRe, "") || "/";
    else return null;
    const [, path, suffix = ""] = rest.match(/^([^?#]*)([?#].*)?$/);
    if (!/\.html?$/i.test(path) || path.startsWith("/content/dam/")) return null;
    let edsPath = path.replace(/\.html?$/i, "");
    if (/(^|\/)index$/i.test(edsPath)) edsPath = edsPath.replace(/index$/i, "");
    return `${edsPath || "/"}${suffix}`;
  }
  function corpContentLink(href) {
    const value = (href || "").trim().replace(CORP_HOST_RE, "");
    if (!/^\/content\/(?!dam\/)/.test(value)) return null;
    if (/^\/content\/stryker\/[a-z]{2}\//.test(value)) return value.replace(/^\/content\/stryker/, "");
    return `https://www.stryker.com${value}`;
  }
  function documentName(name) {
    let decoded = name;
    try {
      decoded = decodeURIComponent(name);
    } catch (e) {
    }
    return decoded.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function documentLink(href) {
    const m = String(href || "").match(/^(\/[^?#]*)([?#].*)?$/);
    if (!m || href.startsWith("//") || m[1].startsWith("/content/")) return null;
    const segments = m[1].split("/");
    if (/\.[a-z0-9]{2,5}$/i.test(segments[segments.length - 1])) return null;
    const path = segments.map((s) => s ? documentName(s) : s).join("/");
    return path === m[1] ? null : `${path}${m[2] || ""}`;
  }
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isCorp = !!(payload && payload.template && (payload.template.site === "corp" || ["news-detail", "news-detail-xf", "long-page-detail-corp", "long-page-detail-corp-fragments"].includes(payload.template.name)));
    const isSkinnedContent = isSaResources || isIvsTreatment || isCorp;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isCorp) return;
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
        element.querySelectorAll(".buttonset a.btn-gold").forEach((a) => {
          if (a.closest("em") && a.closest("strong")) return;
          a.removeAttribute("class");
          a.removeAttribute("style");
          const strong = element.ownerDocument.createElement("strong");
          const em = element.ownerDocument.createElement("em");
          a.replaceWith(strong);
          strong.appendChild(em);
          em.appendChild(a);
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
        element.querySelectorAll('a[target="_blank" i][href]').forEach((a) => {
          const href = a.getAttribute("href").trim();
          if (!href || href.endsWith("#_blank") || /^(mailto|tel):/i.test(href)) return;
          a.setAttribute("href", `${href.replace(/#$/, "")}#_blank`);
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
        const trackingHost = /^(https?:)?\/\//i.test(ref) && TRACKING_HOST_RE.test(ref);
        if (trackingHost || PLACEHOLDER_RE.test(ref) || isPixel) {
          const wrapper = node.closest("p, picture, div") || node;
          wrapper.remove();
        }
      });
      element.querySelectorAll("p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture, a")) p.remove();
      });
      const hostRe = sourceHostFor(payload);
      element.querySelectorAll("a[href]").forEach((a) => {
        if (hostRe === CORP_HOST_RE) {
          const content = corpContentLink(a.getAttribute("href"));
          if (content !== null) a.setAttribute("href", content);
          if (content && content.startsWith("https://")) return;
        }
        const rewritten = rewriteSourceLink(a.getAttribute("href"), hostRe);
        if (rewritten !== null) a.setAttribute("href", rewritten);
        const href = a.getAttribute("href");
        const cleaned = documentLink(href);
        if (cleaned === null) return;
        if (a.textContent.trim() === href) a.textContent = cleaned;
        a.setAttribute("href", cleaned);
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

  // tools/importer/transformers/etd-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SECTION_HEADINGS = ["CAUSES", "SYMPTOMS", "TREATMENT", "WHAT TO EXPECT", "FAQ"];
  var NON_COMPACT = /* @__PURE__ */ new Set(["FAQ"]);
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const doc = element.ownerDocument;
    const root = element;
    const outermostAnchor = (node) => {
      let anchor = node;
      let n = node;
      while (n && n !== root) {
        if (n.tagName === "TABLE" || n.classList && (n.classList.contains("columns") || n.classList.contains("accordion"))) {
          anchor = n;
        }
        n = n.parentElement;
      }
      return anchor;
    };
    const makeSectionMeta = () => WebImporter.Blocks.createBlock(doc, {
      name: "Section Metadata",
      cells: [["Style", "compact"]]
    });
    const breakBefore = (node, compact) => {
      const anchor = outermostAnchor(node);
      if (!anchor.parentElement) return;
      if (!(anchor.previousElementSibling && anchor.previousElementSibling.tagName === "HR")) {
        anchor.parentElement.insertBefore(doc.createElement("hr"), anchor);
      }
      if (compact) anchor.parentElement.insertBefore(makeSectionMeta(), anchor);
    };
    const headings = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    SECTION_HEADINGS.forEach((label) => {
      const h = headings.find((el) => el.textContent.trim().toUpperCase().startsWith(label));
      if (h) breakBefore(h, !NON_COMPACT.has(label));
    });
    const discl = [...root.querySelectorAll("p")].find((p) => {
      const t = p.textContent.trim();
      return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
    });
    if (discl) breakBefore(discl, true);
    const FIFTY_FIFTY_SECTIONS = ["SYMPTOMS", "TREATMENT"];
    const isSectionHeading = (el) => /^H[1-6]$/.test(el.tagName) && SECTION_HEADINGS.some((s) => el.textContent.trim().toUpperCase().startsWith(s));
    const sectionLabelOf = (el) => {
      const found = SECTION_HEADINGS.find((s) => el.textContent.trim().toUpperCase().startsWith(s));
      return found || null;
    };
    let currentSection = null;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType !== 1) return;
        if (/^H[1-6]$/.test(child.tagName) && isSectionHeading(child)) {
          currentSection = sectionLabelOf(child);
        }
        if (child.tagName === "TABLE") {
          const hdr = child.querySelector("tr");
          if (hdr && /^columns$/i.test(hdr.textContent.trim())) {
            const innerHeading = [...child.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => isSectionHeading(h));
            const section = innerHeading ? sectionLabelOf(innerHeading) : currentSection;
            if (FIFTY_FIFTY_SECTIONS.includes(section)) {
              const hdrCell = child.querySelector("tr td, tr th");
              if (hdrCell) hdrCell.textContent = "Columns (columns-50-50)";
            }
          }
          return;
        }
        walk(child);
      });
    };
    walk(root);
  }

  // tools/importer/import-etd.js
  var parsers = {
    columns: parse,
    accordion: parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "etd",
    description: "ENT condition page (Eustachian tube dysfunction shape): text hero, columns (cols2/cols3) body sections styled compact with a columns-50-50 first section, an accordion FAQ, and a references/disclaimer list. No stat panel.",
    urls: [
      "https://patients.stryker.com/us/en/ent/eustachian-tube-dysfunction.html"
    ],
    blocks: [
      // match cols2 / cols3 AND their ratio variants (e.g. cols2_2-3_1-3 used by
      // the SYMPTOMS text+image grid) so every source grid becomes a columns block
      { name: "columns", instances: ['div[class^="cols2"]', 'div[class^="cols3"]'] },
      { name: "accordion", instances: ["div.c-accordion .panel-group"] }
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
  var import_etd_default = {
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
      const meta = WebImporter.Blocks.getMetadata(document);
      meta.template = "long-page-detail";
      delete meta.theme;
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
          template: PAGE_TEMPLATE.name
        }
      }];
    }
  };
  return __toCommonJS(import_etd_exports);
})();
