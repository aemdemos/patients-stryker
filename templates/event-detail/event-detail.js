/*
 * event-detail — corp event template (`template: event-detail`); called with the document
 * by scripts/corp.js loadTemplate, after the main content is decorated and before the
 * Columns block runs.
 */

const NO_MAP = /^(virtual|online|n\/a)$/i;

/**
 * Collapses line breaks and whitespace in a metadata value into a single line.
 * @param {string} value The raw value
 * @returns {string} The one-line value, without stray leading/trailing commas
 */
function oneLine(value) {
  return (value || '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/[\r\n]+/g, ', ')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim()
    .replace(/^[,\s]+|[,\s]+$/g, '');
}

/**
 * Shows a keyless Google Maps embed of the event location at the top of the sidebar.
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  const meta = (name) => oneLine(doc.querySelector(`meta[name="${name}"]`)?.content);
  const location = meta('event-location');
  if (!location || NO_MAP.test(location)) return;

  const sidebar = doc.querySelector('main .columns.columns-67-33 > div > div:nth-child(2)');
  if (!sidebar || sidebar.querySelector('.event-map')) return;

  const country = meta('event-country');
  const query = country ? `${location}, ${country}` : location;
  const iframe = doc.createElement('iframe');
  iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  iframe.title = `Map of ${location}`;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';

  const wrapper = doc.createElement('div');
  wrapper.className = 'event-map';
  wrapper.append(iframe);
  sidebar.prepend(wrapper);
}
