/* eslint-disable */
/* global WebImporter */

/**
 * Parser for marketo-form. Base: marketo-form.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: .marketoform
 * Generated: 2026-09-11
 *
 * The physician-contact form that sits between the gold "Tired of living in pain?"
 * CTA band and Resources. It maps to the project's `marketo-form` block
 * (blocks/marketo-form/marketo-form.js), which mounts a Marketo Forms 2.0 form
 * from a fixed key/value config table — identical across every migrated IVS
 * treatment sibling (disc-decompression, sacroplasty, …). The mild source uses the
 * same form: <form id="mktoForm_4893"> under Munchkin 338-WAP-571, verified in
 * migration-work/mild/cleaned.html (line 1035). The Marketo runtime markup itself
 * is not authorable, so we don't scrape it — we emit the same config rows the
 * siblings use, matching content/us/en/ivs/treatments/disc-decompression.plain.html.
 *
 * Key/value block: one row per config pair (readBlockConfig lowercases + hyphenates
 * the key cell, so "Base URL" -> base-url, "Munchkin ID" -> munchkin-id, etc.).
 *
 * Not every IVS page uses the same form: get-the-facts ships form 2945 under the
 * same Munchkin. The source carries the ids as data-marketo-* attributes on the
 * form container, so read them when present and fall back to the mild defaults.
 */
const DEFAULTS = {
  baseUrl: '//lp.stryker.com',
  munchkinId: '338-WAP-571',
  formId: '4893',
};

export default function parse(element, { document }) {
  const attr = (name) => {
    const el = element.querySelector(`[${name}]`) || (element.hasAttribute(name) ? element : null);
    const value = el && el.getAttribute(name).trim();
    return value || null;
  };
  const CONFIG_ROWS = [
    ['Base URL', attr('data-marketo-base-url') || DEFAULTS.baseUrl],
    ['Munchkin ID', attr('data-marketo-munchkin-id') || DEFAULTS.munchkinId],
    ['Form ID', attr('data-marketo-form-id') || DEFAULTS.formId],
    ['Captcha Script', 'https://patients.stryker.com/etc.clientlibs/stryker/components/content/altcha/altcha.js'],
    ['Captcha Challenge URL', 'https://patients.stryker.com/bin/stryker/captcha/challenge'],
  ];

  const cells = CONFIG_ROWS.map(([key, value]) => {
    const k = document.createElement('div');
    k.textContent = key;
    const v = document.createElement('div');
    v.textContent = value;
    return [k, v];
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'marketo-form',
    cells,
  });
  element.replaceWith(block);
}
