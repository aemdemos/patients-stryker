export default function decorate(block) {
  // panel — the source "dimensional-box": a white, soft-shadowed box holding
  // centered heading + body copy. The `cta` variant is left-aligned and lifts a
  // trailing link-only paragraph into a gold "LEARN MORE" button below the box.
  const isCta = block.classList.contains('cta');

  // In UE, keep the authored structure intact (no ul/li transform) so child
  // component identity persists — but still tag each content cell with
  // .panel-body so the block's styling (which is all scoped to .panel-body)
  // applies in the editor exactly as it does live.
  if (window.location.hostname.includes('.ue.da.live')) {
    block.classList.add('panel-authoring');
    [...block.children].forEach((row) => {
      [...row.children].forEach((cell) => { cell.classList.add('panel-body'); });
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

    if (isCta) {
      // Lift a trailing link-only paragraph out of the box so it sits below it.
      // Move the whole <p> (keeping the anchor inside it) and DON'T set any
      // button classes here — the global decorateButtons() styles it based on
      // authored formatting: bold+italic → gold .button.accent, anything else →
      // default link. Styling lives entirely in styles.css.
      const body = li.querySelector('.panel-body');
      if (body) {
        const ctaP = [...body.querySelectorAll(':scope > p')].reverse().find((p) => {
          const a = p.querySelector('a');
          return a && p.textContent.trim() === a.textContent.trim();
        });
        if (ctaP) {
          const cta = document.createElement('div');
          cta.className = 'panel-cta';
          cta.append(ctaP);
          li.append(cta);
        }
      }
    }

    ul.append(li);
  });
  block.replaceChildren(ul);
}
