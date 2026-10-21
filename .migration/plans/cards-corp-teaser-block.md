# Cards Corp (teaser) block plan

New `cards-corp` block for stryker.com pages, with one `teaser` variant. It recreates the **Related Products** cards on the source RISE page: an image, a light serif H3, body text and a "LEARN MORE ▸" link.

> **I still can't build it. The session is in planning mode, and that blocks me from creating files, whatever the message says.** Please switch the mode from **Plan** to **Execute** in the chat, then send "build it" again. The code is fully drafted below. Once you switch, I'll save it, check it in the preview and run the linter straight away. You can also copy the two files yourself if you'd rather.

## Decisions

| Topic | Decision |
|---|---|
| Block name | `cards-corp`, variant `teaser`. Authors use **Cards Corp (teaser)**. |
| Linked H3 | The link stays clickable, as on the source, but looks like a normal H3: black Egyptienne Light, no underline, no colour change on hover or focus. |
| "Learn more" | Authors write it as **bold + underline**, following the site's existing convention. The site code already turns that into an uppercase Futura link with a ▸ arrow. The block only adds the teal colour and puts it on its own line. |
| Image link | The image links to the card's last link: "Learn more", or the H3 link if there is no "Learn more". This matches the source. Screen readers and keyboard tabbing skip the image link, so each card is announced and tabbed to only once. |
| Plugin | modern-web-guidance stays off. |

## What I measured on the source page

| Element | Source value | Site token to use |
|---|---|---|
| Grid | One per row, four per row from 841px. 30px between columns, 20px between rows | 4 per row from **600px**. Gaps use `--space-block-l` and `2 × --container-gutter` |
| Image | Full card width, about 426×254 | `width: 100%` |
| H3 | Egyptienne for Stryker Light, 21px, weight 500, line-height 1.06, black, 13px above / 15px below | `--heading-font-family`, `--heading-font-size-l`, `--font-weight-medium`, `--heading-line-height`, `--text-color`, `--space-block` |
| H3 link | Black, never underlined | `color: inherit`, `text-decoration: none` |
| Text | Humanist 712 for Stryker, 14px, line-height 1.375, 15px below | `--body-font-family`, `--body-font-size-m`, `--paragraph-line-height`, `--space-block` |
| "Learn more" | Futura bold, 14px, uppercase, teal `#4c7d7a`, on its own line, ▸ arrow | The site's existing bold + underline link style, plus `--color-primary` and `display: block` |

## What authors enter

| Cards Corp (teaser) | |
|---|---|
| image | `### [Advanced Digital Healthcare](/link)` (the link is optional)<br>Description paragraph<br>**<u>[Learn more](/link)</u>** |

There is one row per card: an image cell, then a text cell.

## Draft code (ready to save)

### `blocks/cards-corp/cards-corp.js`

```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';

/**
 * Cards Corp: one row per card — an image cell and a body cell (H3, text, CTA).
 * The image links to the card's last link ("Learn more", else the H3 link), like the
 * source Related Products teasers.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // convert DM links to <picture>; the canvas re-renders fields from source, so re-run here
  decorateDMAssets(block);

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = div.children.length === 1 && div.querySelector('picture')
        ? 'cards-corp-card-image'
        : 'cards-corp-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  ul.querySelectorAll('li').forEach((li) => {
    const cell = li.querySelector('.cards-corp-card-image');
    const picture = cell?.querySelector('picture');
    if (!picture) return;
    let link = picture.closest('a');
    const cta = [...li.querySelectorAll('.cards-corp-card-body a[href]')].pop();
    if (!link && cta) {
      // duplicate of the card's CTA: keep it out of the tab order and the a11y tree
      link = document.createElement('a');
      link.href = cta.getAttribute('href');
      link.tabIndex = -1;
      link.setAttribute('aria-hidden', 'true');
      picture.replaceWith(link);
      link.append(picture);
    }
    // lift the image out of the editor wrapper so the canvas can't re-render over it
    cell.replaceChildren(link || picture);
  });

  block.replaceChildren(ul);
}
```

### `blocks/cards-corp/cards-corp.css`

```css
/* cards-corp — stryker.com card grid. Source .item.col-sm-3: 1-up, 4-up from 841px (EDS 600px). */

.cards-corp > ul {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-block-l) calc(2 * var(--container-gutter));
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (width >= 600px) {
  .cards-corp > ul {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.cards-corp .cards-corp-card-image {
  line-height: 0;
}

.cards-corp .cards-corp-card-image img {
  width: 100%;
  height: auto;
}

/* teaser: Related Products — light serif title, Humanist copy, teal "Learn more" */
.cards-corp.teaser .cards-corp-card-body {
  color: var(--text-color);
}

/* 21px at every width (corp h3 is 17.5px on phones) */
.cards-corp.teaser .cards-corp-card-body h3 {
  margin: var(--space-block) 0;
  color: var(--text-color);
  font-family: var(--heading-font-family);
  font-size: var(--heading-font-size-l);
  font-weight: var(--font-weight-medium);
  line-height: var(--heading-line-height);
}

/* a linked title still reads as a plain heading, hover and focus included */
.cards-corp.teaser .cards-corp-card-body h3 a:any-link {
  color: inherit;
  text-decoration: none;
}

.cards-corp.teaser .cards-corp-card-body p {
  margin: 0 0 var(--space-block);
  font-family: var(--body-font-family);
  font-size: var(--body-font-size-m);
  line-height: var(--paragraph-line-height);
}

/* "Learn more": bold + underline → a.link-strong (styles.css). The canvas keeps the
   authored strong > a > u markup, so style both. */
.cards-corp.teaser .cards-corp-card-body :is(a.link-strong, strong > a:has(u)):any-link {
  display: block;
  color: var(--color-primary);
  font-size: var(--body-font-size-m);
}

.cards-corp.teaser .cards-corp-card-body :is(a.link-strong, strong > a:has(u)):any-link:is(:hover, :focus-visible) {
  color: var(--color-primary-hover);
}
```

The editor rules will be finalised in the build step, after I check how the bold + underline link shows in the visual editor. No new tokens are needed.

## Checklist

- [ ] Save `blocks/cards-corp/cards-corp.js` (draft above) and show the diff.
- [ ] Save `blocks/cards-corp/cards-corp.css` (draft above) and show the diff.
- [ ] Make a temporary local test page (not committed) with the 8 Related Products cards, including linked and unlinked H3s, on a page with `site: corp`.
- [ ] Check the preview at phone, 600px, 900px and 1200px widths:
  - [ ] four cards per row from 600px
  - [ ] H3 is 21px black Egyptienne, with no underline or teal even when linked, including on hover
  - [ ] text is 14px Humanist
  - [ ] "Learn more" is uppercase teal Futura with ▸, on its own line
  - [ ] the image is clickable and goes to the "Learn more" page
- [ ] Compare against the source cards with one screenshot each, at the end.
- [ ] Run `npm run lint:fix`, then make sure `npm run lint` reports zero errors, with no `eslint-disable` comments added.
- [ ] Give you the table to author the DA page `/drafts/block/cards-corp`, which needs page metadata `site: corp`, then check it in the preview.
- [ ] Remind you to add the **Cards Corp (teaser)** Block Library entry: a row in the blocks sheet, and a block document with a sample, description and search tags such as `related products, teaser, learn more`.
- [ ] Commit and open a PR with a feature-preview link only when you ask.
