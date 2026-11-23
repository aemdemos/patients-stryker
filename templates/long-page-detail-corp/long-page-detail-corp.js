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
 * Shapes the video players on the page, including the ones the video block adds later.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
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
