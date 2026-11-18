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

  // tools/importer/import-patents.js
  var import_patents_exports = {};
  __export(import_patents_exports, {
    default: () => import_patents_default
  });

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
    if (hostRe === CORP_HOST_RE) {
      edsPath = edsPath.replace(/^\/content\/stryker(?=\/)/, "");
      edsPath = edsPath.split("/").map((seg) => seg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join("/");
    }
    if (/(^|\/)index$/i.test(edsPath)) edsPath = edsPath.replace(/index$/i, "");
    return `${edsPath || "/"}${suffix}`;
  }
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isNewsDetail = !!(payload && payload.template && [
      "news-detail",
      "news-detail-xf",
      "long-page-detail-corp",
      "long-page-detail-corp-fragments",
      "event-detail",
      "contact-division",
      "people",
      "people-fragments",
      "ivs-footnotes",
      "ivs-footnotes-fragments",
      "corp-legal",
      "patents"
    ].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          heading.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text2 = span.textContent.replace(/ /g, " ").trim();
            if (!text2) return;
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
        const text2 = span.textContent.replace(/ /g, " ").trim();
        if (!text2) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text2;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text2) {
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
      const hostRe = sourceHostFor(payload);
      element.querySelectorAll("a[href]").forEach((a) => {
        const rewritten = rewriteSourceLink(a.getAttribute("href"), hostRe);
        if (rewritten !== null) a.setAttribute("href", rewritten);
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
  function altToLinkText(alt, src) {
    return alt || src;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt, src);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt, src);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-patents.js
  var PAGE_TEMPLATE = {
    name: "patents",
    description: "www.stryker.com patents and trademarks pages (#518). Patents index: Columns (columns-50-50, stack) hero [gold H1 (bold + italic) + notice | image], the product-line links as plain paragraphs in a `separator` section, the document code in a `disclaimer` section. Patents tables and trademarks: each source table as one `Table (no-header, striped, stacked)` (columns empty in every row dropped); trademarks first has its H1 and description in a `serif, p-1-5, width-50` section. `published` from the source date with `last-updated: show`.",
    urls: [
      "https://www.stryker.com/us/en/about/patents.html",
      "https://www.stryker.com/us/en/about/patents/Spine-patents.html",
      "https://www.stryker.com/us/en/about/trademarks.html"
    ],
    blocks: []
  };
  var AUTHOR_LINKS = [[
    /^https:\/\/author-stryker-prod\.adobecqms\.net\/editor\.html\/content\/stryker(\/us\/en\/about\/patents\/peripheral-vascular\.html)$/,
    "https://www.stryker.com$1"
  ]];
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var clean = (s) => (s || "").replace(/[\s\u00a0]+/g, " ").trim();
  var text = (el) => el ? clean(el.textContent) : "";
  var cellText = (el) => el.textContent.replace(/[ \t\r\n\f]+/g, " ").trim();
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function para(document, value) {
    const p = document.createElement("p");
    p.textContent = value;
    return p;
  }
  function publishedDate(document) {
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function pageHero(document, src) {
    var _a;
    const component = src.querySelector(".c-page-hero");
    if (!component) return { nodes: [], rule: false };
    const heading = [];
    const copy = [];
    component.querySelectorAll("h1, p").forEach((el) => {
      if (!text(el)) return;
      if (el.matches("h1")) {
        const h1 = document.createElement("h1");
        const strong = document.createElement("strong");
        strong.textContent = text(el);
        const gold = /255\s*,\s*181\s*,\s*0|#ffb500/i.test(el.getAttribute("style") || "");
        if (gold) {
          const em = document.createElement("em");
          em.append(strong);
          h1.append(em);
        } else h1.append(strong);
        heading.push(h1);
      } else copy.push(para(document, text(el)));
    });
    const media = [];
    const img = component.querySelector("img");
    if (img) {
      const source = (_a = img.closest("picture")) == null ? void 0 : _a.querySelector("source[srcset]");
      const out = document.createElement("img");
      out.src = source ? source.getAttribute("srcset").split(/\s+/)[0] : img.getAttribute("src");
      out.alt = img.getAttribute("alt") || "";
      media.push(out);
    }
    const nodes = media.length ? [...heading, WebImporter.Blocks.createBlock(document, { name: "Columns (columns-50-50, stack)", cells: [[copy, media]] })] : [...heading, ...copy];
    return { nodes, rule: !!component.querySelector(".border-bottom-gold") };
  }
  function linkList(document, src) {
    return [...src.querySelectorAll(".c-curated-link-list a[href]")].filter((a) => text(a)).map((link) => {
      const href = link.getAttribute("href");
      const live = AUTHOR_LINKS.reduce((v, [re, to]) => v.replace(re, to), href);
      const a = document.createElement("a");
      a.href = href;
      if (live !== href) a.setAttribute("data-live", live);
      a.textContent = text(link);
      const p = document.createElement("p");
      p.append(a);
      return p;
    });
  }
  function longTextHero(document, src) {
    const component = src.querySelector(".c-longtexthero");
    if (!component) return [];
    const title = component.querySelector("h1");
    const nodes = [];
    if (text(title)) {
      const h1 = document.createElement("h1");
      const strong = document.createElement("strong");
      strong.textContent = text(title);
      h1.append(strong);
      nodes.push(h1);
    }
    component.querySelectorAll(".description p").forEach((p) => {
      if (text(p)) nodes.push(para(document, text(p)));
    });
    if (!nodes.length) return [];
    return [...nodes, sectionMetadata(document, "serif, p-1-5, width-50"), document.createElement("hr")];
  }
  function tables(document, src) {
    return [...src.querySelectorAll(".c-patenttables table")].map((table) => {
      const rows = [...table.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((td) => cellText(td.querySelector(".cell-content") || td))).filter((r) => r.some(Boolean));
      const width = Math.max(0, ...rows.map((r) => r.length));
      const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i]));
      if (!rows.length || !used.length) return null;
      return WebImporter.Blocks.createBlock(document, {
        name: "Table (no-header, striped, stacked)",
        cells: rows.map((r) => used.map((i) => r[i] || ""))
      });
    }).filter(Boolean);
  }
  function disclaimerSection(document, src) {
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text(p)).map((p) => para(document, text(p)));
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata(document, "disclaimer")];
  }
  var import_patents_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.body;
      const main = document.createElement("div");
      const { nodes: hero, rule } = pageHero(document, src);
      const links = linkList(document, src);
      const blocks = tables(document, src);
      if (hero.length) main.append(...hero, document.createElement("hr"));
      if (links.length) main.append(...links);
      if (rule && links.length) main.append(sectionMetadata(document, "separator"));
      main.append(...longTextHero(document, src), ...blocks);
      main.append(...disclaimerSection(document, document.body));
      document.body.replaceChildren(main);
      executeTransformers("afterTransform", main, payload);
      main.querySelectorAll("a[data-live]").forEach((a) => {
        a.setAttribute("href", a.getAttribute("data-live"));
        a.removeAttribute("data-live");
      });
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
      meta.template = PAGE_TEMPLATE.name;
      if (published) meta.published = published;
      if (published && showDate) meta["last-updated"] = "show";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = source.pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: meta.Title || document.title,
          template: PAGE_TEMPLATE.name,
          blocks: blocks.length ? Array(blocks.length).fill("table") : [],
          rows: blocks.map((b) => b.querySelectorAll("tr").length - 1)
        }
      }];
    }
  };
  return __toCommonJS(import_patents_exports);
})();
