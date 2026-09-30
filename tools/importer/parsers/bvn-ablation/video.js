/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `video` block (bvn-ablation singleton).
 * Source: .fullbleedpanel .standalonevideo — a Dynamic Media `videoavs` viewer
 * (no <video>/<img> in the markup; the viewer is built client-side from
 * data-* attributes on .s7dm-dynamic-media).
 *
 * Target authored table (single cell), header "Video":
 *   a link to the DM adaptive stream `<videoserver><asset-path>.m3u8`, which the
 *   video block renders as a native HLS player (scripts/dm-support.js).
 *
 * The dark band's text column stays default content, so the section (Style
 * `flex, dark`) lays out text | video side by side.
 */

const DEFAULT_VIDEO_SERVER = 'https://media-assets.stryker.com/is/content/';
const DEFAULT_IMAGE_SERVER = 'https://media-assets.stryker.com/is/image/';

export default function parse(element, { document }) {
  const viewer = element.querySelector('[data-asset-path]');
  const assetPath = viewer && viewer.getAttribute('data-asset-path');
  if (!assetPath) {
    element.remove(); // nothing playable to author
    return;
  }

  let server = viewer.getAttribute('data-videoserver') || DEFAULT_VIDEO_SERVER;
  if (!server.endsWith('/')) server += '/';
  // Poster frame: DM serves a still for the same asset from the image server.
  // Authored as the video block's `?poster=` param (its own `&`s escaped as %26,
  // same convention as the video-block draft), otherwise the native player sits
  // blank until playback where the source viewer shows a frame.
  let imageServer = viewer.getAttribute('data-imageserver') || DEFAULT_IMAGE_SERVER;
  if (!imageServer.endsWith('/')) imageServer += '/';
  const poster = `${imageServer}${assetPath}?fit=constrain,1%26wid=750%26hei=422`;
  const href = `${server}${assetPath}.m3u8?poster=${poster}`;

  // Accessible label: the page topic (og:title — the hero h1 is already replaced
  // by its parser at this point) + "animation" (the asset is the procedure
  // animation, IVS-OPTABVN-ANIM-…). Never the raw URL.
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const topic = (ogTitle && ogTitle.getAttribute('content')) || document.title.split('|')[0];
  const label = `${(topic || 'Procedure').trim()} animation`;

  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.setAttribute('title', label);
  a.textContent = label;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Video', cells: [[a]] });
  element.replaceWith(block);
}
