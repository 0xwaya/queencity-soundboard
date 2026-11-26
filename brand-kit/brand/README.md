# Queen City Soundboard brand guide

Assets and rules for Queen City Soundboard (QCS) only.

## Handles

| Channel | Handle / URL |
| --- | --- |
| Website | queencitysoundboard.com |
| TikTok | @qcsoundboard |
| Instagram | @qc.soundboard |

(Matches `apps/web/src/lib/site.ts`.)

## Logo variants

All paths are relative to this folder (`brand/`). The poster compositor (`../social/templates/compose8.py`) loads its five logos from `logos/current/`.

### `logos/current/` (use these)

| File | Size | What it is | Use it for |
| --- | --- | --- | --- |
| `qcs-logo-stacked-panel.png` | 1588x985, transparent | Stacked lockup (icon over wordmark) on a rounded navy panel with a gradient outline | Default on posters (`stacked` in compose8). Safe on any artwork, light or dark. |
| `qcs-logo-full-panel.png` | 2340x912, transparent | Horizontal lockup on the same navy panel | Posters or banners with room for a wide mark (`panel` in compose8). Safe on any background. |
| `qcs-logo-full.png` | 2414x1006, transparent | Horizontal lockup, white wordmark with glowing gradient bars, no panel | Only on dark, calm backgrounds. The white wordmark disappears on light art; use a panel version there (see the bottom tile of `preview-sheet.jpg`). |
| `qcs-logo-stacked.png` | 1508x925, transparent | Stacked lockup, no panel | Same rule as `qcs-logo-full.png`: dark backgrounds only. |
| `qcs-logo-full-white.png` | 2173x601, transparent | One-color white horizontal lockup | Solid color or photo backgrounds where the gradient bars would clash (the preview shows it on orange). Needs enough contrast for white. |
| `qcs-logo-icon.png` | 824x912, transparent | Five-bar soundwave icon only, glowing gradient | Decorative or secondary use on dark backgrounds. Not a stand-alone identifier for small sizes. |
| `qcs-logo-icon-badge.png` | 972x972, transparent | Soundwave icon in a round navy badge | Avatars, stickers, small square or round placements, the `badge` option in compose8. |
| `qcs-logo-source.jpg` | 1500x844, opaque | Original source artwork on near-black | Reference and re-cutting only. Do not place it on designs. |
| `preview-sheet.jpg` | 2200x1500 | Contact sheet of the variants above plus two example posters | Quick visual reference. |

Rule of thumb: on posters use a `-panel` variant; reach for the panel-less or white variants only when you control the background.

### `logos/legacy/` (do not use on new work)

| File | What it is |
| --- | --- |
| `badge-vinyl.png` | Old red vinyl-record badge, 205x205. No longer placed on current posters (see `finishv` in `compose8.py`). |
| `og-image.jpg` | Earlier 1200x630 Open Graph image. The live one is `apps/web/public/og-image.png`. |

### `logos/site/` (older kit copies, not what the site serves)

`favicon.png` (640x432), `favicon-32.png` (32x21) and `qcs-logo.png` (1024x659, the five bars alone in a flat cyan-to-pink gradient) share names with files in `apps/web/public/`, but they are different artwork: the kit copies are not square or are a different crop. The versions the website serves are the `apps/web/public/` ones. Treat these as archive; do not use them as favicons.

### Already in the app (not duplicated here)

These were byte-identical to files in `apps/web/public/`, so they are referenced instead of copied. Edit or replace them there.

| Asset | Path in repo |
| --- | --- |
| Crown mark (PNG, SVG) | `apps/web/public/qcs-crown.png`, `apps/web/public/qcs-crown.svg` |
| Square letter mark (SVG) | `apps/web/public/qcs-mark.svg` |
| Animated logo (GIF, MP4, PNG poster frame) | `apps/web/public/qcs-logo-animated.gif`, `.mp4`, `.png` |
| Cincinnati skyline at night (photo) | `apps/web/public/cincinnati-skyline-night.jpg` |

`apps/web/public/` also holds the live favicons, `og-image.png`, `og-lockup.png`, `qcs-lockup.png`, `qcs-mark.png` and `social/` (avatar, covers, share images).

## Colors

Hex values below come from code or files in this repo, not from memory. "Sampled" means read from logo pixels and is approximate.

### Poster palette (`../social/templates/make_sample.py`)

