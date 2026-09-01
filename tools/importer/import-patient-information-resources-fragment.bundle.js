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

  // import-patient-information-resources-fragment.js
  var import_patient_information_resources_fragment_exports = {};
  __export(import_patient_information_resources_fragment_exports, {
    default: () => import_patient_information_resources_fragment_default
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

  // import-patient-information-resources-fragment.js
  var transformers = [
    transform
  ];
  var FRAGMENT = {
    name: "patient-information-resources",
    // where the fragment document is written (DA path, no .html)
    path: "/fragments/patient-information-resources",
    urls: [
      "https://patients.stryker.com/us/en/stroke-awareness/patient-information.html"
    ],
    blocks: ["columns"]
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
  function buildResourcesColumns(doc, source) {
    const cols = [...source.querySelectorAll(".bg-light-gray .cols3 .col-md-4")];
    const cells = cols.map((col) => {
      const cell = doc.createElement("div");
      [...col.querySelectorAll(".text .c-rich-text-editor > div")].forEach((rt) => {
        [...rt.children].forEach((node) => {
          const txt = node.textContent.replace(/ /g, " ").trim();
          if (!txt && !node.querySelector("a, img, picture")) return;
          cell.append(node);
        });
      });
      [...cell.querySelectorAll("a")].forEach((a) => {
        const isCta = a.closest(".standalone-link") || a.querySelector(".standalone-link");
        if (!isCta || a.querySelector("u")) return;
        const u = doc.createElement("u");
        while (a.firstChild) u.appendChild(a.firstChild);
        a.appendChild(u);
      });
      return cell;
    });
    return WebImporter.DOMUtils.createTable([["Columns"], cells], doc);
  }
  function sectionMetadata(doc, style) {
    return WebImporter.DOMUtils.createTable([
      ["Section Metadata"],
      ["Style", style]
    ], doc);
  }
  var import_patient_information_resources_fragment_default = {
    transform: (payload) => {
      const { document } = payload;
      const source = document.body;
      executeTransformers("beforeTransform", source, payload);
      executeTransformers("afterTransform", source, payload);
      const main = document.createElement("div");
      main.append(buildResourcesColumns(document, source));
      main.append(sectionMetadata(document, "light-gray, full-bleed"));
      return [{
        element: main,
        path: FRAGMENT.path,
        report: {
          title: "Patient Information Resources (fragment)",
          template: FRAGMENT.name,
          blocks: FRAGMENT.blocks
        }
      }];
    }
  };
  return __toCommonJS(import_patient_information_resources_fragment_exports);
})();
