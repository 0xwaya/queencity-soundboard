"""QCS poster helpers — path-relative, no secrets.

Refactored from the box compose6/lib3/helpers_src pipeline so the
current compose8 poster template can run from this repo subtree.

Fonts are NOT bundled (see brand/README.md). Set QCS_FONTS to a
directory of .ttf files, or install the Google Fonts listed there.
"""
from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1920
CX = 540

# 1080x1920 padded frame used on every @qcsoundboard poster (compose8):
# artwork is scaled to 907x1612 and placed at (86, 129) on a blur-40
# copy of itself darkened to 55% brightness.
PAD_SIZE = (907, 1612)
PAD_XY = (86, 129)
PAD_BLUR = 40
PAD_BRIGHTNESS = 0.55

KIT_ROOT = Path(__file__).resolve().parents[2]


def _env_path(name: str) -> Path | None:
    v = os.environ.get(name)
    return Path(v).expanduser() if v else None


def logo_dir() -> Path:
    return _env_path("QCS_LOGOS") or (KIT_ROOT / "brand" / "logos" / "current")


def font_dirs() -> list[Path]:
    dirs: list[Path] = []
    env = _env_path("QCS_FONTS")
    if env:
        dirs.append(env)
    dirs.extend(
        [
            KIT_ROOT / "brand" / "fonts",
            Path("/workspace/fonts"),
            Path("/usr/share/fonts/truetype/sand-box/google"),
            Path("/usr/share/fonts/truetype"),
            Path("/usr/share/fonts"),
        ]
    )
    # unique, existing only
    out, seen = [], set()
    for d in dirs:
        try:
            r = d.resolve()
        except OSError:
            continue
        if r.is_dir() and r not in seen:
            out.append(r)
            seen.add(r)
    return out


_FONT_ALIASES = {
    "Oswald[wght].ttf": ["Oswald%5Bwght%5D.ttf", "Oswald-VariableFont_wght.ttf"],
    "Oswald%5Bwght%5D.ttf": ["Oswald[wght].ttf", "Oswald-VariableFont_wght.ttf"],
    "Cinzel[wght].ttf": ["Cinzel%5Bwght%5D.ttf", "Cinzel-VariableFont_wght.ttf"],
    "Cinzel%5Bwght%5D.ttf": ["Cinzel[wght].ttf", "Cinzel-VariableFont_wght.ttf"],
    "Exo2[wght].ttf": ["Exo2%5Bwght%5D.ttf", "Exo2-VariableFont_wght.ttf"],
}


def resolve_font(name: str) -> Path:
    """Find a font file by the names used in the QCS generators."""
    candidates = [name]
    candidates.extend(_FONT_ALIASES.get(name, []))
    # decoded / encoded bracket variants
    if "%5B" in name:
        candidates.append(name.replace("%5B", "[").replace("%5D", "]"))
    if "[" in name:
        candidates.append(name.replace("[", "%5B").replace("]", "%5D"))
    stems = {Path(c).stem.lower().replace("%5bwght%5d", "").replace("[wght]", "") for c in candidates}
    family_guess = Path(name).stem.split("-")[0].split("%")[0].split("[")[0].strip()

    for d in font_dirs():
        for c in candidates:
            p = d / c
            if p.is_file():
                return p
        # Google Fonts folder layout: <Family>/<File>.ttf
        fam = d / family_guess
        if fam.is_dir():
            for c in candidates:
                p = fam / c
                if p.is_file():
                    return p
            for p in fam.glob("*.ttf"):
                if p.stem.lower().startswith(family_guess.lower()):
                    return p
    # last resort: recursive match on stem
    for d in font_dirs():
        try:
            for p in d.rglob("*.ttf"):
                if p.stem.lower() in {s.lower() for s in [Path(c).stem for c in candidates]}:
                    return p
                if family_guess and family_guess.lower() in p.stem.lower() and "italic" not in p.stem.lower():
                    return p
        except OSError:
            continue
    raise FileNotFoundError(
        f"Font not found: {name}. Install the Google Font listed in brand/README.md "
        "or set QCS_FONTS to a directory that contains it."
    )


def font(name: str, size: int, var: str | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(resolve_font(name)), size)
    if var:
        f.set_variation_by_name(var)
    return f