| Name in code | RGB | Hex | Role in the template |
| --- | --- | --- | --- |
| `NAVY` | 11, 13, 31 | `#0B0D1F` | Midnight canvas, dark text on cream cards. Matches the logo panel navy. |
| `INK` | 8, 10, 24 | `#080A18` | Deepest background on the event layout. |
| `CYAN` | 0, 229, 255 | `#00E5FF` | Primary accent, subtitles, hairline. |
| `MAG` | 255, 40, 220 | `#FF28DC` | Secondary accent, hairline. |
| `FUCHSIA` | 217, 70, 239 | `#D946EF` | Banners, doors/show line. Same value as the site accent. |
| `CREAM` | 248, 250, 252 | `#F8FAFC` | Headline text, info cards. Same as site text color. |
| `MUTED` | 148, 163, 184 | `#94A3B8` | Secondary text. Same as site muted text. |
| `GOLD` | 252, 211, 77 | `#FCD34D` | Highlight label. |

### Website tokens (`apps/web/src/app/globals.css`)

| Token | Hex |
| --- | --- |
| `--background` | `#07090F` |
| `--foreground` | `#E2E8F0` |
| `--qcs-surface` | `#0B1228` |
| `--qcs-surface-soft` | `#0C142A` |
| `--qcs-accent` | `#D946EF` |
| `--qcs-accent-2` | `#22D3EE` |
| `--qcs-text` | `#F8FAFC` |
| `--qcs-text-muted` | `#94A3B8` |

### Logo files

| Source | Colors |
| --- | --- |
| `apps/web/public/qcs-crown.svg` (gradient stops) | `#FBBF24`, `#F472B6`, `#22D3EE`; accents `#FDE68A`, `#FBCFE8`, `#BAE6FD`; tile `#0B1024` |
| `apps/web/public/qcs-mark.svg` | tile `#0B1228`, left letterform `#E2E8F0`, right letterform `#F0ABFC` |
| `logos/current/qcs-logo-icon.png` (sampled, left to right across the bars) | about `#09EEFF` cyan, `#2BB0FF` blue, `#975BFF` violet, `#F524FF` magenta |
| `logos/current/*-panel.png` (sampled) | panel navy about `#0B0D23` to `#0F122B`, darkest about `#070816` |

In short: near-black navy backgrounds, a cyan-to-magenta gradient for the soundwave mark, cream text, and fuchsia/cyan accents. Posters themselves are free to use any palette that suits the act; the logo panel carries the brand.

## Fonts

No font files are committed. Fonts are named here so they can be installed from Google Fonts.

| Where | Fonts |
| --- | --- |
| Website | Bebas Neue (loaded with `next/font/google` in `apps/web/src/app/layout.tsx`, used for display headings in `globals.css`); body stack is `Inter, Arial, Helvetica, sans-serif` |
| Sample poster template (`make_sample.py`) | Anton, Oswald (variable; Bold, SemiBold and Medium instances), Alfa Slab One |
| Poster helpers (`helpers.py` has a name alias for each) | Oswald, Bowlby One, Chango, Alfa Slab One, Shrikhand, Rye, Anton, Righteous, Graduate, Pirata One, Cinzel Decorative, Sancreek, Monoton, Rubik Glitch, Bungee (Regular, Shade, Outline), UnifrakturMaguntia, Metal Mania, Special Elite, Creepster, Permanent Marker, Bangers, Ultra, Fascinate (and Inline), Titan One, Diplomata SC, Lobster, Lobster Two, Abril Fatface, Pacifico, Concert One, Black Ops One, Fredericka the Great, Trade Winds, Ewert, Bebas Neue |

License notes:

- Everything above is distributed through Google Fonts. Oswald, Anton, Alfa Slab One and Bebas Neue are published under the SIL Open Font License 1.1 (checked in the `ofl/` directories of the `google/fonts` repository). Most of the others are also OFL, but a few Google Fonts families use Apache 2.0 (for example Permanent Marker and Special Elite), so check each family's license page before redistributing anything.
- OFL and Apache fonts can generally be redistributed, but they have not been bundled here to keep the repo small and license-simple.
- To render posters, install the families locally or point `QCS_FONTS` at a folder of `.ttf` files (see `../social/README.md`). `helpers.py` also looks in `brand/fonts/`, which is git-ignored.
