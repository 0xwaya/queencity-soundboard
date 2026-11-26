#!/usr/bin/env python3
"""
QCS social planner (TikTok @qcsoundboard only).

Builds the daily poster plan documented in brand-kit/social/README.md:
which upcoming Cincinnati / NKY events get a TikTok poster, the exact
caption for each, and an art brief that follows the art rules.

This script never posts, opens, or logs into any account. It only reads
event data and prints a plan (a dry run by design). A human or a separate
poster step publishes from that plan. Instagram, Facebook and stories are
hard-disabled below; IG Stories/Reels are posted by hand from a story-kit zip.

Usage:
    python3 tools/social_agent.py plan                      # events from Supabase, 2 days ahead
    python3 tools/social_agent.py plan --events-file e.json # offline / test data
    python3 tools/social_agent.py record-posted REF --subject "rain-lit skyline"
    python3 tools/social_agent.py check-caption REF posted.txt

Environment (no secrets are stored in this file):
    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY   event source for `plan`
    QCS_LEDGER_PATH   posted ledger, default ~/.qcs/social_ledger.json (outside the repo; never commit it)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Callable
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

# ---------------------------------------------------------------------------
# Channels: TikTok @qcsoundboard is the only automated channel.
# The flags below are hard-off. This script has no Instagram/Facebook posting
# code; the flags and require_channel() exist so none can be added by accident.
# ---------------------------------------------------------------------------
TIKTOK_HANDLE = "@qcsoundboard"
INSTAGRAM_AUTOMATION_ENABLED = False  # PAUSED. IG (@qc.soundboard) is posted by hand.
FACEBOOK_ENABLED = False  # Facebook is not used.
STORIES_AUTOMATION_ENABLED = False  # Never post stories automatically.
AUTOMATED_CHANNELS = frozenset({"tiktok"})

# Playbook rules
POSTS_PER_DAY_MAX = 3
DAYS_AHEAD_DEFAULT = 2
HASHTAGS_MIN, HASHTAGS_MAX = 5, 7
FORBIDDEN_HASHTAG_KEYS = frozenset({"queencitysoundboard"})
RECENT_SUBJECT_DAYS = 2
GUITARS_PER_DAY_MAX = 1
AI_LABEL_REQUIRED = True  # keep the platform's AI-generated content label on

PRIORITY = {"music": 0, "comedy": 1, "arts": 2, "sports": 3}
MUSIC_CATEGORIES = {
    "country", "alternative", "rock", "hiphop", "pop", "rnb",
    "latin", "edm", "jazz", "folk", "metal", "festival",
}
SPORTS_CATEGORIES = {"sports"}
# Everything else (community, other) is treated as arts.

ESPN_BENGALS_SCHEDULE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/cin/schedule"

CAPTION_TEMPLATE = (
    "THIS {day}: {act}\n"
    "📍 {venue}, {address}\n"
    "🗓 {weekday}, {mon} {dd} · {time} ET (doors {doors} / show {show})\n"
    "🎟 Tickets at the link in bio\n"
    "More Cincy + NKY shows on Queen City Soundboard\n"
    "{hashtags}\n"
    "Ref: {ref}"
)

BASE_HASHTAGS = ["#cincinnati", "#cincy", "#nky"]
GENRE_HASHTAGS = {
    "country": ["#country", "#livemusic"],
    "alternative": ["#alternative", "#livemusic"],
    "rock": ["#rock", "#livemusic"],
    "hiphop": ["#hiphop", "#livemusic"],
    "pop": ["#pop", "#livemusic"],
    "rnb": ["#rnb", "#livemusic"],
    "latin": ["#latinmusic", "#livemusic"],
    "edm": ["#edm", "#livemusic"],
    "jazz": ["#jazz", "#livemusic"],
    "folk": ["#folk", "#livemusic"],
    "metal": ["#metal", "#livemusic"],
    "festival": ["#festival", "#livemusic"],
    "comedy": ["#comedy", "#standup"],
    "community": ["#thingstodo", "#localevents"],
    "other": ["#thingstodo", "#localevents"],
    "sports": ["#bengals", "#whodey"],
}
HASHTAG_PAD_POOL = ["#thingstodo", "#livemusic", "#cincinnatievents", "#weekendplans"]

# Non-instrument central subjects by genre: era, album/tour art, signature imagery.
SUBJECT_POOL = {
    "country": ["harvest moon over a barn and fireflies", "dusty highway at golden hour", "whiskey-lit honky-tonk neon"],
    "alternative": ["overgrown brick alley in a thunderstorm", "polaroid collage of a night drive", "glitching neon orchid"],
    "rock": ["lightning over a stadium crowd", "cracked-asphalt highway with a burning sunset", "chrome skull in a smoke haze"],
    "hiphop": ["gold-chain skyline at midnight", "graffiti-covered subway mural", "crown of light above a city block"],
    "pop": ["pastel disco-ball galaxy", "glittering confetti burst", "retro-futurist sunset grid"],
    "rnb": ["velvet-curtain lounge in violet haze", "rain-streaked window with city bokeh", "rose petals on a mirrored floor"],
    "latin": ["carnival of papel picado and sunset color", "tropical night market lights", "dancing flames and marigolds"],
    "edm": ["laser cathedral over a riverfront", "neon wireframe tunnel", "bioluminescent crowd silhouette"],
    "jazz": ["smoke-ribbon lounge by a rain-lit window", "art deco skyline in sepia gold", "blue-note moonlit rooftop"],
    "folk": ["lantern-lit forest clearing", "patchwork quilt landscape at dusk", "river mist and old stone bridge"],
    "metal": ["storm-torn gothic cathedral", "molten forge sparks", "raven-crowned mountain ruins"],
    "festival": ["sunset field of string lights", "hot-air balloons over the river", "sea of flags and confetti"],
    "comedy": ["spotlit brick wall and a lone stool", "retro marquee bulbs", "pop-art speech bubbles"],
    "community": ["mural-covered street in warm light", "paper lanterns over a plaza", "hands-in-clay studio still life"],
    "other": ["mural-covered street in warm light", "paper lanterns over a plaza", "hands-in-clay studio still life"],
    "sports": ["tiger-striped helmet bursting from smoke", "stadium floodlights in orange haze", "Who Dey fireworks over the river"],
}
INSTRUMENT_WORDS = (
    "guitar", "bass guitar", "drum", "saxophone", "sax", "piano", "keyboard", "violin",
    "fiddle", "trumpet", "banjo", "microphone", "mic stand", "cello", "synth",
)

DEFAULT_LEDGER = Path("~/.qcs/social_ledger.json")


class ChannelDisabledError(RuntimeError):
    pass


class TruncatedCaptionError(RuntimeError):
    """A posted caption came back shorter than intended; carries the full caption."""

    def __init__(self, ref: str, full_caption: str, posted: str):
        super().__init__(f"Posted caption for {ref} is truncated. Stop and fix it by hand.")
        self.ref = ref
        self.full_caption = full_caption
        self.posted = posted


def require_channel(channel: str) -> None:
    """Refuse anything but TikTok. Instagram/Facebook/stories are off by policy."""
    c = channel.strip().lower()
    off = {
        "instagram": INSTAGRAM_AUTOMATION_ENABLED,
        "ig": INSTAGRAM_AUTOMATION_ENABLED,
        "facebook": FACEBOOK_ENABLED,
        "fb": FACEBOOK_ENABLED,
        "story": STORIES_AUTOMATION_ENABLED,
        "stories": STORIES_AUTOMATION_ENABLED,
        "reel": STORIES_AUTOMATION_ENABLED,
        "reels": STORIES_AUTOMATION_ENABLED,
    }
    if c in off and not off[c]:
        raise ChannelDisabledError(f"{channel} automation is disabled. Post by hand (see brand-kit/social/README.md).")
    if c not in AUTOMATED_CHANNELS:
        raise ChannelDisabledError(f"{channel} is not an automated channel. Only TikTok {TIKTOK_HANDLE} is.")


# ---------------------------------------------------------------------------
# Hashtags and captions
# ---------------------------------------------------------------------------
def _tag_key(tag: str) -> str:
    return re.sub(r"[^a-z0-9]", "", tag.lower())


def sanitize_hashtags(tags: list[str], category: str = "other") -> list[str]:
    """Drop forbidden/duplicate tags, then trim or pad to 5-7 broad hashtags."""
    out: list[str] = []
    seen: set[str] = set()

    def add(tag: str) -> None:
        tag = "#" + tag.strip().lstrip("#").replace(" ", "")
        key = _tag_key(tag)
        if len(key) == 0 or key in FORBIDDEN_HASHTAG_KEYS or key in seen:
            return
        seen.add(key)
        out.append(tag)

    for t in tags:
        add(t)
    for t in BASE_HASHTAGS + GENRE_HASHTAGS.get(category, []) + HASHTAG_PAD_POOL:
        if len(out) >= HASHTAGS_MIN:
            break
        add(t)
    return out[:HASHTAGS_MAX]


def strip_forbidden_hashtags(text: str) -> str:
    """Remove #QueenCitySoundboard (any case) from free text, e.g. a generated caption."""
    cleaned = re.sub(r"#\s?queen\s?city\s?soundboard\b", "", text, flags=re.IGNORECASE)
    return re.sub(r"[ \t]+\n", "\n", re.sub(r"[ \t]{2,}", " ", cleaned)).strip()