# Short names used by the current generators
OS = "Oswald%5Bwght%5D.ttf"
BOW = "BowlbyOne-Regular.ttf"
CHG = "Chango-Regular.ttf"
ALF = "AlfaSlabOne-Regular.ttf"
SHR = "Shrikhand-Regular.ttf"
RYE = "Rye-Regular.ttf"
ANT = "Anton-Regular.ttf"
RGT = "Righteous-Regular.ttf"
GRD = "Graduate-Regular.ttf"
PIR = "PirataOne-Regular.ttf"
CDB = "CinzelDecorative-Bold.ttf"
SAN = "Sancreek-Regular.ttf"
MON = "Monoton-Regular.ttf"
GLI = "RubikGlitch-Regular.ttf"
BUN = "Bungee-Regular.ttf"
BSH = "BungeeShade-Regular.ttf"
BOL = "BungeeOutline-Regular.ttf"
UFM = "UnifrakturMaguntia-Regular.ttf"
MET = "MetalMania-Regular.ttf"
SEL = "SpecialElite-Regular.ttf"
CRE = "Creepster-Regular.ttf"
PMK = "PermanentMarker-Regular.ttf"
BAN = "Bangers-Regular.ttf"
ULTRA = "Ultra-Regular.ttf"
FAS = "Fascinate-Regular.ttf"
FASI = "FascinateInline-Regular.ttf"
TIT = "TitanOne-Regular.ttf"
DIP = "DiplomataSC-Regular.ttf"
LOB = "Lobster-Regular.ttf"
LO2 = "LobsterTwo-Regular.ttf"
ABR = "AbrilFatface-Regular.ttf"
PAC = "Pacifico-Regular.ttf"
CON = "ConcertOne-Regular.ttf"
BLK = "BlackOpsOne-Regular.ttf"
FRED = "FrederickatheGreat-Regular.ttf"
TRADE = "TradeWinds-Regular.ttf"
EWE = "Ewert-Regular.ttf"
CIN = "CinzelDecorative-Bold.ttf"
BEBAS = "BebasNeue-Regular.ttf"


def text_layer(
    txt,
    f,
    fill,
    center_x,
    y,
    shadow=(0, 0, 0),
    glow=None,
    glow_r=14,
    stroke=0,
    stroke_fill=None,
    tracking=0,
    anchor="mt",
):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)

    def draw(dd, col, sw=0, sf=None):
        if tracking:
            widths = [dd.textlength(c, font=f) for c in txt]
            tot = sum(widths) + tracking * (len(txt) - 1)
            x = center_x - tot / 2
            for c, w_ in zip(txt, widths):
                dd.text(
                    (x, y + f.getmetrics()[0]) if anchor == "mt" else (x, y),
                    c,
                    font=f,
                    fill=col,
                    anchor="ls" if anchor == "mt" else anchor,
                    stroke_width=sw,
                    stroke_fill=sf,
                )
                x += w_ + tracking
        else:
            dd.text((center_x, y), txt, font=f, fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=sf)

    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if glow:
        g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw(ImageDraw.Draw(g), glow, stroke + 6, glow)
        g = g.filter(ImageFilter.GaussianBlur(glow_r))
        out = Image.alpha_composite(out, g)
        out = Image.alpha_composite(out, g)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw(ImageDraw.Draw(s), shadow + (230,), stroke + 3, shadow + (230,))
    s = s.filter(ImageFilter.GaussianBlur(6))
    s = ImageChops.offset(s, 4, 6)
    out = Image.alpha_composite(out, s)
    draw(d, fill, stroke, stroke_fill)
    out = Image.alpha_composite(out, lay)
    return out


def gradient_text(txt, f, cx, y, top, bot, stroke=0, stroke_fill=None, glow=None, glow_r=18):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).text((cx, y), txt, font=f, fill=255, anchor="mt")
    bbox = m.getbbox()
    g = Image.new("RGBA", (W, H))
    gd = ImageDraw.Draw(g)
    y0, y1 = bbox[1], bbox[3]
    for yy in range(H):
        t = min(1, max(0, (yy - y0) / max(1, y1 - y0)))
        c = tuple(int(top[i] * (1 - t) + bot[i] * t) for i in range(3))
        gd.line([(0, yy), (W, yy)], fill=c + (255,))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if glow:
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(gl).text((cx, y), txt, font=f, fill=glow, anchor="mt", stroke_width=stroke + 8, stroke_fill=glow)
        gl = gl.filter(ImageFilter.GaussianBlur(glow_r))
        out = Image.alpha_composite(out, gl)
        out = Image.alpha_composite(out, gl)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text(
        (cx, y), txt, font=f, fill=(0, 0, 0, 240), anchor="mt", stroke_width=stroke + 4, stroke_fill=(0, 0, 0, 240)
    )
    sh = ImageChops.offset(sh.filter(ImageFilter.GaussianBlur(5)), 5, 8)
    out = Image.alpha_composite(out, sh)
    if stroke:
        st = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(st).text((cx, y), txt, font=f, fill=stroke_fill, anchor="mt", stroke_width=stroke, stroke_fill=stroke_fill)
        out = Image.alpha_composite(out, st)
    g.putalpha(m)
    out = Image.alpha_composite(out, g)
    return out, bbox


