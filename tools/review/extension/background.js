/*
 * Snap (0.2.0): a picture of what a review tab shows, for the tool to crop to the Live page and
 * put into a chat. A browser lets an extension take it only once the user has clicked its icon (or
 * pressed Alt+Shift+S) in that tab (activeTab: no access to any site is asked for). That click
 * snaps, and after it the tool's Snap button works in that tab until it is reloaded or closed.
 * Review pages only (aem.page, aem.live, localhost).
 */
const REVIEW = /^(https:\/\/[a-z0-9-]+(--[a-z0-9-]+)*\.aem\.(page|live)|http:\/\/localhost(:\d+)?)\/tools\/review\//;

const capture = (windowId) => chrome.tabs.captureVisibleTab(windowId, { format: 'png' });

// the tool's Snap button (through tool.js)
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg?.type !== 'snap' || !sender.tab || !REVIEW.test(sender.url || '')) return false;
  capture(sender.tab.windowId)
    .then((dataUrl) => reply({ dataUrl }), () => reply({ error: 'needs-click' }));
  return true;
});

// the icon or the shortcut: snaps now (and allows the button in this tab)
async function snapTab(tab) {
  if (!tab?.id || !REVIEW.test(tab.url || '')) return;
  try {
    const dataUrl = await capture(tab.windowId);
    await chrome.tabs.sendMessage(tab.id, { type: 'snapped', dataUrl });
  } catch (e) {
    await chrome.tabs.sendMessage(tab.id, { type: 'snapped', error: String(e?.message || e) }).catch(() => null);
  }
}
chrome.action.onClicked.addListener(snapTab);
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'snap') snapTab(tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]);
});
