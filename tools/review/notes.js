/*
 * Review tool: pinned QA notes on the standard page. In note mode a click on the page drops a pin;
 * the pin is tied to the nearest text run or image (its sync.js key and the spot inside its box),
 * so it keeps its place when the page reflows or a block changes variant; without one, the page
 * position is kept. Pins live in the standard frame's document (they scroll with it); the shell
 * owns the editor, the list and saving.
 * A note: { id, created, vp, cat, text, status: open | resolved, anchor: { key, fx, fy } | null,
 *   at: { x, y }, deleted }
 */
import { TEXT, keyOf, findKey } from './sync.js';

export const CATEGORIES = {
  text: 'Text', layout: 'Layout', image: 'Image', link: 'Link', other: 'Other',
};

const STYLE = `
#rv-pins { position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483000; }
#rv-pins .rv-pin { position: absolute; display: grid; place-items: center; width: 26px; height: 26px;
  margin: -13px 0 0 -13px; border: 2px solid #fff; border-radius: 50%; background: #ffb500; color: #000;
  font: 700 12px/1 system-ui, sans-serif; box-shadow: 0 1px 4px rgb(0 0 0 / 45%); cursor: pointer; }
#rv-pins .rv-pin.rv-resolved { background: #4c7d7a; color: #fff; opacity: 0.75; }
#rv-pins .rv-pin.rv-draft { border-style: dashed; background: #fff3d1; }
#rv-pins .rv-pin.rv-sel { outline: 3px solid #1f2328; outline-offset: 2px; }
body.rv-adding, body.rv-adding * { cursor: crosshair !important; }
`;

export function createNotes({
  doc, vp, onPlace, onSelect,
}) {
  let notes = [];
  let adding = false;
  let draft = null;
  let selected = null;
  let attachedTo = null;

  const visible = () => notes.filter((n) => !n.deleted && n.vp === vp());
  const numbered = () => notes.filter((n) => !n.deleted)
    .sort((a, b) => (a.created < b.created ? -1 : 1));
  const numberOf = (id) => numbered().findIndex((n) => n.id === id) + 1;

  /** the page position of a note: from its anchor when the anchor is on the page */
  function positionOf(d, note) {
    const win = d.defaultView;
    const el = note.anchor ? findKey(d, note.anchor.key) : null;
    if (el && el.getClientRects().length) {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + win.scrollX + note.anchor.fx * r.width,
        y: r.top + win.scrollY + note.anchor.fy * r.height,
      };
    }
    return note.at;
  }

  function render() {
    const d = doc();
    if (!d || !d.body) return;
    let box = d.getElementById('rv-pins');
    if (!box) {
      box = d.createElement('div');
      box.id = 'rv-pins';
      d.body.append(box);
    }
    box.replaceChildren();
    const pin = (note, n, extra = '') => {
      const p = d.createElement('div');
      p.className = `rv-pin${note.status === 'resolved' ? ' rv-resolved' : ''}${extra}${selected === note.id ? ' rv-sel' : ''}`;
      p.textContent = n;
      p.title = `${CATEGORIES[note.cat] || ''}: ${note.text || ''}`;
      const { x, y } = positionOf(d, note);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (note.id !== 'draft') onSelect(note.id);
      });
      box.append(p);
    };
    visible().forEach((note) => pin(note, numberOf(note.id)));
    if (draft && draft.vp === vp()) pin({ ...draft, id: 'draft' }, '+', ' rv-draft');
  }

  /** the anchor of a click: the innermost text run or the image under it */
  function anchorAt(d, e) {
    const win = d.defaultView;
    const x = e.clientX + win.scrollX;
    const y = e.clientY + win.scrollY;
    const t = e.target;
    const holder = (t.closest && (t.closest('img') || t.closest(TEXT))) || null;
    let anchor = null;
    if (holder && !holder.closest('#rv-pins')) {
      const key = keyOf(holder);
      if (key && findKey(d, key) === holder) {
        const r = holder.getBoundingClientRect();
        anchor = {
          key,
          fx: r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0,
          fy: r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0,
        };
      }
    }
    return { anchor, at: { x: Math.round(x), y: Math.round(y) } };
  }

  /** once per frame document: the pins' style and the click of note mode */
  function attach() {
    const d = doc();
    if (!d || attachedTo === d) return;
    attachedTo = d;
    const style = d.createElement('style');
    style.textContent = STYLE;
    d.head.append(style);
    d.addEventListener('click', (e) => {
      if (!adding || e.target.closest?.('#rv-pins')) return;
      e.preventDefault();
      e.stopPropagation();
      const { anchor, at } = anchorAt(d, e);
      draft = {
        id: null, created: new Date().toISOString(), vp: vp(), cat: 'text', text: '', status: 'open', anchor, at,
      };
      render();
      onPlace(draft);
    }, true);
    d.body.classList.toggle('rv-adding', adding);
    render();
  }

  return {
    attach,
    render,
    setNotes(list) {
      notes = list;
      render();
    },
    list: () => numbered().map((n) => ({ ...n, n: numberOf(n.id) })),
    get adding() { return adding; },
    setAdding(on) {
      adding = on;
      doc()?.body?.classList.toggle('rv-adding', on);
    },
    clearDraft() {
      draft = null;
      render();
    },
    select(id) {
      selected = id;
      render();
      const d = doc();
      const note = notes.find((n) => n.id === id);
      if (!d || !note) return;
      const { y } = positionOf(d, note);
      d.defaultView.scrollTo({ top: Math.max(0, y - d.defaultView.innerHeight / 3), behavior: 'smooth' });
    },
  };
}
