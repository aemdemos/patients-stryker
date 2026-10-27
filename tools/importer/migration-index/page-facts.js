/*
 * Page facts: authored data the scrape cannot (reliably) provide, per page —
 * metadata, in-page anchors, disclaimer, forms, tab titles, card-list targets,
 * images without alt text.
 */
import {
  forEachNode, isComponent, shortType, templateName, toIso, edsPagePath, pageExportFile,
  readJson, cleanText,
} from './lib.js';

const T = (name) => `stryker/components/content/${name}`;

/** Title, description and share image of a card-list target page, from its own export. */
function cardTarget(ref, cache) {
  const eds = edsPagePath(ref);
  if (!cache.has(eds)) {
    const file = pageExportFile(eds);
    if (!file) cache.set(eds, { path: eds, resolved: false });
    else {
      const json = readJson(file);
      cache.set(eds, {
        path: eds,
        resolved: true,
        title: json['jcr:title'] || null,
        description: cleanText(json['jcr:description'], 400) || null,
        image: json.image?.fileReference || null,
        alt: json.thumbnailAltText ?? null,
      });
    }
  }
  return cache.get(eds);
}

export default function buildPageFacts(pages) {
  const cache = new Map();
  const byTemplate = {};
  const missingAlt = [];
  pages.forEach(({ path, json }) => {
    const facts = {
      template: templateName(json),
      metadata: {
        title: json['jcr:title'] || null,
        pageTitle: json.pageTitle || null,
        description: json['jcr:description'] || null,
        image: json.image?.fileReference || null,
        imageAlt: json.thumbnailAltText ?? null,
        tags: json['cq:tags'] || [],
        originallyPublished: toIso(json.originallyPublished),
        lastPublished: toIso(json.lastPublished),
        contentID: json.contentID || null,
      },
      anchors: [],
      disclaimer: null,
      forms: [],
      tabs: [],
      cardLists: [],
      missingAlt: [],
    };
    if (json.disclaimer?.disclaimer) facts.disclaimer = json.disclaimer.disclaimer.trim();

    forEachNode(json, (node, key, ctx) => {
      if (!isComponent(node)) return;
      const type = node['sling:resourceType'];
      if (node.deepLinkingId || (type === T('title') && node.id)) {
        facts.anchors.push({
          id: node.deepLinkingId || node.id,
          title: node.title || null,
          hidden: node.hideSectionTitleComp === 'true',
          type: shortType(type),
          area: ctx.area,
        });
      }
      if (type === T('marketoform')) {
        facts.forms.push({
          formId: node.formId || null,
          afterSubmitAction: node.afterSubmitAction || null,
          message: node.message || null,
          useProduction: node.useProduction === 'true',
        });
      }
      if (type === T('tabs') && node.tabsGrid) {
        facts.tabs.push(Object.values(node.tabsGrid).map((t) => t.tabTitle).filter(Boolean));
      }
      if (type === T('customizable') && node.featuresCta) {
        facts.cardLists.push({
          component: key,
          title: node.title || null,
          items: Object.values(node.featuresCta).map((c) => c.cta).filter(Boolean)
            .map((ref) => cardTarget(ref, cache)),
        });
      }
      if (type === T('standaloneimage') && node.srcFileRef && !String(node.alt || '').trim()) {
        facts.missingAlt.push(node.srcFileRef);
      }
    });
    if (facts.missingAlt.length) missingAlt.push({ page: path, images: facts.missingAlt });
    byTemplate[facts.template] = byTemplate[facts.template] || {};
    byTemplate[facts.template][path] = facts;
  });
  return { byTemplate, missingAlt };
}
