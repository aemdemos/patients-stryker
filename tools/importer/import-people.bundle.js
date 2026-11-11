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

  // tools/importer/import-people.js
  var import_people_exports = {};
  __export(import_people_exports, {
    default: () => import_people_default
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
      "people",
      "people-fragments"
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
    "/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master": {
      name: 'Our management "\u25C1 Back" link (leader bio pages)'
    },
    "/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master": {
      name: 'Board of directors "\u25C1 Back" link (director bio pages)'
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

  // tools/importer/import-people.js
  var PAGE_TEMPLATE = {
    name: "people",
    description: "www.stryker.com People pages (#515). Bio pages: the shared Back link as a Fragment block; H1 (gold first name) + role in a `serif, p-1-75, h1-1-25` section; Columns [bio | portrait]. Leaders index: H1 + intro (`serif, p-2`), then per group an H2 (corp draws its grey rule) and a Cards Corp (people) block of [portrait | name / role / Meet link] tiles. `published` from the source date; `last-updated: show` where the source shows its Last Updated line.",
    urls: [
      "https://www.stryker.com/us/en/about/our-management/leaders.html",
      "https://www.stryker.com/us/en/about/our-management/leaders/1004.html",
      "https://www.stryker.com/us/en/about/our-board-of-directors/directors/1064.html"
    ],
    blocks: []
  };
  var BACK_XFS = {
    leaders: "/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master",
    directors: "/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master"
  };
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
  function publishedDate(document) {
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function splitName(el) {
    const full = text(el);
    const gold = el.querySelector('[style*="ffb500" i]');
    if (!gold) return { first: "", last: full };
    const copy = gold.cloneNode(true);
    copy.querySelectorAll('[style*="color"]').forEach((n) => n.remove());
    const first = text(copy);
    if (!first || !full.startsWith(first)) return { first: "", last: full };
    return { first, last: clean(full.slice(first.length)) };
  }
  function appendName(document, parent, { first, last }) {
    const strong = document.createElement("strong");
    strong.textContent = [first && `[[color-gold]${first}]`, last].filter(Boolean).join(" ");
    parent.append(strong);
  }
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function image(document, img) {
    const out = document.createElement("img");
    out.src = img.getAttribute("src");
    out.alt = img.getAttribute("alt") || "";
    return out;
  }
  function bioParagraph(document, p) {
    const out = document.createElement("p");
    const copy = (from, to) => from.childNodes.forEach((n) => {
      if (n.nodeType === 3) to.append(document.createTextNode(n.textContent.replace(/\u00a0/g, " ")));
      else if (n.nodeName === "BR") to.append(document.createElement("br"));
      else if (["A", "STRONG", "B", "EM", "I", "SUP", "SUB"].includes(n.nodeName)) {
        const el = document.createElement(n.nodeName === "B" ? "strong" : n.nodeName.toLowerCase());
        if (n.nodeName === "A") el.href = n.getAttribute("href");
        copy(n, el);
        to.append(el);
      } else if (n.nodeType === 1) copy(n, to);
    });
    copy(p, out);
    const blank = (n) => n && (n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim());
    while (blank(out.lastChild)) out.lastChild.remove();
    while (blank(out.firstChild)) out.firstChild.remove();
    const { firstChild: first, lastChild: last } = out;
    if (first && first.nodeType === 3) first.textContent = first.textContent.trimStart();
    if (last && last.nodeType === 3) last.textContent = last.textContent.trimEnd();
    return out.textContent.trim() ? out : null;
  }
  function isDocCode(p) {
    const span = p.querySelector(".fontsize-8em");
    return !!span && !!text(p) && text(span) === text(p);
  }
  function disclaimerSection(document, src) {
    const paras = [
      ...[...src.querySelectorAll(".c-rich-text-editor p")].filter(isDocCode),
      ...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")
    ].map((p) => bioParagraph(document, p)).filter(Boolean);
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata(document, "disclaimer")];
  }
  function buildBio(document, src, kind) {
    var _a;
    const nodes = [];
    const fragment = xfFragmentPath(BACK_XFS[kind]);
    if (fragment) {
      const a = document.createElement("a");
      a.href = fragment;
      a.textContent = fragment;
      nodes.push(WebImporter.Blocks.createBlock(document, { name: "Fragment", cells: [[a]] }));
      nodes.push(document.createElement("hr"));
    }
    const h1Src = src.querySelector("h1");
    const rte = h1Src.closest(".c-rich-text-editor");
    const h1 = document.createElement("h1");
    appendName(document, h1, splitName(h1Src));
    nodes.push(h1);
    const paras = [...rte.querySelectorAll("p")];
    const roleP = paras.shift();
    const roleSpan = roleP && roleP.querySelector(".fontsize-1-75em");
    const bio = [];
    if (roleP) {
      const role = document.createElement("p");
      role.textContent = text(roleSpan || roleP);
      nodes.push(role);
      if (roleSpan) {
        const rest = roleP.cloneNode(true);
        rest.querySelector(".fontsize-1-75em").remove();
        const extra = bioParagraph(document, rest);
        if (extra) bio.push(extra);
      }
    }
    nodes.push(sectionMetadata(document, "serif, p-1-75, h1-1-25"));
    nodes.push(document.createElement("hr"));
    paras.filter((p) => !isDocCode(p)).forEach((p) => {
      const out = bioParagraph(document, p);
      if (out) bio.push(out);
    });
    const imgSrc = ((_a = rte.closest(".aem-Grid")) == null ? void 0 : _a.querySelector(".c-standalone-image img")) || src.querySelector(".c-standalone-image img");
    const imgCell = imgSrc ? [image(document, imgSrc)] : [];
    nodes.push(WebImporter.Blocks.createBlock(document, { name: "Columns", cells: [[bio, imgCell]] }));
    return nodes;
  }
  function buildTile(document, tile) {
    const img = tile.querySelector(".c-standalone-image img");
    const link = tile.querySelector(".standalone-link a[href]") || [...tile.querySelectorAll(".c-rich-text-editor a[href]")].pop();
    const nameEl = tile.querySelector(".c-rich-text-editor .futura-bold");
    const nameP = nameEl && nameEl.closest("p");
    const body = [];
    if (nameEl) {
      const p = document.createElement("p");
      appendName(document, p, splitName(nameEl));
      body.push(p);
    }
    const role = nameP && nameP.querySelector(".urw-egyptienne");
    if (role && text(role)) {
      const p = document.createElement("p");
      p.textContent = text(role);
      body.push(p);
    }
    if (link) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      const u = document.createElement("u");
      a.href = link.getAttribute("href");
      u.textContent = text(link).replace(/^(\S+\s+)(\S)(\S*)/, (m, w, c, r) => `${w}${c.toUpperCase()}${r.toLowerCase()}`);
      a.append(u);
      strong.append(a);
      p.append(strong);
      body.push(p);
    }
    return [img ? [image(document, img)] : [], body];
  }
  function buildIndex(document, src) {
    const nodes = [];
    const h1Src = src.querySelector("h1");
    const h1 = document.createElement("h1");
    const strong = document.createElement("strong");
    strong.textContent = text(h1Src);
    h1.append(strong);
    nodes.push(h1);
    h1Src.closest(".c-rich-text-editor").querySelectorAll("p").forEach((p) => {
      if (!text(p)) return;
      const out = document.createElement("p");
      out.textContent = text(p);
      nodes.push(out);
    });
    nodes.push(sectionMetadata(document, "serif, p-2"));
    const items = [...src.querySelectorAll(".c-section-title h2, .buildingblock")];
    const groups = [];
    items.forEach((el) => {
      if (el.tagName === "H2") groups.push({ title: text(el), tiles: [] });
      else if (groups.length && el.querySelector(".c-standalone-image img")) {
        groups[groups.length - 1].tiles.push(el);
      }
    });
    groups.forEach(({ title, tiles }, i) => {
      if (i) nodes.push(document.createElement("hr"), sectionMetadata(document, "spacer, xxlarge"));
      nodes.push(document.createElement("hr"));
      const h2 = document.createElement("h2");
      h2.textContent = title;
      nodes.push(h2);
      nodes.push(WebImporter.Blocks.createBlock(document, {
        name: "Cards Corp (people)",
        cells: tiles.map((tile) => buildTile(document, tile))
      }));
    });
    return nodes;
  }
  var import_people_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const kind = (source.pathname.match(/\/(leaders|directors)\/[^/]+$/) || [])[1];
      const main = document.createElement("div");
      main.append(...kind ? buildBio(document, document.body, kind) : buildIndex(document, document.body), ...disclaimerSection(document, document.body));
      document.body.replaceChildren(main);
      executeTransformers("afterTransform", main, payload);
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
          kind: kind || "index",
          "last-updated": published && showDate ? "show" : ""
        }
      }];
    }
  };
  return __toCommonJS(import_people_exports);
})();
