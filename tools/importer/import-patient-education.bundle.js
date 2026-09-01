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

  // import-patient-education.js
  var import_patient_education_exports = {};
  __export(import_patient_education_exports, {
    default: () => import_patient_education_default
  });

  // transformers/patient-education-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TRACKING_HOST_RE = /(demdex\.net|munchkin|marketo|omtrdc\.net|everesttech\.net|adobedtm|contextweb\.com|thrtle\.com|doubleclick|scorecardresearch|bidswitch|adnxs)/i;
  var PLACEHOLDER_RE = /(\{\{|\}\}|\$\{|%7B%7B|%24%7B)/;
  var isOffDomain = (ref) => /^https?:\/\//i.test(ref) && !/(^|\.)(stryker\.com|aem\.page|aem\.live|hlx\.(page|live))/i.test(ref);
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
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
        target.replaceWith(strong);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#header",
        "header#header",
        "footer#footer",
        "#footer",
        ".c-back-to-top",
        ".g-header"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#businessUnitTag",
        "#hiddenPublishedDate",
        "input",
        "link",
        "noscript",
        "style",
        "script"
      ]);
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

  // import-patient-education.js
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "patient-education",
    description: 'Neurovascular patient-education landing page: gold title bar (hero band), intro line, a row of patient-guide brochure cards (cards brochure-cta), a gold "for more information" CTA band, a 3-column resources footer (columns) on a light-gray band, and a trademark/disclaimer block. Reuses existing blocks only.',
    urls: [
      "https://patients.stryker.com/us/en/stroke-awareness/patient-information.html",
      "https://patients.stryker.com/us/en/stroke-awareness/resources.html"
    ],
    blocks: ["hero", "cards", "columns"]
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
  function dmAutolink(doc, url, title) {
    const a = doc.createElement("a");
    a.setAttribute("href", url);
    a.textContent = url;
    if (title) a.setAttribute("title", title);
    return a;
  }
  function p(doc, ...nodes) {
    const el = doc.createElement("p");
    nodes.forEach((n) => n && el.append(n));
    return el;
  }
  function goldButton(doc, href, text) {
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    const em = doc.createElement("em");
    const strong = doc.createElement("strong");
    strong.textContent = text;
    em.append(strong);
    a.append(em);
    return a;
  }
  function plainLink(doc, href, text) {
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    return a;
  }
  function heading(doc, level, ...nodes) {
    const h = doc.createElement(level);
    nodes.forEach((n) => n && h.append(n));
    return h;
  }
  function fragmentBlock(doc, path) {
    return WebImporter.DOMUtils.createTable([
      ["Fragment"],
      [plainLink(doc, path, path)]
    ], doc);
  }
  function buildHeroBand(doc, source) {
    const bgImgs = [...source.querySelectorAll("img.img-responsive.u-inline-block")].filter((img) => /Resources-background/i.test(img.getAttribute("src") || ""));
    const desktop = bgImgs.find((i) => !/mobile/i.test(i.getAttribute("src")));
    const mobile = bgImgs.find((i) => /mobile/i.test(i.getAttribute("src")));
    const rows = [["Hero (band)"]];
    if (desktop) rows.push([dmAutolink(doc, desktop.getAttribute("src"))]);
    if (mobile) rows.push([dmAutolink(doc, mobile.getAttribute("src"))]);
    const strong = doc.createElement("strong");
    const em = doc.createElement("em");
    em.textContent = "Patient information";
    strong.append(em);
    rows.push([heading(doc, "h1", strong)]);
    return WebImporter.DOMUtils.createTable(rows, doc);
  }
  function buildCards(doc, source) {
    const cols = [...source.querySelectorAll(".cols4 .col-md-3")];
    const rows = [["Cards (brochure-cta)"]];
    cols.forEach((col) => {
      const coverAnchor = col.querySelector(".standaloneimage a[href]");
      const coverImg = col.querySelector(".standaloneimage img[src]");
      const pdfHref = coverAnchor ? coverAnchor.getAttribute("href") : null;
      const dmSrc = coverImg ? coverImg.getAttribute("src") : null;
      const alt = coverImg ? coverImg.getAttribute("alt") || "" : "";
      const titleSpan = col.querySelector(".text .futura-bold");
      const titleAnchor = doc.createElement("a");
      if (pdfHref) titleAnchor.setAttribute("href", pdfHref);
      if (titleSpan) {
        [...titleSpan.childNodes].forEach((n) => {
          if (n.nodeType === 1 && n.tagName === "BR") return;
          if (n.nodeType === 1 && n.tagName === "SPAN" && !n.textContent.trim()) return;
          titleAnchor.append(n);
        });
      } else if (alt) {
        titleAnchor.textContent = alt;
      }
      const cta = col.querySelector(".curatedcta a[href]");
      const bodyNodes = [heading(doc, "h3", titleAnchor)];
      bodyNodes.push(p(doc, doc.createTextNode("Additional product information:")));
      if (cta) {
        bodyNodes.push(p(doc, goldButton(doc, cta.getAttribute("href"), cta.textContent.trim())));
      }
      const bodyCell = doc.createElement("div");
      bodyNodes.forEach((n) => bodyCell.append(n));
      const coverCell = dmSrc ? p(doc, dmAutolink(doc, dmSrc, alt)) : doc.createElement("div");
      rows.push([coverCell, bodyCell]);
    });
    return WebImporter.DOMUtils.createTable(rows, doc);
  }
  function sectionMetadata(doc, style) {
    return WebImporter.DOMUtils.createTable([
      ["Section Metadata"],
      ["Style", style]
    ], doc);
  }
  var import_patient_education_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = document.body;
      executeTransformers("beforeTransform", source, payload);
      executeTransformers("afterTransform", source, payload);
      const main = document.createElement("div");
      const portfolioLink = source.querySelector('a[href*="neurovascular.html"]');
      if (portfolioLink) {
        main.append(p(document, plainLink(
          document,
          portfolioLink.getAttribute("href"),
          portfolioLink.textContent.trim()
        )));
        main.append(document.createElement("hr"));
      }
      main.append(buildHeroBand(document, source));
      main.append(document.createElement("hr"));
      const introH2 = source.querySelector(".c-rich-text-editor h2");
      if (introH2) main.append(heading(document, "h2", document.createTextNode(introH2.textContent.trim())));
      main.append(buildCards(document, source));
      main.append(document.createElement("hr"));
      const goldBand = source.querySelector(".bg-golden-gradient");
      if (goldBand) {
        const bandP = goldBand.querySelector("p");
        const linkEl = bandP && bandP.querySelector("a");
        const para = document.createElement("p");
        const lead = bandP ? bandP.textContent.replace(/\s+/g, " ").replace(linkEl ? linkEl.textContent.trim() : "", "").trim() : "";
        if (lead) para.append(document.createTextNode(`${lead} `));
        if (linkEl) para.append(plainLink(document, linkEl.getAttribute("href"), linkEl.textContent.trim()));
        main.append(para);
      }
      main.append(sectionMetadata(document, "gold, full-bleed"));
      main.append(document.createElement("hr"));
      main.append(fragmentBlock(document, "/fragments/patient-information-resources"));
      main.append(document.createElement("hr"));
      const disclaimerParas = [...source.querySelectorAll(".c-disclaimer p")].filter((node) => node.id !== "publishedDate" && node.textContent.trim());
      disclaimerParas.forEach((node) => {
        main.append(heading(document, "p", document.createTextNode(node.textContent.trim())));
      });
      if (disclaimerParas.length) {
        main.append(sectionMetadata(document, "compact"));
      }
      const meta = WebImporter.Blocks.getMetadata(document);
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical && canonical.getAttribute("href")) {
        meta.canonical = canonical.getAttribute("href");
      }
      meta.template = "patient-education";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
          blocks: PAGE_TEMPLATE.blocks
        }
      }];
    }
  };
  return __toCommonJS(import_patient_education_exports);
})();
