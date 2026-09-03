# جریان — Tabriz, Valiasr

An installable Persian web app for **Jaryan**, an event platform in Tabriz:
the calendar, one workshop in full, a seat held in your name, the ticket you
show at the door, and the studio's own board behind a passcode.

**Live:** https://ilyatabrizi.github.io/jaryan/
**Instagram:** [@jaryanplat](https://instagram.com/jaryanplat)
**Host passcode:** `5279` — J‑A‑R‑Y on a phone keypad

---

## Run it

```bash
python3 serve.py          # http://localhost:8121
python3 e2e.py            # 134 checks against the tree and the running preview
```

Static files, no build step, no runtime dependencies. Only the asset pipeline
needs Python (Pillow, imageio-ffmpeg) and the system Chrome.

```bash
python3 scripts/trace_logo.py     # the client's logo PNG -> layered SVG + a JS module
python3 scripts/build_assets.py   # photos -> WebP, the reel -> a silent loop, icons, OG card
python3 scripts/build_assets.py icons   # or one stage at a time
```

The two source folders the pipeline reads — `media/raw/` and `scripts/src/` —
are deliberately **not** committed. They hold the client's originals: a
4339×2701 logo export, ten phone photos, and a 4.4MB reel.

---

## The design

Their two brand colours and nothing else: **blush `#FDBCB9`** for the mark and
every highlight, **sage `#93AE9B`** for structure, ground and the app icon.
Warm paper underneath, and the photographs carry the rest.

| | |
|---|---|
| Page | `#FAF7F4` |
| Card | `#FFFFFF`, hairline edge, soft shadow |
| Ink | `#17181A` — type and every filled control |
| Blush | `#FDBCB9` — the brand; ink sits on it at 13:1 |
| Sage | `#93AE9B`, deep `#4E7059` for type |
| Glass | `rgba(255,255,255,.62)` + `blur(30px) saturate(180%)` |
| Type | IRANYekanX **FaNum** 400/500/600/800/900, self-hosted, 172KB |

Fonts are self-hosted **deliberately** — Google Fonts is slow-to-unreachable
from Iran, and this has to open on a phone in Tabriz on the first try. The
**PWA icon is the whole wordmark** on the sage ground, the same face the studio
already wears on Instagram — never an initial.

### The glass

Three floating bars, all the same material: the **tab bar** (five tabs, a
blush pill that springs between them, a badge that exists only when a ticket
does), a **top bar** that slides in once the hero has scrolled away, and the
**buy bar** on an event page. Sheets are the same glass, dragged up from the
bottom.

### The hero

The studio's own tiramisu reel, trimmed past the caption they burned into the
first four seconds, stripped of audio, cut to 640px wide and 15 seconds —
1.4MB. It pauses when scrolled out of view or the tab is hidden, and under
`prefers-reduced-motion` or a strict autoplay policy the poster simply stands
in for it.

---

## What is in it

| | |
|---|---|
| **خانه** | hero, the nearest events, the five categories, the season's feature, the rest of the calendar |
| **کاوش** | live search and category filters over the whole calendar, past dates included |
| **رویداد** | one workshop: facts, what you learn, what is included, the gallery, where, and a seat |
| **بلیت‌ها** | the tickets you hold, upcoming and archived, each with a code |
| **ذخیره‌ها** | everything you bookmarked |
| **پروفایل** | who you are, your numbers, about, install, and the host door |
| **میزبان** | passcode `5279` — the next event's door list, check-in, capacity, takings |

State lives in one `localStorage` blob. There is no account and no server:
a phone that clears its storage starts fresh.

Both footers come from one `siteFoot()` in `ui.js` and carry the **Alpha
Agency signature** — the black cut of the wordmark master, because this footer
sits on paper rather than on ink, with «طراحی و توسعه در» beside it. Same
lockup as the one on `codeconceptcafe.com`.

---

## The Persian

- `<html dir="rtl" lang="fa">`, mirrored throughout.
- **IRANYekanXFaNum** turns Latin digit keystrokes into ۰–۹ by itself.
  Nothing in the JS converts digits, and nothing should.
- Money and dates come from `Intl` with `fa-IR`, so the thousands mark is ٬
  and the calendar is Jalali — no conversion table to go stale.
- **No middot as a separator.** `·` and `۰` are the same small circle at body
  size, and `۲ نفر · ۱٬۵۶۰٬۰۰۰` reads as if it had an extra zero in it. The
  Persian comma does that job.
- Latin runs (`@jaryanplat`, `JRN-4821`) are wrapped in `.ltr` with the plain
  IRANYekanX cut, or the FaNum face would turn the codes into Persian digits.
- The numeric keypad is forced `direction: ltr` — a phone keypad is never
  mirrored in any locale.

---

## Dates never go stale

Events are stored as **an offset in days from whenever the app is opened**, not
as fixed timestamps:

```js
{ id: 'tiramisu', day: 2, from: '17:00', to: '20:00' }
```

`ui.js` turns that into a real date at read time. The studio can show this
preview for a month and the calendar still reads "پس‌فردا".

---

## Placeholder — replace before anything ships

- **Every price, capacity and seat count.**
- The event copy: written from the photographs, not from the studio.
- The attendee names on the host board.
- The scan pattern on a ticket is **decorative** — a QR-shaped mark seeded by
  the booking code. The human-readable code beside it is the real one. Swap in
  an encoder when there is a scanner at the door.
- The address is `تبریز، خیابان ولیعصر`; the exact one is promised after
  booking because nobody has given it to us yet.

---

## Files

```
index.html            the shell: boot veil, two glass bars, one <main>
css/app.css           the whole design system
js/app.js             boot, routing, the bars, one click delegate
js/router.js          hash routes with a scroll memory
js/ui.js              the derived event model, cards, sheets, toasts, the footer
js/data.js            the catalogue
js/store.js           the localStorage blob
js/util.js            Intl money and Jalali dates, the ticket pattern
js/hero.js            autoplay policy, visibility, reduced motion
js/wordmark.js        generated — the traced mark as a module
js/views/*.js         one file per screen
sw.js                 offline shell; photos and video cache on first sight
scripts/*.py          the asset pipeline
e2e.py                134 checks
```