def default_hashtags(category: str) -> list[str]:
    return sanitize_hashtags(BASE_HASHTAGS + GENRE_HASHTAGS.get(category, []), category)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def make_ref(event_day: dt.date, act: str) -> str:
    return f"qcs-tt-{event_day:%Y%m%d}-{slugify(act)}"


def _fmt_time(t: dt.datetime) -> str:
    return t.strftime("%I:%M %p").lstrip("0")


_DOORS_RE = re.compile(r"doors?\s*(?:open\s*)?(?:at\s*)?(\d{1,2}(?::\d{2})?)\s*([ap])\.?m", re.IGNORECASE)


def parse_doors(description: str | None) -> str | None:
    """Doors time only when the event text states it with am/pm; never guessed."""
    if not description:
        return None
    m = _DOORS_RE.search(description)
    if not m:
        return None
    hm, ap = m.group(1), m.group(2).upper()
    if ":" not in hm:
        hm += ":00"
    return f"{hm} {ap}M"


def build_caption(event: dict[str, Any], start: dt.datetime) -> tuple[str, list[str]]:
    """Return (caption, needs_review notes). Caption follows the playbook template exactly."""
    notes: list[str] = []
    act = (event.get("artist_name") or event.get("title") or "").strip()
    venue_obj = event.get("venues") or {}
    venue = (venue_obj.get("name") or "").strip()
    address = ", ".join(p for p in [(venue_obj.get("address") or "").strip(), (venue_obj.get("city") or "").strip(),
                                    (venue_obj.get("state") or "").strip()] if p)
    if not venue:
        notes.append("venue missing")
    if not address:
        notes.append("address missing")
    doors = event.get("doors_time") or parse_doors(event.get("description"))
    if not doors:
        doors = "TBA"
        notes.append("doors time unknown: confirm with the venue before posting")
    category = event.get("category") or "other"
    tags = sanitize_hashtags(event.get("hashtags") or default_hashtags(category), category)
    caption = CAPTION_TEMPLATE.format(
        day=start.strftime("%A").upper(),
        act=act,
        venue=venue or "TBA",
        address=address or "TBA",
        weekday=start.strftime("%a"),
        mon=start.strftime("%b"),
        dd=start.strftime("%d"),
        time=_fmt_time(start),
        doors=doors,
        show=_fmt_time(start),
        hashtags=" ".join(tags),
        ref=make_ref(start.date(), act),
    )
    return strip_forbidden_hashtags(caption), notes


