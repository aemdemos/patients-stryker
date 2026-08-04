import decorate from '../hero/hero.js';

export default function decorateHeroFullbleed(block) {
  block.classList.add('hero', 'fullbleed');
  decorate(block);
}
