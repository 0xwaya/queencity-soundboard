# Queen City Soundboard social playbook

Rules for posting Queen City Soundboard (QCS) content. Handles: TikTok @qcsoundboard, Instagram @qc.soundboard. Brand assets and colors are in [`../brand/README.md`](../brand/README.md).

## What is in this folder

| Path | Contents |
| --- | --- |
| `examples/` | Three finished 1080x1920-style posters (JPG). Layout and caption references only; the dates are past events. |
| `templates/compose8.py`, `templates/helpers.py` | The poster compositor: film grain, QCS logo placement, crop-safe TikTok padding. |
| `templates/make_sample.py` | Renders two reduced sample posters (brand lockup, fictional event layout) into `templates/samples/`. |
| `templates/requirements.txt` | Python dependencies (Pillow, numpy). |
| `templates/samples/` | Output of `make_sample.py`, committed as a quick visual check. |

## Posting rules

### What and how often

- Post to TikTok daily about upcoming Cincinnati and Northern Kentucky events.
- Maximum 3 posters per day.
- Priority when choosing which events to post: music > comedy > arts > sports.
- Every Bengals game gets a post, and that post is animated.

### Art

- Art is rich AI-generated art themed by the band or genre: genre, era, album or tour art, and signature imagery.
- No default guitars or instruments as the main subject. At most one guitar per day.
- Do not repeat the central subject of the previous 2 days' posts.
- Never code-drawn art. The templates only add type, the logo, grain and padding on top of generated art; they do not draw the artwork.
- Keep the platform's AI-generated label on for every post.

Note: `examples/2026-11-27-marionmeadows-jazz.jpg` has a saxophone as its main subject. Use it for layout and caption reference, not as the art direction to copy.

### Caption template

```
THIS FRIDAY: <Act>
📍 <Venue>, <Address>
🗓 <Day>, <Mon DD> · <time> ET (doors … / show …)
🎟 Tickets at the link in bio
More Cincy + NKY shows on Queen City Soundboard
<5–7 broad hashtags>
Ref: qcs-tt-YYYYMMDD-<slug>
```

Example (from `examples/2026-11-27-marionmeadows-jazz.jpg`):

```
THIS FRIDAY: Marion Meadows
📍 Ludlow Garage, 342 Ludlow Ave, Cincinnati, OH 45220
🗓 Fri, Nov 27 · 7:30 PM ET (doors 6:00 PM / show 7:30 PM)
🎟 Tickets at the link in bio
More Cincy + NKY shows on Queen City Soundboard
#LiveMusic #Jazz #CincinnatiEvents #NKY #CincyNightlife #ThingsToDoCincinnati
Ref: qcs-tt-20261127-marionmeadows
```

Hashtags:

- Use 5 to 7 broad hashtags per post.
- Never use #QueenCitySoundboard.

### Stories and Instagram Reels

- Stories and IG Reels are posted by hand from a story kit zip (MP4s plus `captions.txt`).
- Automation never posts stories.
- Story kit zips are not committed to this repo (`*.zip` is git-ignored here).

### Account safety

- Never delete, repost, or edit existing posts.
- Never follow or unfollow accounts.
- Never change account settings.

## Using the poster templates

The templates need Python 3.10 or newer, and the poster fonts installed locally (fonts are not bundled; see the font list and license notes in `../brand/README.md`). `make_sample.py` needs Oswald, Anton and Alfa Slab One.

```bash
cd brand-kit/social/templates
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt

# Tell the helpers where the .ttf files are (or install the fonts system-wide)
export QCS_FONTS=~/fonts
```

Check the setup (prints the kit root, logo folder and logo keys, renders nothing):

```bash
python3 compose8.py
```

Render the two sample posters. This overwrites `templates/samples/*.jpg` with reduced 540px-wide JPEGs and does not make MP4s:

```bash
python3 make_sample.py
```

Compose a real poster from your own 1080x1920 RGBA art. Run it from `templates/`, or put that folder on `PYTHONPATH`:

```python
from PIL import Image
from compose8 import LOGO_AT, finishv

art = Image.open("art.png").convert("RGBA").resize((1080, 1920))
# Optional per-poster logo placement: (kind, width, (x, y), anchor)
# kind: panel | stacked | badge | full | white   anchor: la ra lb rb mb ma mm
LOGO_AT["myshow"] = ("stacked", 340, (48, 1868), "lb")
finishv(art, "myshow", None, None, "out")   # writes out/myshow.png and out/myshow-padded.png
```

`finishv` adds grain, composites the logo and writes a flat PNG plus a crop-safe padded PNG (art scaled to 907x1612 on a blurred, darkened copy of itself). It refuses to overwrite existing files unless `overwrite=True`. If `LOGO_AT` has no entry the logo defaults to the stacked panel, bottom-left. Use `compose8.done(...)` to also make a 6-second MP4 from the padded still; that needs a system `ffmpeg`, and setting `SKIP_MP4=1` skips it.

Environment variables read by the templates: `QCS_FONTS` (font folder), `QCS_LOGOS` (alternate logo folder, default `../../brand/logos/current`), `SKIP_MP4`. Keep rendered output, fonts and story zips out of git; `brand-kit/.gitignore` covers `social/out/`, `social/stories/`, font files and zips.

The templates are standalone Python scripts. They are outside `apps/web`, so they are not part of the app build, ESLint, TypeScript or Vitest runs.
