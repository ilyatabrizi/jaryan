#!/usr/bin/env python3
"""Trace the جریان wordmark from the client's raster into layered SVG.

The master is a 4339x2701 RGBA export: flat blush letterforms with a sage
offset shadow showing along the lower-left of every stroke, and hairline white
gaps between the two. Beautiful, and useless at 24px in a tab bar or at 512px
in an app icon.

The mark is drawn with straight facets and true circles (the four dots), so it
traces cleanly: threshold each colour into its own mask, walk the cracks
between ink and space, simplify with Douglas-Peucker, emit polygons. No curve
fitting — the letterforms genuinely have no curves except the dots, and at this
tolerance the dots are already sub-pixel round.

Out:
  assets/brand/wordmark.svg   two <g> layers, sage under blush, recolourable
  assets/brand/mark.svg       the same mark squared up for the icon grid

    python3 scripts/trace_logo.py

Pure stdlib + Pillow + numpy. No potrace on this machine.
"""

import pathlib
import sys

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "src" / "logo.png"
OUT = ROOT / "assets" / "brand"

WORK_W = 2200      # trace width — the sage slivers are ~6px here, enough to hold
EPSILON = 1.4      # Douglas-Peucker tolerance, in working pixels
MIN_AREA = 90      # drop compression speckle along the colour boundary
BLUSH = (253, 188, 185)
SAGE = (147, 174, 155)

sys.setrecursionlimit(200000)


# ---------------------------------------------------------------- masks
def load(path, width):
    im = Image.open(path).convert("RGBA")
    h = round(im.height * width / im.width)
    a = np.asarray(im.resize((width, h), Image.LANCZOS)).astype(int)
    opaque = a[..., 3] > 140
    rgb = a[..., :3]

    def near(ref):
        d = np.abs(rgb - np.array(ref)).sum(axis=2)
        return d

    d_blush, d_sage = near(BLUSH), near(SAGE)
    d_white = np.abs(rgb - 255).sum(axis=2)
    blush = opaque & (d_blush < d_sage) & (d_blush < d_white)
    sage = opaque & (d_sage <= d_blush) & (d_sage < d_white)
    return blush, sage, width, h


def components(mask):
    """4-connected blobs, iterative flood fill (the wordmark is one huge blob
    per glyph — recursion blows the stack)."""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    blobs = []
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy][sx]:
            continue
        stack = [(sx, sy)]
        seen[sy][sx] = True
        cells = []
        while stack:
            x, y = stack.pop()
            cells.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mask[ny][nx]:
                    seen[ny][nx] = True
                    stack.append((nx, ny))
        if len(cells) >= MIN_AREA:
            blobs.append(cells)
    return blobs


# ------------------------------------------------------------- outlines
def trace_outline(cells):
    """Every closed ring bounding a blob — outer edge plus its counters.

    Walks the unit cracks between ink and space, directed so the interior stays
    on one side, then chains them head to tail. Exact where a Moore walk has to
    guess."""
    cellset = set(cells)
    edges = {}
    for x, y in cells:
        if (x, y - 1) not in cellset:
            edges.setdefault((x, y), []).append((x + 1, y))
        if (x + 1, y) not in cellset:
            edges.setdefault((x + 1, y), []).append((x + 1, y + 1))
        if (x, y + 1) not in cellset:
            edges.setdefault((x + 1, y + 1), []).append((x, y + 1))
        if (x - 1, y) not in cellset:
            edges.setdefault((x, y + 1), []).append((x, y))
    rings = []
    while edges:
        start = next(iter(edges))
        ring, node = [start], start
        while True:
            outs = edges.get(node)
            if not outs:
                break
            nxt = outs.pop()
            if not outs:
                del edges[node]
            if nxt == start:
                break
            ring.append(nxt)
            node = nxt
        if len(ring) >= 10:
            rings.append(ring)
    return rings


def _rdp_open(pts, eps):
    if len(pts) < 3:
        return pts
    x1, y1 = pts[0]
    x2, y2 = pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5
    worst, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        dist = (((px - x1) ** 2 + (py - y1) ** 2) ** 0.5 if norm < 1e-9
                else abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm)
        if dist > worst:
            worst, idx = dist, i
    if worst > eps:
        return _rdp_open(pts[:idx + 1], eps)[:-1] + _rdp_open(pts[idx:], eps)
    return [pts[0], pts[-1]]