def validate_caption(caption: str) -> list[str]:
    """Playbook checks for a finished caption. Empty list means it passes."""
    problems: list[str] = []
    lines = caption.split("\n")
    if len(lines) != 7:
        problems.append(f"expected 7 lines, got {len(lines)}")
        return problems
    if not re.match(r"^THIS [A-Z]+: .+", lines[0]):
        problems.append("line 1 must be 'THIS <DAY>: <Act>'")
    if not lines[1].startswith("📍 "):
        problems.append("line 2 must start with 📍")
    if not re.match(r"^🗓 \w{3}, \w{3} \d{2} · \d{1,2}:\d{2} [AP]M ET \(doors .+ / show .+\)$", lines[2]):
        problems.append("line 3 must be '🗓 <Day>, <Mon DD> · <time> ET (doors … / show …)'")
    if lines[3] != "🎟 Tickets at the link in bio":
        problems.append("line 4 must be the tickets line")
    if lines[4] != "More Cincy + NKY shows on Queen City Soundboard":
        problems.append("line 5 must be the 'More Cincy + NKY shows' line")
    tags = lines[5].split()
    if not all(t.startswith("#") for t in tags) or not (HASHTAGS_MIN <= len(tags) <= HASHTAGS_MAX):
        problems.append(f"line 6 must be {HASHTAGS_MIN}-{HASHTAGS_MAX} hashtags")
    if any(_tag_key(t) in FORBIDDEN_HASHTAG_KEYS for t in tags) or re.search(
        r"#\s?queen\s?city\s?soundboard", caption, re.IGNORECASE
    ):
        problems.append("#QueenCitySoundboard is forbidden")
    if not re.match(r"^Ref: qcs-tt-\d{8}-[a-z0-9]+$", lines[6]):
        problems.append("line 7 must be 'Ref: qcs-tt-YYYYMMDD-<slug>'")
    return problems


