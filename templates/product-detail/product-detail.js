/*
 * product-detail — www.stryker.com product pages (`template: product-detail`, review build,
 * docs/standardisation); called with the document by scripts/corp.js loadTemplate.
 *
 * Dynamic Media video players take their video's own shape, as the stryker.com viewer does:
 * the size comes from the Dynamic Media video set (`<set>?req=set,json`, whose path is the
 * poster's image path) and goes in `--product-detail-video-ratio` (product-detail.css);
 * without it the frame stays 16:9.
 */

const DM_IMAGE = /^https:\/\/media-assets\.stryker\.com\/is\/image\/([^?]+)/;
const shaped = new WeakSet();

/**
 * The width / height of a Dynamic Media video set (its first video), or 0.
 * @param {string} set The set path
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
  if (ratio) video.style.setProperty('--product-detail-video-ratio', String(ratio));
}

/**
 * Shapes the video players on the page, including the ones blocks add later.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  // in review: review pages only (real product pages already carry this template)
  if (!doc.body.classList.contains('std-draft')) return;
  const main = doc.querySelector('main');
  if (!main) return;
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
