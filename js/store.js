/* Everything the visitor does lives in one localStorage blob.
   No account, no server — this is a preview, and a phone that clears its
   storage simply starts fresh. */
import { STORE_KEY } from './config.js';

const EMPTY = {
  saved: [],
  tickets: [],
  profile: { name: '', phone: '' },
  host: { unlocked: false, checked: [] },
  installed: false,
};

function read() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(EMPTY);
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
  } catch { return structuredClone(EMPTY); }
}

export const state = read();

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(state));
}

/* ---------------------------------------------------------------- saved */
export const isSaved = (id) => state.saved.includes(id);
export function toggleSaved(id) {
  const i = state.saved.indexOf(id);
  if (i < 0) state.saved.unshift(id); else state.saved.splice(i, 1);
  save();
  return i < 0;
}

/* -------------------------------------------------------------- tickets */
export function addTicket(t) {
  state.tickets.unshift(t);
  save();
  return t;
}
export const ticketsFor = (eventId) => state.tickets.filter((t) => t.eventId === eventId);
export function cancelTicket(code) {
  const i = state.tickets.findIndex((t) => t.code === code);
  if (i >= 0) { state.tickets.splice(i, 1); save(); }
}

/* -------------------------------------------------------------- profile */
export function setProfile(patch) {
  Object.assign(state.profile, patch);
  save();
}

/* ----------------------------------------------------------------- host */
export function unlockHost(ok) { state.host.unlocked = !!ok; save(); }
export const isChecked = (id) => state.host.checked.includes(id);
export function toggleChecked(id) {
  const i = state.host.checked.indexOf(id);
  if (i < 0) state.host.checked.push(id); else state.host.checked.splice(i, 1);
  save();
  return i < 0;
}
