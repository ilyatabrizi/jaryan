/* Boot, routing, the two glass bars, and one click delegate for the lot. */
import { BRAND } from './config.js';
import { icon } from './icons.js';
import { WORDMARK } from './wordmark.js';
import { $, $$ } from './util.js';
import { start, onRoute, go, back, parse, recallScroll } from './router.js';
import { flipSave, closeSheet, sheetIsOpen, toast, openSheet, getEvent } from './ui.js';
import { isSaved, state } from './store.js';
import { promptInstall, standalone } from './install.js';

import home from './views/home.js';
import discover from './views/discover.js';
import event from './views/event.js';
import tickets from './views/tickets.js';
import saved from './views/saved.js';
import profile from './views/profile.js';
import host from './views/host.js';

const VIEWS = { '/': home, '/discover': discover, '/tickets': tickets,
  '/saved': saved, '/profile': profile, '/host': host, '/e': event };

const TABS = [
  { id: 'home', to: '/', label: 'خانه', ico: 'home' },
  { id: 'discover', to: '/discover', label: 'کاوش', ico: 'compass' },
  { id: 'tickets', to: '/tickets', label: 'بلیت‌ها', ico: 'ticket' },
  { id: 'saved', to: '/saved', label: 'ذخیره', ico: 'bookmark' },
  { id: 'profile', to: '/profile', label: 'پروفایل', ico: 'user' },
];

const app = $('#app');
const topbar = $('#topbar');
const topTitle = $('#topbarTitle');
const topBack = $('#topbarBack');
const topAct = $('#topbarAct');
const tabbar = $('#tabbar');
const pill = $('#tabPill');

/* Views bind listeners to #app and to window; #app survives every render, so
   without this every navigation would leave another live handler behind. One
   controller per render, aborted before the next one. */
let viewAbort = null;
let current = null;

/* ---------------------------------------------------------------- tabs */
function buildTabs() {
  TABS.forEach((t) => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.type = 'button';
    b.dataset.tab = t.id;
    b.dataset.act = 'nav';
    b.dataset.to = t.to;
    b.innerHTML = `${icon(t.ico, 23)}<span class="tab-label">${t.label}</span>
      <span class="tab-dot" hidden></span>`;
    tabbar.appendChild(b);
  });
}

/* A detail view belongs to whichever tab you reached it from — the pill
   stays where it was rather than blinking out and leaving five grey icons. */
let lastTab = 'home';

function movePill(id) {
  if (id) lastTab = id;
  const btn = tabbar.querySelector(`[data-tab="${id || lastTab}"]`);
  if (!btn) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '1';
  pill.style.width = btn.offsetWidth + 'px';
  pill.style.transform = `translateX(${btn.offsetLeft - pill.offsetLeft}px)`;
  $$('.tab', tabbar).forEach((b) => b.classList.toggle('on', b === btn));
}

function badgeTabs() {
  const n = state.tickets.length;
  const dot = tabbar.querySelector('[data-tab="tickets"] .tab-dot');
  if (!dot) return;
  dot.hidden = !n;
  dot.textContent = new Intl.NumberFormat('fa-IR').format(n);
}

/* -------------------------------------------------------------- topbar */
function wireTopbar(view, parts, signal) {
  const meta = view.meta ? view.meta(parts) : {};
  const title = meta.title || view.title || BRAND.name;
  const at = view.topbarAt ?? 70;

  topTitle.textContent = title;
  topBack.hidden = !view.back;
  topAct.hidden = !meta.saveId;
  if (meta.saveId) {
    topAct.dataset.act = 'save-top';
    topAct.dataset.id = meta.saveId;
    topAct.innerHTML = icon('bookmark', 19);
    topAct.setAttribute('aria-pressed', String(isSaved(meta.saveId)));
    topAct.classList.toggle('on', isSaved(meta.saveId));
  }

  const onScroll = () => topbar.classList.toggle('show', window.scrollY > at);
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();
}

/* -------------------------------------------------------------- render */
function render(route) {
  const key = route.parts[0] === 'e' ? '/e' : route.path;
  const view = VIEWS[key] || VIEWS['/'];
  const same = current === key;
  current = key;

  viewAbort?.abort();
  viewAbort = new AbortController();
  closeSheet();

  app.innerHTML = view.render(route.parts, route.q);
  view.mount?.(app, viewAbort.signal);

  wireTopbar(view, route.parts, viewAbort.signal);
  movePill(view.tab || '');
  badgeTabs();

  const y = same ? recallScroll(route.path) : 0;
  window.scrollTo({ top: y, behavior: 'auto' });

  const docTitle = view.meta?.(route.parts)?.title || view.title || BRAND.name;
  document.title = docTitle === BRAND.name
    ? `${BRAND.name} — پلتفرم رویدادهای تبریز`
    : `${docTitle} — ${BRAND.name}`;
  tabbar.classList.remove('hide');
}

/* ------------------------------------------------------------ delegate */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;

  if (act === 'nav') { e.preventDefault(); go(t.dataset.to); }
  else if (act === 'open') { e.preventDefault(); go('/e/' + t.dataset.id); }
  else if (act === 'save' || act === 'save-top') { e.preventDefault(); e.stopPropagation(); flipSave(t.dataset.id); }
  else if (act === 'back') { e.preventDefault(); back(); }
  else if (act === 'sheet-close') closeSheet();
  else if (act === 'install') promptInstall();
  else if (act === 'cat') go('/discover' + (t.dataset.c ? `?c=${t.dataset.c}` : ''));
  else if (act === 'share') share(t.dataset.id);
  else if (act === 'reset') resetSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetIsOpen()) closeSheet();
});

async function share(id) {
  const e = getEvent(id);
  const url = location.origin + location.pathname + '#/e/' + id;
  const data = { title: `${e?.title || BRAND.name} — ${BRAND.name}`,
    text: e?.lede || BRAND.tagline, url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(url);
    toast('لینک کپی شد', 'check');
  } catch { /* the user dismissed the sheet */ }
}

function resetSheet() {
  const sheet = openSheet(`
    <h2>پاک کردن اطلاعات</h2>
    <p class="lede">بلیت‌ها، ذخیره‌ها و مشخصاتت از این گوشی حذف می‌شود. برگشتی ندارد.</p>
    <button class="btn btn-ink btn-block" id="yes" type="button">بله، پاک کن</button>
    <div style="height:9px"></div>
    <button class="btn btn-quiet btn-block" data-act="sheet-close" type="button">بی‌خیال</button>`);
  sheet.querySelector('#yes').addEventListener('click', () => {
    try { localStorage.removeItem('jaryan.v1'); } catch { /* private mode */ }
    location.reload();
  });
}

/* ------------------------------------------------------------ the boot */
function liftVeil() {
  const boot = $('#boot');
  $('#bootMark').innerHTML = WORDMARK;
  const lift = () => setTimeout(() => {
    boot.classList.add('gone');
    setTimeout(() => boot.remove(), 620);
  }, standalone() ? 620 : 420);
  if (document.fonts?.ready) document.fonts.ready.then(lift); else lift();
}

addEventListener('resize', () => {
  const on = tabbar.querySelector('.tab.on');
  if (on) movePill(on.dataset.tab);
});

buildTabs();
liftVeil();
onRoute(render);
start();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
