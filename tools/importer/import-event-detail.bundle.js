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

  // tools/importer/import-event-detail.js
  var import_event_detail_exports = {};
  __export(import_event_detail_exports, {
    default: () => import_event_detail_default
  });

  // tools/importer/parsers/event-detail/event-detail.js
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/;
  var clean = (s) => (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  function formatDate(iso) {
    const m = iso.match(ISO);
    if (!m) return iso;
    const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
    return `${DAYS[day]} ${MONTHS[+m[2] - 1]} ${m[3]}, ${m[1]}`;
  }
  function formatTime(iso) {
    const m = iso.match(ISO);
    if (!m) return iso;
    const h = +m[4];
    return `${h % 12 || 12}:${m[5]} ${h < 12 ? "am" : "pm"}`;
  }
  var textOf = (el) => el ? clean(el.textContent) : "";
  function toIso(date, time) {
    const iso = date.match(ISO) || time.match(ISO);
    let ymd;
    if (date.match(ISO)) ymd = date.slice(0, 10);
    else {
      const d = date.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
      if (!d || !MONTHS.includes(d[1])) return "";
      ymd = `${d[3]}-${String(MONTHS.indexOf(d[1]) + 1).padStart(2, "0")}-${d[2].padStart(2, "0")}`;
    }
    if (time.match(ISO)) return `${ymd}T${time.match(ISO)[4]}:${time.match(ISO)[5]}:00`;
    const t = time.match(/(\d{1,2}):(\d{2})\s*([ap])m/i);
    if (!t) return iso ? `${ymd}T${iso[4]}:${iso[5]}:00` : ymd;
    const h = +t[1] % 12 + (t[3].toLowerCase() === "p" ? 12 : 0);
    return `${ymd}T${String(h).padStart(2, "0")}:${t[2]}:00`;
  }
  var isBlank = (el) => !clean(el.textContent) && !el.querySelector("img, a");
  function lines(el) {
    const out = [[]];
    [...el.childNodes].forEach((n) => {
      if (n.nodeName === "BR") out.push([]);
      else out[out.length - 1].push(n.cloneNode(true));
    });
    return out.filter((l) => l.some((n) => clean(n.textContent)));
  }
  function para(doc, nodes) {
    const p = doc.createElement("p");
    (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => p.append(n));
    const first = p.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = p.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return p;
  }
  function heading(doc, text, level = "h5") {
    const h = doc.createElement(level);
    h.textContent = text;
    return h;
  }
  function dividerHeading(doc, text) {
    const h = doc.createElement("h5");
    const u = doc.createElement("u");
    u.textContent = text;
    h.append(u);
    return h;
  }
  function link(doc, a, text) {
    const out = doc.createElement("a");
    out.href = a.getAttribute("href").trim();
    out.textContent = text || clean(a.textContent);
    return out;
  }
  function tidy(doc, p) {
    p.querySelectorAll("span").forEach((s) => s.replaceWith(...s.childNodes));
    p.querySelectorAll("b").forEach((b) => {
      const s = doc.createElement("strong");
      s.append(...b.childNodes);
      b.replaceWith(s);
    });
    return p;
  }
  function paragraphs(doc, container) {
    const out = [];
    let inline = [];
    const flush = () => {
      if (!inline.length) return;
      const holder = doc.createElement("div");
      holder.append(...inline);
      inline = [];
      lines(holder).forEach((l) => out.push(para(doc, l)));
    };
    [...container.childNodes].forEach((n) => {
      if (n.nodeType === 1 && /^(P|DIV)$/.test(n.nodeName)) {
        flush();
        if (n.querySelector("p, div, ul, ol")) out.push(...paragraphs(doc, n));
        else lines(n).forEach((l) => out.push(para(doc, l)));
      } else if (n.nodeType === 1 && /^(UL|OL)$/.test(n.nodeName)) {
        flush();
        out.push(n.cloneNode(true));
      } else if (n.nodeType === 1 && /^H[1-6]$/.test(n.nodeName)) {
        flush();
      } else {
        inline.push(n.cloneNode(true));
      }
    });
    flush();
    return out.map((p) => tidy(doc, p));
  }
  function parse(document) {
    var _a, _b, _c, _d, _e;
    const doc = document;
    const comp = doc.querySelector(".c-event-detail-component");
    if (!comp) return null;
    const walker = doc.createTreeWalker(comp, 128);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
    const facts = { title: clean((_a = comp.querySelector("h2")) == null ? void 0 : _a.textContent) };
    const main = [];
    const dt = comp.querySelector(".event-datetime-wrap");
    if (dt) {
      const start = textOf(dt.querySelector(".eventStartDate-wrap"));
      const end = textOf(dt.querySelector(".eventEndDate-wrap"));
      const endTimeEl = dt.querySelector(".eventEndTime-wrap");
      const startTime = textOf(dt.querySelector(".eventStartTime-wrap")) || start;
      const endTime = textOf(endTimeEl) || end;
      let tz = "";
      for (let n = endTimeEl && endTimeEl.nextSibling; n; n = n.nextSibling) tz += n.textContent;
      tz = clean(tz);
      facts.start = toIso(start, startTime);
      facts.end = toIso(end, endTime);
      if (tz) facts.timezone = tz;
      main.push(heading(doc, clean((_b = dt.querySelector("h5")) == null ? void 0 : _b.textContent) || "Meeting time"));
      const p = doc.createElement("p");
      p.append(
        `${formatDate(start)} - ${formatDate(end)}`,
        doc.createElement("br"),
        `${formatTime(startTime)} to ${formatTime(endTime)}${tz ? ` ${tz}` : ""}`
      );
      main.push(p);
    }
    const loc = comp.querySelector(".event-location-wrap");
    if (loc) {
      loc.querySelectorAll("h5").forEach((h5) => {
        const label = clean(h5.textContent);
        let p = h5.nextElementSibling;
        while (p && p.nodeName !== "P") p = p.nextElementSibling;
        if (!p) return;
        const value = lines(p).map((l) => clean(l.map((n) => n.textContent).join(""))).filter(Boolean).join(", ");
        if (!value) return;
        if (/^location$/i.test(label)) facts.location = value;
        if (/^country$/i.test(label)) facts.country = value;
        main.push(heading(doc, label), para(doc, value));
      });
    }
    const contact = comp.querySelector(".event-contact-wrap");
    if (contact) {
      const a = contact.querySelector("a[href]");
      const box = a && a.closest("p") || contact.querySelector("h5 ~ p");
      const rest = box ? box.cloneNode(true) : doc.createElement("p");
      rest.querySelectorAll("a").forEach((el) => el.remove());
      const name = clean(rest.textContent);
      if (name || a) {
        main.push(heading(doc, clean((_c = contact.querySelector("h5")) == null ? void 0 : _c.textContent) || "Contact"));
        const p = doc.createElement("p");
        if (name) p.append(name);
        if (name && a) p.append(doc.createElement("br"));
        if (a) p.append(link(doc, a));
        main.push(p);
        if (name) facts.contactName = name;
        if (a) facts.contactEmail = a.getAttribute("href").trim().replace(/^mailto:/i, "");
      }
    }
    const details = comp.querySelector(".event-details-wrap");
    if (details) {
      const body = paragraphs(doc, details).filter((p) => p.nodeName !== "P" || !isBlank(p));
      if (body.length) {
        main.push(dividerHeading(doc, clean((_d = details.querySelector("h5")) == null ? void 0 : _d.textContent) || "Details"), ...body);
      }
    }
    const disclaimer = comp.querySelector(".event-disclaimer-wrap");
    if (disclaimer) main.push(...paragraphs(doc, disclaimer).filter((p) => !isBlank(p)));
    const reg = comp.querySelector(".event-registration-wrap");
    if (reg) {
      const a = [...reg.querySelectorAll("a[href]")].find((el) => clean(el.textContent));
      if (a) reg.querySelectorAll("a[href]").forEach((el) => {
        var _a2;
        return (_a2 = el.closest("div:not(.event-registration-wrap)")) == null ? void 0 : _a2.remove();
      });
      const rest = paragraphs(doc, reg).filter((p) => p.nodeName !== "P" || !isBlank(p));
      if (a || rest.length) {
        main.push(dividerHeading(doc, clean((_e = reg.querySelector("h5")) == null ? void 0 : _e.textContent) || "Registration"));
        if (a) {
          facts.registration = a.getAttribute("href").trim();
          const strong = doc.createElement("strong");
          strong.append(link(doc, a));
          main.push(para(doc, strong));
        }
        main.push(...rest);
      }
    }
    const side = [];
    comp.querySelectorAll(".event-sidebar h5").forEach((h5) => {
      const links = [...h5.parentElement.querySelectorAll("a[href]")].filter((a) => clean(a.textContent));
      if (!links.length) return;
      side.push(heading(doc, clean(h5.textContent)));
      links.forEach((a) => side.push(para(doc, link(doc, a))));
    });
    const extras = [];
    [...doc.querySelectorAll(".c-title h2, .c-rich-text-editor, .c-resourcesanddownload .item")].filter((el) => comp.compareDocumentPosition(el) % 8 >= 4 && !el.closest("footer, #footer, header, #header")).forEach((el) => {
      var _a2;
      if (el.matches("h2")) {
        extras.push(heading(doc, clean(el.textContent), "h2"));
      } else if (el.matches(".item")) {
        const a = [...el.querySelectorAll("a[href]")].pop();
        const label = clean(a == null ? void 0 : a.textContent) || clean((_a2 = el.querySelector("img")) == null ? void 0 : _a2.getAttribute("alt"));
        if (a) extras.push(para(doc, link(doc, a, label)));
      } else {
        el.querySelectorAll("b br, strong br, span br").forEach((br) => {
          let host = br;
          const trailing = (n) => {
            for (let x = n.nextSibling; x; x = x.nextSibling) {
              if (clean(x.textContent)) return false;
            }
            return true;
          };
          const inline = (n) => {
            var _a3;
            return /^(B|STRONG|SPAN)$/.test((_a3 = n.parentElement) == null ? void 0 : _a3.nodeName);
          };
          while (inline(host) && trailing(host)) host = host.parentElement;
          if (host !== br) host.after(br);
        });
        [...(el.querySelector(":scope > div") || el).querySelectorAll("p")].filter((p) => !isBlank(p)).forEach((src) => {
          const p = tidy(doc, src.cloneNode(true));
          while (p.lastChild && (p.lastChild.nodeName === "BR" || p.lastChild.nodeType === 3 && !clean(p.lastChild.textContent))) p.lastChild.remove();
          extras.push(p);
        });
      }
    });
    const columns = WebImporter.Blocks.createBlock(doc, {
      name: "Columns (columns-67-33)",
      cells: [[main, side.length ? side : ""]]
    });
    return {
      facts,
      title: heading(doc, facts.title, "h1"),
      columns,
      extras
    };
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
    if (/(^|\/)index$/i.test(edsPath)) edsPath = edsPath.replace(/index$/i, "");
    return `${edsPath || "/"}${suffix}`;
  }
  function transform(hookName, element, payload) {
    const isSaResources = !!(payload && payload.template && payload.template.name === "sa-resources");
    const isIvsTreatment = !!(payload && payload.template && ["ivs-treatment", "ivs-get-the-facts", "ivs-contact"].includes(payload.template.name));
    const isNewsDetail = !!(payload && payload.template && ["news-detail", "news-detail-xf", "event-detail"].includes(payload.template.name));
    const isSkinnedContent = isSaResources || isIvsTreatment || isNewsDetail;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      if (isNewsDetail) return;
      if (isIvsTreatment) {
        WebImporter.DOMUtils.remove(element, [".fullWidthImageHero .hero-space", ".tabs-nav"]);
        element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading2) => {
          heading2.querySelectorAll('[style*="ffb500" i]').forEach((span) => {
            const text = span.textContent.replace(/ /g, " ").trim();
            if (!text) return;
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
        const text = span.textContent.replace(/ /g, " ").trim();
        if (!text) return;
        const strong = element.ownerDocument.createElement("strong");
        const em = element.ownerDocument.createElement("em");
        em.textContent = text;
        strong.appendChild(em);
        let target = span;
        let parent = span.parentElement;
        while (parent && (parent.tagName === "B" || parent.tagName === "STRONG" || parent.classList && parent.classList.contains("futura-bold")) && parent.textContent.replace(/ /g, " ").trim() === text) {
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

  // tools/importer/import-event-detail.js
  var PAGE_TEMPLATE = {
    name: "event-detail",
    description: 'www.stryker.com event pages (/us/en/global-events/**, #499). The H2 event title becomes the H1; the event fields go in one Columns (columns-67-33): main cell = Meeting time / Location / Country / Contact (H5 + text), Details and Registration as underlined H5s (divider convention) with their text, the bold "Disclaimer:" paragraph and the register link in bold (primary button); sidebar cell = Related links or empty. Customizable Area extras (e.g. Contact Us, PDFs) follow as default content in their own section; a document code (.c-disclaimer, e.g. "1000903067 Rev A") as a small-print `disclaimer` section. Map, PRINT and ADD TO CALENDAR are dropped; the event facts are kept as event-* page metadata (ISO start/end, timezone, location, country, registration, contact). Template CSS (templates/event-detail) sets the Futura bold title and 14px field headings.',
    urls: [
      "https://www.stryker.com/us/en/global-events/emergency-care/association-meetings/refractory-cardiac-arrest-symposium.html"
    ],
    blocks: [
      { name: "columns-67-33", instances: [".c-event-detail-component"] }
    ]
  };
  var transformers = [transform];
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
  function publishedDate(document) {
    var _a;
    const value = ((_a = document.querySelector("#hiddenPublishedDate")) == null ? void 0 : _a.getAttribute("value")) || "";
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : "";
  }
  function documentCode(document) {
    return [...document.querySelectorAll(".c-disclaimer")].filter((el) => !el.querySelector("#publishedDate") && !el.closest(".c-event-detail-component")).flatMap((el) => [...el.querySelectorAll("p")]).filter((p) => p.textContent.trim()).map((p) => {
      const out = document.createElement("p");
      out.textContent = p.textContent.replace(/\s+/g, " ").trim();
      return out;
    });
  }
  var import_event_detail_default = {
    transform: (payload) => {
      var _a, _b, _c, _d;
      const { document, url, params } = payload;
      const main = document.body;
      const published = publishedDate(document);
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      const ogImage = (_d = (_c = document.querySelector('meta[property="og:image"]')) == null ? void 0 : _c.getAttribute("content")) == null ? void 0 : _d.trim();
      const docCode = documentCode(document);
      executeTransformers("beforeTransform", main, payload);
      const event = parse(document);
      const blocks = [];
      if (event) {
        const parts = [event.title, event.columns];
        blocks.push("columns");
        if (event.extras.length) parts.push(document.createElement("hr"), ...event.extras);
        if (docCode.length) {
          parts.push(document.createElement("hr"), ...docCode, WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: [["style", "disclaimer"]]
          }));
        }
        main.replaceChildren(...parts);
      } else {
        console.error("event-detail: no .c-event-detail-component on", params.originalURL);
      }
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      const facts = event ? event.facts : {};
      if (facts.title) meta.Title = facts.title;
      else if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      if (keywords) meta.Keywords = keywords;
      if (ogImage && !meta.Image) {
        const img = document.createElement("img");
        img.src = ogImage;
        meta.Image = img;
      }
      meta.site = "corp";
      meta.template = "event-detail";
      if (published) meta.published = published;
      const rows = {
        "event-start": facts.start,
        "event-end": facts.end,
        "event-timezone": facts.timezone,
        "event-location": facts.location,
        "event-country": facts.country,
        "event-registration": facts.registration,
        "event-contact-name": facts.contactName,
        "event-contact-email": facts.contactEmail
      };
      Object.entries(rows).forEach(([k, v]) => {
        if (v) meta[k] = v;
      });
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks,
          extras: event ? event.extras.length : 0
        }
      }];
    }
  };
  return __toCommonJS(import_event_detail_exports);
})();
