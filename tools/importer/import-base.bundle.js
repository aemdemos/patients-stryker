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

  // tools/importer/import-base.js
  var import_base_exports = {};
  __export(import_base_exports, {
    default: () => import_base_default
  });

  // tools/importer/page-tags.js
  var page_tags_default = {
    "/us/en/about/patents/Spine-patents": [
      "spine"
    ],
    "/us/en/sage/disclosure-and-safety-information": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/videos/sage-mp-mats-2-demo": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/guidelines-practice-pip-fireside-chat": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/hap-human-financial-cost": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/mobility-matters-impact-safe-patient-mobilization": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/nv-hap-hidden-plain-sight": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/risk-of-pip-procedural-operational-areas": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/safe-patient-handling-mobility-webinar": [
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/sepsis-hospital-acquired-pneumonia": [
      "stryker:business-unit/ems",
      "stryker:business-unit/SAGE"
    ],
    "/us/en/sage/webinars/sepsis-non-vent-pneumonia-risk-prevention-recognition": [
      "stryker:business-unit/SAGE"
    ]
  };

  // tools/importer/base/shared.js
  var pathOf = (url) => new URL(url, "https://www.stryker.com").pathname.replace(/\/$/, "").replace(/\.html?$/, "");
  function groupOf(url) {
    const path = pathOf(url);
    if (/^\/us\/en\/about\/(patents|trademarks)(\/|$)/.test(path)) return "patents";
    if (/^\/us\/en\/(sage\/webinars|emergency-care\/webinars|sage\/videos\/sage-mp-mats-2-demo)/.test(path)) return "webinar";
    if (/^\/us\/en\/about\/(our-management\/leaders|our-board-of-directors\/directors)/.test(path)) return "people";
    if (path.startsWith("/us/en/interventional-spine/footnotes")) return "footnotes";
    return "legal";
  }
  var PAGE_THEME = { legal: "legal", footnotes: "" };
  function applyBaseMeta(meta, url, group) {
    meta.template = "base";
    const path = pathOf(url);
    const theme = group === "webinar" && path === "/us/en/sage/videos/sage-mp-mats-2-demo" ? "webinar" : PAGE_THEME[group];
    if (theme) meta.theme = theme;
    const tags = page_tags_default[path];
    if (tags?.length) meta.tags = tags.join(", ");
  }
  var TAG_SECTION_STYLES = {
    "body-font": "bold-body",
    "headline-2": "headline-2vw",
    "headline-2-5": "headline-2-5vw",
    serif: "serif"
  };
  var BRACKET = /\[\[([a-z0-9,-]+)\]|\]/g;
  function sectionIndex(main, node) {
    let top = node;
    while (top.parentElement && top.parentElement !== main) top = top.parentElement;
    let count = 0;
    for (let n = top.previousElementSibling; n; n = n.previousElementSibling) {
      if (n.tagName === "HR") count += 1;
    }
    return count;
  }
  function bracketTokens(parent) {
    const tokens = [];
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType !== 3) {
        tokens.push({ node });
        return;
      }
      const value = node.nodeValue;
      let last = 0;
      [...value.matchAll(BRACKET)].forEach((m) => {
        if (m.index > last) tokens.push({ text: value.slice(last, m.index) });
        tokens.push(m[1] ? { open: m[1].split(",") } : { close: true });
        last = m.index + m[0].length;
      });
      if (last < value.length) tokens.push({ text: value.slice(last) });
    });
    return tokens;
  }
  function stripBracketTokens(parent, document) {
    const tokens = bracketTokens(parent);
    const removed = [];
    const build = (from, closes) => {
      const nodes2 = [];
      let i = from;
      while (i < tokens.length) {
        const t = tokens[i];
        if (t.open) {
          const inner = build(i + 1, true);
          removed.push(...t.open);
          i = inner.next;
          let content = inner.nodes;
          if (t.open.includes("color-gold")) {
            const tail = [];
            const isBlank = (n) => n.nodeName === "BR" || n.nodeType === 3 && !n.nodeValue.trim();
            while (content.length && isBlank(content[content.length - 1])) {
              tail.unshift(content.pop());
            }
            if (content.some((n) => n.nodeType === 3 && n.nodeValue.trim())) {
              const strong = document.createElement("strong");
              strong.append(...content);
              content = [strong];
            }
            const em = document.createElement("em");
            em.append(...content);
            content = [em, ...tail];
          }
          nodes2.push(...content);
        } else if (t.close) {
          if (closes) return { nodes: nodes2, next: i + 1 };
          nodes2.push(document.createTextNode("]"));
          i += 1;
        } else {
          nodes2.push(t.node || document.createTextNode(t.text));
          i += 1;
        }
      }
      return { nodes: nodes2, next: i };
    };
    const { nodes } = build(0, false);
    parent.replaceChildren(...nodes);
    return removed;
  }
  function stripBrackets(main, document) {
    const styles = /* @__PURE__ */ new Map();
    const parents = [...main.querySelectorAll("*")].filter((el3) => [...el3.childNodes].some((n) => n.nodeType === 3 && /\[\[[a-z0-9,-]+\]/.test(n.nodeValue)));
    parents.forEach((parent) => {
      if (!parent.isConnected) return;
      const index = sectionIndex(main, parent);
      stripBracketTokens(parent, document).forEach((tag) => {
        const style = TAG_SECTION_STYLES[tag];
        if (!style) return;
        if (!styles.has(index)) styles.set(index, /* @__PURE__ */ new Set());
        styles.get(index).add(style);
      });
    });
    return styles;
  }
  function addVariant(table, variant) {
    const head = table.querySelector("th") || table.querySelector("tr > *");
    if (!head) return;
    const [, name, variants] = head.textContent.trim().match(/^([^(]*?)\s*(?:\((.*)\))?$/);
    const list = (variants || "").split(",").map((v) => v.trim()).filter(Boolean);
    if (!list.includes(variant)) list.push(variant);
    head.textContent = `${name} (${list.join(", ")})`;
  }
  function blockTables(main, name) {
    return [...main.querySelectorAll("table")].filter((t) => (t.querySelector("th") || t.querySelector("tr > *"))?.textContent.trim().startsWith(name));
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

  // tools/importer/transformers/long-page-detail-corp-article.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
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
    // data-btn-style / data-section-style: the section style a link / a paragraph asks for
    // (buildArticle adds it to its section)
    A: ["href", "data-btn-style"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"],
    P: ["data-section-style"],
    LI: ["data-section-style"]
  };
  function text(el3) {
    return (el3.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function rename(el3, tagName) {
    const doc = el3.ownerDocument;
    const next = doc.createElement(tagName);
    while (el3.firstChild) next.append(el3.firstChild);
    el3.replaceWith(next);
    return next;
  }
  function unwrap(el3) {
    el3.replaceWith(...el3.childNodes);
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
    const copy = candidates.filter((el3) => text(el3) && !el3.querySelector("p, li"));
    if (!copy.length) return null;
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers = (cls) => copy.every((el3) => {
      const spans = [...el3.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join("")) === squash(el3.textContent);
    });
    const size = SIZE_STYLES.find(([cls]) => covers(cls));
    const coversFont = (cls) => copy.every((el3) => {
      const spans = [...el3.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      const bold = [...el3.querySelectorAll(".futura-bold")].filter((span) => !span.closest(`.${cls}`) && !span.parentElement.closest(".futura-bold"));
      const covered = squash(spans.map((span) => span.textContent).join("")) + squash(bold.map((span) => span.textContent).join(""));
      return spans.length > 0 && covered.length === squash(el3.textContent).length;
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
    [...root.querySelectorAll("b")].forEach((b) => {
      if (b.closest(".futura-bold") || b.querySelector(".futura-bold") || b.parentElement.closest("b")) return;
      if (!text(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text(block) === text(b)) return;
      block.setAttribute("data-section-style", "body-font-bold");
    });
  }
  var GOLD = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i;
  function ownColour(el3) {
    const m = (el3.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? m[1].trim() : "";
  }
  function hasOtherColour(node) {
    if (node.nodeType !== 1) return false;
    const coloured = [node, ...node.querySelectorAll('[style*="color"]')].filter((el3) => ownColour(el3) && !GOLD.test(ownColour(el3)));
    return coloured.some((el3) => [...el3.childNodes].some((child) => child.nodeType === 3 ? child.textContent.trim() : !ownColour(child) && text(child)));
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
        if (span.parentElement.closest(`.${cls}`) || !text(span)) return;
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
  function markGold(nodes, root) {
    const run = [...nodes];
    const loose = (n) => n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim();
    while (run.length && loose(run[0])) run.shift();
    while (run.length && loose(run[run.length - 1])) run.pop();
    if (!run.length || !run.some((n) => n.textContent.trim())) return;
    const mark = root.ownerDocument.createElement("span");
    mark.className = "gold-text";
    run[0].before(mark);
    mark.append(...run);
  }
  function goldBoldItalic(root) {
    const doc = root.ownerDocument;
    const inside = (node, tag) => {
      for (let el3 = node.parentElement; el3 && el3 !== root; el3 = el3.parentElement) {
        if (el3.tagName === tag) return true;
      }
      return false;
    };
    root.querySelectorAll("span.gold-text").forEach((mark) => {
      const texts = [];
      const walker = doc.createTreeWalker(mark, 4);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (t.textContent.trim()) texts.push(t);
      }
      if (!texts.length || texts.every((t) => inside(t, "STRONG") && inside(t, "EM"))) return;
      const em = doc.createElement("em");
      em.append(...mark.childNodes);
      if (inside(mark, "STRONG")) {
        mark.append(em);
        return;
      }
      const strong = doc.createElement("strong");
      strong.append(em);
      mark.append(strong);
    });
  }
  function tagGoldText(root) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap2 = (nodes) => markGold(nodes, root);
    const wrapRun = (nodes) => {
      nodes.filter((n) => n.nodeType === 1).forEach((n) => tagged.add(n));
      wrap2(nodes);
    };
    root.querySelectorAll('[style*="color"]').forEach((el3) => {
      if (!GOLD.test(ownColour(el3)) || [...tagged].some((t) => t.contains(el3))) return;
      if (!hasOtherColour(el3)) {
        wrapRun([el3]);
        return;
      }
      let run = [];
      [...el3.childNodes].forEach((child) => {
        if (hasOtherColour(child)) {
          wrapRun(run);
          run = [];
        } else run.push(child);
      });
      wrapRun(run);
    });
  }
  function cleanRichText(root, { wholeParagraphs = false } = {}) {
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el3) => text(el3));
    const centred = blocks.length > 0 && blocks.every((el3) => /text-align:\s*center/i.test(el3.getAttribute("style") || ""));
    const size = copyStyles(root);
    const doc = root.ownerDocument;
    root.querySelectorAll('a:not([href]), a[href=""]').forEach(unwrap);
    const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== "BR" && !node.textContent.trim() && !node.querySelector("img, br");
    const trailingSpace = /[\s\u00a0]+$/;
    [...root.querySelectorAll('span.futura-bold, span[style*="color"], b, i, em, strong')].reverse().forEach((el3) => {
      let last = el3.lastChild;
      while (last && (last.nodeName === "BR" || emptyElement(last) || last.nodeType === 3 && !last.textContent.trim())) {
        if (emptyElement(last)) {
          if (/[\s\u00a0]/.test(last.textContent) && !(el3.nextSibling && /^[\s\u00a0]/.test(el3.nextSibling.textContent))) {
            el3.after(doc.createTextNode(" "));
          }
          last.remove();
        } else el3.after(last);
        last = el3.lastChild;
      }
      if (last && last.nodeType === 3 && trailingSpace.test(last.textContent)) {
        last.textContent = last.textContent.replace(trailingSpace, "");
        el3.after(doc.createTextNode(" "));
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
    const squashed = (el3) => el3.textContent.replace(/[\s\u00a0]+/g, "");
    root.querySelectorAll(".futura-bold a[href], a[href] .futura-bold").forEach((el3) => {
      const a = el3.closest("a[href]");
      const block = a.closest("p, li");
      if (standalone.has(a) || a.querySelector("u, img") || !block || !squashed(a) || squashed(block) !== squashed(a)) return;
      standalone.add(a);
      a.setAttribute("data-btn-style", "no-arrow");
      const u = doc.createElement("u");
      while (a.firstChild) u.append(a.firstChild);
      a.append(u);
    });
    root.querySelectorAll("span.futura-bold").forEach((el3) => rename(el3, "strong"));
    root.querySelectorAll("b").forEach((el3) => rename(el3, "strong"));
    root.querySelectorAll("i").forEach((el3) => rename(el3, "em"));
    goldBoldItalic(root);
    root.querySelectorAll("span, font").forEach(unwrap);
    root.querySelectorAll("strong strong, em em").forEach(unwrap);
    root.querySelectorAll("strong, em").forEach((el3) => {
      if (!el3.textContent.trim() && !el3.querySelector("img, br")) el3.remove();
    });
    root.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("href", newTabHref(a, absoluteAsset(a.getAttribute("href"))));
    });
    root.querySelectorAll("*").forEach((el3) => {
      const keep = KEEP_ATTRS[el3.tagName] || [];
      [...el3.attributes].forEach((attr) => {
        if (!keep.includes(attr.name)) el3.removeAttribute(attr.name);
      });
    });
    root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach((el3) => {
      while (el3.lastChild && (el3.lastChild.nodeName === "BR" || el3.lastChild.nodeType === 3 && !el3.lastChild.textContent.trim())) {
        el3.lastChild.remove();
      }
      if (!text(el3) && !el3.querySelector("img")) el3.remove();
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
      if (!text(h)) return false;
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
    ["H1", "fontsize-1-25em", "h1-1-25"],
    // a Heading 4 enlarged 2.5x that is the page title (Mako thank-you page; marked by
    // long-page-detail-corp-sections.js → titleFromHeading)
    ["H1", "fontsize-h4-2-5", "h4-2-5"]
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
    [...root.children].filter((el3) => el3.tagName === "P").forEach((p) => {
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
    const squash = (value) => value.replace(/[\s\u00a0]+/g, " ").trim();
    const leadText = squash(lead.map((node) => node.textContent).join(""));
    if (!leadText) return null;
    const box = doc.createElement("div");
    lead.forEach((node) => box.append(node.cloneNode(true)));
    const large = squash([...box.querySelectorAll(".fontsize-1-5em")].filter((span) => !span.parentElement.closest(".fontsize-1-5em")).map((span) => span.textContent).join(""));
    if (large !== leadText || !box.querySelector(".futura-bold, b")) return null;
    lead.forEach((node) => node.remove());
    while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
    if (!text(p)) p.remove();
    const h1 = doc.createElement("h1");
    h1.textContent = leadText;
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
    const elementStyles = new Map([...box.children].map((el3) => [el3, copyStyles(el3)]));
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
    const others = [...col.parentElement.children].filter((el3) => el3 !== col);
    if (others.some((el3) => text(el3) || el3.querySelector("img, video, iframe"))) return "";
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
        if (!text(title)) return;
        const h4 = doc.createElement("h4");
        h4.textContent = text(title);
        nodes.push(h4);
      });
    }
    return nodes;
  }
  function buttonNodes(component, doc) {
    return [...component.querySelectorAll("a[href]")].filter((a) => text(a)).map((source) => {
      const a = doc.createElement("a");
      a.setAttribute("href", newTabHref(source, absoluteAsset(source.getAttribute("href"))));
      if (source.matches(".action-link, li a")) {
        const u = doc.createElement("u");
        u.textContent = text(source);
        a.append(u);
        const strong2 = doc.createElement("strong");
        strong2.append(a);
        const p2 = doc.createElement("p");
        p2.append(strong2);
        return p2;
      }
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
  function centredLine(el3) {
    return /text-align:\s*center/.test(el3.getAttribute("style") || "") || !!el3.querySelector('[style*="text-align: center"], [style*="text-align:center"]');
  }
  function headlineTag(el3) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const depth = (span) => {
      let n = 0;
      if (span === el3) return n;
      for (let p = span.parentElement; p && p !== el3; p = p.parentElement) {
        if (/\bfontsize-/.test(p.className || "")) n += 1;
      }
      return n;
    };
    const size = [el3, ...el3.querySelectorAll('[class*="fontsize-"]')].map((span) => [(/\bfontsize-(\d+(?:-\d+)?)-?vw\b/.exec(span.className || "") || [])[1], squash(span.textContent).length, depth(span)]).filter(([n, length]) => n && length).sort((a, b) => b[1] - a[1] || b[2] - a[2]).map(([n]) => n)[0];
    const bold = [...el3.querySelectorAll(".futura-bold, b, strong")].filter((b) => !b.parentElement.closest(".futura-bold, b, strong")).map((b) => b.textContent).join("");
    const serif = squash(bold) !== squash(el3.textContent);
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
      const blocks = [...line.querySelectorAll(BLOCKS)].filter((block) => text(block) && !block.parentElement.closest(BLOCKS));
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
      const needsBreak = prev && !endsWithBreak(prev) && text(block);
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
        if (n.nodeType === 3 ? text(n) : n.matches("img, picture")) return null;
      }
      return null;
    });
    cleanRichText(box);
    let previous = null;
    let previousIndex = -1;
    return parts.map((part, i) => {
      if (!text(part)) return null;
      const p = doc.createElement("p");
      while (part.firstChild) p.append(part.firstChild);
      while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !text(p.firstChild))) {
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
    const lines = [...headline.querySelectorAll(".line")].filter((line) => text(line));
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
    [...h1.querySelectorAll("strong, em")].reverse().forEach((el3) => {
      let last = el3.lastChild;
      while (last && (last.nodeName === "BR" || last.nodeType === 3 && !last.textContent.trim())) {
        if (last.nodeName === "BR") el3.after(last);
        else last.remove();
        last = el3.lastChild;
      }
    });
    return h1;
  }
  function videoAside(video2) {
    const col = video2.closest('[class*="col-sm-8"], [class*="col-sm-6"]');
    const row = col && col.parentElement;
    const width = col && /\bcol-sm-6\b/.test(col.className) ? 6 : 4;
    const aside = row && [...row.children].find((el3) => el3 !== col && new RegExp(`\\bcol-sm-${width}\\b`).test(el3.className));
    const headline = aside && aside.querySelector(".c-largeheadline");
    return headline && text(headline) ? headline : null;
  }
  function headlineVideo(headline) {
    const col = headline.closest('[class*="col-sm-6"]');
    const row = col && col.parentElement;
    const videoCol = row && [...row.children].find((el3) => el3 !== col && /\bcol-sm-6\b/.test(el3.className));
    const video2 = videoCol && videoCol.querySelector(".c-standalone-video");
    return video2 && video2.querySelector("[data-asset-path], iframe[src]") ? video2 : null;
  }
  function videoTextAside(video2) {
    const col = video2.closest('[class*="col-sm-6"]');
    const row = col && col.parentElement;
    const aside = row && [...row.children].find((el3) => el3 !== col && /\bcol-sm-6\b/.test(el3.className));
    const rte = aside && aside.querySelector(".c-rich-text-editor");
    if (!rte || !text(rte) || aside.querySelector("img, video, iframe, .c-standalone-video")) return null;
    return rte;
  }
  function videoTextColumns(video2, rte, doc) {
    const link3 = videoLink(video2, doc);
    const { nodes } = richTextNodes(rte, doc);
    if (!link3 || !nodes.length) return null;
    const media = doc.createElement("p");
    media.append(link3);
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
      if (/^[“”"‘’']+$/.test(text(strong)) && strong.querySelector(".gold-text")) {
        const em = doc.createElement("em");
        em.append(strong);
        span.replaceWith(em);
      } else span.replaceWith(strong);
    });
    goldBoldItalic(box);
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
    [...box.querySelectorAll("em, strong")].reverse().forEach((el3) => {
      while (el3.lastChild && (el3.lastChild.nodeName === "BR" || el3.lastChild.nodeType === 3 && !el3.lastChild.textContent.trim())) {
        el3.after(el3.lastChild);
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
    out.forEach((p) => p.querySelectorAll("*").forEach((el3) => {
      [...el3.attributes].forEach((attr) => el3.removeAttribute(attr.name));
    }));
    return out;
  }
  function videoHeadlineColumns(video2, headline, doc, asideQuotes = [], ctas = [], asideCtas = [], mirrored = false) {
    const link3 = videoLink(video2, doc);
    const boxed = !!headline.querySelector('.has-background, [class*="bg-light-gray"]');
    const quotes = boxed ? asideQuotes : [headline, ...asideQuotes];
    const lines = boxed ? headlineNodes(headline, doc) : [];
    if (!link3 || boxed && !lines.length) return null;
    const media = doc.createElement("p");
    media.append(link3);
    const buttons = ctas.flatMap((cta) => buttonNodes(cta, doc));
    const firstLine = headline.querySelector(".line") || headline;
    const big = firstLine.querySelector('[class*="fontsize-2vw"]') || !headline.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
    const statement = big && lines.length ? [rename(lines[0], "h2"), ...lines.slice(1)] : lines;
    const half = /\bcol-sm-6\b/.test((video2.closest('[class*="col-sm-"]') || video2).className);
    return WebImporter.Blocks.createBlock(doc, {
      name: `Columns (${half ? "columns-50-50" : "columns-67-33"}, large-headline${boxed ? ", gray-lead" : ""})`,
      cells: [/* @__PURE__ */ ((mediaCell, textCell) => mirrored ? [textCell, mediaCell] : [mediaCell, textCell])(
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
    const hasTitle = !!(h1 && text(h1));
    if (hasTitle) {
      const heading2 = doc.createElement("h1");
      heading2.innerHTML = h1.innerHTML;
      cleanRichText(heading2);
      title.nodes.push(heading2);
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
      h5.textContent = location.textContent.replace(/[\s\u00a0]+/g, " ").replace(/\s+,/g, ",").trim();
      title.nodes.push(h5);
    }
    const components = [...main.querySelectorAll(selector)].filter((el3) => {
      const parent = el3.parentElement && el3.parentElement.closest(selector);
      return !parent && !el3.closest("header, footer, .modal");
    });
    const consumed = /* @__PURE__ */ new Set();
    const videoRowColumns = (video2) => {
      const aside = videoAside(video2);
      if (!aside) return false;
      const asideCol = aside.closest('[class*="col-sm-"]');
      const quotes = [...asideCol.querySelectorAll(".c-largeheadline")].filter((h) => h !== aside && text(h));
      const videoCol = video2.closest('[class*="col-sm-"]');
      const ctas = [...videoCol.querySelectorAll(".c-curatedcta")].filter((c) => text(c));
      const asideCtas = [...asideCol.querySelectorAll(".c-curatedcta")].filter((c) => text(c));
      const cols = [...asideCol.parentElement.children];
      const mirrored = cols.indexOf(asideCol) < cols.indexOf(videoCol);
      const columns = videoHeadlineColumns(video2, aside, doc, quotes, ctas, asideCtas, mirrored);
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
      if (component.matches(".c-largeheadline") && !isFirst && !text(component) && !component.querySelector("img, picture, video, iframe, [data-asset-path]") && !component.closest('[class*="col-sm-"], [class*="col-md-"]')) {
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
        const link3 = img && img.closest("a[href]");
        if (link3 && component.contains(link3)) {
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(link3, absoluteAsset(link3.getAttribute("href"))));
          a.textContent = (img.getAttribute("alt") || "").trim() || a.getAttribute("href");
          const p = doc.createElement("p");
          p.append(a);
          nodes2.splice(1, 0, p);
          const style = ["image-link", link3.closest(".text-center") ? "center" : ""].filter(Boolean).join(", ");
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
        const inRow = row && !text(row) && !row.querySelector("img, [data-asset-path], iframe, form, table");
        separatorNext = inRow ? "separator, separator-row" : "separator";
        current = null;
        return;
      }
      if (component.matches(".c-customizeable")) {
        if (!component.querySelector(".item img")) return;
        const section = startSection("cards");
        const heading2 = component.querySelector("h2");
        if (heading2 && text(heading2)) {
          const h2 = doc.createElement("h2");
          h2.textContent = text(heading2);
          section.nodes.push(h2);
          heading2.remove();
        }
        section.nodes.push(component);
        current = null;
        return;
      }
      if (component.matches(".c-largeheadline") && headlineVideo(component) && !consumed.has(headlineVideo(component))) {
        const video2 = headlineVideo(component);
        if (videoRowColumns(video2)) {
          consumed.add(video2);
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
      if (isFirst && !hasTitle && component.matches(".c-largeheadline") && component.querySelector('[class*="fontsize-2vw"]') && text(component)) {
        const lines = headlineNodes(component, doc);
        if (lines.length) {
          const heading2 = rename(lines[0], "h1");
          heading2.querySelectorAll("strong, em").forEach(unwrap);
          startSection("headline", "headline-2vw").nodes.push(heading2, ...lines.slice(1));
          current = null;
          return;
        }
      }
      if (isFirst && !hasTitle && component.matches(".c-rich-text-editor")) {
        const heading2 = richTextTitle(component, doc);
        if (heading2) {
          startSection("headline", "h1-21").nodes.push(heading2);
          current = null;
        }
      }
      const partlyCentred = component.matches(".c-largeheadline") && [...component.querySelectorAll(".line")].some((line) => text(line) && centredLine(line));
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
    const disclaimers = [...doc.querySelectorAll(".c-disclaimer")].filter((el3) => !el3.querySelector("#publishedDate") && !el3.parentElement.closest(".c-disclaimer") && text(el3));
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
      const MARKS = ["data-btn-style", "data-section-style"];
      const markSelector = MARKS.map((m) => `[${m}]`).join(", ");
      const marked = section.nodes.flatMap((node) => node.nodeType === 1 ? [...node.matches(markSelector) ? [node] : [], ...node.querySelectorAll(markSelector)] : []);
      const markStyles = marked.flatMap((el3) => MARKS.map((m) => el3.getAttribute(m)).filter(Boolean));
      [...new Set(markStyles)].forEach((style) => {
        if ((section.style || "").split(", ").includes(style)) return;
        section.style = [section.style, style].filter(Boolean).join(", ");
      });
      marked.forEach((el3) => MARKS.forEach((m) => el3.removeAttribute(m)));
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
  function colourStyle(el3) {
    const m = (el3.className || "").match(/\bbg-([a-z-]+)\b/);
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
    const units = [...container.querySelectorAll(UNIT)].filter((el3) => {
      const outer = el3.parentElement.closest(UNIT);
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
        const heading2 = doc.createElement(`h${level}`);
        heading2.textContent = labels[i] || `Tab ${i + 1}`;
        nodes.push(heading2, ...content);
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
      const divided = group.hasAttribute("data-divided");
      const variant = divided ? "divided" : options;
      const name = variant ? `Accordion (${variant})` : "Accordion";
      const items = panels.map((panel) => ({
        label: h.text(panel.querySelector(".panel-title")),
        body: contentNodes(panel.querySelector(".panel-body") || panel, doc, h)
      }));
      items.forEach(({ body }) => tagPanelCopy(body, doc, h));
      if (divided) {
        items.forEach((item) => {
          item.body = item.body.flatMap((n) => n.nodeType === 1 && n.matches("table") ? blockCells(n) : [n]);
        });
      }
      const target = group.closest(".c-accordion") || group;
      const nested = !divided && items.some(({ body }) => body.some((n) => n.nodeType === 1 && (n.matches("table") || n.querySelector("table"))));
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
          const heading2 = doc.createElement("h4");
          heading2.textContent = label;
          target.before(keepNodes(doc, [heading2, ...body], "accordion-panel"));
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
        const heading2 = group.querySelector("h3");
        if (heading2 && h.text(heading2)) {
          const h3 = doc.createElement("h3");
          h3.textContent = h.text(heading2);
          nodes.push(h3);
        }
        const ul = doc.createElement("ul");
        group.querySelectorAll("li a[href]").forEach((link3) => {
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.href = link3.getAttribute("href");
          a.textContent = h.text(link3);
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
      const nodes = [...component.querySelectorAll("h2, h3, h4, p, li")].filter((el3) => h.text(el3) && !el3.querySelector("h2, h3, h4, p, li")).map((el3) => {
        const copy = doc.createElement(el3.matches(".c-fastfacts-title") ? "h2" : "p");
        copy.textContent = h.text(el3);
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
      const columnNodes = (col) => [...col.querySelectorAll("h1, h2, p, img")].flatMap((el3) => {
        if (el3.matches("img")) {
          const source = el3.closest("picture") && el3.closest("picture").querySelector("source[srcset]");
          const img = doc.createElement("img");
          img.setAttribute("src", source ? source.getAttribute("srcset").split(/\s+/)[0] : el3.getAttribute("src"));
          img.setAttribute("alt", el3.getAttribute("alt") || "");
          const p = doc.createElement("p");
          p.append(img);
          return [p];
        }
        if (!h.text(el3)) return [];
        const copy = doc.createElement(el3.tagName.toLowerCase());
        const gold = /^(?:#ffb500|rgb\(\s*255\s*,\s*181\s*,\s*0\s*\))$/i.test(((el3.getAttribute("style") || "").match(/color\s*:\s*([^;]+)/i) || [])[1]?.trim() || "");
        if (el3.matches("h1")) {
          const strong = doc.createElement("strong");
          strong.textContent = h.text(el3);
          copy.append(doc.createTextNode(gold ? "[[text-2][[color-gold]" : "[[text-2]"), strong, doc.createTextNode(gold ? "]]" : "]"));
        } else if (el3.matches("h2")) {
          copy.textContent = `[[text-1-75,serif]${h.text(el3)}]`;
        } else copy.textContent = gold ? `[[color-gold]${h.text(el3)}]` : h.text(el3);
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
        [...desc.children].filter((el3) => h.text(el3)).forEach((el3) => nodes.push(el3.cloneNode(true)));
      }
      component.querySelectorAll(".btn-container a[href]").forEach((link3) => {
        const img = link3.querySelector("img");
        const label = h.text(link3) || img && (img.getAttribute("alt") || "").trim() || link3.getAttribute("href");
        const a = doc.createElement("a");
        a.href = link3.getAttribute("href");
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
      const label = [...widget.children].find((el3) => !el3.querySelector(".numbercounter-number") && h.text(el3));
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
    main.querySelectorAll('[style*="color"]').forEach((el3) => {
      const m = (el3.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (!m || !WHITE.test(m[1].trim()) || !el3.closest(COLOURED_BOX) || !h.text(el3)) return;
      if (el3.parentElement.closest('[style*="color"]') && WHITE.test((el3.parentElement.closest('[style*="color"]').getAttribute("style") || "").replace(/.*color\s*:\s*([^;]+).*/i, "$1").trim())) return;
      el3.prepend(doc.createTextNode("[[color-white]"));
      el3.append(doc.createTextNode("]"));
      el3.setAttribute("data-white-tag", "");
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
    },
    // an article body kept as its own fragment document (the page's Fragment block)
    "/content/experience-fragments/stryker/surgical-technologies/en/news/technology-helps-imp/body-copy/master": {
      name: 'Article body of "Technology helps improve colonoscopy safety and efficiency"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker-boosts-innovation-r-and-d-expands-with-medical-device-testing-facility/body-copy/master": {
      name: 'Article body of "Stryker boosts innovation: R&D expands with medical device testing facility"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/why-all-police-cars-need-aeds/body": {
      name: 'Article body of "Why all police cars need an AED"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/understanding-the-basics-of-a-lucas-chest-compression-system/body": {
      name: 'Article body of "Understanding the basics of a LUCAS chest compression system"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/_80_years_together/test---body-copy/master": {
      name: 'Article body of "80 years together"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/employees_share_why_/body-copy/master": {
      name: 'Article body of "Employees share why DE&I matters at annual Summit"'
    },
    "/content/experience-fragments/stryker/communications/en/news/_2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite/body-copy/master": {
      name: 'Article body of "What does an operating room look like? Look inside Stryker\u2019s iSuite"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy/master": {
      name: 'Article body of "Breast Cancer Awareness Meets Breast Cancer Advancements"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy-2/master": {
      name: 'Article body (second part) of "Breast Cancer Awareness Meets Breast Cancer Advancements"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/putting_people_first/body-copy/master": {
      name: 'Article body of "Putting people first: how Stryker supports worldwide disaster relief efforts"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/mako_smartrobotics_h/body-text/master": {
      name: 'Article body of "Mako SmartRobotics\u2122 hits 500,000+ procedures"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/mother_and_son_take_/body-copy/master": {
      name: 'Article body of "Mother and son take on Goldenhar syndrome"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/some_people_say_they/body-copy/master": {
      name: 'Article body of "Some people say they\u2019d give you their kidney. This nurse meant it."'
    },
    "/content/experience-fragments/stryker/corporate/en/patient/jordan_3_17_23/jordan/master": {
      name: 'Article body of "Celebrating four years | Jordan\u2019s sudden cardiac arrest story"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/springing_into_actio/body-copy/master": {
      name: 'Article body of "Springing into action | Andy\u2019s sudden cardiac arrest story"'
    },
    "/content/experience-fragments/stryker/corporate/en/patient/boris_story_5_15_23/news-content/master": {
      name: 'Article body of "Taking action | Boris\u2019 stroke story"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/katherine_s_catastro/body-copy/master": {
      name: 'Article body of "Katherine\u2019s catastrophic stroke survivor story"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/defying_the_odds/body-content/master": {
      name: 'Article body of "Defying the odds"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/woman_holding_recycl/body-copy/master": {
      name: 'Article body of "Packaging for a better planet"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/why_aeds_belong_on_b/body-copy/master": {
      name: 'Article body of "Why AEDs belong on back-to-school checklists"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/restoring_form_funct/body/master": {
      name: 'Article body of "Restoring form, function and hope | Emily\u2019s jaw replacement"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/is_it_a_heart_attack/body-copy/master": {
      name: 'Article body of "Is it a heart attack or sudden cardiac arrest? Know the warning signs and what to do for both"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/carolyn_s_mako_total/body-copy/master": {
      name: 'Article body of "Carolyn\u2019s Mako Total Hip surgery story"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/focusing_on_her_mobi/body-copy/master": {
      name: 'Article body of "How Janet  recovered from a vertebral (spine) compression fracture"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/three_things_to_know/body-copy/master": {
      name: 'Article body of "Three things to know about Stryker\u2019s employee giving program"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/tour_the_amsterdam_s/body-copy/master": {
      name: 'Article body of "Tour the Amsterdam Skills Centre, an international training centre for medical specialists"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_donates_22_5/text/text/master": {
      name: 'Article body of "Stryker donates 22,500 Emergency Relief Bed Kits to Project C.U.R.E."'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/what_are_the_symptom/body-copy/master": {
      name: 'Article body of "What are the symptoms and signs of stroke?"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/a_partnership_promot/body-copy/master": {
      name: 'Article body of "A partnership promoting mental health for healthcare workers"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/help-increase-patient-outcomes-both-in-and-out-of-the-hospital/body": {
      name: 'Article body of "Help increase patient outcomes both in and out of the hospital"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/these_nurses_share_h/body-copy/master1": {
      name: 'Article body of "Nurses working at Stryker share how their experience becomes innovation in nursing"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/transforming_confide/body-copy/master": {
      name: 'Article body of "Stryker and Operation Smile transform confidence and care"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/celebrating_hispanic/body-copy/master": {
      name: 'Article body of "Celebrating Hispanic Heritage: driving our mission forward"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/mako_robotics_drivin/infographic-text/master": {
      name: 'Article body of "Mako: Robotics driving innovation across specialties"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/military_members_on_/body-copy/master11": {
      name: 'Article body of "Military members on a mission to make healthcare better"'
    },
    "/content/experience-fragments/stryker/surgical-technologies/en/news/the_journey_to_zero_/body-copy/master": {
      name: 'Article body of "The \u201CJourney to Zero Harm\u201D Starts with Communication, Protocols and Technology"'
    },
    "/content/experience-fragments/stryker/surgical-technologies/en/news/protect_your_patient/body-copy/master": {
      name: 'Article body of "Protect your patients \u2026 and your OR staff."'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/a_safe_space_at_stry/body-copy/master": {
      name: 'Article body of "A safe space at Stryker"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/back_pain_and_scolio/body-copy/master": {
      name: 'Article body of "Back pain and scoliosis: Victoria finds relief"'
    },
    "/content/experience-fragments/stryker/corporate/en/patient/derrick_10_2_23/derrick/master": {
      name: 'Article body of "Knowing the warning signs of sudden cardiac arrest helped saved his life | Derrick\u2019s sudden cardiac arrest story"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/when-to-use-and-aed/body": {
      name: 'Article body of "Knowing when to use an AED: CPR and AED guidelines for sudden cardiac arrest"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_stryker_is_innov/body-copy/master": {
      name: 'Article body of "How Stryker is innovating in operating room design"'
    },
    "/content/experience-fragments/stryker/surgical-technologies/en/news/how_technology_helps/how-technology-helps-address-gi-suite-challenges/master": {
      name: 'Article body of "How Technology Helps Address GI Suite Challenges"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_s_global_vol/body/master": {
      name: 'Article body of "Stryker\u2019s Global Volunteer Network highlights importance of volunteerism"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/five_things_you_need/body-copy/master": {
      name: 'Article body of "Five things you need to know about high blood pressure and stroke"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/promoting_high_quali/body-copy/master": {
      name: 'Article body of "Promoting high quality, inclusive healthcare in Latin America"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/-2026/features/myths-realities-and-real-innovation-what-everyone-should-know-about-arthritis/myths--realities-and-real-innovation--what-everyone-should-know/master": {
      name: 'Article body of "Myths, realities and real innovation: What everyone should know about arthritis"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/advancing_healthcare/body-copy/master": {
      name: 'Article body of "Advancing healthcare professionals\u2019 education with Stryker\u2019s Neurotech Mobile Experience"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_is_doubling_/body-text/master": {
      name: 'Article body of "Advancing neurosurgery: Stryker supports brain tumor research through ongoing partnership"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/3-ways-aed-remote-monitoring-makes-a-difference/blog": {
      name: 'Article body of "3 ways AED remote monitoring makes a difference"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/stryker_gets_medical/2-8-24-body-copy/master": {
      name: 'Article body of "Stryker gets medical equipment to regions in need with Project C.U.R.E. partnership"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/women_leading_the_ch/body/master": {
      name: 'Article body of "Women leading the charge for change"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/a_building_well_done/body/master": {
      name: 'Article body of "A building WELL done | Earning Platinum for putting people first"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/nurses_a_key_driver_/body-content/master": {
      name: 'Article body of "Nurses: A key driver in advancing global health"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/this_surgical_icu_te/this-surgical-icu-team-is-bound-by-unspeakable-trauma-and-miracu/master": {
      name: 'Article body of "This Surgical ICU team is bound by unspeakable trauma and miraculous healings"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/caregiver_klisa/body-copy/master": {
      name: 'Article body of "This nurse turned tragic loss into inspiring hope"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/strykers_journey_to_/infographic/master": {
      name: 'Article body of "Stryker\u2019s Journey to Zero* harm continues with Neptune S"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/three_ways_stryker_w/body/master": {
      name: 'Article body of "Three ways Stryker supports physicians in their pursuit of better patient outcomes"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/why-every-college-campus-needs-accessible-aeds/master": {
      name: 'Article body of "Why every college campus needs accessible AEDs"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/the-role-of-defibrillation-during-sudden-cardiac-arrest/body": {
      name: 'Article body of "The role of defibrillation during sudden cardiac arrest"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/how-to-prepare-your-workplace-for-a-sudden-cardiac-emergency/master": {
      name: 'Article body of "How to prepare your workplace for a sudden cardiac emergency"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/a_winning_spirit/a-winning-spirit/master": {
      name: 'Article body of "A winning spirit"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/five_things_to_know_/body-copy/master": {
      name: 'Article body of "Five things to know about heart attacks and sudden cardiac arrests"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/what_it_s_like_being/body-copy/master": {
      name: 'Article body of "What it\u2019s like being a caregiver to a loved one with Alzheimer\u2019s"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-1/master": {
      name: 'Article body part of "Making a difference through mentorship"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/mentors/master": {
      name: 'Article body part of "Making a difference through mentorship"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-2/master": {
      name: 'Article body part of "Making a difference through mentorship"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/12-year-old-girl-experiences-cardiac-arrest-stryker-employee-re/body": {
      name: 'Article body of "12-year-old girl experiences cardiac arrest, Stryker employee responds"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/master": {
      name: 'Article body part of "How augmented reality can help care teams plan, design and construct new operating rooms"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/body-copy-2": {
      name: 'Article body part of "How augmented reality can help care teams plan, design and construct new operating rooms"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-1/master": {
      name: 'Article body part of "Innovation inspired by insights: the next generation, first completely wireless hospital bed is here"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-2/master": {
      name: 'Article body part of "Innovation inspired by insights: the next generation, first completely wireless hospital bed is here"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_holds_divers/body-copy/master": {
      name: 'Article body of "Stryker holds diversity, equity and inclusion summit"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/how-the-right-equipment-can-help-recruit-and-retain-emts-and-par/body": {
      name: 'Article body of "How the right equipment can help recruit and retain EMTs and paramedics"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/four-reasons-every-school-should-have-an-aed/master": {
      fragment: "/us/en/fragments/stryker/emergency-care/en/news/four-reasons-every-school-should-have-an-aed/body",
      name: 'Article body of "Four reasons every school needs AEDs"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/body-copy/master": {
      name: 'Article body of "Advancing healthcare through Asian culture and collaboration"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/more_than_able_to_ma/body-copy/master": {
      name: 'Article body of "More than able to make healthcare better"'
    },
    "/content/experience-fragments/stryker/corporate/en/about/news/features/technologies_that_pr/body-copy/master": {
      name: 'Article body of "Technologies that promote safe care for mother and baby during childbirth"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/5-steps-to-convince-decision-makers-to-adopt-an-aed-program/body": {
      name: 'Article body of "5 steps to convince decision makers to adopt an AED program"'
    },
    "/content/experience-fragments/stryker/emergency-care/en/news/8-steps-to-a-successful-aed-safety-program/body": {
      name: 'Article body of "8 steps to a successful AED safety program"'
    },
    "/content/experience-fragments/stryker/surgical-technologies/en/news/addressing_or_and_l_/carousel/master": {
      name: 'Article body of "Addressing OR and L&D Challenges with Adjunct Technology"'
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
    const entry = xf_fragment_map_default[xfKey(xf)];
    if (!entry) return null;
    return entry.fragment || xfToFragmentPath(xf);
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
  var TEMPLATES = ["long-page-detail-corp", "long-page-detail-corp-fragments", "base"];
  var H1_TITLE_ONLY = ["base"];
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
  function edsLinkPaths(main) {
    main.querySelectorAll('a[href^="/"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (href.startsWith("//") || href.startsWith("/content/")) return;
      const [, path, suffix = ""] = href.match(/^([^?#]*)([?#].*)?$/);
      const slash = path.length > 1 && path.endsWith("/") ? "/" : "";
      const bare = path.replace(/\/$/, "");
      if (!bare) return;
      const clean5 = WebImporter.FileUtils.sanitizePath(bare);
      if (clean5 && clean5 !== bare) a.setAttribute("href", `${clean5}${slash}${suffix}`);
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
  function text2(el3) {
    return (el3.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function sourcePath(payload) {
    try {
      return new URL(payload.params.originalURL).pathname;
    } catch {
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
    return row ? [...row.children].filter((el3) => /\bcol-(xs|sm|md)-\d+/.test(el3.className)) : [];
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
      if (text2(slot) || slot.querySelector("img, [data-asset-path], iframe")) return true;
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
      const heading2 = title.querySelector("h2");
      if (heading2 && text2(heading2)) {
        const h2 = doc.createElement("h2");
        const u = doc.createElement("u");
        u.textContent = text2(heading2);
        h2.append(u);
        nodes.push(h2);
      }
      const container = title.querySelector(".title-container") || title;
      [...container.children].filter((el3) => el3 !== heading2 && text2(el3)).forEach((el3) => {
        nodes.push(el3.cloneNode(true));
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
      if (!title || !text2(title)) return;
      const h2 = doc.createElement("h2");
      const u = doc.createElement("u");
      u.textContent = text2(title);
      h2.append(u);
      (downloads.closest(".resourcesanddownload") || downloads).before(richText(doc, [h2]));
      title.remove();
    });
  }
  function videoCaptions(main, doc) {
    main.querySelectorAll(".c-standalone-video").forEach((video2) => {
      const caption = video2.querySelector(".desc-content");
      if (!caption) return;
      if (text2(caption)) {
        const copy = caption.cloneNode(true);
        (video2.closest(".standalonevideo") || video2).after(richText(doc, [...copy.childNodes]));
      }
      caption.remove();
    });
  }
  function localNav(main, doc) {
    const nav = main.querySelector(".localpagenavigation nav");
    if (!nav) return null;
    const parent = nav.querySelector("a.parent-node");
    const links = [...nav.querySelectorAll("ul.links > li > a[href]")];
    nav.closest(".localpagenavigation").remove();
    if (!parent && !links.length) return null;
    const rows = [];
    if (parent) {
      const a = doc.createElement("a");
      a.href = parent.getAttribute("href");
      a.textContent = text2(parent);
      rows.push([a]);
    }
    const ul = doc.createElement("ul");
    links.forEach((source) => {
      const li = doc.createElement("li");
      const a = doc.createElement("a");
      a.href = source.getAttribute("href");
      a.textContent = text2(source);
      li.append(a);
      ul.append(li);
    });
    rows.push([ul]);
    return WebImporter.Blocks.createBlock(doc, { name: "Local Nav", cells: rows });
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
    const link3 = img && img.closest("a[href]");
    return link3 && component.contains(link3) ? link3 : null;
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
    const boxes = [...col.querySelectorAll(".has-background:not(.bg-white), .dimensional-box")].filter((b) => b.closest(".colctrl") === row && text2(b)).filter((b) => !b.parentElement.closest(".has-background:not(.bg-white), .dimensional-box"));
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
    const first = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text2(c))[0];
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
    const textCols = columns.filter((col) => text2(col));
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
        const link3 = linkedImage(c);
        if (link3 && nodes.length) {
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(link3, absoluteAsset(link3.getAttribute("href"))));
          a.textContent = link3.querySelector("img").getAttribute("alt") || text2(link3) || a.getAttribute("href");
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
    const centred = (el3) => !!el3.closest('.text-center, [style*="text-align: center"], [style*="text-align:center"]');
    const images = [...col.querySelectorAll(".c-standalone-image img")];
    const paragraphs = [...col.querySelectorAll(".c-rich-text-editor :is(p, h1, h2, h3, h4, h5, h6, li), .c-standalone-image .title-content :is(h2, h3, h4, h5), .c-largeheadline .line")].filter((el3) => text2(el3));
    const items = [...images, ...paragraphs];
    return items.length > 0 && items.every(centred);
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
      const inline2 = [];
      for (let c = li.firstChild; c && !(c.nodeType === 1 && c.matches("ul, ol")); c = c.nextSibling) inline2.push(c);
      if (inline2.some((c) => c.textContent.trim())) wrap2(inline2[0], inline2[inline2.length - 1]);
    });
  }
  function rowCopyStyle(cells, doc) {
    const copy = cells.flat().filter((n) => n.nodeType === 1 && n.copyStyle !== void 0 && n.copyStyle !== null && !/^H\d$/.test(n.tagName));
    const weight = {};
    copy.forEach((n) => {
      weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text2(n).length;
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
    const hasContent = (el3) => text2(el3) || el3.querySelector("img, iframe, [data-asset-path]");
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      const row = colctrl.querySelector(":scope > .row");
      const all = row ? [...row.children] : [];
      const cols = all.filter(hasContent);
      if (cols.length !== 1 || all.length > 2) return;
      const units = [...cols[0].querySelectorAll(`.colctrl, ${COMPONENT2}`)].filter((el3) => {
        const outer = el3.parentElement.closest(`.colctrl, ${COMPONENT2}`);
        return (!outer || outer === colctrl) && (text2(el3) || el3.querySelector("img, iframe, [data-asset-path]") || el3.matches('.c-full-bleed-panel[class*="bg-"]'));
      });
      const last = units[units.length - 1];
      if (!last) return;
      const unit = last.matches(".colctrl") && last.parentElement && /\bcols/.test(last.parentElement.className) ? last.parentElement : last;
      unit.setAttribute("data-row-end", String(Number(unit.getAttribute("data-row-end") || 0) + 1));
    });
    const mark = (el3) => el3.setAttribute("data-row-end", String(Number(el3.getAttribute("data-row-end") || 0) + 1));
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
      const parts = [...prev.querySelectorAll(COMPONENT2)].filter((el3) => !el3.parentElement.closest(COMPONENT2) && hasContent(el3));
      const last = parts[parts.length - 1] || (prev.matches(COMPONENT2) ? prev : null);
      if (last) mark(last);
    });
  }
  function columnRows(main, doc) {
    [...main.querySelectorAll(".colctrl")].reverse().forEach((colctrl) => {
      const all = rowColumns(colctrl);
      const filled = all.filter((col) => text2(col) || col.querySelector("img, [data-asset-path], iframe, form, table"));
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
        colctrl.querySelectorAll("[data-white-tag]").forEach((el3) => {
          const inBox = el3.closest(".has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel");
          if (!inBox || inBox.matches(".c-full-bleed-panel") || inBox.closest(".colctrl") !== colctrl) return;
          if (el3.firstChild && el3.firstChild.nodeValue === "[[color-white]") el3.firstChild.remove();
          if (el3.lastChild && el3.lastChild.nodeValue === "]") el3.lastChild.remove();
          el3.removeAttribute("data-white-tag");
        });
      }
      const parts = columns.length === 2 ? [...columns[0].querySelectorAll(`${CELL_COMPONENTS}, .sectionseparator`)].filter((c) => c.closest(".colctrl") === colctrl && (text2(c) || c.matches(".sectionseparator"))) : [];
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
  var isMediaCell = (td) => !td.textContent.trim() || td.querySelector(MEDIA) && [...td.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].every((el3) => el3.querySelector(MEDIA) || !text2(el3));
  function gridRows(main) {
    const isColumns = (el3) => el3 && el3.matches('table[data-keep="section"]') && /^Columns\b/.test(text2(tableRows(el3)[0] || el3));
    const empty = (el3) => !text2(el3) && !el3.querySelector(`${MEDIA}, table, form, hr, .sectionseparator`) && !el3.matches("[data-keep], .sectionseparator, hr");
    const next = (el3) => {
      let n = el3.nextElementSibling;
      while (n && empty(n)) n = n.nextElementSibling;
      return n;
    };
    const cellsOf = (table) => tableRows(table).slice(1).map((tr) => [...tr.children]);
    const textOnly = (td) => !td.querySelector(MEDIA);
    const sameBlock = (x, y) => isColumns(y) && text2(tableRows(y)[0]) === text2(tableRows(x)[0]);
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
      const img = box.querySelector("img");
      if (!img) return;
      const desktop = (box.querySelector("source[srcset]") || {}).getAttribute?.("srcset") || img.getAttribute("src");
      const phone = img.getAttribute("src");
      const alt = img.getAttribute("alt") || "";
      const holder = doc.createElement("div");
      holder.setAttribute("data-keep", "nodes");
      holder.setAttribute("data-section-style", box.classList.contains("bg-shadow") ? "full-width-image, shadow" : "full-width-image");
      [.../* @__PURE__ */ new Set([desktop, phone])].filter(Boolean).forEach((src) => {
        const p = doc.createElement("p");
        const image3 = doc.createElement("img");
        image3.setAttribute("src", src);
        image3.setAttribute("alt", alt);
        p.append(image3);
        holder.append(p);
      });
      box.replaceWith(holder);
    });
  }
  function renameTo(el3, tag, doc) {
    if (el3.tagName.toLowerCase() === tag) return el3;
    const out = doc.createElement(tag);
    out.append(...el3.childNodes);
    el3.replaceWith(out);
    return out;
  }
  function sizeTagged(el3, tag, doc) {
    el3.prepend(doc.createTextNode(`[[${tag}]`));
    el3.append(doc.createTextNode("]"));
    return el3;
  }
  var TITLE_SIZES = ["1-25", "1-5", "1-75", "2", "2-5"];
  function titleFromHeading(heading2, doc) {
    const level = heading2.tagName;
    const h1 = renameTo(heading2, "h1", doc);
    const spans = [...h1.querySelectorAll('[class*="fontsize-"]')].filter((span) => text2(span) === text2(h1));
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
    main.querySelectorAll(".c-standalone-video").forEach((video2) => {
      const asset = video2.querySelector("[data-asset-path]");
      if (asset && asset.getAttribute("data-asset-path").startsWith("/content/dam/")) {
        (video2.closest(".standalonevideo") || video2).remove();
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
    main.querySelectorAll(".hero-space").forEach((el3) => el3.remove());
    main.querySelectorAll(".fullWidthImageHero").forEach((el3) => el3.setAttribute("data-keep", "section"));
    dropDamVideos(main);
    fullWidthImages(main, doc);
    spaceUrlColons(main, doc);
    const nav = localNav(main, doc);
    experienceFragments(main, doc, long_page_detail_corp_xf_default[path] || [], long_page_detail_corp_xf_slots_default[path]);
    sectionTitles(main, doc);
    downloadTitles(main, doc);
    videoCaptions(main, doc);
    const hasTitle = !!(main.querySelector(".h1-title h1") && text2(main.querySelector(".h1-title h1"))) || !!main.querySelector(".fullWidthImageHero h1, .c-autocarousel h1");
    const titleHeadings = H1_TITLE_ONLY.includes(payload.template.name) ? "h1" : ":is(h1, h2, h3, h4, h5, h6)";
    let firstTitle = !hasTitle && [...main.querySelectorAll(`.c-largeheadline, .c-rich-text-editor ${titleHeadings}`)].find((el3) => text2(el3) && !el3.closest(".h1-title"));
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
      text: text2,
      tagCopy
    };
    convertBeforeRows(main, doc, helpers);
    markRowEnds(main);
    columnRows(main, doc);
    gridRows(main);
    convertAfterRows(main, doc, helpers);
    main.querySelectorAll('[data-row-end]:not([data-keep], [class^="c-"], [class*=" c-"])').forEach((wrapper) => {
      const parts = [...wrapper.querySelectorAll('[data-keep], [class^="c-"], [class*=" c-"]')].filter((el3) => !el3.parentElement.closest('[data-keep], [class^="c-"], [class*=" c-"]') && (text2(el3) || el3.querySelector("img, iframe, [data-asset-path]")));
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

  // tools/importer/transformers/contact-division-sections.js
  var KEYPAD = ["ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
  var PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  var VANITY = /\b\d{3}-[A-Z]{7}\b/;
  var text3 = (node) => node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  function el(doc, tag, ...children) {
    const node = doc.createElement(tag);
    node.append(...children);
    return node;
  }
  function link(doc, href, label) {
    const a = el(doc, "a", label);
    a.setAttribute("href", href);
    return a;
  }
  var underlined = (doc, tag, label) => el(doc, tag, el(doc, "u", label));
  function richNodes(container, doc) {
    const root = container.querySelector(".left-to-right") || container;
    const clone = root.cloneNode(true);
    clone.querySelectorAll("a").forEach((a) => {
      if (!a.querySelector(".standalone-link")) return;
      a.replaceChildren(el(doc, "u", text3(a)));
      if (!a.closest(".futura-bold")) a.replaceWith(el(doc, "strong", a.cloneNode(true)));
    });
    clone.querySelectorAll("span.futura-bold").forEach((span) => {
      if (span.querySelector("strong") || span.closest("strong")) span.replaceWith(...span.childNodes);
      else span.replaceWith(el(doc, "strong", ...span.childNodes));
    });
    clone.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    clone.querySelectorAll("*").forEach((node) => {
      ["style", "class", "target", "rel", "id"].forEach((name) => node.removeAttribute(name));
    });
    clone.querySelectorAll("p > br:last-child").forEach((br) => br.remove());
    return [...clone.children].filter((node) => text3(node) || node.querySelector("img"));
  }
  function contactLine(p, label, doc, report) {
    const a = p.querySelector("a");
    const value = text3(p);
    if (!value) return null;
    const out = doc.createElement("p");
    const href = a ? a.getAttribute("href") || "" : "";
    const note = (to) => report.phones.push({
      text: value,
      href,
      to,
      label
    });
    if (p.matches(".email-address, .link-item")) {
      out.append(link(doc, href, value));
      return out;
    }
    if (/^[^\s@]+@[^\s@]+\.[a-z]+$/i.test(value)) {
      out.append(link(doc, `mailto:${value}`, value));
      note(`mailto:${value}`);
      return out;
    }
    const isFax = /\bfax\b/i.test(value) || /\bfax\b/i.test(label);
    let match = value.match(PHONE);
    let digits = match && match[0].replace(/\D/g, "");
    if (!match) {
      match = value.match(VANITY);
      digits = match && match[0].replace(/[A-Z]/g, (c) => KEYPAD.findIndex((keys) => keys.includes(c)) + 2).replace(/\D/g, "");
    }
    if (isFax || !match) {
      out.textContent = value;
      note(isFax && match ? "plain text (fax)" : "plain text");
      return out;
    }
    const number = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    const telHref = `tel:${number}`;
    const before = value.slice(0, match.index);
    const after = value.slice(match.index + match[0].length);
    const vanity = !PHONE.test(value) && /^\s*\([\d-]+\)\s*$/.test(after);
    const linked = vanity ? `${match[0]}${after}` : match[0];
    if (before) out.append(before);
    out.append(link(doc, telHref, linked));
    if (after && !vanity) out.append(after);
    if (href !== telHref || linked !== value) note(telHref);
    return out;
  }
  function addressLines(holder, doc) {
    const lines = [];
    holder.querySelectorAll("p").forEach((p2) => {
      let line = "";
      p2.childNodes.forEach((node) => {
        if (node.nodeName === "BR") {
          lines.push(line);
          line = "";
        } else {
          line += node.textContent;
        }
      });
      lines.push(line);
    });
    const clean5 = lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!clean5.length) return null;
    const p = doc.createElement("p");
    clean5.forEach((line, i) => {
      if (i) p.append(doc.createElement("br"));
      p.append(line);
    });
    return p;
  }
  var CONTACT_LINE = /^(phone|tel|fax|e-?mail)\b|[^\s@]+@[^\s@]+\.[^\s@]+/i;
  function mapLink(contactus, doc) {
    const map = contactus.querySelector("[data-address]");
    if (!map) return null;
    const clean5 = (html) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const lines = map.getAttribute("data-address").split(/<\/p>/i).filter((paragraph) => !CONTACT_LINE.test(clean5(paragraph))).flatMap((paragraph) => paragraph.split(/<br\s*\/?>/i)).map((line) => clean5(line).replace(/[\s,]+$/, "")).filter(Boolean);
    if (!lines.length) return null;
    const address = lines.join(", ");
    return el(doc, "p", link(doc, `https://www.google.com/maps?q=${encodeURIComponent(address)}`, address));
  }
  function contactUs(contactus, doc, report) {
    const nodes = [];
    const heading2 = contactus.querySelector("h2.component-subheading");
    if (text3(heading2)) nodes.push(underlined(doc, "h2", text3(heading2)));
    const details = [];
    const parts = contactus.querySelectorAll([
      ".info h3.component-subheading",
      ".info p.contact-description",
      ".info h4.contact-label",
      ".info .contact-group > div:not([class])",
      ".info p.phone-number",
      ".info p.email-address",
      ".info p.link-item"
    ].join(", "));
    parts.forEach((part) => {
      if (part.matches("h3, h4")) {
        if (text3(part)) details.push(el(doc, part.tagName.toLowerCase(), text3(part)));
      } else if (part.matches("p.contact-description")) {
        details.push(...richNodes(el(doc, "div", part.cloneNode(true)), doc));
      } else if (part.matches("div")) {
        const address = addressLines(part, doc);
        if (address) details.push(address);
      } else {
        const subgroup = part.closest(".contact-subgroup");
        const label = text3(subgroup && subgroup.querySelector("h4.contact-label"));
        const line = contactLine(part, label, doc, report);
        if (line) details.push(line);
      }
    });
    const map = mapLink(contactus, doc);
    if (details.length || map) {
      const cells = [[details, map ? [map] : ""]];
      nodes.push(WebImporter.Blocks.createBlock(doc, { name: "Columns (columns-50-50)", cells }));
    }
    return nodes;
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
      "long-page-detail-corp",
      "long-page-detail-corp-fragments",
      "event-detail",
      "contact-division",
      "base",
      "base-fragments"
    ].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading2) => {
          heading2.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text9 = span.textContent.replace(/ /g, " ").trim();
            if (!text9) return;
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
        const text9 = span.textContent.replace(/ /g, " ").trim();
        if (!text9) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text9;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text9) {
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

  // tools/importer/base/legal.js
  var PAGE_TEMPLATE = {
    name: "base",
    group: "legal",
    description: "www.stryker.com legal, governance and policy pages (#517): built as the long-page-detail-corp pages (H1 or underlined H2 title, rich text, section titles as underlined H2 with their ids, Accordion, conventions buttons, Columns, small print as a `disclaimer` section); source tables as `Table (no-header, striped)` blocks; `published` with `last-updated: show` (false where the source hides the line).",
    urls: [
      "https://www.stryker.com/us/en/legal/terms-of-use.html",
      "https://www.stryker.com/us/en/about/governance/bylaws.html",
      "https://www.stryker.com/us/en/about/governance/lifecycle-support.html"
    ],
    blocks: []
  };
  var transformers = [
    transform,
    transform2,
    transform3
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
  function splitStandaloneLinks(main, document) {
    main.querySelectorAll(".standalone-link").forEach((span) => {
      [...span.querySelectorAll("a")].slice(1).forEach((a) => {
        const own = document.createElement("span");
        own.className = "standalone-link";
        a.replaceWith(own);
        own.append(a);
      });
    });
  }
  var text4 = (el3) => (el3.textContent || "").replace(/[\s\u00a0]+/g, " ").trim();
  function buildingBlocks(main, document) {
    const groups = [];
    main.querySelectorAll(".buildingblock").forEach((bb) => {
      const prev = bb.previousElementSibling;
      const last = groups[groups.length - 1];
      if (prev && last && last[last.length - 1] === prev) last.push(bb);
      else groups.push([bb]);
    });
    let count = 0;
    groups.filter((g) => g.length > 1).forEach((group) => {
      const heads = group.every((bb) => bb.querySelector(".c-largeheadline"));
      const cells = group.map((bb) => {
        const nodes = [];
        if (heads) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = text4(bb.querySelector(".c-largeheadline"));
          p.append(strong);
          nodes.push(p);
        }
        bb.querySelectorAll(".c-rich-text-editor p").forEach((src) => {
          if (!text4(src)) return;
          const p = document.createElement("p");
          p.append(...[...src.childNodes].map((n) => n.cloneNode(true)));
          cleanRichText(p);
          nodes.push(p);
        });
        const items = [...bb.querySelectorAll(".c-table td")].filter((td) => text4(td));
        if (items.length) {
          const ul = document.createElement("ul");
          items.forEach((td) => {
            const li = document.createElement("li");
            li.append(...[...td.childNodes].map((n) => n.cloneNode(true)));
            cleanRichText(li);
            const trailing = (n) => n && (n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim());
            while (trailing(li.lastChild)) li.lastChild.remove();
            ul.append(li);
          });
          nodes.push(ul);
        }
        return nodes;
      });
      const block = WebImporter.Blocks.createBlock(document, {
        name: heads ? "Columns (color-heads)" : "Columns (striped)",
        cells: [cells]
      });
      block.setAttribute("data-keep", "flow");
      group[0].before(block);
      group.forEach((bb) => bb.remove());
      count += 1;
    });
    return count;
  }
  function tables(main, document) {
    let count = 0;
    main.querySelectorAll(".c-table").forEach((component) => {
      const source = component.querySelector("table");
      if (!source) return;
      const rows = [...source.querySelectorAll("tr")].map((tr) => [...tr.children]);
      const width = Math.max(0, ...rows.map((r) => r.length));
      const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i] && text4(r[i])));
      const cells = rows.filter((r) => r.some((td) => text4(td))).map((r) => used.map((i) => {
        const box = document.createElement("div");
        if (r[i]) box.append(...[...r[i].childNodes].map((n) => n.cloneNode(true)));
        cleanRichText(box);
        const trailing = (n) => n && (n.nodeName === "BR" || n.nodeType === 3 && !n.textContent.trim());
        while (trailing(box.lastChild)) box.lastChild.remove();
        return [...box.childNodes];
      }));
      if (!cells.length) return;
      const block = WebImporter.Blocks.createBlock(document, {
        name: "Table (no-header, striped, body-bold)",
        cells
      });
      block.setAttribute("data-keep", "flow");
      (component.closest(".table.parbase") || component).replaceWith(block);
      count += 1;
    });
    return count;
  }
  function contacts(main, document, report) {
    main.querySelectorAll(".c-contactus").forEach((component) => {
      const nodes = contactUs(component, document, report);
      const holder = document.createElement("div");
      holder.setAttribute("data-keep", "nodes");
      holder.append(...nodes);
      (component.closest(".contactus") || component).replaceWith(holder);
    });
  }
  var DROPPED_STYLES = ["headline-box", "blue", "purple", "separator"];
  function underlineTitles(main, document) {
    main.querySelectorAll("table").forEach((table) => {
      if (text4(table.querySelector("th, tr")) !== "Section Metadata") return;
      const styles = text4(table.querySelector("tr:nth-child(2) td:nth-child(2)")).split(",").map((v) => v.trim());
      if (!styles.includes("separator")) return;
      let hr = table.previousElementSibling;
      while (hr && hr.tagName !== "HR") hr = hr.previousElementSibling;
      let title = hr?.previousElementSibling;
      while (title?.tagName === "TABLE") title = title.previousElementSibling;
      if (title?.tagName !== "H1") return;
      const u = document.createElement("u");
      u.append(...title.childNodes);
      title.append(u);
    });
  }
  function dropUnlistedStyles(main) {
    main.querySelectorAll("table").forEach((table) => {
      if (text4(table.querySelector("th, tr")) !== "Section Metadata") return;
      [...table.querySelectorAll("tr")].slice(1).forEach((tr) => {
        const [key, value] = tr.children;
        if (!key || !value || text4(key).toLowerCase() !== "style") return;
        const styles = text4(value).split(",").map((v) => v.trim()).filter((v) => v && !DROPPED_STYLES.includes(v));
        if (styles.length) value.textContent = styles.join(", ");
        else tr.remove();
      });
      if (table.querySelectorAll("tr").length < 2) table.remove();
    });
  }
  function blockVariants(main) {
    blockTables(main, "Columns").forEach((table) => {
      if (table.querySelector('a[href^="tel:"], h4 + p')) addVariant(table, "contact-lines");
      if (table.querySelector("p > strong > a > u")) addVariant(table, "arrow-links");
    });
    blockTables(main, "Accordion (divided").forEach((table) => addVariant(table, "futura-labels"));
  }
  function trimEmptyCells(main) {
    main.querySelectorAll("table").forEach((table) => {
      if (!/^Columns/.test(text4(table.querySelector("th, tr")))) return;
      table.querySelectorAll("tr").forEach((tr, i) => {
        if (!i) return;
        const cells = [...tr.children];
        while (cells.length > 1) {
          const last = cells[cells.length - 1];
          if (text4(last) || last.querySelector("img, picture, video, iframe")) break;
          last.remove();
          cells.pop();
        }
      });
    });
  }
  var WIDTH_STYLES = [
    ["california-transparency", ["width-50", "width-67"]],
    ["hemorrhagic-stroke/mri", ["width-50"]],
    ["sms-terms-and-conditions", ["width-50"]],
    ["governance/bylaws", [null, null, "heading-space-l"]],
    ["governance/charters", [...Array(11).fill(null), "heading-space-l", ...Array(9).fill(null), "heading-space-l"]]
  ];
  var COPY_WIDTH = [
    ["governance/corporate-governance-guidelines", "width-67"],
    ["governance/equity-based-compensation-awards", "width-67"],
    ["legal/terms-of-use", "width-67"],
    ["legal/surgeon-disclaimer", "width-67"],
    ["legal/website-accessibility", "width-67"],
    ["legal/privacy/privacy-notice-for-california-residents", "width-67"],
    ["responsible-supply-chains/po-terms", "width-67"]
  ];
  var WIDE_COPY = ["governance/bylaws", "governance/charters"];
  var DROP_STYLES = [];
  var BOLD_BODY = [
    "sms-terms-and-conditions",
    "legal/terms-of-use",
    "convercent-global-privacy-statement",
    "hemorrhagic-stroke/mri",
    "privacy-notice-for-california-residents",
    "neurovascular/dfu"
  ];
  function sectionStyles(main, document, url, extra) {
    const widths = WIDTH_STYLES.find(([key]) => url.includes(key))?.[1] || [];
    const hrs = [...main.children].filter((n) => n.tagName === "HR");
    const ends = [...hrs, null];
    const drop = DROP_STYLES.find(([key]) => url.includes(key))?.[1] || [];
    const copyWidth = COPY_WIDTH.find(([key]) => url.includes(key))?.[1];
    const count = Math.max(widths.length, hrs.length + 1, ...[...extra.keys()].map((i) => i + 1));
    for (let i = 0; i < count; i += 1) {
      const add = [...extra.get(i) || []].filter((v) => !drop.includes(v));
      if (widths[i]) add.push(widths[i]);
      if (BOLD_BODY.some((key) => url.includes(key)) && !add.includes("bold-body")) add.push("bold-body");
      if (copyWidth && !widths[i] && !add.some((a) => a.startsWith("headline"))) {
        let titled = false;
        let n = i ? hrs[i - 1]?.nextElementSibling : main.firstElementChild;
        for (; n && n !== ends[i]; n = n.nextElementSibling) {
          if (n.matches("h1, h2") || n.querySelector("h1, h2")) titled = true;
        }
        if (!titled) add.push(copyWidth);
      }
      if (WIDE_COPY.some((key) => url.includes(key)) && !add.some((a) => a.startsWith("headline")) && !add.includes("heading-space-l")) add.push("heading-space-l");
      if (add.length || drop.length) {
        const end = ends[i];
        let table = null;
        let n = i ? hrs[i - 1].nextElementSibling : main.firstElementChild;
        for (; n && n !== end; n = n.nextElementSibling) {
          if (n.tagName === "TABLE" && text4(n.querySelector("th, tr")) === "Section Metadata") table = n;
        }
        if (table) {
          const value = table.querySelector("tr:nth-child(2) td:nth-child(2)");
          const have = text4(value).split(",").map((v) => v.trim()).filter((v) => !drop.includes(v));
          const added = add.filter((v) => !have.includes(v) && !drop.includes(v));
          value.textContent = [...have, ...added].join(", ");
          if (!value.textContent) table.remove();
        } else if (add.length) {
          const block = WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style: add.join(", ") } });
          if (end) end.before(block);
          else main.append(block);
        }
      }
    }
  }
  function indentedLists(main, document) {
    const indent = (p) => parseInt((p.getAttribute("style") || "").match(/margin-left:\s*(\d+)px/)?.[1] || "0", 10);
    main.querySelectorAll("p").forEach((first) => {
      const prev = first.previousElementSibling;
      if (!first.isConnected || !indent(first) || prev?.matches("p") && indent(prev)) return;
      const run = [];
      for (let n = first; n && n.matches("p") && indent(n); n = n.nextElementSibling) run.push(n);
      const steps = [...new Set(run.map(indent))].sort((a, b) => a - b);
      const root = document.createElement("ul");
      const stack = [{ ul: root, li: null }];
      run.forEach((p) => {
        const level = steps.indexOf(indent(p));
        stack.length = Math.min(stack.length, level + 1);
        while (stack.length <= level) {
          const parent = stack[stack.length - 1];
          const ul = document.createElement("ul");
          if (!parent.li) {
            parent.li = document.createElement("li");
            parent.ul.append(parent.li);
          }
          parent.li.append(ul);
          stack.push({ ul, li: null });
        }
        const li = document.createElement("li");
        li.append(...p.childNodes);
        stack[level].ul.append(li);
        stack[level].li = li;
      });
      first.before(root);
      run.forEach((p) => p.remove());
    });
  }
  function publishedDate(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  var HERO_OPTIONS = "image-slide, text-above, framed, top-18, left-7-5, size-3-5";
  function heroImage(main, document, url) {
    if (!url.includes("legal/icrc")) return;
    const imgs = [...main.querySelectorAll('p > a[href*="media-assets.stryker.com"]')].filter((a) => text4(a) === a.getAttribute("href"));
    if (!imgs.length) return;
    const [first] = imgs;
    const holder = first.parentElement;
    imgs.slice(1).forEach((a) => a.parentElement.remove());
    const cells = imgs.slice(0, 2).map((a) => [a]);
    const kids = [...main.children];
    const hrIdx = kids.findIndex((n) => n.tagName === "HR");
    const title = kids.filter((n, i) => n.matches("h1, p") && (hrIdx < 0 || i < hrIdx) && !n.contains(holder));
    const [heading2, second, ...rest] = title;
    heading2.append(document.createElement("br"), ...second.childNodes);
    second.remove();
    cells.push([[heading2, ...rest]]);
    const hero2 = WebImporter.Blocks.createBlock(document, { name: `Hero Corp (${HERO_OPTIONS})`, cells });
    holder.replaceWith(hero2);
    while (main.firstElementChild?.tagName === "HR") main.firstElementChild.remove();
    main.querySelectorAll("table").forEach((table) => {
      if (text4(table.querySelector("th, tr")) === "Section Metadata" && (text4(table).includes("full-width-image") || text4(table).includes("spacer") && !text4(table).includes("large"))) table.remove();
    });
  }
  function stackContactMap(main, url) {
    if (!url.includes("/hemorrhagic-stroke/mri")) return;
    main.querySelectorAll("table").forEach((table) => {
      const head = table.querySelector("th, td");
      if (/^Columns \(columns[- ]50[- ]50\)$/.test(text4(head))) head.textContent = "Columns (columns 50 50, stack)";
    });
  }
  function committeeColumns(main, document, url) {
    if (!url.includes("governance/board-committees")) return;
    const hrs = [...main.children].filter((n) => n.tagName === "HR");
    if (hrs.length < 7) return;
    const sections = hrs.slice(0, 6).map((hr, i) => {
      const nodes = [];
      let el3 = hr.nextElementSibling;
      for (; el3 && el3 !== hrs[i + 1]; el3 = el3.nextElementSibling) nodes.push(el3);
      return nodes.find((x) => x.tagName === "P");
    });
    const cells = [0, 1, 2].map((k) => [sections[2 * k], sections[2 * k + 1]]);
    for (let n = hrs[0].nextElementSibling; n && n !== hrs[6]; ) {
      const next = n.nextElementSibling;
      n.remove();
      n = next;
    }
    hrs[0].after(WebImporter.Blocks.createBlock(document, { name: "Columns (no-stack, names)", cells: [cells] }));
  }
  var legal_default = {
    // before the importer's own cleanup, which drops empty paragraphs
    preprocess: ({ document }) => {
      keepHeadlineBlankLines(document);
      if (document.querySelector("#publishedDate.hidden")) document.body.setAttribute("data-date-hidden", "");
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const hcp = !!document.querySelector(".g-hcpbanner");
      const published = publishedDate(document);
      if (url.includes("/hemorrhagic-stroke/mri") || url.includes("/sage/disclosure")) {
        main.querySelectorAll(".panel-group").forEach((group) => group.setAttribute("data-divided", ""));
      }
      indentedLists(main, document);
      const columnCount = buildingBlocks(main, document);
      const tableCount = tables(main, document);
      const contactReport = { phones: [] };
      contacts(main, document, contactReport);
      splitStandaloneLinks(main, document);
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const bracketStyles = stripBrackets(main, document);
      committeeColumns(main, document, url);
      stackContactMap(main, url);
      heroImage(main, document, url);
      underlineTitles(main, document);
      dropUnlistedStyles(main);
      blockVariants(main);
      trimEmptyCells(main);
      sectionStyles(main, document, url, bracketStyles);
      edsLinkPaths(main);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute("content")?.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      applyBaseMeta(meta, url, PAGE_TEMPLATE.group);
      if (hcp) meta["hcp-banner"] = "true";
      if (published) {
        meta.published = published;
        meta["last-updated"] = main.hasAttribute("data-date-hidden") ? "false" : "show";
      }
      main.removeAttribute("data-xf-unresolved");
      main.removeAttribute("data-date-hidden");
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
          blocks: [...Array(tableCount).fill("table"), ...Array(columnCount).fill("columns")],
          phones: contactReport.phones
        }
      }];
    }
  };

  // tools/importer/base/patents.js
  var PAGE_TEMPLATE2 = {
    name: "base",
    group: "patents",
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
  var transformers2 = [transform2, transform3];
  function executeTransformers2(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE2 };
    transformers2.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var clean = (s) => (s || "").replace(/[\s\u00a0]+/g, " ").trim();
  var text5 = (el3) => el3 ? clean(el3.textContent) : "";
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function para(document, value) {
    const p = document.createElement("p");
    p.textContent = value;
    return p;
  }
  function publishedDate2(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function pageHero(document, src) {
    const component = src.querySelector(".c-page-hero");
    if (!component) return { nodes: [], rule: false };
    const heading2 = [];
    const copy = [];
    component.querySelectorAll("h1, p").forEach((el3) => {
      if (!text5(el3)) return;
      if (el3.matches("h1")) {
        const h1 = document.createElement("h1");
        const strong = document.createElement("strong");
        strong.textContent = text5(el3);
        const gold = /255\s*,\s*181\s*,\s*0|#ffb500/i.test(el3.getAttribute("style") || "");
        if (gold) {
          const em = document.createElement("em");
          em.append(strong);
          h1.append(em);
        } else h1.append(strong);
        heading2.push(h1);
      } else copy.push(para(document, text5(el3)));
    });
    const media = [];
    const img = component.querySelector("img");
    if (img) {
      const source = img.closest("picture")?.querySelector("source[srcset]");
      const out = document.createElement("img");
      out.src = source ? source.getAttribute("srcset").split(/\s+/)[0] : img.getAttribute("src");
      out.alt = img.getAttribute("alt") || "";
      media.push(out);
    }
    const nodes = media.length ? [...heading2, WebImporter.Blocks.createBlock(document, { name: "Columns (columns-50-50, stack)", cells: [[copy, media]] })] : [...heading2, ...copy];
    return { nodes, rule: !!component.querySelector(".border-bottom-gold") };
  }
  function linkList(document, src) {
    return [...src.querySelectorAll(".c-curated-link-list a[href]")].filter((a) => text5(a)).map((link3) => {
      const href = link3.getAttribute("href");
      const live = AUTHOR_LINKS.reduce((v, [re, to]) => v.replace(re, to), href);
      const a = document.createElement("a");
      a.href = href;
      if (live !== href) a.setAttribute("data-live", live);
      a.textContent = text5(link3);
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
    if (text5(title)) {
      const h1 = document.createElement("h1");
      const strong = document.createElement("strong");
      strong.textContent = text5(title);
      h1.append(strong);
      nodes.push(h1);
    }
    component.querySelectorAll(".description p").forEach((p) => {
      if (text5(p)) nodes.push(para(document, text5(p)));
    });
    if (!nodes.length) return [];
    return [...nodes, sectionMetadata(document, "serif, p-1-5, width-50"), document.createElement("hr")];
  }
  function tables2(document, src) {
    return [...src.querySelectorAll(".c-patenttables table")].map((table) => {
      const rows = [...table.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((td) => text5(td.querySelector(".cell-content") || td))).filter((r) => r.some(Boolean));
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
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text5(p)).map((p) => para(document, text5(p)));
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata(document, "disclaimer")];
  }
  var patents_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate2(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.body;
      const main = document.createElement("div");
      const { nodes: hero2, rule } = pageHero(document, src);
      const links = linkList(document, src);
      const blocks = tables2(document, src);
      if (hero2.length) main.append(...hero2, document.createElement("hr"));
      if (links.length) main.append(...links);
      if (rule && links.length) main.append(sectionMetadata(document, "separator"));
      main.append(...longTextHero(document, src), ...blocks);
      main.append(...disclaimerSection(document, document.body));
      document.body.replaceChildren(main);
      executeTransformers2("afterTransform", main, payload);
      main.querySelectorAll("a[data-live]").forEach((a) => {
        a.setAttribute("href", a.getAttribute("data-live"));
        a.removeAttribute("data-live");
      });
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
      applyBaseMeta(meta, url, PAGE_TEMPLATE2.group);
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
          template: PAGE_TEMPLATE2.name,
          blocks: blocks.length ? Array(blocks.length).fill("table") : [],
          rows: blocks.map((b) => b.querySelectorAll("tr").length - 1)
        }
      }];
    }
  };

  // tools/importer/base/webinar.js
  var PAGE_TEMPLATE3 = {
    name: "base",
    group: "webinar",
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
  var transformers3 = [transform2, transform3];
  function executeTransformers3(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE3 };
    transformers3.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var clean2 = (s) => (s || "").replace(/[\s\u00a0]+/g, " ").trim();
  var text6 = (node) => node ? clean2(node.textContent) : "";
  var GOLD2 = /255\s*,\s*181\s*,\s*0|#ffb500/i;
  function sectionMetadata2(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function el2(document, tag, value) {
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
  function link2(document, source, label) {
    const a = document.createElement("a");
    const href = source.getAttribute("href").trim();
    if (LIVE_PAGES.test(href)) a.setAttribute("data-live", `https://www.stryker.com${href}`);
    const newTab = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    a.href = newTab ? `${href}#_blank` : href;
    a.textContent = label ?? text6(source);
    return a;
  }
  function inline(document, source, tag = "p") {
    const out = document.createElement(tag);
    const walk = (node, into) => node.childNodes.forEach((child) => {
      if (child.nodeType === 3) into.append(child.textContent.replace(/\u00a0/g, " "));
      else if (child.nodeType === 1 && child.matches("a[href]")) into.append(link2(document, child));
      else if (child.nodeType === 1 && !child.matches("br")) walk(child, into);
    });
    walk(source, out);
    out.normalize();
    const { firstChild, lastChild } = out;
    if (firstChild?.nodeType === 3) firstChild.textContent = firstChild.textContent.trimStart();
    if (lastChild?.nodeType === 3) lastChild.textContent = lastChild.textContent.trimEnd();
    out.childNodes.forEach((child) => {
      if (child.nodeType === 3) child.textContent = child.textContent.replace(/\s+/g, " ");
    });
    return out;
  }
  function isGold(source) {
    return GOLD2.test(source.getAttribute("style") || "") || [...source.querySelectorAll("[style]")].some((s) => GOLD2.test(s.getAttribute("style")));
  }
  function heading(document, source, tag) {
    const value = text6(source);
    if (isGold(source)) return wrap(document, el2(document, "strong", value), tag, "em");
    return tag === "h1" ? wrap(document, el2(document, "strong", value), tag) : el2(document, tag, value);
  }
  function publishedDate3(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
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
  function richText2(src) {
    return [...src.querySelectorAll(".c-rich-text-editor")].filter((rte) => !rte.closest(".c-disclaimer, .c-accordion")).flatMap((rte) => [...rte.querySelectorAll("h1, h2, h3, h4, h5, h6, p")]).filter((node) => text6(node));
  }
  function layoutA(document, src) {
    const nodes = richText2(src);
    const h1 = nodes.find((n) => n.matches("h1"));
    const rest = nodes.filter((n) => n !== h1);
    const out = [];
    const thankYou = h1 && isGold(h1);
    if (thankYou) {
      out.push(heading(document, h1, "h1"));
      rest.filter((n) => /^H/.test(n.tagName)).forEach((n) => out.push(el2(document, "h2", text6(n))));
      out.push(sectionMetadata2(document, "h1-1-5, h-serif"), el2(document, "hr"));
      rest.filter((n) => n.matches("p")).forEach((n) => out.push(inline(document, n)));
      out.push(sectionMetadata2(document, "p-1-25"), el2(document, "hr"));
    } else {
      const [speaker, ...copy] = rest;
      if (h1) out.push(heading(document, h1, "h1"));
      if (speaker) out.push(inline(document, speaker));
      out.push(sectionMetadata2(document, "serif"), el2(document, "hr"));
      copy.forEach((n) => out.push(inline(document, n)));
      if (copy.length) out.push(sectionMetadata2(document, "p-1-25"), el2(document, "hr"));
    }
    const block = video(document, src);
    if (block) out.push(block);
    return out;
  }
  function layoutB(document, src) {
    const hero2 = src.querySelector(".c-page-hero");
    const out = [];
    hero2.querySelectorAll("h1, h2").forEach((h) => {
      if (text6(h)) out.push(heading(document, h, h.tagName.toLowerCase()));
    });
    out.push(sectionMetadata2(document, "h-serif"), el2(document, "hr"));
    const block = video(document, src);
    if (block) out.push(block);
    if (hero2.querySelector(".border-bottom-gold")) out.push(sectionMetadata2(document, "separator"));
    const desc = [...src.querySelectorAll(".c-standalone-video .desc-content :is(h1, h2, h3, h4, h5, h6, p)")].filter((n) => text6(n));
    const speakers = desc.filter((n) => /^H/.test(n.tagName));
    const copy = desc.filter((n) => !/^H/.test(n.tagName));
    if (speakers.length) {
      out.push(el2(document, "hr"), ...speakers.map((n) => inline(document, n)));
      out.push(sectionMetadata2(document, "serif, p-1-25"));
    }
    if (copy.length) out.push(el2(document, "hr"), ...copy.map((n) => inline(document, n)));
    return out;
  }
  function image(document, source) {
    const img = document.createElement("img");
    img.src = source.getAttribute("src");
    img.alt = clean2(source.getAttribute("alt"));
    return img;
  }
  function imageTarget(document, source, label) {
    const anchor = source.closest("a[href]");
    if (!anchor) return null;
    const p = document.createElement("p");
    p.append(link2(document, anchor, label));
    return p;
  }
  function layoutC(document, src) {
    const out = [];
    const xf = src.querySelector(".experiencefragment");
    if (xf) {
      xf.querySelectorAll(".c-rich-text-editor p a[href]").forEach((a) => {
        const p = document.createElement("p");
        p.append(link2(document, a));
        out.push(p);
      });
      xf.querySelectorAll(".c-standalone-image img").forEach((img) => {
        const p = document.createElement("p");
        p.append(image(document, img));
        out.push(p);
        const target = imageTarget(document, img, clean2(img.getAttribute("alt")));
        if (target) out.push(target);
      });
      out.push(sectionMetadata2(document, "back-link, image-link"), el2(document, "hr"));
    }
    richText2(src).filter((n) => !n.closest(".experiencefragment")).forEach((n) => {
      if (n.matches("h1")) out.push(heading(document, n, "h1"));
      else if (n.querySelector(".standalone-link") && n.querySelectorAll("a[href]").length === 1) {
        const p = document.createElement("p");
        p.append(link2(document, n.querySelector("a[href]")));
        out.push(p);
      } else if (/^H/.test(n.tagName)) out.push(el2(document, n.tagName.toLowerCase(), text6(n)));
      else out.push(inline(document, n));
    });
    out.push(sectionMetadata2(document, "h1-1-5"));
    src.querySelectorAll(".c-accordion .panel").forEach((panel) => {
      const label = text6(panel.querySelector(".panel-title"));
      const cells = [...panel.querySelectorAll('.panel-body [class*="col-md-"]')].map((col) => {
        const cell = [];
        const img = col.querySelector(".c-standalone-image img");
        const title = text6(col.querySelector(".c-rich-text-editor h4"));
        if (img) {
          const p = document.createElement("p");
          p.append(image(document, img));
          cell.push(p);
          const target = imageTarget(document, img, title || clean2(img.getAttribute("alt")));
          if (target) cell.push(target);
        }
        col.querySelectorAll(".c-rich-text-editor :is(h1, h2, h3, h4, h5, h6, p)").forEach((n) => {
          if (!text6(n)) return;
          if (/^H/.test(n.tagName)) cell.push(wrap(document, el2(document, "strong", text6(n)), "h3"));
          else if (n.querySelector(".standalone-link") && n.querySelectorAll("a[href]").length === 1) {
            const p = document.createElement("p");
            p.append(wrap(document, link2(document, n.querySelector("a[href]")), "strong", "u"));
            cell.push(p);
          } else cell.push(inline(document, n));
        });
        return cell;
      }).filter((cell) => cell.length);
      out.push(el2(document, "hr"));
      if (label) out.push(el2(document, "h2", label));
      if (cells.length) out.push(WebImporter.Blocks.createBlock(document, { name: "Columns (thumb-list)", cells: [cells] }));
      out.push(sectionMetadata2(document, "accordion-panel, image-link, large-labels"));
    });
    return out;
  }
  function disclaimerSection2(document, src) {
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text6(p)).map((p) => el2(document, "p", text6(p)));
    if (!paras.length) return [];
    return [el2(document, "hr"), ...paras, sectionMetadata2(document, "disclaimer")];
  }
  var webinar_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate3(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.querySelector(".main.content") || document.body;
      let layout = "A";
      if (src.querySelector(".c-accordion")) layout = "C";
      else if (src.querySelector(".c-page-hero")) layout = "B";
      const content = { A: layoutA, B: layoutB, C: layoutC }[layout](document, src);
      const main = document.createElement("div");
      main.append(...content, ...disclaimerSection2(document, document.body));
      while (main.lastElementChild?.matches("hr")) main.lastElementChild.remove();
      document.body.replaceChildren(main);
      executeTransformers3("afterTransform", main, payload);
      main.querySelectorAll("a[data-live]").forEach((a) => {
        const hash = a.getAttribute("href").endsWith("#_blank") ? "#_blank" : "";
        a.setAttribute("href", `${a.getAttribute("data-live")}${hash}`);
        a.removeAttribute("data-live");
      });
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
      applyBaseMeta(meta, url, PAGE_TEMPLATE3.group);
      if (published) meta.published = published;
      if (published && showDate) meta["last-updated"] = "show";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = source.pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      const blocks = [...main.querySelectorAll("table")].map((t) => text6(t.querySelector("tr")).toLowerCase()).filter((name) => !/^(section metadata|metadata)$/.test(name));
      return [{
        element: main,
        path,
        report: {
          title: meta.Title || document.title,
          template: PAGE_TEMPLATE3.name,
          layout,
          blocks
        }
      }];
    }
  };

  // tools/importer/base/people.js
  var PAGE_TEMPLATE4 = {
    name: "base",
    group: "people",
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
  var transformers4 = [transform2, transform3];
  function executeTransformers4(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE4 };
    transformers4.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var clean3 = (s) => (s || "").replace(/[\s\u00a0]+/g, " ").trim();
  var text7 = (el3) => el3 ? clean3(el3.textContent) : "";
  function publishedDate4(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function splitName(el3) {
    const full = text7(el3);
    const gold = el3.querySelector('[style*="ffb500" i]');
    if (!gold) return { first: "", last: full };
    const copy = gold.cloneNode(true);
    copy.querySelectorAll('[style*="color"]').forEach((n) => n.remove());
    const first = text7(copy);
    if (!first || !full.startsWith(first)) return { first: "", last: full };
    return { first, last: clean3(full.slice(first.length)) };
  }
  function appendName(document, parent, { first, last }) {
    const strong = document.createElement("strong");
    if (first) {
      const em = document.createElement("em");
      em.textContent = first;
      strong.append(em, last ? " " : "");
    }
    strong.append(last);
    parent.append(strong);
  }
  function sectionMetadata3(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function image2(document, img) {
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
        const el3 = document.createElement(n.nodeName === "B" ? "strong" : n.nodeName.toLowerCase());
        if (n.nodeName === "A") el3.href = n.getAttribute("href");
        copy(n, el3);
        to.append(el3);
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
    return !!span && !!text7(p) && text7(span) === text7(p);
  }
  function disclaimerSection3(document, src) {
    const paras = [
      ...[...src.querySelectorAll(".c-rich-text-editor p")].filter(isDocCode),
      ...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")
    ].map((p) => bioParagraph(document, p)).filter(Boolean);
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata3(document, "disclaimer")];
  }
  function buildBio(document, src, kind) {
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
      role.textContent = text7(roleSpan || roleP);
      nodes.push(role);
      if (roleSpan) {
        const rest = roleP.cloneNode(true);
        rest.querySelector(".fontsize-1-75em").remove();
        const extra = bioParagraph(document, rest);
        if (extra) bio.push(extra);
      }
    }
    nodes.push(sectionMetadata3(document, "serif, p-1-75, h1-1-25"));
    nodes.push(document.createElement("hr"));
    paras.filter((p) => !isDocCode(p)).forEach((p) => {
      const out = bioParagraph(document, p);
      if (out) bio.push(out);
    });
    const imgSrc = rte.closest(".aem-Grid")?.querySelector(".c-standalone-image img") || src.querySelector(".c-standalone-image img");
    const imgCell = imgSrc ? [image2(document, imgSrc)] : [];
    nodes.push(WebImporter.Blocks.createBlock(document, { name: "Columns (columns-58-42)", cells: [[bio, imgCell]] }));
    return nodes;
  }
  function buildTile(document, tile) {
    const img = tile.querySelector(".c-standalone-image img");
    const link3 = tile.querySelector(".standalone-link a[href]") || [...tile.querySelectorAll(".c-rich-text-editor a[href]")].pop();
    const nameEl = tile.querySelector(".c-rich-text-editor .futura-bold");
    const nameP = nameEl && nameEl.closest("p");
    const body = [];
    if (nameEl) {
      const p = document.createElement("p");
      appendName(document, p, splitName(nameEl));
      body.push(p);
    }
    const role = nameP && nameP.querySelector(".urw-egyptienne");
    if (role && text7(role)) {
      const p = document.createElement("p");
      p.textContent = text7(role);
      body.push(p);
    }
    if (link3) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      const u = document.createElement("u");
      a.href = link3.getAttribute("href");
      u.textContent = text7(link3).replace(/^(\S+\s+)(\S)(\S*)/, (m, w, c, r) => `${w}${c.toUpperCase()}${r.toLowerCase()}`);
      a.append(u);
      strong.append(a);
      p.append(strong);
      body.push(p);
    }
    return [img ? [image2(document, img)] : [], body];
  }
  function buildIndex(document, src) {
    const nodes = [];
    const h1Src = src.querySelector("h1");
    const h1 = document.createElement("h1");
    const strong = document.createElement("strong");
    strong.textContent = text7(h1Src);
    h1.append(strong);
    nodes.push(h1);
    h1Src.closest(".c-rich-text-editor").querySelectorAll("p").forEach((p) => {
      if (!text7(p)) return;
      const out = document.createElement("p");
      out.textContent = text7(p);
      nodes.push(out);
    });
    nodes.push(sectionMetadata3(document, "serif, p-2"));
    const items = [...src.querySelectorAll(".c-section-title h2, .buildingblock")];
    const groups = [];
    items.forEach((el3) => {
      if (el3.tagName === "H2") groups.push({ title: text7(el3), tiles: [] });
      else if (groups.length && el3.querySelector(".c-standalone-image img")) {
        groups[groups.length - 1].tiles.push(el3);
      }
    });
    groups.forEach(({ title, tiles }, i) => {
      if (i) nodes.push(document.createElement("hr"), sectionMetadata3(document, "spacer, xxlarge"));
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
  var people_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate4(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const kind = (source.pathname.match(/\/(leaders|directors)\/[^/]+$/) || [])[1];
      const main = document.createElement("div");
      main.append(...kind ? buildBio(document, document.body, kind) : buildIndex(document, document.body), ...disclaimerSection3(document, document.body));
      document.body.replaceChildren(main);
      executeTransformers4("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
      applyBaseMeta(meta, url, PAGE_TEMPLATE4.group);
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
          template: PAGE_TEMPLATE4.name,
          kind: kind || "index",
          "last-updated": published && showDate ? "show" : ""
        }
      }];
    }
  };

  // tools/importer/parsers/accordion.js
  function parse2(element, { document, name = "Accordion" }) {
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
            const el3 = child;
            if (el3.matches("p, ul, ol, h1, h2, h3, h4, h5, h6, picture, img, a")) {
              content.append(el3);
            } else {
              pick(el3);
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

  // tools/importer/base/footnotes.js
  var PAGE_TEMPLATE5 = {
    name: "base",
    group: "footnotes",
    description: 'www.stryker.com Interventional Spine footnotes (#516), base template. Detail pages: the shared "\u276E BACK" link as a Fragment block; the page hero (gold H1, document code subhead in an `h-serif` section) then each revision as a bold label, a bold date line and its numbered references (a `separator` section only when the hero has no subhead). Index: the hero, then an Accordion (divided) in a `separator` section, one row per document (label "<code> <title>"; body: the current-revision lines, references, disclaimer and a bold + italic "View past revisions" link, the gold button). The source document code (.c-disclaimer) closes the page as a `disclaimer` section; `published` and `last-updated: show` give the "Last Updated" line.',
    urls: [
      "https://www.stryker.com/us/en/interventional-spine/footnotes.html",
      "https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html"
    ],
    blocks: [
      { name: "accordion", instances: [".c-accordion .panel-group"] }
    ]
  };
  var BACK_XF = "/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master";
  var transformers5 = [transform2];
  function executeTransformers5(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE5 };
    transformers5.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var clean4 = (s) => (s || "").replace(/[\s\u00a0]+/g, " ").trim();
  var text8 = (el3) => el3 ? clean4(el3.textContent) : "";
  function publishedDate5(document) {
    const value = document.querySelector("#hiddenPublishedDate")?.getAttribute("value") || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function sectionMetadata4(document, style) {
    return WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
  }
  function inlineCopy(document, from, to) {
    const copy = (src, dst) => src.childNodes.forEach((n) => {
      if (n.nodeType === 3) dst.append(document.createTextNode(n.textContent.replace(/\u00a0/g, " ")));
      else if (n.nodeName === "BR") dst.append(document.createElement("br"));
      else if (["A", "STRONG", "B", "EM", "I", "SUP", "SUB"].includes(n.nodeName)) {
        const tag = { B: "strong", I: "em" }[n.nodeName] || n.nodeName.toLowerCase();
        const el3 = document.createElement(tag);
        if (n.nodeName === "A") el3.href = n.getAttribute("href");
        copy(n, el3);
        dst.append(el3);
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
    return !!b && !p.querySelector(".futura-bold") && text8(b) === text8(p);
  };
  function footnoteNodes(document, container) {
    const out = [];
    container.querySelectorAll(":scope > p, :scope > ol, :scope > ul").forEach((src) => {
      if (!text8(src)) return;
      if (src.matches("ol, ul")) {
        const list = document.createElement(src.tagName.toLowerCase());
        src.querySelectorAll(":scope > li").forEach((li) => {
          if (text8(li)) list.append(inlineCopy(document, li, document.createElement("li")));
        });
        out.push(list);
        return;
      }
      const p = document.createElement("p");
      const label = src.querySelector(".futura-bold");
      if (label && text8(label) === text8(src) || isBoldLine(src)) {
        const strong = document.createElement("strong");
        strong.textContent = text8(src);
        p.append(strong);
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
      text: text8,
      richText: (doc, nodes2) => {
        const wrap2 = doc.createElement("div");
        wrap2.setAttribute("data-hero", "");
        wrap2.append(...nodes2);
        return wrap2;
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
    const hasSubhead = heroNodes.some((n) => n.nodeName === "H2");
    nodes.push(...heroNodes);
    if (hasSubhead) nodes.push(sectionMetadata4(document, "h-serif"));
    nodes.push(document.createElement("hr"));
    richTexts(src).filter((box) => !box.closest(".experiencefragment, .c-page-hero")).forEach((box) => nodes.push(...footnoteNodes(document, box)));
    if (rule && !hasSubhead) nodes.push(sectionMetadata4(document, "separator"));
    return nodes;
  }
  function buildIndex2(document, src) {
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
          a.textContent = text8(btn);
          em.append(a);
          strong.append(em);
          p.append(strong);
          content.append(p);
        });
        body.replaceChildren(content);
      });
      const holder = document.createElement("div");
      holder.append(group);
      parse2(group, { document, name: "Accordion (divided)" });
      nodes.push(...holder.childNodes);
    }
    if (rule) nodes.push(sectionMetadata4(document, "separator"));
    return nodes;
  }
  function disclaimerSection4(document, src) {
    const paras = [...src.querySelectorAll(".c-disclaimer p:not(#publishedDate)")].filter((p) => text8(p)).map((p) => inlineCopy(document, p, document.createElement("p")));
    if (!paras.length) return [];
    return [document.createElement("hr"), ...paras, sectionMetadata4(document, "disclaimer")];
  }
  var footnotes_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const published = publishedDate5(document);
      const dateLine = document.querySelector("#publishedDate");
      const showDate = !!dateLine && !dateLine.classList.contains("hidden");
      const meta = WebImporter.Blocks.getMetadata(document);
      const src = document.querySelector('[role="main"]') || document.body;
      const isIndex = !!src.querySelector(".c-accordion .panel-group");
      const main = document.createElement("div");
      main.append(
        ...isIndex ? buildIndex2(document, src) : buildDetail(document, src),
        ...disclaimerSection4(document, document.body)
      );
      document.body.replaceChildren(main);
      executeTransformers5("afterTransform", main, payload);
      stripBrackets(main, document);
      main.appendChild(document.createElement("hr"));
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      meta.site = "corp";
      applyBaseMeta(meta, url, PAGE_TEMPLATE5.group);
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
          template: PAGE_TEMPLATE5.name,
          kind: isIndex ? "index" : "detail",
          "last-updated": published && showDate ? "show" : ""
        }
      }];
    }
  };

  // tools/importer/import-base.js
  var BUILDERS = {
    legal: legal_default,
    patents: patents_default,
    webinar: webinar_default,
    people: people_default,
    footnotes: footnotes_default
  };
  var import_base_default = {
    preprocess: (payload) => BUILDERS[groupOf(payload.url)].preprocess?.(payload),
    transform: (payload) => BUILDERS[groupOf(payload.url)].transform(payload)
  };
  return __toCommonJS(import_base_exports);
})();
