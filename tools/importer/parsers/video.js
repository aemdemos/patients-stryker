/* eslint-disable */
/* global WebImporter */

/**
 * Parser: www.stryker.com `.c-standalone-video` → `Video` block.
 *
 * Block table: 1 column, 2 rows — the block name, then one cell with the video link
 * (blocks/video/video.js plays Dynamic Media and YouTube links).
 *
 * Source shapes:
 *   - Dynamic Media viewer: .s7dm-dynamic-media[data-asset-path="stryker/<asset>-AVS"]
 *     with data-videoserver / data-imageserver (and data-posterimage when set). Imported
 *     as the Scene7 HLS link with the poster as `?poster=`, the same shape as the authored
 *     corp video drafts:
 *       https://media-assets.stryker.com/is/content/stryker/<asset>-AVS.m3u8
 *         ?poster=https://media-assets.stryker.com/is/image/stryker/<poster>?fit=constrain,1&wid=909&hei=511
 *     The link text is the source asset name (data-asset-name, without extension).
 *   - YouTube iframe: imported as the watch URL.
 */

const DM_HOST = 'https://media-assets.stryker.com';

function encodePath(path) {
  return path.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function videoLink(element, document) {
  const a = document.createElement('a');
  const dm = element.querySelector('[data-asset-path]');
  if (dm) {
    const assetPath = dm.getAttribute('data-asset-path');
    const videoServer = dm.getAttribute('data-videoserver') || `${DM_HOST}/is/content/`;
    const imageServer = dm.getAttribute('data-imageserver') || `${DM_HOST}/is/image/`;
    const poster = dm.getAttribute('data-posterimage') || assetPath;
    a.href = `${videoServer}${encodePath(assetPath)}.m3u8?poster=${imageServer}${encodePath(poster)}?fit=constrain,1&wid=909&hei=511`;
    a.textContent = (dm.getAttribute('data-asset-name') || assetPath.split('/').pop()).replace(/\.[a-z0-9]+$/i, '');
    return a;
  }
  const iframe = element.querySelector('iframe[src*="youtube"], iframe[data-src*="youtube"]');
  const src = iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'));
  const id = src && (src.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/) || [])[1];
  if (!id) return null;
  a.href = `https://www.youtube.com/watch?v=${id}`;
  a.textContent = iframe.getAttribute('title') || a.href;
  return a;
}

export default function parse(element, { document }) {
  const link = videoLink(element, document);
  if (!link) return;
  const cells = [[link]];
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Video', cells }));
}
