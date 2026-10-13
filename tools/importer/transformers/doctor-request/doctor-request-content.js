/* global WebImporter */

/**
 * Transformer: doctor-request content + section break.
 *
 * Template-scoped: acts ONLY on the `doctor-request` SINGLETON template
 * (https://patients.stryker.com/us/en/ivs/find-a-doctor/doctor-request.html),
 * guarded by payload.template.name. Inert for every other template.
 *
 * Registered AFTER the shared patients-stryker-cleanup.js, which runs its
 * legal-page branch for this template (chrome removal + afterTransform h1->h2
 * demotion). This transformer therefore creates the page <h1> in afterTransform,
 * after that demotion has already happened, so the h1 survives.
 *
 * Source structure (migration-work/cleaned.html, lines ~313-343):
 *
 *   div.largeheadline                                   <- outer wrapper (replaced)
 *     div.c-largeheadline.page-section.container
 *       div.largeheadline.has-background.bg-white.left-to-right
 *         span.line1 > h2 > span.futura-bold > span > span.fontsize-2-5-vw
 *             "Thank you for your interest in our locator!"
 *         span.line2 > h2 > span.fontsize-1-5-vw
 *             "If you are a physician ... form below.<br><br>
 *              Once your form is submitted, ... via email.&nbsp;"
 *   div.sectionseparator > hr.c-section-separator      <- source divider (removed)
 *   div.cols > ... > div.marketoform                   <- form section (marketo-form parser)
 *     ... div#alert_4241.alert.alert-success           <- post-submit message (removed)
 *
 * Output: two sections
 *   [<h1>title</h1><p>sentence 1</p><p>sentence 2</p>]
 *   ---
 *   [marketo-form block]
 *
 * The marketo-form parser replaces only `.marketoform`, so the <hr> inserted
 * before its `.cols` ancestor in beforeTransform survives the parser pass.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const BR_SENTINEL = '\u0001';

/** Collapse &nbsp; and whitespace runs, then trim. */
function normalize(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split an element's text at <br> boundaries into normalised, non-empty pieces.
 * Works on a clone so the source DOM is untouched until the final replaceWith.
 */
function splitOnBreaks(el, doc) {
  if (!el) return [];
  const clone = el.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith(doc.createTextNode(BR_SENTINEL)));
  return clone.textContent
    .split(BR_SENTINEL)
    .map(normalize)
    .filter(Boolean);
}

export default function transform(hookName, element, payload) {
  if (!payload || !payload.template || payload.template.name !== 'doctor-request') return;

  const doc = element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    // Post-submit thank-you alert (inside .marketoform; parser drops it anyway).
    // Source divider — replaced by the single bare <hr> inserted below.
    WebImporter.DOMUtils.remove(element, ['.alert-success', '.sectionseparator']);

    // Form section = the `.cols` ancestor of `.marketoform`
    // (template selector `.cols:has(.marketoform)`; resolved via closest() so it
    // does not depend on :has() support in the importer's DOM).
    const form = element.querySelector('.marketoform');
    const formSection = form ? (form.closest('.cols') || form) : null;
    if (formSection) {
      const prev = formSection.previousElementSibling;
      if (!(prev && prev.tagName === 'HR')) formSection.before(doc.createElement('hr'));
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Outer wrapper is the first `.largeheadline` in document order.
    const wrapper = element.querySelector('.largeheadline');
    if (!wrapper) return;

    const line1 = wrapper.querySelector('.line1');
    const line2 = wrapper.querySelector('.line2');
    const title = normalize(line1 ? line1.textContent : '');
    const sentences = splitOnBreaks(line2, doc);

    const nodes = [];
    if (title) {
      const h1 = doc.createElement('h1');
      h1.textContent = title;
      nodes.push(h1);
    }
    sentences.forEach((sentence) => {
      const p = doc.createElement('p');
      p.textContent = sentence;
      nodes.push(p);
    });

    if (nodes.length) wrapper.replaceWith(...nodes);
    else wrapper.remove();
  }
}
