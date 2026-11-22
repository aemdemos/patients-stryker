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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/import-corp-modal-fragments.js
  var import_corp_modal_fragments_exports = {};
  __export(import_corp_modal_fragments_exports, {
    default: () => import_corp_modal_fragments_default
  });

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-richtext.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
  var BLANK_LINE = "[[Blank line]]";
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
    box.querySelectorAll('[style*="font-family"]').forEach((el) => {
      if (/font-family:[^;]*egyptienne/i.test(el.getAttribute("style"))) el.classList.add("urw-egyptienne");
    });
    return box;
  }
  function absoluteAsset(href) {
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN}${href}` : href;
  }
  function newTabHref(source, href) {
    if (!href || href.startsWith("#") || href.endsWith("#_blank") || /^(mailto|tel):/i.test(href)) return href;
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
    const labelSizes = /* @__PURE__ */ new Set();
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
        else labelSizes.add(size);
      }
    }
    const counted = copySizes.size ? copySizes : sizes;
    if (counted.size !== 1) return null;
    const [copy] = counted;
    if (copy > 1 && [...labelSizes].some((s) => s > copy)) return null;
    return copy;
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
    const bolds = props.font !== "futura" ? chain.filter((e) => e.tagName === "B") : [];
    const b = bolds[0];
    const besideCopy = (x) => squash(x.textContent) !== squash(blockEl.textContent) && (sameLineText(x, "previousSibling") || sameLineText(x, "nextSibling"));
    let code = 0;
    const serifInBold = props.font === "serif" && chain.some((e) => e.classList.contains("futura-bold"));
    if (heading) code = b && /^H[1-3]$/.test(blockEl.tagName) || serifInBold ? 1 : 0;
    else if (font === "serif") code = 1;
    else if (bolds.some(besideCopy)) code = 2;
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
  function keepLeadingBreaks(root) {
    const doc = root.ownerDocument;
    [root, ...root.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, td, th")].forEach((el) => {
      if (!/^(P|LI|H[1-6]|TD|TH)$/.test(el.tagName)) return;
      const breaks = [];
      let n = el.firstChild;
      while (n && (n.nodeName === "BR" || n.nodeType === 3 && !n.nodeValue.trim())) {
        if (n.nodeName === "BR") breaks.push(n);
        n = n.nextSibling;
      }
      if (!breaks.length || !n) return;
      const walker = doc.createTreeWalker(n.nodeType === 3 ? el : n, 4);
      let first = n.nodeType === 3 ? n : walker.nextNode();
      while (first && !first.nodeValue.trim()) first = walker.nextNode();
      const opener = first && first.nodeValue.match(/^\s*\[\[[^\][]+\]/);
      if (!opener) return;
      const link2 = el.querySelector("a");
      if (link2 && !el.closest("td, th") && text(link2) === text(el)) return;
      const rest = first.splitText(opener[0].length);
      rest.before(...breaks);
    });
  }
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
          const scaledHeading = !!run.closest("h2, h3");
          const line = run.closest("p");
          let base = copy;
          if (isHeading) base = scaledHeading ? heading : 1;
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
      keepLeadingBreaks(node);
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
    // the darker grey (#dfe1de, the bg-gray surface; 55 uses on 19 pages, west-point "in the
    // game") — was taken for light grey
    dfe1de: "color-gray",
    b2b4ae: "color-silver",
    af6d04: "color-dark-gold"
  };
  var NEUTRAL = /* @__PURE__ */ new Set(["color-white", "color-light-gray", "color-gray", "color-silver", "color-grey", ""]);
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
    blocks.filter((el) => el.tagName !== "LI" && !/^\[\[blank line\]\]$/i.test(text(el))).forEach((el) => {
      const style = el.getAttribute("style") || "";
      const align = (style.match(/text-align:\s*(center|right)/i) || [])[1];
      const indent = Number((style.match(/margin-left:\s*(\d+)px/i) || [])[1] || 0);
      const tags = [
        align && !(centred && /center/i.test(align)) ? `align-${align.toLowerCase()}` : "",
        indent > 0 ? "indent" : ""
      ].filter(Boolean);
      if (!tags.length) return;
      el.prepend(doc.createTextNode(`[[${tags.join(",")}]`));
      el.append(doc.createTextNode("]"));
    });
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
      const own = span.closest("a");
      (own ? [own] : [...span.querySelectorAll("a[href]")]).forEach((a) => {
        let wrapper = a.parentElement;
        while (wrapper && wrapper !== span && wrapper.tagName === "SPAN" && squash(wrapper.textContent) === squash(a.textContent)) {
          unwrap(wrapper);
          wrapper = a.parentElement;
        }
        standalone.add(a);
      });
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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-section-builder.js
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
  var gridTotalAt = (el, bp) => Number((String(el.className).match(new RegExp(`\\baem-Grid--${bp}--(\\d+)\\b`)) || [])[1]) || gridTotal(el);
  function nestedColumns(col, spec) {
    const grids = [...col.querySelectorAll(".aem-Grid")];
    const inner = grids[0];
    if (!inner || grids.some((g) => g !== inner && !inner.contains(g))) return null;
    const squash3 = (el) => (el.textContent || "").replace(/\s+/g, "");
    if (squash3(col) !== squash3(inner) || col.querySelectorAll("img").length !== inner.querySelectorAll("img").length) return null;
    const cols = [...inner.children].filter((c) => c.getAttribute("data-corp-hidden") !== "true");
    const specs = cols.map(gridSpec);
    if (cols.length < 2 || specs.some((s) => !s)) return null;
    const BPS = { d: "default", t: "tablet", m: "phone" };
    const val = (s, bp, key) => {
      var _a;
      return (_a = s[bp][key]) != null ? _a : s.d[key];
    };
    const totals = Object.fromEntries(Object.entries(BPS).map(([bp, name]) => [bp, gridTotalAt(inner, name)]));
    if (specs.reduce((sum, s) => sum + (s.d.o || 0) + s.d.w, 0) !== totals.d) return null;
    const scale = (n, bp) => n * (val(spec, bp, "w") || 0) / totals[bp];
    const out = cols.map((c, i) => {
      const combined = {};
      Object.keys(BPS).forEach((bp) => {
        var _a;
        const w = scale(val(specs[i], bp, "w") || 0, bp);
        const o = scale(val(specs[i], bp, "o") || 0, bp) + (i === 0 ? val(spec, bp, "o") || 0 : 0);
        combined[bp] = { w, o, beh: (_a = specs[i][bp].beh) != null ? _a : bp === "d" ? null : specs[i].d.beh };
      });
      return { el: c, spec: combined };
    });
    const whole = out.every(({ spec: s }) => Object.values(s).every((v) => Number.isInteger(v.w) && v.w > 0 && (v.o === null || Number.isInteger(v.o))));
    return whole ? out : null;
  }
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
      if (name) {
        try {
          return components[name === "cols*" ? "cols" : name](el, ctx) || [];
        } catch (e) {
          return ctx.unknown(el, `handler failed: ${String(e && e.message).slice(0, 60)}`);
        }
      }
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
        if ((run.length > 1 || run.length && total === 12) && handlers.row) {
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
          const parts = total === 12 ? nestedColumns(child, spec) : null;
          (parts || [{ el: child, spec }]).forEach((part, k) => {
            const room = (part.spec.d.o || 0) + part.spec.d.w;
            const newline = k === 0 && spec.d.beh === "newline";
            if (run.length && (used + room > total || newline)) flush();
            run.push(part);
            used += room;
            if (used >= total) flush();
          });
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
      if (item.role === "blank" && current && current.key) {
        current.nodes.push(...item.nodes);
        return;
      }
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
          case "spacer": {
            close();
            const last = sections[sections.length - 1];
            if (last && last.kind === "spacer") {
              last.slots += item.slots;
              last.lines += item.lines || 0;
            } else {
              const flush = !!last && last.box === null && (!!last.key || last.kind === "accordion");
              sections.push({
                kind: "spacer",
                styles: [],
                id: null,
                nodes: [],
                slots: item.slots,
                lines: item.lines || 0,
                continued: flush
              });
            }
            break;
          }
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
            if ("box" in item) current.box = item.box;
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
      const SPACER_SIZES = ["", "large", "xlarge", "xxlarge"];
      const expanded = sections.flatMap((s) => {
        if (s.kind !== "spacer") return [s];
        const parts = [];
        for (let left = s.slots; left > 0 || !parts.length; left -= 4) {
          const size = left > 0 ? SPACER_SIZES[Math.min(left, 4) - 1] : "no-gap";
          const first = !parts.length;
          const lines = first && s.lines ? `lines-${Math.min(s.lines, 8)}` : "";
          if (first && s.lines > 8) report.notes.push(`${s.lines} blank lines in a row: 8 kept`);
          parts.push(__spreadProps(__spreadValues({}, s), { styles: ["spacer", size, lines, first && s.continued ? "continued" : ""].filter(Boolean) }));
        }
        return parts;
      });
      expanded.filter((s) => s.nodes.length || s.kind === "stripe" || s.kind === "spacer").forEach((section, i) => {
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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-components.js
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
  var squash2 = (value) => String(value || "").split(BLANK_LINE).join(" ").replace(/\s+/g, " ").trim().toLowerCase();
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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/parsers/hero-image-slide.js
  function copyImage(source, document2) {
    const img = document2.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return img;
  }
  function clean(text2) {
    return (text2 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function headline(overlay, document2) {
    const out = [];
    const headings = [...overlay.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const lines = headings.length ? headings : [...overlay.querySelectorAll(".line, p")];
    lines.forEach((line) => {
      if (!clean(line.textContent)) return;
      const el = document2.createElement(/^H[1-6]$/.test(line.tagName) ? line.tagName.toLowerCase() : "p");
      const box = document2.createElement("div");
      box.innerHTML = line.innerHTML;
      box.querySelectorAll("span.futura-bold, b").forEach((span) => {
        const strong = document2.createElement("strong");
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
    document: document2,
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
      const a = document2.createElement("a");
      a.href = path;
      a.textContent = path;
      return a;
    };
    const cells = [];
    if (slide.dataset.xfDesktop) {
      cells.push([fragmentLink(slide.dataset.xfDesktop)]);
      if (slide.dataset.xfMobile) cells.push([fragmentLink(slide.dataset.xfMobile)]);
      else if (mobile) cells.push([copyImage(mobile, document2)]);
    } else {
      cells.push([copyImage(first, document2)]);
      if (desktop && mobile) cells.push([copyImage(mobile, document2)]);
    }
    if (overlay) {
      const lines = overlayNodes || headline(overlay, document2);
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
    element.replaceWith(WebImporter.Blocks.createBlock(document2, {
      name: `Hero Corp (${variants.join(", ")})`,
      cells
    }));
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/parsers/cards-corp-teaser.js
  function clean2(text2) {
    return (text2 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function link(document2, source, text2) {
    const a = document2.createElement("a");
    a.setAttribute("href", source.getAttribute("href"));
    a.textContent = text2;
    return a;
  }
  function imageCell(item, document2) {
    const source = item.querySelector(".img-cont img, img");
    const img = document2.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return [img];
  }
  function textCell(item, document2) {
    const body = [];
    const title = item.querySelector("h3");
    if (title && clean2(title.textContent)) {
      const h3 = document2.createElement("h3");
      const titleLink = title.querySelector("a[href]");
      if (titleLink) h3.append(link(document2, titleLink, clean2(titleLink.textContent)));
      else h3.textContent = clean2(title.textContent);
      if (title.classList.contains("futura-bold") || title.querySelector(".futura-bold")) {
        const strong = document2.createElement("strong");
        strong.append(...h3.childNodes);
        h3.append(strong);
      }
      body.push(h3);
    }
    item.querySelectorAll(".desc-container > p").forEach((source) => {
      if (!clean2(source.textContent)) return;
      const p = document2.createElement("p");
      p.textContent = clean2(source.textContent);
      body.push(p);
    });
    const cta = item.querySelector("a.action-link[href]");
    if (cta && clean2(cta.textContent)) {
      const a = link(document2, cta, "");
      const u = document2.createElement("u");
      u.textContent = clean2(cta.textContent);
      a.append(u);
      const strong = document2.createElement("strong");
      strong.append(a);
      const p = document2.createElement("p");
      p.append(strong);
      body.push(p);
    }
    return body;
  }
  function parse2(element, { document: document2 }) {
    const items = [...element.querySelectorAll(".item")].filter((item) => item.querySelector("img"));
    if (!items.length) return;
    const cells = items.map((item) => [imageCell(item, document2), textCell(item, document2)]);
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Cards Corp (teaser)", cells }));
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/parsers/video.js
  var DM_HOST = "https://media-assets.stryker.com";
  function encodePath(path) {
    return path.split("/").map((part) => encodeURIComponent(part)).join("/");
  }
  function videoLink(element, document2) {
    const a = document2.createElement("a");
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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp-modal-path.js
  var documentName = (name) => String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function procareModalPath(title) {
    const name = documentName(String(title || "").trim().replace(/^ProCare\s+(for\s+)?/i, ""));
    return name ? `/us/en/fragments/modals/procare/${name}` : null;
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/data/dm-sets.js
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

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-component-handlers.js
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
    ["bg-orange", "bg-dark-gold"],
    // gradient boxes (stryker.com .bg-*-gradient on .has-background, e.g. the spinejack "Contact
    // us" banner): the panel gradient styles, `dark` for the teal one (approved 2026-11-05)
    ["bg-golden-gradient", "bg-golden-gradient"],
    ["bg-dark-purple-gradient", "bg-dark-purple-gradient"],
    ["bg-dark-blue-gradient", "bg-dark-blue-gradient"],
    ["bg-dark-orange-gradient", "bg-dark-orange-gradient"],
    ["bg-dark-teal-gradient", "dark"]
  ];
  var isGradient = (style) => /-gradient$|^dark$/.test(style || "");
  var boxOf = (el) => (BOXES.find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
  var boxColour = (el) => (BOXES.slice(1).find(([cls]) => el && el.classList.contains(cls)) || [])[1] || null;
  var heroBox = (overlay) => {
    const box = overlay && overlay.querySelector(".c-largeheadline > .has-background, .c-rich-text-editor > .has-background");
    const colour = boxColour(box);
    return colour && !isGradient(colour) ? `box-${colour.replace(/^bg-/, "")}` : null;
  };
  var boxStyles = (el) => {
    const colour = boxColour(el);
    const shadow = !!(el && el.classList.contains("dimensional-box"));
    const gradient = isGradient(colour);
    return [
      colour || "",
      colour || shadow ? "boxed" : "",
      shadow ? "shadow-box" : "",
      gradient && el.classList.contains("top-to-bottom") ? "gradient-top-to-bottom" : "",
      gradient && el.classList.contains("inverse") ? "gradient-inverse" : ""
    ].filter(Boolean);
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
    const parsed = box && box.style && typeof box.style.getPropertyValue === "function" ? box.style : null;
    return SPACING_PROPS.flatMap((prop) => {
      const value = parsed ? parsed.getPropertyValue(prop) : "";
      const m = value ? value.match(/^(-?\d+(?:\.\d+)?)(%|px)$/) : style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)(%|px)\\s*(?:;|$)`));
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
  var ownColour = (it) => it.type === "flow" && (it.styles || []).includes("boxed") && it.styles[0] !== "boxed" ? it.styles[0] : "";
  function markedNodes(items, nodesOf, doc, { colours = false } = {}) {
    let open = false;
    return items.flatMap((it) => {
      const colour = colours ? ownColour(it) : "";
      const shadow = colour && (it.styles || []).includes("shadow-box") ? ["shadow"] : [];
      const tokens = it.type === "flow" ? [...colour ? [colour] : [], ...shadow, ...it.spacing || []] : [];
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
  var COLUMN_BREAK = "Column break";
  var isBlankParagraph = (p) => !p.closest("li, td, th") && !p.querySelector("img, picture, iframe, video, input, svg") && (p.textContent === BLANK_LINE || !p.textContent.replace(/[\s\u00a0\u200b]/g, ""));
  var blankLines = (doc, n) => Array.from({ length: n }, () => {
    const p = doc.createElement("p");
    p.textContent = BLANK_LINE;
    return p;
  });
  function richTextNodes(source, doc) {
    const box = contentCopy(source, doc);
    wrapInlineRuns(box, doc);
    const blanks = [...box.querySelectorAll("p")].filter(isBlankParagraph);
    blanks.forEach((p) => {
      p.textContent = BLANK_LINE;
    });
    const plainBold = plainBoldParagraphs(box);
    const serifHeads = serifHeadings(box);
    const plainB = (b) => !b.closest(".futura-bold") && !b.querySelector(".futura-bold");
    const inlineBold = new Set([...box.querySelectorAll("p, li, ul, ol")].filter((el) => [...el.querySelectorAll("b")].some(plainB)));
    const headingSizes = new Map([...box.querySelectorAll("h2, h3")].map((h) => [h, headingSizeStyle(h)]).filter(([, s]) => s));
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    blanks.forEach((p) => elementStyles.set(p, null));
    markRuns(box);
    blanks.forEach((p) => {
      p.textContent = BLANK_LINE;
    });
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
  function tagCentredIn(node, doc) {
    [...node.querySelectorAll("p, h1, h2, h3, h4, h5, h6")].forEach((n) => {
      const t = text(n);
      if (!t || t === BLANK_LINE || /^box(:| end)/i.test(t) || /^\[\[(align-|spacing)/.test(n.textContent)) return;
      const only = n.children.length === 1 && n.firstElementChild.tagName === "A" && text(n.firstElementChild) === t && /\/is\/image\/|\.(png|jpe?g)/i.test(n.firstElementChild.getAttribute("href") || "");
      if (only) return;
      n.prepend(doc.createTextNode("[[align-center]"));
      n.append(doc.createTextNode("]"));
    });
  }
  function inlineNodes(items, ctx, { marks = true } = {}) {
    if (marks && items.some((it) => it.type === "flow" && ((it.spacing || []).length || ownColour(it)))) {
      const nodesOf = (it) => inlineNodes([it], ctx, { marks: false });
      return markedNodes(items, nodesOf, ctx.doc, { colours: true });
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
        const styles = (item.styles || []).filter((s) => s !== "center");
        if (item.type === "own" && styles.length !== (item.styles || []).length) {
          item.nodes.forEach((node) => tagCentredIn(node, ctx.doc));
        }
        if (item.type === "own" && styles.length) ctx.report.notes.push(`section style ${styles.join(", ")} of a nested ${item.kind} dropped`);
        out.push(...item.nodes);
      } else if (item.type === "group") out.push(...inlineNodes(item.items, ctx));
      else if (item.type === "anchor") ctx.report.notes.push(`anchor #${item.id} inside a nested section, dropped`);
      else if (item.type === "spacer" && item.lines) out.push(...blankLines(ctx.doc, item.lines));
    });
    flushCounters();
    return out;
  }
  var hasContent = (items) => items.some((it) => it.type !== "spacer" && (it.type !== "flow" || it.nodes.length));
  var SLOT = (lines = 0) => ({ type: "spacer", slots: 1, lines });
  var linesOnly = (it) => it.type === "spacer" && !it.slots && it.lines > 0;
  var asBlankLines = (it, doc) => linesOnly(it) ? {
    type: "flow",
    role: "blank",
    nodes: blankLines(doc, it.lines),
    box: it.box
  } : it;
  var isTitle = (node) => /^H[1-6]$/.test(node.tagName) || node.tagName === "P" && node.querySelector("strong") && text(node.querySelector("strong")) === text(node);
  var isCta = (node) => node.tagName === "P" && node.querySelectorAll("a").length === 1 && text(node.querySelector("a")) === text(node);
  function allCentred(items) {
    const texts = items.filter((it) => it.type === "flow" && it.role === "text");
    return texts.length > 0 && texts.every((it) => it.centred);
  }
  function centreTagged(items, doc) {
    items.filter((it) => it.type === "flow" && it.role === "text" && it.centred).forEach((it) => {
      it.nodes.filter((n) => /^(P|H[1-6])$/.test(n.tagName) && text(n) && text(n) !== BLANK_LINE && !/^\[\[align-/.test(n.textContent)).forEach((n) => {
        n.prepend(doc.createTextNode("[[align-center]"));
        n.append(doc.createTextNode("]"));
      });
      it.centred = false;
    });
  }
  function isCard(items) {
    if (!items.every((it) => it.type === "flow")) return false;
    if (!items.length || items[0].role !== "image") return false;
    const rest = items.slice(1).flatMap((it) => it.nodes);
    return rest.length >= 2 && isTitle(rest[0]) && isCta(rest[rest.length - 1]);
  }
  function cellNodes(items, ctx, { marks = false, colours = false } = {}) {
    if (marks) return markedNodes(items, (it) => cellNodes([it], ctx), ctx.doc, { colours });
    return items.flatMap((it) => {
      if (it.type === "flow") return it.nodes;
      if (it.type === "block" && it.cellNodes) return it.cellNodes;
      if (linesOnly(it)) return blankLines(ctx.doc, it.lines);
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
    const boldRuns = (h) => [...h.children].filter((c) => c.tagName !== "SUP");
    const allBold = (h) => {
      const runs = boldRuns(h);
      const outside = [...h.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
      return runs.length === 1 && runs[0].tagName === "STRONG" && !outside && !h.querySelector("em");
    };
    const serif = heads.some((n) => n.serifHeading) && heads.every((n) => n.serifHeading || allBold(n));
    if (!serif && heads.some((n) => n.serifHeading)) ctx.report.notes.push("serif and Futura h2 / h3 in one block, kept in Futura");
    if (!serif) {
      heads.filter((h) => h.tagName === "H2" && allBold(h)).forEach((h) => unwrap(boldRuns(h)[0]));
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
    9: "3-4",
    10: "5-6"
  };
  var STARTS = __spreadProps(__spreadValues({}, FRACTIONS), { 1: "1-12", 2: "1-6" });
  function columnStyles(widths, index, ctx, starts = null, phone = false) {
    if (!widths || !widths[index]) return [];
    const width = widths[index];
    const start = starts ? starts[index] : widths.slice(0, index).reduce((sum, w) => sum + w, 0);
    if (width >= 12) return [];
    if (!FRACTIONS[width] || start && !STARTS[start]) {
      ctx.report.notes.push(`one filled column of ${width}/12 at ${start}/12: no column style, full width`);
      return [];
    }
    return [`col-${FRACTIONS[width]}`, ...start ? [`col-at-${STARTS[start]}`] : [], ...phone ? ["col-phone"] : []];
  }
  function columnItems(columns, split, ctx, widths = null, starts = null) {
    const { doc } = ctx;
    const anchors = [];
    const withBlanks = columns.map((items) => {
      const kept = items.filter((it) => {
        if (it.type === "anchor") anchors.push(it);
        return it.type !== "anchor" && (it.type !== "spacer" || linesOnly(it));
      });
      return hasContent(kept) ? kept.map((it) => asBlankLines(it, doc)) : kept.filter((it) => it.type !== "spacer");
    });
    const cols = withBlanks.map((items) => items.filter((it) => it.role !== "blank"));
    const filled = cols.filter(hasContent);
    if (!filled.length) return anchors;
    if (filled.length === 1) {
      const at = cols.indexOf(filled[0]);
      const phone = !!(split.phoneKeeps && split.phoneKeeps[at]);
      const styles = columnStyles(widths, at, ctx, starts, phone);
      if (!styles.length) return [...anchors, { type: "boundary" }, ...withBlanks[at], { type: "boundary" }];
      return [...anchors, { type: "group", styles, items: withBlanks[at] }];
    }
    filled.forEach((items, i) => {
      const last2 = items[items.length - 1];
      const header = last2 && last2.type === "block" && last2.block.querySelector("tr > *");
      if (!header || !/^Related Categories$/i.test(text(header))) return;
      const before = items.slice(0, -1).filter((it) => hasContent([it]));
      if (!before.length || !before.every((it) => it.type === "flow" && it.role === "cta")) return;
      const row = ctx.doc.createElement("tr");
      const cell = ctx.doc.createElement("td");
      cell.append(...before.flatMap((it) => it.nodes));
      row.append(cell);
      header.parentElement.after(row);
      last2.styles = [...last2.styles || [], ...before.flatMap((it) => it.styles || [])];
      filled[i] = [last2];
    });
    const all = filled.flat();
    if (filled.every((items) => items.every((it) => it.type === "counter"))) {
      return [...anchors, {
        type: "own",
        kind: "statistics",
        styles: [],
        nodes: [statistics(all, ctx, filled.length)]
      }];
    }
    const buttonColours = (items) => [...new Set(items.flatMap((it) => (it.styles || []).filter((s) => /^btn-/.test(s))))];
    const flex = (styles, items) => {
      const centre2 = allCentred(items);
      if (!centre2) centreTagged(items, doc);
      return {
        type: "own",
        kind: "flex",
        styles: ["flex", ...styles, ...centre2 ? ["center"] : [], ...buttonColours(items)],
        nodes: inlineNodes(items, ctx)
      };
    };
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
      const oneWrapper = (items) => items.every(inCell) || items.filter((it) => hasContent([it])).length === 1;
      if (split.flex && filled.length === 2 && filled.every(oneWrapper)) {
        return [...anchors, flex([split.flex], all)];
      }
      const centreAll = allCentred(all);
      if (!centreAll) centreTagged(all, doc);
      const colNodes = filled.map((items) => inlineNodes(items, ctx));
      const isBlock = (node) => node.tagName === "TABLE";
      const pieces = colNodes.map((nodes) => nodes.filter((node, i) => i === 0 || isBlock(node) || isBlock(nodes[i - 1])).length);
      if (pieces.some((n) => n > 1) && pieces.every((n) => n > 0)) {
        colNodes.slice(1).forEach((nodes, i) => {
          const before = colNodes[i];
          if (!isBlock(nodes[0]) && !isBlock(before[before.length - 1])) {
            const line = ctx.doc.createElement("p");
            line.textContent = COLUMN_BREAK;
            before.push(line);
          }
        });
        const splitWidths = split.flex && filled.length === 2 ? [split.flex] : [];
        return [...anchors, {
          type: "own",
          kind: "flex",
          styles: ["flex", ...splitWidths, `flex-cols-${pieces.join("-")}`, ...centreAll ? ["center"] : [], ...buttonColours(all)],
          nodes: colNodes.flat()
        }];
      }
      return [...anchors, flex([], all)];
    }
    if (split.cards && filled.length >= 2 && filled.every(isCard)) {
      const centre2 = allCentred(filled.flat());
      if (!centre2) centreTagged(filled.flat(), doc);
      const rows = filled.map((items) => [items[0].nodes, items.slice(1).flatMap((it) => it.nodes)]);
      return [...anchors, {
        type: "own",
        kind: "cards",
        styles: centre2 ? ["center"] : [],
        nodes: [block(doc, `Cards Corp (${split.cards})`, rows)]
      }];
    }
    const modifiers = [];
    const cells = cols.map((items, i) => {
      const content = items.filter((it) => it.type === "flow" && it.nodes.length || it.type === "block" && it.cellNodes);
      const spaced = content.filter((it) => (it.spacing || []).length);
      const colours = content.map((it) => (it.styles || []).includes("boxed") && it.styles[0] !== "boxed" ? it.styles[0] : null);
      const cellColour = colours.length && colours[0] && colours.every((c) => c === colours[0]);
      if (cellColour) modifiers.push(`cell-${i + 1}-${colours[0]}`);
      const boxedInside = !cellColour && colours.some(Boolean);
      const borders = content.filter((it) => it.role === "image").map((it) => (it.styles || []).find((st) => st.startsWith("image-border")) || null);
      if (borders.length && borders[0] && borders.every((b) => b === borders[0])) modifiers.push(`cell-${i + 1}-${borders[0]}`);
      const cell = withBlanks[i];
      if (boxedInside) return cellNodes(cell, ctx, { marks: true, colours: true });
      if (!spaced.length) return cellNodes(cell, ctx);
      const same = new Set(spaced.map((it) => it.spacing.join(" "))).size === 1;
      if (same && spaced.length === content.length) {
        modifiers.push(...spaced[0].spacing.map((t) => `cell-${i + 1}-${t}`));
        return cellNodes(cell, ctx);
      }
      return cellNodes(cell, ctx, { marks: true });
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
    const boxes = cols.flatMap((items) => flows(items)).filter((it) => typeof it.box === "string");
    const used = { "bg-gold": "gold-first", "bg-light-gray": "gray-lead", dimensional: "boxed-last" };
    boxes.filter((it) => !modifiers.includes(used[it.box])).forEach((it) => {
      ctx.report.notes.push(`Columns: ${it.box} box not reproduced (no variant for it in that cell): ${text(it.nodes[0] || doc.createElement("p")).slice(0, 40)}`);
    });
    const variants = [split.variant, ...modifiers].filter(Boolean);
    const name = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
    const texts = (items) => flows(items).filter((it) => !["image", "blank"].includes(it.role));
    const withText = cols.filter((items) => texts(items).length);
    const centred = withText.filter((items) => texts(items).every((it) => it.centred));
    const centre = withText.length > 0 && centred.length === withText.length;
    if (!centre) centreTagged(cols.flat(), doc);
    return [...anchors, {
      type: "own",
      kind: "columns",
      styles: [...cellStyles(cells, ctx), ...centre ? ["center"] : []],
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
  var colWidth = (col, size) => Number((col.className.match(new RegExp(`\\bcol-${size}-(\\d+)\\b`)) || [])[1]) || 0;
  function phoneGrid(columns) {
    const desktop = columns.map((col) => colWidth(col, "md") || colWidth(col, "sm"));
    const phone = columns.map((col) => colWidth(col, "xs") || 12);
    if (!desktop.every(Boolean) || desktop.reduce((a, b) => a + b, 0) > 12) return [];
    const usual = columns.length === 4 ? 6 : 12;
    if (phone.every((w) => w === usual)) return [];
    return [`grid-${desktop.join("-")}`, `grid-m-${phone.join("-")}`];
  }
  function columnControl(el, ctx) {
    const split = [...el.classList].find((c) => /^cols\d?/.test(c)) || "cols";
    const row = el.querySelector(":scope > .colctrl > .row") || el.querySelector(".row");
    const columns = row ? [...row.children].filter((c) => /\bcol-/.test(c.className)) : [];
    const items = columns.map((col) => ctx.collect(col));
    const widths = columns.map((col) => colWidth(col, "md") || colWidth(col, "sm"));
    if (!hasContent(items.flat())) {
      const lines = Math.max(0, ...items.map((col) => col.filter(linesOnly).reduce((sum, it) => sum + it.lines, 0)));
      return [...items.flat().filter((it) => it.type === "anchor"), SLOT(lines)];
    }
    if (split === "cols" || columns.length < 2) {
      const all = items.flat();
      if (all.every((it) => ["anchor", "separator", "spacer"].includes(it.type))) {
        const lines = all.filter(linesOnly).reduce((sum, it) => sum + it.lines, 0);
        return [...all.filter((it) => it.type === "anchor"), SLOT(lines), ...all.filter((it) => it.type === "separator")];
      }
      const flat = all.map((it) => asBlankLines(it, ctx.doc));
      return hasContent(flat) ? [{ type: "boundary" }, ...flat, { type: "boundary" }] : flat;
    }
    if (!SPLITS[split]) ctx.report.notes.push(`column control ${split}: no Columns variant, imported as plain Columns`);
    const spec = SPLITS[split] || {};
    const grid = phoneGrid(columns);
    const layout = grid.length ? __spreadProps(__spreadValues({}, spec), { variant: [spec.variant, ...grid].filter(Boolean).join(", "), grid: true }) : spec;
    return columnItems(items, layout, ctx, widths.every(Boolean) ? widths : null);
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
    const keepsPhone = (spec) => spec.m.w === null && spec.m.o === null && !spec.m.beh;
    const grid = {
      variant: gridOptions(specs, total).join(", "),
      grid: true,
      unequal: offsets || new Set(widths).size > 1,
      phoneKeeps: specs.map(keepsPhone)
    };
    return columnItems(columns, grid, ctx, twelfths == null ? void 0 : twelfths.widths, twelfths == null ? void 0 : twelfths.starts);
  }
  function textComponent(el, ctx) {
    const source = el.querySelector(".c-rich-text-editor > div") || el.querySelector(".c-rich-text-editor") || el;
    const { nodes, centred } = richTextNodes(source, ctx.doc);
    if (!nodes.length) return [];
    const box = boxOf(source);
    if (nodes.every((n) => text(n) === BLANK_LINE)) {
      return [{
        type: "spacer",
        slots: 0,
        lines: nodes.length,
        box
      }];
    }
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
    "bor-dark_gray_40T": "image-border-grey",
    // (live #1c5687 and #fff: axs-lift, fortress-wall-system)
    "bor-blue": "image-border-blue",
    "bor-white": "image-border-white"
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
    const images = [...el.querySelectorAll(".cta-img img[src]")].filter((source) => !source.closest("a[href]")).map((source) => {
      const img = doc.createElement("img");
      img.setAttribute("src", source.getAttribute("src"));
      img.setAttribute("alt", source.getAttribute("alt") || "");
      if (!source.getAttribute("alt")) ctx.report.notes.push(`image without alt text: ${source.getAttribute("src")}`);
      return para(doc, img);
    });
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
      const h3 = doc.createElement("h3");
      const strong = doc.createElement("strong");
      strong.textContent = text(d);
      h3.append(strong);
      head.push(h3);
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
      ...images.length ? [{ type: "flow", role: "image", nodes: images }] : [],
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
    const own = boxColour(root);
    const styles = size >= 2 ? [own || "", own ? "boxed" : "", "large-headline"].filter(Boolean) : boxStyles(root);
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
    } else if (title && el.getAttribute("data-corp-hidden") !== "true" && title.getAttribute("data-corp-hidden") !== "true") {
      items.push(SLOT());
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
    const pdiv = el.matches(".pDiv") ? el : el.querySelector(".pDiv");
    if (pdiv && pdiv.classList.contains("container")) variants.push("contained");
    if (el.querySelector(".pDiv.bg-shadow, .imgBoxId.bg-shadow") || el.matches(".pDiv.bg-shadow")) variants.push("shadow");
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
    const banner = el.querySelector(".pDiv");
    const after = !!(title && banner && banner.compareDocumentPosition(title) === 4);
    const hero = fullWidthImage(banner || el, ctx);
    return after ? [...hero, ...items] : [...items, ...hero];
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
      const phoneSlideMissing = !!(ref && ref.mobile && ref.mobile.xf !== (ref.desktop && ref.desktop.xf) && (!ref.mobile.eds || ref.mobile.hosted) && !copyText(".experienceFragment-ef-mobile"));
      if (slide.dataset.xfDesktop && !(overlay && text(overlay)) && copyText(".experienceFragment-ef")) {
        const fragment = (path, styles) => ({
          type: "fragment",
          kind: "fragment",
          styles,
          nodes: [block(doc, "Fragment", [[linkTo(doc, path)]])]
        });
        const carouselStyles = slideStyles();
        const both = !carouselStyles.length && slide.dataset.xfMobile && copyText(".experienceFragment-ef-mobile");
        const unpublishedMobile = !carouselStyles.length && phoneSlideMissing;
        if (both) {
          return [
            fragment(slide.dataset.xfDesktop, [...carouselStyles, "desktop-only"]),
            fragment(slide.dataset.xfMobile, [...carouselStyles, "mobile-only"])
          ];
        }
        return [fragment(slide.dataset.xfDesktop, [...carouselStyles, ...unpublishedMobile ? ["desktop-only"] : []])];
      }
      if (!slide.querySelector("img") && !slide.dataset.xfDesktop) {
        ctx.report.notes.push(`slide without an image (its XF not rendered): overlay copy kept as text: ${text(overlay).slice(0, 40)}`);
        return overlayItems;
      }
      const overlayNodes = overlay ? cellContent(inlineNodes(overlayItems, ctx, { marks: false }), doc) : void 0;
      if (overlayNodes && overlayNodes.some((n) => n.tagName === "H1")) ctx.h1 = true;
      const variants = [];
      const startsRight = (col) => {
        var _a;
        return Number(
          (_a = /aem-GridColumn--offset--default--(\d+)/.exec(col.className)) == null ? void 0 : _a[1]
        ) >= 6;
      };
      if ([...slide.querySelectorAll('.experienceFragment-ef [class*="aem-GridColumn--offset--default--"]')].some(startsRight)) variants.push("image-right");
      if (heroBox(overlay)) variants.push(heroBox(overlay));
      if (phoneSlideMissing && !slideStyles().length) variants.push("no-phone-image");
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
    const flowOnly = panels.every((p) => p.items.every((it) => ["flow", "anchor", "spacer"].includes(it.type)));
    if (flowOnly) {
      const rows = panels.map((p) => [
        para(doc, ...label(p).childNodes),
        p.items.flatMap((it) => linesOnly(it) ? blankLines(doc, it.lines) : it.nodes || [])
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
  function longTextHero(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-longtexthero") || el;
    const cell = [];
    const title = root.querySelector("h1");
    if (title && text(title)) {
      const h1 = doc.createElement("h1");
      h1.textContent = text(title);
      cell.push(h1);
      ctx.h1 = true;
    }
    const subtitle = root.querySelector("h2");
    if (subtitle && text(subtitle)) {
      const h2 = doc.createElement("h2");
      h2.textContent = text(subtitle);
      cell.push(h2);
    }
    const description = root.querySelector(".description");
    if (description && text(description)) {
      const p = doc.createElement("p");
      p.textContent = `[[1.5\xD7,Serif]${text(description)}]`;
      cell.push(p);
    }
    const copy = root.querySelector(".longtext");
    if (copy) cell.push(...richTextNodes(copy, doc).nodes.filter((node) => text(node)));
    if (!cell.length) return [];
    const cells = [cell];
    const img = root.querySelector("img");
    if (img) {
      const image = doc.createElement("img");
      image.setAttribute("src", img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
      if (!img.getAttribute("alt")) ctx.report.notes.push(`long-text hero image without alt text: ${img.getAttribute("src")}`);
      cells.push([para(doc, image)]);
    }
    const variants = ["columns-50-50", "page-intro", ...img && img.closest(".hidden-xs") ? ["grid-6-6", "grid-m-12-h"] : []];
    return [{
      type: "own",
      kind: "page-intro",
      styles: [],
      nodes: [block(doc, `Columns (${variants.join(", ")})`, [cells])]
    }];
  }
  function table(el, ctx, extra = []) {
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
    const caption = [...el.querySelectorAll(".title-container h2, .title-container h3, .table-title, h2.component-subheading, h3.component-subheading")].find((h) => !h.closest("table"));
    if (caption && text(caption)) {
      const h = doc.createElement("h3");
      h.textContent = text(caption);
      out.push({ type: "flow", role: "text", nodes: [h] });
    }
    const striped = el.matches(".c-table") || !!el.querySelector(".c-table") || !!el.closest(".c-table");
    const variants = [.../* @__PURE__ */ new Set([...header ? [] : ["no-header"], ...extra, ...striped ? ["striped"] : []])];
    out.push({ type: "block", block: block(doc, variants.length ? `Table (${variants.join(", ")})` : "Table", rows) });
    return out;
  }
  function patentTables(el, ctx) {
    el.querySelectorAll(".cell-mobile-title").forEach((n) => n.remove());
    return table(el, ctx, ["striped"]);
  }
  function curatedLinkList(el, ctx) {
    const { doc } = ctx;
    const links = [...el.querySelectorAll("li a[href]")].filter((a) => text(a));
    if (!links.length) return [];
    const cell = links.map((a) => para(doc, linkTo(doc, a.getAttribute("href"), text(a))));
    links.filter((a) => /author-[^/]*adobecqms\.net/.test(a.getAttribute("href"))).forEach((a) => ctx.report.notes.push(`curated link list: link to the AEM author kept as on live: ${text(a)}`));
    return [{ type: "block", block: block(doc, "Columns (related-links)", [[cell]]) }];
  }
  var pageTitle = (doc) => text(doc.querySelector("title") || doc.createElement("p")).replace(/\s*\|\s*Stryker\s*$/i, "");
  function adobeSignForm(el, ctx) {
    const { doc } = ctx;
    const frame = el.querySelector('iframe[src*="esignWidget"]');
    if (!frame) return [];
    const wid = new URL(frame.getAttribute("src"), SOURCE).searchParams.get("wid");
    if (!wid) return [];
    const height = ((frame.getAttribute("style") || "").match(/min-height:\s*(\d+)px/) || [])[1];
    const query = new URLSearchParams(__spreadValues({ wid }, height ? { height } : {})).toString();
    return [{
      type: "own",
      kind: "widget",
      styles: [],
      nodes: [para(doc, linkTo(doc, `/widgets/adobe-sign?${query}`, pageTitle(doc) || "Adobe Sign form"))]
    }];
  }
  var CVENT_NAMES = { "01eecf27-dc87-4879-b868-6acf7d84ac51": "Med Ed Events Calendar - External US" };
  function cventCalendar(el, ctx) {
    const { doc } = ctx;
    const box = el.querySelector("[data-widget-id][data-calendar-id]");
    if (!box) return [];
    const calendarId = box.getAttribute("data-calendar-id");
    const query = new URLSearchParams({ "widget-id": box.getAttribute("data-widget-id"), "calendar-id": calendarId }).toString();
    return [{
      type: "own",
      kind: "widget",
      styles: [],
      nodes: [para(doc, linkTo(doc, `/widgets/cvent?${query}`, CVENT_NAMES[calendarId] || pageTitle(doc) || "Events calendar"))]
    }];
  }
  function newsList(el, ctx) {
    const { doc } = ctx;
    const root = el.matches('[data-widget="stryker-news"]') ? el : el.querySelector('[data-widget="stryker-news"]');
    if (!root) return [];
    const out = [];
    const title = root.querySelector(".title-container h2, .title-container h3");
    if (title && text(title)) {
      const h = doc.createElement("h2");
      h.textContent = text(title);
      out.push({ type: "flow", role: "text", nodes: [h] });
    }
    const filterTabs = [...root.querySelectorAll(".stryker-tabs span.tab-link[data-tags]")].filter((s) => s.getAttribute("data-tags") !== "show-all-news" && text(s)).map((s) => `${text(s)} (${s.getAttribute("data-tags").trim().replace(/^\/etc\/tags\/([^/]+)\//, "$1:")})`);
    const filters = doc.createElement("div");
    if (filterTabs.length) {
      const ul = doc.createElement("ul");
      filterTabs.forEach((t) => {
        const li = doc.createElement("li");
        li.textContent = t;
        ul.append(li);
      });
      filters.append(ul);
    } else filters.textContent = "none";
    const path = WebImporter.FileUtils.sanitizePath(new URL(ctx.source, SOURCE).pathname.replace(/\.html?$/, "")).replace(/\/index$/, "");
    const dated = [...root.querySelectorAll(".news h5")].some((h) => text(h));
    out.push({
      type: "block",
      block: block(doc, "News List Corp", [
        ["Path", path],
        ["Filters", filters],
        ["Page size", root.getAttribute("data-list-size") || "20"],
        ["Show dates", dated ? "true" : "false"]
      ])
    });
    return out;
  }
  function legacyImage(el, ctx) {
    const img = el.querySelector("img[src]");
    if (img && !img.getAttribute("alt")) ctx.report.notes.push(`image without alt text: ${img.getAttribute("src")}`);
    return fallback(el, ctx);
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
    const more = root.querySelector(".c-latestnews-btn a[href]");
    if (more && text(more)) out.push({ type: "flow", role: "cta", nodes: [buttonNode(doc, more, text(more))] });
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
      ["Labels", value("dataLabelDisplay") === "false" ? "false" : "true"],
      // the authored chart height (chartHeight, 0 = the default; surpass-evolve 300 / 400px)
      ["Height", Number(value("chartHeight")) > 0 ? value("chartHeight") : ""]
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
  function filteredGrid(el, ctx) {
    const { doc } = ctx;
    const grid = el.matches(".c-filtered-content-type-grid") ? el : el.querySelector(".c-filtered-content-type-grid") || el;
    const items = [...grid.querySelectorAll(".product-item")].filter((item) => text(item));
    if (!items.length) return [];
    const out = [];
    const title = grid.querySelector(".c-section-title");
    if (title && text(title)) {
      out.push(...sectionTitle(title.parentElement, ctx).filter((it) => it.type === "flow"));
    }
    const rows = items.map((item) => {
      const link2 = item.querySelector("a[href]");
      const href = link2 ? link2.getAttribute("href") : "";
      const heading = item.querySelector("h4, .component-subheading");
      const label = text(heading || link2 || item);
      const h4 = doc.createElement("h4");
      h4.append(href ? linkTo(doc, href, label) : doc.createTextNode(label));
      const img = item.querySelector("img");
      if (!img || !img.getAttribute("src")) return ["", [h4]];
      const image = doc.createElement("img");
      image.setAttribute("src", img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
      if (!img.getAttribute("alt")) ctx.report.notes.push(`product tile image without alt text: ${img.getAttribute("src")}`);
      return [para(doc, image), [h4]];
    });
    out.push({ type: "block", block: block(doc, "Cards Corp (product-item, five-up)", rows) });
    return out;
  }
  function productTileRow(item, ctx, bold = false) {
    const { doc } = ctx;
    const link2 = item.querySelector("a[href]");
    const href = link2 ? link2.getAttribute("href") : "";
    const heading = item.querySelector("h4, .component-subheading");
    const label = text(heading || link2 || item);
    const h4 = doc.createElement("h4");
    const title = href ? linkTo(doc, href, label) : doc.createTextNode(label);
    if (bold) {
      const strong = doc.createElement("strong");
      strong.append(title);
      h4.append(strong);
    } else h4.append(title);
    const img = item.querySelector("img");
    if (!img || !img.getAttribute("src")) return ["", [h4]];
    const image = doc.createElement("img");
    image.setAttribute("src", img.getAttribute("src"));
    image.setAttribute("alt", img.getAttribute("alt") || "");
    if (!img.getAttribute("alt")) ctx.report.notes.push(`product tile image without alt text: ${img.getAttribute("src")}`);
    return [para(doc, image), [h4]];
  }
  function productGroups(el, ctx) {
    const { doc } = ctx;
    const root = el.matches(".c-productgroups") ? el : el.querySelector(".c-productgroups") || el;
    const groups = [...root.querySelectorAll(".clearfix")].filter((g) => g.querySelector("a[href]"));
    if (!groups.length) return [];
    const out = [];
    const title = root.querySelector("h2");
    if (title && text(title)) out.push({ type: "flow", role: "text", nodes: [componentTitle(title, doc)] });
    groups.forEach((group) => {
      const sub = group.querySelector("h3");
      if (sub && text(sub)) {
        const h3 = doc.createElement("h3");
        const u = doc.createElement("u");
        u.textContent = text(sub);
        h3.append(u);
        out.push({ type: "flow", role: "text", nodes: [h3] });
      }
      const items = [...group.querySelectorAll(".filtered, .product-item")].filter((item) => text(item));
      if (items.length) {
        const rows = items.map((item) => productTileRow(item, ctx, true));
        out.push({ type: "block", block: block(doc, "Cards Corp (product-item)", rows) });
      }
    });
    return out;
  }
  function tagline(el, ctx) {
    const { doc } = ctx;
    const title = el.querySelector(".c-tagline-title");
    const message = el.querySelector(".c-tagline-message");
    const has = (node) => !!node && !!text(node);
    if (!has(title) && !has(message)) return [];
    const nodes = [];
    const black = !!el.querySelector(".m-banner-simple.text-black");
    const colour = black ? ",color-black" : "";
    if (has(title)) {
      const h1 = doc.createElement("h1");
      const strong = doc.createElement("strong");
      strong.textContent = text(title);
      h1.append(doc.createTextNode(`[[size-0-75em${colour}]`), strong, doc.createTextNode("]"));
      nodes.push(h1);
      ctx.h1 = true;
    }
    if (has(message)) {
      const h2 = doc.createElement("h2");
      h2.textContent = `[[size-4vw${colour}]${text(message)}]`;
      nodes.push(h2);
    }
    const banner = el.querySelector(".m-banner-simple");
    const bg = banner && [...banner.classList].find((c) => /^bg-/.test(c));
    return [{
      type: "own",
      kind: "tagline",
      styles: [...bg ? [bg] : [], ...has(message) ? ["h-serif"] : []],
      nodes
    }];
  }
  function productListing(el, ctx) {
    const { doc } = ctx;
    const products = [...el.querySelectorAll(".product")].filter((p) => text(p) || p.querySelector("img"));
    if (!products.length) return [];
    const rows = products.map((product) => {
      const [first, second] = product.querySelectorAll(":scope > .cell");
      const img = (first || product).querySelector("img");
      const media = [];
      if (img && img.getAttribute("src")) {
        const image = doc.createElement("img");
        image.setAttribute("src", img.getAttribute("src"));
        image.setAttribute("alt", img.getAttribute("alt") || "");
        media.push(para(doc, image));
      }
      const body = [];
      const heading = (second || product).querySelector("h2, h3");
      const link2 = heading && heading.querySelector("a[href]");
      if (heading && text(heading)) {
        const h2 = doc.createElement("h2");
        h2.append(link2 ? linkTo(doc, link2.getAttribute("href"), text(heading)) : doc.createTextNode(text(heading)));
        body.push(h2);
      }
      const description = (second || product).querySelector(".description");
      if (description && text(description)) {
        body.push(para(doc, doc.createTextNode(text(description))));
      }
      return [media, body];
    });
    return [{ type: "block", block: block(doc, "Columns (columns-50-50)", rows) }];
  }
  function eventDetail(el, ctx) {
    const { doc } = ctx;
    const left = [];
    const title = el.querySelector("h2");
    if (title && text(title)) {
      const h2 = doc.createElement("h2");
      h2.textContent = text(title);
      left.push(h2);
    }
    const blank2 = (node) => !text(node).replace(/\u00a0/g, "").trim();
    el.querySelectorAll(".event-datetime-wrap, .event-location-wrap, .event-contact-wrap, .event-details-wrap, .event-registration-wrap").forEach((wrap2) => {
      [...wrap2.children].forEach((node) => {
        if (node.closest('[data-corp-hidden="true"]')) return;
        if (/^H[1-6]$/.test(node.tagName)) {
          if (!text(node)) return;
          const h5 = doc.createElement("h5");
          if (node.classList.contains("border-bottom-gold")) {
            const u = doc.createElement("u");
            u.textContent = text(node);
            h5.append(u);
          } else h5.textContent = text(node);
          left.push(h5);
          return;
        }
        const btns = [...node.querySelectorAll("a.btn[href]")].filter((a) => !/^(#|\/bin\/)/.test(a.getAttribute("href")) && !a.closest('[data-corp-hidden="true"]'));
        if (node.querySelector("a.btn[href]") && !btns.length) return;
        if (btns.length) {
          btns.forEach((a) => {
            const strong = doc.createElement("strong");
            strong.append(linkTo(doc, newTabHref(a, a.getAttribute("href")), text(a)));
            left.push(para(doc, strong));
          });
          return;
        }
        if (node.tagName !== "P" || blank2(node)) return;
        const p = doc.createElement("p");
        p.append(...contentCopy(node, doc).childNodes);
        left.push(p);
      });
    });
    if (!left.length) return [];
    const side = [];
    el.querySelectorAll(".event-sidebar h1, .event-sidebar h2, .event-sidebar h3, .event-sidebar h4, .event-sidebar h5, .event-sidebar a[href]").forEach((node) => {
      if (!text(node) || node.closest('.map, [data-corp-hidden="true"]')) return;
      if (node.tagName === "A") {
        side.push(para(doc, linkTo(doc, newTabHref(node, node.getAttribute("href")), text(node))));
        return;
      }
      const h5 = doc.createElement("h5");
      h5.textContent = text(node);
      side.push(h5);
    });
    const cells = [left];
    const map = el.querySelector(".map[data-address]");
    const address = map ? map.getAttribute("data-address").replace(/&nbsp;|\u00a0/g, " ").split(",").map((s) => s.trim()).filter((s) => s && !/^(n\/a|online|virtual( event)?)$/i.test(s)).join(", ") : "";
    const wrap = el.querySelector(".event-disclaimer-wrap");
    const disclaimer = wrap && text(wrap) ? [{ type: "group", styles: ["disclaimer", "bold-body"], items: textComponent(wrap, ctx) }] : [];
    if (!address.includes(",")) return [{ type: "flow", role: "text", nodes: [...left, ...side] }, ...disclaimer];
    const href = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    cells.push([para(doc, linkTo(doc, href, address)), ...side]);
    return [{ type: "block", block: block(doc, "Columns (columns-67-33)", [cells]) }, ...disclaimer];
  }
  function backgroundImage(el) {
    const m = (el && el.getAttribute("style") || "").match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
    if (!m) return "";
    return m[2].replace(/\\([0-9a-f]{1,6})\s?/gi, (s, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, "$1").trim();
  }
  function highLevelCta(el, ctx) {
    const { doc } = ctx;
    const tiles = [...el.querySelectorAll(".c-high-level-cta-container")].filter((t) => text(t));
    if (!tiles.length) return [];
    const rows = tiles.map((tile) => {
      const label = tile.querySelector(".c-high-level-cta-label") || tile.querySelector("a[href]");
      const href = label && label.getAttribute("href");
      const name = text(label || tile);
      const body = para(doc, href ? linkTo(doc, href, name) : doc.createTextNode(name));
      const src = backgroundImage(tile.querySelector(".c-high-level-cta-link"));
      if (!src) return ["", [body]];
      const image = doc.createElement("img");
      image.setAttribute("src", src);
      image.setAttribute("alt", "");
      return [para(doc, image), [body]];
    });
    return [{ type: "block", block: block(doc, "Cards Corp (category)", rows) }];
  }
  function contactUs(el, ctx) {
    const { doc } = ctx;
    const root = el.matches(".c-contactus") ? el : el.querySelector(".c-contactus") || el;
    const info = root.querySelector(".info") || root;
    const details = [];
    let lines = null;
    let labelGroup = null;
    const flush = () => {
      if (lines && text(lines)) details.push(lines);
      lines = null;
      labelGroup = null;
    };
    const lineNodes = (line) => {
      const link2 = line.querySelector("a[href]");
      if (!(link2 && text(line) === text(link2))) return [...contentCopy(line, doc).childNodes];
      const href = link2.getAttribute("href");
      const tel = href.match(/^tel:(.*)$/i);
      const linkText = link2.classList.contains("tel") ? `[[color-black]${text(link2)}]` : text(link2);
      return [linkTo(doc, tel ? `tel:${decodeURIComponent(tel[1]).replace(/[^\d+]/g, "")}` : href, linkText)];
    };
    info.querySelectorAll("h3.component-subheading, .contact-label, .contact-group p").forEach((node) => {
      if (!text(node)) return;
      if (node.tagName === "H3") {
        flush();
        const h3 = doc.createElement("h3");
        const strong = doc.createElement("strong");
        strong.textContent = text(node);
        h3.append(strong);
        details.push(h3);
        return;
      }
      if (node.matches(".contact-label")) {
        flush();
        const h4 = doc.createElement("h4");
        h4.textContent = text(node);
        details.push(h4);
        lines = doc.createElement("p");
        labelGroup = node.closest(".contact-group");
        return;
      }
      if (lines && node.closest(".contact-group") === labelGroup) {
        if (lines.childNodes.length) lines.append(doc.createElement("br"));
        lines.append(...lineNodes(node));
        return;
      }
      flush();
      details.push(para(doc, ...lineNodes(node)));
    });
    flush();
    if (!details.length) return [];
    const out = [];
    const title = root.querySelector("h2");
    if (title && text(title)) out.push({ type: "flow", role: "text", nodes: [componentTitle(title, doc)] });
    const map = root.querySelector(".map[data-address]");
    const address = map ? map.getAttribute("data-address").replace(/<br\s*\/?>/gi, ", ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim().replace(/,$/, "") : "";
    const cells = [details];
    if (address) {
      const href = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
      cells.push([para(doc, linkTo(doc, href, address))]);
    }
    const nodes = [...out.flatMap((it) => it.nodes), block(doc, "Columns (columns-50-50, contact)", [cells])];
    return [{
      type: "own",
      kind: "contact",
      styles: [],
      nodes
    }];
  }
  function groupList(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-grouplist") || el;
    const linkList = (scope) => {
      const links = [...scope.querySelectorAll("li a[href]")].filter((a) => text(a));
      if (!links.length) return null;
      const ul = doc.createElement("ul");
      links.forEach((a) => {
        const li = doc.createElement("li");
        li.append(linkTo(doc, a.getAttribute("href"), text(a)));
        ul.append(li);
      });
      return ul;
    };
    const lists = [...root.querySelectorAll(".list-container")];
    const split = lists.length === 1 && !lists[0].querySelector("h3") && lists[0].querySelectorAll("ul").length > 1;
    const out = [];
    const title = root.querySelector(":scope > h2");
    if (title && text(title)) out.push({ type: "flow", role: "text", nodes: [componentTitle(title, doc)] });
    if (split) {
      const cells2 = [...lists[0].querySelectorAll("ul")].map(linkList).filter(Boolean).map((ul) => [ul]);
      if (!cells2.length) return [];
      out.push({ type: "block", block: block(doc, "Columns (link-groups)", [cells2]) });
      return out;
    }
    const cells = lists.map((list) => {
      const nodes = [];
      const h = list.querySelector("h3");
      if (h && text(h)) {
        const h3 = doc.createElement("h3");
        h3.textContent = text(h);
        nodes.push(h3);
      }
      const ul = linkList(list);
      if (ul) nodes.push(ul);
      return nodes;
    }).filter((nodes) => nodes.length);
    if (!cells.length) return [];
    const rows = [];
    for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));
    if (rows[rows.length - 1].length < 2) rows[rows.length - 1].push("");
    out.push({ type: "block", block: block(doc, "Columns (columns-50-50, link-groups)", rows) });
    return out;
  }
  function testimonial(el, ctx) {
    const { doc } = ctx;
    const heading = el.querySelector(".testimonial-heading");
    const message = el.querySelector(".banner-message");
    if (!(heading && text(heading)) && !(message && text(message))) return [];
    const tagged = (tag, tokens, from) => {
      const node = doc.createElement(tag);
      node.append(doc.createTextNode(`[[${tokens}]`), ...contentCopy(from, doc).childNodes, doc.createTextNode("]"));
      node.normalize();
      return node;
    };
    const nodes = [];
    if (heading && text(heading)) nodes.push(tagged("h2", "size-1-14em", heading));
    if (message && text(message)) nodes.push(tagged("p", "serif,size-4vw", message));
    const out = [{ type: "flow", role: "text", nodes }];
    const cta = el.querySelector(".btn-container a.btn[href]");
    if (cta && text(cta)) out.push({ type: "flow", role: "cta", nodes: [buttonNode(doc, cta, text(cta))] });
    return out;
  }
  var SHARE_ICONS = {
    facebook: "facebook",
    linkedin: "linkedin",
    email: "email",
    "copy-url": "copy-link"
  };
  function socialSharing(el, ctx) {
    const root = el.querySelector(".c-socialsharing") || el;
    const icons = [...root.querySelectorAll("[data-platform]")].map((a) => SHARE_ICONS[a.getAttribute("data-platform")]).filter(Boolean);
    if (!icons.length) return [];
    const variants = [
      ...root.classList.contains("syk-social-share-g") ? ["gray"] : [],
      ...root.classList.contains("syk-social-share-ra") ? ["right"] : []
    ];
    const name = variants.length ? `Social Share Corp (${variants.join(", ")})` : "Social Share Corp";
    return [{ type: "block", block: block(ctx.doc, name, [...new Set(icons)].map((i) => [`:${i}:`])) }];
  }
  var emptySlot = (el, ctx) => text(el) || el.querySelector("img, iframe, video") ? ctx.unknown(el) : [];
  var EVENT_CALENDAR_PATHS = {
    "/us/en/sports-medicine/calendar": "/us/en/global-events/sports-medicine",
    "/us/en/training-and-education/training-and-education-calendar": "/us/en/global-events"
  };
  function eventCalendar(el, ctx) {
    const { doc } = ctx;
    const root = el.querySelector(".c-event") || el;
    if (!root.querySelector("#eventCalendarWrap")) return emptySlot(el, ctx);
    const page = new URL(ctx.source, SOURCE).pathname.replace(/\.html?$/, "");
    const path = WebImporter.FileUtils.sanitizePath(EVENT_CALENDAR_PATHS[page] || page).replace(/\/index$/, "");
    const title = root.querySelector(".title-container h2");
    const rows = [["Path", path]];
    if (title && text(title)) rows.push(["Title", text(title)]);
    return [{ type: "block", block: block(doc, "Event Calendar Corp", rows) }];
  }
  function corporateContactUs(el, ctx) {
    const { doc } = ctx;
    const form = el.querySelector("form");
    if (!form) return [];
    const nodes = [];
    const title = form.querySelector("h2");
    if (title && text(title)) nodes.push(componentTitle(title, doc));
    form.querySelectorAll("h4, h3").forEach((h) => {
      if (!text(h)) return;
      const copy = doc.createElement(h.tagName.toLowerCase());
      copy.textContent = text(h);
      nodes.push(copy);
    });
    ctx.report.notes.push("corporate contact form left out: needs its Marketo form ID");
    return nodes.length ? [{ type: "flow", role: "text", nodes }] : [];
  }
  function pieChart(el, ctx) {
    const value = (cls) => (el.querySelector(`input.${cls}`) || { value: "" }).value.trim();
    const slices = [...el.querySelectorAll("select.chartData option")].map((option) => {
      const [label, , colour] = text(option).split(/\s*\+\s*/);
      return { label: (label || "").trim(), value: option.getAttribute("value"), colour: (colour || "").trim() };
    }).filter((s) => s.label && s.value !== null);
    if (!slices.length) return [];
    const rows = [
      ["Labels", value("dataLabel") && value("dataLabel") !== "none" ? "true" : "false"],
      ["Height", Number(value("chartHeight")) > 0 ? value("chartHeight") : ""]
    ].filter(([, v]) => v);
    slices.forEach((s) => rows.push([s.label, s.value, s.colour]));
    return [{
      type: "own",
      kind: "chart",
      styles: [],
      nodes: [block(ctx.doc, "Chart Corp (pie)", rows)]
    }];
  }
  function searchPage(el, ctx) {
    const { doc } = ctx;
    const header = el.querySelector(".search-header");
    if (!header) return [];
    const nodes = [];
    const h1 = header.querySelector("h1");
    if (h1 && text(h1)) {
      const h = doc.createElement("h1");
      h.textContent = text(h1);
      nodes.push(h);
      ctx.h1 = true;
    }
    const h2 = header.querySelector("h2");
    if (h2 && text(h2)) {
      const h = doc.createElement("h2");
      h.textContent = text(h2);
      nodes.push(h);
    }
    const input = header.querySelector("input.search-control");
    nodes.push(block(doc, "Search", [[input && input.getAttribute("placeholder") || "Search this site"]]));
    const message = [...header.children].find((c) => c.tagName === "DIV" && c.querySelector("ul"));
    if (message) {
      [...message.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => nodes.push(para(doc, doc.createTextNode(n.textContent.trim()))));
      const ul = doc.createElement("ul");
      message.querySelectorAll("li").forEach((li) => {
        const item = doc.createElement("li");
        item.textContent = text(li).replace(/^•\s*/, "");
        ul.append(item);
      });
      nodes.push(ul);
    }
    return [
      { type: "spacer", slots: 1 },
      {
        type: "own",
        kind: "search",
        styles: [],
        nodes
      },
      { type: "spacer", slots: 1 }
    ];
  }
  function geolocation(el, ctx) {
    const a = el.querySelector("a.btn[href]");
    return a && text(a) ? [{ type: "flow", role: "cta", nodes: [buttonNode(ctx.doc, a, text(a))] }] : [];
  }
  function siteMap(el, ctx) {
    if (!el.querySelector("a[href]")) return [];
    return [{ type: "block", block: block(ctx.doc, "Sitemap Corp", [["Path", "/us/en"]]) }];
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
    longtexthero: longTextHero,
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
    "c-back-button": skip,
    // specialty, capability, portfolio and news-landing template slots: the page hero (the same
    // markup as the product page hero) and the filtered product grid
    "c-page-hero": pageHero,
    "c-filtered-content-type-grid": filteredGrid,
    filteredcontenttypegrid: filteredGrid,
    "c-high-level-cta": highLevelCta,
    // base, tier2 landing and contact-division pages: the contact details with their map
    "c-contactus": contactUs,
    // the event-detail template's event
    "c-event-detail-component": eventDetail,
    // procedure and package pages: related products in groups
    "c-productgroups": productGroups,
    "c-productlisting": productListing,
    // the title strip of package, portfolio and tier-1 pages
    "c-tagline": tagline,
    // base pages: patent tables, link lists, the Adobe Sign forms, the Cvent calendar, the news
    // lists (and news-landing pages), the legacy image component
    patenttables: patentTables,
    "c-patenttables": patentTables,
    curatedlinklist: curatedLinkList,
    "c-curated-link-list": curatedLinkList,
    adobesignwebform: adobeSignForm,
    "c-adobesignwebform-content": adobeSignForm,
    cventcomponent: cventCalendar,
    "c-cventComponent": cventCalendar,
    newsandannouncements: newsList,
    "c-newsandannouncements": newsList,
    image: legacyImage,
    // round 7: components seen without their AEM wrapper (or a _v1 one), group lists,
    // testimonials, the featured content item (component-map: skip) and empty template slots
    "c-resourcesanddownload": resources,
    resourcesanddownload_v1: resources,
    grouplist: groupList,
    "c-grouplist": groupList,
    testimonial,
    "c-testimonial": testimonial,
    featuredcontentitem: skip,
    "c-featured-content-item": skip,
    "c-title": (el, ctx) => text(el) ? titleComponent(el, ctx) : [],
    "c-tabs": (el, ctx) => el.querySelector(".tabs-nav .tab-link") ? tabs(el, ctx) : emptySlot(el, ctx),
    "c-banner-campaign": (el, ctx) => el.querySelector("img") ? bannerCampaign(el, ctx) : emptySlot(el, ctx),
    eventcalendar: eventCalendar,
    "c-event": eventCalendar,
    corporatecontactus: corporateContactUs,
    "c-corporate-contact-us": corporateContactUs,
    geolocation,
    "c-geolocation": geolocation,
    "c-ourcompany": emptySlot,
    "c-carousel-item": emptySlot,
    pieChart,
    "search-page": searchPage,
    sitemap: siteMap,
    "c-map": siteMap,
    socialsharing: socialSharing,
    "c-socialsharing": socialSharing,
    featuredcontentcontext: emptySlot,
    "c-feature-content-context": emptySlot
  };
  var CORP_HANDLERS = { components: COMPONENTS, row: gridRow, fallback };

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/corp-page.js
  function rewriteCorpLinks(element) {
    element.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (href.startsWith("/widgets/")) return;
      a.setAttribute("href", corpLinkHref(href));
    });
  }

  // ../../../../tmp/run-outputs/lib-wt/scripts/span-tags.js
  var toClassName = (name) => typeof name === "string" ? name.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") : "";
  var INLINE_TAGS = /* @__PURE__ */ new Set(["A", "B", "BR", "DEL", "EM", "I", "S", "SPAN", "STRONG", "SUB", "SUP", "U"]);
  var SPAN_TAG_RE = /\[\[([^\][]+)\]((?:[^\][]|\[[^\][]*\])*)\]/g;
  var OPEN_TAG_RE = /\[\[([^\][]+)\]/g;
  var LITERAL_RE = /\[[^\][]*\]/g;
  var blank = (m) => " ".repeat(m.length);
  function parseClasses(raw) {
    const names = raw.split(",").map((name) => name.trim());
    if (names.some((name) => !/^[\w-]+$/.test(name))) return [];
    return names.map((name) => toClassName(name));
  }
  function createSpan(classes, ...content) {
    const span = document.createElement("span");
    span.className = classes.join(" ");
    span.append(...content);
    return span;
  }
  function getContainer(node) {
    let el = node.parentElement;
    while (INLINE_TAGS.has(el.tagName) && el.parentElement) el = el.parentElement;
    return el;
  }
  function getTextNodes(container) {
    const nodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (getContainer(walker.currentNode) === container) nodes.push(walker.currentNode);
    }
    return nodes;
  }
  function replaceInTextNode(node) {
    const text2 = node.nodeValue;
    const parts = [];
    let last = 0;
    [...text2.matchAll(SPAN_TAG_RE)].forEach((match) => {
      const [full, raw, content] = match;
      const classes = parseClasses(raw);
      if (!classes.length) return;
      parts.push(text2.slice(last, match.index), createSpan(classes, content));
      last = match.index + full.length;
    });
    if (!last) return;
    parts.push(text2.slice(last));
    node.replaceWith(...parts.filter((part) => part !== ""));
  }
  function removeIfEmpty(node, container) {
    var _a;
    let current = node;
    while (current !== container && !current.textContent && !((_a = current.querySelector) == null ? void 0 : _a.call(current, "br, img"))) {
      const parent = current.parentNode;
      current.remove();
      current = parent;
    }
  }
  function wrapMultiNodeTag(container) {
    const nodes = getTextNodes(container);
    return nodes.some((openNode, i) => {
      const text2 = openNode.nodeValue;
      const closeAt = (value) => value.replace(OPEN_TAG_RE, blank).replace(LITERAL_RE, blank).indexOf("]");
      const open = [...text2.matchAll(OPEN_TAG_RE)].pop();
      if (!open || closeAt(text2.slice(open.index + open[0].length)) >= 0) return false;
      const classes = parseClasses(open[1]);
      const closeIndex = nodes.findIndex((node, j) => j > i && closeAt(node.nodeValue) >= 0);
      const closeNode = nodes[closeIndex];
      if (!classes.length || !closeNode) return false;
      const opens = (value) => [...value.matchAll(OPEN_TAG_RE)].length > 0;
      const before = closeNode.nodeValue.slice(0, closeAt(closeNode.nodeValue));
      if (nodes.slice(i + 1, closeIndex).some((node) => opens(node.nodeValue)) || opens(before)) {
        return false;
      }
      const range = document.createRange();
      range.setStart(openNode, open.index + open[0].length);
      range.setEnd(closeNode, closeAt(closeNode.nodeValue));
      const span = createSpan(classes, range.extractContents());
      range.insertNode(span);
      openNode.nodeValue = text2.slice(0, open.index);
      closeNode.nodeValue = closeNode.nodeValue.slice(1);
      removeIfEmpty(openNode, container);
      removeIfEmpty(closeNode, container);
      return true;
    });
  }
  function updateHeadingId(heading, authoredText) {
    const slug = (text2) => text2.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const bare = (id2) => id2.replace(/-/g, "");
    if (bare(heading.id) !== bare(slug(authoredText))) return;
    const id = slug(heading.textContent);
    if (id && !document.getElementById(id)) heading.id = id;
  }
  function decorateSpanTags(main) {
    const containers = /* @__PURE__ */ new Set();
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.includes("[[") && !node.parentElement.closest("code, pre, script, style")) {
        containers.add(getContainer(node));
      }
    }
    containers.forEach((container) => {
      const authoredText = container.textContent;
      getTextNodes(container).filter((node) => node.nodeValue.includes("[[")).forEach(replaceInTextNode);
      let wrapped = true;
      while (wrapped) wrapped = wrapMultiNodeTag(container);
      if (/^H[1-6]$/.test(container.tagName) && container.id) {
        updateHeadingId(container, authoredText);
      }
    });
  }

  // ../../../../tmp/run-outputs/lib-wt/scripts/corp-settings.js
  var TEXT_STYLES = {
    display: "size-3vw",
    headline: "size-2-5vw",
    title: "size-2vw",
    lead: "size-1-5vw",
    fluid: "size-1vw",
    large: "size-1-25em",
    serif: "serif",
    sans: "body-font",
    futura: "futura-bold",
    // a whole paragraph or heading: its alignment, or a 40px indent (styles-corp.css)
    center: "align-center",
    right: "align-right",
    indent: "indent"
  };
  ["gold", "white", "light-gray", "gray", "blue", "purple", "teal", "grey", "silver", "dark-gold", "black", "navy"].forEach((color) => {
    TEXT_STYLES[color] = `color-${color}`;
  });
  var COPY_SIZES = { small: "p-0-8", large: "p-1-25", "x-large": "p-1-5" };
  var LABEL_SIZES = { large: "label-1-75" };
  var BOXED = ["padding-top-3", "padding-bottom-3", "padding-left-3", "padding-right-3"];

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/colon-writer.js
  function writeColonMarkers(root) {
    const doc = root.ownerDocument;
    root.normalize();
    const INLINE = /* @__PURE__ */ new Set(["A", "B", "BR", "DEL", "EM", "I", "S", "SPAN", "STRONG", "SUB", "SUP", "U"]);
    const containerOf = (node) => {
      let el = node.parentElement;
      while (INLINE.has(el.tagName) && el.parentElement) el = el.parentElement;
      return el;
    };
    const textNodes = (container) => {
      const out = [];
      const w = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) if (containerOf(w.currentNode) === container) out.push(w.currentNode);
      return out;
    };
    const NAME = /^[a-z_-]+[a-z\d]*$/i;
    const marker = (token) => {
      const t = token.trim();
      const size = t.match(/^(\d+)(?:\.(\d+))?\s*(×|x|vw)$/i);
      if (size) return `${size[3].toLowerCase() === "vw" ? "vw" : "x"}${size[1]}${size[2] ? `p${size[2]}` : ""}`;
      return NAME.test(t) ? t : null;
    };
    const errors = [];
    let markers = 0;
    root.querySelectorAll("p").forEach((p) => {
      if (/^\[\[\s*blank line\s*\]\]$/i.test(p.textContent.trim())) {
        p.textContent = ":blank-line:";
        markers += 1;
      }
    });
    const containers = /* @__PURE__ */ new Set();
    const all = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (all.nextNode()) {
      const n = all.currentNode;
      if (n.nodeValue.includes("[[") && !n.parentElement.closest("code, pre")) containers.add(containerOf(n));
    }
    containers.forEach((container) => {
      const nodes = textNodes(container);
      const before = nodes.map((n) => n.nodeValue);
      const stack = [];
      const ends = [];
      let ok = true;
      let pending = null;
      const after = [];
      const reopen = (k) => {
        if (!pending) return;
        const runOf2 = pending.frames.flat().map((x) => `:${x}:`).join("");
        markers += pending.frames.flat().length;
        const here = nodes[k].parentElement === pending.parent;
        if (here) after[k] += runOf2;
        else after[pending.k] += runOf2;
        stack.push({ frames: pending.frames, parent: pending.parent });
        pending = null;
      };
      before.forEach((text2, k) => {
        after[k] = "";
        let i = 0;
        let lastWasOpen = false;
        while (i < text2.length) {
          const open = text2.slice(i).match(/^\[\[([^\][]+)\]/);
          const literal = text2.slice(i).match(/^\[[^\][]*\]/);
          if (text2[i] === "]" && pending) {
            pending.frames.pop();
            if (!pending.frames.length) pending = null;
            i += 1;
          } else if (open) {
            reopen(k);
            const names = open[1].split(",").map(marker);
            if (names.some((x) => !x)) ok = false;
            after[k] += names.map((x) => `:${x}:`).join("");
            markers += names.length;
            if (lastWasOpen && stack.length) stack[stack.length - 1].frames.push(names);
            else stack.push({ frames: [names], parent: nodes[k].parentElement });
            lastWasOpen = true;
            i += open[0].length;
          } else if (literal && !text2.startsWith("[[", i)) {
            reopen(k);
            after[k] += literal[0];
            lastWasOpen = false;
            i += literal[0].length;
          } else if (text2[i] === "]" && stack.length) {
            const group = stack.pop();
            group.frames.pop();
            const id = `\uE000E${ends.length}\uE000`;
            ends.push({ id, parent: group.parent });
            after[k] += id;
            i += 1;
            if (group.frames.length) {
              pending = { frames: group.frames, k, parent: nodes[k].parentElement };
            }
            lastWasOpen = false;
          } else {
            reopen(k);
            after[k] += text2[i];
            lastWasOpen = false;
            i += 1;
          }
        }
      });
      if (!ok || stack.length) {
        errors.push(container.textContent.slice(0, 80));
        return;
      }
      nodes.forEach((n, k) => {
        n.nodeValue = after[k];
      });
      const PLACE = /\uE000E\d+\uE000/g;
      const MERGES = /^(A|B|EM|I|S|SPAN|STRONG|SUB|SUP|U)$/;
      const followed = (el) => {
        let x = el;
        while (x !== container && !x.nextSibling) x = x.parentElement;
        const next = x === container ? null : x.nextSibling;
        return (next == null ? void 0 : next.nodeType) === 1 && MERGES.test(next.tagName);
      };
      const drop = new Set(ends.filter(({ id, parent }) => {
        if (parent !== container && followed(parent)) return false;
        const t = parent.textContent;
        const at = t.indexOf(id);
        return at >= 0 && !t.slice(at + id.length).replace(PLACE, "").trim();
      }).map((e) => e.id));
      ends.filter(({ id, parent }) => !parent.textContent.includes(id)).forEach(() => errors.push(`cross: ${container.textContent.slice(0, 80)}`));
      const AFTER_URL = /(\S*?)(:[a-z_-]+[a-z\d]*:)/gi;
      nodes.forEach((n) => {
        n.nodeValue = n.nodeValue.replace(PLACE, (id) => drop.has(id) ? "" : ":end:").replace(AFTER_URL, (m, run, mark) => /https?|urn/i.test(run) ? `${run}\uFEFF${mark}` : m);
      });
    });
    root.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]").forEach((h) => {
      if (!h.textContent.includes(":")) return;
      h.id = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    });
    const left = errors.length ? `; left as bracket tags: ${errors.length} (${errors.slice(0, 3).join(" | ")})` : "";
    return [`colon markers: ${markers}${left}`];
  }
  var isRow = (row, name) => {
    var _a;
    return new RegExp(`^${name}$`, "i").test(((_a = row.firstElementChild) == null ? void 0 : _a.textContent.trim()) || "");
  };
  var MARKER = new RegExp("(?<!(?:https?|urn)[^\\s]*):(#?[a-z_-]+[a-z\\d]*):", "gi");
  function ensureDescription(root) {
    const meta = root.querySelector(".metadata");
    if (!meta || [...meta.children].some((r) => isRow(r, "description"))) return [];
    const clean3 = (t) => t.replace(MARKER, "").replace(/\s+/g, " ").trim();
    const text2 = [...root.querySelectorAll("p")].filter((x) => !x.closest(".metadata, .section-metadata")).map((x) => clean3(x.textContent)).find((t) => !/^box(:| end)/i.test(t) && t.split(" ").length > 10);
    if (!text2) return ["description: none found"];
    const words = text2.split(" ");
    const doc = root.ownerDocument;
    const row = doc.createElement("div");
    const k = doc.createElement("div");
    const v = doc.createElement("div");
    k.textContent = "Description";
    v.textContent = words.length > 25 ? `${words.slice(0, 25).join(" ")} ...` : text2;
    row.append(k, v);
    const title = [...meta.children].find((r) => isRow(r, "title"));
    if (title) title.after(row);
    else meta.prepend(row);
    return ["description: added"];
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/settings-writer.js
  var toClassName2 = (name) => name.toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  function convertReadable(root) {
    const doc = root.ownerDocument;
    const report = [];
    if (root.querySelector("span")) report.push("warning: the page already has spans");
    decorateSpanTags(root);
    const inv = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
    const TEXT = inv(TEXT_STYLES);
    const COPY = inv(COPY_SIZES);
    const LABEL = inv(LABEL_SIZES);
    const label = (n) => n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("-");
    const SPACING = /^(padding|margin)-(top|bottom|left|right)-(minus-)?(\d+)(?:-(\d+))?(px)?$/;
    const INSET = /^(top|bottom|left|right)-(\d+)(?:-(\d+))?$/;
    const num2 = (int, dec) => dec ? `${int}.${dec}` : int;
    const formatSpacing = (tokens, withKind) => {
      const byKind = {};
      tokens.forEach((t) => {
        const [, kind, side, minus, int, dec, px] = t.match(SPACING);
        (byKind[kind] = byKind[kind] || {})[side] = `${minus ? "-" : ""}${num2(int, dec)}${px ? "px" : "%"}`;
      });
      const parts = {};
      Object.entries(byKind).forEach(([kind, s]) => {
        const e = [];
        const pre = withKind ? `${kind} ` : "";
        if (s.top && s.top === s.bottom && s.top === s.left && s.top === s.right) {
          e.push(`${pre}all ${s.top}`);
        } else {
          if (s.top) e.push(`${pre}top ${s.top}`);
          if (s.bottom) e.push(`${pre}bottom ${s.bottom}`);
          if (s.left && s.left === s.right) e.push(`${pre}sides ${s.left}`);
          else {
            if (s.left) e.push(`${pre}left ${s.left}`);
            if (s.right) e.push(`${pre}right ${s.right}`);
          }
        }
        parts[kind] = e.join(", ");
      });
      return parts;
    };
    const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
    const hasMedia = (cell) => cell.querySelector("picture, img, video, iframe") || [...cell.querySelectorAll("a[href]")].some((a) => /media-assets\.stryker\.com|scene7|\.m3u8|youtube|vimeo/.test(a.href));
    const textColumn = (columns) => {
      var _a;
      const cells = [...((_a = columns.firstElementChild) == null ? void 0 : _a.children) || []];
      const text2 = cells.map((c, i) => hasMedia(c) ? 0 : i + 1).filter(Boolean);
      return text2.length === 1 ? text2[0] : 0;
    };
    const styleSet = (node, container) => {
      const set = /* @__PURE__ */ new Set();
      for (let el = node.parentElement; el && el !== container; el = el.parentElement) {
        if (el.tagName === "SPAN") el.classList.forEach((c) => set.add(c));
      }
      return set;
    };
    const textNodes = (el) => {
      const w = doc.createTreeWalker(
        el,
        4
        /* NodeFilter.SHOW_TEXT */
      );
      const nodes = [];
      while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
      return nodes;
    };
    const leadsWithBreak = (el) => {
      let n = el.firstChild;
      while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
      return !!n && n.nodeType === 1 && n.tagName === "SPAN" && (() => {
        let m = n.firstChild;
        while (m && m.nodeType === 3 && !m.nodeValue.trim()) m = m.nextSibling;
        return !!m && (m.nodeName === "BR" || m.nodeName === "SPAN" && leadsWithBreak(n));
      })();
    };
    const liftStyle = (targets) => {
      const nodes = targets.flatMap((t) => textNodes(t).map((n) => [n, t]));
      if (!nodes.length || targets.some(leadsWithBreak)) return null;
      const sets = nodes.map(([n, t]) => styleSet(n, t));
      const common = [...sets[0]].filter((c) => TEXT[c] && sets.every((s) => s.has(c)));
      if (!common.length) return null;
      targets.forEach((t) => t.querySelectorAll("span").forEach((span) => {
        common.forEach((c) => span.classList.remove(c));
        if (!span.classList.length) span.replaceWith(...span.childNodes);
      }));
      const colors = common.filter((c) => c.startsWith("color-"));
      return [...colors, ...common.filter((c) => !colors.includes(c))].map((c) => label(TEXT[c])).join(", ");
    };
    const sections = [...root.children].filter((el) => el.tagName === "DIV");
    sections.forEach((sec, i) => {
      const name = `S${i + 1}`;
      let meta = sec.querySelector(":scope > .section-metadata");
      if (sec.querySelector(":scope > .metadata")) return;
      const rows = [];
      let styleCell = null;
      let styles = [];
      meta == null ? void 0 : meta.querySelectorAll(":scope > div").forEach((row) => {
        var _a;
        if (((_a = row.children[0]) == null ? void 0 : _a.textContent.trim().toLowerCase()) === "style") {
          [, styleCell] = row.children;
          styles = styleCell.textContent.split(",").map((s) => s.trim()).filter(Boolean);
        }
      });
      const hero = sec.querySelector(":scope > .hero-corp");
      const columns = [...sec.querySelectorAll(":scope > .columns")];
      const keep = [];
      const secSpacing = [];
      let copy = "";
      let lbl = "";
      let widths = "";
      let hsize = "";
      let auto = "";
      let blank2 = "";
      let pieces = "";
      const column = [];
      const multiple = (s, prefix) => {
        const m = s.match(/^([a-z]+)-(\d+)(?:-(\d+))?$/);
        return m && m[1] === prefix ? `${num2(m[2], m[3])}\xD7` : "";
      };
      styles.forEach((s) => {
        if (SPACING.test(s)) secSpacing.push(s);
        else if (COPY[s]) copy = label(COPY[s]);
        else if (LABEL[s]) lbl = label(LABEL[s]);
        else if (multiple(s, "p")) copy = multiple(s, "p");
        else if (multiple(s, "label")) lbl = multiple(s, "label");
        else if (multiple(s, "h")) hsize = multiple(s, "h");
        else if (/^autoplay-\d+$/.test(s)) auto = `${Number(s.slice(9)) / 1e3} s`;
        else if (/^lines-\d+$/.test(s) && styles.includes("spacer")) blank2 = s.slice(6);
        else if (/^flex-cols-\d+(-\d+)+$/.test(s)) pieces = s.slice(10).split("-").join(" + ");
        else if (/^col-\d+-\d+$/.test(s)) column.unshift(`width ${s.slice(4).replace("-", "/")}`);
        else if (/^col-at-\d+-\d+$/.test(s)) column.push(`from ${s.slice(7).replace("-", "/")}`);
        else if (s === "col-phone") column.push("phones too");
        else if (/^flex-\d+(-\d+)+$/.test(s) && !columns.length) widths = s.slice(5).split("-").map((w) => `${w}%`).join(" / ");
        else keep.push(s);
      });
      let spacing = secSpacing;
      let inset = "";
      if (hero) {
        const cls = [...hero.classList];
        const heroSpacing = cls.filter((c) => SPACING.test(c));
        const insets = cls.filter((c) => INSET.test(c));
        if (secSpacing.length) {
          keep.push(...secSpacing);
          spacing = [];
          report.push(`${name}: section spacing next to a hero kept as classes`);
        }
        if (heroSpacing.length && !secSpacing.length) {
          spacing = heroSpacing;
          hero.classList.remove(...heroSpacing);
        }
        if (insets.length) {
          inset = insets.map((c) => {
            const [, side, int, dec] = c.match(INSET);
            return `${side} ${num2(int, dec)}%`;
          }).join(", ");
          hero.classList.remove(...insets);
        }
      }
      const fs = formatSpacing(spacing, false);
      if (fs.padding) rows.push(["Padding", fs.padding]);
      if (fs.margin) rows.push(["Margin", fs.margin]);
      if (inset) rows.push(["Text box", inset]);
      const GRID = /^grid-(?:([tm])-)?((?:of\d+-)?(?:(?:o\d+-)?n?\d+|h)(?:-(?:o\d+-)?n?\d+|-h)*)$/;
      const gridPart = (bp, value) => {
        const of = value.match(/^of(\d+)-(.+)$/);
        const items = (of ? of[2] : value).split("-").map((t2) => {
          if (t2 === "h") return "hidden";
          if (t2.startsWith("o")) return `skip ${t2.slice(1)}`;
          if (t2.startsWith("n")) return `new line ${t2.slice(1)}`;
          return t2;
        });
        return `${bp}: ${items.join(", ")}${of ? ` of ${of[1]}` : ""}`;
      };
      const colWidths = columns.map((col) => [...col.classList].find((c) => /^columns-\d+(-\d+)+$/.test(c)));
      const sharedWidths = colWidths.length && colWidths[0] && colWidths.every((c) => c === colWidths[0]);
      if (sharedWidths) {
        widths = colWidths[0].slice(8).split("-").map((x) => `${x}%`).join(" / ");
        columns.forEach((col) => col.classList.remove(colWidths[0]));
      }
      columns.forEach((col, ci) => {
        const k = ci + 1;
        const suffix = k > 1 || hero ? ` (${k})` : "";
        const cls = [...col.classList];
        if (!sharedWidths && colWidths[ci]) {
          rows.push([`Column widths (${k})`, colWidths[ci].slice(8).split("-").map((x) => `${x}%`).join(" / ")]);
          col.classList.remove(colWidths[ci]);
        }
        const byCell = {};
        const colours = [];
        const borders = [];
        const grid = {};
        cls.forEach((c) => {
          const m = c.match(/^cell-(\d+)-(.+)$/);
          if (m && SPACING.test(m[2])) {
            (byCell[m[1]] = byCell[m[1]] || []).push(m[2]);
            col.classList.remove(c);
          } else if (m && /^(bg-[a-z-]+|dark)$/.test(m[2])) {
            colours.push([m[1], m[2]]);
            col.classList.remove(c);
          } else if (m && /^image-border(-[a-z]+)?$/.test(m[2])) {
            borders.push([m[1], m[2] === "image-border" ? "teal" : m[2].slice(13)]);
            col.classList.remove(c);
          }
          const g = c.match(GRID);
          if (g) {
            const [, bp, value] = g;
            grid[bp || "d"] = value;
            col.classList.remove(c);
          }
        });
        const coloured = new Set(colours.map(([n]) => n));
        const parts = Object.entries(byCell).map(([cell, tokens]) => {
          const forms = coloured.has(cell) ? [BOXED] : [
            BOXED,
            BOXED.map((t2) => t2 === "padding-left-3" ? "margin-left-3" : t2),
            BOXED.map((t2) => t2 === "padding-right-3" ? "margin-right-3" : t2)
          ];
          if (forms.some((f2) => same(f2, tokens))) {
            return Number(cell) === textColumn(col) ? "boxed" : `column ${cell}: boxed`;
          }
          const f = formatSpacing(tokens, true);
          const value = [f.padding, f.margin].filter(Boolean).join(", ").replace(/padding /g, "");
          return `column ${cell}: ${value}`;
        });
        if (parts.length) rows.push([`Text box${suffix}`, parts.join("; ")]);
        const gridParts = [["d", "desktop"], ["t", "tablet"], ["m", "phone"]].filter(([bp]) => grid[bp]).map(([bp, bpName]) => gridPart(bpName, grid[bp]));
        if (gridParts.length) rows.push([`Grid${suffix.replace(" (1)", "")}`, gridParts.join(" \xB7 ")]);
        if (colours.length) {
          rows.push([`Cell colours${suffix.replace(" (1)", "")}`, colours.map(([n, c]) => `${n}: ${label(c === "dark" ? "dark" : c.slice(3))}`).join(", ")]);
        }
        if (borders.length) {
          rows.push([`Image borders${suffix.replace(" (1)", "")}`, borders.map(([n, c]) => `${n}: ${label(c)}`).join(", ")]);
        }
      });
      if (widths) rows.push(["Column widths", widths]);
      if (column.length) rows.push(["Column", column.join(", ")]);
      if (copy) rows.push(["Copy size", copy]);
      if (lbl) rows.push(["Label size", lbl]);
      if (hsize) rows.push(["Heading size", hsize]);
      if (auto) rows.push(["Autoplay", auto]);
      if (blank2) rows.push(["Blank lines", blank2]);
      if (pieces) rows.push(["Columns", pieces]);
      const headings = [...sec.querySelectorAll(":scope > :is(h1, h2, h3, h4, h5, h6)")];
      const texts = [...sec.querySelectorAll(":scope > p, :scope > ul > li, :scope > ol > li, :scope > .accordion > div > div:nth-child(2)")].filter((el) => !/^(\[\[blank line\]\]|column break)$/i.test(el.textContent.trim()));
      const h = headings.length ? liftStyle(headings) : null;
      if (h) rows.push(["Headings", h]);
      const t = texts.length ? liftStyle(texts) : null;
      if (t) rows.push(["Text", t]);
      if (!rows.length && keep.length === styles.length) return;
      if (!meta) {
        meta = doc.createElement("div");
        meta.className = "section-metadata";
        sec.append(meta);
      }
      if (styleCell) {
        if (keep.length) styleCell.textContent = keep.join(", ");
        else styleCell.parentElement.remove();
      }
      rows.forEach(([k, v]) => {
        const row = doc.createElement("div");
        const a = doc.createElement("div");
        const b = doc.createElement("div");
        a.textContent = k;
        b.textContent = v;
        row.append(a, b);
        meta.append(row);
      });
      report.push(`${name}: ${rows.map(([k, v]) => `${k}: ${v}`).join(" | ")}`);
    });
    const nameOf = (c) => {
      if (TEXT[c]) return label(TEXT[c]);
      const m = c.match(/^size-(\d+)(?:-(\d+))?(em|vw)$/);
      return m ? `${num2(m[1], m[2])}${m[3] === "vw" ? "vw" : "\xD7"}` : null;
    };
    const named = (span) => [...span.classList].every(nameOf);
    let legacy = 0;
    let byName = 0;
    let boxes = 0;
    [...root.querySelectorAll("span")].forEach((span) => {
      if (!root.contains(span)) return;
      let classes = [...span.classList];
      const p = span.parentElement;
      if (classes[0] === "spacing" && (p == null ? void 0 : p.tagName) === "P" && p.childNodes.length === 1 && !span.textContent.trim()) {
        const colour = /^(bg-[a-z-]+|dark)$/.test(classes[1] || "") ? classes[1] : "";
        const shadow = classes.includes("shadow");
        const tokens = classes.slice(colour ? 2 : 1).filter((tk) => tk !== "shadow");
        if (tokens.every((tk) => SPACING.test(tk))) {
          const f = formatSpacing(tokens, true);
          const value = [colour ? label(colour.replace(/^bg-/, "")) : "", shadow ? "Shadow" : "", f.padding, f.margin].filter(Boolean).join(", ").replace(/padding /g, "");
          p.textContent = tokens.length || colour || shadow ? `Box: ${value}` : "Box end";
          boxes += 1;
          return;
        }
      }
      let content = [...span.childNodes].filter((n) => n.nodeType !== 3 || n.nodeValue !== "");
      const only = content.length === 1 && content[0].tagName === "SPAN" ? content[0] : null;
      if (named(span) && only && named(only)) {
        classes = [...classes, ...only.classList];
        content = [...only.childNodes];
      }
      const tag = classes.every(nameOf) ? classes.map(nameOf) : classes;
      if (classes.every(nameOf)) byName += 1;
      else legacy += 1;
      span.replaceWith(`[[${tag.join(",")}]`, ...content, "]");
    });
    report.push(`bracket tags: ${byName} by name or value, ${legacy} kept with legacy classes; ${boxes} Box lines`);
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((hd) => {
      const slug = hd.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (hd.id) hd.id = slug;
    });
    const md = root.querySelector(".metadata");
    if (md) {
      const row = doc.createElement("div");
      const a = doc.createElement("div");
      const b = doc.createElement("div");
      a.textContent = "style-settings";
      b.textContent = "on";
      row.append(a, b);
      md.append(row);
    }
    return report;
  }
  function toPlain(main, document2) {
    const root = document2.createElement("div");
    const blocks = /* @__PURE__ */ new Map();
    let section = document2.createElement("div");
    root.append(section);
    [...main.childNodes].forEach((node) => {
      if (node.nodeName === "HR") {
        section = document2.createElement("div");
        root.append(section);
      } else if (node.nodeName === "TABLE") {
        const rows = [...node.rows];
        const header = rows[0].cells[0].textContent.trim();
        const [, name, variants] = header.match(/^([^(]*?)\s*(?:\((.*)\))?$/) || [null, header, ""];
        const div = document2.createElement("div");
        div.className = [name, ...(variants || "").split(",")].map((v) => toClassName2(v.trim())).filter(Boolean).join(" ");
        const cells = rows.slice(1).map((tr) => {
          const row = document2.createElement("div");
          div.append(row);
          return [...tr.cells].map((td) => {
            const cell = document2.createElement("div");
            cell.append(...td.childNodes);
            row.append(cell);
            return td;
          });
        });
        blocks.set(div, { table: node, name, cells });
        section.append(div);
      } else {
        section.append(node);
      }
    });
    main.replaceChildren();
    return { root, blocks };
  }
  function toImport(main, document2, root, blocks) {
    [...root.children].forEach((section, i) => {
      if (i) main.append(document2.createElement("hr"));
      [...section.childNodes].forEach((node) => {
        const kind = node.nodeType === 1 ? node.className : "";
        if (kind === "section-metadata" || kind === "metadata") {
          const cells = [...node.children].map((row) => [row.children[0].textContent, [...row.children[1].childNodes]]);
          const name = kind === "metadata" ? "Metadata" : "Section Metadata";
          if (cells.length) main.append(WebImporter.Blocks.createBlock(document2, { name, cells }));
          return;
        }
        const block2 = blocks.get(node);
        if (!block2) {
          main.append(node);
          return;
        }
        const variants = [...node.classList].slice(1);
        block2.table.rows[0].cells[0].textContent = variants.length ? `${block2.name} (${variants.join(", ")})` : block2.name;
        [...node.children].forEach((row, r) => [...row.children].forEach((cell, c) => {
          block2.cells[r][c].append(...cell.childNodes);
        }));
        main.append(block2.table);
      });
    });
  }
  function writeReadableSettings(main, document2) {
    if (typeof window !== "undefined" && window.CORP_WRITER_OFF) return [];
    const { root, blocks } = toPlain(main, document2);
    root.querySelectorAll("span:not(.icon)").forEach((span) => span.replaceWith(...span.childNodes));
    const report = convertReadable(root);
    report.push(...writeColonMarkers(root), ...ensureDescription(root));
    toImport(main, document2, root, blocks);
    return report;
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/root.js
  var ROOT = "/rs";
  var rooted = (path) => path.startsWith(`${ROOT}/`) ? path : `${ROOT}${path}`;
  var FRAGMENT = /^\/us\/en\/fragments\//;
  function rootFragmentLinks(main) {
    main.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!FRAGMENT.test(href)) return;
      if (a.textContent.trim() === href) a.textContent = rooted(href);
      a.setAttribute("href", rooted(href));
    });
  }

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/corp/modal-fragments.js
  var modal_fragments_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const kind = source.searchParams.get("modal");
      if (kind !== "procare") throw new Error(`Unknown modal kind: ${kind}`);
      const info = document2.querySelector("#c-procare-tile-modal .c-procare-tile-info");
      const title = info && info.querySelector(".c-procare-tile-title");
      const path = title && procareModalPath(text(title));
      if (!path) throw new Error(`No ProCare modal on ${source.pathname}`);
      const ctx = createBuilder({ doc: document2, handlers: CORP_HANDLERS, source: source.href });
      ctx.place(procareModalItems(info, ctx));
      const main = document2.createElement("div");
      main.append(...ctx.render());
      rewriteCorpLinks(main);
      document2.body.replaceChildren(main);
      writeReadableSettings(main, document2);
      rootFragmentLinks(main);
      return [{
        element: main,
        path: rooted(path),
        report: {
          title: text(title),
          template: "modal",
          source: source.pathname,
          notes: ctx.report.notes
        }
      }];
    }
  };

  // ../../../../tmp/run-outputs/lib-wt/tools/importer/import-corp-modal-fragments.js
  var import_corp_modal_fragments_default = modal_fragments_default;
  return __toCommonJS(import_corp_modal_fragments_exports);
})();
