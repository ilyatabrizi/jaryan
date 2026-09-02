import { BRAND } from '../config.js';
import { icon } from '../icons.js';
import { esc, num, toman, fullDate, timeRange, bookingCode, clamp } from '../util.js';
import { getEvent, upcoming, factRow, shot, eventCard, openSheet, closeSheet, toast }
  from '../ui.js';
import { isSaved, addTicket, ticketsFor, state, setProfile } from '../store.js';
import { go } from '../router.js';

/* ------------------------------------------------------------ the sheet */
function bookingSheet(e) {
  let qty = 1;
  const max = Math.min(4, e.left || 1);
  const line = () => `
    <div class="tally">
      <div><span>${esc(e.title)} × ${num(qty)}</span><span>${toman(e.price * qty)}</span></div>
      <div><span>هزینهٔ خدمات</span><span>رایگان</span></div>
      <div class="sum"><span>قابل پرداخت</span><span>${toman(e.price * qty)}</span></div>
    </div>`;

  const sheet = openSheet(`
    <h2>رزرو جا</h2>
    <p class="lede">${esc(fullDate(e.date))}، ${esc(timeRange(e.from, e.to))} — ${esc(BRAND.area)}</p>

    <div class="stepper">
      <div><b>تعداد نفرات</b><span>حداکثر ${num(max)} نفر در هر رزرو</span></div>
      <div class="stepper-ctl">
        <button type="button" id="plus" aria-label="بیشتر">${icon('plus', 16)}</button>
        <output id="qty">${num(qty)}</output>
        <button type="button" id="minus" aria-label="کمتر">${icon('minus', 16)}</button>
      </div>
    </div>

    <div class="field">
      <label for="bname">نام</label>
      <input id="bname" type="text" value="${esc(state.profile.name)}" placeholder="اسمی که روی بلیت بنشیند"
             autocomplete="name">
    </div>
    <div class="field">
      <label for="bphone">شمارهٔ موبایل</label>
      <input id="bphone" type="tel" inputmode="numeric" value="${esc(state.profile.phone)}"
             placeholder="۰۹۱۴ ۱۲۳ ۴۵۶۷" autocomplete="tel">
      <div class="hint">${esc(BRAND.addressNote)}</div>
    </div>

    <div id="tally">${line()}</div>
    <button class="btn btn-ink btn-block" id="confirm" type="button">
      ${icon('check', 18)} تأیید رزرو
    </button>
    <p class="lede" style="margin:14px 0 0;text-align:center;font-size:11.5px">
      این یک نمونهٔ نمایشی است — پرداختی انجام نمی‌شود.
    </p>
  `);

  const out = sheet.querySelector('#qty');
  const tally = sheet.querySelector('#tally');
  const minus = sheet.querySelector('#minus');
  const plus = sheet.querySelector('#plus');
  const sync = () => {
    out.textContent = num(qty);
    tally.innerHTML = line();
    minus.disabled = qty <= 1;
    plus.disabled = qty >= max;
  };
  minus.addEventListener('click', () => { qty = clamp(qty - 1, 1, max); sync(); });
  plus.addEventListener('click', () => { qty = clamp(qty + 1, 1, max); sync(); });
  sync();

  sheet.querySelector('#confirm').addEventListener('click', () => {
    const name = sheet.querySelector('#bname').value.trim();
    const phone = sheet.querySelector('#bphone').value.trim();
    if (!name) { toast('اسمت را بنویس', 'info'); sheet.querySelector('#bname').focus(); return; }
    if (phone.replace(/\D/g, '').length < 10) {
      toast('شمارهٔ موبایل درست نیست', 'info'); sheet.querySelector('#bphone').focus(); return;
    }
    setProfile({ name, phone });
    addTicket({
      code: bookingCode(e.id + phone + Date.now()),
      eventId: e.id, qty, name, phone,
      total: e.price * qty,
      at: Date.now(),
    });
    closeSheet();
    toast('رزرو ثبت شد — بلیتت آماده است', 'ticket');
    setTimeout(() => go('/tickets'), 420);
  });
}

