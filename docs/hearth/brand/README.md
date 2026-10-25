# hearth brand

The **keyed arch**: two stone jambs and a terracotta keystone, a fireplace
opening with no flame. It reads as built and warm, the centre of a home where
your data lives. The wordmark is lowercase **Fraunces SemiBold**
(9pt optical size, Soft), converted to outlines, so no font is needed.

| | Light backgrounds | Dark backgrounds |
|---|---|---|
| Lockup | `hearth-logo.svg` | `hearth-logo-dark.svg` |
| Mark | `hearth-mark.svg` | `hearth-mark-light.svg` |
| App icon / avatar | `hearth-icon.svg` (+ `-512`/`-192` PNG) | `hearth-icon-dark.svg` (+ `-512` PNG) |
| Single colour | `hearth-logo-mono.svg`, `hearth-mark-mono.svg` | |

Favicons: `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png` (180 px).
The tracker example uses `hearth-icon.svg` as its favicon.

## Palette

| | Light | Dark |
|---|---|---|
| Ink (jambs) | `#2D2B26` charcoal | `#F5F0E6` ivory |
| Ember (keystone, wordmark) | `#BF512D` terracotta | `#E17A52` soft ember |
| Ground | `#F5F0E6` ivory | `#23241F` |

## Rebuilding

`build.py` generates every SVG from the mark geometry and the Fraunces font
(`pip install fonttools`; Fraunces from Google Fonts installed locally). PNGs
are rendered with `rsvg-convert`:

```sh
python docs/hearth/brand/build.py
rsvg-convert -w 512 docs/hearth/brand/hearth-icon.svg -o docs/hearth/brand/hearth-icon-512.png
```

Small sizes: below about 24 px the opening closes up; use the icon (with its
ivory ground and padding) rather than the bare mark for favicons.
