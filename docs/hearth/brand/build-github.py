#!/usr/bin/env python3
"""Build GitHub banners from Hearth's existing logo and Manrope lettering.

Run: uv run --with fonttools python docs/hearth/brand/build-github.py
Then rasterize the SVGs with rsvg-convert as described in README.md.
All text is outlined so GitHub's SVG renderer needs no installed fonts.
"""
from pathlib import Path
import xml.etree.ElementTree as ET

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FONT = ROOT / "site/assets/manrope.ttf"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def text(parent, content, x, y, size, color, weight=500):
    font = instantiateVariableFont(TTFont(FONT), {"wght": weight}, inplace=False)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    units = font["head"].unitsPerEm
    scale = size / units
    cursor = 0
    group = ET.SubElement(parent, f"{{{SVG}}}g", {"transform": f"translate({x},{y}) scale({scale},-{scale})", "fill": color})
    for character in content:
        name = cmap[ord(character)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        path = pen.getCommands()
        if path:
            ET.SubElement(group, f"{{{SVG}}}path", {"transform": f"translate({cursor},0)", "d": path})
        cursor += font["hmtx"][name][0]


def logo(parent, filename, x, y, width):
    source = ET.parse(HERE / filename).getroot()
    source.set("x", str(x))
    source.set("y", str(y))
    source.set("width", str(width))
    source.set("height", str(width * 331 / 1235.28))
    parent.append(source)


def banner(dark=False, social=False):
    width, height = (1280, 640) if social else (1600, 500)
    ground, ink, muted, ember = ("#23241F", "#F5F0E6", "#C7C0B2", "#E17A52") if dark else ("#F5F0E6", "#2D2B26", "#635C50", "#BF512D")
    root = ET.Element(f"{{{SVG}}}svg", {"viewBox": f"0 0 {width} {height}", "width": str(width), "height": str(height), "role": "img", "aria-labelledby": "title description"})
    ET.SubElement(root, f"{{{SVG}}}title", {"id": "title"}).text = "hearth"
    ET.SubElement(root, f"{{{SVG}}}desc", {"id": "description"}).text = "Local-first web apps. Authored in Rust. Server-rendered HTML, generated JavaScript, and a browser-local data layer."
    ET.SubElement(root, f"{{{SVG}}}rect", {"width": str(width), "height": str(height), "fill": ground})
    logo(root, "hearth-logo-dark.svg" if dark else "hearth-logo.svg", 86, 64 if not social else 90, 470 if not social else 540)
    baseline = 285 if not social else 350
    text(root, "Local-first web apps.", 90, baseline, 55 if not social else 57, ink, 600)
    text(root, "Authored in Rust.", 90, baseline + 70, 55 if not social else 57, ember, 600)
    text(root, "Rust views. Generated JavaScript. Data close to the UI.", 92, height - 65, 25 if not social else 23, muted, 450)
    # Reuse the actual mark, not a new interpretation of the logo.
    mark = ET.parse(HERE / ("hearth-mark-light.svg" if dark else "hearth-mark.svg")).getroot()
    mark.set("x", str(width - 330))
    mark.set("y", "115" if not social else "175")
    mark.set("width", "210")
    mark.set("height", "210")
    root.append(mark)
    ET.SubElement(root, f"{{{SVG}}}rect", {"y": str(height - 10), "width": str(width), "height": "10", "fill": ember})
    name = "hearth-social.svg" if social else "hearth-banner-dark.svg" if dark else "hearth-banner.svg"
    ET.ElementTree(root).write(HERE / name, encoding="unicode", xml_declaration=False)
    print(HERE / name)


if __name__ == "__main__":
    banner()
    banner(dark=True)
    banner(social=True)
