/*
 * Review: the rules of page statuses and threads, shared by the backend (lib/states.mjs, the web
 * actions), the review tool, the results page and the summary, so they can never disagree.
 * No DOM, no imports: runs in the browser and in App Builder actions.
 *
 * Page status (entry `state` on item `page`): whose turn it is is a property of the page.
 *   reviewers set  in-review, waiting-aoe ("Send to the AOE team"), approved, skip
 *   the AOE team   waiting-customer ("Send back to the customer")
 *   '' clears it. The older reviewed mark (`reviewed: true`) counts as approved.
 * Threads: every comment (on a block, a text section or the page) and every QA note opens one; its
 * messages are entries `reply:<comment|note>:<id>`, value { text, status? } (the AOE team may add
 * a status: progress | done | wontdo | open, release), plain chat visible to everyone. Either side
 * may tick a thread Done (entry `done:<comment|note>` on the thread's item, true / false). Older
 * data: a thread whose last move was `action: resolve` counts as done; `status:<kind>` rows (the
 * command line, before) count as AOE messages with a status.
 */

export const ROLES = ['reviewer', 'aoe'];
export const ANSWER_STATES = ['progress', 'done', 'wontdo', 'open'];
export const PAGE_STATES = ['in-review', 'waiting-aoe', 'waiting-customer', 'approved', 'skip'];
// how the AOE team organises the pages (kind on item `page`): not review activity, so they never
// change a page's state, its threads or its latest activity. batch: the review batch (a number);
// group: the pages of exactly the same structure (a number); representative: the group's page
// the customer reviews for the whole group (true / false)
export const ORG_KINDS = ['batch', 'group', 'representative'];
export const isOrg = (r) => ORG_KINDS.includes(r.kind);
/** a batch value: a whole number 1–999, or null (no batch) */
export const batchProblem = (value) => {
  let v;
  try {
    v = JSON.parse(value);
  } catch (e) {
    return 'a batch is a number (or null)';
  }
  return v === null || (Number.isInteger(v) && v >= 1 && v <= 999) ? null : 'a batch is a whole number from 1 to 999 (or null)';
};
/** an organisation value: batch and group a number 1–999 or null, representative a boolean */
export const orgProblem = (kind, value) => {
  if (kind === 'representative') {
    let v;
    try {
      v = JSON.parse(value);
    } catch (e) {
      v = undefined;
    }
    return typeof v === 'boolean' ? null : 'representative is true or false';
  }
  const problem = batchProblem(value);
  return problem && problem.replace(/a batch/g, `a ${kind}`);
};
/** the page statuses each side may set */
export const STATES_BY_ROLE = {
  reviewer: ['in-review', 'waiting-aoe', 'approved', 'skip'],
  aoe: ['waiting-customer'],
};

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

/** the thread an entry belongs to: 'comment' / 'note' (opener, message, done mark, status row) */
export function threadKindOf(kind) {
  const m = /^(?:reply:|status:|done:)?(comment|note)(?::|$)/.exec(kind || '');
  return m ? m[1] : null;
}

const isOpener = (r) => r.kind === 'comment' || r.kind === 'note';
const isMessage = (r) => (r.kind || '').startsWith('reply:') || (r.kind || '').startsWith('status:');

/** is an opener a real thread (a comment with text, a QA note not deleted) */
export function opens(r) {
  const v = json(r.value);
  if (r.kind === 'comment') return typeof v === 'string' && v.trim().length > 0;
  if (r.kind === 'note') return !!v && typeof v === 'object' && !v.deleted;
  return false;
}

/** may this side set this page status ('' clears it) */
export function stateAllowed(value, role) {
  return value === '' || value === null || (STATES_BY_ROLE[role] || []).includes(value);
}

/**
 * A thread from its rows (opener, messages, done marks; any order).
 * → { done, replies, last, status, owner }
 */
export function threadState(rows) {
  const sorted = [...rows].sort((a, b) => (a.time < b.time ? -1 : 1));
  const opener = sorted.find(isOpener);
  const msgs = sorted.filter(isMessage);
  const marks = sorted.filter((r) => (r.kind || '').startsWith('done:'));
  let done = false;
  if (marks.length) done = json(marks[marks.length - 1].value) === true;
  else {
    // (before Done marks: a thread closed with `action: resolve`)
    const moves = msgs.filter((r) => ['resolve', 'handover'].includes((json(r.value) || {}).action));
    done = moves.length > 0 && json(moves[moves.length - 1].value).action === 'resolve';
    // (a QA note resolved by its own status)
    if (!moves.length && opener?.kind === 'note') done = (json(opener.value) || {}).status === 'resolved';
  }
  const answer = [...msgs].reverse().find((r) => {
    const v = json(r.value) || {};
    return roleOf(r) === 'aoe' && (r.kind.startsWith('status:') ? v.state : v.status);
  });
  let status = null;
  if (answer) {
    const v = json(answer.value) || {};
    status = { ...(answer.kind.startsWith('status:') ? v : v.status), time: answer.time };
  }
  const last = msgs[msgs.length - 1] || opener;
  const first = opener || msgs[0];
  return {
    done,
    replies: msgs.length,
    last: last ? { by: last.reviewer, role: roleOf(last), time: last.time } : null,
    status,
    owner: first ? roleOf(first) : 'reviewer',
  };
}

