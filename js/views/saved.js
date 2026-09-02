import { icon } from '../icons.js';
import { num } from '../util.js';
import { getEvent, eventCard, empty } from '../ui.js';
import { state } from '../store.js';

export default {
  title: 'ذخیره‌ها',
  topbarAt: 70,
  tab: 'saved',

  render() {
    const list = state.saved.map(getEvent).filter(Boolean);
    const live = list.filter((e) => !e.past);
    const gone = list.filter((e) => e.past);

    return `
<section class="view">
  <div style="padding:calc(var(--safe-t) + 24px) 0 18px">
    <div class="section-head"><h2 style="font-size:26px">ذخیره‌ها</h2></div>
    <div class="section-sub">${list.length
      ? `${num(list.length)} رویداد نگه داشته‌ای`
      : 'هرچه را نشان کنی اینجا می‌ماند'}</div>
  </div>

  ${live.length ? `<div class="grid2">${live.map((e) => eventCard(e, { wide: true })).join('')}</div>` : ''}

  ${!list.length ? empty('bookmark', 'هنوز چیزی ذخیره نکرده‌ای',
      'روی نشانک هر کارت بزن تا برنامه اینجا بماند و یادت نرود.',
      '<button class="btn btn-ink" data-act="nav" data-to="/discover" type="button">دیدن تقویم</button>')
    : ''}

  ${gone.length ? `
  <div class="section">
    <div class="section-head"><h2>برگزارشده</h2></div>
    <div class="grid2">${gone.map((e) => eventCard(e, { wide: true })).join('')}</div>
  </div>` : ''}

  <div style="height:20px"></div>
</section>`;
  },
};
