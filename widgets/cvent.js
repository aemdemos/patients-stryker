/*
 * Cvent events calendar — `/widgets/cvent?widget-id=<id>&calendar-id=<id>`.
 * The source (www.stryker.com /us/en/training-and-education/calendar) renders the calendar
 * inline with Cvent's loader script. Here it was to be framed instead, but every Cvent
 * calendar URL refuses framing outside cvent.com (the web widget sends frame-ancestors
 * 'none', the calendar page frame-ancestors 'self' cvent.com *.cvent.com, both
 * X-Frame-Options DENY). So the widget renders a primary button (as a bold link alone on
 * its line would) to Cvent's public page for the calendar; the link text is the
 * authored link text. `widget-id` is kept in the authored link for a later embed.
 */

const CALENDAR_URL = 'https://www.cvent.com/c/calendar/';

/**
 * @param {Element} widget The widget block
 */
export default function decorate(widget) {
  const link = widget.querySelector('a.button');
  const { calendarId, label } = widget.dataset;
  if (!link || !calendarId) return;
  link.href = `${CALENDAR_URL}${encodeURIComponent(calendarId)}`;
  link.textContent = label || 'Events calendar';
  link.title = link.textContent;
}
