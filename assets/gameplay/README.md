# v0.5.1 gameplay artwork

Independent skins, not a screenshot replacement. All 36 cells, block directions, counters, hit targets and buttons remain real DOM elements.

- `stone-cell.webp`: generated slate tile with chipped, raised bevels; 192×192.
- `block-*.webp`: one generated enamel master, offline color variants; 192×192. Transparent corners and opaque faces, no runtime hue filters.
- `arrow-raised.svg`: independent directional arrow with a shaded extrusion.
- `panel-blue.svg`, `panel-gold.svg`: original metal/chamfered panel and button skins; HTML supplies the labels and counters. `preserveAspectRatio="none"` fills the component instead of letterboxing the artwork.
- `board-frame.svg`: original stone/wood/rivet frame, with an embedded small warm-stone texture. `frame-stone.webp` is its small source tile.
- `wood-plaque.svg`, `crystal-cluster.svg`, `lantern-art.svg`, `reset-raised.svg`, `list-raised.svg`: original vector decorations and icons, no external icon/font licence.
- `miner-bloop.webp`: optimized copy of the existing miner identity, 560×441.
- `crystal-mine.webp`: optimized copy of the existing environment, 768×1152.

Raster masters were generated with the image tool and retained outside the checkout. Stone master: `exec-1e92abd7-1582-409e-8dc9-39b84e1fdd93.png`; block master: `exec-73beaf89-3a1d-457a-9390-898d5e302149.png`. The existing Bloop and mine PNGs remain untouched. Refer to `../LICENSES.md` for provenance/rights limitations.

Optimization used ImageMagick/libwebp: trim transparent master margins, resize tile masters to 192px, strip metadata, WebP method 6 / quality 88. Block master alpha is multiplied by 1.04 before encoding so the face is opaque while antialiased edges/corners remain transparent. Offline hue factors (ImageMagick modulate scale, 100 neutral): red 100, green 172.222, blue 16.667, purple 61.111. Miner uses max 560px / quality 88; environment 768×1152 / quality 82. No optimizer or image library is needed at runtime.

The complete WebP/SVG bundle is 203549 bytes (198.8 KiB); exact file sizes and hashes are in `manifest.json`. Runtime assets are reused/cached across repeated cells/blocks; large original gameplay PNGs are not requested by the game screen. The unchanged main menu still uses its own existing artwork.

WebP requires a supporting browser (including iOS Safari 14+). Physical iPhone/Android and Playwright WebKit remain unverified in this environment; the missing WebKit binary fails explicitly instead of falling back to Chromium. High-contrast mode restores native arrows and control borders. No continuous gameplay animation or blur is added.
