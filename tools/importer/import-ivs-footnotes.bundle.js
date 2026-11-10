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

  // tools/importer/import-ivs-footnotes.js
  var import_ivs_footnotes_exports = {};
  __export(import_ivs_footnotes_exports, {
    BACK_XF: () => BACK_XF,
    default: () => import_ivs_footnotes_default
  });

  // tools/importer/parsers/accordion.js
  function parse(element, { document, name = "Accordion" }) {
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
      name,
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
    if (hostRe === CORP_HOST_RE) edsPath = edsPath.replace(/^\/content\/stryker(?=\/)/, "");
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
      "ivs-footnotes",
      "ivs-footnotes-fragments"
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

  // tools/importer/transformers/long-page-detail-corp-components.js
  var COMPONENT = '[class^="c-"], [class*=" c-"]';
  var UNIT = `[data-keep], ${COMPONENT}, .buttonset, table`;
  function keepBlock(block, from) {
    block.setAttribute("data-keep", "section");
    const end = from && from.getAttribute("data-row-end");
    if (end) block.setAttribute("data-row-end", end);
    return block;
  }
  function pageHeroes(main, doc, h) {
    main.querySelectorAll(".c-page-hero").forEach((component) => {
      const columnNodes = (col) => [...col.querySelectorAll("h1, h2, p, img")].flatMap((el) => {
        var _a;
        if (el.matches("img")) {
          const source = el.closest("picture") && el.closest("picture").querySelector("source[srcset]");
          const img = doc.createElement("img");
          img.setAttribute("src", source ? source.getAttribute("srcset").split(/\s+/)[0] : el.getAttribute("src"));
          img.setAttribute("alt", el.getAttribute("alt") || "");
          const p = doc.createElement("p");
          p.append(img);
          return [p];
        }
        if (!h.text(el)) return [];
        const copy = doc.createElement(el.tagName.toLowerCase());
        const gold = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i.test(((_a = ((el.getAttribute("style") || "").match(/color\s*:\s*([^;]+)/i) || [])[1]) == null ? void 0 : _a.trim()) || "");
        if (el.matches("h1")) {
          const strong = doc.createElement("strong");
          strong.textContent = h.text(el);
          copy.append(doc.createTextNode(gold ? "[[text-2][[color-gold]" : "[[text-2]"), strong, doc.createTextNode(gold ? "]]" : "]"));
        } else if (el.matches("h2")) {
          copy.textContent = `[[text-1-75,serif]${h.text(el)}]`;
        } else copy.textContent = gold ? `[[color-gold]${h.text(el)}]` : h.text(el);
        return [copy];
      });
      const cols = [...component.querySelectorAll('.row > [class*="col-"]')].filter((col) => h.text(col) || col.querySelector("img"));
      const cells = cols.map(columnNodes).filter((nodes) => nodes.length);
      if (!cells.length) return;
      const out = cells.length === 2 ? [keepBlock(WebImporter.Blocks.createBlock(doc, { name: "Columns (columns-50-50)", cells: [cells] }))] : [h.richText(doc, cells.flat())];
      if (component.querySelector(".border-bottom-gold")) {
        const rule = doc.createElement("div");
        rule.className = "sectionseparator";
        out.push(rule);
      }
      (component.closest(".pagehero") || component).replaceWith(...out);
    });
  }

  // tools/importer/xf-fragment-map.js
  var xf_fragment_map_default = {
    "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master": {
      name: 'Acute Care "Resources" links'
    },
    "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master": {
      name: 'Emergency Care "Resources" links'
    },
    "/content/experience-fragments/stryker/sage/en/footer/footer/master": {
      name: 'Sage "Resources" links'
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master": {
      name: 'Sustainability "Connect with us" band (above the form)'
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master": {
      name: "Sustainability contact aside (next to the form)"
    },
    "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master": {
      name: "Sage contact aside (LinkedIn / Facebook icons)"
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop": {
      name: '"Join our talent network" banner (carousel slide; mobile slide: \u2026/join-our-talent-network-v2-mobile1)'
    },
    "/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master": {
      name: 'Interventional Spine footnotes "\u276E BACK" link (footnote detail pages)'
    }
  };

  // tools/importer/xf-fragment-path.js
  var XF_ROOT = "/content/experience-fragments/";
  var FRAGMENTS_ROOT = "/us/en/fragments/";
  function xfKey(xf) {
    return String(xf || "").replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/\.html$/i, "");
  }
  function xfToFragmentPath(xf) {
    const key = xfKey(xf);
    if (!key.startsWith(XF_ROOT)) return null;
    const segments = key.slice(XF_ROOT.length).split("/").map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean);
    return segments.length ? `${FRAGMENTS_ROOT}${segments.join("/")}` : null;
  }
  function xfFragmentPath(xf) {
    return xf_fragment_map_default[xfKey(xf)] ? xfToFragmentPath(xf) : null;
  }

  // tools/importer/import-ivs-footnotes.js
  var PAGE_TEMPLATE = {
    name: "ivs-footnotes",
    description: 'www.stryker.com Interventional Spine footnotes (#516), base template. Detail pages: the shared "\u276E BACK" link as a Fragment block; the page hero (gold H1, document code subhead) then, in a `separator` section, each revision as a bold `[[text-1-25]\u2026]` label, a `[[body-font]**\u2026**]` date line and its numbered references. Index: the hero, then an Accordion (divided) in a `separator` section, one row per document (label "<code> <title>"; body: the current-revision lines, references, disclaimer and a bold + italic "View past revisions" link, the gold button). The source document code (.c-disclaimer) closes the page as a `disclaimer` section; `published` and `last-updated: show` give the "Last Updated" line.',
    urls: [
      "https://www.stryker.com/us/en/interventional-spine/footnotes.html",
      "https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html"
    ],
    blocks: [
      { name: "accordion", instances: [".c-accordion .panel-group"] }
    ]
  };
  var BACK_XF = "/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master";
  var transformers = [transform];
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
  function publishedDate(document) {
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function inlineCopy(document, from, to) {
    const copy = (src, dst) => src.childNodes.forEach((n) => {
      if (n.nodeType === 3) dst.append(document.createTextNode(n.textContent.replace(/\u00a0/g, " ")));
      else if (n.nodeName === "BR") dst.append(document.createElement("br"));
      else if (["A", "STRONG", "B", "EM", "I", "SUP", "SUB"].includes(n.nodeName)) {
        const tag = { B: "strong", I: "em" }[n.nodeName] || n.nodeName.toLowerCase();
        const el = document.createElement(tag);
        if (n.nodeName === "A") el.href = n.getAttribute("href");
        copy(n, el);
        dst.append(el);
      } else if (n.nodeType === 1) copy(n, dst);
    });
    copy(from, to);
    const blank = (n) => n && (n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim());
    while (blank(to.lastChild)) to.lastChild.remove();
    while (blank(to.firstChild)) to.firstChild.remove();
    const { firstChild: first, lastChild: last } = to;
    if (first && first.nodeType === 3) first.textContent = first.textContent.trimStart();
    if (last && last.nodeType === 3) last.textContent = last.textContent.trimEnd();
    return to;
  }
  var isBoldLine = (p) => {
    const b = p.querySelector("b, strong");
    return !!b && !p.querySelector(".futura-bold") && text(b) === text(p);
  };
  function footnoteNodes(document, container) {
    const out = [];
    container.querySelectorAll(":scope > p, :scope > ol, :scope > ul").forEach((src) => {
      if (!text(src)) return;
      if (src.matches("ol, ul")) {
        const list = document.createElement(src.tagName.toLowerCase());
        src.querySelectorAll(":scope > li").forEach((li) => {
          if (text(li)) list.append(inlineCopy(document, li, document.createElement("li")));
        });
        out.push(list);
        return;
      }
      const p = document.createElement("p");
      const label = src.querySelector(".futura-bold");
      if (label && text(label) === text(src)) {
        const strong = document.createElement("strong");
        strong.textContent = src.querySelector(".fontsize-1-25em") ? `[[text-1-25]${text(src)}]` : text(src);
        p.append(strong);
      } else if (isBoldLine(src)) {
        const strong = document.createElement("strong");
        strong.textContent = text(src);
        p.append(document.createTextNode("[[body-font]"), strong, document.createTextNode("]"));
      } else inlineCopy(document, src, p);
      out.push(p);
    });
    return out;
  }
  var richTexts = (root) => [...root.querySelectorAll(".c-rich-text-editor")].map((rte) => rte.querySelector(":scope > div") || rte);
  function hero(document, src) {
    const component = src.querySelector(".c-page-hero");
    if (!component) return { nodes: [], rule: false };
    const box = document.createElement("div");
    box.append(component.cloneNode(true));
    pageHeroes(box, document, {
      text,
      richText: (doc, nodes2) => {
        const wrap = doc.createElement("div");
        wrap.setAttribute("data-hero", "");
        wrap.append(...nodes2);
        return wrap;
      }
    });
    const nodes = [...box.querySelectorAll("[data-hero] > *")];
    return { nodes, rule: !!box.querySelector(".sectionseparator") };
  }
  function buildDetail(document, src) {
    const nodes = [];
    const fragment = xfFragmentPath(BACK_XF);
    if (fragment && src.querySelector(".experiencefragment a[href]")) {
      const a = document.createElement("a");
      a.href = fragment;
      a.textContent = fragment;
      nodes.push(WebImporter.Blocks.createBlock(document, { name: "Fragment", cells: [[a]] }));
      nodes.push(document.createElement("hr"));
    }
    const { nodes: heroNodes, rule } = hero(document, src);
    nodes.push(...heroNodes, document.createElement("hr"));
    richTexts(src).filter((box) => !box.closest(".experiencefragment, .c-page-hero")).forEach((box) => nodes.push(...footnoteNodes(document, box)));
    if (rule) nodes.push(sectionMetadata(document, "separator"));
    return nodes;
  }
  function buildIndex(document, src) {
    const { nodes: heroNodes, rule } = hero(document, src);
    const nodes = [...heroNodes, document.createElement("hr")];
    const group = src.querySelector(".panel-group");
    if (group) {
      group.querySelectorAll(":scope > .panel").forEach((panel) => {
        const body = panel.querySelector(".panel-body");
        if (!body) return;
        const content = document.createElement("div");
        richTexts(body).forEach((box) => content.append(...footnoteNodes(document, box)));
        body.querySelectorAll("a.btn-gold[href]").forEach((btn) => {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          const em = document.createElement("em");
          const a = document.createElement("a");
          a.href = btn.getAttribute("href");
          a.textContent = text(btn);
          em.append(a);
          strong.append(em);
          p.append(strong);
          content.append(p);
        });
        body.replaceChildren(content);
      });
      const holder = document.createElement("div");
      holder.append(group);
      parse(group, { document, name: "Accordion (divided)" });
      nodes.push(...holder.childNodes);
    }
    if (rule) nodes.push(sectionMetadata(document, "separator"));
    return nodes;
  }
  function disclaimerSection(document, src) {
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text(p)).map((p) => inlineCopy(document, p, document.createElement("p")));
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata(document, "disclaimer")];
  }
  var import_ivs_footnotes_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.body;
      const isIndex = !!src.querySelector(".c-accordion .panel-group");
      const main = document.createElement("div");
      main.append(
        ...isIndex ? buildIndex(document, src) : buildDetail(document, src),
        ...disclaimerSection(document, document.body)
      );
      document.body.replaceChildren(main);
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
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
          kind: isIndex ? "index" : "detail",
          "last-updated": published && showDate ? "show" : ""
        }
      }];
    }
  };
  return __toCommonJS(import_ivs_footnotes_exports);
})();
