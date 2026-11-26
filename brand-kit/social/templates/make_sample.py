#!/usr/bin/env python3
"""Render 1-2 reduced sample posters that use only brand assets (no artist likeness).

    python3 make_sample.py

Writes social/templates/samples/*.jpg. Requires Pillow, numpy, and Oswald
(see brand/README.md). Set SKIP_MP4=1 is the default here (still images only).
"""
from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("SKIP_MP4", "1")

from PIL import Image, ImageDraw, ImageFilter

from compose8 import LOGO_AT, finishv, place_logo
from helpers import (
    ALF,
    ANT,
    CX,
    H,
    OS,
    T,
    W,
    fit,
    font,
    pad,
    paper_fibers,
    rrect,
    vgrad,
)

HERE = Path(__file__).resolve().parent
SAMPLES = HERE / "samples"
TMP = HERE / "_tmp_full"
NAVY = (11, 13, 31)
CYAN = (0, 229, 255)
MAG = (255, 40, 220)
FUCHSIA = (217, 70, 239)
CREAM = (248, 250, 252)
MUTED = (148, 163, 184)
GOLD = (252, 211, 77)


def save_reduced(src: Path, dest: Path, width=540, quality=82):
    im = Image.open(src).convert("RGB")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
    print("sample", dest, dest.stat().st_size)


def lockup_poster():
    """Midnight canvas with the stacked panel lockup and brand wordmark."""
    b = Image.new("RGBA", (W, H), NAVY + (255,))
    # subtle vertical wash
    b = vgrad(b, 0, 700, 80, 0, col=(0, 40, 80))
    b = vgrad(b, 1200, H, 0, 90, col=(40, 0, 60))
    b = paper_fibers(b, seed=7, amt=3, fib=4)
    # decorative gradient hairline
    dlayer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(dlayer).rectangle([80, 720, W - 80, 724], fill=CYAN + (180,))
    ImageDraw.Draw(dlayer).rectangle([80, 726, W - 80, 728], fill=MAG + (160,))
    b = Image.alpha_composite(b, dlayer)
    s = "QUEEN CITY"
    b = T(b, s, fit(ANT, s, 920, 140), (CX, 200), CREAM + (255,), anchor="mt")
    s = "SOUNDBOARD"
    b = T(b, s, fit(OS, s, 920, 72, "Bold"), (CX, 360), CYAN + (255,), anchor="mt")
    s = "CINCINNATI  +  NORTHERN KENTUCKY"
    b = T(b, s, fit(OS, s, 900, 36, "SemiBold"), (CX, 460), MUTED + (255,), anchor="mt")
    s = "SAMPLE  ·  BRAND LOCKUP"
    b = T(b, s, fit(OS, s, 800, 32, "Bold"), (CX, 1640), GOLD + (255,), anchor="mt")
    s = "TikTok @qcsoundboard"
    b = T(b, s, fit(OS, s, 800, 36, "Medium"), (CX, 1700), CREAM + (255,), anchor="mt")
    LOGO_AT["sample-lockup"] = ("stacked", 520, (CX, 1100), "mm")
    return b


def typographic_poster():
    """Layout demo with a fictional event — no real artist art."""
    INK = (8, 10, 24)
    b = Image.new("RGBA", (W, H), INK + (255,))
    b = vgrad(b, 0, 500, 140, 0, col=(15, 20, 60))
    b = vgrad(b, 1100, H, 0, 200, col=INK)
    b = paper_fibers(b, seed=11, amt=4, fib=6)
    # day banner — left side, leaving the top-right free for the logo
    box = [60, 80, 740, 180]
    b = rrect(b, box, (217, 70, 239, 255), CREAM + (255,), r=40, w=4)
    s = "SAMPLE LAYOUT"
    b = T(b, s, fit(OS, s, 620, 52, "Bold"), (400, 130), CREAM + (255,), anchor="mm")
    s = "RIVER LIGHTS"
    b = T(
        b,
        s,
        fit(ANT, s, 980, 150),
        (CX, 320),
        CREAM + (255,),
        stroke=4,
        sf=INK + (255,),
        anchor="mt",
        shadow=(0, 0, 0, 200),
        soff=(6, 8),
        blur=2,
    )
    s = "A FICTIONAL BILL"
    b = T(b, s, fit(OS, s, 900, 48, "SemiBold"), (CX, 460), CYAN + (255,), anchor="mt")
    box = [60, 1280, 1020, 1840]
    b = rrect(b, box, (248, 250, 252, 245), NAVY + (255,), r=34, w=6)
    s = "SAT, JAN 01  ·  8:00 PM ET"
    b = T(b, s, fit(ALF, s, 880, 72), (CX, 1320), NAVY + (255,), anchor="mt")
    s = "DOORS 7:00 PM  ·  SHOW 8:00 PM  ·  ALL AGES"
    b = T(b, s, fit(OS, s, 880, 36, "Bold"), (CX, 1420), (217, 70, 239, 255), anchor="mt")
    s = "SAMPLE VENUE"
    b = T(b, s, fit(ANT, s, 880, 64), (CX, 1490), NAVY + (255,), anchor="mt")
    s = "CINCINNATI, OH  ·  NOT A REAL EVENT"
    b = T(b, s, fit(OS, s, 880, 34, "SemiBold"), (CX, 1580), (11, 13, 31, 255), anchor="mt")
    s = "For template / layout reference only"
    b = T(b, s, fit(OS, s, 880, 28, "Medium"), (CX, 1720), (70, 80, 110, 255), anchor="mt")
    LOGO_AT["sample-event"] = ("stacked", 220, (W - 40, 40), "ra")
    return b


def main():
    TMP.mkdir(parents=True, exist_ok=True)
    SAMPLES.mkdir(parents=True, exist_ok=True)
    jobs = [("sample-lockup", lockup_poster), ("sample-event", typographic_poster)]
    for name, fn in jobs:
        b = fn()
        flat, padded = finishv(b, name, None, None, TMP, overwrite=True)
        save_reduced(padded, SAMPLES / f"{name}-padded.jpg")
        # don't keep full-res PNGs in the kit
        flat.unlink(missing_ok=True)
        padded.unlink(missing_ok=True)
    try:
        TMP.rmdir()
    except OSError:
        pass


if __name__ == "__main__":
    main()