# ---------------------------------------------------------------------------
# Posted ledger (kept outside git; prevents duplicate posts)
# ---------------------------------------------------------------------------
class Ledger:
    def __init__(self, path: Path | str | None = None):
        self.path = Path(path or os.getenv("QCS_LEDGER_PATH") or DEFAULT_LEDGER).expanduser()
        self.posted: dict[str, dict[str, Any]] = {}
        if self.path.exists():
            self.posted = json.loads(self.path.read_text()).get("posted", {})

    def has(self, ref: str) -> bool:
        return ref in self.posted

    def posted_on(self, day: dt.date) -> list[dict[str, Any]]:
        return [v for v in self.posted.values() if v.get("posted_on") == day.isoformat()]

    def recent_subjects(self, today: dt.date, days: int = RECENT_SUBJECT_DAYS) -> set[str]:
        keys = {(today - dt.timedelta(days=i)).isoformat() for i in range(1, days + 1)}
        return {v["central_subject"].lower() for v in self.posted.values()
                if v.get("posted_on") in keys and v.get("central_subject")}

    def record(self, ref: str, posted_on: dt.date, central_subject: str = "", guitar: bool = False) -> None:
        self.posted[ref] = {"posted_on": posted_on.isoformat(), "central_subject": central_subject, "guitar": guitar}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps({"posted": self.posted}, indent=2))


# ---------------------------------------------------------------------------
# Art rules
# ---------------------------------------------------------------------------
def validate_art(subject: str, today_subjects: list[str], recent_subjects: set[str],
                 allow_instrument: bool = False) -> list[str]:
    """Check a proposed central subject against the art rules."""
    problems: list[str] = []
    s = subject.lower()
    if s in recent_subjects:
        problems.append("repeats a central subject from the previous 2 days")
    if s in {x.lower() for x in today_subjects}:
        problems.append("repeats another poster's subject today")
    has_instrument = any(w in s for w in INSTRUMENT_WORDS)
    if has_instrument and not allow_instrument:
        problems.append("instrument as main subject is not the default")
    if "guitar" in s and sum("guitar" in x.lower() for x in today_subjects) >= GUITARS_PER_DAY_MAX:
        problems.append("at most one guitar per day")
    return problems


def pick_subject(category: str, today_subjects: list[str], recent: set[str]) -> str:
    for cand in SUBJECT_POOL.get(category, SUBJECT_POOL["other"]):
        if not validate_art(cand, today_subjects, recent):
            return cand
    return ""  # nothing safe in the pool: leave blank for a human to choose


def art_brief(act: str, category: str, subject: str) -> str:
    return (
        f"Rich AI-generated poster art for {act} ({category}). Theme it by the band/genre: genre, era, "
        f"album or tour art, signature imagery. Central subject: {subject or 'TBD (human to choose)'}. "
        "No guitar or other instrument as the main subject. Vertical 1080x1920, leave the bottom-left "
        "column free for the logo. Art must be AI-generated, never drawn in code; type, logo, grain and "
        "padding are added with brand-kit/social/templates/compose8.py. Keep the AI-generated label on."
    )


# ---------------------------------------------------------------------------
# Event selection
# ---------------------------------------------------------------------------
def tier(event: dict[str, Any]) -> str:
    cat = event.get("category") or "other"
    if cat == "comedy":
        return "comedy"
    if cat in MUSIC_CATEGORIES:
        return "music"
    if cat in SPORTS_CATEGORIES:
        return "sports"
    return "arts"