/**
 * A page's status from its rows, newest per item + kind:
 *   skipped           "Skip: don't migrate"                                       (black)
 *   waiting-aoe       sent to the AOE team                                        (red)
 *   waiting-customer  sent back to the customer                                  (blue)
 *   resolved          approved, after feedback (threads or design choices)       (green)
 *   approved          approved, never any feedback                               (light green)
 *   in-review         marked in review, or any activity                          (yellow)
 *   unreviewed        nothing yet                                                (gray)
 * → { state, pageState, set: { by, role, at } | null, threads: { open, done }, choices, approved,
 *     reviewers, last, lastAoe, batch, group, representative }
 * (organisation rows, ORG_KINDS, only give the batch, group and representative: no activity)
 */
export function pageState(allRows) {
  const org = new Map();
  [...allRows].filter(isOrg).sort((a, b) => (a.time < b.time ? -1 : 1))
    .forEach((r) => org.set(r.kind, r));
  const orgValue = (kind) => {
    try {
      return org.has(kind) ? JSON.parse(org.get(kind).value) : null;
    } catch (e) {
      return null;
    }
  };
  const batch = orgValue('batch');
  const group = orgValue('group');
  const rows = allRows.filter((r) => !isOrg(r));
  const newest = new Map();
  [...rows].sort((a, b) => (a.time < b.time ? -1 : 1)).forEach((r) => newest.set(`${r.item}|${r.kind}`, r));
  const threads = { open: 0, done: 0 };
  newest.forEach((r) => {
    if (!isOpener(r) || !opens(r)) return;
    const own = rows
      .filter((x) => x.item === r.item && threadKindOf(x.kind) === r.kind && !isOpener(x));
    threads[threadState([r, ...own]).done ? 'done' : 'open'] += 1;
  });
  const CHOICES = ['variant', 'width', 'background', 'text'];
  const choices = [...newest.values()].filter((r) => CHOICES.includes(r.kind) && roleOf(r) === 'reviewer'
    && json(r.value) !== null && json(r.value) !== undefined).length;
  const chosen = newest.get('page|state');
  const legacy = newest.get('page|reviewed');
  let setting = chosen ? json(chosen.value) : '';
  if (!PAGE_STATES.includes(setting)) setting = '';
  if (!chosen && legacy && json(legacy.value) === true) setting = 'approved';
  const mark = chosen || legacy;
  const set = setting && mark ? { by: mark.reviewer, role: roleOf(mark), at: mark.time } : null;
  const lastOf = (list) => list.reduce((a, r) => (!a || r.time > a.time ? r : a), null);
  const lastAny = lastOf(rows);
  const lastAoe = lastOf(rows.filter((r) => roleOf(r) === 'aoe'));
  let state = 'unreviewed';
  if (setting === 'skip') state = 'skipped';
  else if (setting === 'waiting-aoe' || setting === 'waiting-customer') state = setting;
  else if (setting === 'approved') state = threads.open + threads.done || choices ? 'resolved' : 'approved';
  else if (setting === 'in-review' || rows.length) state = 'in-review';
  return {
    state,
    pageState: setting,
    set,
    threads,
    choices,
    approved: setting === 'approved' ? set : null,
    reviewers: [...new Set(rows.filter((r) => roleOf(r) === 'reviewer').map((r) => r.reviewer))],
    last: lastAny ? { by: lastAny.reviewer, role: roleOf(lastAny), at: lastAny.time } : null,
    lastAoe: lastAoe ? { by: lastAoe.reviewer, at: lastAoe.time } : null,
    batch: Number.isInteger(batch) ? batch : null,
    group: Number.isInteger(group) ? group : null,
    // (a representative only of a group)
    representative: Number.isInteger(group) && orgValue('representative') === true,
  };
}

/** every page with rows → its status (group choices, page `*`, are not a page) */
export function pageStates(rows) {
  const byPage = new Map();
  rows.filter((r) => r.page !== '*').forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });
  return [...byPage].map(([page, list]) => ({ page, ...pageState(list) }));
}
