/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: zip-doctor-request content + section break.
 *
 * Template-scoped: acts ONLY on the `zip-doctor-request` SINGLETON template
 * (https://patients.stryker.com/us/en/zip-skin-closure/index/doctor-request.html),
 * guarded by payload.template.name. Inert for every other template.
 *
 * Registered AFTER the shared patients-stryker-cleanup.js, which runs its
 * legal-page branch for this template (chrome removal, .c-disclaimer "Last
 * Updated" removal, afterTransform h1->h2 demotion). The page <h1> is therefore
 * created here in afterTransform, after that demotion has already happened.
 *
 * Source structure (migration-work/cleaned.html):
 *
 *   div.largeheadline                                    <- outer wrapper (replaced)
 *     div.c-largeheadline.page-section.container
 *       div.largeheadline.has-background.bg-white.left-to-right
 *         span.line1 > h2 > span.futura-bold > span[style="color: rgb(255,181,0)"]
 *             "Thank you for your interest in our locator!"
 *         span.line2   (plain text, not a heading)
 *             "If you are a physician ... form below.<br><br>
 *              Once your form is submitted, <b>we will be in touch ... email.&nbsp;</b>"
 *   div.sectionseparator > hr.c-section-separator       <- source divider (removed)
 *   div.cols > ... > div.marketoform                    <- form section (marketo-form parser)
 *     ... div#alert_4380.alert.alert-success            <- post-submit message (removed)
 *
 * Output: two sections
 *   [<h1>title</h1><p>sentence 1</p><p>sentence 2 <strong>bold run</strong></p>]
 *   ---
 *   [marketo-form block][Section Metadata: style = divider]
 *
 * Unlike the IVS doctor-request page, the Zip subhead carries inline bold, so
 * the paragraphs are rebuilt from the source nodes (b -> strong) rather than
 * from plain text.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/** Collapse &nbsp; and whitespace runs, then trim. */
function normalize(text) {
  return String(text || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Copy a source inline node into `doc`, keeping only text and bold/italic
 * emphasis (b/strong -> strong, i/em -> em). Other wrappers are unwrapped.
 */
function copyInline(node, doc) {
  if (node.nodeType === 3) {
    return [doc.createTextNode(node.textContent.replace(/ /g, ' ').replace(/\s+/g, ' '))];
  }
  if (node.nodeType !== 1) return [];
  const children = [...node.childNodes].flatMap((child) => copyInline(child, doc));
  const tag = node.tagName;
  let wrapper = null;
  if (tag === 'B' || tag === 'STRONG') wrapper = doc.createElement('strong');
  else if (tag === 'I' || tag === 'EM') wrapper = doc.createElement('em');
  if (!wrapper) return children;
  wrapper.append(...children);
  return [wrapper];
}

/** Trim leading/trailing whitespace inside a built paragraph (incl. nested emphasis). */
function trimParagraph(p) {
  const edgeText = (fromEnd) => {
    let node = p;
    while (node && node.nodeType === 1) node = fromEnd ? node.lastChild : node.firstChild;
    return node;
  };
  const first = edgeText(false);
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = edgeText(true);
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
}

/**
 * Split an element's children at <br> runs into paragraphs, preserving inline
 * emphasis. Empty segments (e.g. between the two <br>s) are skipped.
 */
function paragraphsFrom(el, doc) {
  if (!el) return [];
  const segments = [[]];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'BR') segments.push([]);
    else segments[segments.length - 1].push(node);
  });
  return segments
    .map((nodes) => {
      const p = doc.createElement('p');
      nodes.forEach((node) => p.append(...copyInline(node, doc)));
      trimParagraph(p);
      return p;
    })
    .filter((p) => normalize(p.textContent));
}

export default function transform(hookName, element, payload) {
  if (!payload || !payload.template || payload.template.name !== 'zip-doctor-request') return;

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
    const title = normalize(line1 ? line1.textContent : '');
    const paragraphs = paragraphsFrom(wrapper.querySelector('.line2'), doc);

    const nodes = [];
    if (title) {
      const h1 = doc.createElement('h1');
      h1.textContent = title;
      nodes.push(h1);
    }
    nodes.push(...paragraphs);

    if (nodes.length) wrapper.replaceWith(...nodes);
    else wrapper.remove();

    // The form section opens with the source's full-width grey rule — the
    // project's shared `divider` section style. The form is the last section
    // at this point (the import script appends the metadata section after
    // afterTransform), so its Section Metadata goes at the end of main.
    element.append(WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style: 'divider' },
    }));
  }
}
