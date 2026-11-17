/*
 * Review backend: the review state of every page, for the status page (web action `overview`).
 * From a page's entries (newest per item + kind):
 *   threads   every comment (non-empty) and QA note (not deleted) is a thread; its state from its
 *             last message: resolved (closed), answered (the AOE team wrote last), open
 *   choices   design choices saved by reviewers (variant, width, background, text set)
 *   reviewed  the newest "I have reviewed this page" mark
 * and the page's state, in this order:
 *   waiting-aoe       a thread waits for the AOE team                         (red)
 *   waiting-reviewer  every unresolved thread was answered by the AOE team    (yellow)
 *   resolved          marked reviewed, after feedback (threads or choices)     (green)
 *   approved          marked reviewed, never any feedback                      (light green)
 *   in-review         activity, not marked reviewed, nothing open              (grey-blue)
 *   unreviewed        nothing yet                                              (black)
 */

const json = (v) => {
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
};
const isAoe = (r) => r.role === 'aoe' || r.reviewer === 'AOE';
const CHOICES = ['variant', 'width', 'background', 'text'];

/** the state of one page's rows (rows of that page only) */
export function pageState(rows) {
  const newest = new Map();
  [...rows].sort((a, b) => (a.time < b.time ? -1 : 1)).forEach((r) => newest.set(`${r.item}|${r.kind}`, r));
  const threads = { open: 0, answered: 0, resolved: 0 };
  newest.forEach((r) => {
    const v = json(r.value);
    const opener = (r.kind === 'comment' && typeof v === 'string' && v.trim())
      || (r.kind === 'note' && v && typeof v === 'object' && !v.deleted);
    if (!opener) return;
    const msgs = rows.filter((x) => x.item === r.item
      && (x.kind.startsWith(`reply:${r.kind}:`) || x.kind === `status:${r.kind}`))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
    const last = msgs[msgs.length - 1];
    const lastValue = last ? json(last.value) : null;
    // (a QA note its reviewer marked resolved before threads existed counts as closed)
    if ((last && lastValue?.action === 'resolve') || (!last && r.kind === 'note' && v.status === 'resolved')) threads.resolved += 1;
    else if (last && isAoe(last)) threads.answered += 1;
    else threads.open += 1;
  });
  const choices = [...newest.values()].filter((r) => CHOICES.includes(r.kind) && !isAoe(r)
    && json(r.value) !== null && json(r.value) !== undefined).length;
  const mark = newest.get('page|reviewed');
  const reviewed = mark && json(mark.value) === true ? { by: mark.reviewer, at: mark.time } : null;
  const byReviewers = rows.filter((r) => !isAoe(r));
  const lastOf = (list) => list.reduce((a, r) => (!a || r.time > a.time ? r : a), null);
  const lastAny = lastOf(rows);
  const lastAoe = lastOf(rows.filter(isAoe));
  let state = 'unreviewed';
  if (threads.open) state = 'waiting-aoe';
  else if (threads.answered) state = 'waiting-reviewer';
  else if (reviewed) state = threads.resolved || choices ? 'resolved' : 'approved';
  else if (rows.length) state = 'in-review';
  return {
    state,
    threads,
    choices,
    reviewed,
    reviewers: [...new Set(byReviewers.map((r) => r.reviewer))],
    last: lastAny ? { by: lastAny.reviewer, role: isAoe(lastAny) ? 'aoe' : 'reviewer', at: lastAny.time } : null,
    lastAoe: lastAoe ? { by: lastAoe.reviewer, at: lastAoe.time } : null,
  };
}

/** every page with entries → its state (group choices, page `*`, are not a page) */
export function pageStates(rows) {
  const byPage = new Map();
  rows.filter((r) => r.page !== '*').forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });
  return [...byPage].map(([page, list]) => ({ page, ...pageState(list) }));
}
