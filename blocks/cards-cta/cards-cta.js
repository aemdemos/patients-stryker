export default function decorate(block) {
  // Each card is a shadowed text box (title + body) with a "LEARN MORE"
  // call-to-action button rendered below and OUTSIDE the box. No images.
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => { div.className = 'cards-cta-body'; });

    // Lift the CTA (a paragraph whose only content is a link) out of the
    // body box so it sits below the card as a standalone gold button.
    const body = li.querySelector('.cards-cta-body');
    if (body) {
      const ctaP = [...body.querySelectorAll(':scope > p')].reverse().find((p) => {
        const a = p.querySelector('a');
        return a && p.textContent.trim() === a.textContent.trim();
      });
      if (ctaP) {
        // reuse the global gold button styling (a.button.accent from styles.css)
        const a = ctaP.querySelector('a');
        a.className = 'button accent';
        const cta = document.createElement('div');
        cta.className = 'cards-cta-action';
        cta.append(a);
        ctaP.remove();
        li.append(cta);
      }
    }

    ul.append(li);
  });
  block.replaceChildren(ul);
}
