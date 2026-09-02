#!/usr/bin/env python3
"""Everything the client sent -> everything the app ships.

Ten phone photos and one 4.4MB portrait reel arrive from the studio. The app
has to open on a phone in Tabriz, on Iranian mobile data, first try. So:

  photos   -> WebP at 480 / 960, cropped to the ratio each surface asks for
  hero     -> a trimmed, silent, 576-wide H.264 loop + a WebP poster
  icons    -> the traced wordmark on the sage ground, 180/192/512/1024
  og       -> a 1200x630 share card

    python3 scripts/build_assets.py            # everything
    python3 scripts/build_assets.py photos     # or one stage

Pillow + imageio-ffmpeg + the system Chrome (for the SVG rasters).
"""

import pathlib
import shutil
import subprocess
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "media" / "raw"
IMG = ROOT / "assets" / "img"
ICONS = ROOT / "assets" / "icons"
MEDIA = ROOT / "media"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

SAGE = "#93AE9B"
BLUSH = "#FDBCB9"

# the studio's filenames are timestamps; these are what the app calls them
PHOTOS = {
    "photo_1405-06-11 21.45.45.jpeg": ("splash-poster", (4, 5)),
    "photo_1405-06-11 21.45.47.jpeg": ("perfume-hands", (4, 5)),
    "photo_1405-06-11 21.45.49.jpeg": ("workshop-table", (3, 2)),
    "photo_1405-06-11 21.45.51.jpeg": ("summer", (4, 5)),
    "photo_1405-06-11 21.45.53.jpeg": ("fashion", (4, 5)),
    "photo_1405-06-11 21.45.55.jpeg": ("movie", (4, 5)),
    "photo_1405-06-11 21.45.56.jpeg": ("balloon", (4, 5)),
    "photo_1405-06-11 21.45.59.jpeg": ("perfume-table", (4, 5)),
    "photo_1405-06-11 21.46.00.jpeg": ("tiramisu", (4, 5)),
}
WIDTHS = (480, 960)

HERO_START = 4.6      # the studio burned "Tiramisu Workshop" over the first seconds
HERO_LEN = 15.2
HERO_W = 640


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def crop_to(im, ratio):
    """Centre crop, biased a little above centre — faces and hands sit high in
    every one of these frames."""
    tw, th = ratio
    w, h = im.size
    if w * th > h * tw:
        nw = round(h * tw / th)
        box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = round(w * th / tw)
        top = round((h - nh) * 0.38)
        box = (0, top, w, top + nh)
    return im.crop(box)


# ----------------------------------------------------------------- photos
def build_photos():
    IMG.mkdir(parents=True, exist_ok=True)
    total = 0
    for src, (name, ratio) in PHOTOS.items():
        p = RAW / src
        if not p.exists():
            print(f"  ! missing {src}")
            continue
        im = Image.open(p).convert("RGB")
        base = crop_to(im, ratio)
        for w in WIDTHS:
            if w > base.width * 1.05:
                continue
            out = IMG / f"{name}-{w}.webp"
            r = base.resize((w, round(base.height * w / base.width)), Image.LANCZOS)
            r.save(out, "WEBP", quality=80, method=6)
            total += out.stat().st_size
        print(f"  {name:<15} {ratio[0]}:{ratio[1]}  {base.size[0]}x{base.size[1]}")
    print(f"  photos     {total/1024:.0f}KB total")


# ------------------------------------------------------------------- hero
def build_hero():
    MEDIA.mkdir(parents=True, exist_ok=True)
    src = RAW / "hero-raw.mp4"
    if not src.exists():
        sys.exit(f"missing {src}")
    ff = ffmpeg()
    out = MEDIA / "hero.mp4"
    subprocess.run([
        ff, "-y", "-loglevel", "error",
        "-ss", str(HERO_START), "-t", str(HERO_LEN), "-i", str(src),
        "-an",                                   # no audio: it autoplays muted anyway
        "-vf", f"scale={HERO_W}:-2:flags=lanczos",
        "-c:v", "libx264", "-profile:v", "main", "-preset", "slow",
        "-crf", "31", "-pix_fmt", "yuv420p",
        "-g", "60", "-movflags", "+faststart",
        str(out),
    ], check=True)

    poster = MEDIA / "hero-poster.webp"
    tmp = MEDIA / "_poster.png"
    subprocess.run([
        ff, "-y", "-loglevel", "error", "-ss", "0.6", "-i", str(out),
        "-frames:v", "1", str(tmp),
    ], check=True)
    Image.open(tmp).convert("RGB").save(poster, "WEBP", quality=72, method=6)
    tmp.unlink()
    print(f"  hero.mp4         {out.stat().st_size/1024:.0f}KB")
    print(f"  hero-poster      {poster.stat().st_size/1024:.0f}KB")


