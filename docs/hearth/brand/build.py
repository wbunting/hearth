#!/usr/bin/env python3
"""Build hearth brand assets: keyed-arch mark + Fraunces wordmark.

Geometry is traced from the chosen lockup (keyed-arch round 2, image 08):
two charcoal jambs whose tops corbel inward toward a tapered terracotta
keystone that sits slightly above them, leaving a wide fireplace opening.
Mark coordinates are in "ref" units (the mark is 333 x 283); the wordmark is
converted to outlines so no font is needed to display the SVGs.

    python build.py   # writes SVGs + PNG previews next to this file
"""
import os
import re

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = os.path.dirname(os.path.abspath(__file__))  # docs/hearth/brand
FONT = next(
    p
    for p in (
        os.path.expanduser("~/Library/Fonts/Fraunces_9pt_Soft-SemiBold.ttf"),
        "/Library/Fonts/Fraunces_9pt_Soft-SemiBold.ttf",
    )
    if os.path.exists(p)
)

INK = "#2D2B26"        # charcoal
EMBER = "#BF512D"      # terracotta
IVORY = "#F5F0E6"
DARK_BG = "#23241F"
DARK_INK = "#F5F0E6"
DARK_EMBER = "#E17A52"

MW, MH = 333.0, 283.0  # mark box


# ---------------------------------------------------------------- mark
LEFT_JAMB = (
    "M0,38 Q0,26 12,26 "            # outer top corner
    "L104,26 Q108,26 108.8,30 "     # top edge
    "L120.6,89 Q121.4,93 117.6,94.3 "  # inner cut, parallel to the keystone
    "L83,103.6 Q74,106.4 74,116 "   # corbel shoulder steps back to the inner face
    "L74,276 Q74,283 67,283 "       # inner face, small bottom corner
    "L12,283 Q0,283 0,271 Z"        # bottom + outer face
)
KEYSTONE = (
    "M126,0 L207,0 Q213,0 211.9,5.9 "
    "L192.4,106 Q191.6,110 187.6,110 "
    "L145.4,110 Q141.4,110 140.6,106 "
    "L121.1,5.9 Q120,0 126,0 Z"
)


def mirror_x(d: str, w: float = MW) -> str:
    toks = re.findall(r"[MLQZ]|-?\d+(?:\.\d+)?", d)
    out, i = [], 0
    while i < len(toks):
        t = toks[i]
        if t in "MLQZ":
            out.append(t)
            i += 1
        else:
            out.append(f"{w - float(t):g},{float(toks[i + 1]):g}")
            i += 2
    return " ".join(out)


def mark(ink: str, ember: str) -> str:
    return (
        f'<path fill="{ink}" d="{LEFT_JAMB}"/>'
        f'<path fill="{ink}" d="{mirror_x(LEFT_JAMB)}"/>'
        f'<path fill="{ember}" d="{KEYSTONE}"/>'
    )


# ---------------------------------------------------------------- wordmark
def outline(text: str, h_height: float) -> tuple[str, float, float]:
    """Outlines for `text`, scaled so the 'h' is `h_height` tall.

    Returns (path data with baseline at y=0, advance width, left bearing of 'h').
    """
    f = TTFont(FONT)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    bp = BoundsPen(gs)
    gs[cmap[ord("h")]].draw(bp)
    xmin, _, _, ymax = bp.bounds
    s = h_height / ymax
    x, parts = 0.0, []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        parts.append(pen.getCommands())
        x += f["hmtx"][g][0] * s
    return " ".join(parts), x, xmin * s


def doc(w: float, h: float, body: str, bg: str | None = None) -> str:
    rect = f'<rect width="{w:g}" height="{h:g}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" '
        f'width="{w:g}" height="{h:g}" role="img" aria-label="hearth">{rect}{body}</svg>\n'
    )


def mark_svg(ink: str, ember: str, bg: str | None = None, pad: float = 0.0, square: bool = False) -> str:
    w, h = MW + 2 * pad, MH + 2 * pad
    ox, oy = pad, pad
    if square:
        side = max(w, h)
        ox += (side - w) / 2
        oy += (side - h) / 2
        w = h = side
    return doc(w, h, f'<g transform="translate({ox:g},{oy:g})">{mark(ink, ember)}</g>', bg)


def lockup_svg(ink: str, ember: str, word: str, bg: str | None = None) -> str:
    # From the reference: 'h' is 177/283 of the mark height, baseline 228
    # below the mark top, and an 87-unit gap between mark and wordmark.
    d, adv, lsb = outline("hearth", 177.0)
    pad = 24.0
    gap = 87.0
    wx = pad + MW + gap - lsb
    w = wx + adv + pad
    h = MH + 2 * pad
    body = (
        f'<g transform="translate({pad:g},{pad:g})">{mark(ink, ember)}</g>'
        f'<path fill="{word}" transform="translate({wx:g},{pad + 228:g})" d="{d}"/>'
    )
    return doc(w, h, body, bg)


def write(name: str, text: str) -> None:
    with open(os.path.join(OUT, name), "w") as f:
        f.write(text)


if __name__ == "__main__":
    write("hearth-mark.svg", mark_svg(INK, EMBER))
    write("hearth-mark-mono.svg", mark_svg(INK, INK))
    write("hearth-mark-light.svg", mark_svg(DARK_INK, DARK_EMBER))  # for dark backgrounds, transparent
    # Square app icons (avatar / favicon source), padded
    write("hearth-icon.svg", mark_svg(INK, EMBER, IVORY, pad=60, square=True))
    write("hearth-icon-dark.svg", mark_svg(DARK_INK, DARK_EMBER, DARK_BG, pad=60, square=True))
    # Lockups (charcoal mark, terracotta wordmark, as chosen)
    write("hearth-logo.svg", lockup_svg(INK, EMBER, EMBER))
    write("hearth-logo-dark.svg", lockup_svg(DARK_INK, DARK_EMBER, DARK_EMBER))
    write("hearth-logo-mono.svg", lockup_svg(INK, INK, INK))
    print("ok")
