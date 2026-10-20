/*
 * social-share-corp: the www.stryker.com share row (Facebook, LinkedIn, email, copy link).
 * Authored as an empty block; the links are built from the page's own URL and title, so
 * nothing per page is authored. Variants: `gray` (all icons gray), `right` (right-aligned).
 */
import { getMetadata } from '../../scripts/aem.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TOOLTIP_MS = 1500;

/* icon artwork from the live site: a currentColor rounded square plus these paths */
const ICON_PATHS = {
  facebook: [
    { d: 'M26 15C26 8.92486 21.0751 4 15 4C8.92486 4 4 8.92486 4 15C4 20.4903 8.02252 25.0412 13.2812 25.8664V18.1797H10.4883V15H13.2812V12.5766C13.2812 9.81969 14.9235 8.29688 17.4361 8.29688C18.6392 8.29688 19.8984 8.51172 19.8984 8.51172V11.2188H18.5114C17.145 11.2188 16.7188 12.0667 16.7188 12.9375V15H19.7695L19.2818 18.1797H16.7188V25.8664C21.9775 25.0412 26 20.4903 26 15Z', fill: 'white' },
  ],
  linkedin: [
    { d: 'M10.6321 22.307V11.9788H7.20217V22.307H10.6324H10.6321ZM8.91783 10.5689C10.1137 10.5689 10.8581 9.7758 10.8581 8.78467C10.8357 7.77095 10.1137 7 8.94057 7C7.76668 7 7 7.77095 7 8.78458C7 9.77571 7.74421 10.5688 8.89536 10.5688H8.91756L8.91783 10.5689ZM12.5305 22.307H15.9602V16.5399C15.9602 16.2316 15.9826 15.9225 16.0732 15.7023C16.321 15.0853 16.8853 14.4467 17.8331 14.4467C19.0738 14.4467 19.5705 15.3937 19.5705 16.7823V22.307H23V16.3851C23 13.2129 21.3082 11.7366 19.0516 11.7366C17.2016 11.7366 16.389 12.7716 15.9376 13.4765H15.9604V11.9791H12.5307C12.5755 12.948 12.5305 22.3073 12.5305 22.3073L12.5305 22.307Z', fill: 'white' },
  ],
  email: [
    { d: 'M23.8803 10.7654L23.9242 10.7792C24.0492 10.9821 23.9813 12.4425 23.9813 12.7426L23.9824 18.432C23.9833 19.2037 24.0089 19.6495 23.8803 20.4061C23.5668 20.1362 23.3028 19.8229 23.0125 19.5297C22.4429 18.9547 21.8562 18.3571 21.2799 17.7913C20.365 16.9063 19.3809 15.9058 18.5039 14.9753C18.8794 14.6477 19.2937 14.3604 19.6855 14.0524L23.1948 11.3C23.4201 11.122 23.6386 10.9202 23.8803 10.7654Z', fill: 'white' },
    { d: 'M6.01839 10.6475C6.40129 10.9108 6.75625 11.2054 7.12511 11.4871L10.7237 14.307C10.9979 14.5216 11.2952 14.7265 11.5391 14.9753C10.6205 15.7708 9.70867 16.8276 8.81258 17.6872L6.13817 20.406C5.93167 19.8345 6.01773 19.1514 6.01806 18.5563L6.01839 10.6475Z', fill: 'white' },
    { d: 'M17.754 15.5708C17.9103 15.6048 18.817 16.6128 18.9813 16.7781L23.0033 20.8344C23.0925 20.9261 23.2127 21.1228 23.3488 21.1259L23.3494 21.1398C22.8504 21.8633 21.6509 21.7992 20.8966 21.7985L10.9338 21.7985L8.98979 21.7992C8.13208 21.7996 7.24629 21.8903 6.60742 21.181C6.87743 20.8994 7.16488 20.6315 7.44335 20.3582L9.45948 18.3128C10.3532 17.412 11.3148 16.4277 12.2506 15.5708C12.8788 16.0336 13.4707 16.6563 14.2537 16.8382C15.9949 17.2426 16.5553 16.2997 17.7315 15.5843L17.754 15.5708Z', fill: 'white' },
    { d: 'M8.05751 9.0186C9.07975 9.00758 10.1032 9.0186 11.1257 9.01866L20.34 9.01853C21.5691 9.01768 22.5689 8.80147 23.4536 9.86829L20.0021 12.5717C19.7266 12.7871 19.463 13.0162 19.1844 13.2281C18.5528 13.8278 17.444 14.6256 16.7302 15.1658C15.975 15.7373 15.1539 16.2532 14.1603 15.7864C13.8636 15.6471 13.6164 15.4194 13.3611 15.2182L12.2537 14.3354L7.32484 10.512C7.04886 10.2936 6.77676 10.0628 6.4834 9.86829C6.86473 9.32868 7.40585 9.08308 8.05751 9.0186Z', fill: 'white' },
  ],
  copy: [
    { d: 'M16.7894 13.4106C16.1143 12.7357 15.1988 12.3565 14.2442 12.3565C13.2896 12.3565 12.3741 12.7357 11.699 13.4106L8.09904 17.0106C7.7552 17.3427 7.48094 17.7399 7.29227 18.1791C7.1036 18.6183 7.00429 19.0907 7.00014 19.5687C6.99598 20.0467 7.08707 20.5208 7.26808 20.9632C7.44909 21.4056 7.7164 21.8076 8.05442 22.1456C8.39243 22.4836 8.79438 22.7509 9.2368 22.9319C9.67923 23.1129 10.1533 23.204 10.6313 23.1999C11.1093 23.1957 11.5817 23.0964 12.0209 22.9077C12.4601 22.7191 12.8573 22.4448 13.1894 22.101L14.1812 21.1101M13.499 16.701C14.1741 17.3759 15.0896 17.755 16.0442 17.755C16.9988 17.755 17.9143 17.3759 18.5894 16.701L22.1894 13.101C22.8452 12.422 23.2081 11.5126 23.1999 10.5687C23.1917 9.62481 22.8131 8.72188 22.1456 8.05442C21.4781 7.38695 20.5752 7.00834 19.6313 7.00014C18.6874 6.99193 17.778 7.35479 17.099 8.01056L16.109 9.00056', fill: 'currentColor' },
    {
      d: 'M16.7894 13.4106C16.1143 12.7357 15.1988 12.3565 14.2442 12.3565C13.2896 12.3565 12.3741 12.7357 11.699 13.4106L8.09904 17.0106C7.7552 17.3427 7.48094 17.7399 7.29227 18.1791C7.1036 18.6183 7.00429 19.0907 7.00014 19.5687C6.99598 20.0467 7.08707 20.5208 7.26808 20.9632C7.44909 21.4056 7.7164 21.8076 8.05442 22.1456C8.39243 22.4836 8.79438 22.7509 9.2368 22.9319C9.67923 23.1129 10.1533 23.204 10.6313 23.1999C11.1093 23.1957 11.5817 23.0964 12.0209 22.9077C12.4601 22.7191 12.8573 22.4448 13.1894 22.101L14.1812 21.1101M13.499 16.701C14.1741 17.3759 15.0896 17.755 16.0442 17.755C16.9988 17.755 17.9143 17.3759 18.5894 16.701L22.1894 13.101C22.8452 12.422 23.2081 11.5126 23.1999 10.5687C23.1917 9.62481 22.8131 8.72188 22.1456 8.05442C21.4781 7.38695 20.5752 7.00834 19.6313 7.00014C18.6874 6.99193 17.778 7.35479 17.099 8.01056L16.109 9.00056', stroke: 'white', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    },
  ],
};

