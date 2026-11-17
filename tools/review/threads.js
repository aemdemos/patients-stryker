/*
 * Review: the rules of threads and page states, shared by the backend (lib/states.mjs, the web
 * actions), the review tool, the results page and the summary, so they can never disagree.
 * No DOM, no imports: runs in the browser and in App Builder actions.
 *
 * Threads: every comment (on a block, a text section or the page) and every QA note opens one;
 * replies are entries `reply:<comment|note>:<id>` with value { text, action, status }.
 *   - A plain reply (no action) is internal discussion: it never changes whose turn it is.
 *   - action `handover`: the writer's side hands the thread to the other side (a reviewer: "Send to
 *     the AOE team"; the AOE team: "Send back to the reviewers", optionally with a status
 *     { state: progress | done | wontdo | open, release }).
 *   - action `resolve`: a reviewer closes the thread.
 *   State, from the latest handover or resolve: internal (in discussion, never handed over),
 *   waiting-aoe, waiting-reviewer, resolved. Older data: an AOE reply with a status and no action,
 *   and the command line's `status:<kind>` rows, count as AOE handovers.
 * Everyone sees every message (both sides can follow a discussion and step in before it is handed
 * over); only the handovers decide whose turn it is.
 *
 * Page states (entry `state` on item `page`, set by reviewers): in-review, approved, skip.
 * The older reviewed mark (`reviewed: true`) counts as approved.
 */

export const ROLES = ['reviewer', 'aoe'];
export const ANSWER_STATES = ['progress', 'done', 'wontdo', 'open'];
export const PAGE_STATES = ['in-review', 'approved', 'skip'];

const json = (v) => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
};

/** the side an entry was written by */
export const roleOf = (r) => (r.role === 'aoe' || r.reviewer === 'AOE' ? 'aoe' : 'reviewer');

/** the thread an entry belongs to: 'comment' / 'note' (opener, reply or status row), else null */
export function threadKindOf(kind) {
  const m = /^(?:reply:|status:)?(comment|note)(?::|$)/.exec(kind || '');
  return m ? m[1] : null;
}

const isOpener = (r) => r.kind === 'comment' || r.kind === 'note';

/** what a thread message does: 'handover', 'resolve' or null (a plain reply / the opener) */
export function actionOf(r) {
  if ((r.kind || '').startsWith('status:')) return 'handover';
  if (!(r.kind || '').startsWith('reply:')) return null;
  const v = json(r.value) || {};
  if (v.action === 'handover' || v.action === 'resolve') return v.action;
  // (an AOE reply with a status, before explicit handovers)
  if (roleOf(r) === 'aoe' && v.status) return 'handover';
  return null;
}

/** is an opener a real thread (a comment with text, a QA note not deleted) */
export function opens(r) {
  const v = json(r.value);
  if (r.kind === 'comment') return typeof v === 'string' && v.trim().length > 0;
  if (r.kind === 'note') return !!v && typeof v === 'object' && !v.deleted;
  return false;
}

/**
 * A thread's state from its rows (the opener and its replies, any order).
 * → { state, owner, replies, last, status, handovers }
 */
export function threadState(rows) {
  const sorted = [...rows].sort((a, b) => (a.time < b.time ? -1 : 1));
  const opener = sorted.find(isOpener);
  const msgs = sorted.filter((r) => !isOpener(r));
  const moves = msgs.filter((r) => actionOf(r));
  const lastMove = moves[moves.length - 1];
  let state = 'internal';
  if (lastMove && actionOf(lastMove) === 'resolve') state = 'resolved';
  else if (lastMove) state = roleOf(lastMove) === 'aoe' ? 'waiting-reviewer' : 'waiting-aoe';
  const answer = [...msgs].reverse().find((r) => {
    const v = json(r.value) || {};
    return roleOf(r) === 'aoe' && (r.kind.startsWith('status:') ? v.state : v.status);
  });
  let status = null;
  if (answer) {
    const v = json(answer.value) || {};
    status = { ...(answer.kind.startsWith('status:') ? v : v.status), time: answer.time };
  }
  const last = sorted[sorted.length - 1];
  // the side the thread started on
  const first = opener || msgs[0];
  return {
    state,
    owner: first ? roleOf(first) : 'reviewer',
    replies: msgs.length,
    last: last ? { by: last.reviewer, role: roleOf(last), time: last.time } : null,
    status,
    handovers: moves.length,
  };
}

