#!/usr/bin/env python3
"""The check suite for جریان.

Static assertions over the shipped tree, plus a live pass against the running
preview. It does not execute the app — it verifies the things that break
quietly on someone else's phone: a service worker precaching a file that was
renamed, a font that stopped being self-hosted, an <html> that lost its dir,
a Latin comma where Persian numerals need a ٬, an image the markup asks for
and the pipeline never built.

    python3 serve.py &        # then
    python3 e2e.py            # add --offline to skip the HTTP pass
"""

import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
BASE = 'http://localhost:8121'

ok, bad = 0, []


def check(name, cond, detail=''):
    global ok
    if cond:
        ok += 1
    else:
        bad.append(f'{name}{" — " + detail if detail else ""}')


def read(rel):
    p = ROOT / rel
    return p.read_text(encoding='utf-8') if p.exists() else ''


HTML = read('index.html')
CSS = read('css/app.css')
SW = read('sw.js')
MANIFEST = read('manifest.webmanifest')
JS = {p.relative_to(ROOT).as_posix(): p.read_text(encoding='utf-8')
      for p in (ROOT / 'js').rglob('*.js')}
ALLJS = '\n'.join(JS.values())

# --------------------------------------------------------------- the shell
check('index.html exists', bool(HTML))
check('html is rtl/fa', 'dir="rtl"' in HTML and 'lang="fa"' in HTML)
check('viewport covers the notch', 'viewport-fit=cover' in HTML)
check('manifest linked', 'manifest.webmanifest' in HTML)
check('apple touch icon', 'apple-touch-icon' in HTML)
check('theme-color set', 'name="theme-color"' in HTML)
check('og image declared', 'og:image' in HTML)
check('module entry', 'type="module"' in HTML and 'js/app.js' in HTML)
check('noscript fallback', '<noscript>' in HTML)
check('hero poster preloaded', 'hero-poster.webp' in HTML)

# ---------------------------------------------------------------- the type
FONTS = re.findall(r'assets/fonts/([A-Za-z0-9-]+)\.woff2', CSS)
check('fonts are self-hosted', len(FONTS) >= 5, f'{len(FONTS)} faces')
check('no Google Fonts', 'fonts.googleapis' not in CSS and 'fonts.googleapis' not in HTML)
check('Persian body face is FaNum',
      any(f.startswith('IRANYekanXFaNum') for f in FONTS))
check('Latin face is the plain cut', 'IRANYekanX-Medium' in CSS)
for f in set(FONTS):
    check(f'font file {f}', (ROOT / 'assets' / 'fonts' / f'{f}.woff2').exists())
check('no JS digit conversion',
      not re.search(r"replace\(/\[0-9\]/", ALLJS),
      'the FaNum face does this itself')

# ------------------------------------------------------------- the catalogue
DATA = read('js/data.js')
EV_IDS = re.findall(r"^\s*id: '([a-z0-9-]+)',$", DATA, re.M)
check('events defined', len(EV_IDS) >= 7, f'{len(EV_IDS)} events')
check('event ids unique', len(EV_IDS) == len(set(EV_IDS)))
check('dates are day offsets, not timestamps',
      'day:' in DATA and '20' + '26-' not in DATA)
check('placeholder pricing is flagged', 'PLACEHOLDER' in DATA)

IMGS = set(re.findall(r"img: '([a-z-]+)'", DATA)
           + re.findall(r"wide: '([a-z-]+)'", DATA)
           + re.findall(r"'([a-z-]+)'", re.search(
               r'gallery: \[(.*?)\]', DATA, re.S).group(1) if 'gallery' in DATA else ''))
GALLERY = set(g for m in re.findall(r'gallery: \[([^\]]*)\]', DATA)
              for g in re.findall(r"'([a-z-]+)'", m))
for name in sorted(IMGS | GALLERY):
    for w in (480, 960):
        check(f'image {name}-{w}.webp',
              (ROOT / 'assets' / 'img' / f'{name}-{w}.webp').exists())

# ------------------------------------------------------------ the RTL rules
check('no Latin-comma thousands in copy',
      not re.search(r'[۰-۹],[۰-۹]', ALLJS + HTML))
check('middot never sits beside numerals',
      ' · ' not in ALLJS,
      'a middot and ۰ are the same circle at body size')
check('Intl does the money', "Intl.NumberFormat('fa-IR')" in read('js/util.js'))
check('Intl does the calendar', "'fa-IR'" in read('js/util.js')
      and 'DateTimeFormat' in read('js/util.js'))
