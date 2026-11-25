/*
 * Review tool: the help on every page (25 Nov 2026). At the right end of the page's top bar a
 * "Start" link (the launch page) and an ⓘ button; the button opens a dialog about the page: what
 * is on it and how to use it, for the viewer's side (the reviewers, or the AOE team:
 * theirs first, the reviewers' part folded below). DOM only (no innerHTML).
 * mountHelp(page, bar) → { setRole(role) }; page: launch | review | status | summary | invites
 */
import { REVIEW } from './config.js';

const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = './help.css';
document.head.append(css);

const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
};

// a section of help: [title, [paragraph or [bullets]]]
const P = (...lines) => lines;
const sourceWords = REVIEW.compare.includes('rs')
  ? 'the as-is copy of the page, a screenshot of the stryker.com page (Screenshot) or the stryker.com page rendered now (Render)'
  : 'a screenshot of the stryker.com page (Screenshot) or the stryker.com page rendered now (Render)';

const widthWords = REVIEW.widths.map((w) => w.label.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' or $1');
const widthButtons = REVIEW.widths.map((w) => w.label).join(' / ');

export const HELP = {
  launch: {
    title: 'The start page',
    intro: 'Where the review starts: the pages you use, where the review stands, and how the reviewers and the AOE team work through it together.',
    reviewer: [
      ['What you see', P('Your name and role, from your review link.', 'The review in numbers, kept up to date while the page is open: the pages in the review, the pages waiting for the AOE team (red) and for the reviewer (blue), in review and approved.', 'A card for each tool of the review (Summary, Status page, Review tool), and the way of working, step by step, with the colours of each status.')],
      ['Where to begin', P(['The **Summary** gathers everything said and decided so far.', 'The **Status page** lists the pages that are yours to review (your batch, if the AOE team gave you one).', 'Open a page in the **Review tool**, compare it with the original, comment and approve.', 'Your review link is personal and covers every page you are invited to: keep it to yourself.'])],
    ],
    aoe: [
      ['For the AOE team', P('The same page and the same numbers the reviewers see.', ['The **Invitations** card: create review links for reviewers and AOE members, and withdraw them.', 'The way of working is the same for everyone: point new reviewers to this page.'])],
    ],
  },
  review: {
    title: 'The review tool',
    intro: `One page at a time: the migrated page next to ${sourceWords}, at ${widthWords} width, with everything said about it in the panel on the right.`,
    reviewer: [
      ['Looking at a page', P(['**Find a page** at the top left, or step with ‹ › (Alt+← / Alt+→); **EDS ↗** and **Source ↗** next to it open the migrated and the stryker.com page in a new tab.', `**${widthButtons}**: the width both pages are shown at.`, `**Compare with**: ${sourceWords}. Screenshot shows the screenshot taken when the page was published (its date is in the Source shot box); Render shows the stryker.com page as it is now (menus and carousels don't move).`, '**Side by side**, **Flip** (Space switches) or **Overlay**; **Scroll Sync** keeps both pages at the same place while you scroll.'])],
      ['Saying something', P(['**This page** chat (right panel): a message about the page as a whole. Send (or Ctrl+Enter) saves it at once.', '**+ Add QA note** (or N), then click the spot on the page: a numbered pin, and its own chat. Its first message says what is wrong. Refer to it as "note 4 on page X".', '**Pictures**: for what only shows after a click on the real page (the migrated or the stryker.com one), take a screenshot and paste it into the message box (Ctrl+V / ⌘V), drop it onto it, or use the paper clip; up to 6 per message, sent with it. A click on a picture shows it large: zoom with − + (or Ctrl+wheel), **Fit** (all of it), **Fill** (the whole window), **100%**, drag it around, ‹ › for the others.', 'A message sent by mistake: **Withdraw** it (everyone then sees "Message withdrawn").', 'Something written and not sent stays in your browser until you send it.', '**Done**: tick a chat when it is dealt with (either side can).'])],
      ['Deciding', P(['The status at the top of the right panel says whose turn it is.', '**Approve** when the page is right; **Send to the AOE team** when something must change; **Skip: don\'t migrate** for a page that should not be migrated; **In review** while you are at it. Pressing the current status clears it.', 'Everything is saved at once, and the page updates itself when someone else writes.'])],
    ],
    aoe: [
      ['For the AOE team', P(['Answer in the chats; a message may carry a status (**in progress**, **done**, **won\'t do**, **open again**).', 'When the page is fixed: **Send back to the reviewer** (Waiting for the reviewer).', '**Edit in DA** (right panel) opens the page\'s document in Document Authoring.', '**Refresh source shot** takes a new snapshot of the stryker.com page; every earlier one is kept, with its date.', 'Where the source is checked every day for changes, the Source shot box says since when, and what the last check found.'])],
    ],
  },
  status: {
    title: 'The status page',
    intro: 'Every page of the review in one list: its status, who did what last, and how the pages are organised.',
    reviewer: [
      ['The list', P(['Each row: the page (opens in the review tool, in a new tab), its status in colour, its chats (open / done), when it was approved, the latest activity.', '**Filters**: status, area, batch, group, template, a search; **News**: pages with activity by someone else since your last visit.', 'Your filters, selection and place in the list are kept when you come back, and the list updates itself every 15 seconds.'])],
      ['Batches and groups', P(['The AOE team splits the pages into **batches** (what to review next) and **groups** of pages built exactly the same way.', 'A group\'s **representative** (★, or ☆ when chosen automatically) is the page to review for the whole group: approving one page of a group approves the group.'])],
    ],
    aoe: [
      ['For the AOE team', P(['**Edit** on a row: its batch, group and representative; tick rows to move many at once (the selection bar).', 'The **Groups** box: each group with its pages and its representative.', 'The **Migration scope** box: pages published but not in the scope table, rows of the table to correct, pages waiting for their first source shot, sources that redirect or are not reachable.', '**Refresh** builds the review\'s numbers again from every entry.'])],
    ],
  },
  summary: {
    title: 'The summary',
    intro: 'Everything said and decided in the review, in one place, kept up to date while the page is open.',
    reviewer: [
      ['What is on it', P(['**Progress**: pages approved, pages with activity, who reviewed what.', '**Comments** by page and block, and **QA notes** by category, each with the AOE team\'s answer and status; a note\'s link opens the review tool at its pin.', '**Download** the comments and the QA notes as CSV files for a spreadsheet.', 'You see the pages of your review only.'])],
    ],
    aoe: [
      ['For the AOE team', P(['**Hide test entries** (yours only): leave it on to see the review as the reviewers do.', 'The same page the reviewers see: use it to agree on what is left.'])],
    ],
  },
  invites: {
    title: 'Invitations',
    intro: 'The review links of the people taking part: made here by the AOE team, each one a password to the review.',
    reviewer: [],
    aoe: [
      ['Making a link', P(['**Name**, **role** (reviewer or AOE team), the **pages** it covers (one path per line; / for everything) and how many **days** it works.', 'The link is shown **once**: copy it and send it to that person only. It opens the start page; their name comes from it.'])],
      ['The list', P(['Every invitation with its pages, role, who made it and until when it works.', '**Revoke** stops a link at once (asked first); the person\'s messages stay.'])],
    ],
  },
};

