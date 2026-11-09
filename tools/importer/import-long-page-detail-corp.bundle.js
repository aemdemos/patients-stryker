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

  // tools/importer/import-long-page-detail-corp.js
  var import_long_page_detail_corp_exports = {};
  __export(import_long_page_detail_corp_exports, {
    default: () => import_long_page_detail_corp_default
  });

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
  function parse(element, { document }) {
    const link2 = videoLink(element, document);
    if (!link2) return;
    const cells = [[link2]];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Video", cells }));
  }

  // tools/importer/parsers/cards-corp-resources.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
  function text(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function absolute(href) {
    return href && href.startsWith("/") && !href.startsWith("//") ? `${SOURCE_ORIGIN}${href}` : href;
  }
  function newTab(source, href) {
    if (!href || href.includes("#")) return href;
    const isPdf = /\.pdf(\?|$)/i.test(href);
    const blank = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || blank ? `${href}#_blank` : href;
  }
  function parse2(element, { document }) {
    const items = [...element.querySelectorAll(".item")];
    const rows = items.map((item) => {
      const title = item.querySelector(".title, h5, h4");
      const link2 = title && title.closest("a[href]") || item.querySelector("a[href]");
      const img = item.querySelector("img");
      if (!img || !link2 && !text(title)) return null;
      const src = absolute(img.getAttribute("src"));
      const cover = document.createElement("a");
      cover.href = src;
      const alt = img.getAttribute("alt") || "";
      cover.textContent = alt.trim() ? alt : src;
      const h5 = document.createElement("h5");
      if (!link2) {
        h5.textContent = text(title);
        return [cover, h5];
      }
      const a = document.createElement("a");
      a.href = newTab(link2, absolute(link2.getAttribute("href")));
      a.textContent = text(title) || text(link2);
      h5.append(a);
      return [cover, h5];
    }).filter(Boolean);
    if (!rows.length) {
      element.remove();
      return;
    }
    const sixUp = items.some((item) => /\bcol-md-2\b/.test(item.className));
    const name = sixUp ? "Cards Corp (resources, six-up)" : "Cards Corp (resources)";
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
  }

  // tools/importer/parsers/cards-corp-teaser.js
  function clean(text5) {
    return (text5 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function link(document, source, text5) {
    const a = document.createElement("a");
    a.setAttribute("href", source.getAttribute("href"));
    a.textContent = text5;
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
    if (title && clean(title.textContent)) {
      const h3 = document.createElement("h3");
      const titleLink = title.querySelector("a[href]");
      if (titleLink) h3.append(link(document, titleLink, clean(titleLink.textContent)));
      else h3.textContent = clean(title.textContent);
      body.push(h3);
    }
    item.querySelectorAll(".desc-container > p").forEach((source) => {
      if (!clean(source.textContent)) return;
      const p = document.createElement("p");
      p.textContent = clean(source.textContent);
      body.push(p);
    });
    const cta = item.querySelector("a.action-link[href]");
    if (cta && clean(cta.textContent)) {
      const a = link(document, cta, "");
      const u = document.createElement("u");
      u.textContent = clean(cta.textContent);
      a.append(u);
      const strong = document.createElement("strong");
      strong.append(a);
      const p = document.createElement("p");
      p.append(strong);
      body.push(p);
    }
    return body;
  }
  function parse3(element, { document }) {
    const items = [...element.querySelectorAll(".item")].filter((item) => item.querySelector("img"));
    if (!items.length) return;
    const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
    const cols = items[0].className;
    let variant = "";
    if (/\bcol-sm-4\b/.test(cols)) variant = ", three-up";
    else if (/\bcol-sm-6\b/.test(cols)) variant = ", two-up";
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: `Cards Corp (teaser${variant})`, cells }));
  }

  // tools/importer/parsers/hero-full-width-image.js
  function text2(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function image(src, alt, document) {
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt || "");
    return img;
  }
  function inline(source, document) {
    const out = [];
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        if (node.textContent.trim()) out.push(document.createTextNode(node.textContent.replace(/\u00a0/g, " ")));
      } else if (node.nodeName === "BR") {
        out.push(document.createElement("br"));
      } else if (node.nodeType === 1 && node.classList.contains("futura-bold")) {
        const strong = document.createElement("strong");
        strong.textContent = text2(node);
        out.push(strong);
      } else if (node.nodeType === 1) {
        out.push(...inline(node, document));
      }
    });
    return out;
  }
  function parse4(element, { document }) {
    const picture = element.querySelector(".imgBoxId picture");
    const mobile = picture && picture.querySelector("img");
    const desktop = picture && picture.querySelector("source[srcset]");
    const box = element.querySelector(".textBoxId");
    const rows = [];
    if (desktop) {
      const src = desktop.getAttribute("srcset").split(/\s+/)[0];
      rows.push([image(src, mobile && mobile.getAttribute("alt"), document)]);
    }
    if (mobile) rows.push([image(mobile.getAttribute("src"), mobile.getAttribute("alt"), document)]);
    const content = [];
    const headline2 = box && box.querySelector(".c-largeheadline");
    if (headline2) {
      const line1 = headline2.querySelector(".line1");
      const heading = line1 && line1.querySelector("h1, h2, h3");
      if (line1 && text2(line1)) {
        const h = document.createElement(heading ? heading.tagName.toLowerCase() : "p");
        h.append(...inline(heading || line1, document));
        content.push(h);
      }
      const line2 = headline2.querySelector(".line2");
      if (line2 && text2(line2)) {
        const p = document.createElement("p");
        p.append(...inline(line2, document));
        content.push(p);
      }
    }
    if (content.length) rows.push([content]);
    if (!rows.length) {
      element.remove();
      return;
    }
    const options = ["image-slide"];
    if (box) {
      const right = /\bpull-right\b/.test(box.className);
      options.push("top-4", right ? "left-50" : "left-1", right ? "right-1" : "right-50");
    }
    const sized = headline2 && headline2.querySelector('[class*="fontsize-"][class*="-vw"]');
    const m = sized && sized.className.match(/fontsize-(\d+(?:-\d+)?)-vw/);
    if (m) options.push(`size-${m[1]}`);
    const name = `Hero Corp (${options.join(", ")})`;
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
  }

  // tools/importer/parsers/hero-image-slide.js
  function copyImage(source, document) {
    const img = document.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return img;
  }
  function clean2(text5) {
    return (text5 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function headline(overlay, document) {
    const out = [];
    const headings = [...overlay.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const lines = headings.length ? headings : [...overlay.querySelectorAll(".line, p")];
    lines.forEach((line) => {
      if (!clean2(line.textContent)) return;
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
  function parse5(element, { document }) {
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

  // tools/importer/transformers/long-page-detail-corp-article.js
  var SOURCE_ORIGIN2 = "https://www.stryker.com";
  var COMPONENTS = [
    ".c-autocarousel",
    ".c-standalone-image",
    ".c-rich-text-editor",
    ".c-standalone-video",
    ".c-curatedcta",
    // a Button Set (.buttonset > .button-group > a.btn) imports like a Curated CTA (as in
    // news-detail-sections.js on main, f4ab244)
    ".buttonset",
    ".c-largeheadline",
    ".c-section-title",
    ".c-customizeable",
    ".c-section-separator",
    ".sectionseparator"
  ].join(", ");
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
  var KEEP_ATTRS = {
    // data-btn-style: the section style a link asks for (buildArticle adds it to its section)
    A: ["href", "data-btn-style"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"]
  };
  function text3(el) {
    return (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
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
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN2}${href}` : href;
  }
  function newTabHref(source, href) {
    if (!href || href.includes("#") || /^(mailto|tel):/i.test(href)) return href;
    const isPdf = /\.pdf(\?|$)/i.test(href);
    const newTab2 = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || newTab2 ? `${href}#_blank` : href;
  }
  var SIZE_STYLES = [
    // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph)
    ["fontsize-8em", "disclaimer"],
    ["fontsize-1-25em", "p-1-25"],
    ["fontsize-1-5em", "p-1-5"],
    ["fontsize-1-75em", "p-1-75"],
    // long-page-detail-corp: 28px and 35px copy (p-2 / p-2-5, template CSS)
    ["fontsize-2em", "p-2"],
    ["fontsize-2-5em", "p-2-5"]
  ];
  var SIZE_TAGS = [
    ["fontsize-1-25em", "text-1-25"],
    ["fontsize-1-5em", "text-1-5"],
    ["fontsize-1-75em", "text-1-75"],
    ["fontsize-2em", "text-2"],
    ["fontsize-2-5em", "text-2-5"]
  ];
  var FONT_STYLES = [
    ["urw-egyptienne", "serif"]
  ];
  function copyStyles(root) {
    const candidates = root.matches && root.matches("p, li") ? [root] : [...root.querySelectorAll("p, li")];
    const copy = candidates.filter((el) => text3(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
    });
    const size = SIZE_STYLES.find(([cls]) => covers(cls));
    const coversFont = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      const bold = [...el.querySelectorAll(".futura-bold")].filter((span) => !span.closest(`.${cls}`) && !span.parentElement.closest(".futura-bold"));
      const covered = squash(spans.map((span) => span.textContent).join("")) + squash(bold.map((span) => span.textContent).join(""));
      return spans.length > 0 && covered.length === squash(el.textContent).length;
    });
    const font = FONT_STYLES.find(([cls]) => coversFont(cls));
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
      if (!text3(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text3(block) === text3(b)) return;
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
    return coloured.some((el) => [...el.childNodes].some((child) => child.nodeType === 3 ? child.textContent.trim() : !ownColour(child) && text3(child)));
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
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    SIZE_TAGS.forEach(([cls, tag]) => {
      [...root.querySelectorAll(`.${cls}`)].forEach((span) => {
        if (span.parentElement.closest(`.${cls}`) || !text3(span)) return;
        const h4 = span.closest("h4");
        if (h4 && ["text-1-25", "text-1-5"].includes(tag) && squash(h4.textContent) === squash(span.textContent)) {
          bracketTag([span], tag, root);
          return;
        }
        const block = span.closest("p, li");
        if (!block || span.closest("h1, h2, h3, h4, h5, h6")) return;
        if (squash(block.textContent) === squash(span.textContent)) return;
        bracketTag([span], tag, root);
      });
    });
  }
  function tagGoldText(root) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap = (nodes) => bracketTag(nodes, "color-gold", root);
    const wrapRun = (nodes) => {
      nodes.filter((n) => n.nodeType === 1).forEach((n) => tagged.add(n));
      wrap(nodes);
    };
    root.querySelectorAll('[style*="color"]').forEach((el) => {
      if (!GOLD.test(ownColour(el)) || [...tagged].some((t) => t.contains(el))) return;
      if (!hasOtherColour(el)) {
        wrapRun([el]);
        return;
      }
      let run = [];
      [...el.childNodes].forEach((child) => {
        if (hasOtherColour(child)) {
          wrapRun(run);
          run = [];
        } else run.push(child);
      });
      wrapRun(run);
    });
  }
  function cleanRichText(root, { wholeParagraphs = false } = {}) {
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text3(el));
    const centred = blocks.length > 0 && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute("style") || ""));
    const size = copyStyles(root);
    const doc = root.ownerDocument;
    root.querySelectorAll('a:not([href]), a[href=""]').forEach(unwrap);
    const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== "BR" && !node.textContent.trim() && !node.querySelector("img, br");
    const trailingSpace = /[\s\u00a0]+$/;
    [...root.querySelectorAll('span.futura-bold, span[style*="color"], b, i, em, strong')].reverse().forEach((el) => {
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
    const squashed = (el) => el.textContent.replace(/[\s\u00a0]+/g, "");
    root.querySelectorAll(".futura-bold a[href], a[href] .futura-bold").forEach((el) => {
      const a = el.closest("a[href]");
      const block = a.closest("p, li");
      if (standalone.has(a) || a.querySelector("u, img") || !block || !squashed(a) || squashed(block) !== squashed(a)) return;
      standalone.add(a);
      a.setAttribute("data-btn-style", "no-arrow");
      const u = doc.createElement("u");
      while (a.firstChild) u.append(a.firstChild);
      a.append(u);
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => rename(el, "strong"));
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
      if (!text3(el) && !el.querySelector("img")) el.remove();
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
    return new Set([...root.querySelectorAll("h2, h3")].filter((h) => {
      if (!text3(h)) return false;
      if (h.tagName === "H2") {
        if (h.querySelector("u")) return false;
        const bold = [...h.querySelectorAll(".futura-bold, b, strong")].filter((b) => !b.parentElement.closest(".futura-bold, b, strong"));
        return squash(bold.map((b) => b.textContent).join("")) !== squash(h.textContent);
      }
      if (h.querySelector(".futura-bold, b, strong")) return false;
      const spans = [...h.querySelectorAll(".urw-egyptienne")].filter((span) => !span.parentElement.closest(".urw-egyptienne"));
      return squash(spans.map((span) => span.textContent).join("")) === squash(h.textContent);
    }));
  }
  var LABEL_HEADING = /^(about stryker|media contacts?|contacts?|investor contacts?)\s*:?$/i;
  function labelHeadingsToParagraphs(root) {
    root.querySelectorAll("h2, h3, h4, h5, h6").forEach((h) => {
      if (!LABEL_HEADING.test(text3(h))) return;
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
    ["H1", "fontsize-1-25em", "h1-1-25"],
    // a Heading 4 enlarged 2.5x that is the page title (Mako thank-you page; marked by
    // long-page-detail-corp-sections.js → titleFromHeading)
    ["H1", "fontsize-h4-2-5", "h4-2-5"]
  ];
  function smallHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const styles = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2").forEach((h) => {
      if (!text3(h)) return;
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
      const at = nodes.findIndex((node, i) => {
        var _a;
        return node.nodeName === "BR" && ((_a = nodes.slice(i + 1).find((next) => next.nodeType !== 3 || next.textContent.trim())) == null ? void 0 : _a.nodeName) === "BR";
      });
      if (at < 1) return;
      const lead = doc.createElement("p");
      nodes.slice(0, at).forEach((node) => lead.append(node));
      const leadText = text3(lead).replace(/[\s\u00a0]+/g, "");
      const covered = [...lead.querySelectorAll(styled)].filter((span) => !span.parentElement.closest(styled)).map((span) => span.textContent).join("").replace(/[\s\u00a0]+/g, "");
      if (!leadText || covered !== leadText || !text3(p)) {
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
    const squash = (value) => value.replace(/[\s\u00a0]+/g, " ").trim();
    const leadText = squash(lead.map((node) => node.textContent).join(""));
    if (!leadText) return null;
    const box = doc.createElement("div");
    lead.forEach((node) => box.append(node.cloneNode(true)));
    const large = squash([...box.querySelectorAll(".fontsize-1-5em")].filter((span) => !span.parentElement.closest(".fontsize-1-5em")).map((span) => span.textContent).join(""));
    if (large !== leadText || !box.querySelector(".futura-bold, b")) return null;
    lead.forEach((node) => node.remove());
    while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
    if (!text3(p)) p.remove();
    const h1 = doc.createElement("h1");
    h1.textContent = leadText;
    return h1;
  }
  function blockNodes(container, doc) {
    const nodes = [];
    let run = [];
    const flush = () => {
      if (run.some((n) => {
        var _a;
        return n.nodeType === 3 ? n.textContent.trim() : text3(n) || ((_a = n.querySelector) == null ? void 0 : _a.call(n, "img"));
      })) {
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
        if (text3(node) || node.querySelector("img")) nodes.push(node);
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
    if (others.some((el) => text3(el) || el.querySelector("img, video, iframe"))) return "";
    if (/\bcol-md-3\b/.test(col.className)) return "image-1-4";
    return match[1] === "4" ? "image-1-3" : "image-1-2";
  }
  function imageNodes(component, doc) {
    const nodes = [...component.querySelectorAll("img")].map((source) => {
      const img = doc.createElement("img");
      img.setAttribute("src", source.getAttribute("src"));
      img.setAttribute("alt", source.getAttribute("alt") || "");
      const p = doc.createElement("p");
      p.append(img);
      return p;
    });
    if (nodes.length) {
      component.querySelectorAll(".title-content :is(h2, h3, h4, h5)").forEach((title) => {
        if (!text3(title)) return;
        const h4 = doc.createElement("h4");
        h4.textContent = text3(title);
        nodes.push(h4);
      });
    }
    return nodes;
  }
  function buttonNodes(component, doc) {
    return [...component.querySelectorAll("a[href]")].filter((a) => text3(a)).map((source) => {
      const a = doc.createElement("a");
      a.setAttribute("href", newTabHref(source, absoluteAsset(source.getAttribute("href"))));
      if (source.matches(".action-link, li a")) {
        const u = doc.createElement("u");
        u.textContent = text3(source);
        a.append(u);
        const strong2 = doc.createElement("strong");
        strong2.append(a);
        const p2 = doc.createElement("p");
        p2.append(strong2);
        return p2;
      }
      a.textContent = text3(source);
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
  function centredLine(el) {
    return /text-align:\s*center/.test(el.getAttribute("style") || "") || !!el.querySelector('[style*="text-align: center"], [style*="text-align:center"]');
  }
  function headlineTag(el) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const depth = (span) => {
      let n = 0;
      if (span === el) return n;
      for (let p = span.parentElement; p && p !== el; p = p.parentElement) {
        if (/\bfontsize-/.test(p.className || "")) n += 1;
      }
      return n;
    };
    const size = [el, ...el.querySelectorAll('[class*="fontsize-"]')].map((span) => [(/\bfontsize-(\d+(?:-\d+)?)-?vw\b/.exec(span.className || "") || [])[1], squash(span.textContent).length, depth(span)]).filter(([n, length]) => n && length).sort((a, b) => b[1] - a[1] || b[2] - a[2]).map(([n]) => n)[0];
    const bold = [...el.querySelectorAll(".futura-bold, b, strong")].filter((b) => !b.parentElement.closest(".futura-bold, b, strong")).map((b) => b.textContent).join("");
    const serif = squash(bold) !== squash(el.textContent);
    return [size ? `headline-${size}` : "", serif ? "serif" : ""].filter(Boolean).join(",");
  }
  function blankLineAfter(p, doc) {
    const end = p.lastChild && p.lastChild.nodeType === 3 && p.lastChild.textContent === "]" ? p.lastChild : null;
    let last = end ? end.previousSibling : p.lastChild;
    while (last && last.nodeType === 3 && !last.textContent.trim()) last = last.previousSibling;
    const count = last && last.nodeName === "BR" ? 1 : 2;
    for (let n = 0; n < count; n += 1) p.insertBefore(doc.createElement("br"), end);
  }
  function headlineNodes(component, doc) {
    const box = doc.createElement("div");
    box.innerHTML = component.innerHTML;
    const BLOCKS = "h1, h2, h3, h4, h5, h6, p";
    const lines = [...box.querySelectorAll(".line")];
    const segments = (lines.length ? lines : [box]).flatMap((line) => {
      const blocks = [...line.querySelectorAll(BLOCKS)].filter((block) => text3(block) && !block.parentElement.closest(BLOCKS));
      return blocks.length > 1 ? blocks : [line];
    });
    const tags = segments.map(headlineTag);
    const centredSegments = segments.map((segment) => segment !== box && centredLine(segment));
    const levels = segments.map((segment) => /^H[2-6]$/.test(segment.tagName) ? segment.tagName.toLowerCase() : "");
    const copy = segments.map((segment) => segment.tagName === "P" || !!segment.querySelector("p"));
    const parts = segments.map((segment) => segment === box ? box : rename(segment, "div"));
    const endsWithBreak = (node) => {
      let last = node;
      while (last && last.nodeType === 1 && last.nodeName !== "BR") {
        let child = last.lastChild;
        while (child && child.nodeType === 3 && !child.textContent.trim()) {
          child = child.previousSibling;
        }
        last = child;
      }
      return !!last && last.nodeName === "BR";
    };
    parts.forEach((part) => part.querySelectorAll(`${BLOCKS}, div`).forEach((block) => {
      let prev = block.previousSibling;
      while (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      const needsBreak = prev && !endsWithBreak(prev) && text3(block);
      if (needsBreak) block.before(doc.createElement("br"));
      unwrap(block);
    }));
    const sizeOf = (tag) => (/\bheadline-(\d+(?:-\d+)?)\b/.exec(tag || "") || [])[1] || "";
    const leadingBlank = parts.map((part) => {
      if (part === box) return null;
      const walker = doc.createTreeWalker(part, 5);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.nodeName === "BR") {
          const sized = n.parentElement.closest('[class*="fontsize-"]');
          return sized && part.contains(sized) ? (/\bfontsize-(\d+(?:-\d+)?)-?vw\b/.exec(sized.className) || [])[1] || "" : "";
        }
        if (n.nodeType === 3 ? text3(n) : n.matches("img, picture")) return null;
      }
      return null;
    });
    cleanRichText(box);
    let previous = null;
    let previousIndex = -1;
    return parts.map((part, i) => {
      if (!text3(part)) return null;
      const p = doc.createElement("p");
      while (part.firstChild) p.append(part.firstChild);
      while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !text3(p.firstChild))) {
        p.firstChild.remove();
      }
      const blank = leadingBlank[i] !== null && previous;
      const onPrevious = blank && leadingBlank[i] === sizeOf(tags[previousIndex]) && centredSegments[previousIndex] === centredSegments[i];
      if (blank && !onPrevious) p.prepend(doc.createElement("br"));
      if (tags[i]) {
        p.prepend(doc.createTextNode(`[[${tags[i]}]`));
        p.append(doc.createTextNode("]"));
      }
      if (levels[i]) p.headingLevel = levels[i];
      if (copy[i]) p.copyLine = true;
      if (centredSegments[i]) p.centredLine = true;
      if (onPrevious) blankLineAfter(previous, doc);
      previous = p;
      previousIndex = i;
      return p;
    }).filter(Boolean);
  }
  function whiteBox(headline2) {
    return !!headline2.querySelector(".has-background.bg-white");
  }
  function boxStyles(headline2) {
    if (whiteBox(headline2)) return "headline-box";
    const box = headline2.querySelector(".has-background");
    const bg = (box && box.className.match(/\bbg-([a-z-]+)\b/) || [])[1] || "";
    if (/^(gold|golden-gradient)$/.test(bg)) return "headline-box, gold";
    if (bg === "gray-gradient") return "headline-box, gray-gradient";
    if (bg === "purple") return "headline-box, purple";
    if (bg === "dark-purple-gradient") return "headline-box, purple-gradient";
    if (/^(light-gray|gray)$/.test(bg)) return "headline-box, light-gray";
    if (/^blue$/.test(bg)) return "headline-box, blue";
    if (/^dark$/.test(bg) || /^dark-.*-gradient$/.test(bg)) return "headline-box, dark";
    return "";
  }
  function centredHeadline(headline2) {
    const lines = [...headline2.querySelectorAll(".line")].filter((line) => text3(line));
    return lines.length > 0 && lines.every(centredLine);
  }
  function headlineStyles(headline2) {
    return [boxStyles(headline2), centredHeadline(headline2) ? "center" : ""].filter(Boolean).join(", ");
  }
  function titleHeading(lines, doc) {
    const h1 = doc.createElement("h1");
    lines.forEach((line, i) => {
      if (i) h1.append(doc.createElement("br"));
      h1.append(...line.childNodes);
    });
    [...h1.querySelectorAll("strong, em")].reverse().forEach((el) => {
      let last = el.lastChild;
      while (last && (last.nodeName === "BR" || last.nodeType === 3 && !last.textContent.trim())) {
        if (last.nodeName === "BR") el.after(last);
        else last.remove();
        last = el.lastChild;
      }
    });
    return h1;
  }
  function videoAside(video) {
    const col = video.closest('[class*="col-sm-8"], [class*="col-sm-6"]');
    const row = col && col.parentElement;
    const width = col && /\bcol-sm-6\b/.test(col.className) ? 6 : 4;
    const aside = row && [...row.children].find((el) => el !== col && new RegExp(`\\bcol-sm-${width}\\b`).test(el.className));
    const headline2 = aside && aside.querySelector(".c-largeheadline");
    return headline2 && text3(headline2) ? headline2 : null;
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
    if (!rte || !text3(rte) || aside.querySelector("img, video, iframe, .c-standalone-video")) return null;
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
      if (!GOLD.test(ownColour(span)) || !/^[“”"‘’']+$/.test(text3(span)) || text3(bold) === text3(span)) return;
      const atStart = text3(bold).startsWith(text3(span));
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
      if (/^[“”"‘’']+$/.test(text3(strong))) {
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
        if (text3(line)) out.push(line);
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
  function buildArticle(element, { keep = "", spacer = true, componentStyle = null } = {}) {
    const doc = element.ownerDocument;
    const main = doc.querySelector('[role="main"]') || element;
    const selector = keep ? `${COMPONENTS}, ${keep}` : COMPONENTS;
    const sections = [];
    let current = null;
    let separatorNext = false;
    let extraStyle = "";
    let lastKept = null;
    const startSection = (kind, sectionStyle) => {
      const style = [separatorNext || "", sectionStyle, extraStyle].filter(Boolean).join(", ") || void 0;
      separatorNext = false;
      current = {
        kind,
        style,
        nodes: [],
        extra: extraStyle
      };
      sections.push(current);
      return current;
    };
    const title = startSection("title");
    const h1 = main.querySelector(".h1-title h1");
    const hasTitle = !!(h1 && text3(h1));
    if (hasTitle) {
      const heading = doc.createElement("h1");
      heading.innerHTML = h1.innerHTML;
      cleanRichText(heading);
      title.nodes.push(heading);
    }
    const date = main.querySelector(".c-publish-date h5");
    if (date && text3(date)) {
      const value = text3(date);
      const m = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
      const month = m && "janfebmaraprmayjunjulaugsepoctnovdec".indexOf(m[2].toLowerCase()) / 3 + 1;
      element.setAttribute("data-first-published", month >= 1 && Number.isInteger(month) ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : value);
    }
    const location = main.querySelector(".c-event-location-properties h5");
    if (location && text3(location)) {
      const h5 = doc.createElement("h5");
      h5.textContent = location.textContent.replace(/[\s\u00a0]+/g, " ").replace(/\s+,/g, ",").trim();
      title.nodes.push(h5);
    }
    const components = [...main.querySelectorAll(selector)].filter((el) => {
      const parent = el.parentElement && el.parentElement.closest(selector);
      return !parent && !el.closest("header, footer, .modal");
    });
    const consumed = /* @__PURE__ */ new Set();
    const videoRowColumns = (video) => {
      const aside = videoAside(video);
      if (!aside) return false;
      const asideCol = aside.closest('[class*="col-sm-"]');
      const quotes = [...asideCol.querySelectorAll(".c-largeheadline")].filter((h) => h !== aside && text3(h));
      const videoCol = video.closest('[class*="col-sm-"]');
      const ctas = [...videoCol.querySelectorAll(".c-curatedcta")].filter((c) => text3(c));
      const asideCtas = [...asideCol.querySelectorAll(".c-curatedcta")].filter((c) => text3(c));
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
    const rowSpacers = (count) => {
      for (let n = 0; n < count; n += 1) sections.push({ kind: "spacer", style: "spacer", nodes: [] });
      if (count) current = null;
    };
    let rowEnds = 0;
    components.forEach((component) => {
      if (consumed.has(component)) return;
      rowSpacers(rowEnds);
      rowEnds = Number(component.getAttribute("data-row-end") || 0);
      const isFirst = current === title;
      if (componentStyle) {
        extraStyle = componentStyle(component) || "";
        if (current && current !== title && current.extra !== extraStyle) current = null;
      }
      if (keep && component.matches(keep)) {
        if (component.getAttribute("data-keep") === "section") {
          startSection("kept", component.getAttribute("data-section-style") || void 0).nodes.push(component);
          component.removeAttribute("data-section-style");
          lastKept = sections[sections.length - 1];
          current = null;
          return;
        }
        if (component.getAttribute("data-keep") === "nodes") {
          const style = component.getAttribute("data-section-style") || void 0;
          startSection(component.children.length || !style ? "kept" : "spacer", style).nodes.push(...component.children);
          current = null;
          return;
        }
        if (component.getAttribute("data-keep") === "join" && lastKept) {
          lastKept.nodes.push(component);
          return;
        }
        if (!current || !current.kind.startsWith("body")) startSection("body");
        current.nodes.push(component);
        return;
      }
      if (component.matches(".c-largeheadline") && !isFirst && !text3(component) && !component.querySelector("img, picture, video, iframe, [data-asset-path]") && !component.closest('[class*="col-sm-"], [class*="col-md-"]')) {
        sections.push({ kind: "spacer", style: separatorNext ? `${separatorNext}, spacer` : "spacer", nodes: [] });
        separatorNext = false;
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
        const img = component.querySelector("img");
        const link2 = img && img.closest("a[href]");
        if (link2 && component.contains(link2)) {
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(link2, absoluteAsset(link2.getAttribute("href"))));
          a.textContent = (img.getAttribute("alt") || "").trim() || a.getAttribute("href");
          const p = doc.createElement("p");
          p.append(a);
          nodes2.splice(1, 0, p);
          const style = ["image-link", link2.closest(".text-center") ? "center" : ""].filter(Boolean).join(", ");
          startSection("image", style).nodes.push(...nodes2);
          current = null;
          return;
        }
        const columnStyle2 = imageColumnStyle(component);
        if (isFirst && !component.closest(".colctrl")) leadBelowDate = true;
        if (isFirst || columnStyle2) {
          startSection(isFirst ? "lead" : "image", columnStyle2 || void 0).nodes.push(...nodes2);
          current = null;
          return;
        }
        if (!current || !current.kind.startsWith("body")) startSection("body");
        current.nodes.push(...nodes2);
        return;
      }
      if (component.matches(".c-section-separator, .sectionseparator")) {
        const row = component.closest(".colctrl");
        const inRow = row && !text3(row) && !row.querySelector("img, [data-asset-path], iframe, form, table");
        separatorNext = inRow ? "separator, separator-row" : "separator";
        current = null;
        return;
      }
      if (component.matches(".c-customizeable")) {
        if (!component.querySelector(".item img")) return;
        const section = startSection("cards");
        const heading = component.querySelector("h2");
        if (heading && text3(heading)) {
          const h2 = doc.createElement("h2");
          h2.textContent = text3(heading);
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
        const columnStyle2 = imageColumnStyle(component);
        if (columnStyle2) {
          startSection("video", columnStyle2).nodes.push(component);
          current = null;
          return;
        }
        if (!current || current.kind !== "body") startSection("body");
        current.nodes.push(component);
        return;
      }
      if (component.matches(".c-largeheadline[data-page-title]")) {
        const lines = headlineNodes(component, doc);
        const firstCopy = lines.findIndex((line) => line.copyLine);
        const head = firstCopy < 0 ? lines : lines.slice(0, firstCopy);
        const titleLines = head.filter((line) => !line.headingLevel);
        if (titleLines.length) {
          const others = [
            ...head.filter((line) => line.headingLevel).map((line) => rename(line, line.headingLevel)),
            ...firstCopy < 0 ? [] : lines.slice(firstCopy)
          ];
          const styles = headlineStyles(component);
          const section = isFirst ? title : startSection("headline", styles || void 0);
          if (isFirst && styles) title.style = [title.style, styles].filter(Boolean).join(", ");
          section.nodes.push(titleHeading(titleLines, doc), ...others);
          current = null;
          return;
        }
      }
      if (isFirst && !hasTitle && component.matches(".c-largeheadline") && component.querySelector('[class*="fontsize-2vw"]') && text3(component)) {
        const lines = headlineNodes(component, doc);
        if (lines.length) {
          const heading = rename(lines[0], "h1");
          heading.querySelectorAll("strong, em").forEach(unwrap);
          startSection("headline", "headline-2vw").nodes.push(heading, ...lines.slice(1));
          current = null;
          return;
        }
      }
      if (isFirst && !hasTitle && component.matches(".c-rich-text-editor")) {
        const heading = richTextTitle(component, doc);
        if (heading) {
          startSection("headline", "h1-21").nodes.push(heading);
          current = null;
        }
      }
      const partlyCentred = component.matches(".c-largeheadline") && [...component.querySelectorAll(".line")].some((line) => text3(line) && centredLine(line));
      if (component.matches(".c-largeheadline") && (headlineStyles(component) || partlyCentred)) {
        const nodes2 = headlineNodes(component, doc);
        if (!nodes2.length) return;
        const box = boxStyles(component);
        const runs = [];
        nodes2.forEach((node) => {
          const centred2 = !!node.centredLine;
          if (!runs.length || runs[runs.length - 1].centred !== centred2) {
            runs.push({ centred: centred2, nodes: [] });
          }
          runs[runs.length - 1].nodes.push(node);
        });
        runs.forEach((run) => {
          const style = [box, run.centred ? "center" : ""].filter(Boolean).join(", ");
          startSection("headline", style || void 0).nodes.push(...run.nodes);
        });
        current = null;
        return;
      }
      const ctaOffset = component.closest('[class*="aem-GridColumn--offset--default--"]');
      const ctaCentred = ctaOffset && !/aem-GridColumn--offset--default--0\b/.test(ctaOffset.className);
      if (component.matches(".c-curatedcta") && !ctaCentred) {
        const nodes2 = buttonNodes(component, doc);
        if (!nodes2.length) return;
        if (!current || current.kind !== "cta") startSection("cta", "cta-inset");
        current.nodes.push(...nodes2);
        return;
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
        let h3Font = null;
        if (node.tagName === "H3" || node.tagName === "H2" && node.serifHeading) {
          h3Font = node.serifHeading ? "serif" : "futura";
        }
        const otherH3Font = h3Font && current && current.h3Font && current.h3Font !== h3Font;
        if (!current || current.kind !== kind || otherH3Font) {
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
    extraStyle = "";
    const disclaimers = [...doc.querySelectorAll(".c-disclaimer")].filter((el) => !el.querySelector("#publishedDate") && !el.parentElement.closest(".c-disclaimer") && text3(el));
    const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
      const box = doc.createElement("div");
      box.innerHTML = disclaimer.innerHTML;
      cleanRichText(box, { wholeParagraphs: true });
      return blockNodes(box, doc);
    }), doc);
    const disclaimerStyle = disclaimerNodes.converted ? "disclaimer, references-spaced" : "disclaimer";
    rowSpacers(rowEnds);
    if (disclaimerNodes.length) startSection("disclaimer", disclaimerStyle).nodes.push(...disclaimerNodes);
    if (separatorNext) {
      sections.push({ kind: "spacer", style: `${separatorNext}, spacer`, nodes: [] });
    }
    const opensWithHeadline = sections.some((section) => section.kind === "headline");
    if (spacer && (title.nodes.some((node) => node.tagName === "H1") || opensWithHeadline) && !leadBelowDate) {
      sections.splice(sections.indexOf(title) + 1, 0, { kind: "spacer", style: "spacer", nodes: [] });
    }
    const SIZES = ["", "large", "xlarge", "xxlarge"];
    for (let i = 0; i < sections.length; i += 1) {
      let n = 1;
      while (sections[i].kind === "spacer" && sections[i].style === "spacer" && sections[i + n] && sections[i + n].kind === "spacer" && sections[i + n].style === "spacer" && n < 4) n += 1;
      if (n > 1) {
        sections.splice(i + 1, n - 1);
        sections[i].style = `spacer, ${SIZES[n - 1]}`;
      }
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
      section.nodes.forEach((node) => {
        if (node.nodeType === 1) node.removeAttribute("data-keep");
      });
      if (section.style) {
        out.push(WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        }));
      }
    });
    element.replaceChildren(...out);
  }

  // tools/importer/transformers/long-page-detail-corp-components.js
  var COMPONENT = '[class^="c-"], [class*=" c-"]';
  var UNIT = `[data-keep], ${COMPONENT}, .buttonset, table`;
  var PARSED = ".c-resourcesanddownload, .c-customizeable, .c-autocarousel";
  function colourStyle(el) {
    const m = (el.className || "").match(/\bbg-([a-z-]+)\b/);
    if (!m) return "";
    const bg = m[1];
    if (/^(gold|golden-gradient|yellow)$/.test(bg)) return "gold";
    if (bg === "gray-gradient") return "gray-gradient";
    if (bg === "purple") return "purple";
    if (bg === "dark-purple-gradient") return "purple-gradient";
    if (/^(light-gray|gray|grey|light-gray-gradient)$/.test(bg)) return "light-gray";
    if (/^(blue|navy)$/.test(bg)) return "blue";
    if (/^(dark|dark-gray|black)$/.test(bg) || /^dark-.*-gradient$/.test(bg)) return "dark";
    return "";
  }
  function contentUnits(container) {
    const units = [...container.querySelectorAll(UNIT)].filter((el) => {
      const outer = el.parentElement.closest(UNIT);
      return !outer || outer === container || !container.contains(outer);
    });
    if (!units.length && container.matches(COMPONENT)) return [container];
    return units;
  }
  function inlineSectionStyle(unit, doc, h) {
    const parts = (unit.getAttribute("data-section-style") || "").split(",").map((s) => s.trim());
    const size = parts.find((s) => /^p-\d/.test(s));
    const serif = parts.includes("serif");
    if (!size && !serif) return;
    [...unit.querySelectorAll("td > p, td > ul, td > ol, div > p, div > ul, div > ol")].filter((n) => typeof n.copyStyle === "string").forEach((n) => {
      const own = n.copyStyle.split(",").map((s) => s.trim());
      const tags = [size && own.includes(size) ? `text-${size.slice(2)}` : "", serif && own.includes("serif") ? "serif" : ""].filter(Boolean);
      if (!tags.length) return;
      h.tagCopy(n, tags.join(","), doc);
    });
    unit.removeAttribute("data-section-style");
  }
  function unitNodes(unit, doc, h) {
    if (unit.matches(PARSED)) return [unit];
    if (unit.hasAttribute("data-keep")) {
      const nodes = unit.getAttribute("data-keep") === "nodes" ? [...unit.children] : [unit];
      if (unit.getAttribute("data-keep") === "section") inlineSectionStyle(unit, doc, h);
      unit.removeAttribute("data-keep");
      return nodes;
    }
    const box = doc.createElement("div");
    box.append(unit.cloneNode(true));
    return h.cellNodes(box, doc);
  }
  function contentNodes(container, doc, h) {
    return contentUnits(container).flatMap((unit) => unitNodes(unit, doc, h));
  }
  function keepNodes(doc, nodes, style) {
    const box = doc.createElement("div");
    box.setAttribute("data-keep", "nodes");
    if (style) box.setAttribute("data-section-style", style);
    box.append(...nodes);
    return box;
  }
  function keepBlock(block, from) {
    block.setAttribute("data-keep", "section");
    const end = from && from.getAttribute("data-row-end");
    if (end) block.setAttribute("data-row-end", end);
    return block;
  }
  var headingLevel = (node) => node.nodeType === 1 && /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : 0;
  function tabs(main, doc, h) {
    main.querySelectorAll(".c-tabs").forEach((component) => {
      const labels = [...component.querySelectorAll(".tabs-nav a.tab-link")].map((a) => h.text(a));
      const panels = [...component.querySelectorAll(".tabs-content > .tab-content")];
      if (!panels.length) return;
      const contents = panels.map((panel) => contentNodes(panel, doc, h));
      const deepest = Math.max(0, ...contents.flat().map(headingLevel));
      const level = Math.min(6, Math.max(2, deepest + 1));
      const nodes = [];
      contents.forEach((content, i) => {
        if (!content.length) return;
        const heading = doc.createElement(`h${level}`);
        heading.textContent = labels[i] || `Tab ${i + 1}`;
        nodes.push(heading, ...content);
      });
      if (!nodes.length) return;
      const style = component.hasAttribute("data-image-aside") ? "tabbed, image-aside" : "tabbed";
      (component.closest(".tabs") || component).replaceWith(keepNodes(doc, nodes, style));
    });
  }
  function accordionsInColumns(main, doc, h) {
    main.querySelectorAll(".panel-group").forEach((group) => {
      const col = group.closest('[class*="col-sm-"], [class*="col-md-"]');
      const row = col && col.parentElement;
      const filled = (c) => h.text(c) || c.querySelector("img, iframe, [data-asset-path], form, table");
      if (!row || [...row.children].filter((c) => c !== col && filled(c)).length === 0) return;
      const colctrl = row.closest(".colctrl");
      if (!colctrl) return;
      const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
      const cols = [...row.children];
      if (cols.length === 2 && cols[1] === col && /\bcol-sm-4\b/.test(cols[0].className) && cols[0].querySelector("img") && !h.text(cols[0])) {
        const tabSet = colctrl.closest(".c-tabs");
        if (tabSet) tabSet.setAttribute("data-image-aside", "");
      }
      wrapper.replaceWith(...cols.flatMap((c) => [...c.children]));
    });
  }
  function blockCells(table) {
    return [...table.querySelectorAll(":scope > tbody > tr, :scope > tr")].slice(1).flatMap((tr) => [...tr.children].flatMap((td) => [...td.childNodes]));
  }
  function tagPanelCopy(nodes, doc, h) {
    nodes.filter((n) => n.nodeType === 1 && typeof n.copyStyle === "string" && n.copyStyle).forEach((n) => {
      const own = n.copyStyle.split(",").map((s) => s.trim());
      const size = own.find((s) => s.startsWith("p-") && /\d/.test(s[2]));
      const tags = [size ? `text-${size.slice(2)}` : "", own.includes("serif") ? "serif" : ""].filter(Boolean);
      if (tags.length) h.tagCopy(n, tags.join(","), doc);
    });
  }
  function accordionOptions(panels) {
    const open = panels.every((p) => p.querySelector(".panel-collapse.in, .panel-collapse.show"));
    const gray = panels.every((p) => [...p.querySelectorAll(".has-background.bg-light-gray")].some((b) => b.querySelector("ul, ol")));
    return [open ? "open" : "", gray ? "gray-list" : ""].filter(Boolean).join(", ");
  }
  function accordions(main, doc, h) {
    main.querySelectorAll(".panel-group").forEach((group) => {
      const panels = [...group.querySelectorAll(":scope > .panel")].filter((p) => p.querySelector(".panel-title"));
      if (!panels.length) return;
      const options = accordionOptions(panels);
      const name = options ? `Accordion (${options})` : "Accordion";
      const items = panels.map((panel) => ({
        label: h.text(panel.querySelector(".panel-title")),
        body: contentNodes(panel.querySelector(".panel-body") || panel, doc, h)
      }));
      items.forEach(({ body }) => tagPanelCopy(body, doc, h));
      const target = group.closest(".c-accordion") || group;
      const nested = items.some(({ body }) => body.some((n) => n.nodeType === 1 && (n.matches("table") || n.querySelector("table"))));
      if (nested && target.closest(".tab-content")) {
        items.forEach((item) => {
          item.body = item.body.flatMap((n) => n.nodeType === 1 && n.matches("table") ? blockCells(n) : [n]);
        });
        if (items.some(({ body }) => body.some((n) => n.nodeType === 1 && n.matches("table")))) return;
        const rows2 = items.map(({ label, body }) => {
          const p = doc.createElement("p");
          p.textContent = label;
          return [p, body];
        });
        const block2 = WebImporter.Blocks.createBlock(doc, { name, cells: rows2 });
        target.replaceWith(keepBlock(block2, target));
        return;
      }
      if (nested) {
        items.forEach(({ label, body }) => {
          const heading = doc.createElement("h4");
          heading.textContent = label;
          target.before(keepNodes(doc, [heading, ...body], "accordion-panel"));
        });
        target.remove();
        return;
      }
      const rows = items.map(({ label, body }) => {
        const p = doc.createElement("p");
        p.textContent = label;
        return [p, body];
      });
      const block = WebImporter.Blocks.createBlock(doc, { name, cells: rows });
      target.replaceWith(keepBlock(block, target));
    });
  }
  function headingId(label) {
    return label.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function navigationBars(main, doc, h) {
    main.querySelectorAll(".c-navigation-bar").forEach((component) => {
      const rows = [...component.querySelectorAll(".nav-wrap a.anchor")].map((a) => h.text(a)).filter(Boolean).map((label) => {
        const p = doc.createElement("p");
        p.textContent = label;
        const a = doc.createElement("a");
        a.href = `#${headingId(label)}`;
        a.textContent = label;
        return [p, a];
      });
      if (!rows.length) {
        component.remove();
        return;
      }
      (component.closest(".navigationbar") || component).replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name: "Sticky Nav", cells: rows })));
    });
  }
  function fullBleedPanels(main, doc, h) {
    main.querySelectorAll(".c-full-bleed-panel").forEach((component) => {
      const colour = colourStyle(component);
      const style = [colour, "full-bleed"].filter(Boolean).join(", ");
      const out = [];
      let run = [];
      const flush = () => {
        if (run.length) out.push(keepNodes(doc, run, style));
        run = [];
      };
      contentUnits(component).forEach((unit) => {
        if (unit.getAttribute("data-keep") === "nodes" && unit.hasAttribute("data-section-style")) {
          flush();
          unit.setAttribute("data-section-style", `${style}, ${unit.getAttribute("data-section-style")}`);
          out.push(unit);
        } else run.push(...unitNodes(unit, doc, h));
      });
      flush();
      if (!out.length && colour === "gold" && !h.text(component)) {
        const bar = keepNodes(doc, [], "gold-bar");
        const end = component.getAttribute("data-row-end");
        if (end) bar.setAttribute("data-row-end", end);
        out.push(bar);
      }
      if (!out.length) return;
      (component.closest(".fullbleedpanel") || component).replaceWith(...out);
    });
  }
  function textBoxes(main, doc, h) {
    main.querySelectorAll(".c-rich-text-editor").forEach((component) => {
      if (component.closest(".pDiv, .panel-group, .c-full-bleed-panel, .c-tabs, [data-keep]")) return;
      const box = component.querySelector(":scope > .dimensional-box, :scope > .has-background, :scope > div > .dimensional-box");
      if (!box || !h.text(box)) return;
      const col = component.closest('[class*="col-sm-"], [class*="col-md-"]');
      const row = col && col.parentElement;
      if (row && [...row.children].filter((c) => c !== col && h.text(c)).length) return;
      let variant = "";
      if (box.classList.contains("dimensional-box")) variant = "left";
      else {
        const colour = colourStyle(box);
        variant = {
          gold: "gold",
          "light-gray": "gray",
          dark: "dark",
          blue: "blue"
        }[colour] || "";
        if (!variant) return;
      }
      const nodes = contentNodes(component, doc, h);
      if (!nodes.length) return;
      const name = variant ? `Panel (${variant})` : "Panel";
      (component.closest(".text") || component).replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells: [[nodes]] })));
    });
  }
  function groupLists(main, doc, h) {
    main.querySelectorAll(".c-grouplist").forEach((component) => {
      const title = component.querySelector(":scope > h2");
      const cells = [...component.querySelectorAll(".list-container")].map((group) => {
        const nodes = [];
        const heading = group.querySelector("h3");
        if (heading && h.text(heading)) {
          const h3 = doc.createElement("h3");
          h3.textContent = h.text(heading);
          nodes.push(h3);
        }
        const ul = doc.createElement("ul");
        group.querySelectorAll("li a[href]").forEach((link2) => {
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.href = link2.getAttribute("href");
          a.textContent = h.text(link2);
          li.append(a);
          ul.append(li);
        });
        if (ul.children.length) nodes.push(ul);
        return nodes;
      }).filter((nodes) => nodes.length);
      if (!cells.length) return;
      const out = [];
      if (title && h.text(title)) {
        const h2 = doc.createElement("h2");
        h2.textContent = h.text(title);
        out.push(h.richText(doc, [h2]));
      }
      out.push(keepBlock(WebImporter.Blocks.createBlock(doc, { name: "Columns (columns-50-50, link-groups)", cells: [cells] })));
      (component.closest(".grouplist") || component).replaceWith(...out);
    });
  }
  function fastFacts(main, doc, h) {
    main.querySelectorAll(".c-fastfacts").forEach((component) => {
      const nodes = [...component.querySelectorAll("h2, h3, h4, p, li")].filter((el) => h.text(el) && !el.querySelector("h2, h3, h4, p, li")).map((el) => {
        const copy = doc.createElement(el.matches(".c-fastfacts-title") ? "h2" : "p");
        copy.textContent = h.text(el);
        return copy;
      });
      if (!nodes.length) {
        component.remove();
        return;
      }
      (component.closest(".fastfacts") || component).replaceWith(h.richText(doc, nodes));
    });
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
  function engagementCtas(main, doc, h) {
    main.querySelectorAll(".c-engagementcta").forEach((component) => {
      const nodes = [];
      const desc = component.querySelector(".m-c-subheading-description");
      if (desc && h.text(desc)) {
        [...desc.children].filter((el) => h.text(el)).forEach((el) => nodes.push(el.cloneNode(true)));
      }
      component.querySelectorAll(".btn-container a[href]").forEach((link2) => {
        const img = link2.querySelector("img");
        const label = h.text(link2) || img && (img.getAttribute("alt") || "").trim() || link2.getAttribute("href");
        const a = doc.createElement("a");
        a.href = link2.getAttribute("href");
        a.textContent = label;
        const strong = doc.createElement("strong");
        strong.append(a);
        const p = doc.createElement("p");
        p.append(strong);
        nodes.push(p);
      });
      if (!nodes.length) return;
      (component.closest(".engagementcta") || component).replaceWith(h.richText(doc, nodes));
    });
  }
  function interactiveImages(main, doc) {
    main.querySelectorAll(".interactivemedia").forEach((component) => {
      const asset = component.querySelector("[data-asset-path]");
      const path = asset && asset.getAttribute("data-asset-path");
      if (!path) {
        component.remove();
        return;
      }
      const img = doc.createElement("img");
      img.setAttribute("src", `https://media-assets.stryker.com/is/image/${path}`);
      img.setAttribute("alt", "");
      const box = doc.createElement("div");
      box.className = "c-standalone-image";
      box.append(img);
      component.replaceWith(box);
    });
  }
  function numberCounters(main, doc, h) {
    main.querySelectorAll(".numbercounter").forEach((component) => {
      const widget = component.querySelector('[data-widget="numbercounter"]');
      if (!widget) return;
      const end = widget.getAttribute("data-numbercounter-end-number") || "";
      const type = widget.getAttribute("data-numbercounter-number-type");
      const currency = widget.getAttribute("data-numbercounter-currency-type") || "";
      let figure = end;
      if (type === "3") figure = `${end}%`;
      else if (type === "2") figure = `${currency}${end}`;
      const nodes = [];
      if (end) {
        const strong = doc.createElement("strong");
        strong.textContent = figure;
        const p = doc.createElement("p");
        p.append(strong);
        nodes.push(p);
      }
      const label = [...widget.children].find((el) => !el.querySelector(".numbercounter-number") && h.text(el));
      if (label) {
        const p = doc.createElement("p");
        label.querySelectorAll("br").forEach((br) => br.replaceWith(doc.createTextNode(" ")));
        p.textContent = h.text(label);
        nodes.push(p);
      }
      if (nodes.length) component.replaceWith(h.richText(doc, nodes));
    });
  }
  var WHITE = /^(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
  var COLOURED_BOX = '.has-background:not(.bg-white), .c-full-bleed-panel[class*="bg-"]';
  function whiteText(main, doc, h) {
    main.querySelectorAll('[style*="color"]').forEach((el) => {
      const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (!m || !WHITE.test(m[1].trim()) || !el.closest(COLOURED_BOX) || !h.text(el)) return;
      if (el.parentElement.closest('[style*="color"]') && WHITE.test((el.parentElement.closest('[style*="color"]').getAttribute("style") || "").replace(/.*color\s*:\s*([^;]+).*/i, "$1").trim())) return;
      el.prepend(doc.createTextNode("[[color-white]"));
      el.append(doc.createTextNode("]"));
      el.setAttribute("data-white-tag", "");
    });
  }
  function eventCalendars(main) {
    main.querySelectorAll(".c-event").forEach((component) => (component.closest(".event") || component).remove());
  }
  function convertBeforeRows(main, doc, h) {
    fastFacts(main, doc, h);
    whiteText(main, doc, h);
    interactiveImages(main, doc);
    numberCounters(main, doc, h);
    accordionsInColumns(main, doc, h);
    eventCalendars(main);
    pageHeroes(main, doc, h);
    engagementCtas(main, doc, h);
    groupLists(main, doc, h);
  }
  function convertAfterRows(main, doc, h) {
    navigationBars(main, doc, h);
    accordions(main, doc, h);
    textBoxes(main, doc, h);
    tabs(main, doc, h);
    fullBleedPanels(main, doc, h);
  }

  // tools/importer/long-page-detail-corp-xf-slots.js
  var long_page_detail_corp_xf_slots_default = {
    "/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html": {
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master": "cols:1",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/endoscopy/en/systems/connected_or/surgical-workflow/master": ""
    },
    "/us/en/communications/systems/-isuite-experience/procare-services.html": {
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master": "cols:1"
    },
    "/us/en/communications/systems/-isuite-experience/room-design.html": {
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master": "cols:1"
    },
    "/us/en/endoscopy/products/1788-platform/general-surgery.html": {
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master": "cols:1"
    },
    "/us/en/endoscopy/products/1788-platform/thoracic.html": {
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master": "cols:1"
    },
    "/us/en/endoscopy/products/1788-platform/urology.html": {
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master": "cols:1"
    },
    "/us/en/endoscopy/products/thermaclear.html": {
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master": "cols2_2_3_1_3:2",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master": "cols:1"
    },
    "/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html": {
      "/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/global-statistics/master": "",
      "/content/experience-fragments/stryker/joint-replacement/en/training_and_educati/stryker_training_aca/sta-callout-and-signup-invite/master": ""
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

  // tools/importer/long-page-detail-corp-xf.js
  var long_page_detail_corp_xf_default = {
    "/us/en/about/corporate-responsibility/overview.html": ["/content/experience-fragments/stryker/corporate/en/corporate_responsibi/overview/our-corporate-responsibility-commitments/master"],
    "/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/endoscopy/en/systems/connected_or/surgical-workflow/master"
    ],
    "/us/en/communications/systems/-isuite-experience/procare-services.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master"
    ],
    "/us/en/communications/systems/-isuite-experience/room-design.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master"
    ],
    "/us/en/endoscopy/products/1788-platform/general-surgery.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master"
    ],
    "/us/en/endoscopy/products/1788-platform/thoracic.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master"
    ],
    "/us/en/endoscopy/products/1788-platform/urology.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master"
    ],
    "/us/en/endoscopy/products/thermaclear.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master"
    ],
    "/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html": [
      "/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/global-statistics/master",
      "/content/experience-fragments/stryker/joint-replacement/en/training_and_educati/stryker_training_aca/sta-callout-and-signup-invite/master"
    ],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/b2-glenoid-critical-assessment---virtual-implantation-using-blue.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/b2-glenoid-critical-assessment---virtual-implantation-using-blue/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/b2-glenoid-critical-assessment---virtual-implantation-using-blue0.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/b2-glenoid-critical-assessment---virtual-implantation-using-blue0/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/blueprint--complex-case-debate--pre-operative-planning-and-decis.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--complex-case-debate--pre-operative-planning-and-decis/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/blueprint--complex-case-debate--pre-operative-planning-for-an-au.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--complex-case-debate--pre-operative-planning-for-an-au/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/blueprint--plan-optimization-for-a-b2-deformity-featuring-dr--sh.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--plan-optimization-for-a-b2-deformity-featuring-dr--sh/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/blueprint--the-experts--perspective.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--the-experts--perspective/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/blueprint--tutorial-using-aequalis--perform--with-gilles-walch--.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--tutorial-using-aequalis--perform--with-gilles-walch--/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/clinical-corner-series---dr--jay-keener-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series---dr--jay-keener/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/clinical-use-of-blueprint--on-a-b3-glenoid---part-1-case-plannin.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---part-1-case-plannin/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/clinical-use-of-blueprint--on-a-b3-glenoid---part-2-surgery-and-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---part-2-surgery-and-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/clinical-use-of-blueprint--on-a-b3-glenoid---parts-1---2---armod.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---parts-1---2---armod/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/how-blueprint-works---from-ct-to-3d.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/how-blueprint-works---from-ct-to-3d/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/pre-operative-planning---virtual-surgery--augmented-anatomic-com.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/pre-operative-planning---virtual-surgery--augmented-anatomic-com/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/primary-anatomic-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/primary-anatomic/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/primary-reversed-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/primary-reversed/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/shoulder-arthroplasty-featuring-blueprint--aequalis--perform--sh.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--aequalis--perform--sh/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/shoulder-arthroplasty-featuring-blueprint--aequalis--perform-sho.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--aequalis--perform-sho/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/blueprint/shoulder-arthroplasty-featuring-blueprint--planning---surgery---.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--planning---surgery---/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/humeral-fracture-management/fractures-about-the-prosthesis--glenoid-and-humerus--what-do-you.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/fractures-about-the-prosthesis--glenoid-and-humerus--what-do-you/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/humeral-fracture-management/nail--plate--or-arthroplasty--clinical-decisions-for-proximal-hu.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/nail--plate--or-arthroplasty--clinical-decisions-for-proximal-hu/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/3d-virtual-planning-for-a-severely-retroverted-glenoid-with-bren.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/3d-virtual-planning-for-a-severely-retroverted-glenoid-with-bren/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/abcs-of-the-gilles-walch-classification--asap-meeting-2020.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/abcs-of-the-gilles-walch-classification--asap-meeting-2020/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/aequalis-trade--shoulder-system-extraction-instrument-overview.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/aequalis-trade--shoulder-system-extraction-instrument-overview/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/anatomic-total-shoulder-arthroplasty-live-streamed-from-midwest-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/anatomic-total-shoulder-arthroplasty-live-streamed-from-midwest-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--alternative-retractor-uses-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--alternative-retractor-uses/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--back-table-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--back-table-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--mayo-stand-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--mayo-stand-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--operating-room-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--operating-room-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--or-staff-roles---responsibilities.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--or-staff-rules---responsibilities/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--patient-positioning.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--patient-positioning/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--staff-positioning.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--staff-positioning/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--sterile-prep-and-draping.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--sterile-prep-and-draping/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/approach--tips-and-pearls.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--tips-and-pearls/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/are-you-kidding--the-only-solution-is-revising-to-a-reverse-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/are-you-kidding--the-only-solution-is-revising-to-a-reverse/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/ases-shoulder-arthroplasty--exposure--humerus-and-glenoid.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/ases-shoulder-arthroplasty--exposure--humerus-and-glenoid/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/b2--is-bone-grafting-still-an-option--dr--keener---asap-meeting-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/b2--is-bone-grafting-still-an-option--dr--keener---asap-meeting-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/b2-glenoid-critical-assessment---virtual-implantation-using-blue.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/b2-glenoid-critical-assessment---virtual-implantation-using-blue0/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/b2-glenoid-critical-assessment---virtual-implantation-using-blue0.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/b2-glenoid-critical-assessment---virtual-implantation-using-blue/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/bio-rsa-for-a2-glenoid-erosion-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/bio-rsa-for-a2-glenoid-erosion/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/blueprint--complex-case-debate--pre-operative-planning-and-decis.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--complex-case-debate--pre-operative-planning-and-decis/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/blueprint--complex-case-debate--pre-operative-planning-for-an-au.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--complex-case-debate--pre-operative-planning-for-an-au/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/blueprint--plan-optimization-for-a-b2-deformity-featuring-dr--sh.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--plan-optimization-for-a-b2-deformity-featuring-dr--sh/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/blueprint--the-experts--perspective.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--the-experts--perspective/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/blueprint--tutorial-using-aequalis--perform--with-gilles-walch--.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/blueprint--tutorial-using-aequalis--perform--with-gilles-walch--/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/bone-preserving-tsa-with-simpliciti--and-perform---featuring-dr-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/bone-preserving-tsa-with-simpliciti--and-perform---featuring-dr-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series---dr--george-athwal-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--george-athwal/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series---dr--jay-keener-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--jay-keener/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series---dr--keith-m--baumgarten-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--keith-m--baumgarten/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series---dr--r--sean-churchill-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series---dr--r--sean-churchill/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series---dr--robert-tashjian-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--robert-tashjian/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--brent-morris.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--brent-morris/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--greg-nicholson.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--greg-nicholson/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--pascal-boileau--md--phd.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--pascal-boileau--md--phd/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--what-i-ve-learned---dr--gilles-walch.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--what-i-ve-learned---dr--gilles-walch/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series-dr-gilles-walch.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--what-i-ve-learned---dr--gilles-walch/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series-dr-r-sean-churchill-tornier-simpliciti.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-corner-series--dr--r--sean-churchill--tornier-simplicit/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-use-of-blueprint--on-a-b3-glenoid---part-1-case-plannin.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---part-1-case-plannin/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-use-of-blueprint--on-a-b3-glenoid---part-2-surgery-and-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---part-2-surgery-and-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-use-of-blueprint--on-a-b3-glenoid---parts-1---2---armod.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/clinical-use-of-blueprint--on-a-b3-glenoid---parts-1---2---armod/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/dr--moen-delto-pectoral-technique-surgical-video-approach--.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/dr--moen-delto-pectoral-technique-surgical-video-approach-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/fractures-about-the-prosthesis--glenoid-and-humerus--what-do-you.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/fractures-about-the-prosthesis--glenoid-and-humerus--what-do-you/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/glenoid-morphology--how-does-it-affect-my-plan--how-important-is.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/glenoid-morphology--how-does-it-affect-my-plan--how-important-is/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/how-blueprint-works---from-ct-to-3d.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/how-blueprint-works---from-ct-to-3d/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/humeral-osteotomy-technique.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/humeral-osteotomy-technique/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/introducing-blueprint--mixed-reality.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/introducing-blueprint--mixed-reality/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/making-sense-of-all-our-measures---inclination--version--subluxa.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/making-sense-of-all-our-measures---inclination--version--subluxa/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/my-10-tips-and-tricks-to-glenoid-exposure-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/my-10-tips-and-tricks-to-glenoid-exposure-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/nail--plate--or-arthroplasty--clinical-decisions-for-proximal-hu.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/nail--plate--or-arthroplasty--clinical-decisions-for-proximal-hu/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/pre-operative-planning---virtual-surgery--augmented-anatomic-com.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/pre-operative-planning---virtual-surgery--augmented-anatomic-com/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/primary-anatomic-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/primary-anatomic/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/primary-reversed-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/primary-reversed/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/primary-reversed.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/primary-reversed/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/revision--glenoid-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/revision--glenoid-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/revision--humerus--.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/revision--humerus-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/revision-arthroplasty-5-humeral-tips-to-remember-featuring-aequa.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/revision-arthroplasty-5-humeral-tips-to-remember-featuring-aequa/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-blueprint--aequalis--perform--sh.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--aequalis--perform--sh/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-blueprint--aequalis--perform-sho.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--aequalis--perform-sho/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-blueprint--planning---surgery---.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-blueprint--planning---surgery---/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-perform---reamer-instrument-asse.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-perform---reamer-instrument-asse/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-perform-reversed--surgical-video.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-perform-reversed--surgical-video/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-simpliciti--simpliciti--user-exp.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-simpliciti--simpliciti--user-exp/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex---gill.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex---gill/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-revision-tools-and-techniques--glenoid-implants.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-revision-tools-and-techniques--glenoid-implants/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/shoulder-revision-tools-and-techniques--humeral-implants.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-revision-tools-and-techniques--humeral-implants/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/simpliciti--shoulder-system-patient-testimonial---richard.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/simpliciti--shoulder-system-patient-testimonial---richard/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/simpliciti--shoulder-system-patient-testimonial-video---john-b.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/simpliciti--shoulder-system-patient-testimonial-video---john-b/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/simpliciti--shoulder-system-patient-testimonial-video---tommie-h.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/simpliciti--shoulder-system-patient-testimonial-video---tommie-h/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/simpliciti--shoulder-system-surgical-case---armodios-hatzidakis-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/simpliciti--shoulder-system-surgical-case---armodios-hatzidakis-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/surgeon-interview-with-dr--george-athwal--bone-preserving-tsa-us.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/surgeon-interview-with-dr--george-athwal--bone-preserving-tsa-us0/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/surgeon-interview-with-dr--george-athwal--bone-preserving-tsa-us0.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/surgeon-interview-with-dr--george-athwal--bone-preserving-tsa-us/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/surgical-exposure-for-treating-walch-b3-glenoids-with-augmented-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/surgical-exposure-for-treating-walch-b3-glenoids-with-augmented-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/tips---pearls--use-of-niceloop-trade--non-absorbable-braided-sut.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/tips---pearls--use-of-niceloop-trade--non-absorbable-braided-sut/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/treating-walch-b3-glenoids-with-augmented-reverse-tsas-by-dr--ge.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/treating-walch-b3-glenoids-with-augmented-reverse-tsas-by-dr--ge/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/what-s-new-with-the-b2-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/what-s-new-with-the-b2/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--alternative-retractor-uses-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--alternative-retractor-uses/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--back-table-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--back-table-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--mayo-stand-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--mayo-stand-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--operating-room-set-up-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--operating-room-set-up/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--or-staff-rules---responsibilities-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--or-staff-rules---responsibilities/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--patient-positioning.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--patient-positioning/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--staff-positioning.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--staff-positioning/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--sterile-prep-and-draping.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--sterile-prep-and-draping/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/approach--tips-and-pearls.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/approach--tips-and-pearls/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/ases-shoulder-arthroplasty--exposure--humerus-and-glenoid.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/ases-shoulder-arthroplasty--exposure--humerus-and-glenoid/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/dr--moen-delto-pectoral-technique-surgical-video-approach--.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/dr--moen-delto-pectoral-technique-surgical-video-approach-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex--rever0.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex--rever0/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex--rever1.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/shoulder-arthroplasty-featuring-the-aequalis-ascend--flex--rever1/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/surgical-exposure-for-treating-walch-b3-glenoids-with-augmented-.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/surgical-exposure-for-treating-walch-b3-glenoids-with-augmented-/master"],
    "/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-exposure/treating-walch-b3-glenoids-with-augmented-reverse-tsas-by-dr--ge.html": ["/content/experience-fragments/stryker/corporate/en/training_and_educati/wright_meded_vlc/upper_extremities/treating-walch-b3-glenoids-with-augmented-reverse-tsas-by-dr--ge/master"]
  };

  // tools/importer/transformers/long-page-detail-corp-sections.js
  var TEMPLATES = ["long-page-detail-corp", "long-page-detail-corp-fragments"];
  var XF_PAGES = Object.values(long_page_detail_corp_xf_default).flat().reduce((counts, xf) => {
    counts[xf] = (counts[xf] || 0) + 1;
    return counts;
  }, {});
  function sharedFragmentPath(xf) {
    return XF_PAGES[xf] > 1 ? xfToFragmentPath(xf) : null;
  }
  function keepHeadlineBlankLines(document) {
    const blank = (node) => !(node.textContent || "").replace(/\u00a0/g, " ").trim() && !(node.nodeType === 1 && node.querySelector("img, picture, iframe"));
    const textBeside = (node, dir) => {
      for (let n = node[dir]; n; n = n[dir]) {
        if (!blank(n)) return true;
      }
      return false;
    };
    document.querySelectorAll(".c-largeheadline .line p").forEach((p) => {
      if (!blank(p) || !textBeside(p, "nextSibling")) return;
      const breaks = textBeside(p, "previousSibling") ? 2 : 1;
      p.replaceWith(...Array.from({ length: breaks }, () => document.createElement("br")));
    });
  }
  var BLANK_LINE_PAGES = /* @__PURE__ */ new Set([
    "/us/en/training-and-education/orthopaedics/joint-replacement/Mako_surgeon_campaign.html"
  ]);
  function blankLineSpacers(document, url) {
    if (!BLANK_LINE_PAGES.has(new URL(url).pathname)) return;
    const blank = (node) => node.nodeType !== 1 || node.tagName === "P" && !node.textContent.replace(/\u00a0/g, " ").trim() && !node.querySelector("img, picture, iframe");
    document.querySelectorAll(".text.parbase > .c-rich-text-editor > div").forEach((box) => {
      const component = box.parentElement.parentElement;
      if (component.closest(".c-tabs, .panel, .c-accordion")) return;
      const items = [];
      [...box.childNodes].forEach((node) => {
        const prev = items[items.length - 1];
        if (node.nodeType === 1 && blank(node)) {
          if (items.length) items.push(null);
        } else if (prev) prev.push(node);
        else if (!blank(node) || items.length) items.push([node]);
      });
      if (!items.includes(null)) return;
      const parts = items.filter(Boolean);
      box.replaceChildren(...parts[0]);
      let last = component;
      items.slice(items.indexOf(parts[0]) + 1).forEach((item) => {
        if (!item) {
          const spacer = document.createElement("div");
          spacer.className = "largeheadline";
          const headline2 = document.createElement("div");
          headline2.className = "c-largeheadline page-section container";
          spacer.append(headline2);
          last.after(spacer);
          last = spacer;
          return;
        }
        if (!item.some((node) => !blank(node))) return;
        const copy = component.cloneNode(true);
        copy.querySelector(".c-rich-text-editor > div").replaceChildren(...item);
        last.after(copy);
        last = copy;
      });
    });
  }
  function edsLinkPaths(main) {
    main.querySelectorAll('a[href^="/"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (href.startsWith("//") || href.startsWith("/content/")) return;
      const [, path, suffix = ""] = href.match(/^([^?#]*)([?#].*)?$/);
      const slash = path.length > 1 && path.endsWith("/") ? "/" : "";
      const bare = path.replace(/\/$/, "");
      if (!bare) return;
      const clean3 = WebImporter.FileUtils.sanitizePath(bare);
      if (clean3 && clean3 !== bare) a.setAttribute("href", `${clean3}${slash}${suffix}`);
    });
  }
  var CENTRED_COLUMN = ":is(.aem-GridColumn--default--10, .aem-GridColumn--default--11).aem-GridColumn--offset--default--1";
  function columnStyle(component) {
    if (component.closest(CENTRED_COLUMN)) return "column-10-12";
    const col = component.matches(".c-largeheadline") && component.querySelector(".has-background:not(.bg-white)") && component.closest('[class*="col-sm-8"]');
    const row = col && col.parentElement;
    const empty = (c) => !c.textContent.trim() && !c.querySelector("img, iframe, [data-asset-path]");
    if (row && [...row.children].every((c) => c === col || empty(c))) {
      return "column-8-12";
    }
    return "";
  }
  function text4(el) {
    return (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function sourcePath(payload) {
    try {
      return new URL(payload.params.originalURL).pathname;
    } catch (e) {
      return "";
    }
  }
  function richText(doc, nodes) {
    const box = doc.createElement("div");
    box.className = "c-rich-text-editor";
    const inner = doc.createElement("div");
    inner.append(...nodes);
    box.append(inner);
    return box;
  }
  function rowColumns(colctrl) {
    const row = colctrl.querySelector(":scope > .row");
    return row ? [...row.children].filter((el) => /\bcol-(xs|sm|md)-\d+/.test(el.className)) : [];
  }
  function slotSignature(slot) {
    const colctrl = slot.closest(".colctrl");
    if (!colctrl) return "";
    const row = (colctrl.parentElement.className.match(/\bcols[\w-]*/) || [""])[0].replace(/-/g, "_");
    const column = rowColumns(colctrl).findIndex((col) => col.contains(slot)) + 1;
    return `${row}:${column}`;
  }
  function fragmentBlock(doc, path) {
    const a = doc.createElement("a");
    a.href = path;
    a.textContent = path;
    return WebImporter.Blocks.createBlock(doc, { name: "Fragment", cells: [[a]] });
  }
  function experienceFragments(main, doc, xfs, slots) {
    const filled = [...main.querySelectorAll(".experiencefragment")].filter((slot) => !slot.parentElement.closest(".experiencefragment")).filter((slot) => {
      if (text4(slot) || slot.querySelector("img, [data-asset-path], iframe")) return true;
      slot.remove();
      return false;
    });
    if (!filled.length) return;
    const seen = /* @__PURE__ */ new Set();
    filled.forEach((slot) => {
      let xf = xfs.length === 1 ? xfs[0] : null;
      if (!xf && slots) {
        const signature = slotSignature(slot);
        xf = Object.keys(slots).find((key) => slots[key] === signature) || null;
      }
      if (!xf) {
        main.ownerDocument.body.setAttribute("data-xf-unresolved", String(xfs.length));
        return;
      }
      if (seen.has(xf)) {
        slot.remove();
        return;
      }
      seen.add(xf);
      const path = sharedFragmentPath(xf);
      if (!path) return;
      const block = fragmentBlock(doc, path);
      block.setAttribute("data-keep", "section");
      slot.replaceWith(block);
    });
  }
  function sectionTitles(main, doc) {
    main.querySelectorAll(".c-section-title, .c-title").forEach((title) => {
      const nodes = [];
      const heading = title.querySelector("h2");
      if (heading && text4(heading)) {
        const h2 = doc.createElement("h2");
        const u = doc.createElement("u");
        u.textContent = text4(heading);
        h2.append(u);
        nodes.push(h2);
      }
      const container = title.querySelector(".title-container") || title;
      [...container.children].filter((el) => el !== heading && text4(el)).forEach((el) => {
        nodes.push(el.cloneNode(true));
      });
      if (!nodes.length) {
        const spacer = doc.createElement("div");
        spacer.className = "c-largeheadline";
        title.replaceWith(spacer);
        return;
      }
      title.replaceWith(richText(doc, nodes));
    });
  }
  function downloadTitles(main, doc) {
    main.querySelectorAll(".c-resourcesanddownload").forEach((downloads) => {
      const title = downloads.querySelector(".title-container :is(h2, h3, h4)");
      if (!title || !text4(title)) return;
      const h2 = doc.createElement("h2");
      const u = doc.createElement("u");
      u.textContent = text4(title);
      h2.append(u);
      (downloads.closest(".resourcesanddownload") || downloads).before(richText(doc, [h2]));
      title.remove();
    });
  }
  function videoCaptions(main, doc) {
    main.querySelectorAll(".c-standalone-video").forEach((video) => {
      const caption = video.querySelector(".desc-content");
      if (!caption) return;
      if (text4(caption)) {
        const copy = caption.cloneNode(true);
        (video.closest(".standalonevideo") || video).after(richText(doc, [...copy.childNodes]));
      }
      caption.remove();
    });
  }
  function localNav(main, doc) {
    const nav = main.querySelector(".localpagenavigation nav");
    if (!nav) return null;
    const parent = nav.querySelector("a.parent-node");
    const links = [...nav.querySelectorAll("ul.links > li > a[href]")];
    const more = [...nav.querySelectorAll("ul.hidden-links > li > a[href]")];
    const border = nav.classList.contains("nav-border-bottom");
    nav.closest(".localpagenavigation").remove();
    if (!parent && !links.length && !more.length) return null;
    const link2 = (source) => {
      const a = doc.createElement("a");
      a.href = source.getAttribute("href");
      a.textContent = text4(source);
      return a;
    };
    const list = (sources) => {
      const ul = doc.createElement("ul");
      sources.forEach((source) => {
        const li = doc.createElement("li");
        li.append(link2(source));
        ul.append(li);
      });
      return ul;
    };
    const rows = [[parent ? link2(parent) : ""], [list(links)]];
    if (more.length) rows.push([list(more)]);
    return WebImporter.Blocks.createBlock(doc, {
      name: border ? "Local Nav Corp (border)" : "Local Nav Corp",
      cells: rows
    });
  }
  function marketoBlock(container, doc) {
    const form = container.querySelector("form[data-marketo-form-id]");
    if (!form) return null;
    const cells = [
      ["Base URL", form.getAttribute("data-marketo-base-url") || ""],
      ["Munchkin ID", form.getAttribute("data-marketo-munchkin-id") || ""],
      ["Form ID", form.getAttribute("data-marketo-form-id") || ""]
    ];
    return WebImporter.Blocks.createBlock(doc, { name: "Marketo Form", cells });
  }
  var CELL_COMPONENTS = [
    ".c-rich-text-editor",
    ".c-standalone-image",
    ".c-standalone-video",
    ".c-largeheadline",
    ".c-curatedcta",
    ".buttonset",
    "table"
  ].join(", ");
  function linkedImage(component) {
    const img = component.querySelector("img");
    const link2 = img && img.closest("a[href]");
    return link2 && component.contains(link2) ? link2 : null;
  }
  function stackRow(columns) {
    return columns.length === 4 && columns.every((col) => !/\bcol-xs-([1-9]|1[01])\b/.test(col.className));
  }
  var BOX_COLOURS = {
    "light-gray": "gray",
    blue: "blue",
    gold: "gold",
    purple: "purple",
    "dark-gray": "dark"
  };
  var BOX_VARIANTS = /* @__PURE__ */ new Set([
    "gray-last",
    "gray-2",
    "gray-all",
    "boxed-all",
    "blue-all",
    "gold-lead",
    "dark-lead",
    "purple-last",
    "gold-first",
    "boxed-last",
    "gray-lead"
  ]);
  function cellBox(col) {
    const row = col.closest(".colctrl");
    const boxes = [...col.querySelectorAll(".has-background:not(.bg-white), .dimensional-box")].filter((b) => b.closest(".colctrl") === row && text4(b)).filter((b) => !b.parentElement.closest(".has-background:not(.bg-white), .dimensional-box"));
    if (!boxes.length) return null;
    const colourOf = (b) => {
      const bg = (b.className.match(/\bbg-([a-z-]+)/) || [])[1];
      if (b.classList.contains("dimensional-box") && (!bg || bg === "white")) return "boxed";
      return BOX_COLOURS[bg] || "";
    };
    const colours = [...new Set(boxes.map(colourOf))];
    if (colours.length !== 1 || !colours[0]) return { colour: "", kind: "" };
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const boxed = squash(boxes.map((b) => b.textContent).join(""));
    if (boxed === squash(col.textContent)) return { colour: colours[0], kind: "whole" };
    const first = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text4(c))[0];
    if (boxes.length === 1 && first && first.contains(boxes[0])) return { colour: colours[0], kind: "lead" };
    return { colour: "", kind: "" };
  }
  function boxVariant(columns) {
    const boxes = columns.map(cellBox);
    const used = boxes.filter(Boolean);
    if (!used.length) return "";
    const colours = [...new Set(used.map((b) => b.colour))];
    const kinds = [...new Set(used.map((b) => b.kind))];
    if (colours.length !== 1 || !colours[0] || kinds.length !== 1) return "";
    const textCols = columns.filter((col) => text4(col));
    let name = "";
    if (kinds[0] === "lead" && used.length === textCols.length) name = `${colours[0]}-lead`;
    const last = columns[columns.length - 1];
    if (kinds[0] === "lead" && used.length === 1 && boxes[columns.length - 1] && last.querySelector(".c-standalone-video, .c-standalone-image, [data-asset-path]")) {
      name = `${colours[0]}-last`;
    }
    if (kinds[0] === "whole") {
      if (used.length > 1 && used.length === textCols.length) name = `${colours[0]}-all`;
      else if (used.length === 1) {
        const i = boxes.findIndex(Boolean);
        if (i === columns.length - 1) name = `${colours[0]}-last`;
        else if (i === 0) name = `${colours[0]}-first`;
        else name = `${colours[0]}-${i + 1}`;
      }
    }
    return BOX_VARIANTS.has(name) ? name : "";
  }
  function cellNodes(col, doc) {
    const out = [];
    [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => !c.parentElement.closest(CELL_COMPONENTS)).forEach((c) => {
      if (c.matches(".c-rich-text-editor")) out.push(...richTextNodes(c, doc).nodes);
      else if (c.matches(".c-standalone-image")) {
        const nodes = imageNodes(c, doc);
        const link2 = linkedImage(c);
        if (link2 && nodes.length) {
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(link2, absoluteAsset(link2.getAttribute("href"))));
          a.textContent = link2.querySelector("img").getAttribute("alt") || text4(link2) || a.getAttribute("href");
          const p = doc.createElement("p");
          p.append(a);
          nodes.splice(1, 0, p);
        }
        out.push(...nodes);
      } else if (c.matches(".c-standalone-video")) {
        const a = videoLink(c, doc);
        if (a) {
          const p = doc.createElement("p");
          p.append(a);
          out.push(p);
        }
      } else if (c.matches(".c-largeheadline")) {
        const lines = headlineNodes(c, doc);
        if (c.hasAttribute("data-page-title") && lines.length) {
          out.push(titleHeading(lines, doc));
        } else out.push(...lines);
      } else if (c.matches(".c-curatedcta, .buttonset")) out.push(...buttonNodes(c, doc));
      else out.push(c);
    });
    return out;
  }
  function centredColumn(col) {
    const centred = (el) => !!el.closest('.text-center, [style*="text-align: center"], [style*="text-align:center"]');
    const images = [...col.querySelectorAll(".c-standalone-image img")];
    const paragraphs = [...col.querySelectorAll(".c-rich-text-editor :is(p, h1, h2, h3, h4, h5, h6, li), .c-standalone-image .title-content :is(h2, h3, h4, h5), .c-largeheadline .line")].filter((el) => text4(el));
    const items = [...images, ...paragraphs];
    return items.length > 0 && items.every(centred);
  }
  function sizeTag(copyStyle) {
    const size = (copyStyle || "").split(",").map((s) => s.trim()).find((s) => /^p-\d/.test(s));
    return size ? `text-${size.slice(2)}` : "";
  }
  function tagCopy(n, tag, doc) {
    const wrap = (first, last) => {
      if (first.nodeType === 3 && first.textContent.trimStart().startsWith(`[[${tag}]`)) return;
      first.before(doc.createTextNode(`[[${tag}]`));
      last.after(doc.createTextNode("]"));
    };
    if (!n.matches("ul, ol")) {
      if (n.firstChild) wrap(n.firstChild, n.lastChild);
      return;
    }
    n.querySelectorAll("li").forEach((li) => {
      const paragraphs = li.querySelectorAll(":scope > p");
      if (paragraphs.length) {
        paragraphs.forEach((p) => {
          if (p.firstChild) wrap(p.firstChild, p.lastChild);
        });
        return;
      }
      const inline2 = [];
      for (let c = li.firstChild; c && !(c.nodeType === 1 && c.matches("ul, ol")); c = c.nextSibling) inline2.push(c);
      if (inline2.some((c) => c.textContent.trim())) wrap(inline2[0], inline2[inline2.length - 1]);
    });
  }
  function rowCopyStyle(cells, doc) {
    const copy = cells.flat().filter((n) => n.nodeType === 1 && n.copyStyle !== void 0 && n.copyStyle !== null && !/^H\d$/.test(n.tagName));
    const weight = {};
    copy.forEach((n) => {
      weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text4(n).length;
    });
    let dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || "";
    if (sizeTag(dominant) && copy.some((n) => !sizeTag(n.copyStyle))) {
      dominant = dominant.split(",").map((s) => s.trim()).filter((s) => !/^p-\d/.test(s)).join(", ");
    }
    const serif = (style) => (style || "").split(",").map((x) => x.trim()).includes("serif");
    copy.filter((n) => sizeTag(n.copyStyle) && sizeTag(n.copyStyle) !== sizeTag(dominant)).forEach((n) => tagCopy(n, [sizeTag(n.copyStyle), serif(n.copyStyle) && !serif(dominant) ? "serif" : ""].filter(Boolean).join(","), doc));
    const parts = dominant.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.includes("serif") && !parts.some((s) => sizeTag(s))) return ["p-1", ...parts].join(", ");
    return dominant;
  }
  var COLUMN_VARIANTS = { "8,4": "columns-67-33", "4,8": "columns-33-67", "6,6": "columns-50-50" };
  function columnWidth(col) {
    const m = col.className.match(/\bcol-sm-(\d+)/) || col.className.match(/\bcol-md-(\d+)/);
    return m ? Number(m[1]) : 12;
  }
  function markRowEnds(main) {
    const COMPONENT2 = '[class^="c-"], [class*=" c-"]';
    const hasContent = (el) => text4(el) || el.querySelector("img, iframe, [data-asset-path]");
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      const row = colctrl.querySelector(":scope > .row");
      const all = row ? [...row.children] : [];
      const cols = all.filter(hasContent);
      if (cols.length !== 1 || all.length > 2) return;
      const units = [...cols[0].querySelectorAll(`.colctrl, ${COMPONENT2}`)].filter((el) => {
        const outer = el.parentElement.closest(`.colctrl, ${COMPONENT2}`);
        return (!outer || outer === colctrl) && (text4(el) || el.querySelector("img, iframe, [data-asset-path]") || el.matches('.c-full-bleed-panel[class*="bg-"]'));
      });
      const last = units[units.length - 1];
      if (!last) return;
      const unit = last.matches(".colctrl") && last.parentElement && /\bcols/.test(last.parentElement.className) ? last.parentElement : last;
      unit.setAttribute("data-row-end", String(Number(unit.getAttribute("data-row-end") || 0) + 1));
    });
    const mark = (el) => el.setAttribute("data-row-end", String(Number(el.getAttribute("data-row-end") || 0) + 1));
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      if (hasContent(colctrl) || colctrl.querySelector(".c-section-separator, .sectionseparator, hr")) return;
      const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
      let prev = wrapper.previousElementSibling;
      while (prev && !hasContent(prev)) prev = prev.previousElementSibling;
      if (!prev) return;
      if (/\bcols/.test(prev.className) && prev.querySelector(":scope > .colctrl")) {
        mark(prev);
        return;
      }
      const parts = [...prev.querySelectorAll(COMPONENT2)].filter((el) => !el.parentElement.closest(COMPONENT2) && hasContent(el));
      const last = parts[parts.length - 1] || (prev.matches(COMPONENT2) ? prev : null);
      if (last) mark(last);
    });
  }
  function columnRows(main, doc) {
    [...main.querySelectorAll(".colctrl")].reverse().forEach((colctrl) => {
      const all = rowColumns(colctrl);
      const filled = all.filter((col) => text4(col) || col.querySelector("img, [data-asset-path], iframe, form, table"));
      const columns = filled.length && filled.length < all.length && all.length >= 3 ? all : filled;
      if (columns.length < 2) return;
      const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
      const form = marketoBlock(colctrl, doc);
      if (form) {
        form.setAttribute("data-keep", "section");
        const asides = [...colctrl.querySelectorAll("table")].filter((t) => t.getAttribute("data-keep"));
        asides.forEach((t) => t.setAttribute("data-keep", "join"));
        const others = columns.filter((col) => !col.querySelector(".c-marketo-form") && !col.querySelector("table[data-keep]")).map((col) => cellNodes(col, doc)).filter((nodes) => nodes.length).map((nodes) => {
          const box = doc.createElement("div");
          box.setAttribute("data-keep", "join");
          box.append(...nodes);
          return box;
        });
        wrapper.replaceWith(form, ...asides, ...others);
        return;
      }
      const key = columns.map(columnWidth).join(",");
      const linked = filled.some((col) => [...col.querySelectorAll(".c-standalone-image")].some(linkedImage));
      const boxes = boxVariant(columns);
      if (!boxes) {
        colctrl.querySelectorAll("[data-white-tag]").forEach((el) => {
          const inBox = el.closest(".has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel");
          if (!inBox || inBox.matches(".c-full-bleed-panel") || inBox.closest(".colctrl") !== colctrl) return;
          if (el.firstChild && el.firstChild.nodeValue === "[[color-white]") el.firstChild.remove();
          if (el.lastChild && el.lastChild.nodeValue === "]") el.lastChild.remove();
          el.removeAttribute("data-white-tag");
        });
      }
      const parts = columns.length === 2 ? [...columns[0].querySelectorAll(`${CELL_COMPONENTS}, .sectionseparator`)].filter((c) => c.closest(".colctrl") === colctrl && (text4(c) || c.matches(".sectionseparator"))) : [];
      const firstRule = parts.length > 1 && parts[parts.length - 1].matches(".sectionseparator");
      const variant = [
        COLUMN_VARIANTS[key],
        linked ? "media-pair" : "",
        stackRow(columns) ? "stack" : "",
        boxes,
        firstRule ? "left-border-bottom" : ""
      ].filter(Boolean).join(", ");
      const centred = filled.every(centredColumn);
      const cells = columns.map((col) => cellNodes(col, doc));
      const style = [rowCopyStyle(cells, doc), centred ? "center" : ""].filter(Boolean).join(", ");
      const block = WebImporter.Blocks.createBlock(doc, {
        name: variant ? `Columns (${variant})` : "Columns",
        cells: [cells]
      });
      block.setAttribute("data-keep", "section");
      if (style) block.setAttribute("data-section-style", style);
      if (wrapper.hasAttribute("data-row-end")) block.setAttribute("data-row-end", wrapper.getAttribute("data-row-end"));
      wrapper.replaceWith(block);
    });
    [...main.querySelectorAll(".c-marketo-form")].forEach((component) => {
      const form = marketoBlock(component, doc);
      if (!form) return;
      form.setAttribute("data-keep", "section");
      (component.closest(".marketoform") || component).replaceWith(form);
    });
  }
  function tableRows(table) {
    return [...table.querySelectorAll(":scope > tbody > tr, :scope > tr")];
  }
  var MEDIA = 'img, picture, video, iframe, [data-asset-path], a[href*="/is/content/"], a[href*="/is/image/"]';
  var isMediaCell = (td) => !td.textContent.trim() || td.querySelector(MEDIA) && [...td.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].every((el) => el.querySelector(MEDIA) || !text4(el));
  function gridRows(main) {
    const isColumns = (el) => el && el.matches('table[data-keep="section"]') && /^Columns\b/.test(text4(tableRows(el)[0] || el));
    const empty = (el) => !text4(el) && !el.querySelector(`${MEDIA}, table, form, hr, .sectionseparator`) && !el.matches("[data-keep], .sectionseparator, hr");
    const next = (el) => {
      let n = el.nextElementSibling;
      while (n && empty(n)) n = n.nextElementSibling;
      return n;
    };
    const cellsOf = (table) => tableRows(table).slice(1).map((tr) => [...tr.children]);
    const textOnly = (td) => !td.querySelector(MEDIA);
    const sameBlock = (x, y) => isColumns(y) && text4(tableRows(y)[0]) === text4(tableRows(x)[0]);
    const takeEnd = (into, from) => {
      if (from.hasAttribute("data-row-end")) into.setAttribute("data-row-end", from.getAttribute("data-row-end"));
      else into.removeAttribute("data-row-end");
    };
    const blocks = () => [...main.querySelectorAll('table[data-keep="section"]')].filter(isColumns);
    blocks().forEach((first) => {
      const b = next(first);
      if (!first.isConnected || !sameBlock(first, b)) return;
      const [rowA] = cellsOf(first);
      const rowsB = cellsOf(b);
      const pair = cellsOf(first).length === 1 && rowsB.length === 1 && rowsB[0].length === rowA.length;
      const images = rowA.every(isMediaCell) && rowA.some((td) => td.querySelector(MEDIA));
      if (!pair || !images || !rowsB[0].every(textOnly)) return;
      rowA.forEach((td, i) => td.append(...rowsB[0][i].childNodes));
      const style = b.getAttribute("data-section-style");
      if (style) first.setAttribute("data-section-style", style);
      else first.removeAttribute("data-section-style");
      takeEnd(first, b);
      b.remove();
    });
    blocks().forEach((first) => {
      if (!first.isConnected) return;
      const width = cellsOf(first)[0].length;
      let b = next(first);
      while (sameBlock(first, b) && cellsOf(b).every((r) => r.length === width) && (first.getAttribute("data-section-style") || "") === (b.getAttribute("data-section-style") || "")) {
        const body = tableRows(first)[0].parentElement;
        tableRows(b).slice(1).forEach((tr) => body.append(tr));
        takeEnd(first, b);
        const after = next(b);
        b.remove();
        b = after;
      }
    });
  }
  function fullWidthImages(main, doc) {
    main.querySelectorAll(".imgBoxId.full-width-img").forEach((box) => {
      var _a, _b;
      const img = box.querySelector("img");
      if (!img) return;
      const desktop = ((_b = (_a = box.querySelector("source[srcset]") || {}).getAttribute) == null ? void 0 : _b.call(_a, "srcset")) || img.getAttribute("src");
      const phone = img.getAttribute("src");
      const alt = img.getAttribute("alt") || "";
      const holder = doc.createElement("div");
      holder.setAttribute("data-keep", "nodes");
      holder.setAttribute("data-section-style", box.classList.contains("bg-shadow") ? "full-width-image, shadow" : "full-width-image");
      [.../* @__PURE__ */ new Set([desktop, phone])].filter(Boolean).forEach((src) => {
        const p = doc.createElement("p");
        const image2 = doc.createElement("img");
        image2.setAttribute("src", src);
        image2.setAttribute("alt", alt);
        p.append(image2);
        holder.append(p);
      });
      box.replaceWith(holder);
    });
  }
  function renameTo(el, tag, doc) {
    if (el.tagName.toLowerCase() === tag) return el;
    const out = doc.createElement(tag);
    out.append(...el.childNodes);
    el.replaceWith(out);
    return out;
  }
  function sizeTagged(el, tag, doc) {
    el.prepend(doc.createTextNode(`[[${tag}]`));
    el.append(doc.createTextNode("]"));
    return el;
  }
  var TITLE_SIZES = ["1-25", "1-5", "1-75", "2", "2-5"];
  function titleFromHeading(heading, doc) {
    const level = heading.tagName;
    const h1 = renameTo(heading, "h1", doc);
    const spans = [...h1.querySelectorAll('[class*="fontsize-"]')].filter((span) => text4(span) === text4(h1));
    const size = spans.map((span) => (/\bfontsize-([\d-]+)em\b/.exec(span.className) || [])[1]).find((n) => TITLE_SIZES.includes(n));
    const h4Enlarged = level === "H4" && size === "2-5";
    if (size) spans.forEach((span) => span.classList.remove(...[...span.classList].filter((c) => c.startsWith("fontsize-"))));
    if (h4Enlarged) spans[0].classList.add("fontsize-h4-2-5");
    if (/^H[4-6]$/.test(level) && !h1.querySelector(".futura-bold, b, strong")) {
      const bold = doc.createElement("span");
      bold.className = "futura-bold";
      bold.append(...h1.childNodes);
      h1.append(bold);
    }
    if (size && !h4Enlarged) sizeTagged(h1, `text-${size}`, doc);
    return h1;
  }
  function dropDamVideos(main) {
    main.querySelectorAll(".c-standalone-video").forEach((video) => {
      const asset = video.querySelector("[data-asset-path]");
      if (asset && asset.getAttribute("data-asset-path").startsWith("/content/dam/")) {
        (video.closest(".standalonevideo") || video).remove();
      }
    });
  }
  var SHOW_TEXT = 4;
  function spaceUrlColons(main, doc) {
    const walker = doc.createTreeWalker(main, SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (/\S:https?:\/\//.test(node.textContent)) {
        node.textContent = node.textContent.replace(/(\S):(https?:\/\/)/g, "$1: $2");
      }
    }
  }
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    if (!payload || !payload.template || !TEMPLATES.includes(payload.template.name)) return;
    const doc = element.ownerDocument;
    const main = doc.querySelector('[role="main"]') || element;
    const path = sourcePath(payload);
    main.querySelectorAll(".hero-space").forEach((el) => el.remove());
    main.querySelectorAll(".fullWidthImageHero").forEach((el) => el.setAttribute("data-keep", "section"));
    dropDamVideos(main);
    fullWidthImages(main, doc);
    spaceUrlColons(main, doc);
    const nav = localNav(main, doc);
    experienceFragments(main, doc, long_page_detail_corp_xf_default[path] || [], long_page_detail_corp_xf_slots_default[path]);
    sectionTitles(main, doc);
    downloadTitles(main, doc);
    videoCaptions(main, doc);
    const hasTitle = !!(main.querySelector(".h1-title h1") && text4(main.querySelector(".h1-title h1"))) || !!main.querySelector(".fullWidthImageHero h1, .c-autocarousel h1");
    let firstTitle = !hasTitle && [...main.querySelectorAll(".c-largeheadline, .c-rich-text-editor :is(h1, h2, h3, h4, h5, h6)")].find((el) => text4(el) && !el.closest(".h1-title"));
    const firstHeadline = firstTitle && firstTitle.matches(".c-largeheadline") ? firstTitle : null;
    if (firstTitle && !firstHeadline) firstTitle = titleFromHeading(firstTitle, doc);
    main.querySelectorAll(".c-rich-text-editor h1").forEach((h) => {
      if (h === firstTitle) return;
      const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
      const bold = [...h.querySelectorAll(".futura-bold, b, strong")].filter((b) => !b.parentElement.closest(".futura-bold, b, strong"));
      const serif = squash(bold.map((b) => b.textContent).join("")) !== squash(h.textContent);
      const big = [...h.querySelectorAll(".fontsize-1-75em")].filter((s) => !s.parentElement.closest(".fontsize-1-75em"));
      const statement = squash(big.map((s) => s.textContent).join("")) === squash(h.textContent);
      const tag = [statement ? "text-3-5" : "text-2", serif ? "serif" : ""].filter(Boolean).join(",");
      if (statement) big.forEach((span) => span.classList.remove("fontsize-1-75em"));
      sizeTagged(renameTo(h, statement ? "p" : "h2", doc), tag, doc);
    });
    if (firstHeadline) {
      firstHeadline.setAttribute("data-page-title", "");
      firstHeadline.querySelectorAll("b").forEach((b) => {
        if (!b.closest(".futura-bold") && !b.querySelector(".futura-bold")) b.replaceWith(...b.childNodes);
      });
    }
    const helpers = {
      cellNodes,
      richText,
      text: text4,
      tagCopy
    };
    convertBeforeRows(main, doc, helpers);
    markRowEnds(main);
    columnRows(main, doc);
    gridRows(main);
    convertAfterRows(main, doc, helpers);
    main.querySelectorAll('[data-row-end]:not([data-keep], [class^="c-"], [class*=" c-"])').forEach((wrapper) => {
      const parts = [...wrapper.querySelectorAll('[data-keep], [class^="c-"], [class*=" c-"]')].filter((el) => !el.parentElement.closest('[data-keep], [class^="c-"], [class*=" c-"]') && (text4(el) || el.querySelector("img, iframe, [data-asset-path]")));
      const last = parts[parts.length - 1];
      if (last) {
        const count = Number(wrapper.getAttribute("data-row-end")) + Number(last.getAttribute("data-row-end") || 0);
        last.setAttribute("data-row-end", String(count));
      }
      wrapper.removeAttribute("data-row-end");
    });
    buildArticle(element, {
      keep: ".c-resourcesanddownload, [data-keep]",
      spacer: false,
      componentStyle: columnStyle
    });
    if (nav) element.prepend(nav, doc.createElement("hr"));
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
  function transform2(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isNewsDetail = !!(payload && payload.template && [
      "news-detail",
      "news-detail-xf",
      "long-page-detail-corp",
      "long-page-detail-corp-fragments",
      "event-detail",
      "contact-division"
    ].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          heading.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text5 = span.textContent.replace(/ /g, " ").trim();
            if (!text5) return;
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
        const text5 = span.textContent.replace(/ /g, " ").trim();
        if (!text5) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text5;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text5) {
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-long-page-detail-corp.js
  var PAGE_TEMPLATE = {
    name: "long-page-detail-corp",
    description: "www.stryker.com long-page-detail pages (#469): H1 title; Virtual Learning Center video section (underlined H2 title, Video block, H3 description, Cards Corp (resources) downloads) or a shared Experience Fragment as a Fragment block; video detail pages (Video + caption); text articles; medical-education and landing pages (source column rows as Columns, local navigation as Local Nav Corp, full-width image hero / carousel as Hero Corp (image-slide), Marketo Form with the contact-aside Fragment); small print and document code as a `disclaimer` section; `published` with `last-updated: false` (the corp Last Updated line is not shown for now).",
    urls: [
      "https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--brent-morris.html",
      "https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/emergency-care/emergency-care/video/lifepak-cr2-aed.html",
      "https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn/smoke-evacuation--a-review-of-the-standards131.html"
    ],
    blocks: [
      { name: "video", instances: [".c-standalone-video"] },
      { name: "cards-corp-resources", instances: [".c-resourcesanddownload"] },
      { name: "cards-corp-teaser", instances: [".c-customizeable"] },
      { name: "hero-full-width-image", instances: [".fullWidthImageHero"] },
      { name: "hero-image-slide", instances: [".c-autocarousel"] }
    ]
  };
  var parsers = {
    video: parse,
    "cards-corp-resources": parse2,
    "cards-corp-teaser": parse3,
    "hero-full-width-image": parse4,
    "hero-image-slide": parse5
  };
  var transformers = [
    transform,
    transform2,
    transform3
  ];
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
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    const updated = document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);
    if (!updated) return "";
    const month = (/* @__PURE__ */ new Date(`${updated[1]} 1, 2000`)).getMonth() + 1;
    return `${updated[2]}-${String(month).padStart(2, "0")}`;
  }
  var import_long_page_detail_corp_default = {
    // before the importer's own cleanup, which drops empty paragraphs
    preprocess: ({ document, params }) => {
      keepHeadlineBlankLines(document);
      blankLineSpacers(document, params.originalURL);
    },
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
      const hcp = !!document.querySelector(".g-hcpbanner");
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
      edsLinkPaths(main);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      meta.template = PAGE_TEMPLATE.name;
      if (hcp) meta["hcp-banner"] = "true";
      if (published) {
        meta.published = published;
        meta["last-updated"] = "false";
      }
      const unresolvedXfs = main.getAttribute("data-xf-unresolved");
      main.removeAttribute("data-xf-unresolved");
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: __spreadValues({
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }, unresolvedXfs ? { "xf-unresolved": unresolvedXfs } : {})
      }];
    }
  };
  return __toCommonJS(import_long_page_detail_corp_exports);
})();
