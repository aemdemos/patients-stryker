export default function decorate(block) {
  // A hero with no image (e.g. the fullbleed variant used purely as a text
  // banner) flips to dark-on-light text via the `no-image` class.
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // Fullbleed variant: the source headline mixes two type treatments — the
  // opening sentence in the light serif heading font, the rest in Futura bold.
  // The authored h1 is a single text node, so split it at the first sentence
  // boundary and wrap the remainder in an accent span the CSS can style.
  if (block.classList.contains('fullbleed')) {
    const h1 = block.querySelector('h1');
    if (h1 && h1.childElementCount === 0) {
      const text = h1.textContent.trim();
      const match = text.match(/^(.*?[.!?])\s+(.+)$/s);
      if (match) {
        const [, lead, rest] = match;
        h1.textContent = `${lead} `;
        const accent = document.createElement('span');
        accent.className = 'hero-headline-accent';
        accent.textContent = rest;
        h1.append(accent);
      }
    }
  }
}
