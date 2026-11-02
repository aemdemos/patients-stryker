// stryker.com rule for every browser tool: never load ALTCHA. Every page with a form solves its
// proof-of-work on load (<altcha-widget auto="onload">) and takes all the CPU, which slows
// everything down and can leave captures incomplete. The <altcha-widget> element stays in the
// markup. Usage: await blockAltcha(context) right after browser.newContext() (or on a page).
export const ALTCHA = /\/altcha\/|\/captcha\//i;

export async function blockAltcha(target) {
  await target.route((url) => ALTCHA.test(url.pathname), (route) => route.abort());
}
