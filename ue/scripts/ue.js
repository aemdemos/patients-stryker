/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { moveInstrumentation } from './ue-utils.js';
import { getMetadata, toClassName } from '../../scripts/aem.js';

/*
 * Universal Editor only: keep the body theme/template classes in sync when an
 * author edits page metadata. decorateTemplateAndTheme() (aem.js) applies these
 * classes ONCE at initial page load; when an author changes the Theme (or
 * Template) dropdown, UE patches the metadata in place without re-running page
 * decoration, so the body class would otherwise stay stale (the newly selected
 * theme never gets added, and a deselected one never gets removed). We watch the
 * document for metadata changes and reconcile `body.<theme>` / `body.<template>`
 * against the current metadata value. Runs only in UE (this file is imported
 * solely on *.ue.da.live), so there is no live-site cost.
 */
const syncBodyMetaClasses = () => {
  // track the classes we last applied per metadata key, so a change from one
  // value to another (or to None) removes the previous class before adding the new.
  const applied = { theme: [], template: [] };

  const reconcile = () => {
    Object.keys(applied).forEach((name) => {
      const value = getMetadata(name);
      const classes = value
        .split(',')
        .map((c) => toClassName(c.trim()))
        .filter((c) => c);
      applied[name]
        .filter((c) => !classes.includes(c))
        .forEach((c) => document.body.classList.remove(c));
      classes.forEach((c) => document.body.classList.add(c));
      applied[name] = classes;
    });
  };

  reconcile();

  // UE writes metadata edits to the <meta> tags in <head>; observe those so the
  // body class updates the moment the dropdown value changes.
  const observer = new MutationObserver(reconcile);
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['content', 'name'],
  });

  // also reconcile on UE's own content events, covering patch flows that don't
  // mutate the <head> meta tags directly.
  ['aue:content-patch', 'aue:content-update'].forEach((evt) => {
    document.body.addEventListener(evt, reconcile);
  });
};

const setupObservers = () => {
  const mutatingBlocks = document.querySelectorAll('div.cards, div.columns, div.accordion, div.statistics, div.panel, div.icon-list');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target.tagName === 'DIV') {
        const addedElements = mutation.addedNodes;
        const type = mutation.target.classList.contains('cards-card-image')
          ? 'cards-image'
          : mutation.target.attributes['data-aue-component']?.value;

        switch (type) {
          case 'cards':
          case 'accordion':
          case 'statistics':
          case 'panel':
          case 'icon-list':
            if (addedElements.length === 1 && addedElements[0].tagName === 'UL') {
              const ulEl = addedElements[0];
              const removedDivEl = [...mutation.removedNodes].filter((node) => node.tagName === 'DIV');
              removedDivEl.forEach((div, index) => {
                if (index < ulEl.children.length) {
                  moveInstrumentation(div, ulEl.children[index]);
                }
              });
            }
            break;
          case 'cards-image':
            if (mutation.target.classList.contains('cards-card-image')) {
              const addedPictureEl = [...mutation.addedNodes].filter((node) => node.tagName === 'PICTURE');
              const removedPictureEl = [...mutation.removedNodes].filter((node) => node.tagName === 'PICTURE');
              if (addedPictureEl.length === 1 && removedPictureEl.length === 1) {
                const oldImgEl = removedPictureEl[0].querySelector('img');
                const newImgEl = addedPictureEl[0].querySelector('img');
                if (oldImgEl && newImgEl) {
                  moveInstrumentation(oldImgEl, newImgEl);
                }
              }
            }
            break;
          default:
            break;
        }
      }
    });
  });

  mutatingBlocks.forEach((block) => {
    observer.observe(block, { childList: true, subtree: true });
  });
};

const setupUEEventHandlers = () => {
  document.body.addEventListener('aue:content-patch', ({ detail: { patch, request } }) => {
    let element = document.querySelector(`[data-aue-resource="${request.target.resource}"]`);
    if (element && element.getAttribute('data-aue-prop') !== patch.name) {
      element = element.querySelector(`[data-aue-prop='${patch.name}']`);
    }
    if (element?.getAttribute('data-aue-type') !== 'media') return;

    const picture = element.tagName === 'IMG' ? element.closest('picture') : element;
    picture?.querySelectorAll('source').forEach((source) => source.remove());
    picture?.querySelector('img')?.removeAttribute('srcset');
  });
};

export default () => {
  setupObservers();
  setupUEEventHandlers();
  syncBodyMetaClasses();
};
