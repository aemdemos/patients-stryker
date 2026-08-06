export default function decorate(block) {
  // info-callout — the source "dimensional-box": a white, soft-shadowed box
  // holding a Futura-bold title and body copy, with an optional "LEARN MORE"
  // call-to-action rendered as a gold button below and OUTSIDE the box.

  // In UE, keep the authored structure intact so child component identity persists.
  if (window.location.hostname.includes('.ue.da.live')) {
    block.classList.add('info-callout-authoring');
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
    [...li.children].forEach((div) => { div.className = 'info-callout-body'; });

    // Lift a trailing link-only paragraph out of the box so it sits below as a
    // standalone gold button (reuses the global a.button.accent styling).
    const body = li.querySelector('.info-callout-body');
    if (body) {
      const ctaP = [...body.querySelectorAll(':scope > p')].reverse().find((p) => {
        const a = p.querySelector('a');
        return a && p.textContent.trim() === a.textContent.trim();
      });
      if (ctaP) {
        const a = ctaP.querySelector('a');
        a.className = 'button accent';
        const cta = document.createElement('div');
        cta.className = 'info-callout-cta';
        cta.append(a);
        ctaP.remove();
        li.append(cta);
      }
    }

    ul.append(li);
  });
  block.replaceChildren(ul);
}
