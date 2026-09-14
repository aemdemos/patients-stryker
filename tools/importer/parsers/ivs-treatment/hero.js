/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero. Base: hero. Variant class: banner.
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selector: .pDiv.bg-shadow
 * Generated: 2026-09-11
 *
 * Matches the already-migrated IVS treatment sibling
 * (content/us/en/ivs/treatments/disc-decompression.plain.html), whose hero is a
 * `hero banner`: a wide (~1920x640) desktop banner image with a distinct mobile
 * crop (~1200x680) and the H1 + gold "FIND A DOCTOR" CTA overlaid. We reproduce
 * that structure exactly.
 *
 * Authoring model (single-column rows, per blocks/hero/hero.js setupHero):
 *   | <desktop image> |
 *   | <mobile image>  |
 *   | <h1 + CTA link> |
 *
 * Source structure (.pDiv.bg-shadow):
 *   - ".imgBoxId picture" holds BOTH crops: a <source srcset> desktop DM url
 *     (mild-hero_1920x640) and the <img src> mobile DM url (mild-hero_1200x680).
 *     We split them into two separate <img> rows so the banner variant can toggle
 *     them at the 900px crossover (matching the sibling's two image rows).
 *   - ".largeheadline h1" is the title ("mild® procedure").
 *   - ".curatedcta a.btn-gold" is the CTA ("FIND A DOCTOR").
 *
 * Title + CTA are wrapped in <em><strong> so the global heading/button rules
 * render the gold Futura display treatment — the same encoding the sibling uses
 * (<h1><em><strong>…) and the convention decorateButtons() promotes to the gold
 * .button.accent.
 *
 * Images emitted as raw <img> (DM/Scene7 src); patients-stryker-dm-images.js
 * (afterTransform) rewrites them to media-assets anchors, and scripts/dm-support.js
 * renders them back to <picture> at load.
 */
export default function parse(element, { document }) {
  const picture = element.querySelector('.imgBoxId picture');
  const heading = element.querySelector('.largeheadline h1, h1');
  const ctaAnchor = element.querySelector('.curatedcta a[href]');

  const cells = [];

  // Desktop image: the <source srcset> DM url (wide 1920x640 crop).
  const source = picture && picture.querySelector('source[srcset]');
  const baseImg = picture && picture.querySelector('img');
  const desktopUrl = source ? source.getAttribute('srcset') : null;
  const alt = baseImg ? (baseImg.getAttribute('alt') || '') : '';

  if (desktopUrl) {
    const desktopImg = document.createElement('img');
    desktopImg.setAttribute('src', desktopUrl);
    desktopImg.setAttribute('alt', alt);
    cells.push([desktopImg]);
  }

  // Mobile image: the <img src> DM url (1200x680 crop), when distinct.
  if (baseImg) {
    const mobileUrl = baseImg.getAttribute('src');
    if (mobileUrl && mobileUrl !== desktopUrl) {
      const mobileImg = document.createElement('img');
      mobileImg.setAttribute('src', mobileUrl);
      mobileImg.setAttribute('alt', alt);
      cells.push([mobileImg]);
    } else if (!desktopUrl) {
      // Only one crop available — keep the authored img.
      cells.push([baseImg]);
    }
  }

  // Heading + CTA content cell. Gold Futura treatment via <em><strong> wrap.
  const contentCell = [];
  if (heading) {
    const text = heading.textContent.replace(/\s+/g, ' ').trim();
    const h1 = document.createElement('h1');
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    strong.textContent = text;
    em.append(strong);
    h1.append(em);
    contentCell.push(h1);
  }
  if (ctaAnchor && ctaAnchor.textContent.trim()) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.setAttribute('href', ctaAnchor.getAttribute('href'));
    a.textContent = ctaAnchor.textContent.replace(/\s+/g, ' ').trim();
    strong.append(a);
    em.append(strong);
    p.append(em);
    contentCell.push(p);
  }
  if (contentCell.length) cells.push([contentCell]);

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero',
    variants: ['banner'],
    cells,
  });
  element.replaceWith(block);
}
