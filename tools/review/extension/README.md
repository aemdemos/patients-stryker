# Review extension: live stryker.com (pilot, AOE team)

Shows the real, interactive stryker.com page inside the review tool: **Compare with: Live**, next
to Screenshot and Render, with Scroll Sync. Without the extension the tool works as before (no
Live).

## Install (Chrome or Edge)

1. Download `review-live-extension.zip` (the start page's AOE section links it) and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`), turn on **Developer mode**.
3. **Load unpacked**, choose the unzipped folder.
4. Reload the review tool: **Live** appears under Compare with.

Update: unzip the new version over the old folder, then **Reload** on the extension's card.

## What it does, and only that

- **Framing headers**: stryker.com tells browsers not to show it inside other sites
  (`X-Frame-Options`, CSP `frame-ancestors`). A fixed rule (`rules.json`) removes those two
  headers only for www.stryker.com shown in a frame of a review page (aem.page, aem.live,
  localhost); stryker.com opened normally is untouched. The CSP header is removed whole (a rule
  can't remove only `frame-ancestors`), for that framed page only.
- **The bridge** (`bridge.js`): inside the framed stryker.com page, only when its parent is a review
  page, it sends the tool where the page's texts and images are and where it is scrolled to (the
  same anchors as the tool's `sync.js`), and scrolls when the tool asks. It reads nothing else and
  sends nothing anywhere else.
- **The marker** (`tool.js`): on the review tool's pages it sets `data-review-live` on `<html>`, so
  the tool knows it can offer Live.

## Limits

- The tool can't look inside the live page (another site): no QA notes on it (note mode switches to
  the Screenshot), no block list. Pictures in the chats and notes on the Screenshot point at things.
- It is the page as it is now, for the person looking: cookies, consent banners and A/B tests
  included. Links inside it open other stryker.com pages in the same frame (the tag says so).
- Pilot: the AOE team only, until it is clear whether to ask Stryker's IT about reviewers.