function buildIcon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 30 30');
  // as on the source: paths without their own fill (the copy-link outline) stay unfilled
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', '30');
  rect.setAttribute('height', '30');
  rect.setAttribute('rx', '5');
  rect.setAttribute('fill', 'currentColor');
  svg.append(rect);
  ICON_PATHS[name].forEach((attrs) => {
    const path = document.createElementNS(SVG_NS, 'path');
    Object.entries(attrs).forEach(([key, value]) => path.setAttribute(key, value));
    svg.append(path);
  });
  return svg;
}

function pageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (canonical) return canonical;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

function shareItem(name, label, control) {
  const li = document.createElement('li');
  li.className = `social-share-corp-${name}`;
  control.className = 'social-share-corp-icon';
  control.setAttribute('aria-label', label);
  control.title = label;
  control.append(buildIcon(name));
  li.append(control);
  return li;
}

function shareLink(name, label, href, newTab) {
  const a = document.createElement('a');
  a.href = href;
  if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return shareItem(name, label, a);
}

function copyItem(url) {
  const button = document.createElement('button');
  button.type = 'button';
  const li = shareItem('copy', 'Copy page link', button);
  const tooltip = document.createElement('span');
  tooltip.className = 'social-share-corp-tooltip';
  tooltip.setAttribute('role', 'status');
  li.append(tooltip);
  let timer;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    tooltip.textContent = 'Copied to clipboard!';
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
  const encodedUrl = encodeURIComponent(url);

  const list = document.createElement('ul');
  list.append(
    shareLink('facebook', 'Share on Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, true),
    shareLink('linkedin', 'Share on LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, true),
    shareLink('email', 'Share via email', `mailto:?subject=${encodeURIComponent(title)}&body=${encodedUrl}`, false),
    copyItem(url),
  );
  block.replaceChildren(list);
}