/**
 * A page's review state from its rows, newest per item + kind:
 *   skipped           a reviewer chose "Skip: don't migrate"                      (black)
 *   waiting-aoe       a thread waits for the AOE team                              (red)
 *   waiting-reviewer  every open thread was handed to the reviewers               (yellow)
 *   resolved          approved, after feedback (threads or design choices)         (green)
 *   approved          approved, never any feedback                                 (light green)
 *   in-review         marked in review, or any activity                            (grey-blue)
 *   unreviewed        nothing yet                                                  (gray)
 * → { state, threads: { internal, waiting-aoe, waiting-reviewer, resolved }, choices, approved,
 *     pageState, reviewers, last, lastAoe }
 */
export function pageState(rows) {
  const newest = new Map();
  [...rows].sort((a, b) => (a.time < b.time ? -1 : 1)).forEach((r) => newest.set(`${r.item}|${r.kind}`, r));
  const threads = {
    internal: 0, 'waiting-aoe': 0, 'waiting-reviewer': 0, resolved: 0,
  };
  newest.forEach((r) => {
    if (!isOpener(r) || !opens(r)) return;
    const t = r.kind;
    const own = rows.filter((x) => x.item === r.item && threadKindOf(x.kind) === t && !isOpener(x));
    threads[threadState([r, ...own]).state] += 1;
  });
  const CHOICES = ['variant', 'width', 'background', 'text'];
  const choices = [...newest.values()].filter((r) => CHOICES.includes(r.kind) && roleOf(r) === 'reviewer'
    && json(r.value) !== null && json(r.value) !== undefined).length;
  const set = newest.get('page|state');
  const legacy = newest.get('page|reviewed');
  let pageSetting = set ? json(set.value) : '';
  if (!PAGE_STATES.includes(pageSetting)) pageSetting = '';
  if (!set && legacy && json(legacy.value) === true) pageSetting = 'approved';
  const mark = set || legacy;
  const approved = pageSetting === 'approved' && mark ? { by: mark.reviewer, at: mark.time } : null;
  const lastOf = (list) => list.reduce((a, r) => (!a || r.time > a.time ? r : a), null);
  const lastAny = lastOf(rows);
  const lastAoe = lastOf(rows.filter((r) => roleOf(r) === 'aoe'));
  let state = 'unreviewed';
  if (pageSetting === 'skip') state = 'skipped';
  else if (threads['waiting-aoe']) state = 'waiting-aoe';
  else if (threads['waiting-reviewer']) state = 'waiting-reviewer';
  else if (pageSetting === 'approved') state = threads.resolved || choices ? 'resolved' : 'approved';
  else if (pageSetting === 'in-review' || rows.length) state = 'in-review';
  return {
    state,
    threads,
    choices,
    approved,
    pageState: pageSetting,
    reviewers: [...new Set(rows.filter((r) => roleOf(r) === 'reviewer').map((r) => r.reviewer))],
    last: lastAny ? { by: lastAny.reviewer, role: roleOf(lastAny), at: lastAny.time } : null,
    lastAoe: lastAoe ? { by: lastAoe.reviewer, at: lastAoe.time } : null,
  };
}

/** every page with rows → its state (group choices, page `*`, are not a page) */
export function pageStates(rows) {
  const byPage = new Map();
  rows.filter((r) => r.page !== '*').forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });
  return [...byPage].map(([page, list]) => ({ page, ...pageState(list) }));
}