/** "**bold** text" → nodes */
const rich = (text) => text.split(/(\*\*[^*]+\*\*)/).filter(Boolean)
  .map((t) => (t.startsWith('**') ? el('strong', {}, t.slice(2, -2)) : document.createTextNode(t)));
const part = ([title, lines]) => el(
  'section',
  { class: 'hp-part' },
  el('h3', {}, title),
  ...lines.map((l) => (Array.isArray(l) ? el('ul', {}, ...l.map((x) => el('li', {}, ...rich(x)))) : el('p', {}, ...rich(l)))),
);

export function mountHelp(page, bar) {
  const h = HELP[page];
  let role = 'reviewer';
  const dialog = el('dialog', { class: 'hp-dialog', 'aria-labelledby': 'hp-title' });
  const draw = () => {
    const mine = role === 'aoe' ? h.aoe : h.reviewer;
    const theirs = role === 'aoe' ? h.reviewer : [];
    dialog.replaceChildren(...[
      el(
        'div',
        { class: 'hp-head' },
        el('div', {}, el('span', { class: 'hp-kicker' }, REVIEW.title), el('h2', { id: 'hp-title' }, h.title)),
        el('button', {
          type: 'button', class: 'hp-close', 'aria-label': 'Close', onclick: () => dialog.close(),
        }, '×'),
      ),
      el('p', { class: 'hp-intro' }, h.intro),
      el('span', { class: `hp-for hp-for-${role}` }, role === 'aoe' ? 'For the AOE team' : 'For reviewers'),
      ...mine.map(part),
      theirs.length ? el('details', { class: 'hp-theirs' }, el('summary', {}, 'What reviewers see and do'), ...theirs.map(part)) : null,
      el('p', { class: 'hp-foot' }, el('a', { href: './launch.html' }, 'The start page'), ': every page of the review and the way of working.'),
    ].filter(Boolean));
  };
  draw();
  document.body.append(dialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  const tools = el(
    'div',
    { class: 'hp-tools' },
    page === 'launch' ? null : el('a', { class: 'hp-start', href: './launch.html', title: 'The start page: every page of the review and the way of working' }, 'Start'),
    el('button', {
      type: 'button',
      class: 'hp-info',
      'aria-label': 'About this page',
      title: 'About this page: what is on it and how to use it',
      onclick: () => dialog.showModal(),
    }, 'i'),
  );
  (bar || document.body).append(tools);
  if (!bar) tools.classList.add('hp-fixed');
  return {
    setRole(r) {
      const next = r === 'aoe' ? 'aoe' : 'reviewer';
      if (next === role) return;
      role = next;
      draw();
    },
  };
}
