import { BRAND } from '../config.js';
import { ABOUT, FAQ } from '../data.js';
import { icon } from '../icons.js';
import { WORDMARK } from '../wordmark.js';
import { esc, num } from '../util.js';
import { getEvent, openSheet, closeSheet, toast, siteFoot } from '../ui.js';
import { state, setProfile } from '../store.js';

const initial = (name) => (name || 'ج').trim().charAt(0) || 'ج';

function editSheet() {
  const sheet = openSheet(`
    <h2>مشخصات تو</h2>
    <p class="lede">فقط روی همین گوشی ذخیره می‌شود.</p>
    <div class="field"><label for="pname">نام</label>
      <input id="pname" type="text" value="${esc(state.profile.name)}" placeholder="نام و نام خانوادگی"></div>
    <div class="field"><label for="pphone">موبایل</label>
      <input id="pphone" type="tel" inputmode="numeric" value="${esc(state.profile.phone)}"
             placeholder="۰۹۱۴ ۱۲۳ ۴۵۶۷"></div>
    <button class="btn btn-ink btn-block" id="psave" type="button">ذخیره</button>`);
  sheet.querySelector('#psave').addEventListener('click', () => {
    setProfile({
      name: sheet.querySelector('#pname').value.trim(),
      phone: sheet.querySelector('#pphone').value.trim(),
    });
    closeSheet();
    toast('ذخیره شد');
    setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 380);
  });
}

function aboutSheet() {
  openSheet(`
    <div style="width:120px;margin:6px auto 18px">${WORDMARK}</div>
    <h2 style="text-align:center">دربارهٔ جریان</h2>
    <div class="prose" style="padding:14px 0 4px">
      ${ABOUT.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    <div class="h3" style="padding:0;margin:18px 0 12px">سؤال‌های پرتکرار</div>
    <div class="prose" style="padding:0">
      ${FAQ.map((f) => `<p><strong>${esc(f.q)}</strong><br>${esc(f.a)}</p>`).join('')}
    </div>
    <a class="btn btn-blush btn-block" href="${BRAND.instagramUrl}" target="_blank" rel="noopener">
      ${icon('instagram', 18)} <span class="ltr">@${esc(BRAND.instagram)}</span></a>
    <div style="height:9px"></div>
    <button class="btn btn-quiet btn-block" data-act="sheet-close" type="button">بستن</button>`);
}

export default {
  title: 'پروفایل',
  topbarAt: 90,
  tab: 'profile',

  render() {
    const p = state.profile;
    const tickets = state.tickets;
    const seats = tickets.reduce((n, t) => n + t.qty, 0);
    const attended = tickets.filter((t) => getEvent(t.eventId)?.past).length;

    return `
<section class="view">
  <div class="pro-head">
    <div class="pro-av">
      ${esc(initial(p.name))}
      <button class="edit" data-act="edit-profile" type="button" aria-label="ویرایش">
        ${icon('edit', 14)}</button>
    </div>
    <h1 class="pro-name">${esc(p.name || 'مهمان جریان')}</h1>
    <div class="pro-sub">${p.phone
      ? esc(p.phone)
      : 'شماره‌ات را اضافه کن تا بلیت‌ها به اسمت بخورد'}</div>
  </div>

  <div class="pro-stats">
    <div><b>${num(seats)}</b><span>جای رزروشده</span></div>
    <div><b>${num(state.saved.length)}</b><span>ذخیره‌شده</span></div>
    <div><b>${num(attended)}</b><span>رویداد رفته</span></div>
  </div>

  <div class="section" style="margin-top:22px">
    <div class="menu">
      <button class="mrow" data-act="nav" data-to="/tickets" type="button">
        <i>${icon('ticket', 17)}</i><b>بلیت‌های من<em>${num(tickets.length)} رزرو</em></b>
        <span class="go">${icon('fwd', 16)}</span></button>
      <button class="mrow" data-act="nav" data-to="/saved" type="button">
        <i>${icon('bookmark', 17)}</i><b>ذخیره‌ها<em>${num(state.saved.length)} رویداد</em></b>
        <span class="go">${icon('fwd', 16)}</span></button>
      <button class="mrow" data-act="edit-profile" type="button">
        <i>${icon('user', 17)}</i><b>مشخصات و شماره</b>
        <span class="go">${icon('fwd', 16)}</span></button>
    </div>

    <div class="menu">
      <button class="mrow" data-act="about" type="button">
        <i>${icon('info', 17)}</i><b>دربارهٔ جریان<em>و سؤال‌های پرتکرار</em></b>
        <span class="go">${icon('fwd', 16)}</span></button>
      <a class="mrow" href="${BRAND.instagramUrl}" target="_blank" rel="noopener">
        <i>${icon('instagram', 17)}</i><b>اینستاگرام<em><span class="ltr">@${esc(BRAND.instagram)}</span></em></b>
        <span class="go">${icon('fwd', 16)}</span></a>
      <button class="mrow" data-act="install" type="button">
        <i>${icon('download', 17)}</i><b>افزودن به صفحهٔ خانه<em>مثل یک اپ باز می‌شود</em></b>
        <span class="go">${icon('fwd', 16)}</span></button>
    </div>

    <div class="menu">
      <button class="mrow" data-act="nav" data-to="/host" type="button">
        <i style="background:var(--sage-soft);color:var(--sage-deep)">${icon('lock', 17)}</i>
        <b>ورود میزبان<em>پنل تیم جریان</em></b>
        <span class="go">${icon('fwd', 16)}</span></button>
      <button class="mrow" data-act="reset" type="button">
        <i>${icon('logout', 17)}</i><b>پاک کردن اطلاعات این گوشی</b>
        <span class="go">${icon('fwd', 16)}</span></button>
    </div>
  </div>

  ${siteFoot(WORDMARK, 'نمونهٔ اولیه برای بررسی — نسخهٔ ۱')}
</section>`;
  },

  mount(root, signal) {
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="edit-profile"]')) editSheet();
      if (e.target.closest('[data-act="about"]')) aboutSheet();
    }, { signal });
  },
};
