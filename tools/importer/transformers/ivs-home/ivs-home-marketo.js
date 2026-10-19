/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: replace the source Marketo "doctor finder" scaffold with an
 * authored `marketo-form` block, in place.
 *
 * The source page loads a Marketo Forms 2.0 form (forms2.min.js +
 * MktoForms2.loadForm) in a `.marketoform` scaffold just after the "Tired of
 * living in pain?" gold CTA. That static scaffold is non-authorable chrome; to
 * reproduce the form we AUTHOR a `marketo-form` block whose identifiers drive the
 * same runtime embed:
 *
 *   | Marketo Form |                    |
 *   | Base URL     | //lp.stryker.com   |
 *   | Munchkin ID  | 338-WAP-571        |
 *   | Form ID      | 4893               |
 *
 * PER-PAGE identifiers are read from the page's own `.marketoform` scaffold
 * (Form id from `<form id="mktoForm_NNNN">`; Base URL / Munchkin id from hydrated
 * `data-marketo-*` attributes, else the AEM component's commented sly config).
 * Anything not found falls back to the IVS-homepage DEFAULTS below.
 *
 * TIMING: identifiers are captured AND the block is injected in beforeTransform,
 * replacing the scaffold in place. This runs BEFORE ivs-home-cleanup (which does
 * NOT strip `.marketoform`) and BEFORE ivs-home-sections (so the injected block's
 * position — where the scaffold was — receives the section break + `anchor:
 * resources` Section Metadata from the sections transformer).
 *
 * Captcha: the source `<altcha-widget>` renders with NO challengeurl/script src in
 * the static scaffold (injected at runtime), so no captcha rows are emitted; the
 * marketo-form block simply omits the optional captcha when they're absent.
 */

const DEFAULTS = {
  baseUrl: '//lp.stryker.com',
  munchkinId: '338-WAP-571',
  formId: '4893',
};

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/** Read the Marketo identifiers from the source .marketoform scaffold. */
function readMarketoConfig(element) {
  const cfg = { ...DEFAULTS, present: false };
  const scaffold = element.querySelector('.marketoform, .c-marketo-form');
  if (!scaffold) return cfg; // no form on this page (present stays false)
  cfg.present = true;

  // Form id — from <form id="mktoForm_NNNN"> (real markup when present).
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
  // (data-marketo-base-url="…" and a `MunchkinId:- "…"` note). Scan comment text
  // when the live attributes weren't hydrated.
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

  return cfg;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;
  const doc = element.ownerDocument;

  const scaffold = element.querySelector('.marketoform');
  const cfg = readMarketoConfig(element);
  // Only inject when the source actually had a Marketo scaffold.
  if (!cfg.present || !scaffold) return;

  const block = WebImporter.Blocks.createBlock(doc, {
    name: 'Marketo Form',
    cells: {
      'Base URL': cfg.baseUrl,
      'Munchkin ID': cfg.munchkinId,
      'Form ID': cfg.formId,
    },
  });

  // Replace the scaffold in place so the block keeps the form's position (between
  // the find-a-doctor CTA and the disclaimer). The sections transformer then adds
  // the section break + `anchor: resources` metadata around this spot.
  scaffold.replaceWith(block);
}
