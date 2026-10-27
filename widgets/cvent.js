import { whenNearViewport } from '../scripts/utils.js';

/*
 * Cvent events calendar — `/widgets/cvent?widget-id=<id>&calendar-id=<id>`.
 * As on the source (www.stryker.com /us/en/training-and-education/calendar), whose Cvent
 * loader (www.cvent.com/g/mobile/javascript/calendar-widget-loader.js) fetches the
 * calendar's web widget HTML and appends it to #calendar-widget-container. The loader runs
 * the widget's inline scripts through jQuery's eval, which this site's CSP (no
 * 'unsafe-eval') blocks, so the widget does the loader's two steps itself: fetch the same
 * URL, then append the HTML and run its scripts in order (inline ones with the page nonce).
 * The placeholder holds the source's reserved height until the calendar has rendered.
 * One calendar per page (Cvent looks the container up by id).
 */

const CVENT_DOMAIN = 'www.cvent.com';

/**
 * Appends a node of the widget HTML; scripts are re-created so they run (in order).
 * @param {Element} container The calendar container
 * @param {Node} node A node of the fetched HTML
 * @param {string} nonce The page's script nonce
 * @returns {Promise<void>} Resolves once the node (an external script: loaded) is in
 */
function appendNode(container, node, nonce) {
  if (node.nodeName !== 'SCRIPT') {
    container.append(node);
    return Promise.resolve();
  }
  const script = document.createElement('script');
  if (nonce) script.nonce = nonce;
  if (!node.src) {
    script.textContent = node.textContent;
    container.append(script);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', resolve);
    script.addEventListener('error', resolve);
    script.src = node.src;
    container.append(script);
  });
}

/**
 * Fetches the calendar web widget and renders it into the container.
 * @param {Element} container The calendar container
 */
async function loadCalendar(container) {
  const { widgetId, calendarId, showIcons } = container.dataset;
  const url = new URL(`https://${CVENT_DOMAIN}/c/calendar/${calendarId}/webwidget/${widgetId}`);
  url.searchParams.set('showIcons', showIcons || 'false');
  url.searchParams.set('isPreview', 'false');
  url.searchParams.set('showSpinner', 'false');
  window.cvtDomain = CVENT_DOMAIN;

  const resp = await fetch(url);
  if (!resp.ok) return;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const nonce = document.querySelector('script[nonce]')?.nonce;
  const nodes = [...doc.head.childNodes, ...doc.body.childNodes];
  await nodes.reduce(
    (ready, node) => ready.then(() => appendNode(container, node, nonce)),
    Promise.resolve(),
  );
}

/**
 * @param {Element} widget The widget block
 */
export default function decorate(widget) {
  const container = widget.querySelector('#calendar-widget-container');
  const { widgetId, calendarId } = widget.dataset;
  if (!container || !widgetId || !calendarId) return;
  container.dataset.widgetId = widgetId;
  container.dataset.calendarId = calendarId;
  if (widget.dataset.label) {
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', widget.dataset.label);
  }

  // drop the placeholder once the calendar has content of its own
  const placeholder = container.querySelector('.cvent-placeholder');
  const observer = new MutationObserver(() => {
    if (!container.querySelector('#calendar-widget-content > *')) return;
    observer.disconnect();
    placeholder?.remove();
  });
  observer.observe(container, { childList: true, subtree: true });

  whenNearViewport(widget, () => {
    loadCalendar(container).catch(() => {
      // Cvent unavailable: the reserved space stays empty
    });
  });
}
