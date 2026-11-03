const LOADER_URL = 'https://www.gstatic.com/charts/loader.js';
const TIMEOUT = 15000;
let loading;
let loaderPolicy;

/**
 * Share script injection and package readiness across all Chart Blocks.
 * A rejected promise stays rejected so a blocked page does not retry per block.
 */
export default function loadGoogleCharts() {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      let script;
      let timer;
      let ready;
      let failed;
      const cleanup = () => {
        clearTimeout(timer);
        if (script) {
          script.removeEventListener('load', ready);
          script.removeEventListener('error', failed);
        }
      };
      const finish = (error) => {
        cleanup();
        if (error) reject(error);
        else resolve(window.google.visualization);
      };
      failed = () => {
        finish(new Error('Google Charts loader failed. Check connectivity and CSP.'));
      };
      ready = () => {
        try {
          if (!window.google?.charts) {
            throw new Error('Google Charts loader did not expose its API.');
          }
          window.google.charts.load('current', { packages: ['corechart'] });
          window.google.charts.setOnLoadCallback(() => {
            const api = window.google.visualization;
            if (!api?.DataTable || !api.PieChart || !api.BarChart || !api.ColumnChart) {
              finish(new Error('Google Charts corechart package is incomplete.'));
              return;
            }
            finish();
          });
        } catch (error) {
          finish(error);
        }
      };
      timer = setTimeout(() => finish(new Error('Google Charts loading timed out.')), TIMEOUT);
      try {
        if (window.google?.charts) {
          ready();
          return;
        }
        script = document.querySelector(`script[src="${LOADER_URL}"]`);
        const existing = !!script;
        if (!existing) {
          script = document.createElement('script');
          if (window.trustedTypes && !loaderPolicy) {
            loaderPolicy = window.trustedTypes.createPolicy('stryker-chart-loader', {
              createScriptURL: (url) => {
                if (url !== LOADER_URL) throw new TypeError('Unapproved Chart loader URL.');
                return url;
              },
            });
          }
          script.src = loaderPolicy ? loaderPolicy.createScriptURL(LOADER_URL) : LOADER_URL;
          script.async = true;
        }
        script.addEventListener('load', ready, { once: true });
        script.addEventListener('error', failed, { once: true });
        if (!existing) document.head.append(script);
      } catch (error) {
        finish(error);
      }
    });
  }
  return loading;
}
