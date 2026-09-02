/* Small helpers. Persian numerals come from the font (IRANYekanXFaNum) and
   from Intl — nothing here converts digits by hand, and nothing should. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* --------------------------------------------------------------- numbers */
const NF = new Intl.NumberFormat('fa-IR');
export const num = (n) => NF.format(n);
export const toman = (n) => `${NF.format(n)} تومان`;

/* ----------------------------------------------------------------- dates */
const F = (opt) => new Intl.DateTimeFormat('fa-IR', opt);
const fDay = F({ day: 'numeric' });
const fMonth = F({ month: 'long' });
const fWeekday = F({ weekday: 'long' });
const fFull = F({ weekday: 'long', day: 'numeric', month: 'long' });
const fShort = F({ day: 'numeric', month: 'long' });

export function atDay(offset, hour = 0, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}
export const dayOf = (d) => fDay.format(d);
export const monthOf = (d) => fMonth.format(d);
export const weekdayOf = (d) => fWeekday.format(d);
export const fullDate = (d) => fFull.format(d);
export const shortDate = (d) => fShort.format(d);

const startOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const daysFromNow = (d) =>
  Math.round((startOf(d) - startOf(new Date())) / 86400000);

/** "امروز" / "فردا" / "۴ روز دیگر" / "هفتهٔ پیش" — the phrase a person would use. */
export function relDay(d) {
  const n = daysFromNow(d);
  if (n === 0) return 'امروز';
  if (n === 1) return 'فردا';
  if (n === 2) return 'پس‌فردا';
  if (n === -1) return 'دیروز';
  if (n > 0 && n < 7) return `${num(n)} روز دیگر`;
  if (n >= 7 && n < 14) return 'هفتهٔ آینده';
  if (n < 0 && n > -7) return `${num(-n)} روز پیش`;
  if (n <= -7 && n > -14) return 'هفتهٔ پیش';
  if (n < 0) return `${num(Math.round(-n / 7))} هفته پیش`;
  return shortDate(d);
}

/** "۱۷:۰۰ تا ۲۰:۰۰" — the font renders the Latin keystrokes as Persian digits. */
export const timeRange = (from, to) => `${from} تا ${to}`;

/* ------------------------------------------------------------------ misc */
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Deterministic 32-bit hash — seeds the ticket code and its pattern. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Seeded PRNG so a ticket's pattern is the same on every render. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** The scan pattern on a ticket.

   This draws a QR-shaped mark — finder squares, quiet zone, a stable field
   seeded by the booking code — and it is DECORATIVE. A real encoder is
   Reed-Solomon and a few hundred lines, and this preview has nothing behind
   the counter to scan against, so the code beside it is the one that counts.
   Swap in a real encoder when the studio's door app exists. */
export function patternSVG(code, px = 21) {
  const r = rng(hash(code));
  const cells = [];
  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      if (edge || core) cells.push([ox + x, oy + y]);
    }
  };
  finder(0, 0); finder(px - 7, 0); finder(0, px - 7);
  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x >= px - 8 && y < 8) || (x < 8 && y >= px - 8);
  for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
    if (!inFinder(x, y) && r() > 0.55) cells.push([x, y]);
  }
  const rects = cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`).join('');
  return `<svg class="qr" viewBox="-1 -1 ${px + 2} ${px + 2}" shape-rendering="crispEdges"
    role="img" aria-label="کد ورود ${code}"><rect x="-1" y="-1" width="${px + 2}"
    height="${px + 2}" fill="#fff"/><g fill="#17181A">${rects}</g></svg>`;
}

/** JRN-4821 — short, readable over the phone, unique enough for a door list. */
export const bookingCode = (seed) =>
  'JRN-' + String(1000 + (hash(String(seed)) % 9000));