/* ------------------------------------------------------------- the view */
export default {
  topbarAt: 300,
  back: true,

  meta(parts) {
    const e = getEvent(parts[1]);
    return { title: e ? e.title : 'رویداد', saveId: e?.id };
  },

  render(parts) {
    const e = getEvent(parts[1]);
    if (!e) {
      return `<section class="view"><div class="empty" style="padding-top:120px">
        <h3>این رویداد پیدا نشد</h3>
        <p>شاید تمام شده یا نشانی‌اش عوض شده.</p>
        <button class="btn btn-quiet" data-act="nav" data-to="/discover" type="button">
          دیدن تقویم</button></div></section>`;
    }
    const mine = ticketsFor(e.id);
    const seats = mine.reduce((n, t) => n + t.qty, 0);
    const others = upcoming().filter((x) => x.id !== e.id).slice(0, 6);

    return `
<section class="view" data-event="${e.id}">
  <header class="ev-hero">
    <img ${shot(e.img, '(max-width:520px) 100vw, 520px')} alt="${esc(e.title)}" fetchpriority="high">
    <div class="hero-scrim"></div>
    <div class="ev-nav">
      <button class="ev-round" data-act="back" type="button" aria-label="بازگشت">
        ${icon('back', 19)}</button>
      <div style="display:flex;gap:9px">
        <button class="ev-round" data-act="share" data-id="${e.id}" type="button"
                aria-label="هم‌رسانی">${icon('share', 19)}</button>
        <button class="ev-round ${isSaved(e.id) ? 'on' : ''}" data-act="save" data-id="${e.id}"
                type="button" aria-label="ذخیره">${icon('bookmark', 19)}</button>
      </div>
    </div>
    <div class="ev-caption">
      <span class="hero-chip">${e.cat.emo} ${esc(e.cat.name)}، ${esc(e.when)}</span>
      <h1>${esc(e.title)}</h1>
    </div>
  </header>

  ${factRow(e)}

  <div class="section" style="margin-top:22px">
    <div class="hostcard">
      <span class="av"><img src="assets/icons/icon-192.png" alt=""></span>
      <span><b>${esc(BRAND.platform)}</b><span>میزبان، ${esc(e.level)}</span></span>
      <a class="btn btn-quiet btn-sm" href="${BRAND.instagramUrl}" target="_blank" rel="noopener">
        ${icon('instagram', 16)}</a>
    </div>
  </div>

  <div class="section">
    <div class="prose">
      <p><strong>${esc(e.lede)}</strong></p>
      ${e.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
  </div>

  <div class="section">
    <div class="h3">چی یاد می‌گیری</div>
    <ul class="learn">
      ${e.learn.map((l) => `<li><i>${icon('check', 13)}</i><span>${esc(l)}</span></li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <div class="h3">چی با توست، چی با ما</div>
    <ul class="learn">
      ${e.includes.map((l) => `<li><i>${icon('spark', 13)}</i><span>${esc(l)}</span></li>`).join('')}
      <li><i>${icon('info', 13)}</i><span>فقط خودت را بیاور — بقیه‌اش آماده است.</span></li>
    </ul>
  </div>

  ${e.gallery?.length ? `
  <div class="section">
    <div class="h3">از دوره‌های قبل</div>
    <div class="gallery">
      ${e.gallery.map((g) => `<img ${shot(g, '132px')} alt="" loading="lazy" decoding="async">`).join('')}
    </div>
  </div>` : ''}

  <div class="section">
    <div class="h3">کجا</div>
    <div class="mapcard">
      <div class="mapcard-top"><div class="mapcard-pin">${icon('pin', 17)}</div></div>
      <div class="mapcard-body">
        <div><b>${esc(BRAND.address)}</b><span>${esc(BRAND.addressNote)}</span></div>
        ${icon('fwd', 18)}
      </div>
    </div>
  </div>

  ${seats ? `
  <div class="section">
    <div class="h3">بلیت تو</div>
    <div class="pad">
      <button class="erow" data-act="nav" data-to="/tickets" type="button" style="text-align:start">
        <span class="erow-shot" style="display:grid;place-items:center;background:var(--sage-soft);
              color:var(--sage-deep)">${icon('ticket', 26)}</span>
        <span class="erow-body">
          <span class="erow-when">ثبت شده</span>
          <span class="erow-title">${num(seats)} جا رزرو کرده‌ای</span>
          <span class="erow-foot"><b>دیدن بلیت</b></span>
        </span>
      </button>
    </div>
  </div>` : ''}

  <div class="section">
    <div class="section-head"><h2>اینها را هم ببین</h2></div>
    <div class="rail">${others.map((x) => eventCard(x)).join('')}</div>
  </div>

  <div style="height:96px"></div>

  <div class="buybar" id="buybar">
    <div class="buybar-price">
      <b>${e.price ? toman(e.price) : 'رایگان'}</b>
      <span>${e.full ? 'ظرفیت تکمیل شد' : `هر نفر — ${num(e.left)} جای خالی`}</span>
    </div>
    ${e.past
      ? '<span class="btn btn-quiet" aria-disabled="true">برگزار شد</span>'
      : e.full
        ? '<button class="btn btn-quiet" data-act="waitlist" type="button">لیست انتظار</button>'
        : `<button class="btn btn-ink" data-act="book" data-id="${e.id}" type="button">
             ${icon('ticket', 18)} رزرو جا</button>`}
  </div>
</section>`;
  },

  mount(root, signal) {
    const bar = root.querySelector('#buybar');
    if (!bar) return;
    const show = () => bar.classList.toggle('show', window.scrollY > 180);
    show();
    addEventListener('scroll', show, { passive: true, signal });

    root.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act="book"]');
      if (b) { const e = getEvent(b.dataset.id); if (e) bookingSheet(e); }
      if (ev.target.closest('[data-act="waitlist"]')) {
        toast('اسمت در لیست انتظار ثبت شد', 'bell');
      }
    }, { signal });
  },
};
