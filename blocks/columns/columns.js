// True only inside the Universal Editor (served from *.ue.da.live). Instrumentation
// is added exclusively in this context and has zero effect on the live site.
const isUE = () => window.location.hostname.includes('.ue.da.live');

/**
 * Add the UE field instrumentation for a single column cell's DM image + text.
 *
 * By the time this block decorates, dm-support.js (which runs earlier in
 * decorateMain) has already replaced any authored DM <a> with a <picture>. So a
 * populated cell exposes a <picture>/<img>, not an anchor; an empty cell exposes
 * neither. We instrument whatever is present:
 *   - image / imageAlt -> the <img> (or a placeholder <a> when the cell is empty)
 *   - text             -> the second paragraph
 *
 * @param {Element} col the column cell element
 */
function instrumentCell(col) {
  const paragraphs = [...col.querySelectorAll(':scope > p')];
  const firstP = paragraphs[0];
  const picture = col.querySelector('picture');
  const img = picture?.querySelector('img');

  // A single element can carry only ONE data-aue-prop, but we have two image
  // fields (image = the DM URL, imageAlt = the alt text). When a <picture> is
  // present we split them across two distinct nodes: image on the <picture>,
  // imageAlt on its <img>. In an empty cell we can only place a single
  // placeholder anchor, so it carries the image prop (there is no second node
  // to host imageAlt until an image exists).
  if (picture && img) {
    picture.setAttribute('data-aue-prop', 'image');
    picture.setAttribute('data-aue-type', 'text');
    img.setAttribute('data-aue-prop', 'imageAlt');
    img.setAttribute('data-aue-type', 'text');
  } else if (!firstP || firstP.textContent.trim() === '') {
    // empty cell — give UE a placeholder anchor to write the DM link into
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', '');
    a.setAttribute('data-aue-prop', 'image');
    a.setAttribute('data-aue-type', 'text');
    p.append(a);
    col.prepend(p);
  }

  // text -> the paragraph after the image paragraph
  const textP = paragraphs.find((p) => p !== firstP) || paragraphs[1];
  if (textP) {
    textP.setAttribute('data-aue-prop', 'text');
    textP.setAttribute('data-aue-type', 'richtext');
  }
}

/**
 * loads and decorates the columns block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('p') || pic.parentElement;
        if (picWrapper && picWrapper.children.length === 1 && picWrapper.textContent.trim() === '') {
          // picture is the only content of its own wrapper (a <p> or a <div>),
          // whether or not that wrapper has heading/text siblings elsewhere in the column
          picWrapper.classList.add('columns-img-col');
        }
      }

      if (isUE()) instrumentCell(col);
    });
  });
}