check('ZWNJ used in compounds', '‌' in DATA, 'نیم‌فاصله')
check('latin runs are isolated', "class=\"ltr\"" in ALLJS and '.ltr{' in CSS)
check('keypad is not mirrored', 'direction:ltr' in CSS)

# ---------------------------------------------------------------- the glass
check('backdrop-filter used', 'backdrop-filter' in CSS)
check('backdrop-filter has a fallback', '@supports not' in CSS)
check('safe-area insets', 'safe-area-inset-bottom' in CSS)
check('reduced motion honoured', 'prefers-reduced-motion' in CSS)
check('tab pill animates on a spring', '--spring' in CSS and '.tab-pill' in CSS)

# -------------------------------------------------------- the service worker
SHELL_SRC = re.search(r'const SHELL = \[(.*?)\];', SW, re.S)
PRECACHE = re.findall(r"'([^']+)'", SHELL_SRC.group(1)) if SHELL_SRC else []
check('sw precaches the shell', len(PRECACHE) >= 15, f'{len(PRECACHE)} entries')
for rel in PRECACHE:
    if rel in ('./',):
        continue
    check(f'precached {rel}', (ROOT / rel).exists())
check('sw skips ranged video', 'range' in SW and 'video' in SW)
check('sw handles navigations', "'navigate'" in SW)
check('every js module is precached',
      all(f in PRECACHE for f in JS), 'a missed module breaks offline boot')

# -------------------------------------------------------------- the manifest
try:
    M = json.loads(MANIFEST)
    check('manifest parses', True)
    check('manifest is rtl/fa', M.get('dir') == 'rtl' and M.get('lang') == 'fa-IR')
    check('manifest standalone', M.get('display') == 'standalone')
    check('manifest has a maskable icon',
          any('maskable' in (i.get('purpose') or '') for i in M['icons']))
    for i in M['icons']:
        check(f"icon {i['src']}", (ROOT / i['src']).exists())
    check('splash matches the boot veil', M.get('background_color') == '#93AE9B')
except Exception as e:                                    # noqa: BLE001
    check('manifest parses', False, str(e))

# ------------------------------------------------------------------- weight
def kb(p):
    return (ROOT / p).stat().st_size / 1024 if (ROOT / p).exists() else 0


check('hero clip under 2MB', kb('media/hero.mp4') < 2048, f'{kb("media/hero.mp4"):.0f}KB')
check('hero poster under 80KB', kb('media/hero-poster.webp') < 80)
check('css under 60KB', kb('css/app.css') < 60, f'{kb("css/app.css"):.0f}KB')
photos = sum(f.stat().st_size for f in (ROOT / 'assets' / 'img').glob('*.webp')) / 1024
check('photos under 1.2MB total', photos < 1200, f'{photos:.0f}KB')

# ------------------------------------------------------------------- rails
SECRETS = re.compile(r'(api[_-]?key|secret|passwd|password\s*=|Bearer\s|sk-[A-Za-z0-9]{16})', re.I)
for rel, body in list(JS.items()) + [('index.html', HTML), ('sw.js', SW)]:
    check(f'no secrets in {rel}', not SECRETS.search(body))
check('no nested interactive cards',
      'role="button" tabindex' not in ALLJS,
      'a button inside a button is unreachable by keyboard')
check('every icon button is labelled',
      ALLJS.count('aria-label') >= 8)

# ---------------------------------------------------------------- live pass
if '--offline' not in sys.argv:
    def get(path):
        with urllib.request.urlopen(BASE + path, timeout=4) as r:
            return r.status, r.headers.get('Content-Type', ''), r.read()

    try:
        s, ct, body = get('/')
        check('server answers', s == 200)
        check('served html is rtl', b'dir="rtl"' in body)
        for path, kind in [('/css/app.css', 'css'), ('/js/app.js', 'javascript'),
                           ('/manifest.webmanifest', 'json'),
                           ('/media/hero.mp4', 'video'),
                           ('/assets/fonts/IRANYekanXFaNum-Regular.woff2', 'font'),
                           ('/assets/img/tiramisu-480.webp', 'image'),
                           ('/assets/icons/icon-512.png', 'image'),
                           ('/sw.js', 'javascript')]:
            st, ctype, _ = get(path)
            check(f'GET {path}', st == 200 and kind in ctype, f'{st} {ctype}')
    except urllib.error.URLError as e:
        check('server answers', False, f'{e} — start it with python3 serve.py')

# ------------------------------------------------------------------ report
print(f'\n  {ok} passed, {len(bad)} failed\n')
for b in bad:
    print(f'  ✗ {b}')
sys.exit(1 if bad else 0)
