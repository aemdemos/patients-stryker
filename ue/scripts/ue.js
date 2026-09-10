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
import { previewDMImageLinks } from '../../scripts/dm-support.js';

const setupObservers = () => {
  const mutatingBlocks = document.querySelectorAll('div.cards, div.columns, div.accordion, div.statistics, div.panel, div.icon-list');
  const observer = new MutationObserver((mutations) => {
    // UE re-renders container-block children from source on edit, re-inserting
    // the raw DM <a href> without a <picture>. Re-run the in-anchor image preview
    // so the freshly authored/edited link shows its image in the editor canvas
    // while the anchor (which UE binds the image/alt fields to) stays intact.
    // Idempotent — skips anchors already carrying a picture.
    if (mutations.some((m) => m.type === 'childList' && m.addedNodes.length)) {
      previewDMImageLinks(document.querySelector('main') || document.body);
    }
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
  // initial pass: on live/preview, decorateMain REPLACES DM anchors with pictures;
  // in the editor we keep the anchor and nest the picture inside it instead, so
  // container blocks (cards) show their image without losing UE's binding anchor.
  previewDMImageLinks(document.querySelector('main') || document.body);
  setupObservers();
  setupUEEventHandlers();
};
