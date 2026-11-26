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
  function clean(text4) {
    return (text4 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function link(document, source, text4) {
    const a = document.createElement("a");
    a.setAttribute("href", source.getAttribute("href"));
    a.textContent = text4;
    return a;
  }
  function imageCell(item, document) {
    const source = item.querySelector(".img-cont img, img");
    if (!source) return "";
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
    item.querySelectorAll(".desc-container > p, :scope > p.description").forEach((source) => {
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
    const items = [...element.querySelectorAll(".item")].filter((item) => item.querySelector("img, h3"));
    if (!items.length) return;
    const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
    const cols = items[0].className;
    let variant = "";
    if (/\bcol-sm-4\b/.test(cols)) variant = ", three-up";
    else if (/\bcol-sm-6\b/.test(cols)) variant = ", two-up";
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: `Cards Corp (teaser${variant})`, cells }));
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
    // data-btn-style: the section style a link asks for (buildArticle adds it to its section);
    // data-blank-before: a blank line above its button on the source (the semantic transformer's
    // Columns `button-gap`)
    A: ["href", "data-btn-style", "data-blank-before"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"]
  };
  function text2(el) {
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
    const newTab3 = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || newTab3 ? `${href}#_blank` : href;
  }
  var SIZE_STYLES = [
    // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph)
    ["fontsize-8em", "disclaimer"],
    ["fontsize-1-25em", "p-1-25"],
    ["fontsize-1-5em", "p-1-5"],
    ["fontsize-1-75em", "p-1-75"],
    // long-page-detail-corp: 28px and 35px copy (p-2 / p-2-5, template CSS)
    ["fontsize-2em", "p-2"],
    ["fontsize-2-5em", "p-2-5"],
    // 49px: nested sizes only (1.75em in 2em, build-your-asc)
    ["fontsize-3-5em", "p-3-5"]
  ];
  var HEADING_SIZES = [
    ["H2", "fontsize-8em", "h2-0-8"],
    ["H2", "fontsize-1-5em", "h2-1-5"],
    ["H1", "fontsize-1-25em", "h1-1-25"],
    // build-your-asc "ASC New Build Playbook" (an H3 in 1.25em, then 1.75em inside it)
    ["H3", "fontsize-1-25em", "h3-1-25"],
    // a Heading 4 enlarged 2.5x that is the page title (Mako thank-you page; marked by
    // long-page-detail-corp-sections.js → titleFromHeading)
    ["H1", "fontsize-h4-2-5", "h4-2-5"]
  ];
  var HEADING_TAGS = ["text-1-25", "text-1-5", "text-1-75", "text-2"];
  var SIZE_TAGS = [
    // 0.8em on part of a paragraph (TEACH talks: the 11.2px "• TSA • RSA" link groups)
    ["fontsize-8em", "text-0-8"],
    ["fontsize-1-25em", "text-1-25"],
    ["fontsize-1-5em", "text-1-5"],
    ["fontsize-1-75em", "text-1-75"],
    ["fontsize-2em", "text-2"],
    ["fontsize-2-5em", "text-2-5"]
  ];
  var FONT_STYLES = [
    ["urw-egyptienne", "serif"]
  ];
  var SIZE_FACTORS = {
    "fontsize-8em": 0.8,
    "fontsize-1-25em": 1.25,
    "fontsize-1-5em": 1.5,
    "fontsize-1-75em": 1.75,
    "fontsize-2em": 2,
    "fontsize-2-5em": 2.5,
    "fontsize-3-5em": 3.5
  };
  function copyStyles(root) {
    const candidates = root.matches && root.matches("p, li") ? [root] : [...root.querySelectorAll("p, li")];
    const copy = candidates.filter((el) => text2(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
    });
    const covering = SIZE_STYLES.filter(([cls]) => covers(cls));
    let size = covering[0];
    if (covering.length > 1) {
      const factor = covering.reduce((f, [cls]) => f * SIZE_FACTORS[cls], 1);
      const nearest = SIZE_STYLES.reduce((best, entry) => Math.abs(SIZE_FACTORS[entry[0]] - factor) < Math.abs(SIZE_FACTORS[best[0]] - factor) ? entry : best);
      size = Math.abs(factor - 1) < Math.abs(SIZE_FACTORS[nearest[0]] - factor) ? void 0 : nearest;
    }
    const coversFont = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      const bold = [...el.querySelectorAll(".futura-bold")].filter((span) => !span.closest(`.${cls}`) && !span.parentElement.closest(".futura-bold"));
      const covered = squash(spans.map((span) => span.textContent).join("")) + squash(bold.map((span) => span.textContent).join(""));
      return spans.length > 0 && covered.length === squash(el.textContent).length;
    });
    const font = FONT_STYLES.find(([cls]) => coversFont(cls));
    return [size && size[1], font && font[1]].filter(Boolean).join(", ");
  }
  function tagPlainBoldLabels(root, wholeParagraphs) {
    const doc = root.ownerDocument;
    [...root.querySelectorAll("b")].forEach((b) => {
      if (b.closest(".futura-bold, .standalone-link") || b.querySelector(".futura-bold") || b.parentElement.closest("b")) return;
      if (b.closest(".urw-egyptienne") && !b.closest("a") && text2(b)) {
        b.prepend(doc.createTextNode("[[serif]"));
        b.append(doc.createTextNode("]"));
        return;
      }
      if (b.closest(".urw-egyptienne, a") || b.querySelector(".urw-egyptienne, a") || !text2(b)) return;
      const block = b.closest(wholeParagraphs ? "p, li, div, h1, h2, h3, h4, h5, h6" : "p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text2(block) === text2(b)) return;
      b.before(doc.createTextNode("[[body-font]"));
      b.after(doc.createTextNode("]"));
    });
  }
  var GOLD = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i;
  var BLUE = /^(?:#1c5687|rgb\(\s*28\s*,\s*86\s*,\s*135\s*\))$/i;
  function ownColour(el) {
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? m[1].trim() : "";
  }
  var PURPLE = /^(?:#85458a|rgb\(\s*133\s*,\s*69\s*,\s*138\s*\))$/i;
  var TEAL = /^(?:#4c7d7a|rgb\(\s*76\s*,\s*125\s*,\s*122\s*\))$/i;
  var DARK_GREY = /^(?:#545857|rgb\(\s*84\s*,\s*88\s*,\s*87\s*\))$/i;
  var LIGHT_GRAY = /^(?:#b2b4ae|rgb\(\s*178\s*,\s*180\s*,\s*174\s*\))$/i;
  function hasOtherColour(node, own = GOLD) {
    if (node.nodeType !== 1) return false;
    const coloured = [node, ...node.querySelectorAll('[style*="color"]')].filter((el) => ownColour(el) && !own.test(ownColour(el)));
    return coloured.some((el) => [...el.childNodes].some((child) => child.nodeType === 3 ? child.textContent.trim() : !ownColour(child) && text2(child)));
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
        if (span.parentElement.closest(`.${cls}`) || !text2(span)) return;
        const h4 = span.closest("h4");
        if (h4 && ["text-1-25", "text-1-5"].includes(tag) && squash(h4.textContent) === squash(span.textContent)) {
          bracketTag([span], tag, root);
          return;
        }
        const heading = span.closest("h2, h3");
        if (heading) {
          const own = HEADING_SIZES.filter(([t]) => t === heading.tagName).map(([, c]) => c);
          if (!own.includes(cls) && HEADING_TAGS.includes(tag)) {
            bracketTag([...span.childNodes], tag, root);
          }
          return;
        }
        const block = span.closest("p, li");
        if (!block || span.closest("h1, h2, h3, h4, h5, h6")) return;
        if (squash(block.textContent) === squash(span.textContent)) return;
        const nodes = [...span.childNodes];
        const blank = (n) => !n.textContent.trim() && !(n.nodeType === 1 && n.querySelector("img"));
        while (nodes.length && blank(nodes[0])) nodes.shift();
        while (nodes.length && blank(nodes[nodes.length - 1])) nodes.pop();
        bracketTag(nodes, tag, root);
      });
    });
  }
  function tagColourText(root, own, tag) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap2 = (nodes) => bracketTag(nodes, tag, root);
    const wrapRun = (nodes) => {
      nodes.filter((n) => n.nodeType === 1).forEach((n) => tagged.add(n));
      wrap2(nodes);
    };
    root.querySelectorAll('[style*="color"]').forEach((el) => {
      if (!own.test(ownColour(el)) || [...tagged].some((t) => t.contains(el))) return;
      if (!hasOtherColour(el, own)) {
        wrapRun([el]);
        return;
      }
      let run = [];
      [...el.childNodes].forEach((child) => {
        if (hasOtherColour(child, own)) {
          wrapRun(run);
          run = [];
        } else run.push(child);
      });
      wrapRun(run);
    });
  }
  function tagGoldText(root) {
    tagColourText(root, GOLD, "color-gold");
    tagColourText(root, PURPLE, "color-purple");
    tagColourText(root, DARK_GREY, "color-grey");
  }
  function cleanRichText(root, { wholeParagraphs = false } = {}) {
    const blocks2 = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text2(el));
    const centred = blocks2.length > 0 && blocks2.every((el) => /text-align:\s*center/i.test(el.getAttribute("style") || ""));
    const right = blocks2.length > 0 && blocks2.every((el) => /text-align:\s*right/i.test(el.getAttribute("style") || ""));
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
      const links = span.closest("a") ? [span.closest("a")] : [...span.querySelectorAll("a")];
      links.forEach((a) => standalone.add(a));
    });
    root.querySelectorAll(".standalone-link").forEach((span) => {
      if (span.closest("a")) return;
      const walker = doc.createTreeWalker(span, 4);
      const bullets = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.parentElement.closest("a") && n.textContent.includes("\u2022")) bullets.push(n);
      }
      let coloured = span;
      while (coloured && coloured !== root && !ownColour(coloured)) coloured = coloured.parentElement;
      const blue = coloured && coloured !== root && BLUE.test(ownColour(coloured));
      bullets.forEach((n) => {
        const bullet = n.splitText(n.textContent.indexOf("\u2022"));
        bullet.splitText(1);
        bracketTag([bullet], blue ? "color-blue,body-font" : "body-font", root);
      });
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
      if (!text2(el) && !el.querySelector("img")) el.remove();
    });
    return { centred, right, size };
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
      if (!text2(h)) return false;
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
      if (!LABEL_HEADING.test(text2(h))) return;
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
  function smallHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const styles = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2, h3").forEach((h) => {
      if (!text2(h)) return;
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
      const leadText = text2(lead).replace(/[\s\u00a0]+/g, "");
      const covered = [...lead.querySelectorAll(styled)].filter((span) => !span.parentElement.closest(styled)).map((span) => span.textContent).join("").replace(/[\s\u00a0]+/g, "");
      if (!leadText || covered !== leadText || !text2(p)) {
        p.prepend(...lead.childNodes);
        return;
      }
      while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
      p.before(lead);
    });
  }
  function splitGroupLabels(root) {
    const doc = root.ownerDocument;
    [...root.children].filter((el) => el.tagName === "P").forEach((p) => {
      const first = p.firstElementChild;
      if (!first || first !== p.firstChild || !first.matches(".futura-bold") || first.querySelector("a")) return;
      const breaks = [...first.querySelectorAll("br")];
      if (breaks.length < 2 || !text2(first)) return;
      const rest = [...p.childNodes].slice(1);
      if (!rest.some((n) => n.nodeType === 1 && (n.matches("a") || n.querySelector("a")))) return;
      const label = doc.createElement("p");
      label.append(first);
      p.before(label);
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
    if (!text2(p)) p.remove();
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
        return n.nodeType === 3 ? n.textContent.trim() : text2(n) || ((_a = n.querySelector) == null ? void 0 : _a.call(n, "img"));
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
        if (text2(node) || node.querySelector("img")) nodes.push(node);
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
    const BLOCK = "p, div, ul, ol, table, h1, h2, h3, h4, h5, h6, blockquote";
    [...box.children].filter((el) => el.tagName === "DIV" && !el.querySelector(BLOCK) && text2(el) && el.firstElementChild && el.firstElementChild === el.firstChild && el.firstElementChild.matches(".futura-bold")).forEach((div) => {
      const p = doc.createElement("p");
      p.append(...div.childNodes);
      div.replaceWith(p);
      tagColourText(p, TEAL, "color-teal");
      const next = p.nextElementSibling;
      if (next && next.tagName === "P" && /^_{5,}$/.test(text2(next))) {
        const breaks = [...p.querySelectorAll("br")];
        const last2 = breaks[breaks.length - 1];
        if (last2 && !text2(p).endsWith("\n") && ![...p.childNodes].slice(-1)[0].textContent.trim()) last2.remove();
        p.append(doc.createElement("br"), ...next.childNodes);
        next.remove();
      }
    });
    labelHeadingsToParagraphs(box);
    splitStyledLeads(box);
    splitGroupLabels(box);
    const plainBold = plainBoldParagraphs(box);
    const serifHeads = serifHeadings(box);
    const smallHeads = smallHeadings(box);
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    const { centred, right, size } = cleanRichText(box);
    const nodes = blockNodes(box, doc);
    nodes.forEach((node) => {
      if (plainBold.has(node)) node.boldBody = true;
      if (serifHeads.has(node)) node.serifHeading = true;
      if (smallHeads.has(node)) node.headingStyle = smallHeads.get(node);
    });
    let last = null;
    nodes.forEach((node) => {
      const style2 = elementStyles.get(node);
      node.copyStyle = style2 === void 0 || style2 === null ? last : style2;
      if (node.copyStyle !== null) last = node.copyStyle;
    });
    const first = nodes.find((node) => node.copyStyle !== null);
    nodes.forEach((node) => {
      if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : size || "";
    });
    return {
      nodes,
      centred,
      right,
      size
    };
  }
  function imageColumnStyle(component) {
    const col = component.closest('[class*="col-sm-"]');
    const match = col && col.className.match(/\bcol-sm-(4|6)\b/);
    if (!match) return "";
    const others = [...col.parentElement.children].filter((el) => el !== col);
    if (others.some((el) => text2(el) || el.querySelector("img, video, iframe"))) return "";
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
        if (!text2(title)) return;
        const h4 = doc.createElement("h4");
        h4.textContent = text2(title);
        nodes.push(h4);
      });
      component.querySelectorAll(".c-standalone-image-content > p.u-white-space-pre").forEach((caption) => {
        if (!text2(caption)) return;
        const p = doc.createElement("p");
        p.textContent = text2(caption);
        nodes.push(p);
      });
    }
    return nodes;
  }
  function buttonNodes(component, doc) {
    return [...component.querySelectorAll("a[href]")].filter((a) => text2(a)).map((source) => {
      const a = doc.createElement("a");
      a.setAttribute("href", newTabHref(source, absoluteAsset(source.getAttribute("href"))));
      if (source.matches(".action-link, li a")) {
        const u = doc.createElement("u");
        u.textContent = text2(source);
        a.append(u);
        const strong2 = doc.createElement("strong");
        strong2.append(a);
        const p2 = doc.createElement("p");
        p2.append(strong2);
        return p2;
      }
      a.textContent = text2(source);
      const colour = ["btn-purple", "btn-blue"].find((cls) => source.classList.contains(cls));
      if (colour) a.setAttribute("data-btn-style", colour);
      if (component.hasAttribute("data-blank-before")) a.setAttribute("data-blank-before", "");
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
      const blocks2 = [...line.querySelectorAll(BLOCKS)].filter((block) => text2(block) && !block.parentElement.closest(BLOCKS));
      return blocks2.length > 1 ? blocks2 : [line];
    });
    const tags2 = segments.map(headlineTag);
    const VW = /\bfontsize-(\d+(?:-\d+)?)-?vw\b/;
    segments.forEach((segment, i) => {
      const own = (/\bheadline-(\d+(?:-\d+)?)\b/.exec(tags2[i] || "") || [])[1];
      if (!own) return;
      [...segment.querySelectorAll('[class*="fontsize-"]')].forEach((span) => {
        const n = (VW.exec(span.className) || [])[1];
        if (!n || n === own || !text2(span)) return;
        const outer = span.parentElement.closest('[class*="fontsize-"]');
        if (outer && segment.contains(outer) && VW.test(outer.className)) return;
        if ([...span.querySelectorAll('[class*="fontsize-"]')].some((inner) => (VW.exec(inner.className) || [])[1] === own)) return;
        span.classList.remove(...[...span.classList].filter((cls) => cls.startsWith("fontsize-")));
        bracketTag([...span.childNodes], `headline-${n}`, segment);
      });
    });
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
      const needsBreak = prev && !endsWithBreak(prev) && text2(block);
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
        if (n.nodeType === 3 ? text2(n) : n.matches("img, picture")) return null;
      }
      return null;
    });
    cleanRichText(box);
    let previous = null;
    let previousIndex = -1;
    return parts.map((part, i) => {
      if (!text2(part)) return null;
      const p = doc.createElement("p");
      while (part.firstChild) p.append(part.firstChild);
      while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !text2(p.firstChild))) {
        p.firstChild.remove();
      }
      const blank = leadingBlank[i] !== null && previous;
      const onPrevious = blank && leadingBlank[i] === sizeOf(tags2[previousIndex]) && centredSegments[previousIndex] === centredSegments[i];
      if (blank && !onPrevious) p.prepend(doc.createElement("br"));
      if (tags2[i]) {
        p.prepend(doc.createTextNode(`[[${tags2[i]}]`));
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
  function whiteBox(headline) {
    return !!headline.querySelector(".has-background.bg-white");
  }
  function boxStyles(headline) {
    if (whiteBox(headline)) return "headline-box";
    const box = headline.querySelector(".has-background");
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
  function centredHeadline(headline) {
    const lines = [...headline.querySelectorAll(".line")].filter((line) => text2(line));
    return lines.length > 0 && lines.every(centredLine);
  }
  function headlineStyles(headline) {
    return [boxStyles(headline), centredHeadline(headline) ? "center" : ""].filter(Boolean).join(", ");
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
    const headline = aside && aside.querySelector(".c-largeheadline");
    return headline && text2(headline) ? headline : null;
  }
  function headlineVideo(headline) {
    const col = headline.closest('[class*="col-sm-6"]');
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
    if (!rte || !text2(rte) || aside.querySelector("img, video, iframe, .c-standalone-video")) return null;
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
  function quoteNodes(headline, doc) {
    const box = doc.createElement("div");
    box.innerHTML = headline.innerHTML;
    box.querySelectorAll('.futura-bold [style*="color"]').forEach((span) => {
      const bold = span.closest(".futura-bold");
      if (!GOLD.test(ownColour(span)) || !/^[“”"‘’']+$/.test(text2(span)) || text2(bold) === text2(span)) return;
      const atStart = text2(bold).startsWith(text2(span));
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
      if (/^[“”"‘’']+$/.test(text2(strong))) {
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
    const blocks2 = box.querySelectorAll("p").length ? [...box.querySelectorAll("p")] : [box];
    blocks2.forEach((block) => {
      let line = doc.createElement("p");
      const flush = () => {
        if (text2(line)) out.push(line);
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
  function videoHeadlineColumns(video, headline, doc, asideQuotes = [], ctas = [], asideCtas = [], mirrored = false) {
    const link2 = videoLink(video, doc);
    const boxed = !!headline.querySelector('.has-background, [class*="bg-light-gray"]');
    const quotes = boxed ? asideQuotes : [headline, ...asideQuotes];
    const lines = boxed ? headlineNodes(headline, doc) : [];
    if (!link2 || boxed && !lines.length) return null;
    const media = doc.createElement("p");
    media.append(link2);
    const buttons = ctas.flatMap((cta) => buttonNodes(cta, doc));
    const firstLine = headline.querySelector(".line") || headline;
    const big = firstLine.querySelector('[class*="fontsize-2vw"]') || !headline.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
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
  var HERO_WHITE = /^(?:#fff|#ffffff|white|#edeeec|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgb\(\s*237\s*,\s*238\s*,\s*236\s*\))$/i;
  var HERO_HEADING_SIZE = 28;
  var HERO_TEXT_SIZES = {
    "text-1-5": 21,
    "text-1-75": 24.5,
    "text-2": 28,
    "text-2-5": 35,
    "text-3-5": 49
  };
  var HERO_BOXES = ["gold", "white", "purple", "teal", "blue", "dark-purple-gradient"];
  var HERO_BLACK = /^(?:#000|#000000|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))$/i;
  function heroText(container, doc) {
    if (!container) return [];
    container.querySelectorAll('[style*="color"]').forEach((el) => {
      if (!HERO_WHITE.test(ownColour(el)) || !text2(el)) return;
      const own = el.cloneNode(true);
      own.querySelectorAll('[style*="color"]').forEach((c) => {
        if (HERO_BLACK.test(ownColour(c))) c.remove();
      });
      if (!text2(own)) return;
      const outer = el.parentElement.closest('[style*="color"]');
      if (outer && container.contains(outer) && HERO_WHITE.test(ownColour(outer))) return;
      if (!el.querySelector("a[href]")) {
        el.prepend(doc.createTextNode("[[color-white]"));
        el.append(doc.createTextNode("]"));
        return;
      }
      let run = [];
      const flush = () => {
        if (run.some((n) => n.textContent.trim())) bracketTag(run, "color-white", container);
        run = [];
      };
      [...el.childNodes].forEach((child) => {
        if (child.nodeType === 1 && (child.matches("a[href]") || child.querySelector("a[href]"))) flush();
        else run.push(child);
      });
      flush();
    });
    const tagCopy2 = (n) => {
      if (typeof n.copyStyle !== "string" || !n.copyStyle || !n.firstChild) return;
      const own = n.copyStyle.split(",").map((v) => v.trim());
      const size = own.find((v) => /^p-\d/.test(v));
      const tags2 = [size ? `text-${size.slice(2)}` : "", own.includes("serif") ? "serif" : ""].filter(Boolean);
      if (!tags2.length || n.matches("ul, ol")) return;
      n.prepend(doc.createTextNode(`[[${tags2.join(",")}]`));
      n.append(doc.createTextNode("]"));
    };
    const TEXT = ".c-largeheadline, .c-rich-text-editor, .buttonset, .c-curatedcta";
    const boxColour = (c) => {
      const box = c.matches('.has-background, [class*="bg-"]') ? c : c.querySelector(".has-background");
      const name = box && (/\bbg-([a-z-]+)/.exec(box.className) || [])[1];
      return HERO_BOXES.includes(name) ? name : "";
    };
    return [...container.querySelectorAll(TEXT)].filter((c) => !c.parentElement.closest(TEXT) && text2(c)).flatMap((c) => {
      tagColourText(c, LIGHT_GRAY, "color-light-gray");
      const colour = boxColour(c);
      const mark = (nodes2) => {
        nodes2.forEach((n) => {
          if (colour) n.heroBox = colour;
        });
        return nodes2;
      };
      if (c.matches(".c-largeheadline")) return mark(headlineNodes(c, doc));
      if (c.matches(".buttonset, .c-curatedcta")) return buttonNodes(c, doc);
      c.querySelectorAll('[class*="fontsize-"]').forEach((span) => {
        const vw = (/\bfontsize-(\d+(?:-\d+)?)-?vw\b/.exec(span.className) || [])[1];
        if (!vw || !text2(span) || span.parentElement.closest('[class*="-vw"], [class*="vw "]')) return;
        span.classList.remove(...[...span.classList].filter((cls) => cls.startsWith("fontsize-")));
        bracketTag([...span.childNodes], `headline-${vw}`, c);
      });
      c.querySelectorAll("h1, h2, h3").forEach((h) => {
        h.querySelectorAll('[class*="fontsize-"]').forEach((span) => {
          const factor = SIZE_FACTORS[(/\bfontsize-[\d-]+em\b/.exec(span.className) || [])[0]];
          if (!factor || !text2(span) || span.parentElement.closest('[class*="fontsize-"]')) return;
          const px = factor * HERO_HEADING_SIZE;
          const tag = Object.entries(HERO_TEXT_SIZES).sort((a, b) => Math.abs(a[1] - px) - Math.abs(b[1] - px))[0][0];
          span.classList.remove(...[...span.classList].filter((cls) => cls.startsWith("fontsize-")));
          bracketTag([...span.childNodes], tag, c);
        });
      });
      const { nodes } = richTextNodes(c, doc);
      nodes.forEach(tagCopy2);
      return mark(nodes);
    });
  }
  function heroTextRows(nodes) {
    const colour = nodes.length ? nodes[0].heroBox : "";
    if (!colour) return { rows: nodes.length ? [[nodes]] : [], box: "" };
    const end = nodes.findIndex((n) => n.heroBox !== colour);
    const boxed = end < 0 ? nodes : nodes.slice(0, end);
    const rest = end < 0 ? [] : nodes.slice(end);
    return { rows: [[boxed], ...rest.length ? [[rest]] : []], box: colour };
  }
  function heroImage(img, doc, src) {
    const out = doc.createElement("img");
    out.setAttribute("src", src || img.getAttribute("src"));
    out.setAttribute("alt", img.getAttribute("alt") || "");
    return out;
  }
  function heroSlide(component, doc) {
    const slide = component.querySelector(".carouselslide:not(.slick-cloned)") || component;
    const desktop = slide.querySelector(".experienceFragment-ef img");
    const mobile = slide.querySelector(".experienceFragment-ef-mobile img");
    const first = desktop || mobile || slide.querySelector("img");
    const videoComponent = slide.querySelector(".c-standalone-video");
    const video = !desktop && videoComponent ? videoLink(videoComponent, doc) : null;
    const rows = [];
    if (video) rows.push([video]);
    if (first) rows.push([heroImage(first, doc)]);
    if (first && desktop && mobile) rows.push([heroImage(mobile, doc)]);
    if (!rows.length) return null;
    const overlay = slide.querySelector(".overlayparsys");
    const heroRows = heroTextRows(heroText(overlay, doc));
    rows.push(...heroRows.rows);
    const props = {};
    const style2 = overlay ? overlay.getAttribute("style") || "" : "";
    const pct = (re) => {
      const found = style2.match(re);
      return found ? String(parseFloat(found[1])) : null;
    };
    const top = pct(/top:\s*(-?\d+(?:\.\d+)?)%/i);
    const left = pct(/margin-left:\s*(-?\d+(?:\.\d+)?)%/i);
    const right = pct(/width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(-?\d+(?:\.\d+)?)%\s*\)/i);
    if (top !== null || left !== null || right !== null) {
      props["Text position"] = [top || 0, left || 0, right || 0].join(", ");
    }
    if (overlay && overlay.classList.contains("mobile_Bottom")) props["Text on phones"] = "below";
    if (!mobile) props["Text on phones"] = "alone";
    if (heroRows.box) props["Text box"] = heroRows.box;
    const phoneColour = overlay && (/\bmobile-text-(dark_gray|black)\b/.exec(overlay.className) || [])[1];
    if (phoneColour) props["Text colour on phones"] = phoneColour.replace("_", "-");
    return { block: WebImporter.Blocks.createBlock(doc, { name: "Hero Corp", cells: rows }), props };
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
      const style2 = [separatorNext || "", sectionStyle, extraStyle].filter(Boolean).join(", ") || void 0;
      separatorNext = false;
      current = {
        kind,
        style: style2,
        nodes: [],
        extra: extraStyle
      };
      sections.push(current);
      return current;
    };
    const title = startSection("title");
    const h1 = main.querySelector(".h1-title h1");
    const hasTitle = !!(h1 && text2(h1));
    if (hasTitle) {
      const heading = doc.createElement("h1");
      heading.innerHTML = h1.innerHTML;
      cleanRichText(heading);
      title.nodes.push(heading);
    }
    const date = main.querySelector(".c-publish-date h5");
    if (date && text2(date)) {
      const value = text2(date);
      const m = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
      const month = m && "janfebmaraprmayjunjulaugsepoctnovdec".indexOf(m[2].toLowerCase()) / 3 + 1;
      element.setAttribute("data-first-published", month >= 1 && Number.isInteger(month) ? `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}` : value);
    }
    const location = main.querySelector(".c-event-location-properties h5");
    if (location && text2(location)) {
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
      const quotes = [...asideCol.querySelectorAll(".c-largeheadline")].filter((h) => h !== aside && text2(h));
      const videoCol = video.closest('[class*="col-sm-"]');
      const ctas = [...videoCol.querySelectorAll(".c-curatedcta")].filter((c) => text2(c));
      const asideCtas = [...asideCol.querySelectorAll(".c-curatedcta")].filter((c) => text2(c));
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
      var _a;
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
          const kept = startSection("kept", component.getAttribute("data-section-style") || void 0);
          kept.nodes.push(component);
          if (component.hasAttribute("data-section-props")) {
            kept.props = JSON.parse(component.getAttribute("data-section-props"));
          }
          component.removeAttribute("data-section-style");
          component.removeAttribute("data-section-props");
          lastKept = sections[sections.length - 1];
          current = null;
          return;
        }
        if (component.getAttribute("data-keep") === "nodes") {
          const style2 = component.getAttribute("data-section-style") || void 0;
          startSection(component.children.length || !style2 ? "kept" : "spacer", style2).nodes.push(...component.children);
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
      if (component.matches(".c-largeheadline") && (!isFirst || component.hasAttribute("data-spacer")) && !text2(component) && !component.querySelector("img, picture, video, iframe, [data-asset-path]") && (!component.closest('[class*="col-sm-"], [class*="col-md-"]') || component.hasAttribute("data-spacer-wide") && ((_a = component.closest(".row").parentElement.closest(".row")) == null ? void 0 : _a.querySelectorAll(':scope > [class*="col-"]').length) === 1)) {
        const wide = component.hasAttribute("data-spacer-wide") ? ", wide" : "";
        sections.push({ kind: "spacer", style: separatorNext ? `${separatorNext}, spacer${wide}` : `spacer${wide}`, nodes: [] });
        separatorNext = false;
        current = null;
        return;
      }
      if (component.matches(".c-autocarousel")) {
        const hero = heroSlide(component, doc);
        if (!hero) return;
        startSection("hero").props = hero.props;
        current.nodes.push(hero.block);
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
          const style2 = ["image-link", link2.closest(".text-center") ? "center" : ""].filter(Boolean).join(", ");
          startSection("image", style2).nodes.push(...nodes2);
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
        const inRow = row && !text2(row) && !row.querySelector("img, [data-asset-path], iframe, form, table");
        separatorNext = inRow ? "separator, separator-row" : "separator";
        current = null;
        return;
      }
      if (component.matches(".c-customizeable")) {
        if (!component.querySelector(".item img")) return;
        const section = startSection("cards");
        const heading = component.querySelector("h2");
        if (heading && text2(heading)) {
          const h2 = doc.createElement("h2");
          h2.textContent = text2(heading);
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
      if (isFirst && !hasTitle && component.matches(".c-largeheadline") && component.querySelector('[class*="fontsize-2vw"]') && text2(component)) {
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
      const partlyCentred = component.matches(".c-largeheadline") && [...component.querySelectorAll(".line")].some((line) => text2(line) && centredLine(line));
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
          const style2 = [box, run.centred ? "center" : ""].filter(Boolean).join(", ");
          startSection("headline", style2 || void 0).nodes.push(...run.nodes);
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
      const {
        nodes,
        centred,
        right,
        size
      } = component.matches(".c-rich-text-editor") ? richTextNodes(component, doc) : { nodes: headlineNodes(component, doc), centred: false };
      const align = centred && "center" || right && "right" || "";
      if (!nodes.length) return;
      nodes.forEach((node) => {
        const copyStyle = node.copyStyle !== void 0 ? node.copyStyle : size;
        const extra = node.headingStyle ? [node.headingStyle] : [copyStyle || "", node.boldBody ? "bold-body" : ""].filter(Boolean);
        const styles = [align, ...extra].filter(Boolean);
        const kind = [align || "body", ...extra].join(" ");
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
    const disclaimers = [...doc.querySelectorAll(".c-disclaimer")].filter((el) => !el.querySelector("#publishedDate") && !el.parentElement.closest(".c-disclaimer") && text2(el));
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
      [...new Set(marked.map((a) => a.getAttribute("data-btn-style")))].forEach((style2) => {
        section.style = [section.style, style2].filter(Boolean).join(", ");
      });
      marked.forEach((a) => a.removeAttribute("data-btn-style"));
      section.nodes.forEach((node) => {
        if (node.nodeType === 1) node.removeAttribute("data-keep");
      });
      const props = section.props || {};
      if (section.style || Object.keys(props).length) {
        out.push(WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: __spreadValues(__spreadValues({}, section.style ? { style: section.style } : {}), props)
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
      const tags2 = [size && own.includes(size) ? `text-${size.slice(2)}` : "", serif && own.includes("serif") ? "serif" : ""].filter(Boolean);
      if (!tags2.length) return;
      h.tagCopy(n, tags2.join(","), doc);
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
  function keepNodes(doc, nodes, style2) {
    const box = doc.createElement("div");
    box.setAttribute("data-keep", "nodes");
    if (style2) box.setAttribute("data-section-style", style2);
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
      const style2 = component.hasAttribute("data-image-aside") ? "tabbed, image-aside" : "tabbed";
      (component.closest(".tabs") || component).replaceWith(keepNodes(doc, nodes, style2));
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
      const tags2 = [size ? `text-${size.slice(2)}` : "", own.includes("serif") ? "serif" : ""].filter(Boolean);
      if (tags2.length) h.tagCopy(n, tags2.join(","), doc);
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
      const style2 = [colour, "full-bleed"].filter(Boolean).join(", ");
      const out = [];
      let run = [];
      let extras = [];
      let centred = true;
      const CENTRED = '[style*="text-align: center"], [style*="text-align:center"], .text-center';
      const flush = () => {
        const styles = [style2, ...centred && run.length ? ["center", ...new Set(extras)] : []];
        if (run.length) out.push(keepNodes(doc, run, styles.filter(Boolean).join(", ")));
        run = [];
        extras = [];
        centred = true;
      };
      contentUnits(component).forEach((unit) => {
        if (unit.getAttribute("data-keep") === "nodes" && unit.hasAttribute("data-section-style")) {
          flush();
          unit.setAttribute("data-section-style", `${style2}, ${unit.getAttribute("data-section-style")}`);
          out.push(unit);
          return;
        }
        const rowStyle = (unit.getAttribute("data-section-style") || "").split(",").map((s) => s.trim());
        const blocks2 = unit.matches(".c-rich-text-editor") ? [...unit.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => h.text(el)) : [];
        if (unit.matches(".c-rich-text-editor")) {
          if (!blocks2.every((el) => el.closest(CENTRED))) centred = false;
        } else if (!rowStyle.includes("center") && unit.getAttribute("data-centred") !== "true") centred = false;
        const nodes = unitNodes(unit, doc, h);
        nodes.forEach((n) => {
          if (n.headingStyle) extras.push(n.headingStyle);
          if (n.nodeType === 1 && /^H[2-3]$/.test(n.tagName) && n.serifHeading) extras.push("h-serif");
        });
        run.push(...nodes);
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
      else if (box.classList.contains("bg-golden-gradient")) variant = "gold-gradient";
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
      tagPanelCopy(nodes, doc, h);
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
        const gold2 = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i.test(((_a = ((el.getAttribute("style") || "").match(/color\s*:\s*([^;]+)/i) || [])[1]) == null ? void 0 : _a.trim()) || "");
        if (el.matches("h1")) {
          const strong = doc.createElement("strong");
          strong.textContent = h.text(el);
          copy.append(doc.createTextNode(gold2 ? "[[text-2][[color-gold]" : "[[text-2]"), strong, doc.createTextNode(gold2 ? "]]" : "]"));
        } else if (el.matches("h2")) {
          copy.textContent = `[[text-1-75,serif]${h.text(el)}]`;
        } else copy.textContent = gold2 ? `[[color-gold]${h.text(el)}]` : h.text(el);
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
      img.setAttribute("src", `https://media-assets.stryker.com/is/image/${path}?$max_width_1440$`);
      img.setAttribute("alt", "");
      const box = doc.createElement("div");
      box.className = "c-standalone-image";
      box.append(img);
      component.replaceWith(box);
    });
  }
  var STAT_COLOURS = [
    [/^(?:#85458a|rgb\(\s*133\s*,\s*69\s*,\s*138\s*\))$/i, "purple"],
    [/^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i, "gold"],
    [/^(?:#4c7d7a|rgb\(\s*76\s*,\s*125\s*,\s*122\s*\))$/i, "teal"],
    [/^(?:#1c5687|rgb\(\s*28\s*,\s*86\s*,\s*135\s*\))$/i, "navy"]
  ];
  function counterFigure(widget) {
    const end = widget.getAttribute("data-numbercounter-end-number") || "";
    const type = widget.getAttribute("data-numbercounter-number-type");
    const currency = widget.getAttribute("data-numbercounter-currency-type") || "";
    if (!end) return "";
    if (type === "3") return `${end}%`;
    if (type === "2") return `${currency}${end}`;
    return end;
  }
  function counterRows(main, doc, h) {
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      const row = colctrl.querySelector(":scope > .row");
      const cols = row ? [...row.children].filter((el) => /\bcol-(xs|sm|md)-\d+/.test(el.className)) : [];
      const filled = cols.filter((col) => h.text(col) || col.querySelector("img, iframe, [data-widget]"));
      const counters = filled.map((col) => col.querySelectorAll(".numbercounter"));
      if (!filled.length || counters.some((list) => list.length !== 1)) return;
      if (filled.some((col, i) => h.text(col) !== h.text(counters[i][0]))) return;
      const rows = filled.map((col) => {
        const widget = col.querySelector('[data-widget="numbercounter"]');
        const number = widget && widget.querySelector(".numbercounter-number");
        const colour = number && /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(number.getAttribute("style") || "");
        const keyword = colour ? (STAT_COLOURS.find(([re]) => re.test(colour[1].trim())) || [])[1] : "";
        const label = widget && [...widget.children].find((el) => !el.querySelector(".numbercounter-number") && h.text(el));
        const desc = doc.createElement("p");
        if (label) {
          const source = label.querySelector('[class*="fontsize-"]') || label.querySelector('[style*="text-align"]') || label;
          [...source.cloneNode(true).childNodes].forEach((n) => {
            if (n.nodeType === 1 && n.matches(".futura-bold")) {
              const strong = doc.createElement("strong");
              strong.textContent = h.text(n);
              desc.append(strong);
            } else if (n.nodeType === 1 && n.matches("br")) desc.append(doc.createElement("br"));
            else if (n.textContent.trim()) desc.append(doc.createTextNode(n.textContent.trim()));
          });
        }
        return [keyword || "purple", widget ? counterFigure(widget) : "", desc];
      });
      const block = WebImporter.Blocks.createBlock(doc, {
        name: `Statistics (count-up, cols-${rows.length})`,
        cells: rows
      });
      block.setAttribute("data-centred", "true");
      const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
      wrapper.replaceWith(keepBlock(block, wrapper));
    });
  }
  function numberCounters(main, doc, h) {
    counterRows(main, doc, h);
    main.querySelectorAll(".numbercounter").forEach((component) => {
      const widget = component.querySelector('[data-widget="numbercounter"]');
      if (!widget) return;
      const end = widget.getAttribute("data-numbercounter-end-number") || "";
      const type = widget.getAttribute("data-numbercounter-number-type");
      const currency = widget.getAttribute("data-numbercounter-currency-type") || "";
      let figure = end;
      if (type === "3") figure = `${end}%`;
      else if (type === "2") figure = `${currency}${end}`;
      const VW = /\bfontsize-(\d+(?:-\d+)?)-?vw\b/;
      const p = doc.createElement("p");
      p.setAttribute("style", "text-align: center;");
      const number = widget.querySelector(".numbercounter-number");
      if (end) {
        const bold = doc.createElement("span");
        bold.className = "futura-bold";
        const coloured = doc.createElement("span");
        const colour = number && /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(number.getAttribute("style") || "");
        if (colour) coloured.setAttribute("style", `color: ${colour[1].trim()};`);
        coloured.textContent = figure;
        bold.append(coloured);
        const size = number && (VW.exec(number.className) || [])[1];
        p.append(...size ? [doc.createTextNode(`[[headline-${size}]`), bold, doc.createTextNode("]")] : [bold]);
      }
      const label = [...widget.children].find((el) => !el.querySelector(".numbercounter-number") && h.text(el));
      if (label) {
        if (p.childNodes.length) p.append(doc.createElement("br"));
        const sized = label.querySelector('[class*="fontsize-"]');
        const size = sized && (VW.exec(sized.className) || [])[1];
        const source = sized && size ? sized : label.querySelector('[style*="text-align"]') || label;
        const nodes = [...source.cloneNode(true).childNodes];
        nodes.forEach((n, i) => {
          if (n.nodeType !== 3 || !n.textContent.trim()) return;
          nodes[i] = doc.createTextNode(`[[body-font]${n.textContent.trim()}]`);
        });
        p.append(...size ? [doc.createTextNode(`[[headline-${size}]`), ...nodes, doc.createTextNode("]")] : nodes);
      }
      if (p.childNodes.length) component.replaceWith(h.richText(doc, [p]));
    });
  }
  var WHITE = /^(?:#fff|#ffffff|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
  var BLACK = /^(?:#000|#000000|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))$/i;
  var COLOURED_BOX = '.has-background:not(.bg-white), .c-full-bleed-panel[class*="bg-"]';
  function whiteText(main, doc, h) {
    main.querySelectorAll('[style*="color"]').forEach((el) => {
      const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (!m || !WHITE.test(m[1].trim()) || !el.closest(COLOURED_BOX) || !h.text(el)) return;
      const own = el.cloneNode(true);
      own.querySelectorAll('[style*="color"]').forEach((c) => {
        const colour = ((c.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i) || [])[1];
        if (colour && BLACK.test(colour.trim())) c.remove();
      });
      if (!h.text(own)) return;
      if (el.parentElement.closest('[style*="color"]') && WHITE.test((el.parentElement.closest('[style*="color"]').getAttribute("style") || "").replace(/.*color\s*:\s*([^;]+).*/i, "$1").trim())) return;
      el.prepend(doc.createTextNode("[[color-white]"));
      el.append(doc.createTextNode("]"));
      el.setAttribute("data-white-tag", "");
      el.querySelectorAll('[style*="color"]').forEach((c) => {
        const colour = ((c.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i) || [])[1];
        if (!colour || !BLACK.test(colour.trim()) || !h.text(c)) return;
        if (c.parentElement.closest('[style*="color"]') !== el) return;
        c.prepend(doc.createTextNode("[[color-black]"));
        c.append(doc.createTextNode("]"));
      });
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
  var SOURCE_REDIRECTS = {
    "/us/en/surgical-technologies/products/surgicount-safety-sponge-system/surgicount-index/badge-request---contact-us.html": "/us/en/surgical-technologies/products/surgicount-safety-sponge-system.html"
  };
  var XF_PAGES = Object.values(long_page_detail_corp_xf_default).flat().reduce((counts, xf) => {
    counts[xf] = (counts[xf] || 0) + 1;
    return counts;
  }, {});
  function sharedFragmentPath(xf) {
    return XF_PAGES[xf] > 1 ? xfToFragmentPath(xf) : null;
  }
  function markBlankBeforeButtons(document) {
    const blank = (p) => p && p.tagName === "P" && !p.textContent.replace(/\u00a0/g, " ").trim() && !p.querySelector("img, picture, iframe");
    document.querySelectorAll(".buttonset").forEach((set) => {
      const prev = set.previousElementSibling;
      const box = prev && prev.matches(".text, .parbase") && prev.querySelector(".c-rich-text-editor > div");
      if (box && blank(box.lastElementChild)) set.setAttribute("data-blank-before", "");
    });
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
    "/us/en/training-and-education/orthopaedics/joint-replacement/Mako_surgeon_campaign.html",
    // the blank lines around the climate goals and under "Stryker locations*"
    "/us/en/about/corporate-responsibility/environmental-programs.html"
  ]);
  function blankLineSpacers(document, url) {
    const listed = BLANK_LINE_PAGES.has(new URL(url).pathname);
    const blank = (node) => node.nodeType !== 1 || node.tagName === "P" && !node.textContent.replace(/\u00a0/g, " ").trim() && !node.querySelector("img, picture, iframe");
    const inBlock = (component) => {
      const row = component.closest(".colctrl .row");
      return !!row && row.querySelectorAll(':scope > [class*="col-"]').length > 1;
    };
    document.querySelectorAll(".text.parbase > .c-rich-text-editor > div").forEach((box) => {
      const component = box.parentElement.parentElement;
      if (component.closest(".c-tabs, .panel, .c-accordion")) return;
      if (!listed && inBlock(component)) return;
      const items = [];
      [...box.childNodes].forEach((node) => {
        const prev = items[items.length - 1];
        if (node.nodeType === 1 && blank(node)) {
          if (items.length) items.push(null);
        } else if (prev) prev.push(node);
        else if (!blank(node) || items.length) items.push([node]);
      });
      if (!listed) {
        while (items.length && items[items.length - 1] === null) items.pop();
      }
      const lastP = [...box.children].filter((el) => el.tagName === "P").pop();
      if (listed && lastP && lastP === box.lastElementChild && items.length && items[items.length - 1]) {
        const tail = [...lastP.childNodes];
        const nbsp = tail.length > 1 && tail[tail.length - 1].nodeType === 3 && tail[tail.length - 1].textContent.includes("\xA0") && !tail[tail.length - 1].textContent.replace(/\u00a0/g, " ").trim();
        if (nbsp && tail[tail.length - 2].nodeName === "BR") {
          tail[tail.length - 1].remove();
          tail[tail.length - 2].remove();
          items.push(null);
        }
      }
      const boxStyle = box.getAttribute("style") || "";
      const pct = (prop) => Number((new RegExp(`(?:^|;)\\s*${prop}:\\s*(\\d+(?:\\.\\d+)?)%`).exec(boxStyle) || [])[1] || 0);
      const wideSpacer = () => {
        const spacer = document.createElement("div");
        spacer.className = "largeheadline";
        const headline = document.createElement("div");
        headline.className = "c-largeheadline page-section container";
        headline.setAttribute("data-spacer-wide", "");
        spacer.append(headline);
        return spacer;
      };
      const plain = listed || !box.matches(".has-background, .dimensional-box") && !component.closest(".c-autocarousel, .overlayparsys, .pDiv, .fullWidthImageHero, .c-full-bleed-panel");
      if (plain && pct("padding-top") >= 2) component.before(wideSpacer());
      if (plain && pct("margin-bottom") >= 2) {
        component.setAttribute("data-wide-after", "");
      }
      if (!items.includes(null)) {
        if (component.hasAttribute("data-wide-after")) component.after(wideSpacer());
        return;
      }
      const parts = items.filter(Boolean);
      box.replaceChildren(...parts[0]);
      let last = component;
      items.slice(items.indexOf(parts[0]) + 1).forEach((item) => {
        if (!item) {
          const spacer = document.createElement("div");
          spacer.className = "largeheadline";
          const headline = document.createElement("div");
          headline.className = "c-largeheadline page-section container";
          spacer.append(headline);
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
      if (component.hasAttribute("data-wide-after")) {
        const spacer = document.createElement("div");
        spacer.className = "largeheadline";
        const headline = document.createElement("div");
        headline.className = "c-largeheadline page-section container";
        headline.setAttribute("data-spacer-wide", "");
        spacer.append(headline);
        last.after(spacer);
      }
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
      const clean2 = WebImporter.FileUtils.sanitizePath(bare);
      if (clean2 && clean2 !== bare) a.setAttribute("href", `${clean2}${slash}${suffix}`);
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
  function text3(el) {
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
      if (text3(slot) || slot.querySelector("img, [data-asset-path], iframe")) return true;
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
      if (heading && text3(heading)) {
        const h2 = doc.createElement("h2");
        const u = doc.createElement("u");
        u.textContent = text3(heading);
        h2.append(u);
        nodes.push(h2);
      }
      const container = title.querySelector(".title-container") || title;
      [...container.children].filter((el) => el !== heading && text3(el)).forEach((el) => {
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
      if (!title || !text3(title)) return;
      const h2 = doc.createElement("h2");
      const u = doc.createElement("u");
      u.textContent = text3(title);
      h2.append(u);
      (downloads.closest(".resourcesanddownload") || downloads).before(richText(doc, [h2]));
      title.remove();
    });
  }
  function videoCaptions(main, doc) {
    main.querySelectorAll(".c-standalone-video").forEach((video) => {
      const caption = video.querySelector(".desc-content");
      if (!caption) return;
      if (text3(caption)) {
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
      a.textContent = text3(source);
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
  var CELL_BOXES = {
    "golden-gradient": "box-gold-gradient",
    "gray-gradient": "box-gray-gradient",
    "dark-purple-gradient": "box-dark-purple-gradient",
    "dark-teal-gradient": "box-dark-teal-gradient",
    "dark-blue-gradient": "box-dark-blue-gradient",
    "dark-orange-gradient": "box-dark-orange-gradient"
  };
  var SOLID_BOXES = {
    orange: "box-orange",
    blue: "box-blue",
    teal: "box-teal",
    purple: "box-purple"
  };
  function markTitleBars(columns, colctrl) {
    columns.forEach((col) => {
      const parts = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => c.closest(".colctrl") === colctrl && !c.parentElement.closest(CELL_COMPONENTS));
      parts.forEach((c, i) => {
        if (!c.matches(".c-rich-text-editor") || i === parts.length - 1) return;
        const box = c.querySelector(":scope > .has-background");
        const name = box && (/\bbg-([a-z]+)\b/.exec(box.className) || [])[1];
        if (SOLID_BOXES[name]) c.setAttribute("data-box-tag", SOLID_BOXES[name]);
      });
    });
  }
  function headlineBoxTag(component) {
    if (!component.closest('[class*="col-sm-"], [class*="col-md-"]')) return "";
    const box = component.querySelector('.has-background[class*="-gradient"]') || (component.matches(".has-background") ? component : null);
    const name = box && (/\bbg-([a-z-]+-gradient)\b/.exec(box.className) || [])[1];
    return CELL_BOXES[name] || "";
  }
  function linkedImage(component) {
    const img = component.querySelector("img");
    const link2 = img && img.closest("a[href]");
    return link2 && component.contains(link2) ? link2 : null;
  }
  function stackRow(columns) {
    return columns.length === 4 && columns.every((col) => !/\bcol-xs-([1-9]|1[01])\b/.test(col.className));
  }
  function mediaTextRow(columns) {
    const media = "img, iframe, video, [data-asset-path]";
    const isMedia = (col) => !text3(col) && !!col.querySelector(media);
    const isText = (col) => !!text3(col) && !col.querySelector(media);
    const isEmpty = (col) => !text3(col) && !col.querySelector(media);
    const pair = columns.some((col, i) => i % 2 === 0 && isMedia(col) && !!columns[i + 1] && isText(columns[i + 1]));
    return pair && columns.every((col, i) => isEmpty(col) || (i % 2 ? isText(col) : isMedia(col)));
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
    const boxes = [...col.querySelectorAll(".has-background:not(.bg-white), .dimensional-box")].filter((b) => b.closest(".colctrl") === row && text3(b)).filter((b) => !b.parentElement.closest(".has-background:not(.bg-white), .dimensional-box"));
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
    const first = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text3(c))[0];
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
    const textCols = columns.filter((col) => text3(col));
    let name = "";
    if (kinds[0] === "lead" && used.length === textCols.length) name = `${colours[0]}-lead`;
    const last = columns[columns.length - 1];
    if (kinds[0] === "lead" && used.length === 1 && boxes[columns.length - 1] && last.querySelector(".c-standalone-video, .c-standalone-image, [data-asset-path]")) {
      name = `${colours[0]}-last`;
    }
    if (kinds[0] === "whole") {
      const padded = used.length === 1 && textCols.length === 1 && columns.length > 1 && columns.some((col) => !text3(col) && !col.querySelector("img, [data-asset-path], iframe"));
      if ((used.length > 1 || padded) && used.length === textCols.length) name = `${colours[0]}-all`;
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
      if (c.matches(".c-rich-text-editor")) {
        const { nodes } = richTextNodes(c, doc);
        const tag = c.getAttribute("data-box-tag");
        if (tag && nodes.length === 1 && nodes[0].tagName === "P") nodes[0].boxTag = tag;
        out.push(...nodes);
      } else if (c.matches(".c-standalone-image")) {
        const nodes = imageNodes(c, doc);
        const link2 = linkedImage(c);
        if (link2 && nodes.length) {
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(link2, absoluteAsset(link2.getAttribute("href"))));
          a.textContent = link2.querySelector("img").getAttribute("alt") || text3(link2) || a.getAttribute("href");
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
        const box = headlineBoxTag(c);
        if (c.hasAttribute("data-page-title") && lines.length) {
          out.push(titleHeading(lines, doc));
        } else if (box && lines.length) {
          const p = doc.createElement("p");
          lines.forEach((line, i) => {
            if (i) p.append(doc.createElement("br"));
            p.append(...line.childNodes);
          });
          p.prepend(doc.createTextNode(`[[${box}]`));
          p.append(doc.createTextNode("]"));
          out.push(p);
        } else out.push(...lines);
      } else if (c.matches(".c-curatedcta, .buttonset")) out.push(...buttonNodes(c, doc));
      else out.push(c);
    });
    return out;
  }
  function centredColumn(col) {
    const CENTRED = '.text-center, [style*="text-align: center"], [style*="text-align:center"]';
    const centred = (el) => !!el.closest(CENTRED) || el.matches(".line") && !!el.querySelector(CENTRED) && [...el.querySelectorAll(":scope > *")].every((c) => c.matches(CENTRED));
    const images = [...col.querySelectorAll(".c-standalone-image img")];
    const paragraphs = [...col.querySelectorAll(".c-rich-text-editor :is(p, h1, h2, h3, h4, h5, h6, li), .c-standalone-image .title-content :is(h2, h3, h4, h5), .c-largeheadline .line")].filter((el) => text3(el));
    const items = [...images, ...paragraphs];
    return items.length > 0 && items.every(centred);
  }
  function paddedColumn(col, colctrl) {
    const parts = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => c.closest(".colctrl") === colctrl && text3(c));
    const last = parts[parts.length - 1];
    const box = last && last.matches(".c-rich-text-editor") && last.querySelector(":scope > div");
    return !!box && /padding-bottom:\s*5%/.test(box.getAttribute("style") || "");
  }
  function dropWholeTag(n, tag) {
    const texts = [];
    const walk = (node) => node.childNodes.forEach((c) => {
      if (c.nodeType === 3) texts.push(c);
      else if (c.nodeType === 1 && !(n.matches("li") && c.matches("ul, ol"))) walk(c);
    });
    walk(n);
    const open = `[[${tag}]`;
    const onlyTags = (value) => !value.replace(/\[\[[a-z0-9,-]+\]/g, "").trim();
    let first = null;
    let at = -1;
    texts.every((t) => {
      at = t.nodeValue.indexOf(open);
      if (at >= 0) {
        first = onlyTags(t.nodeValue.slice(0, at)) ? t : null;
        return false;
      }
      return onlyTags(t.nodeValue);
    });
    const last = [...texts].reverse().find((t) => t.nodeValue.trim());
    if (!first || !last.nodeValue.trimEnd().endsWith("]")) return;
    if (first === last && first.nodeValue.trimEnd().length <= at + open.length) return;
    first.nodeValue = first.nodeValue.slice(0, at) + first.nodeValue.slice(at + open.length);
    const end = last.nodeValue.lastIndexOf("]");
    last.nodeValue = last.nodeValue.slice(0, end) + last.nodeValue.slice(end + 1);
  }
  function rightColumn(col) {
    const RIGHT = '[style*="text-align: right"], [style*="text-align:right"], .text-right';
    const blocks2 = [...col.querySelectorAll(".c-rich-text-editor :is(p, h1, h2, h3, h4, h5, h6, li)")].filter((el) => text3(el));
    return blocks2.length > 0 && blocks2.every((el) => !!el.closest(RIGHT));
  }
  function borderedImages(columns, colctrl) {
    const firsts = columns.map((col) => [...col.querySelectorAll(".c-standalone-image")].find((c) => c.closest(".colctrl") === colctrl && c.querySelector("img"))).filter(Boolean);
    return firsts.length > 0 && firsts.every((c) => c.hasAttribute("data-image-border"));
  }
  function sizeTag(copyStyle) {
    const size = (copyStyle || "").split(",").map((s) => s.trim()).find((s) => /^p-\d/.test(s));
    return size ? `text-${size.slice(2)}` : "";
  }
  function tagCopy(n, tag, doc) {
    const wrap2 = (first, last) => {
      if (first.nodeType === 3 && first.textContent.trimStart().startsWith(`[[${tag}]`)) return;
      first.before(doc.createTextNode(`[[${tag}]`));
      last.after(doc.createTextNode("]"));
    };
    if (!n.matches("ul, ol")) {
      if (n.firstChild) wrap2(n.firstChild, n.lastChild);
      return;
    }
    n.querySelectorAll("li").forEach((li) => {
      const paragraphs = li.querySelectorAll(":scope > p");
      if (paragraphs.length) {
        paragraphs.forEach((p) => {
          if (p.firstChild) wrap2(p.firstChild, p.lastChild);
        });
        return;
      }
      const inline = [];
      for (let c = li.firstChild; c && !(c.nodeType === 1 && c.matches("ul, ol")); c = c.nextSibling) inline.push(c);
      if (inline.some((c) => c.textContent.trim())) wrap2(inline[0], inline[inline.length - 1]);
    });
  }
  function rowCopyStyle(cells, doc) {
    const copy = cells.flat().filter((n) => n.nodeType === 1 && n.copyStyle !== void 0 && n.copyStyle !== null && !/^H\d$/.test(n.tagName));
    const weight = {};
    copy.forEach((n) => {
      weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text3(n).length;
    });
    let dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || "";
    const relative = (style2) => sizeTag(style2) === "text-1-25";
    const ownTags = (n) => !sizeTag(n.copyStyle) || relative(n.copyStyle) && !relative(dominant);
    if (sizeTag(dominant) && copy.some(ownTags)) {
      dominant = dominant.split(",").map((s) => s.trim()).filter((s) => !/^p-\d/.test(s)).join(", ");
    }
    copy.filter((n) => relative(n.copyStyle)).forEach((n) => {
      dropWholeTag(n, "text-1-25");
    });
    const serif = (style2) => (style2 || "").split(",").map((x) => x.trim()).includes("serif");
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
    const hasContent = (el) => text3(el) || el.querySelector("img, iframe, [data-asset-path]");
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      const row = colctrl.querySelector(":scope > .row");
      const all = row ? [...row.children] : [];
      const cols = all.filter(hasContent);
      if (cols.length !== 1 || all.length > 2) return;
      const units = [...cols[0].querySelectorAll(`.colctrl, ${COMPONENT2}`)].filter((el) => {
        const outer = el.parentElement.closest(`.colctrl, ${COMPONENT2}`);
        return (!outer || outer === colctrl) && (text3(el) || el.querySelector("img, iframe, [data-asset-path]") || el.matches('.c-full-bleed-panel[class*="bg-"]'));
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
      const filled = all.filter((col) => text3(col) || col.querySelector("img, [data-asset-path], iframe, form, table"));
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
      const linkedImages = filled.flatMap((col) => [...col.querySelectorAll(".c-standalone-image")].filter((c) => linkedImage(c)));
      const linked = linkedImages.length > 0;
      const captioned = linkedImages.some((c) => [...c.querySelectorAll(".c-standalone-image-content > p.u-white-space-pre")].some((caption) => text3(caption)));
      const boxes = boxVariant(columns);
      if (!boxes) markTitleBars(columns, colctrl);
      if (!boxes) {
        colctrl.querySelectorAll("[data-white-tag]").forEach((el) => {
          const inBox = el.closest(".has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel");
          if (!inBox || inBox.matches(".c-full-bleed-panel") || inBox.closest(".colctrl") !== colctrl) return;
          const headline = el.closest(".c-largeheadline");
          if (headline && headlineBoxTag(headline) || el.closest("[data-box-tag]")) return;
          if (el.firstChild && el.firstChild.nodeValue === "[[color-white]") el.firstChild.remove();
          if (el.lastChild && el.lastChild.nodeValue === "]") el.lastChild.remove();
          el.removeAttribute("data-white-tag");
        });
      }
      const parts = columns.length === 2 ? [...columns[0].querySelectorAll(`${CELL_COMPONENTS}, .sectionseparator`)].filter((c) => c.closest(".colctrl") === colctrl && (text3(c) || c.matches(".sectionseparator"))) : [];
      const firstRule = parts.length > 1 && parts[parts.length - 1].matches(".sectionseparator");
      const variant = [
        COLUMN_VARIANTS[key],
        linked ? "media-pair" : "",
        captioned ? "image-captions" : "",
        stackRow(columns) ? "stack" : "",
        stackRow(columns) && mediaTextRow(columns) ? "media-text" : "",
        boxes,
        firstRule ? "left-border-bottom" : "",
        filled.length > 1 && rightColumn(columns[columns.length - 1]) && !rightColumn(columns[0]) ? "right-last" : "",
        borderedImages(columns, colctrl) ? "image-border" : ""
      ].filter(Boolean).join(", ");
      const centred = !captioned && filled.every(centredColumn);
      const padded = filled.every((col) => paddedColumn(col, colctrl));
      const cells = columns.map((col) => cellNodes(col, doc));
      const style2 = [rowCopyStyle(cells, doc), centred ? "center" : "", padded ? "cell-padding" : ""].filter(Boolean).join(", ");
      cells.flat().filter((n) => n.boxTag).forEach((n) => {
        const closing = (t) => t.nodeType === 3 && !t.textContent.split("]").join("").trim();
        let last = n.lastChild;
        while (last && closing(last)) last = last.previousSibling;
        while (last && last.nodeType === 1 && last.nodeName !== "BR" && last.lastChild) last = last.lastChild;
        if (last && last.nodeName === "BR") last.after(doc.createElement("br"));
        n.prepend(doc.createTextNode(`[[${n.boxTag}]`));
        n.append(doc.createTextNode("]"));
      });
      const block = WebImporter.Blocks.createBlock(doc, {
        name: variant ? `Columns (${variant})` : "Columns",
        cells: [cells]
      });
      block.setAttribute("data-keep", "section");
      if (style2) block.setAttribute("data-section-style", style2);
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
  var isMediaCell = (td) => !td.textContent.trim() || td.querySelector(MEDIA) && [...td.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].every((el) => el.querySelector(MEDIA) || !text3(el));
  function gridRows(main) {
    const isColumns = (el) => el && el.matches('table[data-keep="section"]') && /^Columns\b/.test(text3(tableRows(el)[0] || el));
    const empty = (el) => !text3(el) && !el.querySelector(`${MEDIA}, table, form, hr, .sectionseparator`) && !el.matches("[data-keep], .sectionseparator, hr");
    const next = (el) => {
      let n = el.nextElementSibling;
      while (n && empty(n)) n = n.nextElementSibling;
      return n;
    };
    const cellsOf = (table) => tableRows(table).slice(1).map((tr) => [...tr.children]);
    const textOnly = (td) => !td.querySelector(MEDIA);
    const sameBlock = (x, y) => isColumns(y) && text3(tableRows(y)[0]) === text3(tableRows(x)[0]);
    const takeEnd = (into, from) => {
      if (from.hasAttribute("data-row-end")) into.setAttribute("data-row-end", from.getAttribute("data-row-end"));
      else into.removeAttribute("data-row-end");
    };
    const blocks2 = () => [...main.querySelectorAll('table[data-keep="section"]')].filter(isColumns);
    blocks2().forEach((first) => {
      const b = next(first);
      if (!first.isConnected || !sameBlock(first, b)) return;
      const [rowA] = cellsOf(first);
      const rowsB = cellsOf(b);
      const pair = cellsOf(first).length === 1 && rowsB.length === 1 && rowsB[0].length === rowA.length;
      const images = rowA.every(isMediaCell) && rowA.some((td) => td.querySelector(MEDIA));
      if (!pair || !images || !rowsB[0].every(textOnly)) return;
      rowA.forEach((td, i) => td.append(...rowsB[0][i].childNodes));
      const style2 = b.getAttribute("data-section-style");
      if (style2) first.setAttribute("data-section-style", style2);
      else first.removeAttribute("data-section-style");
      takeEnd(first, b);
      b.remove();
    });
    blocks2().forEach((first) => {
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
  function banners(main, doc) {
    main.querySelectorAll(".pDiv, .fullWidthImageHero").forEach((banner) => {
      const box = banner.querySelector(".textBoxId");
      const img = banner.querySelector(".imgBoxId img");
      if (!box || !img || !text3(box)) return;
      const source = banner.querySelector(".imgBoxId source[srcset]");
      const src = source ? source.getAttribute("srcset").split(/\s+/)[0] : img.getAttribute("src");
      const subheads = [...box.querySelectorAll(".c-largeheadline .line h2")].map((h2) => text3(h2)).filter(Boolean);
      const heroRows = heroTextRows(heroText(box, doc));
      if (!heroRows.rows.length) return;
      const untag = (value) => value.replace(/\[\[[a-z0-9,-]+\]/g, "").split("]").join("").trim();
      heroRows.rows.flat(2).flatMap((cell) => cell.querySelectorAll ? [cell, ...cell.querySelectorAll("p, h2")] : []).filter((p) => ["P", "H2"].includes(p.tagName) && subheads.includes(untag(p.textContent))).forEach((p) => {
        p.prepend(doc.createTextNode("[[text-1-75]"));
        p.append(doc.createTextNode("]"));
      });
      if (box.querySelector("h1")) main.setAttribute("data-banner-title", "");
      const asset = (url) => (url || "").split("?")[0];
      const rows = [[heroImage(img, doc, src)]];
      if (source && asset(img.getAttribute("src")) !== asset(src)) rows.push([heroImage(img, doc)]);
      const block = WebImporter.Blocks.createBlock(doc, {
        name: "Hero Corp (banner)",
        cells: [...rows, ...heroRows.rows]
      });
      block.setAttribute("data-keep", "section");
      const props = {};
      const cols = Number((/\bcol-sm-(\d+)\b/.exec(box.className) || [])[1] || 12);
      if (cols < 12) props["Text width"] = String(Math.round(cols / 12 * 100));
      const row = box.querySelector(":scope > div > .colctrl > .row, :scope > .colctrl > .row");
      if (row) {
        const rowCols = [...row.children].filter((el) => /\bcol-sm-\d+/.test(el.className));
        const width = (el) => Number((/\bcol-sm-(\d+)\b/.exec(el.className) || [])[1] || 12);
        const firstText = rowCols.findIndex((el) => text3(el));
        const alone = rowCols.slice(firstText + 1).every((el) => !text3(el));
        if (firstText >= 0 && rowCols.length > 1 && alone) {
          const before = rowCols.slice(0, firstText).reduce((sum, el) => sum + width(el), 0);
          const share = (n) => String(Math.round(n / 12 * cols * 100 / 12));
          if (before) props["Text position"] = `0, ${share(before)}, 0`;
          const textBox = rowCols[firstText].querySelector(".c-rich-text-editor > div");
          const padRight = Number((/padding-right:\s*(\d+(?:\.\d+)?)%/.exec(textBox ? textBox.getAttribute("style") || "" : "") || [])[1] || 0);
          const colShare = width(rowCols[firstText]) / 12 * (1 - padRight / 100);
          props["Text width"] = String(Math.round(colShare * cols * 100 / 12));
        }
      }
      if (heroRows.box) props["Text box"] = heroRows.box;
      if (Object.keys(props).length) block.setAttribute("data-section-props", JSON.stringify(props));
      if (banner.querySelector(".imgBoxId.bg-shadow")) block.setAttribute("data-section-style", "shadow");
      banner.replaceWith(block);
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
        const image = doc.createElement("img");
        image.setAttribute("src", src);
        image.setAttribute("alt", alt);
        p.append(image);
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
    const spans = [...h1.querySelectorAll('[class*="fontsize-"]')].filter((span) => text3(span) === text3(h1));
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
    if (!size && level === "H2") {
      const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
      const bold = [...h1.querySelectorAll(".futura-bold, b, strong")].filter((b) => !b.parentElement.closest(".futura-bold, b, strong"));
      const serif = squash(bold.map((b) => b.textContent).join("")) !== squash(h1.textContent);
      sizeTagged(h1, serif ? "text-1-75,serif" : "text-1-75", doc);
    }
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
    main.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href").replace(/^https:\/\/www\.stryker\.com/, "");
      if (SOURCE_REDIRECTS[href]) a.setAttribute("href", SOURCE_REDIRECTS[href]);
    });
    main.querySelectorAll(".hero-space").forEach((el) => el.remove());
    main.querySelectorAll('.c-standalone-image img[class*="bor-"]').forEach((img) => {
      img.closest(".c-standalone-image").setAttribute("data-image-border", "");
    });
    dropDamVideos(main);
    banners(main, doc);
    main.querySelectorAll(".fullWidthImageHero").forEach((el) => el.setAttribute("data-keep", "section"));
    fullWidthImages(main, doc);
    spaceUrlColons(main, doc);
    const nav = localNav(main, doc);
    if (nav) {
      const COMPONENT2 = '[class^="c-"], [class*=" c-"]';
      const first = [...main.querySelectorAll(COMPONENT2)].find((c) => !c.parentElement.closest(COMPONENT2));
      const empty = first && first.matches(".c-largeheadline") && !text3(first) && !first.querySelector("img, picture, video, iframe, [data-asset-path]");
      if (empty) first.setAttribute("data-spacer", "");
    }
    experienceFragments(main, doc, long_page_detail_corp_xf_default[path] || [], long_page_detail_corp_xf_slots_default[path]);
    sectionTitles(main, doc);
    downloadTitles(main, doc);
    videoCaptions(main, doc);
    const hasTitle = !!(main.querySelector(".h1-title h1") && text3(main.querySelector(".h1-title h1"))) || !!main.querySelector(".fullWidthImageHero h1, .c-autocarousel h1") || main.hasAttribute("data-banner-title");
    main.removeAttribute("data-banner-title");
    let firstTitle = !hasTitle && [...main.querySelectorAll(".c-largeheadline, .c-rich-text-editor :is(h1, h2, h3, h4, h5, h6)")].find((el) => text3(el) && !el.closest(".h1-title"));
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
      text: text3,
      tagCopy
    };
    convertBeforeRows(main, doc, helpers);
    markRowEnds(main);
    columnRows(main, doc);
    gridRows(main);
    convertAfterRows(main, doc, helpers);
    main.querySelectorAll('[data-row-end]:not([data-keep], [class^="c-"], [class*=" c-"])').forEach((wrapper) => {
      const parts = [...wrapper.querySelectorAll('[data-keep], [class^="c-"], [class*=" c-"]')].filter((el) => !el.parentElement.closest('[data-keep], [class^="c-"], [class*=" c-"]') && (text3(el) || el.querySelector("img, iframe, [data-asset-path]")));
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
    rest = rest.replace(/^\/{2,}/, "/");
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
  function transform2(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isNewsDetail = !!(payload && payload.template && [
      "news-detail",
      "news-detail-xf",
      "text-only",
      "long-page-detail-corp",
      "long-page-detail-corp-fragments",
      "event-detail",
      "contact-division",
      "people",
      "people-fragments",
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
            const text4 = span.textContent.replace(/ /g, " ").trim();
            if (!text4) return;
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
        const text4 = span.textContent.replace(/ /g, " ").trim();
        if (!text4) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text4;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text4) {
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

  // tools/importer/transformers/long-page-detail-corp-semantic.js
  var TYPO_STYLES = /* @__PURE__ */ new Set([
    "p-1",
    "p-1-25",
    "p-1-5",
    "p-1-75",
    "p-2",
    "p-2-5",
    "p-3-5",
    "serif",
    "h-serif",
    "h2-1-5",
    "h3-1-25",
    "h4-2-5",
    "bold-body"
  ]);
  var INLINE = /^(A|B|BR|DEL|EM|I|S|SPAN|STRONG|SUB|SUP|U)$/;
  var TAG_RE = /\[\[([^\][]+)\]([^\][]*)\]/g;
  var BRACKET_RE = /\[\[([^\][]+)\]|\[|\]/g;
  function parseTags(raw) {
    const names = raw.split(",").map((n) => n.trim());
    return names.every((n) => /^[\w-]+$/.test(n)) ? names : [];
  }
  function containerOf(node) {
    let el = node.parentElement;
    while (el && INLINE.test(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  }
  function textNodes(doc, container) {
    const out = [];
    const w = doc.createTreeWalker(container, 4);
    while (w.nextNode()) if (containerOf(w.currentNode) === container) out.push(w.currentNode);
    return out;
  }
  function tagSpan(doc, tags2, ...content) {
    const span = doc.createElement("span");
    span.dataset.tag = tags2.join(" ");
    span.append(...content);
    return span;
  }
  function replaceInText(doc, node) {
    const text4 = node.nodeValue;
    const parts = [];
    let last = 0;
    [...text4.matchAll(TAG_RE)].forEach((m) => {
      const tags2 = parseTags(m[1]);
      if (!tags2.length) return;
      parts.push(text4.slice(last, m.index), tagSpan(doc, tags2, m[2]));
      last = m.index + m[0].length;
    });
    if (!last) return;
    parts.push(text4.slice(last));
    node.replaceWith(...parts.filter((p) => p !== ""));
  }
  function removeIfEmpty(node, container) {
    let cur = node;
    while (cur && cur !== container && !cur.textContent && !(cur.querySelector && cur.querySelector("br, img"))) {
      const parent = cur.parentNode;
      cur.remove();
      cur = parent;
    }
  }
  function wrapMultiNode(doc, container) {
    const open = [];
    let found;
    textNodes(doc, container).some((node) => [...node.nodeValue.matchAll(BRACKET_RE)].some((m) => {
      if (m[0] !== "]") {
        open.push({ node, m });
        return false;
      }
      const opener = open.pop();
      if (!opener || !opener.m[1] || opener.node === node) return false;
      const tags3 = parseTags(opener.m[1]);
      if (!tags3.length) return false;
      found = {
        openNode: opener.node,
        open: opener.m,
        closeNode: node,
        closeIndex: m.index,
        tags: tags3
      };
      return true;
    }));
    if (!found) return false;
    const {
      openNode,
      closeNode,
      closeIndex,
      tags: tags2
    } = found;
    const text4 = openNode.nodeValue;
    const range = doc.createRange();
    range.setStart(openNode, found.open.index + found.open[0].length);
    range.setEnd(closeNode, closeIndex);
    const span = tagSpan(doc, tags2, range.extractContents());
    range.insertNode(span);
    openNode.nodeValue = text4.slice(0, found.open.index);
    closeNode.nodeValue = closeNode.nodeValue.slice(1);
    removeIfEmpty(openNode, container);
    removeIfEmpty(closeNode, container);
    return true;
  }
  function tagsToSpans(doc, main) {
    const containers = /* @__PURE__ */ new Set();
    const w = doc.createTreeWalker(main, 4);
    while (w.nextNode()) if (w.currentNode.nodeValue.includes("[[")) containers.add(containerOf(w.currentNode));
    containers.forEach((c) => {
      textNodes(doc, c).filter((n) => n.nodeValue.includes("[[")).forEach((n) => replaceInText(doc, n));
      while (wrapMultiNode(doc, c)) ;
    });
  }
  var tagsOf = (el) => (el.dataset.tag || "").split(" ").filter(Boolean);
  var norm = (t) => t.replace(/\s+/g, " ").trim();
  var spansIn = (el) => [...el.querySelectorAll("span[data-tag]")];
  function unwrap2(el) {
    el.replaceWith(...el.childNodes);
  }
  function rename2(doc, el, tag) {
    const out = doc.createElement(tag);
    out.append(...el.childNodes);
    el.replaceWith(out);
    return out;
  }
  function headlineSize(tags2) {
    const t = tags2.find((n) => /^headline-\d/.test(n));
    return t ? Number(t.slice(9).replace("-", ".")) : 0;
  }
  function lineInfo(el) {
    const spans = spansIn(el);
    const size = Math.max(0, ...spans.map((s) => headlineSize(tagsOf(s))));
    const serif = spans.some((s) => tagsOf(s).includes("serif"));
    const bold = !!el.querySelector("strong, b") && norm([...el.querySelectorAll("strong, b")].map((b) => b.textContent).join("")) === norm(el.textContent);
    return { size, serif, bold };
  }
  function wrapChildren(doc, node, tag) {
    const w = doc.createElement(tag);
    w.append(...node.childNodes);
    node.append(w);
    return w;
  }
  function gold(doc, span) {
    const inBold = span.closest("strong, b");
    const hasBold = span.querySelector("strong, b");
    if (!inBold && !hasBold) wrapChildren(doc, span, "strong");
    if (!span.closest("em, i")) {
      const em = doc.createElement("em");
      span.before(em);
      em.append(span);
    }
  }
  function serifInHeading(doc, span) {
    if (span.closest("strong, b, em, i")) return;
    const runs = [];
    let run = [];
    [...span.childNodes].forEach((n) => {
      const isGold = n.nodeType === 1 && (n.matches("em, i, strong, b") || !!n.querySelector("strong, b, em, i") || n.matches("span[data-tag]") && tagsOf(n).some((t) => t === "color-gold"));
      if (isGold) {
        if (run.length) runs.push(run);
        run = [];
      } else run.push(n);
    });
    if (run.length) runs.push(run);
    runs.forEach((r) => {
      if (!norm(r.map((n) => n.textContent).join(""))) return;
      const em = doc.createElement("em");
      r[0].before(em);
      em.append(...r);
    });
  }
  function sectionsOf(main) {
    const out = [];
    let cur = { nodes: [], meta: null };
    [...main.children].forEach((el) => {
      var _a;
      if (el.tagName === "HR") {
        out.push(cur);
        cur = { nodes: [], meta: null, hr: el };
        return;
      }
      const head = el.tagName === "TABLE" && norm(((_a = el.querySelector("tr")) == null ? void 0 : _a.textContent) || "");
      if (head && /^section metadata$/i.test(head)) cur.meta = el;
      else cur.nodes.push(el);
    });
    out.push(cur);
    return out;
  }
  function metaRow(meta, key) {
    if (!meta) return null;
    return [...meta.querySelectorAll("tr")].find((tr) => {
      var _a;
      return norm(((_a = tr.children[0]) == null ? void 0 : _a.textContent) || "").toLowerCase() === key;
    });
  }
  function styleOf(section) {
    const row = metaRow(section.meta, "style");
    return row ? row.children[1].textContent.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  function setStyle(section, styles) {
    const row = metaRow(section.meta, "style");
    if (!row) return;
    if (styles.length) {
      row.children[1].textContent = styles.join(", ");
      return;
    }
    row.remove();
    if (section.meta.querySelectorAll("tr").length <= 1) {
      section.meta.remove();
      section.meta = null;
    }
  }
  function headlineLine(doc, el, ctx) {
    const { size, serif, bold } = lineInfo(el);
    let tag = "p";
    if (el.tagName === "H1") {
      tag = "h1";
      if (bold && !serif) ctx.title = true;
    } else if (size >= 4.75) tag = "h5";
    else if (size >= 3.75 && serif) tag = "h2";
    else if (size >= 2.75 && serif) tag = "h3";
    else if (size >= 2.25 && serif) tag = "h4";
    else if (size >= 1.75 && !serif) tag = "h2";
    else if (size >= 2.75) ctx.warn.push(`large headline line ${size}vw Futura: "${norm(el.textContent).slice(0, 40)}"`);
    const line = tag === el.tagName.toLowerCase() ? el : rename2(doc, el, tag);
    if ((tag === "h2" || tag === "h3") && serif) {
      spansIn(line).forEach((s) => unwrap2(s));
      if (!line.querySelector(":scope > em:only-child")) wrapChildren(doc, line, "em");
    }
    return line;
  }
  function addTheme(main, theme) {
    const themes = (main.getAttribute("data-semantic-theme") || "").split(",").map((t) => t.trim()).filter(Boolean);
    if (!themes.includes(theme)) themes.push(theme);
    main.setAttribute("data-semantic-theme", themes.join(", "));
  }
  function largeHeadlines(doc, main, warn) {
    sectionsOf(main).forEach((section) => {
      const styles = styleOf(section);
      const isBox = styles.includes("headline-box");
      if (styles.includes("h4-2-5") && !isBox) {
        addTheme(main, "thank-you-large");
        return;
      }
      const lines = section.nodes.filter((n) => /^(P|H[1-6])$/.test(n.tagName) && n.querySelector('span[data-tag^="headline-"], span[data-tag*=" headline-"]'));
      if (!isBox && lines.some((n) => n.tagName === "H1")) {
        addTheme(main, "large-headlines");
        return;
      }
      if (!lines.length || !isBox) return;
      const ctx = { title: false, warn };
      lines.forEach((n) => headlineLine(doc, n, ctx));
      addTheme(main, "large-headlines");
    });
  }
  var PAGE_THEMES = [
    [/\/care-settings\/asc\//i, "asc"],
    [/\/clinical\/clout(\.html)?$/i, "clout"]
  ];
  var PAGE_SPACERS = [
    [/\/care-settings\/asc\/build-your-asc(\.html)?$/i, [
      ["Phase 1", "spacer"]
      // above the phase boxes: 59px (49px on phones)
    ]]
  ];
  function pageSpacers(doc, main, url) {
    var _a;
    const list = ((_a = PAGE_SPACERS.find(([re]) => re.test(url))) == null ? void 0 : _a[1]) || [];
    list.forEach(([text4, style2]) => {
      var _a2;
      const textOf = (n) => n.tagName === "TABLE" ? norm([...n.querySelectorAll("tr")].slice(1).map((r) => r.textContent).join(" ")) : norm(n.textContent);
      const node = [...main.children].find((n) => textOf(n).startsWith(text4));
      if (!node) return;
      const meta = doc.createElement("table");
      const head = doc.createElement("tr");
      const th = doc.createElement("th");
      th.setAttribute("colspan", "2");
      th.textContent = "Section Metadata";
      head.append(th);
      const row = doc.createElement("tr");
      ["style", style2].forEach((v) => {
        const td = doc.createElement("td");
        td.textContent = v;
        row.append(td);
      });
      meta.append(head, row);
      if (((_a2 = node.previousElementSibling) == null ? void 0 : _a2.tagName) === "HR") node.before(meta, doc.createElement("hr"));
      else node.before(doc.createElement("hr"), meta, doc.createElement("hr"));
    });
  }
  function dominantSize(el) {
    var _a, _b;
    const by = /* @__PURE__ */ new Map();
    const w = el.ownerDocument.createTreeWalker(el, 4);
    while (w.nextNode()) {
      const n = w.currentNode;
      const len = norm(n.textContent).length;
      if (len) {
        let size = 0;
        for (let p = n.parentElement; p && p !== el.parentElement && !size; p = p.parentElement) {
          if ((_a = p.dataset) == null ? void 0 : _a.tag) size = Math.max(0, ...tagsOf(p).map((t) => /^headline-\d/.test(t) ? headlineSize([t]) : 0));
        }
        by.set(size, (by.get(size) || 0) + len);
      }
    }
    return ((_b = [...by.entries()].sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _b[0]) || 0;
  }
  function splitBySize(doc, p) {
    const brs = [...p.querySelectorAll("br")].filter((b) => {
      for (let el = b.parentElement; el !== p; el = el.parentElement) {
        if (!/^(SPAN|STRONG|B|EM|I)$/.test(el.tagName)) return false;
      }
      return true;
    });
    const br = brs.find((b) => {
      const r2 = doc.createRange();
      r2.setStart(p, 0);
      r2.setEndBefore(b);
      const head = doc.createElement("p");
      head.append(r2.cloneContents());
      const tail = doc.createElement("p");
      r2.setStartAfter(b);
      r2.setEnd(p, p.childNodes.length);
      tail.append(r2.cloneContents());
      return norm(head.textContent) && norm(tail.textContent) && dominantSize(head) !== dominantSize(tail);
    });
    if (!br) return [p];
    const r = doc.createRange();
    r.setStart(p, 0);
    r.setEndBefore(br);
    const first = doc.createElement("p");
    first.append(r.extractContents());
    br.remove();
    p.before(first);
    return [first, ...splitBySize(doc, p)];
  }
  function ascHeadlines(doc, main) {
    sectionsOf(main).forEach((section) => {
      const styles = styleOf(section);
      if (styles.includes("headline-box") || !styles.includes("full-bleed")) return;
      const lines = section.nodes.filter((n) => n.tagName === "P" && n.querySelector('span[data-tag^="headline-"], span[data-tag*=" headline-"]'));
      lines.flatMap((p) => splitBySize(doc, p)).forEach((p) => {
        var _a;
        const size = dominantSize(p);
        const serif = spansIn(p).some((s) => tagsOf(s).includes("serif"));
        let tag = "p";
        if (size >= 4.75) tag = "h5";
        else if (size >= 2.75) tag = "h3";
        else if (size >= 2.25) tag = "h4";
        else if (size >= 1.75) tag = "h2";
        if (tag === "p") return;
        const h = rename2(doc, p, tag);
        while (((_a = h.firstChild) == null ? void 0 : _a.nodeName) === "BR") h.firstChild.remove();
        if (tag === "h3" && serif) wrapChildren(doc, h, "em");
      });
    });
  }
  function wholeSize(el) {
    const spans = spansIn(el).filter((s2) => tagsOf(s2).some((t) => /^text-\d/.test(t)));
    const s = spans.find((sp) => norm(sp.textContent) === norm(el.textContent));
    return s ? tagsOf(s).find((t) => /^text-\d/.test(t)) : "";
  }
  function addVariant(table, variant) {
    const cell = table.querySelector("tr > th, tr > td");
    const name = norm(cell.textContent);
    const m = name.match(/^([^(]+?)\s*(?:\((.*)\))?$/);
    const opts = (m[2] || "").split(",").map((o) => o.trim()).filter(Boolean);
    if (!opts.includes(variant)) opts.push(variant);
    cell.textContent = `${m[1]} (${opts.join(", ")})`;
  }
  var blockName = (table) => {
    var _a;
    return norm(((_a = table.querySelector("tr")) == null ? void 0 : _a.textContent) || "").toLowerCase();
  };
  var blocksNamed = (main, re) => [...main.querySelectorAll("table")].filter((t) => re.test(blockName(t)));
  var tagSize = (t) => {
    const m = t.match(/^(headline|text)-(\d+)(?:-(\d+))?$/);
    return m ? Number(`${m[2]}.${m[3] || 0}`) : 0;
  };
  var lineSize = (el) => Math.max(0, ...spansIn(el).flatMap((s) => tagsOf(s).map(tagSize)));
  var hasTag = (el, re) => spansIn(el).some((s) => tagsOf(s).some((t) => re.test(t)));
  var fullyBold = (el) => !!norm(el.textContent) && norm([...el.querySelectorAll("strong, b")].map((b) => b.textContent).join("")) === norm(el.textContent);
  var linkLine = (el) => {
    const links = el.querySelectorAll("a");
    return links.length === 1 && !!norm(el.textContent) && norm(links[0].textContent) === norm(el.textContent);
  };
  function metaTableOf(doc, main, table) {
    const section = sectionsOf(main).find((s) => s.nodes.includes(table));
    if (!section) return null;
    if (section.meta) return section.meta;
    const meta = doc.createElement("table");
    const head = doc.createElement("tr");
    const th = doc.createElement("th");
    th.setAttribute("colspan", "2");
    th.textContent = "Section Metadata";
    head.append(th);
    meta.append(head);
    const last = section.nodes[section.nodes.length - 1];
    last.after(meta);
    section.meta = meta;
    return meta;
  }
  function setMetaRow(doc, meta, key, value) {
    const row = metaRow(meta, key.toLowerCase());
    if (row) {
      row.children[1].textContent = value;
      return;
    }
    const tr = doc.createElement("tr");
    [key, value].forEach((v) => {
      const td = doc.createElement("td");
      td.textContent = v;
      tr.append(td);
    });
    meta.append(tr);
  }
  function heroes(doc, main) {
    blocksNamed(main, /^hero corp\b/).forEach((table) => {
      var _a, _b, _c;
      const rows = [...table.querySelectorAll(":scope > tbody > tr, :scope > tr")];
      if (rows.length < 2) return;
      const isImage = (c) => {
        const a = c.querySelector("a");
        return !!a && norm(c.textContent) === norm(a.textContent) && /\/is\/image\//.test(a.getAttribute("href") || "");
      };
      const cells = rows.slice(1).map((r) => r.lastElementChild).filter((c) => c && norm(c.textContent) && !isImage(c));
      if (!cells.length) return;
      cells.forEach((c) => {
        if ([...c.children].some((n) => /^(P|H[1-6])$/.test(n.tagName))) return;
        const p = doc.createElement("p");
        p.append(...c.childNodes);
        c.append(p);
      });
      const lines = cells.flatMap((c) => [...c.children]).filter((n) => /^(P|H[1-6])$/.test(n.tagName) && norm(n.textContent));
      const sized = lines.filter((l) => hasTag(l, /^(headline|text)-\d/));
      const max = sized.length ? Math.max(...sized.map(lineSize)) : 0;
      const ownSize = (s) => Math.max(0, ...tagsOf(s).map(tagSize));
      sized.filter((l) => lineSize(l) >= max - 0.5).forEach((l) => {
        const spans = spansIn(l);
        const big = spans.findIndex((s) => ownSize(s) >= max - 0.5);
        const small = spans.find((s, i) => i > big && !spans[big].contains(s) && ownSize(s) && ownSize(s) < max - 0.5 && !spansIn(s).some((x) => ownSize(x) >= max - 0.5) && norm(s.textContent).split(" ").length >= 2);
        if (big < 0 || !small) return;
        const range = doc.createRange();
        range.setStartBefore(small);
        range.setEnd(l, l.childNodes.length);
        const rest = doc.createElement("p");
        rest.append(range.extractContents());
        if (norm(rest.textContent)) {
          l.after(rest);
          lines.splice(lines.indexOf(l) + 1, 0, rest);
        }
      });
      if (max >= 2) {
        const first = sized.findIndex((l) => lineSize(l) >= max - 0.5);
        const title = [];
        const big = (l) => lineSize(l) >= max - 0.5;
        for (let i = lines.indexOf(sized[first]); i < lines.length && big(lines[i]); i += 1) {
          title.push(lines[i]);
        }
        if (!title.length) title.push(sized[first]);
        const otherH1 = [...main.querySelectorAll("h1")].some((h) => !title.includes(h));
        const h1 = doc.createElement(otherH1 ? "h2" : "h1");
        title.forEach((l, i) => {
          if (i) h1.append(doc.createElement("br"));
          h1.append(...l.childNodes);
        });
        const fromHeading = /^H\d$/.test(title[0].tagName);
        title[0].replaceWith(h1);
        title.slice(1).forEach((l) => l.remove());
        while (h1.firstChild && (h1.firstChild.nodeName === "BR" || h1.firstChild.nodeType === 3 && !h1.firstChild.textContent.trim())) h1.firstChild.remove();
        while (h1.lastChild && (h1.lastChild.nodeName === "BR" || h1.lastChild.nodeType === 3 && !h1.lastChild.textContent.trim())) h1.lastChild.remove();
        const rendered = (n) => {
          let emSize = 0;
          for (let el = n.parentElement; el && el !== h1.parentElement; el = el.parentElement) {
            const list = tagsOf(el).filter((x) => tagSize(x)).reverse();
            for (let i = 0; i < list.length; i += 1) {
              if (/^headline-/.test(list[i])) return [(emSize || 1) * tagSize(list[i]), false];
              emSize = Math.max(emSize, tagSize(list[i]));
            }
          }
          return [emSize || 1, true];
        };
        const sizes = [];
        const w = doc.createTreeWalker(h1, 4);
        while (w.nextNode()) if (w.currentNode.nodeValue.trim()) sizes.push(rendered(w.currentNode));
        const [size, em] = sizes.reduce((a, b) => b[0] > a[0] ? b : a, [0, false]);
        const tagged = (n, tag) => {
          for (let el = n.parentElement; el && el !== h1.parentElement; el = el.parentElement) {
            if (tagsOf(el).includes(tag)) return true;
          }
          return false;
        };
        const goldSerif = [];
        const gw = doc.createTreeWalker(h1, 4);
        while (gw.nextNode()) {
          const n = gw.currentNode;
          if (n.nodeValue.trim() && tagged(n, "color-gold")) goldSerif.push(tagged(n, "serif"));
        }
        if (!em && size === 3.5 && goldSerif.length && goldSerif.every(Boolean)) addVariant(table, "serif-gold-title");
        else if (size >= 5 && !em) addVariant(table, "xlarge");
        else if (size >= 3 && (size < 3.5 || em && size === 3.5 && !fromHeading)) addVariant(table, "medium");
        else if (size >= 3) addVariant(table, "large");
      }
      const copy = cells.flatMap((c) => [...c.querySelectorAll(":scope > p")]).filter((p) => norm(p.textContent) && !(p.querySelector("a") && norm(p.textContent) === norm(p.querySelector("a").textContent)));
      const most = (test) => copy.length && copy.filter(test).length * 2 > copy.length;
      if (most((p) => wholeSize(p) === "text-1-25")) addVariant(table, "large-copy");
      else if (most((p) => wholeSize(p) === "text-1-5")) addVariant(table, "xlarge-copy");
      else if (most((p) => spansIn(p).some((sp) => tagsOf(sp).includes("headline-1-5") && norm(sp.textContent) === norm(p.textContent)))) addVariant(table, "headline-copy");
      if (most((p) => spansIn(p).some((s) => tagsOf(s).includes("serif") && norm(s.textContent) === norm(p.textContent)))) addVariant(table, "serif");
      const existing = (_a = sectionsOf(main).find((s) => s.nodes.includes(table))) == null ? void 0 : _a.meta;
      const box = norm(((_c = (_b = metaRow(existing, "text box")) == null ? void 0 : _b.children[1]) == null ? void 0 : _c.textContent) || "").toLowerCase();
      const count = (tag) => cells.flatMap(spansIn).filter((s) => tagsOf(s).includes(tag) && !s.parentElement.closest(`span[data-tag~="${tag}"]`)).reduce((n, s) => n + norm(s.textContent).replace(/\s/g, "").length, 0);
      const white = count("color-white");
      const gray = count("color-light-gray");
      const all = cells.reduce((n, c) => n + norm(c.textContent).replace(/\s/g, "").length, 0);
      let colour = "";
      if (gray) colour = "light-gray";
      else if (white * 2 >= all && !/purple|teal|blue/.test(box)) colour = "white";
      const meta = colour ? metaTableOf(doc, main, table) : null;
      if (meta) setMetaRow(doc, meta, "Text colour", colour);
    });
  }
  function columnsCells(doc, main) {
    blocksNamed(main, /^(columns|accordion|panel)\b/).forEach((table) => {
      const isColumns = /^columns\b/.test(blockName(table));
      const cells = [...table.querySelectorAll("td")].filter((td) => td.closest("table") === table);
      if (/^panel\b/.test(blockName(table))) {
        cells.forEach((td) => {
          if (!norm(td.textContent) || [...td.children].some((n) => /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) return;
          const p = doc.createElement("p");
          p.append(...td.childNodes);
          td.append(p);
        });
        cells.flatMap((td) => [...td.querySelectorAll(":scope > p")]).forEach((p) => {
          if (wholeSize(p) !== "text-2-5") return;
          rename2(doc, p, "h2");
          addVariant(table, "large-titles");
        });
      }
      cells.forEach((td) => {
        const firstLine = td.querySelector(":scope > p");
        if (isColumns && firstLine && firstLine === td.firstElementChild && hasTag(firstLine, /^box-/)) {
          const gradient = hasTag(firstLine, /^box-.*-gradient$/);
          const h = rename2(doc, firstLine, gradient ? "h3" : "h2");
          spansIn(h).forEach(unwrap2);
          [...h.childNodes].forEach((n) => {
            if (n.nodeType === 3 && n.textContent.trim()) {
              const em = doc.createElement("em");
              n.before(em);
              em.append(n);
            }
          });
          while (h.lastChild && (h.lastChild.nodeName === "BR" || h.lastChild.nodeType === 3 && !h.lastChild.textContent.trim())) h.lastChild.remove();
          addVariant(table, gradient ? "phase-boxes" : "title-bars");
        }
      });
      const ps = cells.flatMap((td) => [...td.querySelectorAll("p")]);
      ps.forEach((p) => {
        if (!isColumns || !fullyBold(p) || linkLine(p)) return;
        const size = wholeSize(p);
        if (size === "text-2") {
          const h = rename2(doc, p, "h2");
          h.querySelectorAll("strong, b").forEach(unwrap2);
          addVariant(table, "large-titles");
        } else if (size === "text-2-5") {
          rename2(doc, p, "h2");
        } else if (!size && dominantSize(p) >= 4.75) {
          rename2(doc, p, "h2");
        }
      });
      if (isColumns) {
        const subtitle2 = cells.some((td) => [...td.querySelectorAll(":scope > p")].some((p) => {
          const prev = p.previousElementSibling;
          return wholeSize(p) === "text-1-25" && !fullyBold(p) && (prev == null ? void 0 : prev.tagName) === "P" && fullyBold(prev) && wholeSize(prev) === "text-1-5";
        }));
        if (subtitle2) addVariant(table, "large-subtitles");
        cells.forEach((td) => {
          if (td.querySelector("a, img, picture") || !norm(td.textContent)) return;
          const whole = spansIn(td).find((s) => tagsOf(s).includes("headline-1-5") && norm(s.textContent) === norm(td.textContent));
          if (!whole) return;
          if (![...td.children].some((n) => /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) {
            const p = doc.createElement("p");
            p.append(...td.childNodes);
            td.append(p);
          }
          addVariant(table, "headline-copy");
        });
        const labelled = cells.some((td) => [...td.querySelectorAll("p")].some((p) => {
          const first = p.firstElementChild;
          return (first == null ? void 0 : first.matches("strong, b")) && !first.querySelector('span[data-tag~="body-font"]') && [...p.querySelectorAll('span[data-tag~="body-font"]')].some((s) => !first.contains(s) && (s.querySelector("strong, b") || s.closest("strong, b")));
        }));
        if (labelled) addVariant(table, "label-bold");
        const grey = cells.some((td) => [...td.querySelectorAll("p, h2, h3, h4")].some((p) => fullyBold(p) && spansIn(p).some((s) => tagsOf(s).includes("color-grey") && norm(s.textContent) === norm(p.textContent))));
        if (grey) addVariant(table, "gray-titles");
        if (table.querySelector("a[data-blank-before]")) addVariant(table, "button-gap");
      }
      const imageLink = (p) => {
        const a = (p == null ? void 0 : p.tagName) === "P" && p.querySelector("a");
        return !!a && norm(p.textContent) === norm(a.textContent) && /\/is\/image\//.test(a.getAttribute("href") || "");
      };
      if (isColumns && cells.some((td) => [...td.querySelectorAll(":scope > p")].some((p) => imageLink(p.previousElementSibling) && fullyBold(p) && !hasTag(p, /^(text-|headline-|color-gold$)/)))) {
        addVariant(table, "product-names");
      }
      if (isColumns && spansIn(table).some((s) => tagsOf(s).includes("body-font") && (s.closest("strong, b") || s.querySelector("strong, b")))) {
        addVariant(table, "plain-bold");
      }
      const copy = [...table.querySelectorAll("td p, td li")].filter((p) => norm(p.textContent) && !fullyBold(p));
      const sizeShare = (tag) => copy.filter((p) => wholeSize(p) === tag).length;
      if (copy.length && sizeShare("text-1-25") * 2 > copy.length) addVariant(table, "large-copy");
      else if (isColumns && copy.length && sizeShare("text-1-5") * 2 > copy.length) addVariant(table, "xlarge-copy");
    });
  }
  function splitTitleLines(doc, main) {
    blocksNamed(main, /^columns\b/).forEach((t) => t.querySelectorAll("td").forEach((td) => {
      if (td.closest("table") !== t || !norm(td.textContent) || td.querySelector("a, img, picture") || [...td.children].some((n) => /^(P|H[1-6]|UL|OL|DIV|TABLE)$/.test(n.tagName))) return;
      const p = doc.createElement("p");
      p.append(...td.childNodes);
      td.append(p);
    }));
    main.querySelectorAll("td p, :scope > p").forEach((p) => {
      const br = [...p.querySelectorAll("br")].find((b) => {
        for (let el = b.parentElement; el !== p; el = el.parentElement) {
          if (!/^(SPAN|STRONG|B|EM|I)$/.test(el.tagName)) return false;
        }
        return true;
      });
      if (!br) return;
      const range = doc.createRange();
      range.setStart(p, 0);
      range.setEndBefore(br);
      const holder = doc.createElement("p");
      holder.append(range.cloneContents());
      if (!norm(holder.textContent)) return;
      const sizes = p.closest("td") ? /^(text-(1-25|1-5|1-75|2|2-5)|headline-([5-9]|5-5))$/ : /^text-1-(5|75)$/;
      const size = spansIn(holder).filter((s) => tagsOf(s).some((t) => sizes.test(t))).find((s) => norm(s.textContent) === norm(holder.textContent));
      if (!size || !fullyBold(holder)) return;
      const first = doc.createElement("p");
      first.append(range.extractContents());
      br.remove();
      p.before(first);
    });
  }
  function pageCopy(main) {
    const own = [...main.children].flatMap((el) => /^(P|UL|OL)$/.test(el.tagName) ? [el] : []).flatMap((el) => el.tagName === "P" ? [el] : [...el.querySelectorAll("li")]).filter((p) => norm(p.textContent) && !fullyBold(p));
    if (own.length && own.filter((p) => wholeSize(p) === "text-1-25").length * 2 > own.length) addTheme(main, "large-copy");
  }
  function sizeLines(doc, main) {
    main.querySelectorAll("p").forEach((p) => {
      const block = p.closest("table");
      if (block && /^hero corp\b/.test(blockName(block))) return;
      const size = wholeSize(p);
      if (!size) return;
      const bold = norm([...p.querySelectorAll("strong, b")].map((b) => b.textContent).join("")) === norm(p.textContent);
      if (!bold || linkLine(p)) return;
      if (size === "text-1-5") rename2(doc, p, "h3");
      else if (size === "text-1-25") rename2(doc, p, "h4");
      else if (size === "text-1-75") {
        const goldPart = !!p.querySelector('span[data-tag~="color-gold"]');
        const h2 = rename2(doc, p, "h2");
        if (!goldPart) h2.querySelectorAll("strong, b").forEach(unwrap2);
      }
    });
  }
  function displayLines(doc, main) {
    sectionsOf(main).forEach((section) => {
      if (!styleOf(section).includes("p-2-5")) return;
      section.nodes.filter((n) => n.tagName === "TABLE").forEach((t) => {
        t.querySelectorAll("td p").forEach((p) => {
          if (p.querySelector('span[data-tag~="color-gold"]')) rename2(doc, p, "h2");
        });
      });
    });
  }
  function variantsOf(table) {
    var _a;
    const m = norm(((_a = table.querySelector("tr")) == null ? void 0 : _a.textContent) || "").match(/^([^(]+?)\s*(?:\((.*)\))?$/);
    return { name: m[1], list: (m[2] || "").split(",").map((o) => o.trim()).filter(Boolean) };
  }
  function setVariants(table, name, list) {
    const cell = table.querySelector("tr").firstElementChild;
    cell.textContent = list.length ? `${name} (${list.join(", ")})` : name;
  }
  function heroVariants(doc, main) {
    blocksNamed(main, /^hero corp\b/).forEach((table) => {
      const section = sectionsOf(main).find((s) => s.nodes.includes(table));
      const meta = section == null ? void 0 : section.meta;
      if (!meta) return;
      const read = (key) => {
        var _a;
        const row = metaRow(meta, key);
        if (!row) return "";
        const value = norm(((_a = row.children[1]) == null ? void 0 : _a.textContent) || "");
        row.remove();
        return value;
      };
      const { name, list } = variantsOf(table);
      const banner = list.includes("banner");
      const [top, left, right] = read("text position").split(",").map((v) => parseFloat(v));
      const width = parseFloat(read("text width"));
      const phones = read("text on phones").toLowerCase();
      const imageRow = (tr) => {
        const a = tr.querySelector("a");
        return !!a && /\/is\/image\//.test(a.getAttribute("href") || "") && norm(tr.textContent) === norm(a.textContent);
      };
      const over = !phones && [...table.querySelectorAll("tr")].slice(1).filter(imageRow).length >= 2;
      const phoneColour = read("text colour on phones").toLowerCase().replace(/[\s_]+/g, "-");
      const colour = read("text colour").toLowerCase();
      const box = read("text box").toLowerCase().replace(/\s+/g, "-");
      let placement = "";
      if (!Number.isNaN(left) && left >= 40) placement = "right";
      else if (!banner && !Number.isNaN(top)) {
        if (top >= 45) placement = "bottom-left";
        else if (right <= 15) placement = "wide";
        else if (top <= 12 || right <= 52) placement = "top-left";
        else placement = "left";
      }
      if (placement) list.push(over && ["top-left", "left"].includes(placement) ? `${placement}-over` : placement);
      if (banner && placement !== "right" && !Number.isNaN(width) && width <= 50) list.push("half-text");
      setVariants(table, name, list);
      const styles = [
        colour && `${colour}-text`,
        box && `box-${box}`,
        phoneColour === "dark-gray" && "phone-dark-gray-text"
      ].filter(Boolean);
      if (styles.length) {
        const row = metaRow(meta, "style");
        const now = row ? row.children[1].textContent.split(",").map((s) => s.trim()).filter(Boolean) : [];
        setMetaRow(doc, meta, "style", [...now, ...styles].join(", "));
      }
      if (meta.querySelectorAll("tr").length <= 1) meta.remove();
    });
  }
  var BUNDLES = [
    [["large-copy", "serif"], "large-serif-copy"],
    [["xlarge-copy", "serif"], "xlarge-serif-copy"],
    [["headline-copy", "serif"], "headline-serif-copy"],
    [["gray-last", "large-subtitles", "plain-bold"], "faculty"],
    [["label-bold", "plain-bold"], "chapter-labels"],
    [["gray-all", "plain-bold"], "gray-cards"]
  ];
  function bundleVariants(main, warn) {
    [...main.querySelectorAll("table")].forEach((table) => {
      var _a;
      const head = norm(((_a = table.querySelector("tr")) == null ? void 0 : _a.textContent) || "");
      if (!/^[a-z][a-z -]*\([^()]*\)$/i.test(head) || /^(section )?metadata\b/i.test(head)) return;
      const { name, list: raw } = variantsOf(table);
      const list = raw.map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
      let out = [...list];
      BUNDLES.forEach(([parts, bundle]) => {
        if (!parts.every((p) => out.includes(p))) return;
        const at = out.indexOf(parts[0]);
        out = out.filter((v) => !parts.includes(v));
        out.splice(Math.min(at, out.length), 0, bundle);
      });
      if (out.join() !== list.join()) setVariants(table, name, out);
      if (out.length > 3) warn.push(`more than 3 variants: ${name} (${out.join(", ")})`);
    });
  }
  var GOLD_BOX = /^panel\b.*\bgold(-gradient)?\b|^columns\b.*\bgold-lead\b/;
  function whiteOnGold(doc, main) {
    blocksNamed(main, GOLD_BOX).forEach((table) => {
      const nodes = [];
      const w = doc.createTreeWalker(table, 4);
      while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
      nodes.forEach((n) => {
        let el = n.parentElement;
        while (el && el !== table && !tagsOf(el).some((t) => /^color-(white|black)$/.test(t))) {
          el = el.parentElement;
        }
        if (!el || el === table || !tagsOf(el).includes("color-white")) return;
        const span = tagSpan(doc, ["color-gold"]);
        n.before(span);
        span.append(n);
      });
    });
  }
  function finishSpans(doc, main, warn) {
    spansIn(main).reverse().forEach((span) => {
      const tags2 = tagsOf(span);
      if (tags2.includes("color-gold")) gold(doc, span);
      if (tags2.includes("serif") && span.closest("h1, h2, h3, h4, h5, h6")) serifInHeading(doc, span);
      const known = tags2.every((t) => /^(color-|text-|headline-|serif$|body-font$|box-)/.test(t));
      if (!known) warn.push(`unmapped tag ${tags2.join(",")}: "${norm(span.textContent).slice(0, 40)}"`);
    });
    spansIn(main).forEach(unwrap2);
  }
  function tidyEmphasis(doc, main) {
    const moveEdge = (el, first) => {
      var _a;
      for (; ; ) {
        const n = first ? el.firstChild : el.lastChild;
        if (!n) return;
        const put = (node) => first ? el.before(node) : el.after(node);
        if (n.nodeType === 1 && n.tagName === "BR") {
          put(n);
        } else if (n.nodeType === 3 && !n.textContent) {
          n.remove();
        } else if (n.nodeType === 3) {
          const t = n.textContent;
          const ws = (_a = first ? t.match(/^\s+/) : t.match(/\s+$/)) == null ? void 0 : _a[0];
          if (!ws) return;
          if (ws.length === t.length) {
            n.textContent = " ";
            put(n);
          } else {
            n.textContent = first ? t.slice(ws.length) : t.slice(0, -ws.length);
            put(doc.createTextNode(" "));
            return;
          }
        } else {
          return;
        }
      }
    };
    const splitAtBreaks = (el) => {
      if (![...el.childNodes].some((n) => n.nodeName === "BR")) return;
      const parts = [[]];
      [...el.childNodes].forEach((n) => n.nodeName === "BR" ? parts.push(n, []) : parts[parts.length - 1].push(n));
      const out = parts.flatMap((p) => {
        if (!Array.isArray(p)) return [p];
        if (!p.some((n) => n.textContent.trim() || n.nodeType === 1 && n.querySelector("img, picture"))) return p;
        const piece = el.cloneNode(false);
        piece.append(...p);
        return [piece];
      });
      el.replaceWith(...out);
      out.filter((n) => n.nodeType === 1 && n.nodeName === el.nodeName).forEach((n) => {
        moveEdge(n, true);
        moveEdge(n, false);
      });
    };
    [...main.querySelectorAll("strong, b, em, i, u")].reverse().forEach((el) => {
      moveEdge(el, true);
      moveEdge(el, false);
      if (!el.textContent.trim() && !el.querySelector("img, picture")) {
        unwrap2(el);
        return;
      }
      splitAtBreaks(el);
    });
    main.querySelectorAll("strong, b, em, i, u").forEach((el) => {
      const next = el.nextSibling;
      const prev = el.previousSibling;
      if ((next == null ? void 0 : next.nodeType) === 3) next.textContent = next.textContent.replace(/^\u00a0+/, " ");
      if ((prev == null ? void 0 : prev.nodeType) === 3) prev.textContent = prev.textContent.replace(/\u00a0+$/, " ");
    });
  }
  var BLOCK_VARIANT = { "p-1-25": "large-copy", "p-1-5": "xlarge-copy", serif: "serif" };
  var VARIANT_BLOCKS = /^(columns|accordion|panel)\b/i;
  var SECTION_SIZE_HEADING = {
    "p-2-5": "h2",
    "p-1-75": "h2",
    "p-1-5": "h3",
    "p-1-25": "h4"
  };
  function serifHeadings2(doc, section) {
    section.nodes.filter((n) => /^H[1-6]$/.test(n.tagName)).forEach((h) => {
      if (h.querySelector(":scope > em:only-child") || norm(h.textContent) === norm([...h.querySelectorAll("strong")].map((s) => s.textContent).join(""))) return;
      const span = doc.createElement("span");
      span.append(...h.childNodes);
      h.append(span);
      serifInHeading(doc, span);
      unwrap2(span);
    });
  }
  function italicPlainWords(doc, h) {
    [...h.childNodes].forEach((n) => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const em = doc.createElement("em");
      n.before(em);
      em.append(n);
    });
  }
  function dropTypographyStyles(doc, main, warn, group = "") {
    let prevEmptied = false;
    sectionsOf(main).forEach((section) => {
      const styles = styleOf(section);
      const typo = styles.filter((s) => TYPO_STYLES.has(s));
      if (!typo.length) {
        prevEmptied = false;
        return;
      }
      const emptied = typo.length === styles.length;
      if (emptied && prevEmptied && section.hr) section.hr.remove();
      prevEmptied = emptied;
      if (typo.includes("h-serif") || typo.includes("h2-1-5")) serifHeadings2(doc, section);
      const level = SECTION_SIZE_HEADING[typo.find((s) => SECTION_SIZE_HEADING[s])];
      if (level) {
        section.nodes.forEach((n, i) => {
          if (n.tagName !== "P" || !norm(n.textContent)) return;
          const bold = norm([...n.querySelectorAll("strong, b")].map((b) => b.textContent).join(""));
          if (bold !== norm(n.textContent) || linkLine(n)) return;
          const h = rename2(doc, n, level);
          if (level === "h2" && !typo.includes("p-2-5")) h.querySelectorAll("strong, b").forEach(unwrap2);
          section.nodes[i] = h;
        });
      }
      if (typo.includes("p-1-75")) {
        section.nodes.filter((n) => {
          var _a;
          return n.tagName === "TABLE" && /^columns\b/i.test(norm(((_a = n.querySelector("tr")) == null ? void 0 : _a.textContent) || ""));
        }).forEach((t) => t.querySelectorAll("td > p").forEach((p) => {
          const bold = norm([...p.querySelectorAll("strong, b")].map((b) => b.textContent).join(""));
          if (!norm(p.textContent) || bold !== norm(p.textContent) || linkLine(p)) return;
          const h = rename2(doc, p, "h2");
          if (!h.querySelector("em, i")) h.querySelectorAll("strong, b").forEach(unwrap2);
        }));
      }
      if (group === "asc" && typo.includes("serif") && (typo.includes("p-3-5") || typo.includes("p-2-5"))) {
        section.nodes.forEach((n, i) => {
          if (n.tagName !== "P" || !norm(n.textContent)) return;
          const bold = norm([...n.querySelectorAll("strong, b")].map((b) => b.textContent).join(""));
          if (bold === norm(n.textContent)) return;
          const h = rename2(doc, n, typo.includes("p-3-5") ? "h2" : "h3");
          italicPlainWords(doc, h);
          section.nodes[i] = h;
        });
      }
      const blocks2 = section.nodes.filter((n) => {
        var _a;
        return n.tagName === "TABLE" && VARIANT_BLOCKS.test(norm(((_a = n.querySelector("tr")) == null ? void 0 : _a.textContent) || ""));
      });
      typo.forEach((s) => {
        const variant = BLOCK_VARIANT[s];
        if (!variant) return;
        blocks2.filter((b) => !/large-headline/.test(b.querySelector("tr").textContent)).forEach((b) => addVariant(b, variant));
        const copy = section.nodes.filter((n) => /^(P|UL|OL)$/.test(n.tagName) && norm(n.textContent));
        if (copy.length && s === "p-1-25") addTheme(main, "large-copy");
        else if (copy.length && s === "p-1-5") addTheme(main, "xlarge-copy");
        else if (copy.length) warn.push(`${s} on default content: "${norm(copy[0].textContent).slice(0, 40)}"`);
      });
      setStyle(section, styles.filter((s) => !TYPO_STYLES.has(s)));
    });
  }
  function semanticMarkup(main, doc, url = "") {
    var _a;
    const warn = [];
    const group = ((_a = PAGE_THEMES.find(([re]) => re.test(url))) == null ? void 0 : _a[1]) || "";
    if (group) addTheme(main, group);
    tagsToSpans(doc, main);
    blocksNamed(main, /^columns\b/).filter((t) => !/large-headline/.test(blockName(t))).forEach((t) => {
      t.querySelectorAll("td h2").forEach((h) => {
        const kids = [...h.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
        const plain = kids.some((n) => n.nodeType === 3);
        const onlyBold = kids.every((n) => n.nodeType === 3 || n.nodeName === "STRONG" || n.nodeName === "B" || n.nodeName === "SPAN" && !n.querySelector("em, i") && !tagsOf(n).includes("color-gold"));
        if (plain && onlyBold && h.querySelector("strong, b")) italicPlainWords(doc, h);
      });
    });
    if (group === "asc") ascHeadlines(doc, main, warn);
    largeHeadlines(doc, main, warn);
    heroes(doc, main);
    splitTitleLines(doc, main);
    columnsCells(doc, main);
    pageCopy(main);
    sizeLines(doc, main);
    displayLines(doc, main);
    whiteOnGold(doc, main);
    finishSpans(doc, main, warn);
    dropTypographyStyles(doc, main, warn, group);
    pageSpacers(doc, main, url);
    main.querySelectorAll("[data-blank-before]").forEach((a) => a.removeAttribute("data-blank-before"));
    tidyEmphasis(doc, main);
    heroVariants(doc, main);
    bundleVariants(main, warn);
    const left = main.textContent.match(/\[\[[^\]]*\]/g);
    if (left) warn.push(`bracket text left: ${left.slice(0, 5).join(" ")}`);
    return warn;
  }
  function transform4(hookName, element, payload) {
    var _a;
    if (hookName !== "afterTransform") return;
    const url = ((_a = payload.params) == null ? void 0 : _a.originalURL) || payload.url || "";
    const warn = semanticMarkup(element, payload.document, url);
    if (warn.length) element.setAttribute("data-semantic-warn", warn.join(" | "));
  }

  // tools/importer/transformers/patients-stryker-page-corrections.js
  var txt = (el) => (el ? el.textContent : "").replace(/[\s ]+/g, " ").trim();
  var isBlank = (n) => n && n.nodeType === 3 && !n.textContent.trim();
  function nextOf(n) {
    let x = n && n.nextSibling;
    while (isBlank(x)) x = x.nextSibling;
    return x;
  }
  function prevOf(n) {
    let x = n && n.previousSibling;
    while (isBlank(x)) x = x.previousSibling;
    return x;
  }
  var find = (main, sel, start) => [...main.querySelectorAll(sel)].find((el) => txt(el).startsWith(start));
  function topOf(main, el) {
    let node = el;
    while (node && node.parentElement !== main) node = node.parentElement;
    return node;
  }
  function sectionOf(main, el) {
    const kids = [...main.children];
    const i = kids.indexOf(topOf(main, el));
    if (i < 0) return [];
    let s = i;
    while (s > 0 && kids[s - 1].tagName !== "HR") s -= 1;
    let e = i;
    while (e < kids.length - 1 && kids[e + 1].tagName !== "HR") e += 1;
    return kids.slice(s, e + 1);
  }
  var isSectionMetadata = (el) => el && el.tagName === "TABLE" && txt(el.querySelector("th, td")).toLowerCase() === "section metadata";
  function style(main, doc, el, value) {
    if (!el) return;
    const section = sectionOf(main, el);
    const table = section.find(isSectionMetadata);
    if (!value) {
      if (table) table.remove();
      return;
    }
    if (table) {
      const row = [...table.querySelectorAll("tr")].find((tr) => txt(tr.cells[0]).toLowerCase() === "style");
      if (row) {
        row.cells[1].textContent = value;
        return;
      }
      table.remove();
    }
    section[section.length - 1].after(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style: value } }));
  }
  function breakBefore(main, doc, el, value) {
    var _a;
    if (!el) return;
    const top = topOf(main, el);
    if (((_a = top.previousElementSibling) == null ? void 0 : _a.tagName) === "HR") {
      style(main, doc, el, value);
      return;
    }
    const table = sectionOf(main, el).find(isSectionMetadata);
    const hr = doc.createElement("hr");
    top.before(hr);
    if (table) hr.before(table);
    if (value) style(main, doc, el, value);
  }
  function breakAfter(main, doc, el, { keepStyle = false } = {}) {
    var _a;
    if (!el) return;
    const top = topOf(main, el);
    if (((_a = top.nextElementSibling) == null ? void 0 : _a.tagName) === "HR") return;
    const table = sectionOf(main, el).find(isSectionMetadata);
    const hr = doc.createElement("hr");
    top.after(hr);
    if (keepStyle && table) hr.before(table);
  }
  function mergeWithPrevious(main, el) {
    if (!el) return;
    const section = sectionOf(main, el);
    const hr = section[0].previousElementSibling;
    if (!hr || hr.tagName !== "HR") return;
    section.filter(isSectionMetadata).forEach((t) => t.remove());
    const before = hr.previousElementSibling;
    hr.remove();
    const rest = sectionOf(main, section.find((n) => n.isConnected) || before);
    if (isSectionMetadata(before)) rest[rest.length - 1].after(before);
  }
  function retag(main, doc, el, tag) {
    if (!el || el.tagName.toLowerCase() === tag) return el;
    const out = doc.createElement(tag);
    out.append(...el.childNodes);
    el.replaceWith(out);
    return out;
  }
  function subtitle(main, doc, el, { em = false, split = true } = {}) {
    const h3 = retag(main, doc, el, "h3");
    if (!h3) return;
    if (em && !h3.querySelector("em")) {
      const i = doc.createElement("em");
      i.append(...h3.childNodes);
      h3.append(i);
    }
    if (split) breakAfter(main, doc, h3);
  }
  function joinLabel(main, doc, label) {
    [...main.querySelectorAll("p")].filter((p) => txt(p) === label && txt(p.querySelector("strong")) === label).forEach((p) => {
      const next = p.nextElementSibling;
      if (!next || next.tagName !== "P") return;
      p.append(doc.createElement("br"), ...next.childNodes);
      next.remove();
    });
  }
  function joinParagraph(doc, p, breaks = 2) {
    const prev = p && p.previousElementSibling;
    if (!prev || prev.tagName !== "P") return;
    for (let i = 0; i < breaks; i += 1) prev.append(doc.createElement("br"));
    prev.append(...p.childNodes);
    p.remove();
  }
  function boldAll(main, doc, el) {
    if (!el || el.children.length === 1 && el.firstElementChild.tagName === "STRONG" && txt(el) === txt(el.firstElementChild)) return;
    const b = doc.createElement("strong");
    b.append(...el.childNodes);
    el.append(b);
  }
  function boldPerLine(strong, doc) {
    if (!strong || !strong.querySelector("br")) return;
    const parts = [[]];
    [...strong.childNodes].forEach((n) => n.nodeName === "BR" ? parts.push([]) : parts[parts.length - 1].push(n));
    const out = [];
    parts.forEach((nodes, i) => {
      if (i) out.push(doc.createElement("br"));
      const b = doc.createElement("strong");
      b.append(...nodes);
      out.push(b);
    });
    strong.replaceWith(...out);
  }
  function brBeforeLabel(p) {
    var _a;
    const b = p && p.querySelector("strong");
    if (b && ((_a = b.firstChild) == null ? void 0 : _a.nodeName) === "BR") b.before(b.firstChild);
  }
  function newTab2(main, hrefs) {
    hrefs.forEach((h) => main.querySelectorAll(`a[href="${h}"]`).forEach((a) => a.setAttribute("href", `${h}#_blank`)));
  }
  function tags(main, value) {
    main.setAttribute("data-meta-tags", value);
  }
  function footnotesToList(main, doc, first) {
    if (!first) return;
    const paras = [];
    for (let p = first; p && p.tagName === "P" && /^\d+\./.test(txt(p)); p = p.nextElementSibling) paras.push(p);
    const ol = doc.createElement("ol");
    paras.forEach((p) => {
      let item = [];
      const flush = () => {
        var _a;
        if (!item.length) return;
        const li = doc.createElement("li");
        li.append(...item);
        if (((_a = li.firstChild) == null ? void 0 : _a.nodeType) === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s*\d+\.\s*/, "");
        ol.append(li);
        item = [];
      };
      [...p.childNodes].forEach((n) => {
        var _a, _b, _c, _d;
        if (n.nodeName === "BR" && ((_a = nextOf(n)) == null ? void 0 : _a.nodeName) === "BR") {
          flush();
          return;
        }
        if (n.nodeName === "BR" && ((_b = prevOf(n)) == null ? void 0 : _b.nodeName) === "BR") return;
        if (isBlank(n) && (((_c = nextOf(n)) == null ? void 0 : _c.nodeName) === "BR" || ((_d = prevOf(n)) == null ? void 0 : _d.nodeName) === "BR") && !item.length) return;
        item.push(n);
      });
      flush();
    });
    const last = paras[paras.length - 1];
    const hr1 = doc.createElement("hr");
    const hr2 = doc.createElement("hr");
    last.after(hr1, WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style: "spacer" } }), hr2, ol);
    paras.forEach((p) => p.remove());
    ol.after(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style: "disclaimer" } }));
  }
  var SRC = "https://www.stryker.com/us/en/";
  var norm2 = (t) => (t || "").replace(/\s+/g, " ").trim();
  var headOf = (table) => table.querySelector("tr");
  var nameOf = (table) => {
    var _a;
    return norm2((_a = headOf(table)) == null ? void 0 : _a.textContent).toLowerCase();
  };
  var blocks = (main, re) => [...main.querySelectorAll("table")].filter((t) => re.test(nameOf(t)));
  function variantsOf2(table) {
    const m = norm2(headOf(table).textContent).match(/^([^(]+?)\s*(?:\((.*)\))?$/);
    return { name: m[1], list: (m[2] || "").split(",").map((v) => v.trim()).filter(Boolean) };
  }
  function setVariants2(table, list) {
    const { name } = variantsOf2(table);
    headOf(table).firstElementChild.textContent = list.length ? `${name} (${list.join(", ")})` : name;
  }
  function addVariants(table, ...more) {
    const { list } = variantsOf2(table);
    setVariants2(table, [...list, ...more.filter((v) => !list.includes(v))]);
  }
  function setTheme(main, theme) {
    main.setAttribute("data-semantic-theme", theme);
  }
  function rename3(el, tag) {
    const doc = el.ownerDocument;
    const out = doc.createElement(tag);
    while (el.firstChild) out.append(el.firstChild);
    el.replaceWith(out);
    return out;
  }
  function wrap(node, tag) {
    const el = node.ownerDocument.createElement(tag);
    node.before(el);
    el.append(node);
    return el;
  }
  var styleCells = (main) => blocks(main, /^section metadata$/).flatMap((t) => [...t.querySelectorAll("tr")]).filter((tr) => {
    var _a;
    return norm2((_a = tr.firstElementChild) == null ? void 0 : _a.textContent).toLowerCase() === "style" && tr.children[1];
  }).map((tr) => tr.children[1]);
  function replaceStyle(main, from, to, nth = -1) {
    styleCells(main).filter((td) => norm2(td.textContent) === from).forEach((td, i) => {
      if (nth < 0 || i === nth) td.textContent = to;
    });
  }
  var metaWithStyle = (main, style2) => styleCells(main).filter((td) => norm2(td.textContent) === style2).map((td) => td.closest("table"));
  function removeEmptySection(meta) {
    const next = meta.nextElementSibling;
    if ((next == null ? void 0 : next.tagName) === "HR") next.remove();
    meta.remove();
  }
  var heroes2 = (main) => blocks(main, /^hero corp\b/);
  var named = (main, name) => blocks(main, new RegExp(`^${name.replace(/[()]/g, "\\$&")}$`));
  function trimLead(el) {
    const first = el.firstChild;
    if ((first == null ? void 0 : first.nodeType) === 3) first.textContent = first.textContent.trimStart();
  }
  function dropBlankText(el) {
    [...el.childNodes].filter((n) => n.nodeType === 3 && !norm2(n.textContent)).forEach((n) => n.remove());
  }
  function posterSize(main, asset, wid, hei) {
    main.querySelectorAll(`a[href*="/${asset}"]`).forEach((a) => {
      a.setAttribute("href", a.getAttribute("href").replace(/wid=\d+&hei=\d+/, `wid=${wid}&hei=${hei}`));
    });
  }
  function splitLastLine(para) {
    const brs = para.querySelectorAll(":scope > br");
    const last = brs[brs.length - 1];
    if (!last) return;
    const out = para.ownerDocument.createElement("p");
    while (last.nextSibling) out.append(last.nextSibling);
    last.remove();
    out.normalize();
    trimLead(out);
    para.after(out);
  }
  function splitFirstLine(el, tag, keep = (n) => n) {
    const br = el.querySelector(":scope > br");
    if (!br) return;
    const doc = el.ownerDocument;
    const head = doc.createElement(tag);
    const rest = doc.createElement("p");
    const kids = [...el.childNodes];
    const at = kids.indexOf(br);
    head.append(...kids.slice(0, at).map(keep));
    rest.append(...kids.slice(at + 1));
    rest.normalize();
    trimLead(rest);
    el.replaceWith(head, rest);
  }
  var unItalic = (n) => {
    if (n.nodeName !== "EM") return n;
    const frag = n.ownerDocument.createDocumentFragment();
    frag.append(...n.childNodes);
    return frag;
  };
  function styleTable(doc, style2) {
    const table = doc.createElement("table");
    const head = doc.createElement("tr");
    const th = doc.createElement("th");
    th.setAttribute("colspan", "2");
    th.textContent = "Section Metadata";
    head.append(th);
    const row = doc.createElement("tr");
    ["style", style2].forEach((v) => {
      const td = doc.createElement("td");
      td.textContent = v;
      row.append(td);
    });
    table.append(head, row);
    return table;
  }
  function addSectionStyle(node, style2) {
    let last = node;
    while (last.nextElementSibling && last.nextElementSibling.tagName !== "HR") last = last.nextElementSibling;
    last.after(styleTable(node.ownerDocument, style2));
  }
  function sectionBefore(node, style2) {
    node.before(styleTable(node.ownerDocument, style2), node.ownerDocument.createElement("hr"));
  }
  function spacerSectionsBefore(node) {
    const out = [];
    let hr = node.previousElementSibling;
    while ((hr == null ? void 0 : hr.tagName) === "HR") {
      const meta = hr.previousElementSibling;
      if ((meta == null ? void 0 : meta.tagName) !== "TABLE" || nameOf(meta) !== "section metadata") break;
      const before = meta.previousElementSibling;
      if (before && before.tagName !== "HR") break;
      out.push(meta);
      hr = before;
    }
    return out;
  }
  function blockTable(doc, name, cells) {
    const table = doc.createElement("table");
    const head = doc.createElement("tr");
    const th = doc.createElement("th");
    th.setAttribute("colspan", String(cells.length));
    th.textContent = name;
    head.append(th);
    const row = doc.createElement("tr");
    cells.forEach((nodes) => {
      const td = doc.createElement("td");
      td.append(...nodes);
      row.append(td);
    });
    table.append(head, row);
    return table;
  }
  var withText = (main, tag, text4) => [...main.querySelectorAll(tag)].filter((el) => norm2(el.textContent) === text4);
  function boldHeading(h) {
    const strong = h.ownerDocument.createElement("strong");
    strong.textContent = norm2(h.textContent);
    h.replaceChildren(strong);
    return h;
  }
  function boldSecondTitleLine(h1) {
    const gold2 = [...h1.children].find((el) => el.tagName === "EM" && el.querySelector(":scope > strong"));
    if (!gold2) return;
    const lead = gold2.querySelector(":scope > strong");
    let after = gold2;
    const kids = [...gold2.childNodes];
    kids.slice(kids.indexOf(lead) + 1).forEach((n) => {
      after.after(n);
      after = n;
    });
    let started = false;
    let done = false;
    let node = gold2.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (node.nodeName === "BR") {
        if (started) done = true;
      } else if (norm2(node.textContent)) {
        if (!done) {
          started = true;
          if (node.nodeName === "EM") rename3(node, "strong");
          else if (node.nodeName !== "STRONG") wrap(node, "strong");
        } else if (node.nodeType === 3) {
          wrap(node, "em");
        }
      }
      node = next;
    }
  }
  var JR45_TITLE = [
    (main) => blocks(main, /^columns \(columns 67 33, large-titles, large-copy\)$/).forEach((t) => {
      const h1 = t.querySelector("h1");
      if (!h1) return;
      addVariants(t, "plain-bold");
      boldSecondTitleLine(h1);
    })
  ];
  var JR45_BOX = [
    (main) => blocks(main, /^columns \((stack, )?faculty\)$/).forEach((t) => addVariants(t, "large-box-copy"))
  ];
  var TOOLKIT = (title) => [
    (main) => withText(main, "h1", title).forEach(boldHeading),
    (main) => [...main.querySelectorAll(":scope > h2")].filter((h) => norm2(h.textContent).startsWith("Welcome to the")).forEach((h) => rename3(h, "h4")),
    (main) => named(main, "columns (columns-33-67, large-serif-copy)").forEach((t) => addVariants(t, "plain-bold")),
    (main) => named(main, "hero corp (banner, half-text)").forEach((t) => addVariants(t, "large-serif-copy")),
    (main) => withText(main, "p", "Follow Stryker's Foot & Ankle team on Social Media!").forEach((el) => rename3(el, "h3")),
    (main) => setTheme(main, "large-headlines, xxlarge-copy, serif-copy")
  ];
  var page = (path) => `${SRC}${path}.html`;
  var jr45 = (path) => `${SRC}training-and-education/orthopaedics/joint-replacement/jr45/${path}.html`;
  var CORRECTIONS = __spreadValues(__spreadProps(__spreadValues(__spreadProps(__spreadValues({
    // text-only news pages (import-text-only.js): the edits authors made in DA after the
    // import, so a re-import gives the reviewed page; `tags` is the DA metadata row
    // stryker-announces-definitive-agreement-to-acquire-artelon--inc--
    "https://www.stryker.com/us/en/about/news/2024/stryker-announces-definitive-agreement-to-acquire-artelon--inc--.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      }
    ],
    // stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-completes-acquisition-of-care-ai
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-care-ai.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad
    "https://www.stryker.com/us/en/about/news/2024/stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-completes-acquisition-of-nico-corporation--expanding-min
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-nico-corporation--expanding-min.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-completes-acquisition-of-molli-surgical
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-molli-surgical.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-completes-acquisition-of-artelon-inc
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-artelon-inc.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
      }
    ],
    // stryker-completes-acquisition-of-serf-sas
    "https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-serf-sas.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        style(m, d, find(m, "p", "Forward-looking statements"), null);
        ["About Menix", "About SERF SAS", "Media contact"].forEach((label) => joinLabel(m, d, label));
      }
    ],
    // stryker-expands-foot---ankle-portfolio-with-specialized-offering
    "https://www.stryker.com/us/en/about/news/2024/stryker-expands-foot---ankle-portfolio-with-specialized-offering.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        retag(m, d, find(m, "h4", "The company to feature new products"), "h3");
      }
    ],
    // stryker-expands-prophecy-surgical-planning-system-to-include-the
    "https://www.stryker.com/us/en/about/news/2024/stryker-expands-prophecy-surgical-planning-system-to-include-the.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        boldAll(m, d, find(m, "p", "References:"));
      }
    ],
    // stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet
    "https://www.stryker.com/us/en/about/news/2023/stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet.html": [
      (m, d) => {
        var _a;
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        subtitle(m, d, find(m, "p", "Next advancement of Mako SmartRobotics"), { em: true });
        const about = find(m, "p", "About Stryker");
        breakBefore(m, d, about, "separator");
        if (about && ((_a = about.lastChild) == null ? void 0 : _a.nodeName) !== "BR") about.append(d.createElement("br"));
        brBeforeLabel(find(m, "p", "Media contact"));
      }
    ],
    // stryker-s-pangea-systems-receive-fda-clearance
    "https://www.stryker.com/us/en/about/news/2023/stryker-s-pangea-systems-receive-fda-clearance.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
        subtitle(m, d, find(m, "h2", "Pangea to offer"));
      }
    ],
    // stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a
    "https://www.stryker.com/us/en/about/news/2022/stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        subtitle(m, d, find(m, "p", "Innovative planning and intraoperative"));
        ["About Stryker", "Media contact"].forEach((label) => joinLabel(m, d, label));
        style(m, d, find(m, "p", "About Stryker"), "separator");
        style(m, d, find(m, "p", "Media contact"), "separator");
      }
    ],
    // 2022-ana-innovation-award-winners-address-gaps-in-health-equity-
    "https://www.stryker.com/us/en/about/news/2022/2022-ana-innovation-award-winners-address-gaps-in-health-equity-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      }
    ],
    // stryker-announces-first-patient-case-using--new-tornier-perform-
    "https://www.stryker.com/us/en/about/news/2022/stryker-announces-first-patient-case-using--new-tornier-perform-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/events, stryker:content-type/news/in-the-news");
        breakAfter(m, d, find(m, "p", "Case to be Presented at 2022"));
      }
    ],
    // stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu
    "https://www.stryker.com/us/en/about/news/2022/stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        subtitle(m, d, find(m, "h4", "This season, the Official SmartRobotics"), { split: false });
        breakBefore(m, d, find(m, "p", "About Stryker"), "separator");
      }
    ],
    // stryker-launches--free-your-feet--campaign-to-raise-awareness-ab
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches--free-your-feet--campaign-to-raise-awareness-ab.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        const more = find(m, "p", "More information about the campaign");
        mergeWithPrevious(m, more);
        joinParagraph(d, more, 2);
        style(m, d, find(m, "p", "About Stryker"), "separator");
      }
    ],
    // stryker-launches-prostep--mica-solo-guide--to-simplify-minimally
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches-prostep--mica-solo-guide--to-simplify-minimally.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      }
    ],
    // stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-
    "https://www.stryker.com/us/en/about/news/2022/stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        subtitle(m, d, find(m, "p", "Newly Launched Q Guidance System"), { em: true });
        mergeWithPrevious(m, find(m, "p", "QGS-MM-2_3426"));
        style(m, d, find(m, "p", "References:"), "separator, disclaimer");
      }
    ],
    // stryker-launches-insignia--femoral-hip-stem-at-the-american-acad
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches-insignia--femoral-hip-stem-at-the-american-acad.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        subtitle(m, d, find(m, "p", "Engineered to optimize fit and function"));
        joinLabel(m, d, "About Stryker");
        style(m, d, find(m, "p", "About Stryker"), "separator");
      }
    ],
    // stryker-enters-national-partnership-with-minor-league-baseball-t
    "https://www.stryker.com/us/en/about/news/2021/stryker-enters-national-partnership-with-minor-league-baseball-t.html": [
      (m, d) => {
        var _a, _b;
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        const label = [...m.querySelectorAll("p > strong")].find((s) => txt(s) === "The Nation Emerges from COVID-19");
        if (label && ((_a = nextOf(label)) == null ? void 0 : _a.nodeName) === "BR" && ((_b = nextOf(nextOf(label))) == null ? void 0 : _b.nodeName) !== "BR") label.after(d.createElement("br"));
      }
    ],
    // stryker-introduces-market-leading-tornier-shoulder-arthroplasty-
    "https://www.stryker.com/us/en/about/news/2021/stryker-introduces-market-leading-tornier-shoulder-arthroplasty-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        const date = [...m.querySelectorAll("p > strong, p > b")].find((s) => /^MAHWAH, N\.J\.—?$/.test(txt(s)));
        if (date) {
          const dash = nextOf(date);
          if (dash && dash.nodeType === 1 && txt(dash) === "\u2014") dash.remove();
          if (txt(date).endsWith("\u2014")) date.textContent = "MAHWAH, N.J.";
          const rest = nextOf(date);
          if (rest && rest.nodeType === 3 && !rest.textContent.startsWith(" \u2014 ")) rest.textContent = ` \u2014 ${rest.textContent.replace(/^[\s—]+/, "")}`;
        }
        breakBefore(m, d, find(m, "p", "Media Contacts"), null);
      }
    ],
    // stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v
    "https://www.stryker.com/us/en/about/news/2021/stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v.html": [
      (m, d) => {
        var _a, _b;
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/in-the-news");
        breakAfter(m, d, find(m, "p", "Stryker continues to work with United"), { keepStyle: true });
        const label = [...m.querySelectorAll("p > strong")].find((s) => txt(s) === "About Stryker");
        if (label && ((_a = nextOf(label)) == null ? void 0 : _a.nodeName) === "BR" && ((_b = nextOf(nextOf(label))) == null ? void 0 : _b.nodeName) === "BR") nextOf(label).remove();
      }
    ],
    // awareness-campaign-launched-to-support-world-restart-a-heart-day
    "https://www.stryker.com/us/en/about/news/2020/awareness-campaign-launched-to-support-world-restart-a-heart-day.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        footnotesToList(m, d, find(m, "p", "1. Cardiovascular diseases (CVDs)"));
      }
    ],
    // stryker-releases-emergency-relief-bed
    "https://www.stryker.com/us/en/about/news/2020/stryker-releases-emergency-relief-bed.html": [
      (m, d) => {
        tags(m, "stryker:Stryker-SEO-Tags/covid19, stryker:content-type/news, stryker:Stryker-SEO-Tags/coronavirus, stryker:Stryker-SEO-Tags/covid-19, stryker:content-type/news/product-bulletins, stryker:content-type/corporatenews, stryker:content-type/news/covid-19");
        const place = find(m, "h5", "Kalamazoo, MI, USA");
        if (place) {
          const p = d.createElement("p");
          const b = d.createElement("strong");
          b.append(...place.childNodes);
          p.append(b);
          place.replaceWith(p);
        }
        const h1 = m.querySelector("h1");
        if (h1 && !h1.querySelector("strong")) boldAll(m, d, h1);
        style(m, d, h1, null);
        retag(m, d, find(m, "h4", "Company aims to manufacture"), "h3");
        ["About Stryker", "Media contact"].forEach((label) => joinLabel(m, d, label));
        breakBefore(m, d, find(m, "p", "About Stryker"), "separator");
        breakBefore(m, d, find(m, "p", "Media contact"), null);
      }
    ],
    // stryker-completes-acquisition-of-wright-medical
    "https://www.stryker.com/us/en/about/news/2020/stryker-completes-acquisition-of-wright-medical.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews");
      }
    ],
    // stryker-joins-leading-executives-and-employers-in-forming-oneten
    "https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/diversity-equity-inclusion");
        const sub = find(m, "p", "OneTen will create one million jobs");
        style(m, d, sub, null);
        subtitle(m, d, sub);
      }
    ],
    // urgent-11-vulnerabilities---wind-river-vxworks-
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html": [
      (m, d) => {
        m.querySelectorAll('a[href="https://www.us-cert.gov/ics/advisories/icsa-19-211-01"]').forEach((a) => {
          const u = a.querySelector("u") || a;
          if (txt(u) === "https://www.us-cert.gov/ics/advisories/icsa-19-211-01") u.textContent = u.textContent.toUpperCase();
        });
      }
    ],
    // microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html": [
      (m, d) => {
        newTab2(m, ["https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708", "https://support.microsoft.com/en-us/help/4500705/customer-guidance-for-cve-2019-0708"]);
      }
    ],
    // ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html": [
      (m, d) => {
        newTab2(m, ["https://us-cert.cisa.gov/ics/advisories/icsa-20-168-01"]);
      }
    ],
    // -sweyntooth--ble-vulnerabilities--icsa--20-063-01-
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html": [
      (m, d) => {
        newTab2(m, ["https://us-cert.cisa.gov/ics/alerts/ics-alert-20-063-01"]);
      }
    ],
    // vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html": [
      (m, d) => {
        boldPerLine([...m.querySelectorAll("p > strong")].find((s) => txt(s).startsWith("CVE-2022-46898 Arbitrary File Upload")), d);
        newTab2(m, ["https://support.vocera.com/s/contactsupport", ...["46898", "46899", "46900", "46901", "46902"].map((n) => `https://cve.report/CVE-2022-${n}`)]);
      }
    ]
  }, Object.fromEntries(["april", "may", "december", "january", "february", "march", "june", "july", "november"].map((p) => [jr45(p), JR45_TITLE]))), {
    [jr45("october")]: [
      ...JR45_TITLE,
      (main) => blocks(main, /^columns \(gray-2, headline-serif-copy\)$/).forEach((t) => setVariants2(t, ["gray-2", "headline-copy", "serif"]))
    ],
    [page("about/corporate-responsibility/employee-benefits-and-resources")]: [
      (main) => setTheme(main, "xlarge-copy, serif-copy")
    ],
    [page("nse/products/heavy-duty-attachments/cutting-accessories")]: [
      (main) => setTheme(main, "large-headlines, xlarge-copy, serif-copy")
    ],
    [page("nse/products/mis-attachments/accessories")]: [
      (main) => replaceStyle(main, "tabbed", "tabbed, light-gray-titles")
    ],
    [page("nse/products/mis-attachments/cutting-accessories")]: [
      (main) => blocks(main, /^columns \(columns 67 33, gray last, plain-bold\)$/).forEach((t) => setVariants2(t, ["columns 67 33", "product-details"])),
      (main) => blocks(main, /^columns \(stack\)$/).forEach((t) => addVariants(t, "product-names"))
    ],
    [page("training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/resources/colorectal-surgery")]: [
      (main) => blocks(main, /^columns \(product-names, xlarge-copy\)$/).forEach((t) => setVariants2(t, ["xlarge-copy"]))
    ],
    [page("training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/resources/plastic-surgery")]: [
      // the video title on one heading ("The Ergonomics and Utility of SPY-PHI")
      (main) => withText(main, "h3", "The Ergonomics and Utility").forEach((h) => {
        const next = h.nextElementSibling;
        if ((next == null ? void 0 : next.tagName) !== "H3" || norm2(next.textContent) !== "of SPY-PHI") return;
        h.querySelector("strong").textContent = "The Ergonomics and Utility of SPY-PHI";
        next.remove();
      })
    ],
    [page("training-and-education/medical-and-surgical-equipment--/neurosurgical/medical-education/events")]: [
      (main) => blocks(main, /^columns$/).forEach((t) => addVariants(t, "event-cards"))
    ],
    [page("training-and-education/orthopaedics/joint-replacement/OR_Staff")]: [
      (main) => withText(main, "h5", "Want more Mako educational information?").forEach((h) => boldHeading(rename3(h, "h3"))),
      (main) => setTheme(main, "large-headlines, xlarge-copy, or-staff")
    ]
  }), Object.fromEntries(["accelerate", "assist", "assure"].map((p) => [
    page(`spine/products/bacs-balance-acs/index/${p}`),
    [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => setTheme(main, "bacs")
    ]
  ]))), {
    [page("training-and-education/orthopaedics/spine/spine-medical-education/on-demand-webinars")]: [
      (main) => named(main, "local nav corp (border)").forEach((t) => setVariants2(t, ["overlay"])),
      (main) => named(main, "marketo form").forEach((t) => setVariants2(t, ["two-thirds"]))
    ],
    [page("training-and-education/orthopaedics/trauma-extremities/teach/TEACH-Landing-Page/TEACH-Thank-You")]: [
      (main) => named(main, "columns (columns 50 50)").forEach((t) => addVariants(t, "page-title")),
      (main) => replaceStyle(main, "separator, image-link, center", "image-link, center")
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/skill-connect")]: [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => named(main, "columns (columns 50 50, large-copy)").forEach((t) => addVariants(t, "lowered-text")),
      (main) => setTheme(main, "large-copy, skill")
    ],
    [page("training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities")]: [
      // the hero section without a style, and no spacer section after it
      (main) => metaWithStyle(main, "white-text").forEach((t) => t.remove()),
      (main) => metaWithStyle(main, "spacer").slice(0, 1).forEach(removeEmptySection),
      (main) => named(main, "columns (stack)").forEach((t) => addVariants(t, "course-boxes")),
      (main) => setTheme(main, "large-headlines, te-vlc")
    ],
    [page("about/corporate-responsibility/giving-back")]: [
      // the intro: a paragraph, the Bold Heading 3 "Stryker’s global support", a paragraph
      (main, doc) => [...main.querySelectorAll("p")].filter((el) => [...el.querySelectorAll(":scope > strong")].some((b) => norm2(b.textContent) === "Stryker\u2019s global support")).forEach((para) => {
        const bold = [...para.querySelectorAll(":scope > strong")].find((b) => norm2(b.textContent) === "Stryker\u2019s global support");
        const before = doc.createElement("p");
        const after = doc.createElement("p");
        const kids = [...para.childNodes];
        const at = kids.indexOf(bold);
        before.append(...kids.slice(0, at));
        after.append(...kids.slice(at + 1));
        [before, after].forEach((el) => {
          el.querySelectorAll(":scope > br").forEach((br) => br.remove());
          el.normalize();
          el.childNodes.forEach((n) => {
            if (n.nodeType === 3) n.textContent = n.textContent.trim();
          });
        });
        const h3 = doc.createElement("h3");
        h3.append(bold);
        para.replaceWith(before, h3, after);
      })
    ],
    [page("surgical-technologies/services/instruments/contact-information")]: [
      (main) => posterSize(main, "AdobeStock_275515599-AVS", 1464, 824),
      (main) => named(main, "columns (blue all)").forEach((t) => {
        setVariants2(t, ["blue-all", "contact-boxes"]);
        t.querySelectorAll("td > p").forEach((para) => {
          if (/Opt\. 2 Then Opt\. [23]\s*\S+@stryker\.com$/.test(norm2(para.textContent))) splitLastLine(para);
        });
      })
    ],
    [page("surgical-technologies/services/instruments/new-accounts")]: [
      (main) => posterSize(main, "AdobeStock_313522943-AVS", 1464, 824),
      // the headline box: the title, then its line as a paragraph (plain)
      (main) => [...main.querySelectorAll("h3")].filter((h) => norm2(h.textContent).startsWith("New Accounts To Request")).forEach((h) => {
        const kids = [...h.childNodes];
        const br = h.querySelector(":scope > br");
        const line = kids.slice(kids.indexOf(br) + 1).find((n) => norm2(n.textContent));
        if ((line == null ? void 0 : line.nodeName) === "EM") line.replaceWith(...line.childNodes);
        splitFirstLine(h, "h3");
      }),
      (main) => replaceStyle(main, "headline-box, blue", "headline-box, blue, gold-titles")
    ],
    [page("surgical-technologies/services/instruments/tech-support")]: [
      (main) => posterSize(main, "AdobeStock_280821945-AVS", 1464, 824),
      (main) => named(main, "columns (columns 67 33, blue all, headline-copy)").forEach((t) => {
        var _a, _b;
        setVariants2(t, ["columns 67 33", "blue-all", "contact-boxes"]);
        const cells = t.querySelectorAll("tr:nth-child(2) > td");
        const lead = (_a = cells[0]) == null ? void 0 : _a.querySelector(":scope > p");
        if (lead) splitFirstLine(lead, "h2", unItalic);
        (_b = cells[1]) == null ? void 0 : _b.querySelectorAll(":scope > p").forEach((para) => {
          if (/Opt\. 2 Then Opt\. 3\s*\S+@stryker\.com$/.test(norm2(para.textContent))) splitLastLine(para);
        });
      }),
      (main) => withText(main, "h2", "Products").forEach((h) => {
        const em = h.querySelector(":scope > em");
        if (em) rename3(em, "u");
      })
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/skill-assist-max")]: [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => named(main, "panel (gold)").forEach((t) => addVariants(t, "spaced")),
      (main) => named(main, "accordion (large-copy)").forEach((t) => addVariants(t, "blue-titles")),
      (main) => setTheme(main, "large-copy, skill")
    ],
    [page("training-and-education/orthopaedics/spine/spine-medical-education/events")]: [
      (main) => named(main, "local nav corp (border)").forEach((t) => setVariants2(t, ["overlay"])),
      // the MedEd banner title without the source's blank lines and "\" lines
      (main) => [...main.querySelectorAll("h2")].filter((h) => norm2(h.textContent) === "\\ MedEd Events").forEach((h) => {
        h.querySelectorAll(":scope > br").forEach((br) => br.remove());
        [...h.querySelectorAll(":scope > strong")].filter((b) => norm2(b.textContent) === "\\").forEach((b) => b.remove());
        h.normalize();
        [...h.childNodes].filter((n) => n.nodeType === 3 && !norm2(n.textContent)).forEach((n) => {
          if (n === h.firstChild || n === h.lastChild) n.remove();
        });
        const next = h.nextElementSibling;
        if ((next == null ? void 0 : next.tagName) === "P" && norm2(next.textContent) === "\\") next.remove();
      }),
      (main) => setTheme(main, "spine-meded")
    ],
    [page("training-and-education/orthopaedics/spine/spine-medical-education/contact")]: [
      (main) => named(main, "local nav corp (border)").forEach((t) => setVariants2(t, ["overlay"])),
      (main) => named(main, "marketo form").forEach((t) => setVariants2(t, ["with-aside"])),
      (main) => [...main.querySelectorAll(":scope > p")].filter((el) => norm2(el.textContent).startsWith("Questions? Contact")).forEach((el) => addSectionStyle(el, "p-2")),
      (main) => setTheme(main, "xlarge-copy, serif-copy, spine-meded")
    ],
    [page("training-and-education/orthopaedics/joint-replacement/Medical_Education_Landing_Page/Mako_Refreshers_Page")]: [
      // the title, then its text as a paragraph (plain)
      (main) => [...main.querySelectorAll("h1")].filter((h) => norm2(h.textContent).startsWith("Join us for one")).forEach((h) => splitFirstLine(h, "h1", (n) => n)),
      (main) => [...main.querySelectorAll("p")].filter((el) => norm2(el.textContent).startsWith("Each virtual course")).forEach((el) => [...el.querySelectorAll(":scope > em")].forEach((em) => em.replaceWith(...em.childNodes))),
      (main) => named(main, "columns (dark lead, large-titles, large-subtitles, large-copy)").forEach((t) => setVariants2(t, ["dark-lead", "course-cards"])),
      (main) => [...main.querySelectorAll("p")].filter((el) => norm2(el.textContent) === "Together with our customers, we are driven to make healthcare better.").forEach((el) => {
        const h3 = rename3(el, "h3");
        const em = h3.ownerDocument.createElement("em");
        em.textContent = norm2(h3.textContent);
        h3.replaceChildren(em);
      }),
      (main) => setTheme(main, "large-headlines, mako-refreshers")
    ],
    [page("nse/products/heavy-duty-attachments/accessories")]: [
      (main) => named(main, "columns (columns 67 33, left border bottom)").forEach((t) => {
        var _a;
        addVariants(t, "product-intro");
        const first = t.querySelector("tr:nth-child(2) > td > p");
        if (first && norm2(first.textContent) === norm2((_a = first.querySelector(":scope > strong")) == null ? void 0 : _a.textContent)) rename3(first, "h2");
      })
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/training-centers")]: [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => [...main.querySelectorAll(":scope > h2")].filter((h) => norm2(h.textContent) === "Advancing your procedural skills").forEach((h) => sectionBefore(h, "spacer, large")),
      (main) => named(main, "columns (columns 50 50, large-copy)").forEach((t) => addVariants(t, "lowered-text-m")),
      (main) => replaceStyle(main, "center", "center, p-1-5", 0),
      (main) => withText(main, "h4", "Salt Lake City, UT").filter((h) => h.parentElement === main).forEach((h) => sectionBefore(h, "spacer")),
      (main) => setTheme(main, "large-headlines, large-copy, skill")
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/centers-of-excellence")]: [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => named(main, "video").slice(0, 1).forEach((t) => sectionBefore(t, "spacer, large")),
      (main) => posterSize(main, "SKILL%20COE_V3-1-AVS", 1380, 776),
      (main) => named(main, "columns (columns 50 50, large-copy)").forEach((t) => addVariants(t, "lowered-text")),
      (main) => named(main, "panel (gold)").filter((t) => norm2(t.textContent).includes("These days, young neurointerventionalists")).forEach((t) => addVariants(t, "quote")),
      (main) => withText(main, "p", "Contact your local representative to find out more!").forEach((el) => rename3(el, "h2")),
      (main) => setTheme(main, "large-copy, skill")
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/neuroelite-fellows-program")]: [
      (main) => heroes2(main).forEach((t) => addVariants(t, "fixed-title")),
      (main) => replaceStyle(main, "separator", "separator, h2-1-25", 0),
      (main) => named(main, "panel (gold)").forEach((t) => addVariants(t, "spaced")),
      (main) => named(main, "columns (columns 50 50, large-copy)").forEach((t) => addVariants(t, "lowered-text")),
      // the gold-lead row a section of its own
      (main, doc) => named(main, "columns (columns 50 50, gold lead, large-copy)").forEach((t) => {
        var _a;
        setVariants2(t, ["columns 50 50", "gold-lead-copy", "lowered-text-m"]);
        if (((_a = t.previousElementSibling) == null ? void 0 : _a.tagName) === "TABLE") t.before(doc.createElement("hr"));
      }),
      // "SKILL MedEd curriculum" and its image in sections of their own
      (main, doc) => withText(main, "h2", "SKILL MedEd curriculum").filter((h) => h.parentElement === main).forEach((h) => {
        var _a;
        if (((_a = h.nextElementSibling) == null ? void 0 : _a.tagName) === "P") h.after(doc.createElement("hr"));
      }),
      (main) => setTheme(main, "large-headlines, large-copy, skill")
    ],
    [page("training-and-education/neurotechnology/neurovascular/skill/e-lab")]: [
      (main) => heroes2(main).forEach((t) => {
        setVariants2(t, ["banner", "third-text", "fixed-xlarge-title"]);
        t.querySelectorAll("h2").forEach((h) => {
          if (norm2(h.textContent) !== "e-Lab") return;
          const title = rename3(h, "h1");
          title.querySelectorAll("br").forEach((br) => br.remove());
          dropBlankText(title);
        });
      }),
      (main) => [...main.querySelectorAll(":scope > h1")].filter((h) => norm2(h.textContent) === "A 24/7 online training platform").forEach((h) => rename3(h, "h2")),
      (main) => named(main, "columns (columns 50 50, large-copy)").forEach((t) => addVariants(t, "lowered-text-s")),
      (main, doc) => named(main, "columns (columns 50 50, gold lead, large-copy)").forEach((t) => {
        var _a;
        if (((_a = t.previousElementSibling) == null ? void 0 : _a.tagName) === "TABLE") t.before(doc.createElement("hr"));
      }),
      (main) => withText(main, "h3", "The SKILL e-Lab offers what you need").forEach((h) => {
        const b = h.querySelector(":scope > strong");
        if (b && !b.querySelector("em")) {
          const em = h.ownerDocument.createElement("em");
          em.append(...b.childNodes);
          b.append(em);
        }
      }),
      (main) => setTheme(main, "large-headlines, large-copy, skill")
    ],
    [page("training-and-education/orthopaedics/foot-and-ankle/patient-marketing-toolkit/bunion")]: TOOLKIT("Bunion"),
    [page("training-and-education/orthopaedics/foot-and-ankle/patient-marketing-toolkit/total-ankle-replacement")]: TOOLKIT("Total Ankle Replacement"),
    [page("training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/ispies")]: [
      // the title row: the Heading 1, its date a plain Heading 2 (Columns `large-headline`, `title`)
      (main) => named(main, "columns (columns 50 50)").forEach((t) => {
        setVariants2(t, ["columns 50 50", "large-headline", "title"]);
        t.querySelectorAll("h1").forEach((h) => {
          splitFirstLine(h, "h1");
          const date = t.querySelector("h1 + p");
          if (!date) return;
          const h2 = rename3(date, "h2");
          h2.querySelectorAll("em").forEach((em) => em.replaceWith(...em.childNodes));
        });
      }),
      // the "Where: … | When: …" lines as Heading 2 headline boxes
      (main) => [...main.querySelectorAll(":scope > p")].filter((el) => norm2(el.textContent).startsWith("Where: IRCAD")).forEach((el) => addSectionStyle(rename3(el, "h2"), "headline-box")),
      (main) => setTheme(main, "large-headlines, xxlarge-copy, serif-copy")
    ],
    [page("training-and-education/orthopaedics/spine/spine-medical-education/resources")]: [
      (main) => named(main, "local nav corp (border)").forEach((t) => setVariants2(t, [])),
      (main) => named(main, "columns (columns-67-33, gold-first, large-serif-copy)").forEach((t, i) => {
        setVariants2(t, ["columns-67-33", "gold-headline-first", "large-serif-copy"]);
        if (i === 0) addSectionStyle(t, "spaced-items");
      }),
      (main) => replaceStyle(main, "spacer", "spacer, large", 0),
      (main) => [...main.querySelectorAll("p")].filter((el) => norm2(el.textContent).startsWith("The goal of this program")).forEach((el) => {
        const b = el.querySelector(":scope > strong");
        if (!b || b.querySelector("em")) return;
        const em = el.ownerDocument.createElement("em");
        em.append(...b.childNodes);
        b.append(em);
      }),
      // the two S2S list titles: Heading 2 lines, the plain words Italic (Columns `large-titles`)
      (main) => named(main, "columns (columns-50-50, large-serif-copy)").forEach((t) => {
        addVariants(t, "large-titles");
        [...t.querySelectorAll("p")].filter((el) => /^(Highlights of each interactive|Routine) S2S/.test(norm2(el.textContent))).forEach((el) => {
          const h2 = rename3(el, "h2");
          [...h2.childNodes].filter((n) => n.nodeType === 3 && norm2(n.textContent)).forEach((n) => {
            n.textContent = norm2(n.textContent);
            wrap(n, "em");
          });
        });
      }),
      (main) => setTheme(main, "large-headlines, spine-meded")
    ],
    [page("about/corporate-responsibility/environmental-programs")]: [
      (main) => named(main, "columns (columns 50 50, boxed all, serif)").forEach((t) => setVariants2(t, ["columns 50 50", "boxed-all", "goal-cards"])),
      (main) => blocks(main, /^columns \(stack, image border(, large-copy)?\)$/).forEach((t) => setVariants2(t, ["image-border", "large-copy"])),
      // the section titles teal (`teal-titles`)
      (main) => [...main.querySelectorAll(":scope > h3")].filter((h) => /^(Stryker’s locations using renewable energy|Design for sustainability)/.test(norm2(h.textContent))).forEach((h) => addSectionStyle(h, "teal-titles")),
      // the five procurement items: one Columns row (`product-names`, `large-copy`)
      (main, doc) => {
        const first = [...main.querySelectorAll(":scope > p")].find((el) => el.querySelector('a[href*="/hydro-V2"]'));
        if (!first) return;
        const cells = [];
        let node = first;
        while (node && node.tagName === "P" && cells.length < 5) {
          const image = node;
          const label = node.nextElementSibling;
          node = label == null ? void 0 : label.nextElementSibling;
          cells.push([image, label]);
        }
        const table = blockTable(doc, "Columns (product-names, large-copy)", [...cells, []]);
        (node || first).before(table);
      },
      // one `spacer, large` section before "Design for sustainability" and before "Employee
      // engagement on sustainability"
      (main) => [...main.querySelectorAll(":scope > h3")].filter((h) => /^(Design for sustainability|Employee engagement on sustainability)/.test(norm2(h.textContent))).forEach((h) => {
        const [nearest, next] = spacerSectionsBefore(h);
        if (!nearest || !next) return;
        if (norm2(h.textContent).startsWith("Design")) {
          nearest.querySelector("tr:nth-child(2) > td:last-child").textContent = "spacer, large";
          removeEmptySection(next);
        } else {
          next.querySelector("tr:nth-child(2) > td:last-child").textContent = "spacer, large";
          removeEmptySection(nearest);
        }
      }),
      // "Doing more with less…": a Bold Heading 4 subtitle above the rule line
      (main) => [...main.querySelectorAll(":scope > p")].filter((el) => norm2(el.textContent).startsWith("Doing more with less through additive manufacturing")).forEach((el) => {
        const b = el.querySelector(":scope > strong");
        const br = el.querySelector(":scope > br");
        if (!b || !br) return;
        const h4 = el.ownerDocument.createElement("h4");
        h4.append(b);
        dropBlankText(el);
        br.remove();
        el.before(h4);
      })
    ],
    [page("training-and-education/orthopaedics/joint-replacement/Mako_surgeon_campaign")]: [
      // the hero: the two title lines, then the text as a paragraph (plain)
      (main, doc) => [...main.querySelectorAll("h1")].filter((h) => norm2(h.textContent).startsWith("Know more. Cut less.")).forEach((h) => {
        var _a;
        const brs = [...h.querySelectorAll(":scope > br")];
        const second = brs.find((br) => {
          var _a2;
          return ((_a2 = br.nextSibling) == null ? void 0 : _a2.nodeName) === "BR";
        });
        if (!second) return;
        const para = doc.createElement("p");
        const kids = [...h.childNodes];
        const rest = kids.slice(kids.indexOf(second) + 2);
        second.nextSibling.remove();
        second.remove();
        rest.forEach((n) => {
          if (n.nodeName === "EM") para.append(...n.childNodes);
          else if (norm2(n.textContent)) para.append(n);
          else n.remove();
        });
        para.normalize();
        para.childNodes.forEach((n) => {
          if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, " ");
        });
        trimLead(para);
        if (((_a = h.lastChild) == null ? void 0 : _a.nodeType) === 3 && !norm2(h.lastChild.textContent)) h.lastChild.remove();
        h.after(para);
      }),
      (main) => posterSize(main, "JR_2021_Dig_Media_campaign_video_banner-1", 1380, 776),
      (main) => ["MAKTKA_VA_39-1", "MKOTHA_VA_20-1", "MAKPKA_VA_32-1"].forEach((v) => posterSize(main, v, 440, 248)),
      // the section titles Heading 3 (Bold), the training academy line a Heading 2
      (main) => ["Know more", "Cut less", "See Mako in action", "Turn data into insights and insights into action"].forEach((text4) => withText(main, "h4", text4).forEach((h) => boldHeading(rename3(h, "h3")))),
      (main) => [...main.querySelectorAll("h4")].filter((h) => norm2(h.textContent).startsWith("For more procedural videos")).forEach((h) => rename3(h, "h2")),
      // the key clinical studies accordions (`large-titles`): a Total Knee / Total Hip panel's
      // title is one Heading 2 (the gold product, Bold "key clinical studies", the topic on its own
      // line; Partial Knee keeps its two paragraphs), the study labels Heading 4
      (main, doc) => named(main, "accordion (large-copy)").forEach((t) => {
        addVariants(t, "large-titles");
        [...t.querySelectorAll("p")].filter((el) => {
          var _a;
          return /^Mako Total (Knee|Hip) key clinical studies$/.test(norm2(el.textContent)) && ((_a = el.nextElementSibling) == null ? void 0 : _a.tagName) === "P" && el.nextElementSibling.querySelector(":scope > strong") && norm2(el.nextElementSibling.textContent) === norm2(el.nextElementSibling.querySelector(":scope > strong").textContent);
        }).forEach((el) => {
          const topic = el.nextElementSibling;
          const h2 = doc.createElement("h2");
          h2.append(...el.childNodes, doc.createElement("br"), topic.querySelector(":scope > strong"));
          topic.remove();
          el.replaceWith(h2);
        });
        t.querySelectorAll("h5").forEach((h) => rename3(h, "h4"));
      }),
      (main) => setTheme(main, "large-headlines, xlarge-copy, mako-campaign")
    ]
  }), Object.fromEntries([
    "august",
    "september",
    "season-2/december",
    "season-2/february",
    "season-2/november",
    "season-2/october",
    "season-2/september",
    "season-3/april",
    "season-3/february",
    "season-3/january",
    "season-3/july",
    "season-3/june",
    "season-3/march"
  ].map((p) => [jr45(p), JR45_BOX])));
  var FRAGMENT_CORRECTIONS = {
    // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
  };
  var pageKey = (u) => {
    try {
      const { origin, pathname } = new URL(u);
      return `${origin}${pathname.replace(/\/$/, "")}`;
    } catch (e) {
      return u;
    }
  };
  var fragmentKey = (p) => String(p).replace(/\\/g, "/").replace(/\.plain\.html$/, "").split("/").reduce((parts, part) => {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
    return parts;
  }, []).join("/");
  function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
    const { document, params } = payload || {};
    if (!document || !params) return;
    if (element === document.body) {
      if (!params.originalURL) return;
      (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
      return;
    }
    const fragment = (params.fragments || []).find((f) => f.element === element);
    if (!fragment || typeof fragment.path !== "string") return;
    (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
  }
  function transform5(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
  }

  // tools/importer/import-long-page-detail-corp.js
  var PAGE_TEMPLATE = {
    name: "long-page-detail-corp",
    description: "www.stryker.com long-page-detail pages (#469): H1 title; Virtual Learning Center video section (underlined H2 title, Video block, H3 description, Cards Corp (resources) downloads) or a shared Experience Fragment as a Fragment block; video detail pages (Video + caption); text articles; medical-education and landing pages (source column rows as Columns, local navigation as Local Nav Corp, single-slide carousel as Hero Corp (the slide), .pDiv / full-width image hero as Hero Corp (banner), their layout as Section Metadata properties, Marketo Form with the contact-aside Fragment); small print and document code as a `disclaimer` section; `published` with `last-updated: false` (the corp Last Updated line is not shown for now).",
    urls: [
      "https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--brent-morris.html",
      "https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/emergency-care/emergency-care/video/lifepak-cr2-aed.html",
      "https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn/smoke-evacuation--a-review-of-the-standards131.html"
    ],
    blocks: [
      { name: "video", instances: [".c-standalone-video"] },
      { name: "cards-corp-resources", instances: [".c-resourcesanddownload"] },
      { name: "cards-corp-teaser", instances: [".c-customizeable"] }
    ]
  };
  var parsers = {
    video: parse,
    "cards-corp-resources": parse2,
    "cards-corp-teaser": parse3
  };
  var correctionTransformers = [transform5];
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4,
    ...correctionTransformers
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
      markBlankBeforeButtons(document);
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
      const semanticTheme = main.getAttribute("data-semantic-theme");
      main.removeAttribute("data-semantic-theme");
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      meta.template = PAGE_TEMPLATE.name;
      if (!meta.Description) {
        const wordCount = (t) => (t.match(/[A-Za-z0-9]+/g) || []).length;
        const linkOnly = (p) => {
          const a = p.querySelector("a");
          return !!a && p.textContent.trim() === a.textContent.trim();
        };
        const fileName = (p) => linkOnly(p) && /^\S+$/.test(p.textContent.trim()) && !/^https?:/i.test(p.textContent.trim());
        const long = [...main.querySelectorAll("p")].filter((p) => wordCount(p.textContent) >= 10);
        if (long[0] && fileName(long[0])) {
          const first = long.find((p) => !linkOnly(p));
          if (first) meta.Description = first.textContent.replace(/\s+/g, " ").trim();
        }
      }
      if (semanticTheme) meta.theme = semanticTheme;
      if (hcp) meta["hcp-banner"] = "true";
      if (published) {
        meta.published = published;
        meta["last-updated"] = "false";
      }
      const unresolvedXfs = main.getAttribute("data-xf-unresolved");
      main.removeAttribute("data-xf-unresolved");
      const semanticWarnings = main.getAttribute("data-semantic-warn");
      main.removeAttribute("data-semantic-warn");
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: __spreadValues(__spreadValues({
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }, unresolvedXfs ? { "xf-unresolved": unresolvedXfs } : {}), semanticWarnings ? { "semantic-warnings": semanticWarnings } : {})
      }];
    }
  };
  return __toCommonJS(import_long_page_detail_corp_exports);
})();
