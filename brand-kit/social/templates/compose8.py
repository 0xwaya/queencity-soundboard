"""QCS compose8 — current social poster template (logo + grain + crop-safe pad).

This is a path-relative refactor of the box compose8.py stack:
compose8 (new wordmark logo) + compose7 (vintage/grain) + lib3/helpers.

Usage (from this directory, or with PYTHONPATH set):

    from compose8 import finishv, place_logo, LOGO_AT, done, pad
    from helpers import T, panel, pill, font, fit, OS, W, H

    LOGO_AT["myshow"] = ("stacked", 340, (48, 1868), "lb")
    finishv(base, "myshow", None, None, out_dir)  # writes .png and -padded.png

Default logo placement is the stacked panel lockup in the bottom-left
free column. Art should be 1080x1920 RGBA.
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageFilter
import numpy as np

from helpers import (
    H,
    KIT_ROOT,
    W,
    logo_dir,
    pad,
    paper_fibers,
)

# Current poster logo files (all in brand/logos/current/)
LOGO_FILES = {
    "panel": "qcs-logo-full-panel.png",
    "stacked": "qcs-logo-stacked-panel.png",
    "badge": "qcs-logo-icon-badge.png",
    "full": "qcs-logo-full.png",
    "white": "qcs-logo-full-white.png",
}

_LOGOS: dict[str, Image.Image] | None = None


def load_logos() -> dict[str, Image.Image]:
    global _LOGOS
    if _LOGOS is None:
        d = logo_dir()
        _LOGOS = {k: Image.open(d / f).convert("RGBA") for k, f in LOGO_FILES.items()}
    return _LOGOS


def logo_img(kind: str = "panel", width: int = 360) -> Image.Image:
    L = load_logos()[kind]
    h = round(L.height * width / L.width)
    return L.resize((width, h), Image.LANCZOS)


def place_logo(img, kind="panel", width=360, xy=(60, 60), anchor="la", shadow=True):
    """xy anchor: 'la' top-left, 'lb' bottom-left, 'ra' top-right,
    'rb' bottom-right, 'mb' center-bottom, 'ma' center-top."""
    lg = logo_img(kind, width)
    x, y = xy
    if anchor[0] == "r":
        x -= lg.width
    if anchor[0] == "m":
        x -= lg.width // 2
    if anchor[1] == "b":
        y -= lg.height
    x, y = int(x), int(y)
    if shadow and kind in ("panel", "stacked", "badge"):
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        m = Image.new("RGBA", lg.size, (0, 0, 0, 0))
        m.putalpha(lg.getchannel("A").point(lambda v: int(v * 0.55)))
        sh.alpha_composite(m, (x + 6, y + 10))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(10)))
    img = img.copy()
    img.alpha_composite(lg, (x, y))
    return img


# per-poster logo placement (kind, width, xy, anchor).
# Default: stacked panel in the bottom-left free column.
LOGO_AT: dict[str, tuple] = {}
DEFAULT_LOGO = ("stacked", 340, (48, 1868), "lb")


def grain(base, seed=31):
    """compose8 film grain + paper fiber (applied before the logo so the mark stays crisp)."""
    arr = np.array(base.convert("RGB")).astype(np.float32)
    rng = np.random.default_rng(seed)
    g = rng.normal(0, 3.2, (H, W, 1))
    fib = Image.fromarray((rng.random((H // 4, W // 4)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(
        ImageFilter.GaussianBlur(2)
    )
    fib = (np.array(fib).astype(np.float32) / 255 - 0.5)[..., None] * 7
    return Image.fromarray(np.clip(arr + g + fib, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def light_grain(base):
    """Slightly lighter grain used by later generators; equivalent to paper_fibers mid settings."""
    return paper_fibers(base, seed=31, amt=2.4, fib=5)


def finishv(base, name, bd=None, bxy=None, outd=".", grain_fn=None, overwrite=False):
    """Grain, composite the QCS logo, write flat + padded PNGs.

    bd/bxy are accepted for compatibility with older call sites (the
    vinyl badge is no longer placed on current posters).
    """
    final = (grain_fn or light_grain)(base)
    kind, width, xy, anc = LOGO_AT.get(name, DEFAULT_LOGO)
    final = place_logo(final, kind, width, xy, anc).convert("RGB")
    out = Path(outd)
    out.mkdir(parents=True, exist_ok=True)
    flat = out / f"{name}.png"
    padded = out / f"{name}-padded.png"
    if not overwrite and (flat.exists() or padded.exists()):
        raise FileExistsError(f"exists {name}")
    final.save(flat, optimize=True)
    pad(final).save(padded, optimize=True)
    print("saved", flat, padded)
    return flat, padded


def mp4(padded, out, secs=6):
    """Optional 6s H.264 clip from a padded still (silent AAC). Requires ffmpeg."""
    if os.environ.get("SKIP_MP4") == "1":
        print("skip mp4", out)
        return
    outp = Path(out)
    if outp.exists():
        raise FileExistsError("exists " + str(out))
    cmd = (
        f'ffmpeg -v error -y -loop 1 -framerate 30 -i "{padded}" '
        f"-f lavfi -i anullsrc=r=44100:cl=stereo -t {secs} "
        f"-c:v libx264 -profile:v high -preset slow -crf 18 -pix_fmt yuv420p -r 30 "
        f"-c:a aac -ar 44100 -ac 2 -b:a 128k -shortest -movflags +faststart \"{out}\""
    )
    rc = os.system(cmd)
    print("mp4", out, "rc", rc)


def done(b, name, od, odp, overwrite=False):
    finishv(b, name, None, None, odp, overwrite=overwrite)
    if os.environ.get("SKIP_MP4") != "1":
        mp4(str(Path(odp) / f"{name}-padded.png"), str(Path(od) / f"{name}.mp4"))


if __name__ == "__main__":
    print("compose8 template")
    print("  kit root:", KIT_ROOT)
    print("  logos:   ", logo_dir())
    print("  logo keys:", ", ".join(LOGO_FILES))
    print("  pad:      1080x1920, art 907x1612 at (86, 129), blur 40 @ 55%")
    print("Run make_sample.py to render reduced sample posters.")
