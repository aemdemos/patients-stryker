/*
 * On the review tool's pages: says the extension is there (the tool then offers Compare with:
 * Live, the real stryker.com page), and carries Snap between the tool and the extension: the
 * tool's requests to it, and the pictures back (also those of the icon or Alt+Shift+S).
 */
document.documentElement.dataset.reviewLive = window.chrome?.runtime?.getManifest?.()?.version || '1';
document.documentElement.dataset.reviewSnap = '1';

const back = (msg) => window.postMessage({ reviewSnap: true, type: 'result', ...msg }, window.location.origin);
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data?.reviewSnap || e.data.type !== 'request') return;
  const { id } = e.data;
  window.chrome.runtime.sendMessage({ type: 'snap' }, (res) => {
    const error = window.chrome.runtime.lastError?.message || res?.error || null;
    back({ id, dataUrl: res?.dataUrl || null, error });
  });
});
window.chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'snapped') back({ id: 'icon', dataUrl: msg.dataUrl || null, error: msg.error || null });
});
