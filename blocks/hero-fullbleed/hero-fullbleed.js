import decorate from '../hero/hero.js';

export default function decorateHeroFullbleed(block) {
  block.classList.add('fullbleed');
  decorate(block);
}