def is_bengals(event: dict[str, Any]) -> bool:
    text = f"{event.get('title', '')} {event.get('artist_name', '')}".lower()
    return "bengals" in text


def _start_et(event: dict[str, Any]) -> dt.datetime:
    return dt.datetime.fromisoformat(str(event["event_date"]).replace("Z", "+00:00")).astimezone(ET)


def select_events(events: list[dict[str, Any]], event_day: dt.date, slots: int) -> list[dict[str, Any]]:
    """Published events on event_day; Bengals first (every game gets a post), then music > comedy > arts > sports."""
    day = [e for e in events if e.get("status", "published") == "published" and _start_et(e).date() == event_day]
    day.sort(key=lambda e: (not is_bengals(e), PRIORITY[tier(e)], _start_et(e), (e.get("artist_name") or "").lower()))
    seen: set[str] = set()
    picked: list[dict[str, Any]] = []
    for e in day:
        key = make_ref(event_day, e.get("artist_name") or e.get("title") or "")
        if key in seen:
            continue
        seen.add(key)
        picked.append(e)
    return picked[: max(0, slots)]


def build_plan(events: list[dict[str, Any]], today: dt.date, days_ahead: int = DAYS_AHEAD_DEFAULT,
               ledger: Ledger | None = None) -> dict[str, Any]:
    require_channel("tiktok")
    ledger = ledger or Ledger()
    event_day = today + dt.timedelta(days=days_ahead)
    already_today = len(ledger.posted_on(today))
    slots = POSTS_PER_DAY_MAX - already_today
    recent = ledger.recent_subjects(today)
    todays_subjects = [v.get("central_subject", "") for v in ledger.posted_on(today)]
    guitars_today = sum(bool(v.get("guitar")) for v in ledger.posted_on(today))

    posts: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    for e in select_events(events, event_day, len(events)):
        start = _start_et(e)
        act = (e.get("artist_name") or e.get("title") or "").strip()
        ref = make_ref(start.date(), act)
        if ledger.has(ref):
            skipped.append({"ref": ref, "reason": "already posted (ledger)"})
            continue
        if len(posts) >= max(0, slots):
            skipped.append({"ref": ref, "reason": "daily cap reached"})
            continue
        caption, notes = build_caption(e, start)
        category = e.get("category") or "other"
        subject = pick_subject(category, todays_subjects, recent)
        if not subject:
            notes.append("no safe art subject in pool: choose a central subject by hand")
        else:
            todays_subjects.append(subject)
        posts.append({
            "channel": "tiktok",
            "ref": ref,
            "act": act,
            "tier": tier(e),
            "animated": is_bengals(e),
            "caption": caption,
            "caption_problems": validate_caption(caption),
            "art_brief": art_brief(act, category, subject),
            "central_subject": subject,
            "uses_guitar": False,
            "ai_generated_label": AI_LABEL_REQUIRED,
            "needs_review": notes,
        })
    return {
        "dry_run": True,
        "channel": "tiktok",
        "handle": TIKTOK_HANDLE,
        "plan_date": today.isoformat(),
        "event_day": event_day.isoformat(),
        "slots_left_today": max(0, slots),
        "guitars_used_today": guitars_today,
        "posts": posts,
        "skipped": skipped,
        "reminders": [
            "Instagram automation is paused; IG Stories/Reels are posted by hand from the story kit zip.",
            "Never delete, repost or edit existing posts; never follow/unfollow; never change account settings.",
            "If a posted caption comes back truncated, stop and fix it by hand (check-caption).",
        ],
    }


# ---------------------------------------------------------------------------
# Truncated caption check
# ---------------------------------------------------------------------------
def check_posted_caption(ref: str, intended: str, posted: str) -> None:
    """Raise TruncatedCaptionError (with the full caption) if the posted text lost any of the caption."""
    norm = lambda s: re.sub(r"\s+", " ", s).strip()  # noqa: E731
    if norm(posted) != norm(intended):
        raise TruncatedCaptionError(ref, intended, posted)


# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------
def fetch_events(day: dt.date) -> list[dict[str, Any]]:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise SystemExit("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or pass --events-file.")
    import requests  # imported lazily so the rule checks and tests need no dependencies

    lo = dt.datetime.combine(day, dt.time.min, tzinfo=ET).astimezone(dt.timezone.utc)
    hi = lo + dt.timedelta(days=1)
    params = {
        "select": "title,artist_name,description,event_date,category,status,ticket_url,venues(name,address,city,state)",
        "status": "eq.published",
        "and": f"(event_date.gte.{lo.isoformat()},event_date.lt.{hi.isoformat()})",
        "order": "event_date.asc",
    }
    r = requests.get(
        f"{url.rstrip('/')}/rest/v1/events",
        params=params,
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def bengals_games(day: dt.date, get_json: Callable[[str], Any] | None = None) -> list[dict[str, Any]]:
    """Bengals games on `day` from ESPN's public schedule, as event dicts. Fails soft (returns [])."""
    try:
        if get_json is None:
            import requests

            get_json = lambda u: requests.get(u, timeout=20).json()  # noqa: E731
        data = get_json(ESPN_BENGALS_SCHEDULE)
    except Exception:
        return []
    out = []
    for g in (data or {}).get("events", []):
        try:
            start = dt.datetime.fromisoformat(g["date"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        if start.astimezone(ET).date() != day:
            continue
        venue = ((g.get("competitions") or [{}])[0]).get("venue") or {}
        addr = venue.get("address") or {}
        out.append({
            "title": g.get("name", "Cincinnati Bengals"),
            "artist_name": g.get("name", "Cincinnati Bengals"),
            "event_date": start.isoformat(),
            "category": "sports",
            "status": "published",
            "venues": {"name": venue.get("fullName"), "address": None,
                       "city": addr.get("city"), "state": addr.get("state")},
        })
    return out


def with_bengals(events: list[dict[str, Any]], day: dt.date) -> list[dict[str, Any]]:
    """Add Bengals games that are missing from the event list so every game gets a post."""
    if any(is_bengals(e) and _start_et(e).date() == day for e in events):
        return events
    return events + bengals_games(day)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _today_et() -> dt.date:
    return dt.datetime.now(ET).date()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="QCS TikTok planner (dry run; never posts).")
    sub = p.add_subparsers(dest="cmd", required=True)

    pl = sub.add_parser("plan", help="print the daily poster plan")
    pl.add_argument("--date", type=dt.date.fromisoformat, default=None, help="plan day (default: today, ET)")
    pl.add_argument("--days-ahead", type=int, default=DAYS_AHEAD_DEFAULT)
    pl.add_argument("--events-file", type=Path, help="JSON list of events instead of Supabase")
    pl.add_argument("--out", type=Path, help="write the plan here (keep it out of git)")

    rp = sub.add_parser("record-posted", help="record a post you have verified in the ledger")
    rp.add_argument("ref")
    rp.add_argument("--subject", default="")
    rp.add_argument("--guitar", action="store_true")
    rp.add_argument("--posted-on", type=dt.date.fromisoformat, default=None)

    cc = sub.add_parser("check-caption", help="compare a posted caption with the plan's caption")
    cc.add_argument("ref")
    cc.add_argument("posted_file", type=Path)
    cc.add_argument("--intended-file", type=Path, required=True, help="the caption from the plan, as text")

    args = p.parse_args(argv)

    if args.cmd == "plan":
        today = args.date or _today_et()
        day = today + dt.timedelta(days=args.days_ahead)
        events = json.loads(args.events_file.read_text()) if args.events_file else fetch_events(day)
        plan = build_plan(with_bengals(events, day), today, args.days_ahead)
        text = json.dumps(plan, indent=2, ensure_ascii=False)
        if args.out:
            args.out.write_text(text)
            print(f"Wrote {args.out}")
        else:
            print(text)
        return 0

    if args.cmd == "record-posted":
        Ledger().record(args.ref, args.posted_on or _today_et(), args.subject, args.guitar)
        print(f"Recorded {args.ref}")
        return 0

    if args.cmd == "check-caption":
        intended = args.intended_file.read_text()
        try:
            check_posted_caption(args.ref, intended, args.posted_file.read_text())
        except TruncatedCaptionError as e:
            print(f"STOP: {e}\nFull caption to paste by hand:\n\n{e.full_caption}", file=sys.stderr)
            return 2
        print("Caption matches.")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
