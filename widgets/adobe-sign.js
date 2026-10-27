import { whenNearViewport } from '../scripts/utils.js';

/*
 * Adobe Sign web form — `/widgets/adobe-sign?wid=<widgetID>&height=<minheight>`.
 * As on the source (www.stryker.com adobesignwebform): an esignWidget iframe, full width,
 * at least `height` px high (the form does not resize its frame). The height is reserved
 * up front; the frame loads when the form nears the viewport.
 */

const SIGN_URL = 'https://microsoftsharepointintegration.na2.echosign.com/public/esignWidget';

/**
 * @param {Element} widget The widget block
 */
export default function decorate(widget) {
  const container = widget.querySelector('.adobe-sign-frame');
  const { wid } = widget.dataset;
  if (!container || !wid) return;

  const height = Number.parseInt(widget.dataset.height, 10);
  if (height > 0) container.style.setProperty('--adobe-sign-height', `${height}px`);

  whenNearViewport(widget, () => {
    const url = new URL(SIGN_URL);
    url.searchParams.set('wid', wid);
    url.searchParams.set('hosted', 'false');
    const iframe = document.createElement('iframe');
    iframe.src = url.href;
    iframe.title = widget.dataset.label || 'Adobe Sign form';
    container.append(iframe);
  });
}
