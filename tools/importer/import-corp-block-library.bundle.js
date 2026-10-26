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
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-corp-block-library.js
  var import_corp_block_library_exports = {};
  __export(import_corp_block_library_exports, {
    default: () => import_corp_block_library_default
  });
  var PAGE_TEMPLATE = {
    name: "corp-block-library",
    description: "One corp block per document, copied from the sdt-stryker EDS pages, for the stryker.com block library."
  };
  var AED = "/us/en/emergency-care/news/2024/when-to-use-aed-sudden-cardiac-arrest";
  var DOCS = {
    "news-headline-corp": [{ page: AED, source: "news-headline" }],
    "hero-carousel-corp": [{ page: AED, source: "hero-carousel" }],
    // one live www.stryker.com row per variant of issue #389, built by extractColumns; the
    // ratio comes from a section style (cols-*) or a block variant (columns-33-67 …)
    "columns-corp": [
      {
        // (base) + article grid section styles: 7/12 text | 5/12 image
        page: "/us/en/emergency-care/news/2024/when-to-use-AED-sudden-cardiac-arrest.html",
        text: "Here's when you should use an AED",
        styles: ["cols-7-5", "lead", "sm-7-5"]
      },
      {
        // image-text 50-50: text | image
        page: "/us/en/about/news/features/mother-and-son-take-on-goldenhar-syndrome.html",
        text: "Mandiblular distraction",
        styles: ["cols-6-6"]
      },
      {
        // text 50-50: two building blocks (question + answer)
        page: "/us/en/about/news/2023/features/how-stryker-is-accelerating-innovation-in-additive-manufacturing.html",
        text: "As a woman in engineering",
        up: 1,
        styles: ["cols-6-6"]
      },
      {
        // image-text 33-67: icon | copy
        page: "/us/en/about/news/2023/features/paving-the-way-forward-for-black-professionals.html",
        text: "Driving inclusion and improving healthcare",
        offset: -1,
        variants: ["columns-33-67"]
      },
      {
        // image-text 67-33: image | caption copy
        page: "/us/en/about/news/2023/features/transforming-confidence-and-care-in-partnership-with-operation-smile.html",
        text: "Dr. Charles and Dr. Ntirenganya were",
        offset: -1,
        variants: ["columns-67-33"]
      },
      {
        // video-text 50-50
        page: "/us/en/about/news/2023/kevin-on-insideout-podcast-with-mike-alkire--premier-inc.html",
        select: ".s7dm-dynamic-media",
        styles: ["cols-6-6"]
      },
      {
        // video-text 67-33
        page: "/us/en/about/news/2021/facing-the-future-with-confidence-ellys--maxillofacial-surgery-s.html",
        select: ".s7dm-dynamic-media",
        variants: ["columns-67-33"]
      },
      {
        // text-3: three building blocks (title, image, copy)
        page: "/us/en/about/news/2026/features/what-everyone-should-know-about-arthritis.html",
        text: "Step 1 - Scan",
        up: 1,
        count: 3,
        styles: ["cols-4-4-4"]
      },
      {
        // text-4: four link groups (the sdt-stryker authoring: bold label, one link per line)
        page: "/us/en/smart-care/news/help-protect-healthcare-staff-from-workplace-violence.html",
        text: "Emergency Care homepage",
        count: 4,
        styles: ["label-1-5", "p-1-25", "ps-0", "strong-futura"]
      },
      {
        // text 67-33: quote | logo
        page: "/us/en/about/news/2024/features/a-partnership-promoting-mental-health-for-healthcare-workers.html",
        text: "Heroes\u2019 Foundation is proud",
        variants: ["columns-67-33"]
      },
      {
        // mixed 33-67: image + caption | copy (the sdt-stryker authoring)
        page: "/us/en/emergency-care/news/2024/emergency-preparedness-darryl-conway-sudden-cardiac-arrest.html",
        text: "Darryl Conway, MA, AT, ATC",
        variants: ["columns-33-67"],
        styles: ["p-1-25", "ps-1"]
      }
    ].map((v) => __spreadProps(__spreadValues({}, v), { source: "columns", live: true })),
    "cards-corp": [
      { page: AED, source: "cards", variants: ["curated-teasers"] },
      { page: "/us/en/emergency-care/news/2026/mutual-aid-pro-care-partnership", source: "resources", variants: ["resources"] }
    ],
    video: [{ page: "/us/en/about/news/2023/features/restoring-form-function-and-hope-emily-s-jaw-replacement", source: "video" }],
    "accordion-corp": [{ page: "/us/en/about/news/2024/features/stryker-boots-innovation-r-and-d-expands-with-medical-device-testing-facility", source: "accordion-corp" }],
    "marketo-form": [{ page: "/us/en/emergency-care/news/2026/lifepak35-15-lead-ecg-integration", source: "marketo-form-corp" }],
    tabs: [{ page: "/us/en/emergency-care/news/2024/sudden-cardiac-arrest-vs-heart-attack-what-you-need-to-know", source: "tabs-corp" }],
    "news-cards-corp": [{ page: "/us/en/index", source: "news-cards" }],
    "statistics-corp": [{ page: "/us/en/ent/products/xpress", source: "statistics-corp" }],
    // live www.stryker.com AEM pages (`live: true`): import from https://www.stryker.com so
    // both pages are same-origin; the block is built from the page by LIVE_EXTRACTORS
    "hero-corp": [
      // image-slide: one sample per slide design on the news pages (box colours, positions,
      // mobile layouts, video, CTA, stripes); options come from the slide (extractImageSlide)
      { page: "/us/en/c/test/resource-center.html", source: "image-slide", live: true },
      { page: "/us/en/emergency-care/news/2023/understanding-the-basics-of-a-lucas-chest-compression-system.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/2022/features/tour-the-amsterdam-skills-centre--an-international-training-cent.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/features/packaging-for-a-better-planet.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/2022/features/promoting-high-quality--inclusive-healthcare-in-latin-america.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/features/stryker-donates-22-500-emergency-relief-bed-kits-to-project-c-u-.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/features/stryker-holds-diversity--equity-and-inclusion-summit.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/features/nurses-a-key-driver-in-advancing-global-health.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/features/mako-smartrobotics--hits-500-000--procedures.html", source: "image-slide", live: true },
      { page: "/us/en/communications/news/2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite.html", source: "image-slide", live: true },
      {
        page: "/us/en/communications/news/2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite.html",
        source: "image-slide",
        live: true,
        index: 1
      },
      { page: "/us/en/surgical-technologies/news/technology-helps-improve-colonoscopy-safety-and-efficiency.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/2026/features/what-everyone-should-know-about-arthritis.html", source: "image-slide", live: true },
      { page: "/us/en/about/news/2024/features/stryker-is-doubling-down-in-the-fight-against-brain-tumors.html", source: "image-slide", live: true },
      {
        page: "/us/en/about/contact.html",
        source: "tagline-band",
        live: true,
        variants: ["tagline-band"]
      },
      {
        page: "/us/en/sports-medicine/procedures/Rotator_Cuff_Repair.html",
        source: "large-header",
        live: true,
        variants: ["large-header"]
      },
      {
        page: "/us/en/about/history.html",
        source: "long-text",
        live: true,
        variants: ["long-text"]
      },
      {
        page: "/us/en/communications/products/isuite-live-video.html",
        source: "long-text",
        live: true,
        variants: ["long-text"]
      }
    ]
  };
  var GOLD = /rgba?\(\s*255\s*,\s*181\s*,\s*0\b/;
  function extractTaglineBand(doc, document) {
    const banner = doc.querySelector(".c-tagline .m-banner-simple");
    const title = banner && banner.querySelector("h1");
    if (!title) return null;
    const cell = document.createElement("div");
    [title, banner.querySelector("h2")].filter((h) => h && h.textContent.trim()).forEach((h) => {
      const heading = document.createElement(h.tagName.toLowerCase());
      heading.textContent = h.textContent.replace(/\s+/g, " ").trim();
      cell.append(heading);
    });
    const row = document.createElement("div");
    row.append(cell);
    const block = document.createElement("div");
    block.className = "tagline-band";
    block.append(row);
    return block;
  }
  function extractLargeHeader(doc, document) {
    const title = doc.querySelector(".c-hero-large-header h1");
    if (!title || !title.textContent.trim()) return null;
    const h1 = document.createElement("h1");
    h1.textContent = title.textContent.replace(/\s+/g, " ").trim();
    const cell = document.createElement("div");
    cell.append(h1);
    const row = document.createElement("div");
    row.append(cell);
    const block = document.createElement("div");
    block.className = "large-header";
    block.append(row);
    return block;
  }
  function edsHref(href) {
    if (!/^\/(?!\/)/.test(href)) return href;
    const [, path, rest = ""] = href.match(/^([^?#]*)(.*)$/);
    return path.replace(/\/index\.html$/, "/").replace(/\.html$/, "") + rest;
  }
  function extractLongText(doc, document) {
    const hero = doc.querySelector(".c-longtexthero");
    if (!hero) return null;
    const textCell = document.createElement("div");
    ["h1", "h2", "h3"].forEach((tag) => {
      const h = hero.querySelector(`.row > div:first-child > ${tag}`);
      if (!h || !h.textContent.trim()) return;
      const el = document.createElement(tag);
      el.textContent = h.textContent.replace(/\s+/g, " ").trim();
      textCell.append(el);
    });
    hero.querySelectorAll(".longtext > p").forEach((src) => {
      if (!src.textContent.trim()) return;
      const p = document.createElement("p");
      src.childNodes.forEach((n) => {
        if (n.nodeType === 1 && n.tagName === "A") {
          const a = document.createElement("a");
          a.href = edsHref(n.getAttribute("href")) + (n.getAttribute("target") === "_blank" ? "#_blank" : "");
          a.textContent = n.textContent.trim();
          p.append(a);
        } else {
          p.append(document.createTextNode(n.textContent));
        }
      });
      textCell.append(p);
    });
    const img = hero.querySelector("img");
    const imageCell = document.createElement("div");
    if (img) {
      const link = document.createElement("a");
      link.href = img.getAttribute("src");
      link.textContent = (img.getAttribute("alt") || "").trim() || img.getAttribute("src");
      imageCell.append(link);
    }
    const block = document.createElement("div");
    block.className = "long-text";
    [textCell, imageCell].forEach((cell) => {
      const row = document.createElement("div");
      row.append(cell);
      block.append(row);
    });
    return block;
  }
  var DM = "https://media-assets.stryker.com/is";
  function liveHref(link) {
    const href = (link.getAttribute("href") || "").trim().replace(/^https?:\/\/www\.stryker\.com(?=\/)/, "");
    return edsHref(href) + (link.getAttribute("target") === "_blank" ? "#_blank" : "");
  }
  function isGold(el, root) {
    for (let a = el; a && a !== root; a = a.parentElement) {
      const color = (a.getAttribute("style") || "").match(/(?:^|;)\s*color:\s*([^;]+)/);
      if (color) return GOLD.test(color[1]) || /#ffb500/i.test(color[1]);
    }
    return false;
  }
  function inlineNodes(node, document, root, state = { bold: false, italic: false }) {
    const out = [];
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        const text = n.textContent.replace(/\s+/g, " ");
        if (!text) return;
        const gold = isGold(n.parentElement, root);
        const bold = !state.bold && (gold || !!n.parentElement.closest('b, strong, [class|="futura-bold"]'));
        const italic = !state.italic && (gold || !!n.parentElement.closest("i, em"));
        let t = document.createTextNode(text);
        if (italic) {
          const i = document.createElement("i");
          i.append(t);
          t = i;
        }
        if (bold) {
          const b = document.createElement("b");
          b.append(t);
          t = b;
        }
        out.push(t);
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === "BR") {
        out.push(document.createElement("br"));
      } else if (tag === "A" && n.getAttribute("href")) {
        const a = document.createElement("a");
        a.href = liveHref(n);
        a.append(...inlineNodes(n, document, root, state));
        out.push(a);
      } else if (/^(SUP|SUB|U)$/.test(tag)) {
        const el = document.createElement(tag.toLowerCase());
        el.append(...inlineNodes(n, document, root, state));
        out.push(el);
      } else if (!/^(SCRIPT|STYLE|IMG)$/.test(tag)) {
        out.push(...inlineNodes(n, document, root, state));
      }
    });
    return out;
  }
  function trimInline(el) {
    while (el.firstChild && (el.firstChild.nodeName === "BR" || !el.firstChild.textContent.trim()) && el.firstChild.nodeName !== "A") el.firstChild.remove();
    while (el.lastChild && (el.lastChild.nodeName === "BR" || !el.lastChild.textContent.trim()) && el.lastChild.nodeName !== "A") el.lastChild.remove();
    const leaf = (x, first) => {
      let t = x;
      while (t && t.nodeType === 1) t = first ? t.firstChild : t.lastChild;
      return t;
    };
    const head = leaf(el.firstChild, true);
    if (head) head.textContent = head.textContent.replace(/^\s+/, "");
    const tail = leaf(el.lastChild, false);
    if (tail) tail.textContent = tail.textContent.replace(/\s+$/, "");
    return el;
  }
  function imageLink(img, document) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = img.getAttribute("src");
    a.textContent = (img.getAttribute("alt") || "").trim() || img.getAttribute("src");
    p.append(a);
    return p;
  }
  function videoLink(dm, document) {
    const asset = dm.getAttribute("data-asset-path");
    const modifiers = dm.getAttribute("data-viewermodifiers") || "";
    const poster = (modifiers.match(/posterimage=([^&]+)/) || [])[1] || asset;
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = `${DM}/content/${encodeURI(asset)}.m3u8?poster=${DM}/image/${encodeURI(poster)}`;
    a.textContent = a.href;
    p.append(a);
    return p;
  }
  var SLIDE_COLORS = [
    [GOLD, "color-gold"],
    [/rgba?\(\s*255\s*,\s*255\s*,\s*255\b|#fff(fff)?\b/i, "color-white"],
    [/rgba?\(\s*28\s*,\s*86\s*,\s*135\b|#1c5687\b/i, "color-blue"],
    [/rgba?\(\s*237\s*,\s*238\s*,\s*236\b|#edeeec\b/i, "color-light-gray"],
    [/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*\)|#000(000)?\b/i, null]
  ];
  var SLIDE_BOXES = {
    "bg-white": "box-white",
    "bg-gold": "box-gold",
    "bg-blue": "box-blue",
    "bg-light-gray": "box-gray",
    "bg-dark-gray": "box-dark"
  };
  var SLIDE_SPACING = {
    "margin-top": "mt",
    "margin-right": "mr",
    "margin-bottom": "mb",
    "margin-left": "ml",
    "padding-top": "pt",
    "padding-right": "pr",
    "padding-bottom": "pb",
    "padding-left": "pl"
  };
  function slideRunStyle(textNode, line) {
    const el = textNode.parentElement;
    const within = (sel) => {
      const hit = el.closest(sel);
      return hit && line.contains(hit) ? hit : null;
    };
    const sizeEl = within('[class*="fontsize-"]');
    let color = null;
    for (let e = el; e && line.contains(e); e = e.parentElement) {
      const m = (e.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      if (m) {
        const hit = SLIDE_COLORS.find(([re]) => re.test(m[1]));
        color = hit ? hit[1] : null;
        break;
      }
    }
    const link = within("a[href]");
    const boldEl = within('[class|="futura-bold"], b, strong');
    const outerBold = sizeEl && sizeEl.parentElement && sizeEl.parentElement.closest('[class|="futura-bold"], b, strong');
    return {
      bold: !!boldEl,
      boldOuter: !!(outerBold && line.contains(outerBold)),
      tags: color || "",
      href: link ? link.getAttribute("href") : null
    };
  }
  function slideLineNodes(line, document) {
    const runs = [];
    const walker = line.ownerDocument.createTreeWalker(line, 5);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === 1 && n.tagName === "BR") runs.push({ br: true });
      if (n.nodeType === 3 && n.textContent) {
        const style = slideRunStyle(n, line);
        const text = n.textContent.replace(/\s+/g, " ");
        const last = runs[runs.length - 1];
        const same = last && !last.br && (!text.trim() || last.bold === style.bold && last.boldOuter === style.boldOuter && last.tags === style.tags && last.href === style.href);
        if (same) last.text += text;
        else if (text.trim() || last && !last.br) runs.push(__spreadProps(__spreadValues({}, style), { text }));
      }
    }
    const out = [];
    runs.forEach((run, i) => {
      if (run.br) {
        out.push(document.createElement("br"));
        return;
      }
      let { text } = run;
      if (i === 0 || runs[i - 1].br) text = text.replace(/^\s+/, "");
      if (i === runs.length - 1 || runs[i + 1].br) text = text.replace(/\s+$/, "");
      if (!text) return;
      const [, lead, core, tail] = text.match(new RegExp("^(\\s*)(.*?)(\\s*)$", "s"));
      const bold = (...nodes) => {
        const b = document.createElement("b");
        b.append(...nodes);
        return b;
      };
      const text1 = document.createTextNode(core);
      const inner = run.bold && !run.boldOuter ? bold(text1) : text1;
      let parts = run.tags ? [document.createTextNode(`[[${run.tags}]${lead}`), inner, document.createTextNode(`${tail}]`)] : [inner];
      if (run.bold && run.boldOuter) parts = [bold(...parts)];
      if (lead && !run.tags) out.push(document.createTextNode(lead));
      if (run.href) {
        const a = document.createElement("a");
        a.href = run.href;
        a.append(...parts);
        out.push(a);
      } else out.push(...parts);
      if (tail && !run.tags) out.push(document.createTextNode(tail));
    });
    return out;
  }
  var SLIDE_TITLE_SIZES = [28, 35, 42, 49, 56, 70];
  var SLIDE_SUBLINE_SIZES = [21, 28, 35, 42, 49, 56, 70];
  var SLIDE_SIZE_DEFAULTS = { title: 42, subline: 28 };
  function slideTextSizes(box) {
    const tally = { title: {}, subline: {} };
    const walker = box.ownerDocument.createTreeWalker(box, 4);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent.trim();
      const sizeEl = text && n.parentElement.closest('[class*="fontsize-"]');
      const step = sizeEl && (String(sizeEl.className).match(/fontsize-(\d+(?:-\d+)?)-?vw/) || [])[1];
      if (step && box.contains(sizeEl)) {
        const role = n.parentElement.closest('[class|="futura-bold"], b, strong') ? "title" : "subline";
        const px = Math.round(parseFloat(step.replace("-", ".")) * 14);
        tally[role][px] = (tally[role][px] || 0) + text.length;
      }
    }
    return [["title", SLIDE_TITLE_SIZES], ["subline", SLIDE_SUBLINE_SIZES]].map(([role, allowed]) => {
      const top = Object.entries(tally[role]).sort((a, b) => b[1] - a[1])[0];
      if (!top) return null;
      const px = allowed.reduce((a, b) => Math.abs(b - top[0]) < Math.abs(a - top[0]) ? b : a);
      return px === SLIDE_SIZE_DEFAULTS[role] ? null : `${role}-${px}`;
    }).filter(Boolean);
  }
  function slideBoxOptions(box) {
    const opts = [];
    const bg = [...box.classList].find((c) => SLIDE_BOXES[c]);
    if (bg) opts.push(SLIDE_BOXES[bg]);
    (box.getAttribute("style") || "").split(";").forEach((decl) => {
      const m = decl.match(/^\s*([a-z-]+)\s*:\s*(-?)(\d+)%\s*$/);
      if (m && SLIDE_SPACING[m[1]]) opts.push(`box-${SLIDE_SPACING[m[1]]}-${m[2] ? "n" : ""}${m[3]}`);
    });
    return opts;
  }
  function slideBoxLines(box, document) {
    return [...box.querySelectorAll("span.line")].map((line) => {
      const heading = line.querySelector("h1, h2, h3");
      const el = document.createElement(heading ? heading.tagName.toLowerCase() : "p");
      el.append(...slideLineNodes(line, document));
      return el;
    }).filter((el) => el.textContent.trim());
  }
  function extractImageSlide(doc, document, v = {}) {
    const carousel = doc.querySelectorAll(".c-autocarousel")[v.index || 0];
    const slide = carousel && carousel.querySelector(".carouselslide");
    if (!slide) return null;
    const desktopEf = slide.querySelector(".experienceFragment-ef");
    const mobileEf = slide.querySelector(".experienceFragment-ef-mobile");
    const overlay = slide.querySelector(".overlayparsys");
    const rows = [];
    const cell = (...nodes) => {
      const c = document.createElement("div");
      c.append(...nodes);
      return c;
    };
    const dm = desktopEf && desktopEf.querySelector("[data-asset-path]");
    const desktopImg = desktopEf && desktopEf.querySelector("img");
    if (dm) rows.push([cell(videoLink(dm, document))]);
    else if (desktopImg) rows.push([cell(imageLink(desktopImg, document))]);
    else return null;
    const mobileImg = mobileEf && mobileEf.querySelector("img");
    if (mobileImg) rows.push([cell(imageLink(mobileImg, document))]);
    const variants = ["image-slide"];
    const styles = [];
    const box = overlay && overlay.querySelector(".c-largeheadline > div.largeheadline");
    const ctas = overlay ? [...overlay.querySelectorAll("a.btn")] : [];
    const first = cell();
    const lines = box ? slideBoxLines(box, document) : [];
    if (lines.length) {
      first.append(...lines);
      variants.push(...slideBoxOptions(box));
      styles.push(...slideTextSizes(box));
    }
    ctas.forEach((a) => {
      const p = document.createElement("p");
      const b = document.createElement("b");
      const link = document.createElement("a");
      link.href = a.getAttribute("href").replace(/^((?:https:\/\/www\.stryker\.com)?\/[^?#]*?)(?:\/index)?\.html(?=[?#]|$)/, (m, path) => /\/index\.html$/.test(m) ? `${path}/` : path);
      link.textContent = a.textContent.trim();
      b.append(link);
      p.append(b);
      first.append(p);
      if (/\bbtn-blue\b/.test(a.className) && !styles.includes("btn-blue")) styles.push("btn-blue");
    });
    if (first.children.length) rows.splice(mobileImg ? 2 : 1, 0, [first]);
    if (overlay) {
      const style = overlay.getAttribute("style") || "";
      const top = style.match(/top\s*:\s*(\d+)%/);
      const pos = style.match(/margin-left\s*:\s*(\d+)%\s*;\s*width\s*:\s*calc\(100%\s*-\s*\d+%\s*-\s*(\d+)%\)/);
      if (top) variants.push(`top-${top[1]}`);
      if (pos) variants.push(`left-${pos[1]}`, `right-${pos[2]}`);
      if (mobileImg && overlay.classList.contains("mobile_Bottom")) variants.push("mobile-below");
      if (overlay.classList.contains("mobile-text-black")) variants.push("mobile-text-black");
    }
    let host = carousel;
    while (host.parentElement && !host.nextElementSibling) host = host.parentElement;
    const panel = host.nextElementSibling && host.nextElementSibling.querySelector(".c-full-bleed-panel");
    if (panel && panel.classList.contains("page-section") && !panel.textContent.trim()) {
      if (panel.classList.contains("bg-golden-gradient")) variants.push("stripe-gradient");
      else if (panel.classList.contains("bg-gold")) variants.push("stripe-gold");
    }
    const block = document.createElement("div");
    block.className = "image-slide";
    block.dataset.variants = variants.join(",");
    block.dataset.styles = styles.join(",");
    rows.forEach((cells) => {
      const row = document.createElement("div");
      row.append(...cells);
      block.append(row);
    });
    return block;
  }
  function columnCell(col, document) {
    const cell = document.createElement("div");
    const sel = "h1, h2, h3, h4, h5, h6, p, ul, ol, img, .s7dm-dynamic-media";
    const parts = [...col.querySelectorAll(sel)].filter((el) => !el.closest("nav, script, noscript")).filter((el) => el.tagName === "IMG" || !el.parentElement.closest(sel));
    parts.forEach((src) => {
      if (src.tagName === "IMG") {
        if (src.getAttribute("src")) cell.append(imageLink(src, document));
      } else if (src.classList.contains("s7dm-dynamic-media")) {
        cell.append(videoLink(src, document));
      } else if (/^(UL|OL)$/.test(src.tagName)) {
        const list = document.createElement(src.tagName.toLowerCase());
        src.querySelectorAll(":scope > li").forEach((li) => {
          const item = document.createElement("li");
          item.append(...inlineNodes(li, document, col));
          if (trimInline(item).textContent) list.append(item);
        });
        if (list.children.length) cell.append(list);
      } else {
        const tag = src.tagName.toLowerCase();
        let el = document.createElement(tag);
        const flush = () => {
          if (trimInline(el).textContent.trim()) cell.append(el);
          el = document.createElement(tag);
        };
        inlineNodes(src, document, col).forEach((n) => {
          const afterBreak = el.lastChild && el.lastChild.nodeName === "BR";
          if (afterBreak && /^(B|I)$/.test(n.nodeName) && !n.textContent.trim()) {
          } else if (afterBreak && n.nodeType === 3) {
            n.textContent = n.textContent.replace(/^\s+/, "");
            if (n.textContent) el.append(n);
          } else if (tag === "p" && afterBreak && n.nodeName === "BR") {
            el.lastChild.remove();
            flush();
          } else {
            el.append(n);
          }
        });
        flush();
      }
    });
    return cell;
  }
  var isGridColumn = (c) => !!c.parentElement && (c.parentElement.classList.contains("aem-Grid") && c.classList.contains("aem-GridColumn") || c.parentElement.classList.contains("row") && /\bcol-/.test(c.className));
  function extractColumns(doc, document, v) {
    let anchors;
    if (v.select) {
      anchors = [...doc.querySelectorAll(v.select)];
    } else {
      anchors = [];
      const walker = doc.createTreeWalker(doc.body, 4);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.textContent.replace(/\s+/g, " ").includes(v.text)) anchors.push(n.parentElement);
      }
    }
    const count = v.count || 2;
    const cols = anchors.map((anchor) => {
      const levels = [];
      for (let a = anchor; a && a !== doc.body; a = a.parentElement) {
        if (isGridColumn(a)) levels.push(a);
      }
      const col = levels[v.up || 0];
      if (!col) return null;
      const siblings = [...col.parentElement.children].filter(isGridColumn);
      const start = siblings.indexOf(col) + (v.offset || 0);
      const run = siblings.slice(Math.max(start, 0), start + count);
      return start >= 0 && run.length === count ? run : null;
    }).find(Boolean);
    if (!cols) return null;
    const row = document.createElement("div");
    row.append(...cols.map((c) => columnCell(c, document)));
    const block = document.createElement("div");
    block.className = "columns-corp";
    block.append(row);
    return block;
  }
  var LIVE_EXTRACTORS = {
    columns: extractColumns,
    "long-text": extractLongText,
    "large-header": extractLargeHeader,
    "image-slide": extractImageSlide,
    "tagline-band": extractTaglineBand
  };
  var FRAGMENTS = {
    "/us/en/fragments/w2/emergency-care-news-2024-sudden-cardiac-arrest-vs-heart-attack-what-you-need-to-know-tab-1": "tabs-related-articles",
    "/us/en/fragments/w2/emergency-care-news-2024-sudden-cardiac-arrest-vs-heart-attack-what-you-need-to-know-tab-2": "tabs-related-products"
  };
  var fragmentPath = (name) => `/drafts/blocks/fragments/${name}`;
  function table(document, rows) {
    return WebImporter.DOMUtils.createTable(rows, document);
  }
  function blockToTable(document, el, name, variants) {
    const header = variants.length ? `${name} (${variants.join(", ")})` : name;
    const rows = [...el.children].map((row) => [...row.children].map((cell) => {
      const wrapper = document.createElement("div");
      const inline = [...cell.children].every((c) => /^(A|B|EM|I|SPAN|STRONG|SUB|SUP|U|BR)$/.test(c.tagName));
      if (inline && cell.children.length && cell.textContent.trim()) {
        const p = document.createElement("p");
        p.append(...cell.childNodes);
        wrapper.append(p);
      } else {
        wrapper.append(...cell.childNodes);
      }
      return wrapper;
    }));
    return table(document, [[header], ...rows]);
  }
  function sectionMetadata(document, styles) {
    return styles.length ? table(document, [["Section Metadata"], ["style", styles.join(", ")]]) : null;
  }
  function absolutize(root, pageUrl) {
    root.querySelectorAll("[src], [href], [srcset]").forEach((el) => {
      ["src", "href"].forEach((a) => {
        const v = el.getAttribute(a);
        if (v && v.startsWith("./")) el.setAttribute(a, new URL(v, pageUrl).href);
      });
      const ss = el.getAttribute("srcset");
      if (ss) {
        el.setAttribute("srcset", ss.split(",").map((s) => s.trim().replace(/^\S+/, (u) => u.startsWith("./") ? new URL(u, pageUrl).href : u)).join(", "));
      }
    });
  }
  function rewriteFragmentLinks(root) {
    root.querySelectorAll("a[href]").forEach((a) => {
      const name = FRAGMENTS[new URL(a.getAttribute("href"), "https://x").pathname];
      if (!name) return;
      a.setAttribute("href", fragmentPath(name));
      a.textContent = fragmentPath(name);
    });
  }
  var import_corp_block_library_default = {
    // collect every variant of the requested block from its source page(s) into
    // <div data-block data-variants data-styles> holders, one per variant
    onLoad: (_0) => __async(null, [_0], function* ({ document }) {
      const here = new URL(document.location.href);
      const blockName = here.searchParams.get("block");
      if (!blockName) return;
      const holders = yield Promise.all((DOCS[blockName] || []).map((v) => __async(null, null, function* () {
        var _a, _b;
        const pageUrl = `${here.origin}${v.page}`;
        const holder = document.createElement("div");
        holder.dataset.block = blockName;
        holder.dataset.source = `${pageUrl} (${v.source})`;
        if (v.live) {
          const resp2 = yield fetch(pageUrl);
          const doc = new DOMParser().parseFromString(resp2.ok ? yield resp2.text() : "", "text/html");
          const el2 = LIVE_EXTRACTORS[v.source](doc, document, v);
          if (el2) {
            absolutize(el2, pageUrl);
            holder.dataset.variants = (_a = el2.dataset.variants) != null ? _a : (v.variants || []).join(",");
            holder.dataset.styles = (_b = el2.dataset.styles) != null ? _b : (v.styles || []).join(",");
            delete el2.dataset.variants;
            delete el2.dataset.styles;
            holder.append(el2);
          }
          return holder;
        }
        const resp = yield fetch(`${pageUrl}.plain.html`);
        const tpl = document.createElement("template");
        tpl.innerHTML = resp.ok ? yield resp.text() : "";
        const section = [...tpl.content.children].find((s) => [...s.children].some((c) => c.classList.contains(v.source)));
        const el = section && [...section.children].find((c) => c.classList.contains(v.source));
        if (el) {
          absolutize(el, pageUrl);
          rewriteFragmentLinks(el);
          holder.dataset.variants = (v.variants || [...el.classList].slice(1)).join(",");
          holder.dataset.styles = [...section.classList].join(",");
          holder.append(el);
        }
        return holder;
      })));
      document.body.replaceChildren(...holders);
    }),
    transform: (payload) => {
      const { document, url, params } = payload;
      const source = new URL(params.originalURL || url);
      const blockName = source.searchParams.get("block");
      const fragmentName = source.searchParams.get("fragment");
      const main = document.createElement("div");
      const split = (s) => s ? s.split(",").filter(Boolean) : [];
      const found = [];
      const missing = [];
      let path;
      if (fragmentName) {
        [...document.body.children].filter((el) => el.tagName === "DIV").forEach((section, i) => {
          if (i) main.append(document.createElement("hr"));
          [...section.children].forEach((child) => {
            const [cls] = child.classList;
            if (child.tagName === "DIV" && cls) {
              found.push(cls);
              main.append(blockToTable(document, child, cls, [...child.classList].slice(1)));
            } else {
              main.append(child);
            }
          });
          const meta = sectionMetadata(document, [...section.classList]);
          if (meta) main.append(meta);
        });
        path = fragmentPath(fragmentName);
      } else {
        [...document.body.children].forEach((holder, i) => {
          const el = holder.firstElementChild;
          if (!el) {
            missing.push(holder.dataset.source);
            return;
          }
          if (i) main.append(document.createElement("hr"));
          const variants = split(holder.dataset.variants);
          found.push(variants.length ? `${blockName} (${variants.join(", ")})` : blockName);
          main.append(blockToTable(document, el, blockName, variants));
          const meta = sectionMetadata(document, split(holder.dataset.styles));
          if (meta) main.append(meta);
        });
        path = `/drafts/blocks/${blockName}`;
      }
      document.body.replaceChildren(main);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(path),
        report: {
          title: fragmentName ? `${fragmentName} (fragment)` : blockName,
          template: PAGE_TEMPLATE.name,
          blocks: found,
          missing
        }
      }];
    }
  };
  return __toCommonJS(import_corp_block_library_exports);
})();
