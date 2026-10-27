/*
 * www.stryker.com components → EDS default content, shared by every corp importer
 * (decision table: tools/importer/decisions/component-map.json).
 */
import { text } from './corp-richtext.js';

/**
 * Standalone image (stryker/components/content/standaloneimage, .c-standalone-image) →
 * default content, in source order:
 *   image (wrapped in its link when the source image links somewhere: linkInternal /
 *   linkExternal), then the image title (h4.title → <h4>), then the description
 *   (p.u-white-space-pre → <p>, its line breaks kept).
 * 189 standalone images on the site have a title and 72 a description (AEM export).
 * @returns {Element[]} the nodes to place in the section
 */
export default function standaloneImageNodes(component, doc) {
  const nodes = [];
  [...component.querySelectorAll('img')].forEach((source) => {
    const img = doc.createElement('img');
    img.setAttribute('src', source.getAttribute('src'));
    img.setAttribute('alt', source.getAttribute('alt') || '');
    const p = doc.createElement('p');
    const link = source.closest('a[href]');
    if (link) {
      const a = doc.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.append(img);
      p.append(a);
    } else {
      p.append(img);
    }
    nodes.push(p);
  });
  const title = component.querySelector('.title-content .title');
  if (title && text(title)) {
    const h4 = doc.createElement('h4');
    h4.textContent = text(title);
    nodes.push(h4);
  }
  const description = component.querySelector('.c-standalone-image-content > p');
  if (description && text(description)) {
    const p = doc.createElement('p');
    description.textContent.trim().split(/\n/).forEach((line, i) => {
      if (i) p.append(doc.createElement('br'));
      p.append(doc.createTextNode(line.trim()));
    });
    nodes.push(p);
  }
  return nodes;
}
