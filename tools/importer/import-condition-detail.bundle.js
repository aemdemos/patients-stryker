/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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

  // tools/importer/import-condition-detail.js
  var import_condition_detail_exports = {};
  __export(import_condition_detail_exports, {
    default: () => import_condition_detail_default
  });
  var ORIGIN = "https://patients.stryker.com";
  var NAV = "/us/en/ivs/nav-ivs";
  var FOOTER = "/us/en/ivs/footer-ivs";
  var TEMPLATE = "condition-detail";
  var MARKETO_DEFAULTS = {
    baseUrl: "//lp.stryker.com",
    munchkinId: "338-WAP-571",
    formId: "4893",
    captchaScript: `${ORIGIN}/etc.clientlibs/stryker/components/content/altcha/altcha.js`,
    captchaChallengeUrl: `${ORIGIN}/bin/stryker/captcha/challenge`
  };
  var COMPONENTS = ".fullWidthImageHero, .cols2, .text.parbase, .fullbleedpanel, .marketoform, .tabs";
  var PAGE_SETTINGS = {
    // the dark band section is authored as `full-bleed` + a `background: dark` row
    "hip-pain": { darkBandSection: { style: "full-bleed", background: "dark" } },
    // reference URLs in the disclaimer are links
    "back-pain": { linkReferenceUrls: true },
    // "Resources" heading underlined only (not bold); no canonical / footer rows
    "genicular-radiofrequency-ablation": {
      resourcesHeadingBold: false,
      omitMetadata: ["canonical", "footer"]
    }
  };
  var squash = (s) => (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ");
  var text = (el) => el ? squash(el.textContent).trim() : "";
  function cleanHref(href) {
    if (!href) return null;
    if (href === "#disclaimer" || href === "#") return null;
    if (href.startsWith("#")) return href;
    let url;
    try {
      url = new URL(href, ORIGIN);
    } catch (e) {
      return href;
    }
    if (url.origin !== ORIGIN) return url.href;
    if (url.pathname.startsWith("/content/dam/")) return `${ORIGIN}${url.pathname}`;
    return `${url.pathname.replace(/\.html$/, "")}${url.hash === "#disclaimer" ? "" : url.hash}`;
  }
  function copyInline(document, node, target) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        target.append(document.createTextNode(squash(child.textContent)));
        return;
      }
      if (child.nodeType !== 1) return;
      const tag = child.tagName.toLowerCase();
      let el = null;
      if (tag === "br") {
        target.append(document.createElement("br"));
        return;
      }
      if (tag === "b" || tag === "strong" || tag === "span" && child.classList.contains("futura-bold")) el = document.createElement("strong");
      else if (tag === "i" || tag === "em") el = document.createElement("em");
      else if (tag === "u") el = document.createElement("u");
      else if (tag === "sup") el = document.createElement("sup");
      else if (tag === "a") {
        const href = cleanHref(child.getAttribute("href"));
        if (href) {
          el = document.createElement("a");
          el.href = href;
        }
      }
      if (el) {
        copyInline(document, child, el);
        if (el.textContent.trim() || el.querySelector("br")) target.append(el);
      } else {
        copyInline(document, child, target);
      }
    });
  }
  function tidy(el) {
    el.normalize();
    el.querySelectorAll("strong, em, u").forEach((f) => {
      const first = f.firstChild;
      if (first && first.nodeType === 3 && /^\s/.test(first.textContent)) {
        first.textContent = first.textContent.replace(/^\s+/, "");
        f.before(f.ownerDocument.createTextNode(" "));
      }
      const last = f.lastChild;
      if (last && last.nodeType === 3 && /\s$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/\s+$/, "");
        f.after(f.ownerDocument.createTextNode(" "));
      }
    });
    el.normalize();
    const walker = el.ownerDocument.createTreeWalker(el, 4);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      n.textContent = n.textContent.replace(/ {2,}/g, " ");
    });
    const edge = (node, side) => {
      let cur = node;
      while (cur && cur.nodeType === 1 && cur.tagName !== "BR") cur = side === "start" ? cur.firstChild : cur.lastChild;
      if (cur && cur.nodeType === 3) {
        cur.textContent = side === "start" ? cur.textContent.replace(/^\s+/, "") : cur.textContent.replace(/\s+$/, "");
      }
    };
    edge(el, "start");
    edge(el, "end");
    el.querySelectorAll("br").forEach((br) => {
      if (br.previousSibling && br.previousSibling.nodeType === 3) {
        br.previousSibling.textContent = br.previousSibling.textContent.replace(/\s+$/, "");
      }
      if (br.nextSibling && br.nextSibling.nodeType === 3) {
        br.nextSibling.textContent = br.nextSibling.textContent.replace(/^\s+/, "");
      }
    });
    el.querySelectorAll("strong, em, u").forEach((f) => {
      if (!f.textContent.trim()) f.replaceWith(...f.childNodes);
    });
    return el;
  }
  function headingEmphasis(document, h, keepBold) {
    const strongs = [...h.querySelectorAll(":scope > strong")];
    const bare = [...h.childNodes].filter((n) => !(n.nodeType === 1 && ["STRONG", "SUP"].includes(n.tagName)) && n.textContent.trim());
    if (strongs.length && !bare.length) {
      strongs.forEach((s) => s.replaceWith(...s.childNodes));
      if (keepBold) {
        const strong = document.createElement("strong");
        strong.append(...h.childNodes);
        h.append(strong);
      }
    } else {
      strongs.forEach((s) => {
        const em = document.createElement("em");
        s.replaceWith(em);
        em.append(s);
      });
    }
    return h;
  }
  function linkUrls(document, el) {
    const walker = document.createTreeWalker(el, 4);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest("a")) nodes.push(walker.currentNode);
    }
    nodes.forEach((node) => {
      const parts = node.textContent.split(/(https?:\/\/[^\s<]*[^\s<.,;:)])/);
      if (parts.length < 2) return;
      node.replaceWith(...parts.filter(Boolean).map((part) => {
        if (!/^https?:\/\//.test(part)) return document.createTextNode(part);
        const a = document.createElement("a");
        a.href = part;
        a.textContent = part;
        return a;
      }));
    });
  }
  function richText(document, rte, opts = {}) {
    const box = rte.querySelector(".c-rich-text-editor > div") || rte;
    const out = [];
    [...box.children].forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag) || tag === "p") {
        const el = document.createElement(tag);
        copyInline(document, child, el);
        tidy(el);
        if (!el.textContent.trim()) return;
        out.push(/^h/.test(tag) ? headingEmphasis(document, el, opts.keepBold) : el);
      } else if (tag === "ul" || tag === "ol") {
        const list = document.createElement(tag);
        child.querySelectorAll(":scope > li").forEach((li) => {
          const para = document.createElement("p");
          copyInline(document, li, para);
          tidy(para);
          if (!para.textContent.trim()) return;
          if (opts.linkUrls) linkUrls(document, para);
          const item = document.createElement("li");
          item.append(para);
          list.append(item);
        });
        if (list.children.length) out.push(list);
      } else if (tag === "div") {
        out.push(...richText(document, child, opts));
      }
    });
    return out;
  }
  function buttonLink(document, a, { accent = true, newTab = false } = {}) {
    const link = document.createElement("a");
    const href = cleanHref(a.getAttribute("href")) || a.getAttribute("href");
    link.href = newTab && a.getAttribute("target") === "_blank" ? `${href}#_blank` : href;
    link.textContent = text(a);
    const strong = document.createElement("strong");
    strong.append(link);
    const p = document.createElement("p");
    if (accent) {
      const em = document.createElement("em");
      em.append(strong);
      p.append(em);
    } else {
      p.append(strong);
    }
    return p;
  }
  function dmImage(document, src, alt, withTitle = false) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = src;
    a.textContent = alt || src;
    if (withTitle && alt) a.title = alt;
    p.append(a);
    return p;
  }
  var block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });
  function buildHero(document, el) {
    const img = el.querySelector(".imgBoxId img, picture img");
    const source = el.querySelector("picture source[srcset]");
    const alt = img ? img.getAttribute("alt") || "" : "";
    const mobile = img ? img.getAttribute("src") : "";
    const desktop = source ? source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : mobile;
    const h1 = document.createElement("h1");
    const em = document.createElement("em");
    const strong = document.createElement("strong");
    strong.textContent = text(el.querySelector(".largeheadline h1")) || text(el.querySelector("h1")).replace(/\s*\|.*$/, "");
    em.append(strong);
    h1.append(em);
    const content = [h1];
    const cta = el.querySelector(".curatedcta a[href], a.btn[href]");
    if (cta) content.push(buttonLink(document, cta, { newTab: true }));
    const rows = [];
    if (desktop) rows.push([dmImage(document, desktop, alt)]);
    if (mobile && mobile !== desktop) rows.push([dmImage(document, mobile, alt)]);
    rows.push([content]);
    return block(document, "Hero (banner)", rows);
  }
  function buildIntro(document, el) {
    const [left, right] = el.querySelectorAll(":scope > .colctrl > .row > div");
    const nodes = [];
    left.querySelectorAll(".text.parbase").forEach((t) => nodes.push(...richText(document, t)));
    const panel = [];
    right.querySelectorAll(".text.parbase").forEach((t) => panel.push(...richText(document, t)));
    right.querySelectorAll(".buttonset a[href]").forEach((a) => panel.push(buttonLink(document, a)));
    nodes.push(block(document, "Panel (cta)", [[panel]]));
    return nodes;
  }
  function buildCondition(document, el) {
    const nodes = [];
    const texts = [...el.querySelectorAll(".text.parbase")];
    const dark = texts.find((t) => t.querySelector(".bg-dark-teal-gradient"));
    const box = texts.find((t) => t.querySelector(".dimensional-box"));
    const rest = texts.filter((t) => t !== dark && t !== box);
    if (dark) nodes.push(block(document, "Panel (dark)", [[richText(document, dark, { keepBold: true })]]));
    el.querySelectorAll(".standaloneimage img").forEach((img) => {
      nodes.push(dmImage(document, img.getAttribute("src"), img.getAttribute("alt")));
    });
    if (box) nodes.push(block(document, "Panel (left)", [[richText(document, box)]]));
    rest.forEach((t) => nodes.push(...richText(document, t)));
    return nodes;
  }
  function buildDarkBand(document, el) {
    const cols = el.querySelector(".cols2");
    if (cols) {
      const cells = [...cols.querySelectorAll(":scope > .colctrl > .row > div")].map((col) => {
        const content2 = [];
        col.querySelectorAll(".text.parbase").forEach((t) => content2.push(...richText(document, t)));
        return content2;
      });
      return { nodes: [block(document, "Columns (columns-50-50)", [cells])], style: "dark, full-bleed" };
    }
    const content = [];
    el.querySelectorAll(".text.parbase").forEach((t) => content.push(...richText(document, t)));
    return { nodes: [block(document, "Panel (dark, wide)", [[content]])], style: "dark" };
  }
  function buildGold(document, el) {
    const a = el.querySelector("a[href]");
    const p = document.createElement("p");
    const lead = el.querySelector(".urw-egyptienne");
    p.append(document.createTextNode(text(lead) || text(el).replace(text(a), "").trim()));
    if (a) {
      p.append(document.createElement("br"));
      const strong = document.createElement("strong");
      const link = document.createElement("a");
      link.href = cleanHref(a.getAttribute("href")) || a.getAttribute("href");
      const u = document.createElement("u");
      u.textContent = text(a);
      link.append(u);
      strong.append(link);
      p.append(strong);
    }
    return block(document, "Panel (gold)", [[p]]);
  }
  function buildMarketo(document, el) {
    const cfg = __spreadValues({}, MARKETO_DEFAULTS);
    const form = el.querySelector('form[id^="mktoForm_"]');
    const id = form && form.id.match(/^mktoForm_(\d+)$/);
    if (id) [, cfg.formId] = id;
    const html = el.innerHTML;
    const base = html.match(/data-marketo-base-url\s*=\s*"([^"]+)"/i);
    const munchkin = html.match(/data-marketo-munchkin-id\s*=\s*"([^"]+)"/i);
    if (base) [, cfg.baseUrl] = base;
    if (munchkin) [, cfg.munchkinId] = munchkin;
    const widget = el.querySelector("altcha-widget[challengeurl]");
    const challenge = widget && widget.getAttribute("challengeurl");
    if (challenge) cfg.captchaChallengeUrl = new URL(challenge, ORIGIN).href;
    return block(document, "Marketo Form", {
      "Base URL": cfg.baseUrl,
      "Munchkin ID": cfg.munchkinId,
      "Form ID": cfg.formId,
      "Captcha Script": cfg.captchaScript,
      "Captcha Challenge URL": cfg.captchaChallengeUrl
    });
  }
  function buildCards(document, pane) {
    const rows = [];
    pane.querySelectorAll(".colctrl > .row > div").forEach((col) => {
      const img = col.querySelector(".cta-img img");
      const btn = col.querySelector("a.btn[href]");
      if (!img || !btn) return;
      rows.push([
        dmImage(document, img.getAttribute("src"), img.getAttribute("alt"), true),
        buttonLink(document, btn, { accent: false })
      ]);
    });
    return rows.length ? block(document, "Cards (resources)", rows) : null;
  }
  function buildResources(document, el, { bold = true } = {}) {
    const heading = document.createElement("h2");
    const u = document.createElement("u");
    u.textContent = text(el.querySelector(".component-subheading")) || "Resources";
    if (bold) {
      const strong = document.createElement("strong");
      strong.append(u);
      heading.append(strong);
    } else {
      heading.append(u);
    }
    const labels = [...el.querySelectorAll(".tabs-nav li a")].map((a) => text(a));
    const panes = [...el.querySelectorAll(".tabs-content > .tab-content")];
    const tabbed = labels.filter(Boolean).length > 1;
    const nodes = [heading];
    panes.forEach((pane, i) => {
      const cards = buildCards(document, pane);
      if (!cards) return;
      if (tabbed && labels[i]) {
        const h3 = document.createElement("h3");
        h3.textContent = labels[i];
        nodes.push(h3);
      }
      nodes.push(cards);
    });
    return nodes.length > 1 ? { nodes, tabbed } : null;
  }
  function buildDisclaimer(document, { linkReferences = false } = {}) {
    const nodes = [];
    const box = document.querySelector(".c-disclaimer.page-section:not(.container)");
    if (box) nodes.push(...richText(document, box, { linkUrls: linkReferences }));
    document.querySelectorAll(".c-disclaimer:not(.page-section) p").forEach((p) => {
      const el = document.createElement("p");
      el.textContent = text(p);
      if (el.textContent) nodes.push(el);
    });
    return nodes;
  }
  function buildMetadata(document, params, omit = []) {
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
    const h1 = text(document.querySelector(".fullWidthImageHero .largeheadline h1"));
    if (h1) meta["og:title"] = h1;
    meta.canonical = params.originalURL;
    meta.nav = NAV;
    meta.footer = FOOTER;
    meta.template = TEMPLATE;
    delete meta.theme;
    omit.forEach((key) => delete meta[key]);
    return WebImporter.Blocks.getMetadataBlock(document, meta);
  }
  function components(document) {
    const root = document.querySelector(".main.content") || document.body;
    const all = [...root.querySelectorAll(COMPONENTS)];
    return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
  }
  function kindOf(el) {
    if (el.matches(".fullWidthImageHero")) return "hero";
    if (el.matches(".fullbleedpanel")) return "dark";
    if (el.matches(".marketoform")) return "marketo";
    if (el.matches(".tabs")) return "resources";
    if (el.matches(".cols2")) return el.querySelector(".bg-dark-teal-gradient") ? "condition" : "intro";
    if (el.querySelector(".bg-gold")) return "gold";
    if (el.querySelector(".bg-light-gray, .bg-lighter-gray")) return "risks";
    return el.textContent.trim() ? "text" : null;
  }
  var import_condition_detail_default = {
    transform: ({ document, params }) => {
      const slug = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "").split("/").pop();
      const settings = PAGE_SETTINGS[slug] || {};
      const sections = [];
      const add = (nodes, style) => sections.push({ nodes, style });
      const spacer = (style = "spacer") => add([], style);
      const parts = components(document).map((el) => ({ el, kind: kindOf(el) })).filter((p) => p.kind);
      let prev = null;
      parts.forEach(({ el, kind }, i) => {
        const next = parts[i + 1] || null;
        let emitted = kind;
        if (kind === "hero") {
          spacer();
          add([buildHero(document, el)]);
          spacer(next && next.kind === "text" ? "spacer, xlarge" : "spacer");
        } else if (kind === "text") {
          add(richText(document, el));
          spacer();
        } else if (kind === "intro") {
          add(buildIntro(document, el), "flex");
          if (next && next.kind === "dark" && next.el.querySelector(".cols2")) spacer();
        } else if (kind === "condition") {
          add(buildCondition(document, el), "flex");
          spacer();
        } else if (kind === "dark") {
          const { nodes, style } = buildDarkBand(document, el);
          const twoColumns = !!el.querySelector(".cols2");
          add(nodes, twoColumns && settings.darkBandSection ? settings.darkBandSection : style);
          spacer("spacer, large");
        } else if (kind === "gold") {
          add([buildGold(document, el)]);
        } else if (kind === "marketo") {
          add([buildMarketo(document, el)]);
        } else if (kind === "resources") {
          const res = buildResources(document, el, { bold: settings.resourcesHeadingBold !== false });
          if (!res) return;
          if (res.tabbed) spacer();
          add(res.nodes, res.tabbed ? "tabbed" : null);
          emitted = res.tabbed ? "resources-tabbed" : "resources";
        } else if (kind === "risks") {
          spacer("spacer, large");
          add(richText(document, el), "light-gray");
        }
        prev = emitted;
      });
      const disclaimer = buildDisclaimer(document, { linkReferences: !!settings.linkReferenceUrls });
      if (disclaimer.length) {
        if (prev === "resources") spacer("spacer, xxlarge");
        else if (prev !== "risks") spacer("spacer, large");
        add(disclaimer, "compact");
      }
      const main = document.createElement("div");
      sections.forEach(({ nodes, style }, i) => {
        if (i) main.append(document.createElement("hr"));
        main.append(...nodes);
        if (style) main.append(block(document, "Section Metadata", typeof style === "string" ? { style } : style));
      });
      main.append(
        document.createElement("hr"),
        buildMetadata(document, params, settings.omitMetadata)
      );
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: { title: document.title, template: TEMPLATE }
      }];
    }
  };
  return __toCommonJS(import_condition_detail_exports);
})();
