import { readBlockConfig, loadScript } from '../../scripts/aem.js';

/**
 * Marketo form block. Mounts a Marketo Forms 2.0 form (via forms2.min.js +
 * MktoForms2.loadForm) and optionally an Altcha captcha. Third-party scripts are
 * held back until the block approaches the viewport, so they stay off the
 * critical path.
 *
 * Authoring model (key/value rows; captcha rows optional):
 *   | Marketo Form         |                                              |
 *   | Base URL             | //lp.stryker.com                             |
 *   | Munchkin ID          | 338-WAP-571                                  |
 *   | Form ID              | 4893                                         |
 *   | Captcha Script       | https://patients.stryker.com/.../altcha.js   |
 *   | Captcha Challenge URL| https://patients.stryker.com/bin/.../challenge |
 *
 * @param {Element} block the marketo-form block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  const baseUrl = config['base-url'] || config.baseurl || '';
  const munchkinId = config['munchkin-id'] || config.munchkinid || '';
  const formId = config['form-id'] || config.formid || '';
  const captchaScript = config['captcha-script'] || '';
  const captchaChallengeUrl = config['captcha-challenge-url'] || '';

  block.textContent = '';

  if (!baseUrl || !munchkinId || !formId) {
    // eslint-disable-next-line no-console
    console.warn('marketo-form: missing base-url, munchkin-id or form-id', config);
    return;
  }

  // Marketo replaces this element (matched by id) with the rendered form.
  const form = document.createElement('form');
  form.id = `mktoForm_${formId}`;
  block.append(form);

  // The form's scripts load late (see below), so reserve its height until it
  // renders — otherwise it grows under the reader, e.g. right after an anchor
  // jump to the form. Dropped once Marketo reports the form ready (or fails).
  block.classList.add('is-loading');
  const doneLoading = () => block.classList.remove('is-loading');

  const addCaptcha = (mktoForm) => {
    if (!captchaScript || !captchaChallengeUrl) return;
    const formEl = mktoForm.getFormElem ? mktoForm.getFormElem()[0] : form;
    const buttonRow = formEl.querySelector('.mktoButtonRow') || formEl;
    if (formEl.querySelector('altcha-widget')) return;
    loadScript(captchaScript, { type: 'module' })
      .then(() => {
        const widget = document.createElement('altcha-widget');
        widget.setAttribute('challengeurl', captchaChallengeUrl);
        widget.setAttribute('auto', 'onload');
        widget.setAttribute('hidelogo', '');
        widget.setAttribute('hidefooter', '');
        buttonRow.prepend(widget);
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('marketo-form: failed to load altcha.js', e));
  };

  const loadForm = () => {
    loadScript(`${baseUrl}/js/forms2/js/forms2.min.js`)
      .then(() => {
        if (!window.MktoForms2) {
          doneLoading();
          return;
        }
        window.MktoForms2.loadForm(baseUrl, munchkinId, Number(formId));
        window.MktoForms2.whenReady((mktoForm) => {
          if (mktoForm.getId() !== Number(formId)) return;
          doneLoading();
          addCaptcha(mktoForm);
        });
      })
      .catch((e) => {
        doneLoading();
        // eslint-disable-next-line no-console
        console.error('marketo-form: failed to load forms2.min.js', e);
      });
  };

  // forms2.min.js is ~10s of main-thread work on a mid-tier phone, and the form
  // is typically well below the fold — hold it until the block is actually
  // approaching the viewport so it never competes with LCP. Falls back to the
  // previous idle-callback behaviour where IntersectionObserver is unavailable.
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadForm();
    }, { rootMargin: '400px' });
    observer.observe(block);
  } else if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadForm, { timeout: 3000 });
  } else {
    window.setTimeout(loadForm, 3000);
  }
}