def rdp(ring, eps):
    """Douglas-Peucker on a closed ring: split at the two farthest points first,
    or every distance is measured against a zero-length line."""
    if len(ring) < 6:
        return ring
    far = max(range(len(ring)),
              key=lambda i: (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2)
    return _rdp_open(ring[:far + 1], eps)[:-1] + _rdp_open(ring[far:] + [ring[0]], eps)[:-1]


def to_path(rings, scale, ox, oy, prec=1):
    out = []
    for ring in rings:
        if len(ring) < 3:
            continue
        p = [((x - ox) * scale, (y - oy) * scale) for x, y in ring]
        d = f"M{p[0][0]:.{prec}f} {p[0][1]:.{prec}f}"
        d += "".join(f"L{x:.{prec}f} {y:.{prec}f}" for x, y in p[1:])
        out.append(d + "Z")
    return "".join(out)


def layer_path(blobs, scale, ox, oy):
    d = []
    for blob in blobs:
        rings = [rdp(ring, EPSILON) for ring in trace_outline(blob)]
        d.append(to_path(rings, scale, ox, oy))
    return "".join(d)


def bbox(cells):
    xs = [x for x, _ in cells]
    ys = [y for _, y in cells]
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


# ------------------------------------------------------------------ main
def main():
    if not SRC.exists():
        sys.exit(f"missing source: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)

    blush_m, sage_m, w, h = load(SRC, WORK_W)
    blush_b = components(blush_m)
    sage_b = components(sage_m)
    if not blush_b:
        sys.exit("no blush found — check the colour references")

    all_cells = [c for b in blush_b + sage_b for c in b]
    x0, y0, x1, y1 = bbox(all_cells)
    bw, bh = x1 - x0, y1 - y0

    # Normalise to a 1000-wide viewBox so CSS sizing is predictable.
    scale = 1000.0 / bw
    vh = round(bh * scale, 1)

    sage_d = layer_path(sage_b, scale, x0, y0)
    blush_d = layer_path(blush_b, scale, x0, y0)

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 {vh}" '
        f'role="img" aria-label="جریان">'
        f'<path class="wm-sage" fill="var(--wm-sage,#93AE9B)" d="{sage_d}"/>'
        f'<path class="wm-blush" fill="var(--wm-blush,#FDBCB9)" d="{blush_d}"/>'
        f'</svg>'
    )
    (OUT / "wordmark.svg").write_text(svg, encoding="utf-8")

    # Square version for the icon grid: the same mark, centred, 78% of the box.
    side = max(bw, bh) / 0.78
    ks = 1000.0 / side
    ox = x0 - (side - bw) / 2
    oy = y0 - (side - bh) / 2
    mark = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" '
        f'role="img" aria-label="جریان">'
        f'<path fill="var(--wm-sage,#93AE9B)" d="{layer_path(sage_b, ks, ox, oy)}"/>'
        f'<path fill="var(--wm-blush,#FDBCB9)" d="{layer_path(blush_b, ks, ox, oy)}"/>'
        f'</svg>'
    )
    (OUT / "mark.svg").write_text(mark, encoding="utf-8")

    # The shell inlines the mark three times (boot veil, hero, footer) and
    # recolours its layers, so it ships as a module rather than a fetch.
    js = ('/* generated by scripts/trace_logo.py — do not edit */\n'
          'export const WORDMARK = `' + svg.replace('`', '\\`') + '`;\n')
    (ROOT / "js" / "wordmark.js").write_text(js, encoding="utf-8")

    print(f"source     {SRC.name}  {w}x{h} working")
    print(f"blobs      blush {len(blush_b)}   sage {len(sage_b)}")
    print(f"wordmark   assets/brand/wordmark.svg  viewBox 0 0 1000 {vh}  {len(svg)/1024:.1f}KB")
    print(f"mark       assets/brand/mark.svg      {len(mark)/1024:.1f}KB")
    print(f"module     js/wordmark.js             {len(js)/1024:.1f}KB")


if __name__ == "__main__":
    main()
