/* The other half of a platform: the studio's own door board.
   A four-digit pad (J-A-R-Y on a phone keypad), then the next event's list —
   who is coming, who has paid, who has walked in. */
import { BRAND } from '../config.js';
import { ATTENDEES } from '../data.js';
import { icon } from '../icons.js';
import { esc, num, toman, fullDate, timeRange } from '../util.js';
import { upcoming, toast } from '../ui.js';
import { state, unlockHost, isChecked, toggleChecked } from '../store.js';

function lockScreen() {
  return `
<section class="view">
  <div class="host-lock">
    <div class="ring">${icon('lock', 26)}</div>
    <h2>ورود میزبان</h2>
    <p>این بخش برای تیم ${esc(BRAND.name)} است — لیست حضور و وضعیت رزروها.</p>
    <div class="pin" id="pin"><span></span><span></span><span></span><span></span></div>
    <div class="keypad" id="pad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
        `<button type="button" data-k="${n}">${n}</button>`).join('')}
      <button type="button" class="wide" data-act="back">بازگشت</button>
      <button type="button" data-k="0">0</button>
      <button type="button" class="wide" data-k="del">پاک</button>
    </div>
  </div>
  <div style="height:40px"></div>
</section>`;
}

function board() {
  const next = upcoming()[0];
  const seats = ATTENDEES.reduce((n, a) => n + a.qty, 0);
  const paid = ATTENDEES.filter((a) => a.paid).reduce((n, a) => n + a.qty * next.price, 0);
  const inside = ATTENDEES.filter((a) => isChecked(a.id)).reduce((n, a) => n + a.qty, 0);

  return `
<section class="view">
  <div class="board-head">
    <div>
      <h1>پنل میزبان</h1>
      <div style="font-size:12.5px;color:var(--ink-3)">${esc(BRAND.platform)}</div>
    </div>
    <button class="btn btn-quiet btn-sm" data-act="host-lock" type="button">
      ${icon('logout', 16)} خروج</button>
  </div>

  <div class="kpis">
    <div class="kpi"><b>${num(seats)}</b><span>جای فروخته‌شده</span></div>
    <div class="kpi"><b>${num(inside)}</b><span>وارد شده</span></div>
    <div class="kpi"><b>${num(next.seats - seats)}</b><span>باقی‌مانده</span></div>
  </div>

  <div class="section" style="margin-top:22px">
    <div class="h3">رویداد بعدی</div>
    <div class="pad">
      <button class="erow" data-act="open" data-id="${next.id}" type="button">
        <span class="erow-shot"><img src="assets/img/${next.img}-480.webp" alt="" loading="lazy"></span>
        <span class="erow-body">
          <span class="erow-when">${esc(fullDate(next.date))}</span>
          <span class="erow-title">${esc(next.title)}</span>
          <span class="erow-foot"><b>${esc(timeRange(next.from, next.to))}</b>
            <span>${esc(BRAND.area)}</span></span>
        </span>
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-head">
      <h2>لیست حضور</h2>
      <span class="more">${num(inside)} از ${num(seats)}</span>
    </div>
    <div class="pad">
      <div class="menu" style="padding:4px 0">
        ${ATTENDEES.map((a) => `
          <div class="att">
            <span class="av">${esc(a.name.charAt(0))}</span>
            <span>
              <b>${esc(a.name)}</b>
              <span>${num(a.qty)} نفر، <span class="ltr">${esc(a.code)}</span>
                ${a.paid ? '' : '، <b style="color:var(--blush-deep)">پرداخت‌نشده</b>'}</span>
            </span>
            <button class="check ${isChecked(a.id) ? 'on' : ''}" data-act="check" data-id="${a.id}"
                    type="button" aria-label="ورود ${esc(a.name)}">${icon('check', 15)}</button>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="h3">جمع امروز</div>
    <div class="pad">
      <div class="tally" style="margin:0">
        <div><span>فروش تأییدشده</span><span>${toman(paid)}</span></div>
        <div><span>پرداخت‌نشده</span><span>${toman(
          ATTENDEES.filter((a) => !a.paid).reduce((n, a) => n + a.qty * next.price, 0))}</span></div>
        <div class="sum"><span>ظرفیت</span><span>${num(seats)} از ${num(next.seats)}</span></div>
      </div>
    </div>
  </div>

  <p class="foot" style="padding-top:22px">داده‌های این پنل نمونه است.</p>
</section>`;
}

export default {
  title: 'میزبان',
  topbarAt: 90,
  tab: 'profile',
  back: true,

  render() { return state.host.unlocked ? board() : lockScreen(); },

  mount(root, signal) {
    if (state.host.unlocked) {
      root.addEventListener('click', (e) => {
        const c = e.target.closest('[data-act="check"]');
        if (c) {
          const on = toggleChecked(c.dataset.id);
          c.classList.toggle('on', on);
          toast(on ? 'وارد شد' : 'برگشت به لیست', on ? 'check' : 'info', 1400);
          const head = root.querySelector('.section-head .more');
          if (head) {
            const seats = ATTENDEES.reduce((n, a) => n + a.qty, 0);
            const inside = ATTENDEES.filter((a) => isChecked(a.id))
              .reduce((n, a) => n + a.qty, 0);
            head.textContent = `${num(inside)} از ${num(seats)}`;
            const kpi = root.querySelectorAll('.kpi b')[1];
            if (kpi) kpi.textContent = num(inside);
          }
        }
        if (e.target.closest('[data-act="host-lock"]')) {
          unlockHost(false);
          toast('از پنل خارج شدی');
          dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }, { signal });
      return;
    }

    const pin = root.querySelector('#pin');
    const cells = [...pin.querySelectorAll('span')];
    let buf = '';
    const draw = () => cells.forEach((c, i) => {
      c.textContent = buf[i] ? '•' : '';
      c.classList.toggle('filled', !!buf[i]);
    });

    root.querySelector('#pad').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'del') buf = buf.slice(0, -1);
      else if (buf.length < 4) buf += k;
      draw();
      if (buf.length === 4) {
        if (buf === BRAND.hostPin) {
          unlockHost(true);
          toast('خوش آمدی', 'check');
          setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 260);
        } else {
          pin.classList.add('bad');
          setTimeout(() => { pin.classList.remove('bad'); buf = ''; draw(); }, 440);
        }
      }
    }, { signal });

    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        root.querySelector(`[data-k="${e.key}"]`)?.click();
      } else if (e.key === 'Backspace') {
        root.querySelector('[data-k="del"]')?.click();
      }
    };
    addEventListener('keydown', onKey, { signal });
  },
};
