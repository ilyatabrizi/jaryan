import { BRAND } from '../config.js';
import { icon } from '../icons.js';
import { esc, num, toman, fullDate, timeRange, patternSVG } from '../util.js';
import { getEvent, empty, openSheet, closeSheet, toast } from '../ui.js';
import { state, cancelTicket } from '../store.js';

const ticketCard = (t, e, past) => `
  <article class="ticket ${past ? 'past' : ''}">
    <div class="ticket-top">
      <div>
        <h3>${esc(e ? e.title : 'رویداد')}</h3>
        <div class="when">${e ? esc(fullDate(e.date)) : ''}، ${e ? esc(timeRange(e.from, e.to)) : ''}</div>
        <div class="where">${esc(BRAND.address)}</div>
      </div>
      ${e ? `<img class="ticket-shot" src="assets/img/${e.img}-480.webp" alt="" loading="lazy">` : ''}
    </div>
    <div class="ticket-rip"></div>
    <div class="ticket-bot">
      <div class="ticket-code">
        <span>${esc(t.name)} — ${num(t.qty)} نفر — ${toman(t.total)}</span>
        <b class="ltr">${esc(t.code)}</b>
        <span class="ticket-state ${past ? 'used' : ''}" style="align-self:flex-start;margin-top:6px">
          ${past ? 'استفاده شده' : 'معتبر'}</span>
      </div>
      <button data-act="ticket-zoom" data-code="${esc(t.code)}" type="button"
              aria-label="بزرگ کردن کد">${patternSVG(t.code)}</button>
    </div>
  </article>`;

export default {
  title: 'بلیت‌ها',
  topbarAt: 70,
  tab: 'tickets',

  render() {
    const rows = state.tickets.map((t) => ({ t, e: getEvent(t.eventId) }));
    const live = rows.filter((r) => r.e && !r.e.past);
    const done = rows.filter((r) => !r.e || r.e.past);

    return `
<section class="view">
  <div style="padding:calc(var(--safe-t) + 24px) 0 18px">
    <div class="section-head"><h2 style="font-size:26px">بلیت‌ها</h2></div>
    <div class="section-sub">کد را دم در نشان بده — همین کافی است.</div>
  </div>

  ${rows.length ? `
    <div class="seg" id="seg">
      <div class="seg-pill" id="segPill"></div>
      <button class="on" data-tab="live" type="button">پیش رو (${num(live.length)})</button>
      <button data-tab="done" type="button">بایگانی (${num(done.length)})</button>
    </div>
    <div id="segBody">
      ${live.length ? live.map(({ t, e }) => ticketCard(t, e, false)).join('')
        : empty('ticket', 'بلیت فعالی نداری', 'یک رویداد انتخاب کن و جایت را نگه دار.',
            '<button class="btn btn-ink" data-act="nav" data-to="/discover" type="button">دیدن تقویم</button>')}
    </div>
  ` : empty('ticket', 'هنوز بلیتی نداری',
      'رویدادی که دوست داشتی را باز کن و یک جا برای خودت نگه دار.',
      '<button class="btn btn-ink" data-act="nav" data-to="/discover" type="button">دیدن تقویم</button>')}

  <div style="height:20px"></div>
</section>`;
  },

  mount(root, signal) {
    const seg = root.querySelector('#seg');
    if (!seg) return;
    const pill = root.querySelector('#segPill');
    const body = root.querySelector('#segBody');
    const btns = [...seg.querySelectorAll('button[data-tab]')];

    const rows = state.tickets.map((t) => ({ t, e: getEvent(t.eventId) }));
    const live = rows.filter((r) => r.e && !r.e.past);
    const done = rows.filter((r) => !r.e || r.e.past);

    const place = () => {
      const on = seg.querySelector('button.on');
      pill.style.width = on.offsetWidth + 'px';
      pill.style.transform = `translateX(${on.offsetLeft - pill.offsetLeft}px)`;
    };
    requestAnimationFrame(place);
    addEventListener('resize', place, { signal });

    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.classList.toggle('on', x === b));
      place();
      const set = b.dataset.tab === 'live' ? live : done;
      body.innerHTML = set.length
        ? set.map(({ t, e }) => ticketCard(t, e, b.dataset.tab !== 'live')).join('')
        : empty('ticket',
            b.dataset.tab === 'live' ? 'بلیت فعالی نداری' : 'بایگانی خالی است',
            b.dataset.tab === 'live'
              ? 'یک رویداد انتخاب کن و جایت را نگه دار.'
              : 'رویدادهایی که رفته‌ای اینجا می‌مانند.',
            '<button class="btn btn-ink" data-act="nav" data-to="/discover" type="button">دیدن تقویم</button>');
    }, { signal }));

    root.addEventListener('click', (ev) => {
      const z = ev.target.closest('[data-act="ticket-zoom"]');
      if (!z) return;
      const code = z.dataset.code;
      const t = state.tickets.find((x) => x.code === code);
      const e = t && getEvent(t.eventId);
      const sheet = openSheet(`
        <h2>کد ورود</h2>
        <p class="lede">${e ? esc(e.title) : ''} — ${t ? num(t.qty) : ''} نفر</p>
        <div style="display:grid;place-items:center;gap:16px;padding:6px 0 20px">
          <div style="width:214px;background:#fff;padding:14px;border-radius:20px;
               box-shadow:var(--shadow-1)">${patternSVG(code)}</div>
          <b class="ltr" style="font-size:20px;letter-spacing:.1em">${esc(code)}</b>
          <span style="font-size:12px;color:var(--ink-3);text-align:center;max-width:26ch">
            در نمونهٔ نمایشی، همین کد کافی است — اسکنر پشت در هنوز وصل نیست.</span>
        </div>
        <button class="btn btn-quiet btn-block" data-act="cancel-ticket" data-code="${esc(code)}"
                type="button">لغو رزرو</button>
        <div style="height:8px"></div>
        <button class="btn btn-ink btn-block" data-act="sheet-close" type="button">بستن</button>`);

      sheet.querySelector('[data-act="cancel-ticket"]').addEventListener('click', () => {
        cancelTicket(code);
        closeSheet();
        toast('رزرو لغو شد', 'check');
        setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 380);
      });
    }, { signal });
  },
};
