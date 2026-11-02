/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-news-xf.js
  var import_news_xf_exports = {};
  __export(import_news_xf_exports, {
    default: () => import_news_xf_default
  });

  // tools/importer/parsers/hero-image-slide.js
  function copyImage(source, document) {
    const img = document.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return img;
  }
  function clean(text2) {
    return (text2 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function headline(overlay, document) {
    const out = [];
    const headings = [...overlay.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const lines = headings.length ? headings : [...overlay.querySelectorAll(".line, p")];
    lines.forEach((line) => {
      if (!clean(line.textContent)) return;
      const el = document.createElement(/^H[1-6]$/.test(line.tagName) ? line.tagName.toLowerCase() : "p");
      const box = document.createElement("div");
      box.innerHTML = line.innerHTML;
      box.querySelectorAll("span.futura-bold, b").forEach((span) => {
        const strong = document.createElement("strong");
        while (span.firstChild) strong.append(span.firstChild);
        span.replaceWith(strong);
      });
      box.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
      box.querySelectorAll("strong strong").forEach((s) => s.replaceWith(...s.childNodes));
      box.querySelectorAll("*").forEach((node) => {
        [...node.attributes].forEach((attr) => {
          if (!(node.tagName === "A" && attr.name === "href")) node.removeAttribute(attr.name);
        });
      });
      while (box.firstChild && box.firstChild.nodeType === 3 && !box.firstChild.textContent.trim()) box.firstChild.remove();
      while (box.lastChild && box.lastChild.nodeType === 3 && !box.lastChild.textContent.trim()) box.lastChild.remove();
      while (box.firstChild) el.append(box.firstChild);
      out.push(el);
    });
    return out;
  }
  function percent(style, re) {
    const m = style.match(re);
    return m ? String(parseFloat(m[1])).replace(".", "-") : null;
  }
  function parse(element, { document }) {
    const slide = element.querySelector(".carouselslide:not(.slick-cloned)") || element;
    const desktop = slide.querySelector(".experienceFragment-ef img");
    const mobile = slide.querySelector(".experienceFragment-ef-mobile img");
    const overlay = slide.querySelector(".overlayparsys");
    const first = desktop || mobile || slide.querySelector("img");
    if (!first) return;
    const variants = ["image-slide"];
    const cells = [[copyImage(first, document)]];
    if (desktop && mobile) cells.push([copyImage(mobile, document)]);
    if (overlay) {
      const lines = headline(overlay, document);
      if (lines.length) cells.push([lines]);
      const style = overlay.getAttribute("style") || "";
      const top = percent(style, /top:\s*(\d+(?:\.\d+)?)%/i);
      const left = percent(style, /margin-left:\s*(\d+(?:\.\d+)?)%/i);
      const right = percent(style, /width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i);
      if (top !== null) variants.push(`top-${top}`);
      if (left !== null) variants.push(`left-${left}`);
      if (right !== null) variants.push(`right-${right}`);
      const sized = overlay.querySelector('[class*="fontsize-"][class*="vw"]');
      const size = sized && sized.className.match(/fontsize-(\d+)(?:-(5))?-?vw/);
      if (size) variants.push(size[2] ? `size-${size[1]}-5` : `size-${size[1]}`);
      if (overlay.classList.contains("mobile_Bottom")) variants.push("text-below");
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document, {
      name: `Hero Corp (${variants.join(", ")})`,
      cells
    }));
  }

  // tools/importer/parsers/cards-corp-teaser.js
  function clean2(text2) {
    return (text2 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function link(document, source, text2) {
    const a = document.createElement("a");
    a.setAttribute("href", source.getAttribute("href"));
    a.textContent = text2;
    return a;
  }
  function imageCell(item, document) {
    const source = item.querySelector(".img-cont img, img");
    const img = document.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return [img];
  }
  function textCell(item, document) {
    const body = [];
    const title = item.querySelector("h3");
    if (title && clean2(title.textContent)) {
      const h3 = document.createElement("h3");
      const titleLink = title.querySelector("a[href]");
      if (titleLink) h3.append(link(document, titleLink, clean2(titleLink.textContent)));
      else h3.textContent = clean2(title.textContent);
      body.push(h3);
    }
    item.querySelectorAll(".desc-container > p").forEach((source) => {
      if (!clean2(source.textContent)) return;
      const p = document.createElement("p");
      p.textContent = clean2(source.textContent);
      body.push(p);
    });
    const cta = item.querySelector("a.action-link[href]");
    if (cta && clean2(cta.textContent)) {
      const a = link(document, cta, "");
      const u = document.createElement("u");
      u.textContent = clean2(cta.textContent);
      a.append(u);
      const strong = document.createElement("strong");
      strong.append(a);
      const p = document.createElement("p");
      p.append(strong);
      body.push(p);
    }
    return body;
  }
  function parse2(element, { document }) {
    const items = [...element.querySelectorAll(".item")].filter((item) => item.querySelector("img"));
    if (!items.length) return;
    const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Cards Corp (teaser)", cells }));
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
  function parse3(element, { document }) {
    const link2 = videoLink(element, document);
    if (!link2) return;
    const cells = [[link2]];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Video", cells }));
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

  // tools/importer/transformers/news-detail-sections.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
  var COMPONENTS = [
    ".c-autocarousel",
    ".c-standalone-image",
    ".c-rich-text-editor",
    ".c-standalone-video",
    ".c-curatedcta",
    // a Button Set (.buttonset > .button-group > a.btn, e.g. the gold "Read the full
    // statement" / "DONATE" buttons on Sage news) imports like a Curated CTA
    ".buttonset",
    ".c-largeheadline",
    ".c-section-title",
    ".c-customizeable",
    ".c-section-separator",
    ".sectionseparator"
  ].join(", ");
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
  var KEEP_ATTRS = { A: ["href"], IMG: ["src", "alt"], TD: ["colspan", "rowspan"], TH: ["colspan", "rowspan"] };
  function text(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function rename(el, tagName) {
    const doc = el.ownerDocument;
    const next = doc.createElement(tagName);
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function unwrap(el) {
    el.replaceWith(...el.childNodes);
  }
  function absoluteAsset(href) {
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN}${href}` : href;
  }
  function newTabHref(source, href) {
    if (!href || href.includes("#") || /^(mailto|tel):/i.test(href)) return href;
    const isPdf = /\.pdf(\?|$)/i.test(href);
    const newTab = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || newTab ? `${href}#_blank` : href;
  }
  var SIZE_STYLES = [
    // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph)
    ["fontsize-8em", "disclaimer"],
    ["fontsize-1-25em", "p-1-25"],
    ["fontsize-1-5em", "p-1-5"],
    ["fontsize-1-75em", "p-1-75"],
    ["fontsize-2em", "p-2"]
  ];
  var FONT_STYLES = [
    ["urw-egyptienne", "serif"]
  ];
  function copyStyles(root) {
    const candidates = root.matches && root.matches("p, li") ? [root] : [...root.querySelectorAll("p, li")];
    const copy = candidates.filter((el) => text(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers2 = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
    });
    const size = SIZE_STYLES.find(([cls]) => covers2(cls));
    const font = FONT_STYLES.find(([cls]) => covers2(cls));
    return [size && size[1], font && font[1]].filter(Boolean).join(", ");
  }
  function sameLineText(node, direction) {
    let value = "";
    let sibling = node[direction];
    while (sibling && sibling.nodeName !== "BR") {
      value += sibling.textContent;
      sibling = sibling[direction];
    }
    return value.replace(/[\s\u00a0]+/g, "");
  }
  function tagPlainBoldLabels(root, wholeParagraphs) {
    const doc = root.ownerDocument;
    [...root.querySelectorAll("b")].forEach((b) => {
      if (b.closest(".futura-bold") || b.querySelector(".futura-bold") || b.parentElement.closest("b")) return;
      if (!text(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text(block) === text(b)) return;
      b.before(doc.createTextNode("[[body-font]"));
      b.after(doc.createTextNode("]"));
    });
  }
  var GOLD = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i;
  function ownColour(el) {
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? m[1].trim() : "";
  }
  function hasOtherColour(node) {
    if (node.nodeType !== 1) return false;
    const coloured = [node, ...node.querySelectorAll('[style*="color"]')].filter((el) => ownColour(el) && !GOLD.test(ownColour(el)));
    return coloured.some((el) => [...el.childNodes].some((child) => child.nodeType === 3 ? child.textContent.trim() : !ownColour(child) && text(child)));
  }
  function bracketTag(nodes, classes, root) {
    const doc = root.ownerDocument;
    const run = [...nodes];
    const loose = (n) => n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim();
    while (run.length && loose(run[0])) run.shift();
    while (run.length && loose(run[run.length - 1])) run.pop();
    if (!run.length || !run.some((n) => n.textContent.trim())) return;
    const open = doc.createTextNode(`[[${classes}]`);
    const close = doc.createTextNode("]");
    run[0].before(open);
    run[run.length - 1].after(close);
    const edge = (n, dir) => {
      let s = n[dir];
      while (s && s.nodeType === 3 && !s.textContent.trim()) s = s[dir];
      return s;
    };
    let parent = open.parentElement;
    while (parent && parent !== root && parent === close.parentElement && !parent.matches("p, li, h1, h2, h3, h4, h5, h6, a, div") && !edge(open, "previousSibling") && !edge(close, "nextSibling")) {
      parent.before(open);
      parent.after(close);
      parent = open.parentElement;
    }
  }
  function tagTextSize(root) {
    const squash = (value) => value.replace(/[\s ]+/g, "");
    [...root.querySelectorAll(".fontsize-1-25em")].forEach((span) => {
      if (span.parentElement.closest(".fontsize-1-25em") || !text(span)) return;
      const block = span.closest("p, li");
      if (!block || span.closest("h1, h2, h3, h4, h5, h6")) return;
      if (squash(block.textContent) === squash(span.textContent)) return;
      bracketTag([span], "text-1-25", root);
    });
  }
  function tagGoldText(root) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap = (nodes) => bracketTag(nodes, "color-gold", root);
    root.querySelectorAll('[style*="color"]').forEach((el) => {
      if (!GOLD.test(ownColour(el)) || [...tagged].some((t) => t.contains(el))) return;
      tagged.add(el);
      if (!hasOtherColour(el)) {
        wrap([el]);
        return;
      }
      let run = [];
      [...el.childNodes].forEach((child) => {
        if (hasOtherColour(child)) {
          wrap(run);
          run = [];
        } else run.push(child);
      });
      wrap(run);
    });
  }
  function cleanRichText(root, { wholeParagraphs = false } = {}) {
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text(el));
    const centred = blocks.length > 0 && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute("style") || ""));
    const size = copyStyles(root);
    const doc = root.ownerDocument;
    root.querySelectorAll('a:not([href]), a[href=""]').forEach(unwrap);
    const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== "BR" && !node.textContent.trim() && !node.querySelector("img, br");
    const trailingSpace = /[\s\u00a0]+$/;
    [...root.querySelectorAll("span.futura-bold, b, i, em, strong")].reverse().forEach((el) => {
      let last = el.lastChild;
      while (last && (last.nodeName === "BR" || emptyElement(last) || last.nodeType === 3 && !last.textContent.trim())) {
        if (emptyElement(last)) {
          if (/[\s\u00a0]/.test(last.textContent) && !(el.nextSibling && /^[\s\u00a0]/.test(el.nextSibling.textContent))) {
            el.after(doc.createTextNode(" "));
          }
          last.remove();
        } else el.after(last);
        last = el.lastChild;
      }
      if (last && last.nodeType === 3 && trailingSpace.test(last.textContent)) {
        last.textContent = last.textContent.replace(trailingSpace, "");
        el.after(doc.createTextNode(" "));
      }
    });
    tagPlainBoldLabels(root, wholeParagraphs);
    tagGoldText(root);
    tagTextSize(root);
    const standalone = /* @__PURE__ */ new Set();
    root.querySelectorAll(".standalone-link").forEach((span) => {
      const a = span.closest("a") || span.querySelector("a");
      if (a) standalone.add(a);
    });
    standalone.forEach((a) => {
      const u = doc.createElement("u");
      while (a.firstChild) u.append(a.firstChild);
      a.append(u);
      const strong = doc.createElement("strong");
      a.replaceWith(strong);
      strong.append(a);
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => {
      if (!el.closest("p, li") || el.closest("h1, h2, h3, h4, h5, h6")) {
        rename(el, "strong");
        return;
      }
      const strong = rename(el, "strong");
      const em = root.ownerDocument.createElement("em");
      while (strong.firstChild) em.append(strong.firstChild);
      strong.append(em);
    });
    root.querySelectorAll("b").forEach((el) => rename(el, "strong"));
    root.querySelectorAll("i").forEach((el) => rename(el, "em"));
    root.querySelectorAll("span, font").forEach(unwrap);
    root.querySelectorAll("strong strong, em em").forEach(unwrap);
    root.querySelectorAll("strong, em").forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector("img, br")) el.remove();
    });
    root.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("href", newTabHref(a, absoluteAsset(a.getAttribute("href"))));
    });
    root.querySelectorAll("*").forEach((el) => {
      const keep = KEEP_ATTRS[el.tagName] || [];
      [...el.attributes].forEach((attr) => {
        if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
      });
    });
    root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach((el) => {
      while (el.lastChild && (el.lastChild.nodeName === "BR" || el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim())) {
        el.lastChild.remove();
      }
      if (!text(el) && !el.querySelector("img")) el.remove();
    });
    return { centred, size };
  }
  function plainBoldParagraphs(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.querySelectorAll("p")].filter((p) => {
      const all = squash(p.textContent);
      if (!all || p.querySelector(".futura-bold")) return false;
      const bold = [...p.querySelectorAll("b")].filter((b) => !b.parentElement.closest("b"));
      return squash(bold.map((b) => b.textContent).join("")) === all;
    }));
  }
  function serifHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.querySelectorAll("h3")].filter((h) => {
      if (!text(h) || h.querySelector(".futura-bold, b, strong")) return false;
      if (!h.querySelector("[class]")) return true;
      const spans = [...h.querySelectorAll(".urw-egyptienne")].filter((span) => !span.parentElement.closest(".urw-egyptienne"));
      return squash(spans.map((span) => span.textContent).join("")) === squash(h.textContent);
    }));
  }
  var LABEL_HEADING = /^(about stryker|media contacts?|contacts?|investor contacts?)\s*:?$/i;
  function labelHeadingsToParagraphs(root) {
    root.querySelectorAll("h2, h3, h4, h5, h6").forEach((h) => {
      if (!LABEL_HEADING.test(text(h))) return;
      const p = root.ownerDocument.createElement("p");
      while (h.firstChild) p.append(h.firstChild);
      p.querySelectorAll('span[class*="fontsize-"]').forEach(unwrap);
      if (!p.querySelector(".futura-bold")) {
        p.querySelectorAll("b, strong").forEach(unwrap);
        const bold = root.ownerDocument.createElement("span");
        bold.className = "futura-bold";
        while (p.firstChild) bold.append(p.firstChild);
        p.append(bold);
      }
      h.replaceWith(p);
    });
  }
  var HEADING_SIZES = [
    ["H2", "fontsize-8em", "h2-0-8"],
    ["H2", "fontsize-1-5em", "h2-1-5"],
    ["H1", "fontsize-1-25em", "h1-1-25"]
  ];
  function smallHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const styles = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2").forEach((h) => {
      if (!text(h)) return;
      const match = HEADING_SIZES.find(([tag, cls]) => {
        if (h.tagName !== tag) return false;
        const spans = [...h.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
        return squash(spans.map((span) => span.textContent).join("")) === squash(h.textContent);
      });
      if (match) styles.set(h, match[2]);
    });
    return styles;
  }
  function splitStyledLeads(root) {
    const doc = root.ownerDocument;
    const styled = [...SIZE_STYLES, ...FONT_STYLES].map(([cls]) => `.${cls}`).join(", ");
    [...root.children].filter((el) => el.tagName === "P").forEach((p) => {
      const nodes = [...p.childNodes];
      const at = nodes.findIndex((node, i) => node.nodeName === "BR" && nodes.slice(i + 1).find((next) => next.nodeType !== 3 || next.textContent.trim())?.nodeName === "BR");
      if (at < 1) return;
      const lead = doc.createElement("p");
      nodes.slice(0, at).forEach((node) => lead.append(node));
      const leadText = text(lead).replace(/[\s\u00a0]+/g, "");
      const covered = [...lead.querySelectorAll(styled)].filter((span) => !span.parentElement.closest(styled)).map((span) => span.textContent).join("").replace(/[\s\u00a0]+/g, "");
      if (!leadText || covered !== leadText || !text(p)) {
        p.prepend(...lead.childNodes);
        return;
      }
      while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
      p.before(lead);
    });
  }
  function richTextTitle(component, doc) {
    const p = component.querySelector("p");
    if (!p) return null;
    const nodes = [...p.childNodes];
    const at = nodes.findIndex((node) => node.nodeName === "BR");
    const lead = at < 0 ? nodes : nodes.slice(0, at);
    const squash = (value) => value.replace(/[\s ]+/g, " ").trim();
    const leadText = squash(lead.map((node) => node.textContent).join(""));
    if (!leadText) return null;
    const box = doc.createElement("div");
    lead.forEach((node) => box.append(node.cloneNode(true)));
    const large = squash([...box.querySelectorAll(".fontsize-1-5em")].filter((span) => !span.parentElement.closest(".fontsize-1-5em")).map((span) => span.textContent).join(""));
    if (large !== leadText || !box.querySelector(".futura-bold, b")) return null;
    const huge = squash([...box.querySelectorAll(".fontsize-2em")].filter((span) => !span.parentElement.closest(".fontsize-2em")).map((span) => span.textContent).join(""));
    const gold = [...box.querySelectorAll('[style*="color"]')].some((el) => GOLD.test(ownColour(el)) && !hasOtherColour(el) && squash(el.textContent) === leadText);
    lead.forEach((node) => node.remove());
    while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
    if (!text(p)) p.remove();
    const h1 = doc.createElement("h1");
    h1.textContent = gold ? `[[color-gold]${leadText}]` : leadText;
    h1.titleStyle = huge === leadText ? "h1-42" : "h1-21";
    return h1;
  }
  function blockNodes(container, doc) {
    const nodes = [];
    let run = [];
    const flush = () => {
      if (run.some((n) => n.nodeType === 3 ? n.textContent.trim() : text(n) || n.querySelector?.("img"))) {
        const p = doc.createElement("p");
        p.append(...run);
        while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
        while (p.lastChild && (p.lastChild.nodeName === "BR" || p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim())) p.lastChild.remove();
        nodes.push(p);
      }
      run = [];
    };
    [...container.childNodes].forEach((node) => {
      if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
        flush();
        if (text(node) || node.querySelector("img")) nodes.push(node);
      } else if (node.nodeType === 1 && node.tagName === "IMG") {
        flush();
        const p = doc.createElement("p");
        p.append(node);
        nodes.push(p);
      } else if (node.nodeType === 1 && ["DIV", "SECTION", "ARTICLE"].includes(node.tagName)) {
        flush();
        nodes.push(...blockNodes(node, doc));
      } else if (node.nodeType === 1 || node.nodeType === 3) {
        run.push(node);
      }
    });
    flush();
    return nodes;
  }
  function richTextNodes(component, doc) {
    const box = doc.createElement("div");
    const source = component.querySelector(":scope > div") || component;
    box.innerHTML = source.innerHTML;
    labelHeadingsToParagraphs(box);
    splitStyledLeads(box);
    const plainBold = plainBoldParagraphs(box);
    const serifHeads = serifHeadings(box);
    const smallHeads = smallHeadings(box);
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    const { centred, size } = cleanRichText(box);
    const nodes = blockNodes(box, doc);
    nodes.forEach((node) => {
      if (plainBold.has(node)) node.boldBody = true;
      if (serifHeads.has(node)) node.serifHeading = true;
      if (smallHeads.has(node)) node.headingStyle = smallHeads.get(node);
    });
    let last = null;
    nodes.forEach((node) => {
      const style = elementStyles.get(node);
      node.copyStyle = style === void 0 || style === null ? last : style;
      if (node.copyStyle !== null) last = node.copyStyle;
    });
    const first = nodes.find((node) => node.copyStyle !== null);
    nodes.forEach((node) => {
      if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : size || "";
    });
    return { nodes, centred, size };
  }
  function imageColumnStyle(component) {
    const col = component.closest('[class*="col-sm-"]');
    const match = col && col.className.match(/\bcol-sm-(4|6)\b/);
    if (!match) return "";
    const others = [...col.parentElement.children].filter((el) => el !== col);
    if (others.some((el) => text(el) || el.querySelector("img, video, iframe"))) return "";
    return match[1] === "4" ? "image-1-3" : "image-1-2";
  }
  function imageNodes(component, doc) {
    const nodes = [...component.querySelectorAll("img")].flatMap((source) => {
      const img = doc.createElement("img");
      img.setAttribute("src", source.getAttribute("src"));
      img.setAttribute("alt", source.getAttribute("alt") || "");
      const p = doc.createElement("p");
      p.append(img);
      const sourceLink = source.closest("a[href]");
      if (!sourceLink) return [p];
      const href = absoluteAsset(sourceLink.getAttribute("href"));
      const a = doc.createElement("a");
      a.setAttribute("href", newTabHref(sourceLink, href));
      a.textContent = (source.getAttribute("alt") || "").trim() || href;
      const linkLine = doc.createElement("p");
      linkLine.append(a);
      p.imageLink = true;
      return [p, linkLine];
    });
    if (nodes.length) {
      component.querySelectorAll(".title-content :is(h2, h3, h4, h5)").forEach((title) => {
        if (!text(title)) return;
        const h4 = doc.createElement("h4");
        h4.textContent = text(title);
        nodes.push(h4);
      });
      component.querySelectorAll(".c-standalone-image-content > p.u-white-space-pre").forEach((caption) => {
        if (!text(caption)) return;
        const p = doc.createElement("p");
        p.textContent = text(caption);
        nodes.push(p);
      });
    }
    return nodes;
  }
  function buttonNodes(component, doc) {
    return [...component.querySelectorAll("a[href]")].filter((a) => text(a)).map((source) => {
      const a = doc.createElement("a");
      a.setAttribute("href", newTabHref(source, absoluteAsset(source.getAttribute("href"))));
      a.textContent = text(source);
      const colour = ["btn-purple", "btn-blue"].find((cls) => source.classList.contains(cls));
      if (colour) a.setAttribute("data-btn-style", colour);
      const strong = doc.createElement("strong");
      if (source.classList.contains("btn-gold")) {
        const em = doc.createElement("em");
        em.append(a);
        strong.append(em);
      } else {
        strong.append(a);
      }
      const p = doc.createElement("p");
      p.append(strong);
      return p;
    });
  }
  function headlineNodes(component, doc) {
    const box = doc.createElement("div");
    box.innerHTML = component.innerHTML;
    const lines = [...box.querySelectorAll(".line")].map((line) => rename(line, "div"));
    lines.forEach((line) => line.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(unwrap));
    cleanRichText(box);
    return (lines.length ? lines : [box]).map((line) => {
      if (!text(line)) return null;
      const p = doc.createElement("p");
      while (line.firstChild) p.append(line.firstChild);
      return p;
    }).filter(Boolean);
  }
  function videoAside(video) {
    const col = video.closest('[class*="col-sm-8"], [class*="col-sm-6"]');
    const row = col && col.parentElement;
    const width = col && /\bcol-sm-6\b/.test(col.className) ? 6 : 4;
    const aside = row && [...row.children].find((el) => el !== col && new RegExp(`\\bcol-sm-${width}\\b`).test(el.className));
    const headline2 = aside && aside.querySelector(".c-largeheadline");
    return headline2 && text(headline2) ? headline2 : null;
  }
  function headlineVideo(headline2) {
    const col = headline2.closest('[class*="col-sm-6"]');
    const row = col && col.parentElement;
    const videoCol = row && [...row.children].find((el) => el !== col && /\bcol-sm-6\b/.test(el.className));
    const video = videoCol && videoCol.querySelector(".c-standalone-video");
    return video && video.querySelector("[data-asset-path], iframe[src]") ? video : null;
  }
  function videoTextAside(video) {
    const col = video.closest('[class*="col-sm-6"]');
    const row = col && col.parentElement;
    const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-6\b/.test(el.className));
    const rte = aside && aside.querySelector(".c-rich-text-editor");
    if (!rte || !text(rte) || aside.querySelector("img, video, iframe, .c-standalone-video")) return null;
    return rte;
  }
  function videoTextColumns(video, rte, doc) {
    const link2 = videoLink(video, doc);
    const { nodes } = richTextNodes(rte, doc);
    if (!link2 || !nodes.length) return null;
    const media = doc.createElement("p");
    media.append(link2);
    return WebImporter.Blocks.createBlock(doc, {
      name: "Columns (columns-50-50)",
      cells: [[media, nodes]]
    });
  }
  function quoteNodes(headline2, doc) {
    const box = doc.createElement("div");
    box.innerHTML = headline2.innerHTML;
    box.querySelectorAll('.futura-bold [style*="color"]').forEach((span) => {
      const bold = span.closest(".futura-bold");
      if (!GOLD.test(ownColour(span)) || !/^[“”"‘’']+$/.test(text(span)) || text(bold) === text(span)) return;
      const atStart = text(bold).startsWith(text(span));
      const mark = doc.createElement("span");
      mark.className = "futura-bold";
      mark.append(span);
      if (atStart) bold.before(mark);
      else bold.after(mark);
    });
    tagGoldText(box);
    box.querySelectorAll(".futura-bold").forEach((span) => {
      const strong = doc.createElement("strong");
      while (span.firstChild) strong.append(span.firstChild);
      if (/^[“”"‘’']+$/.test(text(strong))) {
        const em = doc.createElement("em");
        em.append(strong);
        span.replaceWith(em);
      } else span.replaceWith(strong);
    });
    box.querySelectorAll("span, font").forEach(unwrap);
    box.querySelectorAll("strong strong").forEach(unwrap);
    [...box.querySelectorAll("strong")].forEach((strong) => {
      if (!strong.parentNode) return;
      let next = strong.nextSibling;
      const following = (node) => node && node.nodeType === 3 && !node.textContent.trim() ? node.nextSibling : node;
      while (following(next) && following(next).nodeName === "STRONG") {
        if (next.nodeType === 3) strong.append(next);
        const run = strong.nextSibling;
        while (run.firstChild) strong.append(run.firstChild);
        run.remove();
        next = strong.nextSibling;
      }
    });
    box.querySelectorAll("em").forEach((em) => {
      const mark = em.firstElementChild;
      if (!mark || mark.tagName !== "STRONG" || em.childNodes.length !== 1) return;
      const next = em.nextSibling;
      const prev = em.previousSibling;
      const inner = doc.createElement("em");
      while (mark.firstChild) inner.append(mark.firstChild);
      if (next && next.nodeName === "STRONG") {
        next.prepend(inner);
        em.remove();
      } else if (prev && prev.nodeName === "STRONG") {
        prev.append(inner);
        em.remove();
      } else {
        mark.append(...inner.childNodes);
      }
    });
    [...box.querySelectorAll("em, strong")].reverse().forEach((el) => {
      while (el.lastChild && (el.lastChild.nodeName === "BR" || el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim())) {
        el.after(el.lastChild);
      }
    });
    const out = [];
    const blocks = box.querySelectorAll("p").length ? [...box.querySelectorAll("p")] : [box];
    blocks.forEach((block) => {
      let line = doc.createElement("p");
      const flush = () => {
        if (text(line)) out.push(line);
        line = doc.createElement("p");
      };
      [...block.childNodes].forEach((node) => {
        if (node.nodeName === "BR") flush();
        else line.append(node);
      });
      flush();
    });
    out.forEach((p) => p.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
    }));
    return out;
  }
  function videoHeadlineColumns(video, headline2, doc, asideQuotes = [], ctas = [], asideCtas = [], mirrored = false) {
    const link2 = videoLink(video, doc);
    const boxed = !!headline2.querySelector('.has-background, [class*="bg-light-gray"]');
    const quotes = boxed ? asideQuotes : [headline2, ...asideQuotes];
    const lines = boxed ? headlineNodes(headline2, doc) : [];
    if (!link2 || boxed && !lines.length) return null;
    const media = doc.createElement("p");
    media.append(link2);
    const buttons = ctas.flatMap((cta) => buttonNodes(cta, doc));
    const firstLine = headline2.querySelector(".line") || headline2;
    const big = firstLine.querySelector('[class*="fontsize-2vw"]') || !headline2.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
    const statement = big && lines.length ? [rename(lines[0], "h2"), ...lines.slice(1)] : lines;
    const half = /\bcol-sm-6\b/.test((video.closest('[class*="col-sm-"]') || video).className);
    return WebImporter.Blocks.createBlock(doc, {
      name: `Columns (${half ? "columns-50-50" : "columns-67-33"}, large-headline${boxed ? ", gray-lead" : ""})`,
      cells: [/* @__PURE__ */ ((mediaCell, textCell2) => mirrored ? [textCell2, mediaCell] : [mediaCell, textCell2])(
        [media, ...buttons],
        [
          ...statement,
          ...quotes.flatMap((q) => quoteNodes(q, doc)),
          // a button in the narrow column (under the quote, e.g. Esley) stays there
          ...asideCtas.flatMap((cta) => buttonNodes(cta, doc))
        ]
      )]
    });
  }
  function footnoteList(nodes, doc) {
    const NUMBERED = /^\s*(\d+)\s*[:.)]\s*/;
    const out = [];
    let ol = null;
    nodes.forEach((node) => {
      const match = node.tagName === "P" && node.textContent.match(NUMBERED);
      const next = ol ? ol.children.length + 1 : 1;
      if (match && Number(match[1]) === next) {
        if (!ol) {
          ol = doc.createElement("ol");
          out.push(ol);
        }
        const li = doc.createElement("li");
        while (node.firstChild) li.append(node.firstChild);
        ol.append(li);
        return;
      }
      ol = null;
      out.push(node);
    });
    out.converted = out.some((node) => node.tagName === "OL" && !nodes.includes(node));
    return out;
  }
  var SHARED_XF_SIGNATURES = [
    ["Resources Explore Acute Care homepage", "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"],
    ["Resources Explore Emergency Care homepage", "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"]
  ];
  var BLANK = /[\s\u00a0\u00ad\u2800\u3164\u200e\u200b]/g;
  var DIVIDER = /_{3,}/;
  function fragmentBlock(path, doc) {
    const a = doc.createElement("a");
    a.setAttribute("href", path);
    a.textContent = path;
    return WebImporter.Blocks.createBlock(doc, { name: "fragment", cells: [[a]] });
  }
  function markSharedFragments(main, doc) {
    main.querySelectorAll(".experiencefragment").forEach((xf) => {
      if (!xf.isConnected || xf.closest("header, footer, .modal")) return;
      const signature = text(xf);
      const match = SHARED_XF_SIGNATURES.find(([start]) => signature.startsWith(start));
      const path = match && xfFragmentPath(match[1]);
      if (!path) return;
      const marker = doc.createElement("div");
      marker.className = "xf-fragment";
      marker.setAttribute("data-fragment", path);
      xf.replaceWith(marker);
    });
  }
  var gridNumber = (el, re) => {
    const m = (el.className || "").match(re);
    return m ? Number(m[1]) : null;
  };
  var gridColumns = (grid) => gridNumber(grid, /\baem-Grid--(\d+)\b/) || 12;
  var itemSpan = (item, n) => gridNumber(item, /\baem-GridColumn--default--(\d+)\b/) || n;
  var itemOffset = (item) => gridNumber(item, /\baem-GridColumn--offset--default--(\d+)\b/) || 0;
  var gridItems = (grid) => [...grid.children].filter((el) => el.classList.contains("aem-GridColumn"));
  var nestedGrid = (item) => item.querySelector(":scope > .aem-Grid");
  var filled = (el) => !!el.querySelector("img") || !!(el.textContent || "").replace(BLANK, "");
  var SPAN_VARIANTS = {
    "5/3": "columns-67-33",
    "5/2": "columns-67-33",
    "8/4": "columns-67-33",
    "3/4": "columns-33-67",
    "3/5": "columns-33-67",
    "4/8": "columns-33-67",
    "3/9": "columns-33-67",
    "9/3": "columns-75-25",
    "9/2": "columns-75-25"
  };
  function spanVariant(spans) {
    if (spans.length !== 2 || spans[0] === spans[1]) return "";
    const known = SPAN_VARIANTS[spans.join("/")];
    if (known) return known;
    const ratio = spans[0] / (spans[0] + spans[1]);
    const [[, nearest]] = [[0.5, "columns-50-50"], [2 / 3, "columns-67-33"], [1 / 3, "columns-33-67"], [0.75, "columns-75-25"]].sort(([a], [b]) => Math.abs(a - ratio) - Math.abs(b - ratio));
    return nearest;
  }
  function liftDimensionalBox(item) {
    const box = item.querySelector(".dimensional-box");
    const boxItem = box && box.closest(".aem-GridColumn");
    if (!boxItem || boxItem === item) return [];
    const moved = [];
    for (let el = boxItem; el; el = el.nextElementSibling) {
      if (el.classList.contains("aem-GridColumn")) moved.push(el);
    }
    return moved;
  }
  function gridRows(grid, doc, fraction = 1) {
    const n = gridColumns(grid);
    const rows = [];
    let row = null;
    gridItems(grid).forEach((item) => {
      const span = itemSpan(item, n);
      const offset = itemOffset(item);
      if (row && row.used + offset + span <= n) {
        row.cells.push({ span, items: [item] });
        row.used += offset + span;
        return;
      }
      const last = row && row.cells[row.cells.length - 1];
      const others = row && row.cells.slice(0, -1).reduce((sum, cell) => sum + cell.span, 0);
      if (row && row.cells.length > 1 && span === last.span && row.cells[0].span !== span && others + span <= n) {
        last.items.push(item);
        return;
      }
      row = { used: offset + span, cells: [{ span, items: [item] }] };
      rows.push(row);
    });
    rows.forEach((r) => {
      const lifted = r.cells.length > 1 ? r.cells.flatMap((cell) => cell.items.flatMap(liftDimensionalBox)) : [];
      lifted.forEach((el) => el.setAttribute("data-xf-lifted", ""));
      const cells = r.cells.filter((cell) => cell.items.some((item) => {
        if (!lifted.length) return filled(item);
        const copy = item.cloneNode(true);
        copy.querySelectorAll("[data-xf-lifted]").forEach((el) => el.remove());
        return filled(copy);
      }));
      lifted.forEach((el) => el.removeAttribute("data-xf-lifted"));
      if (cells.length < 2) {
        r.cells.forEach((cell) => cell.items.forEach((item) => {
          const share = fraction * cell.span / n;
          const nested = nestedGrid(item);
          if (nested) gridRows(nested, doc, share);
          else if (item.querySelector(".c-standalone-image img")) {
            const style = share <= 1 / 3 + 0.01 && "image-1-3" || share <= 0.5 + 0.01 && "image-1-2" || "";
            if (style) item.querySelector(".c-standalone-image").setAttribute("data-xf-image-style", style);
          }
        }));
        return;
      }
      const marker = doc.createElement("div");
      marker.className = "xf-columns";
      const spans = cells.map((cell) => cell.span);
      marker.setAttribute("data-variant", spanVariant(spans));
      const pad = spans.every((s) => s === spans[0]) ? Math.floor(n / spans[0]) - cells.length : 0;
      r.cells[0].items[0].before(marker);
      cells.forEach((cell) => {
        const div = doc.createElement("div");
        div.className = "xf-cell";
        div.append(...cell.items);
        marker.append(div);
      });
      for (let i = 0; i < pad; i += 1) {
        const div = doc.createElement("div");
        div.className = "xf-cell";
        marker.append(div);
      }
      marker.after(...lifted);
    });
  }
  var paragraphsOf = (root) => [...root.querySelectorAll(".c-rich-text-editor p, .c-rich-text-editor div")].filter((el) => el.tagName === "P" || !el.querySelector("p, div, ul, ol, h1, h2, h3, h4, h5, h6, table"));
  var ruleText = (el) => (el.textContent || "").replace(/_{3,}/g, "").replace(BLANK, " ").replace(/\s+/g, " ").trim();
  var isDividerOnly = (el) => !!el && DIVIDER.test(el.textContent) && !ruleText(el);
  function coveredBy(el, selector) {
    const all = ruleText(el).replace(/\s/g, "");
    const styled = [...el.querySelectorAll(selector)].filter((s) => !s.parentElement.closest(selector)).map(ruleText).join("").replace(/\s/g, "");
    return !!all && styled === all;
  }
  function titleDivider(p) {
    const holder = DIVIDER.test(p.textContent) ? p : isDividerOnly(p.nextElementSibling) && p.nextElementSibling;
    if (!holder) return null;
    const walker = p.ownerDocument.createTreeWalker(holder, 4);
    const lines = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (DIVIDER.test(node.textContent) && /^[\s_\u00a0]*$/.test(node.textContent)) lines.push(node);
    }
    if (!lines.length) return null;
    const gold = [...lines].some((line) => {
      for (let e = line.parentElement; e && e !== holder.parentElement; e = e.parentElement) {
        if (ownColour(e)) return GOLD.test(ownColour(e));
      }
      return false;
    });
    return { gold, remove: () => holder === p ? lines.forEach((l) => l.remove()) : holder.remove() };
  }
  function titleHeading(p, tag, divider, doc) {
    const h = doc.createElement(tag);
    const value = ruleText(p);
    if (!divider) {
      h.textContent = value;
      return h;
    }
    const u = doc.createElement("u");
    u.textContent = divider.gold ? `[[rule-gold]${value}]` : value;
    h.append(u);
    return h;
  }
  function featureTitles(main, doc, hasTitle) {
    let h1 = null;
    paragraphsOf(main).forEach((p) => {
      if (!p.isConnected || !ruleText(p) || !p.querySelector(".futura-bold")) return;
      const divider = titleDivider(p);
      const big = coveredBy(p, ".fontsize-2em, .fontsize-2-5em");
      if (!hasTitle && !h1 && big) {
        h1 = titleHeading(p, "h1", divider, doc);
        if (divider) divider.remove();
        p.remove();
        return;
      }
      if (!divider || !coveredBy(p, ".futura-bold")) return;
      const h2 = titleHeading(p, "h2", divider, doc);
      divider.remove();
      p.replaceWith(h2);
    });
    return h1;
  }
  function dropBlankComponents(main) {
    main.querySelectorAll(".c-section-title, .c-rich-text-editor").forEach((el) => {
      if (!filled(el)) el.remove();
    });
  }
  function tidyParagraphs(main) {
    main.querySelectorAll(".experiencefragment .c-rich-text-editor sup").forEach((sup) => {
      const before = sup.previousSibling;
      const after = sup.nextSibling;
      const size = before && before.nodeType === 1 && [...before.classList].find((c) => c.startsWith("fontsize-"));
      if (!size || !after || after.nodeType !== 1 || !after.classList.contains(size)) return;
      before.append(sup, ...after.childNodes);
      after.remove();
    });
    main.querySelectorAll(".experiencefragment .c-rich-text-editor p").forEach((p) => {
      const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
      const sizes = new Set([...p.querySelectorAll('[class*="fontsize-"]')].flatMap((el) => [...el.classList].filter((c) => c.startsWith("fontsize-"))));
      sizes.forEach((size) => {
        const runs = [...p.querySelectorAll(`.${size}`)].filter((el) => !el.parentElement.closest(`.${size}`));
        if (runs.length < 2 || squash(runs.map((el) => el.textContent).join("")) !== squash(p.textContent)) return;
        runs.forEach((el) => el.classList.remove(size));
        const span = p.ownerDocument.createElement("span");
        span.className = size;
        span.append(...p.childNodes);
        p.append(span);
      });
      const walker = p.ownerDocument.createTreeWalker(p, 5);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeType === 1 && node.tagName === "BR") {
          node.remove();
          return;
        }
        if (node.nodeType === 3 ? node.textContent.trim() : node.tagName !== "SPAN") return;
      }
    });
  }
  function cellNodes(cell, doc) {
    const selector = COMPONENTS;
    return [...cell.querySelectorAll(selector)].filter((el) => !el.parentElement.closest(selector)).flatMap((component) => {
      if (component.matches(".c-rich-text-editor")) return richTextNodes(component, doc).nodes;
      if (component.matches(".c-standalone-image")) return imageNodes(component, doc);
      if (component.matches(".c-curatedcta, .buttonset")) return buttonNodes(component, doc);
      if (component.matches(".c-largeheadline, .c-section-title")) return headlineNodes(component, doc);
      return [];
    });
  }
  function xfColumns(marker, doc) {
    const cells = [...marker.children].map((cell) => cellNodes(cell, doc));
    const nodes = cells.flat();
    const variants = [marker.getAttribute("data-variant"), nodes.some((node) => node.imageLink) ? "media-pair" : ""].filter(Boolean);
    const name = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
    const copy = nodes.filter((node) => node.copyStyle !== void 0 && node.copyStyle !== null).sort((a, b) => text(b).length - text(a).length)[0];
    const style = copy ? copy.copyStyle : "";
    nodes.forEach((node) => {
      if (!(node.copyStyle || "").split(", ").includes("p-1-25") || style.split(", ").includes("p-1-25")) return;
      const lines = node.matches("ul, ol") ? [...node.querySelectorAll("li")] : [node];
      lines.filter((line) => line.matches("p, li") && text(line)).forEach((line) => {
        line.prepend(doc.createTextNode("[[text-1-25]"));
        line.append(doc.createTextNode("]"));
      });
    });
    const block = WebImporter.Blocks.createBlock(doc, { name, cells: [cells.map((c) => c.length ? c : "")] });
    return { block, style };
  }
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const templateName = payload && payload.template && payload.template.name;
    if (templateName !== "news-detail" && templateName !== "news-detail-xf") return;
    const xf = templateName === "news-detail-xf";
    const doc = element.ownerDocument;
    const main = doc.querySelector('[role="main"]') || element;
    const componentSelector = xf ? `${COMPONENTS}, .xf-columns, .xf-fragment` : COMPONENTS;
    const sections = [];
    let current = null;
    let separatorNext = false;
    const startSection = (kind, sectionStyle) => {
      const style = separatorNext ? ["separator", sectionStyle].filter(Boolean).join(", ") : sectionStyle;
      separatorNext = false;
      current = { kind, style, nodes: [] };
      sections.push(current);
      return current;
    };
    const title = startSection("title");
    const h1 = main.querySelector(".h1-title h1");
    const hasTitle = !!(h1 && text(h1));
    if (hasTitle) {
      const heading = doc.createElement("h1");
      heading.innerHTML = h1.innerHTML;
      cleanRichText(heading);
      title.nodes.push(heading);
    }
    const date = main.querySelector(".c-publish-date h5");
    if (date && text(date)) {
      const value = text(date);
      const m = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
      const month = m && "janfebmaraprmayjunjulaugsepoctnovdec".indexOf(m[2].toLowerCase()) / 3 + 1;
      element.setAttribute("data-first-published", month >= 1 && Number.isInteger(month) ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : value);
    }
    const location = main.querySelector(".c-event-location-properties h5");
    if (location && text(location)) {
      const h5 = doc.createElement("h5");
      h5.textContent = location.textContent.replace(/[\s ]+/g, " ").replace(/\s+,/g, ",").trim();
      title.nodes.push(h5);
    }
    if (xf) {
      markSharedFragments(main, doc);
      dropBlankComponents(main);
      tidyParagraphs(main);
      const feature = featureTitles(main, doc, hasTitle);
      if (feature) title.nodes.push(feature);
      main.querySelectorAll(".experiencefragment").forEach((fragment) => {
        const grid = fragment.querySelector(".aem-Grid");
        if (grid && !fragment.closest("header, footer, .modal")) gridRows(grid, doc);
      });
    }
    const components = [...main.querySelectorAll(componentSelector)].filter((el) => {
      const parent = el.parentElement && el.parentElement.closest(componentSelector);
      return !parent && !el.closest("header, footer, .modal");
    });
    const consumed = /* @__PURE__ */ new Set();
    const videoRowColumns = (video) => {
      const aside = videoAside(video);
      if (!aside) return false;
      const asideCol = aside.closest('[class*="col-sm-"]');
      const quotes = [...asideCol.querySelectorAll(".c-largeheadline")].filter((h) => h !== aside && text(h));
      const videoCol = video.closest('[class*="col-sm-"]');
      const ctas = [...videoCol.querySelectorAll(".c-curatedcta")].filter((c) => text(c));
      const asideCtas = [...asideCol.querySelectorAll(".c-curatedcta")].filter((c) => text(c));
      const cols = [...asideCol.parentElement.children];
      const mirrored = cols.indexOf(asideCol) < cols.indexOf(videoCol);
      const columns = videoHeadlineColumns(video, aside, doc, quotes, ctas, asideCtas, mirrored);
      if (!columns) return false;
      [aside, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
      element.setAttribute("data-news-theme", "full-width");
      startSection("columns").nodes.push(columns);
      current = null;
      return true;
    };
    let leadBelowDate = false;
    components.forEach((component) => {
      if (consumed.has(component)) return;
      const isFirst = current === title;
      if (component.matches(".xf-fragment")) {
        startSection("fragment").nodes.push(fragmentBlock(component.getAttribute("data-fragment"), doc));
        current = null;
        return;
      }
      if (component.matches(".xf-columns")) {
        const { block, style } = xfColumns(component, doc);
        if (!current || current.kind !== "xf-columns" || current.copy !== style) {
          startSection("xf-columns", style || void 0).copy = style;
        }
        current.nodes.push(block);
        return;
      }
      if (xf && component.matches(".c-rich-text-editor") && component.querySelector(".dimensional-box")) {
        const { nodes: nodes2 } = richTextNodes(component, doc);
        if (!nodes2.length) return;
        const copy = nodes2.find((node) => node.copyStyle);
        startSection("panel", copy ? copy.copyStyle : void 0).nodes.push(
          WebImporter.Blocks.createBlock(doc, { name: "Panel (left)", cells: [[nodes2]] })
        );
        current = null;
        return;
      }
      if (component.matches(".c-autocarousel")) {
        if (!component.querySelector("img")) return;
        startSection("hero").nodes.push(component);
        current = null;
        return;
      }
      if (component.matches(".c-standalone-image")) {
        const nodes2 = imageNodes(component, doc);
        if (!nodes2.length) return;
        const linkStyle = nodes2.some((node) => node.imageLink) ? "image-link" : "";
        const columnStyle = imageColumnStyle(component) || component.getAttribute("data-xf-image-style") || "";
        if (isFirst && !component.closest(".colctrl")) leadBelowDate = true;
        if (isFirst || columnStyle) {
          const style = [columnStyle, linkStyle].filter(Boolean).join(", ");
          startSection(isFirst ? "lead" : "image", style || void 0).nodes.push(...nodes2);
          current = null;
          return;
        }
        if (!current || !current.kind.startsWith("body")) startSection("body");
        if (linkStyle && !(current.style || "").split(", ").includes(linkStyle)) {
          current.style = [current.style, linkStyle].filter(Boolean).join(", ");
        }
        current.nodes.push(...nodes2);
        return;
      }
      if (component.matches(".c-section-separator, .sectionseparator")) {
        separatorNext = true;
        current = null;
        return;
      }
      if (component.matches(".c-customizeable")) {
        if (!component.querySelector(".item img")) return;
        const section = startSection("cards");
        const heading = component.querySelector("h2");
        if (heading && text(heading)) {
          const h2 = doc.createElement("h2");
          h2.textContent = text(heading);
          section.nodes.push(h2);
          heading.remove();
        }
        section.nodes.push(component);
        current = null;
        return;
      }
      if (component.matches(".c-largeheadline") && headlineVideo(component) && !consumed.has(headlineVideo(component))) {
        const video = headlineVideo(component);
        if (videoRowColumns(video)) {
          consumed.add(video);
          return;
        }
      }
      if (component.matches(".c-standalone-video")) {
        if (!component.querySelector("[data-asset-path], iframe[src]")) return;
        if (videoRowColumns(component)) return;
        const textAside = videoTextAside(component);
        const textColumns = textAside && videoTextColumns(component, textAside, doc);
        if (textColumns) {
          consumed.add(textAside.closest(COMPONENTS) || textAside);
          element.setAttribute("data-news-theme", "full-width");
          startSection("columns").nodes.push(textColumns);
          current = null;
          return;
        }
        const columnStyle = imageColumnStyle(component);
        if (columnStyle) {
          startSection("video", columnStyle).nodes.push(component);
          current = null;
          return;
        }
        if (!current || current.kind !== "body") startSection("body");
        current.nodes.push(component);
        return;
      }
      const headlineStyle = component.matches(".c-largeheadline") && [
        ['[class*="fontsize-2vw"]', "headline-2vw"],
        ['[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]', "headline-1-5vw"]
      ].find(([selector]) => component.querySelector(selector));
      if (isFirst && !hasTitle && headlineStyle && text(component)) {
        const lines = headlineNodes(component, doc);
        if (lines.length) {
          const heading = rename(lines[0], "h1");
          heading.querySelectorAll("strong, em").forEach(unwrap);
          startSection("headline", headlineStyle[1]).nodes.push(heading, ...lines.slice(1));
          current = null;
          return;
        }
      }
      if (isFirst && !hasTitle && component.matches(".c-rich-text-editor")) {
        const heading = richTextTitle(component, doc);
        if (heading) {
          startSection("headline", heading.titleStyle).nodes.push(heading);
          current = null;
        }
      }
      if (component.matches(".c-curatedcta, .buttonset")) {
        const nodes2 = buttonNodes(component, doc);
        if (!nodes2.length) return;
        const offset = component.closest('[class*="aem-GridColumn--offset--default--"]');
        const centred2 = offset && !/aem-GridColumn--offset--default--0\b/.test(offset.className) || current && current.kind.startsWith("center");
        if (centred2) {
          if (!current || !current.kind.startsWith("center")) startSection("center", "center");
        } else if (!current || !current.kind.startsWith("body")) {
          startSection("body");
        }
        current.nodes.push(...nodes2);
        return;
      }
      const { nodes, centred, size } = component.matches(".c-rich-text-editor") ? richTextNodes(component, doc) : { nodes: headlineNodes(component, doc), centred: false };
      if (!nodes.length) return;
      nodes.forEach((node) => {
        const copyStyle = node.copyStyle !== void 0 ? node.copyStyle : size;
        const extra = node.headingStyle ? [node.headingStyle] : [copyStyle || "", node.boldBody ? "bold-body" : ""].filter(Boolean);
        const styles = [centred ? "center" : "", ...extra].filter(Boolean);
        const kind = [centred ? "center" : "body", ...extra].join(" ");
        const h3Font = node.tagName === "H3" ? node.serifHeading ? "serif" : "futura" : null;
        if (!current || current.kind !== kind || h3Font && current.h3Font && current.h3Font !== h3Font) {
          startSection(kind, styles.join(", ") || void 0);
        }
        if (h3Font) {
          if (h3Font === "serif" && current.h3Font !== "serif") {
            current.style = [current.style, "h-serif"].filter(Boolean).join(", ");
          }
          current.h3Font = h3Font;
        }
        current.nodes.push(node);
      });
    });
    const disclaimers = [...doc.querySelectorAll(".c-disclaimer")].filter((el) => !el.querySelector("#publishedDate") && !el.parentElement.closest(".c-disclaimer") && text(el));
    const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
      const box = doc.createElement("div");
      box.innerHTML = disclaimer.innerHTML;
      cleanRichText(box, { wholeParagraphs: true });
      return blockNodes(box, doc);
    }), doc);
    const disclaimerStyle = disclaimerNodes.converted ? "disclaimer, references-spaced" : "disclaimer";
    if (disclaimerNodes.length) startSection("disclaimer", disclaimerStyle).nodes.push(...disclaimerNodes);
    const opensWithHeadline = sections.some((section) => section.kind === "headline");
    if ((title.nodes.some((node) => node.tagName === "H1") || opensWithHeadline) && !leadBelowDate) {
      sections.splice(sections.indexOf(title) + 1, 0, { kind: "spacer", style: "spacer", nodes: [] });
    }
    const out = [];
    sections.filter((section) => section.nodes.length || section.kind === "spacer").forEach((section, i) => {
      if (i > 0) out.push(doc.createElement("hr"));
      out.push(...section.nodes);
      const marked = section.nodes.flatMap((node) => node.nodeType === 1 ? [...node.matches("[data-btn-style]") ? [node] : [], ...node.querySelectorAll("[data-btn-style]")] : []);
      [...new Set(marked.map((a) => a.getAttribute("data-btn-style")))].forEach((style) => {
        section.style = [section.style, style].filter(Boolean).join(", ");
      });
      marked.forEach((a) => a.removeAttribute("data-btn-style"));
      if (section.style) {
        out.push(WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        }));
      }
    });
    element.replaceChildren(...out);
  }

  // tools/importer/transformers/news-typography.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MARK = "data-news-section";
  var RUN = "news-run";
  var BLOCKS = "h1, h2, h3, h4, h5, h6, p, ul, ol";
  var TEXT_BLOCKS = "p, li";
  var HEADINGS = "h2, h3, h4, h5, h6";
  var SIZE_STYLES2 = { "1-25": "lead", "1-75": "p-1-75" };
  var SIZES = ["1-25", "1-5", "1-75", "2", "2-5", "8"];
  var COLOURS = {
    ffb500: "color-gold",
    "1c5687": "color-blue",
    "85458a": "color-purple",
    "4c7d7a": "color-teal",
    "27455c": "color-navy",
    545857: "color-grey",
    ffffff: "color-white"
  };
  var PARAS = [
    ".c-rich-text-editor p",
    ".c-rich-text-editor div:not(:has(p, div, ul, ol, h1, h2, h3, h4, h5, h6, table))",
    ".c-largeheadline p"
  ].join(", ");
  var norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  var DIVIDER2 = /_{3,}/;
  var textOf = (el) => norm((el.textContent || "").replace(/_{3,}/g, ""));
  function unwrap2(el) {
    el.replaceWith(...el.childNodes);
  }
  function rename2(el, tag) {
    const next = el.ownerDocument.createElement(tag);
    next.append(...el.childNodes);
    el.replaceWith(next);
    return next;
  }
  function toHex(value) {
    const v = (value || "").trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) return m[1].split("").map((c) => c + c).join("");
    m = v.match(/^#([0-9a-f]{6})$/);
    if (m) return m[1];
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    return "";
  }
  function inlineColour(el) {
    if (el.tagName === "FONT" && el.getAttribute("color")) return toHex(el.getAttribute("color"));
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? toHex(m[1]) : "";
  }
  function clearColour(el) {
    el.removeAttribute("color");
    const style = (el.getAttribute("style") || "").split(";").map((d) => d.trim()).filter((d) => d && !/^color\s*:/i.test(d));
    if (style.length) el.setAttribute("style", style.join("; "));
    else el.removeAttribute("style");
  }
  function covers(block, selector) {
    const text2 = textOf(block);
    if (!text2) return false;
    const styled = [...block.querySelectorAll(selector)].filter((el) => !block.contains(el.parentElement.closest(selector))).map(textOf).join(" ");
    return norm(styled).length >= text2.length - 1;
  }
  function sizeOf(block) {
    const found = SIZES.filter((s) => covers(block, `.fontsize-${s}em`));
    if (found.length < 2) return found[0] || "";
    return found.find((s) => {
      const span = block.querySelector(`.fontsize-${s}em`);
      return !found.some((o) => o !== s && span.parentElement.closest(`.fontsize-${o}em`));
    }) || found[0];
  }
  var isDividerBlock = (el) => !!el && DIVIDER2.test(el.textContent) && !textOf(el);
  function dividerNodes(block) {
    const walker = block.ownerDocument.createTreeWalker(block, 4);
    const lines = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (DIVIDER2.test(n.textContent) && /^[\s_]*$/.test(n.textContent)) lines.push(n);
    }
    return lines;
  }
  function dividerOf(block) {
    const holder = dividerNodes(block).length ? block : block.nextElementSibling;
    const [line] = holder && (holder === block || isDividerBlock(holder)) ? dividerNodes(holder) : [];
    if (!line) return "";
    for (let e = line.parentElement; e && e !== holder.parentElement; e = e.parentElement) {
      const c = inlineColour(e);
      if (c) return c;
    }
    return "none";
  }
  function stripDivider(block) {
    const lines = dividerNodes(block);
    if (lines.length) lines.forEach((n) => n.remove());
    else if (isDividerBlock(block.nextElementSibling)) block.nextElementSibling.remove();
  }
  function trimInside(el) {
    const first = el.firstChild;
    const last = el.lastChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
  }
  function toRuledHeading(p, tag, divider) {
    stripDivider(p);
    const h = rename2(p, tag);
    h.querySelectorAll("br").forEach((br) => br.replaceWith(h.ownerDocument.createTextNode(" ")));
    h.querySelectorAll("span, strong, b, em, i, font").forEach(unwrap2);
    h.normalize();
    trimInside(h);
    const doc = h.ownerDocument;
    const u = doc.createElement("u");
    const gold = COLOURS[divider] === "color-gold";
    if (gold) u.append(doc.createTextNode("[[rule-gold]"));
    u.append(...h.childNodes);
    if (gold) u.append(doc.createTextNode("]"));
    h.append(u);
    return h;
  }
  function promoteTitles(root) {
    const paras = [...root.querySelectorAll(PARAS)];
    if (!root.querySelector("h1")) {
      const title = paras.find((p) => p.querySelector(".futura-bold") && textOf(p) && (["2", "2-5"].includes(sizeOf(p)) || p.querySelector('[class*="vw"]')));
      if (title) {
        const divider = dividerOf(title);
        if (divider) toRuledHeading(title, "h1", divider);
        else {
          const h1 = rename2(title, "h1");
          h1.querySelectorAll("br").forEach((br) => br.replaceWith(root.ownerDocument.createTextNode(" ")));
        }
      }
    }
    paras.filter((p) => p.isConnected && /^(P|DIV)$/.test(p.tagName)).forEach((p) => {
      const divider = dividerOf(p);
      if (divider && textOf(p) && covers(p, ".futura-bold")) toRuledHeading(p, "h2", divider);
    });
  }
  function textKey(el) {
    if (!norm(el.textContent)) return null;
    return SIZE_STYLES2[sizeOf(el)] || "";
  }
  function blockKey(block) {
    if (/^H[2-6]$/.test(block.tagName)) {
      const key = sizeOf(block) === "1-25" ? "lead" : "";
      if (!/^H[23]$/.test(block.tagName)) return { key };
      const face = block.querySelector(".futura-bold") || block.querySelector("u") ? "futura" : "serif";
      return { key, face };
    }
    if (block.tagName === "UL" || block.tagName === "OL") {
      const keys = [...block.querySelectorAll("li")].map(textKey).filter((k) => k !== null);
      if (!keys.length) return { key: null };
      return { key: keys.every((k) => k === keys[0]) ? keys[0] : "" };
    }
    if (block.tagName === "H1") return { key: "" };
    return { key: textKey(block) };
  }
  function topBlocks(component) {
    return [...component.querySelectorAll(BLOCKS)].filter((el) => {
      const outer = el.parentElement.closest(BLOCKS);
      return !outer || !component.contains(outer);
    });
  }
  function buildRuns(component) {
    const runs = [];
    topBlocks(component).forEach((block) => {
      const { key, face } = blockKey(block);
      const run = runs[runs.length - 1];
      const sameParent = run && run.blocks[0].parentElement === block.parentElement;
      const sameFace = !face || !(run && run.face) || face === run.face;
      if (run && sameParent && (key === null || key === run.key && sameFace)) {
        run.blocks.push(block);
        if (face) run.face = face;
        return;
      }
      runs.push({ key: key === null ? "" : key, face, blocks: [block] });
    });
    return runs;
  }
  function runStyle(run) {
    return [run.key, run.face === "serif" ? "h-serif" : ""].filter(Boolean).join(", ");
  }
  function markSections(root) {
    root.querySelectorAll(".c-rich-text-editor").forEach((component) => {
      if (component.closest(".c-customizeable, .c-disclaimer")) return;
      const runs = buildRuns(component);
      if (runs.length === 1) {
        const style = runStyle(runs[0]);
        if (style) component.setAttribute(MARK, style);
        return;
      }
      runs.forEach((run, i) => {
        const style = [runStyle(run), i > 0 ? "join" : ""].filter(Boolean).join(", ");
        if (!style) return;
        const wrap = root.ownerDocument.createElement("div");
        wrap.className = RUN;
        run.blocks[0].before(wrap);
        wrap.append(...run.blocks);
        wrap.setAttribute(MARK, style);
      });
    });
  }
  function dropDividers(root) {
    root.querySelectorAll(PARAS).forEach((p) => {
      if (!DIVIDER2.test(p.textContent)) return;
      dividerNodes(p).forEach((n) => n.remove());
      if (!norm(p.textContent) && !p.querySelector("img, picture")) p.remove();
    });
  }
  function wrapInTag(first, last, cls) {
    const doc = first.ownerDocument;
    if (first.nodeType === 3) {
      const lead = first.textContent.match(/^\s*/)[0];
      if (lead) {
        first.before(doc.createTextNode(lead));
        first.textContent = first.textContent.slice(lead.length);
      }
    }
    if (last.nodeType === 3) {
      const tail = last.textContent.match(/\s*$/)[0];
      if (tail) {
        last.after(doc.createTextNode(tail));
        last.textContent = last.textContent.slice(0, last.textContent.length - tail.length);
      }
    }
    first.before(doc.createTextNode(`[[${cls}]`));
    last.after(doc.createTextNode("]"));
  }
  function mapColours(root) {
    const coloured = [...root.querySelectorAll('.c-rich-text-editor [style*="color"], .c-largeheadline [style*="color"], font[color]')];
    const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
    coloured.forEach((el) => {
      const cls = COLOURS[own.get(el)];
      clearColour(el);
      if (!cls) return;
      const freeText = (node) => {
        if (node.nodeType === 3) return node.textContent;
        if (node.nodeType !== 1 || own.get(node)) return "";
        return [...node.childNodes].map(freeText).join("");
      };
      let run = [];
      const flush = () => {
        if (run.some((n) => norm(freeText(n)))) wrapInTag(run[0], run[run.length - 1], cls);
        run = [];
      };
      [...el.childNodes].forEach((child) => {
        if (child.nodeType === 1 && own.get(child)) flush();
        else run.push(child);
      });
      flush();
    });
  }
  function dropInlineFonts(root) {
    root.querySelectorAll("font").forEach(unwrap2);
    root.querySelectorAll("[style]").forEach((el) => {
      const kept = el.getAttribute("style").split(";").map((d) => d.trim()).filter((d) => d && !/^(font|font-family|font-size|font-weight|line-height)\s*:/i.test(d));
      if (kept.length) el.setAttribute("style", kept.join("; "));
      else el.removeAttribute("style");
    });
  }
  function plainHeadline(root) {
    root.querySelectorAll("h1").forEach((h1) => {
      h1.querySelectorAll("span, strong, b, em, i").forEach(unwrap2);
    });
  }
  function plainHeadings(root) {
    root.querySelectorAll(HEADINGS).forEach((h) => {
      h.querySelectorAll("span.futura-bold, strong, b").forEach(unwrap2);
    });
  }
  function standaloneLinks(root) {
    root.querySelectorAll("span.standalone-link").forEach((span) => {
      const a = span.closest("a") || span.querySelector("a");
      unwrap2(span);
      if (!a || a.closest("strong u, u strong")) return;
      const doc = a.ownerDocument;
      const strong = doc.createElement("strong");
      const u = doc.createElement("u");
      a.replaceWith(strong);
      strong.append(u);
      u.append(a);
    });
  }
  function futuraBold(root) {
    [...root.querySelectorAll("span.futura-bold")].filter((span) => !span.closest(`${HEADINGS}, h1`)).forEach((span) => {
      const outer = span.parentElement && span.parentElement.closest("strong, b");
      if (outer && norm(outer.textContent) === norm(span.textContent)) unwrap2(outer);
      span.querySelectorAll("strong, b, span.futura-bold").forEach(unwrap2);
      const doc = span.ownerDocument;
      const strong = doc.createElement("strong");
      const em = doc.createElement("em");
      em.append(...span.childNodes);
      strong.append(em);
      span.replaceWith(strong);
    });
  }
  function dropStyleSpans(root) {
    root.querySelectorAll('span[class*="fontsize-"], span.urw-egyptienne').forEach(unwrap2);
  }
  function semanticInline(root) {
    root.querySelectorAll(`:is(${TEXT_BLOCKS}, ${HEADINGS}, h1) :is(b, i)`).forEach((el) => {
      if (!norm(el.textContent)) return;
      rename2(el, el.tagName === "B" ? "strong" : "em");
    });
  }
  function hasFollowing(node, root) {
    let n = node;
    while (n && n !== root) {
      if (n.nextElementSibling) return true;
      n = n.parentElement;
    }
    return false;
  }
  function writeSections(root) {
    const doc = root.ownerDocument;
    root.querySelectorAll(`[${MARK}]`).forEach((el) => {
      const style = el.getAttribute(MARK);
      el.removeAttribute(MARK);
      if (el.closest("table")) return;
      if (el.previousElementSibling?.tagName !== "HR") el.before(doc.createElement("hr"));
      const meta = WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: [["Style", style]] });
      el.after(meta);
      if (hasFollowing(meta, root) && meta.nextElementSibling?.tagName !== "HR") meta.after(doc.createElement("hr"));
    });
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template && payload.template.name;
    if (template && !template.includes("news")) return;
    const root = element;
    if (hookName === TransformHook.beforeTransform) {
      promoteTitles(root);
      markSections(root);
      dropDividers(root);
      mapColours(root);
      dropInlineFonts(root);
      plainHeadline(root);
      plainHeadings(root);
      standaloneLinks(root);
      futuraBold(root);
      dropStyleSpans(root);
      semanticInline(root);
    }
    if (hookName === TransformHook.afterTransform) {
      writeSections(root);
    }
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var PATIENTS_HOST_RE = /^https?:\/\/patients\.stryker\.com(?=[/?#]|$)/i;
  var CORP_HOST_RE = /^https?:\/\/www\.stryker\.com(?=[/?#]|$)/i;
  function sourceHostFor(payload) {
    try {
      const { hostname } = new URL(payload.params.originalURL);
      if (hostname === "www.stryker.com") return CORP_HOST_RE;
    } catch {
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
  function transform3(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isNewsDetail = !!(payload && payload.template && ["news-detail", "news-detail-xf"].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook2.beforeTransform) {
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
    if (hookName === TransformHook2.afterTransform) {
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
    } catch {
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
  function transform4(hookName, element, payload) {
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

  // tools/importer/import-news-xf.js
  var PAGE_TEMPLATE = {
    name: "news-detail-xf",
    description: "www.stryker.com news articles whose body is an Experience Fragment (XF): the news-detail import, plus the XF handling. A shared XF (Resources links of Acute Care / Emergency Care) becomes a `fragment` block before the small print; any other XF is unwrapped in place and its AEM grid rows (2+ filled columns) become `columns` blocks with the variant nearest the span ratio (50-50, 67-33, 33-67, 75-25; 3+ cells no variant); blank section titles and empty rich text are dropped; a dimensional box becomes `Panel (left)`. Page metadata template stays news-detail.",
    urls: [
      "https://www.stryker.com/us/en/acute-care/news/acute-care-training-and-education-resources.html",
      "https://www.stryker.com/us/en/acute-care/news/nurse-led-innovation-and-the-power-of-partnership.html",
      "https://www.stryker.com/us/en/emergency-care/news/2024/life-saving-journey-inspires-community.html",
      "https://www.stryker.com/us/en/about/news/2026/a-message-to-our-customers-03-2026.html",
      "https://www.stryker.com/us/en/about/news/2024/stryker-launches-next-generation-of-surgicount--to-help-improve-.html",
      "https://www.stryker.com/us/en/about/news/2025/features/stryker-releases-2024-comprehensive-report.html",
      "https://www.stryker.com/us/en/about/news/features/improving-safety--spreading-truth-about-surgical-smoke.html",
      "https://www.stryker.com/us/en/about/news/2023/features/how-stryker-is-accelerating-innovation-in-additive-manufacturing.html",
      "https://www.stryker.com/us/en/about/news/features/employees-inspire-a-new-generation-of-robotics-engineers-through.html",
      "https://www.stryker.com/us/en/about/news/features/from-behind-the-scenes-to-the-front-line.html",
      "https://www.stryker.com/us/en/about/news/features/restoring-spines-and-hope.html",
      "https://www.stryker.com/us/en/about/news/2023/features/stryker-releases-comprehensive-report-highlighting-2022-performa.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-announces-leadership-succession.html"
    ],
    blocks: [
      { name: "hero-image-slide", instances: [".c-autocarousel"] },
      { name: "video", instances: [".c-standalone-video"] },
      { name: "cards-corp-teaser", instances: [".c-customizeable"] }
    ]
  };
  var parsers = {
    "hero-image-slide": parse,
    video: parse3,
    "cards-corp-teaser": parse2
  };
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
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
  function publishedDate(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    const updated = document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);
    if (!updated) return "";
    const month = (/* @__PURE__ */ new Date(`${updated[1]} 1, 2000`)).getMonth() + 1;
    return `${updated[2]}-${String(month).padStart(2, "0")}`;
  }
  var import_news_xf_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const published = publishedDate(document);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute("content")?.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      meta.template = "news-detail";
      const firstPublished = main.getAttribute("data-first-published");
      if (firstPublished) {
        meta["first-published"] = firstPublished;
        main.removeAttribute("data-first-published");
      }
      if (published) meta.published = published;
      const shareImage = meta.Image && (meta.Image.querySelector ? meta.Image.querySelector("img") || meta.Image : meta.Image);
      const shareSrc = shareImage && shareImage.getAttribute && shareImage.getAttribute("src");
      if (shareSrc && /\/content\/dam\//.test(shareSrc)) {
        const fileName = (u) => decodeURIComponent(u.split("?")[0].split("/").pop()).replace(/\.[a-z0-9]+$/i, "").toLowerCase();
        const name = fileName(shareSrc);
        const dm = [...main.querySelectorAll('a[href*="media-assets.stryker.com/is/image/"], img[src*="media-assets.stryker.com/is/image/"]')].map((el) => el.getAttribute("href") || el.getAttribute("src")).find((u) => fileName(u) === name);
        if (dm) shareImage.setAttribute("src", dm);
      }
      const theme = main.getAttribute("data-news-theme");
      if (theme) {
        meta.theme = theme;
        main.removeAttribute("data-news-theme");
      }
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
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_news_xf_exports);
})();
