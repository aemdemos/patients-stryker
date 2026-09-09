import { readBlockConfig, loadScript } from '../../scripts/aem.js';

/**
 * Marketo form block. Mounts a Marketo Forms 2.0 form (via forms2.min.js +
 * MktoForms2.loadForm) and optionally an Altcha captcha. Third-party scripts
 * load in the delayed phase (idle callback) to stay off the critical path.
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
        if (!window.MktoForms2) return;
        window.MktoForms2.loadForm(baseUrl, munchkinId, Number(formId));
        window.MktoForms2.whenReady((mktoForm) => {
          if (mktoForm.getId() === Number(formId)) addCaptcha(mktoForm);
        });
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('marketo-form: failed to load forms2.min.js', e));
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadForm, { timeout: 3000 });
  } else {
    window.setTimeout(loadForm, 3000);
  }
}