def fit(fontname, txt, maxw, size, var=None):
    while True:
        f = font(fontname, size, var)
        if ImageDraw.Draw(Image.new("L", (1, 1))).textlength(txt, font=f) <= maxw or size < 20:
            return f
        size -= 2


def T(base, txt, f, xy, fill, stroke=0, sf=None, shadow=None, soff=(6, 8), anchor="la", blur=0):
    if shadow:
        s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(s).text(
            (xy[0] + soff[0], xy[1] + soff[1]), txt, font=f, fill=shadow, anchor=anchor, stroke_width=stroke, stroke_fill=shadow
        )
        if blur:
            s = s.filter(ImageFilter.GaussianBlur(blur))
        base = Image.alpha_composite(base, s)
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(l).text(xy, txt, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=sf)
    return Image.alpha_composite(base, l)


def panel(base, box, fill, outline=None, r=36, w=5):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(l).rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=w)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([box[0] + 8, box[1] + 12, box[2] + 8, box[3] + 12], radius=r, fill=(0, 0, 0, 90))
    base = Image.alpha_composite(base, sh.filter(ImageFilter.GaussianBlur(10)))
    return Image.alpha_composite(base, l)


def pill(base, txt, x, y, fill, line, txtcol, anchor_left=True):
    f = font(OS, 46, "Bold")
    tr = 14
    w = sum(f.getlength(c) for c in txt) + tr * (len(txt) - 1)
    x0 = x if anchor_left else x - w / 2 - 34
    base = panel(base, [x0, y, x0 + w + 68, y + 72], fill, line, r=36, w=4)
    cx = x0 + 34
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(l)
    for c in txt:
        d.text((cx, y + 36), c, font=f, fill=txtcol, anchor="lm")
        cx += f.getlength(c) + tr
    return Image.alpha_composite(base, l)


def pillw(txt):
    return sum(font(OS, 46, "Bold").getlength(c) for c in txt) + 14 * (len(txt) - 1) + 68


def load(p, bright=1.0):
    a = Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS)
    a = ImageEnhance.Color(a).enhance(1.12)
    if bright != 1.0:
        a = ImageEnhance.Brightness(a).enhance(bright)
    return a.convert("RGBA")


def vintage_art(a):
    """Warm inks + light halftone on the art layer only (text stays crisp)."""
    arr = np.array(a.convert("RGB")).astype(np.float32)
    arr = arr * np.array([1.03, 1.0, 0.94]) + np.array([4, 2, -2])
    lum = arr.mean(2) / 255.0
    yy, xx = np.mgrid[0:H, 0:W]
    c, s = np.cos(np.pi / 4), np.sin(np.pi / 4)
    u = (xx * c - yy * s) / 7.0
    v = (xx * s + yy * c) / 7.0
    d = np.sqrt((u - np.round(u)) ** 2 + (v - np.round(v)) ** 2)
    dot = (d < (0.55 * (1 - lum)) ** 0.5 * 0.62).astype(np.float32)
    arr = arr * (1 - 0.07 * dot[..., None])
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def loadv(p):
    return vintage_art(load(p).convert("RGB"))


def load_art(path):
    return Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS).convert("RGBA")


def misreg(im, dx=2, dy=1):
    r, g, b, a = im.convert("RGBA").split()
    r = ImageChops.offset(r, dx, 0)
    b = ImageChops.offset(b, -dx, dy)
    return Image.merge("RGBA", (r, g, b, a))


