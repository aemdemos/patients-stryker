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

  // tools/importer/import-ivs-footnotes-fragments.js
  var import_ivs_footnotes_fragments_exports = {};
  __export(import_ivs_footnotes_fragments_exports, {
    default: () => import_ivs_footnotes_fragments_default
  });

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
  function transform(hookName, element, payload) {
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

  // tools/importer/transformers/long-page-detail-corp-components.js
  var COMPONENT = '[class^="c-"], [class*=" c-"]';
  var UNIT = `[data-keep], ${COMPONENT}, .buttonset, table`;

  // tools/importer/import-ivs-footnotes.js
  var BACK_XF = "/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master";

  // tools/importer/import-ivs-footnotes-fragments.js
  var PAGE_TEMPLATE = {
    name: "ivs-footnotes-fragments",
    description: "Back link Experience Fragment of the Interventional Spine footnote pages, imported as a fragment document from a detail page: a bold + underlined link in a `no-arrow, back-link` section.",
    urls: ["https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html"],
    blocks: []
  };
  var text = (el) => el ? el.textContent.replace(/[\s\u00a0]+/g, " ").trim() : "";
  var import_ivs_footnotes_fragments_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const path = xfFragmentPath(BACK_XF);
      const main = document.createElement("div");
      document.body.querySelectorAll(".experiencefragment .c-rich-text-editor a[href]").forEach((src) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        const u = document.createElement("u");
        a.href = src.getAttribute("href");
        u.textContent = text(src);
        a.append(u);
        strong.append(a);
        p.append(strong);
        main.append(p);
      });
      if (!main.children.length) throw new Error(`No Back link XF on ${params.originalURL || url}`);
      main.append(WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style: "no-arrow, back-link" }
      }));
      document.body.replaceChildren(main);
      transform("afterTransform", main, __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE }));
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      return [{
        element: main,
        path,
        report: { title: path, template: PAGE_TEMPLATE.name, source: BACK_XF }
      }];
    }
  };
  return __toCommonJS(import_ivs_footnotes_fragments_exports);
})();
