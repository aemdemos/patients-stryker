import { loadScript } from '../scripts/aem.js';
import { whenNearViewport } from '../scripts/utils.js';

/*
 * Stryker microapps (zoid components) — `/widgets/remote-component?url=<componentUrl>&id=<id>`.
 * Mirrors the source `remote-component` widget (www.stryker.com components.min.js): the
 * parent creates a zoid component from the microapp URL and renders it into the container;
 * the microapp sizes its frame height (zoid autoResize). zoid comes from the microapps'
 * own shared build, so parent and child speak the same zoid version.
 * The microapps only allow framing from *.stryker.com (CSP frame-ancestors), so on other
 * hosts the frame never initialises and the container stays empty.
 */

const ALLOWED_HOST = /(^|\.)stryker\.com$/;
const components = new Map();

/**
 * The zoid tag, derived from the URL as the source does: the last path segment when it has
 * no extension, otherwise (index.html, trailing slash) the folder name.
 * @param {URL} url The microapp URL
 * @returns {string} The tag
 */
function zoidTag(url) {
  const segments = url.pathname.split('/');
  const resource = segments.pop().trim();
  const folder = segments.pop();
  return resource && !resource.includes('.') ? resource : folder;
}

/**
 * Creates (once per tag) the zoid component for a microapp.
 * @param {string} tag The zoid tag
 * @param {string} href The microapp URL
 * @param {string} title The frame's accessible name
 */
function getComponent(tag, href, title) {
  if (!components.has(tag)) {
    components.set(tag, window.zoid.create({
      tag,
      url: href,
      scrolling: true,
      autoResize: { width: false, height: true },
      dimensions: { width: '99%', height: '99%' },
      attributes: { iframe: { title } },
    }));
  }
  return components.get(tag);
}

/**
 * @param {Element} widget The widget block
 */
export default function decorate(widget) {
  const container = widget.querySelector('.remote-component-frame');
  let url;
  try {
    url = new URL(widget.dataset.url);
  } catch {
    return;
  }
  if (!container || url.protocol !== 'https:' || !ALLOWED_HOST.test(url.hostname)) return;

  const tag = zoidTag(url);
  if (!tag) return;
  const title = widget.dataset.id || widget.dataset.label || tag;

  whenNearViewport(widget, async () => {
    try {
      await loadScript(`${url.origin}/shared/js/zoid.frame.min.js`);
      if (!window.zoid) return;
      await getComponent(tag, url.href, title).render({
        // the microapps report usage through this prop, as on the source
        track: (identifier) => {
          const { _satellite: launch } = window;
          launch?.track(identifier || 'calculatorUsed');
        },
      }, container);
    } catch {
      // framing refused / microapp unavailable: the container stays empty
      container.replaceChildren();
    }
  });
}
