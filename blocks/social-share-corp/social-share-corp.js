/*
 * social-share-corp: the www.stryker.com share row. Authored as one icon per row
 * (`:facebook:`, `:linkedin:`, `:email:`, `:copy-link:`), in the order to show; rows with
 * another icon are skipped. Links are built from the page's own URL and title.
 * Variants: `gray` (all icons gray), `right` (right-aligned).
 */
import { decorateIcons, getMetadata } from '../../scripts/aem.js';

const TOOLTIP_MS = 1500;

const SHARE_LINKS = {
  facebook: {
    label: 'Share on Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    newTab: true,
  },
  linkedin: {
    label: 'Share on LinkedIn',
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    newTab: true,
  },
  email: {
    label: 'Share via email',
    href: (url, title) => `mailto:?subject=${title}&body=${url}`,
    newTab: false,
  },
};

function pageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (canonical) return canonical;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

function iconName(icon) {
  return [...icon.classList].find((c) => c.startsWith('icon-'))?.substring(5);
}

function shareItem(name, label, control, icon) {
  const li = document.createElement('li');
  li.className = `social-share-corp-${name}`;
  control.className = 'social-share-corp-icon';
  control.setAttribute('aria-label', label);
  control.title = label;
  control.append(icon);
  li.append(control);
  return li;
}

function shareLink(name, icon, url, title) {
  const { label, href, newTab } = SHARE_LINKS[name];
  const a = document.createElement('a');
  a.href = href(encodeURIComponent(url), encodeURIComponent(title));
  if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return shareItem(name, label, a, icon);
}

function copyItem(icon, url) {
  const button = document.createElement('button');
  button.type = 'button';
  const li = shareItem('copy-link', 'Copy page link', button, icon);
  const tooltip = document.createElement('span');
  tooltip.className = 'social-share-corp-tooltip';
  tooltip.setAttribute('role', 'status');
  li.append(tooltip);
  let timer;
  button.addEventListener('click', async () => {
    let message = 'Copied to clipboard!';
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      message = 'Couldn\'t copy the link';
    }
    tooltip.textContent = message;
    tooltip.classList.add('visible');
    clearTimeout(timer);
    timer = setTimeout(() => tooltip.classList.remove('visible'), TOOLTIP_MS);
  });
  return li;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const url = pageUrl();
  const title = getMetadata('og:title') || document.title;

  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const icon = row.querySelector('span.icon');
    const name = icon && iconName(icon);
    if (name === 'copy-link') list.append(copyItem(icon, url));
    else if (SHARE_LINKS[name]) list.append(shareLink(name, icon, url, title));
  });
  decorateIcons(list);
  block.replaceChildren(...(list.children.length ? [list] : []));
}
