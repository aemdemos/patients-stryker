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

  // tools/importer/import-news-shared-fragments.js
  var import_news_shared_fragments_exports = {};
  __export(import_news_shared_fragments_exports, {
    default: () => import_news_shared_fragments_default
  });

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_HOST_RE = /^https?:\/\/patients\.stryker\.com(?=[/?#]|$)/i;
  function rewriteSourceLink(href) {
    if (!href) return null;
    const value = href.trim();
    let rest;
    if (value.startsWith("/") && !value.startsWith("//")) rest = value;
    else if (SOURCE_HOST_RE.test(value)) rest = value.replace(SOURCE_HOST_RE, "") || "/";
    else return null;
    const [, path, suffix = ""] = rest.match(/^([^?#]*)([?#].*)?$/);
    if (!/\.html?$/i.test(path) || path.startsWith("/content/dam/")) return null;
    let edsPath = path.replace(/\.html?$/i, "");
    if (/(^|\/)index$/i.test(edsPath)) edsPath = edsPath.replace(/index$/i, "");
    return `${edsPath || "/"}${suffix}`;
  }
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
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
      element.querySelectorAll("a[href]").forEach((a) => {
        const rewritten = rewriteSourceLink(a.getAttribute("href"));
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

  // tools/importer/xf-fragment-map.js
  var xf_fragment_map_default = {
    "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master": {
      path: "/us/en/fragments/acute-care/resources",
      name: 'Acute Care "Resources" links'
    },
    "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master": {
      path: "/us/en/fragments/emergency-care/resources",
      name: 'Emergency Care "Resources" links'
    },
    "/content/experience-fragments/stryker/sage/en/footer/footer/master": {
      path: "/us/en/fragments/sage/resources",
      name: 'Sage "Resources" links'
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master": {
      path: "/us/en/fragments/sustainability/connect-with-us",
      name: 'Sustainability "Connect with us" band (above the form)'
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master": {
      path: "/us/en/fragments/sustainability/contact",
      name: "Sustainability contact aside (next to the form)"
    },
    "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master": {
      path: "/us/en/fragments/sage/contact",
      name: "Sage contact aside (LinkedIn / Facebook icons)"
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop": {
      path: "/us/en/fragments/careers/talent-network-banner",
      name: '"Join our talent network" banner (carousel slide; mobile slide: \u2026/join-our-talent-network-v2-mobile1)'
    }
  };

  // tools/importer/xf-fragment-path.js
  function xfKey(xf) {
    return String(xf || "").replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/\.html$/i, "");
  }
  function xfFragmentPath(xf) {
    const entry = xf_fragment_map_default[xfKey(xf)];
    return entry ? entry.path : null;
  }

  // tools/importer/import-news-shared-fragments.js
  var FRAGMENTS = {
    "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master": {
      type: "resources",
      style: "bu-resources, p-1-25"
    },
    "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master": {
      type: "resources",
      style: "bu-resources, p-1-25, label-1-5"
    },
    "/content/experience-fragments/stryker/sage/en/footer/footer/master": {
      type: "resources",
      style: "bu-resources, p-1-25"
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master": {
      type: "connect",
      style: "connect-band"
    },
    "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master": {
      type: "contact",
      style: "contact-aside"
    },
    "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master": {
      type: "contact",
      style: "contact-aside"
    },
    // The talent banner is a carousel slide. The XF master holds an older desktop image
    // with a button drawn into it; the slide on the 4 pages that share it shows the _v2
    // images (no drawn button) with a real CTA button on top, so those are carried here.
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop": {
      type: "banner",
      style: "talent-banner",
      desktopImage: "https://media-assets.stryker.com/is/image/stryker/JoinOurTalentNetwork_carousel_desktop_v2?$max_width_auto$",
      mobileImage: "https://media-assets.stryker.com/is/image/stryker/JoinOurTalentNetwork_carousel_mobile_v2?$max_width_1440$",
      cta: { text: "Join our talent network", href: "http://adtrk.tw/tp/rj6.uW9E.z-K" }
    }
  };
  var PAGE_TEMPLATE = {
    name: "news-shared-fragments",
    description: "Shared Experience Fragments of the news-detail pages, imported as fragment documents.",
    urls: Object.keys(FRAGMENTS).map((p) => `https://www.stryker.com${p}.html`),
    blocks: []
  };
  var transformers = [transform];
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
  function corpLink(href) {
    const m = (href || "").match(/^https?:\/\/www\.stryker\.com(\/us\/en\/[^?#]*?)(index)?\.html([?#].*)?$/i);
    if (!m) return href;
    return `${m[2] ? m[1] : m[1]}${m[3] || ""}`;
  }
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function linkPara(document, a, standalone) {
    const p = document.createElement("p");
    const link = document.createElement("a");
    link.href = corpLink(a.getAttribute("href"));
    if (standalone) {
      const u = document.createElement("u");
      u.textContent = text(a);
      link.append(u);
    } else {
      link.textContent = text(a);
    }
    p.append(link);
    return p;
  }
  var isStandalone = (a) => !!(a.closest(".standalone-link") || a.querySelector(".standalone-link"));
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function buildResources(document, src) {
    const out = [];
    const h2 = document.createElement("h2");
    h2.textContent = text(src.querySelector(".c-section-title h2")) || "Resources";
    out.push(h2);
    const cells = [...src.querySelectorAll(".c-rich-text-editor")].map((rte) => {
      const cell = [];
      rte.querySelectorAll("p").forEach((p) => {
        const a = p.querySelector("a[href]");
        if (a) {
          cell.push(linkPara(document, a, false));
        } else if (text(p)) {
          const lp = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = text(p);
          lp.append(strong);
          cell.push(lp);
        }
      });
      return cell;
    }).filter((c) => c.length);
    out.push(WebImporter.Blocks.createBlock(document, { name: "Columns", cells: [cells] }));
    return out;
  }
  function buildConnect(document, src) {
    const out = [];
    const h2 = document.createElement("h2");
    h2.textContent = text(src.querySelector("h2"));
    out.push(h2);
    src.querySelectorAll(".c-rich-text-editor p").forEach((p) => {
      if (!text(p)) return;
      const np = document.createElement("p");
      p.childNodes.forEach((n) => {
        if (n.nodeType === 3) np.append(document.createTextNode(n.textContent.replace(/ /g, " ")));
        else if (n.nodeName === "A") {
          const a = document.createElement("a");
          a.href = corpLink(n.getAttribute("href"));
          a.textContent = text(n);
          np.append(a);
        } else np.append(document.createTextNode(n.textContent));
      });
      const last = np.lastChild;
      if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
      out.push(np);
    });
    return out;
  }
  function buildContact(document, src) {
    const out = [];
    src.querySelectorAll(".c-rich-text-editor p").forEach((p) => {
      const a = p.querySelector("a[href]");
      if (a) out.push(linkPara(document, a, isStandalone(a)));
    });
    src.querySelectorAll("a.btn").forEach((btn) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.href = corpLink(btn.getAttribute("href"));
      a.textContent = text(btn);
      strong.append(a);
      p.append(strong);
      out.push(p);
    });
    const icons = [...src.querySelectorAll(".c-standalone-image a[href]")].map((a) => {
      const href = a.getAttribute("href");
      const name = /linkedin/i.test(href) ? "linkedin" : /facebook/i.test(href) ? "facebook" : "";
      return name ? { href, name } : null;
    }).filter(Boolean);
    if (icons.length) {
      const p = document.createElement("p");
      icons.forEach(({ href, name }) => {
        const a = document.createElement("a");
        a.href = href;
        a.title = name === "linkedin" ? "LinkedIn" : "Facebook";
        a.textContent = `:${name}:`;
        p.append(a);
      });
      out.push(p);
    }
    return out;
  }
  function buildBanner(document, src, def) {
    const out = [];
    const img = src.querySelector("img[src]");
    const dmLink = (href, label) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      p.append(a);
      return p;
    };
    const desktop = def.desktopImage || img && img.getAttribute("src");
    if (desktop) out.push(dmLink(desktop, "Join our talent network"));
    if (def.mobileImage) out.push(dmLink(def.mobileImage, "Join our talent network (mobile)"));
    if (def.cta) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.href = def.cta.href;
      a.textContent = def.cta.text;
      strong.append(a);
      p.append(strong);
      out.push(p);
    }
    return out;
  }
  var import_news_shared_fragments_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const key = new URL(params.originalURL || url).pathname.replace(/\.html$/, "");
      const def = FRAGMENTS[key];
      if (!def) throw new Error(`Not a mapped shared fragment: ${key}`);
      const src = document.body;
      const main = document.createElement("div");
      const build = { resources: buildResources, connect: buildConnect, contact: buildContact, banner: buildBanner }[def.type];
      main.append(...build(document, src, def));
      main.append(sectionMetadata(document, def.style));
      document.body.replaceChildren(main);
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = xfFragmentPath(key);
      if (!path) throw new Error(`Shared fragment missing from xf-fragment-map.js: ${key}`);
      return [{
        element: main,
        path,
        report: {
          title: path,
          template: PAGE_TEMPLATE.name,
          source: key,
          style: def.style
        }
      }];
    }
  };
  return __toCommonJS(import_news_shared_fragments_exports);
})();
