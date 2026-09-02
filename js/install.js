/* Add to Home Screen.

   Chrome hands over a beforeinstallprompt event; iOS Safari never will, and
   that is where most of this audience lives — so the fallback is the actual
   three-step instruction with the right icon, not a dead button. */
import { openSheet, toast } from './ui.js';

let deferred = null;

addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
addEventListener('appinstalled', () => { deferred = null; toast('نصب شد', 'check'); });

export const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export async function promptInstall() {
  if (standalone()) { toast('همین حالا هم نصب است', 'check'); return; }
  if (deferred) {
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome !== 'accepted') toast('هر وقت خواستی از پروفایل اضافه کن');
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  openSheet(`
    <h2>افزودن به صفحهٔ خانه</h2>
    <p class="lede">جریان بدون فروشگاه نصب می‌شود و مثل یک اپ باز می‌شود.</p>
    <ul class="learn" style="padding:0">
      ${(ios ? [
        'در نوار پایین سافاری، دکمهٔ هم‌رسانی را بزن.',
        'گزینهٔ «Add to Home Screen» را انتخاب کن.',
        'روی «Add» بزن — آیکن جریان روی صفحه می‌نشیند.',
      ] : [
        'منوی مرورگر (سه نقطه) را باز کن.',
        'گزینهٔ «Install» یا «افزودن به صفحهٔ اصلی» را بزن.',
        'تأیید کن — آیکن جریان روی صفحه می‌نشیند.',
      ]).map((t, i) => `<li><i>${i + 1}</i><span>${t}</span></li>`).join('')}
    </ul>
    <div style="height:18px"></div>
    <button class="btn btn-ink btn-block" data-act="sheet-close" type="button">باشد</button>`);
}