# ------------------------------------------------------------------ icons
def shoot(html, png, w, h):
    """Chrome is the only renderer on this machine that gets SVG right.

    Headless Chrome clamps its window to roughly 500px, so a --window-size of
    180 does not shrink the page — it crops it. Everything is shot at 4x the
    long edge (never under 1200) and resampled down, which is sharper anyway."""
    scale = max(1, -(-1200 // max(w, h)))
    sw, sh = w * scale, h * scale
    tmp = MEDIA / "_shot.html"
    tmp.write_text(html, encoding="utf-8")
    subprocess.run([
        CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1",
        f"--screenshot={png}", f"--window-size={sw},{sh}",
        "--default-background-color=00000000", str(tmp),
    ], check=True, capture_output=True)
    tmp.unlink()
    if scale > 1:
        Image.open(png).resize((w, h), Image.LANCZOS).save(png)


def build_icons():
    ICONS.mkdir(parents=True, exist_ok=True)
    mark = (ROOT / "assets" / "brand" / "mark.svg").read_text(encoding="utf-8")
    wm = (ROOT / "assets" / "brand" / "wordmark.svg").read_text(encoding="utf-8")

    # The app icon is the whole wordmark on the sage ground — the same face the
    # studio already wears on Instagram. Never an initial.
    css = ("<style>*{margin:0;box-sizing:border-box}"
           "html,body{width:100%;height:100%}"
           "svg{display:block;width:100%;height:100%}</style>")
    page = (f"<html>{css}<body style='background:{SAGE}'>{mark}</body></html>")
    for size in (180, 192, 512, 1024):
        png = ICONS / f"icon-{size}.png"
        shoot(page, png, size, size)
        print(f"  icon-{size}.png    {png.stat().st_size/1024:.0f}KB")

    # Maskable: the same ground, the mark pulled in to the 80% safe circle.
    mpage = (f"<html>{css}<body style='background:{SAGE};display:grid;"
             f"place-items:center'><div style='width:70%'>{wm}</div></body></html>")
    png = ICONS / "maskable-512.png"
    shoot(mpage, png, 512, 512)
    print(f"  maskable-512     {png.stat().st_size/1024:.0f}KB")

    # Favicon: 32px, the mark alone.
    shoot(page, ICONS / "favicon-32.png", 32, 32)

    # Share card.
    og = (f"<html>{css}<body style='background:{SAGE};display:flex;"
          "flex-direction:column;align-items:center;justify-content:center;"
          "gap:34px;font-family:system-ui'>"
          f"<div style='width:44%'>{wm}</div>"
          "<div style='color:#f7f2ee;font-size:30px;letter-spacing:.22em;"
          "opacity:.88'>TABRIZ &nbsp;&middot;&nbsp; VALIASR</div>"
          "</body></html>")
    shoot(og, IMG / "og.png", 1200, 630)
    Image.open(IMG / "og.png").convert("RGB").save(IMG / "og.jpg", quality=88)
    (IMG / "og.png").unlink()
    print(f"  og.jpg           {(IMG/'og.jpg').stat().st_size/1024:.0f}KB")


STAGES = {"photos": build_photos, "hero": build_hero, "icons": build_icons}

if __name__ == "__main__":
    want = sys.argv[1:] or list(STAGES)
    for s in want:
        if s not in STAGES:
            sys.exit(f"unknown stage {s} — pick from {', '.join(STAGES)}")
        print(f"[{s}]")
        STAGES[s]()
