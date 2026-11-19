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

  // tools/importer/import-corp-webinar.js
  var import_corp_webinar_exports = {};
  __export(import_corp_webinar_exports, {
    default: () => import_corp_webinar_default
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
      "corp-webinar"
    ].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading2) => {
          heading2.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
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

  // tools/importer/parsers/video.js
  var DM_HOST = "https://media-assets.stryker.com";
  function encodePath(path) {
    return path.split("/").map((part) => encodeURIComponent(part)).join("/");
  }
  function videoLink(element, document) {
    const a = document.createElement("a");
    const dm = element.querySelector("[data-asset-path]");
    if (dm) {
      const assetPath = dm.getAttribute("data-asset-path");
      const videoServer = dm.getAttribute("data-videoserver") || `${DM_HOST}/is/content/`;
      const imageServer = dm.getAttribute("data-imageserver") || `${DM_HOST}/is/image/`;
      const modifiers = dm.getAttribute("data-viewermodifiers") || "";
      const modifierPoster = (modifiers.match(/(?:^|&)VideoPlayer\.posterimage=([^&]+)/i) || [])[1];
      const poster = dm.getAttribute("data-posterimage") || modifierPoster && decodeURIComponent(modifierPoster.replace(/\+/g, " ")).trim() || assetPath;
      a.href = `${videoServer}${encodePath(assetPath)}.m3u8?poster=${imageServer}${encodePath(poster)}?fit=constrain,1&wid=909&hei=511`;
      a.textContent = (dm.getAttribute("data-asset-name") || assetPath.split("/").pop()).replace(/\.[a-z0-9]+$/i, "");
      return a;
    }
    const iframe = element.querySelector('iframe[src*="youtube"], iframe[data-src*="youtube"]');
    const src = iframe && (iframe.getAttribute("src") || iframe.getAttribute("data-src"));
    const id = src && (src.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/) || [])[1];
    if (!id) return null;
    a.href = `https://www.youtube.com/watch?v=${id}`;
    a.textContent = iframe.getAttribute("title") || a.href;
    return a;
  }

  // tools/importer/import-corp-webinar.js
  var PAGE_TEMPLATE = {
    name: "corp-webinar",
    description: "www.stryker.com webinars and on-demand videos (#519). Webinar: H1 + speaker in a `serif` section, the description in a `p-1-25` section, then the Video block (`Video (border)` unless the source hides the border). Thank-you: gold H1 (bold + italic) + H2 in a `h1-1-5, h-serif` section, the paragraph in `p-1-25`, then the Video. Page hero: gold H1 (+ H2) in a `h-serif` section, `Video (border)` in a `separator` section, the speaker byline in a `serif, p-1-25` section, then the description as body copy. Index: Back link + linked FocusRN wordmark in a `back-link, image-link` section, H1 + intro + register link (a plain link, not bold, alone on its line), then one `accordion-panel, image-link, large-labels` section per accordion panel (H2 label + one Columns 3-up row, Bold H3 webinar titles). The source document code closes the page as a `disclaimer` section; `published` and `last-updated: show` from the source date.",
    urls: [
      "https://www.stryker.com/us/en/emergency-care/webinars/ems1-webinar_with-or-without-capnography/webinar.html",
      "https://www.stryker.com/us/en/emergency-care/webinars/improving-cognitive-offloading-for-nurses/webinar.html",
      "https://www.stryker.com/us/en/sage/videos/sage-mp-mats-2-demo.html",
      "https://www.stryker.com/us/en/sage/webinars.html",
      "https://www.stryker.com/us/en/sage/webinars/guidelines-practice-pip-fireside-chat.html",
      "https://www.stryker.com/us/en/sage/webinars/hap-human-financial-cost.html",
      "https://www.stryker.com/us/en/sage/webinars/managing-urinary-incontinence-webinar.html",
      "https://www.stryker.com/us/en/sage/webinars/mobility-matters-impact-safe-patient-mobilization.html",
      "https://www.stryker.com/us/en/sage/webinars/nv-hap-hidden-plain-sight.html",
      "https://www.stryker.com/us/en/sage/webinars/risk-of-pip-procedural-operational-areas.html",
      "https://www.stryker.com/us/en/sage/webinars/safe-patient-handling-mobility-webinar.html",
      "https://www.stryker.com/us/en/sage/webinars/sepsis-hospital-acquired-pneumonia.html",
      "https://www.stryker.com/us/en/sage/webinars/sepsis-non-vent-pneumonia-risk-prevention-recognition.html"
    ],
    blocks: []
  };
  var LIVE_PAGES = /^\/us\/en\/training-and-education\/medical-and-surgical-equipment--\/sage\/focusrn(\/upcoming-events)?\.html$/;
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
  var text = (node) => node ? clean(node.textContent) : "";
  var GOLD = /255\s*,\s*181\s*,\s*0|#ffb500/i;
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function el(document, tag, value) {
    const node = document.createElement(tag);
    if (value) node.textContent = value;
    return node;
  }
  function wrap(document, node, ...tags) {
    return tags.reduceRight((inner, tag) => {
      const outer = document.createElement(tag);
      outer.append(inner);
      return outer;
    }, node);
  }
  function link(document, source, label) {
    const a = document.createElement("a");
    const href = source.getAttribute("href").trim();
    if (LIVE_PAGES.test(href)) a.setAttribute("data-live", `https://www.stryker.com${href}`);
    const newTab = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    a.href = newTab ? `${href}#_blank` : href;
    a.textContent = label != null ? label : text(source);
    return a;
  }
  function inline(document, source, tag = "p") {
    const out = document.createElement(tag);
    const walk = (node, into) => node.childNodes.forEach((child) => {
      if (child.nodeType === 3) into.append(child.textContent.replace(/\u00a0/g, " "));
      else if (child.nodeType === 1 && child.matches("a[href]")) into.append(link(document, child));
      else if (child.nodeType === 1 && !child.matches("br")) walk(child, into);
    });
    walk(source, out);
    out.normalize();
    const { firstChild, lastChild } = out;
    if ((firstChild == null ? void 0 : firstChild.nodeType) === 3) firstChild.textContent = firstChild.textContent.trimStart();
    if ((lastChild == null ? void 0 : lastChild.nodeType) === 3) lastChild.textContent = lastChild.textContent.trimEnd();
    out.childNodes.forEach((child) => {
      if (child.nodeType === 3) child.textContent = child.textContent.replace(/\s+/g, " ");
    });
    return out;
  }
  function isGold(source) {
    return GOLD.test(source.getAttribute("style") || "") || [...source.querySelectorAll("[style]")].some((s) => GOLD.test(s.getAttribute("style")));
  }
  function heading(document, source, tag) {
    const value = text(source);
    const gold = isGold(source);
    if (gold) return wrap(document, el(document, "strong", value), tag, "em");
    return tag === "h1" ? wrap(document, el(document, "strong", value), tag) : el(document, tag, value);
  }
  function publishedDate(document) {
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function video(document, src) {
    const component = src.querySelector(".c-standalone-video");
    const a = component && videoLink(component, document);
    if (!a) return null;
    const name = component.classList.contains("hide-border") ? "Video" : "Video (border)";
    return WebImporter.Blocks.createBlock(document, { name, cells: [[a]] });
  }
  function richText(src) {
    return [...src.querySelectorAll(".c-rich-text-editor")].filter((rte) => !rte.closest(".c-disclaimer, .c-accordion")).flatMap((rte) => [...rte.querySelectorAll("h1, h2, h3, h4, h5, h6, p")]).filter((node) => text(node));
  }
  function layoutA(document, src) {
    const nodes = richText(src);
    const h1 = nodes.find((n) => n.matches("h1"));
    const rest = nodes.filter((n) => n !== h1);
    const out = [];
    const thankYou = h1 && isGold(h1);
    if (thankYou) {
      out.push(heading(document, h1, "h1"));
      rest.filter((n) => /^H/.test(n.tagName)).forEach((n) => out.push(el(document, "h2", text(n))));
      out.push(sectionMetadata(document, "h1-1-5, h-serif"), el(document, "hr"));
      rest.filter((n) => n.matches("p")).forEach((n) => out.push(inline(document, n)));
      out.push(sectionMetadata(document, "p-1-25"), el(document, "hr"));
    } else {
      const [speaker, ...copy] = rest;
      if (h1) out.push(heading(document, h1, "h1"));
      if (speaker) out.push(inline(document, speaker));
      out.push(sectionMetadata(document, "serif"), el(document, "hr"));
      copy.forEach((n) => out.push(inline(document, n)));
      if (copy.length) out.push(sectionMetadata(document, "p-1-25"), el(document, "hr"));
    }
    const block = video(document, src);
    if (block) out.push(block);
    return out;
  }
  function layoutB(document, src) {
    const hero = src.querySelector(".c-page-hero");
    const out = [];
    hero.querySelectorAll("h1, h2").forEach((h) => {
      if (text(h)) out.push(heading(document, h, h.tagName.toLowerCase()));
    });
    out.push(sectionMetadata(document, "h-serif"), el(document, "hr"));
    const block = video(document, src);
    if (block) out.push(block);
    if (hero.querySelector(".border-bottom-gold")) out.push(sectionMetadata(document, "separator"));
    const desc = [...src.querySelectorAll(".c-standalone-video .desc-content :is(h1, h2, h3, h4, h5, h6, p)")].filter((n) => text(n));
    const speakers = desc.filter((n) => /^H/.test(n.tagName));
    const copy = desc.filter((n) => !/^H/.test(n.tagName));
    if (speakers.length) {
      out.push(el(document, "hr"), ...speakers.map((n) => inline(document, n)));
      out.push(sectionMetadata(document, "serif, p-1-25"));
    }
    if (copy.length) out.push(el(document, "hr"), ...copy.map((n) => inline(document, n)));
    return out;
  }
  function image(document, source) {
    const img = document.createElement("img");
    img.src = source.getAttribute("src");
    img.alt = clean(source.getAttribute("alt"));
    return img;
  }
  function imageTarget(document, source, label) {
    const anchor = source.closest("a[href]");
    if (!anchor) return null;
    const p = document.createElement("p");
    p.append(link(document, anchor, label));
    return p;
  }
  function layoutC(document, src) {
    const out = [];
    const xf = src.querySelector(".experiencefragment");
    if (xf) {
      xf.querySelectorAll(".c-rich-text-editor p a[href]").forEach((a) => {
        const p = document.createElement("p");
        p.append(link(document, a));
        out.push(p);
      });
      xf.querySelectorAll(".c-standalone-image img").forEach((img) => {
        const p = document.createElement("p");
        p.append(image(document, img));
        out.push(p);
        const target = imageTarget(document, img, clean(img.getAttribute("alt")));
        if (target) out.push(target);
      });
      out.push(sectionMetadata(document, "back-link, image-link"), el(document, "hr"));
    }
    richText(src).filter((n) => !n.closest(".experiencefragment")).forEach((n) => {
      if (n.matches("h1")) out.push(heading(document, n, "h1"));
      else if (n.querySelector(".standalone-link") && n.querySelectorAll("a[href]").length === 1) {
        const p = document.createElement("p");
        p.append(link(document, n.querySelector("a[href]")));
        out.push(p);
      } else if (/^H/.test(n.tagName)) out.push(el(document, n.tagName.toLowerCase(), text(n)));
      else out.push(inline(document, n));
    });
    out.push(sectionMetadata(document, "h1-1-5"));
    src.querySelectorAll(".c-accordion .panel").forEach((panel) => {
      const label = text(panel.querySelector(".panel-title"));
      const cells = [...panel.querySelectorAll('.panel-body [class*="col-md-"]')].map((col) => {
        const cell = [];
        const img = col.querySelector(".c-standalone-image img");
        const title = text(col.querySelector(".c-rich-text-editor h4"));
        if (img) {
          const p = document.createElement("p");
          p.append(image(document, img));
          cell.push(p);
          const target = imageTarget(document, img, title || clean(img.getAttribute("alt")));
          if (target) cell.push(target);
        }
        col.querySelectorAll(".c-rich-text-editor :is(h1, h2, h3, h4, h5, h6, p)").forEach((n) => {
          if (!text(n)) return;
          if (/^H/.test(n.tagName)) cell.push(wrap(document, el(document, "strong", text(n)), "h3"));
          else if (n.querySelector(".standalone-link") && n.querySelectorAll("a[href]").length === 1) {
            const p = document.createElement("p");
            p.append(wrap(document, link(document, n.querySelector("a[href]")), "strong", "u"));
            cell.push(p);
          } else cell.push(inline(document, n));
        });
        return cell;
      }).filter((cell) => cell.length);
      out.push(el(document, "hr"));
      if (label) out.push(el(document, "h2", label));
      if (cells.length) out.push(WebImporter.Blocks.createBlock(document, { name: "Columns", cells: [cells] }));
      out.push(sectionMetadata(document, "accordion-panel, image-link, large-labels"));
    });
    return out;
  }
  function disclaimerSection(document, src) {
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text(p)).map((p) => el(document, "p", text(p)));
    if (!paras.length) return [];
    return [el(document, "hr"), ...paras, sectionMetadata(document, "disclaimer")];
  }
  var import_corp_webinar_default = {
    transform: (payload) => {
      var _a;
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.querySelector(".main.content") || document.body;
      let layout = "A";
      if (src.querySelector(".c-accordion")) layout = "C";
      else if (src.querySelector(".c-page-hero")) layout = "B";
      const content = { A: layoutA, B: layoutB, C: layoutC }[layout](document, src);
      const main = document.createElement("div");
      main.append(...content, ...disclaimerSection(document, document.body));
      while ((_a = main.lastElementChild) == null ? void 0 : _a.matches("hr")) main.lastElementChild.remove();
      document.body.replaceChildren(main);
      executeTransformers("afterTransform", main, payload);
      main.querySelectorAll("a[data-live]").forEach((a) => {
        const hash = a.getAttribute("href").endsWith("#_blank") ? "#_blank" : "";
        a.setAttribute("href", `${a.getAttribute("data-live")}${hash}`);
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
      const blocks = [...main.querySelectorAll("table")].map((t) => text(t.querySelector("tr")).toLowerCase()).filter((name) => !/^(section metadata|metadata)$/.test(name));
      return [{
        element: main,
        path,
        report: {
          title: meta.Title || document.title,
          template: PAGE_TEMPLATE.name,
          layout,
          blocks
        }
      }];
    }
  };
  return __toCommonJS(import_corp_webinar_exports);
})();
