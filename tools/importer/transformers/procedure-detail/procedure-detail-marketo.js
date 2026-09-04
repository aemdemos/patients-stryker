/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: inject the Marketo "Find a doctor" form as its own block.
 *
 * The source page loads a Marketo Forms 2.0 form in place, just above the
 * Resources cards, via JS (forms2.min.js + MktoForms2.loadForm). The static
 * scaffold (`.marketoform`) is non-authorable chrome and is stripped by
 * procedure-detail-cleanup.js. To reproduce the form we instead AUTHOR a
 * `marketo-form` block whose identifiers drive the same runtime embed:
 *
 *   | Marketo Form          |                                       |
 *   | Base URL              | //lp.stryker.com                      |
 *   | Munchkin ID           | 338-WAP-571                           |
 *   | Form ID               | 4893                                  |
 *   | Captcha Script        | https://patients.stryker.com/.../altcha.js |
 *   | Captcha Challenge URL  | https://patients.stryker.com/bin/.../challenge |
 *
 * PER-PAGE identifiers: rather than hard-code one form, we read each page's own
 * Marketo identifiers from its source `.marketoform` scaffold. Different IVS
 * treatment pages can carry different form ids, so this keeps a template-wide
 * bulk import correct without per-page setup. Signals, in priority order:
 *   - Form id:      the `<form id="mktoForm_NNNN">` id (always real markup).
 *   - Base URL /    live `data-marketo-base-url` / `data-marketo-munchkin-id`
 *     Munchkin id:  attributes when the headless import has hydrated them; else
 *                   parsed from the component's commented config
 *                   (`data-marketo-base-url="…"`, `MunchkinId:- "…"`).
 *   - Captcha:      the `<altcha-widget challengeurl="…">` path (challenge URL);
 *                   the altcha.js clientlib path is a site-wide constant.
 * Anything not found falls back to the balloon-kyphoplasty DEFAULTS below.
 *
 * TIMING: identifiers are captured in beforeTransform — BEFORE
 * procedure-detail-cleanup.js strips `.marketoform` in the same hook — and
 * stashed on the root element. The block itself is injected in afterTransform,
 * after procedure-detail-sections.js has inserted its section-break markers, so
 * it can anchor to the Resources break and sit in its own section. (This file
 * must run before cleanup in the transformer array so the scaffold still exists
 * when we read it.)
 *
 * NOTE: the challenge endpoint currently sends no CORS header, so off-origin
 * captcha verification is blocked until Stryker enables CORS for our host — see
 * the marketo-form block's JSDoc.
 */

// balloon-kyphoplasty defaults / site-wide constants (fallback when a page's
// scaffold doesn't expose a value).
const DEFAULTS = {
  baseUrl: '//lp.stryker.com',
  munchkinId: '338-WAP-571',
  formId: '4893',
  captchaScript: 'https://patients.stryker.com/etc.clientlibs/stryker/components/content/altcha/altcha.js',
  captchaChallengeUrl: 'https://patients.stryker.com/bin/stryker/captcha/challenge',
};

// Origin the source challenge path is resolved against (the Altcha endpoint and
// clientlib are served from the main site origin, not the Marketo lp. host).
const STRYKER_ORIGIN = 'https://patients.stryker.com';

const STASH = 'data-excat-marketo';

/** Read the Marketo/captcha identifiers from the source .marketoform scaffold. */
function readMarketoConfig(element) {
  const cfg = { ...DEFAULTS };
  const scaffold = element.querySelector('.marketoform, .c-marketo-form');
  if (!scaffold) return cfg;

  // Form id — from <form id="mktoForm_NNNN"> (real markup, always present).
  const form = scaffold.querySelector('form[id^="mktoForm_"]');
  const idMatch = form && form.id.match(/^mktoForm_(\d+)$/);
  if (idMatch) cfg.formId = idMatch[1];

  // Base URL / Munchkin id — prefer hydrated data-* attributes on the form.
  if (form) {
    const baseAttr = form.getAttribute('data-marketo-base-url');
    const munchkinAttr = form.getAttribute('data-marketo-munchkin-id');
    if (baseAttr) cfg.baseUrl = baseAttr;
    if (munchkinAttr) cfg.munchkinId = munchkinAttr;
  }

  // Fallback: the AEM component leaves its config in HTML comments
  // (data-marketo-base-url="…" and a `MunchkinId:- "…"` note). Scan comment
  // text when the live attributes weren't hydrated.
  const html = scaffold.innerHTML;
  if (cfg.baseUrl === DEFAULTS.baseUrl) {
    const m = html.match(/data-marketo-base-url\s*=\s*"([^"]+)"/i)
      || html.match(/URL:-\s*"([^"]+)"/i);
    if (m) cfg.baseUrl = m[1];
  }
  if (cfg.munchkinId === DEFAULTS.munchkinId) {
    const m = html.match(/data-marketo-munchkin-id\s*=\s*"([^"]+)"/i)
      || html.match(/MunchkinId:-\s*"([^"]+)"/i);
    if (m) cfg.munchkinId = m[1];
  }

  // Captcha challenge URL — from the widget's challengeurl (resolve relative
  // paths against the Stryker origin so it works off-origin).
  const widget = scaffold.querySelector('altcha-widget[challengeurl]')
    || element.querySelector('altcha-widget[challengeurl]');
  const challenge = widget && widget.getAttribute('challengeurl');
  if (challenge) {
    cfg.captchaChallengeUrl = /^https?:\/\//i.test(challenge)
      ? challenge
      : `${STRYKER_ORIGIN}${challenge.startsWith('/') ? '' : '/'}${challenge}`;
  }

  return cfg;
}

// The Resources section break is inserted before this selector by
// procedure-detail-sections.js; we place the form section immediately before it.
const RESOURCES_SELECTOR = '.tabs';

export default function transform(hookName, element, payload) {
  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Capture the per-page identifiers NOW, before cleanup removes .marketoform.
    const cfg = readMarketoConfig(element);
    element.setAttribute(STASH, JSON.stringify(cfg));
    return;
  }

  if (hookName !== 'afterTransform') return;

  // Recover the identifiers stashed in beforeTransform (fall back to defaults if
  // the stash is somehow missing).
  let cfg = DEFAULTS;
  const stashed = element.getAttribute(STASH);
  if (stashed) {
    try { cfg = JSON.parse(stashed); } catch { cfg = DEFAULTS; }
    element.removeAttribute(STASH);
  }

  const resources = element.querySelector(RESOURCES_SELECTOR);
  if (!resources) return; // no Resources section on this page — nothing to anchor to

  // The section transformer places an <hr> immediately before .tabs. Anchor to
  // that <hr> so the form becomes its own section between the CTA and Resources;
  // fall back to the Resources element itself if the break isn't present.
  let anchor = resources.previousElementSibling;
  if (!anchor || anchor.tagName !== 'HR') anchor = resources;

  const block = WebImporter.Blocks.createBlock(doc, {
    name: 'Marketo Form',
    cells: {
      'Base URL': cfg.baseUrl,
      'Munchkin ID': cfg.munchkinId,
      'Form ID': cfg.formId,
      'Captcha Script': cfg.captchaScript,
      'Captcha Challenge URL': cfg.captchaChallengeUrl,
    },
  });

  // A section break so the form sits in its own section.
  const hr = doc.createElement('hr');
  anchor.before(hr, block);
}
