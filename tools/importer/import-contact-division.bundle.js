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

  // tools/importer/import-contact-division.js
  var import_contact_division_exports = {};
  __export(import_contact_division_exports, {
    default: () => import_contact_division_default
  });

  // tools/importer/parsers/news-detail/marketo-form.js
  function parse(element, { document }) {
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

  // tools/importer/transformers/contact-division-sections.js
  var TEMPLATE = "contact-division";
  var PAGE_XFS = {
    "/us/en/smart-care/contact": "/content/experience-fragments/stryker/smart_care/en/business_unit/footer-links/master"
  };
  var KEYPAD = ["ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
  var PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  var VANITY = /\b\d{3}-[A-Z]{7}\b/;
  var text = (node) => node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  function sourcePath(payload) {
    const url = payload.params && payload.params.originalURL || payload.url || "";
    try {
      return new URL(url).pathname.replace(/\.html?$/, "");
    } catch (e) {
      return "";
    }
  }
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
      a.replaceChildren(el(doc, "u", text(a)));
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
    return [...clone.children].filter((node) => text(node) || node.querySelector("img"));
  }
  function isDocNumber(component) {
    const small = [...component.querySelectorAll("span.fontsize-8em")].map(text).join(" ");
    return !!small && small === text(component);
  }
  function contactLine(p, label, doc, report) {
    const a = p.querySelector("a");
    const value = text(p);
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
    const clean = lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!clean.length) return null;
    const p = doc.createElement("p");
    clean.forEach((line, i) => {
      if (i) p.append(doc.createElement("br"));
      p.append(line);
    });
    return p;
  }
  function mapLink(contactus, doc) {
    const map = contactus.querySelector("[data-address]");
    if (!map) return null;
    const lines = map.getAttribute("data-address").split(/<br\s*\/?>|<\/p>/i).map((line) => line.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!lines.length) return null;
    const address = lines.join(", ");
    return el(doc, "p", link(doc, `https://www.google.com/maps?q=${encodeURIComponent(address)}`, address));
  }
  function contactUs(contactus, doc, report) {
    const nodes = [];
    const heading = contactus.querySelector("h2.component-subheading");
    if (text(heading)) nodes.push(underlined(doc, "h2", text(heading)));
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
        if (text(part)) details.push(el(doc, part.tagName.toLowerCase(), text(part)));
      } else if (part.matches("p.contact-description")) {
        details.push(...richNodes(el(doc, "div", part.cloneNode(true)), doc));
      } else if (part.matches("div")) {
        const address = addressLines(part, doc);
        if (address) details.push(address);
      } else {
        const subgroup = part.closest(".contact-subgroup");
        const label = text(subgroup && subgroup.querySelector("h4.contact-label"));
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
  function marketoBlock(component, doc) {
    const holder = el(doc, "div", component.cloneNode(true));
    parse(holder.firstElementChild, { document: doc });
    return holder.firstElementChild ? [holder.firstElementChild] : [];
  }
  function fragmentBlock(xf, doc) {
    const path = xfToFragmentPath(xf);
    if (!path) return [];
    return [WebImporter.Blocks.createBlock(doc, { name: "Fragment", cells: [[link(doc, path, path)]] })];
  }
  function sectionTitle(component, doc) {
    const title = component.querySelector(".c-section-title");
    const nodes = [];
    title.querySelectorAll(".title-container > *").forEach((node) => {
      if (!text(node)) return;
      if (node.matches("h2")) nodes.push(underlined(doc, "h2", text(node)));
      else nodes.push(el(doc, node.tagName.toLowerCase(), text(node)));
    });
    return { nodes, id: title.getAttribute("id") || "" };
  }
  function divisionContactUs(component, doc) {
    const form = component.querySelector("form");
    if (!form) return [];
    const nodes = [];
    const heading = form.querySelector("h2");
    if (text(heading)) nodes.push(underlined(doc, "h2", text(heading)));
    const description = form.querySelector(".form-description");
    if (description) {
      const clone = description.cloneNode(true);
      clone.querySelectorAll(".form-control-asterix").forEach((star) => star.remove());
      if (text(clone)) nodes.push(el(doc, "p", text(clone)));
    }
    return nodes;
  }
  function enlargedH3(component) {
    const root = component.querySelector(".left-to-right") || component;
    const heads = [...root.children].filter((node) => text(node));
    if (heads.length !== 1 || !heads[0].matches("h3")) return "";
    const span = heads[0].querySelector("span.fontsize-1-25em");
    return span && text(span) === text(heads[0]) ? text(heads[0]) : "";
  }
  function componentParts(component, doc, ctx) {
    var _a;
    const cls = component.classList;
    if (cls.contains("section-title")) {
      const { nodes, id } = sectionTitle(component, doc);
      return nodes.length ? [{ nodes, id }] : [];
    }
    if (cls.contains("text")) {
      if (isDocNumber(component)) {
        ctx.small.push(...richNodes(component, doc));
        return [];
      }
      const nodes = richNodes(component, doc);
      const title = enlargedH3(component);
      if (title && nodes.length === 1) {
        if ((_a = component.nextElementSibling) == null ? void 0 : _a.classList.contains("fullWidthImage")) {
          return [{ nodes: [underlined(doc, "h2", title)] }];
        }
        return [{ nodes, style: "h3-1-25" }];
      }
      return nodes.length ? [{ nodes }] : [];
    }
    if (cls.contains("marketoform")) {
      const nodes = marketoBlock(component, doc);
      return nodes.length ? [{ nodes, form: true }] : [];
    }
    if (cls.contains("divisioncontactus")) {
      const nodes = divisionContactUs(component, doc);
      if (component.querySelector("form")) {
        ctx.report.notes.push(`AEM division contact form (${text(component.querySelector("form h2")) || "no heading"}): heading and description kept if present, form not migrated`);
      }
      return nodes.length ? [{ nodes }] : [];
    }
    if (cls.contains("experiencefragment")) {
      if (!text(component)) return [];
      const xf = PAGE_XFS[ctx.path];
      if (!xf) {
        ctx.report.notes.push("Experience Fragment without a mapped XF path: not migrated");
        return [];
      }
      const nodes = fragmentBlock(xf, doc);
      ctx.report.fragments.push(nodes.length ? xfToFragmentPath(xf) : xf);
      return [{ nodes, own: true }];
    }
    if ([...cls].some((c) => /^cols/.test(c))) return ctx.columnRow(component, doc, ctx);
    if (cls.contains("fullWidthImage")) {
      ctx.report.notes.push("full-width decorative image (gold line) dropped");
      return [];
    }
    if (text(component)) ctx.report.notes.push(`unhandled component "${component.className}" dropped`);
    return [];
  }
  function columnRow(component, doc, ctx) {
    const columns = [...component.querySelectorAll(':scope > .colctrl > .row > [class*="col-"]')];
    const parts = (col) => {
      const inner = col.querySelector(":scope > .row") || col;
      return [...inner.children].flatMap((child) => componentParts(child, doc, ctx));
    };
    const formAt = columns.findIndex((col) => col.querySelector(".marketoform form[data-marketo-form-id]"));
    const columnParts = columns.map(parts);
    if (formAt < 0 || columns.length !== 2 || !columnParts[formAt].some((part) => part.form)) {
      return columnParts.flat();
    }
    const other = columnParts[1 - formAt];
    const own = columnParts[formAt];
    const formIndex = own.findIndex((part) => part.form);
    const above = own.slice(0, formIndex);
    const below = own.slice(formIndex + 1);
    const form = own[formIndex];
    if (!other.length) return [...above, form, ...below];
    const width = columns[formAt].className.match(/col-sm-(\d+)/);
    const formWide = width && Number(width[1]) > 6;
    const layout = formAt === 0 ? "flex-67-33" : "flex-33-67";
    const nodes = formAt === 0 ? [...form.nodes, ...other.flatMap((part) => part.nodes)] : [...other.flatMap((part) => part.nodes), ...form.nodes];
    if (!formWide) ctx.report.notes.push(`form column is not the wide one (${columns[formAt].className})`);
    return [...above, { nodes, style: `flex, ${layout}`, own: true }, ...below];
  }
  function sectionMetadata(doc, section) {
    const cells = {};
    if (section.style) cells.style = section.style;
    if (section.id) cells.id = section.id;
    return Object.keys(cells).length ? [WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells })] : [];
  }
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    if (!payload || !payload.template || payload.template.name !== TEMPLATE) return;
    const doc = element.ownerDocument;
    const report = payload.contactReport || {};
    ["phones", "notes", "fragments"].forEach((key) => {
      report[key] = report[key] || [];
    });
    const ctx = {
      path: sourcePath(payload),
      report,
      small: [],
      columnRow
    };
    const main = doc.querySelector("div.main.content.row") || element;
    const first = [];
    const h1 = main.querySelector(".h1-title h1");
    const title = text(h1) || doc.title.replace(/\s*\|\s*Stryker\s*$/i, "").trim();
    if (!text(h1)) report.notes.push(`no visible H1: H1 "${title}" from the page title`);
    if (title) first.push(el(doc, "h1", title));
    const contactus = main.querySelector(".c-contactus");
    if (contactus) first.push(...contactUs(contactus, doc, report));
    const areas = [...main.children].filter((child) => !child.querySelector(".h1-title, .c-contactus") && !child.matches(".h1-title, .c-contactus"));
    const parts = areas.flatMap((area) => [...area.children]).flatMap((component) => componentParts(component, doc, ctx));
    const sections = [{ nodes: first }];
    parts.forEach((part) => {
      const last = sections[sections.length - 1];
      if (!part.own && !part.style && !last.own && !last.style && sections.length > 1 && !(part.id && last.id)) {
        last.nodes.push(...part.nodes);
        if (part.id) last.id = part.id;
      } else {
        sections.push(__spreadProps(__spreadValues({}, part), { nodes: [...part.nodes] }));
      }
    });
    doc.querySelectorAll(".c-disclaimer:not([data-widget])").forEach((disclaimer) => {
      ctx.small.push(...richNodes(disclaimer, doc));
    });
    if (ctx.small.length) sections.push({ nodes: ctx.small, style: "disclaimer" });
    const out = [];
    sections.filter((section) => section.nodes.length).forEach((section, i) => {
      if (i > 0) out.push(doc.createElement("hr"));
      out.push(...section.nodes, ...sectionMetadata(doc, section));
    });
    element.replaceChildren(...out);
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

  // tools/importer/import-contact-division.js
  var PAGE_TEMPLATE = {
    name: "contact-division",
    description: 'www.stryker.com division "Contact us" pages (#509): H1; contact details as an underlined H2 + Columns (columns-50-50) block (addresses, H4 labels, tel:/mailto:/plain links | Google Maps link); Customizable Area in source order: section titles (underlined H2, title id as section id), rich text, Marketo Form blocks (a form beside text in a 1/3 + 2/3 row as a `flex, flex-33-67` / `flex, flex-67-33` section), AEM division contact forms as heading + description only, a shared Experience Fragment as a Fragment block; document numbers as a `disclaimer` section; `published` with `last-updated: show`.',
    urls: [
      "https://www.stryker.com/us/en/emergency-care/contact.html",
      "https://www.stryker.com/us/en/acute-care/contact.html",
      "https://www.stryker.com/us/en/endoscopy/contact.html",
      "https://www.stryker.com/us/en/joint-replacement/contact.html",
      "https://www.stryker.com/us/en/sage/sage.html",
      "https://www.stryker.com/us/en/surgical-technologies/surgical-technologies.html",
      "https://www.stryker.com/us/en/communications/contact.html",
      "https://www.stryker.com/us/en/interventional-spine/contact.html",
      "https://www.stryker.com/us/en/neurovascular/contact.html",
      "https://www.stryker.com/us/en/craniomaxillofacial/contact.html",
      "https://www.stryker.com/us/en/sustainability/contact.html",
      "https://www.stryker.com/us/en/sports-medicine/contact.html",
      "https://www.stryker.com/us/en/ent/ent.html",
      "https://www.stryker.com/us/en/orthopaedic-instruments/orthopaedic-instruments.html",
      "https://www.stryker.com/us/en/spine/contact.html",
      "https://www.stryker.com/us/en/foot-and-ankle/contact.html",
      "https://www.stryker.com/us/en/trauma-and-extremities/contact.html",
      "https://www.stryker.com/us/en/nse/contact.html",
      "https://www.stryker.com/us/en/ems/contact.html",
      "https://www.stryker.com/us/en/smart-care/contact.html",
      "https://www.stryker.com/us/en/services-and-solutions/flex-financial/flex-financial.html"
    ]
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
        payload.contactReport.notes.push(`transformer failed at ${hookName}: ${e.message}`);
      }
    });
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
  function marketoForms(document) {
    const forms = [...document.querySelectorAll("form.c-mkto-form[data-marketo-form-id]")];
    return forms.filter((form, i) => forms.findIndex((f) => f.getAttribute("data-marketo-form-id") === form.getAttribute("data-marketo-form-id")) === i).map((form) => {
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
  }
  var import_contact_division_default = {
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
      const published = publishedDate(document);
      const forms = marketoForms(document);
      const contactReport = { phones: [], notes: [], fragments: [] };
      const hookPayload = __spreadProps(__spreadValues({}, payload), { contactReport });
      executeTransformers("beforeTransform", main, hookPayload);
      executeTransformers("afterTransform", main, hookPayload);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      if (keywords) meta.Keywords = keywords;
      meta.site = "corp";
      meta.template = PAGE_TEMPLATE.name;
      if (published) {
        meta.published = published;
        meta["last-updated"] = "show";
      }
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      const blocks = [...main.querySelectorAll("table th, table tr:first-child td")].map((cell) => cell.textContent.trim()).filter((name) => /^(Columns|Marketo Form|Fragment)/.test(name));
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks,
          forms: JSON.stringify(forms),
          fragments: contactReport.fragments.join(", "),
          phones: JSON.stringify(contactReport.phones),
          notes: contactReport.notes.join(" | ")
        }
      }];
    }
  };
  return __toCommonJS(import_contact_division_exports);
})();
