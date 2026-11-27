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

  // tools/importer/import-news-xf.js
  var import_news_xf_exports = {};
  __export(import_news_xf_exports, {
    default: () => import_news_xf_default
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
  function percent(style2, re) {
    const m = style2.match(re);
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
      const style2 = overlay.getAttribute("style") || "";
      const top = percent(style2, /top:\s*(\d+(?:\.\d+)?)%/i);
      const left = percent(style2, /margin-left:\s*(\d+(?:\.\d+)?)%/i);
      const right = percent(style2, /width:\s*calc\(\s*100%\s*-\s*[\d.]+%\s*-\s*(\d+(?:\.\d+)?)%\s*\)/i);
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
  function parse3(element, { document }) {
    const link2 = videoLink(element, document);
    if (!link2) return;
    const cells = [[link2]];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Video", cells }));
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

  // tools/importer/transformers/news-basic-pages.js
  var NEWS = /^\/us\/en\/(about\/news|emergency-care\/news|sage\/news)\//;
  var text = (el) => (el.textContent || "").replace(/[\s\u00a0]+/g, " ").trim();
  var styles = (section) => (section.style || "").split(", ").filter(Boolean);
  var setStyles = (section, list) => {
    section.style = list.join(", ") || void 0;
  };
  var elements = (section) => section.nodes.filter((node) => node.nodeType === 1);
  var spacer = (style2 = "spacer") => ({ kind: "spacer", style: style2, nodes: [] });
  function isImageSection(section) {
    const els = elements(section);
    return els.length > 0 && !section.nodes.some((n) => n.nodeType === 3 && n.textContent.trim()) && els.every((el) => el.matches('picture, img, a[href*="/is/image/"]') || el.matches("p") && !text(el).replace(/^\S+$/, "") && el.querySelector('picture, img, a[href*="/is/image/"]'));
  }
  function sectionWith(sections, test) {
    return sections.find((s) => elements(s).some(test));
  }
  var startsWith = (prefix) => (el) => text(el).startsWith(prefix);
  function trimStart(el) {
    while (el.firstChild && (el.firstChild.nodeName === "BR" || el.firstChild.nodeType === 3 && !el.firstChild.textContent.trim())) el.firstChild.remove();
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^[\s\u00a0]+/, "");
  }
  function trimEnd(el) {
    while (el.lastChild && (el.lastChild.nodeName === "BR" || el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim())) el.lastChild.remove();
  }
  function splitAt(sections, section, test, rest = {}) {
    const at = section.nodes.findIndex((n) => n.nodeType === 1 && test(n));
    const moved = __spreadProps(__spreadValues({ kind: section.kind }, rest), { nodes: section.nodes.splice(at) });
    sections.splice(sections.indexOf(section) + 1, 0, moved);
    return moved;
  }
  function plainLeadImage(sections) {
    const i = sections.findIndex(isImageSection);
    if (i < 0) return;
    setStyles(sections[i], styles(sections[i]).filter((s) => !/^image-/.test(s)));
    if (i > 0 && sections[i - 1].kind === "spacer") sections.splice(i - 1, 1);
  }
  function splitParagraphAt(p, label, doc) {
    const strong = [...p.querySelectorAll("strong")].find((s) => text(s) === label);
    if (!strong || strong.parentElement !== p) return null;
    const next = doc.createElement("p");
    let node = strong;
    while (node) {
      const following = node.nextSibling;
      next.append(node);
      node = following;
    }
    trimEnd(p);
    next.normalize();
    [...next.childNodes].forEach((n) => {
      if (n.nodeType === 3 && n.previousSibling && n.previousSibling.nodeName === "BR") n.textContent = n.textContent.replace(/^[\s\u00a0]+/, "");
    });
    p.after(next);
    return next;
  }
  function basicRules(sections, doc) {
    sections.forEach((section) => {
      const s = styles(section);
      const els = elements(section);
      if (s.includes("serif") && s.includes("p-1-25") && els.length === 1 && els[0].matches("p")) {
        const h4 = doc.createElement("h4");
        const em = doc.createElement("em");
        em.append(...els[0].childNodes);
        h4.append(em);
        section.nodes = [h4];
        setStyles(section, s.filter((x) => x !== "serif" && x !== "p-1-25"));
        const next = sections[sections.indexOf(section) + 1];
        if (next && styles(next).includes("join") && !elements(next).every((el) => el.matches("ul, ol"))) {
          setStyles(next, styles(next).filter((x) => x !== "join"));
        }
      }
      if (s.includes("separator")) {
        for (let i = section.nodes.length - 2; i >= 0; i -= 1) {
          const p = section.nodes[i];
          const next = section.nodes[i + 1];
          const label = p.nodeType === 1 && p.matches("p") && p.children.length === 1 && p.firstElementChild.matches("strong") && text(p) === text(p.firstElementChild) && text(p);
          if (label && next.nodeType === 1 && next.matches("p") && !next.querySelector(":scope > strong:only-child")) {
            trimStart(next);
            p.append(doc.createElement("br"), ...next.childNodes);
            section.nodes.splice(i + 1, 1);
          }
        }
      }
    });
  }
  var CORRECTIONS = {
    "2022/stryker-announces-definitive-agreement-to-acquire-vocera-communi": (sections, doc) => {
      sections.forEach((s) => elements(s).forEach((el) => el.querySelectorAll("strong").forEach((strong2) => {
        if (!/^For (investor|media) inquiries please contact:$/.test(text(strong2))) return;
        const u2 = doc.createElement("u");
        u2.append(...strong2.childNodes);
        strong2.replaceWith(u2);
      })));
      const link2 = sectionWith(sections, (el) => /^(\[\[color-teal\])?READ MORE ON OUR INVESTOR RELATIONS SITE HERE/.test(text(el)));
      const i = sections.indexOf(link2);
      if (i < 1) return;
      const a = elements(link2)[0].querySelector("a");
      const p = doc.createElement("p");
      const strong = doc.createElement("strong");
      const u = doc.createElement("u");
      u.textContent = text(a).replace(/\s*►\s*$/, "");
      a.textContent = "";
      a.append(u);
      strong.append(a);
      p.append(strong);
      sections[i - 1].nodes.push(p);
      setStyles(sections[i - 1], styles(sections[i - 1]).filter((x) => x !== "ps-0"));
      sections.splice(i, 1);
    },
    "2023/cd-nxt-power-tool-system-empowers-surgeons-through-real-time-dep": (sections) => {
      const body = sectionWith(sections, startsWith("For more information"));
      if (!body) return;
      body.nodes.forEach((n) => n.nodeType === 1 && n.querySelectorAll("a").forEach((a) => {
        a.textContent = a.textContent.replace("stryker.com//", "stryker.com/");
      }));
      const more = splitAt(sections, body, startsWith("For more information"));
      const about = splitAt(sections, more, startsWith("About Stryker"));
      const strong = elements(about)[0].querySelector("strong");
      if (strong) trimStart(strong);
      sections.splice(sections.indexOf(about), 0, spacer("spacer, small"));
    },
    "2023/cerus-endovascular": (sections, doc) => {
      const about = sectionWith(sections, startsWith("About Stryker"));
      if (!about) return;
      const p = elements(about).find(startsWith("About Stryker"));
      const contact = splitParagraphAt(p, "Media contact", doc);
      if (contact) about.nodes.splice(about.nodes.indexOf(p) + 1, 0, contact);
      setStyles(about, [...styles(about), "label-1-5"]);
    },
    "2023/stryker-celebrates-wind-power-milestone-on-our-way-to-become-carbon-neutral": (sections) => {
      const note = sectionWith(sections, startsWith("*Based on 2022"));
      if (note) setStyles(note, styles(note).filter((s) => s !== "references-body-lines"));
    },
    "2024/new-intermediate-nail-and-rc-lag-screw-expand-gamma4-portfolio-to-meet-the-needs-of-surgeons-and-their-patients": (sections) => {
      plainLeadImage(sections);
      const about = sectionWith(sections, startsWith("About Stryker"));
      if (!about) return;
      const contact = splitAt(sections, about, startsWith("Media contact"), { style: void 0 });
      const at = sections.indexOf(contact);
      sections.splice(at, 0, spacer("spacer, small"));
      sections.splice(at + 2, 0, spacer("separator"), spacer("spacer, small"));
    },
    "2024/stryker-announces-launch-of-pangea-plating-system": (sections) => plainLeadImage(sections),
    "2024/stryker-receives-don-clifton-strengths-based-culture-award-for-f": (sections) => plainLeadImage(sections),
    "2025/inari-medical-stryker-launches-all-new-inthrill-thrombectomy-system": (sections) => {
      const about = sectionWith(sections, startsWith("About Stryker"));
      if (about) sections.splice(sections.indexOf(about) + 1, 0, spacer());
    },
    "2025/stryker-launches-surpass-elite-flow-diverter": (sections) => {
      const notes = sectionWith(sections, startsWith("AP-004954"));
      if (notes && elements(notes).length > 1) splitAt(sections, notes, startsWith("AP-004954"), { style: "disclaimer" });
    },
    "2025/stryker-launches-sync-badge": (sections, doc) => {
      const sub = sections.find((s) => elements(s).length === 1 && elements(s)[0].matches("h4"));
      if (sub) sub.nodes.push(doc.createElement("h4"));
    },
    "2025/stryker-unveils-new-intracranial-base-catheter": (sections) => plainLeadImage(sections),
    "2026/stryker-signs-definitive-agreement-to-acquire-zurimed-to-enhance": (sections, doc) => {
      const lead = sectionWith(sections, (el) => el.matches("ul"));
      if (lead && lead.nodes.some((n) => n.nodeType === 1 && !n.matches("ul"))) {
        const body = splitAt(sections, lead, (el) => !el.matches("ul"));
        sections.splice(sections.indexOf(body), 0, spacer());
      }
      const contacts = sectionWith(sections, startsWith("Contacts"));
      if (!contacts) return;
      const p = elements(contacts).find(startsWith("Contacts"));
      const media = p && contacts.nodes[contacts.nodes.indexOf(p) + 1];
      if (media && media.nodeType === 1 && startsWith("For media inquiries")(media)) {
        p.append(doc.createElement("br"), doc.createElement("br"), ...media.childNodes);
        contacts.nodes.splice(contacts.nodes.indexOf(media), 1);
      }
    },
    "emergency-care/news/2024/ems-powered-products": (sections) => {
      const title = sectionWith(sections, (el) => el.matches("h1"));
      if (title) {
        setStyles(title, styles(title).filter((x) => x !== "center" && x !== "date-above"));
        sections.splice(sections.indexOf(title) + 1, 0, spacer());
      }
      const body = sectionWith(sections, startsWith("3-minute read"));
      if (!body) return;
      setStyles(body, ["p-1-25"]);
      elements(body).forEach((el) => [el, ...el.querySelectorAll("[data-section-style]")].forEach((x) => x.removeAttribute("data-section-style")));
      let part = body;
      [
        "Power-PRO 2 powered ambulance cot",
        "LUCAS 3, v3.1 chest compression system",
        "Power-LOAD powered cot fastener",
        "Together, we save lives",
        "Proven to save financial guarantee"
      ].forEach((heading) => {
        if (elements(part).some((el) => el.matches("h3") && text(el).startsWith(heading))) {
          part = splitAt(sections, part, (el) => el.matches("h3") && text(el).startsWith(heading), { style: "p-1-25" });
        }
      });
      sections.splice(sections.indexOf(part) + 1, 0, spacer());
    }
  };
  function basicPageCorrections(sections, path, doc) {
    const key = path.replace(NEWS, (m, area) => area === "about/news" ? "" : `${area}/`).replace(/\.html$/, "").replace(/--+/g, "-").replace(/-(?=\/|$)/g, "");
    const fix = CORRECTIONS[key];
    if (fix) fix(sections, doc);
  }

  // tools/importer/transformers/news-detail-sections.js
  var SOURCE_ORIGIN = "https://www.stryker.com";
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
  var KEEP_ATTRS = {
    A: ["href"],
    IMG: ["src", "alt"],
    TD: ["colspan", "rowspan"],
    TH: ["colspan", "rowspan"],
    H2: ["data-section-style"],
    H3: ["data-section-style"],
    H4: ["data-section-style"]
  };
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
    return href && href.startsWith("/content/dam/") ? `${SOURCE_ORIGIN}${href}` : href;
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
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const covers2 = (cls) => copy.every((el) => {
      const spans = [...el.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
      return squash(spans.map((span) => span.textContent).join("")) === squash(el.textContent);
    });
    const size = SIZE_STYLES.find(([cls]) => covers2(cls));
    const font = FONT_STYLES.find(([cls]) => covers2(cls));
    return [size && size[1], font && font[1]].filter(Boolean).join(", ");
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
  function tagTextSize(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    [...root.querySelectorAll(".fontsize-1-25em")].forEach((span) => {
      if (span.parentElement.closest(".fontsize-1-25em") || !text2(span)) return;
      const heading = span.closest("h2, h3, h4");
      if (!heading || squash(heading.textContent) !== squash(span.textContent)) return;
      heading.setAttribute("data-section-style", `${heading.tagName.toLowerCase()}-1-25`);
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
  function tagGoldText(root) {
    const tagged = /* @__PURE__ */ new Set();
    const wrap = (nodes) => markGold(nodes, root);
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
  function cleanRichText(root) {
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
    root.querySelectorAll("span.futura-bold, b").forEach((el) => rename(el, "strong"));
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
      if (!text2(el) && !el.querySelector("img")) el.remove();
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
  function futuraLinkParagraphs(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.children].filter((p) => {
      if (p.tagName !== "P") return false;
      const links = p.querySelectorAll("a[href]");
      const all = squash(p.textContent);
      if (links.length !== 1 || !all || squash(links[0].textContent) !== all) return false;
      if (/\bbtn\b/.test(links[0].className) || p.querySelector("img")) return false;
      const spans = [...p.querySelectorAll(".futura-bold")].filter((span) => !span.parentElement.closest(".futura-bold"));
      return squash(spans.map((span) => span.textContent).join("")) === all;
    }));
  }
  function serifHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    return new Set([...root.querySelectorAll("h2, h3")].filter((h) => {
      if (!text2(h) || h.querySelector(".futura-bold, b, strong")) return false;
      if (![...h.querySelectorAll("[class]")].some((el) => [...el.classList].some((c) => !c.startsWith("fontsize-")))) return true;
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
  var HEADING_SIZES = [
    ["H2", "fontsize-8em", "h2-0-8"],
    ["H2", "fontsize-1-5em", "h2-1-5"],
    ["H1", "fontsize-1-25em", "h1-1-25"]
  ];
  function smallHeadings(root) {
    const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
    const styles2 = /* @__PURE__ */ new Map();
    root.querySelectorAll("h1, h2").forEach((h) => {
      if (!text2(h)) return;
      const match = HEADING_SIZES.find(([tag, cls]) => {
        if (h.tagName !== tag) return false;
        const spans = [...h.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`));
        return squash(spans.map((span) => span.textContent).join("")) === squash(h.textContent);
      });
      if (match) styles2.set(h, match[2]);
    });
    return styles2;
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
    const squash = (value) => value.replace(/[\s ]+/g, " ").trim();
    const leadText = squash(lead.map((node) => node.textContent).join(""));
    if (!leadText) return null;
    const box = doc.createElement("div");
    lead.forEach((node) => box.append(node.cloneNode(true)));
    const covered = (cls) => squash([...box.querySelectorAll(`.${cls}`)].filter((span) => !span.parentElement.closest(`.${cls}`)).map((span) => span.textContent).join("")) === leadText;
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
    lead.forEach((node) => node.remove());
    while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) p.firstChild.remove();
    if (!text2(p)) p.remove();
    const h1 = doc.createElement("h1");
    const bold = titleStyle === "h1-2-5";
    const holder = bold ? doc.createElement("strong") : h1;
    if (bold) h1.append(holder);
    runs.forEach((run, i) => {
      let value = run.text.replace(/[\s ]+/g, " ");
      if (i === 0) value = value.trimStart();
      if (i === runs.length - 1) value = value.trimEnd();
      if (!run.gold || !value.trim()) {
        if (value) holder.append(value);
        return;
      }
      const [, before, words, after] = value.match(/^(\s*)(.*?)(\s*)$/);
      if (before) holder.append(before);
      const em = doc.createElement("em");
      em.textContent = words;
      if (bold) holder.append(em);
      else {
        const strong = doc.createElement("strong");
        strong.append(em);
        holder.append(strong);
      }
      if (after) holder.append(after);
    });
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
    const style2 = box ? box.getAttribute("style") : "";
    return !new RegExp(`(margin|padding)-${side}:\\s*[\\d.]+`).test(style2);
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
    const indents = [...box.querySelectorAll(':scope > p[style*="margin-left"]')].filter((p) => {
      const px = (p.getAttribute("style").match(/margin-left:\s*(\d+)px/) || [])[1];
      return Math.round(Number(px || 0) / 40) > 0;
    });
    const { centred, size } = cleanRichText(box);
    indents.forEach((p) => {
      const list = p.previousElementSibling;
      const item = list && list.matches("ul, ol") && list.lastElementChild;
      if (!box.contains(p) || !item || !text2(p)) return;
      item.append(doc.createElement("br"), ...p.childNodes);
      p.remove();
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
      if (serifHeads.has(node) && !node.querySelector("em")) {
        const em = doc.createElement("em");
        em.append(...node.childNodes);
        node.append(em);
      }
      if (smallHeads.has(node)) node.headingStyle = smallHeads.get(node);
    });
    let last = null;
    nodes.forEach((node) => {
      const style2 = elementStyles.get(node);
      node.copyStyle = style2 === void 0 || style2 === null ? last : style2;
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
        const styles2 = (node.copyStyle || "").split(", ").filter(Boolean);
        node.copyStyle = [.../* @__PURE__ */ new Set([...styles2, ...boxStyles.filter(Boolean)])].join(", ");
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
      if (source.classList.contains("btn-purple")) {
        const u = doc.createElement("u");
        u.append(a);
        const em = doc.createElement("em");
        em.append(u);
        const p2 = doc.createElement("p");
        p2.append(em);
        return p2;
      }
      if (source.classList.contains("btn-blue")) a.setAttribute("data-btn-style", "btn-blue");
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
    const boxed = !!rte.querySelector('.has-background, [class*="bg-light-gray"]');
    const block = WebImporter.Blocks.createBlock(doc, {
      name: `Columns (columns-50-50${boxed ? ", gray-lead" : ""})`,
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
      if (/^[“”"‘’']+$/.test(text2(strong)) && strong.querySelector(".gold-text")) {
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
            const style2 = share <= 1 / 3 + 0.01 && "image-1-3" || share <= 0.5 + 0.01 && "image-1-2" || "";
            if (style2) item.querySelector(".c-standalone-image").setAttribute("data-xf-image-style", style2);
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
      const squash = (value) => value.replace(/[\s\u00a0]+/g, "");
      const sizes = new Set([...p.querySelectorAll('[class*="fontsize-"]')].flatMap((el) => [...el.classList].filter((c) => c.startsWith("fontsize-"))));
      sizes.forEach((size) => {
        const runs = [...p.querySelectorAll(`.${size}`)].filter((el) => !el.parentElement.closest(`.${size}`));
        if (runs.length < 2 || squash(runs.map((el) => el.textContent).join("")) !== squash(p.textContent)) return;
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
    const linkVariant = tiles ? "product-tiles" : "media-pair";
    const variants = [marker.getAttribute("data-variant"), nodes.some((node) => node.imageLink) ? linkVariant : ""].filter(Boolean);
    const name = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
    const copy = nodes.filter((node) => node.copyStyle !== void 0 && node.copyStyle !== null).sort((a, b) => text2(b).length - text2(a).length)[0];
    const style2 = copy ? copy.copyStyle : "";
    nodes.forEach((node) => {
      if (!(node.copyStyle || "").split(", ").includes("p-1-25") || style2.split(", ").includes("p-1-25")) return;
      const lines = node.matches("ul, ol") ? [...node.querySelectorAll("li")] : [node];
      lines.filter((line) => line.matches("p, li") && text2(line)).forEach((line) => {
        line.prepend(doc.createTextNode("[[text-1-25]"));
        line.append(doc.createTextNode("]"));
      });
    });
    const block = WebImporter.Blocks.createBlock(doc, { name, cells: [cells.map((c) => c.length ? c : "")] });
    return { block, style: style2 };
  }
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const templateName = payload && payload.template && payload.template.name;
    if (!["news-detail", "news-detail-xf", "text-only"].includes(templateName)) return;
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
      const style2 = [separatorNext ? "separator" : "", sectionStyle, blankNext ? "blank-above" : ""].filter(Boolean).join(", ") || void 0;
      separatorNext = false;
      blankNext = false;
      current = { kind, style: style2, nodes: [] };
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
    const setVideoTheme = (theme) => {
      if (element.getAttribute("data-news-theme") === "full-width, news-video-quote") return;
      element.setAttribute("data-news-theme", `full-width, ${theme}`);
    };
    const trimLeading = (el) => {
      el.normalize();
      while (el.firstChild && (el.firstChild.nodeName === "BR" || el.firstChild.nodeType === 3 && !el.firstChild.textContent.trim())) el.firstChild.remove();
      if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, "");
    };
    const videoHeadlineRow = (video, headline2, quotes, ctas, asideCtas) => {
      const boxed = !!headline2.querySelector('.has-background, [class*="bg-light-gray"]');
      const lead = boxed ? headlineNodes(headline2, doc) : [];
      if (boxed && !lead.length) return false;
      const h3Statement = boxed && lead.length > 0;
      let statement = lead;
      const titleBold = lead.length > 1 && headline2.querySelector('.line1 [class*="fontsize-2vw"] .futura-bold');
      const titleRun = titleBold && lead[0].firstElementChild;
      if (titleRun && titleRun.nodeName === "STRONG" && text2(titleRun) === text2(titleBold) && text2(lead[0]).length > text2(titleRun).length) {
        const title2 = doc.createElement("h2");
        title2.append(...titleRun.childNodes);
        titleRun.remove();
        const subtitle2 = doc.createElement("h2");
        const em = doc.createElement("em");
        em.append(...lead[0].childNodes);
        trimLeading(em);
        subtitle2.append(em);
        lead.splice(0, 1, title2, subtitle2);
      }
      if (h3Statement) {
        const at = Math.max(0, lead.findIndex((n) => n.nodeName !== "H2"));
        const h3 = rename(lead[at], "h3");
        if (!h3.querySelector("em")) {
          const em = doc.createElement("em");
          em.append(...h3.childNodes);
          h3.append(em);
        }
        trimLeading(h3.querySelector("em"));
        statement = [...lead.slice(0, at), h3, ...lead.slice(at + 1)];
      }
      const nodes = [
        ...statement,
        ...(boxed ? quotes : [headline2, ...quotes]).flatMap((q) => quoteNodes(q, doc)),
        ...asideCtas.flatMap((cta) => buttonNodes(cta, doc))
      ];
      [headline2, ...quotes, ...ctas, ...asideCtas].forEach((c) => consumed.add(c));
      nodes.forEach((node) => node.querySelectorAll(":is(strong, b) :is(strong, b)").forEach(unwrap));
      const quoteRow = boxed ? quotes.length > 0 : /^[“”"]/.test(text2(nodes[0] || doc.createElement("p")));
      setVideoTheme(quoteRow ? "news-video-quote" : "news-video");
      const section = startSection("video-text", h3Statement || quoteRow ? "video-text" : "video-text, headline-1-5vw");
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
      [lead, ...quotes].forEach((c) => consumed.add(c));
      if (quotes.length && nodes[0].nodeName === "P") {
        const h3 = rename(nodes[0], "h3");
        if (!h3.querySelector("em")) {
          const em = doc.createElement("em");
          em.append(...h3.childNodes);
          h3.append(em);
        }
        nodes[0] = h3;
        nodes.filter((n) => n.nodeName === "P" && /^_{5,}$/.test(text2(n))).forEach((rule) => rule.querySelectorAll("strong, em").forEach(unwrap));
        setVideoTheme("news-video-quote");
        const section2 = startSection("video-text", "video-text");
        section2.background = "light-gray";
        section2.nodes.push(video, ...nodes);
        current = null;
        return true;
      }
      setVideoTheme("news-video");
      const style2 = [
        "video-text",
        asideCol.querySelector(".urw-egyptienne") && "serif",
        lead.querySelector(".fontsize-1-5em") && "p-1-5",
        quotes.some((q) => q.querySelector(".fontsize-1-75em")) && "quote-1-75"
      ].filter(Boolean).join(", ");
      const section = startSection("video-text", style2);
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
        const { block, style: style2 } = xfColumns(component, doc);
        if (!current || current.kind !== "xf-columns" || current.copy !== style2) {
          startSection("xf-columns", style2 || void 0).copy = style2;
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
          const style2 = [columnStyle, linkStyle].filter(Boolean).join(", ");
          startSection(isFirst ? "lead" : "image", style2 || void 0).nodes.push(...nodes2);
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
        const boxedText = textAside && textAside.querySelector('.has-background, [class*="bg-light-gray"]') && richTextNodes(textAside, doc).nodes;
        if (boxedText && boxedText.length) {
          consumed.add(textAside.closest(COMPONENTS) || textAside);
          const h3 = rename(boxedText[0], "h3");
          if (!h3.querySelector("em")) {
            const em = doc.createElement("em");
            em.append(...h3.childNodes);
            h3.append(em);
          }
          setVideoTheme("news-video");
          const section = startSection("video-text", "video-text");
          section.background = "light-gray";
          section.nodes.push(component, h3, ...boxedText.slice(1));
          current = null;
          return;
        }
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
        const subtitle2 = component.querySelector(".cta-subtitle, .cta-title");
        if (subtitle2 && text2(subtitle2)) {
          const p = doc.createElement("p");
          const strong = doc.createElement("strong");
          strong.textContent = text2(subtitle2);
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
          dropBracketTags(current.nodes[0]);
          current.style = goldStyle;
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
        const styles2 = [centred ? "center" : "", ...extra].filter(Boolean);
        const kind = [centred ? "center" : "body", ...extra].join(" ");
        if (!current || current.kind !== kind) {
          if (node.followsText && current && i > 0) {
            current.style = [current.style, "ps-0"].filter(Boolean).join(", ");
          }
          const join = (i > 0 || stacked) && current && !node.followsText ? ["join"] : [];
          startSection(kind, [...styles2, ...join].join(", ") || void 0);
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
      cleanRichText(box);
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
    const representativeTheme = element.getAttribute("data-representative-theme");
    if (representativeTheme) {
      element.removeAttribute("data-representative-theme");
      element.setAttribute("data-news-theme", representativeTheme);
      const groupSizes = (element.getAttribute("data-representative-sizes") || "").split(",").filter(Boolean);
      element.removeAttribute("data-representative-sizes");
      const keepStyles = element.hasAttribute("data-representative-keep");
      element.removeAttribute("data-representative-keep");
      const THEME_SIZES = keepStyles ? new Set(groupSizes) : /* @__PURE__ */ new Set(["p-1", "p-1-25", "p-1-5", "p-1-75", "h2-1-25", "h3-1-25", "h4-1-25", "h4-line-above", "join", ...groupSizes]);
      const groupRules = element.getAttribute("data-representative-rules");
      element.removeAttribute("data-representative-rules");
      if (groupRules === "basic") basicRules(sections, doc);
      if (element.hasAttribute("data-representative-merge")) {
        element.removeAttribute("data-representative-merge");
        const isText = (section) => section && section.kind !== "spacer" && section.nodes.every((node) => node.nodeType !== 1 || /^(P|H[1-6]|UL|OL)$/.test(node.tagName));
        for (let i = sections.length - 1; i > 0; i -= 1) {
          const section = sections[i];
          const prev = sections[i - 1];
          const list = (section.style || "").split(", ").filter(Boolean);
          if (list.includes("join") && list.every((s) => THEME_SIZES.has(s)) && isText(section) && isText(prev) && !section.background) {
            prev.nodes.push(...section.nodes);
            sections.splice(i, 1);
          }
        }
      }
      const footnoteNumber = (p) => {
        const first = p.firstChild;
        if (first && first.nodeName === "SUP" && /^\s*\d+\s*$/.test(first.textContent)) {
          return { n: Number(first.textContent.trim()), strip: () => first.remove() };
        }
        const m = first && first.nodeType === 3 && first.textContent.match(/^[\s .]*(\d+)\.[\s ]*/);
        return m ? { n: Number(m[1]), strip: () => {
          first.textContent = first.textContent.slice(m[0].length);
        } } : null;
      };
      sections.forEach((section) => {
        section.style = (section.style || "").split(", ").filter((s) => s && !THEME_SIZES.has(s)).join(", ") || void 0;
        section.nodes.filter((node) => node.nodeType === 1).forEach((node) => {
          [node, ...node.querySelectorAll("[data-section-style]")].forEach((el) => {
            if (THEME_SIZES.has(el.getAttribute("data-section-style"))) el.removeAttribute("data-section-style");
          });
        });
        const paragraphs = section.nodes.filter((node) => node.nodeType === 1);
        if (keepStyles || !paragraphs.length || !paragraphs.every((p) => p.tagName === "P")) return;
        const numbers = paragraphs.map(footnoteNumber);
        if (numbers.some((num, i) => !num || num.n !== i + 1)) return;
        const ol = doc.createElement("ol");
        paragraphs.forEach((p, i) => {
          numbers[i].strip();
          p.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
          const li = doc.createElement("li");
          li.append(...p.childNodes);
          li.normalize();
          if (li.firstChild && li.firstChild.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^[\s ]+/, "");
          ol.append(li);
        });
        section.nodes = [ol];
      });
      if (groupRules === "basic") {
        let path = "";
        try {
          path = new URL(payload.params.originalURL).pathname.toLowerCase();
        } catch (e) {
          path = "";
        }
        basicPageCorrections(sections, path, doc);
      }
    }
    const out = [];
    sections.filter((section) => section.nodes.length || section.kind === "spacer").forEach((section, i) => {
      if (i > 0) out.push(doc.createElement("hr"));
      out.push(...section.nodes);
      const MARKS = ["data-btn-style", "data-section-style"];
      const selector = MARKS.map((m) => `[${m}]`).join(", ");
      const marked = section.nodes.flatMap((node) => node.nodeType === 1 ? [...node.matches(selector) ? [node] : [], ...node.querySelectorAll(selector)] : []);
      const markStyles = marked.flatMap((el) => MARKS.map((m) => el.getAttribute(m)).filter(Boolean));
      [...new Set(markStyles)].forEach((style2) => {
        if ((section.style || "").split(", ").includes(style2)) return;
        section.style = [section.style, style2].filter(Boolean).join(", ");
      });
      marked.forEach((el) => MARKS.forEach((m) => el.removeAttribute(m)));
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

  // tools/importer/transformers/news-typography.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MARK = "data-news-section";
  var RUN = "news-run";
  var BLOCKS = "h1, h2, h3, h4, h5, h6, p, ul, ol";
  var TEXT_BLOCKS = "p, li";
  var HEADINGS = "h2, h3, h4, h5, h6";
  var SIZE_STYLES2 = { "1-25": "lead", "1-75": "p-1-75" };
  var SIZES = ["1-25", "1-5", "1-75", "2", "2-5", "8"];
  var GOLD_MARK = "gold-text";
  var COLOURS = {
    ffb500: "color-gold",
    "1c5687": "color-blue",
    "85458a": "color-purple",
    "4c7d7a": "color-teal",
    "27455c": "color-navy",
    545857: "color-grey",
    ffffff: "color-white"
  };
  var PARAS = [
    ".c-rich-text-editor p",
    ".c-rich-text-editor div:not(:has(p, div, ul, ol, h1, h2, h3, h4, h5, h6, table))",
    ".c-largeheadline p"
  ].join(", ");
  var norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  var DIVIDER2 = /_{3,}/;
  var textOf = (el) => norm((el.textContent || "").replace(/_{3,}/g, ""));
  function unwrap2(el) {
    el.replaceWith(...el.childNodes);
  }
  function rename2(el, tag) {
    const next = el.ownerDocument.createElement(tag);
    next.append(...el.childNodes);
    el.replaceWith(next);
    return next;
  }
  function toHex(value) {
    const v = (value || "").trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3})$/);
    if (m) return m[1].split("").map((c) => c + c).join("");
    m = v.match(/^#([0-9a-f]{6})$/);
    if (m) return m[1];
    m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    return "";
  }
  function inlineColour(el) {
    if (el.tagName === "FONT" && el.getAttribute("color")) return toHex(el.getAttribute("color"));
    const m = (el.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    return m ? toHex(m[1]) : "";
  }
  function clearColour(el) {
    el.removeAttribute("color");
    const style2 = (el.getAttribute("style") || "").split(";").map((d) => d.trim()).filter((d) => d && !/^color\s*:/i.test(d));
    if (style2.length) el.setAttribute("style", style2.join("; "));
    else el.removeAttribute("style");
  }
  function covers(block, selector) {
    const text3 = textOf(block);
    if (!text3) return false;
    const styled = [...block.querySelectorAll(selector)].filter((el) => !block.contains(el.parentElement.closest(selector))).map(textOf).join(" ");
    return norm(styled).length >= text3.length - 1;
  }
  function sizeOf(block) {
    const found = SIZES.filter((s) => covers(block, `.fontsize-${s}em`));
    if (found.length < 2) return found[0] || "";
    return found.find((s) => {
      const span = block.querySelector(`.fontsize-${s}em`);
      return !found.some((o) => o !== s && span.parentElement.closest(`.fontsize-${o}em`));
    }) || found[0];
  }
  var isDividerBlock = (el) => !!el && DIVIDER2.test(el.textContent) && !textOf(el);
  function dividerNodes(block) {
    const walker = block.ownerDocument.createTreeWalker(block, 4);
    const lines = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (DIVIDER2.test(n.textContent) && /^[\s_]*$/.test(n.textContent)) lines.push(n);
    }
    return lines;
  }
  function dividerOf(block) {
    const holder = dividerNodes(block).length ? block : block.nextElementSibling;
    const [line] = holder && (holder === block || isDividerBlock(holder)) ? dividerNodes(holder) : [];
    if (!line) return "";
    for (let e = line.parentElement; e && e !== holder.parentElement; e = e.parentElement) {
      const c = inlineColour(e);
      if (c) return c;
    }
    return "none";
  }
  function stripDivider(block) {
    const lines = dividerNodes(block);
    if (lines.length) lines.forEach((n) => n.remove());
    else if (isDividerBlock(block.nextElementSibling)) block.nextElementSibling.remove();
  }
  function trimInside(el) {
    const first = el.firstChild;
    const last = el.lastChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
  }
  function toRuledHeading(p, tag, divider) {
    stripDivider(p);
    const h = rename2(p, tag);
    h.querySelectorAll("br").forEach((br) => br.replaceWith(h.ownerDocument.createTextNode(" ")));
    h.querySelectorAll("span, strong, b, em, i, font").forEach(unwrap2);
    h.normalize();
    trimInside(h);
    const doc = h.ownerDocument;
    const u = doc.createElement("u");
    const gold = COLOURS[divider] === "color-gold";
    if (gold) u.append(doc.createTextNode("[[rule-gold]"));
    u.append(...h.childNodes);
    if (gold) u.append(doc.createTextNode("]"));
    h.append(u);
    return h;
  }
  function promoteTitles(root) {
    const paras = [...root.querySelectorAll(PARAS)];
    if (!root.querySelector("h1")) {
      const title = paras.find((p) => p.querySelector(".futura-bold") && textOf(p) && (["2", "2-5"].includes(sizeOf(p)) || p.querySelector('[class*="vw"]')));
      if (title) {
        const divider = dividerOf(title);
        if (divider) toRuledHeading(title, "h1", divider);
        else {
          const h1 = rename2(title, "h1");
          h1.querySelectorAll("br").forEach((br) => br.replaceWith(root.ownerDocument.createTextNode(" ")));
        }
      }
    }
    paras.filter((p) => p.isConnected && /^(P|DIV)$/.test(p.tagName)).forEach((p) => {
      const divider = dividerOf(p);
      if (divider && textOf(p) && covers(p, ".futura-bold")) toRuledHeading(p, "h2", divider);
    });
  }
  function textKey(el) {
    if (!norm(el.textContent)) return null;
    return SIZE_STYLES2[sizeOf(el)] || "";
  }
  function blockKey(block) {
    if (/^H[2-6]$/.test(block.tagName)) {
      const key = sizeOf(block) === "1-25" ? "lead" : "";
      if (!/^H[23]$/.test(block.tagName)) return { key };
      const face = block.querySelector(".futura-bold") || block.querySelector("u") ? "futura" : "serif";
      return { key, face };
    }
    if (block.tagName === "UL" || block.tagName === "OL") {
      const keys = [...block.querySelectorAll("li")].map(textKey).filter((k) => k !== null);
      if (!keys.length) return { key: null };
      return { key: keys.every((k) => k === keys[0]) ? keys[0] : "" };
    }
    if (block.tagName === "H1") return { key: "" };
    return { key: textKey(block) };
  }
  function topBlocks(component) {
    return [...component.querySelectorAll(BLOCKS)].filter((el) => {
      const outer = el.parentElement.closest(BLOCKS);
      return !outer || !component.contains(outer);
    });
  }
  function buildRuns(component) {
    const runs = [];
    topBlocks(component).forEach((block) => {
      const { key, face } = blockKey(block);
      const run = runs[runs.length - 1];
      const sameParent = run && run.blocks[0].parentElement === block.parentElement;
      const sameFace = !face || !(run && run.face) || face === run.face;
      if (run && sameParent && (key === null || key === run.key && sameFace)) {
        run.blocks.push(block);
        if (face) run.face = face;
        return;
      }
      runs.push({ key: key === null ? "" : key, face, blocks: [block] });
    });
    return runs;
  }
  function runStyle(run) {
    return [run.key, run.face === "serif" ? "h-serif" : ""].filter(Boolean).join(", ");
  }
  function markSections(root) {
    root.querySelectorAll(".c-rich-text-editor").forEach((component) => {
      if (component.closest(".c-customizeable, .c-disclaimer")) return;
      const runs = buildRuns(component);
      if (runs.length === 1) {
        const style2 = runStyle(runs[0]);
        if (style2) component.setAttribute(MARK, style2);
        return;
      }
      runs.forEach((run, i) => {
        const style2 = [runStyle(run), i > 0 ? "join" : ""].filter(Boolean).join(", ");
        if (!style2) return;
        const wrap = root.ownerDocument.createElement("div");
        wrap.className = RUN;
        run.blocks[0].before(wrap);
        wrap.append(...run.blocks);
        wrap.setAttribute(MARK, style2);
      });
    });
  }
  function dropDividers(root) {
    root.querySelectorAll(PARAS).forEach((p) => {
      if (!DIVIDER2.test(p.textContent)) return;
      dividerNodes(p).forEach((n) => n.remove());
      if (!norm(p.textContent) && !p.querySelector("img, picture")) p.remove();
    });
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
    if (cls === "color-gold") {
      const mark = doc.createElement(GOLD_MARK);
      first.before(mark);
      const run = [];
      for (let n = first; n; n = n.nextSibling) {
        run.push(n);
        if (n === last) break;
      }
      mark.append(...run);
      return;
    }
    first.before(doc.createTextNode(`[[${cls}]`));
    last.after(doc.createTextNode("]"));
  }
  function goldBoldItalic2(root) {
    const doc = root.ownerDocument;
    const inside = (node, tag) => {
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (el.tagName === tag) return true;
      }
      return false;
    };
    [...root.querySelectorAll(GOLD_MARK)].reverse().forEach((mark) => {
      const texts = [];
      const walker = doc.createTreeWalker(mark, 4);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (t.textContent.trim()) texts.push(t);
      }
      if (texts.length && !texts.every((t) => inside(t, "STRONG") && inside(t, "EM"))) {
        const em = doc.createElement("em");
        em.append(...mark.childNodes);
        if (inside(mark, "STRONG")) mark.append(em);
        else {
          const strong = doc.createElement("strong");
          strong.append(em);
          mark.append(strong);
        }
      }
      unwrap2(mark);
    });
    root.querySelectorAll("strong strong, em em").forEach(unwrap2);
  }
  function mapColours(root) {
    const coloured = [...root.querySelectorAll('.c-rich-text-editor [style*="color"], .c-largeheadline [style*="color"], font[color]')];
    const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
    coloured.forEach((el) => {
      const cls = COLOURS[own.get(el)];
      clearColour(el);
      if (!cls) return;
      const freeText = (node) => {
        if (node.nodeType === 3) return node.textContent;
        if (node.nodeType !== 1 || own.get(node)) return "";
        return [...node.childNodes].map(freeText).join("");
      };
      let run = [];
      const flush = () => {
        if (run.some((n) => norm(freeText(n)))) wrapInTag(run[0], run[run.length - 1], cls);
        run = [];
      };
      [...el.childNodes].forEach((child) => {
        if (child.nodeType === 1 && own.get(child)) flush();
        else run.push(child);
      });
      flush();
    });
  }
  function dropInlineFonts(root) {
    root.querySelectorAll("font").forEach(unwrap2);
    root.querySelectorAll("[style]").forEach((el) => {
      const kept = el.getAttribute("style").split(";").map((d) => d.trim()).filter((d) => d && !/^(font|font-family|font-size|font-weight|line-height)\s*:/i.test(d));
      if (kept.length) el.setAttribute("style", kept.join("; "));
      else el.removeAttribute("style");
    });
  }
  function plainHeadline(root) {
    root.querySelectorAll("h1").forEach((h1) => {
      h1.querySelectorAll("span, strong, b, em, i").forEach(unwrap2);
    });
  }
  function plainHeadings(root) {
    root.querySelectorAll(HEADINGS).forEach((h) => {
      h.querySelectorAll("span.futura-bold, strong, b").forEach(unwrap2);
    });
  }
  function standaloneLinks(root) {
    root.querySelectorAll("span.standalone-link").forEach((span) => {
      const a = span.closest("a") || span.querySelector("a");
      unwrap2(span);
      if (!a || a.closest("strong u, u strong")) return;
      const doc = a.ownerDocument;
      const strong = doc.createElement("strong");
      const u = doc.createElement("u");
      a.replaceWith(strong);
      strong.append(u);
      u.append(a);
    });
  }
  function futuraBold(root) {
    [...root.querySelectorAll("span.futura-bold")].filter((span) => !span.closest(`${HEADINGS}, h1, .c-autocarousel`)).forEach((span) => {
      const outer = span.parentElement && span.parentElement.closest("strong, b");
      if (outer && norm(outer.textContent) === norm(span.textContent)) unwrap2(outer);
      span.querySelectorAll("strong, b, span.futura-bold").forEach(unwrap2);
      rename2(span, "strong");
    });
  }
  function dropStyleSpans(root) {
    root.querySelectorAll('span[class*="fontsize-"], span.urw-egyptienne').forEach((span) => {
      if (!span.closest(".c-autocarousel")) unwrap2(span);
    });
  }
  function semanticInline(root) {
    root.querySelectorAll(`:is(${TEXT_BLOCKS}, ${HEADINGS}, h1) :is(b, i)`).forEach((el) => {
      if (!norm(el.textContent)) return;
      rename2(el, el.tagName === "B" ? "strong" : "em");
    });
  }
  function hasFollowing(node, root) {
    let n = node;
    while (n && n !== root) {
      if (n.nextElementSibling) return true;
      n = n.parentElement;
    }
    return false;
  }
  function writeSections(root) {
    const doc = root.ownerDocument;
    root.querySelectorAll(`[${MARK}]`).forEach((el) => {
      var _a, _b;
      const style2 = el.getAttribute(MARK);
      el.removeAttribute(MARK);
      if (el.closest("table")) return;
      if (((_a = el.previousElementSibling) == null ? void 0 : _a.tagName) !== "HR") el.before(doc.createElement("hr"));
      const meta = WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: [["Style", style2]] });
      el.after(meta);
      if (hasFollowing(meta, root) && ((_b = meta.nextElementSibling) == null ? void 0 : _b.tagName) !== "HR") meta.after(doc.createElement("hr"));
    });
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template && payload.template.name;
    if (template && !template.includes("news")) return;
    const root = element;
    if (hookName === TransformHook.beforeTransform) {
      promoteTitles(root);
      markSections(root);
      dropDividers(root);
      mapColours(root);
      dropInlineFonts(root);
      plainHeadline(root);
      plainHeadings(root);
      standaloneLinks(root);
      futuraBold(root);
      dropStyleSpans(root);
      semanticInline(root);
      goldBoldItalic2(root);
    }
    if (hookName === TransformHook.afterTransform) {
      writeSections(root);
    }
  }

  // tools/importer/transformers/patients-stryker-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function transform3(hookName, element, payload) {
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
    if (hookName === TransformHook2.beforeTransform) {
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
    if (hookName === TransformHook2.afterTransform) {
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

  // tools/importer/transformers/corp-page-corrections.js
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
  function newTab(main, hrefs) {
    hrefs.forEach((h) => main.querySelectorAll(`a[href="${h}"]`).forEach((a) => a.setAttribute("href", `${h}#_blank`)));
  }
  function newTabExternal(main) {
    main.querySelectorAll('a[href^="http"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (href.endsWith("#_blank")) return;
      let host = "";
      try {
        host = new URL(href).hostname.toLowerCase();
      } catch (e) {
        return;
      }
      if (["www.stryker.com", "stryker.com"].includes(host) || /\.aem\.(page|live)$/.test(host)) return;
      a.setAttribute("href", `${href}#_blank`);
    });
  }
  function noTheme(main) {
    main.setAttribute("data-meta-theme", "");
  }
  function dropTextTag(main, doc, name) {
    const open = `[[${name}]`;
    main.querySelectorAll("p").forEach((p) => {
      if (!txt(p).startsWith(open) || !txt(p).endsWith("]")) return;
      const walker = doc.createTreeWalker(
        p,
        4
        /* NodeFilter.SHOW_TEXT */
      );
      const texts = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
      const first = texts.find((t) => t.textContent.includes(open));
      if (first) first.textContent = first.textContent.replace(open, "");
      const last = [...texts].reverse().find((t) => t.textContent.trim());
      if (last && last.textContent.trim().endsWith("]")) last.textContent = last.textContent.replace(/\]\s*$/, "");
    });
  }
  function underlineLinks(el, doc) {
    if (!el) return;
    el.querySelectorAll("a").forEach((a) => {
      if (a.querySelector("u")) return;
      const u = doc.createElement("u");
      u.append(...a.childNodes);
      a.append(u);
    });
  }
  function unwrapSubSup(main) {
    main.querySelectorAll("sub").forEach((sub) => {
      const sup = sub.children.length === 1 && sub.firstElementChild.tagName === "SUP" ? sub.firstElementChild : null;
      if (!sup || /^[\s\d,*†‡-]*$/.test(sup.textContent)) return;
      sub.replaceWith(...sup.childNodes);
    });
  }
  function joinLines(main, doc, label, count) {
    const p = [...main.querySelectorAll("p")].find((el) => txt(el) === label);
    if (!p || p.querySelector("br")) return;
    if (!p.querySelector("strong")) boldAll(main, doc, p);
    for (let i = 0; i < count; i += 1) {
      const next = p.nextElementSibling;
      if (!next || next.tagName !== "P") break;
      p.append(doc.createElement("br"), ...next.childNodes);
      next.remove();
    }
  }
  function superscript(main, doc) {
    const walker = doc.createTreeWalker(
      main,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (/[™®]/.test(n.textContent) && !n.parentElement.closest("sup, script, style")) nodes.push(n);
    }
    nodes.forEach((n) => {
      const out = n.textContent.split(/([™®])/).filter(Boolean).map((part) => {
        if (!/^[™®]$/.test(part)) return doc.createTextNode(part);
        const sup = doc.createElement("sup");
        sup.textContent = part;
        return sup;
      });
      n.replaceWith(...out);
    });
  }
  function dropLeadingSpacer(main) {
    const first = main.firstElementChild;
    if (!isSectionMetadata(first) || txt(first).toLowerCase().indexOf("spacer") < 0) return;
    const hr = first.nextElementSibling;
    first.remove();
    if (hr && hr.tagName === "HR") hr.remove();
  }
  function splitAtFirstBreak(doc, p) {
    const br = p && p.querySelector(":scope > br");
    if (!br) return;
    const rest = doc.createElement("p");
    while (br.nextSibling) rest.append(br.nextSibling);
    br.remove();
    p.after(rest);
  }
  function spacerBefore(main, doc, el, value) {
    var _a;
    if (!el) return;
    const first = sectionOf(main, el)[0];
    const prevHr = first.previousElementSibling;
    if (prevHr && prevHr.tagName === "HR" && isSectionMetadata(prevHr.previousElementSibling) && ((_a = prevHr.previousElementSibling.previousElementSibling) == null ? void 0 : _a.tagName) === "HR" && txt(prevHr.previousElementSibling).toLowerCase().includes(value.split(",")[0])) return;
    const table = WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style: value } });
    if (prevHr && prevHr.tagName === "HR") prevHr.after(table, doc.createElement("hr"));
    else first.before(table, doc.createElement("hr"));
  }
  function dropSpacerAfter(main, el) {
    if (!el) return;
    const section = sectionOf(main, el);
    const hr = section[section.length - 1].nextElementSibling;
    const table = hr && hr.nextElementSibling;
    if (!hr || hr.tagName !== "HR" || !isSectionMetadata(table) || !txt(table).toLowerCase().includes("spacer")) return;
    const after = table.nextElementSibling;
    if (after && after.tagName !== "HR") return;
    hr.remove();
    table.remove();
  }
  var blockTable = (main, name) => [...main.querySelectorAll("table")].find((t) => txt(t.querySelector("th, td")).toLowerCase().startsWith(name.toLowerCase()));
  function blockSectionAfter(main, doc, el, name, cells) {
    if (!el) return;
    const section = sectionOf(main, el);
    const last = section[section.length - 1];
    const table = WebImporter.Blocks.createBlock(doc, { name, cells });
    last.after(doc.createElement("hr"), table);
  }
  function socialShareAfter(main, doc, el) {
    if (blockTable(main, "social share corp")) return;
    blockSectionAfter(main, doc, el, "Social Share Corp", [[":facebook:"], [":linkedin:"], [":email:"], [":copy-link:"]]);
  }
  function underlineBold(main, doc, labels) {
    main.querySelectorAll("strong").forEach((b) => {
      if (b.querySelector("u") || !labels.some((l) => txt(b).startsWith(l))) return;
      const u = doc.createElement("u");
      u.append(...b.childNodes);
      b.append(u);
    });
  }
  function dropEmptyLastCells(main, name) {
    [...main.querySelectorAll("table")].filter((t) => txt(t.querySelector("th, td")).toLowerCase().startsWith(name)).forEach((t) => {
      [...t.querySelectorAll("tr")].slice(1).forEach((tr) => {
        const last = tr.cells[tr.cells.length - 1];
        if (tr.cells.length > 2 && last && !txt(last) && !last.querySelector("img, picture, a")) last.remove();
      });
    });
  }
  function stripListNumbers(main, el) {
    if (!el) return;
    const doc = main.ownerDocument;
    sectionOf(main, el).forEach((node) => {
      var _a;
      return (_a = node.querySelectorAll) == null ? void 0 : _a.call(node, "ol > li").forEach((li) => {
        [...li.querySelectorAll(":scope > br")].reverse().forEach((br) => {
          const next = br.nextSibling;
          if (!next || next.nodeType !== 3 || !/^\s*\d+\.\s/.test(next.textContent)) return;
          const item = doc.createElement("li");
          while (br.nextSibling) item.append(br.nextSibling);
          br.remove();
          li.after(item);
        });
      });
    });
    sectionOf(main, el).forEach((node) => {
      var _a;
      return (_a = node.querySelectorAll) == null ? void 0 : _a.call(node, "ol > li").forEach((li) => {
        const t = li.firstChild;
        if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s*\d+\.\s*/, "");
      });
    });
  }
  var BODY_L_REPLACES = ["p-1", "p-1-25", "p-1-5", "p-1-75", "p-2", "p-2-5", "h2-0-8", "h2-1-25", "h2-1-5", "h3-0-8", "h3-1-25", "h3-1-5", "h4-1-25", "join"];
  function bodyLRepresentative(main, doc) {
    main.setAttribute("data-meta-theme", "body-l");
    main.querySelectorAll("h2").forEach((h2) => {
      const h3 = doc.createElement("h3");
      const b = doc.createElement("strong");
      b.append(...h2.childNodes);
      b.querySelectorAll("em, strong").forEach((el) => el.replaceWith(...el.childNodes));
      h3.append(b);
      h2.replaceWith(h3);
    });
    [...main.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => {
      const row = [...t.querySelectorAll("tr")].find((tr) => txt(tr.cells[0]).toLowerCase() === "style");
      if (!row) return;
      const rest = txt(row.cells[1]).split(",").map((v) => v.trim()).filter((v) => v && !BODY_L_REPLACES.includes(v));
      if (rest.length) row.cells[1].textContent = rest.join(", ");
      else if (t.querySelectorAll("tr").length <= 2) t.remove();
      else row.remove();
    });
    main.querySelectorAll("h3").forEach((h3) => breakBefore(main, doc, h3, null));
  }
  function labelsToSubheads(main, doc, labels) {
    main.querySelectorAll("p").forEach((p) => {
      if (!labels.includes(txt(p)) || !p.querySelector("em strong, strong em")) return;
      const h2 = doc.createElement("h2");
      h2.append(...p.childNodes);
      p.replaceWith(h2);
    });
  }
  function inlineReferencesToList(main, doc) {
    main.querySelectorAll("p").forEach((p) => {
      const head = p.firstElementChild;
      if (!head || head.tagName !== "STRONG" || !txt(p).startsWith(txt(head))) return;
      const label = txt(head).match(/^(.+:)\s*1\.$/);
      if (!label) return;
      const lead = doc.createElement("p");
      const b = doc.createElement("strong");
      b.textContent = `${label[1]} `;
      lead.append(b);
      const ol = doc.createElement("ol");
      let li = null;
      [...p.childNodes].forEach((n) => {
        if (n === head || n.nodeName === "STRONG" && /^\d+\.$/.test(txt(n))) {
          li = doc.createElement("li");
          ol.append(li);
        } else if (li) li.append(n);
      });
      ol.querySelectorAll("li").forEach((item) => {
        const t = item.firstChild;
        if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s+/, "");
      });
      p.replaceWith(lead, ol);
    });
  }
  function photoPairColumns(main, doc, el) {
    var _a;
    const first = el && el.closest("p");
    if (!first) return;
    const paras = [first];
    while (paras.length < 4 && ((_a = paras[paras.length - 1].nextElementSibling) == null ? void 0 : _a.tagName) === "P") {
      paras.push(paras[paras.length - 1].nextElementSibling);
    }
    if (paras.length < 4) return;
    const table = sectionOf(main, first).find(isSectionMetadata);
    const hr = doc.createElement("hr");
    first.before(hr);
    if (table) hr.before(table);
    const after = paras[3].nextElementSibling;
    const block = WebImporter.Blocks.createBlock(doc, { name: "Columns", cells: [[[paras[0], paras[1]], [paras[2], paras[3]]]] });
    hr.after(block);
    if (after && after.tagName !== "HR") block.after(doc.createElement("hr"));
  }
  function sizedTextToH3(main, doc) {
    [...main.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => {
      const row = [...t.querySelectorAll("tr")].find((tr) => txt(tr.cells[0]).toLowerCase() === "style");
      const values = row ? txt(row.cells[1]).split(",").map((v) => v.trim()) : [];
      if (!values.includes("p-1-5")) return;
      const serif = values.includes("serif");
      sectionOf(main, t).filter((n) => n.tagName === "P").forEach((para) => {
        const h3 = retag(main, doc, para, "h3");
        const only = h3.children.length === 1 && h3.firstElementChild.matches("strong, b") && txt(h3.firstElementChild) === txt(h3);
        if (only) h3.firstElementChild.replaceWith(...h3.firstElementChild.childNodes);
        if (serif && !h3.querySelector("em")) {
          const em = doc.createElement("em");
          em.append(...h3.childNodes);
          h3.append(em);
        }
      });
      const rest = values.filter((v) => v !== "p-1-5" && !(serif && v === "serif"));
      if (rest.length) row.cells[1].textContent = rest.join(", ");
      else t.remove();
    });
  }
  function serifBanner(main, doc) {
    [...main.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => {
      const v = txt(t).toLowerCase();
      if (!v.includes("h2-1-5") || !v.includes("bg-gold")) return;
      sectionOf(main, t).filter((n) => n.tagName === "H2").forEach((h2) => {
        if (h2.querySelector("em")) return;
        const lead = [];
        for (const n of [...h2.childNodes]) {
          if (n.nodeType === 1 && n.matches("strong, b")) break;
          lead.push(n);
        }
        if (!lead.some((n) => n.textContent.trim())) return;
        const trailing = lead[lead.length - 1];
        const space = trailing.nodeType === 3 && /\s$/.test(trailing.textContent);
        if (space) trailing.textContent = trailing.textContent.replace(/\s+$/, "");
        const em = doc.createElement("em");
        lead[0].before(em);
        em.append(...lead);
        if (space) em.after(doc.createTextNode(" "));
      });
    });
  }
  function formPageBodyL(main, doc) {
    main.setAttribute("data-meta-theme", "full-width, body-l");
    const sizes = /^p-1(-\d+)?$/;
    [...main.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
      const v = txt(td).split(",").map((x) => x.trim());
      if (!v.some((x) => sizes.test(x))) return;
      const rest = v.filter((x) => !sizes.test(x));
      if (rest.length) td.textContent = rest.join(", ");
      else t.remove();
    }));
    const title = sectionOf(main, main.querySelector("h1"));
    const afterTitle = title.length && title[title.length - 1].nextElementSibling;
    spacerBefore(main, doc, afterTitle && afterTitle.nextElementSibling, "spacer");
    let banner = [...main.querySelectorAll("p, h2")].find((el) => /^(want to|interested in) learn(ing)? more\?/i.test(txt(el)));
    if (banner) {
      breakBefore(main, doc, banner, null);
      banner = retag(main, doc, banner, "h2");
      breakAfter(main, doc, banner);
      sectionOf(main, banner).filter(isSectionMetadata).forEach((t) => t.remove());
      const sec = sectionOf(main, banner);
      sec[sec.length - 1].after(WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style: "h2-1-5", background: "bg-gold" } }));
    }
    serifBanner(main, doc);
    style(main, doc, blockTable(main, "marketo form"), "form-with-aside");
    const first = [...main.querySelectorAll("ol > li")].find((li) => /^1\.\s/.test(txt(li)) && sectionOf(main, li).some((n) => isSectionMetadata(n) && txt(n).includes("disclaimer")));
    if (first) {
      stripListNumbers(main, first);
      style(main, doc, first, "disclaimer");
    }
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
  var CORRECTIONS2 = {
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
        noTheme(m);
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
        noTheme(m);
      }
    ],
    // stryker-joins-leading-executives-and-employers-in-forming-oneten
    "https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/diversity-equity-inclusion");
        noTheme(m);
        const sub = find(m, "p", "OneTen will create one million jobs");
        style(m, d, sub, null);
        subtitle(m, d, sub);
      }
    ],
    // urgent-11-vulnerabilities---wind-river-vxworks-
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html": [
      (m, d) => {
        noTheme(m);
        m.querySelectorAll('a[href="https://www.us-cert.gov/ics/advisories/icsa-19-211-01"]').forEach((a) => {
          const u = a.querySelector("u") || a;
          if (txt(u) === "https://www.us-cert.gov/ics/advisories/icsa-19-211-01") u.textContent = u.textContent.toUpperCase();
        });
      }
    ],
    // microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html": [
      (m, d) => {
        noTheme(m);
        newTab(m, ["https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708", "https://support.microsoft.com/en-us/help/4500705/customer-guidance-for-cve-2019-0708"]);
      }
    ],
    // ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html": [
      (m, d) => {
        noTheme(m);
        newTab(m, ["https://us-cert.cisa.gov/ics/advisories/icsa-20-168-01"]);
      }
    ],
    // -sweyntooth--ble-vulnerabilities--icsa--20-063-01-
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html": [
      (m, d) => {
        noTheme(m);
        newTab(m, ["https://us-cert.cisa.gov/ics/alerts/ics-alert-20-063-01"]);
      }
    ],
    // vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html": [
      (m, d) => {
        noTheme(m);
        boldPerLine([...m.querySelectorAll("p > strong")].find((s) => txt(s).startsWith("CVE-2022-46898 Arbitrary File Upload")), d);
        newTab(m, ["https://support.vocera.com/s/contactsupport", ...["46898", "46899", "46900", "46901", "46902"].map((n) => `https://cve.report/CVE-2022-${n}`)]);
      }
    ],
    // text-only pages, second set: the DA `tags` row and external links in a new tab
    // apache--log4j--open-source-logging-library
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/apache--log4j--open-source-logging-library.html": [
      (m, d) => {
        newTabExternal(m);
      }
    ],
    // microsoft-print-spooler-vulnerabilities--cve-2021-34527-and-cve-
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-print-spooler-vulnerabilities--cve-2021-34527-and-cve-.html": [
      (m, d) => {
        newTabExternal(m);
      }
    ],
    // stryker-responds-to-krack-vulnerability-for-ibed-wireless-enable
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/stryker-responds-to-krack-vulnerability-for-ibed-wireless-enable.html": [
      (m, d) => {
        newTabExternal(m);
      }
    ],
    // wannacry-vulnerability
    "https://www.stryker.com/us/en/about/governance/cyber-security/product-security/wannacry-vulnerability.html": [
      (m, d) => {
        newTabExternal(m);
      }
    ],
    // kevin-lobo-shares-leadership-strategies-with-medical-design---ou
    "https://www.stryker.com/us/en/about/news/2021/kevin-lobo-shares-leadership-strategies-with-medical-design---ou.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        newTabExternal(m);
      }
    ],
    // stryker-announced-as-new-partner-for-the-ana-innovation-awards
    "https://www.stryker.com/us/en/about/news/2021/stryker-announced-as-new-partner-for-the-ana-innovation-awards.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        newTabExternal(m);
      }
    ],
    // stryker-sponsors-pga-2021-world-golf-championships-fedex-st--jud
    "https://www.stryker.com/us/en/about/news/2021/stryker-sponsors-pga-2021-world-golf-championships-fedex-st--jud.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/events");
        newTabExternal(m);
      }
    ],
    // stryker-to-showcase-new--combined-foot-and-ankle-portfolio-at--2
    "https://www.stryker.com/us/en/about/news/2021/stryker-to-showcase-new--combined-foot-and-ankle-portfolio-at--2.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        newTabExternal(m);
      }
    ],
    // cms-grants-outpatient-facility-code-for-insertion-of-stryker-s-i
    "https://www.stryker.com/us/en/about/news/2022/cms-grants-outpatient-facility-code-for-insertion-of-stryker-s-i.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/product-bulletins");
        retag(m, d, find(m, "p", "The new code enables greater access"), "h3");
        ["About the decision", "About Stryker", "Media contact"].forEach((label) => joinLabel(m, d, label));
        ["About the decision", "About Stryker", "Media contact"].forEach((label) => style(m, d, find(m, "p", label), "separator"));
        newTabExternal(m);
      }
    ],
    // stryker-completes-acquisition-of-vocera-communications
    "https://www.stryker.com/us/en/about/news/2022/stryker-completes-acquisition-of-vocera-communications.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        newTabExternal(m);
      }
    ],
    // stryker-works-with-red-cross-to-direct-resources-to-humanitarian
    "https://www.stryker.com/us/en/about/news/2022/stryker-works-with-red-cross-to-direct-resources-to-humanitarian.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        newTabExternal(m);
      }
    ],
    // vocera--now-part-of-stryker--introduces-latest-evolution-in-hand
    "https://www.stryker.com/us/en/about/news/2022/vocera--now-part-of-stryker--introduces-latest-evolution-in-hand.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        retag(m, d, find(m, "p", "New Minibadge expands intuitive mobile"), "h4");
        newTabExternal(m);
      }
    ],
    // Cigna-Coverage-Policy-Update-ClariFix
    "https://www.stryker.com/us/en/ent/news/Cigna-Coverage-Policy-Update-ClariFix.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news");
        joinLabel(m, d, "About Stryker");
        style(m, d, find(m, "p", "About Stryker"), null);
        newTabExternal(m);
      }
    ],
    // stryker-announces-creation-new-nasal-valve-collapse-1CD-10-CM-codes
    "https://www.stryker.com/us/en/ent/news/stryker-announces-creation-new-nasal-valve-collapse-1CD-10-CM-codes.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news");
        style(m, d, find(m, "p", "Effective October 1, 2024"), null);
        newTabExternal(m);
      }
    ],
    // stryker-announces-creation-of-new-category-1-cpt-codes-for-repor
    "https://www.stryker.com/us/en/ent/news/stryker-announces-creation-of-new-category-1-cpt-codes-for-repor.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/ent/clinical-information");
        joinLabel(m, d, "About Stryker");
        joinLines(m, d, "Media contact", 3);
        style(m, d, find(m, "p", "About Stryker"), "separator");
        newTabExternal(m);
      }
    ],
    // united-healthcare-medicare-advantage-policy-update-for-clarifix-
    "https://www.stryker.com/us/en/ent/news/united-healthcare-medicare-advantage-policy-update-for-clarifix-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news");
        newTabExternal(m);
      }
    ],
    // i-thought-op-knees-were-approved-by-medicare--why-arent-they-in-
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/i-thought-op-knees-were-approved-by-medicare--why-arent-they-in-.html": [
      (m, d) => {
        unwrapSubSup(m);
        mergeWithPrevious(m, find(m, "p", "While there is not (yet)"));
        dropTextTag(m, d, "color-teal");
        const back = [...m.querySelectorAll("p")].find((p) => txt(p) === "BACK");
        underlineLinks(back, d);
        style(m, d, back, null);
        newTabExternal(m);
      }
    ],
    // update-from-cms--what-to-expect-may--september-2018
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/update-from-cms--what-to-expect-may--september-2018.html": [
      (m, d) => {
        style(m, d, find(m, "p", "On April 24th, CMS provided"), null);
        const close = find(m, "p", "Every episode is an opportunity");
        if (close) {
          const h5 = d.createElement("h5");
          const first = d.createElement("strong");
          first.textContent = "Every episode is an opportunity to do what is best for your patients.";
          const em = d.createElement("em");
          const second = d.createElement("strong");
          second.textContent = "We have your back.";
          em.append(second);
          h5.append(first, em);
          close.replaceWith(h5);
        }
        dropTextTag(m, d, "color-teal");
        const back = [...m.querySelectorAll("p")].find((p) => txt(p) === "GO BACK");
        underlineLinks(back, d);
        style(m, d, back, null);
        newTabExternal(m);
      }
    ],
    // will-your-practice-qualify-for-mips-exemption-under-bpci-advance
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/will-your-practice-qualify-for-mips-exemption-under-bpci-advance.html": [
      (m, d) => {
        style(m, d, find(m, "p", "Many orthopedic physician groups"), null);
        dropTextTag(m, d, "color-teal");
        const back = [...m.querySelectorAll("p")].find((p) => txt(p) === "BACK");
        underlineLinks(back, d);
        style(m, d, back, null);
        newTabExternal(m);
      }
    ],
    // news-detail `basic` pages (text and lead image, import-news-detail.js): the DA `tags`
    // row and ™ / ® as superscript
    // stryker-expands-mako-robotics-portfolio
    "https://www.stryker.com/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        superscript(m, d);
      }
    ],
    // stryker-showcases-continued-innovation-across-orthopaedics-at-aaos-2026-annual-meeting
    "https://www.stryker.com/us/en/about/news/2026/stryker-showcases-continued-innovation-across-orthopaedics-at-aaos-2026-annual-meeting.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        superscript(m, d);
      }
    ],
    // stryker-launches-surpass-elite-flow-diverter
    "https://www.stryker.com/us/en/about/news/2025/stryker-launches-surpass-elite-flow-diverter.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        superscript(m, d);
      }
    ],
    // stryker-unveils-oculan-lighting-platform
    "https://www.stryker.com/us/en/about/news/2024/stryker-unveils-oculan-lighting-platform.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        superscript(m, d);
      }
    ],
    // stryker-launches-prostep--mis-lapidus--a-new-minimally-invasive-
    "https://www.stryker.com/us/en/about/news/2023/stryker-launches-prostep--mis-lapidus--a-new-minimally-invasive-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        dropLeadingSpacer(m);
        style(m, d, m.querySelector("h1"), null);
        subtitle(m, d, find(m, "p", "Stryker\u2019s PROstep MIS portfolio will be"), { em: true });
        splitAtFirstBreak(d, [...m.querySelectorAll("p")].find((p) => txt(p).startsWith("References: 1.")));
        style(m, d, find(m, "p", "A surgeon must always rely"), "separator,disclaimer");
        superscript(m, d);
      }
    ],
    // stryker-announces-definitive-agreement-to-acquire-vocera-communi
    "https://www.stryker.com/us/en/about/news/2022/stryker-announces-definitive-agreement-to-acquire-vocera-communi.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        superscript(m, d);
      }
    ],
    // news-detail `basic` pages, second set (import-news-detail.js; SurgiCount: import-news-xf.js)
    // stryker-launches-the-connected-power-pro-2-powered-ambulance-cot
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches-the-connected-power-pro-2-powered-ambulance-cot.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        superscript(m, d);
      }
    ],
    // stryker-strengthens-its-r-d-capabilities-with-advanced-global-te
    "https://www.stryker.com/us/en/about/news/2022/stryker-strengthens-its-r-d-capabilities-with-advanced-global-te.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        subtitle(m, d, find(m, "p", "New center to help accelerate"));
        joinLabel(m, d, "About Stryker");
        style(m, d, find(m, "p", "About Stryker"), "separator");
        ["Stryker:", "SPAG:"].forEach((label) => joinLabel(m, d, label));
        mergeWithPrevious(m, find(m, "p", "SPAG:"));
        style(m, d, find(m, "p", "Media contact"), "separator");
        superscript(m, d);
      }
    ],
    // stryker-launches-next-generation-of-surgicount--to-help-improve-
    "https://www.stryker.com/us/en/about/news/2024/stryker-launches-next-generation-of-surgicount--to-help-improve-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        m.setAttribute("data-meta-theme", "basic");
        const h1 = m.querySelector("h1");
        dropSpacerAfter(m, h1);
        const cols = blockTable(m, "columns");
        if (cols) {
          const a = d.createElement("a");
          a.href = "/us/en/fragments/stryker/corporate/en/about/news/2024/stryker-launches-next-generation-of-surgicount-to-help-improve";
          a.textContent = a.getAttribute("href");
          cols.replaceWith(WebImporter.Blocks.createBlock(d, { name: "Fragment", cells: [[a]] }));
        }
        spacerBefore(m, d, m.querySelector("ol"), "spacer, small");
        superscript(m, d);
      }
    ],
    // stryker-names-spencer-stiles-president-and-chief-operating-officer
    "https://www.stryker.com/us/en/about/news/2025/stryker-names-spencer-stiles-president-and-chief-operating-officer.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        const h1 = m.querySelector("h1");
        style(m, d, h1, null);
        breakAfter(m, d, h1);
        breakAfter(m, d, m.querySelector("h2"));
        const logo = [...m.querySelectorAll("p")].find((p) => txt(p) === "stryker_logo2015_left");
        breakAfter(m, d, logo);
        spacerBefore(m, d, find(m, "p", "PORTAGE, Mich., USA \u2013 Dec. 4"), "spacer, small");
        socialShareAfter(m, d, find(m, "p", "About Stryker"));
        superscript(m, d);
      }
    ],
    // stryker-cmr-surgical-announce-strategic-alliance-advance-robotic-assisted-surgery
    "https://www.stryker.com/us/en/about/news/2026/stryker-cmr-surgical-announce-strategic-alliance-advance-robotic-assisted-surgery.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        const lead = find(m, "p", "Strategic alliance combines CMR");
        style(m, d, lead, null);
        breakAfter(m, d, lead);
        underlineBold(m, d, ["Strategic alliance combines CMR", "For investor inquiries for Stryker:", "For media inquiries for Stryker:", "For investor and media inquiries for CMR Surgical:"]);
        superscript(m, d);
      }
    ],
    // stryker-partners-professional-golfer-shane-lowry-caregiver-journey
    "https://www.stryker.com/us/en/about/news/2026/stryker-partners-professional-golfer-shane-lowry-caregiver-journey.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        socialShareAfter(m, d, find(m, "p", "About Stryker"));
        superscript(m, d);
      }
    ],
    // stryker-launches-new-gamma4-hip-fracture-nailing-system
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches-new-gamma4-hip-fracture-nailing-system.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        dropSpacerAfter(m, m.querySelector("h1"));
        const sub = find(m, "p", "New System to Strengthen the Gamma");
        breakAfter(m, d, sub);
        style(m, d, sub, "p-1-25");
        const media = find(m, "p", "Media contact");
        breakBefore(m, d, media, null);
        spacerBefore(m, d, media, "spacer");
        spacerBefore(m, d, find(m, "p", "References"), "spacer, small");
        superscript(m, d);
      }
    ],
    // stryker-launches-q-guidance-system-with-spine-guidance-software
    "https://www.stryker.com/us/en/about/news/2022/stryker-launches-q-guidance-system-with-spine-guidance-software.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        const sub = find(m, "p", "First spine navigation software");
        breakAfter(m, d, sub);
        style(m, d, sub, "p-1-25");
        const about = find(m, "p", "About Stryker");
        breakBefore(m, d, about, null);
        spacerBefore(m, d, about, "spacer");
        const media = find(m, "p", "Media contact");
        breakBefore(m, d, media, null);
        spacerBefore(m, d, media, "spacer, small");
        spacerBefore(m, d, find(m, "p", "References:"), "spacer, small");
        superscript(m, d);
      }
    ],
    // stryker-launches-steri-shield-8-personal-protection-system
    "https://www.stryker.com/us/en/about/news/2025/stryker-launches-steri-shield-8-personal-protection-system.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        const note = find(m, "p", "*Stryker internal data");
        spacerBefore(m, d, note, "spacer, small");
        style(m, d, note, "disclaimer, join");
        superscript(m, d);
      }
    ],
    // stryker-launches-industry-s-first-completely-wireless-hospital-b
    "https://www.stryker.com/us/en/about/news/2020/stryker-launches-industry-s-first-completely-wireless-hospital-b.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews");
        const img = [...m.querySelectorAll("p, a")].find((el) => txt(el) === "IsoTour bed");
        spacerBefore(m, d, img, "spacer");
        style(m, d, img, "col-8");
        style(m, d, find(m, "p", "ProCuity Bed Series designed"), "col-8");
        style(m, d, find(m, "p", "Specific key features of ProCuity"), "separator, col-8");
        dropEmptyLastCells(m, "columns");
        ["About Stryker", "Media contact"].forEach((label) => joinLabel(m, d, label));
        style(m, d, find(m, "p", "About Stryker"), null);
        style(m, d, find(m, "p", "Media contact"), null);
        const refs = m.querySelector("ol");
        stripListNumbers(m, refs);
        style(m, d, refs, "disclaimer");
        superscript(m, d);
      }
    ],
    // a-clearer-vision-of-surgery-stryker-releases-its-next-generation-of-advanced-surgical-cameras
    "https://www.stryker.com/us/en/about/news/2023/a-clearer-vision-of-surgery-stryker-releases-its-next-generation-of-advanced-surgical-cameras.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        spacerBefore(m, d, [...m.querySelectorAll("p, a")].find((el) => txt(el) === "1788 Camera hero"), "spacer");
        breakAfter(m, d, m.querySelector("h2"));
        breakBefore(m, d, blockTable(m, "video"), null);
        const media = find(m, "p", "Media contacts");
        breakBefore(m, d, media, null);
        spacerBefore(m, d, media, "spacer, small");
        spacerBefore(m, d, m.querySelector("ol"), "spacer");
        superscript(m, d);
      }
    ],
    // stryker-receives-fda-clearance-for-optablate-bvn-ablation-system
    "https://www.stryker.com/us/en/about/news/2025/stryker-receives-fda-clearance-for-optablate-bvn-ablation-system.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
        const body = find(m, "p", "PORTAGE, Mich., USA");
        spacerBefore(m, d, body, "spacer, small");
        const img = [...m.querySelectorAll("p")].find((p) => txt(p) === "OptaBlate-BVN-ablation-vertebral-body");
        const key = find(m, "p", "Key features of the system include");
        if (img && key && !blockTable(m, "columns")) {
          const rest = sectionOf(m, key).filter((n) => !isSectionMetadata(n));
          sectionOf(m, key).filter(isSectionMetadata).forEach((t) => t.remove());
          const hr = rest[0].previousElementSibling;
          const table = WebImporter.Blocks.createBlock(d, { name: "Columns (columns-50-50)", cells: [[[img], rest]] });
          hr.after(table);
        }
        style(m, d, body, "join");
        const notes = find(m, "p", "*Chronic low back pain");
        const refs = [...m.querySelectorAll("p")].find((p) => txt(p) === "References");
        breakBefore(m, d, refs, "disclaimer, bold-body");
        style(m, d, notes, null);
        breakBefore(m, d, notes, null);
        spacerBefore(m, d, notes, "spacer, small");
        spacerBefore(m, d, refs, "spacer, small");
        superscript(m, d);
      }
    ],
    // stryker-s-neuroform-atlas--stent-system-granted-an-expanded-indi
    "https://www.stryker.com/us/en/about/news/2020/stryker-s-neuroform-atlas--stent-system-granted-an-expanded-indi.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews");
        dropLeadingSpacer(m);
        const h1 = m.querySelector("h1");
        style(m, d, h1, null);
        const img = [...m.querySelectorAll("p")].find((p) => /atlas-1/.test(p.innerHTML) && p.querySelector("a"));
        breakAfter(m, d, img, { keepStyle: true });
        spacerBefore(m, d, m.querySelector("ol"), "spacer, small");
        superscript(m, d);
      }
    ],
    // single news-detail pages
    // hospital-fall-prevention-with-smart-stretchers
    "https://www.stryker.com/us/en/acute-care/news/hospital-fall-prevention-with-smart-stretchers.html": [
      (m, d) => {
        formPageBodyL(m, d);
        tags(m, "stryker:content-type/news");
      }
    ],
    // hospital-acquired-infection-prevention-strategies
    "https://www.stryker.com/us/en/sage/news/2025/hospital-acquired-infection-prevention-strategies.html": [
      (m, d) => {
        formPageBodyL(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
      }
    ],
    // patient-skin-integrity-a-critical-factor-in-infection-prevention
    "https://www.stryker.com/us/en/sage/news/2025/patient-skin-integrity-a-critical-factor-in-infection-prevention.html": [
      (m, d) => {
        var _a;
        formPageBodyL(m, d);
        const cImg = (_a = m.querySelector('a[href*="Sage-CHG-Cloths-Thumbnail"]')) == null ? void 0 : _a.closest("p");
        const cText = find(m, "p", "Help address bacteria");
        const cMore = [...m.querySelectorAll("p")].find((x) => txt(x) === "Learn more");
        if (cImg && cText && cMore) {
          [cImg, cText, cMore].forEach((el) => sectionOf(m, el).filter(isSectionMetadata).forEach((t) => t.remove()));
          const dup = cImg.nextElementSibling;
          if (dup && dup.tagName === "P" && !dup.querySelector("strong") && dup.querySelector('a[href="/us/en/sage/products/sage-chg-cloths"]')) dup.remove();
          mergeWithPrevious(m, cText);
          mergeWithPrevious(m, cMore);
          const block = WebImporter.Blocks.createBlock(d, { name: "Cards Corp (teaser, three-up)", cells: [[cImg.querySelector("a"), [cText, cMore]]] });
          cImg.replaceWith(block);
        }
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage, stryker:content-type/news/sage/2");
        style(m, d, blockTable(m, "marketo form"), null);
      }
    ],
    // why-powered-fleet-is-key-ems-fire-departments
    "https://www.stryker.com/us/en/emergency-care/news/2025/why-powered-fleet-is-key-ems-fire-departments.html": [
      (m, d) => {
        tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news, stryker:business-unit/ems/news");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return;
          const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        let banner = find(m, "p", "Want to learn more? Download the full eGuide");
        if (banner) {
          breakBefore(m, d, banner, null);
          banner = retag(m, d, banner, "h2");
          const sec = sectionOf(m, banner);
          sec.filter(isSectionMetadata).forEach((t) => t.remove());
          const rest = sectionOf(m, banner);
          rest[rest.length - 1].after(WebImporter.Blocks.createBlock(d, { name: "Section Metadata", cells: { style: "h2-1-5", background: "bg-gold" } }));
        }
        style(m, d, blockTable(m, "marketo form"), "form-with-aside");
        serifBanner(m, d);
      }
    ],
    // lifepak35-15-lead-ecg-integration
    "https://www.stryker.com/us/en/emergency-care/news/2026/lifepak35-15-lead-ecg-integration.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:business-unit/ems/news, stryker:business-unit/ems, stryker:business-unit/ems/news/case-studies");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return;
          const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        const box = [...m.querySelectorAll("h2")].find((h) => /learn(ing)? more\?/i.test(txt(h)));
        if (box) {
          const t = sectionOf(m, box).find(isSectionMetadata);
          if (t) t.remove();
          const sec = sectionOf(m, box);
          sec[sec.length - 1].after(WebImporter.Blocks.createBlock(d, { name: "Section Metadata", cells: { style: "h2-1-5", background: "bg-gold" } }));
        }
        style(m, d, blockTable(m, "marketo form"), "form-with-aside");
        const refsLabel = [...m.querySelectorAll("p")].find((x) => txt(x) === "References:");
        if (refsLabel) {
          const b = refsLabel.querySelector("strong");
          const u = d.createElement("u");
          u.textContent = "References:";
          (b || refsLabel).replaceWith(u);
          if (!b) refsLabel.append(u);
        }
        stripListNumbers(m, find(m, "li", "1. Thygesen"));
        style(m, d, find(m, "li", "Thygesen"), "disclaimer");
        serifBanner(m, d);
      }
    ],
    // close-the-gap-in-fecal-management
    "https://www.stryker.com/us/en/sage/news/2026/close-the-gap-in-fecal-management.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:business-unit/SAGE");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return;
          const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        const box = [...m.querySelectorAll("h2")].find((h) => /learn(ing)? more\?/i.test(txt(h)));
        if (box) {
          const t = sectionOf(m, box).find(isSectionMetadata);
          if (t) t.remove();
          const sec = sectionOf(m, box);
          sec[sec.length - 1].after(WebImporter.Blocks.createBlock(d, { name: "Section Metadata", cells: { style: "h2-1-5", background: "bg-gold" } }));
        }
        style(m, d, blockTable(m, "marketo form"), "form-with-aside");
        serifBanner(m, d);
      }
    ],
    // life-saving-journey-inspires-community
    "https://www.stryker.com/us/en/emergency-care/news/2024/life-saving-journey-inspires-community.html": [
      (m, d) => {
        tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news, stryker:business-unit/ems/news");
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => BODY_L_REPLACES.includes(x))) return;
          const rest = v.filter((x) => !BODY_L_REPLACES.includes(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        m.querySelectorAll("h2").forEach((h2) => breakBefore(m, d, h2, null));
        stripListNumbers(m, find(m, "li", "1. Beseems"));
        style(m, d, find(m, "li", "Beseems"), "disclaimer");
        spacerBefore(m, d, find(m, "li", "Beseems"), "spacer");
        style(m, d, find(m, "p", "Chasie Greathouse and Cherish Works"), "p-1");
        const caption = find(m, "p", "Chasie Greathouse and Cherish Works");
        if (caption && !caption.querySelector("em")) {
          const em = d.createElement("em");
          em.append(...caption.childNodes);
          caption.append(em);
        }
        spacerBefore(m, d, blockTable(m, "fragment"), "spacer");
      }
    ],
    // acute-care-training-and-education-resources
    "https://www.stryker.com/us/en/acute-care/news/acute-care-training-and-education-resources.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:business-unit/acute-care/news, stryker:business-unit/acute-care/news/articles");
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => BODY_L_REPLACES.includes(x))) return;
          const rest = v.filter((x) => !BODY_L_REPLACES.includes(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        m.querySelectorAll("h2").forEach((h2) => breakBefore(m, d, h2, null));
        spacerBefore(m, d, [...m.querySelectorAll("table")].filter(isSectionMetadata).find((t) => txt(t).includes("disclaimer")), "spacer");
      }
    ],
    // nurse-led-innovation-and-the-power-of-partnership
    "https://www.stryker.com/us/en/acute-care/news/nurse-led-innovation-and-the-power-of-partnership.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:custom/acute-care/acute-care-bu-news");
        const titleSection = sectionOf(m, m.querySelector("h1"));
        const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
        spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, "spacer");
        m.setAttribute("data-meta-theme", "full-width, body-l");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (!v.some((x) => BODY_L_REPLACES.includes(x))) return;
          const rest = v.filter((x) => !BODY_L_REPLACES.includes(x));
          if (rest.length) td.textContent = rest.join(", ");
          else t.remove();
        }));
        m.querySelectorAll("h2").forEach((h2) => breakBefore(m, d, h2, null));
        spacerBefore(m, d, [...m.querySelectorAll("table")].filter(isSectionMetadata).find((t) => txt(t).includes("disclaimer")), "spacer");
        const refs = [...m.querySelectorAll("p")].filter((p) => /^\d+\s/.test(txt(p)) && sectionOf(m, p).some((n) => isSectionMetadata(n) && txt(n).includes("disclaimer")));
        if (refs.length) {
          const ol = d.createElement("ol");
          refs[0].before(ol);
          refs.forEach((p) => {
            const li = d.createElement("li");
            li.append(...p.childNodes);
            li.normalize();
            if (li.firstChild && li.firstChild.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s*\d+\s+/, "");
            ol.append(li);
            p.remove();
          });
        }
      }
    ],
    // stryker-highlights-commitment-to-advanced-digital-healthcare
    "https://www.stryker.com/us/en/about/news/2021/stryker-highlights-commitment-to-advanced-digital-healthcare.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/Features");
      }
    ],
    // fda-authorizes-production-of-non-sterile-hoods-and-togas
    "https://www.stryker.com/us/en/about/news/2020/fda-authorizes-production-of-non-sterile-hoods-and-togas.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/covid-19");
      }
    ],
    // stryker-is-a-gallup-exceptional-workplace-for-the-13th-year
    "https://www.stryker.com/us/en/about/news/2020/stryker-is-a-gallup-exceptional-workplace-for-the-13th-year.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      }
    ],
    // people-magazine-names-stryker-as-one-of-its-companies-that-care
    "https://www.stryker.com/us/en/about/news/2021/people-magazine-names-stryker-as-one-of-its-companies-that-care-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/awards, stryker:content-type/news, stryker:content-type/news/Features, stryker:content-type/corporatenews, stryker:content-type/news/cr");
        superscript(m, d);
        m.querySelectorAll('a[href="/us/en/about/corporate-responsibility"] u').forEach((u) => {
          u.textContent = u.textContent.toUpperCase();
        });
      }
    ],
    // people-magazine-names-stryker-as-one-of-its-companies-that-care-2022
    "https://www.stryker.com/us/en/about/news/2022/people-magazine-names-stryker-as-one-of-its-companies-that-care-2022.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        superscript(m, d);
      }
    ],
    // stryker-announces-definitive-agreement-to-acquire-inari-medical-inc
    "https://www.stryker.com/us/en/about/news/2025/stryker-announces-definitive-agreement-to-acquire-inari-medical-inc.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        dropSpacerAfter(m, m.querySelector("h1"));
      }
    ],
    // stryker-signs-definitive-agreement-acquire-amplitude-vascular-systems
    "https://www.stryker.com/us/en/about/news/2026/stryker-signs-definitive-agreement-acquire-amplitude-vascular-systems.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
        socialShareAfter(m, d, find(m, "p", "Read full press release here"));
      }
    ],
    // rebuilding-what-s-been-broken
    "https://www.stryker.com/us/en/about/news/features/rebuilding-what-s-been-broken-.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/Features");
        m.querySelectorAll("ol > li").forEach((li) => {
          const t = li.firstChild;
          if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s*\d+:\s*/, "");
        });
        style(m, d, m.querySelector("ol > li"), "disclaimer");
      }
    ],
    // revealing-character-rebuilding-lives
    "https://www.stryker.com/us/en/about/news/features/revealing-character--rebuilding-lives-.html": [
      (m, d) => {
        tags(m, "stryker:Stryker-SEO-Tags/covid19, stryker:content-type/news, stryker:Stryker-SEO-Tags/coronavirus, stryker:Stryker-SEO-Tags/covid-19, stryker:content-type/news/Features, stryker:content-type/news/covid-19");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (v.includes("join")) {
            const rest = v.filter((x) => x !== "join");
            if (rest.length) td.textContent = rest.join(", ");
            else t.remove();
          }
        }));
        sizedTextToH3(m, d);
      }
    ],
    // trees-landfills-and-the-environment
    "https://www.stryker.com/us/en/about/news/features/trees--landfills-and-the-environment.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news/Features");
        style(m, d, m.querySelector("h1"), "h1-42");
      }
    ],
    // bpci-a-team-last-but-not-least
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/_bpci_-a-team-_-last-but-not-least-.html": [
      (m, d) => {
        dropTextTag(m, d, "color-teal");
        m.querySelectorAll("p > strong > a").forEach((a) => {
          if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d);
        });
      }
    ],
    // bpci-advanced-calendar-updated
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/bpci-advanced-calendar--updated-.html": [
      (m, d) => {
        dropTextTag(m, d, "color-teal");
        m.querySelectorAll("p > strong > a").forEach((a) => {
          if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d);
        });
      }
    ],
    // meet-the-bpci-a-team-take-two
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the--bpci--a-team---take-two-.html": [
      (m, d) => {
        dropTextTag(m, d, "color-teal");
        m.querySelectorAll("p > strong > a").forEach((a) => {
          if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d);
        });
      }
    ],
    // meet-the-bpci-a-team-take-four
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the-_bpci_-a-team--take-four-.html": [
      (m, d) => {
        dropTextTag(m, d, "color-teal");
        m.querySelectorAll("p > strong > a").forEach((a) => {
          if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d);
        });
      }
    ],
    // meet-the-bpci-a-team-take-three
    "https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the-_bpci_-a-team--take-three-.html": [
      (m, d) => {
        dropTextTag(m, d, "color-teal");
        m.querySelectorAll("p > strong > a").forEach((a) => {
          if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d);
        });
      }
    ],
    // target-tetra-gets-510k-clearance
    "https://www.stryker.com/us/en/neurovascular/news/target-tetra-gets-510k-clearance.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:custom/neurovascular/neurovascular-bu-news");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          const v = txt(td).split(",").map((x) => x.trim());
          if (v.includes("join")) {
            const rest = v.filter((x) => x !== "join");
            if (rest.length) td.textContent = rest.join(", ");
            else t.remove();
          }
        }));
      }
    ],
    // stryker-receives-multi-million-dollar-grant-to-open-r-d-lab-in-a
    "https://www.stryker.com/us/en/about/news/2021/stryker-receives-multi-million-dollar-grant-to-open-r-d-lab-in-a.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
        dropEmptyLastCells(m, "columns");
      }
    ],
    // changing-the-course-of-healthcare-in-under-resourced-communities
    "https://www.stryker.com/us/en/about/news/features/changing-the-course-of-healthcare-in-under-resourced-communities.html": [
      (m, d) => {
        tags(m, "stryker:content-type/news, stryker:content-type/news/Features");
        photoPairColumns(m, d, m.querySelector('a[href*="Rwanda%20surgical%20center%20img-2"]'));
        photoPairColumns(m, d, m.querySelector('a[href*="Jess%20F%20with%20baby%20Sandrine"]'));
        sizedTextToH3(m, d);
      }
    ],
    // cns-impact-through-innovation-and-implementation-of-primafit-external-urine-management-system-for-females
    "https://www.stryker.com/us/en/sage/news/2021/cns-impact-through-innovation-and-implementation-of-primafit-external-urine-management-system-for-females.html": [
      (m, d) => {
        labelsToSubheads(m, d, ["Background", "Intervention", "Results", "Conclusion", "About the Clinicians"]);
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          if (txt(td) === "disclaimer, references-body-lines") td.textContent = "disclaimer";
        }));
        inlineReferencesToList(m, d);
        const uti = find(m, "p", "Urinary tract infections (UTIs) are one of the most common");
        style(m, d, uti, null);
        if (uti) {
          const em = d.createElement("em");
          em.append(...uti.childNodes);
          uti.append(em);
          retag(m, d, uti, "h2");
        }
      }
    ],
    // new-safety-advisory-from-the-joint-commission
    "https://www.stryker.com/us/en/sage/news/2021/new-safety-advisory-from-the-joint-commission.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      }
    ],
    // primafit-device-updates
    "https://www.stryker.com/us/en/sage/news/2021/primafit-device-updates.html": [
      (m, d) => {
        labelsToSubheads(m, d, ["Developed in partnership with clinicians for better outcomes", "New enhancements for better care", "Addressing the #1 CAUTI risk factor", "No catheter. No CAUTI.\u2122"]);
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => t.querySelectorAll("td").forEach((td) => {
          if (txt(td) === "disclaimer, references-body-lines") td.textContent = "disclaimer";
        }));
        dropTextTag(m, d, "color-teal");
        const more = find(m, "p", "To learn more about how Sage can help");
        if (more && !more.querySelector("em")) {
          const em = d.createElement("em");
          em.append(...more.childNodes);
          more.append(em);
        }
        style(m, d, more, null);
        mergeWithPrevious(m, more);
        style(m, d, more, null);
        inlineReferencesToList(m, d);
      }
    ],
    // sage-supports-the-family-health-partnership-clinic-in-mchenry-co
    "https://www.stryker.com/us/en/sage/news/2021/sage-supports-the-family-health-partnership-clinic-in-mchenry-co.html": [
      (m, d) => {
        labelsToSubheads(m, d, ["Raising funds and awareness at the Care4Breast Cancer 5K", "Helping our neighbors", "Donate today \u2013 any amount makes a difference!"]);
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
      }
    ],
    // can-brushing-your-teeth-keep-you-healthy-in-the-hospital
    "https://www.stryker.com/us/en/sage/news/2022/can-brushing-your-teeth-keep-you-healthy-in-the-hospital.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      }
    ],
    // ecri-reports-nvhap-as-a-top-threat-to-patient-safety-in-2022
    "https://www.stryker.com/us/en/sage/news/2022/ecri-reports-nvhap-as-a-top-threat-to-patient-safety-in-2022.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      }
    ],
    // evergreen-medical-uses-a-kinder-gentler-presurgical-skin-prep
    "https://www.stryker.com/us/en/sage/news/2022/evergreen-medical-uses-a-kinder-gentler-presurgical-skin-prep.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/4");
      }
    ],
    // focusrn-website-is-now-available
    "https://www.stryker.com/us/en/sage/news/2022/focusrn-website-is-now-available.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      }
    ],
    // health-affairs-urges-policy-makers-to-confront-pneumonia-threat
    "https://www.stryker.com/us/en/sage/news/2022/health-affairs-urges-policy-makers-to-confront-pneumonia-threat.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
        inlineReferencesToList(m, d);
      }
    ],
    // infection-control-today-article-about-waterborne-pathogens
    "https://www.stryker.com/us/en/sage/news/2022/infection-control-today-article-about-waterborne-pathogens.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
        inlineReferencesToList(m, d);
      }
    ],
    // joint-commission-barbara-quinn-interview-nv-hap-prevention
    "https://www.stryker.com/us/en/sage/news/2022/joint-commission-barbara-quinn-interview-nv-hap-prevention.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news");
        stripListNumbers(m, find(m, "li", "1. The Joint Commission"));
        style(m, d, find(m, "li", "The Joint Commission: Preventing"), "disclaimer");
      }
    ],
    // poster-presented-at-wocn-shows-comfort-shield-reduces-iad
    "https://www.stryker.com/us/en/sage/news/2022/poster-presented-at-wocn-shows-comfort-shield-reduces-iad.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
        inlineReferencesToList(m, d);
      }
    ],
    // preoperative-strategy-to-reduce-the-risk-of-surgical-site-infect
    "https://www.stryker.com/us/en/sage/news/2022/preoperative-strategy-to-reduce-the-risk-of-surgical-site-infect.html": [
      (m, d) => {
        labelsToSubheads(m, d, ["Surgical Technology International article recommends using chlorhexidine-impregnated cloths instead of a chlorhexidine solution"]);
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      }
    ],
    // sage-launches-journey-to-zero-to-help-reduce-nurse-injury
    "https://www.stryker.com/us/en/sage/news/2022/sage-launches-journey-to-zero-to-help-reduce-nurse-injury.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      }
    ],
    // stryker-sea-and-mccd-help-clean-up-hickory-grove-highlands
    "https://www.stryker.com/us/en/sage/news/2022/stryker-sea-and-mccd-help-clean-up-hickory-grove-highlands.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
      }
    ],
    // stryker-womens-network-at-sage-supports-international-womens-day
    "https://www.stryker.com/us/en/sage/news/2022/stryker-womens-network-at-sage-supports-international-womens-day.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
      }
    ],
    // a-magical-celebration-in-cary
    "https://www.stryker.com/us/en/sage/news/2023/a-magical-celebration-in-cary.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
      }
    ],
    // iu-health-decreases-urinary-catheter-usage-and-cauti-rates
    "https://www.stryker.com/us/en/sage/news/2023/iu-health-decreases-urinary-catheter-usage-and-cauti-rates.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/4");
      }
    ],
    // journey-to-zero-program-helps-protect-healthcare-workers
    "https://www.stryker.com/us/en/sage/news/2023/journey-to-zero-program-helps-protect-healthcare-workers.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      }
    ],
    // nyc-medical-center-implementation-of-external-female-catheter-av
    "https://www.stryker.com/us/en/sage/news/2023/nyc-medical-center-implementation-of-external-female-catheter-av.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news");
        inlineReferencesToList(m, d);
      }
    ],
    // shea-oral-care-reduction-in-non-ventilator-associated-pneumonia
    "https://www.stryker.com/us/en/sage/news/2023/shea-oral-care-reduction-in-non-ventilator-associated-pneumonia.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
        inlineReferencesToList(m, d);
      }
    ],
    // study-shows-sepsis-occurred-in-20-percent-of-nv-hap-patients
    "https://www.stryker.com/us/en/sage/news/2023/study-shows-sepsis-occurred-in-20-percent-of-nv-hap-patients.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
        inlineReferencesToList(m, d);
      }
    ],
    // stryker-advances-urology-portfolio-launch-flexible-ureteroscope
    "https://www.stryker.com/us/en/endoscopy/news/stryker-advances-urology-portfolio-launch-flexible-ureteroscope.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:business-unit/endoscopy");
        style(m, d, [...m.querySelectorAll("p")].find((p) => txt(p) === "F88 ureteroscope"), "image-1-2, col-8");
        style(m, d, find(m, "p", "To learn more, visit Stryker"), "col-8");
      }
    ],
    // sage-launches-new-multi-position-mats-to-help-or-nurses-safely-t
    "https://www.stryker.com/us/en/sage/news/2022/sage-launches-new-multi-position-mats-to-help-or-nurses-safely-t.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      }
    ],
    // sea-promotes-social-responsibility-with-tree-planting-event-
    "https://www.stryker.com/us/en/sage/news/2022/sea-promotes-social-responsibility-with-tree-planting-event-.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
      }
    ],
    // the-journey-to-zero-program-supports-nurse-safety
    "https://www.stryker.com/us/en/sage/news/2022/the-journey-to-zero-program-supports-nurse-safety.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      }
    ],
    // study-validates-the-value-of-mobilty-for-older-patients
    "https://www.stryker.com/us/en/sage/news/2023/study-validates-the-value-of-mobilty-for-older-patients.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      }
    ],
    // 2-percent-chlorhexidine-gluconate-cloth-ssi-prevention
    "https://www.stryker.com/us/en/sage/news/2024/2-percent-chlorhexidine-gluconate-cloth-ssi-prevention.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
      }
    ],
    // aeds-role-in-athletics
    "https://www.stryker.com/us/en/emergency-care/news/2024/aeds-role-in-athletics.html": [
      (m, d) => {
        bodyLRepresentative(m, d);
        tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news");
        spacerBefore(m, d, [...m.querySelectorAll("h3")].find((h) => txt(h) === "Learn More"), "spacer");
        mergeWithPrevious(m, find(m, "p", "Knowing when to use an AED"));
        const refs = [...m.querySelectorAll("ol")].find((ol) => txt(ol).includes("Rothmier"));
        if (refs) refs.replaceWith(...[...refs.children].map((li) => {
          const p = d.createElement("p");
          p.append(...li.childNodes);
          return p;
        }));
      }
    ],
    // introducing-ip-bravoe-a-new-standard-in-or-integration
    "https://www.stryker.com/us/en/endoscopy/news/introducing-ip-bravoe-a-new-standard-in-or-integration.html": [
      (m, d) => {
        m.setAttribute("data-meta-theme", "body-l");
        tags(m, "stryker:content-type/news, stryker:business-unit/endoscopy");
        style(m, d, find(m, "p", "As surgical environments evolve"), null);
        const close = find(m, "p", "The future of");
        style(m, d, close, null);
        close == null ? void 0 : close.querySelectorAll("em").forEach((em) => em.replaceWith(...em.childNodes));
      }
    ],
    // school-safety-staff-communication
    "https://www.stryker.com/us/en/smart-care/news/school-safety-staff-communication.html": [
      (m, d) => {
        m.setAttribute("data-meta-theme", "body-l");
        tags(m, "stryker:content-type/news, stryker:business-unit/acute-care/news");
        style(m, d, find(m, "p", "In today"), null);
        m.querySelectorAll("h3").forEach((h3) => breakBefore(m, d, h3, null));
        [...m.querySelectorAll("table")].filter(isSectionMetadata).forEach((t) => {
          const row = [...t.querySelectorAll("tr")].find((tr) => txt(tr.cells[0]).toLowerCase() === "style");
          if (!row) return;
          const rest = txt(row.cells[1]).split(",").map((v) => v.trim()).filter((v) => v && v !== "p-1-25");
          if (rest.length) row.cells[1].textContent = rest.join(", ");
          else if (t.querySelectorAll("tr").length <= 2) t.remove();
          else row.remove();
        });
      }
    ],
    // how-augmented-reality-can-help-care-teams-plan--design-and-const
    "https://www.stryker.com/us/en/about/news/2024/features/how-augmented-reality-can-help-care-teams-plan--design-and-const.html": [
      (m, d) => {
        m.setAttribute("data-meta-theme", "full-width, body-l");
        tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/Features, stryker:content-type/news/advanced-digital-healthcare");
        const cols = blockTable(m, "columns");
        if (cols && !sectionOf(m, cols).some(isSectionMetadata)) {
          const section = sectionOf(m, cols);
          section[section.length - 1].after(WebImporter.Blocks.createBlock(d, { name: "Section Metadata", cells: { style: "full-bleed", background: "light-gray" } }));
        }
      }
    ],
    // advancing-surgical-education-highlights-from-ispies-at-ircad
    "https://www.stryker.com/us/en/endoscopy/news/advancing-surgical-education-highlights-from-ispies-at-ircad.html": [
      (m, d) => {
        var _a, _b;
        m.setAttribute("data-meta-theme", "full-width, body-l");
        tags(m, "stryker:business-unit/endoscopy, stryker:content-type/news");
        const body = find(m, "p", "In mid-October, Endoscopy");
        style(m, d, body, null);
        m.querySelectorAll("h2").forEach((h2) => {
          if (h2.querySelector("em") || !txt(h2)) return;
          const em = d.createElement("em");
          em.append(...h2.childNodes);
          h2.append(em);
        });
        const spacer2 = (_b = (_a = sectionOf(m, m.querySelector("h1"))[0]) == null ? void 0 : _a.nextElementSibling) == null ? void 0 : _b.nextElementSibling;
        if (isSectionMetadata(spacer2) && !blockTable(m, "social share corp")) {
          style(m, d, spacer2, "spacer,small");
          socialShareAfter(m, d, spacer2);
          spacerBefore(m, d, body, "spacer");
        }
      }
    ]
  };
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
    applyCorrections(element, payload, CORRECTIONS2, FRAGMENT_CORRECTIONS);
  }

  // tools/importer/import-news-xf.js
  var PAGE_TEMPLATE = {
    name: "news-detail-xf",
    description: "www.stryker.com news articles whose body is an Experience Fragment (XF): the news-detail import, plus the XF handling. A shared XF (Resources links of Acute Care / Emergency Care) becomes a `fragment` block before the small print; any other XF is unwrapped in place and its AEM grid rows (2+ filled columns) become `columns` blocks with the variant nearest the span ratio (50-50, 67-33, 33-67, 75-25; 3+ cells no variant); blank section titles and empty rich text are dropped; a dimensional box becomes `Panel (left)`. Page metadata template stays news-detail.",
    urls: [
      "https://www.stryker.com/us/en/acute-care/news/acute-care-training-and-education-resources.html",
      "https://www.stryker.com/us/en/acute-care/news/nurse-led-innovation-and-the-power-of-partnership.html",
      "https://www.stryker.com/us/en/emergency-care/news/2024/life-saving-journey-inspires-community.html",
      "https://www.stryker.com/us/en/about/news/2026/a-message-to-our-customers-03-2026.html",
      "https://www.stryker.com/us/en/about/news/2024/stryker-launches-next-generation-of-surgicount--to-help-improve-.html",
      "https://www.stryker.com/us/en/about/news/2025/features/stryker-releases-2024-comprehensive-report.html",
      "https://www.stryker.com/us/en/about/news/features/improving-safety--spreading-truth-about-surgical-smoke.html",
      "https://www.stryker.com/us/en/about/news/2023/features/how-stryker-is-accelerating-innovation-in-additive-manufacturing.html",
      "https://www.stryker.com/us/en/about/news/features/employees-inspire-a-new-generation-of-robotics-engineers-through.html",
      "https://www.stryker.com/us/en/about/news/features/from-behind-the-scenes-to-the-front-line.html",
      "https://www.stryker.com/us/en/about/news/features/restoring-spines-and-hope.html",
      "https://www.stryker.com/us/en/about/news/2023/features/stryker-releases-comprehensive-report-highlighting-2022-performa.html",
      "https://www.stryker.com/us/en/about/news/2026/stryker-announces-leadership-succession.html"
    ],
    blocks: [
      { name: "hero-image-slide", instances: [".c-autocarousel"] },
      { name: "video", instances: [".c-standalone-video"] },
      { name: "cards-corp-teaser", instances: [".c-customizeable", ".c-latestnews"] }
    ]
  };
  var parsers = {
    "hero-image-slide": parse,
    video: parse3,
    "cards-corp-teaser": parse2
  };
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4,
    // persisted DA edits (excat-persist-content-edit): last, on the final page
    transform5
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
  var import_news_xf_default = {
    transform: (payload) => {
      var _a, _b;
      const { document, url, params } = payload;
      const main = document.body;
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
      main.appendChild(document.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document);
      if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, "");
      const keywords = (_b = (_a = document.querySelector('meta[name="keywords" i]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
      if (keywords) meta.Keywords = keywords;
      const dropMeta = [];
      [...main.attributes].filter((a) => a.name.startsWith("data-meta-")).forEach((a) => {
        const name = a.name.slice("data-meta-".length);
        if (a.value) meta[name] = a.value;
        else dropMeta.push(name);
        main.removeAttribute(a.name);
      });
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
      dropMeta.forEach((name) => delete meta[name]);
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
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_news_xf_exports);
})();
