/* Shared pieces: the derived event model, the two card shapes, sheets,
   toasts. Views compose these and never touch the DOM twice for the same
   thing. */
import { BRAND, AGENCY } from './config.js';
import { EVENTS, CATEGORIES } from './data.js';
import { icon } from './icons.js';
import { $, esc, atDay, dayOf, monthOf, relDay, toman, num, timeRange } from './util.js';
import { isSaved, toggleSaved } from './store.js';

/* --------------------------------------------------------------- model */
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/** Offsets become real dates at read time, so nothing in the catalogue
    goes stale while the studio is still showing this around. */
export function hydrate(e) {
  const [h, m] = e.from.split(':').map(Number);
  const date = atDay(e.day, h, m);
  return {
    ...e,
    date,
    cat: catById[e.cat] || CATEGORIES[0],
    left: Math.max(0, e.seats - e.taken),
    past: e.day < 0,
    when: relDay(date),
    full: e.seats - e.taken <= 0,
  };
}
export const allEvents = () => EVENTS.map(hydrate);
export const upcoming = () => allEvents().filter((e) => !e.past)
  .sort((a, b) => a.date - b.date);
export const pastEvents = () => allEvents().filter((e) => e.past)
  .sort((a, b) => b.date - a.date);
export const getEvent = (id) => {
  const e = EVENTS.find((x) => x.id === id);
  return e ? hydrate(e) : null;
};

export const shot = (name, sizes) =>
  `srcset="assets/img/${name}-480.webp 480w, assets/img/${name}-960.webp 960w"
   src="assets/img/${name}-480.webp" sizes="${sizes}"`;

/* --------------------------------------------------------------- cards */
/* The save badge is a real button, so it cannot live inside the card button —
   nested interactive elements are invalid and unreachable by keyboard. The
   card is a positioned container holding two siblings instead. */
export function eventCard(e, { wide = false } = {}) {
  const saved = isSaved(e.id);
  return `
  <div class="ecard">
    <button class="ecard-open" data-act="open" data-id="${e.id}" type="button">
      <span class="ecard-shot">
        <img ${shot(e.img, wide ? '(max-width:520px) 46vw, 240px' : '238px')}
             alt="${esc(e.title)}" loading="lazy" decoding="async">
        <span class="ecard-date"><b>${dayOf(e.date)}</b><span>${monthOf(e.date)}</span></span>
      </span>
      <span class="ecard-body">
        <span class="ecard-cat">${e.cat.emo} ${esc(e.cat.name)}</span>
        <span class="ecard-title">${esc(e.title)}</span>
        <span class="ecard-meta">
          <span class="ecard-price">${e.price ? toman(e.price) : 'رایگان'}</span>
          <span class="${e.left <= 4 ? 'ecard-left' : ''}">${
            e.full ? 'تکمیل' : `${num(e.left)} جای خالی`}</span>
        </span>
      </span>
    </button>
    <button class="ecard-save ${saved ? 'on' : ''}" data-act="save" data-id="${e.id}"
            type="button" aria-pressed="${saved}"
            aria-label="ذخیرهٔ ${esc(e.title)}">${icon('bookmark', 16)}</button>
  </div>`;
}

export function eventRow(e) {
  return `
  <button class="erow" data-act="open" data-id="${e.id}" type="button">
    <span class="erow-shot">
      <img ${shot(e.img, '96px')} alt="${esc(e.title)}" loading="lazy" decoding="async">
    </span>
    <span class="erow-body">
      <span class="erow-when">${esc(e.when)}، ${e.from}</span>
      <span class="erow-title">${esc(e.title)}</span>
      <span class="erow-foot">
        <b>${e.price ? toman(e.price) : 'رایگان'}</b>
        <span>${e.full ? 'تکمیل' : `${num(e.left)} جای خالی`}</span>
      </span>
    </span>
  </button>`;
}

export const saveBtnState = (id) => isSaved(id);

