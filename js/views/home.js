import { BRAND } from '../config.js';
import { CATEGORIES } from '../data.js';
import { icon } from '../icons.js';
import { WORDMARK } from '../wordmark.js';
import { esc, num, toman } from '../util.js';
import { upcoming, eventCard, eventRow, shot, siteFoot } from '../ui.js';
import { mountHero } from '../hero.js';

export default {
  title: BRAND.name,
  topbarAt: 260,
  tab: 'home',

  render() {
    const list = upcoming();
    const week = list.slice(0, 5);
    const rest = list.slice(5);
    const feature = list.find((e) => e.id === 'summer') || list[list.length - 1];

    return `
<section class="view">

  <header class="hero">
    <img class="hero-poster" src="media/hero-poster.webp" alt="" aria-hidden="true">
    <video src="media/hero.mp4" poster="media/hero-poster.webp" muted loop playsinline
           preload="metadata" disablepictureinpicture aria-hidden="true"></video>
    <div class="hero-scrim"></div>
    <div class="hero-grain" aria-hidden="true"></div>

    <div class="hero-body">
      <div class="hero-top">
        <div class="hero-mark">${WORDMARK}</div>
        <span class="hero-chip">${icon('pin', 14)} ${esc(BRAND.city)}، ${esc(BRAND.area)}</span>
      </div>

      <div class="hero-copy">
        <div class="hero-kicker">${esc(BRAND.tagline)}</div>
        <h1>یک عصر بیا،<br>با یک <em>مهارت تازه</em> برو.</h1>
        <p class="hero-lede">ورکشاپ، شب فیلم و دورهمی — ظرفیت کوچک، آدم‌های تازه، همه در
          فضای خودمان در ولیعصر.</p>
        <div class="hero-cta">
          <button class="btn btn-blush" data-act="nav" data-to="/discover" type="button">
            ${icon('compass', 18)} برنامهٔ این هفته
          </button>
          <button class="btn btn-glass" data-act="scroll-next" type="button">
            ${num(list.length)} رویداد پیش رو
          </button>
        </div>
      </div>
    </div>
    <div class="hero-scroll" aria-hidden="true"></div>
  </header>

  <div id="afterHero"></div>

  <div class="section" style="margin-top:26px">
    <div class="section-head">
      <h2>نزدیک‌ترین‌ها</h2>
      <button class="more" data-act="nav" data-to="/discover" type="button">همه</button>
    </div>
    <div class="rail">${week.map((e) => eventCard(e)).join('')}</div>
  </div>

  <div class="section">
    <div class="section-head"><h2>دنبال چی می‌گردی؟</h2></div>
    <div class="cats">
      ${CATEGORIES.map((c) => `
        <button class="cat" style="--tint:${c.tint}" type="button"
                data-act="nav" data-to="/discover?c=${c.id}">
          <span class="emo">${c.emo}</span>
          <b>${esc(c.name)}</b>
          <span>${num(upcoming().filter((e) => e.cat.id === c.id).length)} برنامه، ${esc(c.note)}</span>
        </button>`).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>برنامهٔ ویژهٔ فصل</h2></div>
    <button class="feature" data-act="open" data-id="${feature.id}" type="button">
      <img ${shot(feature.wide || feature.img, '(max-width:520px) 92vw, 484px')} alt="${esc(feature.title)}"
           loading="lazy" decoding="async">
      <span class="feature-scrim"></span>
      <span class="feature-body">
        <h3>${esc(feature.title)}</h3>
        <p>${esc(feature.lede)}</p>
        <span class="btn btn-glass btn-sm">${esc(feature.when)}، ${toman(feature.price)}</span>
      </span>
    </button>
  </div>

  ${rest.length ? `
  <div class="section">
    <div class="section-head"><h2>بقیهٔ تقویم</h2></div>
    <div class="pad">${rest.map(eventRow).join('')}</div>
  </div>` : ''}

  <div class="section">
    <div class="install">
      <i><img src="assets/icons/icon-192.png" alt=""></i>
      <div>
        <b>جریان را روی صفحهٔ گوشی داشته باش</b>
        <span>بدون نصب از فروشگاه، مثل یک اپ باز می‌شود.</span>
      </div>
      <button class="btn btn-ink btn-sm" data-act="install" type="button">افزودن</button>
    </div>
  </div>

  ${siteFoot(WORDMARK, 'نمونهٔ اولیه — قیمت‌ها و تاریخ‌ها آزمایشی است.')}
</section>`;
  },

  mount(root, signal) {
    const stop = mountHero(root);
    signal.addEventListener('abort', stop, { once: true });
    root.querySelector('[data-act="scroll-next"]')?.addEventListener('click', () => {
      root.querySelector('#afterHero')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, { signal });
  },
};
