/*
 * Widget (corp): a stryker.com micro-app or the Cvent events calendar, embedded as it is
 * (docs/standardisation/widget.md). In review: draft pages only (blocks/widget/widget.js).
 *
 * Micro-apps (variants product-explorer, calculator, map, medical-information-request): the
 * authored link is the app's address on microapp.stryker.com, e.g.
 * https://microapp.stryker.com/surfaces-rental/index.html. As the AEM remote component did, the
 * block loads zoid and renders the app in a frame that sizes itself to the app.
 *
 * Cvent (variant cvent): the authored link is the Cvent calendar address with the widget id,
 * https://www.cvent.com/c/calendar/<calendar-id>?widget=<widget-id>; the block loads Cvent's
 * calendar widget script, as stryker.com does.
 */
import { loadScript } from '../../scripts/aem.js';

export const MICROAPP_HOST = 'microapp.stryker.com';
const CVENT_HOST = 'www.cvent.com';

let count = 0;

/**
 * The app as a link, when it can't be shown in the page.
 * @param {Element} widget The widget block
 * @param {URL} url The app address
 */
function fallback(widget, url) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = url.href;
  a.textContent = url.href;
  p.append(a);
  widget.replaceChildren(p);
}

/**
 * The zoid tag of an app: the last folder of its address, or its last part when that has no
 * extension (stryker.com remote component: /surfaces-rental/index.html → surfaces-rental,
 * /trauma-skeleton/ → trauma-skeleton).
 * @param {URL} url The app address
 * @returns {string} The tag
 */
function appTag(url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return last.includes('.') ? parts[parts.length - 2] : last;
}

/**
 * Renders a micro-app.
 * @param {Element} widget The widget block
 * @param {URL} url The app address
 */
async function renderMicroApp(widget, url) {
  await loadScript(`${window.hlx.codeBasePath}/blocks/widget/vendor/zoid.min.js`);
  const tag = appTag(url);
  count += 1;
  const container = document.createElement('div');
  container.className = 'widget-app';
  container.id = `widget-app-${count}`;
  widget.replaceChildren(container);
  window.remotecomponents = window.remotecomponents || {};
  if (!window.remotecomponents[tag]) {
    window.remotecomponents[tag] = window.zoid.create({
      tag,
      url: url.href,
      scrolling: true,
      autoSize: { width: false, height: false },
      dimensions: { width: '99%', height: '99%' },
    });
  }
  // the apps report their use to Adobe Launch (its global `_satellite`) when it is on the page
  const track = (identifier) => Reflect.get(window, '_satellite')?.track?.(identifier || 'calculatorUsed');
  // not awaited: the page goes on loading while the app starts. An app that doesn't start (its
  // host allows framing only from *.stryker.com: the maps and medical information requests on the
  // preview domains) becomes a link to the app
  window.remotecomponents[tag].render({ track, timeout: 15000 }, `#${container.id}`)
    .catch(() => fallback(widget, url));
}

/**
 * Renders the Cvent events calendar.
 * @param {Element} widget The widget block
 * @param {URL} url The calendar address
 */
async function renderCvent(widget, url) {
  const calendar = url.pathname.split('/').filter(Boolean).pop();
  const container = document.createElement('div');
  container.id = 'calendar-widget-container';
  container.className = 'widget-app';
  container.dataset.widgetId = url.searchParams.get('widget') || '';
  container.dataset.calendarId = calendar;
  container.dataset.height = '';
  container.dataset.width = '';
  container.dataset.showIcons = 'true';
  widget.replaceChildren(container);
  window.cvtDomain = CVENT_HOST;
  const version = Date.now() / 3600000;
  await loadScript(`https://${CVENT_HOST}/g/mobile/javascript/calendar-widget-loader.js?version=${version}`);
  // a calendar that doesn't render (the widget's inline handlers are refused by the site's
  // content security policy) becomes a link to the calendar
  setTimeout(() => { if (!container.offsetHeight) fallback(widget, url); }, 15000);
}

/**
 * Whether a link is a micro-app or a Cvent calendar.
 * @param {string} href The authored link
 * @returns {boolean} True when this module renders it
 */
export function isEmbed(href) {
  const { host, pathname } = new URL(href);
  return host === MICROAPP_HOST || (host === CVENT_HOST && pathname.startsWith('/c/calendar/'));
}

/**
 * Decorates a micro-app or Cvent widget.
 * @param {Element} widget The widget block
 * @param {HTMLAnchorElement} source The authored link
 */
export default async function decorate(widget, source) {
  const url = new URL(source.href);
  widget.dataset.source = url.href;
  try {
    if (url.host === CVENT_HOST) await renderCvent(widget, url);
    else await renderMicroApp(widget, url);
  } catch (error) {
    fallback(widget, url);
  }
}
