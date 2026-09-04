import { readBlockConfig, loadScript } from '../../scripts/aem.js';

/**
 * Marketo form block.
 *
 * Embeds a Marketo Forms 2.0 form exactly the way the source site does: a
 * placeholder `<form id="mktoForm_{formId}">` is mounted, the shared
 * `forms2.min.js` library is loaded once, and `MktoForms2.loadForm(baseUrl,
 * munchkinId, formId)` fetches and renders the form (fields, structural CSS and
 * the cross-domain submit iframe are all served by Marketo at runtime; on-brand
 * styling is applied by marketo-form.css).
 *
 * The source page also drops a self-hosted Altcha proof-of-work captcha into the
 * form's button row (an `<altcha-widget>` web component + a hidden `altcha`
 * field the widget fills on solve). We reproduce that by loading Stryker's
 * altcha.js clientlib and injecting the same widget once Marketo has rendered
 * the form. IMPORTANT: the widget fetches its challenge from Stryker's origin
 * (`captcha-challenge-url`); that endpoint currently returns NO
 * Access-Control-Allow-Origin header, so the cross-origin fetch from our host is
 * blocked by the browser until Stryker enables CORS for our domain. Until then
 * the form still renders and the widget appears, but verification won't complete
 * off-origin. Authoring the captcha rows is optional — omit them and the form
 * loads without a captcha.
 *
 * Authoring model (key/value rows; captcha rows optional):
 *   | Marketo Form         |                                              |
 *   | Base URL             | //lp.stryker.com                             |
 *   | Munchkin ID          | 338-WAP-571                                  |
 *   | Form ID              | 4893                                         |
 *   | Captcha Script       | https://patients.stryker.com/.../altcha.js   |
 *   | Captcha Challenge URL| https://patients.stryker.com/bin/.../challenge |
 *
 * Performance/privacy: forms2.min.js and altcha.js are third parties that
 * collect PII, so they load in the DELAYED phase (via an idle callback) — never
 * on the critical path. The block renders its mount point eagerly so layout is
 * stable; the form fields fill in once the library loads.
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

  // Without the three identifiers there is nothing to load — bail quietly so an
  // empty/misauthored block doesn't inject scripts or leave a broken mount.
  if (!baseUrl || !munchkinId || !formId) {
    // eslint-disable-next-line no-console
    console.warn('marketo-form: missing base-url, munchkin-id or form-id', config);
    return;
  }

  // Marketo replaces this exact element (matched by id) with the rendered form.
  const form = document.createElement('form');
  form.id = `mktoForm_${formId}`;
  block.append(form);

  // Inject the Altcha captcha into the rendered form's button row, mirroring the
  // source markup (auto-solve on load, logo/footer hidden). Absolute challenge
  // URL because our host differs from Stryker's origin.
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
        // whenReady fires once the form's fields are in the DOM.
        window.MktoForms2.whenReady((mktoForm) => {
          if (mktoForm.getId() === Number(formId)) addCaptcha(mktoForm);
        });
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('marketo-form: failed to load forms2.min.js', e));
  };

  // Delayed phase: defer to idle time (with a timeout fallback) so the
  // third-party library never competes with LCP or blocks interaction.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadForm, { timeout: 3000 });
  } else {
    window.setTimeout(loadForm, 3000);
  }
}