/** Card save buttons are everywhere; one place flips them all. */
export function flipSave(id) {
  const now = toggleSaved(id);
  document.querySelectorAll(
    `[data-act="save"][data-id="${id}"], [data-act="save-top"][data-id="${id}"]`
  ).forEach((el) => {
    el.classList.toggle('on', now);
    if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(now));
  });
  toast(now ? 'ذخیره شد' : 'از ذخیره‌ها برداشته شد', now ? 'bookmark' : 'check');
  return now;
}

/* -------------------------------------------------------------- toasts */
export function toast(msg, ico = 'check', ms = 2400) {
  const dock = $('#toastDock');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(ico, 16)}<span>${esc(msg)}</span>`;
  dock.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, ms);
}

/* -------------------------------------------------------------- sheets */
let closeSheetFn = null;

export function openSheet(html, { onMount } = {}) {
  const root = $('#sheetRoot');
  root.innerHTML = `<div class="sheet-veil" data-act="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grip"></div>${html}</div>`;
  document.body.classList.add('locked');
  /* Not requestAnimationFrame: a backgrounded tab freezes rAF, and the
     callback can land AFTER a close — which pins the sheet open forever.
     Reading a layout property flushes the initial transform synchronously,
     so the transition still runs from the bottom. */
  void root.offsetHeight;
  root.classList.add('open');
  const sheet = root.querySelector('.sheet');
  onMount?.(sheet);
  sheet.querySelector('input,textarea,button')?.focus({ preventScroll: true });
  closeSheetFn = closeSheet;
  return sheet;
}

export function closeSheet() {
  const root = $('#sheetRoot');
  if (!root.classList.contains('open')) return;
  root.classList.remove('open');
  document.body.classList.remove('locked');
  setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 480);
}
export const sheetIsOpen = () => $('#sheetRoot').classList.contains('open');

/* ------------------------------------------------------------- fragments */
export const empty = (ico, title, body, cta = '') => `
  <div class="empty">
    <div class="ring">${icon(ico, 24)}</div>
    <h3>${esc(title)}</h3><p>${esc(body)}</p>${cta}
  </div>`;

export const factRow = (e) => `
  <div class="ev-facts">
    <div class="fact">${icon('calendar', 18)}<b>${dayOf(e.date)} ${monthOf(e.date)}</b>
      <span>${esc(e.when)}</span></div>
    <div class="fact">${icon('clock', 18)}<b>${e.from}</b>
      <span>${esc(timeRange(e.from, e.to))}</span></div>
    <div class="fact">${icon('users', 18)}<b>${e.full ? 'تکمیل' : num(e.left)}</b>
      <span>${e.full ? 'ظرفیت پر شد' : 'جای خالی'}</span></div>
  </div>`;

/* ---------------------------------------------------------------- footer */
/* Both screens that end in a footer were repeating it. The agency signature
   is its own block below a hairline, not a few words tacked onto the note —
   the wordmark already reads "alpha", so the text beside it carries the rest
   of the phrase instead of saying the name twice. */
export const siteFoot = (wordmark, note) => `
  <footer class="foot">
    <div class="mark">${wordmark}</div>
    <div>${esc(BRAND.address)}</div>
    <div><a href="${BRAND.instagramUrl}" target="_blank" rel="noopener"
      class="ltr">@${esc(BRAND.instagram)}</a></div>

    <div class="foot-sig">
      <a class="alphasig" href="${AGENCY.url}" target="_blank" rel="noopener"
         aria-label="${esc(AGENCY.by)} ${esc(AGENCY.name)}">
        <img class="alphasig__mark" src="${AGENCY.logo}" alt=""
             width="440" height="335" loading="lazy" decoding="async">
        <span class="alphasig__txt">
          <span class="alphasig__by">${esc(AGENCY.by)}</span>
          <span class="alphasig__name ltr">${esc(AGENCY.name)}</span>
        </span>
      </a>
    </div>

    <div class="note">${esc(note)}</div>
  </footer>`;
