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

  // tools/importer/import-news-detail.js
  var import_news_detail_exports = {};
  __export(import_news_detail_exports, {
    default: () => import_news_detail_default
  });

  // tools/importer/parsers/hero-image-slide.js
  function copyImage(source, document) {
    const img = document.createElement("img");
    img.setAttribute("src", source.getAttribute("src"));
    img.setAttribute("alt", source.getAttribute("alt") || "");
    return img;
  }
  function clean(text3) {
    return (text3 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function headline(overlay, document) {
    const out = [];
    const headings = [...overlay.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const lineEls = [...overlay.querySelectorAll(".line")];
    let lines = headings.length ? headings : [...overlay.querySelectorAll(".line, p")];
    if (headings.length && lineEls.length) {
      lines = lineEls.map((line) => line.querySelector("h1, h2, h3, h4, h5, h6") || line);
    }
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
      overlay.querySelectorAll(".curatedcta a.btn[href]").forEach((btn) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.setAttribute("href", btn.getAttribute("href"));
        a.textContent = clean(btn.textContent);
        strong.append(a);
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
    element.replaceWith(WebImporter.Blocks.createBlock(document, {
      name: `Hero Corp (${variants.join(", ")})`,
      cells
    }));
  }

  // tools/importer/parsers/cards-corp-teaser.js
  function clean2(text3) {
    return (text3 || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function link(document, source, text3) {
    const a = document.createElement("a");
    a.setAttribute("href", source.getAttribute("href"));
    a.textContent = text3;
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
    if (title && clean2(title.textContent)) {
      const h3 = document.createElement("h3");
      const titleLink = title.querySelector("a[href]");
      if (titleLink) h3.append(link(document, titleLink, clean2(titleLink.textContent)));
      else h3.textContent = clean2(title.textContent);
      body.push(h3);
    }
    item.querySelectorAll(".desc-container > p, :scope > p.description").forEach((source) => {
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
    const items = [...element.querySelectorAll(".item")].filter((item) => item.querySelector("img, h3"));
    if (!items.length) return;
    const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
    const cols = items[0].className;
    let variant = "";
    if (/\bcol-sm-4\b/.test(cols)) variant = ", three-up";
    else if (/\bcol-sm-6\b/.test(cols)) variant = ", two-up";
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: `Cards Corp (teaser${variant})`, cells }));
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
  function parse3(element, { document }) {
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
  function parse4(element, { document }) {
    const link2 = videoLink(element, document);
    if (!link2) return;
    const cells = [[link2]];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Video", cells }));
  }

  // tools/importer/parsers/news-detail/marketo-form.js
  function parse5(element, { document }) {
    const form = element.querySelector("form[data-marketo-form-id]");
    const read = (name) => (form && form.getAttribute(name) || "").trim();
    const rows = [
      ["Base URL", read("data-marketo-base-url")],
      ["Munchkin ID", read("data-marketo-munchkin-id")],
      ["Form ID", read("data-marketo-form-id")]
    ];
    if (rows.some(([, value]) => !value)) {
      element.remove();
      return;
    }
    rows.push(
      ["Captcha Script", "https://www.stryker.com/etc.clientlibs/stryker/components/content/altcha/altcha.js"],
      ["Captcha Challenge URL", "https://www.stryker.com/bin/stryker/captcha/challenge"]
    );
    const cells = rows.map(([key, value]) => {
      const k = document.createElement("div");
      k.textContent = key;
      const v = document.createElement("div");
      v.textContent = value;
      return [k, v];
    });
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "marketo-form", cells }));
  }

  // tools/importer/transformers/news-representative-normalise.js
  var GROUPS = [
    {
      name: "sustainability-news",
      paths: [
        "/us/en/sustainability/news/supplychainweek.html",
        "/us/en/sustainability/news/asc.html",
        "/us/en/sustainability/news/ep.html",
        "/us/en/sustainability/news/expectmore.html",
        "/us/en/sustainability/news/leader.html",
        "/us/en/sustainability/news/lca0.html",
        "/us/en/sustainability/news/say-yes-to-reprocessing.html",
        "/us/en/sustainability/news/quality-you-can-count-on--five-quality-standards-in-medical-devi.html"
      ]
    }
  ];
  var SUBHEAD_MAX = 160;
  var squash = (el) => (el.textContent || "").replace(/[\s\u00a0]+/g, " ").trim();
  function unwrapFontSpans(el) {
    el.querySelectorAll('span[class*="fontsize-"], span.urw-egyptienne, span.futura-bold, span.futura, span.humanist').forEach((span) => {
      if (span.closest("sup")) return;
      span.replaceWith(...span.childNodes);
    });
  }
  function toSubhead(el, doc) {
    const h4 = doc.createElement("h4");
    h4.append(doc.createElement("br"), squash(el));
    el.replaceWith(h4);
    return h4;
  }
  function toCopy(el, doc) {
    unwrapFontSpans(el);
    const trim = (pick) => {
      for (let n = pick(); n && (n.nodeType === 3 && !n.textContent.trim() || n.nodeName === "BR"); n = pick()) n.remove();
    };
    trim(() => el.firstChild);
    trim(() => el.lastChild);
    const lead = el.firstChild;
    if (lead && lead.nodeType === 3) lead.textContent = lead.textContent.replace(/^(\s*\d+\.)[\s\u00a0]+/, "$1 ");
    const p = doc.createElement("p");
    const span = doc.createElement("span");
    span.className = "fontsize-1-25em";
    span.append(...el.childNodes);
    p.append(span);
    el.replaceWith(p);
    return p;
  }
  function isBoldLine(p) {
    const text3 = squash(p);
    if (!text3 || text3.length > SUBHEAD_MAX || p.querySelector("a, img, picture")) return false;
    const bold = [...p.querySelectorAll("b, strong, span.futura-bold")].filter((b) => !b.parentElement.closest("b, strong, span.futura-bold")).map(squash).join(" ").replace(/\s+/g, " ").trim();
    return bold === text3;
  }
  function normaliseRichText(rte, doc) {
    const box = rte.querySelector(":scope > div") || rte;
    [...box.children].forEach((el) => {
      const text3 = squash(el);
      if (!text3) return;
      if (el.tagName === "H3") {
        if (el.querySelector('span[class*="fontsize-8em"]') || text3.length > SUBHEAD_MAX) toCopy(el, doc);
        else toSubhead(el, doc);
      } else if (el.tagName === "H4") {
        toSubhead(el, doc);
      } else if (el.tagName === "P" && isBoldLine(el)) {
        toSubhead(el, doc);
      } else if (el.tagName === "P" && el.querySelector('span[class*="fontsize-1-25em"], span.urw-egyptienne')) {
        toCopy(el, doc);
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const url = payload.params && payload.params.originalURL || payload.url || "";
    let path = "";
    try {
      path = new URL(url).pathname.toLowerCase();
    } catch (e) {
      return;
    }
    const group = GROUPS.find((g) => g.paths.includes(path));
    if (!group) return;
    const doc = element.ownerDocument;
    element.querySelectorAll(".c-rich-text-editor").forEach((rte) => {
      if (rte.closest(".experiencefragment, form, header, footer, .c-disclaimer")) return;
      normaliseRichText(rte, doc);
    });
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

  // tools/importer/transformers/news-detail-sections.js
  var SOURCE_ORIGIN2 = "https://www.stryker.com";
  var COMPONENTS = [
    ".c-autocarousel",
    // a Full Width Image (.fullWidthImage: the container-wide image, e.g. Eli's osteoid
    // osteoma story), before its parts are taken for components
    ".fullWidthImage",
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
    // a Latest News list ("Related stories" cards, e.g. the DE&I Summit feature) imports like
    // the related-content grid
    ".c-latestnews",
    ".c-section-separator",
    ".sectionseparator",
    ".c-marketo-form",
    ".c-resourcesanddownload",
    // an Accordion (e.g. the FAQs of the AED pad placement guide); its panels' rich texts
    // are part of it, not article text of their own
    ".c-accordion:not(.edit-header)",
    // a Curated Link List (e.g. the "Learn more" links under the police car AED article)
    ".c-curated-link-list",
    ".xf-fragment"
  ].join(", ");
  var SHARED_XF_SIGNATURES = [
    ["Connect with us Have feedback", "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master"],
    ["Contact Information Customer support product feedback", "/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master"],
    ["Contact information Product feedback Customer service", "/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master"],
    ["Resources Explore Sage homepage", "/content/experience-fragments/stryker/sage/en/footer/footer/master"],
    ["Resources Explore Acute Care homepage", "/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master"],
    ["Resources Explore Emergency Care homepage", "/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master"],
    ["Colonoscopy and colorectal cancer screening procedures are on the rise", "/content/experience-fragments/stryker/surgical-technologies/en/news/technology-helps-imp/body-copy/master"],
    ["Research and development (R&D) play a crucial role in improving the health", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker-boosts-innovation-r-and-d-expands-with-medical-device-testing-facility/body-copy/master"],
    ["2-minute read More than 350,000 people experience a sudden cardiac arrest", "/content/experience-fragments/stryker/emergency-care/en/news/why-all-police-cars-need-aeds/body"],
    ["2-minute read When it comes to medical emergencies like sudden cardiac arrest", "/content/experience-fragments/stryker/emergency-care/en/news/understanding-the-basics-of-a-lucas-chest-compression-system/body"],
    ["Dr. Homer Stryker, an orthopaedic surgeon, established The O", "/content/experience-fragments/stryker/corporate/en/about/news/features/_80_years_together/test---body-copy/master"],
    ["Back in 2021, we hosted our first global Diversity, Equity a", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/employees_share_why_/body-copy/master"],
    ["As a patient, preparing for surgery can bring up a mix of em", "/content/experience-fragments/stryker/communications/en/news/_2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite/body-copy/master"],
    ["At Stryker, we care about every patient's journey. And throu", "/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy/master"],
    ["These offerings are designed to help advance product and pro", "/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy-2/master"],
    ["Whether it be a healthcare emergency, natural disaster or un", "/content/experience-fragments/stryker/corporate/en/about/news/features/putting_people_first/body-copy/master"],
    ["What if joint replacement surgery could do more for surgeons", "/content/experience-fragments/stryker/corporate/en/about/news/features/mako_smartrobotics_h/body-text/master"],
    ["No parent is prepared to hear that their newborn baby has a ", "/content/experience-fragments/stryker/corporate/en/about/news/features/mother_and_son_take_/body-copy/master"],
    ["When Pam Mizerany, RN, learned that one of her best friends ", "/content/experience-fragments/stryker/corporate/en/about/news/features/some_people_say_they/body-copy/master"],
    ["\u201CI get to look back at all the things I\u2019ve accomplished over", "/content/experience-fragments/stryker/corporate/en/patient/jordan_3_17_23/jordan/master"],
    ["\u201CI told Sue in person how very grateful I was that she\u2019d mad", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/springing_into_actio/body-copy/master"],
    ["Boris was driving his grandson Benjamin to soccer practice w", "/content/experience-fragments/stryker/corporate/en/patient/boris_story_5_15_23/news-content/master"],
    ["\u201CIn life there are hard things, and there are good things. A", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/katherine_s_catastro/body-copy/master"],
    ["When Lin was diagnosed with stage 3 colon cancer, he was tol", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/defying_the_odds/body-content/master"],
    ["Last year, we shared an ambitious carbon reduction goal that", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/woman_holding_recycl/body-copy/master"],
    ["Out-of-hospital sudden cardiac arrest can happen anywhere, w", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/why_aeds_belong_on_b/body-copy/master"],
    ["In 2007, Emily began experiencing muscle spasms in her jaw.", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/restoring_form_funct/body/master"],
    ["Heart attack and sudden cardiac arrest (SCA) are very different events, requiring unique", "/content/experience-fragments/stryker/corporate/en/about/news/features/is_it_a_heart_attack/body-copy/master"],
    ["Osteoarthritis is the most common form of arthritis, impacti", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/carolyn_s_mako_total/body-copy/master"],
    ["When Janet fell to the floor after tripping on the stairs in", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/focusing_on_her_mobi/body-copy/master"],
    ["Our passionate employees are behind everything we do, includ", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/three_things_to_know/body-copy/master"],
    ["Learn how Stryker incorporated the latest healthcare technol", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/tour_the_amsterdam_s/body-copy/master"],
    ["Bracing for the COVID-19 pandemic surges that have swelled a", "/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_donates_22_5/text/text/master"],
    ["What are the symptoms and signs of stroke?", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/what_are_the_symptom/body-copy/master"],
    ["Day in and day out, healthcare workers navigate the complexi", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/a_partnership_promot/body-copy/master"],
    ["3-minute read Sudden cardiac arrest (SCA) affects more than 347,000", "/content/experience-fragments/stryker/emergency-care/en/news/help-increase-patient-outcomes-both-in-and-out-of-the-hospital/body"],
    ["Nurses are at the forefront of innovation within healthcare systems", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/these_nurses_share_h/body-copy/master1"],
    ["Together, Stryker and Operation Smile are changing lives and strengthe", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/transforming_confide/body-copy/master"],
    ["Hispanic Heritage Month is celebrated between September 15 and October 15", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/celebrating_hispanic/body-copy/master"],
    ["More about Stryker\u2019s Mako SmartRobotics\u2122 Our robotic surgery expertise", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/mako_robotics_drivin/infographic-text/master"],
    ["Values align for military members and veterans at Stryker", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/military_members_on_/body-copy/master11"],
    ["Humans are fallible and errors are unavoidable, even in the best organ", "/content/experience-fragments/stryker/surgical-technologies/en/news/the_journey_to_zero_/body-copy/master"],
    ["Julie Greenhalgh, RN, BSN, CNOR, never smoked a day in her life", "/content/experience-fragments/stryker/surgical-technologies/en/news/protect_your_patient/body-copy/master"],
    ["At Stryker, we believe that Pride is more than a single month or momen", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/a_safe_space_at_stry/body-copy/master"],
    ["Victoria lived with back pain for years \u2013 impeding her ability to walk", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/back_pain_and_scolio/body-copy/master"],
    ["Knowing the warning signs of sudden cardiac arrest helped saved his li", "/content/experience-fragments/stryker/corporate/en/patient/derrick_10_2_23/derrick/master"],
    ["2-minute read Sudden cardiac arrest is a life-threatening condition th", "/content/experience-fragments/stryker/emergency-care/en/news/when-to-use-and-aed/body"],
    ["Confined to a single operating room suite and the constant need to ada", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_stryker_is_innov/body-copy/master"],
    ["In the gastrointestinal (GI) suite, a focus on safety is often associa", "/content/experience-fragments/stryker/surgical-technologies/en/news/how_technology_helps/how-technology-helps-address-gi-suite-challenges/master"],
    ["Stryker's Global Volunteer Network highlights importance of volunteeri", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_s_global_vol/body/master"],
    ["According to the American Heart Association, many people who\u2019ve had a", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/five_things_you_need/body-copy/master"],
    ["Making healthcare better is our mission, but it doesn\u2019t belong to us a", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/promoting_high_quali/body-copy/master"],
    ["Arthritis is a widespread health challenge, serving as the leading cau", "/content/experience-fragments/stryker/corporate/en/about/news/-2026/features/myths-realities-and-real-innovation-what-everyone-should-know-about-arthritis/myths--realities-and-real-innovation--what-everyone-should-know/master"],
    ["To help improve patient outcomes, Stryker provides extensive medical e", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/advancing_healthcare/body-copy/master"],
    ["The facts are staggering. An estimated 1.3 million Americans are livin", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_is_doubling_/body-text/master"],
    ["2-minute read If you\u2019re a business owner or responsible for monitoring", "/content/experience-fragments/stryker/emergency-care/en/news/3-ways-aed-remote-monitoring-makes-a-difference/blog"],
    ["For under-resourced countries around the world, healthcare professionals", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/stryker_gets_medical/2-8-24-body-copy/master"],
    ["When Amanda Baumann started at Mako Surgical Corp. in 2008, she was wor", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/women_leading_the_ch/body/master"],
    ["Walk through the halls of 1941 Stryker Way in Portage, Michigan and", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/a_building_well_done/body/master"],
    ["They are our advocates in times of need, and they account for 59% of", "/content/experience-fragments/stryker/corporate/en/about/news/features/nurses_a_key_driver_/body-content/master"],
    ["The streets of north Philadelphia are no strangers to poverty and violence.", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/this_surgical_icu_te/this-surgical-icu-team-is-bound-by-unspeakable-trauma-and-miracu/master"],
    ["lost her mother to breast cancer in the middle of", "/content/experience-fragments/stryker/corporate/en/about/news/features/caregiver_klisa/body-copy/master"],
    ["Alongside The Joint Commission, a nonprofit committed to quality imp", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/strykers_journey_to_/infographic/master"],
    ["To improve patient outcomes and make healthcare more accessible for everyone", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/three_ways_stryker_w/body/master"],
    ["cardiac arrest is a life-threatening event when the heart", "/content/experience-fragments/stryker/emergency-care/en/news/why-every-college-campus-needs-accessible-aeds/master"],
    ["on any T.V. medical drama and you're bound to hear the staff", "/content/experience-fragments/stryker/emergency-care/en/news/the-role-of-defibrillation-during-sudden-cardiac-arrest/body"],
    ["workplace emergency is an unforeseen event that can endanger", "/content/experience-fragments/stryker/emergency-care/en/news/how-to-prepare-your-workplace-for-a-sudden-cardiac-emergency/master"],
    ["a job, chasing around two goldendoodles at home and planning", "/content/experience-fragments/stryker/corporate/en/about/news/features/a_winning_spirit/a-winning-spirit/master"],
    ["are very different events, each presenting specific signs and symptoms", "/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/five_things_to_know_/body-copy/master"],
    ["Alzheimer\u2019s Association estimates that 6.5 million Americans", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/what_it_s_like_being/body-copy/master"],
    ["Senior leaders from our South Pacific team are applying our people", "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-1/master"],
    ["Karen O\u2019Keeffe, Sean Maasburg, James Doyle, Jessica Mazzulo", "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/mentors/master"],
    ["The mentorship experience has proven invaluable to AIME's", "/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-2/master"],
    ["Schanderl is head of a first responder unit in Munich, Germany", "/content/experience-fragments/stryker/emergency-care/en/news/12-year-old-girl-experiences-cardiac-arrest-stryker-employee-re/body"],
    ["and ambulatory surgery centers are facing a unique challenge", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/master"],
    ["the OR of the Future Stryker\u2019s OR of the Future bridges", "/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/body-copy-2"],
    ["up to one million patients experience a fall while being treated", "/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-1/master"],
    ["ProCuity by the numbers", "/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-2/master"],
    ["recently held our first global diversity, equity and inclusion", "/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_holds_divers/body-copy/master"],
    ["an EMT is a demanding job, both physically and emotionally", "/content/experience-fragments/stryker/emergency-care/en/news/how-the-right-equipment-can-help-recruit-and-retain-emts-and-par/body"],
    ["sudden cardiac arrest is a leading cause of death in the", "/content/experience-fragments/stryker/emergency-care/en/news/four-reasons-every-school-should-have-an-aed/master"],
    ["innovation in healthcare requires viewpoints that reflect", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/body-copy/master"],
    ["Stryker employees promote and advance disability inclusion", "/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/more_than_able_to_ma/body-copy/master"],
    ["are few moments in life more important than the time a mother", "/content/experience-fragments/stryker/corporate/en/about/news/features/technologies_that_pr/body-copy/master"],
    ["believe that an automated external defibrillator (AED) program", "/content/experience-fragments/stryker/emergency-care/en/news/5-steps-to-convince-decision-makers-to-adopt-an-aed-program/body"],
    ["than 350,000 people suffer from out-of-hospital sudden cardiac", "/content/experience-fragments/stryker/emergency-care/en/news/8-steps-to-a-successful-aed-safety-program/body"],
    ["and delivery departments and operating rooms are hectic", "/content/experience-fragments/stryker/surgical-technologies/en/news/addressing_or_and_l_/carousel/master"]
  ];
  var BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
  var KEEP_ATTRS = { A: ["href"], IMG: ["src", "alt"], TD: ["colspan", "rowspan"], TH: ["colspan", "rowspan"] };
  function text2(el) {
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
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN2}${href}` : href;
  }
  function newTabHref(source, href) {
    if (!href || href.includes("#") || /^(mailto|tel):/i.test(href)) return href;
    const isPdf = /\.pdf(\?|$)/i.test(href);
    const newTab2 = (source.getAttribute("target") || "").toLowerCase() === "_blank";
    return isPdf || newTab2 ? `${href}#_blank` : href;
  }
  var SIZE_STYLES = [
    // 0.8em (11.2px) copy is small print set in the article (e.g. a references paragraph),
    // on the paragraph's 14px lines (references-body-lines)
    ["fontsize-8em", "disclaimer, references-body-lines"],
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
    const copy = candidates.filter((el) => text2(el) && !el.querySelector("p, li"));
    if (!copy.length) return null;
    const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash2(spans.map((span) => span.textContent).join("")) === squash2(el.textContent);
    });
    const size = SIZE_STYLES.find(([cls]) => covers(cls));
    const font = FONT_STYLES.find(([cls]) => covers(cls));
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
      if (!text2(b) || sameLineText(b, "previousSibling") || sameLineText(b, "nextSibling")) return;
      const block = b.closest("p, li, h1, h2, h3, h4, h5, h6");
      if (!block || block.matches("h1, h2, h3, h4, h5, h6")) return;
      if (!wholeParagraphs && text2(block) === text2(b)) return;
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
    const squash2 = (value) => value.replace(/[\s ]+/g, "");
    [...root.querySelectorAll(".fontsize-1-25em")].forEach((span) => {
      if (span.parentElement.closest(".fontsize-1-25em") || !text2(span)) return;
      if (span.closest("h1")) return;
      const heading = span.closest("h2, h3, h4, h5, h6");
      const block = heading || span.closest("p, li");
      if (!block) return;
      if (!heading && squash2(block.textContent) === squash2(span.textContent)) return;
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
    const blocks = [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")].filter((el) => text2(el));
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
      if (!text2(el) && !el.querySelector("img")) el.remove();
    });
    return { centred, size };
  }
  function plainBoldParagraphs(root) {
    const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.querySelectorAll("p")].filter((p) => {
      const all = squash2(p.textContent);
      if (!all || p.querySelector(".futura-bold")) return false;
      const bold = [...p.querySelectorAll("b")].filter((b) => !b.parentElement.closest("b"));
      return squash2(bold.map((b) => b.textContent).join("")) === all;
    }));
  }
  function futuraLinkParagraphs(root) {
    const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.children].filter((p) => {
      if (p.tagName !== "P") return false;
      const links = p.querySelectorAll("a[href]");
      const all = squash2(p.textContent);
      if (links.length !== 1 || !all || squash2(links[0].textContent) !== all) return false;
      if (/\bbtn\b/.test(links[0].className) || p.querySelector("img")) return false;
      const spans = [...p.querySelectorAll(".futura-bold")].filter((span) => !span.parentElement.closest(".futura-bold"));
      return squash2(spans.map((span) => span.textContent).join("")) === all;
    }));
  }
  function serifHeadings(root) {
    const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.querySelectorAll("h3")].filter((h) => {
      if (!text2(h) || h.querySelector(".futura-bold, b, strong")) return false;
      if (![...h.querySelectorAll("[class]")].some((el) => [...el.classList].some((c) => !c.startsWith("fontsize-")))) return true;
      const spans = [...h.querySelectorAll(".urw-egyptienne")].filter((span) => !span.parentElement.closest(".urw-egyptienne"));
      return squash2(spans.map((span) => span.textContent).join("")) === squash2(h.textContent);
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
  var HEADING_SIZES = [
    ["H2", "fontsize-8em", "h2-0-8"],
    ["H2", "fontsize-1-5em", "h2-1-5"],
    ["H1", "fontsize-1-25em", "h1-1-25"]
  ];
  function smallHeadings(root) {
    const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
    const styles = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2").forEach((h) => {
      if (!text2(h)) return;
      const match = HEADING_SIZES.find(([tag, cls]) => {
        if (h.tagName !== tag) return false;
        const spans = [...h.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
        return squash2(spans.map((span) => span.textContent).join("")) === squash2(h.textContent);
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
  function richTextTitle(component, doc) {
    const p = component.querySelector("p");
    if (!p) return null;
    const nodes = [...p.childNodes];
    const at = nodes.findIndex((node) => node.nodeName === "BR");
    const lead = at < 0 ? nodes : nodes.slice(0, at);
    const squash2 = (value) => value.replace(/[\s ]+/g, " ").trim();
    const leadText = squash2(lead.map((node) => node.textContent).join(""));
    if (!leadText) return null;
    const box = doc.createElement("div");
    lead.forEach((node) => box.append(node.cloneNode(true)));
    const covered = (cls) => squash2([...box.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`)).map((span) => span.textContent).join("")) === leadText;
    let titleStyle = null;
    if (covered("fontsize-1-5em")) titleStyle = covered("fontsize-2em") ? "h1-42" : "h1-21";
    else if (covered("fontsize-2-5em")) titleStyle = "h1-2-5";
    if (!titleStyle || !box.querySelector(".futura-bold, b")) return null;
    const goldOf = (node) => {
      const el = node.parentElement && node.parentElement.closest('[style*="color"]');
      return !!el && box.contains(el) && GOLD.test(ownColour(el));
    };
    const runs = [];
    const walker = doc.createTreeWalker(box, 4);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const gold = goldOf(t);
      const last = runs[runs.length - 1];
      if (last && last.gold === gold) last.text += t.textContent;
      else runs.push({ gold, text: t.textContent });
    }
    const title = runs.map((run) => run.gold && squash2(run.text) ? `[[color-gold]${squash2(run.text)}]` : run.text).join("");
    lead.forEach((node) => node.remove());
    while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
    if (!text2(p)) p.remove();
    const h1 = doc.createElement("h1");
    if (titleStyle === "h1-2-5") {
      const strong = doc.createElement("strong");
      strong.textContent = squash2(title);
      h1.append(strong);
    } else {
      h1.textContent = squash2(title);
    }
    h1.titleStyle = titleStyle;
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
  var squashText = (el) => (el.textContent || "").replace(/[\s\u00a0]+/g, "");
  var isBlankLine = (el) => !!el && /^(P|H3)$/.test(el.tagName) && !el.querySelector("img") && !squashText(el);
  function rawSpacedSubheads(html) {
    if (!html || typeof DOMParser === "undefined") return /* @__PURE__ */ new Set();
    const raw = new DOMParser().parseFromString(html, "text/html");
    return new Set([...raw.querySelectorAll(".c-rich-text-editor h4")].filter((h) => squashText(h) && isBlankLine(h.nextElementSibling)).map(squashText));
  }
  var spacedSubheadTexts = /* @__PURE__ */ new Set();
  function spacedSubheads(root) {
    const subheads = [...root.children].filter((el) => el.tagName === "H4" && squashText(el));
    return subheads.length > 0 && subheads.every((h) => isBlankLine(h.nextElementSibling) || spacedSubheadTexts.has(squashText(h)));
  }
  function lineAboveSubheads(root) {
    const subheads = [...root.children].filter((el) => el.tagName === "H4" && squashText(el));
    const opensWithBreak = (h) => {
      const first = [...h.childNodes].find((n) => n.nodeType !== 3 || n.textContent.trim());
      return !!first && first.nodeName === "BR";
    };
    return subheads.length > 0 && subheads.every(opensWithBreak);
  }
  function previousRichText(component) {
    const item = component.closest(".text");
    const prev = item && item.previousElementSibling;
    return prev && prev.matches(".text") ? prev.querySelector(".c-rich-text-editor") : null;
  }
  function unspaced(component, side) {
    const box = component && component.querySelector(":scope > div[style]");
    const style = box ? box.getAttribute("style") : "";
    return !new RegExp(`(margin|padding)-${side}:\\s*[\\d.]+`).test(style);
  }
  function richTextNodes(component, doc) {
    const box = doc.createElement("div");
    const source = component.querySelector(":scope > div") || component;
    box.innerHTML = source.innerHTML;
    labelHeadingsToParagraphs(box);
    splitStyledLeads(box);
    const plainBold = plainBoldParagraphs(box);
    const futuraLinks = futuraLinkParagraphs(box);
    const serifHeads = serifHeadings(box);
    const smallHeads = smallHeadings(box);
    const lineAbove = lineAboveSubheads(box);
    const spaced = !lineAbove && spacedSubheads(box);
    const elementStyles = new Map([...box.children].map((el) => [el, copyStyles(el)]));
    const indents = new Map([...box.querySelectorAll(':scope > p[style*="margin-left"]')].map((p) => {
      const px = (p.getAttribute("style").match(/margin-left:\s*(\d+)px/) || [])[1];
      return [p, Math.round(Number(px || 0) / 40)];
    }).filter(([, level]) => level > 0));
    const { centred, size } = cleanRichText(box);
    indents.forEach((level, p) => {
      if (!box.contains(p)) return;
      for (let i = 0; i < level; i += 1) bracketTag([...p.childNodes], "indent", p);
    });
    const nodes = blockNodes(box, doc);
    nodes.forEach((node) => {
      if (plainBold.has(node)) node.boldBody = true;
      if (futuraLinks.has(node)) {
        const link2 = node.querySelector("a");
        link2.textContent = link2.textContent.trim();
        const strong = doc.createElement("strong");
        strong.append(link2);
        node.replaceChildren("[[color-teal]", strong, "]");
        node.boldBody = true;
        node.followsText = true;
      }
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
    const blue = !component.closest(".colctrl") && source.matches(".has-background.bg-blue");
    const boxStyles = blue ? [source.querySelector(".urw-egyptienne") ? "serif" : "", "blue-box"] : [];
    nodes.forEach((node) => {
      if (node.copyStyle === null) node.copyStyle = first ? first.copyStyle : size || "";
      if (spaced) node.copyStyle = [node.copyStyle, "h4-spaced"].filter(Boolean).join(", ");
      if (lineAbove) node.copyStyle = [node.copyStyle, "h4-line-above"].filter(Boolean).join(", ");
      if (blue) {
        const styles = (node.copyStyle || "").split(", ").filter(Boolean);
        node.copyStyle = [.../* @__PURE__ */ new Set([...styles, ...boxStyles.filter(Boolean)])].join(", ");
      }
    });
    return { nodes, centred, size };
  }
  function imageColumnStyle(component) {
    const col = component.closest('[class*="col-sm-"]');
    const match = col && col.className.match(/\bcol-sm-(4|6)\b/);
    if (!match) return "";
    const others = [...col.parentElement.children].filter((el) => el !== col);
    if (others.some((el) => text2(el) || el.querySelector("img, video, iframe"))) return "";
    return match[1] === "4" ? "image-1-3" : "image-1-2";
  }
  function photoTextRow(component) {
    const col = component.closest('.colctrl [class*="col-sm-"]');
    const row = col && col.parentElement;
    if (!row || !row.closest(".colctrl")) return null;
    const cols = [...row.children];
    if (cols.length !== 2) return null;
    const widths = cols.map((c) => Number((c.className.match(/\bcol-sm-(\d+)\b/) || [])[1]));
    const variants = { "4-8": "columns-33-67", "8-4": "columns-67-33", "6-6": "columns-50-50" };
    const variant = variants[widths.join("-")];
    if (!variant) return null;
    const media = "img, video, iframe, .c-standalone-image, .c-standalone-video";
    const photoCol = cols.find((c) => c.querySelectorAll(".c-standalone-image").length === 1 && c.querySelectorAll("img").length === 1 && c.querySelectorAll(".c-rich-text-editor").length <= 1);
    const textCol = photoCol && cols.find((c) => c !== photoCol);
    if (!textCol || textCol.querySelector(media)) return null;
    const texts = [...textCol.querySelectorAll(".c-rich-text-editor")].filter((t) => text2(t));
    if (!texts.length) return null;
    if (variant !== "columns-50-50" && !/\bcol-sm-4\b/.test(photoCol.className)) return null;
    return {
      photo: photoCol.querySelector(".c-standalone-image"),
      caption: photoCol.querySelector(".c-rich-text-editor"),
      texts,
      photoFirst: cols[0] === photoCol,
      name: `Columns (${variant})`
    };
  }
  function imageRow(component) {
    const col = component.closest('.colctrl [class*="col-sm-"]');
    const row = col && col.parentElement;
    if (!row || !row.closest(".colctrl")) return null;
    const cols = [...row.children];
    if (cols.length < 2) return null;
    const images = cols.map((c) => {
      const found = c.querySelectorAll(".c-standalone-image");
      if (!found.length && !text2(c) && !c.querySelector("img, video, iframe")) return "empty";
      const own = found.length === 1 && text2(c) === text2(found[0]);
      return own && c.querySelectorAll("img").length === 1 ? found[0] : null;
    });
    const filledCount = images.filter((image) => image && image !== "empty").length;
    return images.every(Boolean) && filledCount >= 2 ? images : null;
  }
  function textRow(component) {
    const col = component.closest('.colctrl [class*="col-sm-"]');
    const row = col && col.parentElement;
    if (!row || !row.closest(".colctrl")) return null;
    const cols = [...row.children];
    if (cols.length < 2 || cols.some((c) => c.className !== cols[0].className)) return null;
    const texts = cols.map((c) => {
      if (!text2(c) && !c.querySelector("img, video, iframe")) return "empty";
      const found = c.querySelectorAll(".c-rich-text-editor");
      const only = found.length === 1 && !c.querySelector("img, video, iframe, .c-largeheadline, .c-curatedcta") && text2(c) === text2(found[0]) && !found[0].querySelector(".has-background, .dimensional-box");
      return only ? found[0] : null;
    });
    return texts.every(Boolean) && texts.filter((t) => t !== "empty").length >= 2 ? texts : null;
  }
  function goldBoxRow(component) {
    const col = component.closest('.colctrl [class*="col-sm-"]');
    const row = col && col.parentElement;
    if (!row || !row.closest(".colctrl")) return null;
    const cols = [...row.children];
    if (cols.length < 2) return null;
    const boxes = cols.map((c) => {
      const found = c.querySelectorAll(".c-rich-text-editor");
      return found.length === 1 && found[0].querySelector(".has-background.bg-gold") && !c.querySelector("img, video, iframe") ? found[0] : null;
    });
    return boxes.every(Boolean) ? boxes : null;
  }
  function dropBracketTags(root) {
    const walker = root.ownerDocument.createTreeWalker(root, 4);
    let open = 0;
    let node = walker.nextNode();
    while (node) {
      let value = node.textContent.replace(/\[\[[a-z0-9,-]+\]/g, () => {
        open += 1;
        return "";
      });
      while (open > 0 && value.includes("]")) {
        value = value.replace("]", "");
        open -= 1;
      }
      node.textContent = value;
      node = walker.nextNode();
    }
  }
  function goldBoxCell(component, doc) {
    const { nodes } = richTextNodes(component, doc);
    nodes.filter((node) => node.tagName === "P").forEach((p) => {
      dropBracketTags(p);
      p.querySelectorAll("em > strong:only-child, strong > em:only-child").forEach((inner) => {
        const outer = inner.parentElement;
        const strong = doc.createElement("strong");
        strong.append(...inner.childNodes);
        outer.replaceWith(strong);
      });
      const lead = p.firstElementChild;
      const first = [...p.childNodes].find((n) => n.nodeType !== 3 || n.textContent.trim());
      if (!lead || first !== lead || lead.tagName !== "STRONG") return;
      while (lead.lastChild && lead.lastChild.nodeName === "BR") lead.lastChild.remove();
      const next = lead.nextSibling;
      if (next && next.nodeName !== "BR") next.before(doc.createElement("br"));
      p.querySelectorAll("br").forEach((br) => {
        const after = br.nextSibling;
        if (after && after.nodeType === 3) after.textContent = after.textContent.replace(/^\s+/, "");
      });
    });
    return nodes;
  }
  function videoCaption(component) {
    const caption = component.querySelector(".desc-content");
    if (!caption) return [];
    const nodes = [...caption.querySelectorAll("p, h2, h3, h4")].filter((p) => text2(p));
    caption.remove();
    return nodes;
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
        if (!text2(title)) return;
        const h4 = doc.createElement("h4");
        h4.textContent = text2(title);
        const titleLink = title.querySelector("a[href]");
        const imageLink = component.querySelector("a[href] img") && component.querySelector("a[href] img").closest("a");
        if (titleLink && imageLink && titleLink.getAttribute("href") === imageLink.getAttribute("href")) {
          h4.tileHref = newTabHref(titleLink, absoluteAsset(titleLink.getAttribute("href")));
        }
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
      a.textContent = text2(source);
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
      if (!text2(line)) return null;
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
    return headline2 && text2(headline2) ? headline2 : null;
  }
  function videoRichTextAside(video) {
    const col = video.closest('[class*="col-sm-8"]');
    const row = col && col.parentElement;
    const aside = row && [...row.children].find((el) => el !== col && /\bcol-sm-4\b/.test(el.className));
    if (!aside || aside.querySelector(".c-largeheadline, .c-marketo-form, img, video, iframe, [data-asset-path]")) return null;
    const first = aside.querySelector(".c-rich-text-editor");
    const box = first && first.querySelector('.has-background, [class*="bg-light-gray"]');
    return box && text2(box) ? first : null;
  }
  function boldInTextItalic(nodes, doc) {
    nodes.forEach((node) => node.querySelectorAll("strong").forEach((strong) => {
      if (strong.closest("em") || text2(strong) === text2(node)) return;
      const em = doc.createElement("em");
      strong.replaceWith(em);
      em.append(strong);
      const first = strong.firstChild;
      const last = strong.lastChild;
      if (first && first.nodeType === 3 && /^[\s ]/.test(first.textContent)) {
        first.textContent = first.textContent.replace(/^[\s ]+/, "");
        em.before(doc.createTextNode(" "));
      }
      if (last && last.nodeType === 3 && /[\s ]$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/[\s ]+$/, "");
        em.after(doc.createTextNode(" "));
      }
    }));
  }
  function leadNodes(component) {
    const box = component.ownerDocument.createElement("div");
    box.innerHTML = component.innerHTML;
    cleanRichText(box);
    return [...box.querySelectorAll("p")].filter((p) => text2(p));
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
    if (!rte || !text2(rte) || aside.querySelector("img, video, iframe, .c-standalone-video")) return null;
    if ([...row.children].indexOf(aside) < [...row.children].indexOf(col)) return null;
    return rte;
  }
  function videoTextColumns(video, rte, doc) {
    const link2 = videoLink(video, doc);
    const { nodes } = richTextNodes(rte, doc);
    if (!link2 || !nodes.length) return null;
    const media = doc.createElement("p");
    media.append(link2);
    const block = WebImporter.Blocks.createBlock(doc, {
      name: "Columns (columns-50-50)",
      cells: [[media, nodes]]
    });
    const copy = nodes.map((n) => n.copyStyle).find((c) => c);
    return { block, copy };
  }
  function quoteNodes(headline2, doc, { sizes = false } = {}) {
    const box = doc.createElement("div");
    box.innerHTML = headline2.innerHTML;
    if (sizes) {
      box.querySelectorAll(".fontsize-1-25em").forEach((span) => {
        [span, ...span.querySelectorAll("*")].reverse().forEach((el) => {
          while (el.lastChild && (el.lastChild.nodeName === "BR" || el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim())) {
            el.after(el.lastChild);
          }
        });
      });
      tagTextSize(box);
    }
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
    box.querySelectorAll("strong").forEach((strong) => {
      if (!strong.querySelector(":scope > br")) return;
      const parts = [doc.createElement("strong")];
      [...strong.childNodes].forEach((node) => {
        if (node.nodeName === "BR") parts.push(node, doc.createElement("strong"));
        else parts[parts.length - 1].append(node);
      });
      strong.replaceWith(...parts.filter((part) => part.nodeName === "BR" || text2(part)));
    });
    const out = [];
    const blocks = box.querySelectorAll("p").length ? [...box.querySelectorAll("p")] : [box];
    blocks.forEach((block) => {
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
  var BLANK = /[\s\u00a0\u00ad\u2800\u3164\u200e\u200b]/g;
  var DIVIDER = /_{3,}/;
  function fragmentBlock(path, doc) {
    const a = doc.createElement("a");
    a.setAttribute("href", path);
    a.textContent = path;
    return WebImporter.Blocks.createBlock(doc, { name: "fragment", cells: [[a]] });
  }
  function markSharedFragments(main, doc) {
    const inlined = [];
    main.querySelectorAll(".experiencefragment").forEach((xf) => {
      if (!xf.isConnected || xf.closest("header, footer, .modal")) return;
      const signature = text2(xf);
      const match = SHARED_XF_SIGNATURES.find(([start]) => signature.startsWith(start) || start.length >= 40 && signature.includes(start));
      const path = match && xfFragmentPath(match[1]);
      if (!path) {
        if (signature) inlined.push(signature.slice(0, 80));
        return;
      }
      const marker = doc.createElement("div");
      marker.className = "xf-fragment";
      marker.setAttribute("data-fragment", path);
      xf.replaceWith(marker);
    });
    return inlined;
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
    "9/2": "columns-75-25",
    // a small icon beside its text (e.g. the statistics of "Following in her mother's footsteps")
    "1/11": "icon-text"
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
      const squash2 = (value) => value.replace(/[\s\u00a0]+/g, "");
      const sizes = new Set([...p.querySelectorAll('[class*="fontsize-"]')].flatMap((el) => [...el.classList].filter((c) => c.startsWith("fontsize-"))));
      sizes.forEach((size) => {
        const runs = [...p.querySelectorAll(`.${size}`)].filter((el) => !el.parentElement.closest(`.${size}`));
        if (runs.length < 2 || squash2(runs.map((el) => el.textContent).join("")) !== squash2(p.textContent)) return;
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
    const tiles = cells.length > 1 && cells.every((c) => c.some((node) => node.tileHref));
    if (tiles) {
      nodes.filter((node) => node.tileHref).forEach((h4) => {
        const a = doc.createElement("a");
        a.setAttribute("href", h4.tileHref);
        a.append(...h4.childNodes);
        h4.append(a);
      });
    }
    if (marker.getAttribute("data-variant") === "icon-text") {
      nodes.filter((node) => node.nodeType === 1).forEach((node) => {
        node.querySelectorAll("em > strong:only-child, strong > em:only-child").forEach((inner) => {
          const outer = inner.parentElement;
          const before = outer.previousSibling;
          if (before && before.nodeType === 3 && /\[\[color-[a-z]+\]$/.test(before.textContent)) return;
          const strong = doc.createElement("strong");
          strong.append(...inner.childNodes);
          outer.replaceWith(strong);
        });
      });
    }
    const linkVariant = tiles ? "product-tiles" : "media-pair";
    const variants = [marker.getAttribute("data-variant"), nodes.some((node) => node.imageLink) ? linkVariant : ""].filter(Boolean);
    const name = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
    const copy = nodes.filter((node) => node.copyStyle !== void 0 && node.copyStyle !== null).sort((a, b) => text2(b).length - text2(a).length)[0];
    const style = copy ? copy.copyStyle : "";
    nodes.forEach((node) => {
      if (!(node.copyStyle || "").split(", ").includes("p-1-25") || style.split(", ").includes("p-1-25")) return;
      const lines = node.matches("ul, ol") ? [...node.querySelectorAll("li")] : [node];
      lines.filter((line) => line.matches("p, li") && text2(line)).forEach((line) => {
        line.prepend(doc.createTextNode("[[text-1-25]"));
        line.append(doc.createTextNode("]"));
      });
    });
    const block = WebImporter.Blocks.createBlock(doc, { name, cells: [cells.map((c) => c.length ? c : "")] });
    return { block, style };
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const templateName = payload && payload.template && payload.template.name;
    if (templateName !== "news-detail" && templateName !== "news-detail-xf") return;
    const xf = templateName === "news-detail-xf";
    const doc = element.ownerDocument;
    const main = doc.querySelector('[role="main"]') || element;
    spacedSubheadTexts = rawSpacedSubheads(payload && payload.html);
    const componentSelector = xf ? `${COMPONENTS}, .xf-columns, .xf-fragment` : COMPONENTS;
    const inlinedXf = markSharedFragments(main, doc);
    const hasForm = !!main.querySelector(".c-marketo-form form[data-marketo-form-id]");
    const sections = [];
    let current = null;
    let separatorNext = false;
    let blankNext = false;
    const startSection = (kind, sectionStyle) => {
      const style = [separatorNext ? "separator" : "", sectionStyle, blankNext ? "blank-above" : ""].filter(Boolean).join(", ") || void 0;
      separatorNext = false;
      blankNext = false;
      current = { kind, style, nodes: [] };
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
      h5.textContent = location.textContent.replace(/[\s ]+/g, " ").replace(/\s+,/g, ",").trim();
      title.nodes.push(h5);
    }
    if (xf) {
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
    const videoHeadlineRow = (video, headline2, quotes, ctas, asideCtas) => {
      const boxed = !!headline2.querySelector('.has-background, [class*="bg-light-gray"]');
      const lead = boxed ? headlineNodes(headline2, doc) : [];
      if (boxed && !lead.length) return false;
      const firstLine = headline2.querySelector(".line") || headline2;
      const big = firstLine.querySelector('[class*="fontsize-2vw"]') || !headline2.querySelector('[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]');
      const statement = big && lead.length ? [rename(lead[0], "h2"), ...lead.slice(1)] : lead;
      const nodes = [
        ...statement,
        ...(boxed ? quotes : [headline2, ...quotes]).flatMap((q) => quoteNodes(q, doc)),
        ...asideCtas.flatMap((cta) => buttonNodes(cta, doc))
      ];
      boldInTextItalic(nodes, doc);
      [headline2, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
      element.setAttribute("data-news-theme", "full-width");
      const section = startSection("video-text", "video-text, headline-1-5vw");
      if (boxed) section.background = "light-gray";
      section.nodes.push(video, ...ctas.flatMap((cta) => buttonNodes(cta, doc)), ...nodes);
      current = null;
      return true;
    };
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
      if (!/\bcol-sm-6\b/.test(videoCol.className) && !mirrored) {
        return videoHeadlineRow(video, aside, quotes, ctas, asideCtas);
      }
      const columns = videoHeadlineColumns(video, aside, doc, quotes, ctas, asideCtas, mirrored);
      if (!columns) return false;
      [aside, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
      element.setAttribute("data-news-theme", "full-width");
      startSection("columns").nodes.push(columns);
      current = null;
      return true;
    };
    const videoRichTextRow = (video) => {
      const lead = videoRichTextAside(video);
      if (!lead) return false;
      const asideCol = lead.closest('[class*="col-sm-"]');
      const quotes = [...asideCol.querySelectorAll(".c-rich-text-editor")].filter((c) => c !== lead && text2(c));
      const nodes = [...leadNodes(lead), ...quotes.flatMap((q) => quoteNodes(q, doc, { sizes: true }))];
      if (!nodes.length) return false;
      boldInTextItalic(nodes, doc);
      [lead, ...quotes].forEach((c) => consumed.add(c));
      element.setAttribute("data-news-theme", "full-width");
      const style = [
        "video-text",
        asideCol.querySelector(".urw-egyptienne") && "serif",
        lead.querySelector(".fontsize-1-5em") && "p-1-5",
        quotes.some((q) => q.querySelector(".fontsize-1-75em")) && "quote-1-75"
      ].filter(Boolean).join(", ");
      const section = startSection("video-text", style);
      section.background = "light-gray";
      section.nodes.push(video, ...nodes);
      current = null;
      return true;
    };
    const formAsides = /* @__PURE__ */ new Map();
    components.filter((el) => el.matches(".c-marketo-form") && el.querySelector("form[data-marketo-form-id]")).forEach((form) => {
      const formColumn = form.closest('[class*="col-sm-"]');
      const row = formColumn && formColumn.parentElement;
      if (!row || !row.closest(".colctrl")) return;
      const asides = components.filter((el) => el !== form && !el.contains(form) && !formColumn.contains(el) && [...row.children].some((col) => col !== formColumn && col.contains(el)));
      asides.forEach((aside) => consumed.add(aside));
      formAsides.set(form, asides);
    });
    if (hasForm && !main.querySelector("h1")) {
      const lines = [...main.querySelectorAll(".c-autocarousel .carouselslide:not(.slick-cloned) .overlayparsys .line")].filter((line) => text2(line));
      if (lines.length === 1) {
        lines[0].querySelectorAll("a:not([href])").forEach(unwrap);
        rename(lines[0], "h1");
      }
    }
    let leadBelowDate = false;
    let fullWidthLead = false;
    components.forEach((component) => {
      if (consumed.has(component)) return;
      const isFirst = current === title;
      const split = component.matches(".c-standalone-image, .c-rich-text-editor") && photoTextRow(component);
      if (split) {
        [split.photo, split.caption, ...split.texts].filter(Boolean).forEach((c) => consumed.add(c));
        const textNodes = split.texts.flatMap((t) => richTextNodes(t, doc).nodes);
        const copy = textNodes.filter((n) => n.copyStyle !== void 0 && n.copyStyle !== null).sort((a, b) => text2(b).length - text2(a).length).map((n) => n.copyStyle)[0];
        const photo = [...imageNodes(split.photo, doc), ...split.caption ? richTextNodes(split.caption, doc).nodes : []];
        [...photo, ...textNodes].forEach((n) => n.nodeType === 1 && dropBracketTags(n));
        const cells = split.photoFirst ? [photo, textNodes] : [textNodes, photo];
        startSection("columns", copy || void 0).nodes.push(WebImporter.Blocks.createBlock(doc, { name: split.name, cells: [cells] }));
        current = null;
        return;
      }
      const texts = !isFirst && component.matches(".c-rich-text-editor") && textRow(component);
      if (texts) {
        texts.filter((t) => t !== "empty").forEach((t) => consumed.add(t));
        const cells = texts.map((t) => t === "empty" ? "" : richTextNodes(t, doc).nodes);
        const copy = cells.flat().map((n) => n && n.copyStyle).find((c) => c);
        cells.flat().forEach((n) => n && n.nodeType === 1 && dropBracketTags(n));
        startSection("columns", copy || void 0).nodes.push(WebImporter.Blocks.createBlock(doc, { name: "Columns", cells: [cells] }));
        current = null;
        return;
      }
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
      if (component.matches(".c-rich-text-editor") && component.querySelector(".dimensional-box")) {
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
      if (component.matches(".fullWidthImage")) {
        const img = component.querySelector("img");
        if (!img) return;
        const source = component.querySelector("source[srcset]");
        const desktop = source && source.getAttribute("srcset") || img.getAttribute("src");
        const nodes2 = [.../* @__PURE__ */ new Set([desktop, img.getAttribute("src")])].filter(Boolean).map((src) => {
          const image = doc.createElement("img");
          image.setAttribute("src", src);
          image.setAttribute("alt", img.getAttribute("alt") || "");
          const p = doc.createElement("p");
          p.append(image);
          return p;
        });
        const box = component.querySelector(".textBoxId");
        if (box && text2(box)) {
          const p = doc.createElement("p");
          p.textContent = text2(box);
          nodes2.push(p);
        }
        if (isFirst) fullWidthLead = true;
        startSection("image", "full-width-image").nodes.push(...nodes2);
        current = null;
        return;
      }
      if (component.matches(".c-standalone-image")) {
        const row = !isFirst && imageRow(component);
        if (row) {
          row.filter((image) => image !== "empty").forEach((image) => consumed.add(image));
          const cells = row.map((image) => image === "empty" ? "" : imageNodes(image, doc));
          startSection("columns").nodes.push(WebImporter.Blocks.createBlock(doc, { name: "Columns", cells: [cells] }));
          current = null;
          return;
        }
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
      if (component.matches(".c-section-title") && text2(component)) {
        const h2 = doc.createElement("h2");
        const u = doc.createElement("u");
        u.textContent = text2(component.querySelector("h1, h2, h3, h4") || component);
        h2.append(u);
        if (!current || !current.kind.startsWith("body")) startSection("body");
        current.nodes.push(h2);
        return;
      }
      if (component.matches(".c-customizeable, .c-latestnews")) {
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
      if (component.matches(".c-marketo-form")) {
        if (!component.querySelector("form[data-marketo-form-id]")) return;
        const nodes2 = [component];
        (formAsides.get(component) || []).forEach((aside) => {
          if (aside.matches(".xf-fragment")) nodes2.push(fragmentBlock(aside.getAttribute("data-fragment"), doc));
          else if (aside.matches(".c-standalone-image")) nodes2.push(...imageNodes(aside, doc));
          else if (aside.matches(".c-rich-text-editor")) nodes2.push(...richTextNodes(aside, doc).nodes);
          else if (aside.matches(".c-curatedcta")) nodes2.push(...buttonNodes(aside, doc));
          else if (aside.matches(".c-largeheadline")) nodes2.push(...headlineNodes(aside, doc));
        });
        startSection("form", nodes2.length > 1 ? "form-with-aside" : void 0).nodes.push(...nodes2);
        current = null;
        return;
      }
      if (component.matches(".c-curated-link-list")) {
        const links = [...component.querySelectorAll("li a[href]")].filter((a) => text2(a));
        if (!links.length) return;
        const ul = doc.createElement("ul");
        links.forEach((source) => {
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.setAttribute("href", newTabHref(source, absoluteAsset(source.getAttribute("href"))));
          a.textContent = text2(source);
          li.append(a);
          ul.append(li);
        });
        startSection("link-list", "link-list").nodes.push(ul);
        blankNext = [...component.querySelectorAll("li")].some((li) => !text2(li));
        current = null;
        return;
      }
      if (component.matches(".c-accordion")) {
        const rows = [...component.querySelectorAll(".panel")].map((panel) => {
          const title2 = text2(panel.querySelector(".panel-title"));
          const body = [...panel.querySelectorAll(".panel-body .c-rich-text-editor")].flatMap((rte) => richTextNodes(rte, doc).nodes);
          body.forEach((n) => n.nodeType === 1 && dropBracketTags(n));
          return title2 && body.length ? { title: title2, body } : null;
        }).filter(Boolean);
        if (!rows.length) return;
        const nodes2 = [];
        const heading = component.querySelector(".component-subheading");
        if (heading && text2(heading)) {
          const h3 = doc.createElement("h3");
          h3.textContent = text2(heading);
          nodes2.push(h3);
        }
        nodes2.push(WebImporter.Blocks.createBlock(doc, {
          name: "Accordion",
          cells: rows.map((row) => [row.title, row.body])
        }));
        const copy = rows.flatMap((row) => row.body).map((n) => n.copyStyle).find((c) => c);
        startSection("accordion", copy || void 0).nodes.push(...nodes2);
        current = null;
        return;
      }
      if (component.matches(".c-resourcesanddownload")) {
        if (!hasForm || component.querySelector(".item img")) {
          if (!component.querySelector(".item img")) return;
          const section = startSection("cards");
          const heading2 = component.querySelector(".title-container :is(h2, h3, h4)");
          if (heading2 && text2(heading2)) {
            const h2 = doc.createElement("h2");
            const u = doc.createElement("u");
            u.textContent = text2(heading2);
            h2.append(u);
            section.nodes.push(h2);
            heading2.remove();
          }
          section.nodes.push(component);
          current = null;
          return;
        }
        const nodes2 = [];
        const heading = component.querySelector(".title-container h2");
        if (heading && text2(heading)) {
          const h2 = doc.createElement("h2");
          h2.textContent = text2(heading);
          nodes2.push(h2);
        }
        component.querySelectorAll(".item").forEach((item) => {
          const link2 = item.querySelector("a[href]");
          const label = text2(item.querySelector(".title") || item);
          if (!link2 || !label) return;
          const a = doc.createElement("a");
          a.href = newTabHref(link2, absoluteAsset(link2.getAttribute("href")));
          a.textContent = label;
          const p = doc.createElement("p");
          p.append(a);
          nodes2.push(p);
        });
        if (!nodes2.length) return;
        if (!current || current.kind !== "body") startSection("body");
        current.nodes.push(...nodes2);
        return;
      }
      if (component.matches(".xf-fragment")) {
        startSection("fragment").nodes.push(fragmentBlock(component.getAttribute("data-fragment"), doc));
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
        if (videoRichTextRow(component)) return;
        const textAside = videoTextAside(component);
        const textColumns = textAside && videoTextColumns(component, textAside, doc);
        if (textColumns) {
          consumed.add(textAside.closest(COMPONENTS) || textAside);
          element.setAttribute("data-news-theme", "full-width");
          startSection("columns", textColumns.copy || void 0).nodes.push(textColumns.block);
          current = null;
          return;
        }
        const caption = videoCaption(component);
        const besideText = component.closest('.colctrl [class*="col-sm-6"], .colctrl [class*="col-sm-4"]');
        const columnStyle = imageColumnStyle(component) || besideText && (/\bcol-sm-6\b/.test(besideText.className) ? "image-1-2" : "image-1-3");
        if (columnStyle) {
          startSection("video", columnStyle).nodes.push(component);
        } else {
          if (!current || current.kind !== "body") startSection("body");
          current.nodes.push(component);
        }
        const serifCaption = caption.some((n) => /^H[2-4]$/.test(n.tagName) && !n.querySelector(".futura-bold, b, strong"));
        if (caption.length) startSection("caption", serifCaption ? "join, h-serif" : "join").nodes.push(...caption);
        if (columnStyle || caption.length) current = null;
        return;
      }
      const headlineStyle = component.matches(".c-largeheadline") && [
        ['[class*="fontsize-2vw"]', "headline-2vw"],
        ['[class*="fontsize-1-5-vw"], [class*="fontsize-1-5vw"]', "headline-1-5vw"]
      ].find(([selector]) => component.querySelector(selector));
      if (isFirst && !hasTitle && headlineStyle && text2(component)) {
        const lines = headlineNodes(component, doc);
        if (lines.length) {
          const heading = rename(lines[0], "h1");
          heading.querySelectorAll("strong, em").forEach(unwrap);
          startSection("headline", headlineStyle[1]).nodes.push(heading, ...lines.slice(1));
          current = null;
          return;
        }
      }
      if (component.matches(".c-largeheadline") && headlineStyle && headlineStyle[1] === "headline-2vw" && component.querySelector(".has-background.bg-gold") && text2(component)) {
        const lines = headlineNodes(component, doc);
        if (lines.length) {
          lines.forEach((line) => line.querySelectorAll("em").forEach(unwrap));
          startSection("headline", "headline-2vw").nodes.push(...lines);
          current.background = "bg-gold";
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
        const subtitle = component.querySelector(".cta-subtitle, .cta-title");
        if (subtitle && text2(subtitle)) {
          const p = doc.createElement("p");
          const strong = doc.createElement("strong");
          strong.textContent = text2(subtitle);
          p.append(strong);
          nodes2.unshift(p);
          if (!(current.style || "").split(", ").includes("label-1-5")) {
            current.style = [current.style, "label-1-5"].filter(Boolean).join(", ");
          }
        }
        current.nodes.push(...nodes2);
        return;
      }
      const boxes = component.matches(".c-rich-text-editor") && goldBoxRow(component);
      if (boxes) {
        boxes.forEach((box) => consumed.add(box));
        const block = WebImporter.Blocks.createBlock(doc, {
          name: "Columns",
          cells: [boxes.map((box) => goldBoxCell(box, doc))]
        });
        const goldStyle = boxes.every((box) => box.querySelector(".futura-bold .fontsize-2em, .fontsize-2em .futura-bold")) ? "gold-boxes, gold-boxes-2" : "gold-boxes";
        const heading = current && current.nodes.length === 1 && /^H[2-4]$/.test(current.nodes[0].tagName || "");
        if (heading && !current.style) {
          const sized = /\[\[text-1-25\]/.test(current.nodes[0].textContent);
          dropBracketTags(current.nodes[0]);
          current.style = sized && current.nodes[0].tagName === "H3" ? `${goldStyle}, h3-1-25` : goldStyle;
          current.nodes.push(block);
        } else {
          startSection("gold-boxes", goldStyle).nodes.push(block);
        }
        current = null;
        return;
      }
      const { nodes, centred, size } = component.matches(".c-rich-text-editor") ? richTextNodes(component, doc) : { nodes: headlineNodes(component, doc), centred: false };
      if (!nodes.length) return;
      const stacked = !!current && current.lastRich === previousRichText(component) && unspaced(current.lastRich, "bottom") && unspaced(component, "top");
      nodes.forEach((node, i) => {
        const copyStyle = node.copyStyle !== void 0 ? node.copyStyle : size;
        const extra = node.headingStyle ? [node.headingStyle] : [copyStyle || "", node.boldBody ? "bold-body" : ""].filter(Boolean);
        const styles = [centred ? "center" : "", ...extra].filter(Boolean);
        const kind = [centred ? "center" : "body", ...extra].join(" ");
        const h3Font = node.tagName === "H3" ? node.serifHeading ? "serif" : "futura" : null;
        if (!current || current.kind !== kind || h3Font && current.h3Font && current.h3Font !== h3Font) {
          if (node.followsText && current && i > 0) {
            current.style = [current.style, "ps-0"].filter(Boolean).join(", ");
          }
          const join = (i > 0 || stacked) && current && !node.followsText ? ["join"] : [];
          startSection(kind, [...styles, ...join].join(", ") || void 0);
        }
        if (h3Font) {
          if (h3Font === "serif" && current.h3Font !== "serif") {
            current.style = [current.style, "h-serif"].filter(Boolean).join(", ");
          }
          current.h3Font = h3Font;
        }
        current.nodes.push(node);
      });
      if (component.matches(".c-rich-text-editor")) current.lastRich = component;
    });
    if (hasForm) {
      let seen = 0;
      sections.forEach((section) => {
        section.nodes = section.nodes.map((node) => {
          if (node.nodeType !== 1) return node;
          const headings = [...node.tagName === "H1" ? [node] : [], ...node.querySelectorAll("h1")];
          let result = node;
          headings.forEach((heading) => {
            seen += 1;
            if (seen === 1) return;
            const h2 = rename(heading, "h2");
            if (heading === node) result = h2;
          });
          return result;
        });
      });
    }
    const disclaimers = [...doc.querySelectorAll(".c-disclaimer")].filter((el) => !el.querySelector("#publishedDate") && !el.parentElement.closest(".c-disclaimer") && text2(el));
    const disclaimerNodes = footnoteList(disclaimers.flatMap((disclaimer) => {
      const box = doc.createElement("div");
      box.innerHTML = disclaimer.innerHTML;
      cleanRichText(box, { wholeParagraphs: true });
      return blockNodes(box, doc);
    }), doc);
    const disclaimerStyle = disclaimerNodes.converted ? "disclaimer, references-spaced" : "disclaimer";
    if (disclaimerNodes.length) startSection("disclaimer", disclaimerStyle).nodes.push(...disclaimerNodes);
    const opensWithHeadline = sections.some((section) => section.kind === "headline");
    if ((title.nodes.some((node) => node.tagName === "H1") || opensWithHeadline || fullWidthLead) && !leadBelowDate) {
      sections.splice(sections.indexOf(title) + 1, 0, { kind: "spacer", style: "spacer", nodes: [] });
    }
    const opening = sections.find((section) => section.nodes.length);
    if (element.hasAttribute("data-first-published") && !title.nodes.length && opening && opening.nodes[0].tagName === "H1") {
      opening.style = [opening.style, "date-above"].filter(Boolean).join(", ");
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
      if (section.style || section.background) {
        const cells = {};
        if (section.style) cells.style = section.style;
        if (section.background) cells.background = section.background;
        out.push(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells }));
      }
    });
    element.replaceChildren(...out);
    const fragments = [...new Set(sections.flatMap((section) => section.nodes).flatMap((node) => node.nodeType === 1 ? [...node.querySelectorAll('a[href^="/us/en/fragments/"]')] : []).map((a) => a.getAttribute("href")))];
    if (fragments.length || inlinedXf.length) {
      element.setAttribute("data-news-xf", JSON.stringify({ fragments, inlined: inlinedXf }));
    }
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
      "people-fragments"
    ].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          heading.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text3 = span.textContent.replace(/ /g, " ").trim();
            if (!text3) return;
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
        const text3 = span.textContent.replace(/ /g, " ").trim();
        if (!text3) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text3;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text3) {
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

  // tools/importer/import-news-detail.js
  var PAGE_TEMPLATE = {
    name: "news-detail",
    description: "www.stryker.com news feature articles (/us/en/about/news/YEAR/features/). Title section (H1 only when the source has one, H5 publish date); lead media: single-slide autocarousel as Hero Corp (image-slide) with the source headline position/size as variant options, or a standalone image; article sections (rich text, images, Video block) in the 66.66% centred column (template CSS); centred rich text + gold curated CTA as a `center` section; references and document code as a small-print `disclaimer` section; `published` metadata drives the corp Last Updated line.",
    urls: [
      "https://www.stryker.com/us/en/about/news/2022/features/this-surgical-icu-team-is-bound-by-unspeakable-trauma-and-miracu.html",
      "https://www.stryker.com/us/en/about/news/2026/features/stryker-releases-2025-comprehensive-report.html",
      "https://www.stryker.com/us/en/smart-care/news/building-a-connected-smart-hospital.html",
      "https://www.stryker.com/us/en/about/news/2026/avs-now-part-of-stryker-enrolls-first-patient-in-first-in-human-coronary-intravascular-lithotripsy-study.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-introduces-first-of-its-kind-fda-authorized-surgical-application-for-apple-vision-pro-with-hip-arthroscopy-case.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-signs-definitive-agreement-to-acquire-zurimed-to-enhance.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-introduces-mako-handheld-robotics-mako-rps.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-showcases-prophecy-surgical-planning-for-incompass-at-aofas.html"
    ],
    blocks: [
      { name: "hero-image-slide", instances: [".c-autocarousel"] },
      { name: "video", instances: [".c-standalone-video"] },
      { name: "cards-corp-teaser", instances: [".c-customizeable", ".c-latestnews"] },
      { name: "cards-corp-resources", instances: [".c-resourcesanddownload"] },
      { name: "marketo-form", instances: [".c-marketo-form"] }
    ]
  };
  var parsers = {
    "hero-image-slide": parse,
    video: parse4,
    "cards-corp-teaser": parse2,
    "cards-corp-resources": parse3,
    "marketo-form": parse5
  };
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4
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
  var import_news_detail_default = {
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
      const published = publishedDate(document);
      const forms = [...document.querySelectorAll("form.c-mkto-form[data-marketo-form-id]")].filter((form, i, all) => all.findIndex((f) => f.getAttribute("data-marketo-form-id") === form.getAttribute("data-marketo-form-id")) === i).map((form) => {
        const id = form.getAttribute("data-marketo-form-id");
        const alert = document.getElementById(`alert_${id}`);
        return {
          id,
          munchkinId: form.getAttribute("data-marketo-munchkin-id"),
          baseUrl: form.getAttribute("data-marketo-base-url"),
          afterSubmit: form.getAttribute("data-after-submit-action"),
          redirect: form.getAttribute("data-redirect-page"),
          message: alert ? alert.textContent.replace(/\s+/g, " ").trim() : ""
        };
      });
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
      if (meta.Title) meta.Title = meta.Title.replace(/(\s*\|\s*Stryker)+\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
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
      const xf = main.getAttribute("data-news-xf");
      if (xf) main.removeAttribute("data-news-xf");
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
          blocks: pageBlocks.map((b) => b.name),
          forms: JSON.stringify(forms),
          fragments: xf || ""
        }
      }];
    }
  };
  return __toCommonJS(import_news_detail_exports);
})();
