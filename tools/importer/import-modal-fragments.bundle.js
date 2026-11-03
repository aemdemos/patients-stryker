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
  var __pow = Math.pow;
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

  // tools/importer/import-modal-fragments.js
  var import_modal_fragments_exports = {};
  __export(import_modal_fragments_exports, {
    default: () => import_modal_fragments_default
  });

  // tools/importer/corp-richtext.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
  var KEEP_ATTRS = {
    A: ["href"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"]
  };
  function text(el) {
    return (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  var squash = (value) => value.replace(/[\s\u00a0]+/g, "");
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
  function contentCopy(source, doc = source.ownerDocument) {
    const box = doc.createElement("div");
    source.childNodes.forEach((node) => box.append(doc.importNode(node, true)));
    return box;
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
  var SIZE_STEPS = [[0.8, "p-0-8"], [1, ""], [1.25, "p-1-25"], [1.5, "p-1-5"], [1.75, "p-1-75"], [2, "p-2"], [2.5, "p-2-5"]];
  var FONT_STYLES = [
    ["urw-egyptienne", "serif"]
  ];
  function sizeFactor(cls) {
    const m = cls.match(/^fontsize-(\d+)(?:-(\d+))?em$/);
    if (!m) return 1;
    if (!m[2] && Number(m[1]) > 4) return Number(m[1]) / 10;
    return Number(`${m[1]}.${m[2] || 0}`);
  }
  function sizeStyle(factor) {
    const [[style]] = SIZE_STEPS.map(([f, s]) => [s, Math.abs(Math.log(factor / f))]).sort((a, b) => a[1] - b[1]);
    return style;
  }
  function effectiveSize(el) {
    const sizes = /* @__PURE__ */ new Set();
    const copySizes = /* @__PURE__ */ new Set();
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (squash(n.textContent)) {
        let factor = 1;
        for (let e = n.parentElement; e && e !== el.parentElement; e = e.parentElement) {
          factor = [...e.classList].reduce((f, c) => f * sizeFactor(c), factor);
        }
        const size = Math.round(factor * 100) / 100;
        sizes.add(size);
        const label = n.parentElement.closest(".futura-bold, b, strong");
        if (!label || !el.contains(label) || label === el) copySizes.add(size);
      }
    }
    const counted = copySizes.size ? copySizes : sizes;
    return counted.size === 1 ? [...counted][0] : null;
  }
  function coveredBy(el, cls) {
    const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
    return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
  }
  function copyStyles(root) {
    const candidates = root.matches && root.matches("p, li") ? [root] : [...root.querySelectorAll("p, li")];
    const copy = candidates.filter((el) => text(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const sizes = new Set(copy.map(effectiveSize));
    const size = sizes.size === 1 && !sizes.has(null) ? sizeStyle([...sizes][0]) : "";
    const font = FONT_STYLES.find(([cls]) => copy.every((el) => coveredBy(el, cls)));
    return [size, font && font[1]].filter(Boolean).join(", ");
  }
  function sameLineText(node, direction) {
    let value = "";
    let sibling = node[direction];
    while (sibling && sibling.nodeName !== "BR") {
      value += sibling.textContent;
      sibling = sibling[direction];
    }
    return squash(value);
  }
  function vwFactor(cls) {
    const m = cls.match(/^fontsize-(\d+)(?:-(\d+))?-?vw$/);
    return m ? Number(`${m[1]}.${m[2] || 0}`) : 0;
  }
  var RUN_TAG = "x-run";
  var RUN_NAME = /^x-run-e(\d+)-(\d+)-v(\d+)-(\d+)-s([012])$/i;
  var round = (n) => Math.round(n * 1e5) / 1e5;
  var num = (n) => String(round(n)).replace(".", "-");
  var runName = ({ em, vw, font }) => {
    const [ei, ed = "0"] = String(round(em)).split(".");
    const [vi, vd = "0"] = String(round(vw)).split(".");
    return `${RUN_TAG}-e${ei}-${ed}-v${vi}-${vd}-s${font}`;
  };
  function inlineSize(e) {
    const m = (e.getAttribute("style") || "").match(/font-size:\s*([\d.]+)(px|rem|em)\b/i);
    const value = m ? Number(m[1]) : 0;
    if (!value) return null;
    const unit = m[2].toLowerCase();
    if (unit === "em") return { em: value, absolute: false };
    return { em: (unit === "px" ? value : value * 10) / 14, absolute: true };
  }
  function runOf(textNode, blockEl, serifDefault) {
    const chain = [];
    for (let e = textNode.parentElement; e && e !== blockEl; e = e.parentElement) chain.push(e);
    const heading = /^H/.test(blockEl.tagName);
    const props = chain.reduce((acc, e) => {
      if (!acc.vw && /^SU[PB]$/.test(e.tagName)) acc.sup = true;
      const inline = heading || acc.vw || acc.absolute ? null : inlineSize(e);
      if (inline) {
        acc.em *= inline.em;
        acc.absolute = inline.absolute;
      }
      if (!inline && !acc.absolute) {
        [...e.classList].forEach((cls) => {
          if (!acc.vw && vwFactor(cls)) acc.vw = vwFactor(cls) * (acc.sup ? 0.75 : 1);
          else if (!acc.vw) acc.em *= sizeFactor(cls);
        });
      }
      if (!acc.font && e.classList.contains("urw-egyptienne")) acc.font = "serif";
      if (!acc.font && e.classList.contains("futura-bold")) acc.font = "futura";
      return acc;
    }, { em: 1, vw: 0, font: "" });
    const font = props.font || (serifDefault ? "serif" : "");
    const b = props.font !== "futura" && chain.find((e) => e.tagName === "B");
    let code = 0;
    const serifInBold = props.font === "serif" && chain.some((e) => e.classList.contains("futura-bold"));
    if (heading) code = b && /^H[1-3]$/.test(blockEl.tagName) || serifInBold ? 1 : 0;
    else if (font === "serif") code = 1;
    else if (b && squash(b.textContent) !== squash(blockEl.textContent) && (sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling"))) code = 2;
    return { em: props.em, vw: props.vw, font: code };
  }
  function markRuns(root, { serifDefault = false } = {}) {
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(root, 4);
    const runs = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const blockEl = n.parentElement && n.parentElement.closest("p, li, h1, h2, h3, h4, h5, h6, div");
      if (squash(n.textContent) && blockEl && root.contains(blockEl)) {
        const props = runOf(n, blockEl, serifDefault);
        runs.push([n, props]);
      }
    }
    runs.forEach(([n, props]) => {
      const [, lead, core, tail] = n.textContent.match(/^([\s\u00a0]*)([\s\S]*?)([\s\u00a0]*)$/);
      const run = doc.createElement(runName(props));
      run.textContent = core;
      const parts = [lead && doc.createTextNode(lead), run, tail && doc.createTextNode(tail)];
      n.replaceWith(...parts.filter(Boolean));
    });
  }
  var COPY_FACTORS = {
    "p-0-8": 0.8,
    "p-1": 1,
    "p-1-25": 1.25,
    "p-1-5": 1.5,
    "p-1-75": 1.75,
    "p-2": 2,
    "p-2-5": 2.5
  };
  var HEADING_FACTORS = { "h-0-8": 0.8, "h-1-25": 1.25, "h-1-5": 1.5 };
  var LABEL_FACTORS = { "label-1-5": 1.5, "label-1-75": 1.75, "label-2": 2 };
  var isLabel = (p) => {
    const kids = [...p.children];
    if (kids.length !== 1) return false;
    const [kid] = kids;
    return kid.tagName === "STRONG" || kid.tagName === "EM" && kid.children.length === 1 && kid.firstElementChild.tagName === "STRONG";
  };
  function finishRuns(nodes, styles) {
    const copy = styles.map((s) => COPY_FACTORS[s]).find(Boolean) || 1;
    const heading = styles.map((s) => HEADING_FACTORS[s]).find(Boolean) || 1;
    const label = styles.map((s) => LABEL_FACTORS[s]).find(Boolean);
    const serifSection = styles.includes("serif");
    nodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      const runs = [node, ...node.querySelectorAll("*")].filter((el) => el.tagName.toLowerCase().startsWith(`${RUN_TAG}-`));
      runs.forEach((run) => {
        const m = run.tagName.match(RUN_NAME);
        const doc = run.ownerDocument;
        const tags = [];
        if (m) {
          const em = Number(`${m[1]}.${m[2]}`);
          const vw = Number(`${m[3]}.${m[4]}`);
          const table2 = run.closest("table");
          const div = run.closest('div[class*="hero-corp"]');
          let name = table2 ? text(table2.querySelector("tr")) : "";
          if (!name && div) name = div.className.replace("hero-corp", "hero corp");
          const heroBlock = /^hero corp/i.test(name);
          const inHero = heroBlock && /size[- ]\d/i.test(name);
          const isHeading = !!run.closest("h1, h2, h3, h4, h5, h6");
          const line = run.closest("p");
          let base = isHeading ? heading : copy;
          if (isHeading && heroBlock && /image[- ]right/i.test(name)) base = 1;
          if (!isHeading && label && line && isLabel(line)) base = label;
          if (vw) tags.push(`size-${num(vw)}vw`);
          else if (!inHero && Math.abs(em / base - 1) > 0.03) tags.push(`size-${num(isHeading ? em / base : em)}em`);
          if (!inHero && m[5] === "1" && (!serifSection || run.closest("strong"))) tags.push("serif");
          if (m[5] === "2" && !styles.includes("bold-body")) tags.push("body-font");
          if (m[5] === "0" && serifSection && !inHero && !isHeading && !run.closest("strong, b")) {
            tags.push("body-font");
          }
        }
        if (tags.length) {
          run.before(doc.createTextNode(`[[${tags.join(",")}]`));
          run.after(doc.createTextNode("]"));
        }
        unwrap(run);
      });
    });
  }
  var COLOURS = {
    ffb500: "color-gold",
    "1c5687": "color-blue",
    "85458a": "color-purple",
    "4c7d7a": "color-teal",
    "27455c": "color-navy",
    545857: "color-grey",
    ffffff: "color-white",
    // corp-only (styles-corp.css): the light grey surface (613 uses, e.g. orthopaedic "In my
    // practice…", "CONTACT US" links), silver (107) and dark gold (58)
    edeeec: "color-light-gray",
    b2b4ae: "color-silver",
    af6d04: "color-dark-gold"
  };
  var NEUTRAL = /* @__PURE__ */ new Set(["color-white", "color-light-gray", "color-silver", "color-grey", ""]);
  function toHex(value) {
    const v = (value || "").trim().toLowerCase();
    if (v === "white") return "ffffff";
    if (v === "black") return "000000";
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) return m[1].split("").map((c) => c + c).join("");
    m = v.match(/^#([0-9a-f]{6})$/);
    if (m) return m[1];
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    return "";
  }
  function lab(hex) {
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v > 0.04045 ? __pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
    });
    const t = (v) => v > 8856e-6 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
    const x = t((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
    const y = t(r * 0.2126 + g * 0.7152 + b * 0.0722);
    const z = t((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function colourClass(hex) {
    if (!hex) return "";
    if (COLOURS[hex] !== void 0) return COLOURS[hex];
    const target = lab(hex);
    const neutral = Math.abs(target[1]) < 3 && Math.abs(target[2]) < 6;
    const [[best]] = [...Object.entries(COLOURS), ["000000", ""]].filter(([, cls]) => !neutral || NEUTRAL.has(cls)).map(([h, cls]) => [cls, Math.hypot(...lab(h).map((v, i) => v - target[i]))]).sort((a, b) => a[1] - b[1]);
    return best;
  }
  function inlineColour(el) {
    if (el.tagName === "FONT" && el.getAttribute("color")) return toHex(el.getAttribute("color"));
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? toHex(m[1]) : "";
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
    const coloured = [...root.querySelectorAll('[style*="color"], font[color]')].filter((el) => inlineColour(el));
    const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
    const freeText = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1 || own.get(node)) return "";
      return [...node.childNodes].map(freeText).join("");
    };
    const linkOnly = (el) => !!el.closest("a[href]") || [...el.querySelectorAll("a[href]")].some((a) => squash(a.textContent) === squash(el.textContent));
    coloured.forEach((el) => {
      const cls = colourClass(own.get(el)) || (own.get(el) === "000000" && linkOnly(el) ? "color-black" : "");
      if (!cls) return;
      if (cls === "color-teal" && linkOnly(el)) return;
      const around = !el.closest("a[href]") && linkOnly(el);
      if (around && cls !== "color-black") return;
      const hasOwn = (node) => node.nodeType === 1 && [...node.querySelectorAll("*")].some((d) => own.get(d));
      const wrapFree = (parent) => {
        let run = [];
        const flush = () => {
          if (run.some((n) => squash(freeText(n)))) wrapInTag(run[0], run[run.length - 1], cls);
          run = [];
        };
        [...parent.childNodes].forEach((child) => {
          if (child.nodeType === 1 && own.get(child)) flush();
          else if (hasOwn(child)) {
            flush();
            wrapFree(child);
          } else run.push(child);
        });
        flush();
      };
      wrapFree(el);
    });
  }
  function tagPlainBoldLabels(root, wholeParagraphs) {
    const doc = root.ownerDocument;
    [...root.querySelectorAll("b")].forEach((b) => {
      if (b.closest(".futura-bold") || b.querySelector(".futura-bold") || b.parentElement.closest("b")) return;
      if (!text(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block2 = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block2 || block2.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text(block2) === text(b)) return;
      b.before(doc.createTextNode("[[body-font]"));
      b.after(doc.createTextNode("]"));
    });
  }
  function cleanRichText(root, { wholeParagraphs = false, divParagraphs = true } = {}) {
    const control = (ch) => {
      const code = ch.charCodeAt(0);
      return code < 32 && ![9, 10, 13].includes(code) || code === 127;
    };
    const ctrlWalker = root.ownerDocument.createTreeWalker(root, 4);
    for (let n = ctrlWalker.nextNode(); n; n = ctrlWalker.nextNode()) {
      if ([...n.textContent].some(control)) n.textContent = [...n.textContent].filter((ch) => !control(ch)).join("");
    }
    if (divParagraphs) {
      [...root.querySelectorAll("div")].reverse().forEach((div) => {
        if (text(div) && !div.querySelector("p, div, ul, ol, h1, h2, h3, h4, h5, h6, table")) rename(div, "p");
      });
    }
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (!h.classList.contains("border-bottom-gold") || h.querySelector("u") || !text(h)) return;
      const u = root.ownerDocument.createElement("u");
      while (h.firstChild) u.append(h.firstChild);
      h.append(u);
    });
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text(el));
    const centred = blocks.length > 0 && blocks.every((el) => /text-align:\s*center/i.test(el.getAttribute("style") || ""));
    const size = copyStyles(root);
    const doc = root.ownerDocument;
    const emptyElement = (node) => node.nodeType === 1 && node.nodeName !== "BR" && !node.textContent.trim() && !node.querySelector("img, br");
    [...root.querySelectorAll("span, b, i, em, strong")].reverse().forEach((el) => {
      let last = el.lastChild;
      while (last && (last.nodeName === "BR" || emptyElement(last) || last.nodeType === 3 && !last.textContent.trim())) {
        if (emptyElement(last)) {
          const next = el.nextSibling;
          if (/[\s\u00a0]/.test(last.textContent) && !(next && /^[\s\u00a0]/.test(next.textContent))) {
            el.after(doc.createTextNode(" "));
          }
          last.remove();
        } else el.after(last);
        last = el.lastChild;
      }
      if (last && last.nodeType === 3 && /[\s\u00a0]$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/[\s\u00a0]+$/, "");
        el.after(doc.createTextNode(" "));
      }
    });
    tagPlainBoldLabels(root, wholeParagraphs);
    const standalone = /* @__PURE__ */ new Set();
    root.querySelectorAll(".standalone-link").forEach((span) => {
      const a = span.closest("a") || span.querySelector("a");
      if (a) standalone.add(a);
    });
    const triangle = /[\s\u00a0]*[\u25ba\u25b6][\s\u00a0]*$/;
    root.querySelectorAll("a[href]").forEach((a) => {
      if (!triangle.test(a.textContent)) return;
      if (!(a.closest(".futura-bold") || a.querySelector(".futura-bold"))) return;
      const walker = doc.createTreeWalker(a, 4);
      let lastText = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) lastText = n;
      }
      if (lastText) lastText.textContent = lastText.textContent.replace(triangle, "");
      let span = a.parentElement;
      while (span && span.tagName === "SPAN" && squash(span.textContent) === squash(a.textContent)) {
        unwrap(span);
        span = a.parentElement;
      }
      a.querySelectorAll("span").forEach(unwrap);
      standalone.add(a);
    });
    standalone.forEach((a) => {
      const u = doc.createElement("u");
      while (a.firstChild) u.append(a.firstChild);
      a.append(u);
      const strong = doc.createElement("strong");
      a.replaceWith(strong);
      strong.append(a);
    });
    const futuraText = (el) => {
      const walker = doc.createTreeWalker(el, 4);
      let all = true;
      let any = false;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) {
          any = true;
          if (!n.parentElement.closest(".futura-bold")) all = false;
        }
      }
      return any && all;
    };
    const boldLinks = [...root.querySelectorAll("a[href]")].filter((a) => {
      const line = a.closest("p, li");
      if (standalone.has(a) || !line || a.querySelector("img")) return false;
      if (squash(line.textContent) !== squash(a.textContent) || !futuraText(a)) return false;
      a.querySelectorAll("span.futura-bold").forEach(unwrap);
      [...line.querySelectorAll("span.futura-bold")].filter((span) => span.contains(a)).forEach(unwrap);
      return true;
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => {
      const walker = doc.createTreeWalker(el, 4);
      let serif = false;
      let futura = false;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (squash(n.textContent)) {
          const font = n.parentElement.closest(".urw-egyptienne, .futura-bold");
          if (font && font !== el && el.contains(font) && font.classList.contains("urw-egyptienne")) serif = true;
          else futura = true;
        }
      }
      if (serif && !futura) el.dataset.serifInside = "1";
    });
    mapColours(root);
    boldLinks.forEach((a) => {
      a.prepend(doc.createTextNode("[[futura-bold]"));
      a.append(doc.createTextNode("]"));
    });
    root.querySelectorAll("span.futura-bold").forEach((el) => {
      if (!el.closest("p, li") || el.closest("h1, h2, h3, h4, h5, h6") || el.dataset.serifInside) {
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
    return new Set([...root.querySelectorAll("p")].filter((p) => {
      const all = squash(p.textContent);
      if (!all || p.querySelector(".futura-bold")) return false;
      const bold = [...p.querySelectorAll("b")].filter((b) => !b.parentElement.closest("b"));
      return squash(bold.map((b) => b.textContent).join("")) === all;
    }));
  }
  function headingSizeStyle(heading) {
    if (!/^H[23]$/.test(heading.tagName)) return "";
    const size = effectiveSize(heading);
    return { 0.8: "h-0-8", 1.25: "h-1-25", 1.5: "h-1-5" }[size] || "";
  }
  var plainText = (el) => {
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    let out = "";
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.parentElement.closest(".futura-bold, b, strong")) out += n.textContent;
    }
    return squash(out);
  };
  function serifHeadings(root) {
    return new Set([...root.querySelectorAll("h2, h3, h4, h5, h6")].filter((h) => {
      if (!text(h)) return false;
      if (/^H[23]$/.test(h.tagName)) return !!plainText(h);
      if (h.querySelector(".futura-bold, b, strong")) return false;
      return coveredBy(h, "urw-egyptienne");
    }));
  }

  // tools/importer/corp-section-builder.js
  var NOT_CONTENT = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "LINK", "NOSCRIPT", "INPUT", "TEMPLATE", "META", "BUTTON"]);
  function gridSpec(el) {
    const cls = String(el.className);
    const get = (re) => {
      var _a;
      return (_a = (cls.match(re) || [])[1]) != null ? _a : null;
    };
    const at = (bp) => {
      const w = get(new RegExp(`\\baem-GridColumn--${bp}--(\\d+)\\b`));
      const o = get(new RegExp(`\\baem-GridColumn--offset--${bp}--(\\d+)\\b`));
      return {
        w: w === null ? null : Number(w),
        o: o === null ? null : Number(o),
        beh: get(new RegExp(`\\baem-GridColumn--${bp}--(newline|hide|none)\\b`))
      };
    };
    const spec = { d: at("default"), t: at("tablet"), m: at("phone") };
    return spec.d.w ? spec : null;
  }
  var gridTotal = (el) => Number((String(el.className).match(/\baem-Grid--(\d+)\b/) || [])[1]) || 12;
  var isHidden = (el) => el.getAttribute("data-corp-hidden") === "true";
  function createBuilder({
    doc,
    handlers,
    source,
    facts = null
  }) {
    const report = { unhandled: [], notes: [], hidden: 0 };
    const ctx = {
      doc,
      source,
      facts,
      report,
      handlers
    };
    const { components } = handlers;
    const componentName = (el) => {
      if (el.id && components[`#${el.id}`]) return `#${el.id}`;
      const name = [...el.classList].find((c) => components[c]);
      if (name) return name;
      return [...el.classList].some((c) => /^cols\d/.test(c)) ? "cols*" : null;
    };
    const isComponent = (el) => [...el.classList].some((c) => c === "parbase" || /^c-/.test(c));
    const keepHidden = (el) => el.matches(".section-title") || !!el.querySelector(":scope > .c-section-title[id]");
    ctx.unknown = (el, why = "no handler") => {
      const label = `${String(el.className).trim().split(/\s+/)[0] || el.tagName.toLowerCase()}: ${text(el).slice(0, 50)}`;
      report.unhandled.push(`${label} (${why})`);
      return handlers.fallback ? handlers.fallback(el, ctx) : [];
    };
    const collectOne = (el) => {
      if (NOT_CONTENT.has(el.tagName)) return [];
      if (isHidden(el) && !keepHidden(el)) {
        report.hidden += 1;
        return [];
      }
      const name = componentName(el);
      if (name) return components[name === "cols*" ? "cols" : name](el, ctx) || [];
      if (isComponent(el)) return ctx.unknown(el);
      if (/^(P|H[1-6]|UL|OL|TABLE|IMG|A)$/.test(el.tagName) && text(el)) return ctx.unknown(el, "loose content");
      return ctx.collect(el);
    };
    const boxOf2 = (el) => el.classList.contains("page-section") ? el : el.querySelector(":scope > .page-section") || el.closest(".page-section") || null;
    const boxed = (items, el) => {
      const box = boxOf2(el);
      items.forEach((it) => {
        if (it && typeof it === "object" && !("box" in it)) it.box = box;
      });
      return items;
    };
    ctx.collect = function collect(container) {
      const out = [];
      const total = gridTotal(container);
      let run = [];
      let used = 0;
      const flush = () => {
        if (run.length > 1 && handlers.row) {
          out.push(...boxed(handlers.row(
            run.map((r) => boxed(collectOne(r.el), r.el)),
            run.map((r) => r.spec.d.w),
            ctx,
            { specs: run.map((r) => r.spec), total }
          ), run[0].el));
        } else {
          run.forEach((r) => out.push(...boxed(collectOne(r.el), r.el)));
        }
        run = [];
        used = 0;
      };
      [...container.children].forEach((child) => {
        const spec = gridSpec(child);
        if (spec && spec.d.w < total) {
          if (isHidden(child) && !keepHidden(child)) {
            report.hidden += 1;
            return;
          }
          const room = (spec.d.o || 0) + spec.d.w;
          if (run.length && (used + room > total || spec.d.beh === "newline")) flush();
          run.push({ el: child, spec });
          used += room;
          if (used >= total) flush();
          return;
        }
        flush();
        out.push(...boxed(collectOne(child), child));
      });
      flush();
      return out;
    };
    ctx.collectOne = collectOne;
    const sections = [];
    let current = null;
    let pendingIds = [];
    let pendingStyles = [];
    const context = [];
    const start = (kind, styles = []) => {
      const all = [...context, ...pendingStyles, ...styles].filter(Boolean);
      current = {
        kind,
        styles: [...new Set(all)],
        id: pendingIds[0] || null,
        nodes: []
      };
      if (pendingIds.length > 1) report.notes.push(`anchors without content of their own, dropped: #${pendingIds.slice(1).join(", #")}`);
      pendingIds = [];
      pendingStyles = [];
      sections.push(current);
      return current;
    };
    const close = () => {
      current = null;
    };
    ctx.close = close;
    const nodeStyles = (node, item) => [
      item.centred ? "center" : "",
      ...String(node.copyStyle || "").split(",").map((s) => s.trim()),
      node.boldBody ? "bold-body" : "",
      ...item.styles || [],
      ...item.spacing || []
    ].filter(Boolean);
    let spacedBoxes = 0;
    function placeFlow(item) {
      if ((item.role === "image" || item.role === "cta") && current && current.key && !current.spaced && !item.own) {
        current.nodes.push(...item.nodes);
        return;
      }
      if (((item.spacing || []).length || item.own) && !item.spacedBox) {
        spacedBoxes += 1;
        item.spacedBox = spacedBoxes;
      }
      item.nodes.forEach((node) => {
        const styles = nodeStyles(node, item);
        const key = `flow:${styles.join(",")}${item.spacedBox ? `#${item.spacedBox}` : ""}`;
        let font = null;
        let size = null;
        if (/^H[23]$/.test(node.tagName)) {
          font = node.serifHeading ? "serif" : "futura";
          size = node.headingSize || "plain";
        }
        if (!current || current.key !== key || font && current.font && current.font !== font || size && current.headingSize && current.headingSize !== size) {
          const sameBox = !!current && "box" in item && current.box === item.box;
          const continues = !!current && (current.item === item || sameBox);
          start("flow", continues ? [...styles, "continued"] : styles).key = key;
          current.spaced = !!item.spacedBox;
          current.item = item;
          current.box = item.box;
        }
        if (font) {
          if (font === "serif" && current.font !== "serif") current.styles.push("h-serif");
          current.font = font;
        }
        if (size) {
          if (size !== "plain" && current.headingSize !== size) current.styles.push(size);
          current.headingSize = size;
        }
        current.nodes.push(node);
      });
    }
    function place(items) {
      items.forEach((item) => {
        switch (item.type) {
          case "anchor":
            if (!pendingIds.includes(item.id)) pendingIds.push(item.id);
            close();
            break;
          case "separator":
            pendingStyles.push("divider");
            close();
            break;
          case "boundary":
            close();
            break;
          case "flow":
            placeFlow(item);
            break;
          case "block":
            if (!current || !current.key) start("flow").key = "flow:";
            current.nodes.push(item.block);
            break;
          case "group":
            close();
            context.push(...item.styles);
            place(item.items);
            item.styles.forEach(() => context.pop());
            close();
            break;
          case "own":
          case "fragment":
          case "form":
            start(item.kind || item.type, item.styles).nodes.push(...item.nodes);
            close();
            break;
          default:
            report.notes.push(`item of unknown type ${item.type} dropped`);
        }
      });
    }
    ctx.place = place;
    ctx.addSection = (kind, styles, nodes) => {
      close();
      start(kind, styles).nodes.push(...nodes);
      close();
    };
    ctx.render = () => {
      if (pendingIds.length) report.notes.push(`anchors at the end without a section: #${pendingIds.join(", #")}`);
      if (pendingStyles.length) report.notes.push(`trailing ${pendingStyles.join(", ")} without a section after it, dropped`);
      const out = [];
      sections.filter((s) => s.nodes.length || s.kind === "stripe").forEach((section, i) => {
        if (i > 0) out.push(doc.createElement("hr"));
        finishRuns(section.nodes, section.styles);
        out.push(...section.nodes);
        const cells = {};
        if (section.styles.length) cells.style = section.styles.join(", ");
        if (section.id) cells.id = section.id;
        if (Object.keys(cells).length) {
          out.push(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells }));
        }
      });
      return out;
    };
    ctx.sections = sections;
    return ctx;
  }

  // tools/importer/corp-components.js
  function standaloneImageNodes(component, doc) {
    const nodes = [];
    [...component.querySelectorAll("img")].forEach((source) => {
      const img = doc.createElement("img");
      img.setAttribute("src", source.getAttribute("src"));
      img.setAttribute("alt", source.getAttribute("alt") || "");
      const p = doc.createElement("p");
      const link2 = source.closest("a[href]");
      if (link2) {
        const a = doc.createElement("a");
        a.setAttribute("href", link2.getAttribute("href"));
        a.append(img);
        p.append(a);
      } else {
        p.append(img);
      }
      nodes.push(p);
    });
    const title = component.querySelector(".title-content .title");
    if (title && text(title)) {
      const h4 = doc.createElement("h4");
      h4.textContent = text(title);
      nodes.push(h4);
    }
    const description = component.querySelector(".c-standalone-image-content > p");
    if (description && text(description)) {
      const p = doc.createElement("p");
      description.textContent.trim().split(/\n/).forEach((line, i) => {
        if (i) p.append(doc.createElement("br"));
        p.append(doc.createTextNode(line.trim()));
      });
      nodes.push(p);
    }
    return nodes;
  }
  var squash2 = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  var isEmptyXf = (wrapper) => !squash2(wrapper.textContent) && !wrapper.querySelector("img, picture, video, iframe, [data-widget], .s7dm-dynamic-media");
  function corpLinkHref(href) {
    const value = String(href || "").trim();
    if (!value || /^(mailto|tel):|^#/i.test(value)) return value;
    const m = value.match(/^(?:https?:\/\/www\.stryker\.com)?(\/[^?#]*)([?#].*)?$/i);
    if (!m) return value;
    const path = m[1].replace(/^\/content\/stryker(?=\/)/, "");
    const rest = m[2] || "";
    if (/^\/us\/en(\/|$)/.test(path) && !path.startsWith("/content/")) {
      const eds = path.replace(/\.html?$/, "").replace(/\/index$/, "/");
      return `${eds || "/"}${rest}`;
    }
    return `https://www.stryker.com${path}${rest}`;
  }

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
  function parse(element, {
    document,
    overlayNodes,
    variants: extra = [],
    vwSize: vwSize2 = true
  }) {
    const slide = element.querySelector(".carouselslide:not(.slick-cloned)") || element;
    const desktop = slide.querySelector(".experienceFragment-ef img");
    const mobile = slide.querySelector(".experienceFragment-ef-mobile img");
    const overlay = slide.querySelector(".overlayparsys");
    const first = desktop || mobile || slide.querySelector("img");
    if (!first && !slide.dataset.xfDesktop) return;
    const variants = ["image-slide"];
    const fragmentLink = (path) => {
      const a = document.createElement("a");
      a.href = path;
      a.textContent = path;
      return a;
    };
    const cells = [];
    if (slide.dataset.xfDesktop) {
      cells.push([fragmentLink(slide.dataset.xfDesktop)]);
      if (slide.dataset.xfMobile) cells.push([fragmentLink(slide.dataset.xfMobile)]);
      else if (mobile) cells.push([copyImage(mobile, document)]);
    } else {
      cells.push([copyImage(first, document)]);
      if (desktop && mobile) cells.push([copyImage(mobile, document)]);
    }
    if (overlay) {
      const lines = overlayNodes || headline(overlay, document);
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
      if (size && vwSize2) variants.push(size[2] ? `size-${size[1]}-5` : `size-${size[1]}`);
      if (overlay.classList.contains("mobile_Bottom")) variants.push("text-below");
    }
    variants.push(...extra);
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
      if (title.classList.contains("futura-bold") || title.querySelector(".futura-bold")) {
        const strong = document.createElement("strong");
        strong.append(...h3.childNodes);
        h3.append(strong);
      }
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
      const poster = dm.getAttribute("data-posterimage") || assetPath;
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

  // tools/importer/corp-modal-path.js
  var documentName = (name) => String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function procareModalPath(title) {
    const name = documentName(String(title || "").trim().replace(/^ProCare\s+(for\s+)?/i, ""));
    return name ? `/us/en/fragments/modals/procare/${name}` : null;
  }

  // tools/importer/data/dm-sets.js
  var SETS = {
    "stryker/Adherus_AutosprayDuralSealantAdherusAutosprayETDuralSealant": { "type": "media_set", "members": [{ "name": "stryker/Adherus Autospray Dural Sealant 2", "type": "image", "width": 600, "height": 220 }, { "name": "stryker/Adherus Autospray ET Dural Sealant 2", "type": "image", "width": 600, "height": 220 }] },
    "stryker/CMF_Allograft_BioImplants": { "type": "media_set", "members": [{ "name": "stryker/1528485467_LifeNet-Products-Pics-061", "type": "image", "width": 2816, "height": 2112 }, { "name": "stryker/1528485783_Unison_20120713_001a", "type": "image", "width": 3004, "height": 2407 }, { "name": "stryker/1528486030_Unison_20120713_010a-CUBE", "type": "image", "width": 3005, "height": 2407 }, { "name": "stryker/1528486072_Unison_20130403_056", "type": "image", "width": 3e3, "height": 2400 }] },
    "stryker/Cart_with_Hydro": { "type": "spin", "members": [{ "name": "stryker/RISE with Hydro - Orbit Frame.649.1-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.14-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.20-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.26-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.32-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.38-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.44-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.50-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.56-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.62-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.68-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.74-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.79-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.100-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.106-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.112-1920x1151", "type": "image", "width": 1920, "height": 1151 }, { "name": "stryker/RISE with Hydro - Orbit Frame.649.118-1920x1151", "type": "image", "width": 1920, "height": 1151 }] },
    "stryker/Hargrove-Loper": { "type": "media_set", "members": [{ "name": "stryker/20210607-SYK_CGS_Klisa-109", "type": "image", "width": 6537, "height": 4358 }, { "name": "stryker/20210607-SYK_CGS_Klisa-182", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-202", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-233", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-55", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-229", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-197", "type": "image", "width": 6082, "height": 4055 }, { "name": "stryker/20210607-SYK_CGS_Klisa-31", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-187", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-217-2", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-75", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-195", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-135", "type": "image", "width": 5938, "height": 3959 }, { "name": "stryker/20210607-SYK_CGS_Klisa-127", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-24", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20210607-SYK_CGS_Klisa-212", "type": "image", "width": 6720, "height": 4480 }] },
    "stryker/James_Bamber_MixedMedia": { "type": "media_set", "members": [{ "name": "stryker/20201021-CGS_Baton_Rouge-128", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-67", "type": "image", "width": 4480, "height": 6720 }, { "name": "stryker/20201021-CGS_Baton_Rouge-135", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-76", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-174", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-185", "type": "image", "width": 6618, "height": 4412 }, { "name": "stryker/20201021-CGS_Baton_Rouge-191", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-199", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-219", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-224", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-230", "type": "image", "width": 6671, "height": 4447 }, { "name": "stryker/20201021-CGS_Baton_Rouge-272", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-297", "type": "image", "width": 6540, "height": 4360 }, { "name": "stryker/20201021-CGS_Baton_Rouge-354", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-381", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-4", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-450", "type": "image", "width": 6493, "height": 4329 }, { "name": "stryker/20201021-CGS_Baton_Rouge-462", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-467", "type": "image", "width": 6448, "height": 4299 }, { "name": "stryker/20201021-CGS_Baton_Rouge-469", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-474", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-482", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-486", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20201021-CGS_Baton_Rouge-496-2", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-520-2", "type": "image", "width": 2e3, "height": 1333 }, { "name": "stryker/20201021-CGS_Baton_Rouge-58", "type": "image", "width": 6720, "height": 4480 }] },
    "stryker/Meet_the_SurgicalICUteamatTempleUniversityHospital": { "type": "media_set", "members": [{ "name": "stryker/CarouselandFeaturePic", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-1", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-5", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-19", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-36", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-52", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-61", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-87", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-88", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-116", "type": "image", "width": 4480, "height": 6720 }, { "name": "stryker/20220502-SYK_CGSPhilly-117", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-125", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-126", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-136", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-148", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-162", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-186", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-215", "type": "image", "width": 6546, "height": 4364 }, { "name": "stryker/20220502-SYK_CGSPhilly-223", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-235", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-243", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-262", "type": "image", "width": 6720, "height": 4480 }, { "name": "stryker/20220502-SYK_CGSPhilly-269", "type": "image", "width": 6720, "height": 4480 }] },
    "stryker/Spine_MedEd_US_MixMedia": { "type": "media_set", "members": [{ "name": "stryker/NeuroTech", "type": "image", "width": 4800, "height": 3200 }, { "name": "stryker/IMG_4224", "type": "image", "width": 640, "height": 480 }, { "name": "stryker/HCP-2", "type": "image", "width": 303, "height": 406 }, { "name": "stryker/Adult-Deformity", "type": "image", "width": 364, "height": 259 }, { "name": "stryker/Dr-Bergsneider-UCLA", "type": "image", "width": 889, "height": 597 }, { "name": "stryker/HCP-3", "type": "image", "width": 463, "height": 305 }, { "name": "stryker/IMG_1232", "type": "image", "width": 640, "height": 480 }, { "name": "stryker/HCP", "type": "image", "width": 313, "height": 413 }, { "name": "stryker/House2", "type": "image", "width": 893, "height": 596 }, { "name": "stryker/IMG_4549", "type": "image", "width": 480, "height": 640 }, { "name": "stryker/Latin-American-Course", "type": "image", "width": 5947, "height": 2958 }, { "name": "stryker/MIAT-Team", "type": "image", "width": 595, "height": 338 }, { "name": "stryker/pic 3", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/Pic 2", "type": "image", "width": 4032, "height": 3024 }] },
    "stryker/Surgeon_engagement": { "type": "media_set", "members": [{ "name": "stryker/110A3303", "type": "image", "width": 4800, "height": 2700 }, { "name": "stryker/110A3329", "type": "image", "width": 4800, "height": 3200 }, { "name": "stryker/110A3410", "type": "image", "width": 4800, "height": 3200 }, { "name": "stryker/2019-05-18 10.18.00-1", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/2019-05-18 10.18.06-1", "type": "image", "width": 3024, "height": 4032 }, { "name": "stryker/2019-05-18 10.18.30-1", "type": "image", "width": 3024, "height": 4032 }, { "name": "stryker/2019-05-18 10.29.14 HDR-1", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/2019-05-18 10.36.53", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/2019-05-18 12.48.36 HDR-1", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/AW2A6334", "type": "image", "width": 4800, "height": 3200 }, { "name": "stryker/DSC_0065", "type": "image", "width": 1936, "height": 1296 }, { "name": "stryker/DSC_0071", "type": "image", "width": 1936, "height": 1296 }, { "name": "stryker/DSC_0132", "type": "image", "width": 1936, "height": 1296 }, { "name": "stryker/mobile lab 2-1", "type": "image", "width": 842, "height": 561 }, { "name": "stryker/mobile lab", "type": "image", "width": 842, "height": 561 }, { "name": "stryker/Stryker Lab 3-1", "type": "image", "width": 7952, "height": 5304 }, { "name": "stryker/Stryker TBC 2019 Group Photo-1", "type": "image", "width": 3e3, "height": 2400 }, { "name": "stryker/WHole Group 1", "type": "image", "width": 7579, "height": 4841 }] },
    "stryker/aria_drill_mixedmedia": { "type": "media_set", "members": [{ "name": "stryker/Aria_mixMedia2", "type": "image", "width": 1800, "height": 750 }, { "name": "stryker/Aria_mixMedia3", "type": "image", "width": 1800, "height": 750 }, { "name": "stryker/Aria_mix", "type": "image", "width": 1800, "height": 750 }] },
    "stryker/gallery": { "type": "media_set", "members": [{ "name": "stryker/Xpedition_gallery_first", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition_gallery_second", "type": "image", "width": 1200, "height": 1800 }, { "name": "stryker/Xpedition_gallery_third", "type": "image", "width": 1200, "height": 800 }, { "name": "stryker/Xpedition_gallery_fourth", "type": "image", "width": 853, "height": 1200 }, { "name": "stryker/Xpedition_gallery_fifith", "type": "image", "width": 849, "height": 1200 }, { "name": "stryker/Xpedition_gallery_6", "type": "image", "width": 843, "height": 1200 }, { "name": "stryker/Xpedition_gallery_7", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition top of stairs with patient", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition down stairs with lights", "type": "image", "width": 1066, "height": 1501 }, { "name": "stryker/Xpedition door threshhold", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition to the ambulance", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition_track closeup", "type": "image", "width": 1054, "height": 1291 }, { "name": "stryker/Xpedition back lights", "type": "image", "width": 800, "height": 1200 }, { "name": "stryker/Xpedition buttons", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition up_down stairs buttons", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition foot rest", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition restraints", "type": "image", "width": 1600, "height": 1066 }, { "name": "stryker/Xpedition buckles", "type": "image", "width": 1600, "height": 1066 }] },
    "stryker/judy_mixed_media2": { "type": "media_set", "members": [{ "name": "stryker/20191105-AC_Caregivers_Judy-274", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/110519ACCaregiverStory-18", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-102", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-129", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-134", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-160", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-182", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-183", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-197", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-243", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-252", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-256", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-29", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-296", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-358", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-385", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-407", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-416", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-517", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-53", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-535", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-544", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-548", "type": "image", "width": 1280, "height": 720 }, { "name": "stryker/20191105-AC_Caregivers_Judy-94", "type": "image", "width": 1280, "height": 720 }] },
    "stryker/saan_2018": { "type": "media_set", "members": [{ "name": "stryker/JVB_2031", "type": "image", "width": 2695, "height": 1855 }, { "name": "stryker/39847828304_ec62829212_k", "type": "image", "width": 2048, "height": 1365 }, { "name": "stryker/SVA-SAAN Event", "type": "image", "width": 4524, "height": 2388 }, { "name": "stryker/Howard Event 27-Feb-2018", "type": "image", "width": 4032, "height": 3024 }, { "name": "stryker/JVB_2030", "type": "image", "width": 2732, "height": 1830 }] },
    "stryker/safe": { "type": "img_set", "members": [{ "name": "stryker/pic_4", "type": "image", "width": 617, "height": 525 }, { "name": "stryker/pic_1", "type": "image", "width": 617, "height": 525 }, { "name": "stryker/pic_2", "type": "image", "width": 617, "height": 525 }, { "name": "stryker/pic_3", "type": "image", "width": 617, "height": 525 }] },
    "stryker/silverglide_mixedmedia": { "type": "media_set", "members": [{ "name": "stryker/silver_mixMed1", "type": "image", "width": 1800, "height": 750 }, { "name": "stryker/silver_mixMed2", "type": "image", "width": 1800, "height": 750 }, { "name": "stryker/silver_mixMed3", "type": "image", "width": 1800, "height": 750 }] },
    "stryker/vsp_trauma_media": { "type": "media_set", "members": [{ "name": "stryker/1699886738_VSP-T-1", "type": "image", "width": 1026, "height": 957 }, { "name": "stryker/1699886771_VSP-T-2", "type": "image", "width": 1021, "height": 958 }, { "name": "stryker/1699886797_VSP-T-3", "type": "image", "width": 1021, "height": 956 }] }
  };

  // tools/importer/corp-component-handlers.js
  var SOURCE = "https://www.stryker.com";
  var block = (doc, name, cells) => WebImporter.Blocks.createBlock(doc, { name, cells });
  var linkTo = (doc, href, label = href) => {
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.textContent = label;
    return a;
  };
  var para = (doc, ...children) => {
    const p = doc.createElement("p");
    p.append(...children);
    return p;
  };
  function styleColour(el) {
    const m = (el && el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    if (!m) return "";
    const v = m[1].trim().toLowerCase();
    const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    const hex = rgb ? rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("") : (v.match(/^#([0-9a-f]{6})$/) || [])[1] || "";
    return colourClass(hex);
  }
  var BOXES = [
    ["dimensional-box", "dimensional"],
    ["bg-gold", "bg-gold"],
    ["bg-light-gray", "bg-light-gray"],
    ["bg-lighter-gray", "bg-gray"],
    ["bg-dark-gray", "bg-dark-gray"],
    ["bg-white", "bg-white"],
    ["bg-blue", "bg-blue"],
    ["bg-purple", "bg-purple"],
    ["bg-teal", "bg-teal"],
    ["bg-gray", "bg-silver"],
    ["bg-orange", "bg-dark-gold"]
  ];
  var boxOf = (el) => (BOXES.find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
  var boxColour = (el) => (BOXES.slice(1).find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
  var heroBox = (overlay) => {
    const box = overlay && overlay.querySelector(".c-largeheadline > .has-background, .c-rich-text-editor > .has-background");
    const colour = boxColour(box);
    return colour ? `box-${colour.replace(/^bg-/, "")}` : null;
  };
  var boxStyles = (el) => {
    const colour = boxColour(el);
    const shadow = !!(el && el.classList.contains("dimensional-box"));
    return [colour || "", colour || shadow ? "boxed" : "", shadow ? "shadow-box" : ""].filter(Boolean);
  };
  function vwSize(el) {
    return [...el.querySelectorAll('[class*="vw"]')].reduce((max, span) => {
      const m = span.className.match(/fontsize-(\d+)(?:-(\d+))?-?vw/);
      return m ? Math.max(max, Number(`${m[1]}.${m[2] || 0}`)) : max;
    }, 0);
  }
  var SPACING_PROPS = [
    "padding-top",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "margin-top",
    "margin-bottom",
    "margin-left",
    "margin-right"
  ];
  function spacingOf(box) {
    const style = box && box.getAttribute && box.getAttribute("style") || "";
    return SPACING_PROPS.flatMap((prop) => {
      const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)(%|px)\\s*(?:;|$)`));
      if (!m || Number(m[1]) === 0) return [];
      return [`${prop}-${m[1].replace("-", "minus-").replace(".", "-")}${m[2] === "px" ? "px" : ""}`];
    });
  }
  var itemsSpacing = (items) => ((items || []).find((it) => it.type === "flow" && (it.spacing || []).length) || {}).spacing || [];
  function spacingMarker(doc, tokens) {
    const p = doc.createElement("p");
    p.textContent = `[[${["spacing", ...tokens].join(",")}]]`;
    return p;
  }
  function markedNodes(items, nodesOf, doc) {
    let open = false;
    return items.flatMap((it) => {
      const tokens = it.type === "flow" ? it.spacing || [] : [];
      const nodes = nodesOf(it);
      if (!nodes.length) return [];
      if (tokens.length) {
        open = true;
        return [spacingMarker(doc, tokens), ...nodes];
      }
      if (open) {
        open = false;
        return [spacingMarker(doc, []), ...nodes];
      }
      return nodes;
    });
  }
  function buttonNode(doc, source, label) {
    const a = linkTo(doc, newTabHref(source, absoluteAsset(source.getAttribute("href"))), label);
    const strong = doc.createElement("strong");
    if (source.classList.contains("btn-gold")) {
      const em = doc.createElement("em");
      em.append(a);
      strong.append(em);
    } else {
      strong.append(a);
    }
    return para(doc, strong);
  }
  function wrapInlineRuns(box, doc) {
    let run = null;
    [...box.childNodes].forEach((node) => {
      if (node.parentNode !== box) return;
      if (node.nodeType === 1 && (BLOCK_TAGS.has(node.tagName) || node.tagName === "DIV")) {
        run = null;
        return;
      }
      if (node.nodeType === 1 && node.tagName === "BR" && run) {
        let next = node.nextSibling;
        while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
        if (next && next.nodeName === "BR") {
          next.remove();
          node.remove();
          run = null;
          return;
        }
      }
      if (!run) {
        if (node.nodeType === 3 && !node.textContent.trim()) return;
        run = doc.createElement("p");
        node.before(run);
      }
      run.append(node);
    });
  }
  function richTextNodes(source, doc) {
    const box = contentCopy(source, doc);
    wrapInlineRuns(box, doc);
    const plainBold = plainBoldParagraphs(box);
    const serifHeads = serifHeadings(box);
    const plainB = (b) => !b.closest(".futura-bold") && !b.querySelector(".futura-bold");
    const inlineBold = new Set([...box.querySelectorAll("p, li, ul, ol")].filter((el) => [...el.querySelectorAll("b")].some(plainB)));
    const headingSizes = new Map([...box.querySelectorAll("h2, h3")].map((h) => [h, headingSizeStyle(h)]).filter(([, s]) => s));
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    markRuns(box);
    const { centred, size } = cleanRichText(box);
    const nodes = [];
    [...box.childNodes].forEach((node) => {
      if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) nodes.push(node);
      else if (node.nodeType === 1 && node.tagName === "IMG") nodes.push(para(doc, node));
      else if (node.nodeType === 1 && node.tagName === "DIV") {
        nodes.push(...[...node.children].filter((el) => BLOCK_TAGS.has(el.tagName)));
      } else if (text(node)) nodes.push(para(doc, node.cloneNode(true)));
    });
    nodes.forEach((node) => {
      if (plainBold.has(node)) node.boldBody = true;
      if (inlineBold.has(node)) node.inlineBold = true;
      if (serifHeads.has(node)) node.serifHeading = true;
      if (headingSizes.has(node)) node.headingSize = headingSizes.get(node);
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
    return { nodes, centred };
  }
  function statistics(counters, ctx, columns = counters.length, countUp = true) {
    const rows = counters.map((c) => c.colour ? [c.colour, c.value, c.desc] : [c.value, c.desc]);
    const cols = `cols-${Math.min(Math.max(columns, 1), 4)}`;
    const left = counters.some((c) => c.left) ? ", left" : "";
    return block(ctx.doc, `Statistics (${countUp ? "count-up, count-once, " : ""}${cols}${left})`, rows);
  }
  function inlineNodes(items, ctx, { marks = true } = {}) {
    if (marks && items.some((it) => it.type === "flow" && (it.spacing || []).length)) {
      return markedNodes(items, (it) => inlineNodes([it], ctx, { marks: false }), ctx.doc);
    }
    const out = [];
    let counters = [];
    const flushCounters = () => {
      if (counters.length) out.push(statistics(counters, ctx));
      counters = [];
    };
    items.forEach((item) => {
      if (item.type !== "counter") flushCounters();
      if (item.type === "counter") counters.push(item);
      else if (item.type === "flow") out.push(...item.nodes);
      else if (item.type === "block") out.push(item.block);
      else if (["own", "fragment", "form"].includes(item.type)) {
        if (item.type === "own" && (item.styles || []).length) ctx.report.notes.push(`section style ${item.styles.join(", ")} of a nested ${item.kind} dropped`);
        out.push(...item.nodes);
      } else if (item.type === "group") out.push(...inlineNodes(item.items, ctx));
      else if (item.type === "anchor") ctx.report.notes.push(`anchor #${item.id} inside a nested section, dropped`);
    });
    flushCounters();
    return out;
  }
  var hasContent = (items) => items.some((it) => it.type !== "flow" || it.nodes.length);
  var isTitle = (node) => /^H[1-6]$/.test(node.tagName) || node.tagName === "P" && node.querySelector("strong") && text(node.querySelector("strong")) === text(node);
  var isCta = (node) => node.tagName === "P" && node.querySelectorAll("a").length === 1 && text(node.querySelector("a")) === text(node);
  function isCard(items) {
    if (!items.every((it) => it.type === "flow")) return false;
    if (!items.length || items[0].role !== "image") return false;
    const rest = items.slice(1).flatMap((it) => it.nodes);
    return rest.length >= 2 && isTitle(rest[0]) && isCta(rest[rest.length - 1]);
  }
  function cellNodes(items, ctx, { marks = false } = {}) {
    if (marks) return markedNodes(items, (it) => cellNodes([it], ctx), ctx.doc);
    return items.flatMap((it) => {
      if (it.type === "flow") return it.nodes;
      if (it.type === "block" && it.cellNodes) return it.cellNodes;
      if (it.type === "separator") {
        ctx.report.notes.push("section separator inside a column, dropped");
        return [];
      }
      return [];
    });
  }
  var isLabel2 = (node) => node.tagName === "P" && node.querySelector("strong") && text(node.querySelector("strong")) === text(node) && !node.querySelector("a, picture, img");
  var sizeOf = (style) => (style || "").split(", ").find((s) => /^p-\d/.test(s)) || "";
  var LABEL_STYLES = { "p-1-5": "label-1-5", "p-1-75": "label-1-75", "p-2": "label-2" };
  function sharedCopyStyle(cells, ctx) {
    const nodes = cells.flat().filter((n) => n.copyStyle !== void 0);
    const weights = /* @__PURE__ */ new Map();
    nodes.filter((n) => !isLabel2(n)).forEach((n) => {
      const style = n.copyStyle || "";
      weights.set(style, (weights.get(style) || 0) + text(n).length);
    });
    if (!weights.size) {
      const sizes = new Set(nodes.filter(isLabel2).map((n) => sizeOf(n.copyStyle)));
      return sizes.size === 1 ? [...sizes][0] : "";
    }
    const [copy] = [...weights.entries()].sort((a, b) => b[1] - a[1])[0];
    if (weights.size > 1) {
      const others = [...weights.keys()].filter((s) => s !== copy).map((s) => s || "default");
      ctx.report.notes.push(`Columns: mixed copy styles, kept ${copy || "default"} (also ${others.join(" / ")})`);
    }
    const labelSizes = new Set(nodes.filter(isLabel2).map((n) => sizeOf(n.copyStyle)));
    const [labelSize] = [...labelSizes];
    if (labelSizes.size !== 1 || !labelSize || labelSize === sizeOf(copy)) return copy;
    if (LABEL_STYLES[labelSize]) return [copy, LABEL_STYLES[labelSize]].filter(Boolean).join(", ");
    ctx.report.notes.push(`Columns: label size ${labelSize} has no label style, labels take the copy size`);
    return copy;
  }
  function cellStyles(cells, ctx) {
    const copy = sharedCopyStyle(cells, ctx);
    const heads = cells.flat().filter((n) => /^H[23]$/.test(n.tagName));
    const allBold = (h) => h.children.length === 1 && h.firstElementChild.tagName === "STRONG" && text(h.firstElementChild) === text(h) && !h.querySelector("em");
    const serif = heads.some((n) => n.serifHeading) && heads.every((n) => n.serifHeading || allBold(n));
    if (!serif && heads.some((n) => n.serifHeading)) ctx.report.notes.push("serif and Futura h2 / h3 in one block, kept in Futura");
    if (!serif) {
      heads.filter((h) => h.tagName === "H2" && allBold(h)).forEach((h) => unwrap(h.firstElementChild));
    }
    const boldBody = cells.flat().some((n) => n.inlineBold || n.boldBody);
    const sizes = new Set(heads.map((n) => n.headingSize || ""));
    const headingSize = sizes.size === 1 ? [...sizes][0] : "";
    return [...copy ? copy.split(", ") : [], serif ? "h-serif" : "", headingSize, boldBody ? "bold-body" : ""].filter(Boolean);
  }
  var FRACTIONS = {
    3: "1-4",
    4: "1-3",
    6: "1-2",
    8: "2-3",
    9: "3-4"
  };
  function columnStyles(widths, index, ctx, starts = null) {
    if (!widths || !widths[index]) return [];
    const width = widths[index];
    const start = starts ? starts[index] : widths.slice(0, index).reduce((sum, w) => sum + w, 0);
    if (width >= 12) return [];
    if (!FRACTIONS[width] || start && !FRACTIONS[start]) {
      ctx.report.notes.push(`one filled column of ${width}/12 at ${start}/12: no column style, full width`);
      return [];
    }
    return [`col-${FRACTIONS[width]}`, ...start ? [`col-at-${FRACTIONS[start]}`] : []];
  }
  function columnItems(columns, split, ctx, widths = null, starts = null) {
    const { doc } = ctx;
    const anchors = [];
    const cols = columns.map((items) => items.filter((it) => {
      if (it.type === "anchor") anchors.push(it);
      return it.type !== "anchor";
    }));
    const filled = cols.filter(hasContent);
    if (!filled.length) return anchors;
    if (filled.length === 1) {
      const styles = columnStyles(widths, cols.indexOf(filled[0]), ctx, starts);
      if (!styles.length) return [...anchors, { type: "boundary" }, ...filled[0], { type: "boundary" }];
      return [...anchors, { type: "group", styles, items: filled[0] }];
    }
    const all = filled.flat();
    if (filled.every((items) => items.every((it) => it.type === "counter"))) {
      return [...anchors, {
        type: "own",
        kind: "statistics",
        styles: [],
        nodes: [statistics(all, ctx, filled.length)]
      }];
    }
    const flex = (styles, items) => ({
      type: "own",
      kind: "flex",
      styles: ["flex", ...styles],
      nodes: inlineNodes(items, ctx)
    });
    const formCol = filled.findIndex((items) => items.some((it) => it.type === "form"));
    if (formCol >= 0) {
      const items = filled[formCol];
      const at = items.findIndex((it) => it.type === "form");
      const before = items.slice(0, at).filter((it) => hasContent([it]));
      const after = items.slice(at + 1).filter((it) => hasContent([it]));
      const inFlex = filled.map((col, i) => i === formCol ? [items[at]] : col).flat();
      return [
        ...anchors,
        { type: "boundary" },
        ...before,
        flex(split.flex ? [split.flex] : [], inFlex),
        { type: "boundary" },
        ...after,
        { type: "boundary" }
      ];
    }
    const inCell = (it) => it.type === "flow" || it.type === "separator" || it.type === "block" && it.cellNodes;
    if (!all.every(inCell)) {
      if (split.grid && split.unequal) {
        ctx.report.notes.push(`responsive grid row (${split.variant}) with blocks or fragments: no layout for unequal widths, stacked`);
        return columns.flat();
      }
      const last2 = filled[filled.length - 1];
      if (last2.length === 1 && last2[0].type === "own" && last2[0].kind === "tabs") {
        const others = inlineNodes(filled.slice(0, -1).flat(), ctx);
        const level = Number((last2[0].nodes.find((n) => /^H[1-6]$/.test(n.tagName)) || { tagName: "H6" }).tagName[1]);
        if (!others.some((n) => /^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) >= level)) {
          return [...anchors, {
            type: "own",
            kind: "flex",
            styles: ["flex", ...last2[0].styles],
            nodes: [...others, ...last2[0].nodes]
          }];
        }
        ctx.report.notes.push("tabs beside content with headings as deep as the tab titles: tabbed style dropped");
      }
      return [...anchors, flex([], all)];
    }
    if (split.cards && filled.length >= 2 && filled.every(isCard)) {
      const rows = filled.map((items) => [items[0].nodes, items.slice(1).flatMap((it) => it.nodes)]);
      return [...anchors, {
        type: "own",
        kind: "cards",
        styles: [],
        nodes: [block(doc, `Cards Corp (${split.cards})`, rows)]
      }];
    }
    const modifiers = [];
    const cells = cols.map((items, i) => {
      const content = items.filter((it) => it.type === "flow" && it.nodes.length || it.type === "block" && it.cellNodes);
      const spaced = content.filter((it) => (it.spacing || []).length);
      if (!spaced.length) return cellNodes(items, ctx);
      const same = new Set(spaced.map((it) => it.spacing.join(" "))).size === 1;
      if (same && spaced.length === content.length) {
        modifiers.push(...spaced[0].spacing.map((t) => `cell-${i + 1}-${t}`));
        return cellNodes(items, ctx);
      }
      return cellNodes(items, ctx, { marks: true });
    });
    const headline2 = cols.some((items) => items.some((it) => it.role === "headline"));
    const richText = cols.some((items) => items.some((it) => it.role === "text"));
    if (headline2 && !richText) modifiers.push("large-headline");
    if (headline2 && richText) ctx.report.notes.push("Columns: Large Headline next to rich text, large-headline modifier left out");
    const flows = (items) => items.filter((it) => it.type === "flow" && it.nodes.length);
    const first = flows(cols[0]);
    const last = flows(cols[cols.length - 1]);
    if (first.length && first.every((it) => it.box === "bg-gold")) modifiers.push("gold-first");
    if (last.length && last[0].box === "bg-light-gray") modifiers.push("gray-lead");
    if (last.length && last.every((it) => it.box === "dimensional")) modifiers.push("boxed-last");
    if (cols.every((items) => flows(items).every((it) => it.role === "image"))) modifiers.push("media-pair");
    const boxes = cols.flatMap((items) => flows(items)).filter((it) => it.box);
    const used = { "bg-gold": "gold-first", "bg-light-gray": "gray-lead", dimensional: "boxed-last" };
    boxes.filter((it) => !modifiers.includes(used[it.box])).forEach((it) => {
      ctx.report.notes.push(`Columns: ${it.box} box not reproduced (no variant for it in that cell): ${text(it.nodes[0] || doc.createElement("p")).slice(0, 40)}`);
    });
    const variants = [split.variant, ...modifiers].filter(Boolean);
    const name = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
    return [...anchors, {
      type: "own",
      kind: "columns",
      styles: cellStyles(cells, ctx),
      nodes: [block(doc, name, [cells])]
    }];
  }
  var SPLITS = {
    cols2: { variant: "columns-50-50", cards: "two-up" },
    "cols2_2-3_1-3": { variant: "columns-67-33", flex: "flex-67-33" },
    "cols2_1-3_2-3": { variant: "columns-33-67", flex: "flex-33-67" },
    cols3: { variant: "", cards: "three-up" },
    cols4: { variant: "" }
  };
  var GRID_SPLITS = {
    "6,6": SPLITS.cols2,
    "8,4": SPLITS["cols2_2-3_1-3"],
    "4,8": SPLITS["cols2_1-3_2-3"],
    "4,4,4": SPLITS.cols3,
    "3,3,3,3": SPLITS.cols4
  };
  function columnControl(el, ctx) {
    const split = [...el.classList].find((c) => /^cols\d?/.test(c)) || "cols";
    const row = el.querySelector(":scope > .colctrl > .row") || el.querySelector(".row");
    const columns = row ? [...row.children].filter((c) => /\bcol-/.test(c.className)) : [];
    const items = columns.map((col) => ctx.collect(col));
    const widths = columns.map((col) => Number((col.className.match(/\bcol-sm-(\d+)\b/) || [])[1]) || 0);
    if (split === "cols" || columns.length < 2) {
      const flat = items.flat();
      return hasContent(flat) ? [{ type: "boundary" }, ...flat, { type: "boundary" }] : flat;
    }
    if (!SPLITS[split]) ctx.report.notes.push(`column control ${split}: no Columns variant, imported as plain Columns`);
    return columnItems(items, SPLITS[split] || {}, ctx, widths.every(Boolean) ? widths : null);
  }
  function gridOptions(specs, total) {
    const value = (spec, bp, key) => {
      var _a;
      return (_a = spec[bp][key]) != null ? _a : spec.d[key];
    };
    const tokens = (bp) => specs.map((spec) => {
      const beh = value(spec, bp, "beh");
      if (beh === "hide") return "h";
      const o = value(spec, bp, "o");
      return `${o ? `o${o}-` : ""}${beh === "newline" ? "n" : ""}${value(spec, bp, "w")}`;
    }).join("-");
    const d = tokens("d");
    const t = tokens("t");
    const m = tokens("m");
    return [
      `grid-${total === 12 ? "" : `of${total}-`}${d}`,
      ...t !== d ? [`grid-t-${t}`] : [],
      ...m !== d ? [`grid-m-${m}`] : []
    ];
  }
  function gridRow(columns, widths, ctx, { specs = [], total = 12 } = {}) {
    const offsets = specs.some((spec) => spec.d.o);
    const split = total === 12 && !offsets ? GRID_SPLITS[widths.join(",")] : null;
    if (split) {
      const grid2 = gridOptions(specs, total);
      const stacked = `grid-m-${specs.map(() => 12).join("-")}`;
      if (!grid2.some((option) => option.startsWith("grid-t-")) && grid2.includes(stacked)) {
        return columnItems(columns, split, ctx, widths);
      }
      const variant = [split.variant, ...grid2].filter(Boolean).join(", ");
      return columnItems(columns, __spreadProps(__spreadValues({}, split), { variant, grid: true }), ctx, widths);
    }
    const starts = [];
    specs.reduce((at, spec) => {
      starts.push(at + (spec.d.o || 0));
      return at + (spec.d.o || 0) + spec.d.w;
    }, 0);
    const twelfths = total === 12 ? { widths, starts } : null;
    const grid = {
      variant: gridOptions(specs, total).join(", "),
      grid: true,
      unequal: offsets || new Set(widths).size > 1
    };
    return columnItems(columns, grid, ctx, twelfths == null ? void 0 : twelfths.widths, twelfths == null ? void 0 : twelfths.starts);
  }
  function textComponent(el, ctx) {
    const source = el.querySelector(".c-rich-text-editor > div") || el.querySelector(".c-rich-text-editor") || el;
    const { nodes, centred } = richTextNodes(source, ctx.doc);
    if (!nodes.length) return [];
    const box = boxOf(source);
    const item = {
      type: "flow",
      role: "text",
      nodes,
      centred,
      box,
      spacing: spacingOf(source)
    };
    item.styles = boxStyles(source);
    return [item];
  }
  var BORDERS = {
    "bor-teal": "image-border",
    "bor-black": "image-border-black",
    "bor-gray": "image-border-grey",
    "bor-dark_gray": "image-border-grey",
    "bor-dark_gray_40T": "image-border-grey"
  };
  function standaloneImage(el, ctx) {
    const nodes = standaloneImageNodes(el, ctx.doc);
    if (!nodes.length) return [];
    const img = el.querySelector('img[class*="bor-"]');
    const cls = img && [...img.classList].find((c) => c.startsWith("bor-"));
    if (cls && !BORDERS[cls]) ctx.report.notes.push(`image border ${cls}: no style, imported without border`);
    const border = cls && BORDERS[cls];
    return [__spreadValues({
      type: "flow",
      role: "image",
      nodes
    }, border ? { styles: [border], own: true } : {})];
  }
  function buttons(el, ctx) {
    const { doc } = ctx;
    const head = [];
    const title = el.querySelector(".cta-title");
    if (title && text(title)) {
      const h = doc.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h4");
      const a = title.querySelector("a[href]");
      const label = (value, link2) => `[[${link2 ? "serif,color-black" : "serif"}]${value}]`;
      h.append(a ? linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute("href"))), label(text(a), true)) : doc.createTextNode(label(text(title))));
      head.push(h);
    }
    el.querySelectorAll(".cta-subtitle").forEach((d) => {
      if (!text(d)) return;
      const strong = doc.createElement("strong");
      strong.textContent = `[[size-1-5em]${text(d)}]`;
      head.push(para(doc, strong));
    });
    el.querySelectorAll(".cta-description").forEach((d) => {
      if (text(d)) head.push(para(doc, doc.createTextNode(text(d))));
    });
    const nodes = [...el.querySelectorAll("a[href]")].filter((a) => !a.closest(".cta-title, .cta-description")).map((a) => {
      if (text(a) && a.classList.contains("action-link")) {
        const u = doc.createElement("u");
        u.textContent = text(a);
        const link3 = linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute("href"))), "");
        link3.append(u);
        const strong = doc.createElement("strong");
        strong.append(link3);
        return para(doc, strong);
      }
      if (text(a)) return buttonNode(doc, a, text(a));
      const source = a.querySelector("img");
      if (!source) return null;
      const img = doc.createElement("img");
      img.setAttribute("src", source.getAttribute("src"));
      img.setAttribute("alt", source.getAttribute("alt") || "");
      const link2 = linkTo(doc, newTabHref(a, absoluteAsset(a.getAttribute("href"))), "");
      link2.append(img);
      if (!source.getAttribute("alt")) ctx.report.notes.push(`image button without alt text: ${source.getAttribute("src")}`);
      return para(doc, link2);
    }).filter(Boolean);
    const colour = ["btn-purple", "btn-blue"].find((c) => el.querySelector(`a.${c}`));
    return [
      ...head.length ? [{ type: "flow", role: "text", nodes: head }] : [],
      ...nodes.length ? [__spreadValues({
        type: "flow",
        role: "cta",
        nodes
      }, colour ? { styles: [colour], own: true } : {})] : []
    ];
  }
  function largeHeadline(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-largeheadline > .largeheadline") || el;
    const lines = [...root.querySelectorAll(".line")];
    const nodes = [];
    let centred = false;
    (lines.length ? lines : [root]).forEach((line) => {
      const box2 = contentCopy(line, doc);
      const futuraVw = !!line.querySelector(".futura-bold") && vwSize(line) > 0;
      const serifHeads = serifHeadings(box2);
      const squashed = (e) => text(e).replace(/\s+/g, "");
      const centredText = [...line.querySelectorAll('[style*="text-align"]')].filter((e) => /text-align:\s*center/i.test(e.getAttribute("style"))).map(squashed).join("");
      if (squashed(line) && centredText === squashed(line)) centred = true;
      let run = null;
      [...box2.childNodes].forEach((node) => {
        if (node.nodeType === 1 && (BLOCK_TAGS.has(node.tagName) || node.tagName === "DIV")) {
          run = null;
          return;
        }
        if (!run) {
          run = doc.createElement("p");
          node.before(run);
        }
        run.append(node);
      });
      box2.querySelectorAll("h4").forEach((h) => {
        const walker = doc.createTreeWalker(h, 4);
        let serif = true;
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const font = n.textContent.trim() && n.parentElement.closest(".urw-egyptienne, .futura-bold");
          if (n.textContent.trim() && (!font || !font.classList.contains("urw-egyptienne") || !h.contains(font))) serif = false;
        }
        if (serif || !text(h)) return;
        const span = doc.createElement("span");
        span.className = "futura-bold";
        while (h.firstChild) span.append(h.firstChild);
        h.append(span);
      });
      markRuns(box2, { serifDefault: true });
      if (cleanRichText(box2).centred) centred = true;
      [...box2.children].filter((n) => text(n) || n.querySelector("img")).forEach((n) => {
        let node = n;
        if (n.tagName === "H1") ctx.h1 = true;
        if (!ctx.h1 && futuraVw && !nodes.length && n.tagName !== "H1") {
          node = rename(n, "h1");
          node.querySelectorAll("strong > em").forEach(unwrap);
          ctx.h1 = true;
        }
        if (node === n && serifHeads.has(n)) node.serifHeading = true;
        nodes.push(node);
      });
    });
    if (!nodes.length) return [];
    const size = vwSize(root);
    const box = boxOf(root);
    const styles = size >= 2 ? [boxColour(root) || "", "large-headline"].filter(Boolean) : boxStyles(root);
    return [{
      type: "flow",
      role: "headline",
      nodes,
      box,
      size,
      styles,
      centred,
      spacing: spacingOf(root)
    }];
  }
  function sectionTitle(el, ctx) {
    const title = el.querySelector(".c-section-title");
    const id = title && title.id;
    const heading = title && title.querySelector(".title-container h1, .title-container h2, .title-container h3, .title-container h4");
    const items = id ? [{ type: "anchor", id }] : [];
    if (heading && text(heading) && el.getAttribute("data-corp-hidden") !== "true") {
      const h = ctx.doc.createElement(heading.tagName.toLowerCase());
      const u = ctx.doc.createElement("u");
      u.textContent = text(heading);
      h.append(u);
      const rest = [...heading.parentElement.children].filter((n) => n !== heading && text(n));
      const more = rest.flatMap((n) => {
        const box = contentCopy(n, ctx.doc);
        cleanRichText(box);
        return [rename(box, BLOCK_TAGS.has(n.tagName) ? n.tagName.toLowerCase() : "p")];
      });
      items.push({ type: "flow", role: "text", nodes: [h, ...more] });
    }
    return items;
  }
  function cellContent(nodes, doc) {
    return nodes.flatMap((node) => {
      if (node.tagName !== "TABLE") return [node];
      return [...node.querySelectorAll(":scope > tbody > tr > td, :scope > tr > td")].flatMap((td) => {
        const kids = [...td.childNodes].filter((n) => n.nodeType === 1 || text(n));
        if (kids.every((n) => n.nodeType === 1 && BLOCK_TAGS.has(n.tagName))) return kids;
        return kids.length ? [para(doc, ...kids)] : [];
      });
    });
  }
  function fullWidthImage(el, ctx) {
    const { doc } = ctx;
    const img = el.querySelector(".imgBoxId img") || el.querySelector("img");
    const box = el.querySelector(".textBoxId");
    const boxItems = box ? ctx.collect(box) : [];
    const overlay = boxItems.length ? cellContent(inlineNodes(boxItems, ctx, { marks: false }), doc) : [];
    if (!img && !overlay.length) return [];
    const source = img && img.closest("picture") && img.closest("picture").querySelector('source[media*="min-width"]');
    const image = (src) => {
      const i = doc.createElement("img");
      i.setAttribute("src", absoluteAsset(src));
      i.setAttribute("alt", img.getAttribute("alt") || "");
      return i;
    };
    const desktop = img && image(source && source.getAttribute("srcset").split(/[\s,]/)[0] || img.getAttribute("src"));
    const mobile = img && source && image(img.getAttribute("src"));
    if (!overlay.length) return [{ type: "flow", role: "image", nodes: [para(doc, desktop)] }];
    const bottom = box && box.classList.contains("bottom-text");
    const variants = ["image-slide", bottom ? "bottom-0" : "text-above"];
    const cols = box && [...box.classList].map((c) => c.match(/^col-sm-(\d+)$/)).find(Boolean);
    if (cols && Number(cols[1]) < 12) variants.push(`right-${Math.round(100 - Number(cols[1]) * 100 / 12)}`);
    if (heroBox(box)) variants.push(heroBox(box));
    variants.push(...itemsSpacing(boxItems));
    const rows = [desktop && [desktop], mobile && [mobile], [overlay]].filter(Boolean);
    return [{
      type: "own",
      kind: "hero",
      styles: cellStyles([overlay], ctx),
      nodes: [block(doc, `Hero Corp (${variants.join(", ")})`, rows)]
    }];
  }
  function fullWidthImageHero(el, ctx) {
    const items = [];
    const title = el.querySelector(".hero-space h1, .hero-space h2");
    const transparent = title && /color:\s*(transparent|rgba\([^)]*,\s*0\s*\))/i.test(title.getAttribute("style") || "");
    if (title && text(title) && transparent) {
      const h = ctx.doc.createElement(title.tagName.toLowerCase());
      h.textContent = `[[visually-hidden]${text(title)}]`;
      if (title.tagName === "H1") ctx.h1 = true;
      items.push({ type: "flow", role: "text", nodes: [h] });
    }
    if (title && text(title) && !transparent) {
      const box = contentCopy(title, ctx.doc);
      const colour = title.getAttribute("style");
      if (colour && /color/i.test(colour)) {
        const span = ctx.doc.createElement("span");
        span.setAttribute("style", colour);
        span.append(...box.childNodes);
        box.append(span);
      }
      cleanRichText(box);
      if (!box.querySelector("strong")) {
        const strong = ctx.doc.createElement("strong");
        strong.append(...box.childNodes);
        box.append(strong);
      }
      if (title.tagName === "H1") ctx.h1 = true;
      items.push({ type: "flow", role: "text", nodes: [rename(box, title.tagName.toLowerCase())] });
    }
    return [...items, ...fullWidthImage(el.querySelector(".pDiv") || el, ctx)];
  }
  function h1Title(el, ctx) {
    const source = el.querySelector("h1");
    if (!source || !text(source)) return [];
    const box = contentCopy(source, ctx.doc);
    cleanRichText(box);
    ctx.h1 = true;
    return [{ type: "flow", role: "text", nodes: [rename(box, "h1")] }];
  }
  function experienceFragment(el, ctx) {
    const match = ctx.xfMatches && ctx.xfMatches.get(el);
    if (match) {
      const a = linkTo(ctx.doc, match.eds);
      return [{
        type: "fragment",
        kind: "fragment",
        styles: [],
        nodes: [block(ctx.doc, "Fragment", [[a]])]
      }];
    }
    if (isEmptyXf(el)) return [];
    ctx.report.notes.push(`XF not matched to the index, kept inline: ${text(el).slice(0, 50)}`);
    return ctx.collect(el);
  }
  function carousel(el, ctx) {
    const { doc } = ctx;
    const slides = [...el.querySelectorAll(".carouselslide:not(.slick-cloned)")];
    if (!slides.length) return [];
    const index = ctx.slideIndex || 0;
    ctx.slideIndex = index + slides.length;
    const widget = el.querySelector('[data-widget="stryker-autocarousel"]');
    const options = ["carousel"];
    if (widget && widget.getAttribute("data-autoplay") === "true") {
      const ms = Number(widget.getAttribute("data-autoplayspeed")) || 3e3;
      options.push(`autoplay-${Math.max(ms, 1e3)}`);
    }
    if (widget && widget.getAttribute("data-transition") === "true") options.push("fade");
    const multi = slides.length > 1;
    let first = true;
    const slideStyles = () => {
      if (!multi) return [];
      const out = first ? options : ["carousel"];
      first = false;
      return out;
    };
    return slides.flatMap((slide, i) => {
      const ref = (ctx.slideRefs || [])[index + i];
      if (ref) {
        ["desktop", "mobile"].forEach((side) => {
          const target = ref[side];
          if (target && !target.eds) ctx.report.notes.push(`${side} slide XF ${target.xf} is ${target.status}: not imported`);
        });
      }
      const overlay = slide.querySelector(".overlayparsys");
      if (!slide.querySelector("img") && !slide.dataset.xfDesktop && !(overlay && text(overlay))) return [];
      const overlayItems = overlay ? ctx.collect(overlay) : [];
      const copyText = (selector) => {
        const area = slide.querySelector(selector);
        if (!area) return "";
        const copy = area.cloneNode(true);
        copy.querySelectorAll('script, style, [class*="s7"]').forEach((e) => e.remove());
        return text(copy);
      };
      if (slide.dataset.xfDesktop && !(overlay && text(overlay)) && copyText(".experienceFragment-ef")) {
        const fragment = (path, styles) => ({
          type: "fragment",
          kind: "fragment",
          styles,
          nodes: [block(doc, "Fragment", [[linkTo(doc, path)]])]
        });
        const carouselStyles = slideStyles();
        const both = !carouselStyles.length && slide.dataset.xfMobile && copyText(".experienceFragment-ef-mobile");
        return both ? [
          fragment(slide.dataset.xfDesktop, [...carouselStyles, "desktop-only"]),
          fragment(slide.dataset.xfMobile, [...carouselStyles, "mobile-only"])
        ] : [fragment(slide.dataset.xfDesktop, carouselStyles)];
      }
      if (!slide.querySelector("img") && !slide.dataset.xfDesktop) {
        ctx.report.notes.push(`slide without an image (its XF not rendered): overlay copy kept as text: ${text(overlay).slice(0, 40)}`);
        return overlayItems;
      }
      const overlayNodes = overlay ? cellContent(inlineNodes(overlayItems, ctx, { marks: false }), doc) : void 0;
      if (overlayNodes && overlayNodes.some((n) => n.tagName === "H1")) ctx.h1 = true;
      const variants = [];
      if (slide.querySelector(".experienceFragment-ef .aem-GridColumn--offset--default--6.aem-GridColumn--default--6")) variants.push("image-right");
      if (heroBox(overlay)) variants.push(heroBox(overlay));
      variants.push(...itemsSpacing(overlayItems));
      const holder = doc.createElement("div");
      holder.append(slide.cloneNode(true));
      parse(holder.firstElementChild, {
        document: doc,
        overlayNodes: overlayNodes && overlayNodes.length ? overlayNodes : void 0,
        variants,
        vwSize: false
      });
      return [{
        type: "own",
        kind: "hero",
        styles: [...slideStyles(), ...overlayNodes ? cellStyles([overlayNodes], ctx) : []],
        nodes: [...holder.children]
      }];
    });
  }
  function jumpBar(el, ctx) {
    const rows = [...el.querySelectorAll("a[data-linking]")].filter((a) => text(a)).map((a) => [text(a), `#${a.getAttribute("data-linking")}`]);
    return rows.length ? [{
      type: "own",
      kind: "nav",
      styles: [],
      nodes: [block(ctx.doc, "Sticky Nav", rows)]
    }] : [];
  }
  var PANELS = {
    "bg-light-gray": "bg-light-gray",
    "bg-gold": "bg-gold",
    "bg-dark-gray": "bg-dark-gray",
    "bg-white": "bg-white",
    "bg-dark-teal-gradient": "dark",
    "bg-dark-purple-gradient": "bg-dark-purple-gradient",
    "bg-dark-blue-gradient": "bg-dark-blue-gradient",
    "bg-dark-orange-gradient": "bg-dark-orange-gradient",
    "bg-golden-gradient": "bg-golden-gradient",
    "bg-blue": "blue",
    // the panel's bg-purple is the Stryker purple (#85458a); its bg-gray the silver (#b2b4ae,
    // e.g. target-tetra), not the light bg-gray band
    "bg-purple": "bg-purple",
    "bg-gray": "bg-silver"
  };
  function heroLargeCarousel(el, ctx) {
    const { doc } = ctx;
    const out = [];
    const title = el.querySelector(".c-hero-large-header .title");
    if (title && text(title)) {
      const h1 = doc.createElement("h1");
      const strong = doc.createElement("strong");
      strong.textContent = `[[size-0-75em]${text(title)}]`;
      h1.append(strong);
      ctx.h1 = true;
      out.push({ type: "flow", role: "text", nodes: [h1] });
    }
    const slides = [...el.querySelectorAll(".slide:not(.slick-cloned)")].filter((s) => text(s) || s.querySelector("img"));
    slides.forEach((slide, i) => {
      const container = slide.querySelector(".slide-container") || slide;
      const band = [...container.classList].map((c) => PANELS[c]).find(Boolean);
      const textCell2 = [];
      const heading = slide.querySelector(".slide-title");
      if (heading && text(heading)) {
        const h2 = doc.createElement("h2");
        const copy = contentCopy(heading, doc);
        cleanRichText(copy);
        h2.append(...copy.childNodes);
        textCell2.push(h2);
      }
      const subtitle = slide.querySelector(".slide-subtitle");
      if (subtitle && text(subtitle)) {
        const copy = contentCopy(subtitle, doc);
        cleanRichText(copy);
        textCell2.push(para(doc, ...copy.childNodes));
      }
      const link2 = slide.querySelector("a.slide-link[href]");
      if (link2 && text(link2)) textCell2.push(buttonNode(doc, link2, text(link2)));
      const img = slide.querySelector(".slide-image-container.hidden-xs img, .slide-image img");
      const imageCell2 = [];
      if (img) {
        const image = doc.createElement("img");
        image.setAttribute("src", img.getAttribute("src"));
        image.setAttribute("alt", (img.getAttribute("alt") || "").trim());
        if (!img.getAttribute("alt")) ctx.report.notes.push(`carousel slide image without alt text: ${img.getAttribute("src")}`);
        imageCell2.push(para(doc, image));
      }
      out.push({
        type: "own",
        kind: "columns",
        // banner: this component's look (gold arrow tabs at the edges, no dots, centred copy)
        styles: ["carousel", ...i ? [] : ["banner"], ...band ? [band] : [], "h-serif"],
        nodes: [block(doc, "Columns (columns-50-50)", [[textCell2, imageCell2]])]
      });
    });
    if (slides.length < 2) {
      out.forEach((item) => {
        if (item.styles) item.styles = item.styles.filter((st) => !["carousel", "banner"].includes(st));
      });
    }
    return out;
  }
  function fullBleedPanel(el, ctx) {
    const panel = el.querySelector(".c-full-bleed-panel") || el;
    const items = ctx.collect(panel);
    const cls = [...panel.classList].find((c) => PANELS[c]);
    if (!hasContent(items.filter((it) => it.type !== "anchor" && it.type !== "boundary"))) {
      const anchors = items.filter((it) => it.type === "anchor");
      if (cls && cls !== "bg-white" && panel.classList.contains("page-section")) {
        return [...anchors, {
          type: "own",
          kind: "stripe",
          styles: [PANELS[cls], "stripe"],
          nodes: []
        }];
      }
      return anchors;
    }
    if (!cls && /\bbg-/.test(panel.className)) ctx.report.notes.push(`full-bleed panel background ${panel.className}: no section style`);
    return [{ type: "group", styles: cls ? [PANELS[cls]] : [], items }];
  }
  function remoteComponent(el, ctx) {
    const input = el.querySelector("input.hdnSelComp");
    const value = input && input.getAttribute("value") || "";
    const [id, url] = value.split("|");
    if (!url) return [];
    const query = new URLSearchParams({ url: url.trim(), id: id.trim() }).toString();
    const a = linkTo(ctx.doc, `/widgets/remote-component?${query}`, id.trim());
    return [{
      type: "own",
      kind: "widget",
      styles: [],
      nodes: [para(ctx.doc, a)]
    }];
  }
  function marketoForm(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-marketo-form") || el;
    const form = root.querySelector('form[id^="mktoForm_"]');
    const alert = root.querySelector('[id^="alert_"]');
    const facts = ctx.facts && ctx.facts.forms || [];
    ctx.formIndex = (ctx.formIndex || 0) + 1;
    const formId = form && form.id.replace("mktoForm_", "") || alert && alert.id.replace("alert_", "") || (facts[ctx.formIndex - 1] || {}).formId;
    if (!formId) {
      ctx.report.notes.push("Marketo form without a form ID, dropped");
      return [];
    }
    const base = root.getAttribute("data-corp-marketo-base") || "//lp.stryker.com";
    const munchkin = (base.match(/\/\/(\d{3}-[A-Z]{3}-\d{3})\./) || [])[1] || "338-WAP-571";
    const rows = [["Base URL", base], ["Munchkin ID", munchkin], ["Form ID", formId]];
    const captcha = root.getAttribute("data-corp-captcha");
    if (captcha) {
      rows.push(["Captcha Script", `${SOURCE}/etc.clientlibs/stryker/components/content/altcha/altcha.js`]);
      rows.push(["Captcha Challenge URL", new URL(captcha, SOURCE).href]);
    }
    return [{
      type: "form",
      kind: "form",
      styles: [],
      nodes: [block(doc, "Marketo Form", rows)]
    }];
  }
  var COUNTER_COLOURS = {
    "color-gold": "gold",
    "color-blue": "navy",
    "color-navy": "navy",
    "color-teal": "teal",
    "color-purple": "purple"
  };
  function numberCounter(el, ctx) {
    const { doc } = ctx;
    const box = el.querySelector("[data-numbercounter-end-number]");
    const number = el.querySelector(".numbercounter-number");
    if (!box && !number) return [];
    const end = box ? box.getAttribute("data-numbercounter-end-number") : "";
    const kind = box ? box.getAttribute("data-numbercounter-number-type") : "";
    const currency = box ? box.getAttribute("data-numbercounter-currency-type") || "" : "";
    const shown = number ? text(number) : "";
    let value = shown && shown.replace(/[^\d.]/g, "") === end ? shown : end;
    if (value === end && kind === "3") value = `${end}%`;
    if (value === end && kind === "2") value = `${currency}${end}`;
    const vwClass = number && [...number.classList].find((c) => /^fontsize-\d+(-\d+)?-?vw$/.test(c));
    if (vwClass) value = `[[${vwClass.replace(/^fontsize-/, "size-").replace(/-vw$/, "vw")}]${value}]`;
    const colour = COUNTER_COLOURS[styleColour(number)] || "teal";
    const label = el.querySelector(".container > .text-left, .container > div:last-child");
    let desc = doc.createElement("p");
    if (label) {
      const { nodes } = richTextNodes(label, doc);
      if (nodes.length === 1) [desc] = nodes;
      else if (nodes.length) {
        desc = doc.createElement("div");
        desc.append(...nodes);
      }
    }
    const left = !!el.querySelector(".container > .text-left");
    return [{
      type: "counter",
      colour,
      value,
      desc,
      left
    }];
  }
  function fastFacts(el, ctx) {
    const { doc } = ctx;
    const facts = [...el.querySelectorAll(".c-fastfacts-item")].map((item) => {
      const desc = doc.createElement("p");
      desc.textContent = text(item.querySelector(".c-fastfacts-text"));
      return { value: text(item.querySelector(".c-fastfacts-number")), desc };
    }).filter((f) => f.value || text(f.desc));
    if (!facts.length) return [];
    const title = el.querySelector(".c-fastfacts-title");
    const rows = facts.map((c) => [c.value, c.desc]);
    if (title && text(title)) {
      const h = doc.createElement("h2");
      h.textContent = text(title);
      rows.unshift([h]);
    }
    const columns = el.querySelector(".c-fastfacts-item.col-sm-6") ? 2 : facts.length;
    return [{ type: "block", block: block(doc, `Statistics (fast-facts, cols-${Math.min(Math.max(columns, 1), 4)})`, rows) }];
  }
  function standaloneVideo(el, ctx) {
    const link2 = videoLink(el, ctx.doc);
    if (!link2) return [];
    const comp = el.querySelector(".c-standalone-video") || el;
    const options = [
      comp.classList.contains("black-border") && !comp.classList.contains("hide-border") ? "" : "no-border",
      el.querySelector("video[autoplay]") ? "autoplay" : ""
    ].filter(Boolean);
    const name = options.length ? `Video (${options.join(", ")})` : "Video";
    const items = [{
      type: "block",
      block: block(ctx.doc, name, [[link2]]),
      cellNodes: [para(ctx.doc, link2.cloneNode(true))]
    }];
    const desc = el.querySelector(".desc-content");
    if (desc && text(desc)) {
      const copy = contentCopy(desc, ctx.doc);
      cleanRichText(copy);
      const nodes = [...copy.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol")].filter((node) => !node.parentElement.closest("p, ul, ol") && text(node));
      if (nodes.length) items.push({ type: "flow", role: "text", nodes });
    }
    return items;
  }
  function interactiveMedia(el, ctx) {
    const { doc } = ctx;
    const viewer = el.querySelector("[data-asset-path]");
    if (!viewer) return [];
    const asset = viewer.getAttribute("data-asset-path");
    const server = viewer.getAttribute("data-imageserver") || "https://media-assets.stryker.com/is/image/";
    const img = doc.createElement("img");
    img.setAttribute("src", `${server}${asset.split("/").map(encodeURIComponent).join("/")}?$max_width_1440$`);
    img.setAttribute("alt", "");
    ctx.report.notes.push(`interactive image ${asset}: no alt text in the export (authors add it)`);
    const nodes = [para(doc, img)];
    const facts = (ctx.facts && ctx.facts.interactiveMedia || []).find((m) => m.asset === asset);
    const spots = facts && facts.hotspots || [];
    if (spots.length) {
      const ul = doc.createElement("ul");
      spots.forEach((spot) => {
        const anchor = spot.href.match(/^quickview:.*(#[\w-]+)$/);
        const href = anchor ? anchor[1] : spot.href.replace(/^https?:\/\/author-[^/]+/, "");
        const li = doc.createElement("li");
        li.append(linkTo(doc, href, spot.label));
        ul.append(li);
      });
      nodes.push(ul);
    } else {
      ctx.report.notes.push(`interactive image ${asset}: no hotspots in the page facts`);
    }
    return [{ type: "flow", role: "image", nodes }];
  }
  function resources(el, ctx) {
    const { doc } = ctx;
    const items = [...el.querySelectorAll(".item-list .item")].filter((item) => item.querySelector("a[href]"));
    if (!items.length) return [];
    const rows = items.map((item) => {
      const img = item.querySelector("img");
      const title = item.querySelector(".title, h5");
      const link2 = title && title.closest("a[href]") || item.querySelector("a[href]");
      const thumb = img ? absoluteAsset(img.getAttribute("src")) : "";
      const href = newTabHref(link2, absoluteAsset(link2.getAttribute("href")));
      const h5 = doc.createElement("h5");
      h5.append(linkTo(doc, href, text(title || link2) || img && img.getAttribute("alt") || href));
      return [thumb ? para(doc, linkTo(doc, thumb.startsWith("/") ? `${SOURCE}${thumb}` : thumb)) : "", h5];
    });
    const out = [];
    const heading = el.querySelector(".title-container h2, .title-container h3");
    if (heading && text(heading)) {
      const h2 = doc.createElement("h2");
      const u = doc.createElement("u");
      u.textContent = text(heading);
      h2.append(u);
      out.push({ type: "flow", role: "text", nodes: [h2] });
    }
    out.push({
      type: "block",
      block: block(doc, "Cards Corp (resources, six-up)", rows)
    });
    return out;
  }
  function cardList(el, ctx) {
    const { doc } = ctx;
    const grid = el.querySelector(".c-customizeable") || el;
    const items = [...grid.querySelectorAll(".item")].filter((item) => text(item));
    if (!items.length) return [];
    const out = [];
    const heading = grid.querySelector("h2");
    if (heading && text(heading)) {
      const h2 = doc.createElement("h2");
      const label = heading.classList.contains("border-bottom-gold") ? doc.createElement("u") : h2;
      label.textContent = text(heading);
      if (label !== h2) h2.append(label);
      out.push({ type: "flow", role: "text", nodes: [h2] });
    }
    const description = grid.querySelector(".c-customizable-description");
    if (description && text(description)) {
      const h = doc.createElement(/^H[1-6]$/.test(description.tagName) ? description.tagName.toLowerCase() : "p");
      h.textContent = text(description);
      out.push({ type: "flow", role: "text", nodes: [h] });
    }
    const targets = (ctx.facts && ctx.facts.cardLists || []).flatMap((list) => list.items || []);
    const imageSrc = (item) => {
      const img = item.querySelector("img");
      if (img && img.getAttribute("src")) return img.getAttribute("src");
      const href = item.querySelector("a[href]");
      if (!img || !href) return "";
      const path = new URL(href.getAttribute("href"), "https://www.stryker.com").pathname.replace(/\.html$/, "");
      const target = targets.find((t) => t.path === path && t.image);
      return target ? absoluteAsset(encodeURI(target.image)) : "";
    };
    const sources = items.map(imageSrc);
    if (sources.every(Boolean)) {
      const holder = doc.createElement("div");
      const copy = grid.cloneNode(true);
      copy.querySelectorAll("h2").forEach((h) => h.remove());
      [...copy.querySelectorAll(".item")].filter((item) => text(item)).forEach((item, i) => item.querySelector("img").setAttribute("src", sources[i]));
      holder.append(copy);
      parse2(copy, { document: doc });
      out.push({ type: "block", block: holder.firstElementChild });
      return out;
    }
    const rows = items.map((item, i) => {
      const body = [];
      const title = item.querySelector("h3");
      const link2 = title && title.querySelector("a[href]");
      if (title) {
        const h3 = doc.createElement("h3");
        h3.append(link2 ? linkTo(doc, link2.getAttribute("href"), text(link2)) : doc.createTextNode(text(title)));
        body.push(h3);
      }
      item.querySelectorAll(".desc-container > p").forEach((p) => {
        if (text(p)) body.push(para(doc, doc.createTextNode(text(p))));
      });
      const cta = item.querySelector("a.action-link[href]");
      if (cta && text(cta)) {
        const u = doc.createElement("u");
        u.textContent = text(cta);
        const a = linkTo(doc, cta.getAttribute("href"), "");
        a.append(u);
        const strong = doc.createElement("strong");
        strong.append(a);
        body.push(para(doc, strong));
      }
      if (!sources[i]) return ["", body];
      const img = doc.createElement("img");
      img.setAttribute("src", sources[i]);
      img.setAttribute("alt", (item.querySelector("img") || { getAttribute: () => "" }).getAttribute("alt") || "");
      return [img, body];
    });
    out.push({ type: "block", block: block(doc, "Cards Corp (teaser)", rows) });
    return out;
  }
  function tabs(el, ctx) {
    const { doc } = ctx;
    const titles = [...el.querySelectorAll(".tabs-nav .tab-link")].map(text);
    const panes = [...el.querySelectorAll(".tabs-content > .tab-content")];
    const collected = panes.map((pane) => ctx.collect(pane));
    const sets = collected.flat().flatMap((it) => {
      if (it.type === "own" && it.styles && it.styles.length) return [it.styles];
      if (it.type === "flow" && it.role === "text") {
        return it.nodes.map((n) => String(n.copyStyle || "").split(",").map((s) => s.trim()).filter(Boolean));
      }
      return [];
    });
    const copyStyle = (s) => /^(p-\d|serif$|bold-body$|label-|h-serif$|h-\d-)/.test(s);
    const inAll = (s) => copyStyle(s) && sets.every((set) => set.includes(s));
    const shared = sets.length ? sets[0].filter(inAll) : [];
    const panels = collected.map((items) => inlineNodes(items, ctx));
    if (!panels.some((nodes2) => nodes2.length)) return [];
    const deepest = panels.flat().reduce((max, n) => /^H[1-6]$/.test(n.tagName) ? Math.max(max, Number(n.tagName[1])) : max, 2);
    const level = Math.min(6, deepest + 1);
    const nodes = [];
    panels.forEach((panel, i) => {
      const title = titles[i] || (ctx.facts && ctx.facts.tabs && ctx.facts.tabs[0] || [])[i] || `Tab ${i + 1}`;
      const h = doc.createElement(`h${level}`);
      h.textContent = title;
      nodes.push(h, ...panel);
      if (!panel.length) ctx.report.notes.push(`tab "${title}" has no content`);
    });
    return [{
      type: "own",
      kind: "tabs",
      styles: ["tabbed", ...shared],
      nodes
    }];
  }
  function shortDescription(el, ctx) {
    const columns = [...el.querySelectorAll(':scope > .row > [class*="col-sm-"]')];
    if (columns.length !== 2) return ctx.collect(el);
    const items = columns.map((col) => ctx.collect(col).flatMap((it) => it.type === "group" ? it.items : [it]));
    const widths = columns.map((col) => Number((col.className.match(/\bcol-sm-(\d+)\b/) || [])[1]) || 0);
    return columnItems(items, SPLITS.cols2, ctx, widths.every(Boolean) ? widths : null);
  }
  function secondaryCta(el, ctx) {
    const nodes = [...el.querySelectorAll("a[href]")].filter((a) => text(a)).map((a) => {
      const link2 = linkTo(ctx.doc, newTabHref(a, absoluteAsset(a.getAttribute("href"))), "");
      const u = ctx.doc.createElement("u");
      u.textContent = text(a);
      link2.append(u);
      const strong = ctx.doc.createElement("strong");
      strong.append(link2);
      return para(ctx.doc, strong);
    });
    return nodes.length ? [{ type: "flow", role: "cta", nodes }] : [];
  }
  function relatedCategories(el, ctx) {
    const title = text(el.querySelector(".c-tagcrumb-title") || ctx.doc.createElement("h4")) || "Related categories";
    if (!el.querySelector(".c-tagcrumb-item a[href]")) return [];
    return [{ type: "block", block: block(ctx.doc, "Related Categories", [[title]]) }];
  }
  function fallback(el, ctx) {
    const { doc } = ctx;
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[data-corp-hidden="true"], script, style, button, input, noscript').forEach((n) => n.remove());
    copy.querySelectorAll('a[href^="#"]').forEach((a) => {
      if (a.querySelector("img") || !doc.getElementById(a.getAttribute("href").slice(1))) unwrap(a);
    });
    const box = doc.createElement("div");
    box.append(copy);
    cleanRichText(box);
    const nodes = [...box.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ul, ol, table, img")].filter((n) => !n.parentElement.closest("p, h1, h2, h3, h4, h5, h6, ul, ol, table")).map((n) => n.tagName === "IMG" ? para(doc, n) : n).filter((n) => text(n) || n.querySelector("img"));
    return nodes.length ? [{ type: "flow", role: "text", nodes }] : [];
  }
  function accordion(el, ctx) {
    const { doc } = ctx;
    const panels = [...el.querySelectorAll(".panel-group > .panel")].map((panel) => ({
      title: text(panel.querySelector(".panel-title") || doc.createElement("p")),
      items: ctx.collect(panel.querySelector(".panel-body") || panel),
      // open on load on the source (AEM defaultExpanded, rendered .panel-collapse.in)
      open: !!panel.querySelector(":scope > .panel-collapse.in")
    })).filter((p) => p.title || hasContent(p.items));
    if (!panels.length) return [];
    const label = (p, holder = doc.createElement("span")) => {
      if (!p.open) {
        holder.textContent = p.title;
        return holder;
      }
      const strong = doc.createElement("strong");
      strong.textContent = p.title;
      holder.append(strong);
      return holder;
    };
    const heading = el.querySelector(".c-accordion > .container > .component-subheading");
    const title = [];
    if (heading && text(heading)) {
      const h = doc.createElement(/^H[1-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
      const u = heading.classList.contains("border-bottom-gold") ? doc.createElement("u") : h;
      u.textContent = text(heading);
      if (u !== h) h.append(u);
      title.push({ type: "flow", role: "text", nodes: [h] });
    }
    const flowOnly = panels.every((p) => p.items.every((it) => it.type === "flow" || it.type === "anchor"));
    if (flowOnly) {
      const rows = panels.map((p) => [
        para(doc, ...label(p).childNodes),
        p.items.flatMap((it) => it.nodes || [])
      ]);
      return [...title, {
        type: "own",
        kind: "accordion",
        styles: [],
        nodes: [block(doc, "Accordion", rows)]
      }];
    }
    return [...title, ...panels.map((p) => {
      const h = label(p, doc.createElement("h3"));
      return {
        type: "own",
        kind: "accordion-panel",
        styles: ["accordion-panel"],
        nodes: [h, ...inlineNodes(p.items, ctx)]
      };
    })];
  }
  function pageHero(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-page-hero, .c-hero") || el;
    const title = root.querySelector(".title");
    const cell = [];
    if (title && text(title)) {
      const h1 = doc.createElement("h1");
      const strong = doc.createElement("strong");
      const em = doc.createElement("em");
      em.textContent = text(title);
      strong.append(em);
      h1.append(strong);
      cell.push(h1);
      ctx.h1 = true;
    }
    const subhead = root.querySelector(".subhead");
    if (subhead && text(subhead)) {
      const h2 = doc.createElement("h2");
      h2.append(...contentCopy(subhead, doc).childNodes);
      cleanRichText(h2);
      cell.push(h2);
    }
    root.querySelectorAll(".content").forEach((content) => {
      const box = doc.createElement("div");
      box.append(content.cloneNode(true));
      for (let n = content.nextSibling; n && !(n.nodeType === 1 && n.matches(".title, .subhead, .content")); n = n.nextSibling) {
        if (n.nodeType === 1 || text(n)) box.append(n.cloneNode(true));
      }
      const { nodes } = richTextNodes(box, doc);
      cell.push(...nodes.filter((node) => text(node)));
    });
    if (!cell.length) return [];
    const img = root.querySelector("picture img, img");
    const cells = [cell];
    if (img) {
      const source = root.querySelector("picture source[srcset]");
      const image = doc.createElement("img");
      image.setAttribute("src", source && source.getAttribute("srcset").split(/[\s,]/)[0] || img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
      if (!img.getAttribute("alt")) ctx.report.notes.push(`page hero image without alt text: ${image.getAttribute("src")}`);
      cells.push([para(doc, image)]);
    }
    const variants = ["columns-50-50", "page-intro"];
    if (root.querySelector(".border-bottom-gold")) variants.push("border-bottom");
    return [{
      type: "own",
      kind: "page-intro",
      styles: [],
      nodes: [block(doc, `Columns (${variants.join(", ")})`, [cells])]
    }];
  }
  function table(el, ctx) {
    const { doc } = ctx;
    const source = el.querySelector("table");
    if (!source) return [];
    const rows = [...source.querySelectorAll("tr")].map((tr) => [...tr.children].map((td) => {
      const box = contentCopy(td, doc);
      cleanRichText(box);
      return [...box.childNodes];
    }));
    if (!rows.length) return [];
    const first = source.querySelector("tr");
    const header = [...first.children].every((td) => !text(td) || [...td.querySelectorAll("b, strong, th")].some((b) => text(b) === text(td)) || td.tagName === "TH");
    if (header) {
      rows[0] = rows[0].map((nodes) => nodes.map((n) => {
        if (n.nodeType === 1) n.querySelectorAll("strong").forEach(unwrap);
        return n.nodeType === 1 && n.tagName === "STRONG" ? doc.createTextNode(n.textContent) : n;
      }));
    }
    const out = [];
    const caption = el.querySelector(".title-container h2, .title-container h3, .table-title");
    if (caption && text(caption)) {
      const h = doc.createElement("h3");
      h.textContent = text(caption);
      out.push({ type: "flow", role: "text", nodes: [h] });
    }
    out.push({ type: "block", block: block(doc, header ? "Table" : "Table (no-header)", rows) });
    return out;
  }
  function localNav(el, ctx) {
    const { doc } = ctx;
    const nav = el.querySelector("nav.greedy");
    const links = nav ? [...nav.querySelectorAll("ul.links a[href]")].filter((a) => text(a)) : [];
    const parent = nav && nav.querySelector("a.parent-node[href]");
    if (!links.length && !(parent && text(parent))) return [];
    const rows = [];
    if (parent && text(parent)) rows.push([linkTo(doc, parent.getAttribute("href"), text(parent))]);
    const path = (href) => href.replace(/^https?:\/\/www\.stryker\.com/, "").replace(/\/index\.html(?=$|[?#])/, "/").replace(/\.html(?=$|[?#])/, "");
    links.forEach((a) => rows.push([text(a), linkTo(doc, a.getAttribute("href"), path(a.getAttribute("href")))]));
    const name = el.querySelector(".rule-separator") ? "Sticky Nav (local)" : "Sticky Nav (local, no-rule)";
    return [{
      type: "own",
      kind: "nav",
      styles: [],
      nodes: [block(doc, name, rows)]
    }];
  }
  function promoTile(el, ctx) {
    const img = el.querySelector(".c-cross-promotional-tile img");
    if (!img) return [];
    const image = ctx.doc.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    const title = el.querySelector(".c-procare-tile-modal .c-procare-tile-title, #c-procare-tile-modal .c-procare-tile-title");
    const path = title && procareModalPath(text(title));
    if (!path) {
      ctx.report.notes.push(`cross-promotional tile without a modal title, kept as its image: ${img.getAttribute("alt") || img.getAttribute("src")}`);
      return [{ type: "flow", role: "image", nodes: [para(ctx.doc, image)] }];
    }
    const a = ctx.doc.createElement("a");
    a.setAttribute("href", path);
    a.append(image);
    return [{ type: "flow", role: "image", nodes: [para(ctx.doc, a)] }];
  }
  function componentTitle(h, doc) {
    const h2 = doc.createElement("h2");
    if (h.classList.contains("border-bottom-gold")) {
      const u = doc.createElement("u");
      u.textContent = text(h);
      h2.append(u);
    } else h2.textContent = text(h);
    return h2;
  }
  function latestNews(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-latestnews") || el;
    const items = [...root.querySelectorAll(".latestnews-container > .item")].filter((item) => text(item));
    if (!items.length) return [];
    const out = [];
    const heading = root.querySelector("h2");
    if (heading && text(heading)) out.push({ type: "flow", role: "text", nodes: [componentTitle(heading, doc)] });
    const rows = items.map((item) => {
      const body = [];
      const title = item.querySelector("h3");
      if (title && text(title)) {
        const h3 = doc.createElement("h3");
        h3.textContent = text(title);
        body.push(h3);
      }
      item.querySelectorAll(":scope > p.model, :scope > p.description").forEach((p) => {
        if (text(p)) body.push(para(doc, doc.createTextNode(text(p))));
      });
      const cta = item.querySelector("a.news-link[href], a.action-link[href]");
      if (cta && text(cta)) {
        const u = doc.createElement("u");
        u.textContent = text(cta);
        const a = linkTo(doc, cta.getAttribute("href"), "");
        a.append(u);
        const strong = doc.createElement("strong");
        strong.append(a);
        body.push(para(doc, strong));
      }
      const img = item.querySelector("img[src]");
      if (!img) return ["", body];
      const image = doc.createElement("img");
      image.setAttribute("src", img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
      return [image, body];
    });
    out.push({ type: "block", block: block(doc, "Cards Corp (teaser)", rows) });
    return out;
  }
  function titleComponent(el, ctx) {
    const { doc } = ctx;
    const box = el.querySelector(".title-container") || el;
    const nodes = [];
    const title = box.querySelector("h2");
    if (title && text(title)) nodes.push(componentTitle(title, doc));
    box.querySelectorAll(":scope > h3").forEach((h) => {
      if (!text(h)) return;
      const h3 = doc.createElement("h3");
      h3.textContent = text(h);
      nodes.push(h3);
    });
    return nodes.length ? [{ type: "flow", role: "text", nodes }] : [];
  }
  function divisionContactUs(el, ctx) {
    const { doc } = ctx;
    const form = el.querySelector("form") || el;
    const nodes = [];
    const title = form.querySelector("h2");
    if (title && text(title)) nodes.push(componentTitle(title, doc));
    const description = form.querySelector(".form-description");
    if (description) {
      const copy = description.cloneNode(true);
      copy.querySelectorAll(".form-control-asterix").forEach((star) => star.remove());
      if (text(copy)) {
        const p = doc.createElement("p");
        p.textContent = text(copy);
        nodes.push(p);
      }
    }
    ctx.report.notes.push("division contact form: no Marketo form ID for it yet (client), the form is left out");
    return nodes.length ? [{ type: "flow", role: "text", nodes }] : [];
  }
  function mixedMediaGallery(el, ctx) {
    const { doc } = ctx;
    const viewer = el.querySelector("[data-asset-path]");
    const asset = viewer && viewer.getAttribute("data-asset-path");
    const set = asset && SETS[asset];
    if (!set || !set.members.length) {
      if (asset) ctx.report.notes.push(`gallery ${asset}: no members in data/dm-sets.js (npm run build:dm-sets), left out`);
      return [];
    }
    const server = viewer.getAttribute("data-imageserver") || "https://media-assets.stryker.com/is/image/";
    const rows = set.members.map((member) => {
      const img = doc.createElement("img");
      img.setAttribute("src", `${server}${member.name.split("/").map(encodeURIComponent).join("/")}?$max_width_1440$`);
      img.setAttribute("alt", "");
      return [para(doc, img)];
    });
    ctx.report.notes.push(`gallery ${asset}: ${rows.length} images without alt text (authors add it)`);
    return [{
      type: "own",
      kind: "gallery",
      styles: [],
      nodes: [block(doc, "Gallery Corp", rows)]
    }];
  }
  function dynamicMedia(el, ctx) {
    const { doc } = ctx;
    const viewer = el.querySelector("[data-asset-path]");
    const asset = viewer && viewer.getAttribute("data-asset-path");
    if (!asset) return [];
    const server = viewer.getAttribute("data-imageserver") || "https://media-assets.stryker.com/is/image/";
    const img = doc.createElement("img");
    img.setAttribute("src", `${server}${asset.split("/").map(encodeURIComponent).join("/")}?$max_width_1440$`);
    img.setAttribute("alt", "");
    ctx.report.notes.push(`dynamic media viewer ${asset}: image without alt text (authors add it)`);
    return [{ type: "flow", role: "image", nodes: [para(doc, img)] }];
  }
  function featuredContentGrid(el, ctx) {
    const { doc } = ctx;
    const items = [];
    const title = el.querySelector("h2.component-subheading");
    const intro = el.querySelector(".intro");
    const lead = [];
    if (title && text(title)) lead.push(componentTitle(title, doc));
    if (intro && text(intro)) {
      const p = doc.createElement("p");
      p.textContent = text(intro);
      lead.push(p);
    }
    if (lead.length) items.push({ type: "flow", role: "text", nodes: lead });
    const cells = [...el.querySelectorAll(".grid-item-wrapper")].map((item) => {
      const nodes = [];
      const head = item.querySelector("a h4, h4");
      const link2 = head && head.closest("a");
      if (head && text(head)) {
        const h4 = doc.createElement("h4");
        h4.append(link2 ? linkTo(doc, link2.getAttribute("href"), text(head)) : doc.createTextNode(text(head)));
        nodes.push(h4);
      }
      const description = item.querySelector(".page-description");
      if (description && text(description)) {
        const p = doc.createElement("p");
        p.textContent = text(description);
        nodes.push(p);
      }
      const more = item.querySelector("a.more[href]");
      if (more) {
        const u = doc.createElement("u");
        u.textContent = text(more);
        const a = linkTo(doc, more.getAttribute("href"), "");
        a.textContent = "";
        a.append(u);
        nodes.push(para(doc, a));
      }
      return nodes;
    }).filter((nodes) => nodes.length);
    if (cells.length) {
      items.push({
        type: "own",
        kind: "columns",
        styles: [],
        nodes: [block(doc, "Columns (related-links)", [cells])]
      });
    }
    return items;
  }
  function bannerCampaign(el, ctx) {
    const { doc } = ctx;
    const source = el.querySelector(".c-banner-campaign-content img");
    if (!source) return [];
    const img = doc.createElement("img");
    const largest = el.querySelector(".c-banner-campaign-content source[srcset]");
    img.setAttribute("src", largest && largest.getAttribute("srcset").split(/\s+/)[0] || source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    if (!source.getAttribute("alt")) ctx.report.notes.push(`banner image without alt text: ${img.getAttribute("src")}`);
    const link2 = source.closest("a[href]");
    if (!link2) return [{ type: "flow", role: "image", nodes: [para(doc, img)] }];
    const a = linkTo(doc, newTabHref(link2, link2.getAttribute("href")), "");
    a.textContent = "";
    a.append(img);
    return [{ type: "flow", role: "image", nodes: [para(doc, a)] }];
  }
  var ENGAGEMENT_ICONS = { facebook: ":facebook:", linkedin: ":linkedin:" };
  function engagementCta(el, ctx) {
    const { doc } = ctx;
    const links = [...el.querySelectorAll(".engagementCTAcluster a.btn[href]")];
    if (!links.length) return [];
    const nodes = links.map((source) => {
      const icon = ENGAGEMENT_ICONS[String(source.id).toLowerCase()];
      const label = text(source);
      const a = linkTo(doc, newTabHref(source, source.getAttribute("href")), [icon, label].filter(Boolean).join(" ") || source.id);
      const strong = doc.createElement("strong");
      strong.append(a);
      return para(doc, strong);
    });
    const colour = links[0].classList.contains("bg-purple") ? "btn-purple" : links[0].classList.contains("bg-blue") && "btn-blue";
    return [{
      type: "flow",
      role: "cta",
      own: !!colour,
      styles: colour ? [colour] : [],
      nodes
    }];
  }
  function animatedBarChart(el, ctx) {
    const { doc } = ctx;
    const value = (cls) => (el.querySelector(`input.${cls}`) || { value: "" }).value.trim();
    const items = [...el.querySelectorAll("select.hdnChartSeries option")].map((option) => {
      const [colour, label, show] = text(option).split("|");
      return {
        label: (label || "").trim(),
        value: option.getAttribute("value"),
        colour: (colour || "").trim(),
        show: show !== "false"
      };
    }).filter((item) => item.show && item.label);
    if (!items.length) return [];
    const format = value("numberType") === "Currency" ? `Currency ${value("currency")}` : value("numberType");
    const rows = [
      ["Title", value("chartTitle")],
      ["Subtitle", value("chartSubTitle")],
      ["Format", format],
      ["Max", value("maxValue")],
      ["Axis title", value("yAxisTitle")],
      ["Labels", value("dataLabelDisplay") === "false" ? "false" : "true"]
    ].filter(([, v]) => v);
    items.forEach((item) => rows.push([item.label, item.value, item.colour]));
    const variant = /bar/i.test(value("chartType")) ? "Chart Corp (bar)" : "Chart Corp";
    return [{
      type: "own",
      kind: "chart",
      styles: [],
      nodes: [block(doc, variant, rows)]
    }];
  }
  function legacyVideo(el, ctx) {
    const { doc } = ctx;
    const player = el.querySelector("video");
    const path = (String(el.innerHTML).match(/var mediaPath = '([^']+)'/) || [])[1];
    const visible = player && Number(player.getAttribute("width")) > 0 && Number(player.getAttribute("height")) > 0;
    if (!path || !visible) return [];
    const href = path.replace(/\\u002D/g, "-").replace(/\\\//g, "/");
    return [{
      type: "block",
      block: block(doc, "Video", [[linkTo(doc, absoluteAsset(href), href.split("/").pop())]])
    }];
  }
  function boxNodes(el, doc) {
    const box = contentCopy(el, doc);
    cleanRichText(box);
    return [...box.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol")].filter((node) => !node.parentElement.closest("p, ul, ol") && text(node));
  }
  function procareModalItems(info, ctx) {
    const { doc } = ctx;
    const items = [];
    const title = info.querySelector(".c-procare-tile-title");
    if (title && text(title)) {
      const h2 = doc.createElement("h2");
      h2.textContent = text(title);
      items.push({ type: "flow", role: "text", nodes: [h2] });
    }
    const contact = info.querySelector(".c-procare-tile-contact");
    if (contact) {
      const cols = [...contact.children].filter((col) => /\bcol-/.test(col.className));
      const columns = cols.map((col) => {
        const nodes = boxNodes(col, doc);
        return nodes.length ? [{ type: "flow", role: "text", nodes }] : [];
      });
      items.push(...columnItems(columns, { variant: "columns-50-50" }, ctx, cols.map(() => 6)));
    }
    info.querySelectorAll(".c-table").forEach((el) => items.push(...table(el, ctx)));
    info.querySelectorAll(".c-procare-tile-addinfo").forEach((el) => {
      const nodes = boxNodes(el, doc);
      if (nodes.length) items.push({ type: "flow", role: "text", nodes });
    });
    const button = info.querySelector(":scope > a.btn[href]");
    if (button && text(button)) items.push({ type: "flow", role: "text", nodes: [buttonNode(doc, button, text(button))] });
    return items;
  }
  var skip = () => [];
  function publishDate(el, ctx) {
    const line = el.querySelector("h5") || el;
    if (!text(line)) return [];
    const h5 = ctx.doc.createElement("h5");
    h5.textContent = text(line);
    return [{ type: "flow", role: "text", nodes: [h5] }];
  }
  var inTemplateColumn = (handler) => (el, ctx) => {
    const items = handler(el, ctx);
    const col = el.closest('[class*="col-sm-"]');
    const width = col && Number((col.className.match(/\bcol-sm-(\d+)\b/) || [])[1]);
    const styles = width && width < 12 && items.length ? columnStyles([width], 0, ctx) : [];
    return styles.length ? [{ type: "group", styles, items }] : items;
  };
  function eventLocation(el, ctx) {
    const line = el.querySelector("h5") || el;
    if (!text(line)) return [];
    const h5 = ctx.doc.createElement("h5");
    h5.textContent = text(line);
    return [{ type: "flow", role: "text", nodes: [h5] }];
  }
  var COMPONENTS = {
    carouselslidegroup: carousel,
    "hero-large-carousel": heroLargeCarousel,
    "h1-title": h1Title,
    fullWidthImage,
    fullWidthImageHero,
    jumpbarnav: jumpBar,
    cols: columnControl,
    experienceFragment,
    "section-title": sectionTitle,
    text: textComponent,
    standaloneimage: standaloneImage,
    largeheadline: largeHeadline,
    fullbleedpanel: fullBleedPanel,
    remotecomponent: remoteComponent,
    marketoform: marketoForm,
    tabs,
    numbercounter: numberCounter,
    fastfacts: fastFacts,
    standalonevideo: standaloneVideo,
    interactivemedia: interactiveMedia,
    // a white rule (white-hr) is invisible on live: a plain section break; grey / unset: divider
    sectionseparator: (el) => el.querySelector(".white-hr") ? [{ type: "boundary" }] : [{ type: "separator" }],
    curatedcta: buttons,
    buttonset: buttons,
    secondarycta: buttons,
    contactbutton: buttons,
    customizable: cardList,
    resourcesanddownload: resources,
    "#product-detail-container": shortDescription,
    // a tag crumb placed as a component (ent/products/clarifix-cryotherapy-device, in a column):
    // the Related Categories block as the template's own; hidden ones are skipped by the walk
    tagcrumb: relatedCategories,
    latestnews: latestNews,
    // the product template's parts rendered without their AEM wrapper: the tag crumb (Related
    // Categories), the short description (rich text), the contact button and the secondary CTA
    "c-tagcrumb": relatedCategories,
    "c-page-short-description": textComponent,
    "c-contact-button": buttons,
    "c-secondary-cta": secondaryCta,
    accordion,
    pagehero: pageHero,
    hero: pageHero,
    table,
    localpagenavigation: localNav,
    localpagenavigationchild: localNav,
    "c-navigation-bar": jumpBar,
    "c-tiles": promoTile,
    title: titleComponent,
    divisioncontactus: divisionContactUs,
    mixedmediagallery: mixedMediaGallery,
    dynamicmedia: dynamicMedia,
    featuredcontentgrid: featuredContentGrid,
    bannercampaign: bannerCampaign,
    engagementcta: engagementCta,
    animatedbarchart: animatedBarChart,
    video: legacyVideo,
    // news-detail template slots (no AEM wrapper): the lead image and the intro rich text, the
    // publish date and the event location under the title, and the template's "back" link
    // (navigation, not authored)
    "c-standalone-image": inTemplateColumn(standaloneImage),
    "c-rich-text-editor": inTemplateColumn(textComponent),
    "c-publish-date": publishDate,
    "c-event-location-properties": eventLocation,
    "c-back-button": skip
  };
  var CORP_HANDLERS = { components: COMPONENTS, row: gridRow, fallback };

  // tools/importer/corp-page.js
  function rewriteCorpLinks(element) {
    element.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (href.startsWith("/widgets/")) return;
      a.setAttribute("href", corpLinkHref(href));
    });
  }

  // tools/importer/import-modal-fragments.js
  var import_modal_fragments_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const kind = source.searchParams.get("modal");
      if (kind !== "procare") throw new Error(`Unknown modal kind: ${kind}`);
      const info = document.querySelector("#c-procare-tile-modal .c-procare-tile-info");
      const title = info && info.querySelector(".c-procare-tile-title");
      const path = title && procareModalPath(text(title));
      if (!path) throw new Error(`No ProCare modal on ${source.pathname}`);
      const ctx = createBuilder({ doc: document, handlers: CORP_HANDLERS, source: source.href });
      ctx.place(procareModalItems(info, ctx));
      const main = document.createElement("div");
      main.append(...ctx.render());
      rewriteCorpLinks(main);
      document.body.replaceChildren(main);
      return [{
        element: main,
        path,
        report: {
          title: text(title),
          template: "modal",
          source: source.pathname,
          notes: ctx.report.notes
        }
      }];
    }
  };
  return __toCommonJS(import_modal_fragments_exports);
})();
