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

  // tools/importer/transformers/corp-text-markers.js
  var STD_DRAFT_IMPORT = typeof STD_DRAFT !== "undefined" && STD_DRAFT === true;
  var STD_REVIEW_IMPORT = STD_DRAFT_IMPORT && typeof STD_REVIEW_PAGES !== "undefined" && STD_REVIEW_PAGES === true;
  function stdProductPage(doc) {
    var _a;
    return STD_DRAFT_IMPORT && ((_a = doc == null ? void 0 : doc.body) == null ? void 0 : _a.getAttribute("data-template")) === "product-detail";
  }
  function stdReviewPage(doc) {
    return STD_REVIEW_IMPORT && stdProductPage(doc);
  }
  var SIZE_WORDS = {
    "0-8": "s",
    "1-25": "l",
    "1-5": "xl",
    "1-75": "xxl",
    2: "xxxl",
    "2-5": "xxxxl"
  };
  var COLOURS = ["gold", "white", "blue", "purple", "teal", "grey", "light-gray"];
  var EXTRA_COLOURS = {
    black: "black",
    "dark-gold": "darkgold",
    "mid-grey": "midgrey",
    "pale-grey": "palegrey"
  };
  var LOOKS = [
    "rule-gold",
    "box-gold",
    "box-blue",
    "box-purple",
    "box-teal",
    "box-dark",
    "box-dark-purple-gradient",
    "box-dark-blue-gradient",
    "box-dark-gold",
    "box-gold-gradient",
    "box-gray-gradient",
    "box-teal-gradient",
    "box-orange-gradient",
    "box-mid-gray",
    "box-pale-gray",
    "box-black"
  ];
  var HEADLINE_STEPS = [1.5, 2, 3, 4.5];
  var STEP_OF = {
    s: 0.8,
    l: 1.25,
    xl: 1.5,
    xxl: 1.75,
    xxxl: 2,
    xxxxl: 2.5
  };
  var stepOff = (w, n) => Math.abs(Math.log(STEP_OF[w] / n));
  var nearestStep = (n) => Object.keys(STEP_OF).reduce((a, b) => stepOff(b, n) < stepOff(a, n) ? b : a);
  var oneSize = (words) => {
    const sizes = words.filter((w) => STEP_OF[w]);
    if (sizes.length < 2) return words;
    const step = nearestStep(sizes.reduce((p, w) => p * STEP_OF[w], 1));
    return [...words.filter((w) => !STEP_OF[w]), step];
  };
  var headlineWord = (n) => {
    const off = (step2) => Math.abs(Math.log(step2 / n));
    const step = HEADLINE_STEPS.reduce((a, b) => off(b) < off(a) ? b : a);
    return `hl${String(step).replace(".", "")}`;
  };
  function markerWords(raw, dropped) {
    return raw.split(",").map((c) => c.trim().toLowerCase()).flatMap((c) => {
      let m = c.match(/^(?:text|size)-(\d+(?:-\d+)?)(?:em)?$/);
      if (m && SIZE_WORDS[m[1]]) return [SIZE_WORDS[m[1]]];
      if (m && m[1] === "1") return [];
      if (m && /^\d+(-\d+)?$/.test(m[1])) {
        const n = Number(m[1].replace("-", "."));
        const steps = Object.keys(SIZE_WORDS).map((k) => [Number(String(k).replace("-", ".")), SIZE_WORDS[k]]);
        const off = ([v]) => Math.abs(Math.log(v / n));
        return [steps.reduce((a, b) => off(b) < off(a) ? b : a)[1]];
      }
      m = c.match(/^(?:headline-(\d+(?:-\d+)?)|size-(\d+(?:-\d+)?)-?vw)$/);
      if (m) return [headlineWord(Number((m[1] || m[2]).replace("-", ".")))];
      m = c.match(/^color-([a-z-]+)$/);
      if (m && COLOURS.includes(m[1])) return [m[1]];
      if (m && EXTRA_COLOURS[m[1]]) return [EXTRA_COLOURS[m[1]]];
      if (c === "serif") return ["serif"];
      if (c === "body-font") return ["body"];
      if (c === "futura-bold") return ["sans"];
      if (c === "std-sans") return ["std-sans"];
      if (LOOKS.includes(c)) return [c];
      dropped.add(c);
      return [];
    });
  }
  var INLINE = /* @__PURE__ */ new Set(["A", "B", "BR", "DEL", "EM", "I", "S", "SPAN", "STRONG", "SUB", "SUP", "U"]);
  var TOKEN = /\[\[([^\][]+)\]|\]/g;
  var containerOf = (node) => {
    let el = node.parentElement;
    while (el && INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  };
  var SIZE_SET = /* @__PURE__ */ new Set([...Object.values(SIZE_WORDS), "hl15", "hl2", "hl3", "hl45"]);
  var COLOUR_SET = /* @__PURE__ */ new Set([...COLOURS, ...Object.values(EXTRA_COLOURS)]);
  function kindOf(word) {
    if (SIZE_SET.has(word)) return "size";
    if (COLOUR_SET.has(word)) return "colour";
    if (["serif", "body", "sans"].includes(word)) return "font";
    return "";
  }
  function convertContainer(nodes, dropped, chains = false) {
    const tokens = [];
    let offset = 0;
    let all = "";
    nodes.forEach((node) => {
      const value = node.nodeValue;
      TOKEN.lastIndex = 0;
      let m = TOKEN.exec(value);
      while (m) {
        const end = m.index + m[0].length;
        tokens.push({
          node,
          start: m.index,
          end,
          at: offset + m.index,
          to: offset + end,
          raw: m[1]
        });
        m = TOKEN.exec(value);
      }
      offset += value.length;
      all += value;
    });
    const stack = [];
    const pairs = [];
    tokens.forEach((t) => {
      if (t.raw !== void 0) {
        stack.push(t);
      } else if (stack.length) {
        const open = stack.pop();
        open.close = t;
        t.pair = open;
        pairs.push(open);
      } else {
        t.literal = true;
      }
    });
    stack.forEach((t) => {
      t.literal = true;
    });
    const between = (a, b) => all.slice(a.to, b.at);
    const gap = (a, b) => (chains ? between(a, b).replace(/\[\[[^\][]+\]|\]/g, "") : between(a, b)).trim() === "";
    pairs.sort((a, b) => a.at - b.at).forEach((p) => {
      p.words = markerWords(p.raw, dropped);
    });
    pairs.forEach((inner) => {
      const outer = pairs.find((o) => o !== inner && o.at < inner.at && o.close.at > inner.close.at && gap(o, inner) && gap(inner.close, o.close));
      if (!outer) return;
      let target = outer;
      while (target.into) target = target.into;
      if (chains) {
        const kinds = inner.words.map(kindOf);
        const innerText = inner.words.some((x) => STEP_OF[x]);
        target.words = target.words.filter((w) => !kindOf(w) || !kinds.includes(kindOf(w)) || innerText && STEP_OF[w]);
      }
      target.words.push(...inner.words);
      inner.merged = true;
      inner.into = target;
    });
    pairs.forEach((p) => {
      p.hadFont = p.words.some((w) => w === "serif" || w === "body");
    });
    pairs.forEach((p) => {
      if (!p.words.includes("std-sans")) return;
      const target = p.merged ? p.into : p;
      if (p.merged) {
        const font = target.words.some((w) => w === "serif" || w === "body") || target.hadFont;
        target.words = target.words.filter((w) => w !== "serif" && w !== "body" && w !== "std-sans");
        if (font) target.words.push("sans");
        return;
      }
      const around = pairs.some((o) => o !== p && o.at < p.at && o.close.at > p.close.at && (o.merged ? o.into : o).words.some((w) => w === "serif" || w === "body"));
      p.words = p.words.filter((w) => w !== "std-sans");
      if (around) p.words.push("sans");
    });
    tokens.filter((t) => !t.literal).sort((a, b) => b.at - a.at).forEach((t) => {
      const open = t.raw !== void 0 ? t : t.pair;
      const unique = [...new Set(oneSize(open.words))];
      const words = [...unique.filter((w) => !/\d/.test(w)), ...unique.filter((w) => /\d/.test(w))];
      let out = "";
      if (!open.merged && words.length) out = t.raw !== void 0 ? `:start-${words.join("-")}:` : ":end:";
      t.node.nodeValue = t.node.nodeValue.slice(0, t.start) + out + t.node.nodeValue.slice(t.end);
    });
  }
  function bracketsToMarkers(main) {
    const doc = main.ownerDocument;
    const walker = doc.createTreeWalker(
      main,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const byContainer = /* @__PURE__ */ new Map();
    let node = walker.nextNode();
    while (node) {
      if (node.nodeValue.includes("[") || node.nodeValue.includes("]")) {
        const container = containerOf(node);
        if (container && !container.closest("code, pre, script, style")) {
          if (!byContainer.has(container)) byContainer.set(container, []);
        }
      }
      node = walker.nextNode();
    }
    const dropped = /* @__PURE__ */ new Set();
    byContainer.forEach((_, container) => {
      const texts = [];
      const tw = doc.createTreeWalker(container, 4);
      let t = tw.nextNode();
      while (t) {
        if (containerOf(t) === container) texts.push(t);
        t = tw.nextNode();
      }
      if (texts.some((x) => x.nodeValue.includes("[["))) convertContainer(texts, dropped, stdProductPage(doc));
      if (!texts.some((x) => x.nodeValue.includes(":start-sans:") || x.nodeValue.includes("-sans:"))) return;
      container.normalize();
      const joined = [];
      const jw = doc.createTreeWalker(container, 4);
      for (let j = jw.nextNode(); j; j = jw.nextNode()) joined.push(j);
      joined.forEach((x) => {
        x.nodeValue = x.nodeValue.replace(
          /:start-sans::start-([a-z0-9-]+):([^:]*?):end::end:/g,
          (all, inner, words) => {
            const list = [.../* @__PURE__ */ new Set([...inner.split("-"), "sans"])];
            const ordered = [...list.filter((w) => !/\d/.test(w)), ...list.filter((w) => /\d/.test(w))];
            return `:start-${ordered.join("-")}:${words}:end:`;
          }
        ).replace(
          /:start-([a-z0-9-]*?)-?sans::start-([a-z0-9-]+):([^:]*?):end::end:/g,
          (all, outer, inner, words) => {
            const list = [.../* @__PURE__ */ new Set([...outer.split("-").filter(Boolean), ...inner.split("-"), "sans"])];
            const ordered = [...list.filter((w) => !/\d/.test(w)), ...list.filter((w) => /\d/.test(w))];
            return `:start-${ordered.join("-")}:${words}:end:`;
          }
        );
      });
    });
    return [...dropped];
  }
  var ADDRESS_GUARD = /((?:https?|urn)\S*?)(:(?:start-[a-z0-9-]+|end):)/gi;
  function keepMarkersReadable(main) {
    if (stdReviewPage(main.ownerDocument)) main.normalize();
    const walker = main.ownerDocument.createTreeWalker(
      main,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    let node = walker.nextNode();
    while (node) {
      ADDRESS_GUARD.lastIndex = 0;
      if (ADDRESS_GUARD.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(ADDRESS_GUARD, "$1 $2");
      node = walker.nextNode();
    }
  }
  function spacesOutsideFormatting(root) {
    const doc = root.ownerDocument;
    [...root.querySelectorAll("strong, b, em, i, u, a")].reverse().forEach((el) => {
      const first = el.firstChild;
      if (first && first.nodeType === 3 && /^[\s\u00a0]+\S/.test(first.nodeValue)) {
        first.nodeValue = first.nodeValue.replace(/^[\s\u00a0]+/, "");
        const prev = el.previousSibling;
        if (!(prev && prev.nodeType === 3 && /[\s\u00a0]$/.test(prev.nodeValue))) el.before(doc.createTextNode(" "));
      }
      const last = el.lastChild;
      if (last && last.nodeType === 3 && /\S[\s\u00a0]+$/.test(last.nodeValue)) {
        last.nodeValue = last.nodeValue.replace(/[\s\u00a0]+$/, "");
        const next = el.nextSibling;
        if (!(next && next.nodeType === 3 && /^[\s\u00a0]/.test(next.nodeValue))) el.after(doc.createTextNode(" "));
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName !== "afterTransform" || !STD_DRAFT_IMPORT) return;
    const dropped = bracketsToMarkers(element);
    keepMarkersReadable(element);
    if (stdProductPage(element.ownerDocument)) spacesOutsideFormatting(element);
    if (payload && dropped.length) payload.textMarkersDropped = dropped;
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
  function videoOptions(element) {
    var _a;
    const box = element.closest(".c-standalone-video") || element.querySelector(".c-standalone-video") || element;
    const options = [];
    if (box.matches(".black-border, .gray-border") && !box.matches(".hide-border")) options.push("border");
    const modifiers = ((_a = element.querySelector("[data-viewermodifiers]")) == null ? void 0 : _a.getAttribute("data-viewermodifiers")) || "";
    if (/(?:^|&)VideoPlayer\.autoplay=1/i.test(modifiers)) options.push("autoplay");
    if (/(?:^|&)VideoPlayer\.loop=1/i.test(modifiers)) options.push("loop");
    return options;
  }
  function parse(element, { document }) {
    const link2 = videoLink(element, document);
    if (!link2) return;
    const cells = [[link2]];
    const options = STD_DRAFT_IMPORT ? videoOptions(element) : [];
    const name = options.length ? `Video (${options.join(", ")})` : "Video";
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells }));
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
      const sans = stdProductPage(document) && title.classList.contains("futura-bold");
      const words = (t) => sans ? `[[futura-bold]${t}]` : t;
      if (titleLink) h3.append(link(document, titleLink, words(clean(titleLink.textContent))));
      else h3.textContent = words(clean(title.textContent));
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

  // tools/importer/slide-position.js
  var SLIDE_SIDES = { "text-left": [6, 50], "text-right": [55, 5], "text-wide": [5, 5] };
  var SLIDE_HEIGHTS = {
    "text-top": 5,
    "text-upper": 18,
    "text-middle": 30,
    "text-lower": 45
  };
  function slidePosition(left, right, top, inset = 0) {
    const options = [];
    let shift = 0;
    if (left !== null && right !== null) {
      const start = left + (100 - left - right) * inset / 100;
      const distance = ([l2, r2]) => inset > 0 ? Math.abs(l2 - start) : Math.abs(l2 - left) + Math.abs(r2 - right);
      const [side, [l, r]] = Object.entries(SLIDE_SIDES).map((entry) => [entry, distance(entry[1])]).sort((a, b) => a[1] - b[1])[0][0];
      options.push(side);
      shift = Math.max(shift, Math.abs(l - left), Math.abs(r - right));
    }
    if (top !== null) {
      const [height, t] = Object.entries(SLIDE_HEIGHTS).sort((a, b) => Math.abs(a[1] - top) - Math.abs(b[1] - top))[0];
      options.push(height);
      shift = Math.max(shift, Math.abs(t - top));
    }
    return { options, shift };
  }

  // tools/importer/hero-corp-std-import.js
  var BOXES = {
    "bg-white": "box-white",
    "bg-gold": "box-gold",
    "bg-blue": "box-blue",
    "bg-light-gray": "box-gray",
    "bg-dark-gray": "box-dark",
    "bg-golden-gradient": "box-gold-gradient",
    "bg-dark-purple-gradient": "box-purple-gradient",
    "bg-dark-blue-gradient": "box-blue-gradient",
    "bg-purple": "box-purple",
    "bg-teal": "box-teal",
    "bg-black": "box-black",
    "bg-lighter-gray": "box-pale-gray",
    "bg-gray": "box-mid-gray",
    "bg-orange": "box-dark-gold",
    "bg-gray-gradient": "box-gray-gradient",
    "bg-dark-teal-gradient": "box-teal-gradient",
    "bg-dark-orange-gradient": "box-orange-gradient"
  };
  var COLOURS2 = [
    [/^(#ffb500|rgba?\(\s*255\s*,\s*181\s*,\s*0\s*(,\s*1\s*)?\))$/i, "gold"],
    [/^(#fff(fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(,\s*1\s*)?\))$/i, "white"],
    [/^(#edeeec|rgba?\(\s*237\s*,\s*238\s*,\s*236\s*(,\s*1\s*)?\))$/i, "light-gray"],
    [/^(#1c5687|rgba?\(\s*28\s*,\s*86\s*,\s*135\s*(,\s*1\s*)?\))$/i, "blue"]
  ];
  var CLASS_COLOURS = {
    "color-gold": "gold",
    "color-white": "white",
    "color-light-gray": "light-gray",
    "color-blue": "blue"
  };
  function colourOf(node, stop) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== stop) {
      const style = el.getAttribute && el.getAttribute("style") || "";
      const m = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (m) {
        const value = m[1].trim();
        const hit = COLOURS2.find(([re]) => re.test(value));
        return hit ? hit[1] : "other";
      }
      const cls = [...el.classList || []].find((c) => CLASS_COLOURS[c]);
      if (cls) return CLASS_COLOURS[cls];
      el = el.parentElement;
    }
    return "";
  }
  function colourOptions(headline2) {
    const counts = { title: {}, subline: {} };
    const doc = headline2.ownerDocument;
    const walker = doc.createTreeWalker(headline2, 4);
    let node = walker.nextNode();
    while (node) {
      const len = node.textContent.trim().length;
      if (len) {
        const bold = !!node.parentElement.closest(".futura-bold, b, strong");
        const role = bold ? "title" : "subline";
        const colour = colourOf(node, headline2) || "black";
        counts[role][colour] = (counts[role][colour] || 0) + len;
      }
      node = walker.nextNode();
    }
    const uniform = STD_DRAFT_IMPORT && stdProductPage(doc);
    return ["title", "subline"].flatMap((role) => {
      const entries = Object.entries(counts[role]).sort((a, b) => b[1] - a[1]);
      const [top] = entries;
      if (uniform && entries.length > 1) return [];
      return top && ["gold", "white", "light-gray", "blue"].includes(top[0]) ? [`${role}-${top[0]}`] : [];
    });
  }
  function sizeBrackets(root) {
    const doc = root.ownerDocument;
    root.querySelectorAll('span[class*="fontsize-"]').forEach((span) => {
      if (!span.textContent.trim()) return;
      const cls = [...span.classList].find((c) => /^fontsize-/.test(c));
      let tag = "";
      let m = cls.match(/^fontsize-(\d+(?:-\d+)?)-?vw$/);
      if (m) tag = `size-${m[1]}-vw`;
      m = cls.match(/^fontsize-(\d+(?:-\d+)?)em$/);
      if (m) tag = `text-${m[1]}`;
      if (!tag || span.querySelector('span[class*="fontsize-"]')) return;
      span.prepend(doc.createTextNode(`[[${tag}]`));
      span.append(doc.createTextNode("]"));
    });
  }
  function slideOptions({
    left,
    right,
    top,
    overlay,
    headline: headline2,
    inset = 0
  }) {
    const options = [...slidePosition(left, right, top, inset).options];
    const boxed = headline2 && headline2.querySelector('.has-background[class*="bg-"]');
    const bg = boxed && [...boxed.classList].find((c) => BOXES[c]) || overlay && BOXES[overlay.getAttribute("data-std-box")] && overlay.getAttribute("data-std-box");
    if (bg) options.push(BOXES[bg]);
    if (headline2) options.push(...colourOptions(headline2));
    if (overlay && overlay.classList.contains("mobile_Bottom")) options.push("mobile-below");
    if (overlay && (overlay.classList.contains("mobile-text-black") || overlay.querySelector(".mobile-text-black"))) options.push("mobile-text-black");
    return options;
  }
  function dropColourTags(lines, colours) {
    if (!colours.size) return;
    const TOKEN2 = /\[\[([^\][]+)\]|\]/g;
    lines.forEach((line) => {
      const doc = line.ownerDocument;
      const walker = doc.createTreeWalker(line, 4);
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      const stack = [];
      const edits = [];
      nodes.forEach((node) => {
        TOKEN2.lastIndex = 0;
        let m = TOKEN2.exec(node.nodeValue);
        while (m) {
          if (m[1] !== void 0) {
            const classes = m[1].split(",").map((c) => c.trim());
            const kept = classes.filter((c) => !colours.has((c.match(/^color-(.+)$/) || [])[1]));
            const token = {
              node,
              start: m.index,
              end: m.index + m[0].length,
              kept,
              changed: kept.length !== classes.length
            };
            stack.push(token);
            if (token.changed) edits.push(token);
          } else if (stack.length) {
            const open = stack.pop();
            if (open.changed && !open.kept.length) {
              edits.push({
                node,
                start: m.index,
                end: m.index + 1,
                kept: null,
                changed: true
              });
            }
          }
          m = TOKEN2.exec(node.nodeValue);
        }
      });
      edits.reverse().forEach((e) => {
        let out = "";
        if (e.kept && e.kept.length) out = `[[${e.kept.join(",")}]`;
        e.node.nodeValue = e.node.nodeValue.slice(0, e.start) + out + e.node.nodeValue.slice(e.end);
      });
    });
  }
  function takeStripe(element) {
    let el = element;
    for (let i = 0; el && i < 6; i += 1) {
      const next = el.nextElementSibling;
      if (next) {
        const panel = next.matches(".fullbleedpanel") ? next.querySelector(".c-full-bleed-panel") : null;
        if (!panel || panel.textContent.replace(/[\s\u00a0]+/g, "") || panel.querySelector("img, iframe")) return "";
        let stripe = "";
        if (panel.classList.contains("bg-gold")) stripe = "stripe-gold";
        else if (panel.classList.contains("bg-golden-gradient")) stripe = "stripe-gradient";
        if (stripe) next.remove();
        return stripe;
      }
      el = el.parentElement;
    }
    return "";
  }
  function slideVideo(slide) {
    const asset = slide.querySelector('.c-standalone-video [data-asset-path], [data-asset-type^="video"][data-asset-path]');
    const path = asset && asset.getAttribute("data-asset-path");
    if (!path || path.startsWith("/content/dam/")) return "";
    const base = "https://media-assets.stryker.com/is";
    return `${base}/content/${path}.m3u8?poster=${base}/image/${path}?fit=constrain,1&wid=909&hei=511`;
  }
  function productSlide(slide, overlay) {
    const ef = slide.querySelector(".experienceFragment-ef");
    const col = ef && ef.querySelector(".standaloneimage");
    if (!overlay || !col) return false;
    const offset = Number((col.className.match(/aem-GridColumn--offset--default--(\d+)/) || [])[1] || 0);
    const width = Number((col.className.match(/aem-GridColumn--default--(\d+)/) || [])[1] || 0);
    const dark = /\bbg-(?!white)[a-z-]+/.test(ef.className);
    return offset >= 5 && width > 0 && offset + width <= 12 && !dark;
  }
  var cleanText = (value) => (value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  function introLine(el) {
    const doc = el.ownerDocument;
    const box = doc.createElement("div");
    [...el.childNodes].forEach((n) => box.append(n.cloneNode(true)));
    const sizeSpan = box.querySelector('[class*="fontsize-"]');
    let size = sizeSpan ? (sizeSpan.className.match(/fontsize-(\d+(?:-\d+)?)em/) || [])[1] || "" : "";
    let tagged = false;
    let serif = !!box.querySelector(".urw-egyptienne");
    let gold = !!box.querySelector('[style*="ffb500" i], [style*="255, 181, 0"], [style*="255,181,0"]');
    const walker = doc.createTreeWalker(box, 4);
    const texts = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
    let open = 0;
    texts.forEach((t) => {
      t.nodeValue = t.nodeValue.replace(/\[\[([^\]]+)\]/g, (m, raw) => {
        open += 1;
        raw.split(",").map((c) => c.trim()).forEach((c) => {
          const s = c.match(/^(?:text|size)-(\d+(?:-\d+)?)$/);
          if (s && !size) {
            [, size] = s;
            tagged = true;
          }
          if (c === "serif") serif = true;
          if (c === "color-gold") gold = true;
        });
        return "";
      });
    });
    for (let i = texts.length - 1; i >= 0 && open > 0; i -= 1) {
      while (open > 0 && texts[i].nodeValue.includes("]")) {
        const at = texts[i].nodeValue.lastIndexOf("]");
        texts[i].nodeValue = texts[i].nodeValue.slice(0, at) + texts[i].nodeValue.slice(at + 1);
        open -= 1;
      }
    }
    box.querySelectorAll("span, font").forEach((span) => span.replaceWith(...span.childNodes));
    box.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (!(node.tagName === "A" && attr.name === "href")) node.removeAttribute(attr.name);
      });
    });
    return {
      node: box,
      size,
      serif,
      gold,
      tagged
    };
  }
  function introCopy(overlay) {
    const doc = overlay.ownerDocument;
    const lines = [...overlay.querySelectorAll("h1, h2, h3, p")].filter((el) => !el.parentElement.closest("h1, h2, h3, p") && !el.closest(".curatedcta, .buttonset, .c-curatedcta") && cleanText(el.textContent.replace(/\[\[[^\]]+\]|\]/g, "")));
    let title = false;
    return lines.map((el) => {
      const line = introLine(el);
      let tag = "p";
      if (/^H[1-3]$/.test(el.tagName)) tag = title ? "h2" : "h1";
      if (tag === "h1") title = true;
      const out = doc.createElement(tag);
      if (tag === "h1") {
        line.node.querySelectorAll("strong, b").forEach((s) => s.replaceWith(...s.childNodes));
        const strong = doc.createElement("strong");
        const inner = line.gold ? doc.createElement("em") : strong;
        while (line.node.firstChild) inner.append(line.node.firstChild);
        if (inner !== strong) strong.append(inner);
        out.append(strong);
      } else {
        while (line.node.firstChild) out.append(line.node.firstChild);
      }
      let size = Number((line.size || "1").replace("-", "."));
      if (line.tagged) size = size * 14 / ({ h1: 28, h2: 24.5 }[tag] || 14);
      const words = [];
      if (Math.abs(size - 1) >= 0.1) words.push(`text-${String(Math.round(size * 100) / 100).replace(".", "-")}`);
      if (line.serif && tag === "p") words.push("serif");
      if (words.length) {
        out.prepend(doc.createTextNode(`[[${words.join(",")}]`));
        out.append(doc.createTextNode("]"));
      }
      return out;
    });
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
    if (STD_DRAFT_IMPORT) {
      const right = box && /\bpull-right\b/.test(box.className);
      options.splice(1, options.length - 1, "framed", right ? "text-right" : "text-left", "text-top");
      if (headline2) options.push(...colourOptions(headline2));
      const first = content[0];
      if (m && first) {
        first.prepend(document.createTextNode(`[[size-${m[1]}-vw]`));
        first.append(document.createTextNode("]"));
      }
    }
    const name = `Hero Corp (${options.join(", ")})`;
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
  }

  // tools/block-options/options.js
  var SECTION_OPTIONS = {
    label: "Section",
    // older section style names read as the standard choices (replaced when the author copies the
    // section's style): today's bg-* bands are a background + full width, a dimensional box is a
    // white background with a soft shadow, the old dividers are the line above
    aliases: {
      "bg-white": ["box-white", "full-bleed"],
      "bg-light-gray": ["box-gray", "full-bleed"],
      "light-gray": ["box-gray", "full-bleed"],
      "bg-gold": ["box-gold", "full-bleed"],
      gold: ["box-gold", "full-bleed"],
      "bg-blue": ["box-blue", "full-bleed"],
      blue: ["box-blue", "full-bleed"],
      "bg-purple": ["box-purple", "full-bleed"],
      purple: ["box-purple", "full-bleed"],
      "bg-teal": ["box-teal", "full-bleed"],
      "bg-dark-gray": ["box-dark", "full-bleed"],
      dark: ["box-dark", "full-bleed"],
      "bg-golden-gradient": ["box-gold-gradient", "full-bleed"],
      "gold-gradient": ["box-gold-gradient", "full-bleed"],
      "bg-dark-orange-gradient": ["box-orange-gradient", "full-bleed"],
      "bg-dark-teal-gradient": ["box-teal-gradient", "full-bleed"],
      "bg-gray-gradient": ["box-gray-gradient", "full-bleed"],
      "bg-black": ["box-black", "full-bleed"],
      "bg-lighter-gray": ["box-pale-gray", "full-bleed"],
      "bg-orange": ["box-dark-gold", "full-bleed"],
      "bg-dark-blue-gradient": ["box-blue-gradient", "full-bleed"],
      "bg-dark-purple-gradient": ["box-purple-gradient", "full-bleed"],
      "purple-gradient": ["box-purple-gradient", "full-bleed"],
      // the same stryker.com colours under the older migration's names (exact, never the nearest):
      // bg-silver and bg-gray are stryker.com's bg-gray (mid grey #b2b4ae), bg-dark-gold its
      // bg-orange (#af6d04)
      "bg-silver": ["box-mid-gray", "full-bleed"],
      "bg-gray": ["box-mid-gray", "full-bleed"],
      "gray-gradient": ["box-gray-gradient", "full-bleed"],
      "bg-dark-gold": ["box-dark-gold", "full-bleed"],
      boxed: ["box-white", "shadow"],
      "shadow-box": ["box-white", "shadow"],
      "gradient-inverse": ["gradient-reverse"],
      "gradient-top-to-bottom": ["gradient-up"],
      center: ["text-center"],
      "col-8": ["narrow"],
      "col-8-centre": ["narrow"],
      "col-10": ["narrow"],
      "column-10-12": ["narrow"],
      // the line above is `divider`, the patients section style; `line-above` was its review name
      "line-above": ["divider"],
      separator: ["divider"],
      "separator-row": ["divider"]
    },
    groups: [
      {
        id: "side",
        label: "Side by side",
        options: [
          ["", "No (one under the other)"],
          ["flex", "Equal parts", { needs: ["parts-2+"], hint: "The parts of the section side by side in equal widths from 600px" }],
          ["flex flex-67-33", "Wide + narrow (2/3 + 1/3)", { needs: ["parts-2+"], hint: "The first parts two thirds wide, the last part one third" }],
          ["flex flex-33-67", "Narrow + wide (1/3 + 2/3)", { needs: ["parts-2+"], hint: "The first part one third wide, the others two thirds" }]
        ]
      },
      {
        id: "side-phones",
        label: "On phones",
        flags: [
          ["flex-row-mobile", "Side by side on phones too", { needs: ["flex"], hint: "The row never stacks (e.g. social icons)" }]
        ]
      },
      {
        id: "background",
        label: "Background",
        options: [
          ["", "None"],
          ["box-white", "White", { hint: "A white box around the section\u2019s content" }],
          ["box-gray", "Light grey", { hint: "A light grey box around the section\u2019s content" }],
          ["box-gold", "Gold", { hint: "A gold box around the section\u2019s content" }],
          ["box-blue", "Blue", { hint: "A blue box, white text" }],
          ["box-purple", "Purple", { hint: "A purple box, white text" }],
          ["box-teal", "Teal", { hint: "A teal box, white text" }],
          ["box-dark", "Dark grey", { hint: "A dark grey box, white text" }],
          ["box-gold-gradient", "Gold gradient", { hint: "Dark gold into gold" }],
          ["box-blue-gradient", "Dark slate gradient", { hint: "stryker.com dark blue gradient: dark grey into slate, so it looks close to dark grey; white text" }],
          ["box-purple-gradient", "Purple gradient", { hint: "Dark grey into plum, white text" }],
          ["box-black", "Black", { hint: "A black box around the section\u2019s content" }],
          ["box-pale-gray", "Pale grey", { hint: "A pale grey box around the section\u2019s content" }],
          ["box-mid-gray", "Mid grey", { hint: "A mid grey box around the section\u2019s content" }],
          ["box-dark-gold", "Dark gold", { hint: "A dark gold box around the section\u2019s content, white text" }],
          ["box-gray-gradient", "Grey gradient", { hint: "A grey gradient box around the section\u2019s content, white text" }],
          ["box-teal-gradient", "Dark teal gradient", { hint: "A dark teal gradient box around the section\u2019s content, white text" }],
          ["box-orange-gradient", "Dark orange gradient", { hint: "A dark orange gradient box around the section\u2019s content, white text" }]
        ]
      },
      {
        id: "background-look",
        label: "The background",
        flags: [
          ["full-bleed", "Full width (a band)", { needs: ["background"], hint: "The background runs to the page edges, the content stays in the page width" }],
          ["shadow", "Soft shadow", { needs: ["background"], hint: "A soft shadow around the box (stryker.com dimensional box)" }]
        ]
      },
      {
        id: "gradient",
        label: "Gradient direction",
        options: [
          ["", "Left to right"],
          ["gradient-reverse", "Right to left", { needs: ["gradient"] }],
          ["gradient-up", "Bottom to top", { needs: ["gradient"] }]
        ]
      },
      {
        id: "text",
        label: "Text and width",
        flags: [
          ["text-center", "Centred text", { hint: "The section\u2019s text centred" }],
          ["narrow", "Narrow column", { hint: "The content in the centred 8/12 column from 600px (full width on phones)" }],
          ["divider", "Line above (divider)", { hint: "A grey line above the section, as wide as the content; more space around it is a spacer section" }]
        ]
      },
      {
        id: "buttons",
        label: "Buttons",
        options: [
          ["", "As authored (gold, teal)"],
          ["btn-purple", "Purple", { needs: ["buttons"], hint: "The section\u2019s buttons in purple" }],
          ["btn-blue", "Blue", { needs: ["buttons"], hint: "The section\u2019s buttons in blue" }]
        ]
      },
      {
        id: "show",
        label: "Show on",
        options: [
          ["", "Desktop and phones"],
          ["desktop-only", "Desktop only", { hint: "Hidden on phones (under 600px)" }],
          ["mobile-only", "Phones only", { hint: "Hidden from 600px" }]
        ]
      },
      {
        id: "role",
        label: "Section is",
        options: [
          ["", "A normal section"],
          ["tab-panel", "A tab", { needs: ["heading-first"], hint: "Its first heading is the tab label; tab sections in a row make one tab set" }],
          ["accordion-panel", "An accordion panel", { needs: ["heading-first"], hint: "Its heading is the label; panel sections in a row make one accordion" }],
          ["carousel", "A carousel slide", { needs: ["slide-block"], hint: "Slide sections in a row make one carousel" }]
        ]
      },
      {
        id: "accordion",
        label: "Accordion panel",
        flags: [
          ["accordion-open", "Starts open", { needs: ["accordion-panel"], hint: "The panel is open when the page loads" }]
        ]
      },
      {
        id: "carousel",
        label: "Carousel",
        flags: [
          ["autoplay", "Autoplay (5 seconds)", { needs: ["carousel"], hint: "The slides move on by themselves; set on the slides of one carousel" }],
          ["fade", "Cross-fade", { needs: ["carousel"], hint: "The slides fade instead of sliding" }],
          ["split", "Split slide", { needs: ["carousel", "columns-block"], hint: "An image beside a title on a coloured band (a Columns row)" }]
        ]
      },
      {
        id: "band",
        label: "Split slide band",
        options: [
          ["", "Purple gradient (default)"],
          ["box-blue-gradient", "Dark slate gradient", { needs: ["split"], hint: "stryker.com dark blue gradient: dark grey into slate, so it looks close to dark grey" }],
          ["box-dark", "Dark grey", { needs: ["split"] }]
        ]
      }
    ]
  };

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
    // data-btn-style / data-section-style: the section style a link / a paragraph asks for
    // (buildArticle adds it to its section)
    A: ["href", "data-btn-style"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"],
    P: ["data-section-style"],
    LI: ["data-section-style"]
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
    let size = SIZE_STYLES.find(([cls]) => covers(cls));
    const doc = root.ownerDocument || root;
    const nested = STD_DRAFT_IMPORT && stdProductPage(doc) ? SIZE_STYLES.filter(([cls, style]) => /^p-\d/.test(style) && covers(cls)) : [];
    if (nested.length > 1) {
      const em = ([, style]) => Number(style.slice(2).replace("-", "."));
      const product = nested.reduce((p, s) => p * em(s), 1);
      const off = (s) => Math.abs(Math.log(em(s) / product));
      size = SIZE_STYLES.filter(([, style]) => /^p-\d/.test(style)).reduce((a, b) => off(b) < off(a) ? b : a);
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
      if (!text3(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text3(block) === text3(b)) return;
      block.setAttribute("data-section-style", "body-font-bold");
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
    const product = stdReviewPage(root.ownerDocument);
    const squash = (value) => (product ? value.replace(/\[\[[^\][]+\]|\]/g, "") : value).replace(/[\s\u00a0]+/g, "");
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
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (el.tagName === tag) return true;
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
  function regularText(el, root) {
    const walker = root.ownerDocument.createTreeWalker(el, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const bold = t.nodeValue.trim() && t.parentElement.closest(".futura-bold, b, strong");
      if (bold && root.contains(bold)) return false;
    }
    return true;
  }
  function tagGoldText(root, { regular = false } = {}) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap = (nodes) => markGold(nodes, root);
    const wrapRun = (nodes) => {
      nodes.filter((n) => n.nodeType === 1).forEach((n) => tagged.add(n));
      wrap(nodes);
    };
    root.querySelectorAll('[style*="color"]').forEach((el) => {
      if (!GOLD.test(ownColour(el)) || [...tagged].some((t) => t.contains(el))) return;
      if (regular && !hasOtherColour(el) && regularText(el, root)) {
        el.setAttribute("data-gold-regular", "");
        return;
      }
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
  var STD_COLOURS = {
    "1c5687": "blue",
    "85458a": "purple",
    "4c7d7a": "teal",
    545857: "grey",
    ffffff: "white",
    edeeec: "light-gray",
    af6d04: "dark-gold",
    b2b4ae: "mid-grey",
    dfe1de: "pale-grey"
  };
  function hexOf(value) {
    const v = (value || "").trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) return m[1].split("").map((c) => c + c).join("");
    m = v.match(/^#([0-9a-f]{6})$/);
    if (m) return m[1];
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("") : "";
  }
  function tagStdColours(root, { gold = false } = {}) {
    const coloured = (el) => ownColour(el) !== "";
    const nearest = (node) => {
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (el.matches('[style*="color"]') && coloured(el)) return el;
      }
      return null;
    };
    const owners = /* @__PURE__ */ new Set();
    const walker = root.ownerDocument.createTreeWalker(root, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const owner = t.nodeValue.trim() && nearest(t);
      if (owner) owners.add(owner);
    }
    const tagged = [];
    const depth = (el) => {
      let n = 0;
      for (let e = el; e && e !== root; e = e.parentElement) n += 1;
      return n;
    };
    [...owners].sort((x, y) => depth(x) - depth(y)).forEach((el) => {
      const hex = hexOf(ownColour(el));
      const goldRun = GOLD.test(ownColour(el)) && (gold || el.hasAttribute("data-gold-regular"));
      el.removeAttribute("data-gold-regular");
      const name = (goldRun ? "gold" : STD_COLOURS[hex]) || (/^(000000|323232)$/.test(hex) && tagged.some((t) => t.contains(el)) ? "black" : "");
      if (!name || !goldRun && GOLD.test(ownColour(el))) return;
      bracketTag([el], `color-${name}`, root);
      tagged.push(el);
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
    tagGoldText(root, { regular: stdReviewPage(doc) });
    if (stdProductPage(doc)) tagStdColours(root);
    tagTextSize(root);
    if (stdProductPage(doc)) {
      root.querySelectorAll("li").forEach((li) => {
        const links = li.querySelectorAll("a[href]");
        if (links.length !== 1 || text3(li) !== text3(links[0])) return;
        links[0].querySelectorAll("b, strong").forEach((bold) => bold.replaceWith(...bold.childNodes));
      });
    }
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
    if (STD_DRAFT_IMPORT) {
      const squash = (t) => (t || "").replace(/[\s\u00a0]+/g, "");
      root.querySelectorAll("h2").forEach((h) => {
        const bolds = [...h.querySelectorAll("span.futura-bold")].filter((el) => !el.parentElement.closest(".futura-bold"));
        const sized = h.querySelector('[class*="fontsize-"]') || h.closest('[class*="fontsize-"]') || /\[\[[^\]]*\b(text|headline|size)-/.test(h.textContent) || h.querySelector('[style*="color"]') || h.closest('[style*="color"]');
        if (!sized && bolds.length && squash(bolds.map((el) => el.textContent).join("")) === squash(h.textContent)) {
          bolds.forEach(unwrap);
        }
      });
    }
    if (stdProductPage(root.ownerDocument)) {
      root.querySelectorAll("span.futura-bold").forEach((el) => {
        if (el.parentElement.closest(".futura-bold") || !el.textContent.trim()) return;
        el.prepend(root.ownerDocument.createTextNode("[[std-sans]"));
        el.append(root.ownerDocument.createTextNode("]"));
      });
    }
    root.querySelectorAll("span.futura-bold").forEach((el) => rename(el, "strong"));
    root.querySelectorAll("b").forEach((el) => rename(el, "strong"));
    root.querySelectorAll("i").forEach((el) => rename(el, "em"));
    goldBoldItalic(root);
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
      if (stdProductPage(root.ownerDocument) && h.querySelector("u")) return;
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
  function headingSpanSizes(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const sizes = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      const spans = [...h.querySelectorAll('[class*="fontsize-"]')].filter((span) => /\bfontsize-\d+(?:-\d+)?em\b/.test(span.className) && !span.parentElement.closest('[class*="fontsize-"]'));
      const classes = new Set(spans.map((span) => span.className.match(/\bfontsize-(\d+(?:-\d+)?)em\b/)[1]));
      if (classes.size !== 1 || squash(spans.map((span) => span.textContent).join("")) !== squash(h.textContent)) return;
      let [n] = [...classes];
      if (spans.length === 1 && stdReviewPage(root.ownerDocument)) {
        let factor = 1;
        let span = spans[0];
        while (span) {
          const m = span.className.match(/\bfontsize-(\d+)(?:-(\d+))?em\b/);
          if (m) factor *= m[1] === "8" && !m[2] ? 0.8 : Number(`${m[1]}.${m[2] || 0}`);
          const outer = span;
          span = [...outer.querySelectorAll('[class*="fontsize-"]')].find((inner) => /\bfontsize-\d+(?:-\d+)?em\b/.test(inner.className) && squash(inner.textContent) === squash(h.textContent) && inner.parentElement.closest('[class*="fontsize-"]') === outer);
        }
        const STEPS = ["0-8", "1", "1-25", "1-5", "1-75", "2", "2-5"];
        const off = (step) => Math.abs(Math.log(Number(step.replace("-", ".")) / factor));
        n = STEPS.reduce((x, y) => off(y) < off(x) ? y : x).replace("0-8", "8");
        if (n === "1") return;
      }
      sizes.set(h, `text-${n === "8" ? "0-8" : n}`);
    });
    return sizes;
  }
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
    const spanSizes = STD_DRAFT_IMPORT ? headingSpanSizes(box) : /* @__PURE__ */ new Map();
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    const { centred, size } = cleanRichText(box);
    const nodes = blockNodes(box, doc);
    nodes.forEach((node) => {
      if (plainBold.has(node)) node.boldBody = true;
      if (serifHeads.has(node)) node.serifHeading = true;
      if (smallHeads.has(node)) node.headingStyle = smallHeads.get(node);
      if (spanSizes.has(node)) node.stdHeadingSize = spanSizes.get(node);
      if (node.stdHeadingSize && !node.headingStyle && /^H[1-3]$/.test(node.tagName)) {
        node.prepend(doc.createTextNode(`[[${node.stdHeadingSize}]`));
        node.append(doc.createTextNode("]"));
      }
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
    const minor = el.matches("h4, h5, h6") ? el : el.querySelector(":scope > h4, :scope > h5, :scope > h6");
    const futuraHeading = !!minor && STD_DRAFT_IMPORT && stdReviewPage(el.ownerDocument) && !minor.querySelector(".urw-egyptienne");
    const serif = squash(bold) !== squash(el.textContent) && !futuraHeading;
    if (futuraHeading && squash(bold) !== squash(minor.textContent)) {
      const wrap = el.ownerDocument.createElement("span");
      wrap.className = "futura-bold";
      wrap.append(...minor.childNodes);
      minor.append(wrap);
    }
    const LEVEL_SIZES = {
      H1: "text-2",
      H2: "text-1-75",
      H3: "text-1-5",
      H4: "text-1-25"
    };
    const levelSize = !size && STD_DRAFT_IMPORT && stdProductPage(el.ownerDocument) ? LEVEL_SIZES[el.tagName] : "";
    return [size ? `headline-${size}` : levelSize || "", serif ? "serif" : ""].filter(Boolean).join(",");
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
    if (STD_DRAFT_IMPORT && bg && SECTION_OPTIONS.aliases[`bg-${bg}`]) return `headline-box, bg-${bg}`;
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
      if (/^[“”"‘’']+$/.test(text3(strong)) && strong.querySelector(".gold-text")) {
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
  function stdFragmentText(sections) {
    const sizes = new Map(SIZE_STYLES.filter(([, style]) => /^p-\d/.test(style)).map(([cls, style]) => [style, (SIZE_TAGS.find(([c]) => c === cls) || [])[1]]));
    sections.forEach((section) => {
      const styles = (section.style || "").split(", ").filter(Boolean);
      const size = styles.find((st) => sizes.get(st));
      if (!size) return;
      section.nodes.filter((n) => n.nodeType === 1).forEach((node) => {
        const lines = node.matches("p, li") ? [node] : [...node.querySelectorAll("p, li")];
        lines.filter((line) => text3(line) && !line.querySelector("p, li")).forEach((line) => bracketTag([...line.childNodes], sizes.get(size), line));
      });
      section.style = styles.filter((st) => st !== size).join(", ") || void 0;
    });
    const isIcon = (section) => /^image-link(, center)?$/.test(section.style || "") && section.nodes.length === 2 && /\b(icon|logo)\b/i.test(text3(section.nodes[1]));
    for (let i = 0; i < sections.length - 1; i += 1) {
      if (isIcon(sections[i]) && isIcon(sections[i + 1])) {
        let n = i + 1;
        while (sections[n] && isIcon(sections[n])) {
          sections[i].nodes.push(...sections[n].nodes);
          n += 1;
        }
        sections.splice(i + 1, n - i - 1);
        sections[i].style = "flex, flex-row-mobile, image-link";
      }
    }
  }
  var STD_TEMPLATE_LOOKS = [
    "disclaimer",
    "references-spaced",
    "references-body-lines",
    "contact-aside",
    "connect-band",
    "bu-resources",
    "talent-banner",
    "curated-cta",
    "back-link",
    "link-list",
    "cta-inset",
    "standalone-url"
  ];
  var STD_SECTION_STYLES = /* @__PURE__ */ new Set([
    ...SECTION_OPTIONS.groups.flatMap((g) => (g.options || g.flags).flatMap(([value]) => value.split(/[\s,]+/))).filter(Boolean),
    ...STD_TEMPLATE_LOOKS
  ]);
  var SIZE_CLASS = (n) => n === "1" ? "" : `text-${n === "8" ? "0-8" : n}`;
  var STD_TEXT_LOOKS = [
    [/^p-(\d+(?:-\d+)?)$/, () => "p, li", (m) => SIZE_CLASS(m[1]), "size"],
    [/^h([1-6])-(\d+(?:-\d+)?)$/, (m) => `h${m[1]}`, (m) => SIZE_CLASS(m[2]), "size"],
    [/^h-(\d+(?:-\d+)?)$/, () => "h2, h3", (m) => SIZE_CLASS(m[1]), "size"],
    [
      /^label-(\d+(?:-\d+)?)$/,
      () => "p:has(> strong:only-child)",
      (m) => SIZE_CLASS(m[1]),
      "size"
    ],
    [/^h-serif$/, () => "h2, h3", () => "serif", "font"],
    [/^serif$/, () => "p, li", () => "serif", "font"],
    [/^bold-body$/, () => "p, li", () => "body-font", "bold"]
  ];
  var TAGGED = {
    size: /\[\[[^\]]*\b(text|size|headline)-\d/,
    font: /\[\[[^\]]*\b(serif|body-font|futura-bold)\b/,
    bold: /\[\[[^\]]*\bbody-font\b/
  };
  function bodyFontBold(line) {
    [...line.querySelectorAll("strong, b")].filter((b) => !b.parentElement.closest("strong, b")).forEach((b) => bracketTag([b], "body-font", line));
  }
  function stdSectionStyle(section, labels) {
    const styles = (section.style || "").split(",").map((st) => st.trim()).filter(Boolean);
    const elements = section.nodes.filter((n) => n.nodeType === 1 && n.tagName !== "TABLE");
    const lines = (selector) => elements.flatMap((n) => [...n.matches(selector) ? [n] : [], ...n.querySelectorAll(selector)]).filter((line) => !line.closest("table") && text3(line) && !line.querySelector("p, li"));
    const out = [];
    const boxed = styles.includes("headline-box");
    styles.forEach((st) => {
      if (st === "headline-box") {
        const coloured = styles.some((o) => o !== st && SECTION_OPTIONS.aliases[o]);
        const doc = elements[0] && elements[0].ownerDocument;
        if (!coloured && !stdProductPage(doc)) out.push("box-white");
        return;
      }
      if (st === "body-font-bold") {
        labels.forEach(bodyFontBold);
        return;
      }
      const look = STD_TEXT_LOOKS.find(([re]) => re.test(st));
      if (look) {
        const [re, selector, cls, prop] = look;
        const m = st.match(re);
        const tag = cls(m);
        if (tag) {
          const own = (line) => TAGGED[prop].test(line.textContent);
          lines(selector(m)).filter((line) => !own(line)).forEach((line) => {
            if (prop === "bold") bodyFontBold(line);
            else bracketTag([...line.childNodes], tag, line);
          });
        }
        return;
      }
      const alias = SECTION_OPTIONS.aliases[st];
      if (alias) out.push(...boxed ? alias.filter((a) => a !== "full-bleed") : alias);
      else if (STD_SECTION_STYLES.has(st)) out.push(st);
    });
    return [...new Set(out)].join(", ");
  }
  function stdDropSpacers(sections) {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const sec = sections[i];
      if (sec.kind === "spacer" && !sec.nodes.length && !sec.keepSpacer) {
        const next = sections.slice(i + 1).find((s) => s.nodes.length);
        if (sec.anchor && next) next.anchor = [sec.anchor, next.anchor].filter(Boolean).join(", ");
        if (/\b(separator|divider)\b/.test(sec.style || "") && next) {
          next.style = ["separator", next.style].filter(Boolean).join(", ");
        }
        if (!sec.anchor || next) sections.splice(i, 1);
      }
    }
  }
  var SPACER_STEPS = [[0, ""], [30, "spacer"], [60, "spacer, large"], [90, "spacer, xlarge"], [120, "spacer, xxlarge"]];
  function spacerStep(px) {
    const off = ([step]) => Math.abs(step - px);
    return SPACER_STEPS.reduce((best, step) => off(step) < off(best) ? step : best)[1];
  }
  function sizeBandSpacers(sections) {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const sec = sections[i];
      if (sec.keepSpacer) {
        const style = spacerStep(sec.spacePx);
        if (style) sec.style = style;
        else sections.splice(i, 1);
      }
    }
  }
  function buildArticle(element, {
    keep = "",
    spacer = true,
    componentStyle = null,
    stdText = false
  } = {}) {
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
          if (component.hasAttribute("data-std-spacer") && style) {
            sections.push({
              kind: "spacer",
              style,
              nodes: [],
              keepSpacer: true,
              spacePx: Number(component.getAttribute("data-std-spacer")) || 0
            });
            current = null;
            return;
          }
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
        const anchor = STD_DRAFT_IMPORT ? component.getAttribute("data-anchor") : null;
        sections.push(__spreadValues({
          kind: "spacer",
          style: separatorNext ? `${separatorNext}, spacer` : "spacer",
          nodes: []
        }, anchor ? { anchor } : {}));
        separatorNext = false;
        current = null;
        return;
      }
      if (component.matches(".c-autocarousel")) {
        const ambient = stdReviewPage(doc) && [...component.querySelectorAll("[data-asset-path]")].some((el) => !el.getAttribute("data-asset-path").startsWith("/content/dam/"));
        if (!component.querySelector("img") && !ambient) return;
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
          if (stdProductPage(doc) && heading.classList.contains("border-bottom-gold")) {
            const u = doc.createElement("u");
            u.append(...h2.childNodes);
            h2.append(u);
          }
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
      while (sections[i].kind === "spacer" && sections[i].style === "spacer" && !sections[i].keepSpacer && sections[i + n] && sections[i + n].kind === "spacer" && sections[i + n].style === "spacer" && !sections[i + n].keepSpacer && n < 4) n += 1;
      if (n > 1) {
        const anchors = sections.slice(i, i + n).map((sec) => sec.anchor).filter(Boolean);
        if (anchors.length) sections[i].anchor = anchors.join(", ");
        sections.splice(i + 1, n - 1);
        sections[i].style = `spacer, ${SIZES[n - 1]}`;
      }
    }
    if (stdText) stdFragmentText(sections);
    if (STD_DRAFT_IMPORT) stdDropSpacers(sections);
    if (STD_DRAFT_IMPORT) sizeBandSpacers(sections);
    const out = [];
    sections.filter((section) => section.nodes.length || section.kind === "spacer").forEach((section, i) => {
      if (i > 0) out.push(doc.createElement("hr"));
      out.push(...section.nodes);
      const MARKS = ["data-btn-style", "data-section-style"];
      const markSelector = MARKS.map((m) => `[${m}]`).join(", ");
      const marked = section.nodes.flatMap((node) => node.nodeType === 1 ? [...node.matches(markSelector) ? [node] : [], ...node.querySelectorAll(markSelector)] : []);
      const markStyles = marked.flatMap((el) => MARKS.map((m) => el.getAttribute(m)).filter(Boolean));
      [...new Set(markStyles)].forEach((style) => {
        if ((section.style || "").split(", ").includes(style)) return;
        section.style = [section.style, style].filter(Boolean).join(", ");
      });
      if (STD_DRAFT_IMPORT && !section.keepSpacer) {
        const labels = marked.filter((el) => el.getAttribute("data-section-style") === "body-font-bold");
        section.style = stdSectionStyle(section, labels) || void 0;
      }
      marked.forEach((el) => MARKS.forEach((m) => el.removeAttribute(m)));
      section.nodes.forEach((node) => {
        if (node.nodeType === 1) node.removeAttribute("data-keep");
      });
      if (section.style || section.anchor) {
        const cells = section.style ? { style: section.style } : {};
        if (section.anchor) cells.anchor = section.anchor;
        out.push(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells }));
      }
    });
    element.replaceChildren(...out);
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
    const lineEls = [...overlay.querySelectorAll(".line")];
    let lines = headings.length ? headings : [...overlay.querySelectorAll(".line, p")];
    const product = STD_DRAFT_IMPORT && stdProductPage(document);
    if (headings.length && lineEls.length && product) {
      lines = lineEls.flatMap((line) => {
        const parts = [...line.querySelectorAll("h1, h2, h3, h4, h5, h6, p")].filter((el) => !el.parentElement.closest("h1, h2, h3, h4, h5, h6, p"));
        return parts.length ? parts : [line];
      });
    } else if (!headings.length && lineEls.length && product && stdReviewPage(document)) {
      lines = lineEls.flatMap((line) => {
        const parts = [...line.querySelectorAll("p")].filter((el) => !el.parentElement.closest("p"));
        return parts.length ? parts : [line];
      });
    } else if (headings.length && lineEls.length) {
      lines = lineEls.map((line) => line.querySelector("h1, h2, h3, h4, h5, h6") || line);
    } else if (STD_DRAFT_IMPORT && headings.length) {
      lines = [...overlay.querySelectorAll("h1, h2, h3, h4, h5, h6, p")].filter((el) => !el.parentElement.closest("h1, h2, h3, h4, h5, h6, p") && !el.closest(".curatedcta, .buttonset, .c-curatedcta") && !(el.tagName === "P" && el.querySelector("a") && clean2(el.textContent) === clean2(el.querySelector("a").textContent)));
    }
    lines.forEach((line) => {
      if (!clean2(line.textContent)) return;
      const el = document.createElement(/^H[1-6]$/.test(line.tagName) ? line.tagName.toLowerCase() : "p");
      const box = document.createElement("div");
      box.innerHTML = line.innerHTML;
      if (STD_DRAFT_IMPORT) sizeBrackets(box);
      if (product) tagStdColours(box, { gold: true });
      box.querySelectorAll("span.futura-bold, b").forEach((span) => {
        const strong = document.createElement("strong");
        while (span.firstChild) strong.append(span.firstChild);
        span.replaceWith(strong);
      });
      box.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
      box.querySelectorAll("a").forEach((a) => {
        if (!(a.getAttribute("href") || "").trim()) a.replaceWith(...a.childNodes);
      });
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
  function xfSlideCopy(slide, overlay, document) {
    if (overlay && clean2(overlay.textContent)) return [];
    const xf = slide.querySelector(".experienceFragment-ef") || slide.querySelector(".experienceFragment-ef-mobile");
    const texts = xf ? [...xf.querySelectorAll(".c-rich-text-editor")] : [];
    const LEVEL = {
      H1: 2,
      H2: 1.75,
      H3: 1.5,
      H4: 1.25
    };
    const STEPS = ["1-25", "1-5", "1-75", "2", "2-5"];
    const step = (factor) => STEPS.reduce((x, y) => Math.abs(Math.log(Number(y.replace("-", ".")) / factor)) < Math.abs(Math.log(Number(x.replace("-", ".")) / factor)) ? y : x);
    const sized = (line) => {
      if (!LEVEL[line.tagName]) return;
      const walker = document.createTreeWalker(line, 4);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        const m = t.nodeValue.match(/\[\[text-(\d+(?:-\d+)?)\]/);
        if (m) {
          t.nodeValue = t.nodeValue.replace(m[0], `[[text-${step(LEVEL[line.tagName] * Number(m[1].replace("-", ".")))}]`);
          return;
        }
      }
      line.prepend(document.createTextNode(`[[text-${step(LEVEL[line.tagName])}]`));
      line.append(document.createTextNode("]"));
    };
    return texts.flatMap((rich) => headline(rich, document)).map((line) => {
      sized(line);
      if (!/^H[23]$/.test(line.tagName)) return line;
      const bold = [...line.querySelectorAll("strong")].map((b) => b.textContent).join("");
      const plain = clean2(line.textContent.replace(/\[\[[^\][]+\]|\]/g, ""));
      if (clean2(bold.replace(/\[\[[^\][]+\]|\]/g, "")) === plain) return line;
      line.querySelectorAll("strong").forEach((b) => {
        b.prepend(document.createTextNode("[[std-sans]"));
        b.append(document.createTextNode("]"));
      });
      line.prepend(document.createTextNode("[[serif]"));
      line.append(document.createTextNode("]"));
      return line;
    });
  }
  function measuredTextTop(slide, overlay, { top, left, right, padTop }) {
    const doc = overlay.ownerDocument;
    const box = slide.getBoundingClientRect();
    const view = doc.defaultView;
    if (box.height && view && view.getComputedStyle(overlay).position === "absolute") {
      const walker = doc.createTreeWalker(overlay, 4);
      const tops = [];
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (t.nodeValue.trim()) {
          const range = doc.createRange();
          range.selectNodeContents(t);
          const rect = range.getBoundingClientRect();
          if (rect.height > 0) tops.push(rect.top);
        }
      }
      const at = tops.length ? (Math.min(...tops) - box.top) / box.height * 100 : -1;
      if (at >= 0 && at <= 100) return Math.round(at * 10) / 10;
    }
    const img = slide.querySelector(".experienceFragment-ef img") || slide.querySelector("img");
    const w = img && (img.naturalWidth || Number(img.getAttribute("width"))) || 1440;
    const h = img && (img.naturalHeight || Number(img.getAttribute("height"))) || 488;
    const width = 100 - (left || 0) - (right || 0);
    return Math.round(((top || 0) + padTop * width * w / (100 * h)) * 10) / 10;
  }
  function percent(style, re) {
    const m = style.match(re);
    return m ? String(parseFloat(m[1])).replace(".", "-") : null;
  }
  function parse5(element, context) {
    var _a;
    const { document } = context;
    const slides = [...element.querySelectorAll(".carouselslide:not(.slick-cloned)")];
    if (STD_DRAFT_IMPORT && slides.length > 1 && !element.hasAttribute("data-std-slide")) {
      const settings = element.querySelector(".slider-wrapper") || element;
      const styles = ["carousel"];
      if (settings.getAttribute("data-autoplay") === "true") styles.push("autoplay");
      if (settings.getAttribute("data-transition") === "true") styles.push("fade");
      const out = [document.createElement("hr")];
      slides.forEach((one) => {
        const holder = document.createElement("div");
        const single = document.createElement("div");
        single.setAttribute("data-std-slide", "");
        single.append(one.cloneNode(true));
        holder.append(single);
        parse5(single, context);
        out.push(...holder.childNodes, WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: styles.join(", ") }
        }), document.createElement("hr"));
      });
      element.replaceWith(...out);
      return;
    }
    const slide = element.querySelector(".carouselslide:not(.slick-cloned)") || element;
    const desktop = slide.querySelector(".experienceFragment-ef img");
    const mobile = slide.querySelector(".experienceFragment-ef-mobile img");
    const overlay = slide.querySelector(".overlayparsys");
    let first = desktop || mobile || slide.querySelector("img");
    let ambient = "";
    if (!first && stdReviewPage(document)) {
      const link2 = [...slide.querySelectorAll('table a[href*=".m3u8"]')].map((a) => a.getAttribute("href").match(/\/is\/content\/(.+?)\.m3u8/)).find(Boolean);
      const path = ((_a = slide.querySelector("[data-asset-path]")) == null ? void 0 : _a.getAttribute("data-asset-path")) || (link2 ? decodeURIComponent(link2[1]) : "");
      if (path && !path.startsWith("/content/dam/")) {
        const base = "https://media-assets.stryker.com/is";
        ambient = `${base}/content/${path}.m3u8?poster=${base}/image/${path}?fit=constrain,1&wid=909&hei=511`;
        first = document.createElement("img");
        first.setAttribute("src", `${base}/image/${path}?$max_width_1440$`);
        first.setAttribute("alt", "");
      }
    }
    if (!first) return;
    if (stdProductPage(document) && productSlide(slide, overlay)) {
      const copy = introCopy(overlay);
      overlay.querySelectorAll(".curatedcta a.btn[href]").forEach((btn) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.setAttribute("href", btn.getAttribute("href"));
        a.textContent = clean2(btn.textContent);
        if (btn.classList.contains("btn-gold")) {
          const em = document.createElement("em");
          em.append(a);
          strong.append(em);
        } else strong.append(a);
        p.append(strong);
        copy.push(p);
      });
      element.replaceWith(WebImporter.Blocks.createBlock(document, {
        name: "Hero Corp (page-hero, no-rule)",
        cells: [[copy], [copyImage(desktop || first, document)]]
      }));
      return;
    }
    const variants = ["image-slide"];
    const cells = [[copyImage(first, document)]];
    if (desktop && mobile) cells.push([copyImage(mobile, document)]);
    if (overlay) {
      const lines = headline(overlay, document);
      overlay.querySelectorAll(".curatedcta a.btn[href]").forEach((btn) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.setAttribute("href", btn.getAttribute("href"));
        a.textContent = clean2(btn.textContent);
        if (STD_DRAFT_IMPORT && btn.classList.contains("btn-gold")) {
          const em = document.createElement("em");
          em.append(a);
          strong.append(em);
        } else strong.append(a);
        p.append(strong);
        lines.push(p);
      });
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
      if (overlay.querySelector(".has-background.bg-white")) variants.push("white-box");
      if (overlay.querySelector(".has-background.bg-blue")) variants.push("blue-box");
      const gold = overlay.querySelector(".has-background.bg-gold");
      if (gold) {
        variants.push("gold-box");
        const margin = parseFloat(percent(gold.getAttribute("style") || "", /margin-right:\s*(\d+(?:\.\d+)?)%/i) || "0");
        if (margin) {
          const l = parseFloat((left || "0").replace("-", "."));
          const r = parseFloat((right || "0").replace("-", "."));
          const inset = Math.round((r + (100 - l - r) * margin / 100) * 10) / 10;
          const i = variants.findIndex((v) => v.startsWith("right-"));
          const token = `right-${String(inset).replace(".", "-")}`;
          if (i >= 0) variants[i] = token;
          else variants.push(token);
        }
      }
    }
    if (STD_DRAFT_IMPORT && overlay) {
      const style = overlay.getAttribute("style") || "";
      const num = (re) => {
        const m = style.match(re);
        return m ? parseFloat(m[1]) : null;
      };
      const padded = stdProductPage(document) && overlay.querySelector('.largeheadline[style*="padding-left"]');
      const inset = padded ? parseFloat(((padded.getAttribute("style") || "").match(/padding-left:\s*(\d+(?:\.\d+)?)%/i) || [])[1] || "0") : 0;
      const paddedTop = stdProductPage(document) && overlay.querySelector('.largeheadline[style*="padding-top"]');
      const padTop = paddedTop ? parseFloat(((paddedTop.getAttribute("style") || "").match(/padding-top:\s*(\d+(?:\.\d+)?)%/i) || [])[1] || "0") : 0;
      const top = num(/top:\s*(\d+(?:\.\d+)?)%/i);
      const left = num(/margin-left:\s*(\d+(?:\.\d+)?)%/i);
      const right = num(/width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i);
      const textTop = padTop > 0 ? measuredTextTop(slide, overlay, {
        top,
        left,
        right,
        padTop
      }) : null;
      const options = slideOptions({
        left,
        right,
        top: textTop !== null ? textTop : top,
        overlay,
        headline: overlay.querySelector(".c-largeheadline") || overlay,
        inset
      });
      const colours = new Set(options.map((o) => (o.match(/^(?:title|subline)-(.+)$/) || [])[1]).filter(Boolean));
      if (options.some((o) => /^box-(blue|dark|purple-gradient|blue-gradient)$/.test(o))) colours.add("white");
      const copy = cells[cells.length - 1];
      if (copy && Array.isArray(copy[0])) dropColourTags(copy[0], colours);
      const lead = stdReviewPage(document) ? xfSlideCopy(slide, overlay, document) : [];
      if (lead.length) {
        cells.push([lead]);
        const placed = [
          "text-left",
          "text-right",
          "text-wide",
          "text-top",
          "text-upper",
          "text-middle",
          "text-lower",
          "mobile-below",
          "mobile-above"
        ];
        options.splice(0, options.length, ...options.filter((o) => !placed.includes(o)), "text-right", "text-top", "mobile-above");
      }
      const video = slideVideo(slide) || ambient;
      if (video) {
        const a = document.createElement("a");
        a.setAttribute("href", video);
        a.textContent = video;
        cells.unshift([a]);
        options.push("video-background");
      }
      const stripe = takeStripe(element);
      if (stripe) options.push(stripe);
      variants.splice(1, variants.length - 1, ...options);
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document, {
      name: `Hero Corp (${variants.join(", ")})`,
      cells
    }));
  }

  // tools/importer/event-calendar-std-import.js
  function sitePath(aemPath) {
    const path = String(aemPath || "").replace(/^\/content\/stryker/, "").replace(/\.html?$/, "");
    return path.split("/").map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join("/");
  }
  function eventCalendarBlocks(main, doc) {
    main.querySelectorAll(".c-event").forEach((component) => {
      const sp = component.querySelector("[data-sp]");
      const from = component.closest(".event") || component;
      if (!sp) {
        from.remove();
        return;
      }
      const parts = [];
      const title = component.querySelector(".title-container h2");
      if (title && title.textContent.trim()) {
        const h2 = doc.createElement("h2");
        h2.textContent = title.textContent.trim();
        h2.setAttribute("data-keep", "section");
        parts.push(h2);
      }
      const block = WebImporter.Blocks.createBlock(doc, {
        name: "Event Calendar",
        cells: [["Folder", sitePath(sp.getAttribute("data-sp"))]]
      });
      block.setAttribute("data-std-table", "");
      block.setAttribute("data-keep", "section");
      parts.push(block);
      from.replaceWith(...parts);
    });
  }

  // tools/importer/transformers/long-page-detail-corp-components.js
  var COMPONENT = '[class^="c-"], [class*=" c-"]';
  var UNIT = `[data-keep], ${COMPONENT}, .buttonset, table`;
  var PARSED = ".c-resourcesanddownload, .c-customizeable, .c-autocarousel";
  var STD_BACKGROUNDS = /* @__PURE__ */ new Set([
    "white",
    "gold",
    "light-gray",
    "lighter-gray",
    "gray",
    "dark-gray",
    "black",
    "blue",
    "purple",
    "teal",
    "orange",
    "golden-gradient",
    "gray-gradient",
    "dark-blue-gradient",
    "dark-purple-gradient",
    "dark-teal-gradient",
    "dark-orange-gradient"
  ]);
  function colourStyle(el) {
    const m = (el.className || "").match(/\bbg-([a-z-]+)\b/);
    if (!m) return "";
    const bg = m[1];
    if (STD_DRAFT_IMPORT && STD_BACKGROUNDS.has(bg)) return bg === "white" ? "" : `bg-${bg}`;
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
      const panelSections = [];
      contents.forEach((content, i) => {
        if (!content.length) return;
        const heading = doc.createElement(`h${level}`);
        heading.textContent = labels[i] || `Tab ${i + 1}`;
        nodes.push(heading, ...content);
        panelSections.push([heading, ...content]);
      });
      if (!nodes.length) return;
      if (STD_DRAFT_IMPORT) {
        const style2 = ["tab-panel", component.hasAttribute("data-image-aside") ? "image-aside" : ""].filter(Boolean).join(", ");
        (component.closest(".tabs") || component).replaceWith(...panelSections.map((panel) => keepNodes(doc, panel, style2)));
        return;
      }
      const style = component.hasAttribute("data-image-aside") ? "tabbed, image-aside" : "tabbed";
      (component.closest(".tabs") || component).replaceWith(keepNodes(doc, nodes, style));
    });
  }
  function plateColumns(main, doc, h) {
    main.querySelectorAll(".colctrl").forEach((colctrl) => {
      const row = colctrl.querySelector(":scope > .row");
      const cols = row ? [...row.children].filter((c) => h.text(c) || c.querySelector("img")) : [];
      const plate = (col) => {
        const groups = col.querySelectorAll(".panel-group");
        const panels = groups.length === 1 ? groups[0].querySelectorAll(":scope > .panel") : [];
        return panels.length === 1 && !!panels[0].querySelector(".panel-collapse.in, .panel-collapse.show") && !!col.querySelector(".c-standalone-image img") && !col.querySelector(".colctrl");
      };
      if (cols.length < 2 || !cols.every(plate)) return;
      cols.forEach((col) => {
        const group = col.querySelector(".panel-group");
        const title = doc.createElement("h4");
        title.textContent = h.text(group.querySelector(".panel-title"));
        const body = [...group.querySelectorAll(".panel-body .c-rich-text-editor")];
        const target = group.closest(".accordion") || group.closest(".c-accordion") || group;
        target.replaceWith(h.richText(doc, [title]), ...body);
      });
      colctrl.setAttribute("data-columns", "");
    });
  }
  function accordionsInColumns(main, doc, h) {
    if (stdProductPage(doc)) plateColumns(main, doc, h);
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
    const product = stdReviewPage(doc);
    if (product) {
      nodes.filter((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName) && n.serifHeading).forEach((n) => h.tagCopy(n, "serif", doc));
    }
    nodes.filter((n) => n.nodeType === 1 && typeof n.copyStyle === "string" && n.copyStyle && !(product && /^H[1-6]$/.test(n.tagName))).forEach((n) => {
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
      const subheading = STD_DRAFT_IMPORT && [...target.querySelectorAll(".component-subheading")].find((el) => !el.closest(".panel") && h.text(el));
      const title = subheading ? doc.createElement("h3") : null;
      if (title) {
        const bold = doc.createElement("strong");
        bold.textContent = h.text(subheading);
        title.append(bold);
      }
      const keepWithTitle = (block2) => {
        if (!title) return [block2];
        title.setAttribute("data-keep", "section");
        block2.setAttribute("data-keep", "join");
        return [title, block2];
      };
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
        target.replaceWith(...keepWithTitle(keepBlock(block2, target)));
        return;
      }
      if (nested) {
        if (title) target.before(keepNodes(doc, [title]));
        const style = STD_DRAFT_IMPORT && options.split(", ").includes("open") ? "accordion-panel, accordion-open" : "accordion-panel";
        items.forEach(({ label, body }) => {
          const heading = doc.createElement("h4");
          heading.textContent = label;
          target.before(keepNodes(doc, [heading, ...body], style));
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
      target.replaceWith(...keepWithTitle(keepBlock(block, target)));
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
      const product = stdProductPage(doc);
      const lines = product ? [...component.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => el.textContent.trim()) : [];
      const centred = lines.length > 0 && lines.every((el) => el.closest('[style*="text-align: center"], [style*="text-align:center"], .text-center'));
      const style = [colour, "full-bleed", centred ? "text-center" : ""].filter(Boolean).join(", ");
      const out = [];
      let run = [];
      let runStyle = style;
      const flush = () => {
        if (product) tagPanelCopy(run, doc, h);
        if (run.length) out.push(keepNodes(doc, run, runStyle));
        run = [];
        runStyle = style;
      };
      contentUnits(component).forEach((unit) => {
        const keep = unit.getAttribute("data-keep");
        const flex = product && keep === "section" && /\bflex\b/.test(unit.getAttribute("data-section-style") || "");
        if (keep === "nodes" && unit.hasAttribute("data-section-style")) {
          flush();
          unit.setAttribute("data-section-style", `${style}, ${unit.getAttribute("data-section-style")}`);
          out.push(unit);
        } else if (flex) {
          flush();
          runStyle = `${style}, ${unit.getAttribute("data-section-style")}`;
          unit.removeAttribute("data-section-style");
          run.push(...unitNodes(unit, doc, h));
        } else if (runStyle !== style && keep === "join") {
          run.push(...unitNodes(unit, doc, h));
        } else {
          if (runStyle !== style) flush();
          run.push(...unitNodes(unit, doc, h));
        }
      });
      flush();
      if (!out.length && /^(bg-)?gold$/.test(colour) && !h.text(component)) {
        const bar = keepNodes(doc, [], "gold-bar");
        const end = component.getAttribute("data-row-end");
        if (end) bar.setAttribute("data-row-end", end);
        out.push(bar);
      }
      if (!out.length) return;
      const space = product && component.getAttribute("data-std-space-after");
      if (space) {
        const spacer = keepNodes(doc, [], "spacer");
        spacer.setAttribute("data-std-spacer", space);
        out.push(spacer);
      }
      (component.closest(".fullbleedpanel") || component).replaceWith(...out);
    });
  }
  var PANEL_BOX_COLOURS = {
    white: "box-white",
    gold: "box-gold",
    orange: "box-dark-gold",
    "light-gray": "box-gray",
    "lighter-gray": "box-pale-gray",
    gray: "box-mid-gray",
    black: "box-black",
    "golden-gradient": "box-gold-gradient",
    "gray-gradient": "box-gray-gradient",
    "dark-orange-gradient": "box-orange-gradient",
    blue: "box-blue",
    "dark-blue-gradient": "box-blue-gradient",
    "dark-teal-gradient": "box-teal-gradient",
    teal: "box-teal",
    purple: "box-purple",
    "dark-gray": "box-dark",
    "dark-purple-gradient": "box-purple-gradient"
  };
  var PANEL_SPACE_STEPS = [[0, "space-none"], [3, "space-s"], [5, ""], [10, "space-l"]];
  function panelOptions(box, component) {
    const bg = (box.className.match(/\bbg-([a-z-]+)/) || [])[1] || "";
    const shadow = box.classList.contains("dimensional-box");
    const colour = PANEL_BOX_COLOURS[bg] || (shadow ? "box-white" : "");
    if (!colour || colour === "box-white" && !shadow) return "";
    let gradient = "";
    if (colour.endsWith("-gradient") && box.classList.contains("inverse")) {
      gradient = box.classList.contains("top-to-bottom") ? "gradient-up" : "gradient-reverse";
    }
    const values = ["top", "right", "bottom", "left"].map((side) => (box.getAttribute("style") || "").match(new RegExp(`padding-${side}\\s*:\\s*([\\d.]+)%`))).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    let space = "space-s";
    if (values.length) {
      const median = values[Math.floor(values.length / 2)];
      const steps = stdProductPage(box.ownerDocument) && median > 0 ? PANEL_SPACE_STEPS.filter(([v]) => v > 0) : PANEL_SPACE_STEPS;
      [, space] = steps.reduce((best, step) => Math.abs(step[0] - median) < Math.abs(best[0] - median) ? step : best);
    }
    const items = [...component.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => el.textContent.trim());
    const centred = items.length > 0 && items.every((el) => !!el.closest('.text-center, [style*="text-align: center"], [style*="text-align:center"]'));
    return [colour, shadow ? "shadow" : "", gradient, space, centred ? "text-center" : ""].filter(Boolean).join(", ");
  }
  var PANEL_SIZE_TAGS = {
    "p-1-25": "text-1-25",
    "p-1-5": "text-1-5",
    "p-1-75": "text-1-75",
    "p-2": "text-2",
    "p-2-5": "text-2-5",
    disclaimer: "text-0-8",
    "h2-0-8": "text-0-8",
    "h2-1-5": "text-1-5",
    "h1-1-25": "text-1-25"
  };
  function panelCopy(cellNodes2, options, doc, h, component) {
    const parts = (style) => (style || "").split(",").map((x) => x.trim()).filter(Boolean);
    const squash = (value) => value.replace(/\[\[[^\][]+\]|\]/g, "").replace(/[\s\u00a0]+/g, "");
    const nodes = [];
    cellNodes2.forEach((n) => {
      const inline2 = n.nodeType === 3 || n.nodeType === 1 && n.matches("a, b, br, em, i, span, strong, sub, sup, u");
      if (!inline2) {
        nodes.push(n);
        return;
      }
      let last = nodes[nodes.length - 1];
      if (!last || !last.panelParagraph) {
        if (n.nodeType === 3 && !n.textContent.trim()) return;
        last = doc.createElement("p");
        last.panelParagraph = true;
        last.copyStyle = n.copyStyle;
        nodes.push(last);
      }
      last.append(n);
    });
    const sources = new Map([...component.querySelectorAll("p, h1, h2, h3, h4, h5, h6")].map((el) => [squash(el.textContent), el]));
    const STEPS = [[0.8, "text-0-8"], [1.25, "text-1-25"], [1.5, "text-1-5"], [1.75, "text-1-75"], [2, "text-2"], [2.5, "text-2-5"]];
    const sizeOf = (el) => {
      const factor = [...el.querySelectorAll('[class*="fontsize-"]')].filter((span) => squash(span.textContent) === squash(el.textContent)).map((span) => span.className.match(/fontsize-(\d+)(?:-(\d+))?em/) || []).filter((m) => m[1]).reduce((f, m) => f * (m[1] === "8" && !m[2] ? 0.8 : Number(`${m[1]}.${m[2] || 0}`)), 1);
      if (Math.abs(factor - 1) < 0.05) return "";
      const off = ([step]) => Math.abs(Math.log(step / factor));
      return STEPS.reduce((a, b) => off(b) < off(a) ? b : a)[1];
    };
    const serifPlain = (el) => {
      const walker = el.ownerDocument.createTreeWalker(el, 4);
      let plain = 0;
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (squash(t.nodeValue) && !t.parentElement.closest(".futura-bold, b, strong") && !(stdReviewPage(el.ownerDocument) && t.parentElement.closest("sup, sub"))) {
          if (!t.parentElement.closest(".urw-egyptienne")) return false;
          plain += 1;
        }
      }
      return plain > 0;
    };
    const TOKENS = /(\[\[[^\][]+\]|\])/;
    const SIZE = /^text-\d/;
    const tagRuns = (el, size, serif) => {
      if (!size && !serif) return;
      el.normalize();
      const hasTags = el.textContent.includes("[[");
      const hasBold = [...el.querySelectorAll("strong, b")].some((b) => b.textContent.trim());
      if (!hasTags && !(serif && hasBold)) {
        if (!el.firstChild) return;
        el.firstChild.before(doc.createTextNode(`[[${[size, serif ? "serif" : ""].filter(Boolean).join(",")}]`));
        el.lastChild.after(doc.createTextNode("]"));
        return;
      }
      const walker = doc.createTreeWalker(el, 4);
      const texts = [];
      for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
      const open = [];
      texts.forEach((t) => {
        const b = t.parentElement.closest("strong, b");
        const inBold = !!b && el.contains(b);
        t.nodeValue = t.nodeValue.split(TOKENS).map((x, i) => {
          if (i % 2 === 1) {
            if (x === "]") open.pop();
            else open.push(x.slice(2, -1).split(",").map((c) => c.trim()));
            return x;
          }
          if (!x.trim()) return x;
          const has = (test) => open.some((tags2) => tags2.some(test));
          const tags = [
            size && !has((c) => SIZE.test(c)) ? size : "",
            serif && !inBold && !has((c) => c === "serif") ? "serif" : ""
          ].filter(Boolean);
          return tags.length ? `[[${tags.join(",")}]${x}]` : x;
        }).join("");
      });
    };
    nodes.filter((n) => n.nodeType === 1).forEach((n) => {
      const heading = /^H\d$/.test(n.tagName);
      const style = heading ? parts(n.headingStyle) : parts(n.copyStyle);
      const src = sources.get(squash(n.textContent));
      const size = src && sizeOf(src) || style.map((x) => PANEL_SIZE_TAGS[x]).find(Boolean) || "";
      const serif = (heading ? n.serifHeading : style.includes("serif")) || !!src && serifPlain(src);
      if (n.matches("ul, ol")) {
        if (size || serif) h.tagCopy(n, [size, serif ? "serif" : ""].filter(Boolean).join(","), doc);
      } else tagRuns(n, size, serif);
    });
    if (!/\bbox-(blue|teal|purple|dark|blue-gradient|purple-gradient)\b/.test(options)) return nodes;
    nodes.forEach((n) => {
      const walker = doc.createTreeWalker(n, 4);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        t.nodeValue = t.nodeValue.replace(/\[\[([^\][]+)\]/g, (all, raw) => {
          const kept = raw.split(",").map((c) => c.trim()).filter((c) => c !== "color-white");
          return `[[${kept.length ? kept.join(",") : "panel-text"}]`;
        });
      }
    });
    return nodes;
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
      if (STD_DRAFT_IMPORT) {
        variant = panelOptions(box, component);
        if (!variant) return;
      } else if (box.classList.contains("dimensional-box")) variant = "left";
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
      let nodes = contentNodes(component, doc, h);
      if (!nodes.length) return;
      if (STD_DRAFT_IMPORT) nodes = panelCopy(nodes, variant, doc, h, component);
      const halves = row && [...row.children].filter((c) => /\bcol-(sm|md)-6\b/.test(c.className));
      if (stdProductPage(doc) && halves && halves.length === 2 && row.children.length === 2) {
        const first = halves[0] === col;
        const cells = first ? [nodes, ""] : ["", nodes];
        const name2 = `Columns (columns-50-50, ${variant}${first ? ", box-first" : ""})`;
        const block = WebImporter.Blocks.createBlock(doc, { name: name2, cells: [cells] });
        (col.closest(".colctrl") || component).replaceWith(keepBlock(block));
        return;
      }
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
    if (STD_DRAFT_IMPORT) {
      main.querySelectorAll(".c-fastfacts").forEach((component) => {
        const items = [...component.querySelectorAll(".c-fastfacts-item")].map((item) => [item.querySelector(".c-fastfacts-number"), item.querySelector(".c-fastfacts-text")]).filter(([n]) => n && h.text(n));
        if (!items.length) return;
        const title = component.querySelector(".c-fastfacts-title");
        const out = [];
        if (title && h.text(title)) {
          const h2 = doc.createElement("h2");
          h2.textContent = h.text(title);
          out.push(h.richText(doc, [h2]));
        }
        const cells = items.map(([n, t]) => [n.textContent.trim(), t ? t.textContent.trim() : ""]);
        const options = [items.length !== 3 ? `cols-${Math.min(items.length, 6)}` : "", "inline"].filter(Boolean);
        const from = component.closest(".fastfacts") || component;
        out.push(keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Statistics (${options.join(", ")})`, cells }), from));
        from.replaceWith(...out);
      });
    }
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
    main.querySelectorAll(STD_DRAFT_IMPORT ? ".c-page-hero, .c-hero" : ".c-page-hero").forEach((component) => {
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
        const goldText = () => {
          const strong = doc.createElement("strong");
          const em = doc.createElement("em");
          em.textContent = h.text(el);
          strong.append(em);
          return strong;
        };
        if (el.matches("h1")) {
          let strong = goldText();
          if (!gold) {
            strong = doc.createElement("strong");
            strong.textContent = h.text(el);
          }
          copy.append(doc.createTextNode("[[text-2]"), strong, doc.createTextNode("]"));
        } else if (el.matches("h2")) {
          copy.textContent = `[[text-1-75,serif]${h.text(el)}]`;
        } else if (gold) copy.append(goldText());
        else copy.textContent = h.text(el);
        return [copy];
      });
      const cols = [...component.querySelectorAll('.row > [class*="col-"]')].filter((col) => h.text(col) || col.querySelector("img"));
      if (STD_DRAFT_IMPORT) {
        const copy = [];
        const pics = [];
        cols.forEach((col) => col.querySelectorAll("h1, h2, p, img").forEach((el) => {
          if (el.matches("img")) {
            const source = el.closest("picture") && el.closest("picture").querySelector("source[srcset]");
            const img = doc.createElement("img");
            img.setAttribute("src", source ? source.getAttribute("srcset").split(/\s+/)[0] : el.getAttribute("src"));
            img.setAttribute("alt", el.getAttribute("alt") || "");
            pics.push(img);
            return;
          }
          if (!h.text(el) || el.parentElement && el.parentElement.closest("h1, h2")) return;
          let tag = "p";
          if (el.matches("h1, p.title")) tag = "h1";
          else if (el.matches("h2, p.subhead")) tag = "h2";
          if (tag === "h1" && copy.some((n) => n.tagName === "H1")) return;
          const node = doc.createElement(tag);
          const styled = el.matches('[style*="color"]') ? el : el.querySelector('[style*="color"]');
          const black = styled && /#000\b|#000000|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/i.test(styled.getAttribute("style") || "");
          const titleGold = tag === "h1" && !black;
          if (tag === "h1") {
            const strong = doc.createElement("strong");
            if (titleGold) {
              const em = doc.createElement("em");
              em.textContent = h.text(el);
              strong.append(em);
            } else strong.textContent = h.text(el);
            node.append(strong);
          } else node.textContent = h.text(el);
          copy.push(node);
        }));
        if (!copy.length && !pics.length) return;
        const options = ["page-hero"];
        if (!pics.length) options.push("no-image");
        if (!component.querySelector(".border-bottom-gold")) options.push("no-rule");
        const rows = [[copy]];
        if (pics.length) rows.push([pics[0]]);
        const block = keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Hero Corp (${options.join(", ")})`, cells: rows }));
        (component.closest(".pagehero, .hero") || component).replaceWith(block);
        return;
      }
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
  function hotspotsOf(path) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `https://media-assets.stryker.com/is/image/${encodeURI(path)}?req=set,json`, false);
      xhr.send();
      if (xhr.status !== 200) return [];
      const text5 = xhr.responseText;
      const { item } = JSON.parse(text5.slice(text5.indexOf("{"), text5.lastIndexOf("}") + 1)).set || {};
      const areas = item && item.map && [].concat(item.map.area || []);
      if (!areas || !Number(item.dx) || !Number(item.dy)) return [];
      const pct = (v, of) => Math.round(v / of * 1e3) / 10;
      return areas.map((area) => {
        const c = String(area.coords || "").split(",").map(Number);
        const xs = c.filter((_, i) => i % 2 === 0);
        const ys = c.filter((_, i) => i % 2 === 1);
        if (!xs.length || !area.href) return null;
        return {
          label: area.alt || "",
          x: pct((Math.min(...xs) + Math.max(...xs)) / 2, Number(item.dx)),
          y: pct((Math.min(...ys) + Math.max(...ys)) / 2, Number(item.dy)),
          href: area.href
        };
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  function interactiveImages(main, doc) {
    main.querySelectorAll(".interactivemedia").forEach((component) => {
      const asset = component.querySelector("[data-asset-path]");
      const path = asset && asset.getAttribute("data-asset-path");
      if (!path) {
        component.remove();
        return;
      }
      const spots = STD_DRAFT_IMPORT ? hotspotsOf(path) : [];
      if (spots.length) {
        const image2 = doc.createElement("a");
        image2.href = `https://media-assets.stryker.com/is/image/${encodeURI(path)}?$max_width_1440$`;
        image2.textContent = image2.href;
        const rows = [[image2], ...spots.map((s) => {
          const a = doc.createElement("a");
          a.href = s.href;
          a.textContent = s.label ? `${s.label}` : s.href;
          return [s.label, `${s.x}, ${s.y}`, a];
        })];
        const block = WebImporter.Blocks.createBlock(doc, { name: "Interactive Image", cells: rows });
        block.setAttribute("data-std-table", "");
        component.replaceWith(keepBlock(block, component));
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
  var STAT_COLOURS = {
    "255,181,0": "gold",
    "175,109,4": "gold",
    "28,86,135": "navy",
    "133,69,138": "purple",
    "76,125,122": "teal",
    "255,255,255": "white"
  };
  var TEXT_COLOURS = {
    "255,181,0": "gold",
    "28,86,135": "blue",
    "133,69,138": "purple",
    "76,125,122": "teal",
    "255,255,255": "white"
  };
  var rgbOf = (el) => {
    var _a;
    return (_a = (el && el.getAttribute("style") || "").replace(/\s/g, "").match(/color:rgba?\((\d+,\d+,\d+)/i)) == null ? void 0 : _a[1];
  };
  function statFigure(widget) {
    const end = widget.getAttribute("data-numbercounter-end-number") || "";
    const type = widget.getAttribute("data-numbercounter-number-type");
    const currency = widget.getAttribute("data-numbercounter-currency-type") || "";
    if (type === "3") return `${end}%`;
    if (type === "2") return `${currency}${end}`;
    return end;
  }
  function statLine(line, doc) {
    const p = doc.createElement("p");
    const classes = [line, ...line.querySelectorAll("span[class]")].flatMap((s) => [...s.classList]);
    const tags = [];
    const vw = classes.map((c) => c.match(/^fontsize-(\d+(?:-\d+)?)-?vw$/)).find(Boolean);
    const em = classes.map((c) => c.match(/^fontsize-(\d+(?:-\d+)?)em$/)).find(Boolean);
    if (vw) tags.push(`size-${vw[1]}-vw`);
    else if (em) tags.push(`text-${em[1]}`);
    if (classes.includes("urw-egyptienne")) tags.push("serif");
    const bold = classes.includes("futura-bold");
    const coloured = [line, ...line.querySelectorAll('[style*="color"]')].find((el) => rgbOf(el));
    const colour = TEXT_COLOURS[rgbOf(coloured)];
    if (colour) tags.push(`color-${colour}`);
    const copy = line.cloneNode(true);
    copy.querySelectorAll("sup span").forEach((s) => s.replaceWith(...s.childNodes));
    const sups = [...copy.querySelectorAll("sup")];
    sups.forEach((s) => s.remove());
    const text5 = copy.textContent.replace(/\s+/g, " ").trim();
    if (!text5) return null;
    const run = doc.createTextNode(tags.length ? `[[${tags.join(",")}]${text5}]` : text5);
    const inRun = stdProductPage(doc) && sups.length;
    const nodes = inRun && tags.length ? [doc.createTextNode(`[[${tags.join(",")}]${text5}`), ...sups, doc.createTextNode("]")] : [run];
    const after = inRun ? [] : sups;
    if (inRun && !tags.length) nodes.push(...sups);
    if (bold) {
      const strong = doc.createElement("strong");
      strong.append(...nodes);
      p.append(strong, ...after);
    } else p.append(...nodes, ...after);
    return p;
  }
  function statCell(component, doc) {
    const widget = component.querySelector('[data-widget="numbercounter"]');
    const number = widget.querySelector(".numbercounter-number");
    const value = doc.createElement("p");
    value.textContent = statFigure(widget);
    const label = [...widget.children].find((el) => !el.querySelector(".numbercounter-number") && el.textContent.trim());
    const lines = label ? [...label.children].filter((c) => c.textContent.trim()) : [];
    const desc = (lines.length ? lines : [label].filter(Boolean)).map((l) => statLine(l, doc)).filter(Boolean);
    const vw = (number.className.match(/fontsize-(\d+(?:-\d+)?)-?vw/) || [])[1];
    return {
      value,
      desc,
      colour: STAT_COLOURS[rgbOf(number)] || "gold",
      size: vw ? Number(vw.replace("-", ".")) : 0,
      centred: !!widget.querySelector(".text-center")
    };
  }
  function statRowLine(source, doc, base = 1) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const whole = squash(source.textContent);
    const factor = [...source.querySelectorAll('[class*="fontsize-"]')].filter((span) => squash(span.textContent) === whole).map((span) => span.className.match(/\bfontsize-(\d+)(?:-(\d+))?em\b/) || []).filter((m) => m[1]).reduce((f, m) => f * (m[1] === "8" && !m[2] ? 0.8 : Number(`${m[1]}.${m[2] || 0}`)), 1);
    const STEPS = [[0.8, "text-0-8"], [1, ""], [1.25, "text-1-25"], [1.5, "text-1-5"], [1.75, "text-1-75"], [2, "text-2"], [2.5, "text-2-5"]];
    const off = ([step]) => Math.abs(Math.log(step / (factor / base)));
    const size = STEPS.reduce((x, y) => off(y) < off(x) ? y : x)[1];
    const serif = [...source.querySelectorAll(".urw-egyptienne")].some((span) => squash(span.textContent) === whole);
    const line = doc.createElement("p");
    line.append(...source.cloneNode(true).childNodes);
    line.querySelectorAll("span.futura-bold, b").forEach((span) => {
      const strong = doc.createElement("strong");
      strong.append(...span.childNodes);
      span.replaceWith(strong);
    });
    line.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    line.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((at) => {
      if (!(el.tagName === "A" && at.name === "href")) el.removeAttribute(at.name);
    }));
    const tag = [size, serif ? "serif" : ""].filter(Boolean).join(",");
    if (tag && line.firstChild) {
      line.prepend(doc.createTextNode(`[[${tag}]`));
      line.append(doc.createTextNode("]"));
    }
    return line;
  }
  function statisticsRow(row, columns, doc) {
    const paragraphs = (parts) => parts.flatMap((pt) => {
      const ps = [...pt.querySelectorAll("p")].filter((p) => p.textContent.trim());
      return ps.length ? ps : [pt].filter((x) => x.textContent.trim());
    });
    const stats = columns.map((ps) => {
      const at = ps.findIndex((pt) => pt.matches(".numbercounter"));
      const stat = statCell(ps[at], doc);
      const after = paragraphs(ps.slice(at + 1));
      const unit = after.length && after[0].textContent.trim().split(/\s+/).length <= 3 ? [after.shift()] : [];
      const line = (base) => (p) => statRowLine(p, doc, base);
      return __spreadProps(__spreadValues({}, stat), {
        before: paragraphs(ps.slice(0, at)).map(line(1.5)),
        unit: unit.map(line(1.5)),
        rest: after.map(line(1))
      });
    });
    const colours = [...new Set(stats.map((st) => st.colour))];
    const options = [];
    if (stats.length !== 3) options.push(`cols-${Math.min(stats.length, 6)}`);
    if (colours.length === 1 && colours[0] !== "gold") options.push(`stat-${colours[0]}`);
    const sizes = stats.map((st) => st.size).filter(Boolean);
    const size = sizes.length ? sizes.sort((x, y) => x - y)[Math.floor(sizes.length / 2)] : 5;
    if (size <= 4) options.push("stat-s");
    else if (size >= 6.5) options.push("stat-l");
    if (stats.some((st) => st.centred)) options.push("text-center");
    const cells = stats.map((st) => {
      const number = doc.createElement("div");
      number.append(...st.before, st.value, ...st.unit);
      const desc = doc.createElement("div");
      desc.append(...st.rest.length ? st.rest : st.desc);
      const keyword = colours.length > 1 ? [st.colour === "white" ? "gold" : st.colour] : [];
      return [...keyword, number, desc];
    });
    const name = options.length ? `Statistics (${options.join(", ")})` : "Statistics";
    const from = row.closest('[class^="cols"]') || row;
    from.replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells }), from));
  }
  function typedStatistics(main, doc) {
    const NUMBER = /^[$€£]?\d[\d.,]*\s*[%+KMBx]*$/;
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const factorOf = (el) => [...el.querySelectorAll('[class*="fontsize-"]')].filter((span) => squash(span.textContent) === squash(el.textContent)).map((span) => span.className.match(/\bfontsize-(\d+)(?:-(\d+))?em\b/) || []).filter((m) => m[1]).reduce((f, m) => f * Number(`${m[1]}.${m[2] || 0}`), 1);
    const colourOf2 = (el) => {
      const view = doc.defaultView;
      let rgb = "";
      for (let n = el; n && !rgb; n = n.parentElement) rgb = rgbOf(n) || "";
      if (!rgb && view) rgb = view.getComputedStyle(el).color.replace(/[^\d,]/g, "");
      return STAT_COLOURS[rgb] || "gold";
    };
    main.querySelectorAll(".colctrl").forEach((row) => {
      if (!row.isConnected || row.closest("[data-keep]")) return;
      const columns = [...row.querySelectorAll(':scope > .row > [class*="col-"]')].filter((col) => col.textContent.trim() || col.querySelector("img"));
      if (columns.length < 2) return;
      const stats = columns.map((col) => {
        const texts = [...col.querySelectorAll(".c-rich-text-editor")].filter((c) => c.textContent.trim());
        if (texts.length !== 1 || col.querySelector("img, video, iframe, .numbercounter")) return null;
        const ps = [...texts[0].querySelectorAll("p")].filter((p) => p.textContent.trim());
        const [first, ...rest] = ps;
        const raw = first ? first.textContent : "";
        const tagged = (raw.match(/\[\[color-([a-z-]+)\]/) || [])[1];
        const figure = raw.replace(/\[\[[^\][]*\]|\]/g, "").trim();
        if (!figure || !NUMBER.test(figure) || !rest.length || !first.querySelector(".futura-bold, b, strong")) return null;
        const factor = factorOf(first);
        if (factor < 2.5) return null;
        const value = doc.createElement("p");
        value.textContent = figure;
        return {
          value,
          rest: rest.map((p) => statRowLine(p, doc, 1)),
          colour: (tagged && Object.values(STAT_COLOURS).includes(tagged) ? tagged : "") || colourOf2([...first.querySelectorAll("*")].pop() || first),
          // the number's share of the 1440px page width (14px base text)
          size: factor * 14 * 100 / 1440
        };
      });
      if (stats.some((st) => !st)) return;
      const colours = [...new Set(stats.map((st) => st.colour))];
      const options = [];
      if (stats.length !== 3) options.push(`cols-${Math.min(stats.length, 6)}`);
      if (colours.length === 1 && colours[0] !== "gold") options.push(`stat-${colours[0]}`);
      const size = stats.map((st) => st.size).sort((x, y) => x - y)[Math.floor(stats.length / 2)];
      if (size <= 4) options.push("stat-s");
      else if (size >= 6.5) options.push("stat-l");
      const cells = stats.map((st) => {
        const number = doc.createElement("div");
        number.append(st.value);
        const desc = doc.createElement("div");
        desc.append(...st.rest);
        const keyword = colours.length > 1 ? [st.colour] : [];
        return [...keyword, number, desc];
      });
      const name = options.length ? `Statistics (${options.join(", ")})` : "Statistics";
      const from = row.closest('[class^="cols"]') || row;
      from.replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells }), from));
    });
  }
  function statisticsBlocks(main, doc) {
    const done = /* @__PURE__ */ new Set();
    main.querySelectorAll(".numbercounter").forEach((component) => {
      if (done.has(component) || !component.querySelector('[data-widget="numbercounter"]')) return;
      const row = component.closest(".colctrl");
      const parts = row ? [...row.querySelectorAll(':scope > .row > [class*="col-"] > .row > *')] : [component];
      const counters = parts.filter((p) => p.matches(".numbercounter"));
      const others = parts.filter((p) => !p.matches(".numbercounter") && p.textContent.trim());
      if (row && others.length && stdReviewPage(doc)) {
        const columns = [...row.querySelectorAll(':scope > .row > [class*="col-"]')].map((col) => [...col.querySelectorAll(":scope > .row > *")]).filter((ps) => ps.some((pt) => pt.textContent.trim()));
        if (columns.length >= 2 && columns.every((ps) => ps.filter((pt) => pt.matches(".numbercounter")).length === 1)) {
          counters.forEach((c) => done.add(c));
          statisticsRow(row, columns, doc);
          return;
        }
      }
      if (row && (others.length || counters.length < 2)) return;
      counters.forEach((c) => done.add(c));
      const stats = counters.map((c) => statCell(c, doc));
      const colours = [...new Set(stats.map((s) => s.colour))];
      const options = [];
      if (counters.length !== 3) options.push(`cols-${Math.min(counters.length, 6)}`);
      if (colours.length === 1 && colours[0] !== "gold") options.push(`stat-${colours[0]}`);
      const sizes = stats.map((s) => s.size).filter(Boolean);
      const size = sizes.length ? sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)] : 5;
      if (size <= 4) options.push("stat-s");
      else if (size >= 6.5) options.push("stat-l");
      if (stats.some((s) => s.centred)) options.push("text-center");
      const cells = stats.map((s) => {
        const desc = doc.createElement("div");
        desc.append(...s.desc);
        const keyword = colours.length > 1 ? [s.colour === "white" ? "gold" : s.colour] : [];
        return [...keyword, s.value, desc];
      });
      const name = options.length ? `Statistics (${options.join(", ")})` : "Statistics";
      const from = row ? row.closest('[class^="cols"]') || row : component;
      from.replaceWith(keepBlock(WebImporter.Blocks.createBlock(doc, { name, cells }), from));
    });
  }
  var WIDGET_VARIANTS = [
    [/medical-information-request/, "medical-information-request"],
    [/mapbox|coverage|map\b/, "map"],
    [/calculator|surfaces-rental/, "calculator"]
  ];
  function widgetBlock(doc, variant, href) {
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.textContent = href;
    return keepBlock(WebImporter.Blocks.createBlock(doc, { name: `Widget (${variant})`, cells: [[a]] }));
  }
  function microApps(main, doc) {
    main.querySelectorAll(".c-remoteComponent").forEach((component) => {
      const value = (component.querySelector(".hdnSelComp") || {}).value || component.querySelector(".hdnSelComp") && component.querySelector(".hdnSelComp").getAttribute("value") || "";
      const raw = value.split("|")[1];
      if (!raw) return;
      let url;
      try {
        url = new URL(raw.trim());
      } catch (e) {
        return;
      }
      url.host = "microapp.stryker.com";
      const hit = WIDGET_VARIANTS.find(([re]) => re.test(url.pathname.toLowerCase()));
      const from = component.closest(".remotecomponent") || component;
      from.replaceWith(widgetBlock(doc, hit ? hit[1] : "product-explorer", url.href));
    });
    main.querySelectorAll(".c-cventComponent").forEach((component) => {
      const box = component.querySelector("[data-calendar-id]");
      if (!box) return;
      const href = `https://www.cvent.com/c/calendar/${box.getAttribute("data-calendar-id")}?widget=${box.getAttribute("data-widget-id") || ""}`;
      (component.closest(".cventcomponent") || component).replaceWith(widgetBlock(doc, "cvent", href));
    });
  }
  var hexOf2 = (rgba) => {
    const m = String(rgba).match(/(\d+)\D+(\d+)\D+(\d+)/);
    return m ? `#${m.slice(1, 4).map((c) => Number(c).toString(16).padStart(2, "0")).join("")}` : "";
  };
  function chartBlock(component, doc) {
    const value = (cls) => {
      const input = component.querySelector(`input.${cls}`);
      return input ? (input.value || input.getAttribute("value") || "").trim() : "";
    };
    const pie = component.matches('[data-widget="pie-chart"]');
    const rows = [];
    const title = value("chartTitle");
    if (title) {
      const cell = doc.createElement("div");
      if (/<p[\s>]/.test(title)) {
        const parsed = new DOMParser().parseFromString(title, "text/html");
        [...parsed.body.querySelectorAll("span")].reverse().forEach((span) => {
          const size = (span.className.match(/\bfontsize-(\d+(?:-\d+)?)em\b/) || [])[1];
          const tags = [size ? `text-${size}` : "", /\burw-egyptienne\b/.test(span.className) ? "serif" : ""].filter(Boolean);
          const inner = [...span.childNodes];
          if (/\bfutura-bold\b/.test(span.className)) {
            const strong = doc.createElement("strong");
            strong.append(...inner);
            span.replaceWith(strong);
            return;
          }
          if (tags.length) span.replaceWith(doc.createTextNode(`[[${tags.join(",")}]`), ...inner, doc.createTextNode("]"));
          else span.replaceWith(...inner);
        });
        cell.append(...parsed.body.childNodes);
      } else {
        const p = doc.createElement("p");
        p.textContent = title;
        cell.append(p);
      }
      rows.push([cell]);
    }
    [...component.querySelectorAll("select option")].forEach((option) => {
      const raw = option.textContent.trim();
      const parts = pie ? raw.split(/\s*\+\s*/) : raw.split("|");
      const label = pie ? parts[0] : parts[1];
      const colour = hexOf2(pie ? parts[2] : parts[0]);
      if (label === void 0) return;
      rows.push([label.trim(), option.getAttribute("value") || "", colour]);
    });
    if (!pie && value("yAxisTitle")) rows.push(["Axis title", value("yAxisTitle")]);
    if (!pie && value("maxValue")) rows.push(["Axis maximum", value("maxValue")]);
    let type = value("chartType").toLowerCase() === "bar" ? "bar" : "column";
    if (pie) type = "pie";
    const options = [type];
    if (!pie && value("dataLabelDisplay") === "true") options.push("data-labels");
    return WebImporter.Blocks.createBlock(doc, { name: `Chart (${options.join(", ")})`, cells: rows });
  }
  function charts(main, doc) {
    main.querySelectorAll('.c-animated-bar-chart, [data-widget="pie-chart"]').forEach((component) => {
      if (!component.querySelector("select option")) return;
      const from = component.closest(".animatedbarchart, .pieChart") || component;
      const block = chartBlock(component, doc);
      block.setAttribute("data-std-table", "");
      from.replaceWith(keepBlock(block, from));
    });
  }
  function dmSetImages(path) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `https://media-assets.stryker.com/is/image/${path}?req=set,json`, false);
      xhr.send();
      if (xhr.status !== 200) return [];
      const text5 = xhr.responseText;
      const json = JSON.parse(text5.slice(text5.indexOf("{"), text5.lastIndexOf("}") + 1));
      return [].concat(json.set && json.set.item || []).map((item) => item.i && item.i.n).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  function mediaGalleries(main, doc) {
    main.querySelectorAll(".mixedmediagallery").forEach((component) => {
      const asset = component.querySelector("[data-asset-path]");
      const path = asset && asset.getAttribute("data-asset-path");
      if (!path) {
        component.remove();
        return;
      }
      const type = (asset.getAttribute("data-asset-type") || "").toLowerCase();
      const link2 = (name) => {
        const a = doc.createElement("a");
        a.href = `https://media-assets.stryker.com/is/image/${name.replace(/ /g, "%20")}`;
        a.textContent = a.href;
        return a;
      };
      const images = dmSetImages(path);
      const rows = (images.length ? images : [path]).map((name) => [link2(name)]);
      const block = WebImporter.Blocks.createBlock(doc, {
        name: type === "spinset" ? "Media Gallery (spin-set)" : "Media Gallery",
        cells: rows
      });
      block.setAttribute("data-std-table", "");
      component.replaceWith(keepBlock(block, component));
    });
  }
  function newsLists(main, doc) {
    main.querySelectorAll(".c-newsandannouncements").forEach((component) => {
      const canonical = doc.querySelector('link[rel="canonical"]');
      let folder = "";
      try {
        folder = new URL(canonical ? canonical.href : doc.location.href).pathname.replace(/\/index\.html$/, "").replace(/\.html$/, "");
      } catch (e) {
        folder = "";
      }
      if (!folder) return;
      const labels = [...component.querySelectorAll(".tab-link")].map((t) => t.textContent.trim());
      const rows = [["Folder", folder]];
      if (labels[0]) rows.push(["All", labels[0]]);
      labels.slice(1).forEach((label) => rows.push(["Tab", label, label]));
      const dates = !!component.querySelector(".news h5");
      const block = WebImporter.Blocks.createBlock(doc, {
        name: dates ? "News List (show-dates)" : "News List",
        cells: rows
      });
      block.setAttribute("data-std-table", "");
      const from = component.closest(".newsandannouncements") || component;
      from.replaceWith(keepBlock(block, from));
    });
  }
  function numberCounters(main, doc, h) {
    if (STD_DRAFT_IMPORT) newsLists(main, doc);
    if (STD_DRAFT_IMPORT) mediaGalleries(main, doc);
    if (STD_DRAFT_IMPORT) microApps(main, doc);
    if (STD_DRAFT_IMPORT) statisticsBlocks(main, doc);
    if (stdProductPage(doc)) typedStatistics(main, doc);
    if (STD_DRAFT_IMPORT) charts(main, doc);
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
  function eventCalendars(main, doc) {
    if (STD_DRAFT_IMPORT) {
      eventCalendarBlocks(main, doc);
      return;
    }
    main.querySelectorAll(".c-event").forEach((component) => (component.closest(".event") || component).remove());
  }
  function convertBeforeRows(main, doc, h) {
    fastFacts(main, doc, h);
    whiteText(main, doc, h);
    interactiveImages(main, doc);
    numberCounters(main, doc, h);
    accordionsInColumns(main, doc, h);
    eventCalendars(main, doc);
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

  // tools/importer/product-detail-xf.js
  var product_detail_xf_default = {
    "/us/en/acute-care/products/arise-1000-ex.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/bari-10a.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/barimatt-plus.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/bedside-stands.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/comfortgel-se.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/comfortgel.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/cub.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/eye-surgery.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/fluoroscopy-stretcher.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/gynnie.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/ibed-wireless.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master"
    ],
    "/us/en/acute-care/products/intouch.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/isoair.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      null,
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/isoflex-lal.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/isoflex-se.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/isolibrium.html": [
      "/content/experience-fragments/stryker/acute-care/en/products/isolibrium_770039638/hotspot/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/isotour.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/ld-304.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/michael-graves-with-stryker.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/mv3.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/nara-bassinet.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/prime-series.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/prime-tc.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/primex-x-ray.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/procuity-icu.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/procuity.html": [
      "/content/experience-fragments/stryker/acute-care/en/products/analytics/analytics-cta/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/proform.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/s3.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/side-seating.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/sofcare-chair-cushion.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/sofcare-overlay.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/spr-plus.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/stretcher-chairs.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/surgistool.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/symmetry-plus.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/transport.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/tru-fit.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/trurize.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/ultracomfort--se.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/unity-furniture.html": [
      "/content/experience-fragments/stryker/acute-care/en/products/unity_furniture/sleeper-bench/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/lead-gen-social/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"
    ],
    "/us/en/acute-care/products/vocera-analytics.html": [
      "/content/experience-fragments/stryker/acute-care/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/communications/products/Fortress-wall-system.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/accend-surgical-light.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/berchtold-led-f-gen.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/connected-or-ip.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/connected-or-lite.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/customized-suspension-solutions.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/equipment-management-accessories.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/hospital-status.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/isuite-diagnostic-4k-large-monitor-systems.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/isuite-ehr-connectivity.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/isuite-live-video.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/isuite-media-management.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/nurse-documentation-stations.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/oculan.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/operon-accessories.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/operon-d770.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/operon-d830.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/operon-d860.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/or-renovation-services.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/project-services.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/room-cameras.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/s-series-equipment-management-system.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/slx-surgical-light.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/sterile-control--.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/strykecam-4k.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/surgical-monitor-mounting.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/teletom.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/universal-device-connection.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/universal-display-mount.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/visum-blade-led.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/visum-led-ii.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/wall-control.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/wall-control/sirca-exam-light.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/communications/products/wall-mounted-lcd-displays.html": [
      "/content/experience-fragments/stryker/communications/en/contact_information/header/master",
      "/content/experience-fragments/stryker/communications/en/contact_information/contact/master"
    ],
    "/us/en/craniomaxillofacial/products/pediatric-mandibular-distractor.html": [
      "/content/experience-fragments/stryker/craniomaxillofacial/en/products/pediatric-mandibular-distractor/master"
    ],
    "/us/en/craniomaxillofacial/products/sternalplate.html": [
      "/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/count-on-us/count-on-us-v2",
      "/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/pull-out-force/pull-out-force-v2",
      "/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/related-products/master"
    ],
    "/us/en/craniomaxillofacial/products/tmj-concepts.html": [
      "/content/experience-fragments/stryker/craniomaxillofacial/en/products/tmj-concepts/master"
    ],
    "/us/en/emergency-care/products/code-stat.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/data-professional-services.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master"
    ],
    "/us/en/emergency-care/products/evacuation-chair.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/heartsine-samaritan-pad-360p.html": [
      "/content/experience-fragments/stryker/emergency-care/en/homepage/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master"
    ],
    "/us/en/emergency-care/products/heartsine-samaritan-pad-450p.html": [
      "/content/experience-fragments/stryker/emergency-care/en/homepage/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master"
    ],
    "/us/en/emergency-care/products/lifelink-central.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifenet-care.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifenet-system.html": [
      "/content/experience-fragments/stryker/emergency-care/en/data_solutions/professional-services/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifepak-1000-defibrillator.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifepak-15.html": [
      "/content/experience-fragments/stryker/emergency-care/en/homepage/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifepak-35.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/intuitive-clinically-advanced-proven/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lifepak-cr2.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_cr2/callout/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lithium-ion-battery.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/lucas-3.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/lucas/lucas-clinical-evidence/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/lucas/lucas-product-specifications/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/lucas/sidebar-links/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/mcgrath-mac-ems.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/mx-pro-bariatric-transport.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/performance-load.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/performance-pro-xt.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/power-load.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/homepage/social-icons/master"
    ],
    "/us/en/emergency-care/products/power-pro-2.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/pp2/sem/master1",
      "/content/experience-fragments/stryker/emergency-care/en/products/pp2/sem/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/pp2/sem/master2",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/tech-support-and-procare",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/stair-pro.html": [
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/xpedition-powered-stair-chair.html": [
      "/content/experience-fragments/stryker/emergency-care/en/homepage/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master"
    ],
    "/us/en/emergency-care/products/xpr-restraints.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/emergency-care/products/xps-siderails.html": [
      "/content/experience-fragments/stryker/emergency-care/en/lead_gen_form/social-icons/master",
      "/content/experience-fragments/stryker/emergency-care/en/products/us/services_and_support/services-and-support/master",
      "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"
    ],
    "/us/en/endoscopy/products/10-0-mm-laparoscopic-instruments.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1488-hd-3-chip-camera-system.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1588-aim-camera-system.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1588-aim-laproscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1588-sterilization-trays.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1688-camera-head-with-4k-image-resolution0.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/1788-platform.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/4k-32--surgical-display.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/4k-32--surgical-monitor-.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/5-0-mm-laparoscopic-instruments.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/5-0-mm-sliding-lock-graspers.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/ahto-pump.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/aim-4k-autoclavable-camera.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/arthroscopic-instrument-trays.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/breisky-adapt-and-deaver-adapt.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/connected-or-hub0.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/cystoscope-hardware.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/cystoscope-instrumentation.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/dermacell.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/eikon-lt-adapt-se.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/eikon-lt.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/flexible-instruments.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/gynecologic-laparscopy-instruments.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/hardware.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/ideal-eyes-hd-autocalvable-eyepiece-arthroscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/insufflator-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/iris-u-kits.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/l-11-light-source-and-auto-light-technology0.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/l10-aim-light-source.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/laparoscope-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/laparoscopic-instrument-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/laparoscopic-instrument-trays.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/laser-cystoscope-system.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/microcart.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/molli.html": [
      "/content/experience-fragments/stryker/endoscopy/en/products/molli/molli-marker/master",
      "/content/experience-fragments/stryker/endoscopy/en/products/molli/white-paper/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/or-control--device-voice-.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/photonguide-and-photonguide-adapt.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/pinpoint.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/pneumoclear.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/pneumosurexl.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/precision-ac.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/precision-ideal-eyes-hd-autocalvable-c-mount-arthorscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/precision-ideal-eyes-hd-autoclavable-laparoscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/precision-light-source.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/printers.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/pump-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/reposable-electro-surgical-tips.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/resectoscope-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/resectoscope.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/rev360-22-24-fr-resection-products.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/rev360-ideal-eyes-autocalvable-hysteroscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/rev360-kits.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/rev360-semi-flexible-instrumentation.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/semi-rigid-autoclavable-uretroscopes.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/serfas.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/shavers.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/soloassist-ii-robotic-scope-holder.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/spy-elite.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/spy-phi.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/sterilization-trays.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/strykeflow2-pump.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/suction-irrigation-tips.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/suction-irrigation.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/synk-wireless-platform.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/thermedx-fluidsmart-fluid-management-system.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/ureteroscope-accessories.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/urology-gynecology-sterilization-trays.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/video-carts.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/vip-package.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/endoscopy/products/visual-urethrotome.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ],
    "/us/en/interventional-spine/campaign/mild-procedure.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/campaigns/mild/body-copy/master"
    ],
    "/us/en/interventional-spine/campaign/vertebral-compression-fractures.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/campaigns/vertebral_compressio/signs-of-a-vcf/master"
    ],
    "/us/en/interventional-spine/products/bone-cements-and-mixer-and-delivery-systems.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/dekompressor-disc-removal-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/ivas-elite-balloon-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/mild-procedure.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/multigen2-rf-generator-and-venom-cannula-and-electrode-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/omnicurve-curved-balloon-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/optablate-bone-tumor-ablation-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/optablate-bvn.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/spinejack-system.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/interventional-spine/products/vcf-accessories.html": [
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/social-icons/master",
      "/content/experience-fragments/stryker/interventional-spine/en/business_unit_page/footer-links/master"
    ],
    "/us/en/joint-replacement/products/Insignia.html": [
      "/content/experience-fragments/stryker/joint-replacement/en/products/insignia/size-specific-collar/master",
      "/content/experience-fragments/stryker/joint-replacement/en/products/insignia/instrumentation/master"
    ],
    "/us/en/neurovascular/products/axs-catalyst--6.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-catalyst-6/master"
    ],
    "/us/en/neurovascular/products/axs-catalyst-5.html": [
      "/content/experience-fragments/stryker/neurovascular/en/kb---axs-catalyst-5/axs-5-v2"
    ],
    "/us/en/neurovascular/products/axs-catalyst-7.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-catalyst-7/master"
    ],
    "/us/en/neurovascular/products/axs-infinity-ls.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-infinity-ls/master"
    ],
    "/us/en/neurovascular/products/axs-infinity-plus.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-infinity-plus/body"
    ],
    "/us/en/neurovascular/products/axs-lift.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-lift-intracranial-base-catheter/master",
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-lift-intracranial-base-catheter/2-in-1",
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-lift-intracranial-base-catheter/axs-lift-anatomy"
    ],
    "/us/en/neurovascular/products/axs-offset.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/axs-offset/master"
    ],
    "/us/en/neurovascular/products/broadway-system.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/broadway-system/master"
    ],
    "/us/en/neurovascular/products/excelsior--1018--microcatheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/excelsior-1018/master"
    ],
    "/us/en/neurovascular/products/excelsior--sl-10--microcatheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/excelsior-sl-10/master"
    ],
    "/us/en/neurovascular/products/excelsior--xt-17-microcatheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/excelsior-xt-17/master"
    ],
    "/us/en/neurovascular/products/excelsior--xt-27--microcatheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/excelsior-xt-27/master"
    ],
    "/us/en/neurovascular/products/flowgate2--balloon-guide-catheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/flowgate2/flowgate2us"
    ],
    "/us/en/neurovascular/products/guider-softip-xf.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/guider-softip-xf/master"
    ],
    "/us/en/neurovascular/products/inzone-detachment-system.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/inzone-hero/inzone-hero-us"
    ],
    "/us/en/neurovascular/products/merci-balloon-guide-catheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/merci-balloon-guide-catheter/master"
    ],
    "/us/en/neurovascular/products/neuroform-ez-stent-system.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/neuroform-ez/master"
    ],
    "/us/en/neurovascular/products/surpass-evolve.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/surpass-evolve/master"
    ],
    "/us/en/neurovascular/products/surpass-streamline-flow-diverter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/surpass-streamline/master"
    ],
    "/us/en/neurovascular/products/synchro-select-guidewires.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/synchro-select-guidewires/master"
    ],
    "/us/en/neurovascular/products/target--360-detachable-coils.html": [
      null
    ],
    "/us/en/neurovascular/products/target--3d-detachable-coils.html": [
      null
    ],
    "/us/en/neurovascular/products/target-helical-detachable-coils.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/target-helical-detachable-coils/master"
    ],
    "/us/en/neurovascular/products/trak-21.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/trevo-trak-21/master"
    ],
    "/us/en/neurovascular/products/transend--guidewires.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/transend/master"
    ],
    "/us/en/neurovascular/products/transform-occlusion-balloon-catheter.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/transform/master"
    ],
    "/us/en/neurovascular/products/trevo--xp-provue-retriever-.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/trevo-xp/master"
    ],
    "/us/en/neurovascular/products/wingspan-stent-system.html": [
      "/content/experience-fragments/stryker/neurovascular/en/products/wingspan-stent-system/master"
    ],
    "/us/en/nse/products/bone-vac/bone-dust-viability.html": [
      "/content/experience-fragments/stryker/neurosurgical/en/products/bone_vac/bone_dust_viability/bone-dust-viability-chart/master"
    ],
    "/us/en/nse/products/qosmic-led-headlight.html": [
      "/content/experience-fragments/stryker/neurosurgical/en/products/qosmic_led_headlight/a-new-stratosphere-of-quality/master"
    ],
    "/us/en/nse/products/sonopet-iq.html": [
      "/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/header/master",
      "/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/rapid-readiness-image-labels/master",
      "/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/right-sized-for-mis/master"
    ],
    "/us/en/orthopaedic-instruments/products/npseal.html": [
      "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/the-power-of-npwt/master",
      "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/incisions/simple-design-in-a-slim-footprint",
      "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/effective-care-doesn-t-have-to-be-complicated/master",
      "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/simple-design/master"
    ],
    "/us/en/peripheral-vascular/products/artix-thrombectomy-system.html": [
      "/content/experience-fragments/stryker/peripheral_vascular/en/contact/social-media/master"
    ],
    "/us/en/peripheral-vascular/products/clottriever-system.html": [
      "/content/experience-fragments/stryker/peripheral_vascular/en/contact/social-media/master"
    ],
    "/us/en/peripheral-vascular/products/flowtriever-system.html": [
      "/content/experience-fragments/stryker/peripheral_vascular/en/contact/social-media/master"
    ],
    "/us/en/sage/products/hygh-tec.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-air-pump.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-airtap-lc.html": [
      "/content/experience-fragments/stryker/sage/en/products/airtap_lc/did-you-know/master",
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-airtap-xxl.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-airtap.html": [
      "/content/experience-fragments/stryker/sage/en/products/prevalon_airtap/did-you-know/master",
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-barrier-cream-cloths.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-bath-cloths.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-chg-cloths.html": [
      "/content/experience-fragments/stryker/sage/en/products/sage_2_chlorhexidine/features/features-2",
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-foot-and-leg-stabilizer-wedge.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-halfmats.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-heel-protector-i.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-heel-protector-ii.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-heel-protector-iii.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-heel-protector-or.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-incontinence-clean-up-cloths.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-m--microclimate-body-pads.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-m-care.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-mats.html": [
      "/content/experience-fragments/stryker/sage/en/products/prevalon_mats/did-you-know/master",
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-multi-position-mats.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-nose-to-toes.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-oral-hygiene-systems-for-non-ventilated-patients.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-oral-hygiene-systems-for-ventilated-patients.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-oral-hygiene-tools.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-oral-solutions-and-moisturizers.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-primafit.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-primofit.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-rinse-free-shampoo-caps.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-self-oral-care.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-sps.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-tap-1-0.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-tap-2-0.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-tap-lc.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-tap-xl-xxl.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/sage/products/sage-traptex.html": [
      "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master",
      "/content/experience-fragments/stryker/sage/en/footer/footer/master"
    ],
    "/us/en/smart-care/products/ambient-monitoring.html": [
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master",
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master1",
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master2",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master"
    ],
    "/us/en/smart-care/products/sync-badge.html": [
      "/content/experience-fragments/stryker/smart_care/en/products/us/sync_badge/interpreter-callout/master",
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/virtual-monitoring.html": [
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master",
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master1",
      "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/tabs-content/master2",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master"
    ],
    "/us/en/smart-care/products/virtual-nursing.html": [
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master"
    ],
    "/us/en/smart-care/products/vocera-accessories.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-collaboration-suite.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-ease.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-edge.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-engage.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-smartbadge.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/smart-care/products/vocera-vina.html": [
      "/content/experience-fragments/stryker/acute-care/en/services/proassure/proassure-cta/master",
      "/content/experience-fragments/stryker/smart_care/en/business_unit/form_sidebar/quick-links/master",
      "/content/experience-fragments/stryker/acute-care/en/business_unit/acute_care/vocera/vocera-resources-links/master"
    ],
    "/us/en/spine/systems/niagara.html": [
      "/content/experience-fragments/stryker/spine/en/products/now_sold_by_vb_spine/now-sold-by-vb-spine/master"
    ],
    "/us/en/sports-medicine/products/2-0-knot-pusher-suture-cutter-and-slotted-cannula-set.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/Adaptable-Arm-Positioner.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/sm-test/sm-test"
    ],
    "/us/en/sports-medicine/products/All-inside-meniscal-repair-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/AlphaVent-hard-body-screw-in-anchor-platform.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/AlphaVent_Knotless.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/FlowPort-Touch-cannula-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/GraftJacket-Now-Ultra-Thick.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/Iconix-HA-plus.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/Iconix-Knotless.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/ProCinch-adjustable-suspensory-fixation-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/allosource-tissue-bank.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/big-dog.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/biosteon-intraline-ha-plla-composite-anchors.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/champion-shoulder-instrumentation-set.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/champion-sliders.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/champion-slingshot-single-portal-suture-passing-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/champion-suture-passer.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/cinchlock-ss-and-cinchlock-flex-knotless-anchor-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/cobra.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/conquest-manual-instruments.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/crossblade-series-cutters.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/crossblade-xl-diamond-burs.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/crossfire-2-integrated-resection-and-energy-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/crossflow-integrated-arthroscopy-pump.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/crossflow-tubing.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/cutter-cannula-set.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/dri-lok-cannula.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/flosteady-select.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/flosteady-tubing.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/formula-series-cutters-and-burs.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/formula-shaver-handpieces.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/g--force-tenodesis-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/gateway.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/gravity.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/hip-check.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/iconix-all-suture-anchor.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/iconix-speed.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/injector-ii-capsule-closure.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/inspace.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/verma-quote/master",
      "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/shorter-op-time/master",
      "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/pain-relief/master",
      "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/safe-and-effective/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/knotilus-knotless-anchor-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/knotilus-plus.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/microfx-osteochondral-drilling-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/nano-tack-peek-anchor.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/nanopass-suture-management-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/nanotack-tt.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/omega.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/peek-intraline.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/peek-zip-anchor.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/phoenix-microfracture-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/pivot-complete-hip-arthroscopy-access-and-instrumentation-kit.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/pivot-guardian-distraction-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/portal-entry-kit.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/reelx-stt-reelx-knotless-peek-anchor.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/samurai-blade.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/serfas-energy-platform.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/sharpshooter-inside-out-meniscal-repair-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/slingshot-capsule-restoration-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/slot-meniscal-transplantation-set.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/speed.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/sportsuite-vision.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/header---waitlist",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/suture-and-tape-offerings.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/tps-small-joint-series-cutters-and-burs.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/transport-and-flowport-cannulas.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/twinloop-flex-anchor-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/versitomic-flexible-reaming-system.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/sports-medicine/products/versitomic-isi.html": [
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sports-medicine/en/contact_information/contact/master"
    ],
    "/us/en/surgical-technologies/products/cactus-controlled-substance-waste-management-system.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/surgical-technologies/products/neptune-s.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/surgical-technologies/products/neptune-waste-management-system.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/surgical-technologies/products/photonblade-3-se.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/surgical-technologies/products/procedural-oxygen-mask.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/products/procedural_oxygen_ma/page-body/master"
    ],
    "/us/en/surgical-technologies/products/safeair-smoke-evacuation.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/surgical-technologies/products/surgicount-safety-sponge-system.html": [
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/quick-links/master",
      "/content/experience-fragments/stryker/surgical-technologies/en/footer_contact/resources/master"
    ],
    "/us/en/sustainability/products/Conference.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/ReprocessedSoundStar.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/acunav.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/agilis.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/covidien-kendall.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/ensite-x.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/ep-sustainability.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/harmonic.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/inquiry.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/ivus.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/masimo-lncs.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/myosure.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/nellcor-oximax.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/quality.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/rd-set.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/save-simply-philips-ecg.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/save-simply-sage-prevalon-mats.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/sss-impact.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/sss-impact/Supplychain.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ],
    "/us/en/sustainability/products/viewflex.html": [
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master",
      "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"
    ]
  };

  // tools/importer/review-pages-xf.js
  var review_pages_xf_default = {
    "/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html": [
      "/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/global-statistics/master",
      "/content/experience-fragments/stryker/joint-replacement/en/training_and_educati/stryker_training_aca/sta-callout-and-signup-invite/master"
    ],
    "/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html": [],
    "/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity/or-integration/rise.html": [
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master",
      "/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master"
    ]
  };

  // tools/importer/product-detail-slide-xf.js
  var product_detail_slide_xf_default = {
    "/us/en/acute-care/products/arise-1000-ex.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/arise_1000_ex/hero/master", null]
    ],
    "/us/en/acute-care/products/bari-10a.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/bari10a/hero/master", null]
    ],
    "/us/en/acute-care/products/barimatt-plus.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/barimatt_plus/hero/master", null]
    ],
    "/us/en/acute-care/products/bedside-stands.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/bedside_stands/hero-desktop/master", null]
    ],
    "/us/en/acute-care/products/comfortgel-se.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/comfortgel_se/hero/master", null]
    ],
    "/us/en/acute-care/products/comfortgel.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/comfortgel_1033612095/hero/master", null]
    ],
    "/us/en/acute-care/products/cub.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/cub_2002854361/hero/master", null]
    ],
    "/us/en/acute-care/products/eye-surgery.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/eyesurgery/hero/master", null]
    ],
    "/us/en/acute-care/products/fluoroscopy-stretcher.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/fluoroscopy_682225560/hero/master", null]
    ],
    "/us/en/acute-care/products/gynnie.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/gynnie_296930044/hero/master", null]
    ],
    "/us/en/acute-care/products/ibed-wireless.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/connected_solutions/hero-/master", "/content/experience-fragments/stryker/acute-care/en/products/connected_solutions/hero-/hero-mobile"]
    ],
    "/us/en/acute-care/products/intouch.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/intouch_176844626/hero/master", null]
    ],
    "/us/en/acute-care/products/isoair.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/isoair/master", null]
    ],
    "/us/en/acute-care/products/isoflex-lal.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/isoflex_lal/hero/master", null]
    ],
    "/us/en/acute-care/products/isoflex-se.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/isoflex_se/hero/master", null]
    ],
    "/us/en/acute-care/products/isolibrium.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/isolibrium_770039638/hero/master", null]
    ],
    "/us/en/acute-care/products/isotour.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/isotour_124925642/hero/master", null]
    ],
    "/us/en/acute-care/products/ld-304.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/ld304_1664320189/hero/master", null]
    ],
    "/us/en/acute-care/products/michael-graves-with-stryker.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/michael_graves/hero/master", null]
    ],
    "/us/en/acute-care/products/mv3.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/mv3_927218581/hero/master", null]
    ],
    "/us/en/acute-care/products/nara-bassinet.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/nara_2117989796/hero/master", null]
    ],
    "/us/en/acute-care/products/prime-series.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/prime_series/hero/master", "/content/experience-fragments/stryker/acute-care/en/products/prime_series/hero/hero-mobile"]
    ],
    "/us/en/acute-care/products/prime-tc.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/prime_tc/hero/master", null]
    ],
    "/us/en/acute-care/products/primex-x-ray.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/prime_x_ray/hero/master", null]
    ],
    "/us/en/acute-care/products/procuity-icu.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/procuity/zm-x--hero-desktop/master", "/content/experience-fragments/stryker/acute-care/en/products/procuity/zm-x--hero-desktop/zm-x--hero-mobile"]
    ],
    "/us/en/acute-care/products/procuity.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/procuity/hero-desktop/master", "/content/experience-fragments/stryker/acute-care/en/products/procuity/hero-desktop/le-x----z-x--hero-mobile"]
    ],
    "/us/en/acute-care/products/proform.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/proform_2029112971/hero/master", null]
    ],
    "/us/en/acute-care/products/s3.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/s3/hero/master", null]
    ],
    "/us/en/acute-care/products/side-seating.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/side_seating/hero/master", null]
    ],
    "/us/en/acute-care/products/sofcare-chair-cushion.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/sofcare_chair_cushio/hero/master", null]
    ],
    "/us/en/acute-care/products/sofcare-overlay.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/sofcare_overlay/hero/master", null]
    ],
    "/us/en/acute-care/products/spr-plus.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/spr_plus/hero/master", null]
    ],
    "/us/en/acute-care/products/stretcher-chairs.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/stretcher_chair/hero/master", null]
    ],
    "/us/en/acute-care/products/surgistool.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/surgistool_chair/hero/master", null]
    ],
    "/us/en/acute-care/products/symmetry-plus.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/symmetry_plus/hero/master", null]
    ],
    "/us/en/acute-care/products/transport.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/transport_843230611/hero/master", null]
    ],
    "/us/en/acute-care/products/tru-fit.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/tru_fit/hero/master", null]
    ],
    "/us/en/acute-care/products/trurize.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/trurize_1491731121/hero/master", null]
    ],
    "/us/en/acute-care/products/ultracomfort--se.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/ultracomfort_se/hero/master", null]
    ],
    "/us/en/acute-care/products/unity-furniture.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/unity_furniture/hero/master", null]
    ],
    "/us/en/communications/products/oculan.html": [
      ["/content/experience-fragments/stryker/communications/en/products/oculan/master", "/content/experience-fragments/stryker/communications/en/products/oculan/oculan-mobile"]
    ],
    "/us/en/communications/products/operon-d860.html": [
      ["/content/experience-fragments/stryker/communications/en/products/operon-d860/hero", "/content/experience-fragments/stryker/communications/en/products/operon-d860/hero---mobile"]
    ],
    "/us/en/communications/products/strykecam-4k.html": [
      ["/content/experience-fragments/stryker/communications/en/products/strykecam-hd/hero", "/content/experience-fragments/stryker/communications/en/products/strykecam-hd/hero---mobile"]
    ],
    "/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html": [
      ["/content/experience-fragments/stryker/communications/en/systems/isuite_experience/connected-or/master", null]
    ],
    "/us/en/craniomaxillofacial/products/sternalplate.html": [
      ["/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/carousel-test/carousel-test-desktop-2", "/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/carousel-test/carousel-test-mobile"],
      ["/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/pull-out-force/carousel-test-desktop", "/content/experience-fragments/stryker/craniomaxillofacial/en/products/sternal_plate/pull-out-force/carousel-test-mobile"]
    ],
    "/us/en/craniomaxillofacial/products/titanium-palatal-splints.html": [
      ["/content/experience-fragments/stryker/craniomaxillofacial/en/products/titanium_palatal_spl/carousel/carousel-video/master", "/content/experience-fragments/stryker/craniomaxillofacial/en/products/titanium_palatal_spl/carousel/carousel-video/mobile"]
    ],
    "/us/en/emergency-care/products/code-stat.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/code_stat/hero/master", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/code_stat/full-width-image/master", null]
    ],
    "/us/en/emergency-care/products/data-professional-services.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/data_professional_se/hero/master", null]
    ],
    "/us/en/emergency-care/products/evacuation-chair.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/evacuation_chair/hero/master", null]
    ],
    "/us/en/emergency-care/products/heartsine-samaritan-pad-360p.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/heartsine_samaritan__1358105743/hero/master", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/heartsine_samaritan__1358105743/full-width-image/master", null]
    ],
    "/us/en/emergency-care/products/heartsine-samaritan-pad-450p.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/heartsine_samaritan_/hero/master", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/heartsine_samaritan_/full-width-image/master", null]
    ],
    "/us/en/emergency-care/products/lifelink-central.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifelink_central/hero/master", null]
    ],
    "/us/en/emergency-care/products/lifenet-care.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/lifenet_care/hero/master", null]
    ],
    "/us/en/emergency-care/products/lifenet-system.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifenet_system/hero/master", null]
    ],
    "/us/en/emergency-care/products/lifepak-1000-defibrillator.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_1000_defibri/hero/master", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_1000_defibri/full-width-image/master", null]
    ],
    "/us/en/emergency-care/products/lifepak-15.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_15/hero/hero-v4", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_15/full-width-image/full-width-v4", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_15/full-width-image/quote-v4", null]
    ],
    "/us/en/emergency-care/products/lifepak-35.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/hero/master", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/master", "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/master-mobile"],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/hospital-workflow", "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/minimal-mobile"],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/navigation", "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_35/product_page/quotes/navigation-mobile"]
    ],
    "/us/en/emergency-care/products/lifepak-cr2.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_cr2/hero/master", "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_cr2/hero/master"],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_cr2/lifestyle-photos/master", "/content/experience-fragments/stryker/emergency-care/en/products/us/lifepak_cr2/lifestyle-photos/lifestyle-collage-mobile"]
    ],
    "/us/en/emergency-care/products/lithium-ion-battery.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lithium_ion/hero/master", null]
    ],
    "/us/en/emergency-care/products/lucas-3.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/lucas_3/hero/master", "/content/experience-fragments/stryker/emergency-care/en/products/us/lucas_3/hero/hero-mobile"]
    ],
    "/us/en/emergency-care/products/mcgrath-mac-ems.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/mcgrath_mac_ems/hero/master", null]
    ],
    "/us/en/emergency-care/products/mx-pro-bariatric-transport.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/mx_pro_bariatric/hero/master", null]
    ],
    "/us/en/emergency-care/products/performance-load.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/performance_load/hero/master", null]
    ],
    "/us/en/emergency-care/products/performance-pro-xt.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/performance_pro_xt/hero/master", null]
    ],
    "/us/en/emergency-care/products/power-pro-2.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/pp2/hero/master", null]
    ],
    "/us/en/emergency-care/products/stair-pro.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/stair_pro/hero/master", null]
    ],
    "/us/en/emergency-care/products/xpedition-powered-stair-chair.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/xpedition/image/header", null],
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/xpedition/image/master", null]
    ],
    "/us/en/emergency-care/products/xpr-restraints.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/xpr/hero/master1", null]
    ],
    "/us/en/emergency-care/products/xps-siderails.html": [
      ["/content/experience-fragments/stryker/emergency-care/en/products/us/xps_siderails/hero/master", null]
    ],
    "/us/en/endoscopy/products/1788-platform.html": [
      ["/content/experience-fragments/stryker/endoscopy/en/products/_1788_platform/hero-image/master", "/content/experience-fragments/stryker/endoscopy/en/products/_1788_platform/hero-image/mobile"]
    ],
    "/us/en/endoscopy/products/molli.html": [
      ["/content/experience-fragments/stryker/endoscopy/en/products/molli/hero/master", "/content/experience-fragments/stryker/endoscopy/en/products/molli/hero/hero---mobile"]
    ],
    "/us/en/endoscopy/products/spy-phi.html": [
      ["/content/experience-fragments/stryker/endoscopy/en/products/spy_phi/hero/master", "/content/experience-fragments/stryker/endoscopy/en/products/spy_phi/hero/hero---mobile"]
    ],
    "/us/en/foot-and-ankle/products/augment.html": [
      ["/content/experience-fragments/stryker/foot-and-ankle/en/products/augment/carousel-slide-desktop/master", null],
      ["/content/experience-fragments/stryker/foot-and-ankle/en/products/augment/carousel-slide-desktop/master", null],
      ["/content/experience-fragments/stryker/foot-and-ankle/en/products/augment/carousel-slide-desktop/master", null],
      ["/content/experience-fragments/stryker/foot-and-ankle/en/products/augment/carousel-slide-desktop/master", null]
    ],
    "/us/en/foot-and-ankle/products/prostep.html": [
      ["/content/experience-fragments/stryker/foot-and-ankle/en/products/prostep/master", null]
    ],
    "/us/en/joint-replacement/products/Insignia.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/insignia/insignia_carousel/carousel---desktop/master", "/content/experience-fragments/stryker/joint-replacement/en/products/insignia/insignia_carousel/carousel---desktop/mobile-hero"]
    ],
    "/us/en/joint-replacement/products/Triathlon_Revision.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/triathlon_revision/hero/master", "/content/experience-fragments/stryker/joint-replacement/en/products/triathlon_revision/hero/mobile"]
    ],
    "/us/en/joint-replacement/products/accolade-ii.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/accolade-ii/clinical-performance-carousel-1", null],
      ["/content/experience-fragments/stryker/joint-replacement/en/products/accolade-ii/clinical-performance-carousel-2", null],
      ["/content/experience-fragments/stryker/joint-replacement/en/products/accolade-ii/clinical-performance-carousel-3", null],
      ["/content/experience-fragments/stryker/joint-replacement/en/products/accolade-ii/clinical-performance-carousel-4", null],
      ["/content/experience-fragments/stryker/joint-replacement/en/products/accolade-ii/clinical-performance-carousel-5", null]
    ],
    "/us/en/joint-replacement/products/gmrs.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/gmrs-hero/master", "/content/experience-fragments/stryker/joint-replacement/en/products/gmrs-hero/mobile"]
    ],
    "/us/en/joint-replacement/products/triathlon-hinge.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/traithlon_hinge/hero/master", "/content/experience-fragments/stryker/joint-replacement/en/products/traithlon_hinge/hero/mobile"]
    ],
    "/us/en/joint-replacement/products/triathlon-ts.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/products/triathlon_ts/gmrs-hero/v2", "/content/experience-fragments/stryker/joint-replacement/en/products/triathlon_ts/gmrs-hero/mobile"]
    ],
    "/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html": [
      ["/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/mako-means-more-hero/master", "/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/mako-means-more-hero/mobile"]
    ],
    "/us/en/nse/products/core-2-console.html": [
      ["/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/master", "/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/core-2-console-header-1---mobile"],
      ["/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/core-2-console-header-3", "/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/core-2-console-header-30"],
      ["/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/core-2-console-header-2", "/content/experience-fragments/stryker/neurosurgical/en/products/core_2_console/core-2-console-header/core-2-console-header-2---mobile"]
    ],
    "/us/en/nse/products/qosmic-led-headlight.html": [
      ["/content/experience-fragments/stryker/neurosurgical/en/products/qosmic_led_headlight/carousel/master", null]
    ],
    "/us/en/nse/products/sonopet-iq.html": [
      ["/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/pulse-control-carousel/master", null],
      ["/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/lap-tip-carousel-video/master", null],
      ["/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/right-sized-for-mis/carousel---desktop", "/content/experience-fragments/stryker/neurosurgical/en/products/sonopet_iq/right-sized-for-mis/carousel---mobile"]
    ],
    "/us/en/nse/products/spine-guidance-software-copilot.html": [
      ["/content/experience-fragments/stryker/neurosurgical/en/products/copilot/copilot-carousel/master", null]
    ],
    "/us/en/orthopaedic-instruments/products/System-9-Power-Tools.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/system_9/hero-banner/master", "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/system_9/hero-banner/mobile"]
    ],
    "/us/en/orthopaedic-instruments/products/bpx.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/bpx/desktop-hero/master", null],
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/bpx/your-grip-your-way-desktop/master", null]
    ],
    "/us/en/orthopaedic-instruments/products/cd-nxt.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/cd_nxt/hero-ambient-video/master", "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/cd_nxt/hero-ambient-video/mobile"]
    ],
    "/us/en/orthopaedic-instruments/products/npseal.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/portable-healing-carousel/master", "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/npseal/portable-healing-carousel/master1"]
    ],
    "/us/en/orthopaedic-instruments/products/steri-shield-8.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/steri_shield_8/carousel/master", "/content/experience-fragments/stryker/orthopaedic-instruments/en/products/steri_shield_8/carousel/mobile"],
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/steri_shield_8/lightest-stryker-helmet/master", null],
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/steri_shield_8/the-toga/master", null]
    ],
    "/us/en/orthopaedic-instruments/products/tpx-hd.html": [
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/tpx_hd/total-joint-and-trauma-hero/master", null],
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/tpx_hd/foot-and-ankle-hero/master", null],
      ["/content/experience-fragments/stryker/orthopaedic-instruments/en/products/tpx_hd/oral-and-maxillofacial/master", null]
    ],
    "/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity/or-integration/rise.html": [
      ["/content/experience-fragments/stryker/corporate/en/portfolios/medical_and_surgical/integration_and_conn/or_integration/rise/hero---desktop/master", "/content/experience-fragments/stryker/corporate/en/portfolios/medical_and_surgical/integration_and_conn/or_integration/rise/hero---desktop/hero---mobile"]
    ],
    "/us/en/sage/products/hygh-tec.html": [
      ["/content/experience-fragments/stryker/sage/en/products/hygh_tec/hero/master", null]
    ],
    "/us/en/sage/products/sage-air-pump.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_air_pump/hero/master", null]
    ],
    "/us/en/sage/products/sage-airtap-lc.html": [
      ["/content/experience-fragments/stryker/sage/en/products/airtap_lc/hero/master", null]
    ],
    "/us/en/sage/products/sage-airtap-xxl.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_airtap_xxl/hero/master", null]
    ],
    "/us/en/sage/products/sage-airtap.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_airtap/hero/master", null]
    ],
    "/us/en/sage/products/sage-barrier-cream-cloths.html": [
      ["/content/experience-fragments/stryker/sage/en/products/comfort_shield_barri/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-bath-cloths.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_bath_cloths/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-chg-cloths.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_2_chlorhexidine/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-foot-and-leg-stabilizer-wedge.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_foot_and_le/hero/master", null]
    ],
    "/us/en/sage/products/sage-halfmats.html": [
      ["/content/experience-fragments/stryker/sage/en/products/halfmats/hero/master", null]
    ],
    "/us/en/sage/products/sage-heel-protector-i.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_heel_protec/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-heel-protector-ii.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_heel_protec_1531116922/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-heel-protector-iii.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_heel_protec_1409719329/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-heel-protector-or.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_heel_protec_1686015655/hero/master", null]
    ],
    "/us/en/sage/products/sage-incontinence-clean-up-cloths.html": [
      ["/content/experience-fragments/stryker/sage/en/products/incontinence_clean_u/hero/master", null]
    ],
    "/us/en/sage/products/sage-m--microclimate-body-pads.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_m2_microclimate/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-m-care.html": [
      ["/content/experience-fragments/stryker/sage/en/products/m_care/hero/master", null]
    ],
    "/us/en/sage/products/sage-mats.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_mats/hero/master", null]
    ],
    "/us/en/sage/products/sage-multi-position-mats.html": [
      ["/content/experience-fragments/stryker/sage/en/products/mp_mats/hero/master", null]
    ],
    "/us/en/sage/products/sage-nose-to-toes.html": [
      ["/content/experience-fragments/stryker/sage/en/products/nose_to_toes/hero/master", null]
    ],
    "/us/en/sage/products/sage-oral-hygiene-systems-for-non-ventilated-patients.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_oral_hygiene_sy/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-oral-hygiene-systems-for-ventilated-patients.html": [
      ["/content/experience-fragments/stryker/sage/en/products/oral_care_ventilator/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-oral-hygiene-tools.html": [
      ["/content/experience-fragments/stryker/sage/en/products/oral_hygiene_tools/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-oral-solutions-and-moisturizers.html": [
      ["/content/experience-fragments/stryker/sage/en/products/oral_solutions_and_m/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-primafit.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_primafit_extern/hero/master", null]
    ],
    "/us/en/sage/products/sage-primofit.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_primofit_extern/hero/master", null]
    ],
    "/us/en/sage/products/sage-rinse-free-shampoo-caps.html": [
      ["/content/experience-fragments/stryker/sage/en/products/sage_rinse_free_sham/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-self-oral-care.html": [
      ["/content/experience-fragments/stryker/sage/en/products/self_oral_care/hero/master", null],
      ["/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/master", "/content/experience-fragments/stryker/sage/en/business_unit/homecare-callout/carousel-option-mobile"]
    ],
    "/us/en/sage/products/sage-sps.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_sps/hero/master", null]
    ],
    "/us/en/sage/products/sage-tap-1-0.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_tap_1_0/hero/master", null]
    ],
    "/us/en/sage/products/sage-tap-2-0.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_tap_2_0/hero/master", null]
    ],
    "/us/en/sage/products/sage-tap-lc.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_tap_lc/hero/master", null]
    ],
    "/us/en/sage/products/sage-tap-xl-xxl.html": [
      ["/content/experience-fragments/stryker/sage/en/products/prevalon_tap_xl_xxl/hero/master", null]
    ],
    "/us/en/sage/products/sage-traptex.html": [
      ["/content/experience-fragments/stryker/sage/en/products/traptex_plumbing/hero/master", null]
    ],
    "/us/en/smart-care/products/ambient-monitoring.html": [
      ["/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/hero/master", "/content/experience-fragments/stryker/smart_care/en/products/us/ambient_monitoring/hero/master"]
    ],
    "/us/en/smart-care/products/sync-badge.html": [
      ["/content/experience-fragments/stryker/acute-care/en/products/sync_badge/hero/master", "/content/experience-fragments/stryker/acute-care/en/products/sync_badge/hero/hero-mobile"]
    ],
    "/us/en/smart-care/products/virtual-monitoring.html": [
      ["/content/experience-fragments/stryker/smart_care/en/products/us/virtual_monitoring/hero/master", "/content/experience-fragments/stryker/smart_care/en/products/us/virtual_monitoring/hero/master"]
    ],
    "/us/en/smart-care/products/virtual-nursing.html": [
      ["/content/experience-fragments/stryker/smart_care/en/products/us/virtual_nursing/hero/master", null]
    ],
    "/us/en/sports-medicine/products/ProCinch-adjustable-suspensory-fixation-system.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/procinch/procinch-family-overview/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/procinch/procinch-st-rt/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/procinch/procinch-open-loop/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/procinch/procinch-no-button/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/procinch/slotted-buttons/master", null]
    ],
    "/us/en/sports-medicine/products/iconix-all-suture-anchor.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/iconix_517328090/Iconix/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/iconix_517328090/iconix-intellibraid-technology-slide/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/iconix_517328090/iconix-indication-locations/master", null]
    ],
    "/us/en/sports-medicine/products/inspace.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/InSpace-balloon-implant/master1", "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/InSpace-balloon-implant/master"],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/patient-testimonials/master", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/inspace_carousel_and/hero-image/mobile"],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/jbjs-banner/master", "/content/experience-fragments/stryker/sports-medicine/en/products/InSpace/jbjs-banner/master"]
    ],
    "/us/en/sports-medicine/products/pivot-guardian-distraction-system.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/pivot_guardian/total-hip-system/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/pivot_guardian/pivot-guardian-distraction-hip-system/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/pivot_guardian/pivot-guardian-direct-system/master", null]
    ],
    "/us/en/sports-medicine/products/sportsuite-vision.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/ssv/hero/master", "/content/experience-fragments/stryker/sports-medicine/en/products/ssv/hero/hero---mobile"]
    ],
    "/us/en/sports-medicine/products/versitomic-flexible-reaming-system.html": [
      ["/content/experience-fragments/stryker/sports-medicine/en/products/versitomic_flexible_/hero-image-3/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/versitomic_flexible_/hero-image-2/master", null],
      ["/content/experience-fragments/stryker/sports-medicine/en/products/versitomic_flexible_/hero-image-1/master", null]
    ],
    "/us/en/surgical-technologies/products/procedural-oxygen-mask.html": [
      ["/content/experience-fragments/stryker/surgical-technologies/en/products/procedural_oxygen_ma/header-carousel/master", null]
    ],
    "/us/en/trauma-and-extremities/products/Pangea.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/pangea/ambient-video-banner/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/pangea/ambient-video-banner/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/T2-Alpha-Humeral-Nail.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/T2-Alpha-Humerus/T2-Alpha-Humerus/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/T2-Alpha-Humerus/T2-Alpha-Humerus/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/blueprint.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/blueprint/us/hero_images/ambient-video/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/blueprint/us/hero_images/ambient-video/master"]
    ],
    "/us/en/trauma-and-extremities/products/gamma4.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/gamma4/ambient-video-banner/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/gamma4/ambient-video-banner/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/hoffmann-compact.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/hoffmann_compact/hoffmann-compact/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/hoffmann_compact/hoffmann-compact/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/pangea-femur-reconstruction.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/pangea-frs/ambient-video-banner/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/pangea-frs/ambient-video-banner/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/pro-pelvis.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/pro_pelvis/pro-pelvis/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/pro_pelvis/pro-pelvis/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/shoulder-id.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/shoulder_id/ambient-video/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/shoulder_id/ambient-video/master"]
    ],
    "/us/en/trauma-and-extremities/products/t2-alpha-femur-antegrade-gt-pf.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_femur_anteg_1690556205/t2-alpha-femur-antegrade/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_femur_anteg_1690556205/t2-alpha-femur-antegrade/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/t2-alpha-femur-retrograde.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_femur_retro_1938167867/t2-alpha-femur-retrograde/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_femur_retro_1938167867/t2-alpha-femur-retrograde/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/t2-alpha-tibia.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_tibia/t2-alpha-tibia/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/t2_alpha_tibia/t2-alpha-tibia/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/tornier-hrs.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/tornier_hrs_max/carousel/master", null]
    ],
    "/us/en/trauma-and-extremities/products/tornier-pyrocarbon-humeral-head.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/tornier_pyrocarbon/carousel-image/master", null]
    ],
    "/us/en/trauma-and-extremities/products/variax-2-clavicle-plating-system.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/variax_2_clavicle/hero-banner/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/variax_2_clavicle/hero-banner/mobile"]
    ],
    "/us/en/trauma-and-extremities/products/variax-2-distal-radius-and-distal-ulna.html": [
      ["/content/experience-fragments/stryker/trauma-and-extremities/en/products/variax_2_distal_radi/hero-banner/master", "/content/experience-fragments/stryker/trauma-and-extremities/en/products/variax_2_distal_radi/hero-banner/mobile"]
    ]
  };

  // tools/importer/transformers/long-page-detail-corp-sections.js
  var TEMPLATES = ["long-page-detail-corp", "long-page-detail-corp-fragments"];
  var STD_TABLE = "table[data-std-table]";
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
  var STD_REVIEW_FRAGMENTS = "/drafts/astha/pages/fragments/";
  var REVIEW_FRAGMENTS_V2 = [
    "/mako_smartrobotics_o/global-statistics/master",
    "/lifepak_35/product_page/intuitive-clinically-advanced-proven/master",
    "/emergency-care/en/business_unit/footer/master",
    // 2026-11-27: the slides' media-only fragments (their image or video, as on stryker.com) next
    // to the review documents that held a whole slide
    "/isolibrium_770039638/hero/master",
    "/lifepak_35/hero/master",
    "/lifepak_35/product_page/quotes/master",
    "/lifepak_35/product_page/quotes/hospital-workflow",
    "/lifepak_35/product_page/quotes/navigation",
    "/tpx_hd/total-joint-and-trauma-hero/master",
    "/tpx_hd/foot-and-ankle-hero/master",
    "/tpx_hd/oral-and-maxillofacial/master",
    "/pangea/ambient-video-banner/master",
    "/mako_smartrobotics_o/mako-means-more-hero/master",
    "/isuite_experience/connected-or/master",
    "/or_integration/rise/hero---desktop/master"
  ];
  function reviewFragmentPath(xf) {
    const path = xfToFragmentPath(xf);
    const v2 = REVIEW_FRAGMENTS_V2.some((end) => (xf || "").endsWith(end));
    const review = path && path.replace(/^\/us\/en\/fragments\//, STD_REVIEW_FRAGMENTS);
    if (!review || !v2) return review;
    return /\/master$/.test(review) ? review.replace(/\/master$/, "-v2/master") : `${review}-v2`;
  }
  var MEDIA_LINK = /\/is\/(image|content)\/|\.(m3u8|mp4)(\?|$)/i;
  function isMediaRow(row) {
    const cell = row.cells && row.cells.length === 1 ? row.cells[0] : null;
    if (!cell || cell.querySelector("h1, h2, h3, h4, h5, h6")) return false;
    const media = cell.querySelector("img, picture") || [...cell.querySelectorAll("a[href]")].some((a) => MEDIA_LINK.test(a.getAttribute("href")));
    const words = cell.textContent.replace(/https?:\/\/\S+/g, " ").trim().split(/\s+/).filter(Boolean);
    return !!media && words.length < 25;
  }
  function slideFragments(main, document, page) {
    const slides = product_detail_slide_xf_default[page];
    if (!slides) return "";
    const heroes = [...main.querySelectorAll("table")].filter((t) => /^hero corp\b/i.test(t.rows[0] && t.rows[0].textContent.trim() || ""));
    if (heroes.length !== slides.length) {
      return `${heroes.length} Hero (corp) blocks for ${slides.length} slide XFs: slides left inline`;
    }
    const link2 = (xf) => {
      const a = document.createElement("a");
      a.setAttribute("href", reviewFragmentPath(xf));
      a.textContent = reviewFragmentPath(xf);
      return a;
    };
    heroes.forEach((table, i) => {
      const [desktop, mobile] = slides[i];
      const media = [...table.rows].slice(1).filter(isMediaRow);
      if (media[0]) media[0].cells[0].replaceChildren(link2(desktop));
      if (mobile && media[1]) media[1].cells[0].replaceChildren(link2(mobile));
    });
    return "";
  }
  function markBandGaps(document) {
    if (!stdProductPage(document)) return;
    const bands = [...document.querySelectorAll(".c-full-bleed-panel")].filter((b) => !b.parentElement.closest(".c-full-bleed-panel") && b.getBoundingClientRect().height > 0);
    if (!bands.length) return;
    const skip = "header, footer, .g-header, .g-footer, script, style, noscript, .modal";
    const tops = [];
    const walker = document.createTreeWalker(document.body, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (t.nodeValue.trim() && !t.parentElement.closest(skip)) {
        const range = document.createRange();
        range.selectNodeContents(t);
        const r = range.getBoundingClientRect();
        if (r.height > 0 && r.width > 0) tops.push({ top: r.top, el: t.parentElement });
      }
    }
    const view = document.defaultView;
    const drawn = (el) => {
      if (!view) return false;
      const cs = view.getComputedStyle(el);
      const bg = cs.backgroundColor;
      return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== "rgb(255, 255, 255)" || cs.backgroundImage !== "none" || cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0;
    };
    document.querySelectorAll('main *, [role="main"] *, body > div *').forEach((el) => {
      if (!(el.matches("img, video, iframe, .c-full-bleed-panel") || drawn(el)) || el.closest(skip)) return;
      const r = el.getBoundingClientRect();
      const media = el.matches("img, video, iframe") && el.offsetParent !== null;
      if (r.height > 0 && r.width > 0 || media) tops.push({ top: r.top, el });
    });
    bands.forEach((band) => {
      const { bottom } = band.getBoundingClientRect();
      const below = tops.filter((t) => t.top >= bottom - 2 && !band.contains(t.el));
      if (!below.length) return;
      const gap = Math.round(Math.min(...below.map((t) => t.top)) - bottom);
      if (gap >= 15) band.setAttribute("data-std-space-after", String(gap));
    });
  }
  function dropEmptySections(main) {
    const doc = main.ownerDocument;
    let prev = null;
    main.querySelectorAll("hr").forEach((hr) => {
      if (!prev) {
        prev = hr;
        return;
      }
      const range = doc.createRange();
      range.setStartAfter(prev);
      range.setEndBefore(hr);
      const between = range.cloneContents();
      const empty = !between.textContent.trim() && !between.querySelector("img, picture, video, iframe, table, a, [data-keep]");
      if (empty) hr.remove();
      else prev = hr;
    });
  }
  function productFragments(main, doc, xfs) {
    const slots = [...main.querySelectorAll(".experiencefragment")].filter((slot) => !slot.parentElement.closest(".experiencefragment"));
    if (!xfs || slots.length !== xfs.length) return false;
    slots.forEach((slot, i) => {
      const path = xfs[i] && reviewFragmentPath(xfs[i]);
      const empty = !text4(slot) && !slot.querySelector("img, [data-asset-path], iframe");
      if (!path || empty) {
        slot.remove();
        return;
      }
      const block = fragmentBlock(doc, path);
      block.setAttribute("data-keep", "section");
      slot.replaceWith(block);
    });
    return true;
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
        const label = STD_DRAFT_IMPORT && (title.getAttribute("data-title") || "").trim();
        if (label) spacer.setAttribute("data-anchor", label.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
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
    const widget = nav.closest('[data-widget="local-page-nav"]') || nav.parentElement;
    const firstItem = stdProductPage(doc) && nav.closest(".localpagenavigation").classList.contains("first-item");
    const noTopLine = STD_DRAFT_IMPORT && (firstItem || !(widget && widget.querySelector(".margin-hr.rule-separator")));
    nav.closest(".localpagenavigation").remove();
    if (!parent && !links.length) return null;
    const rows = [];
    if (parent) {
      const a = doc.createElement("a");
      a.href = parent.getAttribute("href");
      a.textContent = text4(parent);
      rows.push([a]);
    }
    const ul = doc.createElement("ul");
    links.forEach((source) => {
      const li = doc.createElement("li");
      const a = doc.createElement("a");
      a.href = source.getAttribute("href");
      a.textContent = text4(source);
      li.append(a);
      ul.append(li);
    });
    rows.push([ul]);
    return WebImporter.Blocks.createBlock(doc, { name: noTopLine ? "Local Nav (no-top-line)" : "Local Nav", cells: rows });
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
    teal: "teal",
    "dark-gray": "dark",
    "dark-blue-gradient": "dark-blue-gradient",
    "dark-purple-gradient": "dark-purple-gradient"
  };
  var BOX_COLOURS_STD = __spreadProps(__spreadValues({}, BOX_COLOURS), {
    gray: "mid-gray",
    "lighter-gray": "pale-gray",
    orange: "dark-gold",
    black: "black",
    "golden-gradient": "gold-gradient",
    "gray-gradient": "gray-gradient",
    "dark-teal-gradient": "teal-gradient",
    "dark-orange-gradient": "orange-gradient"
  });
  var boxColours = () => STD_DRAFT_IMPORT ? BOX_COLOURS_STD : BOX_COLOURS;
  var BOX_VARIANTS = /* @__PURE__ */ new Set(["gray-2", "gold-lead", "dark-lead", "gray-lead"]);
  var SPACE_STEPS = [[0, "space-none"], [3, "space-s"], [5, ""], [10, "space-l"]];
  function spaceStep(boxes) {
    const values = boxes.flatMap((b) => ["top", "right", "bottom", "left"].map((side) => (b.getAttribute("style") || "").match(new RegExp(`padding-${side}\\s*:\\s*([\\d.]+)%`))).filter(Boolean).map((m) => Number(m[1])));
    if (!values.length) return "";
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const steps = stdProductPage(boxes[0].ownerDocument) && median > 0 ? SPACE_STEPS.filter(([v]) => v > 0) : SPACE_STEPS;
    return steps.reduce((best, step) => Math.abs(step[0] - median) < Math.abs(best[0] - median) ? step : best)[1];
  }
  var IMAGE_BORDERS = {
    gray: "image-border",
    teal: "image-border-teal",
    black: "image-border-black",
    blue: "image-border-teal"
  };
  function smallImages(columns) {
    const images = columns.map((col) => col.querySelector(".c-standalone-image img")).filter(Boolean);
    if (!images.length || images.length !== columns.length) return false;
    return images.every((img, i) => {
      const { width } = img.getBoundingClientRect();
      const room = columns[i].getBoundingClientRect().width - 30;
      return width > 0 && room > 0 && width < room * 0.85;
    });
  }
  function valignMiddle(columns) {
    if (columns.length !== 2) return false;
    const imageOf = (col) => [...col.querySelectorAll(".c-standalone-image img, img")].find((img) => img.getBoundingClientRect().height > 0);
    const images = columns.map(imageOf);
    const at = images.findIndex(Boolean);
    if (at < 0 || images.filter(Boolean).length !== 1) return false;
    const textCol = columns[1 - at];
    if (textCol.querySelector("img") || !text4(textCol)) return false;
    const lines = [];
    const walker = textCol.ownerDocument.createTreeWalker(
      textCol,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.trim() && !/^:(start-[a-z0-9-]+|end):$|^\[\[|^\]$/.test(node.nodeValue.trim())) {
        const range = textCol.ownerDocument.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.height > 0) lines.push({ getBoundingClientRect: () => rect });
      }
    }
    if (!lines.length) return false;
    const ib = images[at].getBoundingClientRect();
    const cb = columns[at].getBoundingClientRect();
    const tb = textCol.getBoundingClientRect();
    const sameRow = cb.top < tb.bottom && tb.top < cb.bottom && Math.abs(cb.left - tb.left) > 50;
    if (!sameRow || ib.height < 80) return false;
    const top = Math.min(...lines.map((el) => el.getBoundingClientRect().top));
    const bottom = Math.max(...lines.map((el) => el.getBoundingClientRect().bottom));
    const height = bottom - top;
    const offset = (top + bottom) / 2 - (ib.top + ib.bottom) / 2;
    return height < ib.height * 0.8 && top - ib.top > ib.height * 0.12 && Math.abs(offset) < ib.height * 0.15;
  }
  function markCentredRows(document) {
    if (!STD_DRAFT_IMPORT) return;
    document.querySelectorAll(".colctrl").forEach((colctrl) => {
      const filled = rowColumns(colctrl).filter((col) => text4(col) || col.querySelector("img"));
      if (valignMiddle(filled)) colctrl.setAttribute("data-std-valign", "middle");
    });
  }
  function imageBorder(columns) {
    const colours = columns.flatMap((col) => [...col.querySelectorAll('.c-standalone-image img[class*="bor-"]')].map((img) => (img.className.match(/\bbor-([a-z]+)/) || [])[1]));
    const counts = {};
    colours.forEach((c) => {
      counts[c] = (counts[c] || 0) + 1;
    });
    const main = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return IMAGE_BORDERS[main] || "";
  }
  function cellBox(col) {
    const row = col.closest(".colctrl");
    const boxes = [...col.querySelectorAll(".has-background:not(.bg-white), .dimensional-box")].filter((b) => b.closest(".colctrl") === row && text4(b)).filter((b) => !b.parentElement.closest(".has-background:not(.bg-white), .dimensional-box"));
    if (!boxes.length) return null;
    const colourOf2 = (b) => {
      const bg = (b.className.match(/\bbg-([a-z-]+)/) || [])[1];
      if (b.classList.contains("dimensional-box") && (!bg || bg === "white")) return "boxed";
      return boxColours()[bg] || "";
    };
    const colours = [...new Set(boxes.map(colourOf2))];
    if (colours.length !== 1 || !colours[0]) return { colour: "", kind: "" };
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const boxed = squash(boxes.map((b) => b.textContent).join(""));
    if (boxed === squash(col.textContent)) return { colour: colours[0], kind: "whole", boxes };
    const first = [...col.querySelectorAll(CELL_COMPONENTS)].filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text4(c))[0];
    if (boxes.length === 1 && first && first.contains(boxes[0])) return { colour: colours[0], kind: "lead", boxes };
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
    const colour = colours[0] === "boxed" ? ["box-white", "shadow"] : [`box-${colours[0]}`];
    const space = spaceStep(used.flatMap((b) => b.boxes || []));
    const standard = (cell) => [...colour, cell, space].filter(Boolean).join(", ");
    if (kinds[0] === "lead" && used.length === textCols.length) {
      if (colours[0] === "boxed" && stdProductPage(columns[0].ownerDocument)) return "white-lead";
      const lead = `${colours[0]}-lead`;
      return BOX_VARIANTS.has(lead) ? lead : "";
    }
    const last = columns[columns.length - 1];
    if (kinds[0] === "lead" && used.length === 1 && boxes[columns.length - 1] && last.querySelector(".c-standalone-video, .c-standalone-image, [data-asset-path]")) {
      return standard("");
    }
    if (kinds[0] === "whole") {
      if (used.length > 1 && used.length === textCols.length) return standard("box-all");
      if (used.length === 1) {
        const i = boxes.findIndex(Boolean);
        if (i === columns.length - 1) return standard("");
        if (i === 0) return standard("box-first");
        const middle = `${colours[0]}-${i + 1}`;
        return BOX_VARIANTS.has(middle) ? middle : "";
      }
    }
    return "";
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
    const serif = (style) => (style || "").split(",").map((x) => x.trim()).includes("serif");
    if (STD_DRAFT_IMPORT) {
      copy.filter((n) => sizeTag(n.copyStyle) || serif(n.copyStyle)).forEach((n) => tagCopy(n, [sizeTag(n.copyStyle), serif(n.copyStyle) ? "serif" : ""].filter(Boolean).join(","), doc));
      cells.flat().filter((n) => n.nodeType === 1 && /^H[1-3]$/.test(n.tagName) && n.stdHeadingSize).forEach((n) => tagCopy(n, n.stdHeadingSize, doc));
      const product = stdProductPage(doc);
      if (product) {
        copy.filter((n) => (n.copyStyle || "").split(",").map((x) => x.trim()).includes("disclaimer")).forEach((n) => tagCopy(n, "text-0-8", doc));
      }
      const rest = new Set(copy.flatMap((n) => (n.copyStyle || "").split(",").map((x) => x.trim())).filter((x) => x && x !== "serif" && !/^p-\d/.test(x) && !(product && x === "disclaimer")));
      return [...rest].join(", ");
    }
    const weight = {};
    copy.forEach((n) => {
      weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text4(n).length;
    });
    let dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || "";
    if (sizeTag(dominant) && copy.some((n) => !sizeTag(n.copyStyle))) {
      dominant = dominant.split(",").map((s) => s.trim()).filter((s) => !/^p-\d/.test(s)).join(", ");
    }
    copy.filter((n) => sizeTag(n.copyStyle) && sizeTag(n.copyStyle) !== sizeTag(dominant)).forEach((n) => tagCopy(n, [sizeTag(n.copyStyle), serif(n.copyStyle) && !serif(dominant) ? "serif" : ""].filter(Boolean).join(","), doc));
    const parts = dominant.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.includes("serif") && !parts.some((s) => sizeTag(s))) return ["p-1", ...parts].join(", ");
    return dominant;
  }
  var COLUMN_VARIANTS = {
    "8,4": "columns-67-33",
    "4,8": "columns-33-67",
    "6,6": "columns-50-50",
    "4,4,4": "columns-3-cols",
    "3,3,3,3": "columns-4-cols"
  };
  function columnWidth(col) {
    const m = col.className.match(/\bcol-sm-(\d+)/) || col.className.match(/\bcol-md-(\d+)/);
    return m ? Number(m[1]) : 12;
  }
  function desktopWidth(col) {
    const m = col.className.match(/\bcol-md-(\d+)/) || col.className.match(/\bcol-sm-(\d+)/);
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
  var TILE_MEDIA = 'img, picture, video, iframe, a[href*="/is/content/"], a[href*="/is/image/"], a[href*="youtube.com/"], a[href*="youtu.be/"]';
  var TILE_VIDEO = 'a[href*="/is/content/"], a[href*="youtube.com/"], a[href*="youtu.be/"]';
  var nodeText = (n) => (n.textContent || "").trim();
  var holdsMedia = (n) => n.nodeType === 1 && (n.matches(TILE_MEDIA) || !!n.querySelector(TILE_MEDIA));
  var isTileMedia = (n) => holdsMedia(n) && [...n.querySelectorAll("a")].every((a) => a.matches(TILE_MEDIA)) && !n.querySelector("h1, h2, h3, h4, h5, h6, ul, ol") && (n.matches(TILE_MEDIA) || n.children.length === 1);
  var tileParts = (nodes) => nodes.filter((n) => nodeText(n) || holdsMedia(n));
  var unitOf = (nodes) => {
    const kinds = tileParts(nodes).map((n) => isTileMedia(n) ? "m" : "t");
    return kinds.filter((k, i) => k !== kinds[i - 1]).join("");
  };
  var hrefOf = (n) => {
    const a = n.nodeType === 1 && (n.matches("a[href]") ? n : n.querySelector("a[href]"));
    return a ? a.getAttribute("href").split("#")[0] : "";
  };
  var TILE_KEEP = new RegExp("^(box-(?!all$|first$|last$)[a-z-]+|shadow|space-[a-z]+|image-border(-[a-z]+)?|text-center|image-centre)$");
  var TILE_NOT = /-lead$|^box-first$|^left-border-bottom$/;
  var CARD_COLOUR_LABELS = {
    gray: "Light grey",
    dark: "Dark grey",
    "dark-blue-gradient": "Blue gradient",
    "dark-purple-gradient": "Purple gradient",
    "mid-gray": "Mid grey",
    "pale-gray": "Pale grey",
    "gray-gradient": "Grey gradient",
    "teal-gradient": "Dark teal gradient",
    "orange-gradient": "Dark orange gradient"
  };
  var cardColourLabel = (c) => CARD_COLOUR_LABELS[c] || c.replace(/-/g, " ").replace(/^./, (x) => x.toUpperCase());
  function dropLineBoxes(nodes, colour) {
    nodes.filter((n) => n.nodeType === 1).forEach((n) => {
      [...n.matches("p, h1, h2, h3, h4, h5, h6, li") ? [n] : [], ...n.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].forEach((line) => {
        var _a, _b;
        if (((_a = line.firstChild) == null ? void 0 : _a.nodeType) === 3 && line.firstChild.nodeValue === `[[box-${colour}]` && ((_b = line.lastChild) == null ? void 0 : _b.nodeType) === 3 && line.lastChild.nodeValue === "]") {
          line.firstChild.remove();
          line.lastChild.remove();
        }
      });
    });
  }
  function tileCards(cells, variant, doc, colours = []) {
    if (cells.some((c) => c.some((n) => n.nodeType === 1 && (n.matches("table") || n.querySelector("table"))))) return null;
    const filled = cells.filter((c) => tileParts(c).length);
    const units = filled.map(unitOf);
    const names = variant.split(", ").filter(Boolean);
    const boxed = names.some((v) => v.startsWith("box-") && v !== "box-first");
    const same = units.length > 0 && units.every((u) => u === units[0]);
    if (!same || filled.length < 3 && !(filled.length === 2 && boxed)) return null;
    if (!/^t?m?t?$/.test(units[0]) || names.some((v) => TILE_NOT.test(v))) return null;
    if (stdProductPage(doc) && units[0] === "t" && cells.length === 4) return null;
    const filledColours = cells.map((c, i) => tileParts(c).length ? colours[i] || "" : null).filter((c) => c !== null);
    const perCard = filledColours.length === filled.length && filledColours.every(Boolean) && new Set(filledColours).size > 1;
    const rows = filled.map((nodes, i) => {
      if (perCard) dropLineBoxes(nodes, filledColours[i]);
      const parts = tileParts(nodes);
      const at = parts.findIndex(isTileMedia);
      if (at < 0) return [parts];
      const media = parts[at];
      const next = parts[at + 1];
      let rest = parts.filter((n) => n !== media);
      const others = rest.filter((n) => n !== next).map(hrefOf).filter(Boolean);
      if (next && next.nodeType === 1 && hrefOf(next) && !next.querySelector("strong, u") && others.includes(hrefOf(next))) {
        rest = rest.filter((n) => n !== next);
      }
      return [[media], rest];
    });
    const textCards = rows.every((r) => r.length === 1);
    const video = units[0].includes("m") && filled.every((c) => c.some((n) => n.nodeType === 1 && (n.matches(TILE_VIDEO) || !!n.querySelector(TILE_VIDEO))));
    const perRow = { 2: "two-up", 3: "three-up" }[cells.length] || "";
    const imageOnly = units[0] === "m" || names.includes("media-pair") && rows.every((r) => r.length === 2 && r[1].length === 1 && hrefOf(r[1][0]) && nodeText(r[1][0]) === nodeText(r[1][0].querySelector("a") || r[1][0]));
    const options = [
      textCards ? "text" : "",
      video ? "video" : "",
      perRow,
      ...names.filter((v) => TILE_KEEP.test(v)),
      units[0].startsWith("tm") ? "title-above" : "",
      imageOnly ? "no-text" : ""
    ].filter(Boolean);
    const cardRows = perCard ? rows.map((r, i) => [cardColourLabel(filledColours[i]), ...r]) : rows;
    const named = options.map((o) => o.replace(/^box-dark-(blue|purple)-gradient$/, "box-$1-gradient"));
    return WebImporter.Blocks.createBlock(doc, {
      name: named.length ? `Cards Corp (${named.join(", ")})` : "Cards Corp",
      cells: cardRows
    });
  }
  function xfGridRows(main, doc, selector = ".experiencefragment .aem-Grid") {
    const num = (el, re) => Number(((el.className || "").match(re) || [])[1]) || 0;
    const filled = (el) => !!text4(el) || !!el.querySelector("img, [data-asset-path], iframe");
    [...main.querySelectorAll(selector)].forEach((grid) => {
      if (grid.closest("header, footer, .modal, .colctrl")) return;
      const n = num(grid, /\baem-Grid--(\d+)\b/) || 12;
      const rows = [];
      let row = null;
      [...grid.children].filter((el) => el.classList.contains("aem-GridColumn")).forEach((item) => {
        const span = num(item, /\baem-GridColumn--default--(\d+)\b/) || n;
        const offset = num(item, /\baem-GridColumn--offset--default--(\d+)\b/);
        if (row && row.used + offset + span <= n) {
          row.items.push([span, item]);
          row.used += offset + span;
        } else {
          row = { used: offset + span, items: [[span, item]] };
          rows.push(row);
        }
      });
      rows.forEach((r) => {
        const cells = r.items.filter(([, item]) => filled(item));
        if (cells.length < 2 || cells.some(([, item]) => item.querySelector(".colctrl"))) return;
        if (stdProductPage(doc) && cells.every(([, item]) => !text4(item) && item.querySelector("a[href] img"))) return;
        const colctrl = doc.createElement("div");
        colctrl.className = "colctrl";
        const inner = doc.createElement("div");
        inner.className = "row";
        colctrl.append(inner);
        cells[0][1].before(colctrl);
        cells.forEach(([span, item]) => {
          const col = doc.createElement("div");
          col.className = `col-sm-${span} col-md-${span}`;
          const phone = num(item, /\baem-GridColumn--phone--(\d+)\b/);
          if (stdProductPage(doc) && phone) col.className += ` col-xs-${phone}`;
          col.append(item);
          inner.append(col);
        });
      });
    });
  }
  function columnRows(main, doc) {
    [...main.querySelectorAll(".colctrl")].reverse().forEach((colctrl) => {
      const all = rowColumns(colctrl);
      const filled = all.filter((col) => text4(col) || col.querySelector("img, [data-asset-path], iframe, form, table"));
      const columns = filled.length && filled.length < all.length && all.length >= 3 ? all : filled;
      const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
      if (stdProductPage(doc) && all.length === 2 && filled.length === 1 && all.every((col) => columnWidth(col) === 6)) {
        const box = filled[0].querySelector('.c-largeheadline .has-background[class*="bg-"]');
        const colour = box && { "bg-gold": "box-gold", "bg-light-gray": "box-gray" }[[...box.classList].find((c) => /^bg-/.test(c))];
        if (colour) {
          const nodes = cellNodes(filled[0], doc);
          rowCopyStyle([nodes], doc);
          const cells2 = all.map((col) => col === filled[0] ? nodes : "");
          const first = all[0] === filled[0];
          const block2 = WebImporter.Blocks.createBlock(doc, {
            name: `Columns (columns-50-50, ${colour}${first ? ", box-first" : ""})`,
            cells: [cells2]
          });
          block2.setAttribute("data-keep", "section");
          wrapper.replaceWith(block2);
          return;
        }
      }
      if (columns.length < 2) return;
      const form = marketoBlock(colctrl, doc);
      if (form) {
        form.setAttribute("data-keep", "section");
        const asides = [...colctrl.querySelectorAll("table")].filter((t) => t.getAttribute("data-keep"));
        asides.forEach((t) => t.setAttribute("data-keep", "join"));
        const box = (nodes) => {
          const div = doc.createElement("div");
          div.setAttribute("data-keep", "join");
          div.append(...nodes);
          return div;
        };
        const at = columns.findIndex((col) => col.querySelector(".c-marketo-form"));
        if (STD_DRAFT_IMPORT && at >= 0) {
          const ratio = { 8: "flex-67-33", 4: "flex-33-67" }[columnWidth(columns[0])];
          const side = [];
          const formColumn = (col) => {
            let top = col.querySelector(".c-marketo-form");
            while (top.parentElement && top.parentElement !== col && !top.parentElement.matches(".row")) {
              top = top.parentElement;
            }
            const items = top.parentElement ? [...top.parentElement.children] : [top];
            return items.flatMap((item) => {
              if (item === top) return [form];
              const holder = doc.createElement("div");
              holder.append(item.cloneNode(true));
              const nodes = cellNodes(holder, doc);
              if (!nodes.length) return [];
              side.push(nodes);
              return [box(nodes)];
            });
          };
          const parts2 = columns.map((col, i) => {
            if (i === at) return stdProductPage(doc) ? formColumn(col) : [form];
            if (col.querySelector("table[data-keep]")) return asides.filter((t) => col.contains(t));
            const nodes = cellNodes(col, doc);
            if (nodes.length) side.push(nodes);
            return nodes.length ? [box(nodes)] : [];
          }).flat();
          const copy = rowCopyStyle(side, doc);
          form.setAttribute("data-keep", "join");
          parts2[0].setAttribute("data-keep", "section");
          parts2[0].setAttribute("data-section-style", ["flex", ratio, copy].filter(Boolean).join(", "));
          wrapper.replaceWith(...parts2);
          return;
        }
        const others = columns.filter((col) => !col.querySelector(".c-marketo-form") && !col.querySelector("table[data-keep]")).map((col) => cellNodes(col, doc)).filter((nodes) => nodes.length).map(box);
        wrapper.replaceWith(form, ...asides, ...others);
        return;
      }
      if (STD_DRAFT_IMPORT && colctrl.querySelector(STD_TABLE)) {
        const box = (nodes) => {
          const div = doc.createElement("div");
          div.setAttribute("data-keep", "join");
          div.append(...nodes);
          return div;
        };
        const perColumn = columns.map((col) => {
          const out = [];
          let run = [];
          cellNodes(col, doc).forEach((n) => {
            if (n.nodeType === 1 && n.matches(STD_TABLE)) {
              if (run.length) out.push(box(run));
              run = [];
              n.setAttribute("data-keep", "join");
              out.push(n);
            } else run.push(n);
          });
          if (run.length) out.push(box(run));
          return out;
        }).filter((p) => p.length);
        const parts2 = perColumn.flat();
        if (parts2.length) {
          const ratio = { 8: "flex-67-33", 4: "flex-33-67" }[columnWidth(columns[0])];
          const narrow = ratio === "flex-67-33" ? perColumn[perColumn.length - 1] : perColumn[0];
          const side = perColumn.every((p) => p.length === 1) || ratio && perColumn.length === 2 && narrow.length === 1;
          parts2[0].setAttribute("data-keep", "section");
          if (side) parts2[0].setAttribute("data-section-style", ["flex", ratio].filter(Boolean).join(", "));
          if (wrapper.hasAttribute("data-row-end")) parts2[0].setAttribute("data-row-end", wrapper.getAttribute("data-row-end"));
          wrapper.replaceWith(...parts2);
          return;
        }
      }
      const severalBoxes = columns.some((col) => ((cellBox(col) || {}).boxes || []).length > 1);
      if (stdProductPage(doc) && columns.length === 2 && (!boxVariant(columns) || severalBoxes)) {
        const boxOf = (c) => c.querySelector(":scope > .dimensional-box, :scope > .has-background, :scope > div > .dimensional-box");
        const squash = (v) => (v || "").replace(/[\s\u00a0]+/g, "");
        const texts = columns.map((col) => [...col.querySelectorAll(".c-rich-text-editor")].filter((c) => c.closest(".colctrl") === colctrl && !c.parentElement.closest(".c-rich-text-editor") && text4(c)).map((c) => ({ c, box: boxOf(c) })).map((t) => __spreadProps(__spreadValues({}, t), { variant: t.box ? panelOptions(t.box, t.c) : "" })));
        const onlyBoxes = (i) => texts[i].length > 0 && texts[i].every((t) => t.variant) && squash(texts[i].map((t) => t.c.textContent).join("")) === squash(columns[i].textContent);
        const at = [0, 1].find((i) => onlyBoxes(i) && !texts[1 - i].some((t) => t.variant));
        if (at !== void 0) {
          const panels = texts[at].map(({ c, variant: variant2 }) => {
            const holder = doc.createElement("div");
            holder.append(c.cloneNode(true));
            const nodes = cellNodes(holder, doc);
            rowCopyStyle([nodes], doc);
            nodes.filter((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName) && n.querySelector("strong")).forEach((h) => {
              const walker = doc.createTreeWalker(h, 4);
              const runs = [];
              for (let t = walker.nextNode(); t; t = walker.nextNode()) {
                if (!t.parentElement.closest("strong") && t.nodeValue.replace(/\[\[[^\]]*\]|\]/g, "").trim()) runs.push(t);
              }
              runs.forEach((t) => {
                const m = t.nodeValue.match(/^(\s*(?:\[\[[^\]]*\])*)([\s\S]*?)(\]*\s*)$/);
                if (!m || !m[2].trim()) return;
                t.nodeValue = `${m[1]}[[serif]${m[2]}]${m[3]}`;
              });
            });
            const block2 = WebImporter.Blocks.createBlock(doc, { name: `Panel (${variant2})`, cells: [[nodes]] });
            block2.setAttribute("data-keep", "join");
            return block2;
          });
          const otherNodes = cellNodes(columns[1 - at], doc);
          rowCopyStyle([otherNodes], doc);
          const other = doc.createElement("div");
          other.setAttribute("data-keep", "join");
          other.append(...otherNodes);
          const parts2 = at === 0 ? [...panels, other] : [other, ...panels];
          const ratio = { 8: "flex-67-33", 4: "flex-33-67" }[columnWidth(columns[0])];
          parts2[0].setAttribute("data-keep", "section");
          parts2[0].setAttribute("data-section-style", ["flex", ratio].filter(Boolean).join(", "));
          if (wrapper.hasAttribute("data-row-end")) parts2[0].setAttribute("data-row-end", wrapper.getAttribute("data-row-end"));
          wrapper.replaceWith(...parts2);
          return;
        }
      }
      const key = columns.map(columnWidth).join(",");
      const linked = filled.some((col) => [...col.querySelectorAll(".c-standalone-image")].some(linkedImage));
      const boxes = boxVariant(columns);
      const lineBoxed = /* @__PURE__ */ new Set();
      if (!boxes && STD_DRAFT_IMPORT) {
        columns.flatMap((col) => [...col.querySelectorAll(".has-background:not(.bg-white)")]).filter((b) => b.closest(".colctrl") === colctrl && text4(b) && !b.parentElement.closest(".has-background:not(.bg-white), .dimensional-box")).forEach((b) => {
          const colour = boxColours()[(b.className.match(/\bbg-([a-z-]+)/) || [])[1]];
          if (!colour) return;
          const lines = b.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").length ? b.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li") : b.querySelectorAll(".line");
          lines.forEach((line) => {
            if (!text4(line) || line.parentElement.closest("p, h1, h2, h3, h4, h5, h6, li")) return;
            const into = line.matches(".line") && line.querySelector(":scope > div") ? line.querySelector(":scope > div") : line;
            into.prepend(doc.createTextNode(`[[box-${colour}]`));
            into.append(doc.createTextNode("]"));
          });
          lineBoxed.add(b);
        });
      }
      if (!boxes) {
        colctrl.querySelectorAll("[data-white-tag]").forEach((el) => {
          const inBox = el.closest(".has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel");
          if (!inBox || inBox.matches(".c-full-bleed-panel") || inBox.closest(".colctrl") !== colctrl) return;
          if (lineBoxed.has(inBox)) return;
          if (el.firstChild && el.firstChild.nodeValue === "[[color-white]") el.firstChild.remove();
          if (el.lastChild && el.lastChild.nodeValue === "]") el.lastChild.remove();
          el.removeAttribute("data-white-tag");
        });
      }
      const parts = columns.length === 2 ? [...columns[0].querySelectorAll(`${CELL_COMPONENTS}, .sectionseparator`)].filter((c) => c.closest(".colctrl") === colctrl && (text4(c) || c.matches(".sectionseparator"))) : [];
      const firstRule = parts.length > 1 && parts[parts.length - 1].matches(".sectionseparator");
      const centred = filled.every(centredColumn);
      const layout = COLUMN_VARIANTS[key] || COLUMN_VARIANTS[columns.map(desktopWidth).join(",")];
      const variant = [
        layout,
        linked ? "media-pair" : "",
        stackRow(columns) ? "stack" : "",
        boxes,
        imageBorder(columns),
        centred ? "text-center" : "",
        firstRule ? "left-border-bottom" : "",
        stdProductPage(doc) && smallImages(filled) ? "image-centre" : "",
        stdProductPage(doc) && colctrl.getAttribute("data-std-valign") === "middle" ? "valign-middle" : ""
      ].filter(Boolean).join(", ");
      const cells = columns.map((col) => cellNodes(col, doc));
      const style = rowCopyStyle(cells, doc);
      const colours = STD_DRAFT_IMPORT && !boxes ? columns.map((col) => {
        const box = cellBox(col);
        return box && box.kind === "whole" && box.colour !== "boxed" ? box.colour : "";
      }) : [];
      const block = STD_DRAFT_IMPORT && !colctrl.hasAttribute("data-columns") && tileCards(cells, variant, doc, colours) || WebImporter.Blocks.createBlock(doc, {
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
  function tableCellNodes(td, doc) {
    const cell = td.cloneNode(true);
    cell.querySelectorAll(".cell-mobile-title").forEach((el) => el.remove());
    cell.querySelectorAll(".cell-content").forEach((el) => el.replaceWith(...el.childNodes));
    if (!text4(cell)) return [];
    cell.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("href", newTabHref(a, absoluteAsset(a.getAttribute("href"))));
    });
    const div = doc.createElement("div");
    div.append(...cell.childNodes);
    return [div];
  }
  function headerRow(tr) {
    const cells = [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName));
    if (cells.some((c) => c.tagName === "TH" && text4(c))) return true;
    const filled = cells.filter((c) => text4(c));
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    return filled.length > 0 && filled.every((c) => squash([...c.querySelectorAll("b, strong")].filter((b) => !b.parentElement.closest("b, strong")).map((b) => b.textContent).join("")) === squash(c.textContent));
  }
  function dataTables(main, doc) {
    main.querySelectorAll(".c-patenttables, .c-table").forEach((component) => {
      if (!component.isConnected || component.parentElement.closest(".c-patenttables, .c-table")) return;
      const table = component.querySelector("table");
      const trs = table ? [...table.querySelectorAll("tr")].filter((tr) => text4(tr)) : [];
      if (!trs.length) return;
      const header = headerRow(trs[0]);
      if (header) {
        trs[0].querySelectorAll("b, strong").forEach((b) => b.replaceWith(...b.childNodes));
      }
      const sheet = component.matches(".c-patenttables");
      const options = [
        header ? "" : "no-header",
        sheet || component.matches(".mobile-enabled") ? "mobile-stacked" : "",
        sheet ? "sheet" : ""
      ].filter(Boolean);
      let rows = trs.map((tr) => [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName)).map((td) => tableCellNodes(td, doc)));
      const width = Math.max(...rows.map((r) => r.length));
      const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i] && r[i].length));
      rows = rows.map((r) => used.map((i) => r[i] || []));
      const block = WebImporter.Blocks.createBlock(doc, {
        name: options.length ? `Table (${options.join(", ")})` : "Table",
        cells: rows
      });
      block.setAttribute("data-std-table", "");
      block.setAttribute("data-keep", "body");
      const subheading = component.querySelector(".component-subheading");
      const parts = [block];
      if (subheading && text4(subheading)) {
        const h3 = doc.createElement("h3");
        h3.textContent = text4(subheading);
        h3.setAttribute("data-keep", "body");
        parts.unshift(h3);
      }
      (component.closest(".table.parbase, .patenttables") || component).replaceWith(...parts);
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
      const sources = [.../* @__PURE__ */ new Set([desktop, phone])].filter(Boolean);
      if (stdReviewPage(doc)) {
        box.replaceWith(...sources.map((src, i) => {
          const one = doc.createElement("div");
          one.setAttribute("data-keep", "nodes");
          const device = ["desktop-only", "mobile-only"][i];
          one.setAttribute("data-section-style", sources.length > 1 ? `full-width-image, ${device}` : "full-width-image");
          const p = doc.createElement("p");
          const image2 = doc.createElement("img");
          image2.setAttribute("src", src);
          image2.setAttribute("alt", alt);
          p.append(image2);
          one.append(p);
          return one;
        }));
        return;
      }
      const holder = doc.createElement("div");
      holder.setAttribute("data-keep", "nodes");
      holder.setAttribute("data-section-style", box.classList.contains("bg-shadow") ? "full-width-image, shadow" : "full-width-image");
      sources.forEach((src) => {
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
    let size = spans.map((span) => (/\bfontsize-([\d-]+)em\b/.exec(span.className) || [])[1]).find((n) => TITLE_SIZES.includes(n));
    if (size && stdReviewPage(doc)) {
      const factor = spans.map((span) => /\bfontsize-(\d+)(?:-(\d+))?em\b/.exec(span.className) || []).filter((m) => m[1]).reduce((f, m) => f * Number(`${m[1]}.${m[2] || 0}`), 1);
      const off = (n) => Math.abs(Math.log(Number(n.replace("-", ".")) / factor));
      size = TITLE_SIZES.reduce((x, y) => off(y) < off(x) ? y : x);
    }
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
  var assetName = (src) => ((src || "").match(/\/is\/(?:image|content)\/([^?#]+)/) || [])[1] || "";
  function iconSources(main) {
    const names = /* @__PURE__ */ new Set();
    main.querySelectorAll('.standaloneimage[class*="aem-GridColumn--default--"]').forEach((col) => {
      const grid = col.parentElement && col.parentElement.className.match(/\baem-Grid--default--(\d+)\b/);
      const width = col.className.match(/\baem-GridColumn--default--(\d+)\b/);
      const beside = col.nextElementSibling && col.nextElementSibling.matches(".text") && text4(col.nextElementSibling);
      if (!grid || !width || !beside || Number(width[1]) * 4 > Number(grid[1])) return;
      col.querySelectorAll("img").forEach((img) => names.add(assetName(img.getAttribute("src"))));
    });
    names.delete("");
    return names;
  }
  function iconBlocks(root, icons, doc) {
    root.querySelectorAll("table").forEach((table) => {
      const trs = [...table.querySelectorAll(":scope > tbody > tr, :scope > tr")];
      const head = trs[0] && trs[0].firstElementChild;
      const m = head && head.textContent.trim().match(/^(Cards Corp|Columns)(?: \((.*)\))?$/);
      if (!m) return;
      const names = [...table.querySelectorAll("img")].map((img) => assetName(img.getAttribute("src"))).concat([...table.querySelectorAll("a[href]")].map((a) => assetName(a.getAttribute("href"))).filter((n) => n && !/\.(?:m3u8|mp4)$/.test(n)));
      if (!names.length || !names.every((n) => icons.has(n))) return;
      const media = (n) => {
        var _a;
        return n.nodeType === 1 && (n.matches("img, picture") || !!n.querySelector("img, picture") || n.matches("a[href], p") && icons.has(assetName((_a = n.matches("a") ? n : n.querySelector("a[href]")) == null ? void 0 : _a.getAttribute("href"))));
      };
      const units = [];
      trs.slice(1).forEach((tr) => {
        const cells2 = [...tr.children];
        if (m[1] === "Cards Corp" && cells2.length === 2) {
          units.push({ row: units.length, nodes: [...cells2[0].childNodes, ...cells2[1].childNodes] });
          return;
        }
        const row = units.length ? units[units.length - 1].row + 1 : 0;
        cells2.forEach((cell) => {
          const nodes = [...cell.childNodes];
          const at = nodes.findIndex(media);
          if (at < 0) return;
          units.push({ row, nodes: [nodes[at], ...nodes.filter((n, k) => k !== at)] });
        });
      });
      if (!units.length) return;
      const perRow = m[1] === "Cards Corp" ? { "two-up": 2, "three-up": 3 }[(m[2] || "").split(", ").find((v) => /-up$/.test(v))] || 3 : 0;
      const grouped = [];
      units.forEach((unit, i) => {
        const at = perRow ? Math.floor(i / perRow) : unit.row;
        (grouped[at] = grouped[at] || []).push(unit.nodes);
      });
      const rows = grouped.filter(Boolean);
      const cells = rows.every((r) => r.length === 1) ? rows.map(([nodes]) => [[nodes[0]], nodes.slice(1)]) : rows.map((r) => r.map((nodes) => {
        const [icon, ...rest] = nodes;
        const paragraph = (inline2) => {
          const p = doc.createElement("p");
          p.append(...inline2);
          return p;
        };
        const block = (n) => n.nodeType === 1 && /^(P|H[1-6]|UL|OL|DIV|TABLE)$/.test(n.tagName);
        const filled = (list) => list.some((n) => n.nodeType === 1 || n.textContent.trim());
        const out = [block(icon) ? icon : paragraph([icon])];
        let run = [];
        rest.forEach((n) => {
          if (block(n)) {
            if (filled(run)) out.push(paragraph(run));
            run = [];
            out.push(n);
          } else run.push(n);
        });
        if (filled(run)) out.push(paragraph(run));
        return out;
      }));
      table.replaceWith(WebImporter.Blocks.createBlock(doc, { name: "Columns (icon-text)", cells }));
    });
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
  function transform2(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    if (STD_DRAFT_IMPORT) {
      element.querySelectorAll(".overlayparsys").forEach((overlay) => {
        const box = overlay.querySelector('.has-background[class*="bg-"]');
        const bg = box && [...box.classList].find((c) => /^bg-/.test(c));
        if (bg) overlay.setAttribute("data-std-box", bg);
      });
    }
    if (!payload || !payload.template || !TEMPLATES.includes(payload.template.name)) return;
    const doc = element.ownerDocument;
    const main = doc.querySelector('[role="main"]') || element;
    const path = sourcePath(payload);
    const productXf = stdProductPage(doc) && payload.template.name === "long-page-detail-corp-fragments";
    main.querySelectorAll(".hero-space").forEach((el) => el.remove());
    if (stdReviewPage(doc)) {
      const STEPS = ["8", "1-25", "1-5", "1-75", "2", "2-5"];
      main.querySelectorAll('span[style*="font-size"]').forEach((span) => {
        const m = (span.getAttribute("style") || "").match(/font-size:\s*(\d+(?:\.\d+)?)px/i);
        if (!m) return;
        const factor = Number(m[1]) / 14;
        const off = (n) => Math.abs(Math.log((n === "8" ? 0.8 : Number(n.replace("-", "."))) / factor));
        const step = STEPS.reduce((x, y) => off(y) < off(x) ? y : x);
        if (Math.abs(factor - 1) > 0.1) span.classList.add(`fontsize-${step}em`);
      });
    }
    main.querySelectorAll(".fullWidthImageHero").forEach((el) => el.setAttribute("data-keep", "section"));
    dropDamVideos(main);
    fullWidthImages(main, doc);
    spaceUrlColons(main, doc);
    const nav = localNav(main, doc);
    const pageXfs = product_detail_xf_default[path] || (STD_REVIEW_IMPORT ? review_pages_xf_default[path] : void 0);
    if (!(stdProductPage(doc) && productFragments(main, doc, pageXfs))) {
      experienceFragments(main, doc, long_page_detail_corp_xf_default[path] || [], long_page_detail_corp_xf_slots_default[path]);
    }
    sectionTitles(main, doc);
    downloadTitles(main, doc);
    videoCaptions(main, doc);
    if (STD_DRAFT_IMPORT) dataTables(main, doc);
    const hasTitle = productXf || !!(main.querySelector(".h1-title h1") && text4(main.querySelector(".h1-title h1"))) || !!main.querySelector(".fullWidthImageHero h1, .c-autocarousel h1");
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
    const icons = stdProductPage(doc) ? iconSources(main) : null;
    const helpers = {
      cellNodes,
      richText,
      text: text4,
      tagCopy
    };
    convertBeforeRows(main, doc, helpers);
    markRowEnds(main);
    if (STD_DRAFT_IMPORT) xfGridRows(main, doc, productXf ? ".aem-Grid" : void 0);
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
      componentStyle: columnStyle,
      // review build of the shared fragments: Text style sizes, icon rows side by side
      stdText: STD_DRAFT_IMPORT && payload.template.name === "long-page-detail-corp-fragments"
    });
    if (icons && icons.size) iconBlocks(element, icons, doc);
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
    if (hostRe === CORP_HOST_RE) {
      edsPath = edsPath.replace(/^\/content\/stryker(?=\/)/, "");
      edsPath = edsPath.split("/").map((seg) => seg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join("/");
    }
    if (/(^|\/)index$/i.test(edsPath)) edsPath = edsPath.replace(/index$/i, "");
    return `${edsPath || "/"}${suffix}`;
  }
  function transform3(hookName, element, payload) {
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

  // tools/importer/procare-tile.js
  var TILE = ".c-cross-promotional-tile";
  function procareUnit(document) {
    const tile = document.querySelector(TILE);
    if (!tile || !tile.querySelector(".c-procare-tile")) return "";
    const link2 = tile.querySelector(".c-procare-tile-info a.btn[href]");
    const m = link2 && link2.getAttribute("href").match(/\/us\/en\/([^/]+)\/services\/procare/i);
    return m ? m[1].toLowerCase() : "";
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

  // tools/importer/import-long-page-detail-corp.js
  var PAGE_TEMPLATE = {
    name: "long-page-detail-corp",
    description: "www.stryker.com long-page-detail pages (#469): H1 title; Virtual Learning Center video section (underlined H2 title, Video block, H3 description, Cards Corp (resources) downloads) or a shared Experience Fragment as a Fragment block; video detail pages (Video + caption); text articles; medical-education and landing pages (source column rows as Columns, local navigation as Local Nav, full-width image hero / carousel as Hero Corp (image-slide), Marketo Form with the contact-aside Fragment); small print and document code as a `disclaimer` section; `published` with `last-updated: false` (the corp Last Updated line is not shown for now).",
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
    transform2,
    transform3,
    transform4,
    // last: the bracket text tags → Text style markers
    transform
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
      if (STD_REVIEW_IMPORT && review_pages_xf_default[new URL(params.originalURL).pathname]) {
        document.body.setAttribute("data-template", "product-detail");
      }
      if (stdProductPage(document)) markCentredRows(document);
      if (stdProductPage(document)) markBandGaps(document);
      keepHeadlineBlankLines(document);
      blankLineSpacers(document, params.originalURL);
    },
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
      const hcp = !!document.querySelector(".g-hcpbanner");
      const procare = stdProductPage(document) ? procareUnit(document) : "";
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
      const slideReport = STD_DRAFT_IMPORT && stdProductPage(document) ? slideFragments(main, document, new URL(params.originalURL).pathname) : "";
      if (stdProductPage(document)) dropEmptySections(main);
      edsLinkPaths(main);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      meta.template = stdProductPage(document) ? "product-detail" : PAGE_TEMPLATE.name;
      if (hcp) meta["hcp-banner"] = "true";
      if (procare) meta.procare = procare;
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
        report: __spreadValues(__spreadValues({
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }, unresolvedXfs ? { "xf-unresolved": unresolvedXfs } : {}), slideReport ? { "slide-xfs": slideReport } : {})
      }];
    }
  };
  return __toCommonJS(import_long_page_detail_corp_exports);
})();
