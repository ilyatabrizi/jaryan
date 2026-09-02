import { CATEGORIES } from '../data.js';
import { icon } from '../icons.js';
import { esc, num } from '../util.js';
import { upcoming, pastEvents, eventCard, empty } from '../ui.js';
import { go, parse } from '../router.js';

const norm = (s) => String(s || '').trim().toLowerCase();

/* Typing must not re-run the router: a full re-render per keystroke throws
   the caret out of the field. Only this block is replaced. */
function results(list, past) {
  return `
  ${list.length ? `
    <div class="results-note">${num(list.length)} رویداد پیدا شد</div>
    <div class="grid2">${list.map((e) => eventCard(e, { wide: true })).join('')}</div>
  ` : empty('search', 'چیزی پیدا نشد',
      'فیلترها را بردار یا یک کلمهٔ دیگر امتحان کن.',
      '<button class="btn btn-quiet" type="button" data-act="cat" data-c="">دیدن همهٔ رویدادها</button>')}

  ${past.length ? `
  <div class="section">
    <div class="section-head"><h2>برگزارشده</h2></div>
    <div class="section-sub">دوره‌های قبلی — معمولاً دوباره تکرار می‌شوند.</div>
    <div class="grid2">${past.map((e) => eventCard(e, { wide: true })).join('')}</div>
  </div>` : ''}`;
}

function match(e, q, cat) {
  if (cat && e.cat.id !== cat) return false;
  if (!q) return true;
  const hay = `${e.title} ${e.lede} ${e.cat.name} ${e.level} ${e.learn.join(' ')}`;
  return norm(hay).includes(norm(q));
}

export default {
  title: 'کاوش',
  topbarAt: 70,
  tab: 'discover',

  render() {
    const { q } = parse();
    const cat = q.get('c') || '';
    const term = q.get('q') || '';
    const list = upcoming().filter((e) => match(e, term, cat));
    const past = pastEvents().filter((e) => match(e, term, cat));

    return `
<section class="view">
  <div style="padding:calc(var(--safe-t) + 24px) 0 18px">
    <div class="section-head"><h2 style="font-size:26px">کاوش</h2></div>
    <div class="section-sub">${num(upcoming().length)} رویداد پیش رو در تبریز</div>

    <div class="searchwrap">
      <label class="search">
        ${icon('search', 18)}
        <input id="q" type="search" value="${esc(term)}" placeholder="عطر، تیرامیسو، شب فیلم…"
               enterkeyhint="search" autocomplete="off">
        <button type="button" data-act="clear-q" ${term ? '' : 'hidden'}
                aria-label="پاک کردن">${icon('close', 17)}</button>
      </label>
    </div>

    <div class="chiprow">
      <button class="chip ${cat ? '' : 'on'}" type="button" data-act="cat" data-c="">همه</button>
      ${CATEGORIES.map((c) => `
        <button class="chip ${cat === c.id ? 'on' : ''}" type="button"
                data-act="cat" data-c="${c.id}">
          <span class="emo">${c.emo}</span>${esc(c.name)}
        </button>`).join('')}
    </div>
  </div>

  <div id="results">${results(list, past)}</div>

  <div style="height:20px"></div>
</section>`;
  },

  mount(root, signal) {
    const input = root.querySelector('#q');
    const box = root.querySelector('#results');
    const clear = root.querySelector('[data-act="clear-q"]');
    if (!input || !box) return;

    const apply = () => {
      const term = input.value.trim();
      const cat = parse().q.get('c') || '';
      box.innerHTML = results(
        upcoming().filter((e) => match(e, term, cat)),
        pastEvents().filter((e) => match(e, term, cat)),
      );
      clear.hidden = !term;
      const params = new URLSearchParams();
      if (cat) params.set('c', cat);
      if (term) params.set('q', term);
      const qs = params.toString();
      history.replaceState(null, '', '#/discover' + (qs ? '?' + qs : ''));
    };

    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 160); },
      { signal });
    input.addEventListener('search', apply, { signal });
    clear.addEventListener('click', () => { input.value = ''; apply(); input.focus(); },
      { signal });
    signal.addEventListener('abort', () => clearTimeout(t), { once: true });

    if (input.value) {
      const end = input.value.length;
      input.focus({ preventScroll: true });
      input.setSelectionRange(end, end);
    }
  },
};