def halftone(im, cell=6, strength=0.16):
    arr = np.array(im.convert("RGB")).astype(np.float32)
    lum = arr.mean(2) / 255.0
    yy, xx = np.mgrid[0:H, 0:W]
    c, s = np.cos(np.pi / 4), np.sin(np.pi / 4)
    u = (xx * c - yy * s) / cell
    v = (xx * s + yy * c) / cell
    d = np.sqrt((u - np.round(u)) ** 2 + (v - np.round(v)) ** 2)
    dot = (d < (0.55 * (1 - lum)) ** 0.5 * 0.72).astype(np.float32)
    arr = arr * (1 - strength * dot[..., None])
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def paper_fibers(im, seed=31, amt=9, fib=10):
    arr = np.array(im.convert("RGB")).astype(np.float32)
    rng = np.random.default_rng(seed)
    g = rng.normal(0, amt, (H, W, 1))
    fimg = Image.fromarray((rng.random((H // 3, W // 3)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(
        ImageFilter.GaussianBlur(1.6)
    )
    f = (np.array(fimg).astype(np.float32) / 255 - 0.5)[..., None] * fib
    return Image.fromarray(np.clip(arr + g + f, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def worn_edge(im, dark=(40, 28, 18), margin=36, seed=11):
    rng = np.random.default_rng(seed)
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    d.rectangle([0, 0, W, H], fill=255)
    d.rectangle([margin, margin, W - margin, H - margin], fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(18))
    noise = Image.fromarray(rng.integers(0, 80, (H, W), dtype=np.uint8), "L").filter(ImageFilter.GaussianBlur(3))
    m = np.clip(np.array(mask).astype(np.int16) + np.array(noise).astype(np.int16) // 3, 0, 255).astype(np.uint8)
    overlay = Image.new("RGBA", (W, H), dark + (255,))
    overlay.putalpha(Image.fromarray((m * 0.55).astype(np.uint8), "L"))
    return Image.alpha_composite(im.convert("RGBA"), overlay)


def crease(im, y=960, strength=28):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(l)
    for i, a in enumerate((40, 70, 40)):
        d.line([(0, y - 4 + i * 4), (W, y - 2 + i * 4)], fill=(255, 255, 255, a // 2), width=1)
        d.line([(0, y + 2 + i * 3), (W, y + 6 + i * 3)], fill=(0, 0, 0, a), width=1)
    return Image.alpha_composite(im, l.filter(ImageFilter.GaussianBlur(1)))


def vgrad(base, y0, y1, a0, a1, col=(0, 0, 0)):
    l = np.zeros((H, W, 4), np.uint8)
    l[..., :3] = col
    for y in range(max(0, y0), min(H, y1)):
        l[y, :, 3] = int(a0 + (a1 - a0) * (y - y0) / (y1 - y0))
    return Image.alpha_composite(base, Image.fromarray(l, "RGBA"))


def solid(base, y0, y1, col, a=255):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(l).rectangle([0, y0, W, y1], fill=col + (a,))
    return Image.alpha_composite(base, l)


def poly(base, pts, fill, outline=None, w=4, shadow=True):
    if shadow:
        s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(s).polygon([(x + 7, y + 11) for x, y in pts], fill=(0, 0, 0, 120))
        base = Image.alpha_composite(base, s.filter(ImageFilter.GaussianBlur(8)))
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(l)
    d.polygon(pts, fill=fill)
    if outline:
        d.line(pts + [pts[0]], fill=outline, width=w, joint="curve")
    return Image.alpha_composite(base, l)


def rrect(base, box, fill, outline=None, r=24, w=5):
    return panel(base, box, fill, outline, r=r, w=w)


def hline(base, x0, x1, y, col, w=3):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(l).line([(x0, y), (x1, y)], fill=col, width=w)
    return Image.alpha_composite(base, l)


def metal_text(base, txt, f, cx, y, top, bot, stroke=6, sf=(0, 0, 0), glow=None):
    out, bb = gradient_text(txt, f, cx, y, top, bot, stroke=stroke, stroke_fill=sf + (255,), glow=glow)
    return Image.alpha_composite(base, out), bb


def divider(y, half, col):
    l = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(l)
    d.line([(CX - half, y), (CX - 22, y)], fill=col + (230,), width=3)
    d.line([(CX + 22, y), (CX + half, y)], fill=col + (230,), width=3)
    d.polygon([(CX, y - 12), (CX + 12, y), (CX, y + 12), (CX - 12, y)], fill=col + (255,))
    for sx in (-1, 1):
        d.ellipse([CX + sx * half - 6, y - 6, CX + sx * half + 6, y + 6], fill=col + (255,))
    return l


def pad(final: Image.Image) -> Image.Image:
    """Crop-safe TikTok padding (compose8 standard)."""
    bg = ImageEnhance.Brightness(final.filter(ImageFilter.GaussianBlur(PAD_BLUR))).enhance(PAD_BRIGHTNESS)
    bg.paste(final.resize(PAD_SIZE, Image.LANCZOS), PAD_XY)
    return bg
