/*
 * long-page-detail-corp — corp long-page-detail template (`template: long-page-detail-corp`,
 * #469); called with the document by scripts/corp.js loadTemplate.
 *
 * Dynamic Media video players take their video's own shape, as the stryker.com viewer does.
 * The video frame is 16:9 (styles/lazy-styles.css), but some videos are not (e.g. 1244x720
 * for "High-performance CPR: The insider's insights"), which left them cropped or with gaps.
 * The size comes from the Dynamic Media video set (`<set>?req=set,json`, the request the
 * stryker.com viewer makes), whose path is the poster's image path. The template CSS reads it
 * from `--long-page-detail-corp-video-ratio`; without it (no Dynamic Media poster, request
 * failed) the frame stays 16:9.
 */

const DM_IMAGE = /^https:\/\/media-assets\.stryker\.com\/is\/image\/([^?]+)/;
const shaped = new WeakSet();

/**
 * The width / height of a Dynamic Media video set (its first video), or 0.
 * @param {string} set The set path, e.g. `stryker/high-performance-cpr-…-AVS`
 * @returns {Promise<number>}
 */
async function videoRatio(set) {
  try {
    const res = await fetch(`https://media-assets.stryker.com/is/image/${set}?req=set,json`);
    if (!res.ok) return 0;
    const size = (await res.text()).match(/"dx":"(\d+)","dy":"(\d+)"/);
    return size ? Number(size[1]) / Number(size[2]) : 0;
  } catch {
    return 0;
  }
}

/**
 * Gives a Dynamic Media video player its video's shape.
 * @param {HTMLVideoElement} video A `.dm-video` (scripts/dm-support.js)
 */
async function shapeVideo(video) {
  if (shaped.has(video)) return;
  shaped.add(video);
  const poster = (video.getAttribute('poster') || '').match(DM_IMAGE);
  if (!poster) return;
  const ratio = await videoRatio(poster[1]);
  if (ratio) video.style.setProperty('--long-page-detail-corp-video-ratio', String(ratio));
}

/**
 * Gold words in headings: the DA editor writes them as Italic around Bold (`<em><strong>`),
 * the importer as Bold around Italic; both are the gold marker. The template CSS sets a
 * heading's Italic in Egyptienne (heading + italic), so an Italic that holds only Bold is turned
 * around (`<strong><em>`) and the gold words keep the heading's font and line box (the Mako Live
 * thank-you title after an editor save).
 * @param {Element} main The main element
 */
function normaliseGoldMarkers(main) {
  main.querySelectorAll(':is(h1, h2, h3, h4, h5, h6) em').forEach((em) => {
    if (em.closest('strong')) return;
    const kids = [...em.childNodes]
      .filter((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
    if (kids.length !== 1 || kids[0].nodeName !== 'STRONG') return;
    const strong = document.createElement('strong');
    const italic = document.createElement('em');
    italic.append(...kids[0].childNodes);
    strong.append(italic);
    em.replaceWith(strong);
  });
}

/**
 * Shapes the video players on the page, including the ones the video block adds later, and
 * normalises the gold markers in headings.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;
  normaliseGoldMarkers(main);
  main.querySelectorAll('video.dm-video').forEach(shapeVideo);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('video.dm-video')) shapeVideo(node);
      node.querySelectorAll('video.dm-video').forEach(shapeVideo);
    }));
  });
  observer.observe(main, { childList: true, subtree: true });
}
