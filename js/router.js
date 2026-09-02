/* A hash router with a scroll memory. Nothing clever: five tabs, a detail
   view and a back stack that behaves the way the phone's own back gesture
   expects it to. */

const listeners = new Set();
const scrollMem = new Map();

export const parse = () => {
  const raw = (location.hash || '#/').slice(1);
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), parts, q: new URLSearchParams(query || '') };
};

export function go(to, { replace = false } = {}) {
  const next = to.startsWith('#') ? to : '#' + to;
  if (location.hash === next) return;
  rememberScroll();
  if (replace) history.replaceState(null, '', next);
  else location.hash = next;
  if (replace) emit();
}

export const back = () => (history.length > 1 ? history.back() : go('/', { replace: true }));

function rememberScroll() { scrollMem.set(parse().path, window.scrollY); }
export const recallScroll = (path) => scrollMem.get(path) ?? 0;

export const onRoute = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(parse()));

export function start() {
  addEventListener('hashchange', () => emit());
  if (!location.hash) history.replaceState(null, '', '#/');
  emit();
}
