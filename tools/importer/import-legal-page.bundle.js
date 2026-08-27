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

  // tools/importer/import-legal-page.js
  var import_legal_page_exports = {};
  __export(import_legal_page_exports, {
    default: () => import_legal_page_default
  });

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      const BLACK_RE = /color:\s*(#000000|#000\b|black|rgb\(0,\s*0,\s*0\))/i;
      element.querySelectorAll('[style*="ffb500" i]').forEach((gold) => {
        const goldText = gold.textContent.replace(/ /g, " ").trim();
        if (!goldText) return;
        const blackInner = [...gold.querySelectorAll('[style*="000" i]')].find((b) => BLACK_RE.test(b.getAttribute("style") || ""));
        if (blackInner && blackInner.textContent.replace(/ /g, " ").trim() === goldText) {
          gold.replaceWith(...[...gold.childNodes]);
        }
      });
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        if (!h.querySelector('[style*="ffb500" i]')) return;
        if (h.tagName === "H2") return;
        const h2 = element.ownerDocument.createElement("h2");
        [...h.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
        while (h.firstChild) h2.appendChild(h.firstChild);
        h.replaceWith(h2);
      });
      const hasContent = (node) => node.nodeType === 3 ? node.textContent.trim() !== "" : (node.textContent || "").trim() !== "" || !!(node.querySelector && node.querySelector("img, picture"));
      [...element.querySelectorAll("p")].forEach((p) => {
        const goldSpan = p.querySelector('[style*="ffb500" i]');
        if (!goldSpan) return;
        let labelNode = goldSpan;
        while (labelNode.parentElement && labelNode.parentElement !== p) {
          labelNode = labelNode.parentElement;
        }
        let first = p.firstChild;
        while (first && first.nodeType === 3 && !first.textContent.trim()) first = first.nextSibling;
        if (first !== labelNode) return;
        const labelText = goldSpan.textContent.replace(/ /g, " ").trim();
        if (!labelText) return;
        const h2 = element.ownerDocument.createElement("h2");
        h2.textContent = labelText;
        let cursor = labelNode.nextSibling;
        while (cursor && cursor.nodeType === 3 && !cursor.textContent.trim()) cursor = cursor.nextSibling;
        if (cursor && cursor.nodeType === 1 && cursor.tagName === "BR") cursor = cursor.nextSibling;
        const bodyNodes = [];
        while (cursor) {
          bodyNodes.push(cursor);
          cursor = cursor.nextSibling;
        }
        if (bodyNodes.some(hasContent)) {
          const bodyP = element.ownerDocument.createElement("p");
          bodyNodes.forEach((n) => bodyP.appendChild(n));
          p.replaceWith(h2, bodyP);
        } else {
          p.replaceWith(h2);
        }
      });
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
      WebImporter.DOMUtils.remove(element, [
        ".c-disclaimer",
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
      const firstHeading = element.querySelector("h1, h2, h3, h4, h5, h6");
      if (firstHeading && firstHeading.tagName !== "H1") {
        const h1 = element.ownerDocument.createElement("h1");
        [...firstHeading.attributes].forEach((attr) => h1.setAttribute(attr.name, attr.value));
        while (firstHeading.firstChild) h1.appendChild(firstHeading.firstChild);
        firstHeading.replaceWith(h1);
      }
    }
  }

  // tools/importer/import-legal-page.js
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "legal-page",
    description: "Legal long-form text page: an <h1> title, gold sub-section labels promoted to <h2>, plus paragraphs and bulleted lists in a narrow reading column. All default content, no blocks. Shared by every /legal/ page across all site roots (us, ww, ent, stroke-awareness, zip-skin-closure).",
    urls: [
      "https://patients.stryker.com/us/en/ent/legal/website-accessibility.html",
      "https://patients.stryker.com/us/en/ent/legal/privacy/privacy-notice-for-california-residents.html",
      "https://patients.stryker.com/us/en/ent/legal/privacy.html",
      "https://patients.stryker.com/us/en/ent/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/us/en/ent/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/us/en/ent/legal/surgeon-disclaimer.html",
      "https://patients.stryker.com/us/en/ent/legal/ent-risk-and-safety-information-for-patients.html",
      "https://patients.stryker.com/us/en/ent/legal/terms-of-use.html",
      "https://patients.stryker.com/us/en/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/us/en/legal/privacy/privacy-notice-for-california-residents.html",
      "https://patients.stryker.com/us/en/legal/privacy.html",
      "https://patients.stryker.com/us/en/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/us/en/legal/website-accessibility.html",
      "https://patients.stryker.com/us/en/legal/terms-of-use.html",
      "https://patients.stryker.com/ww/en/legal/website-accessibility.html",
      "https://patients.stryker.com/ww/en/legal/privacy/privacy-notice-for-california-residents.html",
      "https://patients.stryker.com/ww/en/legal/privacy.html",
      "https://patients.stryker.com/ww/en/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/ww/en/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/ww/en/legal/terms-of-use.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/website-accessibility.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/privacy/privacy-notice-for-california-residents.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/privacy.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal/terms-of-use.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/website-accessibility.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/privacy.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/terms-of-use.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/website-accessibility.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/privacy.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/consumer-health-privacy.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/cookie-disclaimer.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/terms-of-use.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal/privacy/privacy-notice-for-california-residents.html",
      "https://patients.stryker.com/us/en/zip-skin-closure/legal/privacy/privacy-notice-for-california-residents.html",
      // Legal index pages: these 301-redirect to their sibling privacy.html, so the
      // import follows the redirect and saves the Privacy Statement content at the
      // /legal path. Same template rules apply (h1 title, gold labels as h2).
      "https://patients.stryker.com/us/en/legal.html",
      "https://patients.stryker.com/ww/en/legal.html",
      "https://patients.stryker.com/us/en/stroke-awareness/legal.html",
      "https://patients.stryker.com/ww/en/stroke-awareness/legal.html"
    ],
    blocks: []
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
  var import_legal_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document);
      meta.theme = "legal";
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
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_legal_page_exports);
})();
