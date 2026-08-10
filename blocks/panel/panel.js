/**
 * cta variant: lift the trailing link-only <p> out of the box (`body`) and into
 * a sibling `.panel-cta` under `container`, so it renders below the box. The <p>
 * (and its anchor) is moved intact — DON'T set button classes here; the global
 * decorateButtons() styles it from the authored formatting (bold+italic → gold
 * .button.accent). Styling lives entirely in styles.css.
 * @param {Element} body the .panel-body holding the content
 * @param {Element} container the element the .panel-cta should be appended to
 */
function liftCta(body, container) {
  if (!body) return;
  const ctaP = [...body.querySelectorAll(':scope > p')].reverse().find((p) => {
    const a = p.querySelector('a');
    return a && p.textContent.trim() === a.textContent.trim();
  });
  if (!ctaP) return;
  const cta = document.createElement('div');
  cta.className = 'panel-cta';
  cta.append(ctaP);
  container.append(cta);
}

export default function decorate(block) {
  // panel — the source "dimensional-box": a white, soft-shadowed box holding
  // centered heading + body copy. The `cta` variant is left-aligned and lifts a
  // trailing link-only paragraph into a gold "LEARN MORE" button below the box.
  const isCta = block.classList.contains('cta');

  // In UE, keep the authored structure intact (no ul/li transform) so child
  // component identity persists — but still tag each content cell with
  // .panel-body so the block's styling (which is all scoped to .panel-body)
  // applies in the editor exactly as it does live, and still lift the cta link
  // so it renders as the gold button rather than gold text inside the box.
  if (window.location.hostname.includes('.ue.da.live')) {
    block.classList.add('panel-authoring');
    [...block.children].forEach((row) => {
      [...row.children].forEach((cell) => { cell.classList.add('panel-body'); });
      if (isCta) liftCta(row.querySelector('.panel-body'), row);
    });
    return;
  }

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    // drop empty cells (e.g. a blank leading cell from a 2-column authored table)
    [...li.children].forEach((div) => {
      if (!div.textContent.trim() && !div.querySelector('picture, img')) div.remove();
    });
    [...li.children].forEach((div) => { div.className = 'panel-body'; });

    if (isCta) liftCta(li.querySelector('.panel-body'), li);

    ul.append(li);
  });
  block.replaceChildren(ul);
}
